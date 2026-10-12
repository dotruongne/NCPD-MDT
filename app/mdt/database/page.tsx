import Link from "next/link";
import { Users, Car, Archive, Search, Plus, ExternalLink, ShieldAlert, FileText, Fingerprint, ArrowUpRight, Database, ScanSearch } from "lucide-react";
import { db } from "@/lib/db";
import { Badge, Card, Empty, Field, PlateBadge } from "@/components/ui";
import { fmtDate } from "@/lib/utils";
import { createCitizen, createEvidence, createVehicle } from "../actions";

type Tab = "citizens" | "vehicles" | "evidence";
const TABS: [Tab, string, React.ComponentType<{ className?: string }>][] = [
  ["citizens", "Công dân", Users],
  ["vehicles", "Phương tiện", Car],
  ["evidence", "Kho bằng chứng", Archive],
];

export default async function DatabasePage({
  searchParams,
}: {
  searchParams: { tab?: Tab; q?: string; new?: string };
}) {
  const tab: Tab = TABS.some(([t]) => t === searchParams.tab)
    ? (searchParams.tab as Tab)
    : "citizens";
  const q = searchParams.q?.trim() ?? "";

  return (
    <div className="mdt-database space-y-5">
      <section className="database-hero">
        <div className="database-hero-copy">
          <div className="database-kicker">
            <Database className="h-3.5 w-3.5" />
            <span>NCPD · HỆ THỐNG HỒ SƠ SỐ</span>
            <span className="database-live"><i /> SECURE DATABASE</span>
          </div>
          <h1 className="database-title">Cơ sở dữ liệu nghiệp vụ</h1>
          <p className="database-description">
            Tra cứu hồ sơ công dân, phương tiện đăng ký và bằng chứng được lưu trữ trong hệ thống.
          </p>
        </div>
        <div className="database-record-type">
          <Fingerprint className="h-7 w-7" strokeWidth={1.5} />
          <div>
            <span>PHÂN HỆ HIỆN TẠI</span>
            <strong>{TABS.find(([t]) => t === tab)?.[1]}</strong>
          </div>
        </div>
      </section>

      <section className="database-controls" aria-label="Tra cứu cơ sở dữ liệu">
        <div className="database-tabs" role="tablist" aria-label="Loại hồ sơ">
          {TABS.map(([t, label, Icon]) => {
            const active = tab === t;
            return (
              <Link
                key={t}
                href={`/mdt/database?tab=${t}`}
                role="tab"
                aria-selected={active}
                className={`database-tab ${active ? "database-tab-active" : ""}`}
              >
                <Icon className="h-4 w-4" />
                {label}
                {active && <span className="database-tab-indicator" />}
              </Link>
            );
          })}
        </div>

        <form className="database-search">
          <input type="hidden" name="tab" value={tab} />
          <label className="database-searchbox">
            <ScanSearch className="h-4 w-4 shrink-0" />
            <input
              name="q"
              defaultValue={q}
              placeholder={
                tab === "citizens"
                  ? "Tìm tên, CCCD, SĐT..."
                  : tab === "vehicles"
                  ? "Tìm biển số, dòng xe..."
                  : "Tìm mã tủ, vật phẩm..."
              }
              aria-label={tab === "citizens" ? "Tra cứu công dân" : tab === "vehicles" ? "Tra cứu phương tiện" : "Tra cứu bằng chứng"}
            />
          </label>
          <button className="database-search-button">
            <Search className="h-3.5 w-3.5" />
            <span>Tra cứu</span>
          </button>
        </form>
      </section>

      {tab === "citizens" && <Citizens q={q} />}
      {tab === "vehicles" && <Vehicles q={q} />}
      {tab === "evidence" && <EvidenceTab q={q} />}
    </div>
  );
}

async function Citizens({ q }: { q: string }) {
  const list = await db.citizen.findMany({
    where: q
      ? {
          OR: [
            { fullName: { contains: q, mode: "insensitive" } },
            { citizenId: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
          ],
        }
      : undefined,
    orderBy: { fullName: "asc" },
    take: 50,
    include: { _count: { select: { incidents: true, vehicles: true } } },
  });

  return (
    <div className="citizen-workspace grid gap-5 lg:grid-cols-[minmax(0,1.8fr)_minmax(330px,0.9fr)]">
      <section className="citizen-results">
        <div className="citizen-results-heading">
          <div className="flex items-center gap-3">
            <span className="database-section-icon"><Users className="h-[18px] w-[18px]" /></span>
            <div>
              <p className="database-section-kicker">CITIZEN RECORDS</p>
              <h2>Hồ sơ công dân</h2>
            </div>
          </div>
          <span className="database-count"><strong>{list.length}</strong> HỒ SƠ</span>
        </div>
        <div className="citizen-table-note">
          <ShieldAlert className="h-3.5 w-3.5" />
          <span>Thông tin chỉ dành cho mục đích nghiệp vụ. Chọn một hồ sơ để xem chi tiết.</span>
        </div>
        <div className="citizen-table-wrap">
          {list.length === 0 ? (
            <Empty className="m-4">Không tìm thấy hồ sơ công dân nào khớp với điều kiện tìm kiếm.</Empty>
          ) : (
            <table className="citizen-table w-full text-sm">
              <thead>
                <tr>
                  <th>Danh tính</th>
                  <th>Cảnh báo hồ sơ</th>
                  <th className="text-right">Liên kết</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => {
                  const initials = c.fullName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
                  return (
                    <tr key={c.id}>
                      <td>
                        <Link href={`/mdt/database/citizens/${c.id}`} className="citizen-identity">
                          <span className="citizen-avatar">{initials}</span>
                          <span className="min-w-0">
                            <strong>{c.fullName}</strong>
                            <span className="citizen-identity-meta">
                              <span className="citizen-id-mark">ID</span>
                              <span>{c.citizenId}</span>
                              {c.phone && <><i /> <span>{c.phone}</span></>}
                            </span>
                          </span>
                          <ArrowUpRight className="citizen-open-icon h-4 w-4" />
                        </Link>
                      </td>
                      <td>
                        <div className="citizen-alerts">
                          {c.tags.length === 0 ? (
                            <span className="citizen-clear"><i /> Không có cảnh báo</span>
                          ) : (
                            c.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} tone="danger">{tag}</Badge>
                            ))
                          )}
                          {c.tags.length > 2 && <span className="citizen-more-tags">+{c.tags.length - 2}</span>}
                        </div>
                      </td>
                      <td className="text-right">
                        <span className="citizen-relations">
                          <span><FileText className="h-3 w-3" />{c._count.incidents}</span>
                          <span><Car className="h-3 w-3" />{c._count.vehicles}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        <div className="citizen-results-footer">
          <span>HIỂN THỊ TỐI ĐA 50 HỒ SƠ</span>
          <span><i /> CSDL NỘI BỘ NCPD</span>
        </div>
      </section>

      <aside className="citizen-create">
        <div className="citizen-create-heading">
          <span className="database-section-icon"><Plus className="h-[18px] w-[18px]" /></span>
          <div>
            <p className="database-section-kicker">NEW RECORD</p>
            <h2>Tạo hồ sơ công dân</h2>
            <p>Nhập thông tin nhận dạng để đăng ký hồ sơ mới.</p>
          </div>
        </div>
          <form action={createCitizen} className="space-y-3.5">
            <Field label="Họ tên IC" required>
              <input name="fullName" placeholder="VD: Marcus Vega" className="input" required />
            </Field>
            <Field label="Số căn cước (Citizen ID)" required hint="In hoa, VD: VN-000123">
              <input
                name="citizenId"
                placeholder="VN-000123"
                className="input font-mono uppercase"
                required
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Số điện thoại IC">
                <input name="phone" placeholder="555-0192" className="input font-mono" />
              </Field>
              <Field label="Ngày sinh">
                <input name="dob" className="input" placeholder="1995-05-20" />
              </Field>
            </div>
            <Field label="Link ảnh chân dung (Mugshot)">
              <input name="photoUrl" className="input" placeholder="https://i.imgur.com/..." />
            </Field>
            <Field label="Tag cảnh báo" hint="Cách nhau bằng dấu phẩy">
              <input
                name="tags"
                className="input"
                placeholder="Có súng, Bỏ chạy khi bị chặn xe, Băng đảng"
              />
            </Field>
            <Field label="Ghi chú nhân thân">
              <textarea
                name="notes"
                rows={3}
                className="input"
                placeholder="Đặc điểm nhận dạng, hình xăm, thói quen hoạt động..."
              />
            </Field>
            <button className="citizen-create-submit">
              <Plus className="h-4 w-4" /> Tạo hồ sơ công dân
            </button>
          </form>
      </aside>
    </div>
  );
}

async function Vehicles({ q }: { q: string }) {
  const [list, citizens] = await Promise.all([
    db.vehicle.findMany({
      where: q
        ? {
            OR: [
              { plate: { contains: q.replace(/[\s-]/g, ""), mode: "insensitive" } },
              { model: { contains: q, mode: "insensitive" } },
            ],
          }
        : undefined,
      include: { owner: { select: { id: true, fullName: true } } },
      orderBy: { plate: "asc" },
      take: 50,
    }),
    db.citizen.findMany({
      select: { id: true, fullName: true, citizenId: true },
      orderBy: { fullName: "asc" },
      take: 500,
    }),
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card
          title={`Danh mục phương tiện (${list.length})`}
          icon={<Car className="h-4 w-4" />}
          subtitle="Hệ thống đăng ký biển số xe tại Sở Giao thông San Andreas"
        >
          {list.length === 0 ? (
            <Empty>Không tìm thấy phương tiện nào khớp với tìm kiếm.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left">
                    <th className="th">Biển số</th>
                    <th className="th">Dòng xe & Màu</th>
                    <th className="th">Chủ sở hữu</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((v) => (
                    <tr
                      key={v.id}
                      className="border-b border-line/40 transition hover:bg-panel2/60"
                    >
                      <td className="td py-3">
                        <PlateBadge plate={v.plate} stolen={v.stolen} />
                      </td>
                      <td className="td py-3">
                        <p className="font-semibold text-white">{v.model}</p>
                        <p className="text-xs text-slate-400">Màu sắc: {v.color}</p>
                      </td>
                      <td className="td py-3">
                        {v.owner ? (
                          <Link
                            className="text-neon hover:underline font-medium text-xs flex items-center gap-1"
                            href={`/mdt/database/citizens/${v.owner.id}`}
                          >
                            {v.owner.fullName}
                          </Link>
                        ) : (
                          <span className="text-slate-500 text-xs">Chưa đăng ký chủ</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <div>
        <Card
          title="Đăng ký phương tiện mới"
          icon={<Plus className="h-4 w-4" />}
          subtitle="Nhập thông tin cấp đăng ký hoặc ghi nhận phương tiện"
        >
          <form action={createVehicle} className="space-y-3.5">
            <Field label="Biển số xe" required hint="Không dấu cách, in hoa">
              <input
                name="plate"
                placeholder="VD: 88ABC123"
                className="input font-mono uppercase"
                required
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Dòng xe (Model)">
                <input name="model" placeholder="VD: Sultan RS" className="input" />
              </Field>
              <Field label="Màu sơn">
                <input name="color" placeholder="VD: Đen bóng" className="input" />
              </Field>
            </div>
            <Field label="Chủ sở hữu liên kết">
              <select name="ownerId" className="input">
                <option value="">— Chưa xác định chủ —</option>
                {citizens.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.citizenId})
                  </option>
                ))}
              </select>
            </Field>
            <label className="flex items-center gap-2 text-xs text-slate-300 font-mono cursor-pointer pt-1">
              <input type="checkbox" name="stolen" className="rounded" />
              <span>Đánh dấu là phương tiện BỊ BÁO TRỘM (BOLO)</span>
            </label>
            <button className="btn btn-neon w-full py-2.5 font-semibold text-xs tracking-wider">
              LƯU ĐĂNG KÝ XE
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}

async function EvidenceTab({ q }: { q: string }) {
  const [list, citizens] = await Promise.all([
    db.evidence.findMany({
      where: q
        ? {
            OR: [
              { locker: { contains: q, mode: "insensitive" } },
              { items: { contains: q, mode: "insensitive" } },
            ],
          }
        : undefined,
      include: {
        officer: { select: { fullName: true } },
        citizen: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.citizen.findMany({
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
      take: 500,
    }),
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        {list.length === 0 ? (
          <Empty>Kho bằng chứng hiện đang trống.</Empty>
        ) : (
          list.map((e) => (
            <Card key={e.id} className="space-y-3">
              <div className="flex items-center justify-between border-b border-line/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <Badge tone="info">TỦ BẰNG CHỨNG #{e.locker}</Badge>
                </div>
                <span className="font-mono text-[11px] text-slate-400">
                  {fmtDate(e.createdAt)} · Sĩ quan thụ lý: {e.officer.fullName}
                </span>
              </div>

              <div className="rounded-lg border border-line bg-panel2/60 p-3">
                <p className="font-mono text-[11px] uppercase tracking-wider text-slate-400 mb-1">
                  Danh mục tang vật thu giữ:
                </p>
                <pre className="whitespace-pre-wrap font-sans text-sm text-slate-200 leading-relaxed">
                  {e.items}
                </pre>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                {e.citizen ? (
                  <Link
                    href={`/mdt/database/citizens/${e.citizen.id}`}
                    className="text-neon hover:underline font-medium flex items-center gap-1"
                  >
                    Đối tượng liên quan: {e.citizen.fullName}
                  </Link>
                ) : (
                  <span className="text-slate-500">Không liên kết đối tượng</span>
                )}

                {e.mediaUrl && (
                  <a
                    href={e.mediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-neon py-1 px-2.5 text-xs font-mono"
                  >
                    <ExternalLink className="h-3 w-3" /> Xem Ảnh/Video Bằng chứng
                  </a>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      <div>
        <Card
          title="Nhập kho bằng chứng tư pháp"
          icon={<Plus className="h-4 w-4" />}
          subtitle="Niêm phong tang vật và lưu trữ vào tủ đồ đồn"
        >
          <form action={createEvidence} className="space-y-3.5">
            <Field label="Mã tủ đồ (Locker ID)" required hint="VD: LOCK-01">
              <input
                name="locker"
                placeholder="VD: LOCK-104"
                className="input font-mono uppercase"
                required
              />
            </Field>
            <Field
              label="Danh sách tang vật thu giữ"
              required
              hint="Mỗi món đồ xuống 1 dòng"
            >
              <textarea
                name="items"
                rows={5}
                className="input font-mono text-xs"
                placeholder={"1x Combat Pistol Mk2\n45x Đạn 9mm\n20x Túi cần sa nguyên chất\n$25,000 Tiền mặt chưa rõ nguồn"}
                required
              />
            </Field>
            <Field label="Link hình ảnh / video niêm phong">
              <input
                name="mediaUrl"
                className="input"
                placeholder="https://imgur.com/... hoặc youtube link"
              />
            </Field>
            <Field label="Đối tượng liên quan (nếu có)">
              <select name="citizenId" className="input">
                <option value="">— Không liên kết —</option>
                {citizens.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName}
                  </option>
                ))}
              </select>
            </Field>
            <button className="btn btn-neon w-full py-2.5 font-semibold text-xs tracking-wider">
              LƯU VÀ NIÊM PHONG TANG VẬT
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
