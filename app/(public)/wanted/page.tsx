import { redirect } from "next/navigation";

export default function LegacyWantedPage() {
  redirect("/login");
}
