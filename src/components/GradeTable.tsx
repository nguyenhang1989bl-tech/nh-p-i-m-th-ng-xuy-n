import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Sparkles, 
  Award, 
  Check, 
  AlertCircle, 
  MessageSquare, 
  Trash2,
  HelpCircle,
  TrendingUp,
  UserCheck,
  UserX,
  Clock
} from 'lucide-react';
import { ClassSession, Student, ScorePair, StudentScoreRecord } from '../types';
import { calculatePairAverage, calculateOverallAverage, getGradeRank } from '../utils/excelExport';

interface GradeTableProps {
  session: ClassSession;
  students: Student[];
  onUpdateScore: (studentId: string, columnId: string, value: number | null) => void;
  onUpdateAttendance: (studentId: string, attendance: 'present' | 'absent' | 'late' | 'excused') => void;
  onAddBonus: (studentId: string, amount: number) => void;
  onUpdateComments: (studentId: string, comments: string) => void;
  onOpenKeypadForStudent: (student: Student, columnId: string, columnName: string) => void;
}

export const GradeTable: React.FC<GradeTableProps> = ({
  session,
  students,
  onUpdateScore,
  onUpdateAttendance,
  onAddBonus,
  onUpdateComments,
  onOpenKeypadForStudent,
}) => {
  const [activeCell, setActiveCell] = useState<{ studentIndex: number; columnId: string } | null>(null);
  const [editingCommentStudentId, setEditingCommentStudentId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  // Handle Score input change
  const handleScoreInputChange = (studentId: string, columnId: string, rawVal: string) => {
    if (rawVal.trim() === '') {
      onUpdateScore(studentId, columnId, null);
      return;
    }

    const clean = rawVal.replace(',', '.');
    const num = parseFloat(clean);
    if (!isNaN(num) && num >= 0 && num <= 10) {
      onUpdateScore(studentId, columnId, num);
    }
  };

  // Keyboard navigation handler (Arrow Up/Down, Enter, Tab)
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    studentIndex: number,
    pairIndex: number,
    colIndexInPair: 1 | 2
  ) => {
    const pair = session.scorePairs[pairIndex];
    if (!pair) return;

    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault();
      const nextStudentIdx = Math.min(students.length - 1, studentIndex + 1);
      const targetColId = colIndexInPair === 1 ? pair.col1Id : pair.col2Id;
      const nextInput = document.getElementById(`score_input_${nextStudentIdx}_${targetColId}`);
      if (nextInput) {
        nextInput.focus();
        (nextInput as HTMLInputElement).select();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevStudentIdx = Math.max(0, studentIndex - 1);
      const targetColId = colIndexInPair === 1 ? pair.col1Id : pair.col2Id;
      const prevInput = document.getElementById(`score_input_${prevStudentIdx}_${targetColId}`);
      if (prevInput) {
        prevInput.focus();
        (prevInput as HTMLInputElement).select();
      }
    } else if (e.key === 'ArrowRight') {
      if (colIndexInPair === 1) {
        e.preventDefault();
        const nextInput = document.getElementById(`score_input_${studentIndex}_${pair.col2Id}`);
        if (nextInput) nextInput.focus();
      } else if (pairIndex + 1 < session.scorePairs.length) {
        e.preventDefault();
        const nextPair = session.scorePairs[pairIndex + 1];
        const nextInput = document.getElementById(`score_input_${studentIndex}_${nextPair.col1Id}`);
        if (nextInput) nextInput.focus();
      }
    } else if (e.key === 'ArrowLeft') {
      if (colIndexInPair === 2) {
        e.preventDefault();
        const prevInput = document.getElementById(`score_input_${studentIndex}_${pair.col1Id}`);
        if (prevInput) prevInput.focus();
      } else if (pairIndex > 0) {
        e.preventDefault();
        const prevPair = session.scorePairs[pairIndex - 1];
        const prevInput = document.getElementById(`score_input_${studentIndex}_${prevPair.col2Id}`);
        if (prevInput) prevInput.focus();
      }
    }
  };

  const getAttendanceBadge = (attendance?: string) => {
    switch (attendance) {
      case 'absent':
        return (
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
            <UserX className="w-3 h-3" /> Vắng K.P
          </span>
        );
      case 'excused':
        return (
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3" /> Có phép
          </span>
        );
      case 'late':
        return (
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
            <Clock className="w-3 h-3" /> Đi muộn
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <UserCheck className="w-3 h-3" /> Có mặt
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-2xs border border-slate-200 overflow-hidden">
      {/* Table Toolbar Instructions */}
      <div className="bg-slate-50/70 border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-rose-600" />
            Bảng theo dõi điểm tiết học:
          </span>
          <span className="hidden sm:inline text-slate-500 font-normal">
            (Bấm ô để nhập điểm hoặc bàn phím số nhanh, dùng phím ↑ ↓ ← → Enter để di chuyển ô)
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-md bg-rose-600 border border-rose-700" />
            <span className="font-semibold text-rose-700 text-xs">
              Cột Trung Bình (Bôi đỏ tự động)
            </span>
          </div>
        </div>
      </div>

      {/* Main Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          {/* Grouped Header Rows */}
          <thead>
            {/* Top Super Header for Column Pairs */}
            <tr className="bg-slate-50 text-slate-600 text-[11px] font-semibold uppercase tracking-wider border-b border-slate-200">
              <th colSpan={4} className="py-2 px-3 text-center border-r border-slate-200 bg-slate-100/70">
                Thông tin học sinh
              </th>
              
              {session.scorePairs.map((pair, pIdx) => (
                <th
                  key={`pair_group_${pair.pairIndex}`}
                  colSpan={3}
                  className="py-2 px-3 text-center border-r border-rose-200 bg-rose-50/60 text-rose-900 font-bold"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="bg-rose-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                      {pIdx + 1}
                    </span>
                    <span>CẶP ĐIỂM {pIdx + 1} (Lấy ĐTB bôi đỏ)</span>
                  </div>
                </th>
              ))}

              <th colSpan={3} className="py-2 px-3 text-center bg-indigo-50/50 text-indigo-900 font-semibold">
                Tổng kết tiết
              </th>
            </tr>

            {/* Main Column Header */}
            <tr className="bg-slate-50/50 text-slate-700 text-xs font-semibold border-b border-slate-200">
              {/* Student Info Columns */}
              <th className="py-2.5 px-3 w-12 text-center border-r border-slate-200">STT</th>
              <th className="py-2.5 px-4 min-w-[160px] border-r border-slate-200">Họ và tên</th>
              <th className="py-2.5 px-2 w-16 text-center border-r border-slate-200 hidden md:table-cell">Phái</th>
              <th className="py-2.5 px-3 w-28 text-center border-r border-slate-200">Điểm danh</th>

              {/* Pair Score Columns */}
              {session.scorePairs.map((pair, pIdx) => (
                <React.Fragment key={`pair_cols_${pair.pairIndex}`}>
                  {/* Score 1 */}
                  <th className="py-2.5 px-2 text-center w-24 border-r border-slate-200 bg-white">
                    <div className="truncate font-semibold text-slate-800" title={pair.col1Name}>
                      {pair.col1Name.replace(/\(.*?\)/g, '') || `Cột ${pIdx * 2 + 1}`}
                    </div>
                    <span className="text-[10px] text-slate-400 font-normal">Cột {pIdx * 2 + 1}</span>
                  </th>

                  {/* Score 2 */}
                  <th className="py-2.5 px-2 text-center w-24 border-r border-slate-200 bg-white">
                    <div className="truncate font-semibold text-slate-800" title={pair.col2Name}>
                      {pair.col2Name.replace(/\(.*?\)/g, '') || `Cột ${pIdx * 2 + 2}`}
                    </div>
                    <span className="text-[10px] text-slate-400 font-normal">Cột {pIdx * 2 + 2}</span>
                  </th>

                  {/* Average Column - RED HIGHLIGHT MANDATED BY USER */}
                  <th className="py-2.5 px-2 text-center w-28 border-r border-rose-300 bg-rose-600 text-white shadow-2xs">
                    <div className="flex items-center justify-center gap-1 font-bold text-xs">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>ĐTB CẶP {pIdx + 1}</span>
                    </div>
                    <span className="text-[10px] text-rose-100 font-normal block mt-0.5">
                      (Tự động tính)
                    </span>
                  </th>
                </React.Fragment>
              ))}

              {/* Summary columns */}
              <th className="py-2.5 px-2 text-center w-20 border-r border-slate-200 bg-indigo-50/70 font-bold text-indigo-950">
                ĐTB Chung
              </th>
              <th className="py-2.5 px-2 text-center w-20 border-r border-slate-200 bg-amber-50/70 font-semibold text-amber-950">
                Thưởng (+)
              </th>
              <th className="py-2.5 px-3 min-w-[130px] bg-slate-50/50 text-slate-700">
                Đánh giá / Nhận xét
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-200 text-xs">
            {students.map((student, studentIndex) => {
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
                <tr 
                  key={student.id} 
                  className={`hover:bg-slate-50 transition-colors ${
                    studentIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                  }`}
                >
                  {/* STT */}
                  <td className="py-2.5 px-3 text-center font-semibold text-slate-600 border-r border-slate-200">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
                      {student.stt || studentIndex + 1}
                    </span>
                  </td>

                  {/* Full Name */}
                  <td className="py-2.5 px-4 font-semibold text-slate-900 border-r border-slate-200">
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-semibold ${
                        student.gender === 'Nữ' 
                          ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                          : 'bg-sky-50 text-sky-700 border border-sky-200'
                      }`}>
                        {student.gender === 'Nữ' ? 'F' : 'M'}
                      </div>
                      <span className="tracking-tight hover:text-rose-600 cursor-pointer transition">
                        {student.name}
                      </span>
                    </div>
                  </td>

                  {/* Gender */}
                  <td className="py-2.5 px-2 text-center text-slate-500 border-r border-slate-200 hidden md:table-cell">
                    {student.gender || 'Nam'}
                  </td>

                  {/* Attendance Toggle */}
                  <td className="py-2.5 px-3 text-center border-r border-slate-200">
                    <button
                      onClick={() => {
                        const states: ('present' | 'absent' | 'excused' | 'late')[] = ['present', 'absent', 'excused', 'late'];
                        const curr = student.attendance || 'present';
                        const nextIdx = (states.indexOf(curr) + 1) % states.length;
                        onUpdateAttendance(student.id, states[nextIdx]);
                      }}
                      className="cursor-pointer hover:scale-102 active:scale-98 transition"
                      title="Bấm để chuyển trạng thái: Có mặt / Vắng / Có phép / Muộn"
                    >
                      {getAttendanceBadge(student.attendance)}
                    </button>
                  </td>

                  {/* Score Pairs */}
                  {session.scorePairs.map((pair, pIdx) => {
                    const score1 = record.scores[pair.col1Id];
                    const score2 = record.scores[pair.col2Id];
                    const pairAverage = calculatePairAverage(score1, score2);

                    return (
                      <React.Fragment key={`cell_pair_${pair.pairIndex}_${student.id}`}>
                        {/* Score Column 1 Input */}
                        <td className="py-2 px-2 text-center border-r border-slate-200 bg-white">
                          <div className="relative flex items-center justify-center">
                            <input
                              id={`score_input_${studentIndex}_${pair.col1Id}`}
                              type="text"
                              inputMode="decimal"
                              value={score1 !== null && score1 !== undefined ? score1 : ''}
                              onChange={(e) => handleScoreInputChange(student.id, pair.col1Id, e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, studentIndex, pIdx, 1)}
                              onFocus={() => setActiveCell({ studentIndex, columnId: pair.col1Id })}
                              placeholder="-"
                              className="w-14 text-center font-bold text-sm py-1.5 px-1 rounded-lg border border-slate-200 hover:border-slate-300 focus:ring-1 focus:ring-rose-500 focus:border-rose-500 focus:bg-amber-50/30 text-slate-900 transition"
                            />
                            {/* Keypad open button on hover */}
                            <button
                              onClick={() => onOpenKeypadForStudent(student, pair.col1Id, pair.col1Name)}
                              className="absolute -top-1 -right-1 opacity-0 hover:opacity-100 group-hover:opacity-100 p-0.5 bg-slate-800 text-white rounded-md text-[9px] cursor-pointer"
                              title="Mở bàn phím nhanh"
                            >
                              ⌨️
                            </button>
                          </div>
                        </td>

                        {/* Score Column 2 Input */}
                        <td className="py-2 px-2 text-center border-r border-slate-200 bg-white">
                          <div className="relative flex items-center justify-center">
                            <input
                              id={`score_input_${studentIndex}_${pair.col2Id}`}
                              type="text"
                              inputMode="decimal"
                              value={score2 !== null && score2 !== undefined ? score2 : ''}
                              onChange={(e) => handleScoreInputChange(student.id, pair.col2Id, e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, studentIndex, pIdx, 2)}
                              onFocus={() => setActiveCell({ studentIndex, columnId: pair.col2Id })}
                              placeholder="-"
                              className="w-14 text-center font-bold text-sm py-1.5 px-1 rounded-lg border border-slate-200 hover:border-slate-300 focus:ring-1 focus:ring-rose-500 focus:border-rose-500 focus:bg-amber-50/30 text-slate-900 transition"
                            />
                            <button
                              onClick={() => onOpenKeypadForStudent(student, pair.col2Id, pair.col2Name)}
                              className="absolute -top-1 -right-1 opacity-0 hover:opacity-100 group-hover:opacity-100 p-0.5 bg-slate-800 text-white rounded-md text-[9px] cursor-pointer"
                              title="Mở bàn phím nhanh"
                            >
                              ⌨️
                            </button>
                          </div>
                        </td>

                        {/* RED AVERAGE COLUMN MANDATED BY USER ("cứ 2 cột điểm thì sẽ lấy trung bình để ghi điểm và cột này được bôi đỏ") */}
                        <td className="py-2 px-2 text-center border-r border-rose-200 bg-rose-50/60">
                          {pairAverage !== null ? (
                            <div className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-rose-600 text-white font-bold text-xs shadow-2xs border border-rose-700 animate-in fade-in duration-150">
                              <span>{pairAverage.toFixed(1)}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-rose-300 font-normal italic">
                              Chưa đủ
                            </span>
                          )}
                        </td>
                      </React.Fragment>
                    );
                  })}

                  {/* Overall Average */}
                  <td className="py-2.5 px-2 text-center border-r border-slate-200 bg-indigo-50/40 font-bold text-xs text-indigo-950">
                    {overallAvg !== null ? (
                      <span className={`px-2 py-0.5 rounded-md font-semibold ${
                        overallAvg >= 8 ? 'bg-emerald-100 text-emerald-800' :
                        overallAvg >= 6.5 ? 'bg-sky-100 text-sky-800' :
                        overallAvg >= 5 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {overallAvg.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>

                  {/* Bonus Points */}
                  <td className="py-2.5 px-2 text-center border-r border-slate-200 bg-amber-50/30">
                    <div className="flex items-center justify-center gap-1">
                      {record.bonusPoints > 0 ? (
                        <span className="font-bold text-xs text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-md">
                          +{record.bonusPoints}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">0</span>
                      )}
                      <button
                        onClick={() => onAddBonus(student.id, 1)}
                        className="p-1 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-800 font-semibold text-[10px] transition active:scale-95 cursor-pointer"
                        title="Cộng 1 điểm phát biểu"
                      >
                        +1
                      </button>
                    </div>
                  </td>

                  {/* Comments / Evaluation */}
                  <td className="py-2.5 px-3">
                    {editingCommentStudentId === student.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Nhập nhận xét..."
                          className="w-full text-xs py-1 px-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-rose-500"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              onUpdateComments(student.id, commentText);
                              setEditingCommentStudentId(null);
                            }
                          }}
                        />
                        <button
                          onClick={() => {
                            onUpdateComments(student.id, commentText);
                            setEditingCommentStudentId(null);
                          }}
                          className="p-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-500 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div 
                        onClick={() => {
                          setEditingCommentStudentId(student.id);
                          setCommentText(record.comments || '');
                        }}
                        className="flex items-center justify-between text-xs text-slate-700 cursor-pointer hover:bg-slate-100 p-1 rounded-md transition"
                        title="Bấm để ghi nhận xét"
                      >
                        <div className="flex flex-wrap items-center gap-1">
                          <span className={`px-1.5 py-0.5 rounded-sm text-[10px] font-semibold ${
                            rank === 'Giỏi' ? 'bg-emerald-100 text-emerald-800' :
                            rank === 'Khá' ? 'bg-sky-100 text-sky-800' :
                            rank === 'Đạt / Trung bình' ? 'bg-amber-100 text-amber-800' :
                            rank === 'Cần cố gắng' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {rank}
                          </span>
                          {record.comments && (
                            <span className="truncate max-w-[150px] text-slate-800 font-medium">
                              {record.comments}
                            </span>
                          )}
                        </div>
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
