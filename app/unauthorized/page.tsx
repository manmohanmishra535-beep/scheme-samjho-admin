import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F9FAFB] px-6">
      <div className="w-full max-w-lg rounded-2xl border border-[#111827]/10 bg-white p-8 text-center">
        <p className="text-sm font-bold uppercase tracking-wide text-[#2563EB]">
          SchemeSamjho Admin
        </p>

        <h1 className="mt-3 text-3xl font-black text-[#111827]">
          Access denied
        </h1>

        <p className="mt-3 text-sm leading-6 text-[#111827]/60">
          Your account is signed in, but it does not
          have administrator access to this application.
        </p>

        <Link
          href="/"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-[#2563EB] px-5 text-sm font-bold text-white transition hover:bg-[#111827]"
        >
          Back to Admin Login
        </Link>
      </div>
    </main>
  );
}