import {
  ArrowRightLeft,
  Atom,
  Binary,
  Box,
  Braces,
  CalendarClock,
  Clock,
  Database,
  Dices,
  FileCheck,
  FileCode,
  FileType,
  GitCompare,
  Hash,
  IdCard,
  KeyRound,
  KeySquare,
  ListChecks,
  LockKeyhole,
  Minimize2,
  Network,
  Regex,
  ShieldCheck,
  Signature,
  Terminal,
  Waypoints,
  Wrench,
  type LucideIcon,
} from "lucide-react";

/**
 * One lucide glyph per workspace tool, keyed by sidebar/tab id (aliases included).
 * Shared by the sidebar, the tab strip and the mobile drawer so a tool always shows the same icon.
 * Each tool gets a distinct glyph; only one tool family (the three cURL converters) shares one.
 */
export const TOOL_ICONS: Readonly<Record<string, LucideIcon>> = {
  // Formatters & validators
  "json-formatter": Braces,
  "json-validator": Braces,
  "json-schema-validator": FileCheck,
  "xml-formatter": FileCode,
  "sql-formatter": Database,
  "graphql-formatter": Waypoints,
  minifier: Minimize2,
  // Generators & mocks
  "mock-data-generator": Dices,
  "uuid-generator": IdCard,
  // Security & cryptography
  jwt: KeyRound,
  "base64-inspector": Binary,
  base64: Binary,
  hash: Hash,
  "hmac-generator": Signature,
  "password-hash": LockKeyhole,
  bcrypt: LockKeyhole,
  "cert-decoder": ShieldCheck,
  x509: ShieldCheck,
  "ssh-key-generator": KeySquare,
  "ssh-keygen": KeySquare,
  // Code & type converters
  "json-to-ts": FileType,
  "json-to-zod": ListChecks,
  "json-to-go": Box,
  yaml: ArrowRightLeft,
  "yaml-to-json": ArrowRightLeft,
  "json-to-yaml": ArrowRightLeft,
  "curl-to-fetch": Terminal,
  "curl-to-javascript": Terminal,
  "curl-to-python": Terminal,
  "curl-to-go": Terminal,
  "svg-to-jsx": Atom,
  // Time, network & utilities
  "epoch-converter": Clock,
  regex: Regex,
  diff: GitCompare,
  cron: CalendarClock,
  "cidr-calculator": Network,
};

/** Icon for a tool id, with a neutral fallback for ids that have no dedicated glyph yet. */
export function getToolIcon(id: string): LucideIcon {
  return TOOL_ICONS[id] ?? Wrench;
}

/** Shared icon sizing for chrome icons: 16px, 1.75 stroke. */
export const ICON_STROKE = 1.75;
