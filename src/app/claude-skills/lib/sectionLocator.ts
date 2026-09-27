import { OutputFormat } from "./ruleGenerator";

export interface MarkedSectionRange {
  startLine: number;
  endLine: number;
  label: string;
}

interface SearchRule {
  fieldKeys: string[];
  label: string;
  headerPatterns: RegExp[];
  contentFallbackPatterns?: RegExp[];
}

const SECTION_RULES: SearchRule[] = [
  // PRD.md sections
  {
    fieldKeys: ["prdOverview"],
    label: "Executive Summary & Vision",
    headerPatterns: [/^##\s+1\.\s+Executive Summary/i, /^##\s+Executive Summary/i],
  },
  {
    fieldKeys: ["prdProblemStatement"],
    label: "Problem Statement",
    headerPatterns: [/^##\s+2\.\s+Problem Statement/i, /^##\s+Problem Statement/i],
  },
  {
    fieldKeys: ["prdPersonas"],
    label: "User Personas",
    headerPatterns: [/^##\s+3\.\s+User Personas/i, /^##\s+4\.\s+User Personas/i, /^##\s+Personas/i],
  },
  {
    fieldKeys: ["prdFunctionalReqs"],
    label: "Functional Requirements",
    headerPatterns: [/^##\s+4\.\s+Functional Requirements/i, /^##\s+5\.\s+Functional Requirements/i, /^##\s+Functional/i],
  },
  {
    fieldKeys: ["prdNonFunctionalReqs"],
    label: "Non-Functional Requirements",
    headerPatterns: [/^##\s+5\.\s+Non-Functional Requirements/i, /^##\s+6\.\s+Non-Functional Requirements/i, /^##\s+Non-Functional/i],
  },
  {
    fieldKeys: ["prdMilestones"],
    label: "Milestones & Roadmap",
    headerPatterns: [/^##\s+7\.\s+Milestone/i, /^##\s+Milestone/i, /^##\s+Roadmap/i],
  },

  // DESIGN.md sections
  {
    fieldKeys: ["designTokens"],
    label: "Visual Language & Tokens",
    headerPatterns: [/^##\s+1\.\s+Visual Language/i, /^##\s+Design Tokens/i, /^##\s+Tokens/i],
  },
  {
    fieldKeys: ["designLayout"],
    label: "Component Hierarchy & Layout",
    headerPatterns: [/^##\s+2\.\s+Component Hierarchy/i, /^##\s+Layout/i, /^##\s+Single-Canvas/i],
  },
  {
    fieldKeys: ["designConventions"],
    label: "Core Architectural Conventions",
    headerPatterns: [/^##\s+3\.\s+Core Architectural Conventions/i, /^##\s+Conventions/i],
  },
  {
    fieldKeys: ["designGuardrails"],
    label: "Negative Design Guardrails",
    headerPatterns: [/^##\s+4\.\s+Negative Design Guardrails/i, /^##\s+6\.\s+Negative Design Guardrails/i, /^##\s+Guardrails/i],
  },
  {
    fieldKeys: ["designDirectives"],
    label: "Domain Design Directives",
    headerPatterns: [/^##\s+5\.\s+Domain Design Directives/i, /^##\s+Design Directives/i],
  },
  {
    fieldKeys: ["designVerification"],
    label: "Design Verification Gate",
    headerPatterns: [/^##\s+7\.\s+Design Verification/i, /^##\s+Verification Gate/i],
  },

  // TASK.md sections
  {
    fieldKeys: ["taskDashboard"],
    label: "Quick Status Dashboard",
    headerPatterns: [/^##\s+Quick Status Dashboard/i, /^##\s+Status Dashboard/i],
  },
  {
    fieldKeys: ["taskPhases"],
    label: "Active Phase Checklists",
    headerPatterns: [/^##\s+Active Phase Checklists/i, /^##\s+Phases/i, /^###\s+Phase\s+1/i],
  },
  {
    fieldKeys: ["taskVerification"],
    label: "Verification Commands & Gates",
    headerPatterns: [/^##\s+Verification Commands/i, /^##\s+Quality Gates/i],
  },
  {
    fieldKeys: ["taskDirectives"],
    label: "Sprint Directives",
    headerPatterns: [/^##\s+Sprint Directives/i, /^##\s+Non-Negotiable Constraints/i],
  },
  {
    fieldKeys: ["taskSessionLog"],
    label: "Agent Session Log",
    headerPatterns: [/^##\s+Agent Session Log/i, /^##\s+Session Log/i],
  },

  // MEMORY.md sections
  {
    fieldKeys: ["memoryContext"],
    label: "Technology Context Matrix",
    headerPatterns: [/^##\s+1\.\s+Technology Context/i, /^##\s+1\.\s+Core Technology Context/i],
  },
  {
    fieldKeys: ["memoryAdrs"],
    label: "Architectural Decisions (ADRs)",
    headerPatterns: [/^##\s+2\.\s+Architectural Decision Records/i, /^##\s+ADRs/i],
  },
  {
    fieldKeys: ["memoryGotchas"],
    label: "Operational Gotchas",
    headerPatterns: [/^##\s+3\.\s+Operational Gotchas/i, /^##\s+Gotchas/i],
  },
  {
    fieldKeys: ["memoryLoop"],
    label: "Agent Execution Loop",
    headerPatterns: [/^##\s+4\.\s+Core Execution Loop/i, /^##\s+5\.\s+Agent Execution Protocol/i, /^##\s+Agent Execution Loop/i],
  },
  {
    fieldKeys: ["memoryInvariants"],
    label: "Key File Hierarchy",
    headerPatterns: [/^##\s+5\.\s+Key File Hierarchy/i, /^##\s+6\.\s+File Hierarchy/i, /^##\s+Invariants/i],
  },
  {
    fieldKeys: ["memorySessionHistory"],
    label: "Agent Session History",
    headerPatterns: [/^##\s+6\.\s+Agent Session History/i, /^##\s+7\.\s+Session History/i],
  },

  // Standard skill / agent / model instruction sections
  {
    fieldKeys: ["conventions"],
    label: "Architectural & Code Conventions",
    headerPatterns: [
      /^##\s+3\.\s+Code Conventions/i,
      /^##\s+Code Conventions/i,
      /^##\s+Coding Standards/i,
      /^##\s+Conventions/i,
      /^##\s+Architectural Directives/i,
      /^##\s+3\.\s+Mandatory Architectural Guardrails/i,
      /^Core Engineering Standards:/i,
      /["']?Core Guidelines:?["']?/i,
    ],
  },
  {
    fieldKeys: ["behaviors"],
    label: "Agent Behavioral Guardrails",
    headerPatterns: [
      /^##\s+4\.\s+Agent Behavioral Guardrails/i,
      /^##\s+Operational Guardrails/i,
      /^##\s+Prohibited Patterns & Guardrails/i,
      /^##\s+4\.\s+Negative Constraints/i,
      /^Operational Guardrails & Prohibitions:/i,
      /["']?Negative Constraints & Guardrails:?["']?/i,
      /^##\s+Agent Directives/i,
      /^##\s+Guardrails/i,
    ],
  },
  {
    fieldKeys: ["procedures"],
    label: "Step-by-Step Workflow Procedures",
    headerPatterns: [
      /^##\s+2\.\s+Core Execution Procedures/i,
      /^##\s+Execution Procedures/i,
      /^##\s+Standard Operating Procedures/i,
      /^##\s+2\.\s+Cascade Execution Workflow/i,
      /^Workflow Checklist:/i,
      /["']?Workflow Procedures:?["']?/i,
      /^3\.\s+Execution Procedures:/i,
      /^##\s+Procedures/i,
      /^##\s+Workflow/i,
    ],
  },
  {
    fieldKeys: ["customDirectives", "directives"],
    label: "Project Directives & Constraints",
    headerPatterns: [
      /^##\s+5\.\s+Project-Specific Directives/i,
      /^##\s+6\.\s+Domain-Specific Invariants/i,
      /^##\s+Domain Design Directives/i,
      /^##\s+Sprint Directives/i,
      /^##\s+Directives/i,
      /^##\s+Custom Rules/i,
      /^##\s+Mandatory Project Rules/i,
      /^Specific Project Requirements:/i,
      /["']?Mandatory Project Directives:?["']?/i,
      /^##\s+Specific Project Constraints/i,
    ],
  },
  {
    fieldKeys: ["techStack", "role", "philosophy", "framework", "language", "styling", "database", "stack"],
    label: "Role, Mission & Tech Stack",
    headerPatterns: [
      /^##\s+1\.\s+Overview & Role/i,
      /^##\s+What would you like ChatGPT/i,
      /^##\s+How would you like ChatGPT/i,
      /^##\s+Role & Mission/i,
      /^##\s+Target Architecture/i,
      /^##\s+Tech Stack Context/i,
      /^##\s+1\.\s+Character & Role/i,
      /^##\s+Project Context/i,
      /^##\s+Overview/i,
      /^You are acting as/i,
      /^You are a/i,
    ],
  },
  {
    fieldKeys: ["skillTitle", "skillName", "identity"],
    label: "Title & Identity",
    headerPatterns: [/^#\s+/m, /^name:\s+/m, /^title:\s+/m],
  },
  {
    fieldKeys: ["description"],
    label: "Skill Activation & Description",
    headerPatterns: [/^description:\s+/m, /^##\s+Project Context/i, /^##\s+Overview/i],
  },
  {
    fieldKeys: ["exampleGood", "exampleBad", "examples"],
    label: "Implementation Reference & Examples",
    headerPatterns: [
      /^##\s+6\.\s+Implementation Reference/i,
      /^##\s+Reference Patterns/i,
      /^##\s+Reference Implementations/i,
      /^###\s+Preferred Patterns/i,
      /^###\s+Recommended/i,
      /^##\s+Examples/i,
    ],
  },
  {
    fieldKeys: ["globPattern", "alwaysApply", "triggers"],
    label: "Activation Triggers & Globs",
    headerPatterns: [/^globs:\s+/m, /^alwaysApply:\s+/m, /^-\s+\*\*Targets\*\*:/i],
  },
  {
    fieldKeys: ["mcpConfig", "mcpServerName", "mcpCommand", "mcpArgs", "mcpEnvKey", "mcpEnvValue"],
    label: "MCP Server Configuration",
    headerPatterns: [/"mcpServers":/m, /"command":/m],
  },
];

/**
 * Universal boundary patterns that signal the start of a new section
 * across Markdown, OpenAI system prompts, and Gemini instruction configs.
 */
const SECTION_BOUNDARY_PATTERNS = [
  /^#{1,3}\s+/,
  /^---\s*$/,
  /^<!--\s*END/i,
  /^Core Engineering Standards:/i,
  /^Operational Guardrails & Prohibitions:/i,
  /^Operational Guardrails/i,
  /^Specific Project Requirements:/i,
  /^Workflow Checklist:/i,
  /^Verification Rules:/i,
  /["']?Core Guidelines:?["']?/i,
  /["']?Negative Constraints & Guardrails:?["']?/i,
  /["']?Mandatory Project Directives:?["']?/i,
  /["']?Workflow Procedures:?["']?/i,
  /["']?Verification Protocol:?["']?/i,
  /^3\.\s+Execution Procedures:/i,
  /^##\s+How would you like/i,
  /^##\s+What would you like/i,
];

/**
 * Given the current generated content, an active field key, and target format,
 * locates the 1-indexed start and end lines of the respective section.
 */
export function findSectionLineRange(
  content: string,
  fieldKey: string | null | undefined,
  _format: OutputFormat
): MarkedSectionRange | null {
  if (!content || !fieldKey) return null;

  const rule = SECTION_RULES.find((r) => r.fieldKeys.includes(fieldKey));
  if (!rule) return null;

  const lines = content.split("\n");
  if (lines.length === 0) return null;

  // Handle frontmatter or top title specifically
  if (fieldKey === "skillTitle" || fieldKey === "skillName" || fieldKey === "identity" || fieldKey === "globPattern" || fieldKey === "alwaysApply" || fieldKey === "triggers") {
    // Check if YAML frontmatter exists
    if (lines[0]?.trim() === "---") {
      let fmEnd = 1;
      while (fmEnd < lines.length && lines[fmEnd].trim() !== "---") {
        fmEnd++;
      }
      if (fmEnd < lines.length) {
        // Frontmatter found: line 1 to fmEnd + 1
        return {
          startLine: 1,
          endLine: Math.min(lines.length, fmEnd + 1),
          label: rule.label,
        };
      }
    }
  }

  // Scan line by line for any of the header patterns
  let startLine = -1;

  for (let i = 0; i < lines.length; i++) {
    const lineText = lines[i];
    for (const pat of rule.headerPatterns) {
      if (pat.test(lineText)) {
        startLine = i + 1; // 1-indexed
        break;
      }
    }
    if (startLine !== -1) break;
  }

  // Fallback: check content fallback patterns if header wasn't found
  if (startLine === -1 && rule.contentFallbackPatterns) {
    for (let i = 0; i < lines.length; i++) {
      const lineText = lines[i];
      for (const pat of rule.contentFallbackPatterns) {
        if (pat.test(lineText)) {
          startLine = i + 1;
          break;
        }
      }
      if (startLine !== -1) break;
    }
  }

  if (startLine === -1) return null;

  // Determine endLine: find the next section boundary
  let endLine = lines.length;
  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i];
    let isBoundary = false;
    for (const bPat of SECTION_BOUNDARY_PATTERNS) {
      if (bPat.test(line)) {
        isBoundary = true;
        break;
      }
    }
    if (isBoundary) {
      // End line is the line before this new section, trimmed of trailing blank lines
      let prev = i;
      while (prev > startLine - 1 && lines[prev - 1].trim() === "") {
        prev--;
      }
      endLine = Math.max(startLine, prev);
      break;
    }
  }

  return {
    startLine,
    endLine,
    label: rule.label,
  };
}
