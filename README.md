# DevScratchpad

**DevScratchpad** is a lightning-fast, client-side, privacy-first developer utility platform. Built natively on **Next.js 16 (App Router)** and **React 19**, it processes everything strictly within the browser memory—meaning absolute zero server transmission and maximum security for sensitive data and tokens.

It features **19 distinct high-value developer tools** integrated into a beautiful, crisp, system-UI-driven workspace, inspired by tools like CyberChef and VS Code.

## 🚀 Key Features

*   **100% Client-Side Processing**: No API servers, no databases. Everything executes instantly in the browser.
*   **Lightning Fast UI**: Uses a system-UI font stack (`system-ui, -apple-system, sans-serif`) ensuring zero layout shifts (CLS) and instant renders.
*   **Monaco Editor Integration**: Heavy use of `@monaco-editor/react` (lazy-loaded for performance) to provide VS Code-level syntax highlighting, auto-completion, and dual-pane diff checking.
*   **Workspace History State**: Built-in LocalStorage synchronization to auto-save sessions, allowing developers to instantly restore previous tool sessions with one click.
*   **Programmatic SEO**: Fully dynamic `sitemap.xml`, `robots.txt`, and OpenGraph metadata generated automatically from the centralized `registry.ts`.
*   **Shareable Payloads**: URL Hash persistence (`#data=base64...`) allowing users to easily bookmark or share specific tool states and inputs securely without a backend.
*   **Command Palette**: Quick tool switching accessible globally via `Ctrl/Cmd + K`.

---

## 🛠️ The 19 Developer Utilities

1.  **JSON Formatter & Minifier**: Format, minify, and validate JSON schemas in real-time.
2.  **JWT Decoder**: Securely decode JSON Web Tokens (Header, Payload, Signature) without exposing secrets.
3.  **Unix Timestamp Converter**: Convert Epoch integers to human-readable UTC/Local/ISO formats instantly.
4.  **cURL Command Converter**: Translate raw `curl` terminal commands into executable `fetch` (JavaScript), `requests` (Python), or `net/http` (Go) code.
5.  **Diff Checker**: Compare text or code modifications side-by-side with colorized inline insertion/deletion highlighting.
6.  **XML Formatter**: Pretty-print and compress XML data.
7.  **SQL Formatter**: Indent and beautify complex SQL queries across various dialects.
8.  **Base64 Encoder/Decoder**: Instantly translate standard text to and from Base64 encoding.
9.  **URL Encoder/Decoder**: Safely encode special URI characters for query strings and paths.
10. **Hash Generator**: Generate high-speed MD5, SHA-1, SHA-256, and SHA-512 hashes.
11. **Regex Tester**: Test regular expression patterns against strings with live highlight matching.
12. **JSON to TypeScript**: Instantly generate strongly-typed TypeScript interfaces directly from raw JSON objects.
13. **Cron Expression Visualizer**: Translate complex `* * * * *` cron syntax into plain English schedules.
14. **YAML to JSON Converter**: Bi-directional conversion between YAML and JSON formats.
15. **CSS & SVG Minifier**: Optimize and compress frontend CSS code and SVG markup effortlessly.
16. **GraphQL Formatter**: Format and beautify complex GraphQL queries and schemas using the official AST parser.
17. **Markdown Previewer**: Live dual-pane editor that sanitizes (via DOMPurify) and renders Markdown as safe HTML.
18. **HMAC Webhook Generator**: Compute cryptographic SHA-256 and SHA-512 signatures for API and webhook testing.
19. **IP / CIDR Calculator**: Parse IPv4 CIDR blocks to compute Network, Broadcast, Subnet Masks, and usable host bounds instantly.

---

## 🏗️ Architecture & Technology Stack

*   **Framework**: Next.js 16 (App Router) using Turbopack
*   **Library**: React 19
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS v4 (with strict crisp white / `bg-slate-50` aesthetics)
*   **Icons**: Lucide React
*   **Editors**: Monaco Editor (VS Code core engine)

## 📦 Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Run the development server:**
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000` in your browser.

## 🚢 Deployment (Vercel)

The easiest way to deploy the application is through [Vercel](https://vercel.com).
The repository is optimized for Vercel's zero-config `Next.js` template.

1. Import the repository into Vercel.
2. Select **Next.js** framework preset.
3. Click **Deploy**.

To host on a custom subdomain like `tools.saadengineer.works`, simply add the CNAME record mapping your host to `cname.vercel-dns.com`.
