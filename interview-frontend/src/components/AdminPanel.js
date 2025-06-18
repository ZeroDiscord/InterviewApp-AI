import React, { useState, useEffect } from 'react';
import * as apiClient from '../services/apiClient';

const AdminPanel = ({ onViewReport }) => {
    // State for creating a new interview template
    const [templateData, setTemplateData] = useState({
        title: '',
        jobDescription: '',
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
        setIsFormLoading(true); // FIX: Used correct setter name
        setError('');
        setSuccessMessage('');
        try {
            await apiClient.createTemplate(templateData);
            setSuccessMessage(`Successfully created template: "${templateData.title}"!`);
            setTemplateData({ title: '', jobDescription: '' });
        } catch (err) {
            setError(err.message || 'Failed to create template.');
        } finally {
            setIsFormLoading(false); // FIX: Used correct setter name
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
        <div className="max-w-6xl mx-auto p-8 bg-gray-100 rounded-lg shadow-inner">
            <h2 className="text-3xl font-bold text-center mb-8">Admin Panel</h2>

            {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
            {successMessage && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{successMessage}</div>}

            <div className="grid md:grid-cols-2 gap-8 mb-8">
                {/* --- Create New User Form --- */}
                <div className="p-6 bg-white rounded-lg shadow-md self-start">
                    <h3 className="text-2xl font-semibold mb-4">Create New User</h3>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <input type="text" name="firstName" placeholder="First Name" value={newUserData.firstName} onChange={handleUserInputChange} required className="w-full p-2 border rounded-md" />
                            <input type="text" name="lastName" placeholder="Last Name" value={newUserData.lastName} onChange={handleUserInputChange} required className="w-full p-2 border rounded-md" />
                        </div>
                        <input type="email" name="email" placeholder="Email Address" value={newUserData.email} onChange={handleUserInputChange} required className="w-full p-2 border rounded-md" />
                        <input type="password" name="password" placeholder="Password (min 8 chars)" value={newUserData.password} onChange={handleUserInputChange} required className="w-full p-2 border rounded-md" />
                        <input type="tel" name="phone" placeholder="Phone (Optional)" value={newUserData.phone} onChange={handleUserInputChange} className="w-full p-2 border rounded-md" />
                        <select name="role" value={newUserData.role} onChange={handleUserInputChange} required className="w-full p-2 border rounded-md bg-white">
                            <option value="candidate">Candidate</option>
                            <option value="interviewer">Interviewer</option>
                        </select>
                        <button type="submit" disabled={isFormLoading} className="w-full bg-teal-600 text-white py-2 rounded-md hover:bg-teal-700 disabled:bg-gray-400">
                            {isFormLoading ? 'Creating User...' : 'Create User'}
                        </button>
                    </form>
                </div>

                <div className="p-6 bg-white rounded-lg shadow-md self-start">
                    <h3 className="text-2xl font-semibold mb-4">Create New Template</h3>
                    <form onSubmit={handleCreateTemplate} className="space-y-4">
                        <input type="text" name="title" placeholder="Template Title" value={templateData.title} onChange={handleTemplateInputChange} className="w-full p-2 border rounded-md" required />
                        <textarea name="jobDescription" value={templateData.jobDescription} onChange={handleTemplateInputChange} className="w-full p-2 border rounded-md" rows="8" placeholder="Paste the full job description here..." required />
                        <button type="submit" disabled={isFormLoading} className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400">
                            {isFormLoading ? 'Creating Template...' : 'Create Template'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Completed Interviews Table */}
            <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
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
                            {isTableLoading ? (
                                <tr><td colSpan="4" className="text-center p-4">Loading reports...</td></tr>
                            ) : completedSessions.length > 0 ? (
                                completedSessions.map((session) => (
                                    <tr key={session._id}>
                                        <td className="px-6 py-4 whitespace-nowrap">{session.candidate?.firstName} {session.candidate?.lastName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{session.template?.title}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{new Date(session.completedAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button onClick={() => onViewReport(session._id)} className="text-indigo-600 hover:text-indigo-900">View Report</button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="4" className="text-center p-4 text-gray-500">No completed interviews found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="mt-4 flex justify-between items-center">
                    <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page <= 1 || isTableLoading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50">
                        Previous
                    </button>
                    <span>Page {pagination.page} of {pagination.totalPages}</span>
                    <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages || isTableLoading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50">
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;