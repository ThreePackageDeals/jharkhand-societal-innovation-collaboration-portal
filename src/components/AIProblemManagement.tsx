import React, { useState } from 'react';
import {
  Sparkles,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  ArrowRight,
  Send,
  Loader2,
  ExternalLink,
  ShieldAlert,
  ChevronDown,
} from 'lucide-react';
import { ProblemStatement, University, District, DomainTheme } from '../types';
import { JHARKHAND_DISTRICTS, THEMATIC_DOMAINS } from '../data/jharkhandData';
import { useLanguage } from '../LanguageContext';

interface AIProblemManagementProps {
  problems: ProblemStatement[];
  universities: University[];
  onAssignHEI: (problemId: string, heiId: string, department: string) => Promise<void>;
  onSelectProblem: (problem: ProblemStatement) => void;
  onRefreshProblems: () => void;
}

export const AIProblemManagement: React.FC<AIProblemManagementProps> = ({
  problems,
  universities,
  onAssignHEI,
  onSelectProblem,
  onRefreshProblems,
}) => {
  const { t } = useLanguage();
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [assigningProblemId, setAssigningProblemId] = useState<string | null>(null);
  const [selectedHeiId, setSelectedHeiId] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [isSubmittingAssign, setIsSubmittingAssign] = useState(false);

  // Filter problems
  const filteredProblems = problems.filter((p) => {
    if (selectedDomain !== 'all' && p.domain !== selectedDomain) return false;
    if (selectedDistrict !== 'all' && p.district !== selectedDistrict) return false;
    if (selectedUrgency !== 'all' && p.urgency !== selectedUrgency) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        (p.title || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.trackingCode || '').toLowerCase().includes(q) ||
        (p.blockOrPanchayat || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  }).sort((a, b) => {
    const order: Record<string, number> = { Critical: 1, High: 2, Medium: 3, Low: 4 };
    const valA = order[a.urgency] || 5;
    const valB = order[b.urgency] || 5;
    return valA - valB;
  });

  // Calculate triage stats
  const totalCount = problems.length;
  const unassignedCount = problems.filter((p) => !p.assignedHeiId).length;
  const highPriorityCount = problems.filter((p) => p.aiAnalysis?.priorityScore >= 85).length;
  const duplicateAlertsCount = problems.filter((p) => p.aiAnalysis?.duplicateMatches?.length > 0).length;

  const handleOpenAssignModal = (problem: ProblemStatement) => {
    setAssigningProblemId(problem.id);
    // Preset top matched HEI if available
    const topMatch = problem.aiAnalysis?.matchedHeis?.[0];
    if (topMatch) {
      setSelectedHeiId(topMatch.universityId);
      setSelectedDept(topMatch.department);
    } else {
      setSelectedHeiId(universities[0]?.id || '');
      setSelectedDept(universities[0]?.departments[0] || '');
    }
  };

  const handleConfirmAssignment = async () => {
    if (!assigningProblemId || !selectedHeiId) return;
    setIsSubmittingAssign(true);
    try {
      await onAssignHEI(assigningProblemId, selectedHeiId, selectedDept);
      setAssigningProblemId(null);
    } catch (err) {
      console.error(err);
      alert(t('ai_mgmt.assignment_failed'));
    } finally {
      setIsSubmittingAssign(false);
    }
  };

  const currentProblemForAssign = problems.find((p) => p.id === assigningProblemId);
  const currentSelectedHei = universities.find((u) => u.id === selectedHeiId);

  return (
    <div id="ai-triage-module" className="space-y-6">
      {/* Triage Header Banner */}
      <div className="bg-[#1A1A1A] text-stone-100 p-8 border border-stone-800 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="editorial-meta">{t('ai_mgmt.title')}</span>
              <span className="text-stone-600">•</span>
              <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">{t('ai_mgmt.matrix')}</span>
            </div>
            <h2 className="font-editorial-serif italic text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {t('ai_mgmt.heading')}
            </h2>
            <p className="text-xs text-stone-400 font-serif italic max-w-2xl mt-2 leading-relaxed">
              {t('ai_mgmt.description')}
            </p>
          </div>

          {/* Quick Stats Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="bg-[#FAF7F2] border border-[#BC5434] p-3 min-w-[100px]">
              <div className="font-editorial-serif text-2xl font-light text-[#BC5434]">{totalCount}</div>
              <div className="text-[10px] text-stone-600 font-serif italic mt-1">{t('ai_mgmt.total_received')}</div>
            </div>
            <div className="bg-[#FAF7F2] border border-[#BC5434] p-3 min-w-[100px]">
              <div className="font-editorial-serif text-2xl font-light text-[#BC5434]">{unassignedCount}</div>
              <div className="text-[10px] text-stone-600 font-serif italic mt-1">{t('ai_mgmt.pending_route')}</div>
            </div>
            <div className="bg-[#FAF7F2] border border-[#BC5434] p-3 min-w-[100px]">
              <div className="font-editorial-serif text-2xl font-light text-[#BC5434]">{highPriorityCount}</div>
              <div className="text-[10px] text-stone-600 font-serif italic mt-1">{t('ai_mgmt.critical_score')}</div>
            </div>
            <div className="bg-[#FAF7F2] border border-[#BC5434] p-3 min-w-[100px]">
              <div className="font-editorial-serif text-2xl font-light text-[#BC5434]">{duplicateAlertsCount}</div>
              <div className="text-[10px] text-stone-600 font-serif italic mt-1">{t('ai_mgmt.duplicate_clusters')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#FAF7F2] p-4 border border-stone-300 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <input
              type="text"
              placeholder={t('ai_mgmt.search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 border border-stone-300 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#BC5434]"
            />
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
          </div>

          {/* Domain Filter */}
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="text-xs px-3 py-2 border border-stone-300 bg-white text-stone-900 focus:outline-none focus:border-[#BC5434]"
          >
            <option value="all">{t('ai_mgmt.all_domains', THEMATIC_DOMAINS.length)}</option>
            {THEMATIC_DOMAINS.map((td) => (
              <option key={td.key} value={td.key}>
                {td.label}
              </option>
            ))}
          </select>

          {/* District Filter */}
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="text-xs px-3 py-2 border border-stone-300 bg-white text-stone-900 focus:outline-none focus:border-[#BC5434]"
          >
            <option value="all">{t('ai_mgmt.all_districts')}</option>
            {JHARKHAND_DISTRICTS.map((dist) => (
              <option key={dist} value={dist}>
                {dist}
              </option>
            ))}
          </select>

          {/* Urgency Filter */}
          <select
            value={selectedUrgency}
            onChange={(e) => setSelectedUrgency(e.target.value)}
            className="text-xs px-3 py-2 border border-stone-300 bg-white text-stone-900 focus:outline-none focus:border-[#BC5434]"
          >
            <option value="all">{t('ai_mgmt.all_urgency')}</option>
            <option value="Critical">{t('urgency.Critical')}</option>
            <option value="High">{t('urgency.High')}</option>
            <option value="Medium">{t('urgency.Medium')}</option>
            <option value="Low">{t('urgency.Low')}</option>
          </select>
        </div>

        <div className="text-xs font-serif italic text-stone-600">
          {t('ai_mgmt.showing', filteredProblems.length)}
        </div>
      </div>

      {/* Problem Statements Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredProblems.map((prob) => {
          const isAssigned = Boolean(prob.assignedHeiId);
          const topMatch = prob.aiAnalysis?.matchedHeis?.[0];
          const hasDuplicates = prob.aiAnalysis?.duplicateMatches?.length > 0;

          return (
            <div
              key={prob.id}
              className="bg-white border border-stone-300 p-5 hover:border-stone-500 transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                {/* Left: Details */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-[#1A1A1A] text-white">
                      {prob.trackingCode}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#FAF7F2] text-[#BC5434] border border-stone-300">
                      {t('domain.' + (prob.domain || 'general'))}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#FAF7F2] text-stone-900 border border-stone-300">
                      {prob.district} • {prob.blockOrPanchayat}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 shadow-xs ${prob.urgency === 'Critical'
                          ? 'bg-[#BC5434] text-white'
                          : prob.urgency === 'High'
                            ? 'bg-stone-900 text-white'
                            : 'bg-stone-200 text-stone-800'
                        }`}
                    >
                      {t('ai_mgmt.urgency', t('urgency.' + prob.urgency))}
                    </span>
                    {hasDuplicates && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-white text-[#BC5434] border border-[#BC5434] flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>{t('ai_mgmt.similar', prob.aiAnalysis.duplicateMatches.length)}</span>
                      </span>
                    )}
                  </div>

                  <h3
                    onClick={() => onSelectProblem(prob)}
                    className="font-editorial-serif text-xl font-bold text-stone-900 hover:text-[#BC5434] cursor-pointer transition-colors leading-snug"
                  >
                    {prob.title}
                  </h3>

                  <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed font-sans">{prob.description}</p>

                  {/* AI Evaluation Insights */}
                  <div className="bg-[#FAF7F2] border border-stone-200 p-3 text-xs flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white border border-stone-300 text-[#BC5434] flex items-center justify-center font-editorial-serif font-bold text-sm">
                        {prob.aiAnalysis?.priorityScore || 85}
                      </div>
                      <div>
                        <div className="font-bold text-stone-900 uppercase tracking-wider text-[10px]">
                          {t('ai_mgmt.priority_score')}
                        </div>
                        <div className="text-[11px] text-stone-600 font-serif italic mt-0.5">
                          {prob.aiAnalysis?.subCategory || t('ai_mgmt.grassroots_need')}
                        </div>
                      </div>
                    </div>

                    {/* Top Recommended HEI Match */}
                    {topMatch && (
                      <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-stone-200">
                        <Building2 className="w-3.5 h-3.5 text-stone-500" />
                        <div>
                          <div className="font-bold text-stone-900 text-[10px] uppercase tracking-wider">
                            {t('ai_mgmt.match')} <span className="text-[#BC5434]">{topMatch.universityName}</span> ({topMatch.matchScore}%)
                          </div>
                          <div className="text-[10px] text-stone-500 font-serif italic mt-0.5">{topMatch.department}</div>
                        </div>
                      </div>
                    )}

                    <div className="text-[11px] text-stone-600 font-serif italic">
                      {t('ai_mgmt.affected')} <strong className="text-stone-900 not-italic">{(prob.affectedPopulation || 0).toLocaleString()}</strong>
                    </div>
                  </div>
                </div>

                {/* Right: Assignment Actions */}
                <div className="flex flex-col items-end gap-2 shrink-0 md:min-w-[190px]">
                  {isAssigned ? (
                    <div className="w-full bg-[#FAF7F2] border border-stone-300 p-3 text-center">
                      <div className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">{t('ai_mgmt.assigned_hei')}</div>
                      <div className="text-xs font-bold text-stone-900 mt-1">{prob.assignedHeiName}</div>
                      <div className="text-[10px] text-stone-600 font-serif italic mt-0.5">{prob.assignedDepartment}</div>
                      <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#BC5434]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{t('ai_mgmt.allocation_active')}</span>
                      </div>
                    </div>
                  ) : (
                    <button
                      id={`btn-route-hei-${prob.id}`}
                      onClick={() => handleOpenAssignModal(prob)}
                      className="w-full inline-flex items-center justify-center gap-2 bg-[#BC5434] hover:bg-[#A3452B] text-white text-xs font-bold uppercase tracking-widest px-4 py-3 cursor-pointer"
                    >
                      <Building2 className="w-4 h-4" />
                      <span>{t('ai_mgmt.route_to_hei')}</span>
                    </button>
                  )}

                  <button
                    onClick={() => onSelectProblem(prob)}
                    className="w-full inline-flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-stone-600 hover:text-stone-900 py-2 border border-transparent hover:border-stone-300 cursor-pointer"
                  >
                    <span>{t('ai_mgmt.inspect_dossier')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredProblems.length === 0 && (
          <div className="col-span-full py-12 bg-white border border-stone-300 text-center p-8">
            <p className="font-editorial-serif italic text-base text-stone-600">{t('ai_mgmt.no_challenges')}</p>
          </div>
        )}
      </div>

      {/* Route to University Assignment Modal */}
      {assigningProblemId && currentProblemForAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-sm">
          <div className="bg-white border border-stone-300 max-w-lg w-full p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200 mb-6">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-stone-900" />
                <h3 className="font-editorial-serif italic font-bold text-xl text-stone-900">{t('ai_mgmt.route_title')}</h3>
              </div>
              <button
                onClick={() => setAssigningProblemId(null)}
                className="text-stone-400 hover:text-stone-900 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mb-6">
              <div className="text-[10px] uppercase font-bold tracking-wider text-stone-500 mb-1">{t('ai_mgmt.target_challenge')}</div>
              <div className="text-base font-bold text-stone-900 leading-snug">{currentProblemForAssign.title}</div>
              <div className="text-xs text-stone-600 font-serif italic mt-1">
                {currentProblemForAssign.district} • {t('domain.' + (currentProblemForAssign.domain || 'general'))} • {t('ai_mgmt.priority')} {currentProblemForAssign.aiAnalysis?.priorityScore}/100
              </div>
            </div>

            {/* AI Recommendation Box */}
            {currentProblemForAssign.aiAnalysis?.matchedHeis?.[0] && (
              <div className="bg-[#FAF7F2] border border-[#BC5434] p-4 mb-6 text-xs text-stone-900">
                <div className="font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5 mb-1.5 text-[#BC5434]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t('ai_mgmt.recommended_match')}</span>
                </div>
                <div className="font-bold text-stone-900 text-sm">
                  {currentProblemForAssign.aiAnalysis.matchedHeis[0].universityName} ({currentProblemForAssign.aiAnalysis.matchedHeis[0].matchScore}% {t('ai_mgmt.match_suffix')})
                </div>
                <p className="text-[11px] text-stone-600 font-serif italic mt-1.5 leading-relaxed">
                  {currentProblemForAssign.aiAnalysis.matchedHeis[0].reason}
                </p>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-700 mb-1.5">
                  {t('ai_mgmt.select_hei')} <span className="text-[#BC5434]">*</span>
                </label>
                <select
                  id="select-assign-hei"
                  value={selectedHeiId}
                  onChange={(e) => {
                    const uId = e.target.value;
                    setSelectedHeiId(uId);
                    const foundU = universities.find((u) => u.id === uId);
                    if (foundU && foundU.departments.length > 0) {
                      setSelectedDept(foundU.departments[0]);
                    }
                  }}
                  className="w-full text-xs px-3 py-2.5 border border-stone-300 bg-white focus:outline-none focus:border-[#BC5434] text-stone-900"
                >
                  {universities.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-700 mb-1.5">
                  {t('ai_mgmt.select_department')} <span className="text-[#BC5434]">*</span>
                </label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 border border-stone-300 bg-white focus:outline-none focus:border-[#BC5434] text-stone-900"
                >
                  {currentSelectedHei?.departments?.map((dept, i) => (
                    <option key={i} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {currentSelectedHei && (
                <div className="text-xs p-3 bg-stone-50 border border-stone-200 space-y-1.5 text-stone-600 font-serif italic">
                  <div>
                    <strong className="not-italic text-stone-900 text-[11px]">{t('ai_mgmt.incubation_center')}</strong> {currentSelectedHei.incubationCenter}
                  </div>
                  <div>
                    <strong className="not-italic text-stone-900 text-[11px]">{t('ai_mgmt.available_mentors')}</strong> {currentSelectedHei.facultyMentors?.map((m) => m.name).join(', ') || t('ai_mgmt.none')}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setAssigningProblemId(null)}
                className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-stone-600 hover:text-stone-900 cursor-pointer"
              >
                {t('ai_mgmt.cancel')}
              </button>
              <button
                type="button"
                id="btn-confirm-route-hei"
                onClick={handleConfirmAssignment}
                disabled={isSubmittingAssign}
                className="inline-flex items-center gap-2 bg-[#1A1A1A] hover:bg-black text-white font-bold uppercase tracking-widest text-[11px] px-6 py-2.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmittingAssign ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{t('ai_mgmt.dispatch')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
