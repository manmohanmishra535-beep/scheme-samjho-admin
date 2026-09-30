import { requireSuperAdmin } from "@/lib/admin";

export default async function SettingsPage() {
  await requireSuperAdmin();

  return (
    <div>
      <h1 className="text-2xl font-bold">
        Admin Settings
      </h1>

      <p className="mt-2 text-slate-500">
        Only super administrators can access this page.
      </p>
    </div>
  );
}