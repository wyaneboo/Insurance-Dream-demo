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

export interface Policy {
  id: string;
  name: string;
  type: 'Life' | 'Medical' | 'Savings' | 'Motor';
  premium: number;
  status: 'In Force' | 'Lapsed' | 'Pending';
  renewalDate: string;
  coverageAmount: number;
}

export interface Prospect {
  id: string;
  name: string;
  status: 'New' | 'Contacted' | 'Proposal' | 'Closing';
  probability: number;
  lastContact: string;
}

export interface PipelineCase {
  id: string;
  applicant: string;
  plan: string;
  status: 'Underwriting' | 'Pending Requirement' | 'Submitted';
  submittedDate: string;
  remarks: string;
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