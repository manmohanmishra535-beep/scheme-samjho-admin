"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  useSignIn,
  useSignUp,
} from "@clerk/nextjs";

type AdminSignupFormProps = {
  invitationToken: string;
};

type InvitationData = {
  id: string;
  email: string;
  role: "super_admin";
  expiresAt: string;
};

type InvitationResponse = {
  success?: boolean;
  message?: string;
  invitation?: InvitationData;
};

type AcceptResponse = {
  success?: boolean;
  message?: string;
};

type VerificationMode =
  | "none"
  | "signup_email"
  | "device_trust_email"
  | "signin_mfa_email"
  | "signin_mfa_totp";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error
  ) {
    const message = (error as { message?: unknown })
      .message;

    if (typeof message === "string") {
      return message;
    }
  }

  return "Something went wrong. Please try again.";
}

export default function AdminSignupForm({
  invitationToken,
}: AdminSignupFormProps) {
  const router = useRouter();

  const {
    signUp,
    errors: signUpErrors,
    fetchStatus: signUpFetchStatus,
  } = useSignUp();

  const {
    signIn,
    errors: signInErrors,
    fetchStatus: signInFetchStatus,
  } = useSignIn();

  const [invitation, setInvitation] =
    useState<InvitationData | null>(null);

  const [loadingInvitation, setLoadingInvitation] =
    useState(true);

  const [invitationError, setInvitationError] =
    useState("");

  const [mode, setMode] = useState<
    "signup" | "login"
  >("signup");

  const [name, setName] = useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [code, setCode] = useState("");

  const [verificationMode, setVerificationMode] =
    useState<VerificationMode>("none");

  const [loading, setLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [acceptingInvitation, setAcceptingInvitation] =
    useState(false);

  /*
   * --------------------------------------------------
   * Validate invitation
   * --------------------------------------------------
   */

  const validateInvitation =
    useCallback(async () => {
      if (!invitationToken) {
        setInvitationError(
          "Invitation token is missing."
        );
        setLoadingInvitation(false);
        return;
      }

      try {
        setLoadingInvitation(true);
        setInvitationError("");
        setErrorMessage("");

        const response = await fetch(
          "/api/admin/invitations/validate",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            cache: "no-store",
            body: JSON.stringify({
              token: invitationToken,
            }),
          }
        );

        const result: InvitationResponse =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              "This invitation is invalid or has expired."
          );
        }

        if (!result.invitation) {
          throw new Error(
            "Invitation information could not be loaded."
          );
        }

        if (
          result.invitation.role !==
          "super_admin"
        ) {
          throw new Error(
            "This invitation does not have administrator permissions."
          );
        }

        setInvitation(result.invitation);
      } catch (error) {
        console.error(
          "VALIDATE INVITATION ERROR:",
          error
        );

        setInvitationError(
          getErrorMessage(error)
        );
      } finally {
        setLoadingInvitation(false);
      }
    }, [invitationToken]);

  useEffect(() => {
    validateInvitation();
  }, [validateInvitation]);

  /*
   * --------------------------------------------------
   * Accept invitation in database
   * --------------------------------------------------
   */

  const acceptInvitation =
    useCallback(async () => {
      if (!invitationToken) {
        throw new Error(
          "Invitation token is missing."
        );
      }

      setAcceptingInvitation(true);

      try {
        const response = await fetch(
          "/api/admin/invitations/accept",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            cache: "no-store",
            body: JSON.stringify({
              token: invitationToken,
              name:
                name.trim() ||
                invitation?.email ||
                "Administrator",
            }),
          }
        );

        const result: AcceptResponse =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Unable to activate your administrator account."
          );
        }

        return result;
      } finally {
        setAcceptingInvitation(false);
      }
    }, [
      invitationToken,
      name,
      invitation?.email,
    ]);

  /*
   * --------------------------------------------------
   * Finish Clerk sign-in
   * --------------------------------------------------
   *
   * IMPORTANT:
   *
   * 1. Clerk authentication
   * 2. finalize()
   * 3. Accept invitation in Supabase
   * 4. Dashboard
   *
   * Do NOT reverse this order.
   */

  const finishSignIn =
    useCallback(async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const { error } =
          await signIn.finalize();

        if (error) {
          throw new Error(
            error.message ||
              "Unable to complete sign in."
          );
        }

        await acceptInvitation();

        setSuccessMessage(
          "Administrator account activated successfully."
        );

        router.replace("/admin/dashboard");
      } catch (error) {
        console.error(
          "FINISH SIGN IN ERROR:",
          error
        );

        setErrorMessage(
          getErrorMessage(error)
        );
      } finally {
        setLoading(false);
      }
    }, [
      signIn,
      acceptInvitation,
      router,
    ]);

  /*
   * --------------------------------------------------
   * Finish Clerk sign-up
   * --------------------------------------------------
   */

  const finishSignUp =
    useCallback(async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const { error } =
          await signUp.finalize();

        if (error) {
          throw new Error(
            error.message ||
              "Unable to complete account creation."
          );
        }

        await acceptInvitation();

        setSuccessMessage(
          "Administrator account created successfully."
        );

        router.replace("/admin/dashboard");
      } catch (error) {
        console.error(
          "FINISH SIGN UP ERROR:",
          error
        );

        setErrorMessage(
          getErrorMessage(error)
        );
      } finally {
        setLoading(false);
      }
    }, [
      signUp,
      acceptInvitation,
      router,
    ]);

  /*
   * --------------------------------------------------
   * Create new Clerk account
   * --------------------------------------------------
   */

  async function handleSignup(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!invitation) {
      setErrorMessage(
        "The invitation could not be verified."
      );
      return;
    }

    const trimmedName = name.trim();

    if (!trimmedName) {
      setErrorMessage(
        "Please enter your full name."
      );
      return;
    }

    if (!password) {
      setErrorMessage(
        "Please enter a password."
      );
      return;
    }

    if (password.length < 8) {
      setErrorMessage(
        "Password must contain at least 8 characters."
      );
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const { error } =
        await signUp.password({
          emailAddress:
            invitation.email,
          password,
        });

      if (error) {
        throw new Error(
          error.message ||
            "Unable to create your account."
        );
      }

      /*
       * Send email verification code.
       */

      const {
        error: verificationError,
      } =
        await signUp.verifications.sendEmailCode();

      if (verificationError) {
        throw new Error(
          verificationError.message ||
            "Unable to send the verification code."
        );
      }

      setVerificationMode(
        "signup_email"
      );

      setSuccessMessage(
        `A verification code has been sent to ${invitation.email}.`
      );
    } catch (error) {
      console.error(
        "SIGNUP ERROR:",
        error
      );

      setErrorMessage(
        getErrorMessage(error)
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * --------------------------------------------------
   * Existing Clerk account login
   * --------------------------------------------------
   */

  async function handleLogin(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!invitation) {
      setErrorMessage(
        "The invitation could not be verified."
      );
      return;
    }

    if (!password) {
      setErrorMessage(
        "Please enter your password."
      );
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const { error } =
        await signIn.password({
          emailAddress:
            invitation.email,
          password,
        });

      if (error) {
        throw new Error(
          error.message ||
            "Unable to sign in."
        );
      }

      /*
       * Device Trust
       *
       * New devices can require email verification.
       */

      if (
        signIn.status ===
        "needs_client_trust"
      ) {
        const emailFactor =
          signIn.supportedSecondFactors?.find(
            (factor) =>
              factor.strategy ===
              "email_code"
          );

        if (!emailFactor) {
          throw new Error(
            "This device requires verification, but email verification is not available."
          );
        }

        const {
          error: deviceError,
        } =
          await signIn.mfa.sendEmailCode();

        if (deviceError) {
          throw new Error(
            deviceError.message ||
              "Unable to send device verification code."
          );
        }

        setVerificationMode(
          "device_trust_email"
        );

        setSuccessMessage(
          `A verification code has been sent to ${invitation.email}.`
        );

        return;
      }

      /*
       * Normal MFA.
       */

      if (
        signIn.status ===
        "needs_second_factor"
      ) {
        const emailFactor =
          signIn.supportedSecondFactors?.find(
            (factor) =>
              factor.strategy ===
              "email_code"
          );

        if (emailFactor) {
          const {
            error: mfaError,
          } =
            await signIn.mfa.sendEmailCode();

          if (mfaError) {
            throw new Error(
              mfaError.message ||
                "Unable to send MFA verification code."
            );
          }

          setVerificationMode(
            "signin_mfa_email"
          );

          setSuccessMessage(
            `A verification code has been sent to ${invitation.email}.`
          );

          return;
        }

        const totpFactor =
          signIn.supportedSecondFactors?.find(
            (factor) =>
              factor.strategy ===
              "totp"
          );

        if (totpFactor) {
          setVerificationMode(
            "signin_mfa_totp"
          );

          setSuccessMessage(
            "Enter the verification code from your authenticator app."
          );

          return;
        }

        throw new Error(
          "Additional verification is required, but no supported verification method was found."
        );
      }

      /*
       * Normal login completed.
       */

      if (
        signIn.status === "complete"
      ) {
        await finishSignIn();
        return;
      }

      throw new Error(
        `Unable to complete sign in. Current status: ${signIn.status}`
      );
    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error
      );

      setErrorMessage(
        getErrorMessage(error)
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * --------------------------------------------------
   * Verify email / MFA code
   * --------------------------------------------------
   */

  async function handleVerification(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const trimmedCode =
      code.trim();

    if (!trimmedCode) {
      setErrorMessage(
        "Please enter the verification code."
      );
      return;
    }

    if (trimmedCode.length < 4) {
      setErrorMessage(
        "Please enter a valid verification code."
      );
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      /*
       * New account email verification.
       */

      if (
        verificationMode ===
        "signup_email"
      ) {
        const { error } =
          await signUp.verifications.verifyEmailCode(
            {
              code: trimmedCode,
            }
          );

        if (error) {
          throw new Error(
            error.message ||
              "Invalid verification code."
          );
        }

        if (
          signUp.status !== "complete"
        ) {
          throw new Error(
            "Email verified, but the account setup is not complete yet."
          );
        }

        await finishSignUp();
        return;
      }

      /*
       * New device verification.
       */

      if (
        verificationMode ===
        "device_trust_email"
      ) {
        const { error } =
          await signIn.mfa.verifyEmailCode(
            {
              code: trimmedCode,
            }
          );

        if (error) {
          throw new Error(
            error.message ||
              "Invalid device verification code."
          );
        }

        if (
          signIn.status !== "complete"
        ) {
          throw new Error(
            "Device verification completed, but sign in is not complete."
          );
        }

        await finishSignIn();
        return;
      }

      /*
       * Normal MFA email verification.
       */

      if (
        verificationMode ===
        "signin_mfa_email"
      ) {
        const { error } =
          await signIn.mfa.verifyEmailCode(
            {
              code: trimmedCode,
            }
          );

        if (error) {
          throw new Error(
            error.message ||
              "Invalid MFA verification code."
          );
        }

        if (
          signIn.status !== "complete"
        ) {
          throw new Error(
            "Verification completed, but sign in is not complete."
          );
        }

        await finishSignIn();
        return;
      }

      /*
       * Authenticator app verification.
       */

      if (
        verificationMode ===
        "signin_mfa_totp"
      ) {
        const { error } =
          await signIn.mfa.verifyTOTP(
            {
              code: trimmedCode,
            }
          );

        if (error) {
          throw new Error(
            error.message ||
              "Invalid authenticator code."
          );
        }

        if (
          signIn.status !== "complete"
        ) {
          throw new Error(
            "Verification completed, but sign in is not complete."
          );
        }

        await finishSignIn();
        return;
      }
    } catch (error) {
      console.error(
        "VERIFICATION ERROR:",
        error
      );

      setErrorMessage(
        getErrorMessage(error)
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * --------------------------------------------------
   * Resend verification code
   * --------------------------------------------------
   */

  async function handleResendCode() {
    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      if (
        verificationMode ===
        "signup_email"
      ) {
        const { error } =
          await signUp.verifications.sendEmailCode();

        if (error) {
          throw new Error(
            error.message ||
              "Unable to resend verification code."
          );
        }
      }

      if (
        verificationMode ===
        "device_trust_email"
      ) {
        const { error } =
          await signIn.mfa.sendEmailCode();

        if (error) {
          throw new Error(
            error.message ||
              "Unable to resend device verification code."
          );
        }
      }

      if (
        verificationMode ===
        "signin_mfa_email"
      ) {
        const { error } =
          await signIn.mfa.sendEmailCode();

        if (error) {
          throw new Error(
            error.message ||
              "Unable to resend MFA code."
          );
        }
      }

      setSuccessMessage(
        `A new verification code has been sent to ${invitation?.email}.`
      );
    } catch (error) {
      console.error(
        "RESEND CODE ERROR:",
        error
      );

      setErrorMessage(
        getErrorMessage(error)
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * --------------------------------------------------
   * Change authentication mode
   * --------------------------------------------------
   */

  function switchMode(
    nextMode: "signup" | "login"
  ) {
    setMode(nextMode);
    setErrorMessage("");
    setSuccessMessage("");
    setPassword("");
  }

  /*
   * --------------------------------------------------
   * Loading invitation
   * --------------------------------------------------
   */

  if (loadingInvitation) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
          <Loader2
            size={18}
            className="animate-spin"
          />
          Validating invitation...
        </div>
      </div>
    );
  }

  /*
   * --------------------------------------------------
   * Invalid invitation
   * --------------------------------------------------
   */

  if (
    !invitation ||
    invitationError
  ) {
    return (
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <AlertCircle size={22} />
          </div>

          <h2 className="mt-5 text-xl font-semibold text-slate-950">
            Invalid invitation
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            {invitationError ||
              "This administrator invitation is no longer valid."}
          </p>

          <Link
            href="/admin/login"
            className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <ArrowLeft size={16} />
            Back to Admin Login
          </Link>
        </div>
      </div>
    );
  }

  /*
   * --------------------------------------------------
   * Verification screen
   * --------------------------------------------------
   */

  if (
    verificationMode !==
    "none"
  ) {
    const isSignupVerification =
      verificationMode ===
      "signup_email";

    const isTotp =
      verificationMode ===
      "signin_mfa_totp";

    let title =
      "Verify your account";

    let description =
      `Enter the verification code sent to ${invitation.email}.`;

    if (
      verificationMode ===
      "device_trust_email"
    ) {
      title = "Verify this device";

      description =
        `For security, verify this new device using the code sent to ${invitation.email}.`;
    }

    if (
      verificationMode ===
      "signin_mfa_email"
    ) {
      title = "Additional verification";

      description =
        `Enter the MFA code sent to ${invitation.email}.`;
    }

    if (isTotp) {
      title = "Authenticator verification";

      description =
        "Enter the 6-digit code from your authenticator app.";
    }

    return (
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 text-white">
            {isTotp ? (
              <LockKeyhole size={22} />
            ) : (
              <Mail size={22} />
            )}
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-950">
            {title}
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            {description}
          </p>

          {!isTotp && (
            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3">
              <div className="flex items-start gap-2">
                <Mail
                  size={16}
                  className="mt-0.5 shrink-0 text-blue-600"
                />

                <p className="text-xs leading-5 text-blue-800">
                  Check your inbox for the
                  verification code.
                </p>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3">
              <div className="flex items-start gap-2">
                <AlertCircle
                  size={16}
                  className="mt-0.5 shrink-0 text-red-600"
                />

                <p className="text-sm text-red-700">
                  {errorMessage}
                </p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <div className="flex items-start gap-2">
                <CheckCircle2
                  size={16}
                  className="mt-0.5 shrink-0 text-emerald-600"
                />

                <p className="text-sm text-emerald-700">
                  {successMessage}
                </p>
              </div>
            </div>
          )}

          <form
            onSubmit={handleVerification}
            className="mt-6 space-y-4"
          >
            <div>
              <label
                htmlFor="verification-code"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Verification code
              </label>

              <input
                id="verification-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(event) =>
                  setCode(
                    event.target.value
                  )
                }
                placeholder="Enter verification code"
                maxLength={8}
                disabled={loading}
                autoFocus
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-center text-lg font-semibold tracking-[0.3em] text-slate-950 outline-none transition placeholder:tracking-normal placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 disabled:bg-slate-50"
              />
            </div>

            <button
              type="submit"
              disabled={
                loading ||
                !code.trim()
              }
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                  Verifying...
                </>
              ) : (
                <>
                  <ShieldCheck size={17} />
                  Verify and Continue
                </>
              )}
            </button>
          </form>

          {!isTotp && (
            <button
              type="button"
              onClick={
                handleResendCode
              }
              disabled={loading}
              className="mt-4 w-full text-center text-sm font-semibold text-slate-700 hover:text-slate-950 disabled:opacity-50"
            >
              Resend verification code
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setVerificationMode(
                "none"
              );
              setCode("");
              setErrorMessage("");
              setSuccessMessage("");
            }}
            disabled={loading}
            className="mt-3 flex w-full items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft size={15} />
            Back
          </button>
        </div>
      </div>
    );
  }

  /*
   * --------------------------------------------------
   * Main signup/login UI
   * --------------------------------------------------
   */

  const isSubmitting =
    loading ||
    acceptingInvitation ||
    signUpFetchStatus ===
      "fetching" ||
    signInFetchStatus ===
      "fetching";

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        {/* Header */}

        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 text-white">
            <ShieldCheck size={23} />
          </div>

          <div>
            <h1 className="text-xl font-bold text-slate-950">
              SchemeSamjho Admin
            </h1>

            <p className="text-sm text-slate-500">
              Administrator invitation
            </p>
          </div>
        </div>

        {/* Invitation information */}

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start gap-3">
            <Mail
              size={18}
              className="mt-0.5 shrink-0 text-slate-500"
            />

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Invited email
              </p>

              <p className="mt-1 break-all text-sm font-semibold text-slate-950">
                {invitation.email}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-3">
            <UserRound
              size={18}
              className="mt-0.5 shrink-0 text-slate-500"
            />

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Administrator role
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-950">
                Super Admin
              </p>
            </div>
          </div>
        </div>

        {/* Security notice */}

        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <div className="flex items-start gap-2">
            <ShieldCheck
              size={16}
              className="mt-0.5 shrink-0 text-emerald-600"
            />

            <p className="text-xs leading-5 text-emerald-800">
              This invitation grants full
              Super Admin access to
              SchemeSamjho.
            </p>
          </div>
        </div>

        {/* Mode switch */}

        <div className="mt-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() =>
              switchMode("signup")
            }
            className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
              mode === "signup"
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Create Account
          </button>

          <button
            type="button"
            onClick={() =>
              switchMode("login")
            }
            className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
              mode === "login"
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Existing Account
          </button>
        </div>

        {/* Error */}

        {errorMessage && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-2">
              <AlertCircle
                size={17}
                className="mt-0.5 shrink-0 text-red-600"
              />

              <p className="text-sm leading-5 text-red-700">
                {errorMessage}
              </p>
            </div>
          </div>
        )}

        {/* Success */}

        {successMessage && (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-start gap-2">
              <CheckCircle2
                size={17}
                className="mt-0.5 shrink-0 text-emerald-600"
              />

              <p className="text-sm leading-5 text-emerald-700">
                {successMessage}
              </p>
            </div>
          </div>
        )}

        {/* Signup */}

        {mode === "signup" ? (
          <form
            onSubmit={handleSignup}
            className="mt-6 space-y-4"
          >
            <div>
              <label
                htmlFor="admin-name"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Full name
              </label>

              <div className="relative">
                <UserRound
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="admin-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value
                    )
                  }
                  placeholder="Enter your full name"
                  disabled={isSubmitting}
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 disabled:bg-slate-50"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-email"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Email address
              </label>

              <div className="relative">
                <Mail
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="admin-email"
                  type="email"
                  value={invitation.email}
                  readOnly
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium text-slate-600 outline-none"
                />
              </div>

              <p className="mt-1.5 text-xs text-slate-500">
                This email is locked to the
                invitation.
              </p>
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Password
              </label>

              <div className="relative">
                <LockKeyhole
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="admin-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="Create a password"
                  disabled={isSubmitting}
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-12 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 disabled:bg-slate-50"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (current) =>
                        !current
                    )
                  }
                  disabled={isSubmitting}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:text-slate-700"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>

              <p className="mt-1.5 text-xs text-slate-500">
                Use at least 8 characters.
              </p>
            </div>

            <button
              type="submit"
              disabled={
                isSubmitting ||
                !name.trim() ||
                !password
              }
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                  Creating account...
                </>
              ) : (
                <>
                  <ShieldCheck size={17} />
                  Create Super Admin Account
                </>
              )}
            </button>
          </form>
        ) : (
          /* Existing account login */

          <form
            onSubmit={handleLogin}
            className="mt-6 space-y-4"
          >
            <div>
              <label
                htmlFor="existing-admin-email"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Email address
              </label>

              <div className="relative">
                <Mail
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="existing-admin-email"
                  type="email"
                  value={invitation.email}
                  readOnly
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium text-slate-600 outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="existing-admin-password"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Password
              </label>

              <div className="relative">
                <LockKeyhole
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="existing-admin-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="Enter your password"
                  disabled={isSubmitting}
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-12 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 disabled:bg-slate-50"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (current) =>
                        !current
                    )
                  }
                  disabled={isSubmitting}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:text-slate-700"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={
                isSubmitting ||
                !password
              }
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                  Signing in...
                </>
              ) : (
                <>
                  <ShieldCheck size={17} />
                  Continue as Super Admin
                </>
              )}
            </button>
          </form>
        )}

        {/* Security footer */}

        <div className="mt-6 border-t border-slate-200 pt-5">
          <div className="flex items-start gap-2">
            <LockKeyhole
              size={15}
              className="mt-0.5 shrink-0 text-emerald-600"
            />

            <p className="text-xs leading-5 text-slate-500">
              Your authentication is handled
              securely by Clerk. The
              administrator invitation is
              validated separately before
              Super Admin access is granted.
            </p>
          </div>
        </div>

        <Link
          href="/admin/login"
          className="mt-5 flex items-center justify-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-950"
        >
          <ArrowLeft size={15} />
          Back to Admin Login
        </Link>
      </div>
    </div>
  );
}