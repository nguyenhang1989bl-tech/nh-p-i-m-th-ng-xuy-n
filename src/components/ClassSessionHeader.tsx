import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  UserCheck, 
  UserX, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Sparkles,
  Info,
  Layers
} from 'lucide-react';
import { ClassSession, Student } from '../types';

interface ClassSessionHeaderProps {
  session: ClassSession;
  students: Student[];
  onUpdateSession: (updated: ClassSession) => void;
  onAddScorePair: () => void;
  onRemoveScorePair: (pairIndex: number) => void;
}

export const ClassSessionHeader: React.FC<ClassSessionHeaderProps> = ({
  session,
  students,
  onUpdateSession,
  onAddScorePair,
  onRemoveScorePair,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(session.lessonTitle);
  const [editSubject, setEditSubject] = useState(session.subject);
  const [editPeriod, setEditPeriod] = useState(session.period);
  const [editDate, setEditDate] = useState(session.date);
  const [editTeacher, setEditTeacher] = useState(session.teacherName);
  const [editTerm, setEditTerm] = useState(session.term);

  const handleSave = () => {
    onUpdateSession({
      ...session,
      lessonTitle: editTitle,
      subject: editSubject,
      period: Number(editPeriod),
      date: editDate,
      teacherName: editTeacher,
      term: editTerm as any,
    });
    setIsEditing(false);
  };

  // Stats calculation
  const totalStudents = students.length;
  const presentCount = students.filter(s => !s.attendance || s.attendance === 'present').length;
  const absentCount = students.filter(s => s.attendance === 'absent' || s.attendance === 'excused').length;
  
  // Count students with at least 1 score
  const scoredCount = students.filter(s => {
    const rec = session.studentScores[s.id];
    if (!rec || !rec.scores) return false;
    return Object.values(rec.scores).some(v => v !== null && v !== undefined && v !== '');
  }).length;

  const scoreProgressPercent = totalStudents > 0 ? Math.round((scoredCount / totalStudents) * 100) : 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs">
      <div className="p-4 sm:p-5">
        {isEditing ? (
          /* Edit Mode */
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-rose-600" />
                Chỉnh sửa thông tin tiết học
              </h3>
              <button
                onClick={handleSave}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-2xs transition cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Lưu thay đổi
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Tên bài học / Chủ đề:</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  placeholder="Nhập tên bài học..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Môn học:</label>
                <input
                  type="text"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Tiết số:</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={editPeriod}
                    onChange={(e) => setEditPeriod(Number(e.target.value))}
                    className="w-full text-xs font-medium border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Học kỳ:</label>
                  <select
                    value={editTerm}
                    onChange={(e) => setEditTerm(e.target.value as any)}
                    className="w-full text-xs font-medium border border-slate-300 rounded-lg px-2 py-1.5 bg-white focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="Học kỳ 1">Học kỳ 1</option>
                    <option value="Học kỳ 2">Học kỳ 2</option>
                    <option value="Cả năm">Cả năm</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Ngày dạy:</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Giáo viên:</label>
                <input
                  type="text"
                  value={editTeacher}
                  onChange={(e) => setEditTeacher(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>
          </div>
        ) : (
          /* View Mode */
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left: Lesson title & badges */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-900 text-white">
                  Lớp {session.className}
                </span>
                <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                  {session.subject}
                </span>
                <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                  Tiết {session.period}
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-500 font-normal">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {new Date(session.date).toLocaleDateString('vi-VN')}
                </span>
                <span className="text-xs text-slate-500 font-normal">
                  • GV: <strong className="text-slate-700 font-semibold">{session.teacherName}</strong>
                </span>

                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  title="Sửa thông tin tiết học"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                {session.lessonTitle || `Tiết ${session.period}: Chưa có tên bài học`}
              </h2>

              {/* Requirement Rule Highlight Banner */}
              <div className="flex items-center gap-1.5 text-xs text-rose-800 bg-rose-50/80 border border-rose-200 rounded-lg px-2.5 py-1 w-fit">
                <Sparkles className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>
                  Quy tắc: <strong>Cứ 2 cột điểm</strong> tự động lấy trung bình ghi vào <strong>Cột ĐTB bôi đỏ</strong>.
                </span>
              </div>
            </div>

            {/* Right: Quick Attendance & Scoring Progress */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Attendance & Progress Pills */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 p-1.5 rounded-xl">
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 font-medium shadow-2xs">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Có mặt: <strong>{presentCount}/{totalStudents}</strong></span>
                </div>

                {absentCount > 0 && (
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium">
                    <UserX className="w-3.5 h-3.5 text-amber-600" />
                    <span>Vắng: <strong>{absentCount}</strong></span>
                  </div>
                )}

                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-800 shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Đã tích điểm: <strong>{scoredCount}/{totalStudents}</strong></span>
                  <div className="w-12 bg-slate-100 rounded-full h-1.5 ml-1 overflow-hidden border border-slate-200">
                    <div 
                      className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500" 
                      style={{ width: `${scoreProgressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Pair Column Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onAddScorePair}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition shadow-2xs active:scale-95 cursor-pointer"
                  title="Thêm 2 cột điểm mới và 1 cột trung bình bôi đỏ"
                >
                  <Plus className="w-3.5 h-3.5 text-rose-600" />
                  <span>+ Cặp Cột Điểm</span>
                </button>

                {session.scorePairs.length > 1 && (
                  <button
                    onClick={() => onRemoveScorePair(session.scorePairs.length)}
                    className="p-1.5 rounded-lg bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 border border-slate-200 transition cursor-pointer"
                    title="Xóa cặp cột điểm cuối cùng"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
