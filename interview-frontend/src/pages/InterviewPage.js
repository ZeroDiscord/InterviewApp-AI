import React, { useState, useEffect, useRef } from 'react';
import * as apiClient from '../services/apiClient';
import AudioRecorder from '../components/AudioRecorder';
import EvaluationDisplay from '../components/EvaluationDisplay';

const InterviewPage = ({ uniqueLink, onInterviewComplete }) => {
    // --- State Management ---
    const [sessionData, setSessionData] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [evaluation, setEvaluation] = useState(null);

    // UI State
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false); // This will now control our new loading indicator
    const [error, setError] = useState('');

    // Timer and Video Refs
    const [timeLeft, setTimeLeft] = useState(300);
    const timerRef = useRef(null);
    const videoRef = useRef(null);
    
    useEffect(() => {
        if (!uniqueLink) {
            setError("No interview link provided.");
            setIsLoading(false);
            return;
        }
        const fetchSession = async () => {
            try {
                const response = await apiClient.getSessionByLink(uniqueLink);
                setSessionData(response.data);
                setCurrentQuestionIndex(response.data.currentQuestionIndex || 0);
            } catch (err) {
                setError(err.message || 'Could not load interview session.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchSession();
    }, [uniqueLink]);

    useEffect(() => {
        const videoElement = videoRef.current;
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                if (videoElement) videoElement.srcObject = stream;
            } catch (err) {
                console.error("Error accessing camera:", err);
                setError("Could not access your camera. Please check browser permissions.");
            }
        };
        startCamera();
        
        return () => {
            if (videoElement && videoElement.srcObject) {
                videoElement.srcObject.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const currentQuestion = sessionData?.questions[currentQuestionIndex];

    useEffect(() => {
        if (!currentQuestion) return;
        setTimeLeft(currentQuestion.timeLimitSeconds);
        if (timerRef.current) clearInterval(timerRef.current);
        
        timerRef.current = setInterval(() => {
            setTimeLeft(prevTime => {
                if (prevTime <= 1) {
                    clearInterval(timerRef.current);
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, [currentQuestion]);

    const handleAnswerSubmit = async ({ transcription, audioFileUrl }) => {
        if (!transcription || !audioFileUrl) {
            setError("Transcription or audio file URL was missing.");
            return;
        }
        setIsSubmitting(true);
        setError('');
        setEvaluation(null);
        try {
            const responseData = {
                questionId: currentQuestion._id,
                transcribedText: transcription,
                audioFileUrl: audioFileUrl,
                duration: (currentQuestion.timeLimitSeconds - timeLeft),
            };
            const result = await apiClient.submitResponse(sessionData._id, responseData);
            setEvaluation(result.data.evaluation);
        } catch (err) {
            setError(err.message || 'An error occurred while submitting your answer.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleNextQuestion = async () => {
        if (currentQuestionIndex + 1 >= sessionData.questions.length) {
            setIsSubmitting(true);
            try {
                await apiClient.generateReport(sessionData._id);
                onInterviewComplete(sessionData._id);
            } catch (err) {
                setError("Failed to generate the final report.");
                setIsSubmitting(false);
            }
        } else {
            setCurrentQuestionIndex(prev => prev + 1);
            setEvaluation(null);
            setError('');
        }
    };
    
    if (isLoading) return <div className="text-center p-12">Loading Interview...</div>;
    if (error) return <div className="text-center p-12 bg-red-100 text-red-700">{error}</div>;
    if (!sessionData || !currentQuestion) return <div className="text-center p-12">Could not load question data.</div>;

    const formatTime = (seconds) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4 md:p-6">
            <div className="w-full max-w-5xl">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">{sessionData.template.title}</h1>
                    <p className="text-gray-500">Candidate: {sessionData.candidate.firstName} {sessionData.candidate.lastName}</p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="w-full p-6 bg-white rounded-lg shadow-lg">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-gray-700">Question {currentQuestionIndex + 1} of {sessionData.questions.length}</h2>
                                <div className="text-lg font-bold text-red-500">Time Left: {formatTime(timeLeft)}</div>
                            </div>
                            <p className="text-xl text-gray-900 leading-relaxed">{currentQuestion.questionText}</p>
                        </div>
                        
                        {/* --- NEW RENDER LOGIC WITH LOADING STATE --- */}
                        {isSubmitting ? (
                            <div className="flex flex-col items-center justify-center p-10 bg-white rounded-lg shadow-lg">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                <p className="mt-4 text-lg font-semibold text-gray-700">Analyzing your answer...</p>
                                <p className="text-gray-500">Please wait while the AI provides feedback.</p>
                            </div>
                        ) : evaluation ? (
                            <EvaluationDisplay evaluation={evaluation} />
                        ) : (
                            <AudioRecorder onSubmission={handleAnswerSubmit} isSubmitting={isSubmitting} />
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className="p-4 bg-white rounded-lg shadow-lg">
                            <h3 className="font-semibold text-center mb-2">Self-View</h3>
                            <div className="bg-black rounded-md overflow-hidden aspect-video">
                                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
                            </div>
                        </div>
                        
                        <div className="p-4 bg-white rounded-lg shadow-lg text-center">
                            <h3 className="font-semibold mb-2">Navigation</h3>
                            {evaluation && (
                                <button
                                    onClick={handleNextQuestion}
                                    disabled={isSubmitting}
                                    className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-gray-400"
                                >
                                    {isSubmitting ? 'Finalizing...' : (currentQuestionIndex + 1 >= sessionData.questions.length ? 'Finish Interview' : 'Next Question →')}
                                </button>
                            )}
                            {!evaluation && !isSubmitting && (
                                <p className="text-sm text-gray-500">Submit your answer to proceed.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InterviewPage;