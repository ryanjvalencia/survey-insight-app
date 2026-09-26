"use client";

import { useFormStatus } from "react-dom";
import { btnPrimary } from "./styles";

interface SubmitButtonProps {
  children: React.ReactNode;
  pendingLabel: string;
  className?: string;
}

/** Primary submit button that shows a spinner while its form's action runs. */
export default function SubmitButton({ children, pendingLabel, className = "" }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`${btnPrimary} ${className}`}>
      {pending ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
