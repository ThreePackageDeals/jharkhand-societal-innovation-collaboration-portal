import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Role, VerificationStatus } from './types';

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  verificationStatus: VerificationStatus;
  district?: string;
  studentProfile?: any;
  facultyProfile?: any;
  industryProfile?: any;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  bypassLogin: () => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  completeProfile: (data: any) => Promise<{ success: boolean; verificationStatus: VerificationStatus }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.data);
      } else {
        localStorage.removeItem('auth_token');
        setUser(null);
      }
    } catch (err) {
      console.error('Error refreshing user:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Dev-mode session handling: a full page reload starts a *fresh* session.
  // Clear any persisted token on boot so the auth page shows again on every
  // refresh instead of silently re-authenticating from localStorage. Login /
  // Dev Bypass still work within the current page session.
  useEffect(() => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setIsLoading(false);
  }, []);

  const login = async (token: string) => {
    localStorage.setItem('auth_token', token);
    await refreshUser();
  };

  const bypassLogin = useCallback(() => {
    const mockUser: UserProfile = {
      id: 'dev-bypass-id',
      email: 'dev@bypass.com',
      fullName: 'Dev Bypass User',
      role: 'SUPER_ADMIN',
      verificationStatus: 'VERIFIED',
    };
    localStorage.setItem('auth_token', 'dev-bypass-token');
    setUser(mockUser);
    setIsLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  const completeProfile = async (data: any) => {
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Failed to complete profile');
      }
      const result = await res.json();
      await refreshUser();
      return {
        success: true,
        verificationStatus: result.data.verificationStatus
      };
    } catch (err: any) {
      console.error('Profile completion error:', err);
      throw err;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    bypassLogin,
    logout,
    refreshUser,
    completeProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
