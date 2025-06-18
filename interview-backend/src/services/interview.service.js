const InterviewTemplate = require('../models/interviewTemplate.model');
const InterviewSession = require('../models/interviewSession.model');
const InterviewResponse = require('../models/interviewResponse.model');
const InterviewReport = require('../models/interviewReport.model');
const User = require('../models/user.model');
const { generateInterviewFromJD, processAnswer, generateFinalReport } = require('../controllers/aiController');
const { AppError } = require('../middleware/errorHandler');

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
    if (!session || session.status !== 'in_progress') {
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
    const responses = await InterviewResponse.find({ session: sessionId });
    if (responses.length === 0) {
        throw new AppError(400, 'Cannot generate a report for an interview with no responses.');
    }
    const overallScore = responses.reduce((acc, r) => acc + (r.aiScore), 0) / responses.length;
    const aiSummary = await generateFinalReport(responses);
    
    const report = await InterviewReport.create({
        session: sessionId,
        overallScore: overallScore.toFixed(2),
        strengths: aiSummary.strengths,
        areasForImprovement: aiSummary.areasForImprovement,
        recommendation: aiSummary.recommendation,
        detailedAnalysis: responses.map(r => ({ questionId: r.question, score: r.aiScore, feedback: r.aiFeedback }))
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

module.exports = {
    createSessionFromTemplate,
    submitResponse,
    finalizeAndGenerateReport,
    getSessionResponses,
};