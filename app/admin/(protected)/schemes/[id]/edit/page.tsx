"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Save,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";

type Scheme = {
  id: string;
  name: string;
  short_name?: string | null;
  category?: string | null;
  description?: string | null;
  benefits?: unknown;
  eligibility?: unknown;
  application_url?: string | null;
  official_url?: string | null;
  status?: "draft" | "published" | null;
};

type Props = {
  value: unknown;
};

function toText(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.join("\n");
  }

  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

export default function EditSchemePage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [scheme, setScheme] =
    useState<Scheme | null>(null);

  const [name, setName] = useState("");
  const [shortName, setShortName] =
    useState("");
  const [category, setCategory] =
    useState("");
  const [description, setDescription] =
    useState("");
  const [benefits, setBenefits] =
    useState("");
  const [eligibility, setEligibility] =
    useState("");
  const [applicationUrl, setApplicationUrl] =
    useState("");

  const [status, setStatus] =
    useState<"draft" | "published">(
      "published"
    );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  /*
   * Load scheme
   */
  useEffect(() => {
    async function loadScheme() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/admin/schemes/${id}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to load scheme."
          );
        }

        const loadedScheme: Scheme =
          data.scheme;

        setScheme(loadedScheme);

        setName(
          toText(loadedScheme.name)
        );

        setShortName(
          toText(loadedScheme.short_name)
        );

        setCategory(
          toText(loadedScheme.category)
        );

        setDescription(
          toText(loadedScheme.description)
        );

        /*
         * IMPORTANT:
         * benefits may be an array/JSON
         */
        setBenefits(
          toText(loadedScheme.benefits)
        );

        /*
         * IMPORTANT:
         * eligibility may also be an array/JSON
         */
        setEligibility(
          toText(loadedScheme.eligibility)
        );

        setApplicationUrl(
          toText(
            loadedScheme.application_url ??
              loadedScheme.official_url
          )
        );

        setStatus(
          loadedScheme.status === "draft"
            ? "draft"
            : "published"
        );
      } catch (error) {
        console.error(
          "Load scheme error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load scheme."
        );
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadScheme();
    }
  }, [id]);

  /*
   * Save changes
   */
  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!name.trim()) {
      setError(
        "Scheme name is required."
      );
      return;
    }

    if (!category.trim()) {
      setError(
        "Category is required."
      );
      return;
    }

    if (!description.trim()) {
      setError(
        "Description is required."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `/api/admin/schemes/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),

            short_name:
              shortName.trim() || null,

            category:
              category.trim(),

            description:
              description.trim(),

            benefits:
              benefits.trim() || null,

            eligibility:
              eligibility.trim() || null,

            application_url:
              applicationUrl.trim() || null,

            status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update scheme."
        );
      }

      router.push(
        `/admin/schemes/${id}`
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Update scheme error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update scheme."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * Loading
   */
  if (loading) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
          Loading scheme...
        </div>
      </div>
    );
  }

  /*
   * Error
   */
  if (error && !scheme) {
    return (
      <div className="mx-auto max-w-4xl">
        <Link
          href="/admin/schemes"
          className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Back to Schemes
        </Link>

        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          <h1 className="font-semibold">
            Failed to load scheme
          </h1>

          <p className="mt-2 text-sm">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/admin/schemes/${id}`}
          className="mb-3 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Back to Scheme
        </Link>

        <h1 className="text-2xl font-bold text-slate-900">
          Edit Scheme
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Update government scheme
          information.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* Basic Information */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold text-slate-900">
            Basic Information
          </h2>

          <div className="space-y-5">
            {/* Name */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Scheme Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value
                  )
                }
                placeholder="Enter scheme name"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-900"
              />
            </div>

            {/* Short Name */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Short Name
              </label>

              <input
                type="text"
                value={shortName}
                onChange={(event) =>
                  setShortName(
                    event.target.value
                  )
                }
                placeholder="e.g. PM-KISAN"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-900"
              />
            </div>

            {/* Category */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Category
              </label>

              <input
                type="text"
                value={category}
                onChange={(event) =>
                  setCategory(
                    event.target.value
                  )
                }
                placeholder="e.g. Agriculture"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-900"
              />
            </div>

            {/* Status */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Status
              </label>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value as
                      | "draft"
                      | "published"
                  )
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-900"
              >
                <option value="published">
                  Published
                </option>

                <option value="draft">
                  Draft
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold text-slate-900">
            Scheme Content
          </h2>

          <div className="space-y-5">
            {/* Description */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Description
              </label>

              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                placeholder="Describe the scheme..."
                rows={6}
                className="w-full resize-y rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
              />
            </div>

            {/* Benefits */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Benefits
              </label>

              <textarea
                value={benefits}
                onChange={(event) =>
                  setBenefits(
                    event.target.value
                  )
                }
                placeholder="Enter scheme benefits..."
                rows={5}
                className="w-full resize-y rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
              />
            </div>

            {/* Eligibility */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Eligibility
              </label>

              <textarea
                value={eligibility}
                onChange={(event) =>
                  setEligibility(
                    event.target.value
                  )
                }
                placeholder="Enter eligibility criteria..."
                rows={5}
                className="w-full resize-y rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
              />
            </div>

            {/* URL */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Application / Official URL
              </label>

              <input
                type="url"
                value={applicationUrl}
                onChange={(event) =>
                  setApplicationUrl(
                    event.target.value
                  )
                }
                placeholder="https://example.gov.in"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            href={`/admin/schemes/${id}`}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save size={17} />

            {saving
              ? "Saving..."
              : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}