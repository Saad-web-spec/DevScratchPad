const fs = require('fs');

function replaceFile(path, replacements) {
    let content = fs.readFileSync(path, 'utf8');
    for (const [oldStr, newStr] of replacements) {
        content = content.replace(oldStr, newStr);
    }
    fs.writeFileSync(path, content, 'utf8');
}

replaceFile('src/lib/blog/posts.ts', [
    ['seoTitle: "Cron Expression Cheat Sheet 2026 — Syntax, Examples & Visualizer"', 'seoTitle: "Cron Cheat Sheet 2026 — Syntax & Examples"'],
    ['seoTitle: "Regex Cheat Sheet 2026 — Syntax, Flags & Copy-Paste Patterns"', 'seoTitle: "Regex Cheat Sheet 2026 — Syntax & Patterns"'],
    ['seoTitle: "Convert cURL to Fetch & Axios (JavaScript) — Complete Guide 2026"', 'seoTitle: "cURL to Fetch & Axios — JS Guide 2026"'],
    ['seoTitle: "UUID v4 vs v5 vs v7 Explained — Performance & Database Guide 2026"', 'seoTitle: "UUID v4 vs v5 vs v7 — Database Guide 2026"'],
    ['seoTitle: "Generate TypeScript Interfaces & Zod Schemas from JSON 2026"', 'seoTitle: "TS Interfaces & Zod Schemas from JSON"'],
    ['seoTitle: "OpenSSL Commands Cheat Sheet 2026 — Keys, CSRs & Certificates"', 'seoTitle: "OpenSSL Cheat Sheet 2026 — Keys & Certs"'],
    ['seoTitle: "Convert cURL to Python requests — Complete Guide & Examples 2026"', 'seoTitle: "cURL to Python requests — Guide 2026"'],
    ['seoTitle: "How to Decode JWT Tokens Online & Offline — Complete Guide 2026"', 'seoTitle: "Decode JWT Tokens Online & Offline 2026"'],
    ['seoTitle: "Password Hashing Guide: Bcrypt, Argon2id & PBKDF2 Explained"', 'seoTitle: "Password Hashing Guide — Bcrypt & Argon2id"'],
    ['seoTitle: "Claude Code Skills (SKILL.md), Cursor Rules (.mdc) & MCP Guide 2026"', 'seoTitle: "Claude Skills & Cursor Rules Guide 2026"'],
    ['seoTitle: "Scaffold & Audit AI Rules with npx devscratchpad (Cursor, Claude, Copilot)"', 'seoTitle: "Audit AI Rules with npx devscratchpad"']
]);

replaceFile('src/lib/tools/registry.ts', [
    ['seoTitle: "JSON Formatter - Privacy Backed & 100% Client-Side Developer Tools"', 'seoTitle: "JSON Formatter — 100% Client-Side Private"'],
    ['seoTitle: "SQL Formatter Online — Format Postgres, MySQL & SQLite Queries"', 'seoTitle: "SQL Formatter — Postgres, MySQL & SQLite"'],
    ['seoTitle: "GraphQL Formatter Online — Pretty Print Queries & Schemas"', 'seoTitle: "GraphQL Formatter — Pretty Print Queries"'],
    ['seoTitle: "Mock Data Generator Online — Generate JSON, CSV & SQL Test Data"', 'seoTitle: "Mock Data Generator — JSON, CSV, SQL"'],
    ['seoTitle: "UUID & ULID Generator - Developer Tools for Privacy Backed Bulk IDs"', 'seoTitle: "UUID & ULID Generator — Privacy Bulk IDs"'],
    ['seoTitle: "Base64 & Hex Inspector Online — Multi-Format Converter & Hex Dump"', 'seoTitle: "Base64 & Hex Inspector — Converter & Dump"'],
    ['seoTitle: "HMAC Generator Online — SHA256, SHA512 Mac Authentication"', 'seoTitle: "HMAC Generator — SHA256 & SHA512 Auth"'],
    ['seoTitle: "X.509 Certificate & CSR Decoder Online — 100% Private SSL Inspector"', 'seoTitle: "X.509 & CSR Decoder — Private SSL Tool"'],
    ['seoTitle: "SSH Key Generator Online (Ed25519, RSA, ECDSA) — OpenSSH Randomart"', 'seoTitle: "SSH Key Generator — Ed25519, RSA, ECDSA"'],
    ['seoTitle: "JSON to TypeScript Converter - Privacy Backed Developer Scratchpad"', 'seoTitle: "JSON to TypeScript — Private Scratchpad"'],
    ['seoTitle: "YAML to JSON Converter - 100% Client-Side Developer Scratchpad"', 'seoTitle: "YAML to JSON — 100% Client-Side Tool"'],
    ['seoTitle: "Regex Tester Online — Real-Time Regular Expression Testing"', 'seoTitle: "Regex Tester — Real-Time RegEx Testing"']
]);

console.log("Done");
