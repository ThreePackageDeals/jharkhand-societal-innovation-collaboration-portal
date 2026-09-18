import React, { useState } from 'react';
import {
  Layers,
  CheckCircle2,
  Check,
  Clock,
  Award,
  FileCheck,
  TrendingUp,
  MapPin,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Building2,
  Users,
} from 'lucide-react';
import { SolutionProposal, ProblemStatement, InnovationStage } from '../types';
import { useLanguage } from '../LanguageContext';

interface ProjectLifecycleViewProps {
  proposals: SolutionProposal[];
  problems: ProblemStatement[];
  onSelectProblem: (problem: ProblemStatement) => void;
  onUpdateMilestone: (proposalId: string, milestoneId: string, status: string) => Promise<void>;
}

const STAGES: { stage: InnovationStage; labelKey: string; descKey: string }[] = [
  { stage: 'Ideation', labelKey: 'project_lifecycle.stage_1_label', descKey: 'project_lifecycle.stage_1_desc' },
  { stage: 'Lab Prototype', labelKey: 'project_lifecycle.stage_2_label', descKey: 'project_lifecycle.stage_2_desc' },
  { stage: 'Field Testing', labelKey: 'project_lifecycle.stage_3_label', descKey: 'project_lifecycle.stage_3_desc' },
  { stage: 'Community Pilot', labelKey: 'project_lifecycle.stage_4_label', descKey: 'project_lifecycle.stage_4_desc' },
  { stage: 'Deployment & Scale', labelKey: 'project_lifecycle.stage_5_label', descKey: 'project_lifecycle.stage_5_desc' },
];

export const ProjectLifecycleView: React.FC<ProjectLifecycleViewProps> = ({
  proposals,
  problems,
  onSelectProblem,
  onUpdateMilestone,
}) => {
  const { t } = useLanguage();
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('all');
  const [selectedProposalId, setSelectedProposalId] = useState<string>(proposals[0]?.id || '');

  const activeProposal = proposals.find((p) => p.id === selectedProposalId) || proposals[0];
  const linkedProblem = activeProposal ? problems.find((p) => p.id === activeProposal.problemId) : null;

  // Fallback for projects without milestones to ensure checkboxes always appear
  const milestonesToRender = activeProposal?.milestones && activeProposal.milestones.length > 0
    ? activeProposal.milestones
    : [
        { id: 'def-1', title: 'Ideation & Diagnostic', stage: 'Ideation', durationWeeks: 4, status: 'pending', deliverable: 'Baseline report' },
        { id: 'def-2', title: 'Lab Prototype', stage: 'Lab Prototype', durationWeeks: 4, status: 'pending', deliverable: 'Bench-scale validation' },
        { id: 'def-3', title: 'Field Testing', stage: 'Field Testing', durationWeeks: 6, status: 'pending', deliverable: 'On-site trial report' },
        { id: 'def-4', title: 'Community Pilot', stage: 'Community Pilot', durationWeeks: 3, status: 'pending', deliverable: 'Final handover SOP' },
      ];

  // Calculate overall project completion percentage
  const getProposalProgress = (prop: SolutionProposal) => {
    if (!prop.milestones || prop.milestones.length === 0) return 0;
    const completed = prop.milestones.filter((m) => m.status === 'completed').length;
    return Math.round((completed / prop.milestones.length) * 100);
  };

  return (
    <div id="project-lifecycle-module" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#1A1A1A] text-stone-100 p-8 border border-stone-800 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="editorial-meta">{t('project_lifecycle.header_meta_1')}</span>
              <span className="text-stone-600">•</span>
              <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">{t('project_lifecycle.header_meta_2')}</span>
            </div>
            <h2 className="font-editorial-serif italic text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {t('project_lifecycle.header_title')}
            </h2>
            <p className="text-xs text-stone-400 font-serif italic max-w-2xl mt-2 leading-relaxed">
              {t('project_lifecycle.header_desc')}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-[#FAF7F2] border border-stone-300 p-4 text-center min-w-[120px]">
              <div className="font-editorial-serif text-3xl font-light text-stone-900">19</div>
              <div className="text-[10px] text-stone-500 uppercase tracking-widest font-bold mt-1">{t('project_lifecycle.stat_patents')}</div>
            </div>
            <div className="bg-[#FAF7F2] border border-[#BC5434] p-4 text-center min-w-[120px]">
              <div className="font-editorial-serif text-3xl font-light text-[#BC5434]">11</div>
              <div className="text-[10px] text-stone-500 uppercase tracking-widest font-bold mt-1">{t('project_lifecycle.stat_startups')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stage Gates Flow Visualization */}
      <div className="bg-white border border-stone-300 p-5 shadow-sm overflow-x-auto">
        <div className="flex items-center min-w-[650px] justify-between gap-3">
          {STAGES.map((s, idx) => {
            const isSelected = selectedStageFilter === s.stage;
            return (
              <div
                key={s.stage}
                onClick={() => setSelectedStageFilter(isSelected ? 'all' : s.stage)}
                className={`flex-1 p-3 border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#1A1A1A] border-stone-900 text-white shadow-sm'
                    : 'bg-[#FAF7F2] border-stone-300 text-stone-700 hover:border-stone-500'
                }`}
              >
                <div className={`font-bold text-[10px] uppercase tracking-wider mb-1 ${isSelected ? 'text-white' : 'text-stone-900'}`}>{t(s.labelKey)}</div>
                <div className={`text-xs font-serif italic line-clamp-1 ${isSelected ? 'text-stone-400' : 'text-stone-500'}`}>{t(s.descKey)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Dual-Pane View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: List of Active Innovation Projects */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-stone-900 px-1 border-b border-stone-200 pb-2">
            <span>{t('project_lifecycle.active_projects')} ({proposals.length})</span>
            {selectedStageFilter !== 'all' && (
              <button
                onClick={() => setSelectedStageFilter('all')}
                className="text-stone-500 hover:text-stone-900 cursor-pointer text-[10px]"
              >
                {t('project_lifecycle.clear_filter')}
              </button>
            )}
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {proposals.map((prop) => {
              const isSelected = prop.id === activeProposal?.id;
              const progress = getProposalProgress(prop);

              return (
                <div
                  key={prop.id}
                  onClick={() => setSelectedProposalId(prop.id)}
                  className={`p-4 border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-white border-stone-900 shadow-sm'
                      : 'bg-white border-stone-200 hover:border-stone-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold uppercase tracking-wider text-stone-900 text-[10px] bg-[#FAF7F2] border border-stone-300 px-1.5 py-0.5">{prop.heiName}</span>
                    <span className="font-bold text-[#BC5434] text-[10px] uppercase tracking-wider">{progress}%</span>
                  </div>

                  <h4 className="font-editorial-serif text-lg font-bold text-stone-900 line-clamp-1 mb-1">{prop.projectTitle}</h4>
                  <div className="text-stone-500 font-serif italic text-xs line-clamp-1 mb-3">{t('project_lifecycle.for_label')} <span className="font-sans not-italic text-[10px] uppercase font-bold tracking-wider text-stone-600">{prop.problemTitle}</span></div>

                  {/* Progress Bar */}
                  <div className="w-full bg-[#FAF7F2] border border-stone-200 h-2 mb-3">
                    <div
                      className="bg-[#1A1A1A] h-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-stone-500 pt-3 border-t border-stone-200">
                    <span>{t('project_lifecycle.ip_label')} {prop.ipPotential}</span>
                    <span className={prop.industryPartnerName ? 'text-[#BC5434]' : 'text-stone-400'}>
                      {prop.industryPartnerName ? t('project_lifecycle.csr_backed') : t('project_lifecycle.csr_seeking')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Lifecycle Dossier */}
        {activeProposal ? (
          <div className="lg:col-span-2 bg-white border border-stone-300 p-8 shadow-sm space-y-8">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-stone-200">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#FAF7F2] text-stone-900 border border-stone-300">
                    {t('project_lifecycle.progression_label')} {getProposalProgress(activeProposal)}%
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                    {t('project_lifecycle.nep_credits_label')} {activeProposal.nepExperientialCredits}
                  </span>
                </div>
                <h3 className="font-editorial-serif text-3xl font-bold text-stone-900 leading-snug">{activeProposal.projectTitle}</h3>
                <div className="text-xs text-stone-600 font-serif italic mt-2">
                  Institution: <strong className="font-bold text-stone-900 not-italic uppercase tracking-wider text-[10px] mx-1">{activeProposal.heiName}</strong> • Lead: {activeProposal.facultyMentor.name}
                </div>
              </div>

              {linkedProblem && (
                <button
                  onClick={() => onSelectProblem(linkedProblem)}
                  className="inline-flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest px-4 py-2.5 border border-stone-300 text-stone-900 hover:bg-[#FAF7F2] cursor-pointer whitespace-nowrap transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{t('project_lifecycle.view_problem')}</span>
                </button>
              )}
            </div>

            {/* Milestones Checklist & Evidence */}
            <div>
              <h4 className="text-[11px] font-bold text-stone-900 uppercase tracking-widest mb-4 flex items-center justify-between border-b border-stone-200 pb-2">
                <span>{t('project_lifecycle.milestones_title')}</span>
                <span className="text-stone-400 font-serif italic normal-case text-xs tracking-normal">{t('project_lifecycle.milestones_hint')}</span>
              </h4>

              <div className="space-y-3">
                {milestonesToRender.map((m, idx) => {
                  const isDone = m.status === 'completed';
                  return (
                    <div
                      key={m.id}
                      className={`p-4 border text-xs transition-all ${
                        isDone ? 'bg-[#FAF7F2] border-stone-300' : 'bg-white border-stone-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <button
                            type="button"
                            onClick={() => {
                              const nextStatus = isDone ? 'in_progress' : 'completed';
                              onUpdateMilestone(activeProposal.id, m.id, nextStatus);
                            }}
                            style={{ border: '2px solid #1a1a1a' }}
                            className={`mt-0.5 w-5 h-5 flex-shrink-0 flex items-center justify-center cursor-pointer transition-all ${
                              isDone
                                ? 'bg-[#1A1A1A] text-white'
                                : 'bg-white text-transparent hover:bg-stone-100'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <div>
                            <div className="flex items-center gap-3">
                              <span className={`font-bold text-sm ${isDone ? 'text-stone-500 line-through' : 'text-stone-900'}`}>{m.title}</span>
                              <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 border border-stone-200 text-stone-500 font-bold bg-white">
                                {m.stage}
                              </span>
                            </div>
                            <div className="text-xs font-serif italic text-stone-500 mt-1">
                              {t('project_lifecycle.deliverable_label')} <strong className="font-sans not-italic text-stone-700">{m.deliverable}</strong> • {m.durationWeeks}{t('project_lifecycle.weeks_suffix')}
                            </div>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 whitespace-nowrap border ${
                            isDone ? 'bg-white text-stone-900 border-stone-900' : 'bg-[#FAF7F2] text-stone-400 border-transparent'
                          }`}
                        >
                          {isDone ? t('project_lifecycle.status_verified') : t('project_lifecycle.status_pending')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Intellectual Property, Patent & Handover Section */}
            <div className="p-6 bg-[#FAF7F2] border border-stone-300 space-y-4 text-xs">
              <div className="font-bold text-[10px] uppercase tracking-widest text-stone-900 flex items-center gap-2 pb-2 border-b border-stone-200">
                <Award className="w-4 h-4" />
                <span>{t('project_lifecycle.ip_handover_title')}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-white p-4 border border-stone-200">
                  <span className="text-stone-400 font-bold uppercase tracking-wider text-[10px] block mb-1">{t('project_lifecycle.ip_strategy')}</span>
                  <strong className="text-stone-900 font-bold text-sm">{activeProposal.ipPotential}</strong>
                </div>
                <div className="bg-white p-4 border border-stone-200">
                  <span className="text-stone-400 font-bold uppercase tracking-wider text-[10px] block mb-1">{t('project_lifecycle.csr_cofunder')}</span>
                  <strong className="text-[#BC5434] font-bold text-sm">{activeProposal.industryPartnerName || t('project_lifecycle.csr_seeking')}</strong>
                </div>
                <div className="bg-white p-4 border border-stone-200">
                  <span className="text-stone-400 font-bold uppercase tracking-wider text-[10px] block mb-1">{t('project_lifecycle.local_handover')}</span>
                  <strong className="text-stone-900 font-bold text-sm">{t('project_lifecycle.pri_sop')}</strong>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 bg-white border border-stone-300 p-12 text-center text-stone-500 font-serif italic text-sm">
            {t('project_lifecycle.no_proposal')}
          </div>
        )}
      </div>
    </div>
  );
};
