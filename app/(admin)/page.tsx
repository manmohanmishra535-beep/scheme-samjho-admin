import { FileText, PlusCircle } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-[#2563EB]">
            Admin Panel
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#111827] sm:text-4xl">
            Dashboard
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#111827]/60 sm:text-base">
            Manage government scheme information
            displayed on SchemeSamjho.
          </p>
        </div>

        <Link
          href="/schemes/new"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-5 text-sm font-bold text-white transition hover:bg-[#111827]"
        >
          <PlusCircle className="h-4 w-4" />
          Add Scheme
        </Link>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <Link
          href="/schemes"
          className="group rounded-2xl border border-[#111827]/10 bg-white p-6 transition hover:border-[#2563EB]/40"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#2563EB]/10">
            <FileText className="h-5 w-5 text-[#2563EB]" />
          </div>

          <h2 className="mt-5 text-xl font-black text-[#111827]">
            Manage Schemes
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#111827]/60">
            View, create, edit and delete government
            scheme records.
          </p>

          <span className="mt-5 inline-block text-sm font-bold text-[#2563EB] group-hover:text-[#111827]">
            Open schemes →
          </span>
        </Link>

        <Link
          href="/schemes/new"
          className="group rounded-2xl border border-[#111827]/10 bg-white p-6 transition hover:border-[#16A34A]/40"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#16A34A]/10">
            <PlusCircle className="h-5 w-5 text-[#16A34A]" />
          </div>

          <h2 className="mt-5 text-xl font-black text-[#111827]">
            Add New Scheme
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#111827]/60">
            Add a new scheme directly to the shared
            Supabase database.
          </p>

          <span className="mt-5 inline-block text-sm font-bold text-[#16A34A] group-hover:text-[#111827]">
            Add scheme →
          </span>
        </Link>
      </div>

      <div className="mt-8 rounded-2xl border border-[#2563EB]/20 bg-[#2563EB]/5 p-5">
        <p className="text-sm leading-6 text-[#111827]">
          <span className="font-black">
            Private admin application:
          </span>{" "}
          This application is separate from the public
          SchemeSamjho website. Only Clerk users whose
          IDs are configured in{" "}
          <code className="font-bold">
            ADMIN_USER_IDS
          </code>{" "}
          can access it.
        </p>
      </div>
    </div>
  );
}