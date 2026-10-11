import { describe, expect, it } from "vitest";
import { inspectDockerCompose } from "../dockerParser";

describe("inspectDockerCompose", () => {
  it("does not mistake block-style service keys (ports:, depends_on:) for services", () => {
    const result = inspectDockerCompose(
      [
        "services:",
        "  web:",
        "    build: .",
        "    ports:",
        '      - "3000:3000"',
        "    depends_on:",
        "      - db",
        "  db:",
        "    image: postgres:16-alpine",
        "    ports:",
        '      - "5432:5432"',
      ].join("\n")
    );
    expect(result.services.map((s) => s.name)).toEqual(["web", "db"]);
    expect(result.services[0].ports).toEqual(["3000:3000"]);
    expect(result.services[0].dependsOn).toEqual(["db"]);
    expect(result.exposedPorts).toEqual(["3000:3000", "5432:5432"]);
  });

  it("handles 4-space indentation", () => {
    const result = inspectDockerCompose(
      ["services:", "    api:", "        image: node:20", "        ports:", '            - "8000:8000"', "    cache:", "        image: redis:7"].join("\n")
    );
    expect(result.services.map((s) => s.name)).toEqual(["api", "cache"]);
    expect(result.services[0].ports).toEqual(["8000:8000"]);
  });

  it("reads flow-style lists on one line", () => {
    const result = inspectDockerCompose(
      ["services:", "  web:", "    build: .", '    ports: ["3000:3000", "9229:9229"]', "    depends_on: [db, cache]", "  db:", "    image: postgres:16"].join("\n")
    );
    expect(result.services.map((s) => s.name)).toEqual(["web", "db"]);
    expect(result.services[0].ports).toEqual(["3000:3000", "9229:9229"]);
    expect(result.services[0].dependsOn).toEqual(["db", "cache"]);
  });

  it("collects top-level named volumes after the services block", () => {
    const result = inspectDockerCompose(
      ["services:", "  db:", "    image: postgres:16", "    volumes:", "      - pgdata:/var/lib/postgresql/data", "volumes:", "  pgdata:"].join("\n")
    );
    expect(result.services).toHaveLength(1);
    expect(result.detectedVolumes).toContain("pgdata");
  });
});
