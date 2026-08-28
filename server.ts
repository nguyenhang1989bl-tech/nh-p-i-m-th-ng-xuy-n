import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// In-memory sync room cache for cross-device real-time collaboration (Phone <-> PC)
interface SyncRoomData {
  session: any;
  version: number;
  updatedAt: string;
}
const syncRooms: Record<string, SyncRoomData> = {};

// Lazy initialization for Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// 1. Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    aiAvailable: !!process.env.GEMINI_API_KEY,
  });
});

// 2. Real-Time Sync API for Rooms
app.get('/api/sync/room/:roomId', (req, res) => {
  const roomId = req.params.roomId.trim().toUpperCase();
  const room = syncRooms[roomId];
  if (!room) {
    return res.status(404).json({ error: 'Phòng đồng bộ chưa có dữ liệu hoặc đã hết hạn' });
  }
  res.json({
    success: true,
    roomId,
    session: room.session,
    version: room.version,
    updatedAt: room.updatedAt,
  });
});

app.post('/api/sync/room/:roomId', (req, res) => {
  const roomId = req.params.roomId.trim().toUpperCase();
  const { session } = req.body;

  if (!session) {
    return res.status(400).json({ error: 'Thiếu dữ liệu session' });
  }

  const current = syncRooms[roomId];
  const newVersion = current ? (current.version + 1) : 1;

  syncRooms[roomId] = {
    session,
    version: newVersion,
    updatedAt: new Date().toISOString(),
  };

  res.json({
    success: true,
    roomId,
    version: newVersion,
    updatedAt: syncRooms[roomId].updatedAt,
  });
});

// 3. Gemini AI Smart Voice Parser API
app.post('/api/ai/parse-voice', async (req, res) => {
  try {
    const { transcript, studentList, currentPairIndex } = req.body;

    if (!transcript || typeof transcript !== 'string') {
      return res.status(400).json({ error: 'Thiếu nội dung giọng nói' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        fallback: true,
        message: 'AI key không khả dụng, sử dụng bộ phân tích cục bộ tốc độ cao',
      });
    }

    const prompt = `Bạn là trợ lý giáo viên phân tích câu khẩu lệnh chấm điểm bằng giọng nói trong tiết học tại Việt Nam.
Câu nói của giáo viên: "${transcript}"
Danh sách học sinh trong lớp (nếu có): ${JSON.stringify((studentList || []).map((s: any) => ({ stt: s.stt, name: s.name })))}
Cặp cột điểm hiện tại đang xem: ${currentPairIndex || 1}

Hãy trích xuất thông tin lệnh:
- action: "set_score" (nhập điểm), "add_bonus" (cộng điểm phát biểu), "sub_bonus" (trừ điểm), "set_attendance" (điểm danh vắng/muộn), "unknown"
- studentStt: số thứ tự của học sinh (số nguyên 1-50 nếu tìm thấy)
- studentName: tên học sinh nếu có
- score: số điểm (từ 0 đến 10, hỗ trợ số thập phân như 8.5, 9.25...)
- columnIndex: số thứ tự cột điểm (1, 2, 3, 4...)
- attendance: "present", "absent" (vắng), "late" (muộn), "excused" (vắng phép)
- message: câu thông báo tóm tắt ngắn gọn tiếng Việt cho giáo viên biết đã thực hiện gì.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            action: { type: Type.STRING, enum: ['set_score', 'add_bonus', 'sub_bonus', 'set_attendance', 'unknown'] },
            studentStt: { type: Type.INTEGER },
            studentName: { type: Type.STRING },
            score: { type: Type.NUMBER },
            columnIndex: { type: Type.INTEGER },
            attendance: { type: Type.STRING, enum: ['present', 'absent', 'late', 'excused'] },
            message: { type: Type.STRING },
          },
          required: ['action', 'message'],
        },
      },
    });

    const parsedJson = JSON.parse(response.text || '{}');
    res.json({
      success: true,
      data: {
        rawText: transcript,
        ...parsedJson,
        confidence: 0.98,
      },
    });
  } catch (err: any) {
    console.error('AI Voice parse error:', err);
    res.json({
      fallback: true,
      error: err.message,
    });
  }
});

// Setup Vite development server or static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Sổ Điểm Tiết Học server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
