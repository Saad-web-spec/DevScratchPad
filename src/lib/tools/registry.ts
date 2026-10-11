export interface ToolMeta {
  slug: string;
  category: string;
  name: string;
  shortName: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  howToUse: string[];
  edgeCases?: string[];
  shortcuts: string[];
  relatedBlogSlug?: string;
}

export const TOOLS_REGISTRY: Record<string, ToolMeta> = {
  "json-formatter": {
    slug: "json-formatter",
    category: "Data Formatters & Validators",
    name: "JSON Formatter & Validator",
    shortName: "JSON Formatter",
    description: "Format, validate, and minify JSON with interactive syntax highlighting.",
    seoTitle: "JSON Formatter — 100% Client-Side Private",
    seoDescription: "Free online JSON formatter and validator. Format, minify, and validate JSON data locally in your browser. No server uploads.",
    howToUse: [
      "Paste your unformatted JSON data into the editor.",
      "Validation runs as you type; click 'Format' to pretty-print it with 2 or 4 spaces.",
      "Click 'Minify' to strip all whitespace."
    ],
    edgeCases: [
      "Large payloads load in the Monaco editor, but very large files can slow down live validation.",
      "Handles deeply nested structures and shows the error line (when the browser reports it) below the input."
    ],
    shortcuts: ["Ctrl/Cmd + V — Smart Magic Paste", "Ctrl/Cmd + K — Open Command Palette"],
    relatedBlogSlug: "json-formatter-privacy-backed-developer-tools"
  },
  "json-schema-validator": {
    slug: "json-schema-validator",
    category: "Data Formatters & Validators",
    name: "JSON Schema Validator",
    shortName: "JSON Schema Validator",
    description: "Validate JSON data against draft-07 schemas with real-time error reporting.",
    seoTitle: "JSON Schema Validator — AJV Offline",
    seoDescription: "Validate JSON data against JSON Schema specs entirely in your browser using AJV. Free, private, and fast.",
    howToUse: [
      "Paste your JSON data in the left editor.",
      "Paste your JSON Schema in the right editor.",
      "Validation runs as you type and lists each violation with its JSON path."
    ],
    edgeCases: ["External $ref URLs are not fetched; only local refs (#/definitions/...) resolve."],
    shortcuts: []
  },
  "xml-formatter": {
    slug: "xml-formatter",
    category: "Data Formatters & Validators",
    name: "XML Formatter",
    shortName: "XML Formatter",
    description: "Pretty print and format XML documents.",
    seoTitle: "XML Formatter — Indent & Beautify",
    seoDescription: "Format and pretty-print XML documents entirely in your browser.",
    howToUse: [
      "Paste raw XML into the editor.",
      "Click 'Format' to indent it (2 or 4 spaces) or 'Minify' to compact it; syntax is validated as you type."
    ],
    shortcuts: []
  },
  "sql-formatter": {
    slug: "sql-formatter",
    category: "Data Formatters & Validators",
    name: "SQL Formatter",
    shortName: "SQL Formatter",
    description: "Format SQL queries (PostgreSQL, MySQL, SQLite, standard SQL) with proper indentation.",
    seoTitle: "SQL Formatter — Postgres, MySQL & SQLite",
    seoDescription: "Format SQL queries online. Supports PostgreSQL, MySQL, and generic SQL dialects.",
    howToUse: [
      "Paste your unformatted SQL query.",
      "Select your target SQL dialect.",
      "Click 'Format' to get pretty-printed SQL (keywords in UPPERCASE by default)."
    ],
    shortcuts: []
  },
  "graphql-formatter": {
    slug: "graphql-formatter",
    category: "Data Formatters & Validators",
    name: "GraphQL Formatter",
    shortName: "GraphQL Formatter",
    description: "Format GraphQL queries, mutations, and schema definitions.",
    seoTitle: "GraphQL Formatter — Pretty Print Queries",
    seoDescription: "Format and pretty-print GraphQL queries and schemas.",
    howToUse: [
      "Paste your GraphQL query or schema.",
      "Click 'Format' to check the syntax and pretty-print it with the graphql-js printer."
    ],
    shortcuts: []
  },
  "minifier": {
    slug: "minifier",
    category: "Data Formatters & Validators",
    name: "CSS / SVG Minifier",
    shortName: "Minifier",
    description: "Minify and compress CSS stylesheets and SVG graphics.",
    seoTitle: "CSS, SVG & HTML Minifier Online",
    seoDescription: "Minify CSS and SVG online. Reduce file sizes securely in your browser.",
    howToUse: [
      "Select the mode (CSS Minifier or SVG Minifier).",
      "Paste your raw code.",
      "Click 'Minify CSS' or 'Minify SVG', then copy the output and check the 'Saved' badge."
    ],
    shortcuts: []
  },
  "mock-data-generator": {
    slug: "mock-data-generator",
    category: "Data Generators & Mocks",
    name: "Mock Data Generator",
    shortName: "Mock Generator",
    description: "Generate thousands of rows of realistic dummy data (JSON, CSV, SQL) using Faker.js.",
    seoTitle: "Mock Data Generator — JSON, CSV, SQL",
    seoDescription: "Generate massive amounts of realistic mock data in JSON, CSV, or SQL formats entirely in your browser using Faker.js.",
    howToUse: [
      "Define your schema using Faker template fields (e.g. {{person.firstName}}).",
      "Set the Rows count, pick a Format, and click 'Generate'.",
      "Copy or Download the output as JSON, CSV, or SQL INSERT statements."
    ],
    edgeCases: ["Large row counts (the Rows field suggests up to 10,000) can slow down the browser."],
    shortcuts: []
  },
  "uuid-generator": {
    slug: "uuid-generator",
    category: "Data Generators & Mocks",
    name: "UUID / ULID / NanoID Generator",
    shortName: "UUID Generator",
    description: "Generate UUID v4, UUID v7, ULID, and NanoID strings in bulk, locally in your browser.",
    seoTitle: "UUID & ULID Generator — Privacy Bulk IDs",
    seoDescription: "Generate UUIDs (v4, v7), ULIDs, and NanoIDs in bulk directly in your browser. 100% private.",
    howToUse: [
      "Select the ID type (UUID v4, UUID v7, ULID, or NanoID).",
      "Pick a quantity (1 to 100) and an output format (Lines, JSON, or CSV).",
      "IDs generate instantly; click 'Regenerate' for a new batch and 'Copy All' to copy the list."
    ],
    shortcuts: [],
    relatedBlogSlug: "uuid-v4-v5-v7-explained"
  },
  "jwt": {
    slug: "jwt",
    category: "Security & Cryptography",
    name: "JWT Decoder & Inspector",
    shortName: "JWT Decoder",
    description: "Decode JSON Web Tokens locally. Inspect header and claims, and verify HS256 signatures with your secret.",
    seoTitle: "JWT Decoder & Token Inspector",
    seoDescription: "Decode and inspect JWTs (JSON Web Tokens) locally in your browser. We never log or transmit your tokens to a server.",
    howToUse: [
      "Paste your base64-encoded JWT into the input field.",
      "The tool automatically splits and decodes the Header and Payload claims.",
      "Verify expiration dates (exp, iat, nbf) automatically converted to local time."
    ],
    edgeCases: ["Malformed tokens or invalid base64 padding."],
    shortcuts: [],
    relatedBlogSlug: "jwt-token-decode-guide"
  },
  "base64-inspector": {
    slug: "base64-inspector",
    category: "Security & Cryptography",
    name: "Base64 / Hex / Binary Multi-Inspector & Image Previewer",
    shortName: "Base64 & Hex Inspector",
    description: "Auto-detects Base64, URL-safe Base64, Hex, Binary, URL-encoded, and Data URL input and converts it to every format, plus a Canonical Hex Dump.",
    seoTitle: "Base64 & Hex Inspector — Converter & Dump",
    seoDescription: "Free, 100% private Base64, Hex, Binary, and Data URL inspector. Convert encodings, view canonical hex dumps, and preview data URL images directly in your browser.",
    howToUse: [
      "Paste any string, Base64 payload, Hex stream, Binary bits, or Data URL image into the editor.",
      "The tool auto-detects the encoding format and renders simultaneous multi-format conversions.",
      "Switch to 'Canonical Hex Dump' to inspect byte offsets, hex pairs, and ASCII representation.",
      "If an image is detected (Data URL or raw Base64), see it under 'Live Preview' and click 'Download' to save it."
    ],
    edgeCases: ["URL-safe Base64 (- and _); for unpadded strings, select the 'Base64' pill if it is not auto-detected.", "Embedded PNG/JPEG/GIF/WEBP magic bytes in raw Base64."],
    shortcuts: ["Ctrl/Cmd + K — Open Command Palette"],
    relatedBlogSlug: "base64-inspector-guide"
  },
  "hash": {
    slug: "hash",
    category: "Security & Cryptography",
    name: "Hash Generator (MD5, SHA256, SHA512)",
    shortName: "Hash Generator",
    description: "Computes MD5, SHA-1, SHA-256, and SHA-512 in parallel client-side in your browser.",
    seoTitle: "Hash Generator — MD5, SHA256 & SHA512",
    seoDescription: "Generate MD5, SHA-1, SHA-256, and SHA-512 hashes online in parallel without uploading data to servers.",
    howToUse: [
      "Type or paste any text into the Input Text box.",
      "The engine calculates all cryptographic hash sums simultaneously.",
      "Copy required hash output with one click."
    ],
    edgeCases: ["Unicode text is hashed as raw UTF-8 bytes without normalization, so NFC and NFD forms give different hashes."],
    shortcuts: [],
    relatedBlogSlug: "openssl-x509-devops-cheat-sheet"
  },
  "hmac-generator": {
    slug: "hmac-generator",
    category: "Security & Cryptography",
    name: "HMAC Generator",
    shortName: "HMAC Generator",
    description: "Compute Hash-based Message Authentication Codes (HMAC) using SHA256, SHA512, etc.",
    seoTitle: "HMAC Generator — SHA256 & SHA512 Auth",
    seoDescription: "Generate HMAC signatures securely in your browser using a secret key and payload.",
    howToUse: [
      "Enter your secret key.",
      "Enter the message payload.",
      "Select the hash algorithm and view the HMAC output."
    ],
    shortcuts: []
  },
  "password-hash": {
    slug: "password-hash",
    category: "Security & Cryptography",
    name: "Bcrypt / Argon2 / PBKDF2 Password Hash Verifier & Generator",
    shortName: "Password Hash & Verifier",
    description: "Generate Bcrypt, Argon2id, PBKDF2, and SCrypt hashes (with Bcrypt cost and PBKDF2 iteration controls) and verify passwords against Bcrypt hashes.",
    seoTitle: "Bcrypt & Argon2 Hash Generator",
    seoDescription: "Generate Bcrypt, Argon2id, and PBKDF2 password hashes and verify candidate passwords against existing Bcrypt hashes (and Argon2id/PBKDF2 hashes made by this tool) entirely in your browser.",
    howToUse: [
      "Toggle between 'Generate Hash' and 'Verify Password Against Hash' modes.",
      "In Generate mode: enter the plaintext password, adjust the Bcrypt cost factor or PBKDF2 iterations, and click 'Copy Hash'.",
      "In Verify mode: paste an existing hash ($2b$10$...) and the candidate password to see a Match or Mismatch result."
    ],
    edgeCases: ["Bcrypt silently ignores password bytes beyond 72 (no warning is shown).", "Support for $2a$, $2b$, and $2y$ hash dialect prefixes."],
    shortcuts: ["Ctrl/Cmd + K — Open Command Palette"],
    relatedBlogSlug: "password-hashing-bcrypt-argon2"
  },
  "cert-decoder": {
    slug: "cert-decoder",
    category: "Security & Cryptography",
    name: "X.509 Certificate & CSR Decoder",
    shortName: "Certificate Decoder",
    description: "Decode X.509 PEM certificates and PKCS#10 CSRs in your browser. Inspect Subject and Issuer CN, validity dates, public key info, and fingerprints.",
    seoTitle: "X.509 & CSR Decoder — Private SSL Tool",
    seoDescription: "Decode and inspect X.509 SSL/TLS certificates and CSR requests in your browser. View subject and issuer, expiry dates, public key details, and SHA-256/SHA-1 fingerprints.",
    howToUse: [
      "Paste a PEM certificate (-----BEGIN CERTIFICATE-----) or CSR (-----BEGIN CERTIFICATE REQUEST-----), or click 'Upload Certificate' to load a PEM-encoded .pem/.crt/.cer/.csr file.",
      "Instantly inspect the Valid/Expired badge, Not Before/Not After dates, Subject CN, and Issuer CN.",
      "Review Public Key Info (algorithm, key size), the signature algorithm, serial number, and SHA-256/SHA-1 fingerprints."
    ],
    edgeCases: ["Expired certificates are flagged with an Expired badge.", "Wildcard Common Names (e.g. *.example.com)."],
    shortcuts: ["Ctrl/Cmd + K — Open Command Palette"],
    relatedBlogSlug: "x509-certificate-decoder-guide"
  },
  "ssh-key-generator": {
    slug: "ssh-key-generator",
    category: "Security & Cryptography",
    name: "SSH Keypair Generator & Randomart Visualizer",
    shortName: "SSH Key Generator",
    description: "Generate cryptographically secure Ed25519, RSA (2048/4096), and ECDSA P-256 SSH key pairs directly in your browser with OpenSSH Randomart.",
    seoTitle: "SSH Key Generator — Ed25519, RSA, ECDSA",
    seoDescription: "Generate secure SSH key pairs (Ed25519, RSA 4096, ECDSA) in your browser using WebCrypto API. Download the .pub public key and PKCS#8 PEM private key with OpenSSH Randomart visualizer.",
    howToUse: [
      "Select your desired algorithm (Ed25519 is recommended for modern servers).",
      "Enter a Key Comment / Identity (e.g. user@devscratchpad), then click 'Generate New Keypair'.",
      "Copy or download your public key (e.g. id_ed25519.pub) and private key (PKCS#8 PEM; click 'Reveal' to view it).",
      "View the iconic OpenSSH Drunken Bishop Randomart ASCII art visualizer."
    ],
    edgeCases: ["Keys are generated locally and never sent to a server (saving the workspace keeps them in this browser's localStorage).", "OpenSSH wire-format public key serialization done completely client-side."],
    shortcuts: ["Ctrl/Cmd + K — Open Command Palette"],
    relatedBlogSlug: "ssh-key-generator-guide"
  },
  "json-to-ts": {
    slug: "json-to-ts",
    category: "Code & Type Converters",
    name: "JSON to TypeScript Interfaces",
    shortName: "JSON to TS",
    description: "Instantly infer TypeScript interfaces from a JSON payload.",
    seoTitle: "JSON to TypeScript — Private Scratchpad",
    seoDescription: "Convert JSON payloads into strict TypeScript interfaces instantly in your browser.",
    howToUse: [
      "Paste your JSON payload into the left editor.",
      "The engine infers arrays, nested objects, and primitives.",
      "Copy the generated TypeScript interfaces from the TypeScript Definitions pane on the right."
    ],
    shortcuts: [],
    relatedBlogSlug: "json-to-typescript-zod-schema-guide"
  },
  "json-to-zod": {
    slug: "json-to-zod",
    category: "Code & Type Converters",
    name: "JSON to Zod Schema",
    shortName: "JSON to Zod",
    description: "Infer Zod validation schemas directly from JSON payloads.",
    seoTitle: "JSON to Zod Schema Generator Online",
    seoDescription: "Generate Zod runtime validation schemas from JSON examples online.",
    howToUse: [
      "Paste your JSON payload into the left editor.",
      "Copy the corresponding Zod schema code from the right editor."
    ],
    shortcuts: []
  },
  "json-to-go": {
    slug: "json-to-go",
    category: "Code & Type Converters",
    name: "JSON to Go Struct",
    shortName: "JSON to Go",
    description: "Convert JSON payloads into Go struct definitions with json tags.",
    seoTitle: "JSON to Go Struct Generator Online",
    seoDescription: "Automatically generate Go structs from JSON data securely in your browser.",
    howToUse: [
      "Paste your JSON payload into the left editor.",
      "Copy the generated Go structs with `json` tags from the right editor."
    ],
    shortcuts: []
  },
  "yaml": {
    slug: "yaml",
    category: "Code & Type Converters",
    name: "YAML to JSON / JSON to YAML Converter",
    shortName: "YAML / JSON",
    description: "Bidirectional YAML and JSON conversion with syntax validation.",
    seoTitle: "YAML to JSON — 100% Client-Side Tool",
    seoDescription: "Convert YAML to JSON and JSON to YAML securely with our 100% offline, zero server transmission developer tools and scratch pad.",
    howToUse: [
      "Pick 'YAML to JSON' or 'JSON to YAML', then paste your input into the left pane.",
      "The result updates live on the right; use 'Swap' to reverse the direction."
    ],
    shortcuts: [],
    relatedBlogSlug: "yaml-to-json-conversion-developers"
  },
  "curl-to-fetch": {
    slug: "curl-to-fetch",
    category: "Code & Type Converters",
    name: "cURL to JavaScript Fetch",
    shortName: "cURL to Fetch",
    description: "Translate bash cURL commands into JavaScript fetch() API calls.",
    seoTitle: "cURL to Fetch Converter Online",
    seoDescription: "Convert cURL commands into JavaScript fetch() code snippets instantly.",
    howToUse: [
      "Paste a bash `curl` command into the input.",
      "Copy the generated `fetch()` snippet (JSON bodies are wrapped in JSON.stringify; review other body types)."
    ],
    shortcuts: [],
    relatedBlogSlug: "convert-curl-to-fetch-axios"
  },
  "curl-to-python": {
    slug: "curl-to-python",
    category: "Code & Type Converters",
    name: "cURL to Python Requests",
    shortName: "cURL to Python",
    description: "Translate bash cURL commands into Python `requests` code.",
    seoTitle: "cURL to Python Requests Converter Online",
    seoDescription: "Convert cURL commands into Python requests boilerplate instantly.",
    howToUse: [
      "Paste a bash `curl` command.",
      "Copy the Python `requests` script."
    ],
    shortcuts: []
  },
  "curl-to-go": {
    slug: "curl-to-go",
    category: "Code & Type Converters",
    name: "cURL to Go HTTP Request",
    shortName: "cURL to Go",
    description: "Translate bash cURL commands into Go `net/http` client code.",
    seoTitle: "cURL to Go HTTP Request Converter",
    seoDescription: "Translate cURL commands into Go net/http code instantly, entirely in your browser.",
    howToUse: [
      "Paste a bash `curl` command.",
      "Copy the Go HTTP request client code."
    ],
    shortcuts: []
  },
  "svg-to-jsx": {
    slug: "svg-to-jsx",
    category: "Code & Type Converters",
    name: "SVG to JSX Converter",
    shortName: "SVG to JSX",
    description: "Convert raw SVG markup into a React JSX component.",
    seoTitle: "SVG to React JSX Converter Online",
    seoDescription: "Convert raw SVG icons into React JSX components instantly.",
    howToUse: [
      "Paste raw SVG markup into the left editor.",
      "Copy the React component code from the right editor."
    ],
    shortcuts: []
  },
  "epoch-converter": {
    slug: "epoch-converter",
    category: "Time, Network & Utilities",
    name: "Epoch / Timestamp Converter",
    shortName: "Epoch Converter",
    description: "Convert Unix epoch timestamps to human-readable dates (Local and UTC).",
    seoTitle: "Epoch & Unix Timestamp Converter Online",
    seoDescription: "Convert Unix timestamps (seconds or milliseconds) to local, UTC, ISO 8601, and relative times.",
    howToUse: [
      "Enter an epoch timestamp (seconds or milliseconds).",
      "View the localized and UTC date equivalents.",
      "Or, click 'Current Time' to fill in the current epoch timestamp."
    ],
    shortcuts: []
  },
  "regex": {
    slug: "regex",
    category: "Time, Network & Utilities",
    name: "Regex Tester & Matcher",
    shortName: "Regex Tester",
    description: "Real-time RegExp testing with flags (g, i, m, s, u, y), match lists, and substitution preview.",
    seoTitle: "Regex Tester — Real-Time RegEx Testing",
    seoDescription: "Test regular expressions in real-time with regex flag controls, group matches, and string replacement preview.",
    howToUse: [
      "Enter your regular expression pattern and flags.",
      "Paste test string into the text area.",
      "Inspect each match, its index range, and capture groups ($1, $2...) in real time."
    ],
    edgeCases: ["Supports lookbehind assertions (native JS RegExp).", "There is no backtracking timeout, so patterns like (a+)+$ can freeze the tab."],
    shortcuts: [],
    relatedBlogSlug: "regex-cheat-sheet-recipes"
  },
  "diff": {
    slug: "diff",
    category: "Time, Network & Utilities",
    name: "Diff Checker & Text Compare",
    shortName: "Diff Checker",
    description: "Monaco side-by-side or inline code diffing with character-level additions and deletions.",
    seoTitle: "Diff Checker — Side-by-Side Code Compare",
    seoDescription: "Compare text and code side-by-side online. Highlights character-level differences and additions.",
    howToUse: [
      "Paste original text in left pane and modified text in right pane.",
      "The diff shows side-by-side on wider screens and switches to inline view on narrow screens.",
      "Inspect character-level highlighting."
    ],
    edgeCases: ["Large files over 10,000 lines."],
    shortcuts: []
  },
  "cron": {
    slug: "cron",
    category: "Time, Network & Utilities",
    name: "Cron Expression Visualizer",
    shortName: "Cron Visualizer",
    description: "Translates complex cron schedules into plain English with a 5-column breakdown grid.",
    seoTitle: "Cron Expression Visualizer & Generator",
    seoDescription: "Translate cron expressions into human-readable English schedules with a field-by-field breakdown.",
    howToUse: [
      "Paste any standard 5-field cron expression.",
      "Inspect the translated plain English description and column breakdown.",
      "Or pick one of the common schedule presets."
    ],
    edgeCases: ["Non-standard day of week numbering (0 vs 7)."],
    shortcuts: [],
    relatedBlogSlug: "cron-expression-cheat-sheet"
  },
  "cidr-calculator": {
    slug: "cidr-calculator",
    category: "Time, Network & Utilities",
    name: "CIDR Calculator & Subnet Inspector",
    shortName: "CIDR Calculator",
    description: "Calculate IPv4 subnet masks, broadcast addresses, and usable ranges.",
    seoTitle: "CIDR & Subnet Calculator Online",
    seoDescription: "Calculate IPv4 subnets, view CIDR notation, netmasks, broadcast IP, and usable host ranges.",
    howToUse: [
      "Enter an IP address and CIDR suffix (e.g. 192.168.1.0/24).",
      "The tool calculates network boundaries, broadcast IP, and total usable addresses.",
      "View detailed bitmask breakdown."
    ],
    edgeCases: ["/31 (RFC 3021 point-to-point, 2 usable) and /32 (single host) subnets."],
    shortcuts: []
  }
};

export const TOOL_SLUGS = Object.keys(TOOLS_REGISTRY);

export function getToolMeta(slug: string): ToolMeta | undefined {
  return TOOLS_REGISTRY[slug];
}
