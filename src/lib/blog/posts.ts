import { BlogPost } from "./types";

export * from "./types";
export * from "./tracks";

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "cron-expression-cheat-sheet",
    title: "Cron Expression Cheat Sheet — Complete Syntax, Examples & Schedule Guide",
    seoTitle: "Cron Expression Cheat Sheet 2026 — Syntax, Examples & Visualizer",
    description: "The ultimate reference guide to cron expression syntax. Covers 5-field & 6-field formats, special characters (*, /, -, ,), common schedules, and real-world examples.",
    seoDescription: "Learn how to write, debug, and test cron expressions with our complete cheat sheet. Syntax breakdown, special characters, copy-paste examples, and free visualizer.",
    publishedAt: "2026-08-28T00:00:00Z",
    updatedAt: "2026-09-03T00:00:00Z",
    category: "DevOps & Cloud",
    type: "cheat-sheet",
    difficulty: "Beginner",
    readTime: "5 min read",
    tags: ["Cron", "Linux", "Kubernetes", "DevOps", "Crontab", "Scheduling"],
    relatedToolSlug: "cron",
    relatedGuideSlugs: ["regex-cheat-sheet-recipes", "modern-http-status-codes-reference"],
    interactivePreset: {
      toolSlug: "cron",
      title: "Interactive Cron Schedule Visualizer",
      initialInput: "*/15 9-17 * * 1-5",
      inputLabel: "Cron Expression",
      outputLabel: "Human English Translation",
      explanation: "Runs every 15 minutes between 9:00 AM and 5:59 PM, Monday through Friday.",
    },
    faqs: [
      {
        question: "What does */5 * * * * mean in cron?",
        answer: "It means 'run every 5 minutes' (at minutes 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, and 55 of every hour)."
      },
      {
        question: "Is Sunday 0 or 7 in standard cron?",
        answer: "In standard Unix crontab implementations, both 0 and 7 represent Sunday."
      },
      {
        question: "How do I run a cron job every 2 hours?",
        answer: "Use the schedule '0 */2 * * *', which fires at minute 0 of every 2nd hour (00:00, 02:00, 04:00, etc.)."
      }
    ],
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
15 2 * * * /usr/local/bin/pg_dump -U postgres my_db > /var/backups/db_$(date +\\%Y\\%m\\%d).sql 2>&1
\`\`\`

### 2. Log Rotation & Cache Cleanup
Purge temporary files and rotate server logs every Sunday at 3:00 AM:
\`\`\`bash
0 3 * * 0 /usr/sbin/logrotate /etc/logrotate.conf && find /tmp -type f -mtime +7 -delete
\`\`\`

### 3. SSL Certificate Auto-Renewal (Certbot)
Attempt Let's Encrypt renewal twice daily at random minute offsets:
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
`,
  },
  {
    slug: "regex-cheat-sheet-recipes",
    title: "Regular Expressions (Regex) Developer Cheat Sheet & Quick Recipes",
    seoTitle: "Regex Cheat Sheet 2026 — Syntax, Flags & Copy-Paste Patterns",
    description: "Complete modern regular expression cheat sheet. Master character classes, quantifiers, lookahead, lookbehind, capturing groups, and copy-paste production recipes.",
    seoDescription: "Exhaustive developer regex cheat sheet. Syntax reference for lookaheads, non-capturing groups, flags, plus copy-paste patterns for emails, URLs, IPs, and dates.",
    publishedAt: "2026-09-03T00:00:00Z",
    updatedAt: "2026-09-03T00:00:00Z",
    category: "DevOps & Cloud",
    type: "cheat-sheet",
    difficulty: "Beginner",
    readTime: "7 min read",
    tags: ["Regex", "JavaScript", "Python", "Syntax", "Validation", "DevOps"],
    relatedToolSlug: "regex",
    relatedGuideSlugs: ["cron-expression-cheat-sheet", "convert-curl-to-python"],
    interactivePreset: {
      toolSlug: "regex",
      title: "Interactive Regex Tester & Visualizer",
      initialInput: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
      inputLabel: "Regular Expression Pattern",
      outputLabel: "Live Pattern Analysis",
      explanation: "Validates standard user@domain.tld email addresses with case insensitivity.",
    },
    faqs: [
      {
        question: "What is the difference between .* and .*? in Regex?",
        answer: "'.*' is greedy and matches as many characters as possible, while '.*?' is lazy (non-greedy) and stops at the very first occurrence of the subsequent pattern."
      },
      {
        question: "What is a positive lookahead (?=...)?",
        answer: "A positive lookahead asserts that what immediately follows the current position matches the pattern, without including those characters in the matched string."
      },
      {
        question: "How do I match an exact string with case insensitivity?",
        answer: "Use the 'i' flag (e.g. /pattern/i in JavaScript) or inline modifier '(?i)pattern' in Python/PCRE."
      }
    ],
    content: `
Regular expressions (Regex) are essential across every layer of software development: API validation, log filtering, data extraction, search & replace in IDEs, and security firewalls.

This reference cheat sheet condenses syntax, meta-characters, advanced assertions, and copy-paste production recipes into a quick-lookup format.

---

## 1. Core Meta-Characters & Anchors

| Symbol | Meaning | Example | Matches |
| :--- | :--- | :--- | :--- |
| **\`^\`** | Start of string / line | \`^Error\` | Line starting with "Error" |
| **\`$\`** | End of string / line | \`\\.json$\` | Strings ending in ".json" |
| **\`.\`** | Any single character (except newline) | \`c.t\` | "cat", "cot", "c9t" |
| **\`\\b\`** | Word boundary | \`\\bdev\\b\` | "dev" inside "dev tools", but not "developer" |
| **\`\\B\`** | Non-word boundary | \`\\Bdev\\B\` | Matches "dev" only when embedded inside words |
| **\`\\|\`** | Alternation (OR) | \`cat\\|dog\` | Either "cat" or "dog" |

---

## 2. Character Classes

| Class | Equivalent | Description |
| :--- | :--- | :--- |
| **\`\\d\`** | \`[0-9]\` | Any digit |
| **\`\\D\`** | \`[^0-9]\` | Any non-digit |
| **\`\\w\`** | \`[a-zA-Z0-9_]\` | Word character (alphanumeric + underscore) |
| **\`\\W\`** | \`[^a-zA-Z0-9_]\` | Non-word character (spaces, symbols) |
| **\`\\s\`** | \`[ \\t\\r\\n\\f\\v]\` | Whitespace character |
| **\`\\S\`** | \`[^ \\t\\r\\n\\f\\v]\` | Non-whitespace character |
| **\`[abc]\`** | Discrete set | Either "a", "b", or "c" |
| **\`[^abc]\`** | Negated set | Any character except "a", "b", or "c" |
| **\`[a-z]\`** | Range | Lowercase ASCII letters |

---

## 3. Quantifiers: Greedy vs Lazy

Quantifiers control how many times a character or group may repeat. By default, quantifiers are **greedy** (they consume as much text as possible). Append \`?\` to make them **lazy** (consume as few characters as possible).

| Greedy | Lazy | Frequency |
| :--- | :--- | :--- |
| **\`*\`** | **\`*?\`** | 0 or more times |
| **\`+\`** | **\`+?\`** | 1 or more times |
| **\`?\`** | **\`??\`** | 0 or 1 time (optional) |
| **\`{n}\`** | N/A | Exactly \`n\` times |
| **\`{n,}\`** | **\`{n,}?\`** | At least \`n\` times |
| **\`{n,m}\`** | **\`{n,m}?\`** | Between \`n\` and \`m\` times |

---

## 4. Groups, Backreferences & Assertions

### Capturing vs Non-Capturing Groups
- \`(pattern)\`: Captures the match into a numeric group (\`$1\`, \`$2\`).
- \`(?<name>pattern)\`: Named capture group (accessible via \`groups.name\` in JS/Python).
- \`(?:pattern)\`: **Non-capturing group**. Groups tokens together for repetition without allocating memory.

### Lookahead and Lookbehind (Zero-Width Assertions)
| Syntax | Name | Logic |
| :--- | :--- | :--- |
| **\`(?=abc)\`** | Positive Lookahead | Matches if followed by "abc" |
| **\`(?!abc)\`** | Negative Lookahead | Matches if NOT followed by "abc" |
| **\`(?<=abc)\`** | Positive Lookbehind | Matches if preceded by "abc" |
| **\`(?<!abc)\`** | Negative Lookbehind | Matches if NOT preceded by "abc" |

---

## 5. Verified Copy-Paste Production Recipes

### A. Validating UUID v4
\`\`\`regex
^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$
\`\`\`

### B. IPv4 Address (0-255 Range Safe)
\`\`\`regex
^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$
\`\`\`

### C. Strong Password Enforcement
*Requires at least 8 characters, one uppercase, one lowercase, one digit, and one symbol:*
\`\`\`regex
^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$
\`\`\`

### D. ISO 8601 Date Format (\`YYYY-MM-DD\`)
\`\`\`regex
^\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])$
\`\`\`

### E. Semantic Versioning (SemVer)
\`\`\`regex
^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-((?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\\.(?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\\+([0-9a-zA-Z-]+(?:\\.[0-9a-zA-Z-]+)*))?$
\`\`\`
`,
  },
  {
    slug: "modern-http-status-codes-reference",
    title: "Modern HTTP Status Codes & Response Headers Guide",
    seoTitle: "HTTP Status Codes & Response Headers Cheat Sheet 2026",
    description: "Complete developer guide to HTTP status codes (2xx, 3xx, 4xx, 5xx) and essential security headers. Covers 401 vs 403, 429 rate limiting, and CORS headers.",
    seoDescription: "Comprehensive reference for HTTP status codes and headers. Difference between 401 Unauthorized and 403 Forbidden, 422 vs 400, idempotency, and security headers.",
    publishedAt: "2026-09-03T00:00:00Z",
    updatedAt: "2026-09-03T00:00:00Z",
    category: "API & Automation",
    type: "cheat-sheet",
    difficulty: "Beginner",
    readTime: "6 min read",
    tags: ["HTTP", "API", "REST", "Status Codes", "Security", "Headers"],
    relatedToolSlug: "curl-to-fetch",
    relatedGuideSlugs: ["convert-curl-to-python", "convert-curl-to-fetch-axios"],
    interactivePreset: {
      toolSlug: "curl-to-fetch",
      title: "Interactive HTTP Request Translator",
      initialInput: "curl -X POST https://api.devscratchpad.tech/v1/ping -H 'X-Client-ID: dev_123' -d '{\"status\":\"ok\"}'",
      inputLabel: "Raw cURL Request",
      outputLabel: "JavaScript Fetch Equivalent",
      explanation: "Inspect how standard headers and POST payloads map to modern client APIs.",
    },
    faqs: [
      {
        question: "What is the exact difference between HTTP 401 and 403?",
        answer: "401 Unauthorized means 'Unauthenticated' (the client has not provided valid credentials). 403 Forbidden means 'Authenticated but Unauthorized' (the server knows who you are, but you lack permissions for this resource)."
      },
      {
        question: "When should I use 422 Unprocessable Entity instead of 400 Bad Request?",
        answer: "Use 400 when the request syntax is malformed (e.g., invalid JSON syntax). Use 422 when the JSON syntax is perfectly valid, but the data fails business validation rules (e.g. email already taken, age cannot be negative)."
      },
      {
        question: "What does status code 429 Too Many Requests require?",
        answer: "429 indicates rate limiting. Good API design mandates returning a 'Retry-After' header specifying seconds or an HTTP-date until requests are permitted again."
      }
    ],
    content: `
HTTP status codes are the standardized three-digit communication language between client applications and web servers. Knowing precisely which status code to return in your REST, GraphQL, or RPC APIs directly impacts client error handling, browser caching, and search engine crawling.

---

## 1. The 5 Major HTTP Status Families

- **1xx Informational:** Request received, continuing process (e.g. \`101 Switching Protocols\` for WebSockets).
- **2xx Success:** The action was successfully received, understood, and accepted.
- **3xx Redirection:** Further action must be taken to complete the request.
- **4xx Client Error:** The request contains bad syntax or cannot be fulfilled due to client fault.
- **5xx Server Error:** The server failed to fulfill an apparently valid request.

---

## 2. Essential 2xx Success Codes

| Code | Name | Idempotent | Usage |
| :--- | :--- | :--- | :--- |
| **\`200\`** | OK | Yes | Standard response for successful GET, PUT, or POST returning data. |
| **\`201\`** | Created | No | Successful POST that resulted in a new resource created. Should return \`Location\` header. |
| **\`202\`** | Accepted | No | Request accepted for asynchronous background processing (e.g. video rendering). |
| **\`204\`** | No Content | Yes | Successful request with no body returned (standard for DELETE or PUT). |

---

## 3. Essential 3xx Redirection Codes

| Code | Name | Search Engine Impact | Usage |
| :--- | :--- | :--- | :--- |
| **\`301\`** | Moved Permanently | Passes Link Equity | Permanent redirect. Browsers aggressively cache this indefinitely. |
| **\`302\`** | Found | Temporary | Temporary redirect. Clients keep using original URI. |
| **\`304\`** | Not Modified | Caching Optimization | Client sent \`If-None-Match\` (ETag) or \`If-Modified-Since\`; use local browser cache. |
| **\`307\`** | Temporary Redirect | Method Preserved | Same as 302, but guarantees the HTTP Method (POST stays POST) is preserved. |
| **\`308\`** | Permanent Redirect | Method Preserved | Same as 301, but guarantees the HTTP Method is preserved. |

---

## 4. The Critical 4xx Client Errors

### 401 Unauthorized vs 403 Forbidden
This is the most common confusion in modern web engineering:
- **\`401 Unauthorized\`:** The client **lacks authentication**. No valid token was provided. The response should include \`WWW-Authenticate\` challenge header.
- **\`403 Forbidden\`:** The client **is authenticated**, but **lacks authorization**. The server knows who the user is, but their role/permissions do not grant access.

### Other High-Frequency 4xx Errors
| Code | Name | Real-World Scenario |
| :--- | :--- | :--- |
| **\`400\`** | Bad Request | Syntax error: Invalid JSON syntax, malformed query string. |
| **\`404\`** | Not Found | Resource does not exist at requested URI. |
| **\`405\`** | Method Not Allowed | Sending a POST to an endpoint that only accepts GET. Must include \`Allow\` header. |
| **\`409\`** | Conflict | Optimistic concurrency conflict or duplicate database unique key (e.g. email taken). |
| **\`422\`** | Unprocessable Entity | Valid JSON payload, but fails validation (e.g. Zod / Ajv validation errors). |
| **\`429\`** | Too Many Requests | Rate limiting exceeded. Server must attach \`Retry-After: <seconds>\`. |

---

## 5. Modern Security Headers Checklist

Every production backend and Next.js application should emit these headers:

\`\`\`http
# Prevent browsers from MIME-sniffing away from declared Content-Type
X-Content-Type-Options: nosniff

# Restrict iframe embedding to stop clickjacking attacks
X-Frame-Options: DENY

# Enforce strict HTTPS connections for 1 year including subdomains
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload

# Restrict referrer information sent to third-party domains
Referrer-Policy: strict-origin-when-cross-origin

# Whitelist approved sources of executable scripts, styles, and fonts
Content-Security-Policy: default-src 'self'; img-src 'self' data: https:;
\`\`\`
`,
  },
  {
    slug: "convert-curl-to-fetch-axios",
    title: "Convert cURL to JavaScript — Fetch, Axios & Node.js Guide with Code",
    seoTitle: "Convert cURL to Fetch & Axios (JavaScript) — Complete Guide 2026",
    description: "Learn how to convert any cURL command to native JavaScript fetch() and Axios. Covers headers, JSON bodies, bearer auth, query parameters, and error handling.",
    seoDescription: "Step-by-step developer guide to converting cURL commands to modern JavaScript fetch and Axios. Flag mappings, async/await patterns, TypeScript types, and live converter.",
    publishedAt: "2026-09-03T00:00:00Z",
    updatedAt: "2026-09-03T00:00:00Z",
    category: "API & Automation",
    type: "guide",
    difficulty: "Beginner",
    readTime: "6 min read",
    tags: ["JavaScript", "TypeScript", "cURL", "Fetch", "Axios", "Node.js"],
    relatedToolSlug: "curl-to-fetch",
    relatedGuideSlugs: ["convert-curl-to-python", "modern-http-status-codes-reference"],
    interactivePreset: {
      toolSlug: "curl-to-fetch",
      title: "Interactive cURL to Fetch Converter",
      initialInput: "curl -X POST https://api.example.com/v1/auth -H 'Content-Type: application/json' -d '{\"apiKey\":\"sk_live_secret123\"}'",
      inputLabel: "cURL Command",
      outputLabel: "JavaScript Fetch Output",
      explanation: "Converts bash cURL with custom headers and POST payload into modern ES2024 fetch.",
    },
    faqs: [
      {
        question: "Does native fetch() reject on 4xx or 5xx HTTP responses?",
        answer: "No! Native fetch() only rejects on network failures. For 400/404/500 responses, fetch resolves successfully. You must check 'if (!response.ok)' manually."
      },
      {
        question: "How do I map cURL -d into JavaScript fetch?",
        answer: "Wrap your payload in JSON.stringify(data), attach the 'Content-Type: application/json' header, and assign it to the 'body:' property of fetch options."
      }
    ],
    content: `
When inspecting network traffic in Chrome DevTools or reading modern API documentation (Stripe, GitHub, OpenAI), code samples are universally provided as \`curl\` commands.

When writing modern client-side React code or backend Node.js microservices, translating those commands into clean \`fetch()\` or \`axios\` calls is a daily developer task.

This guide provides a complete flag-by-flag mapping.

---

## 1. The Core cURL to Fetch Mapping Table

| cURL Flag | Native \`fetch()\` Option | \`axios\` Config |
| :--- | :--- | :--- |
| \`-X POST\` | \`method: 'POST'\` | \`method: 'post'\` |
| \`-H "Key: Val"\` | \`headers: { 'Key': 'Val' }\` | \`headers: { 'Key': 'Val' }\` |
| \`-d '{"k":"v"}'\` | \`body: JSON.stringify({ k: 'v' })\` | \`data: { k: 'v' }\` |
| \`-u user:pass\` | \`headers: { 'Authorization': 'Basic ...' }\` | \`auth: { username, password }\` |
| \`--connect-timeout\` | \`signal: AbortSignal.timeout(5000)\` | \`timeout: 5000\` |

---

## 2. Basic GET Request

### cURL:
\`\`\`bash
curl "https://api.example.com/v1/items?limit=10&status=active"
\`\`\`

### Native Fetch (Modern Async/Await):
\`\`\`typescript
const url = new URL('https://api.example.com/v1/items');
url.searchParams.set('limit', '10');
url.searchParams.set('status', 'active');

const response = await fetch(url.toString(), {
  method: 'GET',
});

if (!response.ok) {
  throw new Error(\`HTTP error! status: \${response.status}\`);
}

const data = await response.json();
console.log(data);
\`\`\`

### Axios:
\`\`\`typescript
import axios from 'axios';

const { data } = await axios.get('https://api.example.com/v1/items', {
  params: {
    limit: 10,
    status: 'active',
  },
});
console.log(data);
\`\`\`

---

## 3. POST Request with JSON Body & Bearer Auth

### cURL:
\`\`\`bash
curl -X POST https://api.example.com/v1/orders \\
  -H "Authorization: Bearer my_secret_token_123" \\
  -H "Content-Type: application/json" \\
  -d '{"itemId": "item_987", "quantity": 3}'
\`\`\`

### Native Fetch:
\`\`\`typescript
const response = await fetch('https://api.example.com/v1/orders', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer my_secret_token_123',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    itemId: 'item_987',
    quantity: 3,
  }),
});

if (!response.ok) {
  const errorData = await response.json().catch(() => null);
  throw new Error(errorData?.message || \`Request failed with status \${response.status}\`);
}

const result = await response.json();
console.log(result);
\`\`\`

---

## 4. Production Timeout Handling with AbortSignal

In modern JavaScript (Node.js 18+ and all evergreen browsers), never call \`fetch()\` without a timeout signal:

\`\`\`typescript
try {
  const res = await fetch('https://api.example.com/slow-endpoint', {
    signal: AbortSignal.timeout(4000), // Automatically aborts after 4 seconds
  });
  const data = await res.json();
} catch (err: any) {
  if (err.name === 'TimeoutError') {
    console.error('Request timed out after 4 seconds');
  } else {
    console.error('Network failure:', err);
  }
}
\`\`\`
`,
  },
  {
    slug: "uuid-v4-v5-v7-explained",
    title: "UUID v4, v5, and v7 Guide: Performance, Collisions & Database Indexing",
    seoTitle: "UUID v4 vs v5 vs v7 Explained — Performance & Database Guide 2026",
    description: "Deep dive into UUID versions (v4, v5, and the new RFC 9562 v7). Learn why UUID v7 is replacing v4 for database primary keys and B-Tree indexing.",
    seoDescription: "Comprehensive developer guide to UUID versions. Compare UUID v4 random generation vs UUID v7 time-ordered IDs for PostgreSQL, MySQL, and MongoDB performance.",
    publishedAt: "2026-09-03T00:00:00Z",
    updatedAt: "2026-09-03T00:00:00Z",
    category: "Data & Serialization",
    type: "guide",
    difficulty: "Intermediate",
    readTime: "7 min read",
    tags: ["UUID", "Databases", "PostgreSQL", "Architecture", "Performance", "Data"],
    relatedToolSlug: "uuid-generator",
    relatedGuideSlugs: ["base64-inspector-guide", "json-to-typescript-zod-schema-guide"],
    interactivePreset: {
      toolSlug: "uuid-generator",
      title: "Interactive Offline UUID Generator",
      initialInput: "5",
      inputLabel: "Batch Quantity",
      outputLabel: "Cryptographically Secure UUIDs",
      explanation: "Generates RFC 4122 compliant UUIDs locally using the browser's crypto.getRandomValues API.",
    },
    faqs: [
      {
        question: "What is the probability of a UUID v4 collision?",
        answer: "To have a 50% chance of a single collision, you would need to generate 1 billion UUIDs per second continuously for approximately 85 years (about 2.71 x 10^18 UUIDs)."
      },
      {
        question: "Why is UUID v7 better than UUID v4 for database primary keys?",
        answer: "UUID v4 is completely random, which causes severe B-Tree index fragmentation and high disk I/O in databases like PostgreSQL and MySQL. UUID v7 is timestamp-ordered at the beginning, preserving sequential insertion performance while remaining globally unique."
      }
    ],
    content: `
Universally Unique Identifiers (UUIDs) are 128-bit identifiers standardized under RFC 4122 and recently updated under RFC 9562. They allow distributed distributed architectures to generate unique IDs without centralized coordination.

However, choosing the wrong UUID version can severely degrade database performance.

---

## 1. The Anatomy of a 128-Bit UUID

A UUID is rendered as 32 hexadecimal characters across five hyphenated blocks:

\`\`\`text
f47ac10b-58cc-4372-a567-0e02b2c3d479
xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx
\`\`\`
- **\`M\` (13th character):** Represents the **UUID Version** (e.g. \`4\` for random, \`7\` for Unix Epoch time-sorted).
- **\`N\` (17th character):** Represents the **Variant** (e.g. \`8\`, \`9\`, \`a\`, or \`b\` for RFC standard).

---

## 2. UUID Versions Compared

| Version | Mechanism | Predictable? | Ideal Use Case |
| :--- | :--- | :--- | :--- |
| **\`v1\`** | MAC Address + Timestamp | Yes (privacy risk) | Legacy systems (deprecated for public web). |
| **\`v3\`** | MD5 Hash of Namespace + Name | Deterministic | Idempotent ID generation where MD5 is acceptable. |
| **\`v4\`** | 122 bits of pure Cryptographic Entropy | No | Ephemeral tokens, session keys, non-database IDs. |
| **\`v5\`** | SHA-1 Hash of Namespace + Name | Deterministic | Deterministic IDs where duplicate inputs must match. |
| **\`v7\`** | 48-bit Unix Timestamp (ms) + 74 bits Random | Monotonic | **Modern Database Primary Keys (PostgreSQL, MySQL).** |

---

## 3. The UUID v4 Database Indexing Problem

When using UUID v4 as a primary key in relational databases:
1. Every new row has an unpredictable, random hash.
2. In a B-Tree index, the new row must be inserted into an arbitrary memory page on disk.
3. Once the index exceeds available RAM, this causes massive **page splits**, cache thrashing, and high disk write latency.

### How UUID v7 Solves This
UUID v7 stores a 48-bit millisecond Unix timestamp in the most significant bits:
\`\`\`text
┌──────────────────────────────┬──────────────┬──────────────────────────────┐
│  48-bit Unix Timestamp (ms)  │ 12-bit Rand  │       62-bit Entropy         │
│  (Sequential Ordering)       │  + Ver (7)   │       + Variant              │
└──────────────────────────────┴──────────────┴──────────────────────────────┘
\`\`\`
Because the timestamp comes first, UUID v7 rows are inserted monotonically at the end of the B-Tree index, delivering performance nearly identical to traditional auto-incrementing integers while retaining distributed generation safety!
`,
  },
  {
    slug: "json-to-typescript-zod-schema-guide",
    title: "How to Auto-Generate TypeScript Types & Zod Schemas from JSON",
    seoTitle: "Generate TypeScript Interfaces & Zod Schemas from JSON 2026",
    description: "Learn how to instantly convert raw JSON API payloads into strict TypeScript interfaces and runtime Zod validation schemas with zero server transmission.",
    seoDescription: "Step-by-step developer guide to converting JSON to TypeScript types and Zod schemas. Covers nested objects, array unions, optional fields, and runtime validation.",
    publishedAt: "2026-09-03T00:00:00Z",
    updatedAt: "2026-09-03T00:00:00Z",
    category: "Data & Serialization",
    type: "cookbook",
    difficulty: "Beginner",
    readTime: "5 min read",
    tags: ["TypeScript", "Zod", "JSON", "Validation", "API", "Frontend"],
    relatedToolSlug: "json-to-ts",
    relatedGuideSlugs: ["json-formatter-privacy-backed-developer-tools", "convert-curl-to-fetch-axios"],
    interactivePreset: {
      toolSlug: "json-to-ts",
      title: "Interactive JSON to TypeScript Generator",
      initialInput: '{"id": 101, "username": "alex", "verified": true, "roles": ["admin", "editor"]}',
      inputLabel: "Raw JSON Object",
      outputLabel: "TypeScript Interface",
      explanation: "Parses primitive and array types into clean TypeScript interfaces.",
    },
    faqs: [
      {
        question: "Why do I need Zod if TypeScript already validates types?",
        answer: "TypeScript only validates types at compile-time. Once your code is compiled to JavaScript and runs in production, TypeScript disappears. Zod provides runtime validation at API boundaries to catch invalid payloads before they crash your app."
      },
      {
        question: "How can I generate TypeScript types directly from a Zod schema?",
        answer: "Use Zod's built-in inference: 'type User = z.infer<typeof UserSchema>;'. This guarantees your static types and runtime schemas are always 100% in sync."
      }
    ],
    content: `
Modern frontend and backend engineering in Next.js, Node.js, and React requires strict type safety. When integrating third-party APIs (Stripe, GitHub, internal microservices), manually writing TypeScript interfaces for 50-field JSON payloads is tedious and error-prone.

Furthermore, static types provide zero runtime protection. If an API returns \`null\` instead of a string, your application will throw an uncaught runtime error.

This guide demonstrates how to generate static TypeScript types and runtime Zod validation schemas directly from JSON.

---

## 1. TypeScript Interface Generation

Given a raw API response:
\`\`\`json
{
  "orderId": "ord_98765",
  "totalAmount": 149.99,
  "isPaid": true,
  "customer": {
    "name": "Sarah Connor",
    "email": "sarah@cyberdyne.com"
  },
  "tags": ["express", "priority"]
}
\`\`\`

The generated TypeScript interfaces:
\`\`\`typescript
export interface Customer {
  name: string;
  email: string;
}

export interface OrderResponse {
  orderId: string;
  totalAmount: number;
  isPaid: boolean;
  customer: Customer;
  tags: string[];
}
\`\`\`

---

## 2. Converting to Runtime Zod Schemas

To validate this payload dynamically at runtime (for example in Next.js Server Actions or Route Handlers):

\`\`\`typescript
import { z } from "zod";

export const CustomerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export const OrderResponseSchema = z.object({
  orderId: z.string().startsWith("ord_"),
  totalAmount: z.number().positive(),
  isPaid: z.boolean(),
  customer: CustomerSchema,
  tags: z.array(z.string()),
});

// Automatically infer static TypeScript type from runtime schema
export type OrderResponse = z.infer<typeof OrderResponseSchema>;
\`\`\`

---

## 3. Safe Parsing in Next.js API Routes

\`\`\`typescript
export async function POST(request: Request) {
  const json = await request.json();
  
  const parseResult = OrderResponseSchema.safeParse(json);
  
  if (!parseResult.success) {
    return Response.json(
      { error: "Validation Failed", details: parseResult.error.flatten() },
      { status: 422 }
    );
  }
  
  // parseResult.data is 100% type-safe and validated
  const order = parseResult.data;
  return Response.json({ success: true, orderId: order.orderId });
}
\`\`\`
`,
  },
  {
    slug: "openssl-x509-devops-cheat-sheet",
    title: "OpenSSL Command Cheat Sheet: Generating Keys, CSRs & Inspecting Certificates",
    seoTitle: "OpenSSL Commands Cheat Sheet 2026 — Keys, CSRs & Certificates",
    description: "Complete OpenSSL CLI cheat sheet for DevOps and Sysadmins. Generate private keys, create Certificate Signing Requests (CSRs), verify SSL handshakes, and convert PEM to DER.",
    seoDescription: "Exhaustive OpenSSL command cheat sheet. Copy-paste terminal commands to generate RSA/Ed25519 keys, inspect certificates, check SSL expiry, and verify CA chains.",
    publishedAt: "2026-09-03T00:00:00Z",
    updatedAt: "2026-09-03T00:00:00Z",
    category: "Security & Cryptography",
    type: "cheat-sheet",
    difficulty: "Intermediate",
    readTime: "6 min read",
    tags: ["OpenSSL", "SSL", "TLS", "DevOps", "Certificates", "Linux"],
    relatedToolSlug: "cert-decoder",
    relatedGuideSlugs: ["x509-certificate-decoder-guide", "ssh-key-generator-guide"],
    interactivePreset: {
      toolSlug: "cert-decoder",
      title: "Interactive X.509 Certificate Decoder",
      initialInput: "-----BEGIN CERTIFICATE-----\nMIIDRjCCAi6gAwIBAgIUW6w3l1Fq7vjK...\n-----END CERTIFICATE-----",
      inputLabel: "PEM Formatted Certificate",
      outputLabel: "Decoded Cryptographic Breakdown",
      explanation: "Inspect SANs, expiration dates, and public key fingerprints locally without server transmission.",
    },
    faqs: [
      {
        question: "How do I check when a remote server's SSL certificate expires using OpenSSL?",
        answer: "Run: echo | openssl s_client -servername domain.com -connect domain.com:443 2>/dev/null | openssl x509 -noout -dates"
      },
      {
        question: "How do I verify if a private key matches an SSL certificate?",
        answer: "Compare their MD5 moduli: 'openssl x509 -noout -modulus -in cert.pem | openssl md5' and 'openssl rsa -noout -modulus -in key.pem | openssl md5'. If the hashes match, the key belongs to the certificate."
      }
    ],
    content: `
OpenSSL is the Swiss Army knife of transport layer security and cryptographic infrastructure. Whether configuring Nginx, Kubernetes ingress controllers, or AWS load balancers, these commands are daily necessities.

---

## 1. Generating Private Keys

### Generate RSA 4096-bit Key
\`\`\`bash
openssl genrsa -out server.key 4096
\`\`\`

### Generate Modern Ed25519 Key
\`\`\`bash
openssl genpkey -algorithm ED25519 -out server_ed25519.key
\`\`\`

---

## 2. Certificate Signing Requests (CSR)

### Create a CSR from Existing Private Key
\`\`\`bash
openssl req -new -key server.key -out server.csr \\
  -subj "/C=US/ST=California/L=San Francisco/O=DevScratchpad/CN=devscratchpad.tech"
\`\`\`

### Inspect CSR Details
\`\`\`bash
openssl req -text -noout -verify -in server.csr
\`\`\`

---

## 3. Inspecting Certificates

### View Complete Certificate Information
\`\`\`bash
openssl x509 -in cert.pem -text -noout
\`\`\`

### Check Only Validity Expiration Dates
\`\`\`bash
openssl x509 -in cert.pem -noout -dates
\`\`\`

### Extract Subject Alternative Names (SANs)
\`\`\`bash
openssl x509 -in cert.pem -noout -ext subjectAltName
\`\`\`

---

## 4. Live Server SSL Handshake Debugging

### Connect and Inspect Remote Certificate
\`\`\`bash
openssl s_client -servername example.com -connect example.com:443
\`\`\`

### Quick Expiration Check for Remote Host
\`\`\`bash
echo | openssl s_client -servername example.com -connect example.com:443 2>/dev/null \\
  | openssl x509 -noout -enddate
\`\`\`
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
    category: "API & Automation",
    type: "guide",
    difficulty: "Beginner",
    readTime: "6 min read",
    tags: ["cURL", "Python", "API", "Requests", "Automation"],
    relatedToolSlug: "curl-to-python",
    relatedGuideSlugs: ["convert-curl-to-fetch-axios", "curl-to-go-javascript-python-code-generators"],
    interactivePreset: {
      toolSlug: "curl-to-python",
      title: "Interactive cURL to Python Translator",
      initialInput: "curl -X POST https://api.example.com/v1/users -H 'Content-Type: application/json' -d '{\"name\":\"Saad\",\"role\":\"engineer\"}'",
      inputLabel: "cURL Bash Command",
      outputLabel: "Python requests Code",
      explanation: "Translates shell flags into clean requests.post dictionary arguments.",
    },
    faqs: [
      {
        question: "Why should I use json= instead of data= in Python requests?",
        answer: "Passing a dictionary to json= automatically serializes it to JSON and attaches the 'Content-Type: application/json' header. Passing it to data= sends it as application/x-www-form-urlencoded."
      }
    ],
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
print(response.url)
\`\`\`

---

## 3. POST Requests with JSON Payloads (\`-d\` / \`--data\`)

When sending JSON data in Python, use the \`json=\` parameter rather than \`data=\`:

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
    category: "Security & Cryptography",
    type: "guide",
    difficulty: "Intermediate",
    readTime: "6 min read",
    tags: ["JWT", "Auth", "Security", "Tokens", "RFC7519"],
    relatedToolSlug: "jwt",
    relatedGuideSlugs: ["password-hashing-bcrypt-argon2", "base64-inspector-guide"],
    interactivePreset: {
      toolSlug: "jwt",
      title: "Interactive Offline JWT Token Inspector",
      initialInput: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlNhYWQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE1MTYyMzkwMjIsImV4cCI6MTcxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
      inputLabel: "JWT Token String",
      outputLabel: "Decoded Header & Claims",
      explanation: "Decodes claims and evaluates expiration timestamps with zero server transmission.",
    },
    faqs: [
      {
        question: "Is a JWT token encrypted by default?",
        answer: "No! Standard JWS tokens are only Base64URL encoded and digitally signed. Anyone can decode and inspect the payload. Sensitive information like passwords must never be stored in a standard JWT."
      }
    ],
    content: `
JSON Web Tokens (JWT, pronounced "jot") are an open, industry-standard RFC 7519 method for securely transmitting claims between parties as a compact JSON object.

JWTs are ubiquitously used in modern web architecture for **stateless authentication**, **single sign-on (SSO)**, and **API access tokens**.

---

## 1. Anatomy of a JSON Web Token

A standard JWT string consists of three distinct segments separated by periods (\`.\`):

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

### B. The Payload (Claims)
Contains identity claims and timestamps (\`sub\`, \`iss\`, \`exp\`, \`iat\`).

### C. The Signature
Generated by taking the encoded header, payload, and secret key to prevent tampering.
`,
  },
  {
    slug: "password-hashing-bcrypt-argon2",
    title: "Password Hashing Guide: Bcrypt, Argon2 & PBKDF2 Explained",
    seoTitle: "Password Hashing Guide: Bcrypt, Argon2id & PBKDF2 Explained",
    description: "A complete developer's guide to modern password hashing. Learn the differences between Bcrypt, Argon2id, and PBKDF2, and how to choose the right cost factors.",
    seoDescription: "Learn modern password hashing best practices. Compare Bcrypt, Argon2id, and PBKDF2, understand cost factors, and test hashes with our free offline verifier.",
    publishedAt: "2026-09-01T12:00:00Z",
    updatedAt: "2026-09-01T12:00:00Z",
    category: "Security & Cryptography",
    type: "guide",
    difficulty: "Intermediate",
    readTime: "7 min read",
    tags: ["Bcrypt", "Argon2", "Security", "Cryptography", "Hashing"],
    relatedToolSlug: "password-hash",
    relatedGuideSlugs: ["jwt-token-decode-guide", "ssh-key-generator-guide"],
    interactivePreset: {
      toolSlug: "password-hash",
      title: "Interactive Password Hash & Verifier",
      initialInput: "CorrectHorseBatteryStaple123!",
      inputLabel: "Candidate Password",
      outputLabel: "Generated Hash with Embedded Salt",
      explanation: "Computes Bcrypt, Argon2, or PBKDF2 hashes locally using the Web Crypto API.",
    },
    faqs: [
      {
        question: "Why is Argon2id preferred over Bcrypt?",
        answer: "Argon2id is memory-hard. While Bcrypt only taxes CPU cycles, Argon2id allocates large blocks of RAM, making GPU/ASIC parallel cracking economically unfeasible."
      }
    ],
    content: `
Password hashing is the foundational layer of application security. Unlike encryption (which is reversible), hashing is a **one-way function** — you can verify a password against a hash, but you cannot reverse the hash back to the original password.

Choosing the right algorithm and tuning its cost parameters is critical. Get it wrong and an attacker with a stolen database can crack millions of passwords per second on commodity GPUs.

---

## Why Not SHA-256 or MD5?

General-purpose hash functions like SHA-256 and MD5 are designed to be **fast**. That's the exact opposite of what you want for password storage.

| Algorithm | Hashes/sec (RTX 4090) | Purpose |
| :--- | :--- | :--- |
| MD5 | ~164 billion | Checksums, NOT passwords |
| SHA-256 | ~22 billion | Data integrity, NOT passwords |
| Bcrypt (cost 12) | ~32,000 | ✅ Password storage |
| Argon2id (64MB) | ~1,000 | ✅ Password storage |

The entire point of a password hash function is to be **deliberately slow** so that brute-force attacks become economically unfeasible.

---

## 1. Bcrypt — The Industry Standard

Bcrypt has been the default recommendation since 1999. It uses the Blowfish cipher internally and has a built-in salt.

### How Bcrypt Output Looks

\`\`\`text
$2b$12$LJ3m4ys3YOlTBSVVoJBNMezgqLcJEE3I7mFtHxMUb4uVlvDFqmqy6
 │  │  │                                                          
 │  │  └── 22-char salt + 31-char hash (Base64 encoded)
 │  └───── Cost factor (2^12 = 4096 iterations)
 └──────── Algorithm identifier ($2b$ = modern Bcrypt)
\`\`\`

### Bcrypt in Code

\`\`\`python
# Python (bcrypt library)
import bcrypt

password = b"CorrectHorseBatteryStaple"
salt = bcrypt.gensalt(rounds=12)  # Cost factor = 12
hashed = bcrypt.hashpw(password, salt)

# Verify
if bcrypt.checkpw(password, hashed):
    print("Password matches")
\`\`\`

\`\`\`javascript
// Node.js (bcryptjs)
const bcrypt = require('bcryptjs');

const hash = await bcrypt.hash('CorrectHorseBatteryStaple', 12);
const isValid = await bcrypt.compare('CorrectHorseBatteryStaple', hash);
\`\`\`

### Choosing the Cost Factor

| Cost | Iterations | ~Time (modern CPU) | Use Case |
| :--- | :--- | :--- | :--- |
| 10 | 1,024 | ~65ms | Minimum acceptable |
| 12 | 4,096 | ~250ms | **OWASP recommended** |
| 14 | 16,384 | ~1s | High-security systems |
| 16 | 65,536 | ~4s | Offline key derivation |

**Rule of thumb:** Choose the highest cost that keeps login latency under 250ms on your production hardware.

---

## 2. Argon2id — The Modern Gold Standard

Argon2 won the 2015 Password Hashing Competition and comes in three variants:

| Variant | Protection Against | When to Use |
| :--- | :--- | :--- |
| **Argon2d** | GPU attacks (data-dependent) | NOT for passwords (side-channel vulnerable) |
| **Argon2i** | Side-channel attacks (data-independent) | Okay, but less GPU-resistant |
| **Argon2id** | Both GPU + side-channel attacks | ✅ **Always use this** for passwords |

### Why Argon2id Is Superior

Unlike Bcrypt (which is CPU-bound), Argon2id is **memory-hard**. It forces the attacker to allocate large amounts of RAM per hash attempt, making GPU/ASIC-based cracking economically impractical.

### OWASP-Recommended Parameters

\`\`\`text
Memory:      64 MB  (65536 KiB)
Iterations:  3
Parallelism: 1 thread
Salt:        16 bytes (random)
Hash length: 32 bytes
\`\`\`

### Argon2id in Code

\`\`\`python
# Python (argon2-cffi)
from argon2 import PasswordHasher

ph = PasswordHasher(
    memory_cost=65536,  # 64 MB
    time_cost=3,        # 3 iterations
    parallelism=1       # 1 thread
)

hash = ph.hash("CorrectHorseBatteryStaple")
# Returns: $argon2id$v=19$m=65536,t=3,p=1$<salt>$<hash>

try:
    ph.verify(hash, "CorrectHorseBatteryStaple")
    print("Valid")
except Exception:
    print("Invalid")
\`\`\`

---

## 3. PBKDF2 — The Legacy Option

PBKDF2 (Password-Based Key Derivation Function 2) is the oldest of the three and is built into most platforms natively (including the Web Crypto API and .NET).

\`\`\`javascript
// Browser Web Crypto API
const enc = new TextEncoder();
const keyMaterial = await crypto.subtle.importKey(
  "raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]
);
const hash = await crypto.subtle.deriveBits(
  { name: "PBKDF2", salt: salt, iterations: 600000, hash: "SHA-256" },
  keyMaterial, 256
);
\`\`\`

OWASP recommends **600,000 iterations** with SHA-256 for PBKDF2. However, PBKDF2 is not memory-hard, so it remains vulnerable to GPU acceleration.

---

## Algorithm Decision Matrix

| Feature | Bcrypt | Argon2id | PBKDF2 |
| :--- | :--- | :--- | :--- |
| Memory-hard | ❌ | ✅ | ❌ |
| GPU-resistant | Moderate | ✅ Strong | ❌ Weak |
| Built-in salt | ✅ | ✅ | ❌ (manual) |
| Native browser support | ❌ | ❌ | ✅ (Web Crypto) |
| OWASP top pick (2024) | ✅ | ✅ (preferred) | ✅ (if others unavailable) |
| Max password length | 72 bytes | Unlimited | Unlimited |

**Recommendation:** Use **Argon2id** if your platform supports it. Fall back to **Bcrypt** (cost 12+) otherwise. Use **PBKDF2** only when neither is available (e.g., browser-only environments).

---

## Security Best Practices

1. **Always salt:** Every hash must use a unique, cryptographically random salt (at least 16 bytes). Bcrypt and Argon2 handle this automatically.
2. **Never truncate passwords silently:** Bcrypt has a 72-byte limit. If your app accepts longer passwords, hash with SHA-256 first (prehashing), then pass the result to Bcrypt.
3. **Rehash on login:** If a user logs in and their stored hash uses outdated parameters (e.g., Bcrypt cost 8), verify the password and then re-hash with stronger parameters before storing.
4. **Use a pepper for defense-in-depth:** A pepper is a server-side secret key applied before hashing. Store it in an HSM or environment variable — never in the database.
5. **Rate-limit login attempts:** Even the strongest hash is useless if your login endpoint allows unlimited attempts.

Test your password hashing configuration with the [Password Hash & Verifier](/tools/password-hash) tool. For related security topics, see the [SSH Key Generation Guide](/blog/ssh-key-generator-guide) and [JWT Token Decoding](/blog/jwt-token-decode-guide).
`,
  },
  {
    slug: "x509-certificate-decoder-guide",
    title: "How to Read X.509 PEM Certificates & CSRs",
    seoTitle: "X.509 Certificate & CSR Decoder Guide - Read PEM Files",
    description: "Learn how to parse, read, and understand X.509 SSL/TLS certificates and Certificate Signing Requests (CSR). Covers PEM structure, SANs, and Cryptographic properties.",
    seoDescription: "A complete guide to decoding X.509 PEM certificates and CSRs. Learn how to extract Subject Alternative Names, validity dates, and public key signatures securely.",
    publishedAt: "2026-09-01T12:00:00Z",
    updatedAt: "2026-09-01T12:00:00Z",
    category: "Security & Cryptography",
    type: "guide",
    difficulty: "Intermediate",
    readTime: "6 min read",
    tags: ["SSL", "TLS", "Certificates", "X.509", "DevOps"],
    relatedToolSlug: "cert-decoder",
    relatedGuideSlugs: ["openssl-x509-devops-cheat-sheet", "ssh-key-generator-guide"],
    content: `
## Understanding X.509 Certificates
X.509 is the standard format for public key certificates used in many internet protocols, including TLS/SSL. A certificate securely binds a public key to an entity (like a hostname, organization, or individual), mathematically verified by a trusted Certificate Authority (CA). Currently, the ubiquitous version is X.509 v3, which introduced the extensions critical for modern web security.

### PEM vs DER Encoding
Certificates are generally distributed in two main formats:

- **DER (Distinguished Encoding Rules)**: A binary format that is compact but unreadable to humans. Often used in Java or Windows environments.
- **PEM (Privacy Enhanced Mail)**: Base64-encoded DER data enclosed in specific ASCII headers (e.g., \`-----BEGIN CERTIFICATE-----\`). PEM is the most common format in Unix/Linux and web servers (Nginx, Apache).

**Example PEM Format:**
\`\`\`text
-----BEGIN CERTIFICATE-----
MIIDaDCCAlCgAwIBAgIJAO8... (Base64 data) ...
-----END CERTIFICATE-----
\`\`\`

### Anatomy of an X.509 Certificate
When you decode a certificate, you expose its internal structure:

- **Version**: Usually v3 (represented as integer 2).
- **Serial Number**: A unique identifier assigned by the CA.
- **Issuer**: The entity (CA) that signed and issued the certificate.
- **Validity**: The time range (\`Not Before\` and \`Not After\`) the certificate is trusted.
- **Subject**: The entity the certificate is issued to (e.g., \`CN=example.com\`).
- **Public Key**: The key used for encrypting data or verifying signatures.
- **Extensions**: Additional attributes, importantly the **Subject Alternative Name (SAN)**.

#### Why SANs Matter
Historically, the \`Common Name (CN)\` within the Subject was used to identify the domain. Today, modern browsers mandate that domains are listed in the Subject Alternative Name (SAN) extension. A single certificate can secure multiple domains (e.g., \`example.com\` and \`www.example.com\`) using SANs.

### Certificate Chains of Trust
Trust is hierarchical. Your server's **Leaf Certificate** is signed by an **Intermediate CA**, which in turn is signed by a **Root CA** trusted by your OS or browser. Missing intermediate certificates in your web server configuration is a common cause of SSL warnings.

### Decoding Certificates with OpenSSL
To view the contents of a PEM certificate:

\`\`\`bash
openssl x509 -in cert.pem -text -noout
\`\`\`

### Reading Certificate Signing Requests (CSRs)
Before getting a certificate, you generate a CSR. It contains your public key and subject details, but no validity period or issuer (since it isn't signed yet). To inspect a CSR:

\`\`\`bash
openssl req -in request.csr -text -noout
\`\`\`

### Common Certificate Errors
| Error | Meaning |
|-------|---------|
| \`ERR_CERT_DATE_INVALID\` | The certificate is expired or its valid period hasn't started. |
| \`ERR_CERT_AUTHORITY_INVALID\` | The browser doesn't trust the issuing CA (often a missing intermediate or self-signed cert). |
| \`ERR_CERT_COMMON_NAME_INVALID\` | The domain visited doesn't match any names in the SAN list. |

### Certificate Format Comparison
| Format | Encoding | Typical Extensions | Description |
|--------|----------|--------------------|-------------|
| **PEM** | Base64 ASCII | \`.pem\`, \`.crt\`, \`.cer\`, \`.key\` | Most common format for web servers. |
| **DER** | Binary | \`.der\`, \`.cer\` | Raw binary format, common in Windows. |
| **PKCS#12** | Binary | \`.p12\`, \`.pfx\` | Contains both certs and private keys in a password-protected bundle. |

Use our [X.509 Certificate Decoder](/tools/cert-decoder) to instantly parse and view certificate details in your browser without command-line tools.

For more command-line techniques, see our [OpenSSL Cheat Sheet](/blog/openssl-x509-devops-cheat-sheet).
`,
  },
  {
    slug: "ssh-key-generator-guide",
    title: "Generating Secure SSH Keys: Ed25519 vs RSA",
    seoTitle: "Secure SSH Key Generation: Ed25519 vs RSA Guide",
    description: "Understand the differences between Ed25519, RSA, and ECDSA SSH keys. Learn why Ed25519 is the modern standard and how to generate secure keypairs.",
    seoDescription: "A developer's guide to SSH key algorithms. Compare Ed25519 vs RSA 4096, understand key fingerprints, and generate offline SSH keypairs securely in-browser.",
    publishedAt: "2026-09-01T12:00:00Z",
    updatedAt: "2026-09-01T12:00:00Z",
    category: "Security & Cryptography",
    type: "guide",
    difficulty: "Intermediate",
    readTime: "5 min read",
    tags: ["SSH", "Ed25519", "RSA", "Security", "DevOps"],
    relatedToolSlug: "ssh-key-generator",
    relatedGuideSlugs: ["openssl-x509-devops-cheat-sheet", "password-hashing-bcrypt-argon2"],
    content: `
## The Mechanics of SSH Key Authentication
SSH keys provide a more secure and convenient alternative to password authentication. They operate on public-key cryptography: you generate a pair of mathematically linked keys. The **Private Key** remains secretly on your machine, while the **Public Key** is uploaded to the server's \`authorized_keys\` file. When you connect, the server uses the public key to issue a cryptographic challenge that only your private key can solve.

### Choosing an Algorithm
When generating keys, you must choose an algorithm. The landscape has evolved significantly:

| Algorithm | Key Size | Security Level | Performance | Compatibility |
|-----------|----------|----------------|-------------|---------------|
| **RSA** | 2048 to 4096 bits | High (if >= 2048) | Slower generation/signing | Universal (legacy systems) |
| **ECDSA** | 256, 384, 521 bits | High | Fast | High (modern systems) |
| **Ed25519** | 256 bits (fixed) | Very High | Extremely Fast | Good (OpenSSH 6.5+) |

**Ed25519** is the modern recommendation. It offers excellent security, fast performance, and produces small, easily manageable public keys.

### Generating Keys with ssh-keygen
To generate a modern Ed25519 keypair:

\`\`\`bash
ssh-keygen -t ed25519 -C "your_email@example.com"
\`\`\`

If you must use RSA for legacy server compatibility, always use at least a 4096-bit key:

\`\`\`bash
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
\`\`\`

### Understanding Key Fingerprints
A fingerprint is a shorter, human-readable hash of the public key (often formatted in SHA256 or MD5). When you connect to a new server, SSH displays the server's fingerprint. Verifying this fingerprint prevents Man-in-the-Middle (MitM) attacks.

\`\`\`bash
# View a local key fingerprint
ssh-keygen -lf ~/.ssh/id_ed25519.pub
\`\`\`

### Managing Multiple Keys
If you have different keys for GitHub, work, and personal servers, configuring \`~/.ssh/config\` simplifies connections:

\`\`\`text
Host github.com
    IdentityFile ~/.ssh/id_ed25519_github
    User git

Host work-server
    HostName 203.0.113.10
    IdentityFile ~/.ssh/id_rsa_work
    User deploy
\`\`\`

### The Role of ssh-agent
To avoid typing your passphrase every time, use \`ssh-agent\`. It holds your decrypted private keys in memory for the duration of your session.

\`\`\`bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
\`\`\`

### Security Best Practices
- **Passphrase Protection**: Always encrypt your private key with a strong passphrase.
- **Key Rotation**: Periodically generate new keys and remove old ones from \`authorized_keys\`.
- **Minimum Key Sizes**: Never use RSA keys smaller than 2048 bits; 1024-bit RSA is considered broken.
- **Deprecated Algorithms**: DSA (\`ssh-dss\`) is completely deprecated and disabled in modern OpenSSH versions.

Generate your keypairs securely in-browser using our [SSH Key Generator](/tools/ssh-key-generator).

To learn more about secure credential management, check out our [Password Hashing Guide](/blog/password-hashing-bcrypt-argon2).
`,
  },
  {
    slug: "base64-inspector-guide",
    title: "Understanding Base64: Encoding, Decoding, and Binary Data",
    seoTitle: "Base64 Encoding & Decoding Guide - How it Works",
    description: "Learn how Base64 encoding works under the hood. Understand how to safely transmit binary data (images, tokens, certs) as ASCII text over the web.",
    seoDescription: "A developer's guide to Base64 encoding. Understand how to convert binary to ASCII, inspect hex dumps, and safely transmit images, tokens, and payloads.",
    publishedAt: "2026-09-01T12:00:00Z",
    updatedAt: "2026-09-01T12:00:00Z",
    category: "Data & Serialization",
    type: "guide",
    difficulty: "Beginner",
    readTime: "5 min read",
    tags: ["Base64", "Encoding", "Hex", "Data", "Binary"],
    relatedToolSlug: "base64-inspector",
    relatedGuideSlugs: ["jwt-token-decode-guide", "uuid-v4-v5-v7-explained"],
    content: `
## What is Base64 Encoding?
Base64 is a binary-to-text encoding scheme. Its primary purpose is to convert arbitrary binary data (like images, compiled binaries, or encrypted payloads) into a safe ASCII string. This ensures that the data survives transmission over protocols designed to handle only text, such as HTTP, SMTP (email), or JSON payloads, without unintended modifications or corruption.

### The Base64 Alphabet and Padding
Standard Base64 uses a 64-character alphabet:
- \`A-Z\` (26 characters)
- \`a-z\` (26 characters)
- \`0-9\` (10 characters)
- \`+\` and \`/\` (2 characters)

Because 64 is $2^6$, each Base64 character represents exactly 6 bits of data. Since standard bytes are 8 bits, Base64 processes data in 3-byte blocks (24 bits), mapping them to 4 Base64 characters ($4 \\times 6 = 24$ bits). 

If the input data isn't a multiple of 3 bytes, padding characters (\`=\`) are added to the end of the encoded string to complete the final 4-character block.

### Step-by-Step Encoding Example
Let's convert the word "Man" to Base64:

1. **ASCII Values**: 'M' (77), 'a' (97), 'n' (110)
2. **Binary**: \`01001101\` \`01100001\` \`01101110\` (24 bits total)
3. **Split into 6-bit blocks**: \`010011\` \`010110\` \`000101\` \`101110\`
4. **Decimal Values**: 19, 22, 5, 46
5. **Base64 Lookup**: \`T\`, \`W\`, \`F\`, \`u\`

Result: \`TWFu\`

### Base64 vs Base64URL
Standard Base64 includes \`+\` and \`/\`, which have special meanings in URLs and file paths. **Base64URL** encoding replaces \`+\` with \`-\` (minus) and \`/\` with \`_\` (underscore), and typically omits the \`=\` padding. This makes the string safe to use in URLs without URL-encoding.

### Common Uses of Base64
- **Data URIs**: Embedding small images directly in CSS or HTML (\`data:image/png;base64,...\`).
- **JWT Tokens**: The header and payload of a JSON Web Token are Base64URL encoded.
- **Cryptography**: Storing PEM certificates and cryptographic keys as text.
- **Basic Auth**: HTTP Basic Authentication transmits credentials as Base64.

### Code Examples

**JavaScript:**
\`\`\`javascript
// Browser
const encoded = btoa("Hello World"); // "SGVsbG8gV29ybGQ="
const decoded = atob(encoded); // "Hello World"

// Node.js (for binary data)
const buffer = Buffer.from("Hello World");
console.log(buffer.toString('base64'));
\`\`\`

**Python:**
\`\`\`python
import base64
encoded = base64.b64encode(b"Hello World")
print(encoded.decode('utf-8'))
\`\`\`

**Bash:**
\`\`\`bash
echo -n "Hello World" | base64
\`\`\`

### Base64 Variants
| Variant | Alphabet 62/63 | Padding | Primary Use |
|---------|----------------|---------|-------------|
| **Standard** | \`+\` and \`/\` | Yes (\`=\`) | General purpose, PEM, SMTP |
| **URL-Safe** | \`-\` and \`_\` | Optional | JWTs, URL parameters |
| **MIME** | \`+\` and \`/\` | Yes (\`=\`) | Email attachments (lines wrapped at 76 chars) |

### Hex Dumps and Inspection
When dealing with complex Base64 data (like a serialized binary object), decoding it to text yields unreadable characters. Inspecting the decoded data as a **Hex Dump** (hexadecimal values paired with ASCII representations) helps you understand the underlying binary structure.

### Performance Considerations
Base64 increases the size of data by roughly 33%. While embedding a small icon as a Base64 Data URI saves an HTTP request, embedding a 2MB image will bloat your HTML and block rendering. Use Base64 judiciously for small payloads.

Analyze and decode payloads visually using our [Base64 Inspector](/tools/base64-inspector).

Learn more about how Base64 applies to authentication in our [JWT Token Guide](/blog/jwt-token-decode-guide).
`,
  },
  {
    slug: "json-formatter-privacy-backed-developer-tools",
    title: "JSON Formatter: Privacy Backed & 100% Client-Side Developer Tools",
    seoTitle: "JSON Formatter - Privacy Backed Developer Tools | DevScratchpad",
    description: "Learn why a privacy-backed JSON formatter is essential for developers. 100% client-side, zero server transmission formatting for sensitive API payloads.",
    seoDescription: "Secure JSON formatter for developers. Privacy backed, 100% client-side, zero server transmission. Formatting sensitive API payloads offline on DevScratchpad.",
    publishedAt: "2026-09-02T12:00:00Z",
    updatedAt: "2026-09-02T12:00:00Z",
    category: "Data & Serialization",
    type: "cookbook",
    difficulty: "Beginner",
    readTime: "4 min read",
    tags: ["JSON", "Client-Side", "Privacy", "Formatters"],
    relatedToolSlug: "json-formatter",
    relatedGuideSlugs: ["yaml-to-json-conversion-developers", "json-to-typescript-zod-schema-guide"],
    content: `
## What is JSON?

JavaScript Object Notation (JSON) is a lightweight data-interchange format that is easy for humans to read and write, and easy for machines to parse and generate. It has become the de facto standard for exchanging data on the web, displacing older formats like XML. You will encounter JSON in:

- **REST APIs**: As the standard payload format for request and response bodies.
- **Configuration Files**: Such as \`package.json\`, \`tsconfig.json\`, and VS Code settings.
- **Data Storage**: In NoSQL databases like MongoDB or PostgreSQL's JSONB columns.

---

## JSON Syntax Rules

JSON is built on two structures:
1. A collection of name/value pairs (an **object**)
2. An ordered list of values (an **array**)

### Data Types

| Type | Description | Example |
|---|---|---|
| **String** | Sequence of Unicode characters wrapped in double quotes | \`"hello"\` |
| **Number** | Integer or floating point (no NaN or Infinity) | \`42\`, \`-3.14\` |
| **Object** | Unordered collection of key/value pairs wrapped in \`{}\` | \`{"key": "value"}\` |
| **Array** | Ordered list of values wrapped in \`[]\` | \`[1, 2, 3]\` |
| **Boolean** | True or false | \`true\`, \`false\` |
| **Null** | Empty value | \`null\` |

### Common Syntax Errors

Unlike JavaScript object literals, JSON is incredibly strict. Common pitfalls include:

- **Trailing Commas**: Not allowed. \`[1, 2,]\` is invalid JSON.
- **Single Quotes**: Keys and string values MUST use double quotes. \`'key': 'value'\` is invalid.
- **Unquoted Keys**: Keys MUST be quoted. \`{key: "value"}\` is invalid.
- **Comments**: JSON does not support comments natively (though tools like \`tsconfig.json\` parsers sometimes strip them out before parsing).

---

## Pretty-Printing vs Minification

JSON data is often sent over the wire in a **minified** format (all unnecessary whitespace removed) to save bandwidth. However, for debugging and reading, developers need **pretty-printed** JSON (formatted with indentation and line breaks).

### Code Examples: Formatting JSON

**JavaScript:**
\`\`\`javascript
const data = { id: 1, name: "Alice", active: true };
// Format with 2 spaces of indentation
const formatted = JSON.stringify(data, null, 2);
console.log(formatted);
\`\`\`

**Python:**
\`\`\`python
import json

data = {"id": 1, "name": "Alice", "active": True}
# Format with 4 spaces of indentation
formatted = json.dumps(data, indent=4)
print(formatted)
\`\`\`

**Bash (using jq):**
\`\`\`bash
# Pretty-print a minified JSON file
cat data.json | jq .
\`\`\`

---

## AST-Based Formatting vs Regex

Formatting JSON using an Abstract Syntax Tree (AST) parser is far more reliable than using regular expressions. An AST parser actually understands the structure of the data, ensuring it doesn't accidentally format string contents that happen to look like JSON, or break when encountering escaped quotes.

## Validation vs Schema Checking

**Validating** JSON simply means checking if the string conforms to the JSON syntax rules (e.g., using \`JSON.parse()\`).

**Schema Checking** involves validating that the JSON data conforms to a specific structure (e.g., ensuring a user object has an \`id\` field of type number). This is typically done using tools like [JSON Schema](https://json-schema.org/) or Zod. 

For more on typing JSON data, check out our [JSON to TypeScript/Zod Guide](/blog/json-to-typescript-zod-schema-guide).

---

## Working with Large JSON Files

When dealing with massive JSON payloads (e.g., gigabytes in size), loading the entire string into memory with \`JSON.parse()\` will crash your application. Instead, use:

- **Streaming Parsers**: Libraries like \`Oboe.js\` (JavaScript) or \`ijson\` (Python) read the file chunk by chunk.
- **jq Filters**: The command-line tool \`jq\` can filter and extract data from large JSON streams efficiently.

Need to format a payload right now? Use our [JSON Formatter](/tools/json-formatter).
`,
  },
  {
    slug: "yaml-to-json-conversion-developers",
    title: "YAML to JSON Conversion for Modern Cloud Developers",
    seoTitle: "YAML to JSON Converter - Developer Tools & Scratch Pad",
    description: "Deep dive into YAML and JSON data structures, and how developers can securely convert between them using a zero server transmission scratch pad.",
    seoDescription: "Convert YAML to JSON securely with our 100% offline developer tools. DevScratchpad provides privacy backed converters for Kubernetes and Cloud engineers.",
    publishedAt: "2026-09-02T13:00:00Z",
    updatedAt: "2026-09-02T13:00:00Z",
    category: "Data & Serialization",
    type: "guide",
    difficulty: "Beginner",
    readTime: "5 min read",
    tags: ["YAML", "JSON", "Kubernetes", "DevOps", "Cloud"],
    relatedToolSlug: "yaml",
    relatedGuideSlugs: ["json-formatter-privacy-backed-developer-tools", "cron-expression-cheat-sheet"],
    content: `
## YAML vs JSON: The Key Differences

While JSON is perfect for machine-to-machine communication, YAML (YAML Ain't Markup Language) was designed specifically for human readability. It is the dominant format for infrastructure as code, CI/CD pipelines, and configuration files.

| Feature | YAML | JSON |
|---|---|---|
| **Syntax** | Indentation-based (like Python) | Braces and brackets (like C) |
| **Comments** | Supported (\`#\`) | Not supported |
| **Multi-line Strings**| Built-in (using \`|\` or \`>\`) | Must use \`\\n\` escapes |
| **Types** | Implicit typing, rich types | Explicit typing, basic types only |
| **References** | Anchors and Aliases | None (requires duplication) |

---

## YAML Syntax Deep Dive

YAML relies on spaces (never tabs!) for indentation.

### Scalars, Sequences, and Mappings

- **Scalars**: Basic values like strings, numbers, and booleans.
- **Sequences** (Arrays): Denoted by a dash \`-\` followed by a space.
- **Mappings** (Objects): Denoted by a colon \`:\` followed by a space.

\`\`\`yaml
# Mapping
person:
  # Sequence
  skills:
    - DevOps
    - Cloud
  # Scalars
  active: true
  age: 30
\`\`\`

---

## Advanced YAML Features

YAML's superpower is its ability to reduce duplication using anchors, aliases, and merge keys. When converting to JSON, these references are fully resolved and expanded.

- **Anchors (\`&\`)**: Define a block of data to reuse.
- **Aliases (\`*\`)**: Reference an anchor.
- **Merge Keys (\`<<\`)**: Insert all keys from an anchored mapping.

\`\`\`yaml
base_config: &base
  environment: production
  timeout: 30

service_a:
  <<: *base
  name: "auth-service"
\`\`\`

*Converts to JSON:*
\`\`\`json
{
  "base_config": {
    "environment": "production",
    "timeout": 30
  },
  "service_a": {
    "environment": "production",
    "timeout": 30,
    "name": "auth-service"
  }
}
\`\`\`

---

## Block Scalars: Handling Multi-line Strings

YAML provides elegant ways to handle long text blocks, which JSON struggles with.

- **Literal Style (\`|\`)**: Preserves newlines precisely. Great for embedded scripts or certificates.
- **Folded Style (\`>\`)**: Folds newlines into spaces. Great for long paragraphs of text.

You can also use chomp modifiers (\`+\` to keep trailing newlines, \`-\` to strip them).

---

## Common YAML Pitfalls

YAML's implicit typing can sometimes backfire:

1. **The Norway Problem**: Unquoted strings like \`NO\` or \`yes\` are automatically cast to booleans (\`false\` and \`true\`). Always quote strings that might be misinterpreted!
2. **Tabs vs Spaces**: YAML strictly forbids tabs for indentation. A single stray tab will break the parser.

---

## YAML in Practice: Kubernetes

Kubernetes manifests heavily leverage YAML, including the multi-document separator (\`---\`), which allows multiple configurations in a single file.

\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  replicas: 3
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.14.2
---
apiVersion: v1
kind: Service
metadata:
  name: nginx-service
spec:
  selector:
    app: nginx
\`\`\`
*(Note: Multi-document files must be parsed into an array of JSON objects when converted).*

Need to convert configurations? Try our [YAML Converter](/tools/yaml).
Also check out our [Cron Expression Cheat Sheet](/blog/cron-expression-cheat-sheet) for scheduling your Kubernetes CronJobs!

### Code Examples: Converting YAML to JSON

**Python (using PyYAML):**
\`\`\`python
import yaml, json

with open("config.yaml", "r") as file:
    data = yaml.safe_load(file)
    print(json.dumps(data, indent=2))
\`\`\`

**JavaScript (using js-yaml):**
\`\`\`javascript
const yaml = require('js-yaml');
const fs = require('fs');

const doc = yaml.load(fs.readFileSync('config.yaml', 'utf8'));
console.log(JSON.stringify(doc, null, 2));
\`\`\`
`,
  },
  {
    slug: "curl-to-go-javascript-python-code-generators",
    title: "Translating cURL to Go, Fetch, and Python Requests",
    seoTitle: "cURL to Go & Python - 100% Client-Side Developer Tools",
    description: "Learn how to instantly translate bash cURL commands into production-ready Go, JavaScript, and Python code using offline developer tools.",
    seoDescription: "Translate cURL to Go, Fetch, and Python instantly. 100% offline, privacy backed code generation developer tools by DevScratchpad.",
    publishedAt: "2026-09-02T14:00:00Z",
    updatedAt: "2026-09-02T14:00:00Z",
    category: "API & Automation",
    type: "cookbook",
    difficulty: "Intermediate",
    readTime: "5 min read",
    tags: ["cURL", "Go", "Python", "JavaScript", "API"],
    relatedToolSlug: "curl-to-go",
    relatedGuideSlugs: ["convert-curl-to-python", "convert-curl-to-fetch-axios"],
    content: `
## Why Translate cURL?

cURL is the universal language of API documentation. Almost every API provider gives examples as cURL commands because they run universally in bash terminals. 

However, the workflow doesn't stop in the terminal. Once you've verified an endpoint works, you need to embed that logic into your application. Translating complex cURL flags into HTTP library code manually is tedious and prone to syntax errors.

---

## Anatomy of a cURL Command

Understanding the flags is the first step to translating them:

| Flag | Meaning | Example |
|---|---|---|
| \`-X\` / \`--request\` | The HTTP method | \`-X POST\` |
| \`-H\` / \`--header\` | Custom headers (auth, content-type) | \`-H "Content-Type: application/json"\` |
| \`-d\` / \`--data\` | Request body payload | \`-d '{"key":"value"}'\` |
| \`-b\` / \`--cookie\` | Send cookies | \`-b "session=123"\` |
| \`-u\` / \`--user\` | Basic Authentication | \`-u "username:password"\` |
| \`-k\` / \`--insecure\` | Skip TLS/SSL verification | \`-k\` |

---

## Code Generation Patterns

### cURL to Go (\`net/http\`)

Go's standard library is powerful but verbose. A simple POST request requires creating a reader, building the request, executing it, and explicitly handling errors.

\`\`\`go
package main

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
)

func main() {
	jsonData := []byte(\`{"title":"foo","body":"bar","userId":1}\`)
	req, _ := http.NewRequest("POST", "https://jsonplaceholder.typicode.com/posts", bytes.NewBuffer(jsonData))
	
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer YOUR_TOKEN")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Println(string(body))
}
\`\`\`

### cURL to JavaScript (Fetch vs Axios)

In the browser or modern Node.js environments, \`fetch()\` is the standard. However, many developers still prefer Axios for its automatic JSON parsing and robust error handling.

**Using Fetch:**
\`\`\`javascript
const response = await fetch("https://api.example.com/data", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_TOKEN"
  },
  body: JSON.stringify({ key: "value" })
});

if (!response.ok) throw new Error("Network response was not ok");
const data = await response.json();
\`\`\`

### cURL to Python (\`requests\`)

Python's \`requests\` library abstracts away the complexity of HTTP calls into an incredibly readable API.

\`\`\`python
import requests

url = "https://api.example.com/data"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_TOKEN"
}
payload = {"key": "value"}

response = requests.post(url, json=payload, headers=headers)
response.raise_for_status() # Raises an exception for 4XX/5XX errors

print(response.json())
\`\`\`

---

## Handling Authentication Across Languages

Authentication patterns vary slightly:
- **Bearer Tokens**: Universally passed via the \`Authorization: Bearer <token>\` header.
- **Basic Auth**: While you can manually encode credentials as Base64, libraries usually offer helpers (e.g., the \`auth=(user, pass)\` tuple in Python \`requests\`, or \`req.SetBasicAuth(user, pass)\` in Go).

## File Uploads (Multipart Form Data)

Translating a cURL \`-F "file=@/path/to/file"\` requires careful handling:
- **Go**: Requires the \`mime/multipart\` package to construct the form boundary.
- **JavaScript**: Use the \`FormData\` object. Do *not* manually set the \`Content-Type\` header; let the browser generate it with the boundary!
- **Python**: Pass a dictionary to the \`files\` parameter in \`requests.post()\`.

Need to translate a command right now? Use our offline code generators: 
[cURL to Go](/tools/curl-to-go)
[cURL to Python](/tools/curl-to-python)
[cURL to Fetch](/tools/curl-to-fetch)

Explore more in our specific language guides: [cURL to Python Deep Dive](/blog/convert-curl-to-python) and [cURL to Fetch/Axios](/blog/convert-curl-to-fetch-axios).
`,
  },
  {
    slug: "claude-code-skills-cursor-rules-guide",
    title: "The Complete Guide to Claude Code Skills (SKILL.md), Cursor Rules (.mdc), and CLAUDE.md (2026)",
    seoTitle: "Claude Code Skills (SKILL.md) & Cursor Rules Guide 2026",
    description: "An exhaustive technical guide to modern AI agent steering: Claude Code skills (SKILL.md), Cursor modular rules (.mdc), project-root CLAUDE.md, and multi-agent AGENTS.md.",
    seoDescription: "Master Claude Code skills (SKILL.md), Cursor .mdc rules, and CLAUDE.md architecture. Learn YAML frontmatter specs, glob scoping, and 100% private skill generation.",
    publishedAt: "2026-09-04T00:00:00Z",
    updatedAt: "2026-09-04T00:00:00Z",
    category: "API & Automation",
    type: "guide",
    difficulty: "Intermediate",
    readTime: "8 min read",
    tags: ["Claude Code", "Cursor", "AI Agent Skills", "SKILL.md", "CLAUDE.md", "Cursor Rules", "MDC", "AGENTS.md"],
    relatedToolSlug: "json-formatter",
    relatedGuideSlugs: ["cron-expression-cheat-sheet", "jwt-token-decode-guide"],
    faqs: [
      {
        question: "Where should SKILL.md files be stored in a project?",
        answer: "In Claude Code, project-specific skills reside in `.claude/skills/<skill-name>/SKILL.md`. For skills shared globally across all terminal sessions on your machine, place them in `~/.claude/skills/<skill-name>/SKILL.md`."
      },
      {
        question: "Why did Cursor migrate from .cursorrules to .cursor/rules/*.mdc?",
        answer: "A single monolithic .cursorrules file was loaded on every single prompt, consuming massive context token counts. Modern .mdc rules use YAML frontmatter with file glob arrays (e.g. globs: ['**/*.tsx']) and alwaysApply: false, loading only when matching files are edited."
      },
      {
        question: "Can I generate Claude skills and Cursor rules offline?",
        answer: "Yes. DevScratchpad's AI Skill Studio executes 100% in browser memory with zero server data transmission, zero telemetry, and zero API key requirements."
      }
    ],
    content: `
AI coding companions have evolved from simple auto-complete widgets into autonomous reasoning agents capable of planning complex refactors, navigating monorepos, and running terminal commands. However, without strict behavioral guardrails and project context, agents frequently introduce architectural drift, loose typings, and unnecessary diffs.

This definitive guide covers how to standardize and author the four primary AI steering formats in 2026:
1. **Claude Code Skills (\`SKILL.md\`)**
2. **Cursor Modular Rules (\`.cursor/rules/*.mdc\`)**
3. **Project-Root Guidelines (\`CLAUDE.md\`)**
4. **Multi-Agent Protocol Directives (\`AGENTS.md\`)**

> **Quick Tool**: Need to scaffold these configurations for your stack in seconds? Launch our 100% client-side [AI Skill Studio](/ai-skill-studio) to visually build and export a complete AI configuration kit.

---

## 1. Claude Code Skills (\`SKILL.md\`)

Claude Code (Anthropic's terminal agent) introduces **Skills**—reusable, modular instruction packages that provide procedural expertise on demand.

### Anatomy of a \`SKILL.md\`
A valid \`SKILL.md\` must begin with strict YAML frontmatter:

\`\`\`yaml
---
name: security-auditor
description: Audit TypeScript & Python codebases for CVEs, exposed secrets, and unhandled promise rejections.
---
\`\`\`

### Directory Placement
- **Project Scope**: \`.claude/skills/<skill-name>/SKILL.md\` (committed to Git, shared with team).
- **Global Scope**: \`~/.claude/skills/<skill-name>/SKILL.md\` (available across all local repositories).

### How Claude Code Executes Skills
Claude Code indexes the frontmatter during session startup. When a developer's prompt matches the skill's description—or when called via a slash command like \`/security-auditor\`—the agent injects the full markdown instructions into the active context window.

---

## 2. Cursor Modular Rules (\`.cursor/rules/*.mdc\`)

Cursor has officially deprecated the monolithic \`.cursorrules\` file in favor of modular \`.mdc\` rulebooks located in \`.cursor/rules/\`.

### Why the Shift to Modular \`.mdc\`?
In large codebases, feeding a 500-line general rulebook into every prompt wastes valuable context window tokens and dilutes model attention. With \`.mdc\`, rules attach conditionally based on file globs.

### Structure of an \`.mdc\` Rule
\`\`\`markdown
---
description: Next.js 15 App Router & Server Actions standards
globs: ["src/app/**/*.tsx", "src/actions/**/*.ts"]
alwaysApply: false
---

# Next.js 15 Standards
- Enforce React Server Components (RSC) by default.
- Only introduce 'use client' at leaf interactive components.
- Validate all Server Action inputs with Zod schemas.
\`\`\`

---

## 3. Anthropic Project Root Guidelines (\`CLAUDE.md\`)

Located at the repository root, \`CLAUDE.md\` acts as the foundational constitution for Claude sessions. Anthropic recommends using structured XML tags to maximize parsing efficiency:

\`\`\`markdown
# Project Guidelines

<project_context>
High-throughput event streaming backend built with Node.js 22, TypeScript 5.8, and Apache Kafka.
</project_context>

<tech_stack>
- Language: TypeScript (strict mode enabled)
- Framework: Fastify
- ORM: Prisma with PostgreSQL
</tech_stack>

<workflows_and_procedures>
1. Run 'npm test' before reporting completion.
2. Deliver surgical, focused git diffs.
3. Never introduce 'any' types or ignore TypeScript warnings.
</workflows_and_procedures>
\`\`\`

---

## 4. Multi-Agent Systems (\`AGENTS.md\`)

For teams utilizing multi-agent orchestration frameworks (such as Google Antigravity, CrewAI, or AutoGen), \`AGENTS.md\` establishes role boundaries and handover protocols:

\`\`\`markdown
<!-- BEGIN:agent-rules -->
# AI Agent Directives

## Architect Agent
- Responsible for technical specifications and database schema design.
- Prohibits writing application code directly.

## Implementation Agent
- Translates Architect specifications into typed modules.
- Enforces unit test coverage exceeding 90%.
<!-- END:agent-rules -->
\`\`\`

---

## 5. Automated Generation with AI Skill Studio

Rather than manually handcrafting these four configuration files for each repository, you can use [AI Skill Studio](/ai-skill-studio):

1. **Manifest Ingestion**: Drag & drop your \`package.json\`, \`Cargo.toml\`, \`pyproject.toml\`, or \`go.mod\`. The engine automatically detects your framework, ORM, and conventions.
2. **Behavioral Guardrails**: Toggle surgical diffs, guard clauses, strict accessibility, and type-safety rules.
3. **One-Click Export**: Download a unified \`.zip\` suite containing \`.cursor/rules/\`, \`.claude/skills/\`, \`CLAUDE.md\`, and \`AGENTS.md\` ready to commit to your repository.
4. **100% Client-Side Privacy**: Runs completely in browser memory with zero server uploads and zero API keys.

Launch the studio now: [https://www.devscratchpad.tech/ai-skill-studio](/ai-skill-studio).
`,
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export const BLOG_SLUGS = BLOG_POSTS.map((p) => p.slug);
