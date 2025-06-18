import React, { useState, useEffect } from 'react';
import * as apiClient from '../services/apiClient';

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
        // This changes the URL, and the App component's router will render the InterviewPage
        window.location.pathname = `/interview/${uniqueLink}`;
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome, {user.firstName}!</h1>
            <p className="text-lg text-gray-600 mb-6">Here are your scheduled interviews.</p>
            
            {isLoading && <p className="text-center p-4">Loading interviews...</p>}
            {error && <p className="text-center p-4 text-red-500">{error}</p>}

            <div className="space-y-4">
                {!isLoading && sessions.length > 0 ? (
                    sessions.map(session => (
                        <div key={session._id} className="p-4 bg-white rounded-lg shadow-md flex flex-wrap justify-between items-center gap-4">
                            <div>
                                <h2 className="text-xl font-semibold">{session.template.title}</h2>
                                <p className="text-gray-500">
                                    Status: <span className="font-medium text-gray-800 capitalize">{session.status.replace('_', ' ')}</span>
                                </p>
                                <p className="text-gray-500">
                                    Scheduled for: {new Date(session.scheduledAt).toLocaleString()}
                                </p>
                            </div>
                            <button
                                onClick={() => handleStartInterview(session.uniqueLink)}
                                disabled={session.status !== 'scheduled'}
                                className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {session.status === 'scheduled' ? 'Start Interview' : 'View Status'}
                            </button>
                        </div>
                    ))
                ) : (
                    !isLoading && <p className="text-center text-gray-500 p-4">You have no interviews scheduled at this time.</p>
                )}
            </div>
        </div>
    );
};

export default CandidateDashboard;