/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { BarChart2, Flame, Target, BookOpen, AlertCircle, TrendingUp, Sparkles, PieChart, Activity, Calendar } from 'lucide-react';
import { StudyEntry, ChapterStatus, NEETSubject } from '../types';
import { SUBJECT_COLORS } from '../neetData';
import { formatDate, daysBetween, addDays, formatMinutesToDecimalHours, formatMinutesToDecimalHoursNum } from '../utils';

interface AnalyticsPageProps {
  entries: StudyEntry[];
  chapterStatuses: ChapterStatus[];
}

export default function AnalyticsPage({ entries, chapterStatuses }: AnalyticsPageProps) {
  // Local hover state for heatmap
  const [hoveredDay, setHoveredDay] = useState<{ date: string; mins: number } | null>(null);
  
  // Local hover state for Daily study area chart
  const [hoveredPoint, setHoveredPoint] = useState<{ date: string; hrs: number; index: number } | null>(null);

  const todayStr = useMemo(() => formatDate(new Date()), []);

  // 1. Time-bucket Hours (Today, Week, Month, Lifetime) (accumulating minutes)
  const stats = useMemo(() => {
    let todayMins = 0;
    let todayClassMins = 0;
    let todaySelfMins = 0;
    let todayRevMins = 0;
    let todayPyqMins = 0;
    let todayMcqPracticeMins = 0;
    let todayTestAnalysisMins = 0;
    let todayMcqs = 0;
    let todayCorrect = 0;

    let weekMins = 0;
    let monthMins = 0;
    let lifetimeMins = 0;

    const oneWeekAgo = addDays(todayStr, -7);
    const oneMonthAgo = addDays(todayStr, -30);

    entries.forEach(e => {
      lifetimeMins += e.durationMinutes;

      if (e.date === todayStr) {
        todayMins += e.durationMinutes;
        if (e.studyType === 'Class') todayClassMins += e.durationMinutes;
        else if (e.studyType === 'Self Study') todaySelfMins += e.durationMinutes;
        else if (e.studyType === 'Revision') todayRevMins += e.durationMinutes;
        else if (e.studyType === 'PYQ') todayPyqMins += e.durationMinutes;
        else if (e.studyType === 'MCQ Practice') todayMcqPracticeMins += e.durationMinutes;
        else if (e.studyType === 'Test Analysis') todayTestAnalysisMins += e.durationMinutes;

        todayMcqs += e.mcqsSolved;
        todayCorrect += e.mcqsCorrect;
      }

      if (e.date >= oneWeekAgo) weekMins += e.durationMinutes;
      if (e.date >= oneMonthAgo) monthMins += e.durationMinutes;
    });

    const todayAccuracy = todayMcqs > 0 ? Math.round((todayCorrect / todayMcqs) * 100) : 0;

    return {
      todayMins,
      todayClassMins,
      todaySelfMins,
      todayRevMins,
      todayPyqMins,
      todayMcqPracticeMins,
      todayTestAnalysisMins,
      todayMcqs,
      todayAccuracy,
      weekMins,
      monthMins,
      lifetimeMins,
      todayHrsStr: formatMinutesToDecimalHours(todayMins),
      todayClassHrsStr: formatMinutesToDecimalHours(todayClassMins),
      todaySelfHrsStr: formatMinutesToDecimalHours(todaySelfMins),
      todayRevHrsStr: formatMinutesToDecimalHours(todayRevMins),
      todayPyqHrsStr: formatMinutesToDecimalHours(todayPyqMins),
      todayMcqPracticeHrsStr: formatMinutesToDecimalHours(todayMcqPracticeMins),
      todayTestAnalysisHrsStr: formatMinutesToDecimalHours(todayTestAnalysisMins),
      weekHrsStr: formatMinutesToDecimalHours(weekMins),
      monthHrsStr: formatMinutesToDecimalHours(monthMins),
      lifetimeHrsStr: formatMinutesToDecimalHours(lifetimeMins)
    };
  }, [entries, todayStr]);

  // 2. Subject Breakdown (accumulating minutes)
  const subjectBreakdown = useMemo(() => {
    let biologyMins = 0;
    let chemistryMins = 0;
    let physicsMins = 0;

    entries.forEach(e => {
      if (e.subject === 'Biology') biologyMins += e.durationMinutes;
      else if (e.subject === 'Chemistry') chemistryMins += e.durationMinutes;
      else if (e.subject === 'Physics') physicsMins += e.durationMinutes;
    });

    const total = biologyMins + chemistryMins + physicsMins;
    if (total === 0) {
      return { Biology: 33, Chemistry: 33, Physics: 34, raw: { Biology: '0', Chemistry: '0', Physics: '0' } };
    }

    return {
      Biology: Math.round((biologyMins / total) * 100),
      Chemistry: Math.round((chemistryMins / total) * 100),
      Physics: Math.round((physicsMins / total) * 100),
      raw: {
        Biology: formatMinutesToDecimalHours(biologyMins),
        Chemistry: formatMinutesToDecimalHours(chemistryMins),
        Physics: formatMinutesToDecimalHours(physicsMins)
      }
    };
  }, [entries]);

  // 3. GitHub-style Heatmap Grid (Last 120 Days)
  const heatmapData = useMemo(() => {
    const data: { date: string; mins: number; dayOfWeek: number }[] = [];
    const daysToGenerate = 119; // 120 days total (today + 119 days ago)
    
    // Find matching entries for each day
    const entriesByDateMap = new Map<string, number>();
    entries.forEach(e => {
      const currentVal = entriesByDateMap.get(e.date) || 0;
      entriesByDateMap.set(e.date, currentVal + e.durationMinutes);
    });

    for (let i = daysToGenerate; i >= 0; i--) {
      const dateStr = addDays(todayStr, -i);
      const d = new Date(dateStr);
      data.push({
        date: dateStr,
        mins: entriesByDateMap.get(dateStr) || 0,
        dayOfWeek: d.getDay() // 0 = Sunday, 1 = Monday, etc.
      });
    }

    // Group into columns representing 17 weeks
    const weeks: typeof data[] = [];
    let currentWeek: typeof data = [];
    
    // Pad first week if necessary
    const firstDayOfWeek = data[0].dayOfWeek;
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push({ date: '', mins: -1, dayOfWeek: i });
    }

    data.forEach(day => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    if (currentWeek.length > 0) {
      // Pad final week
      while (currentWeek.length < 7) {
        currentWeek.push({ date: '', mins: -1, dayOfWeek: currentWeek.length });
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }, [entries, todayStr]);

  // 4. Daily Hours Trend Curve (Last 10 days)
  const trendData = useMemo(() => {
    const dates: string[] = [];
    for (let i = 9; i >= 0; i--) {
      dates.push(addDays(todayStr, -i));
    }

    const hoursMap = new Map<string, number>();
    entries.forEach(e => {
      const currentVal = hoursMap.get(e.date) || 0;
      hoursMap.set(e.date, currentVal + e.durationMinutes / 60);
    });

    return dates.map(date => {
      // Format as Month Day (e.g. Jul 06)
      const d = new Date(date);
      const formattedLabel = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
      return {
        date,
        label: formattedLabel,
        hours: Number((hoursMap.get(date) || 0).toFixed(1))
      };
    });
  }, [entries, todayStr]);

  // SVG Area Chart Calculations
  const areaChartSvgPath = useMemo(() => {
    if (trendData.length === 0) return { linePath: '', areaPath: '', coords: [] };
    
    const chartWidth = 500;
    const chartHeight = 160;
    const padding = 25;
    
    const maxHours = Math.max(...trendData.map(d => d.hours), 4); // minimum ceiling of 4 hours
    
    const coords = trendData.map((d, idx) => {
      const x = padding + (idx * (chartWidth - padding * 2)) / (trendData.length - 1);
      const y = chartHeight - padding - (d.hours * (chartHeight - padding * 2)) / maxHours;
      return { x, y, hours: d.hours, date: d.date };
    });

    // Create curved spline
    let linePath = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i];
      const p1 = coords[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      linePath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }

    const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${chartHeight - padding} L ${coords[0].x} ${chartHeight - padding} Z`;
    
    return { linePath, areaPath, coords };
  }, [trendData]);

  // 5. Syllabus Bento analysis (Strong/Weak/Ignored)
  const bentoAnalysis = useMemo(() => {
    // Weakest: Studied chapters with average accuracy < 75%
    const activeChapters = chapterStatuses.filter(c => c.totalHours > 0);
    
    const weak = [...activeChapters]
      .filter(c => c.totalMcqs > 0 && c.averageAccuracy < 78)
      .sort((a, b) => a.averageAccuracy - b.averageAccuracy)
      .slice(0, 3);

    // Strongest: Studied chapters with high accuracy
    const strong = [...activeChapters]
      .filter(c => c.totalMcqs > 0 && c.averageAccuracy >= 88)
      .sort((a, b) => b.averageAccuracy - a.averageAccuracy)
      .slice(0, 3);

    // Most Ignored: Studied chapters, but not studied recently
    const ignored = [...activeChapters]
      .filter(c => c.lastStudiedDate && c.status !== 'Mastered')
      .sort((a, b) => {
        return new Date(a.lastStudiedDate!).getTime() - new Date(b.lastStudiedDate!).getTime();
      })
      .slice(0, 3);

    return { weak, strong, ignored };
  }, [chapterStatuses]);

  return (
    <div id="analytics-section" className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">Analytical Insights</h1>
          <p className="text-sm text-slate-500 mt-1">Deep visual summaries of mock scores, study volume splits, and long-term retention grids.</p>
        </div>
      </div>

      {/* Grid of Core Quantitative KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Today's Study</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-mono font-extrabold text-slate-800">{stats.todayHrsStr}</span>
            <span className="text-xs text-slate-500">hours</span>
          </div>
          <p className="text-[9px] text-slate-500 leading-relaxed">
            Class: {stats.todayClassHrsStr} • Self: {stats.todaySelfHrsStr} • Rev: {stats.todayRevHrsStr} • PYQ: {stats.todayPyqHrsStr} • Prac: {stats.todayMcqPracticeHrsStr} • Anal: {stats.todayTestAnalysisHrsStr}
          </p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Practice Accuracy</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-mono font-extrabold text-medical-700">{stats.todayAccuracy}%</span>
          </div>
          <p className="text-[10px] text-slate-500">
            Today: Solved {stats.todayMcqs} MCQs
          </p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Weekly Hours</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-mono font-extrabold text-slate-800">{stats.weekHrsStr}</span>
            <span className="text-xs text-slate-500">hours</span>
          </div>
          <p className="text-[10px] text-slate-500">Targeting 45h/week standard</p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Syllabus Hours</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-mono font-extrabold text-slate-800">{stats.lifetimeHrsStr}</span>
            <span className="text-xs text-slate-500">hours</span>
          </div>
          <p className="text-[10px] text-slate-500">Cumulated NEET Preparation logs</p>
        </div>
      </div>

      {/* Main Charts: Daily Curve & Subject Rings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SVG Daily hours Trend (Left) */}
        <div className="lg:col-span-8 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-medical-600" /> Daily Study Hour Curve (Last 10 Days)
            </h2>
            <span className="text-[10px] text-slate-400">Calculated in hours spent</span>
          </div>

          <div className="relative pt-4">
            {/* SVG area plot */}
            <svg viewBox="0 0 500 160" className="w-full h-44 overflow-visible">
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B5BDB" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#3B5BDB" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Gridlines */}
              <line x1="25" y1="25" x2="475" y2="25" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="25" y1="67" x2="475" y2="67" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="25" y1="110" x2="475" y2="110" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="25" y1="135" x2="475" y2="135" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="1" />

              {/* Shaded Area */}
              {areaChartSvgPath.areaPath && (
                <path d={areaChartSvgPath.areaPath} fill="url(#areaGrad)" />
              )}

              {/* Spline Line */}
              {areaChartSvgPath.linePath && (
                <path d={areaChartSvgPath.linePath} fill="none" stroke="#3B5BDB" strokeWidth="2.5" />
              )}

              {/* Nodes */}
              {areaChartSvgPath.coords.map((coord, idx) => (
                <circle
                  key={idx}
                  cx={coord.x}
                  cy={coord.y}
                  r={hoveredPoint?.index === idx ? 6 : 3.5}
                  fill={hoveredPoint?.index === idx ? '#3B5BDB' : '#ffffff'}
                  stroke="#3B5BDB"
                  strokeWidth="2.5"
                  className="cursor-pointer transition-all duration-150"
                  onMouseEnter={() => setHoveredPoint({ date: coord.date, hrs: coord.hours, index: idx })}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              ))}

              {/* Labels */}
              {trendData.map((d, idx) => {
                const x = 25 + (idx * (500 - 50)) / (trendData.length - 1);
                return (
                  <text
                    key={idx}
                    x={x}
                    y="155"
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="9"
                    fontFamily="var(--font-mono)"
                  >
                    {d.label}
                  </text>
                );
              })}
            </svg>

            {/* Hover tooltip */}
            {hoveredPoint && (
              <div className="absolute top-0 right-4 bg-slate-800 text-white p-2 rounded-lg text-[10px] font-mono shadow-md z-10 animate-fade-in">
                <span className="block font-bold">{hoveredPoint.date}</span>
                <span className="text-emerald-400 font-semibold">{hoveredPoint.hrs} hours studied</span>
              </div>
            )}
          </div>
        </div>

        {/* Subject wise Distribution (Right) */}
        <div className="lg:col-span-4 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <PieChart className="w-4 h-4 text-medical-600" /> Subject Balance
            </h2>
            <span className="text-[10px] text-slate-400">NCERT Weights</span>
          </div>

          <div className="flex flex-col justify-around h-44 py-2 text-xs font-semibold text-slate-700">
            {/* Biology progress circle */}
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Biology
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">{subjectBreakdown.raw.Biology}h logged</span>
              </div>
              <span className="font-mono font-bold text-slate-800 text-sm bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
                {subjectBreakdown.Biology}%
              </span>
            </div>

            {/* Chemistry progress circle */}
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-red-700 font-bold flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Chemistry
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">{subjectBreakdown.raw.Chemistry}h logged</span>
              </div>
              <span className="font-mono font-bold text-slate-800 text-sm bg-red-50 border border-red-100 px-2 py-0.5 rounded">
                {subjectBreakdown.Chemistry}%
              </span>
            </div>

            {/* Physics progress circle */}
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-blue-700 font-bold flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Physics
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">{subjectBreakdown.raw.Physics}h logged</span>
              </div>
              <span className="font-mono font-bold text-slate-800 text-sm bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
                {subjectBreakdown.Physics}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 120-Day Heatmap Consistency Grid */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-medical-600" /> Daily Practice consistency (Last 120 Days)
          </h2>
          <span className="text-[10px] text-slate-400 font-mono">Grid column = 1 week block</span>
        </div>

        <div className="overflow-x-auto py-2">
          <div className="flex gap-4 items-center min-w-[500px] justify-center">
            {/* Weekday indicators */}
            <div className="grid grid-rows-7 gap-1 text-[8px] font-bold text-slate-400 uppercase tracking-wider pr-1">
              <span>Su</span>
              <span>Mo</span>
              <span>Tu</span>
              <span>We</span>
              <span>Th</span>
              <span>Fr</span>
              <span>Sa</span>
            </div>

            {/* Heatmap Grid */}
            <div className="flex gap-1.5">
              {heatmapData.map((week, wIdx) => (
                <div key={wIdx} className="grid grid-rows-7 gap-1">
                  {week.map((day, dIdx) => {
                    if (day.mins === -1) {
                      // Padding empty box
                      return <div key={dIdx} className="w-3.5 h-3.5 bg-transparent" />;
                    }

                    // Style depending on duration
                    let bgClass = 'bg-slate-100'; // 0 mins
                    if (day.mins > 0 && day.mins <= 60) bgClass = 'bg-medical-100';
                    else if (day.mins > 60 && day.mins <= 120) bgClass = 'bg-medical-200';
                    else if (day.mins > 120 && day.mins <= 240) bgClass = 'bg-medical-500';
                    else if (day.mins > 240) bgClass = 'bg-medical-700';

                    return (
                      <div
                        key={dIdx}
                        className={`w-3.5 h-3.5 rounded-sm cursor-pointer border border-white/40 transition-all ${bgClass} hover:ring-2 hover:ring-slate-400`}
                        onMouseEnter={() => setHoveredDay({ date: day.date, mins: day.mins })}
                        onMouseLeave={() => setHoveredDay(null)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1">
            <span>Inactive</span>
            <div className="w-3.5 h-3.5 bg-slate-100 rounded-xs" />
            <div className="w-3.5 h-3.5 bg-medical-100 rounded-xs" />
            <div className="w-3.5 h-3.5 bg-medical-200 rounded-xs" />
            <div className="w-3.5 h-3.5 bg-medical-500 rounded-xs" />
            <div className="w-3.5 h-3.5 bg-medical-700 rounded-xs" />
            <span>High Volume Study (&gt;4h)</span>
          </div>

          {hoveredDay && (
            <div className="font-mono text-slate-700 font-bold animate-fade-in bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg">
              {hoveredDay.date}:{' '}
              <span className="text-medical-700">
                {hoveredDay.mins === 0
                  ? 'No sessions logged'
                  : `${Math.floor(hoveredDay.mins / 60)}h ${hoveredDay.mins % 60}m studied`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* NEET Syllabus Bento Grid (Strong / Weak / Most Ignored) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Strongest Chapters */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-50 pb-3">
            <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" /> Strongest Chapters (Accuracy High)
          </h3>
          
          {bentoAnalysis.strong.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">Maintain practice accuracy above 85% to list strong chapters here.</p>
          ) : (
            <div className="space-y-3">
              {bentoAnalysis.strong.map(c => {
                const colors = SUBJECT_COLORS[c.subject] || SUBJECT_COLORS.Biology;
                return (
                  <div key={c.chapterName} className="p-3 bg-slate-50 rounded-xl border border-slate-150 flex justify-between items-center text-xs">
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-800 leading-tight block truncate max-w-[170px]">{c.chapterName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{c.subject} • {formatMinutesToDecimalHours(Math.round(c.totalHours * 60))}h logged</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
                      {Math.round(c.averageAccuracy)}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Weakest Chapters */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-50 pb-3">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" /> Weakest Chapters (Needs Review)
          </h3>

          {bentoAnalysis.weak.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">Great precision! No logged chapters have practice accuracy below 78%.</p>
          ) : (
            <div className="space-y-3">
              {bentoAnalysis.weak.map(c => {
                return (
                  <div key={c.chapterName} className="p-3 bg-slate-50 rounded-xl border border-slate-150 flex justify-between items-center text-xs">
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-800 leading-tight block truncate max-w-[170px]">{c.chapterName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{c.subject} • {formatMinutesToDecimalHours(Math.round(c.totalHours * 60))}h logged</span>
                    </div>
                    <span className="font-mono font-bold text-rose-500 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded">
                      {Math.round(c.averageAccuracy)}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Most Ignored Chapters */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-50 pb-3">
            <TrendingUp className="w-4 h-4 text-amber-500 shrink-0" /> Most Ignored Chapters
          </h3>

          {bentoAnalysis.ignored.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">All completed chapters are currently active inside your revision calendar.</p>
          ) : (
            <div className="space-y-3">
              {bentoAnalysis.ignored.map(c => {
                const daysSince = daysBetween(c.lastStudiedDate!, todayStr);
                return (
                  <div key={c.chapterName} className="p-3 bg-slate-50 rounded-xl border border-slate-150 flex justify-between items-center text-xs">
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-800 leading-tight block truncate max-w-[160px]">{c.chapterName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{c.subject} • {c.status}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded">
                      {daysSince}d Ago
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
