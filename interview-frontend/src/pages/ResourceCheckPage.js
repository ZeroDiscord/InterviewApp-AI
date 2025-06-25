import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Paper, Button, CircularProgress, Alert } from '@mui/material';

const ResourceCheckPage = ({ onSuccess }) => {
    const [micStatus, setMicStatus] = useState('pending');
    const [error, setError] = useState('');
    const [micLevel, setMicLevel] = useState(0);
    const streamRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const animationRef = useRef(null);

    useEffect(() => {
        setError('');
        setMicStatus('pending');
        // Request only microphone
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                streamRef.current = stream;
                try {
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    audioContextRef.current = audioContext;
                    const source = audioContext.createMediaStreamSource(stream);
                    const analyser = audioContext.createAnalyser();
                    analyser.fftSize = 256;
                    source.connect(analyser);
                    analyserRef.current = analyser;
                    setMicStatus('ok');
                    // Animate mic level
                    const updateMic = () => {
                        const data = new Uint8Array(analyser.frequencyBinCount);
                        analyser.getByteFrequencyData(data);
                        const avg = data.reduce((a, b) => a + b, 0) / data.length;
                        setMicLevel(avg);
                        animationRef.current = requestAnimationFrame(updateMic);
                    };
                    updateMic();
                } catch (e) {
                    setMicStatus('error');
                    setError('Microphone not working or permission denied.');
                }
            })
            .catch(err => {
                setError('Microphone not accessible. Please allow access and retry.');
                setMicStatus('error');
            });
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    const canContinue = micStatus === 'ok';

    return (
        <Box sx={{ minHeight: '100vh', background: 'radial-gradient(ellipse at top left, #232526 60%, #181818 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, fontFamily: 'Inter, Roboto, Arial, sans-serif' }}>
            <Paper elevation={3} sx={{ p: { xs: 2, sm: 5 }, maxWidth: 600, width: '100%', mx: 2, background: 'rgba(24, 24, 24, 0.98)', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)', color: '#fff', borderRadius: 3, fontFamily: 'inherit' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff', mb: 2, textAlign: 'center', fontFamily: 'inherit', letterSpacing: 0.5 }}>
                    Microphone Check
                </Typography>
                <Typography variant="subtitle1" sx={{ color: '#bdbdbd', fontWeight: 400, mb: 4, textAlign: 'center', fontFamily: 'inherit' }}>
                    Please ensure your microphone is working before starting the interview.
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 3 }}>
                    <Box>
                        <Typography sx={{ color: '#FFE066', fontWeight: 700, mb: 1 }}>Microphone Test</Typography>
                        <Box sx={{ width: '100%', height: 24, background: '#222', borderRadius: 8, overflow: 'hidden', mb: 1, position: 'relative' }}>
                            <Box sx={{ width: `${Math.min(100, Math.round(micLevel))}%`, height: '100%', background: micLevel > 10 ? '#4caf50' : '#ff5252', transition: 'width 0.2s' }} />
                        </Box>
                        {micStatus === 'pending' && <Typography sx={{ color: '#bdbdbd' }}>Checking microphone...</Typography>}
                        {micStatus === 'ok' && <Typography sx={{ color: '#4caf50' }}>Microphone working!</Typography>}
                        {micStatus === 'error' && <Typography sx={{ color: '#ff5252' }}>Microphone not working.</Typography>}
                    </Box>
                </Box>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <Box sx={{ mt: 4, textAlign: 'center' }}>
                    <Button
                        onClick={onSuccess}
                        variant="contained"
                        color="primary"
                        sx={{ py: 1.5, px: 6, minWidth: '220px', fontSize: '1.1rem', fontWeight: 700, fontFamily: 'inherit', borderRadius: 1.5, boxShadow: 'none', background: canContinue ? '#FFE066' : '#bdbdbd', color: canContinue ? '#181818' : '#fff', pointerEvents: canContinue ? 'auto' : 'none', transition: 'all 0.2s' }}
                        disabled={!canContinue}
                    >
                        Continue
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};

export default ResourceCheckPage; 