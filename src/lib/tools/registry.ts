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
    description: "Validate JSON syntax online and catch formatting errors instantly. 100% private validation.",
    seoTitle: "JSON Validator Online — Check JSON Syntax",
    seoDescription: "Validate JSON syntax online instantly. Catch formatting errors, missing commas, and invalid structures securely in your browser.",
    howToUse: ["Paste your JSON string into the secure offline validator input.", "The engine continuously parses the structure in real-time, instantly highlighting lines with syntax errors like trailing commas or unescaped quotes.", "Review the error summary panel to understand the exact JSON parse failure.", "Fix the errors directly in the editor until the green 'Valid JSON' badge appears."],
    edgeCases: ["Spotting hidden zero-width spaces or invalid unicode characters.", "Identifying unescaped quotes inside string values."],
    shortcuts: ["Ctrl/Cmd + V — Smart Magic Paste"]
  },
  "yaml-to-json": {
    slug: "yaml-to-json",
    name: "YAML to JSON",
    shortName: "YAML to JSON",
    category: "Converters",
    description: "Convert YAML configuration files into standardized JSON payloads securely in your browser.",
    seoTitle: "YAML to JSON Converter Online — DevScratchpad",
    seoDescription: "Convert YAML to JSON online instantly. Free, secure, in-browser YAML to JSON parsing tool.",
    howToUse: ["Paste your YAML configuration file (e.g., Docker Compose, CI/CD pipelines) into the editor.", "The parser instantly validates the YAML syntax and converts it into a standard JSON string.", "The output JSON is fully formatted and ready to be used in Node.js or web applications.", "Copy or download the resulting JSON file."],
    edgeCases: ["Handling of YAML anchors and aliases.", "Complex nested arrays or multiline string blocks."],
    shortcuts: []
  },
  "json-to-yaml": {
    slug: "json-to-yaml",
    name: "JSON to YAML",
    shortName: "JSON to YAML",
    category: "Converters",
    description: "Convert JSON objects into human-readable YAML configuration format.",
    seoTitle: "JSON to YAML Converter Online — DevScratchpad",
    seoDescription: "Convert JSON to YAML online instantly. Free, private JSON to YAML configuration generator.",
    howToUse: ["Paste your JSON payload into the editor.", "The tool automatically transforms the curly braces and brackets into indentation-based YAML format.", "Review the cleanly formatted YAML output, perfect for Kubernetes manifests or Ansible playbooks.", "Copy or download the resulting YAML file."],
    edgeCases: ["Deeply nested JSON objects ensuring proper space indentation.", "Handling of null values or empty strings."],
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
  category: "Network", name: "cURL to Python", shortName: "cURL to Python", description: "Transform complex cURL requests into clean, executable Python requests code.", seoTitle: "cURL to Python Converter Online — DevScratchpad", seoDescription: "Convert cURL commands to Python requests code instantly. Free, secure, in-browser cURL to Python conversion tool.",  howToUse: ["Copy a cURL command from your browser's network tab or API documentation.", "Paste the cURL syntax into the input pane.", "The tool automatically parses all headers, query parameters, auth tokens, and JSON payloads, instantly converting them into Python 'requests' library code.", "Copy the generated Python code and paste it directly into your script."], edgeCases: ["Complex multipart/form-data boundaries.", "Unusual or escaped quotation marks inside cURL data payloads.", "Authentication headers like Bearer or Basic."], shortcuts: [] }, "curl-to-fetch": { slug: "curl-to-fetch",
  category: "Network", name: "cURL to Fetch", shortName: "cURL to Fetch", description: "Transform cURL commands into native JavaScript fetch API configurations.", seoTitle: "cURL to Fetch Converter Online — Convert cURL to JavaScript", seoDescription: "Convert cURL commands to JavaScript fetch() code. Free, secure, in-browser cURL to fetch converter.",  howToUse: ["Export a cURL request from Postman, Swagger, or Chrome DevTools.", "Paste the raw cURL command into the converter.", "It instantly maps the HTTP method, headers, and body into a native JavaScript Fetch API configuration object.", "Copy the generated Fetch code for use in your frontend web application or ServiceWorker."], edgeCases: ["Handling of automatic Content-Length headers.", "Parsing URL-encoded form data into Fetch body configurations."], shortcuts: [] }, "curl-to-go": { slug: "curl-to-go",
  category: "Network", name: "cURL to Go", shortName: "cURL to Go", description: "Convert cURL to Go", seoTitle: "cURL to Go Converter Online — DevScratchpad", seoDescription: "Free online converter.",  howToUse: [], edgeCases: [], shortcuts: [] }, "json-to-ts": { slug: "json-to-ts",
  category: "Converters", name: "JSON to TS", shortName: "JSON to TS", description: "Instantly generate strict TypeScript interfaces from JSON data payloads.", seoTitle: "JSON to TypeScript Converter Online — DevScratchpad", seoDescription: "Generate TypeScript interfaces from JSON data instantly. Secure, offline JSON to TS converter for developers.",  howToUse: ["Paste your sample JSON API response into the editor.", "The engine deeply analyzes the JSON structure, detecting data types, nested arrays, and objects.", "It instantly generates strongly-typed TypeScript interfaces and types corresponding to your data.", "Copy the generated interfaces to strictly type your frontend API requests."], edgeCases: ["Null values in the JSON (handled by generating optional '?' properties or union types).", "Empty arrays where the internal type must be inferred as 'any[]'."], shortcuts: [] }, "json-to-zod": { slug: "json-to-zod",
  category: "Converters", name: "JSON to Zod", shortName: "JSON to Zod", description: "Infer and generate strict Zod runtime validation schemas from JSON data.", seoTitle: "JSON to Zod Schema Generator Online — DevScratchpad", seoDescription: "Generate Zod schemas from JSON payloads online. Free, private, in-browser JSON to Zod converter.",  howToUse: ["Paste a JSON object or API response into the input.", "The tool infers the schema types (strings, numbers, booleans, nested objects) in real-time.", "It generates a complete Zod schema definition (z.object, z.string, etc.) matching the payload.", "Copy the Zod schema to use for strict runtime validation in your TypeScript application."], edgeCases: ["Deeply nested objects converted into inline z.object() schemas.", "Arrays of objects mapped to z.array()."], shortcuts: [] }, "json-to-go": { slug: "json-to-go",
  category: "Converters", name: "JSON to Go Struct", shortName: "JSON to Go", description: "JSON to Go", seoTitle: "JSON to Go Struct Converter Online — DevScratchpad", seoDescription: "Free.",  howToUse: [], edgeCases: [], shortcuts: [] }, 
"json-formatter": {
 slug: "json-formatter",
  category: "Formatters",
 name:"JSON Formatter, Minifier & Validator",
 shortName:"JSON Formatter",
 description:"Format, validate, and beautify JSON directly in your browser. Ensure your data structure is correct and human-readable without sending it to a server.",
 seoTitle:
"JSON Formatter & Beautifier Online — DevScratchpad",
 seoDescription:
"Format, validate, and beautify JSON directly in your browser. 100% private, client-side JSON formatting with syntax highlighting and validation.",
 
 howToUse: ["Paste your unformatted, minified, or messy JSON payload directly into the editor pane.", "The tool automatically detects syntax errors and instantly beautifies the JSON into a readable, strictly indented format.", "Expand or collapse nested objects using the gutter arrows.", "Click 'Copy' to copy the formatted JSON, or 'Download' to save it as a .json file locally."],
 edgeCases: ["Missing quotes around keys or trailing commas (which will trigger a syntax validation warning).", "Extremely large JSON payloads (over 5MB) which are processed smoothly entirely within your browser's memory without crashing."],
 shortcuts: [
"Ctrl/Cmd + K — Open Command Palette to switch tools instantly.",
 ],
 },
"jwt": {
 slug: "jwt",
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
    description: "Generate cryptographically secure v4 UUIDs locally in your browser.",
    seoTitle: "UUID Generator Online (v4) — DevScratchpad",
    seoDescription: "Generate secure UUIDs (v4) online instantly. Free, offline bulk UUID generator tool.",
    
    howToUse: ["Select the number of UUIDs you wish to generate (e.g., 1, 10, or 100).", "Click 'Generate' to instantly create cryptographically secure, random v4 UUIDs using the browser's native Crypto API.", "Choose your preferred format (hyphens, no hyphens, or uppercase).", "Click the copy button to grab your unique identifiers."],
    edgeCases: ["Generating thousands of UUIDs simultaneously without blocking the browser thread.", "Ensuring cryptographic randomness via window.crypto instead of Math.random()."],
    shortcuts: [
      "Ctrl/Cmd + K — Open Command Palette to switch tools instantly."
    ],
  },
};

export const TOOL_SLUGS = Object.keys(TOOLS_REGISTRY);

export function getToolMeta(slug: string): ToolMeta | undefined {
 return TOOLS_REGISTRY[slug];
}
