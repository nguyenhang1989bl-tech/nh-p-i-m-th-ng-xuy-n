import React, { useState, useEffect, useCallback } from 'react';
import { 
  Mic, 
  FileSpreadsheet, 
  Keyboard, 
  Smartphone, 
  Plus, 
  Sparkles,
  Wifi,
  WifiOff,
  BarChart3,
  Award,
  BookOpen
} from 'lucide-react';

import { Classroom, ClassSession, Student, SyncState, VoiceParsedCommand } from './types';
import { AppStorage } from './services/storage';
import { Navbar } from './components/Navbar';
import { ClassSessionHeader } from './components/ClassSessionHeader';
import { GradeTable } from './components/GradeTable';
import { MobileCardView } from './components/MobileCardView';
import { QuickKeypadModal } from './components/QuickKeypadModal';
import { VoiceGradeModal } from './components/VoiceGradeModal';
import { ExcelManagerModal } from './components/ExcelManagerModal';
import { ClassManagerModal } from './components/ClassManagerModal';
import { AnalyticsModal } from './components/AnalyticsModal';
import { DeviceSyncModal } from './components/DeviceSyncModal';
import { NewSessionModal } from './components/NewSessionModal';

export default function App() {
  // 1. Core State
  const [classes, setClasses] = useState<Classroom[]>(() => AppStorage.getClasses());
  const [activeClass, setActiveClass] = useState<Classroom>(() => {
    const cls = AppStorage.getClasses();
    return cls[0];
  });
  const [activeSession, setActiveSession] = useState<ClassSession>(() => AppStorage.getActiveSession());
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // 2. Modals state
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isExcelOpen, setIsExcelOpen] = useState(false);
  const [isClassManagerOpen, setIsClassManagerOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);

  // Keypad Modal
  const [keypadState, setKeypadState] = useState<{
    isOpen: boolean;
    student: Student | null;
    columnId: string;
    columnName: string;
  }>({
    isOpen: false,
    student: null,
    columnId: 'col_p1_c1',
    columnName: 'Cột 1',
  });

  // 3. Online & Sync State
  const [syncState, setSyncState] = useState<SyncState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    lastSyncedAt: new Date().toLocaleTimeString('vi-VN'),
    pendingCount: 0,
    isSyncing: false,
    syncRoomId: activeSession.syncRoomId || '10A1-TOAN',
  });

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warn' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'warn' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Monitor network online/offline
  useEffect(() => {
    const handleOnline = () => {
      setSyncState(prev => ({ ...prev, isOnline: true }));
      showToast('Đã khôi phục kết nối mạng. Đang đồng bộ...', 'info');
      handleTriggerSync();
    };
    const handleOffline = () => {
      setSyncState(prev => ({ ...prev, isOnline: false }));
      showToast('Đã chuyển sang chế độ Ngoại tuyến (Offline). Điểm số được lưu an toàn.', 'warn');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // BroadcastChannel listener for multi-tab sync
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel('gradebook_sync_channel');
        bc.onmessage = (event) => {
          if (event.data?.type === 'ACTIVE_SESSION_UPDATED') {
            setActiveSession(event.data.payload);
          } else if (event.data?.type === 'CLASSES_UPDATED') {
            setClasses(event.data.payload);
          }
        };
        return () => {
          bc.close();
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
        };
      } catch (e) {}
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check URL query for room ID (e.g. ?room=10A1)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const room = urlParams.get('room');
      if (room) {
        setSyncState(prev => ({ ...prev, syncRoomId: room.toUpperCase() }));
        handlePullRemoteSync(room.toUpperCase());
      }
    }
  }, []);

  // Sync active class with session
  const currentStudents = activeClass.students || [];

  // Update session and persist to storage
  const handleUpdateSession = useCallback((updated: ClassSession) => {
    setActiveSession(updated);
    AppStorage.saveActiveSession(updated);

    // If online, push to sync room
    if (navigator.onLine && updated.syncRoomId) {
      fetch(`/api/sync/room/${updated.syncRoomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session: updated }),
      }).catch(() => {});
    }
  }, []);

  // Add Score Pair (Cột 1 & 2 -> TB1 bôi đỏ, Cột 3 & 4 -> TB2 bôi đỏ...)
  const handleAddScorePair = () => {
    const nextPairIdx = activeSession.scorePairs.length + 1;
    const colAIdx = (nextPairIdx - 1) * 2 + 1;
    const colBIdx = (nextPairIdx - 1) * 2 + 2;

    const newPair = {
      pairIndex: nextPairIdx,
      col1Id: `col_p${nextPairIdx}_c1`,
      col1Name: `Cột ${colAIdx} (Đánh giá thường xuyên)`,
      col2Id: `col_p${nextPairIdx}_c2`,
      col2Name: `Cột ${colBIdx} (Kiểm tra/Thực hành)`,
      avgColId: `col_p${nextPairIdx}_avg`,
      avgColName: `ĐTB Cặp ${nextPairIdx}`,
    };

    const updated: ClassSession = {
      ...activeSession,
      scorePairs: [...activeSession.scorePairs, newPair],
    };
    handleUpdateSession(updated);
    showToast(`Đã thêm Cặp Cột Điểm ${nextPairIdx} và Cột ĐTB bôi đỏ.`);
  };

  const handleRemoveScorePair = (pairIndex: number) => {
    if (activeSession.scorePairs.length <= 1) return;
    const updated: ClassSession = {
      ...activeSession,
      scorePairs: activeSession.scorePairs.filter(p => p.pairIndex !== pairIndex),
    };
    handleUpdateSession(updated);
    showToast(`Đã xóa Cặp Cột Điểm ${pairIndex}.`);
  };

  // Update specific score cell
  const handleUpdateScore = (studentId: string, columnId: string, value: number | null) => {
    const studentRecords = { ...activeSession.studentScores };
    const currentRec = studentRecords[studentId] || {
      studentId,
      scores: {},
      bonusPoints: 0,
      comments: '',
      badges: [],
    };

    studentRecords[studentId] = {
      ...currentRec,
      scores: {
        ...currentRec.scores,
        [columnId]: value,
      },
    };

    handleUpdateSession({
      ...activeSession,
      studentScores: studentRecords,
    });
  };

  // Update attendance
  const handleUpdateAttendance = (studentId: string, attendance: 'present' | 'absent' | 'late' | 'excused') => {
    const updatedStudents = activeClass.students.map(s => s.id === studentId ? { ...s, attendance } : s);
    const updatedClass = { ...activeClass, students: updatedStudents };
    const updatedClasses = classes.map(c => c.id === activeClass.id ? updatedClass : c);
    
    setClasses(updatedClasses);
    setActiveClass(updatedClass);
    AppStorage.saveClasses(updatedClasses);
  };

  // Add Bonus Points
  const handleAddBonus = (studentId: string, amount: number) => {
    const studentRecords = { ...activeSession.studentScores };
    const currentRec = studentRecords[studentId] || {
      studentId,
      scores: {},
      bonusPoints: 0,
      comments: '',
      badges: [],
    };

    studentRecords[studentId] = {
      ...currentRec,
      bonusPoints: (currentRec.bonusPoints || 0) + amount,
    };

    handleUpdateSession({
      ...activeSession,
      studentScores: studentRecords,
    });
    showToast(`Đã cộng +${amount} điểm phát biểu cho học sinh.`);
  };

  // Update Comments
  const handleUpdateComments = (studentId: string, comments: string) => {
    const studentRecords = { ...activeSession.studentScores };
    const currentRec = studentRecords[studentId] || {
      studentId,
      scores: {},
      bonusPoints: 0,
      comments: '',
      badges: [],
    };

    studentRecords[studentId] = {
      ...currentRec,
      comments,
    };

    handleUpdateSession({
      ...activeSession,
      studentScores: studentRecords,
    });
  };

  // Apply Voice Command
  const handleApplyVoiceCommand = (cmd: VoiceParsedCommand) => {
    // 1. Locate student
    let targetStudent: Student | undefined;
    if (cmd.studentStt !== undefined) {
      targetStudent = currentStudents.find(s => s.stt === cmd.studentStt);
    } else if (cmd.studentName) {
      targetStudent = currentStudents.find(s => s.name.toLowerCase().includes(cmd.studentName!.toLowerCase()));
    } else if (keypadState.student) {
      targetStudent = keypadState.student;
    }

    if (!targetStudent && cmd.action !== 'unknown') {
      showToast(`Không tìm thấy học sinh số ${cmd.studentStt || cmd.studentName}`, 'warn');
      return;
    }

    if (!targetStudent) return;

    // 2. Locate column ID
    let targetColId = activeSession.scorePairs[0]?.col1Id || 'col_p1_c1';
    if (cmd.columnIndex) {
      const pairIdx = Math.floor((cmd.columnIndex - 1) / 2);
      const isCol2 = (cmd.columnIndex - 1) % 2 === 1;
      const pair = activeSession.scorePairs[pairIdx] || activeSession.scorePairs[0];
      if (pair) {
        targetColId = isCol2 ? pair.col2Id : pair.col1Id;
      }
    }

    // 3. Apply action
    if (cmd.action === 'set_score' && cmd.score !== undefined) {
      handleUpdateScore(targetStudent.id, targetColId, cmd.score);
      showToast(`🎙️ Đã nhập ${cmd.score} điểm cho ${targetStudent.name}`);
    } else if (cmd.action === 'add_bonus') {
      handleAddBonus(targetStudent.id, cmd.score || 1);
    } else if (cmd.action === 'sub_bonus') {
      handleAddBonus(targetStudent.id, -(cmd.score || 1));
    } else if (cmd.action === 'set_attendance' && cmd.attendance) {
      handleUpdateAttendance(targetStudent.id, cmd.attendance);
      showToast(`🎙️ Đã điểm danh ${targetStudent.name}: ${cmd.attendance}`);
    }
  };

  // Pull remote sync room
  const handlePullRemoteSync = async (roomId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/sync/room/${roomId}`);
      if (!res.ok) return false;
      const data = await res.json();
      if (data.success && data.session) {
        setActiveSession(data.session);
        AppStorage.saveActiveSession(data.session);
        showToast(`Đã đồng bộ dữ liệu từ phòng ${roomId}`);
        return true;
      }
    } catch (e) {}
    return false;
  };

  // Trigger manual sync
  const handleTriggerSync = async () => {
    setSyncState(prev => ({ ...prev, isSyncing: true }));
    try {
      if (activeSession.syncRoomId) {
        await fetch(`/api/sync/room/${activeSession.syncRoomId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session: activeSession }),
        });
      }
      setSyncState(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncedAt: new Date().toLocaleTimeString('vi-VN'),
      }));
      showToast('Đồng bộ thành công.');
    } catch (e) {
      setSyncState(prev => ({ ...prev, isSyncing: false }));
    }
  };

  // Class changes
  const handleSelectClass = (cls: Classroom) => {
    setActiveClass(cls);
    // Find or create session for this class
    const sessions = AppStorage.getSessions();
    const existing = sessions.find(s => s.classId === cls.id);
    if (existing) {
      setActiveSession(existing);
      AppStorage.saveActiveSession(existing);
    } else {
      const newSess = AppStorage.createNewSession(cls, cls.defaultSubject || 'Toán học', 1, `Tiết 1: ${cls.defaultSubject || 'Bài học'}`);
      setActiveSession(newSess);
    }
  };

  const handleSaveClasses = (updatedClasses: Classroom[]) => {
    setClasses(updatedClasses);
    const curr = updatedClasses.find(c => c.id === activeClass.id) || updatedClasses[0];
    setActiveClass(curr);
    AppStorage.saveClasses(updatedClasses);
  };

  // Import students from Excel
  const handleImportStudents = (newStudents: Student[]) => {
    const updatedClass = {
      ...activeClass,
      students: newStudents,
    };
    const updatedClasses = classes.map(c => c.id === activeClass.id ? updatedClass : c);
    setClasses(updatedClasses);
    setActiveClass(updatedClass);
    AppStorage.saveClasses(updatedClasses);
    showToast(`Đã nhập danh sách ${newStudents.length} học sinh thành công.`);
  };

  // Start new session
  const handleCreateNewSession = (classroom: Classroom, subject: string, period: number, title: string) => {
    const newSession = AppStorage.createNewSession(classroom, subject, period, title);
    setActiveSession(newSession);
    setActiveClass(classroom);
    showToast(`Đã bắt đầu tiết ${period}: ${title}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-rose-500 selection:text-white font-sans text-slate-900">
      {/* Top Navbar */}
      <Navbar
        classes={classes}
        activeClass={activeClass}
        onSelectClass={handleSelectClass}
        activeSession={activeSession}
        syncState={syncState}
        onTriggerSync={handleTriggerSync}
        onOpenVoice={() => setIsVoiceOpen(true)}
        onOpenExcel={() => setIsExcelOpen(true)}
        onOpenClassManager={() => setIsClassManagerOpen(true)}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenNewSessionModal={() => setIsNewSessionModalOpen(true)}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-6 space-y-4">
        {/* Session Info Header */}
        <ClassSessionHeader
          session={activeSession}
          students={currentStudents}
          onUpdateSession={handleUpdateSession}
          onAddScorePair={handleAddScorePair}
          onRemoveScorePair={handleRemoveScorePair}
        />

        {/* View Selection: Table (Desktop) vs Card (Mobile) */}
        {viewMode === 'table' ? (
          <GradeTable
            session={activeSession}
            students={currentStudents}
            onUpdateScore={handleUpdateScore}
            onUpdateAttendance={handleUpdateAttendance}
            onAddBonus={handleAddBonus}
            onUpdateComments={handleUpdateComments}
            onOpenKeypadForStudent={(std, colId, colName) => {
              setKeypadState({
                isOpen: true,
                student: std,
                columnId: colId,
                columnName: colName,
              });
            }}
          />
        ) : (
          <MobileCardView
            session={activeSession}
            students={currentStudents}
            onOpenKeypadForStudent={(std, colId, colName) => {
              setKeypadState({
                isOpen: true,
                student: std,
                columnId: colId,
                columnName: colName,
              });
            }}
            onUpdateAttendance={handleUpdateAttendance}
            onAddBonus={handleAddBonus}
          />
        )}
      </main>

      {/* Floating Bottom Action Bar for Fast Mobile Access */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-slate-900/95 backdrop-blur-md text-white px-3 py-2 rounded-2xl shadow-xl border border-slate-800">
        <button
          onClick={() => setIsVoiceOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer"
          title="Nói điểm bằng giọng nói"
        >
          <Mic className="w-3.5 h-3.5 animate-pulse" />
          <span>Nói Điểm</span>
        </button>

        <button
          onClick={() => {
            const first = currentStudents[0];
            if (first) {
              setKeypadState({
                isOpen: true,
                student: first,
                columnId: activeSession.scorePairs[0]?.col1Id || 'col_p1_c1',
                columnName: activeSession.scorePairs[0]?.col1Name || 'Cột 1',
              });
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition active:scale-95 cursor-pointer"
          title="Bật bàn phím tích điểm nhanh"
        >
          <Keyboard className="w-3.5 h-3.5 text-amber-400" />
          <span>Phím Số</span>
        </button>

        <button
          onClick={() => setIsExcelOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs transition active:scale-95 cursor-pointer"
          title="Xuất file Excel"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Excel</span>
        </button>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-20 right-4 z-50 px-4 py-2.5 rounded-xl shadow-lg border text-xs font-semibold transition-all animate-in slide-in-from-bottom-3 duration-200 flex items-center gap-2 ${
          toast.type === 'success' ? 'bg-slate-900 text-emerald-400 border-slate-700' :
          toast.type === 'warn' ? 'bg-amber-950 text-amber-300 border-amber-800' : 'bg-slate-900 text-sky-400 border-slate-700'
        }`}>
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Modals */}
      <QuickKeypadModal
        isOpen={keypadState.isOpen}
        onClose={() => setKeypadState(prev => ({ ...prev, isOpen: false }))}
        student={keypadState.student}
        columnId={keypadState.columnId}
        columnName={keypadState.columnName}
        session={activeSession}
        students={currentStudents}
        onSelectStudent={(std) => setKeypadState(prev => ({ ...prev, student: std }))}
        onSelectColumn={(colId, colName) => setKeypadState(prev => ({ ...prev, columnId: colId, columnName: colName }))}
        onUpdateScore={handleUpdateScore}
      />

      <VoiceGradeModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        session={activeSession}
        students={currentStudents}
        onApplyVoiceCommand={handleApplyVoiceCommand}
      />

      <ExcelManagerModal
        isOpen={isExcelOpen}
        onClose={() => setIsExcelOpen(false)}
        session={activeSession}
        students={currentStudents}
        onImportStudents={handleImportStudents}
      />

      <ClassManagerModal
        isOpen={isClassManagerOpen}
        onClose={() => setIsClassManagerOpen(false)}
        classes={classes}
        activeClass={activeClass}
        onSelectClass={handleSelectClass}
        onSaveClasses={handleSaveClasses}
      />

      <AnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        session={activeSession}
        students={currentStudents}
      />

      <DeviceSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        session={activeSession}
        syncState={syncState}
        onUpdateRoomId={(newRoom) => {
          setSyncState(prev => ({ ...prev, syncRoomId: newRoom }));
          handleUpdateSession({ ...activeSession, syncRoomId: newRoom });
        }}
        onTriggerSync={handleTriggerSync}
        onPullRemoteSync={handlePullRemoteSync}
      />

      <NewSessionModal
        isOpen={isNewSessionModalOpen}
        onClose={() => setIsNewSessionModalOpen(false)}
        classes={classes}
        activeClass={activeClass}
        onCreateSession={handleCreateNewSession}
      />
    </div>
  );
}
