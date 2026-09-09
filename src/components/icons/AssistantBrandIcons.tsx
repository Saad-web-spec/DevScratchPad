import React from "react";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number | string;
}

/**
 * Authentic Windsurf (Codeium) Wave Ribbon Logo
 * 100% transparent background, crisp vector ribbon geometry
 */
export function WindsurfIcon({ className = "w-4 h-4", size, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M3 6L7.2 17.8C7.8 19.4 9.4 20.5 11.1 20.5C12.8 20.5 14.4 19.4 15 17.8L17.5 10.8C18 9.5 19.2 8.6 20.6 8.6H21.5" />
    </svg>
  );
}

/**
 * Authentic OpenAI (ChatGPT) Rosette / Spiral Logo
 * 100% transparent background, exact 6-way spiral geometry
 */
export function OpenAIIcon({ className = "w-4 h-4", size, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      width={size}
      height={size}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1239 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813v6.7227zm1.145-1.8986l2.8764-1.656 2.8764 1.656v3.312l-2.8764 1.656-2.8764-1.656z" />
    </svg>
  );
}

/**
 * Authentic Google Gemini Sparkle Star Logo
 * 100% transparent background with authentic gradient fill
 */
export function GeminiIcon({ className = "w-4 h-4", size, ...props }: IconProps) {
  const gradientId = React.useId();
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1B73E8" />
          <stop offset="40%" stopColor="#4285F4" />
          <stop offset="75%" stopColor="#8AB4F8" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>
      </defs>
      <path
        d="M12 1.5C12 7.299 7.299 12 1.5 12C7.299 12 12 16.701 12 22.5C12 16.701 16.701 12 22.5 12C16.701 12 12 7.299 12 1.5Z"
        fill={`url(#${gradientId})`}
      />
    </svg>
  );
}

/**
 * Authentic GitHub Copilot Logo
 * 100% transparent background, official icon
 */
export function CopilotIcon({ className = "w-4 h-4", size, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      width={size}
      height={size}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.167 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.53 1.03 1.53 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  );
}

/**
 * Authentic Cursor Logo (Official Asset)
 * 100% transparent background, supports dark/light mode and white variant
 */
export function CursorIcon({
  className = "w-4 h-4",
  white,
  ...props
}: {
  className?: string;
  white?: boolean;
  [key: string]: any;
}) {
  return (
    <img
      src={white ? "/icons/cursor-white.png" : "/icons/cursor-official.png"}
      alt="Cursor"
      className={`w-4 h-4 object-contain inline-block shrink-0 ${className}`}
      {...props}
    />
  );
}

/**
 * Authentic Anthropic Claude Logo (Official Terracotta Asset)
 * 100% transparent background
 */
export function ClaudeIcon({ className = "w-4 h-4", ...props }: { className?: string; [key: string]: any }) {
  return (
    <img
      src="/icons/claude-official.png"
      alt="Claude"
      className={`w-4 h-4 object-contain inline-block shrink-0 ${className}`}
      {...props}
    />
  );
}
