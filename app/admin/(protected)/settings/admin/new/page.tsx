"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Loader2,
  ShieldCheck,
} from "lucide-react";

type AdminRole = "admin" | "editor" | "viewer";

export default function AddAdminPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] =
    useState<AdminRole>("admin");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [invitationUrl, setInvitationUrl] =
    useState("");

  const [copied, setCopied] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setInvitationUrl("");
    setCopied(false);
    setLoading(true);

    try {
      const response = await fetch(
        "/api/admin/invitations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            role,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to create invitation."
        );
      }

      setInvitationUrl(
        data.invitation.invitationUrl
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyInvitation() {
    if (!invitationUrl) return;

    try {
      await navigator.clipboard.writeText(
        invitationUrl
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setError(
        "Unable to copy invitation link."
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/settings/admin"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-950"
          >
            <ArrowLeft size={18} />
          </Link>

          <div>
            <h1 className="text-2xl font-bold text-slate-950">
              Add Administrator
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Invite a new administrator to
              SchemeSamjho.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Form */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white">
              <ShieldCheck size={20} />
            </div>

            <div>
              <h2 className="font-semibold text-slate-950">
                Administrator details
              </h2>

              <p className="text-sm text-slate-500">
                An invitation will be generated for
                this person.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Full name
              </label>

              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Enter full name"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="admin@example.com"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
              />
            </div>

            {/* Role */}
            <div>
              <label
                htmlFor="role"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Role
              </label>

              <select
                id="role"
                value={role}
                onChange={(event) =>
                  setRole(
                    event.target.value as AdminRole
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
              >
                <option value="admin">
                  Admin
                </option>

                <option value="editor">
                  Editor
                </option>

                <option value="viewer">
                  Viewer
                </option>
              </select>
            </div>

            {/* Security notice */}
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-900">
                Invitation security
              </p>

              <p className="mt-1 text-xs leading-5 text-amber-800">
                The invitation is valid for 48 hours
                and can only be used once.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Submit */}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Link
                href="/admin/settings/admin"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading && (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                )}

                {loading
                  ? "Creating invitation..."
                  : "Create invitation"}
              </button>
            </div>
          </form>
        </div>

        {/* Information */}
        <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-slate-950">
            How it works
          </h3>

          <div className="mt-5 space-y-5">
            <Step
              number="1"
              title="Create invitation"
              description="Enter the administrator's email and select their role."
            />

            <Step
              number="2"
              title="Share invitation"
              description="A secure one-time registration link will be generated."
            />

            <Step
              number="3"
              title="Registration"
              description="The invited person creates their Clerk account and verifies their email."
            />

            <Step
              number="4"
              title="Access granted"
              description="Their assigned role determines what they can access."
            />
          </div>
        </aside>
      </div>

      {/* Invitation created */}
      {invitationUrl && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
          <div className="flex items-start gap-3">
            <CheckCircle2
              className="mt-0.5 shrink-0 text-emerald-600"
              size={22}
            />

            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-emerald-950">
                Invitation created
              </h2>

              <p className="mt-1 text-sm text-emerald-800">
                Share this invitation link with the
                new administrator.
              </p>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <input
                  readOnly
                  value={invitationUrl}
                  className="min-w-0 flex-1 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-xs text-slate-700 outline-none"
                />

                <button
                  type="button"
                  onClick={copyInvitation}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <Copy size={15} />

                  {copied
                    ? "Copied"
                    : "Copy link"}
                </button>
              </div>

              <p className="mt-3 text-xs text-emerald-700">
                This link expires after 48 hours.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">
        {number}
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-900">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}