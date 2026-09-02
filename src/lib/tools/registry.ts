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
}

export const TOOLS_REGISTRY: Record<string, ToolMeta> = {
  "json-formatter": {
    slug: "json-formatter",
    category: "Data Formatters & Validators",
    name: "JSON Formatter & Validator",
    shortName: "JSON Formatter",
    description: "Format, validate, and minify JSON with interactive syntax highlighting and sorting.",
    seoTitle: "JSON Formatter - Privacy Backed & 100% Client-Side Developer Tools",
    seoDescription: "Free online JSON formatter and validator. Format, minify, and lint JSON data locally in your browser. No server uploads.",
    howToUse: [
      "Paste your unformatted JSON data into the editor.",
      "The tool will automatically validate and format it with proper indentation.",
      "Use the 'Minify' button to strip whitespace, or 'Sort Keys' to alphabetize the structure."
    ],
    edgeCases: [
      "Extremely large JSON payloads (50MB+) are supported via Monaco Editor.",
      "Handles deeply nested structures and displays precise line-number validation errors."
    ],
    shortcuts: ["Ctrl/Cmd + V — Smart Magic Paste", "Ctrl/Cmd + K — Open Command Palette"]
  },
  "json-schema-validator": {
    slug: "json-schema-validator",
    category: "Data Formatters & Validators",
    name: "JSON Schema Validator",
    shortName: "JSON Schema Validator",
    description: "Validate JSON data against draft-07/2020-12 schemas with real-time error highlighting.",
    seoTitle: "JSON Schema Validator Online — AJV Secure & Offline",
    seoDescription: "Validate JSON data against JSON Schema specs entirely in your browser using AJV. Free, private, and fast.",
    howToUse: [
      "Paste your JSON data in the left editor.",
      "Paste your JSON Schema in the right editor.",
      "Validation runs instantly, highlighting exact lines with schema violations."
    ],
    edgeCases: ["Unsupported external schema references ($ref)."],
    shortcuts: []
  },
  "xml-formatter": {
    slug: "xml-formatter",
    category: "Data Formatters & Validators",
    name: "XML Formatter",
    shortName: "XML Formatter",
    description: "Pretty print and format XML documents.",
    seoTitle: "XML Formatter Online — DevScratchpad",
    seoDescription: "Format and pretty-print XML documents entirely in your browser.",
    howToUse: [
      "Paste raw XML into the editor.",
      "The engine will parse and format the DOM tree with correct indentation."
    ],
    shortcuts: []
  },
  "sql-formatter": {
    slug: "sql-formatter",
    category: "Data Formatters & Validators",
    name: "SQL Formatter",
    shortName: "SQL Formatter",
    description: "Format SQL queries (PostgreSQL, MySQL, SQLite, standard SQL) with proper indentation.",
    seoTitle: "SQL Formatter Online — DevScratchpad",
    seoDescription: "Format SQL queries online. Supports PostgreSQL, MySQL, and generic SQL dialects.",
    howToUse: [
      "Paste your unformatted SQL query.",
      "Select your target SQL dialect.",
      "View the pretty-printed, capitalized SQL output."
    ],
    shortcuts: []
  },
  "graphql-formatter": {
    slug: "graphql-formatter",
    category: "Data Formatters & Validators",
    name: "GraphQL Formatter",
    shortName: "GraphQL Formatter",
    description: "Format GraphQL queries, mutations, and schema definitions.",
    seoTitle: "GraphQL Formatter Online — DevScratchpad",
    seoDescription: "Format and pretty-print GraphQL queries and schemas.",
    howToUse: [
      "Paste your GraphQL query or schema.",
      "The tool validates syntax and applies standard Prettier formatting."
    ],
    shortcuts: []
  },
  "minifier": {
    slug: "minifier",
    category: "Data Formatters & Validators",
    name: "CSS / SVG / HTML Minifier",
    shortName: "Minifier",
    description: "Minify and compress CSS stylesheets, SVG graphics, and HTML documents.",
    seoTitle: "CSS/SVG/HTML Minifier Online — DevScratchpad",
    seoDescription: "Minify CSS, SVG, and HTML online instantly. Reduce file sizes securely in your browser.",
    howToUse: [
      "Select the input type (CSS, SVG, HTML).",
      "Paste your raw code.",
      "Copy the compressed output and view the byte savings."
    ],
    shortcuts: []
  },
  "mock-data-generator": {
    slug: "mock-data-generator",
    category: "Data Generators & Mocks",
    name: "Mock Data Generator",
    shortName: "Mock Generator",
    description: "Generate thousands of rows of realistic dummy data (JSON, CSV, SQL) using Faker.js.",
    seoTitle: "Mock Data Generator Online — DevScratchpad",
    seoDescription: "Generate massive amounts of realistic mock data in JSON, CSV, or SQL formats entirely in your browser using Faker.js.",
    howToUse: [
      "Define your schema using Faker template fields (e.g. {{person.firstName}}).",
      "Set the number of rows to generate.",
      "Export as JSON, CSV, or SQL Insert statements."
    ],
    edgeCases: ["Generating more than 100,000 rows might slow down the browser."],
    shortcuts: []
  },
  "uuid-generator": {
    slug: "uuid-generator",
    category: "Data Generators & Mocks",
    name: "UUID / ULID / NanoID Generator",
    shortName: "UUID Generator",
    description: "Generate cryptographically secure UUIDv4, ULID, and NanoID strings in bulk.",
    seoTitle: "UUID & ULID Generator - Developer Tools for Privacy Backed Bulk IDs",
    seoDescription: "Generate secure UUIDs (v4), ULIDs, and NanoIDs in bulk directly in your browser. 100% private.",
    howToUse: [
      "Select the ID format (UUIDv4, ULID, or NanoID).",
      "Specify the quantity to generate (up to 10,000 at once).",
      "Click Generate and copy the list."
    ],
    shortcuts: []
  },
  "jwt": {
    slug: "jwt",
    category: "Security & Cryptography",
    name: "JWT Decoder & Inspector",
    shortName: "JWT Decoder",
    description: "Decode JSON Web Tokens securely. Inspect claims, header, and signature status locally.",
    seoTitle: "JWT Decoder Online — Secure JSON Web Token Inspector",
    seoDescription: "Decode and inspect JWTs (JSON Web Tokens) locally in your browser. We never log or transmit your tokens to a server.",
    howToUse: [
      "Paste your base64-encoded JWT into the input field.",
      "The tool automatically splits and decodes the Header and Payload claims.",
      "Verify expiration dates (exp, iat, nbf) automatically converted to local time."
    ],
    edgeCases: ["Malformed tokens or invalid base64 padding."],
    shortcuts: []
  },
  "base64-inspector": {
    slug: "base64-inspector",
    category: "Security & Cryptography",
    name: "Base64 / Hex / Binary Multi-Inspector & Image Previewer",
    shortName: "Base64 & Hex Inspector",
    description: "Auto-detects and converts between Base64, URL-Safe Base64, Hexadecimal streams, Canonical Hex Dumps, Binary octets, and Data URL images.",
    seoTitle: "Base64 & Hex Inspector Online — Multi-Format Converter & Hex Dump",
    seoDescription: "Free, 100% private Base64, Hex, Binary, and Data URL inspector. Convert encodings, view canonical hex dumps, and preview data URL images directly in your browser.",
    howToUse: [
      "Paste any string, Base64 payload, Hex stream, Binary bits, or Data URL image into the editor.",
      "The tool auto-detects the encoding format and renders simultaneous multi-format conversions.",
      "Switch to 'Canonical Hex Dump' to inspect byte offsets, hex pairs, and ASCII representation.",
      "If an image Data URL is detected, view the live high-contrast preview canvas and download the file."
    ],
    edgeCases: ["URL-safe unpadded Base64 strings (- and _).", "Embedded PNG/JPEG/WEBP magic bytes in raw Base64."],
    shortcuts: ["Ctrl/Cmd + K — Open Command Palette"]
  },
  "hash": {
    slug: "hash",
    category: "Security & Cryptography",
    name: "Hash Generator (MD5, SHA256, SHA512)",
    shortName: "Hash Generator",
    description: "Computes MD5, SHA-1, SHA-256, and SHA-512 in parallel client-side in your browser.",
    seoTitle: "Hash Generator Online (MD5, SHA-1, SHA-256, SHA-512) — DevScratchpad",
    seoDescription: "Generate MD5, SHA-1, SHA-256, and SHA-512 hashes online in parallel without uploading data to servers.",
    howToUse: [
      "Type or paste any input text or file hash data.",
      "The engine calculates all cryptographic hash sums simultaneously.",
      "Copy required hash output with one click."
    ],
    edgeCases: ["Unicode character normalization in hashing."],
    shortcuts: []
  },
  "hmac-generator": {
    slug: "hmac-generator",
    category: "Security & Cryptography",
    name: "HMAC Generator",
    shortName: "HMAC Generator",
    description: "Compute Hash-based Message Authentication Codes (HMAC) using SHA256, SHA512, etc.",
    seoTitle: "HMAC Generator Online — SHA256, SHA512 Mac Authentication",
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
    description: "Generate and verify passwords against Bcrypt ($2a/$2b), Argon2id, and PBKDF2 hashes with cost factor controls.",
    seoTitle: "Bcrypt & Argon2 Hash Generator & Verifier Online — DevScratchpad",
    seoDescription: "Generate Bcrypt, Argon2id, and PBKDF2 password hashes and verify candidate passwords against existing hashes entirely in your browser.",
    howToUse: [
      "Toggle between 'Generate Hash' and 'Verify Password Against Hash' modes.",
      "In Generate mode: Enter plaintext password, adjust cost rounds or iterations, and copy generated hash.",
      "In Verify mode: Paste an existing hash ($2b$10$...) and candidate password to receive an instant match verification badge."
    ],
    edgeCases: ["Bcrypt 72-byte string truncation limits.", "Support for $2a$, $2b$, and $2y$ hash dialect prefixes."],
    shortcuts: ["Ctrl/Cmd + K — Open Command Palette"]
  },
  "cert-decoder": {
    slug: "cert-decoder",
    category: "Security & Cryptography",
    name: "X.509 Certificate & CSR Decoder",
    shortName: "Certificate Decoder",
    description: "Decode X.509 PEM certificates and PKCS#10 CSRs in your browser. Inspect Subject, Issuer, SANs, Validity countdown, and fingerprints.",
    seoTitle: "X.509 Certificate & CSR Decoder Online — 100% Private SSL Inspector",
    seoDescription: "Decode and inspect X.509 SSL/TLS certificates and CSR requests in your browser. View Subject Alternative Names (SANs), expiry dates, fingerprints, and key usages.",
    howToUse: [
      "Paste a PEM certificate (-----BEGIN CERTIFICATE-----) or CSR (-----BEGIN CERTIFICATE REQUEST-----), or upload a .crt/.pem file.",
      "Instantly inspect certificate status, validity countdown, Common Name, and Issuer.",
      "Review Subject Alternative Names (SANs) and Cryptographic Properties (Key size, algorithm, SHA-256 fingerprint)."
    ],
    edgeCases: ["Expired or not-yet-valid certificates.", "Wildcard DNS and multi-SAN SSL certificates."],
    shortcuts: ["Ctrl/Cmd + K — Open Command Palette"]
  },
  "ssh-key-generator": {
    slug: "ssh-key-generator",
    category: "Security & Cryptography",
    name: "SSH Keypair Generator & Randomart Visualizer",
    shortName: "SSH Key Generator",
    description: "Generate cryptographically secure Ed25519, RSA (2048/4096), and ECDSA SSH key pairs directly in your browser with OpenSSH Randomart.",
    seoTitle: "SSH Key Generator Online (Ed25519, RSA, ECDSA) — OpenSSH Randomart",
    seoDescription: "Generate secure SSH key pairs (Ed25519, RSA 4096, ECDSA) in your browser using WebCrypto API. Download .pub and .pem keys with OpenSSH Randomart visualizer.",
    howToUse: [
      "Select your desired algorithm (Ed25519 is recommended for modern servers).",
      "Enter a custom comment or email identity (e.g. user@devscratchpad).",
      "Copy or download your public key (id_ed25519.pub) and private key (PKCS#8 PEM).",
      "View the iconic OpenSSH Drunken Bishop Randomart ASCII art visualizer."
    ],
    edgeCases: ["Zero server transmission ensures private keys never leave your machine memory.", "OpenSSH wire format binary serialization done completely client-side."],
    shortcuts: ["Ctrl/Cmd + K — Open Command Palette"]
  },
  "json-to-ts": {
    slug: "json-to-ts",
    category: "Code & Type Converters",
    name: "JSON to TypeScript Interfaces",
    shortName: "JSON to TS",
    description: "Instantly infer TypeScript interfaces and types from a JSON payload.",
    seoTitle: "JSON to TypeScript Converter - Privacy Backed Developer Scratchpad",
    seoDescription: "Convert JSON payloads into strict TypeScript interfaces instantly in your browser.",
    howToUse: [
      "Paste your JSON payload into the left editor.",
      "The engine infers arrays, nested objects, and primitives.",
      "Copy the exported TypeScript interfaces from the right editor."
    ],
    shortcuts: []
  },
  "json-to-zod": {
    slug: "json-to-zod",
    category: "Code & Type Converters",
    name: "JSON to Zod Schema",
    shortName: "JSON to Zod",
    description: "Infer Zod validation schemas directly from JSON payloads.",
    seoTitle: "JSON to Zod Schema Generator Online — DevScratchpad",
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
    seoTitle: "JSON to Go Struct Generator Online — DevScratchpad",
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
    seoTitle: "YAML to JSON Converter - 100% Client-Side Developer Scratchpad",
    seoDescription: "Convert YAML to JSON and JSON to YAML securely with our 100% offline, zero server transmission developer tools and scratch pad.",
    howToUse: [
      "Paste YAML or JSON into the left pane.",
      "The tool auto-detects the format and converts it to the counterpart on the right."
    ],
    shortcuts: []
  },
  "curl-to-fetch": {
    slug: "curl-to-fetch",
    category: "Code & Type Converters",
    name: "cURL to JavaScript Fetch",
    shortName: "cURL to Fetch",
    description: "Translate bash cURL commands into JavaScript fetch() API calls.",
    seoTitle: "cURL to Fetch Converter Online — DevScratchpad",
    seoDescription: "Convert cURL commands into JavaScript fetch() code snippets instantly.",
    howToUse: [
      "Paste a bash `curl` command into the input.",
      "Copy the ready-to-use JavaScript `fetch()` syntax."
    ],
    shortcuts: []
  },
  "curl-to-python": {
    slug: "curl-to-python",
    category: "Code & Type Converters",
    name: "cURL to Python Requests",
    shortName: "cURL to Python",
    description: "Translate bash cURL commands into Python `requests` code.",
    seoTitle: "cURL to Python Requests Converter Online — DevScratchpad",
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
    seoTitle: "cURL to Go & Python - 100% Client-Side Developer Tools",
    seoDescription: "Translate cURL to Go, Fetch, and Python instantly. 100% offline, privacy backed code generation developer tools by DevScratchpad.",
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
    description: "Convert raw SVG markup into React JSX/TSX components.",
    seoTitle: "SVG to React JSX Converter Online — DevScratchpad",
    seoDescription: "Convert raw SVG icons into React JSX and TSX components instantly.",
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
    seoTitle: "Epoch & Unix Timestamp Converter Online — DevScratchpad",
    seoDescription: "Convert Unix timestamps to readable dates, seconds to milliseconds, and format times.",
    howToUse: [
      "Enter an epoch timestamp (seconds or milliseconds).",
      "View the localized and UTC date equivalents.",
      "Or, pick a calendar date to generate an epoch timestamp."
    ],
    shortcuts: []
  },
  "regex": {
    slug: "regex",
    category: "Time, Network & Utilities",
    name: "Regex Tester & Matcher",
    shortName: "Regex Tester",
    description: "Real-time RegExp testing with flags (g, i, m, s), match lists, and substitution preview.",
    seoTitle: "Regex Tester Online — Real-Time Regular Expression Testing",
    seoDescription: "Test regular expressions in real-time with regex flag controls, group matches, and string replacement preview.",
    howToUse: [
      "Enter your regular expression pattern and flags.",
      "Paste test string into the text area.",
      "Inspect matched groups and highlighted ranges in real-time."
    ],
    edgeCases: ["Catastrophic backtracking prevention and lookbehinds."],
    shortcuts: []
  },
  "diff": {
    slug: "diff",
    category: "Time, Network & Utilities",
    name: "Diff Checker & Text Compare",
    shortName: "Diff Checker",
    description: "Monaco side-by-side or inline code diffing with character-level additions and deletions.",
    seoTitle: "Diff Checker Online — Side-by-Side Code Compare",
    seoDescription: "Compare text and code side-by-side online. Highlights character-level differences and additions.",
    howToUse: [
      "Paste original text in left pane and modified text in right pane.",
      "Toggle between side-by-side and inline diff modes.",
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
    seoTitle: "Cron Expression Visualizer & Generator — DevScratchpad",
    seoDescription: "Translate cron expressions into human-readable English schedules with next execution date forecasting.",
    howToUse: [
      "Paste any standard 5-field cron expression.",
      "Inspect the translated plain English description and column breakdown.",
      "View next scheduled execution timestamps."
    ],
    edgeCases: ["Non-standard day of week numbering (0 vs 7)."],
    shortcuts: []
  },
  "cidr-calculator": {
    slug: "cidr-calculator",
    category: "Time, Network & Utilities",
    name: "CIDR Calculator & Subnet Inspector",
    shortName: "CIDR Calculator",
    description: "Calculate IPv4 and IPv6 subnet masks, broadcast addresses, and usable ranges.",
    seoTitle: "CIDR & Subnet Calculator Online — IP Range Inspector",
    seoDescription: "Calculate IPv4/IPv6 subnets, view CIDR notation, netmasks, broadcast IP, and usable host ranges.",
    howToUse: [
      "Enter an IP address and CIDR suffix (e.g. 192.168.1.0/24).",
      "The tool calculates network boundaries, broadcast IP, and total usable addresses.",
      "View detailed bitmask breakdown."
    ],
    edgeCases: ["/31 and /32 point-to-point subnets."],
    shortcuts: []
  }
};

export const TOOL_SLUGS = Object.keys(TOOLS_REGISTRY);

export function getToolMeta(slug: string): ToolMeta | undefined {
  return TOOLS_REGISTRY[slug];
}
