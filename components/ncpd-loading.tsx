import { Shield, Radio, Activity, Cpu } from "lucide-react";

export function NcpdLoading({
  detail = "Đang kết nối hệ thống nghiệp vụ và nạp dữ liệu tác chiến",
}: {
  detail?: string;
}) {
  return (
    <main
      className="min-h-screen bg-[#060a12] text-slate-200 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none font-mono"
      aria-busy="true"
    >
      {/* Background HUD Tactical Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0d1a2d18_1px,transparent_1px),linear-gradient(to_bottom,#0d1a2d18_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.08)_0%,transparent_70%)] pointer-events-none" />

      {/* Top Banner Tag */}
      <div className="absolute top-6 left-6 hidden sm:flex items-center gap-2 text-[10px] tracking-widest text-slate-500 uppercase">
        <Radio className="h-3.5 w-3.5 text-sky-400 animate-pulse" />
        <span>NCPD SECURE CAD/MDT FREQ // 412.850 MHz</span>
      </div>

      <div className="absolute top-6 right-6 hidden sm:flex items-center gap-2 text-[10px] tracking-widest text-emerald-400 font-semibold border border-emerald-500/20 bg-emerald-950/30 px-2.5 py-1 rounded">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
        <span>NODE ACTIVE: AP-NOVARIS-01</span>
      </div>

      {/* Center Radar / HUD Container */}
      <section
        className="relative z-10 flex flex-col items-center text-center max-w-md w-full px-6 py-8 rounded-xl border border-[#1e2f47]/80 bg-[#0a121e]/90 shadow-[0_0_50px_rgba(3,105,161,0.15)] backdrop-blur-md"
        role="status"
        aria-live="polite"
      >
        {/* Tactical HUD Header */}
        <div className="w-full flex items-center justify-between border-b border-[#1b2b3e] pb-3 mb-6 text-[10px] text-slate-400 tracking-wider">
          <span className="flex items-center gap-1.5 text-sky-400 font-bold">
            <Cpu className="h-3 w-3" />
            <span>INITIALIZING SYSTEM</span>
          </span>
          <span className="text-slate-500">CLEARANCE: LVL-4</span>
        </div>

        {/* Tactical Circular Radar Scanner */}
        <div className="relative w-28 h-28 my-2 flex items-center justify-center">
          {/* Outer dashed radar ring */}
          <div className="absolute inset-0 rounded-full border border-sky-500/20 animate-[spin_12s_linear_infinite]" />
          
          {/* Middle pulsing ring */}
          <div className="absolute inset-2 rounded-full border border-sky-400/40 border-t-transparent border-l-transparent animate-[spin_3s_linear_infinite]" />
          
          {/* Inner reverse fast ring */}
          <div className="absolute inset-4 rounded-full border border-dashed border-sky-300/30 animate-[spin_6s_linear_infinite_reverse]" />
          
          {/* Radar sweeping beam */}
          <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0_300deg,rgba(56,189,248,0.25)_360deg)] animate-[spin_2s_linear_infinite] pointer-events-none" />

          {/* Center Badge Shield with soft pulse */}
          <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-[#0d1c2e] border border-sky-400/60 shadow-[0_0_20px_rgba(56,189,248,0.35)] text-sky-300">
            <Shield className="h-7 w-7 animate-pulse text-sky-300" />
          </div>
        </div>

        {/* Title & Status */}
        <div className="mt-5 space-y-1.5">
          <h1 className="font-mono text-base font-bold tracking-wider text-white uppercase flex items-center justify-center gap-2">
            <span>NOVARIS POLICE DEPT</span>
            <span className="inline-block px-1.5 py-0.5 text-[9px] bg-sky-500/20 text-sky-300 border border-sky-500/40 rounded">
              CAD/MDT
            </span>
          </h1>
          <p className="text-xs text-sky-400/90 font-medium">
            {detail}
          </p>
        </div>

        {/* Tactical Telemetry Progress Bar */}
        <div className="w-full mt-6 space-y-2">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Activity className="h-3 w-3 text-sky-400 animate-pulse" />
              <span>DỮ LIỆU TÁC CHIẾN ĐANG NẠP...</span>
            </span>
            <span className="text-sky-300 font-bold">100% SECURED</span>
          </div>

          <div className="w-full h-1.5 bg-[#070e17] rounded-full overflow-hidden border border-[#1b2b3e] relative">
            <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-sky-500 via-sky-300 to-emerald-400 rounded-full w-full animate-[pulse_1.5s_ease-in-out_infinite]" />
          </div>
        </div>

        {/* Footer Terminal Stamp */}
        <div className="w-full pt-4 mt-6 border-t border-[#1b2b3e]/80 flex items-center justify-between text-[9px] text-slate-500">
          <span>ENC: AES-256-GCM</span>
          <span>BUILD: v2.4-STABLE</span>
        </div>
      </section>

      {/* Bottom Legal / Disclaimer */}
      <footer className="absolute bottom-5 text-[10px] text-slate-600 tracking-wider text-center">
        CHỈ DÙNG CHO MỤC ĐÍCH ĐIỀU HÀNH NỘI BỘ NCPD // TRUY CẬP KHÔNG ĐƯỢC ỦY QUYỀN SẼ BỊ TRUY TỐ
      </footer>
    </main>
  );
}