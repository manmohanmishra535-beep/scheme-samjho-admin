"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Copy,
  Mail,
  ShieldCheck,
  UserPlus,
} from "lucide-react";

type InvitationResponse = {
  success: boolean;
  message?: string;
  invitation?: {
    id: string;
    email: string;
    role: string;
    expiresAt: string;
    invitationUrl: string;
  };
};

export default function AddAdminForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [invitationUrl, setInvitationUrl] =
    useState("");

  const [copied, setCopied] =
    useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setInvitationUrl("");
    setCopied(false);

    const cleanName = name.trim();
    const cleanEmail =
      email.trim().toLowerCase();

    // -----------------------------
    // Validate name
    // -----------------------------

    if (!cleanName) {
      setError(
        "Please enter the administrator's full name."
      );
      return;
    }

    if (cleanName.length > 100) {
      setError(
        "Name must be 100 characters or less."
      );
      return;
    }

    // -----------------------------
    // Validate email
    // -----------------------------

    if (!cleanEmail) {
      setError(
        "Please enter the administrator's email address."
      );
      return;
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(cleanEmail)) {
      setError(
        "Please enter a valid email address."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      /*
       * IMPORTANT:
       *
       * We intentionally DO NOT send a role.
       *
       * The backend automatically creates
       * every invitation as:
       *
       * super_admin
       */
      const response = await fetch(
        "/api/admin/invitations",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            name: cleanName,
            email: cleanEmail,
          }),
        }
      );

      const data: InvitationResponse =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        setError(
          data.message ??
            "Unable to create invitation."
        );

        return;
      }

      if (
        !data.invitation?.invitationUrl
      ) {
        setError(
          "Invitation was created, but the invitation link could not be generated."
        );

        return;
      }

      setSuccess(
        "Super Admin invitation created successfully."
      );

      setInvitationUrl(
        data.invitation.invitationUrl
      );

      // Clear form after successful creation.
      setName("");
      setEmail("");
    } catch (error) {
      console.error(
        "CREATE INVITATION ERROR:",
        error
      );

      setError(
        "Something went wrong while creating the invitation. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function copyInvitationLink() {
    if (!invitationUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        invitationUrl
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2500);
    } catch (error) {
      console.error(
        "COPY INVITATION ERROR:",
        error
      );

      setError(
        "Unable to copy the invitation link. Please copy it manually."
      );
    }
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-200 px-8 py-6">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          <UserPlus
            size={23}
            strokeWidth={2}
          />
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-950">
            Add Administrator
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Create a secure Super Admin invitation.
          </p>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-6 p-8"
      >
        {/* Name */}
        <div>
          <label
            htmlFor="admin-name"
            className="mb-2 block text-sm font-semibold text-slate-800"
          >
            Full name
          </label>

          <input
            id="admin-name"
            type="text"
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            placeholder="Enter full name"
            disabled={isSubmitting}
            autoComplete="name"
            maxLength={100}
            className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
          />
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="admin-email"
            className="mb-2 block text-sm font-semibold text-slate-800"
          >
            Email address
          </label>

          <div className="relative">
            <Mail
              size={19}
              className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="admin@example.com"
              disabled={isSubmitting}
              autoComplete="email"
              className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            />
          </div>
        </div>

        {/* Fixed role */}
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-800">
            Administrator Role
          </p>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white">
                <ShieldCheck
                  size={21}
                />
              </div>

              <div>
                <p className="font-semibold text-slate-950">
                  Super Admin
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Full administrator access to
                  SchemeSamjho.
                </p>
              </div>
            </div>
          </div>

          <p className="mt-2 text-xs leading-5 text-slate-400">
            All administrators invited from this
            page receive Super Admin access.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
            <div className="flex items-start gap-3">
              <CheckCircle2
                size={20}
                className="mt-0.5 shrink-0 text-emerald-600"
              />

              <div>
                <p className="font-semibold text-emerald-800">
                  {success}
                </p>

                <p className="mt-1 text-sm leading-6 text-emerald-700">
                  Share the invitation link with
                  the new Super Admin. The link
                  expires after 48 hours.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Invitation URL */}
        {invitationUrl && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <label
              htmlFor="invitation-url"
              className="mb-2 block text-sm font-semibold text-slate-800"
            >
              Invitation link
            </label>

            <div className="flex gap-2">
              <input
                id="invitation-url"
                type="text"
                value={invitationUrl}
                readOnly
                className="h-12 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-xs text-slate-600 outline-none"
              />

              <button
                type="button"
                onClick={
                  copyInvitationLink
                }
                className="flex h-12 shrink-0 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {copied ? (
                  <>
                    <CheckCircle2
                      size={17}
                    />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={17} />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <svg
                className="h-5 w-5 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="opacity-30"
                />

                <path
                  d="M21 12a9 9 0 0 0-9-9"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>

              Creating Invitation...
            </>
          ) : (
            <>
              <UserPlus size={19} />

              Create Super Admin Invitation
            </>
          )}
        </button>
      </form>
    </div>
  );
}