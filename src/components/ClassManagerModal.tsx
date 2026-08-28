import React, { useState } from 'react';
import { 
  X, 
  Users, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  UserPlus, 
  Clipboard,
  BookOpen,
  GraduationCap
} from 'lucide-react';
import { Classroom, Student } from '../types';

interface ClassManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: Classroom[];
  activeClass: Classroom;
  onSelectClass: (c: Classroom) => void;
  onSaveClasses: (classes: Classroom[]) => void;
}

export const ClassManagerModal: React.FC<ClassManagerModalProps> = ({
  isOpen,
  onClose,
  classes,
  activeClass,
  onSelectClass,
  onSaveClasses,
}) => {
  const [selectedClassId, setSelectedClassId] = useState(activeClass.id);
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState('Khối 10');
  const [newClassSubject, setNewClassSubject] = useState('Toán học');

  // Single student add
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentGender, setNewStudentGender] = useState<'Nam' | 'Nữ'>('Nam');

  // Batch paste students
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchText, setBatchText] = useState('');

  if (!isOpen) return null;

  const currentClass = classes.find(c => c.id === selectedClassId) || activeClass;

  const handleCreateClass = () => {
    if (!newClassName.trim()) return;
    const newClass: Classroom = {
      id: `class_${Date.now()}`,
      name: newClassName.trim(),
      grade: newClassGrade,
      academicYear: '2025-2026',
      defaultSubject: newClassSubject,
      students: [
        { id: `hs_${Date.now()}_1`, stt: 1, name: 'Học sinh mẫu 1', gender: 'Nam', attendance: 'present' },
        { id: `hs_${Date.now()}_2`, stt: 2, name: 'Học sinh mẫu 2', gender: 'Nữ', attendance: 'present' },
      ],
    };

    const updated = [...classes, newClass];
    onSaveClasses(updated);
    setSelectedClassId(newClass.id);
    onSelectClass(newClass);
    setIsAddingClass(false);
    setNewClassName('');
  };

  const handleDeleteClass = (classId: string) => {
    if (classes.length <= 1) {
      alert('Phải giữ lại ít nhất 1 lớp học.');
      return;
    }
    if (confirm('Bạn có chắc chắn muốn xóa lớp này và danh sách học sinh?')) {
      const updated = classes.filter(c => c.id !== classId);
      onSaveClasses(updated);
      setSelectedClassId(updated[0].id);
      onSelectClass(updated[0]);
    }
  };

  const handleAddSingleStudent = () => {
    if (!newStudentName.trim()) return;
    const maxStt = currentClass.students.reduce((max, s) => Math.max(max, s.stt || 0), 0);
    const newStudent: Student = {
      id: `std_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      stt: maxStt + 1,
      code: `HS${String(maxStt + 1).padStart(3, '0')}`,
      name: newStudentName.trim(),
      gender: newStudentGender,
      attendance: 'present',
    };

    const updatedStudents = [...currentClass.students, newStudent];
    const updatedClasses = classes.map(c => c.id === currentClass.id ? { ...c, students: updatedStudents } : c);
    onSaveClasses(updatedClasses);
    setNewStudentName('');
  };

  const handleDeleteStudent = (studentId: string) => {
    const updatedStudents = currentClass.students
      .filter(s => s.id !== studentId)
      .map((s, idx) => ({ ...s, stt: idx + 1 })); // Re-number STT

    const updatedClasses = classes.map(c => c.id === currentClass.id ? { ...c, students: updatedStudents } : c);
    onSaveClasses(updatedClasses);
  };

  const handleBatchImport = () => {
    if (!batchText.trim()) return;
    const lines = batchText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const startStt = currentClass.students.length + 1;

    const newStudents: Student[] = lines.map((line, idx) => {
      // Check if line contains gender (e.g. "Nguyễn Văn A - Nam" or "Trần Thị B (Nữ)")
      let name = line;
      let gender: 'Nam' | 'Nữ' = 'Nam';
      if (line.toLowerCase().includes('nữ') || line.toLowerCase().includes('nu')) {
        gender = 'Nữ';
        name = line.replace(/[\(\[\-\,]\s*nữ\s*[\)\]]?/gi, '').trim();
      } else if (line.toLowerCase().includes('nam')) {
        name = line.replace(/[\(\[\-\,]\s*nam\s*[\)\]]?/gi, '').trim();
      }

      // Remove leading numbers like "1. Nguyễn Văn A"
      name = name.replace(/^\d+[\.\,\-\s]+/, '').trim();

      return {
        id: `std_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 4)}`,
        stt: startStt + idx,
        code: `HS${String(startStt + idx).padStart(3, '0')}`,
        name: name || `Học sinh ${startStt + idx}`,
        gender,
        attendance: 'present',
      };
    });

    const updatedStudents = [...currentClass.students, ...newStudents];
    const updatedClasses = classes.map(c => c.id === currentClass.id ? { ...c, students: updatedStudents } : c);
    onSaveClasses(updatedClasses);
    setBatchText('');
    setIsBatchMode(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center shadow-xs">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">
                Quản Lý Danh Sách Lớp & Học Sinh
              </h3>
              <p className="text-[11px] text-slate-400">
                Thêm lớp học, cập nhật danh sách và sĩ số
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
          {/* Class Selector / Creator Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
            <div className="flex flex-wrap items-center gap-1.5">
              {classes.map(c => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedClassId(c.id);
                    onSelectClass(c);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                    selectedClassId === c.id
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Lớp {c.name} ({c.students?.length || 0})</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsAddingClass(!isAddingClass)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm lớp mới</span>
            </button>
          </div>

          {/* New Class Form */}
          {isAddingClass && (
            <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 space-y-3">
              <h4 className="text-xs font-bold text-emerald-900">Tạo lớp học mới:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="Tên lớp (ví dụ: 10A3)"
                  className="text-xs font-medium px-2.5 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <select
                  value={newClassGrade}
                  onChange={(e) => setNewClassGrade(e.target.value)}
                  className="text-xs font-medium px-2 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Khối 10">Khối 10</option>
                  <option value="Khối 11">Khối 11</option>
                  <option value="Khối 12">Khối 12</option>
                  <option value="Khối 9">Khối 9</option>
                  <option value="Khối 8">Khối 8</option>
                  <option value="Khối 7">Khối 7</option>
                  <option value="Khối 6">Khối 6</option>
                </select>
                <input
                  type="text"
                  value={newClassSubject}
                  onChange={(e) => setNewClassSubject(e.target.value)}
                  placeholder="Môn dạy (Toán, Văn...)"
                  className="text-xs font-medium px-2.5 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsAddingClass(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCreateClass}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer shadow-2xs"
                >
                  Tạo lớp ngay
                </button>
              </div>
            </div>
          )}

          {/* Current Class Header */}
          <div className="flex items-center justify-between bg-slate-50/70 p-3 rounded-xl border border-slate-200">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                Danh sách học sinh lớp {currentClass.name}
              </h4>
              <p className="text-xs text-slate-500 font-normal">
                Sĩ số hiện tại: <strong>{currentClass.students.length} học sinh</strong> • Môn: {currentClass.defaultSubject || 'Toán học'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsBatchMode(!isBatchMode)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium transition cursor-pointer"
              >
                <Clipboard className="w-3.5 h-3.5 text-cyan-600" />
                <span>Dán danh sách nhiều HS</span>
              </button>

              {classes.length > 1 && (
                <button
                  onClick={() => handleDeleteClass(currentClass.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition cursor-pointer"
                  title="Xóa lớp này"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Batch Paste Input Box */}
          {isBatchMode && (
            <div className="bg-cyan-50/50 p-4 rounded-xl border border-cyan-200 space-y-2">
              <h5 className="text-xs font-bold text-cyan-950 flex items-center gap-1">
                <Clipboard className="w-4 h-4 text-cyan-600" />
                Dán danh sách tên học sinh (mỗi học sinh 1 dòng):
              </h5>
              <textarea
                rows={5}
                value={batchText}
                onChange={(e) => setBatchText(e.target.value)}
                placeholder={"Nguyễn Văn A - Nam\nTrần Thị B - Nữ\nLê Hoàng C\n..."}
                className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsBatchMode(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  onClick={handleBatchImport}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold cursor-pointer shadow-2xs"
                >
                  Thêm tất cả vào lớp
                </button>
              </div>
            </div>
          )}

          {/* Single Student Add Row */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newStudentName}
              onChange={(e) => setNewStudentName(e.target.value)}
              placeholder="Nhập họ và tên học sinh mới..."
              className="flex-1 text-xs font-medium px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddSingleStudent();
              }}
            />
            <select
              value={newStudentGender}
              onChange={(e) => setNewStudentGender(e.target.value as any)}
              className="text-xs font-medium px-2.5 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
            </select>
            <button
              onClick={handleAddSingleStudent}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition shadow-2xs cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Thêm HS</span>
            </button>
          </div>

          {/* Students List Display */}
          <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3 w-12 text-center">STT</th>
                  <th className="py-2 px-3">Họ và tên</th>
                  <th className="py-2 px-2 w-16 text-center">Giới tính</th>
                  <th className="py-2 px-2 w-10 text-center">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentClass.students.map((student, idx) => (
                  <tr key={student.id} className="hover:bg-slate-50/70">
                    <td className="py-2 px-3 text-center font-bold text-slate-500">{student.stt || idx + 1}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800">{student.name}</td>
                    <td className="py-2 px-2 text-center text-slate-600">{student.gender || 'Nam'}</td>
                    <td className="py-2 px-2 text-center">
                      <button
                        onClick={() => handleDeleteStudent(student.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition cursor-pointer"
                        title="Xóa học sinh"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
