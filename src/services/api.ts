import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Update this to your backend URL
// For Android Emulator: use 10.0.2.2 instead of localhost
// For iOS Simulator: localhost works
// For physical devices: use your computer's IP address (found in Expo output)
const getApiBaseUrl = () => {
  if (__DEV__) {
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:5000/api'; // Android emulator
    }
    return 'http://localhost:5000/api'; // iOS simulator
  }
  // Production URL (update when deploying)
  return 'http://10.0.2.2:5000/api';
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, logout user
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

// Feed service
export const feedService = {
  getPosts: async (type: string = 'all', page: number = 1) => {
    const response = await api.get(`/feed?type=${type}&page=${page}`);
    return response.data;
  },
  getPost: async (postId: number) => {
    const response = await api.get(`/feed/${postId}`);
    return response.data;
  },
  createPost: async (content: string, postType: string = 'general') => {
    const response = await api.post('/feed', { content, postType });
    return response.data;
  },
  updatePost: async (postId: number, content: string) => {
    const response = await api.put(`/feed/${postId}`, { content });
    return response.data;
  },
  deletePost: async (postId: number) => {
    const response = await api.delete(`/feed/${postId}`);
    return response.data;
  },
  likePost: async (postId: number) => {
    const response = await api.post(`/feed/${postId}/like`);
    return response.data;
  },
  addComment: async (postId: number, comment: string) => {
    const response = await api.post(`/feed/${postId}/comment`, { comment });
    return response.data;
  },
  deleteComment: async (postId: number, commentId: number) => {
    const response = await api.delete(`/feed/${postId}/comment/${commentId}`);
    return response.data;
  },
};

// Chat service
export const chatService = {
  getGroups: async () => {
    const response = await api.get('/chat/groups');
    return response.data;
  },
  getGroup: async (groupId: number) => {
    const response = await api.get(`/chat/groups/${groupId}`);
    return response.data;
  },
  getGroupMessages: async (groupId: number, page: number = 1) => {
    const response = await api.get(`/chat/groups/${groupId}/messages?page=${page}`);
    return response.data;
  },
  sendGroupMessage: async (groupId: number, message: string) => {
    const response = await api.post(`/chat/groups/${groupId}/messages`, { message });
    return response.data;
  },
  createGroup: async (name: string, description: string, type: string, department?: string) => {
    const response = await api.post('/chat/groups', { name, description, type, department });
    return response.data;
  },
  getDirectConversations: async () => {
    const response = await api.get('/chat/direct');
    return response.data;
  },
  getDirectMessages: async (otherUserId: number, page: number = 1) => {
    const response = await api.get(`/chat/direct/${otherUserId}?page=${page}`);
    return response.data;
  },
  sendDirectMessage: async (receiverId: number, message: string) => {
    const response = await api.post(`/chat/direct/${receiverId}`, { message });
    return response.data;
  },
  // Group Management
  getGroupMembers: async (groupId: number) => {
    const response = await api.get(`/chat/groups/${groupId}/members`);
    return response.data;
  },
  addMember: async (groupId: number, newUserId: number) => {
    const response = await api.post(`/chat/groups/${groupId}/members`, { newUserId });
    return response.data;
  },
  removeMember: async (groupId: number, userId: number) => {
    const response = await api.delete(`/chat/groups/${groupId}/members/${userId}`);
    return response.data;
  },
  updateGroupSettings: async (groupId: number, updates: { name?: string; description?: string; photo?: File }) => {
    const formData = new FormData();
    if (updates.name) formData.append('name', updates.name);
    if (updates.description) formData.append('description', updates.description);
    if (updates.photo) formData.append('photo', updates.photo as any);
    
    const response = await api.put(`/chat/groups/${groupId}/settings`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  leaveGroup: async (groupId: number) => {
    const response = await api.post(`/chat/groups/${groupId}/leave`);
    return response.data;
  },
  getGroupInfo: async (groupId: number) => {
    const response = await api.get(`/chat/groups/${groupId}/info`);
    return response.data;
  },
};

// Document service
export const documentService = {
  getAll: async (type?: string) => {
    const url = type ? `/documents?type=${type}` : '/documents';
    const response = await api.get(url);
    return response.data;
  },
  getDocument: async (documentId: number) => {
    const response = await api.get(`/documents/${documentId}`);
    return response.data;
  },
  download: async (documentId: number) => {
    const response = await api.get(`/documents/${documentId}/download`);
    return response.data;
  },
  getLetterheads: async () => {
    const response = await api.get('/documents/letterheads/all');
    return response.data;
  },
};

// Church email service (for media_head)
export const churchEmailService = {
  getAll: async () => {
    const response = await api.get('/church-emails');
    return response.data;
  },
  getUserEmail: async (userId: number) => {
    const response = await api.get(`/church-emails/user/${userId}`);
    return response.data;
  },
  create: async (userId: number, emailPrefix: string, department: string, position: string, password: string) => {
    const response = await api.post('/church-emails', { userId, emailPrefix, department, position, password });
    return response.data;
  },
  resetPassword: async (emailId: number, newPassword: string) => {
    const response = await api.put(`/church-emails/${emailId}/reset-password`, { newPassword });
    return response.data;
  },
  deactivate: async (emailId: number) => {
    const response = await api.put(`/church-emails/${emailId}/deactivate`);
    return response.data;
  },
  delete: async (emailId: number) => {
    const response = await api.delete(`/church-emails/${emailId}`);
    return response.data;
  },
  getSuggestions: async (position: string) => {
    const response = await api.get(`/church-emails/suggestions/${position}`);
    return response.data;
  },
};

// First-timer service
export const firstTimerService = {
  generateQR: async () => {
    const response = await api.post('/first-timers/generate-qr');
    return response.data;
  },
  register: async (qrCode: string, firstName: string, lastName: string, email?: string, phone?: string, address?: string) => {
    const response = await api.post('/first-timers/register', {
      qrCode,
      firstName,
      lastName,
      email,
      phone,
      address
    });
    return response.data;
  },
  checkIn: async (qrCode: string) => {
    const response = await api.post('/first-timers/check-in', { qrCode });
    return response.data;
  },
  getAll: async () => {
    const response = await api.get('/first-timers');
    return response.data;
  },
  getAttendance: async (firstTimerId: number) => {
    const response = await api.get(`/first-timers/${firstTimerId}/attendance`);
    return response.data;
  },
  promote: async (firstTimerId: number) => {
    const response = await api.post(`/first-timers/${firstTimerId}/promote`);
    return response.data;
  },
  getByQR: async (qrCode: string) => {
    const response = await api.get(`/first-timers/by-qr/${qrCode}`);
    return response.data;
  },
};

// Dashboard service (for media_head)
export const dashboardService = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },
  getEvents: async () => {
    const response = await api.get('/dashboard/events');
    return response.data;
  },
  getAttendance: async (startDate?: string, endDate?: string, serviceType?: string) => {
    let url = '/dashboard/attendance';
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (serviceType) params.append('serviceType', serviceType);
    if (params.toString()) url += `?${params.toString()}`;
    const response = await api.get(url);
    return response.data;
  },
  getGiving: async () => {
    const response = await api.get('/dashboard/giving');
    return response.data;
  },
  getDepartments: async () => {
    const response = await api.get('/dashboard/departments');
    return response.data;
  },
  getRecentActivity: async () => {
    const response = await api.get('/dashboard/recent-activity');
    return response.data;
  },
  getGrowth: async () => {
    const response = await api.get('/dashboard/growth');
    return response.data;
  },
};

// Notification service
export const notificationService = {
  sendEventReminder: async (eventId: number, message: string, subject: string, sendEmail: boolean, sendSMS: boolean) => {
    const response = await api.post('/notifications/send-event-reminder', {
      eventId,
      message,
      subject,
      sendEmail,
      sendSMS
    });
    return response.data;
  },
  sendToRole: async (role: string, message: string, subject: string, sendEmail: boolean, sendSMS: boolean) => {
    const response = await api.post('/notifications/send-to-role', {
      role,
      message,
      subject,
      sendEmail,
      sendSMS
    });
    return response.data;
  },
  getQueue: async (status?: string) => {
    const url = status ? `/notifications/queue?status=${status}` : '/notifications/queue';
    const response = await api.get(url);
    return response.data;
  },
  retry: async (notificationId: number) => {
    const response = await api.post(`/notifications/retry/${notificationId}`);
    return response.data;
  },
};

// Attendance service
export const attendanceService = {
  generateServiceQR: async (serviceType: string, serviceDate: string, eventId?: number) => {
    const response = await api.post('/attendance/generate-service-qr', {
      serviceType,
      serviceDate,
      eventId
    });
    return response.data;
  },
  checkIn: async (qrCode: string, serviceType: string, eventId?: number) => {
    const response = await api.post('/attendance/check-in', {
      qrCode,
      serviceType,
      eventId
    });
    return response.data;
  },
  getMyAttendance: async (startDate?: string, endDate?: string, serviceType?: string) => {
    let url = '/attendance/my-attendance';
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (serviceType) params.append('serviceType', serviceType);
    if (params.toString()) url += `?${params.toString()}`;
    const response = await api.get(url);
    return response.data;
  },
  getReport: async (startDate?: string, endDate?: string, serviceType?: string, department?: string) => {
    let url = '/attendance/report';
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (serviceType) params.append('serviceType', serviceType);
    if (department) params.append('department', department);
    if (params.toString()) url += `?${params.toString()}`;
    const response = await api.get(url);
    return response.data;
  },
  getByDate: async (date: string, serviceType?: string) => {
    let url = `/attendance/by-date/${date}`;
    if (serviceType) url += `?serviceType=${serviceType}`;
    const response = await api.get(url);
    return response.data;
  },
  markManual: async (userId: number, serviceType: string, serviceDate: string, eventId?: number, department?: string) => {
    const response = await api.post('/attendance/manual', {
      userId,
      serviceType,
      serviceDate,
      eventId,
      department
    });
    return response.data;
  },
  deleteRecord: async (attendanceId: number) => {
    const response = await api.delete(`/attendance/${attendanceId}`);
    return response.data;
  },
  getStatistics: async () => {
    const response = await api.get('/attendance/statistics');
    return response.data;
  },
};

export default api;
