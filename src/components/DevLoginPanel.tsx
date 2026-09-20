import React, { useState } from 'react';
import { X, TestTube, UserRound, GraduationCap, Building2, ShieldCheck, Landmark } from 'lucide-react';
import { Role } from '../types';

interface DevLoginPanelProps {
  onDevLogin: (role: Role, verified: boolean) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const DevLoginPanel: React.FC<DevLoginPanelProps> = ({ onDevLogin, isOpen, onClose }) => {
  const [selectedRole, setSelectedRole] = useState<Role>('CITIZEN');
  const [verified, setVerified] = useState(true);

  if (!isOpen) return null;

  const roles: Array<{ value: Role; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { value: 'CITIZEN', label: 'Citizen', icon: UserRound },
    { value: 'STUDENT', label: 'Student', icon: GraduationCap },
    { value: 'FACULTY', label: 'Faculty', icon: ShieldCheck },
    { value: 'INDUSTRY_REP', label: 'Industry Rep', icon: Building2 },
    { value: 'UNIVERSITY_ADMIN', label: 'University Admin', icon: GraduationCap },
    { value: 'GOVERNMENT_ADMIN', label: 'Government Admin', icon: Landmark },
    { value: 'GOVERNMENT_OFFICIAL', label: 'Government Official', icon: Landmark },
    { value: 'SUPER_ADMIN', label: 'Super Admin (Dev)', icon: TestTube },
  ];

  const handleLogin = () => {
    onDevLogin(selectedRole, verified);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white border-2 border-[#BC5434] rounded-sm shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TestTube className="w-5 h-5 text-[#BC5434]" />
            <h2 className="font-editorial-serif text-2xl font-bold text-stone-900">Dev Login</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        <div className="bg-[#FAF7F2] border border-stone-300 p-3 mb-4 text-xs text-stone-700 font-serif italic">
          <strong className="text-[#BC5434] not-italic">Development Only:</strong> Quick login for testing. Not available in production.
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-700 mb-2">
              Select Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              {roles.map((role) => {
                const Icon = role.icon;
                return (
                  <button
                    key={role.value}
                    onClick={() => setSelectedRole(role.value)}
                    className={`p-3 border-2 text-left flex items-center gap-2 cursor-pointer transition-all ${
                      selectedRole === role.value
                        ? 'border-[#BC5434] bg-[#FAF7F2]'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-stone-600" />
                    <span className="text-xs font-bold text-stone-900">{role.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-700 mb-2">
              Verification Status
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setVerified(true)}
                className={`flex-1 p-2 border-2 text-xs font-bold cursor-pointer transition-all ${
                  verified
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-stone-200 text-stone-600'
                }`}
              >
                VERIFIED
              </button>
              <button
                onClick={() => setVerified(false)}
                className={`flex-1 p-2 border-2 text-xs font-bold cursor-pointer transition-all ${
                  !verified
                    ? 'border-amber-500 bg-amber-50 text-amber-700'
                    : 'border-stone-200 text-stone-600'
                }`}
              >
                PENDING
              </button>
            </div>
          </div>

          <button
            onClick={handleLogin}
            className="w-full p-3 bg-[#BC5434] text-white font-bold uppercase tracking-widest text-xs hover:bg-[#A3452B] transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <TestTube className="w-4 h-4" />
            <span>Login as {roles.find(r => r.value === selectedRole)?.label}</span>
          </button>
        </div>

        <div className="mt-4 text-[10px] text-stone-500 text-center font-mono">
          NODE_ENV: {process.env.NODE_ENV || 'development'}
        </div>
      </div>
    </div>
  );
};
