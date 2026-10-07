"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  RefreshCw,
  ShieldCheck,
  UserX,
} from "lucide-react";

type AdminRole = "super_admin";

type AdminStatus = "active" | "disabled";

type Admin = {
  id: string;
  clerk_user_id: string | null;
  name: string;
  email: string;
  role: AdminRole;
  status: AdminStatus;
  created_at: string;
  updated_at: string;
};

function formatDate(date: string) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Unknown";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AdminList() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function fetchAdmins(showRefreshLoader = false) {
    if (showRefreshLoader) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await fetch("/api/admin/users", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.message || "Unable to load administrators."
        );
        return;
      }

      setAdmins(data.admins ?? []);
    } catch (error) {
      console.error("FETCH ADMINS ERROR:", error);

      setError("Unable to load administrators.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchAdmins();
  }, []);

  /*
   * Loading state
   */
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
        <div className="flex items-center justify-center gap-3 text-sm text-slate-500">
          <Loader2
            size={18}
            className="animate-spin"
          />
          Loading administrators...
        </div>
      </div>
    );
  }

  /*
   * Error state
   */
  if (error && admins.length === 0) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-red-700">
            {error}
          </p>

          <button
            type="button"
            onClick={() => fetchAdmins()}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50"
          >
            <RefreshCw size={14} />
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold text-slate-950">
            Super Administrators
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {admins.length}{" "}
            {admins.length === 1
              ? "Super Admin"
              : "Super Admins"}{" "}
            registered
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
            <CheckCircle2 size={14} />
            Database connected
          </div>

          <button
            type="button"
            onClick={() => fetchAdmins(true)}
            disabled={refreshing}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Refresh administrators"
            title="Refresh"
          >
            <RefreshCw
              size={15}
              className={
                refreshing ? "animate-spin" : ""
              }
            />
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && admins.length > 0 && (
        <div className="border-b border-red-200 bg-red-50 px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() => setError("")}
              className="text-xs font-semibold text-red-700 hover:underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {admins.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <UserX
              size={20}
              className="text-slate-500"
            />
          </div>

          <h3 className="mt-4 text-sm font-semibold text-slate-950">
            No Super Admins found
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Create an invitation to add a
            Super Admin.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-left">
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Administrator
                  </th>

                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Role
                  </th>

                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Added
                  </th>

                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Security
                  </th>
                </tr>
              </thead>

              <tbody>
                {admins.map((admin) => (
                  <tr
                    key={admin.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    {/* Administrator */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
                          {admin.name
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-950">
                            {admin.name}
                          </p>

                          <p className="mt-0.5 truncate text-xs text-slate-500">
                            {admin.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700">
                        <ShieldCheck size={15} />
                        Super Admin
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      {admin.status === "active" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                          Disabled
                        </span>
                      )}
                    </td>

                    {/* Added */}
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatDate(
                        admin.created_at
                      )}
                    </td>

                    {/* Security */}
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
                        <ShieldCheck size={14} />
                        Protected
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="divide-y divide-slate-100 md:hidden">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className="p-5"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
                    {admin.name
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    {/* Name */}
                    <p className="truncate text-sm font-semibold text-slate-950">
                      {admin.name}
                    </p>

                    {/* Email */}
                    <p className="mt-1 break-all text-xs text-slate-500">
                      {admin.email}
                    </p>

                    {/* Role + Status */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700">
                        <ShieldCheck size={14} />
                        Super Admin
                      </span>

                      {admin.status === "active" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                          Disabled
                        </span>
                      )}
                    </div>

                    {/* Date */}
                    <p className="mt-3 text-xs text-slate-400">
                      Added{" "}
                      {formatDate(
                        admin.created_at
                      )}
                    </p>

                    {/* Protected status */}
                    <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
                      <ShieldCheck size={14} />
                      Super Admin account protected
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 border-t border-slate-200 bg-slate-50/60 px-6 py-3.5 text-xs text-slate-500">
        <ShieldCheck
          size={14}
          className="text-emerald-600"
        />
        All administrator accounts have
        Super Admin privileges.
      </div>
    </div>
  );
}