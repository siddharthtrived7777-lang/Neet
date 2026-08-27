/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Sparkles,
  BookOpen,
  Target,
  CheckCircle,
  Clock,
  Search,
  ChevronDown,
  X,
  Award,
  Zap,
  Dna,
  FlaskConical,
  Coffee,
  AlertTriangle,
  Edit3,
  RefreshCw,
  Plus,
  Minus
} from 'lucide-react';
import { NEETSubject, StudyType, ConfidenceLevel, StudyEntry } from '../types';
import { NEET_SYLLABUS } from '../neetData';
import { getLogicalTodayDate } from '../utils';

export interface LiveStudyTimerProps {
  onAddEntry: (entry: Omit<StudyEntry, 'id' | 'accuracy' | 'durationMinutes'>) => void;
  defaultSubject?: NEETSubject;
  defaultChapter?: string;
  defaultStudyType?: StudyType;
  onClose?: () => void;
}

interface ActiveTimerState {
  isRunning: boolean;
  isPaused: boolean;
  sessionFirstStartTimestamp: number | null;
  startTimestamp: number | null;
  accumulatedMs: number;
  accumulatedBreakMs: number;
  lastPausedTimestamp: number | null;
  subject: NEETSubject;
  chapter: string;
  topic: string;
  studyType: StudyType;
  notes: string;
}

const STORAGE_KEY = 'neet_study_active_timer_v2';

export default function LiveStudyTimer({
  onAddEntry,
  defaultSubject = 'Biology',
  defaultChapter = '',
  defaultStudyType = 'Self Study',
  onClose
}: LiveStudyTimerProps) {
  // Load initial state from localStorage or defaults
  const [timerState, setTimerState] = useState<ActiveTimerState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          isRunning: parsed.isRunning || false,
          isPaused: parsed.isPaused || false,
          sessionFirstStartTimestamp: parsed.sessionFirstStartTimestamp || null,
          startTimestamp: parsed.startTimestamp || null,
          accumulatedMs: parsed.accumulatedMs || 0,
          accumulatedBreakMs: parsed.accumulatedBreakMs || 0,
          lastPausedTimestamp: parsed.lastPausedTimestamp || null,
          subject: parsed.subject || defaultSubject,
          chapter: parsed.chapter || defaultChapter,
          topic: parsed.topic || '',
          studyType: parsed.studyType || defaultStudyType,
          notes: parsed.notes || ''
        };
      }
    } catch (e) {
      console.error('Error loading timer state', e);
    }
    return {
      isRunning: false,
      isPaused: false,
      sessionFirstStartTimestamp: null,
      startTimestamp: null,
      accumulatedMs: 0,
      accumulatedBreakMs: 0,
      lastPausedTimestamp: null,
      subject: defaultSubject,
      chapter: defaultChapter,
      topic: '',
      studyType: defaultStudyType,
      notes: ''
    };
  });

  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [currentBreakMs, setCurrentBreakMs] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(false);
  const [showChapterSearch, setShowChapterSearch] = useState<boolean>(false);
  const [chapterSearchQuery, setChapterSearchQuery] = useState<string>('');

  // Reset confirmation modal state
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);

  // Completion modal state
  const [showCompleteModal, setShowCompleteModal] = useState<boolean>(false);
  const [durationHours, setDurationHours] = useState<number>(0);
  const [durationMinutesPart, setDurationMinutesPart] = useState<number>(0);
  const [detectedBreakMinutes, setDetectedBreakMinutes] = useState<number>(0);
  const [sessionStartTimeStr, setSessionStartTimeStr] = useState<string>('09:00');
  const [sessionEndTimeStr, setSessionEndTimeStr] = useState<string>('13:00');
  const [sessionDate, setSessionDate] = useState<string>(() => getLogicalTodayDate());
  const [completionSubject, setCompletionSubject] = useState<NEETSubject>(defaultSubject);
  const [completionChapter, setCompletionChapter] = useState<string>('');
  const [completionTopic, setCompletionTopic] = useState<string>('');
  const [completionStudyType, setCompletionStudyType] = useState<StudyType>('Self Study');
  const [completionMcqsSolved, setCompletionMcqsSolved] = useState<number>(0);
  const [completionMcqsCorrect, setCompletionMcqsCorrect] = useState<number>(0);
  const [completionMcqsWrong, setCompletionMcqsWrong] = useState<number>(0);
  const [completionConfidence, setCompletionConfidence] = useState<ConfidenceLevel>('Medium');
  const [completionNotes, setCompletionNotes] = useState<string>('');
  const [sessionNotification, setSessionNotification] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Sync state changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(timerState));
    } catch (e) {
      console.error('Error saving timer state', e);
    }
  }, [timerState]);

  // High-precision timer interval calculation
  useEffect(() => {
    const calculateCurrentElapsed = () => {
      if (!timerState.isRunning) {
        return timerState.accumulatedMs;
      }
      if (timerState.isPaused) {
        return timerState.accumulatedMs;
      }
      if (timerState.startTimestamp) {
        const now = Date.now();
        return timerState.accumulatedMs + (now - timerState.startTimestamp);
      }
      return 0;
    };

    const calculateCurrentBreak = () => {
      if (!timerState.isRunning || !timerState.isPaused || !timerState.lastPausedTimestamp) {
        return timerState.accumulatedBreakMs;
      }
      return timerState.accumulatedBreakMs + (Date.now() - timerState.lastPausedTimestamp);
    };

    setElapsedMs(calculateCurrentElapsed());
    setCurrentBreakMs(calculateCurrentBreak());

    if (!timerState.isRunning) return;

    const interval = setInterval(() => {
      setElapsedMs(calculateCurrentElapsed());
      setCurrentBreakMs(calculateCurrentBreak());
    }, 100);

    return () => clearInterval(interval);
  }, [
    timerState.isRunning,
    timerState.isPaused,
    timerState.startTimestamp,
    timerState.accumulatedMs,
    timerState.lastPausedTimestamp,
    timerState.accumulatedBreakMs
  ]);

  // Handle Fullscreen API sync
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (containerRef.current) {
        containerRef.current.requestFullscreen().catch(() => {
          setIsFullscreen(true);
        });
      } else {
        document.documentElement.requestFullscreen().catch(() => {
          setIsFullscreen(true);
        });
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  // Subtle ambient audio feedback (Zen chime on pause/start)
  const playChime = (type: 'start' | 'pause' | 'stop') => {
    if (!isSoundEnabled) return;
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'start') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === 'pause') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(660, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.25);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.5);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
      }
    } catch (e) {
      // Audio context ignored safely
    }
  };

  // Timer controls
  const handleStartTimer = () => {
    const now = Date.now();
    setTimerState(prev => ({
      ...prev,
      isRunning: true,
      isPaused: false,
      sessionFirstStartTimestamp: prev.sessionFirstStartTimestamp || now,
      startTimestamp: now,
      lastPausedTimestamp: null
    }));
    playChime('start');
  };

  const handlePauseTimer = () => {
    if (!timerState.isRunning || timerState.isPaused) return;
    const now = Date.now();
    const currentSessionMs = timerState.startTimestamp ? now - timerState.startTimestamp : 0;
    setTimerState(prev => ({
      ...prev,
      isPaused: true,
      accumulatedMs: prev.accumulatedMs + currentSessionMs,
      startTimestamp: null,
      lastPausedTimestamp: now
    }));
    playChime('pause');
  };

  const handleResumeTimer = () => {
    if (!timerState.isRunning || !timerState.isPaused) return;
    const now = Date.now();
    const pauseDurationMs = timerState.lastPausedTimestamp ? now - timerState.lastPausedTimestamp : 0;
    setTimerState(prev => ({
      ...prev,
      isPaused: false,
      startTimestamp: now,
      accumulatedBreakMs: prev.accumulatedBreakMs + pauseDurationMs,
      lastPausedTimestamp: null
    }));
    playChime('start');
  };

  const handleConfirmResetTimer = () => {
    setTimerState(prev => ({
      ...prev,
      isRunning: false,
      isPaused: false,
      sessionFirstStartTimestamp: null,
      startTimestamp: null,
      accumulatedMs: 0,
      accumulatedBreakMs: 0,
      lastPausedTimestamp: null
    }));
    setElapsedMs(0);
    setCurrentBreakMs(0);
    setShowResetConfirmModal(false);
  };

  const handleStopAndLogSession = () => {
    playChime('stop');

    const now = Date.now();
    let finalAccumulatedMs = timerState.accumulatedMs;
    let finalBreakMs = timerState.accumulatedBreakMs;

    if (timerState.isRunning) {
      if (!timerState.isPaused && timerState.startTimestamp) {
        finalAccumulatedMs += now - timerState.startTimestamp;
      } else if (timerState.isPaused && timerState.lastPausedTimestamp) {
        finalBreakMs += now - timerState.lastPausedTimestamp;
      }
    }

    // Pure studied minutes (minimum 1 min if tested > 15s)
    const totalStudyMins = Math.max(1, Math.round(finalAccumulatedMs / (1000 * 60)));
    const totalBreakMins = Math.round(finalBreakMs / (1000 * 60));

    const hrs = Math.floor(totalStudyMins / 60);
    const mins = totalStudyMins % 60;
    setDurationHours(hrs);
    setDurationMinutesPart(mins);
    setDetectedBreakMinutes(totalBreakMins);

    // Format Start Time & End Time strings (HH:MM)
    const formatHHMM = (d: Date) => {
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      return `${h}:${m}`;
    };

    const endDate = new Date(now);
    const endTimeStr = formatHHMM(endDate);

    let startTimeStr = '09:00';
    if (timerState.sessionFirstStartTimestamp) {
      startTimeStr = formatHHMM(new Date(timerState.sessionFirstStartTimestamp));
    } else {
      // Approximate start time from total elapsed + break time
      const totalSessionMinutes = totalStudyMins + totalBreakMins;
      const startDate = new Date(now - totalSessionMinutes * 60 * 1000);
      startTimeStr = formatHHMM(startDate);
    }

    setSessionStartTimeStr(startTimeStr);
    setSessionEndTimeStr(endTimeStr);
    setSessionDate(getLogicalTodayDate());
    setCompletionSubject(timerState.subject);
    setCompletionChapter(timerState.chapter || '');
    setCompletionTopic(timerState.topic || 'Live Study Session Review');
    setCompletionStudyType(timerState.studyType || 'Self Study');
    setCompletionMcqsSolved(0);
    setCompletionMcqsCorrect(0);
    setCompletionMcqsWrong(0);
    setCompletionConfidence('Medium');
    setCompletionNotes(timerState.notes || '');

    setShowCompleteModal(true);
  };

  // Helper to recalculate duration from start and end time
  const handleRecalculateFromTimes = () => {
    try {
      const [startH, startM] = sessionStartTimeStr.split(':').map(Number);
      const [endH, endM] = sessionEndTimeStr.split(':').map(Number);

      let diffMinutes = endH * 60 + endM - (startH * 60 + startM);
      if (diffMinutes < 0) {
        // Cross midnight
        diffMinutes += 24 * 60;
      }

      // Deduct detected break time if within range
      const netStudyMinutes = Math.max(1, diffMinutes - detectedBreakMinutes);
      setDurationHours(Math.floor(netStudyMinutes / 60));
      setDurationMinutesPart(netStudyMinutes % 60);
    } catch (e) {
      console.error('Error recalculating times', e);
    }
  };

  // Quick adjust duration by +/- minutes
  const handleAdjustDuration = (deltaMins: number) => {
    const totalCurrentMins = durationHours * 60 + durationMinutesPart;
    const newTotal = Math.max(1, totalCurrentMins + deltaMins);
    setDurationHours(Math.floor(newTotal / 60));
    setDurationMinutesPart(newTotal % 60);
  };

  const handleSaveCompletedSession = (e: React.FormEvent) => {
    e.preventDefault();

    if (!completionChapter.trim()) {
      alert('Please select or specify the NEET Chapter studied.');
      return;
    }

    const calculatedTotalMinutes = Math.max(1, durationHours * 60 + durationMinutesPart);

    // Call the parent onAddEntry handler
    onAddEntry({
      date: sessionDate,
      startTime: sessionStartTimeStr,
      endTime: sessionEndTimeStr,
      subject: completionSubject,
      chapter: completionChapter.trim(),
      topic: completionTopic.trim() || 'General Session Focus',
      studyType: completionStudyType,
      mcqsSolved: completionMcqsSolved,
      mcqsCorrect: completionMcqsCorrect,
      mcqsWrong: completionMcqsWrong,
      confidenceLevel: completionConfidence,
      notes: completionNotes.trim()
    });

    setSessionNotification(
      `Successfully logged ${calculatedTotalMinutes}m of ${completionSubject} (${completionChapter}) into study logs!`
    );

    // Reset timer state after logging
    setTimerState(prev => ({
      ...prev,
      isRunning: false,
      isPaused: false,
      sessionFirstStartTimestamp: null,
      startTimestamp: null,
      accumulatedMs: 0,
      accumulatedBreakMs: 0,
      lastPausedTimestamp: null,
      notes: ''
    }));
    setElapsedMs(0);
    setCurrentBreakMs(0);
    setShowCompleteModal(false);

    // Auto-dismiss notification after 6s
    setTimeout(() => {
      setSessionNotification(null);
    }, 6000);
  };

  // Convert milliseconds into formatted hours, minutes, seconds
  const timeBreakdown = useMemo(() => {
    const totalSec = Math.floor(elapsedMs / 1000);
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    const pad = (n: number) => String(n).padStart(2, '0');
    return {
      hoursStr: pad(hrs),
      minutesStr: pad(mins),
      secondsStr: pad(secs),
      totalSeconds: totalSec,
      totalMinutes: Math.floor(totalSec / 60)
    };
  }, [elapsedMs]);

  // Break time breakdown
  const breakBreakdown = useMemo(() => {
    const totalSec = Math.floor(currentBreakMs / 1000);
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return {
      formatted: `${hrs > 0 ? `${hrs}h ` : ''}${mins}m ${pad(secs)}s`,
      totalMinutes: Math.round(totalSec / 60)
    };
  }, [currentBreakMs]);

  // Filter syllabus chapters for active subject
  const filteredChapters = useMemo(() => {
    const subj = timerState.subject;
    const query = chapterSearchQuery.toLowerCase().trim();
    return NEET_SYLLABUS.filter(
      c =>
        c.subject === subj &&
        (!query || c.name.toLowerCase().includes(query) || c.unit.toLowerCase().includes(query))
    );
  }, [timerState.subject, chapterSearchQuery]);

  // Subject Visual Theme Metadata
  const theme = useMemo(() => {
    switch (timerState.subject) {
      case 'Biology':
        return {
          name: 'Biology',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          gradientBg: 'from-emerald-950 via-slate-950 to-teal-950',
          radialGlow: 'bg-emerald-500/10',
          accentColor: '#10B981',
          accentText: 'text-emerald-400',
          accentBorder: 'border-emerald-500/40',
          ringColor: 'stroke-emerald-400',
          buttonPrimary:
            'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30',
          quote: 'Mastering the Living World • High-Yield NCERT Precision',
          icon: Dna,
          particles: ['🧬', '🌿', '🔬', '🌱', '🫀', '🦠']
        };
      case 'Chemistry':
        return {
          name: 'Chemistry',
          badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
          gradientBg: 'from-cyan-950 via-slate-950 to-blue-950',
          radialGlow: 'bg-cyan-500/10',
          accentColor: '#06B6D4',
          accentText: 'text-cyan-400',
          accentBorder: 'border-cyan-500/40',
          ringColor: 'stroke-cyan-400',
          buttonPrimary:
            'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/30',
          quote: 'Unraveling Reaction Mechanisms • Stoichiometry & Organic Logic',
          icon: FlaskConical,
          particles: ['⚗️', '🧪', '⚛️', '🔥', '💎', '🧬']
        };
      case 'Physics':
      default:
        return {
          name: 'Physics',
          badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
          gradientBg: 'from-indigo-950 via-slate-950 to-violet-950',
          radialGlow: 'bg-indigo-500/10',
          accentColor: '#818CF8',
          accentText: 'text-indigo-400',
          accentBorder: 'border-indigo-500/40',
          ringColor: 'stroke-indigo-400',
          buttonPrimary:
            'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/30',
          quote: 'Formulas in Motion • Vector Equilibrium, Kinematics & Circuits',
          icon: Zap,
          particles: ['⚡', '🌌', '🪐', '🧭', '⚛️', '🔭']
        };
    }
  }, [timerState.subject]);

  const IconComponent = theme.icon;

  // Clock visual calculation for circular chronograph
  const secondsFraction = (timeBreakdown.totalSeconds % 60) / 60;
  const circleRadius = 140;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - secondsFraction * circumference;

  return (
    <div
      ref={containerRef}
      id="live-study-timer-container"
      className={`relative w-full transition-all duration-500 rounded-3xl overflow-hidden ${
        isFullscreen
          ? 'fixed inset-0 z-50 h-screen w-screen rounded-none flex flex-col justify-between p-6 md:p-10'
          : 'bg-slate-950 border border-slate-800 shadow-2xl p-5 md:p-8'
      } bg-gradient-to-br ${theme.gradientBg} text-white`}
    >
      {/* Dynamic Background Atmospheric Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute -top-32 -left-32 w-96 h-96 rounded-full ${theme.radialGlow} blur-3xl`} />
        <div className={`absolute -bottom-32 -right-32 w-96 h-96 rounded-full ${theme.radialGlow} blur-3xl`} />

        {/* Floating Particles */}
        <div className="absolute inset-0 opacity-15">
          {theme.particles.map((p, idx) => (
            <motion.div
              key={idx}
              className="absolute text-2xl select-none"
              style={{
                top: `${(idx * 18 + 10) % 85}%`,
                left: `${(idx * 23 + 12) % 90}%`
              }}
              animate={{
                y: [0, -15, 0],
                rotate: [0, 15, -15, 0],
                opacity: [0.3, 0.7, 0.3]
              }}
              transition={{
                duration: 6 + idx * 1.5,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              {p}
            </motion.div>
          ))}
        </div>

        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
      </div>

      {/* Top Header Bar */}
      <div className="relative z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        {/* Subject Switcher Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mr-1 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" /> Active Subject:
          </span>
          {(['Physics', 'Chemistry', 'Biology'] as NEETSubject[]).map(subj => {
            const isActive = timerState.subject === subj;
            let activeColor = '';
            if (subj === 'Biology')
              activeColor =
                'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-emerald-500/10 shadow';
            else if (subj === 'Chemistry')
              activeColor =
                'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-cyan-500/10 shadow';
            else
              activeColor =
                'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-indigo-500/10 shadow';

            return (
              <button
                key={subj}
                onClick={() => {
                  setTimerState(prev => ({
                    ...prev,
                    subject: subj,
                    chapter: prev.subject === subj ? prev.chapter : ''
                  }));
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? activeColor
                    : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                {subj === 'Biology' && <Dna className="w-3 h-3" />}
                {subj === 'Chemistry' && <FlaskConical className="w-3 h-3" />}
                {subj === 'Physics' && <Zap className="w-3 h-3" />}
                <span>{subj}</span>
              </button>
            );
          })}
        </div>

        {/* Top Control Tools */}
        <div className="flex items-center gap-2">
          {/* Study Type Select */}
          <div className="relative">
            <select
              value={timerState.studyType}
              onChange={e =>
                setTimerState(prev => ({ ...prev, studyType: e.target.value as StudyType }))
              }
              className="bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold rounded-xl px-3 py-1.5 border border-white/15 outline-none cursor-pointer appearance-none pr-7 transition-all"
            >
              <option value="Self Study" className="bg-slate-900 text-white">Self Study</option>
              <option value="Class" className="bg-slate-900 text-white">Class Session</option>
              <option value="Revision" className="bg-slate-900 text-white">Revision</option>
              <option value="PYQ" className="bg-slate-900 text-white">Solving Past Years (PYQ)</option>
              <option value="MCQ Practice" className="bg-slate-900 text-white">MCQ Practice Drills</option>
              <option value="Test Analysis" className="bg-slate-900 text-white">Test Mistake Analysis</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isSoundEnabled
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
            }`}
            title={isSoundEnabled ? 'Zen Chimes Enabled' : 'Mute Zen Chimes'}
          >
            {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isFullscreen
                ? 'bg-medical-500/20 text-medical-300 border-medical-500/40'
                : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
            }`}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Immersive Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 text-slate-400 border border-white/10 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40 transition-all cursor-pointer"
              title="Close Timer Window"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Notification Banner */}
      <AnimatePresence>
        {sessionNotification && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="relative z-20 mt-4 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl p-4 flex items-center gap-3 text-emerald-200 text-sm shadow-xl shadow-emerald-950/50"
          >
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="font-semibold">{sessionNotification}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Break In Progress Alert / Banner */}
      <AnimatePresence>
        {timerState.isRunning && timerState.isPaused && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="relative z-20 mt-3 bg-amber-950/70 border border-amber-500/40 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-amber-200 shadow-xl backdrop-blur-md"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <Coffee className="w-4 h-4 animate-bounce" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <span>Break in Progress:</span>
                  <span className="font-mono text-sm font-extrabold text-amber-100">
                    {breakBreakdown.formatted}
                  </span>
                </p>
                <p className="text-[11px] text-amber-400/80">
                  Break time is automatically excluded from your pure studied duration.
                </p>
              </div>
            </div>
            <button
              onClick={handleResumeTimer}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow cursor-pointer transition-all flex items-center gap-1.5 shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Resume Study</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Focus Clock Arena */}
      <div className="relative z-20 my-auto py-6 md:py-8 flex flex-col items-center justify-center text-center">
        {/* Chapter & Topic Quick Config Pill */}
        <div className="mb-6 relative max-w-xl w-full">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setShowChapterSearch(!showChapterSearch)}
              className={`px-4 py-2 rounded-2xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer backdrop-blur-md ${
                timerState.chapter
                  ? `${theme.badgeColor} ${theme.accentBorder}`
                  : 'bg-white/10 text-slate-300 border-white/15 hover:bg-white/15 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate max-w-[240px] md:max-w-xs">
                {timerState.chapter || 'Select NEET Chapter to Focus on...'}
              </span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {timerState.chapter && (
              <button
                onClick={() => setTimerState(prev => ({ ...prev, chapter: '' }))}
                className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
                title="Clear chapter"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Search Chapter Dropdown */}
          <AnimatePresence>
            {showChapterSearch && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 5 }}
                className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-full max-w-md bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-3 shadow-2xl z-40 text-left"
              >
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder={`Search ${timerState.subject} syllabus chapters...`}
                    value={chapterSearchQuery}
                    onChange={e => setChapterSearchQuery(e.target.value)}
                    autoFocus
                    className="w-full bg-slate-800/80 border border-slate-700 text-slate-100 text-xs rounded-xl pl-9 pr-3 py-2 outline-none focus:border-medical-500"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-slate-800/60 rounded-lg">
                  {filteredChapters.map(c => (
                    <button
                      key={c.name}
                      onClick={() => {
                        setTimerState(prev => ({ ...prev, chapter: c.name }));
                        setShowChapterSearch(false);
                        setChapterSearchQuery('');
                      }}
                      className="w-full px-3 py-2 text-xs text-slate-300 hover:bg-white/10 hover:text-white transition-all flex items-center justify-between text-left cursor-pointer"
                    >
                      <span className="font-medium truncate pr-2">{c.name}</span>
                      <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded font-mono shrink-0">
                        {c.unit}
                      </span>
                    </button>
                  ))}
                  {filteredChapters.length === 0 && (
                    <div className="p-3 text-xs text-slate-400 text-center">
                      No matching syllabus chapters found.
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Central Circular Chronograph Visual & Digital Numerals */}
        <div className="relative flex items-center justify-center mb-6">
          <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 320 320">
              {/* Background Track Ring */}
              <circle
                cx="160"
                cy="160"
                r={circleRadius}
                fill="transparent"
                stroke="currentColor"
                strokeWidth="6"
                className="text-white/5"
              />

              {/* Minute/Second Tick Markers */}
              {Array.from({ length: 60 }).map((_, i) => {
                const angle = (i * 6 * Math.PI) / 180;
                const isMajor = i % 5 === 0;
                const innerR = isMajor ? circleRadius - 12 : circleRadius - 6;
                const outerR = circleRadius + 2;
                const x1 = 160 + innerR * Math.cos(angle);
                const y1 = 160 + innerR * Math.sin(angle);
                const x2 = 160 + outerR * Math.cos(angle);
                const y2 = 160 + outerR * Math.sin(angle);
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isMajor ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)'}
                    strokeWidth={isMajor ? '2' : '1'}
                  />
                );
              })}

              {/* Live Animated Radial Progress Arc */}
              <circle
                cx="160"
                cy="160"
                r={circleRadius}
                fill="transparent"
                stroke={theme.accentColor}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-300 ease-linear drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]"
              />
            </svg>

            {/* Central Digital Time Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
              <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                <IconComponent className={`w-3.5 h-3.5 ${theme.accentText}`} />
                <span>{timerState.subject}</span>
              </div>

              {/* Large Digital Clock Numerals */}
              <div className="font-mono font-extrabold text-4xl md:text-5xl lg:text-6xl tracking-tight text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-baseline justify-center">
                <span>{timeBreakdown.hoursStr}</span>
                <span
                  className={`mx-0.5 ${
                    timerState.isRunning && !timerState.isPaused
                      ? 'animate-pulse text-slate-300'
                      : 'text-slate-500'
                  }`}
                >
                  :
                </span>
                <span>{timeBreakdown.minutesStr}</span>
                <span
                  className={`mx-0.5 ${
                    timerState.isRunning && !timerState.isPaused
                      ? 'animate-pulse text-slate-300'
                      : 'text-slate-500'
                  }`}
                >
                  :
                </span>
                <span className={theme.accentText}>{timeBreakdown.secondsStr}</span>
              </div>

              {/* Status / Pure Study Subtitle */}
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    !timerState.isRunning
                      ? 'bg-slate-500'
                      : timerState.isPaused
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-emerald-400 animate-ping'
                  }`}
                />
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300 font-mono">
                  {!timerState.isRunning
                    ? 'Ready To Study'
                    : timerState.isPaused
                    ? 'Timer Paused (Break)'
                    : 'Active Studied Time'}
                </span>
              </div>

              {/* Break Info Pill */}
              {currentBreakMs > 1000 && (
                <div className="mt-1.5 px-2.5 py-0.5 rounded-full bg-black/40 border border-white/10 text-[10px] text-amber-300 font-mono flex items-center gap-1">
                  <Coffee className="w-3 h-3 text-amber-400" />
                  <span>Break: {breakBreakdown.formatted}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Motivational Subject Focus Line */}
        <p className="text-xs md:text-sm text-slate-400 font-medium max-w-md mx-auto mb-6 leading-relaxed">
          {theme.quote}
        </p>

        {/* Primary Interactive Control Bar */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {!timerState.isRunning ? (
            <button
              onClick={handleStartTimer}
              className={`px-8 py-4 rounded-2xl font-display font-extrabold text-base md:text-lg flex items-center gap-3 transition-all transform hover:scale-105 active:scale-95 cursor-pointer ${theme.buttonPrimary}`}
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Start {timerState.subject} Study Session</span>
            </button>
          ) : (
            <>
              {/* Pause / Resume */}
              {timerState.isPaused ? (
                <button
                  onClick={handleResumeTimer}
                  className="px-5 py-3 rounded-2xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30 flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Resume Study</span>
                </button>
              ) : (
                <button
                  onClick={handlePauseTimer}
                  className="px-5 py-3 rounded-2xl font-bold text-sm bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/30 flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Take a Break (Pause)</span>
                </button>
              )}

              {/* Stop & Log Session */}
              <button
                onClick={handleStopAndLogSession}
                className="px-5 py-3 rounded-2xl font-bold text-sm bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/30 flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Stop & Log Session</span>
              </button>

              {/* Reset with Confirmation Dialog */}
              <button
                onClick={() => setShowResetConfirmModal(true)}
                className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white border border-white/15 transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                title="Reset timer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Bottom Sub-panel: Study Mode Note */}
      <div className="relative z-20 border-t border-white/10 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            {`Active Study Mode: ${timerState.studyType}. Breaks are automatically deducted to calculate pure study time.`}
          </span>
        </div>
        <span className="font-mono text-[10px] text-slate-500">
          Unlimited Digital Timer • Auto Break Detection
        </span>
      </div>

      {/* --- RESET CONFIRMATION MODAL --- */}
      <AnimatePresence>
        {showResetConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-700 text-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-left"
            >
              <div className="flex items-center gap-3 text-rose-400 border-b border-slate-800 pb-3">
                <div className="p-2 rounded-xl bg-rose-500/20">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                </div>
                <h3 className="font-display font-bold text-base text-white">
                  Are you sure you want to reset?
                </h3>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                This will clear your current elapsed study time (
                <span className="font-mono font-bold text-white">
                  {timeBreakdown.hoursStr}h {timeBreakdown.minutesStr}m {timeBreakdown.secondsStr}s
                </span>
                ) and break duration. Unlogged time will not be saved into your NEET study logs.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowResetConfirmModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer"
                >
                  Cancel & Keep Timer
                </button>
                <button
                  onClick={handleConfirmResetTimer}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-all shadow-lg shadow-rose-900/40 cursor-pointer"
                >
                  Yes, Reset Timer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- FINISH SESSION LOGGING MODAL WITH EDITABLE TIME --- */}
      <AnimatePresence>
        {showCompleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-xl w-full p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6 text-left"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-medical-50 dark:bg-medical-950/50 text-medical-600 dark:text-medical-400 flex items-center justify-center">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                      Log Finished Study Session
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Break times were automatically detected and deducted. You can adjust the time below.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCompleteModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Automatic Time Detection & Breakdown Card */}
              <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-medical-600 dark:text-medical-400" />
                    Automatic Time Detection
                  </span>
                  {detectedBreakMinutes > 0 && (
                    <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/40 flex items-center gap-1">
                      <Coffee className="w-3 h-3" />
                      {detectedBreakMinutes} min break deducted
                    </span>
                  )}
                </div>

                {/* Editable Total Duration Inputs */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Edit3 className="w-3 h-3 text-medical-600" />
                      Total Pure Studied Time (Editable)
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleAdjustDuration(-15)}
                        className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-slate-200 dark:bg-slate-750 text-slate-600 dark:text-slate-300 hover:bg-slate-300 cursor-pointer"
                      >
                        -15m
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAdjustDuration(15)}
                        className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-slate-200 dark:bg-slate-750 text-slate-600 dark:text-slate-300 hover:bg-slate-300 cursor-pointer"
                      >
                        +15m
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        max="24"
                        value={durationHours}
                        onChange={e => setDurationHours(Math.max(0, Number(e.target.value)))}
                        className="w-12 bg-transparent text-sm font-mono font-extrabold text-slate-900 dark:text-white outline-none text-center"
                      />
                      <span className="text-xs font-bold text-slate-400">Hours</span>
                    </div>

                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={durationMinutesPart}
                        onChange={e =>
                          setDurationMinutesPart(Math.max(0, Math.min(59, Number(e.target.value))))
                        }
                        className="w-12 bg-transparent text-sm font-mono font-extrabold text-slate-900 dark:text-white outline-none text-center"
                      />
                      <span className="text-xs font-bold text-slate-400">Minutes</span>
                    </div>
                  </div>
                </div>

                {/* Editable Start and End Times */}
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">
                      Start & End Clock Times (e.g. 09:00 to 13:00)
                    </span>
                    <button
                      type="button"
                      onClick={handleRecalculateFromTimes}
                      className="text-[10px] font-bold text-medical-600 hover:text-medical-700 dark:text-medical-400 flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Auto-Calculate from Times
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={sessionStartTimeStr}
                        onChange={e => setSessionStartTimeStr(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={sessionEndTimeStr}
                        onChange={e => setSessionEndTimeStr(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveCompletedSession} className="space-y-4">
                {/* Subject & Study Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                      Subject
                    </label>
                    <select
                      value={completionSubject}
                      onChange={e => setCompletionSubject(e.target.value as NEETSubject)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none"
                    >
                      <option value="Biology">Biology</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Physics">Physics</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                      Study Type
                    </label>
                    <select
                      value={completionStudyType}
                      onChange={e => setCompletionStudyType(e.target.value as StudyType)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none"
                    >
                      <option value="Self Study">Self Study</option>
                      <option value="Class">Class Session</option>
                      <option value="Revision">Revision</option>
                      <option value="PYQ">Solving Past Years (PYQ)</option>
                      <option value="MCQ Practice">MCQ Practice Drills</option>
                      <option value="Test Analysis">Test Mistake Analysis</option>
                    </select>
                  </div>
                </div>

                {/* Chapter & Topic */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    Chapter Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={completionChapter}
                    onChange={e => setCompletionChapter(e.target.value)}
                    placeholder="Enter or select syllabus chapter..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-medical-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    Sub-Topic / Concepts Studied
                  </label>
                  <input
                    type="text"
                    value={completionTopic}
                    onChange={e => setCompletionTopic(e.target.value)}
                    placeholder="e.g. Diaphragmatic loop cycle, Zener diode, Limiting reagent..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-medical-500"
                  />
                </div>

                {/* MCQ Solved / Correct / Wrong */}
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-red-500" /> MCQ Drills During Session
                    </span>
                    {completionMcqsSolved > 0 && (
                      <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {Math.round((completionMcqsCorrect / completionMcqsSolved) * 100)}% Accuracy
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Solved
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={completionMcqsSolved}
                        onChange={e => {
                          const val = Number(e.target.value);
                          setCompletionMcqsSolved(val);
                          if (val >= completionMcqsCorrect) {
                            setCompletionMcqsWrong(val - completionMcqsCorrect);
                          } else {
                            setCompletionMcqsCorrect(val);
                            setCompletionMcqsWrong(0);
                          }
                        }}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs text-center font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-emerald-500 uppercase mb-1">
                        Correct
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={completionMcqsSolved}
                        value={completionMcqsCorrect}
                        onChange={e => {
                          const val = Number(e.target.value);
                          setCompletionMcqsCorrect(val);
                          if (completionMcqsSolved >= val) {
                            setCompletionMcqsWrong(completionMcqsSolved - val);
                          }
                        }}
                        className="w-full bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-lg p-1.5 text-xs text-center font-mono font-bold text-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-rose-500 uppercase mb-1">
                        Wrong
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={completionMcqsSolved}
                        value={completionMcqsWrong}
                        onChange={e => {
                          const val = Number(e.target.value);
                          setCompletionMcqsWrong(val);
                          if (completionMcqsSolved >= val) {
                            setCompletionMcqsCorrect(completionMcqsSolved - val);
                          }
                        }}
                        className="w-full bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 rounded-lg p-1.5 text-xs text-center font-mono font-bold text-rose-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Confidence */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Confidence Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['High', 'Medium', 'Low'] as ConfidenceLevel[]).map(lvl => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setCompletionConfidence(lvl)}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          completionConfidence === lvl
                            ? lvl === 'High'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : lvl === 'Medium'
                              ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300'
                              : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    Mistake Analysis / Key Notes
                  </label>
                  <textarea
                    rows={2}
                    value={completionNotes}
                    onChange={e => setCompletionNotes(e.target.value)}
                    placeholder="Key concepts grasped or NCERT lines to revisit..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-medical-500 resize-none"
                  />
                </div>

                {/* Submit Action */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCompleteModal(false)}
                    className="w-1/3 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 py-3 rounded-xl bg-medical-700 hover:bg-medical-800 text-white text-xs font-bold shadow-lg shadow-medical-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Confirm & Save Study Session</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
