# BKQuiz (ClassPlay v2.0) — Nền tảng trắc nghiệm tương tác thời gian thực

BKQuiz là website tạo và tổ chức trò chơi trắc nghiệm theo phong cách Kahoot!, phát triển từ dự án tham khảo **ClassQuiz** và cá nhân hóa giao diện theo nhận diện Đại học Bách Khoa — ĐHQG-HCM. Người tổ chức tạo bộ câu hỏi, mở phòng, điều khiển lượt chơi và tải kết quả; người chơi tham gia bằng PIN hoặc QR trên trình duyệt.

Ứng dụng hiện dùng **React + Vite + Tailwind CSS** ở frontend và **Node.js + Express + Socket.IO** ở backend, hướng tới yêu cầu đồ án:

> **Make a dynamic website (any topic) based on HTTPS (443).**

Giao diện dùng logo Bách Khoa, ảnh nền khuôn viên, bảng màu xanh/vàng và khung nội dung trong mờ. Đây là ứng dụng BKQuiz với hệ thống tài khoản riêng; không kết nối SSO/CAS của HCMUT.

---

## 📌 Nguồn gốc & sự kế thừa dự án

Nguồn dự án gốc: **[mawoka-myblock/ClassQuiz](https://github.com/mawoka-myblock/ClassQuiz)**. BKQuiz giữ mô hình sử dụng của nền tảng quiz tương tác: tạo đề → mở phòng → tham gia → trả lời theo thời gian → xếp hạng → xem kết quả. Phần frontend và backend hiện được triển khai bằng React/Node.js, khác với SvelteKit/Python của ClassQuiz.

**Mốc đối chiếu trong README:** mã nguồn ClassQuiz tại commit [`49dca85`](https://github.com/mawoka-myblock/ClassQuiz/tree/49dca859dee1a1821b056abf95c2df501eda98e1), với BKQuiz tại commit [`8a9d33d`](https://github.com/nguyenhuynhquockhanh/bkquizz/tree/8a9d33d65cc89ae5c58302238590cf899d584227), kiểm tra ngày 01/11/2026. Đây là mốc ClassQuiz dùng để đối chiếu, không phải khẳng định đó là commit được dùng lúc bắt đầu kế thừa.

Phân biệt ba nhóm thay đổi:

- **Kế thừa chức năng, triển khai lại:** luồng chơi thời gian thực, tham gia bằng PIN/QR, phóng to QR, hiển thị câu hỏi trên máy người chơi, đảo đáp án và xuất Excel. Các chức năng này đã có trong ClassQuiz.
- **Thay đổi theo phạm vi BKQuiz:** kiến trúc React/Node.js, lưu trữ JSON, dashboard quản trị, vai trò `admin`/`user`, giao diện tiếng Việt mang nhận diện Bách Khoa và triển khai một dịch vụ trên Azure.
- **Bổ sung trong BKQuiz so với mã nguồn ClassQuiz đã đối chiếu:** tùy chọn thưởng chuỗi đúng, trợ giúp 50:50/x2, đảo thứ tự câu hỏi, chọn tính điểm tốc độ hoặc chỉ đúng/sai, và tạm dừng/tiếp tục câu hỏi với đồng hồ do server quản lý. Chưa tìm thấy cơ chế tương ứng trong mã nguồn ClassQuiz ở mốc trên.

Không quy đổi các thay đổi thành tỷ lệ “35%” hay “55%”: chưa có phương pháp đo đóng góp mã nguồn để chứng minh những con số đó. Nguồn gốc ClassQuiz và [giấy phép MPL-2.0 của dự án gốc][cq-license] được ghi nhận tại đây.

---

## 📊 Bảng so sánh ClassQuiz gốc và BKQuiz hiện tại

| Hạng mục | ClassQuiz gốc — mã nguồn đã đối chiếu | BKQuiz hiện tại | Phần thay đổi / mã nguồn BKQuiz |
| :--- | :--- | :--- | :--- |
| **Công nghệ** | SvelteKit/Tailwind; Python FastAPI, ormar và python-socketio. [Nguồn][cq-stack] | React/Vite/Tailwind; Node.js Express và Socket.IO. | **Thay đổi kiến trúc** — [client/package.json](client/package.json), [server/package.json](server/package.json). |
| **Lưu trữ & triển khai** | Cấu hình Docker Compose gồm frontend, API, PostgreSQL, Redis/Valkey, Meilisearch, proxy Caddy và worker. [Nguồn][cq-compose] | Express phục vụ cả frontend đã build, API và Socket.IO; tài khoản/đề lưu JSON, phòng/phiên/lịch sử lưu RAM; workflow Azure App Service. | **Đơn giản hóa cho phạm vi đồ án**, kèm giới hạn lưu trữ và một instance — [index.js](server/src/index.js), [workflow](.github/workflows/main_bkquizz.yml). |
| **Giao diện & ngôn ngữ** | Giao diện ClassQuiz bằng Svelte, có hệ thống đa ngôn ngữ. [Nguồn][cq-frontend] | Nội dung tiếng Việt, logo và nền Bách Khoa, khung kính mờ; bố cục điện thoại/tablet/desktop, bảng quản lý chuyển thành thẻ ở màn hình hẹp. | **Thiết kế lại theo BKQuiz** — [Home.jsx](client/src/components/Home.jsx), [index.css](client/src/index.css), [nguồn ảnh](client/public/BRANDING.md). |
| **Quản trị hệ thống** | Đã có API admin xóa người dùng; `get_admin_user` chọn tài khoản tạo sớm nhất. Đường dẫn `/admin` ở frontend là màn hình chủ trò chơi. [Auth][cq-auth], [API][cq-admin], [màn hình host][cq-host] | Vai trò `admin`/`user` lưu theo từng tài khoản; dashboard tổng quan, phòng đang mở, quản lý người dùng, bộ đề và lịch sử. Admin có thể cấp quyền cho nhiều tài khoản. | **Mở rộng cách quản trị** — [AdminDashboard.jsx](client/src/components/AdminDashboard.jsx), [auth.js](server/src/auth.js), [API](server/src/index.js). |
| **Câu hỏi trên máy người chơi** | Chế độ `normal` hiển thị nội dung câu hỏi/ảnh; chế độ `kahoot` dùng giao diện trả lời khác. [Nguồn][cq-player] | Bật/tắt hiển thị câu hỏi, ảnh và chữ đáp án trong cài đặt phòng. | **Triển khai lại thành tùy chọn trực tiếp**, không phải tính năng ClassQuiz chưa có — [PlayerScreen.jsx](client/src/components/PlayerScreen.jsx). |
| **QR vào phòng & phóng to** | Đã có QR vào phòng và nhấn để mở QR lớn toàn màn hình. [Nguồn][cq-qr] | QR sinh bằng `qrcode.react`, điền PIN qua liên kết; bấm mở hộp thoại giữa màn hình, đóng bằng nút hoặc Escape. | **Triển khai lại, đồng bộ UI BKQuiz** — [HostScreen.jsx](client/src/components/HostScreen.jsx), [Modal.jsx](client/src/components/Modal.jsx). |
| **Cài đặt lượt chơi** | Có chọn chế độ `kahoot`/`normal` và đảo đáp án trước khi mở trò chơi. [Nguồn][cq-settings] | Đảo câu hỏi/đáp án, bật câu hỏi trên máy người chơi, chọn điểm tốc độ, thưởng chuỗi, trợ giúp và thời gian chung hoặc từng câu. Khóa cài đặt khi bắt đầu. | **Mở rộng nhóm tùy chỉnh** — [GameSettings.jsx](client/src/components/GameSettings.jsx), [gameSettings.js](server/src/gameSettings.js). |
| **Điểm & thưởng chuỗi đúng** | Đáp án đúng được tính điểm theo thời gian trả lời; chưa thấy thưởng chuỗi trong luồng chấm điểm đã đọc. [Nguồn][cq-socket] | Chọn điểm theo tốc độ hoặc điểm đúng cố định; tùy chọn thưởng chuỗi đúng: từ 2 câu +100, từ 3 câu +250, từ 5 câu +500. | **Bổ sung lựa chọn cách tính điểm và streak** — [gameManager.js](server/src/gameManager.js). |
| **Trợ giúp & phản ứng** | Chưa tìm thấy cơ chế 50:50, x2 điểm và gửi phản ứng emoji trong mã nguồn chơi đã đối chiếu. [Nguồn][cq-socket] | Mỗi người chơi có một lượt 50:50 và một lượt x2 khi chủ phòng bật trợ giúp; gửi emoji lên màn hình host. | **Bổ sung tương tác** — [gameManager.js](server/src/gameManager.js), [PlayerScreen.jsx](client/src/components/PlayerScreen.jsx). |
| **Tạm dừng / tiếp tục** | Có dừng thời gian để hiện lời giải (`show_solutions`); chưa thấy luồng tạm dừng rồi tiếp tục câu đang chơi. [Nguồn][cq-controls] | Host tạm dừng câu đang mở; server ngừng đồng hồ, khóa nhận đáp án và không tính thời gian dừng vào điểm tốc độ. | **Bổ sung trạng thái pause/resume** — [gameManager.js](server/src/gameManager.js), [HostScreen.jsx](client/src/components/HostScreen.jsx). |
| **Kết thúc giữa chừng** | Đã có sự kiện `get_final_results` và điều khiển lấy kết quả. [Nguồn][cq-socket], [điều khiển từ xa][cq-remote] | Nút **Kết thúc sớm** có xác nhận, chốt điểm đã nhận, đưa cả phòng tới kết quả, ghi lịch sử một lần và cho tải báo cáo. | **Xây dựng luồng kết thúc rõ ràng trong BKQuiz**, không coi việc lấy kết quả là chức năng mới hoàn toàn — [HostScreen.jsx](client/src/components/HostScreen.jsx), [gameManager.js](server/src/gameManager.js). |
| **Báo cáo Excel** | Đã có xuất kết quả `.xlsx`, đồng thời có chức năng nhập/xuất bộ đề. [Kết quả][cq-results], [nhập/xuất][cq-eximport] | Xuất bảng xếp hạng và thống kê câu hỏi thành hai sheet Excel; truy cập báo cáo theo chủ sở hữu/admin. | **Triển khai lại báo cáo theo nhu cầu BKQuiz** — [gameManager.js](server/src/gameManager.js), [API](server/src/index.js). |
| **Thông báo & xác nhận** | Đã có component modal thông báo riêng. [Nguồn][cq-alert] | Dùng hệ thống hộp thoại React chung thay `window.alert`/`confirm`, đồng bộ màu sắc, quản lý focus và khóa cuộn nền. | **Triển khai lại UI thông báo** — [DialogHost.jsx](client/src/components/DialogHost.jsx), [dialogs.js](client/src/services/dialogs.js). |

### Phạm vi hiện tại so với ClassQuiz

BKQuiz tập trung vào tạo đề thủ công, trắc nghiệm chọn đáp án/Đúng–Sai có ảnh, chơi trực tiếp, quản trị và báo cáo. ClassQuiz có phạm vi khác rộng hơn ở một số phần, như [nhiều loại câu hỏi][cq-types], [nhập đề từ Kahoot][cq-import], [tìm kiếm đề][cq-search] và [đăng nhập qua nhà cung cấp OAuth][cq-oauth]. BKQuiz hiện chưa triển khai các phần tương ứng; tính năng nhập PDF cũng không nằm trong phiên bản hiện tại.

---

## 🛠️ Quản trị hệ thống & phân quyền

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

---

## 🎮 Tạo phòng & điều khiển trò chơi

- Trong thư viện, chọn **Chơi ngay → Cài đặt** ở phòng chờ: đảo câu/đáp án, hiện câu hỏi trên máy người chơi, điểm tốc độ, thưởng chuỗi đúng, trợ giúp 50:50/x2 và thời gian chung (hoặc giữ thời gian từng câu).
- Cài đặt chỉ áp dụng cho lượt chơi, không sửa bộ câu hỏi đã lưu. Khi bắt đầu, các cài đặt được khóa. Đáp án sau khi đảo vẫn khớp màu/nút của mọi người chơi.
- Khi đang trả lời, chủ phòng có thể **Tạm dừng / Tiếp tục**. Máy chủ dừng đồng hồ, khóa nhận đáp án và loại thời gian tạm dừng khỏi điểm tốc độ.
- **Kết thúc sớm** có hộp xác nhận, giữ điểm đã ghi nhận, chuyển tất cả người chơi tới kết quả và cho tải Excel. Nếu kết thúc khi mới giới thiệu câu hỏi, câu chưa mở sẽ không được ghi là đã chơi.
- Bấm QR ở phòng chờ để phóng to giữa màn hình. Đóng bằng nút ✕ hoặc Escape.
- Các thông báo/xác nhận dùng hộp thoại chung, có quản lý focus và khóa cuộn nền. Giao diện hẹp dùng thẻ cho bảng quản lý, nội dung câu hỏi/đáp án dài được xuống dòng và cuộn được.
- Đã hoàn tác tính năng nhập PDF. Tạo/chỉnh quiz bằng trình soạn câu hỏi.

Chủ phòng ngắt kết nối khi đang chơi sẽ đóng phòng; hiện chưa có cơ chế nối lại lượt chơi sau mất kết nối. Báo cáo của lượt đã kết thúc vẫn giữ trong bộ nhớ tới khi server khởi động lại.

---

## 🚀 Hướng dẫn chạy trên máy cá nhân (Local Development)

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

### Kiểm tra chức năng và build

```sh
npm test --prefix server
npm run build --prefix client
```

Các bài test trong [server/test](server/test) kiểm tra đăng nhập, quyền user/admin, sở hữu đề, thu hồi phiên; cài đặt lượt chơi, đảo đáp án, tạm dừng/tiếp tục, kết thúc sớm và ngắt kết nối host. Test dùng dữ liệu tạm hoặc trạng thái phòng giả lập, không sửa dữ liệu sử dụng thực tế.

Để thử luồng chơi, mở hai tab: đăng nhập và mở phòng ở tab host; nhập PIN và biệt danh ở tab người chơi. Kiểm tra trả lời, tạm dừng/tiếp tục, kết thúc sớm và tải Excel. Giao diện đã được kiểm tra ở các chiều rộng 320, 390, 768 và 1440 px; đây không phải xác nhận cho mọi thiết bị/trình duyệt.

---

## 🌐 Triển khai trên Azure App Service (HTTPS — Port 443)

Workflow [.github/workflows/main_bkquizz.yml](.github/workflows/main_bkquizz.yml) được cấu hình cài dependency, build, test và deploy khi push lên `main`. Azure Web App dùng Node.js 24, startup command `npm start`, biến `NODE_ENV=production` và cổng `PORT` do môi trường cấp. Cần cấu hình các GitHub Actions secrets được workflow tham chiếu để đăng nhập Azure.

Mô hình triển khai: **Trình duyệt → HTTPS 443 tại Azure → Express/API/Socket.IO qua cổng HTTP nội bộ**. Frontend, API và Socket.IO dùng chung origin. Website có xử lý động ở server: xác thực, lưu bộ đề, tạo phòng, nhận đáp án, tính điểm và xuất báo cáo; không chỉ phục vụ trang HTML tĩnh.

Bật HTTPS Only trên Azure và kiểm tra URL triển khai thực tế: chứng chỉ hợp lệ, HTTP chuyển sang HTTPS, API và Socket.IO hoạt động trên cùng HTTPS origin. Build thành công hoặc chữ HTTPS trên giao diện không thay thế việc kiểm tra TLS thực tế.

### Dữ liệu sau triển khai

Đặt `DATA_DIR` tới thư mục bền vững và chuẩn bị dữ liệu tài khoản/đề ban đầu như phần lưu trữ ở trên. Chạy một server instance trong phiên bản hiện tại. Khởi động lại server làm mất phiên đăng nhập, phòng và lịch sử lượt chơi đang giữ trong RAM; muốn giữ báo cáo lâu dài cần tải Excel hoặc bổ sung lưu trữ lịch sử.

---

## 🖼️ Logo & hình nền

Logo có nền giữa và viền trắng do chủ repo cung cấp; component và favicon dùng chung `client/public/hcmut-mark.svg`. Xem `client/public/BRANDING.md` để biết cách hiển thị và nguồn tham khảo.

<!-- Liên kết cố định tới mã nguồn ClassQuiz dùng để đối chiếu. -->
[cq-license]: https://github.com/mawoka-myblock/ClassQuiz/blob/49dca859dee1a1821b056abf95c2df501eda98e1/LICENSE
[cq-stack]: https://github.com/mawoka-myblock/ClassQuiz/blob/49dca859dee1a1821b056abf95c2df501eda98e1/README.md
[cq-compose]: https://github.com/mawoka-myblock/ClassQuiz/blob/49dca859dee1a1821b056abf95c2df501eda98e1/docker-compose.yml
[cq-frontend]: https://github.com/mawoka-myblock/ClassQuiz/tree/49dca859dee1a1821b056abf95c2df501eda98e1/frontend/src
[cq-auth]: https://github.com/mawoka-myblock/ClassQuiz/blob/49dca859dee1a1821b056abf95c2df501eda98e1/classquiz/auth.py
[cq-admin]: https://github.com/mawoka-myblock/ClassQuiz/blob/49dca859dee1a1821b056abf95c2df501eda98e1/classquiz/routers/admin.py
[cq-host]: https://github.com/mawoka-myblock/ClassQuiz/blob/49dca859dee1a1821b056abf95c2df501eda98e1/frontend/src/routes/admin/+page.svelte
[cq-player]: https://github.com/mawoka-myblock/ClassQuiz/blob/49dca859dee1a1821b056abf95c2df501eda98e1/frontend/src/lib/play/question.svelte
[cq-qr]: https://github.com/mawoka-myblock/ClassQuiz/blob/49dca859dee1a1821b056abf95c2df501eda98e1/frontend/src/lib/play/admin/game_not_started.svelte
[cq-settings]: https://github.com/mawoka-myblock/ClassQuiz/blob/49dca859dee1a1821b056abf95c2df501eda98e1/frontend/src/lib/dashboard/start_game.svelte
[cq-socket]: https://github.com/mawoka-myblock/ClassQuiz/blob/49dca859dee1a1821b056abf95c2df501eda98e1/classquiz/socket_server/__init__.py
[cq-controls]: https://github.com/mawoka-myblock/ClassQuiz/blob/49dca859dee1a1821b056abf95c2df501eda98e1/frontend/src/lib/play/admin/controls.svelte
[cq-remote]: https://github.com/mawoka-myblock/ClassQuiz/blob/49dca859dee1a1821b056abf95c2df501eda98e1/frontend/src/routes/remote/+page.svelte
[cq-results]: https://github.com/mawoka-myblock/ClassQuiz/blob/49dca859dee1a1821b056abf95c2df501eda98e1/classquiz/routers/results.py
[cq-eximport]: https://github.com/mawoka-myblock/ClassQuiz/blob/49dca859dee1a1821b056abf95c2df501eda98e1/classquiz/routers/eximport.py
[cq-alert]: https://github.com/mawoka-myblock/ClassQuiz/blob/49dca859dee1a1821b056abf95c2df501eda98e1/frontend/src/lib/modals/alert.svelte
[cq-types]: https://github.com/mawoka-myblock/ClassQuiz/blob/49dca859dee1a1821b056abf95c2df501eda98e1/frontend/src/lib/quiz_types.ts
[cq-import]: https://github.com/mawoka-myblock/ClassQuiz/tree/49dca859dee1a1821b056abf95c2df501eda98e1/classquiz/kahoot_importer
[cq-search]: https://github.com/mawoka-myblock/ClassQuiz/blob/49dca859dee1a1821b056abf95c2df501eda98e1/frontend/src/routes/search/+page.svelte
[cq-oauth]: https://github.com/mawoka-myblock/ClassQuiz/tree/49dca859dee1a1821b056abf95c2df501eda98e1/classquiz/oauth
