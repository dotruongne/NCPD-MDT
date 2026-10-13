import { redirect } from "next/navigation";
import { requireOfficer } from "@/lib/auth";
import { FirstLoginPasswordForm } from "./password-form";

export const dynamic = "force-dynamic";

export default async function FirstLoginPasswordPage() {
  const officer = await requireOfficer({ allowPasswordChange: true });
  if (!officer.mustChangePassword) redirect("/mdt");

  return <FirstLoginPasswordForm fullName={officer.fullName} />;
}
