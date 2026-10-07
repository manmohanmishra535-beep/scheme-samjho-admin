import Link from "next/link";
import {
  ArrowLeft,
  MailPlus,
  ShieldCheck,
  Users,
} from "lucide-react";

import AddAdminForm from "@/components/admin/AddAdminForm";
import AdminList from "@/components/admin/AdminList";
import PendingInvitations from "@/components/admin/PendingInvitations";

import { requireSuperAdmin } from "@/lib/admin";

export default async function AdminManagementPage() {
  await requireSuperAdmin();

  return (
    <div className="space-y-7">
      {/* Page Header */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          {/* Breadcrumb */}
          <div className="mb-4 flex items-center gap-2 text-sm">
            <Link
              href="/admin/settings"
              className="inline-flex items-center gap-1.5 font-medium text-slate-500 transition hover:text-slate-950"
            >
              <ArrowLeft size={15} />
              Settings
            </Link>

            <span className="text-slate-300">
              /
            </span>

            <span className="font-medium text-slate-950">
              Admin Management
            </span>
          </div>

          {/* Title */}
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
              <ShieldCheck
                size={23}
                strokeWidth={2}
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Admin Management
              </h1>

              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
                Manage administrators, invite new
                team members, and control their
                access to SchemeSamjho.
              </p>
            </div>
          </div>
        </div>

        {/* Security Badge */}
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3.5 py-2 text-xs font-semibold text-green-700">
          <ShieldCheck size={15} />
          Super Admin Only
        </div>
      </div>

      {/* Security Information */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <ShieldCheck size={19} />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-950">
              Secure administrator access
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              New administrators can only be added
              through an invitation created by an
              active Super Admin. Invitation links
              expire after 48 hours and can only be
              used once.
            </p>
          </div>
        </div>
      </div>

      {/* Add Administrator */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <MailPlus size={18} />
          </div>

          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Add Administrator
            </h2>

            <p className="text-sm text-slate-500">
              Send a secure invitation to a new
              administrator.
            </p>
          </div>
        </div>

        <AddAdminForm />
      </section>

      {/* Pending Invitations */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <MailPlus size={18} />
          </div>

          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Invitations
            </h2>

            <p className="text-sm text-slate-500">
              Track administrator invitations and
              revoke pending invitations.
            </p>
          </div>
        </div>

        <PendingInvitations />
      </section>

      {/* Administrators */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <Users size={18} />
          </div>

          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Administrators
            </h2>

            <p className="text-sm text-slate-500">
              View administrators and manage their
              account status.
            </p>
          </div>
        </div>

        <AdminList />
      </section>
    </div>
  )
}