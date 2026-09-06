import { Metadata } from "next";

export type OutputFormat = "skill_md" | "claude_md" | "cursor_mdc" | "agents_md" | "mcp_json";

export interface ProgrammaticPresetRoute {
  formatSlug: string;
  presetSlug: string;
  format: OutputFormat;
  presetId: string;
  title: string;
  description: string;
  category: "Frontend" | "Backend" | "Fullstack & DB" | "DevOps & Tooling" | "Specialist Persona" | "MCP Server";
  techName: string;
  targetFile: string;
  whyNeeded: string;
  keyRules: string[];
  exampleGood?: string;
  exampleBad?: string;
  faqs: { question: string; answer: string }[];
  relatedSpokes?: { formatSlug: string; presetSlug: string; label: string }[];
}

export const PRESET_ROUTES: ProgrammaticPresetRoute[] = [
  // ==========================================
  // CURSOR RULES (.mdc)
  // ==========================================
  {
    formatSlug: "cursor-rules",
    presetSlug: "nextjs-15",
    format: "cursor_mdc",
    presetId: "nextjs-pro",
    title: "Next.js 15 Cursor Rules Generator (.mdc) | Free & Offline",
    description: "Generate strict Next.js 15 App Router Cursor rules with React Server Components, Server Actions, and Zod validation.",
    category: "Frontend",
    techName: "Next.js 15 App Router",
    targetFile: ".cursor/rules/nextjs-15.mdc",
    whyNeeded: "Next.js 15 introduces asynchronous cookies/headers, strict caching defaults (uncached fetch by default), and Server Actions. Without explicit cursor rules, LLMs frequently hallucinate outdated pages/ router conventions, unnecessary 'use client' directives, and sync request APIs.",
    keyRules: [
      "Enforce React Server Components (RSC) by default; restrict 'use client' strictly to interactive leaf components.",
      "Mutate state exclusively via Server Actions with Zod safeParse validation.",
      "Await asynchronous Next.js 15 APIs (cookies(), headers(), params, searchParams).",
      "Avoid pages/ directory conventions or legacy getServerSideProps.",
      "Colocate loading.tsx and error.tsx for dynamic route segments."
    ],
    exampleGood: `"use server";
import { z } from "zod";
import { db } from "@/lib/db";

const Schema = z.object({ title: z.string().min(3) });

export async function createItem(formData: FormData) {
  const parsed = Schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: parsed.error.flatten().fieldErrors };
  await db.item.create({ data: parsed.data });
  return { ok: true };
}`,
    exampleBad: `"use client";
export function SaveItem() {
  const submit = async (e: any) => {
    e.preventDefault();
    await fetch("/api/items", { method: "POST", body: JSON.stringify({ title: "Test" }) });
  };
  return <button onClick={submit}>Save</button>;
}`,
    faqs: [
      {
        question: "Why do I need specific Cursor rules for Next.js 15?",
        answer: "Next.js 15 changes key assumptions: asynchronous headers/cookies, un-cached fetch by default, and React 19 hooks. MDC rules ensure Cursor generates compliant modern code rather than legacy Next.js 13/14 or pages/ router patterns."
      },
      {
        question: "Where do I save this .mdc file?",
        answer: "Save it to `.cursor/rules/nextjs-15.mdc` in your project root. Cursor will automatically attach it when editing files under `src/app/`."
      }
    ],
    relatedSpokes: [
      { formatSlug: "claude-skills", presetSlug: "nextjs-15", label: "Next.js 15 Claude Skill" },
      { formatSlug: "claude-md", presetSlug: "nextjs-15", label: "Next.js 15 CLAUDE.md" },
      { formatSlug: "agents-md", presetSlug: "nextjs-15", label: "Next.js 15 AGENTS.md" },
      { formatSlug: "cursor-rules", presetSlug: "react-19", label: "React 19 Cursor Rules" },
      { formatSlug: "cursor-rules", presetSlug: "tailwind-v4", label: "Tailwind CSS v4 Cursor Rules" }
    ]
  },
  {
    formatSlug: "cursor-rules",
    presetSlug: "react-19",
    format: "cursor_mdc",
    presetId: "react-spa",
    title: "React 19 Cursor Rules Generator (.mdc) | Free & Offline",
    description: "Generate modern React 19 SPA Cursor rules enforcing custom hooks, TanStack query caching, and avoiding redundant useEffects.",
    category: "Frontend",
    techName: "React 19 & Vite",
    targetFile: ".cursor/rules/react-19.mdc",
    whyNeeded: "React 19 introduces the React Compiler, useActionState, useOptimistic, and the `use` API. AI models trained on older codebases constantly produce obsolete useEffect state synchronization, manual mounting flags, and unnecessary forwardRef wrappers.",
    keyRules: [
      "Use React 19 action hooks (useActionState, useOptimistic, useFormStatus) for async mutations.",
      "Never forwardRef; pass ref directly as a standard component prop in React 19.",
      "Ban redundant useEffect state synchronization; calculate derived state synchronously during render.",
      "Separate server state (TanStack Query/SWR) from ephemeral UI state (useState).",
      "Do not use React.FC typing; declare explicit component props interfaces."
    ],
    exampleGood: `// Good: Derived state computed synchronously during render
export function FilteredItems({ items, query }: { items: Item[]; query: string }) {
  const filtered = useMemo(
    () => items.filter((i) => i.name.toLowerCase().includes(query.toLowerCase())),
    [items, query]
  );
  return <ul>{filtered.map(i => <li key={i.id}>{i.name}</li>)}</ul>;
}`,
    exampleBad: `// Discouraged: Anti-pattern useEffect duplicating state
export function BadItems({ items, query }: any) {
  const [filtered, setFiltered] = useState([]);
  useEffect(() => {
    setFiltered(items.filter((i: any) => i.name.includes(query)));
  }, [items, query]);
  return <ul>{filtered.map((i: any) => <li key={i.id}>{i.name}</li>)}</ul>;
}`,
    faqs: [
      {
        question: "Does React 19 require forwardRef?",
        answer: "No. In React 19, `ref` is passed as a normal prop to function components. forwardRef is deprecated."
      }
    ],
    relatedSpokes: [
      { formatSlug: "cursor-rules", presetSlug: "nextjs-15", label: "Next.js 15 Cursor Rules" },
      { formatSlug: "cursor-rules", presetSlug: "tailwind-v4", label: "Tailwind CSS v4 Cursor Rules" }
    ]
  },
  {
    formatSlug: "cursor-rules",
    presetSlug: "tailwind-v4",
    format: "cursor_mdc",
    presetId: "tailwind-v4",
    title: "Tailwind CSS v4 Cursor Rules (.mdc) | Free & Offline",
    description: "Generate Tailwind CSS v4 Cursor rules enforcing CSS-first theme configuration, @theme directives, and zero tailwind.config.js.",
    category: "Frontend",
    techName: "Tailwind CSS v4",
    targetFile: ".cursor/rules/tailwind-v4.mdc",
    whyNeeded: "Tailwind CSS v4 is an entirely new CSS-first engine that completely replaces javascript-based `tailwind.config.js` with native `@theme` directives in CSS. Outdated LLMs continually hallucinate obsolete tailwind.config.js configurations.",
    keyRules: [
      "Configure themes directly in globals.css using `@theme` and `@import 'tailwindcss';`.",
      "Never generate or modify legacy `tailwind.config.js` or `tailwind.config.ts` files.",
      "Use CSS custom properties for dynamic color palettes.",
      "Enforce consistent utility ordering: layout -> spacing -> typography -> background -> borders -> interactivity."
    ],
    exampleGood: `@import "tailwindcss";

@theme {
  --color-brand-primary: #f97316;
  --font-display: "Geist Sans", sans-serif;
}`,
    exampleBad: `// Discouraged in v4: Obsolete tailwind.config.js
module.exports = {
  theme: {
    extend: { colors: { brand: "#f97316" } }
  }
};`,
    faqs: [
      {
        question: "Does Tailwind v4 use tailwind.config.js?",
        answer: "No. Tailwind CSS v4 is configured directly in CSS files using the `@theme` directive."
      }
    ],
    relatedSpokes: [
      { formatSlug: "cursor-rules", presetSlug: "nextjs-15", label: "Next.js 15 Cursor Rules" },
      { formatSlug: "cursor-rules", presetSlug: "react-19", label: "React 19 Cursor Rules" }
    ]
  },
  {
    formatSlug: "cursor-rules",
    presetSlug: "fastapi",
    format: "cursor_mdc",
    presetId: "fastapi-ai",
    title: "Python FastAPI Cursor Rules (.mdc) | Free & Offline",
    description: "Generate strict Python FastAPI Cursor rules with Pydantic v2 schemas, async endpoints, and AI agent integrations.",
    category: "Backend",
    techName: "Python FastAPI & Pydantic v2",
    targetFile: ".cursor/rules/fastapi.mdc",
    whyNeeded: "FastAPI with Pydantic v2 requires `model_validator` instead of `@root_validator`, Field annotations, and strict async I/O. Without rules, AI models blend outdated Pydantic v1 syntax and synchronous database calls inside async handlers.",
    keyRules: [
      "Use strict Pydantic v2 BaseModels with Field validation for all input and output schemas.",
      "Use asynchronous route handlers (`async def`) for database operations and external API requests.",
      "Inject dependencies using FastAPI `Depends` pattern; avoid global state.",
      "Type annotate 100% of function signatures with Python 3.12+ type hints."
    ],
    exampleGood: `from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

router = APIRouter()

class UserPayload(BaseModel):
    email: str = Field(..., min_length=5)

@router.post("/users")
async def create_user(payload: UserPayload, db = Depends(get_db)):
    return await db.users.create(payload.model_dump())`,
    exampleBad: `@app.post("/users")
def make_user(data: dict):
    # Missing types, sync blocking query
    return db.query(data["email"])`,
    faqs: [
      {
        question: "Does this enforce Pydantic v2 syntax?",
        answer: "Yes, it specifically enforces `model_dump()`, `@field_validator`, and Pydantic v2 idioms."
      }
    ],
    relatedSpokes: [
      { formatSlug: "claude-skills", presetSlug: "fastapi", label: "FastAPI Claude Skill" },
      { formatSlug: "claude-md", presetSlug: "fastapi", label: "FastAPI CLAUDE.md" },
      { formatSlug: "agents-md", presetSlug: "fastapi", label: "FastAPI AGENTS.md" }
    ]
  },
  {
    formatSlug: "cursor-rules",
    presetSlug: "supabase",
    format: "cursor_mdc",
    presetId: "supabase-fullstack",
    title: "Supabase & Postgres Cursor Rules (.mdc) | Free & Offline",
    description: "Generate Supabase Cursor rules enforcing Row-Level Security (RLS), typed client queries, and Server Component auth guards.",
    category: "Fullstack & DB",
    techName: "Supabase & PostgreSQL",
    targetFile: ".cursor/rules/supabase.mdc",
    whyNeeded: "Supabase applications are prone to catastrophic security leaks if Row Level Security (RLS) is omitted or if client-side service_role keys are exposed. Cursor rules ensure RLS is enabled on every table and authentication is validated server-side.",
    keyRules: [
      "Always include `ENABLE ROW LEVEL SECURITY;` on every created table.",
      "Never expose `SUPABASE_SERVICE_ROLE_KEY` in client code or public bundles.",
      "Use `@supabase/ssr` with Next.js App Router cookies for server-side auth.",
      "Enforce typed database definitions generated via `supabase gen types typescript`."
    ],
    faqs: [
      {
        question: "Does this rule check for RLS?",
        answer: "Yes. It mandates that any table creation migration explicitly enables Row-Level Security."
      }
    ],
    relatedSpokes: [
      { formatSlug: "cursor-rules", presetSlug: "nextjs-15", label: "Next.js 15 Cursor Rules" },
      { formatSlug: "mcp-config", presetSlug: "postgres", label: "PostgreSQL MCP Config" }
    ]
  },
  {
    formatSlug: "cursor-rules",
    presetSlug: "prisma",
    format: "cursor_mdc",
    presetId: "prisma-orm",
    title: "Prisma ORM Cursor Rules (.mdc) | Free & Offline",
    description: "Generate Prisma ORM Cursor rules enforcing transaction safety, indexed queries, and minimal payload selections.",
    category: "Fullstack & DB",
    techName: "Prisma ORM",
    targetFile: ".cursor/rules/prisma.mdc",
    whyNeeded: "Default AI Prisma queries often select entire entity trees, causing catastrophic over-fetching. These rules enforce `select` fields, explicit index hints, and batch transactions.",
    keyRules: [
      "Always use `select` to specify required fields; avoid raw `findMany()` fetching unused relations.",
      "Wrap multi-step dependent writes inside `prisma.$transaction()`.",
      "Ensure foreign keys and queried filter fields are indexed with `@@index` in schema.prisma.",
      "Use global singleton PrismaClient to avoid exhausting connection pools in serverless environments."
    ],
    faqs: [
      {
        question: "Why should Prisma queries always specify select?",
        answer: "Selecting only required fields reduces database memory, shrinks JSON network payloads, and avoids accidentally exposing password hashes or internal fields."
      }
    ],
    relatedSpokes: [
      { formatSlug: "cursor-rules", presetSlug: "nextjs-15", label: "Next.js 15 Cursor Rules" },
      { formatSlug: "cursor-rules", presetSlug: "drizzle", label: "Drizzle ORM Cursor Rules" }
    ]
  },
  {
    formatSlug: "cursor-rules",
    presetSlug: "drizzle",
    format: "cursor_mdc",
    presetId: "drizzle-orm",
    title: "Drizzle ORM Cursor Rules (.mdc) | Free & Offline",
    description: "Generate Drizzle ORM Cursor rules with relational queries, type-safe SQL migrations, and prepared statements.",
    category: "Fullstack & DB",
    techName: "Drizzle ORM",
    targetFile: ".cursor/rules/drizzle.mdc",
    whyNeeded: "Drizzle ORM uses TypeScript-native schema definitions. Rules ensure Cursor properly separates schema declarations, client queries, and migration scripts.",
    keyRules: [
      "Define schemas using pgTable/sqliteTable with explicit foreign keys and constraints.",
      "Use the query builder (`db.query.users.findFirst`) for relational reads and SQL builder for complex mutations.",
      "Never write raw unsanitized SQL string concatenation; use the `sql` tagged template literal."
    ],
    faqs: [
      {
        question: "Does this cover both relational queries and raw SQL?",
        answer: "Yes, it guides Cursor on when to use Drizzle's relational queries vs parameterized `sql` tagged templates."
      }
    ],
    relatedSpokes: [
      { formatSlug: "cursor-rules", presetSlug: "prisma", label: "Prisma ORM Cursor Rules" },
      { formatSlug: "cursor-rules", presetSlug: "nextjs-15", label: "Next.js 15 Cursor Rules" }
    ]
  },
  {
    formatSlug: "cursor-rules",
    presetSlug: "go-fiber",
    format: "cursor_mdc",
    presetId: "go-fiber",
    title: "Go Fiber Cursor Rules (.mdc) | Free & Offline",
    description: "Generate Go Fiber Cursor rules enforcing idiomatic error handling, context propagation, and zero-allocation routing.",
    category: "Backend",
    techName: "Go (Golang) & Fiber",
    targetFile: ".cursor/rules/go-fiber.mdc",
    whyNeeded: "AI models often write non-idiomatic Go with swallowed errors or unnecessary panic/recover handlers. These rules enforce explicit error checks, structured logging, and clean layered packages.",
    keyRules: [
      "Check every `if err != nil` explicitly; never swallow errors or ignore returned values.",
      "Propagate `c.Context()` into all database and outgoing HTTP requests.",
      "Keep handlers clean: parse inputs with `c.BodyParser`, delegate to domain service, return JSON.",
      "Avoid package-level global variables; inject database connections via struct receivers."
    ],
    faqs: [
      {
        question: "Does this enforce idiomatic Go project layout?",
        answer: "Yes, it guides Cursor to follow standard `cmd/`, `internal/`, and `pkg/` structures."
      }
    ],
    relatedSpokes: [
      { formatSlug: "cursor-rules", presetSlug: "rust-axum", label: "Rust Axum Cursor Rules" },
      { formatSlug: "claude-md", presetSlug: "go-fiber", label: "Go Fiber CLAUDE.md" }
    ]
  },
  {
    formatSlug: "cursor-rules",
    presetSlug: "rust-axum",
    format: "cursor_mdc",
    presetId: "rust-axum",
    title: "Rust Axum Cursor Rules (.mdc) | Free & Offline",
    description: "Generate Rust Axum Cursor rules enforcing type-safe extractors, Result error handling, and Tokio async runtimes.",
    category: "Backend",
    techName: "Rust & Axum",
    targetFile: ".cursor/rules/rust-axum.mdc",
    whyNeeded: "Rust async borrow checker rules and Axum extractor ordering can confuse LLMs. These rules enforce proper State injection, custom error enums with `IntoResponse`, and minimal unwrap() usage.",
    keyRules: [
      "Never call `.unwrap()` or `.expect()` in production route handlers; propagate errors via `Result<T, AppError>`.",
      "Implement `IntoResponse` on custom application error enums with appropriate HTTP status codes.",
      "Use `State(app_state)` extractors for shared database pools and configurations.",
      "Keep Axum handlers strongly typed with `Json<T>` and `Path<T>` extractors."
    ],
    faqs: [
      {
        question: "Does this rule forbid unwrap()?",
        answer: "Yes! Production code paths are strictly constrained to proper Result propagation."
      }
    ],
    relatedSpokes: [
      { formatSlug: "cursor-rules", presetSlug: "go-fiber", label: "Go Fiber Cursor Rules" },
      { formatSlug: "claude-md", presetSlug: "rust-axum", label: "Rust Axum CLAUDE.md" }
    ]
  },
  {
    formatSlug: "cursor-rules",
    presetSlug: "vue-nuxt",
    format: "cursor_mdc",
    presetId: "vue-nuxt",
    title: "Vue 3 & Nuxt 3 Cursor Rules (.mdc) | Free & Offline",
    description: "Generate Vue 3 & Nuxt 3 Cursor rules with Composition API, script setup, and Nitro server routes.",
    category: "Frontend",
    techName: "Vue 3 & Nuxt 3",
    targetFile: ".cursor/rules/nuxt-3.mdc",
    whyNeeded: "LLMs frequently write obsolete Options API Vue 2 code or misconfigure Nuxt 3 auto-imports. Rules enforce `<script setup lang='ts'>`, useFetch caching, and Nitro server routes.",
    keyRules: [
      "Always use `<script setup lang='ts'>` and the Composition API; ban legacy Options API.",
      "Use `useFetch` or `useAsyncData` for server-side data fetching with unique cache keys.",
      "Colocate server endpoints under `server/api/` with `defineEventHandler`.",
      "Rely on Nuxt auto-imports; avoid manual import statements for standard Vue and Nuxt composables."
    ],
    faqs: [
      {
        question: "Does this enforce Composition API?",
        answer: "Yes, it bans Vue 2 Options API and enforces TypeScript with `<script setup>`."
      }
    ],
    relatedSpokes: [
      { formatSlug: "cursor-rules", presetSlug: "nextjs-15", label: "Next.js 15 Cursor Rules" },
      { formatSlug: "cursor-rules", presetSlug: "sveltekit", label: "SvelteKit Cursor Rules" }
    ]
  },
  {
    formatSlug: "cursor-rules",
    presetSlug: "sveltekit",
    format: "cursor_mdc",
    presetId: "sveltekit",
    title: "SvelteKit 5 Cursor Rules (.mdc) | Free & Offline",
    description: "Generate SvelteKit 5 Cursor rules enforcing Svelte 5 Runes ($state, $derived), form actions, and load functions.",
    category: "Frontend",
    techName: "SvelteKit 5 & Svelte 5",
    targetFile: ".cursor/rules/sveltekit.mdc",
    whyNeeded: "Svelte 5 completely overhauls reactivity using Runes (`$state`, `$derived`, `$props`). Models trained on Svelte 3/4 write outdated `let` reactive declarations and `$: ` statements.",
    keyRules: [
      "Use Svelte 5 runes: `$state()`, `$derived()`, and `$props()`.",
      "Never use obsolete Svelte 3/4 `export let` or `$: ` reactive labels.",
      "Implement data loading in `+page.server.ts` load functions.",
      "Handle data mutations via standard SvelteKit Form Actions with `enhance`."
    ],
    faqs: [
      {
        question: "Does this cover Svelte 5 runes?",
        answer: "Yes, it specifically enforces `$state` and `$derived` while banning legacy Svelte 4 syntax."
      }
    ],
    relatedSpokes: [
      { formatSlug: "cursor-rules", presetSlug: "nextjs-15", label: "Next.js 15 Cursor Rules" },
      { formatSlug: "cursor-rules", presetSlug: "vue-nuxt", label: "Vue / Nuxt Cursor Rules" }
    ]
  },
  {
    formatSlug: "cursor-rules",
    presetSlug: "cursor-rules-pro",
    format: "cursor_mdc",
    presetId: "cursor-mdc-pro",
    title: "Cursor Rules Pro (.mdc) Generator | Free & Offline",
    description: "Generate modular, strict Cursor rules enforcing minimal diffs, zero-any typing, and pragmatic architecture.",
    category: "Specialist Persona",
    techName: "Universal Cursor Pro",
    targetFile: ".cursor/rules/cursor-pro.mdc",
    whyNeeded: "A multi-purpose developer rulebook preventing Cursor from generating bloated whole-file rewrites, verbose conversational explanations, or sloppy type assertions.",
    keyRules: [
      "Deliver surgical, targeted diffs; never replace entire files unnecessarily.",
      "Maintain zero-any TypeScript discipline.",
      "Check existing imports and directory conventions before proposing changes.",
      "Provide concrete verification steps with every proposed modification."
    ],
    faqs: [
      {
        question: "Can I use this across any project?",
        answer: "Yes, Cursor Pro is framework-agnostic and enforces foundational AI hygiene and surgical code diffs."
      }
    ],
    relatedSpokes: [
      { formatSlug: "cursor-rules", presetSlug: "vibe-coder", label: "Vibe Coder Cursor Rules" },
      { formatSlug: "cursor-rules", presetSlug: "security-guard", label: "Security Guard Cursor Rules" }
    ]
  },
  {
    formatSlug: "cursor-rules",
    presetSlug: "vibe-coder",
    format: "cursor_mdc",
    presetId: "vibe-coder",
    title: "Vibe Coder Cursor Rules (.mdc) | Free & Offline",
    description: "Generate high-velocity, pragmatic vibe coding Cursor rules prioritizing fast feedback loops and flat structures.",
    category: "Specialist Persona",
    techName: "Pragmatic Rapid Prototyping",
    targetFile: ".cursor/rules/vibe-coder.mdc",
    whyNeeded: "When building fast prototypes or MVP products, over-engineering and premature abstraction slow you down. This rule keeps the AI focused on immediate working software.",
    keyRules: [
      "Prioritize working software over complex design patterns or deep inheritance hierarchies.",
      "Keep code flat, readable, and direct.",
      "Minimize ceremony: avoid multi-file indirection for simple features.",
      "Deliver fast working solutions that can be easily validated or deleted."
    ],
    faqs: [
      {
        question: "What is vibe coding?",
        answer: "Vibe coding is a high-velocity development philosophy prioritizing rapid prototyping, immediate working solutions, and low ceremony."
      }
    ],
    relatedSpokes: [
      { formatSlug: "cursor-rules", presetSlug: "cursor-rules-pro", label: "Cursor Rules Pro" },
      { formatSlug: "cursor-rules", presetSlug: "tdd-specialist", label: "TDD Specialist Cursor Rules" }
    ]
  },
  {
    formatSlug: "cursor-rules",
    presetSlug: "security-guard",
    format: "cursor_mdc",
    presetId: "security-guard",
    title: "Security Guard Cursor Rules (.mdc) | Free & Offline",
    description: "Generate strict security Cursor rules focused on mitigating SQL injection, XSS, and insecure endpoints.",
    category: "Specialist Persona",
    techName: "Zero-Trust Security",
    targetFile: ".cursor/rules/security-guard.mdc",
    whyNeeded: "AI-generated code notoriously introduces subtle security vulnerabilities like unparameterized queries, hardcoded secrets, and missing authorization checks.",
    keyRules: [
      "Flag and prevent any dynamic SQL query string interpolation.",
      "Verify that every mutating route enforces authentication and authorization.",
      "Never hardcode API keys, secrets, or access tokens in source code.",
      "Sanitize all user inputs before rendering in HTML or executing system commands."
    ],
    faqs: [
      {
        question: "How does this prevent SQL injection?",
        answer: "It flags string-interpolated SQL statements as critical errors and enforces parameterized query syntax."
      }
    ],
    relatedSpokes: [
      { formatSlug: "claude-skills", presetSlug: "security-guard", label: "Security Guard Claude Skill" },
      { formatSlug: "cursor-rules", presetSlug: "cursor-rules-pro", label: "Cursor Rules Pro" }
    ]
  },
  {
    formatSlug: "cursor-rules",
    presetSlug: "docker-devops",
    format: "cursor_mdc",
    presetId: "docker-devops",
    title: "Docker & DevOps Cursor Rules (.mdc) | Free & Offline",
    description: "Generate Docker & DevOps Cursor rules enforcing multi-stage builds, non-root users, and minimal Alpine/Debian base images.",
    category: "DevOps & Tooling",
    techName: "Docker & CI/CD",
    targetFile: ".cursor/rules/docker.mdc",
    whyNeeded: "LLMs frequently write bloated, insecure single-stage Dockerfiles running as root. These rules enforce multi-stage builds, non-root users, and caching layers.",
    keyRules: [
      "Always use multi-stage Docker builds to separate builder tools from the lean production image.",
      "Never run containers as root; create and switch to a non-privileged user (`USER node` or `USER app`).",
      "Pin base image versions explicitly; avoid mutable `:latest` tags.",
      "Leverage layer caching by copying package manifests before source code."
    ],
    faqs: [
      {
        question: "Why should containers run as non-root?",
        answer: "Running as non-root mitigates container escape vulnerabilities and follows the principle of least privilege."
      }
    ],
    relatedSpokes: [
      { formatSlug: "mcp-config", presetSlug: "docker", label: "Docker MCP Server Config" },
      { formatSlug: "cursor-rules", presetSlug: "security-guard", label: "Security Guard Cursor Rules" }
    ]
  },
  {
    formatSlug: "cursor-rules",
    presetSlug: "tdd-specialist",
    format: "cursor_mdc",
    presetId: "tdd-specialist",
    title: "TDD & Testing Cursor Rules (.mdc) | Free & Offline",
    description: "Generate Test-Driven Development Cursor rules enforcing Vitest/Jest unit tests, edge-case coverage, and mocking discipline.",
    category: "Specialist Persona",
    techName: "Vitest & Playwright TDD",
    targetFile: ".cursor/rules/testing.mdc",
    whyNeeded: "AI coding tools often generate code without accompanying tests. These rules force Cursor to write failing tests first and mock external I/O cleanly.",
    keyRules: [
      "Write unit tests covering happy paths and at least two edge/error cases for every new function.",
      "Mock external networks, databases, and third-party APIs using Vitest/Jest mocks.",
      "Keep tests fast, isolated, and deterministic; no shared mutable test state.",
      "Provide verification test commands with every proposed code diff."
    ],
    faqs: [
      {
        question: "Does this work with Vitest and Jest?",
        answer: "Yes, it enforces standard describe/test assertions and mock isolation compatible with both Vitest and Jest."
      }
    ],
    relatedSpokes: [
      { formatSlug: "cursor-rules", presetSlug: "cursor-rules-pro", label: "Cursor Rules Pro" },
      { formatSlug: "claude-skills", presetSlug: "codebase-auditor", label: "Codebase Auditor Claude Skill" }
    ]
  },

  // ==========================================
  // CLAUDE CODE SKILLS (SKILL.md)
  // ==========================================
  {
    formatSlug: "claude-skills",
    presetSlug: "codebase-auditor",
    format: "skill_md",
    presetId: "claude-auditor",
    title: "Codebase Auditor Claude Skill (.md) | Free & Offline",
    description: "Generate a Claude Code codebase auditing skill to identify structural health, security flaws, and performance anti-patterns.",
    category: "Specialist Persona",
    techName: "Automated Code Reviewer",
    targetFile: ".claude/skills/codebase-auditor/SKILL.md",
    whyNeeded: "Codebases accumulate dead code, unhandled async errors, and subtle security bugs. This skill equips Claude Code with a rigorous 5-step auditing framework.",
    keyRules: [
      "Scan repository manifests to map stack idioms before evaluating logic.",
      "Audit authentication gates, token validation, and error propagation.",
      "Categorize all findings into CRITICAL, HIGH, MEDIUM, and LOW severity.",
      "Deliver surgical refactoring patches with before/after rationale."
    ],
    faqs: [
      {
        question: "How do I invoke this in Claude Code?",
        answer: "Run `claude` and ask 'Audit this codebase for security and dead code' or use the configured slash command."
      }
    ],
    relatedSpokes: [
      { formatSlug: "claude-skills", presetSlug: "security-guard", label: "Security Guard Claude Skill" },
      { formatSlug: "cursor-rules", presetSlug: "cursor-rules-pro", label: "Cursor Rules Pro" }
    ]
  },
  {
    formatSlug: "claude-skills",
    presetSlug: "nextjs-15",
    format: "skill_md",
    presetId: "nextjs-pro",
    title: "Next.js 15 Claude Skill (.md) | Free & Offline",
    description: "Generate a Next.js 15 Claude Code skill to enforce RSCs, Server Actions, and Tailwind CSS v4.",
    category: "Frontend",
    techName: "Next.js 15 App Router",
    targetFile: ".claude/skills/nextjs-15/SKILL.md",
    whyNeeded: "Equips Claude CLI with full mastery over Next.js 15 server-side data fetching, dynamic params, and Server Actions without cluttering baseline context.",
    keyRules: [
      "Enforce React Server Components (RSC) for data fetching.",
      "Validate Server Actions using Zod.",
      "Await asynchronous headers and cookies.",
      "Use modern React 19 hooks for client-side forms."
    ],
    faqs: [
      {
        question: "Where is this skill saved?",
        answer: "Save to `.claude/skills/nextjs-15/SKILL.md` in your repository."
      }
    ],
    relatedSpokes: [
      { formatSlug: "cursor-rules", presetSlug: "nextjs-15", label: "Next.js 15 Cursor Rules" },
      { formatSlug: "claude-md", presetSlug: "nextjs-15", label: "Next.js 15 CLAUDE.md" }
    ]
  },
  {
    formatSlug: "claude-skills",
    presetSlug: "security-guard",
    format: "skill_md",
    presetId: "security-guard",
    title: "Security Guard Claude Skill (.md) | Free & Offline",
    description: "Generate a security auditing Claude Code skill focused on identifying vulnerabilities and API key leaks.",
    category: "Specialist Persona",
    techName: "Security Vulnerability Auditor",
    targetFile: ".claude/skills/security-guard/SKILL.md",
    whyNeeded: "Run on-demand security scans before releasing code to identify SQL injections, exposed environment secrets, and missing authorization checks.",
    keyRules: [
      "Inspect source files for leaked API keys, tokens, and private certificates.",
      "Check SQL and ORM queries for string interpolation.",
      "Verify CORS, CSRF, and rate-limiting protections."
    ],
    faqs: [
      {
        question: "Does this scan local environment files?",
        answer: "Yes, it inspects your repo configuration while ensuring secrets are never leaked or committed to Git."
      }
    ],
    relatedSpokes: [
      { formatSlug: "cursor-rules", presetSlug: "security-guard", label: "Security Guard Cursor Rules" },
      { formatSlug: "claude-skills", presetSlug: "codebase-auditor", label: "Codebase Auditor Claude Skill" }
    ]
  },
  {
    formatSlug: "claude-skills",
    presetSlug: "fastapi",
    format: "skill_md",
    presetId: "fastapi-ai",
    title: "Python FastAPI Claude Skill (.md) | Free & Offline",
    description: "Generate a strict Python FastAPI Claude Code skill prioritizing asynchronous routing and Pydantic validation.",
    category: "Backend",
    techName: "Python FastAPI & AI",
    targetFile: ".claude/skills/fastapi/SKILL.md",
    whyNeeded: "Teaches Claude Code how to scaffold, debug, and optimize Python FastAPI backends using Pydantic v2 and async database sessions.",
    keyRules: [
      "Enforce Pydantic v2 BaseModels with Field constraints.",
      "Validate async non-blocking operations across all route handlers.",
      "Handle domain errors gracefully at service boundary."
    ],
    faqs: [
      {
        question: "How does Claude Code invoke this skill?",
        answer: "When you ask Claude to create or debug a FastAPI endpoint, Claude detects the skill frontmatter and loads its directives."
      }
    ],
    relatedSpokes: [
      { formatSlug: "cursor-rules", presetSlug: "fastapi", label: "FastAPI Cursor Rules" },
      { formatSlug: "claude-md", presetSlug: "fastapi", label: "FastAPI CLAUDE.md" }
    ]
  },

  // ==========================================
  // ANTHROPIC CLAUDE.md REPOSITORY GUIDELINES
  // ==========================================
  {
    formatSlug: "claude-md",
    presetSlug: "nextjs-15",
    format: "claude_md",
    presetId: "nextjs-pro",
    title: "Next.js 15 CLAUDE.md Generator | Free & Offline",
    description: "Generate a Next.js 15 CLAUDE.md repository instruction file with App Router conventions.",
    category: "Frontend",
    techName: "Next.js 15 App Router",
    targetFile: "CLAUDE.md",
    whyNeeded: "Provides Claude Code with immediate repository orientation: package manager commands (pnpm/bun/npm), test runner, build steps, and App Router architecture.",
    keyRules: [
      "Define standard commands: build, test, lint, and dev server.",
      "Establish server vs client component rules.",
      "Specify styling conventions with Tailwind CSS v4."
    ],
    faqs: [
      {
        question: "Where should CLAUDE.md be placed?",
        answer: "Place it in the root directory of your repository (`./CLAUDE.md`)."
      }
    ],
    relatedSpokes: [
      { formatSlug: "cursor-rules", presetSlug: "nextjs-15", label: "Next.js 15 Cursor Rules" },
      { formatSlug: "agents-md", presetSlug: "nextjs-15", label: "Next.js 15 AGENTS.md" }
    ]
  },
  {
    formatSlug: "claude-md",
    presetSlug: "fastapi",
    format: "claude_md",
    presetId: "fastapi-ai",
    title: "FastAPI CLAUDE.md Generator | Free & Offline",
    description: "Generate a Python FastAPI CLAUDE.md repository instruction file with async backend conventions.",
    category: "Backend",
    techName: "Python FastAPI",
    targetFile: "CLAUDE.md",
    whyNeeded: "Instructs Claude on Python virtualenv activation, poetry/uv/pip commands, pytest execution, and async conventions.",
    keyRules: [
      "Specify virtual environment and dependency runner commands (`uv run pytest`, `uv run uvicorn`).",
      "Document layered architecture: api/, services/, models/, core/.",
      "Enforce Pydantic v2 data validation standards."
    ],
    faqs: [
      {
        question: "Can I use uv or poetry commands?",
        answer: "Yes, customize the commands section to reflect your chosen Python package manager."
      }
    ],
    relatedSpokes: [
      { formatSlug: "cursor-rules", presetSlug: "fastapi", label: "FastAPI Cursor Rules" },
      { formatSlug: "agents-md", presetSlug: "fastapi", label: "FastAPI AGENTS.md" }
    ]
  },
  {
    formatSlug: "claude-md",
    presetSlug: "react-19",
    format: "claude_md",
    presetId: "react-spa",
    title: "React 19 CLAUDE.md Generator | Free & Offline",
    description: "Generate a React 19 CLAUDE.md repository guide with Vite, TypeScript, and custom hook guidelines.",
    category: "Frontend",
    techName: "React 19 & Vite",
    targetFile: "CLAUDE.md",
    whyNeeded: "Provides Claude CLI with Vite build commands, Vitest execution, and component colocation architecture.",
    keyRules: [
      "Standard commands: `npm run build`, `npm test`, `npm run lint`.",
      "Component directory structure: Component.tsx, useComponent.ts, Component.test.tsx.",
      "React 19 action patterns and TanStack query standards."
    ],
    faqs: [
      {
        question: "Does this include test commands?",
        answer: "Yes, it specifies the non-interactive test command so Claude can verify changes."
      }
    ],
    relatedSpokes: [
      { formatSlug: "cursor-rules", presetSlug: "react-19", label: "React 19 Cursor Rules" },
      { formatSlug: "cursor-rules", presetSlug: "nextjs-15", label: "Next.js 15 Cursor Rules" }
    ]
  },
  {
    formatSlug: "claude-md",
    presetSlug: "go-fiber",
    format: "claude_md",
    presetId: "go-fiber",
    title: "Go Fiber CLAUDE.md Generator | Free & Offline",
    description: "Generate a Go Fiber CLAUDE.md repository file with Go build commands and testing standards.",
    category: "Backend",
    techName: "Go & Fiber",
    targetFile: "CLAUDE.md",
    whyNeeded: "Instructs Claude on `go build`, `go test ./...`, golangci-lint, and idiomatic error handling conventions.",
    keyRules: [
      "Commands: `go test -v ./...`, `golangci-lint run`, `go run cmd/server/main.go`.",
      "Strict error handling: never ignore returned errors.",
      "Context propagation through service and repository layers."
    ],
    faqs: [
      {
        question: "Does this specify test flags?",
        answer: "Yes, it configures standard Go test and lint flags."
      }
    ],
    relatedSpokes: [
      { formatSlug: "cursor-rules", presetSlug: "go-fiber", label: "Go Fiber Cursor Rules" },
      { formatSlug: "claude-md", presetSlug: "rust-axum", label: "Rust Axum CLAUDE.md" }
    ]
  },
  {
    formatSlug: "claude-md",
    presetSlug: "rust-axum",
    format: "claude_md",
    presetId: "rust-axum",
    title: "Rust Axum CLAUDE.md Generator | Free & Offline",
    description: "Generate a Rust Axum CLAUDE.md repository guide with cargo test, clippy, and error handling rules.",
    category: "Backend",
    techName: "Rust & Axum",
    targetFile: "CLAUDE.md",
    whyNeeded: "Gives Claude exact cargo build and test flags, clippy checks, and rules against unwrap().",
    keyRules: [
      "Commands: `cargo test`, `cargo clippy -- -D warnings`, `cargo check`.",
      "Strict prohibition of `.unwrap()` in production route paths.",
      "Custom error enum implementation with `IntoResponse`."
    ],
    faqs: [
      {
        question: "Does this run clippy with warnings denied?",
        answer: "Yes, it encourages zero-warning compilation."
      }
    ],
    relatedSpokes: [
      { formatSlug: "cursor-rules", presetSlug: "rust-axum", label: "Rust Axum Cursor Rules" },
      { formatSlug: "claude-md", presetSlug: "go-fiber", label: "Go Fiber CLAUDE.md" }
    ]
  },

  // ==========================================
  // AGENTS.md MULTI-AGENT SPECIFICATIONS
  // ==========================================
  {
    formatSlug: "agents-md",
    presetSlug: "nextjs-15",
    format: "agents_md",
    presetId: "nextjs-pro",
    title: "Next.js 15 AGENTS.md Generator | Free & Offline",
    description: "Generate a Next.js 15 AGENTS.md specification file for autonomous AI coding agents.",
    category: "Frontend",
    techName: "Next.js 15 Autonomous Agents",
    targetFile: "AGENTS.md",
    whyNeeded: "Autonomous coding agents (such as Antigravity, Devin, Codex) require clear validation gates and scope constraints before making multi-file modifications.",
    keyRules: [
      "Require build verification (`npm run build`) before submitting code.",
      "Enforce React Server Components and Server Actions.",
      "Protect sensitive environment variables and config files."
    ],
    faqs: [
      {
        question: "What agents read AGENTS.md?",
        answer: "Autonomous coding agents, AI pair programmers, and multi-agent IDE systems look for AGENTS.md at the repo root."
      }
    ],
    relatedSpokes: [
      { formatSlug: "cursor-rules", presetSlug: "nextjs-15", label: "Next.js 15 Cursor Rules" },
      { formatSlug: "claude-md", presetSlug: "nextjs-15", label: "Next.js 15 CLAUDE.md" }
    ]
  },
  {
    formatSlug: "agents-md",
    presetSlug: "fastapi",
    format: "agents_md",
    presetId: "fastapi-ai",
    title: "FastAPI AGENTS.md Generator | Free & Offline",
    description: "Generate a Python FastAPI AGENTS.md specification file for autonomous AI coding agents.",
    category: "Backend",
    techName: "Python FastAPI Autonomous Agents",
    targetFile: "AGENTS.md",
    whyNeeded: "Constrains autonomous agents to asynchronous Python routines, Pydantic v2 schemas, and strict pytest verification gates.",
    keyRules: [
      "Require `pytest` to pass with zero failures before task completion.",
      "Enforce async def route handlers and database queries.",
      "Ban modifying production database migrations without explicit user instruction."
    ],
    faqs: [
      {
        question: "Can this prevent destructive DB migrations?",
        answer: "Yes, it sets explicit guardrails forbidding unapproved schema migrations."
      }
    ],
    relatedSpokes: [
      { formatSlug: "cursor-rules", presetSlug: "fastapi", label: "FastAPI Cursor Rules" },
      { formatSlug: "claude-md", presetSlug: "fastapi", label: "FastAPI CLAUDE.md" }
    ]
  },
  {
    formatSlug: "agents-md",
    presetSlug: "fullstack-agent-team",
    format: "agents_md",
    presetId: "fullstack-agent-team",
    title: "Fullstack Multi-Agent Team AGENTS.md Generator | Free & Offline",
    description: "Create a universal multi-agent team AGENTS.md coordinating frontend, backend, and security subagents.",
    category: "Specialist Persona",
    techName: "Multi-Agent System Orchestration",
    targetFile: "AGENTS.md",
    whyNeeded: "When running teams of subagents, clear division of labor and handoff contracts prevent conflicting edits and regression bugs.",
    keyRules: [
      "Define subagent roles: Lead Architect, Frontend Engineer, Backend Specialist, Security Reviewer.",
      "Establish atomic commit requirements and verification gates.",
      "Preserve existing documentation, comments, and project conventions."
    ],
    faqs: [
      {
        question: "Does this support subagent delegation?",
        answer: "Yes, it provides clear boundaries for subagent spawning and role handoffs."
      }
    ],
    relatedSpokes: [
      { formatSlug: "cursor-rules", presetSlug: "cursor-rules-pro", label: "Cursor Rules Pro" },
      { formatSlug: "claude-skills", presetSlug: "codebase-auditor", label: "Codebase Auditor Claude Skill" }
    ]
  },

  // ==========================================
  // MODEL CONTEXT PROTOCOL (MCP) CONFIGS
  // ==========================================
  {
    formatSlug: "mcp-config",
    presetSlug: "github",
    format: "mcp_json",
    presetId: "github",
    title: "GitHub MCP Server Config Generator | Free & Offline",
    description: "Generate a GitHub Model Context Protocol (MCP) server configuration block.",
    category: "MCP Server",
    techName: "GitHub Operations MCP",
    targetFile: "claude_desktop_config.json",
    whyNeeded: "Allows Claude Desktop, Cursor, and Windsurf to search repositories, inspect pull requests, read branches, and create issues safely.",
    keyRules: [
      "Uses official `@modelcontextprotocol/server-github` package via npx.",
      "Requires `GITHUB_PERSONAL_ACCESS_TOKEN` with repo and read permissions.",
      "Enables repository search and issue management without leaving the AI chat."
    ],
    faqs: [
      {
        question: "What token permissions does the GitHub MCP server need?",
        answer: "Generate a Personal Access Token (classic or fine-grained) with `repo` read/write permissions."
      }
    ],
    relatedSpokes: [
      { formatSlug: "mcp-config", presetSlug: "postgres", label: "PostgreSQL MCP Config" },
      { formatSlug: "mcp-config", presetSlug: "filesystem", label: "Filesystem MCP Config" }
    ]
  },
  {
    formatSlug: "mcp-config",
    presetSlug: "postgres",
    format: "mcp_json",
    presetId: "postgres",
    title: "PostgreSQL MCP Server Config Generator | Free & Offline",
    description: "Generate a PostgreSQL Model Context Protocol (MCP) server configuration block.",
    category: "MCP Server",
    techName: "PostgreSQL Database MCP",
    targetFile: "claude_desktop_config.json",
    whyNeeded: "Enables your AI assistant to read database schemas, explain query execution plans, and write accurate SQL queries directly against your Postgres database.",
    keyRules: [
      "Uses `@modelcontextprotocol/server-postgres`.",
      "Pass connection string securely via command arguments or environment variables.",
      "Recommended to use a read-only database user for development inspection."
    ],
    faqs: [
      {
        question: "Is it safe to connect my production database?",
        answer: "It is best practice to connect a local development or read-only staging database replica."
      }
    ],
    relatedSpokes: [
      { formatSlug: "cursor-rules", presetSlug: "supabase", label: "Supabase Cursor Rules" },
      { formatSlug: "mcp-config", presetSlug: "sqlite", label: "SQLite MCP Config" }
    ]
  },
  {
    formatSlug: "mcp-config",
    presetSlug: "filesystem",
    format: "mcp_json",
    presetId: "filesystem",
    title: "Filesystem MCP Server Config Generator | Free & Offline",
    description: "Generate a local Filesystem Model Context Protocol (MCP) server configuration block.",
    category: "MCP Server",
    techName: "Local Filesystem MCP",
    targetFile: "claude_desktop_config.json",
    whyNeeded: "Grants Claude Desktop secure, sandboxed access to read and edit files in specified local folders on your computer.",
    keyRules: [
      "Uses `@modelcontextprotocol/server-filesystem`.",
      "Scope access strictly to specific project folders (e.g. `./` or `/Users/name/Projects`).",
      "Prevents access to unauthorized directories outside the declared path."
    ],
    faqs: [
      {
        question: "Can I grant access to multiple directories?",
        answer: "Yes, pass additional directory paths as arguments in the args array."
      }
    ],
    relatedSpokes: [
      { formatSlug: "mcp-config", presetSlug: "github", label: "GitHub MCP Config" },
      { formatSlug: "mcp-config", presetSlug: "sqlite", label: "SQLite MCP Config" }
    ]
  },
  {
    formatSlug: "mcp-config",
    presetSlug: "sqlite",
    format: "mcp_json",
    presetId: "sqlite",
    title: "SQLite MCP Server Config Generator | Free & Offline",
    description: "Generate a local SQLite Model Context Protocol (MCP) server config for Claude and Cursor.",
    category: "MCP Server",
    techName: "SQLite Database MCP",
    targetFile: "claude_desktop_config.json",
    whyNeeded: "Allows AI assistants to query local `.db` and `.sqlite` files, inspect tables, and execute lightweight SQL queries locally.",
    keyRules: [
      "Uses `mcp-server-sqlite` via uvx or npx.",
      "Specify absolute path to your local `.db` file.",
      "Operates 100% offline with zero cloud connection required."
    ],
    faqs: [
      {
        question: "How do I specify the database path?",
        answer: "Add `--db-path /path/to/your/database.sqlite` in the server arguments."
      }
    ],
    relatedSpokes: [
      { formatSlug: "mcp-config", presetSlug: "postgres", label: "PostgreSQL MCP Config" },
      { formatSlug: "mcp-config", presetSlug: "filesystem", label: "Filesystem MCP Config" }
    ]
  },
  {
    formatSlug: "mcp-config",
    presetSlug: "brave-search",
    format: "mcp_json",
    presetId: "brave-search",
    title: "Brave Search MCP Server Config Generator | Free & Offline",
    description: "Generate a Brave Search Model Context Protocol (MCP) server config for live web access.",
    category: "MCP Server",
    techName: "Brave Web Search MCP",
    targetFile: "claude_desktop_config.json",
    whyNeeded: "Equips your AI agent with real-time web search capabilities to discover up-to-date documentation, APIs, and release notes.",
    keyRules: [
      "Uses `@modelcontextprotocol/server-brave-search`.",
      "Requires free or paid `BRAVE_API_KEY` from brave.com/search/api.",
      "Enables queries without telemetry or search tracking."
    ],
    faqs: [
      {
        question: "Where do I get a Brave Search API key?",
        answer: "Sign up at brave.com/search/api; Brave provides a generous free tier for developers."
      }
    ],
    relatedSpokes: [
      { formatSlug: "mcp-config", presetSlug: "fetch", label: "Web Fetch MCP Config" },
      { formatSlug: "mcp-config", presetSlug: "github", label: "GitHub MCP Config" }
    ]
  },
  {
    formatSlug: "mcp-config",
    presetSlug: "fetch",
    format: "mcp_json",
    presetId: "fetch",
    title: "Web Fetch & Markdown MCP Server Config | Free & Offline",
    description: "Generate a Web Fetch MCP server configuration block to parse web pages into markdown.",
    category: "MCP Server",
    techName: "Web Fetch & Markdown MCP",
    targetFile: "claude_desktop_config.json",
    whyNeeded: "Fetches remote web documentation, API references, and HTML pages, converting them into clean token-efficient markdown for LLM comprehension.",
    keyRules: [
      "Uses `mcp-server-fetch` via uvx.",
      "Converts raw HTML into clean, stripped markdown.",
      "Enables the AI to read docs URLs provided in prompts."
    ],
    faqs: [
      {
        question: "Does Fetch execute JavaScript on pages?",
        answer: "No, it fetches standard HTTP responses and parses static HTML into markdown for high speed and low resource usage."
      }
    ],
    relatedSpokes: [
      { formatSlug: "mcp-config", presetSlug: "brave-search", label: "Brave Search MCP Config" },
      { formatSlug: "mcp-config", presetSlug: "puppeteer", label: "Puppeteer MCP Config" }
    ]
  },
  {
    formatSlug: "mcp-config",
    presetSlug: "puppeteer",
    format: "mcp_json",
    presetId: "puppeteer",
    title: "Puppeteer Browser Automation MCP Server Config",
    description: "Generate a Puppeteer Model Context Protocol (MCP) server config for headless browser automation.",
    category: "MCP Server",
    techName: "Puppeteer Browser MCP",
    targetFile: "claude_desktop_config.json",
    whyNeeded: "Empowers AI assistants to interact with JavaScript-heavy SPAs, capture web screenshots, and run client-side end-to-end browser workflows.",
    keyRules: [
      "Uses `@modelcontextprotocol/server-puppeteer`.",
      "Launches headless Chromium to render dynamic client-side applications.",
      "Allows taking full-page screenshots and executing page console clicks."
    ],
    faqs: [
      {
        question: "Does this require Chrome installed?",
        answer: "Puppeteer automatically downloads a compatible Chromium binary on initial launch."
      }
    ],
    relatedSpokes: [
      { formatSlug: "mcp-config", presetSlug: "fetch", label: "Web Fetch MCP Config" },
      { formatSlug: "mcp-config", presetSlug: "brave-search", label: "Brave Search MCP Config" }
    ]
  },
  {
    formatSlug: "mcp-config",
    presetSlug: "docker",
    format: "mcp_json",
    presetId: "docker",
    title: "Docker MCP Server Config Generator | Free & Offline",
    description: "Generate a Docker Model Context Protocol (MCP) server config for container inspection.",
    category: "MCP Server",
    techName: "Docker Engine MCP",
    targetFile: "claude_desktop_config.json",
    whyNeeded: "Allows AI assistants to list containers, inspect Docker images, view container logs, and troubleshoot local services directly.",
    keyRules: [
      "Connects to local Docker socket (`/var/run/docker.sock` or Windows named pipe).",
      "Inspects active container states, environment variables, and log streams.",
      "Helps diagnose container crashes and service startup failures."
    ],
    faqs: [
      {
        question: "Does Docker Desktop need to be running?",
        answer: "Yes, Docker Desktop or the Docker daemon must be running locally."
      }
    ],
    relatedSpokes: [
      { formatSlug: "cursor-rules", presetSlug: "docker-devops", label: "Docker Cursor Rules" },
      { formatSlug: "mcp-config", presetSlug: "postgres", label: "PostgreSQL MCP Config" }
    ]
  },
  {
    formatSlug: "mcp-config",
    presetSlug: "memory",
    format: "mcp_json",
    presetId: "memory",
    title: "Knowledge Graph Memory MCP Server Config | Free & Offline",
    description: "Generate a Knowledge Graph Memory MCP server configuration block for persistent agent recall.",
    category: "MCP Server",
    techName: "Knowledge Graph Memory MCP",
    targetFile: "claude_desktop_config.json",
    whyNeeded: "Provides persistent graph-based entity memory across agent coding sessions, retaining architectural context.",
    keyRules: [
      "Uses `@modelcontextprotocol/server-memory`.",
      "Maintains persistent JSON knowledge graph.",
      "Stores relations and entity observations across conversations."
    ],
    faqs: [
      {
        question: "Where is knowledge graph memory stored?",
        answer: "It persists automatically to your local application data directory."
      }
    ],
    relatedSpokes: [
      { formatSlug: "mcp-config", presetSlug: "github", label: "GitHub MCP Config" },
      { formatSlug: "mcp-config", presetSlug: "fetch", label: "Fetch MCP Config" }
    ]
  }
];

export const SLUG_ALIASES: Record<string, string> = {
  "fastapi-ai": "fastapi",
  "fastapi-ai-backend": "fastapi",
  "claude-auditor": "codebase-auditor",
  "nextjs": "nextjs-15",
  "nextjs-fullstack-pro": "nextjs-15",
  "react": "react-19",
  "react-modern-spa": "react-19",
  "tailwind": "tailwind-v4",
  "tailwind-v4-styling": "tailwind-v4",
  "cursor-pro": "cursor-rules-pro",
  "postgresql": "postgres",
};

// Base presets list for universal multi-format synthesis
const BASE_CODE_SLUGS = [
  "nextjs-15",
  "react-19",
  "fastapi",
  "supabase",
  "prisma",
  "drizzle",
  "go-fiber",
  "rust-axum",
  "tailwind-v4",
  "vue-nuxt",
  "sveltekit",
  "cursor-rules-pro",
  "vibe-coder",
  "security-guard",
  "docker-devops",
  "tdd-specialist",
  "codebase-auditor",
  "fullstack-agent-team",
];

const MCP_SLUGS = [
  "github",
  "postgres",
  "brave-search",
  "fetch",
  "puppeteer",
  "docker",
  "filesystem",
  "sqlite",
  "memory",
];

function synthesizeRouteForFormat(
  formatSlug: string,
  presetSlug: string
): ProgrammaticPresetRoute | null {
  const normalizedPreset = SLUG_ALIASES[presetSlug] || presetSlug;

  // Find any route with this presetSlug across the registry as a template
  const baseRoute = PRESET_ROUTES.find(
    (r) => r.presetSlug === normalizedPreset || r.presetSlug === presetSlug
  );

  if (!baseRoute) return null;

  if (formatSlug === "mcp-config") {
    if (baseRoute.format === "mcp_json") {
      return { ...baseRoute, formatSlug: "mcp-config", presetSlug };
    }
    return null;
  }

  // Synthesis for code rule formats: cursor-rules, claude-skills, claude-md, agents-md
  let format: OutputFormat = "cursor_mdc";
  let targetFile = `.cursor/rules/${normalizedPreset}.mdc`;
  let title = `${baseRoute.techName} Cursor Rules Generator (.mdc) | Free & Offline`;
  let desc = `Generate production-grade Cursor rules (.mdc) for ${baseRoute.techName}.`;

  if (formatSlug === "claude-skills") {
    format = "skill_md";
    targetFile = `.claude/skills/${normalizedPreset}/SKILL.md`;
    title = `${baseRoute.techName} Claude Skill (.md) | Free & Offline`;
    desc = `Generate a specialized Claude Code skill (SKILL.md) for ${baseRoute.techName}.`;
  } else if (formatSlug === "claude-md") {
    format = "claude_md";
    targetFile = "CLAUDE.md";
    title = `${baseRoute.techName} CLAUDE.md Generator | Free & Offline`;
    desc = `Generate a ${baseRoute.techName} CLAUDE.md repository guideline for Claude Code.`;
  } else if (formatSlug === "agents-md") {
    format = "agents_md";
    targetFile = "AGENTS.md";
    title = `${baseRoute.techName} AGENTS.md Generator | Free & Offline`;
    desc = `Generate an AGENTS.md multi-agent specification for ${baseRoute.techName}.`;
  }

  return {
    ...baseRoute,
    formatSlug,
    presetSlug,
    format,
    targetFile,
    title,
    description: desc,
  };
}

export function getAllDynamicPresetRoutes(): { formatSlug: string; presetSlug: string }[] {
  const set = new Set<string>();
  const results: { formatSlug: string; presetSlug: string }[] = [];

  const addRoute = (formatSlug: string, presetSlug: string) => {
    const key = `${formatSlug}/${presetSlug}`;
    if (!set.has(key)) {
      set.add(key);
      results.push({ formatSlug, presetSlug });
    }
  };

  // Add all static routes from PRESET_ROUTES first
  for (const r of PRESET_ROUTES) {
    addRoute(r.formatSlug, r.presetSlug);
  }

  const codeFormats = ["cursor-rules", "claude-skills", "claude-md", "agents-md"];
  for (const fmt of codeFormats) {
    for (const slug of BASE_CODE_SLUGS) {
      addRoute(fmt, slug);
    }
  }

  for (const mcpSlug of MCP_SLUGS) {
    addRoute("mcp-config", mcpSlug);
  }

  return results;
}

export function getPresetRouteMetadata(formatSlug: string, presetSlug: string): Metadata | null {
  const route = getPresetBySlug(formatSlug, presetSlug);
  if (!route) return null;
  
  const canonicalPresetSlug = SLUG_ALIASES[presetSlug] || presetSlug;

  return {
    title: route.title,
    description: route.description,
    openGraph: {
      title: route.title,
      description: route.description,
      type: "website",
      siteName: "DevScratchpad",
      locale: "en_US",
      url: `https://www.devscratchpad.tech/ai-skill-studio/${formatSlug}/${canonicalPresetSlug}`,
      images: [
        {
          url: "https://www.devscratchpad.tech/og-ai-skill-studio.png",
          secureUrl: "https://www.devscratchpad.tech/og-ai-skill-studio.png",
          width: 1200,
          height: 630,
          alt: route.title,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: route.title,
      description: route.description,
      images: ["https://www.devscratchpad.tech/og-ai-skill-studio.png"],
    },
    alternates: {
      canonical: `https://www.devscratchpad.tech/ai-skill-studio/${formatSlug}/${canonicalPresetSlug}`,
    },
  };
}

export function getPresetsByFormat(formatSlug: string): ProgrammaticPresetRoute[] {
  if (formatSlug === "mcp-config") {
    return PRESET_ROUTES.filter((r) => r.formatSlug === "mcp-config");
  }

  const routes: ProgrammaticPresetRoute[] = [];
  for (const slug of BASE_CODE_SLUGS) {
    const r = getPresetBySlug(formatSlug, slug);
    if (r) routes.push(r);
  }
  return routes;
}

export function getPresetBySlug(formatSlug: string, presetSlug: string): ProgrammaticPresetRoute | null {
  // 1. Direct match
  const direct = PRESET_ROUTES.find((r) => r.formatSlug === formatSlug && r.presetSlug === presetSlug);
  if (direct) return direct;

  // 2. Alias match in PRESET_ROUTES
  const normalized = SLUG_ALIASES[presetSlug] || presetSlug;
  const aliasMatch = PRESET_ROUTES.find((r) => r.formatSlug === formatSlug && r.presetSlug === normalized);
  if (aliasMatch) {
    return { ...aliasMatch, presetSlug };
  }

  // 3. Multi-format synthesis
  return synthesizeRouteForFormat(formatSlug, presetSlug);
}
