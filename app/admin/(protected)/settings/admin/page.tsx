import AddAdminForm from "@/components/admin/AddAdminForm";
import AdminList from "@/components/admin/AdminList";
import PendingInvitations from "@/components/admin/PendingInvitations";
import { requireSuperAdmin } from "@/lib/admin";

import {
  ArrowLeft,
  MailPlus,
  ShieldCheck,
  Users,
} from "lucide-react";

import Link from "next/link";

export default async function AdminManagementPage() {
  // =====================================================
  // SUPER ADMIN PROTECTION
  // =====================================================

  await requireSuperAdmin();

  return (
    <div className="space-y-7">
      {/* =====================================================
          PAGE HEADER
          ===================================================== */}

      <div className="flex flex-col gap-5">
        {/* Breadcrumb */}

        <div className="flex items-center gap-2 text-sm">
          <Link
            href="/admin/settings"
            className="inline-flex items-center gap-1.5 font-medium text-slate-400 transition hover:text-slate-700"
          >
            <ArrowLeft size={14} />

            <span>Settings</span>
          </Link>

          <span className="text-slate-300">
            /
          </span>

          <span className="font-medium text-slate-700">
            Admin Management
          </span>
        </div>

        {/* Heading */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              {/* Icon */}

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white shadow-sm">
                <ShieldCheck
                  size={21}
                  strokeWidth={2}
                />
              </div>

              {/* Title */}

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                  Admin Management
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Manage Super Admin accounts
                  and secure invitations.
                </p>
              </div>
            </div>
          </div>

          {/* Security Badge */}

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3.5 py-2 text-xs font-semibold text-green-700">
            <ShieldCheck size={14} />

            <span>
              Super Admin Only
            </span>
          </div>
        </div>
      </div>

      {/* =====================================================
          SECURITY NOTICE
          ===================================================== */}

      <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5">
        <div className="flex items-start gap-3">
          {/* Icon */}

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
            <ShieldCheck size={18} />
          </div>

          {/* Content */}

          <div>
            <h2 className="text-sm font-semibold text-blue-950">
              Secure administrator management
            </h2>

            <p className="mt-1 max-w-3xl text-sm leading-6 text-blue-800">
              Only Super Admins can create
              administrator invitations,
              manage administrator accounts,
              or disable and enable
              administrators. Invitations
              use a secure one-time token
              and expire after 48 hours.
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          ADD SUPER ADMIN
          ===================================================== */}

      <section>
        {/* Section Header */}

        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <MailPlus size={17} />
          </div>

          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Add Super Admin
            </h2>

            <p className="text-sm text-slate-500">
              Invite a new Super Admin to
              SchemeSamjho.
            </p>
          </div>
        </div>

        {/* Add Admin Form */}

        <AddAdminForm />
      </section>

      {/* =====================================================
          ADMINISTRATORS
          ===================================================== */}

      <section>
        {/* Section Header */}

        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <Users size={17} />
          </div>

          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Super Administrators
            </h2>

            <p className="text-sm text-slate-500">
              View and manage registered
              Super Admin accounts.
            </p>
          </div>
        </div>

        {/* Admin List */}

        <AdminList />
      </section>

      {/* =====================================================
          INVITATIONS
          ===================================================== */}

      <section>
        {/* Section Header */}

        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <MailPlus size={17} />
          </div>

          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Invitations
            </h2>

            <p className="text-sm text-slate-500">
              Track pending, expired,
              accepted, and revoked Super
              Admin invitations.
            </p>
          </div>
        </div>

        {/* Invitation List */}

        <PendingInvitations />
      </section>
    </div>
  );
}