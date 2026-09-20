import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { useAuth } from '../AuthContext';
import { useAppContext } from '../AppContext';
import { UniversityModule } from '../components/UniversityModule';
import { StudentUniversityView } from '../components/StudentUniversityView';

export default function UniversityPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const {
    universities,
    problems,
    proposals,
    setSelectedProblem,
    handleSubmitProposal,
    handleUpdateMilestone,
  } = useAppContext();

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

      {user?.role === 'STUDENT' ? (
        <StudentUniversityView
          universities={universities}
          problems={problems}
          proposals={proposals}
          onSelectProblem={(p) => setSelectedProblem(p)}
        />
      ) : (
        <UniversityModule
          universities={universities}
          problems={problems}
          proposals={proposals}
          onSelectProblem={(p) => setSelectedProblem(p)}
          onSubmitProposal={handleSubmitProposal}
          onUpdateMilestone={handleUpdateMilestone}
        />
      )}
    </div>
  );
}
