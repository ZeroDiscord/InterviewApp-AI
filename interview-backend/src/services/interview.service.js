const InterviewTemplate = require('../models/interviewTemplate.model');
const InterviewSession = require('../models/interviewSession.model');
const InterviewResponse = require('../models/interviewResponse.model');
const InterviewReport = require('../models/interviewReport.model');
const User = require('../models/user.model');
const { generateInterviewFromJD, processAnswer, generateFinalReport } = require('../controllers/aiController');
const { AppError } = require('../middleware/errorHandler');
const { sendReportEmail, sendDecisionEmail } = require('../utils/mail');

const createSessionFromTemplate = async ({ templateId, candidateId, interviewerId, scheduledAt }) => {
    const template = await InterviewTemplate.findById(templateId);
    if (!template) {
        throw new AppError(404, 'Interview template not found.');
    }
    const candidate = await User.findById(candidateId);
    if (!candidate || candidate.role !== 'candidate') {
        throw new AppError(404, 'A valid candidate could not be found for the provided ID.');
    }
    const generatedQuestions = await generateInterviewFromJD(template.jobDescription, template.numberOfQuestions);
    if (!generatedQuestions || generatedQuestions.length === 0) {
        throw new AppError(500, 'AI failed to generate questions for the interview.');
    }
    const session = new InterviewSession({
        template: templateId,
        candidate: candidateId,
        interviewer: interviewerId,
        scheduledAt: scheduledAt || new Date(),
        questions: generatedQuestions,
        status: 'scheduled'
    });
    await session.save();
    console.log(`New interview session created with ID: ${session._id}`);
    return session;
};

const submitResponse = async ({ sessionId, questionId, userId, responseData }) => {
    const session = await InterviewSession.findById(sessionId);
    if (!session || !['in_progress'].includes(session.status)) {
        throw new AppError(404, 'Active interview session not found or not in progress.');
    }
    if (session.candidate.toString() !== userId.toString()) {
        throw new AppError(403, 'You are not authorized to submit a response for this interview.');
    }
    const questionDetails = session.questions.find(q => q._id.toString() === questionId);
    if (!questionDetails) {
        throw new AppError(404, 'Question not found in this interview session.');
    }
    const aiEvaluation = await processAnswer(responseData.transcribedText, questionDetails);
    const interviewResponse = await InterviewResponse.create({
        session: sessionId,
        question: questionId,
        audioFileUrl: responseData.audioFileUrl,
        transcribedText: responseData.transcribedText,
        responseDurationSeconds: responseData.duration,
        aiScore: aiEvaluation.finalWeightedScore,
        aiFeedback: `Mentioned: ${aiEvaluation.detailedAnalysis.feedbackFromAI.conceptsMentioned.join(', ') || 'None'}. Missed: ${aiEvaluation.detailedAnalysis.feedbackFromAI.conceptsMissed.join(', ') || 'None'}.`,
        keywordsMatched: aiEvaluation.detailedAnalysis.feedbackFromAI.conceptsMentioned,
    });
    session.currentQuestionIndex += 1;
    const responsePayload = {
        evaluation: aiEvaluation,
        responseId: interviewResponse._id,
        nextStep: {}
    };
    if (session.currentQuestionIndex >= session.questions.length) {
        session.status = 'completed';
        session.completedAt = new Date();
        responsePayload.nextStep = { status: 'interview_finished' };
    } else {
        const nextQuestion = session.questions[session.currentQuestionIndex];
        responsePayload.nextStep = {
            status: 'next_question',
            question: { _id: nextQuestion._id, questionText: nextQuestion.questionText, questionType: nextQuestion.questionType, timeLimitSeconds: nextQuestion.timeLimitSeconds }
        };
    }
    await session.save();
    return responsePayload;
};

const finalizeAndGenerateReport = async (sessionId) => {
    const responses = await InterviewResponse.find({ session: sessionId }).populate('question');
    if (responses.length === 0) {
        throw new AppError(400, 'Cannot generate a report for an interview with no responses.');
    }

    const enrichedResponses = responses.map(r => ({
        ...r.toObject(),
        questionText: r.question.questionText // Ensure question text is available
    }));

    const overallScore = enrichedResponses.reduce((acc, r) => acc + (r.aiScore || 0), 0) / enrichedResponses.length;
    
    // Get the full, detailed report from the AI
    const aiReportData = await generateFinalReport(enrichedResponses);

    // Fetch session for proctoring analytics
    const session = await InterviewSession.findById(sessionId);
    
    // The skillsDistribution for the radar chart needs to be a Map
    const skillsDistribution = new Map(
        aiReportData.detailedAnalysis.map(item => [item.skill, item.score])
    );

    // Create and save the report using data from the AI
    const report = await InterviewReport.create({
        session: sessionId,
        overallScore,
        recommendation: aiReportData.recommendation,
        strengths: aiReportData.strengths,
        areasForImprovement: aiReportData.areasForImprovement,
        skillScores: aiReportData.skillScores,
        detailedAnalysis: aiReportData.detailedAnalysis,
        skillsDistribution, // Use the converted Map
        interviewSummary: aiReportData.interviewSummary,
        feedback: aiReportData.feedback,
        recommendations: aiReportData.recommendations,
        warningCount: session.warningCount || 0,
        proctoringInfractions: session.proctoringInfractions || [],
        proctoringEventLog: session.proctoringEventLog || [],
        terminationReason: session.terminationReason || null,
    });
    return report;
};

/**
 * NEW: Fetches all individual responses for a given session with pagination.
 * @param {string} sessionId - The ID of the session.
 * @param {number} page - The page number for pagination.
 * @param {number} limit - The number of responses per page.
 * @returns {Promise<object>} An object containing the paginated responses and metadata.
 */
const getSessionResponses = async (sessionId, page, limit) => {
    const skip = (page - 1) * limit;

    // Find the session to get access to the original question texts
    const session = await InterviewSession.findById(sessionId).lean();
    if (!session) {
        throw new AppError(404, 'Interview session not found.');
    }

    const total = await InterviewResponse.countDocuments({ session: sessionId });
    const responses = await InterviewResponse.find({ session: sessionId })
        .sort({ createdAt: 1 }) // Sort by the order they were answered
        .skip(skip)
        .limit(limit)
        .lean();

    // Enrich each response with the corresponding question text
    const enrichedResponses = responses.map(response => {
        const question = session.questions.find(q => q._id.toString() === response.question.toString());
        return {
            ...response,
            questionText: question ? question.questionText : 'Question not found'
        };
    });

    return {
        responses: enrichedResponses,
        pagination: {
            page,
            totalPages: Math.ceil(total / limit),
            totalRecords: total
        }
    };
};

const markSessionCompletedOrTerminated = async ({ sessionId, terminated, terminationReason, proctoringInfractions, warningCount, proctoringEventLog }) => {
    const session = await InterviewSession.findById(sessionId);
    if (!session) throw new AppError(404, 'Interview session not found.');
    if (terminated) {
        session.status = 'terminated';
        session.terminationReason = terminationReason || 'Terminated by proctoring.';
        session.completedAt = new Date();
    } else {
        session.status = 'completed';
        session.completedAt = new Date();
    }
    if (Array.isArray(proctoringInfractions)) session.proctoringInfractions = proctoringInfractions;
    if (typeof warningCount === 'number') session.warningCount = Math.min(warningCount, 3);
    if (Array.isArray(proctoringEventLog)) session.proctoringEventLog = proctoringEventLog;
    await session.save();
    if (session.status === 'completed') {
        // Generate the final report
        await finalizeAndGenerateReport(sessionId);

        // Notify the recruiter
        await session.populate('candidate interviewer');
        if (session.interviewer && session.interviewer.email) {
            const reportLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reports/${sessionId}`;
            await sendReportEmail(session.interviewer.email, reportLink, session.candidate.firstName);
        }
    }
    return session;
};

const submitDecision = async ({ sessionId, decision, comments, adminId }) => {
    if (!['approved', 'rejected'].includes(decision)) {
        throw new AppError(400, 'Decision must be either "approved" or "rejected".');
    }

    const session = await InterviewSession.findById(sessionId).populate('candidate');
    if (!session) {
        throw new AppError(404, 'Interview session not found.');
    }

    if (session.decision) {
        throw new AppError(400, 'A decision has already been made for this session.');
    }

    session.decision = {
        status: decision,
        comments: comments,
        decidedBy: adminId,
        decidedAt: new Date(),
    };

    await session.save();

    // Send notification email to the candidate
    if (session.candidate && session.candidate.email) {
        await sendDecisionEmail(
            session.candidate.email,
            decision,
            comments,
            session.candidate.firstName
        );
    }

    return session;
};

module.exports = {
    createSessionFromTemplate,
    submitResponse,
    finalizeAndGenerateReport,
    getSessionResponses,
    markSessionCompletedOrTerminated,
    submitDecision,
};