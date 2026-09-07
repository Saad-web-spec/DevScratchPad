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
  {
    formatSlug: "cursor-rules",
    presetSlug: "python-django",
    format: "cursor_mdc",
    presetId: "python-django",
    title: "Django 5 Cursor Rules (.mdc) | Async ORM & Ninja API Generator",
    description: "Generate production Django 5 Cursor rules enforcing async ORM queries, Django Ninja typed schemas, strict migrations, and query optimization.",
    category: "Backend",
    techName: "Django 5 & Ninja / DRF",
    targetFile: ".cursor/rules/python-django.mdc",
    whyNeeded: "Django 5 introduces asynchronous ORM methods, generated model fields, and modern API patterns via Django Ninja and DRF. LLMs constantly hallucinate synchronous N+1 queries inside async views, unparameterized raw SQL, and unmanaged migration modifications.",
    keyRules: [
      "Use asynchronous ORM operations (aget(), acreate(), afirst()) inside async def view handlers.",
      "Prevent N+1 query catastrophes: always apply select_related() for ForeignKey/OneToOne and prefetch_related() for ManyToMany/reverse relationships.",
      "Enforce Django Ninja schemas or DRF serializers with explicit field typing; never return raw unvalidated model instances.",
      "Never alter existing committed migration files; generate new sequential migrations via python manage.py makemigrations.",
      "Leverage Django 5 GeneratedField for computed database columns rather than redundant model save() recalculations."
    ],
    exampleGood: `from ninja import Router, Schema
from django.shortcuts import aget_object_or_404
from .models import Article

router = Router()

class ArticleOut(Schema):
    id: int
    title: str
    author_name: str

@router.get("/articles/{article_id}", response=ArticleOut)
async def get_article(request, article_id: int):
    # Asynchronous fetch with joined relationship preventing N+1
    article = await Article.objects.select_related("author").aget(id=article_id)
    return {
        "id": article.id,
        "title": article.title,
        "author_name": article.author.username,
    }`,
    exampleBad: `# Discouraged: Synchronous blocking query inside async context & N+1 queries
@router.get("/articles/{article_id}")
async def get_article(request, article_id: int):
    article = Article.objects.get(id=article_id)  # Synchronous blocking call!
    return {"id": article.id, "title": article.title, "author": article.author.username}  # N+1 DB hit!`,
    faqs: [
      {
        question: "Does this enforce Django 5 async ORM conventions?",
        answer: "Yes, it guides the model to use aget(), afilter(), and acreate() in async view functions."
      },
      {
        question: "Can this be used with Django REST Framework or Django Ninja?",
        answer: "Yes, it supports both DRF serializers and modern Pydantic-powered Django Ninja endpoints."
      }
    ],
    relatedSpokes: [
      { formatSlug: "claude-skills", presetSlug: "python-django", label: "Django 5 Claude Skill" },
      { formatSlug: "claude-md", presetSlug: "python-django", label: "Django 5 CLAUDE.md" },
      { formatSlug: "agents-md", presetSlug: "python-django", label: "Django 5 AGENTS.md" },
      { formatSlug: "cursor-rules", presetSlug: "fastapi", label: "FastAPI Cursor Rules" },
      { formatSlug: "mcp-config", presetSlug: "postgres", label: "PostgreSQL MCP Config" }
    ]
  },
  {
    formatSlug: "cursor-rules",
    presetSlug: "bun-elysia",
    format: "cursor_mdc",
    presetId: "bun-elysia",
    title: "Bun & Elysia Cursor Rules (.mdc) | High-Performance TypeScript Backend",
    description: "Generate Bun and Elysia.js Cursor rules enforcing TypeBox schema validation, Eden Treaty client type safety, and zero-overhead native Bun APIs.",
    category: "Backend",
    techName: "Bun & Elysia / Hono",
    targetFile: ".cursor/rules/bun-elysia.mdc",
    whyNeeded: "Bun and Elysia provide blazingly fast HTTP backends with TypeBox runtime validation and end-to-end type safety. Outdated AI models frequently hallucinate Node.js core modules, slow express-style middlewares, and redundant JSON serialization.",
    keyRules: [
      "Use Elysia's native t schema builder (powered by TypeBox) for request body, query, and parameter validation.",
      "Leverage native Bun.serve(), Bun.file(), and Bun.password instead of slow Node.js polyfills or external dependencies.",
      "Structure plugins using .use() and define explicit Eden Treaty contracts for frontend consumption.",
      "Handle application errors using Elysia .onError(({ code, error, set }) => ...) with typed error codes.",
      "Ensure zero unhandled promise rejections and use strict type inference for all endpoint responses."
    ],
    exampleGood: `import { Elysia, t } from "elysia";

export const app = new Elysia()
  .onError(({ code, set }) => {
    if (code === "NOT_FOUND") {
      set.status = 404;
      return { ok: false, error: "Resource not found" };
    }
  })
  .post(
    "/api/users",
    async ({ body, set }) => {
      const hash = await Bun.password.hash(body.password);
      set.status = 201;
      return { ok: true, email: body.email };
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 8 }),
      }),
    }
  );`,
    exampleBad: `// Discouraged: Node.js bcrypt imports, unvalidated body, and Express paradigms
import bcrypt from "bcrypt";
app.post("/users", async (req: any, res: any) => {
  const hash = await bcrypt.hash(req.body.password, 10);
  res.json({ success: true });
});`,
    faqs: [
      {
        question: "Why use TypeBox instead of Zod with Elysia?",
        answer: "Elysia is tightly integrated with TypeBox through its t builder, which compiles to high-performance JavaScript validators that are orders of magnitude faster than runtime reflection."
      },
      {
        question: "Is this rulebook compatible with Hono on Bun?",
        answer: "Yes, the conventions for native Bun APIs, context extractors, and edge TypeScript performance apply smoothly to Hono as well."
      }
    ],
    relatedSpokes: [
      { formatSlug: "claude-skills", presetSlug: "bun-elysia", label: "Bun & Elysia Claude Skill" },
      { formatSlug: "claude-md", presetSlug: "bun-elysia", label: "Bun & Elysia CLAUDE.md" },
      { formatSlug: "cursor-rules", presetSlug: "nextjs-15", label: "Next.js 15 Cursor Rules" },
      { formatSlug: "cursor-rules", presetSlug: "drizzle", label: "Drizzle ORM Cursor Rules" }
    ]
  },
  {
    formatSlug: "cursor-rules",
    presetSlug: "react-native-expo",
    format: "cursor_mdc",
    presetId: "react-native-expo",
    title: "Expo & React Native Cursor Rules (.mdc) | Modern Mobile Architecture",
    description: "Generate Expo Router and React Native Cursor rules enforcing file-based routing, New Architecture (Fabric/TurboModules), and safe native layouts.",
    category: "Frontend",
    techName: "React Native & Expo Router",
    targetFile: ".cursor/rules/expo.mdc",
    whyNeeded: "Modern React Native uses Expo Router v3/v4 with file-based layout groups (app/(tabs)), typed routes, and React Native New Architecture (Fabric/TurboModules). LLMs constantly generate obsolete React Navigation Stack wrappers, deprecated AsyncStorage imports, and un-safe-area layout overflows.",
    keyRules: [
      "Use Expo Router file-based filesystem routing (app/_layout.tsx, app/(tabs)/index.tsx); ban legacy React Navigation container boilerplate.",
      "Enforce react-native-safe-area-context (useSafeAreaInsets or SafeAreaView) for all top-level mobile screen boundaries.",
      "Use modern Expo SDK native modules (expo-image, expo-secure-store, expo-crypto) instead of unmaintained bare native packages.",
      "Optimize for React Native New Architecture (Fabric renderer): avoid synchronous layout measurements in render passes.",
      "Always test cross-platform styling on both iOS and Android (e.g. elevation vs shadowColor, notch handling)."
    ],
    exampleGood: `import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Image
        source={{ uri: "https://example.com/avatar.png" }}
        style={styles.avatar}
        contentFit="cover"
        transition={200}
      />
      <Text style={styles.title}>User Profile</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  title: { fontSize: 20, fontWeight: "600", marginTop: 12 },
});`,
    exampleBad: `// Discouraged: Missing safe-area insets, slow standard Image component, obsolete navigation prop
export default function BadProfile({ navigation }: any) {
  return (
    <div style={{ marginTop: 50 }}>
      <img src="avatar.png" />
      <button onClick={() => navigation.navigate("Home")}>Go</button>
    </div>
  );
}`,
    faqs: [
      {
        question: "Does this support Expo Router v3 and v4?",
        answer: "Yes, it enforces typed routes, layout groups (tabs), and useLocalSearchParams."
      },
      {
        question: "Why use expo-image over React Native Image?",
        answer: "expo-image provides hardware decoding, progressive loading, blurhash previews, and superior memory caching on iOS and Android."
      }
    ],
    relatedSpokes: [
      { formatSlug: "claude-skills", presetSlug: "react-native-expo", label: "Expo React Native Claude Skill" },
      { formatSlug: "claude-md", presetSlug: "react-native-expo", label: "Expo React Native CLAUDE.md" },
      { formatSlug: "cursor-rules", presetSlug: "react-19", label: "React 19 Cursor Rules" },
      { formatSlug: "cursor-rules", presetSlug: "flutter-dart", label: "Flutter Dart Cursor Rules" }
    ]
  },
  {
    formatSlug: "cursor-rules",
    presetSlug: "flutter-dart",
    format: "cursor_mdc",
    presetId: "flutter-dart",
    title: "Flutter & Riverpod Cursor Rules (.mdc) | Modern Dart 3 Mobile Generator",
    description: "Generate Flutter 3 and Riverpod Cursor rules enforcing sound null safety, pattern matching, immutable widgets, and clean reactive state.",
    category: "Frontend",
    techName: "Flutter 3 & Riverpod / Dart",
    targetFile: ".cursor/rules/flutter.mdc",
    whyNeeded: "Flutter 3 and Dart 3 introduce records, pattern matching, sealed classes, and Riverpod 2 code generation (@riverpod). AI models routinely emit obsolete setState() spaghetti, mutable widget state, un-const constructors, and legacy Riverpod syntax.",
    keyRules: [
      "Always add const constructors wherever possible to maximize Flutter element rebuild caching.",
      "Use Riverpod 2 with code generation (@riverpod / NotifierProvider) or BLoC; ban raw mutable setState() in business logic.",
      "Leverage Dart 3 pattern matching and sealed classes for exhaustive state and error representation.",
      "Enforce sound null safety: avoid force-unwrapping with ! unless proven non-null by a preceding guard clause.",
      "Separate presentation UI widgets from asynchronous repository and API service layers."
    ],
    exampleGood: `import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

@immutable
sealed class ViewState<T> {
  const ViewState();
}
class Loading<T> extends ViewState<T> { const Loading(); }
class Success<T> extends ViewState<T> { final T data; const Success(this.data); }
class Failure<T> extends ViewState<T> { final String message; const Failure(this.message); }

class ProfileView extends ConsumerWidget {
  const ProfileView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(profileProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: switch (state) {
        Loading() => const Center(child: CircularProgressIndicator.adaptive()),
        Success(:final data) => Center(child: Text('Welcome, \${data.name}')),
        Failure(:final message) => Center(child: Text('Error: \$message')),
      },
    );
  }
}`,
    exampleBad: `// Discouraged: Mutable setState with force-unwrap and missing const
class BadProfile extends StatefulWidget {
  @override
  _BadProfileState createState() => _BadProfileState();
}
class _BadProfileState extends State<BadProfile> {
  var user;
  void load() async {
    user = await fetchUser();
    setState(() {});
  }
  @override
  Widget build(BuildContext context) {
    return Container(child: Text(user!.name)); // Runtime crash if null!
  }
}`,
    faqs: [
      {
        question: "Does this rulebook support Riverpod 2 and BLoC?",
        answer: "Yes, it provides architecture rules for both modern code-generated Riverpod and idiomatic BLoC/Cubit event streams."
      },
      {
        question: "Why does it require const constructors?",
        answer: "In Flutter, const widgets short-circuit the rebuild tree, providing substantial UI frame-rate gains especially on mobile devices."
      }
    ],
    relatedSpokes: [
      { formatSlug: "claude-skills", presetSlug: "flutter-dart", label: "Flutter Dart Claude Skill" },
      { formatSlug: "claude-md", presetSlug: "flutter-dart", label: "Flutter Dart CLAUDE.md" },
      { formatSlug: "cursor-rules", presetSlug: "react-native-expo", label: "React Native Expo Cursor Rules" },
      { formatSlug: "cursor-rules", presetSlug: "cursor-rules-pro", label: "Cursor Rules Pro" }
    ]
  },
  {
    formatSlug: "cursor-rules",
    presetSlug: "kubernetes-helm",
    format: "cursor_mdc",
    presetId: "kubernetes-helm",
    title: "Kubernetes & Helm Cursor Rules (.mdc) | Cloud-Native Manifest Validator",
    description: "Generate Kubernetes and Helm chart Cursor rules enforcing resource limits, security contexts, readiness/liveness probes, and lint standards.",
    category: "DevOps & Tooling",
    techName: "Kubernetes & Helm Charts",
    targetFile: ".cursor/rules/kubernetes.mdc",
    whyNeeded: "AI models frequently write dangerous Kubernetes manifests with missing CPU/memory limits, root privilege escalation, missing health probes, and invalid Helm template whitespace indentation, causing cluster outages or CVE vulnerabilities.",
    keyRules: [
      "Always specify explicit resources.requests and resources.limits (both CPU and memory) on every container.",
      "Enforce strict security contexts: readOnlyRootFilesystem: true, runAsNonRoot: true, and allowPrivilegeEscalation: false.",
      "Mandate both livenessProbe and readinessProbe with appropriate initialDelaySeconds on deployment workloads.",
      "Validate Helm template indentation using nindent filters (e.g. toYaml . | nindent 8) to eliminate YAML formatting corruption.",
      "Configure PodDisruptionBudgets (PDB) and topology spread constraints for multi-node high availability."
    ],
    exampleGood: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-service
  labels:
    app.kubernetes.io/name: api-service
spec:
  replicas: 3
  template:
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 10001
      containers:
        - name: api
          image: registry.example.com/api:v1.4.0
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 512Mi
          readinessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 5`,
    exampleBad: `# Dangerous: No resource constraints, root container, missing probes
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bad-service
spec:
  template:
    spec:
      containers:
        - name: app
          image: myapp:latest # Mutable tag and unconstrained limits!`,
    faqs: [
      {
        question: "Does this rulebook enforce resource requests and limits?",
        answer: "Yes, it requires explicit CPU and memory boundaries to prevent OOMKilled cascade failures."
      },
      {
        question: "Can this rule be applied to Helm templates?",
        answer: "Yes, it covers Helm values.yaml schema constraints and helper template indentation rules."
      }
    ],
    relatedSpokes: [
      { formatSlug: "claude-skills", presetSlug: "kubernetes-helm", label: "Kubernetes Helm Claude Skill" },
      { formatSlug: "claude-md", presetSlug: "kubernetes-helm", label: "Kubernetes Helm CLAUDE.md" },
      { formatSlug: "cursor-rules", presetSlug: "terraform-iac", label: "Terraform IaC Cursor Rules" },
      { formatSlug: "cursor-rules", presetSlug: "docker-devops", label: "Docker DevOps Cursor Rules" },
      { formatSlug: "mcp-config", presetSlug: "docker", label: "Docker MCP Config" }
    ]
  },
  {
    formatSlug: "cursor-rules",
    presetSlug: "terraform-iac",
    format: "cursor_mdc",
    presetId: "terraform-iac",
    title: "Terraform & OpenTofu Cursor Rules (.mdc) | Cloud Infrastructure as Code",
    description: "Generate Terraform and OpenTofu Cursor rules enforcing remote state locking, provider version pinning, tag propagation, and tfsec compliance.",
    category: "DevOps & Tooling",
    techName: "Terraform & OpenTofu IaC",
    targetFile: ".cursor/rules/terraform.mdc",
    whyNeeded: "Cloud infrastructure provisioning through AI often leads to catastrophic resource destruction, unpinned provider versions, missing remote state locks, and hardcoded plaintext credentials.",
    keyRules: [
      "Pin explicit version constraints for all providers and required Terraform/OpenTofu core versions (required_providers).",
      "Store state securely in remote backends (S3 with DynamoDB state locking or GCS/Terraform Cloud); ban local terraform.tfstate.",
      "Enforce mandatory resource tagging (Environment, Project, Owner, ManagedBy) on all provisioned cloud assets.",
      "Never hardcode secrets, API keys, or master database passwords; inject via secure variables with sensitive = true or secret managers.",
      "Declare explicit lifecycle { prevent_destroy = true } blocks on critical production databases and storage buckets."
    ],
    exampleGood: `terraform {
  required_version = ">= 1.7.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40"
    }
  }
  backend "s3" {
    bucket         = "corp-tf-state-prod"
    key            = "vpc/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}

resource "aws_db_instance" "primary" {
  identifier          = "app-db-prod"
  allocated_storage   = 50
  engine              = "postgres"
  instance_class      = "db.r6g.large"
  password            = var.db_password
  skip_final_snapshot = false
  
  lifecycle {
    prevent_destroy = true
  }
}`,
    exampleBad: `# Dangerous: Hardcoded secret, no version lock, unmanaged state
resource "aws_db_instance" "bad_db" {
  engine   = "postgres"
  password = "plaintextpassword123" # Leaked credentials in git!
}`,
    faqs: [
      {
        question: "Does this rulebook support OpenTofu?",
        answer: "Yes, OpenTofu is fully compatible with standard Terraform HCL and shares identical provider pinning standards."
      },
      {
        question: "How does it handle secret management?",
        answer: "It mandates that all secret variables declare sensitive = true and prohibits hardcoded tokens in .tf source files."
      }
    ],
    relatedSpokes: [
      { formatSlug: "claude-skills", presetSlug: "terraform-iac", label: "Terraform IaC Claude Skill" },
      { formatSlug: "claude-md", presetSlug: "terraform-iac", label: "Terraform IaC CLAUDE.md" },
      { formatSlug: "cursor-rules", presetSlug: "kubernetes-helm", label: "Kubernetes Helm Cursor Rules" },
      { formatSlug: "cursor-rules", presetSlug: "docker-devops", label: "Docker DevOps Cursor Rules" }
    ]
  },
  {
    formatSlug: "cursor-rules",
    presetSlug: "playwright-e2e",
    format: "cursor_mdc",
    presetId: "playwright-e2e",
    title: "Playwright E2E Cursor Rules (.mdc) | Resilient Browser Automation",
    description: "Generate Playwright Cursor rules enforcing user-facing locators (getByRole, getByText), auto-waiting assertions, page object models, and zero sleep() calls.",
    category: "DevOps & Tooling",
    techName: "Playwright End-to-End Testing",
    targetFile: ".cursor/rules/playwright.mdc",
    whyNeeded: "AI models frequently write fragile test automation scripts with brittle CSS/XPath selectors (e.g. div > span:nth-child(3)), hardcoded page.waitForTimeout() delays, and un-isolated test state, leading to flaky test suites.",
    keyRules: [
      "Strictly ban hardcoded delays (page.waitForTimeout()); rely exclusively on Playwright web-first auto-waiting assertions (expect(locator).toBeVisible()).",
      "Prioritize user-facing accessible locators: page.getByRole(), page.getByLabel(), and page.getByTestId(); never write fragile CSS selectors or brittle XPaths.",
      "Encapsulate multi-step interactions inside modular Page Object Models (POM) with typed parameters.",
      "Ensure total test isolation: authenticate via storage state (storageState) instead of repeating manual UI logins in every test.",
      "Configure trace viewer and video capture on first retry (trace: 'on-first-retry') for painless CI debugging."
    ],
    exampleGood: `import { test, expect } from "@playwright/test";

test.describe("Checkout Flow", () => {
  test("allows user to complete cart purchase", async ({ page }) => {
    await page.goto("/catalog");
    
    // Accessible, user-facing locators
    await page.getByRole("button", { name: "Add to Cart" }).first().click();
    await page.getByRole("link", { name: "Cart (1)" }).click();
    
    // Auto-waiting assertions
    await expect(page.getByRole("heading", { name: "Your Shopping Cart" })).toBeVisible();
    await page.getByRole("button", { name: "Proceed to Checkout" }).click();
    
    await expect(page).toHaveURL(/.*checkout/);
  });
});`,
    exampleBad: `// Flaky: Brittle selectors, arbitrary sleep timeouts, and no auto-waiting
test("bad test", async ({ page }) => {
  await page.goto("/catalog");
  await page.click("div.col-md-4 > button:nth-child(2)"); // Breaks on minor CSS tweak!
  await page.waitForTimeout(5000); // Flaky anti-pattern!
  const text = await page.innerText("#cart-total");
  expect(text).toBe("1");
});`,
    faqs: [
      {
        question: "Why are arbitrary sleep timeouts banned?",
        answer: "Arbitrary delays like waitForTimeout waste CI test execution time and still fail randomly under variable network latency. Playwright auto-waiting assertions check conditions dynamically."
      },
      {
        question: "Why use getByRole instead of class names?",
        answer: "getByRole verifies that elements are accessible to screen readers and resilient to CSS redesigns."
      }
    ],
    relatedSpokes: [
      { formatSlug: "claude-skills", presetSlug: "playwright-e2e", label: "Playwright E2E Claude Skill" },
      { formatSlug: "claude-md", presetSlug: "playwright-e2e", label: "Playwright E2E CLAUDE.md" },
      { formatSlug: "cursor-rules", presetSlug: "tdd-specialist", label: "TDD Specialist Cursor Rules" },
      { formatSlug: "cursor-rules", presetSlug: "react-19", label: "React 19 Cursor Rules" },
      { formatSlug: "mcp-config", presetSlug: "puppeteer", label: "Puppeteer MCP Config" }
    ]
  },
  {
    formatSlug: "cursor-rules",
    presetSlug: "spring-boot-3",
    format: "cursor_mdc",
    presetId: "spring-boot-3",
    title: "Spring Boot 3 & Java 21 Cursor Rules (.mdc) | Modern Enterprise Java",
    description: "Generate Spring Boot 3 and Java 21 Cursor rules enforcing record DTOs, virtual threads (Project Loom), Jakarta EE 10 namespaces, and Spring Data JPA standards.",
    category: "Backend",
    techName: "Spring Boot 3 & Java 21",
    targetFile: ".cursor/rules/spring-boot-3.mdc",
    whyNeeded: "Spring Boot 3 requires Java 17+ (ideally Java 21) and migrates all packages from javax.* to jakarta.*. AI models trained on legacy Java code constantly hallucinate deprecated javax.persistence imports, bulky Lombok boilerplate instead of Java Records, and legacy WebSecurityConfigurerAdapter classes.",
    keyRules: [
      "Use jakarta.* packages for persistence, validation, and servlets; ban legacy javax.* imports.",
      "Represent immutable request/response DTOs using native Java Records with Jakarta validation annotations.",
      "Enable Java 21 Virtual Threads (spring.threads.virtual.enabled=true) for high-throughput non-blocking I/O.",
      "Configure Spring Security using the modern SecurityFilterChain bean approach; never extend deprecated WebSecurityConfigurerAdapter.",
      "Avoid N+1 queries in Spring Data JPA: use @EntityGraph or JOIN FETCH JPQL queries for relational fetches."
    ],
    exampleGood: `package com.example.demo.order;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;

public record CreateOrderRequest(
    @NotBlank String customerId,
    @Positive BigDecimal amount
) {}

public record OrderResponse(Long id, String customerId, BigDecimal amount) {}

@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {
    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<OrderResponse> create(@RequestBody CreateOrderRequest request) {
        OrderResponse response = orderService.processOrder(request);
        return ResponseEntity.ok(response);
    }
}`,
    exampleBad: `// Discouraged: Legacy javax namespace, verbose POJO with setters, mutable entity exposure
import javax.persistence.*; // Obsolete in Spring Boot 3!

public class BadOrderDTO {
    private String customerId;
    public void setCustomerId(String id) { this.customerId = id; }
}`,
    faqs: [
      {
        question: "Does this rulebook support Java 21 virtual threads?",
        answer: "Yes, it guides configuration and usage of lightweight virtual threads (Project Loom) for high-concurrency Spring Boot 3 services."
      },
      {
        question: "Why does it ban javax.* packages?",
        answer: "Spring Boot 3 requires Jakarta EE 10 APIs; javax.persistence and javax.servlet cause immediate compilation failures."
      }
    ],
    relatedSpokes: [
      { formatSlug: "claude-skills", presetSlug: "spring-boot-3", label: "Spring Boot 3 Claude Skill" },
      { formatSlug: "claude-md", presetSlug: "spring-boot-3", label: "Spring Boot 3 CLAUDE.md" },
      { formatSlug: "cursor-rules", presetSlug: "csharp-dotnet-8", label: ".NET 8 C# Cursor Rules" },
      { formatSlug: "mcp-config", presetSlug: "postgres", label: "PostgreSQL MCP Config" }
    ]
  },
  {
    formatSlug: "cursor-rules",
    presetSlug: "csharp-dotnet-8",
    format: "cursor_mdc",
    presetId: "csharp-dotnet-8",
    title: ".NET 8 & C# 12 Cursor Rules (.mdc) | Clean Architecture & Minimal APIs",
    description: "Generate .NET 8 and C# 12 Cursor rules enforcing Minimal APIs, primary constructors, file-scoped namespaces, and EF Core 8 query optimizations.",
    category: "Backend",
    techName: ".NET 8 & C# 12 Minimal APIs",
    targetFile: ".cursor/rules/csharp-dotnet-8.mdc",
    whyNeeded: "C# 12 and .NET 8 introduce primary constructors, collection expressions ([1, 2, 3]), frozen collections, and lightweight Minimal APIs. Outdated LLMs continually generate verbose 2018-era boilerplate with nested namespaces, Startup.cs classes, and unindexed EF Core queries.",
    keyRules: [
      "Use modern C# 12 features: primary constructors, collection expressions, file-scoped namespaces, and nullable reference types (#nullable enable).",
      "Structure lightweight microservices with ASP.NET Core Minimal APIs using typed route groups and TypedResults return values.",
      "Enforce AsNoTracking() on read-only EF Core queries to eliminate memory overhead from change trackers.",
      "Validate request payloads using FluentValidation or MiniValidation before executing business logic.",
      "Use IHttpClientFactory with typed resilience pipelines (Polly) for outbound HTTP calls."
    ],
    exampleGood: `namespace App.Features.Users;

using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

public record CreateUserRequest(string Email, string FullName);
public record UserDto(Guid Id, string Email, string FullName);

public static class UserEndpoints
{
    public static RouteGroupBuilder MapUserEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/{id:guid}", async Task<Results<Ok<UserDto>, NotFound>> (Guid id, AppDbContext db) =>
        {
            var user = await db.Users
                .AsNoTracking()
                .Where(u => u.Id == id)
                .Select(u => new UserDto(u.Id, u.Email, u.FullName))
                .FirstOrDefaultAsync();

            return user is not null ? TypedResults.Ok(user) : TypedResults.NotFound();
        });

        return group;
    }
}`,
    exampleBad: `// Discouraged: Nested namespaces, missing AsNoTracking, untyped object returns
namespace App.Controllers
{
    public class UsersController : Controller
    {
        [HttpGet]
        public IActionResult GetUser(Guid id)
        {
            var user = _context.Users.Find(id); // Untracked query tracking all state!
            return Ok(user);
        }
    }
}`,
    faqs: [
      {
        question: "Does this rulebook support both Minimal APIs and traditional Controllers?",
        answer: "Yes, though it prioritizes modern .NET 8 Minimal APIs with typed results for reduced overhead and cleaner unit testing."
      },
      {
        question: "Why is AsNoTracking required for EF Core reads?",
        answer: "AsNoTracking prevents EF Core from allocating memory for entity snapshot tracking on queries that do not modify state."
      }
    ],
    relatedSpokes: [
      { formatSlug: "claude-skills", presetSlug: "csharp-dotnet-8", label: ".NET 8 C# Claude Skill" },
      { formatSlug: "claude-md", presetSlug: "csharp-dotnet-8", label: ".NET 8 C# CLAUDE.md" },
      { formatSlug: "cursor-rules", presetSlug: "spring-boot-3", label: "Spring Boot 3 Cursor Rules" },
      { formatSlug: "cursor-rules", presetSlug: "go-fiber", label: "Go Fiber Cursor Rules" }
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
  "django": "python-django",
  "elysia": "bun-elysia",
  "expo": "react-native-expo",
  "flutter": "flutter-dart",
  "k8s": "kubernetes-helm",
  "helm": "kubernetes-helm",
  "terraform": "terraform-iac",
  "opentofu": "terraform-iac",
  "playwright": "playwright-e2e",
  "springboot": "spring-boot-3",
  "spring-boot": "spring-boot-3",
  "dotnet": "csharp-dotnet-8",
  "dotnet-8": "csharp-dotnet-8",
  "csharp": "csharp-dotnet-8",
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
  // Top-searched developer stacks (Phase 2 expansion)
  "python-django",
  "bun-elysia",
  "react-native-expo",
  "flutter-dart",
  "kubernetes-helm",
  "terraform-iac",
  "playwright-e2e",
  "spring-boot-3",
  "csharp-dotnet-8",
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
  const lowerPreset = presetSlug.toLowerCase();
  const normalizedPreset = SLUG_ALIASES[lowerPreset] || lowerPreset;

  // Find any route with this presetSlug across the registry as a template
  const baseRoute = PRESET_ROUTES.find(
    (r) => r.presetSlug === normalizedPreset || r.presetSlug === lowerPreset
  );

  if (!baseRoute) return null;

  if (formatSlug === "mcp-config") {
    if (baseRoute.format === "mcp_json") {
      return { ...baseRoute, formatSlug: "mcp-config", presetSlug: normalizedPreset };
    }
    return null;
  }

  // Synthesis for code rule formats: cursor-rules, claude-skills, claude-md, agents-md
  let format: OutputFormat = "cursor_mdc";
  let targetFile = `.cursor/rules/${normalizedPreset}.mdc`;
  let title = `${baseRoute.techName} Cursor Rules (.mdc)`;
  let desc = `Generate production-grade Cursor rules (.mdc) for ${baseRoute.techName}.`;

  if (formatSlug === "claude-skills") {
    format = "skill_md";
    targetFile = `.claude/skills/${normalizedPreset}/SKILL.md`;
    title = `${baseRoute.techName} Claude Skill (SKILL.md)`;
    desc = `Generate a specialized Claude Code skill (SKILL.md) for ${baseRoute.techName}.`;
  } else if (formatSlug === "claude-md") {
    format = "claude_md";
    targetFile = "CLAUDE.md";
    title = `${baseRoute.techName} CLAUDE.md Guide`;
    desc = `Generate a ${baseRoute.techName} CLAUDE.md repository guideline for Claude Code.`;
  } else if (formatSlug === "agents-md") {
    format = "agents_md";
    targetFile = "AGENTS.md";
    title = `${baseRoute.techName} AGENTS.md Protocol`;
    desc = `Generate an AGENTS.md multi-agent specification for ${baseRoute.techName}.`;
  }

  return {
    ...baseRoute,
    formatSlug,
    presetSlug: normalizedPreset,
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

  // Derive format label
  let formatSuffix = "Cursor Rules";
  if (formatSlug === "claude-skills") formatSuffix = "Claude Skill";
  else if (formatSlug === "claude-md") formatSuffix = "CLAUDE.md Guide";
  else if (formatSlug === "agents-md") formatSuffix = "AGENTS.md Rules";
  else if (formatSlug === "mcp-config") formatSuffix = "MCP Config";

  // Clean and simplify tech name for crisp, predictable SERP title
  const cleanTech = route.techName
    .replace(/\s*App Router/gi, "")
    .replace(/\s*&\s*Vite/gi, "")
    .replace(/CSS\s*v4/gi, "v4")
    .replace(/& Pydantic\s*v\d+/gi, "")
    .replace(/Minimal APIs/gi, "")
    .replace(/React Native & Expo Router/gi, "Expo & React Native")
    .replace(/Pragmatic Rapid Prototyping/gi, "Vibe Coder")
    .replace(/Zero-Trust Security/gi, "Security Guard")
    .replace(/Universal Cursor Pro/gi, "Cursor Pro")
    .replace(/Vitest & Playwright TDD/gi, "Vitest & Playwright")
    .replace(/\/\s*DRF/gi, "")
    .replace(/\/\s*Hono/gi, "")
    .replace(/\/\s*Dart/gi, "")
    .replace(/\s*&\s*Svelte\s*5/gi, "")
    .replace(/\s*&\s*Java\s*21/gi, "")
    .replace(/\s*&\s*PostgreSQL/gi, "")
    .replace(/\s*&\s*Helm Charts/gi, "")
    .replace(/\s*&\s*OpenTofu IaC/gi, "")
    .replace(/\s*&\s*Cypress E2E/gi, "")
    .replace(/\s*MCP Server/gi, "")
    .trim();

  let cleanTitle = `${cleanTech} ${formatSuffix}`;
  if (cleanTitle.length > 38) {
    const sub = cleanTitle.slice(0, 38);
    const lastSpace = sub.lastIndexOf(" ");
    cleanTitle = lastSpace > 20 ? sub.slice(0, lastSpace) : sub;
  }

  return {
    title: cleanTitle,
    description: route.description,
    openGraph: {
      title: `${cleanTitle} | DevScratchpad`,
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
          alt: `${cleanTitle} — DevScratchpad`,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${cleanTitle} | DevScratchpad`,
      description: route.description,
      images: [
        {
          url: "https://www.devscratchpad.tech/og-ai-skill-studio.png",
          width: 1200,
          height: 630,
          alt: `${cleanTitle} — DevScratchpad`,
        },
      ],
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

  // 2. Alias match in PRESET_ROUTES (case-insensitive)
  const lowerPreset = presetSlug.toLowerCase();
  const normalized = SLUG_ALIASES[lowerPreset] || lowerPreset;
  const aliasMatch = PRESET_ROUTES.find((r) => r.formatSlug === formatSlug && r.presetSlug === normalized);
  if (aliasMatch) {
    return aliasMatch;
  }

  // 3. Multi-format synthesis
  return synthesizeRouteForFormat(formatSlug, presetSlug);
}
