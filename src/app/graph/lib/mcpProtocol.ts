/**
 * A minimal, stateless MCP server (Streamable HTTP, JSON responses only) for the Skill Graph connector.
 *
 * There are no sessions and no server-to-client messages, so every POST is answered on its own: the
 * route handler passes the parsed body here and sends back what this returns. Kept free of Next.js
 * types so it can be unit tested.
 */
import { CONNECTOR_PROMPTS, CONNECTOR_RESOURCES, CONNECTOR_TOOLS, SERVER_INSTRUCTIONS, callConnectorTool, promptMessage, readConnectorResource, type ConnectorContext } from "./graphConnector";

/** Newest first. A client asking for another version gets the newest, and decides whether it can go on. */
export const SUPPORTED_PROTOCOL_VERSIONS: readonly string[] = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];

export const SERVER_INFO = {
  name: "skill-graph",
  title: "Skill Graph",
  version: "1.2.0",
  websiteUrl: "https://www.devscratchpad.tech/graph/connector",
  icons: [{ src: "https://www.devscratchpad.tech/skill-graph-icon.png", mimeType: "image/png", sizes: ["512x512"] }],
};

type JsonRpcId = string | number | null;

interface JsonRpcError {
  jsonrpc: "2.0";
  id: JsonRpcId;
  error: { code: number; message: string };
}

interface JsonRpcSuccess {
  jsonrpc: "2.0";
  id: JsonRpcId;
  result: unknown;
}

export type JsonRpcResponse = JsonRpcSuccess | JsonRpcError;

export const PARSE_ERROR = -32700;
export const INVALID_REQUEST = -32600;
export const METHOD_NOT_FOUND = -32601;
export const INVALID_PARAMS = -32602;
export const INTERNAL_ERROR = -32603;
export const RESOURCE_NOT_FOUND = -32002;

export function errorResponse(id: JsonRpcId, code: number, message: string): JsonRpcError {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

function success(id: JsonRpcId, result: unknown): JsonRpcSuccess {
  return { jsonrpc: "2.0", id, result };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidId(value: unknown): value is string | number {
  return typeof value === "string" || (typeof value === "number" && Number.isFinite(value));
}

/** Answers one JSON-RPC message. Notifications and client responses get no answer (null). */
export function handleMessage(message: unknown, context: ConnectorContext): JsonRpcResponse | null {
  if (!isRecord(message) || message.jsonrpc !== "2.0") return errorResponse(null, INVALID_REQUEST, "Expected a JSON-RPC 2.0 message.");
  // A response from the client (to a request this server never sends) or a notification: nothing to answer.
  if (typeof message.method !== "string") return "id" in message && ("result" in message || "error" in message) ? null : errorResponse(null, INVALID_REQUEST, "Missing method.");
  if (!("id" in message)) return null;
  if (!isValidId(message.id)) return errorResponse(null, INVALID_REQUEST, "The id must be a string or a number.");

  const id = message.id;
  const params = isRecord(message.params) ? message.params : {};
  switch (message.method) {
    case "initialize": {
      const requested = typeof params.protocolVersion === "string" ? params.protocolVersion : "";
      return success(id, {
        protocolVersion: SUPPORTED_PROTOCOL_VERSIONS.includes(requested) ? requested : SUPPORTED_PROTOCOL_VERSIONS[0],
        capabilities: { tools: { listChanged: false }, prompts: { listChanged: false }, resources: { listChanged: false, subscribe: false } },
        serverInfo: SERVER_INFO,
        instructions: SERVER_INSTRUCTIONS,
      });
    }
    case "ping":
      return success(id, {});
    case "tools/list":
      return success(id, { tools: CONNECTOR_TOOLS });
    case "tools/call": {
      if (typeof params.name !== "string") return errorResponse(id, INVALID_PARAMS, "tools/call needs the tool name in params.name.");
      let result: ReturnType<typeof callConnectorTool>;
      try {
        result = callConnectorTool(params.name, params.arguments, context);
      } catch (error) {
        // A tool that fails on its input answers inside the result (the protocol's "tool execution error"),
        // so Claude can read it and try again. Only the tool and the error's kind are logged, never the graph.
        console.error(`[skill-graph-mcp] ${params.name.slice(0, 64)} failed (${error instanceof Error ? error.name : typeof error})`);
        return success(id, {
          content: [{ type: "text", text: `${params.name} could not process this input. Check that the graph.skill.md is well formed (get_graph_format describes it), or try a smaller graph.` }],
          isError: true,
        });
      }
      if (!result) return errorResponse(id, INVALID_PARAMS, `Unknown tool: ${params.name}. Available: ${CONNECTOR_TOOLS.map((tool) => tool.name).join(", ")}.`);
      return success(id, result);
    }
    case "prompts/list":
      return success(id, { prompts: CONNECTOR_PROMPTS });
    case "prompts/get": {
      const name = typeof params.name === "string" ? params.name : "";
      const prompt = CONNECTOR_PROMPTS.find((item) => item.name === name);
      const body = promptMessage(name, isRecord(params.arguments) ? params.arguments : {});
      if (!prompt || body === null) return errorResponse(id, INVALID_PARAMS, `Unknown prompt: ${name || "(none)"}. Available: ${CONNECTOR_PROMPTS.map((item) => item.name).join(", ")}.`);
      return success(id, { description: prompt.description, messages: [{ role: "user", content: { type: "text", text: body } }] });
    }
    case "resources/list":
      return success(id, { resources: CONNECTOR_RESOURCES });
    case "resources/templates/list":
      return success(id, { resourceTemplates: [] });
    case "resources/read": {
      const uri = typeof params.uri === "string" ? params.uri : "";
      const body = readConnectorResource(uri);
      // -32002 is the protocol's "resource not found".
      if (body === null) return errorResponse(id, RESOURCE_NOT_FOUND, `Unknown resource: ${uri.slice(0, 200) || "(none)"}. resources/list names the ones there are.`);
      return success(id, { contents: [{ uri, mimeType: "text/markdown", text: body }] });
    }
    default:
      return errorResponse(id, METHOD_NOT_FOUND, `Method not supported: ${message.method}.`);
  }
}

/**
 * Answers a POST body: one message, or a batch (allowed by the 2025-03-26 protocol). Returns null when
 * nothing needs an answer, which the route sends as 202 Accepted.
 */
export function handleBody(body: unknown, context: ConnectorContext): JsonRpcResponse | JsonRpcResponse[] | null {
  if (Array.isArray(body)) {
    if (body.length === 0) return errorResponse(null, INVALID_REQUEST, "Empty batch.");
    const responses = body.map((message) => handleMessage(message, context)).filter((response): response is JsonRpcResponse => response !== null);
    return responses.length > 0 ? responses : null;
  }
  return handleMessage(body, context);
}

/** The tool a request calls, for an anonymous usage count; never the arguments. */
export function calledToolNames(body: unknown): string[] {
  const messages = Array.isArray(body) ? body : [body];
  return messages.flatMap((message) =>
    isRecord(message) && message.method === "tools/call" && isRecord(message.params) && typeof message.params.name === "string" ? [message.params.name.slice(0, 64)] : []
  );
}
