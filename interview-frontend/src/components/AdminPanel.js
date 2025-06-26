import React, { useState, useEffect } from 'react';
import * as apiClient from '../services/apiClient';
import { Box, Typography, Paper, Button, TextField, Select, MenuItem, InputLabel, FormControl, Alert, CircularProgress } from '@mui/material';

const AdminPanel = ({ onViewReport }) => {
    // State for creating a new interview template
    const [templateData, setTemplateData] = useState({
        title: '',
        jobDescription: '',
        numberOfQuestions: 5,
    });

    // State for creating a new user
    const [newUserData, setNewUserData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
        role: 'candidate'
    });

    // State for the paginated reports table
    const [completedSessions, setCompletedSessions] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    
    // Loading and message states
    const [isTableLoading, setIsTableLoading] = useState(true);
    const [isFormLoading, setIsFormLoading] = useState(false); // Correctly declared here
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const fetchCompleted = async () => {
            setIsTableLoading(true);
            try {
                const response = await apiClient.getCompletedSessions(pagination.page);
                setCompletedSessions(response.data || []);
                setPagination(response.pagination || { page: 1, totalPages: 1 });
            } catch (err) {
                setError(err.message || "Failed to fetch completed interviews.");
            } finally {
                setIsTableLoading(false);
            }
        };
        fetchCompleted();
    }, [pagination.page]);

    const handleTemplateInputChange = (e) => setTemplateData({ ...templateData, [e.target.name]: e.target.value });
    const handleUserInputChange = (e) => setNewUserData({ ...newUserData, [e.target.name]: e.target.value });

    const handleCreateTemplate = async (e) => {
        e.preventDefault();
        setIsFormLoading(true);
        setError('');
        setSuccessMessage('');
        if (!templateData.title || !templateData.jobDescription || !templateData.numberOfQuestions) {
            setError('Please provide all required fields: title, jobDescription, and numberOfQuestions.');
            setIsFormLoading(false);
            return;
        }
        try {
            await apiClient.createTemplate(templateData);
            setSuccessMessage(`Successfully created template: "${templateData.title}"!`);
            setTemplateData({ title: '', jobDescription: '', numberOfQuestions: 5 });
        } catch (err) {
            setError(err.message || 'Failed to create template.');
        } finally {
            setIsFormLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setIsFormLoading(true); // FIX: Used correct setter name
        setError('');
        setSuccessMessage('');
        try {
            await apiClient.register(newUserData);
            setSuccessMessage(`Successfully registered user: ${newUserData.email}`);
            setNewUserData({ firstName: '', lastName: '', email: '', password: '', phone: '', role: 'candidate' });
        } catch (err) {
            setError(err.message || 'Failed to register user.');
        } finally {
            setIsFormLoading(false); // FIX: Used correct setter name
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, page: newPage }));
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
                justifyContent: 'flex-start',
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
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff', mb: 3, textAlign: 'center', fontFamily: 'inherit', letterSpacing: 0.5 }}>
                    Admin Panel
                </Typography>
                {error && <Alert severity="error" sx={{ width: '100%', mb: 2, fontFamily: 'inherit' }}>{error}</Alert>}
                {successMessage && <Alert severity="success" sx={{ width: '100%', mb: 2, fontFamily: 'inherit' }}>{successMessage}</Alert>}
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, mb: 5 }}>
                    {/* Create New User Form */}
                    <Paper elevation={2} sx={{ flex: 1, p: 4, background: '#181818', borderRadius: 2, fontFamily: 'inherit' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#FFE066', mb: 2, fontFamily: 'inherit' }}>Create New User</Typography>
                        <form onSubmit={handleCreateUser} autoComplete="off">
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <TextField
                                        name="firstName"
                                        placeholder="First Name"
                                        value={newUserData.firstName}
                                        onChange={handleUserInputChange}
                                        required
                                        variant="filled"
                                        InputProps={{ disableUnderline: true, sx: { bgcolor: '#232526', borderRadius: 1, color: '#fff' } }}
                                        sx={{ input: { color: '#fff', px: 2, py: 1.5, fontFamily: 'inherit' }, flex: 1 }}
                                    />
                                    <TextField
                                        name="lastName"
                                        placeholder="Last Name"
                                        value={newUserData.lastName}
                                        onChange={handleUserInputChange}
                                        required
                                        variant="filled"
                                        InputProps={{ disableUnderline: true, sx: { bgcolor: '#232526', borderRadius: 1, color: '#fff' } }}
                                        sx={{ input: { color: '#fff', px: 2, py: 1.5, fontFamily: 'inherit' }, flex: 1 }}
                                    />
                                </Box>
                                <TextField
                                    name="email"
                                    placeholder="Email Address"
                                    value={newUserData.email}
                                    onChange={handleUserInputChange}
                                    required
                                    type="email"
                                    variant="filled"
                                    InputProps={{ disableUnderline: true, sx: { bgcolor: '#232526', borderRadius: 1, color: '#fff' } }}
                                    sx={{ input: { color: '#fff', px: 2, py: 1.5, fontFamily: 'inherit' } }}
                                />
                                <TextField
                                    name="password"
                                    placeholder="Password (min 8 chars)"
                                    value={newUserData.password}
                                    onChange={handleUserInputChange}
                                    required
                                    type="password"
                                    variant="filled"
                                    InputProps={{ disableUnderline: true, sx: { bgcolor: '#232526', borderRadius: 1, color: '#fff' } }}
                                    sx={{ input: { color: '#fff', px: 2, py: 1.5, fontFamily: 'inherit' } }}
                                />
                                <TextField
                                    name="phone"
                                    placeholder="Phone (Optional)"
                                    value={newUserData.phone}
                                    onChange={handleUserInputChange}
                                    type="tel"
                                    variant="filled"
                                    InputProps={{ disableUnderline: true, sx: { bgcolor: '#232526', borderRadius: 1, color: '#fff' } }}
                                    sx={{ input: { color: '#fff', px: 2, py: 1.5, fontFamily: 'inherit' } }}
                                />
                                <FormControl variant="filled" sx={{ bgcolor: '#232526', borderRadius: 1, fontFamily: 'inherit' }}>
                                    <InputLabel sx={{ color: '#bdbdbd', fontFamily: 'inherit' }}>Role</InputLabel>
                                    <Select
                                        name="role"
                                        value={newUserData.role}
                                        onChange={handleUserInputChange}
                                        required
                                        disableUnderline
                                        sx={{ 
                                            color: '#bdbdbd', 
                                            fontFamily: 'inherit', 
                                            '.MuiSelect-filled': { bgcolor: '#232526' },
                                            '& .MuiSelect-icon': { color: '#bdbdbd' }
                                        }}
                                        MenuProps={{
                                            PaperProps: {
                                                sx: {
                                                    bgcolor: '#181818',
                                                    color: '#fff',
                                                    '& .MuiMenuItem-root': {
                                                        bgcolor: '#181818',
                                                        '&:hover': { bgcolor: '#2a2a2a' },
                                                    },
                                                },
                                            },
                                        }}
                                    >
                                        <MenuItem value="candidate" sx={{ fontFamily: 'inherit', color: '#fff', bgcolor: '#232526', '&:hover': { bgcolor: '#2a2a2a' } }}>Candidate</MenuItem>
                                        <MenuItem value="interviewer" sx={{ fontFamily: 'inherit', color: '#fff', bgcolor: '#232526', '&:hover': { bgcolor: '#2a2a2a' } }}>Interviewer</MenuItem>
                                        <MenuItem value="hr_manager" sx={{ fontFamily: 'inherit', color: '#fff', bgcolor: '#232526', '&:hover': { bgcolor: '#2a2a2a' } }}>HR Manager</MenuItem>
                                    </Select>
                                </FormControl>
                                <Button
                                    type="submit"
                                    variant="outlined"
                                    sx={{
                                        color: '#FFE066',
                                        borderColor: '#FFE066',
                                        borderWidth: 2,
                                        borderRadius: 1.5,
                                        py: 1.5,
                                        minWidth: '120px',
                                        fontSize: '1rem',
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
                                    disabled={isFormLoading}
                                >
                                    {isFormLoading ? <CircularProgress size={22} sx={{ color: '#FFE066' }} /> : 'Create User'}
                                </Button>
                            </Box>
                        </form>
                    </Paper>
                    {/* Create New Template Form */}
                    <Paper elevation={2} sx={{ flex: 1, p: 4, background: '#181818', borderRadius: 2, fontFamily: 'inherit' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#FFE066', mb: 2, fontFamily: 'inherit' }}>Create New Template</Typography>
                        <form onSubmit={handleCreateTemplate} autoComplete="off">
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    name="title"
                                    placeholder="Template Title (e.g., 'Senior React Developer')"
                                    value={templateData.title}
                                    onChange={handleTemplateInputChange}
                                    required
                                    variant="filled"
                                    InputProps={{ disableUnderline: true, sx: { bgcolor: '#232526', borderRadius: 1, color: '#fff' } }}
                                    sx={{ input: { color: '#fff', px: 2, py: 1.5, fontFamily: 'inherit' } }}
                                />
                                <TextField
                                    name="jobDescription"
                                    placeholder="Paste the full job description here..."
                                    value={templateData.jobDescription}
                                    onChange={handleTemplateInputChange}
                                    required
                                    multiline
                                    rows={8}
                                    variant="filled"
                                    InputProps={{ disableUnderline: true, sx: { bgcolor: '#232526', borderRadius: 1, color: '#fff' } }}
                                    sx={{ '.MuiInputBase-input': { color: '#fff', px: 2, py: 1.5, fontFamily: 'inherit', resize: 'vertical' } }}
                                />
                                <TextField
                                    name="numberOfQuestions"
                                    label="Number of Questions"
                                    value={templateData.numberOfQuestions}
                                    onChange={handleTemplateInputChange}
                                    required
                                    type="number"
                                    variant="outlined"
                                    InputLabelProps={{
                                        sx: { color: '#bdbdbd' }
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            backgroundColor: '#232526',
                                            borderRadius: 1,
                                            '& fieldset': {
                                                borderColor: 'transparent',
                                            },
                                            '&:hover fieldset': {
                                                borderColor: 'transparent',
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: 'transparent',
                                            },
                                        },
                                        input: { color: '#fff', px: 2, py: 1.5, fontFamily: 'inherit' }
                                    }}
                                />
                                <Button
                                    type="submit"
                                    variant="outlined"
                                    sx={{
                                        color: '#FFE066',
                                        borderColor: '#FFE066',
                                        borderWidth: 2,
                                        borderRadius: 1.5,
                                        py: 1.5,
                                        minWidth: '180px',
                                        fontSize: '1rem',
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
                                    disabled={isFormLoading}
                                >
                                    {isFormLoading ? <CircularProgress size={22} sx={{ color: '#FFE066' }} /> : 'Create Template'}
                                </Button>
                            </Box>
                        </form>
                    </Paper>
                </Box>
                {/* Completed Interviews Table */}
                <Paper elevation={2} sx={{ mt: 2, p: 4, background: '#181818', borderRadius: 2, fontFamily: 'inherit' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#FFE066', mb: 2, fontFamily: 'inherit' }}>Completed Interview Reports</Typography>
                    <Box sx={{ overflowX: 'auto', fontFamily: 'inherit' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'inherit' }}>
                            <thead>
                                <tr style={{ background: '#232526' }}>
                                    <th style={{ padding: '12px 8px', textAlign: 'left', color: '#bdbdbd', fontWeight: 700, fontSize: '0.95rem', letterSpacing: 1, fontFamily: 'inherit' }}>Candidate</th>
                                    <th style={{ padding: '12px 8px', textAlign: 'left', color: '#bdbdbd', fontWeight: 700, fontSize: '0.95rem', letterSpacing: 1, fontFamily: 'inherit' }}>Interview</th>
                                    <th style={{ padding: '12px 8px', textAlign: 'left', color: '#bdbdbd', fontWeight: 700, fontSize: '0.95rem', letterSpacing: 1, fontFamily: 'inherit' }}>Date</th>
                                    <th style={{ padding: '12px 8px', textAlign: 'left', color: '#bdbdbd', fontWeight: 700, fontSize: '0.95rem', letterSpacing: 1, fontFamily: 'inherit' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isTableLoading ? (
                                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: 16, color: '#bdbdbd', fontFamily: 'inherit' }}><CircularProgress size={22} sx={{ color: '#FFE066' }} /></td></tr>
                                ) : completedSessions.length > 0 ? (
                                    completedSessions.map((session) => (
                                        <tr key={session._id} style={{ borderBottom: '1px solid #232526' }}>
                                            <td style={{ padding: '10px 8px', color: '#fff', fontFamily: 'inherit' }}>{session.candidate?.firstName} {session.candidate?.lastName}</td>
                                            <td style={{ padding: '10px 8px', color: '#fff', fontFamily: 'inherit' }}>{session.template?.title}</td>
                                            <td style={{ padding: '10px 8px', color: '#fff', fontFamily: 'inherit' }}>{new Date(session.completedAt).toLocaleDateString()}</td>
                                            <td style={{ padding: '10px 8px', fontFamily: 'inherit' }}>
                                                <Button
                                                    onClick={() => onViewReport(session._id)}
                                                    sx={{
                                                        color: '#FFE066',
                                                        fontWeight: 700,
                                                        fontFamily: 'inherit',
                                                        textTransform: 'none',
                                                        '&:hover': { color: '#fff', background: 'transparent', textDecoration: 'underline' },
                                                    }}
                                                >
                                                    View Report
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: 16, color: '#bdbdbd', fontFamily: 'inherit' }}>No completed interviews found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </Box>
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'inherit' }}>
                        <Button
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page <= 1 || isTableLoading}
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
                                opacity: pagination.page <= 1 || isTableLoading ? 0.5 : 1,
                            }}
                        >
                            Previous
                        </Button>
                        <Typography sx={{ color: '#bdbdbd', fontFamily: 'inherit' }}>Page {pagination.page} of {pagination.totalPages}</Typography>
                        <Button
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages || isTableLoading}
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
                                opacity: pagination.page >= pagination.totalPages || isTableLoading ? 0.5 : 1,
                            }}
                        >
                            Next
                        </Button>
                    </Box>
                </Paper>
            </Paper>
        </Box>
    );
};

export default AdminPanel;