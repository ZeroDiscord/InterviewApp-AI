import React, { useState, useEffect, useMemo } from 'react';
import * as apiClient from './services/apiClient';
import { ThemeProvider, createTheme, CssBaseline, Box, IconButton, Menu, MenuItem, Avatar, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, Typography, Button } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountCircle from '@mui/icons-material/AccountCircle';

// Import all pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CandidateDashboard from './pages/CandidateDashboard';
import InstructionsPage from './pages/InstructionsPage';
import InterviewPage from './pages/InterviewPage';
import DetailedReportPage from './pages/DetailedReportPage';
import AdminPanel from './components/AdminPanel';
import InterviewCompletedPage from './pages/InterviewCompletedPage';
import ResourceCheckPage from './pages/ResourceCheckPage';
import NotFoundPage from './pages/NotFoundPage';
import ServerErrorPage from './pages/ServerErrorPage';
import NetworkErrorPage from './pages/NetworkErrorPage';
import DashboardLayout from './components/DashboardLayout';
import ScheduleInterviewPage from './pages/ScheduleInterviewPage';
import CreateUserPage from './pages/CreateUserPage';
import TemplatesPage from './pages/TemplatesPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

function App() {
    const [user, setUser] = useState(null);
    const [appLoading, setAppLoading] = useState(true);
    const [path, setPath] = useState(window.location.pathname);
    const [error, setError] = useState('');
    const [errorType, setErrorType] = useState(null); // 'network' | 'server' | null
    const [resourceCheckedFor, setResourceCheckedFor] = useState(null);
    const [adminPath, setAdminPath] = useState('/admin/dashboard');
    // Candidate menu/dialog state
    const [anchorEl, setAnchorEl] = useState(null);
    const menuOpen = Boolean(anchorEl);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [pwOpen, setPwOpen] = useState(false);
    const [pwData, setPwData] = useState({ currentPassword: '', newPassword: '', confirm: '' });
    const [pwLoading, setPwLoading] = useState(false);
    const [pwError, setPwError] = useState('');
    const [pwSuccess, setPwSuccess] = useState('');

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) {
            setUser(storedUser);
        }
        setAppLoading(false);
    }, []);

    const theme = useMemo(() => createTheme({
        palette: {
            mode: 'dark',
            background: {
                default: '#181818',
                paper: '#232526',
                sidebar: 'rgba(30,30,30,0.85)',
            },
            primary: { main: '#FFE066' },
            secondary: { main: '#FFD133' },
            accent: { main: '#FFD133', contrastText: '#181818' },
            text: { primary: '#fff', secondary: '#bdbdbd' },
            divider: '#FFE066',
            custom: {
                glow: '0 4px 32px 0 #ffe06622, 0 1.5px 8px 0 #0008',
                shadow: '0 2px 8px 0 #0006',
                gradient: 'linear-gradient(135deg, #232526 60%, #181818 100%)',
                sidebarActive: 'rgba(255,224,102,0.08)',
                sidebarHover: 'rgba(255,224,102,0.12)',
            },
        },
        typography: {
            fontFamily: 'Inter, Roboto, Arial, sans-serif',
        },
    }), []);

    // Example: catch network/server errors globally (for real app, use axios interceptors)
    useEffect(() => {
        window.addEventListener('unhandledrejection', (event) => {
            if (event.reason && event.reason.message && event.reason.message.includes('Network')) {
                setErrorType('network');
            } else {
                setErrorType('server');
            }
        });
        window.addEventListener('error', (event) => {
            setErrorType('server');
        });
        return () => {
            window.removeEventListener('unhandledrejection', () => {});
            window.removeEventListener('error', () => {});
        };
    }, []);

    const handleLogin = async (credentials) => {
        setError('');
        setErrorType(null);
        const data = await apiClient.login(credentials);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data));
        setUser(data);
        if (data.role === 'candidate') {
            setPath('/dashboard');
        } else {
            setPath('/admin/dashboard');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setPath('/login');
    };
    
    const renderContent = () => {
        if (errorType === 'network') return <NetworkErrorPage onRetry={() => window.location.reload()} />;
        if (errorType === 'server') return <ServerErrorPage />;

        // Redirect logged-in users from '/' to '/dashboard'
        if (user && path === '/') {
            if (user.role === 'candidate') {
                setPath('/dashboard');
            } else {
                setPath('/admin/dashboard');
            }
            return null;
        }

        const instructionsMatch = path.match(/^\/instructions\/([a-f0-9-]+)$/);
        if (instructionsMatch) {
            const uniqueLink = instructionsMatch[1];
            if (resourceCheckedFor !== uniqueLink) {
                // Await stream release before navigation
                return <ResourceCheckPage onSuccess={async () => {
                    await new Promise(resolve => setTimeout(resolve, 200));
                    setResourceCheckedFor(uniqueLink);
                }} />;
            }
            return <InstructionsPage onBegin={() => setPath(`/interview/${uniqueLink}`)} />;
        }

        const interviewMatch = path.match(/^\/interview\/([a-f0-9-]+)$/);
        if (interviewMatch) {
            const uniqueLink = interviewMatch[1];
            return <InterviewPage uniqueLink={uniqueLink} onInterviewComplete={() => setPath('/interview-completed')} />;
        }
        
        if (path === '/interview-completed') {
            return <InterviewCompletedPage onRedirect={() => setPath('/dashboard')} />;
        }
        
        const reportMatch = path.match(/^\/reports\/([a-zA-Z0-9]+)$/);
        if (reportMatch) {
            const sessionId = reportMatch[1];
            const onBackPath = user?.role === 'candidate' ? '/dashboard' : '/admin';
            return <DetailedReportPage sessionId={sessionId} onBack={() => setPath(onBackPath)} />;
        }

        if (appLoading) {
            return <div className="text-center p-12">Loading Application...</div>;
        }

        if (!user) {
            return <LoginPage onLoginSuccess={handleLogin} />;
        }
        
        if (path.startsWith('/admin')) {
            return (
                <DashboardLayout
                    activePath={adminPath}
                    onNavigate={setAdminPath}
                    onLogout={handleLogout}
                >
                    {adminPath === '/admin/dashboard' && <AdminPanel />}
                    {adminPath === '/admin/schedule' && <ScheduleInterviewPage />}
                    {adminPath === '/admin/create-user' && <CreateUserPage />}
                    {adminPath === '/admin/templates' && <TemplatesPage />}
                    {adminPath === '/admin/reports' && <ReportsPage />}
                    {adminPath === '/admin/settings' && <SettingsPage />}
                </DashboardLayout>
            );
        }
        
        if (user.role === 'candidate') {
             return <CandidateDashboard user={user} />;
        } else if (path === '/dashboard') {
            return <DashboardPage />;
        }
        // 404 fallback
        return <NotFoundPage />;
    };
    
    // Candidate menu handlers
    const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);
    const handleDetailsOpen = () => { setDetailsOpen(true); handleMenuClose(); };
    const handleDetailsClose = () => setDetailsOpen(false);
    const handlePwOpen = () => { setPwData({ currentPassword: '', newPassword: '', confirm: '' }); setPwError(''); setPwSuccess(''); setPwOpen(true); handleMenuClose(); };
    const handlePwClose = () => setPwOpen(false);
    const handlePwChange = e => setPwData({ ...pwData, [e.target.name]: e.target.value });
    const handlePwSave = async () => {
        setPwLoading(true);
        setPwError('');
        setPwSuccess('');
        if (!pwData.currentPassword || !pwData.newPassword || !pwData.confirm) {
            setPwError('All fields are required.');
            setPwLoading(false);
            return;
        }
        if (pwData.newPassword !== pwData.confirm) {
            setPwError('New passwords do not match.');
            setPwLoading(false);
            return;
        }
        try {
            await apiClient.changePassword({ currentPassword: pwData.currentPassword, newPassword: pwData.newPassword });
            setPwSuccess('Password changed successfully.');
            setTimeout(() => setPwOpen(false), 1000);
        } catch (e) {
            setPwError(e.message || 'Failed to change password.');
        } finally {
            setPwLoading(false);
        }
    };

    useEffect(() => {
        setAnchorEl(null);
    }, [user, path]);

    // Simple error boundary for rendering errors
    try {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <div className="bg-slate-900 font-sans min-h-screen" style={{ background: theme.palette.background.default }}>
                <header style={{ background: theme.palette.background.paper, boxShadow: '0 2px 8px 0 #0006', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 4, background: theme.palette.primary.main }} />
                  <h1 style={{ color: theme.palette.primary.main, fontWeight: 900, fontSize: '1.6rem', letterSpacing: 1, textShadow: '0 2px 12px #ffe06633', fontFamily: 'Inter, Roboto, Arial, sans-serif', margin: 0, zIndex: 2 }}>
                    AI Interview Portal
                  </h1>
                  {/* Candidate user menu (right side) */}
                  {user && user.role === 'candidate' && (
                    <Box sx={{ position: 'absolute', right: 24, top: 0, height: 56, display: 'flex', alignItems: 'center' }}>
                      <IconButton color="inherit" onClick={handleMenuOpen} size="large">
                        {user?.avatarUrl ? (
                          <Avatar src={user.avatarUrl} alt={user.firstName} />
                        ) : (
                          <AccountCircle sx={{ fontSize: 32, color: theme.palette.primary.main }} />
                        )}
                      </IconButton>
                      {anchorEl && (
                        <Menu
                          anchorEl={anchorEl}
                          open={Boolean(anchorEl)}
                          onClose={handleMenuClose}
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        >
                          <MenuItem onClick={handleDetailsOpen}><SettingsIcon sx={{ mr: 1 }} />Account Details</MenuItem>
                          <MenuItem onClick={handlePwOpen}>Change Password</MenuItem>
                          <MenuItem onClick={handleLogout} sx={{ color: '#ff5252', fontWeight: 700 }}>Logout</MenuItem>
                        </Menu>
                      )}
                    </Box>
                  )}
                </header>
                <main>
                 {error && (
                        <div className="max-w-4xl mx-auto bg-red-900/50 border-l-4 border-red-500 text-red-200 p-4 mb-6 rounded-r-lg">
                        <p className="font-bold">Error</p><p>{error}</p>
                    </div>
                 )}
                {renderContent()}
                {/* Candidate dialogs (global, so they work on all candidate pages) */}
                {user && user.role === 'candidate' && (
                  <>
                    {/* Account Details Dialog */}
                    <Dialog open={detailsOpen} onClose={handleDetailsClose} maxWidth="xs" fullWidth>
                      <DialogTitle>Account Details</DialogTitle>
                      <DialogContent>
                        <Typography sx={{ mb: 2 }}>Name: <b>{user.firstName} {user.lastName}</b></Typography>
                        <Typography sx={{ mb: 2 }}>Email: <b>{user.email}</b></Typography>
                      </DialogContent>
                      <DialogActions>
                        <Button onClick={handleDetailsClose}>Close</Button>
                      </DialogActions>
                    </Dialog>
                    {/* Change Password Dialog */}
                    <Dialog open={pwOpen} onClose={handlePwClose} maxWidth="xs" fullWidth>
                      <DialogTitle>Change Password</DialogTitle>
                      <DialogContent>
                        {pwError && <Alert severity="error" sx={{ mb: 2 }}>{pwError}</Alert>}
                        {pwSuccess && <Alert severity="success" sx={{ mb: 2 }}>{pwSuccess}</Alert>}
                        <TextField
                          margin="dense"
                          label="Current Password"
                          name="currentPassword"
                          value={pwData.currentPassword}
                          onChange={handlePwChange}
                          fullWidth
                          type="password"
                          variant="outlined"
                          autoFocus
                        />
                        <TextField
                          margin="dense"
                          label="New Password"
                          name="newPassword"
                          value={pwData.newPassword}
                          onChange={handlePwChange}
                          fullWidth
                          type="password"
                          variant="outlined"
                        />
                        <TextField
                          margin="dense"
                          label="Confirm New Password"
                          name="confirm"
                          value={pwData.confirm}
                          onChange={handlePwChange}
                          fullWidth
                          type="password"
                          variant="outlined"
                        />
                      </DialogContent>
                      <DialogActions>
                        <Button onClick={handlePwClose} disabled={pwLoading}>Cancel</Button>
                        <Button onClick={handlePwSave} variant="contained" sx={{ bgcolor: '#4caf50', color: '#181818', fontWeight: 700 }} disabled={pwLoading}>
                          {pwLoading ? 'Changing...' : 'Change'}
                        </Button>
                      </DialogActions>
                    </Dialog>
                  </>
                )}
                </main>
            </div>
        </ThemeProvider>
    );
    } catch (e) {
        return <ServerErrorPage />;
    }
}

export default App;