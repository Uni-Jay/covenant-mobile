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
  photo?: string;
  gender?: 'male' | 'female';
  departments?: string[];
  isActive: boolean;
  createdAt: string;
}

export type UserRole = 
  | 'member'                        // Default - regular church member (no special access)
  | 'admin'                         // System administrator (full system control)
  | 'gen_overseer'                  // General Overseer (highest church authority)
  | 'senior_pastor'                 // Senior Pastor
  | 'pastor'                        // Pastor (senior leadership)
  | 'church_committee_chairman'     // Church committee chairman
  | 'church_committee_secretary'    // Church committee secretary
  | 'secretary'                     // Secretary (general)
  | 'treasurer'                     // Treasurer (financial authority)
  | 'pro'                           // Public Relation Officer (propagandist/communications)
  | 'media'                         // Media officer (media department authority)
  | 'coordinator'                   // Department coordinator (department-scoped)
  | 'assistant_coordinator'         // Assistant coordinator (department-scoped);

export type DepartmentValue = 
  | 'media'                         // Media department
  | 'choir'                         // Choir department
  | 'ushers'                        // Ushers department
  | 'drama'                         // Drama department
  | 'covenant_men'                  // Covenant Men fellowship
  | 'covenant_women'                // Covenant Women fellowship
  | 'covenant_youth'                // Covenant Youth fellowship
  | 'covenant_children';            // Covenant Children fellowship

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
  phoneNumber: string;
  gender: 'male' | 'female';
  dateOfBirth: string;
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
  speaker?: string;
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
