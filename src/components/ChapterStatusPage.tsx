/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, BookOpen, Layers, CheckCircle2, RefreshCw, BarChart2, Star, Eye } from 'lucide-react';
import { ChapterStatus, NEETSubject, ChapterStatusType } from '../types';
import { SUBJECT_COLORS } from '../neetData';
import { formatMinutesToDecimalHours } from '../utils';

interface ChapterStatusPageProps {
  chapterStatuses: ChapterStatus[];
  onSelectChapter: (chapterName: string) => void; // allow quick link to deep search/profile
}

const STATUS_ORDER: ChapterStatusType[] = [
  'Not Started',
  'Studying',
  'Completed',
  'Revision 1',
  'Revision 2',
  'Revision 3',
  'Revision 4',
  'Revision 5',
  'Revision 6',
  'Revision 7',
  'Mastered'
];

export default function ChapterStatusPage({ chapterStatuses, onSelectChapter }: ChapterStatusPageProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterSubject, setFilterSubject] = useState<NEETSubject | 'All'>('All');
  const [filterStatus, setFilterStatus] = useState<ChapterStatusType | 'All'>('All');

  // Syllabus Completion Stats
  const syllabusStats = useMemo(() => {
    let total = chapterStatuses.length;
    let notStarted = 0;
    let studying = 0;
    let completedPlus = 0; // Only Mastered chapters count as fully completed
    let mastered = 0;

    chapterStatuses.forEach(c => {
      if (c.status === 'Not Started') notStarted++;
      else if (c.status === 'Studying') studying++;
      else if (c.status === 'Mastered') {
        completedPlus++;
        mastered++;
      } else {
        // 'Completed' and 'Revision 1-7' are NOT marked as completed in the syllabus tracker until they reach 'Mastered'
      }
    });

    const completionPercent = total > 0 ? Math.round((completedPlus / total) * 100) : 0;
    const masteredPercent = total > 0 ? Math.round((mastered / total) * 100) : 0;

    return { total, notStarted, studying, completedPlus, mastered, completionPercent, masteredPercent };
  }, [chapterStatuses]);

  // Filtered Chapters
  const filteredChapters = useMemo(() => {
    return chapterStatuses.filter(chap => {
      const matchSearch = chap.chapterName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchSubject = filterSubject === 'All' || chap.subject === filterSubject;
      const matchStatus = filterStatus === 'All' || chap.status === filterStatus;
      return matchSearch && matchSubject && matchStatus;
    });
  }, [chapterStatuses, searchQuery, filterSubject, filterStatus]);

  // Color Mapping for Status
  const getStatusBadgeStyles = (status: ChapterStatusType) => {
    switch (status) {
      case 'Not Started':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'Studying':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Completed':
        return 'bg-violet-50 text-violet-700 border-violet-200';
      case 'Revision 1':
      case 'Revision 2':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Revision 3':
      case 'Revision 4':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'Revision 5':
      case 'Revision 6':
      case 'Revision 7':
        return 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200';
      case 'Mastered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div id="chapter-status-section" className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">Syllabus Tracker</h1>
          <p className="text-sm text-slate-500 mt-1">Check progress, total review depth, and memorization status across the full NEET curriculum.</p>
        </div>
      </div>

      {/* Progress Dashboard Card */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Main Progression Gauges */}
        <div className="md:col-span-4 space-y-4">
          <div>
            <div className="flex justify-between items-center text-xs font-semibold text-slate-600 mb-1.5">
              <span>Syllabus Covered</span>
              <span className="font-mono text-slate-800">{syllabusStats.completionPercent}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3">
              <div
                className="bg-medical-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${syllabusStats.completionPercent}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center text-xs font-semibold text-slate-600 mb-1.5">
              <span>Chapters Mastered (Rev 7 Done)</span>
              <span className="font-mono text-slate-800">{syllabusStats.masteredPercent}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3">
              <div
                className="bg-emerald-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${syllabusStats.masteredPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Detailed Count Badges */}
        <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Not Started</span>
            <span className="text-xl font-mono font-bold text-slate-600">{syllabusStats.notStarted}</span>
          </div>

          <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-blue-400 block tracking-wider">Studying</span>
            <span className="text-xl font-mono font-bold text-blue-700">{syllabusStats.studying}</span>
          </div>

          <div className="p-3 bg-teal-50/50 border border-teal-100 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-teal-500 block tracking-wider">In Revision</span>
            <span className="text-xl font-mono font-bold text-teal-700">
              {chapterStatuses.filter(c => c.status.startsWith('Revision')).length}
            </span>
          </div>

          <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-emerald-500 block tracking-wider">Mastered</span>
            <span className="text-xl font-mono font-bold text-emerald-700">{syllabusStats.mastered}</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center shadow-sm">
        <div className="relative w-full md:max-w-md">
          <input
            type="text"
            placeholder="Search NEET chapter name (e.g. Semiconductor, Cell)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 text-slate-700 text-xs border border-slate-200 rounded-xl pl-9 pr-3 py-2 outline-none focus:border-medical-500 focus:bg-white"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value as NEETSubject | 'All')}
            className="w-full md:w-auto bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl px-3 py-2 outline-none focus:border-medical-500 focus:bg-white"
          >
            <option value="All">All Subjects</option>
            <option value="Physics">Physics</option>
            <option value="Chemistry">Chemistry</option>
            <option value="Biology">Biology</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ChapterStatusType | 'All')}
            className="w-full md:w-auto bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl px-3 py-2 outline-none focus:border-medical-500 focus:bg-white"
          >
            <option value="All">All Statuses</option>
            {STATUS_ORDER.map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table grid */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-150 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3.5">Chapter & Subject</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-center">Study Hours</th>
                <th className="px-4 py-3.5 text-center">MCQs Solved</th>
                <th className="px-4 py-3.5 text-center">Practice Accuracy</th>
                <th className="px-4 py-3.5">Last Studied</th>
                <th className="px-4 py-3.5">Next Revision</th>
                <th className="px-5 py-3.5 text-center">Focus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
              {filteredChapters.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    No chapters match your selected query and filters.
                  </td>
                </tr>
              ) : (
                filteredChapters.map((chap) => {
                  const clr = SUBJECT_COLORS[chap.subject] || SUBJECT_COLORS.Biology;
                  return (
                    <tr key={chap.chapterName} className="hover:bg-slate-50/50 transition-all">
                      {/* Name & Subject */}
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-800 leading-tight">{chap.chapterName}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono uppercase tracking-wide ${clr.bg} ${clr.text}`}>
                            {chap.subject}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span className={`px-2.5 py-1 text-[10px] font-semibold border rounded-full ${getStatusBadgeStyles(chap.status)}`}>
                          {chap.status}
                        </span>
                      </td>

                      {/* Study Hours */}
                      <td className="px-4 py-4 text-center font-mono font-medium text-slate-700">
                        {chap.totalHours > 0 ? `${formatMinutesToDecimalHours(Math.round(chap.totalHours * 60))}h` : '—'}
                      </td>

                      {/* MCQs */}
                      <td className="px-4 py-4 text-center font-mono font-medium text-slate-700">
                        {chap.totalMcqs > 0 ? chap.totalMcqs : '—'}
                      </td>

                      {/* Accuracy */}
                      <td className="px-4 py-4 text-center">
                        {chap.totalMcqs > 0 ? (
                          <span className={`font-mono font-bold ${
                            chap.averageAccuracy >= 90
                              ? 'text-emerald-600'
                              : chap.averageAccuracy >= 75
                              ? 'text-teal-600'
                              : 'text-amber-600'
                          }`}>
                            {Math.round(chap.averageAccuracy)}%
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Last Studied */}
                      <td className="px-4 py-4 font-mono text-[11px] text-slate-500">
                        {chap.lastStudiedDate ? chap.lastStudiedDate : 'Not started'}
                      </td>

                      {/* Next Revision */}
                      <td className="px-4 py-4 font-mono text-[11px]">
                        {chap.nextRevisionDate ? (
                          <span className={new Date(chap.nextRevisionDate) < new Date() ? 'text-rose-600 font-semibold' : 'text-slate-500'}>
                            {chap.nextRevisionDate}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Action to Quick Search Chapter details */}
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => onSelectChapter(chap.chapterName)}
                          className="p-1.5 text-slate-400 hover:text-medical-600 hover:bg-medical-50 rounded-lg transition-all"
                          title="Open deep search details for this chapter"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
