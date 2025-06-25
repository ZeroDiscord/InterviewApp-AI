import React, { useState, useEffect } from 'react';
import * as apiClient from './services/apiClient';

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

function App() {
    const [user, setUser] = useState(null);
    const [appLoading, setAppLoading] = useState(true);
    const [path, setPath] = useState(window.location.pathname);
    const [error, setError] = useState('');
    const [resourceCheckedFor, setResourceCheckedFor] = useState(null);

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

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setPath('/login');
    };
    
    const renderContent = () => {
        const instructionsMatch = path.match(/^\/instructions\/([a-f0-9-]+)$/);
        if (instructionsMatch) {
            const uniqueLink = instructionsMatch[1];
            if (resourceCheckedFor !== uniqueLink) {
                return <ResourceCheckPage onSuccess={() => setResourceCheckedFor(uniqueLink)} />;
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
            return <AdminPanel onViewReport={(sessionId) => setPath(`/reports/${sessionId}`)} />;
        }
        
        if (user.role === 'candidate') {
             return <CandidateDashboard user={user} />;
        } else {
            return <DashboardPage />;
        }
    };
    
    return (
        <div className="bg-slate-900 font-sans min-h-screen">
            <header className="sticky top-0 z-10 bg-gradient-to-r from-[#0d131f]/80 via-[#111827]/80 to-[#0d131f]/80 backdrop-blur-xl shadow-2xl border-b border-yellow-500/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <h1 className="text-2xl font-extrabold text-white tracking-tight cursor-pointer hover:text-yellow-400 transition duration-150" onClick={() => user && setPath('/dashboard')}>
                          AI Interview Portal
                        </h1>
                        {user && (
                            <div className="flex items-center gap-3">
                                {user.role !== 'candidate' && (
                                    <button onClick={() => setPath(path.startsWith('/admin') ? '/dashboard' : '/admin')} className="px-4 py-2 rounded-lg border border-yellow-400 text-yellow-300 hover:bg-yellow-400 hover:text-slate-900 shadow-sm transition duration-150">
                                        {path.startsWith('/admin') ? 'Dashboard' : 'Admin Panel'}
                                    </button>
                                )}
                                <button onClick={handleLogout} className="px-4 py-2 rounded-lg border border-red-500 text-red-400 hover:bg-red-500 hover:text-white shadow-sm transition duration-150">
                                  Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>
            
            <main>
                {error && (
                    <div className="max-w-4xl mx-auto bg-red-900/50 border-l-4 border-red-500 text-red-200 p-4 mb-6 rounded-r-lg">
                        <p className="font-bold">Error</p><p>{error}</p>
                    </div>
                )}
                {renderContent()}
            </main>
        </div>
    );
}

export default App;