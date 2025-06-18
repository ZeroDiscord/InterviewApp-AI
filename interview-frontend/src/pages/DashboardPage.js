import React, { useState, useEffect, useRef } from 'react';
import * as apiClient from '../services/apiClient';
import { Box, Typography, Paper, Button, Alert } from '@mui/material';

const loadingMessages = [
    "Contacting AI for analysis...",
    "Analyzing job description...",
    "Generating behavioral questions...",
    "Crafting technical challenges...",
    "Finalizing interview session...",
    "Almost there..."
];

/**
 * The main dashboard for authenticated users, particularly for roles that create interviews.
 * Fetches available templates and candidates and provides a form to schedule a new interview session.
 */
const DashboardPage = () => {
    // State for the form
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [selectedCandidate, setSelectedCandidate] = useState('');
    const [scheduledAt, setScheduledAt] = useState(new Date().toISOString().slice(0, 16));

    // State for data fetched from the backend
    const [templates, setTemplates] = useState([]);
    const [candidates, setCandidates] = useState([]);
    
    // --- Richer UI state ---
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('Scheduling...');
    const [error, setError] = useState('');
    const [successInfo, setSuccessInfo] = useState(null);

    const loadingIntervalRef = useRef(null);

    // --- Cleanup interval on unmount ---
    useEffect(() => {
        return () => {
            if (loadingIntervalRef.current) {
                clearInterval(loadingIntervalRef.current);
            }
        };
    }, []);

    // Fetch initial data for dropdowns
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const templatesResponse = await apiClient.getTemplates();
                const candidatesResponse = await apiClient.getCandidates();
                setTemplates(templatesResponse.data || []);
                setCandidates(candidatesResponse.data || []);
            } catch (err) {
                setError('Failed to fetch initial data. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedTemplate || !selectedCandidate) {
            setError('Please select a template and a candidate.');
            return;
        }
        setIsLoading(true);
        setError('');
        setSuccessInfo(null);
        let messageIndex = 0;
        setLoadingMessage(loadingMessages[messageIndex]);
        loadingIntervalRef.current = setInterval(() => {
            messageIndex = (messageIndex + 1) % loadingMessages.length;
            setLoadingMessage(loadingMessages[messageIndex]);
        }, 2500);
        try {
            const sessionData = {
                templateId: selectedTemplate,
                candidateId: selectedCandidate,
                scheduledAt
            };
            const response = await apiClient.createSession(sessionData);
            setSuccessInfo({
                message: 'Interview scheduled successfully!',
                link: `${window.location.origin}/interview/${response.data.uniqueLink}`
            });
            setSelectedTemplate('');
            setSelectedCandidate('');
        } catch (err) {
            setError(err.message || 'Failed to schedule interview.');
        } finally {
            clearInterval(loadingIntervalRef.current);
            setIsLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: 'radial-gradient(ellipse at top left, #232526 60%, #181818 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                py: 4,
                fontFamily: 'Inter, Roboto, Arial, sans-serif',
            }}
        >
            <Paper
                elevation={3}
                sx={{
                    p: { xs: 2, sm: 5 },
                    maxWidth: 520,
                    width: '100%',
                    mx: 2,
                    background: 'rgba(24, 24, 24, 0.98)',
                    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                    color: '#fff',
                    borderRadius: 3,
                    fontFamily: 'Inter, Roboto, Arial, sans-serif',
                }}
            >
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff', mb: 1, textAlign: 'center', fontFamily: 'inherit', letterSpacing: 0.5 }}>
                    Schedule Interview
                </Typography>
                <Typography variant="subtitle1" sx={{ color: '#bdbdbd', fontWeight: 400, mb: 3, textAlign: 'center', fontFamily: 'inherit' }}>
                    Select a template, candidate, and time to schedule a new interview
                </Typography>
                {error && <Alert severity="error" sx={{ width: '100%', mb: 2, fontFamily: 'inherit' }}>{error}</Alert>}
                {successInfo && (
                    <Alert severity="success" sx={{ width: '100%', mb: 2, fontFamily: 'inherit' }}>
                        <strong>{successInfo.message}</strong>
                        <br />
                        <span>Shareable Link: <a href={successInfo.link} target="_blank" rel="noopener noreferrer" style={{ color: '#FFE066', textDecoration: 'underline', wordBreak: 'break-all', fontFamily: 'inherit' }}>{successInfo.link}</a></span>
                    </Alert>
                )}
                <form onSubmit={handleSubmit} autoComplete="off">
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <Box>
                            <Typography sx={{ color: '#bdbdbd', fontWeight: 500, mb: 1, fontSize: '1rem', fontFamily: 'inherit' }}>Interview Template</Typography>
                            <select
                                id="template"
                                value={selectedTemplate}
                                onChange={(e) => setSelectedTemplate(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '14px 16px',
                                    borderRadius: '6px',
                                    background: '#232526',
                                    color: '#fff',
                                    border: 'none',
                                    fontSize: '1rem',
                                    fontFamily: 'inherit',
                                    marginBottom: 0,
                                    outline: 'none',
                                    boxShadow: 'none',
                                }}
                            >
                                <option value="" disabled>Select a template...</option>
                                {templates.map(template => (
                                    <option key={template._id} value={template._id} style={{ color: '#181818', fontFamily: 'inherit' }}>{template.title}</option>
                                ))}
                            </select>
                        </Box>
                        <Box>
                            <Typography sx={{ color: '#bdbdbd', fontWeight: 500, mb: 1, fontSize: '1rem', fontFamily: 'inherit' }}>Candidate</Typography>
                            <select
                                id="candidate"
                                value={selectedCandidate}
                                onChange={(e) => setSelectedCandidate(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '14px 16px',
                                    borderRadius: '6px',
                                    background: '#232526',
                                    color: '#fff',
                                    border: 'none',
                                    fontSize: '1rem',
                                    fontFamily: 'inherit',
                                    marginBottom: 0,
                                    outline: 'none',
                                    boxShadow: 'none',
                                }}
                            >
                                <option value="" disabled>Select a candidate...</option>
                                {candidates.map(candidate => (
                                    <option key={candidate._id} value={candidate._id} style={{ color: '#181818', fontFamily: 'inherit' }}>{`${candidate.firstName} ${candidate.lastName} (${candidate.email})`}</option>
                                ))}
                            </select>
                        </Box>
                        <Box>
                            <Typography sx={{ color: '#bdbdbd', fontWeight: 500, mb: 1, fontSize: '1rem', fontFamily: 'inherit' }}>Scheduled Time</Typography>
                            <input
                                type="datetime-local"
                                id="scheduledAt"
                                value={scheduledAt}
                                onChange={(e) => setScheduledAt(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '14px 16px',
                                    borderRadius: '6px',
                                    background: '#232526',
                                    color: '#fff',
                                    border: 'none',
                                    fontSize: '1rem',
                                    fontFamily: 'inherit',
                                    outline: 'none',
                                    boxShadow: 'none',
                                }}
                            />
                        </Box>
                        <Button
                            type="submit"
                            variant="outlined"
                            sx={{
                                color: '#FFE066',
                                borderColor: '#FFE066',
                                borderWidth: 2,
                                borderRadius: 1.5,
                                py: 1.5,
                                px: 0,
                                minWidth: '160px',
                                fontSize: '1.1rem',
                                fontWeight: 700,
                                alignSelf: 'center',
                                letterSpacing: 1,
                                fontFamily: 'inherit',
                                boxShadow: 'none',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    backgroundColor: '#FFE066',
                                    color: '#181818',
                                    borderColor: '#FFE066',
                                    boxShadow: '0 0 16px 0 #ffe06644',
                                },
                            }}
                            disabled={isLoading}
                        >
                            {isLoading ? loadingMessage : 'SIGN IN'}
                        </Button>
                    </Box>
                </form>
            </Paper>
        </Box>
    );
};

export default DashboardPage;