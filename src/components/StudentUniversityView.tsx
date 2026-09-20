import React, { useState } from 'react';
import { GraduationCap, BookOpen, CheckCircle2, Clock, Layers } from 'lucide-react';
import { ProblemStatement, University, SolutionProposal } from '../types';
import { useLanguage } from '../LanguageContext';
import { useAuth } from '../AuthContext';

interface StudentUniversityViewProps {
  universities: University[];
  problems: ProblemStatement[];
  proposals: SolutionProposal[];
  onSelectProblem: (problem: ProblemStatement) => void;
}

export const StudentUniversityView: React.FC<StudentUniversityViewProps> = ({
  universities,
  problems,
  proposals,
  onSelectProblem,
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'assigned' | 'my-projects'>('assigned');

  // Get the student's university from their profile
  const studentUniversityId = user?.studentProfile?.universityId;
  const currentUniversity = universities.find(u => u.id === studentUniversityId);

  if (!currentUniversity) {
    return (
      <div className="flex items-center justify-center py-20 text-stone-500 font-serif italic">
        {t('univ.no_university_assigned')}
      </div>
    );
  }

  // Filter problems assigned to student's university
  const assignedProblems = problems.filter(p => p.assignedHeiId === currentUniversity.id);

  // Filter proposals from student's university
  const universityProposals = proposals.filter(p => p.heiId === currentUniversity.id);

  return (
    <div className="space-y-6">
      {/* University Header */}
      <div className="bg-[#FAF7F2] border border-stone-300 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#1A1A1A] border border-stone-800 text-white flex items-center justify-center font-bold">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="editorial-meta">{t('univ_student_portal')}</span>
              <span className="text-stone-600">•</span>
              <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest">
                {currentUniversity.type}
              </span>
            </div>
            <h2 className="font-editorial-serif italic text-2xl font-bold text-stone-900 leading-none">
              {currentUniversity.name}
            </h2>
            <p className="text-xs text-stone-600 font-serif italic mt-1.5">
              {currentUniversity.district} {t('univ.district_label')} • {user?.studentProfile?.department || t('univ.department_label')}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase font-bold tracking-wider text-stone-500">
            {t('univ.student_id_label')}
          </div>
          <div className="text-sm font-bold text-stone-900 mt-1">
            {user?.studentProfile?.studentIdNumber || 'N/A'}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-300 space-x-6 text-[11px] font-bold uppercase tracking-widest text-stone-500">
        <button
          onClick={() => setActiveTab('assigned')}
          className={`pb-3 flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'assigned'
              ? 'border-b-2 border-[#BC5434] text-stone-900'
              : 'hover:text-stone-900 border-b-2 border-transparent'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>{t('univ.assigned_work')}</span>
          <span className="px-1.5 py-0.5 bg-[#FAF7F2] text-stone-900 text-[10px] border border-stone-300">
            {assignedProblems.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('my-projects')}
          className={`pb-3 flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'my-projects'
              ? 'border-b-2 border-[#BC5434] text-stone-900'
              : 'hover:text-stone-900 border-b-2 border-transparent'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{t('univ.my_projects')}</span>
          <span className="px-1.5 py-0.5 bg-[#FAF7F2] text-stone-900 text-[10px] border border-stone-300">
            {universityProposals.length}
          </span>
        </button>
      </div>

      {/* Assigned Work Tab */}
      {activeTab === 'assigned' && (
        <div className="space-y-4">
          <div className="bg-[#FAF7F2] border border-[#BC5434] p-4 text-xs text-stone-900">
            <strong className="text-[#BC5434] uppercase tracking-wider font-bold text-[10px] mr-2">
              {t('univ.student_info')}
            </strong>
            <span className="font-serif italic">
              {t('univ.student_info_desc')}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {assignedProblems.map((problem) => (
              <div
                key={problem.id}
                className="bg-white border border-stone-300 p-5 hover:border-stone-500 transition-all cursor-pointer"
                onClick={() => onSelectProblem(problem)}
              >
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-[#1A1A1A] text-white">
                    {problem.trackingCode}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#FAF7F2] text-stone-900 border border-stone-300">
                    {problem.district} • {problem.blockOrPanchayat}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-stone-200 text-stone-800">
                    {problem.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <h3 className="font-editorial-serif text-xl font-bold text-stone-900 hover:text-[#BC5434] leading-snug mt-1">
                  {problem.title}
                </h3>

                <p className="text-xs text-stone-600 line-clamp-2 mt-2">{problem.description}</p>

                <div className="p-3 bg-[#FAF7F2] border border-stone-200 text-xs flex flex-wrap items-center justify-between gap-3 mt-3">
                  <span className="text-stone-600 font-serif italic">
                    <strong className="text-stone-900 not-italic uppercase tracking-wider text-[10px]">
                      {t('univ.domain_label')}
                    </strong>{' '}
                    {problem.aiAnalysis?.subCategory || problem.domain}
                  </span>
                  <span className="text-stone-600 font-serif italic">
                    <strong className="text-stone-900 not-italic uppercase tracking-wider text-[10px]">
                      {t('univ.beneficiaries')}
                    </strong>{' '}
                    {(problem.affectedPopulation || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}

            {assignedProblems.length === 0 && (
              <div className="bg-white border border-stone-300 p-8 text-center text-stone-500 font-serif italic text-sm">
                {t('univ.no_assigned_work')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* My Projects Tab */}
      {activeTab === 'my-projects' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {universityProposals.map((proposal) => (
              <div key={proposal.id} className="bg-white border border-stone-300 p-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-editorial-serif italic text-2xl font-bold text-stone-900">
                      {proposal.projectTitle}
                    </h3>
                    <div className="text-xs text-stone-600 font-serif italic mt-1">
                      {t('univ.problem_label')}{' '}
                      <strong className="text-stone-900 not-italic uppercase tracking-wider text-[10px]">
                        {proposal.problemTitle}
                      </strong>
                    </div>
                  </div>

                  <div className="text-left md:text-right">
                    <span className="inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 bg-[#1A1A1A] text-white">
                      {proposal.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed bg-[#FAF7F2] p-4 border border-stone-200 font-serif italic">
                  {proposal.abstract}
                </p>

                {/* Milestones Progress */}
                <div className="pt-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-stone-900 mb-3 flex items-center justify-between border-b border-stone-200 pb-2">
                    <span>{t('univ.project_milestones')}</span>
                    <span className="text-stone-500">
                      {proposal.milestones.filter(m => m.status === 'completed').length}/{proposal.milestones.length}{' '}
                      {t('univ_milestone_completed')}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {proposal.milestones.map((milestone) => (
                      <div
                        key={milestone.id}
                        className={`p-3 border text-xs ${
                          milestone.status === 'completed'
                            ? 'bg-stone-100 border-stone-300 text-stone-900'
                            : milestone.status === 'in_progress'
                            ? 'bg-white border-[#BC5434] text-stone-900'
                            : 'bg-[#FAF7F2] border-stone-200 text-stone-500'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] uppercase font-bold tracking-widest">{milestone.stage}</span>
                          {milestone.status === 'completed' ? (
                            <CheckCircle2 className="w-4 h-4 text-stone-900" />
                          ) : milestone.status === 'in_progress' ? (
                            <Clock className="w-4 h-4 text-[#BC5434]" />
                          ) : (
                            <Clock className="w-4 h-4 text-stone-400" />
                          )}
                        </div>
                        <div className="font-editorial-serif font-bold text-sm leading-tight mb-1">
                          {milestone.title}
                        </div>
                        <div className="text-[10px] font-serif italic mt-2 text-stone-600">
                          {milestone.durationWeeks} {t('univ.weeks_label')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {universityProposals.length === 0 && (
              <div className="bg-white border border-stone-300 p-8 text-center text-stone-500 font-serif italic text-sm">
                {t('univ.no_projects_yet')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
