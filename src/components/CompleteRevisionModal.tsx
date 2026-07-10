/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, Target, Award, ArrowRight } from 'lucide-react';
import { RevisionTask, NEETSubject } from '../types';
import { calculateDuration, formatMinutesToDecimalHours, triggerToast } from '../utils';
import { SUBJECT_COLORS } from '../neetData';

interface CompleteRevisionModalProps {
  isOpen: boolean;
  revision: RevisionTask | null;
  onClose: () => void;
  onConfirm: (
    id: string,
    accuracy: number,
    mcqsSolved: number,
    notes: string,
    startTime: string,
    endTime: string,
    durationMinutes: number,
    mcqsCorrect: number,
    mcqsWrong: number
  ) => void;
}

export default function CompleteRevisionModal({
  isOpen,
  revision,
  onClose,
  onConfirm,
}: CompleteRevisionModalProps) {
  const [startTime, setStartTime] = useState<string>('10:00');
  const [endTime, setEndTime] = useState<string>('11:00');
  const [mcqsSolved, setMcqsSolved] = useState<number>(20);
  const [mcqsCorrect, setMcqsCorrect] = useState<number>(17);
  const [mcqsWrong, setMcqsWrong] = useState<number>(3);
  const [notes, setNotes] = useState<string>('');

  // Dynamically set realistic default times when modal opens
  useEffect(() => {
    if (isOpen && revision) {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMins = now.getMinutes();
      const pad = (num: number) => String(num).padStart(2, '0');
      
      const formattedEnd = `${pad(currentHours)}:${pad(currentMins)}`;
      const startHours = (currentHours - 1 + 24) % 24;
      const formattedStart = `${pad(startHours)}:${pad(currentMins)}`;
      
      setStartTime(formattedStart);
      setEndTime(formattedEnd);
      setMcqsSolved(20);
      setMcqsCorrect(17);
      setMcqsWrong(3);
      setNotes('');
    }
  }, [isOpen, revision]);

  // Handle MCQ changes to auto-balance correct + wrong = solved
  const handleSolvedChange = (solvedVal: number) => {
    setMcqsSolved(solvedVal);
    if (solvedVal >= mcqsCorrect) {
      setMcqsWrong(solvedVal - mcqsCorrect);
    } else {
      setMcqsCorrect(solvedVal);
      setMcqsWrong(0);
    }
  };

  const handleCorrectChange = (correctVal: number) => {
    setMcqsCorrect(correctVal);
    if (mcqsSolved >= correctVal) {
      setMcqsWrong(mcqsSolved - correctVal);
    }
  };

  const handleWrongChange = (wrongVal: number) => {
    setMcqsWrong(wrongVal);
    if (mcqsSolved >= wrongVal) {
      setMcqsCorrect(mcqsSolved - wrongVal);
    }
  };

  const durationMinutes = useMemo(() => {
    return calculateDuration(startTime, endTime);
  }, [startTime, endTime]);

  const accuracy = useMemo(() => {
    if (mcqsSolved === 0) return 0;
    return Math.round((mcqsCorrect / mcqsSolved) * 100);
  }, [mcqsSolved, mcqsCorrect]);

  const subjectColors = useMemo(() => {
    if (!revision) return SUBJECT_COLORS.Biology;
    return SUBJECT_COLORS[revision.subject] || SUBJECT_COLORS.Biology;
  }, [revision]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revision) return;

    if (durationMinutes <= 0) {
      triggerToast('End Time must be after Start Time.', 'error');
      return;
    }

    if (mcqsSolved < 0 || mcqsCorrect < 0 || mcqsWrong < 0) {
      triggerToast('MCQ numbers cannot be negative.', 'error');
      return;
    }

    if (mcqsCorrect + mcqsWrong !== mcqsSolved) {
      triggerToast('Correct and Wrong MCQs must sum to total Solved MCQs.', 'error');
      return;
    }

    onConfirm(
      revision.id,
      accuracy,
      mcqsSolved,
      notes,
      startTime,
      endTime,
      durationMinutes,
      mcqsCorrect,
      mcqsWrong
    );
  };

  if (!revision) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col text-slate-800 dark:text-slate-100"
          >
            {/* Header / Subj Banner */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 relative">
              <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full font-mono uppercase tracking-widest ${subjectColors.bg} ${subjectColors.text}`}>
                    {revision.subject}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                    Stage {revision.stage} Spaced Revision
                  </span>
                </div>
                <h3 className="font-display font-black text-lg md:text-xl text-slate-800 dark:text-slate-100 leading-tight">
                  Complete Revision Session
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                  <span>{revision.chapterName}</span>
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 max-h-[75vh]">
              {/* TIME SEGMENT */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400" /> 1. Duration / Study Time
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Start Time</label>
                    <input
                      type="time"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs outline-none focus:border-medical-500 dark:focus:border-medical-500 text-slate-800 dark:text-slate-100 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">End Time</label>
                    <input
                      type="time"
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs outline-none focus:border-medical-500 dark:focus:border-medical-500 text-slate-800 dark:text-slate-100 transition-all"
                    />
                  </div>
                </div>

                <div className="bg-medical-50/60 dark:bg-medical-950/20 border border-dashed border-medical-200/50 dark:border-medical-900/40 rounded-xl p-3 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-2 font-medium text-medical-600 dark:text-medical-400">
                    <Clock className="w-4 h-4 animate-pulse" /> Live Calculated Duration:
                  </span>
                  <span className="font-mono font-extrabold text-medical-700 dark:text-medical-300 bg-medical-50 dark:bg-medical-950/50 px-2.5 py-1 rounded-md border border-medical-200/60 dark:border-medical-800">
                    {durationMinutes} mins ({formatMinutesToDecimalHours(durationMinutes)} hrs)
                  </span>
                </div>
              </div>

              {/* QUESTIONS PRACTICE */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-slate-400" /> 2. MCQ Practice Details
                </h4>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Total Solved</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={mcqsSolved}
                      onChange={(e) => handleSolvedChange(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-medical-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Correct MCQs</label>
                    <input
                      type="number"
                      min="0"
                      max={mcqsSolved}
                      required
                      value={mcqsCorrect}
                      onChange={(e) => handleCorrectChange(Math.min(mcqsSolved, Math.max(0, Number(e.target.value))))}
                      className="w-full bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-200 dark:border-emerald-900 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-red-600 dark:text-red-400">Wrong MCQs</label>
                    <input
                      type="number"
                      min="0"
                      max={mcqsSolved}
                      required
                      value={mcqsWrong}
                      onChange={(e) => handleWrongChange(Math.min(mcqsSolved, Math.max(0, Number(e.target.value))))}
                      className="w-full bg-red-50/40 dark:bg-red-950/10 border border-red-200 dark:border-red-900 rounded-xl px-3 py-2 text-xs font-mono font-bold text-red-600 dark:text-red-400 outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                {mcqsSolved > 0 && (
                  <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-200/60 dark:border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-500" /> Practice Accuracy achieved:
                    </span>
                    <span className={`font-mono font-extrabold px-2.5 py-1 rounded-md border text-xs ${
                      accuracy >= 85
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-400'
                        : accuracy >= 65
                        ? 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-400'
                        : 'bg-red-50 border-red-200 text-red-600 dark:bg-red-950/30 dark:border-red-900 dark:text-red-400'
                    }`}>
                      {accuracy}% Accuracy
                    </span>
                  </div>
                )}
              </div>

              {/* NOTES / REMARKS */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Revision Notes / Remarks</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="NCERT key concept formulas reviewed, high-yield mistakes rectified..."
                  className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs outline-none focus:border-medical-500 dark:focus:border-medical-500 text-slate-800 dark:text-slate-100 transition-all resize-none"
                />
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex gap-3 justify-end pt-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-medical-700 hover:bg-medical-800 dark:bg-medical-600 dark:hover:bg-medical-500 text-white rounded-xl transition-all shadow-md shadow-medical-900/10 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Log & Complete Revision</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
