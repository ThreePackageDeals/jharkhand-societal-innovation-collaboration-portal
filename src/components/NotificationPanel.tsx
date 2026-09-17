import React from 'react';
import {
  Bell,
  X,
  CheckCircle2,
  AlertTriangle,
  Info,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { SystemNotification } from '../types';
import { useLanguage } from '../LanguageContext';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: SystemNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onOpenCommunicationHub?: () => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onOpenCommunicationHub
}) => {
  const { t } = useLanguage();
  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-stone-900" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-stone-900" />;
      case 'alert': return <AlertCircle className="w-4 h-4 text-[#BC5434]" />;
      case 'message': return <MessageSquare className="w-4 h-4 text-stone-900" />;
      default: return <Info className="w-4 h-4 text-stone-900" />;
    }
  };

  const timeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 60) return t('notifications_m_ago', diffMins);
    const diffHrs = Math.round(diffMins / 60);
    if (diffHrs < 24) return t('notifications_h_ago', diffHrs);
    return t('notifications_d_ago', Math.round(diffHrs / 24));
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col border-l border-stone-300 transform transition-transform duration-300 ease-in-out">
      <div className="p-6 border-b border-stone-200 bg-[#FAF7F2] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-stone-900" />
          <h2 className="font-editorial-serif text-xl font-bold text-stone-900">{t('notifications')}</h2>
          {unreadCount > 0 && (
            <span className="bg-[#1A1A1A] text-white text-[10px] font-bold uppercase tracking-widest px-2 py-0.5">
              {unreadCount} {t('notifications_new')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="text-[10px] font-bold uppercase tracking-wider text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
            >
              {t('notifications_mark_all_read')}
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-stone-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-stone-500 flex flex-col items-center">
            <Bell className="w-12 h-12 text-stone-200 mb-4" />
            <p className="font-serif italic text-sm">{t('notifications_empty')}</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-200">
            {notifications.map(notif => (
              <div
                key={notif.id}
                className={`p-5 flex gap-4 cursor-pointer hover:bg-stone-50 transition-colors ${notif.read ? 'bg-white opacity-70' : 'bg-[#FAF7F2]'}`}
                onClick={() => {
                  if (!notif.read) onMarkAsRead(notif.id);
                }}
              >
                <div className="mt-1 shrink-0">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className={`text-sm font-bold truncate pr-2 ${notif.read ? 'text-stone-600' : 'text-stone-900'}`}>
                      {notif.title}
                    </h4>
                    <span className="text-[10px] font-serif italic text-stone-500 whitespace-nowrap shrink-0 mt-0.5">
                      {timeAgo(notif.timestamp)}
                    </span>
                  </div>
                  <p className={`text-xs leading-relaxed ${notif.read ? 'text-stone-500' : 'text-stone-700'}`}>
                    {notif.message}
                  </p>
                </div>
                {!notif.read && (
                  <div className="w-2 h-2 bg-[#BC5434] mt-2.5 shrink-0"></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-stone-200 bg-white text-center">
        <button
          onClick={(e) => {
            e.preventDefault();
            if (onOpenCommunicationHub) onOpenCommunicationHub();
          }}
          className="text-[11px] text-stone-600 hover:text-stone-900 font-bold uppercase tracking-widest cursor-pointer py-2 px-4 border border-transparent hover:border-stone-300 transition-all w-full"
        >
          {t('notifications_view_hub')}
        </button>
      </div>
    </div>
  );
};

