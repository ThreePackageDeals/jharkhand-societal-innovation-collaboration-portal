import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Loader2, Bell, MessageCircle, LogIn, LogOut, UserRound, Link2, TestTube } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { useAuth } from '../AuthContext';
import { useAppContext } from '../AppContext';
import { NotificationPanel } from './NotificationPanel';
import { ProblemDetailsModal } from './ProblemDetailsModal';
import { VerificationBanner } from './VerificationBanner';
import { DevLoginPanel } from './DevLoginPanel';

export function Layout() {
  const { language, setLanguage, t } = useLanguage();
  const { user, isLoading: isAuthLoading, logout, devLogin } = useAuth();
  const navigate = useNavigate();
  const [isDevPanelOpen, setIsDevPanelOpen] = useState(false);
  const {
    isLoading,
    isNotificationOpen,
    setIsNotificationOpen,
    notifications,
    handleMarkNotificationRead,
    handleMarkAllNotificationsRead,
    unreadNotificationsCount,
    selectedProblem,
    setSelectedProblem,
    activeProposalForSelectedProblem,
    handleUpvote,
    userRole,
  } = useAppContext();

  // Show dev login button only in development
  const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] flex flex-col font-sans selection:bg-[#BC5434]/20 selection:text-[#1A1A1A]">
      {/* Language Toggle */}
      <div className="fixed top-6 left-6 z-50">
        <div
          onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
          className="group relative w-20 h-9 bg-stone-200 rounded-full p-1 cursor-pointer transition-all duration-300 hover:bg-stone-300 shadow-sm border border-stone-300"
          title={t('language_toggle')}
        >
          {/* Sliding Pill */}
          <div
            className={`absolute top-1 left-1 w-9 h-7 rounded-full shadow-sm transition-all duration-300 ease-in-out transform ${
              language === 'en'
                ? 'translate-x-0 bg-white'
                : 'translate-x-9 bg-[#BC5434]'
            }`}
          />

          {/* Labels */}
          <div className="relative z-10 flex justify-between items-center h-full px-2 text-[10px] font-bold uppercase tracking-wider">
            <span className={`transition-colors duration-300 ${language === 'en' ? 'text-stone-900' : 'text-stone-500'}`}>
              EN
            </span>
            <span className={`transition-colors duration-300 ${language === 'hi' ? 'text-white' : 'text-stone-500'}`}>
              हिंदी
            </span>
          </div>
        </div>
      </div>

      {/* Account and notification controls */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-2">
        {/* Dev Login Button (only in development) */}
        {isDevelopment && !user && (
          <button
            type="button"
            onClick={() => setIsDevPanelOpen(true)}
            className="inline-flex items-center gap-2 bg-[#BC5434] text-white px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider shadow-md transition-colors hover:bg-[#A3452B] cursor-pointer"
            title="Dev Login (Testing Only)"
          >
            <TestTube className="h-4 w-4" />
            <span>DEV LOGIN</span>
          </button>
        )}

        {!isAuthLoading && (
          user ? (
            <>
              {!user.accountConnections?.google && user.id !== 'dev-user-id' && !user.id.startsWith('dev-') && (
                <button
                  type="button"
                  onClick={() => window.location.assign('/api/auth/google/link')}
                  className="inline-flex items-center gap-2 border border-stone-300 bg-white px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-stone-700 shadow-md transition-colors hover:border-[#BC5434] hover:text-[#BC5434] cursor-pointer"
                  title={t('common.connect_google')}
                >
                  <Link2 className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('common.connect_google')}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate('/account')}
                className="inline-flex items-center gap-2 border border-stone-300 bg-white px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-stone-700 shadow-md transition-colors hover:border-[#BC5434] hover:text-[#BC5434] cursor-pointer"
                title={t('common.view_account')}
              >
                <UserRound className="h-4 w-4" />
                <span className="hidden sm:inline">{user.fullName || t('common.account')}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/auth', { replace: true });
                }}
                className="inline-flex items-center border border-stone-300 bg-white p-2.5 text-stone-600 shadow-md transition-colors hover:border-[#BC5434] hover:text-[#BC5434] cursor-pointer"
                title={t('common.sign_out')}
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/auth')}
              className="inline-flex items-center gap-2 bg-[#1A1A1A] px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-md transition-colors hover:bg-[#BC5434] cursor-pointer"
            >
              <LogIn className="h-4 w-4" />
              <span>{t('common.sign_in_register')}</span>
            </button>
          )
        )}
        <button
          onClick={() => setIsNotificationOpen(true)}
          className="relative p-3 bg-white border border-stone-200 text-stone-500 hover:text-[#BC5434] hover:border-[#BC5434] rounded-full shadow-md transition-all duration-200 cursor-pointer active:scale-90"
          title={t('notifications')}
        >
          <Bell className="w-6 h-6" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-2 right-2 w-3 h-3 bg-[#BC5434] rounded-full border-2 border-white"></span>
          )}
        </button>
      </div>

      {/* Global Chat/Forum Trigger */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => navigate('/communication?tab=discussions')}
          className="relative p-4 bg-[#BC5434] text-white rounded-full shadow-xl hover:bg-[#A3452B] transition-all duration-200 cursor-pointer active:scale-90 group"
          title={t('layout.community_forum')}
        >
          <MessageCircle className="w-7 h-7" />
          {/* Simple pulse effect if there are unread notifications */}
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          )}
          {/* Tooltip on hover */}
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-stone-900 text-white text-[10px] font-medium leading-tight rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-normal w-48 text-center">
            {t('layout.forum_desc')}
          </span>
        </button>
      </div>

      <NotificationPanel
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkNotificationRead}
        onMarkAllAsRead={handleMarkAllNotificationsRead}
        onOpenCommunicationHub={() => {
          setIsNotificationOpen(false);
          navigate('/communication?tab=inbox');
        }}
      />

      <DevLoginPanel
        isOpen={isDevPanelOpen}
        onClose={() => setIsDevPanelOpen(false)}
        onDevLogin={devLogin}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <VerificationBanner />
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-28 text-stone-600">
            <Loader2 className="w-8 h-8 animate-spin text-[#BC5434] mb-3" />
            <p className="text-base font-editorial-serif italic font-bold text-stone-900">{t('connecting_registry')}</p>
            <p className="text-xs uppercase tracking-widest text-stone-500 mt-1">{t('syncing_nodes')}</p>
          </div>
        ) : (
          <Outlet />
        )}
      </main>

      {/* Problem Details & Collaboration Modal */}
      <ProblemDetailsModal
        problem={selectedProblem}
        proposal={activeProposalForSelectedProblem}
        onClose={() => setSelectedProblem(null)}
        onUpvote={handleUpvote}
        currentUserRole={userRole}
      />

      {/* Footer */}
      <footer className="bg-[#1A1A1A] text-stone-400 border-t border-stone-800 text-xs py-10 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-stone-800 text-center md:text-left">
            <div>
              <div className="flex items-center justify-center md:justify-start gap-2.5 text-stone-100 font-bold text-base">
                <span className="font-editorial-serif italic text-xl text-white">Samadhan.JH</span>
                <span className="text-[10px] uppercase font-bold tracking-[2px] text-[#BC5434] border-l border-stone-700 pl-2">
                  {t('footer_title')}
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-1 font-serif italic max-w-xl">
                {t('footer_desc')}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-bold uppercase tracking-wider">
              <span className="text-[#E07A5F]">{t('layout.districts_count')}</span>
              <span className="text-stone-700">•</span>
              <span className="text-stone-300">{t('layout.premier_heis')}</span>
              <span className="text-stone-700">•</span>
              <span className="text-stone-300">{t('layout.csr_compliant')}</span>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-stone-500">
            <div>
              {t('layout.copyright').replace('{year}', new Date().getFullYear().toString())}
            </div>
            <div className="text-stone-400 font-serif italic">
              {t('layout.academic_nodes')}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
