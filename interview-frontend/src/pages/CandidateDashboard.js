import React, { useState, useEffect } from 'react';
import * as apiClient from '../services/apiClient';
import { Box, Typography, Paper, Button, CircularProgress } from '@mui/material';

const CandidateDashboard = ({ user }) => {
    const [sessions, setSessions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const response = await apiClient.getMySessions();
                setSessions(response.data);
            } catch (err) {
                setError('Could not fetch your scheduled interviews.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchSessions();
    }, []);

    const handleStartInterview = (uniqueLink) => {
        window.location.pathname = `/instructions/${uniqueLink}`;
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: 'radial-gradient(ellipse at top left, #232526 60%, #181818 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                py: 6,
                fontFamily: 'Inter, Roboto, Arial, sans-serif',
            }}
        >
            <Paper
                elevation={3}
                sx={{
                    p: { xs: 2, sm: 5 },
                    maxWidth: 700,
                    width: '100%',
                    mx: 2,
                    background: 'rgba(24, 24, 24, 0.98)',
                    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                    color: '#fff',
                    borderRadius: 3,
                    fontFamily: 'inherit',
                }}
            >
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff', mb: 1, fontFamily: 'inherit', textAlign: 'center', letterSpacing: 0.5 }}>
                    Welcome, {user.firstName}!
                </Typography>
                <Typography variant="subtitle1" sx={{ color: '#bdbdbd', fontWeight: 400, mb: 4, fontFamily: 'inherit', textAlign: 'center' }}>
                    Here are your scheduled interviews.
                </Typography>
                {isLoading && <Box sx={{ textAlign: 'center', p: 4 }}><CircularProgress sx={{ color: '#FFE066' }} /></Box>}
                {error && <Typography sx={{ textAlign: 'center', p: 4, color: '#ff5252', fontFamily: 'inherit' }}>{error}</Typography>}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {!isLoading && sessions.length > 0 ? (
                        sessions.map(session => (
                            <Paper key={session._id} elevation={2} sx={{ p: 3, background: '#232526', borderRadius: 2, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 3, fontFamily: 'inherit' }}>
                                <Box>
                                    <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#FFE066', fontFamily: 'inherit' }}>{session.template.title}</Typography>
                                    <Typography sx={{ color: '#bdbdbd', fontFamily: 'inherit', mt: 0.5 }}>
                                        Status: <span style={{ fontWeight: 600, color: '#fff', textTransform: 'capitalize' }}>{session.status.replace('_', ' ')}</span>
                                    </Typography>
                                    <Typography sx={{ color: '#bdbdbd', fontFamily: 'inherit', mt: 0.5 }}>
                                        Scheduled for: {new Date(session.scheduledAt).toLocaleString()}
                                    </Typography>
                                </Box>
                                <Button
                                    onClick={() => handleStartInterview(session.uniqueLink)}
                                    disabled={session.status !== 'scheduled'}
                                    variant="outlined"
                                    sx={{
                                        color: '#FFE066',
                                        borderColor: '#FFE066',
                                        borderWidth: 2,
                                        borderRadius: 1.5,
                                        py: 1.2,
                                        px: 4,
                                        minWidth: '160px',
                                        fontSize: '1rem',
                                        fontWeight: 700,
                                        letterSpacing: 1,
                                        fontFamily: 'inherit',
                                        boxShadow: 'none',
                                        transition: 'all 0.2s',
                                        background: 'transparent',
                                        '&:hover': {
                                            backgroundColor: '#FFE066',
                                            color: '#181818',
                                            borderColor: '#FFE066',
                                            boxShadow: '0 0 16px 0 #ffe06644',
                                        },
                                        opacity: session.status !== 'scheduled' ? 0.5 : 1,
                                        cursor: session.status !== 'scheduled' ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    {session.status === 'scheduled' ? 'Start Interview' : 'View Status'}
                                </Button>
                            </Paper>
                        ))
                    ) : (
                        !isLoading && <Typography sx={{ textAlign: 'center', color: '#bdbdbd', p: 4, fontFamily: 'inherit' }}>You have no interviews scheduled at this time.</Typography>
                    )}
                </Box>
            </Paper>
        </Box>
    );
};

export default CandidateDashboard;