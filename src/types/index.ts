export interface User {
  id: number;
  email: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  phoneNumber?: string;
  phone?: string;
  address?: string;
  profileImage?: string;
  gender?: 'male' | 'female';
  departments?: string[];
  isActive: boolean;
  createdAt: string;
}

export type UserRole = 
  | 'member' 
  | 'pastor' 
  | 'elder' 
  | 'deacon' 
  | 'secretary' 
  | 'media' 
  | 'finance' 
  | 'choir' 
  | 'department_head'
  | 'admin'
  | 'church_admin'
  | 'media_head' 
  | 'super_admin';

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
  gender?: 'male' | 'female';
  departments?: string[];
}

export interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: string;
  imageUrl: string;
  createdAt: string;
}

export interface Sermon {
  id: number;
  title: string;
  preacher: string;
  date: string;
  description: string;
  videoUrl?: string;
  audioUrl?: string;
  pdfUrl?: string;
  thumbnailUrl?: string;
  category: string;
  createdAt: string;
}

export interface BlogPost {
  id: number;
  title: string;
  content: string;
  author: string;
  category: string;
  imageUrl?: string;
  excerpt: string;
  publishedDate: string;
  createdAt: string;
}

export interface PrayerRequest {
  id: number;
  name: string;
  email: string;
  phoneNumber?: string;
  category: string;
  requestText: string;
  isUrgent: boolean;
  status: 'pending' | 'praying' | 'answered';
  createdAt: string;
}

export interface Ministry {
  id: number;
  name: string;
  description: string;
  leader: string;
  schedule: string;
  imageUrl?: string;
}

export interface Donation {
  id: number;
  amount: number;
  donorName: string;
  donorEmail: string;
  purpose: string;
  paymentMethod: string;
  isAnonymous: boolean;
  createdAt: string;
}

export interface GalleryImage {
  id: number;
  title: string;
  description?: string;
  imageUrl: string;
  category: string;
  createdAt: string;
}

export interface FeedPost {
  id: number;
  userId: number;
  userName: string;
  userImage?: string;
  content: string;
  imageUrl?: string;
  likes: number;
  comments: number;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: number;
  senderName: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

export interface Attendance {
  id: number;
  userId: number;
  serviceType: string;
  date: string;
  checkInTime: string;
}
