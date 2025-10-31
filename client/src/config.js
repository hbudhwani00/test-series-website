// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Remove /api suffix to get base URL
export const BASE_URL = API_BASE_URL.replace('/api', '');

// Full API URL (with /api)
export const API_URL = API_BASE_URL;

export default {
  API_URL,
  BASE_URL,
  API_BASE_URL
};
