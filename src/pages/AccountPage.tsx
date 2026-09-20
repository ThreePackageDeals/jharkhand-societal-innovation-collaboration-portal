import React from 'react';
import { Building2, CheckCircle2, Code2, GraduationCap, Home, Landmark, Link2, LogOut, Mail, MapPin, Phone, ShieldCheck, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../LanguageContext';
import { Role } from '../types';

const roleIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  CITIZEN: UserRound,
  STUDENT: GraduationCap,
  FACULTY: ShieldCheck,
  UNIVERSITY_ADMIN: GraduationCap,
  INDUSTRY_REP: Building2,
  GOVT_ADMIN: Landmark,
  GOVERNMENT_ADMIN: Landmark,
  GOVERNMENT_OFFICIAL: Landmark,
  SUPER_ADMIN: Code2,
};

const roleKey: Record<string, { label: string; description: string }> = {
  CITIZEN: { label: 'account.role_citizen', description: 'account.role_citizen_desc' },
  STUDENT: { label: 'account.role_student', description: 'account.role_student_desc' },
  FACULTY: { label: 'account.role_faculty', description: 'account.role_faculty_desc' },
  UNIVERSITY_ADMIN: { label: 'account.role_university_admin', description: 'account.role_university_admin_desc' },
  INDUSTRY_REP: { label: 'account.role_industry', description: 'account.role_industry_desc' },
  GOVT_ADMIN: { label: 'account.role_government', description: 'account.role_government_desc' },
  GOVERNMENT_ADMIN: { label: 'account.role_government', description: 'account.role_government_desc' },
  GOVERNMENT_OFFICIAL: { label: 'account.role_government_official', description: 'account.role_government_official_desc' },
  SUPER_ADMIN: { label: 'account.role_developer', description: 'account.role_developer_desc' },
};

export default function AccountPage() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  if (!user) return null;

  const role = roleKey[user.role] || roleKey.CITIZEN;
  const Icon = roleIcon[user.role] || UserRound;
  const connections = user.accountConnections || { email: Boolean(user.email), phone: Boolean(user.phone), google: false };
  const profile = user.studentProfile || user.facultyProfile || user.industryProfile;
  const universityName = profile?.university?.name || profile?.universityName || profile?.universityId;
  const department = profile?.department;
  const organizationName = profile?.organization?.name || profile?.organizationName || profile?.organizationId;

  const connectionCard = (label: string, value: string, connected: boolean, connectionIcon: React.ReactNode) => (
    <div className="border border-stone-200 bg-[#FAF7F2] p-4 flex items-start gap-3">
      <div className="text-[#BC5434] mt-0.5">{connectionIcon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-widest font-bold text-stone-500">{label}</div>
        <div className="text-sm text-stone-900 truncate mt-1">{value || t('account.not_provided')}</div>
      </div>
      <span className={`inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold ${connected ? 'text-emerald-700' : 'text-stone-400'}`}>
        {connected && <CheckCircle2 className="w-3.5 h-3.5" />}
        {connected ? t('account.connected') : t('account.not_connected')}
      </span>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-stone-500 hover:text-[#BC5434] cursor-pointer"
        >
          <Home className="w-3.5 h-3.5" />
          {t('back_to_home')}
        </button>
        <div>
          <div className="editorial-meta">{t('account.eyebrow')}</div>
          <h1 className="font-editorial-serif text-4xl font-bold text-stone-900 mt-1">{t('account.title')}</h1>
          <p className="text-sm text-stone-500 font-serif italic mt-2">{t('account.subtitle')}</p>
        </div>
      </div>

      <section className="bg-white border border-stone-300 p-6 flex flex-col sm:flex-row sm:items-center gap-5">

        <div className="w-16 h-16 shrink-0 bg-[#1A1A1A] text-white flex items-center justify-center">
          <Icon className="w-8 h-8" />
        </div>
        <div className="flex-1">
          <div className="text-[10px] uppercase tracking-widest font-bold text-[#BC5434]">{t('account.role_label')}</div>
          <h2 className="font-editorial-serif text-2xl font-bold text-stone-900 mt-1">{t(role.label)}</h2>
          <p className="text-sm text-stone-600 font-serif italic mt-1">{t(role.description)}</p>
        </div>
        <div className="text-left sm:text-right">
          <div className="text-[10px] uppercase tracking-widest font-bold text-stone-500">{t('account.verification')}</div>
          <div className="text-sm font-bold text-stone-900 mt-1">{t(`account.status_${String(user.verificationStatus).toLowerCase()}`)}</div>
        </div>
      </section>

      <section className="bg-white border border-stone-300 p-6 space-y-4">
        <h2 className="font-editorial-serif text-xl font-bold text-stone-900">{t('account.identity_title')}</h2>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div className="border border-stone-200 p-3"><span className="block text-[10px] uppercase tracking-widest font-bold text-stone-500">{t('account.name')}</span><span className="block mt-1 text-stone-900">{user.fullName}</span></div>
          {user.district && <div className="border border-stone-200 p-3"><span className="block text-[10px] uppercase tracking-widest font-bold text-stone-500">{t('account.district')}</span><span className="flex items-center gap-1 mt-1 text-stone-900"><MapPin className="w-3.5 h-3.5 text-[#BC5434]" />{user.district}</span></div>}
          {universityName && <div className="border border-stone-200 p-3"><span className="block text-[10px] uppercase tracking-widest font-bold text-stone-500">{t('account.university')}</span><span className="block mt-1 text-stone-900">{universityName}</span></div>}
          {department && <div className="border border-stone-200 p-3"><span className="block text-[10px] uppercase tracking-widest font-bold text-stone-500">{t('account.department')}</span><span className="block mt-1 text-stone-900">{department}</span></div>}
          {organizationName && <div className="border border-stone-200 p-3"><span className="block text-[10px] uppercase tracking-widest font-bold text-stone-500">{t('account.organization')}</span><span className="block mt-1 text-stone-900">{organizationName}</span></div>}
        </div>
      </section>

      {user.role === 'CITIZEN' && (
        <section className="bg-white border border-stone-300 p-6 space-y-4">
          <h2 className="font-editorial-serif text-xl font-bold text-stone-900">Citizen entity type</h2>
          <div className="border border-stone-200 bg-[#FAF7F2] p-4">
            <div className="text-[10px] uppercase tracking-widest font-bold text-stone-500">Entity</div>
            <div className="text-sm text-stone-900 font-bold mt-2">
              {(() => {
                const v = user.citizenSubmitterType;
                if (!v) return t('account.not_provided');
                const map: Record<string, string> = {
                  citizen: 'Individual',
                  community_group: 'Community Group',
                  gram_panchayat: 'Panchayati Raj Institution',
                  urban_local_body: 'Urban Local Body',
                  govt_agency: 'Government Agency',
                };
                return map[v] || v;
              })()}
            </div>
          </div>
        </section>
      )}

      <section className="bg-white border border-stone-300 p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-editorial-serif text-xl font-bold text-stone-900">{t('account.connections_title')}</h2>
            <p className="text-xs text-stone-500 font-serif italic mt-1">{t('account.connections_desc')}</p>
          </div>
          {!connections.google && user.id !== 'dev-user-id' && (
            <button type="button" onClick={() => window.location.assign('/api/auth/google/link')} className="inline-flex items-center gap-2 bg-[#BC5434] text-white px-3 py-2 text-[10px] uppercase tracking-widest font-bold hover:bg-[#A3452B] cursor-pointer">
              <Link2 className="w-3.5 h-3.5" />{t('common.connect_google')}
            </button>
          )}
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          {connectionCard(t('account.email'), user.email, connections.email, <Mail className="w-4 h-4" />)}
          {connectionCard(t('account.phone'), user.phone || '', connections.phone, <Phone className="w-4 h-4" />)}
          {connectionCard(t('account.google'), connections.google ? t('account.google_linked') : '', connections.google, <Link2 className="w-4 h-4" />)}
        </div>
      </section>

      <div className="flex justify-end">
        <button type="button" onClick={() => { logout(); navigate('/auth', { replace: true }); }} className="inline-flex items-center gap-2 border border-stone-300 px-4 py-2.5 text-[10px] uppercase tracking-widest font-bold text-stone-600 hover:border-[#BC5434] hover:text-[#BC5434] cursor-pointer">
          <LogOut className="w-4 h-4" />{t('common.sign_out')}
        </button>
      </div>
    </div>
  );
}
