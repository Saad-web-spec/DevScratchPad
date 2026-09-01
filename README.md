<div align="center">

# ⚡ DevScratchpad

**The privacy-first developer utility suite & scratchpad with zero server transmission.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-devscratchpad.tech-2563EB?style=for-the-badge&logo=vercel&logoColor=white)](https://devscratchpad.tech)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.3.3-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.2.8-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)](./LICENSE)

<br/>

[**Explore 19+ Tools**](https://devscratchpad.tech) • [**Report a Bug**](https://github.com/Saad-web-spec/DevScratchPad/issues/new) • [**Request a Feature**](https://github.com/Saad-web-spec/DevScratchPad/issues/new) • [**Submit a PR**](./CONTRIBUTING.md)

</div>

---

## 🔒 100% Zero-Server Privacy Guarantee

> **Why DevScratchpad?** Most online formatters and decoders secretly transmit your sensitive API keys, JWT tokens, environment secrets, and customer payloads to remote tracking servers. 

**DevScratchpad is 100% client-side:**
- **Zero API Endpoints:** Every formatter, parser, hash generator, and converter executes in pure browser JavaScript & WASM.
- **Zero Telemetry on Payloads:** Your inputs never touch a server or database.
- **Auditable & Open-Source:** Inspect the network tab or the source code in this repository to verify that no network requests leave your machine.

---

## ✨ Features & Architecture

- ⚡ **Next.js 16 & Turbopack:** 100% Static Site Generated (SSG) with sub-millisecond TTFB.
- 🎨 **Unified Spatial Dark UI:** High-contrast pitch-black canvas (`#09090B`), elevated cards (`#121215`), and standardized monospace inputs.
- 💻 **Monaco Code Editor:** VS Code's editor engine built-in with syntax highlighting, auto-wrap, error lines, and dual-pane diff comparison.
- ⏱️ **Local Status Bars:** Embedded 32px Monaco status footers displaying real-time execution speeds (ms), character volume, and syntax error lines.
- ⌨️ **Command Palette:** Global <kbd>Ctrl</kbd> + <kbd>K</kbd> / <kbd>Cmd</kbd> + <kbd>K</kbd> navigation to jump between tools in milliseconds.
- 🔗 **Zero-Backend Sharing:** Payloads are serialized directly into URL hash fragments (`#data=...`), enabling private sharing with no server storage.
- 💾 **Local Workspace History:** FIFO 15-entry local history buffer and workspace snapshot bookmarking.

---

## 🛠️ The 19 Developer Utilities Matrix

| Category | Tool Name | Route | What It Does |
| :--- | :--- | :--- | :--- |
| **Code Formatting** | [JSON Formatter](https://devscratchpad.tech/json-formatter) | `/json-formatter` | Multi-indent (2/4 spaces) formatting, minification, and real-time syntax error line tracking. |
| | [XML Formatter](https://devscratchpad.tech/xml-formatter) | `/xml-formatter` | Format, beautify, and minify XML data structures with indentation controls. |
| | [SQL Formatter](https://devscratchpad.tech/sql-formatter) | `/sql-formatter` | Multi-dialect query beautifier (PostgreSQL, MySQL, SQLite, T-SQL, PL/SQL) with keyword casing. |
| | [GraphQL Formatter](https://devscratchpad.tech/graphql-formatter) | `/graphql-formatter` | Formats and validates GraphQL queries and schemas using the official AST parser. |
| **Security & Crypto** | [JWT Decoder](https://devscratchpad.tech/jwt-decoder) | `/jwt-decoder` | Safely decodes Header, Payload & Signature; auto-converts `exp`/`iat` timestamps to ISO dates. |
| | [Hash Generator](https://devscratchpad.tech/hash-generator) | `/hash-generator` | Computes MD5 (SparkMD5), SHA-1, SHA-256, and SHA-512 in parallel client-side. |
| | [HMAC Generator](https://devscratchpad.tech/hmac-generator) | `/hmac-generator` | Computes SHA256 & SHA512 HMAC signatures in Hex & Base64 for Stripe/GitHub webhook testing. |
| | [Cron Visualizer](https://devscratchpad.tech/cron-visualizer) | `/cron-visualizer` | Translates complex cron schedules into plain English with a 5-column breakdown grid. |
| | [IP / CIDR Calculator](https://devscratchpad.tech/cidr-calculator) | `/cidr-calculator` | Calculates IPv4 network address, broadcast, wildcard mask, and usable host bounds. |
| **Code Converters** | [cURL Converter](https://devscratchpad.tech/curl-converter) | `/curl-converter` | Transforms cURL commands into executable JavaScript (`fetch`), Python (`requests`), or Go. |
| | [JSON to TypeScript](https://devscratchpad.tech/json-to-typescript) | `/json-to-typescript` | Generates strongly-typed TypeScript interfaces and type definitions from raw JSON. |
| | [YAML / JSON Converter](https://devscratchpad.tech/yaml-json) | `/yaml-json` | Bidirectional YAML ↔ JSON conversion preserving data structures with one-click swap. |
| **Diff & Optimization** | [Diff Checker](https://devscratchpad.tech/diff-checker) | `/diff-checker` | Monaco side-by-side or inline code diffing with character-level additions and deletions. |
| | [CSS & SVG Minifier](https://devscratchpad.tech/css-svg-minifier) | `/css-svg-minifier` | Strips comments and whitespace; displays byte savings and compression ratio. |
| | [Regex Tester](https://devscratchpad.tech/regex-tester) | `/regex-tester` | Real-time RegExp testing with flags (`g`, `i`, `m`, `s`), match lists, and substitution preview. |

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js 18.17+ or 20+
- npm, yarn, or pnpm

### Quick Setup

```bash
# 1. Clone the repository
git clone https://github.com/Saad-web-spec/DevScratchPad.git

# 2. Enter the project directory
cd DevScratchPad

# 3. Install dependencies
npm install

# 4. Start the Turbopack development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚢 One-Click Deployment

Deploy your own private, customized instance of DevScratchpad for your team on Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Saad-web-spec/DevScratchPad)

---

## 🤝 Contributing

Contributions, feature ideas, and new utility tools are very welcome! Please check out our [**Contributing Guide**](./CONTRIBUTING.md) to get started.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingNewTool`)
3. Commit your Changes (`git commit -m 'feat: add amazing new developer tool'`)
4. Push to the Branch (`git push origin feature/AmazingNewTool`)
5. Open a Pull Request

---

## 💖 Support & Sponsorship

If DevScratchpad has saved you time or improved your workflow, consider starring ⭐ this repository and supporting its ongoing development!

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](./LICENSE) for more information.

<div align="center">
  <sub>Built with ❤️ by <a href="https://saadengineer.works">Saad</a> &bull; Powered by Next.js 16 &amp; Monaco Editor</sub>
</div>
