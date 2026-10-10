import { describe, expect, it } from "vitest";
import { generateSafeSlug, SAFE_SLUG_REGEX } from "../slugUtils";
import { decodeStudioState, encodeStudioState } from "../stateSharing";

describe("generateSafeSlug", () => {
  it.each([
    ["FastAPI Enterprise Architect", "fastapi-enterprise-architect"],
    ["Café Résumé", "cafe-resume"],
    ["../../etc/passwd", "etc-passwd"],
    ["a\\b/c.d_e", "a-b-c-d-e"],
    ["---", "custom-skill"],
    ["", "custom-skill"],
  ])("%s -> %s", (input, expected) => {
    expect(generateSafeSlug(input)).toBe(expected);
  });

  it("always returns a POSIX-safe slug of at most 48 chars", () => {
    for (const input of ["x".repeat(200), "🔥 emoji only 🔥", "UPPER lower 123", "a- -b"]) {
      const slug = generateSafeSlug(input);
      expect(slug.length).toBeLessThanOrEqual(48);
      expect(slug).toMatch(SAFE_SLUG_REGEX);
    }
  });
});

describe("studio state sharing", () => {
  it("round-trips workspace state", async () => {
    const state = { skillName: "my-skill", skillTitle: "My Skill", format: "claude_md", behaviors: ["a", "b"] };
    const encoded = await encodeStudioState(state);
    const decoded = await decodeStudioState(`#share=${encoded}`);
    expect(decoded).toMatchObject(state);
  });

  it("never leaks MCP env values into share links", async () => {
    const encoded = await encodeStudioState({ skillName: "x", mcpEnvValue: "ghp_supersecret" });
    const decoded = await decodeStudioState(`#share=${encoded}`);
    expect(decoded?.mcpEnvValue).toBeUndefined();
  });
});
