import { CitizenPortalNav } from "@/components/citizen-portal-nav";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="citizen-portal portal-page">
      <CitizenPortalNav />
      {children}
      <footer className="portal-footer border-t">
        <div className="portal-muted mx-auto flex max-w-7xl flex-col gap-1 px-5 py-4 text-[10px] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span>Novaris City · Cổng thông tin công dân</span>
          <span>Môi trường nhập vai FiveM · Không phải cơ quan chính phủ có thật</span>
        </div>
      </footer>
    </div>
  );
}
