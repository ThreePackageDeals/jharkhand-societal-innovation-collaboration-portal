import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../LanguageContext';
import { Role } from '../types';
import { User, GraduationCap, Building2, ShieldCheck, ArrowRight, Loader2, Home } from 'lucide-react';

type AuthStep = 'ROLE_SELECTION' | 'CREDENTIALS' | 'ONBOARDING' | 'COMPLETING';
type OtpStatus = 'idle' | 'sent' | 'verified';

export const AuthPage = () => {
  const [step, setStep] = useState<AuthStep>('ROLE_SELECTION');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [otpStatus, setOtpStatus] = useState<{ email: OtpStatus; phone: OtpStatus }>({ email: 'idle', phone: 'idle' });
  const [registrationToken, setRegistrationToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, completeProfile, bypassLogin, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine the redirect path: either the one saved in state or the root
  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const googleToken = params.get('google_token');
    const googleError = params.get('google_error');
    if (!googleToken && !googleError) return;

    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    if (googleError) {
      alert(googleError);
      return;
    }

    void login(googleToken!).then(() => navigate(from, { replace: true })).catch((err) => {
      alert(err instanceof Error ? err.message : t('auth.google_signin_failed'));
    });
  }, [from, location.search, login, navigate]);

  const roles = [
    { id: 'CITIZEN' as Role, label: t('auth.role_citizen_label'), icon: User, description: t('auth.role_citizen_desc') },
    { id: 'STUDENT' as Role, label: t('auth.role_student_label'), icon: GraduationCap, description: t('auth.role_student_desc') },
    { id: 'FACULTY' as Role, label: t('auth.role_faculty_label'), icon: ShieldCheck, description: t('auth.role_faculty_desc') },
    { id: 'INDUSTRY_REP' as Role, label: t('auth.role_industry_label'), icon: Building2, description: t('auth.role_industry_desc') },
  ];

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setOtpStatus({ email: 'idle', phone: 'idle' });
    setRegistrationToken('');
    setStep('CREDENTIALS');
  };

  const sendOtp = async (identifier: string, channel: 'email' | 'phone') => {
    if (!identifier.trim()) return alert(t(channel === 'email' ? 'auth.enter_email' : 'auth.enter_phone'));
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || 'Unable to send verification code');
      setOtpStatus((current) => ({ ...current, [channel]: 'sent' }));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (identifier: string, otp: string, channel: 'email' | 'phone') => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, otp, registrationToken: registrationToken || undefined }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || 'Unable to verify code');
      setRegistrationToken(result.data.registrationToken);
      setOtpStatus((current) => ({ ...current, [channel]: 'verified' }));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpStatus.email === 'verified' && otpStatus.phone === 'verified' && registrationToken) {
      setStep('ONBOARDING');
      return;
    }
    alert(t('auth.verify_both'));
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStep('COMPLETING');

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const profileData: any = {
      email,
      role: selectedRole,
      fullName: formData.get('fullName'),
      phone,
      district: formData.get('district'),
    };

    if (selectedRole === 'STUDENT' || selectedRole === 'FACULTY') {
      profileData.universityId = formData.get('universityId');
      profileData.department = formData.get('department');
      if (selectedRole === 'STUDENT') {
        profileData.studentIdNumber = formData.get('studentIdNumber');
      } else {
        profileData.employeeId = formData.get('employeeId');
        profileData.designation = formData.get('designation');
      }
    } else if (selectedRole === 'INDUSTRY_REP') {
      profileData.organizationName = formData.get('organizationName');
      profileData.registrationNumber = formData.get('registrationNumber');
      profileData.website = formData.get('website');
      profileData.orgType = formData.get('orgType');
      profileData.industryDesignation = formData.get('industryDesignation');
    }

    try {
      const result = await completeProfile(profileData, registrationToken);
      if (result.sheerIdVerificationUrl) {
        window.location.assign(result.sheerIdVerificationUrl);
      } else {
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      const msg = (err?.message || '').toLowerCase();
      // A document/verification error means the elevated login session must be
      // revoked — otherwise the protected (guarded) pages stay accessible even
      // though verification never succeeded.
      const isVerificationError =
        msg.includes('document') || msg.includes('verification') || msg.includes('registration document');
      if (isVerificationError) {
        alert(err.message);
        logout();
        setStep('ROLE_SELECTION');
      } else {
        alert(err.message);
        setStep('ONBOARDING');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] flex items-center justify-center p-4 font-sans">
      <button
        type="button"
        onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
        className="fixed top-6 left-6 z-50 w-20 h-9 bg-stone-200 rounded-full p-1 cursor-pointer transition-all duration-300 hover:bg-stone-300 shadow-sm border border-stone-300"
        title={t('language_toggle')}
        aria-label={t('language_toggle')}
      >
        <span
          className={`absolute top-1 left-1 w-9 h-7 rounded-full shadow-sm transition-transform duration-300 ease-in-out ${
            language === 'en' ? 'translate-x-0 bg-white' : 'translate-x-9 bg-[#BC5434]'
          }`}
        />
        <span className="relative z-10 flex justify-between items-center h-full px-2 text-[10px] font-bold uppercase tracking-wider">
          <span className={language === 'en' ? 'text-stone-900' : 'text-stone-500'}>EN</span>
          <span className={language === 'hi' ? 'text-white' : 'text-stone-500'}>HI</span>
        </span>
      </button>
      <div className="max-w-md w-full bg-white border border-stone-200 rounded-sm shadow-sm p-8">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mb-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-stone-500 hover:text-[#BC5434] transition-colors cursor-pointer"
        >
          <Home className="h-4 w-4" />
          {t('back_to_home')}
        </button>

        {step === 'ROLE_SELECTION' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="font-editorial-serif text-4xl font-bold text-stone-900 tracking-tight mb-2">{t('auth.welcome')}</h1>
              <p className="text-stone-500 text-sm font-serif italic">{t('auth.role_select')}</p>
            </div>
            <div className="grid gap-4">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => handleRoleSelect(role.id)}
                  className="flex items-center p-4 border border-stone-200 rounded-sm hover:border-[#BC5434] hover:bg-[#FAF7F2] transition-all duration-300 group text-left cursor-pointer"
                >
                  <div className="p-3 bg-[#FAF7F2] border border-stone-200 rounded-sm group-hover:bg-white transition-colors">
                    <role.icon className="h-6 w-6 text-stone-600 group-hover:text-[#BC5434]" />
                  </div>
                  <div className="ml-4">
                    <div className="font-bold text-stone-900 uppercase tracking-wider text-xs">{role.label}</div>
                    <div className="text-xs text-stone-500 font-serif italic">{role.description}</div>
                  </div>
                  <ArrowRight className="ml-auto h-5 w-5 text-stone-300 group-hover:text-[#BC5434] transition-colors" />
                </button>
              ))}
            </div>
            <div className="pt-6 border-t border-stone-100 text-center">
              <button
                type="button"
                onClick={() => {
                  bypassLogin();
                  navigate(from, { replace: true });
                }}
                className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
              >
                {t('auth.dev_bypass')}
              </button>
            </div>
          </div>
        )}

        {step === 'CREDENTIALS' && (
          <div className="space-y-6">
            <button onClick={() => setStep('ROLE_SELECTION')} className="text-xs font-bold uppercase tracking-widest text-stone-500 hover:text-[#BC5434] transition-colors cursor-pointer">{t('auth.back_to_roles')}</button>
            <div className="text-center mb-8">
              <h1 className="font-editorial-serif text-4xl font-bold text-stone-900 tracking-tight mb-2">{t('auth.signin')}</h1>
              <p className="text-stone-500 text-sm font-serif italic">{t('auth.signin_desc')}</p>
            </div>
            <button
              type="button"
              onClick={() => window.location.assign('/api/auth/google')}
              className="w-full p-3 border border-stone-300 rounded-sm hover:bg-stone-50 transition-colors text-xs font-bold uppercase tracking-wider text-stone-600 cursor-pointer inline-flex items-center justify-center gap-3"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M21.35 12.27c0-.79-.07-1.55-.2-2.27H12v4.3h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.7 2.91-4.2 2.91-7.42Z" />
                <path fill="#34A853" d="M12 21.75c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.7-1.72-5.47-4.03H3.29v2.53A9.75 9.75 0 0 0 12 21.75Z" />
                <path fill="#FBBC05" d="M6.53 13.83A5.86 5.86 0 0 1 6.22 12c0-.64.11-1.26.31-1.83V7.64H3.29A9.74 9.74 0 0 0 2.25 12c0 1.57.38 3.06 1.04 4.36l3.24-2.53Z" />
                <path fill="#EA4335" d="M12 6.14c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.23 14.63 2.25 12 2.25a9.75 9.75 0 0 0-8.71 5.39l3.24 2.53C7.3 7.86 9.46 6.14 12 6.14Z" />
              </svg>
              {t('auth.google_oauth')}
            </button>
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-stone-400">
              <span className="h-px flex-1 bg-stone-200" />
              <span>{t('auth.register_with_otp')}</span>
              <span className="h-px flex-1 bg-stone-200" />
            </div>
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold tracking-widest text-stone-700">{t('auth.email_label')}</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={otpStatus.email === 'verified'}
                  className="w-full p-3 border border-stone-300 bg-white focus:outline-none focus:border-[#BC5434] text-sm"
                  placeholder={t('auth.email_placeholder')}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => sendOtp(email, 'email')}
                  disabled={isLoading || otpStatus.email === 'verified'}
                  className="shrink-0 p-3 border border-stone-300 rounded-sm hover:bg-stone-50 disabled:opacity-50 text-xs font-bold uppercase tracking-wider text-stone-600 cursor-pointer"
                >
                  {otpStatus.email === 'verified' ? t('auth.email_verified') : t('auth.send_email_otp')}
                </button>
                {otpStatus.email === 'sent' && (
                  <>
                    <input
                      value={emailOtp}
                      onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      inputMode="numeric"
                      maxLength={6}
                      placeholder={t('auth.otp_placeholder')}
                      className="min-w-0 flex-1 p-3 border border-stone-300 bg-white focus:outline-none focus:border-[#BC5434] text-sm"
                    />
                    <button type="button" onClick={() => verifyOtp(email, emailOtp, 'email')} disabled={isLoading || emailOtp.length !== 6} className="p-3 bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50">{t('auth.verify')}</button>
                  </>
                )}
              </div>
              <div className="space-y-1 pt-2">
                <label className="block text-[10px] uppercase font-bold tracking-widest text-stone-700">{t('auth.mobile_label')}</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={otpStatus.phone === 'verified'}
                  className="w-full p-3 border border-stone-300 bg-white focus:outline-none focus:border-[#BC5434] text-sm"
                  placeholder="+919876543210"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => sendOtp(phone, 'phone')}
                  disabled={isLoading || otpStatus.phone === 'verified'}
                  className="shrink-0 p-3 border border-stone-300 rounded-sm hover:bg-stone-50 disabled:opacity-50 text-xs font-bold uppercase tracking-wider text-stone-600 cursor-pointer"
                >
                  {otpStatus.phone === 'verified' ? t('auth.phone_verified') : t('auth.send_sms_otp')}
                </button>
                {otpStatus.phone === 'sent' && (
                  <>
                    <input
                      value={phoneOtp}
                      onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      inputMode="numeric"
                      maxLength={6}
                      placeholder={t('auth.otp_placeholder')}
                      className="min-w-0 flex-1 p-3 border border-stone-300 bg-white focus:outline-none focus:border-[#BC5434] text-sm"
                    />
                    <button type="button" onClick={() => verifyOtp(phone, phoneOtp, 'phone')} disabled={isLoading || phoneOtp.length !== 6} className="p-3 bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50">{t('auth.verify')}</button>
                  </>
                )}
              </div>
              <button
                type="submit"
                disabled={isLoading || otpStatus.email !== 'verified' || otpStatus.phone !== 'verified'}
                className="w-full p-3 bg-[#1A1A1A] text-white rounded-sm font-bold uppercase tracking-widest text-xs hover:bg-black transition-colors flex items-center justify-center cursor-pointer"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : t('auth.continue')}
              </button>
            </form>
          </div>
        )}

        {step === 'ONBOARDING' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="font-editorial-serif text-4xl font-bold text-stone-900 tracking-tight mb-2">{t('auth.profile_title')}</h1>
              <p className="text-stone-500 text-sm font-serif italic">{t('auth.profile_desc')}</p>
            </div>
            <form onSubmit={handleOnboardingSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-stone-700">{t('auth.name_label')}</label>
                  <input name="fullName" required className="w-full p-3 border border-stone-300 bg-white focus:outline-none focus:border-[#BC5434] text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-stone-700">{t('auth.phone_label')}</label>
                  <input name="phone" value={phone} readOnly className="w-full p-3 border border-stone-300 bg-stone-50 text-stone-600 text-sm" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold tracking-widest text-stone-700">{t('auth.district_label')}</label>
                <input name="district" className="w-full p-3 border border-stone-300 bg-white focus:outline-none focus:border-[#BC5434] text-sm" placeholder={t('auth.district_placeholder')} />
              </div>

              {selectedRole === 'STUDENT' && (
                <div className="space-y-4 p-4 bg-[#FAF7F2] border border-stone-200 rounded-sm">
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-stone-700">{t('auth.univ_id_label')}</label>
                    <input name="universityId" required className="w-full p-3 border border-stone-300 bg-white focus:outline-none focus:border-[#BC5434] text-sm" placeholder={t('auth.univ_id_placeholder')} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase font-bold tracking-widest text-stone-700">{t('auth.student_id_label')}</label>
                      <input name="studentIdNumber" className="w-full p-3 border border-stone-300 bg-white focus:outline-none focus:border-[#BC5434] text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase font-bold tracking-widest text-stone-700">{t('auth.dept_label')}</label>
                      <input name="department" className="w-full p-3 border border-stone-300 bg-white focus:outline-none focus:border-[#BC5434] text-sm" />
                    </div>
                  </div>
                </div>
              )}

              {selectedRole === 'FACULTY' && (
                <div className="space-y-4 p-4 bg-[#FAF7F2] border border-stone-200 rounded-sm">
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-stone-700">{t('auth.univ_id_label')}</label>
                    <input name="universityId" required className="w-full p-3 border border-stone-300 bg-white focus:outline-none focus:border-[#BC5434] text-sm" placeholder={t('auth.univ_id_placeholder')} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase font-bold tracking-widest text-stone-700">{t('auth.employee_id_label')}</label>
                      <input name="employeeId" className="w-full p-3 border border-stone-300 bg-white focus:outline-none focus:border-[#BC5434] text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase font-bold tracking-widest text-stone-700">{t('auth.designation_label')}</label>
                      <input name="designation" className="w-full p-3 border border-stone-300 bg-white focus:outline-none focus:border-[#BC5434] text-sm" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-stone-700">{t('auth.dept_label')}</label>
                    <input name="department" className="w-full p-3 border border-stone-300 bg-white focus:outline-none focus:border-[#BC5434] text-sm" />
                  </div>
                </div>
              )}

              {selectedRole === 'INDUSTRY_REP' && (
                <div className="space-y-4 p-4 bg-[#FAF7F2] border border-stone-200 rounded-sm">
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-stone-700">{t('auth.org_name_label')}</label>
                    <input name="organizationName" required className="w-full p-3 border border-stone-300 bg-white focus:outline-none focus:border-[#BC5434] text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase font-bold tracking-widest text-stone-700">{t('auth.org_type_label')}</label>
                      <select name="orgType" className="w-full p-3 border border-stone-300 bg-white focus:outline-none focus:border-[#BC5434] text-sm">
                        <option value="CORPORATE">{t('auth.org_corporate')}</option>
                        <option value="STARTUP">{t('auth.org_startup')}</option>
                        <option value="MSME">{t('auth.org_msme')}</option>
                        <option value="CSR">{t('auth.org_csr')}</option>
                        <option value="RESEARCH_LAB">{t('auth.org_research')}</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase font-bold tracking-widest text-stone-700">{t('auth.reg_num_label')}</label>
                      <input name="registrationNumber" className="w-full p-3 border border-stone-300 bg-white focus:outline-none focus:border-[#BC5434] text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase font-bold tracking-widest text-stone-700">{t('auth.website_label')}</label>
                      <input name="website" className="w-full p-3 border border-stone-300 bg-white focus:outline-none focus:border-[#BC5434] text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase font-bold tracking-widest text-stone-700">{t('auth.designation_label')}</label>
                      <input name="industryDesignation" className="w-full p-3 border border-stone-300 bg-white focus:outline-none focus:border-[#BC5434] text-sm" />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full p-3 bg-[#BC5434] text-white rounded-sm font-bold uppercase tracking-widest text-xs hover:bg-[#A3452B] transition-colors flex items-center justify-center cursor-pointer shadow-sm"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : t('auth.profile_title')}
              </button>
            </form>
          </div>
        )}

        {step === 'COMPLETING' && (
          <div className="text-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-[#BC5434]" />
            <p className="text-stone-600 text-sm font-serif italic">{t('auth.saving_profile')}</p>
          </div>
        )}
      </div>
    </div>
  );
};
