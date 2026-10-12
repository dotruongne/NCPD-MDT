import { requireOfficer } from "@/lib/auth";
import { MdtShell } from "@/components/mdt-shell";
import { logout } from "../login/actions";
import { toggleDuty } from "./actions";

export const dynamic = "force-dynamic";

export default async function MdtLayout({ children }: { children: React.ReactNode }) {
  const o = await requireOfficer();
  return (
    <MdtShell
      logoutAction={logout}
      toggleDutyAction={toggleDuty}
      officer={{ fullName: o.fullName, rank: o.rank, badge: o.badge, callsign: o.callsign, onDuty: o.onDuty, role: o.role }}
    >
      {children}
    </MdtShell>
  );
}
