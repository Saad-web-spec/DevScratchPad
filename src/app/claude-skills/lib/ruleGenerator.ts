import { ProgrammaticPresetRoute } from "./presetRegistry";

export type OutputFormat = "skill_md" | "claude_md" | "cursor_mdc" | "agents_md" | "mcp_json";

export interface McpServerPreset {
  id: string;
  name: string;
  label: string;
  description: string;
  command: string;
  args: string[];
  env: Record<string, string>;
}

export const MCP_PRESETS: McpServerPreset[] = [
  {
    id: "filesystem",
    name: "filesystem",
    label: "Local Filesystem",
    description: "Secure local file access with directory scoping for repository inspection.",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem", "./"],
    env: {},
  },
  {
    id: "github",
    name: "github",
    label: "GitHub Operations",
    description: "Search repos, inspect pull requests, read branches, and create issues.",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-github"],
    env: { GITHUB_PERSONAL_ACCESS_TOKEN: "ghp_your_token_here" },
  },
  {
    id: "postgres",
    name: "postgres",
    label: "PostgreSQL Database",
    description: "Read-only schema inspection and SQL query execution against Postgres.",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-postgres", "postgresql://user:password@localhost:5432/mydb"],
    env: {},
  },
  {
    id: "brave-search",
    name: "brave-search",
    label: "Brave Web Search",
    description: "Real-time web search and documentation discovery via Brave Search API.",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-brave-search"],
    env: { BRAVE_API_KEY: "your_brave_search_api_key" },
  },
  {
    id: "fetch",
    name: "fetch",
    label: "Web Fetch & HTML",
    description: "Converts remote web pages and API responses into clean markdown for context.",
    command: "uvx",
    args: ["mcp-server-fetch"],
    env: {},
  },
  {
    id: "memory",
    name: "memory",
    label: "Knowledge Graph",
    description: "Persistent graph-based entity memory across agent coding sessions.",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-memory"],
    env: {},
  },
  {
    id: "sqlite",
    name: "sqlite",
    label: "SQLite Database",
    description: "Query and inspect local SQLite database files with zero server overhead.",
    command: "uvx",
    args: ["mcp-server-sqlite", "--db-path", "./local.db"],
    env: {},
  },
  {
    id: "puppeteer",
    name: "puppeteer",
    label: "Puppeteer Browser",
    description: "Headless browser automation, website screenshots, and SPA scraping.",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-puppeteer"],
    env: {},
  },
  {
    id: "docker",
    name: "docker",
    label: "Docker Engine",
    description: "Inspect local containers, view container logs, and troubleshoot services.",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-docker"],
    env: {},
  },
  {
    id: "custom",
    name: "custom-server",
    label: "Custom MCP Server",
    description: "Configure any bespoke Node, Python, Docker, or CLI MCP server executable.",
    command: "node",
    args: ["./dist/index.js"],
    env: {},
  },
];

export interface SkillPreset {
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

export const PRESETS: SkillPreset[] = [
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
  {
    id: "tailwind-v4",
    name: "Tailwind CSS v4",
    badge: "Frontend",
    title: "Tailwind CSS v4 & CSS-First Styling Specialist",
    slug: "tailwind-v4-styling",
    description:
      "Modern Tailwind CSS v4 conventions. Enforces CSS-first @theme configuration, zero tailwind.config.js, and strict class ordering.",
    role: "Lead UI & Design Systems Engineer",
    framework: "Tailwind CSS v4 / React / Next.js",
    language: "CSS / TypeScript",
    styling: "Tailwind CSS v4",
    database: "None / UI Only",
    philosophy: "modern",
    behaviors: ["inspect-first", "minimal-diffs", "concise-direct"],
    conventions: ["flat-pragmatic", "strict-a11y", "self-documenting"],
    procedures: `1. Define all design tokens, font families, and brand colors inside globals.css using the @theme block.
2. Never create or edit legacy tailwind.config.js or tailwind.config.ts files.
3. Order utility classes logically: layout -> spacing -> typography -> visual -> interactive.
4. Ensure sufficient contrast ratios and focus ring visibility for interactive elements.`,
    customDirectives: `- Banned: Do not suggest tailwind.config.js; Tailwind v4 is pure CSS-configured.
- Prefer CSS custom properties within @theme for dynamic theming.`,
    exampleGood: `@import "tailwindcss";

@theme {
  --color-primary: #ea580c;
  --font-mono: "Geist Mono", monospace;
}`,
    exampleBad: `// Discouraged in v4: Legacy JS config
module.exports = {
  theme: { extend: { colors: { primary: "#ea580c" } } }
};`,
  },
  {
    id: "supabase-fullstack",
    name: "Supabase & Postgres",
    badge: "Fullstack",
    title: "Supabase Architecture & Row-Level Security Specialist",
    slug: "supabase-postgres-security",
    description:
      "Production standards for Supabase. Mandates Row-Level Security (RLS) on all tables, typed database client, and secure SSR cookie auth.",
    role: "Senior Fullstack & Database Security Engineer",
    framework: "Next.js / Supabase SSR",
    language: "TypeScript / SQL",
    styling: "Tailwind CSS",
    database: "PostgreSQL (Supabase)",
    philosophy: "strict",
    behaviors: ["inspect-first", "dependency-caution", "verification-driven"],
    conventions: ["clean-layered", "guard-clauses", "typed-schemas"],
    procedures: `1. Always write migration scripts that enable Row Level Security (RLS) on new tables.
2. Never expose service_role key to client components or public network responses.
3. Use @supabase/ssr for server component and server action authentication.
4. Generate and maintain TypeScript database types via Supabase CLI.`,
    customDirectives: `- Any table created without ENABLE ROW LEVEL SECURITY is considered a critical vulnerability.
- Always use auth.uid() in RLS policy definitions.`,
    exampleGood: `-- Good: Table with explicit RLS enabled and owner policy
create table profiles (
  id uuid references auth.users not null primary key,
  username text unique
);
alter table profiles enable row level security;
create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);`,
    exampleBad: `-- Dangerous: Table without RLS allows public anonymous read/write
create table profiles (
  id uuid primary key,
  username text
);`,
  },
  {
    id: "prisma-orm",
    name: "Prisma ORM",
    badge: "Database",
    title: "Prisma ORM & PostgreSQL Schema Architecture",
    slug: "prisma-orm-performance",
    description:
      "Production guidelines for Prisma ORM. Enforces selective field fetching, batch transactions, explicit indexing, and singleton client patterns.",
    role: "Database Systems Architect",
    framework: "Node.js / Next.js / TypeScript",
    language: "TypeScript",
    styling: "None",
    database: "PostgreSQL / Prisma",
    philosophy: "strict",
    behaviors: ["inspect-first", "minimal-diffs", "verification-driven"],
    conventions: ["guard-clauses", "typed-schemas", "clean-layered"],
    procedures: `1. Always use 'select' to fetch only necessary columns; ban broad unconstrained findMany() queries.
2. Encapsulate dependent multi-model operations inside prisma.$transaction().
3. Add @@index for columns used frequently in WHERE clauses or foreign key joins.
4. Maintain a singleton PrismaClient instance to prevent connection pool exhaustion.`,
    customDirectives: `- Never return raw hashed passwords or internal auth tokens from Prisma queries.
- Prefer Prisma raw queries ($queryRaw) only when complex SQL window functions are required.`,
    exampleGood: `// Good: Targeted field selection avoiding memory bloat
const users = await db.user.findMany({
  where: { active: true },
  select: { id: true, email: true, name: true }
});`,
    exampleBad: `// Discouraged: Over-fetching entire table graph into memory
const users = await db.user.findMany({
  include: { posts: true, logs: true, auditHistory: true }
});`,
  },
  {
    id: "drizzle-orm",
    name: "Drizzle ORM",
    badge: "Database",
    title: "Drizzle ORM & Type-Safe SQL Specialist",
    slug: "drizzle-orm-typesafe",
    description:
      "Production guidelines for Drizzle ORM. Enforces relational schema modeling, parameterized SQL templates, and zero-runtime overhead.",
    role: "TypeScript Data Engineer",
    framework: "Next.js / Node.js",
    language: "TypeScript / SQL",
    styling: "None",
    database: "PostgreSQL / SQLite (Drizzle)",
    philosophy: "modern",
    behaviors: ["inspect-first", "minimal-diffs", "verification-driven"],
    conventions: ["typed-schemas", "guard-clauses", "clean-layered"],
    procedures: `1. Define table schemas in dedicated schema files with explicit relations.
2. Use db.query for relational lookups and db.insert/update for targeted mutations.
3. Always parameterize raw SQL queries with the sql template tag.
4. Run drizzle-kit generate and drizzle-kit migrate for safe migrations.`,
    customDirectives: `- Ban raw string concatenation in SQL expressions.
- Keep schema definitions colocated with their domain entities.`,
    exampleGood: `// Good: Parameterized SQL template with type-safe query
import { sql, eq } from "drizzle-orm";
const result = await db.select().from(users).where(eq(users.status, "active"));`,
    exampleBad: `// Discouraged: Unsafe raw string interpolation
await db.execute(\`SELECT * FROM users WHERE status = '\${status}'\`);`,
  },
  {
    id: "go-fiber",
    name: "Go Fiber API",
    badge: "Backend",
    title: "High-Performance Go & Fiber API Specialist",
    slug: "go-fiber-backend",
    description:
      "Production standards for Go Fiber microservices. Enforces explicit error handling, context propagation, and clean layered architecture.",
    role: "Senior Go Systems Engineer",
    framework: "Go Fiber v2/v3",
    language: "Go (Golang 1.22+)",
    styling: "None / API Service",
    database: "PostgreSQL / pgx / Redis",
    philosophy: "strict",
    behaviors: ["inspect-first", "minimal-diffs", "verification-driven"],
    conventions: ["clean-layered", "guard-clauses", "result-types"],
    procedures: `1. Check all errors explicitly (if err != nil); never discard errors with '_'.
2. Propagate request context (c.UserContext()) to all database and remote calls.
3. Structure application into cmd/, internal/handlers/, internal/services/, and internal/models/.
4. Use Fiber validator middleware to parse and validate request structs.`,
    customDirectives: `- Never call panic() in production request handlers.
- Inject dependencies into struct receivers rather than using package globals.`,
    exampleGood: `// Good: Explicit error handling with context
func (h *Handler) GetUser(c *fiber.Ctx) error {
    id := c.Params("id")
    user, err := h.service.FindByID(c.UserContext(), id)
    if err != nil {
        if errors.Is(err, domain.ErrNotFound) {
            return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "not found"})
        }
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal"})
    }
    return c.JSON(user)
}`,
    exampleBad: `// Discouraged: Ignored errors and missing context
func GetUser(c *fiber.Ctx) error {
    id := c.Params("id")
    user, _ := db.Find(id)
    return c.JSON(user)
}`,
  },
  {
    id: "rust-axum",
    name: "Rust Axum Service",
    badge: "Backend",
    title: "Idiomatic Rust & Axum Microservice Specialist",
    slug: "rust-axum-service",
    description:
      "Idiomatic Rust standards with Axum, Tokio runtime, typed extractors, and zero-unwrap error handling.",
    role: "Principal Rust Systems Architect",
    framework: "Axum & Tokio",
    language: "Rust 2021 Edition",
    styling: "None / API Service",
    database: "PostgreSQL (SQLx)",
    philosophy: "strict",
    behaviors: ["inspect-first", "minimal-diffs", "verification-driven"],
    conventions: ["guard-clauses", "result-types", "typed-schemas"],
    procedures: `1. Propagate errors with the '?' operator; never call .unwrap() or .expect() in handlers.
2. Implement IntoResponse on a centralized AppError enum.
3. Use Axum extractors (State, Json, Path) in strict dependency order.
4. Pass shared resources via Arc<AppState> using Axum's State extractor.`,
    customDirectives: `- Run 'cargo clippy -- -D warnings' as a standard validation gate.
- Keep dependencies minimal; prefer serde and tokio primitives.`,
    exampleGood: `// Good: Typed handler returning custom Result with IntoResponse
pub async fn create_user(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateUserRequest>,
) -> Result<Json<UserResponse>, AppError> {
    let user = state.db.insert_user(&payload).await?;
    Ok(Json(user.into()))
}`,
    exampleBad: `// Discouraged: Calling unwrap inside async handler
pub async fn create_user(Json(payload): Json<CreateUserRequest>) -> Json<UserResponse> {
    let user = db.insert_user(&payload).await.unwrap();
    Json(user.into())
}`,
  },
  {
    id: "vue-nuxt",
    name: "Vue 3 & Nuxt 3",
    badge: "Frontend",
    title: "Vue 3 & Nuxt 3 Composition API Specialist",
    slug: "vue-nuxt-composition",
    description:
      "Modern Vue 3 and Nuxt 3 fullstack standards. Enforces <script setup lang='ts'>, useFetch, and Nitro server endpoints.",
    role: "Senior Vue & Nuxt Engineer",
    framework: "Vue 3 & Nuxt 3",
    language: "TypeScript",
    styling: "Tailwind CSS",
    database: "Nitro / REST / Supabase",
    philosophy: "modern",
    behaviors: ["inspect-first", "minimal-diffs", "concise-direct"],
    conventions: ["feature-colocated", "guard-clauses", "strict-a11y"],
    procedures: `1. Always use <script setup lang="ts">; ban legacy Vue 2 Options API syntax.
2. Fetch data via useAsyncData or useFetch with unique, declarative cache keys.
3. Colocate server API handlers in server/api/ using defineEventHandler.
4. Manage global client state using Pinia stores.`,
    customDirectives: `- Rely on Nuxt auto-imports; avoid manual import statements for standard composables.
- Use TypeScript interfaces for all component defineProps and defineEmits.`,
    exampleGood: `<script setup lang="ts">
interface Props {
  title: string;
}
const props = defineProps<Props>();
const { data: posts, status } = await useFetch('/api/posts');
</script>`,
    exampleBad: `// Discouraged: Options API with manual data/methods
export default {
  props: ['title'],
  data() { return { posts: [] }; },
  mounted() { fetch('/api/posts').then(r => r.json()).then(d => this.posts = d); }
};`,
  },
  {
    id: "sveltekit",
    name: "SvelteKit 5",
    badge: "Frontend",
    title: "SvelteKit 5 & Svelte 5 Runes Specialist",
    slug: "sveltekit-runes",
    description:
      "Modern SvelteKit 5 standards enforcing Svelte 5 Runes ($state, $derived, $props), server load functions, and form actions.",
    role: "Senior Svelte Engineer",
    framework: "SvelteKit 5 & Svelte 5",
    language: "TypeScript",
    styling: "Tailwind CSS",
    database: "PostgreSQL / SQLite",
    philosophy: "modern",
    behaviors: ["inspect-first", "minimal-diffs", "concise-direct"],
    conventions: ["feature-colocated", "guard-clauses", "self-documenting"],
    procedures: `1. Use Svelte 5 runes: $state(), $derived(), $effect(), and $props().
2. Ban legacy Svelte 3/4 'let' reactivity and '$: ' reactive labels.
3. Load data server-side in +page.server.ts load() functions.
4. Execute mutations using standard SvelteKit Form Actions with use:enhance.`,
    customDirectives: `- Never mix Svelte 4 reactivity syntax with Svelte 5 runes.
- Keep server-only code strictly in *.server.ts files.`,
    exampleGood: `<script lang="ts">
interface Props {
  initialCount?: number;
}
let { initialCount = 0 }: Props = $props();
let count = $state(initialCount);
let double = $derived(count * 2);
</script>`,
    exampleBad: `<script>
// Discouraged: Legacy Svelte 3/4 syntax
export let initialCount = 0;
let count = initialCount;
$: double = count * 2;
</script>`,
  },
  {
    id: "docker-devops",
    name: "Docker & CI/CD",
    badge: "DevOps",
    title: "Production Docker & Containerization Engineer",
    slug: "docker-containerization",
    description:
      "Production containerization standards. Enforces multi-stage builds, non-root runtime users, layer caching, and health checks.",
    role: "DevOps & Infrastructure Engineer",
    framework: "Docker / Kubernetes / GitHub Actions",
    language: "Dockerfile / Bash / YAML",
    styling: "None",
    database: "PostgreSQL / Redis Containers",
    philosophy: "strict",
    behaviors: ["inspect-first", "dependency-caution", "verification-driven"],
    conventions: ["clean-layered", "guard-clauses"],
    procedures: `1. Always construct multi-stage Dockerfiles with separate build and minimal runtime stages.
2. Create and switch to a dedicated non-root user (e.g. USER node or USER app).
3. Copy dependency lockfiles before source files to maximize Docker layer caching.
4. Add HEALTHCHECK instruction to verify container readiness in production.`,
    customDirectives: `- Never run production application containers as root.
- Never include development tooling (compilers, git) in final runtime images.`,
    exampleGood: `# Good: Lean multi-stage build with non-root user
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
USER nextjs
EXPOSE 3000
CMD ["node", "dist/index.js"]`,
    exampleBad: `# Discouraged: Bloated single-stage build running as root
FROM node:20
WORKDIR /app
COPY . .
RUN npm install
CMD ["npm", "start"]`,
  },
  {
    id: "tdd-specialist",
    name: "TDD & Testing",
    badge: "Testing",
    title: "Test-Driven Development & Automation Specialist",
    slug: "tdd-testing-automation",
    description:
      "TDD and test automation standards. Enforces unit testing, edge-case coverage, Vitest/Playwright patterns, and mock isolation.",
    role: "Lead QA & Test Automation Architect",
    framework: "Vitest / Jest / Playwright",
    language: "TypeScript",
    styling: "None",
    database: "In-Memory / Testcontainers",
    philosophy: "strict",
    behaviors: ["verification-driven", "inspect-first", "minimal-diffs"],
    conventions: ["result-types", "guard-clauses", "self-documenting"],
    procedures: `1. Write failing unit tests first before writing business logic implementation.
2. Structure tests clearly using the Arrange-Act-Assert (AAA) pattern.
3. Mock external network and database calls; keep unit tests fast (<10ms per test).
4. Verify both happy paths and boundary conditions (empty inputs, timeouts, errors).`,
    customDirectives: `- Never disable or skip tests with test.skip or fit.
- Provide executable verification commands with every code proposal.`,
    exampleGood: `// Good: Clean Arrange-Act-Assert with mock isolation
describe("parseAmount", () => {
  it("converts valid currency strings to cents", () => {
    // Arrange & Act
    const cents = parseAmount("$19.99");
    // Assert
    expect(cents).toBe(1999);
  });

  it("throws on negative values", () => {
    expect(() => parseAmount("-$5.00")).toThrow(InvalidAmountError);
  });
});`,
    exampleBad: `// Discouraged: Unasserted test with external network call
test("test user API", async () => {
  const res = await fetch("https://api.external.com/users");
  console.log(await res.json());
});`,
  },
  {
    id: "fullstack-agent-team",
    name: "Fullstack Agent Team",
    badge: "Multi-Agent",
    title: "Fullstack Multi-Agent Team Orchestration",
    slug: "fullstack-agent-team",
    description:
      "Universal multi-agent team specification coordinating Lead Architect, Frontend Engineer, Backend Specialist, and Security Reviewer subagents.",
    role: "Autonomous Multi-Agent Coordinator",
    framework: "Multi-Agent Frameworks (Antigravity / Devin / Claude)",
    language: "TypeScript / Polyglot",
    styling: "Tailwind CSS",
    database: "PostgreSQL / Prisma",
    philosophy: "architect",
    behaviors: ["inspect-first", "minimal-diffs", "concise-direct", "verification-driven", "dependency-caution"],
    conventions: ["clean-layered", "guard-clauses", "result-types", "typed-schemas"],
    procedures: `1. Lead Architect parses requirements and assigns tasks to specialized subagents.
2. Frontend & Backend subagents implement changes with strict interface contracts.
3. Security subagent reviews modified code against zero-trust standards before commit.
4. Autonomous verification gate: run test suite and typecheck before task completion.
5. All code commits must be atomic and include reproduction or verification steps.`,
    customDirectives: `- Subagents must never modify unassigned directories or conflicting files.
- Preserve existing documentation, comments, and project conventions.
- Report all blockers explicitly with reproducible context.`,
    exampleGood: `<!-- BEGIN:agent-team -->
Role: Lead Architect
Contract: Define interfaces in /types before delegating implementation to subagents.
Verification: 'npm run build' must exit 0 before merging.
<!-- END:agent-team -->`,
    exampleBad: `// Uncoordinated subagent edits overwriting parent contracts without verification`,
  },
  {
    id: "python-django",
    name: "Django 5 & Ninja",
    badge: "Backend",
    title: "Django 5 & Ninja / DRF Architecture Specialist",
    slug: "python-django",
    description:
      "Production guidelines for Django 5. Enforces async ORM methods, Django Ninja Pydantic schemas, strict migrations, and N+1 query elimination.",
    role: "Senior Django & Python Systems Architect",
    framework: "Django 5 / Django Ninja / DRF",
    language: "Python 3.12+",
    styling: "None / API Service",
    database: "PostgreSQL / Django ORM",
    philosophy: "strict",
    behaviors: ["inspect-first", "minimal-diffs", "verification-driven", "concise-direct"],
    conventions: ["clean-layered", "guard-clauses", "typed-schemas"],
    procedures: `1. Use asynchronous ORM methods (aget, acreate, afirst) inside async view handlers.
2. Prevent N+1 queries: always apply select_related for foreign keys and prefetch_related for M2M relations.
3. Validate API payloads with Django Ninja Schema or DRF Serializers before domain logic execution.
4. Never modify existing committed migration files; create new sequential migrations via makemigrations.
5. Use Django 5 GeneratedField for database-computed columns rather than overriding model save().`,
    customDirectives: `- Never execute raw SQL without query parameterization.
- Ensure all model fields declare explicit verbose_name and db_index where filtered.`,
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
    article = await Article.objects.select_related("author").aget(id=article_id)
    return {"id": article.id, "title": article.title, "author_name": article.author.username}`,
    exampleBad: `@router.get("/articles/{article_id}")
async def get_article(request, article_id: int):
    article = Article.objects.get(id=article_id) # Blocking sync query inside async handler!
    return {"id": article.id, "title": article.title, "author": article.author.username}`,
  },
  {
    id: "bun-elysia",
    name: "Bun & Elysia",
    badge: "Backend",
    title: "Bun & Elysia High-Performance TypeScript Specialist",
    slug: "bun-elysia",
    description:
      "Production standards for Bun and Elysia.js. Enforces TypeBox runtime schemas, Eden Treaty client typing, and zero-overhead native Bun APIs.",
    role: "Lead Bun & Edge TypeScript Engineer",
    framework: "Elysia.js / Hono",
    language: "TypeScript (Bun runtime)",
    styling: "None / API Service",
    database: "PostgreSQL / SQLite / Drizzle",
    philosophy: "modern",
    behaviors: ["inspect-first", "minimal-diffs", "concise-direct"],
    conventions: ["typed-schemas", "guard-clauses", "flat-pragmatic"],
    procedures: `1. Validate request bodies, parameters, and query strings using Elysia's native 't' schema builder (TypeBox).
2. Leverage native Bun APIs (Bun.serve, Bun.file, Bun.password) instead of slow Node polyfills.
3. Define explicit Eden Treaty export contracts for type-safe frontend client consumption.
4. Centralize error handling using Elysia .onError handler with typed response envelopes.`,
    customDirectives: `- Do not import node:crypto or express middlewares when native Bun equivalents exist.
- Always annotate response types on public API endpoints.`,
    exampleGood: `import { Elysia, t } from "elysia";

export const app = new Elysia()
  .post("/api/users", async ({ body, set }) => {
    const hash = await Bun.password.hash(body.password);
    set.status = 201;
    return { ok: true, email: body.email };
  }, {
    body: t.Object({
      email: t.String({ format: "email" }),
      password: t.String({ minLength: 8 }),
    }),
  });`,
    exampleBad: `import bcrypt from "bcrypt";
app.post("/users", async (req: any, res: any) => {
  const hash = await bcrypt.hash(req.body.password, 10);
  res.json({ success: true });
});`,
  },
  {
    id: "react-native-expo",
    name: "Expo & React Native",
    badge: "Mobile",
    title: "Expo Router & React Native Mobile Specialist",
    slug: "react-native-expo",
    description:
      "Modern React Native standards with Expo Router v3/v4, New Architecture (Fabric/TurboModules), and safe area boundaries.",
    role: "Senior React Native Mobile Architect",
    framework: "Expo Router & React Native",
    language: "TypeScript",
    styling: "StyleSheet / NativeWind",
    database: "SQLite / Supabase / REST",
    philosophy: "modern",
    behaviors: ["inspect-first", "minimal-diffs", "preserve-style"],
    conventions: ["feature-colocated", "guard-clauses", "strict-a11y"],
    procedures: `1. Use Expo Router file-based routing under app/ directory; avoid legacy navigation container wrappers.
2. Guard all screen boundaries with react-native-safe-area-context insets.
3. Use expo-image for high-performance memory-cached image rendering.
4. Test styles on both iOS and Android platforms to prevent layout clipping and notch collisions.`,
    customDirectives: `- Never perform heavy synchronous calculations during render passes.
- Do not import bare native modules that break Expo Go unless config plugins are configured.`,
    exampleGood: `import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Image source={{ uri: "https://example.com/avatar.png" }} style={styles.avatar} contentFit="cover" />
      <Text style={styles.title}>User Profile</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  title: { fontSize: 20, fontWeight: "600", marginTop: 12 },
});`,
    exampleBad: `export default function BadProfile({ navigation }: any) {
  return (
    <div style={{ marginTop: 50 }}>
      <img src="avatar.png" />
      <button onClick={() => navigation.navigate("Home")}>Go</button>
    </div>
  );
}`,
  },
  {
    id: "flutter-dart",
    name: "Flutter & Riverpod",
    badge: "Mobile",
    title: "Flutter 3 & Riverpod Architecture Specialist",
    slug: "flutter-dart",
    description:
      "Modern Flutter 3 and Riverpod 2 conventions. Enforces sound null safety, pattern matching, const widget constructors, and immutable state.",
    role: "Lead Flutter Mobile Systems Engineer",
    framework: "Flutter 3.x",
    language: "Dart 3.x (Null-Safe)",
    styling: "Material 3 / Cupertino",
    database: "Isar / SQLite / REST",
    philosophy: "strict",
    behaviors: ["inspect-first", "minimal-diffs", "verification-driven"],
    conventions: ["clean-layered", "guard-clauses", "self-documenting"],
    procedures: `1. Always use const constructors on immutable widgets to short-circuit Flutter rebuilds.
2. Manage reactive state using Riverpod 2 with code generation (@riverpod / NotifierProvider).
3. Leverage Dart 3 pattern matching and sealed classes for exhaustive UI state switching.
4. Enforce strict null safety: ban force-unwrap operator (!) without preceding guard checks.`,
    customDirectives: `- Separate UI presentation widgets from business repositories and HTTP clients.
- Never use raw StatefulWidget with mutable setState in shared business logic.`,
    exampleGood: `@immutable
sealed class ViewState<T> { const ViewState(); }
class Loading<T> extends ViewState<T> { const Loading(); }
class Success<T> extends ViewState<T> { final T data; const Success(this.data); }

class ProfileView extends ConsumerWidget {
  const ProfileView({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(profileProvider);
    return Scaffold(
      body: switch (state) {
        Loading() => const Center(child: CircularProgressIndicator.adaptive()),
        Success(:final data) => Center(child: Text('Welcome, \${data.name}')),
      },
    );
  }
}`,
    exampleBad: `class _BadProfileState extends State<BadProfile> {
  var user;
  void load() async { user = await fetchUser(); setState(() {}); }
  @override
  Widget build(BuildContext context) { return Container(child: Text(user!.name)); }
}`,
  },
  {
    id: "kubernetes-helm",
    name: "Kubernetes & Helm",
    badge: "DevOps",
    title: "Kubernetes & Helm Manifest Validation Specialist",
    slug: "kubernetes-helm",
    description:
      "Cloud-native Kubernetes and Helm rules. Enforces container resource limits, non-root security contexts, readiness probes, and valid YAML indentation.",
    role: "Principal Cloud-Native Infrastructure Engineer",
    framework: "Kubernetes 1.30+ / Helm 3",
    language: "YAML / Go Templates",
    styling: "None / Infrastructure",
    database: "etcd / Cloud Native",
    philosophy: "architect",
    behaviors: ["inspect-first", "minimal-diffs", "verification-driven", "dependency-caution"],
    conventions: ["self-documenting", "clean-layered", "typed-schemas"],
    procedures: `1. Always specify explicit resources.requests and resources.limits on every container.
2. Enforce strict securityContext: runAsNonRoot: true, allowPrivilegeEscalation: false, readOnlyRootFilesystem: true.
3. Configure both livenessProbe and readinessProbe with realistic timeouts and initialDelaySeconds.
4. Format Helm template interpolations using nindent filters to preserve valid YAML indentation.`,
    customDirectives: `- Never deploy containers using mutable :latest image tags.
- Always include standard app.kubernetes.io/* metadata labels.`,
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
            requests: { cpu: 100m, memory: 128Mi }
            limits: { cpu: 500m, memory: 512Mi }
          readinessProbe:
            httpGet: { path: /healthz, port: 8080 }`,
    exampleBad: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: bad-service
spec:
  template:
    spec:
      containers:
        - name: app
          image: myapp:latest # No resource limits, root container, missing probes!`,
  },
  {
    id: "terraform-iac",
    name: "Terraform & OpenTofu",
    badge: "DevOps",
    title: "Terraform & OpenTofu Cloud Infrastructure Specialist",
    slug: "terraform-iac",
    description:
      "Production standards for Terraform and OpenTofu IaC. Enforces remote state locking, provider version pinning, tag propagation, and secret masking.",
    role: "Senior Infrastructure as Code Architect",
    framework: "Terraform 1.7+ / OpenTofu",
    language: "HCL 2.0",
    styling: "None / Infrastructure",
    database: "Cloud Managed (RDS/DynamoDB)",
    philosophy: "strict",
    behaviors: ["inspect-first", "minimal-diffs", "verification-driven", "dependency-caution"],
    conventions: ["clean-layered", "self-documenting", "guard-clauses"],
    procedures: `1. Pin required_version and provider version constraints explicitly in terraform block.
2. Store state in remote backends (S3, GCS, Terraform Cloud) with distributed state locking enabled.
3. Propagate mandatory resource tags (Environment, Project, Owner, ManagedBy) to all cloud resources.
4. Mark sensitive variables with 'sensitive = true' and never commit plaintext credentials.
5. Add lifecycle { prevent_destroy = true } blocks on critical databases and stateful storage.`,
    customDirectives: `- Run 'terraform fmt -check' and 'terraform validate' before committing changes.
- Ban raw local state files (.terraform.tfstate) in git repositories.`,
    exampleGood: `terraform {
  required_version = ">= 1.7.0"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.40" }
  }
}
resource "aws_db_instance" "primary" {
  identifier        = "app-db-prod"
  engine            = "postgres"
  instance_class    = "db.r6g.large"
  password          = var.db_password
  lifecycle {
    prevent_destroy = true
  }
}`,
    exampleBad: `resource "aws_db_instance" "bad_db" {
  engine   = "postgres"
  password = "plaintext_password_in_repo" # Leaked secrets!
}`,
  },
  {
    id: "playwright-e2e",
    name: "Playwright E2E",
    badge: "Testing",
    title: "Playwright E2E Browser Automation Specialist",
    slug: "playwright-e2e",
    description:
      "Resilient browser automation standards for Playwright. Enforces user-facing locators (getByRole, getByText), web-first auto-waiting assertions, and zero sleep() calls.",
    role: "Lead Test Automation & QA Architect",
    framework: "Playwright Test Runner",
    language: "TypeScript",
    styling: "None / Test Suite",
    database: "Test Fixtures / Mock Service Worker",
    philosophy: "strict",
    behaviors: ["inspect-first", "minimal-diffs", "verification-driven"],
    conventions: ["self-documenting", "guard-clauses", "clean-layered"],
    procedures: `1. Ban arbitrary sleep timeouts (page.waitForTimeout); rely on web-first auto-waiting assertions.
2. Target elements via accessible user-facing locators: page.getByRole(), page.getByLabel(), page.getByTestId().
3. Encapsulate multi-step interactions inside modular Page Object Models (POM).
4. Isolate test authentication using saved storageState rather than UI logins in every test.
5. Record trace files and video on first retry for fast CI failure diagnosis.`,
    customDirectives: `- Never write fragile CSS selectors or brittle deep XPath selectors.
- Verify tests run cleanly across Chromium, Firefox, and WebKit engines.`,
    exampleGood: `import { test, expect } from "@playwright/test";

test("allows user to complete checkout", async ({ page }) => {
  await page.goto("/catalog");
  await page.getByRole("button", { name: "Add to Cart" }).first().click();
  await page.getByRole("link", { name: "Cart" }).click();
  await expect(page.getByRole("heading", { name: "Shopping Cart" })).toBeVisible();
  await page.getByRole("button", { name: "Checkout" }).click();
  await expect(page).toHaveURL(/.*checkout/);
});`,
    exampleBad: `test("flaky checkout", async ({ page }) => {
  await page.goto("/catalog");
  await page.click("div.col > button:nth-child(2)");
  await page.waitForTimeout(5000); // Flaky sleep anti-pattern!
  expect(await page.innerText("#status")).toBe("OK");
});`,
  },
  {
    id: "spring-boot-3",
    name: "Spring Boot 3 & Java 21",
    badge: "Backend",
    title: "Spring Boot 3 & Java 21 Virtual Threads Specialist",
    slug: "spring-boot-3",
    description:
      "Enterprise Java standards for Spring Boot 3.3+ and Java 21. Enforces record DTOs, virtual threads (Project Loom), Jakarta EE 10 namespaces, and Spring Data JPA optimization.",
    role: "Principal Enterprise Java Architect",
    framework: "Spring Boot 3.3+ (Spring 6)",
    language: "Java 21 (Records, Virtual Threads)",
    styling: "None / API Service",
    database: "PostgreSQL / Spring Data JPA / Hibernate 6",
    philosophy: "strict",
    behaviors: ["inspect-first", "minimal-diffs", "verification-driven"],
    conventions: ["clean-layered", "guard-clauses", "typed-schemas"],
    procedures: `1. Use jakarta.* packages for persistence, validation, and servlet APIs; ban legacy javax.* imports.
2. Model request and response DTOs using native Java Records with Jakarta validation constraints.
3. Enable Java 21 Virtual Threads (spring.threads.virtual.enabled=true) for non-blocking I/O throughput.
4. Configure Spring Security using SecurityFilterChain beans; never extend WebSecurityConfigurerAdapter.
5. Eliminate JPA N+1 queries using @EntityGraph or JOIN FETCH JPQL expressions.`,
    customDirectives: `- Prefer constructor dependency injection over @Autowired field injection.
- Handle business exceptions via @RestControllerAdvice with ProblemDetail (RFC 7807) responses.`,
    exampleGood: `public record CreateOrderRequest(
    @NotBlank String customerId,
    @Positive BigDecimal amount
) {}

public record OrderResponse(Long id, String customerId, BigDecimal amount) {}

@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {
    private final OrderService orderService;
    public OrderController(OrderService orderService) { this.orderService = orderService; }

    @PostMapping
    public ResponseEntity<OrderResponse> create(@RequestBody @Valid CreateOrderRequest request) {
        return ResponseEntity.ok(orderService.processOrder(request));
    }
}`,
    exampleBad: `import javax.persistence.*; // Obsolete in Spring Boot 3!

public class BadOrderDTO {
    private String customerId;
    public String getCustomerId() { return customerId; }
    public void setCustomerId(String id) { this.customerId = id; }
}`,
  },
  {
    id: "csharp-dotnet-8",
    name: ".NET 8 & C# 12",
    badge: "Backend",
    title: ".NET 8 & C# 12 Minimal APIs Specialist",
    slug: "csharp-dotnet-8",
    description:
      "Production guidelines for .NET 8 and C# 12. Enforces Minimal APIs, primary constructors, collection expressions, file-scoped namespaces, and EF Core 8 query optimization.",
    role: "Senior .NET & Cloud Systems Architect",
    framework: "ASP.NET Core 8.0 Minimal APIs",
    language: "C# 12 (.NET 8 SDK)",
    styling: "None / API Service",
    database: "PostgreSQL / SQL Server / EF Core 8",
    philosophy: "modern",
    behaviors: ["inspect-first", "minimal-diffs", "verification-driven"],
    conventions: ["clean-layered", "guard-clauses", "typed-schemas"],
    procedures: `1. Leverage C# 12 features: primary constructors, collection expressions, and file-scoped namespaces.
2. Structure high-performance microservices using ASP.NET Core Minimal APIs with TypedResults.
3. Enforce AsNoTracking() on read-only EF Core queries to eliminate change tracking memory overhead.
4. Validate incoming request payloads with FluentValidation or MiniValidation before executing queries.
5. Configure resilient outgoing HTTP requests via IHttpClientFactory and Polly pipelines.`,
    customDirectives: `- Enable '#nullable enable' across all C# project files.
- Return explicit IResult types (TypedResults.Ok, TypedResults.NotFound) rather than untyped object responses.`,
    exampleGood: `namespace App.Features.Users;

using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

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
    exampleBad: `namespace App.Controllers
{
    public class UsersController : Controller
    {
        [HttpGet]
        public IActionResult GetUser(Guid id)
        {
            var user = _context.Users.Find(id); // Untracked query loading full entity graph into tracker
            return Ok(user);
        }
    }
}`,
  },
];

export const PHILOSOPHIES = [
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

export const BEHAVIOR_OPTIONS = [
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

export const CONVENTION_OPTIONS = [
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

export function deduceLangTag(language?: string): string {
  const l = (language || "").toLowerCase();
  if (l.includes("typescript") || l.includes("tsx")) return "typescript";
  if (l.includes("javascript") || l.includes("jsx")) return "javascript";
  if (l.includes("python")) return "python";
  if (l.includes("go")) return "go";
  if (l.includes("rust")) return "rust";
  if (l.includes("shell") || l.includes("bash")) return "bash";
  return "ts";
}

export interface RuleBuilderParams {
  targetFormat: OutputFormat;
  skillName: string;
  skillTitle: string;
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
  globPattern?: string;
  alwaysApply?: boolean;
  mcpServerName?: string;
  mcpCommand?: string;
  mcpArgs?: string;
  mcpEnvKey?: string;
  mcpEnvValue?: string;
}

export function buildRuleContent(params: RuleBuilderParams): string {
  const {
    targetFormat,
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
    globPattern = "**/*",
    alwaysApply = false,
    mcpServerName = "project-tools",
    mcpCommand = "npx",
    mcpArgs = "",
    mcpEnvKey = "",
    mcpEnvValue = "",
  } = params;

  const philObj = PHILOSOPHIES.find((p) => p.id === philosophy);
  const langTag = deduceLangTag(language);

  const selectedBehaviorTexts = behaviors
    .map((bId) => BEHAVIOR_OPTIONS.find((b) => b.id === bId))
    .filter(Boolean)
    .map((b) => `- **${b!.label}**: ${b!.desc}`);

  const selectedConventionTexts = conventions
    .map((cId) => CONVENTION_OPTIONS.find((c) => c.id === cId))
    .filter(Boolean)
    .map((c) => `- **${c!.label}**: ${c!.desc}`);

  if (targetFormat === "skill_md") {
    return `---
name: ${skillName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-") || "custom-skill"}
description: ${description.trim().replace(/\n+/g, " ")}
---

# ${skillTitle.trim() || "Claude Skill Instructions"}

## 1. Overview & Role
You are operating as a **${role}**.
- **Philosophy**: ${philObj?.title || "Pragmatic"} — ${philObj?.desc || "High-quality engineering."}
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
    return `# ${skillTitle.trim() || "Project Instructions"}

<project_context>
${description.trim()}

- Primary Role: ${role}
- Philosophy: ${philObj?.title || "Pragmatic"} (${philObj?.desc || "Clean standards."})
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
    return `---
description: "${description.trim().replace(/"/g, '\\"')}"
globs: [${JSON.stringify(globPattern.trim() || "**/*")}]
alwaysApply: ${alwaysApply}
---

# ${skillTitle.trim() || "Cursor Rule Directives"}

You are acting as: **${role}**.
Engineering Philosophy: **${philObj?.title || "Modern Balanced"}** (${philObj?.desc || "Clean interfaces and modular design."})

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

  if (targetFormat === "mcp_json") {
    const argsArray = mcpArgs
      .split("\n")
      .map((a) => a.trim())
      .filter(Boolean);

    const envObj: Record<string, string> = {};
    if (mcpEnvKey.trim() && mcpEnvValue.trim()) {
      envObj[mcpEnvKey.trim()] = mcpEnvValue.trim();
    }

    const serverConfig: Record<string, unknown> = {
      command: mcpCommand.trim() || "npx",
      args: argsArray,
    };

    if (Object.keys(envObj).length > 0) {
      serverConfig.env = envObj;
    }

    const mcpJson = {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      mcpServers: {
        [mcpServerName.trim() || "project-tools"]: serverConfig,
      },
    };

    return JSON.stringify(mcpJson, null, 2);
  }

  // AGENTS.md format
  return `<!-- BEGIN:agent-rules -->
# AI Agent Specification: ${skillTitle.trim() || "Core Rules"}

## Role & Mission
Act as **${role}**.
Philosophy: ${philObj?.title || "Senior Architect"} — ${philObj?.desc || "Production standards."}

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
}

export function generateContentFromRoute(route: ProgrammaticPresetRoute): string {
  if (route.format === "mcp_json") {
    const mcp =
      MCP_PRESETS.find(
        (p) => p.id === route.presetId || p.name === route.presetId || p.id === route.presetSlug
      ) || MCP_PRESETS[0];

    const serverConfig: Record<string, unknown> = {
      command: mcp.command,
      args: mcp.args,
    };
    if (mcp.env && Object.keys(mcp.env).length > 0) {
      serverConfig.env = mcp.env;
    }

    const mcpJson = {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      mcpServers: {
        [mcp.name]: serverConfig,
      },
    };
    return JSON.stringify(mcpJson, null, 2);
  }

  const preset = PRESETS.find((p) => p.id === route.presetId) || PRESETS[0];

  return buildRuleContent({
    targetFormat: route.format,
    skillName: route.presetSlug,
    skillTitle: route.techName ? `${route.techName} Rules` : preset.title,
    description: route.description || preset.description,
    role: preset.role,
    framework: preset.framework,
    language: preset.language,
    styling: preset.styling,
    database: preset.database,
    philosophy: preset.philosophy,
    behaviors: preset.behaviors,
    conventions: preset.conventions,
    procedures: preset.procedures,
    customDirectives: preset.customDirectives,
    exampleGood: route.exampleGood || preset.exampleGood || "",
    exampleBad: route.exampleBad || preset.exampleBad || "",
    globPattern: "**/*",
    alwaysApply: false,
  });
}

export interface InstallCommands {
  bash: string;
  powershell: string;
  wget: string;
  cliRunner?: string;
  targetDir: string;
  targetFile: string;
}

export function getInstallCommands(
  formatSlug: string,
  presetSlug: string,
  targetFile: string,
  baseUrl = "https://www.devscratchpad.tech"
): InstallCommands {
  const rawUrl = `${baseUrl.replace(/\/+$/, "")}/api/raw/${formatSlug}/${presetSlug}`;
  const lastSlash = targetFile.lastIndexOf("/");
  const targetDir = lastSlash !== -1 ? targetFile.substring(0, lastSlash) : "";
  const winDir = targetDir.replace(/\//g, "\\");
  const winTargetFile = targetFile.replace(/\//g, "\\");

  const bash = targetDir
    ? `mkdir -p "${targetDir}" && curl -fsSL "${rawUrl}" -o "${targetFile}"`
    : `curl -fsSL "${rawUrl}" -o "${targetFile}"`;

  const powershell = targetDir
    ? `New-Item -ItemType Directory -Force -Path "${winDir}"; Invoke-RestMethod "${rawUrl}" -OutFile "${winTargetFile}"`
    : `Invoke-RestMethod "${rawUrl}" -OutFile "${winTargetFile}"`;

  const wget = targetDir
    ? `mkdir -p "${targetDir}" && wget -qO "${targetFile}" "${rawUrl}"`
    : `wget -qO "${targetFile}" "${rawUrl}"`;

  let cliRunner: string | undefined;
  if (formatSlug === "mcp-config") {
    const mcp = MCP_PRESETS.find((p) => p.id === presetSlug || p.name === presetSlug);
    if (mcp) {
      const envPrefix =
        mcp.env && Object.keys(mcp.env).length > 0
          ? Object.entries(mcp.env)
              .map(([k, v]) => `${k}="${v}"`)
              .join(" ") + " "
          : "";
      cliRunner = `${envPrefix}${mcp.command} ${mcp.args.join(" ")}`;
    }
  }

  return {
    bash,
    powershell,
    wget,
    cliRunner,
    targetDir,
    targetFile,
  };
}

export function getHeredocCommand(targetFile: string, content: string): string {
  const lastSlash = targetFile.lastIndexOf("/");
  const targetDir = lastSlash !== -1 ? targetFile.substring(0, lastSlash) : "";
  const trimmed = content.trim();

  // Find a safe delimiter that does not collide with any isolated line in content
  let delimiter = "EOF";
  if (new RegExp(`^${delimiter}$`, "m").test(trimmed)) {
    let counter = 1;
    while (new RegExp(`^RULE_EOF_${counter}$`, "m").test(trimmed)) {
      counter++;
    }
    delimiter = `RULE_EOF_${counter}`;
  }

  const baseHeredoc = `cat << '${delimiter}' > "${targetFile}"\n${trimmed}\n${delimiter}`;
  return targetDir ? `mkdir -p "${targetDir}" && ${baseHeredoc}` : baseHeredoc;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === "function"
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to textarea fallback
    }
  }

  if (typeof document !== "undefined") {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      textarea.style.left = "-9999px";
      textarea.style.top = "-9999px";
      textarea.setAttribute("readonly", "");
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const success = document.execCommand("copy");
      document.body.removeChild(textarea);
      return success;
    } catch {
      return false;
    }
  }

  return false;
}

