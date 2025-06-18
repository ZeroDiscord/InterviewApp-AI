import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as apiClient from '../services/apiClient';
import SummaryPage from './SummaryPage';
import { Box, Typography, Paper, Button, Alert, IconButton, CircularProgress } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

const TabButton = ({ children, isActive, onClick }) => (
    <Button
        onClick={onClick}
        variant={isActive ? 'contained' : 'text'}
        sx={{
            borderRadius: '12px 12px 0 0',
            fontWeight: 700,
            fontFamily: 'Inter, Roboto, Arial, sans-serif',
            fontSize: '1rem',
            color: isActive ? '#181818' : '#bdbdbd',
            background: isActive ? '#FFE066' : 'transparent',
            boxShadow: 'none',
            px: 4,
            py: 1.5,
            borderBottom: isActive ? 'none' : '2px solid #232526',
            transition: 'all 0.2s',
            '&:hover': {
                background: isActive ? '#FFE066' : '#232526',
                color: '#fff',
            },
        }}
        disableElevation
    >
        {children}
    </Button>
);

const DetailedReportPage = ({ sessionId, onBack }) => {
    const [activeTab, setActiveTab] = useState('summary');
    const [reportData, setReportData] = useState(null);
    const [sessionDetails, setSessionDetails] = useState(null);
    const [sessionResponses, setSessionResponses] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchAllReportData = useCallback(async (page = 1) => {
        setIsLoading(true);
        setError('');
        try {
            const [reportRes, sessionRes, responsesRes] = await Promise.all([
                apiClient.getReport(sessionId),
                apiClient.getSessionDetailsForAdmin(sessionId),
                apiClient.getSessionResponses(sessionId, page)
            ]);
            setReportData(reportRes.data);
            setSessionDetails(sessionRes.data);
            setSessionResponses(responsesRes.responses);
            setPagination(responsesRes.pagination);
        } catch (err) {
            setError(err.message || "Failed to fetch detailed report data.");
        } finally {
            setIsLoading(false);
        }
    }, [sessionId]);

    useEffect(() => {
        fetchAllReportData(pagination.page);
    }, [sessionId, pagination.page, fetchAllReportData]);

    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, page: newPage }));
        }
    };

    const renderTabContent = () => {
        if (isLoading) return <Box sx={{ p: 8, textAlign: 'center', color: '#bdbdbd', fontFamily: 'inherit' }}><CircularProgress sx={{ color: '#FFE066' }} /></Box>;
        if (error) return <Box sx={{ p: 8, textAlign: 'center', color: '#ff5252', fontFamily: 'inherit' }}>{error}</Box>;
        switch (activeTab) {
            case 'questions':
                return <QuestionsListView questions={sessionDetails?.questions || []} />;
            case 'breakdown':
                return <BreakdownView responses={sessionResponses} pagination={pagination} onPageChange={handlePageChange} />;
            case 'summary':
            default:
                return reportData ? <SummaryPage reportData={reportData} /> : <Typography sx={{ color: '#bdbdbd', fontFamily: 'inherit' }}>No summary available.</Typography>;
        }
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
                    maxWidth: 1100,
                    width: '100%',
                    mx: 2,
                    background: 'rgba(24, 24, 24, 0.98)',
                    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                    color: '#fff',
                    borderRadius: 3,
                    fontFamily: 'inherit',
                }}
            >
                <Button onClick={onBack} sx={{ color: '#FFE066', fontWeight: 700, fontFamily: 'inherit', mb: 2, textTransform: 'none', '&:hover': { color: '#fff', background: 'transparent', textDecoration: 'underline' } }}>
                    &larr; Back to Admin Panel
                </Button>
                <Box sx={{ display: 'flex', borderBottom: '2px solid #232526', mb: 0 }}>
                    <TabButton isActive={activeTab === 'summary'} onClick={() => setActiveTab('summary')}>Overall Summary</TabButton>
                    <TabButton isActive={activeTab === 'questions'} onClick={() => setActiveTab('questions')}>Questions List</TabButton>
                    <TabButton isActive={activeTab === 'breakdown'} onClick={() => setActiveTab('breakdown')}>Response Breakdown</TabButton>
                </Box>
                <Box sx={{ background: '#181818', borderRadius: '0 0 12px 12px', boxShadow: '0 4px 24px 0 #0002', mt: 0, fontFamily: 'inherit' }}>
                    {renderTabContent()}
                </Box>
            </Paper>
        </Box>
    );
};

// --- Sub-components for the tabs ---

const QuestionsListView = ({ questions }) => (
    <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3, fontFamily: 'inherit' }}>
        {questions.map((q, index) => (
            <Box key={q._id} sx={{ p: 3, border: '1px solid #232526', borderRadius: 2, background: '#232526' }}>
                <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#FFE066', fontFamily: 'inherit' }}>Q{index + 1}: {q.questionText}</Typography>
                <Box sx={{ mt: 2, pl: 2, borderLeft: '4px solid #FFE066' }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', color: '#bdbdbd', fontFamily: 'inherit' }}>Ideal Answer:</Typography>
                    <Typography sx={{ color: '#fff', fontStyle: 'italic', fontFamily: 'inherit' }}>{q.idealAnswer}</Typography>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', color: '#bdbdbd', mt: 2, fontFamily: 'inherit' }}>Keywords:</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                        {q.keywords.map(kw => <Box key={kw} sx={{ background: '#FFE066', color: '#181818', fontSize: '0.85rem', fontWeight: 700, px: 1.5, py: 0.5, borderRadius: 2, fontFamily: 'inherit' }}>{kw}</Box>)}
                    </Box>
                </Box>
            </Box>
        ))}
    </Box>
);

const BreakdownView = ({ responses, pagination, onPageChange }) => {
    const audioRefs = useRef([]);
    const handlePlay = (idx) => {
        if (audioRefs.current[idx]) {
            audioRefs.current.forEach((audio, i) => {
                if (audio && i !== idx) audio.pause();
            });
            audioRefs.current[idx].play();
        }
    };
    return (
        <Box sx={{ p: 4, fontFamily: 'inherit' }}>
            <Box sx={{ overflowX: 'auto', fontFamily: 'inherit' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'inherit' }}>
                    <thead>
                        <tr style={{ background: '#232526' }}>
                            <th style={{ padding: '12px 8px', textAlign: 'left', color: '#bdbdbd', fontWeight: 700, fontSize: '0.95rem', letterSpacing: 1, fontFamily: 'inherit' }}>Question</th>
                            <th style={{ padding: '12px 8px', textAlign: 'left', color: '#bdbdbd', fontWeight: 700, fontSize: '0.95rem', letterSpacing: 1, fontFamily: 'inherit' }}>Candidate's Answer</th>
                            <th style={{ padding: '12px 8px', textAlign: 'left', color: '#bdbdbd', fontWeight: 700, fontSize: '0.95rem', letterSpacing: 1, fontFamily: 'inherit' }}>Score</th>
                            <th style={{ padding: '12px 8px', textAlign: 'left', color: '#bdbdbd', fontWeight: 700, fontSize: '0.95rem', letterSpacing: 1, fontFamily: 'inherit' }}>Audio</th>
                        </tr>
                    </thead>
                    <tbody>
                        {responses.map((res, idx) => (
                            <tr key={res._id} style={{ borderBottom: '1px solid #232526' }}>
                                <td style={{ padding: '10px 8px', color: '#fff', fontFamily: 'inherit', whiteSpace: 'pre-wrap', fontWeight: 500 }}>{res.questionText}</td>
                                <td style={{ padding: '10px 8px', color: '#bdbdbd', fontFamily: 'inherit', whiteSpace: 'pre-wrap', fontStyle: 'italic' }}>
                                    "{res.transcribedText}"
                                </td>
                                <td style={{ padding: '10px 8px', color: '#FFE066', fontFamily: 'inherit', fontWeight: 700, fontSize: '1.1rem' }}>{(res.aiScore).toFixed(1)}%</td>
                                <td style={{ padding: '10px 8px', fontFamily: 'inherit' }}>
                                    <audio ref={el => audioRefs.current[idx] = el} src={`http://localhost:5000${res.audioFileUrl}`} preload="none" style={{ display: 'none' }} />
                                    <IconButton onClick={() => handlePlay(idx)} sx={{ color: '#FFE066', background: '#232526', borderRadius: 2, '&:hover': { background: '#FFE066', color: '#181818' } }}>
                                        <PlayArrowIcon fontSize="large" />
                                    </IconButton>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Box>
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'inherit' }}>
                <Button
                    onClick={() => onPageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    sx={{
                        color: '#bdbdbd',
                        borderColor: '#232526',
                        borderWidth: 2,
                        borderRadius: 1,
                        px: 3,
                        py: 1,
                        fontWeight: 700,
                        fontFamily: 'inherit',
                        background: 'transparent',
                        '&:hover': { background: '#232526', color: '#fff' },
                        opacity: pagination.page <= 1 ? 0.5 : 1,
                    }}
                >
                    Previous
                </Button>
                <Typography sx={{ color: '#bdbdbd', fontFamily: 'inherit' }}>Page {pagination.page} of {pagination.totalPages}</Typography>
                <Button
                    onClick={() => onPageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    sx={{
                        color: '#bdbdbd',
                        borderColor: '#232526',
                        borderWidth: 2,
                        borderRadius: 1,
                        px: 3,
                        py: 1,
                        fontWeight: 700,
                        fontFamily: 'inherit',
                        background: 'transparent',
                        '&:hover': { background: '#232526', color: '#fff' },
                        opacity: pagination.page >= pagination.totalPages ? 0.5 : 1,
                    }}
                >
                    Next
                </Button>
            </Box>
        </Box>
    );
};

export default DetailedReportPage;