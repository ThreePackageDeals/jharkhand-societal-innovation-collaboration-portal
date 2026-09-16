import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  MessageSquare, 
  Search, 
  Users, 
  Building2, 
  GraduationCap, 
  FileText,
  Clock,
  ArrowRight,
  Bell
} from 'lucide-react';
import { SystemNotification, ProblemStatement, SubmitterRole } from '../types';

interface CommunicationHubProps {
  notifications: SystemNotification[];
  problems: ProblemStatement[];
  userRole: 'citizen' | 'university' | 'industry' | 'admin';
  onViewProblemDetails: (problem: ProblemStatement) => void;
}

export const CommunicationHub: React.FC<CommunicationHubProps> = ({
  notifications,
  problems,
  userRole,
  onViewProblemDetails
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const [activeSubTab, setActiveSubTab] = useState<'inbox' | 'discussions'>(
    requestedTab === 'inbox' ? 'inbox' : 'discussions'
  );
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (requestedTab === 'inbox' || requestedTab === 'discussions') {
      setActiveSubTab(requestedTab);
    }
  }, [requestedTab]);

  const selectTab = (tab: 'inbox' | 'discussions') => {
    setActiveSubTab(tab);
    setSearchParams({ tab });
  };

  // Map user role for UI
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'citizen': return { bg: 'bg-[#FAF7F2] text-[#BC5434] border-stone-300', label: 'Citizen / PRI' };
      case 'university': return { bg: 'bg-[#FAF7F2] text-stone-900 border-stone-300', label: 'University / Faculty' };
      case 'industry': return { bg: 'bg-[#FAF7F2] text-[#BC5434] border-stone-300', label: 'Industry / CSR' };
      case 'admin': return { bg: 'bg-stone-800 text-white border-stone-800', label: 'Govt. Admin' };
      default: return { bg: 'bg-stone-100 text-stone-700 border-stone-300', label: role };
    }
  };

  const badge = getRoleBadge(userRole);

  const timeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.round(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return `${Math.round(diffHrs / 24)}d ago`;
  };

  // Filter notifications (Inbox)
  const filteredNotifications = notifications.filter(n => 
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    n.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter problems for Active Discussions
  const filteredProblems = problems.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.trackingCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#1A1A1A] text-stone-100 p-8 border border-stone-800 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="editorial-meta">Communication Hub</span>
              <span className="text-stone-600">•</span>
              <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">Global Inbox</span>
            </div>
            <h2 className="font-editorial-serif italic text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Lifecycle Collaboration Center
            </h2>
            <p className="text-xs text-stone-400 font-serif italic max-w-2xl mt-2 leading-relaxed">
              Unified communication stream bridging citizens, academia, industry partners, and government triage officers.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-stone-900 border border-stone-800 p-4">
             <div className="text-right">
                <span className="text-[10px] text-stone-400 block font-serif italic mb-1">Current Session</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border ${badge.bg}`}>
                  {badge.label}
                </span>
             </div>
          </div>
        </div>
      </div>

      {/* Tabs and Search */}
      <div className="bg-white border border-stone-300 p-3 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 border-b border-stone-200 w-full md:w-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => selectTab('inbox')}
            className={`py-2.5 px-2 md:px-4 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeSubTab === 'inbox'
                ? 'border-b-2 border-stone-900 font-bold text-stone-900'
                : 'border-b-2 border-transparent text-stone-500 hover:text-stone-900 hover:border-stone-300'
            }`}
          >
            <Bell className="w-4 h-4 shrink-0" />
            <span className="text-sm">System Inbox</span>
            <span className="text-[10px] bg-[#BC5434] text-white px-1.5 py-0.5 rounded-full shrink-0">
              {notifications.filter(n => !n.read).length}
            </span>
          </button>
          
          <button
            onClick={() => selectTab('discussions')}
            className={`py-2.5 px-2 md:px-4 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeSubTab === 'discussions'
                ? 'border-b-2 border-stone-900 font-bold text-stone-900'
                : 'border-b-2 border-transparent text-stone-500 hover:text-stone-900 hover:border-stone-300'
            }`}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span className="text-sm">Active Project Threads</span>
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Search messages or projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs p-2 pl-8 border border-stone-300 bg-[#FAF7F2] text-stone-900 focus:outline-none focus:border-stone-900 transition-colors"
          />
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white border border-stone-300 shadow-none min-h-[500px]">
        
        {/* Inbox View */}
        {activeSubTab === 'inbox' && (
          <div className="divide-y divide-stone-200">
            {filteredNotifications.length === 0 ? (
              <div className="p-12 text-center text-stone-500">
                <Bell className="w-8 h-8 text-stone-300 mx-auto mb-3" />
                <p className="text-sm font-serif italic">No messages match your search.</p>
              </div>
            ) : (
              filteredNotifications.map(notif => (
                <div key={notif.id} className={`p-4 flex gap-4 transition-colors ${notif.read ? 'bg-white' : 'bg-[#FAF7F2]'}`}>
                  <div className="shrink-0 mt-1">
                    {notif.type === 'alert' && <div className="w-8 h-8 rounded bg-red-100 text-red-600 flex items-center justify-center"><Bell className="w-4 h-4" /></div>}
                    {notif.type === 'success' && <div className="w-8 h-8 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center"><Building2 className="w-4 h-4" /></div>}
                    {notif.type === 'message' && <div className="w-8 h-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center"><MessageSquare className="w-4 h-4" /></div>}
                    {(notif.type === 'info' || notif.type === 'warning') && <div className="w-8 h-8 rounded bg-amber-100 text-amber-600 flex items-center justify-center"><Clock className="w-4 h-4" /></div>}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className={`text-sm font-bold ${notif.read ? 'text-stone-700' : 'text-stone-900'}`}>{notif.title}</h4>
                      <span className="text-[10px] text-stone-500 font-mono">{timeAgo(notif.timestamp)}</span>
                    </div>
                    <p className="text-xs text-stone-600 font-serif leading-relaxed mb-2">{notif.message}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] uppercase tracking-widest font-bold text-stone-400">Target Role:</span>
                      <span className="text-[10px] border border-stone-300 bg-white px-2 py-0.5 text-stone-600">{notif.targetRole}</span>
                    </div>
                  </div>
                  {!notif.read && (
                    <div className="w-2 h-2 rounded-full bg-[#BC5434] mt-2 shrink-0"></div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Discussions View */}
        {activeSubTab === 'discussions' && (
          <div className="divide-y divide-stone-200">
            {filteredProblems.length === 0 ? (
              <div className="p-12 text-center text-stone-500">
                <MessageSquare className="w-8 h-8 text-stone-300 mx-auto mb-3" />
                <p className="text-sm font-serif italic">No projects found.</p>
              </div>
            ) : (
              filteredProblems.map(problem => (
                <div key={problem.id} className="p-4 flex items-center justify-between hover:bg-stone-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded border border-stone-300 bg-[#FAF7F2] flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-stone-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[10px] font-bold text-[#BC5434] bg-[#BC5434]/10 px-2 py-0.5">
                          {problem.trackingCode}
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500">
                          {problem.status.replace('_', ' ')}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-stone-900 mb-1 line-clamp-1">{problem.title}</h4>
                      <p className="text-xs text-stone-500 font-serif line-clamp-1 max-w-2xl">
                        {problem.description}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => onViewProblemDetails(problem)}
                    className="shrink-0 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#BC5434] hover:text-[#A3452B] p-2"
                  >
                    <span>Open Thread</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};