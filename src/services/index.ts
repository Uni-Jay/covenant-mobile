import api, { 
  feedService, 
  chatService, 
  documentService, 
  churchEmailService,
  firstTimerService,
  dashboardService,
  notificationService,
  attendanceService
} from './api';
import { AuthResponse, LoginCredentials, RegisterData, User } from '../types';

export const authService = {
  // Login with email and password
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Register new user
  register: async (data: RegisterData): Promise<AuthResponse> => {
    // Split fullName into firstName and lastName
    const nameParts = data.fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    const registerPayload = {
      email: data.email,
      password: data.password,
      firstName,
      lastName,
      phone: data.phoneNumber || null,
      gender: data.gender || null,
      departments: data.departments || [],
    };
    
    const response = await api.post('/auth/register', registerPayload);
    return response.data;
  },

  // Get current user profile
  getProfile: async (): Promise<User> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Update user profile
  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await api.put('/auth/profile', data);
    return response.data.user || response.data;
  },

  // Request password reset
  forgotPassword: async (email: string): Promise<void> => {
    await api.post('/auth/forgot-password', { email });
  },

  // Reset password with token
  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await api.post('/auth/reset-password', { token, password: newPassword });
  },
};

export const eventsService = {
  getAll: async () => {
    const response = await api.get('/events');
    return response.data;
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },
  
  register: async (eventId: number, data: any) => {
    const response = await api.post(`/events/${eventId}/register`, data);
    return response.data;
  },
};

export const sermonsService = {
  getAll: async () => {
    const response = await api.get('/sermons');
    return response.data;
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/sermons/${id}`);
    return response.data;
  },
  
  getByCategory: async (category: string) => {
    const response = await api.get(`/sermons?category=${category}`);
    return response.data;
  },
};

export const blogService = {
  getAll: async () => {
    const response = await api.get('/blog');
    return response.data;
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/blog/${id}`);
    return response.data;
  },
};

export const prayerService = {
  submit: async (data: any) => {
    const response = await api.post('/prayer-requests', data);
    return response.data;
  },
  
  getAll: async () => {
    const response = await api.get('/prayer-requests');
    return response.data;
  },
};

export const ministriesService = {
  getAll: async () => {
    const response = await api.get('/ministries');
    return response.data;
  },
  
  join: async (ministryId: number, data: any) => {
    const response = await api.post(`/ministries/${ministryId}/join`, data);
    return response.data;
  },
};

export const donationsService = {
  submit: async (data: any) => {
    const response = await api.post('/donations', data);
    return response.data;
  },
  
  getHistory: async () => {
    const response = await api.get('/donations/history');
    return response.data;
  },
};

export const galleryService = {
  getAll: async () => {
    const response = await api.get('/gallery');
    return response.data;
  },
  
  getByCategory: async (category: string) => {
    const response = await api.get(`/gallery?category=${category}`);
    return response.data;
  },
};

export const contactService = {
  submit: async (data: any) => {
    const response = await api.post('/contact', data);
    return response.data;
  },
};

export { 
  api,
  feedService, 
  chatService, 
  documentService, 
  churchEmailService,
  firstTimerService,
  dashboardService,
  notificationService,
  attendanceService
};
