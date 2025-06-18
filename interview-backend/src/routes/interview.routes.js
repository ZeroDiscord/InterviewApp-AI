const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { protect, authorize } = require('../middleware/auth.middleware');
const asyncHandler = require('../middleware/asyncHandler');
const {
    transcribeResponse,
    createSession,
    getSessionByLink,
    submitResponse, 
    getMySessions,
    getCompletedSessions
} = require('../controllers/interview.controller');

const config = require('../config');

// --- File Storage Setup for Multer ---
const uploadDir = path.join(path.dirname(require.main.filename), config.uploadPath);
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = req.user._id + '-' + Date.now();
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const audioFileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
        cb(null, true);
    } else {
        cb(new Error('File upload rejected: Not an audio file.'), false);
    }
};
const upload = multer({ storage: storage, fileFilter: audioFileFilter, limits: { fileSize: 25 * 1024 * 1024 } });


// --- Route Definitions ---

router.post('/transcribe', protect, upload.single('audio'), asyncHandler(transcribeResponse));
router.post('/sessions', protect, authorize('admin', 'interviewer', 'hr_manager'), asyncHandler(createSession));
router.post('/sessions/:sessionId/responses', protect, asyncHandler(submitResponse));
router.get('/sessions/my-sessions', protect, authorize('candidate'), asyncHandler(getMySessions));


// --- FIX: The specific static route is now defined BEFORE the dynamic route ---

/**
 * Route to get all completed sessions for the admin panel table.
 * @route   GET /api/interview/sessions/completed
 * @access  Private (Admin, Interviewer, HR Manager)
 */
router.get(
    '/sessions/completed',
    protect,
    authorize('admin', 'interviewer', 'hr_manager'),
    asyncHandler(getCompletedSessions)
);

/**
 * Route to get a specific interview session to start it.
 * This MUST be defined after more specific '/sessions/*' routes.
 * @route   GET /api/interview/sessions/:uniqueLink
 * @access  Private
 */
router.get('/sessions/:uniqueLink', protect, asyncHandler(getSessionByLink));


module.exports = router;