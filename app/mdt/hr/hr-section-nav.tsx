import Link from "next/link";
import { FileWarning, ShieldCheck, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { id: "personnel", href: "/mdt/hr", label: "Quản lý nhân sự", icon: ShieldCheck },
  { id: "recruitment", href: "/mdt/hr/recruitment", label: "Khu ứng tuyển", icon: UserCheck },
  { id: "reports", href: "/mdt/hr/reports", label: "Báo án công dân", icon: FileWarning },
] as const;

export default function HrSectionNav({ active }: { active: (typeof ITEMS)[number]["id"] }) {
  return (
    <nav
      aria-label="Phân hệ quản lý nhân sự"
      className="flex flex-wrap gap-1 border-b border-line"
    >
      {ITEMS.map(({ id, href, label, icon: Icon }) => (
        <Link
          key={id}
          href={href}
          aria-current={active === id ? "page" : undefined}
          className={cn(
            "inline-flex min-h-11 items-center gap-2 border-b-2 px-3 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400",
            active === id
              ? "border-sky-400 text-sky-200"
              : "border-transparent text-slate-400 hover:border-line hover:text-slate-200",
          )}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
