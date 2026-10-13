"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, Minus, Plus, Save, Trash2, Search, Scale, FileText, Send } from "lucide-react";
import { createIncident } from "@/app/mdt/actions";
import { money } from "@/lib/utils";
import { useToast } from "@/components/toast-provider";

type Charge = { id: string; code: string; title: string; category: string; fine: number; jailMinutes: number };
type CitizenOpt = { id: string; fullName: string; citizenId: string };
type Officer = { fullName: string; rank: string; badge: string; callsign: string | null };

type Draft = {
  title: string;
  location: string;
  narrative: string;
  suspectId: string;
  suspectName: string;
  counts: Record<string, number>;
};

const DRAFT_KEY = "mdt_report_draft_v1";
const EMPTY: Draft = { title: "", location: "", narrative: "", suspectId: "", suspectName: "", counts: {} };

export function ReportBuilder({
  charges,
  citizens,
  officer,
  presetSuspect,
}: {
  charges: Charge[];
  citizens: CitizenOpt[];
  officer: Officer;
  presetSuspect?: string;
}) {
  const router = useRouter();
  const [d, setD] = useState<Draft>({ ...EMPTY, suspectId: presetSuspect ?? "" });
  const [chargeQuery, setChargeQuery] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const { showToast } = useToast();

  // Khôi phục bản nháp sau khi lỡ F5
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Draft;
        setD({ ...EMPTY, ...saved, suspectId: presetSuspect || saved.suspectId || "" });
        setSavedAt("Đã khôi phục bản nháp");
      }
    } catch {}
    setLoaded(true);
  }, [presetSuspect]);

  // Tự lưu nháp (debounce 400ms)
  useEffect(() => {
    if (!loaded) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
        setSavedAt(`Lưu tự động: ${new Date().toLocaleTimeString("vi-VN")}`);
      } catch {}
    }, 400);
    return () => clearTimeout(timer.current);
  }, [d, loaded]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));
  const bump = (id: string, delta: number) =>
    setD((p) => {
      const next = { ...p.counts };
      const n = (next[id] ?? 0) + delta;
      if (n <= 0) delete next[id];
      else next[id] = Math.min(n, 20);
      return { ...p, counts: next };
    });

  const selected = useMemo(
    () => charges.filter((c) => d.counts[c.id]).map((c) => ({ ...c, count: d.counts[c.id] })),
    [charges, d.counts]
  );
  const totalFine = selected.reduce((s, c) => s + c.fine * c.count, 0);
  const totalJail = selected.reduce((s, c) => s + c.jailMinutes * c.count, 0);

  const filteredCharges = useMemo(() => {
    if (!chargeQuery.trim()) return charges;
    const q = chargeQuery.toLowerCase();
    return charges.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    );
  }, [charges, chargeQuery]);

  const cats = useMemo(() => [...new Set(filteredCharges.map((c) => c.category))], [filteredCharges]);
  const suspect = citizens.find((c) => c.id === d.suspectId);

  const markdown = () => {
    const lines = [
      `## 🚨 BÁO CÁO VỤ ÁN NCPD`,
      `**Sĩ quan thụ lý:** ${officer.rank} ${officer.fullName} (#${officer.badge})${officer.callsign ? ` · Callsign: ${officer.callsign}` : ""}`,
      `**Thời gian lập:** ${new Date().toLocaleString("vi-VN")}`,
      `**Tiêu đề:** ${d.title || "—"}`,
      `**Đối tượng:** ${suspect ? `${suspect.fullName} (CCCD: ${suspect.citizenId})` : d.suspectName || "—"}`,
      `**Địa điểm:** ${d.location || "—"}`,
      ``,
      `### ⚖️ Tội danh áp dụng`,
      ...(selected.length
        ? selected.map((c) => `- \`${c.code}\` ${c.title}${c.count > 1 ? ` ×${c.count}` : ""} — ${money(c.fine * c.count)} / ${c.jailMinutes * c.count} phút tù`)
        : ["- Không có"]),
      ``,
      `> **Tổng tiền phạt:** ${money(totalFine)}`,
      `> **Tổng thời gian thụ án:** ${totalJail} phút`,
      ``,
      `### 📝 Tường trình sự việc`,
      d.narrative || "—",
    ];
    return lines.join("\n");
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(markdown());
    } catch {
      const ta = document.createElement("textarea");
      ta.value = markdown();
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    showToast({ type: "success", title: "Đã sao chép", message: "Bản báo cáo đã được chép vào bộ nhớ tạm." });
  };

  const submit = () => {
    start(async () => {
      const res = await createIncident({
        title: d.title,
        location: d.location,
        narrative: d.narrative,
        suspectId: d.suspectId || null,
        suspectName: d.suspectName,
        charges: selected.map((c) => ({ id: c.id, count: c.count })),
      });
      if (!res.ok) return showToast({ type: "error", title: "Không thể tạo báo cáo", message: res.error });
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {}
      router.push("/mdt/reports");
    });
  };

  const clearDraft = () => {
    if (!confirm("Bạn có chắc chắn muốn xóa toàn bộ bản nháp này?")) return;
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
    setD(EMPTY);
    setSavedAt(null);
  };

  return (
    <div className="mdt-report-builder grid gap-6 lg:grid-cols-5">
      {/* Left Column: Form & Charges */}
      <div className="space-y-6 lg:col-span-3">
        {/* Incident Info */}
        <section className="card report-builder-section space-y-4">
          <div className="card-title justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-neon" />
              <span>Thông tin vụ việc & Đối tượng</span>
            </div>
            <span className="flex items-center gap-1.5 font-mono text-[11px] normal-case tracking-normal text-slate-400">
              <Save className="h-3.5 w-3.5 text-neon" /> {savedAt ?? "Chưa lưu nháp"}
            </span>
          </div>

          <div>
            <label className="label">Tiêu đề vụ việc *</label>
            <input
              className="input font-semibold"
              placeholder="VD: Cướp cửa hàng 24/7 Vinewood & Bỏ chạy tốc độ cao"
              value={d.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Đối tượng (Hồ sơ CSDL)</label>
              <select
                className="input"
                value={d.suspectId}
                onChange={(e) => set("suspectId", e.target.value)}
              >
                <option value="">— Chọn hồ sơ công dân —</option>
                {citizens.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.citizenId})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Hoặc nhập tên tạm thời</label>
              <input
                className="input"
                placeholder="Nhập tên nếu chưa có trong CSDL"
                value={d.suspectName}
                onChange={(e) => set("suspectName", e.target.value)}
                disabled={!!d.suspectId}
              />
            </div>
          </div>

          <div>
            <label className="label">Địa điểm xảy ra sự vụ</label>
            <input
              className="input"
              placeholder="VD: Ngã tư Clinton Ave & Alta St"
              value={d.location}
              onChange={(e) => set("location", e.target.value)}
            />
          </div>

          <div>
            <label className="label">Tường trình chi tiết của sĩ quan *</label>
            <textarea
              className="input leading-relaxed"
              rows={7}
              placeholder="Ghi lại diễn biến sự việc: thời gian phát hiện, quá trình truy đuổi, phương tiện sử dụng, vũ khí thu giữ và lời khai của nghi phạm..."
              value={d.narrative}
              onChange={(e) => set("narrative", e.target.value)}
            />
          </div>
        </section>

        {/* Charge Selector */}
        <section className="card report-builder-section report-charge-section space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/70 pb-3">
            <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase text-slate-300">
              <Scale className="h-4 w-4 text-neon" />
              <span>Bảng danh mục tội danh</span>
            </div>
            {/* Search charge */}
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
              <input
                value={chargeQuery}
                onChange={(e) => setChargeQuery(e.target.value)}
                placeholder="Tìm tội danh, mã số..."
                className="input pl-8 py-1 text-xs"
              />
            </div>
          </div>

          <div className="space-y-5">
            {cats.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-500">
                Không tìm thấy tội danh khớp với từ khóa "{chargeQuery}".
              </p>
            ) : (
              cats.map((cat) => (
                <div key={cat} className="space-y-2">
                  <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-neon">
                    // {cat}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {filteredCharges
                      .filter((c) => c.category === cat)
                      .map((c) => {
                        const n = d.counts[c.id] ?? 0;
                        return (
                          <div
                            key={c.id}
                            className={`flex items-center justify-between gap-2 rounded-lg border p-2.5 text-xs transition ${
                              n
                                ? "border-neon/60 bg-neon/10 shadow-neon"
                                : "border-line bg-panel2/50 hover:border-line/90"
                            }`}
                          >
                            <div className="flex-1 pr-1">
                              <p className="font-semibold text-white">
                                <span className="font-mono text-neon font-bold mr-1">{c.code}</span>
                                {c.title}
                              </p>
                              <p className="font-mono text-[11px] text-slate-400 mt-0.5">
                                {money(c.fine)} · {c.jailMinutes}p tù
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => bump(c.id, -1)}
                                className="btn px-2 py-1 text-xs"
                                disabled={!n}
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-5 text-center font-mono font-bold text-white text-xs">
                                {n}
                              </span>
                              <button
                                type="button"
                                onClick={() => bump(c.id, 1)}
                                className="btn px-2 py-1 text-xs"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Right Column: Sticky Summary & Export */}
      <aside className="lg:col-span-2">
        <div className="card report-builder-summary sticky top-20 space-y-5 shadow-card">
          <div className="card-title">
            <span>Tổng kết án phạt</span>
            <span className="rounded bg-neon/15 px-2 py-0.5 font-mono text-[10px] text-neon">
              {selected.length} Tội danh
            </span>
          </div>

          {/* Selected charges list */}
          {selected.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line p-5 text-center text-xs text-slate-500">
              Chưa chọn tội danh nào. Hãy bấm dấu (+) ở danh mục bên cạnh.
            </div>
          ) : (
            <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
              {selected.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-2 rounded border border-line bg-panel2/60 p-2 text-xs"
                >
                  <div className="flex-1">
                    <span className="font-mono font-bold text-neon">{c.code}</span>{" "}
                    <span className="text-slate-200">{c.title}</span>
                    {c.count > 1 && (
                      <span className="ml-1 rounded bg-neon/20 px-1 py-0.2 font-mono font-bold text-neon">
                        ×{c.count}
                      </span>
                    )}
                  </div>
                  <span className="font-mono font-bold text-amber-300">
                    {money(c.fine * c.count)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Totals Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-danger/40 bg-danger/10 p-4 text-center">
              <p className="font-mono text-[10px] uppercase font-bold tracking-wider text-red-300">
                Tổng tiền phạt
              </p>
              <p className="mt-1 font-mono text-2xl font-black text-white">
                {money(totalFine)}
              </p>
            </div>
            <div className="rounded-xl border border-warn/40 bg-warn/10 p-4 text-center">
              <p className="font-mono text-[10px] uppercase font-bold tracking-wider text-amber-300">
                Tổng án tù
              </p>
              <p className="mt-1 font-mono text-2xl font-black text-white">
                {totalJail}
                <span className="text-xs font-normal text-slate-400"> phút</span>
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={copy}
              className="btn btn-neon w-full py-2.5 font-mono text-xs font-semibold"
            >
              <Copy className="h-4 w-4" />
              EXPORT BÁO CÁO DISCORD (MARKDOWN)
            </button>

            <button
              type="button"
              onClick={submit}
              disabled={pending}
              className="btn btn-ok w-full py-2.5 font-mono text-xs font-bold tracking-wider shadow-ok"
            >
              {pending ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ĐANG LƯU VÀO CSDL...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Send className="h-3.5 w-3.5" />
                  LƯU BÁO CÁO VÀO HỆ THỐNG
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={clearDraft}
              className="btn btn-danger w-full py-2 text-xs font-mono"
            >
              <Trash2 className="h-3.5 w-3.5" /> XÓA BẢN NHÁP
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
