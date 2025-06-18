import React, { useState, useEffect } from 'react';
import * as apiClient from './services/apiClient';

// Import all pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import InterviewPage from './pages/InterviewPage';
import SummaryPage from './pages/SummaryPage';
import AdminPanel from './components/AdminPanel';
import CandidateDashboard from './pages/CandidateDashboard';

function App() {
    const [user, setUser] = useState(null);
    const [authView, setAuthView] = useState('login');
    const [appLoading, setAppLoading] = useState(true);

    const [path, setPath] = useState(window.location.pathname);
    const [error, setError] = useState('');
    const [isAdminPanelVisible, setIsAdminPanelVisible] = useState(false);

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) {
            setUser(storedUser);
        }
        setAppLoading(false);
    }, []);

    const handleLogin = async (credentials) => {
        setError('');
        const data = await apiClient.login(credentials);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data));
        setUser(data);
        setPath('/dashboard');
    };

    const handleRegister = async (userData) => {
        setError('');
        const data = await apiClient.register(userData);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data));
        setUser(data);
        setPath('/dashboard');
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setPath('/login');
    };
    
    const renderContent = () => {
        const interviewMatch = path.match(/^\/interview\/([a-f0-9-]+)$/);
        if (appLoading) {
            return <div className="text-center p-12">Loading Application...</div>;
        }

        if (interviewMatch) {
            const uniqueLink = interviewMatch[1];
            return <InterviewPage uniqueLink={uniqueLink} onInterviewComplete={(sessionId) => setPath(`/summary/${sessionId}`)} />;
        }
        
        const summaryMatch = path.match(/^\/summary\/([a-f0-9-]+)$/);
        if (summaryMatch) {
            const sessionId = summaryMatch[1];
             return <SummaryPage sessionId={sessionId} />;
        }

        if (!user) {
            if (authView === 'login') {
                return <LoginPage onLoginSuccess={handleLogin} onSwitchToRegister={() => setAuthView('register')} />;
            } else {
                return <RegisterPage onRegisterSuccess={handleRegister} onSwitchToLogin={() => setAuthView('login')} />;
            }
        }

        if (isAdminPanelVisible) {
            return <AdminPanel />;
        }
        
        if (user.role === 'candidate') {
             return <CandidateDashboard user={user} />;
        } else {
            return <DashboardPage />;
        }
    };
    
    return (
        <div className="bg-slate-50 font-sans min-h-screen">
            <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <h1 className="text-2xl font-bold text-slate-800 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => user && setPath('/dashboard')}>
                          AI Interview Portal
                        </h1>
                        {user && (
                            <div>
                                {user.role !== 'candidate' && (
                                    <button onClick={() => setIsAdminPanelVisible(!isAdminPanelVisible)} className="bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 mr-4">
                                        {isAdminPanelVisible ? 'Dashboard' : 'Admin Panel'}
                                    </button>
                                )}
                                <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                                  Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>
            
            <main className="p-4 md:p-8">
                 {error && (
                    <div className="max-w-4xl mx-auto bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-r-lg">
                        <p className="font-bold">Error</p><p>{error}</p>
                    </div>
                 )}
                {renderContent()}
            </main>
        </div>
    );
}

export default App;