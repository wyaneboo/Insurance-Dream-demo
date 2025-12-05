import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  AGENT_KPI,
  MOCK_PROSPECTS,
  PORTAL_LINKS,
  MOCK_PIPELINE,
  MOCK_TRAINING,
  MOCK_CIRCULARS,
  MOCK_TASKS,
  MOCK_APPOINTMENTS,
  MOCK_CLAIMS,
  MOCK_NOTIFICATIONS,
} from '../constants';
import {
  ChevronRight,
  Globe,
  MoreHorizontal,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle2,
  PlayCircle,
  FileText,
  Filter,
  Search,
  Calculator,
  PenTool,
  Video,
  MapPin,
  Calendar,
  DollarSign,
  Phone,
  MessageCircle,
  HelpCircle,
} from 'lucide-react';

const COLORS = ['#0ea5e9', '#0284c7', '#0369a1'];

export const AgentDashboard: React.FC = () => {
  const chartData = [
    { name: 'Jan', anp: 4000 },
    { name: 'Feb', anp: 3000 },
    { name: 'Mar', anp: 2000 },
    { name: 'Apr', anp: 2780 },
    { name: 'May', anp: 1890 },
    { name: 'Jun', anp: 2390 },
    { name: 'Jul', anp: 3490 },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {AGENT_KPI.map((kpi, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingUp size={64} className="text-blue-600" />
            </div>
            <p className="text-slate-500 font-medium text-sm">{kpi.label}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold text-slate-900">
                {kpi.unit === 'RM' ? 'RM ' : ''}{kpi.value.toLocaleString()}
                {kpi.unit === '%' ? '%' : ''}
              </h3>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-blue-600 h-full rounded-full" 
                style={{ width: `${Math.min((kpi.value / kpi.target) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-400 mt-2">Target: {kpi.target.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-slate-800">Production Trend (ANP)</h3>
            <select className="text-sm border-slate-200 border rounded-lg px-2 py-1">
              <option>This Year</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="anp" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <h3 className="font-semibold text-slate-800 mb-4">Urgent Tasks</h3>
          <div className="flex-1 space-y-4">
            {[
              { title: "Submit Medical Report", client: "John Doe", due: "Today", type: "Urgent" },
              { title: "Policy Renewal Follow-up", client: "Sarah Lee", due: "Tomorrow", type: "Warning" },
              { title: "Birthday Call", client: "Mike Chen", due: "2 days", type: "Info" },
            ].map((task, i) => (
              <div key={i} className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                <div className={`mt-1 w-2 h-2 rounded-full ${task.type === 'Urgent' ? 'bg-red-500' : task.type === 'Warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-slate-800">{task.title}</h4>
                  <p className="text-xs text-slate-500">{task.client} • {task.due}</p>
                </div>
                <ChevronRight size={16} className="text-slate-300" />
              </div>
            ))}
          </div>
          <button className="w-full mt-4 py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-colors">
            View All Tasks
          </button>
        </div>
      </div>

      {/* Tasks & Reminders */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-slate-800">Tasks</h3>
        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-bold">{MOCK_TASKS.length}</span>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto max-h-[300px] pr-2">
        {MOCK_TASKS.map((task, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-slate-100"
          >
            <div
              className={`mt-1.5 w-2 h-2 rounded-full ${
                task.priority === 'High' ? 'bg-red-500' : task.priority === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'
              }`}
            />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-slate-800">{task.title}</h4>
              <p className="text-xs text-slate-500">
                {task.relatedTo} •{' '}
                <span className={`${task.dueDate === 'Today' ? 'text-red-500 font-medium' : ''}`}>{task.dueDate}</span>
              </p>
            </div>
            {task.type === 'Renewal' && <Clock size={16} className="text-slate-300" />}
            {task.type === 'Claim' && <AlertCircle size={16} className="text-slate-300" />}
          </div>
        ))}
      </div>
      <button className="w-full mt-4 py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-colors">
        View All Tasks
      </button>
    </div>

      {/* Appointments & Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="font-semibold text-slate-800 mb-4">Today's Schedule</h3>
        <div className="space-y-4">
          {MOCK_APPOINTMENTS.map((apt) => {
            const [timeValue, meridiem] = apt.time.split(' ');
            return (
              <div
                key={apt.id}
                className="flex items-center gap-4 p-4 border border-slate-100 rounded-xl hover:shadow-md transition-shadow bg-slate-50/50"
              >
                <div className="flex flex-col items-center justify-center bg-white border border-slate-200 rounded-lg h-14 w-14 shadow-sm">
                  <span className="text-xs font-bold text-slate-500">{meridiem}</span>
                  <span className="text-lg font-bold text-slate-800">{timeValue}</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800">{apt.customerName}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {apt.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      {apt.channel === 'Video Call' ? <Video size={12} /> : <MapPin size={12} />}
                      {apt.channel}
                    </span>
                    <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">{apt.type}</span>
                  </div>
                </div>
                <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-full transition-all">
                  <MoreHorizontal size={20} />
                </button>
              </div>
            );
          })}
          <button className="w-full py-2 border border-dashed border-slate-300 rounded-xl text-slate-500 text-sm font-medium hover:bg-slate-50 hover:border-slate-400 transition-colors">
            + Add Appointment
          </button>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl text-white shadow-lg flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-lg mb-1">Quick Actions</h3>
          <p className="text-slate-400 text-sm mb-6">Common tasks for today</p>
          <div className="grid grid-cols-2 gap-4">
            <button className="bg-white/10 hover:bg-white/20 p-4 rounded-xl text-left transition-colors backdrop-blur-sm">
              <PenTool size={24} className="mb-2 text-blue-400" />
              <span className="block font-medium text-sm">New Proposal</span>
            </button>
            <button className="bg-white/10 hover:bg-white/20 p-4 rounded-xl text-left transition-colors backdrop-blur-sm">
              <Video size={24} className="mb-2 text-emerald-400" />
              <span className="block font-medium text-sm">Start Meeting</span>
            </button>
            <button className="bg-white/10 hover:bg-white/20 p-4 rounded-xl text-left transition-colors backdrop-blur-sm">
              <FileText size={24} className="mb-2 text-purple-400" />
              <span className="block font-medium text-sm">Check Status</span>
            </button>
            <button className="bg-white/10 hover:bg-white/20 p-4 rounded-xl text-left transition-colors backdrop-blur-sm">
              <Search size={24} className="mb-2 text-amber-400" />
              <span className="block font-medium text-sm">Client Search</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export const AgentProspects: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Prospect Pipeline</h2>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-md shadow-blue-200 transition-all">
          + Add Prospect
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Stage</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Probability</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Contact</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {MOCK_PROSPECTS.map((prospect) => (
              <tr key={prospect.id} className="hover:bg-slate-50 transition-colors group">
                <td className="p-4 font-medium text-slate-700">{prospect.name}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    prospect.status === 'Closing' ? 'bg-green-100 text-green-700' :
                    prospect.status === 'Proposal' ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {prospect.status}
                  </span>
                </td>
                <td className="p-4 text-slate-600">{prospect.probability}%</td>
                <td className="p-4 text-slate-500 text-sm">{prospect.lastContact}</td>
                <td className="p-4">
                  <button className="text-slate-400 hover:text-blue-600 transition-colors">
                    <MoreHorizontal size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const AgentPipeline: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Submission Pipeline</h2>
        <div className="flex gap-2">
          <button className="text-slate-500 hover:bg-slate-100 p-2 rounded-lg">
            <Filter size={20} />
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Applicant</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Plan</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Submitted</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {MOCK_PIPELINE.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <p className="font-medium text-slate-700">{item.applicant}</p>
                    <p className="text-xs text-slate-400">{item.id}</p>
                  </td>
                  <td className="p-4 text-slate-600">{item.plan}</td>
                  <td className="p-4">
                    <span className={`flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full text-xs font-medium ${
                      item.status === 'Pending Requirement' ? 'bg-amber-100 text-amber-700' :
                      item.status === 'Underwriting' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {item.status === 'Pending Requirement' && <AlertCircle size={12}/>}
                      {item.status === 'Underwriting' && <Clock size={12}/>}
                      {item.status}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500 text-sm">{item.submittedDate}</td>
                  <td className="p-4 text-sm text-slate-500 max-w-xs truncate">{item.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const AgentTraining: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Training & Knowledge Hub</h2>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5">
          <Search size={16} className="text-slate-400" />
          <input type="text" placeholder="Search modules..." className="text-sm outline-none text-slate-700" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {MOCK_TRAINING.map((module) => (
          <div key={module.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow cursor-pointer">
            <div className={`h-32 ${module.thumbnailColor} relative flex items-center justify-center`}>
              <PlayCircle size={48} className="text-white opacity-80 group-hover:scale-110 transition-transform" />
              {module.completed && (
                 <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm p-1 rounded-full">
                   <CheckCircle2 size={16} className="text-white" />
                 </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{module.category}</span>
                <span className="text-xs text-slate-500">{module.duration}</span>
              </div>
              <h3 className="font-bold text-slate-800 leading-tight mb-2">{module.title}</h3>
              <p className="text-xs text-slate-500">Master the basics and improve your sales pitch.</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const AgentNews: React.FC = () => {
  return (
    <div className="space-y-6">
       <h2 className="text-xl font-bold text-slate-800">Company News & E-Circulars</h2>
       <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50">
         {MOCK_CIRCULARS.map((news) => (
           <div key={news.id} className="p-5 flex items-start gap-4 hover:bg-slate-50 transition-colors cursor-pointer group">
             <div className="mt-1 p-2 bg-slate-100 rounded-lg text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
               <FileText size={20} />
             </div>
             <div className="flex-1">
               <div className="flex items-center gap-2 mb-1">
                 <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                   news.category === 'Product' ? 'bg-purple-100 text-purple-700' :
                   news.category === 'Compliance' ? 'bg-red-100 text-red-700' :
                   'bg-blue-100 text-blue-700'
                 }`}>
                   {news.category}
                 </span>
                 {!news.isRead && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
                 <span className="text-xs text-slate-400 ml-auto">{news.date}</span>
               </div>
               <h3 className="font-semibold text-slate-800">{news.title}</h3>
               <p className="text-sm text-slate-500 mt-1 line-clamp-1">
                 Click to read the full details regarding this announcement. AI Summary available.
               </p>
             </div>
             <ChevronRight size={16} className="text-slate-300 self-center" />
           </div>
         ))}
       </div>
    </div>
  );
};

export const AgentTools: React.FC = () => {
  const tools = [
    { title: 'Premium Calculator', icon: Calculator, desc: 'Quick quote for Life & Medical' },
    { title: 'Gap Estimator', icon: TrendingUp, desc: 'Identify shortfall in coverage' },
    { title: 'Jargon Translator', icon: Globe, desc: 'Simplify terms for clients' },
    { title: 'Proposal Generator', icon: PenTool, desc: 'Create PDF proposals instantly' },
    { title: 'Commission Check', icon: DollarSign, desc: 'Estimate your earnings' },
    { title: 'Appointment Scheduler', icon: Calendar, desc: 'Sync with Google Calendar' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-800">Sales Tools</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <tool.icon size={24} />
            </div>
            <h3 className="font-bold text-slate-800 mb-1">{tool.title}</h3>
            <p className="text-sm text-slate-500">{tool.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export const AgentSupport: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-slate-800">Agent Support Center</h2>
        <p className="text-slate-500">Need help with a case or system issue?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center group">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
             <Phone size={32} />
          </div>
          <h3 className="font-bold text-slate-800">Ops Hotline</h3>
          <p className="text-xs text-slate-500 mt-1">Mon-Fri, 9am - 6pm</p>
          <p className="font-mono text-emerald-600 mt-2 font-medium">1-800-88-9933</p>
        </button>

        <button className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center group">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
             <MessageCircle size={32} />
          </div>
          <h3 className="font-bold text-slate-800">Live Chat</h3>
          <p className="text-xs text-slate-500 mt-1">Instant support from Ops</p>
          <span className="text-blue-600 text-sm font-medium mt-2">Start Chat</span>
        </button>

        <button className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center group">
          <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 mb-4 group-hover:scale-110 transition-transform">
             <HelpCircle size={32} />
          </div>
          <h3 className="font-bold text-slate-800">Submit Ticket</h3>
          <p className="text-xs text-slate-500 mt-1">For complex case enquiries</p>
          <span className="text-purple-600 text-sm font-medium mt-2">Open Form</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="font-bold text-slate-800 mb-4">Frequently Asked Questions</h3>
        <div className="space-y-4">
          <details className="group">
            <summary className="flex justify-between items-center font-medium cursor-pointer list-none text-slate-700">
              <span>How do I appeal a declined medical case?</span>
              <span className="transition group-open:rotate-180">
                <ChevronRight size={16} />
              </span>
            </summary>
            <p className="text-slate-500 text-sm mt-2 group-open:animate-fadeIn">
              Submit a formal appeal letter along with new medical evidence (if any) via the e-Partner portal under 'Appeals'.
            </p>
          </details>
          <hr className="border-slate-50"/>
          <details className="group">
            <summary className="flex justify-between items-center font-medium cursor-pointer list-none text-slate-700">
              <span>What is the cutoff time for month-end submission?</span>
              <span className="transition group-open:rotate-180">
                <ChevronRight size={16} />
              </span>
            </summary>
            <p className="text-slate-500 text-sm mt-2 group-open:animate-fadeIn">
              For online submissions, the cutoff is 11:59 PM on the last calendar day. Physical forms must be received by 5:00 PM.
            </p>
          </details>
        </div>
      </div>
    </div>
  );
};

export const AgentPortals: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-800">Quick Access Portals</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {PORTAL_LINKS.map((portal) => (
          <a
            key={portal.name}
            href={portal.url}
            className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
              <Globe className="text-blue-600" size={24} />
            </div>
            <span className="font-medium text-slate-700">{portal.name}</span>
          </a>
        ))}
      </div>
    </div>
  );
};
