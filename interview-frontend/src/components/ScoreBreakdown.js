import React from 'react';

/**
 * A component to display the detailed score breakdown from the AI evaluation.
 * @param {object} scoreBreakdown - The scoreBreakdown object from the API.
 */
const ScoreBreakdown = ({ scoreBreakdown }) => {
    if (!scoreBreakdown) return null;

    const scores = Object.entries(scoreBreakdown);

    return (
        <div className="mt-4">
            <h4 className="font-semibold text-lg text-gray-800 mb-2">Detailed Scores:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {scores.map(([name, value]) => (
                    <div key={name} className="bg-gray-100 p-4 rounded-lg text-center shadow">
                        <p className="text-sm text-gray-600">{name}</p>
                        {/* FIX: Removed "* 100" as the score is now a percentage from the backend */}
                        <p className="text-2xl font-bold text-blue-600">{value.toFixed(1)}%</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ScoreBreakdown;