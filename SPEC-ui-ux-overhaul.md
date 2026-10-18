# Spec: NCPD MDT UI/UX Overhaul

## Objective

Refactor toàn diện giao diện người dùng của hệ thống NCPD MDT (Novaris City Police Department Mobile Data Terminal) — một Next.js 14 web app dành cho sĩ quan cảnh sát trong môi trường FiveM roleplay.

**Người dùng chính:** Sĩ quan cảnh sát trong ca trực, thao tác liên tục trong điều kiện căng thẳng, thường dùng màn hình phụ overlay khi chơi game.

**Thành công trông như thế nào:**
- Sĩ quan tra cứu hồ sơ công dân nguy hiểm và thấy ngay cảnh báo mức độ đe dọa trong < 3 giây đầu mở hồ sơ.
- Lập xong biên bản phạt nguội trong < 60 giây mà không cần cuộn trang.
- Chuyển đổi giữa 4 Hub chỉ bằng `Ctrl+1..4` mà không cần chuột.
- Không bao giờ mất bản nháp báo cáo chưa hoàn thành dù game crash hay đóng nhầm tab.

---

## Capability Map

| Module ID | Trách nhiệm | Phụ thuộc |
|---|---|---|
| `design-tokens` | Tailwind palette Tactical Dark, loại bỏ light theme vars, chuẩn hóa semantic colors | — |
| `ui-primitives` | Card, Button, Badge, Field/Input, Table, Modal, Tabs, AlertBanner, Empty state | `design-tokens` |
| `nav-shell` | Sidebar 4 Hub, Live Badges, Ctrl+1..4, Ctrl+K nâng cấp, Compact Mode | `ui-primitives` |
| `report-builder` | Split-screen layout, Sticky Live Summary, Draft Vault auto-save/recovery | `ui-primitives`, `nav-shell` |
| `citizen-dossier` | Threat banner WANTED/ARMED, Quick Action Bar, tabbed record view | `ui-primitives`, `nav-shell` |
| `dashboard` | Tactical Command Center: Priority Feed, Duty switcher, Quick Launchers | `ui-primitives`, `nav-shell` |
| `css-purge` | Dọn bỏ class mồ côi trong globals.css, regression check | Tất cả module trên |

**Thứ tự build:** `design-tokens` → `ui-primitives` → `nav-shell` → `report-builder` + `citizen-dossier` (song song) → `dashboard` → `css-purge`

---

## Tech Stack

- **Framework:** Next.js 14 App Router
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS (utility-first, không inline style, không arbitrary pixel values ngoài token)
- **Icons:** lucide-react
- **DB:** Prisma + Supabase PostgreSQL
- **Auth:** JWT cookie + phân quyền server-side

---

## Commands

```bash
Dev:   npm run dev       # http://localhost:3000
Build: npm run build
Lint:  npx tsc --noEmit  # TypeScript check (không có eslint config hiện tại)
```

---

## Project Structure

```
app/
  (public)/             Cổng công dân – NẰM NGOÀI PHẠM VI refactor này
  login/                Đăng nhập
  mdt/                  MDT nội bộ – TẤT CẢ đều trong phạm vi
    page.tsx            ← dashboard (Phase 5)
    database/
      citizens/[id]/    ← citizen dossier (Phase 4)
    reports/            ← report builder entry point (Phase 3)

components/
  ui.tsx                ← atomic UI primitives (Phase 1-2)
  mdt-shell.tsx         ← navigation shell (Phase 2)
  report-builder.tsx    ← report builder (Phase 3)

app/globals.css         ← CSS purge cuối cùng (Phase 5)
tailwind.config.ts      ← design tokens (Phase 1)
GLOSSARY.md             ← domain language
docs/adr/               ← architecture decisions
```

---

## Code Style

```tsx
// ✅ Composition over configuration
<Card tone="danger">
  <AlertBanner level="critical" title="LỆNH TRUY NÃ ĐANG HOẠT ĐỘNG" />
</Card>

// ✅ Semantic color tokens, không dùng hex trực tiếp
<span className="text-danger border-danger/30 bg-danger/10" />

// ✅ Compact Tailwind – không custom pixel values
<div className="px-3.5 py-2 gap-2 text-[13px]" />  // scale values OK

// ❌ Không làm thế này
<div style={{ padding: '13px' }} className="text-red-500" />

// ✅ Server Actions cho forms
<form action={serverAction}><button>Submit</button></form>

// ✅ Loading/Empty/Error states bắt buộc trên mọi list
if (loading) return <SkeletonRows count={3} />;
if (!items.length) return <Empty>Chưa có dữ liệu.</Empty>;
```

**Naming:**
- Components: PascalCase (`AlertBanner`)
- Hooks: `use` prefix (`useDraftVault`)
- CSS class utilities: dùng Tailwind classes, không thêm class custom mới nếu có Tailwind equivalent

---

## Testing Strategy

- Không có test framework nào được cấu hình hiện tại — **không cần thêm** trong phạm vi refactor này.
- Verification bằng: `npm run build` (TypeScript check), review trực tiếp trên browser tại `localhost:3000`.
- Mỗi Phase phải pass `build` trước khi sang Phase tiếp theo.

---

## Design Decisions đã được phê duyệt (từ /grill-with-docs)

### Tactical Dark Theme (ADR-0003)
- Background: `#070d18` / CSS var `--app-bg: 7 13 24`
- Panel: `#0d1726` / CSS var `--app-panel: 13 23 38`
- Panel alt: `#121e30`
- Border: `#253648`
- Ink: `#e8edf3` (primary text)
- Muted: `#8fa3b8`
- Brand accent: `#7aadcc` (neon/sky)
- WCAG AA: tất cả text/background cặp phải đạt tỷ lệ tương phản ≥ 4.5:1

### Light Theme: LOẠI BỎ HOÀN TOÀN
- Xóa `:root[data-theme="light"]` block
- Xóa `ThemeToggle` component khỏi `mdt-shell.tsx`
- Xóa `theme-toggle.tsx` (hoặc giữ lại nhưng không dùng trong MDT)

### Navigation 4 Hub (ADR-0001)
```
Hub 1: Command    – /mdt, /mdt/dispatch, /mdt/ops
Hub 2: Records    – /mdt/database (citizens, vehicles, evidence)
Hub 3: Enforce    – /mdt/reports, /mdt/cases, /mdt/traffic
Hub 4: Admin      – /mdt/personnel, /mdt/hr, /mdt/leave, /mdt/departments/*, /mdt/internal-affairs, /mdt/audit, /mdt/settings
```
Keyboard: `Ctrl+1` → Hub 1, `Ctrl+2` → Hub 2, `Ctrl+3` → Hub 3, `Ctrl+4` → Hub 4

### Report Builder Split Screen (ADR-0002)
- Desktop (≥ 1280px): 2 cột — `grid-cols-[1fr_340px]`
- Tablet/compact: 1 cột, sticky summary collapse thành floating bar dưới màn hình
- Draft Vault: debounced localStorage write mỗi 2 giây, key `mdt_report_draft_v1`
- Recovery modal: xuất hiện khi mở `/mdt/reports/new` mà có draft

### Citizen Dossier (ADR-0002)
- Banner đỏ full-width trên đầu khi có warrant active hoặc tag ARMED
- Quick Action Bar: 3 nút — [Phạt giao thông nhanh], [Tạo báo cáo vụ việc], [Ghi chú nội bộ]
- Tabs: Tiền án | Phương tiện | Bằng lái & Giấy tờ | Ghi chú cảnh sát

### Responsive Breakpoints
- `< 768px`: sidebar ẩn, bottom nav hoặc hamburger
- `768px – 1279px`: sidebar collapse (compact mode mặc định)
- `≥ 1280px`: sidebar full, multi-column layouts được phép

---

## Boundaries

**Always do:**
- Dùng `npm run build` để verify TypeScript trước khi kết thúc mỗi Phase
- Giữ nguyên mọi Server Action (`action={...}`) và logic auth – chỉ thay đổi JSX/CSS
- Giữ nguyên tất cả ARIA attributes hiện có, bổ sung thêm nếu thiếu
- Dùng semantic Tailwind tokens thay vì hard-code màu hex

**Ask first:**
- Thay đổi Prisma schema
- Thêm npm dependencies mới
- Thay đổi Server Action logic hoặc middleware
- Xóa hoàn toàn một component (hỏi trước, không tự xóa)

**Never do:**
- Inline styles (`style={{...}}`) ngoại trừ animation JS-driven bắt buộc
- Arbitrary pixel values không trên Tailwind scale (`px-[13px]`)
- Xóa hoặc sửa logic nghiệp vụ (phân quyền, tính phạt, auth)
- Thêm màu mới ngoài palette đã định nghĩa

---

## Success Criteria (per Phase)

### Phase 1 – design-tokens + ui-primitives
- [ ] `tailwind.config.ts` có bộ palette Tactical Dark đầy đủ (bg, panel, border, ink, muted, brand, ok, warn, danger, gold)
- [ ] `globals.css` đã xóa sạch `[data-theme="light"]` block
- [ ] `components/ui.tsx` export: `Card`, `Field`, `Button`, `Badge`, `Empty`, `PageTitle`, `StatCard`, `AlertBanner`, `Modal`, `Tabs`, `TableRow`, `SkeletonRow`
- [ ] `npm run build` pass

### Phase 2 – nav-shell
- [ ] Sidebar hiển thị 4 Hub với group labels rõ ràng
- [ ] `Ctrl+1..4` chuyển đổi Hub trực tiếp (không cần chuột)
- [ ] `Ctrl+K` mở Command Palette (đã có, cần verify + bổ sung Hub navigation)
- [ ] ThemeToggle đã bị xóa khỏi header
- [ ] Compact mode hoạt động đúng trên ≥ 768px
- [ ] `npm run build` pass

### Phase 3 – report-builder
- [ ] Layout 2 cột trên ≥ 1280px; 1 cột trên nhỏ hơn
- [ ] Sticky Live Summary hiển thị tổng phạt + tổng tù tính lại real-time khi thêm/xóa tội danh
- [ ] Draft Vault: tự động lưu sau 2 giây; hiển thị "Đã lưu lúc HH:mm:ss"
- [ ] Recovery modal hiện khi load lại trang mà có draft cũ
- [ ] `npm run build` pass

### Phase 4 – citizen-dossier
- [ ] Threat banner đỏ hiển thị khi citizen có warrant active
- [ ] Quick Action Bar: 3 nút hoạt động đúng routing
- [ ] 4 tabs hoạt động với lazy content
- [ ] `npm run build` pass

### Phase 5 – dashboard + css-purge
- [ ] Dashboard có Priority Feed và Duty Switcher nổi bật
- [ ] Tìm kiếm và xóa các class CSS mồ côi trong globals.css (không xóa class còn dùng)
- [ ] `npm run build` pass
- [ ] Không có horizontal overflow ở viewport 768px và 1280px

---

## Open Questions

_Không còn câu hỏi mở — tất cả đã được chốt trong phiên /grill-with-docs._
