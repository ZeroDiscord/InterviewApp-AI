import React from 'react';

/**
 * A purely presentational component for displaying the final report summary.
 * It receives the fully populated report object as a prop.
 */
const SummaryPage = ({ reportData: report }) => {
    if (!report) {
        return <div className="text-center p-12">Report data is not available.</div>;
    }

    const { overallScore, recommendation, strengths, areasForImprovement, session } = report;
    const { candidate, template } = session || {};

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
                                <p className="text-green-700 whitespace-pre-wrap">{Array.isArray(strengths) ? strengths.join('\n') : (strengths && typeof strengths === 'string') ? strengths : 'No specific strengths highlighted.'}</p>
                            </div>
                            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                <h4 className="font-bold text-red-800 mb-2">Areas for Improvement</h4>
                                <p className="text-red-700 whitespace-pre-wrap">{Array.isArray(areasForImprovement) ? areasForImprovement.join('\n') : (areasForImprovement && typeof areasForImprovement === 'string') ? areasForImprovement : 'No specific areas for improvement highlighted.'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SummaryPage;
