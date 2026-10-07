"use client";

import { useCallback, useEffect, useState } from "react";

import {
  Clock3,
  Mail,
  RefreshCw,
  XCircle,
  UserRound,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

type Invitation = {
  id: string;
  email: string;
  role: "super_admin";
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
  created_at: string;
  invited_by?: string | null;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  invitations?: Invitation[];
  data?: Invitation[];
};

function formatDate(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInvitationStatus(invitation: Invitation) {
  if (invitation.accepted_at) {
    return "Accepted";
  }

  if (invitation.revoked_at) {
    return "Revoked";
  }

  if (
    new Date(invitation.expires_at).getTime() <=
    Date.now()
  ) {
    return "Expired";
  }

  return "Pending";
}

function getStatusClasses(status: string) {
  switch (status) {
    case "Accepted":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "Revoked":
      return "border-red-200 bg-red-50 text-red-700";

    case "Expired":
      return "border-amber-200 bg-amber-50 text-amber-700";

    default:
      return "border-blue-200 bg-blue-50 text-blue-700";
  }
}

export default function PendingInvitations() {
  const [invitations, setInvitations] =
    useState<Invitation[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [revokingId, setRevokingId] =
    useState<string | null>(null);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const loadInvitations = useCallback(
    async (showRefreshState = false) => {
      try {
        setErrorMessage("");

        if (showRefreshState) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await fetch(
          "/api/admin/invitations/pending",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const result: ApiResponse =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Unable to load invitations."
          );
        }

        const invitationData =
          result.invitations ??
          result.data ??
          [];

        setInvitations(invitationData);
      } catch (error) {
        console.error(
          "LOAD INVITATIONS ERROR:",
          error
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load invitations."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  async function revokeInvitation(
    invitation: Invitation
  ) {
    const status =
      getInvitationStatus(invitation);

    if (status !== "Pending") {
      setErrorMessage(
        "Only pending invitations can be revoked."
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to revoke the invitation sent to ${invitation.email}?\n\nThe invitation link will immediately stop working.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setRevokingId(invitation.id);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await fetch(
        `/api/admin/invitations/${invitation.id}/revoke`,
        {
          method: "PATCH",
        }
      );

      const result: ApiResponse =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Unable to revoke invitation."
        );
      }

      setInvitations((current) =>
        current.map((item) =>
          item.id === invitation.id
            ? {
                ...item,
                revoked_at:
                  new Date().toISOString(),
              }
            : item
        )
      );

      setSuccessMessage(
        "Invitation revoked successfully."
      );

      window.setTimeout(() => {
        setSuccessMessage("");
      }, 4000);
    } catch (error) {
      console.error(
        "REVOKE INVITATION ERROR:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to revoke invitation."
      );
    } finally {
      setRevokingId(null);
    }
  }

  const pendingCount =
    invitations.filter(
      (invitation) =>
        getInvitationStatus(invitation) ===
        "Pending"
    ).length;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <Mail size={18} />
          </div>

          <div>
            <h3 className="text-base font-semibold text-slate-950">
              Invitations
            </h3>

            <p className="mt-0.5 text-sm text-slate-500">
              {pendingCount} pending{" "}
              {pendingCount === 1
                ? "invitation"
                : "invitations"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 sm:flex">
            <Clock3 size={13} />
            48 hour expiry
          </div>

          <button
            type="button"
            onClick={() =>
              loadInvitations(true)
            }
            disabled={refreshing || loading}
            title="Refresh invitations"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />
          </button>
        </div>
      </div>

      {/* Error */}
      {errorMessage && (
        <div className="mx-5 mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertTriangle
            size={18}
            className="mt-0.5 shrink-0 text-red-600"
          />

          <div>
            <p className="text-sm font-semibold text-red-800">
              Something went wrong
            </p>

            <p className="mt-1 text-sm text-red-700">
              {errorMessage}
            </p>
          </div>
        </div>
      )}

      {/* Success */}
      {successMessage && (
        <div className="mx-5 mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-700">
            {successMessage}
          </p>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex min-h-[220px] items-center justify-center">
          <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
            <RefreshCw
              size={17}
              className="animate-spin"
            />
            Loading invitations...
          </div>
        </div>
      ) : invitations.length === 0 ? (
        /* Empty state */
        <div className="flex min-h-[260px] flex-col items-center justify-center px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Mail size={24} />
          </div>

          <h3 className="mt-4 text-base font-semibold text-slate-900">
            No invitations
          </h3>

          <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
            There are currently no administrator
            invitations.
          </p>
        </div>
      ) : (
        /* Table */
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70">
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Invitee
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Role
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Expires
                </th>

                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {invitations.map(
                (invitation) => {
                  const status =
                    getInvitationStatus(
                      invitation
                    );

                  const isRevoking =
                    revokingId ===
                    invitation.id;

                  const canRevoke =
                    status === "Pending";

                  return (
                    <tr
                      key={invitation.id}
                      className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60"
                    >
                      {/* Invitee */}
                      <td className="px-5 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                            <Mail size={17} />
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {
                                invitation.email
                              }
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              Sent{" "}
                              {formatDate(
                                invitation.created_at
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-5 py-5">
                        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                          <UserRound
                            size={13}
                          />

                          Super Admin
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-5">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${getStatusClasses(
                            status
                          )}`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />

                          {status}
                        </span>
                      </td>

                      {/* Expires */}
                      <td className="px-5 py-5">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Clock3
                            size={15}
                            className="text-slate-400"
                          />

                          {formatDate(
                            invitation.expires_at
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-5 text-right">
                        {canRevoke ? (
                          <button
                            type="button"
                            onClick={() =>
                              revokeInvitation(
                                invitation
                              )
                            }
                            disabled={
                              isRevoking
                            }
                            className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-200 bg-white px-3 text-xs font-semibold text-red-600 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isRevoking ? (
                              <RefreshCw
                                size={14}
                                className="animate-spin"
                              />
                            ) : (
                              <XCircle
                                size={14}
                              />
                            )}

                            {isRevoking
                              ? "Revoking..."
                              : "Revoke"}
                          </button>
                        ) : (
                          <span className="text-xs font-medium text-slate-400">
                            No action
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Security footer */}
      <div className="flex items-center gap-2 border-t border-slate-200 bg-slate-50/60 px-5 py-3.5 text-xs text-slate-500">
        <ShieldCheck
          size={14}
          className="text-emerald-600"
        />

        Only Super Admins can revoke invitations.
      </div>
    </div>
  );
}