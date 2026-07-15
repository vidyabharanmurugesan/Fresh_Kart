import api from './api';

export const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  async signup(userData) {
    const response = await api.post('/auth/signup', userData);
    return response.data;
  },

  async googleAuth(authData) {
    const response = await api.post('/auth/google', authData);
    return response.data;
  },

  async getMe(token) {
    const response = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async logout() {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  async sendOtp(phone) {
    const response = await api.post('/auth/send-otp', { phone });
    return response.data;
  },

  async verifyOtp(phone, code) {
    const response = await api.post('/auth/verify-otp', { phone, code });
    return response.data;
  },

  async getSellers() {
    const response = await api.get('/auth/sellers');
    return response.data.sellers;
  },

  async getUsersByRole(role) {
    const response = await api.get(`/auth/users?role=${role}`);
    return response.data.users;
  },

  async approveUser(userId, approved = true) {
    const response = await api.put(`/auth/approve/${userId}`, { approved });
    return response.data;
  },

  async downloadSystemReport(reportType = 'all') {
    const response = await api.get(`/auth/system-report/pdf?type=${reportType}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  async uploadLicenseImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/auth/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async uploadSystemLogo(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/auth/system-logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async updateProfile(userData) {
    const response = await api.put('/auth/me', userData);
    return response.data;
  },

  async downloadLicense() {
    const response = await api.get('/auth/license', {
      responseType: 'blob',
    });
    return response.data;
  }
};
