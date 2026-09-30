"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSignUp } from "@clerk/nextjs/legacy";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
} from "lucide-react";

export default function AdminSignupForm() {
  const router = useRouter();

  const {
    isLoaded,
    signUp,
    setActive,
  } = useSignUp();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [verificationStep, setVerificationStep] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignup(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!isLoaded) return;

    setError("");
    setLoading(true);

    try {
      /*
       * Create Clerk account
       */
      const signUpAttempt = await signUp.create({
        emailAddress: email,
        password,
      });

      /*
       * Save name
       */
      if (name.trim()) {
        await signUpAttempt.update({
          firstName: name.trim(),
        });
      }

      /*
       * Send email verification code
       */
      await signUpAttempt.prepareEmailAddressVerification({
        strategy: "email_code",
      });

      setVerificationStep(true);
    } catch (err: any) {
      console.error("SIGNUP ERROR:", err);

      setError(
        err?.errors?.[0]?.longMessage ||
          err?.errors?.[0]?.message ||
          "Unable to create your account."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVerification(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!isLoaded) return;

    setError("");
    setLoading(true);

    try {
      /*
       * Verify email OTP
       */
      const verificationAttempt =
        await signUp.attemptEmailAddressVerification({
          code,
        });

      /*
       * Signup complete
       */
      if (
        verificationAttempt.status ===
        "complete"
      ) {
        await setActive({
          session:
            verificationAttempt.createdSessionId,

          navigate: async ({
            session,
            decorateUrl,
          }) => {
            if (session?.currentTask) {
              console.log(
                "Pending session task:",
                session.currentTask
              );
              return;
            }

            const url = decorateUrl(
              "/admin/dashboard"
            );

            if (url.startsWith("http")) {
              window.location.href = url;
            } else {
              router.push(url);
            }
          },
        });

        return;
      }

      setError(
        "Email verified, but account setup is not complete."
      );
    } catch (err: any) {
      console.error(
        "VERIFICATION ERROR:",
        err
      );

      setError(
        err?.errors?.[0]?.longMessage ||
          err?.errors?.[0]?.message ||
          "Invalid verification code."
      );
    } finally {
      setLoading(false);
    }
  }

  async function resendCode() {
    if (!isLoaded) return;

    setError("");
    setLoading(true);

    try {
      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });
    } catch (err: any) {
      console.error("RESEND ERROR:", err);

      setError(
        err?.errors?.[0]?.longMessage ||
          err?.errors?.[0]?.message ||
          "Unable to send a new code."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4 py-10">
      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#111827]">
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>

          <h1 className="text-2xl font-bold text-[#111827]">
            SchemeSamjho Admin
          </h1>

          <p className="mt-2 text-sm text-[#64748B]">
            Create your administrator account
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-7 shadow-sm">

          {!verificationStep ? (
            <>
              {/* Heading */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-[#111827]">
                  Create account
                </h2>

                <p className="mt-1 text-sm text-[#64748B]">
                  Enter your details to continue.
                </p>
              </div>

              <form
                onSubmit={handleSignup}
                className="space-y-5"
              >

                {/* Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-medium text-[#334155]"
                  >
                    Full name
                  </label>

                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    placeholder="Your full name"
                    autoComplete="name"
                    required
                    className="w-full rounded-lg border border-[#CBD5E1] px-4 py-3 text-sm outline-none transition focus:border-[#111827] focus:ring-2 focus:ring-[#111827]/10"
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-[#334155]"
                  >
                    Email address
                  </label>

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    placeholder="admin@example.com"
                    autoComplete="email"
                    required
                    className="w-full rounded-lg border border-[#CBD5E1] px-4 py-3 text-sm outline-none transition focus:border-[#111827] focus:ring-2 focus:ring-[#111827]/10"
                  />
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium text-[#334155]"
                  >
                    Password
                  </label>

                  <div className="relative">
                    <input
                      id="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={password}
                      onChange={(e) =>
                        setPassword(e.target.value)
                      }
                      placeholder="Create a password"
                      autoComplete="new-password"
                      minLength={8}
                      required
                      className="w-full rounded-lg border border-[#CBD5E1] px-4 py-3 pr-12 text-sm outline-none transition focus:border-[#111827] focus:ring-2 focus:ring-[#111827]/10"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          !showPassword
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#111827]"
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  <p className="mt-1 text-xs text-[#94A3B8]">
                    Minimum 8 characters.
                  </p>
                </div>

                {/* CAPTCHA */}
                <div id="clerk-captcha" />

                {/* Error */}
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={
                    loading || !isLoaded
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#111827] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1F2937] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}

                  {loading
                    ? "Creating account..."
                    : "Create account"}
                </button>
              </form>

              {/* Login */}
              <div className="mt-6 border-t border-[#E2E8F0] pt-6 text-center">
                <p className="text-sm text-[#64748B]">
                  Already have an account?{" "}
                  <a
                    href="/admin/login"
                    className="font-semibold text-[#111827] hover:underline"
                  >
                    Sign in
                  </a>
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Verification */}
              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setVerificationStep(false);
                    setError("");
                  }}
                  className="mb-5 flex items-center gap-2 text-sm text-[#64748B] hover:text-[#111827]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>

                <h2 className="text-xl font-semibold text-[#111827]">
                  Verify your email
                </h2>

                <p className="mt-2 text-sm text-[#64748B]">
                  We sent a verification code to:
                </p>

                <p className="mt-1 text-sm font-semibold text-[#111827]">
                  {email}
                </p>
              </div>

              <form
                onSubmit={handleVerification}
                className="space-y-5"
              >

                {/* Code */}
                <div>
                  <label
                    htmlFor="code"
                    className="mb-2 block text-sm font-medium text-[#334155]"
                  >
                    Verification code
                  </label>

                  <input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(e) =>
                      setCode(
                        e.target.value.replace(
                          /\D/g,
                          ""
                        )
                      )
                    }
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    required
                    className="w-full rounded-lg border border-[#CBD5E1] px-4 py-3 text-center text-lg tracking-[0.4em] outline-none transition focus:border-[#111827] focus:ring-2 focus:ring-[#111827]/10"
                  />
                </div>

                {/* Error */}
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                {/* Verify */}
                <button
                  type="submit"
                  disabled={
                    loading ||
                    code.length !== 6 ||
                    !isLoaded
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#111827] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1F2937] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}

                  {loading
                    ? "Verifying..."
                    : "Verify email"}
                </button>
              </form>

              {/* Resend */}
              <button
                type="button"
                onClick={resendCode}
                disabled={loading || !isLoaded}
                className="mt-4 w-full text-sm font-medium text-[#111827] hover:underline disabled:opacity-50"
              >
                Didn't receive the code? Resend
              </button>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-[#94A3B8]">
          SchemeSamjho Admin • Authorized personnel only
        </p>
      </div>
    </main>
  );
}