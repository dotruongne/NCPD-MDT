"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeftRight, Building2, Shield } from "lucide-react";

export function PortalModeSwitch() {
  const pathname = usePathname();
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  const [pending, setPending] = useState(false);
  const isMdt = pathname === "/login" || pathname.startsWith("/mdt");
  const destination = isMdt ? "/" : "/login";

  useEffect(() => {
    setLeaving(false);
    setPending(false);
  }, [pathname]);

  function switchMode() {
    if (pending) return;
    setPending(true);
    setLeaving(true);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(() => router.push(destination), reducedMotion ? 0 : 190);
  }

  return (
    <>
      <button
        type="button"
        onClick={switchMode}
        disabled={pending}
        aria-label={isMdt ? "Chuyển sang cổng công dân" : "Chuyển sang hệ thống MDT sĩ quan"}
        className="portal-mode-switch fixed bottom-5 right-5 z-[90] inline-flex min-h-12 items-center gap-2.5 rounded-full border px-4 py-3 text-xs font-bold shadow-xl transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-80 sm:bottom-7 sm:right-7 sm:px-5"
      >
        {isMdt ? <Building2 className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
        <span>{pending ? "Đang chuyển..." : isMdt ? "Cổng công dân" : "Khu vực sĩ quan"}</span>
        <ArrowLeftRight className="h-3.5 w-3.5 opacity-70" />
      </button>
      {leaving && <div className="portal-transition-cover" aria-hidden="true" />}
    </>
  );
}
