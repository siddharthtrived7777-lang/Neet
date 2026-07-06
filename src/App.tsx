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
  Sparkles,
  Download,
  Upload,
  Menu,
  X,
  FileText
} from 'lucide-react';
import { StudyEntry, TestEntry, ChapterStatus, RevisionTask, NEETSubject, ChapterStatusType } from './types';
import {
  getSeedData,
  createRevisionSchedule,
  adaptFutureRevisions,
  determineChapterStatusFromRevisions,
  formatDate,
  generateId,
  addDays
} from './utils';

// Component imports
import Dashboard from './components/Dashboard';
import StudyEntryForm from './components/StudyEntry';
import RevisionDashboard from './components/RevisionDashboard';
import ChapterStatusPage from './components/ChapterStatusPage';
import AnalyticsPage from './components/AnalyticsPage';
import TestTrackerPage from './components/TestTrackerPage';
import SearchPage from './components/SearchPage';
import AiInsightsPanel from './components/AiInsightsPanel';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [searchInitialChapter, setSearchInitialChapter] = useState<string>('');
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  // Core States
  const [entries, setEntries] = useState<StudyEntry[]>([]);
  const [tests, setTests] = useState<TestEntry[]>([]);
  const [chapterStatuses, setChapterStatuses] = useState<ChapterStatus[]>([]);
  const [revisions, setRevisions] = useState<RevisionTask[]>([]);

  // Load from Local Storage on mount
  useEffect(() => {
    const localEntries = localStorage.getItem('neet_study_entries');
    const localTests = localStorage.getItem('neet_tests');
    const localChapterStatuses = localStorage.getItem('neet_chapter_statuses');
    const localRevisions = localStorage.getItem('neet_revisions');
    
    // We force a hard reset to apply the user's request of "Reset days and hours I will add everything once website is ready"
    const hasReset = localStorage.getItem('neet_has_reset_v3') === 'true';

    if (!hasReset) {
      // Seed data on first launch (which is now clean/empty)
      const seed = getSeedData();
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
      if (localEntries) setEntries(JSON.parse(localEntries));
      if (localTests) setTests(JSON.parse(localTests));
      if (localChapterStatuses) setChapterStatuses(JSON.parse(localChapterStatuses));
      if (localRevisions) setRevisions(JSON.parse(localRevisions));
    }
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

  // 1. ADD STUDY ENTRY & MANAGE SPACED REPETITION
  const handleAddEntry = (newEntryData: Omit<StudyEntry, 'id' | 'accuracy' | 'durationMinutes'>) => {
    const id = generateId();
    const duration = Math.max(
      15,
      Math.floor((new Date(`${newEntryData.date}T${newEntryData.endTime}`).getTime() - 
                  new Date(`${newEntryData.date}T${newEntryData.startTime}`).getTime()) / (1000 * 60))
    );
    const accuracy = newEntryData.mcqsSolved > 0 
      ? Math.round((newEntryData.mcqsCorrect / newEntryData.mcqsSolved) * 100) 
      : 0;

    const entry: StudyEntry = {
      ...newEntryData,
      id,
      durationMinutes: isNaN(duration) ? 120 : duration,
      accuracy
    };

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

    // Auto Schedule Spaced Revisions if this is the first study block for this chapter
    let updatedRevs = [...revisions];
    if (isFirstTimeStudy) {
      const newSchedule = createRevisionSchedule(entry.chapter, entry.subject, entry.date);
      updatedRevs = [...updatedRevs, ...newSchedule];
    } else {
      // If chapter was studied before, adapt any pending revisions
      if (entry.mcqsSolved > 0) {
        updatedRevs = adaptFutureRevisions(updatedRevs, entry.chapter, 0, accuracy);
      }
    }

    // Determine and set current Chapter Stage/Status based on completed revision stages
    const finalStatuses = updatedStatuses.map(chap => {
      if (chap.chapterName === entry.chapter) {
        const nextRevTask = updatedRevs.find(r => r.chapterName === entry.chapter && !r.completed);
        const nextRevDate = nextRevTask ? nextRevTask.dueDate : null;
        
        // Find which base status to map to
        const mappedStatus = determineChapterStatusFromRevisions(updatedRevs, entry.chapter, 'Studying');
        
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
  };

  // 2. DELETE ENTRY
  const handleDeleteEntry = (id: string) => {
    const toDelete = entries.find(e => e.id === id);
    if (!toDelete) return;

    const filtered = entries.filter(e => e.id !== id);
    saveEntries(filtered);

    // Rollback stats slightly for corresponding chapter status
    const updatedStatuses = chapterStatuses.map(chap => {
      if (chap.chapterName === toDelete.chapter) {
        const remainingHrs = Math.max(0, chap.totalHours - (toDelete.durationMinutes / 60));
        const remainingMcqs = Math.max(0, chap.totalMcqs - toDelete.mcqsSolved);
        
        // Simple rollback approximation
        let newAvg = chap.averageAccuracy;
        if (remainingMcqs === 0) newAvg = 0;

        return {
          ...chap,
          totalHours: Number(remainingHrs.toFixed(2)),
          totalMcqs: remainingMcqs,
          averageAccuracy: newAvg
        };
      }
      return chap;
    });
    saveChapterStatuses(updatedStatuses);
  };

  // 3. COMPLETE REVISION TASK
  const handleCompleteRevision = (id: string, accuracy: number, mcqsSolved: number, notes: string) => {
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
      startTime: '10:00',
      endTime: '11:00',
      durationMinutes: 60,
      subject: completedTask.subject,
      chapter: completedTask.chapterName,
      topic: `Stage ${completedTask.stage} Spaced Revision`,
      studyType: 'Revision',
      mcqsSolved,
      mcqsCorrect: Math.round((accuracy / 100) * mcqsSolved),
      mcqsWrong: mcqsSolved - Math.round((accuracy / 100) * mcqsSolved),
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
        const mappedStatus = determineChapterStatusFromRevisions(adaptedRevs, completedTask.chapterName, 'Completed');

        const currentHours = chap.totalHours + 1.0; // simulated 1 hour revision
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
  };

  // 4. QUICK COMPLETE REVISION FROM TODAY'S TASKS LIST ON DASHBOARD
  const handleQuickCompleteRevision = (id: string) => {
    // Quick-logs standard 20 MCQs with 85% accuracy and auto-pushed note
    handleCompleteRevision(id, 85, 20, 'Checked off quickly from dashboard checklist.');
    alert('Revision completed quickly with standard feedback (20 MCQs, 85% Accuracy). Spaced calendar shifted!');
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

    alert(`Refresher for "${task.chapterName}" scheduled for tomorrow. High priority set!`);
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
  };

  // 7. DELETE MOCK SCORE
  const handleDeleteTest = (id: string) => {
    saveTests(tests.filter(t => t.id !== id));
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
        subject: foundSyllabus?.subject || 'Biology',
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
          alert('Backup database imported successfully! Dashboard values synchronized.');
        } else {
          alert('Malformed backup JSON file. Ensure you import a valid NEET planner export.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
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
  };

  // Nav to chapter search page and set query
  const handleSelectChapterForDeepView = (chapterName: string) => {
    setSearchInitialChapter(chapterName);
    setActiveTab('search');
  };

  return (
    <div className="min-h-screen bg-[#fafbfb] flex flex-col md:flex-row text-slate-800">
      
      {/* Mobile Top Navigation Header Bar */}
      <header className="md:hidden bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between shadow-md sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5.5 h-5.5 text-medical-200" />
          <span className="font-display font-black text-sm tracking-wide">NEET STUDY PLANNED</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-1 text-slate-200 hover:text-white"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
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
              { id: 'ai-coach', label: 'Aura AI Coach', icon: Sparkles }
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
          <div className="space-y-1">
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
            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="w-full text-center text-[11px] font-bold py-2 bg-red-950/30 text-red-400 hover:bg-red-900/40 hover:text-red-300 rounded-lg transition-all cursor-pointer"
              >
                Reset Days & Hours
              </button>
            ) : (
              <div className="space-y-1.5 bg-red-950/60 p-2 rounded-lg border border-red-900/40">
                <p className="text-[9px] text-red-300 font-semibold leading-normal text-center">Delete all sessions permanently?</p>
                <div className="grid grid-cols-2 gap-1.5 pt-0.5 font-bold text-[10px]">
                  <button
                    onClick={handleResetData}
                    className="py-1 bg-red-600 hover:bg-red-500 text-white rounded text-center cursor-pointer font-extrabold"
                  >
                    Yes, Reset
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-center cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="text-[9px] text-slate-500 text-center flex flex-col items-center">
            <span className="block font-mono">Offline Local Storage Active</span>
            <span className="block text-slate-600 mt-1">Made for NEET Aspirants</span>
          </div>
        </div>
      </aside>

      {/* Main app content stage */}
      <main className="flex-1 p-5 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
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
          />
        )}

        {activeTab === 'revisions' && (
          <RevisionDashboard
            revisions={revisions}
            onCompleteRevision={handleCompleteRevision}
            onMarkForgot={handleMarkForgot}
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

        {activeTab === 'ai-coach' && (
          <AiInsightsPanel
            entries={entries}
            tests={tests}
            chapterStatuses={chapterStatuses}
            revisions={revisions}
          />
        )}
      </main>

    </div>
  );
}
