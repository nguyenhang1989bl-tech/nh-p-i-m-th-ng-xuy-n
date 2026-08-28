import { VoiceParsedCommand, Student } from '../types';

/**
 * Normalizes Vietnamese text by converting to lowercase and stripping extra whitespace
 */
export function normalizeVietnamese(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

// Convert Vietnamese word numbers to float
export function parseVietnameseNumber(text: string): number | null {
  const clean = normalizeVietnamese(text);

  // Direct number check (e.g. "8.5", "9,5", "10", "7.25")
  const numDirect = parseFloat(clean.replace(',', '.'));
  if (!isNaN(numDirect) && numDirect >= 0 && numDirect <= 10) {
    return numDirect;
  }

  // Word mapping dictionary
  const numberWords: Record<string, number> = {
    'không': 0,
    'khong': 0,
    'zê rô': 0,
    'zero': 0,
    'một': 1,
    'mốt': 1,
    'mot': 1,
    'hai': 2,
    'ba': 3,
    'bốn': 4,
    'bon': 4,
    'năm': 5,
    'nam': 5,
    'lăm': 5,
    'sáu': 6,
    'sau': 6,
    'bảy': 7,
    'bẩy': 7,
    'bay': 7,
    'tám': 8,
    'tam': 8,
    'chín': 9,
    'chin': 9,
    'mười': 10,
    'muoi': 10,
  };

  // Check exact single word
  if (numberWords[clean] !== undefined) {
    return numberWords[clean];
  }

  // Check "rưỡi" / "rưởi" patterns, e.g. "tám rưỡi" -> 8.5, "chín rưỡi" -> 9.5
  const ruoiMatch = clean.match(/^([a-zà-ỹ]+)\s+(rưỡi|rưởi|ruoi)$/);
  if (ruoiMatch) {
    const base = numberWords[ruoiMatch[1]];
    if (base !== undefined && base < 10) {
      return base + 0.5;
    }
  }

  // Check "phẩy" / "chấm" patterns, e.g. "tám phẩy năm" -> 8.5, "bảy phẩy hai lăm" -> 7.25, "chín chấm hai mươi lăm" -> 9.25
  const sepMatch = clean.match(/^([a-zà-ỹ0-9]+)\s*(?:phẩy|chấm|phay|cham|\.|,)\s*([a-zà-ỹ0-9\s]+)$/);
  if (sepMatch) {
    const wholeStr = sepMatch[1];
    const decStr = sepMatch[2].trim();

    const whole = !isNaN(Number(wholeStr)) ? Number(wholeStr) : (numberWords[wholeStr] ?? null);
    if (whole !== null && whole >= 0 && whole <= 10) {
      if (!isNaN(Number(decStr))) {
        const decVal = Number(`0.${decStr}`);
        return Math.min(10, Math.round((whole + decVal) * 100) / 100);
      }
      
      // Dec words e.g. "năm" -> 0.5, "hai lăm" -> 0.25, "bảy lăm" -> 0.75
      if (decStr === 'năm' || decStr === 'lăm') return whole + 0.5;
      if (decStr === 'hai lăm' || decStr === 'hai mươi lăm') return whole + 0.25;
      if (decStr === 'bảy lăm' || decStr === 'bảy mươi lăm') return whole + 0.75;
      if (numberWords[decStr] !== undefined) {
        return Math.min(10, whole + (numberWords[decStr] / 10));
      }
    }
  }

  return null;
}

/**
 * Intelligent Vietnamese voice parser for teacher classroom commands
 */
export function parseVoiceInput(transcript: string, studentList: Student[] = []): VoiceParsedCommand {
  const norm = normalizeVietnamese(transcript);
  
  if (!norm) {
    return {
      rawText: transcript,
      action: 'unknown',
      confidence: 0,
      message: 'Không nghe thấy nội dung rõ ràng',
    };
  }

  // 1. Check Attendance commands (e.g. "Số 5 vắng", "Học sinh 10 có phép", "Em An muộn")
  if (norm.includes('vắng') || norm.includes('vang') || norm.includes('nghỉ') || norm.includes('vang mat')) {
    const stt = extractStt(norm);
    const student = findStudent(norm, studentList);
    const isExcused = norm.includes('phép') || norm.includes('phep') || norm.includes('có phép');
    
    return {
      rawText: transcript,
      action: 'set_attendance',
      studentStt: stt ?? student?.stt,
      studentName: student?.name,
      attendance: isExcused ? 'excused' : 'absent',
      confidence: 0.95,
      message: `Đánh dấu ${student ? student.name : `STT ${stt}`} ${isExcused ? 'vắng có phép' : 'vắng mặt'}`,
    };
  }

  if (norm.includes('muộn') || norm.includes('trễ') || norm.includes('di tre')) {
    const stt = extractStt(norm);
    const student = findStudent(norm, studentList);
    return {
      rawText: transcript,
      action: 'set_attendance',
      studentStt: stt ?? student?.stt,
      studentName: student?.name,
      attendance: 'late',
      confidence: 0.95,
      message: `Đánh dấu ${student ? student.name : `STT ${stt}`} đi muộn`,
    };
  }

  // 2. Check Bonus points (e.g. "Số 7 cộng 1 điểm", "Cộng 1 điểm cho bạn Nam", "Trừ 1 điểm số 3")
  if (norm.includes('cộng') || norm.includes('cong') || norm.includes('+') || norm.includes('thưởng')) {
    const stt = extractStt(norm);
    const student = findStudent(norm, studentList);
    const bonusVal = norm.includes('2') || norm.includes('hai') ? 2 : 1;
    return {
      rawText: transcript,
      action: 'add_bonus',
      studentStt: stt ?? student?.stt,
      studentName: student?.name,
      score: bonusVal,
      confidence: 0.9,
      message: `Cộng ${bonusVal} điểm thưởng cho ${student ? student.name : `STT ${stt}`}`,
    };
  }

  if (norm.includes('trừ') || norm.includes('tru') || norm.includes('-')) {
    const stt = extractStt(norm);
    const student = findStudent(norm, studentList);
    const subVal = norm.includes('2') || norm.includes('hai') ? 2 : 1;
    return {
      rawText: transcript,
      action: 'sub_bonus',
      studentStt: stt ?? student?.stt,
      studentName: student?.name,
      score: subVal,
      confidence: 0.9,
      message: `Trừ ${subVal} điểm cho ${student ? student.name : `STT ${stt}`}`,
    };
  }

  // 3. Check regular score entry (e.g. "Số 5 điểm 8", "STT 12 điểm chín rưỡi", "Bạn Nguyễn Văn An 10 điểm cột 2", "Số 3 cột 1 điểm 7")
  const stt = extractStt(norm);
  const student = findStudent(norm, studentList);
  const colIndex = extractColumnIndex(norm);
  const score = extractScore(norm);

  if (score !== null && (stt !== undefined || student !== undefined)) {
    const targetName = student ? student.name : `STT ${stt}`;
    const colName = colIndex ? `cột ${colIndex}` : 'cột hiện tại';
    return {
      rawText: transcript,
      action: 'set_score',
      studentStt: stt ?? student?.stt,
      studentName: student?.name,
      score,
      columnIndex: colIndex,
      confidence: 0.95,
      message: `Nhập ${score} điểm cho ${targetName} (${colName})`,
    };
  }

  // 4. If only score is spoken (e.g. "Điểm 9", "Tám rưỡi", "10") -> apply to active/next selected student
  if (score !== null) {
    return {
      rawText: transcript,
      action: 'set_score',
      score,
      columnIndex: colIndex,
      confidence: 0.8,
      message: `Nhập ${score} điểm cho học sinh đang chọn`,
    };
  }

  return {
    rawText: transcript,
    action: 'unknown',
    confidence: 0.2,
    message: `Không nhận diện được lệnh: "${transcript}". Ví dụ: "Số 5 điểm 8 cột 1", "Số 12 vắng"`,
  };
}

// Helpers
function extractStt(norm: string): number | undefined {
  // Pattern: "số 5", "stt 5", "bạn số 5", "học sinh 5", "em số 5", "số thứ tự 5"
  const match = norm.match(/(?:số\s*(?:thứ\s*tự)?|stt|em\s*số|bạn\s*số|học\s*sinh\s*số|hs\s*số)\s*(\d{1,2}|một|hai|ba|bốn|năm|sáu|bảy|tám|chín|mười)/i);
  if (match) {
    const rawVal = match[1];
    if (!isNaN(Number(rawVal))) {
      return Number(rawVal);
    }
    const parsed = parseVietnameseNumber(rawVal);
    if (parsed !== null) return parsed;
  }

  // Just "số X" at beginning
  const startMatch = norm.match(/^(\d{1,2})\s+/);
  if (startMatch) {
    return Number(startMatch[1]);
  }

  return undefined;
}

function extractColumnIndex(norm: string): number | undefined {
  const match = norm.match(/(?:cột|cot)\s*(\d+|một|hai|ba|bốn|năm|sáu|bảy|tám)/i);
  if (match) {
    const val = match[1];
    if (!isNaN(Number(val))) return Number(val);
    const parsed = parseVietnameseNumber(val);
    if (parsed !== null) return parsed;
  }
  if (norm.includes('miệng') || norm.includes('phát biểu')) return 1;
  if (norm.includes('15 phút') || norm.includes('mười lăm phút')) return 2;
  if (norm.includes('1 tiết') || norm.includes('một tiết')) return 3;
  return undefined;
}

function extractScore(norm: string): number | null {
  // Try pattern "điểm X", "được X điểm", "cho X điểm", "= X"
  const scoreWordMatch = norm.match(/(?:điểm|diem|được|cho|la|là|=)\s*([0-9.,]+|[a-zà-ỹ\s]+?)(?:\s+cột|\s+cho|\s*$)/i);
  if (scoreWordMatch) {
    const raw = scoreWordMatch[1].trim();
    const parsed = parseVietnameseNumber(raw);
    if (parsed !== null) return parsed;
  }

  // Check if string ends with number/score words
  const words = norm.split(' ');
  for (let len = 3; len >= 1; len--) {
    const chunk = words.slice(-len).join(' ');
    const parsed = parseVietnameseNumber(chunk);
    if (parsed !== null) return parsed;
  }

  // Try direct scan of all tokens
  const directNumMatch = norm.match(/\b(10|[0-9][.,][0-9]{1,2}|[0-9])\b/g);
  if (directNumMatch && directNumMatch.length > 0) {
    // If multiple numbers, STT might be first, score might be second
    const last = directNumMatch[directNumMatch.length - 1];
    const val = parseFloat(last.replace(',', '.'));
    if (!isNaN(val) && val >= 0 && val <= 10) return val;
  }

  return null;
}

function findStudent(norm: string, studentList: Student[]): Student | undefined {
  if (!studentList.length) return undefined;
  for (const student of studentList) {
    const sName = normalizeVietnamese(student.name);
    // Exact name match or last name match
    if (norm.includes(sName)) {
      return student;
    }
    const parts = sName.split(' ');
    const firstName = parts[parts.length - 1];
    if (firstName.length >= 2 && norm.includes(`bạn ${firstName}`) || norm.includes(`em ${firstName}`) || norm.includes(`học sinh ${firstName}`)) {
      return student;
    }
  }
  return undefined;
}
