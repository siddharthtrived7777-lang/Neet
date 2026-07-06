/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, AlertCircle, CheckCircle, Clock, Award, ShieldAlert, CheckSquare, Sparkles, Filter, X } from 'lucide-react';
import { RevisionTask, NEETSubject, PriorityLevel } from '../types';
import { SUBJECT_COLORS } from '../neetData';
import { formatDate, addDays, daysBetween } from '../utils';

interface RevisionDashboardProps {
  revisions: RevisionTask[];
  onCompleteRevision: (id: string, accuracy: number, mcqsSolved: number, notes: string) => void;
  onMarkForgot: (id: string) => void;
}

export default function RevisionDashboard({ revisions, onCompleteRevision, onMarkForgot }: RevisionDashboardProps) {
  const [filterSubject, setFilterSubject] = useState<NEETSubject | 'All'>('All');
  const [filterPriority, setFilterPriority] = useState<PriorityLevel | 'All'>('All');
  
  // State for completing a revision inline
  const [selectedRevId, setSelectedRevId] = useState<string | null>(null);
  const [revAccuracy, setRevAccuracy] = useState<number>(85);
  const [revMcqsSolved, setRevMcqsSolved] = useState<number>(30);
  const [revNotes, setRevNotes] = useState<string>('');

  const todayStr = useMemo(() => formatDate(new Date()), []);
  const tomorrowStr = useMemo(() => addDays(todayStr, 1), [todayStr]);

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
            <p className="text-emerald-700/80 mt-0.5">Aura automatically delays subsequent revision sessions to optimize study balance.</p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
          <Clock className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-700 block">Typical Schedule (80-95%)</span>
            <p className="text-slate-500 mt-0.5">Retains core memory anchors at intervals of 1, 3, 7, 15, 30, 60, and 90 days.</p>
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
              <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                {groupedRevisions.next7Days.map(rev => (
                  <RevisionCard
                    key={rev.id}
                    rev={rev}
                    onComplete={() => handleOpenComplete(rev)}
                    onForgot={() => onMarkForgot(rev.id)}
                  />
                ))}
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
    </div>
  );
}

// Inner helper card for rendering individual tasks
interface CardProps {
  key?: string;
  rev: RevisionTask;
  onComplete: () => void;
  onForgot: () => void;
  isOverdue?: boolean;
}

function RevisionCard({ rev, onComplete, onForgot, isOverdue }: CardProps) {
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

        <h4 className="text-xs font-bold text-slate-800 leading-snug">{rev.chapterName}</h4>
        
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
      </div>
    </div>
  );
}
