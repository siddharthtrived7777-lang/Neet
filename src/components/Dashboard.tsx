/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Clock, Target, BookOpen, AlertCircle, Calendar, CheckSquare, Sparkles, Award, ArrowRight, Activity, Quote, Plus, Trash2, Check, Share2 } from 'lucide-react';
import { StudyEntry, ChapterStatus, RevisionTask, TestEntry, NEETSubject } from '../types';
import { SUBJECT_COLORS, getChapterSubject } from '../neetData';
import { formatDate, addDays, getLogicalTodayDate, formatMinutesToDecimalHours, formatMinutesToDecimalHoursNum, triggerToast } from '../utils';
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

const SIDDHARTH_GREETINGS = [
  "Good morning, Siddharth! Ready to make today another masterpiece in your prep?",
  "Hey Siddharth, hope you're feeling focused! Let's conquer some tough concepts today.",
  "Welcome back, Siddharth! Consistency is your secret weapon. Keep the streak alive!",
  "Awesome day to study, Siddharth! Your dream medical seat is built byte by byte, day by day.",
  "Hello, Siddharth! Let's approach today's NCERT revision with absolute focus and precision.",
  "Rise and shine, Siddharth! Today is a perfect opportunity to turn your weak topics into strengths.",
  "Hey Siddharth! Remember, every MCQ solved correctly today is a boost of confidence for the main day.",
  "Welcome to your study console, Siddharth. Stay resilient, stay curious, and keep pushing!",
  "Good day, Siddharth! Trust the spaced repetition system; it is designing your ultimate peak memory.",
  "Hey Siddharth! Let's attack Physics numericals with complete confidence today. You've got this!",
  "Welcome back, Siddharth. Your daily study hours are the foundation of an incredible future doctor.",
  "Hello, Siddharth! Step by step, page by page, you are converting your efforts into true mastery.",
  "Good morning, Siddharth! Push your boundaries today and outdo yesterday's academic self.",
  "Hey Siddharth! Keep that learning momentum high. Consistency is what separates aspirants from toppers.",
  "Welcome back, Siddharth! Let's tackle today's goals with high accuracy and a sharp mind.",
  "Good afternoon, Siddharth! Power through the day; your future self will thank you for today's hustle.",
  "Hey Siddharth! Make every single revision card count. Your dedication is absolutely inspiring.",
  "Welcome, Siddharth. Put on your focus cap, clear any distractions, and let's have an elite session.",
  "Hello, Siddharth! Today is a fresh page. Let's fill it with high-yield concepts and solid active recall.",
  "Hey Siddharth! Small daily improvements compound into legendary results. Keep believing in yourself!",
  "Welcome back, Siddharth. The white coat and stethoscope are won in quiet, focused hours like today.",
  "Good morning, Siddharth! Let's keep your focus sharp and your questions practiced. Let's go!",
  "Hello, Siddharth! Stay patient with the tough topics; they are just puzzles waiting for you to solve.",
  "Hey Siddharth! Let's make today's study logs full of productive deep focus. Ready, set, learn!",
  "Welcome back, Siddharth! Your dedication is the engine of your success. Let's fuel it today.",
  "Hello, Siddharth! Let's keep the confidence high and the silly mistakes low during today's practice.",
  "Good day, Siddharth! Your persistence is unmatched. Let's tackle today's scheduled revisions first.",
  "Hey Siddharth! Let's focus intensely on the high-yield NCERT Biology lines today.",
  "Welcome back, Siddharth! Another beautiful opportunity to sharpen your knowledge and grow.",
  "Hello, Siddharth! Let's strive for high-accuracy practice sessions today. Make every option count!",
  "Superb day to excel, Siddharth! Complete your checklist, log your sessions, and lead the way."
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

  const [allocationTab, setAllocationTab] = useState<'all' | 'today'>('all');

  // Today's Subject wise breakdown
  const todaySubjectHrs = useMemo(() => {
    const mins = { Physics: 0, Chemistry: 0, Biology: 0 };
    entries.forEach(e => {
      if (e.date === todayStr) {
        mins[e.subject] += e.durationMinutes;
      }
    });
    return {
      Biology: formatMinutesToDecimalHoursNum(mins.Biology),
      Chemistry: formatMinutesToDecimalHoursNum(mins.Chemistry),
      Physics: formatMinutesToDecimalHoursNum(mins.Physics)
    };
  }, [entries, todayStr]);

  const totalTodaySubjectHrsNum = useMemo(() => {
    return todaySubjectHrs.Biology + todaySubjectHrs.Chemistry + todaySubjectHrs.Physics;
  }, [todaySubjectHrs]);

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

  // Daily unique greeting for Siddharth
  const dailyGreeting = useMemo(() => {
    const day = new Date().getDate();
    return SIDDHARTH_GREETINGS[(day - 1) % SIDDHARTH_GREETINGS.length];
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
    let pyqMins = 0;
    let mcqPracticeMins = 0;
    let testAnalysisMins = 0;
    let mcqs = 0;
    let correct = 0;

    entries.forEach(e => {
      if (e.date === todayStr) {
        studyMins += e.durationMinutes;
        if (e.studyType === 'Class') classMins += e.durationMinutes;
        else if (e.studyType === 'Self Study') selfMins += e.durationMinutes;
        else if (e.studyType === 'Revision') revMins += e.durationMinutes;
        else if (e.studyType === 'PYQ') pyqMins += e.durationMinutes;
        else if (e.studyType === 'MCQ Practice') mcqPracticeMins += e.durationMinutes;
        else if (e.studyType === 'Test Analysis') testAnalysisMins += e.durationMinutes;

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
      pyqMins,
      mcqPracticeMins,
      testAnalysisMins,
      studyHrsNum: formatMinutesToDecimalHoursNum(studyMins),
      classHrsNum: formatMinutesToDecimalHoursNum(classMins),
      selfHrsNum: formatMinutesToDecimalHoursNum(selfMins),
      revHrsNum: formatMinutesToDecimalHoursNum(revMins),
      pyqHrsNum: formatMinutesToDecimalHoursNum(pyqMins),
      mcqPracticeHrsNum: formatMinutesToDecimalHoursNum(mcqPracticeMins),
      testAnalysisHrsNum: formatMinutesToDecimalHoursNum(testAnalysisMins),
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
      <div className="bg-gradient-to-r from-[#5B5FEF] to-[#7B7FF5] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="space-y-2 z-10 max-w-lg">
          <div className="flex items-center gap-1.5 text-white/90 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-white" /> NEET Preparation Console
          </div>
          <h1 className="font-display text-xl md:text-2xl font-extrabold tracking-tight">
            {dailyGreeting}
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
                <CheckSquare className="w-4.5 h-4.5 text-[#5B5FEF]" />
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Today's Tasks</h2>
              </div>
              <span className="text-[10px] font-mono font-bold bg-[#5B5FEF]/10 text-[#5B5FEF] px-2.5 py-0.5 rounded-full">
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
                            className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80 rounded-xl flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="space-y-0.5 min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded font-mono uppercase tracking-wide ${colors.bg} ${colors.text}`}>
                                  {task.subject}
                                </span>
                                <span className="text-[9px] text-slate-400 font-mono">Stage {task.stage}</span>
                              </div>
                              <div className="flex flex-wrap items-baseline gap-1.5 mt-1">
                                <span className="font-bold text-slate-700 dark:text-slate-200 block truncate leading-tight">{task.chapterName}</span>
                                {task.subtopics && (
                                  <span className="text-[9px] text-medical-600 dark:text-medical-400 bg-medical-50 dark:bg-medical-950/40 border border-medical-100 dark:border-medical-900/40 rounded px-1.5 py-0.5 font-medium leading-none" title={`Topics: ${task.subtopics}`}>
                                    {task.subtopics}
                                  </span>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => onQuickCompleteRevision(task.id)}
                              className="px-3 py-1.5 text-[10px] font-bold text-white bg-medical-700 hover:bg-medical-800 dark:bg-medical-600 dark:hover:bg-medical-500 rounded-lg transition-all cursor-pointer shrink-0 shadow-sm"
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
                          className="p-2.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80 rounded-xl flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() => handleToggleGoal(goal.id)}
                              className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 cursor-pointer transition-all ${
                                goal.completed
                                  ? 'bg-medical-500 border-medical-500 text-white'
                                  : 'border-slate-300 hover:border-slate-400 bg-white dark:bg-slate-950 dark:border-slate-800'
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
                              <span className={`font-semibold block truncate leading-tight ${goal.completed ? 'line-through text-slate-400 font-normal' : 'text-slate-700 dark:text-slate-200'}`}>
                                {goal.text}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteGoal(goal.id)}
                            className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 transition-colors cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
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
        <div id="tomorrows-goal-card" className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4.5 h-4.5 text-red-500" />
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Tomorrow's Goal</h2>
              </div>
              <span className="text-[10px] font-mono font-bold bg-medical-50 text-medical-700 px-2.5 py-0.5 rounded-full">
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
                className="p-1.5 bg-medical-500 text-white rounded-lg hover:bg-medical-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shrink-0"
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
                            className="p-2.5 bg-medical-50/10 border border-medical-100/50 rounded-xl flex items-center justify-between gap-3 text-xs"
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
                            <span className="text-[9px] text-medical-700 bg-medical-50/60 font-bold px-2 py-0.5 rounded border border-medical-100/40">
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
                          className="p-2.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80 rounded-xl flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() => handleToggleGoal(goal.id)}
                              className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 cursor-pointer transition-all ${
                                goal.completed
                                  ? 'bg-medical-500 border-medical-500 text-white'
                                  : 'border-slate-300 hover:border-slate-400 bg-white dark:bg-slate-950 dark:border-slate-800'
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
                              <span className={`font-semibold block truncate leading-tight ${goal.completed ? 'line-through text-slate-400 font-normal' : 'text-slate-700 dark:text-slate-200'}`}>
                                {goal.text}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteGoal(goal.id)}
                            className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 transition-colors cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
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
        className="rounded-2xl p-4 md:p-5 border transition-all duration-300 bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/40"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2 rounded-xl mt-0.5 shrink-0 shadow-sm bg-amber-100/80 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400">
              {focusData.isImbalance ? (
                <Target className="w-4.5 h-4.5 animate-pulse text-red-500" />
              ) : (
                <Sparkles className="w-4.5 h-4.5" />
              )}
            </div>
            <div className="space-y-1 min-w-0">
              <span className="text-[10px] uppercase tracking-widest font-extrabold text-amber-800 dark:text-amber-400">
                {focusData.isImbalance ? "Today's Focus Recommendation" : "Weekly Balance Status"}
              </span>
              <p className="text-xs md:text-sm font-semibold text-slate-800 leading-normal">
                {focusData.insight}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateToTab('today-focus')}
            className="text-xs font-bold px-3.5 py-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 bg-white dark:bg-slate-900 hover:bg-[#5B5FEF]/10 text-[#5B5FEF] border-[#5B5FEF]/30 shadow-sm"
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
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Today's Study Load</span>
                <button
                  type="button"
                  onClick={() => {
                    const logicalToday = getLogicalTodayDate();
                    const todayEntries = entries.filter(e => e.date === logicalToday);
                    const totalMins = todayMetrics.studyMins;
                    const totalSolved = todayEntries.reduce((acc, curr) => acc + (curr.mcqsSolved || 0), 0);
                    const totalCorrect = todayEntries.reduce((acc, curr) => acc + (curr.mcqsCorrect || 0), 0);
                    const formattedHours = formatMinutesToDecimalHours(totalMins);

                    let msg = `🩺 *NEET UG Study Report - Today (${logicalToday})* 📚\n\n`;
                    msg += `⏱️ *Total Study Time:* ${formattedHours} hrs (${totalMins} mins)\n`;
                    msg += `📝 *Sessions Completed:* ${todayEntries.length}\n`;

                    if (totalSolved > 0) {
                      const acc = Math.round((totalCorrect / totalSolved) * 100);
                      msg += `🎯 *MCQs Practiced:* ${totalSolved} solved (${totalCorrect} correct • ${acc}% Accuracy)\n`;
                    }

                    if (todayEntries.length > 0) {
                      msg += `\n📖 *Today's Sessions:*\n`;
                      todayEntries.forEach((entry, idx) => {
                        const subjEmoji = entry.subject === 'Biology' ? '🌿' : entry.subject === 'Chemistry' ? '🧪' : '⚡';
                        msg += `${idx + 1}. ${subjEmoji} *${entry.chapter}* (${entry.studyType}) - ${entry.durationMinutes}m\n`;
                      });
                    }

                    msg += `\n✨ *Consistency is the key to NEET success!* 🩺💪`;

                    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
                      navigator.clipboard.writeText(msg).catch(() => {});
                    }

                    const encodedText = encodeURIComponent(msg);
                    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
                    window.open(whatsappUrl, '_blank');

                    triggerToast(`Today's study report copied & opening WhatsApp!`, 'success');
                  }}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold text-emerald-700 hover:text-white bg-emerald-50 hover:bg-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-600 dark:hover:text-white border border-emerald-200 dark:border-emerald-800 shadow-2xs transition-all cursor-pointer group active:scale-95 shrink-0"
                  title="Share Today's Study Stats to WhatsApp"
                >
                  <Share2 className="w-2.5 h-2.5 text-emerald-600 group-hover:text-white transition-colors" />
                  <span>WhatsApp</span>
                </button>
              </div>
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
                    {[
                      { mins: todayMetrics.classMins, color: "#2E5FE0", delay: 0 },
                      { mins: todayMetrics.selfMins, color: "#5B5FEF", delay: 0.1 },
                      { mins: todayMetrics.revMins, color: "#E6A317", delay: 0.2 },
                      { mins: todayMetrics.pyqMins, color: "#10B981", delay: 0.3 },
                      { mins: todayMetrics.mcqPracticeMins, color: "#EC4899", delay: 0.4 },
                      { mins: todayMetrics.testAnalysisMins, color: "#EF4444", delay: 0.5 },
                    ].reduce((acc, segment) => {
                      if (segment.mins <= 0) return acc;
                      const offset = -acc.accumulatedMins / todayMetrics.studyMins * 226.195;
                      const strokeDash = (segment.mins / todayMetrics.studyMins) * 226.195;
                      
                      acc.elements.push(
                        <motion.circle
                          key={segment.color}
                          cx="50"
                          cy="50"
                          r={36}
                          fill="transparent"
                          stroke={segment.color}
                          strokeWidth="9"
                          strokeDasharray={`${strokeDash} 226.195`}
                          strokeDashoffset={offset}
                          strokeLinecap="round"
                          initial={{ strokeDashoffset: 226.195 }}
                          animate={{ strokeDashoffset: offset }}
                          transition={{ duration: 0.8, ease: "easeOut", delay: segment.delay }}
                        />
                      );
                      acc.accumulatedMins += segment.mins;
                      return acc;
                    }, { elements: [] as React.ReactNode[], accumulatedMins: 0 }).elements}
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

          <div className="grid grid-cols-3 gap-y-2.5 gap-x-1.5 border-t border-slate-100 pt-3 text-[10px] text-slate-500 mt-4">
            <div className="flex items-center gap-1 min-w-0">
              <span className="w-2 h-2 rounded bg-[#2E5FE0] shrink-0" />
              <div className="truncate">
                <span className="block text-[8px] text-slate-400 uppercase tracking-wide">Class</span>
                <span className="font-bold text-slate-700 font-mono">{formatMinutesToDecimalHours(todayMetrics.classMins)}h</span>
              </div>
            </div>
            <div className="flex items-center gap-1 min-w-0">
              <span className="w-2 h-2 rounded bg-[#5B5FEF] shrink-0" />
              <div className="truncate">
                <span className="block text-[8px] text-slate-400 uppercase tracking-wide font-medium">Self</span>
                <span className="font-bold text-slate-700 font-mono">{formatMinutesToDecimalHours(todayMetrics.selfMins)}h</span>
              </div>
            </div>
            <div className="flex items-center gap-1 min-w-0">
              <span className="w-2 h-2 rounded bg-[#E6A317] shrink-0" />
              <div className="truncate">
                <span className="block text-[8px] text-slate-400 uppercase tracking-wide">Revision</span>
                <span className="font-bold text-slate-700 font-mono">{formatMinutesToDecimalHours(todayMetrics.revMins)}h</span>
              </div>
            </div>
            <div className="flex items-center gap-1 min-w-0">
              <span className="w-2 h-2 rounded bg-[#10B981] shrink-0" />
              <div className="truncate">
                <span className="block text-[8px] text-slate-400 uppercase tracking-wide">PYQ</span>
                <span className="font-bold text-slate-700 font-mono">{formatMinutesToDecimalHours(todayMetrics.pyqMins)}h</span>
              </div>
            </div>
            <div className="flex items-center gap-1 min-w-0">
              <span className="w-2 h-2 rounded bg-[#EC4899] shrink-0" />
              <div className="truncate">
                <span className="block text-[8px] text-slate-400 uppercase tracking-wide">Practice</span>
                <span className="font-bold text-slate-700 font-mono">{formatMinutesToDecimalHours(todayMetrics.mcqPracticeMins)}h</span>
              </div>
            </div>
            <div className="flex items-center gap-1 min-w-0">
              <span className="w-2 h-2 rounded bg-[#EF4444] shrink-0" />
              <div className="truncate">
                <span className="block text-[8px] text-slate-400 uppercase tracking-wide">Analysis</span>
                <span className="font-bold text-slate-700 font-mono">{formatMinutesToDecimalHours(todayMetrics.testAnalysisMins)}h</span>
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
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Subject Time Allocation</span>
            <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setAllocationTab('all')}
                className={`text-[9px] font-bold px-2 py-1 rounded-md transition-all cursor-pointer ${
                  allocationTab === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All Days
              </button>
              <button
                type="button"
                onClick={() => setAllocationTab('today')}
                className={`text-[9px] font-bold px-2 py-1 rounded-md transition-all cursor-pointer ${
                  allocationTab === 'today' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Today
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            {/* The single multi-colored stacked progress bar */}
            <div>
              <span className="text-[9px] text-slate-400 font-bold block mb-1">
                {allocationTab === 'all' ? 'All-Time Color Distribution' : "Today's Color Distribution"}
              </span>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
                {(() => {
                  const bio = allocationTab === 'all' ? subjectHrs.Biology : todaySubjectHrs.Biology;
                  const chem = allocationTab === 'all' ? subjectHrs.Chemistry : todaySubjectHrs.Chemistry;
                  const phys = allocationTab === 'all' ? subjectHrs.Physics : todaySubjectHrs.Physics;
                  const total = bio + chem + phys;
                  if (total === 0) {
                    return <div className="w-full text-[9px] text-slate-400 text-center flex items-center justify-center font-bold">No study logged yet</div>;
                  }
                  const bioP = (bio / total) * 100;
                  const chemP = (chem / total) * 100;
                  const physP = (phys / total) * 100;
                  return (
                    <>
                      {bioP > 0 && (
                        <div
                          className="bg-emerald-500 h-full transition-all duration-300"
                          style={{ width: `${bioP}%` }}
                          title={`Biology: ${bioP.toFixed(1)}%`}
                        />
                      )}
                      {chemP > 0 && (
                        <div
                          className="bg-red-500 h-full transition-all duration-300"
                          style={{ width: `${chemP}%` }}
                          title={`Chemistry: ${chemP.toFixed(1)}%`}
                        />
                      )}
                      {physP > 0 && (
                        <div
                          className="bg-blue-500 h-full transition-all duration-300"
                          style={{ width: `${physP}%` }}
                          title={`Physics: ${physP.toFixed(1)}%`}
                        />
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="space-y-3 py-0.5">
              {/* Biology */}
              <div>
                <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Biology
                  </span>
                  <span className="font-mono">
                    {allocationTab === 'all' ? `${subjectHrs.Biology}h` : `${todaySubjectHrs.Biology}h`}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full"
                    style={{
                      width: (() => {
                        const val = allocationTab === 'all' ? subjectHrs.Biology : todaySubjectHrs.Biology;
                        const total = allocationTab === 'all' ? periodicStats.lifetimeHrsNum : totalTodaySubjectHrsNum;
                        return `${total > 0 ? (val / total) * 100 : 0}%`;
                      })()
                    }}
                  />
                </div>
              </div>

              {/* Chemistry */}
              <div>
                <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                  <span className="flex items-center gap-1.5 text-red-700">
                    <span className="w-2 h-2 rounded-full bg-red-500" /> Chemistry
                  </span>
                  <span className="font-mono">
                    {allocationTab === 'all' ? `${subjectHrs.Chemistry}h` : `${todaySubjectHrs.Chemistry}h`}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div
                    className="bg-red-500 h-1.5 rounded-full"
                    style={{
                      width: (() => {
                        const val = allocationTab === 'all' ? subjectHrs.Chemistry : todaySubjectHrs.Chemistry;
                        const total = allocationTab === 'all' ? periodicStats.lifetimeHrsNum : totalTodaySubjectHrsNum;
                        return `${total > 0 ? (val / total) * 100 : 0}%`;
                      })()
                    }}
                  />
                </div>
              </div>

              {/* Physics */}
              <div>
                <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                  <span className="flex items-center gap-1.5 text-blue-700">
                    <span className="w-2 h-2 rounded-full bg-blue-500" /> Physics
                  </span>
                  <span className="font-mono">
                    {allocationTab === 'all' ? `${subjectHrs.Physics}h` : `${todaySubjectHrs.Physics}h`}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full"
                    style={{
                      width: (() => {
                        const val = allocationTab === 'all' ? subjectHrs.Physics : todaySubjectHrs.Physics;
                        const total = allocationTab === 'all' ? periodicStats.lifetimeHrsNum : totalTodaySubjectHrsNum;
                        return `${total > 0 ? (val / total) * 100 : 0}%`;
                      })()
                    }}
                  />
                </div>
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
