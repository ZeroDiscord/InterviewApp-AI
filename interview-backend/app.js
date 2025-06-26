const express = require('express');
const path = require('path');
const cors = require('cors'); // Import the cors package
const config = require('./src/config');
const connectDB = require('./src/config/db');
const { errorHandler } = require('./src/middleware/errorHandler');

// --- Import Application Routes ---
const authRoutes = require('./src/routes/auth.routes.js');
const interviewRoutes = require('./src/routes/interview.routes.js');
const templateRoutes = require('./src/routes/template.routes.js');
const userRoutes = require('./src/routes/user.routes.js');
const reportRoutes = require('./src/routes/report.routes.js');


// Initialize Express
const app = express();

// Connect to Database
connectDB();

// --- Core Middleware ---

// Set up CORS options for more control
const corsOptions = {
    origin: 'http://localhost:3000', // Allow only the frontend to make requests
    methods: 'GET,POST,PUT,DELETE,PATCH,OPTIONS', // Specify allowed methods
    allowedHeaders: 'Content-Type,Authorization', // Specify allowed headers
    credentials: true
};

// Use the cors middleware with our options. This will handle preflight requests.
app.use(cors(corsOptions));

app.use(express.json());


// --- API Routes ---
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/auth', authRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);


app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Welcome to the Interview AI Backend API',
        version: '2.0.0-dev',
        status: 'API is running.'
    });
});

// This MUST be the last middleware registered.
app.use(errorHandler);

app.listen(config.port, () =>
    console.log(`Server running in ${config.nodeEnv} mode on port ${config.port}`)
);

module.exports = app;