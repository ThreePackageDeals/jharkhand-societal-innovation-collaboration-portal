import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import HomePage from './pages/HomePage';
import ChallengesPage from './pages/ChallengesPage';
import SubmitChallengePage from './pages/SubmitChallengePage';
import AITriagePage from './pages/AITriagePage';
import UniversityPage from './pages/UniversityPage';
import IndustryPage from './pages/IndustryPage';
import LifecyclePage from './pages/LifecyclePage';
import AnalyticsPage from './pages/AnalyticsPage';
import CommunicationPage from './pages/CommunicationPage';
import { AuthProvider } from './AuthContext';
import { AuthPage } from './pages/AuthPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminVerificationQueue } from './pages/AdminVerificationQueue';
import AccountPage from './pages/AccountPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Role } from './types';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route element={<Layout />}>
          <Route path="/" element={<><ScrollToTop /><HomePage /></>} />
          <Route path="/challenges" element={<><ScrollToTop /><ChallengesPage /></>} />
          <Route path="/submit-challenge" element={<ProtectedRoute allowedRoles={['CITIZEN']}><><ScrollToTop /><SubmitChallengePage /></></ProtectedRoute>} />
          <Route path="/ai-triage" element={<ProtectedRoute allowedRoles={['GOVERNMENT_ADMIN', 'SUPER_ADMIN']}><><ScrollToTop /><AITriagePage /></></ProtectedRoute>} />
          <Route path="/university" element={<ProtectedRoute allowedRoles={['STUDENT', 'FACULTY']}><><ScrollToTop /><UniversityPage /></></ProtectedRoute>} />
          <Route path="/industry" element={<ProtectedRoute allowedRoles={['INDUSTRY_REP']}><><ScrollToTop /><IndustryPage /></></ProtectedRoute>} />
          <Route path="/lifecycle" element={<ProtectedRoute><><ScrollToTop /><LifecyclePage /></></ProtectedRoute>} />
          <Route path="/analytics" element={<><ScrollToTop /><AnalyticsPage /></>} />
          <Route path="/communication" element={<><ScrollToTop /><CommunicationPage /></>} />
          <Route path="/account" element={<ProtectedRoute><><ScrollToTop /><AccountPage /></></ProtectedRoute>} />
          <Route path="/verification-queue" element={<ProtectedRoute allowedRoles={['UNIVERSITY_ADMIN', 'GOVERNMENT_ADMIN', 'GOVERNMENT_OFFICIAL', 'SUPER_ADMIN']}><><ScrollToTop /><AdminVerificationQueue /></></ProtectedRoute>} />
        </Route>
      </Routes>
      </ErrorBoundary>
    </AuthProvider>
  );
}
