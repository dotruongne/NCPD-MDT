import { redirect } from "next/navigation";
import { requireOfficer } from "@/lib/auth";
import { hasFinanceAccess, hasFtoAccess } from "@/lib/roles";

export default async function DepartmentsPage() {
  const officer = await requireOfficer();
  if (hasFinanceAccess(officer.role, officer.rank)) redirect("/mdt/departments/finance");
  if (hasFtoAccess(officer.role, officer.rank)) redirect("/mdt/departments/fto");
  redirect("/mdt");
}
