import React, { useState } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Zap, 
  Delete, 
  Award, 
  Sparkles, 
  ArrowRight,
  Check
} from 'lucide-react';
import { Student, ClassSession } from '../types';
import confetti from 'canvas-confetti';

interface QuickKeypadModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  columnId: string;
  columnName: string;
  session: ClassSession;
  students: Student[];
  onSelectStudent: (student: Student) => void;
  onSelectColumn: (columnId: string, columnName: string) => void;
  onUpdateScore: (studentId: string, columnId: string, value: number | null) => void;
}

export const QuickKeypadModal: React.FC<QuickKeypadModalProps> = ({
  isOpen,
  onClose,
  student,
  columnId,
  columnName,
  session,
  students,
  onSelectStudent,
  onSelectColumn,
  onUpdateScore,
}) => {
  const [autoAdvance, setAutoAdvance] = useState(true);

  if (!isOpen || !student) return null;

  const currentScoreRecord = session.studentScores[student.id];
  const currentScoreValue = currentScoreRecord?.scores[columnId];

  const currentStudentIndex = students.findIndex(s => s.id === student.id);

  const handleApplyScore = (score: number | null) => {
    onUpdateScore(student.id, columnId, score);

    // Trigger subtle confetti for high scores (10)
    if (score === 10) {
      try {
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.8 },
        });
      } catch (e) {
        // ignore
      }
    }

    if (autoAdvance) {
      const nextIndex = currentStudentIndex + 1;
      if (nextIndex < students.length) {
        onSelectStudent(students[nextIndex]);
      }
    }
  };

  const handlePrevStudent = () => {
    if (currentStudentIndex > 0) {
      onSelectStudent(students[currentStudentIndex - 1]);
    }
  };

  const handleNextStudent = () => {
    if (currentStudentIndex < students.length - 1) {
      onSelectStudent(students[currentStudentIndex + 1]);
    }
  };

  const scoreButtons = [
    { label: '10', value: 10, highlight: 'bg-emerald-600 text-white hover:bg-emerald-500' },
    { label: '9.5', value: 9.5, highlight: 'bg-emerald-500 text-white hover:bg-emerald-400' },
    { label: '9', value: 9, highlight: 'bg-emerald-50 text-emerald-800 border border-emerald-300' },
    { label: '8.5', value: 8.5, highlight: 'bg-sky-50 text-sky-800 border border-sky-300' },
    { label: '8', value: 8, highlight: 'bg-sky-50 text-sky-800 border border-sky-300' },
    { label: '7.5', value: 7.5, highlight: 'bg-sky-50 text-sky-800 border border-sky-300' },
    { label: '7', value: 7, highlight: 'bg-slate-50 text-slate-800 border border-slate-300' },
    { label: '6.5', value: 6.5, highlight: 'bg-slate-50 text-slate-800 border border-slate-300' },
    { label: '6', value: 6, highlight: 'bg-slate-50 text-slate-800 border border-slate-300' },
    { label: '5.5', value: 5.5, highlight: 'bg-amber-50 text-amber-800 border border-amber-300' },
    { label: '5', value: 5, highlight: 'bg-amber-50 text-amber-800 border border-amber-300' },
    { label: '4', value: 4, highlight: 'bg-rose-50 text-rose-800 border border-rose-300' },
    { label: '3', value: 3, highlight: 'bg-rose-50 text-rose-800 border border-rose-300' },
    { label: '2', value: 2, highlight: 'bg-rose-50 text-rose-800 border border-rose-300' },
    { label: '0', value: 0, highlight: 'bg-slate-100 text-slate-700 border border-slate-300' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">
                Bàn Phím Tích Điểm Nhanh
              </h3>
              <p className="text-[11px] text-slate-400">
                1 chạm là chấm xong, tự động nhảy tiếp
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Student & Column Banner */}
        <div className="bg-slate-50/70 border-b border-slate-200 p-3">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={handlePrevStudent}
              disabled={currentStudentIndex === 0}
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 disabled:opacity-30 active:scale-95 transition shadow-2xs cursor-pointer"
              title="Học sinh trước"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="text-center flex-1">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold mb-0.5">
                <span>STT: {student.stt || currentStudentIndex + 1}</span>
                <span>•</span>
                <span>{student.gender || 'Nam'}</span>
              </div>
              <h4 className="font-bold text-slate-900 text-base leading-tight">
                {student.name}
              </h4>
              <p className="text-[11px] text-slate-500 font-normal">
                Đang nhập cho: <strong className="text-rose-600 font-semibold">{columnName}</strong>
              </p>
            </div>

            <button
              onClick={handleNextStudent}
              disabled={currentStudentIndex === students.length - 1}
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 disabled:opacity-30 active:scale-95 transition shadow-2xs cursor-pointer"
              title="Học sinh tiếp theo"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Current Score Display */}
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="text-xs font-medium text-slate-500">Điểm hiện tại:</span>
            <span className="font-bold text-lg text-slate-900 bg-white px-3 py-0.5 rounded-lg border border-slate-300">
              {currentScoreValue !== null && currentScoreValue !== undefined ? currentScoreValue : 'Chưa có'}
            </span>
          </div>
        </div>

        {/* Column Quick Switcher */}
        <div className="px-3 pt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">Chọn cột:</span>
          {session.scorePairs.flatMap(p => [
            { id: p.col1Id, name: p.col1Name },
            { id: p.col2Id, name: p.col2Name }
          ]).map(col => (
            <button
              key={col.id}
              onClick={() => onSelectColumn(col.id, col.name)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                columnId === col.id
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {col.name.replace(/\(.*?\)/g, '').trim()}
            </button>
          ))}
        </div>

        {/* Keypad Grid */}
        <div className="p-3 grid grid-cols-3 sm:grid-cols-5 gap-2 overflow-y-auto">
          {scoreButtons.map(btn => (
            <button
              key={btn.label}
              onClick={() => handleApplyScore(btn.value)}
              className={`h-12 rounded-xl font-bold text-lg flex items-center justify-center shadow-2xs transition active:scale-95 cursor-pointer ${btn.highlight}`}
            >
              {btn.label}
            </button>
          ))}

          {/* Clear Button */}
          <button
            onClick={() => handleApplyScore(null)}
            className="h-12 col-span-1 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-200 font-semibold text-xs flex items-center justify-center gap-1 shadow-2xs transition active:scale-95 cursor-pointer"
          >
            <Delete className="w-4 h-4" />
            <span>Xóa điểm</span>
          </button>
        </div>

        {/* Bottom Options & Controls */}
        <div className="bg-slate-50 border-t border-slate-200 p-3 flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoAdvance}
              onChange={(e) => setAutoAdvance(e.target.checked)}
              className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
            />
            <span className="text-xs font-semibold text-slate-700">
              Tự động nhảy sang HS tiếp theo
            </span>
          </label>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition shadow-2xs cursor-pointer"
          >
            Xong
          </button>
        </div>
      </div>
    </div>
  );
};
