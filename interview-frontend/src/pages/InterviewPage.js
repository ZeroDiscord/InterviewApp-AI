import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as apiClient from '../services/apiClient';
import AudioRecorder from '../components/AudioRecorder';
import { Box, Typography, Paper, Button, CircularProgress } from '@mui/material';

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

    useEffect(() => {
        if (!currentQuestion) return;
        const timerKey = `timerEndTime-${sessionData._id}-${currentQuestion._id}`;
        let endTime = localStorage.getItem(timerKey);
        if (!endTime) {
            endTime = Date.now() + currentQuestion.timeLimitSeconds * 1000;
            localStorage.setItem(timerKey, endTime);
        }
        const updateTimer = () => {
            const remaining = Math.round((endTime - Date.now()) / 1000);
            if (remaining <= 0) {
                setTimeLeft(0);
                clearInterval(timerRef.current);
                if (!isSubmitting) {
                    setAutoSubmitMessage("Auto-Submitting | Time limit Exhausted");
                    handleAnswerSubmit({ transcription: "[Time Expired]", audioFileUrl: "N/A" });
                }
            } else {
                setTimeLeft(remaining);
            }
        };
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        timerRef.current = setInterval(updateTimer, 1000);
        updateTimer();
        return () => clearInterval(timerRef.current);
    }, [currentQuestion, sessionData, handleAnswerSubmit, isSubmitting]);

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
    }, []);

    useEffect(() => {
        if (mediaStream && videoRef.current) {
            videoRef.current.srcObject = mediaStream;
        }
    }, [mediaStream]);
    
    if (isLoading) return <Box sx={{ textAlign: 'center', p: 12, color: '#bdbdbd', fontFamily: 'Inter, Roboto, Arial, sans-serif' }}><CircularProgress sx={{ color: '#FFE066' }} /></Box>;
    if (error) return <Box sx={{ textAlign: 'center', p: 12, background: '#2d1a1a', color: '#ff5252', borderRadius: 2, fontFamily: 'Inter, Roboto, Arial, sans-serif' }}>{error}</Box>;
    if (!sessionData || !currentQuestion) return <Box sx={{ textAlign: 'center', p: 12, color: '#bdbdbd', fontFamily: 'Inter, Roboto, Arial, sans-serif' }}>Could not load question data.</Box>;

    const formatTime = (seconds) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: 'radial-gradient(ellipse at top left, #232526 60%, #181818 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                py: 6,
                fontFamily: 'Inter, Roboto, Arial, sans-serif',
            }}
        >
            <Box sx={{ width: '100%', maxWidth: 1100 }}>
                <Box sx={{ textAlign: 'center', mb: 6 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff', fontFamily: 'inherit', letterSpacing: 0.5 }}>{sessionData.template.title}</Typography>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 6 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <Paper elevation={3} sx={{ width: '100%', p: 4, background: '#232526', borderRadius: 2, boxShadow: '0 4px 24px 0 #0002', fontFamily: 'inherit' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#FFE066', fontFamily: 'inherit' }}>Question {currentQuestionIndex + 1} of {sessionData.questions.length}</Typography>
                                <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#ff5252', fontFamily: 'inherit' }}>Time Left: {formatTime(timeLeft)}</Typography>
                            </Box>
                            <Typography sx={{ fontSize: '1.15rem', color: '#fff', fontFamily: 'inherit', lineHeight: 1.7 }}>{currentQuestion.questionText}</Typography>
                        </Paper>
                        <Paper elevation={3} sx={{ width: '100%', p: 4, background: '#232526', borderRadius: 2, boxShadow: '0 4px 24px 0 #0002', fontFamily: 'inherit' }}>
                            {isSubmitting ? (
                                <Box sx={{ textAlign: 'center', color: '#bdbdbd', fontWeight: 600, p: 4, fontFamily: 'inherit' }}>
                                    <Typography>{autoSubmitMessage || "Submitting your answer..."}</Typography>
                                </Box>
                            ) : submissionData ? (
                                <Box sx={{ textAlign: 'center' }}>
                                    <Box sx={{ mb: 4, p: 3, background: '#181818', border: '1px solid #232526', borderRadius: 2, textAlign: 'left', fontFamily: 'inherit' }}>
                                        <Typography sx={{ color: '#bdbdbd', fontWeight: 600, fontFamily: 'inherit' }}>Your transcribed answer (read-only):</Typography>
                                        <Typography sx={{ color: '#fff', fontStyle: 'italic', fontFamily: 'inherit' }}>
                                            "{submissionData.transcription}"
                                        </Typography>
                                    </Box>
                                    <Button
                                        onClick={() => handleAnswerSubmit(submissionData)}
                                        variant="outlined"
                                        sx={{
                                            color: '#FFE066',
                                            borderColor: '#FFE066',
                                            borderWidth: 2,
                                            borderRadius: 1.5,
                                            py: 1.5,
                                            px: 6,
                                            minWidth: '220px',
                                            fontSize: '1.1rem',
                                            fontWeight: 700,
                                            fontFamily: 'inherit',
                                            boxShadow: 'none',
                                            transition: 'all 0.2s',
                                            '&:hover': {
                                                backgroundColor: '#FFE066',
                                                color: '#181818',
                                                borderColor: '#FFE066',
                                                boxShadow: '0 0 16px 0 #ffe06644',
                                            },
                                        }}
                                    >
                                        Submit & Continue
                                    </Button>
                                </Box>
                            ) : (
                                <AudioRecorder onTranscriptionComplete={handleTranscriptionComplete} stream={mediaStream} />
                            )}
                        </Paper>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <Paper elevation={3} sx={{ p: 3, background: '#232526', borderRadius: 2, boxShadow: '0 4px 24px 0 #0002', fontFamily: 'inherit' }}>
                            <Typography sx={{ fontWeight: 700, textAlign: 'center', mb: 2, color: '#bdbdbd', fontFamily: 'inherit' }}>Self-View</Typography>
                            <Box sx={{ background: '#000', borderRadius: 2, overflow: 'hidden', aspectRatio: '16/9', width: '100%' }}>
                                <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }}></video>
                            </Box>
                        </Paper>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default InterviewPage;