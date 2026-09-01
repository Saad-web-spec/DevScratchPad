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
    slug: "cron-expression-cheat-sheet",
    title: "Cron Expression Cheat Sheet — Complete Syntax, Examples & Schedule Guide",
    seoTitle: "Cron Expression Cheat Sheet 2026 — Syntax, Examples & Visualizer",
    description: "The ultimate reference guide to cron expression syntax. Covers 5-field & 6-field formats, special characters (*, /, -, ,), common schedules, and real-world examples.",
    seoDescription: "Learn how to write, debug, and test cron expressions with our complete cheat sheet. Syntax breakdown, special characters, copy-paste examples, and free visualizer.",
    publishedAt: "2026-08-28T00:00:00Z",
    updatedAt: "2026-09-01T00:00:00Z",
    relatedToolSlug: "cron",
    content: `
Cron is a time-based job scheduling daemon standard on Unix-like operating systems (Linux, macOS, BSD) and widely adopted across modern cloud systems like Kubernetes CronJobs, AWS CloudWatch Events, GitHub Actions, and Google Cloud Scheduler.

This cheat sheet provides a complete reference for cron syntax, special characters, predefined macros, copy-paste production schedules, and troubleshooting tips.

---

## The 5-Field Standard Cron Syntax

A traditional cron schedule consists of five fields separated by whitespace:

\`\`\`text
┌───────────── Minute (0 - 59)
│ ┌───────────── Hour (0 - 23)
│ │ ┌───────────── Day of Month (1 - 31)
│ │ │ ┌───────────── Month (1 - 12 or JAN-DEC)
│ │ │ │ ┌───────────── Day of Week (0 - 6 or SUN-SAT) (Sunday = 0 or 7)
│ │ │ │ │
* * * * * <command-to-execute>
\`\`\`

### Field Descriptions & Allowed Ranges

| Field | Description | Allowed Values | Allowed Special Characters |
| :--- | :--- | :--- | :--- |
| **Minute** | Minute of the hour | \`0 - 59\` | \`*\` \`,\` \`-\` \`/\` |
| **Hour** | Hour of the day (24-hour) | \`0 - 23\` | \`*\` \`,\` \`-\` \`/\` |
| **Day of Month** | Calendar day of the month | \`1 - 31\` | \`*\` \`,\` \`-\` \`/\` \`L\` \`W\` |
| **Month** | Month of the year | \`1 - 12\` or \`JAN-DEC\` | \`*\` \`,\` \`-\` \`/\` |
| **Day of Week** | Day of the week | \`0 - 7\` (\`0\`/\`7\`=Sun) or \`SUN-SAT\` | \`*\` \`,\` \`-\` \`/\` \`L\` \`#\` |

> **Note on Sunday:** In standard Unix cron, both \`0\` and \`7\` represent Sunday.

---

## Special Operators Explained

Cron uses specific operators to represent intervals, lists, and wildcards:

### 1. Asterisk (\`*\`) — Every Value
Represents all possible values for that field.
- \`* * * * *\` = Every minute of every hour of every day.

### 2. Comma (\`,\`) — List of Values
Specifies multiple distinct values for a field.
- \`0 9,12,15 * * *\` = At minute 0 of hours 9, 12, and 15 (9:00 AM, 12:00 PM, 3:00 PM every day).

### 3. Hyphen (\`-\`) — Range of Values
Defines an inclusive continuous range.
- \`0 9-17 * * 1-5\` = Every hour on the hour from 9:00 AM through 5:00 PM, Monday through Friday.

### 4. Slash (\`/\`) — Step / Interval Values
Specifies step increments through a range.
- \`*/15 * * * *\` = Every 15 minutes (\`0, 15, 30, 45\`).
- \`0 0-12/2 * * *\` = Every 2 hours starting from midnight until noon (\`0:00, 2:00, 4:00, ..., 12:00\`).

---

## Quick Reference: Common Cron Patterns

Copy and paste these verified cron schedules directly into your configuration:

| Schedule Requirement | Cron Expression | Plain English Breakdown |
| :--- | :--- | :--- |
| **Every minute** | \`* * * * *\` | Every minute |
| **Every 5 minutes** | \`*/5 * * * *\` | At every 5th minute |
| **Every 15 minutes** | \`*/15 * * * *\` | At minutes 0, 15, 30, and 45 |
| **Every 30 minutes** | \`*/30 * * * *\` | At minutes 0 and 30 |
| **Every hour on the hour** | \`0 * * * *\` | At minute 0 of every hour |
| **Every 2 hours** | \`0 */2 * * *\` | At minute 0 of every 2nd hour |
| **Every day at midnight** | \`0 0 * * *\` | At 00:00 (12:00 AM) every day |
| **Every day at 3:30 AM** | \`30 3 * * *\` | At 03:30 (3:30 AM) every day |
| **Every weekday (Mon-Fri) at 9 AM** | \`0 9 * * 1-5\` | At 09:00 on Monday through Friday |
| **Every weekend (Sat-Sun) at midnight** | \`0 0 * * 6,0\` | At 00:00 on Saturday and Sunday |
| **Every Sunday at 4:00 AM** | \`0 4 * * 0\` | At 04:00 on Sunday |
| **1st day of every month at midnight** | \`0 0 1 * *\` | At 00:00 on day 1 of every month |
| **Every quarter (Jan, Apr, Jul, Oct 1st)** | \`0 0 1 1,4,7,10 *\` | At 00:00 on the 1st of every 3rd month |
| **Once a year (Jan 1st at midnight)** | \`0 0 1 1 *\` | At 00:00 on January 1st |

---

## Predefined Special Macros

Many modern cron implementations (such as Vixie Cron and crontab) support convenient shortcut macros instead of the 5-field syntax:

| Macro | Equivalent 5-Field Syntax | Description |
| :--- | :--- | :--- |
| \`@yearly\` / \`@annually\` | \`0 0 1 1 *\` | Run once a year at midnight of January 1st |
| \`@monthly\` | \`0 0 1 * *\` | Run once a month at midnight of the 1st day |
| \`@weekly\` | \`0 0 * * 0\` | Run once a week at midnight on Sunday |
| \`@daily\` / \`@midnight\` | \`0 0 * * *\` | Run once a day at midnight (00:00) |
| \`@hourly\` | \`0 * * * *\` | Run once an hour at the beginning of the hour |
| \`@reboot\` | N/A | Run once automatically at system startup |

---

## Real-World Production Crontab Examples

### 1. PostgreSQL / MySQL Daily Backup
Run a database backup dump every night at 2:15 AM and redirect logs:
\`\`\`bash
15 2 * * * /usr/local/bin/pg_dump -U postgres my_db > /var/backups/db_\$(date +\\%Y\\%m\\%d).sql 2>&1
\`\`\`

### 2. Log Rotation & Cache Cleanup
Purge temporary files and rotate server logs every Sunday at 3:00 AM:
\`\`\`bash
0 3 * * 0 /usr/sbin/logrotate /etc/logrotate.conf && find /tmp -type f -mtime +7 -delete
\`\`\`

### 3. SSL Certificate Auto-Renewal (Certbot)
Attempt Let's Encrypt renewal twice daily at random minute offsets (recommended practice):
\`\`\`bash
0 0,12 * * * /usr/bin/certbot renew --quiet
\`\`\`

### 4. Health Check / Uptime Ping
Trigger an internal API health ping every 5 minutes:
\`\`\`bash
*/5 * * * * /usr/bin/curl -fsS https://api.example.com/health > /dev/null
\`\`\`

---

## Troubleshooting & Best Practices

1. **Always Use Absolute Binary Paths:** Cron executes in a very minimal shell environment with a stripped down \`$PATH\`. Instead of typing \`python3 script.py\`, always write \`/usr/bin/python3 /opt/app/script.py\`.
2. **Account for Timezones:** Cron runs against the system clock (typically UTC in cloud environments like AWS EC2, GCP, and Kubernetes). Ensure your schedule accounts for UTC vs your local time.
3. **Capture stdout and stderr:** By default, cron attempts to email output to the user. Always redirect output to log files or null:
   \`\`\`bash
   0 4 * * * /path/to/job.sh >> /var/log/job.log 2>&1
   \`\`\`
4. **Escape the \`%\` Character in Crontab:** The percent sign (\`%\`) in crontab entries is treated as a newline unless escaped with a backslash (\`\\%\`).

---

Need to quickly test or debug your cron expression? Use our free, 100% offline [Cron Expression Visualizer](/tools/cron) to translate any expression into human English.
`,
  },
  {
    slug: "convert-curl-to-python",
    title: "How to Convert cURL Commands to Python requests — Complete Guide with Code",
    seoTitle: "Convert cURL to Python requests — Complete Guide & Examples 2026",
    description: "Step-by-step guide to converting cURL commands into clean, production-ready Python requests code. Covers GET, POST, JSON, custom headers, auth, and error handling.",
    seoDescription: "Learn how to convert any cURL command into Python requests code. Step-by-step flag mapping for headers, JSON body, Basic/Bearer auth, multipart uploads, and SSL.",
    publishedAt: "2026-08-28T00:00:00Z",
    updatedAt: "2026-09-01T00:00:00Z",
    relatedToolSlug: "curl-to-python",
    content: `
cURL is the universal language of API documentation and network debugging. When you copy an API request from Chrome DevTools, Postman, or Swagger, it almost always comes formatted as a \`curl\` command.

However, when building automation scripts or backend services, you need to convert that command into clean, readable Python code using the standard \`requests\` library.

This guide provides a comprehensive mapping of all cURL parameters to Python \`requests\`.

---

## 1. Basic GET Request

### cURL:
\`\`\`bash
curl https://api.example.com/v1/users
\`\`\`

### Python:
\`\`\`python
import requests

response = requests.get('https://api.example.com/v1/users')

# Inspect response
print(f"Status Code: {response.status_code}")
data = response.json()
print(data)
\`\`\`

---

## 2. Query Parameters

Instead of manually constructing URL query strings, pass a dictionary to the \`params\` argument in Python.

### cURL:
\`\`\`bash
curl "https://api.example.com/v1/search?query=developer&limit=20&sort=desc"
\`\`\`

### Python:
\`\`\`python
import requests

params = {
    'query': 'developer',
    'limit': 20,
    'sort': 'desc'
}

response = requests.get('https://api.example.com/v1/search', params=params)
print(response.url)  # Automatically encodes special characters
\`\`\`

---

## 3. Custom Headers (\`-H\` / \`--header\`)

Map each \`-H\` flag into a Python dictionary.

### cURL:
\`\`\`bash
curl https://api.example.com/v1/profile \\
  -H "Accept: application/json" \\
  -H "X-Client-Version: 2.4.0"
\`\`\`

### Python:
\`\`\`python
import requests

headers = {
    'Accept': 'application/json',
    'X-Client-Version': '2.4.0'
}

response = requests.get('https://api.example.com/v1/profile', headers=headers)
\`\`\`

---

## 4. POST Requests with JSON Payloads (\`-d\` / \`--data\`)

When sending JSON data in Python, use the \`json=\` parameter rather than \`data=\`. This automatically serializes your dictionary into JSON and attaches the \`Content-Type: application/json\` header.

### cURL:
\`\`\`bash
curl -X POST https://api.example.com/v1/users \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Saad", "role": "engineer", "active": true}'
\`\`\`

### Python:
\`\`\`python
import requests

payload = {
    'name': 'Saad',
    'role': 'engineer',
    'active': True
}

response = requests.post('https://api.example.com/v1/users', json=payload)
print(response.status_code)
\`\`\`

---

## 5. Form URL-Encoded Data (\`-d\` vs \`--data-urlencode\`)

For traditional form submissions (such as OAuth token exchanges), pass the dictionary to \`data=\`:

### cURL:
\`\`\`bash
curl -X POST https://auth.example.com/oauth/token \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "grant_type=client_credentials&client_id=my_id&client_secret=my_secret"
\`\`\`

### Python:
\`\`\`python
import requests

form_data = {
    'grant_type': 'client_credentials',
    'client_id': 'my_id',
    'client_secret': 'my_secret'
}

response = requests.post('https://auth.example.com/oauth/token', data=form_data)
token = response.json().get('access_token')
\`\`\`

---

## 6. Authentication Patterns

### A. Bearer Token Auth
\`\`\`python
import requests

headers = {
    'Authorization': 'Bearer YOUR_SECRET_API_TOKEN'
}

response = requests.get('https://api.example.com/protected', headers=headers)
\`\`\`

### B. Basic Authentication (\`-u user:password\`)
\`\`\`python
import requests
from requests.auth import HTTPBasicAuth

response = requests.get(
    'https://api.example.com/admin',
    auth=HTTPBasicAuth('username', 'secret_password')
)
\`\`\`

---

## 7. Multipart File Uploads (\`-F\` / \`--form\`)

### cURL:
\`\`\`bash
curl -X POST https://api.example.com/upload \\
  -F "file=@/path/to/report.pdf" \\
  -F "category=finance"
\`\`\`

### Python:
\`\`\`python
import requests

files = {
    'file': ('report.pdf', open('/path/to/report.pdf', 'rb'), 'application/pdf')
}
data = {
    'category': 'finance'
}

response = requests.post('https://api.example.com/upload', files=files, data=data)
\`\`\`

---

## 8. Production-Grade Robustness: Timeouts & Retries

Never run raw \`requests.get()\` in production without a timeout or error handling:

\`\`\`python
import requests
from requests.adapters import HTTPAdapter
from urllib3.util import Retry

def create_resilient_session() -> requests.Session:
    session = requests.Session()
    # Retry on transient server errors (500, 502, 503, 504)
    retries = Retry(
        total=3,
        backoff_factor=0.5,
        status_forcelist=[500, 502, 503, 504]
    )
    session.mount('https://', HTTPAdapter(max_retries=retries))
    return session

session = create_resilient_session()

try:
    response = session.get('https://api.example.com/data', timeout=5.0)
    response.raise_for_status()  # Raises HTTPError for 4xx/5xx responses
    data = response.json()
except requests.exceptions.Timeout:
    print("Request timed out after 5 seconds")
except requests.exceptions.HTTPError as err:
    print(f"Server responded with error: {err}")
except requests.exceptions.RequestException as err:
    print(f"Network error occurred: {err}")
\`\`\`

---

Need to convert complex cURL commands instantly? Try our free, 100% private [cURL to Python Converter](/tools/curl-to-python) directly in your browser.
`,
  },
  {
    slug: "jwt-token-decode-guide",
    title: "How to Decode JWT Tokens — Complete Developer Guide & Security Reference",
    seoTitle: "How to Decode JWT Tokens Online & Offline — Complete Guide 2026",
    description: "Understand the internal structure of JSON Web Tokens (JWT). Learn how to decode headers, payloads, and signatures in JavaScript, Python, and Go without external servers.",
    seoDescription: "Complete guide to JSON Web Tokens (JWT). Learn header and payload decoding, Base64URL vs Base64, standard claims (iss, exp, sub), and common security vulnerabilities.",
    publishedAt: "2026-08-28T00:00:00Z",
    updatedAt: "2026-09-01T00:00:00Z",
    relatedToolSlug: "jwt",
    content: `
JSON Web Tokens (JWT, pronounced "jot") are an open, industry-standard RFC 7519 method for securely transmitting claims between parties as a compact JSON object.

JWTs are ubiquitously used in modern web architecture for **stateless authentication**, **single sign-on (SSO)**, and **API access tokens**.

This guide covers the anatomy of a token, how Base64URL encoding works, how to decode tokens in multiple programming languages without libraries, and critical security vulnerabilities to avoid.

---

## 1. Anatomy of a JSON Web Token

A standard JWT string consists of three distinct segments separated by periods (\`.\`):

\`\`\`text
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlNhYWQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE1MTYyMzkwMjIsImV4cCI6MTcxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
\`\`\`

Represented visually:

\`\`\`text
┌───────────────────────────┬───────────────────────────┬───────────────────────────┐
│          HEADER           │          PAYLOAD          │         SIGNATURE         │
│  {"alg":"HS256","typ":    │  {"sub":"12345","name":   │  HMACSHA256(              │
│   "JWT"}                  │   "Saad","role":"admin"}  │   base64(header) + "." +  │
│                           │                           │   base64(payload), secret)│
└───────────────────────────┴───────────────────────────┴───────────────────────────┘
\`\`\`

### A. The Header
Specifies the cryptographic algorithm used to sign the token (e.g. \`HS256\`, \`RS256\`, \`ES256\`) and the token type (\`JWT\`).
\`\`\`json
{
  "alg": "HS256",
  "typ": "JWT"
}
\`\`\`

### B. The Payload (Claims)
Contains the actual identity statements and permission data.
\`\`\`json
{
  "sub": "user_987654",
  "name": "Saad",
  "role": "admin",
  "iat": 1725177600,
  "exp": 1725264000
}
\`\`\`

### C. The Signature
Generated by taking the encoded header, the encoded payload, and hashing them with a secret key or private cryptographic key. Used by servers to guarantee the payload hasn't been tampered with.

> **CRITICAL SECURITY NOTE:** Both the Header and Payload are only **Base64URL encoded**, NOT encrypted! Anyone in possession of a token can decode and read all contents. Never store raw API keys, passwords, or credit card numbers inside a JWT payload.

---

## 2. Base64URL vs Standard Base64

Standard Base64 encoding uses characters \`+\` and \`/\` and pads strings with \`=\`. These characters have special meaning in URL query strings and HTTP headers.

**Base64URL solves this by:**
1. Replacing \`+\` with \`-\`
2. Replacing \`/\` with \`_\`
3. Omitting the trailing padding \`=\`

### Conversion Rule:
| Standard Base64 | Base64URL |
| :--- | :--- |
| \`+\` | \`-\` |
| \`/\` | \`_\` |
| \`=\` (padding) | *(omitted / stripped)* |

---

## 3. Standard Registered Claims Dictionary

RFC 7519 defines 7 standard claim keys:

| Claim Key | Full Name | Type | Purpose |
| :--- | :--- | :--- | :--- |
| **\`iss\`** | Issuer | String | Identifies the authority/server that generated the token (e.g. \`https://auth.company.com\`). |
| **\`sub\`** | Subject | String | The unique identity of the user or machine (e.g. \`user_102834\`). |
| **\`aud\`** | Audience | String/Array | The recipient service the token is intended for. |
| **\`exp\`** | Expiration Time | Unix Timestamp | The timestamp after which the token MUST be rejected. |
| **\`nbf\`** | Not Before | Unix Timestamp | The timestamp before which the token MUST NOT be accepted. |
| **\`iat\`** | Issued At | Unix Timestamp | When the token was originally minted. |
| **\`jti\`** | JWT ID | String | A unique token nonce to prevent replay attacks. |

---

## 4. Decoding JWTs without Third-Party Libraries

### A. JavaScript / TypeScript (Client-Side & Node.js)
\`\`\`javascript
function decodeJwt(token) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT token structure');
  }

  // Base64URL to standard Base64 conversion
  const base64Url = parts[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  
  // UTF-8 safe decoding
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );

  return JSON.parse(jsonPayload);
}

// Example usage:
const payload = decodeJwt("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...");
console.log(payload);
\`\`\`

### B. Python
\`\`\`python
import base64
import json

def decode_jwt_payload(token: str) -> dict:
    parts = token.split('.')
    if len(parts) != 3:
        raise ValueError("Invalid JWT format")
    
    payload_b64 = parts[1]
    # Add back padding if missing
    padding = '=' * (4 - len(payload_b64) % 4)
    decoded_bytes = base64.urlsafe_b64decode(payload_b64 + padding)
    return json.loads(decoded_bytes.decode('utf-8'))

# Example usage:
claims = decode_jwt_payload("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
print(claims)
\`\`\`

### C. Command Line (Bash + \`jq\`)
\`\`\`bash
# Quick one-liner to decode JWT payload in terminal
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." | cut -d. -f2 | base64 -d 2>/dev/null | jq .
\`\`\`

---

## 5. The Top 4 JWT Security Vulnerabilities

1. **The "none" Algorithm Vulnerability:** Malicious clients modify the header to \`{"alg": "none"}\` and strip the signature. Vulnerable backend libraries that don't enforce an algorithm whitelist will treat the forged token as valid.
2. **Algorithm Confusion (HMAC vs RSA):** If a server expects asymmetric RS256 (public key verification), an attacker might sign the token using HMAC-SHA256 with the server's *public key* as the HMAC secret key. Always strictly bind verification to a single algorithm.
3. **Missing Expiration Checks (\`exp\`):** Tokens without an \`exp\` claim or servers that fail to validate expiration allow compromised tokens to be used indefinitely.
4. **Sending Sensitive Data to Remote Formatters:** Pasting production JWTs into public online decoders sends confidential user IDs, session claims, and signatures over the internet.

---

Need to inspect a token safely? Use our 100% offline [JWT Decoder Tool](/tools/jwt) — all decoding and timestamp parsing runs in your browser's local memory with zero server transmission.
`,
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export const BLOG_SLUGS = BLOG_POSTS.map((p) => p.slug);
