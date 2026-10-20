/**
 * Skill Graph connector endpoint: https://www.devscratchpad.tech/graph/mcp
 *
 * A stateless MCP server over Streamable HTTP, without sign-in. The only route on this site that
 * receives user content: graphs are checked or compiled in memory and the answer goes straight back.
 * Nothing is stored, and only the names of the tools called are logged (an anonymous usage count).
 */
import { CONNECTOR_TOOLS } from "../lib/graphConnector";
import { INVALID_REQUEST, PARSE_ERROR, SUPPORTED_PROTOCOL_VERSIONS, calledToolNames, errorResponse, handleBody } from "../lib/mcpProtocol";

/** Comfortably above the largest graph the parser accepts (500,000 characters), once JSON-escaped. */
const MAX_BODY_LENGTH = 2_000_000;

const DOCS_URL = "https://www.devscratchpad.tech/graph/connector";

/**
 * Browsers send an Origin; Claude's servers and Claude Code do not. A browser page on another site has no
 * business calling the connector, so any Origin outside Claude, this site and local tools is refused.
 */
const ALLOWED_ORIGIN_HOSTS = [/^(.+\.)?claude\.ai$/, /^(.+\.)?claude\.com$/, /^(.+\.)?anthropic\.com$/, /^(www\.)?devscratchpad\.tech$/, /^localhost$/, /^127\.0\.0\.1$/, /^\[::1\]$/];

const KNOWN_TOOLS = new Set(CONNECTOR_TOOLS.map((tool) => tool.name));

function originAllowed(origin: string | null): boolean {
  if (origin === null) return true;
  try {
    const url = new URL(origin);
    return (url.protocol === "https:" || url.protocol === "http:") && ALLOWED_ORIGIN_HOSTS.some((pattern) => pattern.test(url.hostname));
  } catch {
    return false;
  }
}

function baseHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex", "X-Content-Type-Options": "nosniff" };
  if (origin !== null) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Vary"] = "Origin";
  }
  return headers;
}

function json(body: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...baseHeaders(origin), "Content-Type": "application/json" } });
}

function forbidden(origin: string): Response {
  console.warn(`[skill-graph-mcp] refused origin ${origin.slice(0, 200)}`);
  return new Response(JSON.stringify(errorResponse(null, INVALID_REQUEST, "This origin may not call the Skill Graph connector.")), {
    status: 403,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request): Promise<Response> {
  const origin = request.headers.get("origin");
  if (!originAllowed(origin)) return forbidden(origin ?? "");

  const version = request.headers.get("mcp-protocol-version");
  if (version !== null && !SUPPORTED_PROTOCOL_VERSIONS.includes(version)) {
    return json(errorResponse(null, INVALID_REQUEST, `Unsupported MCP-Protocol-Version: ${version.slice(0, 40)}. Supported: ${SUPPORTED_PROTOCOL_VERSIONS.join(", ")}.`), 400, origin);
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_LENGTH) return json(errorResponse(null, INVALID_REQUEST, "The request is too large. Graphs are limited to 500,000 characters."), 413, origin);

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json(errorResponse(null, PARSE_ERROR, "The body is not valid JSON."), 400, origin);
  }

  const tools = calledToolNames(body).filter((name) => KNOWN_TOOLS.has(name));
  if (tools.length > 0) console.info(`[skill-graph-mcp] ${tools.join(",")}`);

  const response = handleBody(body, { studioUrl: new URL("/graph", request.url).toString() });
  if (response === null) return new Response(null, { status: 202, headers: baseHeaders(origin) });
  return json(response, 200, origin);
}

/** No server-to-client stream: every answer comes back on its POST. A person opening the URL gets a pointer to the setup page. */
export function GET(request: Request): Response {
  const origin = request.headers.get("origin");
  if (!originAllowed(origin)) return forbidden(origin ?? "");
  return new Response(`This is the Skill Graph MCP endpoint for Claude. Add it as a custom connector; setup: ${DOCS_URL}\n`, {
    status: 405,
    headers: { ...baseHeaders(origin), Allow: "POST, OPTIONS", "Content-Type": "text/plain; charset=utf-8" },
  });
}

/** There are no sessions to end. */
export function DELETE(request: Request): Response {
  const origin = request.headers.get("origin");
  if (!originAllowed(origin)) return forbidden(origin ?? "");
  return new Response(null, { status: 405, headers: { ...baseHeaders(origin), Allow: "POST, OPTIONS" } });
}

export function OPTIONS(request: Request): Response {
  const origin = request.headers.get("origin");
  if (!originAllowed(origin)) return forbidden(origin ?? "");
  return new Response(null, {
    status: 204,
    headers: {
      ...baseHeaders(origin),
      "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization, Mcp-Protocol-Version, Mcp-Session-Id, Last-Event-ID",
      "Access-Control-Max-Age": "86400",
    },
  });
}
