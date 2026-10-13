import { describe, expect, it } from "vitest";
import {
  analyzeCodeEvidence,
  evidenceDirectives,
  extractRuleLines,
  findRuleFiles,
  pickExampleExcerpt,
  selectEvidenceFiles,
  type SourceSample,
} from "../codeEvidence";

const component = (name: string) => `import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/format-date";
import type { User } from "@/lib/types";

export interface ${name}Props {
  user: User;
}

export function ${name}({ user }: ${name}Props) {
  return <Button>{formatDate(user.createdAt)}</Button>;
}
`;

const serviceModule = (name: string) => `import { logger } from "@/lib/logger";
import { NotFoundError } from "@/lib/errors";
import { z } from "zod";

export interface ${name}Input {
  id: string;
}

const schema = z.object({ id: z.string() });

export async function load${name}(input: ${name}Input): Promise<string> {
  const parsed = schema.parse(input);
  if (!parsed.id) {
    throw new NotFoundError("missing");
  }
  logger.info("loaded", parsed.id);
  const value = parsed.id.trim();
  const upper = value.toUpperCase();
  const lower = value.toLowerCase();
  const joined = [upper, lower].join("-");
  return joined;
}
`;

const errors = `export class NotFoundError extends Error {}
export class ValidationError extends Error {}
`;

const test = `import { describe, expect, it } from "vitest";
import { loadUser } from "../load-user";

describe("loadUser", () => {
  it("loads", async () => {
    expect(await loadUser({ id: "a" })).toBe("A-a");
  });
});
`;

const paths = [
  "src/app/page.tsx",
  "src/app/layout.tsx",
  "src/components/UserCard.tsx",
  "src/components/UserList.tsx",
  "src/components/ProfileHeader.tsx",
  "src/components/SettingsPanel.tsx",
  "src/components/AvatarBadge.tsx",
  "src/lib/load-user.ts",
  "src/lib/load-team.ts",
  "src/lib/format-date.ts",
  "src/lib/save-team.ts",
  "src/lib/errors.ts",
  "src/lib/user-store.ts",
  "src/lib/__tests__/load-user.test.ts",
  "src/lib/__tests__/load-team.test.ts",
  "src/lib/__tests__/format-date.test.ts",
  "node_modules/react/index.js",
  "dist/bundle.js",
];

const samples: SourceSample[] = [
  ...["UserCard", "UserList", "ProfileHeader", "SettingsPanel", "AvatarBadge"].map((n) => ({ path: `src/components/${n}.tsx`, content: component(n) })),
  { path: "src/lib/load-user.ts", content: serviceModule("User") },
  { path: "src/lib/load-team.ts", content: serviceModule("Team") },
  { path: "src/lib/save-team.ts", content: serviceModule("Save") },
  { path: "src/lib/errors.ts", content: errors },
  { path: "src/lib/__tests__/load-user.test.ts", content: test },
];

describe("selectEvidenceFiles", () => {
  it("skips dependencies, build output and declarations, and spreads across folders", () => {
    const picked = selectEvidenceFiles(
      [
        ...paths.map((path) => ({ path, size: 2000 })),
        { path: "src/types.d.ts", size: 2000 },
        { path: "src/lib/huge.ts", size: 500_000 },
        { path: ".github/scripts/x.ts", size: 2000 },
      ],
      6
    );
    expect(picked).toHaveLength(6);
    expect(picked.some((p) => p.startsWith("node_modules") || p.startsWith("dist") || p.endsWith(".d.ts") || p.endsWith("huge.ts"))).toBe(false);
    expect(picked.filter((p) => p.startsWith("src/components/")).length).toBeGreaterThan(0);
    expect(picked.filter((p) => p.startsWith("src/lib/") && !p.includes("__tests__")).length).toBeGreaterThan(0);
    expect(picked.some((p) => p.includes("__tests__"))).toBe(true);
  });
});

describe("findRuleFiles / extractRuleLines", () => {
  it("finds existing AI rule files at the root and in rule folders", () => {
    expect(findRuleFiles(["README.md", "AGENTS.md", ".cursor/rules/api.mdc", "CLAUDE.md", "docs/CLAUDE.md"])).toEqual(["CLAUDE.md", "AGENTS.md", ".cursor/rules/api.mdc"]);
  });

  it("keeps short rule bullets and drops index links, code and frontmatter", () => {
    const rules = extractRuleLines(
      "---\ndescription: x\n---\n# Rules\n- Use pnpm for every install and script\n- [MEMORY.md](./MEMORY.md) — context\n- ok\n```\n- inside code fence is ignored entirely\n```\n1. Run the type checker before committing"
    );
    expect(rules).toEqual(["Use pnpm for every install and script", "Run the type checker before committing"]);
  });
});

describe("analyzeCodeEvidence", () => {
  const evidence = analyzeCodeEvidence({
    paths,
    samples,
    ruleFiles: [{ path: "CLAUDE.md", content: "- Never edit generated files in src/gen by hand" }],
  });
  const byTopic = (topic: string) => evidence.findings.filter((f) => f.topic === topic);

  it("finds the test layout and runner", () => {
    expect(byTopic("Tests")[0].rule).toBe("Put tests in a `__tests__/` folder next to the code they cover, named `*.test.ts`, using Vitest");
  });

  it("finds component and module naming separately", () => {
    const rules = byTopic("File naming").map((f) => f.rule);
    expect(rules).toContain("Name component files in PascalCase, like `UserCard.tsx`");
    expect(rules).toContain("Name modules in kebab-case, like `user-card.ts`");
  });

  it("finds the import alias, named exports, logger, error classes and validation", () => {
    expect(byTopic("Imports")[0].rule).toContain("`@/` alias");
    expect(byTopic("Exports")[0].rule).toContain("named exports");
    expect(byTopic("Exports")[0].rule).toContain(", such as pages and layouts");
    expect(byTopic("Logging")[0].rule).toContain("`@/lib/logger`");
    expect(byTopic("Errors")[0].rule).toContain("`NotFoundError`, `ValidationError`");
    expect(byTopic("Validation")[0].rule).toContain("zod");
    expect(byTopic("Types").map((f) => f.rule)).toEqual(
      expect.arrayContaining(["Do not use `any`; type values precisely or use `unknown` and narrow it", "Declare object shapes with `interface`"])
    );
    expect(byTopic("Components")[0].rule).toContain("Server Components");
  });

  it("quotes a real function and builds the anti-pattern from the findings", () => {
    expect(evidence.exampleGood).toMatch(/^\/\/ From src\/lib\/(load-user|load-team|save-team)\.ts\nexport async function load/);
    expect(evidence.exampleBad).toContain("// Breaks this repository's conventions");
    expect(evidence.exampleBad).toContain('throw new Error("not found"); // throw NotFoundError');
    expect(evidence.exampleBad).toContain("console.log");
  });

  it("writes each finding as a directive with its evidence, then carries over existing rules", () => {
    const lines = evidenceDirectives(evidence);
    expect(lines[0]).toMatch(/^- Tests: Put tests .+ \(3 test files, e\.g\. `src\/lib\/__tests__\/load-user\.test\.ts`\)\.$/);
    expect(lines.slice(-2)).toEqual(["- Existing rules: keep following `CLAUDE.md`; key points carried over:", "  - Never edit generated files in src/gen by hand"]);
  });

  it("states nothing without enough evidence", () => {
    const thin = analyzeCodeEvidence({ paths: ["src/a.ts"], samples: [{ path: "src/a.ts", content: "export const a = 1;\n" }] });
    expect(thin.findings).toEqual([]);
    expect(thin.exampleBad).toBeUndefined();
  });

  it("reads Python conventions", () => {
    const py = (name: string) => `import logging
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class ${name}NotFound(Exception):
    pass


def load_${name.toLowerCase()}(item_id: str) -> str:
    logger.info("loading %s", item_id)
    value = item_id.strip()
    if not value:
        raise ${name}NotFound(item_id)
    return value.upper()


def save_${name.toLowerCase()}(item_id: str) -> None:
    logger.info("saving %s", item_id)


def count_${name.toLowerCase()}(items: list[str]) -> int:
    return len(items)
`;
    const pySamples = ["User", "Team", "Order"].map((n) => ({ path: `app/services/${n.toLowerCase()}_service.py`, content: py(n) }));
    const result = analyzeCodeEvidence({
      paths: [...pySamples.map((s) => s.path), "app/services/billing_service.py", "app/core/db_session.py", "tests/__init__.py", "tests/conftest.py", "tests/test_user.py", "tests/test_team.py", "tests/test_order.py"],
      samples: [...pySamples, { path: "tests/test_user.py", content: "import pytest\n\ndef test_x():\n    assert True\n" }],
    });
    const rules = result.findings.map((f) => f.rule);
    expect(rules).toContain("Put tests under `tests/`, named `test_*.py`, using pytest");
    expect(result.findings.find((f) => f.topic === "Tests")).toMatchObject({ support: "3 test files", example: "tests/test_user.py" });
    expect(rules).toContain("Log with `logging.getLogger(__name__)`, not `print`");
    expect(rules).toContain("Annotate every function signature with type hints, including the return type");
    expect(rules.some((r) => r.startsWith("Raise the project's own error classes"))).toBe(false);
    expect(result.exampleGood).toMatch(/^# From app\/services\/\w+_service\.py\ndef /);
  });
});

describe("analyzeCodeEvidence on a library layout", () => {
  const lib = (name: string) => `import { create } from './vanilla'
import type { StoreApi } from './types'
import { shallow } from './shallow'

export type ${name}Options = {
  name: string
}

export function ${name.toLowerCase()}(options: ${name}Options): StoreApi {
  return create(options)
}
`;
  const evidence = analyzeCodeEvidence({
    paths: [
      "src/react.ts", "src/vanilla.ts", "src/shallow.ts", "src/middleware.ts", "src/traditional.ts",
      "tests/basic.test.tsx", "tests/shallow.test.tsx", "tests/vanilla.test.ts", "tests/devtools.test.tsx",
      "examples/demo/src/App.jsx", "examples/demo/src/Scene.jsx", "examples/demo/src/Code.jsx", "examples/demo/src/Details.jsx", "examples/demo/src/Fireflies.jsx",
    ],
    samples: ["React", "Vanilla", "Shallow", "Middleware"].map((n) => ({ path: `src/${n.toLowerCase()}.ts`, content: lib(n) })),
  });

  it("names the test extension the repository actually uses", () => {
    expect(evidence.findings.find((f) => f.topic === "Tests")!.rule).toBe("Put tests under `tests/`, named `*.test.tsx`");
  });

  it("ignores example apps when reading naming conventions", () => {
    expect(evidence.findings.some((f) => f.rule.includes("component files"))).toBe(false);
  });

  it("writes the opposite style as the formatting anti-pattern", () => {
    expect(evidence.findings.find((f) => f.topic === "Formatting")!.rule).toBe("Use single quotes and no semicolons");
    expect(evidence.exampleBad).toContain(`import { helper } from "./helper"; // single quotes, no semicolons`);
  });
});

describe("pickExampleExcerpt", () => {
  it("never quotes a file that looks like it holds a credential", () => {
    const leaky = { path: "src/lib/client.ts", content: `const apiKey = "sk-abcdefghijklmnopqrstuvwxyz123456";\n${serviceModule("Client")}` };
    expect(pickExampleExcerpt([leaky], "ts")).toBeUndefined();
  });
});
