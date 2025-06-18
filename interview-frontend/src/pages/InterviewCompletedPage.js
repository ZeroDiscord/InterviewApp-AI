import React, { useEffect, useState } from 'react';
import { CheckCircle } from '@mui/icons-material';
import { Box, Typography, LinearProgress } from '@mui/material';

/**
 * A "Thank You" page shown to candidates after they complete an interview.
 * Automatically redirects to the dashboard after a short delay.
 * @param {object} props - Component props.
 * @param {function} props.onRedirect - Callback to navigate to the dashboard.
 */
const InterviewCompletedPage = ({ onRedirect }) => {
    const [countdown, setCountdown] = useState(10);

    useEffect(() => {
        // Start a timer to redirect the user after 10 seconds.
        const redirectTimer = setTimeout(() => {
            onRedirect();
        }, 10000);

        // Start a timer to update the visual countdown every second.
        const countdownTimer = setInterval(() => {
            setCountdown(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        // Cleanup timers on component unmount.
        return () => {
            clearTimeout(redirectTimer);
            clearInterval(countdownTimer);
        };
    }, [onRedirect]);

    const progress = (10 - countdown) * 10;

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                minHeight: '60vh',
                p: 3,
            }}
        >
            <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
                Thank You!
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: '600px', mb: 4 }}>
                You have successfully completed the interview. Your responses have been submitted for analysis. You will be notified of the results.
            </Typography>
            <Box sx={{ width: '80%', maxWidth: '400px' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Redirecting you to your dashboard in {countdown} seconds...
                </Typography>
                <LinearProgress variant="determinate" value={progress} />
            </Box>
        </Box>
    );
};

export default InterviewCompletedPage;