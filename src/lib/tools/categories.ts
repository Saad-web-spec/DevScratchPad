import { TOOLS_REGISTRY, type ToolMeta } from "./registry";

export interface DeepGuide {
  overview: string;
  technicalArchitecture: string;
  usageWorkflows: string[];
}

export interface AiStudioRecommendation {
  title: string;
  description: string;
  link: string;
  badge?: string;
}

export interface CategoryFaq {
  question: string;
  answer: string;
}

export interface CategoryMeta {
  slug: string;
  name: string;
  categoryName: string;
  shortTitle: string;
  seoTitle: string;
  seoDescription: string;
  badge: string;
  introHeading: string;
  introDescription: string;
  deepGuide: DeepGuide;
  keyBenefits: string[];
  faqs: CategoryFaq[];
  aiStudioRecommendations: AiStudioRecommendation[];
  toolSlugs: string[];
}

export const CATEGORIES_REGISTRY: Record<string, CategoryMeta> = {
  formatters: {
    slug: "formatters",
    name: "Data Formatters & Validators",
    categoryName: "Data Formatters & Validators",
    shortTitle: "Formatters & Validators",
    seoTitle: "Data Formatters & Validators Online — Free, Offline & Privacy-First",
    seoDescription: "Format, validate, and minify JSON, JSON Schema, XML, SQL, and GraphQL documents in your browser. 100% client-side, zero server transmission, and completely offline.",
    badge: "Data Formatters & Validators",
    introHeading: "Data Formatters & Schema Validators",
    introDescription: "Format, validate, and minify complex data payloads including JSON, XML, SQL, and GraphQL directly in your browser. Engineered with Monaco Editor and local parsers for zero-latency, private data engineering.",
    toolSlugs: [
      "json-formatter",
      "json-schema-validator",
      "xml-formatter",
      "sql-formatter",
      "graphql-formatter",
      "minifier",
    ],
    deepGuide: {
      overview: "Modern engineering involves exchanging high-volume structured payloads between APIs, microservices, databases, and client applications. DevScratchpad Data Formatters & Validators provide an air-gapped, zero-latency workbench for validating schema contracts, pretty-printing minified production logs, and catching syntax regressions before deployment.",
      technicalArchitecture: "Every formatter runs strictly inside your local browser runtime. JSON formatting and schema validation utilize AJV (Another JSON Schema Validator) compiled to execute client-side against Draft-07 and 2020-12 specifications. SQL formatting utilizes localized AST tokenizers supporting Postgres, MySQL, and SQLite dialects. Monaco Editor virtualization enables smooth rendering and line-level diffing even with large multi-megabyte payloads, without transmitting a single byte to an external server or analytics pipeline.",
      usageWorkflows: [
        "Paste raw or minified payloads directly into the Monaco editor with Ctrl/Cmd + V.",
        "Inspect instantaneous syntax errors with line-number indicators and inline diagnostic callouts.",
        "Format or minify with one click, or automatically alphabetize nested object keys.",
        "Validate JSON payloads against strict JSON Schemas to detect missing required properties or type mismatches.",
      ],
    },
    keyBenefits: [
      "Zero-latency parsing powered by client-side Web Workers and Monaco Editor.",
      "100% private data isolation — no payloads ever leave your browser memory.",
      "Full offline capability for air-gapped systems and sensitive enterprise environments.",
      "Instant copy, clean minification, and deep syntax highlighting.",
    ],
    faqs: [
      {
        question: "Is my sensitive JSON or SQL query sent to any server?",
        answer: "No. DevScratchpad formatters execute completely client-side in your local browser sandbox. Neither your raw data, schema definitions, nor formatted outputs are sent over the network.",
      },
      {
        question: "Can I format large multi-megabyte files without browser freezing?",
        answer: "Yes. The formatters use the Monaco Editor engine (the same code editor powering VS Code) with virtualized DOM rendering and background parsing to comfortably process multi-megabyte payloads.",
      },
      {
        question: "Which JSON Schema drafts are supported in the validator?",
        answer: "The JSON Schema Validator supports Draft-07, Draft-2019-09, and Draft-2020-12 schemas powered by AJV with full format validation.",
      },
      {
        question: "Does the SQL formatter support specific database dialects?",
        answer: "Yes, our SQL formatter handles standard ANSI SQL, PostgreSQL, MySQL, SQLite, and MariaDB formatting rules including uppercase keywords and indentation.",
      },
    ],
    aiStudioRecommendations: [
      {
        title: "Next.js 15 Cursor Rules",
        description: "Enforce strict Zod schema validation and TypeScript contracts for Next.js App Router Server Actions.",
        link: "/ai-skill-studio/cursor-rules/nextjs-15",
        badge: "Cursor Rules",
      },
      {
        title: "Fullstack Agent Team",
        description: "Coordinate multi-agent personas with strict input validation, API contract adherence, and zero data leakage.",
        link: "/ai-skill-studio/cursor-rules/fullstack-agent-team",
        badge: "Multi-Agent",
      },
      {
        title: "Codebase Auditor Claude Skill",
        description: "Equip Claude Code with automated capabilities to audit data schemas, identify lint regressions, and test payload integrity.",
        link: "/ai-skill-studio/claude-skills/codebase-auditor",
        badge: "Claude Skill",
      },
    ],
  },
  converters: {
    slug: "converters",
    name: "Code & Type Converters",
    categoryName: "Code & Type Converters",
    shortTitle: "Code Converters",
    seoTitle: "Code & Type Converters Online — JSON to TS, Zod, Go & cURL | DevScratchpad",
    seoDescription: "Convert JSON to TypeScript interfaces, Zod schemas, and Go structs, translate cURL to Fetch, Python, and Go, and transform SVG to JSX. 100% client-side and offline.",
    badge: "Code & Type Converters",
    introHeading: "Code & Type Converters",
    introDescription: "Transform API payloads into strict TypeScript interfaces, Zod schemas, Go structs, and translate bash cURL commands into JavaScript fetch, Python requests, or Go clients instantly.",
    toolSlugs: [
      "json-to-ts",
      "json-to-zod",
      "json-to-go",
      "yaml",
      "curl-to-fetch",
      "curl-to-python",
      "curl-to-go",
      "svg-to-jsx",
    ],
    deepGuide: {
      overview: "Cross-language engineering requires frequently bridging raw JSON API payloads into strict type systems, and bash network invocations into idiomatic code. DevScratchpad Code & Type Converters automate this translation process client-side with zero latency, providing production-ready types and networking code.",
      technicalArchitecture: "Conversion algorithms parse Abstract Syntax Trees (ASTs) and JSON tokens entirely in Web Worker threads. JSON-to-TypeScript recurses through deeply nested structures to infer primitive types, union alternatives, and optional properties. cURL converters parse command-line arguments (flags, headers, raw bodies, and authentication headers) into standardized HTTP request models, generating idiomatic Fetch, Python Requests, or Go net/http implementations without server dependencies.",
      usageWorkflows: [
        "Paste an API JSON response into the converter to immediately generate TypeScript interfaces or Zod schemas.",
        "Paste terminal cURL snippets from DevTools Network tab to generate production-ready Python or Fetch request code.",
        "Convert YAML manifests to JSON and vice-versa with bidirectional synchronization.",
        "Clean and transform SVG vector graphics into clean, JSX/TSX React components with inline props.",
      ],
    },
    keyBenefits: [
      "Instant type generation for TypeScript, Zod, and Go without boilerplate.",
      "Network command translation from cURL into modern fetch, Python, and Go.",
      "Bidirectional YAML ↔ JSON parsing with full syntax checking.",
      "Clean SVG-to-JSX conversion stripping unsafe XML attributes and formatting React props.",
    ],
    faqs: [
      {
        question: "How accurate is the JSON to TypeScript converter?",
        answer: "The converter analyzes object shapes, array item types, nested models, and nullability to generate strictly typed interfaces with clean casing and exported types.",
      },
      {
        question: "Can I convert complex cURL commands with cookies, headers, and form-data?",
        answer: "Yes. Our cURL parser handles multi-header authentication (-H), query params, Bearer tokens, JSON bodies (-d), and multipart form data.",
      },
      {
        question: "Does the YAML converter handle multi-document YAML files?",
        answer: "The YAML engine supports standard YAML 1.2 syntax, document dividers, and maps cleanly to equivalent JSON structures.",
      },
      {
        question: "Are private API keys or cURL authorization headers leaked?",
        answer: "Never. All string manipulation and AST conversion executes inside your local browser thread. Nothing is transmitted externally.",
      },
    ],
    aiStudioRecommendations: [
      {
        title: "Next.js 15 Cursor Rules",
        description: "Automatically translate backend API contracts into strict TypeScript interfaces and Zod schemas in Next.js.",
        link: "/ai-skill-studio/cursor-rules/nextjs-15",
        badge: "Cursor Rules",
      },
      {
        title: "Python FastAPI Cursor Rules",
        description: "Bridge data schemas into Pydantic v2 models, async route handlers, and typed responses.",
        link: "/ai-skill-studio/cursor-rules/fastapi",
        badge: "Cursor Rules",
      },
      {
        title: "PostgreSQL MCP Config",
        description: "Connect Cursor and Claude directly to Postgres databases with typed schema reflection and SQL generation.",
        link: "/ai-skill-studio/mcp-config/postgres",
        badge: "MCP Server",
      },
    ],
  },
  crypto: {
    slug: "crypto",
    name: "Security & Cryptography",
    categoryName: "Security & Cryptography",
    shortTitle: "Security & Cryptography",
    seoTitle: "Security & Cryptography Tools Online — JWT, Hashes, Bcrypt & SSH Keys | DevScratchpad",
    seoDescription: "Inspect JWTs, generate Bcrypt/Argon2 password hashes, compute SHA/HMAC digests, decode X.509 certificates, and generate SSH key pairs offline in your browser.",
    badge: "Security & Cryptography",
    introHeading: "Security & Cryptography Utilities",
    introDescription: "Decode JWT tokens, inspect X.509 SSL certificates, generate SSH key pairs with Randomart, compute HMAC/SHA hashes, and verify Bcrypt passwords completely offline in your browser.",
    toolSlugs: [
      "jwt",
      "base64-inspector",
      "hash",
      "hmac-generator",
      "password-hash",
      "cert-decoder",
      "ssh-key-generator",
    ],
    deepGuide: {
      overview: "Handling credentials, private keys, authentication tokens, and cryptographic certificates on unverified online web tools is a severe security risk. DevScratchpad provides an air-gapped, zero-server-transmission security workstation where all cryptographic operations execute locally in browser memory using WebCrypto and native assembly.",
      technicalArchitecture: "Cryptographic primitives leverage the browser's hardware-accelerated Web Cryptography API (window.crypto.subtle) for SHA-256, SHA-512, HMAC, ECDSA, and RSA keypair generation. Ed25519 and Bcrypt operations utilize pure JavaScript/Wasm implementations with zero remote dependencies. X.509 certificates are parsed using @peculiar/x509 to decode ASN.1 structures locally. Memory buffers are immediately reclaimed upon session refresh, guaranteeing private keys and passwords never traverse the network.",
      usageWorkflows: [
        "Inspect JWT headers, payloads, claims, and expiry dates without exposing sensitive bearer tokens to third-party loggers.",
        "Generate cryptographically secure Ed25519 and RSA SSH key pairs directly in your browser with OpenSSH Randomart visualizer.",
        "Verify candidate passwords against Bcrypt ($2a/$2b) hashes and calculate secure cost rounds.",
        "Inspect X.509 SSL/TLS certificates to verify Common Name, Issuer, Subject Alternative Names (SANs), and expiration countdowns.",
      ],
    },
    keyBenefits: [
      "100% Client-Side WebCrypto execution ensuring zero server transmission of private keys.",
      "Comprehensive JWT decoding with timestamp conversion and signature claim analysis.",
      "Instant SSH keypair generation (Ed25519, RSA 4096) with OpenSSH Randomart preview.",
      "Multi-hash calculations (MD5, SHA-1, SHA-256, SHA-512, HMAC) calculated in parallel.",
    ],
    faqs: [
      {
        question: "Is it truly safe to paste production JWTs or private keys into this tool?",
        answer: "Yes. Unlike other online tools that send tokens to backend servers for decoding, DevScratchpad performs 100% of cryptographic decoding in client-side memory. You can verify this by checking your browser's Network tab—zero HTTP requests are made.",
      },
      {
        question: "Which SSH key algorithms can I generate?",
        answer: "You can generate Ed25519 (modern, fast, and secure), RSA (2048 and 4096-bit), and ECDSA (NIST P-256/P-384/P-521) keys with downloadable public and private key files.",
      },
      {
        question: "How does Bcrypt and Argon2 password verification work offline?",
        answer: "The password hash verifier runs bcryptjs and client-side password hashing routines in your browser, performing salt extraction and cryptographic comparisons locally.",
      },
      {
        question: "Can I inspect CSRs (Certificate Signing Requests) and SSL certs?",
        answer: "Yes. The X.509 decoder parses PEM certificates and CSRs, extracting SANs, key algorithm specifications, validity periods, and SHA-256 fingerprints.",
      },
    ],
    aiStudioRecommendations: [
      {
        title: "Security Guard Claude Skill",
        description: "Equip Claude Code with OWASP vulnerability scanning, secret leak detection, and cryptographic audit skills.",
        link: "/ai-skill-studio/claude-skills/security-guard",
        badge: "Claude Skill",
      },
      {
        title: "Supabase & Postgres Cursor Rules",
        description: "Enforce strict Row-Level Security (RLS) policies, prevent service_role leaks, and guard client endpoints.",
        link: "/ai-skill-studio/cursor-rules/supabase",
        badge: "Cursor Rules",
      },
      {
        title: "Docker & DevOps AGENTS.md",
        description: "Enforce secret management, isolated container networks, and air-gapped SSH deployment rules.",
        link: "/ai-skill-studio/agents-md/docker-devops",
        badge: "Multi-Agent",
      },
    ],
  },
  generators: {
    slug: "generators",
    name: "Data Generators & Mocks",
    categoryName: "Data Generators & Mocks",
    shortTitle: "Generators & Mocks",
    seoTitle: "Data Generators & Mocks Online — Bulk UUID, ULID & Mock Data | DevScratchpad",
    seoDescription: "Generate realistic dummy data in JSON, CSV, or SQL formats and cryptographically secure UUIDv4, ULID, and NanoID strings in bulk. 100% client-side.",
    badge: "Data Generators & Mocks",
    introHeading: "Data Generators & Mock Suites",
    introDescription: "Generate thousands of rows of realistic dummy data (JSON, CSV, SQL) and bulk cryptographically secure UUIDv4, ULID, and NanoID identifiers directly in your browser.",
    toolSlugs: ["mock-data-generator", "uuid-generator"],
    deepGuide: {
      overview: "Software testing, performance benchmarking, and database seeding require high volumes of realistic, structurally accurate test data. DevScratchpad Data Generators provide rapid, deterministic generation of mock records and unique identifiers without needing backend seeding scripts or external API quotas.",
      technicalArchitecture: "Mock data generation is powered by @faker-js/faker running locally in browser memory, allowing developers to generate names, emails, addresses, financial figures, and custom schemas. The UUID & ULID generator uses window.crypto.getRandomValues() for cryptographically strong pseudorandom numbers (CSPRNG), supporting bulk generation of up to 10,000 unique keys per batch with instant zero-copy export to JSON, CSV, or SQL insert statements.",
      usageWorkflows: [
        "Define a mock data schema using intuitive template tags (e.g., {{person.fullName}}, {{internet.email}}, {{finance.amount}}).",
        "Specify row counts and export formats (JSON array, CSV spreadsheet, or SQL INSERT statements).",
        "Generate bulk lists of UUIDv4, ULID, or NanoID strings with custom prefixes or capitalization.",
        "Copy to clipboard or download files directly with zero server roundtrips.",
      ],
    },
    keyBenefits: [
      "Bulk ID generation (UUIDv4, ULID, NanoID) with CSPRNG cryptographic randomness.",
      "Multi-format mock data export to JSON, CSV, and relational SQL INSERT scripts.",
      "Extensive Faker schema library covering users, commerce, dates, and locations.",
      "High-throughput generation handling thousands of rows without browser lockup.",
    ],
    faqs: [
      {
        question: "Are the generated UUIDs cryptographically secure?",
        answer: "Yes. DevScratchpad uses the browser's native crypto.getRandomValues() CSPRNG to ensure genuine cryptographic entropy and collision resistance.",
      },
      {
        question: "What is the difference between UUIDv4 and ULID?",
        answer: "UUIDv4 is completely random and non-sortable. ULID (Universally Unique Lexicographically Sortable Identifier) includes a 48-bit timestamp prefix, making it chronological, sortable in B-trees, and highly efficient for database primary keys.",
      },
      {
        question: "Can I export mock data directly to SQL insert statements?",
        answer: "Yes. You can choose SQL format and specify table name, producing formatted INSERT INTO statements ready to pipe directly into psql or MySQL.",
      },
      {
        question: "What is the maximum number of rows I can generate at once?",
        answer: "You can comfortably generate up to 50,000 mock rows or 10,000 UUIDs per batch directly in browser memory.",
      },
    ],
    aiStudioRecommendations: [
      {
        title: "TDD Specialist Cursor Rules",
        description: "Equip Cursor with test-driven development methodologies, automated test fixture generation, and mock assertions.",
        link: "/ai-skill-studio/cursor-rules/tdd-specialist",
        badge: "Cursor Rules",
      },
      {
        title: "Prisma ORM Cursor Rules",
        description: "Enforce safe database migrations, typed seeders, and relational entity fixtures.",
        link: "/ai-skill-studio/cursor-rules/prisma",
        badge: "Cursor Rules",
      },
      {
        title: "Vibe Coder Agent Rules",
        description: "Rapidly prototype functional applications with realistic mock data scaffolding and creative UI iteration.",
        link: "/ai-skill-studio/cursor-rules/vibe-coder",
        badge: "Cursor Rules",
      },
    ],
  },
  utilities: {
    slug: "utilities",
    name: "Time, Network & Utilities",
    categoryName: "Time, Network & Utilities",
    shortTitle: "Time & Network Utilities",
    seoTitle: "Time, Network & Developer Utilities Online — Epoch, Regex, Diff, Cron & CIDR | DevScratchpad",
    seoDescription: "Convert Unix epoch timestamps, test regular expressions with visual capture groups, compare text diffs, visualize cron schedules, and calculate CIDR IP subnets offline.",
    badge: "Time, Network & Utilities",
    introHeading: "Time, Network & Developer Utilities",
    introDescription: "Essential day-to-day developer utilities: Unix timestamp conversions, real-time RegExp matching, Monaco code diffing, cron schedule visualization, and CIDR subnet calculation.",
    toolSlugs: [
      "epoch-converter",
      "regex",
      "diff",
      "cron",
      "cidr-calculator",
    ],
    deepGuide: {
      overview: "From configuring infrastructure subnet masks to troubleshooting time zones, scheduling background worker jobs, and testing complex regular expressions, developers need reliable utilities that work instantly without ads, cookies, or cloud transmission. DevScratchpad Time, Network & Utilities bring these essential tools into a unified, high-performance interface.",
      technicalArchitecture: "Calculations execute entirely client-side using native JavaScript APIs. The CIDR calculator performs bitwise arithmetic on IPv4 and IPv6 addresses to compute network masks, broadcast boundaries, and usable host counts. The Cron visualizer decomposes 5-field cron strings into human-readable cadence schedules and forecasts future runtimes with timezone accuracy. The Diff Checker leverages Monaco's internal Myers diff algorithm with character-level granularity.",
      usageWorkflows: [
        "Convert Unix epoch timestamps between seconds, milliseconds, UTC, and local time zones.",
        "Test complex RegExp patterns with immediate match highlighting, capture group extraction, and substitution preview.",
        "Compare config files and code blocks side-by-side or inline with Monaco syntax-aware diffing.",
        "Translate cryptic cron expressions into human-readable schedules with upcoming run forecasting.",
        "Calculate IPv4/IPv6 subnet boundaries, usable host ranges, and binary bitmasks.",
      ],
    },
    keyBenefits: [
      "Comprehensive Unix epoch conversion supporting seconds, milliseconds, and ISO-8601.",
      "Real-time regex tester with flag controls and capture group visualization.",
      "High-performance Monaco diff engine with character-level accuracy.",
      "Instant cron schedule translation and CIDR subnet calculation with zero server requests.",
    ],
    faqs: [
      {
        question: "How does the Cron Expression Visualizer forecast execution times?",
        answer: "The visualizer parses standard 5-field cron syntax (minute, hour, day of month, month, day of week) and iterates forward using local or UTC time to calculate the exact upcoming trigger times.",
      },
      {
        question: "Does the CIDR calculator support IPv6 as well as IPv4?",
        answer: "Yes. You can calculate subnet boundaries, host counts, and bitmasks for both IPv4 (/24, /16, etc.) and IPv6 (/64, /48, etc.) address ranges.",
      },
      {
        question: "How does the Diff Checker handle large files?",
        answer: "Powered by Monaco Editor (the core editor of VS Code), the Diff Checker uses optimized diffing algorithms with virtualization, easily comparing files with thousands of lines.",
      },
      {
        question: "Does the regex tester guard against catastrophic backtracking?",
        answer: "Yes, matching executes with execution boundaries to prevent browser freezing during complex regular expression evaluations.",
      },
    ],
    aiStudioRecommendations: [
      {
        title: "Docker & DevOps Cursor Rules",
        description: "Automate container networking, CIDR subnets, and cron daemon configurations in Docker environments.",
        link: "/ai-skill-studio/cursor-rules/docker-devops",
        badge: "Cursor Rules",
      },
      {
        title: "Fullstack Agent Team",
        description: "Coordinate distributed system logic, timestamp conversions, and regex input validation across services.",
        link: "/ai-skill-studio/cursor-rules/fullstack-agent-team",
        badge: "Multi-Agent",
      },
      {
        title: "Fetch MCP Server Config",
        description: "Allow Claude and Cursor to fetch and inspect web content, network headers, and API endpoints securely.",
        link: "/ai-skill-studio/mcp-config/fetch",
        badge: "MCP Server",
      },
    ],
  },
};

export const CATEGORY_SLUGS = Object.keys(CATEGORIES_REGISTRY);

export function getAllCategories(): CategoryMeta[] {
  return Object.values(CATEGORIES_REGISTRY);
}

export function getCategoryBySlug(slug: string): CategoryMeta | undefined {
  return CATEGORIES_REGISTRY[slug];
}

export function getCategoryByRegistryName(name: string): CategoryMeta | undefined {
  if (!name) return undefined;
  const trimmed = name.trim().toLowerCase();
  return Object.values(CATEGORIES_REGISTRY).find(
    (c) => c.name.toLowerCase() === trimmed || c.categoryName.toLowerCase() === trimmed
  );
}

export function getCategoryForTool(toolSlug: string): CategoryMeta | undefined {
  const tool = TOOLS_REGISTRY[toolSlug];
  if (!tool) {
    // Fallback: check toolSlugs list in categories
    return Object.values(CATEGORIES_REGISTRY).find((c) => c.toolSlugs.includes(toolSlug));
  }
  return getCategoryByRegistryName(tool.category);
}

export function getToolsForCategory(categorySlug: string): ToolMeta[] {
  const category = getCategoryBySlug(categorySlug);
  if (!category) return [];
  return category.toolSlugs
    .map((slug) => TOOLS_REGISTRY[slug])
    .filter((tool): tool is ToolMeta => Boolean(tool));
}
