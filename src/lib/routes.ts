export const ROUTES = {
  home: "/",
  tool: (slug: string) => `/tools/${slug}`,
};

export const SIDEBAR_TO_SLUG: Record<string, string> = {
  "json-formatter": "json-formatter",
  "json-validator": "json-validator",
  "xml-formatter": "xml-formatter",
  "sql-formatter": "sql-formatter",
  "graphql-formatter": "graphql-formatter",
  "minifier": "minifier",
  "curl-to-python": "curl-to-python",
  "curl-to-fetch": "curl-to-fetch",
  "curl-to-go": "curl-to-go",
  "curl-to-javascript": "curl-to-javascript",
  "json-to-ts": "json-to-ts",
  "json-to-zod": "json-to-zod",
  "json-to-go": "json-to-go",
  "svg-to-jsx": "svg-to-jsx",
  "yaml": "yaml",
  "yaml-to-json": "yaml-to-json",
  "json-to-yaml": "json-to-yaml",
  "jwt": "jwt",
  "uuid-generator": "uuid-generator",
  "ai-rules-generator": "ai-rules-generator",
  "hmac-generator": "hmac-generator",
  "cidr-calculator": "cidr-calculator",
  "cron": "cron",
  "diff": "diff",
  "hash": "hash",
  "regex": "regex",
  "base64-inspector": "base64-inspector",
  "cert-decoder": "cert-decoder",
  "ssh-key-generator": "ssh-key-generator",
  "password-hash": "password-hash",
  "json-schema-validator": "json-schema-validator",
  "mock-data-generator": "mock-data-generator",
  "epoch-converter": "epoch-converter",
};

export const SLUG_TO_SIDEBAR: Record<string, string> = {
  ...Object.fromEntries(Object.entries(SIDEBAR_TO_SLUG).map(([k, v]) => [v, k])),
  // Aliases
  "base64": "base64-inspector",
  "x509": "cert-decoder",
  "ssh-keygen": "ssh-key-generator",
  "bcrypt": "password-hash",
};

export function getToolUrl(sidebarId: string): string {
  const slug = SIDEBAR_TO_SLUG[sidebarId] || sidebarId;
  return ROUTES.tool(slug);
}
