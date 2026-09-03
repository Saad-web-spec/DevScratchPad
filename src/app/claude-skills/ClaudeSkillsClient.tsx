"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  Copy,
  Check,
  Download,
  ShieldCheck,
  Zap,
  Terminal,
  Layers,
  BookOpen,
  CheckCircle2,
  RefreshCw,
  Cpu,
  Settings2,
  Sliders,
  FolderGit2,
  UploadCloud,
  Archive,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { downloadAiKitZip } from "./lib/zipExporter";
import { ManifestImportModal } from "./components/ManifestImportModal";
import { ParsedManifestResult } from "./lib/manifestParser";

// Dynamically import Monaco Editor to prevent SSR issues
const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-full text-zinc-400 bg-zinc-900 font-mono text-xs gap-2">
      <RefreshCw className="w-5 h-5 animate-spin text-orange-400" />
      <span>Loading editor...</span>
    </div>
  ),
});

// Format Types
type OutputFormat = "skill_md" | "claude_md" | "cursor_mdc" | "agents_md";

// Preset Definition
interface SkillPreset {
  id: string;
  name: string;
  badge: string;
  title: string;
  slug: string;
  description: string;
  role: string;
  framework: string;
  language: string;
  styling: string;
  database: string;
  philosophy: "pragmatic" | "modern" | "strict" | "vibe" | "architect";
  behaviors: string[];
  conventions: string[];
  procedures: string;
  customDirectives: string;
  exampleGood: string;
  exampleBad: string;
}

const PRESETS: SkillPreset[] = [
  {
    id: "cursor-mdc-pro",
    name: "Cursor .mdc Pro",
    badge: "Cursor Rules",
    title: "Cursor Modular Rulebook (.mdc)",
    slug: "cursor-rules-pro",
    description:
      "Modern .cursor/rules/*.mdc configuration for Cursor IDE. Enforces modular scoping with globs, surgical diffs, guard clauses, and strict zero-any type safety.",
    role: "Cursor Systems Architect",
    framework: "Next.js / React / TypeScript",
    language: "TypeScript 5.x",
    styling: "Tailwind CSS",
    database: "PostgreSQL / Supabase",
    philosophy: "modern",
    behaviors: ["inspect-first", "minimal-diffs", "concise-direct", "verification-driven", "preserve-style"],
    conventions: ["guard-clauses", "feature-colocated", "result-types", "typed-schemas"],
    procedures: `1. Inspect active file context and target globs before proposing edits.
2. Deliver surgical, focused diffs rather than re-outputting entire files.
3. Enforce strict TypeScript typing: avoid loose 'any' or unsafe type assertions.
4. Adhere to existing repository naming conventions, quote styles, and directory idioms.
5. Provide actionable verification commands and test steps with every modification.`,
    customDirectives: `- Keep responses direct, dense, and code-first with minimal conversational filler.
- Never modify unrequested files or remove unrelated comments.
- Always implement explicit error handling for asynchronous code paths.`,
    exampleGood: `// Good: Surgical, strictly typed handler with early exit
export async function getSessionUser(req: Request): Promise<User | null> {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  return verifySessionToken(token);
}`,
    exampleBad: `// Discouraged: Loose any types and nested conditionals
export async function getSession(req: any) {
  if (req) {
    if (req.headers) {
      return req.headers.auth;
    }
  }
  return null;
}`,
  },
  {
    id: "claude-auditor",
    name: "Codebase Auditor",
    badge: "Claude Code Skill",
    title: "Codebase Health & Security Auditor",
    slug: "codebase-auditor",
    description:
      "Audit codebases for structural health, dead code, security vulnerabilities, performance regressions, and architectural anti-patterns. Use when asked to evaluate, review, or refactor code.",
    role: "Senior Security & Systems Auditor",
    framework: "Framework Agnostic",
    language: "TypeScript / Polyglot",
    styling: "None / Irrelevant",
    database: "None / Irrelevant",
    philosophy: "architect",
    behaviors: ["inspect-first", "minimal-diffs", "concise-direct", "verification-driven", "dependency-caution"],
    conventions: ["guard-clauses", "result-types", "self-documenting", "typed-schemas"],
    procedures: `1. Scan directory structure and parse manifest files (package.json, Cargo.toml, go.mod) to identify stack idioms.
2. Trace critical execution flows to identify unhandled errors, memory leaks, and unauthenticated endpoints.
3. Check for exposed secrets, sensitive environment variables, or unsafe deserialization patterns.
4. Categorize findings into: [CRITICAL] Security, [HIGH] Performance, [MEDIUM] Architecture, [LOW] Style.
5. Propose surgical, minimal refactoring patches with before/after rationale.`,
    customDirectives: `- Never modify production code without explaining risk level.
- Always provide reproducible proof-of-concept steps for discovered issues.
- Preserve existing comments, docstrings, and license headers.`,
    exampleGood: `// Good: Explicit error handling with structured result
export async function fetchAccount(id: string): Promise<Result<Account, AccountError>> {
  if (!isValidId(id)) return { ok: false, error: new InvalidIdError(id) };
  try {
    const data = await db.account.findUnique({ where: { id } });
    if (!data) return { ok: false, error: new NotFoundError(id) };
    return { ok: true, value: data };
  } catch (err) {
    return { ok: false, error: new DatabaseError(err) };
  }
}`,
    exampleBad: `// Discouraged: Swallowed errors, loose types, and hidden mutations
export async function getAccount(id: any) {
  try {
    return await db.account.findUnique({ where: { id } });
  } catch (e) {
    console.log(e);
    return null;
  }
}`,
  },
  {
    id: "nextjs-pro",
    name: "Next.js 15 Fullstack",
    badge: "Web App",
    title: "Next.js 15 App Router & Server Actions Specialist",
    slug: "nextjs-fullstack-pro",
    description:
      "Production guidelines for Next.js App Router. Enforces React Server Components (RSC) by default, Server Actions for mutations with Zod validation, and Tailwind CSS v4 styling.",
    role: "Lead Fullstack Next.js Engineer",
    framework: "Next.js 15 (App Router)",
    language: "TypeScript 5.x",
    styling: "Tailwind CSS v4",
    database: "PostgreSQL / Prisma / Drizzle",
    philosophy: "pragmatic",
    behaviors: ["inspect-first", "minimal-diffs", "concise-direct", "verification-driven", "preserve-style"],
    conventions: ["rsc-first", "feature-colocated", "guard-clauses", "typed-schemas", "strict-a11y"],
    procedures: `1. Fetch data directly in React Server Components; never introduce 'use client' for purely read-only views.
2. Isolate client interactivity to leaf components (buttons, dropdowns, forms) with strict props interfaces.
3. Encapsulate data mutations inside Server Actions, validating input with Zod schemas before running database queries.
4. Manage transient UI state with React 19 hooks (useActionState, useOptimistic) and searchParams for URL sync.
5. Provide dedicated loading.tsx skeletons and error.tsx error boundaries for all dynamic route segments.`,
    customDirectives: `- Banned: Do not use pages/ router conventions or old getServerSideProps.
- Keep client bundles minimal; never import server libraries into client components.
- Use Next/Image for optimized media with explicit width/height or fill.`,
    exampleGood: `// Good: Server Action with Zod validation and safe error return
"use server";
import { z } from "zod";
import { db } from "@/lib/db";

const Schema = z.object({ email: z.string().email(), name: z.string().min(2) });

export async function createUserAction(formData: FormData) {
  const parsed = Schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: parsed.error.flatten().fieldErrors };
  await db.user.create({ data: parsed.data });
  return { ok: true };
}`,
    exampleBad: `// Discouraged: Unvalidated client-side mutation with inline API call
"use client";
export function SubmitUser() {
  const submit = async (data: any) => {
    await fetch("/api/users", { method: "POST", body: JSON.stringify(data) });
  };
  return <button onClick={submit}>Save</button>;
}`,
  },
  {
    id: "react-spa",
    name: "React 19 SPA",
    badge: "Frontend",
    title: "React 19 + TypeScript SPA Specialist",
    slug: "react-modern-spa",
    description:
      "Modern React 19 SPA standards. Prioritizes custom hooks, TanStack Query for server state caching, Vite bundling, and avoiding redundant useEffect cycles.",
    role: "Senior Frontend Engineer",
    framework: "React 19 (Vite)",
    language: "TypeScript",
    styling: "Tailwind CSS",
    database: "REST / GraphQL API",
    philosophy: "modern",
    behaviors: ["inspect-first", "minimal-diffs", "concise-direct", "preserve-style"],
    conventions: ["feature-colocated", "guard-clauses", "self-documenting", "strict-a11y"],
    procedures: `1. Separate server state (handled via TanStack Query/SWR) from local ephemeral UI state (useState).
2. Avoid redundant useEffect calls; calculate derived state synchronously during render or with useMemo where heavy.
3. Colocate component files: MyComponent.tsx, useMyComponent.ts, MyComponent.test.tsx in the same folder.
4. Use standard semantic HTML tags and test keyboard accessibility for all custom interactive controls.`,
    customDirectives: `- Prefer functional components with named exports.
- Do not use React.FC typing; declare props interface explicitly.
- Extract complex component logic into dedicated custom hooks.`,
    exampleGood: `// Good: Derived state computed directly during render
export function FilteredList({ items, query }: { items: Item[]; query: string }) {
  const filtered = useMemo(
    () => items.filter((item) => item.name.toLowerCase().includes(query.toLowerCase())),
    [items, query]
  );
  return <ul>{filtered.map(item => <li key={item.id}>{item.name}</li>)}</ul>;
}`,
    exampleBad: `// Discouraged: Redundant useEffect triggering cascading re-renders
export function BadFilteredList({ items, query }: any) {
  const [filtered, setFiltered] = useState([]);
  useEffect(() => {
    setFiltered(items.filter((i: any) => i.name.includes(query)));
  }, [items, query]);
  return <ul>{filtered.map((item: any) => <li key={item.id}>{item.name}</li>)}</ul>;
}`,
  },
  {
    id: "fastapi-ai",
    name: "FastAPI & AI Agent",
    badge: "Backend",
    title: "Python FastAPI & AI Agent Service Architecture",
    slug: "fastapi-ai-backend",
    description:
      "Production standards for Python 3.12+, FastAPI, async I/O, Pydantic v2 schemas, LangChain/LlamaIndex integration, and defensive error propagation.",
    role: "Senior AI Systems Backend Engineer",
    framework: "FastAPI",
    language: "Python 3.12+",
    styling: "None / API Service",
    database: "PostgreSQL / pgvector / Redis",
    philosophy: "strict",
    behaviors: ["inspect-first", "minimal-diffs", "concise-direct", "dependency-caution", "verification-driven"],
    conventions: ["clean-layered", "guard-clauses", "result-types", "typed-schemas"],
    procedures: `1. Define all request and response schemas strictly using Pydantic v2 BaseModels with Field validation.
2. Use asynchronous route handlers (async def) for any network I/O, LLM inference calls, or database operations.
3. Manage database sessions and external clients using FastAPI Depends injection.
4. Structure the repository into: api/ (routes), services/ (business logic), core/ (config), models/ (schemas).
5. Catch domain-specific exceptions at the service layer and translate to HTTPException at the route layer.`,
    customDirectives: `- Never hardcode OpenAI/Anthropic API keys or secrets in source code.
- Always implement streaming responses for LLM text generation endpoints.
- Type annotate all function arguments and return types.`,
    exampleGood: `# Good: Typed Pydantic v2 request with dependency injection
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

router = APIRouter()

class PromptRequest(BaseModel):
    query: str = Field(..., min_length=3, max_length=1000)
    temperature: float = Field(0.7, ge=0.0, le=1.0)

@router.post("/v1/generate", response_model=GenerationResponse)
async def generate(req: PromptRequest, svc: AIService = Depends(get_ai_service)):
    result = await svc.process_prompt(req.query, req.temperature)
    if not result.is_ok:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=result.error_msg)
    return result.payload`,
    exampleBad: `# Discouraged: Untyped dict params and missing error handling
@app.post("/generate")
def generate(data: dict):
    result = client.chat(data["query"])
    return result`,
  },
  {
    id: "vibe-coder",
    name: "Pragmatic Vibe Coder",
    badge: "High Velocity",
    title: "High-Velocity Pragmatic Builder",
    slug: "pragmatic-vibe-builder",
    description:
      "High-speed developer instructions. Prioritizes immediate working solutions, readable standard code over abstract architecture, and minimal ceremony.",
    role: "Pragmatic Full-Stack Maker",
    framework: "Any / Auto-Detect",
    language: "TypeScript / Python / Go",
    styling: "Tailwind CSS",
    database: "SQLite / Supabase",
    philosophy: "vibe",
    behaviors: ["concise-direct", "minimal-diffs", "preserve-style"],
    conventions: ["guard-clauses", "flat-pragmatic", "self-documenting"],
    procedures: `1. Implement the simplest, most direct solution that solves the user's immediate requirement.
2. Avoid premature optimization, unnecessary design patterns, and excessive micro-utilities.
3. Write clean, flat, readable code that can be easily modified or deleted later.
4. Keep feedback loops fast: verify functionality directly with immediate execution.`,
    customDirectives: `- Do not over-engineer solutions or create layers of indirection.
- Prefer readable, explicit code over clever one-liners.
- When in doubt, deliver working software first.`,
    exampleGood: `// Good: Simple, direct function doing exactly what is needed
export async function getActiveUsers() {
  const users = await db.users.findMany({ where: { active: true } });
  return users.map(u => ({ id: u.id, name: u.name }));
}`,
    exampleBad: `// Discouraged: 5 layers of abstraction for a simple select query
export class UserQueryFactoryProviderService {
  constructor(private repo: IUserRepository) {}
  async executeQueryWithFilterStrategy<T>(filter: FilterStrategy<T>) {
    return this.repo.getTransformedEntities(filter);
  }
}`,
  },
  {
    id: "security-guard",
    name: "Security Guard",
    badge: "Claude Code Skill",
    title: "Security & Zero-Trust Vulnerability Guard",
    slug: "security-vulnerability-guard",
    description:
      "Specialist skill for identifying security vulnerabilities, API key leaks, SQL injection, XSS attack surfaces, and insecure deserialization.",
    role: "Principal Security Architect",
    framework: "Framework Agnostic",
    language: "Polyglot",
    styling: "None / Irrelevant",
    database: "PostgreSQL / MySQL / NoSQL",
    philosophy: "architect",
    behaviors: ["inspect-first", "minimal-diffs", "concise-direct", "dependency-caution", "verification-driven"],
    conventions: ["guard-clauses", "result-types", "typed-schemas"],
    procedures: `1. Inspect environment variables and secrets; ensure no sensitive tokens or private keys are exposed client-side.
2. Verify all user inputs are sanitized and parameterized before reaching database queries or system shells.
3. Audit authentication boundaries, JWT signature validations, session expiration, and CORS/CSRF headers.
4. Check for Insecure Direct Object References (IDOR) on all mutating operations.
5. Provide actionable remediation steps and automated regression tests for every flagged security flaw.`,
    customDirectives: `- Flag any dynamic SQL concatenation as CRITICAL vulnerability.
- Ensure all public endpoints are rate-limited or protected by CSRF tokens where appropriate.
- Verify safe serialization; ban untrusted eval, pickle.loads, or dangerous innerHTML injection.`,
    exampleGood: `// Good: Parameterized query avoiding SQL injection
const user = await db.query(
  "SELECT id, username, email FROM users WHERE id = $1 AND tenant_id = $2",
  [userId, tenantId]
);`,
    exampleBad: `// Discouraged: String interpolation causing SQL injection vulnerability
const user = await db.query(
  \`SELECT * FROM users WHERE id = '\${userId}'\`
);`,
  },
];

// Philosophy metadata
const PHILOSOPHIES = [
  {
    id: "pragmatic",
    title: "Pragmatic & Flexible",
    desc: "Simplicity and readability over clever abstraction. Follow YAGNI: don't build until needed.",
    color: "border-blue-200 bg-blue-50/50 text-blue-800",
  },
  {
    id: "modern",
    title: "Modern Balanced",
    desc: "Clean interfaces, pragmatic typing, sensible defaults, and modular design.",
    color: "border-emerald-200 bg-emerald-50/50 text-emerald-800",
  },
  {
    id: "strict",
    title: "Strict & Defensive",
    desc: "Zero `any`, strict null safety, explicit return types, and schema boundary validation.",
    color: "border-purple-200 bg-purple-50/50 text-purple-800",
  },
  {
    id: "vibe",
    title: "Vibe Coder (High Speed)",
    desc: "High-velocity maker mode: immediate working solutions, fast iteration, minimal ceremony.",
    color: "border-amber-200 bg-amber-50/50 text-amber-800",
  },
  {
    id: "architect",
    title: "Senior Architect",
    desc: "Explain trade-offs, plan for scale, prioritize security, and document design decisions.",
    color: "border-zinc-300 bg-zinc-100 text-zinc-900",
  },
];

// Agent Behaviors
const BEHAVIOR_OPTIONS = [
  {
    id: "inspect-first",
    label: "Inspect Before Acting",
    desc: "Always read and understand existing code and imports before suggesting changes.",
  },
  {
    id: "minimal-diffs",
    label: "Minimal Surgical Diffs",
    desc: "Touch only lines relevant to prompt. Preserve existing comments and formatting.",
  },
  {
    id: "concise-direct",
    label: "Concise & Direct Tone",
    desc: "Skip conversational pleasantries. Deliver clean code and targeted rationale.",
  },
  {
    id: "dependency-caution",
    label: "Dependency Caution",
    desc: "Never introduce new third-party libraries or packages without explicit approval.",
  },
  {
    id: "verification-driven",
    label: "Propose Verification Steps",
    desc: "With every modification, specify concrete commands or tests to verify correctness.",
  },
  {
    id: "preserve-style",
    label: "Preserve Codebase Idioms",
    desc: "Match existing naming conventions, indentation, and directory patterns.",
  },
];

// Code Conventions
const CONVENTION_OPTIONS = [
  {
    id: "guard-clauses",
    label: "Guard Clauses & Early Returns",
    desc: "Exit early from functions to eliminate deeply nested if-else pyramids.",
  },
  {
    id: "rsc-first",
    label: "Server Components (RSC) First",
    desc: "Default to React Server Components; keep client components confined to leaves.",
  },
  {
    id: "feature-colocated",
    label: "Feature-Colocated Structure",
    desc: "Group components, hooks, tests, and utils inside domain feature folders.",
  },
  {
    id: "clean-layered",
    label: "Clean Layered Architecture",
    desc: "Decouple presentation, business logic, and data access layers via interfaces.",
  },
  {
    id: "flat-pragmatic",
    label: "Flat & Pragmatic Layout",
    desc: "Keep directory nesting minimal (max 2-3 levels) to avoid navigation friction.",
  },
  {
    id: "result-types",
    label: "Explicit Result / Tuple Returns",
    desc: "Return [error, result] or Result<T, E> types for operations that can fail.",
  },
  {
    id: "typed-schemas",
    label: "Schema-Driven Boundaries",
    desc: "Validate all external data (API, forms, env) with Zod or Pydantic schemas.",
  },
  {
    id: "self-documenting",
    label: "Self-Documenting Naming",
    desc: "Expressive function and variable names over verbose redundant comments.",
  },
  {
    id: "strict-a11y",
    label: "Accessible UI by Default",
    desc: "Enforce semantic HTML, keyboard navigability, and proper ARIA roles.",
  },
];

export function ClaudeSkillsClient() {
  const [isMounted, setIsMounted] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string>("claude-auditor");
  const [format, setFormat] = useState<OutputFormat>("skill_md");
  const [copied, setCopied] = useState(false);

  // Form State
  const [skillName, setSkillName] = useState("codebase-auditor");
  const [skillTitle, setSkillTitle] = useState("Codebase Health & Security Auditor");
  const [description, setDescription] = useState(
    "Audit codebases for structural health, dead code, security vulnerabilities, performance regressions, and architectural anti-patterns. Use when asked to evaluate, review, or refactor code."
  );
  const [role, setRole] = useState("Senior Security & Systems Auditor");
  const [framework, setFramework] = useState("Next.js 15 (App Router)");
  const [language, setLanguage] = useState("TypeScript 5.x");
  const [styling, setStyling] = useState("Tailwind CSS v4");
  const [database, setDatabase] = useState("PostgreSQL / Prisma");
  const [philosophy, setPhilosophy] = useState<"pragmatic" | "modern" | "strict" | "vibe" | "architect">("architect");
  const [behaviors, setBehaviors] = useState<string[]>([
    "inspect-first",
    "minimal-diffs",
    "concise-direct",
    "verification-driven",
    "dependency-caution",
  ]);
  const [conventions, setConventions] = useState<string[]>([
    "guard-clauses",
    "result-types",
    "self-documenting",
    "typed-schemas",
  ]);
  const [procedures, setProcedures] = useState(
    `1. Scan directory structure and parse manifest files (package.json, Cargo.toml, go.mod) to identify stack idioms.\n2. Trace critical execution flows to identify unhandled errors, memory leaks, and unauthenticated endpoints.\n3. Check for exposed secrets, sensitive environment variables, or unsafe deserialization patterns.\n4. Categorize findings into: [CRITICAL] Security, [HIGH] Performance, [MEDIUM] Architecture, [LOW] Style.\n5. Propose surgical, minimal refactoring patches with before/after rationale.`
  );
  const [customDirectives, setCustomDirectives] = useState(
    `- Never modify production code without explaining risk level.\n- Always provide reproducible proof-of-concept steps for discovered issues.\n- Preserve existing comments, docstrings, and license headers.`
  );
  const [exampleGood, setExampleGood] = useState(
    `// Good: Explicit error handling with structured result\nexport async function fetchAccount(id: string): Promise<Result<Account, AccountError>> {\n  if (!isValidId(id)) return { ok: false, error: new InvalidIdError(id) };\n  try {\n    const data = await db.account.findUnique({ where: { id } });\n    if (!data) return { ok: false, error: new NotFoundError(id) };\n    return { ok: true, value: data };\n  } catch (err) {\n    return { ok: false, error: new DatabaseError(err) };\n  }\n}`
  );
  const [exampleBad, setExampleBad] = useState(
    `// Discouraged: Swallowed errors, loose types, and hidden mutations\nexport async function getAccount(id: any) {\n  try {\n    return await db.account.findUnique({ where: { id } });\n  } catch (e) {\n    console.log(e);\n    return null;\n  }\n}`
  );

  // Advanced Runtime Controls & Direct Editor Editing
  const [globPattern, setGlobPattern] = useState("**/*");
  const [alwaysApply, setAlwaysApply] = useState(false);
  const [editorContent, setEditorContent] = useState<string>("");
  const [isManuallyEdited, setIsManuallyEdited] = useState(false);
  const [lastAutoSaved, setLastAutoSaved] = useState<string | null>(null);
  const [isManifestModalOpen, setIsManifestModalOpen] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);

  // LocalStorage state restore on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ai-skill-studio-state");
      if (saved) {
        const s = JSON.parse(saved);
        if (s.skillName) setSkillName(s.skillName);
        if (s.skillTitle) setSkillTitle(s.skillTitle);
        if (s.description) setDescription(s.description);
        if (s.role) setRole(s.role);
        if (s.framework) setFramework(s.framework);
        if (s.language) setLanguage(s.language);
        if (s.styling) setStyling(s.styling);
        if (s.database) setDatabase(s.database);
        if (s.philosophy) setPhilosophy(s.philosophy);
        if (Array.isArray(s.behaviors)) setBehaviors(s.behaviors);
        if (Array.isArray(s.conventions)) setConventions(s.conventions);
        if (s.procedures) setProcedures(s.procedures);
        if (s.customDirectives) setCustomDirectives(s.customDirectives);
        if (s.exampleGood) setExampleGood(s.exampleGood);
        if (s.exampleBad) setExampleBad(s.exampleBad);
        if (s.format) setFormat(s.format);
        if (s.globPattern) setGlobPattern(s.globPattern);
        if (typeof s.alwaysApply === "boolean") setAlwaysApply(s.alwaysApply);
        if (s.editorContent && s.isManuallyEdited) {
          setEditorContent(s.editorContent);
          setIsManuallyEdited(true);
        }
      }
    } catch {}
    setIsMounted(true);
  }, []);

  // Debounced LocalStorage Auto-Save
  useEffect(() => {
    if (!isMounted) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          "ai-skill-studio-state",
          JSON.stringify({
            skillName,
            skillTitle,
            description,
            role,
            framework,
            language,
            styling,
            database,
            philosophy,
            behaviors,
            conventions,
            procedures,
            customDirectives,
            exampleGood,
            exampleBad,
            format,
            globPattern,
            alwaysApply,
            editorContent,
            isManuallyEdited,
          })
        );
        const now = new Date();
        setLastAutoSaved(
          now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
        );
      } catch {}
    }, 500);
    return () => clearTimeout(timer);
  }, [
    isMounted,
    skillName,
    skillTitle,
    description,
    role,
    framework,
    language,
    styling,
    database,
    philosophy,
    behaviors,
    conventions,
    procedures,
    customDirectives,
    exampleGood,
    exampleBad,
    format,
    globPattern,
    alwaysApply,
    editorContent,
    isManuallyEdited,
  ]);

  // Apply Preset with Intelligent Format Auto-Switch
  const handleApplyPreset = (preset: SkillPreset) => {
    setSelectedPresetId(preset.id);
    setSkillName(preset.slug);
    setSkillTitle(preset.title);
    setDescription(preset.description);
    setRole(preset.role);
    setFramework(preset.framework);
    setLanguage(preset.language);
    setStyling(preset.styling);
    setDatabase(preset.database);
    setPhilosophy(preset.philosophy);
    setBehaviors(preset.behaviors);
    setConventions(preset.conventions);
    setProcedures(preset.procedures);
    setCustomDirectives(preset.customDirectives);
    setExampleGood(preset.exampleGood);
    setExampleBad(preset.exampleBad);

    // Auto-switch format according to preset runtime
    if (preset.id === "cursor-mdc-pro") {
      setFormat("cursor_mdc");
      setGlobPattern("**/*");
      setAlwaysApply(false);
    } else if (preset.id === "claude-auditor" || preset.id === "security-guard") {
      setFormat("skill_md");
    }

    // Reset manual edit flag so the preset content takes over immediately
    setIsManuallyEdited(false);
  };

  // Apply parsed manifest metadata to studio
  const handleApplyManifest = (manifest: ParsedManifestResult) => {
    if (manifest.framework) setFramework(manifest.framework);
    if (manifest.language) setLanguage(manifest.language);
    if (manifest.styling) setStyling(manifest.styling);
    if (manifest.database) setDatabase(manifest.database);
    if (manifest.suggestedRole) setRole(manifest.suggestedRole);
    if (manifest.suggestedSkillName) setSkillName(manifest.suggestedSkillName);
    setIsManuallyEdited(false);
  };

  // Toggle checkbox helper
  const toggleItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, id: string) => {
    setList((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  // Context-Aware Synthesis Engine (Option 3: Reads all 12 form fields)
  const synthesizeFromContext = () => {
    const philObj = PHILOSOPHIES.find((p) => p.id === philosophy);

    // 1. Philosophy Mission Matrix
    const missionByPhilosophy: Record<string, string> = {
      strict: "enforces zero-tolerance for untyped 'any', strict null-safety, defensive type boundaries, and schema validation",
      modern: "balances clean architectural abstractions with pragmatic delivery, modular cohesion, and sensible defaults",
      pragmatic: "prioritizes clean, readable, maintainable code over clever micro-abstractions, abiding strictly by YAGNI",
      vibe: "optimizes for rapid iteration, flat direct implementations, and fast working feedback loops with minimal ceremony",
      architect: "evaluates long-term trade-offs, scales cleanly, documents architectural decisions, and secures system boundaries",
    };

    // Filter relevant tech stack items
    const stackItems = [
      framework && framework !== "Framework Agnostic" && framework !== "Any / Auto-Detect" ? framework : "",
      language && language !== "Polyglot" ? language : "",
      styling && !styling.toLowerCase().includes("none") ? styling : "",
      database && !database.toLowerCase().includes("none") ? database : "",
    ].filter(Boolean);

    const stackLabel = stackItems.length > 0 ? stackItems.join(" • ") : "modern development environments";

    // Format-tailored trigger text
    let triggerClause = "";
    if (format === "cursor_mdc") {
      triggerClause = `Scoped to target files matching active globs (${globPattern || "**/*"}).`;
    } else if (format === "skill_md") {
      triggerClause = `Activated automatically when tasks involve ${framework || "system"} development, auditing, or refactoring.`;
    } else if (format === "claude_md") {
      triggerClause = "Loaded at session initialization to govern all repository workflows.";
    } else {
      triggerClause = `Orchestrates autonomous agents executing within ${stackLabel}.`;
    }

    const behaviorClauses: string[] = [];
    if (behaviors.includes("inspect-first")) {
      behaviorClauses.push("Always inspects existing codebase patterns and manifest configs before proposing changes.");
    }
    if (behaviors.includes("dependency-caution")) {
      behaviorClauses.push("Blocks unapproved third-party dependencies.");
    }

    const synthesizedDescription = [
      `Specialized ${role || "Autonomous Assistant"} configured for ${stackLabel}.`,
      `This configuration ${missionByPhilosophy[philosophy] || "applies disciplined engineering standards"}.`,
      triggerClause,
      ...behaviorClauses,
    ].join(" ");

    // 2. Multi-Step Procedures derived from Conventions & Stack
    const steps: string[] = [];

    // Step 1: Inspection
    if (behaviors.includes("inspect-first")) {
      steps.push(
        "1. Context Inspection: Read active directory layout, package manifests, and existing code idioms prior to proposing changes."
      );
    } else {
      steps.push(`1. Discovery & Analysis: Examine requirements and map affected components within ${framework || "the codebase"}.`);
    }

    // Step 2: Architecture
    const archClauses: string[] = [];
    if (conventions.includes("rsc-first") && (framework.toLowerCase().includes("next") || framework.toLowerCase().includes("react"))) {
      archClauses.push("default to Server Components (RSC) and keep client interactivity confined to leaf components");
    }
    if (conventions.includes("clean-layered")) {
      archClauses.push("separate concerns cleanly between route handlers, domain services, and data access layers");
    }
    if (conventions.includes("feature-colocated")) {
      archClauses.push("colocate components, hooks, tests, and types inside domain feature folders");
    }
    if (conventions.includes("flat-pragmatic")) {
      archClauses.push("keep folder nesting shallow (max 2-3 levels) to avoid navigational friction");
    }
    if (archClauses.length > 0) {
      steps.push(`2. Architectural Alignment: Structure implementation to ${archClauses.join("; ")}.`);
    } else {
      steps.push("2. Architectural Planning: Design clean interfaces and avoid unnecessary abstraction layers.");
    }

    // Step 3: Execution & Code Quality
    const codeClauses: string[] = [];
    if (conventions.includes("typed-schemas")) {
      codeClauses.push("validate all external inputs, requests, and environment variables with strict schemas");
    }
    if (conventions.includes("guard-clauses")) {
      codeClauses.push("leverage guard clauses and early returns to eliminate nested branches");
    }
    if (conventions.includes("result-types")) {
      codeClauses.push("return explicit Result tuples or typed error objects instead of swallowing exceptions");
    }
    if (behaviors.includes("minimal-diffs")) {
      codeClauses.push("produce surgical, targeted diffs preserving unrelated code and comments");
    }
    if (codeClauses.length > 0) {
      steps.push(`3. Implementation Standards: Ensure that you ${codeClauses.join(", ")}.`);
    } else {
      steps.push("3. Focused Implementation: Write clean, idiomatic code adhering to existing repository formatting.");
    }

    // Step 4: Verification
    if (behaviors.includes("verification-driven")) {
      steps.push(
        "4. Verification & Quality Gates: Run automated tests, linting, and typecheck commands. Provide explicit manual verification steps for runtime behavior."
      );
    } else {
      steps.push("4. Validation: Verify that modified files compile cleanly without regression or unresolved imports.");
    }

    // 3. Custom Directives
    const directives: string[] = [];
    if (philosophy === "strict") {
      directives.push("- Banned: Never use loose 'any', 'as unknown as T', or disable TypeScript compiler warnings.");
    }
    if (behaviors.includes("dependency-caution")) {
      directives.push("- Dependency Rule: Do not install external libraries without explicit user confirmation.");
    }
    if (behaviors.includes("concise-direct")) {
      directives.push("- Communication: Keep commentary brief, code-focused, and free of conversational filler.");
    }
    if (behaviors.includes("preserve-style")) {
      directives.push("- Style Preservation: Mirror existing quote styles, indentations, and naming idioms.");
    }
    if (database && !database.toLowerCase().includes("none")) {
      directives.push(`- Database Hygiene: Use parameterized queries with ${database}; prevent injection and credential leaks.`);
    }
    directives.push("- Security: All secrets, API keys, and environment tokens must remain strictly server-side.");

    setDescription(synthesizedDescription);
    setProcedures(steps.join("\n"));
    setCustomDirectives(directives.join("\n"));

    // Reset manual edit flag so newly synthesized template appears in editor
    setIsManuallyEdited(false);
  };

  // Language tag deduction for syntax-highlighted code blocks
  const langTag = useMemo(() => {
    const l = (language || "").toLowerCase();
    if (l.includes("typescript") || l.includes("tsx")) return "typescript";
    if (l.includes("javascript") || l.includes("jsx")) return "javascript";
    if (l.includes("python")) return "python";
    if (l.includes("go")) return "go";
    if (l.includes("rust")) return "rust";
    if (l.includes("shell") || l.includes("bash")) return "bash";
    return "ts";
  }, [language]);

  // Generated Content Builder for any target runtime format
  const buildContent = useCallback(
    (targetFormat: OutputFormat) => {
      const philObj = PHILOSOPHIES.find((p) => p.id === philosophy);

      const selectedBehaviorTexts = behaviors
        .map((bId) => BEHAVIOR_OPTIONS.find((b) => b.id === bId))
        .filter(Boolean)
        .map((b) => `- **${b!.label}**: ${b!.desc}`);

      const selectedConventionTexts = conventions
        .map((cId) => CONVENTION_OPTIONS.find((c) => c.id === cId))
        .filter(Boolean)
        .map((c) => `- **${c!.label}**: ${c!.desc}`);

      if (targetFormat === "skill_md") {
        // Anthropic Claude Code / Antigravity SKILL.md specification
        return `---
name: ${skillName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-") || "custom-skill"}
description: ${description.trim().replace(/\n+/g, " ")}
---

# ${skillTitle.trim() || "Claude Skill Instructions"}

## 1. Overview & Role
You are operating as a **${role}**.
- **Philosophy**: ${philObj?.title} — ${philObj?.desc}
- **Stack**: ${framework} • ${language} • ${styling} • ${database}

## 2. Core Execution Procedures
Follow this structured step-by-step workflow when this skill is active:
${procedures.trim() || "- Execute standard domain workflow."}

## 3. Code Conventions & Architectural Standards
${selectedConventionTexts.length > 0 ? selectedConventionTexts.join("\n") : "- Follow standard idiomatic language conventions."}

## 4. Agent Behavioral Guardrails
${selectedBehaviorTexts.length > 0 ? selectedBehaviorTexts.join("\n") : "- Exercise standard engineering discretion."}

${
  customDirectives.trim()
    ? `## 5. Project-Specific Directives & Constraints
${customDirectives.trim()}
`
    : ""
}${
        exampleGood.trim() || exampleBad.trim()
          ? `## 6. Implementation Reference

### Preferred Patterns
\`\`\`${langTag}
${exampleGood.trim()}
\`\`\`

### Discouraged Anti-Patterns
\`\`\`${langTag}
${exampleBad.trim()}
\`\`\`
`
          : ""
}## 7. Verification & Quality Gates
Before concluding any task:
1. Verify that all modified files compile and satisfy strict type checking.
2. Ensure no unnecessary files or artifacts were created.
3. Confirm that error paths return meaningful messages without leaking sensitive internals.
`;
      }

      if (targetFormat === "claude_md") {
        // Anthropic Project Root CLAUDE.md specification
        return `# ${skillTitle.trim() || "Project Instructions"}

<project_context>
${description.trim()}

- Primary Role: ${role}
- Philosophy: ${philObj?.title} (${philObj?.desc})
</project_context>

<tech_stack>
- Framework: ${framework}
- Language: ${language}
- Styling: ${styling}
- Database: ${database}
</tech_stack>

<workflows_and_procedures>
${procedures.trim()}
</workflows_and_procedures>

<conventions>
${selectedConventionTexts.length > 0 ? selectedConventionTexts.join("\n") : "- Follow idiomatic conventions."}
</conventions>

<agent_guardrails>
${selectedBehaviorTexts.length > 0 ? selectedBehaviorTexts.join("\n") : "- Practice defensive engineering."}
</agent_guardrails>
${
  customDirectives.trim()
    ? `
<custom_directives>
${customDirectives.trim()}
</custom_directives>
`
    : ""
}${
  exampleGood.trim() || exampleBad.trim()
    ? `
<implementation_reference>
### Preferred Patterns
\`\`\`${langTag}
${exampleGood.trim()}
\`\`\`

### Discouraged Anti-Patterns
\`\`\`${langTag}
${exampleBad.trim()}
\`\`\`
</implementation_reference>
`
    : ""
}
<verification_protocol>
- Run automated tests or linting before reporting completion.
- Provide clear verification steps for UI or runtime behavior.
</verification_protocol>
`;
      }

      if (targetFormat === "cursor_mdc") {
        // Modern Cursor .cursor/rules/*.mdc format
        return `---
description: "${description.trim().replace(/"/g, '\\"')}"
globs: [${JSON.stringify(globPattern.trim() || "**/*")}]
alwaysApply: ${alwaysApply}
---

# ${skillTitle.trim() || "Cursor Rule Directives"}

You are acting as: **${role}**.
Engineering Philosophy: **${philObj?.title}** (${philObj?.desc})

## Tech Stack Context
- **Framework**: ${framework}
- **Language**: ${language}
- **Styling**: ${styling}
- **Database / Data**: ${database}

## Execution Procedures
${procedures.trim()}

## Code Conventions
${selectedConventionTexts.length > 0 ? selectedConventionTexts.join("\n") : "- Follow clean code standards."}

## Agent Directives
${selectedBehaviorTexts.length > 0 ? selectedBehaviorTexts.join("\n") : "- Deliver concise, tested code."}
${
  customDirectives.trim()
    ? `
## Specific Project Constraints
${customDirectives.trim()}
`
    : ""
}${
  exampleGood.trim() || exampleBad.trim()
    ? `
## Implementation Reference

### Preferred Patterns
\`\`\`${langTag}
${exampleGood.trim()}
\`\`\`

### Discouraged Anti-Patterns
\`\`\`${langTag}
${exampleBad.trim()}
\`\`\`
`
    : ""
}`;
      }

      // AGENTS.md format
      return `<!-- BEGIN:agent-rules -->
# AI Agent Specification: ${skillTitle.trim() || "Core Rules"}

## Role & Mission
Act as **${role}**.
Philosophy: ${philObj?.title} — ${philObj?.desc}

## Target Architecture
- Stack: ${framework} | ${language} | ${styling} | ${database}

## Standard Operating Procedures
${procedures.trim()}

## Architectural Directives
${selectedConventionTexts.length > 0 ? selectedConventionTexts.join("\n") : "- Follow standard conventions."}

## Operational Guardrails
${selectedBehaviorTexts.length > 0 ? selectedBehaviorTexts.join("\n") : "- Exercise standard precision."}
${
  customDirectives.trim()
    ? `
## Mandatory Project Rules
${customDirectives.trim()}
`
    : ""
}${
  exampleGood.trim() || exampleBad.trim()
    ? `
## Reference Implementations

### Preferred Pattern
\`\`\`${langTag}
${exampleGood.trim()}
\`\`\`

### Anti-Pattern
\`\`\`${langTag}
${exampleBad.trim()}
\`\`\`
`
    : ""
}
<!-- END:agent-rules -->
`;
    },
    [
      philosophy,
      behaviors,
      conventions,
      skillName,
      skillTitle,
      description,
      role,
      framework,
      language,
      styling,
      database,
      procedures,
      customDirectives,
      exampleGood,
      exampleBad,
      globPattern,
      alwaysApply,
      langTag,
    ]
  );

  // Active template generation based on format tab
  const generatedContent = useMemo(() => buildContent(format), [buildContent, format]);

  // Synchronize generated content to editorContent when not manually overridden
  useEffect(() => {
    if (!isManuallyEdited) {
      setEditorContent(generatedContent);
    }
  }, [generatedContent, isManuallyEdited]);

  // Active content being viewed/copied/downloaded
  const activeContent = isManuallyEdited ? editorContent : generatedContent;


  // Export Complete AI Workspace Suite as ZIP
  const handleExportZip = async () => {
    setIsExportingZip(true);
    try {
      await downloadAiKitZip({
        skillName,
        skillTitle,
        cursorRulesContent: format === "cursor_mdc" && isManuallyEdited ? editorContent : buildContent("cursor_mdc"),
        skillMdContent: format === "skill_md" && isManuallyEdited ? editorContent : buildContent("skill_md"),
        claudeMdContent: format === "claude_md" && isManuallyEdited ? editorContent : buildContent("claude_md"),
        agentsMdContent: format === "agents_md" && isManuallyEdited ? editorContent : buildContent("agents_md"),
        framework,
        language,
      });
    } catch (err) {
      console.error("Failed to export zip", err);
    } finally {
      setIsExportingZip(false);
    }
  };

  // Copy handler
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Download handler
  const handleDownload = () => {
    let filename = "SKILL.md";
    if (format === "claude_md") filename = "CLAUDE.md";
    if (format === "cursor_mdc") filename = `${skillName || "rule"}.mdc`;
    if (format === "agents_md") filename = "AGENTS.md";

    const blob = new Blob([activeContent], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Get file name indicator
  const currentFileName = useMemo(() => {
    if (format === "skill_md") return "SKILL.md";
    if (format === "claude_md") return "CLAUDE.md";
    if (format === "cursor_mdc") return `.cursor/rules/${skillName || "rule"}.mdc`;
    return "AGENTS.md";
  }, [format, skillName]);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3 text-zinc-400">
          <div className="w-9 h-8 flex items-center justify-center animate-pulse">
            <img src="/ai-skill-icon.png" alt="Loading" className="w-8 h-6 object-contain" />
          </div>
          <span className="text-xs font-medium text-zinc-500">Loading AI Skill Studio...</span>
        </div>
      </div>
    );
  }

  return (
    <div suppressHydrationWarning className="min-h-screen bg-zinc-50 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-zinc-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          {/* Left: Back button & Title */}
          <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
            <Link
              href="/workspace"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 transition-all border border-zinc-200/80 active:scale-95 shrink-0"
              title="Open Developer Tools Workspace"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Developer Tools Workspace</span>
            </Link>

            <div className="h-4 w-px bg-zinc-200 shrink-0 hidden sm:block" />

            <div className="flex items-center gap-2 truncate">
              <img src="/ai-skill-icon.png" alt="AI Skill Studio" className="w-6 h-5 object-contain shrink-0" />
              <h1 className="text-sm sm:text-base font-bold text-zinc-900 tracking-tight truncate">
                AI Skill Studio
              </h1>
            </div>
          </div>

          {/* Right: Status Indicators (without cursor symbol) */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold bg-zinc-900 text-white rounded-full border border-zinc-800 shadow-xs">
              <span>Cursor .mdc + Claude Ready</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full shadow-xs">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> 100% Client-Side
            </span>
          </div>
        </div>

        {/* Quick Presets Sub-Bar */}
        <div className="border-t border-zinc-100 bg-zinc-50/90 px-4 sm:px-6 py-1.5 overflow-x-auto no-scrollbar">
          <div className="max-w-7xl mx-auto flex items-center gap-2">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Zap className="w-3 h-3 text-zinc-800" /> Presets:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              {PRESETS.map((preset) => {
                const isActive = selectedPresetId === preset.id;
                const isCursorPreset = preset.id === "cursor-mdc-pro";
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleApplyPreset(preset)}
                    className={cn(
                      "px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-all flex items-center gap-1.5 border max-w-[180px] overflow-hidden",
                      isActive
                        ? isCursorPreset
                          ? "bg-black text-white border-black shadow-xs font-semibold"
                          : "bg-orange-50 text-orange-800 border-orange-300/80 shadow-xs font-semibold"
                        : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 hover:text-zinc-900"
                    )}
                  >
                    {isCursorPreset && <img src="/cursor-icon.png" className="w-3 h-3 object-contain shrink-0" alt="Cursor" />}
                    <span className="truncate">{preset.name}</span>
                    <span
                      className={cn(
                        "text-[9px] px-1 py-px rounded font-mono shrink-0",
                        isActive
                          ? isCursorPreset
                            ? "bg-zinc-800 text-zinc-200"
                            : "bg-orange-200/60 text-orange-900"
                          : "bg-zinc-100 text-zinc-500"
                      )}
                    >
                      {preset.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Area: Split Screen */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Generator Controls (7 cols on large) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Format Selector Card */}
          <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2.5 block flex items-center justify-between">
              <span>Target Standard & File Format</span>
              <span className="text-[10px] text-zinc-400 font-normal">Select AI runtime</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => setFormat("cursor_mdc")}
                className={cn(
                  "p-2.5 rounded-lg border text-left transition-all flex flex-col gap-1",
                  format === "cursor_mdc"
                    ? "border-black bg-zinc-950 text-white shadow-sm ring-1 ring-black"
                    : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
                )}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs">
                  <img src="/cursor-icon.png" alt="Cursor" className="w-3.5 h-3.5 object-contain" />
                  <span>.cursorrules</span>
                </div>
                <span className={cn("text-[10px] leading-tight", format === "cursor_mdc" ? "text-zinc-400" : "text-zinc-500")}>
                  Cursor .mdc Rules
                </span>
              </button>

              <button
                onClick={() => setFormat("skill_md")}
                className={cn(
                  "p-2.5 rounded-lg border text-left transition-all flex flex-col gap-1",
                  format === "skill_md"
                    ? "border-orange-500 bg-orange-50/60 text-orange-950 shadow-xs ring-1 ring-orange-500/20"
                    : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
                )}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs">
                  <img src="/ai-skill-icon.png" alt="Claude" className="w-3.5 h-3.5 object-contain" />
                  <span>SKILL.md</span>
                </div>
                <span className="text-[10px] text-zinc-500 leading-tight">Claude Code / Agent Skill</span>
              </button>

              <button
                onClick={() => setFormat("claude_md")}
                className={cn(
                  "p-2.5 rounded-lg border text-left transition-all flex flex-col gap-1",
                  format === "claude_md"
                    ? "border-amber-500 bg-amber-50/60 text-amber-950 shadow-xs ring-1 ring-amber-500/20"
                    : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
                )}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs">
                  <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                  <span>CLAUDE.md</span>
                </div>
                <span className="text-[10px] text-zinc-500 leading-tight">Project Root Guidelines</span>
              </button>

              <button
                onClick={() => setFormat("agents_md")}
                className={cn(
                  "p-2.5 rounded-lg border text-left transition-all flex flex-col gap-1",
                  format === "agents_md"
                    ? "border-emerald-600 bg-emerald-50/60 text-emerald-950 shadow-xs ring-1 ring-emerald-600/20"
                    : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
                )}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs">
                  <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                  <span>AGENTS.md</span>
                </div>
                <span className="text-[10px] text-zinc-500 leading-tight">Multi-Agent Systems</span>
              </button>
            </div>
          </div>

          {/* Cursor Rule Scope Card (Visible only when format is cursor_mdc) */}
          {format === "cursor_mdc" && (
            <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <FolderGit2 className="w-4 h-4 text-zinc-900" />
                  <h3 className="text-sm font-bold text-zinc-900">Cursor Rule Scope</h3>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono">.cursor/rules/*.mdc</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700">File Glob Pattern</label>
                  <input
                    type="text"
                    value={globPattern}
                    onChange={(e) => setGlobPattern(e.target.value)}
                    placeholder="e.g. src/app/**/*.tsx or **/*"
                    className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
                  />
                  <p className="text-[10px] text-zinc-400">Scopes rule to matching files. Use **/* for global workspace scope.</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700">Always Apply Behavior</label>
                  <button
                    type="button"
                    onClick={() => setAlwaysApply((prev) => !prev)}
                    className={cn(
                      "w-full px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center justify-between transition-all mt-0.5",
                      alwaysApply
                        ? "border-black bg-zinc-950 text-white shadow-xs"
                        : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700"
                    )}
                  >
                    <span>alwaysApply: {alwaysApply ? "true" : "false"}</span>
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-mono", alwaysApply ? "bg-zinc-800 text-white" : "bg-zinc-200 text-zinc-600")}>
                      {alwaysApply ? "ALWAYS ON" : "SCOPED ONLY"}
                    </span>
                  </button>
                  <p className="text-[10px] text-zinc-400">When ON, Cursor injects this rule in every generation context.</p>
                </div>
              </div>
            </div>
          )}

          {/* Identity & Trigger Configuration */}
          <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-zinc-700" />
                <h3 className="text-sm font-bold text-zinc-900">Identity & Activation Rules</h3>
              </div>
              <button
                type="button"
                onClick={synthesizeFromContext}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-orange-700 hover:text-orange-800 bg-orange-50 hover:bg-orange-100 border border-orange-200/90 px-2.5 py-1 rounded-md transition-all active:scale-95 shadow-xs"
                title="Synthesizes triggers, procedures, and directives from all 12 current form fields and stack context"
              >
                <Cpu className="w-3.5 h-3.5 text-orange-600" />
                <span>Synthesize from Context</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700">Skill Identifier (Kebab Case)</label>
                <input
                  type="text"
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  placeholder="e.g. codebase-auditor"
                  className="w-full px-3 py-1.5 border border-zinc-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700">Display Title</label>
                <input
                  type="text"
                  value={skillTitle}
                  onChange={(e) => setSkillTitle(e.target.value)}
                  placeholder="e.g. Codebase Health & Security Auditor"
                  className="w-full px-3 py-1.5 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-700">
                  Activation Trigger
                </label>
                <span className="text-[10px] text-zinc-400">Progressive disclosure condition evaluated by AI</span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="When should the AI activate this skill? (e.g., progressive disclosure condition for Claude Code or file globs for Cursor .mdc rules)..."
                className="w-full p-3 border border-zinc-200 rounded-lg text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 min-h-[105px] resize-y"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700">Agent Persona / Role</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Senior Security & Systems Auditor"
                className="w-full px-3 py-1.5 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
          </div>

          {/* Tech Stack Customization */}
          <div className="bg-white rounded-xl border border-zinc-200 p-3.5 sm:p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-zinc-700" />
                <h3 className="text-sm font-bold text-zinc-900">Technology Stack Context</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsManifestModalOpen(true)}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-700 hover:text-orange-700 bg-zinc-100 hover:bg-orange-50 border border-zinc-200 hover:border-orange-200 px-2.5 py-1 rounded-md transition-all active:scale-95 shadow-xs cursor-pointer"
                title="Auto-detect stack from package.json, pyproject.toml, Cargo.toml, or go.mod"
              >
                <UploadCloud className="w-3.5 h-3.5 text-orange-600" />
                <span>Auto-Detect from Manifest</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-600">Framework</label>
                <input
                  type="text"
                  value={framework}
                  onChange={(e) => setFramework(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-600">Language</label>
                <input
                  type="text"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-600">Styling / UI</label>
                <input
                  type="text"
                  value={styling}
                  onChange={(e) => setStyling(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-600">Database / API</label>
                <input
                  type="text"
                  value={database}
                  onChange={(e) => setDatabase(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Philosophy & Non-Rigid Style Preferences */}
          <div className="bg-white rounded-xl border border-zinc-200 p-3 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-zinc-700" />
                <h3 className="text-sm font-bold text-zinc-900">Engineering Philosophy</h3>
              </div>
              <span className="text-[10px] text-zinc-500 font-medium">Flexible & Adaptable</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PHILOSOPHIES.map((p) => {
                const isSelected = philosophy === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPhilosophy(p.id as any)}
                    className={cn(
                      "p-2.5 rounded-lg border text-left transition-all flex flex-col gap-1",
                      isSelected
                        ? `${p.color} ring-1 ring-orange-500/20 shadow-xs font-semibold`
                        : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
                    )}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold">{p.title}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-orange-600" />}
                    </div>
                    <p className="text-xs leading-relaxed text-zinc-500 font-normal">{p.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nuanced Agent Behavioral Guardrails */}
          <div className="bg-white rounded-xl border border-zinc-200 p-3 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-zinc-900">Agent Behavioral Guardrails</h3>
              </div>
              <span className="text-[10px] text-zinc-400">Select active rules</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {BEHAVIOR_OPTIONS.map((opt) => {
                const isChecked = behaviors.includes(opt.id);
                return (
                  <label
                    key={opt.id}
                    onClick={() => toggleItem(behaviors, setBehaviors, opt.id)}
                    className={cn(
                      "p-2 rounded-lg border text-left cursor-pointer transition-all flex items-start gap-2 select-none",
                      isChecked ? "border-zinc-300 bg-zinc-50/80 text-zinc-900" : "border-zinc-200 bg-white text-zinc-500"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="mt-0.5 rounded border-zinc-300 text-orange-600 focus:ring-orange-500 shrink-0"
                    />
                    <div>
                      <span className="text-xs font-semibold block text-zinc-800">{opt.label}</span>
                      <span className="text-xs leading-relaxed text-zinc-500 block">{opt.desc}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Architectural & Code Quality Conventions */}
          <div className="bg-white rounded-xl border border-zinc-200 p-3 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-zinc-700" />
                <h3 className="text-sm font-bold text-zinc-900">Architectural & Code Quality Conventions</h3>
              </div>
              <span className="text-[10px] text-zinc-400">Less rigid & configurable</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CONVENTION_OPTIONS.map((opt) => {
                const isChecked = conventions.includes(opt.id);
                return (
                  <label
                    key={opt.id}
                    onClick={() => toggleItem(conventions, setConventions, opt.id)}
                    className={cn(
                      "p-2 rounded-lg border text-left cursor-pointer transition-all flex items-start gap-2 select-none",
                      isChecked ? "border-zinc-300 bg-zinc-50/80 text-zinc-900" : "border-zinc-200 bg-white text-zinc-500"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="mt-0.5 rounded border-zinc-300 text-orange-600 focus:ring-orange-500 shrink-0"
                    />
                    <div>
                      <span className="text-xs font-semibold block text-zinc-800">{opt.label}</span>
                      <span className="text-xs leading-relaxed text-zinc-500 block">{opt.desc}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Procedures & Custom Rules Textareas */}
          <div className="bg-white rounded-xl border border-zinc-200 p-3.5 sm:p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-zinc-700" />
                <h3 className="text-sm font-bold text-zinc-900">Step-by-Step Workflow Procedures</h3>
              </div>
            </div>

            <textarea
              value={procedures}
              onChange={(e) => setProcedures(e.target.value)}
              rows={8}
              placeholder="1. Read context... 2. Trace execution..."
              className="w-full p-3 border border-zinc-200 rounded-lg text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 min-h-[195px] resize-y"
            />

            <div className="pt-2">
              <label className="text-xs font-semibold text-zinc-700 mb-1.5 block">
                Custom Directives & Forbidden Patterns
              </label>
              <textarea
                value={customDirectives}
                onChange={(e) => setCustomDirectives(e.target.value)}
                rows={5}
                placeholder="- Never use eval or dangerous innerHTML..."
                className="w-full p-3 border border-zinc-200 rounded-lg text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 min-h-[125px] resize-y"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Real-time Editor & Unified Action Group */}
        <div
          className="lg:col-span-6 flex flex-col space-y-2.5"
          style={{
            position: "sticky",
            top: "1.5rem",
            maxHeight: "calc(100vh - 3rem)",
          }}
        >
          {/* Main Card containing Header + Monaco Editor */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-md flex flex-col overflow-hidden">
            {/* File Tab Header with Unified Action Group */}
            <div className="px-3.5 py-2 flex items-center justify-between border-b border-zinc-800 bg-zinc-900/95 shrink-0 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={cn(
                    "w-2.5 h-2.5 rounded-full shrink-0",
                    format === "cursor_mdc" ? "bg-white" : "bg-orange-500/90"
                  )}
                />
                <span className="font-mono text-xs text-zinc-200 font-semibold truncate">{currentFileName}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono shrink-0">
                  {activeContent.split("\n").length} lines
                </span>

                {lastAutoSaved && (
                  <span className="hidden xl:inline-flex items-center gap-1 text-[10px] text-zinc-400 font-mono shrink-0">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /> Auto-saved
                  </span>
                )}
                {isManuallyEdited && (
                  <button
                    onClick={() => {
                      setEditorContent(generatedContent);
                      setIsManuallyEdited(false);
                    }}
                    className="inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-950/80 border border-amber-800/90 px-2 py-0.5 rounded-md hover:bg-amber-900 transition-colors font-mono shrink-0 active:scale-95 cursor-pointer"
                    title="Reset custom in-editor edits back to template-generated output"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              {/* Action Button Group: Copy + Download + Export Kit */}
              <div className="flex items-center bg-zinc-800/90 rounded-lg p-0.5 border border-zinc-700/60 shadow-xs shrink-0">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-zinc-300 hover:text-white hover:bg-zinc-700/60 rounded-md transition-colors font-medium cursor-pointer"
                  title="Copy code to clipboard"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </button>

                <div className="w-px h-3.5 bg-zinc-700/80 mx-0.5" />

                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-zinc-300 hover:text-white hover:bg-zinc-700/60 rounded-md transition-colors font-medium cursor-pointer"
                  title={`Download ${currentFileName}`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>

                <div className="w-px h-3.5 bg-zinc-700/80 mx-0.5" />

                <button
                  onClick={handleExportZip}
                  disabled={isExportingZip}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 text-xs text-white rounded-md transition-colors font-semibold shadow-xs cursor-pointer disabled:opacity-50 shrink-0",
                    format === "cursor_mdc"
                      ? "bg-zinc-800 hover:bg-black border border-zinc-600"
                      : "bg-orange-600 hover:bg-orange-500"
                  )}
                  title="Export complete workspace suite as a .zip bundle"
                >
                  <Archive className="w-3.5 h-3.5 text-orange-200 shrink-0" />
                  <span className="whitespace-nowrap">{isExportingZip ? "Zipping..." : "Export ZIP"}</span>
                </button>
              </div>
            </div>

            {/* Editor Container with Explicit Height, Editable Mode, and Instant Fallback */}
            <div className="h-[550px] lg:h-[calc(100vh-14rem)] min-h-[460px] relative overflow-hidden bg-zinc-950">
              <Editor
                height="100%"
                language="markdown"
                value={activeContent}
                theme="vs-dark"
                onChange={(val) => {
                  if (val !== undefined) {
                    setEditorContent(val);
                    setIsManuallyEdited(true);
                  }
                }}
                loading={
                  <pre className="p-4 font-mono text-xs text-zinc-300 whitespace-pre-wrap overflow-y-auto h-full select-text bg-zinc-950">
                    {activeContent}
                  </pre>
                }
                options={{
                  readOnly: false,
                  minimap: { enabled: false },
                  fontSize: 12.5,
                  fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Consolas, monospace",
                  wordWrap: "on",
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                  automaticLayout: true,
                }}
              />
            </div>
          </div>

          {/* Instructional Target Location Card (Compact) */}
          <div className="bg-white rounded-xl border border-zinc-200 p-3 shadow-xs text-xs space-y-1.5 shrink-0">
            <div className="flex items-center gap-1.5 font-semibold text-zinc-900">
              {format === "cursor_mdc" ? (
                <img src="/cursor-icon.png" alt="Cursor" className="w-3.5 h-3.5 object-contain" />
              ) : (
                <FolderGit2 className={cn("w-3.5 h-3.5", format === "skill_md" ? "text-orange-500" : "text-zinc-800")} />
              )}
              <span>Target File Location</span>
            </div>
            {format === "skill_md" && (
              <p className="text-zinc-500 text-xs leading-relaxed">
                Save as <code className="bg-zinc-100 px-1 py-0.5 rounded text-zinc-800 font-mono text-[11px]">.claude/skills/{skillName}/SKILL.md</code> in project root, or in <code className="bg-zinc-100 px-1 py-0.5 rounded text-zinc-800 font-mono text-[11px]">~/.claude/skills/{skillName}/SKILL.md</code> for global Claude Code availability.
              </p>
            )}
            {format === "claude_md" && (
              <p className="text-zinc-500 text-xs leading-relaxed">
                Save as <code className="bg-zinc-100 px-1 py-0.5 rounded text-zinc-800 font-mono text-[11px]">CLAUDE.md</code> directly in the root directory. Parsed automatically at the start of every session.
              </p>
            )}
            {format === "cursor_mdc" && (
              <p className="text-zinc-500 text-xs leading-relaxed">
                Save in <code className="bg-zinc-100 px-1 py-0.5 rounded text-zinc-800 font-mono text-[11px]">.cursor/rules/{skillName || "rule"}.mdc</code>. Evaluated via glob patterns for targeted context.
              </p>
            )}
            {format === "agents_md" && (
              <p className="text-zinc-500 text-xs leading-relaxed">
                Save as <code className="bg-zinc-100 px-1 py-0.5 rounded text-zinc-800 font-mono text-[11px]">AGENTS.md</code> in your root directory. Multi-agent workflows load this spec to coordinate tasks.
              </p>
            )}
          </div>
        </div>
      </main>

      {/* Manifest Import Modal (P2) */}
      <ManifestImportModal
        isOpen={isManifestModalOpen}
        onClose={() => setIsManifestModalOpen(false)}
        onApply={handleApplyManifest}
      />
    </div>
  );
}
