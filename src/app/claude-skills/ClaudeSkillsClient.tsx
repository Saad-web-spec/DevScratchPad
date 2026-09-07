"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  Copy,
  Check,
  Download,
  ShieldCheck,
  Zap,
  Terminal,
  Layers,
  BookOpen,
  CheckCircle2,
  RefreshCw,
  Cpu,
  Settings2,
  Sliders,
  FolderGit2,
  UploadCloud,
  Archive,
  Server,
  AlertTriangle,
  AlertCircle,
  ExternalLink,
  Lock,
  Unlock,
  Sparkles,
  X,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { downloadAiKitZip } from "./lib/zipExporter";
import { ParsedManifestResult } from "./lib/manifestParser";

const ManifestImportModal = dynamic(
  () => import("./components/ManifestImportModal").then((m) => m.ManifestImportModal),
  { ssr: false }
);
import { generateSafeSlug, validateTriggerPhrase } from "./lib/slugUtils";
import { saveToStorageEnvelope, loadFromStorageEnvelope, STORAGE_KEY_V2 } from "./lib/storageEnvelope";
import { auditRuleQuality, RuleAuditReport, AuditIssue, AuditDimension } from "./lib/ruleAuditor";

// Dynamically import Monaco Editor to prevent SSR issues
const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-full text-zinc-400 bg-zinc-900 font-mono text-xs gap-2">
      <RefreshCw className="w-5 h-5 animate-spin text-orange-400" />
      <span>Loading editor...</span>
    </div>
  ),
});

import {
  OutputFormat,
  McpServerPreset,
  SkillPreset,
  MCP_PRESETS,
  PRESETS,
  PHILOSOPHIES,
  BEHAVIOR_OPTIONS,
  CONVENTION_OPTIONS,
  deduceLangTag,
  buildRuleContent,
  getInstallCommands,
  getHeredocCommand,
  copyToClipboard,
} from "./lib/ruleGenerator";
import { PRESET_ROUTES, getPresetBySlug, SLUG_ALIASES } from "./lib/presetRegistry";

import { encodeStudioState, decodeStudioState, createShareableUrl } from "./lib/stateSharing";

interface ClaudeSkillsClientProps {
  initialFormat?: OutputFormat;
  initialPresetId?: string;
  formatSlug?: string;
  presetSlug?: string;
}

export function ClaudeSkillsClient({
  initialFormat,
  initialPresetId,
  formatSlug: initialFormatSlug,
  presetSlug: initialPresetSlug,
}: ClaudeSkillsClientProps = {}) {
  const [isMounted, setIsMounted] = useState(false);

  // Compute default preset based on initial props
  const defaultPreset = useMemo(() => {
    if (initialPresetId) {
      const found = PRESETS.find((p) => p.id === initialPresetId);
      if (found) return found;
    }
    return PRESETS.find((p) => p.id === "claude-auditor") || PRESETS[0];
  }, [initialPresetId]);

  const defaultMcpPreset = useMemo(() => {
    if (initialFormat === "mcp_json" && initialPresetId) {
      const found = MCP_PRESETS.find((p) => p.id === initialPresetId);
      if (found) return found;
    }
    return MCP_PRESETS[0];
  }, [initialFormat, initialPresetId]);

  const [selectedPresetId, setSelectedPresetId] = useState<string>(() => initialPresetId || "claude-auditor");
  const [format, setFormat] = useState<OutputFormat>(() => initialFormat || "skill_md");
  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // Form State
  const [skillName, setSkillName] = useState(() => defaultPreset.slug);
  const [skillTitle, setSkillTitle] = useState(() => defaultPreset.title);
  const [description, setDescription] = useState(() => defaultPreset.description);
  const [role, setRole] = useState(() => defaultPreset.role);
  const [framework, setFramework] = useState(() => defaultPreset.framework);
  const [language, setLanguage] = useState(() => defaultPreset.language);
  const [styling, setStyling] = useState(() => defaultPreset.styling);
  const [database, setDatabase] = useState(() => defaultPreset.database);
  const [philosophy, setPhilosophy] = useState<"pragmatic" | "modern" | "strict" | "vibe" | "architect">(() => defaultPreset.philosophy);
  const [behaviors, setBehaviors] = useState<string[]>(() => defaultPreset.behaviors);
  const [conventions, setConventions] = useState<string[]>(() => defaultPreset.conventions);
  const [procedures, setProcedures] = useState(() => defaultPreset.procedures);
  const [customDirectives, setCustomDirectives] = useState(() => defaultPreset.customDirectives);
  const [exampleGood, setExampleGood] = useState(() => defaultPreset.exampleGood);
  const [exampleBad, setExampleBad] = useState(() => defaultPreset.exampleBad);

  // Advanced Runtime Controls & Direct Editor Editing
  const [globPattern, setGlobPattern] = useState("**/*");
  const [alwaysApply, setAlwaysApply] = useState(false);
  const [editorContent, setEditorContent] = useState<string>("");
  const editorRef = React.useRef<any>(null);
  const [isManuallyEdited, setIsManuallyEdited] = useState(false);
  const [lastAutoSaved, setLastAutoSaved] = useState<string | null>(null);
  const [quotaError, setQuotaError] = useState<string | null>(null);
  const [isManifestModalOpen, setIsManifestModalOpen] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [mobileTab, setMobileTab] = useState<"form" | "editor">("form");

  // Slug lock & Static Analysis Audit Panel State
  const [isSlugLocked, setIsSlugLocked] = useState(false);
  const [showAuditPanel, setShowAuditPanel] = useState(false);
  const [auditTab, setAuditTab] = useState<"findings" | "checklist">("findings");
  const [auditCopied, setAuditCopied] = useState(false);
  const [selectedDimension, setSelectedDimension] = useState<AuditDimension | "all">("all");

  // Title & Slug synchronization handlers
  const handleTitleChange = (newTitle: string) => {
    setSkillTitle(newTitle);
    if (!isSlugLocked) {
      setSkillName(generateSafeSlug(newTitle));
    }
  };

  const handleSlugChange = (rawSlug: string) => {
    const safe = rawSlug.toLowerCase().replace(/[\s/\\]+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "-");
    setSkillName(safe);
    setIsSlugLocked(true);
  };

  const toggleSlugLock = () => {
    if (isSlugLocked) {
      setIsSlugLocked(false);
      setSkillName(generateSafeSlug(skillTitle));
    } else {
      setIsSlugLocked(true);
    }
  };

  // Real-time Activation Trigger Validation
  const triggerValidation = useMemo(() => {
    return validateTriggerPhrase(description);
  }, [description]);

  // MCP Server state
  const [mcpPresetId, setMcpPresetId] = useState<string>(() => defaultMcpPreset.id);
  const [mcpServerName, setMcpServerName] = useState<string>(() => defaultMcpPreset.name);
  const [mcpCommand, setMcpCommand] = useState<string>(() => defaultMcpPreset.command);
  const [mcpArgs, setMcpArgs] = useState<string>(() => defaultMcpPreset.args.join("\n"));
  const [mcpEnvKey, setMcpEnvKey] = useState<string>(() => Object.keys(defaultMcpPreset.env)[0] || "");
  const [mcpEnvValue, setMcpEnvValue] = useState<string>(() => Object.values(defaultMcpPreset.env)[0] || "");

  // Real-time MCP Validation
  const mcpValidation = useMemo(() => {
    const issues: { type: "error" | "warning" | "info"; message: string; field: string }[] = [];
    const isGitHub = mcpPresetId === "github" || mcpServerName.toLowerCase().includes("github") || mcpEnvKey.toUpperCase().includes("GITHUB");
    const isPostgres = mcpPresetId === "postgres" || mcpServerName.toLowerCase().includes("postgres") || mcpArgs.toLowerCase().includes("postgres");
    const isBrave = mcpPresetId === "brave-search" || mcpServerName.toLowerCase().includes("brave") || mcpEnvKey.toUpperCase().includes("BRAVE");
    const isFilesystem = mcpPresetId === "filesystem" || mcpServerName.toLowerCase().includes("filesystem") || mcpArgs.includes("server-filesystem");

    // Server identifier checks
    if (!mcpServerName.trim()) {
      issues.push({ type: "error", message: "Server identifier key is required (e.g. 'github', 'filesystem').", field: "serverName" });
    } else if (!/^[a-zA-Z0-9_-]+$/.test(mcpServerName.trim())) {
      issues.push({ type: "warning", message: "Server key should only contain alphanumeric characters, hyphens, or underscores.", field: "serverName" });
    }

    // Command check
    if (!mcpCommand.trim()) {
      issues.push({ type: "error", message: "Executable command is required (e.g. 'npx', 'node', 'uvx').", field: "command" });
    }

    // GitHub Access Token Validation
    if (isGitHub) {
      const tokenKey = mcpEnvKey.trim();
      const tokenVal = mcpEnvValue.trim();

      if (!tokenKey || (!tokenKey.includes("GITHUB") && !tokenKey.includes("TOKEN"))) {
        issues.push({
          type: "error",
          message: "Missing environment variable name: Expected 'GITHUB_PERSONAL_ACCESS_TOKEN'.",
          field: "envKey",
        });
      }

      if (!tokenVal) {
        issues.push({
          type: "error",
          message: "GitHub Personal Access Token is required to authenticate against GitHub repositories and API.",
          field: "envValue",
        });
      } else if (tokenVal.includes("your_token_here") || tokenVal.includes("placeholder") || tokenVal.toLowerCase().includes("token")) {
        issues.push({
          type: "warning",
          message: "Placeholder token detected. Replace with a real personal access token from GitHub Settings.",
          field: "envValue",
        });
      } else if (!tokenVal.startsWith("ghp_") && !tokenVal.startsWith("github_pat_") && !tokenVal.startsWith("gho_")) {
        issues.push({
          type: "info",
          message: "Token does not match standard GitHub token prefixes ('ghp_' for classic tokens, 'github_pat_' for fine-grained).",
          field: "envValue",
        });
      }
    }

    // Postgres Connection URI Validation
    if (isPostgres) {
      const argsArray = mcpArgs.split("\n").map((a) => a.trim()).filter(Boolean);
      const uriArg = argsArray.find((a) => a.startsWith("postgres://") || a.startsWith("postgresql://") || a.includes("5432"));
      if (!uriArg) {
        issues.push({
          type: "error",
          message: "PostgreSQL connection URI argument is missing. Expected 'postgresql://user:password@host:port/dbname'.",
          field: "args",
        });
      } else if (uriArg.includes("user:password@localhost")) {
        issues.push({
          type: "warning",
          message: "Placeholder database credentials detected. Update credentials for target PostgreSQL host.",
          field: "args",
        });
      }
    }

    // Brave Search Validation
    if (isBrave) {
      if (!mcpEnvValue.trim() || mcpEnvValue.includes("your_brave_search_api_key")) {
        issues.push({
          type: "warning",
          message: "Brave Search API Key is required for web queries. Obtain one from brave.com/search/api.",
          field: "envValue",
        });
      }
    }

    // Filesystem path check
    if (isFilesystem) {
      const argsArray = mcpArgs.split("\n").map((a) => a.trim()).filter(Boolean);
      const hasPath = argsArray.some((a) => a.startsWith("./") || a.startsWith("/") || a.includes(":\\") || a === ".");
      if (!hasPath) {
        issues.push({
          type: "warning",
          message: "Filesystem MCP server requires at least one directory path argument (e.g. './' or absolute path).",
          field: "args",
        });
      }
    }

    const errors = issues.filter((i) => i.type === "error");
    const warnings = issues.filter((i) => i.type === "warning");
    const infos = issues.filter((i) => i.type === "info");

    return {
      isValid: errors.length === 0 && warnings.length === 0,
      hasErrors: errors.length > 0,
      hasWarnings: warnings.length > 0,
      isGitHub,
      isPostgres,
      isBrave,
      isFilesystem,
      issues,
      errors,
      warnings,
      infos,
    };
  }, [mcpPresetId, mcpServerName, mcpCommand, mcpArgs, mcpEnvKey, mcpEnvValue]);

  const handleSelectMcpPreset = (presetId: string) => {
    setMcpPresetId(presetId);
    const p = MCP_PRESETS.find((item) => item.id === presetId);
    if (p) {
      setMcpServerName(p.name);
      setMcpCommand(p.command);
      setMcpArgs(p.args.join("\n"));
      const envKeys = Object.keys(p.env);
      if (envKeys.length > 0) {
        setMcpEnvKey(envKeys[0]);
        setMcpEnvValue(p.env[envKeys[0]]);
      } else {
        setMcpEnvKey("");
        setMcpEnvValue("");
      }
    }
  };

  // Storage envelope state restore on mount (with automatic v1 legacy migration)
  useEffect(() => {
    let hashState = null;
    try {
      const hash = window.location.hash;
      if (hash && hash.length > 1) {
        hashState = decodeStudioState(hash);
        if (hashState) {
          console.log("[AI Skill Studio] Restored shared configuration from URL hash");
        }
      }
    } catch (err) {
      console.error("Failed to parse share hash:", err);
    }

    try {
      let s: any = null;

      if (hashState) {
        s = hashState;
        if (s.selectedPresetId) {
          const preset = PRESETS.find(p => p.id === s.selectedPresetId);
          if (preset) {
            if (s.skillName === undefined) s.skillName = preset.slug;
            if (s.skillTitle === undefined) s.skillTitle = preset.title;
            if (s.description === undefined) s.description = preset.description;
            if (s.role === undefined) s.role = preset.role;
            if (s.framework === undefined) s.framework = preset.framework;
            if (s.language === undefined) s.language = preset.language;
            if (s.styling === undefined) s.styling = preset.styling;
            if (s.database === undefined) s.database = preset.database;
            if (s.philosophy === undefined) s.philosophy = preset.philosophy;
            if (s.behaviors === undefined) s.behaviors = preset.behaviors;
            if (s.conventions === undefined) s.conventions = preset.conventions;
            if (s.procedures === undefined) s.procedures = preset.procedures;
            if (s.customDirectives === undefined) s.customDirectives = preset.customDirectives;
            if (s.exampleGood === undefined) s.exampleGood = preset.exampleGood;
            if (s.exampleBad === undefined) s.exampleBad = preset.exampleBad;
          }
        }
      } else if (initialFormat && initialPresetId) {
        // Hydrate from programmatic route props
        if (initialFormat === "mcp_json") {
          const mcp = MCP_PRESETS.find((p) => p.id === initialPresetId) || MCP_PRESETS[0];
          s = {
            format: "mcp_json",
            mcpPresetId: mcp.id,
            mcpServerName: mcp.name,
            mcpCommand: mcp.command,
            mcpArgs: mcp.args.join("\n"),
            mcpEnvKey: Object.keys(mcp.env)[0] || "",
            mcpEnvValue: Object.values(mcp.env)[0] || "",
          };
        } else {
          const preset = PRESETS.find((p) => p.id === initialPresetId) || PRESETS[0];
          s = {
            format: initialFormat,
            skillName: preset.slug,
            skillTitle: preset.title,
            description: preset.description,
            role: preset.role,
            framework: preset.framework,
            language: preset.language,
            styling: preset.styling,
            database: preset.database,
            philosophy: preset.philosophy,
            behaviors: preset.behaviors,
            conventions: preset.conventions,
            procedures: preset.procedures,
            customDirectives: preset.customDirectives,
            exampleGood: preset.exampleGood,
            exampleBad: preset.exampleBad,
          };
        }
        // Remove hash so it doesn't stay in URL if it was invalid? No need.
      } else {
        // Fallback to local storage envelope
        s = loadFromStorageEnvelope<any>();
      }

      if (s) {
        if (s.selectedPresetId) {
          setSelectedPresetId(s.selectedPresetId);
        } else if (s.skillName) {
          const matched = PRESETS.find((p) => p.slug === s.skillName);
          if (matched) setSelectedPresetId(matched.id);
        }
        if (s.skillName) setSkillName(s.skillName);
        if (s.skillTitle) setSkillTitle(s.skillTitle);
        if (typeof s.isSlugLocked === "boolean") setIsSlugLocked(s.isSlugLocked);
        if (s.description) setDescription(s.description);
        if (s.role) setRole(s.role);
        if (s.framework) setFramework(s.framework);
        if (s.language) setLanguage(s.language);
        if (s.styling) setStyling(s.styling);
        if (s.database) setDatabase(s.database);
        if (s.philosophy) setPhilosophy(s.philosophy);
        if (Array.isArray(s.behaviors)) setBehaviors(s.behaviors);
        if (Array.isArray(s.conventions)) setConventions(s.conventions);
        if (s.procedures) setProcedures(s.procedures);
        if (s.customDirectives) setCustomDirectives(s.customDirectives);
        if (s.exampleGood) setExampleGood(s.exampleGood);
        if (s.exampleBad) setExampleBad(s.exampleBad);
        if (s.format && s.format !== "subagent_json") setFormat(s.format);
        if (s.globPattern) setGlobPattern(s.globPattern);
        if (typeof s.alwaysApply === "boolean") setAlwaysApply(s.alwaysApply);
        if (s.mcpPresetId) {
          setMcpPresetId(s.mcpPresetId);
          const matchedMcp = MCP_PRESETS.find((p) => p.id === s.mcpPresetId);
          if (matchedMcp) {
            setMcpServerName(s.mcpServerName ?? matchedMcp.name);
            setMcpCommand(s.mcpCommand ?? matchedMcp.command);
            setMcpArgs(s.mcpArgs ?? matchedMcp.args.join("\n"));
            const defaultEnvKeys = Object.keys(matchedMcp.env);
            if (s.mcpEnvKey !== undefined) {
              setMcpEnvKey(s.mcpEnvKey);
              setMcpEnvValue(s.mcpEnvValue ?? "");
            } else if (defaultEnvKeys.length > 0) {
              setMcpEnvKey(defaultEnvKeys[0]);
              setMcpEnvValue(matchedMcp.env[defaultEnvKeys[0]] || "");
            } else {
              setMcpEnvKey("");
              setMcpEnvValue("");
            }
          } else {
            if (s.mcpServerName) setMcpServerName(s.mcpServerName);
            if (s.mcpCommand) setMcpCommand(s.mcpCommand);
            if (s.mcpArgs) setMcpArgs(s.mcpArgs);
            if (s.mcpEnvKey !== undefined) setMcpEnvKey(s.mcpEnvKey);
            if (s.mcpEnvValue !== undefined) setMcpEnvValue(s.mcpEnvValue);
          }
        } else {
          if (s.mcpServerName) setMcpServerName(s.mcpServerName);
          if (s.mcpCommand) setMcpCommand(s.mcpCommand);
          if (s.mcpArgs) setMcpArgs(s.mcpArgs);
          if (s.mcpEnvKey !== undefined) setMcpEnvKey(s.mcpEnvKey);
          if (s.mcpEnvValue !== undefined) setMcpEnvValue(s.mcpEnvValue);
        }
        if (s.editorContent && s.isManuallyEdited) {
          setEditorContent(s.editorContent);
          setIsManuallyEdited(true);
        }
      }
    } catch (e) {
      console.error(e);
    }
    setIsMounted(true);
  }, [initialFormat, initialPresetId]);

  // Debounced Versioned Envelope Auto-Save
  useEffect(() => {
    if (!isMounted) return;
    // Guard against overwriting primary studio draft when merely visiting a pre-configured spoke page
    if (initialPresetId && !isManuallyEdited) return;

    const timer = setTimeout(() => {
      try {
        const res = saveToStorageEnvelope(STORAGE_KEY_V2, {
          selectedPresetId,
          skillName,
          skillTitle,
          isSlugLocked,
          description,
          role,
          framework,
          language,
          styling,
          database,
          philosophy,
          behaviors,
          conventions,
          procedures,
          customDirectives,
          exampleGood,
          exampleBad,
          format,
          globPattern,
          alwaysApply,
          mcpPresetId,
          mcpServerName,
          mcpCommand,
          mcpArgs,
          mcpEnvKey,
          mcpEnvValue,
          editorContent,
          isManuallyEdited,
        });
        if (res.success) {
          const now = new Date();
          setLastAutoSaved(
            now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
          );
          setQuotaError(null);
        } else if (res.error) {
          setQuotaError(res.error);
        }
      } catch (saveErr) {
        console.warn("[ClaudeSkillsClient] Auto-save failed gracefully:", saveErr);
        setQuotaError("Storage limit reached or browser restricted. Export your configuration to keep your changes.");
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [
    isMounted,
    initialPresetId,
    skillName,
    skillTitle,
    isSlugLocked,
    description,
    role,
    framework,
    language,
    styling,
    database,
    philosophy,
    behaviors,
    conventions,
    procedures,
    customDirectives,
    exampleGood,
    exampleBad,
    format,
    globPattern,
    alwaysApply,
    mcpPresetId,
    mcpServerName,
    mcpCommand,
    mcpArgs,
    mcpEnvKey,
    mcpEnvValue,
    editorContent,
    isManuallyEdited,
  ]);

  // Apply Preset with Intelligent Format Auto-Switch
  const handleApplyPreset = (preset: SkillPreset) => {
    setSelectedPresetId(preset.id);
    setSkillName(preset.slug);
    setIsSlugLocked(false);
    setSkillTitle(preset.title);
    setDescription(preset.description);
    setRole(preset.role);
    setFramework(preset.framework);
    setLanguage(preset.language);
    setStyling(preset.styling);
    setDatabase(preset.database);
    setPhilosophy(preset.philosophy);
    setBehaviors(preset.behaviors);
    setConventions(preset.conventions);
    setProcedures(preset.procedures);
    setCustomDirectives(preset.customDirectives);
    setExampleGood(preset.exampleGood);
    setExampleBad(preset.exampleBad);

    // Auto-switch format according to preset runtime
    if (preset.id === "cursor-mdc-pro") {
      setFormat("cursor_mdc");
      setGlobPattern("**/*");
      setAlwaysApply(false);
    } else if (preset.id === "claude-auditor" || preset.id === "security-guard") {
      setFormat("skill_md");
    } else if (preset.id === "fullstack-agent-team") {
      setFormat("agents_md");
    }

    // Reset manual edit flag so the preset content takes over immediately
    setIsManuallyEdited(false);
  };

  // Apply parsed manifest metadata to studio
  const handleApplyManifest = (manifest: ParsedManifestResult) => {
    if (manifest.framework) setFramework(manifest.framework);
    if (manifest.language) setLanguage(manifest.language);
    if (manifest.styling) setStyling(manifest.styling);
    if (manifest.database) setDatabase(manifest.database);
    if (manifest.suggestedRole) setRole(manifest.suggestedRole);
    if (manifest.suggestedSkillName) {
      setSkillName(generateSafeSlug(manifest.suggestedSkillName));
      setIsSlugLocked(true);
    }
    setIsManuallyEdited(false);
  };

  // Toggle checkbox helper
  const toggleItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, id: string) => {
    setList((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  // Context-Aware Synthesis Engine (Option 3: Reads all 12 form fields)
  const synthesizeFromContext = () => {
    const philObj = PHILOSOPHIES.find((p) => p.id === philosophy);

    // 1. Philosophy Mission Matrix
    const missionByPhilosophy: Record<string, string> = {
      strict: "enforces zero-tolerance for untyped 'any', strict null-safety, defensive type boundaries, and schema validation",
      modern: "balances clean architectural abstractions with pragmatic delivery, modular cohesion, and sensible defaults",
      pragmatic: "prioritizes clean, readable, maintainable code over clever micro-abstractions, abiding strictly by YAGNI",
      vibe: "optimizes for rapid iteration, flat direct implementations, and fast working feedback loops with minimal ceremony",
      architect: "evaluates long-term trade-offs, scales cleanly, documents architectural decisions, and secures system boundaries",
    };

    // Filter relevant tech stack items
    const stackItems = [
      framework && framework !== "Framework Agnostic" && framework !== "Any / Auto-Detect" ? framework : "",
      language && language !== "Polyglot" ? language : "",
      styling && !styling.toLowerCase().includes("none") ? styling : "",
      database && !database.toLowerCase().includes("none") ? database : "",
    ].filter(Boolean);

    const stackLabel = stackItems.length > 0 ? stackItems.join(" • ") : "modern development environments";

    // Format-tailored trigger text
    let triggerClause = "";
    if (format === "cursor_mdc") {
      triggerClause = `Scoped to target files matching active globs (${globPattern || "**/*"}).`;
    } else if (format === "skill_md") {
      triggerClause = `Activated automatically when tasks involve ${framework || "system"} development, auditing, or refactoring.`;
    } else if (format === "claude_md") {
      triggerClause = "Loaded at session initialization to govern all repository workflows.";
    } else if (format === "mcp_json") {
      triggerClause = `Configures external MCP context servers and tooling pipelines for ${stackLabel}.`;
    } else {
      triggerClause = `Orchestrates autonomous agents executing within ${stackLabel}.`;
    }

    const behaviorClauses: string[] = [];
    if (behaviors.includes("inspect-first")) {
      behaviorClauses.push("Always inspects existing codebase patterns and manifest configs before proposing changes.");
    }
    if (behaviors.includes("dependency-caution")) {
      behaviorClauses.push("Blocks unapproved third-party dependencies.");
    }

    const synthesizedDescription = [
      `Specialized ${role || "Autonomous Assistant"} configured for ${stackLabel}.`,
      `This configuration ${missionByPhilosophy[philosophy] || "applies disciplined engineering standards"}.`,
      triggerClause,
      ...behaviorClauses,
    ].join(" ");

    // 2. Multi-Step Procedures derived from Conventions & Stack
    const steps: string[] = [];

    // Step 1: Inspection
    if (behaviors.includes("inspect-first")) {
      steps.push(
        "1. Context Inspection: Read active directory layout, package manifests, and existing code idioms prior to proposing changes."
      );
    } else {
      steps.push(`1. Discovery & Analysis: Examine requirements and map affected components within ${framework || "the codebase"}.`);
    }

    // Step 2: Architecture
    const archClauses: string[] = [];
    if (conventions.includes("rsc-first") && (framework.toLowerCase().includes("next") || framework.toLowerCase().includes("react"))) {
      archClauses.push("default to Server Components (RSC) and keep client interactivity confined to leaf components");
    }
    if (conventions.includes("clean-layered")) {
      archClauses.push("separate concerns cleanly between route handlers, domain services, and data access layers");
    }
    if (conventions.includes("feature-colocated")) {
      archClauses.push("colocate components, hooks, tests, and types inside domain feature folders");
    }
    if (conventions.includes("flat-pragmatic")) {
      archClauses.push("keep folder nesting shallow (max 2-3 levels) to avoid navigational friction");
    }
    if (archClauses.length > 0) {
      steps.push(`2. Architectural Alignment: Structure implementation to ${archClauses.join("; ")}.`);
    } else {
      steps.push("2. Architectural Planning: Design clean interfaces and avoid unnecessary abstraction layers.");
    }

    // Step 3: Execution & Code Quality
    const codeClauses: string[] = [];
    if (conventions.includes("typed-schemas")) {
      codeClauses.push("validate all external inputs, requests, and environment variables with strict schemas");
    }
    if (conventions.includes("guard-clauses")) {
      codeClauses.push("leverage guard clauses and early returns to eliminate nested branches");
    }
    if (conventions.includes("result-types")) {
      codeClauses.push("return explicit Result tuples or typed error objects instead of swallowing exceptions");
    }
    if (behaviors.includes("minimal-diffs")) {
      codeClauses.push("produce surgical, targeted diffs preserving unrelated code and comments");
    }
    if (codeClauses.length > 0) {
      steps.push(`3. Implementation Standards: Ensure that you ${codeClauses.join(", ")}.`);
    } else {
      steps.push("3. Focused Implementation: Write clean, idiomatic code adhering to existing repository formatting.");
    }

    // Step 4: Verification
    if (behaviors.includes("verification-driven")) {
      steps.push(
        "4. Verification & Quality Gates: Run automated tests, linting, and typecheck commands. Provide explicit manual verification steps for runtime behavior."
      );
    } else {
      steps.push("4. Validation: Verify that modified files compile cleanly without regression or unresolved imports.");
    }

    // 3. Custom Directives
    const directives: string[] = [];
    if (philosophy === "strict") {
      directives.push("- Banned: Never use loose 'any', 'as unknown as T', or disable TypeScript compiler warnings.");
    }
    if (behaviors.includes("dependency-caution")) {
      directives.push("- Dependency Rule: Do not install external libraries without explicit user confirmation.");
    }
    if (behaviors.includes("concise-direct")) {
      directives.push("- Communication: Keep commentary brief, code-focused, and free of conversational filler.");
    }
    if (behaviors.includes("preserve-style")) {
      directives.push("- Style Preservation: Mirror existing quote styles, indentations, and naming idioms.");
    }
    if (database && !database.toLowerCase().includes("none")) {
      directives.push(`- Database Hygiene: Use parameterized queries with ${database}; prevent injection and credential leaks.`);
    }
    directives.push("- Security: All secrets, API keys, and environment tokens must remain strictly server-side.");

    setDescription(synthesizedDescription);
    setProcedures(steps.join("\n"));
    setCustomDirectives(directives.join("\n"));

    // Reset manual edit flag so newly synthesized template appears in editor
    setIsManuallyEdited(false);
  };

  // Language tag deduction for syntax-highlighted code blocks
  const langTag = useMemo(() => {
    const l = (language || "").toLowerCase();
    if (l.includes("typescript") || l.includes("tsx")) return "typescript";
    if (l.includes("javascript") || l.includes("jsx")) return "javascript";
    if (l.includes("python")) return "python";
    if (l.includes("go")) return "go";
    if (l.includes("rust")) return "rust";
    if (l.includes("shell") || l.includes("bash")) return "bash";
    return "ts";
  }, [language]);

  // Generated Content Builder for any target runtime format
  const buildContent = useCallback(
    (targetFormat: OutputFormat) => {
      return buildRuleContent({
        targetFormat,
        skillName,
        skillTitle,
        description,
        role,
        framework,
        language,
        styling,
        database,
        philosophy,
        behaviors,
        conventions,
        procedures,
        customDirectives,
        exampleGood,
        exampleBad,
        globPattern,
        alwaysApply,
        mcpServerName,
        mcpCommand,
        mcpArgs,
        mcpEnvKey,
        mcpEnvValue,
      });
    },
    [
      philosophy,
      behaviors,
      conventions,
      skillName,
      skillTitle,
      description,
      role,
      framework,
      language,
      styling,
      database,
      procedures,
      customDirectives,
      exampleGood,
      exampleBad,
      globPattern,
      alwaysApply,
      mcpServerName,
      mcpCommand,
      mcpArgs,
      mcpEnvKey,
      mcpEnvValue,
    ]
  );

  // Active template generation based on format tab
  const generatedContent = useMemo(() => buildContent(format), [buildContent, format]);

  // Synchronize generated content to editorContent when not manually overridden
  useEffect(() => {
    if (!isManuallyEdited) {
      setEditorContent(generatedContent);
      if (editorRef.current) {
        editorRef.current.setScrollTop(0);
      }
    }
  }, [generatedContent, isManuallyEdited]);

  // Active content being viewed/copied/downloaded
  const activeContent = isManuallyEdited ? editorContent : generatedContent;

  // Real-time Rule Quality & Security Audit Engine
  const auditReport = useMemo(() => {
    return auditRuleQuality({
      content: activeContent,
      format,
      description,
      globPattern,
      alwaysApply,
      exampleGood,
      exampleBad,
    });
  }, [
    activeContent,
    format,
    description,
    globPattern,
    alwaysApply,
    exampleGood,
    exampleBad,
  ]);

  // Copy audit report summary for PRs / documentation
  const handleCopyAuditReport = () => {
    const lines = [
      `### Rule Quality & Security Audit: ${auditReport.overallScore}/100 · ${auditReport.gradeLabel}`,
      `- **Clarity & Ambiguity**: ${auditReport.dimensions.clarity.score}%`,
      `- **Token Footprint**: ~${auditReport.tokenCount} tokens (${auditReport.dimensions.tokenDensity.score}%)`,
      `- **Guardrails & Boundaries**: ${auditReport.dimensions.guardrails.score}%`,
      `- **Trigger Precision & Scoping**: ${auditReport.dimensions.triggers.score}%`,
      "",
      `**Summary**: ${auditReport.summary}`,
    ];
    if (auditReport.allIssues.length > 0) {
      lines.push("", "**Diagnostic Findings:**");
      auditReport.allIssues.forEach((issue) => {
        lines.push(`- [${issue.severity.toUpperCase()}] **${issue.title}**: ${issue.message} (Tip: ${issue.suggestion})`);
      });
    } else {
      lines.push("", "*Zero deficiencies detected. Ready for production deployment.*");
    }
    navigator.clipboard.writeText(lines.join("\n"));
    setAuditCopied(true);
    setTimeout(() => setAuditCopied(false), 2000);
  };

  // One-click quick fix: Inject negative boundary guardrails
  const handleInjectNegativeGuardrails = () => {
    const snippet = `\n\n## Strict Negative Guardrails\n- Never modify \`.env\` files, production credentials, or secrets without explicit permission.\n- Do not run destructive shell commands (e.g. \`rm -rf\`, \`git push --force\`, database drops).\n- Deliver surgical, focused diffs rather than re-outputting entire existing files.\n- Strictly avoid loose \`any\` or unverified type assertions.`;
    setEditorContent((prev) => (prev || activeContent) + snippet);
    setIsManuallyEdited(true);
  };

  // One-click quick fix: Inject code block example
  const handleInjectCodeBlock = () => {
    const snippet = `\n\n## Implementation Reference\n\`\`\`typescript\n// Good Pattern: Explicit typing and input validation\nexport function validateInput(value: string): boolean {\n  if (!value || value.trim().length === 0) return false;\n  return true;\n}\n\`\`\``;
    setEditorContent((prev) => (prev || activeContent) + snippet);
    setIsManuallyEdited(true);
  };

  // One-click quick fix: Replace detected vague directives with concrete requirements
  const handleFixVaguePhrases = () => {
    let updated = activeContent;
    const replacements: [RegExp, string][] = [
      [/\bwrite clean code\b/gi, "enforce single-responsibility functions and explicit TypeScript interfaces"],
      [/\bfollow best practices\b/gi, "adhere strictly to ESLint rules, modular architecture, and zero-any type safety"],
      [/\bensure high quality\b/gi, "verify with automated unit tests and runtime schema validation"],
      [/\bmake it fast\b/gi, "minimize re-renders, optimize database queries, and avoid unnecessary allocations"],
      [/\bbe helpful\b/gi, "provide concise, surgical code diffs with clear technical rationale"],
      [/\bdo your best\b/gi, "follow established repository patterns and type contracts"],
      [/\bavoid bugs\b/gi, "implement defensive null checks and exhaustive switch cases"],
      [/\berror-free code\b/gi, "verify compiler passes with zero TypeScript warnings"],
      [/\bwrite good code\b/gi, "enforce clean separation of concerns and deterministic typing"],
      [/\bas simple as possible\b/gi, "follow YAGNI principles: avoid speculative abstraction"],
    ];
    for (const [regex, replacement] of replacements) {
      updated = updated.replace(regex, replacement);
    }
    setEditorContent(updated);
    setIsManuallyEdited(true);
  };

  // One-click quick fix: Scope Cursor globs
  const handleScopeGlobs = () => {
    setGlobPattern("src/**/*.{ts,tsx,js,jsx}");
    setAlwaysApply(false);
  };

  // Comprehensive Auto-Fix: Resolves all detected deficiencies in one click
  const handleAutoFixAll = () => {
    let updated = activeContent;
    const replacements: [RegExp, string][] = [
      [/\bwrite clean code\b/gi, "enforce single-responsibility functions and explicit TypeScript interfaces"],
      [/\bfollow best practices\b/gi, "adhere strictly to ESLint rules, modular architecture, and zero-any type safety"],
      [/\bensure high quality\b/gi, "verify with automated unit tests and runtime schema validation"],
      [/\bmake it fast\b/gi, "minimize re-renders, optimize database queries, and avoid unnecessary allocations"],
      [/\bbe helpful\b/gi, "provide concise, surgical code diffs with clear technical rationale"],
      [/\bdo your best\b/gi, "follow established repository patterns and type contracts"],
      [/\bavoid bugs\b/gi, "implement defensive null checks and exhaustive switch cases"],
      [/\berror-free code\b/gi, "verify compiler passes with zero TypeScript warnings"],
      [/\bwrite good code\b/gi, "enforce clean separation of concerns and deterministic typing"],
      [/\bas simple as possible\b/gi, "follow YAGNI principles: avoid speculative abstraction"],
    ];
    for (const [regex, replacement] of replacements) {
      updated = updated.replace(regex, replacement);
    }

    if (auditReport.dimensions.guardrails.score < 70) {
      updated += `\n\n## Strict Negative Guardrails\n- Never modify \`.env\` files, production credentials, or secrets without explicit permission.\n- Do not run destructive shell commands (e.g. \`rm -rf\`, \`git push --force\`, database drops).\n- Deliver surgical, focused diffs rather than re-outputting entire existing files.\n- Strictly avoid loose \`any\` or unverified type assertions.`;
    }

    if (!updated.includes("```") && updated.length > 300) {
      updated += `\n\n## Implementation Reference\n\`\`\`typescript\n// Good Pattern: Explicit typing and input validation\nexport function validateScope(input: string): boolean {\n  if (!input || input.trim().length === 0) return false;\n  return true;\n}\n\`\`\``;
    }

    setEditorContent(updated);
    setIsManuallyEdited(true);

    if (format === "cursor_mdc" && (alwaysApply || globPattern === "**/*")) {
      setGlobPattern("src/**/*.{ts,tsx,js,jsx}");
      setAlwaysApply(false);
    }
  };

  // Filtered issues based on selected dimension
  const filteredIssues = useMemo(() => {
    if (selectedDimension === "all") return auditReport.allIssues;
    return auditReport.allIssues.filter((issue) => issue.dimension === selectedDimension);
  }, [auditReport.allIssues, selectedDimension]);

  // Export Complete AI Workspace Suite as ZIP
  const handleExportZip = async () => {
    setIsExportingZip(true);
    try {
      await downloadAiKitZip({
        skillName,
        skillTitle,
        cursorRulesContent: format === "cursor_mdc" && isManuallyEdited ? editorContent : buildContent("cursor_mdc"),
        skillMdContent: format === "skill_md" && isManuallyEdited ? editorContent : buildContent("skill_md"),
        claudeMdContent: format === "claude_md" && isManuallyEdited ? editorContent : buildContent("claude_md"),
        agentsMdContent: format === "agents_md" && isManuallyEdited ? editorContent : buildContent("agents_md"),
        mcpJsonContent: format === "mcp_json" && isManuallyEdited ? editorContent : buildContent("mcp_json"),
        framework,
        language,
      });
    } catch (err) {
      console.error("Failed to export zip", err);
    } finally {
      setIsExportingZip(false);
    }
  };

  // Copy handler
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  // CLI / Terminal One-Liner Handler & State
  const [cliCopied, setCliCopied] = useState(false);
  const [showCliDropdown, setShowCliDropdown] = useState(false);
  const [cliActiveTab, setCliActiveTab] = useState<"bash" | "powershell" | "wget" | "heredoc" | "cli">("bash");
  const [cliHost, setCliHost] = useState("https://www.devscratchpad.tech");
  const cliDropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isLocal =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        window.location.hostname.endsWith(".local");
      if (isLocal) {
        setCliHost(window.location.origin);
      }
    }
  }, []);

  useEffect(() => {
    if (!showCliDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (cliDropdownRef.current && !cliDropdownRef.current.contains(e.target as Node)) {
        setShowCliDropdown(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowCliDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showCliDropdown]);

  const activeFormatSlug = useMemo(() => {
    const formatSlugMap: Record<OutputFormat, string> = {
      cursor_mdc: "cursor-rules",
      skill_md: "claude-skills",
      claude_md: "claude-md",
      agents_md: "agents-md",
      mcp_json: "mcp-config",
    };
    return formatSlugMap[format] || "cursor-rules";
  }, [format]);

  const activePresetSlug = useMemo(() => {
    if (format === "mcp_json") {
      return mcpPresetId || mcpServerName || "filesystem";
    }
    if (initialPresetSlug && selectedPresetId === initialPresetId) {
      return initialPresetSlug;
    }
    const matchedRoute = PRESET_ROUTES.find(
      (r) => (r.presetId === selectedPresetId || r.presetSlug === selectedPresetId) && r.formatSlug === activeFormatSlug
    );
    if (matchedRoute) return matchedRoute.presetSlug;

    const matchedPreset = PRESETS.find((p) => p.id === selectedPresetId);
    if (matchedPreset) {
      return SLUG_ALIASES[matchedPreset.slug] || matchedPreset.slug;
    }
    return skillName || "rule";
  }, [format, mcpPresetId, mcpServerName, initialPresetSlug, selectedPresetId, initialPresetId, activeFormatSlug, skillName]);

  const targetInstallFile = useMemo(() => {
    const matchedRoute = PRESET_ROUTES.find(
      (r) => (r.presetSlug === activePresetSlug || r.presetId === selectedPresetId) && r.formatSlug === activeFormatSlug
    );
    if (matchedRoute && !isManuallyEdited) {
      return matchedRoute.targetFile;
    }

    const safeSkill = (skillName || activePresetSlug || "skill").replace(/[^a-zA-Z0-9._-]/g, "-");
    if (format === "skill_md") return `.claude/skills/${safeSkill}/SKILL.md`;
    if (format === "claude_md") return "CLAUDE.md";
    if (format === "cursor_mdc") return `.cursor/rules/${safeSkill}.mdc`;
    if (format === "mcp_json") return "claude_desktop_config.json";
    return "AGENTS.md";
  }, [activePresetSlug, selectedPresetId, activeFormatSlug, isManuallyEdited, format, skillName]);

  const cliCommands = useMemo(() => {
    return getInstallCommands(activeFormatSlug, activePresetSlug, targetInstallFile, cliHost);
  }, [activeFormatSlug, activePresetSlug, targetInstallFile, cliHost]);

  const heredocCommand = useMemo(() => {
    return getHeredocCommand(targetInstallFile, activeContent);
  }, [targetInstallFile, activeContent]);

  const powershellHeredoc = useMemo(() => {
    const lastSlash = targetInstallFile.lastIndexOf("/");
    const targetDir = lastSlash !== -1 ? targetInstallFile.substring(0, lastSlash) : "";
    const winDir = targetDir.replace(/\//g, "\\");
    const winFile = targetInstallFile.replace(/\//g, "\\");
    const mkdirPs = winDir ? `New-Item -ItemType Directory -Force -Path "${winDir}"; ` : "";
    const safeContent = activeContent.trim().replace(/\n'@/g, "\n '@");
    return `${mkdirPs}@'\n${safeContent}\n'@ | Set-Content -Path "${winFile}" -Encoding UTF8`;
  }, [targetInstallFile, activeContent]);

  // Determine if content is customized from default preset
  const isCustomEdited = useMemo(() => {
    if (isManuallyEdited) return true;
    if (format === "mcp_json") {
      const defaultMcp = MCP_PRESETS.find((p) => p.id === mcpPresetId) || MCP_PRESETS[0];
      const defaultArgs = defaultMcp.args.join("\n");
      const defaultEnvKey = Object.keys(defaultMcp.env)[0] || "";
      const defaultEnvVal = Object.values(defaultMcp.env)[0] || "";
      return (
        mcpServerName !== defaultMcp.name ||
        mcpCommand !== defaultMcp.command ||
        mcpArgs !== defaultArgs ||
        mcpEnvKey !== defaultEnvKey ||
        mcpEnvValue !== defaultEnvVal
      );
    }
    const currentPreset = PRESETS.find((p) => p.id === selectedPresetId) || defaultPreset;
    return (
      skillTitle !== currentPreset.title ||
      description !== currentPreset.description ||
      role !== currentPreset.role ||
      framework !== currentPreset.framework ||
      language !== currentPreset.language ||
      styling !== currentPreset.styling ||
      database !== currentPreset.database ||
      philosophy !== currentPreset.philosophy ||
      procedures !== currentPreset.procedures ||
      customDirectives !== currentPreset.customDirectives ||
      exampleGood !== currentPreset.exampleGood ||
      exampleBad !== currentPreset.exampleBad
    );
  }, [
    isManuallyEdited,
    format,
    mcpPresetId,
    mcpServerName,
    mcpCommand,
    mcpArgs,
    mcpEnvKey,
    mcpEnvValue,
    selectedPresetId,
    defaultPreset,
    skillTitle,
    description,
    role,
    framework,
    language,
    styling,
    database,
    philosophy,
    procedures,
    customDirectives,
    exampleGood,
    exampleBad,
  ]);

  const primaryCliCommand = isCustomEdited ? heredocCommand : cliCommands.bash;

  const currentTabCliCommand = useMemo(() => {
    if (isCustomEdited) {
      if (cliActiveTab === "powershell") return powershellHeredoc;
      return heredocCommand;
    }
    switch (cliActiveTab) {
      case "powershell":
        return cliCommands.powershell;
      case "wget":
        return cliCommands.wget;
      case "cli":
        return cliCommands.cliRunner || cliCommands.bash;
      case "heredoc":
        return heredocCommand;
      case "bash":
      default:
        return cliCommands.bash;
    }
  }, [isCustomEdited, cliActiveTab, powershellHeredoc, heredocCommand, cliCommands]);

  const handleCliAction = async () => {
    const success = await copyToClipboard(primaryCliCommand);
    if (success) {
      setCliCopied(true);
      setTimeout(() => setCliCopied(false), 2000);
    }
    setShowCliDropdown((prev) => !prev);
  };

  // Share Link handler
  const handleShareLink = async () => {
    try {
      // Intelligently find the closest base preset by content score
      const bestPreset = PRESETS.reduce((best, candidate) => {
        let score = 0;
        if (candidate.slug === skillName) score += 8;
        if (candidate.id === selectedPresetId) score += 4;
        if (candidate.title === skillTitle) score += 4;
        if (candidate.procedures === procedures) score += 12;
        if (candidate.description === description) score += 6;
        if (candidate.exampleGood === exampleGood) score += 6;
        if (candidate.exampleBad === exampleBad) score += 6;
        if (candidate.framework === framework) score += 2;
        if (candidate.role === role) score += 2;
        return score > best.score ? { preset: candidate, score } : best;
      }, { preset: PRESETS[0], score: -1 }).preset;

      const stateToShare: any = {
        selectedPresetId: bestPreset.id,
      };

      if (isSlugLocked) stateToShare.isSlugLocked = true;
      if (format !== "skill_md") stateToShare.format = format;
      if (globPattern && globPattern !== "**/*") stateToShare.globPattern = globPattern;
      if (alwaysApply) stateToShare.alwaysApply = true;

      // MCP: Only serialize if user actually modified away from defaults
      const isDefaultMcp =
        mcpPresetId === "filesystem" &&
        mcpServerName === "filesystem" &&
        mcpCommand === "npx" &&
        mcpArgs === "-y\n@modelcontextprotocol/server-filesystem\n./" &&
        !mcpEnvKey &&
        !mcpEnvValue;

      if (!isDefaultMcp) {
        if (mcpPresetId) stateToShare.mcpPresetId = mcpPresetId;
        const matchedMcp = MCP_PRESETS.find((p) => p.id === mcpPresetId);
        const isExactPresetMatch =
          matchedMcp &&
          mcpServerName === matchedMcp.name &&
          mcpCommand === matchedMcp.command &&
          mcpArgs === matchedMcp.args.join("\n") &&
          (Object.keys(matchedMcp.env).length === 0
            ? !mcpEnvKey && !mcpEnvValue
            : mcpEnvKey === Object.keys(matchedMcp.env)[0] && mcpEnvValue === matchedMcp.env[Object.keys(matchedMcp.env)[0]]);

        // Only include verbose command/args/env if customized beyond preset
        if (!isExactPresetMatch) {
          if (mcpServerName) stateToShare.mcpServerName = mcpServerName;
          if (mcpCommand) stateToShare.mcpCommand = mcpCommand;
          if (mcpArgs) stateToShare.mcpArgs = mcpArgs;
          if (mcpEnvKey) stateToShare.mcpEnvKey = mcpEnvKey;
          // SECURITY: Do not leak live API secret value in URL share
        }
      }

      // Diff against bestPreset to only store actual modifications
      if (skillName !== bestPreset.slug) stateToShare.skillName = skillName;
      if (skillTitle !== bestPreset.title) stateToShare.skillTitle = skillTitle;
      if (description !== bestPreset.description) stateToShare.description = description;
      if (role !== bestPreset.role) stateToShare.role = role;
      if (framework !== bestPreset.framework) stateToShare.framework = framework;
      if (language !== bestPreset.language) stateToShare.language = language;
      if (styling !== bestPreset.styling) stateToShare.styling = styling;
      if (database !== bestPreset.database) stateToShare.database = database;
      if (philosophy !== bestPreset.philosophy) stateToShare.philosophy = philosophy;
      if (JSON.stringify(behaviors) !== JSON.stringify(bestPreset.behaviors)) stateToShare.behaviors = behaviors;
      if (JSON.stringify(conventions) !== JSON.stringify(bestPreset.conventions)) stateToShare.conventions = conventions;
      if (procedures !== bestPreset.procedures) stateToShare.procedures = procedures;
      if (customDirectives !== bestPreset.customDirectives) stateToShare.customDirectives = customDirectives;
      if (exampleGood !== bestPreset.exampleGood) stateToShare.exampleGood = exampleGood;
      if (exampleBad !== bestPreset.exampleBad) stateToShare.exampleBad = exampleBad;

      if (isManuallyEdited) {
        stateToShare.isManuallyEdited = true;
        stateToShare.editorContent = editorContent;
      }

      const url = createShareableUrl(stateToShare);
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch (err) {
      console.error("Failed to generate share link", err);
    }
  };

  // Download handler
  const handleDownload = () => {
    const safeSkill = (skillName || "rule").replace(/[^a-zA-Z0-9._-]/g, "-");
    let filename = "SKILL.md";
    let mimeType = "text/markdown;charset=utf-8;";
    if (format === "claude_md") filename = "CLAUDE.md";
    if (format === "cursor_mdc") filename = `${safeSkill}.mdc`.replace(/[^a-zA-Z0-9._-]/g, "-");
    if (format === "agents_md") filename = "AGENTS.md";
    if (format === "mcp_json") {
      filename = "claude.json";
      mimeType = "application/json;charset=utf-8;";
    }

    const blob = new Blob([activeContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Get file name indicator
  const currentFileName = useMemo(() => {
    const safeSkill = (skillName || "rule").replace(/[^a-zA-Z0-9._-]/g, "-");
    if (format === "skill_md") return "SKILL.md";
    if (format === "claude_md") return "CLAUDE.md";
    if (format === "cursor_mdc") return `.cursor/rules/${safeSkill}.mdc`;
    if (format === "mcp_json") return "claude.json (mcpServers)";
    return "AGENTS.md";
  }, [format, skillName]);

  if (!isMounted) return null;

  return (
    <div suppressHydrationWarning className="min-h-screen bg-zinc-50 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-zinc-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-2">
          {/* Left: Back button & Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link
              href="/"
              className="flex items-center gap-1.5 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-semibold text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 transition-all border border-zinc-200/80 active:scale-95 shrink-0"
              title="Open Developer Tools Workspace"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Developer Tools </span>
              <span>Workspace</span>
            </Link>

            <div className="h-4 w-px bg-zinc-200 shrink-0 hidden sm:block" />

            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <img src="/ai-skill-icon.png" alt="AI Skill Studio" className="w-5 h-4 sm:w-6 sm:h-5 object-contain shrink-0" />
              <span className="text-xs sm:text-base font-bold text-zinc-900 tracking-tight truncate">
                AI Skill Studio
              </span>
            </div>
          </div>

          {/* Right: Status Indicators */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold bg-zinc-900 text-white rounded-full border border-zinc-800 shadow-xs">
              <span>Cursor .mdc + Claude Ready</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-[#fff7ed] text-[#9a3412] border border-[#fed7aa] rounded-full shadow-xs whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-[#ea580c] shrink-0 shadow-[0_0_6px_rgba(234,88,12,0.8)]" />
              <span>Client-Side</span>
            </span>
          </div>
        </div>

        {/* Quick Presets Sub-Bar */}
        <div className="border-t border-zinc-100 bg-zinc-50/90 px-3 sm:px-6 py-1.5 overflow-x-auto scrollbar-none">
          <div className="max-w-7xl mx-auto flex items-center gap-2 min-w-max">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Zap className="w-3 h-3 text-zinc-800" /> Presets:
            </span>
            <div className="flex items-center gap-1.5 py-0.5">
              {PRESETS.map((preset) => {
                const isActive = selectedPresetId === preset.id;
                const isCursorPreset = preset.id === "cursor-mdc-pro";
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleApplyPreset(preset)}
                    suppressHydrationWarning
                    className={cn(
                      "px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-all flex items-center gap-1.5 border shrink-0",
                      isActive
                        ? isCursorPreset
                          ? "bg-black text-white border-black shadow-xs font-semibold"
                          : "bg-orange-50 text-orange-800 border-orange-300/80 shadow-xs font-semibold"
                        : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 hover:text-zinc-900"
                    )}
                  >
                    {isCursorPreset && <img src="/cursor-icon.png" className="w-3 h-3 object-contain shrink-0" alt="Cursor" />}
                    <span>{preset.name}</span>
                    <span
                      className={cn(
                        "text-[9px] px-1 py-px rounded font-mono shrink-0",
                        isActive
                          ? isCursorPreset
                            ? "bg-zinc-800 text-zinc-200"
                            : "bg-orange-200/60 text-orange-900"
                          : "bg-zinc-100 text-zinc-500"
                      )}
                    >
                      {preset.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile View Mode Switcher (visible only on < lg) */}
      <div className="lg:hidden px-3 pt-3 max-w-7xl mx-auto w-full">
        <div className="flex items-center p-1 bg-zinc-200/80 rounded-xl border border-zinc-300/80 shadow-inner">
          <button
            type="button"
            onClick={() => setMobileTab("form")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all",
              mobileTab === "form"
                ? "bg-white text-zinc-900 shadow-xs"
                : "text-zinc-600 hover:text-zinc-900"
            )}
          >
            <Sliders className="w-3.5 h-3.5 text-orange-500" />
            <span>Configure</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("editor")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all",
              mobileTab === "editor"
                ? "bg-zinc-900 text-white shadow-xs"
                : "text-zinc-600 hover:text-zinc-900"
            )}
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Editor & Export</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-700 text-zinc-200 font-mono leading-none">
              {activeContent.split("\n").length}L
            </span>
          </button>
        </div>
      </div>
      {quotaError && (
        <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 mt-4">
          <div className="bg-red-50/80 border border-red-200 p-3 rounded-lg flex items-start gap-3 text-red-900 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-bold">Storage Quota Exceeded</h3>
              <p className="text-xs text-red-800 mt-1">{quotaError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace Area: Split Screen */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-24 lg:pb-6">
        {/* Left Column: Generator Controls */}
        <div className={cn(
          "lg:col-span-6 space-y-4 sm:space-y-6",
          mobileTab === "editor" ? "hidden lg:block" : "block"
        )}>
          {/* Format Selector Card */}
          <div className="bg-white rounded-xl border border-zinc-200 p-3.5 sm:p-4 shadow-xs">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
              <span>Target Standard & File Format</span>
              <span className="text-[10px] text-zinc-400 font-normal">Select AI runtime</span>
            </label>
            <div suppressHydrationWarning className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              <button
                suppressHydrationWarning
                onClick={() => setFormat("cursor_mdc")}
                className={cn(
                  "p-2 sm:p-2.5 rounded-lg border text-left transition-all flex flex-col gap-1 overflow-hidden",
                  format === "cursor_mdc"
                    ? "border-black bg-zinc-950 text-white shadow-sm ring-1 ring-black"
                    : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
                )}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs truncate">
                  <img src="/cursor-icon.png" alt="Cursor" className="w-3.5 h-3.5 object-contain shrink-0" />
                  <span className="truncate">.cursorrules</span>
                </div>
                <span className={cn("text-[10px] leading-tight truncate", format === "cursor_mdc" ? "text-zinc-400" : "text-zinc-500")}>
                  Cursor .mdc Rules
                </span>
              </button>

              <button
                suppressHydrationWarning
                onClick={() => setFormat("skill_md")}
                className={cn(
                  "p-2 sm:p-2.5 rounded-lg border text-left transition-all flex flex-col gap-1 overflow-hidden",
                  format === "skill_md"
                    ? "border-orange-500 bg-orange-50/60 text-orange-950 shadow-xs ring-1 ring-orange-500/20"
                    : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
                )}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs truncate">
                  <img src="/ai-skill-icon.png" alt="Claude" className="w-3.5 h-3.5 object-contain shrink-0" />
                  <span className="truncate">SKILL.md</span>
                </div>
                <span className="text-[10px] text-zinc-500 leading-tight truncate">Claude Code / Skill</span>
              </button>

              <button
                suppressHydrationWarning
                onClick={() => setFormat("claude_md")}
                className={cn(
                  "p-2 sm:p-2.5 rounded-lg border text-left transition-all flex flex-col gap-1 overflow-hidden",
                  format === "claude_md"
                    ? "border-amber-500 bg-amber-50/60 text-amber-950 shadow-xs ring-1 ring-amber-500/20"
                    : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
                )}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs truncate">
                  <img src="/claude-icon.png" alt="Claude" className="w-3.5 h-3.5 object-contain shrink-0" />
                  <span className="truncate">CLAUDE.md</span>
                </div>
                <span className="text-[10px] text-zinc-500 leading-tight truncate">Root Guidelines</span>
              </button>

              <button
                suppressHydrationWarning
                onClick={() => setFormat("agents_md")}
                className={cn(
                  "p-2 sm:p-2.5 rounded-lg border text-left transition-all flex flex-col gap-1 overflow-hidden",
                  format === "agents_md"
                    ? "border-emerald-600 bg-emerald-50/60 text-emerald-950 shadow-xs ring-1 ring-emerald-600/20"
                    : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
                )}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs truncate">
                  <Cpu className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">AGENTS.md</span>
                </div>
                <span className="text-[10px] text-zinc-500 leading-tight truncate">Multi-Agent</span>
              </button>

              <button
                suppressHydrationWarning
                onClick={() => setFormat("mcp_json")}
                className={cn(
                  "p-2 sm:p-2.5 rounded-lg border text-left transition-all flex flex-col gap-1 overflow-hidden",
                  format === "mcp_json"
                    ? "border-blue-500 bg-blue-50/60 text-blue-950 shadow-xs ring-1 ring-blue-500/20"
                    : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
                )}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs truncate">
                  <Server className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="truncate">claude.json</span>
                </div>
                <span className="text-[10px] text-zinc-500 leading-tight truncate">MCP Servers</span>
              </button>
            </div>
          </div>

          {/* Cursor Rule Scope Card (Visible only when format is cursor_mdc) */}
          {format === "cursor_mdc" && (
            <div className="bg-white rounded-xl border border-zinc-200 p-3.5 sm:p-4 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 pb-2.5 gap-1">
                <div className="flex items-center gap-2">
                  <FolderGit2 className="w-4 h-4 text-zinc-900 shrink-0" />
                  <h3 className="text-sm font-bold text-zinc-900">Cursor Rule Scope</h3>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono">.cursor/rules/*.mdc</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700">File Glob Pattern</label>
                  <input
                    type="text"
                    value={globPattern}
                    onChange={(e) => setGlobPattern(e.target.value)}
                    placeholder="e.g. src/app/**/*.tsx or **/*"
                    className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
                  />
                  <p className="text-[10px] text-zinc-400">Scopes rule to matching files. Use **/* for global workspace scope.</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700">Always Apply Behavior</label>
                  <button
                    type="button"
                    onClick={() => setAlwaysApply((prev) => !prev)}
                    className={cn(
                      "w-full px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center justify-between transition-all mt-0.5",
                      alwaysApply
                        ? "border-black bg-zinc-950 text-white shadow-xs"
                        : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700"
                    )}
                  >
                    <span>alwaysApply: {alwaysApply ? "true" : "false"}</span>
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-mono", alwaysApply ? "bg-zinc-800 text-white" : "bg-zinc-200 text-zinc-600")}>
                      {alwaysApply ? "ALWAYS ON" : "SCOPED ONLY"}
                    </span>
                  </button>
                  <p className="text-[10px] text-zinc-400">When ON, Cursor injects this rule in every generation context.</p>
                </div>
              </div>
            </div>
          )}

          {/* MCP Server Configuration Card (Visible only when format is mcp_json) */}
          {format === "mcp_json" && (
            <div className="bg-white rounded-xl border border-zinc-200 p-3.5 sm:p-4 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 pb-2.5 gap-2">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-orange-600 shrink-0" />
                  <h3 className="text-sm font-bold text-zinc-900">Claude MCP Server Configuration</h3>
                </div>
                <div className="flex items-center gap-2">
                  {mcpValidation.hasErrors ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                      <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
                      {mcpValidation.errors.length} {mcpValidation.errors.length === 1 ? "issue" : "issues"}
                    </span>
                  ) : mcpValidation.hasWarnings ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                      {mcpValidation.warnings.length} {mcpValidation.warnings.length === 1 ? "warning" : "warnings"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-800 bg-orange-50/70 border border-orange-200/70 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3 text-orange-600 shrink-0" />
                      Ready for Claude
                    </span>
                  )}
                  <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline">claude.json</span>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700">Select MCP Preset Template</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {MCP_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectMcpPreset(preset.id)}
                      className={cn(
                        "px-2.5 py-2 text-left rounded-lg border text-xs font-medium transition-all flex flex-col gap-0.5",
                        mcpPresetId === preset.id
                          ? "border-blue-500 bg-blue-50/60 text-blue-900 font-semibold ring-1 ring-blue-400"
                          : "border-zinc-200 bg-zinc-50/50 hover:bg-zinc-100 text-zinc-700"
                      )}
                    >
                      <span className="truncate">{preset.label}</span>
                      <span className="text-[10px] text-zinc-400 font-mono font-normal truncate">{preset.command}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700">Server Identifier Key</label>
                  <input
                    type="text"
                    value={mcpServerName}
                    onChange={(e) => setMcpServerName(e.target.value)}
                    placeholder="e.g. filesystem or github"
                    className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700">Executable Command</label>
                  <input
                    type="text"
                    value={mcpCommand}
                    onChange={(e) => setMcpCommand(e.target.value)}
                    placeholder="npx, uvx, node, python"
                    className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700">Command Arguments (One per line)</label>
                <textarea
                  rows={3}
                  value={mcpArgs}
                  onChange={(e) => setMcpArgs(e.target.value)}
                  placeholder="-y&#10;@modelcontextprotocol/server-filesystem&#10;./"
                  className="w-full p-2.5 border border-zinc-200 rounded-lg text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-y"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700">Environment Variable Key (Optional)</label>
                  <input
                    type="text"
                    value={mcpEnvKey}
                    onChange={(e) => setMcpEnvKey(e.target.value)}
                    placeholder="e.g. GITHUB_PERSONAL_ACCESS_TOKEN"
                    className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-700">Environment Variable Value</label>
                    {mcpValidation.isGitHub && (
                      <span className="text-[10px]">
                        {!mcpEnvValue.trim() ? (
                          <span className="text-rose-600 font-medium">Token required</span>
                        ) : mcpEnvValue.includes("your_token_here") || mcpEnvValue.includes("placeholder") ? (
                          <span className="text-amber-600 font-medium">Placeholder token</span>
                        ) : mcpEnvValue.startsWith("ghp_") || mcpEnvValue.startsWith("github_pat_") ? (
                          <span className="text-emerald-600 font-semibold inline-flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" /> Valid PAT format
                          </span>
                        ) : (
                          <span className="text-zinc-400">Custom token</span>
                        )}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={mcpEnvValue}
                    onChange={(e) => setMcpEnvValue(e.target.value)}
                    placeholder="e.g. ghp_your_token_here"
                    className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* GitHub PAT Helper Banner */}
              {mcpValidation.isGitHub && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-orange-50/50 border border-orange-200/50 rounded-lg text-xs">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-orange-800 flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5 text-orange-800 shrink-0" />
                      <span>GitHub Personal Access Token (PAT) Required</span>
                    </div>
                    <p className="text-[11px] text-orange-800 leading-relaxed">
                      Classic token (<code className="bg-orange-100/60 text-orange-800 px-1 py-0.2 rounded font-mono text-[10px]">ghp_...</code>) or Fine-grained (<code className="bg-orange-100/60 text-orange-800 px-1 py-0.2 rounded font-mono text-[10px]">github_pat_...</code>) with <code className="bg-orange-100/60 text-orange-800 px-1 py-0.2 rounded font-mono text-[10px]">repo</code> and <code className="bg-orange-100/60 text-orange-800 px-1 py-0.2 rounded font-mono text-[10px]">read:org</code> scopes.
                    </p>
                  </div>
                  <a
                    href="https://github.com/settings/tokens/new?description=Claude+Code+MCP&scopes=repo,read:org,read:user"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-white hover:bg-orange-50/80 text-orange-700 hover:text-orange-800 border border-orange-200 rounded-md text-xs font-semibold transition-all shadow-2xs shrink-0 cursor-pointer"
                  >
                    <span>Generate Token</span>
                    <ExternalLink className="w-3 h-3 text-orange-700" />
                  </a>
                </div>
              )}

              {/* Real-time Validation Diagnostics Checklist */}
              <div className="rounded-lg border border-zinc-200 bg-zinc-50/70 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                    MCP Protocol Diagnostics
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    {mcpValidation.issues.length === 0
                      ? "All checks passed"
                      : `${mcpValidation.issues.length} check${mcpValidation.issues.length > 1 ? "s" : ""} flagged`}
                  </span>
                </div>

                {mcpValidation.issues.length > 0 ? (
                  <div className="space-y-1.5">
                    {mcpValidation.issues.map((issue, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "flex items-start gap-2 text-xs p-2 rounded-md border leading-relaxed",
                          issue.type === "error"
                            ? "bg-rose-50/80 border-rose-200 text-rose-900"
                            : issue.type === "warning"
                            ? "bg-amber-50/80 border-amber-200 text-amber-900"
                            : "bg-orange-50/60 border-orange-200/70 text-orange-900"
                        )}
                      >
                        {issue.type === "error" ? (
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                        ) : issue.type === "warning" ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        ) : (
                          <Zap className="w-3.5 h-3.5 text-orange-600 shrink-0 mt-0.5" />
                        )}
                        <span className="text-[11px] flex-1">{issue.message}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-orange-800 bg-orange-50/50 border border-orange-200/50 rounded-md p-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                    <span className="text-[11px]">
                      MCP configuration verified. Compatible with Claude Code (<code className="bg-orange-100/60 text-orange-800 px-1 py-0.2 rounded font-mono text-[10px]">claude.json</code>) and Claude Desktop (<code className="bg-orange-100/60 text-orange-800 px-1 py-0.2 rounded font-mono text-[10px]">claude_desktop_config.json</code>).
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Identity & Trigger Configuration */}
          <div className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 pb-3 gap-2.5">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-zinc-700 shrink-0" />
                <h3 className="text-sm font-bold text-zinc-900">Identity & Activation Rules</h3>
              </div>
              <button
                suppressHydrationWarning
                type="button"
                onClick={synthesizeFromContext}
                className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-orange-700 hover:text-orange-800 bg-orange-50 hover:bg-orange-100 border border-orange-200/90 px-2.5 py-1.5 rounded-md transition-all active:scale-95 shadow-xs w-full sm:w-auto shrink-0"
                title="Synthesizes triggers, procedures, and directives from all 12 current form fields and stack context"
              >
                <Cpu className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                <span>Synthesize from Context</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-700">Skill Identifier (Kebab Case)</label>
                  <button
                    type="button"
                    onClick={toggleSlugLock}
                    className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer px-1 py-0.5 rounded hover:bg-zinc-100"
                    title={
                      isSlugLocked
                        ? "Identifier is locked from auto-syncing with Display Title. Click to unlock."
                        : "Identifier is auto-syncing with Display Title. Click to lock."
                    }
                  >
                    {isSlugLocked ? (
                      <>
                        <Lock className="w-3 h-3 text-orange-600" />
                        <span className="text-orange-700 font-semibold">Locked</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3 h-3 text-zinc-400" />
                        <span>Auto-sync</span>
                      </>
                    )}
                  </button>
                </div>
                <input
                  type="text"
                  value={skillName}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="e.g. codebase-auditor"
                  className="w-full px-3 py-1.5 border border-zinc-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700">Display Title</label>
                <input
                  type="text"
                  value={skillTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Codebase Health & Security Auditor"
                  className="w-full px-3 py-1.5 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-0.5 sm:gap-2">
                <label className="text-xs font-semibold text-zinc-700">
                  Activation Trigger
                </label>
                <span className="text-[10px] text-zinc-400">Progressive disclosure condition evaluated by AI</span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="When should the AI activate this skill? (e.g., progressive disclosure condition for Claude Code or file globs for Cursor .mdc rules)..."
                className="w-full p-3 border border-zinc-200 rounded-lg text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 min-h-[105px] resize-y"
              />

              {/* Activation Trigger Validation Feedback */}
              {description.trim().length > 0 && (!triggerValidation.isValid || triggerValidation.severity) && (
                <div
                  className={cn(
                    "flex items-start gap-2 p-2.5 rounded-lg border text-xs leading-relaxed transition-all",
                    triggerValidation.severity === "warning" || !triggerValidation.isValid
                      ? "bg-amber-50/80 border-amber-200/90 text-amber-900"
                      : "bg-blue-50/80 border-blue-200/90 text-blue-900"
                  )}
                >
                  <AlertTriangle
                    className={cn(
                      "w-4 h-4 shrink-0 mt-0.5",
                      triggerValidation.severity === "warning" || !triggerValidation.isValid
                        ? "text-amber-600"
                        : "text-blue-600"
                    )}
                  />
                  <div className="space-y-0.5">
                    <p className="font-semibold text-[11px]">{triggerValidation.message}</p>
                    {triggerValidation.recommendation && (
                      <p className="text-[10px] text-zinc-600">
                        <span className="font-semibold text-zinc-700">Tip: </span>
                        {triggerValidation.recommendation}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700">Agent Persona / Role</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Senior Security & Systems Auditor"
                className="w-full px-3 py-1.5 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
          </div>

          {/* Tech Stack Customization */}
          <div className="bg-white rounded-xl border border-zinc-200 p-3.5 sm:p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 pb-2.5 gap-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-zinc-700 shrink-0" />
                <h3 className="text-sm font-bold text-zinc-900">Technology Stack Context</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsManifestModalOpen(true)}
                className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-zinc-700 hover:text-orange-700 bg-zinc-100 hover:bg-orange-50 border border-zinc-200 hover:border-orange-200 px-2.5 py-1.5 rounded-md transition-all active:scale-95 shadow-xs cursor-pointer w-full sm:w-auto shrink-0"
                title="Auto-detect stack from package.json, pyproject.toml, Cargo.toml, or go.mod"
              >
                <UploadCloud className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                <span>Auto-Detect from Manifest</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-600">Framework</label>
                <input
                  type="text"
                  value={framework}
                  onChange={(e) => setFramework(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-600">Language</label>
                <input
                  type="text"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-600">Styling / UI</label>
                <input
                  type="text"
                  value={styling}
                  onChange={(e) => setStyling(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-600">Database / API</label>
                <input
                  type="text"
                  value={database}
                  onChange={(e) => setDatabase(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Philosophy & Non-Rigid Style Preferences */}
          <div className="bg-white rounded-xl border border-zinc-200 p-3 sm:p-3.5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-zinc-100 pb-2.5 gap-1">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-zinc-700 shrink-0" />
                <h3 className="text-sm font-bold text-zinc-900">Engineering Philosophy</h3>
              </div>
              <span className="text-[10px] text-zinc-500 font-medium">Flexible & Adaptable</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PHILOSOPHIES.map((p) => {
                const isSelected = philosophy === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPhilosophy(p.id as any)}
                    className={cn(
                      "p-2.5 rounded-lg border text-left transition-all flex flex-col gap-1",
                      isSelected
                        ? `${p.color} ring-1 ring-orange-500/20 shadow-xs font-semibold`
                        : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
                    )}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold">{p.title}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-orange-600" />}
                    </div>
                    <p className="text-xs leading-relaxed text-zinc-500 font-normal">{p.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nuanced Agent Behavioral Guardrails */}
          <div className="bg-white rounded-xl border border-zinc-200 p-3 sm:p-3.5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-zinc-100 pb-2.5 gap-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <h3 className="text-sm font-bold text-zinc-900">Agent Behavioral Guardrails</h3>
              </div>
              <span className="text-[10px] text-zinc-400">Select active rules</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {BEHAVIOR_OPTIONS.map((opt) => {
                const isChecked = behaviors.includes(opt.id);
                return (
                  <label
                    key={opt.id}
                    onClick={() => toggleItem(behaviors, setBehaviors, opt.id)}
                    className={cn(
                      "p-2 rounded-lg border text-left cursor-pointer transition-all flex items-start gap-2 select-none",
                      isChecked ? "border-zinc-300 bg-zinc-50/80 text-zinc-900" : "border-zinc-200 bg-white text-zinc-500"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="mt-0.5 rounded border-zinc-300 text-orange-600 focus:ring-orange-500 shrink-0"
                    />
                    <div>
                      <span className="text-xs font-semibold block text-zinc-800">{opt.label}</span>
                      <span className="text-xs leading-relaxed text-zinc-500 block">{opt.desc}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Architectural & Code Quality Conventions */}
          <div className="bg-white rounded-xl border border-zinc-200 p-3 sm:p-3.5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-zinc-100 pb-2.5 gap-1">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-zinc-700 shrink-0" />
                <h3 className="text-sm font-bold text-zinc-900">Architectural & Code Quality Conventions</h3>
              </div>
              <span className="text-[10px] text-zinc-400">Less rigid & configurable</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CONVENTION_OPTIONS.map((opt) => {
                const isChecked = conventions.includes(opt.id);
                return (
                  <label
                    key={opt.id}
                    onClick={() => toggleItem(conventions, setConventions, opt.id)}
                    className={cn(
                      "p-2 rounded-lg border text-left cursor-pointer transition-all flex items-start gap-2 select-none",
                      isChecked ? "border-zinc-300 bg-zinc-50/80 text-zinc-900" : "border-zinc-200 bg-white text-zinc-500"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="mt-0.5 rounded border-zinc-300 text-orange-600 focus:ring-orange-500 shrink-0"
                    />
                    <div>
                      <span className="text-xs font-semibold block text-zinc-800">{opt.label}</span>
                      <span className="text-xs leading-relaxed text-zinc-500 block">{opt.desc}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Procedures & Custom Rules Textareas */}
          <div className="bg-white rounded-xl border border-zinc-200 p-3.5 sm:p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-zinc-700 shrink-0" />
                <h3 className="text-sm font-bold text-zinc-900">Step-by-Step Workflow Procedures</h3>
              </div>
            </div>

            <textarea
              value={procedures}
              onChange={(e) => setProcedures(e.target.value)}
              rows={8}
              placeholder="1. Read context... 2. Trace execution..."
              className="w-full p-3 border border-zinc-200 rounded-lg text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 min-h-[195px] resize-y"
            />

            <div className="pt-2">
              <label className="text-xs font-semibold text-zinc-700 mb-1.5 block">
                Custom Directives & Forbidden Patterns
              </label>
              <textarea
                value={customDirectives}
                onChange={(e) => setCustomDirectives(e.target.value)}
                rows={5}
                placeholder="- Never use eval or dangerous innerHTML..."
                className="w-full p-3 border border-zinc-200 rounded-lg text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 min-h-[125px] resize-y"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Real-time Editor & Unified Action Group */}
        <div
          className={cn(
            "lg:col-span-6 flex flex-col space-y-2.5 w-full",
            mobileTab === "form" ? "hidden lg:flex" : "flex",
            "lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)]"
          )}
        >
          {/* Main Card containing Header + Monaco Editor */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-md flex flex-col overflow-hidden">
            {/* File Tab Header with Unified Action Group */}
            <div className="px-3 py-2 flex items-center justify-between border-b border-zinc-800 bg-zinc-900/95 shrink-0 gap-2 overflow-hidden">
              <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                <div
                  suppressHydrationWarning
                  className={cn(
                    "w-2.5 h-2.5 rounded-full shrink-0",
                    format === "cursor_mdc"
                      ? "bg-white"
                      : format === "mcp_json"
                      ? "bg-blue-400"
                      : "bg-orange-500/90"
                  )}
                />
                <span
                  suppressHydrationWarning
                  className="font-mono text-xs text-zinc-200 font-semibold truncate"
                  title={currentFileName}
                >
                  {currentFileName}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono shrink-0 hidden xl:inline-block">
                  {activeContent.split("\n").length} lines
                </span>

                {lastAutoSaved && (
                  <span className="hidden 2xl:inline-flex items-center gap-1 text-[10px] text-zinc-400 font-mono shrink-0">
                    <CheckCircle2 className="w-2.5 h-2.5 text-zinc-400" /> Auto-saved
                  </span>
                )}
                {isManuallyEdited && (
                  <button
                    onClick={() => {
                      setEditorContent(generatedContent);
                      setIsManuallyEdited(false);
                    }}
                    className="inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-950/80 border border-amber-800/90 px-2 py-0.5 rounded-md hover:bg-amber-900 transition-colors font-mono shrink-0 active:scale-95 cursor-pointer"
                    title="Reset custom in-editor edits back to template-generated output"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              {/* Action Button Group: Copy + Download + Export Kit */}
              <div className="flex items-center bg-zinc-800/90 rounded-lg p-0.5 border border-zinc-700/60 shadow-xs shrink-0 ml-auto">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2 xl:px-2.5 py-1 text-xs text-zinc-300 hover:text-white hover:bg-zinc-700/60 rounded-md transition-colors font-medium cursor-pointer"
                  title="Copy code to clipboard"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-orange-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="hidden xl:inline">{copied ? "Copied!" : "Copy"}</span>
                </button>

                <div className="w-px h-3.5 bg-zinc-700/80 mx-0.5" />

                <button
                  onClick={handleShareLink}
                  className="flex items-center gap-1 px-2 xl:px-2.5 py-1 text-xs text-zinc-300 hover:text-white hover:bg-zinc-700/60 rounded-md transition-colors font-medium cursor-pointer"
                  title="Copy shareable link to this exact configuration"
                >
                  {shareCopied ? <Check className="w-3.5 h-3.5 text-blue-400" /> : <ExternalLink className="w-3.5 h-3.5" />}
                  <span className="hidden xl:inline">{shareCopied ? "Copied!" : "Share"}</span>
                </button>

                <div className="w-px h-3.5 bg-zinc-700/80 mx-0.5" />

                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1 px-2 xl:px-2.5 py-1 text-xs text-zinc-300 hover:text-white hover:bg-zinc-700/60 rounded-md transition-colors font-medium cursor-pointer"
                  title={`Download ${currentFileName}`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">Download</span>
                </button>

                <div className="w-px h-3.5 bg-zinc-700/80 mx-0.5" />

                {/* CLI / Terminal One-Liner Install Button & Popover */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={handleCliAction}
                    className={cn(
                      "flex items-center gap-1 px-2 xl:px-2.5 py-1 text-xs rounded-md transition-colors font-medium cursor-pointer",
                      showCliDropdown
                        ? "bg-zinc-700 text-orange-400"
                        : "text-zinc-300 hover:text-white hover:bg-zinc-700/60"
                    )}
                    title={
                      isCustomEdited
                        ? "Copy custom Heredoc terminal command to install in repo"
                        : "Copy terminal curl install command to install in repo"
                    }
                  >
                    {cliCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">{isCustomEdited ? "Heredoc!" : "Copied!"}</span>
                      </>
                    ) : (
                      <>
                        <Terminal className="w-3.5 h-3.5 text-orange-400" />
                        <span className="hidden xl:inline">CLI</span>
                      </>
                    )}
                  </button>

                  {/* Dropdown Modal */}
                  {showCliDropdown && (
                    <div
                      ref={cliDropdownRef}
                      className="absolute right-0 top-full mt-2 w-80 sm:w-[480px] bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 p-4 font-sans text-xs text-zinc-200 animate-in fade-in zoom-in-95 duration-150"
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                        <div className="flex items-center gap-2">
                          <Terminal className="w-4 h-4 text-orange-400" />
                          <span className="font-semibold text-zinc-100">Terminal Command</span>
                          <span
                            className={cn(
                              "px-1.5 py-0.5 rounded text-[10px] font-mono",
                              isCustomEdited
                                ? "bg-amber-950/80 text-amber-300 border border-amber-800/80"
                                : "bg-emerald-950/80 text-emerald-300 border border-emerald-800/80"
                            )}
                          >
                            {isCustomEdited ? "Custom Heredoc" : "Preset Stream"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowCliDropdown(false)}
                          className="text-zinc-400 hover:text-white p-0.5 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Tab Options */}
                      <div className="flex items-center gap-1 mt-3 mb-2 flex-wrap">
                        {!isCustomEdited ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setCliActiveTab("bash")}
                              className={cn(
                                "px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer",
                                cliActiveTab === "bash"
                                  ? "bg-zinc-800 text-orange-400 border border-zinc-700 font-semibold"
                                  : "text-zinc-400 hover:text-zinc-200"
                              )}
                            >
                              Bash (curl)
                            </button>
                            <button
                              type="button"
                              onClick={() => setCliActiveTab("powershell")}
                              className={cn(
                                "px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer",
                                cliActiveTab === "powershell"
                                  ? "bg-zinc-800 text-orange-400 border border-zinc-700 font-semibold"
                                  : "text-zinc-400 hover:text-zinc-200"
                              )}
                            >
                              PowerShell
                            </button>
                            <button
                              type="button"
                              onClick={() => setCliActiveTab("wget")}
                              className={cn(
                                "px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer",
                                cliActiveTab === "wget"
                                  ? "bg-zinc-800 text-orange-400 border border-zinc-700 font-semibold"
                                  : "text-zinc-400 hover:text-zinc-200"
                              )}
                            >
                              Wget
                            </button>
                            {format === "mcp_json" && cliCommands.cliRunner && (
                              <button
                                type="button"
                                onClick={() => setCliActiveTab("cli")}
                                className={cn(
                                  "px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer",
                                  cliActiveTab === "cli"
                                    ? "bg-zinc-800 text-orange-400 border border-zinc-700 font-semibold"
                                    : "text-zinc-400 hover:text-zinc-200"
                                )}
                              >
                                CLI Runner
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setCliActiveTab("heredoc")}
                              className={cn(
                                "px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer",
                                cliActiveTab === "heredoc"
                                  ? "bg-zinc-800 text-orange-400 border border-zinc-700 font-semibold"
                                  : "text-zinc-400 hover:text-zinc-200"
                              )}
                            >
                              Heredoc
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => setCliActiveTab("bash")}
                              className={cn(
                                "px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer",
                                cliActiveTab === "bash"
                                  ? "bg-zinc-800 text-orange-400 border border-zinc-700 font-semibold"
                                  : "text-zinc-400 hover:text-zinc-200"
                              )}
                            >
                              Heredoc (Bash)
                            </button>
                            <button
                              type="button"
                              onClick={() => setCliActiveTab("powershell")}
                              className={cn(
                                "px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer",
                                cliActiveTab === "powershell"
                                  ? "bg-zinc-800 text-orange-400 border border-zinc-700 font-semibold"
                                  : "text-zinc-400 hover:text-zinc-200"
                              )}
                            >
                              PowerShell Script
                            </button>
                          </>
                        )}
                      </div>

                      {/* Code Display Area */}
                      <pre className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg font-mono text-[11px] leading-relaxed max-h-44 overflow-y-auto overflow-x-auto text-zinc-300 select-all whitespace-pre-wrap">
                        {currentTabCliCommand}
                      </pre>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-800/80">
                        <span className="text-[10px] text-zinc-500 truncate mr-2">
                          Target: <code className="text-zinc-400">{targetInstallFile}</code>
                        </span>
                        <button
                          type="button"
                          onClick={async () => {
                            const success = await copyToClipboard(currentTabCliCommand);
                            if (success) {
                              setCliCopied(true);
                              setTimeout(() => setCliCopied(false), 2000);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-orange-600 hover:bg-orange-500 text-white font-medium text-xs transition-colors shrink-0 cursor-pointer shadow-xs"
                        >
                          {cliCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Command</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="w-px h-3.5 bg-zinc-700/80 mx-0.5" />

                <button
                  onClick={handleExportZip}
                  disabled={isExportingZip}
                  className={cn(
                    "flex items-center gap-1 px-2 sm:px-2.5 py-1 text-xs text-white rounded-md transition-colors font-semibold shadow-xs cursor-pointer disabled:opacity-50 shrink-0",
                    format === "cursor_mdc"
                      ? "bg-zinc-800 hover:bg-black border border-zinc-600"
                      : "bg-orange-600 hover:bg-orange-500"
                  )}
                  title="Export complete workspace suite as a .zip bundle"
                >
                  <Archive className="w-3.5 h-3.5 text-orange-200 shrink-0" />
                  <span className="whitespace-nowrap">{isExportingZip ? "Zipping..." : "Export ZIP"}</span>
                </button>
              </div>
            </div>

            {/* Editor Container — Always full height */}
            <div className="h-[430px] sm:h-[520px] lg:h-[calc(100vh-16rem)] min-h-[380px] relative overflow-hidden bg-zinc-950">
              <Editor
                height="100%"
                language={format === "mcp_json" ? "json" : "markdown"}
                value={activeContent}
                theme="vs-dark"
                onMount={(editor) => {
                  editorRef.current = editor;
                  editor.setScrollTop(0);
                }}
                onChange={(val) => {
                  if (val !== undefined) {
                    setEditorContent(val);
                    setIsManuallyEdited(true);
                  }
                }}
                loading={
                  <pre className="p-4 font-mono text-xs text-zinc-300 whitespace-pre-wrap overflow-y-auto h-full select-text bg-zinc-950">
                    {activeContent}
                  </pre>
                }
                options={{
                  readOnly: false,
                  minimap: { enabled: false },
                  fontSize: 12,
                  lineHeight: 20,
                  fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Consolas, monospace",
                  wordWrap: "on",
                  lineNumbers: "on",
                  lineNumbersMinChars: 3,
                  glyphMargin: false,
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                  automaticLayout: true,
                  padding: { top: 10, bottom: 10 },
                  scrollbar: {
                    vertical: "visible",
                    horizontal: "auto",
                    verticalScrollbarSize: 8,
                    horizontalScrollbarSize: 8,
                  },
                }}
              />

              {/* Rule Quality Audit — Professional Dark Floating Panel (Anchored above status bar) */}
              {showAuditPanel && (
                <div className="absolute bottom-2 right-3 left-3 sm:left-auto sm:w-[460px] z-30 rounded-xl border border-zinc-800 bg-[#121316]/98 backdrop-blur-xl shadow-2xl shadow-black/90 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150 flex flex-col max-h-[380px]">
                  {/* Header Bar: Clean Dark Monochrome */}
                  <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 border-b border-zinc-800/80 bg-[#121316] shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-xs font-bold text-zinc-200 tracking-wider flex items-center gap-1.5 shrink-0">
                        <img src="/orange-star.png" className="w-4 h-4 object-contain shrink-0" alt="Star" />
                        <span>RULE AUDIT</span>
                      </span>

                      {/* Clean Dark Badge (NO flashy gold) */}
                      <span className="bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0">
                        {auditReport.overallScore}/100 · {auditReport.gradeLabel.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* One-click Copy Audit Report for PRs / documentation */}
                      <button
                        type="button"
                        onClick={handleCopyAuditReport}
                        className="text-zinc-400 hover:text-zinc-200 text-[11px] font-mono flex items-center gap-1 px-2 py-1 rounded hover:bg-zinc-800/80 transition-colors cursor-pointer"
                        title="Copy audit report summary to clipboard"
                      >
                        {auditCopied ? <Check className="w-3 h-3 text-zinc-200" /> : <Copy className="w-3 h-3" />}
                        <span>{auditCopied ? "Copied" : "Copy Report"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowAuditPanel(false)}
                        className="text-zinc-400 hover:text-zinc-100 p-1 rounded-md hover:bg-zinc-800/80 transition-colors cursor-pointer"
                        title="Close audit panel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Standardized 4-Column Metric Grid (Interactive Troubleshooting Filters) */}
                  <div className="p-3 bg-[#121316]/90 border-b border-zinc-800/80 shrink-0">
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, 1fr)",
                        gap: "8px",
                      }}
                    >
                      {/* Clarity */}
                      <button
                        type="button"
                        onClick={() => setSelectedDimension((prev: AuditDimension | "all") => (prev === "clarity" ? "all" : "clarity"))}
                        className={cn(
                          "flex flex-col items-start min-w-0 p-2 rounded-lg text-left transition-colors cursor-pointer border",
                          selectedDimension === "clarity"
                            ? "bg-zinc-800/80 border-zinc-500"
                            : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]"
                        )}
                        title="Click to filter Clarity diagnostics"
                      >
                        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">CLARITY</span>
                        <span className="text-[13px] font-mono font-semibold text-zinc-100">{auditReport.dimensions.clarity.score}%</span>
                      </button>

                      {/* Tokens */}
                      <button
                        type="button"
                        onClick={() => setSelectedDimension((prev: AuditDimension | "all") => (prev === "tokenDensity" ? "all" : "tokenDensity"))}
                        className={cn(
                          "flex flex-col items-start min-w-0 p-2 rounded-lg text-left transition-colors cursor-pointer border",
                          selectedDimension === "tokenDensity"
                            ? "bg-zinc-800/80 border-zinc-500"
                            : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]"
                        )}
                        title="Click to filter Token Economy diagnostics"
                      >
                        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">TOKENS</span>
                        <span className="text-[13px] font-mono font-semibold text-zinc-100">~{auditReport.tokenCount}</span>
                      </button>

                      {/* Guardrails */}
                      <button
                        type="button"
                        onClick={() => setSelectedDimension((prev: AuditDimension | "all") => (prev === "guardrails" ? "all" : "guardrails"))}
                        className={cn(
                          "flex flex-col items-start min-w-0 p-2 rounded-lg text-left transition-colors cursor-pointer border",
                          selectedDimension === "guardrails"
                            ? "bg-zinc-800/80 border-zinc-500"
                            : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]"
                        )}
                        title="Click to filter Guardrails diagnostics"
                      >
                        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">GUARDRAILS</span>
                        <span className="text-[13px] font-mono font-semibold text-zinc-100">{auditReport.dimensions.guardrails.score}%</span>
                      </button>

                      {/* Precision */}
                      <button
                        type="button"
                        onClick={() => setSelectedDimension((prev: AuditDimension | "all") => (prev === "triggers" ? "all" : "triggers"))}
                        className={cn(
                          "flex flex-col items-start min-w-0 p-2 rounded-lg text-left transition-colors cursor-pointer border",
                          selectedDimension === "triggers"
                            ? "bg-zinc-800/80 border-zinc-500"
                            : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]"
                        )}
                        title="Click to filter Precision & Scoping diagnostics"
                      >
                        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">PRECISION</span>
                        <span className="text-[13px] font-mono font-semibold text-zinc-100">{auditReport.dimensions.triggers.score}%</span>
                      </button>
                    </div>
                  </div>

                  {/* Sub-Tabs: Findings vs Checklist (Actionable & Powerful) */}
                  <div className="flex items-center justify-between px-3 bg-[#121316] border-b border-zinc-800/60 text-xs font-mono shrink-0">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setAuditTab("findings");
                          setSelectedDimension("all");
                        }}
                        className={cn(
                          "px-2.5 py-1.5 border-b-2 text-[11px] font-semibold transition-colors cursor-pointer",
                          auditTab === "findings"
                            ? "border-zinc-300 text-zinc-100 bg-zinc-800/40"
                            : "border-transparent text-zinc-500 hover:text-zinc-300"
                        )}
                      >
                        Findings ({auditReport.allIssues.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setAuditTab("checklist")}
                        className={cn(
                          "px-2.5 py-1.5 border-b-2 text-[11px] font-semibold transition-colors cursor-pointer",
                          auditTab === "checklist"
                            ? "border-zinc-300 text-zinc-100 bg-zinc-800/40"
                            : "border-transparent text-zinc-500 hover:text-zinc-300"
                        )}
                      >
                        Rule Checklist
                      </button>
                    </div>

                    {auditReport.allIssues.length > 0 && (
                      <button
                        type="button"
                        onClick={handleAutoFixAll}
                        className="text-[10px] font-mono font-semibold text-zinc-900 bg-white hover:bg-zinc-200 px-2 py-0.5 rounded transition-all cursor-pointer shadow-xs active:scale-95"
                        title="Automatically remediate all detected issues"
                      >
                        ⚡ Auto-Fix All
                      </button>
                    )}
                  </div>

                  {/* Tab Body (Scrollable) */}
                  <div className="overflow-y-auto p-3 space-y-2.5 bg-[#121316]/50 scrollbar-thin text-xs">
                    {auditTab === "findings" ? (
                      <>
                        {/* Dimension Filter Indicator */}
                        {selectedDimension !== "all" && (
                          <div className="flex items-center justify-between p-1.5 rounded bg-zinc-900/80 border border-zinc-800 text-[10px] font-mono">
                            <span className="text-zinc-400">
                              Filtered: <strong className="text-zinc-200 uppercase">{selectedDimension}</strong>
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedDimension("all")}
                              className="text-zinc-300 hover:text-white underline cursor-pointer"
                            >
                              Reset Filter
                            </button>
                          </div>
                        )}

                        <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">{auditReport.summary}</p>

                        {filteredIssues.length === 0 ? (
                          <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-zinc-900/90 border border-zinc-800 text-zinc-300 text-[11px] font-sans">
                            <img src="/orange-star.png" className="w-3.5 h-3.5 object-contain shrink-0" alt="Star" />
                            <div className="space-y-0.5">
                              <div className="font-semibold text-zinc-200">Zero Deficiencies Detected</div>
                              <div className="text-[10px] text-zinc-400">
                                Token economy ~{auditReport.tokenCount} tok • Explicit negative guard clauses verified • High trigger accuracy.
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {filteredIssues.map((issue) => (
                              <div
                                key={issue.id}
                                className={cn(
                                  "p-2.5 rounded-lg border text-[11px] space-y-1 font-sans",
                                  issue.severity === "error"
                                    ? "bg-rose-950/30 border-rose-900/60 text-rose-200"
                                    : issue.severity === "warning"
                                    ? "bg-amber-950/20 border-amber-900/50 text-amber-200"
                                    : "bg-zinc-900/60 border-zinc-800 text-zinc-200"
                                )}
                              >
                                <div className="flex items-center justify-between font-semibold">
                                  <span>{issue.title}</span>
                                  <span className="text-[8px] uppercase font-mono px-1.5 py-0.5 rounded bg-black/50 text-zinc-300">
                                    {issue.severity}
                                  </span>
                                </div>
                                <p className="text-zinc-400 text-[10px] leading-relaxed">{issue.message}</p>
                                <p className="text-[10px] text-zinc-400">
                                  <span className="font-bold text-zinc-300 font-mono">Tip: </span>
                                  {issue.suggestion}
                                </p>

                                {/* Direct Action Buttons for Immediate Fix */}
                                <div className="pt-1 flex flex-wrap items-center gap-1.5">
                                  {issue.id === "guardrails-no-negative-constraints" && (
                                    <button
                                      type="button"
                                      onClick={handleInjectNegativeGuardrails}
                                      className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors cursor-pointer"
                                    >
                                      <span>+ Inject Standard Guardrails</span>
                                    </button>
                                  )}
                                  {issue.id.startsWith("vague-") && (
                                    <button
                                      type="button"
                                      onClick={handleFixVaguePhrases}
                                      className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors cursor-pointer"
                                    >
                                      <span>+ Replace with Concrete Rules</span>
                                    </button>
                                  )}
                                  {issue.id === "trigger-cursor-global-unscoped" && (
                                    <button
                                      type="button"
                                      onClick={handleScopeGlobs}
                                      className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors cursor-pointer"
                                    >
                                      <span>{"+ Scope Globs (src/**/*.{ts,tsx})"}</span>
                                    </button>
                                  )}
                                  {issue.id === "clarity-no-code-blocks" && (
                                    <button
                                      type="button"
                                      onClick={handleInjectCodeBlock}
                                      className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors cursor-pointer"
                                    >
                                      <span>+ Add Code Reference</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      /* Checklist Tab: Powerful 4-Pillar Quality Audit Verification */
                      <div className="space-y-2 font-sans">
                        <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800 text-[11px] space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-zinc-200 font-mono">1. Boundary Guardrails</span>
                            <span className={cn("text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded", auditReport.dimensions.guardrails.score >= 70 ? "bg-zinc-800 text-zinc-200" : "bg-zinc-800 text-amber-300")}>
                              {auditReport.dimensions.guardrails.score >= 70 ? "Passed" : "Needs Review"}
                            </span>
                          </div>
                          <p className="text-zinc-400 text-[10px]">
                            {auditReport.dimensions.guardrails.score >= 70
                              ? "Explicit negative constraints ('never', 'do not') detected to prevent AI overreach."
                              : "Missing negative boundaries. Use '+ Inject Guardrails' to protect files."}
                          </p>
                        </div>

                        <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800 text-[11px] space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-zinc-200 font-mono">2. Token Economy</span>
                            <span className={cn("text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded", auditReport.tokenCount <= 1200 && auditReport.tokenCount >= 70 ? "bg-zinc-800 text-zinc-200" : "bg-zinc-800 text-amber-300")}>
                              {auditReport.tokenCount <= 1200 && auditReport.tokenCount >= 70 ? "Optimal" : "Attention"}
                            </span>
                          </div>
                          <p className="text-zinc-400 text-[10px]">
                            ~{auditReport.tokenCount} tokens footprint. Keeps conversation windows lean without degrading prompt context.
                          </p>
                        </div>

                        <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800 text-[11px] space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-zinc-200 font-mono">3. Directive Clarity</span>
                            <span className={cn("text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded", auditReport.dimensions.clarity.score >= 85 ? "bg-zinc-800 text-zinc-200" : "bg-zinc-800 text-amber-300")}>
                              {auditReport.dimensions.clarity.score >= 85 ? "Passed" : "Vague Terms"}
                            </span>
                          </div>
                          <p className="text-zinc-400 text-[10px]">
                            {auditReport.dimensions.clarity.score >= 85
                              ? "Actionable instructions without subjective preambles ('write clean code')."
                              : "Found vague directives. Replace with concrete technical standards."}
                          </p>
                        </div>

                        <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800 text-[11px] space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-zinc-200 font-mono">4. Scope & Triggers</span>
                            <span className={cn("text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded", auditReport.dimensions.triggers.score >= 80 ? "bg-zinc-800 text-zinc-200" : "bg-zinc-800 text-amber-300")}>
                              {auditReport.dimensions.triggers.score >= 80 ? "Passed" : "Review Scope"}
                            </span>
                          </div>
                          <p className="text-zinc-400 text-[10px]">
                            Evaluates target globs or activation description so rules only fire on relevant file contexts.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Native IDE Bottom Status Bar with Anchored Audit Launcher (Pure Dark / Black + Orange Star) */}
            <div className="px-3 py-1.5 bg-[#121316] border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono select-none shrink-0 gap-2">
              {/* Left: File and Editor Metrics */}
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex items-center gap-1 text-zinc-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                  <span className="text-[10px] uppercase font-semibold text-zinc-300">
                    {format === "mcp_json" ? "JSON" : format === "cursor_mdc" ? "MDC" : "Markdown"}
                  </span>
                </span>
                <span className="hidden sm:inline text-zinc-700">•</span>
                <span className="hidden sm:inline text-zinc-500 text-[10px]">UTF-8</span>
                <span className="hidden sm:inline text-zinc-700">•</span>
                <span className="text-zinc-400 text-[10px]">{activeContent.split("\n").length} Lines</span>
                <span className="hidden md:inline text-zinc-700">•</span>
                <span className="hidden md:inline text-zinc-500 text-[10px]">Spaces: 2</span>
              </div>

              {/* Right: Anchored Audit Launcher Button (Black/Zinc + Orange Star, NO flashy gold) */}
              <button
                type="button"
                onClick={() => setShowAuditPanel((prev) => !prev)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border transition-colors cursor-pointer shrink-0",
                  showAuditPanel
                    ? "bg-zinc-800 text-white border-zinc-600"
                    : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-700/80"
                )}
                title="Toggle Rule Quality & Security Audit"
              >
                <img src="/orange-star.png" className="w-3.5 h-3.5 object-contain shrink-0" alt="Star" />
                <span className="font-semibold text-zinc-100">{auditReport.overallScore}/100</span>
                <span className="text-zinc-600">·</span>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider">{auditReport.gradeLabel}</span>
                <span className="text-[9px] text-zinc-500 ml-0.5">{showAuditPanel ? "▼" : "▲"}</span>
              </button>
            </div>
          </div>

          {/* Instructional Target Location Card (Compact) */}
          <div suppressHydrationWarning className="bg-white rounded-xl border border-zinc-200 p-3 shadow-xs text-xs space-y-1.5 shrink-0">
            <div className="flex items-center gap-1.5 font-semibold text-zinc-900">
              {format === "cursor_mdc" ? (
                <img src="/cursor-icon.png" alt="Cursor" className="w-3.5 h-3.5 object-contain" />
              ) : format === "claude_md" ? (
                <img src="/claude-icon.png" alt="Claude" className="w-3.5 h-3.5 object-contain" />
              ) : format === "mcp_json" ? (
                <Server className="w-3.5 h-3.5 text-orange-600" />
              ) : (
                <FolderGit2 className={cn("w-3.5 h-3.5", format === "skill_md" ? "text-orange-500" : "text-zinc-800")} />
              )}
              <span>Target File Location</span>
            </div>
            {format === "skill_md" && (
              <p className="text-zinc-500 text-xs leading-relaxed">
                Save as <code className="bg-zinc-100 px-1 py-0.5 rounded text-zinc-800 font-mono text-[11px]">.claude/skills/{(skillName || "skill").replace(/[^a-zA-Z0-9._-]/g, "-")}/SKILL.md</code> in project root, or in <code className="bg-zinc-100 px-1 py-0.5 rounded text-zinc-800 font-mono text-[11px]">~/.claude/skills/{(skillName || "skill").replace(/[^a-zA-Z0-9._-]/g, "-")}/SKILL.md</code> for global Claude Code availability.
              </p>
            )}
            {format === "claude_md" && (
              <p className="text-zinc-500 text-xs leading-relaxed">
                Save as <code className="bg-zinc-100 px-1 py-0.5 rounded text-zinc-800 font-mono text-[11px]">CLAUDE.md</code> directly in the root directory. Parsed automatically at the start of every session.
              </p>
            )}
            {format === "cursor_mdc" && (
              <p className="text-zinc-500 text-xs leading-relaxed">
                Save in <code className="bg-zinc-100 px-1 py-0.5 rounded text-zinc-800 font-mono text-[11px]">.cursor/rules/{(skillName || "rule").replace(/[^a-zA-Z0-9._-]/g, "-")}.mdc</code>. Evaluated via glob patterns for targeted context.
              </p>
            )}
            {format === "agents_md" && (
              <p className="text-zinc-500 text-xs leading-relaxed">
                Save as <code className="bg-zinc-100 px-1 py-0.5 rounded text-zinc-800 font-mono text-[11px]">AGENTS.md</code> in your root directory. Multi-agent workflows load this spec to coordinate tasks.
              </p>
            )}
            {format === "mcp_json" && (
              <p className="text-zinc-500 text-xs leading-relaxed">
                Save as <code className="bg-zinc-100 px-1 py-0.5 rounded text-zinc-800 font-mono text-[11px]">claude.json</code> in project root or merge its <code className="bg-zinc-100 px-1 py-0.5 rounded text-zinc-800 font-mono text-[11px]">mcpServers</code> block into Claude Desktop <code className="bg-zinc-100 px-1 py-0.5 rounded text-zinc-800 font-mono text-[11px]">claude_desktop_config.json</code>.
              </p>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Floating Action Bar (Sticky at bottom on < lg) */}
      <div className="lg:hidden fixed bottom-3 left-3 right-3 z-40">
        {mobileTab === "form" ? (
          <button
            type="button"
            onClick={() => {
              setMobileTab("editor");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="w-full bg-zinc-900/95 hover:bg-black text-white px-4 py-3 rounded-xl shadow-2xl border border-zinc-700/90 flex items-center justify-between backdrop-blur-md transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse shrink-0" />
              <span className="text-xs font-semibold truncate">{currentFileName} Ready</span>
              <span className="text-[10px] font-mono bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300 shrink-0">
                {activeContent.split("\n").length}L
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-orange-400 shrink-0">
              <span>View Code</span>
              <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
            </div>
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-zinc-900/95 p-1.5 rounded-xl shadow-2xl border border-zinc-700/90 backdrop-blur-md">
            <button
              type="button"
              onClick={() => {
                setMobileTab("form");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="flex-1 flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold py-2.5 rounded-lg transition-all active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Edit Settings</span>
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold py-2.5 rounded-lg transition-all active:scale-95 shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy Code"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Manifest Import Modal (P2) */}
      <ManifestImportModal
        isOpen={isManifestModalOpen}
        onClose={() => setIsManifestModalOpen(false)}
        onApply={handleApplyManifest}
      />
    </div>
  );
}
