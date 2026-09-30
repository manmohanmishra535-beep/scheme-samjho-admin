"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import {
  LayoutDashboard,
  FileText,
  Tags,
  Settings,
  LogOut,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

import type { AdminRole } from "@/lib/admin";

type AdminSidebarProps = {
  role: AdminRole;
};

type MenuItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: AdminRole[];
};

const menuItems: MenuItem[] = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    roles: ["super_admin", "editor", "viewer"],
  },
  {
    label: "Schemes",
    href: "/admin/schemes",
    icon: FileText,
    roles: ["super_admin", "editor", "viewer"],
  },
  {
    label: "Categories",
    href: "/admin/categories",
    icon: Tags,
    roles: ["super_admin", "editor", "viewer"],
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
    roles: ["super_admin"],
  },
];

export default function AdminSidebar({
  role,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();

  const visibleItems = menuItems.filter((item) =>
    item.roles.includes(role)
  );

  async function handleSignOut() {
    await signOut();

    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-white">
      {/* BRAND */}
      <div className="flex h-16 items-center gap-3 border-b px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
          <ShieldCheck size={20} />
        </div>

        <div>
          <h1 className="text-sm font-bold text-slate-900">
            SchemeSamjho
          </h1>

          <p className="text-xs text-slate-500">
            Admin Panel
          </p>
        </div>
      </div>

      {/* ROLE */}
      <div className="border-b px-5 py-4">
        <p className="text-xs text-slate-400">
          Current role
        </p>

        <p className="mt-1 text-sm font-semibold capitalize text-slate-800">
          {role.replace("_", " ")}
        </p>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {visibleItems.map((item) => {
          const Icon = item.icon;

          const isActive =
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon size={19} />

              <span className="flex-1">
                {item.label}
              </span>

              <ChevronRight
                size={16}
                className={`transition ${
                  isActive
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100"
                }`}
              />
            </Link>
          );
        })}
      </nav>

      {/* SIGN OUT */}
      <div className="border-t p-3">
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
        >
          <LogOut size={19} />

          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}