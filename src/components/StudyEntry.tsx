/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  CheckCircle, 
  Clock, 
  PlusCircle, 
  Search, 
  Target, 
  Award, 
  Trash2, 
  Pencil, 
  X, 
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Atom,
  FlaskConical,
  Dna,
  Zap,
  Droplet,
  Leaf,
  Timer,
  Play,
  Sparkles,
  Maximize2
} from 'lucide-react';
import { StudyEntry, NEETSubject, StudyType, ConfidenceLevel } from '../types';
import { NEET_SYLLABUS, SUBJECT_COLORS } from '../neetData';
import { calculateDuration, formatDate, triggerToast, getLogicalTodayDate } from '../utils';
import LiveStudyTimer from './LiveStudyTimer';

interface StudyEntryProps {
  onAddEntry: (entry: Omit<StudyEntry, 'id' | 'accuracy' | 'durationMinutes'>) => void;
  entries: StudyEntry[];
  onDeleteEntry: (id: string) => void;
  onEditEntry: (id: string, entry: StudyEntry) => void;
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

export default function StudyEntryForm({ onAddEntry, entries, onDeleteEntry, onEditEntry }: StudyEntryProps) {
  // --- ADD FORM STATE ---
  const [burstParticles, setBurstParticles] = useState<{
    id: number;
    icon: string;
    startX: number;
    startY: number;
    x: number;
    y: number;
    rotate: number;
    scale: number;
    colorClass: string;
  }[]>([]);

  const renderSubjectIcon = (iconName: string) => {
    switch (iconName) {
      case 'Atom': return <Atom className="w-5 h-5" />;
      case 'Zap': return <Zap className="w-4 h-4" />;
      case 'FlaskConical': return <FlaskConical className="w-5 h-5" />;
      case 'Droplet': return <Droplet className="w-4 h-4" />;
      case 'Dna': return <Dna className="w-5 h-5" />;
      case 'Leaf': return <Leaf className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const triggerSubjectBurst = (subj: NEETSubject, target: HTMLButtonElement) => {
    const startX = target.offsetLeft + target.offsetWidth / 2;
    const startY = target.offsetTop + target.offsetHeight / 2;

    const iconsMap = {
      Physics: ['Atom', 'Zap', 'Atom', 'Zap'],
      Chemistry: ['FlaskConical', 'Droplet', 'FlaskConical', 'Droplet'],
      Biology: ['Dna', 'Leaf', 'Dna', 'Leaf']
    };

    const colorsMap = {
      Physics: 'text-[#2E5FE0] dark:text-[#2E5FE0]/90',
      Chemistry: 'text-[#F2704F] dark:text-[#F2704F]/90',
      Biology: 'text-[#E0538C] dark:text-[#E0538C]/90'
    };

    const pool = iconsMap[subj];
    const colorClass = colorsMap[subj];

    const newParticles = Array.from({ length: 12 }).map((_, i) => {
      const angle = (i * (360 / 12)) + (Math.random() * 15 - 7.5);
      const rad = (angle * Math.PI) / 180;
      const velocity = 50 + Math.random() * 60;
      const destX = Math.cos(rad) * velocity;
      const destY = Math.sin(rad) * velocity;

      return {
        id: Math.random() + Date.now() + i,
        icon: pool[Math.floor(Math.random() * pool.length)],
        startX,
        startY,
        x: destX,
        y: destY,
        rotate: Math.random() * 360 - 180,
        scale: 0.6 + Math.random() * 0.8,
        colorClass
      };
    });

    setBurstParticles(prev => [...prev, ...newParticles]);

    // Cleanup
    setTimeout(() => {
      setBurstParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 900);
  };

  const [date, setDate] = useState<string>(() => getLogicalTodayDate());
  const [entryMode, setEntryMode] = useState<'manual' | 'timer'>('manual');
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

  // --- MODERN EDIT MODAL STATE ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState<string>('');
  const [editStartTime, setEditStartTime] = useState<string>('');
  const [editEndTime, setEditEndTime] = useState<string>('');
  const [editSubject, setEditSubject] = useState<NEETSubject>('Biology');
  const [editChapterQuery, setEditChapterQuery] = useState<string>('');
  const [showEditChapterDropdown, setShowEditChapterDropdown] = useState<boolean>(false);
  const [editTopic, setEditTopic] = useState<string>('');
  const [editStudyType, setEditStudyType] = useState<StudyType>('Self Study');
  const [editMcqsSolved, setEditMcqsSolved] = useState<number>(0);
  const [editMcqsCorrect, setEditMcqsCorrect] = useState<number>(0);
  const [editMcqsWrong, setEditMcqsWrong] = useState<number>(0);
  const [editConfidenceLevel, setEditConfidenceLevel] = useState<ConfidenceLevel>('Medium');
  const [editNotes, setEditNotes] = useState<string>('');

  // --- DELETE CONFIRMATION MODAL STATE ---
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteChapter, setDeleteChapter] = useState<string>('');

  // --- NOTIFICATION / SUCCESS BANNERS ---
  const [notification, setNotification] = useState<string | null>(null);

  // --- EXPAND/COLLAPSE GROUPED ENTRIES BY DATE ---
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  const groupedEntries = useMemo(() => {
    const groups: Record<string, StudyEntry[]> = {};
    
    // Sort entries descending by date & ascending by time
    const sorted = [...entries].sort((a, b) => {
      const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      return a.startTime.localeCompare(b.startTime);
    });
    
    sorted.forEach(entry => {
      if (!groups[entry.date]) {
        groups[entry.date] = [];
      }
      groups[entry.date].push(entry);
    });
    return groups;
  }, [entries]);

  const sortedDates = useMemo(() => {
    return Object.keys(groupedEntries).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [groupedEntries]);

  const isDateExpanded = (dateStr: string) => {
    if (expandedDates[dateStr] !== undefined) {
      return expandedDates[dateStr];
    }
    // Default to true for the most recent date, false for older dates
    return dateStr === sortedDates[0];
  };

  const toggleDateExpanded = (dateStr: string) => {
    setExpandedDates(prev => ({
      ...prev,
      [dateStr]: !isDateExpanded(dateStr)
    }));
  };

  // --- SYLLABUS FILTERS FOR ADD FORM ---
  const filteredSyllabusChapters = useMemo(() => {
    return NEET_SYLLABUS.filter(
      (c) =>
        c.subject === subject &&
        c.name.toLowerCase().includes(chapterQuery.toLowerCase())
    );
  }, [subject, chapterQuery]);

  // --- SYLLABUS FILTERS FOR EDIT FORM ---
  const filteredEditSyllabusChapters = useMemo(() => {
    return NEET_SYLLABUS.filter(
      (c) =>
        c.subject === editSubject &&
        c.name.toLowerCase().includes(editChapterQuery.toLowerCase())
    );
  }, [editSubject, editChapterQuery]);

  // --- MCQ SOLVED COUNTER MUTATIONS FOR ADD FORM ---
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

  // --- MCQ SOLVED COUNTER MUTATIONS FOR EDIT FORM ---
  const handleEditCorrectChange = (correctVal: number) => {
    setEditMcqsCorrect(correctVal);
    if (editMcqsSolved >= correctVal) {
      setEditMcqsWrong(editMcqsSolved - correctVal);
    }
  };

  const handleEditSolvedChange = (solvedVal: number) => {
    setEditMcqsSolved(solvedVal);
    if (solvedVal >= editMcqsCorrect) {
      setEditMcqsWrong(solvedVal - editMcqsCorrect);
    } else {
      setEditMcqsCorrect(solvedVal);
      setEditMcqsWrong(0);
    }
  };

  const handleEditWrongChange = (wrongVal: number) => {
    setEditMcqsWrong(wrongVal);
    if (editMcqsSolved >= wrongVal) {
      setEditMcqsCorrect(editMcqsSolved - wrongVal);
    } else {
      setEditMcqsSolved(wrongVal);
      setEditMcqsCorrect(0);
    }
  };

  // --- TRIGGER MODAL FLOWS ---
  const handleOpenEditModal = (entry: StudyEntry) => {
    setEditId(entry.id);
    setEditDate(entry.date);
    setEditStartTime(entry.startTime);
    setEditEndTime(entry.endTime);
    setEditSubject(entry.subject);
    setEditChapterQuery(entry.chapter);
    setEditTopic(entry.topic || '');
    setEditStudyType(entry.studyType);
    setEditMcqsSolved(entry.mcqsSolved);
    setEditMcqsCorrect(entry.mcqsCorrect);
    setEditMcqsWrong(entry.mcqsWrong);
    setEditConfidenceLevel(entry.confidenceLevel);
    setEditNotes(entry.notes || '');
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditId(null);
  };

  const handleOpenDeleteModal = (id: string, chapter: string) => {
    setDeleteId(id);
    setDeleteChapter(chapter);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeleteId(null);
  };

  // --- SUBMIT ADD ENTRY ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapterQuery.trim()) {
      triggerToast('Please select or enter a chapter.', 'error');
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

    setNotification(`Successfully logged study session for "${chapterQuery}"! Revisions updated.`);
    
    // Reset Add Form
    setTopic('');
    setMcqsSolved(0);
    setMcqsCorrect(0);
    setMcqsWrong(0);
    setNotes('');
    setTimeout(() => setNotification(null), 4000);
    triggerToast('Study session logged successfully!', 'success');
  };

  // --- SAVE EDIT CHANGES ---
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    if (!editChapterQuery.trim()) {
      triggerToast('Please select or enter a chapter.', 'error');
      return;
    }

    onEditEntry(editId, {
      id: editId,
      date: editDate,
      startTime: editStartTime,
      endTime: editEndTime,
      subject: editSubject,
      chapter: editChapterQuery.trim(),
      topic: editTopic.trim() || 'General Concept Review',
      studyType: editStudyType,
      mcqsSolved: editMcqsSolved,
      mcqsCorrect: editMcqsCorrect,
      mcqsWrong: editMcqsWrong,
      confidenceLevel: editConfidenceLevel,
      notes: editNotes.trim(),
      durationMinutes: 0, // App.tsx will auto-recalculate from times
      accuracy: 0, // App.tsx will auto-recalculate from MCQs
    });

    triggerToast('Study session updated successfully.', 'success');
    setIsEditModalOpen(false);
  };

  // --- CONFIRM DELETION ---
  const handleConfirmDelete = () => {
    if (!deleteId) return;
    onDeleteEntry(deleteId);
    triggerToast('Study session deleted successfully.', 'success');
    setIsDeleteModalOpen(false);
    setDeleteId(null);
  };

  // --- LIVE ADD DURATION & ACCURACY ---
  const displayedDuration = useMemo(() => {
    return calculateDuration(startTime, endTime);
  }, [startTime, endTime]);

  const displayedAccuracy = useMemo(() => {
    if (mcqsSolved === 0) return 0;
    return Math.round((mcqsCorrect / mcqsSolved) * 100);
  }, [mcqsSolved, mcqsCorrect]);

  // --- LIVE EDIT DURATION & ACCURACY ---
  const editDisplayedDuration = useMemo(() => {
    return calculateDuration(editStartTime, editEndTime);
  }, [editStartTime, editEndTime]);

  const editDisplayedAccuracy = useMemo(() => {
    if (editMcqsSolved === 0) return 0;
    return Math.round((editMcqsCorrect / editMcqsSolved) * 100);
  }, [editMcqsSolved, editMcqsCorrect]);

  return (
    <div id="study-entry-section" className="space-y-6 animate-fade-in">
      {/* Header with Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Log Study Session</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {entryMode === 'manual'
              ? 'Manually record your completed study block into your NEET preparation log.'
              : 'Study with an immersive full-screen digital timer with clock visual and subject themes.'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
          <button
            type="button"
            onClick={() => setEntryMode('manual')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              entryMode === 'manual'
                ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4 text-medical-600 dark:text-medical-400" />
            <span>Manual Entry</span>
          </button>

          <button
            type="button"
            onClick={() => setEntryMode('timer')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              entryMode === 'timer'
                ? 'bg-gradient-to-r from-medical-600 to-indigo-600 text-white shadow-md shadow-medical-900/20'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Timer className="w-4 h-4" />
            <span>Live Digital Timer</span>
            <span className="bg-amber-400/20 text-amber-500 text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full font-extrabold ml-0.5">
              Live
            </span>
          </button>
        </div>
      </div>

      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 text-amber-800 border border-amber-200 rounded-xl p-4 text-sm flex items-center gap-3 shadow-sm shadow-amber-50"
        >
          <CheckCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="font-medium">{notification}</p>
        </motion.div>
      )}

      {/* Conditionally Render Live Study Timer vs Manual Entry */}
      {entryMode === 'timer' ? (
        <div className="space-y-6">
          <LiveStudyTimer
            onAddEntry={onAddEntry}
            defaultSubject={subject}
            defaultStudyType={studyType}
          />

          {/* Quick Subject Launch Cards below timer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['Biology', 'Chemistry', 'Physics'] as NEETSubject[]).map(subj => {
              const count = entries.filter(e => e.subject === subj).length;
              return (
                <div
                  key={subj}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    subj === 'Biology'
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 hover:border-emerald-400'
                      : subj === 'Chemistry'
                      ? 'bg-cyan-50/50 dark:bg-cyan-950/20 border-cyan-200 dark:border-cyan-900/40 hover:border-cyan-400'
                      : 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/40 hover:border-indigo-400'
                  }`}
                  onClick={() => {
                    setSubject(subj);
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      {subj === 'Biology' && <Dna className="w-4 h-4 text-emerald-500" />}
                      {subj === 'Chemistry' && <FlaskConical className="w-4 h-4 text-cyan-500" />}
                      {subj === 'Physics' && <Zap className="w-4 h-4 text-indigo-500" />}
                      {subj}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {count} logged
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    {subj === 'Biology' && 'NCERT line-by-line reading & botanical diagrams'}
                    {subj === 'Chemistry' && 'Organic reaction mechanisms & physical formulas'}
                    {subj === 'Physics' && 'Numerical derivations & conceptual drills'}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Recent Study Logs Section even in Timer Mode */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-medical-600 dark:text-medical-400" /> Recent Study Session Logs
              </h2>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                {entries.length} Sessions Total
              </span>
            </div>

            {entries.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No entries logged yet. Start the digital timer above to begin your first session!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {entries.slice(0, 6).map(entry => (
                  <div
                    key={entry.id}
                    className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          entry.subject === 'Biology'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : entry.subject === 'Chemistry'
                            ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300'
                            : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                        }`}>
                          {entry.subject}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {entry.date}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate mt-1">
                        {entry.chapter}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {entry.topic || 'General study'}
                      </p>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] font-mono text-slate-600 dark:text-slate-300">
                      <span>{Math.floor(entry.durationMinutes / 60)}h {entry.durationMinutes % 60}m</span>
                      <span className="text-slate-400">{entry.studyType}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Entry Form Card */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Subject and Study Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Subject</label>
                <div className="grid grid-cols-3 gap-2 relative overflow-visible">
                  {(['Physics', 'Chemistry', 'Biology'] as NEETSubject[]).map((subj) => {
                    const isSelected = subject === subj;
                    let btnStyle = '';
                    if (subj === 'Chemistry') {
                      btnStyle = isSelected
                        ? 'bg-red-50 text-red-600 border-red-300 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900 shadow-sm shadow-red-100 font-bold'
                        : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 hover:bg-red-50/50 hover:text-red-600 hover:border-red-200';
                    } else if (subj === 'Biology') {
                      btnStyle = isSelected
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900 shadow-sm shadow-emerald-100 font-bold'
                        : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 hover:bg-emerald-50/50 hover:text-emerald-600 hover:border-emerald-200';
                    } else { // Physics
                      btnStyle = isSelected
                        ? 'bg-blue-50 text-blue-600 border-blue-300 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900 shadow-sm shadow-blue-100 font-bold'
                        : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 hover:bg-blue-50/50 hover:text-blue-600 hover:border-blue-200';
                    }
                    return (
                      <button
                        key={subj}
                        type="button"
                        onClick={(e) => {
                          setSubject(subj);
                          setChapterQuery('');
                          triggerSubjectBurst(subj, e.currentTarget);
                        }}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${btnStyle}`}
                      >
                        {subj}
                      </button>
                    );
                  })}

                  {/* Render burst particles */}
                  <AnimatePresence>
                    {burstParticles.map((particle) => (
                      <motion.div
                        key={particle.id}
                        initial={{ opacity: 1, scale: 0.2, x: particle.startX - 10, y: particle.startY - 10, rotate: 0 }}
                        animate={{ 
                          opacity: 0, 
                          scale: particle.scale, 
                          x: particle.startX + particle.x - 10, 
                          y: particle.startY + particle.y - 10, 
                          rotate: particle.rotate 
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={`absolute pointer-events-none z-50 ${particle.colorClass} drop-shadow-md`}
                      >
                        {renderSubjectIcon(particle.icon)}
                      </motion.div>
                    ))}
                  </AnimatePresence>
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
            <div className="bg-medical-50/50 border border-dashed border-medical-200 rounded-xl p-3 flex items-center justify-between text-xs text-slate-700 animate-pulse">
              <span className="flex items-center gap-2 font-medium text-medical-600">
                <Clock className="w-4 h-4 text-medical-500" /> Live Calculated Duration:
              </span>
              <span className="font-mono font-extrabold text-medical-700 bg-medical-50 px-2 py-1 rounded border border-medical-200">
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
                    className="block text-[10px] text-medical-600 font-medium underline mt-1 mx-auto animate-pulse"
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
            <div id="mcq-drills-panel" className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-red-500" /> MCQ Drills & Accuracy Tracker
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
                    className="w-full bg-white text-slate-800 text-xs font-mono font-bold border border-slate-200 rounded-lg px-2 py-1.5 outline-none text-center focus:border-medical-500"
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
                    className="w-full bg-white text-emerald-600 text-xs font-mono font-bold border border-emerald-200 rounded-lg px-2 py-1.5 outline-none text-center focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-rose-600 uppercase tracking-wide mb-1">Wrong</label>
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
                    className="w-full bg-white text-rose-600 text-xs font-mono font-bold border border-rose-200 rounded-lg px-2 py-1.5 outline-none text-center focus:border-rose-500"
                  />
                </div>
              </div>

              {mcqsSolved > 0 && (
                <div className="flex items-center justify-between text-xs font-semibold px-1 pt-1">
                  <span className="text-slate-500">Practice Score:</span>
                  <span className={`px-2 py-0.5 rounded-full font-mono text-[11px] ${
                    displayedAccuracy >= 90
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : displayedAccuracy >= 75
                      ? 'bg-teal-50 text-teal-700 border border-teal-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
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
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : level === 'Medium'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
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
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="w-full text-white font-semibold focus:ring-4 rounded-xl text-sm px-5 py-3 text-center transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md bg-medical-700 hover:bg-medical-800 focus:ring-medical-200 shadow-medical-900/10"
              >
                <PlusCircle className="w-4 h-4" /> Save Study Session & Update Syllabus Status
              </button>
            </div>
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
              <div className="overflow-y-auto flex-1 pr-1 space-y-4">
                {sortedDates.map((dateStr) => {
                  const dayEntries = groupedEntries[dateStr];
                  const isExpanded = isDateExpanded(dateStr);
                  
                  // Compute day stats
                  const totalMins = dayEntries.reduce((sum, e) => sum + e.durationMinutes, 0);
                  const totalHoursFormatted = totalMins >= 60 
                    ? `${Math.floor(totalMins / 60)}h ${totalMins % 60}m` 
                    : `${totalMins}m`;
                  const totalSolved = dayEntries.reduce((sum, e) => sum + e.mcqsSolved, 0);

                  // Friendly date title
                  let friendlyDate = dateStr;
                  const todayStr = getLogicalTodayDate();
                  if (dateStr === todayStr) {
                    friendlyDate = `${dateStr} (Today)`;
                  } else {
                    // Try to see if it's yesterday
                    try {
                      const todayObj = new Date(todayStr);
                      todayObj.setDate(todayObj.getDate() - 1);
                      const yesterdayStr = todayObj.toISOString().split('T')[0];
                      if (dateStr === yesterdayStr) {
                        friendlyDate = `${dateStr} (Yesterday)`;
                      }
                    } catch (e) {}
                  }

                  return (
                    <div key={dateStr} className="border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-xs">
                      {/* Date Header button */}
                      <button
                        type="button"
                        onClick={() => toggleDateExpanded(dateStr)}
                        className="w-full text-left px-3.5 py-3 bg-slate-50 hover:bg-slate-100/80 active:bg-slate-100 transition-all flex items-center justify-between border-b border-slate-100"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 hover:text-slate-800 transition-colors">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </span>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-800 tracking-tight">{friendlyDate}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[9px] font-semibold font-mono text-slate-400 bg-slate-200/50 px-1.5 py-0.2 rounded">
                                {dayEntries.length} {dayEntries.length === 1 ? 'Session' : 'Sessions'}
                              </span>
                              {totalSolved > 0 && (
                               <span className="text-[9px] font-semibold font-mono text-medical-600 bg-medical-50 border border-medical-100 px-1.5 py-0.2 rounded">
                                  {totalSolved} MCQs
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex flex-col items-end shrink-0">
                          <span className="text-xs font-bold text-medical-800 font-mono">{totalHoursFormatted}</span>
                          <span className="text-[8px] font-medium uppercase tracking-wider text-slate-400 mt-0.5">Studied</span>
                        </div>
                      </button>

                      {/* Date Entries collapsible area */}
                      {isExpanded && (
                        <div className="p-3 bg-slate-50/40 divide-y divide-slate-100 space-y-3">
                          {dayEntries.map((entry) => {
                            const clr = SUBJECT_COLORS[entry.subject] || SUBJECT_COLORS.Biology;
                            return (
                              <div
                                key={entry.id}
                                className="pt-3 first:pt-0 flex flex-col gap-2"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${clr.bg} ${clr.text}`}>
                                        {entry.subject}
                                      </span>
                                      <span className="text-[9px] font-mono text-slate-400 font-semibold">{formatTo12Hour(entry.startTime)} - {formatTo12Hour(entry.endTime)}</span>
                                    </div>
                                    <h3 className="text-xs font-bold text-slate-800 leading-tight mt-1">{entry.chapter}</h3>
                                    {entry.topic && (
                                      <p className="text-[10px] text-slate-500 font-medium italic">Topic: {entry.topic}</p>
                                    )}
                                  </div>
                                  
                                  {/* Modern Action Buttons: Edit and Delete */}
                                  <div className="flex gap-1 shrink-0">
                                    <button
                                      onClick={() => handleOpenEditModal(entry)}
                                      className="text-slate-400 hover:text-blue-600 p-1 rounded-lg hover:bg-blue-50 transition-all cursor-pointer border border-transparent hover:border-blue-100"
                                      title="Edit entry"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleOpenDeleteModal(entry.id, entry.chapter)}
                                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-all cursor-pointer border border-transparent hover:border-rose-100"
                                      title="Delete entry"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
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
                                    <span className="font-semibold text-slate-700 truncate block max-w-full">{entry.studyType}</span>
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
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* --- FLOATING EDIT ENTRY MODAL --- */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-blue-600" />
                  <div>
                    <h2 className="text-base font-bold text-slate-800">Edit Study Session</h2>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">Modify study session stats and auto-update spaced repetitions.</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseEditModal}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body / Form */}
              <form onSubmit={handleSaveEdit} className="p-6 space-y-5">
                {/* Subject and Study Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Subject</label>
                    <div className="grid grid-cols-3 gap-2 relative overflow-visible">
                      {(['Physics', 'Chemistry', 'Biology'] as NEETSubject[]).map((subj) => {
                        const isSelected = editSubject === subj;
                        let btnStyle = '';
                        if (subj === 'Chemistry') {
                          btnStyle = isSelected
                            ? 'bg-red-50 text-red-600 border-red-300 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900 shadow-sm shadow-red-100 font-bold'
                            : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 hover:bg-red-50/50 hover:text-red-600 hover:border-red-200';
                        } else if (subj === 'Biology') {
                          btnStyle = isSelected
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900 shadow-sm shadow-emerald-100 font-bold'
                            : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 hover:bg-emerald-50/50 hover:text-emerald-600 hover:border-emerald-200';
                        } else { // Physics
                          btnStyle = isSelected
                            ? 'bg-blue-50 text-blue-600 border-blue-300 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900 shadow-sm shadow-blue-100 font-bold'
                            : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 hover:bg-blue-50/50 hover:text-blue-600 hover:border-blue-200';
                        }
                        return (
                          <button
                            key={`edit-${subj}`}
                            type="button"
                            onClick={(e) => {
                              setEditSubject(subj);
                              setEditChapterQuery('');
                              triggerSubjectBurst(subj, e.currentTarget);
                            }}
                            className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${btnStyle}`}
                          >
                            {subj}
                          </button>
                        );
                      })}

                      {/* Render burst particles for edit form */}
                      <AnimatePresence>
                        {burstParticles.map((particle) => (
                          <motion.div
                            key={`edit-particle-${particle.id}`}
                            initial={{ opacity: 1, scale: 0.2, x: particle.startX - 10, y: particle.startY - 10, rotate: 0 }}
                            animate={{ 
                              opacity: 0, 
                              scale: particle.scale, 
                              x: particle.startX + particle.x - 10, 
                              y: particle.startY + particle.y - 10, 
                              rotate: particle.rotate 
                            }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className={`absolute pointer-events-none z-50 ${particle.colorClass} drop-shadow-md`}
                          >
                            {renderSubjectIcon(particle.icon)}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Study Type</label>
                    <select
                      value={editStudyType}
                      onChange={(e) => setEditStudyType(e.target.value as StudyType)}
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
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      onClick={(e) => { try { (e.target as any).showPicker(); } catch (err) {} }}
                      className="w-full bg-slate-50 text-slate-700 text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-medical-500 focus:bg-white transition-all h-9 cursor-pointer"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Start Time</label>
                    <input
                      type="time"
                      value={editStartTime}
                      onChange={(e) => setEditStartTime(e.target.value)}
                      className="w-full bg-slate-50 text-slate-700 text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-medical-500 focus:bg-white transition-all h-9"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">End Time</label>
                    <input
                      type="time"
                      value={editEndTime}
                      onChange={(e) => setEditEndTime(e.target.value)}
                      className="w-full bg-slate-50 text-slate-700 text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-medical-500 focus:bg-white transition-all h-9"
                      required
                    />
                  </div>
                </div>

                {/* Duration Indicator */}
                <div className="bg-medical-50/50 border border-dashed border-medical-200 rounded-xl p-3 flex items-center justify-between text-xs text-slate-700 animate-pulse">
                  <span className="flex items-center gap-2 font-medium text-medical-600">
                    <Clock className="w-4 h-4 text-medical-500" /> Live Recalculated Duration:
                  </span>
                  <span className="font-mono font-extrabold text-medical-700 bg-medical-50 px-2 py-1 rounded border border-medical-200">
                    {editDisplayedDuration > 0
                      ? `${Math.floor(editDisplayedDuration / 60)}h ${editDisplayedDuration % 60}m`
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
                      value={editChapterQuery}
                      onChange={(e) => {
                        setEditChapterQuery(e.target.value);
                        setShowEditChapterDropdown(true);
                      }}
                      onFocus={() => setShowEditChapterDropdown(true)}
                      className="w-full bg-slate-50 text-slate-700 text-xs border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 outline-none focus:border-medical-500 focus:bg-white transition-all"
                      required
                    />
                    <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                  </div>

                  {showEditChapterDropdown && filteredEditSyllabusChapters.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-52 overflow-y-auto divide-y divide-slate-100">
                      {filteredEditSyllabusChapters.map((chap) => (
                        <button
                          key={`edit-chap-${chap.name}`}
                          type="button"
                          onClick={() => {
                            setEditChapterQuery(chap.name);
                            setShowEditChapterDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-between"
                        >
                          <span className="font-medium">{chap.name}</span>
                          <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-mono">{chap.unit}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {showEditChapterDropdown && editChapterQuery.trim() !== '' && filteredEditSyllabusChapters.length === 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs text-slate-500 text-center">
                      Press enter to save as a custom chapter
                      <button
                        type="button"
                        onClick={() => setShowEditChapterDropdown(false)}
                        className="block text-[10px] text-medical-600 font-medium underline mt-1 mx-auto animate-pulse"
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
                    value={editTopic}
                    onChange={(e) => setEditTopic(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 text-slate-700 text-xs border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-medical-500 focus:bg-white transition-all resize-y min-h-[56px]"
                  />
                </div>

                {/* MCQ Panel */}
                <div id="edit-mcq-drills-panel" className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-red-500" /> MCQ Drills & Accuracy Tracker
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Recalculates accuracy score</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Solved</label>
                      <input
                        type="number"
                        min="0"
                        value={editMcqsSolved}
                        onChange={(e) => handleEditSolvedChange(Number(e.target.value))}
                        className="w-full bg-white text-slate-800 text-xs font-mono font-bold border border-slate-200 rounded-lg px-2 py-1.5 outline-none text-center focus:border-medical-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-emerald-600 uppercase tracking-wide mb-1">Correct</label>
                      <input
                        type="number"
                        min="0"
                        max={editMcqsSolved}
                        value={editMcqsCorrect}
                        onChange={(e) => handleEditCorrectChange(Number(e.target.value))}
                        className="w-full bg-white text-emerald-600 text-xs font-mono font-bold border border-emerald-200 rounded-lg px-2 py-1.5 outline-none text-center focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-rose-600 uppercase tracking-wide mb-1">Wrong</label>
                      <input
                        type="number"
                        min="0"
                        max={editMcqsSolved}
                        value={editMcqsWrong}
                        onChange={(e) => handleEditWrongChange(Number(e.target.value))}
                        className="w-full bg-white text-rose-600 text-xs font-mono font-bold border border-rose-200 rounded-lg px-2 py-1.5 outline-none text-center focus:border-rose-500"
                      />
                    </div>
                  </div>

                  {editMcqsSolved > 0 && (
                    <div className="flex items-center justify-between text-xs font-semibold px-1 pt-1">
                      <span className="text-slate-500">Practice Score:</span>
                      <span className={`px-2 py-0.5 rounded-full font-mono text-[11px] ${
                        editDisplayedAccuracy >= 90
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : editDisplayedAccuracy >= 75
                          ? 'bg-teal-50 text-teal-700 border border-teal-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {editDisplayedAccuracy}% Accuracy {editDisplayedAccuracy >= 95 ? '⭐ (Delay Scheduled)' : editDisplayedAccuracy < 80 ? '⚠️ (Accelerated)' : ''}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confidence & Notes */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-4">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Confidence Level</label>
                    <div className="grid grid-cols-1 gap-1.5">
                      {(['High', 'Medium', 'Low'] as ConfidenceLevel[]).map((level) => (
                        <button
                          key={`edit-conf-${level}`}
                          type="button"
                          onClick={() => setEditConfidenceLevel(level)}
                          className={`py-1.5 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                            editConfidenceLevel === level
                              ? level === 'High'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : level === 'Medium'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
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
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      className="w-full bg-slate-50 text-slate-700 text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-medical-500 focus:bg-white transition-all resize-none"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleCloseEditModal}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-all cursor-pointer border border-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-all cursor-pointer shadow-md shadow-blue-600/10"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- DELETE CONFIRMATION MODAL --- */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.1 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-md p-6"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 shrink-0">
                  <AlertTriangle className="w-6 h-6 animate-bounce" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <h3 className="text-base font-bold text-slate-800">Delete Study Session?</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Are you sure you want to delete this study session for <strong className="text-slate-800 font-semibold">"{deleteChapter}"</strong>? 
                    This action will rollback hours, accuracy trend lines, and dashboard statistics instantly.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseDeleteModal}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-all cursor-pointer border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs transition-all cursor-pointer shadow-md shadow-rose-600/10"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
