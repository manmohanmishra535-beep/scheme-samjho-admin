"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Save,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
};

type EditCategoryFormProps = {
  categoryId: string;
};

export default function EditCategoryForm({
  categoryId,
}: EditCategoryFormProps) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] =
    useState("");
  const [status, setStatus] =
    useState("active");

  const [loading, setLoading] =
    useState(true);
  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");
  const [success, setSuccess] =
    useState("");

  // -----------------------------------------
  // LOAD CATEGORY
  // -----------------------------------------

  useEffect(() => {
    async function loadCategory() {
      if (!categoryId) {
        setError("Category ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        console.log(
          "Loading category ID:",
          categoryId
        );

        const response = await fetch(
          `/api/admin/categories/${categoryId}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Failed to load category."
          );
        }

        if (!data?.category) {
          throw new Error(
            "Category data was not returned."
          );
        }

        const category: Category =
          data.category;

        setName(category.name ?? "");

        setSlug(category.slug ?? "");

        setDescription(
          category.description ?? ""
        );

        setStatus(
          category.status ?? "active"
        );
      } catch (err) {
        console.error(
          "Load category error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load category."
        );
      } finally {
        setLoading(false);
      }
    }

    loadCategory();
  }, [categoryId]);

  // -----------------------------------------
  // CREATE SLUG
  // -----------------------------------------

  function makeSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  // -----------------------------------------
  // UPDATE CATEGORY
  // -----------------------------------------

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!categoryId) {
      setError("Category ID is missing.");
      return;
    }

    if (!name.trim()) {
      setError(
        "Category name is required."
      );
      return;
    }

    if (!slug.trim()) {
      setError(
        "Category slug is required."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `/api/admin/categories/${categoryId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            slug: slug.trim(),
            description:
              description.trim(),
            status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to update category."
        );
      }

      setSuccess(
        "Category updated successfully."
      );

      setTimeout(() => {
        router.push("/admin/categories");
        router.refresh();
      }, 800);
    } catch (err) {
      console.error(
        "Update category error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update category."
      );
    } finally {
      setSaving(false);
    }
  }

  // -----------------------------------------
  // LOADING
  // -----------------------------------------

  if (loading) {
    return (
      <div className="flex min-h-60 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <Loader2
            size={20}
            className="animate-spin"
          />

          Loading category...
        </div>
      </div>
    );
  }

  // -----------------------------------------
  // FORM
  // -----------------------------------------

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* ERROR */}
      {error && (
        <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle
            size={20}
            className="shrink-0 text-red-600"
          />

          <p className="text-sm text-red-700">
            {error}
          </p>
        </div>
      )}

      {/* SUCCESS */}
      {success && (
        <div className="flex gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
          <CheckCircle2
            size={20}
            className="shrink-0 text-green-600"
          />

          <p className="text-sm text-green-700">
            {success}
          </p>
        </div>
      )}

      {/* CATEGORY INFORMATION */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Category Information
        </h2>

        <div className="mt-6 space-y-5">
          {/* CATEGORY NAME */}
          <div>
            <label
              htmlFor="category-name"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Category Name
            </label>

            <input
              id="category-name"
              type="text"
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value
                )
              }
              disabled={saving}
              placeholder="Agriculture"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 disabled:bg-slate-100"
            />
          </div>

          {/* SLUG */}
          <div>
            <label
              htmlFor="category-slug"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Slug
            </label>

            <input
              id="category-slug"
              type="text"
              value={slug}
              onChange={(event) =>
                setSlug(
                  makeSlug(
                    event.target.value
                  )
                )
              }
              disabled={saving}
              placeholder="agriculture"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 disabled:bg-slate-100"
            />
          </div>

          {/* DESCRIPTION */}
          <div>
            <label
              htmlFor="category-description"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Description
            </label>

            <textarea
              id="category-description"
              rows={5}
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
              disabled={saving}
              placeholder="Describe this category..."
              className="w-full resize-none rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 disabled:bg-slate-100"
            />
          </div>

          {/* STATUS */}
          <div>
            <label
              htmlFor="category-status"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Status
            </label>

            <select
              id="category-status"
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value
                )
              }
              disabled={saving}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 disabled:bg-slate-100"
            >
              <option value="active">
                Active
              </option>

              <option value="inactive">
                Inactive
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() =>
            router.push(
              "/admin/categories"
            )
          }
          disabled={saving}
          className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2
                size={18}
                className="animate-spin"
              />

              Saving...
            </>
          ) : (
            <>
              <Save size={18} />

              Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  );
}