import React, { useEffect, useState } from 'react';
import * as apiClient from '../services/apiClient';

/**
 * Renders the final report for a completed interview session.
 * It fetches the report data based on the session ID from the URL.
 */
const SummaryPage = ({ sessionId }) => {
    const [report, setReport] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!sessionId) {
            setError("No session ID was provided to generate a report.");
            setIsLoading(false);
            return;
        }

        const fetchReport = async () => {
            setIsLoading(true);
            try {
                // FIX: Use the correct, renamed function 'getReport'
                const response = await apiClient.getReport(sessionId);
                setReport(response.data); // The report data is nested in the 'data' property
            } catch (err) {
                setError(err.message || "Failed to load the interview report. It may still be generating.");
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchReport();
    }, [sessionId]);

    if (isLoading) {
        return <p className="text-center text-lg p-10">Generating final report, please wait...</p>;
    }
    if (error) {
        return <p className="text-center text-lg text-red-500 p-10">{error}</p>;
    }
    if (!report) {
        return <p className="text-center text-lg p-10">No summary data available for this session.</p>;
    }

    // New data structure based on the InterviewReport model
    const { overallScore, recommendation, strengths, areasForImprovement, session } = report;
    const { candidate, template } = session;

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="bg-white shadow-xl rounded-lg p-6">
                <div className="text-center mb-8 border-b pb-4">
                    <h1 className="text-4xl font-bold text-gray-800">Interview Report</h1>
                    <p className="text-xl text-gray-600 capitalize">{template?.title || 'Interview'}</p>
                    <p className="text-sm text-gray-500">
                        Candidate: {candidate?.firstName} {candidate?.lastName}
                    </p>
                </div>

                <div className="text-center bg-gray-100 p-6 rounded-lg mb-8">
                    <h2 className="text-lg font-semibold text-gray-600">Overall Score</h2>
                    <p className={`text-6xl font-extrabold ${overallScore >= 70 ? 'text-green-600' : overallScore >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {Number(overallScore).toFixed(1)}
                        <span className="text-3xl text-gray-500">/100</span>
                    </p>
                    <p className="text-2xl font-bold mt-2 capitalize">
                        Recommendation: {recommendation?.replace('_', ' ') || 'Not available'}
                    </p>
                </div>

                <div className="space-y-6">
                    <div>
                        <h3 className="text-2xl font-bold mb-2 text-gray-700">AI-Generated Summary</h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                <h4 className="font-bold text-green-800 mb-2">Strengths</h4>
                                <p className="text-green-700 whitespace-pre-wrap">{strengths || 'No specific strengths highlighted.'}</p>
                            </div>
                            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                <h4 className="font-bold text-red-800 mb-2">Areas for Improvement</h4>
                                <p className="text-red-700 whitespace-pre-wrap">{areasForImprovement || 'No specific areas for improvement highlighted.'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SummaryPage;