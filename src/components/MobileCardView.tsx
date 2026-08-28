import React from 'react';
import { 
  Sparkles, 
  Award, 
  UserCheck, 
  UserX, 
  Clock, 
  MessageSquare,
  ChevronRight,
  Plus
} from 'lucide-react';
import { ClassSession, Student, StudentScoreRecord } from '../types';
import { calculatePairAverage, calculateOverallAverage, getGradeRank } from '../utils/excelExport';

interface MobileCardViewProps {
  session: ClassSession;
  students: Student[];
  onOpenKeypadForStudent: (student: Student, columnId: string, columnName: string) => void;
  onUpdateAttendance: (studentId: string, attendance: 'present' | 'absent' | 'late' | 'excused') => void;
  onAddBonus: (studentId: string, amount: number) => void;
}

export const MobileCardView: React.FC<MobileCardViewProps> = ({
  session,
  students,
  onOpenKeypadForStudent,
  onUpdateAttendance,
  onAddBonus,
}) => {
  return (
    <div className="space-y-3 pb-24">
      {students.map((student, index) => {
        const record: StudentScoreRecord = session.studentScores[student.id] || {
          studentId: student.id,
          scores: {},
          bonusPoints: 0,
          comments: '',
          badges: [],
        };

        const overallAvg = calculateOverallAverage(session, student.id);
        const rank = getGradeRank(overallAvg);

        return (
          <div
            key={student.id}
            className="bg-white rounded-xl p-3.5 shadow-2xs border border-slate-200 hover:border-slate-300 transition"
          >
            {/* Top row: STT, Name, Attendance, Overall Grade */}
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-slate-100 font-semibold text-slate-800 text-xs flex items-center justify-center border border-slate-200">
                  {student.stt || index + 1}
                </span>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm leading-tight">
                    {student.name}
                  </h4>
                  <span className="text-[11px] text-slate-400 font-normal">
                    {student.code || `HS${String(student.stt || index + 1).padStart(3, '0')}`} • {student.gender || 'Nam'}
                  </span>
                </div>
              </div>

              {/* Attendance & Overall Average Pill */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    const states: ('present' | 'absent' | 'excused' | 'late')[] = ['present', 'absent', 'excused', 'late'];
                    const curr = student.attendance || 'present';
                    const nextIdx = (states.indexOf(curr) + 1) % states.length;
                    onUpdateAttendance(student.id, states[nextIdx]);
                  }}
                  className="px-2 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 active:scale-95 cursor-pointer"
                >
                  {student.attendance === 'absent' ? '❌ Vắng' : 
                   student.attendance === 'excused' ? '⚠️ Phép' : 
                   student.attendance === 'late' ? '⏰ Muộn' : '✅ Có mặt'}
                </button>

                {overallAvg !== null && (
                  <span className="px-2 py-1 rounded-md text-xs font-bold bg-indigo-100 text-indigo-800">
                    ĐTB: {overallAvg.toFixed(1)}
                  </span>
                )}
              </div>
            </div>

            {/* Score Pairs Grid */}
            <div className="mt-3 space-y-2.5">
              {session.scorePairs.map((pair, pIdx) => {
                const s1 = record.scores[pair.col1Id];
                const s2 = record.scores[pair.col2Id];
                const avg = calculatePairAverage(s1, s2);

                return (
                  <div 
                    key={`mob_pair_${pair.pairIndex}`}
                    className="p-2.5 rounded-lg bg-slate-50/70 border border-slate-200"
                  >
                    <div className="text-[11px] font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span>CẶP ĐIỂM {pIdx + 1}</span>
                      <span className="text-[10px] text-rose-600 font-bold">ĐTB bôi đỏ</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 items-center">
                      {/* Col 1 Button */}
                      <button
                        onClick={() => onOpenKeypadForStudent(student, pair.col1Id, pair.col1Name)}
                        className="flex flex-col items-center justify-center p-2 rounded-lg bg-white border border-slate-200 hover:border-rose-400 active:bg-rose-50 transition shadow-2xs cursor-pointer"
                      >
                        <span className="text-[10px] text-slate-500 font-normal truncate max-w-full">
                          {pair.col1Name.replace(/\(.*?\)/g, '').trim() || `Cột ${pIdx * 2 + 1}`}
                        </span>
                        <span className="text-base font-bold text-slate-900 mt-0.5">
                          {s1 !== null && s1 !== undefined ? s1 : '-'}
                        </span>
                      </button>

                      {/* Col 2 Button */}
                      <button
                        onClick={() => onOpenKeypadForStudent(student, pair.col2Id, pair.col2Name)}
                        className="flex flex-col items-center justify-center p-2 rounded-lg bg-white border border-slate-200 hover:border-rose-400 active:bg-rose-50 transition shadow-2xs cursor-pointer"
                      >
                        <span className="text-[10px] text-slate-500 font-normal truncate max-w-full">
                          {pair.col2Name.replace(/\(.*?\)/g, '').trim() || `Cột ${pIdx * 2 + 2}`}
                        </span>
                        <span className="text-base font-bold text-slate-900 mt-0.5">
                          {s2 !== null && s2 !== undefined ? s2 : '-'}
                        </span>
                      </button>

                      {/* RED AVERAGE BOX MANDATED BY USER */}
                      <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-rose-600 text-white shadow-2xs border border-rose-700">
                        <span className="text-[10px] font-semibold text-rose-100 flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                          ĐTB Cặp
                        </span>
                        <span className="text-base font-bold tracking-wide text-white mt-0.5">
                          {avg !== null ? avg.toFixed(1) : '--'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Row: Bonus points & Remarks */}
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onAddBonus(student.id, 1)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold border border-amber-200 transition cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                  <span>+1 Điểm thưởng</span>
                </button>
                {record.bonusPoints > 0 && (
                  <span className="font-bold text-amber-600">
                    (+{record.bonusPoints})
                  </span>
                )}
              </div>

              {record.comments && (
                <span className="text-slate-500 text-[11px] truncate max-w-[150px] font-medium">
                  💬 {record.comments}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
