const interviewService = require('../services/interview.service.js');
const { transcribeAudio } = require('../services/transcription.service');
const AppError = require('../utils/AppError');
const InterviewSession = require('../models/interviewSession.model.js');
const User = require('../models/user.model.js');
const { sendInviteEmail, sendDecisionEmail } = require('../utils/mail');


const createSession = async (req, res) => {
    const { templateId, candidateId, scheduledAt } = req.body;
    const interviewerId = req.user._id;

    if (!templateId || !candidateId) {
        throw new AppError(400, 'Template ID and Candidate ID are required.');
    }

    const sessionData = { templateId, candidateId, interviewerId, scheduledAt };
    const newSession = await interviewService.createSessionFromTemplate(sessionData);

    // Send invitation email to the candidate
    const candidate = await User.findById(candidateId);
    if (candidate) {
        const interviewLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/instructions/${newSession.uniqueLink}`;
        await sendInviteEmail(candidate.email, interviewLink, candidate.firstName);
    }

    res.status(201).json({
        success: true,
        message: 'Interview session created successfully.',
        data: newSession,
    });
};

// Helper to check if session is completed/terminated
const checkSessionActive = (session) => {
    if (!session) throw new AppError(404, 'Interview session not found.');
    if (['completed', 'terminated'].includes(session.status)) {
        throw new AppError(403, 'This interview session is already completed or terminated.');
    }
};

const getSessionByLink = async (req, res) => {
    const { uniqueLink } = req.params;
    
    const session = await InterviewSession.findOne({ uniqueLink })
        .populate('template', 'title description durationMinutes')
        .populate('candidate', 'firstName lastName email');

    if (!session) {
        throw new AppError(404, 'Interview session not found. Please check your link.');
    }
    if (session.candidate._id.toString() !== req.user._id.toString()) {
        throw new AppError(403, 'You are not authorized to start this interview session.');
    }
    checkSessionActive(session);

    if (session.status === 'scheduled') {
        session.status = 'in_progress';
        session.startedAt = new Date();
        await session.save();
    }

    const questionsForCandidate = session.questions.map(q => ({
        _id: q._id,
        questionText: q.questionText,
        questionType: q.questionType,
        difficulty: q.difficulty,
        timeLimitSeconds: q.timeLimitSeconds
    }));

    const responsePayload = {
        _id: session._id,
        template: session.template,
        candidate: session.candidate,
        status: session.status,
        questions: questionsForCandidate,
        currentQuestionIndex: session.currentQuestionIndex,
    };

    res.status(200).json({ success: true, data: responsePayload });
};

const submitResponse = async (req, res) => {
    const { sessionId } = req.params;
    const { questionId, transcribedText, audioFileUrl, duration } = req.body;
    const userId = req.user._id;
    const session = await InterviewSession.findById(sessionId);
    checkSessionActive(session);

    if (!questionId || !transcribedText || !audioFileUrl) {
        throw new AppError(400, 'questionId, transcribedText, and audioFileUrl are required.');
    }

    const responseData = { transcribedText, audioFileUrl, duration };
    const result = await interviewService.submitResponse({ sessionId, questionId, userId, responseData });

    res.status(200).json({ success: true, data: result });
};


const transcribeResponse = async (req, res) => {
    if (!req.file) {
        throw new AppError(400, 'No audio file was uploaded.');
    }
    const transcribedText = await transcribeAudio(req.file.path);
    const audioUrl = `/uploads/${req.file.filename}`;
    res.status(200).json({
        success: true,
        transcription: transcribedText,
        audioFileUrl: audioUrl,
    });
};

const getMySessions = async (req, res) => {
    const sessions = await InterviewSession.find({ candidate: req.user._id })
      .populate('template', 'title description')
      .sort({ scheduledAt: -1 });

    res.status(200).json({
        success: true,
        count: sessions.length,
        data: sessions,
    });
};

const getCompletedSessions = async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 5;
    const skip = (page - 1) * limit;

    const total = await InterviewSession.countDocuments({ status: 'completed' });
    const sessions = await InterviewSession.find({ status: 'completed' })
        .populate('candidate', 'firstName lastName email')
        .populate('template', 'title')
        .sort({ completedAt: -1 })
        .skip(skip)
        .limit(limit);

    res.status(200).json({
        success: true,
        count: sessions.length,
        pagination: {
            page,
            totalPages: Math.ceil(total / limit),
            totalRecords: total
        },
        data: sessions,
    });
};

/**
 * NEW: Get full session details for an admin/interviewer view.
 * @desc    Get a single interview session's full data, including answers.
 * @route   GET /api/interview/sessions/:sessionId/details
 * @access  Private (Admin, Interviewer, HR Manager)
 */
const getSessionDetailsForAdmin = async (req, res) => {
    const { sessionId } = req.params;
    const session = await InterviewSession.findById(sessionId)
        .populate('template')
        .populate('candidate');
    if (!session) {
        throw new AppError(404, 'Session not found.');
    }
    res.status(200).json({
        success: true,
        data: session,
    });
};

// Add endpoint to mark session as completed/terminated from proctoring backend
const markSessionCompletedOrTerminated = async (req, res) => {
    const { sessionId } = req.params;
    const { terminated, terminationReason, proctoringInfractions, warningCount, proctoringEventLog } = req.body;
    const session = await interviewService.markSessionCompletedOrTerminated({ sessionId, terminated, terminationReason, proctoringInfractions, warningCount, proctoringEventLog });
    res.status(200).json({ success: true, data: session });
};

const submitDecision = async (req, res) => {
    const { sessionId } = req.params;
    const { decision, comments } = req.body;
    const adminId = req.user._id; // The admin/recruiter making the decision

    // The service will handle validation, DB updates, and sending the email.
    const updatedSession = await interviewService.submitDecision({
        sessionId,
        decision,
        comments,
        adminId,
    });

    res.status(200).json({
        success: true,
        message: `Session has been marked as ${decision}.`,
        data: updatedSession,
    });
};

module.exports = {
    createSession,
    getSessionByLink,
    submitResponse,
    transcribeResponse,
    getMySessions,
    getCompletedSessions,
    getSessionDetailsForAdmin,
    markSessionCompletedOrTerminated,
    submitDecision,
};