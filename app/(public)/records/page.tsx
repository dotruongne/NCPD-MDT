import { redirect } from "next/navigation";

export default function LegacyPublicRecordsPage() {
  redirect("/laws");
}
