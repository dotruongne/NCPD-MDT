import Link from "next/link";
import { BookOpen, BriefcaseBusiness, Landmark, Shield } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function CitizenPortalNav() {
  return (
    <>
      <div className="portal-topline h-2" />
      <header className="portal-header border-b">
        <div className="mx-auto flex min-h-[86px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="portal-logo flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2">
              <Landmark className="h-6 w-6" />
            </span>
            <span className="min-w-0">
              <span className="portal-muted block text-[10px] font-semibold uppercase tracking-[0.14em]">Novaris City</span>
              <span className="portal-heading block truncate text-base font-bold sm:text-lg">Cổng thông tin công dân</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 sm:flex" aria-label="Điều hướng cổng công dân">
            <Link href="/laws" className="portal-copy inline-flex items-center gap-2 rounded-sm px-3 py-2 text-xs font-semibold transition hover:bg-black/[0.04] dark:hover:bg-white/[0.05]">
              <BookOpen className="h-4 w-4" /> Bộ luật
            </Link>
            <Link href="/recruitment" className="portal-copy inline-flex items-center gap-2 rounded-sm px-3 py-2 text-xs font-semibold transition hover:bg-black/[0.04] dark:hover:bg-white/[0.05]">
              <BriefcaseBusiness className="h-4 w-4" /> Tuyển dụng
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle className="portal-theme-toggle" />
            <span className="portal-logo hidden h-9 w-9 items-center justify-center rounded-full border sm:flex" aria-label="Sở Cảnh sát Novaris City (NCPD)">
              <Shield className="h-4 w-4" />
            </span>
          </div>
        </div>
        <nav className="portal-header flex justify-center gap-4 border-t px-4 py-2 sm:hidden" aria-label="Điều hướng cổng công dân">
          <Link href="/laws" className="portal-copy inline-flex items-center gap-2 py-1 text-xs font-semibold"><BookOpen className="h-4 w-4" /> Bộ luật</Link>
          <Link href="/recruitment" className="portal-copy inline-flex items-center gap-2 py-1 text-xs font-semibold"><BriefcaseBusiness className="h-4 w-4" /> Tuyển dụng</Link>
        </nav>
      </header>
    </>
  );
}
