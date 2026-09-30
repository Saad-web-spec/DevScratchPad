import { OutputFormat } from "@/app/claude-skills/lib/presetRegistry";

export type SkillSourceType = "official" | "community" | "user-uploaded";

export type SkillPlatform =
  | "cursor"
  | "claude"
  | "copilot"
  | "windsurf"
  | "gemini"
  | "openai"
  | "mcp"
  | "universal";

export type SkillCategory =
  | "Frontend & UI"
  | "Backend & APIs"
  | "AI & Agents"
  | "DevOps & Cloud"
  | "Mobile & Apps"
  | "Database & SQL"
  | "Security & Auth"
  | "Testing & QA"
  | "Architecture & Governance";

export interface SkillItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  capabilities?: string[];
  fileTarget?: string;
  sourceType: SkillSourceType;
  sourceOrganization: string;
  primaryPlatform: SkillPlatform;
  sourceUrl?: string;
  author: string;
  category: SkillCategory;
  tags: string[];
  triggers: string[];
  targetFormats: OutputFormat[];
  rawContent: string;
  auditScore: number;
  auditGrade: "PRODUCTION GRADE" | "OPTIMIZED" | "FUNCTIONAL" | "DEFICIENT";
  stars?: number;
  isPopular?: boolean;
  isOfficial?: boolean;
  uploadedAt?: string;
  isCustom?: boolean;
}

export interface UserUploadedSkill extends SkillItem {
  isCustom: true;
  uploadedAt: string;
}
