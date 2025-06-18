const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const asyncHandler = require('../middleware/asyncHandler');
const interviewService = require('../services/interview.service');
const InterviewReport = require('../models/interviewReport.model');
const { AppError } = require('../middleware/errorHandler');

/**
 * @desc    Generate the final report for a completed interview
 * @route   POST /api/reports/:sessionId
 * @access  Private
 */
router.post('/:sessionId', protect, asyncHandler(async (req, res) => {
    // This endpoint can be used to explicitly trigger report generation, e.g., by the candidate.
    const report = await interviewService.finalizeAndGenerateReport(req.params.sessionId);
    res.status(201).json({ success: true, data: report });
}));

/**
 * @desc    Get the final report for an interview. If it doesn't exist, create it.
 * @route   GET /api/reports/:sessionId
 * @access  Private
 */
router.get('/:sessionId', protect, asyncHandler(async (req, res) => {
    const { sessionId } = req.params;

    // --- FIX: Implement "Get-or-Create" Logic ---

    // 1. First, try to find the report.
    let report = await InterviewReport.findOne({ session: sessionId }).populate({
        path: 'session',
        populate: [
            { path: 'candidate', select: 'firstName lastName email' },
            { path: 'template', select: 'title' }
        ]
    });
    
    // 2. If the report is found, return it immediately.
    if (report) {
        return res.status(200).json({ success: true, data: report });
    }

    // 3. If the report is NOT found, generate it on-the-fly.
    console.log(`Report for session ${sessionId} not found. Generating on-demand...`);
    
    // The service function creates the report.
    const newReport = await interviewService.finalizeAndGenerateReport(sessionId);

    // 4. After creating, fetch it again to populate the nested fields ('session', 'candidate', etc.)
    // to ensure a consistent response format for the frontend.
    const populatedReport = await InterviewReport.findById(newReport._id).populate({
        path: 'session',
        populate: [
            { path: 'candidate', select: 'firstName lastName email' },
            { path: 'template', select: 'title' }
        ]
    });
    
    if (!populatedReport) {
        // This is an unlikely edge case but handled for safety.
        throw new AppError(500, 'Failed to retrieve the report after generating it.');
    }

    res.status(200).json({ success: true, data: populatedReport });
}));

module.exports = router;