import {
  Activity,
  Database,
  ShieldCheck,
  UserCog,
  Server,
  LockKeyhole,
} from "lucide-react";

import { requireSuperAdmin } from "@/lib/admin";

export default async function AdminSettingsPage() {
  const admin = await requireSuperAdmin();

  return (
    <div className="space-y-7">
      {/* Header */}
      <section>
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-500">
          <ShieldCheck size={16} />
          <span>Admin Portal</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-400">Settings</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          Admin Settings
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
          Manage administration, security and system information
          for SchemeSamjho.
        </p>
      </section>

      {/* Admin Account */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <UserCog size={19} />
          </div>

          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Admin Account
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Current administrator access information.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <InfoCard
            label="Access Level"
            value={formatRole(admin.role)}
          />

          <InfoCard
            label="Authorization"
            value="Verified"
          />
        </div>
      </section>

      {/* Security */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <LockKeyhole size={19} />
          </div>

          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Security
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Security status for the administration panel.
            </p>
          </div>
        </div>

        <div className="mt-5 divide-y divide-slate-100">
          <StatusRow
            icon={<ShieldCheck size={17} />}
            label="Authentication"
            description="Administrator authentication is enabled."
            status="Active"
          />

          <StatusRow
            icon={<LockKeyhole size={17} />}
            label="Server-side authorization"
            description="Admin permissions are verified on the server."
            status="Enabled"
          />

          <StatusRow
            icon={<UserCog size={17} />}
            label="Role-based access"
            description="Access is controlled using administrator roles."
            status="Enabled"
          />
        </div>
      </section>

      {/* System */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <Server size={19} />
          </div>

          <div>
            <h2 className="text-base font-semibold text-slate-950">
              System Information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Current status of the SchemeSamjho administration system.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SystemCard
            icon={<Activity size={18} />}
            label="Application"
            value="Operational"
          />

          <SystemCard
            icon={<Database size={18} />}
            label="Database"
            value="Connected"
          />

          <SystemCard
            icon={<ShieldCheck size={18} />}
            label="Admin Access"
            value="Protected"
          />
        </div>
      </section>

      {/* Access Roles */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <UserCog size={19} />
          </div>

          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Administrator Roles
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Roles currently supported by SchemeSamjho Admin.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <RoleCard
            title="Super Admin"
            description="Full administrative access and system settings."
            active
          />

          <RoleCard
            title="Editor"
            description="Manage schemes and categories."
          />

          <RoleCard
            title="Viewer"
            description="View administration content without editing."
          />
        </div>
      </section>

      {/* Secure Administration */}
      <section className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
            <ShieldCheck size={19} />
          </div>

          <div>
            <h2 className="text-sm font-semibold">
              Secure Administration
            </h2>

            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400">
              Administrative pages are protected by authentication
              and server-side role authorization. Only authorized
              administrators can access protected functionality.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-medium text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold capitalize text-slate-900">
        {value}
      </p>
    </div>
  );
}

function StatusRow({
  icon,
  label,
  description,
  status,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  status: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">
            {label}
          </p>

          <p className="mt-0.5 text-xs text-slate-500">
            {description}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />

        <span className="text-sm font-semibold text-emerald-600">
          {status}
        </span>
      </div>
    </div>
  );
}

function SystemCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          {icon}
        </div>

        <div>
          <p className="text-xs font-medium text-slate-400">
            {label}
          </p>

          <p className="mt-0.5 text-sm font-semibold text-slate-900">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function RoleCard({
  title,
  description,
  active = false,
}: {
  title: string;
  description: string;
  active?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        active
          ? "border-slate-300 bg-slate-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-900">
          {title}
        </h3>

        {active && (
          <span className="rounded-md bg-slate-950 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            Current
          </span>
        )}
      </div>

      <p className="mt-2 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function formatRole(role: string) {
  return role.replace(/_/g, " ");
}