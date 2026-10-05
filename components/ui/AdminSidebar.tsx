"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk } from "@clerk/nextjs";

import {
  LayoutDashboard,
  FileText,
  Tags,
  Settings,
  LogOut,
  ExternalLink,
} from "lucide-react";

import type { AdminRole } from "@/lib/admin";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

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
  const { signOut } = useClerk();

  const visibleItems = menuItems.filter((item) =>
    item.roles.includes(role)
  );

  async function handleSignOut() {
    await signOut({
      redirectUrl: "/admin/login",
    });
  }

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-slate-200 bg-white"
    >
      {/* Navigation */}
      <SidebarContent className="px-2">
        <SidebarGroup className="pt-6">
          <SidebarGroupLabel className="px-3 pb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 group-data-[collapsible=icon]:hidden">
            Navigation
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {visibleItems.map((item) => {
                const Icon = item.icon;

                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      tooltip={item.label}
                      className={`h-11 rounded-xl px-3 transition-all duration-200 ${
                        isActive
                          ? "bg-slate-950 text-white shadow-sm hover:bg-slate-950 hover:text-white"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                      }`}
                    >
                      <Link
                        href={item.href}
                        className="flex w-full items-center gap-3"
                      >
                        <Icon
                          size={18}
                          strokeWidth={isActive ? 2.2 : 1.9}
                          className={
                            isActive
                              ? "shrink-0 text-white"
                              : "shrink-0 text-slate-500"
                          }
                        />

                        <span className="truncate text-[14px] font-semibold group-data-[collapsible=icon]:hidden">
                          {item.label}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-slate-200 p-2">
        <SidebarMenu className="gap-1">
          {/* View Website */}
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="View Website"
              className="h-11 rounded-xl px-3 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
            >
              <Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center gap-3"
              >
                <ExternalLink
                  size={18}
                  className="shrink-0 text-slate-500"
                />

                <span className="text-[14px] font-semibold group-data-[collapsible=icon]:hidden">
                  View Website
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Sign Out */}
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sign out"
              onClick={handleSignOut}
              className="h-11 rounded-xl px-3 text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
            >
              <LogOut
                size={18}
                className="shrink-0"
              />

              <span className="text-[14px] font-semibold group-data-[collapsible=icon]:hidden">
                Sign out
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}