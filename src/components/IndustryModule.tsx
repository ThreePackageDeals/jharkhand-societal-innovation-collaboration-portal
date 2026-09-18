import React, { useState } from 'react';
import {
  Briefcase,
  IndianRupee,
  Building2,
  CheckCircle2,
  Users,
  Award,
  Sparkles,
  ArrowRight,
  Send,
  Loader2,
  ShieldCheck,
  Target,
  FileCheck,
} from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { IndustryPartner, SolutionProposal, ProblemStatement } from '../types';

interface IndustryModuleProps {
  industryPartners: IndustryPartner[];
  proposals: SolutionProposal[];
  problems: ProblemStatement[];
  onPledgeFunding: (proposalId: string, partnerId: string, amount: number, mentorName?: string, pilotSite?: string) => Promise<void>;
  onSelectProblem: (problem: ProblemStatement) => void;
}

export const IndustryModule: React.FC<IndustryModuleProps> = ({
  industryPartners,
  proposals,
  problems,
  onPledgeFunding,
  onSelectProblem,
}) => {
  const { t } = useLanguage();
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(industryPartners[0]?.id || 'ind-tata-steel');
  const [activeTab, setActiveTab] = useState<'proposals' | 'partners' | 'csr-tracker'>('proposals');

  // Pledge Modal State
  const [pledgingProposal, setPledgingProposal] = useState<SolutionProposal | null>(null);
  const [pledgeAmountLakhs, setPledgeAmountLakhs] = useState<number>(3.5);
  const [mentorName, setMentorName] = useState<string>('Er. Amitabh Sharma (Sr. Principal Technologist)');
  const [pilotSite, setPilotSite] = useState<string>('Potka Block Community Center & Tata Steel Rural Dev Society');
  const [isSubmittingPledge, setIsSubmittingPledge] = useState(false);

  const currentPartner = industryPartners.find((p) => p.id === selectedPartnerId) || industryPartners[0];

  if (!currentPartner) {
    if (industryPartners.length === 0) {
      return (
        <div className="flex items-center justify-center py-20 text-stone-500 font-serif italic">
          {t('ind.no_partners')}
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center py-20 text-stone-500 font-serif italic">
        {t('ind_loading')}
      </div>
    );
  }

  // Total funds pledged across Jharkhand
  const totalPledgedLakhs = industryPartners.reduce((acc, p) => acc + (p.csrBudgetCommitted || 0), 0);

  const handleOpenPledge = (proposal: SolutionProposal) => {
    setPledgingProposal(proposal);
    const requiredLakhs = proposal.budgetBreakdown.totalAmount / 100000;
    setPledgeAmountLakhs(Number(requiredLakhs.toFixed(1)));
  };

  const handleConfirmPledge = async () => {
    if (!pledgingProposal) return;
    setIsSubmittingPledge(true);
    try {
      await onPledgeFunding(
        pledgingProposal.id,
        currentPartner.id,
        pledgeAmountLakhs * 100000,
        mentorName,
        pilotSite
      );
      setPledgingProposal(null);
      alert(t('ind.pledge_success', pledgeAmountLakhs.toString(), currentPartner.name));
    } catch (err) {
      console.error(err);
      alert(t('ind.pledge_error'));
    } finally {
      setIsSubmittingPledge(false);
    }
  };

  return (
    <div id="industry-csr-hub" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#1A1A1A] text-stone-100 p-8 border border-stone-800 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="editorial-meta">{t('ind_csr_title')}</span>
              <span className="text-stone-600">•</span>
              <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">{t('ind_innovation_exchange')}</span>
            </div>
            <h2 className="font-editorial-serif italic text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {t('ind_industry_portal')}
            </h2>
            <p className="text-xs text-stone-400 font-serif italic max-w-2xl mt-2 leading-relaxed">
              {t('ind_industry_desc')}
            </p>
          </div>

          <div className="bg-[#FAF7F2] border border-[#BC5434] p-4 text-center md:text-right min-w-[200px]">
            <div className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">{t('ind_total_pledged')}</div>
            <div className="font-editorial-serif text-3xl font-light text-[#BC5434] mt-1">₹{totalPledgedLakhs.toFixed(1)} {t('ind.lakhs_short')}</div>
            <div className="text-[10px] text-stone-500 font-serif italic mt-1">{t('ind_active_enablers', industryPartners.length.toString())}</div>
          </div>
        </div>
      </div>

      {/* Corporate Identity Selector */}
      <div className="bg-[#FAF7F2] p-4 border border-stone-300 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600">{t('ind_simulating_partner')}</span>
          <select
            id="select-industry-partner"
            value={selectedPartnerId}
            onChange={(e) => setSelectedPartnerId(e.target.value)}
            className="text-xs font-bold px-3 py-2 border border-stone-300 bg-white text-stone-900 focus:outline-none focus:border-[#BC5434]"
          >
            {industryPartners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.type})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4 text-xs font-serif italic text-stone-600">
          <div>
            {t('ind.pledged_by', currentPartner.name)} <strong className="font-bold text-[#BC5434] not-italic">₹{currentPartner.csrBudgetCommitted} {t('ind.lakhs_short')}</strong>
          </div>
          <div className="hidden sm:block text-stone-400">•</div>
          <div className="hidden sm:block">
            {t('ind.focus_label')} <strong className="font-bold text-stone-900 not-italic">{currentPartner.focusDomains.slice(0, 2).join(', ')}</strong>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-stone-300 space-x-6 text-[11px] font-bold uppercase tracking-widest text-stone-500 overflow-x-auto">
        <button
          onClick={() => setActiveTab('proposals')}
          className={`pb-3 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
            activeTab === 'proposals'
              ? 'border-b-2 border-[#BC5434] text-stone-900'
              : 'hover:text-stone-900 border-b-2 border-transparent'
          }`}
        >
          <span>{t('ind_tab_proposals')}</span>
          <span className="px-1.5 py-0.5 bg-[#FAF7F2] text-stone-900 text-[10px] border border-stone-300">
            {proposals.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('partners')}
          className={`pb-3 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
            activeTab === 'partners'
              ? 'border-b-2 border-[#BC5434] text-stone-900'
              : 'hover:text-stone-900 border-b-2 border-transparent'
          }`}
        >
          <span>{t('ind_tab_directory')}</span>
          <span className="px-1.5 py-0.5 bg-[#FAF7F2] text-stone-900 text-[10px] border border-stone-300">
            {industryPartners.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('csr-tracker')}
          className={`pb-3 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
            activeTab === 'csr-tracker'
              ? 'border-b-2 border-[#BC5434] text-stone-900'
              : 'hover:text-stone-900 border-b-2 border-transparent'
          }`}
        >
          <span>{t('ind_tab_tracker')}</span>
        </button>
      </div>

      {/* Tab 1: Proposals seeking funding */}
      {activeTab === 'proposals' && (
        <div className="grid grid-cols-1 gap-4 mt-6">
          {proposals.map((prop) => {
            const hasSponsor = Boolean(prop.industryPartnerName);
            const totalBudgetLakhs = (prop.budgetBreakdown.totalAmount / 100000).toFixed(2);
            const linkedProblem = problems.find((p) => p.id === prop.problemId);

            return (
              <div
                key={prop.id}
                className="bg-white border border-stone-300 p-6 hover:border-stone-500 transition-all flex flex-col md:flex-row items-start justify-between gap-6"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#1A1A1A] text-white">
                      {t('ind.hei_label')} {prop.heiName}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#FAF7F2] text-stone-900 border border-stone-300">
                      {t('ind.faculty_label')} {prop.facultyMentor.name}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-stone-200 text-stone-800">
                      {t('ind.credits_label')} {prop.nepExperientialCredits}
                    </span>
                    {hasSponsor ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-stone-100 text-stone-800 border border-stone-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-[#BC5434]" />
                        <span>{t('ind_sponsored_by', prop.industryPartnerName)}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#FAF7F2] text-[#BC5434] border border-stone-300">
                        {t('ind_open_csr')}
                      </span>
                    )}
                  </div>

                  <h3 className="font-editorial-serif text-2xl font-bold text-stone-900 leading-snug">{prop.projectTitle}</h3>
                  <div className="text-xs text-stone-500 font-serif italic">
                    {t('ind.addressing_label')} <span className="text-stone-900 font-bold not-italic uppercase tracking-wider text-[10px]">{prop.problemTitle}</span>
                  </div>

                  <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed font-sans">{prop.abstract}</p>

                  <div className="p-4 bg-[#FAF7F2] border border-stone-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs mt-2">
                    <div>
                      <span className="text-stone-500 block text-[10px] uppercase font-bold tracking-wider mb-1">{t('ind.budget_req_label')}</span>
                      <strong className="text-stone-900 font-bold">₹{totalBudgetLakhs} {t('ind.lakhs_short')}</strong>
                    </div>
                    <div>
                      <span className="text-stone-500 block text-[10px] uppercase font-bold tracking-wider mb-1">{t('ind.team_label')}</span>
                      <strong className="text-stone-900">{prop.studentTeam.membersCount} {t('ind.members_label')}</strong>
                    </div>
                    <div>
                      <span className="text-stone-500 block text-[10px] uppercase font-bold tracking-wider mb-1">{t('ind.ip_label')}</span>
                      <strong className="text-stone-900">{prop.ipPotential}</strong>
                    </div>
                    <div>
                      <span className="text-stone-500 block text-[10px] uppercase font-bold tracking-wider mb-1">{t('ind.milestones_label')}</span>
                      <strong className="text-[#BC5434]">
                        {prop.milestones.filter((m) => m.status === 'completed').length}/{prop.milestones.length} {t('ind.milestones_done')}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 shrink-0 md:min-w-[220px] w-full md:w-auto mt-2 md:mt-0">
                  {!hasSponsor ? (
                    <button
                      id={`btn-pledge-csr-${prop.id}`}
                      onClick={() => handleOpenPledge(prop)}
                      className="w-full inline-flex items-center justify-center gap-2 bg-[#1A1A1A] hover:bg-black text-white text-[11px] font-bold uppercase tracking-widest px-4 py-3.5 transition-colors cursor-pointer shadow-sm"
                    >
                      <IndianRupee className="w-3.5 h-3.5" />
                      <span>{t('ind_pledge_grant')}</span>
                    </button>
                  ) : (
                    <div className="p-4 bg-[#FAF7F2] border border-[#BC5434] text-stone-900 text-center">
                      <div className="font-bold uppercase tracking-widest text-[11px]">{t('ind.active_co_dev')}</div>
                      <div className="text-[10px] text-stone-600 font-serif italic mt-1.5">{t('ind.csr_mou_active')}</div>
                    </div>
                  )}

                  {linkedProblem && (
                    <button
                      onClick={() => onSelectProblem(linkedProblem)}
                      className="w-full text-[11px] font-bold uppercase tracking-widest text-stone-600 hover:text-stone-900 py-2 border border-transparent hover:border-stone-300 cursor-pointer"
                    >
                      {t('ind_view_problem')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Partners Directory */}
      {activeTab === 'partners' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {industryPartners.map((partner) => (
            <div
              key={partner.id}
              className="bg-white border border-stone-300 p-6 flex flex-col justify-between gap-5"
            >
              <div>
                <div className="flex items-center justify-between mb-3 border-b border-stone-200 pb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 bg-[#FAF7F2] text-stone-900 border border-stone-300">
                    {partner.type}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#BC5434]">
                    {t('ind.pledged_label')} ₹{partner.csrBudgetCommitted} {t('ind.lakhs_short')}
                  </span>
                </div>
                <h4 className="font-editorial-serif text-2xl font-bold text-stone-900 mb-1">{partner.name}</h4>
                <div className="text-xs text-stone-500 font-serif italic mb-4">{t('ind.hq')} {partner.headquarters}</div>

                <div className="space-y-3 text-xs text-stone-600">
                  <div className="flex flex-col">
                    <strong className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-0.5">{t('ind.thematic_focus')}</strong>
                    <span className="font-serif italic">{partner.focusDomains.join(' • ')}</span>
                  </div>
                  <div className="flex flex-col">
                    <strong className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-0.5">{t('ind.technical_mentors')}</strong>
                    <span className="font-serif italic">{partner.availableMentors} {t('ind.experts_available')}</span>
                  </div>
                  <div className="flex flex-col">
                    <strong className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-0.5">{t('ind.pilot_testbeds')}</strong>
                    <span className="font-serif italic">{partner.pilotTestSites.join(' • ')}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-200 flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-stone-500">
                <span>{partner.contactPerson}</span>
                <span className="font-mono text-stone-400 lowercase">{partner.contactEmail}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: CSR Tracker */}
      {activeTab === 'csr-tracker' && (
        <div className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-stone-300 p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-[#FAF7F2] border border-stone-200 text-[#BC5434] flex items-center justify-center shrink-0">
                <IndianRupee className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-stone-500 mb-1">{t('ind.total_csr_disbursed')}</div>
                <div className="font-editorial-serif text-3xl font-light text-stone-900">₹{totalPledgedLakhs.toFixed(1)} L</div>
              </div>
            </div>
            <div className="bg-white border border-stone-300 p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-[#FAF7F2] border border-stone-200 text-stone-900 flex items-center justify-center shrink-0">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-stone-500 mb-1">{t('ind.active_sdg_pilots')}</div>
                <div className="font-editorial-serif text-3xl font-light text-stone-900">{proposals.filter(p => p.industryPartnerId).length}</div>
              </div>
            </div>
            <div className="bg-white border border-stone-300 p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-[#FAF7F2] border border-stone-200 text-stone-900 flex items-center justify-center shrink-0">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-stone-500 mb-1">{t('ind.mca_compliance')}</div>
                <div className="font-editorial-serif text-3xl font-light text-stone-900">100%</div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-stone-300 p-6">
            <h3 className="font-editorial-serif text-xl font-bold text-stone-900 mb-6 flex items-center gap-2 pb-4 border-b border-stone-200">
              <ShieldCheck className="w-5 h-5 text-stone-400" /> {t('ind_corporate_registry')}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-stone-300 text-[10px] uppercase font-bold tracking-wider text-stone-500">
                    <th className="py-3 px-4 font-bold">{t('ind.col_partner')}</th>
                    <th className="py-3 px-4 font-bold">{t('ind.col_project')}</th>
                    <th className="py-3 px-4 font-bold">{t('ind.col_hei')}</th>
                    <th className="py-3 px-4 font-bold">{t('ind.col_grant')}</th>
                    <th className="py-3 px-4 font-bold">{t('ind.col_status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 font-sans">
                  {proposals.filter(p => p.industryPartnerId).map(prop => (
                    <tr key={prop.id} className="hover:bg-stone-50 transition-colors">
                      <td className="py-4 px-4 font-bold text-stone-900">{prop.industryPartnerName}</td>
                      <td className="py-4 px-4 text-stone-700 max-w-xs truncate" title={prop.projectTitle}>{prop.projectTitle}</td>
                      <td className="py-4 px-4 text-stone-600">{prop.heiName}</td>
                      <td className="py-4 px-4 font-bold text-[#BC5434]">₹{(prop.budgetBreakdown.totalAmount / 100000).toFixed(1)} L</td>
                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 bg-[#1A1A1A] text-white text-[10px] font-bold uppercase tracking-wider">
                          {t('ind.status_active_pilot')}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {proposals.filter(p => p.industryPartnerId).length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-stone-500 font-serif italic text-sm">{t('ind.no_sponsorships')}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Pledge CSR Modal */}
      {pledgingProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm">
          <div className="bg-white border border-stone-300 max-w-lg w-full p-8 text-stone-800 animate-in fade-in zoom-in-95 duration-200 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200 mb-6">
              <div className="flex items-center gap-3">
                <Briefcase className="w-5 h-5 text-stone-400" />
                <h3 className="font-editorial-serif text-xl font-bold text-stone-900">{t('ind_pledge_modal_title')}</h3>
              </div>
              <button
                onClick={() => setPledgingProposal(null)}
                className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="mb-6">
              <div className="text-[10px] uppercase font-bold tracking-wider text-stone-500 mb-1.5">{t('ind_pledge_modal_title')}</div>
              <div className="font-editorial-serif text-2xl font-bold text-stone-900 leading-snug">{pledgingProposal.projectTitle}</div>
              <div className="text-xs text-stone-600 font-serif italic mt-2">
                {t('ind.hei_context')} {pledgingProposal.heiName} <span className="mx-1">•</span> {t('ind.lead_context')} {pledgingProposal.facultyMentor.name}
              </div>
            </div>

            <div className="space-y-5 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-700 mb-1.5">
                  Pledging Corporate Partner
                </label>
                <input
                  type="text"
                  disabled
                  value={`${currentPartner.name} (${currentPartner.type})`}
                  className="w-full px-3 py-2.5 border border-stone-300 bg-[#FAF7F2] text-stone-700 font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-700 mb-1.5 flex justify-between">
                  <span>{t('ind_pledge_grant_label')}</span>
                  <span className="text-[#BC5434] font-bold">₹{pledgeAmountLakhs} L</span>
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="15.0"
                  step="0.5"
                  value={pledgeAmountLakhs}
                  onChange={(e) => setPledgeAmountLakhs(parseFloat(e.target.value))}
                  className="w-full accent-[#BC5434]"
                />
                <div className="flex justify-between text-[10px] font-serif italic text-stone-400 mt-2">
                  <span>{t('ind.pledge_seed')}</span>
                  <span>{t('ind.pledge_prototype')}</span>
                  <span>{t('ind.pledge_commercial')}</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-700 mb-1.5">
                  {t('ind_mentor_label')}
                </label>
                <input
                  type="text"
                  value={mentorName}
                  onChange={(e) => setMentorName(e.target.value)}
                  placeholder={t('ind.mentor_placeholder')}
                  className="w-full px-3 py-2.5 border border-stone-300 bg-white focus:outline-none focus:border-[#BC5434]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-700 mb-1.5">
                  {t('ind_site_label')}
                </label>
                <input
                  type="text"
                  value={pilotSite}
                  onChange={(e) => setPilotSite(e.target.value)}
                  placeholder={t('ind.site_placeholder')}
                  className="w-full px-3 py-2.5 border border-stone-300 bg-white focus:outline-none focus:border-[#BC5434]"
                />
              </div>

              <div className="p-4 bg-[#FAF7F2] border border-stone-200 text-stone-600 text-xs font-serif italic leading-relaxed">
                <strong className="not-italic text-stone-900">{t('ind_compliance_note').split(':')[0]}:</strong> {t('ind_compliance_note').split(':')[1]}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8 pt-6 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setPledgingProposal(null)}
                className="px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-stone-600 hover:text-stone-900 cursor-pointer text-center"
              >
                {t('ind_cancel')}
              </button>
              <button
                type="button"
                id="btn-confirm-csr-pledge"
                onClick={handleConfirmPledge}
                disabled={isSubmittingPledge}
                className="inline-flex items-center justify-center gap-2 bg-[#1A1A1A] hover:bg-black text-white font-bold uppercase tracking-widest text-[11px] px-8 py-3 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmittingPledge ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{t('ind_confirm_pledge')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
