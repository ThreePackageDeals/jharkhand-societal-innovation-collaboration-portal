import React, { useState } from 'react';
import {
  X,
  Sparkles,
  MapPin,
  Upload,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Copy,
  ExternalLink,
  ChevronRight,
  Send,
  Loader2,
  FileText,
  ShieldCheck,
  Building2,
  Mic,
  Square,
} from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { JHARKHAND_DISTRICTS, THEMATIC_DOMAINS } from '../data/jharkhandData';
import { DomainTheme, District, SubmitterType, ProblemStatement, AIAnalysisResult } from '../types';

interface CitizenSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newProblem: ProblemStatement) => void;
}

const VoiceRecorderButton = ({ onTranscript, disabled }: { onTranscript: (text: string) => void, disabled?: boolean }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64data = reader.result as string;
          setIsTranscribing(true);
          try {
            const res = await fetch('/api/ai/transcribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audioBase64: base64data, mimeType: 'audio/webm' })
            });
            if (res.ok) {
              const data = await res.json();
              if (data.text) {
                onTranscript(data.text.trim());
              }
            } else {
              alert('Transcription failed. Please try again.');
            }
          } catch (err) {
            console.error(err);
            alert('Transcription error.');
          } finally {
            setIsTranscribing(false);
          }
        };
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone', err);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  if (isTranscribing) {
    return (
      <button type="button" disabled className="flex items-center gap-1.5 text-[10px] text-stone-500 px-2 py-1 border border-stone-200">
        <Loader2 className="w-3 h-3 animate-spin" /> Processing
      </button>
    );
  }

  if (isRecording) {
    return (
      <button type="button" onClick={stopRecording} className="flex items-center gap-1.5 text-[10px] bg-red-50 text-[#BC5434] px-2 py-1 border border-[#BC5434] animate-pulse cursor-pointer">
        <Square className="w-3 h-3 fill-current" /> Stop
      </button>
    );
  }

  return (
    <button type="button" onClick={startRecording} disabled={disabled} className="flex items-center gap-1 text-[10px] text-stone-500 hover:text-stone-900 border border-stone-200 hover:border-stone-400 bg-[#FAF7F2] hover:bg-white px-2 py-1 transition-colors cursor-pointer">
      <Mic className="w-3 h-3" /> Voice
    </button>
  );
};

export const CitizenSubmissionModal: React.FC<CitizenSubmissionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useLanguage();
  if (!isOpen) return null;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsSuccess, setGpsSuccess] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState<DomainTheme>('water_resources');
  const [district, setDistrict] = useState<District>('Ranchi');
  const [blockOrPanchayat, setBlockOrPanchayat] = useState('');
  const [lat, setLat] = useState<number>(23.3441);
  const [lng, setLng] = useState<number>(85.3096);
  const [submitterName, setSubmitterName] = useState('');
  const [submitterType, setSubmitterType] = useState<SubmitterType>('gram_panchayat');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [urgency, setUrgency] = useState<'Critical' | 'High' | 'Medium' | 'Low'>('High');
  const [affectedPopulation, setAffectedPopulation] = useState<number>(2500);
  const [description, setDescription] = useState('');
  const [priorAttempts, setPriorAttempts] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');

  // AI Analysis result cache
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [createdProblem, setCreatedProblem] = useState<ProblemStatement | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const fillExampleChallenge = () => {
    setTitle('Arsenic Contamination in Sahibganj Groundwater');
    setDomain('water_resources');
    setDistrict('Sahibganj');
    setBlockOrPanchayat('Udhwa Block');
    setLat(24.9667);
    setLng(87.8000);
    setSubmitterType('gram_panchayat');
    setSubmitterName('Ramesh Soren');
    setContact('+91 98765 43210');
    setAffectedPopulation(5000);
    setUrgency('Critical');
    setDescription('Groundwater in several panchayats of Udhwa block is highly contaminated with arsenic, leading to widespread skin lesions, digestive issues, and suspected cancer cases among the villagers. The existing hand pumps are drawing water from shallow aquifers which are severely affected.');
    setPriorAttempts('Previously, some deep tube wells were bored, but due to lack of maintenance and geological shifting, they are also showing traces of arsenic. Small household filters were distributed but filters saturated quickly and were not replaced.');
    setMediaUrl('');
  };

  // Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Image is too large. Please upload a file smaller than 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  // Auto-detect GPS
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(Number(pos.coords.latitude.toFixed(4)));
        setLng(Number(pos.coords.longitude.toFixed(4)));
        setGpsLoading(false);
        setGpsSuccess(true);
        setTimeout(() => setGpsSuccess(false), 3000);
      },
      (err) => {
        console.warn('Geolocation warning:', err.message);
        setGpsLoading(false);
        // Default to Ranchi coordinates
        setLat(23.3441);
        setLng(85.3096);
        setGpsSuccess(true);
      },
      { timeout: 8000 }
    );
  };

  // Trigger server-side AI evaluation
  const handleRunAiEvaluation = async () => {
    if (!title.trim() || !description.trim()) {
      alert('Please fill in both the Challenge Title and Problem Description first.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/ai/analyze-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description + (priorAttempts ? ` [Prior Attempts: ${priorAttempts}]` : ''),
          district,
          blockOrPanchayat,
          domain,
          affectedPopulation,
          urgency,
        }),
      });
      const responseBody = await res.json();
      if (!res.ok) {
        throw new Error(responseBody?.error?.message || `AI evaluation failed (${res.status})`);
      }

      setAiResult(responseBody?.data || responseBody);
      setStep(3);
    } catch (err) {
      console.error('AI evaluation failed:', err);
      alert('Could not complete AI evaluation. You can still submit directly.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Final Submit
  const handleSubmitProblem = async () => {
    setIsSubmitting(true);
    try {
      const normalizedAiAnalysis = aiResult && 'category' in aiResult
        ? aiResult
        : (aiResult as any)?.data || undefined;

      const payload = {
        title,
        description: description + (priorAttempts ? `\n\n[Prior Attempts & Root Causes: ${priorAttempts}]` : ''),
        domain,
        district,
        blockOrPanchayat: blockOrPanchayat || `${district} Block Cluster`,
        locationCoords: {
          lat,
          lng,
          address: `${blockOrPanchayat ? blockOrPanchayat + ', ' : ''}${district}, Jharkhand`,
        },
        submittedBy: {
          name: submitterName || 'Community Representative',
          type: submitterType,
          contact: contact || '+91 94311 00000',
          email: email || 'samadhan.jh@gov.in',
          organization: organization || undefined,
        },
        urgency,
        affectedPopulation: Number(affectedPopulation) || 1000,
        mediaUrls: [mediaUrl],
        videoUrl: videoUrl || undefined,
        aiAnalysis: normalizedAiAnalysis,
      };

      const res = await fetch('/api/problems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const responseBody = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(responseBody?.error?.message || `Submission failed (${res.status})`);
      }

      const problemData = responseBody?.data || responseBody;
      setCreatedProblem(problemData);
      onSuccess(problemData);
    } catch (err) {
      console.error('Submission error:', err);
      alert(err instanceof Error ? err.message : 'Failed to submit problem. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyTrackingCode = () => {
    if (createdProblem?.trackingCode) {
      navigator.clipboard.writeText(createdProblem.trackingCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm overflow-y-auto">
      <div
        id="citizen-submission-modal-card"
        className="bg-white shadow-2xl border border-stone-300 max-w-3xl w-full my-8 overflow-hidden text-stone-800 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="bg-white px-8 py-6 flex items-center justify-between border-b border-stone-200">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#FAF7F2] border border-stone-300 flex items-center justify-center text-stone-900">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-editorial-serif text-2xl font-bold text-stone-900 tracking-tight">{t('citizen_submit_title')}</h2>
              <p className="text-xs text-stone-500 font-serif italic mt-1">
                {t('citizen_submit_subtitle')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fillExampleChallenge}
              className="text-[10px] font-bold uppercase tracking-wider bg-[#FAF7F2] border border-stone-300 px-3 py-1.5 text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
            >
              {t('citizen_submit_fill_example')}
            </button>
            <button
              id="btn-close-submission-modal"
              onClick={onClose}
              className="text-stone-400 hover:text-stone-900 p-1 transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Step Indicator */}
        {!createdProblem && (
          <div className="bg-[#FAF7F2] px-8 py-4 border-b border-stone-200 flex flex-wrap items-center justify-between text-[10px] font-bold uppercase tracking-wider text-stone-500">
            <div className={`flex items-center gap-2 ${step === 1 ? 'text-stone-900' : ''}`}>
              <span className={`w-5 h-5 flex items-center justify-center border ${step === 1 ? 'bg-[#1A1A1A] border-stone-900 text-white' : 'bg-white border-stone-300 text-stone-400'}`}>1</span>
              <span>{t('citizen_submit_step_1')}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-300 hidden sm:block" />
            <div className={`flex items-center gap-2 ${step === 2 ? 'text-stone-900' : ''}`}>
              <span className={`w-5 h-5 flex items-center justify-center border ${step === 2 ? 'bg-[#1A1A1A] border-stone-900 text-white' : 'bg-white border-stone-300 text-stone-400'}`}>2</span>
              <span>{t('citizen_submit_step_2')}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-300 hidden sm:block" />
            <div className={`flex items-center gap-2 ${step === 3 ? 'text-[#BC5434]' : ''}`}>
              <span className={`w-5 h-5 flex items-center justify-center border ${step === 3 ? 'bg-[#BC5434] border-[#BC5434] text-white' : 'bg-white border-stone-300 text-stone-400'}`}>3</span>
              <span>{t('citizen_submit_step_3')}</span>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {createdProblem ? (
            /* Success View */
            <div className="text-center py-10 px-4">
              <div className="w-16 h-16 bg-[#FAF7F2] text-stone-900 flex items-center justify-center mx-auto mb-6 border border-stone-300">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-editorial-serif text-3xl font-bold text-stone-900 mb-2">{t('citizen_submit_success_title')}</h3>
              <p className="text-sm text-stone-600 font-serif italic max-w-md mx-auto mb-8">
                {t('citizen_submit_success_desc')}
              </p>

              <div className="bg-white border border-stone-300 p-6 max-w-md mx-auto mb-8 text-left shadow-sm">
                <div className="text-[10px] text-stone-500 uppercase tracking-widest font-bold mb-2">{t('citizen_submit_tracking_code')}</div>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xl font-bold text-[#BC5434]">{createdProblem.trackingCode}</span>
                  <button
                    onClick={copyTrackingCode}
                    className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider bg-[#FAF7F2] px-3 py-2 border border-stone-300 hover:bg-white text-stone-700 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedCode ? t('citizen_submit_copied') : t('citizen_submit_copy_code')}</span>
                  </button>
                </div>
                <div className="mt-4 text-[11px] uppercase tracking-wider font-bold text-stone-500 pt-3 border-t border-stone-200 flex justify-between">
                  <span>District: <strong className="text-stone-900">{createdProblem.district}</strong></span>
                  <span>Domain: <strong className="text-stone-900">{createdProblem.domain}</strong></span>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={onClose}
                  className="bg-[#1A1A1A] hover:bg-black text-white font-bold uppercase tracking-widest text-[11px] px-8 py-3.5 transition-colors cursor-pointer shadow-sm"
                >
                  {t('citizen_submit_view_registry')}
                </button>
              </div>
            </div>
          ) : step === 1 ? (
            /* Step 1: Essentials */
            <div className="space-y-6 px-2">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-700">
                    {t('citizen_submit_title_label')} <span className="text-[#BC5434]">*</span>
                  </label>
                  <VoiceRecorderButton onTranscript={(t) => setTitle(title ? title + ' ' + t : t)} />
                </div>
                <input
                  id="input-challenge-title"
                  type="text"
                  placeholder={t('citizen_submit_title_placeholder')}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-sm px-3 py-2.5 border border-stone-300 bg-white focus:outline-none focus:border-[#BC5434]"
                />
                <p className="text-xs font-serif italic text-stone-500 mt-2">
                  {t('citizen_submit_title_help')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-700 mb-1.5">
                    {t('citizen_submit_domain_label')} <span className="text-[#BC5434]">*</span>
                  </label>
                  <select
                    id="select-challenge-domain"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value as DomainTheme)}
                    className="w-full text-sm px-3 py-2.5 border border-stone-300 bg-white focus:outline-none focus:border-[#BC5434]"
                  >
                    {THEMATIC_DOMAINS.map((td) => (
                      <option key={td.key} value={td.key}>
                        {td.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-700 mb-1.5">
                    {t('citizen_submit_district_label')} <span className="text-[#BC5434]">*</span>
                  </label>
                  <select
                    id="select-challenge-district"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value as District)}
                    className="w-full text-sm px-3 py-2.5 border border-stone-300 bg-white focus:outline-none focus:border-[#BC5434]"
                  >
                    {JHARKHAND_DISTRICTS.map((dist) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-700">
                    {t('citizen_submit_block_label')} <span className="text-[#BC5434]">*</span>
                  </label>
                  <VoiceRecorderButton onTranscript={(t) => setBlockOrPanchayat(blockOrPanchayat ? blockOrPanchayat + ' ' + t : t)} />
                </div>
                  <input
                    id="input-block-panchayat"
                    type="text"
                    placeholder="e.g., Bundu Block"
                    value={blockOrPanchayat}
                    onChange={(e) => setBlockOrPanchayat(e.target.value)}
                    className="w-full text-sm px-3 py-2.5 border border-stone-300 bg-white focus:outline-none focus:border-[#BC5434]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-700 mb-1.5 flex items-center justify-between">
                    <span>{t('citizen_submit_gps_label')}</span>
                    <button
                      type="button"
                      onClick={handleDetectGPS}
                      disabled={gpsLoading}
                      className="text-[#BC5434] hover:text-[#A3452B] font-bold inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{gpsLoading ? t('citizen_submit_gps_detecting') : gpsSuccess ? t('citizen_submit_gps_detected') : t('citizen_submit_gps_detect')}</span>
                    </button>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      step="0.0001"
                      placeholder="Lat (e.g. 23.18)"
                      value={lat}
                      onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                      className="text-xs px-3 py-2.5 border border-stone-300 bg-[#FAF7F2] font-mono focus:outline-none focus:border-[#BC5434]"
                    />
                    <input
                      type="number"
                      step="0.0001"
                      placeholder="Lng (e.g. 85.58)"
                      value={lng}
                      onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                      className="text-xs px-3 py-2.5 border border-stone-300 bg-[#FAF7F2] font-mono focus:outline-none focus:border-[#BC5434]"
                    />
                  </div>
                </div>
              </div>

              {/* Submitter Details */}
              <div className="p-5 bg-white border border-stone-300 space-y-4">
                <div className="text-[10px] uppercase font-bold tracking-wider text-stone-900 flex items-center gap-2 border-b border-stone-200 pb-2">
                  <ShieldCheck className="w-4 h-4 text-stone-400" />
                  <span>{t('citizen_submit_entity_header')}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-500 mb-1.5">{t('citizen_submit_entity_type')}</label>
                    <select
                      value={submitterType}
                      onChange={(e) => setSubmitterType(e.target.value as SubmitterType)}
                      className="w-full text-xs px-3 py-2 border border-stone-300 bg-[#FAF7F2] focus:outline-none focus:border-[#BC5434]"
                    >
                      <option value="gram_panchayat">{t('citizen_submit_entity_gram_panchayat')}</option>
                      <option value="citizen">{t('citizen_submit_entity_citizen')}</option>
                      <option value="community_group">{t('citizen_submit_entity_community_group')}</option>
                      <option value="urban_local_body">{t('citizen_submit_entity_urban_local_body')}</option>
                      <option value="govt_agency">{t('citizen_submit_entity_govt_agency')}</option>
                    </select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-500">{t('citizen_submit_contact_name')}</label>
                    <VoiceRecorderButton onTranscript={(t) => setSubmitterName(submitterName ? submitterName + ' ' + t : t)} />
                  </div>
                    <input
                      type="text"
                      placeholder="e.g. Ramu Munda"
                      value={submitterName}
                      onChange={(e) => setSubmitterName(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-stone-300 bg-white focus:outline-none focus:border-[#BC5434]"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-500">{t('citizen_submit_contact_mobile')}</label>
                    <VoiceRecorderButton onTranscript={(t) => setContact(contact ? contact + ' ' + t : t)} />
                  </div>
                    <input
                      type="text"
                      placeholder="+91 94311 00000"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-stone-300 bg-white focus:outline-none focus:border-[#BC5434]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-700">
                    {t('citizen_submit_population_label')}
                  </label>
                  <VoiceRecorderButton onTranscript={(t) => setAffectedPopulation(Number(t) || affectedPopulation)} />
                </div>
                  <input
                    type="number"
                    min="10"
                    placeholder="e.g., 2500"
                    value={affectedPopulation}
                    onChange={(e) => setAffectedPopulation(parseInt(e.target.value) || 0)}
                    className="w-full text-sm px-3 py-2.5 border border-stone-300 bg-white focus:outline-none focus:border-[#BC5434]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-700 mb-1.5">
                    {t('citizen_submit_urgency_label')}
                  </label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as any)}
                    className="w-full text-sm px-3 py-2.5 border border-stone-300 bg-white focus:outline-none focus:border-[#BC5434]"
                  >
                    <option value="Critical">{t('citizen_submit_urgency_critical')}</option>
                    <option value="High">{t('citizen_submit_urgency_high')}</option>
                    <option value="Medium">{t('citizen_submit_urgency_medium')}</option>
                    <option value="Low">{t('citizen_submit_urgency_low')}</option>
                  </select>
                </div>
              </div>
            </div>
          ) : step === 2 ? (
            /* Step 2: Evidence & Context */
            <div className="space-y-6 px-2">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-700">
                    {t('citizen_submit_narrative_label')} <span className="text-[#BC5434]">*</span>
                  </label>
                  <VoiceRecorderButton onTranscript={(t) => setDescription(description ? description + '\n\n' + t : t)} />
                </div>
                <textarea
                  id="textarea-problem-description"
                  rows={4}
                  placeholder={t('citizen_submit_narrative_placeholder')}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-sm px-3 py-2.5 border border-stone-300 bg-white focus:outline-none focus:border-[#BC5434] font-serif italic"
                ></textarea>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-700">
                    {t('citizen_submit_prior_attempts_label')}
                  </label>
                  <VoiceRecorderButton onTranscript={(t) => setPriorAttempts(priorAttempts ? priorAttempts + '\n\n' + t : t)} />
                </div>
                <textarea
                  rows={3}
                  placeholder={t('citizen_submit_prior_attempts_placeholder')}
                  value={priorAttempts}
                  onChange={(e) => setPriorAttempts(e.target.value)}
                  className="w-full text-sm px-3 py-2.5 border border-stone-300 bg-white focus:outline-none focus:border-[#BC5434] font-serif italic"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-700 mb-1.5">
                    {t('citizen_submit_photo_label')}
                  </label>
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={mediaUrl}
                        onChange={(e) => setMediaUrl(e.target.value)}
                        placeholder="https://image-url..."
                        className="w-full text-xs px-3 py-2.5 border border-stone-300 bg-[#FAF7F2] focus:outline-none focus:border-[#BC5434]"
                      />
                      <label className="inline-flex items-center gap-1.5 bg-white border border-stone-300 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-stone-600 hover:bg-stone-50 cursor-pointer transition-colors">
                        <Upload className="w-3 h-3" />
                        <span>{t('citizen_submit_photo_upload')}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </label>
                    </div>
                    {mediaUrl && (
                      <div className="mt-3 h-32 border border-stone-300 bg-[#FAF7F2] flex items-center justify-center p-1">
                        <img src={mediaUrl} alt="Evidence preview" className="h-full w-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-700 mb-1.5">
                    {t('citizen_submit_video_label')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('citizen_submit_video_placeholder')}
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 border border-stone-300 bg-[#FAF7F2] focus:outline-none focus:border-[#BC5434]"
                  />
                  <div className="mt-3 p-4 bg-[#FAF7F2] border border-stone-300 text-xs text-stone-600 font-serif italic leading-relaxed">
                    <strong className="not-italic text-stone-900 font-bold text-[10px] uppercase tracking-wider block mb-1">Tip</strong>
                    {t('citizen_submit_video_tip')}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Step 3: AI Analysis & Pre-Routing Preview */
            <div className="space-y-6 px-2">
              {aiResult ? (
                <div>
                  <div className="bg-white border border-stone-300 p-6 mb-5 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#BC5434]"></div>
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-200">
                      <div className="flex items-center gap-2 text-stone-900 font-bold uppercase tracking-widest text-[10px]">
                        <Sparkles className="w-3.5 h-3.5 text-[#BC5434]" />
                        <span>{t('citizen_submit_ai_report')}</span>
                      </div>
                      <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-[#FAF7F2] text-stone-900 border border-stone-300">
                        {t('citizen_submit_ai_priority')}: {aiResult.priorityScore}/100
                      </div>
                    </div>
                    <div className="text-xs text-stone-900 mb-2 font-mono">
                      <strong className="text-stone-500 uppercase tracking-widest text-[10px]">Taxonomy:</strong> {aiResult.category} &rsaquo; {aiResult.subCategory}
                    </div>
                    <p className="text-sm font-serif italic text-stone-700 leading-relaxed">{aiResult.socialImpactPotential}</p>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {aiResult.thematicTags?.map((tag, i) => (
                        <span key={i} className="text-[10px] font-bold uppercase tracking-wider bg-[#1A1A1A] text-white px-2.5 py-1">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Deduplication check */}
                  {aiResult.duplicateMatches && aiResult.duplicateMatches.length > 0 && (
                    <div className="bg-[#FAF7F2] border border-[#BC5434] p-5 mb-5 text-xs text-stone-900">
                      <div className="flex items-center gap-2 font-bold uppercase tracking-widest text-[10px] mb-2 text-stone-900">
                        <AlertCircle className="w-4 h-4 text-[#BC5434]" />
                        <span>{t('citizen_submit_ai_sim_issues')}</span>
                      </div>
                      <p className="text-xs font-serif italic text-stone-600 mb-3">
                        {t('citizen_submit_ai_sim_desc')}
                      </p>
                      <div className="space-y-2">
                        {aiResult.duplicateMatches.map((dm, idx) => (
                          <div key={idx} className="bg-white p-3 border border-stone-300 flex justify-between items-center text-xs">
                            <span className="truncate max-w-xs font-bold font-editorial-serif text-sm">{dm.title} ({dm.district})</span>
                            <span className="text-[#BC5434] font-bold uppercase tracking-widest text-[10px] whitespace-nowrap">{dm.similarity}% match</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matched Universities */}
                  <div className="mb-5">
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-stone-900 mb-3 flex items-center gap-2 border-b border-stone-200 pb-2">
                      <Building2 className="w-4 h-4 text-stone-400" />
                      <span>{t('citizen_submit_ai_rec_labs')}</span>
                    </h4>
                    <div className="space-y-3">
                      {aiResult.matchedHeis?.map((m, idx) => (
                        <div key={idx} className="p-4 border border-stone-300 bg-white flex items-start justify-between gap-4 text-xs">
                          <div>
                            <div className="font-editorial-serif text-lg font-bold text-stone-900 leading-snug">{m.universityName}</div>
                            <div className="text-stone-600 font-bold uppercase tracking-wider text-[10px] mb-2 mt-1">{m.department}</div>
                            <p className="text-stone-500 font-serif italic leading-relaxed">{m.reason}</p>
                          </div>
                          <div className="text-right whitespace-nowrap pt-1">
                            <span className="inline-block bg-[#FAF7F2] border border-stone-300 text-stone-900 font-bold uppercase tracking-wider px-2 py-1 text-[10px]">
                              {m.matchScore}% Match
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommended Tech & NEP Alignment */}
                  <div className="p-5 bg-white border border-stone-300 text-xs space-y-3 font-sans">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 border-b border-stone-200 pb-2">
                      <strong className="text-stone-500 uppercase tracking-widest text-[10px]">Innovations</strong>
                      <span className="text-stone-900 font-bold">{aiResult.recommendedTech?.join(' • ')}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 border-b border-stone-200 pb-2">
                      <strong className="text-stone-500 uppercase tracking-widest text-[10px]">NEP Linkage</strong>
                      <span className="text-stone-900 font-bold">{aiResult.nepRelevance}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <strong className="text-stone-500 uppercase tracking-widest text-[10px]">Budget Band</strong>
                      <span className="text-[#BC5434] font-bold text-sm">{aiResult.estimatedBudgetBand}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 px-4 border border-stone-300 bg-[#FAF7F2]">
                  <p className="font-serif italic text-stone-600 mb-6 max-w-md mx-auto">
                    {t('citizen_submit_ai_no_eval')}
                  </p>
                  <button
                    onClick={handleRunAiEvaluation}
                    disabled={isAnalyzing}
                    className="inline-flex items-center gap-2 bg-[#1A1A1A] hover:bg-black text-white font-bold uppercase tracking-widest text-[11px] px-8 py-3.5 transition-colors cursor-pointer shadow-sm"
                  >
                    {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>{isAnalyzing ? t('citizen_submit_ai_running') : t('citizen_submit_ai_run_btn')}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {!createdProblem && (
          <div className="bg-white px-8 py-5 border-t border-stone-200 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as any)}
                className="text-[11px] font-bold uppercase tracking-widest text-stone-500 hover:text-stone-900 px-4 py-2 cursor-pointer transition-colors"
              >
                {t('citizen_submit_back')}
              </button>
            ) : (
              <div></div>
            )}

            <div className="flex items-center gap-3">
              {step === 1 && (
                <button
                  type="button"
                  onClick={() => {
                    if (!title.trim()) {
                      alert('Please provide a challenge title.');
                      return;
                    }
                    setStep(2);
                  }}
                  className="inline-flex items-center gap-2 bg-[#1A1A1A] hover:bg-black text-white font-bold uppercase tracking-widest text-[11px] px-6 py-3 transition-colors cursor-pointer"
                >
                  <span>{t('citizen_submit_next')}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {step === 2 && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handleSubmitProblem}
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center gap-2 bg-[#FAF7F2] hover:bg-white border border-stone-300 text-stone-900 font-bold uppercase tracking-widest text-[11px] px-6 py-3 cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>{t('citizen_submit_skip')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRunAiEvaluation}
                    disabled={isAnalyzing}
                    className="inline-flex items-center justify-center gap-2 bg-[#BC5434] hover:bg-[#A3452B] text-white font-bold uppercase tracking-widest text-[11px] px-6 py-3 cursor-pointer disabled:opacity-50 transition-colors shadow-sm"
                  >
                    {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>{t('citizen_submit_ai_run_btn')}</span>
                  </button>
                </div>
              )}

              {step === 3 && (
                <button
                  type="button"
                  onClick={handleSubmitProblem}
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 bg-[#BC5434] hover:bg-[#A3452B] text-white font-bold uppercase tracking-widest text-[11px] px-8 py-3 transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{t('citizen_submit_register')}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};