import Link from "next/link";

import {
  FileText,
  Tags,
  ShieldCheck,
  Activity,
  ArrowUpRight,
  Plus,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";

import { requireAdmin } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();

  /*
   * ============================================================
   * DATABASE COUNTS
   * ============================================================
   */

  const [
    totalSchemesResult,
    publishedSchemesResult,
    draftSchemesResult,
    totalCategoriesResult,
  ] = await Promise.all([
    supabaseAdmin
      .from("schemes")
      .select("*", {
        count: "exact",
        head: true,
      }),

    supabaseAdmin
      .from("schemes")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("status", "published"),

    supabaseAdmin
      .from("schemes")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("status", "draft"),

    supabaseAdmin
      .from("categories")
      .select("*", {
        count: "exact",
        head: true,
      }),
  ]);

  const totalSchemes = totalSchemesResult.count ?? 0;
  const publishedSchemes = publishedSchemesResult.count ?? 0;
  const draftSchemes = draftSchemesResult.count ?? 0;
  const totalCategories = totalCategoriesResult.count ?? 0;

  const publishedPercentage =
    totalSchemes > 0
      ? Math.round((publishedSchemes / totalSchemes) * 100)
      : 0;

  return (
    <div className="space-y-7">
      {/* ======================================================
          PAGE HEADER
      ======================================================= */}

      <section>
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-500">
              <ShieldCheck size={16} />

              <span>Admin Portal</span>

              <span className="text-slate-300">/</span>

              <span className="text-slate-400">
                Dashboard
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Dashboard
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Manage SchemeSamjho content and administration
              from one place.
            </p>
          </div>

          {/* ACTIONS */}

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/schemes/new"
              className="
                inline-flex
                h-10
                items-center
                gap-2
                rounded-lg
                bg-slate-950
                px-4
                text-sm
                font-semibold
                text-white
                shadow-sm
                transition
                hover:bg-slate-800
              "
            >
              <Plus size={17} />

              New Scheme
            </Link>

            <Link
              href="/admin/schemes"
              className="
                inline-flex
                h-10
                items-center
                gap-2
                rounded-lg
                border
                border-slate-200
                bg-white
                px-4
                text-sm
                font-semibold
                text-slate-700
                shadow-sm
                transition
                hover:bg-slate-50
                hover:text-slate-950
              "
            >
              <ExternalLink size={16} />

              View Schemes
            </Link>
          </div>
        </div>
      </section>

      {/* ======================================================
          OVERVIEW
      ======================================================= */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Schemes"
          value={totalSchemes}
          description="All government schemes"
          icon={<FileText size={19} />}
          href="/admin/schemes"
        />

        <StatCard
          title="Published"
          value={publishedSchemes}
          description={`${publishedPercentage}% of all schemes`}
          icon={<CheckCircle2 size={19} />}
          href="/admin/schemes?status=published"
        />

        <StatCard
          title="Drafts"
          value={draftSchemes}
          description={
            draftSchemes === 0
              ? "Nothing waiting"
              : "Waiting for publishing"
          }
          icon={<Activity size={19} />}
          href="/admin/schemes?status=draft"
        />

        <StatCard
          title="Categories"
          value={totalCategories}
          description="Available categories"
          icon={<Tags size={19} />}
          href="/admin/categories"
        />
      </section>

      {/* ======================================================
          MAIN GRID
      ======================================================= */}

      <section className="grid gap-5 lg:grid-cols-3">
        {/* ====================================================
            QUICK ACTIONS
        ===================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-950">
                Quick Actions
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Frequently used administration tools.
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Activity size={18} />
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <ActionCard
              title="Manage Schemes"
              description="Create, edit and publish schemes."
              href="/admin/schemes"
              icon={<FileText size={18} />}
            />

            <ActionCard
              title="Manage Categories"
              description="Organize scheme categories."
              href="/admin/categories"
              icon={<Tags size={18} />}
            />

            {admin.role === "super_admin" && (
              <ActionCard
                title="Admin Settings"
                description="Manage administration settings."
                href="/admin/settings"
                icon={<ShieldCheck size={18} />}
              />
            )}
          </div>
        </div>

        {/* ====================================================
            SYSTEM STATUS
        ===================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-950">
                System Status
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Current administration status.
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <ShieldCheck size={18} />
            </div>
          </div>

          <div className="mt-5 space-y-1">
            <StatusRow
              label="Authentication"
              value="Active"
            />

            <StatusRow
              label="Authorization"
              value="Verified"
            />

            <StatusRow
              label="Admin Access"
              value="Granted"
            />

            <StatusRow
              label="Database"
              value="Connected"
            />
          </div>
        </div>
      </section>

      {/* ======================================================
          CONTENT OVERVIEW
      ======================================================= */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Content Overview
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Current SchemeSamjho content distribution.
            </p>
          </div>

          <Link
            href="/admin/schemes"
            className="
              inline-flex
              items-center
              gap-1.5
              text-sm
              font-semibold
              text-slate-700
              hover:text-slate-950
            "
          >
            Manage schemes

            <ArrowUpRight size={15} />
          </Link>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-600">
              Published schemes
            </span>

            <span className="font-semibold text-slate-900">
              {publishedPercentage}%
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-slate-900 transition-all"
              style={{
                width: `${publishedPercentage}%`,
              }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
            <span>
              {publishedSchemes} published
            </span>

            <span>
              {draftSchemes} draft
            </span>

            <span>
              {totalSchemes} total
            </span>
          </div>
        </div>
      </section>

      {/* ======================================================
          ADMIN ACCESS
      ======================================================= */}

      <section className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
              <ShieldCheck size={19} />
            </div>

            <div>
              <h2 className="text-sm font-semibold">
                Secure Administration
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-400">
                Administrative actions are protected by
                authentication and server-side authorization.
              </p>
            </div>
          </div>

          <div className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">
              Access level
            </p>

            <p className="mt-0.5 text-sm font-semibold capitalize">
              {admin.role.replace("_", " ")}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  title,
  value,
  description,
  icon,
  href,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="
        group
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-5
        shadow-sm
        transition-all
        duration-200
        hover:-translate-y-0.5
        hover:border-slate-300
        hover:shadow-md
      "
    >
      <div className="flex items-start justify-between">
        <div
          className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            bg-slate-100
            text-slate-700
            transition-colors
            group-hover:bg-slate-950
            group-hover:text-white
          "
        >
          {icon}
        </div>

        <ArrowUpRight
          size={17}
          className="
            text-slate-300
            transition
            group-hover:text-slate-700
          "
        />
      </div>

      <p className="mt-5 text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {description}
      </p>
    </Link>
  );
}

/* ============================================================
   ACTION CARD
============================================================ */

function ActionCard({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="
        group
        flex
        min-h-[96px]
        items-center
        justify-between
        rounded-xl
        border
        border-slate-200
        p-4
        transition-all
        duration-150
        hover:border-slate-300
        hover:bg-slate-50
      "
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className="
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-lg
            bg-slate-100
            text-slate-600
            transition
            group-hover:bg-slate-950
            group-hover:text-white
          "
        >
          {icon}
        </div>

        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-900">
            {title}
          </h3>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>
      </div>

      <ArrowUpRight
        size={17}
        className="
          ml-3
          shrink-0
          text-slate-300
          transition
          group-hover:text-slate-700
        "
      />
    </Link>
  );
}

/* ============================================================
   STATUS ROW
============================================================ */

function StatusRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

        <span className="text-sm text-slate-500">
          {label}
        </span>
      </div>

      <span className="text-sm font-semibold text-slate-800">
        {value}
      </span>
    </div>
  );
}