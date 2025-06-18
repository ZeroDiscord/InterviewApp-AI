import React, { useState, useEffect, useRef } from 'react';
import * as apiClient from '../services/apiClient';

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
    const [loadingMessage, setLoadingMessage] = useState('Scheduling...'); // NEW: For descriptive messages
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

        // --- Start of Rich Loading UX ---
        setIsLoading(true);
        setError('');
        setSuccessInfo(null);
        let messageIndex = 0;
        setLoadingMessage(loadingMessages[messageIndex]);

        // Cycle through loading messages
        loadingIntervalRef.current = setInterval(() => {
            messageIndex = (messageIndex + 1) % loadingMessages.length;
            setLoadingMessage(loadingMessages[messageIndex]);
        }, 2500); // Change message every 2.5 seconds

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
            // --- End of Rich Loading UX ---
            clearInterval(loadingIntervalRef.current);
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Interviewer Dashboard</h1>

            <div className="p-6 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold mb-4">Schedule New Interview</h2>
                
                {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
                {successInfo && (
                    <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
                        <p className="font-bold">{successInfo.message}</p>
                        <p className="mt-2">Shareable Link: <a href={successInfo.link} target="_blank" rel="noopener noreferrer" className="font-mono underline">{successInfo.link}</a></p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="template" className="block text-gray-700 font-medium mb-1">Interview Template</label>
                        <select id="template" value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)} required className="w-full p-2 border rounded-md bg-white">
                            <option value="" disabled>Select a template...</option>
                            {templates.map(template => (
                                <option key={template._id} value={template._id}>{template.title}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="candidate" className="block text-gray-700 font-medium mb-1">Candidate</label>
                        <select id="candidate" value={selectedCandidate} onChange={(e) => setSelectedCandidate(e.target.value)} required className="w-full p-2 border rounded-md bg-white">
                            <option value="" disabled>Select a candidate...</option>
                            {candidates.map(candidate => (
                                <option key={candidate._id} value={candidate._id}>{`${candidate.firstName} ${candidate.lastName} (${candidate.email})`}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="scheduledAt" className="block text-gray-700 font-medium mb-1">Scheduled Time</label>
                        <input type="datetime-local" id="scheduledAt" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} required className="w-full p-2 border rounded-md"/>
                    </div>
                    
                    <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-all duration-300 ease-in-out">
                        {isLoading ? loadingMessage : 'Schedule Interview'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default DashboardPage;