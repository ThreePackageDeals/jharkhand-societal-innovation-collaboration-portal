import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { useAppContext } from '../AppContext';
import { CitizenSubmissionView } from '../components/CitizenSubmissionView';

export default function SubmitChallengePage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { setProblems, setAnalytics } = useAppContext();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-start mb-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#BC5434] hover:text-[#A3452B] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3 h-3" />
          <span>{t('back_to_home')}</span>
        </button>
      </div>

      <CitizenSubmissionView
        onNavigate={() => navigate('/challenges')}
        onSuccess={(newProblem) => {
          const normalizedProblem = {
            ...newProblem,
            mediaUrls: newProblem.mediaAttachments && newProblem.mediaAttachments.length > 0
              ? newProblem.mediaAttachments.map((a: any) => a.url)
              : newProblem.mediaUrls || [],
          };
          setProblems((prev) => [normalizedProblem, ...prev]);
          fetch('/api/analytics')
            .then((r) => r.json())
            .then((d) => setAnalytics(d))
            .catch(() => {});
        }}
      />
    </div>
  );
}
