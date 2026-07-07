/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Flame, Clock, Target, BookOpen, AlertCircle, Calendar, CheckSquare, Sparkles, Award, ArrowRight, Activity } from 'lucide-react';
import { StudyEntry, ChapterStatus, RevisionTask, TestEntry } from '../types';
import { SUBJECT_COLORS, getChapterSubject } from '../neetData';
import { formatDate, addDays, calculateStreaks } from '../utils';
import { calculateFocusInsight } from '../utils/focusInsight';

interface DashboardProps {
  entries: StudyEntry[];
  chapterStatuses: ChapterStatus[];
  revisions: RevisionTask[];
  tests: TestEntry[];
  onNavigateToTab: (tab: string) => void;
  onQuickCompleteRevision: (id: string) => void;
}

export default function Dashboard({
  entries,
  chapterStatuses,
  revisions,
  tests,
  onNavigateToTab,
  onQuickCompleteRevision
}: DashboardProps) {
  const todayStr = useMemo(() => formatDate(new Date()), []);

  // 1. Compute Streaks
  const streaks = useMemo(() => {
    return calculateStreaks(entries);
  }, [entries]);

  // Today's Focus Insight
  const focusData = useMemo(() => {
    return calculateFocusInsight(entries);
  }, [entries]);

  // 2. Today's Metrics
  const todayMetrics = useMemo(() => {
    let studyHrs = 0;
    let classHrs = 0;
    let selfHrs = 0;
    let revHrs = 0;
    let mcqs = 0;
    let correct = 0;

    entries.forEach(e => {
      if (e.date === todayStr) {
        const hrs = e.durationMinutes / 60;
        studyHrs += hrs;
        if (e.studyType === 'Class') classHrs += hrs;
        else if (e.studyType === 'Self Study') selfHrs += hrs;
        else if (e.studyType === 'Revision') revHrs += hrs;

        mcqs += e.mcqsSolved;
        correct += e.mcqsCorrect;
      }
    });

    const accuracy = mcqs > 0 ? Math.round((correct / mcqs) * 100) : 0;

    return { studyHrs, classHrs, selfHrs, revHrs, mcqs, accuracy };
  }, [entries, todayStr]);

  // 3. Periodic Totals
  const periodicStats = useMemo(() => {
    let weekHrs = 0;
    let monthHrs = 0;
    let lifetimeHrs = 0;

    const oneWeekAgo = addDays(todayStr, -7);
    const oneMonthAgo = addDays(todayStr, -30);

    entries.forEach(e => {
      const hrs = e.durationMinutes / 60;
      lifetimeHrs += hrs;

      if (e.date >= oneWeekAgo) weekHrs += hrs;
      if (e.date >= oneMonthAgo) monthHrs += hrs;
    });

    return { weekHrs, monthHrs, lifetimeHrs };
  }, [entries, todayStr]);

  // 4. Today's Spaced Revision Checklist ("Today's Tasks" notification)
  const todayRevisionTasks = useMemo(() => {
    return revisions.filter(r => !r.completed && r.dueDate <= todayStr);
  }, [revisions, todayStr]);

  // 5. Subject wise breakdown (Subject-wise hours)
  const subjectHrs = useMemo(() => {
    const hrs = { Physics: 0, Chemistry: 0, Biology: 0 };
    entries.forEach(e => {
      hrs[e.subject] += e.durationMinutes / 60;
    });
    return hrs;
  }, [entries]);

  // 6. Chapter-wise studied hours list (Top 5 studied)
  const topChapters = useMemo(() => {
    const chapMap = new Map<string, number>();
    entries.forEach(e => {
      const currentVal = chapMap.get(e.chapter) || 0;
      chapMap.set(e.chapter, currentVal + e.durationMinutes / 60);
    });

    return Array.from(chapMap.entries())
      .map(([chapter, hours]) => {
        // Find subject for color coding
        const found = chapterStatuses.find(c => c.chapterName === chapter);
        return {
          chapter,
          hours,
          subject: found?.subject || getChapterSubject(chapter)
        };
      })
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 5);
  }, [entries, chapterStatuses]);

  return (
    <div id="dashboard-section" className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-medical-800 via-medical-900 to-medical-950 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2 z-10 max-w-lg">
          <div className="flex items-center gap-1.5 text-medical-200 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-medical-300" /> NEET Preparation Console
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight">
            Welcome back, Aspirant.
          </h1>
          <p className="text-xs text-medical-200 leading-relaxed">
            Your spaced-repetition metrics are active. Record finished classes or mock drills to keep your memory retention calendar perfectly adapted.
          </p>
        </div>

        {/* Current Streak Indicator (Glowing Fire Widget) */}
        <div className="bg-white/10 backdrop-blur-xs border border-white/15 px-5 py-4 rounded-xl flex items-center gap-4 shrink-0 min-w-[200px] z-10">
          <div className="p-2.5 bg-amber-500 rounded-lg text-white shadow shadow-amber-500/50">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-medical-200 uppercase tracking-wider block">Active Streak</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-mono font-extrabold text-white">{streaks.currentStreak}</span>
              <span className="text-xs text-medical-300">days</span>
            </div>
            <span className="text-[9px] text-medical-200 block mt-0.5">Longest: {streaks.longestStreak} days</span>
          </div>
        </div>
      </div>

      {/* Internal Notification Box: "Today's Tasks" checklist */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4.5 h-4.5 text-medical-700" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Today's Tasks</h2>
          </div>
          <span className="text-[10px] font-mono font-bold bg-medical-50 text-medical-700 px-2 py-0.5 rounded-full">
            {todayRevisionTasks.length} Revision{todayRevisionTasks.length !== 1 ? 's' : ''} Scheduled
          </span>
        </div>

        {todayRevisionTasks.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs flex flex-col justify-center items-center gap-1.5">
            <CheckSquare className="w-8 h-8 text-slate-200" />
            <p className="font-medium text-slate-700">All revisions clear for today!</p>
            <p className="text-[10px] text-slate-400">Great job pacing your spaced repetitions.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {todayRevisionTasks.map(task => {
                const colors = SUBJECT_COLORS[task.subject] || SUBJECT_COLORS.Biology;
                return (
                  <div
                    key={task.id}
                    className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded font-mono uppercase tracking-wide ${colors.bg} ${colors.text}`}>
                          {task.subject}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono">Stage {task.stage}</span>
                      </div>
                      <span className="font-bold text-slate-700 block truncate leading-tight mt-1">{task.chapterName}</span>
                      {task.subtopics && (
                        <span className="text-[10px] text-slate-500 italic block truncate mt-0.5" title={task.subtopics}>
                          Topics: {task.subtopics}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => onQuickCompleteRevision(task.id)}
                      className="px-3 py-1.5 text-[10px] font-bold text-white bg-medical-700 hover:bg-medical-800 rounded-lg transition-all cursor-pointer shrink-0"
                    >
                      Complete
                    </button>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => onNavigateToTab('revisions')}
              className="text-xs text-medical-700 hover:text-medical-800 font-bold flex items-center gap-1.5 pt-2 cursor-pointer"
            >
              Open Interactive Revision Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Today's Focus Insight Card (placed directly below "Today's Tasks" checklist) */}
      <div 
        id="todays-focus-card"
        className={`rounded-2xl p-4 md:p-5 border transition-all duration-300 ${
          focusData.isImbalance 
            ? 'bg-gradient-to-r from-amber-50/60 to-orange-50/40 border-amber-200/60' 
            : 'bg-gradient-to-r from-emerald-50/50 to-teal-50/30 border-emerald-100/60'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`p-2 rounded-xl mt-0.5 shrink-0 shadow-sm ${
              focusData.isImbalance 
                ? 'bg-amber-100/80 text-amber-700' 
                : 'bg-emerald-100/80 text-emerald-700'
            }`}>
              {focusData.isImbalance ? (
                <Target className="w-4.5 h-4.5 animate-pulse" />
              ) : (
                <Sparkles className="w-4.5 h-4.5" />
              )}
            </div>
            <div className="space-y-1 min-w-0">
              <span className={`text-[10px] uppercase tracking-widest font-extrabold ${
                focusData.isImbalance ? 'text-amber-800' : 'text-emerald-800'
              }`}>
                {focusData.isImbalance ? "Today's Focus Recommendation" : "Weekly Balance Status"}
              </span>
              <p className="text-xs md:text-sm font-semibold text-slate-800 leading-normal">
                {focusData.insight}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateToTab('today-focus')}
            className={`text-xs font-bold px-3.5 py-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 ${
              focusData.isImbalance
                ? 'bg-white hover:bg-amber-50 text-amber-700 border-amber-200/50 shadow-sm'
                : 'bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-100/50 shadow-sm'
            }`}
          >
            <Activity className="w-3.5 h-3.5" /> Analyze Balance <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Grid of Key Performance Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Today's Stats Card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[220px]">
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Today's Study Load</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-mono font-extrabold text-slate-800">{todayMetrics.studyHrs.toFixed(1)}</span>
              <span className="text-xs text-slate-500 font-semibold">hours total</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-[10px] text-slate-500">
            <div>
              <span className="block text-[8px] text-slate-400 uppercase tracking-wide">Class</span>
              <span className="font-bold text-slate-700 font-mono">{todayMetrics.classHrs.toFixed(1)}h</span>
            </div>
            <div>
              <span className="block text-[8px] text-slate-400 uppercase tracking-wide">Self Study</span>
              <span className="font-bold text-slate-700 font-mono">{todayMetrics.selfHrs.toFixed(1)}h</span>
            </div>
            <div>
              <span className="block text-[8px] text-slate-400 uppercase tracking-wide">Revision</span>
              <span className="font-bold text-slate-700 font-mono">{todayMetrics.revHrs.toFixed(1)}h</span>
            </div>
          </div>
        </div>

        {/* Periodic Totals */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[220px]">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Progress Blocks</span>
            <div className="space-y-3.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">This Week:</span>
                <span className="font-mono font-bold text-slate-800">{periodicStats.weekHrs.toFixed(1)} hrs</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">This Month:</span>
                <span className="font-mono font-bold text-slate-800">{periodicStats.monthHrs.toFixed(1)} hrs</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Lifetime Prep:</span>
                <span className="font-mono font-bold text-slate-800">{periodicStats.lifetimeHrs.toFixed(1)} hrs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Subject wise Distribution card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[220px]">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Subject Time Allocation</span>
          
          <div className="space-y-3.5 py-1">
            {/* Biology */}
            <div>
              <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                <span className="flex items-center gap-1.5 text-emerald-700"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Biology</span>
                <span className="font-mono">{subjectHrs.Biology.toFixed(1)}h</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full"
                  style={{ width: `${periodicStats.lifetimeHrs > 0 ? (subjectHrs.Biology / periodicStats.lifetimeHrs) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Chemistry */}
            <div>
              <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                <span className="flex items-center gap-1.5 text-red-700"><span className="w-2 h-2 rounded-full bg-red-500" /> Chemistry</span>
                <span className="font-mono">{subjectHrs.Chemistry.toFixed(1)}h</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div
                  className="bg-red-500 h-1.5 rounded-full"
                  style={{ width: `${periodicStats.lifetimeHrs > 0 ? (subjectHrs.Chemistry / periodicStats.lifetimeHrs) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Physics */}
            <div>
              <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                <span className="flex items-center gap-1.5 text-blue-700"><span className="w-2 h-2 rounded-full bg-blue-500" /> Physics</span>
                <span className="font-mono">{subjectHrs.Physics.toFixed(1)}h</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div
                  className="bg-blue-500 h-1.5 rounded-full"
                  style={{ width: `${periodicStats.lifetimeHrs > 0 ? (subjectHrs.Physics / periodicStats.lifetimeHrs) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Top studied Chapters & Latest Mock Test score */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chapter studied (Left) */}
        <div className="lg:col-span-6 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-2.5">
            Top Studied Chapters
          </h3>

          {topChapters.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No studied chapters logged yet.</p>
          ) : (
            <div className="space-y-3">
              {topChapters.map(item => {
                const clr = SUBJECT_COLORS[item.subject] || SUBJECT_COLORS.Biology;
                return (
                  <div key={item.chapter} className="flex justify-between items-center text-xs p-1">
                    <div className="space-y-0.5 truncate flex-1 pr-4">
                      <span className="font-bold text-slate-700 block truncate leading-tight">{item.chapter}</span>
                      <span className={`inline-block text-[8px] font-bold px-1.5 py-0.1 rounded font-mono uppercase tracking-wide ${clr.bg} ${clr.text}`}>
                        {item.subject}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-slate-800 bg-slate-50 border border-slate-150 px-2 py-0.5 rounded text-[11px] shrink-0">
                      {item.hours.toFixed(1)} hours
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Latest Mock Scorecard (Right) */}
        <div className="lg:col-span-6 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between min-h-[220px]">
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-2.5 flex items-center gap-2">
              <Award className="w-4 h-4 text-medical-600" /> Latest Mock Scorecard
            </h3>

            {tests.length === 0 ? (
              <p className="text-xs text-slate-400 py-10 text-center flex-1 flex items-center justify-center">
                No mock scores recorded yet. Track full tests inside Mock Scorecard register.
              </p>
            ) : (
              (() => {
                const latestTest = [...tests].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                const pct = (latestTest.marks / latestTest.outOf) * 100;
                return (
                  <div className="space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <span className="font-bold text-slate-800 text-xs leading-snug">{latestTest.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono block">{latestTest.date}</span>
                      </div>

                      <div className="text-right">
                        <span className="text-lg font-mono font-extrabold text-medical-700">{latestTest.marks}/{latestTest.outOf}</span>
                        <span className={`text-[10px] font-mono font-bold block ${
                          pct >= 85 ? 'text-emerald-600' : pct >= 70 ? 'text-teal-600' : 'text-amber-600'
                        }`}>{pct.toFixed(1)}% Score</span>
                      </div>
                    </div>

                    {latestTest.wrongChapters.length > 0 && (
                      <div className="bg-slate-50 border border-dashed border-slate-200 p-2.5 rounded-xl text-[10px] text-slate-500 space-y-1">
                        <span className="font-bold text-rose-600 uppercase tracking-wider text-[9px] block">Error Diagnostic Chapters:</span>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {latestTest.wrongChapters.slice(0, 3).map(c => (
                            <span key={c} className="bg-white border border-slate-150 px-1.5 py-0.2 rounded text-[9px] text-slate-600 max-w-[150px] truncate" title={c}>
                              {c}
                            </span>
                          ))}
                          {latestTest.wrongChapters.length > 3 && <span>+{latestTest.wrongChapters.length - 3} more</span>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()
            )}
          </div>

          <button
            onClick={() => onNavigateToTab('mock-tests')}
            className="text-xs text-medical-700 hover:text-medical-800 font-bold flex items-center gap-1.5 pt-2 cursor-pointer mt-auto"
          >
            Register another Scorecard <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
