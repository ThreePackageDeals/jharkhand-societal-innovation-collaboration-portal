import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Role } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
  requireVerified?: boolean;
}

export const ProtectedRoute = ({ children, allowedRoles, requireVerified }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center text-stone-600">
        <div className="w-8 h-8 border-2 border-stone-200 border-t-[#BC5434] rounded-full animate-spin mb-4"></div>
        <p className="text-xs uppercase tracking-widest font-bold">Loading Session</p>
      </div>
    );
  }

  // If no user is loaded and no token exists in storage, redirect to auth
  if (!user && !localStorage.getItem('auth_token')) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If no user is loaded but a token exists, we are in a transitional state
  // (e.g., just after login) or the token is invalid.
  // We show the loading state instead of immediately redirecting to avoid loops.
  if (!user) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center text-stone-600">
        <div className="w-8 h-8 border-2 border-stone-200 border-t-[#BC5434] rounded-full animate-spin mb-4"></div>
        <p className="text-xs uppercase tracking-widest font-bold">Verifying Session</p>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center p-4 text-center">
        <h2 className="font-editorial-serif text-3xl font-bold text-stone-900 mb-2">Access Restricted</h2>
        <p className="text-stone-500 font-serif italic mb-6">You do not have the required permissions to view this resource.</p>
        <button
          onClick={() => window.history.back()}
          className="bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-widest px-6 py-3 hover:bg-black transition-colors cursor-pointer"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (requireVerified && user.verificationStatus === 'PENDING') {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 bg-[#FAF7F2] border border-stone-300 rounded-full flex items-center justify-center mb-6">
          <div className="w-8 h-8 border-2 border-stone-200 border-t-[#BC5434] rounded-full animate-spin"></div>
        </div>
        <h2 className="font-editorial-serif text-3xl font-bold text-stone-900 mb-2">Verification Pending</h2>
        <p className="text-stone-500 font-serif italic mb-8 max-w-md">
          Your profile is currently under review by the state administration.
          You will gain full access once your credentials are verified.
        </p>
        <div className="text-[10px] uppercase font-bold tracking-widest text-stone-400">
          Status: Under Review
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
