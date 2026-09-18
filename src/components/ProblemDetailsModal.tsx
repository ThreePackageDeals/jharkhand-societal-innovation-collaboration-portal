import React, { useState } from 'react';
import {
  X,
  MapPin,
  Sparkles,
  Building2,
  Users,
  IndianRupee,
  ThumbsUp,
  MessageSquare,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Share2,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { ProblemStatement, SolutionProposal } from '../types';
import { DiscussionThread } from './DiscussionThread';
import { ProblemLocationMap } from './ProblemLocationMap';

interface ProblemDetailsModalProps {
  problem: ProblemStatement | null;
  proposal?: SolutionProposal;
  onClose: () => void;
  onUpvote: (problemId: string) => Promise<void>;
  currentUserRole: 'citizen' | 'university' | 'industry' | 'admin';
}

export const ProblemDetailsModal: React.FC<ProblemDetailsModalProps> = ({
  problem,
  proposal,
  onClose,
  onUpvote,
  currentUserRole,
}) => {
  const { t } = useLanguage();
  if (!problem) return null;

  const [activeTab, setActiveTab] = useState<'overview' | 'ai-dossier' | 'proposal' | 'discussions'>('overview');
  const [upvoting, setUpvoting] = useState(false);
  const hasMappedLocation = Number.isFinite(problem.locationCoords?.lat) && Number.isFinite(problem.locationCoords?.lng);

  const handleUpvote = async () => {
    setUpvoting(true);
    try {
      await onUpvote(problem.id);
    } catch (err) {
      console.error(err);
    } finally {
      setUpvoting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs overflow-y-auto">
      <div
        id="problem-details-modal-card"
        className="bg-[#FDFCFB] border border-stone-400 max-w-3xl w-full my-8 overflow-hidden text-[#1A1A1A] shadow-2xl animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header: Editorial Ink */}
        <div className="bg-[#1A1A1A] px-6 py-4 text-stone-100 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-bold px-2 py-0.5 bg-stone-900 text-[#E07A5F] border border-stone-700">
              {problem.trackingCode}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-stone-800 text-stone-300 border border-stone-700">
              {problem.district} District
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleUpvote}
              disabled={upvoting}
              className="inline-flex items-center gap-1.5 bg-[#BC5434] hover:bg-[#5C2A0B] text-xs font-bold uppercase tracking-widest text-white px-3.5 py-1.5 transition-colors cursor-pointer"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>{t('prob_detail_endorse', problem.upvotesCount.toString())}</span>
            </button>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-white p-1 hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Title Bar: Editorial Masthead */}
        <div className="px-6 py-4 bg-[#FAF7F2] border-b border-stone-300">
          <h2 className="font-editorial-serif italic text-xl font-bold text-stone-900 leading-snug">{problem.title}</h2>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-stone-600 font-sans">
            <span className="editorial-meta !text-[10px] !mb-0">{(problem.domain || 'general').replace('_', ' ').toUpperCase()}</span>
            <span>•</span>
            <span className="font-medium text-stone-700">{problem.blockOrPanchayat}</span>
            <span>•</span>
            <span>Submitted by: <strong className="text-stone-900">{problem.submittedBy?.name || 'Unknown'}</strong> ({problem.submittedBy?.type?.replace('_', ' ') || 'Unknown'})</span>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-stone-300 px-6 space-x-6 text-[11px] font-bold uppercase tracking-wider text-stone-600 bg-[#FAF7F2]">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 flex items-center gap-1.5 cursor-pointer border-b-2 ${
              activeTab === 'overview'
                ? 'border-[#BC5434] text-stone-900 font-bold'
                : 'border-transparent hover:text-stone-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-[#BC5434]" />
            <span>{t('prob_detail_tab_overview')}</span>
          </button>

          <button
            onClick={() => setActiveTab('ai-dossier')}
            className={`py-3 flex items-center gap-1.5 cursor-pointer border-b-2 ${
              activeTab === 'ai-dossier'
                ? 'border-[#BC5434] text-stone-900 font-bold'
                : 'border-transparent hover:text-stone-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#BC5434]" />
            <span>{t('prob_detail_tab_ai')}</span>
          </button>

          <button
            onClick={() => setActiveTab('proposal')}
            className={`py-3 flex items-center gap-1.5 cursor-pointer border-b-2 ${
              activeTab === 'proposal'
                ? 'border-[#BC5434] text-stone-900 font-bold'
                : 'border-transparent hover:text-stone-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-[#BC5434]" />
            <span>{t('prob_detail_tab_proposal')}</span>
          </button>

          <button
            onClick={() => setActiveTab('discussions')}
            className={`py-3 flex items-center gap-1.5 cursor-pointer border-b-2 ${
              activeTab === 'discussions'
                ? 'border-[#BC5434] text-stone-900 font-bold'
                : 'border-transparent hover:text-stone-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#BC5434]" />
            <span>{t('prob_detail_tab_discussions')}</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-4 text-xs">
              <div>
                <h4 className="editorial-meta !text-[10px] !mb-1.5">
                  {t('prob_detail_narrative')}
                </h4>
                <p className="text-stone-800 text-sm leading-relaxed whitespace-pre-wrap bg-white p-4 border border-stone-300 font-serif">
                  {problem.description}
                </p>
              </div>

              {/* Media Evidence */}
              {problem.mediaUrls && problem.mediaUrls.length > 0 && (
                <div>
                  <h4 className="editorial-meta !text-[10px] !mb-2">
                    {t('prob_detail_visual_evidence')}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {problem.mediaUrls.map((url, i) => (
                      <div key={i} className="h-44 overflow-hidden border border-stone-300 bg-stone-100">
                        <img
                          src={url}
                          alt="Field Evidence"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Geographic Coordinates & Impact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-[#FAF7F2] border border-stone-300">
                <div>
                  <div className="editorial-meta !text-[10px] !mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#BC5434]" />
                    <span>{t('prob_detail_geo_coords')}</span>
                  </div>
                  <div className="text-stone-900 font-mono font-bold">
                    Lat: {problem.locationCoords?.lat ?? 'N/A'}, Lng: {problem.locationCoords?.lng ?? 'N/A'}
                  </div>
                  <div className="text-[11px] text-stone-600 font-serif italic mt-1">{problem.locationCoords?.address || 'Address not provided'}</div>
                </div>

                <div>
                  <div className="editorial-meta !text-[10px] !mb-1">{t('prob_detail_impact_urgency')}</div>
                  <div className="text-stone-900 font-editorial-serif text-lg font-bold">
                    {(problem.affectedPopulation || 0).toLocaleString()} Directly Affected Citizens
                  </div>
                  <div className="text-[11px] text-[#BC5434] font-bold uppercase tracking-wider mt-0.5">{problem.urgency} Urgency</div>
                </div>
              </div>

              {hasMappedLocation && (
                <ProblemLocationMap
                  latitude={problem.locationCoords.lat}
                  longitude={problem.locationCoords.lng}
                  label={problem.locationCoords.address || `${problem.blockOrPanchayat}, ${problem.district}`}
                />
              )}
            </div>
          )}

          {/* Tab 2: AI Dossier */}
          {activeTab === 'ai-dossier' && (
            <div className="space-y-4 text-xs">
              {problem.aiAnalysis ? (
                <div className="space-y-4">
                  <div className="bg-[#FAF7F2] border border-stone-300 p-4">
                    <div className="flex items-center justify-between mb-2 border-b border-stone-200 pb-2">
                      <span className="font-editorial-serif text-base font-bold text-stone-900 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-[#BC5434]" />
                        <span>{t('prob_detail_ai_classification')}</span>
                      </span>
                      <span className="bg-stone-900 text-white font-mono font-bold px-2.5 py-1 text-xs">
                        Score: {problem.aiAnalysis.priorityScore}/100
                      </span>
                    </div>
                    <div className="text-stone-800 font-bold uppercase tracking-wider text-[11px]">
                      {problem.aiAnalysis.category} &rsaquo; {problem.aiAnalysis.subCategory}
                    </div>
                    <p className="text-stone-600 font-serif italic mt-1.5 leading-relaxed">{problem.aiAnalysis.socialImpactPotential}</p>
                  </div>

                  {/* Duplicate check */}
                  {problem.aiAnalysis.duplicateMatches && problem.aiAnalysis.duplicateMatches.length > 0 && (
                    <div className="bg-white border border-stone-300 p-4">
                      <div className="font-bold text-stone-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 mb-2 text-[#BC5434]">
                        <AlertTriangle className="w-4 h-4" />
                        <span>{t('prob_detail_sim_issues')}</span>
                      </div>
                      <div className="space-y-1.5">
                        {problem.aiAnalysis.duplicateMatches.map((dm, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[11px] bg-[#FAF7F2] p-2 border border-stone-300">
                            <span className="font-medium text-stone-900">{dm.title} ({dm.district})</span>
                            <span className="font-mono font-bold text-[#BC5434]">{dm.similarity}% Match</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matched HEIs */}
                  <div>
                    <h4 className="editorial-meta !text-[10px] !mb-2">
                      {t('prob_detail_rec_heis')}
                    </h4>
                    <div className="space-y-2">
                      {problem.aiAnalysis.matchedHeis?.map((m, idx) => (
                        <div key={idx} className="p-3.5 bg-white border border-stone-300 flex justify-between items-start">
                          <div>
                            <div className="font-editorial-serif font-bold text-stone-900 text-sm">{m.universityName}</div>
                            <div className="text-[#BC5434] font-bold uppercase tracking-wider text-[10px]">{m.department}</div>
                            <p className="text-stone-600 font-serif italic text-[11px] mt-1">{m.reason}</p>
                          </div>
                          <span className="bg-stone-900 text-white font-mono font-bold px-2 py-0.5 text-[11px] whitespace-nowrap">
                            {m.matchScore}% Match
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommended Tech */}
                  <div className="p-3.5 bg-[#FAF7F2] border border-stone-300 space-y-1 text-xs">
                    <div>
                      <strong className="text-stone-900">Recommended Innovations:</strong>{' '}
                      <span className="text-stone-600">{problem.aiAnalysis.recommendedTech?.join(' • ')}</span>
                    </div>
                    <div>
                      <strong className="text-stone-900">NEP 2020 Relevance:</strong>{' '}
                      <span className="text-stone-600 font-serif italic">{problem.aiAnalysis.nepRelevance}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-stone-500 font-serif italic">
                  {t('prob_detail_no_ai')}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: University Proposal */}
          {activeTab === 'proposal' && (
            <div className="space-y-4 text-xs">
              {proposal ? (
                <div className="space-y-4">
                  <div className="p-4 bg-[#FAF7F2] border border-stone-300 space-y-2">
                    <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                      <span className="font-editorial-serif font-bold text-stone-900 text-base">{proposal.projectTitle}</span>
                      <span className="bg-stone-900 text-white font-mono font-bold px-2 py-0.5 text-[11px]">
                        NEP Credits: {proposal.nepExperientialCredits}
                      </span>
                    </div>
                    <p className="text-stone-700 font-serif leading-relaxed">{proposal.abstract}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3.5 bg-white border border-stone-300">
                      <div className="editorial-meta !text-[10px] !mb-1">{t('prob_detail_assigned_faculty')}</div>
                      <div className="font-bold text-stone-900">{proposal.facultyMentor?.name || 'Unknown Mentor'}</div>
                      <div className="text-stone-600 text-[11px]">{proposal.facultyMentor?.department || 'Unknown Department'}</div>
                      <div className="text-stone-500 font-mono text-[10px]">{proposal.facultyMentor?.email || 'No email provided'}</div>
                    </div>

                    <div className="p-3.5 bg-white border border-stone-300">
                      <div className="editorial-meta !text-[10px] !mb-1">{t('prob_detail_student_team')}</div>
                      <div className="font-bold text-stone-900">{proposal.studentTeam?.leadName || 'Unknown Lead'} (Lead)</div>
                      <div className="text-stone-600 text-[11px]">{proposal.studentTeam?.membersCount || 0} Multidisciplinary Members</div>
                      <div className="text-stone-500 text-[10px]">{proposal.studentTeam?.departments?.join(', ') || 'No departments listed'}</div>
                    </div>
                  </div>

                  {/* Budget */}
                  <div className="p-4 bg-[#FAF7F2] border border-stone-300 flex justify-between items-center">
                    <div>
                      <div className="editorial-meta !text-[10px] !mb-1">{t('prob_detail_budget')}</div>
                      <div className="font-editorial-serif text-2xl font-light text-stone-900">
                        ₹{((proposal.budgetBreakdown?.totalAmount || 0) / 100000).toFixed(2)} Lakhs
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="editorial-meta !text-[10px] !mb-1">{t('prob_detail_sponsor')}</div>
                      <div className="font-bold text-stone-900">{proposal.industryPartnerName || 'Seeking CSR'}</div>
                    </div>
                  </div>

                  {/* Milestones list */}
                  <div>
                    <h4 className="editorial-meta !text-[10px] !mb-2">
                      {t('prob_detail_milestones')}
                    </h4>
                    <div className="space-y-2">
                      {proposal.milestones?.map((m) => (
                        <div key={m.id} className="p-3 bg-white border border-stone-300 flex justify-between items-center text-xs">
                          <div>
                            <div className="font-bold text-stone-900">{m.title}</div>
                            <div className="text-[10px] text-stone-500 font-serif italic">{m.stage} • Deliverable: {m.deliverable}</div>
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border ${m.status === 'completed' ? 'bg-[#FAF7F2] border-stone-900 text-stone-900' : 'bg-stone-100 border-stone-300 text-stone-500'}`}>
                            {m.status.toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-stone-500 font-serif italic">
                  {problem.assignedHeiName ? (
                    <div>
                      {t('prob_detail_routed_msg', problem.assignedHeiName)}
                    </div>
                  ) : (
                    <div>{t('prob_detail_not_routed')}</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Discussions */}
          {activeTab === 'discussions' && (
            <DiscussionThread
              problemId={problem.id}
              problemTitle={problem.title}
              currentUserRole={currentUserRole}
            />
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-[#FAF7F2] px-6 py-3.5 border-t border-stone-300 flex items-center justify-between text-xs">
          <span className="text-stone-500 font-serif italic">
            Registered: {new Date(problem.createdAt || Date.now()).toLocaleDateString()}
          </span>
          <button
            onClick={onClose}
            className="bg-[#1A1A1A] hover:bg-stone-800 text-white font-bold uppercase tracking-widest text-xs px-5 py-2.5 transition-colors cursor-pointer"
          >
            {t('prob_detail_close')}
          </button>
        </div>
      </div>
    </div>
  );
};
