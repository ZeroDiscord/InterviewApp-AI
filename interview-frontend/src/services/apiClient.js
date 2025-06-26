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
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.indexOf('application/json') !== -1) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            } else {
                const errorText = await response.text();
                throw new Error(errorText || `HTTP error! status: ${response.status}`);
            }
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
export const getCompletedSessions = (page = 1, limit = 5) => request(`/interview/sessions/completed?page=${page}&limit=${limit}`);

/**
 * Fetches the full session details for an admin, including ideal answers.
 * @param {string} sessionId The ID of the session.
 */
export const getSessionDetailsForAdmin = (sessionId) => request(`/interview/sessions/${sessionId}/details`);

/**
 * Fetches the paginated list of individual candidate responses for a session.
 * @param {string} sessionId The ID of the session.
 * @param {number} page The page number to fetch.
 */
export const getSessionResponses = (sessionId, page = 1) => request(`/reports/${sessionId}/responses?page=${page}`);
export const generateReport = (sessionId) => request(`/reports/${sessionId}`, { method: 'POST' });
export const getReport = (sessionId) => request(`/reports/${sessionId}`);

export const markSessionCompletedOrTerminated = (sessionId, data) =>
  request(`/interview/sessions/${sessionId}/complete`, { method: 'POST', body: JSON.stringify(data) });

/**
 * Submits a decision for an interview session.
 * @param {string} sessionId - The ID of the interview session.
 * @param {'approved' | 'rejected'} decision - The decision status.
 * @param {string} [comments] - Optional feedback comments.
 */
export const submitDecision = (sessionId, { decision, comments }) => 
  request(`/interview/sessions/${sessionId}/decision`, {
    method: 'POST',
    body: JSON.stringify({ decision, comments }),
  });

/**
 * Handles exporting a report as either CSV or PDF and triggers a file download.
 * @param {string} sessionId - The ID of the interview session.
 * @param {'csv' | 'pdf'} type - The desired export format.
 */
export const exportReport = async (sessionId, type) => {
    const url = `${API_BASE_URL}/reports/${sessionId}/export${type === 'pdf' ? '/pdf' : ''}`;
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };

    try {
        const response = await fetch(url, { headers });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Export failed.');
        }

        const blob = await response.blob();
        const fileName = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replaceAll('"', '') || `report_${sessionId}.${type}`;
        
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(link.href);

    } catch (error) {
        console.error(`Export Error: ${error.message}`);
        throw error;
    }
};