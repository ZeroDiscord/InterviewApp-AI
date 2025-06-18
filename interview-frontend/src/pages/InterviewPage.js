import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as apiClient from '../services/apiClient';
import AudioRecorder from '../components/AudioRecorder';

const InterviewPage = ({ uniqueLink, onInterviewComplete }) => {
    const [sessionData, setSessionData] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [mediaStream, setMediaStream] = useState(null);
    const [submissionData, setSubmissionData] = useState(null);
    const [autoSubmitMessage, setAutoSubmitMessage] = useState('');
    const [timeLeft, setTimeLeft] = useState(300);

    const timerRef = useRef(null);
    const videoRef = useRef(null);
    
    const handleNextQuestion = useCallback(async () => {
        if (!sessionData) return;

        // Clear localStorage for the completed question
        const oldQuestion = sessionData.questions[currentQuestionIndex];
        if(oldQuestion) {
            localStorage.removeItem(`timerEndTime-${sessionData._id}-${oldQuestion._id}`);
        }

        if (currentQuestionIndex + 1 >= sessionData.questions.length) {
            setIsSubmitting(true);
            try {
                await apiClient.generateReport(sessionData._id);
                onInterviewComplete();
            } catch (err) {
                setError("Failed to generate the final report.");
                setIsSubmitting(false);
            }
        } else {
            setCurrentQuestionIndex(prev => prev + 1);
            setSubmissionData(null);
            setAutoSubmitMessage('');
            setError('');
        }
    }, [sessionData, currentQuestionIndex, onInterviewComplete]);

    const handleAnswerSubmit = useCallback(async (dataToSubmit) => {
        if (isSubmitting) return;
        
        setIsSubmitting(true);
        setError('');
        try {
            const currentQuestion = sessionData.questions[currentQuestionIndex];
            // Get the most up-to-date timeLeft from state for duration calculation
            const duration = currentQuestion.timeLimitSeconds - timeLeft;
            const responseData = {
                questionId: currentQuestion._id,
                transcribedText: dataToSubmit.transcription,
                audioFileUrl: dataToSubmit.audioFileUrl,
                duration,
            };
            await apiClient.submitResponse(sessionData._id, responseData);
            await handleNextQuestion();
        } catch (err) {
            setError(err.message || 'An error occurred while submitting your answer.');
        } finally {
            setIsSubmitting(false);
        }
    }, [sessionData, currentQuestionIndex, timeLeft, handleNextQuestion, isSubmitting]);

    const handleTranscriptionComplete = useCallback((result) => {
        if (result.isEmpty) {
            setAutoSubmitMessage("Auto-Submitting | Your answer was empty");
            handleAnswerSubmit({ transcription: "", audioFileUrl: "N/A" });
        } else {
            setSubmissionData(result);
        }
    }, [handleAnswerSubmit]);
    
    const currentQuestion = sessionData?.questions[currentQuestionIndex];

    // --- FIX: Implement localStorage Timer ---
    useEffect(() => {
        if (!currentQuestion) return;

        const timerKey = `timerEndTime-${sessionData._id}-${currentQuestion._id}`;
        let endTime = localStorage.getItem(timerKey);

        if (!endTime) {
            // If no end time is stored, this is the first time. Set it now.
            endTime = Date.now() + currentQuestion.timeLimitSeconds * 1000;
            localStorage.setItem(timerKey, endTime);
        }

        const updateTimer = () => {
            const remaining = Math.round((endTime - Date.now()) / 1000);
            if (remaining <= 0) {
                setTimeLeft(0);
                clearInterval(timerRef.current);
                // Trigger auto-submit directly if timer hits zero
                if (!isSubmitting) {
                    setAutoSubmitMessage("Auto-Submitting | Time limit Exhausted");
                    handleAnswerSubmit({ transcription: "[Time Expired]", audioFileUrl: "N/A" });
                }
            } else {
                setTimeLeft(remaining);
            }
        };

        // Clear any existing timer before starting a new one
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        
        timerRef.current = setInterval(updateTimer, 1000);
        updateTimer(); // Call immediately to set the initial time correctly

        return () => clearInterval(timerRef.current);
    }, [currentQuestion, sessionData, handleAnswerSubmit, isSubmitting]);


    // --- Media and Session Fetching ---
    useEffect(() => {
        const fetchSession = async () => {
            if (!uniqueLink) {
                setError("No interview link provided.");
                setIsLoading(false);
                return;
            }
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
        const startMedia = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setMediaStream(stream);
            } catch (err) {
                console.error("Error accessing media devices:", err);
                setError("Could not access your camera and microphone. Please check browser permissions.");
            }
        };
        startMedia();
        return () => {
            if (mediaStream) {
                mediaStream.getTracks().forEach(track => track.stop());
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (mediaStream && videoRef.current) {
            videoRef.current.srcObject = mediaStream;
        }
    }, [mediaStream]);
    
    if (isLoading) return <div className="text-center p-12">Loading Interview...</div>;
    if (error) return <div className="text-center p-12 bg-red-100 text-red-700">{error}</div>;
    if (!sessionData || !currentQuestion) return <div className="text-center p-12">Could not load question data.</div>;
    
    const formatTime = (seconds) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4 md:p-6">
            <div className="w-full max-w-5xl">
                <div className="text-center mb-6"><h1 className="text-3xl font-bold text-gray-800">{sessionData.template.title}</h1></div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="w-full p-6 bg-white rounded-lg shadow-lg">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-gray-700">Question {currentQuestionIndex + 1} of {sessionData.questions.length}</h2>
                                <div className="text-lg font-bold text-red-500">Time Left: {formatTime(timeLeft)}</div>
                            </div>
                            <p className="text-xl text-gray-900 leading-relaxed">{currentQuestion.questionText}</p>
                        </div>
                        <div className="w-full p-6 bg-white rounded-lg shadow-lg">
                           {isSubmitting ? (
                                <div className="text-center text-gray-700 font-semibold p-4">
                                    <p>{autoSubmitMessage || "Submitting your answer..."}</p>
                                </div>
                           ) : submissionData ? (
                                <div className="text-center">
                                    <div className="mb-4 p-4 bg-gray-100 border rounded-md text-left">
                                        <p className="text-gray-600 font-medium">Your transcribed answer (read-only):</p>
                                        <p className="text-gray-800 italic">"{submissionData.transcription}"</p>
                                    </div>
                                    <button
                                        onClick={() => handleAnswerSubmit(submissionData)}
                                        className="px-8 py-3 bg-green-600 text-white font-bold rounded-full shadow-lg hover:bg-green-700"
                                    >
                                        Submit & Continue
                                    </button>
                                </div>
                           ) : (
                               <AudioRecorder onTranscriptionComplete={handleTranscriptionComplete} stream={mediaStream} />
                           )}
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="p-4 bg-white rounded-lg shadow-lg">
                            <h3 className="font-semibold text-center mb-2">Self-View</h3>
                            <div className="bg-black rounded-md overflow-hidden aspect-video">
                                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InterviewPage;