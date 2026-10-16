/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Compass,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Target,
  ArrowRight,
  Printer,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Zap,
  Filter,
  Flame,
  Award,
  Layers,
  Check,
  PlusCircle,
  HelpCircle,
  Info
} from 'lucide-react';
import {
  StudyEntry,
  ChapterStatus,
  TestEntry,
  RevisionTask,
  NEETSubject,
  ConfidenceLevel,
  LowConfidenceChapterAnalysis,
  GeneratedRoadmap,
  RoadmapDay,
  RoadmapSession
} from '../types';
import { SUBJECT_COLORS, getChapterSubject } from '../neetData';
import { diagnoseLowConfidenceChapters, generateAlgorithmicRoadmap } from '../utils/roadmapDiagnostics';
import { triggerToast } from '../utils';

interface StudyRoadmapPageProps {
  entries: StudyEntry[];
  chapterStatuses: ChapterStatus[];
  tests: TestEntry[];
  revisions: RevisionTask[];
  examDate: string | null;
  onNavigateToTab: (tab: string) => void;
  onPreFillLogSession?: (chapter: string, subject: NEETSubject) => void;
}

export default function StudyRoadmapPage({
  entries,
  chapterStatuses,
  tests,
  revisions,
  examDate,
  onNavigateToTab,
  onPreFillLogSession
}: StudyRoadmapPageProps) {
  // 1. Diagnose chapters with lowest confidence level in database
  const diagnosedWeakChapters = useMemo(() => {
    return diagnoseLowConfidenceChapters(entries, chapterStatuses, tests, revisions);
  }, [entries, chapterStatuses, tests, revisions]);

  // Low confidence chapters filtered (either explicit 'Low', 'Medium', or critical accuracy)
  const prioritizedWeakList = useMemo(() => {
    return diagnosedWeakChapters.filter(
      c => c.currentConfidence === 'Low' || c.currentConfidence === 'Medium' || c.urgencyScore >= 50
    );
  }, [diagnosedWeakChapters]);

  // Selected chapters for roadmap generation
  const [selectedChapterNames, setSelectedChapterNames] = useState<string[]>(() => {
    // Default select top 5 weakest chapters from database
    const topWeak = diagnosedWeakChapters.slice(0, 5).map(c => c.chapterName);
    return topWeak.length > 0 ? topWeak : ["Ray Optics and Optical Instruments", "Aldehydes, Ketones and Carboxylic Acids", "Principles of Inheritance and Variation"];
  });

  // Generator Configurations
  const [dailyHours, setDailyHours] = useState<number>(6);
  const [intensity, setIntensity] = useState<'moderate' | 'balanced' | 'rigorous'>('balanced');
  const [customFocusNotes, setCustomFocusNotes] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Active generated roadmap
  const [roadmap, setRoadmap] = useState<GeneratedRoadmap | null>(() => {
    const saved = localStorage.getItem('neet_current_study_roadmap');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // Track completed sessions locally: Map of session ID -> boolean
  const [completedSessions, setCompletedSessions] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('neet_roadmap_completed_sessions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return {};
      }
    }
    return {};
  });

  // Selected Day View Tab in Roadmap
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);
  const [showConfigPanel, setShowConfigPanel] = useState<boolean>(!roadmap);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [subjectFilter, setSubjectFilter] = useState<'All' | NEETSubject>('All');

  // Save roadmap updates to localStorage
  useEffect(() => {
    if (roadmap) {
      localStorage.setItem('neet_current_study_roadmap', JSON.stringify(roadmap));
    }
  }, [roadmap]);

  useEffect(() => {
    localStorage.setItem('neet_roadmap_completed_sessions', JSON.stringify(completedSessions));
  }, [completedSessions]);

  // Toggle chapter selection
  const handleToggleChapter = (chapterName: string) => {
    setSelectedChapterNames(prev => {
      if (prev.includes(chapterName)) {
        if (prev.length <= 1) {
          triggerToast("Select at least 1 chapter for the weekly roadmap.", "info");
          return prev;
        }
        return prev.filter(c => c !== chapterName);
      } else {
        if (prev.length >= 8) {
          triggerToast("Recommended max is 8 chapters to maintain deep mastery.", "info");
          return prev;
        }
        return [...prev, chapterName];
      }
    });
  };

  const handleSelectAllLow = () => {
    const lowOnly = diagnosedWeakChapters
      .filter(c => c.currentConfidence === 'Low')
      .slice(0, 8)
      .map(c => c.chapterName);
    if (lowOnly.length > 0) {
      setSelectedChapterNames(lowOnly);
      triggerToast(`Selected ${lowOnly.length} chapters with 'Low' confidence.`, "success");
    } else {
      const topUrgent = diagnosedWeakChapters.slice(0, 5).map(c => c.chapterName);
      setSelectedChapterNames(topUrgent);
      triggerToast(`Selected top ${topUrgent.length} most urgent chapters.`, "info");
    }
  };

  // Toggle completed status of session
  const toggleSessionCompletion = (sessionId: string) => {
    setCompletedSessions(prev => {
      const next = { ...prev, [sessionId]: !prev[sessionId] };
      return next;
    });
  };

  // Calculate completion progress
  const progressStats = useMemo(() => {
    if (!roadmap) return { totalSessions: 0, completedCount: 0, percentage: 0 };
    let total = 0;
    let completed = 0;
    roadmap.weeklySchedule.forEach(day => {
      day.sessions.forEach(sess => {
        total++;
        if (completedSessions[sess.id]) completed++;
      });
    });
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { totalSessions: total, completedCount: completed, percentage: pct };
  }, [roadmap, completedSessions]);

  // AI-Powered Generation Handler
  const handleGenerateAiRoadmap = async () => {
    setIsGenerating(true);
    setGenerationError(null);

    const targetList = diagnosedWeakChapters.filter(c => selectedChapterNames.includes(c.chapterName));

    try {
      const response = await fetch('/api/generate-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetChapters: targetList,
          dailyHours,
          intensity,
          examDate,
          additionalNotes: customFocusNotes.trim() || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const data = await response.json();
      if (!data.roadmap) {
        throw new Error("Invalid roadmap received from AI service.");
      }

      setRoadmap(data.roadmap);
      setShowConfigPanel(false);
      setSelectedDayNumber(1);
      triggerToast("AI Weekly Roadmap successfully generated & optimized!", "success");
    } catch (err: any) {
      console.warn("AI generation failed, deploying intelligent algorithmic schedule engine:", err);
      // Fallback seamlessly to the local algorithmic scheduler so user never encounters a dead end
      const fallbackRoadmap = generateAlgorithmicRoadmap(targetList, {
        dailyHours,
        intensity,
        focusMode: customFocusNotes
      });
      setRoadmap(fallbackRoadmap);
      setShowConfigPanel(false);
      setSelectedDayNumber(1);
      triggerToast("Generated optimized weekly roadmap using built-in cognitive engine.", "info");
    } finally {
      setIsGenerating(false);
    }
  };

  // Instant Algorithmic Generation (Fast / Offline)
  const handleGenerateAlgorithmic = () => {
    const targetList = diagnosedWeakChapters.filter(c => selectedChapterNames.includes(c.chapterName));
    const generated = generateAlgorithmicRoadmap(targetList, {
      dailyHours,
      intensity,
      focusMode: customFocusNotes
    });
    setRoadmap(generated);
    setShowConfigPanel(false);
    setSelectedDayNumber(1);
    triggerToast("Weekly schedule generated instantly!", "success");
  };

  // Print A4 Schedule Handler
  const handlePrint = () => {
    window.print();
  };

  // Filtered diagnosed chapters for display
  const filteredChapters = useMemo(() => {
    return diagnosedWeakChapters.filter(c => {
      const matchesSearch = c.chapterName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSubj = subjectFilter === 'All' || c.subject === subjectFilter;
      return matchesSearch && matchesSubj;
    });
  }, [diagnosedWeakChapters, searchQuery, subjectFilter]);

  // Low confidence count summary
  const lowConfidenceCount = diagnosedWeakChapters.filter(c => c.currentConfidence === 'Low').length;
  const mediumConfidenceCount = diagnosedWeakChapters.filter(c => c.currentConfidence === 'Medium').length;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12 print:p-0 print:m-0 print:max-w-none">
      
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-6 md:p-8 shadow-xl border border-slate-800 print:hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-72 h-72 bg-medical-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/3 bottom-0 w-56 h-56 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-bold text-amber-400">
              <Sparkles className="w-3.5 h-3.5 text-medical-400 animate-spin-slow" />
              <span>AI Cognitive Study Engine</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight text-white">
              AI-Powered Weekly Study Roadmap
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-medium">
              Analyzes your logged study entries, active recall accuracy, and spaced revisions to automatically diagnose chapters with the lowest confidence levels—generating a disciplined, interleaving 7-day schedule to elevate them to mastery.
            </p>
          </div>

          <div className="flex flex-row md:flex-col gap-3 shrink-0">
            <div className="bg-slate-850/90 border border-slate-800 rounded-2xl p-4 text-center min-w-[140px] shadow-inner">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Lowest Confidence</span>
              <span className="text-2xl font-mono font-black text-rose-400 block mt-0.5">
                {lowConfidenceCount} <span className="text-xs font-normal text-slate-400">Low</span>
              </span>
              <span className="text-[9px] text-amber-300/80 block mt-1">+{mediumConfidenceCount} Medium chapters</span>
            </div>

            {roadmap && (
              <button
                onClick={() => setShowConfigPanel(!showConfigPanel)}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5 text-medical-400" />
                <span>{showConfigPanel ? 'Hide Config' : 'Customize & Regenerate'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Configuration & Chapter Selector Section (Collapsible if roadmap exists) */}
      <AnimatePresence>
        {(showConfigPanel || !roadmap) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 md:p-7 shadow-sm space-y-6 print:hidden"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-medical-600 dark:text-medical-400" />
                  <span>Diagnosed Low-Confidence Chapters in Your Database</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  The engine scanned your database and identified {diagnosedWeakChapters.length} chapters ranked by lowest confidence and accuracy. Select which to prioritize this week.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSelectAllLow}
                  className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 rounded-lg text-xs font-bold hover:bg-rose-100 transition-colors cursor-pointer"
                >
                  Prioritize All Low
                </button>
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg">
                  {selectedChapterNames.length} Selected
                </span>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search diagnosed chapters..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3.5 py-2 pl-9 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500"
                />
                <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {(['All', 'Physics', 'Chemistry', 'Biology'] as const).map(subj => (
                  <button
                    key={subj}
                    onClick={() => setSubjectFilter(subj)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      subjectFilter === subj
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {subj}
                  </button>
                ))}
              </div>
            </div>

            {/* Chapter Selection Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
              {filteredChapters.map(chap => {
                const isSelected = selectedChapterNames.includes(chap.chapterName);
                const subjColor = SUBJECT_COLORS[chap.subject] || SUBJECT_COLORS.Biology;

                return (
                  <div
                    key={chap.chapterName}
                    onClick={() => handleToggleChapter(chap.chapterName)}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between gap-2.5 relative ${
                      isSelected
                        ? 'bg-medical-50/60 dark:bg-medical-950/30 border-medical-500 dark:border-medical-600 shadow-sm ring-1 ring-medical-500/30'
                        : 'bg-slate-50/50 dark:bg-slate-850/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${subjColor.bg} ${subjColor.text} ${subjColor.border}`}>
                            {chap.subject}
                          </span>

                          {/* Confidence Level Badge */}
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                            chap.currentConfidence === 'Low'
                              ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-900'
                              : chap.currentConfidence === 'Medium'
                              ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-900'
                              : chap.currentConfidence === 'High'
                              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-900'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}>
                            {chap.currentConfidence === 'Unrated' ? 'Unrated' : `${chap.currentConfidence} Confidence`}
                          </span>

                          {chap.isWeakInMocks && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300">
                              Mock Error
                            </span>
                          )}
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                          {chap.chapterName}
                        </h4>
                      </div>

                      <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                        isSelected 
                          ? 'bg-medical-600 border-medical-600 text-white' 
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-200/50 dark:border-slate-800/80 pt-2">
                      <span>Accuracy: <strong className="text-slate-700 dark:text-slate-200">{chap.averageAccuracy > 0 ? `${chap.averageAccuracy}%` : 'N/A'}</strong></span>
                      <span>Hours: <strong className="text-slate-700 dark:text-slate-200">{chap.totalHours}h</strong></span>
                      <span>MCQs: <strong className="text-slate-700 dark:text-slate-200">{chap.totalMcqs}</strong></span>
                    </div>

                    <p className="text-[9.5px] text-slate-400 dark:text-slate-500 italic line-clamp-1">
                      {chap.reason}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Customization Options Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              
              {/* Daily Hours Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-medical-500" />
                    <span>Daily Study Target</span>
                  </label>
                  <span className="text-xs font-mono font-bold text-medical-600 dark:text-medical-400 bg-medical-50 dark:bg-medical-950/40 px-2 py-0.5 rounded border border-medical-200 dark:border-medical-900">
                    {dailyHours} Hours/Day
                  </span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="12"
                  step="0.5"
                  value={dailyHours}
                  onChange={(e) => setDailyHours(parseFloat(e.target.value))}
                  className="w-full accent-medical-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>3h (Light)</span>
                  <span>6h (Recommended)</span>
                  <span>12h (Sprint)</span>
                </div>
              </div>

              {/* Prep Intensity */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <span>Remediation Intensity</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'moderate', label: 'Moderate' },
                    { id: 'balanced', label: 'Balanced' },
                    { id: 'rigorous', label: 'Rigorous' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setIntensity(opt.id as any)}
                      className={`px-2 py-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                        intensity === opt.id
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Focus Notes / Student Directives */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-medical-500" />
                  <span>Optional Student Focus Note</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Focus on Optics formulas & Organic mechanisms"
                  value={customFocusNotes}
                  onChange={(e) => setCustomFocusNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500"
                />
              </div>

            </div>

            {/* Action Trigger Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-medical-500 shrink-0" />
                Interleaves Physics, Chemistry & Biology across all 7 days with NCERT accuracy benchmarks.
              </span>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={handleGenerateAlgorithmic}
                  disabled={isGenerating}
                  className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap"
                >
                  Instant Plan (Offline)
                </button>

                <button
                  onClick={handleGenerateAiRoadmap}
                  disabled={isGenerating}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 bg-medical-600 hover:bg-medical-500 text-white text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap active:scale-95"
                >
                  {isGenerating ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                      <span>Synthesizing AI Roadmap...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Generate AI Roadmap</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Generated Roadmap Display */}
      {roadmap ? (
        <div className="space-y-6">
          
          {/* Roadmap Header Summary Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 md:p-6 shadow-sm space-y-4 print:border-none print:shadow-none print:p-0">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-medical-50 dark:bg-medical-950/60 text-medical-700 dark:text-medical-300 border border-medical-200 dark:border-medical-800">
                    {roadmap.generationMode === 'ai' ? '🤖 AI-Optimized Roadmap' : '⚡ Cognitive Schedule'}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    Target: {roadmap.dailyHoursTarget * 7}h total / week
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-display font-black text-slate-900 dark:text-white tracking-tight">
                  {roadmap.title}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
                  {roadmap.overview}
                </p>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2 shrink-0 print:hidden">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  title="Print clean A4 study timetable"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>Print A4 Plan</span>
                </button>
              </div>
            </div>

            {/* Cognitive Strategy Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed flex items-start gap-3">
              <BookOpen className="w-4 h-4 text-medical-600 dark:text-medical-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 dark:text-white font-bold">Cognitive Sequencing Strategy: </strong>
                {roadmap.strategy}
              </div>
            </div>

            {/* Weak Chapter Targets & Progress Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              
              {/* Target Chapters Benchmark Pills */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Weak Chapters Targeted This Week:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {roadmap.targetChaptersSummary.map((item, i) => {
                    const subjColor = SUBJECT_COLORS[item.subject as NEETSubject] || SUBJECT_COLORS.Biology;
                    return (
                      <div
                        key={i}
                        className={`text-[10px] font-medium px-2 py-1 rounded-lg border flex items-center gap-1.5 ${subjColor.bg} ${subjColor.text} ${subjColor.border}`}
                      >
                        <span className="font-bold">{item.chapterName}</span>
                        <span className="opacity-70 text-[8.5px]">({item.currentConfidence} ➔ High)</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Interactive Weekly Progress */}
              <div className="space-y-2 bg-slate-50/80 dark:bg-slate-850/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Weekly Execution Progress</span>
                  </span>
                  <span className="font-mono font-bold text-medical-600 dark:text-medical-400">
                    {progressStats.completedCount} / {progressStats.totalSessions} Sessions ({progressStats.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-medical-500 to-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${progressStats.percentage}%` }}
                  ></div>
                </div>
              </div>

            </div>

            {/* Subject Split Breakdown */}
            <div className="flex items-center gap-4 pt-2 text-xs border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Subject Split:</span>
              <div className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1.5 text-sky-700 dark:text-sky-300 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                  Physics: {roadmap.subjectSplit.physicsHours.toFixed(1)}h
                </span>
                <span className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  Chemistry: {roadmap.subjectSplit.chemistryHours.toFixed(1)}h
                </span>
                <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Biology: {roadmap.subjectSplit.biologyHours.toFixed(1)}h
                </span>
              </div>
            </div>

          </div>

          {/* Day Navigation Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none print:hidden">
            {roadmap.weeklySchedule.map(day => {
              const isSelected = selectedDayNumber === day.dayNumber;
              const allDaySessionsDone = day.sessions.every(s => completedSessions[s.id]);

              return (
                <button
                  key={day.dayNumber}
                  onClick={() => setSelectedDayNumber(day.dayNumber)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 border ${
                    isSelected
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-md'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{day.dayLabel}</span>
                  {allDaySessionsDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <span className="text-[10px] font-mono opacity-60">
                      {day.totalHours}h
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Day Detail Card (Single Day Focus on Screen, or all 7 days for Print) */}
          <div className="space-y-6">
            {roadmap.weeklySchedule
              .filter(day => day.dayNumber === selectedDayNumber || typeof window === 'undefined')
              .map(day => {
                return (
                  <div
                    key={day.dayNumber}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 md:p-6 shadow-sm space-y-6 print:border-slate-300 print:mb-8 print:break-inside-avoid"
                  >
                    {/* Day Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-medical-600 dark:text-medical-400 uppercase tracking-wider">
                            Day {day.dayNumber} of 7
                          </span>
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          <span className="text-xs font-bold text-slate-500">
                            {day.totalHours} Hours Scheduled
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                          {day.focusTheme}
                        </h3>
                      </div>

                      {/* Daily Tip Callout */}
                      <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 max-w-md text-[11px] text-amber-800 dark:text-amber-300 leading-snug flex items-start gap-2">
                        <Flame className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <span><strong>Confidence Rule:</strong> {day.confidenceBoostTip}</span>
                      </div>
                    </div>

                    {/* Sessions Breakdown */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Targeted Daily Study Sessions
                      </h4>

                      <div className="grid grid-cols-1 gap-3">
                        {day.sessions.map((sess, sIdx) => {
                          const isDone = !!completedSessions[sess.id];
                          const subjColor = SUBJECT_COLORS[sess.subject] || SUBJECT_COLORS.Biology;

                          return (
                            <div
                              key={sess.id || sIdx}
                              className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                                isDone
                                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60'
                                  : 'bg-slate-50/60 dark:bg-slate-850/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                                <button
                                  onClick={() => toggleSessionCompletion(sess.id)}
                                  className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors cursor-pointer ${
                                    isDone
                                      ? 'bg-emerald-600 border-emerald-600 text-white'
                                      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-transparent hover:border-emerald-500'
                                  }`}
                                  title="Mark session done"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>

                                <div className="space-y-1.5 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
                                      {sess.timeSlot}
                                    </span>
                                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border ${subjColor.bg} ${subjColor.text} ${subjColor.border}`}>
                                      {sess.subject}
                                    </span>
                                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                      {sess.activityType}
                                    </span>
                                    <span className="text-[9px] font-mono font-semibold text-slate-400">
                                      {sess.durationMinutes} mins ({Math.round(sess.durationMinutes / 60 * 10) / 10}h)
                                    </span>
                                  </div>

                                  <h5 className={`text-sm font-bold ${isDone ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                                    {sess.chapter}
                                  </h5>

                                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                    {sess.taskDescription}
                                  </p>

                                  {/* High Yield Key Topics */}
                                  {sess.highYieldTopics && sess.highYieldTopics.length > 0 && (
                                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                      <span className="text-[9px] font-bold text-slate-400 uppercase">High Yield:</span>
                                      {sess.highYieldTopics.map((topic, tIdx) => (
                                        <span
                                          key={tIdx}
                                          className="text-[9.5px] font-medium px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                                        >
                                          {topic}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Target MCQ & Quick Log Button */}
                              <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                                <div className="text-right">
                                  <span className="text-[9px] text-slate-400 font-bold uppercase block">MCQ Goal</span>
                                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200">
                                    {sess.targetMcqs} Qs
                                  </span>
                                </div>

                                <button
                                  onClick={() => {
                                    if (onPreFillLogSession) {
                                      onPreFillLogSession(sess.chapter, sess.subject);
                                    } else {
                                      onNavigateToTab('log-session');
                                    }
                                  }}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap print:hidden"
                                  title="Log this study session in your tracker"
                                >
                                  <PlusCircle className="w-3.5 h-3.5 text-medical-500" />
                                  <span>Log Session</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Daily Checklist */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Day {day.dayNumber} Exit Criteria & Checklist
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {day.dailyChecklist.map((item, cIdx) => (
                          <div
                            key={cIdx}
                            className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-850/30 px-3 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-800/60"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-medical-500 shrink-0"></span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                );
              })}
          </div>

          {/* Full Week Printable View (Visible only during window.print()) */}
          <div className="hidden print:block space-y-6">
            <div className="border-b-2 border-slate-900 pb-3 mb-4">
              <h1 className="text-xl font-bold uppercase">{roadmap.title}</h1>
              <p className="text-xs text-slate-600 mt-1">{roadmap.overview}</p>
            </div>

            {roadmap.weeklySchedule.map(day => (
              <div key={day.dayNumber} className="border border-slate-300 p-4 rounded-lg mb-4 page-break-inside-avoid">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-sm">{day.dayLabel}: {day.focusTheme}</h3>
                  <span className="text-xs font-mono">{day.totalHours} hrs</span>
                </div>
                <div className="space-y-2 text-xs">
                  {day.sessions.map((sess, idx) => (
                    <div key={idx} className="border-l-2 border-slate-400 pl-2">
                      <strong>[{sess.subject}] {sess.chapter}</strong> - {sess.timeSlot} ({sess.durationMinutes}m)
                      <p className="text-[11px] text-slate-600">{sess.taskDescription} (Target: {sess.targetMcqs} MCQs)</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Weekly Milestones & Upgrade Criteria */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 md:p-6 border border-slate-800 shadow-md space-y-4 print:hidden">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white">
                Weekly Mastery & Confidence Upgrade Criteria
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Upon completing this 7-day schedule, take a 30-minute timed active recall quiz on each weak chapter. If your practice accuracy exceeds 80%, update the chapter status in your Syllabus Tracker to upgrade its confidence trend from <strong>Low</strong> to <strong>High</strong>.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              {roadmap.milestones.map((m, i) => (
                <div key={i} className="bg-slate-800/80 border border-slate-700/60 p-3 rounded-xl text-xs text-slate-200 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{m}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      ) : (
        /* Empty State Prompt when no roadmap generated yet */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 text-center space-y-4 shadow-sm print:hidden">
          <div className="w-16 h-16 rounded-2xl bg-medical-50 dark:bg-medical-950/50 border border-medical-200 dark:border-medical-800 text-medical-600 dark:text-medical-400 flex items-center justify-center mx-auto shadow-inner">
            <Compass className="w-8 h-8" />
          </div>

          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Ready to eliminate your study blindspots?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              We identified <strong>{selectedChapterNames.length} chapters</strong> with the lowest confidence levels in your database. Click below to generate your personalized 7-day weekly schedule.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={handleGenerateAiRoadmap}
              disabled={isGenerating}
              className="flex items-center gap-2 px-6 py-3 bg-medical-600 hover:bg-medical-500 text-white text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Generate AI Weekly Roadmap</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
