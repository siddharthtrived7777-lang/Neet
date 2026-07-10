import { StudyEntry, NEETSubject } from '../types';
import { formatDate, daysBetween } from '../utils';

export interface FocusStats {
  subject: NEETSubject;
  hours: number;
  revisions: number;
  percentageOfTotal: number;
}

export interface FocusInsightResult {
  insight: string;
  isImbalance: boolean;
  stats: FocusStats[];
  totalHours: number;
  totalRevisions: number;
  primaryFocusSubject: NEETSubject | null;
}

export function calculateFocusInsight(entries: StudyEntry[]): FocusInsightResult {
  const subjects: NEETSubject[] = ['Physics', 'Chemistry', 'Biology'];
  const todayStr = formatDate(new Date());

  // Initialize stats maps
  const hoursMap: Record<NEETSubject, number> = { Physics: 0, Chemistry: 0, Biology: 0 };
  const revisionsMap: Record<NEETSubject, number> = { Physics: 0, Chemistry: 0, Biology: 0 };

  // Filter entries in the last 7 days (including today)
  const last7DaysEntries = entries.filter(e => {
    const diff = daysBetween(e.date, todayStr);
    return diff >= 0 && diff < 7;
  });

  last7DaysEntries.forEach(e => {
    const hrs = e.durationMinutes / 60;
    if (subjects.includes(e.subject)) {
      hoursMap[e.subject] += hrs;
      if (e.studyType === 'Revision' && e.topic.includes('Spaced Revision')) {
        revisionsMap[e.subject] += 1;
      }
    }
  });

  const totalHours = Object.values(hoursMap).reduce((a, b) => a + b, 0);
  const totalRevisions = Object.values(revisionsMap).reduce((a, b) => a + b, 0);

  // Compute stats list
  const stats: FocusStats[] = subjects.map(subj => ({
    subject: subj,
    hours: Number(hoursMap[subj].toFixed(1)),
    revisions: revisionsMap[subj],
    percentageOfTotal: totalHours > 0 ? Math.round((hoursMap[subj] / totalHours) * 100) : 0
  }));

  let insight = "Balanced week so far — keep it up.";
  let isImbalance = false;
  let primaryFocusSubject: NEETSubject | null = null;

  // Rule 1: Revision completed imbalance (one subject is revised >= 2 times, another is revised 0 times)
  const maxRevSubject = subjects.reduce((a, b) => (revisionsMap[a] > revisionsMap[b] ? a : b));
  const minRevSubject = subjects.reduce((a, b) => (revisionsMap[a] < revisionsMap[b] ? a : b));
  
  const maxRevs = revisionsMap[maxRevSubject];
  const minRevs = revisionsMap[minRevSubject];

  if (maxRevs >= 2 && minRevs === 0) {
    insight = `You've revised ${maxRevSubject} ${maxRevs}x this week but ${minRevSubject} 0x — shift focus today.`;
    isImbalance = true;
    primaryFocusSubject = minRevSubject;
  } 
  // Rule 2: Hours logged imbalance
  else if (totalHours > 2) {
    const avgHours = totalHours / subjects.length;
    // Find subject with the lowest relative activity
    const lowestHoursSubject = subjects.reduce((a, b) => (hoursMap[a] < hoursMap[b] ? a : b));
    const lowHours = hoursMap[lowestHoursSubject];

    if (lowHours < avgHours * 0.7) {
      // It is at least 30% below average
      const pctBelow = Math.round((1 - (lowHours / avgHours)) * 100);
      insight = `${lowestHoursSubject} hours are ${pctBelow}% below your weekly average — consider a session today.`;
      isImbalance = true;
      primaryFocusSubject = lowestHoursSubject;
    }
  }

  return {
    insight,
    isImbalance,
    stats,
    totalHours: Number(totalHours.toFixed(1)),
    totalRevisions,
    primaryFocusSubject
  };
}
