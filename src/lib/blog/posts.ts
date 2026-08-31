export interface BlogPost {
 slug: string;
 title: string;
 seoTitle: string;
 description: string;
 seoDescription: string;
 publishedAt: string;
 updatedAt: string;
 relatedToolSlug: string;
 content: string;
}

export const BLOG_POSTS: BlogPost[] = [
 {
 slug:"cron-expression-cheat-sheet",
 title:"Cron Expression Cheat Sheet — Complete Guide with Examples",
 seoTitle:"Cron Expression Cheat Sheet 2026 — Syntax, Examples & Generator",
 description:"A comprehensive guide to cron expressions, syntax, and examples.",
 seoDescription:"Learn how to write cron expressions with our complete cheat sheet. Covers syntax, examples, special characters, and a free visualizer.",
 publishedAt:"2026-08-28T00:00:00Z",
 updatedAt:"2026-08-28T00:00:00Z",
 relatedToolSlug:"cron-visualizer",
 content: `
# Cron Expression Cheat Sheet

Cron expressions are a powerful way to schedule background tasks, scripts, and jobs in Unix-like operating systems and modern cloud environments. This guide will walk you through the 5-field cron syntax, special characters, and provide practical examples.

## The 5-Field Cron Syntax

A standard cron expression consists of five fields separated by spaces:

\`\`\`text
* * * * *
| | | | |
| | | | +-- Day of Week (0 - 7) (Sunday=0 or 7)
| | | +---- Month (1 - 12)
| | +------ Day of Month (1 - 31)
| +-------- Hour (0 - 23)
+---------- Minute (0 - 59)
\`\`\`

## Special Characters

- **\`*\` (Asterisk):** Matches all values for a field. For example, \`*\` in the minute field means"every minute".
- **\`,\` (Comma):** Used to separate items in a list. For example, \`1,15,30\` in the minute field means the 1st, 15th, and 30th minutes.
- **\`-\` (Hyphen):** Defines a range. For example, \`9-17\` in the hour field means from 9 AM to 5 PM.
- **\`/\` (Slash):** Specifies step values. For example, \`*/5\` in the minute field means every 5 minutes.

## Common Cron Patterns

| Description | Expression |
| ----------- | ---------- |
| Every minute | \`* * * * *\` |
| Every 5 minutes | \`*/5 * * * *\` |
| Every hour, on the hour | \`0 * * * *\` |
| Every day at midnight | \`0 0 * * *\` |
| Every Monday at 9:00 AM | \`0 9 * * 1\` |
| The 1st day of every month at midnight | \`0 0 1 * *\` |

## Real-World Examples

### Database Backups

Run a database backup every day at 2:30 AM:
\`\`\`text
30 2 * * * /usr/local/bin/backup.sh
\`\`\`

### Log Rotation

Rotate server logs every Sunday at midnight:
\`\`\`text
0 0 * * 0 /usr/sbin/logrotate /etc/logrotate.conf
\`\`\`

### Email Reports

Send a weekly summary report on Friday at 5:00 PM:
\`\`\`text
0 17 * * 5 /opt/scripts/send_report.py
\`\`\`

## Troubleshooting Common Mistakes

- **Timezones:** Remember that cron runs in the system's local timezone unless specified otherwise. In cloud environments (like AWS or Kubernetes), this is usually UTC.
- **Missing Paths:** Always use absolute paths in your cron commands (e.g., \`/usr/bin/python3\` instead of \`python3\`) because cron has a very minimal \`$PATH\` environment.
- **Syntax Errors:** Ensure you have exactly 5 (or 6 for some extended parsers) fields. Using a cron visualizer can help you catch off-by-one errors.

Need help building or testing your cron expressions? Try our [Cron Visualizer](/cron-visualizer) tool.
 `,
 },
 {
 slug:"convert-curl-to-python",
 title:"How to Convert cURL Commands to Python requests — Complete Guide",
 seoTitle:"Convert cURL to Python requests — Step-by-Step Guide 2026",
 description:"Learn how to manually or automatically convert cURL commands into Python requests code.",
 seoDescription:"Step-by-step guide covering cURL flag mapping to Python requests (headers, body, auth, cookies, SSL) with complete code examples.",
 publishedAt:"2026-08-28T00:00:00Z",
 updatedAt:"2026-08-28T00:00:00Z",
 relatedToolSlug:"curl-converter",
 content: `
# How to Convert cURL Commands to Python requests

The \`cURL\` command-line tool is ubiquitous in API documentation and debugging. However, when you need to integrate that API call into your Python application, you must convert the \`cURL\` syntax into a Python \`requests\` script. This guide covers how to map cURL flags to the \`requests\` library.

## Basic GET Request

**cURL:**
\`\`\`bash
curl https://api.example.com/users
\`\`\`

**Python:**
\`\`\`python
import requests

response = requests.get('https://api.example.com/users')
print(response.json())
\`\`\`

## Adding Headers (\`-H\`)

Headers are passed using the \`headers\` dictionary in Python.

**cURL:**
\`\`\`bash
curl -H"Authorization: Bearer my_token"\\
 -H"Accept: application/json"\\
 https://api.example.com/data
\`\`\`

**Python:**
\`\`\`python
import requests

headers = {
 'Authorization': 'Bearer my_token',
 'Accept': 'application/json'
}

response = requests.get('https://api.example.com/data', headers=headers)
\`\`\`

## Sending JSON Data (\`-d\` / \`--data\`)

When sending JSON, use the \`json\` parameter in \`requests.post()\`. This automatically sets the \`Content-Type: application/json\` header.

**cURL:**
\`\`\`bash
curl -X POST https://api.example.com/users \\
 -H"Content-Type: application/json"\\
 -d '{"name":"Alice","role":"admin"}'
\`\`\`

**Python:**
\`\`\`python
import requests

json_data = {
 'name': 'Alice',
 'role': 'admin'
}

response = requests.post('https://api.example.com/users', json=json_data)
\`\`\`

## Form Data and Multipart Uploads (\`-F\`)

For file uploads or form data, use the \`files\` or \`data\` parameters.

**cURL:**
\`\`\`bash
curl -X POST https://api.example.com/upload \\
 -F"file=@/path/to/image.jpg"\\
 -F"description=Profile photo"
\`\`\`

**Python:**
\`\`\`python
import requests

files = {
 'file': open('/path/to/image.jpg', 'rb')
}
data = {
 'description': 'Profile photo'
}

response = requests.post('https://api.example.com/upload', files=files, data=data)
\`\`\`

## Basic Authentication (\`-u\`)

**cURL:**
\`\`\`bash
curl -u username:password https://api.example.com/protected
\`\`\`

**Python:**
\`\`\`python
import requests

response = requests.get('https://api.example.com/protected', auth=('username', 'password'))
\`\`\`

## Error Handling Patterns

Always check for HTTP errors in your requests:

\`\`\`python
import requests

try:
 response = requests.get('https://api.example.com/data', timeout=5)
 response.raise_for_status() # Raises an HTTPError for bad responses (4xx and 5xx)
 data = response.json()
except requests.exceptions.HTTPError as errh:
 print(f"HTTP Error: {errh}")
except requests.exceptions.ConnectionError as errc:
 print(f"Error Connecting: {errc}")
except requests.exceptions.Timeout as errt:
 print(f"Timeout Error: {errt}")
except requests.exceptions.RequestException as err:
 print(f"Something went wrong: {err}")
\`\`\`

## Disabling SSL Verification (\`-k\` / \`--insecure\`)

If you are testing against a local server with a self-signed certificate, you can disable SSL verification (not recommended for production).

**Python:**
\`\`\`python
response = requests.get('https://localhost:8443/test', verify=False)
\`\`\`

Want to convert your commands instantly? Try our [cURL to Python/JavaScript/Go Converter](/curl-converter).
 `,
 },
 {
 slug:"jwt-token-decode-guide",
 title:"How to Decode JWT Tokens — A Developer's Complete Guide",
 seoTitle:"How to Decode JWT Tokens — Complete Guide with Examples 2026",
 description:"Understand the structure of JWTs and how to decode them in various languages.",
 seoDescription:"Learn how to decode JSON Web Tokens (JWT). Covers structure, Base64URL vs Base64, decoding without a library, and common security mistakes.",
 publishedAt:"2026-08-28T00:00:00Z",
 updatedAt:"2026-08-28T00:00:00Z",
 relatedToolSlug:"jwt-decoder",
 content: `
# How to Decode JWT Tokens — A Developer's Complete Guide

JSON Web Tokens (JWT) are an open, industry standard (RFC 7519) method for representing claims securely between two parties. They are widely used for authentication and authorization in modern web applications.

## What is a JWT?

A JWT consists of three parts separated by dots (\`.\`):

\`\`\`text
header.payload.signature
\`\`\`

1. **Header:** Contains the token type (usually"JWT") and the signing algorithm being used (e.g., HMAC SHA256 or RSA).
2. **Payload:** Contains the claims (the statements about an entity, typically the user, and additional data).
3. **Signature:** Used to verify that the sender of the JWT is who it says it is and to ensure that the message wasn't changed along the way.

Both the header and payload are **Base64URL encoded** JSON objects. Because they are only encoded, not encrypted, **anyone can decode and read them**. Never put sensitive information (like passwords) inside a JWT payload.

## Base64URL vs Base64

Base64URL is a variant of Base64 designed specifically for use in URLs and filenames. It replaces \`+\` with \`-\` and \`/=\` with \`_\`, and omits the trailing \`=\` padding characters. When decoding a JWT manually, you may need to add the padding back and replace the characters to use standard Base64 decoders.

## Standard Claims

The JWT specification defines several standard claims (registered claims):

- \`iss\` (Issuer): Identifies the principal that issued the JWT.
- \`sub\` (Subject): Identifies the principal that is the subject of the JWT.
- \`aud\` (Audience): Identifies the recipients that the JWT is intended for.
- \`exp\` (Expiration Time): Identifies the expiration time on or after which the JWT MUST NOT be accepted for processing. (Unix timestamp)
- \`nbf\` (Not Before): Identifies the time before which the JWT MUST NOT be accepted for processing.
- \`iat\` (Issued At): Identifies the time at which the JWT was issued.

## Decoding JWT without a Library

You can decode the header and payload of a JWT natively in most languages.

### JavaScript (Browser)

In the browser, you can use the built-in \`atob()\` function (though it doesn't support full UTF-8 decoding properly without extra steps, it works for simple ASCII payloads):

\`\`\`javascript
function decodeJwtPayload(token) {
 const base64Url = token.split('.')[1];
 const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
 const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
 return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
 }).join(''));
 
 return JSON.parse(jsonPayload);
}
\`\`\`

### Python

Using the built-in \`base64\` and \`json\` modules:

\`\`\`python
import base64
import json

def decode_jwt_payload(token):
 payload_part = token.split('.')[1]
 # Add padding back if necessary
 payload_part += '=' * (-len(payload_part) % 4)
 # Decode Base64URL to bytes, then to string
 decoded_bytes = base64.urlsafe_b64decode(payload_part)
 return json.loads(decoded_bytes.decode('utf-8'))
\`\`\`

## Common Security Mistakes

1. **Assuming JWTs are encrypted:** They are encoded. The payload is readable by anyone who has the token.
2. **Accepting"none"algorithm:** Always enforce a strong signing algorithm (like RS256 or HS256). The"none"algorithm vulnerability allowed attackers to forge tokens.
3. **Not verifying the signature:** Decoding the payload is not enough; you must cryptographically verify the signature before trusting the claims.
4. **Ignoring expiration (\`exp\`):** Always check that the token is not expired before trusting it.

Need to decode a token right now securely in your browser? Use our [JWT Decoder](/jwt-decoder) tool.
 `,
 },
];

export function getBlogPost(slug: string): BlogPost | undefined {
 return BLOG_POSTS.find((p) => p.slug === slug);
}

export const BLOG_SLUGS = BLOG_POSTS.map((p) => p.slug);
