/**
 * First-run guide for AI Skill Studio: the ordered walkthrough the floating helper drives with driver.js.
 * Steps point at existing studio elements (data-tour / data-section attributes), so the guide never adds layout.
 */

/** Which mobile tab must be visible for a step's element (the studio shows form and editor as tabs below lg). */
export type GuideTab = "form" | "editor";
export type GuideSide = "top" | "right" | "bottom" | "left";

export interface GuideTarget {
  selector: string;
  title: string;
  description: string;
}

export interface GuideStepSpec {
  id: string;
  tab: GuideTab;
  /** Desktop popover placement; below lg the popover is a bottom sheet instead. */
  side: GuideSide;
  /** First target whose element exists wins; lets one step adapt to the selected format. */
  targets: GuideTarget[];
}

export interface ResolvedGuideStep {
  id: string;
  tab: GuideTab;
  side: GuideSide;
  selector: string;
  title: string;
  description: string;
}

export const GUIDE_STORAGE_KEY = "ai_skill_studio_guide_v1";

export interface GuideState {
  seen: boolean;
}

export const GUIDE_STEPS: readonly GuideStepSpec[] = [
  {
    id: "presets",
    tab: "form",
    side: "bottom",
    targets: [
      {
        selector: '[data-tour="presets"]',
        title: "Start from a preset",
        description: "Each preset fills the studio with a ready-made setup. Pick the one closest to your project, then adjust it.",
      },
    ],
  },
  {
    id: "format",
    tab: "form",
    side: "right",
    targets: [
      {
        selector: '[data-tour="format"]',
        title: "Pick the file to create",
        description: "SKILL.md for Claude, .mdc for Cursor, AGENTS.md for most coding agents, and more. Not sure? Start with SKILL.md.",
      },
    ],
  },
  {
    id: "details",
    tab: "form",
    side: "right",
    targets: [
      {
        selector: '[data-section="identity"]',
        title: "Name it and say when to use it",
        description: "Give it a name and a clear description. The AI reads the description to decide when this file applies.",
      },
      {
        selector: '[data-tour="governance"]',
        title: "Fill in each section",
        description: "Each card is one section of the document. The editor updates as you type.",
      },
      {
        selector: '[data-tour="mcp"]',
        title: "Set up the server",
        description: "Pick an MCP server preset, then adjust its command, arguments and environment variables.",
      },
      {
        selector: '[data-section="ignoreProfile"]',
        title: "Choose what the AI can't see",
        description: "Pick a profile to keep secrets, build output and lockfiles out of the AI's context.",
      },
    ],
  },
  {
    id: "stack",
    tab: "form",
    side: "right",
    targets: [
      {
        selector: '[data-section="techStack"]',
        title: "Tell it your stack",
        description:
          "Set your framework, language and database. Have a project already? Read your code pulls the stack, naming, test layout, error handling and real examples from a GitHub repo or local folder, in the browser.",
      },
    ],
  },
  {
    id: "rules",
    tab: "form",
    side: "right",
    targets: [
      {
        selector: '[data-section="conventions"]',
        title: "Choose the rules",
        description: "Switch on the conventions the AI should follow. Guardrails and procedures are just below.",
      },
    ],
  },
  {
    id: "editor",
    tab: "editor",
    side: "left",
    targets: [
      {
        selector: '[data-tour="editor"]',
        title: "Your file, live",
        description: "This updates as you change settings. You can also edit it directly.",
      },
    ],
  },
  {
    id: "audit",
    tab: "editor",
    side: "top",
    targets: [
      {
        selector: '[data-tour="audit"]',
        title: "Check the score",
        description: "The audit grades your file out of 100. Open it to see what's weak and fix most issues in one click.",
      },
    ],
  },
  {
    id: "export",
    tab: "editor",
    side: "bottom",
    targets: [
      {
        selector: '[data-tour="export"]',
        title: "Take it to your project",
        description: "Copy it, download it, get a one-line install command, or export a ZIP with every file in the right folder.",
      },
    ],
  },
];

/** Keeps the steps whose element is on the page, using the first matching target of each. */
export function resolveGuideSteps(
  exists: (selector: string) => boolean,
  specs: readonly GuideStepSpec[] = GUIDE_STEPS
): ResolvedGuideStep[] {
  const resolved: ResolvedGuideStep[] = [];
  for (const spec of specs) {
    const target = spec.targets.find((t) => exists(t.selector));
    if (!target) continue;
    resolved.push({ id: spec.id, tab: spec.tab, side: spec.side, ...target });
  }
  return resolved;
}
