import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Filter,
  MapPin,
  ThumbsUp,
  MessageSquare,
  Sparkles,
  Building2,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { ProblemStatement, District, DomainTheme } from '../types';
import { JHARKHAND_DISTRICTS, THEMATIC_DOMAINS } from '../data/jharkhandData';
import { useLanguage } from '../LanguageContext';

interface CitizenModuleProps {
  problems: ProblemStatement[];
  onOpenSubmitModal: () => void;
  onSelectProblem: (problem: ProblemStatement) => void;
  onUpvote: (problemId: string) => Promise<void>;
  trackingFilterCode?: string;
  onClearTrackingFilter?: () => void;
  onSearchTrackingCode: (code: string) => void;
  mapFilter?: { type: 'district' | 'university' | 'industry'; value: string } | null;
  onClearMapFilter?: () => void;
}

export const CitizenModule: React.FC<CitizenModuleProps> = ({
  problems,
  onOpenSubmitModal,
  onSelectProblem,
  onUpvote,
  trackingFilterCode,
  onClearTrackingFilter,
  onSearchTrackingCode,
  mapFilter,
  onClearMapFilter,
}) => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [trackingQuery, setTrackingQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Sync mapFilter with internal state
  useEffect(() => {
    if (mapFilter?.type === 'district') {
      setSelectedDistrict(mapFilter.value);
    } else {
      // If we're coming from a non-district map filter,
      // we don't want to overwrite the district filter unless it's 'all'
      // but for simplicity, let's just keep the current internal state.
    }
  }, [mapFilter]);

  // Filter problems
  const filteredProblems = problems.filter((p) => {
    if (trackingFilterCode && p.trackingCode.toLowerCase() !== trackingFilterCode.toLowerCase()) {
      return false;
    }

    // Apply mapFilter if present
    if (mapFilter) {
      if (mapFilter.type === 'district' && p.district !== mapFilter.value) return false;
      if (mapFilter.type === 'university' && p.assignedHeiId !== mapFilter.value) return false;
      if (mapFilter.type === 'industry' && p.partnerIndustryId !== mapFilter.value) return false;
    }

    if (selectedDistrict !== 'all' && p.district !== selectedDistrict) return false;
    if (selectedDomain !== 'all' && p.domain !== selectedDomain) return false;
    if (selectedStatus !== 'all' && p.status !== selectedStatus) return false;
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

  return (
    <div id="citizen-challenges-view" className="space-y-6">
      {/* Banner: Editorial Masthead Style */}
      <div className="bg-[#1A1A1A] text-stone-100 p-8 border border-stone-800 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="editorial-meta">{t('citizen_registry_title')}</span>
              <span className="text-stone-600">•</span>
              <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">{t('citizen_registry_index')}</span>
            </div>
            <h2 className="font-editorial-serif italic text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {t('citizen_registry_header')}
            </h2>
            <p className="text-xs text-stone-400 font-serif italic max-w-2xl mt-2 leading-relaxed">
              {t('citizen_registry_desc')}
            </p>
          </div>

          <button
            id="btn-open-submit-modal-hero"
            onClick={onOpenSubmitModal}
            className="inline-flex items-center justify-center gap-2 bg-[#BC5434] hover:bg-[#A3452B] text-white text-xs font-bold uppercase tracking-widest px-6 py-3.5 transition-all cursor-pointer whitespace-nowrap active:scale-95 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{t('citizen_submit_btn')}</span>
          </button>
        </div>
      </div>

      {/* Tracking Filter Pill if active */}
      {(trackingFilterCode || mapFilter) && (
        <div className="bg-[#FAF7F2] border border-stone-300 px-4 py-3 flex items-center justify-between text-xs text-stone-900">
          <div className="flex items-center gap-4">
            {trackingFilterCode && (
              <div className="flex items-center gap-2">
                <span className="editorial-meta !mb-0">{t('citizen_tracking_label')}</span>
                <span className="font-mono font-bold text-stone-900 bg-white px-2 py-0.5 border border-stone-400">
                  {trackingFilterCode}
                </span>
              </div>
            )}
            {mapFilter && (
              <div className="flex items-center gap-2">
                <span className="editorial-meta !mb-0">{t('citizen_filter_label')}</span>
                <span className="font-bold text-stone-900 bg-white px-2 py-0.5 border border-stone-400 capitalize">
                  {mapFilter.type} ({mapFilter.value})
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {onClearTrackingFilter && trackingFilterCode && (
              <button
                onClick={onClearTrackingFilter}
                className="text-xs font-bold uppercase tracking-wider text-[#BC5434] hover:text-[#A3452B] underline cursor-pointer"
              >
                {t('citizen_clear_tracking')}
              </button>
            )}
            {onClearMapFilter && mapFilter && (
              <button
                onClick={onClearMapFilter}
                className="text-xs font-bold uppercase tracking-wider text-[#BC5434] hover:text-[#A3452B] underline cursor-pointer"
              >
                {t('citizen_clear_map')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filter and Search Bar: Editorial Palette */}
      <div className="bg-[#FAF7F2] p-4 border border-stone-300 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search Field */}
          <div className="relative min-w-[220px] flex-1 max-w-xs">
            <input
              type="text"
              placeholder={t('citizen_search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 border border-stone-300 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#BC5434]"
            />
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
          </div>

          {/* Tracking ID Search Field */}
          <div className="relative min-w-[220px] flex-1 max-w-xs">
            <input
              type="text"
              placeholder={t('citizen_tracking_placeholder')}
              value={trackingQuery}
              onChange={(e) => setTrackingQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onSearchTrackingCode(trackingQuery.trim());
                  setTrackingQuery('');
                }
              }}
              className="w-full text-xs pl-8 pr-3 py-2 border border-stone-300 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#BC5434]"
            />
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
          </div>

          {/* District */}
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="text-xs px-3 py-2 border border-stone-300 bg-white text-stone-900 focus:outline-none focus:border-[#BC5434]"
          >
            <option value="all">{t('citizen_all_districts')}</option>
            {JHARKHAND_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Domain */}
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="text-xs px-3 py-2 border border-stone-300 bg-white text-stone-900 focus:outline-none focus:border-[#BC5434]"
          >
            <option value="all">{t('citizen_all_domains')}</option>
            {THEMATIC_DOMAINS.map((td) => (
              <option key={td.key} value={td.key}>
                {td.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="text-xs px-3 py-2 border border-stone-300 bg-white text-stone-900 focus:outline-none focus:border-[#BC5434]"
        >
          <option value="all">{t('citizen_all_statuses')}</option>
          <option value="submitted">{t('citizen_status_submitted')}</option>
          <option value="ai_evaluated">{t('citizen_status_ai_evaluated')}</option>
          <option value="assigned_to_hei">{t('citizen_status_assigned')}</option>
          <option value="prototype_ready">{t('citizen_status_prototype')}</option>
          <option value="field_testing">{t('citizen_status_testing')}</option>
          <option value="deployed">{t('citizen_status_deployed')}</option>
        </select>
      </div>

      <div className="text-xs font-serif italic text-stone-600 text-right">
        {t('citizen_showing_count').replace('%', filteredProblems.length.toString())}
      </div>

      {/* Problem Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProblems.map((prob) => {
          const photoUrl =
            prob.mediaUrls?.[0] ||
            '/placeholder-image.jpg';

          return (
            <div
              key={prob.id}
              className="bg-white border border-stone-300 hover:border-stone-500 transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Photo Evidence Preview */}
                <div className="h-44 relative bg-stone-100 overflow-hidden border-b border-stone-200">
                  <img
                    src={photoUrl}
                    alt={prob.title}
                    className="w-full h-full object-cover grayscale-[15%] group-hover:grayscale-0 transition-all duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-[#1A1A1A] text-white">
                      {prob.trackingCode}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#FAF7F2] text-stone-900 border border-stone-300">
                      {prob.district}
                    </span>
                  </div>

                  <div className="absolute top-2 right-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 shadow-xs ${
                        prob.urgency === 'Critical'
                          ? 'bg-[#BC5434] text-white'
                          : prob.urgency === 'High'
                          ? 'bg-stone-900 text-white'
                          : 'bg-stone-200 text-stone-800'
                      }`}
                    >
                      {t('urgency.' + prob.urgency)}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-2.5">
                  <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-stone-500">
                    <span className="text-[#BC5434]">
                      {t('domain.' + (prob.domain || 'general'))}
                    </span>
                    <span>{prob.blockOrPanchayat || ''}</span>
                  </div>

                  <h3
                    onClick={() => onSelectProblem(prob)}
                    className="font-editorial-serif text-lg font-bold text-stone-900 line-clamp-2 hover:text-[#BC5434] cursor-pointer transition-colors leading-snug"
                  >
                    {prob.title}
                  </h3>

                  <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed font-sans">{prob.description}</p>

                  {/* AI Priority & Assigned HEI */}
                  <div className="pt-3 border-t border-stone-200 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500 text-[11px] flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#BC5434]" />
                        <span>{t('citizen_ai_score')}</span>
                      </span>
                      <span className="font-editorial-serif font-bold text-sm text-stone-900">
                        {prob.aiAnalysis?.priorityScore || 85}/100
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-stone-500 text-[11px] flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-stone-500" />
                        <span>{t('citizen_assigned_hei')}</span>
                      </span>
                      <span className="font-semibold text-stone-800 text-[11px] truncate max-w-[150px]">
                        {prob.assignedHeiName || t('citizen_pending_triage')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-3 bg-[#FAF7F2] border-t border-stone-200 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => onUpvote(prob.id)}
                  className="inline-flex items-center gap-1.5 text-stone-700 hover:text-[#BC5434] font-bold uppercase tracking-wider text-[10px] cursor-pointer transition-colors"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{prob.upvotesCount} {t('citizen_endorse')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectProblem(prob)}
                  className="inline-flex items-center gap-1 text-[#BC5434] hover:text-stone-900 font-bold uppercase tracking-widest text-[11px] cursor-pointer transition-colors"
                >
                  <span>{t('citizen_full_details')}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredProblems.length === 0 && (
          <div className="col-span-full py-16 bg-white border border-stone-300 text-center p-8">
            <p className="font-editorial-serif italic text-base text-stone-600 mb-3">{t('citizen_no_results')}</p>
            <button
              onClick={onOpenSubmitModal}
              className="inline-flex items-center gap-2 bg-[#BC5434] hover:bg-[#A3452B] text-white text-xs font-bold uppercase tracking-widest px-5 py-2.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t('citizen_submit_new')}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
