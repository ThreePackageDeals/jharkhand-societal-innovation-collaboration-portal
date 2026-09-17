import React, { useState } from 'react';
import {
  BarChart3,
  MapPin,
  TrendingUp,
  Award,
  Users,
  GraduationCap,
  IndianRupee,
  CheckCircle2,
  Layers,
  Sparkles,
  Droplets,
  Sprout,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { AnalyticsSummary, University, ProblemStatement } from '../types';
import { THEMATIC_DOMAINS } from '../data/jharkhandData';
import { JharkhandMap } from './JharkhandMap';

interface AnalyticsDashboardProps {
  analytics: AnalyticsSummary;
  universities: University[];
  problems: ProblemStatement[];
  onSelectDistrictFilter?: (district: string) => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  analytics,
  universities,
  problems,
  onSelectDistrictFilter,
}) => {
  const { t } = useLanguage();
  const [selectedSortBy, setSelectedSortBy] = useState<'challenges' | 'active'>('challenges');

  // Sorted districts
  const sortedDistricts = React.useMemo(() => {
    const stats = analytics?.districtStats || [];
    return [...stats].sort((a, b) => {
      if (selectedSortBy === 'challenges') {
        return (b?.challengesCount || 0) - (a?.challengesCount || 0);
      }
      return (b?.activeProjects || 0) - (a?.activeProjects || 0);
    });
  }, [analytics?.districtStats, selectedSortBy]);

  // Solved challenges
  const solvedChallenges = React.useMemo(() => {
    return problems.filter(p => p.status === 'closed');
  }, [problems]);

  // Calculate maximum challenges for proportional bars
  const maxDistrictChallenges = Math.max(...(analytics?.districtStats || []).map((d) => d?.challengesCount || 0), 1);
  const maxDomainCount = Math.max(...(analytics?.domainStats || []).map((d) => d?.count || 0), 1);

  return (
    <div id="visual-analytics-module" className="space-y-6">
      {/* Top Banner: Editorial Masthead */}
      <div className="bg-[#1A1A1A] text-stone-100 p-8 border border-stone-800 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="editorial-meta">{t('ana_metrics_title')}</span>
              <span className="text-stone-600">•</span>
              <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">{t('ana_impact_ledger')}</span>
            </div>
            <h2 className="font-editorial-serif italic text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {t('ana_performance_index')}
            </h2>
            <p className="text-xs text-stone-400 font-serif italic max-w-2xl mt-2 leading-relaxed">
              {t('ana_performance_desc')}
            </p>
          </div>

          <div className="bg-stone-900 border border-stone-800 p-4 text-center min-w-[200px]">
            <span className="editorial-meta !text-[10px] !mb-1 block">{t('ana_lives_impacted')}</span>
            <span className="font-editorial-serif text-3xl font-bold text-white tracking-tight">{t('ana_lives_impacted_value')}</span>
            <span className="text-[10px] text-stone-400 block font-serif italic mt-1">{t('ana.districts_covered', '86')}</span>
          </div>
        </div>
      </div>

      {/* Primary KPI Cards Grid: Editorial Hairline Top Border */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 border border-stone-300 border-t-2 border-t-stone-900 shadow-none">
          <div className="editorial-meta !text-[10px] !mb-1">{t('ana_challenges_logged')}</div>
          <div className="font-editorial-serif text-3xl font-light text-stone-900">{analytics?.totalChallengesReceived ?? 0}</div>
          <div className="text-[10px] text-stone-500 font-serif italic mt-1">{t('ana.geotagged')}</div>
        </div>

        <div className="bg-white p-4 border border-stone-300 border-t-2 border-t-[#BC5434] shadow-none">
          <div className="editorial-meta !text-[10px] !mb-1">{t('ana_routed_heis')}</div>
          <div className="font-editorial-serif text-3xl font-light text-stone-900">{analytics?.totalAssignedToHEIs ?? 0}</div>
          <div className="text-[10px] text-stone-500 font-serif italic mt-1">{analytics?.facultyMentorsEngaged ?? 0} {t('ana.faculty_mentors')}</div>
        </div>

        <div className="bg-white p-4 border border-stone-300 border-t-2 border-t-stone-900 shadow-none">
          <div className="editorial-meta !text-[10px] !mb-1">{t('ana_active_prototypes')}</div>
          <div className="font-editorial-serif text-3xl font-light text-stone-900">{analytics?.activePrototypes ?? 0}</div>
          <div className="text-[10px] text-stone-500 font-serif italic mt-1">{t('ana.univ_labs')}</div>
        </div>

        <div className="bg-white p-4 border border-stone-300 border-t-2 border-t-[#BC5434] shadow-none">
          <div className="editorial-meta !text-[10px] !mb-1">{t('ana_field_pilots')}</div>
          <div className="font-editorial-serif text-3xl font-light text-stone-900">{analytics?.fieldPilotsDeployed ?? 0}</div>
          <div className="text-[10px] text-stone-500 font-serif italic mt-1">{t('ana.deployed_districts')}</div>
        </div>

        <div className="bg-white p-4 border border-stone-300 border-t-2 border-t-stone-900 shadow-none">
          <div className="editorial-meta !text-[10px] !mb-1">{t('ana_csr_pledged')}</div>
          <div className="font-editorial-serif text-3xl font-light text-stone-900">₹{(analytics?.totalFundingPledgedLakhs ?? 0).toFixed(0)}L</div>
          <div className="text-[10px] text-stone-500 font-serif italic mt-1">{t('ana.csr_grants')}</div>
        </div>

        <div className="bg-white p-4 border border-stone-300 border-t-2 border-t-[#BC5434] shadow-none">
          <div className="editorial-meta !text-[10px] !mb-1">{t('ana_students_nep')}</div>
          <div className="font-editorial-serif text-3xl font-light text-stone-900">{analytics?.studentsParticipating ?? 0}</div>
          <div className="text-[10px] text-stone-500 font-serif italic mt-1">{t('ana.experiential_credits')}</div>
        </div>
      </div>

      {/* Measurable Social Outcomes Section */}
      <div className="bg-white border border-stone-300 p-6 shadow-none">
        <h3 className="editorial-meta !text-xs !mb-4 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t('ana_outcomes_title')}</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-[#FAF7F2] border border-stone-300 text-xs">
            <div className="flex items-center gap-2 mb-1.5 text-stone-900 font-bold uppercase tracking-wider text-[11px]">
              <Droplets className="w-3.5 h-3.5 text-[#BC5434]" />
              <span>{t('ana_water_title')}</span>
            </div>
            <div className="font-editorial-serif text-xl font-bold text-stone-900">{t('ana.water_value')}</div>
            <p className="text-[11px] text-stone-600 font-serif italic mt-1.5 leading-relaxed">
              {t('ana.water_desc')}
            </p>
          </div>

          <div className="p-4 bg-[#FAF7F2] border border-stone-300 text-xs">
            <div className="flex items-center gap-2 mb-1.5 text-stone-900 font-bold uppercase tracking-wider text-[11px]">
              <Sprout className="w-3.5 h-3.5 text-[#BC5434]" />
              <span>{t('ana_agri_title')}</span>
            </div>
            <div className="font-editorial-serif text-xl font-bold text-stone-900">{t('ana.agri_value')}</div>
            <p className="text-[11px] text-stone-600 font-serif italic mt-1.5 leading-relaxed">
              {t('ana.agri_desc')}
            </p>
          </div>

          <div className="p-4 bg-[#FAF7F2] border border-stone-300 text-xs">
            <div className="flex items-center gap-2 mb-1.5 text-stone-900 font-bold uppercase tracking-wider text-[11px]">
              <Flame className="w-3.5 h-3.5 text-[#BC5434]" />
              <span>{t('ana_mine_title')}</span>
            </div>
            <div className="font-editorial-serif text-xl font-bold text-stone-900">{t('ana.mine_value')}</div>
            <p className="text-[11px] text-stone-600 font-serif italic mt-1.5 leading-relaxed">
              {t('ana.mine_desc')}
            </p>
          </div>

          <div className="p-4 bg-[#FAF7F2] border border-stone-300 text-xs">
            <div className="flex items-center gap-2 mb-1.5 text-stone-900 font-bold uppercase tracking-wider text-[11px]">
              <Award className="w-3.5 h-3.5 text-[#BC5434]" />
              <span>{t('ana_ip_title')}</span>
            </div>
            <div className="font-editorial-serif text-xl font-bold text-stone-900">{t('ana.ip_value')}</div>
            <p className="text-[11px] text-stone-600 font-serif italic mt-1.5 leading-relaxed">
              {t('ana.ip_desc')}
            </p>
          </div>
        </div>
      </div>

      {/* Dual Charts: Thematic Domains & Geographic Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Thematic Domain Distribution */}
        <div className="bg-white border border-stone-300 p-6 shadow-none flex flex-col justify-between lg:col-span-1">
          <div>
            <div className="flex items-center justify-between mb-5 border-b border-stone-200 pb-3">
              <h3 className="font-editorial-serif italic text-lg font-bold text-stone-900">
                {t('ana_domain_breakdown')}
              </h3>
            </div>

            <div className="space-y-4">
              {(analytics?.domainStats || []).map((ds) => {
                const domainDef = THEMATIC_DOMAINS.find((t) => t.key === ds.domain);
                const percent = Math.round(((ds?.count || 0) / maxDomainCount) * 100);

                return (
                  <div key={ds.domain} className="text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-stone-900">
                        {t('domain.' + (ds.domain || 'general'))}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-stone-600 font-mono text-[11px]">{ds.count} {t('ana.logged')}</span>
                        <span className="text-[10px] text-[#BC5434] bg-[#FAF7F2] border border-stone-300 px-2 py-0.5 font-bold uppercase">
                          {ds.solvedCount} {t('ana.solved')}
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-stone-100 h-2 overflow-hidden border border-stone-200">
                      <div
                        className="bg-stone-900 h-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Geographic Distribution: 24 Districts of Jharkhand with Map */}
        <div className="bg-white border border-stone-300 p-6 shadow-none flex flex-col justify-between lg:col-span-2">
          <div>
            <div className="flex items-center justify-between mb-5 border-b border-stone-200 pb-3">
              <div>
                <h3 className="font-editorial-serif italic text-lg font-bold text-stone-900">
                  {t('ana_geo_distribution')}
                </h3>
                <span className="text-[11px] text-stone-500 font-serif italic">{t('ana_geo_desc')}</span>
              </div>

              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="text-stone-400 uppercase tracking-wider text-[10px]">Sort:</span>
                <button
                  onClick={() => setSelectedSortBy('challenges')}
                  className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider cursor-pointer border ${
                    selectedSortBy === 'challenges' ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-700 border-stone-300'
                  }`}
                >
                  {t('ana_sort_challenges')}
                </button>
                <button
                  onClick={() => setSelectedSortBy('active')}
                  className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider cursor-pointer border ${
                    selectedSortBy === 'active' ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-700 border-stone-300'
                  }`}
                >
                  {t('ana_sort_projects')}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {/* District List */}
              <div className="w-full max-h-[500px] overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                {sortedDistricts.map((d, index) => {
                  const percent = Math.round(((d?.challengesCount || 0) / maxDistrictChallenges) * 100);
                  return (
                    <div
                      key={d?.district}
                      onClick={() => onSelectDistrictFilter && onSelectDistrictFilter(d?.district)}
                      className="p-3 bg-[#FAF7F2] hover:bg-stone-100 border border-stone-300 transition-colors cursor-pointer text-xs"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-stone-500 w-5">{index + 1}.</span>
                          <span className="font-bold text-stone-900">{d?.district}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-stone-700 font-mono text-[11px]">{d?.challengesCount} {t('ana.challenges')}</span>
                          <span className="text-[10px] px-2 py-0.5 border border-stone-400 bg-white text-stone-900 font-bold uppercase">
                            {d?.activeProjects} {t('ana.active')}
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-stone-200 h-1.5 overflow-hidden">
                        <div
                          className="bg-[#BC5434] h-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Solved Challenges Showcase */}
      <div className="bg-white border border-stone-300 p-6 shadow-none">
        <div className="mb-6">
          <h3 className="font-editorial-serif italic text-lg font-bold text-stone-900">
            {t('ana_solved_challenges_title')}
          </h3>
          <p className="text-[11px] text-stone-500 font-serif italic">
            {t('ana_solved_challenges_desc')}
          </p>
        </div>

        {solvedChallenges.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {solvedChallenges.map((p) => (
              <div key={p.id} className="p-4 border border-stone-200 bg-[#FAF7F2] text-xs flex flex-col justify-between group hover:border-stone-400 transition-colors">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono text-stone-500 uppercase tracking-tighter">
                      {p.trackingCode}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-800 border border-green-200 font-bold uppercase">
                      {t('ana.solved')}
                    </span>
                  </div>
                  <h4 className="font-bold text-stone-900 leading-snug mb-2 group-hover:text-[#BC5434] transition-colors">
                    {p.title}
                  </h4>
                  <div className="text-[11px] text-stone-600 font-serif italic mb-3">
                    {p.district} • {p.blockOrPanchayat}
                  </div>
                </div>
                <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
                  <span className="text-[10px] text-stone-500 uppercase font-bold">
                    {t('ana.solved_by')}
                  </span>
                  <span className="text-[11px] font-bold text-stone-900">
                    {p.assignedHeiName || 'Community Solution'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border border-dashed border-stone-300 text-stone-400 text-xs italic">
            {t('common.no_results')}
          </div>
        )}
      </div>

      {/* University Participation Leaderboard */}
      <div className="bg-white border border-stone-300 p-6 shadow-none">
        <h3 className="flex items-center justify-between mb-4 border-b border-stone-200 pb-3">
          <span className="font-editorial-serif italic text-lg font-bold text-stone-900">
            {t('ana_hei_leaderboard')}
          </span>
          <span className="editorial-meta !text-[10px] !mb-0">{t('ana_hei_rank')}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {universities.map((u, i) => (
            <div key={u.id} className="p-4 border border-stone-300 bg-[#FAF7F2] text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-[#BC5434] text-xs">#{i + 1}</span>
                <span className="editorial-tag !py-0.5 !px-2 !text-[9px]">
                  {u.type}
                </span>
              </div>
              <h4 className="font-editorial-serif font-bold text-stone-900 text-sm">{u.name}</h4>
              <div className="text-[11px] text-stone-600 font-serif italic">
                {t('ana.incubation')}<strong className="text-stone-900 not-italic font-sans">{u.incubationCenter}</strong> ({u.district})
              </div>
              <div className="pt-2 border-t border-stone-200 flex justify-between text-[11px] font-mono text-stone-600">
                <span>{t('ana.depts')} <strong>{u.departments?.length || 0}</strong></span>
                <span>{t('ana.mentors')} <strong>{u.facultyMentors?.length || 0}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};