"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { AuthFormState } from "@/app/(auth)/actions";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth";
import { btnPrimary, input } from "@/components/ui/styles";

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

const INPUT_CLASS = input;

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
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
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
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">
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
            <p className="mt-1 text-xs text-ink-3">
              At least {MIN_PASSWORD_LENGTH} characters.
            </p>
          )}
        </div>

        {state.error && (
          <p role="alert" className="flex animate-fade-up items-center gap-2 rounded-lg bg-critical-bg px-3 py-2 text-sm text-critical-text">
            {state.error}
          </p>
        )}
        {state.notice && (
          <p role="status" className="flex animate-fade-up items-center gap-2 rounded-lg bg-good-bg px-3 py-2 text-sm text-good-text">
            {state.notice}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className={`${btnPrimary} w-full py-2.5`}
        >
          {pending ? copy.pending : copy.submit}
        </button>
      </form>

      <p className="text-center text-sm text-ink-2">
        {copy.switchText}{" "}
        <Link href={switchHref} className="font-medium text-brand-700 hover:text-brand-800 hover:underline underline-offset-4">
          {copy.switchLabel}
        </Link>
      </p>
    </div>
  );
}
