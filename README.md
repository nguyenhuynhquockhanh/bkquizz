# BKQuiz

Website trắc nghiệm tương tác, dùng React/Vite/Tailwind và Express/Socket.IO. Dự án ghi nhận nguồn tham khảo ban đầu là [ClassQuiz](https://github.com/mawoka-myblock/ClassQuiz); bản hiện tại dùng kiến trúc React + Node.js riêng.

## Đăng nhập và phân quyền

- Chọn **Đăng nhập** ở trang chủ hoặc góc phải. Dùng tên đăng nhập hoặc email bất kỳ đã đăng ký với BKQuiz; không yêu cầu email HCMUT và không kết nối SSO/CAS của trường.
- Tài khoản đăng ký mới luôn có quyền `user`, kể cả khi client tự gửi `role: admin`.
- Tài khoản quản trị tạm: tên đăng nhập `admin`; mật khẩu khởi tạo được cung cấp riêng trong cuộc trao đổi triển khai.
- Chỉ tài khoản `admin` thấy menu **Quản trị**. Truy cập `/admin` hoặc API trực tiếp không bỏ qua kiểm tra quyền.

### Thêm admin

1. Đăng nhập tài khoản admin.
2. Mở **Quản trị → Quản lý Người dùng → Thêm tài khoản mới**.
3. Nhập họ tên, tên đăng nhập/email và mật khẩu, chọn **Vai trò → Quản trị viên**, rồi **Lưu Tài Khoản**.
4. Với tài khoản đã tồn tại, đổi ô **Vai trò** trong bảng thành **Quản trị viên**.

Không thể tự xóa hay tự hạ quyền tài khoản đang đăng nhập. Tài khoản thường chỉ quản lý đề và báo cáo của mình; admin có thể quản lý toàn hệ thống. Người tham gia bằng PIN không bắt buộc đăng nhập.

### Lưu trữ và phiên đăng nhập

- Tài khoản nằm trong `server/src/data/users.json`, gồm `id`, `name`, `email` (tên đăng nhập hoặc email), `role`, `passwordHash`, `createdAt`.
- Mật khẩu dùng scrypt với salt riêng; mật khẩu rõ từ dữ liệu cũ được chuyển đổi khi server khởi động.
- Token ngẫu nhiên lưu trong sessionStorage của tab; server xác thực token và đọc lại quyền hiện tại với mỗi yêu cầu. Phiên hết hạn sau 12 giờ, bị thu hồi khi đăng xuất, và mất khi server khởi động lại.
- Dữ liệu JSON mặc định nằm cùng mã nguồn và có thể bị thay thế khi deploy. Muốn giữ dữ liệu, đặt `DATA_DIR` trỏ tới thư mục lưu trữ bền vững, có sẵn `users.json` và `quizzes.json`. Không ghi đè dữ liệu đang dùng bằng file seed mỗi lần deploy.
- Phòng thi và lịch sử trận đang lưu trong bộ nhớ; chưa hỗ trợ nhiều server instance dùng chung phiên/phòng.

## Điều khiển trò chơi

- Trong thư viện, chọn **Chơi ngay → Cài đặt** ở phòng chờ: đảo câu/đáp án, hiện câu hỏi trên máy người chơi, điểm tốc độ, thưởng chuỗi đúng, trợ giúp 50:50/x2 và thời gian chung (hoặc giữ thời gian từng câu).
- Cài đặt chỉ áp dụng cho lượt chơi, không sửa bộ câu hỏi đã lưu. Khi bắt đầu, các cài đặt được khóa. Đáp án sau khi đảo vẫn khớp màu/nút của mọi người chơi.
- Khi đang trả lời, chủ phòng có thể **Tạm dừng / Tiếp tục**. Máy chủ dừng đồng hồ, khóa nhận đáp án và loại thời gian tạm dừng khỏi điểm tốc độ.
- **Kết thúc sớm** có hộp xác nhận, giữ điểm đã ghi nhận, chuyển tất cả người chơi tới kết quả và cho tải Excel. Nếu kết thúc khi mới giới thiệu câu hỏi, câu chưa mở sẽ không được ghi là đã chơi.
- Bấm QR ở phòng chờ để phóng to giữa màn hình. Đóng bằng nút ✕ hoặc Escape.
- Các thông báo/xác nhận dùng hộp thoại chung, có quản lý focus và khóa cuộn nền. Giao diện hẹp dùng thẻ cho bảng quản lý, nội dung câu hỏi/đáp án dài được xuống dòng và cuộn được.
- Đã hoàn tác tính năng nhập PDF. Tạo/chỉnh quiz bằng trình soạn câu hỏi.

Chủ phòng ngắt kết nối khi đang chơi sẽ đóng phòng; hiện chưa có cơ chế nối lại lượt chơi sau mất kết nối. Báo cáo của lượt đã kết thúc vẫn giữ trong bộ nhớ tới khi server khởi động lại.

## Chạy local

Cần Node.js 22.12+ hoặc 24.

```sh
npm install
npm run build
npm start
```

Mở `http://localhost:4000`. Để phát triển frontend riêng:

```sh
cd client
npm ci
npm run dev
```

Vite proxy `/api` và `/socket.io` tới backend cổng 4000. Mặc định frontend và API dùng cùng origin; token xác thực được gửi trong Authorization header và Socket.IO handshake.

## Kiểm tra

```sh
npm test --prefix server
npm run build --prefix client
```

Test API tạo thư mục dữ liệu tạm, kiểm tra đăng nhập, quyền user/admin, chống tự nâng quyền, sở hữu đề, đổi quyền, xóa tài khoản và thu hồi phiên. Không sửa dữ liệu sử dụng thực tế.

## Triển khai HTTPS 443 trên Azure

Workflow `.github/workflows/main_bkquizz.yml` build và deploy khi push lên `main`. Startup command: `npm start`. Azure tiếp nhận HTTPS ở cổng 443, chuyển tiếp tới cổng HTTP nội bộ do `PORT` quy định.

Bật HTTPS Only trên Azure và kiểm tra URL triển khai thực tế: chứng chỉ hợp lệ, HTTP chuyển sang HTTPS, API và Socket.IO hoạt động trên cùng HTTPS origin. Build thành công hoặc chữ HTTPS trên giao diện không thay thế việc kiểm tra TLS thực tế.

## Logo

Logo có nền giữa và viền trắng do chủ repo cung cấp; component và favicon dùng chung `client/public/hcmut-mark.svg`. Xem `client/public/BRANDING.md` để biết cách hiển thị và nguồn tham khảo.
