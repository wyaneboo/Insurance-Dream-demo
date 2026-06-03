export enum UserRole {
  AGENT = 'AGENT',
  CUSTOMER = 'CUSTOMER'
}

export enum AgentTab {
  DASHBOARD = 'Dashboard',
  PROSPECTS = 'Prospects',
  PIPELINE = 'Pipeline',
  TRAINING = 'Training',
  NEWS = 'News',
  TOOLS = 'Tools',
  PORTALS = 'Portals',
  SUPPORT = 'Support'
}

export enum CustomerTab {
  HOME = 'Home',
  POLICIES = 'My Policies',
  SERVICES = 'Services',
  PLANNING = 'Planning',
  REWARDS = 'Rewards',
  VAULT = 'Vault'
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  membershipLevel?: string;
  notifications: number;
}

export interface Policy {
  id: string;
  name: string;
  type: 'Life' | 'Medical' | 'Savings' | 'Motor' | 'Investment';
  premium: number;
  status: 'In Force' | 'Lapsed' | 'Pending';
  renewalDate: string;
  coverageAmount: number;
  cashValue?: number;
  fundValue?: number;
  riders?: string[];
}

export interface Prospect {
  id: string;
  name: string;
  status: string;
  stage?: string;
  probability: number;
  score?: number;
  lastContact: string;
  contact?: Record<string, unknown>;
  nextActionAt?: string;
  noteCount?: number;
}

export interface PipelineCase {
  id: string;
  applicant: string;
  applicantName?: string;
  plan: string;
  planName?: string;
  status: string;
  underwritingStatus?: string;
  submittedDate: string;
  submittedAt?: string;
  remarks?: string;
  pendingReasons?: string[];
  requiredDocs?: string[];
  estimatedIssueDate?: string;
  expiry?: string;
  policyId?: string;
}

export interface TrainingModule {
  id: string;
  title: string;
  category: 'Product' | 'Compliance' | 'Sales';
  duration: string;
  completed: boolean;
  thumbnailColor: string;
}

export interface Circular {
  id: string;
  title: string;
  date: string;
  category: 'Ops' | 'Product' | 'Compliance';
  isRead: boolean;
}

export interface ServiceRequest {
  id: string;
  type: string;
  date: string;
  status: 'Processing' | 'Completed' | 'Action Required';
}

export interface Claim {
  id: string;
  policyName: string;
  type: string;
  status: 'Submitted' | 'In Review' | 'Approved' | 'Paid' | 'Declined';
  submittedDate: string;
  amount?: number;
  documents: string[];
}

export interface Appointment {
  id: string;
  customerName: string;
  time: string;
  duration: string;
  type: 'Review' | 'Closing' | 'Service';
  channel: 'In-Person' | 'Video Call' | 'Phone';
  status: 'Confirmed' | 'Pending';
}

export interface Task {
  id: string;
  title: string;
  relatedTo: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
  type: 'Renewal' | 'Claim' | 'Sales' | 'Admin';
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'Alert' | 'Info' | 'Success';
}

export interface Reward {
  id: string;
  title: string;
  points: number;
  expiry: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  type: 'PDF' | 'Image';
  date: string;
}

export interface KPIData {
  label: string;
  value: number;
  target: number;
  unit: string;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}
