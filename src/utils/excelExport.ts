import * as XLSX from 'xlsx';
import { ClassSession, Student, Classroom } from '../types';

/**
 * Calculates average for a pair of scores. Returns formatted number or null.
 */
export function calculatePairAverage(score1: number | null | undefined, score2: number | null | undefined): number | null {
  const has1 = score1 !== null && score1 !== undefined && !isNaN(Number(score1));
  const has2 = score2 !== null && score2 !== undefined && !isNaN(Number(score2));

  if (!has1 && !has2) return null;
  if (has1 && !has2) return Math.round(Number(score1) * 10) / 10;
  if (!has1 && has2) return Math.round(Number(score2) * 10) / 10;

  const avg = (Number(score1) + Number(score2)) / 2;
  return Math.round(avg * 10) / 10;
}

/**
 * Calculates overall session average for all scores
 */
export function calculateOverallAverage(session: ClassSession, studentId: string): number | null {
  const record = session.studentScores[studentId];
  if (!record) return null;

  const validScores: number[] = [];
  session.scorePairs.forEach(pair => {
    const s1 = record.scores[pair.col1Id];
    const s2 = record.scores[pair.col2Id];
    const pairAvg = calculatePairAverage(s1, s2);
    if (pairAvg !== null) {
      validScores.push(pairAvg);
    }
  });

  if (validScores.length === 0) return null;
  const sum = validScores.reduce((a, b) => a + b, 0);
  return Math.round((sum / validScores.length) * 10) / 10;
}

export function getGradeRank(avg: number | null): string {
  if (avg === null) return 'Chưa có điểm';
  if (avg >= 8.0) return 'Giỏi';
  if (avg >= 6.5) return 'Khá';
  if (avg >= 5.0) return 'Đạt / Trung bình';
  return 'Cần cố gắng';
}

/**
 * Exports complete classroom session gradebook to Excel (.xlsx)
 */
export function exportSessionToExcel(session: ClassSession, students: Student[]) {
  const workbook = XLSX.utils.book_new();

  // 1. Prepare Header rows
  const headerData: (string | number)[][] = [
    ['SỞ GD&ĐT / TRƯỜNG: ........................................', '', '', '', 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM'],
    ['SỔ THEO DÕI KẾT QUẢ HỌC TẬP TỪNG TIẾT HỌC', '', '', '', 'Độc lập - Tự do - Hạnh phúc'],
    ['', '', '', '', ''],
    [`LỚP: ${session.className}`, `MÔN HỌC: ${session.subject}`, `TIẾT: ${session.period}`, `NGÀY: ${session.date}`, `GIÁO VIÊN: ${session.teacherName}`],
    [`BÀI DẠY / CHỦ ĐỀ: ${session.lessonTitle || 'Theo phân phối chương trình'}`, '', '', `HỌC KỲ: ${session.term}`, `NĂM HỌC: ${session.academicYear}`],
    ['', '', '', '', ''],
  ];

  // 2. Build Column headers
  // Base columns: STT, Mã HS, Họ và tên, Giới tính, Chuyên cần
  // For each score pair: [Cột 1 Name], [Cột 2 Name], [ĐTB CẶP (BÔI ĐỎ)]
  // Summary columns: ĐTB Tiết Học, Điểm Cộng, Xếp loại, Ghi chú / Nhận xét

  const tableHeaderRow: string[] = ['STT', 'Mã HS', 'Họ và tên', 'Giới tính', 'Chuyên cần'];
  
  session.scorePairs.forEach((pair, idx) => {
    tableHeaderRow.push(pair.col1Name || `Cột ${idx * 2 + 1}`);
    tableHeaderRow.push(pair.col2Name || `Cột ${idx * 2 + 2}`);
    tableHeaderRow.push(`★ ĐTB Cặp ${idx + 1} (BÔI ĐỎ)`);
  });

  tableHeaderRow.push('ĐTB CHUNG', 'Điểm cộng (+)', 'Xếp loại', 'Nhận xét / Ghi chú');

  const rows: (string | number)[][] = [...headerData, tableHeaderRow];

  // 3. Populate Student rows
  students.forEach((student, index) => {
    const record = session.studentScores[student.id] || {
      studentId: student.id,
      scores: {},
      bonusPoints: 0,
      comments: '',
      badges: [],
    };

    let attendanceStr = 'Có mặt';
    if (student.attendance === 'absent') attendanceStr = 'Vắng không phép';
    if (student.attendance === 'excused') attendanceStr = 'Vắng có phép';
    if (student.attendance === 'late') attendanceStr = 'Đi muộn';

    const rowData: (string | number)[] = [
      student.stt || (index + 1),
      student.code || `HS${String(student.stt || index + 1).padStart(3, '0')}`,
      student.name,
      student.gender || 'Nam',
      attendanceStr,
    ];

    // Scores & pair averages
    session.scorePairs.forEach(pair => {
      const s1 = record.scores[pair.col1Id];
      const s2 = record.scores[pair.col2Id];
      const avg = calculatePairAverage(s1, s2);

      rowData.push(s1 !== null && s1 !== undefined ? s1 : '');
      rowData.push(s2 !== null && s2 !== undefined ? s2 : '');
      rowData.push(avg !== null ? avg : '');
    });

    const overallAvg = calculateOverallAverage(session, student.id);
    const rank = getGradeRank(overallAvg);

    rowData.push(overallAvg !== null ? overallAvg : '');
    rowData.push(record.bonusPoints ? `+${record.bonusPoints}` : 0);
    rowData.push(rank);
    rowData.push(record.comments || (record.badges && record.badges.length ? record.badges.join(', ') : ''));

    rows.push(rowData);
  });

  // 4. Statistics summary section at the bottom
  const allOverallAvgs = students
    .map(s => calculateOverallAverage(session, s.id))
    .filter((a): a is number => a !== null);

  const totalScored = allOverallAvgs.length;
  const goodCount = allOverallAvgs.filter(s => s >= 8.0).length;
  const fairCount = allOverallAvgs.filter(s => s >= 6.5 && s < 8.0).length;
  const passCount = allOverallAvgs.filter(s => s >= 5.0 && s < 6.5).length;
  const weakCount = allOverallAvgs.filter(s => s < 5.0).length;
  const classAverage = totalScored > 0 ? (allOverallAvgs.reduce((a, b) => a + b, 0) / totalScored).toFixed(2) : '0';

  rows.push(['', '', '', '', '']);
  rows.push(['THỐNG KÊ KẾT QUẢ TIẾT HỌC:', '', '', '', '']);
  rows.push(['Tổng số học sinh:', students.length, 'Số học sinh có điểm:', totalScored, `Điểm TB chung cả lớp: ${classAverage}`]);
  rows.push(['Giỏi (>= 8.0):', `${goodCount} (${totalScored ? Math.round(goodCount / totalScored * 100) : 0}%)`, 'Khá (6.5 - 7.9):', `${fairCount} (${totalScored ? Math.round(fairCount / totalScored * 100) : 0}%)`, '']);
  rows.push(['Trung bình / Đạt (5.0 - 6.4):', `${passCount} (${totalScored ? Math.round(passCount / totalScored * 100) : 0}%)`, 'Cần cố gắng (< 5.0):', `${weakCount} (${totalScored ? Math.round(weakCount / totalScored * 100) : 0}%)`, '']);
  rows.push(['', '', '', '', '']);
  rows.push(['', '', '', '', `Ngày lập báo cáo: ${new Date().toLocaleDateString('vi-VN')}`]);
  rows.push(['', '', '', '', 'GIÁO VIÊN BỘ MÔN (Ký & ghi rõ họ tên)']);

  // Convert array of arrays to worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  // Auto-fit column widths
  const colWidths = [
    { wch: 6 },  // STT
    { wch: 10 }, // Mã HS
    { wch: 24 }, // Họ và tên
    { wch: 10 }, // Giới tính
    { wch: 16 }, // Chuyên cần
  ];

  session.scorePairs.forEach(() => {
    colWidths.push({ wch: 14 }); // Cột 1
    colWidths.push({ wch: 14 }); // Cột 2
    colWidths.push({ wch: 24 }); // ĐTB Cặp (Bôi đỏ)
  });

  colWidths.push({ wch: 14 }); // ĐTB Chung
  colWidths.push({ wch: 14 }); // Điểm cộng
  colWidths.push({ wch: 18 }); // Xếp loại
  colWidths.push({ wch: 30 }); // Ghi chú

  worksheet['!cols'] = colWidths;

  // Append sheet to workbook
  const sheetName = `Diem_${session.className}_T${session.period}`.slice(0, 31);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Write file
  const fileName = `So_Diem_${session.className}_${session.subject}_Tiet${session.period}_${session.date}.xlsx`.replace(/\s+/g, '_');
  XLSX.writeFile(workbook, fileName);
}

/**
 * Downloads a sample Excel template for importing student rosters
 */
export function downloadStudentTemplateExcel(className: string = '10A1') {
  const workbook = XLSX.utils.book_new();
  const sampleData = [
    ['DANH SÁCH HỌC SINH MẪU (DÙNG ĐỂ NHẬP NHANH VÀO HỆ THỐNG)'],
    ['Lớp:', className, 'Năm học: 2025-2026'],
    [''],
    ['STT', 'Mã Học Sinh', 'Họ và Tên', 'Giới Tính', 'Ngày Sinh', 'Ghi Chú'],
    [1, 'HS001', 'Nguyễn Văn An', 'Nam', '15/03/2009', 'Lớp trưởng'],
    [2, 'HS002', 'Trần Thị Bích', 'Nữ', '22/07/2009', 'Lớp phó học tập'],
    [3, 'HS003', 'Lê Hoàng Cường', 'Nam', '10/11/2009', ''],
    [4, 'HS004', 'Phạm Thị Dung', 'Nữ', '05/01/2009', ''],
    [5, 'HS005', 'Vũ Quốc Đạt', 'Nam', '18/09/2009', ''],
    [6, 'HS006', 'Đỗ Mai Hương', 'Nữ', '30/04/2009', ''],
    [7, 'HS007', 'Hoàng Minh Khôi', 'Nam', '12/12/2009', ''],
    [8, 'HS008', 'Ngô Thuỳ Linh', 'Nữ', '08/08/2009', ''],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(sampleData);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 25 },
    { wch: 12 },
    { wch: 14 },
    { wch: 25 },
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Mau_DanhSach_HS');
  XLSX.writeFile(workbook, `Mau_Danh_Sach_Hoc_Sinh_${className}.xlsx`);
}

/**
 * Parses uploaded Excel file into Student list
 */
export async function parseExcelToStudents(file: File): Promise<Student[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

        const students: Student[] = [];
        let headerRowIndex = -1;

        // Find header row containing "Họ và tên" or "Tên" or "Họ tên"
        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || !Array.isArray(row)) continue;
          const rowText = row.map(cell => String(cell || '').toLowerCase()).join(' ');
          if (rowText.includes('họ và tên') || rowText.includes('họ tên') || rowText.includes('tên học sinh') || rowText.includes('name')) {
            headerRowIndex = i;
            break;
          }
        }

        if (headerRowIndex === -1) {
          // If no explicit header, assume data starts after row 0 or 1
          headerRowIndex = 0;
        }

        const headers = jsonData[headerRowIndex].map(h => String(h || '').trim().toLowerCase());
        const sttIdx = headers.findIndex(h => h.includes('stt') || h.includes('số tt'));
        const codeIdx = headers.findIndex(h => h.includes('mã') || h.includes('id') || h.includes('code'));
        const nameIdx = headers.findIndex(h => h.includes('họ và tên') || h.includes('họ tên') || h.includes('tên') || h.includes('name'));
        const genderIdx = headers.findIndex(h => h.includes('giới tính') || h.includes('nam/nữ') || h.includes('phái'));
        const notesIdx = headers.findIndex(h => h.includes('ghi chú') || h.includes('chú thích') || h.includes('note'));

        for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;

          const rawName = nameIdx !== -1 ? row[nameIdx] : row[1] || row[2];
          if (!rawName || String(rawName).trim().length === 0) continue;

          const sttVal = sttIdx !== -1 && row[sttIdx] ? Number(row[sttIdx]) : (students.length + 1);
          const rawGender = genderIdx !== -1 && row[genderIdx] ? String(row[genderIdx]).trim() : 'Nam';
          const gender: 'Nam' | 'Nữ' = rawGender.toLowerCase().includes('nữ') || rawGender.toLowerCase() === 'f' ? 'Nữ' : 'Nam';

          students.push({
            id: `std_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 5)}`,
            stt: !isNaN(sttVal) && sttVal > 0 ? sttVal : (students.length + 1),
            code: codeIdx !== -1 && row[codeIdx] ? String(row[codeIdx]).trim() : `HS${String(students.length + 1).padStart(3, '0')}`,
            name: String(rawName).trim(),
            gender,
            notes: notesIdx !== -1 && row[notesIdx] ? String(row[notesIdx]).trim() : '',
            attendance: 'present',
          });
        }

        resolve(students);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}
