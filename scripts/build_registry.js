const fs = require('fs');
const path = require('path');

const recipes = [
  {
    slug: 'typeerror-cannot-read-properties-of-undefined-reading-map',
    targetToolSlug: 'json-to-ts',
    title: 'Fix "TypeError: Cannot read properties of undefined (reading \'map\')" when parsing API JSON',
    seoTitle: 'Fix TypeError reading map from JSON API Response',
    seoDescription: 'Troubleshoot and fix the common TypeError reading map from undefined in React/TypeScript when working with un-typed JSON API responses.',
    problem: 'When fetching data from an API, you are mapping over an array that doesn\'t exist or is undefined because the API response structure doesn\'t match your expectations or lacks type safety.',
    solution: 'Convert your API\'s raw JSON response into a strict TypeScript interface. This allows you to catch missing properties at compile time rather than crashing at runtime.',
    codeSnippet: `// ❌ Bad: Untyped response\nconst data = await fetch('/api/users').then(res => res.json());\ndata.users.map(...) // Crashes if users is undefined\n\n// ✅ Good: Typed response\ninterface ApiResponse {\n  users: Array<{ id: string; name: string; }>;\n}\nconst data = await fetch('/api/users').then(res => res.json()) as ApiResponse;\n(data.users || []).map(...)`,
    faq: [
      { question: 'Why does map() crash on API data?', answer: 'The API returned undefined or an object instead of an array, usually because the endpoint changed or the fetch failed silently.' },
      { question: 'How do I automatically type JSON?', answer: 'Use our JSON to TypeScript converter. Paste your JSON payload and get ready-to-use TypeScript interfaces.' }
    ]
  },
  {
    slug: 'invalid-signature-jwt-error',
    targetToolSlug: 'jwt',
    title: 'Debug "JsonWebTokenError: invalid signature" in Node.js',
    seoTitle: 'Fix JsonWebTokenError invalid signature in JWT',
    seoDescription: 'Learn how to debug and fix the invalid signature error when verifying JSON Web Tokens (JWT) in your backend.',
    problem: 'Your server is rejecting a JWT with "invalid signature". This happens when the token was tampered with, the secret key mismatches, or the signing algorithm differs.',
    solution: 'Decode the token header and payload to verify the algorithm used (`HS256`, `RS256`). Check if the payload data matches your expectations before verifying the signature locally.',
    codeSnippet: `// ❌ Bad: Blindly verifying\nconst decoded = jwt.verify(token, process.env.SECRET);\n\n// ✅ Good: Check token structure first\nconst decoded = jwt.decode(token, { complete: true });\nconsole.log(decoded.header.alg); // e.g., 'RS256'`,
    faq: [
      { question: 'What does invalid signature mean?', answer: 'It means the hash of the payload and header does not match the signature provided, usually due to a wrong secret key.' },
      { question: 'Can I decode a token without the secret?', answer: 'Yes! The header and payload of a JWT are just Base64Url encoded. You can view them using our JWT Decoder tool.' }
    ]
  },
  {
    slug: 'curl-52-empty-reply-from-server',
    targetToolSlug: 'curl-to-python',
    title: 'Fix "curl: (52) Empty reply from server" when sending requests',
    seoTitle: 'Resolve curl Error 52 Empty reply from server',
    seoDescription: 'Troubleshoot curl error 52 and migrate your complex curl commands to Python requests for better error handling.',
    problem: 'You are running a curl command and receiving "Empty reply from server". This typically means the connection was established but the server dropped it without sending any HTTP response headers.',
    solution: 'Instead of wrestling with opaque curl network errors in bash, convert your request to a Python script using the `requests` library. Python provides detailed traceback and easier debugging for dropped connections.',
    codeSnippet: `// ❌ Bad: Hard to debug curl error\n$ curl -X POST https://api.example.com/data -d "foo=bar"\ncurl: (52) Empty reply from server\n\n// ✅ Good: Python equivalent with error handling\nimport requests\ntry:\n    response = requests.post('https://api.example.com/data', data={'foo': 'bar'})\n    response.raise_for_status()\nexcept requests.exceptions.ConnectionError as e:\n    print(f"Connection dropped: {e}")`,
    faq: [
      { question: 'Why does the server drop the connection?', answer: 'Common reasons include SSL/TLS mismatch, firewall blocking, or the server crashing while processing the request.' },
      { question: 'How can I easily convert curl to Python?', answer: 'Use our cURL to Python tool to instantly generate valid requests code from any curl command.' }
    ]
  },
  {
    slug: 'unexpected-token-o-in-json-at-position-1',
    targetToolSlug: 'json-formatter',
    title: 'Fix "SyntaxError: Unexpected token o in JSON at position 1"',
    seoTitle: 'Fix SyntaxError Unexpected token o in JSON',
    seoDescription: 'Understand and fix the common JavaScript error when calling JSON.parse() on an object instead of a string.',
    problem: 'You are seeing `SyntaxError: Unexpected token o in JSON at position 1`. This happens when you call `JSON.parse()` on something that is already a JavaScript object (which gets coerced to the string `"[object Object]"`).',
    solution: 'Check if your data is already parsed. If you are using `axios` or `fetch` with `.json()`, the response is already an object. Only use `JSON.parse()` on raw string data.',
    codeSnippet: `// ❌ Bad: Parsing an already parsed object\nconst data = { name: "John" };\nconst parsed = JSON.parse(data); // Unexpected token o\n\n// ✅ Good: Check type or rely on fetch's built-in parsing\nconst res = await fetch('/api/data');\nconst json = await res.json(); // json is already an object!`,
    faq: [
      { question: 'Why does it say position 1?', answer: 'Because it converts the object to the string "[object Object]". The first character is "[", the second (position 1) is "o". JSON expects quotes.' },
      { question: 'How can I validate my JSON string?', answer: 'Use our JSON Formatter to paste your string and ensure it is valid JSON before parsing.' }
    ]
  },
  {
    slug: 'yaml-mapping-values-are-not-allowed-here',
    targetToolSlug: 'yaml',
    title: 'Fix "mapping values are not allowed here" in YAML configs',
    seoTitle: 'Fix mapping values are not allowed here YAML error',
    seoDescription: 'Solve YAML indentation and syntax errors causing the mapping values are not allowed here exception.',
    problem: 'Your CI/CD pipeline or Docker Compose is failing with `mapping values are not allowed here`. This usually means a colon `:` is missing a space after it, or your indentation is incorrect.',
    solution: 'YAML is strictly whitespace dependent. Ensure that every key-value pair has a space after the colon, and that block sequences use consistent spaces (not tabs). Converting your YAML to JSON can highlight structural flaws.',
    codeSnippet: `// ❌ Bad: Missing space after colon\nservices:\n  web:\n    image:nginx\n    ports:\n      - 80:80\n\n// ✅ Good: Correct spacing and indentation\nservices:\n  web:\n    image: nginx\n    ports:\n      - "80:80"`,
    faq: [
      { question: 'Can I use tabs in YAML?', answer: 'No, the YAML specification forbids tabs for indentation. Always use spaces.' },
      { question: 'How do I debug complex YAML?', answer: 'Convert it to JSON using our YAML to JSON converter. JSON is stricter and tooling will immediately flag structural issues.' }
    ]
  },
  {
    slug: 'cron-not-running-at-expected-time',
    targetToolSlug: 'cron',
    title: 'Debug cron job not running at the scheduled time',
    seoTitle: 'Debug cron job not running at expected time',
    seoDescription: 'Figure out why your cron expression is firing at the wrong time or not firing at all using visual cron schedule parsing.',
    problem: 'You set up a background task, but it triggers at midnight instead of noon, or runs every minute instead of once an hour. Cron syntax (`* * * * *`) is notoriously easy to misconfigure.',
    solution: 'Visualize your cron expression to see the exact upcoming run times. A common mistake is using `*` for minutes when you meant `0` (e.g., `* 12 * * *` runs every minute of the 12th hour, while `0 12 * * *` runs exactly at noon).',
    codeSnippet: `// ❌ Bad: Runs every minute during 12 PM\n* 12 * * * /path/to/script.sh\n\n// ✅ Good: Runs exactly once at 12:00 PM\n0 12 * * * /path/to/script.sh`,
    faq: [
      { question: 'Does cron respect my server time zone?', answer: 'Yes, cron uses the system time zone by default. If your server is UTC, a job scheduled for 12:00 will run at 12:00 UTC.' },
      { question: 'How can I test my cron expression?', answer: 'Use our Cron Schedule Visualizer to generate a human-readable list of the next 10 execution times.' }
    ]
  },
  {
    slug: 'zoderror-invalid-type-expected-string-received-number',
    targetToolSlug: 'json-to-zod',
    title: 'Fix "ZodError: Expected string, received number" in API validation',
    seoTitle: 'Fix ZodError expected string received number',
    seoDescription: 'Solve runtime Zod schema validation errors when parsing API payloads that contain unexpected types.',
    problem: 'Your application crashes at runtime when calling `schema.parse()` because an API returned a number (like `123`) instead of a string (like `"123"`), breaking your strict Zod schema.',
    solution: 'If the API is inconsistent, update your Zod schema to coerce the type using `z.coerce.string()` or strictly match the API\'s actual JSON structure by regenerating your schema directly from the API response payload.',
    codeSnippet: `// ❌ Bad: Strict schema crashes on number\nconst schema = z.object({ id: z.string() });\nschema.parse({ id: 123 }); // Throws ZodError\n\n// ✅ Good: Coerce types or use accurate schemas\nconst schema = z.object({ id: z.coerce.string() });\nschema.parse({ id: 123 }); // Returns { id: "123" }`,
    faq: [
      { question: 'Why use Zod over TypeScript interfaces?', answer: 'TypeScript interfaces are stripped out at compile time. Zod validates data at runtime, preventing bad data from entering your app.' },
      { question: 'How do I create a Zod schema from a large JSON?', answer: 'Use our JSON to Zod Schema tool to instantly generate complete, nested validation schemas from any JSON payload.' }
    ]
  },
  {
    slug: 'curl-3-url-using-bad-slash',
    targetToolSlug: 'curl-to-fetch',
    title: 'Fix "curl: (3) URL using bad/illegal format or missing URL"',
    seoTitle: 'Fix curl Error 3 URL using bad slash or missing',
    seoDescription: 'Solve curl syntax issues with quotes and slashes, and migrate to JavaScript fetch for better API integration.',
    problem: 'When pasting a curl command into Windows CMD or PowerShell, you get an illegal format error. This happens because Windows handles quotes (\' vs "") and escaping differently than Unix shells.',
    solution: 'Instead of struggling with cross-platform shell escaping, convert the curl command directly into a JavaScript `fetch()` call. This allows you to run it natively in Node.js or the browser without worrying about bash syntax.',
    codeSnippet: `// ❌ Bad: Fails in Windows PowerShell\ncurl -X POST 'https://api.com/data' -H 'Content-Type: application/json' -d '{"key":"value"}'\n\n// ✅ Good: Converted to JS fetch\nfetch('https://api.com/data', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({ key: "value" })\n});`,
    faq: [
      { question: 'Why do single quotes fail in Windows curl?', answer: 'Windows Command Prompt (cmd.exe) does not treat single quotes as string delimiters. You must use double quotes and escape internal quotes.' },
      { question: 'How can I convert complex curl commands to fetch?', answer: 'Use our cURL to Fetch tool to automatically generate the equivalent JavaScript code.' }
    ]
  },
  {
    slug: 'invalid-dom-property-class-did-you-mean-classname',
    targetToolSlug: 'svg-to-jsx',
    title: 'Fix "Invalid DOM property \`class\`. Did you mean \`className\`?" in React',
    seoTitle: 'Fix Invalid DOM property class in React SVGs',
    seoDescription: 'Resolve React console warnings when pasting raw SVG code directly into your JSX components.',
    problem: 'You copied an SVG from Figma or Illustrator and pasted it into a React component. The console is filled with warnings about \`class\`, \`stroke-width\`, and \`fill-rule\` being invalid DOM properties.',
    solution: 'React requires camelCase property names for DOM elements (e.g., \`strokeWidth\` instead of \`stroke-width\`). You must convert raw HTML/SVG attributes into valid JSX syntax.',
    codeSnippet: `// ❌ Bad: Raw SVG in React\n<svg class="icon" stroke-width="2" fill-rule="evenodd" />\n\n// ✅ Good: Converted to JSX\n<svg className="icon" strokeWidth={2} fillRule="evenodd" />`,
    faq: [
      { question: 'Do I have to rename every property manually?', answer: 'No, you can automate this. Using an SVG to JSX converter handles all camelCasing and tag closures for you.' },
      { question: 'Why does React enforce camelCase?', answer: 'React normalizes DOM attributes to match the standard JavaScript DOM API, which uses camelCase (like \`element.className\`).' }
    ]
  },
  {
    slug: 'hmac-signature-does-not-match',
    targetToolSlug: 'hmac-generator',
    title: 'Debug "HMAC signature does not match" in Webhook verification',
    seoTitle: 'Fix HMAC signature does not match in Webhooks',
    seoDescription: 'Learn how to correctly calculate and verify HMAC SHA-256 signatures for Stripe, GitHub, or Shopify webhooks.',
    problem: 'Your server is rejecting legitimate incoming webhooks because the computed HMAC signature doesn\'t match the one sent in the headers (e.g., \`x-hub-signature-256\`).',
    solution: 'This usually occurs because the request body was parsed or modified (like \`JSON.parse()\`) before hashing. HMAC must be calculated against the raw, unmodified byte stream of the request body.',
    codeSnippet: `// ❌ Bad: Hashing parsed JSON\nconst hash = crypto.createHmac('sha256', secret).update(JSON.stringify(req.body)).digest('hex');\n\n// ✅ Good: Hashing the raw body buffer\nconst hash = crypto.createHmac('sha256', secret).update(req.rawBody).digest('hex');`,
    faq: [
      { question: 'What is req.rawBody?', answer: 'In frameworks like Express, you must configure the body-parser to save the raw buffer before it converts it to a JavaScript object.' },
      { question: 'How can I test my secret key?', answer: 'Use our HMAC Generator to manually hash your raw JSON payload with your secret and compare it to the header.' }
    ]
  },
  {
    slug: 'json-schema-data-must-not-have-additional-properties',
    targetToolSlug: 'json-schema-validator',
    title: 'Fix "data must NOT have additional properties" in JSON Schema',
    seoTitle: 'Fix JSON Schema data must NOT have additional properties',
    seoDescription: 'Learn how to resolve strict validation errors in JSON Schema when payloads contain undocumented fields.',
    problem: 'Your payload validation fails with "data must NOT have additional properties". Your schema enforces `additionalProperties: false`, but the JSON being sent contains extra fields.',
    solution: 'Either remove the extra fields from your JSON payload or set `additionalProperties: true` in your schema definition to allow fields that aren\'t explicitly defined.',
    codeSnippet: `// ❌ Bad: Strict schema rejects extra field\n"additionalProperties": false\n{ "name": "John", "extra": "data" } // Fails validation\n\n// ✅ Good: Allow extra fields\n"additionalProperties": true`,
    faq: [
      { question: 'Is additionalProperties: false secure?', answer: 'Yes, it ensures your application only processes expected data and prevents over-posting attacks.' },
      { question: 'How do I test this schema?', answer: 'Use our JSON Schema Validator to instantly check if your JSON data violates this property.' }
    ]
  },
  {
    slug: 'json-schema-data-must-be-array',
    targetToolSlug: 'json-schema-validator',
    title: 'Fix "data must be array" in JSON Schema',
    seoTitle: 'Fix JSON Schema data must be array error',
    seoDescription: 'Resolve type mismatch errors in JSON Schema where an object is provided instead of an array.',
    problem: 'You are encountering a validation error stating "data must be array". Your JSON data is structured as an object `{}` when the schema expects a list `[]`.',
    solution: 'Wrap your object in an array or modify the schema to accept both types if single items are permitted.',
    codeSnippet: `// ❌ Bad: Sending object when array expected\n{ "item": 1 } \n\n// ✅ Good: Sending an array\n[ { "item": 1 } ]`,
    faq: [
      { question: 'Can a schema accept both object and array?', answer: 'Yes, use `type: ["object", "array"]` or `oneOf` to support both structures.' },
      { question: 'How can I fix the JSON?', answer: 'Use our JSON Formatter and Schema Validator to preview your changes in real time.' }
    ]
  },
  {
    slug: 'xml-entityref-expecting-semicolon',
    targetToolSlug: 'xml-formatter',
    title: 'Fix "EntityRef: expecting \';\'" parsing error in XML',
    seoTitle: 'Fix XML EntityRef expecting ; error',
    seoDescription: 'Solve XML parsing crashes caused by unescaped ampersands or invalid entity references.',
    problem: 'Your XML parser crashes with `EntityRef: expecting \';\'`. This happens when you have an unescaped ampersand `&` in your XML data, confusing the parser into thinking it\'s an HTML entity like `&amp;`.',
    solution: 'Replace all raw `&` characters in text nodes or attributes with `&amp;`, or wrap the text data in a `<![CDATA[ ... ]]>` block.',
    codeSnippet: `<!-- ❌ Bad: Unescaped ampersand -->\n<company>Smith & Sons</company>\n\n<!-- ✅ Good: Escaped entity -->\n<company>Smith &amp; Sons</company>`,
    faq: [
      { question: 'What is CDATA?', answer: 'CDATA sections tell the XML parser to treat the content as raw text and ignore special characters like < and &.' },
      { question: 'How do I format complex XML?', answer: 'Use our XML Formatter to indent and validate your documents.' }
    ]
  },
  {
    slug: 'sql-syntax-error-at-or-near',
    targetToolSlug: 'sql-formatter',
    title: 'Fix "syntax error at or near \'SELECT\'" in SQL',
    seoTitle: 'Fix SQL syntax error at or near SELECT',
    seoDescription: 'Troubleshoot missing semicolons and formatting issues in chained SQL queries.',
    problem: 'You are executing a script with multiple SQL statements and getting a syntax error near a keyword like `SELECT` or `INSERT`.',
    solution: 'This usually means you forgot to terminate the previous statement with a semicolon `;`. The database engine thinks the new query is part of the old one.',
    codeSnippet: `-- ❌ Bad: Missing semicolon\nUPDATE users SET active = true\nSELECT * FROM users\n\n-- ✅ Good: Properly terminated\nUPDATE users SET active = true;\nSELECT * FROM users;`,
    faq: [
      { question: 'Does every SQL dialect require semicolons?', answer: 'Most do for multiple statements (e.g., PostgreSQL, MySQL). Some client tools auto-append them, but scripts require them.' },
      { question: 'How can I quickly spot these errors?', answer: 'Paste your code into our SQL Formatter to auto-indent and easily spot missing delimiters.' }
    ]
  },
  {
    slug: 'graphql-syntax-error-expected-name-found-eof',
    targetToolSlug: 'graphql-formatter',
    title: 'Fix "Syntax Error: Expected Name, found <EOF>" in GraphQL',
    seoTitle: 'Fix GraphQL Syntax Error Expected Name found EOF',
    seoDescription: 'Resolve premature ends of GraphQL queries and missing closing braces.',
    problem: 'Your GraphQL query fails with `Expected Name, found <EOF>`. This means the query string ended unexpectedly, usually due to a missing closing brace `}`.',
    solution: 'Ensure that every opened selection set `{` has a corresponding closing brace `}`. Formatting the query properly helps visualize nested levels.',
    codeSnippet: `# ❌ Bad: Missing closing brace\nquery { user { id name \n\n# ✅ Good: Properly closed\nquery { user { id name } }`,
    faq: [
      { question: 'What does EOF mean?', answer: 'End Of File. The parser reached the end of your query string while it was still expecting more fields or braces.' },
      { question: 'How can I automatically fix braces?', answer: 'Use our GraphQL Formatter, which relies on Prettier to automatically align and close selection sets.' }
    ]
  },
  {
    slug: 'css-minification-unexpected-token',
    targetToolSlug: 'minifier',
    title: 'Fix "CSS minification error: Unexpected token"',
    seoTitle: 'Fix CSS minifier Unexpected token error',
    seoDescription: 'Learn why your CSS fails to minify and how to fix syntax errors before compression.',
    problem: 'When running a CSS minifier or build process, it fails with "Unexpected token". Your CSS has a syntax error (like a missing closing brace or invalid character) that the minifier cannot parse.',
    solution: 'Minifiers require strictly valid CSS. Find the unclosed rule, missing semicolon, or typo. Formatting the CSS can help expose the issue.',
    codeSnippet: `/* ❌ Bad: Missing closing brace for media query */\n@media (max-width: 600px) {\n  .card { padding: 10px; }\n\n/* ✅ Good: Closed properly */\n@media (max-width: 600px) {\n  .card { padding: 10px; }\n}`,
    faq: [
      { question: 'Why does it work in the browser but fail minification?', answer: 'Browsers are very forgiving and ignore broken CSS rules, but minifiers parse the AST strictly and will crash on invalid syntax.' },
      { question: 'How can I minify safely?', answer: 'Use our CSS/SVG/HTML Minifier tool to test your code compression.' }
    ]
  },
  {
    slug: 'maximum-call-stack-size-exceeded',
    targetToolSlug: 'mock-data-generator',
    title: 'Fix "RangeError: Maximum call stack size exceeded"',
    seoTitle: 'Fix RangeError Maximum call stack size exceeded',
    seoDescription: 'Solve JavaScript infinite recursion loops and stack overflows when generating mock data.',
    problem: 'Your browser or Node script crashes with `Maximum call stack size exceeded`. This happens during deep recursion, often when mock data schemas reference each other circularly.',
    solution: 'Break the circular dependency. Ensure that nested schema definitions do not infinitely call each other, or limit the recursion depth.',
    codeSnippet: `// ❌ Bad: Infinite recursion\nfunction getParent() { return { child: getParent() }; }\n\n// ✅ Good: Limited recursion\nfunction getParent(depth = 0) {\n  if (depth > 2) return null;\n  return { child: getParent(depth + 1) };\n}`,
    faq: [
      { question: 'What is the maximum call stack size?', answer: 'It varies by engine, but usually around 10,000 frames. Exceeding it means you have an infinite loop.' },
      { question: 'How do I safely generate relational data?', answer: 'Use our Mock Data Generator which safely handles relational IDs without deep object nesting.' }
    ]
  },
  {
    slug: 'duplicate-key-value-violates-unique-constraint',
    targetToolSlug: 'uuid-generator',
    title: 'Fix "duplicate key value violates unique constraint"',
    seoTitle: 'Fix database duplicate key unique constraint error',
    seoDescription: 'Solve database insert failures caused by colliding primary keys or reused UUIDs.',
    problem: 'Your database INSERT fails with `duplicate key value violates unique constraint`. You are trying to insert a row using an ID or column value that already exists in the table.',
    solution: 'If you are using sequential IDs, ensure your sequence is updated. If you are generating IDs client-side, use cryptographically secure UUIDv4 to guarantee global uniqueness without collisions.',
    codeSnippet: `-- ❌ Bad: Hardcoded or repeating ID\nINSERT INTO users (id) VALUES (1);\n\n-- ✅ Good: Using UUIDv4\nINSERT INTO users (id) VALUES ('550e8400-e29b-41d4-a716-446655440000');`,
    faq: [
      { question: 'Can UUIDv4 collide?', answer: 'The probability of a collision is practically zero. You would need to generate 1 billion UUIDs per second for 85 years to reach a 50% chance of collision.' },
      { question: 'How do I generate thousands of UUIDs?', answer: 'Use our UUID / ULID Generator to create bulk IDs instantly.' }
    ]
  },
  {
    slug: 'domexception-string-not-correctly-encoded',
    targetToolSlug: 'base64-inspector',
    title: 'Fix "DOMException: The string to be decoded is not correctly encoded"',
    seoTitle: 'Fix DOMException string not correctly encoded Base64',
    seoDescription: 'Solve atob() crashes in JavaScript when decoding invalid or unpadded Base64 strings.',
    problem: 'Calling `atob()` in JavaScript throws a DOMException. This occurs when the string contains characters outside the base64 alphabet, or if the padding `=` is missing/incorrect.',
    solution: 'Ensure your string length is a multiple of 4 by adding `=` padding, and remove URL-safe characters (`-` and `_`) by replacing them with `+` and `/`.',
    codeSnippet: `// ❌ Bad: URL-safe unpadded base64\nconst decoded = atob("eyJhbGciOiJIUzI1NiJ"); \n\n// ✅ Good: Padded and standard base64\nlet b64 = "eyJhbGciOiJIUzI1NiJ".replace(/-/g, '+').replace(/_/g, '/');\nwhile (b64.length % 4) b64 += '=';\nconst decoded = atob(b64);`,
    faq: [
      { question: 'Why does Node.js buffer not crash on this?', answer: 'Node.js Buffer.from(str, "base64") is more forgiving than the browser\'s strict atob() implementation.' },
      { question: 'How can I inspect malformed base64?', answer: 'Use our Base64 Inspector which automatically handles padding and URL-safe conversions.' }
    ]
  },
  {
    slug: 'invalid-character-in-base64-string',
    targetToolSlug: 'base64-inspector',
    title: 'Fix "Invalid character in base64 string"',
    seoTitle: 'Fix Invalid character in base64 string',
    seoDescription: 'Troubleshoot Base64 parsing errors caused by whitespace, line breaks, or URL encoding.',
    problem: 'Your backend framework throws an "Invalid character in base64 string" error. This usually happens when copying Base64 certificates or tokens that contain newlines `\\n` or when the string was URL-encoded (e.g., `%3D` instead of `=`).',
    solution: 'Strip all whitespace and newlines from the string before decoding, and ensure it has been URL-decoded if it came from a query parameter.',
    codeSnippet: `// ❌ Bad: Contains newlines\nconst raw = "base64\\nstring\\n";\n\n// ✅ Good: Clean string\nconst clean = raw.replace(/\\s+/g, '');\nconst decoded = Buffer.from(clean, 'base64');`,
    faq: [
      { question: 'Should Base64 have line breaks?', answer: 'PEM certificates require 64-character line breaks, but standard Base64 parsing usually expects a continuous string.' },
      { question: 'Can I decode it manually?', answer: 'Paste it into our Base64 Inspector and we will clean and decode it for you.' }
    ]
  },
  {
    slug: 'crypto-createhash-not-a-function',
    targetToolSlug: 'hash',
    title: 'Fix "crypto.createHash is not a function"',
    seoTitle: 'Fix crypto.createHash is not a function in browser',
    seoDescription: 'Solve Node.js crypto module errors when running code in the browser or Edge runtime.',
    problem: 'You are trying to calculate an MD5 or SHA256 hash in a React or Next.js app, and you get `crypto.createHash is not a function`. The Node.js `crypto` module is not available in the browser.',
    solution: 'Use the browser native `crypto.subtle.digest()` API (WebCrypto API) or a lightweight client-side library instead of relying on Node\'s built-in crypto module.',
    codeSnippet: `// ❌ Bad: Node.js specific code in browser\nimport crypto from 'crypto';\nconst hash = crypto.createHash('sha256').update('msg').digest('hex');\n\n// ✅ Good: WebCrypto API\nconst msgBuffer = new TextEncoder().encode('msg');\nconst hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);`,
    faq: [
      { question: 'Does WebCrypto support MD5?', answer: 'No, modern browsers removed MD5 from WebCrypto due to vulnerabilities. You must use a third-party library for client-side MD5.' },
      { question: 'How can I hash data securely without code?', answer: 'Use our Hash Generator to calculate MD5, SHA256, and SHA512 simultaneously in the browser.' }
    ]
  },
  {
    slug: 'typeerror-data-must-be-string-or-buffer',
    targetToolSlug: 'hash',
    title: 'Fix "TypeError: Data must be a string or a buffer"',
    seoTitle: 'Fix TypeError Data must be a string or buffer in Crypto',
    seoDescription: 'Resolve hashing crashes when passing objects or numbers into crypto update functions.',
    problem: 'When calling `hash.update(data)`, you receive a TypeError. This occurs because hashing algorithms only operate on raw bytes (strings or buffers), but you passed an object, array, or number.',
    solution: 'Stringify the object or cast the number to a string before hashing it.',
    codeSnippet: `// ❌ Bad: Passing an object\nconst data = { id: 1 };\ncrypto.createHash('sha256').update(data);\n\n// ✅ Good: Stringify first\nconst data = { id: 1 };\ncrypto.createHash('sha256').update(JSON.stringify(data));`,
    faq: [
      { question: 'Will JSON.stringify produce the same hash every time?', answer: 'Only if the key order is strictly identical. For deterministic hashing of objects, use a library like json-stable-stringify.' },
      { question: 'Where can I quickly test hashes?', answer: 'Our Hash Generator allows you to paste raw text and get instant cryptographic outputs.' }
    ]
  },
  {
    slug: 'bcrypt-comparesync-returns-false',
    targetToolSlug: 'password-hash',
    title: 'Fix "bcrypt.compareSync returns false for correct password"',
    seoTitle: 'Fix bcrypt compareSync returns false',
    seoDescription: 'Troubleshoot bcrypt password verification failures caused by character encoding or truncation.',
    problem: 'A user is trying to log in with the correct password, but `bcrypt.compare()` always returns false. This often happens if the password exceeds 72 bytes, or if it was accidentally hashed twice during registration.',
    solution: 'Bcrypt truncates passwords at 72 bytes. Ensure you are not hashing a hex string that exceeds this limit. Also verify that your registration flow does not hash the password on the frontend AND the backend.',
    codeSnippet: `// ❌ Bad: Hashing the hash\nconst hash = await bcrypt.hash(req.body.password, 10);\n// Later saving \`await bcrypt.hash(hash, 10)\` by accident\n\n// ✅ Good: Verify plain text against original hash\nconst match = await bcrypt.compare(req.body.password, storedHash);`,
    faq: [
      { question: 'What is the 72-byte limit?', answer: 'The bcrypt algorithm only uses the first 72 bytes of the password. Any characters after that are ignored.' },
      { question: 'How can I manually check a hash?', answer: 'Use our Password Hash & Verifier tool to test candidate passwords against existing bcrypt hashes.' }
    ]
  },
  {
    slug: 'unable-to-get-local-issuer-certificate',
    targetToolSlug: 'cert-decoder',
    title: 'Fix "unable to get local issuer certificate" in Node.js',
    seoTitle: 'Fix unable to get local issuer certificate SSL error',
    seoDescription: 'Solve UNABLE_TO_GET_ISSUER_CERT_LOCALLY errors when making requests to HTTPS endpoints.',
    problem: 'Your HTTP request fails with `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`. Node.js cannot verify the server\'s SSL certificate because it lacks the root CA or the server didn\'t send the intermediate certificates.',
    solution: 'Avoid setting `NODE_TLS_REJECT_UNAUTHORIZED=0`. Instead, fix the server\'s certificate chain (include the intermediate certs), or manually supply the custom root CA to your Node.js HTTPS agent.',
    codeSnippet: `// ❌ Bad: Disabling TLS verification globally\nprocess.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';\n\n// ✅ Good: Passing the custom CA\nconst agent = new https.Agent({ ca: fs.readFileSync('custom-ca.pem') });\naxios.get('https://internal.api', { httpsAgent: agent });`,
    faq: [
      { question: 'Why does this work in Chrome but fail in Node?', answer: 'Browsers dynamically fetch missing intermediate certificates (AIA fetching) and have larger trust stores. Node.js is strict and only trusts bundled CAs.' },
      { question: 'How do I inspect my certificate chain?', answer: 'Use our X.509 Certificate Decoder to inspect your server\'s PEM files.' }
    ]
  },
  {
    slug: 'permission-denied-publickey',
    targetToolSlug: 'ssh-key-generator',
    title: 'Fix "Permission denied (publickey)" SSH Error',
    seoTitle: 'Fix Permission denied publickey SSH error',
    seoDescription: 'Troubleshoot SSH connection failures to GitHub or remote servers due to incorrect key permissions or missing keys.',
    problem: 'When running `ssh user@host` or `git push`, you receive `Permission denied (publickey)`. The remote server rejected your connection because it doesn\'t recognize your key or the SSH agent isn\'t offering the right one.',
    solution: 'Ensure the public key is correctly added to the server\'s `~/.ssh/authorized_keys`, your private key file has strict `600` permissions (`chmod 600 id_ed25519`), and the key is added to your ssh-agent.',
    codeSnippet: `# ❌ Bad: Too open permissions on private key\n$ chmod 644 ~/.ssh/id_ed25519\n\n# ✅ Good: Strict permissions and adding to agent\n$ chmod 600 ~/.ssh/id_ed25519\n$ ssh-add ~/.ssh/id_ed25519`,
    faq: [
      { question: 'Which SSH key type is best?', answer: 'Ed25519 is the modern standard. It is faster and more secure than RSA.' },
      { question: 'I need a new key pair urgently.', answer: 'Generate a secure Ed25519 key instantly in your browser using our SSH Key Generator.' }
    ]
  },
  {
    slug: 'cannot-unmarshal-string-into-go-struct',
    targetToolSlug: 'json-to-go',
    title: 'Fix "cannot unmarshal string into Go struct field of type int"',
    seoTitle: 'Fix cannot unmarshal string into Go struct',
    seoDescription: 'Solve Go json.Unmarshal errors when JSON types do not match your struct definitions.',
    problem: 'Your Go application panics with `json: cannot unmarshal string into Go struct field...`. The API returned a string (e.g., `"123"`) but your Go struct defined the field as an `int`.',
    solution: 'You can fix this by changing the struct field to `string` and parsing it manually, or by adding the `,string` tag to the struct field so `json.Unmarshal` parses the string into an integer automatically.',
    codeSnippet: `// ❌ Bad: Strict integer type crashes on string data\ntype User struct {\n    Age int \`json:"age"\`\n}\n\n// ✅ Good: Using the string tag for automatic coercion\ntype User struct {\n    Age int \`json:"age,string"\`\n}`,
    faq: [
      { question: 'What if the JSON field is sometimes a number and sometimes a string?', answer: 'The ,string tag only works if the JSON value is ALWAYS a string. For mixed types, unmarshal into an interface{} or a custom UnmarshalJSON type.' },
      { question: 'How can I generate structs automatically?', answer: 'Use our JSON to Go Struct tool to generate accurate structs with tags from your payloads.' }
    ]
  },
  {
    slug: 'net-http-request-canceled',
    targetToolSlug: 'curl-to-go',
    title: 'Fix "net/http: request canceled (Client.Timeout exceeded)"',
    seoTitle: 'Fix Go net/http Client.Timeout exceeded',
    seoDescription: 'Troubleshoot Go HTTP client timeouts and context cancellations during slow API calls.',
    problem: 'Your Go HTTP request fails with `Client.Timeout exceeded while awaiting headers`. The remote server took longer to respond than the `Timeout` specified in your `http.Client`.',
    solution: 'Increase the `Timeout` duration in your HTTP client, or verify if the server is actually deadlocking. If using a `Context`, ensure the context deadline is generous enough for the payload size.',
    codeSnippet: `// ❌ Bad: Too short timeout for a slow API\nclient := &http.Client{ Timeout: 1 * time.Second }\n\n// ✅ Good: Appropriate timeout\nclient := &http.Client{ Timeout: 10 * time.Second }`,
    faq: [
      { question: 'Should I use the default http.DefaultClient?', answer: 'No! The default client has NO timeout, meaning a slow server can hang your Go application forever.' },
      { question: 'How do I quickly write Go HTTP requests?', answer: 'Convert curl commands to Go instantly with our cURL to Go tool.' }
    ]
  },
  {
    slug: 'invalid-date-in-javascript',
    targetToolSlug: 'epoch-converter',
    title: 'Fix "Invalid Date" in JavaScript Date Parsing',
    seoTitle: 'Fix Invalid Date in JavaScript',
    seoDescription: 'Understand why new Date() returns Invalid Date and how to correctly parse timestamps.',
    problem: 'You pass a string or timestamp into `new Date()` and it evaluates to `Invalid Date`. This frequently happens when passing Unix epochs in seconds instead of milliseconds, or parsing non-ISO 8601 strings (like `YYYY-DD-MM`).',
    solution: 'JavaScript requires epoch timestamps to be in milliseconds. Multiply seconds by 1000 before passing them to the Date constructor. For strings, stick to ISO format `YYYY-MM-DDTHH:mm:ss.sssZ`.',
    codeSnippet: `// ❌ Bad: Passing seconds\nconst date = new Date(1672531200); // Year 1970\n\n// ✅ Good: Passing milliseconds\nconst date = new Date(1672531200 * 1000); // Year 2023`,
    faq: [
      { question: 'Why does Safari return Invalid Date but Chrome works?', answer: 'Safari strictly requires ISO formats (like using "T" and "Z") whereas Chrome aggressively tries to parse irregular formats like "2023-01-01 12:00:00".' },
      { question: 'How can I convert epochs manually?', answer: 'Use our Epoch Converter to safely translate seconds and milliseconds to human time.' }
    ]
  },
  {
    slug: 'epoch-time-out-of-range',
    targetToolSlug: 'epoch-converter',
    title: 'Fix "time out of range" / Year 50000+ bugs',
    seoTitle: 'Fix time out of range Unix Epoch bugs',
    seoDescription: 'Solve bizarre dates in the far future caused by timestamp unit confusion (milliseconds vs nanoseconds).',
    problem: 'Your parsed dates are showing up as the year 54,000 or you receive a "time out of range" exception in your language of choice. This happens when you pass nanoseconds or microseconds into a function expecting milliseconds.',
    solution: 'Determine the length of your epoch integer. 10 digits = seconds. 13 digits = milliseconds. 16 digits = microseconds. 19 digits = nanoseconds. Divide accordingly before parsing.',
    codeSnippet: `// ❌ Bad: Passing nanoseconds to JS\nconst date = new Date(1672531200000000000); \n\n// ✅ Good: Truncating to milliseconds\nconst date = new Date(1672531200000000000 / 1000000);`,
    faq: [
      { question: 'Where do nanosecond epochs come from?', answer: 'Languages like Go (time.Now().UnixNano()) and some database systems emit timestamps in nanoseconds for high precision.' },
      { question: 'How do I debug these huge numbers?', answer: 'Our Epoch Converter automatically detects seconds vs milliseconds to help prevent these mistakes.' }
    ]
  },
  {
    slug: 'syntaxerror-invalid-regular-expression',
    targetToolSlug: 'regex',
    title: 'Fix "SyntaxError: Invalid regular expression"',
    seoTitle: 'Fix SyntaxError Invalid regular expression',
    seoDescription: 'Solve JavaScript regex compilation crashes caused by unescaped special characters.',
    problem: 'Creating a RegExp object throws `SyntaxError: Invalid regular expression`. This occurs when you dynamically pass user input into `new RegExp()` without escaping special regex characters (like `[`, `(`, `*`, `?`).',
    solution: 'Always escape dynamic strings before passing them into `new RegExp()`. A simple replace function can escape all reserved characters.',
    codeSnippet: `// ❌ Bad: User input containing a '+' crashes the regex\nconst search = "C++";\nconst regex = new RegExp(search); // Crashes\n\n// ✅ Good: Escaped input\nconst escapeRegExp = (str) => str.replace(/[.*+?^$\\{\\}()|[\\]\\\\]/g, '\\\\$&');\nconst regex = new RegExp(escapeRegExp("C++"));`,
    faq: [
      { question: 'Why does literal syntax /pattern/ not crash?', answer: 'Literal syntax is validated at compile time by the JavaScript engine. new RegExp() compiles at runtime based on string values.' },
      { question: 'How can I test complex regex safely?', answer: 'Use our Regex Tester to validate patterns and groups in real time.' }
    ]
  },
  {
    slug: 'git-merge-conflict-markers-found',
    targetToolSlug: 'diff',
    title: 'Fix "Git merge conflict markers found"',
    seoTitle: 'Fix Git merge conflict markers in code',
    seoDescription: 'Understand and resolve Git merge conflict headers like <<<<<<< HEAD.',
    problem: 'Your build fails or your IDE shows syntax errors because your file contains `<<<<<<< HEAD` and `======`. This happens when a git merge or rebase fails automatically and requires manual intervention.',
    solution: 'You must manually edit the file to choose the correct code. Remove the conflict markers (`<<<<<<<`, `======`, `>>>>>>>`) and keep the lines you want.',
    codeSnippet: `// ❌ Bad: Code containing markers\n<<<<<<< HEAD\nconst url = 'localhost';\n=======\nconst url = 'api.com';\n>>>>>>> feature-branch\n\n// ✅ Good: Resolved code\nconst url = process.env.NODE_ENV === 'prod' ? 'api.com' : 'localhost';`,
    faq: [
      { question: 'Can I undo a messy merge?', answer: 'Yes, run `git merge --abort` in your terminal to cancel the merge and return to your previous state.' },
      { question: 'How do I compare the two versions clearly?', answer: 'Paste both versions into our Diff Checker to view a side-by-side comparison of the changes.' }
    ]
  },
  {
    slug: 'invalid-cidr-notation',
    targetToolSlug: 'cidr-calculator',
    title: 'Fix "Invalid CIDR notation" / Invalid subnet mask',
    seoTitle: 'Fix Invalid CIDR notation error',
    seoDescription: 'Troubleshoot network configuration errors caused by out-of-bounds CIDR block definitions.',
    problem: 'Your cloud provider (AWS, GCP) or network script rejects your IP range with "Invalid CIDR notation". This happens when the routing prefix exceeds /32 for IPv4, or if the base IP address is not the actual network address for the given mask.',
    solution: 'Ensure your suffix is between /0 and /32. Also ensure that the host bits are zeroed out. For example, `192.168.1.5/24` is technically invalid as a network definition; it should be `192.168.1.0/24`.',
    codeSnippet: `# ❌ Bad: Base IP has host bits set\nallow_ip = "10.0.0.5/24"\n\n# ✅ Good: Base IP is the network boundary\nallow_ip = "10.0.0.0/24"`,
    faq: [
      { question: 'What does the /24 mean?', answer: 'It means the first 24 bits of the IP address are fixed (the network), leaving 8 bits (256 addresses) for hosts.' },
      { question: 'How do I calculate the correct base IP?', answer: 'Use our CIDR Calculator to instantly determine the network address, broadcast address, and valid host ranges.' }
    ]
  },
  {
    slug: 'expected-double-quoted-property-name',
    targetToolSlug: 'json-formatter',
    title: 'Fix "Expected double-quoted property name in JSON"',
    seoTitle: 'Fix Expected double-quoted property name JSON Error',
    seoDescription: 'Solve strict JSON parsing errors caused by trailing commas, single quotes, or unquoted keys.',
    problem: 'Your JSON parser throws "Expected double-quoted property name". You are likely using JavaScript object literal syntax (like single quotes or unquoted keys) which is strictly forbidden in the JSON spec.',
    solution: 'Wrap all keys in double quotes `""`. Change all string values to double quotes. Remove trailing commas from the last item in objects or arrays.',
    codeSnippet: `// ❌ Bad: JS object syntax (invalid JSON)\n{ name: 'John', age: 30, }\n\n// ✅ Good: Valid strict JSON\n{ "name": "John", "age": 30 }`,
    faq: [
      { question: 'Why does JSON strictly require double quotes?', answer: 'The JSON spec (RFC 8259) enforces double quotes to make parsing simpler and identical across dozens of programming languages.' },
      { question: 'Can I auto-fix this?', answer: 'Yes! Paste your malformed JS object into our JSON Formatter and it will automatically quote keys and fix trailing commas.' }
    ]
  },
  {
    slug: 'yaml-did-not-find-expected-key',
    targetToolSlug: 'yaml',
    title: 'Fix "did not find expected key while parsing a block mapping"',
    seoTitle: 'Fix did not find expected key in YAML',
    seoDescription: 'Troubleshoot YAML parser errors caused by misaligned indentation or hidden tab characters.',
    problem: 'Your YAML parser crashes with `did not find expected key`. This almost always means your indentation levels are mixed up. A child element is indented less than or equal to its parent, breaking the block mapping.',
    solution: 'Check your indentation. YAML requires exact spaces. A common mistake is indenting a list item `-` without indenting its contents correctly.',
    codeSnippet: `# ❌ Bad: Misaligned list\nsteps:\n- name: Build\n script: make build\n\n# ✅ Good: Correct alignment\nsteps:\n  - name: Build\n    script: make build`,
    faq: [
      { question: 'Can I use a linter for this?', answer: 'Yes, setting up a YAML linter in your IDE is highly recommended.' },
      { question: 'How do I fix large YAML files quickly?', answer: 'Paste it into our YAML to JSON converter. The error output will pinpoint the exact line number of the indentation failure.' }
    ]
  },
  {
    slug: 'token-expired-error-jwt',
    targetToolSlug: 'jwt',
    title: 'Fix "TokenExpiredError: jwt expired"',
    seoTitle: 'Fix TokenExpiredError jwt expired',
    seoDescription: 'Handle JWT expiration gracefully on the frontend using refresh tokens.',
    problem: 'Your API calls are failing with a 401 Unauthorized and `TokenExpiredError: jwt expired`. The `exp` claim in the JSON Web Token is in the past.',
    solution: 'You must handle this gracefully on the client by intercepting the 401 response and using a Refresh Token to obtain a new JWT, or by redirecting the user to the login screen.',
    codeSnippet: `// ✅ Good: Axios interceptor for refresh\naxios.interceptors.response.use(res => res, async error => {\n  if (error.response.status === 401) {\n    await refreshTokens();\n    return axios.request(error.config);\n  }\n  return Promise.reject(error);\n});`,
    faq: [
      { question: 'Why not make JWTs last forever?', answer: 'Security. If a JWT is stolen, the attacker has access forever. Short-lived JWTs (e.g., 15 mins) minimize this risk.' },
      { question: 'How can I check when my token expires?', answer: 'Paste your token into our JWT Decoder to view the exact expiration date in your local time zone.' }
    ]
  },
  {
    slug: 'cron-expression-6-parts-expected-5',
    targetToolSlug: 'cron',
    title: 'Fix "cron expression has 6 parts but expected 5"',
    seoTitle: 'Fix cron expression has 6 parts expected 5',
    seoDescription: 'Understand the difference between standard UNIX cron and extended Quartz/Spring cron syntax.',
    problem: 'Your cron parser throws an error because you provided 6 fields (e.g., `* * * * * *`) instead of 5. You are likely trying to schedule at the "seconds" level, but standard UNIX cron only goes down to the "minute" level.',
    solution: 'If your runtime environment (like standard crontab) only supports 5 fields, remove the first "seconds" field. If you absolutely need sub-minute execution, use a systemd timer, a background worker, or a parser that supports 6-field Quartz syntax (like AWS EventBridge).',
    codeSnippet: `// ❌ Bad: 6 fields in standard crontab (fails)\n* * * * * * /script.sh\n\n// ✅ Good: 5 fields (runs every minute)\n* * * * * /script.sh`,
    faq: [
      { question: 'Does GitHub Actions support 6 fields?', answer: 'No, GitHub Actions workflows use standard 5-field cron syntax.' },
      { question: 'How do I visualize standard cron?', answer: 'Use our Cron Visualizer to generate human-readable schedules from any 5-field expression.' }
    ]
  },
  {
    slug: 'property-does-not-exist-on-type',
    targetToolSlug: 'json-to-ts',
    title: 'Fix "Property does not exist on type"',
    seoTitle: 'Fix Property does not exist on type in TypeScript',
    seoDescription: 'Solve strict TypeScript compiler errors when accessing undocumented API fields.',
    problem: 'TypeScript throws `Property \'x\' does not exist on type \'Y\'`. You are trying to access a field from an API response, but your TypeScript interface doesn\'t define that field.',
    solution: 'Update your interface to include the missing property. If the property is optional (sometimes the API doesn\'t send it), mark it with a question mark `?`.',
    codeSnippet: `// ❌ Bad: Interface missing the property\ninterface User { name: string; }\nconst user = data as User;\nconsole.log(user.age); // Error!\n\n// ✅ Good: Updated interface\ninterface User { name: string; age?: number; }\nconsole.log(user.age);`,
    faq: [
      { question: 'Can I use "any" to bypass this?', answer: 'Using `any` defeats the purpose of TypeScript. It\'s better to define the correct type.' },
      { question: 'How do I generate accurate interfaces?', answer: 'Paste your API JSON into our JSON to TS converter to instantly generate complete, nested interfaces.' }
    ]
  },
  {
    slug: 'expected-corresponding-jsx-closing-tag',
    targetToolSlug: 'svg-to-jsx',
    title: 'Fix "Expected corresponding JSX closing tag"',
    seoTitle: 'Fix Expected corresponding JSX closing tag for path',
    seoDescription: 'Solve React JSX compilation errors caused by unclosed HTML or SVG tags.',
    problem: 'React fails to compile with `Expected corresponding JSX closing tag for <path>`. HTML/SVG allows self-closing tags without a trailing slash (like `<path d="...">`), but JSX strictly requires all tags to be closed (e.g., `<path d="..." />`).',
    solution: 'Add a trailing slash to all self-closing SVG tags like `<path>`, `<circle>`, and `<rect>`.',
    codeSnippet: `// ❌ Bad: Unclosed path tag\n<svg><path d="M10 10"></svg>\n\n// ✅ Good: Self-closing slash\n<svg><path d="M10 10" /></svg>`,
    faq: [
      { question: 'Why is JSX stricter than HTML?', answer: 'JSX compiles down to JavaScript function calls (React.createElement). It needs strict XML-like syntax to parse correctly.' },
      { question: 'Can I automate this cleanup?', answer: 'Yes, our SVG to JSX tool automatically closes tags, converts attributes to camelCase, and formats the code for React.' }
    ]
  },
  {
    slug: 'hmac-key-must-be-buffer',
    targetToolSlug: 'hmac-generator',
    title: 'Fix "TypeError: Key must be a buffer"',
    seoTitle: 'Fix TypeError Key must be a buffer in HMAC',
    seoDescription: 'Troubleshoot HMAC generation crashes in Node.js caused by missing or undefined secret keys.',
    problem: 'When calling `crypto.createHmac()`, Node.js throws `TypeError: Key must be a buffer`. This happens because the secret key you passed is `undefined`, usually due to a missing environment variable.',
    solution: 'Ensure your `.env` file is loaded correctly and that the secret key exists before attempting to generate the HMAC.',
    codeSnippet: `// ❌ Bad: Secret is undefined\nconst secret = process.env.WEBHOOK_SECRET; // Missing!\ncrypto.createHmac('sha256', secret);\n\n// ✅ Good: Fail fast if missing\nif (!process.env.WEBHOOK_SECRET) throw new Error("Missing secret");\ncrypto.createHmac('sha256', process.env.WEBHOOK_SECRET);`,
    faq: [
      { question: 'Can the key be a string?', answer: 'Yes, Node.js accepts strings or Buffers for the key. The error specifically occurs when you pass undefined.' },
      { question: 'How do I test webhook signatures?', answer: 'Use our HMAC Generator to manually hash payloads using your secret key.' }
    ]
  },
  {
    slug: 'self-signed-certificate-in-chain',
    targetToolSlug: 'cert-decoder',
    title: 'Fix "self signed certificate in certificate chain"',
    seoTitle: 'Fix self signed certificate in certificate chain error',
    seoDescription: 'Resolve Node.js SSL handshake failures when connecting to internal corporate networks.',
    problem: 'Your app throws `self signed certificate in certificate chain`. This happens frequently in corporate networks that use SSL interception proxies, or when testing against local dev servers with self-signed certs.',
    solution: 'For development, you can bypass this via an environment variable. For production, you must obtain the corporate Root CA certificate and tell Node.js to trust it.',
    codeSnippet: `// ❌ Bad: Insecure bypass (Dev only)\nprocess.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';\n\n// ✅ Good: Add corporate CA to global agent\nrequire('https').globalAgent.options.ca = fs.readFileSync('corp-ca.crt');`,
    faq: [
      { question: 'Why does curl work but Node fails?', answer: 'Your OS or curl might have the corporate CA installed in their trust store. Node.js uses its own hardcoded Mozilla trust store.' },
      { question: 'How do I inspect the self-signed cert?', answer: 'Use our Certificate Decoder to inspect the issuer and confirm it\'s your corporate proxy.' }
    ]
  }
];

const lines = [];
lines.push('export interface RecipeMeta {');
lines.push('  slug: string;');
lines.push('  targetToolSlug: string;');
lines.push('  title: string;');
lines.push('  seoTitle: string;');
lines.push('  seoDescription: string;');
lines.push('  problem: string;');
lines.push('  solution: string;');
lines.push('  codeSnippet?: string;');
lines.push('  faq: { question: string; answer: string }[];');
lines.push('}');
lines.push('');
lines.push('export const RECIPE_REGISTRY: Record<string, RecipeMeta> = {');

for (let i = 0; i < recipes.length; i++) {
  const r = recipes[i];
  let jsonStr = JSON.stringify(r, null, 2);
  jsonStr = jsonStr.split('\n').map((l, j) => j === 0 ? l : '  ' + l).join('\n');
  lines.push(`  "${r.slug}": ${jsonStr}${i < recipes.length - 1 ? ',' : ''}`);
}

lines.push('};');
lines.push('');
lines.push('export const RECIPE_SLUGS = Object.keys(RECIPE_REGISTRY);');
lines.push('');
lines.push('export function getRecipeMeta(slug: string): RecipeMeta | undefined {');
lines.push('  return RECIPE_REGISTRY[slug];');
lines.push('}');
lines.push('');

fs.writeFileSync(path.join(__dirname, '../src/lib/recipes/registry.ts'), lines.join('\n'));
console.log('Successfully wrote 40 curated recipes to registry.ts');
