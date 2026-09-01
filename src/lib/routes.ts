export const ROUTES = {
  home: "/",
  tool: (slug: string) => `/tools/${slug}`,
};

export const SIDEBAR_TO_SLUG: Record<string, string> = {
  "json-formatter": "json-formatter",
  jwt: "jwt-decoder",
  timestamp: "unix-timestamp",
  curl: "curl-converter",
  diff: "diff-checker",
  "xml-formatter": "xml-formatter",
  "sql-formatter": "sql-formatter",
  base64: "base64-decoder",
  url: "url-encoder",
  hash: "hash-generator",
  regex: "regex-tester",
  "json-to-ts": "json-to-typescript",
  cron: "cron-visualizer",
  yaml: "yaml-json",
  minifier: "css-svg-minifier",
  "graphql-formatter": "graphql-formatter",
  "markdown-previewer": "markdown-previewer",
  "hmac-generator": "hmac-generator",
  "cidr-calculator": "cidr-calculator",
  "svg-to-jsx": "svg-to-jsx",
  "uuid-generator": "uuid-generator",
  "case-converter": "case-converter",
};

export const SLUG_TO_SIDEBAR: Record<string, string> = Object.fromEntries(
  Object.entries(SIDEBAR_TO_SLUG).map(([k, v]) => [v, k])
);

export function getToolUrl(sidebarId: string): string {
  const slug = SIDEBAR_TO_SLUG[sidebarId];
  return slug ? ROUTES.tool(slug) : ROUTES.home;
}
