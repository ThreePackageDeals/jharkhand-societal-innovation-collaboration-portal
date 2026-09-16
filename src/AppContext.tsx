import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import {
  ProblemStatement,
  AnalyticsSummary,
  University,
  IndustryPartner,
  SolutionProposal,
  SystemNotification
} from './types';

interface AppContextType {
  // Core data
  problems: ProblemStatement[];
  setProblems: React.Dispatch<React.SetStateAction<ProblemStatement[]>>;
  analytics: AnalyticsSummary;
  setAnalytics: React.Dispatch<React.SetStateAction<AnalyticsSummary>>;
  universities: University[];
  industryPartners: IndustryPartner[];
  setIndustryPartners: React.Dispatch<React.SetStateAction<IndustryPartner[]>>;
  proposals: SolutionProposal[];
  setProposals: React.Dispatch<React.SetStateAction<SolutionProposal[]>>;
  notifications: SystemNotification[];

  // User & UI state
  selectedProblem: ProblemStatement | null;
  setSelectedProblem: React.Dispatch<React.SetStateAction<ProblemStatement | null>>;
  trackingFilterCode: string;
  setTrackingFilterCode: React.Dispatch<React.SetStateAction<string>>;
  mapFilter: { type: 'district' | 'university' | 'industry'; value: string } | null;
  setMapFilter: React.Dispatch<React.SetStateAction<{ type: 'district' | 'university' | 'industry'; value: string } | null>>;
  isLoading: boolean;
  isNotificationOpen: boolean;
  setIsNotificationOpen: React.Dispatch<React.SetStateAction<boolean>>;
  unreadNotificationsCount: number;

  // Handlers
  loadAllData: () => Promise<void>;
  handleUpvote: (problemId: string) => Promise<void>;
  handleAssignHEI: (problemId: string, heiId: string, department: string) => Promise<void>;
  handleSubmitProposal: (newProposalData: any) => Promise<void>;
  handlePledgeFunding: (proposalId: string, partnerId: string, amount: number, mentorName?: string, pilotSite?: string) => Promise<void>;
  handleUpdateMilestone: (proposalId: string, milestoneId: string, status: string) => Promise<void>;
  handleMarkNotificationRead: (id: string) => void;
  handleMarkAllNotificationsRead: () => void;
  handleSearchTrackingCode: (code: string) => void;

  // Computed
  activeProposalForSelectedProblem: SolutionProposal | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const fetchWithTimeout = (url: string, timeoutMs = 8000) => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, { signal: controller.signal }).finally(() => {
    window.clearTimeout(timeout);
  });
};

export function AppProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  // Core Datasets
  const [problems, setProblems] = useState<ProblemStatement[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary>({} as AnalyticsSummary);
  const [universities, setUniversities] = useState<University[]>([]);
  const [industryPartners, setIndustryPartners] = useState<IndustryPartner[]>([]);
  const [proposals, setProposals] = useState<SolutionProposal[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);

  // User & UI state
  const [selectedProblem, setSelectedProblem] = useState<ProblemStatement | null>(null);
  const [trackingFilterCode, setTrackingFilterCode] = useState<string>('');
  const [mapFilter, setMapFilter] = useState<{ type: 'district' | 'university' | 'industry'; value: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Initial Data Fetching from server APIs
  const loadAllData = useCallback(async () => {
    try {
      const results = await Promise.allSettled([
        fetchWithTimeout('/api/problems'),
        fetchWithTimeout('/api/analytics'),
        fetchWithTimeout('/api/universities'),
        fetchWithTimeout('/api/industry/partners'),
        fetchWithTimeout('/api/proposals'),
        fetchWithTimeout('/api/notifications'),
      ]);
      const [probResult, anaResult, uniResult, indResult, propResult, notifResult] = results;

      if (probResult.status === 'fulfilled' && probResult.value.ok) {
        const probData = await probResult.value.json();
        const problemsData = Array.isArray(probData.data) ? probData.data : (Array.isArray(probData) ? probData : []);
        const normalizedProblems = problemsData.map((p: any) => ({
          ...p,
          mediaUrls: p.mediaAttachments && p.mediaAttachments.length > 0
            ? p.mediaAttachments.map((a: any) => a.url)
            : p.mediaUrls || [],
        }));
        setProblems(normalizedProblems);
      }
      if (anaResult.status === 'fulfilled' && anaResult.value.ok) {
        const anaData = await anaResult.value.json();
        setAnalytics(anaData.data || anaData || {});
      }
      if (uniResult.status === 'fulfilled' && uniResult.value.ok) {
        const uniData = await uniResult.value.json();
        setUniversities(Array.isArray(uniData.data) ? uniData.data : (Array.isArray(uniData) ? uniData : []));
      }
      if (indResult.status === 'fulfilled' && indResult.value.ok) {
        const indData = await indResult.value.json();
        setIndustryPartners(Array.isArray(indData.data) ? indData.data : (Array.isArray(indData) ? indData : []));
      }
      if (propResult.status === 'fulfilled' && propResult.value.ok) {
        const propData = await propResult.value.json();
        setProposals(Array.isArray(propData.data) ? propData.data : (Array.isArray(propData) ? propData : []));
      }
      if (notifResult.status === 'fulfilled' && notifResult.value.ok) {
        const notifData = await notifResult.value.json();
        setNotifications(Array.isArray(notifData.data) ? notifData.data : (Array.isArray(notifData) ? notifData : []));
      }
    } catch (err) {
      console.error('Fatal API fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Handlers
  const handleUpvote = useCallback(async (problemId: string) => {
    try {
      const res = await fetch(`/api/problems/${problemId}/upvote`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setProblems((prev) =>
          prev.map((p) => (p.id === problemId ? { ...p, upvotesCount: data.upvotesCount } : p))
        );
        setSelectedProblem((prev) =>
          prev?.id === problemId ? { ...prev, upvotesCount: data.upvotesCount } : prev
        );
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const handleAssignHEI = useCallback(async (problemId: string, heiId: string, department: string) => {
    try {
      const res = await fetch(`/api/problems/${problemId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ heiId, department }),
      });
      if (res.ok) {
        const updated = await res.json();
        const normalizedUpdated = {
          ...updated,
          mediaUrls: updated.mediaAttachments && updated.mediaAttachments.length > 0
            ? updated.mediaAttachments.map((a: any) => a.url)
            : updated.mediaUrls || [],
        };
        setProblems((prev) => prev.map((p) => (p.id === problemId ? normalizedUpdated : p)));
        const anaRes = await fetch('/api/analytics');
        if (anaRes.ok) setAnalytics(await anaRes.json());
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  }, []);

  const handleSubmitProposal = useCallback(async (newProposalData: any) => {
    try {
      const res = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProposalData),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || errorData.message || `Failed to submit proposal: ${res.statusText}`;
        throw new Error(errorMessage);
      }
      const saved = await res.json();
      setProposals((prev) => [saved, ...prev]);
      setProblems((prev) =>
        prev.map((p) => (p.id === newProposalData.problemId ? { ...p, status: 'proposal_submitted' } : p))
      );
    } catch (err) {
      console.error(err);
      throw err;
    }
  }, []);

  const handlePledgeFunding = useCallback(async (
    proposalId: string,
    partnerId: string,
    amount: number,
    mentorName?: string,
    pilotSite?: string
  ) => {
    try {
      const res = await fetch('/api/industry/pledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId, partnerId, amount, mentorName, pilotSite }),
      });
      if (res.ok) {
        const updatedProposal = await res.json();
        setProposals((prev) => prev.map((p) => (p.id === proposalId ? updatedProposal : p)));
        const indRes = await fetch('/api/industry/partners');
        if (indRes.ok) setIndustryPartners(await indRes.json());
        const anaRes = await fetch('/api/analytics');
        if (anaRes.ok) setAnalytics(await anaRes.json());
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  }, []);

  const handleUpdateMilestone = useCallback(async (proposalId: string, milestoneId: string, status: string) => {
    try {
      const res = await fetch(`/api/proposals/${proposalId}/milestone`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestoneId,
          status,
          completedDate: status === 'completed' ? new Date().toISOString() : undefined,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setProposals((prev) => prev.map((p) => (p.id === proposalId ? updated : p)));
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const handleMarkNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const handleMarkAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  const handleSearchTrackingCode = useCallback((code: string) => {
    const found = problems.find((p) => p.trackingCode.toLowerCase() === code.toLowerCase());
    if (found) {
      setSelectedProblem(found);
    } else {
      setTrackingFilterCode(code);
      navigate('/challenges');
    }
  }, [problems, navigate]);

  const activeProposalForSelectedProblem = selectedProblem
    ? proposals.find((p) => p.problemId === selectedProblem.id)
    : undefined;

  const value: AppContextType = {
    problems,
    setProblems,
    analytics,
    setAnalytics,
    universities,
    industryPartners,
    setIndustryPartners,
    proposals,
    setProposals,
    notifications,
    selectedProblem,
    setSelectedProblem,
    trackingFilterCode,
    setTrackingFilterCode,
    mapFilter,
    setMapFilter,
    isLoading,
    isNotificationOpen,
    setIsNotificationOpen,
    unreadNotificationsCount,
    loadAllData,
    handleUpvote,
    handleAssignHEI,
    handleSubmitProposal,
    handlePledgeFunding,
    handleUpdateMilestone,
    handleMarkNotificationRead,
    handleMarkAllNotificationsRead,
    handleSearchTrackingCode,
    activeProposalForSelectedProblem,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
