import { describe, expect, it } from "vitest";
import { GUIDE_STEPS, resolveGuideSteps } from "../studioGuide";

const present = (selectors: string[]) => (selector: string) => selectors.includes(selector);

const STANDARD_PAGE = [
  '[data-tour="presets"]',
  '[data-tour="format"]',
  '[data-section="identity"]',
  '[data-section="techStack"]',
  '[data-section="conventions"]',
  '[data-tour="editor"]',
  '[data-tour="audit"]',
  '[data-tour="export"]',
];

describe("resolveGuideSteps", () => {
  it("walks every step in order on a standard skill format", () => {
    const steps = resolveGuideSteps(present(STANDARD_PAGE));
    expect(steps.map((s) => s.id)).toEqual(["presets", "format", "details", "stack", "rules", "editor", "audit", "export"]);
    expect(steps.find((s) => s.id === "details")?.title).toBe("Name it and say when to use it");
  });

  it("adapts the details step to governance formats and skips cards they hide", () => {
    const steps = resolveGuideSteps(
      present(['[data-tour="format"]', '[data-tour="governance"]', '[data-tour="editor"]', '[data-tour="export"]'])
    );
    expect(steps.map((s) => s.id)).toEqual(["format", "details", "editor", "export"]);
    expect(steps[1].selector).toBe('[data-tour="governance"]');
    expect(steps[1].title).toBe("Fill in each section");
  });

  it("prefers the first matching target when several exist", () => {
    const steps = resolveGuideSteps(present(['[data-section="identity"]', '[data-tour="mcp"]']));
    expect(steps).toHaveLength(1);
    expect(steps[0].selector).toBe('[data-section="identity"]');
  });

  it("returns nothing when no anchors are on the page", () => {
    expect(resolveGuideSteps(() => false)).toEqual([]);
  });

  it("keeps form steps before editor steps so mobile switches tabs only once", () => {
    const tabs = GUIDE_STEPS.map((s) => s.tab);
    expect(tabs.lastIndexOf("form")).toBeLessThan(tabs.indexOf("editor"));
  });
});
