/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  LayoutDashboard,
  PlusCircle,
  Calendar,
  Layers,
  BarChart2,
  Award,
  Search,
  Download,
  Upload,
  Menu,
  X,
  FileText,
  Cloud,
  CloudOff,
  LogOut,
  RefreshCw,
  Target,
  AlertTriangle,
  Flame,
  Sun,
  Moon
} from 'lucide-react';
import { StudyEntry, TestEntry, ChapterStatus, RevisionTask, NEETSubject, ChapterStatusType } from './types';
import { getChapterSubject } from './neetData';
import {
  getSeedData,
  createRevisionSchedule,
  adaptFutureRevisions,
  determineChapterStatusFromRevisions,
  getLatestDateForChapter,
  getLogicalTodayDate,
  getLogicalDateForSession,
  calculateDuration,
  formatDate,
  generateId,
  addDays,
  daysBetween,
  triggerToast,
  calculateStreaks,
  REVISION_INTERVALS
} from './utils';
import { motion, AnimatePresence } from 'motion/react';


// Firebase imports
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from './firebase';
import {
  testFirebaseConnection,
  fetchUserData,
  syncLocalDataToCloud,
  saveStudyEntryCloud,
  deleteStudyEntryCloud,
  saveTestEntryCloud,
  deleteTestEntryCloud,
  saveChapterStatusCloud,
  saveRevisionTaskCloud,
  deleteRevisionTaskCloud,
  saveExamDateCloud,
  fetchExamDateCloud
} from './firebaseService';
import AuthModal from './components/AuthModal';
import ExamCountdownModal from './components/ExamCountdownModal';
import CompleteRevisionModal from './components/CompleteRevisionModal';

// Component imports
import Dashboard from './components/Dashboard';
import StudyEntryForm from './components/StudyEntry';
import RevisionDashboard from './components/RevisionDashboard';
import ChapterStatusPage from './components/ChapterStatusPage';
import AnalyticsPage from './components/AnalyticsPage';
import TestTrackerPage from './components/TestTrackerPage';
import SearchPage from './components/SearchPage';
import TodayFocusPage from './components/TodayFocusPage';

// Helper to fix any previously miscategorized "Basic Maths" entries to Physics
function normalizeBasicMaths(
  entries: StudyEntry[],
  statuses: ChapterStatus[],
  revisions: RevisionTask[]
) {
  let changed = false;
  const nextEntries = entries.map(e => {
    if (e.chapter.toLowerCase() === 'basic maths' && e.subject !== 'Physics') {
      changed = true;
      return { ...e, subject: 'Physics' as const };
    }
    return e;
  });
  const nextStatuses = statuses.map(s => {
    if (s.chapterName.toLowerCase() === 'basic maths' && s.subject !== 'Physics') {
      changed = true;
      return { ...s, subject: 'Physics' as const };
    }
    return s;
  });
  const nextRevisions = revisions.map(r => {
    if (r.chapterName.toLowerCase() === 'basic maths' && r.subject !== 'Physics') {
      changed = true;
      return { ...r, subject: 'Physics' as const };
    }
    return r;
  });
  return { nextEntries, nextStatuses, nextRevisions, changed };
}

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [searchInitialChapter, setSearchInitialChapter] = useState<string>('');
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [resetConfirmText, setResetConfirmText] = useState<string>('');

  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('neet_dark_mode') === 'true';
  });
  const [showStreakStats, setShowStreakStats] = useState<boolean>(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('neet_dark_mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('neet_dark_mode', 'false');
    }
  }, [isDark]);

  // Core States
  const [entries, setEntries] = useState<StudyEntry[]>([]);
  const [tests, setTests] = useState<TestEntry[]>([]);
  const [chapterStatuses, setChapterStatuses] = useState<ChapterStatus[]>([]);
  const [revisions, setRevisions] = useState<RevisionTask[]>([]);

  // Compute Streaks and Total Days Studied
  const streaks = React.useMemo(() => {
    return calculateStreaks(entries);
  }, [entries]);

  const totalStudyDays = React.useMemo(() => {
    return new Set(entries.map(e => e.date)).size;
  }, [entries]);

  // Exam Countdown States
  const [examDate, setExamDate] = useState<string | null>(() => localStorage.getItem('neet_exam_date'));
  const [isExamModalOpen, setIsExamModalOpen] = useState<boolean>(false);

  // Firebase state
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [revisionToComplete, setRevisionToComplete] = useState<RevisionTask | null>(null);
  const [syncing, setSyncing] = useState<boolean>(false);

  // Toast notifications state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    window.showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      setToast({ message, type });
    };
    return () => {
      window.showToast = undefined;
    };
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [toast]);


  // Load from Local Storage on mount and start Firebase connection test
  useEffect(() => {
    testFirebaseConnection();

    const localEntries = localStorage.getItem('neet_study_entries');
    const localTests = localStorage.getItem('neet_tests');
    const localChapterStatuses = localStorage.getItem('neet_chapter_statuses');
    const localRevisions = localStorage.getItem('neet_revisions');
    
    // We force a hard reset to apply the user's request of "Reset days and hours I will add everything once website is ready"
    const hasReset = localStorage.getItem('neet_has_reset_v3') === 'true';

    let initialEntries: StudyEntry[] = [];
    let initialTests: TestEntry[] = [];
    let initialStatuses: ChapterStatus[] = [];
    let initialRevisions: RevisionTask[] = [];

    if (!hasReset) {
      // Seed data on first launch (which is now clean/empty)
      const seed = getSeedData();
      initialEntries = seed.entries;
      initialTests = seed.tests;
      initialStatuses = seed.chapterStatuses;
      initialRevisions = seed.revisions;

      setEntries(seed.entries);
      setTests(seed.tests);
      setChapterStatuses(seed.chapterStatuses);
      setRevisions(seed.revisions);

      localStorage.setItem('neet_study_entries', JSON.stringify(seed.entries));
      localStorage.setItem('neet_tests', JSON.stringify(seed.tests));
      localStorage.setItem('neet_chapter_statuses', JSON.stringify(seed.chapterStatuses));
      localStorage.setItem('neet_revisions', JSON.stringify(seed.revisions));
      localStorage.setItem('neet_has_visited', 'true');
      localStorage.setItem('neet_has_reset_v3', 'true');
    } else {
      if (localEntries) {
        initialEntries = JSON.parse(localEntries);
      }
      if (localTests) {
        initialTests = JSON.parse(localTests);
      }
      if (localChapterStatuses) {
        initialStatuses = JSON.parse(localChapterStatuses);
      }
      if (localRevisions) {
        initialRevisions = JSON.parse(localRevisions);
      }

      const { nextEntries, nextStatuses, nextRevisions, changed } = normalizeBasicMaths(
        initialEntries,
        initialStatuses,
        initialRevisions
      );

      initialEntries = nextEntries;
      initialStatuses = nextStatuses;
      initialRevisions = nextRevisions;

      setEntries(initialEntries);
      setTests(initialTests);
      setChapterStatuses(initialStatuses);
      setRevisions(initialRevisions);

      if (changed) {
        localStorage.setItem('neet_study_entries', JSON.stringify(initialEntries));
        localStorage.setItem('neet_chapter_statuses', JSON.stringify(initialStatuses));
        localStorage.setItem('neet_revisions', JSON.stringify(initialRevisions));
      }
    }

    // Set up Auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setSyncing(true);
        try {
          // Fetch existing database progress from cloud
          const cloudData = await fetchUserData(currentUser.uid);
          
          if (
            cloudData.entries.length > 0 || 
            cloudData.tests.length > 0 || 
            cloudData.revisions.length > 0
          ) {
            const { nextEntries, nextStatuses, nextRevisions, changed } = normalizeBasicMaths(
              cloudData.entries,
              cloudData.chapterStatuses,
              cloudData.revisions
            );

            // Cloud has existing data, update client states and offline fallback
            setEntries(nextEntries);
            setTests(cloudData.tests);
            setChapterStatuses(nextStatuses);
            setRevisions(nextRevisions);

            localStorage.setItem('neet_study_entries', JSON.stringify(nextEntries));
            localStorage.setItem('neet_tests', JSON.stringify(cloudData.tests));
            localStorage.setItem('neet_chapter_statuses', JSON.stringify(nextStatuses));
            localStorage.setItem('neet_revisions', JSON.stringify(nextRevisions));

            if (changed) {
              // Sync corrected subjects back to cloud!
              await syncLocalDataToCloud(currentUser.uid, {
                entries: nextEntries,
                tests: cloudData.tests,
                chapterStatuses: nextStatuses,
                revisions: nextRevisions
              });
            }
          } else {
            // Cloud is empty, sync current local state up to Firestore
            // Read from state or local variables to get latest loaded items
            await syncLocalDataToCloud(currentUser.uid, {
              entries: initialEntries,
              tests: initialTests,
              chapterStatuses: initialStatuses,
              revisions: initialRevisions
            });
          }

          // Sync exam date if authenticated
          const cloudExamDate = await fetchExamDateCloud(currentUser.uid);
          if (cloudExamDate) {
            setExamDate(cloudExamDate);
            localStorage.setItem('neet_exam_date', cloudExamDate);
          } else {
            const localExamDate = localStorage.getItem('neet_exam_date');
            if (localExamDate) {
              await saveExamDateCloud(currentUser.uid, localExamDate);
            }
          }
        } catch (error) {
          console.error("Cloud synchronisation failed:", error);
        } finally {
          setSyncing(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Save to Local Storage helpers
  const saveEntries = (updated: StudyEntry[]) => {
    setEntries(updated);
    localStorage.setItem('neet_study_entries', JSON.stringify(updated));
  };

  const saveTests = (updated: TestEntry[]) => {
    setTests(updated);
    localStorage.setItem('neet_tests', JSON.stringify(updated));
  };

  const saveChapterStatuses = (updated: ChapterStatus[]) => {
    setChapterStatuses(updated);
    localStorage.setItem('neet_chapter_statuses', JSON.stringify(updated));
  };

  const saveRevisions = (updated: RevisionTask[]) => {
    setRevisions(updated);
    localStorage.setItem('neet_revisions', JSON.stringify(updated));
  };

  const handleSaveExamDate = async (date: string | null) => {
    setExamDate(date);
    if (date) {
      localStorage.setItem('neet_exam_date', date);
    } else {
      localStorage.removeItem('neet_exam_date');
    }

    if (auth.currentUser) {
      await saveExamDateCloud(auth.currentUser.uid, date);
    }
  };

  // 1. ADD STUDY ENTRY & MANAGE SPACED REPETITION
  const handleAddEntry = (newEntryData: Omit<StudyEntry, 'id' | 'accuracy' | 'durationMinutes'>) => {
    const id = generateId();
    const logicalDate = getLogicalDateForSession(newEntryData.date, newEntryData.startTime);
    const duration = calculateDuration(newEntryData.startTime, newEntryData.endTime);
    const accuracy = newEntryData.mcqsSolved > 0 
      ? Math.round((newEntryData.mcqsCorrect / newEntryData.mcqsSolved) * 100) 
      : 0;

    const entry: StudyEntry = {
      ...newEntryData,
      date: logicalDate,
      id,
      durationMinutes: isNaN(duration) ? 120 : duration,
      accuracy
    };

    if (logicalDate !== newEntryData.date) {
      triggerToast(`Session logged on ${logicalDate} (Logical day ends at 6:00 AM).`, 'info');
    }

    const updatedEntries = [...entries, entry];
    saveEntries(updatedEntries);

    // Update Chapter Status List
    let isFirstTimeStudy = true;
    const updatedStatuses = chapterStatuses.map(chap => {
      if (chap.chapterName === entry.chapter) {
        isFirstTimeStudy = chap.totalHours === 0;
        
        // Accumulate statistics
        const currentHours = chap.totalHours + (entry.durationMinutes / 60);
        const currentMcqs = chap.totalMcqs + entry.mcqsSolved;
        
        // Compute running weighted average accuracy
        let currentAvgAccuracy = chap.averageAccuracy;
        if (entry.mcqsSolved > 0) {
          if (chap.totalMcqs === 0) {
            currentAvgAccuracy = accuracy;
          } else {
            currentAvgAccuracy = ((chap.averageAccuracy * chap.totalMcqs) + (accuracy * entry.mcqsSolved)) / currentMcqs;
          }
        }

        const currentTrends = [...chap.confidenceTrend, entry.confidenceLevel].slice(-5);

        return {
          ...chap,
          lastStudiedDate: entry.date,
          totalHours: Number(currentHours.toFixed(2)),
          totalMcqs: currentMcqs,
          averageAccuracy: Number(currentAvgAccuracy.toFixed(2)),
          confidenceTrend: currentTrends
        };
      }
      return chap;
    });

    // Auto Schedule Spaced Revisions if this is a Self Study session
    let updatedRevs = [...revisions];
    if (entry.studyType === 'Self Study') {
      const newSchedule = createRevisionSchedule(entry.chapter, entry.subject, entry.date, entry.topic, entry.id);
      updatedRevs = [...updatedRevs, ...newSchedule];
    }

    // Determine and set current Chapter Stage/Status based on completed revision stages
    const finalStatuses = updatedStatuses.map(chap => {
      if (chap.chapterName === entry.chapter) {
        const nextRevTask = updatedRevs.find(r => r.chapterName === entry.chapter && !r.completed);
        const nextRevDate = nextRevTask ? nextRevTask.dueDate : null;
        
        // Find which base status to map to
        const mappedStatus = determineChapterStatusFromRevisions(updatedRevs, entry.chapter, 'Studying', updatedEntries);
        
        return {
          ...chap,
          status: mappedStatus,
          nextRevisionDate: nextRevDate
        };
      }
      return chap;
    });

    saveChapterStatuses(finalStatuses);
    saveRevisions(updatedRevs);

    // Sync to Firebase if authenticated
    if (auth.currentUser) {
      const uid = auth.currentUser.uid;
      saveStudyEntryCloud(uid, entry);
      const affectedStatus = finalStatuses.find(chap => chap.chapterName === entry.chapter);
      if (affectedStatus) saveChapterStatusCloud(uid, affectedStatus);
      updatedRevs.forEach(rev => {
        if (rev.chapterName === entry.chapter) {
          saveRevisionTaskCloud(uid, rev);
        }
      });
    }
  };

  // 1.5. EDIT STUDY ENTRY
  const handleEditEntry = (id: string, updatedEntryData: StudyEntry) => {
    const oldEntry = entries.find(e => e.id === id);
    if (!oldEntry) return;

    // A. Rollback old stats from chapterStatuses
    const rolledBackStatuses = chapterStatuses.map(chap => {
      if (chap.chapterName === oldEntry.chapter) {
        const remainingHrs = Math.max(0, chap.totalHours - (oldEntry.durationMinutes / 60));
        const remainingMcqs = Math.max(0, chap.totalMcqs - oldEntry.mcqsSolved);
        
        let newAvg = 0;
        if (remainingMcqs > 0) {
          const totalCorrectBefore = (chap.averageAccuracy * chap.totalMcqs) / 100;
          const remainingCorrect = Math.max(0, totalCorrectBefore - oldEntry.mcqsCorrect);
          newAvg = (remainingCorrect / remainingMcqs) * 100;
        }

        // Remove last confidence level trend
        let updatedTrends = [...chap.confidenceTrend];
        const lastIdx = updatedTrends.lastIndexOf(oldEntry.confidenceLevel);
        if (lastIdx !== -1) {
          updatedTrends.splice(lastIdx, 1);
        }

        return {
          ...chap,
          totalHours: Number(remainingHrs.toFixed(2)),
          totalMcqs: remainingMcqs,
          averageAccuracy: Number(newAvg.toFixed(2)),
          confidenceTrend: updatedTrends
        };
      }
      return chap;
    });

    // B. Map date for the new updated entry using the logical day logic
    const logicalDate = getLogicalDateForSession(updatedEntryData.date, updatedEntryData.startTime);
    const duration = calculateDuration(updatedEntryData.startTime, updatedEntryData.endTime);
    const accuracy = updatedEntryData.mcqsSolved > 0 
      ? Math.round((updatedEntryData.mcqsCorrect / updatedEntryData.mcqsSolved) * 100) 
      : 0;

    const entry: StudyEntry = {
      ...updatedEntryData,
      date: logicalDate,
      durationMinutes: isNaN(duration) ? 120 : duration,
      accuracy
    };

    if (logicalDate !== updatedEntryData.date) {
      triggerToast(`Session logged on ${logicalDate} (Logical day ends at 6:00 AM).`, 'info');
    }

    // C. Update the entries array
    const updatedEntries = entries.map(e => e.id === id ? entry : e);
    saveEntries(updatedEntries);

    // D. Update revision schedule if chapter/topic/date changed
    let updatedRevs = [...revisions];
    const isNewTypeTracked = entry.studyType === 'Self Study';
    const isOldTypeTracked = oldEntry.studyType === 'Self Study';

    if (isOldTypeTracked && !isNewTypeTracked) {
      // User changed study type from tracked to non-tracked. Delete associated revisions.
      updatedRevs = updatedRevs.filter(r => {
        const shouldDelete = r.entryId === id || (!r.entryId && r.chapterName === oldEntry.chapter && !r.completed);
        if (shouldDelete) {
          if (auth.currentUser) {
            deleteRevisionTaskCloud(auth.currentUser.uid, r.id);
          }
          return false;
        }
        return true;
      });
    } else if (isNewTypeTracked) {
      // Check if we already have tasks for this entryId
      const hasTasksForEntry = updatedRevs.some(r => r.entryId === id);
      if (hasTasksForEntry) {
        // Update all tasks for this entryId based on new chapter, topic, date, etc.
        updatedRevs = updatedRevs.map(r => {
          if (r.entryId === id) {
            const days = REVISION_INTERVALS[r.stage - 1];
            return {
              ...r,
              chapterName: entry.chapter,
              subject: entry.subject,
              dueDate: addDays(entry.date, days),
              subtopics: entry.topic
            };
          }
          return r;
        });
      } else {
        // No existing tasks with this entry ID. Either old data or study type changed to Self Study/Revision.
        // First delete any legacy uncompleted revisions of old chapter to prevent duplicates if user is changing chapter
        if (oldEntry.chapter !== entry.chapter) {
          updatedRevs = updatedRevs.filter(r => {
            const shouldDelete = !r.entryId && r.chapterName === oldEntry.chapter && !r.completed;
            if (shouldDelete) {
              if (auth.currentUser) {
                deleteRevisionTaskCloud(auth.currentUser.uid, r.id);
              }
              return false;
            }
            return true;
          });
        }
        // Create new schedule
        const newSchedule = createRevisionSchedule(entry.chapter, entry.subject, entry.date, entry.topic, entry.id);
        updatedRevs = [...updatedRevs, ...newSchedule];
      }
    }

    saveRevisions(updatedRevs);

    // E. Apply new stats to chapterStatuses and compute statuses based on revisions
    const finalStatuses = rolledBackStatuses.map(chap => {
      if (chap.chapterName === entry.chapter) {
        const currentHours = chap.totalHours + (entry.durationMinutes / 60);
        const currentMcqs = chap.totalMcqs + entry.mcqsSolved;
        
        let currentAvgAccuracy = chap.averageAccuracy;
        if (entry.mcqsSolved > 0) {
          const totalCorrectBefore = (chap.averageAccuracy * chap.totalMcqs) / 100;
          const currentCorrect = totalCorrectBefore + entry.mcqsCorrect;
          currentAvgAccuracy = (currentCorrect / currentMcqs) * 100;
        }

        const currentTrends = [...chap.confidenceTrend, entry.confidenceLevel].slice(-5);
        const nextRevTask = updatedRevs.find(r => r.chapterName === entry.chapter && !r.completed);
        const nextRevDate = nextRevTask ? nextRevTask.dueDate : null;
        const mappedStatus = determineChapterStatusFromRevisions(updatedRevs, entry.chapter, currentHours > 0 ? 'Studying' : 'Not Started', updatedEntries);
        const latestDate = getLatestDateForChapter(entry.chapter, updatedEntries);

        return {
          ...chap,
          lastStudiedDate: latestDate,
          status: mappedStatus,
          nextRevisionDate: nextRevDate,
          totalHours: Number(currentHours.toFixed(2)),
          totalMcqs: currentMcqs,
          averageAccuracy: Number(currentAvgAccuracy.toFixed(2)),
          confidenceTrend: currentTrends
        };
      } else if (oldEntry.chapter !== entry.chapter && chap.chapterName === oldEntry.chapter) {
        // Also update old chapter's revisions mapping & status
        const nextRevTask = updatedRevs.find(r => r.chapterName === oldEntry.chapter && !r.completed);
        const nextRevDate = nextRevTask ? nextRevTask.dueDate : null;
        const mappedStatus = determineChapterStatusFromRevisions(updatedRevs, oldEntry.chapter, chap.totalHours > 0 ? 'Studying' : 'Not Started', updatedEntries);
        const latestDate = getLatestDateForChapter(oldEntry.chapter, updatedEntries);

        return {
          ...chap,
          lastStudiedDate: latestDate,
          status: mappedStatus,
          nextRevisionDate: nextRevDate
        };
      }
      return chap;
    });

    saveChapterStatuses(finalStatuses);

    // F. Sync to Firebase if authenticated
    if (auth.currentUser) {
      const uid = auth.currentUser.uid;
      saveStudyEntryCloud(uid, entry);
      const affectedStatus = finalStatuses.find(chap => chap.chapterName === entry.chapter);
      if (affectedStatus) saveChapterStatusCloud(uid, affectedStatus);
      if (oldEntry.chapter !== entry.chapter) {
        const oldAffectedStatus = finalStatuses.find(chap => chap.chapterName === oldEntry.chapter);
        if (oldAffectedStatus) saveChapterStatusCloud(uid, oldAffectedStatus);
      }
      // Sync revised tasks if changed
      updatedRevs.forEach(rev => {
        if (rev.chapterName === entry.chapter || (oldEntry.chapter !== entry.chapter && rev.chapterName === oldEntry.chapter)) {
          saveRevisionTaskCloud(uid, rev);
        }
      });
    }
  };

  // 2. DELETE ENTRY
  const handleDeleteEntry = (id: string) => {
    const toDelete = entries.find(e => e.id === id);
    if (!toDelete) return;

    const filtered = entries.filter(e => e.id !== id);
    saveEntries(filtered);

    // Rollback revisions
    let updatedRevs = [...revisions];
    if (toDelete.studyType === 'Self Study') {
      updatedRevs = updatedRevs.filter(r => {
        const shouldDelete = r.entryId === id || (!r.entryId && r.chapterName === toDelete.chapter && !r.completed);
        if (shouldDelete) {
          if (auth.currentUser) {
            deleteRevisionTaskCloud(auth.currentUser.uid, r.id);
          }
          return false;
        }
        return true;
      });
      saveRevisions(updatedRevs);
    }

    // Rollback stats slightly for corresponding chapter status
    const updatedStatuses = chapterStatuses.map(chap => {
      if (chap.chapterName === toDelete.chapter) {
        const remainingHrs = Math.max(0, chap.totalHours - (toDelete.durationMinutes / 60));
        const remainingMcqs = Math.max(0, chap.totalMcqs - toDelete.mcqsSolved);
        
        let newAvg = 0;
        if (remainingMcqs > 0) {
          const totalCorrectBefore = (chap.averageAccuracy * chap.totalMcqs) / 100;
          const remainingCorrect = Math.max(0, totalCorrectBefore - toDelete.mcqsCorrect);
          newAvg = (remainingCorrect / remainingMcqs) * 100;
        }

        // Remove last confidence level trend
        let updatedTrends = [...chap.confidenceTrend];
        const lastIdx = updatedTrends.lastIndexOf(toDelete.confidenceLevel);
        if (lastIdx !== -1) {
          updatedTrends.splice(lastIdx, 1);
        }

        const nextRevTask = updatedRevs.find(r => r.chapterName === toDelete.chapter && !r.completed);
        const nextRevDate = nextRevTask ? nextRevTask.dueDate : null;
        const mappedStatus = determineChapterStatusFromRevisions(updatedRevs, toDelete.chapter, remainingHrs > 0 ? 'Studying' : 'Not Started', filtered);
        const latestDate = getLatestDateForChapter(toDelete.chapter, filtered);

        return {
          ...chap,
          status: mappedStatus,
          nextRevisionDate: nextRevDate,
          lastStudiedDate: latestDate,
          totalHours: Number(remainingHrs.toFixed(2)),
          totalMcqs: remainingMcqs,
          averageAccuracy: Number(newAvg.toFixed(2)),
          confidenceTrend: updatedTrends
        };
      }
      return chap;
    });
    saveChapterStatuses(updatedStatuses);

    // Sync to Firebase if authenticated
    if (auth.currentUser) {
      const uid = auth.currentUser.uid;
      deleteStudyEntryCloud(uid, id);
      const affectedStatus = updatedStatuses.find(chap => chap.chapterName === toDelete.chapter);
      if (affectedStatus) saveChapterStatusCloud(uid, affectedStatus);
    }
  };

  // 3. COMPLETE REVISION TASK
  const handleCompleteRevision = (
    id: string,
    accuracy: number,
    mcqsSolved: number,
    notes: string,
    startTime: string = '10:00',
    endTime: string = '11:00',
    durationMinutes: number = 60,
    mcqsCorrect: number = 0,
    mcqsWrong: number = 0
  ) => {
    const todayStr = formatDate(new Date());

    const updatedRevs = revisions.map(rev => {
      if (rev.id === id) {
        return {
          ...rev,
          completed: true,
          completedDate: todayStr,
          accuracyAtRevision: accuracy
        };
      }
      return rev;
    });

    const completedTask = revisions.find(r => r.id === id);
    if (!completedTask) return;

    // Log a corresponding study entry for revision
    const simulatedEntry: StudyEntry = {
      id: generateId(),
      date: todayStr,
      startTime,
      endTime,
      durationMinutes,
      subject: completedTask.subject,
      chapter: completedTask.chapterName,
      topic: `Stage ${completedTask.stage} Spaced Revision`,
      studyType: 'Revision',
      mcqsSolved,
      mcqsCorrect,
      mcqsWrong,
      accuracy,
      confidenceLevel: accuracy >= 85 ? 'High' : accuracy >= 65 ? 'Medium' : 'Low',
      notes: notes || `Spaced revision stage ${completedTask.stage} successfully cleared.`
    };

    const newEntries = [...entries, simulatedEntry];
    saveEntries(newEntries);

    // Apply smart adaptations to remaining future revisions for this chapter based on accuracy
    const adaptedRevs = adaptFutureRevisions(updatedRevs, completedTask.chapterName, completedTask.stage, accuracy);
    saveRevisions(adaptedRevs);

    // Sync Chapter Status
    const updatedStatuses = chapterStatuses.map(chap => {
      if (chap.chapterName === completedTask.chapterName) {
        const nextRevTask = adaptedRevs.find(r => r.chapterName === completedTask.chapterName && !r.completed);
        const nextRevDate = nextRevTask ? nextRevTask.dueDate : null;
        const mappedStatus = determineChapterStatusFromRevisions(adaptedRevs, completedTask.chapterName, 'Completed', newEntries);

        const currentHours = chap.totalHours + (durationMinutes / 60); // actual user duration instead of simulated 1 hour
        const currentMcqs = chap.totalMcqs + mcqsSolved;
        let currentAvgAccuracy = chap.averageAccuracy;

        if (mcqsSolved > 0) {
          if (chap.totalMcqs === 0) {
            currentAvgAccuracy = accuracy;
          } else {
            currentAvgAccuracy = ((chap.averageAccuracy * chap.totalMcqs) + (accuracy * mcqsSolved)) / currentMcqs;
          }
        }

        return {
          ...chap,
          status: mappedStatus,
          lastStudiedDate: todayStr,
          nextRevisionDate: nextRevDate,
          totalHours: Number(currentHours.toFixed(2)),
          totalMcqs: currentMcqs,
          averageAccuracy: Number(currentAvgAccuracy.toFixed(2))
        };
      }
      return chap;
    });

    saveChapterStatuses(updatedStatuses);

    // Sync to Firebase if authenticated
    if (auth.currentUser) {
      const uid = auth.currentUser.uid;
      saveStudyEntryCloud(uid, simulatedEntry);
      adaptedRevs.forEach(rev => {
        if (rev.chapterName === completedTask.chapterName) {
          saveRevisionTaskCloud(uid, rev);
        }
      });
      const affectedStatus = updatedStatuses.find(chap => chap.chapterName === completedTask.chapterName);
      if (affectedStatus) saveChapterStatusCloud(uid, affectedStatus);
    }
  };

  // 4. QUICK COMPLETE REVISION FROM TODAY'S TASKS LIST ON DASHBOARD
  const handleQuickCompleteRevision = (id: string) => {
    const task = revisions.find(r => r.id === id);
    if (task) {
      setRevisionToComplete(task);
    }
  };

  // 5. MARK REVISION "I FORGOT" (IMMEDIATE TOMORROW SCHEDULING)
  const handleMarkForgot = (id: string) => {
    const task = revisions.find(r => r.id === id);
    if (!task) return;

    const updatedRevs = adaptFutureRevisions(revisions, task.chapterName, task.stage, 0, true);
    saveRevisions(updatedRevs);

    // Raise tomorrow's revision next date in chapter status
    const updatedStatuses = chapterStatuses.map(chap => {
      if (chap.chapterName === task.chapterName) {
        return {
          ...chap,
          nextRevisionDate: addDays(formatDate(new Date()), 1),
          status: 'Studying' as const // fall back to studying
        };
      }
      return chap;
    });
    saveChapterStatuses(updatedStatuses);

    // Sync to Firebase if authenticated
    if (auth.currentUser) {
      const uid = auth.currentUser.uid;
      updatedRevs.forEach(rev => {
        if (rev.chapterName === task.chapterName) {
          saveRevisionTaskCloud(uid, rev);
        }
      });
      const affectedStatus = updatedStatuses.find(chap => chap.chapterName === task.chapterName);
      if (affectedStatus) saveChapterStatusCloud(uid, affectedStatus);
    }

    triggerToast(`Refresher for "${task.chapterName}" scheduled for tomorrow. High priority set!`, 'info');
  };

  // 6. ADD MOCK SCORE
  const handleAddTest = (testData: Omit<TestEntry, 'id' | 'accuracy'>) => {
    const accuracy = testData.marks > 0 
      ? Number(((testData.marks / testData.outOf) * 100).toFixed(1)) 
      : 0;

    const test: TestEntry = {
      ...testData,
      id: generateId(),
      accuracy
    };

    saveTests([...tests, test]);

    // Sync to Firebase if authenticated
    if (auth.currentUser) {
      saveTestEntryCloud(auth.currentUser.uid, test);
    }
  };

  // 7. DELETE MOCK SCORE
  const handleDeleteTest = (id: string) => {
    saveTests(tests.filter(t => t.id !== id));

    // Sync to Firebase if authenticated
    if (auth.currentUser) {
      deleteTestEntryCloud(auth.currentUser.uid, id);
    }
  };

  // 7.5. DELETE REVISION TASK
  const handleDeleteRevision = (id: string) => {
    saveRevisions(revisions.filter(r => r.id !== id));

    // Sync to Firebase if authenticated
    if (auth.currentUser) {
      deleteRevisionTaskCloud(auth.currentUser.uid, id);
    }
  };

  // 8. URGENT RECOMMENDATION REVISION INJECTOR
  const handleUrgentScheduleRevision = (chapterName: string) => {
    const todayStr = formatDate(new Date());
    
    // Check if there are any pending revisions. If yes, pull closest tomorrow. If none, push one tomorrow.
    let updatedRevs = [...revisions];
    const pendingIndex = updatedRevs.findIndex(r => r.chapterName === chapterName && !r.completed);

    if (pendingIndex !== -1) {
      updatedRevs[pendingIndex].dueDate = addDays(todayStr, 1);
      updatedRevs[pendingIndex].priority = 'High';
    } else {
      const foundSyllabus = chapterStatuses.find(c => c.chapterName === chapterName);
      updatedRevs.push({
        id: generateId(),
        chapterName,
        subject: foundSyllabus?.subject || getChapterSubject(chapterName),
        stage: 1,
        dueDate: addDays(todayStr, 1),
        priority: 'High',
        completed: false,
        completedDate: null,
        accuracyAtRevision: null
      });
    }

    saveRevisions(updatedRevs);

    const updatedStatuses = chapterStatuses.map(chap => {
      if (chap.chapterName === chapterName) {
        return {
          ...chap,
          nextRevisionDate: addDays(todayStr, 1)
        };
      }
      return chap;
    });

    saveChapterStatuses(updatedStatuses);

    // Sync to Firebase if authenticated
    if (auth.currentUser) {
      const uid = auth.currentUser.uid;
      updatedRevs.forEach(rev => {
        if (rev.chapterName === chapterName) {
          saveRevisionTaskCloud(uid, rev);
        }
      });
      const affectedStatus = updatedStatuses.find(chap => chap.chapterName === chapterName);
      if (affectedStatus) saveChapterStatusCloud(uid, affectedStatus);
    }
  };

  // 9. IMPORT / EXPORT BACKUPS
  const handleExportJson = () => {
    const backupData = {
      entries,
      tests,
      chapterStatuses,
      revisions
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `neet_planner_backup_${formatDate(new Date())}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = e.target.files?.[0];
    if (!file) return;

    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.entries && parsed.tests && parsed.chapterStatuses && parsed.revisions) {
          saveEntries(parsed.entries);
          saveTests(parsed.tests);
          saveChapterStatuses(parsed.chapterStatuses);
          saveRevisions(parsed.revisions);

          // Sync to Firebase if authenticated
          if (auth.currentUser) {
            syncLocalDataToCloud(auth.currentUser.uid, parsed);
          }

          triggerToast('Backup database imported successfully! Dashboard values synchronized.', 'success');
        } else {
          triggerToast('Malformed backup JSON file. Ensure you import a valid NEET planner export.', 'error');
        }
      } catch (err) {
        triggerToast('Failed to parse JSON file.', 'error');
      }
    };
    fileReader.readAsText(file);
  };

  const handleResetData = () => {
    const seed = getSeedData();
    saveEntries(seed.entries);
    saveTests(seed.tests);
    saveChapterStatuses(seed.chapterStatuses);
    saveRevisions(seed.revisions);
    setShowResetConfirm(false);
    setResetConfirmText('');

    // Sync to Firebase if authenticated
    if (auth.currentUser) {
      syncLocalDataToCloud(auth.currentUser.uid, seed);
    }
    triggerToast('All data has been reset to default templates successfully.', 'success');
  };

  // Nav to chapter search page and set query
  const handleSelectChapterForDeepView = (chapterName: string) => {
    setSearchInitialChapter(chapterName);
    setActiveTab('search');
  };

  const todayStr = formatDate(new Date());
  const formattedToday = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const getExamCountdown = (isMobile: boolean = false) => {
    if (!examDate) {
      if (isMobile) return null;
      return (
        <button
          onClick={() => setIsExamModalOpen(true)}
          className="text-xs text-medical-600 hover:text-medical-700 font-bold underline transition-colors focus:outline-none cursor-pointer ml-1.5"
        >
          Set exam date
        </button>
      );
    }

    const diffDays = daysBetween(todayStr, examDate);

    if (diffDays === 0) {
      return (
        <button
          onClick={() => setIsExamModalOpen(true)}
          className="text-xs font-black text-amber-600 hover:text-amber-700 hover:underline transition-all focus:outline-none cursor-pointer ml-1.5 animate-pulse"
          title="Click to edit/clear exam date"
        >
          • Exam day! 🎉
        </button>
      );
    }

    if (diffDays < 0) {
      return null;
    }

    if (isMobile) {
      return (
        <button
          onClick={() => setIsExamModalOpen(true)}
          className="text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-bold focus:outline-none cursor-pointer hover:bg-amber-500/30 transition-all shadow-sm"
          title="Click to edit/clear exam date"
        >
          {diffDays}d left
        </button>
      );
    }

    return (
      <button
        onClick={() => setIsExamModalOpen(true)}
        className="text-xs font-extrabold text-amber-600 hover:text-amber-700 hover:underline transition-all focus:outline-none cursor-pointer ml-1.5"
        title="Click to edit/clear exam date"
      >
        • {diffDays} {diffDays === 1 ? 'day' : 'days'} to exam
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#fafbfb] dark:bg-slate-950 flex flex-col md:flex-row text-slate-800 dark:text-slate-100">
      
      {/* Mobile Top Navigation Header Bar */}
      <header className="md:hidden bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between shadow-md sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5.5 h-5.5 text-medical-200" />
          <span className="font-display font-black text-sm tracking-wide">NEET STUDY PLANNER</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-1.5 text-slate-300 hover:text-white transition-all rounded-lg"
            title={isDark ? "Light Mode" : "Dark Mode"}
          >
            {isDark ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-slate-400" />}
          </button>
          {getExamCountdown(true)}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1 text-slate-200 hover:text-white"
          >
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Main Sidebar (Desktop sidebar / mobile drawer drawer) */}
      <aside className={`fixed inset-y-0 left-0 md:relative z-40 bg-slate-900 text-slate-300 w-64 p-5 flex flex-col justify-between shadow-xl transition-transform duration-300 transform md:transform-none ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="space-y-6">
          {/* Logo Brand Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-medical-600 rounded-lg text-white shadow shadow-medical-500/20">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="font-display font-black text-white text-sm tracking-wide block leading-none">NEET PLANNED</span>
                <span className="text-[9px] text-slate-400 block mt-0.5 font-mono uppercase tracking-wider">Spaced repetition</span>
              </div>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav list items */}
          <nav className="space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'log-session', label: 'Log Study Session', icon: PlusCircle },
              { id: 'revisions', label: 'Spaced Revisions', icon: Calendar },
              { id: 'syllabus', label: 'Syllabus Tracker', icon: Layers },
              { id: 'analytics', label: 'Analytics', icon: BarChart2 },
              { id: 'mock-tests', label: 'Mock Scorecard', icon: Award },
              { id: 'search', label: 'Search Chapter', icon: Search },
              { id: 'today-focus', label: "Today's Focus", icon: Target }
            ].map(item => {
              const IconComp = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsSidebarOpen(false);
                    if (item.id !== 'search') setSearchInitialChapter(''); // clear initial search trigger if navigating elsewhere
                  }}
                  className={`w-full text-left flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    activeTab === item.id
                      ? 'bg-medical-700 text-white shadow'
                      : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <IconComp className="w-4.5 h-4.5 shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Data Persistence Action Controls at bottom of sidebar */}
        <div className="pt-4 border-t border-slate-800 space-y-3.5">
          {/* Appearance / Theme Toggle */}
          <div className="space-y-1">
            <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-500 block">Appearance</span>
            <button
              onClick={() => setIsDark(!isDark)}
              className="w-full flex items-center justify-between px-3 py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-all cursor-pointer text-xs font-semibold"
            >
              <div className="flex items-center gap-2">
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
                <span>{isDark ? "Switch to Light" : "Switch to Dark"}</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">{isDark ? "Dark" : "Light"}</span>
            </button>
          </div>

          <div className="space-y-1 border-t border-slate-850 pt-2.5">
            <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-500 block">Database backup</span>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
              <button
                onClick={handleExportJson}
                className="flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg transition-all text-slate-400 cursor-pointer text-xs"
              >
                <Download className="w-3.5 h-3.5" /> Export
              </button>

              <label className="flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg transition-all text-slate-400 cursor-pointer text-center text-xs">
                <Upload className="w-3.5 h-3.5" /> Import
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJson}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="space-y-1 border-t border-slate-800 pt-2.5">
            <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-500 block">Reset Application</span>
            <button
              onClick={() => {
                setShowResetConfirm(true);
                setResetConfirmText('');
              }}
              className="w-full text-center text-[11px] font-bold py-2 bg-red-950/30 text-red-400 hover:bg-red-900/40 hover:text-red-300 rounded-lg transition-all cursor-pointer"
            >
              Reset Days & Hours
            </button>
          </div>

          {/* Cloud Sync Integration Segment */}
          <div className="space-y-1.5 border-t border-slate-800 pt-2.5">
            <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-500 block">Cloud database sync</span>
            {user ? (
              <div className="bg-slate-800/60 rounded-lg p-2.5 border border-slate-700/30">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[10px] text-slate-300 font-bold block overflow-hidden text-ellipsis whitespace-nowrap max-w-[130px]" title={user.email || ''}>
                    {user.email}
                  </span>
                </div>
                <div className="text-[9px] text-slate-400 mt-1.5 flex items-center gap-1.5">
                  {syncing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-medical-400" />
                      <span>Syncing progress...</span>
                    </>
                  ) : (
                    <>
                      <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Tablet & Mobile synced</span>
                    </>
                  )}
                </div>
                <button
                  onClick={async () => {
                    await signOut(auth);
                    triggerToast("Signed out successfully. Returning to offline local storage mode.", "info");
                  }}
                  className="w-full text-center text-[9px] font-bold mt-2.5 py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded transition-all cursor-pointer flex items-center justify-center gap-1 border border-slate-800"
                >
                  <LogOut className="w-3 h-3" /> Sign Out
                </button>
              </div>
            ) : (
              <div className="bg-slate-800/40 rounded-lg p-2.5 border border-slate-800/40 flex flex-col items-center">
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-semibold mb-2">
                  <CloudOff className="w-3.5 h-3.5" />
                  <span>Offline Mode Active</span>
                </div>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="w-full text-center text-[10px] font-extrabold py-2 bg-medical-600 hover:bg-medical-500 text-white rounded-lg transition-all cursor-pointer shadow-sm shadow-medical-600/10 flex items-center justify-center gap-1"
                >
                  <Cloud className="w-3.5 h-3.5" /> Enable Cloud Sync
                </button>
                <span className="text-[8px] text-slate-500 mt-1.5 block text-center leading-normal">
                  Syncs your NEET progress for free across devices!
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main app content stage */}
      <main className="flex-1 p-5 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Global Page Header & Countdown */}
        <div id="global-page-header" className="flex flex-col md:flex-row md:items-start md:items-center md:justify-start border-b border-slate-200/60 dark:border-slate-800 pb-4 mb-6 gap-4 md:gap-6">
          <div className="flex items-start md:items-center gap-3 flex-wrap">
            <div>
              <span className="text-[10px] font-bold text-medical-600 dark:text-medical-400 uppercase tracking-widest block">NEET STUDY PLANNER</span>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl md:text-2xl font-display font-extrabold text-slate-800 dark:text-white capitalize tracking-tight">
                  {activeTab === 'dashboard' ? 'Overview Dashboard' : activeTab.replace('-', ' ')}
                </h1>
                
                {/* Clickable Streak Indicator right after the Heading */}
                {activeTab === 'dashboard' && (
                  <div className="relative inline-block text-left z-20">
                    <button
                      onClick={() => setShowStreakStats(!showStreakStats)}
                      className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-full border border-amber-500/30 text-xs font-bold transition-all cursor-pointer shadow-sm shadow-amber-500/5"
                      title="Click to view streak statistics"
                    >
                      <Flame className="w-4 h-4 text-amber-500 animate-pulse shrink-0" />
                      <span>{streaks.currentStreak} days</span>
                    </button>

                    <AnimatePresence>
                      {showStreakStats && (
                        <>
                          <div 
                            className="fixed inset-0 z-30" 
                            onClick={() => setShowStreakStats(false)} 
                          />
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute left-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl z-45 space-y-3 text-slate-800 dark:text-slate-100"
                          >
                            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                              <Flame className="w-4.5 h-4.5 text-amber-500 animate-bounce" />
                              <span className="font-display font-bold text-xs text-slate-700 dark:text-slate-200">Active Recall Streak</span>
                            </div>
                            
                            <div className="space-y-2 text-xs text-left">
                              <div className="flex justify-between items-center">
                                <span className="text-slate-500 dark:text-slate-400 font-semibold">Active Streak:</span>
                                <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{streaks.currentStreak} days</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-500 dark:text-slate-400 font-semibold">Longest Streak:</span>
                                <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{streaks.longestStreak} days</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-500 dark:text-slate-400 font-semibold">Strike Total:</span>
                                <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{totalStudyDays} days</span>
                              </div>
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800 rounded-xl px-3.5 py-2 shadow-sm text-xs text-slate-600 dark:text-slate-300 shrink-0">
              <Calendar className="w-4 h-4 text-slate-400" />
              <div className="flex items-center gap-1 flex-wrap">
                <span className="font-semibold text-slate-700 dark:text-slate-200">{formattedToday}</span>
                {getExamCountdown()}
              </div>
            </div>
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <Dashboard
            entries={entries}
            chapterStatuses={chapterStatuses}
            revisions={revisions}
            tests={tests}
            onNavigateToTab={(tab) => setActiveTab(tab)}
            onQuickCompleteRevision={handleQuickCompleteRevision}
          />
        )}

        {activeTab === 'log-session' && (
          <StudyEntryForm
            onAddEntry={handleAddEntry}
            entries={entries}
            onDeleteEntry={handleDeleteEntry}
            onEditEntry={handleEditEntry}
          />
        )}

        {activeTab === 'revisions' && (
          <RevisionDashboard
            revisions={revisions}
            onCompleteRevision={handleQuickCompleteRevision}
            onMarkForgot={handleMarkForgot}
            onDeleteRevision={handleDeleteRevision}
          />
        )}

        {activeTab === 'syllabus' && (
          <ChapterStatusPage
            chapterStatuses={chapterStatuses}
            onSelectChapter={handleSelectChapterForDeepView}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsPage
            entries={entries}
            chapterStatuses={chapterStatuses}
          />
        )}

        {activeTab === 'mock-tests' && (
          <TestTrackerPage
            tests={tests}
            onAddTest={handleAddTest}
            onDeleteTest={handleDeleteTest}
            onUrgentScheduleRevision={handleUrgentScheduleRevision}
          />
        )}

        {activeTab === 'search' && (
          <SearchPage
            entries={entries}
            chapterStatuses={chapterStatuses}
            revisions={revisions}
            initialChapterQuery={searchInitialChapter}
          />
        )}

        {activeTab === 'today-focus' && (
          <TodayFocusPage
            entries={entries}
            chapterStatuses={chapterStatuses}
            revisions={revisions}
            onNavigateToTab={(tab) => setActiveTab(tab)}
            onSetSearchQuery={(query) => setSearchInitialChapter(query)}
          />
        )}
      </main>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onAuthSuccess={(uid) => {
          // Sync automatically handled by onAuthStateChanged!
          triggerToast("Successfully connected to cloud database! Your progress is now synced across your tablet and mobile devices.", "success");
        }}
      />

      <ExamCountdownModal
        isOpen={isExamModalOpen}
        onClose={() => setIsExamModalOpen(false)}
        currentDate={examDate}
        onSave={handleSaveExamDate}
      />

      {/* High-Security Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 z-[120] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-slate-900 border border-red-900/65 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl shadow-rose-950/20 text-center relative overflow-hidden"
            >
              {/* Warning Header Indicator */}
              <div className="w-14 h-14 bg-red-950/50 border border-red-500/30 rounded-full flex items-center justify-center mx-auto text-red-500 shadow-inner">
                <AlertTriangle className="w-7 h-7 text-red-500 animate-bounce" />
              </div>

              <div className="space-y-2">
                <h3 className="font-display text-lg font-black text-white tracking-tight">
                  Are you absolutely sure?
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  This action will <span className="text-red-400 font-bold">permanently delete</span> all your accumulated study days, logged hours, mock scores, active recall streaks, and revision schedules. 
                </p>
                <p className="text-xs font-bold text-slate-300 bg-red-950/30 border border-red-900/30 px-3 py-1.5 rounded-lg inline-block">
                  ⚠️ This cannot be undone under any circumstances!
                </p>
              </div>

              {/* Secure input mechanism to unlock button */}
              <div className="space-y-2 text-left">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
                  Type <span className="text-red-400 font-mono font-black px-1 bg-slate-800 rounded">RESET</span> to confirm your intent:
                </label>
                <input
                  type="text"
                  value={resetConfirmText}
                  onChange={(e) => setResetConfirmText(e.target.value)}
                  placeholder="Type RESET"
                  className="w-full text-center px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono text-sm focus:outline-none focus:border-red-500 transition-all font-bold tracking-widest placeholder:tracking-normal placeholder:font-sans placeholder:font-medium"
                />
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetConfirm(false);
                    setResetConfirmText('');
                  }}
                  className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  No, Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResetData}
                  disabled={resetConfirmText !== 'RESET'}
                  className={`py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    resetConfirmText === 'RESET'
                      ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-950/40'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-850'
                  }`}
                >
                  Yes, Reset Everything
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CompleteRevisionModal
        isOpen={revisionToComplete !== null}
        revision={revisionToComplete}
        onClose={() => setRevisionToComplete(null)}
        onConfirm={(id, accuracy, mcqsSolved, notes, startTime, endTime, durationMinutes, mcqsCorrect, mcqsWrong) => {
          handleCompleteRevision(id, accuracy, mcqsSolved, notes, startTime, endTime, durationMinutes, mcqsCorrect, mcqsWrong);
          setRevisionToComplete(null);
          triggerToast('Revision completed successfully!', 'success');
        }}
      />

      {/* Dynamic Toast System */}
      <AnimatePresence>
        {toast && (
          <motion.div
            id="toast-notification-banner"
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 max-w-sm p-4 bg-white rounded-2xl border shadow-xl shadow-slate-100/40"
            style={{
              borderColor: toast.type === 'success' ? '#bbf7d0' : toast.type === 'error' ? '#fecaca' : '#e2e8f0'
            }}
          >
            <div className={`p-1.5 rounded-xl ${
              toast.type === 'success' ? 'bg-emerald-50 text-emerald-600' :
              toast.type === 'error' ? 'bg-red-50 text-red-600' :
              'bg-blue-50 text-blue-600'
            }`}>
              {toast.type === 'success' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : toast.type === 'error' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.085 1.086L12.5 13m0-4.5h.008v.008H12.5V8.5z" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 leading-tight">
                {toast.type === 'success' ? 'Success' : toast.type === 'error' ? 'Error' : 'Notification'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                {toast.message}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
