import React from 'react';
import { Card, CardContent, Typography, Box, Icon } from '@mui/material';

const ScoreCard = ({ title, score, icon, color }) => {
    return (
        <Card sx={{ 
            backgroundColor: '#1E1E1E',
            border: '1px solid #2c2c2c',
            borderRadius: 3, 
            height: '100%'
        }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography sx={{ fontWeight: 600, color: '#bdbdbd' }}>
                        {title}
                    </Typography>
                    <Icon sx={{ color: color, fontSize: 28 }}>{icon}</Icon>
                </Box>
                <Box>
                    <Typography variant="h3" component="div" sx={{ fontWeight: 700, color: '#fff' }}>
                        {score}%
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
};

export default ScoreCard; 