import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Change this to your server IP when running on a device
const BASE_URL = 'http://192.168.1.100:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['token', 'user', 'adminToken']);
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  resendOTP: (data) => api.post('/auth/resend-otp', data),
  login: (data) => api.post('/auth/login', data),
  adminLogin: (data) => api.post('/auth/admin-login', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

export const goldAPI = {
  getPrice: () => api.get('/gold/price'),
  buy: (data) => api.post('/gold/buy', data),
  sell: (data) => api.post('/gold/sell', data),
  getTransactions: (params) => api.get('/gold/transactions', { params }),
  getPortfolio: () => api.get('/gold/portfolio'),
};

export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data) => api.put('/user/profile', data),
  changePassword: (data) => api.put('/user/change-password', data),
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserDetail: (id) => api.get(`/admin/users/${id}`),
  toggleUserStatus: (id) => api.put(`/admin/users/${id}/toggle-status`),
  getTransactions: (params) => api.get('/admin/transactions', { params }),
};

export const setAdminToken = async (token) => {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  await AsyncStorage.setItem('adminToken', token);
};

export default api;
