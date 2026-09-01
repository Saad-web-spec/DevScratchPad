export const ROUTES = {
  home: "/",
  tool: (slug: string) => `/tools/${slug}`,
};

export const SIDEBAR_TO_SLUG: Record<string, string> = {
  "json-formatter": "json-formatter",
  jwt: "jwt-decoder",
  "curl-to-python": "curl-to-python",
  "curl-to-fetch": "curl-to-fetch",
  "curl-to-go": "curl-to-go",
  diff: "diff-checker",
  "xml-formatter": "xml-formatter",
  "sql-formatter": "sql-formatter",
  hash: "hash-generator",
  regex: "regex-tester",
  "json-to-ts": "json-to-typescript",
  "json-to-zod": "json-to-zod",
  "json-to-go": "json-to-go-struct",
  cron: "cron-visualizer",
  yaml: "yaml-json",
  minifier: "css-svg-minifier",
  "graphql-formatter": "graphql-formatter",
  "hmac-generator": "hmac-generator",
  "cidr-calculator": "cidr-calculator",
  "svg-to-jsx": "svg-to-jsx",
  "uuid-generator": "uuid-generator",
};

export const SLUG_TO_SIDEBAR: Record<string, string> = Object.fromEntries(
  Object.entries(SIDEBAR_TO_SLUG).map(([k, v]) => [v, k])
);

export function getToolUrl(sidebarId: string): string {
  const slug = SIDEBAR_TO_SLUG[sidebarId];
  return slug ? ROUTES.tool(slug) : ROUTES.home;
}
