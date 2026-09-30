"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Edit,
  Plus,
  Search,
  Tags,
  Trash2,
} from "lucide-react";

import type { AdminRole } from "@/lib/admin";

type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  status?: string | null;
};

type Props = {
  role: AdminRole;
};

export default function CategoriesClient({ role }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const canEdit =
    role === "super_admin" || role === "editor";

  const canDelete = role === "super_admin";

  async function loadCategories() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/categories", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to load categories."
        );
      }

      setCategories(data.categories ?? data ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load categories."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return categories;
    }

    return categories.filter(
      (category) =>
        category.name.toLowerCase().includes(value) ||
        category.slug.toLowerCase().includes(value) ||
        category.description
          ?.toLowerCase()
          .includes(value)
    );
  }, [categories, search]);

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this category?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `/api/admin/categories/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to delete category."
        );
      }

      setCategories((current) =>
        current.filter((category) => category.id !== id)
      );
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Failed to delete category."
      );
    }
  }

  return (
    <main className="mx-auto max-w-7xl">
      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Categories
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage scheme categories.
          </p>
        </div>

        {canEdit && (
          <Link
            href="/admin/categories/new"
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Plus size={18} />
            Add Category
          </Link>
        )}
      </div>

      {/* SEARCH */}
      <div className="mb-6 rounded-xl border bg-white p-4 shadow-sm">
        <div className="relative">
          <Search
            size={19}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories..."
            className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none focus:border-slate-900"
          />
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* TABLE */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="grid grid-cols-[1fr_1fr_1fr_180px] border-b bg-slate-50 px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <div>Category</div>
          <div>Slug</div>
          <div>Status</div>
          <div className="text-right">Actions</div>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            Loading categories...
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100">
              <Tags
                size={22}
                className="text-slate-500"
              />
            </div>

            <h2 className="text-base font-semibold text-slate-900">
              No categories found
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {search
                ? "Try a different search."
                : "Create your first category."}
            </p>
          </div>
        ) : (
          filteredCategories.map((category) => (
            <div
              key={category.id}
              className="grid grid-cols-[1fr_1fr_1fr_180px] items-center border-b px-6 py-5 last:border-b-0"
            >
              <div>
                <p className="font-semibold text-slate-900">
                  {category.name}
                </p>

                {category.description && (
                  <p className="mt-1 line-clamp-1 text-sm text-slate-500">
                    {category.description}
                  </p>
                )}
              </div>

              <div className="text-sm text-slate-600">
                {category.slug}
              </div>

              <div>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    category.status === "inactive"
                      ? "bg-slate-100 text-slate-600"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {category.status === "inactive"
                    ? "Inactive"
                    : "Active"}
                </span>
              </div>

              <div className="flex justify-end gap-2">
                {canEdit && (
                  <Link
                    href={`/admin/categories/${category.id}/edit`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                    title="Edit category"
                  >
                    <Edit size={17} />
                  </Link>
                )}

                {canDelete && (
                  <button
                    type="button"
                    onClick={() =>
                      handleDelete(category.id)
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-500 transition hover:bg-red-50"
                    title="Delete category"
                  >
                    <Trash2 size={17} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* COUNT */}
      {!loading && (
        <p className="mt-4 text-sm text-slate-500">
          Showing {filteredCategories.length} of{" "}
          {categories.length} categories
        </p>
      )}
    </main>
  );
}