"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Edit,
  Eye,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import type { AdminRole } from "@/lib/admin";

type Scheme = {
  id: string;
  name: string;
  short_name?: string | null;
  category?: string | null;
  status?: "draft" | "published" | null;
};

type Props = {
  role: AdminRole;
};

export default function SchemesAdminClient({
  role,
}: Props) {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const canEdit =
    role === "super_admin" ||
    role === "editor";

  const canDelete =
    role === "super_admin";

  /*
   * Load schemes from Supabase through the API
   */
  async function loadSchemes() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/schemes",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load schemes."
        );
      }

      setSchemes(data.schemes ?? []);
    } catch (error) {
      console.error(
        "Failed to load schemes:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load schemes."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * Load schemes when page opens
   */
  useEffect(() => {
    loadSchemes();
  }, []);

  /*
   * Search + status filtering
   */
  const filteredSchemes = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    return schemes.filter((scheme) => {
      const matchesSearch =
        !searchValue ||
        scheme.name
          .toLowerCase()
          .includes(searchValue) ||
        scheme.short_name
          ?.toLowerCase()
          .includes(searchValue) ||
        scheme.category
          ?.toLowerCase()
          .includes(searchValue);

      const matchesStatus =
        status === "all" ||
        scheme.status === status;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [schemes, search, status]);

  /*
   * Delete scheme
   */
  async function handleDelete(
    scheme: Scheme
  ) {
    if (!canDelete) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${scheme.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(scheme.id);

      const response = await fetch(
        `/api/admin/schemes/${scheme.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete scheme."
        );
      }

      /*
       * Remove deleted scheme from UI
       */
      setSchemes((current) =>
        current.filter(
          (item) => item.id !== scheme.id
        )
      );
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Failed to delete scheme."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Schemes
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage government schemes.
          </p>
        </div>

        {canEdit && (
          <Link
            href="/admin/schemes/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Plus size={18} />
            Add Scheme
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search schemes..."
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-slate-900"
            />
          </div>

          {/* Status */}
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-900"
          >
            <option value="all">
              All Status
            </option>

            <option value="published">
              Published
            </option>

            <option value="draft">
              Draft
            </option>
          </select>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-12 text-center text-sm text-slate-500 shadow-sm">
          Loading schemes...
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-6 text-sm text-red-700">
          <p className="font-semibold">
            Failed to load schemes
          </p>

          <p className="mt-1">
            {error}
          </p>

          <button
            type="button"
            onClick={loadSchemes}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px]">
                <thead className="border-b bg-slate-50">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Scheme
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Category
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredSchemes.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-5 py-12 text-center text-sm text-slate-500"
                      >
                        No schemes found.
                      </td>
                    </tr>
                  ) : (
                    filteredSchemes.map(
                      (scheme) => (
                        <tr
                          key={scheme.id}
                          className="hover:bg-slate-50"
                        >
                          {/* Scheme */}
                          <td className="px-5 py-4">
                            <div className="font-semibold text-slate-900">
                              {scheme.name}
                            </div>

                            {scheme.short_name &&
                              scheme.short_name !==
                                scheme.name && (
                                <div className="mt-1 text-xs text-slate-400">
                                  {
                                    scheme.short_name
                                  }
                                </div>
                              )}
                          </td>

                          {/* Category */}
                          <td className="px-5 py-4 text-sm text-slate-600">
                            {scheme.category ||
                              "—"}
                          </td>

                          {/* Status */}
                          <td className="px-5 py-4">
                            {scheme.status ===
                            "published" ? (
                              <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                                Published
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                Draft
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              {/* View */}
                              <Link
                                href={`/admin/schemes/${scheme.id}`}
                                title="View"
                                className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
                              >
                                <Eye size={16} />
                              </Link>

                              {/* Edit */}
                              {canEdit && (
                                <Link
                                  href={`/admin/schemes/${scheme.id}/edit`}
                                  title="Edit"
                                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
                                >
                                  <Edit
                                    size={16}
                                  />
                                </Link>
                              )}

                              {/* Delete */}
                              {canDelete && (
                                <button
                                  type="button"
                                  title="Delete"
                                  disabled={
                                    deletingId ===
                                    scheme.id
                                  }
                                  onClick={() =>
                                    handleDelete(
                                      scheme
                                    )
                                  }
                                  className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                                >
                                  <Trash2
                                    size={16}
                                  />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Result count */}
          <p className="mt-3 text-sm text-slate-500">
            Showing {filteredSchemes.length} of{" "}
            {schemes.length} schemes
          </p>
        </>
      )}
    </div>
  );
}