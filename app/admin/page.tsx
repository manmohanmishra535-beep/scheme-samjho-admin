import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";

export default async function AdminEntryPage() {
  // Check authentication + admin authorization
  await requireAdmin();

  // Only an authorized admin reaches this point
  redirect("/admin/dashboard");
}