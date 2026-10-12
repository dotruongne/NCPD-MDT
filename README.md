# Novaris City NCPD MDT – Standalone Web (FiveM Roleplay)

Next.js 14 (App Router) · TypeScript · Tailwind · Prisma · Supabase PostgreSQL. Chạy độc lập, không cần kết nối server game.

## Cài đặt

```bash
npm install
cp .env.example .env        # điền DATABASE_URL, DIRECT_URL (Supabase) và SESSION_SECRET
npx prisma db push          # tạo bảng
npm run db:seed             # tạo tài khoản chief / admin123 + bộ luật mẫu (ĐỔI MẬT KHẨU NGAY)
npm run dev                 # http://localhost:3000
```

## Cấu trúc

```
prisma/schema.prisma, seed.ts   Database schema + dữ liệu mẫu
lib/                            db, auth (JWT cookie + phân quyền), codes (10-codes/Miranda/SOP), utils
middleware.ts                   Chặn /mdt khi chưa có session
app/(public)/                   Citizen landing page, city code lookup, recruitment form and legacy redirects
app/login/                      Đăng nhập sĩ quan
app/mdt/                        Dashboard, database(+citizens/[id]), personnel(+[id]), dispatch, reports(+new), ops, traffic, leave, hr, internal-affairs, audit, settings, departments (+ actions.ts)
app/api/search/route.ts         Global Search Ctrl+K
components/                     mdt-shell (tab, compact, Ctrl+K), report-builder (tính phạt, nháp, Discord), ui
```

## Phân quyền
- OFFICER: dùng CSDL, báo cáo, BOLO.
- SUPERVISOR: thêm đăng thông báo, ra/sửa lệnh truy nã, xử lý báo án công dân.
- ACCOUNTING: xem bảng lương tạm tính theo giờ On-Duty và mức lương/giờ đã cấu hình.
- FTO: truy cập công cụ đào tạo, phân công học viên, nhật ký huấn luyện và đánh giá.
- Rank Deputy Chief of Police: được xem Phòng Tài chính và FTO, đồng thời quản lý nhân sự/học viện như High Command; không tự động có các quyền High Command ngoài phạm vi nhân sự.
- HIGH_COMMAND: toàn bộ + trang Nội bộ (roster, rank, tuyển dụng, chấm công), xóa lệnh truy nã.
- HIGH_COMMAND và Deputy Chief of Police: xem/tạo/cập nhật hồ sơ Nội vụ (khiếu nại, kỷ luật) và xem nhật ký thao tác. IA và audit được giới hạn phía server; hồ sơ IA không thể xóa trong giao diện.
- Supervisor/High Command/Deputy Chief duyệt nghỉ phép; sĩ quan gửi và xem đơn của mình.
- Phạt giao thông nhanh tạo FineRecord để khoản nộp đi vào sổ quỹ hiện có; khoản phí lấy xe được ghi vào sổ quỹ khi giải phóng xe.
- FTO/High Command/Deputy Chief cấp và quản lý chứng chỉ; đánh giá FTO kết luận đạt tự cấp chứng chỉ hoàn thành đào tạo cơ bản.
- Bảo mật tài khoản: 5 lần đăng nhập sai khóa 15 phút; đổi mật khẩu hoặc thu hồi phiên sẽ vô hiệu hóa các token đăng nhập hiện hữu.
- Dispatch: mọi sĩ quan có thể ghi nhận cuộc gọi; Supervisor trở lên có thể điều phối units đang On-Duty và cập nhật trạng thái.

## Ghi chú
- Tổng phạt/án tù được tính lại ở server từ bảng Charge, không tin số từ client.
- Bảng lương cá nhân hiển thị trên Dashboard MDT; High Command cấu hình mức lương/giờ tại Nội bộ. Sau khi cập nhật schema, chạy `npx prisma db push`.
- Phòng Tài chính và FTO nằm trong thanh bên MDT → Phòng ban; chỉ đúng role và High Command nhìn thấy.
- Các cấp bậc Chief of Police, Assistant Chief of Police, Deputy Chief of Police, Captain, Lieutenant, Sergeant II/I, Corporal, Senior Officer, Officer và Cadet được chọn trong Nội bộ → Quân số.
- CSDL nhân viên và chi tiết hồ sơ chỉ dành cho Chief/Deputy Chief; Dispatch lưu cuộc gọi và phân công đơn vị trong database. Chạy `npx prisma db push` sau khi cập nhật schema.
- Sau khi cập nhật schema cho IA và audit log, chạy `npx prisma db push`; các thay đổi hồ sơ, quyền, điều phối, tài chính, FTO và IA được ghi vào nhật ký bất biến trong giao diện.
- Trang `/` là cổng công dân mặc định; `/laws` hiển thị bộ luật đang hoạt động từ database và `/recruitment` nhận hồ sơ tuyển dụng. Nút cố định góc dưới bên phải chuyển giữa cổng công dân và đăng nhập MDT.
- Trang Tra cứu phạt nguội chỉ khớp chính xác Tên IC / Số căn cước.
- Chế độ gọn (nút thu nhỏ trên thanh trên cùng) dành cho màn hình phụ/overlay, lưu trong localStorage.
- Nháp báo cáo lưu ở localStorage khóa `mdt_report_draft_v1`.
- Chưa có upload ảnh: ảnh/bằng chứng dùng link (Imgur, Discord, YouTube...).
