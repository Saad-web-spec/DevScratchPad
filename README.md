<div align="center">

# ⚡ DevScratchpad

**The privacy-first developer utility suite & scratchpad with zero server transmission.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-devscratchpad.tech-2563EB?style=for-the-badge&logo=vercel&logoColor=white)](https://devscratchpad.tech)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.3.3-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.2.8-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)](./LICENSE)

<br/>

[**Explore 23+ Tools**](https://devscratchpad.tech) • [**Report a Bug**](https://github.com/Saad-web-spec/DevScratchPad/issues/new) • [**Request a Feature**](https://github.com/Saad-web-spec/DevScratchPad/issues/new) • [**Submit a PR**](./CONTRIBUTING.md)

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

## 🛠️ The 23+ Developer Utilities Matrix

| Category | Tool Name | Route | What It Does |
| :--- | :--- | :--- | :--- |
| **Code Formatting** | [JSON Formatter](https://devscratchpad.tech/tools/json-formatter) | `/tools/json-formatter` | Multi-indent formatting, minification, and real-time syntax error line tracking. |
| | [JSON Validator](https://devscratchpad.tech/tools/json-validator) | `/tools/json-validator` | Secure, strict JSON syntax validator to catch missing commas and string issues. |
| | [XML Formatter](https://devscratchpad.tech/tools/xml-formatter) | `/tools/xml-formatter` | Format, beautify, and minify XML data structures with indentation controls. |
| | [SQL Formatter](https://devscratchpad.tech/tools/sql-formatter) | `/tools/sql-formatter` | Multi-dialect query beautifier (PostgreSQL, MySQL, SQLite) with keyword casing. |
| | [GraphQL Formatter](https://devscratchpad.tech/tools/graphql-formatter) | `/tools/graphql-formatter` | Formats and validates GraphQL queries and schemas using the official AST parser. |
| **Security & Crypto** | [Base64 & Hex Inspector](https://devscratchpad.tech/tools/base64-inspector) | `/tools/base64-inspector` | Multi-encoding converter, canonical hex dump, and live Data URL image previewer. |
| | [JWT Decoder](https://devscratchpad.tech/tools/jwt) | `/tools/jwt` | Safely decodes Header, Payload & Signature; auto-converts `exp`/`iat` timestamps. |
| | [X.509 Certificate Decoder](https://devscratchpad.tech/tools/cert-decoder) | `/tools/cert-decoder` | Decodes PEM certificates and CSRs with SANs, validity countdown, and fingerprints. |
| | [SSH Key Generator](https://devscratchpad.tech/tools/ssh-key-generator) | `/tools/ssh-key-generator` | In-browser Ed25519/RSA/ECDSA keypair generator with OpenSSH Randomart. |
| | [Password Hash & Verifier](https://devscratchpad.tech/tools/password-hash) | `/tools/password-hash` | Bcrypt ($2a/$2b), Argon2id, and PBKDF2 hashing and live verification matching. |
| | [Hash Generator](https://devscratchpad.tech/tools/hash) | `/tools/hash` | Computes MD5, SHA-1, SHA-256, and SHA-512 in parallel client-side. |
| | [HMAC Generator](https://devscratchpad.tech/tools/hmac-generator) | `/tools/hmac-generator` | Computes SHA256 & SHA512 HMAC signatures in Hex & Base64 for webhook testing. |
| | [UUID Generator](https://devscratchpad.tech/tools/uuid-generator) | `/tools/uuid-generator` | Fast bulk v4 UUID generator using the native browser Crypto API. |
| **Network & Time** | [Cron Visualizer](https://devscratchpad.tech/tools/cron) | `/tools/cron` | Translates complex cron schedules into plain English with a 5-column breakdown grid. |
| | [IP / CIDR Calculator](https://devscratchpad.tech/tools/cidr-calculator) | `/tools/cidr-calculator` | Calculates IPv4 network address, broadcast, wildcard mask, and usable host bounds. |
| **Code Converters** | [cURL to Fetch](https://devscratchpad.tech/tools/curl-to-fetch) | `/tools/curl-to-fetch` | Transforms cURL commands into executable JavaScript (`fetch`). |
| | [cURL to Python](https://devscratchpad.tech/tools/curl-to-python) | `/tools/curl-to-python` | Transforms cURL commands into Python (`requests`). |
| | [JSON to TypeScript](https://devscratchpad.tech/tools/json-to-ts) | `/tools/json-to-ts` | Generates strongly-typed TypeScript interfaces from raw JSON. |
| | [JSON to Zod](https://devscratchpad.tech/tools/json-to-zod) | `/tools/json-to-zod` | Generates strict Zod schemas from raw JSON. |
| | [SVG to JSX](https://devscratchpad.tech/tools/svg-to-jsx) | `/tools/svg-to-jsx` | Convert raw SVG code to React JSX functional components. |
| | [YAML to JSON](https://devscratchpad.tech/tools/yaml-to-json) | `/tools/yaml-to-json` | Convert YAML configurations into JSON payloads. |
| **Diff & Optimization** | [Diff Checker](https://devscratchpad.tech/tools/diff) | `/tools/diff` | Monaco side-by-side or inline code diffing with character-level additions. |
| | [CSS & SVG Minifier](https://devscratchpad.tech/tools/minifier) | `/tools/minifier` | Strips comments and whitespace; displays byte savings and compression ratio. |
| | [Regex Tester](https://devscratchpad.tech/tools/regex) | `/tools/regex` | Real-time RegExp testing with flags (`g`, `i`, `m`, `s`), match lists. |



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
