import { KPIData, Policy, Prospect, AgentTab, CustomerTab, PipelineCase, TrainingModule, Circular, ServiceRequest, Reward, DocumentItem, Claim, Appointment, Task, Notification } from './types';
import { 
  LayoutDashboard, Users, FileText, GraduationCap, Newspaper, Wrench, Globe, LifeBuoy,
  Home, Shield, Briefcase, TrendingUp, Gift, Lock
} from 'lucide-react';

export const MOCK_POLICIES: Policy[] = [
  { 
    id: 'POL-001', name: 'Smart Protect Life', type: 'Life', premium: 2500, status: 'In Force', 
    renewalDate: '2024-11-15', coverageAmount: 500000, cashValue: 15400, riders: ['Critical Illness', 'Accident Waiver']
  },
  { 
    id: 'POL-002', name: 'MediCare Plus', type: 'Medical', premium: 1200, status: 'In Force', 
    renewalDate: '2024-06-20', coverageAmount: 1000000, riders: ['Hospital Income']
  },
  { 
    id: 'POL-003', name: 'Retire Rich Flexi', type: 'Savings', premium: 6000, status: 'In Force', 
    renewalDate: '2024-12-01', coverageAmount: 200000, fundValue: 45600 
  },
];

export const MOCK_CLAIMS: Claim[] = [
  { id: 'CLM-2024-001', policyName: 'MediCare Plus', type: 'Medical - Hospitalization', status: 'Approved', submittedDate: '2024-03-10', amount: 4500, documents: ['bill.pdf'] },
  { id: 'CLM-2024-002', policyName: 'Smart Protect Life', type: 'Accident - Outpatient', status: 'In Review', submittedDate: '2024-05-15', documents: ['xray.jpg', 'receipt.pdf'] }
];

export const MOCK_APPOINTMENTS: Appointment[] = [
  { id: 'APT-1', customerName: 'Evan Wright', time: '10:00 AM', duration: '1h', type: 'Closing', channel: 'In-Person', status: 'Confirmed' },
  { id: 'APT-2', customerName: 'Sarah Lee', time: '02:00 PM', duration: '30m', type: 'Review', channel: 'Video Call', status: 'Confirmed' },
  { id: 'APT-3', customerName: 'Mike Chen', time: '04:30 PM', duration: '45m', type: 'Service', channel: 'Phone', status: 'Pending' }
];

export const MOCK_TASKS: Task[] = [
  { id: 'TSK-1', title: 'Submit Medical Report', relatedTo: 'John Doe', dueDate: 'Today', priority: 'High', type: 'Admin' },
  { id: 'TSK-2', title: 'Policy Renewal Follow-up', relatedTo: 'Sarah Lee', dueDate: 'Tomorrow', priority: 'Medium', type: 'Renewal' },
  { id: 'TSK-3', title: 'Birthday Call', relatedTo: 'Mike Chen', dueDate: '2 days', priority: 'Low', type: 'Sales' },
  { id: 'TSK-4', title: 'Claims Doc Verification', relatedTo: 'Alice Tan', dueDate: 'Today', priority: 'High', type: 'Claim' }
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'NOT-1', title: 'Policy Issued', message: 'Case CASE-103 for Marcus Hill has been issued.', time: '2h ago', read: false, type: 'Success' },
  { id: 'NOT-2', title: 'New Circular', message: 'Update on Medical Repricing 2024.', time: '5h ago', read: false, type: 'Info' },
  { id: 'NOT-3', title: 'Premium Due', message: 'Client Sarah Lee has a premium due in 3 days.', time: '1d ago', read: true, type: 'Alert' }
];

export const MOCK_PROSPECTS: Prospect[] = [
  { id: 'PRO-1', name: 'Alice Johnson', status: 'Proposal', probability: 75, lastContact: '2 days ago' },
  { id: 'PRO-2', name: 'Bob Smith', status: 'New', probability: 20, lastContact: '1 week ago' },
  { id: 'PRO-3', name: 'Charlie Davis', status: 'Closing', probability: 90, lastContact: 'Yesterday' },
];

export const MOCK_PIPELINE: PipelineCase[] = [
  { id: 'CASE-101', applicant: 'Evan Wright', plan: 'Smart Invest LP', status: 'Pending Requirement', submittedDate: '2024-05-10', remarks: 'Requires Medical Report' },
  { id: 'CASE-102', applicant: 'Linda Green', plan: 'Medical Prime', status: 'Underwriting', submittedDate: '2024-05-12', remarks: 'Assessment in progress' },
  { id: 'CASE-103', applicant: 'Marcus Hill', plan: 'Term Secure', status: 'Submitted', submittedDate: '2024-05-14', remarks: 'Initial submission' },
];

export const MOCK_TRAINING: TrainingModule[] = [
  { id: 'TR-1', title: 'New ILP Fund Features', category: 'Product', duration: '15 min', completed: false, thumbnailColor: 'bg-blue-500' },
  { id: 'TR-2', title: 'AML/CFT Compliance 2024', category: 'Compliance', duration: '45 min', completed: true, thumbnailColor: 'bg-red-500' },
  { id: 'TR-3', title: 'Handling Objections', category: 'Sales', duration: '20 min', completed: false, thumbnailColor: 'bg-emerald-500' },
  { id: 'TR-4', title: 'E-Submission Portal Guide', category: 'Product', duration: '10 min', completed: false, thumbnailColor: 'bg-indigo-500' },
];

export const MOCK_CIRCULARS: Circular[] = [
  { id: 'CIR-001', title: 'Launch of SmartMedic Pro 2.0', date: '2024-05-01', category: 'Product', isRead: false },
  { id: 'CIR-002', title: 'System Maintenance: E-Partner', date: '2024-04-28', category: 'Ops', isRead: true },
  { id: 'CIR-003', title: 'Updated Underwriting Guidelines for BMI', date: '2024-04-25', category: 'Compliance', isRead: true },
];

export const MOCK_REQUESTS: ServiceRequest[] = [
  { id: 'SR-1', type: 'Change of Address', date: '2024-04-10', status: 'Completed' },
  { id: 'SR-2', type: 'Medical Card Replacement', date: '2024-05-05', status: 'Processing' },
];

export const MOCK_REWARDS: Reward[] = [
  { id: 'REW-1', title: 'RM50 Grab Voucher', points: 500, expiry: '2024-12-31' },
  { id: 'REW-2', title: 'Free Health Checkup', points: 1200, expiry: '2024-10-15' },
];

export const MOCK_DOCS: DocumentItem[] = [
  { id: 'DOC-1', title: 'Policy Contract - Life', type: 'PDF', date: '2022-01-15' },
  { id: 'DOC-2', title: 'Medical Card E-Card', type: 'Image', date: '2022-01-15' },
  { id: 'DOC-3', title: 'Tax Statement 2023', type: 'PDF', date: '2024-03-01' },
];

export const AGENT_KPI: KPIData[] = [
  { label: 'ANP', value: 85000, target: 120000, unit: 'RM' },
  { label: 'Cases', value: 12, target: 20, unit: 'Count' },
  { label: 'Persistency', value: 98.5, target: 95, unit: '%' },
];

export const AGENT_MENU = [
  { id: AgentTab.DASHBOARD, icon: LayoutDashboard },
  { id: AgentTab.PROSPECTS, icon: Users },
  { id: AgentTab.PIPELINE, icon: FileText },
  { id: AgentTab.TRAINING, icon: GraduationCap },
  { id: AgentTab.NEWS, icon: Newspaper },
  { id: AgentTab.TOOLS, icon: Wrench },
  { id: AgentTab.PORTALS, icon: Globe },
  { id: AgentTab.SUPPORT, icon: LifeBuoy },
];

export const CUSTOMER_MENU = [
  { id: CustomerTab.HOME, icon: Home },
  { id: CustomerTab.POLICIES, icon: Shield },
  { id: CustomerTab.SERVICES, icon: Briefcase },
  { id: CustomerTab.PLANNING, icon: TrendingUp },
  { id: CustomerTab.REWARDS, icon: Gift },
  { id: CustomerTab.VAULT, icon: Lock },
];

export const PORTAL_LINKS = [
  { name: 'e-Partner', url: '#' },
  { name: 'e-Connect', url: '#' },
  { name: 'iGREAT', url: '#' },
  { name: 'GELS', url: '#' },
  { name: 'Pulse', url: '#' },
  { name: 'MySales', url: '#' },
];
