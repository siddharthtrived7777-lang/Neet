/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StudyEntry, TestEntry, ChapterStatus, RevisionTask, NEETSubject, ChapterStatusType, PriorityLevel } from './types';
import { NEET_SYLLABUS } from './neetData';

// Generate unique IDs
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// Format date to YYYY-MM-DD
export function formatDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Add days to date
export function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

// Difference in days between two dates
export function daysBetween(dateStr1: string, dateStr2: string): number {
  const date1 = new Date(dateStr1);
  const date2 = new Date(dateStr2);
  const diffTime = date2.getTime() - date1.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Calculate duration in minutes from start and end times
export function calculateDuration(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 0;
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  
  let startMin = startH * 60 + startM;
  let endMin = endH * 60 + endM;
  
  if (endMin < startMin) {
    // Session cross midnight
    endMin += 24 * 60;
  }
  
  return endMin - startMin;
}

// STREAK CALCULATOR
export function calculateStreaks(entries: StudyEntry[]): { currentStreak: number; longestStreak: number } {
  if (entries.length === 0) return { currentStreak: 0, longestStreak: 0 };
  
  // Get all unique sorted dates on which user studied
  const uniqueDates = Array.from(new Set(entries.map(e => e.date))).sort();
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  
  const todayStr = formatDate(new Date());
  const yesterdayStr = formatDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
  
  // Check if study date array includes today or yesterday to see if current streak is active
  const hasStudiedRecently = uniqueDates.includes(todayStr) || uniqueDates.includes(yesterdayStr);
  
  // Calculate longest streak
  for (let i = 0; i < uniqueDates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prevDate = new Date(uniqueDates[i - 1]);
      const currDate = new Date(uniqueDates[i]);
      const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
        tempStreak = 1;
      }
    }
  }
  if (tempStreak > longestStreak) {
    longestStreak = tempStreak;
  }
  
  // Calculate current streak
  if (hasStudiedRecently) {
    let streakCount = 0;
    let checkDate = new Date(uniqueDates.includes(todayStr) ? todayStr : yesterdayStr);
    
    while (true) {
      const checkStr = formatDate(checkDate);
      if (uniqueDates.includes(checkStr)) {
        streakCount++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    currentStreak = streakCount;
  } else {
    currentStreak = 0;
  }
  
  return { currentStreak, longestStreak: Math.max(longestStreak, currentStreak) };
}

// SPACED REPETITION ENGINE
// Revision schedules based on stage
export const REVISION_INTERVALS = [1, 3, 7, 15, 30, 60, 90]; // Days for Rev 1, 2, 3, 4, 5, 6, 7

// Automatically generate revisions when first studying a chapter or marking it as Completed
export function createRevisionSchedule(
  chapterName: string,
  subject: NEETSubject,
  startDateStr: string
): RevisionTask[] {
  return REVISION_INTERVALS.map((days, index) => {
    const stage = index + 1;
    const dueDate = addDays(startDateStr, days);
    
    // Priority assignment (earlier revisions are higher priority, or custom assignment)
    let priority: PriorityLevel = 'Medium';
    if (stage <= 2) priority = 'High';
    else if (stage >= 6) priority = 'Low';

    return {
      id: generateId(),
      chapterName,
      subject,
      stage,
      dueDate,
      priority,
      completed: false,
      completedDate: null,
      accuracyAtRevision: null
    };
  });
}

// SMART ADAPTATION OF REVISIONS
// Applies to subsequent revision tasks when one task is finished or updated
export function adaptFutureRevisions(
  revisions: RevisionTask[],
  chapterName: string,
  completedStage: number,
  accuracy: number,
  forgotten: boolean = false
): RevisionTask[] {
  const updatedRevisions = [...revisions];
  const todayStr = formatDate(new Date());

  if (forgotten) {
    // If user marks "I forgot":
    // 1. Immediately reschedule the next revision task for tomorrow!
    const nextTaskIndex = updatedRevisions.findIndex(
      r => r.chapterName === chapterName && !r.completed && r.stage === completedStage + 1
    );

    if (nextTaskIndex !== -1) {
      updatedRevisions[nextTaskIndex].dueDate = addDays(todayStr, 1);
      updatedRevisions[nextTaskIndex].priority = 'High';
    } else {
      // Create a special revision task for tomorrow if none are left
      updatedRevisions.push({
        id: generateId(),
        chapterName,
        subject: revisions.find(r => r.chapterName === chapterName)?.subject || 'Biology',
        stage: Math.min(completedStage + 1, 7),
        dueDate: addDays(todayStr, 1),
        priority: 'High',
        completed: false,
        completedDate: null,
        accuracyAtRevision: null
      });
    }
    return updatedRevisions;
  }

  // Smart adaptation based on accuracy
  // If accuracy >= 95%, delay next revision slightly (+20% of normal interval or add bonus days)
  // If accuracy < 80%, bring next revision earlier
  // If 80-95%, normal schedule (already assigned)
  
  const pendingRevisions = updatedRevisions.filter(r => r.chapterName === chapterName && !r.completed);
  
  if (pendingRevisions.length > 0) {
    pendingRevisions.sort((a, b) => a.stage - b.stage);
    
    if (accuracy >= 95) {
      // Delay next revision slightly
      pendingRevisions.forEach((task, idx) => {
        const extraDays = idx === 0 ? 3 : idx === 1 ? 7 : 10; // delay next by 3 days, subsequent by more
        task.dueDate = addDays(task.dueDate, extraDays);
        task.priority = 'Low'; // set priority lower since user is very confident
      });
    } else if (accuracy < 80) {
      // Bring next revision closer!
      pendingRevisions.forEach((task, idx) => {
        if (idx === 0) {
          // Bring to tomorrow or in 2 days
          task.dueDate = addDays(todayStr, 2);
          task.priority = 'High';
        } else {
          // Bring closer as well
          task.dueDate = addDays(task.dueDate, -Math.floor(REVISION_INTERVALS[task.stage - 1] / 3));
          if (new Date(task.dueDate) < new Date(todayStr)) {
            task.dueDate = addDays(todayStr, idx * 3 + 4);
          }
        }
      });
    }
  }

  return updatedRevisions;
}

// MAP REVISION STAGE TO CHAPTER STATUS
export function determineChapterStatusFromRevisions(
  revisions: RevisionTask[],
  chapterName: string,
  baseStatus: ChapterStatusType
): ChapterStatusType {
  const chapterRevs = revisions.filter(r => r.chapterName === chapterName);
  const completedCount = chapterRevs.filter(r => r.completed).length;

  if (completedCount === 0) {
    return baseStatus === 'Not Started' ? 'Studying' : baseStatus;
  } else if (completedCount === 1) {
    return 'Revision 1';
  } else if (completedCount === 2) {
    return 'Revision 2';
  } else if (completedCount === 3) {
    return 'Revision 3';
  } else if (completedCount >= 4 && completedCount < 7) {
    return 'Revision 4';
  } else if (completedCount === 7) {
    return 'Mastered';
  }
  return 'Completed';
}

// AI INSIGHTS GENERATOR (Analytical Rule-based Engine)
export interface AiInsight {
  id: string;
  type: 'alert' | 'success' | 'info' | 'warning';
  title: string;
  message: string;
  subject?: NEETSubject;
  chapter?: string;
}

export function generateAiInsights(
  entries: StudyEntry[],
  tests: TestEntry[],
  chapterStatuses: ChapterStatus[],
  revisions: RevisionTask[]
): AiInsight[] {
  const insights: AiInsight[] = [];
  const todayStr = formatDate(new Date());

  // 1. Check for Overdue Revisions
  const overdueCount = revisions.filter(r => !r.completed && r.dueDate < todayStr).length;
  if (overdueCount > 0) {
    insights.push({
      id: 'overdue-revisions',
      type: 'warning',
      title: 'Overdue Revisions Accumulating',
      message: `You have ${overdueCount} revision task${overdueCount > 1 ? 's' : ''} overdue. Complete them to ensure maximum retention on the forgetting curve.`
    });
  }

  // 2. Identify weak chapters from study entries (low average accuracy)
  const chapterAccuracyMap: { [key: string]: { sum: number; count: number; subject: NEETSubject } } = {};
  entries.forEach(entry => {
    if (entry.mcqsSolved > 0) {
      if (!chapterAccuracyMap[entry.chapter]) {
        chapterAccuracyMap[entry.chapter] = { sum: 0, count: 0, subject: entry.subject };
      }
      chapterAccuracyMap[entry.chapter].sum += entry.accuracy;
      chapterAccuracyMap[entry.chapter].count += 1;
    }
  });

  const weakChapters: { chapter: string; avgAcc: number; subject: NEETSubject }[] = [];
  const strongChapters: { chapter: string; avgAcc: number; subject: NEETSubject }[] = [];

  Object.entries(chapterAccuracyMap).forEach(([chapter, val]) => {
    const avg = val.sum / val.count;
    if (avg < 75) {
      weakChapters.push({ chapter, avgAcc: avg, subject: val.subject });
    } else if (avg >= 92) {
      strongChapters.push({ chapter, avgAcc: avg, subject: val.subject });
    }
  });

  if (weakChapters.length > 0) {
    // Sort by lowest accuracy
    weakChapters.sort((a, b) => a.avgAcc - b.avgAcc);
    const primaryWeak = weakChapters[0];
    insights.push({
      id: `weak-${primaryWeak.chapter}`,
      type: 'alert',
      title: `Low Accuracy: ${primaryWeak.chapter}`,
      message: `Your average MCQ accuracy in ${primaryWeak.chapter} is currently ${Math.round(primaryWeak.avgAcc)}%. Re-evaluate your concept notes and schedule active self-study.`,
      subject: primaryWeak.subject,
      chapter: primaryWeak.chapter
    });
  }

  if (strongChapters.length > 0) {
    const primaryStrong = strongChapters[0];
    insights.push({
      id: `strong-${primaryStrong.chapter}`,
      type: 'success',
      title: `Mastering ${primaryStrong.chapter}`,
      message: `Outstanding performance! Average accuracy is ${Math.round(primaryStrong.avgAcc)}%. You can delay active MCQ practice for this chapter and focus elsewhere.`,
      subject: primaryStrong.subject,
      chapter: primaryStrong.chapter
    });
  }

  // 3. Spaced repetition notifications (Ignored chapters / urgent revisions)
  // Find chapters with completed status or revision stages but not revised recently
  chapterStatuses.forEach(c => {
    if (c.lastStudiedDate) {
      const daysSinceStudy = daysBetween(c.lastStudiedDate, todayStr);
      if (daysSinceStudy > 12 && c.status !== 'Mastered' && c.status !== 'Not Started') {
        insights.push({
          id: `ignored-${c.chapterName}`,
          type: 'info',
          title: `Losing Retention: ${c.chapterName}`,
          message: `It has been ${daysSinceStudy} days since you last studied ${c.chapterName}. Plan a revision session to stop the forgetting curve.`,
          subject: c.subject,
          chapter: c.chapterName
        });
      }
    }
  });

  // 4. Subject imbalance analysis
  const subjectStudyMap: { [key in NEETSubject]: number } = { Physics: 0, Chemistry: 0, Biology: 0 };
  entries.forEach(e => {
    subjectStudyMap[e.subject] += e.durationMinutes / 60;
  });

  const totalHrs = Object.values(subjectStudyMap).reduce((a, b) => a + b, 0);
  if (totalHrs > 10) {
    const physicsRatio = subjectStudyMap.Physics / totalHrs;
    const biologyRatio = subjectStudyMap.Biology / totalHrs;
    const chemistryRatio = subjectStudyMap.Chemistry / totalHrs;

    if (physicsRatio < 0.2) {
      insights.push({
        id: 'subject-imbalance-physics',
        type: 'warning',
        title: 'Increase Physics Numeric Practice',
        message: 'Physics accounts for less than 20% of your total study time. Ensure you solve daily numerical formulas to build examination speed.'
      });
    }
    if (biologyRatio < 0.3) {
      insights.push({
        id: 'subject-imbalance-biology',
        type: 'info',
        title: 'Biology Review Alert',
        message: 'Biology carries 50% marks weightage in NEET (360/720). Ensure you dedicate consistent reading hours to NCERT textbooks.'
      });
    }
  }

  // 5. Test Tracker Insight (Low test performance warning)
  if (tests.length > 0) {
    const latestTest = [...tests].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    const testPct = (latestTest.marks / latestTest.outOf) * 100;
    
    if (testPct < 70) {
      insights.push({
        id: `test-warning-${latestTest.id}`,
        type: 'alert',
        title: `Action Required on ${latestTest.name}`,
        message: `You scored ${latestTest.marks}/${latestTest.outOf} (${Math.round(testPct)}%) in your latest test. High-priority revisions are recommended for ${latestTest.wrongChapters.slice(0, 3).join(', ') || 'your weak chapters'}.`
      });
    } else if (testPct >= 85) {
      insights.push({
        id: `test-celebrate-${latestTest.id}`,
        type: 'success',
        title: `Elite Score in ${latestTest.name}`,
        message: `Superb! Your score of ${latestTest.marks}/${latestTest.outOf} (${Math.round(testPct)}%) is in the high NEET selection bracket. Maintain this momentum.`
      });
    }
  }

  // Fallback default insights if none triggered
  if (insights.length === 0) {
    insights.push({
      id: 'welcome-insight',
      type: 'info',
      title: 'Study Planner Initialized',
      message: 'Log your completed study sessions and mock test results. Aura AI will dynamically compute your spaced repetition intervals and highlight weak concepts here.'
    });
  }

  return insights.slice(0, 5); // Keep top 5 high-impact insights
}


// --- SEED SEED DATA FOR FIRST VISIT ---
export function getSeedData() {
  const seedChapterStatusList: ChapterStatus[] = NEET_SYLLABUS.map(chap => {
    return {
      chapterName: chap.name,
      subject: chap.subject,
      status: 'Not Started',
      lastStudiedDate: null,
      nextRevisionDate: null,
      averageAccuracy: 0,
      totalHours: 0,
      totalMcqs: 0,
      confidenceTrend: []
    };
  });

  return {
    entries: [],
    tests: [],
    chapterStatuses: seedChapterStatusList,
    revisions: []
  };
}
