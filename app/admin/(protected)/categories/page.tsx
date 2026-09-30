import { requireAdmin } from "@/lib/admin";
import CategoriesClient from "@/components/admin/CategoriesClient";

export default async function CategoriesPage() {
  const admin = await requireAdmin();

  return <CategoriesClient role={admin.role} />;
}