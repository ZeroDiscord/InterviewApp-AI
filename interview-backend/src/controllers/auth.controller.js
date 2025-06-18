const User = require('../models/user.model');
const config = require('../config');
const jwt = require('jsonwebtoken');

/**
 * Generates a JSON Web Token for a given user ID.
 * @param {string} id - The user's MongoDB document ID.
 * @returns {string} The generated JWT.
 */
const generateToken = (id) => {
    return jwt.sign({
        id
    }, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn,
    });
};


/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res) => {
    const {
        firstName,
        lastName,
        email,
        password,
        role
    } = req.body;

    // Basic validation
    if (!firstName || !lastName || !email || !password || !role) {
        res.status(400);
        throw new Error('Please provide all required fields: firstName, lastName, email, password, role.');
    }

    // Check if user already exists
    const userExists = await User.findOne({
        email
    });

    if (userExists) {
        res.status(400);
        throw new Error('User with this email already exists.');
    }

    // Create new user. The password will be automatically hashed by the pre-save hook in the User model.
    const user = await User.create({
        firstName,
        lastName,
        email,
        password,
        role,
    });

    if (user) {
        const token = generateToken(user._id);
        res.status(201).json({
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            token: token,
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data received.');
    }
};


/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res) => {
    const {
        email,
        password
    } = req.body;

    if (!email || !password) {
        res.status(400);
        throw new Error('Please provide both email and password.');
    }

    // Find user by email and explicitly include the password for comparison
    const user = await User.findOne({
        email
    }).select('+password');

    // Check if user exists and password is correct
    if (user && (await user.comparePassword(password))) {
        const token = generateToken(user._id);
        res.status(200).json({
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            token: token,
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password.');
    }
};

module.exports = {
    registerUser,
    loginUser
};