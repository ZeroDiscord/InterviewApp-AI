import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Box, Typography } from '@mui/material';

const SkillsRadarChart = ({ data }) => {
    // data should be an array of objects e.g. [{ skill: 'Communication', score: 80 }]
    return (
        <Box sx={{ height: { xs: 300, md: 400 } }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', mb: 2, color: '#fff' }}>
                Skills Distribution
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                    <PolarGrid stroke="#444" />
                    <PolarAngleAxis dataKey="skill" tick={{ fill: '#bdbdbd', fontSize: 14 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'none' }} axisLine={{ stroke: 'none' }} />
                    <Radar name="Candidate" dataKey="score" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#2a2d32',
                            borderColor: '#8884d8',
                            color: '#fff'
                        }}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </Box>
    );
};

export default SkillsRadarChart; 