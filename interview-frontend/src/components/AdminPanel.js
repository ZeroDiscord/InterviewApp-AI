import React, { useState, useEffect } from 'react';
import * as apiClient from '../services/apiClient';
import SummaryPage from '../pages/SummaryPage';

/**
 * AdminPanel Component
 * Provides UI for administrative tasks like creating interview templates and viewing session reports.
 */
const AdminPanel = () => {
    // State for creating a new interview template
    const [templateData, setTemplateData] = useState({
        title: '',
        jobDescription: '',
        numberOfQuestions: 5,
        difficultyLevel: 'intermediate',
    });

    // --- NEW: State for the paginated reports table ---
    const [completedSessions, setCompletedSessions] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    const [reportToView, setReportToView] = useState(null);

    // Common state
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Fetch completed sessions when the component mounts or the page changes
    useEffect(() => {
        const fetchCompleted = async () => {
            setIsLoading(true);
            setError('');
            try {
                const response = await apiClient.getCompletedSessions(pagination.page);
                setCompletedSessions(response.data || []);
                setPagination(response.pagination || { page: 1, totalPages: 1 });
            } catch (err) {
                setError(err.message || "Failed to fetch completed interviews.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchCompleted();
    }, [pagination.page]);


    const handleTemplateInputChange = (e) => {
        const { name, value } = e.target;
        setTemplateData(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateTemplate = async (e) => {
        e.preventDefault();
        if (!templateData.title || !templateData.jobDescription) {
            setError('Title and Job Description are required.');
            return;
        }
        setIsLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            await apiClient.createTemplate(templateData);
            setSuccessMessage(`Successfully created template: "${templateData.title}"!`);
            setTemplateData({ title: '', jobDescription: '', numberOfQuestions: 5, difficultyLevel: 'intermediate' });
        } catch (err) {
            setError(err.message || 'Failed to create template.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, page: newPage }));
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-8 bg-gray-100 rounded-lg shadow-inner">
            <h2 className="text-3xl font-bold text-center mb-8">Admin Panel</h2>

            {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
            {successMessage && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{successMessage}</div>}

            <div className="grid md:grid-cols-2 gap-8">
                {/* --- Create Interview Template Form --- */}
                <div className="p-6 bg-white rounded-lg shadow-md self-start">
                    <h3 className="text-2xl font-semibold mb-4">Create New Template</h3>
                    <form onSubmit={handleCreateTemplate} className="space-y-4">
                        {/* ... form inputs for template creation ... */}
                        <div>
                            <label htmlFor="title" className="block text-gray-700 font-medium mb-1">Template Title</label>
                            <input type="text" name="title" id="title" value={templateData.title} onChange={handleTemplateInputChange} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500" placeholder="e.g., Senior ML Engineer" required />
                        </div>
                        <div>
                            <label htmlFor="jobDescription" className="block text-gray-700 font-medium mb-1">Job Description</label>
                            <textarea name="jobDescription" id="jobDescription" value={templateData.jobDescription} onChange={handleTemplateInputChange} className="w-full p-2 border rounded-md" rows="6" placeholder="Paste the full job description here..." required />
                        </div>
                        <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400">
                            {isLoading ? 'Creating...' : 'Create Template'}
                        </button>
                    </form>
                </div>

                {/* --- Completed Interviews Table --- */}
                <div className="p-6 bg-white rounded-lg shadow-md">
                    <h3 className="text-2xl font-semibold mb-4">Completed Interview Reports</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interview</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {completedSessions.map((session) => (
                                    <tr key={session._id}>
                                        <td className="px-6 py-4 whitespace-nowrap">{session.candidate?.firstName} {session.candidate?.lastName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{session.template?.title}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{new Date(session.completedAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button onClick={() => setReportToView(session._id)} className="text-indigo-600 hover:text-indigo-900">View Report</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination Controls */}
                    <div className="mt-4 flex justify-between items-center">
                        <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page <= 1} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50">
                            Previous
                        </button>
                        <span>Page {pagination.page} of {pagination.totalPages}</span>
                        <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50">
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {reportToView && (
                <div className="mt-8">
                    <button onClick={() => setReportToView(null)} className="mb-4 text-indigo-600 hover:text-indigo-900">&larr; Back to List</button>
                    <SummaryPage sessionId={reportToView} />
                </div>
            )}
        </div>
    );
};

export default AdminPanel;