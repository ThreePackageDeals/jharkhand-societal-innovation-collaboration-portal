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
import { Button, Card } from './Primitives';

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
      setProjectTitle(data.projectTitle || `Innovation Project: ${problem.title}`);
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
      alert('Could not run AI generator. You can draft manually.');
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
    setProjectTitle(`Project ${problem.title.slice(0, 40)} Innovation`);
  };

  const handleSubmitProposalForm = async () => {
    if (!targetProblemForProposal) return;
    if (!projectTitle.trim() || !abstract.trim()) {
      alert('Please provide project title and abstract.');
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
          name: leadFacultyName || currentHei.facultyMentors[0]?.name || 'Dr. Lead Faculty',
          department: leadFacultyDept || currentHei.departments[0],
          email: `${leadFacultyName.toLowerCase().replace(/\s+/g, '.')}@${currentHei.shortName.toLowerCase().replace(/[^a-z]/g, '')}.ac.in`,
        },
        studentTeam: {
          leadName: studentLeadName || 'Student Innovation Lead',
          leadEmail: studentLeadEmail || 'student.researcher@univ.ac.in',
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
      alert('Solution Proposal submitted successfully and dispatched for Industry/CSR partnership!');
    } catch (err) {
      console.error(err);
      alert('Failed to submit proposal.');
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  return (
    <div id="university-innovation-module" className="space-y-6">
      {/* HEI Selector Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-700 text-white flex items-center justify-center font-bold shadow-inner">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                NEP 2020 HEI Portal
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {currentHei.type} • Est. {currentHei.establishedYear}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">{currentHei.name}</h2>
            <p className="text-xs text-slate-500">
              {currentHei.incubationCenter} • {currentHei.district} District
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-600">Switch Institution:</label>
          <select
            id="select-active-hei"
            value={selectedHeiId}
            onChange={(e) => {
              setSelectedHeiId(e.target.value);
              setTargetProblemForProposal(null);
            }}
            className="text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-600"
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
      <div className="flex border-b border-slate-200 space-x-4 text-xs font-semibold text-slate-600">
        <button
          onClick={() => setActiveSubTab('assigned')}
          className={`pb-2.5 flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'assigned'
              ? 'border-b-2 border-blue-600 text-blue-700 font-bold'
              : 'hover:text-slate-900'
          }`}
        >
          <span>Assigned Challenges</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 text-[10px]">
            {assignedProblems.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('proposals')}
          className={`pb-2.5 flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'proposals'
              ? 'border-b-2 border-blue-600 text-blue-700 font-bold'
              : 'hover:text-slate-900'
          }`}
        >
          <span>Submitted Research Proposals</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 text-[10px]">
            {heiProposals.length}
          </span>
        </button>

        {targetProblemForProposal && (
          <button
            onClick={() => setActiveSubTab('team-builder')}
            className={`pb-2.5 flex items-center gap-1.5 cursor-pointer text-emerald-700 font-bold border-b-2 border-emerald-600`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Draft Proposal ({targetProblemForProposal.trackingCode})</span>
          </button>
        )}
      </div>

      {/* Sub-Tab 1: Assigned Challenges */}
      {activeSubTab === 'assigned' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900 flex items-center justify-between">
            <div>
              <strong>NEP 2020 Action Mandate:</strong> Constitute multidisciplinary faculty-student teams, assign research credits, and submit innovative technical proposals for on-ground testing.
            </div>
            <div className="font-bold whitespace-nowrap ml-3">
              {assignedProblems.length} Pending Actions
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {assignedProblems.map((prob) => (
              <Card
                key={prob.id}
                className="flex flex-col md:flex-row items-start justify-between gap-4 hover:border-slate-300 transition-all"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {prob.trackingCode}
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      Department: {prob.assignedDepartment || currentHei.departments[0]}
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {prob.district} • {prob.blockOrPanchayat}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Status: {prob.status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </div>

                  <h3
                    onClick={() => onSelectProblem(prob)}
                    className="text-base font-bold text-slate-900 hover:text-blue-700 cursor-pointer"
                  >
                    {prob.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2">{prob.description}</p>

                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs flex flex-wrap items-center justify-between gap-2">
                    <span className="text-slate-600">
                      <strong>AI Taxonomy:</strong> {prob.aiAnalysis?.subCategory}
                    </span>
                    <span className="text-slate-600">
                      <strong>Beneficiaries:</strong> {prob.affectedPopulation.toLocaleString()} citizens
                    </span>
                    <span className="text-emerald-700 font-semibold">
                      Budget Band: {prob.aiAnalysis?.estimatedBudgetBand || '₹3.0 - ₹5.0 Lakhs'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0 md:min-w-[200px]">
                  <Button
                    id={`btn-constitute-team-${prob.id}`}
                    onClick={() => handleStartProposal(prob)}
                    variant="primary"
                  >
                    <Users className="w-4 h-4" />
                    <span>Constitute Team & Propose</span>
                  </Button>

                  <button
                    onClick={() => onSelectProblem(prob)}
                    className="w-full text-xs text-slate-600 hover:text-slate-900 py-1 text-center font-medium cursor-pointer"
                  >
                    View Community Evidence
                  </button>
                </div>
              </Card>
            ))}

            {assignedProblems.length === 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
                No challenges currently routed to {currentHei.name}. Check the AI Triage tab to allocate incoming societal challenges.
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
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      NEP Experiential Research Credits: {prop.nepExperientialCredits}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{prop.projectTitle}</h3>
                    <div className="text-xs text-slate-500">
                      Problem: <strong className="text-slate-700">{prop.problemTitle}</strong>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-block text-xs font-bold px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {prop.status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <div className="text-xs font-bold text-slate-900 mt-1">
                      ₹{(prop.budgetBreakdown.totalAmount / 100000).toFixed(2)} Lakhs
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded border border-slate-200">
                  {prop.abstract}
                </p>

                {/* Team & Faculty Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-slate-100/70 p-3 rounded-lg border border-slate-200">
                  <div>
                    <div className="text-slate-500 font-semibold text-[11px]">Faculty Mentor</div>
                    <div className="font-bold text-slate-800">{prop.facultyMentor.name}</div>
                    <div className="text-slate-600 text-[11px]">{prop.facultyMentor.department}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 font-semibold text-[11px]">Student Team</div>
                    <div className="font-bold text-slate-800">{prop.studentTeam.leadName} (Lead)</div>
                    <div className="text-slate-600 text-[11px]">
                      {prop.studentTeam.membersCount} Researchers ({prop.studentTeam.departments.join(', ')})
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 font-semibold text-[11px]">Industry Sponsor</div>
                    <div className="font-bold text-emerald-800">
                      {prop.industryPartnerName || 'Seeking CSR / Industry Sponsor'}
                    </div>
                    <div className="text-slate-600 text-[11px]">IP Potential: {prop.ipPotential}</div>
                  </div>
                </div>

                {/* Milestones Roadmaps */}
                <div>
                  <div className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                    <span>Project Execution Milestones ({prop.milestones.length})</span>
                    <span className="text-[11px] text-slate-500">
                      {prop.milestones.filter((m) => m.status === 'completed').length}/{prop.milestones.length} Completed
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {prop.milestones.map((m) => (
                      <div
                        key={m.id}
                        className={`p-2.5 rounded border text-xs ${
                          m.status === 'completed'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            : m.status === 'in_progress'
                            ? 'bg-blue-50 border-blue-200 text-blue-900'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">{m.stage}</span>
                          <span
                            onClick={() => {
                              const nextStatus = m.status === 'completed' ? 'in_progress' : 'completed';
                              onUpdateMilestone(prop.id, m.id, nextStatus);
                            }}
                            className="cursor-pointer text-[10px] font-bold underline"
                          >
                            {m.status === 'completed' ? '✓ Completed' : m.status === 'in_progress' ? '● In Progress' : '○ Pending'}
                          </span>
                        </div>
                        <div className="font-semibold text-[11px] line-clamp-2">{m.title}</div>
                        <div className="text-[10px] opacity-80 mt-1">Deliverable: {m.deliverable}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {heiProposals.length === 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
                No solution proposals submitted yet for {currentHei.name}. Select an assigned challenge to begin drafting.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Multidisciplinary Team Constitutor & AI Proposal Draft */}
      {activeSubTab === 'team-builder' && targetProblemForProposal && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-4 border-b border-slate-200">
            <div>
              <div className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Multidisciplinary Team & NEP 2020 Proposal Formulator</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">{targetProblemForProposal.title}</h3>
              <p className="text-xs text-slate-500">
                {targetProblemForProposal.district} • {targetProblemForProposal.blockOrPanchayat}
              </p>
            </div>

            {/* AI Generator Button */}
            <button
              id="btn-ai-generate-proposal"
              onClick={() => handleGenerateAiProposal(targetProblemForProposal)}
              disabled={isGeneratingAiProposal}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50 active:scale-95"
            >
              {isGeneratingAiProposal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{isGeneratingAiProposal ? 'Generating with Gemini AI...' : 'Generate with Gemini AI'}</span>
            </button>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Project Innovation Title <span className="text-red-500">*</span>
              </label>
              <input
                id="input-proposal-title"
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="e.g. Project Jal-Amrit: Low-Cost Solar Assisted Nano-Composite De-fluoridation"
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Executive Abstract & Societal Value Proposition <span className="text-red-500">*</span>
              </label>
              <textarea
                id="textarea-proposal-abstract"
                rows={3}
                value={abstract}
                onChange={(e) => setAbstract(e.target.value)}
                placeholder="Summarize the core technical innovation, targeted beneficiaries, and expected outcomes..."
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              ></textarea>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Technology Methodology & Implementation Steps
              </label>
              <textarea
                rows={4}
                value={technologyMethodology}
                onChange={(e) => setTechnologyMethodology(e.target.value)}
                placeholder="1. Material synthesis and bench testing... 2. IoT telemetry integration... 3. Village deployment... 4. Handover..."
                className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              ></textarea>
            </div>

            {/* Team Constitution */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Multidisciplinary Innovation Team & NEP Credits</span>
                </span>
                <span className="text-slate-500 text-[11px]">NEP 2020 Capstone / Experiential Learning</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Lead Faculty Mentor</label>
                  <input
                    type="text"
                    value={leadFacultyName}
                    onChange={(e) => setLeadFacultyName(e.target.value)}
                    placeholder="Dr. Mentor Name"
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Student Lead Name</label>
                  <input
                    type="text"
                    value={studentLeadName}
                    onChange={(e) => setStudentLeadName(e.target.value)}
                    placeholder="Student Lead Name"
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">NEP Academic Credits</label>
                  <select
                    value={nepCredits}
                    onChange={(e) => setNepCredits(Number(e.target.value))}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white font-semibold text-blue-800"
                  >
                    <option value={4}>4 Credits (Minor Social Practicum)</option>
                    <option value={6}>6 Credits (Final Year Capstone Project)</option>
                    <option value={8}>8 Credits (Master Thesis / Innovation Fellowship)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Budget Breakdown */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <IndianRupee className="w-4 h-4 text-emerald-600" />
                  <span>Budget Breakdown (INR)</span>
                </span>
                <span className="text-emerald-800 font-bold text-sm">
                  Total: ₹{((hardwareBudget + prototypingBudget + fieldTestingBudget + travelBudget + contingencyBudget) / 100000).toFixed(2)} Lakhs
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <label className="block text-[10px] font-medium text-slate-600 mb-1">Hardware / Equip</label>
                  <input
                    type="number"
                    value={hardwareBudget}
                    onChange={(e) => setHardwareBudget(Number(e.target.value))}
                    className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-slate-600 mb-1">Prototyping / Media</label>
                  <input
                    type="number"
                    value={prototypingBudget}
                    onChange={(e) => setPrototypingBudget(Number(e.target.value))}
                    className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-slate-600 mb-1">Field Testing / Trials</label>
                  <input
                    type="number"
                    value={fieldTestingBudget}
                    onChange={(e) => setFieldTestingBudget(Number(e.target.value))}
                    className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-slate-600 mb-1">Travel & Logistics</label>
                  <input
                    type="number"
                    value={travelBudget}
                    onChange={(e) => setTravelBudget(Number(e.target.value))}
                    className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-slate-600 mb-1">Contingency</label>
                  <input
                    type="number"
                    value={contingencyBudget}
                    onChange={(e) => setContingencyBudget(Number(e.target.value))}
                    className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white"
                  />
                </div>
              </div>
            </div>

            {/* IP Potential */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Intellectual Property & Commercialization Potential
              </label>
              <select
                value={ipPotential}
                onChange={(e) => setIpPotential(e.target.value as any)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="Patentable Technology">Patentable Technology (Novel Process / Composition)</option>
                <option value="Open-Source Public Good">Open-Source Public Good (Frugal Community Hardware)</option>
                <option value="Grassroots Spinoff">Grassroots Startup Spinoff (Student Led Venture)</option>
                <option value="Process Copyright">Process Copyright / Digital Platform</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setActiveSubTab('assigned')}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              id="btn-submit-solution-proposal"
              onClick={handleSubmitProposalForm}
              disabled={isSubmittingProposal}
              className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-600 text-white font-semibold text-xs px-6 py-2.5 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmittingProposal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Submit Proposal & Open for Industry CSR</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
