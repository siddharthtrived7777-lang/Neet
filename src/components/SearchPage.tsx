/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Search, Info, HelpCircle, Calendar, Sparkles, Clock, Target, AlertTriangle } from 'lucide-react';
import { StudyEntry, ChapterStatus, RevisionTask } from '../types';
import { NEET_SYLLABUS, SUBJECT_COLORS } from '../neetData';

interface SearchPageProps {
  entries: StudyEntry[];
  chapterStatuses: ChapterStatus[];
  revisions: RevisionTask[];
  initialChapterQuery?: string; // allow quick linking from other pages
}

export default function SearchPage({
  entries,
  chapterStatuses,
  revisions,
  initialChapterQuery = ''
}: SearchPageProps) {
  const [searchQuery, setSearchQuery] = useState<string>(initialChapterQuery);

  // Filter full syllabus list based on search query
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return NEET_SYLLABUS.filter(chap =>
      chap.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Deep Chapter Stats Analyzer
  const selectedChapterDetails = useMemo(() => {
    if (!searchQuery.trim()) return null;

    // Find if exact match exists, or default to first match
    const exactSyllabus = NEET_SYLLABUS.find(c => c.name.toLowerCase() === searchQuery.toLowerCase()) || 
                          NEET_SYLLABUS.find(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!exactSyllabus) return null;

    const name = exactSyllabus.name;

    // Fetch status
    const statusObj = chapterStatuses.find(c => c.chapterName === name);
    
    // Fetch study entries of this chapter
    const chapEntries = entries.filter(e => e.chapter === name);

    // Fetch revisions of this chapter
    const chapRevisions = revisions.filter(r => r.chapterName === name);

    // Calculate total hours
    const totalHrs = chapEntries.reduce((acc, curr) => acc + curr.durationMinutes / 60, 0);

    // Calculate MCQs
    const totalSolved = chapEntries.reduce((acc, curr) => acc + curr.mcqsSolved, 0);
    const totalCorrect = chapEntries.reduce((acc, curr) => acc + curr.mcqsCorrect, 0);
    const avgAccuracy = totalSolved > 0 ? Math.round((totalCorrect / totalSolved) * 100) : 0;

    // Extract mistakes/notes
    const mistakes = chapEntries
      .filter(e => e.notes && e.notes.trim() !== '')
      .map(e => ({
        date: e.date,
        topic: e.topic,
        notes: e.notes
      }));

    return {
      name,
      subject: exactSyllabus.subject,
      unit: exactSyllabus.unit,
      status: statusObj?.status || 'Not Started',
      nextRevisionDate: statusObj?.nextRevisionDate || null,
      totalHours: totalHrs,
      totalMcqs: totalSolved,
      avgAccuracy,
      entriesCount: chapEntries.length,
      revisions: chapRevisions,
      mistakes,
      recentEntries: chapEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)
    };
  }, [searchQuery, chapterStatuses, entries, revisions]);

  const selectChapter = (name: string) => {
    setSearchQuery(name);
  };

  return (
    <div id="search-section" className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">Syllabus Encyclopedia</h1>
          <p className="text-sm text-slate-500 mt-1">Deep search any chapter in the NEET curriculum to analyze study logs, accuracy trends, and spaced notes.</p>
        </div>
      </div>

      {/* Main Search Bar */}
      <div className="relative w-full">
        <input
          type="text"
          placeholder="Search any Physics, Chemistry, or Biology chapter (e.g. Semiconductor, Cell, Mole, Hydrocarbons)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white text-slate-700 text-sm border border-slate-200 rounded-2xl pl-11 pr-4 py-3.5 outline-none focus:border-medical-500 focus:ring-1 focus:ring-medical-500 shadow-sm"
        />
        <Search className="absolute left-4 top-4.5 w-5 h-5 text-slate-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Search Results Autocomplete panel (Left side, matches search term) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4 h-[440px] flex flex-col">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-2.5">
            Syllabus Match suggestions
          </h2>

          {!searchQuery.trim() ? (
            <p className="text-xs text-slate-400 text-center py-12 flex-1 flex flex-col justify-center items-center gap-1.5">
              <Info className="w-7 h-7 text-slate-300" />
              Begin typing in the search bar above to matches standard NEET syllabus chapters.
            </p>
          ) : searchResults.length === 0 ? (
            <p className="text-xs text-rose-500 text-center py-12 flex-1 flex flex-col justify-center items-center">
              No matching NEET syllabus chapter found. Check your spelling or select a custom subject chapter.
            </p>
          ) : (
            <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
              {searchResults.map(chap => {
                const colors = SUBJECT_COLORS[chap.subject] || SUBJECT_COLORS.Biology;
                const activeStatus = chapterStatuses.find(c => c.chapterName === chap.name)?.status || 'Not Started';
                return (
                  <button
                    key={chap.name}
                    onClick={() => selectChapter(chap.name)}
                    className="w-full text-left py-3 px-2 text-xs hover:bg-slate-50 transition-all flex items-center justify-between group"
                  >
                    <div className="space-y-0.5 max-w-[160px] md:max-w-xs">
                      <span className="font-bold text-slate-700 group-hover:text-medical-700 transition-all block truncate">
                        {chap.name}
                      </span>
                      <span className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded font-mono uppercase tracking-wide ${colors.bg} ${colors.text}`}>
                        {chap.subject}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      {activeStatus}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Detailed Chapter Dashboard (Right side) */}
        <div className="lg:col-span-8">
          {!selectedChapterDetails ? (
            <div className="bg-white rounded-2xl border border-slate-150 p-10 shadow-sm text-center flex flex-col justify-center items-center h-[440px] text-slate-400">
              <HelpCircle className="w-12 h-12 text-slate-200 mb-3" />
              <h3 className="font-display font-semibold text-slate-700">No Chapter Selected</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">Select one of the matches in the suggestions sidebar or search an exact term to pull its complete spaced repetition and analytics profile.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
              {/* Profile Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold bg-medical-50 text-medical-700 border border-medical-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {selectedChapterDetails.subject} • {selectedChapterDetails.unit}
                  </span>
                  <h2 className="font-display font-bold text-xl text-slate-800 tracking-tight leading-tight pt-1.5">
                    {selectedChapterDetails.name}
                  </h2>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex flex-col items-center justify-center text-center sm:min-w-[120px]">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wide">Status</span>
                  <span className="text-xs font-bold text-slate-700 mt-1">{selectedChapterDetails.status}</span>
                </div>
              </div>

              {/* Quantitative Performance Metrics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50/50 border border-slate-150 p-4 rounded-xl text-center space-y-1">
                  <Clock className="w-4 h-4 text-slate-400 mx-auto" />
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wide block">Total Study</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">{selectedChapterDetails.totalHours.toFixed(1)}h</span>
                </div>

                <div className="bg-slate-50/50 border border-slate-150 p-4 rounded-xl text-center space-y-1">
                  <Target className="w-4 h-4 text-slate-400 mx-auto" />
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wide block">MCQs Attempted</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">{selectedChapterDetails.totalMcqs}</span>
                </div>

                <div className="bg-slate-50/50 border border-slate-150 p-4 rounded-xl text-center space-y-1">
                  <Sparkles className="w-4 h-4 text-slate-400 mx-auto" />
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wide block">Practice Accuracy</span>
                  <span className={`font-mono font-bold text-sm ${
                    selectedChapterDetails.avgAccuracy >= 90
                      ? 'text-emerald-600'
                      : selectedChapterDetails.avgAccuracy >= 75
                      ? 'text-teal-600'
                      : 'text-amber-600'
                  }`}>
                    {selectedChapterDetails.totalMcqs > 0 ? `${selectedChapterDetails.avgAccuracy}%` : '—'}
                  </span>
                </div>
              </div>

              {/* Next Revision Calendar Info */}
              <div className="bg-medical-50/40 border border-medical-100 rounded-xl p-4 flex items-center justify-between text-xs text-medical-800">
                <span className="flex items-center gap-2 font-medium">
                  <Calendar className="w-4.5 h-4.5 text-medical-600" /> Next Spaced Revision Scheduled:
                </span>
                <span className="font-mono font-bold bg-white px-2.5 py-1 rounded border border-medical-200">
                  {selectedChapterDetails.nextRevisionDate ? selectedChapterDetails.nextRevisionDate : 'Not scheduled yet'}
                </span>
              </div>

              {/* Detailed lists: History, Mistakes, Revisions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Spaced Revisions History */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-2">
                    Spaced Revision Stages
                  </h3>

                  {selectedChapterDetails.revisions.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">No active revision stages generated yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                      {selectedChapterDetails.revisions
                        .sort((a, b) => a.stage - b.stage)
                        .map(rev => (
                          <div key={rev.id} className="p-2 bg-slate-50 rounded-lg border border-slate-150 flex items-center justify-between text-xs font-medium">
                            <span className="text-slate-700">Stage {rev.stage} Review</span>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                              rev.completed
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-200 text-slate-600'
                            }`}>
                              {rev.completed ? `Done (Acc: ${rev.accuracyAtRevision || '—'}%)` : `Due: ${rev.dueDate}`}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Conceptual Mistakes logs */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-2">
                    Formula Mistakes & Notes Log
                  </h3>

                  {selectedChapterDetails.mistakes.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">No formula mistakes or conceptual errors logged for this chapter.</p>
                  ) : (
                    <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                      {selectedChapterDetails.mistakes.map((m, idx) => (
                        <div key={idx} className="p-2 bg-rose-50/30 rounded-lg border border-rose-100 space-y-1 text-xs">
                          <div className="flex justify-between text-[9px] font-mono font-bold text-rose-700">
                            <span>{m.topic}</span>
                            <span>{m.date}</span>
                          </div>
                          <p className="text-slate-600 leading-relaxed text-[11px]">{m.notes}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Sessions */}
              <div className="space-y-3 border-t border-slate-100 pt-5">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Chapter Session History
                </h3>
                
                {selectedChapterDetails.recentEntries.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No study entries logged for this chapter.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedChapterDetails.recentEntries.map(entry => (
                      <div key={entry.id} className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs space-y-1">
                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                          <span>{entry.date}</span>
                          <span>{entry.studyType}</span>
                        </div>
                        <p className="font-bold text-slate-700 leading-snug">{entry.topic}</p>
                        <p className="text-[10px] text-slate-500 font-mono">Duration: {entry.durationMinutes}m • Conf: {entry.confidenceLevel}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
