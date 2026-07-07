/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Trophy,
  Award,
  Sparkles,
  Clock,
  BookOpen,
  Compass,
  Zap,
  Brain,
  CheckCircle,
  Target,
  Flame,
  Activity,
  TrendingUp,
  AlertCircle,
  Calendar,
  Layers,
  GraduationCap,
  Medal,
  ChevronRight,
  Bookmark,
  Check
} from 'lucide-react';
import { StudyEntry, ChapterStatus, RevisionTask, TestEntry } from '../types';
import { triggerToast } from '../utils';

interface MilestonesPageProps {
  entries: StudyEntry[];
  chapterStatuses: ChapterStatus[];
  revisions: RevisionTask[];
  tests: TestEntry[];
}

interface MilestoneBadge {
  id: string;
  title: string;
  description: string;
  category: 'Time' | 'Chapter' | 'MCQ' | 'Revision' | 'Test' | 'Streaks';
  target: number;
  currentValue: number;
  unit: string;
  icon: React.ComponentType<any>;
  color: string; // Tailwind class prefix for colors (e.g. 'emerald', 'blue', 'amber', 'rose', 'purple')
}

export default function MilestonesPage({ entries, chapterStatuses, revisions, tests }: MilestonesPageProps) {
  const [activeCategory, setActiveCategory] = useState<'All' | 'Time' | 'Chapter' | 'MCQ' | 'Revision' | 'Test' | 'Streaks'>('All');

  // Calculate dynamic metrics
  const metrics = useMemo(() => {
    // 1. Total Study Hours
    const totalHours = entries.reduce((acc, curr) => acc + (curr.durationMinutes / 60), 0);

    // 2. Total MCQs Solved
    const totalMcqsSolved = entries.reduce((acc, curr) => acc + curr.mcqsSolved, 0);

    // 3. Completed Spaced Revisions
    const completedRevisions = revisions.filter(r => r.completed).length;

    // 4. Completed/Mastered Chapters (Total hours > 0 or Status in Revision levels / Mastered)
    const completedChapters = chapterStatuses.filter(chap => 
      chap.status !== 'Not Started' && chap.totalHours > 0
    ).length;

    const masteredChapters = chapterStatuses.filter(chap => 
      chap.status === 'Mastered' || chap.status === 'Revision 4' || chap.averageAccuracy >= 85
    ).length;

    // 5. Subject Specific Hours
    const bioHours = entries.filter(e => e.subject === 'Biology').reduce((acc, curr) => acc + (curr.durationMinutes / 60), 0);
    const chemHours = entries.filter(e => e.subject === 'Chemistry').reduce((acc, curr) => acc + (curr.durationMinutes / 60), 0);
    const phyHours = entries.filter(e => e.subject === 'Physics').reduce((acc, curr) => acc + (curr.durationMinutes / 60), 0);

    // 6. Max Mock Test Score
    const maxMockScore = tests.length > 0 ? Math.max(...tests.map(t => t.marks)) : 0;
    const testsCount = tests.length;

    // 7. Perfect MCQ Session (Accuracy 100% with at least 15 MCQ Solved)
    const perfectSessions = entries.filter(e => e.mcqsSolved >= 15 && e.accuracy === 100).length;

    // 8. Max Chapters solved with high average accuracy
    const highAccuracyChapters = chapterStatuses.filter(chap => chap.totalMcqs >= 30 && chap.averageAccuracy >= 80).length;

    // 9. Current & Max Streak calculation (Consecutive days study)
    const uniqueDates = Array.from(new Set(entries.map(e => e.date))).sort();
    let currentStreak = 0;
    let maxStreak = 0;

    if (uniqueDates.length > 0) {
      // Find current streak by scanning backward from today
      const todayStr = new Date().toISOString().split('T')[0];
      const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      const hasToday = uniqueDates.includes(todayStr);
      const hasYesterday = uniqueDates.includes(yesterdayStr);

      if (hasToday || hasYesterday) {
        let tempStreak = 0;
        let checkDate = new Date(hasToday ? todayStr : yesterdayStr);
        
        while (true) {
          const checkStr = checkDate.toISOString().split('T')[0];
          if (uniqueDates.includes(checkStr)) {
            tempStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
        currentStreak = tempStreak;
      }

      // Max Streak overall
      let tempMax = 0;
      let tempStreak = 0;
      let prevTime = null;

      for (const dStr of uniqueDates) {
        const currTime = new Date(dStr).getTime();
        if (prevTime === null) {
          tempStreak = 1;
        } else {
          const diffDays = Math.round((currTime - prevTime) / 86400000);
          if (diffDays === 1) {
            tempStreak++;
          } else if (diffDays > 1) {
            tempMax = Math.max(tempMax, tempStreak);
            tempStreak = 1;
          }
        }
        prevTime = currTime;
      }
      maxStreak = Math.max(tempMax, tempStreak);
    }

    return {
      totalHours,
      totalMcqsSolved,
      completedRevisions,
      completedChapters,
      masteredChapters,
      bioHours,
      chemHours,
      phyHours,
      maxMockScore,
      testsCount,
      perfectSessions,
      highAccuracyChapters,
      currentStreak,
      maxStreak
    };
  }, [entries, chapterStatuses, revisions, tests]);

  // Construct Badges Array
  const badges: MilestoneBadge[] = useMemo(() => [
    // 1. Time Badges
    {
      id: 'time_first',
      title: 'Pioneer Journey',
      description: 'Logged your very first NEET study session.',
      category: 'Time',
      target: 1,
      currentValue: entries.length,
      unit: 'session',
      icon: Compass,
      color: 'blue'
    },
    {
      id: 'time_10h',
      title: 'NEET Foundation',
      description: 'Accumulate 10 total hours of logged study.',
      category: 'Time',
      target: 10,
      currentValue: metrics.totalHours,
      unit: 'hr',
      icon: Clock,
      color: 'blue'
    },
    {
      id: 'time_50h',
      title: 'Dedicated Scholar',
      description: 'Accumulate 50 total hours of deep NEET preparation.',
      category: 'Time',
      target: 50,
      currentValue: metrics.totalHours,
      unit: 'hr',
      icon: Medal,
      color: 'indigo'
    },
    {
      id: 'time_100h',
      title: 'Century Study Legend',
      description: 'Pass the incredible milestone of 100 hours focused study.',
      category: 'Time',
      target: 100,
      currentValue: metrics.totalHours,
      unit: 'hr',
      icon: Trophy,
      color: 'amber'
    },

    // 2. Subject Specific Badges
    {
      id: 'sub_bio_20h',
      title: 'Biology Buff',
      description: 'Dedicated study of Botany/Zoology for 20 hours.',
      category: 'Time',
      target: 20,
      currentValue: metrics.bioHours,
      unit: 'hr',
      icon: GraduationCap,
      color: 'emerald'
    },
    {
      id: 'sub_chem_20h',
      title: 'Chemistry Alchemist',
      description: 'Master chemical formulae & organic reagents for 20 hours.',
      category: 'Time',
      target: 20,
      currentValue: metrics.chemHours,
      unit: 'hr',
      icon: Brain,
      color: 'sky'
    },
    {
      id: 'sub_phy_20h',
      title: 'Physics Prodigy',
      description: 'Deconstruct mechanics & electromagnetism formulas for 20 hours.',
      category: 'Time',
      target: 20,
      currentValue: metrics.phyHours,
      unit: 'hr',
      icon: Zap,
      color: 'purple'
    },

    // 3. Chapter Coverage Badges
    {
      id: 'chap_5',
      title: 'Syllabus Explorer',
      description: 'Initiate studies in at least 5 different syllabus chapters.',
      category: 'Chapter',
      target: 5,
      currentValue: metrics.completedChapters,
      unit: 'chap',
      icon: BookOpen,
      color: 'teal'
    },
    {
      id: 'chap_15',
      title: 'Syllabus Commander',
      description: 'Cover at least 15 key NEET syllabus chapters.',
      category: 'Chapter',
      target: 15,
      currentValue: metrics.completedChapters,
      unit: 'chap',
      icon: Layers,
      color: 'emerald'
    },
    {
      id: 'chap_mastery',
      title: 'NEET Mastermind',
      description: 'Reach a "Mastered" status or high accuracy trend in 5 chapters.',
      category: 'Chapter',
      target: 5,
      currentValue: metrics.masteredChapters,
      unit: 'chap',
      icon: Sparkles,
      color: 'amber'
    },

    // 4. MCQ Badges
    {
      id: 'mcq_100',
      title: 'MCQ Marksman',
      description: 'Solve 100 multiple choice questions to build solid accuracy.',
      category: 'MCQ',
      target: 100,
      currentValue: metrics.totalMcqsSolved,
      unit: 'mcq',
      icon: Target,
      color: 'cyan'
    },
    {
      id: 'mcq_500',
      title: 'Rapid Fire Solver',
      description: 'Successfully solve 500 NEET question patterns.',
      category: 'MCQ',
      target: 500,
      currentValue: metrics.totalMcqsSolved,
      unit: 'mcq',
      icon: Award,
      color: 'purple'
    },
    {
      id: 'mcq_1000',
      title: 'MCQ Titan Legend',
      description: 'Unlock elite tier practice by solving 1,000 NEET MCQs.',
      category: 'MCQ',
      target: 1000,
      currentValue: metrics.totalMcqsSolved,
      unit: 'mcq',
      icon: Trophy,
      color: 'rose'
    },
    {
      id: 'mcq_perfect',
      title: 'Bullseye Precision',
      description: 'Achieve 100% accuracy on a practice session of 15+ questions.',
      category: 'MCQ',
      target: 1,
      currentValue: metrics.perfectSessions,
      unit: 'time',
      icon: Activity,
      color: 'emerald'
    },
    {
      id: 'mcq_accuracy_master',
      title: 'Accuracy Champion',
      description: 'Achieve >80% avg. accuracy in 3 chapters (min. 30 questions each).',
      category: 'MCQ',
      target: 3,
      currentValue: metrics.highAccuracyChapters,
      unit: 'chap',
      icon: TrendingUp,
      color: 'teal'
    },

    // 5. Spaced Repetition Badges
    {
      id: 'rev_3',
      title: 'Memory Enforcer',
      description: 'Successfully complete 3 scheduled spaced repetition tasks.',
      category: 'Revision',
      target: 3,
      currentValue: metrics.completedRevisions,
      unit: 'task',
      icon: Bookmark,
      color: 'fuchsia'
    },
    {
      id: 'rev_10',
      title: 'Spaced Repetition Legend',
      description: 'Complete 10 scheduled spaced repetition tasks on time.',
      category: 'Revision',
      target: 10,
      currentValue: metrics.completedRevisions,
      unit: 'task',
      icon: Calendar,
      color: 'pink'
    },

    // 6. Test Score Badges
    {
      id: 'test_pioneer',
      title: 'Gladiator Arena',
      description: 'Participate and log your very first full NEET Mock Test score.',
      category: 'Test',
      target: 1,
      currentValue: metrics.testsCount,
      unit: 'test',
      icon: GraduationCap,
      color: 'violet'
    },
    {
      id: 'test_elite',
      title: 'Elite Scorer (600+)',
      description: 'Reach a formidable score of 600 or above on any full length NEET Mock Test.',
      category: 'Test',
      target: 600,
      currentValue: metrics.maxMockScore,
      unit: 'mark',
      icon: Sparkles,
      color: 'amber'
    },

    // 7. Consistency Streaks
    {
      id: 'streak_3d',
      title: 'NEET Momentum',
      description: 'Maintain a consistent 3-day study streak of active logging.',
      category: 'Streaks',
      target: 3,
      currentValue: metrics.maxStreak,
      unit: 'day',
      icon: Flame,
      color: 'orange'
    },
    {
      id: 'streak_7d',
      title: 'Unstoppable Flame',
      description: 'Achieve a stellar 7-day study streak. Dedication is outstanding!',
      category: 'Streaks',
      target: 7,
      currentValue: metrics.maxStreak,
      unit: 'day',
      icon: Flame,
      color: 'rose'
    }
  ], [entries, metrics]);

  // Filters
  const filteredBadges = useMemo(() => {
    if (activeCategory === 'All') return badges;
    return badges.filter(b => b.category === activeCategory);
  }, [badges, activeCategory]);

  const earnedCount = useMemo(() => {
    return badges.filter(b => b.currentValue >= b.target).length;
  }, [badges]);

  const progressPercentage = useMemo(() => {
    if (badges.length === 0) return 0;
    return Math.round((earnedCount / badges.length) * 100);
  }, [earnedCount, badges]);

  // Color mapper helper
  const getColorClasses = (color: string, isEarned: boolean) => {
    if (!isEarned) {
      return {
        bg: 'bg-slate-50',
        border: 'border-slate-200/65',
        iconBg: 'bg-slate-100 text-slate-400',
        glow: 'hover:border-slate-300'
      };
    }

    switch (color) {
      case 'emerald':
        return {
          bg: 'bg-emerald-50/40 border-emerald-100',
          border: 'border-emerald-100',
          iconBg: 'bg-emerald-500 text-white',
          glow: 'shadow-md shadow-emerald-500/10 border-emerald-300'
        };
      case 'indigo':
        return {
          bg: 'bg-indigo-50/40 border-indigo-100',
          border: 'border-indigo-100',
          iconBg: 'bg-indigo-500 text-white',
          glow: 'shadow-md shadow-indigo-500/10 border-indigo-300'
        };
      case 'amber':
        return {
          bg: 'bg-amber-50/40 border-amber-100',
          border: 'border-amber-100',
          iconBg: 'bg-amber-500 text-white animate-pulse',
          glow: 'shadow-md shadow-amber-500/15 border-amber-300 ring-2 ring-amber-400/10'
        };
      case 'rose':
        return {
          bg: 'bg-rose-50/40 border-rose-100',
          border: 'border-rose-100',
          iconBg: 'bg-rose-500 text-white',
          glow: 'shadow-md shadow-rose-500/10 border-rose-300'
        };
      case 'purple':
        return {
          bg: 'bg-purple-50/40 border-purple-100',
          border: 'border-purple-100',
          iconBg: 'bg-purple-500 text-white',
          glow: 'shadow-md shadow-purple-500/10 border-purple-300'
        };
      case 'sky':
        return {
          bg: 'bg-sky-50/40 border-sky-100',
          border: 'border-sky-100',
          iconBg: 'bg-sky-500 text-white',
          glow: 'shadow-md shadow-sky-500/10 border-sky-300'
        };
      case 'teal':
        return {
          bg: 'bg-teal-50/40 border-teal-100',
          border: 'border-teal-100',
          iconBg: 'bg-teal-500 text-white',
          glow: 'shadow-md shadow-teal-500/10 border-teal-300'
        };
      case 'cyan':
        return {
          bg: 'bg-cyan-50/40 border-cyan-100',
          border: 'border-cyan-100',
          iconBg: 'bg-cyan-500 text-white',
          glow: 'shadow-md shadow-cyan-500/10 border-cyan-300'
        };
      case 'fuchsia':
        return {
          bg: 'bg-fuchsia-50/40 border-fuchsia-100',
          border: 'border-fuchsia-100',
          iconBg: 'bg-fuchsia-500 text-white',
          glow: 'shadow-md shadow-fuchsia-500/10 border-fuchsia-300'
        };
      case 'pink':
        return {
          bg: 'bg-pink-50/40 border-pink-100',
          border: 'border-pink-100',
          iconBg: 'bg-pink-500 text-white',
          glow: 'shadow-md shadow-pink-500/10 border-pink-300'
        };
      case 'violet':
        return {
          bg: 'bg-violet-50/40 border-violet-100',
          border: 'border-violet-100',
          iconBg: 'bg-violet-500 text-white',
          glow: 'shadow-md shadow-violet-500/10 border-violet-300'
        };
      case 'orange':
        return {
          bg: 'bg-orange-50/40 border-orange-100',
          border: 'border-orange-100',
          iconBg: 'bg-orange-500 text-white',
          glow: 'shadow-md shadow-orange-500/10 border-orange-300'
        };
      default:
        return {
          bg: 'bg-blue-50/40 border-blue-100',
          border: 'border-blue-100',
          iconBg: 'bg-blue-500 text-white',
          glow: 'shadow-md shadow-blue-500/10 border-blue-300'
        };
    }
  };

  const handleShareAward = (badgeTitle: string) => {
    triggerToast(`Congratulations! You've copied your achievement for "${badgeTitle}" to share with your friends!`, "success");
    navigator.clipboard.writeText(`🎉 I just unlocked the "${badgeTitle}" Study Milestone Badge on my NEET Spaced Repetition Planner! 🩺📚`);
  };

  return (
    <div className="space-y-6">
      {/* Overview Stat Summary Panel */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 relative overflow-hidden shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 transform translate-x-12 -translate-y-12 w-64 h-64 bg-medical-500/10 rounded-full filter blur-3xl" />
        <div className="absolute bottom-0 left-0 transform -translate-x-12 translate-y-12 w-64 h-64 bg-indigo-500/10 rounded-full filter blur-3xl" />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-xl">
                <Trophy className="w-6 h-6 animate-bounce" />
              </span>
              <div>
                <span className="text-[10px] text-medical-400 font-bold uppercase tracking-wider block">NEET Achievement Center</span>
                <h2 className="text-xl md:text-2xl font-display font-black tracking-tight">Milestones & Badge Collection</h2>
              </div>
            </div>
            
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed max-w-2xl">
              Track your dedicated NEET preparation through visual study badges! Work continuously through classes, self-studies, question bank marathons, and spaced revisions to unlock awards and verify your exam readiness.
            </p>

            <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-slate-300">
              <div className="flex items-center gap-1.5 bg-slate-800/60 border border-slate-700/30 px-3 py-1.5 rounded-lg">
                <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
                <span>Max Streak: <span className="text-white font-mono font-black">{metrics.maxStreak}d</span></span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-800/60 border border-slate-700/30 px-3 py-1.5 rounded-lg">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>Study Load: <span className="text-white font-mono font-black">{metrics.totalHours.toFixed(1)}h</span></span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-800/60 border border-slate-700/30 px-3 py-1.5 rounded-lg">
                <Target className="w-4 h-4 text-cyan-400" />
                <span>MCQs Slain: <span className="text-white font-mono font-black">{metrics.totalMcqsSolved}</span></span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 bg-slate-800/60 border border-slate-700/40 rounded-2xl p-5 flex flex-col justify-between h-full min-h-[160px]">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-400 font-bold">Unlocks Completed</span>
                <span className="text-sm text-amber-400 font-mono font-black">{earnedCount} / {badges.length}</span>
              </div>
              
              <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
                <motion.div
                  className="bg-gradient-to-r from-amber-400 to-emerald-500 h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>

            <div className="mt-4 border-t border-slate-700/30 pt-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase text-slate-400 block font-bold">Rank Level</span>
                <span className="text-sm font-black text-white">
                  {earnedCount === 0 
                    ? 'Novice Aspirant' 
                    : earnedCount < 4 
                      ? 'Steady Cadet' 
                      : earnedCount < 8 
                        ? 'Practice Champion' 
                        : earnedCount < 14 
                          ? 'Revision Scholar' 
                          : 'NEET Conqueror 🩺'
                  }
                </span>
              </div>
              <div className="text-right">
                <span className="text-[28px] font-mono font-black leading-none text-amber-400 block">{progressPercentage}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Tab selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        {(['All', 'Time', 'Chapter', 'MCQ', 'Revision', 'Test', 'Streaks'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
              activeCategory === cat
                ? 'bg-medical-700 text-white shadow shadow-medical-750/15'
                : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/50'
            }`}
          >
            {cat === 'All' ? 'All Milestones' : cat}
          </button>
        ))}
      </div>

      {/* Grid of badges */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBadges.map((badge) => {
          const isEarned = badge.currentValue >= badge.target;
          const config = getColorClasses(badge.color, isEarned);
          const Icon = badge.icon;
          const progress = Math.min(100, Math.round((badge.currentValue / badge.target) * 100));

          return (
            <motion.div
              key={badge.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl border p-5 transition-all relative overflow-hidden flex flex-col justify-between group ${config.bg} ${config.border} ${config.glow}`}
            >
              {/* Top Row: Icon and Earned Tag */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 flex-1 min-w-0">
                  <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider block">{badge.category}</span>
                  <h3 className="font-bold text-slate-800 leading-tight truncate text-sm">{badge.title}</h3>
                  <p className="text-slate-500 text-[11px] leading-relaxed pt-0.5">{badge.description}</p>
                </div>
                
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${config.iconBg} shadow-sm`}>
                  <Icon className="w-5.5 h-5.5" />
                </div>
              </div>

              {/* Progress Bar & Numerical Target Tracker */}
              <div className="mt-5 pt-3 border-t border-slate-100/60 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500">
                  <span>
                    Progress: <span className="font-bold text-slate-800 font-mono">
                      {badge.currentValue.toFixed(badge.unit === 'hr' ? 1 : 0)}
                    </span> / <span className="font-mono">{badge.target}</span> {badge.unit}s
                  </span>
                  <span className="font-bold text-slate-800">{progress}%</span>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      isEarned 
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                        : 'bg-slate-300'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>

                {/* Bottom Row: Actions and Unlocked Date */}
                <div className="flex items-center justify-between pt-1 text-[10px] font-semibold">
                  {isEarned ? (
                    <>
                      <div className="flex items-center gap-1 text-emerald-600">
                        <Check className="w-3.5 h-3.5" />
                        <span>Unlocked</span>
                      </div>
                      <button
                        onClick={() => handleShareAward(badge.title)}
                        className="text-medical-600 hover:text-medical-700 bg-medical-50/50 hover:bg-medical-50 px-2.5 py-1 rounded-lg border border-medical-100 transition-all cursor-pointer flex items-center gap-1 shrink-0 font-bold"
                      >
                        Share
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-1 text-slate-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      <span>Locked</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
