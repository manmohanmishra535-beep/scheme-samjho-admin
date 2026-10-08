import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/admin";
import AdminSidebar from "@/components/ui/AdminSidebar";
import AdminUserMenu from "@/components/ui/AdminUserMenu";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { ShieldCheck } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <SidebarProvider>
      <AdminSidebar role={admin.role} />

      <SidebarInset className="bg-slate-50">
        {/* Top Header */}
        <header className="sticky top-0 z-40 flex h-[72px] items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
          {/* Left Side */}
          <div className="flex items-center gap-3">
            <SidebarTrigger
              className="h-10 w-10 rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-950"
            />

            <div className="hidden h-7 w-px bg-slate-200 sm:block" />

            <div className="hidden items-center gap-3 sm:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-white">
                <ShieldCheck
                  size={18}
                  strokeWidth={2}
                />
              </div>

              <div>
                <p className="text-sm font-bold leading-tight text-slate-950">
                  SchemeSamjho
                </p>

                <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                  Administration
                </p>
              </div>
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Admin Account Menu */}
            <AdminUserMenu role={admin.role} />
          </div>
        </header>

        {/* Page Content */}
        <main className="min-h-[calc(100vh-72px)] p-4 sm:p-6 lg:p-7">
          <div className="mx-auto w-full max-w-[1600px]">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}