import React, { useState, useRef } from 'react';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import * as apiClient from '../services/apiClient';

// Enum for the different states of the recorder
const RecorderState = {
    IDLE: 'idle',
    RECORDING: 'recording',
    PROCESSING: 'processing',
    REVIEWING: 'reviewing',
};

/**
 * AudioRecorder Component
 * @param {object} props - Component props.
 * @param {function} props.onSubmission - Callback with { transcription, audioFileUrl }.
 * @param {boolean} props.isSubmitting - Flag to disable buttons during parent submission.
 */
const AudioRecorder = ({ onSubmission, isSubmitting }) => {
    const [recorderState, setRecorderState] = useState(RecorderState.IDLE);
    const [transcript, setTranscript] = useState('');
    const [processingError, setProcessingError] = useState('');
    const [refinedAudioUrl, setRefinedAudioUrl] = useState('');

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const {
        isRecording,
        startListening,
        stopListening,
    } = useSpeechRecognition({
        onResult: (newChunk) => setTranscript(current => current + newChunk),
    });

    const handleStartRecording = async () => {
        setTranscript('');
        setProcessingError('');
        setRefinedAudioUrl('');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = () => {
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            startListening();
            setRecorderState(RecorderState.RECORDING);
        } catch (err) {
            console.error("Error starting recording:", err);
            setProcessingError("Could not access microphone. Please check your browser permissions.");
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
        }
        stopListening();
        setRecorderState(RecorderState.REVIEWING);
    };

    const handleRefineTranscript = async () => {
        if (audioChunksRef.current.length === 0) {
            setProcessingError("No audio was recorded to refine.");
            return;
        }
        setRecorderState(RecorderState.PROCESSING);
        setProcessingError('');

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        try {
            const result = await apiClient.transcribeAudio(audioBlob);
            setTranscript(result.transcription);
            setRefinedAudioUrl(result.audioFileUrl);
        } catch (err) {
            setProcessingError(err.message || "Failed to refine transcript.");
        } finally {
            setRecorderState(RecorderState.REVIEWING);
        }
    };

    const handleSubmit = () => {
        if (transcript.trim() && refinedAudioUrl) {
            onSubmission({ transcription: transcript, audioFileUrl: refinedAudioUrl });
            setTranscript('');
            setRefinedAudioUrl('');
            setRecorderState(RecorderState.IDLE);
        } else {
            setProcessingError('Please refine the transcript with AI before submitting to get the audio URL.');
        }
    };

    const handleReset = () => {
        if (isRecording) stopListening();
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
        }
        setTranscript('');
        setRefinedAudioUrl('');
        audioChunksRef.current = [];
        setProcessingError('');
        setRecorderState(RecorderState.IDLE);
    };

    const isRecordingOrProcessing = recorderState === RecorderState.RECORDING || recorderState === RecorderState.PROCESSING || isSubmitting;

    return (
        <div className="w-full max-w-2xl mx-auto p-4 border rounded-lg shadow-md bg-gray-50">
            <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder={recorderState === RecorderState.IDLE ? "Click 'Record' to start answering." : "Your transcription will appear here..."}
                className="w-full h-40 p-3 border rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                disabled={isRecordingOrProcessing}
            />

            {processingError && (
                <div className="my-2 p-3 bg-red-100 text-red-800 rounded-md text-center">
                    <p>{processingError}</p>
                </div>
            )}
            
            <div className="flex items-center justify-center flex-wrap gap-4">
                {recorderState === RecorderState.IDLE && (
                     <button onClick={handleStartRecording} className="px-6 py-3 font-semibold rounded-full text-white bg-blue-600 hover:bg-blue-700 w-40">
                        Record
                    </button>
                )}

                {recorderState === RecorderState.RECORDING && (
                     <button onClick={handleStopRecording} className="px-6 py-3 font-semibold rounded-full text-white bg-red-600 hover:bg-red-700 w-40">
                        Stop
                    </button>
                )}

                {recorderState === RecorderState.REVIEWING && (
                    <>
                        <button onClick={handleRefineTranscript} disabled={!audioChunksRef.current.length} className="px-6 py-3 font-semibold rounded-full text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 w-40">
                            Transcribe
                        </button>
                        <button onClick={handleSubmit} disabled={!transcript.trim() || !refinedAudioUrl || isSubmitting} className="px-6 py-3 font-semibold rounded-full text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 w-40">
                            {isSubmitting ? 'Submitting...' : 'Submit Answer'}
                        </button>
                    </>
                )}

                 {recorderState === RecorderState.PROCESSING && (
                    <div className="w-40 text-center text-gray-600">Refining...</div>
                )}
                
                <button onClick={handleReset} disabled={isRecordingOrProcessing} className="px-6 py-3 font-semibold rounded-full text-gray-700 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors w-40">
                    Reset
                </button>
            </div>
        </div>
    );
};

export default AudioRecorder;