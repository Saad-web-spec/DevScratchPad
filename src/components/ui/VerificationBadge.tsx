import React from "react";
import { Check, X, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type VerificationState = "idle" | "success" | "error";

interface VerificationBadgeProps {
  status: VerificationState;
  text?: string;
  className?: string;
}

export function VerificationBadge({
  status,
  text,
  className,
}: VerificationBadgeProps) {
  const config = {
    idle: {
      bg: "bg-zinc-100/90 hover:bg-zinc-100",
      text: "text-zinc-600",
      border: "border-zinc-200",
      icon: <Clock className="w-3 h-3 stroke-[2.2] shrink-0 opacity-75" />,
      defaultText: "Waiting for input",
    },
    success: {
      bg: "bg-emerald-50 hover:bg-emerald-50/80",
      text: "text-emerald-700",
      border: "border-emerald-200",
      icon: <Check className="w-3 h-3 stroke-[2.5] shrink-0 text-emerald-600" />,
      defaultText: "Verified",
    },
    error: {
      bg: "bg-rose-50 hover:bg-rose-50/80",
      text: "text-rose-700",
      border: "border-rose-200",
      icon: <X className="w-3 h-3 stroke-[2.5] shrink-0 text-rose-600" />,
      defaultText: "Mismatch",
    },
  };

  const current = config[status] || config.idle;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-sans font-medium tracking-normal border transition-colors select-none",
        current.bg,
        current.text,
        current.border,
        className
      )}
    >
      {current.icon}
      <span>{text || current.defaultText}</span>
    </span>
  );
}
