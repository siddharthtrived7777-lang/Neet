import React, { useState, useEffect } from 'react';
import { X, Calendar, Trash2, Clock, Check } from 'lucide-react';

interface ExamCountdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: string | null;
  onSave: (date: string | null) => void;
}

export default function ExamCountdownModal({ isOpen, onClose, currentDate, onSave }: ExamCountdownModalProps) {
  const [selectedDate, setSelectedDate] = useState<string>('');

  useEffect(() => {
    if (currentDate) {
      setSelectedDate(currentDate);
    } else {
      // Default to today
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      setSelectedDate(`${yyyy}-${mm}-${dd}`);
    }
  }, [currentDate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDate) {
      onSave(selectedDate);
      onClose();
    }
  };

  const handleClear = () => {
    onSave(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div 
        id="exam-countdown-card"
        className="relative w-full max-w-sm bg-white rounded-2xl border border-slate-100 shadow-xl p-6 md:p-8 animate-scale-up"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon & Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-50 text-amber-600 mb-3">
            <Calendar className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-800">
            Set NEET Exam Date
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-normal">
            Track your remaining days with an active countdown display in the planner header.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-400 mb-1.5">
              Select Exam Date
            </label>
            <div className="relative">
              <input 
                type="date"
                required
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-4 pr-4 py-2.5 bg-slate-50 text-slate-700 text-xs border border-slate-200 rounded-xl outline-none focus:border-medical-500 focus:bg-white transition-all cursor-pointer font-medium"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-medical-600 hover:bg-medical-700 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" /> Save Exam Date
            </button>

            {currentDate && (
              <button
                type="button"
                onClick={handleClear}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-100 font-semibold text-xs rounded-xl transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> Clear Target Date
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
