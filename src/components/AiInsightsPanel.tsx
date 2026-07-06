/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, HelpCircle, ArrowRight, CheckCircle, AlertCircle, MessageSquare, ShieldAlert, BookOpen, User, Lightbulb } from 'lucide-react';
import { StudyEntry, TestEntry, ChapterStatus, RevisionTask } from '../types';
import { generateAiInsights, AiInsight } from '../utils';

interface AiInsightsPanelProps {
  entries: StudyEntry[];
  tests: TestEntry[];
  chapterStatuses: ChapterStatus[];
  revisions: RevisionTask[];
}

export default function AiInsightsPanel({
  entries,
  tests,
  chapterStatuses,
  revisions
}: AiInsightsPanelProps) {
  // Generate active alerts
  const activeInsights = useMemo(() => {
    return generateAiInsights(entries, tests, chapterStatuses, revisions);
  }, [entries, tests, chapterStatuses, revisions]);

  // Chatbot State
  const [messages, setMessages] = useState<{ id: string; sender: 'user' | 'aura'; text: string; date: string }[]>(() => [
    {
      id: 'welcome',
      sender: 'aura',
      text: "Hello! I am Aura, your cognitive NEET preparation coach. I've analyzed your daily logbooks and practice test scorecard. Ask me anything about your current weaknesses, forgetting curve schedules, or subject coverage splits!",
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputVal, setInputVal] = useState<string>('');

  const presetPrompts = [
    "What are my weakest chapters?",
    "Which chapter needs urgent revision?",
    "Analyze my subject-wise study balance",
    "How is my MCQ practice accuracy?"
  ];

  // Custom response engine based on real state
  const handleBotResponse = (promptText: string) => {
    const userMsg = {
      id: Math.random().toString(),
      sender: 'user' as const,
      text: promptText,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);

    // Analyze data and generate response
    setTimeout(() => {
      let responseText = '';

      const weakChaps = chapterStatuses.filter(c => c.totalMcqs > 0 && c.averageAccuracy < 78);
      const overdueRevs = revisions.filter(r => !r.completed && new Date(r.dueDate) < new Date());
      const totalHrs = entries.reduce((sum, e) => sum + e.durationMinutes / 60, 0);

      const normalizedPrompt = promptText.toLowerCase();

      if (normalizedPrompt.includes('weak') || normalizedPrompt.includes('accuracy')) {
        if (weakChaps.length > 0) {
          responseText = `Based on your MCQ practice records, your primary concept vulnerabilities are:\n\n` +
            weakChaps.map(c => `• **${c.chapterName}** (${c.subject}) - Average Practice Accuracy is ${Math.round(c.averageAccuracy)}% over ${c.totalHours.toFixed(1)}h studied.`).join('\n') +
            `\n\n**Aura Coach Recommendation:** For chapters with accuracy below 80%, halt testing drills and schedule deep self-study of high-weightage NCERT paragraph concepts. Draw standard diagrams and map errors explicitly in notes.`;
        } else {
          responseText = "Incredible precision! All of your logged chapters are currently showing practice accuracies above 80%. Maintain this focus during your mock test cycles.";
        }
      } else if (normalizedPrompt.includes('urgent') || normalizedPrompt.includes('revise') || normalizedPrompt.includes('revision')) {
        if (overdueRevs.length > 0) {
          responseText = `You currently have **${overdueRevs.length} revisions overdue** relative to your spacing dates. The most pressing reviews are:\n\n` +
            overdueRevs.slice(0, 3).map(r => `• **${r.chapterName}** (${r.subject}) - Stage ${r.stage} Review (Overdue since ${r.dueDate}).`).join('\n') +
            `\n\n**Aura Coach Recommendation:** Unblock these scheduled reviews immediately to prevent permanent cognitive trace decay. Spend 15 minutes reviewing critical formulas followed by a 15-question revision practice set.`;
        } else {
          responseText = "Your spaced-repetition calendar is completely up to date! There are no overdue reviews. You are in an elite cognitive retention phase.";
        }
      } else if (normalizedPrompt.includes('balance') || normalizedPrompt.includes('subject')) {
        const p_hrs = entries.filter(e => e.subject === 'Physics').reduce((s, e) => s + e.durationMinutes / 60, 0);
        const c_hrs = entries.filter(e => e.subject === 'Chemistry').reduce((s, e) => s + e.durationMinutes / 60, 0);
        const b_hrs = entries.filter(e => e.subject === 'Biology').reduce((s, e) => s + e.durationMinutes / 60, 0);

        responseText = `Here is your cumulative study time breakdown across the three core NEET sections:\n\n` +
          `• **Biology:** ${b_hrs.toFixed(1)} hours (${totalHrs > 0 ? Math.round((b_hrs / totalHrs) * 100) : 0}%)\n` +
          `• **Chemistry:** ${c_hrs.toFixed(1)} hours (${totalHrs > 0 ? Math.round((c_hrs / totalHrs) * 100) : 0}%)\n` +
          `• **Physics:** ${p_hrs.toFixed(1)} hours (${totalHrs > 0 ? Math.round((p_hrs / totalHrs) * 100) : 0}%)\n\n`;

        if (p_hrs < c_hrs && p_hrs < b_hrs) {
          responseText += "**Aura Coach Advice:** Your Physics volume is currently the lowest. Since Physics is typically the rank-determining factor in NEET due to complex mathematical applications, raise your daily numerical problem practice by 30 minutes.";
        } else if (b_hrs < p_hrs) {
          responseText += "**Aura Coach Advice:** Ensure you maintain regular NCERT biology reading blocks. Biology represents 50% of the entire NEET question paper (360/720 marks), making memorization depth paramount.";
        } else {
          responseText += "Excellent subject balance! Your study hours align nicely with the core marks structure of the NEET syllabus.";
        }
      } else {
        responseText = `I've analyzed your current logs. To date, you have logged **${totalHrs.toFixed(1)} hours** across the syllabus with an average practice volume. ` +
          (weakChaps.length > 0 ? `I highly suggest focusing on resolving conceptual hurdles in **${weakChaps[0].chapterName}**.` : "You are demonstrating outstanding preparation consistency! Continue logbook entries daily.");
      }

      const botMsg = {
        id: Math.random().toString(),
        sender: 'aura' as const,
        text: responseText,
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    }, 850);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    handleBotResponse(inputVal.trim());
    setInputVal('');
  };

  return (
    <div id="ai-insights-section" className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">Aura AI Study Coach</h1>
          <p className="text-sm text-slate-500 mt-1">Intelligent diagnostic feedback, active warnings, and customized NCERT preparation strategies.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Dynamic Alerts List (Left Column) */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" /> Active Diagnostic Alerts
          </h2>

          <div className="space-y-3.5">
            {activeInsights.map((ins) => {
              // Color mappings based on alert types
              let bg = 'bg-blue-50 border-blue-150 text-blue-850';
              let iconColor = 'text-blue-600';
              if (ins.type === 'alert' || ins.type === 'warning') {
                bg = 'bg-rose-50/55 border-rose-100 text-rose-850';
                iconColor = 'text-rose-600';
              } else if (ins.type === 'success') {
                bg = 'bg-emerald-50/50 border-emerald-100 text-emerald-850';
                iconColor = 'text-emerald-600';
              } else if (ins.type === 'warning') {
                bg = 'bg-amber-50/50 border-amber-100 text-amber-850';
                iconColor = 'text-amber-600';
              }

              return (
                <div key={ins.id} className={`p-4 border rounded-xl flex items-start gap-3 transition-all hover:shadow-xs ${bg}`}>
                  <ShieldAlert className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
                  <div className="space-y-1 text-xs">
                    <span className="font-bold text-slate-800 block">{ins.title}</span>
                    <p className="text-slate-600 leading-relaxed text-[11px]">{ins.message}</p>
                    {ins.chapter && (
                      <span className="inline-block text-[9px] font-mono font-bold text-slate-500 mt-1.5 bg-white/70 px-2 py-0.5 rounded border border-slate-100">
                        Target Chapter: {ins.chapter}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Chatbot Assistant (Right Column) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col h-[520px]">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-medical-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-800">Aura Study Coach Chat</h3>
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Diagnostic Engine Online
                </span>
              </div>
            </div>
          </div>

          {/* Preset trigger buttons */}
          <div className="flex flex-wrap gap-2 mb-4 shrink-0">
            {presetPrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleBotResponse(p)}
                className="px-2.5 py-1.5 bg-slate-50 hover:bg-medical-50 hover:text-medical-700 hover:border-medical-200 border border-slate-200 rounded-xl text-[10px] font-semibold text-slate-600 transition-all cursor-pointer"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Conversation history area */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-4 mb-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div className={`p-2 rounded-xl shrink-0 h-8 w-8 flex items-center justify-center border ${
                  msg.sender === 'user' ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-medical-100 border-medical-200 text-medical-700'
                }`}>
                  {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                </div>

                <div className={`p-3.5 rounded-2xl text-xs space-y-1.5 leading-relaxed shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-medical-700 text-white rounded-tr-none'
                    : 'bg-slate-50 text-slate-700 rounded-tl-none border border-slate-150'
                }`}>
                  <p className="whitespace-pre-line">{msg.text}</p>
                  <span className={`block text-[8px] text-right ${msg.sender === 'user' ? 'text-medical-200' : 'text-slate-400'}`}>
                    {msg.date}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Input control box */}
          <form onSubmit={handleSend} className="flex gap-2 shrink-0 border-t border-slate-100 pt-3">
            <input
              type="text"
              placeholder="Ask Aura about your preparation schedules..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-medical-500 focus:bg-white transition-all"
            />
            <button
              type="submit"
              className="bg-medical-700 hover:bg-medical-800 text-white font-medium rounded-xl text-xs px-4 py-2.5 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              Ask Coach <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
