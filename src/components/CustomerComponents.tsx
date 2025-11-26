import React from 'react';
import { MOCK_POLICIES, MOCK_REQUESTS, MOCK_REWARDS, MOCK_DOCS } from '../constants';
import { 
  Shield, AlertCircle, ChevronRight, Download, Activity, DollarSign, 
  MapPin, CreditCard, FilePlus, Phone, Gift, Award, Clock, File, Lock, Target
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export const CustomerDashboard: React.FC = () => {
  const data = [
    { name: 'Protection', value: 400 },
    { name: 'Investment', value: 300 },
    { name: 'Medical', value: 300 },
  ];
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b'];

  return (
    <div className="space-y-6">
      {/* Welcome & Banner */}
      <div className="bg-gradient-to-r from-teal-500 to-emerald-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Welcome back, Sarah!</h1>
          <p className="opacity-90 max-w-lg">Your financial health score is <span className="font-bold">Excellent</span>. You are well protected against major risks.</p>
          <button className="mt-6 bg-white text-teal-700 px-6 py-2 rounded-full font-semibold hover:bg-teal-50 transition-colors">
            View Analysis
          </button>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 transform translate-x-10 -skew-x-12 bg-white"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Coverage Summary */}
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">Your Protection Portfolio</h3>
          <div className="flex flex-col md:flex-row items-center">
             <div className="h-48 w-48 relative">
               <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
               </ResponsiveContainer>
               <div className="absolute inset-0 flex items-center justify-center flex-col">
                 <span className="text-2xl font-bold text-slate-700">3</span>
                 <span className="text-xs text-slate-400 uppercase">Policies</span>
               </div>
             </div>
             <div className="flex-1 pl-0 md:pl-8 space-y-4 w-full">
                <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="text-sm font-medium text-slate-600">Life Protection</span>
                  </div>
                  <span className="font-bold text-slate-800">RM 500k</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm font-medium text-slate-600">Investments</span>
                  </div>
                  <span className="font-bold text-slate-800">RM 120k</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span className="text-sm font-medium text-slate-600">Medical Limit</span>
                  </div>
                  <span className="font-bold text-slate-800">RM 1M/yr</span>
                </div>
             </div>
          </div>
        </div>

        {/* Alerts / Reminders */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <AlertCircle size={20} className="text-amber-500" />
            Action Items
          </h3>
          <div className="space-y-3">
             <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
               <p className="text-sm font-medium text-amber-800">Premium Due: MediCare Plus</p>
               <p className="text-xs text-amber-600 mt-1">RM 1,200 due on 20 June 2024</p>
               <button className="mt-2 text-xs bg-amber-200 text-amber-900 px-3 py-1 rounded-md hover:bg-amber-300">Pay Now</button>
             </div>
             <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
               <p className="text-sm font-medium text-slate-800">Review your coverage</p>
               <p className="text-xs text-slate-500 mt-1">Your life stage has changed recently.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CustomerPolicies: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-800">My Policies</h2>
      <div className="grid gap-4">
        {MOCK_POLICIES.map(policy => (
          <div key={policy.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${
                policy.type === 'Life' ? 'bg-blue-100 text-blue-600' : 
                policy.type === 'Medical' ? 'bg-emerald-100 text-emerald-600' : 
                'bg-purple-100 text-purple-600'
              }`}>
                {policy.type === 'Life' ? <Shield size={24}/> : policy.type === 'Medical' ? <Activity size={24}/> : <DollarSign size={24}/>}
              </div>
              <div>
                <h3 className="font-bold text-slate-800">{policy.name}</h3>
                <p className="text-sm text-slate-500">{policy.id} - {policy.status}</p>
                <p className="text-xs text-slate-400 mt-1">Renewal: {policy.renewalDate}</p>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-1 w-full md:w-auto">
              <span className="text-lg font-bold text-slate-800">RM {policy.coverageAmount.toLocaleString()}</span>
              <span className="text-xs text-slate-500">Coverage Amount</span>
            </div>

            <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
               <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50">
                 <Download size={16} /> E-Policy
               </button>
               <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600">
                 Details <ChevronRight size={16} />
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const CustomerServices: React.FC = () => {
  const actions = [
    { title: 'Update Address', icon: MapPin },
    { title: 'Update Payment', icon: CreditCard },
    { title: 'File a Claim', icon: FilePlus },
    { title: 'Request Call', icon: Phone },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-4">Service Requests</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {actions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <button key={idx} className="flex flex-col items-center justify-center p-6 bg-white border border-slate-100 rounded-2xl hover:border-teal-300 hover:shadow-md transition-all group">
                <div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center text-teal-600 mb-3 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                  <Icon size={24} />
                </div>
                <span className="font-medium text-slate-700 text-sm">{action.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-semibold text-slate-800">Recent Request History</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {MOCK_REQUESTS.map(req => (
            <div key={req.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
              <div>
                <p className="font-medium text-slate-800">{req.type}</p>
                <p className="text-xs text-slate-500">{req.id} - {req.date}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                req.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {req.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const CustomerPlanning: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Financial Planning Simulator</h2>
        <p className="text-slate-500">Visualize your future and identify coverage gaps.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
           <div className="flex items-center gap-3 mb-6">
             <div className="p-2 bg-teal-100 rounded-lg text-teal-600">
               <Shield size={24} />
             </div>
             <div>
               <h3 className="font-bold text-slate-800">Protection Gap</h3>
               <p className="text-xs text-slate-500">Life Coverage Analysis</p>
             </div>
           </div>
           
           <div className="space-y-4">
             <div>
               <div className="flex justify-between text-sm mb-1">
                 <span className="text-slate-600">Current Coverage</span>
                 <span className="font-bold">RM 500,000</span>
               </div>
               <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                 <div className="bg-emerald-500 h-full rounded-full w-2/3"></div>
               </div>
             </div>
             
             <div>
               <div className="flex justify-between text-sm mb-1">
                 <span className="text-slate-600">Recommended (10x Income)</span>
                 <span className="font-bold">RM 750,000</span>
               </div>
               <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-slate-300 h-full rounded-full w-full"></div>
               </div>
             </div>

             <div className="p-4 bg-red-50 rounded-xl mt-4 border border-red-100">
               <p className="text-red-800 text-sm font-medium">Shortfall Detected: RM 250,000</p>
               <button className="mt-2 text-xs bg-red-200 text-red-900 px-3 py-1 rounded-md hover:bg-red-300 font-semibold">
                 See Recommendations
               </button>
             </div>
           </div>
         </div>

         <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
             <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
               <Target size={24} />
             </div>
             <div>
               <h3 className="font-bold text-slate-800">Retirement Goal</h3>
               <p className="text-xs text-slate-500">Savings Projection</p>
             </div>
           </div>
           
           <div className="flex items-center justify-center h-40">
             <div className="text-center">
               <p className="text-4xl font-bold text-blue-600">65%</p>
               <p className="text-sm text-slate-500 mt-1">On Track</p>
             </div>
           </div>
           
           <p className="text-center text-sm text-slate-600">
             You are on track to reach <span className="font-bold">RM 1.2M</span> by age 60. Increasing your monthly contribution by RM 200 could boost this to RM 1.5M.
           </p>
         </div>
      </div>
    </div>
  );
};

export const CustomerRewards: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-8 text-white shadow-lg flex flex-col md:flex-row items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">Dream Points Balance</h2>
          <p className="opacity-80">Earn points by paying premiums on time and staying healthy.</p>
        </div>
        <div className="mt-4 md:mt-0 text-right">
          <span className="text-4xl font-bold">2,450</span>
          <span className="block text-sm opacity-80">PTS</span>
        </div>
      </div>

      <h3 className="font-bold text-slate-800 text-lg">Redeem Rewards</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MOCK_REWARDS.map(reward => (
          <div key={reward.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
             <div className="w-16 h-16 bg-pink-50 rounded-lg flex items-center justify-center text-pink-500">
               <Gift size={32} />
             </div>
             <div className="flex-1">
               <h4 className="font-bold text-slate-800">{reward.title}</h4>
               <p className="text-sm text-slate-500">{reward.points} Points - Exp: {reward.expiry}</p>
             </div>
             <button className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800">
               Redeem
             </button>
          </div>
        ))}
      </div>

      <h3 className="font-bold text-slate-800 text-lg mt-6">Active Challenges</h3>
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full">
          <Activity size={24} />
        </div>
        <div className="flex-1">
          <div className="flex justify-between mb-1">
            <span className="font-medium text-slate-800">10k Steps Challenge</span>
            <span className="text-sm text-slate-500">7,500 / 10,000</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full w-3/4"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CustomerVault: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Document Vault</h2>
        <button className="bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-600">
          Upload Document
        </button>
      </div>

      <div className="grid gap-3">
        {MOCK_DOCS.map(doc => (
          <div key={doc.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between hover:bg-slate-50 group cursor-pointer">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${doc.type === 'PDF' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                <File size={24} />
              </div>
              <div>
                <h4 className="font-medium text-slate-800">{doc.title}</h4>
                <p className="text-xs text-slate-400">{doc.date} - {doc.type}</p>
              </div>
            </div>
            <button className="text-slate-300 hover:text-teal-600 transition-colors">
              <Download size={20} />
            </button>
          </div>
        ))}
        {/* Secure Note */}
        <div className="flex items-center gap-2 justify-center mt-4 text-slate-400 text-xs">
          <Lock size={12} />
          <span>All documents are encrypted and stored securely.</span>
        </div>
      </div>
    </div>
  );
};
