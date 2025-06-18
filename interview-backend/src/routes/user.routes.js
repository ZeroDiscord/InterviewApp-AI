const express = require('express');
const router = express.Router();
const { getUsers } = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * @route   GET /api/users
 * @desc    Get all users, with optional role filtering
 * @access  Private (Admin, Interviewer, HR Manager)
 */
router.get(
    '/',
    protect,
    authorize('admin', 'interviewer', 'hr_manager'),
    asyncHandler(getUsers)
);

module.exports = router;