import React, { useState, useEffect } from 'react';
import { Send, MessageSquare, ShieldCheck, Loader2, Users, CheckCircle2 } from 'lucide-react';
import { DiscussionMessage, SubmitterRole } from '../types';
import { useLanguage } from '../LanguageContext';

interface DiscussionThreadProps {
  problemId: string;
  problemTitle: string;
  currentUserRole: 'citizen' | 'university' | 'industry' | 'admin';
}

export const DiscussionThread: React.FC<DiscussionThreadProps> = ({
  problemId,
  problemTitle,
  currentUserRole,
}) => {
  const { t } = useLanguage();
  const [discussions, setDiscussions] = useState<DiscussionMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [senderName, setSenderName] = useState('');
  const [message, setMessage] = useState('');

  // Map user role to SubmitterRole
  const getRoleBadge = (role: SubmitterRole) => {
    switch (role) {
      case 'Citizen':
        return { bg: 'bg-[#FAF7F2] text-[#BC5434] border-stone-300', label: t('discussion.role_citizen') };
      case 'Student Researcher':
        return { bg: 'bg-[#FAF7F2] text-stone-900 border-stone-300', label: t('discussion.role_student') };
      case 'Faculty Mentor':
        return { bg: 'bg-stone-900 text-white border-stone-900', label: t('discussion.role_faculty') };
      case 'Industry Guide':
        return { bg: 'bg-[#FAF7F2] text-[#BC5434] border-stone-300', label: t('discussion.role_industry') };
      case 'Government Admin':
        return { bg: 'bg-stone-800 text-white border-stone-800', label: t('discussion.role_govt') };
      default:
        return { bg: 'bg-stone-100 text-stone-700 border-stone-300', label: role };
    }
  };

  const mapCurrentRoleToSubmitterRole = (): SubmitterRole => {
    switch (currentUserRole) {
      case 'citizen':
        return 'Citizen';
      case 'university':
        return 'Faculty Mentor';
      case 'industry':
        return 'Industry Guide';
      case 'admin':
        return 'Government Admin';
      default:
        return 'Citizen';
    }
  };

  // Fetch discussions
  const loadDiscussions = async () => {
    try {
      const res = await fetch(`/api/discussions/${encodeURIComponent(problemId)}`);
      const response = await res.json();
      if (!res.ok) throw new Error(response?.error?.message || 'Failed to load discussions');
      const data = response?.data ?? response;
      setDiscussions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load discussions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiscussions();
    // Default sender name based on role
    if (!senderName) {
      if (currentUserRole === 'citizen') setSenderName('Ramu Munda (Gram Pradhan)');
      else if (currentUserRole === 'university') setSenderName('Dr. Sudeshna Mukherjee (BIT Mesra)');
      else if (currentUserRole === 'industry') setSenderName('Er. Amitabh Sharma (Tata Steel CSR)');
      else setSenderName('State Innovation Officer');
    }
  }, [problemId, currentUserRole]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSending(true);
    try {
      const payload = {
        senderName: senderName.trim() || 'Contributor',
        senderRole: mapCurrentRoleToSubmitterRole(),
        message: message.trim(),
      };
      const token = localStorage.getItem('auth_token');

      const res = await fetch('/api/discussions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ problemId, ...payload }),
      });

      const response = await res.json();
      if (!res.ok) throw new Error(response?.error?.message || 'Failed to post discussion');
      const savedMessage = response?.data ?? response;
      setDiscussions((prev) => [...prev, savedMessage]);
      setMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
      alert(t('discussion.send_error'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-[#FDFCFB] border border-stone-300 shadow-none overflow-hidden flex flex-col h-[520px]">
      {/* Header */}
      <div className="bg-[#1A1A1A] text-stone-100 px-5 py-3 flex items-center justify-between border-b border-stone-800">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#E07A5F]" />
          <h4 className="font-editorial-serif italic font-bold text-sm text-white">{t('discussion.title')}</h4>
        </div>
        <span className="editorial-meta !text-[10px] !mb-0 text-stone-300">
          {t('discussion.updates', discussions.length)}
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FAF7F2]">
        {loading ? (
          <div className="flex justify-center items-center h-full text-stone-400 text-xs font-serif italic">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            <span>{t('discussion.loading')}</span>
          </div>
        ) : discussions.length === 0 ? (
          <div className="text-center py-12 text-stone-400 text-xs font-serif italic">
            {t('discussion.empty')}
          </div>
        ) : (
          discussions.map((msg) => {
            const badge = getRoleBadge(msg.senderRole);
            const dateStr = new Date(msg.timestamp).toLocaleString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div key={msg.id} className="bg-white p-3.5 border border-stone-300 shadow-none space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900 text-xs">{msg.senderName}</span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border ${badge.bg}`}>
                      {badge.label}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-stone-400">{dateStr}</span>
                </div>
                <p className="text-xs text-stone-800 font-serif leading-relaxed whitespace-pre-wrap">{msg.message}</p>
              </div>
            );
          })
        )}
      </div>

      {/* Send Message Form */}
      <form onSubmit={handleSendMessage} className="p-3.5 bg-white border-t border-stone-300 space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder={t('discussion.name_placeholder')}
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-stone-300 bg-[#FAF7F2] w-1/3 text-stone-900 focus:outline-none focus:border-stone-900"
          />
          <div className="text-xs text-stone-500 font-serif italic">
            {t('discussion.posting_as')} <strong className="text-stone-900 font-sans not-italic">{getRoleBadge(mapCurrentRoleToSubmitterRole()).label}</strong>
          </div>
        </div>

        <div className="flex gap-2">
          <textarea
            rows={2}
            placeholder={t('discussion.message_placeholder')}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 text-xs p-2.5 border border-stone-300 bg-[#FAF7F2] text-stone-900 focus:outline-none focus:border-stone-900 leading-relaxed font-serif"
          ></textarea>
          <button
            type="submit"
            disabled={sending || !message.trim()}
            className="self-end inline-flex items-center gap-1.5 bg-[#BC5434] hover:bg-[#A3452B] text-white font-bold uppercase tracking-widest text-xs px-4 py-2.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>{t('discussion.post')}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
