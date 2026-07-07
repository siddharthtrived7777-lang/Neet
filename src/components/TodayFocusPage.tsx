import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Target, Sparkles, BookOpen, Clock, Calendar, CheckSquare, ChevronRight, ArrowRight, AlertTriangle, Lightbulb, PlayCircle, BarChart, Heart } from 'lucide-react';
import { StudyEntry, ChapterStatus, RevisionTask } from '../types';
import { calculateFocusInsight, FocusStats } from '../utils/focusInsight';
import { SUBJECT_COLORS } from '../neetData';

interface TodayFocusPageProps {
  entries: StudyEntry[];
  chapterStatuses: ChapterStatus[];
  revisions: RevisionTask[];
  onNavigateToTab: (tab: string) => void;
  onSetSearchQuery?: (query: string) => void;
}

export default function TodayFocusPage({
  entries,
  chapterStatuses,
  revisions,
  onNavigateToTab,
  onSetSearchQuery
}: TodayFocusPageProps) {
  const focusData = useMemo(() => {
    return calculateFocusInsight(entries);
  }, [entries]);

  // Find recommended chapters to study in the recommended focus subject
  const recommendations = useMemo(() => {
    const focusSubj = focusData.primaryFocusSubject || 'Biology';
    
    // 1. Find chapters in that subject that have outstanding revisions
    const pendingRevs = revisions
      .filter(r => r.subject === focusSubj && !r.completed)
      .slice(0, 3);

    // 2. Find chapters in that subject that have low average accuracy in statuses
    const weakStatuses = chapterStatuses
      .filter(c => c.subject === focusSubj && c.status !== 'Not Started' && c.averageAccuracy > 0 && c.averageAccuracy < 65)
      .sort((a, b) => a.averageAccuracy - b.averageAccuracy)
      .slice(0, 2);

    // 3. Find chapters that are not started
    const unstarted = chapterStatuses
      .filter(c => c.subject === focusSubj && c.status === 'Not Started')
      .slice(0, 2);

    return {
      pendingRevs,
      weakStatuses,
      unstarted,
      subject: focusSubj
    };
  }, [focusData.primaryFocusSubject, revisions, chapterStatuses]);

  const getSubjectIconColor = (subject: string) => {
    switch (subject) {
      case 'Physics': return 'text-sky-600 bg-sky-50 border-sky-100';
      case 'Chemistry': return 'text-purple-600 bg-purple-50 border-purple-100';
      default: return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* Dynamic Header Promo Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-6 md:p-8 shadow-xl border border-slate-800">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-medical-500/10 rounded-full blur-3xl"></div>
        <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-amber-500/5 rounded-full blur-2xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/50 text-xs font-bold text-amber-400">
              <Target className="w-3.5 h-3.5 animate-pulse" />
              <span>Syllabus Balance Engine</span>
            </div>
            <h2 className="text-xl md:text-2xl font-display font-black tracking-tight leading-tight">
              NEET Subject Equilibrium Monitor
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              A balanced prep routine across Physics, Chemistry, and Biology is statistically the highest contributor to NEET selection. This screen tracks your relative efforts over the past 7 days to eliminate hidden study blindspots.
            </p>
          </div>

          <div className="bg-slate-850/80 border border-slate-800 rounded-2xl p-4 md:p-5 shrink-0 text-center min-w-[160px] shadow-inner">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">7-Day Study Effort</span>
            <span className="text-3xl font-mono font-black text-medical-400 block mt-1">{focusData.totalHours}h</span>
            <span className="text-[9px] text-slate-400 block mt-1.5">{focusData.totalRevisions} Spaced Revisions</span>
          </div>
        </div>
      </div>

      {/* Main Focus Insight Card */}
      <div className={`p-5 md:p-6 rounded-2xl border ${
        focusData.isImbalance 
          ? 'bg-amber-50/50 border-amber-200' 
          : 'bg-emerald-50/40 border-emerald-100'
      }`}>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl shadow-sm ${
            focusData.isImbalance ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
          }`}>
            {focusData.isImbalance ? <AlertTriangle className="w-6 h-6 animate-bounce" /> : <Sparkles className="w-6 h-6" />}
          </div>
          <div className="space-y-1.5">
            <h3 className={`text-xs uppercase tracking-widest font-extrabold ${
              focusData.isImbalance ? 'text-amber-800' : 'text-emerald-800'
            }`}>
              {focusData.isImbalance ? "Identified Prep Imbalance" : "Prep Status: Optimal Equilibrium"}
            </h3>
            <p className="text-sm md:text-base font-bold text-slate-800 leading-snug">
              {focusData.insight}
            </p>
            <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
              {focusData.isImbalance 
                ? "Your preparation has drifted towards specific subjects this week. While diving deep into chapters is excellent, long-term memory decay occurs quickly on ignored topics. Spend at least 30 minutes on the recommendation below."
                : "Excellent work! Your weekly hours logged are well distributed across Physics, Chemistry, and Biology. Keeping this balance prevents cognitive fatigue and optimizes score outcomes."}
            </p>
          </div>
        </div>
      </div>

      {/* Subject Stats Grid */}
      <div className="space-y-4">
        <h3 className="text-xs uppercase tracking-widest font-extrabold text-slate-400">7-Day Activity Matrix</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {focusData.stats.map(stat => {
            const isTarget = focusData.primaryFocusSubject === stat.subject;
            const colors = SUBJECT_COLORS[stat.subject];
            const iconStyle = getSubjectIconColor(stat.subject);

            return (
              <div 
                key={stat.subject}
                className={`bg-white rounded-2xl p-5 border shadow-sm transition-all flex flex-col justify-between ${
                  isTarget ? 'ring-2 ring-amber-500/80 border-transparent shadow-md' : 'border-slate-100'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold ${iconStyle}`}>
                        {stat.subject[0]}
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-800 text-xs block leading-tight">{stat.subject}</span>
                        <span className="text-[9px] text-slate-400 font-mono">Last 7 Days</span>
                      </div>
                    </div>

                    {isTarget && (
                      <span className="text-[8px] bg-amber-500 text-white font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                        Focus Area
                      </span>
                    )}
                  </div>

                  {/* Stats Content */}
                  <div className="grid grid-cols-2 gap-4 py-4 text-center">
                    <div className="bg-slate-50 rounded-xl p-2.5">
                      <span className="text-[9px] text-slate-400 block font-semibold uppercase tracking-wider">Hours Logged</span>
                      <span className="text-xl font-mono font-black text-slate-700 block mt-1">{stat.hours}h</span>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2.5">
                      <span className="text-[9px] text-slate-400 block font-semibold uppercase tracking-wider">Revisions Done</span>
                      <span className="text-xl font-mono font-black text-slate-700 block mt-1">{stat.revisions}x</span>
                    </div>
                  </div>
                </div>

                {/* Progress Visualizer */}
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500">
                    <span>Prep Allocation:</span>
                    <span className="font-mono font-bold text-slate-800">{stat.percentageOfTotal}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${colors.bg}`}
                      style={{ width: `${stat.percentageOfTotal}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommended Session Plan (Only visible when there's a primaryFocusSubject) */}
      {focusData.primaryFocusSubject && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
            <Lightbulb className="text-amber-500 w-5 h-5 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-slate-800 leading-tight">Focus Recovery Action Plan: {recommendations.subject}</h3>
              <p className="text-[10px] text-slate-400 font-medium">Auto-generated recommendations from your syllabus track</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Revision tasks pending or unstarted */}
            <div className="space-y-3.5">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">Pending Revisions (High Priority)</span>
              
              {recommendations.pendingRevs.length === 0 ? (
                <p className="text-xs text-slate-500 leading-relaxed font-medium bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  No overdue spaced repetition tasks found for this subject. All revisions are currently logged on schedule!
                </p>
              ) : (
                <div className="space-y-2.5">
                  {recommendations.pendingRevs.map(rev => (
                    <div key={rev.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs hover:bg-slate-100/50 transition-colors">
                      <div className="min-w-0">
                        <span className="font-bold text-slate-700 block truncate leading-snug">{rev.chapterName}</span>
                        <span className="text-[9px] text-slate-400 font-mono">Stage {rev.stage} • Due {rev.dueDate}</span>
                      </div>
                      <button 
                        onClick={() => onNavigateToTab('revisions')}
                        className="px-3 py-1 bg-medical-50 text-medical-700 border border-medical-100 hover:bg-medical-100 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-0.5 shrink-0"
                      >
                        Revise <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Weak Chapters or Unstarted Chapters */}
            <div className="space-y-3.5">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">Weak / Unstarted Chapters</span>
              <div className="space-y-2.5">
                {/* Weak chapters */}
                {recommendations.weakStatuses.map(chap => (
                  <div key={chap.chapterName} className="p-3 bg-rose-50/30 border border-rose-100/40 rounded-xl flex items-center justify-between text-xs">
                    <div className="min-w-0">
                      <span className="font-bold text-slate-700 block truncate leading-snug">{chap.chapterName}</span>
                      <span className="text-[9px] text-rose-600 font-semibold font-mono">Avg Accuracy: {chap.averageAccuracy}% (Low Score)</span>
                    </div>
                    <button 
                      onClick={() => {
                        if (onSetSearchQuery) {
                          onSetSearchQuery(chap.chapterName);
                          onNavigateToTab('search');
                        }
                      }}
                      className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-100 rounded-lg text-[10px] font-bold transition-all cursor-pointer shrink-0"
                    >
                      Solve PYQ
                    </button>
                  </div>
                ))}

                {/* Unstarted */}
                {recommendations.unstarted.map(chap => (
                  <div key={chap.chapterName} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs hover:bg-slate-100/50 transition-colors">
                    <div className="min-w-0">
                      <span className="font-bold text-slate-700 block truncate leading-snug">{chap.chapterName}</span>
                      <span className="text-[9px] text-slate-400 font-medium">Syllabus Status: Not Started Yet</span>
                    </div>
                    <button 
                      onClick={() => {
                        if (onSetSearchQuery) {
                          onSetSearchQuery(chap.chapterName);
                          onNavigateToTab('search');
                        }
                      }}
                      className="px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer shrink-0"
                    >
                      Explore
                    </button>
                  </div>
                ))}

                {recommendations.weakStatuses.length === 0 && recommendations.unstarted.length === 0 && (
                  <p className="text-xs text-slate-500 leading-relaxed font-medium bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                    Excellent! All chapters in {recommendations.subject} are started and logged with high comprehension scores.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Prompt Action Shortcut */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <span className="font-medium">Ready to balance your schedule right now?</span>
            <button
              onClick={() => onNavigateToTab('log-session')}
              className="flex items-center gap-1.5 px-4.5 py-2.5 bg-medical-700 hover:bg-medical-800 text-white font-bold rounded-xl transition-all shadow-md shadow-medical-700/10 cursor-pointer"
            >
              <PlayCircle className="w-4 h-4" /> Start Focus Study Session
            </button>
          </div>
        </div>
      )}

      {/* Self Care / NEET Tip */}
      <div className="bg-slate-50 border border-slate-200/40 rounded-2xl p-4 flex items-center gap-3 text-xs text-slate-500 leading-relaxed font-medium">
        <Heart className="w-5 h-5 text-rose-500 shrink-0" />
        <p>
          <strong>Medical Prep Tip:</strong> Keep your sessions modular. A healthy daily rotation (e.g., 2 hours Physics, 2 hours Chemistry, 1.5 hours Biology revision) is statistically proven to be 300% more effective than cramming a single subject for 15 hours straight.
        </p>
      </div>

    </div>
  );
}
