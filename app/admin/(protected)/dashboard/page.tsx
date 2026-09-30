import {
  FileText,
  Tags,
  ShieldCheck,
  Activity,
  ArrowUpRight,
} from "lucide-react";

import { requireAdmin } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();

  /*
   * Get scheme counts
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

  const totalSchemes =
    totalSchemesResult.count ?? 0;

  const publishedSchemes =
    publishedSchemesResult.count ?? 0;

  const draftSchemes =
    draftSchemesResult.count ?? 0;

  const totalCategories =
    totalCategoriesResult.count ?? 0;

  /*
   * Count authorized admins from ADMIN_USERS
   */
  const totalAdmins =
    process.env.ADMIN_USERS
      ?.split(",")
      .map((item) => item.trim())
      .filter(Boolean).length ?? 0;

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <ShieldCheck size={16} />
          <span>Admin Portal</span>
        </div>

        <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Dashboard
            </h1>

            <p className="mt-2 text-slate-500">
              Welcome back. Here's an overview of
              SchemeSamjho.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white px-4 py-2">
            <p className="text-xs text-slate-400">
              Your role
            </p>

            <p className="font-semibold capitalize text-slate-800">
              {admin.role.replace("_", " ")}
            </p>
          </div>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Schemes"
          value={String(totalSchemes)}
          description="All schemes"
          icon={<FileText size={22} />}
        />

        <StatCard
          title="Published"
          value={String(publishedSchemes)}
          description="Published schemes"
          icon={<ShieldCheck size={22} />}
        />

        <StatCard
          title="Draft Schemes"
          value={String(draftSchemes)}
          description="Schemes in draft"
          icon={<Activity size={22} />}
        />

        <StatCard
          title="Categories"
          value={String(totalCategories)}
          description="Scheme categories"
          icon={<Tags size={22} />}
        />
      </div>

      {/* MAIN CONTENT */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* QUICK ACTIONS */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-2">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Quick Actions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Common administration tasks.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <ActionCard
              title="Manage Schemes"
              description="Create and update government scheme information."
              href="/admin/schemes"
            />

            <ActionCard
              title="Manage Categories"
              description="Create and update scheme categories."
              href="/admin/categories"
            />

            {admin.role === "super_admin" && (
              <ActionCard
                title="Admin Settings"
                description="Configure administration settings."
                href="/admin/settings"
              />
            )}

            <ActionCard
              title="View Schemes"
              description="Review all government schemes."
              href="/admin/schemes"
            />
          </div>
        </div>

        {/* SECURITY STATUS */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
              <ShieldCheck
                size={21}
                className="text-slate-700"
              />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Security
              </h2>

              <p className="text-xs text-slate-500">
                Current session
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <SecurityItem
              label="Authentication"
              value="Active"
            />

            <SecurityItem
              label="Authorization"
              value="Verified"
            />

            <SecurityItem
              label="Role"
              value={admin.role.replace("_", " ")}
            />

            <SecurityItem
              label="Access"
              value="Admin"
            />

            <SecurityItem
              label="Authorized Admins"
              value={String(totalAdmins)}
            />
          </div>
        </div>
      </div>

      {/* INFORMATION */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
            <ShieldCheck size={20} />
          </div>

          <div>
            <h2 className="font-semibold text-slate-900">
              Secure Admin Environment
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Your access is protected by authentication
              and server-side role authorization.
              Administrative operations are validated
              on the server.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------
   STAT CARD
--------------------------------------------- */

function StatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
          {icon}
        </div>

        <ArrowUpRight
          size={17}
          className="text-slate-300"
        />
      </div>

      <p className="mt-5 text-sm text-slate-500">
        {title}
      </p>

      <p className="mt-1 text-2xl font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {description}
      </p>
    </div>
  );
}

/* ---------------------------------------------
   ACTION CARD
--------------------------------------------- */

function ActionCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="group rounded-xl border border-slate-200 p-5 transition hover:border-slate-400 hover:bg-slate-50"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-slate-900">
            {title}
          </h3>

          <p className="mt-1 text-sm leading-5 text-slate-500">
            {description}
          </p>
        </div>

        <ArrowUpRight
          size={18}
          className="shrink-0 text-slate-400 transition group-hover:text-slate-900"
        />
      </div>
    </a>
  );
}

/* ---------------------------------------------
   SECURITY ITEM
--------------------------------------------- */

function SecurityItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span className="text-sm font-semibold capitalize text-slate-800">
        {value}
      </span>
    </div>
  );
}