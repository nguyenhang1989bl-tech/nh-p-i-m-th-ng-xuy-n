import React from 'react';
import { 
  X, 
  BarChart3, 
  Award, 
  TrendingUp, 
  Users, 
  CheckCircle2,
  PieChart as PieIcon,
  Star
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { ClassSession, Student } from '../types';
import { calculateOverallAverage, getGradeRank } from '../utils/excelExport';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ClassSession;
  students: Student[];
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  isOpen,
  onClose,
  session,
  students,
}) => {
  if (!isOpen) return null;

  // Calculate stats
  const allAvgs = students
    .map(s => calculateOverallAverage(session, s.id))
    .filter((a): a is number => a !== null);

  const totalScored = allAvgs.length;
  const classAvg = totalScored > 0 ? (allAvgs.reduce((a, b) => a + b, 0) / totalScored).toFixed(2) : '0';
  const highest = totalScored > 0 ? Math.max(...allAvgs).toFixed(1) : '-';
  const lowest = totalScored > 0 ? Math.min(...allAvgs).toFixed(1) : '-';

  const goodCount = allAvgs.filter(s => s >= 8.0).length;
  const fairCount = allAvgs.filter(s => s >= 6.5 && s < 8.0).length;
  const passCount = allAvgs.filter(s => s >= 5.0 && s < 6.5).length;
  const weakCount = allAvgs.filter(s => s < 5.0).length;

  // Chart data: Distribution buckets
  const chartData = [
    { range: '0 - 4.9 (Yếu)', count: weakCount, color: '#f43f5e' },
    { range: '5.0 - 6.4 (TB)', count: passCount, color: '#f59e0b' },
    { range: '6.5 - 7.9 (Khá)', count: fairCount, color: '#0ea5e9' },
    { range: '8.0 - 10 (Giỏi)', count: goodCount, color: '#10b981' },
  ];

  // Top bonus students
  const bonusStudents = students
    .map(s => ({
      student: s,
      bonus: session.studentScores[s.id]?.bonusPoints || 0,
      score: calculateOverallAverage(session, s.id),
    }))
    .filter(item => item.bonus > 0)
    .sort((a, b) => b.bonus - a.bonus)
    .slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center shadow-xs">
              <BarChart3 className="w-4 h-4 text-slate-950 font-bold" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">
                Thống Kê & Phổ Điểm Tiết Học
              </h3>
              <p className="text-[11px] text-slate-400">
                Lớp {session.className} • Môn {session.subject} • Tiết {session.period}
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

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Quick Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl text-center">
              <span className="text-[11px] font-semibold text-indigo-700">Điểm TB Lớp</span>
              <div className="text-xl font-bold text-indigo-950 mt-0.5">{classAvg}</div>
            </div>

            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-center">
              <span className="text-[11px] font-semibold text-emerald-700">Cao nhất</span>
              <div className="text-xl font-bold text-emerald-950 mt-0.5">{highest}</div>
            </div>

            <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl text-center">
              <span className="text-[11px] font-semibold text-rose-700">Thấp nhất</span>
              <div className="text-xl font-bold text-rose-950 mt-0.5">{lowest}</div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <span className="text-[11px] font-semibold text-slate-700">Đã tích điểm</span>
              <div className="text-xl font-bold text-slate-900 mt-0.5">{totalScored}/{students.length}</div>
            </div>
          </div>

          {/* Bar Chart Section */}
          <div className="bg-slate-50/70 border border-slate-200 p-4 rounded-xl space-y-2">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Biểu đồ phân phối phổ điểm theo mức xếp loại
            </h4>

            <div className="h-48 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="range" tick={{ fontSize: 11 }} stroke="#64748b" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#64748b" />
                  <Tooltip 
                    formatter={(value: any) => [`${value} học sinh`, 'Số lượng']}
                    contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #cbd5e1' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Rank Percentages */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <span className="font-semibold text-emerald-900">Giỏi (≥ 8.0):</span>
              <strong className="font-bold text-emerald-900">
                {goodCount} ({totalScored ? Math.round((goodCount / totalScored) * 100) : 0}%)
              </strong>
            </div>

            <div className="p-2.5 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-between">
              <span className="font-semibold text-sky-900">Khá (6.5 - 7.9):</span>
              <strong className="font-bold text-sky-900">
                {fairCount} ({totalScored ? Math.round((fairCount / totalScored) * 100) : 0}%)
              </strong>
            </div>

            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between">
              <span className="font-semibold text-amber-900">Đạt (5.0 - 6.4):</span>
              <strong className="font-bold text-amber-900">
                {passCount} ({totalScored ? Math.round((passCount / totalScored) * 100) : 0}%)
              </strong>
            </div>

            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-between">
              <span className="font-semibold text-rose-900">Cần cố gắng (&lt; 5.0):</span>
              <strong className="font-bold text-rose-900">
                {weakCount} ({totalScored ? Math.round((weakCount / totalScored) * 100) : 0}%)
              </strong>
            </div>
          </div>

          {/* Top Active Students */}
          {bonusStudents.length > 0 && (
            <div className="bg-amber-50/60 border border-amber-200 p-3.5 rounded-xl space-y-2">
              <h5 className="text-xs font-bold text-amber-950 flex items-center gap-1">
                <Award className="w-4 h-4 text-amber-600" />
                Học sinh phát biểu hăng hái nhất tiết học:
              </h5>
              <div className="space-y-1">
                {bonusStudents.map(({ student, bonus, score }) => (
                  <div key={student.id} className="flex items-center justify-between text-xs py-1 px-2 bg-white rounded-md border border-amber-100">
                    <span className="font-semibold text-slate-800">
                      [STT {student.stt}] {student.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-600">+{bonus} điểm cộng</span>
                      {score !== null && <span className="text-slate-500 font-medium">ĐTB: {score.toFixed(1)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition shadow-2xs cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
