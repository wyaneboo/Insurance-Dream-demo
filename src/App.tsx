import React, { useState } from 'react';
import { AgentTab, CustomerTab, UserRole } from './types';
import { AGENT_MENU, CUSTOMER_MENU } from './constants';
import { 
  Bell, Search, LogOut, Menu, UserCircle, Briefcase 
} from 'lucide-react';
import { AIAssistant } from './components/AIAssistant';
import { 
  AgentDashboard, AgentPortals, AgentProspects, AgentPipeline, 
  AgentTraining, AgentNews, AgentTools, AgentSupport 
} from './components/AgentComponents';
import { 
  CustomerDashboard, CustomerPolicies, CustomerServices, 
  CustomerPlanning, CustomerRewards, CustomerVault 
} from './components/CustomerComponents';

// Placeholder components for sections not fully implemented in this demo
const Placeholder = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center h-96 text-slate-400">
    <Briefcase size={48} className="mb-4 opacity-20" />
    <h3 className="text-xl font-medium text-slate-500">{title} Panel</h3>
    <p>This module is currently under development.</p>
  </div>
);

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>(UserRole.AGENT);
  const [agentTab, setAgentTab] = useState<AgentTab>(AgentTab.DASHBOARD);
  const [customerTab, setCustomerTab] = useState<CustomerTab>(CustomerTab.HOME);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Determine current menu based on role
  const menuItems = role === UserRole.AGENT ? AGENT_MENU : CUSTOMER_MENU;
  const currentTab = role === UserRole.AGENT ? agentTab : customerTab;
  
  const handleTabChange = (id: string) => {
    if (role === UserRole.AGENT) setAgentTab(id as AgentTab);
    else setCustomerTab(id as CustomerTab);
    setIsSidebarOpen(false); // Close sidebar on mobile on selection
  };

  const renderContent = () => {
    if (role === UserRole.AGENT) {
      switch (agentTab) {
        case AgentTab.DASHBOARD: return <AgentDashboard />;
        case AgentTab.PROSPECTS: return <AgentProspects />;
        case AgentTab.PIPELINE: return <AgentPipeline />;
        case AgentTab.TRAINING: return <AgentTraining />;
        case AgentTab.NEWS: return <AgentNews />;
        case AgentTab.TOOLS: return <AgentTools />;
        case AgentTab.PORTALS: return <AgentPortals />;
        case AgentTab.SUPPORT: return <AgentSupport />;
        default: return <Placeholder title={agentTab} />;
      }
    } else {
      switch (customerTab) {
        case CustomerTab.HOME: return <CustomerDashboard />;
        case CustomerTab.POLICIES: return <CustomerPolicies />;
        case CustomerTab.SERVICES: return <CustomerServices />;
        case CustomerTab.PLANNING: return <CustomerPlanning />;
        case CustomerTab.REWARDS: return <CustomerRewards />;
        case CustomerTab.VAULT: return <CustomerVault />;
        default: return <Placeholder title={customerTab} />;
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">
      
      {/* Sidebar Navigation */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen flex flex-col border-r border-slate-200 
        ${role === UserRole.AGENT ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} shadow-2xl md:shadow-none`}
      >
        <div className="p-6 flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xl ${role === UserRole.AGENT ? 'bg-blue-600 text-white' : 'bg-teal-500 text-white'}`}>D</div>
          <span className="text-lg font-bold tracking-tight">Dream Agency</span>
        </div>

        <nav className="flex-1 px-3 space-y-1 mt-4 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${role === UserRole.AGENT 
                  ? (currentTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:text-white hover:bg-white/10')
                  : (currentTab === item.id ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900')
                }`}
            >
              <item.icon size={20} />
              {item.id}
            </button>
          ))}
        </nav>

        {/* User Profile Mini */}
        <div className={`p-4 border-t ${role === UserRole.AGENT ? 'border-slate-800' : 'border-slate-100'}`}>
          <div className="flex items-center gap-3">
            <div className="bg-slate-200 p-2 rounded-full">
              <UserCircle size={20} className="text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{role === UserRole.AGENT ? 'Alex Agent' : 'Sarah Lee'}</p>
              <p className={`text-xs truncate ${role === UserRole.AGENT ? 'text-slate-400' : 'text-slate-500'}`}>{role === UserRole.AGENT ? 'Top Performer' : 'Gold Customer'}</p>
            </div>
            <LogOut size={16} className="text-slate-400 cursor-pointer hover:text-red-500" />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 z-30">
          <div className="flex items-center gap-4">
             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-2 text-slate-500">
                <Menu size={24} />
             </button>
             {/* Universal Search */}
             <div className="hidden md:flex items-center bg-slate-100 rounded-full px-4 py-1.5 w-96">
               <Search size={16} className="text-slate-400" />
               <input 
                 type="text" 
                 placeholder={`Search ${role === UserRole.AGENT ? 'policies, clients, circulars...' : 'policies, help...'}`}
                 className="bg-transparent border-none focus:outline-none text-sm px-2 w-full text-slate-700" 
               />
             </div>
          </div>

          <div className="flex items-center gap-4">
             {/* Role Switcher (For Demo Purpose) */}
             <div className="flex bg-slate-100 rounded-lg p-1">
               <button 
                 onClick={() => setRole(UserRole.AGENT)} 
                 className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${role === UserRole.AGENT ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
               >
                 Agent
               </button>
               <button 
                 onClick={() => setRole(UserRole.CUSTOMER)} 
                 className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${role === UserRole.CUSTOMER ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
               >
                 Customer
               </button>
             </div>

             <div className="relative cursor-pointer">
               <Bell size={20} className="text-slate-600 hover:text-slate-800" />
               <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">3</span>
             </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
           <div className="max-w-7xl mx-auto">
             {renderContent()}
           </div>
        </div>

      </main>

      {/* AI Overlay */}
      <AIAssistant userRole={role} />
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-30 md:hidden"></div>
      )}

    </div>
  );
};

export default App;