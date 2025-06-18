import React, { useState, useRef, useEffect } from 'react';
import * as apiClient from '../services/apiClient';

const RecorderState = {
    IDLE: 'idle',
    RECORDING: 'recording',
    PROCESSING: 'processing',
};

const supportedMimeTypes = [
    'audio/webm',
    'audio/webm;codecs=opus',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/mp4',
];

/**
 * An AudioRecorder that is decoupled from the submission process.
 * It records, transcribes, and then passes the result to the parent via a callback.
 * @param {object} props - Component props.
 * @param {MediaStream} props.stream - The active audio stream.
 * @param {function} props.onTranscriptionComplete - Callback with { transcription, audioFileUrl, isEmpty }.
 */
const AudioRecorder = ({ stream, onTranscriptionComplete }) => {
    const [recorderState, setRecorderState] = useState(RecorderState.IDLE);
    const [error, setError] = useState('');

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    // Reset component state if the stream prop changes (e.g., when moving to a new question)
    useEffect(() => {
        setRecorderState(RecorderState.IDLE);
        setError('');
    }, [stream]);

    const handleToggleRecording = async () => {
        setError('');

        // --- Start Recording ---
        if (recorderState === RecorderState.IDLE) {
            if (!stream || !stream.active) {
                setError("Microphone stream not available. Please allow access.");
                return;
            }
            const mimeType = supportedMimeTypes.find(type => MediaRecorder.isTypeSupported(type));
            if (!mimeType) {
                setError("Your browser does not support required audio recording formats.");
                return;
            }

            try {
                const audioStream = new MediaStream(stream.getAudioTracks());
                mediaRecorderRef.current = new MediaRecorder(audioStream, { mimeType });
                audioChunksRef.current = [];

                mediaRecorderRef.current.ondataavailable = (event) => {
                    if (event.data.size > 0) audioChunksRef.current.push(event.data);
                };

                mediaRecorderRef.current.onstop = async () => {
                    setRecorderState(RecorderState.PROCESSING);
                    
                    // --- FIX 1: Handle Empty Audio Recording ---
                    // If no audio chunks were recorded, notify the parent that the recording was empty.
                    if (audioChunksRef.current.length === 0) {
                        onTranscriptionComplete({ transcription: "", audioFileUrl: "N/A", isEmpty: true });
                        setRecorderState(RecorderState.IDLE); // Reset for next attempt
                        return;
                    }

                    const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                    
                    try {
                        const result = await apiClient.transcribeAudio(audioBlob);
                        // Pass the successful result up to the parent.
                        onTranscriptionComplete({ 
                            transcription: result.transcription, 
                            audioFileUrl: result.audioFileUrl,
                            isEmpty: false 
                        });
                    } catch (err) {
                        setError(err.message || "Failed to transcribe audio.");
                    } finally {
                        setRecorderState(RecorderState.IDLE); // Reset after processing
                    }
                };

                mediaRecorderRef.current.start();
                setRecorderState(RecorderState.RECORDING);

            } catch (err) {
                console.error("Error starting media recorder:", err);
                setError("Could not start the media recorder. " + err.message);
            }
        } 
        // --- Stop Recording ---
        else if (recorderState === RecorderState.RECORDING) {
            if (mediaRecorderRef.current) {
                mediaRecorderRef.current.stop();
            }
        }
    };

    let buttonText = 'Record';
    let buttonClass = 'bg-blue-600 hover:bg-blue-700';
    if (recorderState === RecorderState.RECORDING) {
        buttonText = 'Stop Recording';
        buttonClass = 'bg-red-600 hover:bg-red-700 animate-pulse';
    } else if (recorderState === RecorderState.PROCESSING) {
        buttonText = 'Processing...';
        buttonClass = 'bg-gray-500';
    }

    return (
        <div className="w-full max-w-2xl mx-auto p-4 text-center">
            <button
                onClick={handleToggleRecording}
                disabled={recorderState === RecorderState.PROCESSING || !stream}
                className={`px-8 py-4 text-xl font-bold rounded-full text-white transition-all duration-300 ease-in-out shadow-lg transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed ${buttonClass}`}
            >
                {buttonText}
            </button>
            
            {error && <p className="text-red-500 mt-4">{error}</p>}
        </div>
    );
};

export default AudioRecorder;