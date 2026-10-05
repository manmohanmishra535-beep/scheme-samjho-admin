"use client";

import { useState, useRef, useEffect } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import {
  User,
  ChevronDown,
  Settings,
  LogOut,
  ShieldCheck,
} from "lucide-react";

import type { AdminRole } from "@/lib/admin";

type AdminUserMenuProps = {
  role: AdminRole;
};

export default function AdminUserMenu({
  role,
}: AdminUserMenuProps) {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  /* Close dropdown when clicking outside */
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
    await signOut({
      redirectUrl: "/admin/login",
    });
  }

  if (!isLoaded) {
    return (
      <div className="h-9 w-32 animate-pulse rounded-lg bg-slate-100" />
    );
  }

  const firstName = user?.firstName || "";
  const lastName = user?.lastName || "";

  const fullName =
    `${firstName} ${lastName}`.trim() ||
    user?.username ||
    "Admin";

  const email =
    user?.primaryEmailAddress?.emailAddress ||
    "No email";

  const initials =
    `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() ||
    "A";

  return (
    <div
      ref={menuRef}
      className="relative"
    >
      {/* ADMIN BUTTON */}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
      >
        {/* AVATAR */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
          {user?.imageUrl ? (
            <img
              src={user.imageUrl}
              alt={fullName}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            initials
          )}
        </div>

        {/* USER INFO */}
        <div className="hidden text-left sm:block">
          <p className="max-w-[150px] truncate text-sm font-semibold text-slate-800">
            {fullName}
          </p>

          <p className="text-xs capitalize text-slate-500">
            {role.replace("_", " ")}
          </p>
        </div>

        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* DROPDOWN */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          {/* USER DETAILS */}
          <div className="border-b border-slate-100 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-900 text-sm font-semibold text-white">
                {user?.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt={fullName}
                    className="h-11 w-11 object-cover"
                  />
                ) : (
                  initials
                )}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {fullName}
                </p>

                <p className="truncate text-xs text-slate-500">
                  {email}
                </p>
              </div>
            </div>
          </div>

          {/* ROLE */}
          <div className="border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                <ShieldCheck
                  size={18}
                  className="text-slate-700"
                />
              </div>

              <div>
                <p className="text-xs text-slate-400">
                  Role
                </p>

                <p className="text-sm font-semibold capitalize text-slate-800">
                  {role.replace("_", " ")}
                </p>
              </div>
            </div>
          </div>

          {/* MENU */}
          <div className="p-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                window.location.href =
                  "/admin/settings";
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <Settings size={18} />

              <span>Admin Settings</span>
            </button>

            {/* SIGN OUT */}
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-600 transition hover:bg-red-50 hover:text-red-700"
            >
              <LogOut size={18} />

              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}