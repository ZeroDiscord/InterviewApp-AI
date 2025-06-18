const User = require('../models/user.model');

/**
 * @desc    Get users, with an option to filter by role
 * @route   GET /api/users
 * @access  Private (Admin, Interviewer, HR Manager)
 */
const getUsers = async (req, res) => {
    const filter = {};

    // If a 'role' query parameter is provided, add it to the filter.
    // e.g., /api/users?role=candidate
    if (req.query.role) {
        filter.role = req.query.role;
    }

    // Fetch users based on the filter. The password is not selected by default.
    const users = await User.find(filter);

    res.status(200).json({
        success: true,
        count: users.length,
        data: users,
    });
};

module.exports = {
    getUsers,
    // We will add functions for getting a single user, updating, etc. later.
};