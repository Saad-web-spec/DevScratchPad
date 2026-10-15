import { cn } from "@/lib/utils";

/**
 * Skill Graph mark: one node fanning out to two, joined by curved edges. Strokes follow
 * `currentColor`; one node is filled with `accent` (the AI Skill area's orange-600 by default).
 */
export function SkillGraphIcon({ className, title, accent = "#ea580c" }: { className?: string; title?: string; accent?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("shrink-0", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      <path d="M8 12c3.5 0 4-6 8-6" />
      <path d="M8 12c3.5 0 4 6 8 6" />
      <rect x="2" y="9" width="6" height="6" rx="1.75" />
      <rect x="16" y="3" width="6" height="6" rx="1.75" />
      <rect x="16" y="15" width="6" height="6" rx="1.75" fill={accent} stroke={accent} />
    </svg>
  );
}
