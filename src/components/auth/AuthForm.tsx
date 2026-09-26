"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { AuthFormState } from "@/app/(auth)/actions";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth";

interface AuthFormProps {
  mode: "login" | "signup";
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  next?: string;
}

const COPY = {
  login: {
    submit: "Sign in",
    pending: "Signing in…",
    switchText: "Don't have an account?",
    switchLabel: "Create one",
    switchHref: "/signup",
  },
  signup: {
    submit: "Create account",
    pending: "Creating account…",
    switchText: "Already have an account?",
    switchLabel: "Sign in",
    switchHref: "/login",
  },
} as const;

const INPUT_CLASS =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900";

export default function AuthForm({ mode, action, next }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, { error: null });
  const copy = COPY[mode];
  const switchHref = next
    ? `${copy.switchHref}?next=${encodeURIComponent(next)}`
    : copy.switchHref;

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-4">
        {next && <input type="hidden" name="next" value={next} />}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-zinc-700 mb-1">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={mode === "signup" ? MIN_PASSWORD_LENGTH : undefined}
            required
            className={INPUT_CLASS}
          />
          {mode === "signup" && (
            <p className="mt-1 text-xs text-zinc-400">
              At least {MIN_PASSWORD_LENGTH} characters.
            </p>
          )}
        </div>

        {state.error && (
          <p role="alert" className="text-sm text-red-600">
            {state.error}
          </p>
        )}
        {state.notice && (
          <p role="status" className="text-sm text-emerald-700">
            {state.notice}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? copy.pending : copy.submit}
        </button>
      </form>

      <p className="text-center text-sm text-zinc-500">
        {copy.switchText}{" "}
        <Link href={switchHref} className="font-medium text-zinc-900 hover:underline">
          {copy.switchLabel}
        </Link>
      </p>
    </div>
  );
}
