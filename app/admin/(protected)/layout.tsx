import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/admin";
import AdminSidebar from "@/components/ui/AdminSidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <SidebarProvider>
      <AdminSidebar role={admin.role} />

      <SidebarInset>
        <header className="flex h-14 items-center border-b bg-white px-4">
          <SidebarTrigger />
        </header>

        <main className="flex-1 p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}