"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Loader2,
  FileText,
  CheckCircle2,
} from "lucide-react";

export default function NewSchemePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    shortName: "",
    category: "",
    description: "",
    benefits: "",
    eligibility: "",
    applicationUrl: "",
    status: "published",
  });

  function updateField(
    field: keyof typeof form,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        name: form.name.trim(),
        short_name: form.shortName.trim() || null,
        category: form.category.trim(),
        description: form.description.trim(),
        benefits: form.benefits.trim() || null,
        eligibility: form.eligibility.trim() || null,
        application_url: form.applicationUrl.trim() || null,
        status: form.status,
      };

      if (!payload.name) {
        throw new Error("Scheme name is required.");
      }

      if (!payload.category) {
        throw new Error("Category is required.");
      }

      if (!payload.description) {
        throw new Error("Description is required.");
      }

      console.log("Creating scheme:", payload);

      const response = await fetch("/api/admin/schemes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const contentType =
        response.headers.get("content-type") || "";

      let data: any = null;

      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();

        console.error(
          "API returned non-JSON response:",
          text
        );

        throw new Error(
          `Server returned an unexpected response (${response.status}). Check the API route.`
        );
      }

      console.log("Create scheme response:", data);

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message || "Failed to create scheme."
        );
      }

      setSuccess("Scheme created successfully.");

      setTimeout(() => {
        router.push("/admin/schemes");
        router.refresh();
      }, 800);
    } catch (err) {
      console.error(
        "Create scheme frontend error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while creating the scheme."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      {/* HEADER */}
      <div className="mb-6">
        <Link
          href="/admin/schemes"
          className="mb-3 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Back to Schemes
        </Link>

        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <FileText size={25} />
          Add New Scheme
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Create a new government scheme for SchemeSamjho.
        </p>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* SUCCESS */}
      {success && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* BASIC INFORMATION */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Basic Information
          </h2>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {/* NAME */}
            <div className="md:col-span-2">
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Scheme Name *
              </label>

              <input
                id="name"
                required
                value={form.name}
                onChange={(e) =>
                  updateField("name", e.target.value)
                }
                placeholder="e.g. Pradhan Mantri Kisan Samman Nidhi"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </div>

            {/* SHORT NAME */}
            <div>
              <label
                htmlFor="shortName"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Short Name
              </label>

              <input
                id="shortName"
                value={form.shortName}
                onChange={(e) =>
                  updateField(
                    "shortName",
                    e.target.value
                  )
                }
                placeholder="e.g. PM-KISAN"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </div>

            {/* CATEGORY */}
            <div>
              <label
                htmlFor="category"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Category *
              </label>

              <select
                id="category"
                required
                value={form.category}
                onChange={(e) =>
                  updateField(
                    "category",
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              >
                <option value="">
                  Select category
                </option>

                <option value="Agriculture">
                  Agriculture
                </option>

                <option value="Health">
                  Health
                </option>

                <option value="Education">
                  Education
                </option>

                <option value="Employment">
                  Employment
                </option>

                <option value="Women">
                  Women & Child
                </option>

                <option value="Housing">
                  Housing
                </option>

                <option value="Finance">
                  Finance
                </option>

                <option value="Social Welfare">
                  Social Welfare
                </option>

                <option value="Other">
                  Other
                </option>
              </select>
            </div>

            {/* DESCRIPTION */}
            <div className="md:col-span-2">
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Description *
              </label>

              <textarea
                id="description"
                required
                rows={5}
                value={form.description}
                onChange={(e) =>
                  updateField(
                    "description",
                    e.target.value
                  )
                }
                placeholder="Explain the scheme in simple language..."
                className="w-full resize-none rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>
        </section>

        {/* BENEFITS */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Benefits
          </h2>

          <div className="mt-5">
            <label
              htmlFor="benefits"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Scheme Benefits
            </label>

            <textarea
              id="benefits"
              rows={5}
              value={form.benefits}
              onChange={(e) =>
                updateField(
                  "benefits",
                  e.target.value
                )
              }
              placeholder="Describe the benefits provided by this scheme..."
              className="w-full resize-none rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            />
          </div>
        </section>

        {/* ELIGIBILITY */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Eligibility
          </h2>

          <div className="mt-5">
            <label
              htmlFor="eligibility"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Eligibility Criteria
            </label>

            <textarea
              id="eligibility"
              rows={5}
              value={form.eligibility}
              onChange={(e) =>
                updateField(
                  "eligibility",
                  e.target.value
                )
              }
              placeholder="Who can apply for this scheme?"
              className="w-full resize-none rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            />
          </div>
        </section>

        {/* APPLICATION */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Application Information
          </h2>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {/* APPLICATION URL */}
            <div>
              <label
                htmlFor="applicationUrl"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Official Application URL
              </label>

              <input
                id="applicationUrl"
                type="url"
                value={form.applicationUrl}
                onChange={(e) =>
                  updateField(
                    "applicationUrl",
                    e.target.value
                  )
                }
                placeholder="https://example.gov.in"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </div>

            {/* STATUS */}
            <div>
              <label
                htmlFor="status"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Status
              </label>

              <select
                id="status"
                value={form.status}
                onChange={(e) =>
                  updateField(
                    "status",
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              >
                <option value="draft">
                  Draft
                </option>

                <option value="published">
                  Published
                </option>
              </select>
            </div>
          </div>
        </section>

        {/* BUTTONS */}
        <div className="flex justify-end gap-3">
          <Link
            href="/admin/schemes"
            className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
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
                Save Scheme
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}