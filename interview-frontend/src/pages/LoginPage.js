import React, { useState } from 'react';
import {
    Box,
    TextField,
    Button,
    Typography,
    Paper,
    IconButton,
    InputAdornment,
    Alert,
    CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

const LoginPage = ({ onLoginSuccess, onSwitchToRegister }) => {
    const [form, setForm] = useState({
        email: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        if (!form.email || !form.password) {
            setError('Please enter both email and password.');
            setIsLoading(false);
            return;
        }
        try {
            await onLoginSuccess(form);
        } catch (err) {
            setError(err.message || 'Failed to log in. Please check your credentials.');
        } finally {
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
            }}
        >
            <Paper
                elevation={3}
                sx={{
                    p: { xs: 2, sm: 5 },
                    maxWidth: 600,
                    width: '100%',
                    mx: 2,
                    background: 'rgba(24, 24, 24, 0.98)',
                    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                    color: '#fff',
                    borderRadius: 3,
                }}
            >
                <Box sx={{ mb: 4, textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff', mb: 1 }}>
                        Sign In
                    </Typography>
                    <Typography variant="subtitle1" sx={{ color: '#bdbdbd', fontWeight: 400 }}>
                        Enter your email and password to sign in
                    </Typography>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {/* Email */}
                        <TextField
                            name="email"
                            placeholder="Write email here"
                            fullWidth
                            required
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            variant="filled"
                            InputProps={{
                                disableUnderline: true,
                                sx: { bgcolor: '#232526', borderRadius: 1 },
                            }}
                            sx={{ input: { color: '#fff', px: 2, py: 1.5 } }}
                            disabled={isLoading}
                        />

                        {/* Password */}
                        <TextField
                            name="password"
                            placeholder="Password"
                            type={showPassword ? 'text' : 'password'}
                            fullWidth
                            required
                            value={form.password}
                            onChange={handleChange}
                            variant="filled"
                            InputProps={{
                                disableUnderline: true,
                                sx: { bgcolor: '#232526', borderRadius: 1 },
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                            sx={{ color: '#fff' }}
                                            disabled={isLoading}
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ input: { color: '#fff', px: 2, py: 1.5 } }}
                            disabled={isLoading}
                        />

                        {/* Submit Button */}
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                            <Button
                                type="submit"
                                variant="outlined"
                                sx={{
                                    color: '#FFE066',
                                    borderColor: '#FFE066',
                                    borderWidth: 2,
                                    borderRadius: 1,
                                    py: 1.5,
                                    px: 4,
                                    minWidth: '120px',
                                    fontSize: '0.875rem',
                                    fontWeight: 700,
                                    position: 'relative',
                                    '&:hover': {
                                        backgroundColor: '#FFE066',
                                        color: '#181818',
                                    },
                                }}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <CircularProgress
                                        size={24}
                                        sx={{
                                            color: '#FFE066',
                                            position: 'absolute',
                                            top: '50%',
                                            left: '50%',
                                            marginTop: '-12px',
                                            marginLeft: '-12px',
                                        }}
                                    />
                                ) : (
                                    'SIGN IN'
                                )}
                            </Button>
                        </Box>
                    </Box>
                </form>
            </Paper>
        </Box>
    );
};

export default LoginPage;