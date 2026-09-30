"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSignIn } from "@clerk/nextjs";

export default function AdminLoginForm() {
  const router = useRouter();
  const { signIn, errors, fetchStatus } = useSignIn();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");

  const [error, setError] = useState("");
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const loading = fetchStatus === "fetching";

  async function finalizeLogin() {
    await signIn.finalize({
      navigate: ({ session, decorateUrl }) => {
        if (session?.currentTask) {
          return;
        }

        const url = decorateUrl("/admin/dashboard");

        if (url.startsWith("http")) {
          window.location.href = url;
        } else {
          router.push(url);
        }
      },
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");

    const emailAddress = email.trim();

    if (!emailAddress || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      const result = await signIn.password({
        emailAddress,
        password,
      });

      if (result.error) {
        setError(
          result.error.longMessage ||
            result.error.message ||
            "Invalid email or password."
        );
        return;
      }

      if (signIn.status === "complete") {
        await finalizeLogin();
        return;
      }

      /*
       * Device Trust
       * Clerk requires an additional email verification
       * when signing in from a new/untrusted device.
       */
      if (signIn.status === "needs_client_trust") {
        const emailCodeFactor = signIn.supportedSecondFactors?.find(
          (factor) => factor.strategy === "email_code"
        );

        if (!emailCodeFactor) {
          setError(
            "Email verification is not available for this account."
          );
          return;
        }

        const emailResult = await signIn.mfa.sendEmailCode();

        if (emailResult?.error) {
          setError(
            emailResult.error.longMessage ||
              emailResult.error.message ||
              "Unable to send verification code."
          );
          return;
        }

        setVerificationRequired(true);
        setCodeSent(true);
        return;
      }

      if (signIn.status === "needs_second_factor") {
        const emailCodeFactor = signIn.supportedSecondFactors?.find(
          (factor) => factor.strategy === "email_code"
        );

        if (emailCodeFactor) {
          const emailResult = await signIn.mfa.sendEmailCode();

          if (emailResult?.error) {
            setError(
              emailResult.error.longMessage ||
                emailResult.error.message ||
                "Unable to send verification code."
            );
            return;
          }

          setVerificationRequired(true);
          setCodeSent(true);
          return;
        }

        setError(
          "Additional verification is required. Please check your Clerk authentication settings."
        );
        return;
      }

      setError("Unable to complete sign in. Please try again.");
    } catch (err) {
      console.error("Admin login error:", err);
      setError("Unable to sign in. Please try again.");
    }
  }

  async function handleVerifyCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");

    const verificationCode = code.trim();

    if (!verificationCode) {
      setError("Please enter the verification code.");
      return;
    }

    try {
      const result = await signIn.mfa.verifyEmailCode({
        code: verificationCode,
      });

      if (result.error) {
        setError(
          result.error.longMessage ||
            result.error.message ||
            "Invalid verification code."
        );
        return;
      }

      if (signIn.status === "complete") {
        await finalizeLogin();
        return;
      }

      setError("Verification was not completed. Please try again.");
    } catch (err) {
      console.error("Verification error:", err);
      setError("Unable to verify the code. Please try again.");
    }
  }

  async function resendCode() {
    setError("");

    try {
      const result = await signIn.mfa.sendEmailCode();

      if (result?.error) {
        setError(
          result.error.longMessage ||
            result.error.message ||
            "Unable to resend verification code."
        );
        return;
      }

      setCodeSent(true);
      setError("");
    } catch (err) {
      console.error("Resend code error:", err);
      setError("Unable to resend verification code.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            {verificationRequired
              ? "Verify Your Account"
              : "Admin Login"}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {verificationRequired
              ? "Enter the verification code sent to your email."
              : "Sign in to access SchemeSamjho Admin."}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {!verificationRequired ? (
          /* ================= LOGIN FORM ================= */
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Admin email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                autoComplete="email"
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </div>

            {/* Forgot password */}
            <div className="text-right">
              <Link
                href="/admin/forgot-password"
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Forgot password?
              </Link>
            </div>

            {/* Sign in */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        ) : (
          /* ================= VERIFICATION FORM ================= */
          <form onSubmit={handleVerifyCode} className="space-y-5">

            <div>
              <label
                htmlFor="code"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Verification code
              </label>

              <input
                id="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter verification code"
                maxLength={6}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-center text-lg tracking-widest outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </div>

            {codeSent && (
              <p className="text-center text-sm text-slate-500">
                A verification code has been sent to your email.
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Verifying..." : "Verify"}
            </button>

            <button
              type="button"
              onClick={resendCode}
              disabled={loading}
              className="w-full text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              I need a new code
            </button>

            <button
              type="button"
              onClick={() => {
                signIn.reset();
                setVerificationRequired(false);
                setCodeSent(false);
                setCode("");
                setError("");
              }}
              className="w-full text-sm text-slate-500 hover:text-slate-900"
            >
              Start over
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="mt-6 border-t pt-6 text-center">
          <p className="text-sm text-slate-500">
            Authorized personnel only
          </p>
        </div>
      </div>
    </main>
  );
}