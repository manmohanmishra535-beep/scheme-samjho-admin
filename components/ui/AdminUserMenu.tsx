"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import {
  ChevronDown,
  LogOut,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { AdminRole } from "@/lib/admin";

type AdminUserMenuProps = {
  role: AdminRole;
};

export default function AdminUserMenu({
  role,
}: AdminUserMenuProps) {
  const { user } = useUser();
  const { signOut } = useClerk();

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const firstName = user?.firstName || "Admin";
  const lastName = user?.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim();

  const email =
    user?.primaryEmailAddress?.emailAddress ||
    "Admin account";

  const initial =
    firstName.charAt(0).toUpperCase() || "A";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  async function handleSignOut() {
    setOpen(false);

    await signOut({
      redirectUrl: "/admin/login",
    });
  }

  return (
    <div
      ref={menuRef}
      className="relative"
    >
      {/* Account Button */}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-2 py-1.5 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-sm font-semibold text-white">
          {initial}
        </div>

        <div className="hidden text-left sm:block">
          <p className="max-w-[130px] truncate text-sm font-semibold text-slate-900">
            {fullName}
          </p>

          <p className="mt-0.5 text-[11px] font-medium capitalize text-slate-400">
            {role.replace("_", " ")}
          </p>
        </div>

        <ChevronDown
          size={15}
          className={`hidden text-slate-400 transition-transform sm:block ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Custom Menu */}
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+10px)] z-50 w-[300px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
        >
          {/* Account Header */}
          <div className="border-b border-slate-100 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-500 text-sm font-semibold text-white">
                {initial}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-950">
                  {fullName}
                </p>

                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {email}
                </p>

                <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1">
                  <ShieldCheck
                    size={12}
                    className="text-slate-600"
                  />

                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-600">
                    {role.replace("_", " ")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            {/* Account Settings */}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                window.location.href =
                  "/admin/settings";
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <Settings size={17} />
              </span>

              <span className="flex-1">
                Account Settings
              </span>
            </button>
          </div>

          {/* Sign Out */}
          <div className="border-t border-slate-100 p-2">
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50">
                <LogOut size={17} />
              </span>

              <span>
                Sign out
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}