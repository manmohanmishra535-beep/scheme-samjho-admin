import { requireAdmin } from "@/lib/admin";
import SchemeClient from "./SchemeClient";

export default async function SchemesPage() {
  const admin = await requireAdmin();

  return <SchemeClient role={admin.role} />;
}