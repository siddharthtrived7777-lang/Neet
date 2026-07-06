/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { BookOpen, CheckCircle, Clock, PlusCircle, Search, Target, Award, ListFilter, Trash2 } from 'lucide-react';
import { StudyEntry, NEETSubject, StudyType, ConfidenceLevel } from '../types';
import { NEET_SYLLABUS, SUBJECT_COLORS } from '../neetData';
import { calculateDuration, generateId, formatDate } from '../utils';

interface StudyEntryProps {
  onAddEntry: (entry: Omit<StudyEntry, 'id' | 'accuracy' | 'durationMinutes'>) => void;
  entries: StudyEntry[];
  onDeleteEntry: (id: string) => void;
}

export default function StudyEntryForm({ onAddEntry, entries, onDeleteEntry }: StudyEntryProps) {
  // Form State
  const [date, setDate] = useState<string>(() => formatDate(new Date()));
  const [startTime, setStartTime] = useState<string>('14:00');
  const [endTime, setEndTime] = useState<string>('16:00');
  const [subject, setSubject] = useState<NEETSubject>('Biology');
  const [chapterQuery, setChapterQuery] = useState<string>('');
  const [showChapterDropdown, setShowChapterDropdown] = useState<boolean>(false);
  const [topic, setTopic] = useState<string>('');
  const [studyType, setStudyType] = useState<StudyType>('Self Study');
  const [mcqsSolved, setMcqsSolved] = useState<number>(0);
  const [mcqsCorrect, setMcqsCorrect] = useState<number>(0);
  const [mcqsWrong, setMcqsWrong] = useState<number>(0);
  const [confidenceLevel, setConfidenceLevel] = useState<ConfidenceLevel>('Medium');
  const [notes, setNotes] = useState<string>('');

  // Notification State
  const [notification, setNotification] = useState<string | null>(null);

  // Filter syllabus chapters based on chosen subject and search query
  const filteredSyllabusChapters = useMemo(() => {
    return NEET_SYLLABUS.filter(
      (c) =>
        c.subject === subject &&
        c.name.toLowerCase().includes(chapterQuery.toLowerCase())
    );
  }, [subject, chapterQuery]);

  // Handle MCQ correct change (auto-calculate wrong to keep total consistent)
  const handleCorrectChange = (correctVal: number) => {
    setMcqsCorrect(correctVal);
    if (mcqsSolved >= correctVal) {
      setMcqsWrong(mcqsSolved - correctVal);
    }
  };

  const handleSolvedChange = (solvedVal: number) => {
    setMcqsSolved(solvedVal);
    if (solvedVal >= mcqsCorrect) {
      setMcqsWrong(solvedVal - mcqsCorrect);
    } else {
      setMcqsCorrect(solvedVal);
      setMcqsWrong(0);
    }
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapterQuery.trim()) {
      alert('Please select or enter a chapter.');
      return;
    }

    onAddEntry({
      date,
      startTime,
      endTime,
      subject,
      chapter: chapterQuery.trim(),
      topic: topic.trim() || 'General Concept Review',
      studyType,
      mcqsSolved,
      mcqsCorrect,
      mcqsWrong,
      confidenceLevel,
      notes: notes.trim(),
    });

    // Reset Form
    setTopic('');
    setMcqsSolved(0);
    setMcqsCorrect(0);
    setMcqsWrong(0);
    setNotes('');
    setNotification(`Successfully logged study session for "${chapterQuery}"! Revisions updated.`);
    setTimeout(() => setNotification(null), 4000);
  };

  // Calculate duration on screen
  const displayedDuration = useMemo(() => {
    return calculateDuration(startTime, endTime);
  }, [startTime, endTime]);

  // Calculate live accuracy
  const displayedAccuracy = useMemo(() => {
    if (mcqsSolved === 0) return 0;
    return Math.round((mcqsCorrect / mcqsSolved) * 100);
  }, [mcqsSolved, mcqsCorrect]);

  return (
    <div id="study-entry-section" className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">Log Study Session</h1>
          <p className="text-sm text-slate-500 mt-1">Manually record your finished study block to update your spaced repetition agenda.</p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-medical-50 text-medical-700 px-3 py-1.5 rounded-full border border-medical-100 font-mono">
          <Clock className="w-3.5 h-3.5" />
          <span>No Timer Friction • Fast Manual Entries</span>
        </div>
      </div>

      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl p-4 text-sm flex items-center gap-3 shadow-sm shadow-emerald-50"
        >
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="font-medium">{notification}</p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Entry Form Card */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Subject and Study Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Subject</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Physics', 'Chemistry', 'Biology'] as NEETSubject[]).map((subj) => {
                    const isSelected = subject === subj;
                    let selectedStyles = '';
                    if (subj === 'Chemistry') {
                      selectedStyles = 'bg-red-100 text-red-800 border-red-300 shadow-sm shadow-red-100';
                    } else if (subj === 'Physics') {
                      selectedStyles = 'bg-blue-100 text-blue-800 border-blue-300 shadow-sm shadow-blue-100';
                    } else {
                      // Biology
                      selectedStyles = 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-sm shadow-emerald-100';
                    }
                    return (
                      <button
                        key={subj}
                        type="button"
                        onClick={() => {
                          setSubject(subj);
                          setChapterQuery('');
                        }}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all ${
                          isSelected
                            ? selectedStyles
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {subj}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Study Type</label>
                <select
                  value={studyType}
                  onChange={(e) => setStudyType(e.target.value as StudyType)}
                  className="w-full bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-medical-500 focus:bg-white transition-all"
                >
                  <option value="Self Study">Self Study</option>
                  <option value="Class">Class Session</option>
                  <option value="Revision">Spaced Revision</option>
                  <option value="PYQ">Solving Past Years (PYQ)</option>
                  <option value="MCQ Practice">MCQ Practice Drills</option>
                  <option value="Test Analysis">Test Mistake Analysis</option>
                </select>
              </div>
            </div>

            {/* Date, Start Time, End Time */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  onClick={(e) => { try { (e.target as any).showPicker(); } catch (err) {} }}
                  className="w-full bg-slate-50 text-slate-700 text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-medical-500 focus:bg-white transition-all h-9 cursor-pointer"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-slate-50 text-slate-700 text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-medical-500 focus:bg-white transition-all h-9"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-slate-50 text-slate-700 text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-medical-500 focus:bg-white transition-all h-9"
                  required
                />
              </div>
            </div>

            {/* Live Duration Indicator */}
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-2 font-medium">
                <Clock className="w-4 h-4 text-slate-400" /> Live Calculated Duration:
              </span>
              <span className="font-mono font-bold text-slate-800 bg-white px-2 py-1 rounded border border-slate-100">
                {displayedDuration > 0
                  ? `${Math.floor(displayedDuration / 60)}h ${displayedDuration % 60}m`
                  : '0m (Check End Time)'}
              </span>
            </div>

            {/* Chapter Autocomplete */}
            <div className="relative">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Chapter (Syllabus Match)</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type or select chapter from standard NEET syllabus..."
                  value={chapterQuery}
                  onChange={(e) => {
                    setChapterQuery(e.target.value);
                    setShowChapterDropdown(true);
                  }}
                  onFocus={() => setShowChapterDropdown(true)}
                  className="w-full bg-slate-50 text-slate-700 text-xs border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 outline-none focus:border-medical-500 focus:bg-white transition-all"
                  required
                />
                <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
              </div>

              {showChapterDropdown && filteredSyllabusChapters.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-52 overflow-y-auto divide-y divide-slate-100">
                  {filteredSyllabusChapters.map((chap) => (
                    <button
                      key={chap.name}
                      type="button"
                      onClick={() => {
                        setChapterQuery(chap.name);
                        setShowChapterDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-between"
                    >
                      <span className="font-medium">{chap.name}</span>
                      <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-mono">{chap.unit}</span>
                    </button>
                  ))}
                </div>
              )}
              {showChapterDropdown && chapterQuery.trim() !== '' && filteredSyllabusChapters.length === 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs text-slate-500 text-center">
                  Press enter to add as a custom chapter
                  <button
                    type="button"
                    onClick={() => setShowChapterDropdown(false)}
                    className="block text-[10px] text-medical-600 font-medium underline mt-1 mx-auto"
                  >
                    Confirm Custom Chapter
                  </button>
                </div>
              )}
            </div>

            {/* Topic Studied */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Specific Topic / Sub-Concept</label>
              <textarea
                placeholder="e.g. Diaphragmatic loop cycle, Zener diode equation, Limiting reagent calculation..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={2}
                className="w-full bg-slate-50 text-slate-700 text-xs border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-medical-500 focus:bg-white transition-all resize-y min-h-[56px]"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Feel free to type multiple topics or details here.</span>
            </div>

            {/* MCQ Panel (Self study / Revision/ MCQ Practice drills) */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-medical-600" /> MCQ Drills & Accuracy Tracker
                </span>
                <span className="text-[10px] font-mono text-slate-400">Calculates accuracy score</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Solved</label>
                  <input
                    type="number"
                    min="0"
                    value={mcqsSolved}
                    onChange={(e) => handleSolvedChange(Number(e.target.value))}
                    className="w-full bg-white text-slate-800 text-xs font-mono font-bold border border-slate-200 rounded-lg px-2 py-1.5 outline-none text-center"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-emerald-600 uppercase tracking-wide mb-1">Correct</label>
                  <input
                    type="number"
                    min="0"
                    max={mcqsSolved}
                    value={mcqsCorrect}
                    onChange={(e) => handleCorrectChange(Number(e.target.value))}
                    className="w-full bg-white text-emerald-700 text-xs font-mono font-bold border border-emerald-200 rounded-lg px-2 py-1.5 outline-none text-center focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-rose-500 uppercase tracking-wide mb-1">Wrong</label>
                  <input
                    type="number"
                    min="0"
                    max={mcqsSolved}
                    value={mcqsWrong}
                    onChange={(e) => {
                      const wrongVal = Number(e.target.value);
                      setMcqsWrong(wrongVal);
                      if (mcqsSolved >= wrongVal) {
                        setMcqsCorrect(mcqsSolved - wrongVal);
                      }
                    }}
                    className="w-full bg-white text-rose-700 text-xs font-mono font-bold border border-rose-200 rounded-lg px-2 py-1.5 outline-none text-center focus:border-rose-500"
                  />
                </div>
              </div>

              {mcqsSolved > 0 && (
                <div className="flex items-center justify-between text-xs font-semibold px-1 pt-1">
                  <span className="text-slate-500">Practice Score:</span>
                  <span className={`px-2 py-0.5 rounded-full font-mono text-[11px] ${
                    displayedAccuracy >= 95
                      ? 'bg-emerald-100 text-emerald-800'
                      : displayedAccuracy >= 80
                      ? 'bg-teal-100 text-teal-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {displayedAccuracy}% Accuracy {displayedAccuracy >= 95 ? '⭐ (Delay Scheduled)' : displayedAccuracy < 80 ? '⚠️ (Accelerated)' : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Confidence Level & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-4">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Confidence Level</label>
                <div className="grid grid-cols-1 gap-1.5">
                  {(['High', 'Medium', 'Low'] as ConfidenceLevel[]).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setConfidenceLevel(level)}
                      className={`py-1.5 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                        confidenceLevel === level
                          ? level === 'High'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-400 shadow-sm'
                            : level === 'Medium'
                            ? 'bg-blue-50 text-blue-700 border-blue-400 shadow-sm'
                            : 'bg-rose-50 text-rose-700 border-rose-400 shadow-sm'
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {level} Confidence
                    </button>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-8">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Notes & Critical Formula Mistakes</label>
                <textarea
                  placeholder="Key concepts grasped, NCERT lines to look up again, or formula errors made..."
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 text-slate-700 text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-medical-500 focus:bg-white transition-all resize-none"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-medical-700 text-white font-medium hover:bg-medical-800 focus:ring-4 focus:ring-medical-200 rounded-xl text-sm px-5 py-3 text-center transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-medical-900/10"
            >
              <PlusCircle className="w-4 h-4" /> Save Study Session & Update Syllabus Status
            </button>
          </form>
        </div>

        {/* Recent Session Logs */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col h-[520px]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Award className="w-4 h-4 text-medical-600" /> Recent Study Session Logs
              </h2>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {entries.length} Sessions Logged
              </span>
            </div>

            {entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 text-center py-10 px-4">
                <BookOpen className="w-10 h-10 text-slate-300 mb-2.5" />
                <p className="text-xs font-bold text-slate-700">No entries logged yet</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-[240px]">Record your completed classes, mock tests, or question sets using the manual entry form.</p>
              </div>
            ) : (
              <div className="overflow-y-auto flex-1 pr-1 space-y-3">
                {[...entries]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((entry) => {
                    const clr = SUBJECT_COLORS[entry.subject] || SUBJECT_COLORS.Biology;
                    return (
                      <div
                        key={entry.id}
                        className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 flex flex-col gap-2 group transition-all hover:bg-white hover:border-slate-300 hover:shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${clr.bg} ${clr.text}`}>
                                {entry.subject}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400 font-medium">{entry.date}</span>
                            </div>
                            <h3 className="text-xs font-bold text-slate-800 leading-tight mt-1">{entry.chapter}</h3>
                            {entry.topic && (
                              <p className="text-[10px] text-slate-500 font-medium italic">Topic: {entry.topic}</p>
                            )}
                          </div>
                          <button
                            onClick={() => onDeleteEntry(entry.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                            title="Delete entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2 border-t border-slate-200/40 pt-2 text-[10px] text-slate-500">
                          <div>
                            <span className="block text-[8px] text-slate-400 uppercase tracking-wide">Duration</span>
                            <span className="font-semibold text-slate-700 font-mono">
                              {entry.durationMinutes >= 60
                                ? `${Math.floor(entry.durationMinutes / 60)}h ${entry.durationMinutes % 60}m`
                                : `${entry.durationMinutes}m`}
                            </span>
                          </div>

                          <div>
                            <span className="block text-[8px] text-slate-400 uppercase tracking-wide">Type</span>
                            <span className="font-semibold text-slate-700">{entry.studyType}</span>
                          </div>

                          <div>
                            <span className="block text-[8px] text-slate-400 uppercase tracking-wide">Confidence</span>
                            <span className={`font-semibold ${
                              entry.confidenceLevel === 'High'
                                ? 'text-emerald-600'
                                : entry.confidenceLevel === 'Medium'
                                ? 'text-blue-600'
                                : 'text-rose-500'
                            }`}>
                              {entry.confidenceLevel}
                            </span>
                          </div>
                        </div>

                        {entry.mcqsSolved > 0 && (
                          <div className="bg-white px-2 py-1.5 rounded-lg border border-slate-100 flex items-center justify-between text-[10px]">
                            <span className="text-slate-400 font-medium">MCQs: <strong className="text-slate-700">{entry.mcqsCorrect}/{entry.mcqsSolved}</strong></span>
                            <span className={`font-mono font-bold ${
                              entry.accuracy >= 90 ? 'text-emerald-600' : entry.accuracy >= 75 ? 'text-teal-600' : 'text-amber-600'
                            }`}>{entry.accuracy}% Accuracy</span>
                          </div>
                        )}

                        {entry.notes && (
                          <div className="text-[10px] text-slate-400 line-clamp-2 bg-white/60 p-1.5 rounded border border-dashed border-slate-200/50">
                            {entry.notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
