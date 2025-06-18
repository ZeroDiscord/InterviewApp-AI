import React from 'react';

/**
 * A page that displays instructions to the candidate before they begin their interview.
 * @param {object} props - Component props.
 * @param {function} props.onBegin - Callback function to call when the user clicks "Begin Interview".
 */
const InstructionsPage = ({ onBegin }) => {
    return (
        <div className="max-w-3xl mx-auto p-4 md:p-8">
            <div className="bg-white shadow-xl rounded-lg p-8">
                <h1 className="text-4xl font-bold text-center text-gray-800 mb-6">Interview Instructions</h1>
                
                <p className="text-lg text-gray-700 mb-6">
                    Welcome to your AI-powered interview. Please read the following instructions carefully before you begin.
                </p>

                <div className="space-y-4 text-gray-600">
                    <div className="flex items-start">
                        <span className="text-blue-600 font-bold text-xl mr-4 mt-1">1.</span>
                        <p>You will be presented with a series of questions one by one. Ensure you have a stable internet connection.</p>
                    </div>
                    <div className="flex items-start">
                        <span className="text-blue-600 font-bold text-xl mr-4 mt-1">2.</span>
                        <p>For each question, you must click the "Record" button to start your answer and "Stop" when you have finished. Your microphone and camera must be enabled.</p>
                    </div>
                     <div className="flex items-start">
                        <span className="text-blue-600 font-bold text-xl mr-4 mt-1">3.</span>
                        <p>After stopping the recording, the system will automatically transcribe and submit your answer. This process is fully automated.</p>
                    </div>
                    <div className="flex items-start">
                        <span className="text-blue-600 font-bold text-xl mr-4 mt-1">4.</span>
                        <p className="font-semibold text-red-600">You cannot go back to a previous question. Once you proceed, your previous answer is final.</p>
                    </div>
                    <div className="flex items-start">
                        <span className="text-blue-600 font-bold text-xl mr-4 mt-1">5.</span>
                        <p>Please ensure you are in a quiet environment to allow for clear audio recording and accurate transcription.</p>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <button 
                        onClick={onBegin}
                        className="w-full sm:w-auto px-12 py-4 bg-green-600 text-white font-bold text-lg rounded-lg shadow-md hover:bg-green-700 transition-transform hover:scale-105"
                    >
                        I Understand, Begin Interview
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InstructionsPage;