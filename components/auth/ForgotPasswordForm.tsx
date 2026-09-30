"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSignIn } from "@clerk/nextjs";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  ShieldCheck,
} from "lucide-react";

export default function ForgotPasswordForm() {
  const router = useRouter();
  const { signIn, fetchStatus } = useSignIn();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");

  const [step, setStep] = useState<
    "email" | "code" | "password"
  >("email");

  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loading = fetchStatus === "fetching";

  // -----------------------------------------
  // STEP 1: SEND RESET CODE
  // -----------------------------------------

  async function handleSendCode(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setErrorMessage("");
    setMessage("");

    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    try {
      const { error } = await signIn.create({
        identifier: email.trim(),
      });

      if (error) {
        setErrorMessage(
          error.message || "Unable to find this account."
        );
        return;
      }

      const { error: sendError } =
        await signIn.resetPasswordEmailCode.sendCode();

      if (sendError) {
        setErrorMessage(
          sendError.message ||
            "Unable to send the password reset code."
        );
        return;
      }

      setStep("code");
      setMessage(
        "A verification code has been sent to your email."
      );
    } catch (error) {
      console.error(error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    }
  }

  // -----------------------------------------
  // STEP 2: VERIFY CODE
  // -----------------------------------------

  async function handleVerifyCode(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setErrorMessage("");
    setMessage("");

    if (!code.trim()) {
      setErrorMessage("Please enter the verification code.");
      return;
    }

    try {
      const { error } =
        await signIn.resetPasswordEmailCode.verifyCode({
          code: code.trim(),
        });

      if (error) {
        setErrorMessage(
          error.message || "Invalid verification code."
        );
        return;
      }

      setStep("password");
      setMessage("Code verified successfully.");
    } catch (error) {
      console.error(error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to verify the code."
      );
    }
  }

  // -----------------------------------------
  // STEP 3: UPDATE PASSWORD
  // -----------------------------------------

  async function handlePasswordSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setErrorMessage("");
    setMessage("");

    if (password.length < 15) {
      setErrorMessage(
        "Password must be at least 15 characters."
      );
      return;
    }

    try {
      const { error } =
        await signIn.resetPasswordEmailCode.submitPassword({
          password,
          signOutOfOtherSessions: true,
        });

      if (error) {
        setErrorMessage(
          error.message || "Unable to update password."
        );
        return;
      }

      if (signIn.status === "complete") {
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

        return;
      }

      setMessage(
        "Password updated. Please sign in again."
      );

      setTimeout(() => {
        router.push("/admin/login");
      }, 1500);
    } catch (error) {
      console.error(error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update password."
      );
    }
  }

  // -----------------------------------------
  // COMMON HEADER
  // -----------------------------------------

  function Header() {
    return (
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white">
          {step === "email" && <KeyRound size={28} />}

          {step === "code" && <ShieldCheck size={28} />}

          {step === "password" && <KeyRound size={28} />}
        </div>

        <h1 className="text-2xl font-bold text-slate-900">
          {step === "email" && "Forgot password?"}

          {step === "code" && "Verify your email"}

          {step === "password" && "Create new password"}
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          {step === "email" &&
            "Enter your email and we'll send you a reset code."}

          {step === "code" &&
            "Enter the verification code sent to your email."}

          {step === "password" &&
            "Choose a new password for your admin account."}
        </p>
      </div>
    );
  }

  // -----------------------------------------
  // MAIN UI
  // -----------------------------------------

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center justify-center">
        <div className="w-full">
          <Header />

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">

            {/* MESSAGE */}
            {message && (
              <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {message}
              </div>
            )}

            {/* ERROR */}
            {errorMessage && (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {errorMessage}
              </div>
            )}

            {/* -------------------------------- */}
            {/* STEP 1 */}
            {/* -------------------------------- */}

            {step === "email" && (
              <form
                onSubmit={handleSendCode}
                className="space-y-5"
              >
                <div>
                  <label
                    htmlFor="reset-email"
                    className="mb-2 block text-sm font-semibold text-slate-800"
                  >
                    Email address
                  </label>

                  <div className="relative">
                    <Mail
                      size={19}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="reset-email"
                      type="email"
                      value={email}
                      onChange={(e) =>
                        setEmail(e.target.value)
                      }
                      placeholder="admin@example.com"
                      autoComplete="email"
                      disabled={loading}
                      required
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 pl-10 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {loading && (
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                  )}

                  {loading
                    ? "Sending code..."
                    : "Send reset code"}
                </button>
              </form>
            )}

            {/* -------------------------------- */}
            {/* STEP 2 */}
            {/* -------------------------------- */}

            {step === "code" && (
              <form
                onSubmit={handleVerifyCode}
                className="space-y-5"
              >
                <div className="text-center">
                  <p className="text-sm text-slate-500">
                    Code sent to
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {email}
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="reset-code"
                    className="mb-2 block text-sm font-semibold text-slate-800"
                  >
                    Verification code
                  </label>

                  <input
                    id="reset-code"
                    type="text"
                    inputMode="numeric"
                    value={code}
                    onChange={(e) =>
                      setCode(
                        e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 6)
                      )
                    }
                    placeholder="Enter 6-digit code"
                    autoComplete="one-time-code"
                    maxLength={6}
                    disabled={loading}
                    required
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-center text-xl tracking-[0.4em] outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {loading && (
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                  )}

                  {loading
                    ? "Verifying..."
                    : "Verify code"}
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setStep("email");
                    setCode("");
                    setMessage("");
                    setErrorMessage("");
                  }}
                  className="flex w-full items-center justify-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  <ArrowLeft size={16} />
                  Use another email
                </button>
              </form>
            )}

            {/* -------------------------------- */}
            {/* STEP 3 */}
            {/* -------------------------------- */}

            {step === "password" && (
              <form
                onSubmit={handlePasswordSubmit}
                className="space-y-5"
              >
                <div>
                  <label
                    htmlFor="new-password"
                    className="mb-2 block text-sm font-semibold text-slate-800"
                  >
                    New password
                  </label>

                  <div className="relative">
                    <input
                      id="new-password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={password}
                      onChange={(e) =>
                        setPassword(e.target.value)
                      }
                      placeholder="Enter new password"
                      autoComplete="new-password"
                      disabled={loading}
                      required
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 pr-12 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (value) => !value
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900"
                    >
                      {showPassword ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </button>
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    Password must contain at least 8
                    characters.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {loading && (
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                  )}

                  {loading
                    ? "Updating password..."
                    : "Update password"}
                </button>
              </form>
            )}

            {/* BACK TO LOGIN */}
            <div className="mt-6 border-t border-slate-200 pt-5 text-center">
              <button
                type="button"
                onClick={() =>
                  router.push("/admin/login")
                }
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft size={16} />
                Back to login
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            Authorized personnel only
          </p>
        </div>
      </div>
    </main>
  );
}