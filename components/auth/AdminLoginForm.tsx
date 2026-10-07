"use client";

import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
} from "lucide-react";

import {
  useAuth,
  useClerk,
  useSignIn,
} from "@clerk/nextjs";

type AdminLoginFormProps = {
  invitationToken?: string;
};

type VerificationMode =
  | "none"
  | "device_trust_email"
  | "email"
  | "totp";

function getErrorMessage(error: unknown): string {
  if (!error) {
    return "";
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error
  ) {
    const message = (
      error as {
        message?: unknown;
      }
    ).message;

    if (typeof message === "string") {
      return message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export default function AdminLoginForm({
  invitationToken = "",
}: AdminLoginFormProps) {
  const router = useRouter();

  const { isSignedIn } = useAuth();

  const { signOut } = useClerk();

  const {
    signIn,
    errors,
    fetchStatus,
  } = useSignIn();

  // =====================================================
  // FORM STATE
  // =====================================================

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  // =====================================================
  // MESSAGE STATE
  // =====================================================

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  // =====================================================
  // REDIRECT STATE
  // =====================================================

  const [isRedirecting, setIsRedirecting] =
    useState(false);

  // =====================================================
  // VERIFICATION STATE
  // =====================================================

  const [verificationCode, setVerificationCode] =
    useState("");

  const [verificationMode, setVerificationMode] =
    useState<VerificationMode>("none");

  const [
    isVerificationSubmitting,
    setIsVerificationSubmitting,
  ] = useState(false);

  // =====================================================
  // LOADING STATE
  // =====================================================

  const isLoading =
    fetchStatus === "fetching" ||
    isRedirecting;

  // =====================================================
  // ACCEPT INVITATION
  //
  // IMPORTANT:
  // This function must only be called AFTER
  // signIn.finalize() for a new login.
  // =====================================================

  async function acceptInvitation(): Promise<boolean> {
    // Normal admin login without invitation.
    if (!invitationToken) {
      return true;
    }

    try {
      const response = await fetch(
        "/api/admin/invitations/accept",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: invitationToken,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.message ??
            "Unable to accept the administrator invitation."
        );

        return false;
      }

      return true;
    } catch (error) {
      console.error(
        "ACCEPT INVITATION ERROR:",
        error
      );

      setError(
        "Unable to accept the invitation. Please try again."
      );

      return false;
    }
  }

  // =====================================================
  // FINISH LOGIN
  //
  // IMPORTANT ORDER:
  //
  // 1. Finalize Clerk session
  // 2. Accept invitation
  // 3. Redirect
  //
  // This fixes the 403 problem on another device.
  // =====================================================

  async function finishLogin(): Promise<boolean> {
    try {
      // -------------------------------------------------
      // 1. Activate/finalize the Clerk session FIRST
      // -------------------------------------------------

      await signIn.finalize();

      // -------------------------------------------------
      // 2. Now the server can identify the Clerk user
      // -------------------------------------------------

      const invitationAccepted =
        await acceptInvitation();

      if (!invitationAccepted) {
        // Do not leave the user signed in if an
        // invitation could not be accepted.
        try {
          await signOut();
        } catch (signOutError) {
          console.error(
            "SIGN OUT AFTER INVITATION ERROR:",
            signOutError
          );
        }

        return false;
      }

      // -------------------------------------------------
      // 3. Redirect only after admin setup succeeds
      // -------------------------------------------------

      setIsRedirecting(true);

      router.replace("/admin/dashboard");

      return true;
    } catch (error) {
      console.error(
        "FINISH LOGIN ERROR:",
        error
      );

      setError(
        getErrorMessage(error) ||
          "Unable to complete administrator login."
      );

      setIsRedirecting(false);

      return false;
    }
  }

  // =====================================================
  // ALREADY SIGNED-IN USER
  //
  // If there is NO invitation token, simply go to
  // dashboard.
  //
  // If there IS an invitation token, do not bypass
  // invitation acceptance.
  // =====================================================

  useEffect(() => {
    if (!isSignedIn) {
      return;
    }

    if (invitationToken) {
      return;
    }

    setIsRedirecting(true);

    router.replace("/admin/dashboard");
  }, [
    isSignedIn,
    invitationToken,
    router,
  ]);

  // =====================================================
  // CLERK STRUCTURED ERRORS
  // =====================================================

  useEffect(() => {
    const identifierError =
      errors?.fields?.identifier;

    const passwordError =
      errors?.fields?.password;

    if (
      identifierError ||
      passwordError
    ) {
      setError(
        getErrorMessage(
          identifierError ??
            passwordError
        )
      );
    }
  }, [errors]);

  // =====================================================
  // PASSWORD SIGN IN
  // =====================================================

  async function handleSignIn(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setInfo("");

    // ===================================================
    // ALREADY SIGNED IN
    // ===================================================

    if (isSignedIn) {
      if (invitationToken) {
        setIsRedirecting(true);

        const accepted =
          await acceptInvitation();

        if (!accepted) {
          setIsRedirecting(false);
          return;
        }
      }

      setIsRedirecting(true);

      router.replace("/admin/dashboard");

      return;
    }

    // ===================================================
    // VALIDATE EMAIL
    // ===================================================

    const normalizedEmail =
      email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError(
        "Please enter your admin email."
      );

      return;
    }

    // ===================================================
    // VALIDATE PASSWORD
    // ===================================================

    if (!password) {
      setError(
        "Please enter your password."
      );

      return;
    }

    try {
      // =================================================
      // CLERK CORE 3 PASSWORD SIGN-IN
      //
      // signIn.password() returns { error }
      // Status must be read from signIn.status.
      // =================================================

      const result =
        await signIn.password({
          emailAddress:
            normalizedEmail,
          password,
        });

      // =================================================
      // PASSWORD ERROR
      // =================================================

      if (result.error) {
        setError(
          getErrorMessage(
            result.error
          ) ||
            "Unable to sign in."
        );

        return;
      }

      // =================================================
      // LOGIN COMPLETED WITHOUT ADDITIONAL VERIFICATION
      // =================================================

      if (
        signIn.status === "complete"
      ) {
        await finishLogin();

        return;
      }

      // =================================================
      // NEW DEVICE / DEVICE TRUST
      //
      // This is the case shown in your earlier screenshot.
      // =================================================

      if (
        signIn.status ===
        "needs_client_trust"
      ) {
        const supportedFactors =
          signIn.supportedSecondFactors ??
          [];

        const emailFactor =
          supportedFactors.find(
            (factor) =>
              factor.strategy ===
              "email_code"
          );

        // -----------------------------------------------
        // Email verification available
        // -----------------------------------------------

        if (emailFactor) {
          const codeResult =
            await signIn.mfa.sendEmailCode();

          if (codeResult.error) {
            setError(
              getErrorMessage(
                codeResult.error
              ) ||
                "Unable to send the device verification code."
            );

            return;
          }

          setVerificationCode("");

          setVerificationMode(
            "device_trust_email"
          );

          setInfo(
            "We've sent a verification code to your email. Enter it below to verify this device."
          );

          return;
        }

        // -----------------------------------------------
        // No email verification method
        // -----------------------------------------------

        setError(
          "This device requires verification, but no email verification method is available for your account."
        );

        return;
      }

      // =================================================
      // MFA / SECOND FACTOR
      // =================================================

      if (
        signIn.status ===
        "needs_second_factor"
      ) {
        const supportedFactors =
          signIn.supportedSecondFactors ??
          [];

        // -----------------------------------------------
        // Prefer email verification
        // -----------------------------------------------

        const emailFactor =
          supportedFactors.find(
            (factor) =>
              factor.strategy ===
              "email_code"
          );

        // -----------------------------------------------
        // TOTP authenticator
        // -----------------------------------------------

        const totpFactor =
          supportedFactors.find(
            (factor) =>
              factor.strategy ===
              "totp"
          );

        // -----------------------------------------------
        // Email MFA
        // -----------------------------------------------

        if (emailFactor) {
          const codeResult =
            await signIn.mfa.sendEmailCode();

          if (codeResult.error) {
            setError(
              getErrorMessage(
                codeResult.error
              ) ||
                "Unable to send the verification code."
            );

            return;
          }

          setVerificationCode("");

          setVerificationMode(
            "email"
          );

          setInfo(
            "A verification code has been sent to your email."
          );

          return;
        }

        // -----------------------------------------------
        // TOTP MFA
        // -----------------------------------------------

        if (totpFactor) {
          setVerificationCode("");

          setVerificationMode(
            "totp"
          );

          setInfo(
            "Enter the code from your authenticator app."
          );

          return;
        }

        // -----------------------------------------------
        // Unsupported MFA
        // -----------------------------------------------

        setError(
          "Additional verification is required, but no supported verification method is available."
        );

        return;
      }

      // =================================================
      // OTHER CLERK STATES
      // =================================================

      setError(
        "Sign-in could not be completed. Please try again."
      );
    } catch (error) {
      console.error(
        "ADMIN SIGN-IN ERROR:",
        error
      );

      setError(
        getErrorMessage(error) ||
          "Unable to sign in. Please check your credentials and try again."
      );
    }
  }

  // =====================================================
  // VERIFICATION SUBMISSION
  // =====================================================

  async function handleVerificationSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const code =
      verificationCode.trim();

    if (!code) {
      setError(
        "Please enter the verification code."
      );

      return;
    }

    setError("");
    setInfo("");
    setIsVerificationSubmitting(true);

    try {
      let result;

      // =================================================
      // DEVICE TRUST EMAIL CODE
      // OR NORMAL EMAIL MFA
      // =================================================

      if (
        verificationMode ===
          "device_trust_email" ||
        verificationMode === "email"
      ) {
        result =
          await signIn.mfa.verifyEmailCode(
            {
              code,
            }
          );
      }

      // =================================================
      // TOTP
      // =================================================

      else if (
        verificationMode === "totp"
      ) {
        result =
          await signIn.mfa.verifyTOTP({
            code,
          });
      }

      // =================================================
      // INVALID STATE
      // =================================================

      else {
        setError(
          "Verification session is no longer valid. Please sign in again."
        );

        return;
      }

      // =================================================
      // VERIFICATION ERROR
      // =================================================

      if (result.error) {
        setError(
          getErrorMessage(
            result.error
          ) ||
            "Invalid verification code."
        );

        return;
      }

      // =================================================
      // VERIFY CLERK STATE
      // =================================================

      if (
        signIn.status !== "complete"
      ) {
        setError(
          "Verification was not completed. Please try again."
        );

        return;
      }

      // =================================================
      // FINALIZE → ACCEPT INVITATION → DASHBOARD
      // =================================================

      await finishLogin();
    } catch (error) {
      console.error(
        "VERIFICATION ERROR:",
        error
      );

      setError(
        getErrorMessage(error) ||
          "Unable to verify the code."
      );
    } finally {
      setIsVerificationSubmitting(
        false
      );
    }
  }

  // =====================================================
  // RESEND EMAIL CODE
  // =====================================================

  async function handleResendCode() {
    setError("");
    setInfo("");

    try {
      const result =
        await signIn.mfa.sendEmailCode();

      if (result.error) {
        setError(
          getErrorMessage(
            result.error
          ) ||
            "Unable to resend the verification code."
        );

        return;
      }

      setInfo(
        "A new verification code has been sent to your email."
      );
    } catch (error) {
      console.error(
        "RESEND CODE ERROR:",
        error
      );

      setError(
        getErrorMessage(error) ||
          "Unable to resend the verification code."
      );
    }
  }

  // =====================================================
  // SIGN OUT
  // =====================================================

  async function handleSignOut() {
    setError("");
    setInfo("");

    try {
      await signOut();

      setIsRedirecting(false);

      router.refresh();
    } catch (error) {
      console.error(
        "SIGN OUT ERROR:",
        error
      );

      setError(
        "Unable to sign out. Please refresh the page and try again."
      );
    }
  }

  // =====================================================
  // ALREADY SIGNED-IN / REDIRECT SCREEN
  // =====================================================

  if (
    isSignedIn &&
    !invitationToken
  ) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-md items-center justify-center px-4">
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 text-white">
            <ShieldCheck
              size={30}
              strokeWidth={2}
            />
          </div>

          <h1 className="mt-6 text-2xl font-bold text-slate-950">
            Checking your admin access
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            You are already signed in.
            Redirecting you to the
            SchemeSamjho Admin dashboard...
          </p>

          <div className="mt-6 flex justify-center">
            <Loader2
              className="animate-spin text-slate-700"
              size={24}
            />
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="mt-6 text-sm font-semibold text-slate-500 underline underline-offset-4 transition hover:text-slate-950"
          >
            Sign out instead
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // VERIFICATION SCREEN
  // =====================================================

  if (
    verificationMode !== "none"
  ) {
    const isDeviceTrust =
      verificationMode ===
      "device_trust_email";

    const isEmailVerification =
      verificationMode === "email" ||
      isDeviceTrust;

    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-md items-center justify-center px-4">
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          {/* ICON */}

          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <ShieldCheck
                size={30}
                strokeWidth={2}
              />
            </div>
          </div>

          {/* TITLE */}

          <h1 className="mt-6 text-center text-2xl font-bold text-slate-950">
            {isDeviceTrust
              ? "Verify this device"
              : "Verify your identity"}
          </h1>

          {/* DESCRIPTION */}

          <p className="mt-2 text-center text-sm leading-6 text-slate-500">
            {isDeviceTrust
              ? "For security, verify this new device using the code sent to your email."
              : isEmailVerification
                ? "Enter the verification code sent to your email."
                : "Enter the code from your authenticator app."}
          </p>

          {/* ERROR */}

          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
              {error}
            </div>
          )}

          {/* INFO */}

          {info && (
            <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-700">
              {info}
            </div>
          )}

          {/* FORM */}

          <form
            onSubmit={
              handleVerificationSubmit
            }
            className="mt-6 space-y-5"
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
                autoFocus
                value={verificationCode}
                onChange={(event) =>
                  setVerificationCode(
                    event.target.value
                  )
                }
                placeholder="Enter code"
                disabled={
                  isVerificationSubmitting
                }
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-center text-lg tracking-[0.3em] text-slate-950 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
            </div>

            {/* VERIFY */}

            <button
              type="submit"
              disabled={
                isVerificationSubmitting
              }
              className="flex h-12 w-full items-center justify-center rounded-xl bg-slate-950 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isVerificationSubmitting ? (
                <>
                  <Loader2
                    size={18}
                    className="mr-2 animate-spin"
                  />
                  Verifying...
                </>
              ) : (
                "Verify"
              )}
            </button>
          </form>

          {/* RESEND */}

          {isEmailVerification && (
            <button
              type="button"
              onClick={
                handleResendCode
              }
              disabled={
                isVerificationSubmitting
              }
              className="mt-5 w-full text-center text-sm font-semibold text-slate-500 transition hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Resend verification code
            </button>
          )}

          {/* BACK */}

          <button
            type="button"
            onClick={() => {
              setVerificationMode(
                "none"
              );
              setVerificationCode("");
              setError("");
              setInfo("");
            }}
            className="mt-4 w-full text-center text-sm font-semibold text-slate-500 transition hover:text-slate-950"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // NORMAL LOGIN SCREEN
  // =====================================================

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md items-center justify-center px-4">
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        {/* ICON */}

        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 text-white">
            <ShieldCheck
              size={30}
              strokeWidth={2}
            />
          </div>
        </div>

        {/* TITLE */}

        <div className="mt-6 text-center">
          <h1 className="text-3xl font-bold text-slate-950">
            Admin Login
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Sign in to access
            SchemeSamjho Admin.
          </p>
        </div>

        {/* INVITATION NOTICE */}

        {invitationToken && (
          <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-700">
            You are signing in using an
            administrator invitation.
            <br />
            <span className="font-semibold">
              Your account will receive
              Super Admin access after
              successful verification.
            </span>
          </div>
        )}

        {/* ERROR */}

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
            {error}
          </div>
        )}

        {/* INFO */}

        {info && (
          <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-700">
            {info}
          </div>
        )}

        {/* LOGIN FORM */}

        <form
          onSubmit={handleSignIn}
          className="mt-7 space-y-5"
        >
          {/* EMAIL */}

          <div>
            <label
              htmlFor="admin-email"
              className="mb-2 block text-sm font-semibold text-slate-800"
            >
              Admin email
            </label>

            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              placeholder="admin@example.com"
              disabled={isLoading}
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            />
          </div>

          {/* PASSWORD */}

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="admin-password"
                className="block text-sm font-semibold text-slate-800"
              >
                Password
              </label>

              <Link
                href="/admin/forgot-password"
                className="text-sm font-medium text-slate-500 transition hover:text-slate-950"
              >
                Forgot password?
              </Link>
            </div>

            <div className="relative">
              <input
                id="admin-password"
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
                disabled={isLoading}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pr-12 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (value) => !value
                  )
                }
                disabled={isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:text-slate-700 disabled:cursor-not-allowed"
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          {/* SIGN IN BUTTON */}

          <button
            type="submit"
            disabled={isLoading}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-slate-950 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2
                  size={18}
                  className="mr-2 animate-spin"
                />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        {/* FOOTER */}

        <div className="mt-7 border-t border-slate-200 pt-6 text-center">
          <p className="text-sm text-slate-500">
            Authorized personnel only
          </p>
        </div>
      </div>
    </div>
  );
}