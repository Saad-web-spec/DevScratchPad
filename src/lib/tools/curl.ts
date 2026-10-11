/**
 * cURL command converter.
 *
 * Parses a curl command line (POSIX-shell quoting plus Windows cmd `^` and
 * PowerShell backtick line continuations) into a structured request, then
 * generates equivalent JavaScript `fetch`, Python `requests` and Go
 * `net/http` code. Everything runs locally in the browser; nothing is sent
 * anywhere. String literals are emitted with JSON.stringify, which is a valid
 * double-quoted string literal in JavaScript, Python and Go alike.
 */

export interface CurlFormField {
  name: string;
  value: string;
  /** `name=@path` — `value` holds the file path. */
  isFile: boolean;
}

export interface CurlAuth {
  user: string;
  password: string;
}

export interface ParsedCurl {
  url: string;
  /** Upper-case HTTP method. */
  method: string;
  /** Insertion order preserved; a later case-insensitive duplicate replaces the value in place. */
  headers: Record<string, string>;
  /** Raw body (data flags joined with "&"). */
  body?: string;
  /** Set when the input isn't a curl command or has no URL. */
  error?: string;
  /** -F / --form fields. */
  form?: CurlFormField[];
  /** -u user:pass */
  auth?: CurlAuth;
  /** -k / --insecure */
  insecure?: boolean;
  /** -L / --location */
  followRedirects?: boolean;
  /** Non-fatal notes, e.g. "Ignored unsupported option --foo". */
  warnings?: string[];
}

const NOT_CURL_ERROR = "Input does not appear to be a curl command.";
const NO_URL_ERROR = "No URL found in the curl command.";

// ---------------------------------------------------------------------------
// Tokenizer
// ---------------------------------------------------------------------------

/**
 * If only spaces/tabs separate `i` from a line break (or the end of input),
 * returns the index just past that break; otherwise -1. Used for `\`, `^` and
 * backtick line continuations (trailing spaces after them are tolerated).
 */
function lineBreakEnd(s: string, i: number): number {
  let j = i;
  while (j < s.length && (s[j] === " " || s[j] === "\t")) j++;
  if (j >= s.length) return s.length;
  if (s[j] === "\n") return j + 1;
  if (s[j] === "\r") return s[j + 1] === "\n" ? j + 2 : j + 1;
  return -1;
}

const ANSI_C_ESCAPES = new Map<string, string>([
  ["n", "\n"],
  ["t", "\t"],
  ["r", "\r"],
  ["\\", "\\"],
  ["'", "'"],
  ['"', '"'],
  ["a", "\x07"],
  ["b", "\b"],
  ["e", "\x1b"],
  ["E", "\x1b"],
  ["f", "\f"],
  ["v", "\v"],
  ["?", "?"],
]);

const HEX_ESCAPE_LENGTH = new Map<string, number>([
  ["x", 2],
  ["u", 4],
  ["U", 8],
]);

/** Reads a `$'...'` body starting after the opening quote. */
function readAnsiC(s: string, start: number): { text: string; next: number } {
  let text = "";
  let i = start;
  while (i < s.length && s[i] !== "'") {
    if (s[i] === "\\" && i + 1 < s.length) {
      const e = s[i + 1];
      const simple = ANSI_C_ESCAPES.get(e);
      if (simple !== undefined) {
        text += simple;
        i += 2;
        continue;
      }
      const maxHex = HEX_ESCAPE_LENGTH.get(e);
      if (maxHex !== undefined) {
        let hex = "";
        while (hex.length < maxHex && /[0-9a-fA-F]/.test(s[i + 2 + hex.length] ?? "")) {
          hex += s[i + 2 + hex.length];
        }
        const code = hex ? parseInt(hex, 16) : NaN;
        if (!Number.isNaN(code) && code <= 0x10ffff) {
          text += String.fromCodePoint(code);
          i += 2 + hex.length;
          continue;
        }
      }
      // Unknown escape: bash keeps it verbatim.
      text += "\\" + e;
      i += 2;
      continue;
    }
    text += s[i];
    i++;
  }
  return { text, next: i + 1 };
}

/** Reads a `"..."` body starting after the opening quote. */
function readDoubleQuoted(s: string, start: number): { text: string; next: number } {
  let text = "";
  let i = start;
  while (i < s.length && s[i] !== '"') {
    if (s[i] === "\\" && i + 1 < s.length) {
      const e = s[i + 1];
      if (e === '"' || e === "\\" || e === "$" || e === "`") {
        text += e;
        i += 2;
        continue;
      }
      if (e === "\n") {
        i += 2;
        continue;
      }
      if (e === "\r" && s[i + 2] === "\n") {
        i += 3;
        continue;
      }
    }
    text += s[i];
    i++;
  }
  return { text, next: i + 1 };
}

/**
 * Splits a command line into argv-style tokens. Stops at an unquoted command
 * separator (`|`, `;`, `&&`, `<`, `>`) so pipes and redirects are ignored.
 */
function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let cur = "";
  let active = false;
  let i = 0;
  const n = input.length;
  const flush = () => {
    if (active) tokens.push(cur);
    cur = "";
    active = false;
  };

  while (i < n) {
    const ch = input[i];
    if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
      flush();
      i++;
      continue;
    }
    if (ch === "\\") {
      const end = lineBreakEnd(input, i + 1);
      if (end >= 0) {
        i = end;
        continue;
      }
      cur += input[i + 1];
      active = true;
      i += 2;
      continue;
    }
    if (ch === "^" || ch === "`") {
      const end = lineBreakEnd(input, i + 1);
      if (end >= 0) {
        i = end;
        continue;
      }
      cur += ch;
      active = true;
      i++;
      continue;
    }
    if (ch === "'") {
      const close = input.indexOf("'", i + 1);
      const stop = close < 0 ? n : close;
      cur += input.slice(i + 1, stop);
      active = true;
      i = stop + 1;
      continue;
    }
    if (ch === "$" && input[i + 1] === "'") {
      const { text, next } = readAnsiC(input, i + 2);
      cur += text;
      active = true;
      i = next;
      continue;
    }
    if (ch === '"' || (ch === "$" && input[i + 1] === '"')) {
      const { text, next } = readDoubleQuoted(input, ch === "$" ? i + 2 : i + 1);
      cur += text;
      active = true;
      i = next;
      continue;
    }
    if (ch === "#" && !active) {
      while (i < n && input[i] !== "\n") i++;
      continue;
    }
    if (ch === "|" || ch === ";" || ch === "<" || ch === ">" || (ch === "&" && input[i + 1] === "&")) {
      // `2>/dev/null`: the fd number belongs to the redirect, not the command.
      if (ch === ">" && /^\d$/.test(cur)) {
        cur = "";
        active = false;
      }
      break;
    }
    cur += ch;
    active = true;
    i++;
  }
  flush();
  return tokens;
}

// ---------------------------------------------------------------------------
// Option tables
// ---------------------------------------------------------------------------

type ArgAction =
  | "url"
  | "request"
  | "header"
  | "data"
  | "data-raw"
  | "data-urlencode"
  | "json"
  | "form"
  | "form-string"
  | "user"
  | "cookie"
  | "user-agent"
  | "referer"
  | "oauth2-bearer"
  | "ignore"
  | "unsupported";

type FlagAction = "get" | "head" | "insecure" | "location" | "ignore";

/** Map entries for a whitespace-separated list of long option names. */
function optionEntries<T>(names: string, action: T): [string, T][] {
  return names
    .trim()
    .split(/\s+/)
    .map((name): [string, T] => [name, action]);
}

const ARG_OPTIONS = new Map<string, ArgAction>([
  ["url", "url"],
  ["request", "request"],
  ["header", "header"],
  ["data", "data"],
  ["data-ascii", "data"],
  ["data-binary", "data"],
  ["data-raw", "data-raw"],
  ["data-urlencode", "data-urlencode"],
  ["json", "json"],
  ["form", "form"],
  ["form-string", "form-string"],
  ["user", "user"],
  ["cookie", "cookie"],
  ["user-agent", "user-agent"],
  ["referer", "referer"],
  ["oauth2-bearer", "oauth2-bearer"],
  // Take an argument but don't affect the generated request.
  ...optionEntries<ArgAction>(
    `output max-time connect-timeout write-out retry retry-delay retry-max-time proxy proxy-user
     cookie-jar cacert capath cert cert-type key key-type pass upload-file range speed-time
     speed-limit limit-rate resolve connect-to max-redirs max-filesize dump-header trace
     trace-ascii stderr output-dir interface noproxy unix-socket ciphers keepalive-time
     expect100-timeout dns-servers config time-cond`,
    "ignore",
  ),
  // Take an argument and change the request in ways we can't express: warn.
  ...optionEntries<ArgAction>("aws-sigv4 request-target variable url-query", "unsupported"),
]);

const FLAG_OPTIONS = new Map<string, FlagAction>([
  ["get", "get"],
  ["head", "head"],
  ["insecure", "insecure"],
  ["location", "location"],
  ["location-trusted", "location"],
  ...optionEntries<FlagAction>(
    `silent show-error verbose include fail fail-with-body compressed progress-bar no-buffer
     no-progress-meter no-keepalive http1.0 http1.1 http2 http2-prior-knowledge http3 ipv4 ipv6
     globoff remote-name remote-header-name remote-time create-dirs tcp-nodelay path-as-is raw
     ssl-no-revoke tlsv1 tlsv1.0 tlsv1.1 tlsv1.2 tlsv1.3 netrc netrc-optional
     junk-session-cookies disable parallel basic`,
    "ignore",
  ),
]);

/** Short option letter -> long option name. */
const SHORT_OPTIONS = new Map<string, string>(
  `X:request H:header d:data F:form u:user b:cookie A:user-agent e:referer o:output m:max-time
   w:write-out x:proxy U:proxy-user c:cookie-jar E:cert T:upload-file r:range y:speed-time
   Y:speed-limit D:dump-header K:config z:time-cond G:get I:head k:insecure L:location s:silent
   S:show-error i:include v:verbose f:fail #:progress-bar N:no-buffer 0:http1.0 4:ipv4 6:ipv6
   g:globoff O:remote-name J:remote-header-name R:remote-time n:netrc j:junk-session-cookies
   q:disable Z:parallel`
    .trim()
    .split(/\s+/)
    .map((pair): [string, string] => [pair[0], pair.slice(2)]),
);

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

interface HeaderEntry {
  key: string;
  value: string;
}

/** Case-insensitive, order-preserving header list. */
class HeaderList {
  readonly entries: HeaderEntry[] = [];

  private indexOf(key: string): number {
    const lower = key.toLowerCase();
    return this.entries.findIndex((e) => e.key.toLowerCase() === lower);
  }

  get(key: string): string | undefined {
    const idx = this.indexOf(key);
    return idx >= 0 ? this.entries[idx].value : undefined;
  }

  set(key: string, value: string): void {
    const idx = this.indexOf(key);
    if (idx >= 0) this.entries[idx].value = value;
    else this.entries.push({ key, value });
  }

  delete(key: string): void {
    const idx = this.indexOf(key);
    if (idx >= 0) this.entries.splice(idx, 1);
  }

  toRecord(): Record<string, string> {
    const record: Record<string, string> = {};
    for (const { key, value } of this.entries) {
      // defineProperty so a header literally named "__proto__" stays a plain key.
      Object.defineProperty(record, key, { value, enumerable: true, writable: true, configurable: true });
    }
    return record;
  }
}

/** curl's --data-urlencode escaping (RFC 3986 unreserved characters kept). */
function urlEncode(value: string): string {
  try {
    return encodeURIComponent(value).replace(
      /[!'()*]/g,
      (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase(),
    );
  } catch {
    return value;
  }
}

/** Applies --data-urlencode semantics: `content`, `=content`, `name=content`, `@file`, `name@file`. */
function encodeDataUrlencode(value: string): string {
  const eq = value.indexOf("=");
  const at = value.indexOf("@");
  if (eq >= 0 && (at < 0 || eq < at)) {
    const name = value.slice(0, eq);
    const content = urlEncode(value.slice(eq + 1));
    return name ? `${name}=${content}` : content;
  }
  if (at >= 0) return value;
  return urlEncode(value);
}

const SCHEME_RE = /^[a-z][a-z0-9+.-]*:\/\//i;

function normalizeUrl(raw: string): string {
  return SCHEME_RE.test(raw) ? raw : `http://${raw}`;
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** Appends a query string (as curl -G does), keeping any #fragment at the end. */
function appendQuery(url: string, query: string): string {
  if (!query) return url;
  const hashIdx = url.indexOf("#");
  const base = hashIdx >= 0 ? url.slice(0, hashIdx) : url;
  const hash = hashIdx >= 0 ? url.slice(hashIdx) : "";
  const sep = !base.includes("?") ? "?" : base.endsWith("?") || base.endsWith("&") ? "" : "&";
  return `${base}${sep}${query}${hash}`;
}

interface ParseState {
  explicitUrl?: string;
  methodOverride?: string;
  auth?: CurlAuth;
  useGet: boolean;
  useHead: boolean;
  insecure: boolean;
  followRedirects: boolean;
  jsonUsed: boolean;
}

function errorResult(error: string): ParsedCurl {
  return { url: "", method: "GET", headers: {}, error };
}

export function parseCurlCommand(curlStr: string): ParsedCurl {
  if (!curlStr || !curlStr.trim()) return errorResult(NOT_CURL_ERROR);

  const tokens = tokenize(curlStr.replace(/^\s*\$\s+/, ""));
  if (tokens.length === 0 || !/^curl(\.exe)?$/i.test(tokens[0])) return errorResult(NOT_CURL_ERROR);

  const headers = new HeaderList();
  const warnings: string[] = [];
  const warn = (message: string) => {
    if (!warnings.includes(message)) warnings.push(message);
  };
  const dataParts: { text: string; isJson: boolean }[] = [];
  const form: CurlFormField[] = [];
  const positional: string[] = [];
  const st: ParseState = { useGet: false, useHead: false, insecure: false, followRedirects: false, jsonUsed: false };

  const applyFlag = (action: FlagAction, on: boolean) => {
    if (action === "get") st.useGet = on;
    else if (action === "head") st.useHead = on;
    else if (action === "insecure") st.insecure = on;
    else if (action === "location") st.followRedirects = on;
  };

  const addHeader = (raw: string, label: string) => {
    if (raw.startsWith("@")) {
      warn(`Ignored ${label} ${raw} (headers read from a file are not supported)`);
      return;
    }
    const colon = raw.indexOf(":");
    if (colon < 0) {
      const trimmed = raw.trim();
      // "Name;" sends the header with an empty value.
      if (trimmed.endsWith(";") && trimmed.length > 1) headers.set(trimmed.slice(0, -1).trim(), "");
      else warn(`Ignored malformed header "${raw}"`);
      return;
    }
    const key = raw.slice(0, colon).trim();
    const value = raw.slice(colon + 1).trim();
    if (!key) {
      warn(`Ignored malformed header "${raw}"`);
      return;
    }
    // "Name:" with no value removes the header in curl.
    if (value === "") headers.delete(key);
    else headers.set(key, value);
  };

  const addForm = (raw: string, literal: boolean) => {
    const eq = raw.indexOf("=");
    if (eq <= 0) {
      warn(`Ignored malformed form field "${raw}"`);
      return;
    }
    const name = raw.slice(0, eq);
    const value = raw.slice(eq + 1);
    if (!literal && value.startsWith("@")) {
      // Drop ;type=... / ;filename=... modifiers from the path.
      form.push({ name, value: value.slice(1).split(";")[0], isFile: true });
    } else {
      form.push({ name, value, isFile: false });
    }
  };

  const applyArg = (action: ArgAction, value: string, label: string) => {
    switch (action) {
      case "url":
        if (st.explicitUrl === undefined) st.explicitUrl = value;
        else warn(`Ignored extra URL ${value}`);
        break;
      case "request":
        st.methodOverride = value.toUpperCase();
        break;
      case "header":
        addHeader(value, label);
        break;
      case "data":
        if (value.startsWith("@")) {
          warn(`Body file ${value} is read by curl at run time; the generated code sends the literal text.`);
        }
        dataParts.push({ text: value, isJson: false });
        break;
      case "data-raw":
        dataParts.push({ text: value, isJson: false });
        break;
      case "data-urlencode":
        dataParts.push({ text: encodeDataUrlencode(value), isJson: false });
        break;
      case "json":
        st.jsonUsed = true;
        dataParts.push({ text: value, isJson: true });
        break;
      case "form":
        addForm(value, false);
        break;
      case "form-string":
        addForm(value, true);
        break;
      case "user": {
        const colon = value.indexOf(":");
        st.auth =
          colon >= 0
            ? { user: value.slice(0, colon), password: value.slice(colon + 1) }
            : { user: value, password: "" };
        break;
      }
      case "cookie":
        if (value.includes("=")) {
          const existing = headers.get("Cookie");
          headers.set("Cookie", existing ? `${existing}; ${value}` : value);
        } else {
          warn(`Ignored cookie file ${value} (only inline "name=value" cookies are converted)`);
        }
        break;
      case "user-agent":
        headers.set("User-Agent", value);
        break;
      case "referer": {
        const referer = value.replace(/;auto$/, "");
        if (referer) headers.set("Referer", referer);
        break;
      }
      case "oauth2-bearer":
        headers.set("Authorization", `Bearer ${value}`);
        break;
      case "unsupported":
        warn(`Ignored unsupported option ${label}`);
        break;
      case "ignore":
        break;
    }
  };

  let i = 1;
  let endOfOptions = false;
  while (i < tokens.length) {
    const tok = tokens[i++];
    if (endOfOptions || tok === "-" || !tok.startsWith("-")) {
      positional.push(tok);
      continue;
    }
    if (tok === "--") {
      endOfOptions = true;
      continue;
    }

    if (tok.startsWith("--")) {
      let name = tok.slice(2);
      let inline: string | undefined;
      const eq = name.indexOf("=");
      if (eq >= 0) {
        inline = name.slice(eq + 1);
        name = name.slice(0, eq);
      }
      const label = `--${name}`;
      const argAction = ARG_OPTIONS.get(name);
      if (argAction !== undefined) {
        const value = inline ?? tokens[i++];
        if (value === undefined) warn(`Option ${label} requires a value`);
        else applyArg(argAction, value, label);
        continue;
      }
      const flagAction = FLAG_OPTIONS.get(name);
      if (flagAction !== undefined) {
        applyFlag(flagAction, true);
        continue;
      }
      const negated = name.startsWith("no-") ? FLAG_OPTIONS.get(name.slice(3)) : undefined;
      if (negated !== undefined) {
        applyFlag(negated, false);
        continue;
      }
      warn(`Ignored unsupported option ${label}`);
      continue;
    }

    // Short options, possibly combined (-sSL) or with an attached value (-XPOST).
    for (let j = 1; j < tok.length; j++) {
      const letter = tok[j];
      const label = `-${letter}`;
      const long = SHORT_OPTIONS.get(letter);
      if (long === undefined) {
        warn(`Ignored unsupported option ${label}`);
        continue;
      }
      const argAction = ARG_OPTIONS.get(long);
      if (argAction !== undefined) {
        const rest = tok.slice(j + 1);
        const value = rest !== "" ? rest : tokens[i++];
        if (value === undefined) warn(`Option ${label} requires a value`);
        else applyArg(argAction, value, label);
        break;
      }
      const flagAction = FLAG_OPTIONS.get(long);
      if (flagAction !== undefined) applyFlag(flagAction, true);
    }
  }

  let rawUrl = st.explicitUrl;
  for (const extra of positional) {
    if (rawUrl === undefined) rawUrl = extra;
    else if (extra !== rawUrl) warn(`Ignored extra argument ${extra}`);
  }
  if (!rawUrl) return errorResult(NO_URL_ERROR);

  let url = normalizeUrl(rawUrl);
  let auth = st.auth;
  // fetch() rejects credentials embedded in the URL; lift them into auth.
  const userInfo = /^([a-z][a-z0-9+.-]*:\/\/)([^/?#@]*)@/i.exec(url);
  if (userInfo) {
    url = userInfo[1] + url.slice(userInfo[0].length);
    if (!auth) {
      const colon = userInfo[2].indexOf(":");
      auth =
        colon >= 0
          ? { user: safeDecode(userInfo[2].slice(0, colon)), password: safeDecode(userInfo[2].slice(colon + 1)) }
          : { user: safeDecode(userInfo[2]), password: "" };
    }
  }

  let body: string | undefined;
  if (dataParts.length > 0) {
    body = dataParts
      .map((part, idx) => (idx === 0 ? "" : part.isJson && dataParts[idx - 1].isJson ? "" : "&") + part.text)
      .join("");
  }

  if (st.jsonUsed) {
    if (headers.get("Content-Type") === undefined) headers.set("Content-Type", "application/json");
    if (headers.get("Accept") === undefined) headers.set("Accept", "application/json");
  }

  if (st.useGet && body !== undefined) {
    url = appendQuery(url, body);
    body = undefined;
  }

  if (form.length > 0 && body !== undefined) {
    warn("Both data (-d) and form (-F) options were given; only the form fields are used.");
  }

  const method =
    st.methodOverride ??
    (st.useHead ? "HEAD" : st.useGet ? "GET" : body !== undefined || form.length > 0 ? "POST" : "GET");

  const result: ParsedCurl = { url, method, headers: headers.toRecord() };
  if (body !== undefined) result.body = body;
  if (form.length > 0) result.form = form;
  if (auth) result.auth = auth;
  if (st.insecure) result.insecure = true;
  if (st.followRedirects) result.followRedirects = true;
  if (warnings.length > 0) result.warnings = warnings;
  return result;
}

// ---------------------------------------------------------------------------
// JSON body handling (number lexemes and key order preserved verbatim)
// ---------------------------------------------------------------------------

type JsonNode =
  | { kind: "object"; entries: [string, JsonNode][] }
  | { kind: "array"; items: JsonNode[] }
  | { kind: "string"; value: string }
  | { kind: "number"; raw: string }
  | { kind: "boolean"; value: boolean }
  | { kind: "null" };

const JSON_NUMBER_RE = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y;

/** Parses a JSON object/array body; returns undefined for anything else. */
function parseJsonBody(text: string): JsonNode | undefined {
  let pos = 0;
  const fail = (): never => {
    throw new SyntaxError("Invalid JSON");
  };
  const skipWs = () => {
    while (pos < text.length && (text[pos] === " " || text[pos] === "\t" || text[pos] === "\n" || text[pos] === "\r")) {
      pos++;
    }
  };
  const readString = (): string => {
    const start = pos;
    pos++;
    while (pos < text.length && text[pos] !== '"') pos += text[pos] === "\\" ? 2 : 1;
    if (pos >= text.length) fail();
    pos++;
    // JSON.parse validates escapes and rejects raw control characters.
    return JSON.parse(text.slice(start, pos)) as string;
  };
  const readValue = (): JsonNode => {
    skipWs();
    const ch = text[pos];
    if (ch === "{") {
      pos++;
      const entries: [string, JsonNode][] = [];
      skipWs();
      if (text[pos] === "}") {
        pos++;
        return { kind: "object", entries };
      }
      for (;;) {
        skipWs();
        if (text[pos] !== '"') fail();
        const key = readString();
        skipWs();
        if (text[pos] !== ":") fail();
        pos++;
        entries.push([key, readValue()]);
        skipWs();
        if (text[pos] === ",") {
          pos++;
          continue;
        }
        if (text[pos] === "}") {
          pos++;
          return { kind: "object", entries };
        }
        return fail();
      }
    }
    if (ch === "[") {
      pos++;
      const items: JsonNode[] = [];
      skipWs();
      if (text[pos] === "]") {
        pos++;
        return { kind: "array", items };
      }
      for (;;) {
        items.push(readValue());
        skipWs();
        if (text[pos] === ",") {
          pos++;
          continue;
        }
        if (text[pos] === "]") {
          pos++;
          return { kind: "array", items };
        }
        return fail();
      }
    }
    if (ch === '"') return { kind: "string", value: readString() };
    if (text.startsWith("true", pos)) {
      pos += 4;
      return { kind: "boolean", value: true };
    }
    if (text.startsWith("false", pos)) {
      pos += 5;
      return { kind: "boolean", value: false };
    }
    if (text.startsWith("null", pos)) {
      pos += 4;
      return { kind: "null" };
    }
    JSON_NUMBER_RE.lastIndex = pos;
    const match = JSON_NUMBER_RE.exec(text);
    if (!match) return fail();
    pos += match[0].length;
    return { kind: "number", raw: match[0] };
  };

  try {
    const root = readValue();
    skipWs();
    if (pos !== text.length) return undefined;
    return root.kind === "object" || root.kind === "array" ? root : undefined;
  } catch {
    return undefined;
  }
}

interface LiteralDialect {
  indent: string;
  key: (key: string) => string;
  true: string;
  false: string;
  null: string;
}

/** Double-quoted string literal valid in JavaScript, Python and Go. */
const str = (value: string): string => JSON.stringify(value);

const JS_IDENTIFIER_RE = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

function jsKey(key: string): string {
  // A literal `__proto__:` key would set the prototype instead of a property.
  if (key === "__proto__") return `[${str(key)}]`;
  return JS_IDENTIFIER_RE.test(key) ? key : str(key);
}

const JS_DIALECT: LiteralDialect = { indent: "  ", key: jsKey, true: "true", false: "false", null: "null" };
const PY_DIALECT: LiteralDialect = { indent: "    ", key: str, true: "True", false: "False", null: "None" };

const INLINE_ARRAY_MAX = 60;

function printLiteral(node: JsonNode, d: LiteralDialect, level: number): string {
  switch (node.kind) {
    case "string":
      return str(node.value);
    case "number":
      return node.raw;
    case "boolean":
      return node.value ? d.true : d.false;
    case "null":
      return d.null;
    case "array": {
      if (node.items.length === 0) return "[]";
      if (node.items.every((item) => item.kind !== "object" && item.kind !== "array")) {
        const inline = `[${node.items.map((item) => printLiteral(item, d, level)).join(", ")}]`;
        if (inline.length <= INLINE_ARRAY_MAX) return inline;
      }
      const pad = d.indent.repeat(level + 1);
      const lines = node.items.map((item) => `${pad}${printLiteral(item, d, level + 1)},`);
      return `[\n${lines.join("\n")}\n${d.indent.repeat(level)}]`;
    }
    case "object": {
      if (node.entries.length === 0) return "{}";
      const pad = d.indent.repeat(level + 1);
      const lines = node.entries.map(([key, value]) => `${pad}${d.key(key)}: ${printLiteral(value, d, level + 1)},`);
      return `{\n${lines.join("\n")}\n${d.indent.repeat(level)}}`;
    }
  }
}

// ---------------------------------------------------------------------------
// Shared request model for the generators
// ---------------------------------------------------------------------------

interface RequestModel {
  url: string;
  method: string;
  /** Explicit headers (multipart Content-Type dropped for forms; the client sets the boundary). */
  headers: [string, string][];
  /** Content-Type curl would send implicitly for a -d body without one. */
  implicitContentType?: string;
  /** Basic auth, unless an explicit Authorization header overrides it (as in curl). */
  auth?: CurlAuth;
  body?: string;
  json?: JsonNode;
  form?: CurlFormField[];
  insecure: boolean;
}

function hasHeader(headers: [string, string][], name: string): boolean {
  const lower = name.toLowerCase();
  return headers.some(([key]) => key.toLowerCase() === lower);
}

function buildModel(parsed: ParsedCurl): RequestModel {
  const form = parsed.form && parsed.form.length > 0 ? parsed.form : undefined;
  let headers = Object.entries(parsed.headers);
  if (form) {
    headers = headers.filter(
      ([key, value]) => !(key.toLowerCase() === "content-type" && /^multipart\/form-data/i.test(value)),
    );
  }
  const body = form ? undefined : parsed.body;
  const json = body !== undefined ? parseJsonBody(body) : undefined;
  const model: RequestModel = {
    url: parsed.url,
    method: parsed.method.toUpperCase(),
    headers,
    body,
    json,
    form,
    insecure: parsed.insecure === true,
  };
  if (body !== undefined && !hasHeader(headers, "Content-Type")) {
    model.implicitContentType = json ? "application/json" : "application/x-www-form-urlencoded";
  }
  if (parsed.auth && !hasHeader(headers, "Authorization")) model.auth = parsed.auth;
  return model;
}

function headersWithImplicit(model: RequestModel): [string, string][] {
  return model.implicitContentType
    ? [...model.headers, ["Content-Type", model.implicitContentType]]
    : model.headers;
}

function singleLine(text: string): string {
  return text.replace(/[\r\n]+/g, " ");
}

function basename(path: string): string {
  const parts = path.split(/[\\/]/);
  return parts[parts.length - 1] || path;
}

// ---------------------------------------------------------------------------
// JavaScript fetch
// ---------------------------------------------------------------------------

export function generateFetch(parsed: ParsedCurl): string {
  if (parsed.error) return "";
  const model = buildModel(parsed);
  const headers = headersWithImplicit(model);
  const lines: string[] = [];

  if (model.insecure) {
    lines.push("// fetch cannot skip TLS verification (curl -k); configure it on your server/agent instead.");
  }

  if (model.form) {
    lines.push("const form = new FormData();");
    for (const field of model.form) {
      if (field.isFile) {
        lines.push(`form.append(${str(field.name)}, fileInput.files[0]); // @${singleLine(field.value)}`);
      } else {
        lines.push(`form.append(${str(field.name)}, ${str(field.value)});`);
      }
    }
    lines.push("");
  }

  const options: string[] = [];
  if (model.method !== "GET") options.push(`  method: ${str(model.method)},`);
  if (headers.length > 0 || model.auth) {
    options.push("  headers: {");
    for (const [key, value] of headers) options.push(`    ${jsKey(key)}: ${str(value)},`);
    if (model.auth) {
      options.push(`    Authorization: "Basic " + btoa(${str(`${model.auth.user}:${model.auth.password}`)}),`);
    }
    options.push("  },");
  }
  if (model.form) {
    options.push("  body: form,");
  } else if (model.json) {
    options.push(`  body: JSON.stringify(${printLiteral(model.json, JS_DIALECT, 1)}),`);
  } else if (model.body !== undefined) {
    options.push(`  body: ${str(model.body)},`);
  }

  if (options.length === 0) {
    lines.push(`const response = await fetch(${str(model.url)});`);
  } else {
    lines.push(`const response = await fetch(${str(model.url)}, {`, ...options, "});");
  }
  lines.push("");

  if (model.method === "HEAD") {
    lines.push("console.log(response.status);");
  } else {
    const expectsJson = headers.some(
      ([key, value]) => /^(accept|content-type)$/i.test(key) && /json/i.test(value),
    );
    lines.push(`const data = await response.${expectsJson ? "json" : "text"}();`, "console.log(data);");
  }
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Python requests
// ---------------------------------------------------------------------------

const PY_METHOD_FUNCTIONS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]);

function pyDict(entries: [string, string][]): string {
  if (entries.length === 0) return "{}";
  return `{\n${entries.map(([key, value]) => `    ${str(key)}: ${value},`).join("\n")}\n}`;
}

export function generatePythonRequests(parsed: ParsedCurl): string {
  if (parsed.error) return "";
  const model = buildModel(parsed);
  // requests sets Content-Type itself for json=.
  const headers = model.json ? model.headers : headersWithImplicit(model);
  const lines: string[] = ["import requests", "", `url = ${str(model.url)}`, ""];
  const kwargs: string[] = [];

  if (headers.length > 0) {
    lines.push(`headers = ${pyDict(headers.map(([key, value]): [string, string] => [key, str(value)]))}`, "");
    kwargs.push("headers=headers");
  }

  if (model.form) {
    const files = model.form.filter((field) => field.isFile);
    const texts = model.form.filter((field) => !field.isFile);
    if (files.length > 0) {
      if (texts.length > 0) {
        lines.push(`data = ${pyDict(texts.map((f): [string, string] => [f.name, str(f.value)]))}`, "");
        kwargs.push("data=data");
      }
      lines.push(`files = ${pyDict(files.map((f): [string, string] => [f.name, `open(${str(f.value)}, "rb")`]))}`, "");
    } else {
      lines.push(
        "# (None, value) tuples make requests send multipart/form-data, like curl -F.",
        `files = ${pyDict(texts.map((f): [string, string] => [f.name, `(None, ${str(f.value)})`]))}`,
        "",
      );
    }
    kwargs.push("files=files");
  } else if (model.json) {
    lines.push(`payload = ${printLiteral(model.json, PY_DIALECT, 0)}`, "");
    kwargs.push("json=payload");
  } else if (model.body !== undefined) {
    lines.push(`data = ${str(model.body)}`, "");
    kwargs.push("data=data");
  }

  if (model.auth) kwargs.push(`auth=(${str(model.auth.user)}, ${str(model.auth.password)})`);
  if (model.insecure) kwargs.push("verify=False");

  const fn = PY_METHOD_FUNCTIONS.has(model.method) ? `requests.${model.method.toLowerCase()}` : "requests.request";
  const args = fn === "requests.request" ? [str(model.method), "url", ...kwargs] : ["url", ...kwargs];
  if (kwargs.length > 2) {
    lines.push(`response = ${fn}(`, ...args.map((arg) => `    ${arg},`), ")");
  } else {
    lines.push(`response = ${fn}(${args.join(", ")})`);
  }
  lines.push("print(response.status_code)", "print(response.text)");
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Go net/http
// ---------------------------------------------------------------------------

/** Raw string literal when possible (no backtick, CR or NUL), else interpreted. */
function goStringLiteral(value: string): string {
  const rawOk = !value.includes("`") && !value.includes("\r") && !value.includes("\0");
  return rawOk ? `\`${value}\`` : str(value);
}

const GO_FATAL = ["\tif err != nil {", "\t\tlog.Fatal(err)", "\t}"];

export function generateGoHttp(parsed: ParsedCurl): string {
  if (parsed.error) return "";
  const model = buildModel(parsed);
  const imports = new Set(["fmt", "io", "log", "net/http"]);
  const body: string[] = [];
  let bodyVar = "nil";

  if (model.form) {
    imports.add("bytes");
    imports.add("mime/multipart");
    body.push("\tbody := &bytes.Buffer{}", "\twriter := multipart.NewWriter(body)");
    const fileCount = model.form.filter((field) => field.isFile).length;
    let fileIndex = 0;
    for (const field of model.form) {
      if (!field.isFile) {
        body.push(
          `\tif err := writer.WriteField(${str(field.name)}, ${str(field.value)}); err != nil {`,
          "\t\tlog.Fatal(err)",
          "\t}",
        );
        continue;
      }
      imports.add("os");
      fileIndex++;
      const suffix = fileCount > 1 ? String(fileIndex) : "";
      const fileVar = `file${suffix}`;
      const partVar = `part${suffix}`;
      body.push(
        `\t${fileVar}, err := os.Open(${str(field.value)})`,
        ...GO_FATAL,
        `\tdefer ${fileVar}.Close()`,
        `\t${partVar}, err := writer.CreateFormFile(${str(field.name)}, ${str(basename(field.value))})`,
        ...GO_FATAL,
        `\tif _, err := io.Copy(${partVar}, ${fileVar}); err != nil {`,
        "\t\tlog.Fatal(err)",
        "\t}",
      );
    }
    body.push("\tif err := writer.Close(); err != nil {", "\t\tlog.Fatal(err)", "\t}", "");
    bodyVar = "body";
  } else if (model.body !== undefined) {
    imports.add("strings");
    body.push(`\tbody := strings.NewReader(${goStringLiteral(model.body)})`);
    bodyVar = "body";
  }

  body.push(`\treq, err := http.NewRequest(${str(model.method)}, ${str(model.url)}, ${bodyVar})`, ...GO_FATAL);
  for (const [key, value] of headersWithImplicit(model)) {
    // Go ignores a "Host" header; the request field controls it.
    if (key.toLowerCase() === "host") body.push(`\treq.Host = ${str(value)}`);
    else body.push(`\treq.Header.Set(${str(key)}, ${str(value)})`);
  }
  if (model.form) body.push('\treq.Header.Set("Content-Type", writer.FormDataContentType())');
  if (model.auth) body.push(`\treq.SetBasicAuth(${str(model.auth.user)}, ${str(model.auth.password)})`);
  body.push("");

  if (model.insecure) {
    imports.add("crypto/tls");
    body.push(
      "\tclient := &http.Client{",
      "\t\tTransport: &http.Transport{",
      "\t\t\tTLSClientConfig: &tls.Config{InsecureSkipVerify: true},",
      "\t\t},",
      "\t}",
      "\tresp, err := client.Do(req)",
    );
  } else {
    body.push("\tresp, err := http.DefaultClient.Do(req)");
  }
  body.push(
    ...GO_FATAL,
    "\tdefer resp.Body.Close()",
    "",
    "\trespBody, err := io.ReadAll(resp.Body)",
    ...GO_FATAL,
    '\tfmt.Printf("%s\\n", respBody)',
  );

  const importLines = [...imports].sort().map((path) => `\t"${path}"`);
  return ["package main", "", "import (", ...importLines, ")", "", "func main() {", ...body, "}"].join("\n");
}
