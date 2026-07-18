export type UserRole = 'user' | 'creator' | 'admin';
export type UserStatus = 'active' | 'suspended';
export type ToolStatus = 'pending' | 'approved' | 'rejected';
export type SubscriptionPlanType = 'free' | 'pro' | 'business';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  status: UserStatus;
  credits: number;
  subscriptionPlan: SubscriptionPlanType;
  subscriptionExpiresAt?: string;
  createdAt: string;
}

export interface AITool {
  id: string;
  title: string;
  slug: string;
  description: string;
  longDescription: string;
  image: string;
  category: string;
  price: number;
  type: 'free' | 'pro' | 'business';
  rating: number;
  users: number;
  status: ToolStatus;
  creatorId: string;
  features: string[];
  requirements: string[];
  demoVideoUrl?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  toolId: string;
  rating: number;
  comment: string;
  timestamp: string;
}

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  toolId: string;
  toolTitle: string;
  amount: number;
  paymentStatus: 'completed' | 'pending';
  paymentMethod: 'stripe' | 'paypal' | 'crypto';
  timestamp: string;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  amount: number; // positive for added, negative for spent
  type: 'purchase' | 'usage' | 'bonus';
  description: string;
  timestamp: string;
}

export interface UsageLog {
  id: string;
  userId: string;
  toolId: string;
  toolTitle: string;
  prompt: string;
  result: string;
  creditsSpent: number;
  timestamp: string;
}

export interface Notification {
  id: string;
  userId: string; // "all" for global broadcast
  title: string;
  message: string;
  readStatus: 'unread' | 'read';
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  recipientId: string; // "global" or specific userId
  content: string;
  timestamp: string;
  readStatus: 'unread' | 'read';
}

// For system backward compatibility if any parts rely on older metrics keys
export interface DashboardMetrics {
  activeUsers: number;
  totalRegistrations: number;
  liveActivitiesCount: number;
  cpuUsage: number;
  memoryUsage: number;
  toolApprovalRate: number;
  totalSpending: number;
}
