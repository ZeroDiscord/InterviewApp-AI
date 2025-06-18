const API_BASE_URL = 'http://localhost:5000/api';

const request = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('token');
    const config = {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
    };
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    try {
        const response = await fetch(url, config);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        return response.status === 204 ? null : response.json();
    } catch (error) {
        console.error(`API Client Error: ${error.message}`);
        throw error;
    }
};

export const transcribeAudio = async (audioBlob) => {
    const url = `${API_BASE_URL}/interview/transcribe`;
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('audio', audioBlob, 'interview-response.webm');
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    try {
        const response = await fetch(url, { method: 'POST', headers, body: formData });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        return response.json();
    } catch (error) {
        console.error(`API Client Error: ${error.message}`);
        throw error;
    }
};

export const register = (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) });
export const login = (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });

export const createTemplate = (templateData) => request('/templates', { method: 'POST', body: JSON.stringify(templateData) });
export const getTemplates = () => request('/templates');

export const getCandidates = () => request('/users?role=candidate');

export const createSession = (sessionData) => request('/interview/sessions', { method: 'POST', body: JSON.stringify(sessionData) });
export const getSessionByLink = (uniqueLink) => request(`/interview/sessions/${uniqueLink}`);
export const submitResponse = (sessionId, responseData) => request(`/interview/sessions/${sessionId}/responses`, { method: 'POST', body: JSON.stringify(responseData) });
export const getMySessions = () => request('/interview/sessions/my-sessions');


/**
 * NEW: Fetches a paginated list of completed interview sessions.
 * @param {number} page - The page number to fetch.
 * @param {number} limit - The number of results per page.
 */
export const getCompletedSessions = (page = 1, limit = 5) => {
    return request(`/interview/sessions/completed?page=${page}&limit=${limit}`);
};


export const generateReport = (sessionId) => request(`/reports/${sessionId}`, { method: 'POST' });
export const getReport = (sessionId) => request(`/reports/${sessionId}`);