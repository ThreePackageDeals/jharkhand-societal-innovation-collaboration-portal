import React, { useState } from 'react';
import {
  GraduationCap,
  Sparkles,
  Users,
  Plus,
  Trash2,
  FileText,
  Send,
  Loader2,
  CheckCircle2,
  Clock,
  Layers,
  Award,
  ChevronRight,
  IndianRupee,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { ProblemStatement, University, SolutionProposal, ProjectMilestone } from '../types';
import { useLanguage } from '../LanguageContext';

interface UniversityModuleProps {
  universities: University[];
  problems: ProblemStatement[];
  proposals: SolutionProposal[];
  onSelectProblem: (problem: ProblemStatement) => void;
  onSubmitProposal: (newProposal: any) => Promise<void>;
  onUpdateMilestone: (proposalId: string, milestoneId: string, status: string) => Promise<void>;
}

export const UniversityModule: React.FC<UniversityModuleProps> = ({
  universities,
  problems,
  proposals,
  onSelectProblem,
  onSubmitProposal,
  onUpdateMilestone,
}) => {
  const { t } = useLanguage();
  const [selectedHeiId, setSelectedHeiId] = useState<string>(universities[0]?.id || 'hei-bit-mesra');
  const [activeSubTab, setActiveSubTab] = useState<'assigned' | 'proposals' | 'team-builder'>('assigned');
  const [targetProblemForProposal, setTargetProblemForProposal] = useState<ProblemStatement | null>(null);

  // Proposal Form State
  const [isGeneratingAiProposal, setIsGeneratingAiProposal] = useState(false);
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);
  const [customAiInstructions, setCustomAiInstructions] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [technologyMethodology, setTechnologyMethodology] = useState('');
  const [leadFacultyName, setLeadFacultyName] = useState('');
  const [leadFacultyDept, setLeadFacultyDept] = useState('');
  const [studentLeadName, setStudentLeadName] = useState('');
  const [studentLeadEmail, setStudentLeadEmail] = useState('');
  const [studentDepts, setStudentDepts] = useState<string[]>(['Civil & Water Resources', 'IoT Engineering']);
  const [nepCredits, setNepCredits] = useState<number>(6);
  const [hardwareBudget, setHardwareBudget] = useState<number>(150000);
  const [prototypingBudget, setPrototypingBudget] = useState<number>(100000);
  const [fieldTestingBudget, setFieldTestingBudget] = useState<number>(70000);
  const [travelBudget, setTravelBudget] = useState<number>(40000);
  const [contingencyBudget, setContingencyBudget] = useState<number>(40000);
  const [ipPotential, setIpPotential] = useState<any>('Patentable Technology');
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([
    { id: 'm-1', title: 'Problem Diagnosis & Lab Formulation', stage: 'Lab Prototype', durationWeeks: 4, status: 'in_progress', deliverable: 'Bench test results and design specs' },
    { id: 'm-2', title: 'Prototyping & Field Assembly', stage: 'Lab Prototype', durationWeeks: 4, status: 'pending', deliverable: 'Fully assembled prototype unit' },
    { id: 'm-3', title: 'Village Field Trial & Community Testing', stage: 'Field Testing', durationWeeks: 6, status: 'pending', deliverable: 'Water/soil output verified on-ground' },
    { id: 'm-4', title: 'Handover to Gram Panchayat & Training Manual', stage: 'Community Pilot', durationWeeks: 3, status: 'pending', deliverable: 'SOP and community training completed' },
  ]);

  const currentHei = universities.find((u) => u.id === selectedHeiId) || universities[0];

  if (!currentHei) {
    if (universities.length === 0) {
      return (
        <div className="flex items-center justify-center py-20 text-stone-500 font-serif italic">
          {t('univ.no_universities')}
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center py-20 text-stone-500 font-serif italic">
        {t('univ_loading')}
      </div>
    );
  }
  const assignedProblems = problems.filter((p) => p.assignedHeiId === currentHei?.id);
  const heiProposals = proposals.filter((p) => p.heiId === currentHei?.id);

  // Trigger server-side AI proposal generator
  const handleGenerateAiProposal = async (problem: ProblemStatement) => {
    setIsGeneratingAiProposal(true);
    try {
      const res = await fetch('/api/ai/generate-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId: problem.id,
          heiId: currentHei.id,
          customInstructions: customAiInstructions,
        }),
      });
      const data = await res.json();
      setProjectTitle(data.projectTitle || t('univ.ai_proposal_title', problem.title));
      setAbstract(data.abstract || '');
      setTechnologyMethodology(data.technologyMethodology || '');
      if (data.facultyMentor) {
        setLeadFacultyName(data.facultyMentor.name);
        setLeadFacultyDept(data.facultyMentor.department);
      }
      if (data.studentTeam) {
        setStudentLeadName(data.studentTeam.leadName);
        setStudentLeadEmail(data.studentTeam.leadEmail);
        if (data.studentTeam.departments) setStudentDepts(data.studentTeam.departments);
      }
      if (data.budgetBreakdown) {
        setHardwareBudget(data.budgetBreakdown.hardwareEquip || 140000);
        setPrototypingBudget(data.budgetBreakdown.prototyping || 100000);
        setFieldTestingBudget(data.budgetBreakdown.fieldTesting || 60000);
        setTravelBudget(data.budgetBreakdown.travelAndLogistics || 40000);
        setContingencyBudget(data.budgetBreakdown.contingency || 40000);
      }
      if (data.milestones && data.milestones.length > 0) {
        setMilestones(data.milestones);
      }
      if (data.ipPotential) {
        setIpPotential(data.ipPotential);
      }
      if (data.nepExperientialCredits) {
        setNepCredits(data.nepExperientialCredits);
      }
    } catch (err) {
      console.error('Failed to generate AI proposal:', err);
      alert(t('univ.ai_generator_error'));
    } finally {
      setIsGeneratingAiProposal(false);
    }
  };

  const handleStartProposal = (problem: ProblemStatement) => {
    setTargetProblemForProposal(problem);
    setActiveSubTab('team-builder');
    // Prepopulate faculty
    if (currentHei.facultyMentors && currentHei.facultyMentors.length > 0) {
      setLeadFacultyName(currentHei.facultyMentors[0].name);
      setLeadFacultyDept(currentHei.facultyMentors[0].department);
    }
    setProjectTitle(t('univ.draft_proposal_title', problem.title.slice(0, 40)));
  };

  const handleSubmitProposalForm = async () => {
    if (!targetProblemForProposal) return;
    if (!projectTitle.trim() || !abstract.trim()) {
      alert(t('univ.proposal_required_fields'));
      return;
    }

    setIsSubmittingProposal(true);
    const totalAmount = hardwareBudget + prototypingBudget + fieldTestingBudget + travelBudget + contingencyBudget;

    try {
      const payload = {
        problemId: targetProblemForProposal.id,
        problemTitle: targetProblemForProposal.title,
        heiId: currentHei.id,
        heiName: currentHei.name,
        projectTitle,
        abstract,
        technologyMethodology,
        facultyMentor: {
          name: leadFacultyName || currentHei.facultyMentors[0]?.name || t('univ.placeholder_faculty_lead'),
          department: leadFacultyDept || currentHei.departments[0],
          email: `${leadFacultyName.toLowerCase().replace(/\s+/g, '.')}@${currentHei.shortName.toLowerCase().replace(/[^a-z]/g, '')}.ac.in`,
        },
        studentTeam: {
          leadName: studentLeadName || t('univ.placeholder_student_lead'),
          leadEmail: studentLeadEmail || t('univ.placeholder_student_email'),
          membersCount: studentDepts.length + 2,
          departments: studentDepts,
        },
        nepExperientialCredits: nepCredits,
        budgetBreakdown: {
          hardwareEquip: hardwareBudget,
          prototyping: prototypingBudget,
          fieldTesting: fieldTestingBudget,
          travelAndLogistics: travelBudget,
          contingency: contingencyBudget,
          totalAmount,
        },
        milestones,
        ipPotential,
      };

      await onSubmitProposal(payload);
      setTargetProblemForProposal(null);
      setActiveSubTab('proposals');
      setTimeout(() => {
        alert(t('univ.submit_proposal_success'));
      }, 10);
    } catch (err: any) {
      console.error(err);
      alert(err.message || t('univ.submit_proposal_error'));
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  return (
    <div id="university-innovation-module" className="space-y-6">
      {/* HEI Selector Header */}
      <div className="bg-[#FAF7F2] border border-stone-300 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#1A1A1A] border border-stone-800 text-white flex items-center justify-center font-bold">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="editorial-meta">{t('univ_portal_title')}</span>
              <span className="text-stone-600">•</span>
              <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest">
                {currentHei.type} • {t('univ.est_label')} {currentHei.establishedYear}
              </span>
            </div>
            <h2 className="font-editorial-serif italic text-2xl font-bold text-stone-900 leading-none">{currentHei.name}</h2>
            <p className="text-xs text-stone-600 font-serif italic mt-1.5">
              {currentHei.incubationCenter} • {currentHei.district} {t('univ.district_label')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-[10px] uppercase font-bold tracking-wider text-stone-600">{t('univ_switch_inst')}</label>
          <select
            id="select-active-hei"
            value={selectedHeiId}
            onChange={(e) => {
              setSelectedHeiId(e.target.value);
              setTargetProblemForProposal(null);
            }}
            className="text-xs px-3 py-2 border border-stone-300 bg-white focus:outline-none focus:border-[#BC5434] text-stone-900"
          >
            {universities.map((u) => (
              <option key={u.id} value={u.id}>
                {u.shortName} ({u.district})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex border-b border-stone-300 space-x-6 text-[11px] font-bold uppercase tracking-widest text-stone-500">
        <button
          onClick={() => setActiveSubTab('assigned')}
          className={`pb-3 flex items-center gap-2 cursor-pointer transition-colors ${
            activeSubTab === 'assigned'
              ? 'border-b-2 border-[#BC5434] text-stone-900'
              : 'hover:text-stone-900 border-b-2 border-transparent'
          }`}
        >
          <span>{t('univ_tab_assigned')}</span>
          <span className="px-1.5 py-0.5 bg-[#FAF7F2] text-stone-900 text-[10px] border border-stone-300">
            {assignedProblems.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('proposals')}
          className={`pb-3 flex items-center gap-2 cursor-pointer transition-colors ${
            activeSubTab === 'proposals'
              ? 'border-b-2 border-[#BC5434] text-stone-900'
              : 'hover:text-stone-900 border-b-2 border-transparent'
          }`}
        >
          <span>{t('univ_tab_proposals')}</span>
          <span className="px-1.5 py-0.5 bg-[#FAF7F2] text-stone-900 text-[10px] border border-stone-300">
            {heiProposals.length}
          </span>
        </button>

        {targetProblemForProposal && (
          <button
            onClick={() => setActiveSubTab('team-builder')}
            className={`pb-3 flex items-center gap-2 cursor-pointer transition-colors ${
              activeSubTab === 'team-builder'
              ? 'text-[#BC5434] border-b-2 border-[#BC5434]'
              : 'text-[#BC5434]/70 hover:text-[#BC5434] border-b-2 border-transparent'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('univ_tab_draft', targetProblemForProposal.trackingCode)}</span>
          </button>
        )}
      </div>

      {/* Sub-Tab 1: {t('univ_tab_assigned')} */}
      {activeSubTab === 'assigned' && (
        <div className="space-y-4">
          <div className="bg-[#FAF7F2] border border-[#BC5434] p-4 text-xs text-stone-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <strong className="text-[#BC5434] uppercase tracking-wider font-bold text-[10px] mr-2">{t('univ_action_mandate')}</strong>
              <span className="font-serif italic">{t('univ_action_desc')}</span>
            </div>
            <div className="font-bold uppercase tracking-widest text-[10px] whitespace-nowrap">
              {t('univ_pending_actions', assignedProblems.length)}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {assignedProblems.map((prob) => (
              <div
                key={prob.id}
                className="bg-white border border-stone-300 p-5 hover:border-stone-500 transition-all flex flex-col md:flex-row items-start justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-[#1A1A1A] text-white">
                      {prob.trackingCode}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#FAF7F2] text-stone-900 border border-stone-300">
                      {t('univ.dept_label')} {prob.assignedDepartment || currentHei.departments[0]}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#FAF7F2] text-stone-900 border border-stone-300">
                      {prob.district} • {prob.blockOrPanchayat}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-stone-200 text-stone-800">
                      {t('univ.status_label')} {prob.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <h3
                    onClick={() => onSelectProblem(prob)}
                    className="font-editorial-serif text-xl font-bold text-stone-900 hover:text-[#BC5434] cursor-pointer leading-snug mt-1"
                  >
                    {prob.title}
                  </h3>

                  <p className="text-xs text-stone-600 line-clamp-2 font-sans">{prob.description}</p>

                  <div className="p-3 bg-[#FAF7F2] border border-stone-200 text-xs flex flex-wrap items-center justify-between gap-3 mt-3">
                    <span className="text-stone-600 font-serif italic">
                      <strong className="text-stone-900 not-italic uppercase tracking-wider text-[10px]">{t('univ.ai_taxonomy')}</strong> {prob.aiAnalysis?.subCategory}
                    </span>
                    <span className="text-stone-600 font-serif italic">
                      <strong className="text-stone-900 not-italic uppercase tracking-wider text-[10px]">{t('univ.beneficiaries')}</strong> {(prob.affectedPopulation || 0).toLocaleString()} citizens
                    </span>
                    <span className="text-[#BC5434] font-bold uppercase tracking-wider text-[10px]">
                      {t('univ.budget_band')}: {prob.aiAnalysis?.estimatedBudgetBand || t('univ.budget_band_fallback')}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0 md:min-w-[200px]">
                  <button
                    id={`btn-constitute-team-${prob.id}`}
                    onClick={() => handleStartProposal(prob)}
                    className="w-full inline-flex items-center justify-center gap-2 bg-[#1A1A1A] hover:bg-black text-white text-[11px] font-bold uppercase tracking-widest px-4 py-3 cursor-pointer transition-colors"
                  >
                    <Users className="w-4 h-4" />
                    <span>{t('univ_constitute_team')}</span>
                  </button>

                  <button
                    onClick={() => onSelectProblem(prob)}
                    className="w-full text-[11px] font-bold uppercase tracking-widest text-stone-600 hover:text-stone-900 py-2 border border-transparent hover:border-stone-300 cursor-pointer"
                  >
                    {t('univ_view_evidence')}
                  </button>
                </div>
              </div>
            ))}

            {assignedProblems.length === 0 && (
              <div className="bg-white border border-stone-300 p-8 text-center text-stone-500 font-serif italic text-sm">
                {t('univ_no_assigned', currentHei.name)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Submitted Research Proposals */}
      {activeSubTab === 'proposals' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {heiProposals.map((prop) => (
              <div
                key={prop.id}
                className="bg-white border border-stone-300 p-6 space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-900 bg-[#FAF7F2] px-2 py-0.5 border border-stone-300 inline-block mb-2">
                      {t('univ_nep_credits')} {prop.nepExperientialCredits}
                    </span>
                    <h3 className="font-editorial-serif italic text-2xl font-bold text-stone-900">{prop.projectTitle}</h3>
                    <div className="text-xs text-stone-600 font-serif italic mt-1">
                      {t('univ.problem_label')} <strong className="text-stone-900 not-italic uppercase tracking-wider text-[10px]">{prop.problemTitle}</strong>
                    </div>
                  </div>

                  <div className="text-left md:text-right mt-2 md:mt-0">
                    <span className="inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 bg-[#1A1A1A] text-white">
                      {prop.status.replace(/_/g, ' ')}
                    </span>
                    <div className="text-sm font-bold text-stone-900 mt-2">
                      ₹{(prop.budgetBreakdown.totalAmount / 100000).toFixed(2)} {t('univ.lakhs_suffix')}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed bg-[#FAF7F2] p-4 border border-stone-200 font-serif italic">
                  {prop.abstract}
                </p>

                {/* Team & Faculty Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs p-4 border border-stone-200">
                  <div>
                    <div className="editorial-meta text-stone-500 mb-1">{t('univ_faculty_mentor')}</div>
                    <div className="font-bold text-stone-900">{prop.facultyMentor.name}</div>
                    <div className="text-stone-600 font-serif italic mt-0.5">{prop.facultyMentor.department}</div>
                  </div>
                  <div>
                    <div className="editorial-meta text-stone-500 mb-1">{t('univ_student_team')}</div>
                    <div className="font-bold text-stone-900">{prop.studentTeam.leadName} (Lead)</div>
                    <div className="text-stone-600 font-serif italic mt-0.5">
                      {prop.studentTeam.membersCount} {t('univ.researchers_label')} ({prop.studentTeam.departments.join(', ')})
                    </div>
                  </div>
                  <div>
                    <div className="editorial-meta text-stone-500 mb-1">{t('univ_industry_sponsor')}</div>
                    <div className="font-bold text-[#BC5434]">
                      {prop.industryPartnerName || t('univ.industry_sponsor_fallback')}
                    </div>
                    <div className="text-stone-600 font-serif italic mt-0.5">{t('univ.ip_potential_label')} {prop.ipPotential}</div>
                  </div>
                </div>

                {/* Milestones Roadmaps */}
                <div className="pt-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-stone-900 mb-3 flex items-center justify-between border-b border-stone-200 pb-2">
                    <span>{t('univ_execution_milestones', prop.milestones.length)}</span>
                    <span className="text-stone-500">
                      {prop.milestones.filter((m) => m.status === 'completed').length}/{prop.milestones.length} {t('univ_milestone_completed')}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {prop.milestones.map((m) => (
                      <div
                        key={m.id}
                        className={`p-3 border text-xs ${
                          m.status === 'completed'
                            ? 'bg-stone-100 border-stone-300 text-stone-900'
                            : m.status === 'in_progress'
                            ? 'bg-white border-[#BC5434] text-stone-900'
                            : 'bg-[#FAF7F2] border-stone-200 text-stone-500'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] uppercase font-bold tracking-widest">{m.stage}</span>
                          <span
                            onClick={() => {
                              const nextStatus = m.status === 'completed' ? 'in_progress' : 'completed';
                              onUpdateMilestone(prop.id, m.id, nextStatus);
                            }}
                            className={`cursor-pointer text-[10px] font-bold uppercase tracking-widest hover:underline ${
                              m.status === 'completed' ? 'text-stone-900' : m.status === 'in_progress' ? 'text-[#BC5434]' : 'text-stone-400'
                            }`}
                          >
                            {m.status === 'completed' ? t('univ_milestone_done') : m.status === 'in_progress' ? t('univ_milestone_active') : t('univ_milestone_wait')}
                          </span>
                        </div>
                        <div className="font-editorial-serif font-bold text-sm leading-tight mb-1">{m.title}</div>
                        <div className="text-[10px] font-serif italic mt-2 text-stone-600">{t('univ.deliverable_label')} {m.deliverable}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {heiProposals.length === 0 && (
              <div className="bg-white border border-stone-300 p-8 text-center text-stone-500 font-serif italic text-sm">
                {t('univ.no_proposals', currentHei.name)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Multidisciplinary Team Constitutor & AI Proposal Draft */}
      {activeSubTab === 'team-builder' && targetProblemForProposal && (
        <div className="bg-white border border-stone-300 p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-200">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#FAF7F2] text-[#BC5434] border border-stone-300 mb-2">
                <Sparkles className="w-3 h-3" />
                <span>{t('univ_team_formulator')}</span>
              </div>
              <h3 className="font-editorial-serif text-2xl font-bold text-stone-900 leading-snug">{targetProblemForProposal.title}</h3>
              <p className="text-xs text-stone-600 font-serif italic mt-1">
                {targetProblemForProposal.district} • {targetProblemForProposal.blockOrPanchayat}
              </p>
            </div>

            {/* AI Generator Button */}
            <button
              id="btn-ai-generate-proposal"
              onClick={() => handleGenerateAiProposal(targetProblemForProposal)}
              disabled={isGeneratingAiProposal}
              className="inline-flex items-center justify-center gap-2 bg-[#FAF7F2] hover:bg-white text-[#BC5434] border border-[#BC5434] text-[11px] font-bold uppercase tracking-widest px-6 py-3 transition-all cursor-pointer disabled:opacity-50"
            >
              {isGeneratingAiProposal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{isGeneratingAiProposal ? t('univ_ai_generating') : t('univ_ai_draft_btn')}</span>
            </button>
          </div>

          {/* Form Fields */}
          <div className="space-y-5">
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-700 mb-1.5">
                {t('univ_proposal_title')} <span className="text-[#BC5434]">*</span>
              </label>
              <input
                id="input-proposal-title"
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder={t('univ.placeholder_proposal_title')}
                className="w-full text-sm px-3 py-2.5 border border-stone-300 bg-white focus:outline-none focus:border-[#BC5434]"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-700 mb-1.5">
                {t('univ_proposal_abstract')} <span className="text-[#BC5434]">*</span>
              </label>
              <textarea
                id="textarea-proposal-abstract"
                rows={3}
                value={abstract}
                onChange={(e) => setAbstract(e.target.value)}
                placeholder={t('univ.placeholder_proposal_abstract')}
                className="w-full text-xs font-serif italic px-3 py-2.5 border border-stone-300 bg-white focus:outline-none focus:border-[#BC5434]"
              ></textarea>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-700 mb-1.5">
                {t('univ_proposal_method')}
              </label>
              <textarea
                rows={4}
                value={technologyMethodology}
                onChange={(e) => setTechnologyMethodology(e.target.value)}
                placeholder={t('univ.placeholder_proposal_method')}
                className="w-full text-xs font-mono px-3 py-2.5 border border-stone-300 bg-[#FAF7F2] focus:outline-none focus:border-[#BC5434]"
              ></textarea>
            </div>

            {/* Team Constitution */}
            <div className="p-5 border border-stone-300 space-y-4">
              <div className="text-[10px] uppercase font-bold tracking-wider text-stone-900 flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-200 pb-2">
                <span className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" />
                  <span>{t('univ_innovation_team')}</span>
                </span>
                <span className="text-stone-500 font-serif italic lowercase tracking-normal mt-1 sm:mt-0">{t('univ.nep_capstone_label')}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1.5">{t('univ_faculty_mentor')}</label>
                  <input
                    type="text"
                    value={leadFacultyName}
                    onChange={(e) => setLeadFacultyName(e.target.value)}
                    placeholder={t('univ.placeholder_mentor')}
                    className="w-full text-xs px-3 py-2 border border-stone-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1.5">{t('univ_student_team')}</label>
                  <input
                    type="text"
                    value={studentLeadName}
                    onChange={(e) => setStudentLeadName(e.target.value)}
                    placeholder={t('univ.placeholder_student')}
                    className="w-full text-xs px-3 py-2 border border-stone-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1.5">{t('univ.nep_credits_label')}</label>
                  <select
                    value={nepCredits}
                    onChange={(e) => setNepCredits(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-stone-300 bg-[#FAF7F2] font-bold text-stone-900"
                  >
                    <option value={4}>{t('univ.nep_credit_option_4')}</option>
                    <option value={6}>{t('univ.nep_credit_option_6')}</option>
                    <option value={8}>{t('univ.nep_credit_option_8')}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Budget Breakdown */}
            <div className="p-5 border border-stone-300 space-y-4">
              <div className="text-[10px] uppercase font-bold tracking-wider text-stone-900 flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-200 pb-2">
                <span className="flex items-center gap-2">
                  <IndianRupee className="w-3.5 h-3.5" />
                  <span>{t('univ_budget_breakdown')}</span>
                </span>
                <span className="text-[#BC5434] font-bold mt-1 sm:mt-0">
                  {t('univ.budget_total_label')} ₹{((hardwareBudget + prototypingBudget + fieldTestingBudget + travelBudget + contingencyBudget) / 100000).toFixed(2)} {t('univ.lakhs_suffix')}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1.5 text-center">{t('univ.budget_hardware')}</label>
                  <input
                    type="number"
                    value={hardwareBudget}
                    onChange={(e) => setHardwareBudget(Number(e.target.value))}
                    className="w-full text-xs text-center px-2 py-2 border border-stone-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1.5 text-center">{t('univ.budget_prototype')}</label>
                  <input
                    type="number"
                    value={prototypingBudget}
                    onChange={(e) => setPrototypingBudget(Number(e.target.value))}
                    className="w-full text-xs text-center px-2 py-2 border border-stone-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1.5 text-center">{t('univ.budget_trials')}</label>
                  <input
                    type="number"
                    value={fieldTestingBudget}
                    onChange={(e) => setFieldTestingBudget(Number(e.target.value))}
                    className="w-full text-xs text-center px-2 py-2 border border-stone-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1.5 text-center">{t('univ.budget_travel')}</label>
                  <input
                    type="number"
                    value={travelBudget}
                    onChange={(e) => setTravelBudget(Number(e.target.value))}
                    className="w-full text-xs text-center px-2 py-2 border border-stone-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1.5 text-center">{t('univ.budget_contingency')}</label>
                  <input
                    type="number"
                    value={contingencyBudget}
                    onChange={(e) => setContingencyBudget(Number(e.target.value))}
                    className="w-full text-xs text-center px-2 py-2 border border-stone-300 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* IP Potential */}
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-700 mb-1.5">
                {t('univ_ip_potential')}
              </label>
              <select
                value={ipPotential}
                onChange={(e) => setIpPotential(e.target.value as any)}
                className="w-full text-xs px-3 py-2.5 border border-stone-300 bg-white"
              >
                <option value="Patentable Technology">{t('univ.ip_option_patent')}</option>
                <option value="Open-Source Public Good">{t('univ.ip_option_opensource')}</option>
                <option value="Grassroots Spinoff">{t('univ.ip_option_startup')}</option>
                <option value="Process Copyright">{t('univ.ip_option_copyright')}</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-stone-200 mt-6">
            <button
              type="button"
              onClick={() => setActiveSubTab('assigned')}
              className="px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-stone-600 hover:text-stone-900 cursor-pointer text-center"
            >
              {t('univ_cancel')}
            </button>
            <button
              type="button"
              id="btn-submit-solution-proposal"
              onClick={handleSubmitProposalForm}
              disabled={isSubmittingProposal}
              className="inline-flex items-center justify-center gap-2 bg-[#1A1A1A] hover:bg-black text-white font-bold uppercase tracking-widest text-[11px] px-8 py-3 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmittingProposal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>{t('univ_submit_proposal')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
