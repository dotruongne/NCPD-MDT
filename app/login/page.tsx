"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import {
  Shield,
  Lock,
  User,
  ShieldAlert,
  Radio,
  Terminal,
  Activity,
  ArrowRight,
  Wifi,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { login } from "./actions";
import { ToastOnChange } from "@/components/toast-provider";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn btn-neon w-full py-3 text-xs font-mono font-bold tracking-wider shadow-neon flex items-center justify-center gap-2 group disabled:cursor-wait"
    >
      {pending ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-sky-300/40 border-t-sky-300" />
          <span>ĐANG XÁC THỰC DANH TÍNH...</span>
        </>
      ) : (
        <>
          <Terminal className="h-4 w-4 text-neon" />
          <span>XÁC THỰC & MỞ PHIÊN TÁC CHIẾN</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </>
      )}
    </button>
  );
}

export default function LoginPage() {
  const [state, action] = useFormState(login, null);

  return (
    <div className="min-h-screen bg-[#070d18] text-slate-200 flex flex-col justify-between selection:bg-sky-400/20 selection:text-sky-100 font-sans">
      {/* ── Top Agency Strip ── */}
      <header className="border-b border-[#1e2e42] bg-[#0a1220]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded border border-[#2d4460] bg-[#111e30] text-sky-300">
              <Shield className="h-4 w-4" />
            </span>
            <div className="flex flex-col">
              <span className="font-mono text-xs font-bold tracking-wider text-white">
                NOVARIS POLICE DEPARTMENT
              </span>
              <span className="font-mono text-[9px] tracking-widest text-slate-400 uppercase">
                Mobile Data Terminal // Tactical Access Gate
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px]">
            <div className="hidden sm:flex items-center gap-2 border border-[#1e2e42] bg-[#0d1726] px-2.5 py-1 rounded">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300">NCPD-ENCRYPTED-NET</span>
            </div>
            <Link
              href="/"
              className="text-slate-400 hover:text-white transition flex items-center gap-1 text-xs"
            >
              <span>Cổng công dân</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Login Layout ── */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-5xl grid gap-8 lg:grid-cols-12 items-center">
          {/* Left Column: Tactical Agency Info (7 cols) */}
          <div className="space-y-6 lg:col-span-7 pr-0 lg:pr-6">
            <div className="inline-flex items-center gap-2 rounded border border-[#2d4460] bg-[#0e1929] px-3 py-1 font-mono text-[10px] font-bold text-sky-300 tracking-wider">
              <Radio className="h-3.5 w-3.5 text-sky-400" />
              <span>TERMINAL SECURITY PROTOCOL // LEVEL-4 CLEARANCE</span>
            </div>

            <div>
              <h1 className="font-mono text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight text-white uppercase leading-tight">
                Thiết Bị Đầu Cuối
                <span className="block text-sky-300 mt-1">Tác Chiến Di Động</span>
              </h1>
              <p className="mt-4 text-sm text-slate-400 leading-relaxed max-w-xl">
                Cổng truy cập dữ liệu tình báo, điều phối cuộc gọi 911 và quản lý hồ sơ tiền án
                dành riêng cho sĩ quan thuộc Sở Cảnh sát Novaris City (NCPD).
              </p>
            </div>

            {/* Tactical Grid Modules */}
            <div className="grid gap-3 sm:grid-cols-2 pt-2">
              <div className="rounded border border-[#1e2e42] bg-[#0d1726]/80 p-3.5 space-y-1">
                <div className="flex items-center gap-2 text-sky-300 font-mono text-xs font-bold uppercase">
                  <Terminal className="h-3.5 w-3.5" />
                  <span>Tra cứu tức thì</span>
                </div>
                <p className="text-xs text-slate-400 leading-normal">
                  CSDL công dân, giấy phép lái xe, phương tiện DMV và danh sách vũ khí sở hữu.
                </p>
              </div>

              <div className="rounded border border-[#1e2e42] bg-[#0d1726]/80 p-3.5 space-y-1">
                <div className="flex items-center gap-2 text-amber-300 font-mono text-xs font-bold uppercase">
                  <Activity className="h-3.5 w-3.5" />
                  <span>Điều phối tuần tra</span>
                </div>
                <p className="text-xs text-slate-400 leading-normal">
                  Tiếp nhận tín hiệu 911, cập nhật trạng thái 10-8/10-7 và liên kết đơn vị chi viện.
                </p>
              </div>
            </div>

            {/* Warning Banner */}
            <div className="rounded border border-[#6b3535]/60 bg-[#2a1518]/60 p-3 text-xs flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-slate-300">
                <span className="font-mono font-bold text-red-300 uppercase text-[11px]">
                  CẢNH BÁO AN NINH NỘI BỘ (NCPD IA REGULATION)
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                  Mọi hành vi đăng nhập trái phép, chia sẻ tài khoản hoặc truy xuất hồ sơ không có lý do tác chiến sẽ bị điều tra kỷ luật bởi Ban Thanh tra Nội vụ.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Tactical Login Box (5 cols) */}
          <div className="lg:col-span-5">
            <div className="rounded border border-[#253648] bg-[#0d1726] shadow-2xl overflow-hidden relative">
              {/* Terminal Card Header */}
              <div className="border-b border-[#1e2e42] bg-[#101b2a] px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-sky-300" />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                    XÁC THỰC SĨ QUAN
                  </span>
                </div>
                <span className="font-mono text-[10px] text-slate-400 bg-[#070d18] border border-[#1e2e42] px-2 py-0.5 rounded">
                  PORT #8092
                </span>
              </div>

              {/* Form Content */}
              <div className="p-6 sm:p-7 space-y-5">
                {/* Status indicator bar */}
                <div className="flex items-center justify-between border border-[#1e2e42] bg-[#08101a] px-3.5 py-2 rounded text-xs font-mono">
                  <span className="flex items-center gap-2 text-slate-300 text-[11px]">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    GATEWAY ONLINE
                  </span>
                  <span className="text-slate-500 text-[10px]">MD5/TLS 1.3</span>
                </div>

                <form action={action} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Tài khoản sĩ quan (Username)
                    </label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input
                        name="username"
                        className="input font-mono pl-10 text-xs py-2.5 bg-[#070d18] border-[#253648] text-white focus:border-sky-400 placeholder:text-slate-600 rounded"
                        placeholder="Nhập tên đăng nhập tuần tra..."
                        autoComplete="username"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Mật khẩu bảo mật (Password)
                    </label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input
                        name="password"
                        type="password"
                        className="input font-mono pl-10 text-xs py-2.5 bg-[#070d18] border-[#253648] text-white focus:border-sky-400 placeholder:text-slate-600 rounded"
                        placeholder="Nhập mật khẩu..."
                        autoComplete="current-password"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <SubmitButton />
                  </div>
                </form>

                <ToastOnChange
                  eventKey={state}
                  message={state?.error}
                  type="error"
                  title="Xác thực không thành công"
                />

                {/* Footer security note inside card */}
                <div className="border-t border-[#1e2e42] pt-4 flex items-center justify-between font-mono text-[10px] text-slate-500">
                  <span>NOVARIS POLICE DEPT</span>
                  <span>MDT BUILD v2.4</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Page Footer ── */}
      <footer className="border-t border-[#1e2e42] bg-[#0a1220]/60 py-3.5 px-4 text-center font-mono text-[10px] text-slate-500">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>NOVARIS CITY POLICE DEPARTMENT // TACTICAL NETWORK</span>
          <span>CHỈ DÙNG CHO MỤC ĐÍCH NHẬP VAI NỘI BỘ (FIVEM ROLEPLAY)</span>
        </div>
      </footer>
    </div>
  );
}
