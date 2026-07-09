/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, AlertCircle, CheckCircle, Clock, Award, ShieldAlert, CheckSquare, Sparkles, Filter, X, TrendingUp, Activity, BarChart2, BookOpen, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { RevisionTask, NEETSubject, PriorityLevel } from '../types';
import { SUBJECT_COLORS } from '../neetData';
import { formatDate, addDays, daysBetween, getLogicalTodayDate } from '../utils';

interface RevisionDashboardProps {
  revisions: RevisionTask[];
  onCompleteRevision: (id: string, accuracy: number, mcqsSolved: number, notes: string) => void;
  onMarkForgot: (id: string) => void;
  onDeleteRevision: (id: string) => void;
}

export default function RevisionDashboard({ revisions, onCompleteRevision, onMarkForgot, onDeleteRevision }: RevisionDashboardProps) {
  const [filterSubject, setFilterSubject] = useState<NEETSubject | 'All'>('All');
  const [filterPriority, setFilterPriority] = useState<PriorityLevel | 'All'>('All');
  
  // State for completing a revision inline
  const [selectedRevId, setSelectedRevId] = useState<string | null>(null);
  const [revAccuracy, setRevAccuracy] = useState<number>(85);
  const [revMcqsSolved, setRevMcqsSolved] = useState<number>(30);
  const [revNotes, setRevNotes] = useState<string>('');

  const todayStr = useMemo(() => getLogicalTodayDate(), []);
  const tomorrowStr = useMemo(() => addDays(todayStr, 1), [todayStr]);

  // Interval Analysis (1, 3, 5, 7, 14, 21, 30 days based)
  const [selectedInterval, setSelectedInterval] = useState<number>(7);
  const intervalStats = useMemo(() => {
    const completedInWindow = revisions.filter(r => {
      if (!r.completed || !r.completedDate) return false;
      const diff = daysBetween(r.completedDate, todayStr);
      return diff >= 0 && diff <= selectedInterval;
    });

    const pendingInWindow = revisions.filter(r => {
      if (r.completed) return false;
      const diff = daysBetween(todayStr, r.dueDate);
      return diff >= 0 && diff <= selectedInterval;
    });

    const totalScheduled = completedInWindow.length + pendingInWindow.length;
    const completedCount = completedInWindow.length;
    const completionRate = totalScheduled > 0 ? Math.round((completedCount / totalScheduled) * 100) : 0;

    const accEntries = completedInWindow.filter(r => r.accuracyAtRevision !== null);
    const avgAccuracy = accEntries.length > 0
      ? Math.round(accEntries.reduce((acc, r) => acc + (r.accuracyAtRevision || 0), 0) / accEntries.length)
      : 0;

    const subjectDistribution: Record<NEETSubject, { completed: number; total: number }> = {
      Physics: { completed: 0, total: 0 },
      Chemistry: { completed: 0, total: 0 },
      Biology: { completed: 0, total: 0 }
    };

    completedInWindow.forEach(r => {
      if (subjectDistribution[r.subject]) {
        subjectDistribution[r.subject].completed++;
        subjectDistribution[r.subject].total++;
      }
    });

    pendingInWindow.forEach(r => {
      if (subjectDistribution[r.subject]) {
        subjectDistribution[r.subject].total++;
      }
    });

    let retentionScore = "No completed revisions in this window";
    let retentionColor = "text-slate-500 bg-slate-50 border-slate-200";
    if (completedInWindow.length > 0) {
      if (avgAccuracy >= 90) {
        retentionScore = "Excellent (Mastery Level)";
        retentionColor = "text-emerald-700 bg-emerald-50 border-emerald-100";
      } else if (avgAccuracy >= 80) {
        retentionScore = "Strong (Solid Retentiveness)";
        retentionColor = "text-blue-700 bg-blue-50 border-blue-100";
      } else if (avgAccuracy >= 65) {
        retentionScore = "Moderate (Needs Refinement)";
        retentionColor = "text-amber-700 bg-amber-50 border-amber-100";
      } else {
        retentionScore = "Critical (High Attrition)";
        retentionColor = "text-rose-700 bg-rose-50 border-rose-100";
      }
    }

    return {
      completedInWindow,
      pendingInWindow,
      totalScheduled,
      completedCount,
      completionRate,
      avgAccuracy,
      subjectDistribution,
      retentionScore,
      retentionColor
    };
  }, [revisions, selectedInterval, todayStr]);

  // Group revisions
  const groupedRevisions = useMemo(() => {
    const overdue: RevisionTask[] = [];
    const today: RevisionTask[] = [];
    const tomorrow: RevisionTask[] = [];
    const next7Days: RevisionTask[] = [];
    const future: RevisionTask[] = [];
    const completed: RevisionTask[] = [];

    revisions.forEach(rev => {
      // Filter out completed ones first
      if (rev.completed) {
        completed.push(rev);
        return;
      }

      // Filter by subject and priority
      if (filterSubject !== 'All' && rev.subject !== filterSubject) return;
      if (filterPriority !== 'All' && rev.priority !== filterPriority) return;

      const diff = daysBetween(todayStr, rev.dueDate);

      if (diff < 0) {
        overdue.push(rev);
      } else if (diff === 0) {
        today.push(rev);
      } else if (diff === 1) {
        tomorrow.push(rev);
      } else if (diff > 1 && diff <= 7) {
        next7Days.push(rev);
      } else {
        future.push(rev);
      }
    });

    // Sort overdue by most urgent, others by ascending due date
    overdue.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    today.sort((a, b) => (a.priority === 'High' ? -1 : 1));
    tomorrow.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    next7Days.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    return { overdue, today, tomorrow, next7Days, future, completed };
  }, [revisions, todayStr, filterSubject, filterPriority]);

  // State to track expanded dates for the Next 7 Days section
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  // Group next7Days by date
  const next7DaysGrouped = useMemo(() => {
    const groups: Record<string, RevisionTask[]> = {};
    groupedRevisions.next7Days.forEach(rev => {
      const dateStr = rev.dueDate;
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(rev);
    });
    // Sort dates ascending
    const sortedDates = Object.keys(groups).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    return sortedDates.map(dateStr => ({
      dateStr,
      revisions: groups[dateStr],
    }));
  }, [groupedRevisions.next7Days]);

  const isDateExpanded = (dateStr: string) => {
    if (expandedDates[dateStr] !== undefined) {
      return expandedDates[dateStr];
    }
    // Default to true for the earliest date in the 7 days list, false for others
    if (next7DaysGrouped.length > 0) {
      return dateStr === next7DaysGrouped[0].dateStr;
    }
    return false;
  };

  const toggleDateExpanded = (dateStr: string) => {
    setExpandedDates(prev => ({
      ...prev,
      [dateStr]: !isDateExpanded(dateStr)
    }));
  };

  const formatFriendlyDate = (dateStr: string) => {
    try {
      const dateObj = new Date(dateStr);
      const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'short', day: 'numeric' };
      return dateObj.toLocaleDateString('en-US', options);
    } catch (e) {
      return dateStr;
    }
  };

  // Handle open completion panel
  const handleOpenComplete = (rev: RevisionTask) => {
    setSelectedRevId(rev.id);
    setRevAccuracy(85);
    setRevMcqsSolved(30);
    setRevNotes('');
  };

  const handleConfirmComplete = () => {
    if (selectedRevId) {
      onCompleteRevision(selectedRevId, revAccuracy, revMcqsSolved, revNotes);
      setSelectedRevId(null);
    }
  };

  return (
    <div id="revision-dashboard-section" className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
            Intelligent Revision Spaced-Repetition System
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Adapts automatically to your syllabus milestones, forgetting curve targets, and practice accuracies.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-gradient-to-r from-medical-600 to-medical-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm">
          <Sparkles className="w-4 h-4" />
          <span>Active Cognitive Scheduling</span>
        </div>
      </div>

      {/* Spaced Repetition Rules Brief */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-50/50 border border-emerald-100 p-3.5 rounded-xl text-xs text-emerald-800 flex items-start gap-2.5">
          <Award className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Excellent accuracy (≥95%)</span>
            <p className="text-emerald-700/80 mt-0.5">The system automatically delays subsequent revision sessions to optimize study balance.</p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
          <Clock className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-700 block">Typical Schedule (80-95%)</span>
            <p className="text-slate-500 mt-0.5">Retains core memory anchors at intervals of 1, 3, 5, 7, 14, 21, and 30 days.</p>
          </div>
        </div>

        <div className="bg-amber-50/50 border border-amber-100 p-3.5 rounded-xl text-xs text-amber-800 flex items-start gap-2.5">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Concept Weakness (Below 80%)</span>
            <p className="text-amber-700/80 mt-0.5">Brings remaining reviews forward and schedules next active revision sooner.</p>
          </div>
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Filter className="w-4 h-4 text-slate-400" /> Filters
        </div>

        <div className="flex flex-wrap gap-3">
          <div>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value as NEETSubject | 'All')}
              className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl px-3 py-1.5 outline-none focus:border-medical-500 focus:bg-white"
            >
              <option value="All">All Subjects</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Biology">Biology</option>
            </select>
          </div>

          <div>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as PriorityLevel | 'All')}
              className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl px-3 py-1.5 outline-none focus:border-medical-500 focus:bg-white"
            >
              <option value="All">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
          </div>
        </div>
      </div>

      {/* Revision Buckets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Overdue and Today's */}
        <div className="space-y-6">
          {/* Overdue */}
          <div className="bg-white rounded-2xl border border-rose-100 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-rose-50 pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 animate-pulse" />
                <h2 className="text-sm font-bold text-rose-800 uppercase tracking-wider">Overdue Revisions</h2>
              </div>
              <span className="text-[10px] font-mono font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full">
                {groupedRevisions.overdue.length} Chapter{groupedRevisions.overdue.length !== 1 ? 's' : ''}
              </span>
            </div>

            {groupedRevisions.overdue.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No overdue revisions. Excellent consistency!</p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {groupedRevisions.overdue.map(rev => (
                  <RevisionCard
                    key={rev.id}
                    rev={rev}
                    onComplete={() => handleOpenComplete(rev)}
                    onForgot={() => onMarkForgot(rev.id)}
                    onDelete={() => onDeleteRevision(rev.id)}
                    isOverdue
                  />
                ))}
              </div>
            )}
          </div>

          {/* Today's Tasks */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-medical-600" />
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Today's Active Revisions</h2>
              </div>
              <span className="text-[10px] font-mono font-bold bg-medical-50 text-medical-700 px-2 py-0.5 rounded-full">
                {groupedRevisions.today.length} Due
              </span>
            </div>

            {groupedRevisions.today.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <p className="text-xs">No core revisions due today.</p>
                <p className="text-[10px] text-slate-400 mt-1">Great job staying ahead of your forgetting curve!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {groupedRevisions.today.map(rev => (
                  <RevisionCard
                    key={rev.id}
                    rev={rev}
                    onComplete={() => handleOpenComplete(rev)}
                    onForgot={() => onMarkForgot(rev.id)}
                    onDelete={() => onDeleteRevision(rev.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Tomorrow and Next 7 Days */}
        <div className="space-y-6">
          {/* Tomorrow */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Tomorrow's Agenda</h2>
              </div>
              <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                {groupedRevisions.tomorrow.length} Scheduled
              </span>
            </div>

            {groupedRevisions.tomorrow.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No revisions scheduled for tomorrow.</p>
            ) : (
              <div className="space-y-3">
                {groupedRevisions.tomorrow.map(rev => (
                  <RevisionCard
                    key={rev.id}
                    rev={rev}
                    onComplete={() => handleOpenComplete(rev)}
                    onForgot={() => onMarkForgot(rev.id)}
                    onDelete={() => onDeleteRevision(rev.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Next 7 Days */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Next 7 Days</h2>
              </div>
              <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                {groupedRevisions.next7Days.length} Upcoming
              </span>
            </div>

            {groupedRevisions.next7Days.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Clear horizon for the next week.</p>
            ) : (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {next7DaysGrouped.map(({ dateStr, revisions: dateRevs }) => {
                  const isExpanded = isDateExpanded(dateStr);
                  return (
                    <div key={dateStr} className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50/40">
                      <button
                        type="button"
                        onClick={() => toggleDateExpanded(dateStr)}
                        className="w-full text-left px-3.5 py-2.5 bg-slate-100/60 hover:bg-slate-100 transition-all flex items-center justify-between border-b border-slate-100"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </span>
                          <span className="text-xs font-bold text-slate-700 tracking-tight">
                            {formatFriendlyDate(dateStr)}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono font-bold bg-white text-slate-600 border border-slate-200/60 px-1.5 py-0.5 rounded-full shadow-2xs">
                          {dateRevs.length} {dateRevs.length === 1 ? 'Task' : 'Tasks'}
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="p-2.5 space-y-2.5 bg-white">
                          {dateRevs.map(rev => (
                            <RevisionCard
                              key={rev.id}
                              rev={rev}
                              onComplete={() => handleOpenComplete(rev)}
                              onForgot={() => onMarkForgot(rev.id)}
                              onDelete={() => onDeleteRevision(rev.id)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Completion Dialog / Sheet Modal */}
      <AnimatePresence>
        {selectedRevId && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 text-slate-800"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-display font-bold text-base text-slate-800">Complete Revision Study</h3>
                <button
                  onClick={() => setSelectedRevId(null)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <p className="text-slate-500 leading-relaxed">
                  Completing this task will automatically generate a corresponding revision study entry in your logs and adapt future spaced-repetition schedules based on your accuracy!
                </p>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-600">MCQs Attempted during Revision</label>
                  <input
                    type="number"
                    min="1"
                    value={revMcqsSolved}
                    onChange={(e) => setRevMcqsSolved(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none font-mono font-bold text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <label className="font-semibold text-slate-600">Practice Accuracy achieved</label>
                    <span className="font-mono font-bold text-medical-700">{revAccuracy}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={revAccuracy}
                    onChange={(e) => setRevAccuracy(Number(e.target.value))}
                    className="w-full accent-medical-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>0% (Poor)</span>
                    <span>80% (Normal)</span>
                    <span>100% (Elite)</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-600">Revision Notes</label>
                  <textarea
                    placeholder="NCERT key formulas reviewed, critical mistakes caught..."
                    value={revNotes}
                    onChange={(e) => setRevNotes(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2 text-xs font-semibold">
                <button
                  onClick={() => setSelectedRevId(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmComplete}
                  className="px-4 py-2 bg-medical-700 hover:bg-medical-800 text-white rounded-lg transition-all shadow-sm"
                >
                  Log Completion
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Spaced Repetition Interval Analysis (1, 3, 5, 7 ... 30 Days based) */}
      <div id="spaced-repetition-interval-analysis" className="bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-medical-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-800">Spaced Repetition Cognitive Analytics</h3>
              <p className="text-[10px] text-slate-400 font-medium">Analyze learning retention & revision completion schedules over custom windows</p>
            </div>
          </div>

          {/* Day Interval Selector Buttons */}
          <div className="flex flex-wrap gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/30">
            {[1, 3, 5, 7, 14, 21, 30].map(days => (
              <button
                key={days}
                onClick={() => setSelectedInterval(days)}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  selectedInterval === days
                    ? 'bg-white text-medical-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                }`}
              >
                {days} {days === 1 ? 'Day' : 'Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Analytics Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Metric 1: Revision Schedule load */}
          <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-medical-50 text-medical-600 shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div className="space-y-1 min-w-0">
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block">Revision Load</span>
              <span className="text-lg font-mono font-black text-slate-800 block leading-tight">
                {intervalStats.completedCount} / {intervalStats.totalScheduled} Completed
              </span>
              <div className="flex items-center gap-1.5 pt-1.5">
                <div className="w-20 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-medical-500 h-full" style={{ width: `${intervalStats.completionRate}%` }}></div>
                </div>
                <span className="text-[9px] font-mono font-bold text-slate-500">{intervalStats.completionRate}% Done</span>
              </div>
            </div>
          </div>

          {/* Metric 2: Average Revision Accuracy */}
          <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="space-y-1 min-w-0">
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block">Avg Recall Accuracy</span>
              <span className="text-lg font-mono font-black text-slate-800 block leading-tight">
                {intervalStats.avgAccuracy > 0 ? `${intervalStats.avgAccuracy}%` : 'N/A'}
              </span>
              <span className="text-[9px] text-slate-400 block pt-1 leading-normal font-medium">
                {intervalStats.avgAccuracy >= 85 
                  ? "Indicates strong neural consolidation." 
                  : intervalStats.avgAccuracy > 0 
                  ? "Requires minor conceptual review." 
                  : "No completions recorded in window."}
              </span>
            </div>
          </div>

          {/* Metric 3: Cognitive Retention State */}
          <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div className="space-y-1 min-w-0">
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block">Retention Category</span>
              <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border ${intervalStats.retentionColor} mt-0.5`}>
                {intervalStats.retentionScore}
              </span>
              <span className="text-[9px] text-slate-400 block pt-1.5 leading-normal font-medium">
                Based on active spaced repetition logs.
              </span>
            </div>
          </div>
        </div>

        {/* Subject wise Distribution Progress Bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-4">
            <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Subject Distribution in this {selectedInterval}-Day Window</h4>
            
            <div className="space-y-3">
              {(['Physics', 'Chemistry', 'Biology'] as NEETSubject[]).map(subj => {
                const subStats = intervalStats.subjectDistribution[subj];
                const clrs = SUBJECT_COLORS[subj] || SUBJECT_COLORS.Biology;
                const percent = subStats.total > 0 ? Math.round((subStats.completed / subStats.total) * 100) : 0;

                return (
                  <div key={subj} className="space-y-1.5 bg-slate-50/30 p-2.5 rounded-xl border border-slate-100/60">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700 flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${clrs.bg}`}></span>
                        {subj}
                      </span>
                      <span className="font-mono text-[10px] font-semibold text-slate-500">
                        {subStats.completed} / {subStats.total} Revisions Done ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${clrs.bg}`} 
                        style={{ width: `${subStats.total > 0 ? (subStats.completed / subStats.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Logged Revisions Listing inside this window */}
          <div className="space-y-4">
            <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Completions recorded in this {selectedInterval}-Day Window</h4>

            {intervalStats.completedInWindow.length === 0 ? (
              <div className="h-[148px] bg-slate-50/50 border border-slate-100 border-dashed rounded-xl flex flex-col items-center justify-center text-center p-4">
                <BookOpen className="w-5 h-5 text-slate-300 mb-1" />
                <p className="text-xs font-semibold text-slate-400 leading-normal">No revisions completed yet</p>
                <p className="text-[9px] text-slate-400 max-w-[220px] leading-relaxed">Completing due revisions above will automatically populate this cognitive timeline.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[148px] overflow-y-auto pr-1">
                {intervalStats.completedInWindow.map(task => (
                  <div key={task.id} className="p-2.5 bg-emerald-50/20 border border-emerald-100/40 rounded-xl flex items-center justify-between text-xs">
                    <div className="min-w-0">
                      <span className="font-bold text-slate-700 block truncate leading-tight">{task.chapterName}</span>
                      {task.subtopics && (
                        <span className="text-[10px] text-slate-500 italic block truncate">
                          {task.subtopics}
                        </span>
                      )}
                      <span className="text-[9px] text-slate-400 font-mono">Stage {task.stage} • Done {task.completedDate}</span>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-[10px] font-mono font-extrabold text-emerald-600 block leading-tight">{task.accuracyAtRevision}%</span>
                      <span className="text-[8px] text-slate-400">Score</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Inner helper card for rendering individual tasks
interface CardProps {
  key?: string;
  rev: RevisionTask;
  onComplete: () => void;
  onForgot: () => void;
  onDelete: () => void;
  isOverdue?: boolean;
}

function RevisionCard({ rev, onComplete, onForgot, onDelete, isOverdue }: CardProps) {
  const clr = SUBJECT_COLORS[rev.subject] || SUBJECT_COLORS.Biology;
  
  return (
    <div className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
      isOverdue 
        ? 'bg-rose-50/40 border-rose-100 hover:border-rose-200 hover:bg-white'
        : 'bg-slate-50 border-slate-200/60 hover:bg-white hover:border-slate-300 hover:shadow-xs'
    }`}>
      <div className="space-y-1.5 flex-1">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${clr.bg} ${clr.text}`}>
            {rev.subject}
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            Stage {rev.stage} • Due: {rev.dueDate}
          </span>
          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono uppercase tracking-wide ${
            rev.priority === 'High' 
              ? 'bg-rose-100 text-rose-700'
              : rev.priority === 'Medium'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-slate-100 text-slate-600'
          }`}>
            {rev.priority} Priority
          </span>
        </div>

        <div className="flex flex-wrap items-baseline gap-1.5">
          <h4 className="text-xs font-bold text-slate-800 leading-snug">{rev.chapterName}</h4>
          {rev.subtopics && (
            <span className="text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-md px-1.5 py-0.5 font-medium leading-none" title={`Topics: ${rev.subtopics}`}>
              {rev.subtopics}
            </span>
          )}
        </div>
        
        {isOverdue && (
          <p className="text-[10px] text-rose-600 font-medium flex items-center gap-1">
            <Clock className="w-3 h-3 shrink-0" /> Overdue by {daysBetween(rev.dueDate, formatDate(new Date()))} days!
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onForgot}
          className="px-2.5 py-1.5 text-[11px] font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 rounded-lg border border-rose-200 hover:border-rose-600 transition-all cursor-pointer"
          title="Reschedule this revision immediately for tomorrow"
        >
          I Forgot
        </button>

        <button
          onClick={onComplete}
          className="px-3 py-1.5 text-[11px] font-bold text-white bg-medical-700 hover:bg-medical-800 rounded-lg border border-medical-700 hover:border-medical-800 transition-all cursor-pointer flex items-center gap-1 shadow-xs"
        >
          <CheckSquare className="w-3.5 h-3.5" /> Checked
        </button>

        <button
          onClick={onDelete}
          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200/60 hover:border-rose-200 transition-all cursor-pointer"
          title="Delete this revision task"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
