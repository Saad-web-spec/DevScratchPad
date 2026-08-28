export interface ToolMeta {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  howToUse: string[];
  edgeCases: string[];
  shortcuts: string[];
}

export const TOOLS_REGISTRY: Record<string, ToolMeta> = {
  "json-formatter": {
    slug: "json-formatter",
    name: "JSON Formatter, Minifier & Validator",
    shortName: "JSON Formatter",
    description: "Format, validate, and minify JSON data",
    seoTitle:
      "JSON Formatter Online — Format, Validate & Minify | DevScratchpad",
    seoDescription:
      "Free online JSON formatter and validator — paste your JSON, format with 2 or 4 space indent, minify, and detect syntax errors instantly. No data sent to any server.",
    howToUse: [
      "Paste or type raw JSON into the left Input panel.",
      "Select your preferred indentation (2 spaces or 4 spaces) from the dropdown.",
      "Click 'Format' to pretty-print the JSON in the Output panel, or click 'Minify' to compress it.",
      "Real-time validation runs as you type — the status bar shows Valid (green) or Invalid (red) with exact error line.",
      "Click 'Copy' on the output panel to copy the result to your clipboard.",
    ],
    edgeCases: [
      "Trailing commas are not valid JSON and will be flagged as a syntax error.",
      "Single-quoted strings are not valid JSON — use double quotes.",
      "Very large JSON files (50MB+) may slow down formatting due to browser memory limits.",
    ],
    shortcuts: [
      "Ctrl/Cmd + K — Open Command Palette to switch tools instantly.",
    ],
  },
  "jwt-decoder": {
    slug: "jwt-decoder",
    name: "JWT Decoder",
    shortName: "JWT Decoder",
    description: "Decode JSON Web Tokens instantly and securely",
    seoTitle:
      "JWT Decoder Online — Decode Tokens Safely | DevScratchpad",
    seoDescription:
      "Free online JWT decoder — paste any JSON Web Token to decode header, payload, and signature. Auto-converts exp/iat timestamps to readable dates. 100% client-side.",
    howToUse: [
      "Paste a standard JWT string (starting with 'eyJ...') into the left input area.",
      "The token is automatically split into Header, Payload, and Signature sections.",
      "Timestamp claims like 'exp', 'iat', and 'nbf' are automatically converted to human-readable ISO dates.",
      "Click 'Copy' on any section to copy the decoded JSON to your clipboard.",
    ],
    edgeCases: [
      "Only standard 3-part JWTs (header.payload.signature) are supported.",
      "Encrypted JWTs (JWE) cannot be decoded without the encryption key.",
      "The signature is displayed raw — this tool does not verify signatures.",
    ],
    shortcuts: [
      "Ctrl/Cmd + K — Open Command Palette to switch tools instantly.",
    ],
  },
  "unix-timestamp": {
    slug: "unix-timestamp",
    name: "Unix Timestamp Converter",
    shortName: "Unix Timestamp",
    description: "Convert Epoch to human-readable dates and vice versa",
    seoTitle:
      "Unix Timestamp Converter — Epoch to Date Online | DevScratchpad",
    seoDescription:
      "Free online Unix timestamp converter — convert epoch seconds or milliseconds to UTC, local time, and ISO 8601. Also converts dates back to epoch. Runs in your browser.",
    howToUse: [
      "Enter a Unix epoch integer (e.g. 1770000000) to convert it to UTC, Local Time, and ISO 8601 formats.",
      "Enter a date string (e.g. '2025-01-01') to convert it to a Unix epoch integer.",
      "Click 'Now' to instantly populate with the current timestamp.",
      "The tool auto-detects whether the input is in seconds or milliseconds.",
      "Click the copy icon on any result card to copy the value.",
    ],
    edgeCases: [
      "Timestamps above 10,000,000,000 are treated as milliseconds, below as seconds.",
      "Invalid date strings will show an error in the status bar.",
      "Relative time is calculated from the current browser clock.",
    ],
    shortcuts: [
      "Ctrl/Cmd + K — Open Command Palette to switch tools instantly.",
    ],
  },
  "curl-converter": {
    slug: "curl-converter",
    name: "cURL Command Converter",
    shortName: "cURL Converter",
    description: "Transform cURL commands into executable code",
    seoTitle:
      "cURL to Python/JavaScript/Go Converter | DevScratchpad",
    seoDescription:
      "Free online cURL to code converter — paste any cURL command and generate clean JavaScript fetch, Python requests, or Go net/http code. No API keys sent to any server.",
    howToUse: [
      "Paste a full cURL command (e.g. 'curl -X POST https://api.com -H \"Auth: Bearer xyz\"') into the left panel.",
      "Select your target language from the dropdown: JavaScript (fetch), Python (requests), or Go (net/http).",
      "The generated code appears instantly in the right output panel.",
      "Click 'Copy' to copy the generated code to your clipboard.",
    ],
    edgeCases: [
      "Multi-line cURL commands using backslash continuation are supported.",
      "The parser handles -X, -H, -d, --data-raw, and --data-binary flags.",
      "Complex shell features like variable expansion ($VAR) are not interpreted.",
    ],
    shortcuts: [
      "Ctrl/Cmd + K — Open Command Palette to switch tools instantly.",
    ],
  },
  "diff-checker": {
    slug: "diff-checker",
    name: "Diff Checker",
    shortName: "Diff Checker",
    description: "Compare text and code side-by-side",
    seoTitle:
      "Diff Checker Online — Compare Code Side by Side | DevScratchpad",
    seoDescription:
      "Free online diff checker — compare two texts or code blocks side by side with character-level additions and deletions highlighted. Works entirely in your browser.",
    howToUse: [
      "Paste or type 'Original Text' in the left panel and 'Modified Text' in the right panel.",
      "Insertions are highlighted in green and deletions in red, with line numbers.",
      "Both panels are editable — changes update the diff view in real time.",
      "Click 'Clear Both' to reset both panels.",
    ],
    edgeCases: [
      "Very large files (100K+ lines) may cause the diff engine to slow down.",
      "Binary content is not supported — paste text or code only.",
      "The diff is computed character-by-character, not word-by-word.",
    ],
    shortcuts: [
      "Ctrl/Cmd + K — Open Command Palette to switch tools instantly.",
    ],
  },
  "xml-formatter": {
    slug: "xml-formatter",
    name: "XML Formatter & Minifier",
    shortName: "XML Formatter",
    description: "Format, beautify, and minify XML data",
    seoTitle:
      "XML Formatter Online — Beautify & Minify XML | DevScratchpad",
    seoDescription:
      "Free online XML formatter — beautify, indent, and minify XML documents with customizable indentation. No data transmitted to any server.",
    howToUse: [
      "Paste or type raw XML into the left Input panel.",
      "Select your preferred indentation (2 spaces or 4 spaces) from the dropdown.",
      "Click 'Format' to pretty-print the XML in the Output panel, or click 'Minify' to compress it.",
      "Click 'Copy' on the output panel to copy the result to your clipboard.",
    ],
    edgeCases: [
      "Invalid XML might not format correctly depending on the severity of the syntax errors.",
    ],
    shortcuts: [
      "Ctrl/Cmd + K — Open Command Palette to switch tools instantly.",
    ],
  },
  "sql-formatter": {
    slug: "sql-formatter",
    name: "SQL Formatter",
    shortName: "SQL Formatter",
    description: "Format and beautify SQL queries",
    seoTitle:
      "SQL Formatter Online — Beautify SQL Queries | DevScratchpad",
    seoDescription:
      "Free online SQL formatter — beautify complex queries across PostgreSQL, MySQL, SQLite, T-SQL dialects with uppercase keywords and clean indentation. 100% private.",
    howToUse: [
      "Paste your raw SQL query into the left Input panel.",
      "Select your preferred SQL dialect (Standard SQL, PostgreSQL, MySQL, etc.) from the dropdown if applicable.",
      "Click 'Format' to generate a cleanly indented, readable query.",
      "Click 'Copy' to copy the formatted SQL to your clipboard.",
    ],
    edgeCases: [
      "Highly custom, vendor-specific syntax might not be fully supported by the formatter engine.",
    ],
    shortcuts: [
      "Ctrl/Cmd + K — Open Command Palette to switch tools instantly.",
    ],
  },
  "base64-decoder": {
    slug: "base64-decoder",
    name: "Base64 Encoder & Decoder",
    shortName: "Base64 Decoder",
    description: "Encode and decode Base64 strings securely",
    seoTitle:
      "Base64 Encoder & Decoder Online | DevScratchpad",
    seoDescription:
      "Free online Base64 encoder and decoder — convert strings to Base64 and back with UTF-8 support and URL-safe toggle. Runs entirely in your browser.",
    howToUse: [
      "Type or paste your text into the left Input panel.",
      "Select 'Encode' or 'Decode' mode using the toggle.",
      "The result appears instantly in the right Output panel.",
    ],
    edgeCases: [
      "Non-UTF-8 character sequences might cause decoding errors.",
    ],
    shortcuts: [
      "Ctrl/Cmd + K — Open Command Palette to switch tools instantly.",
    ],
  },
  "url-encoder": {
    slug: "url-encoder",
    name: "URL Encoder & Decoder",
    shortName: "URL Encoder",
    description: "Safely encode and decode URL components",
    seoTitle:
      "URL Encoder & Decoder Online | DevScratchpad",
    seoDescription:
      "Free online URL encoder and decoder — encode special characters or decode URL parameters and query strings instantly. No data leaves your browser.",
    howToUse: [
      "Type or paste your URL or query string into the left Input panel.",
      "Select 'Encode' or 'Decode' mode using the toggle.",
      "The result appears instantly in the right Output panel.",
    ],
    edgeCases: [
      "Invalid URL-encoded sequences (e.g. '%ZZ') will trigger a decoding error.",
    ],
    shortcuts: [
      "Ctrl/Cmd + K — Open Command Palette to switch tools instantly.",
    ],
  },
  "hash-generator": {
    slug: "hash-generator",
    name: "Hash Generator",
    shortName: "Hash Generator",
    description: "Generate MD5, SHA-1, SHA-256, and SHA-512 hashes",
    seoTitle:
      "Hash Generator — MD5, SHA-1, SHA-256, SHA-512 | DevScratchpad",
    seoDescription:
      "Free online hash generator — compute MD5, SHA-1, SHA-256, and SHA-512 hashes simultaneously from any text input. All processing runs in your browser.",
    howToUse: [
      "Type or paste any text into the Input field.",
      "The MD5, SHA-1, SHA-256, and SHA-512 hashes are computed instantly.",
      "Click the copy icon next to any hash to copy it to your clipboard.",
    ],
    edgeCases: [
      "Very large inputs may cause the browser to freeze briefly while computing hashes.",
    ],
    shortcuts: [
      "Ctrl/Cmd + K — Open Command Palette to switch tools instantly.",
    ],
  },
  "regex-tester": {
    slug: "regex-tester",
    name: "Regex Tester",
    shortName: "Regex Tester",
    description: "Test and debug regular expressions in real-time",
    seoTitle:
      "Regex Tester Online — Test Regular Expressions | DevScratchpad",
    seoDescription:
      "Free online regex tester — write and test regular expressions in real-time with match highlighting, flag controls, and substitution preview. 100% client-side.",
    howToUse: [
      "Enter your regular expression pattern in the Regex field.",
      "Add any flags (e.g. g, i, m) in the Flags field.",
      "Paste your test text into the Test String panel.",
      "Matches are highlighted automatically, and the exact matches list is displayed.",
    ],
    edgeCases: [
      "Invalid regex syntax will show a detailed syntax error.",
      "Catastrophic backtracking might cause browser lag with complex patterns on large strings.",
    ],
    shortcuts: [
      "Ctrl/Cmd + K — Open Command Palette to switch tools instantly.",
    ],
  },
  "json-to-typescript": {
    slug: "json-to-typescript",
    name: "JSON to TypeScript Converter",
    shortName: "JSON to TypeScript",
    description: "Generate TypeScript interfaces and types from JSON data",
    seoTitle:
      "JSON to TypeScript Converter Online | DevScratchpad",
    seoDescription:
      "Free online JSON to TypeScript converter — paste JSON and generate clean interfaces with nested type extraction and union type detection. No data sent to servers.",
    howToUse: [
      "Paste or type raw JSON data into the left Input panel.",
      "Optionally customize the root interface name using the Root Interface input field.",
      "Click 'Generate' or watch the TypeScript interfaces appear automatically in real-time in the right Output panel.",
      "Click 'Copy' on the output panel to copy the generated TypeScript definitions to your clipboard.",
    ],
    edgeCases: [
      "JSON input must have an object or array of objects at its root.",
      "Nested objects will automatically be extracted into separate named TypeScript interfaces.",
      "Heterogeneous arrays will generate union types when appropriate.",
    ],
    shortcuts: [
      "Ctrl/Cmd + K — Open Command Palette to switch tools instantly.",
    ],
  },
  "cron-visualizer": {
    slug: "cron-visualizer",
    name: "Cron Expression Visualizer",
    shortName: "Cron Visualizer",
    description: "Convert cron expressions into human-readable English descriptions",
    seoTitle:
      "Cron Expression Parser — Human-Readable Cron | DevScratchpad",
    seoDescription:
      "Free online cron expression parser — translate complex cron schedules into plain English with individual field breakdowns. Works offline in your browser.",
    howToUse: [
      "Type or paste a cron schedule expression (e.g. '*/15 * * * *') into the input field.",
      "Select any common preset schedule from the top chips for quick inspection.",
      "View the plain English translation of the schedule in the large description card.",
      "Inspect the individual field breakdowns (Minute, Hour, Day of Month, Month, Day of Week) to understand each component.",
    ],
    edgeCases: [
      "Standard 5-part (minute, hour, day, month, day-of-week) and 6-part cron expressions are supported.",
      "Special characters such as *, /, -, and , are fully parsed.",
      "Invalid syntax or out-of-range values will display an error explanation.",
    ],
    shortcuts: [
      "Ctrl/Cmd + K — Open Command Palette to switch tools instantly.",
    ],
  },
  "yaml-json": {
    slug: "yaml-json",
    name: "YAML / JSON Converter",
    shortName: "YAML Converter",
    description: "Convert between YAML and JSON formats bidirectionally",
    seoTitle:
      "YAML to JSON Converter Online | DevScratchpad",
    seoDescription:
      "Free online YAML to JSON and JSON to YAML converter — bidirectional conversion preserving data structures. One-click swap, runs in your browser.",
    howToUse: [
      "Select your conversion mode: 'YAML to JSON' or 'JSON to YAML' using the toggle button.",
      "Paste or type your source content in the left Input panel.",
      "Click 'Convert' or watch the converted output appear in the right panel in real time.",
      "Use the 'Swap' button to quickly reverse the conversion direction with current output.",
      "Click 'Copy' to copy the converted result to your clipboard.",
    ],
    edgeCases: [
      "YAML supports comments and multi-document streams, but converting to standard JSON will omit comments.",
      "Indentation in YAML is strictly space-based; tab characters can cause parse errors.",
    ],
    shortcuts: [
      "Ctrl/Cmd + K — Open Command Palette to switch tools instantly.",
    ],
  },
  "css-svg-minifier": {
    slug: "css-svg-minifier",
    name: "CSS & SVG Minifier",
    shortName: "CSS & SVG Minifier",
    description: "Minify and compress CSS stylesheets and SVG vector graphics",
    seoTitle:
      "CSS & SVG Minifier Online | DevScratchpad",
    seoDescription:
      "Free online CSS and SVG minifier — strip comments, whitespace, and newlines with compression ratio display. No files uploaded to any server.",
    howToUse: [
      "Select 'CSS' or 'SVG' mode from the dropdown menu in the header.",
      "Paste your unminified CSS or SVG code into the left Input editor.",
      "Click 'Minify' to compress the code.",
      "View total bytes saved and compression percentage in the badge.",
      "Click 'Copy' to copy the minified asset directly to your clipboard.",
    ],
    edgeCases: [
      "Regex-based minification strips comments, redundant spaces, and trailing semicolons safely without modifying code logic.",
      "Ensure SVG markup has matching tags for proper browser rendering.",
    ],
    shortcuts: [
      "Ctrl/Cmd + K — Open Command Palette to switch tools instantly.",
    ],
  },
  "graphql-formatter": {
    slug: "graphql-formatter",
    name: "GraphQL Formatter",
    shortName: "GraphQL Formatter",
    description: "Format and beautify GraphQL queries",
    seoTitle:
      "GraphQL Formatter Online — Beautify Queries | DevScratchpad",
    seoDescription:
      "Free online GraphQL formatter — beautify and validate GraphQL queries and schemas using the official AST parser. Zero data transmission.",
    howToUse: [
      "Paste your raw GraphQL query into the left Input panel.",
      "Click 'Format' to generate a cleanly indented, readable query.",
      "Click 'Copy' to copy the formatted GraphQL to your clipboard.",
    ],
    edgeCases: [
      "Invalid GraphQL syntax will be caught by the parser and display an error.",
    ],
    shortcuts: [
      "Ctrl/Cmd + K — Open Command Palette to switch tools instantly.",
    ],
  },
  "markdown-previewer": {
    slug: "markdown-previewer",
    name: "Markdown Previewer",
    shortName: "Markdown Previewer",
    description: "Live preview Markdown with sanitized HTML",
    seoTitle:
      "Markdown Preview Online — Live Editor | DevScratchpad",
    seoDescription:
      "Free online Markdown editor with live preview — write Markdown and see sanitized HTML render instantly. DOMPurify protection, no server processing.",
    howToUse: [
      "Type or paste your Markdown content into the left editor.",
      "Watch the live HTML preview render instantly on the right side.",
    ],
    edgeCases: [
      "Malicious HTML tags like <script> are stripped out by DOMPurify.",
    ],
    shortcuts: [
      "Ctrl/Cmd + K — Open Command Palette to switch tools instantly.",
    ],
  },
  "hmac-generator": {
    slug: "hmac-generator",
    name: "HMAC Webhook Generator",
    shortName: "HMAC Generator",
    description: "Compute HMAC signatures for webhook testing",
    seoTitle:
      "HMAC Generator — SHA-256/SHA-512 for Webhooks | DevScratchpad",
    seoDescription:
      "Free online HMAC generator — compute SHA-256 and SHA-512 HMAC signatures in Hex and Base64 for Stripe and GitHub webhook testing. 100% client-side.",
    howToUse: [
      "Enter your secret key in the Secret field.",
      "Paste your payload data into the Payload field.",
      "Select your hashing algorithm (SHA256 or SHA512).",
      "Instantly view and copy the generated Hex and Base64 signatures.",
    ],
    edgeCases: [
      "Very large payloads may cause a brief browser hang during cryptographic calculation.",
    ],
    shortcuts: [
      "Ctrl/Cmd + K — Open Command Palette to switch tools instantly.",
    ],
  },
  "cidr-calculator": {
    slug: "cidr-calculator",
    name: "IP / CIDR Calculator",
    shortName: "CIDR Calculator",
    description: "Calculate network address, broadcast, and host range",
    seoTitle:
      "CIDR Calculator — IPv4 Subnet Calculator Online | DevScratchpad",
    seoDescription:
      "Free online CIDR calculator — parse IPv4 CIDR blocks to get network address, broadcast, wildcard mask, and usable host range. Runs in your browser.",
    howToUse: [
      "Type a valid IPv4 CIDR notation (e.g. 192.168.1.0/24) into the input field.",
      "View the calculated Network Address, Broadcast Address, Wildcard Mask, and Host Range.",
    ],
    edgeCases: [
      "Only IPv4 addresses are currently supported.",
      "/31 and /32 prefixes are handled according to special point-to-point and host route rules.",
    ],
    shortcuts: [
      "Ctrl/Cmd + K — Open Command Palette to switch tools instantly.",
    ],
  },
};

export const TOOL_SLUGS = Object.keys(TOOLS_REGISTRY);

export function getToolMeta(slug: string): ToolMeta | undefined {
  return TOOLS_REGISTRY[slug];
}
