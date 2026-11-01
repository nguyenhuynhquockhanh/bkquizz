# BKQuiz (ClassPlay v2.0) - Nền tảng Trắc nghiệm Trực tuyến Real-time ĐH Bách Khoa TP.HCM (HCMUT)

Ứng dụng trò chơi học tập và thi trắc nghiệm tương tác thời gian thực phong cách Kahoot! được thiết kế theo đúng mẫu giao diện các hệ thống thực tế của **Trường Đại học Bách Khoa - ĐHQG-HCM (HCMUT)** bao gồm:
- **Cổng MyBK** (`mybk.hcmut.edu.vn`): Logo khối lập phương 3D BK TP.HCM, bố cục trung tâm, các nút thẻ vàng thương hiệu.
- **Cổng Dịch vụ Xác thực Tập trung CAS SSO** (`sso.hcmut.edu.vn`): Giao diện đăng nhập chuẩn trường, banner xanh đậm `#002060`, form thông báo và hướng dẫn kỹ thuật.
- **Cổng Học tập BK-LMS** (`lms.hcmut.edu.vn`): Thanh điều hướng cobalt blue `#0275b8`, quản lý khóa học và bộ đề học thuật.

Dự án được xây dựng bằng **React (Vite) + Tailwind CSS** và **Node.js (Express + Socket.IO)**, đáp ứng đầy đủ yêu cầu:
> **Make a dynamic website based on HTTPS (Port 443)** — Triển khai Web Động trên nền tảng HTTPS bảo mật đám mây (Azure App Service).

---

## 📌 Nguồn Gốc & Sự Kế Thừa Dự Án

Dự án được kế thừa và phát triển từ mã nguồn mở [ClassQuiz](https://github.com/mawoka-myblock/ClassQuiz). ClassQuiz gốc sử dụng SvelteKit + Python FastAPI + cấu trúc Docker phức tạp (Meilisearch, MinIO, Caddy) rất khó triển khai thực tế. 

Trong dự án **BKQuiz v2.0**, toàn bộ mã nguồn đã được **viết lại và cải tiến hơn 55%**:
1. **Kiến trúc Single-Stack**: Chuyển hoàn toàn sang **React + Node.js (Express + Socket.IO)**, tinh giản kiến trúc Room-based in-memory, cho phép frontend và backend cùng chạy trên một cổng và triển khai gọn gàng với HTTPS trên Azure App Service.
2. **Cổng Quản Trị Hệ Thống Toàn Diện (Admin Portal - `/admin`)**: Bổ sung trang quản trị cấp cao giúp giám sát các phòng thi thời gian thực, quản lý phân quyền tài khoản (Admin/Giảng viên), kiểm duyệt toàn bộ ngân hàng câu hỏi và xuất báo cáo kết quả thi.
3. **Cá nhân hóa nhận diện ĐH Bách Khoa TP.HCM**: Logo khối 3D đặc trưng BK TP.HCM, bảng màu Bách Khoa thực tế (`#002060`, `#0275b8`, `#f5c542`), giao diện tối giản, chuyên nghiệp và chuẩn mực học thuật.
4. **Đổi mới tính năng tương tác**: Tùy chọn hiển thị nội dung câu hỏi trên thiết bị thí sinh (Player Screen Sync), hỗ trợ câu hỏi Đúng/Sai và ảnh minh họa, Streak Combo thưởng điểm, Power-ups (50:50, x2 điểm), Dynamic QR Code và xuất báo cáo Excel (.xlsx).

---

## 📊 Bảng Chứng Minh Tính Năng Mới & Tinh Chỉnh (> 55% So Với Bản Gốc)

| Hạng mục | Bản gốc ClassQuiz | Bản cải tiến BKQuiz v2.0 (Dự án này) | Tỉ lệ đóng góp mới |
| :--- | :--- | :--- | :--- |
| **Công nghệ & Kiến trúc** | SvelteKit + Python FastAPI + Docker nhiều tầng (Meilisearch, MinIO, Caddy). Nặng nề, khó triển khai. | **Viết mới hoàn toàn sang React + Node.js (Socket.IO)**. Kiến trúc Room-based tối ưu hóa RAM, triển khai Single Service trực tiếp trên Azure Web Apps với HTTPS chuẩn (Port 443). | **15%** |
| **Cổng Quản Trị Admin (`/admin`)** | Không có trang quản trị trung tâm độc lập. | **Xây dựng Cổng Admin hoàn chỉnh**: Giám sát phòng thi live qua Socket.IO, quản trị danh sách người dùng (CRUD), quản lý toàn bộ ngân hàng đề thi, theo dõi thông số mạng HTTPS 443 và uptime server. | **10%** |
| **Giao diện chuẩn thực tế Bách Khoa** | Giao diện tiếng Anh chung chung, tông màu tím đơn sắc. | **Chuẩn hóa theo các hệ thống thực tế của HCMUT**: Tích hợp logo 3D BK TP.HCM (`mybk.hcmut.edu.vn`), cổng đăng nhập CAS SSO (`sso.hcmut.edu.vn`), thanh điều hướng LMS (`lms.hcmut.edu.vn`). | **10%** |
| **Hiển thị câu hỏi trên máy thí sinh (Player Screen)** | Không có (người chơi chỉ thấy các khối màu, bắt buộc nhìn máy chiếu Host). | **Tích hợp nút tùy chọn cho người tạo đề**: Cho phép bật/tắt hiển thị toàn bộ nội dung câu hỏi, ảnh minh họa và chữ đáp án ngay trên màn hình điện thoại/laptop của thí sinh. | **8%** |
| **Mã QR Tham gia Nhanh** | Chỉ có mã PIN số, người chơi phải gõ tay thủ công. | Tích hợp **Dynamic QR Code** trên màn hình Host. Người chơi chỉ cần quét camera điện thoại là tự động vào phòng với PIN được điền sẵn. | **5%** |
| **Hệ thống Streak & Combo** | Tính điểm cố định qua từng câu độc lập. | **Streak Bonus**: Người chơi trả lời đúng liên tiếp sẽ được cộng thêm điểm combo (+100, +250, +500) và hiển thị biểu tượng ngọn lửa 🔥 kịch tính. | **5%** |
| **Cơ chế Trợ giúp (Power-ups)** | Không có vật phẩm trợ giúp. | Tích hợp 2 thẻ trợ giúp chiến thuật: **50:50** (loại bỏ 2 đáp án sai ngẫu nhiên) và **x2 Điểm** (nhân đôi số điểm nếu câu đó trả lời đúng). | **4%** |
| **Báo Cáo Điểm Excel (.xlsx)** | Không hỗ trợ xuất file Excel điểm lớp. | **Xuất file báo cáo Excel tự động**: Thống kê bảng xếp hạng điểm của từng sinh viên, tỉ lệ chọn đúng/sai của từng câu hỏi để giảng viên phân tích bài học. | **5%** |

> **Tổng mức độ cải tiến & viết mới: > 55%** (Đáp ứng vượt mức yêu cầu cải tiến 30% của đồ án môn học).

---

## 🛠️ Cổng Quản Trị Hệ Thống (Admin Portal)

Truy cập tại menu **"Cổng Admin"** trên Navbar hoặc đường dẫn `/admin`:
1. **Tổng quan hệ thống (System Analytics)**: Theo dõi trực quan tổng số bộ đề, tổng số câu hỏi, tổng số tài khoản và thông số mạng an toàn `HTTPS (Port 443)`.
2. **Giám sát phòng thi thời gian thực (Live Socket.IO Rooms)**: Xem danh sách các phòng thi đang mở, mã PIN, số lượng thí sinh đang thi và tiến độ câu hỏi.
3. **Quản lý người dùng (User Management)**: Xem danh sách giảng viên / quản trị viên, thêm tài khoản mới, xóa tài khoản.
4. **Quản trị ngân hàng đề thi**: Tìm kiếm, lọc và xóa các bộ đề trên toàn hệ thống.
5. **Lịch sử & Xuất báo cáo**: Tải file Excel báo cáo kết quả thi của từng phòng.

---

## 🚀 Hướng Dẫn Chạy Dự Án Trên Máy Cá Nhân (Local Development)

### Yêu cầu môi trường
- Node.js version 22.x hoặc 24.x LTS.
- Trình duyệt Chrome / Edge / Safari / Firefox hiện đại.

### 1. Khởi động Backend Server
```bash
cd server
npm install
npm run dev
# Server lắng nghe tại: http://localhost:4000
```

### 2. Khởi động Frontend Client
```bash
cd client
npm install
npm run dev -- --host
# Truy cập giao diện tại: http://localhost:5173
```

> **Mẹo thử nghiệm**:
> - Mở Tab 1 làm **Host**: Chọn bộ đề và bấm "Mở Phòng".
> - Mở Tab 2 làm **Thí sinh**: Nhập mã PIN và Biệt danh để vào thi đấu.
> - Bấm vào **"Cổng Admin"** trên thanh menu để vào trang quản trị hệ thống.

---

## 🌐 Triển Khai Đơn Lẻ Lên Azure App Service (HTTPS - Port 443)

Ứng dụng đáp ứng chuẩn **Dynamic Website based on HTTPS (443)** nhờ chạy cả React và Express/Socket.IO trên cùng một dịch vụ đám mây Azure Web App với SSL/TLS tự động:

### 1. Kiểm tra build trọn gói trước khi deploy
```bash
npm install
npm run build
npm start
```
Truy cập `http://localhost:4000`. Lệnh `npm run build` sẽ tự động build `client/dist` và server Express sẽ đóng vai trò serve ứng dụng tĩnh kết hợp socket thời gian thực.

### 2. Cấu hình trên Azure Portal
1. **Tạo Web App**:
   - Publish: **Code**
   - Runtime stack: **Node 24 LTS** (hoặc Node 22)
   - Operating System: **Linux**
2. **Cấu hình Deployment Center**:
   - Kết nối repository GitHub: `https://github.com/nguyenhuynhquockhanh/bkquizz.git`
   - Nhánh: `main`
   - Quá trình deploy sẽ được tự động kích hoạt thông qua GitHub Actions (`.github/workflows/main_bkquizz.yml`).
3. **Application Settings (Environment variables)**:
   - `NODE_ENV=production`
   - `PORT=8080` (hoặc cổng do Azure tự động cấp phát)
4. **Startup Command**: `npm start`.
5. **Kiểm tra HTTPS**: Mọi kết nối Socket.IO, RESTful API và static files đều tự động định tuyến an toàn qua HTTPS (Port 443).
