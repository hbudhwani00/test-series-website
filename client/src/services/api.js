import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth Services
export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  createAdmin: (data) => api.post('/auth/create-admin', data),
};

// Admin Services
export const adminService = {
  uploadQuestion: (data) => api.post('/admin/questions', data),
  bulkUploadQuestions: (data) => api.post('/admin/questions/bulk', data),
  getQuestions: (params) => api.get('/admin/questions', { params }),
  deleteQuestion: (id) => api.delete(`/admin/questions/${id}`),
  getStudents: () => api.get('/admin/students'),
  getDashboard: () => api.get('/admin/dashboard'),
  getSubjectsChapters: (examType) => api.get(`/admin/subjects-chapters?examType=${examType}`),
};

// Test Services
export const testService = {
  getDemoTests: (examType) => api.get(`/tests/demo?examType=${examType}`),
  generateTest: (data) => api.post('/tests/generate', data),
  getTest: (testId) => api.get(`/tests/${testId}`),
  getMyTests: () => api.get('/tests/my-tests'),
  getTestStructure: (examType) => api.get(`/tests/structure/${examType}`),
};

// Payment Services
export const paymentService = {
  createOrder: (data) => api.post('/payment/create-order', data),
  verifyPayment: (data) => api.post('/payment/verify', data),
  getPlans: () => api.get('/payment/plans'),
  getSubscriptionStatus: () => api.get('/payment/subscription-status'),
};

// Result Services
export const resultService = {
  submitTest: (data) => api.post('/results/submit', data),
  getResult: (resultId) => api.get(`/results/${resultId}`),
  getAllResults: () => api.get('/results/user/all'),
  getResultByTest: (testId) => api.get(`/results/test/${testId}`),
  getUserAnalytics: () => api.get('/results/user/analytics'),
};

export default api;
