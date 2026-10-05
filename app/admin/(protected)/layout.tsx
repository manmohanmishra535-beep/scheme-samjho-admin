import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/admin";
import AdminSidebar from "@/components/ui/AdminSidebar";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { UserButton } from "@clerk/nextjs";
import { ShieldCheck, ExternalLink } from "lucide-react";
import Link from "next/link";

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
        {/* ================================
            TOP HEADER
        ================================= */}

        <header className="sticky top-0 z-40 flex h-[72px] items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
          
          {/* LEFT SIDE */}
          <div className="flex items-center gap-3">
            <SidebarTrigger className="h-10 w-10 rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-950" />

            <div className="hidden h-7 w-px bg-slate-200 sm:block" />

            <div className="hidden items-center gap-3 sm:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-white">
                <ShieldCheck size={18} strokeWidth={2} />
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

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-3">
            
            {/* VIEW WEBSITE */}
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 sm:flex"
            >
              <span>View Website</span>
              <ExternalLink size={15} />
            </Link>

            {/* DIVIDER */}
            <div className="hidden h-8 w-px bg-slate-200 sm:block" />

            {/* ADMIN INFO */}
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold leading-tight text-slate-900">
                Admin Account
              </p>

              <p className="mt-1 text-[11px] font-medium capitalize text-slate-400">
                {admin.role.replace("_", " ")}
              </p>
            </div>

            {/* CLERK USER */}
            <div className="rounded-full border border-slate-200 bg-white p-0.5 shadow-sm">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-9 w-9",
                    userButtonPopoverCard:
                      "border border-slate-200 shadow-xl",
                  },
                }}
              />
            </div>
          </div>
        </header>

        {/* ================================
            PAGE CONTENT
        ================================= */}

        <main className="min-h-[calc(100vh-72px)] p-4 sm:p-6 lg:p-7">
          <div className="mx-auto w-full max-w-[1600px]">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}