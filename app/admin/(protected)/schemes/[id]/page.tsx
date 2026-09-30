import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Edit } from "lucide-react";

import { requireAdmin } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function SchemeViewPage({
  params,
}: Props) {
  const admin = await requireAdmin();

  const { id } = await params;

  const { data: scheme, error } =
    await supabaseAdmin
      .from("schemes")
      .select("*")
      .eq("id", id)
      .single();

  if (error || !scheme) {
    notFound();
  }

  const canEdit =
    admin.role === "super_admin" ||
    admin.role === "editor";

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/admin/schemes"
            className="mb-3 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft size={16} />
            Back to Schemes
          </Link>

          <h1 className="text-2xl font-bold text-slate-900">
            {scheme.name}
          </h1>

          {scheme.short_name && (
            <p className="mt-1 text-sm text-slate-500">
              {scheme.short_name}
            </p>
          )}
        </div>

        {canEdit && (
          <Link
            href={`/admin/schemes/${scheme.id}/edit`}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Edit size={17} />
            Edit Scheme
          </Link>
        )}
      </div>

      {/* Main information */}
      <div className="space-y-6">
        {/* Basic information */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold text-slate-900">
            Basic Information
          </h2>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Name
              </p>

              <p className="mt-1 text-sm text-slate-900">
                {scheme.name || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Short Name
              </p>

              <p className="mt-1 text-sm text-slate-900">
                {scheme.short_name || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Category
              </p>

              <p className="mt-1 text-sm text-slate-900">
                {scheme.category || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Status
              </p>

              <div className="mt-1">
                {scheme.status === "published" ? (
                  <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                    Published
                  </span>
                ) : (
                  <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    Draft
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Description
          </h2>

          <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
            {scheme.description || "—"}
          </p>
        </div>

        {/* Benefits */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Benefits
          </h2>

          <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
            {scheme.benefits || "—"}
          </p>
        </div>

        {/* Eligibility */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Eligibility
          </h2>

          <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
            {scheme.eligibility || "—"}
          </p>
        </div>

        {/* Application */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Application
          </h2>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Official URL
            </p>

            {scheme.official_url ? (
              <a
                href={scheme.official_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block break-all text-sm text-blue-600 hover:underline"
              >
                {scheme.official_url}
              </a>
            ) : (
              <p className="mt-1 text-sm text-slate-500">
                No official URL provided.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}