import React, { useState, useEffect, useCallback } from 'react';
import * as apiClient from '../services/apiClient';
import SummaryPage from './SummaryPage'; // We will re-use the summary component

const TabButton = ({ children, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold rounded-t-lg focus:outline-none transition-colors ${
            isActive 
                ? 'bg-white border-b-0 border-gray-300 text-blue-600' 
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        }`}
    >
        {children}
    </button>
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
        if (isLoading) return <div className="p-8 text-center">Loading Report Details...</div>;
        if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

        switch (activeTab) {
            case 'questions':
                return <QuestionsListView questions={sessionDetails?.questions || []} />;
            case 'breakdown':
                return <BreakdownView responses={sessionResponses} pagination={pagination} onPageChange={handlePageChange} />;
            case 'summary':
            default:
                return reportData ? <SummaryPage reportData={reportData} /> : <p>No summary available.</p>;
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="mb-4">
                <button onClick={onBack} className="text-blue-600 hover:text-blue-800 font-semibold">&larr; Back to Admin Panel</button>
            </div>
            <div className="border-b border-gray-300 mb-0">
                <TabButton isActive={activeTab === 'summary'} onClick={() => setActiveTab('summary')}>Overall Summary</TabButton>
                <TabButton isActive={activeTab === 'questions'} onClick={() => setActiveTab('questions')}>Questions List</TabButton>
                <TabButton isActive={activeTab === 'breakdown'} onClick={() => setActiveTab('breakdown')}>Response Breakdown</TabButton>
            </div>
            <div className="bg-white rounded-b-lg shadow-xl">
                {renderTabContent()}
            </div>
        </div>
    );
};


// --- Sub-components for the tabs ---

const QuestionsListView = ({ questions }) => (
    <div className="p-6 space-y-4">
        {questions.map((q, index) => (
            <div key={q._id} className="p-4 border rounded-md bg-gray-50">
                <h4 className="font-bold text-lg text-gray-800">Q{index + 1}: {q.questionText}</h4>
                <div className="mt-2 pl-4 border-l-4 border-blue-200">
                    <p className="font-semibold text-sm text-gray-600">Ideal Answer:</p>
                    <p className="text-gray-700 italic">{q.idealAnswer}</p>
                    <p className="font-semibold text-sm text-gray-600 mt-2">Keywords:</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                        {q.keywords.map(kw => <span key={kw} className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{kw}</span>)}
                    </div>
                </div>
            </div>
        ))}
    </div>
);


const BreakdownView = ({ responses, pagination, onPageChange }) => (
    <div className="p-6">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate's Answer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Audio</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {responses.map((res) => (
                        <tr key={res._id}>
                            <td className="px-6 py-4 whitespace-pre-wrap w-1/3 font-medium">{res.questionText}</td>
                            <td className="px-6 py-4 whitespace-pre-wrap w-1/3 italic">"{res.transcribedText}"</td>
                            <td className="px-6 py-4 whitespace-nowrap text-lg font-bold">{(res.aiScore).toFixed(1)}%</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <audio controls src={`http://localhost:5000${res.audioFileUrl}`} className="w-full max-w-xs" />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        <div className="mt-4 flex justify-between items-center">
            <button onClick={() => onPageChange(pagination.page - 1)} disabled={pagination.page <= 1} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50">
                Previous
            </button>
            <span>Page {pagination.page} of {pagination.totalPages}</span>
            <button onClick={() => onPageChange(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50">
                Next
            </button>
        </div>
    </div>
);


export default DetailedReportPage;