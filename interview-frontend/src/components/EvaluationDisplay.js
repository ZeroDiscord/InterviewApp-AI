import React from 'react';
import ScoreBreakdown from './ScoreBreakdown';

/**
 * A fully modular component to render all details from the evaluation.
 * @param {object} evaluation - The full evaluation object from the API.
 */
const EvaluationDisplay = ({ evaluation }) => {
    if (!evaluation) return null;

    const {
        isCorrect,
        finalWeightedScore,
        detailedAnalysis
    } = evaluation;

    const verdictText = isCorrect ? 'Good Answer' : 'Needs Improvement';

    const Card = ({ title, children, className }) => (
        <div className={`bg-white p-6 rounded-lg shadow-md ${className || ''}`}>
            <h4 className="text-xl font-bold text-gray-700 mb-3 border-b pb-2">{title}</h4>
            {children}
        </div>
    );

    return (
        <div className="w-full max-w-4xl mx-auto my-6 space-y-6">
            <div className={`text-center p-4 rounded-lg shadow-lg ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
                <p className={`text-2xl font-bold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>{verdictText}</p>
                <p className="text-lg text-gray-700 mt-1">
                    {/* FIX: Removed "* 100" as the score is now a percentage from the backend */}
                    Final Weighted Score: <span className="font-extrabold">{finalWeightedScore.toFixed(2)}%</span>
                </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-xl shadow-inner">
                <h3 className="text-2xl font-bold text-center text-gray-800 mb-4">Detailed Analysis</h3>
                <div className="space-y-6">
                    <Card title="Your Answer">
                        <p className="text-gray-800 italic">"{detailedAnalysis.userTranscription}"</p>
                    </Card>

                    <Card title="AI Feedback">
                        <div className="space-y-2">
                            <p>
                                <span className="font-semibold text-green-600">Concepts Mentioned:</span> {detailedAnalysis.feedbackFromAI.conceptsMentioned.join(', ') || 'None'}
                            </p>
                             <p>
                                <span className="font-semibold text-red-600">Concepts Missed:</span> {detailedAnalysis.feedbackFromAI.conceptsMissed.join(', ') || 'None'}
                            </p>
                        </div>
                    </Card>

                    <Card title="Score Breakdown">
                        <ScoreBreakdown scoreBreakdown={detailedAnalysis.scoreBreakdown} />
                    </Card>
                    
                    <Card title="Ideal Answer Comparison" className="bg-blue-50">
                        <p className="text-gray-800 leading-relaxed">{detailedAnalysis.idealAnswer}</p>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default EvaluationDisplay;