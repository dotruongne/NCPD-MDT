import Link from "next/link";
import { notFound } from "next/navigation";
import {
  User,
  Car,
  AlertTriangle,
  FileText,
  DollarSign,
  Archive,
  Edit,
  Plus,
  ExternalLink,
  ShieldAlert,
  Siren,
  Phone,
  Calendar,
  CreditCard,
  CheckCircle,
  FileBadge,
} from "lucide-react";
import { db } from "@/lib/db";
import { Badge, Card, Empty, Field, PageTitle, PlateBadge, ThreatBanner } from "@/components/ui";
import { fmtDate, money } from "@/lib/utils";
import { markFinePaid, updateCitizen } from "../../../actions";

export default async function CitizenPage({ params }: { params: { id: string } }) {
  const c = await db.citizen.findUnique({
    where: { id: params.id },
    include: {
      vehicles: true,
      fines: { orderBy: { createdAt: "desc" } },
      incidents: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { fullName: true } } },
      },
      warrants: { where: { status: "ACTIVE" } },
      evidence: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!c) notFound();

  const unpaidFines = c.fines.filter((f) => !f.paid);
  const unpaidTotal = unpaidFines.reduce((s, f) => s + f.amount, 0);
  const isWanted = c.warrants.length > 0;
  const isArmed = c.tags.some((t) =>
    ["ARMED", "VU KHI", "VŨ KHÍ", "DANGEROUS", "NGUY HIEM", "NGUY HIỂM"].includes(
      t.toUpperCase().trim()
    )
  );

  return (
    <div className="space-y-5">
      {/* 1. Tactical Threat Banner: Instant Alert on Load */}
      {isWanted ? (
        <ThreatBanner
          level="wanted"
          label={`CẢNH BÁO TÁC CHIẾN: ĐỐI TƯỢNG ĐANG CÓ LỆNH TRUY NÃ ĐẶC BIỆT (${c.warrants.length} LỆNH CHƯA THI HÀNH)`}
          sub="YÊU CẦU TRUY BẮT KHẨN CẤP · BẢO ĐẢM AN TOÀN SĨ QUAN"
        />
      ) : isArmed ? (
        <ThreatBanner
          level="armed"
          label="CẢNH BÁO TIỀM TÀNG: ĐỐI TƯỢNG CÓ TIỀN SỬ SỬ DỤNG VŨ KHÍ NGUY HIỂM"
          sub="CÂN NHẮC YÊU CẦU ĐƠN VỊ HỖ TRỢ 10-78 KHI TIẾP CẬN"
        />
      ) : null}

      {/* 2. Top Header & Actionable Command Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-neon">
              POLICE MASTER DOSSIER
            </span>
            <span className="text-slate-600">/</span>
            <span className="font-mono text-[10px] text-slate-400">ID #{c.citizenId}</span>
          </div>
          <h1 className="mt-1 font-mono text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
            {c.fullName}
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Hồ sơ tư pháp CSDL NCPD · Ngày tạo: {fmtDate(c.createdAt)}
          </p>
        </div>

        {/* Quick Action Command Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {isWanted && (
            <Badge tone="danger" dot className="px-3 py-1.5 text-xs font-bold uppercase">
              WANTED ACTIVE
            </Badge>
          )}
          <Link
            href={`/mdt/traffic?search=${encodeURIComponent(c.citizenId)}`}
            className="btn btn-gold text-xs font-mono font-semibold px-3 py-2"
          >
            <DollarSign className="h-3.5 w-3.5" /> Phạt giao thông
          </Link>
          <Link
            href={`/mdt/reports/new?suspect=${c.id}`}
            className="btn btn-neon text-xs font-mono font-bold px-3.5 py-2 shadow-neon flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> Lập biên bản án mới
          </Link>
        </div>
      </div>

      {/* 3. Main Dossier Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column (4 cols): Mugshot Profile, Warning Tags & Edit */}
        <div className="space-y-5 lg:col-span-4">
          {/* Identity Dossier Card */}
          <Card
            tone={isWanted ? "danger" : "default"}
            title="Định danh tư pháp"
            icon={<User className="h-4 w-4" />}
          >
            <div className="space-y-4">
              <div className="flex gap-4">
                {/* Tactical Mugshot Frame */}
                <div className="relative flex h-36 w-28 shrink-0 flex-col items-center justify-center overflow-hidden rounded border border-line bg-panel2 shadow-inner">
                  {c.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.photoUrl}
                      alt={c.fullName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <User className="h-10 w-10 text-slate-600" />
                      <span className="font-mono text-[9px] mt-1 text-slate-500 uppercase">NO PHOTO</span>
                    </div>
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-black/85 py-0.5 text-center font-mono text-[8px] font-bold text-slate-300">
                    NCPD MUGSHOT
                  </div>
                </div>

                {/* Quick Info Attributes */}
                <div className="flex-1 space-y-1.5 font-mono text-xs">
                  <div>
                    <span className="text-[10px] uppercase text-slate-500 block">Số CCCD / ID</span>
                    <span className="text-white font-bold">{c.citizenId}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-500 block">Số liên lạc (SĐT)</span>
                    <span className="text-slate-200">{c.phone ?? "Không có"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-500 block">Ngày sinh</span>
                    <span className="text-slate-200">{c.dob ?? "Không có"}</span>
                  </div>
                </div>
              </div>

              {/* Warning Tags Section */}
              <div className="border-t border-line/60 pt-3">
                <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400 mb-2">
                  Dấu hiệu nhận diện & Tiền sự:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {c.tags.length === 0 ? (
                    <span className="text-xs text-slate-500 font-mono">Chưa ghi nhận tiền sự nguy hiểm.</span>
                  ) : (
                    c.tags.map((t) => (
                      <Badge key={t} tone="danger" dot>
                        {t}
                      </Badge>
                    ))
                  )}
                </div>
              </div>

              {/* Officer Notes */}
              {c.notes && (
                <div className="rounded border border-line bg-panel2/70 p-3 text-xs">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                    Ghi chú cảnh sát:
                  </p>
                  <p className="whitespace-pre-wrap text-slate-200 leading-relaxed font-sans">
                    {c.notes}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Edit Dossier Details */}
          <Card
            title="Cập nhật thông tin đối tượng"
            icon={<Edit className="h-4 w-4" />}
            subtitle="Chỉnh sửa thông tin liên lạc, ảnh và hồ sơ"
          >
            <form action={updateCitizen} className="space-y-3">
              <input type="hidden" name="id" value={c.id} />
              <Field label="Số điện thoại IC">
                <input name="phone" defaultValue={c.phone ?? ""} className="input font-mono text-xs" />
              </Field>
              <Field label="Link ảnh chân dung (URL)">
                <input name="photoUrl" defaultValue={c.photoUrl ?? ""} className="input text-xs" />
              </Field>
              <Field label="Tag cảnh báo" hint="Cách nhau bằng dấu phẩy">
                <input name="tags" defaultValue={c.tags.join(", ")} className="input text-xs" />
              </Field>
              <Field label="Ghi chú nhân dạng & đặc điểm">
                <textarea
                  name="notes"
                  defaultValue={c.notes ?? ""}
                  rows={3}
                  className="input text-xs"
                />
              </Field>
              <button className="btn btn-neon w-full py-2 font-mono font-bold text-xs">
                LƯU THAY ĐỔI VÀO CSDL
              </button>
            </form>
          </Card>

          {/* Registered Vehicles */}
          <Card
            title={`Phương tiện sở hữu (${c.vehicles.length})`}
            icon={<Car className="h-4 w-4" />}
            subtitle="Các xe đã đăng ký biển số tại DMV"
          >
            {c.vehicles.length === 0 ? (
              <Empty>Đối tượng chưa đứng tên sở hữu phương tiện nào.</Empty>
            ) : (
              <ul className="space-y-2">
                {c.vehicles.map((v) => (
                  <li
                    key={v.id}
                    className="flex items-center justify-between rounded border border-line bg-panel2/60 p-2.5 text-xs"
                  >
                    <PlateBadge plate={v.plate} stolen={v.stolen} />
                    <span className="font-mono text-slate-300 font-medium">
                      {v.model} · {v.color}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Right Column (8 cols): Incident History, Fines & Evidence */}
        <div className="space-y-5 lg:col-span-8">
          {/* Incident History Records */}
          <Card
            title={`Hồ sơ tiền án & Báo cáo xử lý (${c.incidents.length})`}
            icon={<FileText className="h-4 w-4" />}
            subtitle="Danh sách các vụ việc đối tượng đã bị lập biên bản truy tố"
            action={
              <Link
                href={`/mdt/reports/new?suspect=${c.id}`}
                className="btn btn-neon py-1 px-2.5 text-xs font-mono font-bold"
              >
                + Lập án mới
              </Link>
            }
          >
            {c.incidents.length === 0 ? (
              <Empty>Lý lịch tư pháp trong sạch – Chưa có tiền án được ghi nhận.</Empty>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-left">
                      <th className="th">Mã vụ việc</th>
                      <th className="th">Tên vụ việc & Thời điểm</th>
                      <th className="th">Sĩ quan</th>
                      <th className="th text-right">Phạt tiền</th>
                      <th className="th text-right">Án tù</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.incidents.map((i) => (
                      <tr
                        key={i.id}
                        className="border-b border-line/40 transition hover:bg-panel2/60"
                      >
                        <td className="td py-3 font-mono font-bold text-neon">{i.number}</td>
                        <td className="td py-3">
                          <p className="font-semibold text-white">{i.title}</p>
                          <p className="font-mono text-[11px] text-slate-400 mt-0.5">
                            {fmtDate(i.createdAt)}
                          </p>
                        </td>
                        <td className="td py-3 text-slate-400 text-xs">{i.author.fullName}</td>
                        <td className="td py-3 text-right font-mono text-xs font-bold text-amber-300">
                          {money(i.totalFine)}
                        </td>
                        <td className="td py-3 text-right font-mono text-xs font-bold text-red-300">
                          {i.totalJail} phút
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Unpaid & Paid Traffic Fines */}
          <Card
            title="Biên bản phạt vi phạm hành chính"
            icon={<DollarSign className="h-4 w-4" />}
            subtitle={`Tổng tiền phạt còn nợ chưa thanh toán: ${money(unpaidTotal)}`}
            tone={unpaidTotal > 0 ? "warn" : "default"}
          >
            {c.fines.length === 0 ? (
              <Empty>Không có biên bản phạt hành chính nào.</Empty>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-line/60 pb-2 text-xs font-mono text-slate-400">
                  <span>Hành vi vi phạm</span>
                  <span>Mức phạt & Trạng thái thanh toán</span>
                </div>
                {c.fines.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between gap-3 rounded border border-line bg-panel2/50 p-2.5 text-xs transition"
                  >
                    <div>
                      <span className={f.paid ? "text-slate-500 line-through" : "text-white font-medium"}>
                        {f.reason}
                      </span>
                      <p className="font-mono text-[10px] text-slate-500 mt-0.5">
                        {fmtDate(f.createdAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-amber-300">{money(f.amount)}</span>
                      {f.paid ? (
                        <Badge tone="ok">ĐÃ THANH TOÁN</Badge>
                      ) : (
                        <form action={markFinePaid}>
                          <input type="hidden" name="id" value={f.id} />
                          <button className="btn btn-ok py-1 px-2.5 text-xs font-mono font-bold">
                            XÁC NHẬN NỘP
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Evidence Locker */}
          <Card
            title={`Kho tang vật niêm phong (${c.evidence.length})`}
            icon={<Archive className="h-4 w-4" />}
            subtitle="Vũ khí, chất cấm và tang chứng liên quan đến đối tượng"
          >
            {c.evidence.length === 0 ? (
              <Empty>Chưa có tang vật nào được niêm phong cho đối tượng này.</Empty>
            ) : (
              <div className="space-y-3">
                {c.evidence.map((e) => (
                  <div
                    key={e.id}
                    className="rounded border border-line bg-panel2/60 p-3 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <Badge tone="info">NIÊM PHONG TỦ #{e.locker}</Badge>
                      <span className="font-mono text-[11px] text-slate-400">{fmtDate(e.createdAt)}</span>
                    </div>
                    <pre className="whitespace-pre-wrap font-sans text-slate-200 leading-relaxed">
                      {e.items}
                    </pre>
                    {e.mediaUrl && (
                      <a
                        href={e.mediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-neon hover:underline font-mono text-[11px]"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Xem Ảnh / Video Bằng Chứng
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
