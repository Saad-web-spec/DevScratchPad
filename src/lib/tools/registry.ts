export interface ToolMeta {
 slug: string;
 name: string;
 shortName: string;
 description: string;
 seoTitle: string;
 seoDescription: string;
 category: string;
 howToUse: string[];
 edgeCases: string[];
 shortcuts: string[];
}

export const TOOLS_REGISTRY: Record<string, ToolMeta> = {
  "json-validator": {
    slug: "json-validator",
    name: "JSON Validator",
    shortName: "JSON Validator",
    category: "Formatters",
    description: "Validate JSON syntax online and catch formatting errors instantly.",
    seoTitle: "JSON Validator Online — Check JSON Syntax",
    seoDescription: "Free, offline JSON validator. Quickly check your JSON for syntax errors and ensure it is perfectly formatted.",
    howToUse: ["Paste your raw JSON string into the editor.", "The validator will instantly highlight any syntax errors, missing commas, or structural issues."],
    edgeCases: ["Extremely large JSON payloads", "Trailing commas (which are invalid in strict JSON)"],
    shortcuts: ["Ctrl/Cmd + V — Smart Magic Paste"]
  },
  "yaml-to-json": {
    slug: "yaml-to-json",
    name: "YAML to JSON",
    shortName: "YAML to JSON",
    category: "Converters",
    description: "Convert YAML configurations to JSON format.",
    seoTitle: "YAML to JSON Converter Online — DevScratchpad",
    seoDescription: "Convert YAML to JSON securely and instantly in your browser.",
    howToUse: ["Paste your YAML code.", "Copy the converted JSON."],
    edgeCases: ["Nested arrays and anchors in YAML"],
    shortcuts: []
  },
  "json-to-yaml": {
    slug: "json-to-yaml",
    name: "JSON to YAML",
    shortName: "JSON to YAML",
    category: "Converters",
    description: "Convert JSON objects to YAML configuration format.",
    seoTitle: "JSON to YAML Converter Online — DevScratchpad",
    seoDescription: "Convert JSON to YAML securely and instantly in your browser.",
    howToUse: ["Paste your JSON payload.", "Copy the generated YAML."],
    edgeCases: ["Extremely large JSON structures"],
    shortcuts: []
  },
  "curl-to-javascript": {
    slug: "curl-to-javascript",
    name: "cURL to JavaScript (Node)",
    shortName: "cURL to JS",
    category: "Network",
    description: "Convert cURL commands into Node.js / JavaScript Fetch code.",
    seoTitle: "cURL to JavaScript Converter — Convert cURL to Fetch/Node",
    seoDescription: "Convert cURL requests to JavaScript (Node.js/Fetch) code online.",
    howToUse: ["Paste a cURL command.", "Copy the JavaScript fetch code."],
    edgeCases: ["Complex multipart form data"],
    shortcuts: []
  },
"curl-to-python": { slug: "curl-to-python",
  category: "Network", name: "cURL to Python", shortName: "cURL to Python", description: "Convert cURL to Python requests", seoTitle: "cURL to Python Converter Online — DevScratchpad", seoDescription: "Free online converter.",  howToUse: [], edgeCases: [], shortcuts: [] }, "curl-to-fetch": { slug: "curl-to-fetch",
  category: "Network", name: "cURL to Fetch", shortName: "cURL to Fetch", description: "Convert cURL to Fetch", seoTitle: "cURL to Fetch Converter Online — Convert cURL to JavaScript", seoDescription: "Free online converter.",  howToUse: [], edgeCases: [], shortcuts: [] }, "curl-to-go": { slug: "curl-to-go",
  category: "Network", name: "cURL to Go", shortName: "cURL to Go", description: "Convert cURL to Go", seoTitle: "cURL to Go Converter Online — DevScratchpad", seoDescription: "Free online converter.",  howToUse: [], edgeCases: [], shortcuts: [] }, "json-to-ts": { slug: "json-to-typescript",
  category: "Converters", name: "JSON to TS", shortName: "JSON to TS", description: "JSON to TypeScript", seoTitle: "JSON to TypeScript Converter Online — DevScratchpad", seoDescription: "Free.",  howToUse: [], edgeCases: [], shortcuts: [] }, "json-to-zod": { slug: "json-to-zod",
  category: "Converters", name: "JSON to Zod", shortName: "JSON to Zod", description: "JSON to Zod", seoTitle: "JSON to Zod Schema Generator Online — DevScratchpad", seoDescription: "Free.",  howToUse: [], edgeCases: [], shortcuts: [] }, "json-to-go": { slug: "json-to-go-struct",
  category: "Converters", name: "JSON to Go Struct", shortName: "JSON to Go", description: "JSON to Go", seoTitle: "JSON to Go Struct Converter Online — DevScratchpad", seoDescription: "Free.",  howToUse: [], edgeCases: [], shortcuts: [] }, 
"json-formatter": {
 slug: "json-formatter",
  category: "Formatters",
 name:"JSON Formatter, Minifier & Validator",
 shortName:"JSON Formatter",
 description:"Format, validate, and minify JSON data",
 seoTitle:
"JSON Formatter & Beautifier Online — DevScratchpad",
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
  category: "Developer Tool",
 name:"JWT Decoder",
 shortName:"JWT Decoder",
 description:"Decode JSON Web Tokens instantly and securely",
 seoTitle:
"JWT Decoder Online — Decode Tokens Safely & Privately",
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
  "svg-to-jsx": {
    slug: "svg-to-jsx",
  category: "Converters",
    name: "SVG to JSX Converter",
    shortName: "SVG to JSX",
    description: "Convert raw SVG code to React JSX functional components",
    seoTitle: "SVG to JSX Converter Online — DevScratchpad",
    seoDescription: "Free online SVG to JSX converter — paste your raw SVG and get a ready-to-use React functional component with camelCase attributes. No servers, 100% private.",
    
    howToUse: [
      "Paste your raw SVG code into the left Input panel.",
      "Click 'Convert' to transform standard HTML attributes (like class and fill-rule) into React-compatible camelCase attributes.",
      "Click 'Copy' on the output panel to copy your React functional component."
    ],
    edgeCases: [
      "Complex SVGs with invalid syntax may not parse completely.",
      "Styles inside style tags are not automatically converted to React style objects."
    ],
    shortcuts: [
      "Ctrl/Cmd + K — Open Command Palette to switch tools instantly."
    ],
  },
  "uuid-generator": {
    slug: "uuid-generator",
  category: "Security",
    name: "UUID / ULID / NanoID Generator",
    shortName: "UUID Generator",
    description: "Generate cryptographically secure UUID v4, UUID v7, ULID, and NanoIDs in bulk",
    seoTitle: "UUID Generator Online (v4) — DevScratchpad",
    seoDescription: "Free online UUID and ULID generator — create secure UUID v4, time-ordered UUID v7, ULID, and NanoIDs in bulk with JSON and CSV export formats. 100% client-side.",
    
    howToUse: [
      "Select your identifier type: UUID v4, UUID v7 (time-ordered), ULID, or NanoID.",
      "Choose the quantity to generate (up to 100).",
      "Configure format options: Lines, JSON Array, or CSV.",
      "Click 'Copy All' to copy the generated identifiers to your clipboard."
    ],
    edgeCases: [
      "All IDs are generated locally in the browser using the Web Crypto API."
    ],
    shortcuts: [
      "Ctrl/Cmd + K — Open Command Palette to switch tools instantly."
    ],
  },
};

export const TOOL_SLUGS = Object.keys(TOOLS_REGISTRY);

export function getToolMeta(slug: string): ToolMeta | undefined {
 return TOOLS_REGISTRY[slug];
}
