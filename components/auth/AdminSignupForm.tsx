"use client";

import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ShieldCheck } from "lucide-react";

import {
  useAuth,
  useClerk,
  useSignIn,
  useSignUp,
} from "@clerk/nextjs";

type InvitationData = {
  id: string;
  email: string;
  role: "super_admin";
  expiresAt: string;
};

type SignupMode = "signup" | "login";

type VerificationMode =
  | "none"
  | "signup_email"
  | "login_email"
  | "login_totp";

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

export default function AdminSignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();

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

  const token =
    searchParams.get("token")?.trim() ?? "";

  // =====================================================
  // INVITATION
  // =====================================================

  const [invitation, setInvitation] =
    useState<InvitationData | null>(null);

  const [isValidating, setIsValidating] =
    useState(true);

  // =====================================================
  // FORM
  // =====================================================

  const [mode, setMode] =
    useState<SignupMode>("signup");

  const [name, setName] = useState("");
  const [password, setPassword] =
    useState("");

  // =====================================================
  // VERIFICATION
  // =====================================================

  const [
    verificationMode,
    setVerificationMode,
  ] = useState<VerificationMode>("none");

  const [verificationCode, setVerificationCode] =
    useState("");

  const [
    isVerificationSubmitting,
    setIsVerificationSubmitting,
  ] = useState(false);

  // =====================================================
  // MESSAGES
  // =====================================================

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  // =====================================================
  // REDIRECT
  // =====================================================

  const [isRedirecting, setIsRedirecting] =
    useState(false);

  const isLoading =
    isValidating ||
    signUpFetchStatus === "fetching" ||
    signInFetchStatus === "fetching" ||
    isRedirecting;

  // =====================================================
  // VALIDATE INVITATION
  // =====================================================

  useEffect(() => {
    let cancelled = false;

    async function validateInvitation() {
      if (!token) {
        if (!cancelled) {
          setError(
            "This invitation link is missing its invitation token."
          );
          setIsValidating(false);
        }

        return;
      }

      try {
        setIsValidating(true);
        setError("");

        const response = await fetch(
          "/api/admin/invitations/validate",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              token,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok || !data.valid) {
          if (!cancelled) {
            setError(
              data.message ??
                "This invitation is invalid or expired."
            );
            setInvitation(null);
          }

          return;
        }

        if (!cancelled) {
          setInvitation(
            data.invitation
          );
        }
      } catch (error) {
        console.error(
          "VALIDATE INVITATION ERROR:",
          error
        );

        if (!cancelled) {
          setError(
            "Unable to validate this invitation."
          );
        }
      } finally {
        if (!cancelled) {
          setIsValidating(false);
        }
      }
    }

    void validateInvitation();

    return () => {
      cancelled = true;
    };
  }, [token]);

  // =====================================================
  // ACCEPT INVITATION
  //
  // IMPORTANT:
  // Clerk session must already be finalized.
  // =====================================================

  async function acceptInvitation(): Promise<boolean> {
    try {
      const response = await fetch(
        "/api/admin/invitations/accept",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            name: name.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.message ??
            "Unable to activate your administrator account."
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
        "Unable to activate your administrator account."
      );

      return false;
    }
  }

  // =====================================================
  // COMPLETE LOGIN / SIGNUP
  //
  // 1. finalize Clerk session
  // 2. accept invitation
  // 3. redirect
  // =====================================================

  async function finishAuthentication() {
    try {
      await (
        mode === "signup"
          ? signUp.finalize()
          : signIn.finalize()
      );

      const accepted =
        await acceptInvitation();

      if (!accepted) {
        try {
          await signOut();
        } catch (signOutError) {
          console.error(
            "SIGN OUT ERROR:",
            signOutError
          );
        }

        return false;
      }

      setIsRedirecting(true);

      router.replace(
        "/admin/dashboard"
      );

      return true;
    } catch (error) {
      console.error(
        "FINISH AUTHENTICATION ERROR:",
        error
      );

      setError(
        getErrorMessage(error) ||
          "Unable to complete administrator registration."
      );

      setIsRedirecting(false);

      return false;
    }
  }

  // =====================================================
  // SIGN UP
  // =====================================================

  async function handleSignup(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setInfo("");

    if (!invitation) {
      setError(
        "The invitation is not valid."
      );
      return;
    }

    if (!name.trim()) {
      setError(
        "Please enter your name."
      );
      return;
    }

    if (password.length < 8) {
      setError(
        "Password must contain at least 8 characters."
      );
      return;
    }

    try {
      const result =
        await signUp.create({
          emailAddress:
            invitation.email,
          password,
        });

      if (result.error) {
        setError(
          getErrorMessage(
            result.error
          ) ||
            "Unable to create your account."
        );

        return;
      }

      // =================================================
      // SEND EMAIL VERIFICATION
      // =================================================

      const verificationResult =
        await signUp.verifications.sendEmailCode();

      if (verificationResult.error) {
        setError(
          getErrorMessage(
            verificationResult.error
          ) ||
            "Unable to send the email verification code."
        );

        return;
      }

      setVerificationCode("");
      setVerificationMode(
        "signup_email"
      );

      setInfo(
        "We've sent a verification code to your invited email address."
      );
    } catch (error) {
      console.error(
        "ADMIN SIGNUP ERROR:",
        error
      );

      setError(
        getErrorMessage(error) ||
          "Unable to create your administrator account."
      );
    }
  }

  // =====================================================
  // EXISTING CLERK ACCOUNT LOGIN
  // =====================================================

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setInfo("");

    if (!invitation) {
      setError(
        "The invitation is not valid."
      );
      return;
    }

    if (!password) {
      setError(
        "Please enter your password."
      );
      return;
    }

    try {
      const result =
        await signIn.password({
          emailAddress:
            invitation.email,
          password,
        });

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
      // COMPLETE
      // =================================================

      if (
        signIn.status === "complete"
      ) {
        await finishAuthentication();
        return;
      }

      // =================================================
      // NEW DEVICE
      // =================================================

      if (
        signIn.status ===
        "needs_client_trust"
      ) {
        const emailFactor =
          (
            signIn.supportedSecondFactors ??
            []
          ).find(
            (factor) =>
              factor.strategy ===
              "email_code"
          );

        if (!emailFactor) {
          setError(
            "This device requires verification, but email verification is unavailable."
          );

          return;
        }

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
          "login_email"
        );

        setInfo(
          "We've sent a verification code to your email to verify this device."
        );

        return;
      }

      // =================================================
      // SECOND FACTOR
      // =================================================

      if (
        signIn.status ===
        "needs_second_factor"
      ) {
        const factors =
          signIn.supportedSecondFactors ??
          [];

        const emailFactor =
          factors.find(
            (factor) =>
              factor.strategy ===
              "email_code"
          );

        const totpFactor =
          factors.find(
            (factor) =>
              factor.strategy ===
              "totp"
          );

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
            "login_email"
          );

          setInfo(
            "A verification code has been sent to your email."
          );

          return;
        }

        if (totpFactor) {
          setVerificationCode("");

          setVerificationMode(
            "login_totp"
          );

          setInfo(
            "Enter the code from your authenticator app."
          );

          return;
        }
      }

      setError(
        "Additional verification is required to continue."
      );
    } catch (error) {
      console.error(
        "INVITED USER LOGIN ERROR:",
        error
      );

      setError(
        getErrorMessage(error) ||
          "Unable to sign in."
      );
    }
  }

  // =====================================================
  // SIGNUP EMAIL VERIFICATION
  // =====================================================

  async function verifySignupEmail() {
    try {
      const result =
        await signUp.verifications.verifyEmailCode(
          {
            code: verificationCode.trim(),
          }
        );

      if (result.error) {
        setError(
          getErrorMessage(
            result.error
          ) ||
            "Invalid verification code."
        );

        return;
      }

      if (
        signUp.status !== "complete"
      ) {
        setError(
          "Email verification was not completed."
        );

        return;
      }

      await finishAuthentication();
    } catch (error) {
      console.error(
        "SIGNUP EMAIL VERIFICATION ERROR:",
        error
      );

      setError(
        getErrorMessage(error) ||
          "Unable to verify your email."
      );
    }
  }

  // =====================================================
  // LOGIN VERIFICATION
  // =====================================================

  async function verifyLoginCode() {
    try {
      const code =
        verificationCode.trim();

      let result;

      if (
        verificationMode ===
        "login_totp"
      ) {
        result =
          await signIn.mfa.verifyTOTP({
            code,
          });
      } else {
        result =
          await signIn.mfa.verifyEmailCode(
            {
              code,
            }
          );
      }

      if (result.error) {
        setError(
          getErrorMessage(
            result.error
          ) ||
            "Invalid verification code."
        );

        return;
      }

      if (
        signIn.status !== "complete"
      ) {
        setError(
          "Verification was not completed."
        );

        return;
      }

      await finishAuthentication();
    } catch (error) {
      console.error(
        "LOGIN VERIFICATION ERROR:",
        error
      );

      setError(
        getErrorMessage(error) ||
          "Unable to verify the code."
      );
    }
  }

  // =====================================================
  // VERIFICATION SUBMIT
  // =====================================================

  async function handleVerification(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setInfo("");

    if (!verificationCode.trim()) {
      setError(
        "Please enter the verification code."
      );

      return;
    }

    setIsVerificationSubmitting(true);

    try {
      if (
        verificationMode ===
        "signup_email"
      ) {
        await verifySignupEmail();
      } else {
        await verifyLoginCode();
      }
    } finally {
      setIsVerificationSubmitting(
        false
      );
    }
  }

  // =====================================================
  // RESEND CODE
  // =====================================================

  async function resendCode() {
    setError("");
    setInfo("");

    try {
      if (
        verificationMode ===
        "signup_email"
      ) {
        const result =
          await signUp.verifications.sendEmailCode();

        if (result.error) {
          setError(
            getErrorMessage(
              result.error
            )
          );

          return;
        }
      } else {
        const result =
          await signIn.mfa.sendEmailCode();

        if (result.error) {
          setError(
            getErrorMessage(
              result.error
            )
          );

          return;
        }
      }

      setInfo(
        "A new verification code has been sent."
      );
    } catch (error) {
      setError(
        getErrorMessage(error) ||
          "Unable to resend the verification code."
      );
    }
  }

  // =====================================================
  // ALREADY SIGNED IN
  // =====================================================

  if (
    isSignedIn &&
    !isRedirecting &&
    verificationMode === "none"
  ) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-md items-center justify-center px-4">
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 text-white">
            <ShieldCheck
              size={30}
            />
          </div>

          <h1 className="mt-6 text-2xl font-bold text-slate-950">
            Already signed in
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Please sign out before using
            an administrator invitation.
          </p>

          <button
            type="button"
            onClick={async () => {
              await signOut();
              router.refresh();
            }}
            className="mt-6 h-11 w-full rounded-xl bg-slate-950 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // LOADING INVITATION
  // =====================================================

  if (isValidating) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-md items-center justify-center px-4">
        <div className="text-center">
          <Loader2
            className="mx-auto animate-spin text-slate-700"
            size={32}
          />

          <p className="mt-4 text-sm text-slate-500">
            Validating invitation...
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // INVALID INVITATION
  // =====================================================

  if (!invitation) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-md items-center justify-center px-4">
        <div className="w-full rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <ShieldCheck
              size={30}
            />
          </div>

          <h1 className="mt-6 text-2xl font-bold text-slate-950">
            Invalid invitation
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            {error ||
              "This administrator invitation is no longer valid."}
          </p>

          <Link
            href="/admin/login"
            className="mt-6 flex h-11 items-center justify-center rounded-xl bg-slate-950 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Go to Admin Login
          </Link>
        </div>
      </div>
    );
  }

  // =====================================================
  // VERIFICATION PAGE
  // =====================================================

  if (
    verificationMode !== "none"
  ) {
    const isSignup =
      verificationMode ===
      "signup_email";

    const isTotp =
      verificationMode ===
      "login_totp";

    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-md items-center justify-center px-4">
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <ShieldCheck
                size={30}
              />
            </div>
          </div>

          <h1 className="mt-6 text-center text-2xl font-bold text-slate-950">
            {isSignup
              ? "Verify your email"
              : isTotp
                ? "Verify your identity"
                : "Verify this device"}
          </h1>

          <p className="mt-2 text-center text-sm leading-6 text-slate-500">
            {isSignup
              ? `Enter the verification code sent to ${invitation.email}.`
              : isTotp
                ? "Enter the code from your authenticator app."
                : "Enter the verification code sent to your email to verify this device."}
          </p>

          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {info && (
            <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              {info}
            </div>
          )}

          <form
            onSubmit={handleVerification}
            className="mt-6 space-y-5"
          >
            <input
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
              placeholder="Enter verification code"
              className="h-12 w-full rounded-xl border border-slate-200 px-4 text-center text-lg tracking-[0.3em] outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />

            <button
              type="submit"
              disabled={
                isVerificationSubmitting
              }
              className="flex h-12 w-full items-center justify-center rounded-xl bg-slate-950 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
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

          {!isTotp && (
            <button
              type="button"
              onClick={resendCode}
              className="mt-5 w-full text-sm font-semibold text-slate-500 hover:text-slate-950"
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
              setVerificationCode("");
              setError("");
              setInfo("");
            }}
            className="mt-4 w-full text-sm font-semibold text-slate-500 hover:text-slate-950"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // MAIN INVITATION PAGE
  // =====================================================

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md items-center justify-center px-4">
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        {/* ICON */}

        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 text-white">
            <ShieldCheck
              size={30}
            />
          </div>
        </div>

        {/* TITLE */}

        <h1 className="mt-6 text-center text-3xl font-bold text-slate-950">
          {mode === "signup"
            ? "Join SchemeSamjho Admin"
            : "Admin Sign In"}
        </h1>

        <p className="mt-2 text-center text-sm leading-6 text-slate-500">
          You have been invited to become
          a SchemeSamjho Super Admin.
        </p>

        {/* INVITATION EMAIL */}

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Invited email
          </p>

          <p className="mt-1 break-all text-sm font-semibold text-slate-900">
            {invitation.email}
          </p>
        </div>

        {/* ROLE */}

        <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
            Administrator role
          </p>

          <p className="mt-1 text-sm font-bold text-blue-900">
            Super Admin
          </p>

          <p className="mt-1 text-xs leading-5 text-blue-700">
            This invitation grants full
            SchemeSamjho Admin access.
          </p>
        </div>

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

        {/* =================================================
            SIGNUP FORM
        ================================================= */}

        {mode === "signup" && (
          <form
            onSubmit={handleSignup}
            className="mt-7 space-y-5"
          >
            {/* NAME */}

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
                autoComplete="name"
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value
                  )
                }
                placeholder="Enter your name"
                disabled={isLoading}
                className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50"
              />
            </div>

            {/* PASSWORD */}

            <div>
              <label
                htmlFor="admin-password"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Create password
              </label>

              <input
                id="admin-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                placeholder="At least 8 characters"
                disabled={isLoading}
                className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50"
              />
            </div>

            {/* CREATE ACCOUNT */}

            <button
              type="submit"
              disabled={isLoading}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-slate-950 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2
                    size={18}
                    className="mr-2 animate-spin"
                  />
                  Creating account...
                </>
              ) : (
                "Create Super Admin Account"
              )}
            </button>
          </form>
        )}

        {/* =================================================
            LOGIN FORM
        ================================================= */}

        {mode === "login" && (
          <form
            onSubmit={handleLogin}
            className="mt-7 space-y-5"
          >
            <div>
              <label
                htmlFor="existing-admin-password"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Password
              </label>

              <input
                id="existing-admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                placeholder="Enter your password"
                disabled={isLoading}
                className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-slate-950 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
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
                "Sign in & Accept Invitation"
              )}
            </button>
          </form>
        )}

        {/* =================================================
            MODE SWITCH
        ================================================= */}

        <div className="mt-7 border-t border-slate-200 pt-6 text-center">
          {mode === "signup" ? (
            <p className="text-sm text-slate-500">
              Already have a Clerk account?
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setPassword("");
                  setError("");
                  setInfo("");
                }}
                className="ml-1 font-semibold text-slate-950 underline underline-offset-4"
              >
                Sign in
              </button>
            </p>
          ) : (
            <p className="text-sm text-slate-500">
              Don't have an account?
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setPassword("");
                  setError("");
                  setInfo("");
                }}
                className="ml-1 font-semibold text-slate-950 underline underline-offset-4"
              >
                Create account
              </button>
            </p>
          )}
        </div>

        {/* SECURITY NOTICE */}

        <div className="mt-5 text-center">
          <p className="text-xs leading-5 text-slate-400">
            This invitation is secure, time-limited,
            and can only be used with the invited
            email address.
          </p>
        </div>
      </div>
    </div>
  );
}