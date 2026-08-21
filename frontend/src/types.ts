export type TokenStatus = 'waiting' | 'called' | 'serving' | 'completed' | 'skipped' | 'cancelled';

export type PriorityLevel = 'normal' | 'priority' | 'vip';

export interface QueueToken {
  id: string;
  tokenNumber: string; // e.g. "A-042"
  serviceId: string;
  serviceName: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  notes?: string;
  priority: PriorityLevel;
  status: TokenStatus;
  joinedAt: number; // timestamp
  calledAt?: number;
  servedAt?: number;
  completedAt?: number;
  counterAssigned?: string; // e.g. "Counter 03"
  staffAssignedName?: string; // e.g. "Sarah Jenkins"
  estimatedWaitMinutes: number;
}

export interface ServiceType {
  id: string;
  name: string;
  description: string;
  prefix: string; // e.g. "A", "T", "B", "P"
  avgServiceMinutes: number;
  icon: string; // Lucide icon name
  color: string; // Tailwind color theme
  isActive: boolean;
  maxDailyCapacity?: number;
  priorityWeight?: number;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: 'operator' | 'supervisor' | 'admin';
  assignedCounter: string; // e.g. "Counter 01"
  assignedServiceIds: string[]; // service IDs they can handle
  isOnline: boolean;
  avatarUrl?: string;
  servedTodayCount: number;
  avgHandlingMinutes: number;
}

export interface QueueSettings {
  organizationName: string;
  venueName: string;
  operatingHours: {
    start: string; // "08:30"
    end: string;   // "18:00"
    daysOpen: string[]; // ["Mon", "Tue", "Wed", "Thu", "Fri"]
  };
  enableSoundAlerts: boolean;
  enableSpeechAnnouncements: boolean;
  voiceType: string;
  maxQueueSize: number;
  autoCallNextOnComplete: boolean;
  smsAlertsEnabled: boolean;
  vipPriorityMultiplier: number;
  theme: 'dark-navy' | 'light' | 'corporate';
}

export interface AuditLog {
  id: string;
  timestamp: number;
  action: string;
  actor: string;
  details: string;
  tokenNumber?: string;
  type: 'info' | 'success' | 'warning' | 'alert';
}

export type AppView = 
  | 'splash'
  | 'landing' 
  | 'role-selector' 
  | 'customer' 
  | 'customer-ticket' 
  | 'staff-login'
  | 'staff' 
  | 'admin-login'
  | 'admin' 
  | 'display-board'
  | 'kiosk';
