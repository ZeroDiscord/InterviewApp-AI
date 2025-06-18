import { useState, useEffect, useRef, useCallback } from 'react';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const isSupported = !!SpeechRecognition;

/**
 * Custom hook for handling speech recognition.
 * Provides real-time transcription by using interim results.
 */
const useSpeechRecognition = ({ onTranscriptUpdate }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [error, setError] = useState('');
    const recognitionRef = useRef(null);
    const finalTranscriptRef = useRef(''); // Use a ref to accumulate final transcript parts

    const processResults = useCallback((event) => {
        let interimTranscript = '';
        // Loop through all results.
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            // If the result is final, append it to our ref.
            if (event.results[i].isFinal) {
                finalTranscriptRef.current += event.results[i][0].transcript + ' ';
            } else {
                // Otherwise, it's an interim result.
                interimTranscript += event.results[i][0].transcript;
            }
        }
        
        // Update the view with the final parts plus the current interim part.
        if (onTranscriptUpdate) {
            onTranscriptUpdate(finalTranscriptRef.current + interimTranscript);
        }
    }, [onTranscriptUpdate]);

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isRecording) {
            setError('');
            finalTranscriptRef.current = ''; // Reset the transcript ref on start
            setIsRecording(true);
            try {
                recognitionRef.current.start();
            } catch (e) {
                console.error("Speech recognition could not be started: ", e);
                setError("Speech recognition failed to start. It might be already active.");
                setIsRecording(false);
            }
        }
    }, [isRecording]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isRecording) {
            recognitionRef.current.stop();
            setIsRecording(false);
        }
    }, [isRecording]);

    useEffect(() => {
        if (!isSupported) {
            setError("Speech recognition is not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognitionRef.current = recognition;
        
        const handleError = (event) => {
            console.error('Speech Recognition Error:', event.error);
            // The "network" error is common if the connection drops. We inform the user.
            setError(`Recognition error: ${event.error}. Please check your network connection.`);
            setIsRecording(false);
        };
        
        const handleEnd = () => {
            setIsRecording(false);
        };

        recognition.addEventListener('result', processResults);
        recognition.addEventListener('error', handleError);
        recognition.addEventListener('end', handleEnd);

        return () => {
            recognition.removeEventListener('result', processResults);
            recognition.removeEventListener('error', handleError);
            recognition.removeEventListener('end', handleEnd);
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [processResults]);

    return {
        isRecording,
        error,
        isSupported,
        startListening,
        stopListening,
    };
};

export default useSpeechRecognition;