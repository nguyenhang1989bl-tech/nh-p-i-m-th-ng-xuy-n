import React from 'react';
import { 
  BookOpen, 
  Mic, 
  FileSpreadsheet, 
  Users, 
  BarChart3, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Smartphone, 
  PlusCircle, 
  Keyboard
} from 'lucide-react';
import { Classroom, ClassSession, SyncState } from '../types';

interface NavbarProps {
  classes: Classroom[];
  activeClass: Classroom;
  onSelectClass: (c: Classroom) => void;
  activeSession: ClassSession;
  syncState: SyncState;
  onTriggerSync: () => void;
  onOpenVoice: () => void;
  onOpenExcel: () => void;
  onOpenClassManager: () => void;
  onOpenAnalytics: () => void;
  onOpenSyncModal: () => void;
  onOpenNewSessionModal: () => void;
  viewMode: 'table' | 'cards';
  onToggleViewMode: (mode: 'table' | 'cards') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  classes,
  activeClass,
  onSelectClass,
  activeSession,
  syncState,
  onTriggerSync,
  onOpenVoice,
  onOpenExcel,
  onOpenClassManager,
  onOpenAnalytics,
  onOpenSyncModal,
  onOpenNewSessionModal,
  viewMode,
  onToggleViewMode,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-2.5 flex items-center justify-between gap-2">
        {/* Left: Brand & Class Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center shadow-xs">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold tracking-tight text-white leading-none">
                Sổ Điểm Tiết Học
              </h1>
              <p className="text-[11px] text-slate-400 font-normal mt-0.5">
                Chấm điểm nhanh & Giọng nói
              </p>
            </div>
          </div>

          {/* Class Dropdown */}
          <div className="relative">
            <select
              aria-label="Chọn lớp học"
              value={activeClass.id}
              onChange={(e) => {
                const found = classes.find(c => c.id === e.target.value);
                if (found) onSelectClass(found);
              }}
              className="bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-100 font-semibold text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer transition-colors"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id} className="bg-slate-800 text-white">
                  Lớp {c.name} ({c.students?.length || 0} HS)
                </option>
              ))}
            </select>
          </div>

          {/* Subject Badge */}
          <span className="hidden md:inline-flex items-center px-2 py-1 rounded-md text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
            {activeSession.subject || 'Môn học'} • Tiết {activeSession.period}
          </span>
        </div>

        {/* Center: Realtime & Offline Indicator */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenSyncModal}
            title={syncState.isOnline ? 'Trực tuyến - Đang đồng bộ thời gian thực' : 'Ngoại tuyến - Dữ liệu lưu an toàn trên máy'}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
              syncState.isOnline
                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/80 hover:bg-emerald-900/60'
                : 'bg-amber-950/60 text-amber-300 border border-amber-800/80 hover:bg-amber-900/60'
            }`}
          >
            {syncState.isOnline ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span className="hidden sm:inline text-[11px]">
              {syncState.isOnline ? 'Đồng bộ trực tuyến' : 'Ngoại tuyến (Offline)'}
            </span>
            {syncState.isSyncing && (
              <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />
            )}
          </button>

          {/* Device Sync Room Button */}
          <button
            onClick={onOpenSyncModal}
            className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition cursor-pointer"
            title="Đồng bộ giữa Điện thoại và Máy tính"
          >
            <Smartphone className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-[11px]">Phòng: <strong className="text-white font-semibold">{activeSession.syncRoomId || 'A1'}</strong></span>
          </button>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-1.5">
          {/* New Session Button */}
          <button
            onClick={onOpenNewSessionModal}
            className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition cursor-pointer"
            title="Tạo tiết học mới"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tiết mới</span>
          </button>

          {/* View Mode Toggle (Grid vs Cards) */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
            <button
              onClick={() => onToggleViewMode('table')}
              className={`px-2 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                viewMode === 'table' ? 'bg-slate-700 text-white shadow-2xs' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Chế độ bảng lưới (Máy tính)"
            >
              Bảng
            </button>
            <button
              onClick={() => onToggleViewMode('cards')}
              className={`px-2 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                viewMode === 'cards' ? 'bg-slate-700 text-white shadow-2xs' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Chế độ thẻ (Điện thoại)"
            >
              Thẻ HS
            </button>
          </div>

          {/* Voice Input Button */}
          <button
            onClick={onOpenVoice}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-2xs transition active:scale-95 cursor-pointer"
            title="Nhập điểm bằng giọng nói"
          >
            <Mic className="w-3.5 h-3.5 animate-pulse" />
            <span className="hidden sm:inline">Nói điểm</span>
          </button>

          {/* Excel Export Button */}
          <button
            onClick={onOpenExcel}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white transition active:scale-95 cursor-pointer"
            title="Xuất file Excel báo cáo"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Xuất Excel</span>
          </button>

          {/* Analytics / Charts Button */}
          <button
            onClick={onOpenAnalytics}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition cursor-pointer"
            title="Thống kê kết quả tiết học"
          >
            <BarChart3 className="w-4 h-4 text-amber-400" />
          </button>

          {/* Class / Student Manager */}
          <button
            onClick={onOpenClassManager}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition cursor-pointer"
            title="Quản lý danh sách lớp & học sinh"
          >
            <Users className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </div>
    </header>
  );
};
