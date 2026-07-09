/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Clock, Target, BookOpen, AlertCircle, Calendar, CheckSquare, Sparkles, Award, ArrowRight, Activity, Quote, Plus, Trash2, Check } from 'lucide-react';
import { StudyEntry, ChapterStatus, RevisionTask, TestEntry, NEETSubject } from '../types';
import { SUBJECT_COLORS, getChapterSubject } from '../neetData';
import { formatDate, addDays, getLogicalTodayDate, formatMinutesToDecimalHours, formatMinutesToDecimalHoursNum } from '../utils';
import { calculateFocusInsight } from '../utils/focusInsight';

const NEET_MOTIVATIONAL_THOUGHTS = [
  "Consistency is the bridge between NEET goals and NEET success. Stay focused on your daily chapters!",
  "Every single numerical solved in Physics brings you one step closer to your dream medical college.",
  "Success in NEET isn't about luck. It is about reading NCERT line-by-line, revising consistently, and mastering your mistakes.",
  "The pain of studying today is nothing compared to the pride of wearing that white coat and stethoscope tomorrow.",
  "Do not count the hours you study, make the hours count. Revise Chemistry formulas and focus on your goal.",
  "Biology demands precision and retention. Unblock your spaced revisions today to secure those 360 marks!",
  "Mistakes are proof that you are trying. Analyze your mock tests, understand the concepts, and keep moving forward.",
  "The difference between an ordinary aspirant and a NEET topper is what they do with their mock test mistakes.",
  "Your dedication today determines your rank tomorrow. One chapter at a time, one day at a time, keep going!",
  "Success doesn't come from what you do occasionally, it comes from what you do consistently.",
  "When you feel like quitting, remember why you started this medical preparation journey in the first place.",
  "Syllabus tracking and timely active recall are your ultimate weapons against forgetting curves. Trust the process.",
  "Focus on progress, not perfection. Master your weak subjects today to build an unbreakable foundation.",
  "A year of intense focus, discipline, and regular revision can change the trajectory of your entire life.",
  "Every small study session is a deposit into your future medical career. Make today count!",
  "Do not let what you cannot do interfere with what you can do. Strengthen your weak chapters now.",
  "The best way to predict your NEET result is to create it through daily discipline and smart spacing.",
  "Your dream medical college is waiting for you. Power through the revision and keep your concepts crystal clear.",
  "An investment in knowledge always pays the best interest. Read NCERT, solve MCQs, and stay self-motivated.",
  "Strive for excellence, and success will chase you. Master every difficult mechanism in Chemistry today.",
  "Your only limit is your mind. Push yourself to finish today's focus chapters with high accuracy.",
  "Preparation is the key to confidence. The more you revise today, the less you will panic on the exam day.",
  "Hard work beats talent when talent doesn't work hard. Keep practicing your Physics numericals.",
  "Believe you can and you're halfway there. Keep logging your study hours and reviewing regularly.",
  "Your daily study logs build the brick-and-mortar of your medical dream. Stay consistent, stay strong!",
  "NCERT is your ultimate guide. Read between the lines, solve NCERT exemplar questions, and solidify your grip.",
  "Every mock test is a dress rehearsal for your NEET success. Celebrate the correct ones, study the wrong ones.",
  "Active recall and spaced repetition are the science of remembering. Let the retention engine guide your study day.",
  "Patience, persistence, and perspiration make an unbeatable combination for cracking NEET.",
  "Don't stop when you are tired, stop when you are done. Your medical career begins with today's efforts.",
  "A champion is defined not by their wins, but by how they recover from their setbacks. Keep pushing, Aspirant!"
];

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
  const todayStr = useMemo(() => getLogicalTodayDate(), []);
  const tomorrowStr = useMemo(() => addDays(todayStr, 1), [todayStr]);

  // Load custom goals from localStorage
  const [customGoals, setCustomGoals] = useState<{ id: string; text: string; completed: boolean; date: string; subject?: NEETSubject }[]>(() => {
    const local = localStorage.getItem('neet_custom_goals');
    return local ? JSON.parse(local) : [];
  });

  const [newGoalText, setNewGoalText] = useState('');
  const [newGoalSubject, setNewGoalSubject] = useState<NEETSubject | 'General'>('General');

  const saveCustomGoals = (updated: typeof customGoals) => {
    setCustomGoals(updated);
    localStorage.setItem('neet_custom_goals', JSON.stringify(updated));
  };

  const handleAddTomorrowGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalText.trim()) return;

    const newGoal = {
      id: Math.random().toString(36).substring(2, 11),
      text: newGoalText.trim(),
      completed: false,
      date: tomorrowStr,
      subject: newGoalSubject === 'General' ? undefined : newGoalSubject
    };

    saveCustomGoals([...customGoals, newGoal]);
    setNewGoalText('');
    setNewGoalSubject('General');
  };

  const handleToggleGoal = (id: string) => {
    const updated = customGoals.map(g => g.id === id ? { ...g, completed: !g.completed } : g);
    saveCustomGoals(updated);
  };

  const handleDeleteGoal = (id: string) => {
    const updated = customGoals.filter(g => g.id !== id);
    saveCustomGoals(updated);
  };

  const todayCustomGoals = useMemo(() => {
    return customGoals.filter(g => g.date === todayStr);
  }, [customGoals, todayStr]);

  const tomorrowCustomGoals = useMemo(() => {
    return customGoals.filter(g => g.date === tomorrowStr);
  }, [customGoals, tomorrowStr]);

  const tomorrowRevisionTasks = useMemo(() => {
    return revisions.filter(r => !r.completed && r.dueDate === tomorrowStr);
  }, [revisions, tomorrowStr]);

  // Daily new motivational thoughts based on the calendar date
  const dailyThought = useMemo(() => {
    const day = new Date().getDate();
    return NEET_MOTIVATIONAL_THOUGHTS[(day - 1) % NEET_MOTIVATIONAL_THOUGHTS.length];
  }, []);

  // Today's Focus Insight
  const focusData = useMemo(() => {
    return calculateFocusInsight(entries);
  }, [entries]);

  // 2. Today's Metrics (accumulating minutes)
  const todayMetrics = useMemo(() => {
    let studyMins = 0;
    let classMins = 0;
    let selfMins = 0;
    let revMins = 0;
    let mcqs = 0;
    let correct = 0;

    entries.forEach(e => {
      if (e.date === todayStr) {
        studyMins += e.durationMinutes;
        if (e.studyType === 'Class') classMins += e.durationMinutes;
        else if (e.studyType === 'Self Study') selfMins += e.durationMinutes;
        else if (e.studyType === 'Revision') revMins += e.durationMinutes;

        mcqs += e.mcqsSolved;
        correct += e.mcqsCorrect;
      }
    });

    const accuracy = mcqs > 0 ? Math.round((correct / mcqs) * 100) : 0;

    return {
      studyMins,
      classMins,
      selfMins,
      revMins,
      studyHrsNum: formatMinutesToDecimalHoursNum(studyMins),
      classHrsNum: formatMinutesToDecimalHoursNum(classMins),
      selfHrsNum: formatMinutesToDecimalHoursNum(selfMins),
      revHrsNum: formatMinutesToDecimalHoursNum(revMins),
      mcqs,
      accuracy
    };
  }, [entries, todayStr]);

  // 3. Periodic Totals (accumulating minutes)
  const periodicStats = useMemo(() => {
    let weekMins = 0;
    let monthMins = 0;
    let lifetimeMins = 0;

    const oneWeekAgo = addDays(todayStr, -7);
    const oneMonthAgo = addDays(todayStr, -30);

    entries.forEach(e => {
      lifetimeMins += e.durationMinutes;

      if (e.date >= oneWeekAgo) weekMins += e.durationMinutes;
      if (e.date >= oneMonthAgo) monthMins += e.durationMinutes;
    });

    return {
      weekMins,
      monthMins,
      lifetimeMins,
      weekHrsStr: formatMinutesToDecimalHours(weekMins),
      monthHrsStr: formatMinutesToDecimalHours(monthMins),
      lifetimeHrsStr: formatMinutesToDecimalHours(lifetimeMins),
      lifetimeHrsNum: formatMinutesToDecimalHoursNum(lifetimeMins)
    };
  }, [entries, todayStr]);

  // 4. Today's Spaced Revision Checklist ("Today's Tasks" notification)
  const todayRevisionTasks = useMemo(() => {
    return revisions.filter(r => !r.completed && r.dueDate <= todayStr);
  }, [revisions, todayStr]);

  // 5. Subject wise breakdown (Subject-wise hours, accumulating minutes)
  const subjectHrs = useMemo(() => {
    const mins = { Physics: 0, Chemistry: 0, Biology: 0 };
    entries.forEach(e => {
      mins[e.subject] += e.durationMinutes;
    });
    return {
      Biology: formatMinutesToDecimalHoursNum(mins.Biology),
      Chemistry: formatMinutesToDecimalHoursNum(mins.Chemistry),
      Physics: formatMinutesToDecimalHoursNum(mins.Physics)
    };
  }, [entries]);

  // 6. Chapter-wise studied hours list (Top 5 studied, accumulating minutes)
  const topChapters = useMemo(() => {
    const chapMap = new Map<string, number>();
    entries.forEach(e => {
      const currentVal = chapMap.get(e.chapter) || 0;
      chapMap.set(e.chapter, currentVal + e.durationMinutes);
    });

    return Array.from(chapMap.entries())
      .map(([chapter, minutes]) => {
        // Find subject for color coding
        const found = chapterStatuses.find(c => c.chapterName === chapter);
        return {
          chapter,
          minutes,
          hours: formatMinutesToDecimalHoursNum(minutes),
          subject: found?.subject || getChapterSubject(chapter)
        };
      })
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 5);
  }, [entries, chapterStatuses]);

  return (
    <div id="dashboard-section" className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-medical-800 via-medical-900 to-medical-950 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="space-y-2 z-10 max-w-lg">
          <div className="flex items-center gap-1.5 text-medical-200 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-medical-300" /> NEET Preparation Console
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight">
            Welcome back, Aspirant.
          </h1>
          <div className="mt-3 bg-white/10 backdrop-blur-md border border-white/15 rounded-xl px-4 py-3 flex items-start gap-3 shadow-inner">
            <Quote className="w-5 h-5 text-amber-300 shrink-0 mt-0.5 opacity-80" />
            <div className="space-y-0.5">
              <span className="text-[10px] font-black text-amber-200 uppercase tracking-wider block">Daily Motivation</span>
              <p className="text-xs text-slate-100 italic font-semibold leading-relaxed">
                "{dailyThought}"
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks & Goals Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Tasks checklist */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4.5 h-4.5 text-medical-700" />
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Today's Tasks</h2>
              </div>
              <span className="text-[10px] font-mono font-bold bg-medical-50 text-medical-700 px-2.5 py-0.5 rounded-full">
                {todayRevisionTasks.length + todayCustomGoals.length} Active
              </span>
            </div>

            {todayRevisionTasks.length === 0 && todayCustomGoals.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs flex flex-col justify-center items-center gap-1.5">
                <CheckSquare className="w-8 h-8 text-slate-200" />
                <p className="font-medium text-slate-700">All tasks clear for today!</p>
                <p className="text-[10px] text-slate-400">Add custom goals for tomorrow or celebrate your free schedule.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 mt-3">
                {/* Spaced Revisions */}
                {todayRevisionTasks.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block">Today's Scheduled Revisions</span>
                    <div className="grid grid-cols-1 gap-2.5">
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
                              <div className="flex flex-wrap items-baseline gap-1.5 mt-1">
                                <span className="font-bold text-slate-700 block truncate leading-tight">{task.chapterName}</span>
                                {task.subtopics && (
                                  <span className="text-[9px] text-indigo-600 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5 font-medium leading-none" title={`Topics: ${task.subtopics}`}>
                                    {task.subtopics}
                                  </span>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => onQuickCompleteRevision(task.id)}
                              className="px-3 py-1.5 text-[10px] font-bold text-white bg-medical-700 hover:bg-medical-800 rounded-lg transition-all cursor-pointer shrink-0"
                            >
                              Complete
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Custom Goals */}
                {todayCustomGoals.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block">Today's Custom Goals</span>
                    <div className="grid grid-cols-1 gap-2.5">
                      {todayCustomGoals.map(goal => (
                        <div
                          key={goal.id}
                          className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() => handleToggleGoal(goal.id)}
                              className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 cursor-pointer transition-all ${
                                goal.completed
                                  ? 'bg-emerald-500 border-emerald-500 text-white'
                                  : 'border-slate-300 hover:border-slate-400 bg-white'
                              }`}
                            >
                              {goal.completed && <Check className="w-2.5 h-2.5" />}
                            </button>
                            <div className="space-y-0.5 min-w-0 flex-1">
                              {goal.subject && (
                                <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded font-mono uppercase tracking-wide inline-block ${SUBJECT_COLORS[goal.subject].bg} ${SUBJECT_COLORS[goal.subject].text}`}>
                                  {goal.subject}
                                </span>
                              )}
                              <span className={`font-semibold block truncate leading-tight ${goal.completed ? 'line-through text-slate-400 font-normal' : 'text-slate-700'}`}>
                                {goal.text}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteGoal(goal.id)}
                            className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 mt-2">
            <button
              onClick={() => onNavigateToTab('revisions')}
              className="text-xs text-medical-700 hover:text-medical-800 font-bold flex items-center gap-1.5 cursor-pointer"
            >
              Open Interactive Revision Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tomorrow's Goal Card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4.5 h-4.5 text-amber-500" />
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Tomorrow's Goal</h2>
              </div>
              <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full">
                {tomorrowRevisionTasks.length + tomorrowCustomGoals.length} Set
              </span>
            </div>

            {/* Quick Add Form */}
            <form onSubmit={handleAddTomorrowGoal} className="flex gap-2 items-center bg-slate-50 border border-slate-200/70 p-1.5 rounded-xl">
              <input
                type="text"
                value={newGoalText}
                onChange={(e) => setNewGoalText(e.target.value)}
                placeholder="Plan custom goal for tomorrow..."
                className="flex-1 bg-transparent border-none text-xs focus:ring-0 focus:outline-none px-2 text-slate-700 placeholder-slate-400 font-semibold"
              />
              <select
                value={newGoalSubject}
                onChange={(e) => setNewGoalSubject(e.target.value as NEETSubject | 'General')}
                className="text-[10px] bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-600 font-bold cursor-pointer outline-none focus:ring-1 focus:ring-medical-500/20"
              >
                <option value="General">General</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Biology">Biology</option>
              </select>
              <button
                type="submit"
                disabled={!newGoalText.trim()}
                className="p-1.5 bg-medical-750 text-white rounded-lg hover:bg-medical-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </form>

            {tomorrowRevisionTasks.length === 0 && tomorrowCustomGoals.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs flex flex-col justify-center items-center gap-1.5">
                <Calendar className="w-8 h-8 text-slate-200" />
                <p className="font-semibold text-slate-700">No goals set for tomorrow yet.</p>
                <p className="text-[10px] text-slate-400">Add a custom goal above or watch tomorrow's revisions auto-appear!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
                {/* Spaced Revisions */}
                {tomorrowRevisionTasks.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block">Tomorrow's Spaced Revisions</span>
                    <div className="grid grid-cols-1 gap-2">
                      {tomorrowRevisionTasks.map(task => {
                        const colors = SUBJECT_COLORS[task.subject] || SUBJECT_COLORS.Biology;
                        return (
                          <div
                            key={task.id}
                            className="p-2.5 bg-indigo-50/10 border border-indigo-100/50 rounded-xl flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="space-y-0.5 min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded font-mono uppercase tracking-wide ${colors.bg} ${colors.text}`}>
                                  {task.subject}
                                </span>
                                <span className="text-[9px] text-slate-400 font-mono">Stage {task.stage}</span>
                              </div>
                              <div className="flex flex-wrap items-baseline gap-1.5 mt-1">
                                <span className="font-bold text-slate-700 block truncate leading-tight">{task.chapterName}</span>
                              </div>
                            </div>
                            <span className="text-[9px] text-indigo-700 bg-indigo-50/60 font-bold px-2 py-0.5 rounded border border-indigo-100/40">
                              Upcoming
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Custom Goals */}
                {tomorrowCustomGoals.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block">Tomorrow's Custom Goals</span>
                    <div className="grid grid-cols-1 gap-2">
                      {tomorrowCustomGoals.map(goal => (
                        <div
                          key={goal.id}
                          className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() => handleToggleGoal(goal.id)}
                              className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 cursor-pointer transition-all ${
                                goal.completed
                                  ? 'bg-emerald-500 border-emerald-500 text-white'
                                  : 'border-slate-300 hover:border-slate-400 bg-white'
                              }`}
                            >
                              {goal.completed && <Check className="w-2.5 h-2.5" />}
                            </button>
                            <div className="space-y-0.5 min-w-0 flex-1">
                              {goal.subject && (
                                <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded font-mono uppercase tracking-wide inline-block ${SUBJECT_COLORS[goal.subject].bg} ${SUBJECT_COLORS[goal.subject].text}`}>
                                  {goal.subject}
                                </span>
                              )}
                              <span className={`font-semibold block truncate leading-tight ${goal.completed ? 'line-through text-slate-400 font-normal' : 'text-slate-700'}`}>
                                {goal.text}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteGoal(goal.id)}
                            className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 mt-2 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-medium">
              Note: Goals set for tomorrow carry over automatically!
            </span>
          </div>
        </div>
      </div>

      {/* Today's Focus Insight Card (placed directly below "Today's Tasks" checklist) */}
      <div 
        id="todays-focus-card"
        className={`rounded-2xl p-4 md:p-5 border transition-all duration-300 ${
          focusData.isImbalance 
            ? 'bg-gradient-to-r from-amber-50/60 to-orange-50/40 dark:from-amber-950/20 dark:to-orange-950/10 border-amber-200/60 dark:border-amber-900/40' 
            : 'bg-gradient-to-r from-emerald-50/50 to-teal-50/30 dark:from-emerald-950/20 dark:to-teal-950/10 border-emerald-100/60 dark:border-emerald-900/40'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`p-2 rounded-xl mt-0.5 shrink-0 shadow-sm ${
              focusData.isImbalance 
                ? 'bg-amber-100/80 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400' 
                : 'bg-emerald-100/80 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
            }`}>
              {focusData.isImbalance ? (
                <Target className="w-4.5 h-4.5 animate-pulse" />
              ) : (
                <Sparkles className="w-4.5 h-4.5" />
              )}
            </div>
            <div className="space-y-1 min-w-0">
              <span className={`text-[10px] uppercase tracking-widest font-extrabold ${
                focusData.isImbalance ? 'text-amber-800 dark:text-amber-400' : 'text-emerald-800 dark:text-emerald-400'
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
                ? 'bg-white dark:bg-slate-900 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/40 shadow-sm'
                : 'bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-100/50 dark:border-emerald-900/40 shadow-sm'
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
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2 min-w-0 flex-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Today's Study Load</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-mono font-extrabold text-slate-800">{formatMinutesToDecimalHours(todayMetrics.studyMins)}</span>
                <span className="text-xs text-slate-500 font-semibold">hours total</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-normal">
                {todayMetrics.studyMins === 0 
                  ? "No study logs today yet. Start a session or log your classes!"
                  : todayMetrics.studyHrsNum < 3
                    ? "Great start! Keep pushing to reach your daily NEET goal."
                    : "Outstanding study momentum today! Balance is key."
                }
              </p>
            </div>

            {/* Graphic Donut Chart */}
            <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
              <svg width="100%" height="100%" viewBox="0 0 100 100" className="transform -rotate-90">
                {/* Background track */}
                <circle
                  cx="50"
                  cy="50"
                  r={36}
                  fill="transparent"
                  stroke="#f1f5f9"
                  strokeWidth="9"
                />
                {todayMetrics.studyMins > 0 ? (
                  <>
                    {/* Class segment */}
                    {todayMetrics.classMins > 0 && (
                      <motion.circle
                        cx="50"
                        cy="50"
                        r={36}
                        fill="transparent"
                        stroke="#3b82f6"
                        strokeWidth="9"
                        strokeDasharray={`${(todayMetrics.classMins / todayMetrics.studyMins) * 226.195} 226.195`}
                        strokeDashoffset={0}
                        strokeLinecap="round"
                        initial={{ strokeDashoffset: 226.195 }}
                        animate={{ strokeDashoffset: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    )}
                    {/* Self Study segment */}
                    {todayMetrics.selfMins > 0 && (
                      <motion.circle
                        cx="50"
                        cy="50"
                        r={36}
                        fill="transparent"
                        stroke="#10b981"
                        strokeWidth="9"
                        strokeDasharray={`${(todayMetrics.selfMins / todayMetrics.studyMins) * 226.195} 226.195`}
                        strokeDashoffset={-(todayMetrics.classMins / todayMetrics.studyMins) * 226.195}
                        strokeLinecap="round"
                        initial={{ strokeDashoffset: 226.195 }}
                        animate={{ strokeDashoffset: -(todayMetrics.classMins / todayMetrics.studyMins) * 226.195 }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
                      />
                    )}
                    {/* Revision segment */}
                    {todayMetrics.revMins > 0 && (
                      <motion.circle
                        cx="50"
                        cy="50"
                        r={36}
                        fill="transparent"
                        stroke="#f59e0b"
                        strokeWidth="9"
                        strokeDasharray={`${(todayMetrics.revMins / todayMetrics.studyMins) * 226.195} 226.195`}
                        strokeDashoffset={-((todayMetrics.classMins + todayMetrics.selfMins) / todayMetrics.studyMins) * 226.195}
                        strokeLinecap="round"
                        initial={{ strokeDashoffset: 226.195 }}
                        animate={{ strokeDashoffset: -((todayMetrics.classMins + todayMetrics.selfMins) / todayMetrics.studyMins) * 226.195 }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                      />
                    )}
                  </>
                ) : (
                  <circle
                    cx="50"
                    cy="50"
                    r={36}
                    fill="transparent"
                    stroke="#e2e8f0"
                    strokeWidth="9"
                    strokeDasharray="4 4"
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-black font-mono text-slate-800 leading-none">
                  {todayMetrics.studyMins > 0 ? `${Math.round((todayMetrics.studyMins / (8 * 60)) * 100)}%` : '0%'}
                </span>
                <span className="text-[7px] text-slate-400 font-extrabold uppercase mt-0.5">Target</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-[10px] text-slate-500 mt-4">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded bg-blue-500 shrink-0" />
              <div className="truncate">
                <span className="block text-[8px] text-slate-400 uppercase tracking-wide">Class</span>
                <span className="font-bold text-slate-700 font-mono">{formatMinutesToDecimalHours(todayMetrics.classMins)}h</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500 shrink-0" />
              <div className="truncate">
                <span className="block text-[8px] text-slate-400 uppercase tracking-wide">Self Study</span>
                <span className="font-bold text-slate-700 font-mono">{formatMinutesToDecimalHours(todayMetrics.selfMins)}h</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded bg-amber-500 shrink-0" />
              <div className="truncate">
                <span className="block text-[8px] text-slate-400 uppercase tracking-wide">Revision</span>
                <span className="font-bold text-slate-700 font-mono">{formatMinutesToDecimalHours(todayMetrics.revMins)}h</span>
              </div>
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
                <span className="font-mono font-bold text-slate-800">{periodicStats.weekHrsStr} hrs</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">This Month:</span>
                <span className="font-mono font-bold text-slate-800">{periodicStats.monthHrsStr} hrs</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Lifetime Prep:</span>
                <span className="font-mono font-bold text-slate-800">{periodicStats.lifetimeHrsStr} hrs</span>
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
                <span className="font-mono">{subjectHrs.Biology}h</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full"
                  style={{ width: `${periodicStats.lifetimeHrsNum > 0 ? (subjectHrs.Biology / periodicStats.lifetimeHrsNum) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Chemistry */}
            <div>
              <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                <span className="flex items-center gap-1.5 text-red-700"><span className="w-2 h-2 rounded-full bg-red-500" /> Chemistry</span>
                <span className="font-mono">{subjectHrs.Chemistry}h</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div
                  className="bg-red-500 h-1.5 rounded-full"
                  style={{ width: `${periodicStats.lifetimeHrsNum > 0 ? (subjectHrs.Chemistry / periodicStats.lifetimeHrsNum) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Physics */}
            <div>
              <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                <span className="flex items-center gap-1.5 text-blue-700"><span className="w-2 h-2 rounded-full bg-blue-500" /> Physics</span>
                <span className="font-mono">{subjectHrs.Physics}h</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div
                  className="bg-blue-500 h-1.5 rounded-full"
                  style={{ width: `${periodicStats.lifetimeHrsNum > 0 ? (subjectHrs.Physics / periodicStats.lifetimeHrsNum) * 100 : 0}%` }}
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
                      {item.hours} hours
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

      {/* Developer Attribution Footer */}
      <div className="pt-8 pb-2 text-center border-t border-slate-100/50 mt-8">
        <p className="text-[10px] text-slate-400 font-medium tracking-wide">
          Developed and designed by <span className="text-slate-600 font-semibold">Siddharth Trivedi</span>
        </p>
      </div>
    </div>
  );
}
