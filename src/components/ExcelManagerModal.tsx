import React, { useState, useRef } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Layers,
  HelpCircle
} from 'lucide-react';
import { ClassSession, Student } from '../types';
import { exportSessionToExcel, downloadStudentTemplateExcel, parseExcelToStudents } from '../utils/excelExport';

interface ExcelManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ClassSession;
  students: Student[];
  onImportStudents: (students: Student[]) => void;
}

export const ExcelManagerModal: React.FC<ExcelManagerModalProps> = ({
  isOpen,
  onClose,
  session,
  students,
  onImportStudents,
}) => {
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string; count?: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    exportSessionToExcel(session, students);
  };

  const handleDownloadTemplate = () => {
    downloadStudentTemplateExcel(session.className);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setImportStatus(null);

    try {
      const parsedStudents = await parseExcelToStudents(file);
      if (parsedStudents.length === 0) {
        setImportStatus({
          success: false,
          message: 'Không tìm thấy danh sách học sinh hợp lệ trong file Excel.',
        });
      } else {
        onImportStudents(parsedStudents);
        setImportStatus({
          success: true,
          message: `Đã nhập thành công ${parsedStudents.length} học sinh vào lớp ${session.className}.`,
          count: parsedStudents.length,
        });
      }
    } catch (err: any) {
      console.error(err);
      setImportStatus({
        success: false,
        message: 'Lỗi khi đọc file Excel: ' + (err.message || 'Vui lòng kiểm tra lại định dạng file.'),
      });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">
                Xuất Báo Cáo Excel & Quản Lý Dữ Liệu
              </h3>
              <p className="text-[11px] text-slate-400">
                Xuất file Excel (.xlsx) chuẩn mẫu sư phạm có bôi đỏ cột ĐTB
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

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Main Export Card */}
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-700" />
                <h4 className="font-bold text-sm text-emerald-950">
                  Xuất bảng điểm tiết học này sang Excel
                </h4>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                .XLSX
              </span>
            </div>

            <p className="text-xs text-emerald-900/90 leading-relaxed font-normal">
              Tạo file Microsoft Excel bao gồm: Tiêu đề trường học, Lớp <strong>{session.className}</strong>, Môn <strong>{session.subject}</strong>, Tiết <strong>{session.period}</strong>, danh sách điểm từng cột, <strong className="text-rose-700">các cột ĐTB cặp bôi đỏ tự động</strong>, xếp loại học sinh và bảng thống kê phổ điểm tổng kết cuối trang.
            </p>

            <button
              onClick={handleExport}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-2xs transition active:scale-98 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Tải xuống file Excel (.xlsx) ngay</span>
            </button>
          </div>

          {/* Import Student Roster Card */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-slate-700" />
                <h4 className="font-bold text-sm text-slate-900">
                  Nhập danh sách học sinh từ Excel
                </h4>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Nhập nhanh danh sách lớp (STT, Mã HS, Họ và tên, Giới tính) từ file Excel có sẵn của nhà trường mà không cần nhập tay.
            </p>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition shadow-2xs cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isProcessing ? 'Đang đọc file...' : 'Tải lên file Excel danh sách'}</span>
              </button>

              <button
                onClick={handleDownloadTemplate}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải mẫu Excel chuẩn</span>
              </button>
            </div>

            {/* Status Message */}
            {importStatus && (
              <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                importStatus.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                {importStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{importStatus.message}</span>
              </div>
            )}
          </div>

          {/* Guidelines info */}
          <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>
              <strong>Lưu ý:</strong> Dữ liệu được tính toán và lưu trực tiếp trong trình duyệt. Khi xuất Excel, mọi cặp cột điểm và ĐTB đều được định dạng rõ ràng để in ấn hoặc báo cáo ban giám hiệu.
            </span>
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
