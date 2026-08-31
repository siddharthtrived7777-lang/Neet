/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  Clock,
  Award,
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  BookOpen,
  CheckCircle2,
  Filter,
  Sparkles,
  Layers,
  ChevronUp,
  Tag,
  Share2,
  Check,
  Send
} from 'lucide-react';
import { StudyEntry, NEETSubject } from '../types';
import { SUBJECT_COLORS } from '../neetData';
import { getLogicalTodayDate, triggerToast } from '../utils';

interface HierarchicalStudyLogsProps {
  entries: StudyEntry[];
  onOpenEditModal: (entry: StudyEntry) => void;
  onOpenDeleteModal: (id: string, chapter: string) => void;
  compactMode?: boolean;
  maxHeightClass?: string;
  title?: string;
}

function formatTo12Hour(time24: string): string {
  if (!time24) return '';
  const [hourStr, minStr] = time24.split(':');
  const hour = parseInt(hourStr, 10);
  if (isNaN(hour)) return time24;
  const min = minStr || '00';
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${min} ${ampm}`;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function formatMonthTitle(monthKey: string): string {
  try {
    const [yearStr, monthStr] = monthKey.split('-');
    const year = parseInt(yearStr, 10);
    const monthNum = parseInt(monthStr, 10);
    if (!isNaN(year) && monthNum >= 1 && monthNum <= 12) {
      return `${MONTH_NAMES[monthNum - 1]} ${year}`;
    }
  } catch (e) {
    // fallback
  }
  return monthKey;
}

function formatDurationMinutes(mins: number): string {
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${mins}m`;
}

function generateWhatsAppStudyReport(dateGroup: {
  dateStr: string;
  friendlyDate: string;
  totalMinutes: number;
  totalSolved: number;
  sessionCount: number;
  dayEntries: StudyEntry[];
}): string {
  const formattedDuration = formatDurationMinutes(dateGroup.totalMinutes);

  let totalCorrect = 0;
  let totalSolved = 0;
  const subjectBreakdown: Record<string, { mins: number; count: number; solved: number; correct: number }> = {
    Biology: { mins: 0, count: 0, solved: 0, correct: 0 },
    Chemistry: { mins: 0, count: 0, solved: 0, correct: 0 },
    Physics: { mins: 0, count: 0, solved: 0, correct: 0 },
  };

  dateGroup.dayEntries.forEach(e => {
    totalSolved += e.mcqsSolved || 0;
    totalCorrect += e.mcqsCorrect || 0;
    if (!subjectBreakdown[e.subject]) {
      subjectBreakdown[e.subject] = { mins: 0, count: 0, solved: 0, correct: 0 };
    }
    subjectBreakdown[e.subject].mins += e.durationMinutes || 0;
    subjectBreakdown[e.subject].count += 1;
    subjectBreakdown[e.subject].solved += e.mcqsSolved || 0;
    subjectBreakdown[e.subject].correct += e.mcqsCorrect || 0;
  });

  const overallAccuracy = totalSolved > 0 ? Math.round((totalCorrect / totalSolved) * 100) : null;

  let msg = `🩺 *NEET UG Study Report - ${dateGroup.friendlyDate}* 📚\n\n`;
  msg += `⏱️ *Total Study Time:* ${formattedDuration}\n`;
  msg += `📝 *Sessions Completed:* ${dateGroup.sessionCount}\n`;

  if (totalSolved > 0) {
    msg += `🎯 *MCQs Practiced:* ${totalSolved} solved (${totalCorrect} correct • ${overallAccuracy}% Accuracy)\n`;
  }

  msg += `\n📊 *Subject Breakdown:*\n`;
  (['Biology', 'Chemistry', 'Physics'] as const).forEach(subj => {
    const data = subjectBreakdown[subj];
    if (data && data.mins > 0) {
      const subjEmoji = subj === 'Biology' ? '🌿' : subj === 'Chemistry' ? '🧪' : '⚡';
      msg += `${subjEmoji} *${subj}:* ${formatDurationMinutes(data.mins)} (${data.count} ${data.count === 1 ? 'session' : 'sessions'}`;
      if (data.solved > 0) {
        const acc = Math.round((data.correct / data.solved) * 100);
        msg += ` • ${data.solved} MCQs, ${acc}% Acc`;
      }
      msg += `)\n`;
    }
  });

  msg += `\n📖 *Detailed Sessions:*\n`;
  dateGroup.dayEntries.forEach((entry, idx) => {
    const subjEmoji = entry.subject === 'Biology' ? '🌿' : entry.subject === 'Chemistry' ? '🧪' : '⚡';
    const timeRange = `${formatTo12Hour(entry.startTime)} - ${formatTo12Hour(entry.endTime)}`;
    const durStr = formatDurationMinutes(entry.durationMinutes);

    msg += `${idx + 1}. ${subjEmoji} *${entry.chapter}*\n`;
    if (entry.topic) {
      msg += `   📌 Topic: ${entry.topic}\n`;
    }
    msg += `   ⏱️ ${durStr} (${timeRange}) | ${entry.studyType}\n`;
    if (entry.mcqsSolved > 0) {
      msg += `   🎯 MCQs: ${entry.mcqsCorrect}/${entry.mcqsSolved} (${entry.accuracy}% Acc)\n`;
    }
    if (entry.notes) {
      msg += `   💡 Note: ${entry.notes}\n`;
    }
    msg += `\n`;
  });

  msg += `✨ *Every day of focused study brings me closer to my dream medical college!* 🩺💪`;
  return msg;
}

function generateSingleSessionWhatsApp(entry: StudyEntry): string {
  const durStr = formatDurationMinutes(entry.durationMinutes);
  const timeRange = `${formatTo12Hour(entry.startTime)} - ${formatTo12Hour(entry.endTime)}`;
  const subjEmoji = entry.subject === 'Biology' ? '🌿' : entry.subject === 'Chemistry' ? '🧪' : '⚡';

  let msg = `🩺 *NEET Study Session - ${entry.date}* 📚\n\n`;
  msg += `${subjEmoji} *Subject:* ${entry.subject}\n`;
  msg += `📖 *Chapter:* ${entry.chapter}\n`;
  if (entry.topic) {
    msg += `📌 *Topic:* ${entry.topic}\n`;
  }
  msg += `⏱️ *Duration:* ${durStr} (${timeRange})\n`;
  msg += `📝 *Study Type:* ${entry.studyType}\n`;
  msg += `🌟 *Confidence:* ${entry.confidenceLevel}\n`;

  if (entry.mcqsSolved > 0) {
    msg += `🎯 *MCQs:* ${entry.mcqsCorrect}/${entry.mcqsSolved} correct (${entry.accuracy}% Accuracy)\n`;
  }
  if (entry.notes) {
    msg += `💡 *Notes:* ${entry.notes}\n`;
  }

  msg += `\n✨ *Consistency is the key to NEET success!* 🩺💪`;
  return msg;
}

export default function HierarchicalStudyLogs({
  entries,
  onOpenEditModal,
  onOpenDeleteModal,
  compactMode = false,
  maxHeightClass = 'max-h-[560px]',
  title = 'Recent Study Session Logs'
}: HierarchicalStudyLogsProps) {
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<NEETSubject | 'All'>('All');
  
  // Track open/closed state for months and dates
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  const todayStr = useMemo(() => getLogicalTodayDate(), []);

  // Filter entries if subject filter is active
  const filteredEntries = useMemo(() => {
    if (selectedSubjectFilter === 'All') return entries;
    return entries.filter(e => e.subject === selectedSubjectFilter);
  }, [entries, selectedSubjectFilter]);

  // Group entries dynamically by Month -> Date (NO PRE-ENTERED EMPTY MONTHS)
  const hierarchicalData = useMemo(() => {
    const monthMap: Record<string, Record<string, StudyEntry[]>> = {};

    filteredEntries.forEach(entry => {
      if (!entry.date) return;
      const monthKey = entry.date.substring(0, 7); // e.g. '2026-08'
      if (!monthMap[monthKey]) {
        monthMap[monthKey] = {};
      }
      if (!monthMap[monthKey][entry.date]) {
        monthMap[monthKey][entry.date] = [];
      }
      monthMap[monthKey][entry.date].push(entry);
    });

    // Sort months descending (e.g. 2026-08, 2026-07)
    const sortedMonthKeys = Object.keys(monthMap).sort((a, b) => b.localeCompare(a));

    return sortedMonthKeys.map(monthKey => {
      const datesObj = monthMap[monthKey];
      // Sort dates within month descending
      const sortedDateKeys = Object.keys(datesObj).sort((a, b) => b.localeCompare(a));

      let monthTotalMins = 0;
      let monthTotalSolved = 0;
      let monthTotalSessions = 0;
      const subjectMins: Record<NEETSubject, number> = { Physics: 0, Chemistry: 0, Biology: 0 };

      const dates = sortedDateKeys.map(dateStr => {
        // Sort sessions within date by startTime ascending
        const dayEntries = [...datesObj[dateStr]].sort((a, b) => a.startTime.localeCompare(b.startTime));
        const dayMins = dayEntries.reduce((sum, e) => sum + (e.durationMinutes || 0), 0);
        const daySolved = dayEntries.reduce((sum, e) => sum + (e.mcqsSolved || 0), 0);

        monthTotalMins += dayMins;
        monthTotalSolved += daySolved;
        monthTotalSessions += dayEntries.length;

        dayEntries.forEach(e => {
          if (subjectMins[e.subject] !== undefined) {
            subjectMins[e.subject] += e.durationMinutes || 0;
          }
        });

        // Friendly date label
        let friendlyDate = dateStr;
        if (dateStr === todayStr) {
          friendlyDate = `${dateStr} (Today)`;
        } else {
          try {
            const todayObj = new Date(todayStr);
            todayObj.setDate(todayObj.getDate() - 1);
            const yesterdayStr = todayObj.toISOString().split('T')[0];
            if (dateStr === yesterdayStr) {
              friendlyDate = `${dateStr} (Yesterday)`;
            }
          } catch (e) {}
        }

        return {
          dateStr,
          friendlyDate,
          dayEntries,
          totalMinutes: dayMins,
          totalSolved: daySolved,
          sessionCount: dayEntries.length
        };
      });

      return {
        monthKey,
        monthTitle: formatMonthTitle(monthKey),
        isCurrentMonth: todayStr.startsWith(monthKey),
        totalMinutes: monthTotalMins,
        totalSolved: monthTotalSolved,
        totalSessions: monthTotalSessions,
        subjectMins,
        dates
      };
    });
  }, [filteredEntries, todayStr]);

  // Determine if a month is expanded (default: the very latest month is open)
  const isMonthExpanded = (monthKey: string) => {
    if (expandedMonths[monthKey] !== undefined) {
      return expandedMonths[monthKey];
    }
    // Default open if it is the first/newest month
    return hierarchicalData.length > 0 && hierarchicalData[0].monthKey === monthKey;
  };

  // Determine if a date is expanded (default: the newest date in the newest month is open)
  const isDateExpanded = (dateStr: string, monthKey: string) => {
    if (expandedDates[dateStr] !== undefined) {
      return expandedDates[dateStr];
    }
    // Default open if it is the first date in the first month
    if (hierarchicalData.length > 0 && hierarchicalData[0].monthKey === monthKey) {
      return hierarchicalData[0].dates.length > 0 && hierarchicalData[0].dates[0].dateStr === dateStr;
    }
    return false;
  };

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths(prev => ({
      ...prev,
      [monthKey]: !isMonthExpanded(monthKey)
    }));
  };

  const toggleDate = (dateStr: string, monthKey: string) => {
    setExpandedDates(prev => ({
      ...prev,
      [dateStr]: !isDateExpanded(dateStr, monthKey)
    }));
  };

  const expandAll = () => {
    const newMonths: Record<string, boolean> = {};
    const newDates: Record<string, boolean> = {};
    hierarchicalData.forEach(m => {
      newMonths[m.monthKey] = true;
      m.dates.forEach(d => {
        newDates[d.dateStr] = true;
      });
    });
    setExpandedMonths(newMonths);
    setExpandedDates(newDates);
  };

  const collapseAll = () => {
    const newMonths: Record<string, boolean> = {};
    const newDates: Record<string, boolean> = {};
    hierarchicalData.forEach(m => {
      newMonths[m.monthKey] = false;
      m.dates.forEach(d => {
        newDates[d.dateStr] = false;
      });
    });
    setExpandedMonths(newMonths);
    setExpandedDates(newDates);
  };

  const shareDayToWhatsApp = (dateGroup: {
    dateStr: string;
    friendlyDate: string;
    totalMinutes: number;
    totalSolved: number;
    sessionCount: number;
    dayEntries: StudyEntry[];
  }) => {
    const text = generateWhatsAppStudyReport(dateGroup);

    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }

    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');

    triggerToast(`Daily study report copied to clipboard & opening WhatsApp!`, 'success');
  };

  const shareSingleSessionToWhatsApp = (entry: StudyEntry) => {
    const text = generateSingleSessionWhatsApp(entry);

    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }

    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');

    triggerToast(`Session report copied to clipboard & opening WhatsApp!`, 'success');
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Header Bar */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-3 bg-slate-50/50 dark:bg-slate-850/50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-medical-50 dark:bg-medical-950/60 text-medical-600 dark:text-medical-400 border border-medical-200/50 dark:border-medical-800/50">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-white leading-none">
                {title}
              </h2>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                Month-wise & Date-wise hierarchy
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded-md">
              {filteredEntries.length} {filteredEntries.length === 1 ? 'Session' : 'Sessions'}
            </span>
          </div>
        </div>

        {/* Filters & Expand/Collapse Controls */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-800/80 text-[11px]">
          {/* Subject Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar">
            {(['All', 'Biology', 'Chemistry', 'Physics'] as const).map(subj => {
              const isActive = selectedSubjectFilter === subj;
              let activeClass = 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900';
              if (subj === 'Biology') activeClass = 'bg-emerald-600 text-white';
              if (subj === 'Chemistry') activeClass = 'bg-cyan-600 text-white';
              if (subj === 'Physics') activeClass = 'bg-indigo-600 text-white';

              return (
                <button
                  key={subj}
                  type="button"
                  onClick={() => setSelectedSubjectFilter(subj)}
                  className={`px-2 py-0.5 rounded-md font-semibold text-[10px] transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? `${activeClass} shadow-xs`
                      : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/70 dark:border-slate-700/70 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {subj}
                </button>
              );
            })}
          </div>

          {/* Expand/Collapse Toggle */}
          {hierarchicalData.length > 0 && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={expandAll}
                className="px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
                title="Expand all months and dates"
              >
                Expand All
              </button>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <button
                type="button"
                onClick={collapseAll}
                className="px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
                title="Collapse all months and dates"
              >
                Collapse
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Hierarchical Content List */}
      <div className={`overflow-y-auto flex-1 p-3 space-y-3 ${maxHeightClass} pr-2`}>
        {hierarchicalData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center px-4">
            <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2.5" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No study logs found</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-[220px]">
              {selectedSubjectFilter !== 'All'
                ? `No sessions recorded for ${selectedSubjectFilter}. Try switching to 'All'.`
                : 'Complete a study session using the timer or manual form to generate calendar logs.'}
            </p>
          </div>
        ) : (
          hierarchicalData.map(month => {
            const isMonthOpen = isMonthExpanded(month.monthKey);

            return (
              <div
                key={month.monthKey}
                className="border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/40 dark:bg-slate-900/40 shadow-2xs transition-all"
              >
                {/* LEVEL 1: MONTH ACCORDION HEADER */}
                <button
                  type="button"
                  onClick={() => toggleMonth(month.monthKey)}
                  className="w-full text-left px-3.5 py-2.5 bg-slate-100/90 hover:bg-slate-200/70 dark:bg-slate-800/90 dark:hover:bg-slate-750 active:bg-slate-200 transition-all flex items-center justify-between border-b border-slate-200/70 dark:border-slate-700/60 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-slate-500 dark:text-slate-400 p-0.5 rounded hover:bg-slate-300/40 dark:hover:bg-slate-700 transition-colors">
                      {isMonthOpen ? (
                        <ChevronDown className="w-4 h-4 text-slate-700 dark:text-slate-200" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      )}
                    </span>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-medical-600 dark:text-medical-400 shrink-0" />
                          {month.monthTitle}
                        </span>
                        {month.isCurrentMonth && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-medical-50 text-medical-700 border border-medical-200 dark:bg-medical-950/60 dark:text-medical-300 dark:border-medical-800">
                            Current
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-slate-500 dark:text-slate-400">
                        <span className="font-semibold">
                          {month.dates.length} {month.dates.length === 1 ? 'Study Day' : 'Study Days'}
                        </span>
                        <span>•</span>
                        <span>{month.totalSessions} Sessions</span>
                        {month.totalSolved > 0 && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                              {month.totalSolved} MCQs
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end shrink-0 pl-2">
                    <span className="text-xs font-bold text-medical-800 dark:text-medical-300 font-mono">
                      {formatDurationMinutes(month.totalMinutes)}
                    </span>
                    <span className="text-[8px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Month Total
                    </span>
                  </div>
                </button>

                {/* LEVEL 2: DATES WITHIN MONTH */}
                <AnimatePresence initial={false}>
                  {isMonthOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden p-2.5 space-y-2 bg-slate-50/70 dark:bg-slate-900/60 border-l-2 border-medical-500/40 ml-1.5 my-1.5 mr-1.5 rounded-lg"
                    >
                      {month.dates.map(dateGroup => {
                        const isDateOpen = isDateExpanded(dateGroup.dateStr, month.monthKey);

                        return (
                          <div
                            key={dateGroup.dateStr}
                            className="border border-slate-200/80 dark:border-slate-800/80 rounded-xl overflow-hidden bg-white dark:bg-slate-850 shadow-2xs"
                          >
                            {/* LEVEL 2 HEADER: DATE ACCORDION BUTTON & WHATSAPP SHARE */}
                            <div className="w-full bg-slate-50/90 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-750 transition-all flex items-center justify-between border-b border-slate-100 dark:border-slate-750/70">
                              <button
                                type="button"
                                onClick={() => toggleDate(dateGroup.dateStr, month.monthKey)}
                                className="flex-1 text-left px-3 py-2 flex items-center justify-between cursor-pointer min-w-0"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors shrink-0">
                                    {isDateOpen ? (
                                      <ChevronDown className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                                    ) : (
                                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                    )}
                                  </span>

                                  <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                      {dateGroup.friendlyDate}
                                    </span>
                                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                      <span className="text-[9px] font-semibold font-mono text-slate-500 dark:text-slate-400 bg-slate-200/50 dark:bg-slate-750 px-1.5 py-0.2 rounded">
                                        {dateGroup.sessionCount} {dateGroup.sessionCount === 1 ? 'Session' : 'Sessions'}
                                      </span>
                                      {dateGroup.totalSolved > 0 && (
                                        <span className="text-[9px] font-semibold font-mono text-medical-700 dark:text-medical-300 bg-medical-50 dark:bg-medical-950/50 border border-medical-200/50 dark:border-medical-800/50 px-1.5 py-0.2 rounded">
                                          {dateGroup.totalSolved} MCQs
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right flex flex-col items-end shrink-0 px-2">
                                  <span className="text-[11px] font-bold text-medical-800 dark:text-medical-400 font-mono">
                                    {formatDurationMinutes(dateGroup.totalMinutes)}
                                  </span>
                                  <span className="text-[8px] font-medium uppercase tracking-wider text-slate-400">
                                    Day Total
                                  </span>
                                </div>
                              </button>

                              {/* Small WhatsApp Share Button */}
                              <div className="pr-2.5 shrink-0 flex items-center">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    shareDayToWhatsApp(dateGroup);
                                  }}
                                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold text-emerald-700 hover:text-white bg-emerald-50 hover:bg-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-600 dark:hover:text-white border border-emerald-200 dark:border-emerald-800 shadow-2xs transition-all cursor-pointer group active:scale-95"
                                  title={`Share ${dateGroup.friendlyDate} study log to WhatsApp`}
                                  aria-label={`Share ${dateGroup.friendlyDate} study log to WhatsApp`}
                                >
                                  <Share2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 group-hover:text-white transition-colors" />
                                  <span className="font-semibold text-[9px] tracking-tight">Share</span>
                                </button>
                              </div>
                            </div>

                            {/* LEVEL 3: DAY STUDY SESSIONS */}
                            <AnimatePresence initial={false}>
                              {isDateOpen && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.15 }}
                                  className="overflow-hidden p-2.5 bg-slate-50/30 dark:bg-slate-900/40 divide-y divide-slate-100 dark:divide-slate-800 space-y-2.5"
                                >
                                  {dateGroup.dayEntries.map(entry => {
                                    const clr = SUBJECT_COLORS[entry.subject] || SUBJECT_COLORS.Biology;

                                    return (
                                      <div
                                        key={entry.id}
                                        className="pt-2.5 first:pt-0 flex flex-col gap-2 bg-white/70 dark:bg-slate-850/60 p-2.5 rounded-lg border border-slate-100/80 dark:border-slate-800/80 shadow-3xs hover:border-slate-200 dark:hover:border-slate-700 transition-all"
                                      >
                                        {/* Session Top: Subject, Timings, Title & Actions */}
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="space-y-1 min-w-0">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                              <span
                                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${clr.bg} ${clr.text}`}
                                              >
                                                {entry.subject}
                                              </span>
                                              <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 font-semibold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                                {formatTo12Hour(entry.startTime)} - {formatTo12Hour(entry.endTime)}
                                              </span>
                                            </div>
                                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                                              {entry.chapter}
                                            </h4>
                                            {entry.topic && (
                                              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium italic">
                                                Topic: {entry.topic}
                                              </p>
                                            )}
                                          </div>

                                          {/* Action Buttons: Share, Edit and Delete */}
                                          <div className="flex gap-1 shrink-0">
                                            <button
                                              type="button"
                                              onClick={() => shareSingleSessionToWhatsApp(entry)}
                                              className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 p-1 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all cursor-pointer border border-transparent hover:border-emerald-100 dark:hover:border-emerald-900"
                                              title="Share this session to WhatsApp"
                                            >
                                              <Share2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => onOpenEditModal(entry)}
                                              className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-all cursor-pointer border border-transparent hover:border-blue-100 dark:hover:border-blue-900"
                                              title="Edit entry"
                                            >
                                              <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => onOpenDeleteModal(entry.id, entry.chapter)}
                                              className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer border border-transparent hover:border-rose-100 dark:hover:border-rose-900"
                                              title="Delete entry"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        </div>

                                        {/* Session Details Grid */}
                                        <div className="grid grid-cols-3 gap-1.5 border-t border-slate-100 dark:border-slate-800 pt-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                                          <div>
                                            <span className="block text-[8px] text-slate-400 uppercase tracking-wide">
                                              Duration
                                            </span>
                                            <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
                                              {formatDurationMinutes(entry.durationMinutes)}
                                            </span>
                                          </div>

                                          <div>
                                            <span className="block text-[8px] text-slate-400 uppercase tracking-wide">
                                              Type
                                            </span>
                                            <span className="font-semibold text-slate-700 dark:text-slate-300 truncate block max-w-full">
                                              {entry.studyType}
                                            </span>
                                          </div>

                                          <div>
                                            <span className="block text-[8px] text-slate-400 uppercase tracking-wide">
                                              Confidence
                                            </span>
                                            <span
                                              className={`font-semibold ${
                                                entry.confidenceLevel === 'High'
                                                  ? 'text-emerald-600 dark:text-emerald-400'
                                                  : entry.confidenceLevel === 'Medium'
                                                  ? 'text-blue-600 dark:text-blue-400'
                                                  : 'text-rose-500 dark:text-rose-400'
                                              }`}
                                            >
                                              {entry.confidenceLevel}
                                            </span>
                                          </div>
                                        </div>

                                        {/* MCQs Solved Box */}
                                        {entry.mcqsSolved > 0 && (
                                          <div className="bg-slate-50 dark:bg-slate-800/70 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-750 flex items-center justify-between text-[10px]">
                                            <span className="text-slate-500 dark:text-slate-400 font-medium">
                                              MCQs:{' '}
                                              <strong className="text-slate-700 dark:text-slate-200">
                                                {entry.mcqsCorrect}/{entry.mcqsSolved}
                                              </strong>
                                            </span>
                                            <span
                                              className={`font-mono font-bold ${
                                                entry.accuracy >= 90
                                                  ? 'text-emerald-600 dark:text-emerald-400'
                                                  : entry.accuracy >= 75
                                                  ? 'text-teal-600 dark:text-teal-400'
                                                  : 'text-amber-600 dark:text-amber-400'
                                              }`}
                                            >
                                              {entry.accuracy}% Accuracy
                                            </span>
                                          </div>
                                        )}

                                        {/* Notes */}
                                        {entry.notes && (
                                          <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 bg-slate-50/50 dark:bg-slate-800/40 p-1.5 rounded border border-dashed border-slate-200 dark:border-slate-750">
                                            {entry.notes}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
