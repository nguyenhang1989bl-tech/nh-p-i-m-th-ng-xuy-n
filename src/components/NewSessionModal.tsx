import React, { useState } from 'react';
import { 
  X, 
  PlusCircle, 
  BookOpen, 
  Calendar, 
  Clock, 
  Check 
} from 'lucide-react';
import { Classroom, ClassSession } from '../types';

interface NewSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: Classroom[];
  activeClass: Classroom;
  onCreateSession: (classroom: Classroom, subject: string, period: number, title: string) => void;
}

export const NewSessionModal: React.FC<NewSessionModalProps> = ({
  isOpen,
  onClose,
  classes,
  activeClass,
  onCreateSession,
}) => {
  const [selectedClassId, setSelectedClassId] = useState(activeClass.id);
  const [subject, setSubject] = useState(activeClass.defaultSubject || 'Toán học');
  const [period, setPeriod] = useState(1);
  const [title, setTitle] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const foundClass = classes.find(c => c.id === selectedClassId) || activeClass;
    onCreateSession(foundClass, subject, Number(period), title);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shadow-xs">
              <PlusCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">
                Tạo Sổ Điểm Tiết Học Mới
              </h3>
              <p className="text-[11px] text-slate-400">
                Khởi tạo bảng điểm cho tiết dạy tiếp theo
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Chọn lớp học:</label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                const cl = classes.find(c => c.id === e.target.value);
                if (cl && cl.defaultSubject) setSubject(cl.defaultSubject);
              }}
              className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  Lớp {c.name} ({c.students?.length || 0} học sinh)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Môn học:</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Toán, Văn, Anh..."
                required
                className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tiết số:</label>
              <input
                type="number"
                min={1}
                max={10}
                value={period}
                onChange={(e) => setPeriod(Number(e.target.value))}
                required
                className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tên bài học / Chủ đề tiết dạy:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Tiết 19: Luyện tập phương trình bậc hai"
              className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-2xs transition active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Bắt đầu tiết học</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
