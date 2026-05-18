"use client";

import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  className?: string;
  appName: string;
}

export interface GoogleButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  label?: string;
  loadingLabel?: string;
}

export const Button = ({ children, className, appName }: ButtonProps) => {
  return (
    <button
      className={className}
      onClick={() => alert(`Hello from your ${appName} app!`)}
    >
      {children}
    </button>
  );
};

export const GoogleButton = ({
  onClick,
  disabled = false,
  loading = false,
  className = "",
  label = "Continue with Google",
  loadingLabel = "Authenticating...",
}: GoogleButtonProps) => {
  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={onClick}
      className={`h-14 w-full rounded-xl bg-surface-container-highest/30 border border-outline-variant/20 flex items-center justify-center gap-3 text-sm font-bold text-on-surface hover:bg-surface-container-highest/50 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      <img
        alt="Google"
        className="w-5 h-5"
        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
      />
      <span>{loading ? loadingLabel : label}</span>
    </button>
  );
};
