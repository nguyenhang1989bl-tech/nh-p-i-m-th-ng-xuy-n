import React, { useState } from 'react';
import { 
  X, 
  Smartphone, 
  Monitor, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Check, 
  Copy, 
  QrCode, 
  Sparkles,
  Layers,
  ArrowLeftRight
} from 'lucide-react';
import { ClassSession, SyncState } from '../types';

interface DeviceSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ClassSession;
  syncState: SyncState;
  onUpdateRoomId: (newRoomId: string) => void;
  onTriggerSync: () => void;
  onPullRemoteSync: (roomId: string) => Promise<boolean>;
}

export const DeviceSyncModal: React.FC<DeviceSyncModalProps> = ({
  isOpen,
  onClose,
  session,
  syncState,
  onUpdateRoomId,
  onTriggerSync,
  onPullRemoteSync,
}) => {
  const [inputRoomId, setInputRoomId] = useState(session.syncRoomId || '10A1');
  const [copied, setCopied] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href.split('?')[0] : '';
  const syncLink = `${currentUrl}?room=${inputRoomId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(syncLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnectRoom = async () => {
    const clean = inputRoomId.trim().toUpperCase();
    if (!clean) return;
    onUpdateRoomId(clean);
    setPulling(true);
    setStatusMsg('Đang kiểm tra và kết nối phòng đồng bộ...');
    const ok = await onPullRemoteSync(clean);
    setPulling(false);
    if (ok) {
      setStatusMsg('✅ Đã kết nối và đồng bộ dữ liệu thời gian thực thành công!');
    } else {
      setStatusMsg('ℹ️ Đã mở phòng đồng bộ mới. Các thiết bị khác nhập mã này để nhận dữ liệu.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-xs">
              <ArrowLeftRight className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">
                Đồng Bộ Thời Gian Thực & Ngoại Tuyến
              </h3>
              <p className="text-[11px] text-slate-400">
                Chấm điểm trên Điện thoại ⇄ Tự động hiện trên Máy tính
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
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Connection Status Card */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            syncState.isOnline
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              : 'bg-amber-50/70 border-amber-200 text-amber-950'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                syncState.isOnline ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
              }`}>
                {syncState.isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              </div>
              <div>
                <h4 className="font-bold text-sm">
                  {syncState.isOnline ? 'Trực tuyến (Online Sync Ready)' : 'Chế độ Ngoại tuyến (Offline Mode)'}
                </h4>
                <p className="text-xs text-slate-600 font-normal">
                  {syncState.isOnline 
                    ? 'Dữ liệu được đồng bộ 2 chiều tức thì giữa các thiết bị.' 
                    : 'Không có mạng: Toàn bộ điểm số được lưu an toàn tuyệt đối trong máy.'}
                </p>
              </div>
            </div>

            <button
              onClick={onTriggerSync}
              disabled={syncState.isSyncing}
              className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs hover:bg-slate-50 transition active:scale-95 cursor-pointer"
              title="Đồng bộ lại"
            >
              <RefreshCw className={`w-4 h-4 text-slate-700 ${syncState.isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          </div>

          {/* Sync Code Box */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Mã phòng kết nối giữa Điện thoại & Máy tính:
            </h4>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputRoomId}
                onChange={(e) => setInputRoomId(e.target.value.toUpperCase())}
                placeholder="Ví dụ: 10A1-TOAN"
                className="flex-1 font-mono font-bold text-center text-lg uppercase tracking-wider py-2 px-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                onClick={handleConnectRoom}
                disabled={pulling}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg shadow-2xs transition active:scale-95 cursor-pointer"
              >
                {pulling ? 'Đang kết nối...' : 'Kết nối'}
              </button>
            </div>

            {statusMsg && (
              <p className="text-xs font-semibold text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200">
                {statusMsg}
              </p>
            )}

            {/* Quick Share Link */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-normal">Sao chép liên kết mở trên điện thoại:</span>
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200 transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Đã sao chép!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Workflow Diagram */}
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <Smartphone className="w-5 h-5 text-rose-600 mx-auto" />
              <div className="font-bold text-xs text-slate-800">Điện thoại giáo viên</div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Cầm tay đi lại trong lớp, bấm nhanh hoặc nói điểm bằng giọng nói
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <Monitor className="w-5 h-5 text-sky-600 mx-auto" />
              <div className="font-bold text-xs text-slate-800">Máy tính trên bàn</div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Màn hình lớn hiển thị bảng điểm trực tiếp, tự động tính ĐTB bôi đỏ & xuất Excel
              </p>
            </div>
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
