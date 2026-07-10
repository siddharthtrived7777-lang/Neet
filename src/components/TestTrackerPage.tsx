/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Award, Target, BookOpen, AlertCircle, PlusCircle, CheckCircle, Trash2, HelpCircle } from 'lucide-react';
import { TestEntry, NEETSubject } from '../types';
import { NEET_SYLLABUS } from '../neetData';
import { formatDate, triggerToast, getLogicalTodayDate } from '../utils';

interface TestTrackerPageProps {
  tests: TestEntry[];
  onAddTest: (test: Omit<TestEntry, 'id' | 'accuracy'>) => void;
  onDeleteTest: (id: string) => void;
  onUrgentScheduleRevision: (chapterName: string) => void;
}

export default function TestTrackerPage({
  tests,
  onAddTest,
  onDeleteTest,
  onUrgentScheduleRevision
}: TestTrackerPageProps) {
  // Form States
  const [testName, setTestName] = useState<string>('');
  const [marks, setMarks] = useState<number>(580);
  const [outOf, setOutOf] = useState<number>(720);
  const [date, setDate] = useState<string>(() => getLogicalTodayDate());
  const [subjectFocus, setSubjectFocus] = useState<NEETSubject>('Biology');
  const [tempWrongChapter, setTempWrongChapter] = useState<string>('');
  const [wrongChapters, setWrongChapters] = useState<string[]>([]);
  const [weakChapters, setWeakChapters] = useState<string[]>([]);

  // Notification state
  const [notification, setNotification] = useState<string | null>(null);

  // Filter NEET_SYLLABUS based on subjectFocus
  const availableChapters = useMemo(() => {
    return NEET_SYLLABUS.filter(chap => chap.subject === subjectFocus);
  }, [subjectFocus]);

  // Add Wrong Chapter Tag
  const handleAddWrongChapter = (chapter: string) => {
    if (!chapter) return;
    if (!wrongChapters.includes(chapter)) {
      setWrongChapters([...wrongChapters, chapter]);
    }
    // Also consider it weak
    if (!weakChapters.includes(chapter)) {
      setWeakChapters([...weakChapters, chapter]);
    }
  };

  // Remove Wrong Chapter Tag
  const handleRemoveWrongChapter = (chapter: string) => {
    setWrongChapters(wrongChapters.filter(c => c !== chapter));
    setWeakChapters(weakChapters.filter(c => c !== chapter));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testName.trim()) {
      triggerToast('Please provide a mock test name.', 'error');
      return;
    }
    if (marks > outOf) {
      triggerToast('Marks cannot exceed total maximum marks.', 'error');
      return;
    }

    onAddTest({
      date,
      name: testName.trim(),
      marks,
      outOf,
      wrongChapters,
      weakChapters
    });

    // Reset Form
    setTestName('');
    setWrongChapters([]);
    setWeakChapters([]);
    setNotification('Successfully logged mock exam! Mistake chapters flagged for active revision.');
    setTimeout(() => setNotification(null), 4000);
  };

  // Auto recommend revisions based on mistakes
  const recommendedRevisions = useMemo(() => {
    const chaptersWithMistakes = new Set<string>();
    tests.forEach(test => {
      test.wrongChapters.forEach(chap => chaptersWithMistakes.add(chap));
      test.weakChapters.forEach(chap => chaptersWithMistakes.add(chap));
    });

    return Array.from(chaptersWithMistakes).map(chapterName => {
      // Find subject of chapter from syllabus
      const found = NEET_SYLLABUS.find(c => c.name === chapterName);
      return {
        chapterName,
        subject: found?.subject || ('Biology' as NEETSubject)
      };
    });
  }, [tests]);

  return (
    <div id="test-tracker-section" className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">Mock Test Scorecard Tracker</h1>
          <p className="text-sm text-slate-500 mt-1">Register full-syllabus or unit test results to track selective conceptual weaknesses.</p>
        </div>
      </div>

      {notification && (
        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl p-4 text-sm flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="font-medium">{notification}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Mock Exam Entry Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <Target className="w-4.5 h-4.5 text-red-500" /> Log Mock Exam Score
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-8">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Mock Exam Name</label>
                <input
                  type="text"
                  placeholder="e.g. NTA NEET Mock Test 12, Part Syllabus Biology 01..."
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  className="w-full bg-slate-50 text-slate-700 text-xs border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-amber-500 focus:bg-white transition-all"
                  required
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  onClick={(e) => { try { (e.target as any).showPicker(); } catch (err) {} }}
                  className="w-full bg-slate-50 text-slate-700 text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-amber-500 focus:bg-white h-9.5 cursor-pointer"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Achieved Marks</label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={marks}
                  onChange={(e) => setMarks(Number(e.target.value))}
                  className="w-full bg-slate-50 text-slate-800 text-sm font-mono font-bold border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Maximum Marks</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={outOf}
                  onChange={(e) => setOutOf(Number(e.target.value))}
                  className="w-full bg-slate-50 text-slate-800 text-sm font-mono font-bold border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Live Mock Percentage */}
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs text-slate-600">
              <span className="font-semibold text-slate-700 block">Test score accuracy:</span>
              <span className="font-mono font-bold text-slate-800 bg-white px-2 py-1 rounded border border-slate-100">
                {marks > 0 && outOf > 0 ? `${((marks / outOf) * 100).toFixed(1)}%` : '0%'}
              </span>
            </div>

            {/* Select Chapters with Mistakes */}
            <div className="border border-slate-150 rounded-2xl p-4 bg-slate-50/50 space-y-3">
              <div>
                <span className="text-xs font-bold text-slate-700 block">Flag Mistake Chapters (Recommends Revisions)</span>
                <span className="text-[10px] text-slate-400">Chapters where you lost negative marks or got questions wrong:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">1. Choose Subject</label>
                  <select
                    value={subjectFocus}
                    onChange={(e) => setSubjectFocus(e.target.value as NEETSubject)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs outline-none focus:border-amber-500"
                  >
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">2. Match Chapter</label>
                  <select
                    value={tempWrongChapter}
                    onChange={(e) => {
                      handleAddWrongChapter(e.target.value);
                      setTempWrongChapter('');
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs outline-none focus:border-amber-500"
                  >
                    <option value="">-- Choose Chapter --</option>
                    {availableChapters.map(chap => (
                      <option key={chap.name} value={chap.name}>{chap.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tag Outputs */}
              {wrongChapters.length > 0 && (
                <div className="pt-2">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Mistake List:</span>
                  <div className="flex flex-wrap gap-2">
                    {wrongChapters.map(chap => (
                      <span
                        key={chap}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium bg-rose-50 text-rose-800 border border-rose-200 rounded-full"
                      >
                        {chap}
                        <button
                          type="button"
                          onClick={() => handleRemoveWrongChapter(chap)}
                          className="hover:text-rose-950 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-amber-600 text-white hover:bg-amber-700 font-medium rounded-xl text-xs px-4 py-3 text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow"
            >
              <PlusCircle className="w-4.5 h-4.5" /> Save Mock Result
            </button>
          </form>
        </div>

        {/* Mock history and Recommended revisions based on errors */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Mock Test Score History */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4 flex flex-col h-[280px]">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-50 pb-2.5">
              <Award className="w-4 h-4 text-amber-600" /> Mock Scorecard History
            </h3>

            {tests.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10 flex-1 flex flex-col justify-center items-center">
                <HelpCircle className="w-8 h-8 text-slate-300 mb-2" />
                No Mock scores entered yet. Log your test marks to enable mistake analysis.
              </p>
            ) : (
              <div className="overflow-y-auto flex-1 pr-1 space-y-3">
                {[...tests]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map(test => {
                    const pct = (test.marks / test.outOf) * 100;
                    return (
                      <div key={test.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 group transition-all">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-xs font-bold text-slate-800 leading-tight">{test.name}</h4>
                            <span className="text-[10px] text-slate-400 font-mono block mt-1">{test.date}</span>
                          </div>
                          <button
                            onClick={() => onDeleteTest(test.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded transition-all opacity-0 group-hover:opacity-100"
                            title="Delete exam record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-200/40 mt-2.5 pt-2 text-[11px]">
                          <span className="text-slate-500 font-medium">Marks: <strong className="text-slate-700">{test.marks}/{test.outOf}</strong></span>
                          <span className={`font-mono font-bold ${
                            pct >= 85 ? 'text-emerald-600' : pct >= 70 ? 'text-teal-600' : 'text-amber-600'
                          }`}>{pct.toFixed(1)}% Accuracy</span>
                        </div>

                        {test.wrongChapters.length > 0 && (
                          <div className="mt-2 text-[10px] text-slate-400 flex flex-wrap gap-1">
                            <span className="font-semibold text-rose-600 text-[9px] uppercase tracking-wide mr-1 shrink-0">Errors:</span>
                            {test.wrongChapters.slice(0, 3).map(c => (
                              <span key={c} className="bg-white border border-slate-150 px-1.5 py-0.2 rounded text-[9px] text-slate-500 truncate max-w-[120px]" title={c}>
                                {c}
                              </span>
                            ))}
                            {test.wrongChapters.length > 3 && <span>+{test.wrongChapters.length - 3} more</span>}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Automatic recommended revisions */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4 flex flex-col h-[280px]">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-50 pb-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500" /> Recommendations based on mistakes
            </h3>

            {recommendedRevisions.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10 flex-1 flex flex-col justify-center items-center">
                <BookOpen className="w-8 h-8 text-slate-300 mb-2" />
                No errors recorded in tests. Keep up the flawless work!
              </p>
            ) : (
              <div className="overflow-y-auto flex-1 pr-1 space-y-2.5">
                {recommendedRevisions.map(rec => (
                  <div key={rec.chapterName} className="p-3 bg-slate-50 rounded-xl border border-slate-150 flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5 truncate flex-1">
                      <span className="font-bold text-slate-800 block truncate leading-tight">{rec.chapterName}</span>
                      <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">{rec.subject}</span>
                    </div>
                    
                    <button
                      onClick={() => {
                        onUrgentScheduleRevision(rec.chapterName);
                        triggerToast(`Scheduled an urgent revision for "${rec.chapterName}" tomorrow! Check your Revision Dashboard.`, 'info');
                      }}
                      className="px-2.5 py-1 text-[10px] font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 rounded-lg border border-rose-200 hover:border-rose-600 transition-all cursor-pointer shrink-0"
                    >
                      Urgent Schedule
                    </button>
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
