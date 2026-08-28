# 📚 Sổ Theo Dõi Kết Quả Học Tập Từng Tiết Học

Ứng dụng sổ theo dõi và chấm điểm dành cho giáo viên bộ môn: Tích điểm nhanh 1 chạm, nhận diện giọng nói tiếng Việt, tự động tính trung bình 2 cột điểm (bôi đỏ), xuất báo cáo Excel (.xlsx), chế độ ngoại tuyến (Offline) và đồng bộ thời gian thực đa thiết bị.

---

## 🚀 Hướng Dẫn Đồng Bộ & Triển Khai Lên Vercel Qua GitHub

### Bước 1: Xuất dự án từ AI Studio sang GitHub
1. Tại giao diện Google AI Studio Build, nhấn vào biểu tượng **Settings (Cài đặt)** hoặc **Share/Export** ở góc trên cùng bên phải.
2. Chọn **Export to GitHub** (hoặc **Export to ZIP** nếu bạn muốn đẩy thủ công lên kho lưu trữ GitHub của mình).
3. Đăng nhập tài khoản GitHub và chọn kho lưu trữ (Repository) muốn tạo/liên kết. AI Studio sẽ tự động push toàn bộ mã nguồn lên GitHub.

### Bước 2: Kết nối & Triển khai trên Vercel
1. Truy cập vào [Vercel Dashboard](https://vercel.com/dashboard) và đăng nhập bằng GitHub.
2. Nhấn nút **Add New...** -> **Project**.
3. Chọn Repository vừa tạo từ GitHub rồi nhấn **Import**.
4. Cấu hình cài đặt dự án (Project Settings):
   - **Framework Preset**: `Vite` (Vercel tự động nhận diện từ `vercel.json`).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. **Cấu hình biến môi trường (Environment Variables)**:
   - Thêm biến `GEMINI_API_KEY` với giá trị là Google Gemini API Key của bạn (nếu muốn sử dụng tính năng phân tích giọng nói nâng cao bằng AI).
6. Nhấn nút **Deploy**.

Sau 1-2 phút, dự án sẽ được triển khai thành công với liên kết truy cập miễn phí vĩnh viễn dạng `https://your-project-name.vercel.app`.

---

## 🛠️ Chạy Thử Ở Môi Trường Local

```bash
# Cài đặt thư viện
npm install

# Khởi chạy server phát triển
npm run dev

# Kiểm tra cú pháp TypeScript
npm run lint

# Build production
npm run build
```
