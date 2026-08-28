import re, json

data = {
    'json-formatter': {
        'seoTitle': 'JSON Formatter Online — Format, Validate & Minify | DevScratchpad',
        'seoDescription': 'Free online JSON formatter and validator — paste your JSON, format with 2 or 4 space indent, minify, and detect syntax errors instantly. No data sent to any server.'
    },
    'jwt-decoder': {
        'seoTitle': 'JWT Decoder Online — Decode Tokens Safely | DevScratchpad',
        'seoDescription': 'Free online JWT decoder — paste any JSON Web Token to decode header, payload, and signature. Auto-converts exp/iat timestamps to readable dates. 100% client-side.'
    },
    'unix-timestamp': {
        'seoTitle': 'Unix Timestamp Converter — Epoch to Date Online | DevScratchpad',
        'seoDescription': 'Free online Unix timestamp converter — convert epoch seconds or milliseconds to UTC, local time, and ISO 8601. Also converts dates back to epoch. Runs in your browser.'
    },
    'curl-converter': {
        'seoTitle': 'cURL to Python/JavaScript/Go Converter | DevScratchpad',
        'seoDescription': 'Free online cURL to code converter — paste any cURL command and generate clean JavaScript fetch, Python requests, or Go net/http code. No API keys sent to any server.'
    },
    'diff-checker': {
        'seoTitle': 'Diff Checker Online — Compare Code Side by Side | DevScratchpad',
        'seoDescription': 'Free online diff checker — compare two texts or code blocks side by side with character-level additions and deletions highlighted. Works entirely in your browser.'
    },
    'xml-formatter': {
        'seoTitle': 'XML Formatter Online — Beautify & Minify XML | DevScratchpad',
        'seoDescription': 'Free online XML formatter — beautify, indent, and minify XML documents with customizable indentation. No data transmitted to any server.'
    },
    'sql-formatter': {
        'seoTitle': 'SQL Formatter Online — Beautify SQL Queries | DevScratchpad',
        'seoDescription': 'Free online SQL formatter — beautify complex queries across PostgreSQL, MySQL, SQLite, T-SQL dialects with uppercase keywords and clean indentation. 100% private.'
    },
    'base64-decoder': {
        'seoTitle': 'Base64 Encoder & Decoder Online | DevScratchpad',
        'seoDescription': 'Free online Base64 encoder and decoder — convert strings to Base64 and back with UTF-8 support and URL-safe toggle. Runs entirely in your browser.'
    },
    'url-encoder': {
        'seoTitle': 'URL Encoder & Decoder Online | DevScratchpad',
        'seoDescription': 'Free online URL encoder and decoder — encode special characters or decode URL parameters and query strings instantly. No data leaves your browser.'
    },
    'hash-generator': {
        'seoTitle': 'Hash Generator — MD5, SHA-1, SHA-256, SHA-512 | DevScratchpad',
        'seoDescription': 'Free online hash generator — compute MD5, SHA-1, SHA-256, and SHA-512 hashes simultaneously from any text input. All processing runs in your browser.'
    },
    'regex-tester': {
        'seoTitle': 'Regex Tester Online — Test Regular Expressions | DevScratchpad',
        'seoDescription': 'Free online regex tester — write and test regular expressions in real-time with match highlighting, flag controls, and substitution preview. 100% client-side.'
    },
    'json-to-typescript': {
        'seoTitle': 'JSON to TypeScript Converter Online | DevScratchpad',
        'seoDescription': 'Free online JSON to TypeScript converter — paste JSON and generate clean interfaces with nested type extraction and union type detection. No data sent to servers.'
    },
    'cron-visualizer': {
        'seoTitle': 'Cron Expression Parser — Human-Readable Cron | DevScratchpad',
        'seoDescription': 'Free online cron expression parser — translate complex cron schedules into plain English with individual field breakdowns. Works offline in your browser.'
    },
    'yaml-json': {
        'seoTitle': 'YAML to JSON Converter Online | DevScratchpad',
        'seoDescription': 'Free online YAML to JSON and JSON to YAML converter — bidirectional conversion preserving data structures. One-click swap, runs in your browser.'
    },
    'css-svg-minifier': {
        'seoTitle': 'CSS & SVG Minifier Online | DevScratchpad',
        'seoDescription': 'Free online CSS and SVG minifier — strip comments, whitespace, and newlines with compression ratio display. No files uploaded to any server.'
    },
    'graphql-formatter': {
        'seoTitle': 'GraphQL Formatter Online — Beautify Queries | DevScratchpad',
        'seoDescription': 'Free online GraphQL formatter — beautify and validate GraphQL queries and schemas using the official AST parser. Zero data transmission.'
    },
    'markdown-previewer': {
        'seoTitle': 'Markdown Preview Online — Live Editor | DevScratchpad',
        'seoDescription': 'Free online Markdown editor with live preview — write Markdown and see sanitized HTML render instantly. DOMPurify protection, no server processing.'
    },
    'hmac-generator': {
        'seoTitle': 'HMAC Generator — SHA-256/SHA-512 for Webhooks | DevScratchpad',
        'seoDescription': 'Free online HMAC generator — compute SHA-256 and SHA-512 HMAC signatures in Hex and Base64 for Stripe and GitHub webhook testing. 100% client-side.'
    },
    'cidr-calculator': {
        'seoTitle': 'CIDR Calculator — IPv4 Subnet Calculator Online | DevScratchpad',
        'seoDescription': 'Free online CIDR calculator — parse IPv4 CIDR blocks to get network address, broadcast, wildcard mask, and usable host range. Runs in your browser.'
    }
}

file_path = 'c:/Users/User/Desktop/Project_website/src/lib/tools/registry.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('description: string;\n  seoDescription: string;', 'description: string;\n  seoTitle: string;\n  seoDescription: string;')

for slug, meta in data.items():
    # The original file has:
    # seoDescription:
    #   "Fast, client-side ...",
    pattern = rf'(\s*"{slug}":\s*{{[^}}]*?description:\s*".*?",\n)\s*seoDescription:\s*".*?",'
    replacement = rf'\1    seoTitle:\n      "{meta["seoTitle"]}",\n    seoDescription:\n      "{meta["seoDescription"]}",'
    content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
