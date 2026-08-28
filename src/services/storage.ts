import { Classroom, ClassSession, Student } from '../types';

const STORAGE_KEYS = {
  CLASSES: 'gradebook_classes_v1',
  SESSIONS: 'gradebook_sessions_v1',
  ACTIVE_SESSION_ID: 'gradebook_active_session_id_v1',
  SETTINGS: 'gradebook_settings_v1',
  PENDING_SYNC: 'gradebook_pending_sync_v1',
};

// Initial starter classes & students for realistic testing out of the box
const INITIAL_STUDENTS_10A1: Student[] = [
  { id: 'hs_01', stt: 1, code: 'HS001', name: 'Nguyễn Hoàng An', gender: 'Nam', attendance: 'present' },
  { id: 'hs_02', stt: 2, code: 'HS002', name: 'Trần Thị Ngọc Ánh', gender: 'Nữ', attendance: 'present' },
  { id: 'hs_03', stt: 3, code: 'HS003', name: 'Lê Văn Bình', gender: 'Nam', attendance: 'present' },
  { id: 'hs_04', stt: 4, code: 'HS004', name: 'Phạm Quỳnh Châu', gender: 'Nữ', attendance: 'present' },
  { id: 'hs_05', stt: 5, code: 'HS005', name: 'Vũ Đức Dũng', gender: 'Nam', attendance: 'present' },
  { id: 'hs_06', stt: 6, code: 'HS006', name: 'Đỗ Hải Đăng', gender: 'Nam', attendance: 'present' },
  { id: 'hs_07', stt: 7, code: 'HS007', name: 'Hoàng Thu Giang', gender: 'Nữ', attendance: 'present' },
  { id: 'hs_08', stt: 8, code: 'HS008', name: 'Ngô Minh Hiếu', gender: 'Nam', attendance: 'present' },
  { id: 'hs_09', stt: 9, code: 'HS009', name: 'Bùi Thị Thu Hà', gender: 'Nữ', attendance: 'present' },
  { id: 'hs_10', stt: 10, code: 'HS010', name: 'Đặng Quốc Huy', gender: 'Nam', attendance: 'present' },
  { id: 'hs_11', stt: 11, code: 'HS011', name: 'Dương Khánh Linh', gender: 'Nữ', attendance: 'present' },
  { id: 'hs_12', stt: 12, code: 'HS012', name: 'Lý Gia Minh', gender: 'Nam', attendance: 'present' },
  { id: 'hs_13', stt: 13, code: 'HS013', name: 'Trịnh Phương Nga', gender: 'Nữ', attendance: 'present' },
  { id: 'hs_14', stt: 14, code: 'HS014', name: 'Phan Văn Phong', gender: 'Nam', attendance: 'present' },
  { id: 'hs_15', stt: 15, code: 'HS015', name: 'Võ Minh Quân', gender: 'Nam', attendance: 'present' },
  { id: 'hs_16', stt: 16, code: 'HS016', name: 'Tô Ngọc Quỳnh', gender: 'Nữ', attendance: 'present' },
  { id: 'hs_17', stt: 17, code: 'HS017', name: 'Hồ Công Sơn', gender: 'Nam', attendance: 'present' },
  { id: 'hs_18', stt: 18, code: 'HS018', name: 'Mai Thu Trang', gender: 'Nữ', attendance: 'present' },
  { id: 'hs_19', stt: 19, code: 'HS019', name: 'Đinh Tuấn Tú', gender: 'Nam', attendance: 'present' },
  { id: 'hs_20', stt: 20, code: 'HS020', name: 'Lương Yến Vy', gender: 'Nữ', attendance: 'present' },
];

const INITIAL_CLASSES: Classroom[] = [
  {
    id: 'class_10a1',
    name: '10A1',
    grade: 'Khối 10',
    academicYear: '2025-2026',
    defaultSubject: 'Toán học',
    students: INITIAL_STUDENTS_10A1,
  },
  {
    id: 'class_10a2',
    name: '10A2',
    grade: 'Khối 10',
    academicYear: '2025-2026',
    defaultSubject: 'Toán học',
    students: INITIAL_STUDENTS_10A1.slice(0, 15).map((s, idx) => ({ ...s, id: `hs_10a2_${idx}`, stt: idx + 1 })),
  },
  {
    id: 'class_11b3',
    name: '11B3',
    grade: 'Khối 11',
    academicYear: '2025-2026',
    defaultSubject: 'Vật lí',
    students: INITIAL_STUDENTS_10A1.slice(0, 18).map((s, idx) => ({ ...s, id: `hs_11b3_${idx}`, stt: idx + 1 })),
  },
];

const DEFAULT_SCORE_PAIRS = [
  {
    pairIndex: 1,
    col1Id: 'col_p1_c1',
    col1Name: 'Cột 1 (Miệng/Phát biểu)',
    col2Id: 'col_p1_c2',
    col2Name: 'Cột 2 (15 phút/Bài tập)',
    avgColId: 'col_p1_avg',
    avgColName: 'ĐTB Cặp 1',
  },
  {
    pairIndex: 2,
    col1Id: 'col_p2_c1',
    col1Name: 'Cột 3 (Thực hành/Nhóm)',
    col2Id: 'col_p2_c2',
    col2Name: 'Cột 4 (Kiểm tra tiết)',
    avgColId: 'col_p2_avg',
    avgColName: 'ĐTB Cặp 2',
  },
];

const INITIAL_SESSION: ClassSession = {
  id: 'session_demo_01',
  classId: 'class_10a1',
  className: '10A1',
  grade: 'Khối 10',
  subject: 'Toán học',
  teacherName: 'Thầy Nguyễn Văn Nam',
  lessonTitle: 'Tiết 18: Phương trình bậc hai một ẩn và ứng dụng định lý Vi-ét',
  period: 2,
  date: new Date().toISOString().split('T')[0],
  academicYear: '2025-2026',
  term: 'Học kỳ 1',
  scorePairs: DEFAULT_SCORE_PAIRS,
  studentScores: {
    'hs_01': { studentId: 'hs_01', scores: { 'col_p1_c1': 9, 'col_p1_c2': 8.5, 'col_p2_c1': 10, 'col_p2_c2': 9 }, bonusPoints: 1, comments: 'Phát biểu rất tích cực', badges: ['⭐ Xuất sắc'] },
    'hs_02': { studentId: 'hs_02', scores: { 'col_p1_c1': 8, 'col_p1_c2': 7.5 }, bonusPoints: 0, comments: '', badges: [] },
    'hs_03': { studentId: 'hs_03', scores: { 'col_p1_c1': 6.5, 'col_p1_c2': 7.0 }, bonusPoints: 0, comments: '', badges: [] },
    'hs_04': { studentId: 'hs_04', scores: { 'col_p1_c1': 10, 'col_p1_c2': 9.5 }, bonusPoints: 2, comments: 'Giải bài tập mẫu chuẩn xác', badges: ['⭐ Lớp phó gương mẫu'] },
    'hs_05': { studentId: 'hs_05', scores: { 'col_p1_c1': 5, 'col_p1_c2': 6.0 }, bonusPoints: 0, comments: 'Cần chú ý nghe giảng', badges: [] },
    'hs_06': { studentId: 'hs_06', scores: { 'col_p1_c1': 8.5, 'col_p1_c2': 8.0 }, bonusPoints: 0, comments: '', badges: [] },
    'hs_07': { studentId: 'hs_07', scores: { 'col_p1_c1': 9.0, 'col_p1_c2': 9.0 }, bonusPoints: 1, comments: '', badges: [] },
    'hs_08': { studentId: 'hs_08', scores: { 'col_p1_c1': 7.5, 'col_p1_c2': 8.0 }, bonusPoints: 0, comments: '', badges: [] },
  },
  sessionNotes: 'Lớp học sôi nổi, các em nắm chắc bài. Cần bồi dưỡng thêm cho nhóm học sinh còn yếu phần định lý Vi-ét.',
  syncRoomId: 'A1-TOAN',
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * Storage Helper for Local & Offline First Persistence
 */
export const AppStorage = {
  getClasses(): Classroom[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CLASSES);
      if (data) return JSON.parse(data);
      localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(INITIAL_CLASSES));
      return INITIAL_CLASSES;
    } catch {
      return INITIAL_CLASSES;
    }
  },

  saveClasses(classes: Classroom[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
      this.broadcastLocalChange('CLASSES_UPDATED', classes);
    } catch (e) {
      console.error('Save classes error:', e);
    }
  },

  getSessions(): ClassSession[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (data) return JSON.parse(data);
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify([INITIAL_SESSION]));
      return [INITIAL_SESSION];
    } catch {
      return [INITIAL_SESSION];
    }
  },

  saveSessions(sessions: ClassSession[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
      this.broadcastLocalChange('SESSIONS_UPDATED', sessions);
    } catch (e) {
      console.error('Save sessions error:', e);
    }
  },

  getActiveSession(): ClassSession {
    const sessions = this.getSessions();
    const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION_ID);
    const found = sessions.find(s => s.id === activeId);
    return found || sessions[0] || INITIAL_SESSION;
  },

  saveActiveSession(session: ClassSession): void {
    const sessions = this.getSessions();
    const index = sessions.findIndex(s => s.id === session.id);
    const updated = {
      ...session,
      version: (session.version || 0) + 1,
      updatedAt: new Date().toISOString(),
    };

    if (index >= 0) {
      sessions[index] = updated;
    } else {
      sessions.push(updated);
    }

    this.saveSessions(sessions);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION_ID, updated.id);
    this.broadcastLocalChange('ACTIVE_SESSION_UPDATED', updated);
  },

  createNewSession(classroom: Classroom, subject: string, period: number, title: string): ClassSession {
    const newSession: ClassSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      classId: classroom.id,
      className: classroom.name,
      grade: classroom.grade,
      subject: subject || classroom.defaultSubject || 'Toán học',
      teacherName: 'Giáo viên bộ môn',
      lessonTitle: title || `Tiết ${period}: Bài học mới`,
      period: period || 1,
      date: new Date().toISOString().split('T')[0],
      academicYear: classroom.academicYear || '2025-2026',
      term: 'Học kỳ 1',
      scorePairs: DEFAULT_SCORE_PAIRS,
      studentScores: {},
      sessionNotes: '',
      syncRoomId: `${classroom.name}-${subject}`.replace(/\s+/g, ''),
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.saveActiveSession(newSession);
    return newSession;
  },

  broadcastLocalChange(type: string, payload: any): void {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel('gradebook_sync_channel');
        bc.postMessage({ type, payload, timestamp: Date.now() });
        bc.close();
      } catch (e) {
        // BroadcastChannel might fail in restricted sandbox, ignore
      }
    }
  },
};
