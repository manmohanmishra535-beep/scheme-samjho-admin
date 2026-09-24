import { requireAdmin } from "@/lib/admin";
import AdminSidebar from "@/components/AdminSidebar";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdmin();

  return (
    <SidebarProvider>
      <AdminSidebar />

      <SidebarInset>
        <header className="flex h-16 items-center gap-3 border-b border-[#111827]/10 bg-white px-6">
          <SidebarTrigger />

          <div>
            <p className="text-sm font-bold text-[#111827]">
              SchemeSamjho Admin
            </p>

            <p className="text-xs text-[#111827]/50">
              Government scheme management
            </p>
          </div>
        </header>

        <main className="min-h-[calc(100vh-4rem)] bg-[#F9FAFB]">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}