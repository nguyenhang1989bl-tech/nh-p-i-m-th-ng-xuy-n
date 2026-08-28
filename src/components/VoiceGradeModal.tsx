import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Mic, 
  MicOff, 
  Volume2, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  HelpCircle, 
  RefreshCw,
  Zap,
  Radio
} from 'lucide-react';
import { Student, ClassSession, VoiceParsedCommand } from '../types';
import { parseVoiceInput } from '../utils/vietnameseParser';

interface VoiceGradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ClassSession;
  students: Student[];
  onApplyVoiceCommand: (cmd: VoiceParsedCommand) => void;
}

export const VoiceGradeModal: React.FC<VoiceGradeModalProps> = ({
  isOpen,
  onClose,
  session,
  students,
  onApplyVoiceCommand,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [continuousMode, setContinuousMode] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [parsedResult, setParsedResult] = useState<VoiceParsedCommand | null>(null);
  const [history, setHistory] = useState<{ text: string; message: string; success: boolean }[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<any>(null);

  // Initialize Web Speech API
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      const currentText = final || interim;
      if (currentText) {
        setTranscript(currentText);

        if (final) {
          processTranscript(final);
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setErrorMessage('Vui lòng cấp quyền truy cập Microphone trong trình duyệt để nói điểm.');
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      if (isListening && continuousMode) {
        try {
          recognition.start();
        } catch (e) {
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch (e) {}
    };
  }, [continuousMode, isListening]);

  // Start / Stop listening
  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsListening(false);
    } else {
      setTranscript('');
      setErrorMessage(null);
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        try {
          recognitionRef.current.stop();
          setTimeout(() => {
            recognitionRef.current.start();
            setIsListening(true);
          }, 200);
        } catch (err) {
          console.error(err);
        }
      }
    }
  };

  // Process text and apply
  const processTranscript = async (text: string) => {
    // 1. First run fast local parser
    const localParsed = parseVoiceInput(text, students);
    
    // If local parser found student & score, apply immediately
    if (localParsed.action !== 'unknown' && (localParsed.studentStt !== undefined || localParsed.studentName !== undefined || localParsed.score !== undefined)) {
      setParsedResult(localParsed);
      onApplyVoiceCommand(localParsed);
      setHistory(prev => [{ text, message: localParsed.message, success: true }, ...prev.slice(0, 7)]);
      return;
    }

    // 2. Otherwise query server AI parser
    try {
      const res = await fetch('/api/ai/parse-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: text,
          studentList: students,
          currentPairIndex: 1,
        }),
      });
      const data = await res.json();
      if (data.success && data.data && data.data.action !== 'unknown') {
        setParsedResult(data.data);
        onApplyVoiceCommand(data.data);
        setHistory(prev => [{ text, message: data.data.message, success: true }, ...prev.slice(0, 7)]);
      } else {
        setParsedResult(localParsed);
        setHistory(prev => [{ text, message: localParsed.message, success: false }, ...prev.slice(0, 7)]);
      }
    } catch (err) {
      setParsedResult(localParsed);
      setHistory(prev => [{ text, message: localParsed.message, success: false }, ...prev.slice(0, 7)]);
    }
  };

  const sampleCommands = [
    'Số 5 điểm 8',
    'Số 12 điểm chín rưỡi cột 2',
    'Bạn Nguyễn Hoàng An 10 điểm',
    'Số 3 cộng 1 điểm phát biểu',
    'Số 7 vắng có phép',
    'Số 14 đi muộn',
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center shadow-xs">
              <Mic className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">
                Nhập Điểm Bằng Giọng Nói (Tiếng Việt)
              </h3>
              <p className="text-[11px] text-slate-400">
                Tự động nhận diện STT, tên học sinh, cột điểm & điểm số
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

        {/* Body Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Support Error */}
          {!isSupported && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>Trình duyệt hiện tại không hỗ trợ trực tiếp Web Speech API. Bạn có thể sử dụng Chrome, Cốc Cốc, Safari hoặc Edge để nói điểm.</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Voice Microphone Center Stage */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center relative overflow-hidden">
            {/* Animated Ring when active */}
            {isListening && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-32 h-32 rounded-full bg-rose-500/10 animate-ping" />
                <div className="w-44 h-44 rounded-full bg-rose-500/5 animate-pulse" />
              </div>
            )}

            <button
              onClick={toggleListening}
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 cursor-pointer relative z-10 ${
                isListening
                  ? 'bg-rose-600 hover:bg-rose-700 text-white ring-4 ring-rose-300 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-white'
              }`}
            >
              {isListening ? (
                <Mic className="w-9 h-9" />
              ) : (
                <MicOff className="w-9 h-9 text-slate-400" />
              )}
            </button>

            <div className="mt-3 relative z-10">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                isListening ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'
              }`}>
                {isListening ? '🎙️ Đang lắng nghe... Mời thầy cô nói' : 'Bấm micro để bắt đầu nói điểm'}
              </span>
            </div>

            {/* Live Transcript Box */}
            <div className="mt-3 w-full bg-white border border-slate-200 rounded-xl p-3 min-h-[50px] flex items-center justify-center text-slate-800 font-semibold text-sm shadow-2xs">
              {transcript ? (
                <span className="text-rose-700 font-bold italic">"{transcript}"</span>
              ) : (
                <span className="text-slate-400 font-normal text-xs">
                  Ví dụ: "Số 5 điểm 8" hoặc "Số 12 vắng có phép"...
                </span>
              )}
            </div>
          </div>

          {/* Last Recognized Intent Feedback Card */}
          {parsedResult && (
            <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
              parsedResult.action !== 'unknown' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              {parsedResult.action !== 'unknown' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="font-bold text-xs">
                  {parsedResult.action !== 'unknown' ? '✅ Đã ghi nhận lệnh thành công:' : '⚠️ Chưa hiểu rõ lệnh:'}
                </div>
                <p className="text-sm font-semibold mt-0.5">
                  {parsedResult.message}
                </p>
              </div>
            </div>
          )}

          {/* Sample Commands Cheat-Sheet */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Câu lệnh mẫu (Bấm để thử nghiệm):
            </h4>
            <div className="grid grid-cols-2 gap-1.5">
              {sampleCommands.map(cmd => (
                <button
                  key={cmd}
                  onClick={() => {
                    setTranscript(cmd);
                    processTranscript(cmd);
                  }}
                  className="text-left text-[11px] font-medium text-slate-700 bg-slate-50 hover:bg-rose-50 hover:text-rose-700 border border-slate-200 p-2 rounded-lg transition"
                >
                  🗣️ "{cmd}"
                </button>
              ))}
            </div>
          </div>

          {/* Recent Speech Log */}
          {history.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <h5 className="text-[11px] font-bold text-slate-500">Lịch sử nói điểm vừa rồi:</h5>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {history.map((h, i) => (
                  <div key={i} className="text-xs flex items-center justify-between p-1.5 rounded-md bg-slate-50 border border-slate-100">
                    <span className="text-slate-600 truncate max-w-[200px]">"{h.text}"</span>
                    <span className="font-semibold text-emerald-700">{h.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={continuousMode}
              onChange={(e) => setContinuousMode(e.target.checked)}
              className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
            />
            <span>Chế độ đọc điểm liên tục (Không cần bấm lại)</span>
          </label>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition shadow-xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
