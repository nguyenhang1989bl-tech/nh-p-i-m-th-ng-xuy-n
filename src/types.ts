export interface Student {
  id: string;
  stt: number;
  code?: string;
  name: string;
  gender?: 'Nam' | 'Nữ';
  dob?: string;
  notes?: string;
  attendance?: 'present' | 'absent' | 'late' | 'excused';
}

export interface ScoreColumn {
  id: string;
  name: string;
  shortName: string;
  type: 'regular' | 'pair_average' | 'final_average';
  pairIndex?: number; // 1 for pair 1 (col 1 + 2), 2 for pair 2 (col 3 + 4), etc.
  subIndex?: 1 | 2; // 1 for first in pair, 2 for second in pair
  isRedAverage?: boolean;
}

export interface ScorePair {
  pairIndex: number;
  col1Id: string;
  col1Name: string;
  col2Id: string;
  col2Name: string;
  avgColId: string;
  avgColName: string;
}

export interface StudentScoreRecord {
  studentId: string;
  scores: Record<string, number | null>; // columnId -> score value (0 - 10)
  bonusPoints: number;
  comments: string;
  badges: string[]; // e.g. "Phát biểu tích cực", "Làm bài tốt", "Chưa thuộc bài"
}

export interface ClassSession {
  id: string;
  classId: string;
  className: string;
  grade: string;
  subject: string;
  teacherName: string;
  lessonTitle: string;
  period: number; // Tiết 1, 2, 3, 4, 5...
  date: string; // YYYY-MM-DD
  academicYear: string;
  term: 'Học kỳ 1' | 'Học kỳ 2' | 'Cả năm';
  scorePairs: ScorePair[];
  studentScores: Record<string, StudentScoreRecord>;
  sessionNotes?: string;
  syncRoomId?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface Classroom {
  id: string;
  name: string; // e.g. "10A1", "9B", "12 Toán"
  grade: string;
  academicYear: string;
  defaultSubject: string;
  students: Student[];
}

export interface VoiceParsedCommand {
  rawText: string;
  action: 'set_score' | 'add_bonus' | 'sub_bonus' | 'set_attendance' | 'add_comment' | 'unknown';
  studentStt?: number;
  studentName?: string;
  score?: number;
  columnIndex?: number; // 1, 2, 3, 4...
  pairIndex?: number; // 1, 2...
  subColumn?: 1 | 2;
  attendance?: 'present' | 'absent' | 'late' | 'excused';
  comment?: string;
  confidence: number;
  message: string;
}

export interface SyncState {
  isOnline: boolean;
  lastSyncedAt: string | null;
  pendingCount: number;
  isSyncing: boolean;
  syncRoomId: string;
}
