# 📝 Hệ thống Soạn thảo Văn bản Cộng tác (Google Docs Clone)

Dự án đồ án môn học: Xây dựng một ứng dụng web cho phép nhiều người dùng cùng soạn thảo văn bản theo thời gian thực, tương tự như Google Docs.

## 🚀 Các tính năng chính

- **Soạn thảo thời gian thực (Real-time Collaboration):** Nhiều người dùng cùng chỉnh sửa một tài liệu đồng thời mà không bị xung đột (Sử dụng CRDT thông qua Yjs & Liveblocks).
- **Live Cursors & Presence:** Hiển thị con trỏ chuột, vùng chọn (selection) và trạng thái online của những người dùng khác trong thời gian thực.
- **Rich Text Editor:** Hỗ trợ định dạng văn bản (Bold, Italic, Underline), Heading, căn lề, danh sách (Bullet/Ordered list), bảng, chèn ảnh, highlight, thay đổi font chữ và kích thước chữ.
- **Bình luận (Comments & Threads):** Chọn một đoạn văn bản và để lại bình luận, hỗ trợ thảo luận trực tiếp trên tài liệu.
- **Xác thực người dùng:** Đăng nhập an toàn qua Clerk (Hỗ trợ Google, Email).
- **Quản lý Tổ chức (Organizations):** Cho phép làm việc nhóm thông qua tính năng Organizations của Clerk.
- **Quản lý tài liệu:** Tạo mới, đổi tên, xóa và tìm kiếm tài liệu. Cung cấp sẵn một số template (Letter, Resume, Proposal).
- **Lưu trữ dữ liệu an toàn:** Metadata của tài liệu được lưu trên Convex DB, nội dung chi tiết được lưu trên Liveblocks Cloud.
- **Xuất tài liệu:** Hỗ trợ xuất file dưới dạng PDF, HTML, JSON, hoặc Text.

## 🛠 Công nghệ sử dụng

- **Frontend:** Next.js 15, React 19, Tailwind CSS, shadcn/ui.
- **Editor:** TipTap (dựa trên ProseMirror).
- **Realtime Engine & CRDT:** Liveblocks.
- **Cơ sở dữ liệu (Database):** Convex (Serverless Database).
- **Xác thực (Authentication):** Clerk.

---

## 💻 Hướng dẫn Cài đặt & Chạy dự án Local

### Bước 1: Yêu cầu hệ thống
- Cài đặt **Node.js** (phiên bản 18 trở lên).
- Cài đặt **Git**.

### Bước 2: Clone dự án và cài đặt thư viện
Mở terminal và chạy các lệnh sau:

```bash
git clone https://github.com/huykbhb04/HeThongPhanTan_PTIT.git
cd HeThongPhanTan_PTIT
npm install --legacy-peer-deps
```

### Bước 3: Cấu hình biến môi trường (.env.local)
Tạo một file tên là `.env.local` ở thư mục gốc của dự án và thêm các khóa sau (xem hướng dẫn lấy khóa ở bên dưới):

```env
# Clerk Auth Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Convex URL
NEXT_PUBLIC_CONVEX_URL=your_convex_url

# Liveblocks Secret Key
LIVEBLOCKS_SECRET_KEY=your_liveblocks_secret_key
```

### Bước 4: Khởi động Convex & Ứng dụng Next.js
Bạn cần mở **2 cửa sổ Terminal** riêng biệt:

**Terminal 1:** Khởi động và đồng bộ Convex (Cơ sở dữ liệu)
```bash
npx convex dev
```

**Terminal 2:** Khởi động ứng dụng Next.js
```bash
npm run dev
```
Sau đó truy cập vào [http://localhost:3000](http://localhost:3000) để sử dụng ứng dụng.

---

## 🔑 Hướng dẫn lấy các API Key

### 1. Clerk (Hệ thống xác thực)
1. Truy cập [Clerk.com](https://clerk.com/) và tạo tài khoản.
2. Tạo một Application mới. Chọn các phương thức đăng nhập bạn muốn (ví dụ: Google, Email).
3. Sau khi tạo xong, vào trang Dashboard của App, mục **API Keys**.
4. Copy `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` và `CLERK_SECRET_KEY` dán vào file `.env.local`.
5. **Cấu hình tích hợp Clerk với Convex:** 
   - Trong giao diện Clerk Dashboard, tìm mục **JWT Templates** ở menu bên trái.
   - Nhấn **New Template** và chọn mẫu **Convex**.
   - Copy mục `Issuer` (ví dụ: `https://your-issuer.clerk.accounts.dev`).
   - Mở file `convex/auth.config.ts` trong source code và thay thế giá trị `domain` bằng URL Issuer vừa copy.

### 2. Convex (Cơ sở dữ liệu)
1. Truy cập [Convex.dev](https://www.convex.dev/) và đăng nhập (có thể dùng Github).
2. Khi bạn chạy lệnh `npx convex dev` lần đầu trong terminal, trình duyệt sẽ tự động mở lên yêu cầu bạn đăng nhập và chọn/tạo dự án Convex.
3. Sau khi chấp nhận, Convex sẽ tự động cấu hình và ghi URL dự án vào file `.env.local` của bạn dưới dạng biến `NEXT_PUBLIC_CONVEX_URL` (bạn không cần copy bằng tay).

### 3. Liveblocks (Hệ thống Realtime & Đồng bộ)
1. Truy cập [Liveblocks.io](https://liveblocks.io/) và tạo tài khoản.
2. Tạo một Project mới.
3. Trong giao diện Project, chuyển sang tab **API Keys**.
4. Tìm phần **Secret Keys** (chú ý lấy Secret Key bắt đầu bằng `sk_`, **KHÔNG** lấy Public Key `pk_`).
5. Copy Secret Key và dán vào file `.env.local` tại biến `LIVEBLOCKS_SECRET_KEY`.

---

## 🤝 Hướng dẫn kiểm thử cộng tác (Test Real-time)
1. Mở ứng dụng ở Tab bình thường (Chrome/Edge) và đăng nhập bằng Tài khoản A.
2. Mở một Tab Ẩn danh (Incognito Window) và đăng nhập bằng Tài khoản B.
3. Ở Tài khoản A, tạo một tài liệu mới và copy URL tài liệu trên thanh địa chỉ.
4. Ở Tài khoản B, dán URL đó vào thanh địa chỉ để mở tài liệu.
5. Để hai cửa sổ cạnh nhau, bạn sẽ thấy con trỏ chuột của người kia và nội dung cập nhật theo thời gian thực (độ trễ < 100ms).

---
*Dự án được xây dựng cho mục đích học tập môn Hệ thống Phân tán.*
