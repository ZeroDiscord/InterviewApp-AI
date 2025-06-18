const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/auth.controller');
const asyncHandler = require('../middleware/asyncHandler');
const { protect, authorize } = require('../middleware/auth.middleware');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Private (Admin & HR Manager only)
 */
router.post(
    '/register',
    protect, // 1. User must be logged in.
    authorize('admin', 'hr_manager'), // 2. User must have a permitted role.
    asyncHandler(registerUser)
);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post('/login', asyncHandler(loginUser));


module.exports = router;