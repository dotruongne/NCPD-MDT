"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Shield,
  Lock,
  User,
  Radio,
  Terminal,
  Activity,
  ArrowRight,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { login, type LoginState } from "./actions";
import { ToastOnChange } from "@/components/toast-provider";

function TerminalWelcome({
  officer,
  redirectUrl,
}: {
  officer?: { fullName: string; badge: string; rank: string };
  redirectUrl?: string;
}) {
  const router = useRouter();
  const [typedWelcome, setTypedWelcome] = useState("");
  const [step, setStep] = useState(0); // 0: typing welcome, 1: auth ok, 2: redirecting

  const targetText = officer?.fullName
    ? `Chào mừng trở lại, ${officer.rank ? `[${officer.rank}] ` : ""}${officer.fullName} #${officer.badge || ""}`
    : "Chào mừng trở lại, Sĩ quan NCPD";

  useEffect(() => {
    let currentIdx = 0;
    const interval = setInterval(() => {
      currentIdx++;
      setTypedWelcome(targetText.slice(0, currentIdx));
      if (currentIdx >= targetText.length) {
        clearInterval(interval);
        setTimeout(() => setStep(1), 350);
        setTimeout(() => setStep(2), 750);
        setTimeout(() => {
          router.push(redirectUrl || "/mdt");
        }, 1200);
      }
    }, 28);

    return () => clearInterval(interval);
  }, [targetText, redirectUrl, router]);

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="flex items-center gap-2 border border-emerald-500/30 bg-emerald-950/20 px-3.5 py-2 rounded text-emerald-400">
        <CheckCircle2 className="h-4 w-4 animate-pulse shrink-0" />
        <span className="font-bold tracking-wider">XÁC THỰC DANH TÍNH THÀNH CÔNG // ACCESS GRANTED</span>
      </div>

      <div className="rounded border border-[#1e2e42] bg-[#070d18] p-4 space-y-2.5 text-slate-300">
        <div className="flex items-start gap-2 text-sky-400">
          <span className="text-sky-500 font-bold select-none">&gt;</span>
          <span className="font-semibold text-white tracking-wide">
            {typedWelcome}
            <span className="inline-block w-2 h-4 ml-1 bg-sky-400 animate-pulse align-middle" />
          </span>
        </div>

        {step >= 1 && (
          <div className="flex items-center gap-2 text-[11px] text-emerald-400/90 pl-3 border-l-2 border-emerald-500/40 animate-fade-in">
            <span className="text-slate-500">&gt;</span>
            <span>KHỞI TẠO PHIÊN TÁC CHIẾN CAD/MDT... [OK]</span>
          </div>
        )}

        {step >= 2 && (
          <div className="flex items-center gap-2 text-[11px] text-sky-400/90 pl-3 border-l-2 border-sky-500/40 animate-fade-in">
            <span className="text-slate-500">&gt;</span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-sky-400 animate-ping" />
              ĐANG ĐIỀU HƯỚNG VÀO HỆ THỐNG ĐIỀU HÀNH TRUNG TÂM...
            </span>
          </div>
        )}
      </div>

      <div className="text-center font-mono text-[10px] text-slate-500 animate-pulse">
        VUI LÒNG ĐỢI TRONG GIÂY LÁT...
      </div>
    </div>
  );
}

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
    <div className="min-h-screen bg-[#050911] text-slate-200 flex flex-col justify-between selection:bg-sky-400/20 selection:text-sky-100 font-sans relative overflow-x-hidden">
      {/* ── Background Cyber Matrix / Tactical Grid (banner-design + ui-ux-pro-max) ── */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0c1726_1px,transparent_1px),linear-gradient(to_bottom,#0c1726_1px,transparent_1px)] bg-[size:36px_36px] pointer-events-none opacity-40" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* ── Top Agency Strip ── */}
      <header className="border-b border-[#1b2b3f] bg-[#08101d]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md border border-[#2a4362] bg-[#0e1a2b] text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
              <Shield className="h-5 w-5" />
            </span>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold tracking-wider text-white">
                  NOVARIS POLICE DEPARTMENT
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.2 text-[9px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded">
                  OFFICIAL
                </span>
              </div>
              <span className="font-mono text-[9px] tracking-widest text-slate-400 uppercase">
                Tactical CAD/MDT // Level-4 Security Perimeter
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px]">
            <div className="hidden md:flex items-center gap-2 border border-[#1b2b3f] bg-[#0c1626] px-2.5 py-1 rounded">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300">CAD SERVER: ONLINE (412.85 MHz)</span>
            </div>
            <Link
              href="/"
              className="text-slate-400 hover:text-white transition flex items-center gap-1 text-xs border border-transparent hover:border-[#2a4362] px-2.5 py-1 rounded"
            >
              <span>Cổng công dân</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Login Layout with Hero Banner Section ── */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10">
        <div className="w-full max-w-6xl grid gap-8 lg:grid-cols-12 items-center">
          
          {/* Left Column: Tactical Hero Banner (banner-design layout, 7 cols) */}
          <div className="space-y-6 lg:col-span-7 pr-0 lg:pr-4">
            
            {/* Top Tactical Status Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-[#0d1d33]/80 px-3.5 py-1 font-mono text-[10px] font-bold text-sky-300 tracking-wider shadow-[0_0_15px_rgba(56,189,248,0.15)]">
              <Radio className="h-3.5 w-3.5 text-sky-400 animate-pulse" />
              <span>TERMINAL SECURITY PROTOCOL // CLEARANCE LEVEL-4</span>
            </div>

            {/* Hero Headline & Subtext */}
            <div className="space-y-2">
              <h1 className="font-mono text-3xl sm:text-4xl lg:text-[40px] font-black tracking-tight text-white uppercase leading-tight">
                Thiết Bị Đầu Cuối
                <span className="block bg-gradient-to-r from-sky-400 via-sky-200 to-blue-400 bg-clip-text text-transparent mt-1">
                  Tác Chiến Cảnh Sát Di Động
                </span>
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed max-w-xl font-sans">
                Trung tâm điều phối phản ứng nhanh 911, tra cứu hồ sơ tiền án công dân, quản lý đăng ký phương tiện DMV và điều phối tuần tra thời gian thực tại Thành phố Novaris.
              </p>
            </div>

            {/* Tactical Telemetry Strip (ui-ux-pro-max Trust & Status proof metrics) */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <div className="rounded border border-[#1b2b3f] bg-[#0c1626]/90 p-3 text-center space-y-0.5">
                <span className="block font-mono text-base font-bold text-sky-400">10-8</span>
                <span className="block font-mono text-[10px] text-slate-400 uppercase tracking-wider">Trực tác chiến</span>
              </div>
              <div className="rounded border border-[#1b2b3f] bg-[#0c1626]/90 p-3 text-center space-y-0.5">
                <span className="block font-mono text-base font-bold text-emerald-400">256-BIT</span>
                <span className="block font-mono text-[10px] text-slate-400 uppercase tracking-wider">Mã hóa AES</span>
              </div>
              <div className="rounded border border-[#1b2b3f] bg-[#0c1626]/90 p-3 text-center space-y-0.5">
                <span className="block font-mono text-base font-bold text-amber-400">&lt;15ms</span>
                <span className="block font-mono text-[10px] text-slate-400 uppercase tracking-wider">Độ trễ CAD</span>
              </div>
            </div>

            {/* Tactical Grid Feature Modules */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-[#1b2b3f] bg-[#091220]/80 p-3.5 space-y-1 hover:border-sky-500/40 transition">
                <div className="flex items-center gap-2 text-sky-300 font-mono text-xs font-bold uppercase">
                  <Terminal className="h-4 w-4 text-sky-400" />
                  <span>Tra cứu tức thì</span>
                </div>
                <p className="text-xs text-slate-400 leading-normal">
                  CSDL công dân, giấy phép lái xe, phương tiện DMV và danh sách vũ khí sở hữu.
                </p>
              </div>

              <div className="rounded-lg border border-[#1b2b3f] bg-[#091220]/80 p-3.5 space-y-1 hover:border-amber-500/40 transition">
                <div className="flex items-center gap-2 text-amber-300 font-mono text-xs font-bold uppercase">
                  <Activity className="h-4 w-4 text-amber-400" />
                  <span>Điều phối tuần tra</span>
                </div>
                <p className="text-xs text-slate-400 leading-normal">
                  Tiếp nhận tín hiệu 911, cập nhật trạng thái 10-8/10-7 và liên kết chi viện khẩn cấp.
                </p>
              </div>
            </div>

            {/* Warning Internal Affairs Banner */}
            <div className="rounded-lg border border-[#6b3535]/60 bg-[#231215]/80 p-3.5 text-xs flex items-start gap-3 backdrop-blur-sm">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-slate-300">
                <span className="font-mono font-bold text-red-300 uppercase text-[11px] tracking-wider">
                  CẢNH BÁO AN NINH NỘI BỘ // NCPD IA REGULATION
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                  Mọi hành vi đăng nhập trái phép, chia sẻ tài khoản hoặc truy xuất hồ sơ không có lý do tác chiến sẽ bị ghi nhận IP và chuyển giao Ban Thanh tra Nội vụ.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Tactical Login Box with Cyber HUD frame (5 cols) */}
          <div className="lg:col-span-5">
            <div className="rounded-xl border border-[#22364e] bg-[#0a1322] shadow-[0_0_50px_rgba(3,105,161,0.2)] overflow-hidden relative backdrop-blur-md">
              {/* Terminal Card Header */}
              <div className="border-b border-[#1b2b3f] bg-[#0e1a2c] px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-sky-500/10 text-sky-400 border border-sky-500/30">
                    <Lock className="h-3.5 w-3.5" />
                  </span>
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                    XÁC THỰC SĨ QUAN TUẦN TRA
                  </span>
                </div>
                <span className="font-mono text-[10px] text-sky-400 font-bold bg-[#060b13] border border-sky-500/30 px-2 py-0.5 rounded shadow-[0_0_10px_rgba(56,189,248,0.2)]">
                  PORT #8092
                </span>
              </div>

              {/* Form Content */}
              <div className="p-6 sm:p-7 space-y-5">
                {state?.success ? (
                  <TerminalWelcome
                    officer={state.officer}
                    redirectUrl={state.redirectUrl}
                  />
                ) : (
                  <>
                    {/* Status indicator bar */}
                    <div className="flex items-center justify-between border border-[#1b2b3f] bg-[#070e1a] px-3.5 py-2 rounded-md text-xs font-mono">
                      <span className="flex items-center gap-2 text-slate-300 text-[11px]">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        GATEWAY ONLINE
                      </span>
                      <span className="text-slate-500 text-[10px]">MD5 / TLS 1.3 / AES-256</span>
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
                            className="input font-mono pl-10 text-xs py-2.5 bg-[#060c16] border-[#22364e] text-white focus:border-sky-400 placeholder:text-slate-600 rounded-md"
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
                            className="input font-mono pl-10 text-xs py-2.5 bg-[#060c16] border-[#22364e] text-white focus:border-sky-400 placeholder:text-slate-600 rounded-md"
                            placeholder="Nhập mật khẩu..."
                            autoComplete="current-password"
                            required
                          />
                        </div>
                      </div>

                      {/* Tactical Terminal Console Line */}
                      <div className="rounded border border-[#1b2b3f] bg-[#060c16] px-3 py-2 text-[11px] font-mono text-slate-400 flex items-center gap-2">
                        <span className="text-sky-400 font-bold">&gt;</span>
                        <span className="text-slate-400">Chờ lệnh xác thực thông tin...</span>
                        <span className="inline-block w-1.5 h-3 bg-sky-400/80 animate-pulse ml-auto" />
                      </div>

                      <div className="pt-2">
                        <SubmitButton />
                      </div>
                    </form>
                  </>
                )}

                <ToastOnChange
                  eventKey={state}
                  message={state?.error}
                  type="error"
                  title="Xác thực không thành công"
                />

                {/* Footer security note inside card */}
                <div className="border-t border-[#1b2b3f] pt-4 flex items-center justify-between font-mono text-[10px] text-slate-500">
                  <span>NOVARIS POLICE DEPT</span>
                  <span>CAD/MDT BUILD v2.4</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Page Footer ── */}
      <footer className="border-t border-[#1b2b3f] bg-[#08101d]/80 py-3.5 px-4 text-center font-mono text-[10px] text-slate-500 relative z-10">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>NOVARIS CITY POLICE DEPARTMENT // TACTICAL SECURE GATEWAY</span>
          <span>CHỈ DÙNG CHO MỤC ĐÍCH NHẬP VAI NỘI BỘ (FIVEM ROLEPLAY)</span>
        </div>
      </footer>
    </div>
  );
}
