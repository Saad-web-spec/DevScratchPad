"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { flushSync } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import {
  Copy,
  Check,
  Download,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Archive,
  AlertTriangle,
  ExternalLink,
  X,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { downloadAiKitZip } from "./lib/zipExporter";
import { EXPORT_FORMATS, getExportTarget } from "./lib/exportTargets";
import { ParsedManifestResult } from "./lib/manifestParser";
import { ConvertedRulesIR } from "./lib/rulesConverter";
import { DownloadAuditHud, DownloadHudPayload } from "./components/DownloadAuditHud";

const ManifestImportModal = dynamic(
  () => import("./components/ManifestImportModal").then((m) => m.ManifestImportModal),
  { ssr: false }
);
const RulesConverterModal = dynamic(
  () => import("./components/RulesConverterModal").then((m) => m.RulesConverterModal),
  { ssr: false }
);
const GitHubRepoModal = dynamic(
  () => import("./components/GitHubRepoModal").then((m) => m.GitHubRepoModal),
  { ssr: false }
);
const DdlIntrospectModal = dynamic(
  () => import("./components/DdlIntrospectModal").then((m) => m.DdlIntrospectModal),
  { ssr: false }
);
const DockerInspectModal = dynamic(
  () => import("./components/DockerInspectModal").then((m) => m.DockerInspectModal),
  { ssr: false }
);
const LocalFolderModal = dynamic(
  () => import("./components/LocalFolderModal").then((m) => m.LocalFolderModal),
  { ssr: false }
);
import { IngestedRepoAnalysis } from "./lib/githubIngest";
import { ParsedDatabaseSchema } from "./lib/ddlParser";
import { ParsedDockerCompose } from "./lib/dockerParser";
import { LocalProjectAnalysis, pickAndInspectLocalDirectory, pickLocalDirectory } from "./lib/fsPicker";
import { generateSafeSlug, validateTriggerPhrase } from "./lib/slugUtils";
import { saveToStorageEnvelope, loadFromStorageEnvelope, STORAGE_KEY_V2 } from "./lib/storageEnvelope";
import { auditRuleQuality, AuditDimension } from "./lib/ruleAuditor";
import { findSectionLineRange, MarkedSectionRange } from "./lib/sectionLocator";
import { computeFollowScrollTop, findFirstChangedLine } from "./lib/markerScroll";
import { configureMonacoLoader } from "@/lib/monacoLoader";
import {
  GovernanceSections,
  type GovernanceFieldKey,
  type GovernanceFormat,
  type GovernanceValues,
} from "./components/GovernanceSections";
import { IgnoreShieldSuite } from "./components/IgnoreShieldSuite";
import { McpServerConfigCard } from "./components/McpServerConfigCard";
import { FormatSelector } from "./components/FormatSelector";
import { TargetLocationCard } from "./components/TargetLocationCard";
import { CursorRuleScopeCard } from "./components/CursorRuleScopeCard";
import { IdentityActivationCard } from "./components/IdentityActivationCard";
import {
  TechStackCard,
  PhilosophyCard,
  ConventionsCard,
  BehaviorGuardrailsCard,
  ProceduresCard,
} from "./components/StandardSkillCards";
import { CliInstallPopover } from "./components/CliInstallPopover";
import { AuditPanel, type AuditTab } from "./components/AuditPanel";
import { EditorStatusBar } from "./components/EditorStatusBar";
import { MobileViewSwitcher, MobileActionBar, type MobileTab } from "./components/MobileStudioControls";

// Dynamically import Monaco Editor to prevent SSR issues
const Editor = dynamic(
  () =>
    import("@monaco-editor/react").then((mod) => {
      configureMonacoLoader(mod.loader);
      return mod.default;
    }),
  { ssr: false }
);

import {
  OutputFormat,
  SkillPreset,
  MCP_PRESETS,
  PRESETS,
  PHILOSOPHIES,
  buildRuleContent,
  getInstallCommands,
  getHeredocCommand,
  copyToClipboard,
  getDefaultPrdValues,
  getDefaultDesignValues,
  getDefaultTaskValues,
  getDefaultMemoryValues,
} from "./lib/ruleGenerator";
import { SLUG_ALIASES, FORMAT_TO_URL_SLUG } from "./lib/presetRegistry";
import { getFormatHub } from "./lib/formatHubs";
import { decodeStudioState, createShareableUrl } from "./lib/stateSharing";
import { synthesizeContextFields } from "./lib/contextSynthesis";
import {
  buildAuditReportMarkdown,
  replaceVaguePhrases,
  fixFormatCompliance,
  autoFixAllContent,
  refineBroadTriggerTags,
  NEGATIVE_GUARDRAILS_SNIPPET,
  CODE_REFERENCE_SNIPPET,
  type FormatFixContext,
} from "./lib/auditQuickFixes";
import {
  getCliFormatSlug,
  resolveActivePresetSlug,
  resolveTargetInstallFile,
  getPowershellHeredocCommand,
  selectCliCommand,
  isCustomizedFromPreset,
  type CliTab,
} from "./lib/cliInstall";
import { buildShareState } from "./lib/shareState";
import { getEditorFileName } from "./lib/editorFileName";

interface ClaudeSkillsClientProps {
  initialFormat?: OutputFormat;
  initialPresetId?: string;
  formatSlug?: string;
  presetSlug?: string;
  /** Page H1 and intro shown above the editor. Omit on pages that render their own H1. */
  heading?: { title: string; description?: string };
}

export function ClaudeSkillsClient({
  initialFormat,
  initialPresetId,
  presetSlug: initialPresetSlug,
  heading,
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

  // Dedicated Governance Sections State
  const initialPrd = useMemo(() => getDefaultPrdValues(defaultPreset), [defaultPreset]);
  const [prdOverview, setPrdOverview] = useState(() => initialPrd.prdOverview);
  const [prdProblemStatement, setPrdProblemStatement] = useState(() => initialPrd.prdProblemStatement);
  const [prdPersonas, setPrdPersonas] = useState(() => initialPrd.prdPersonas);
  const [prdFunctionalReqs, setPrdFunctionalReqs] = useState(() => initialPrd.prdFunctionalReqs);
  const [prdNonFunctionalReqs, setPrdNonFunctionalReqs] = useState(() => initialPrd.prdNonFunctionalReqs);
  const [prdMilestones, setPrdMilestones] = useState(() => initialPrd.prdMilestones);

  const initialDesign = useMemo(() => getDefaultDesignValues(defaultPreset), [defaultPreset]);
  const [designTokens, setDesignTokens] = useState(() => initialDesign.designTokens);
  const [designLayout, setDesignLayout] = useState(() => initialDesign.designLayout);
  const [designConventions, setDesignConventions] = useState(() => initialDesign.designConventions);
  const [designGuardrails, setDesignGuardrails] = useState(() => initialDesign.designGuardrails);
  const [designDirectives, setDesignDirectives] = useState(() => initialDesign.designDirectives);
  const [designVerification, setDesignVerification] = useState(() => initialDesign.designVerification);

  const initialTask = useMemo(() => getDefaultTaskValues(defaultPreset), [defaultPreset]);
  const [taskDashboard, setTaskDashboard] = useState(() => initialTask.taskDashboard);
  const [taskPhases, setTaskPhases] = useState(() => initialTask.taskPhases);
  const [taskVerification, setTaskVerification] = useState(() => initialTask.taskVerification);
  const [taskDirectives, setTaskDirectives] = useState(() => initialTask.taskDirectives);
  const [taskSessionLog, setTaskSessionLog] = useState(() => initialTask.taskSessionLog);

  const initialMemory = useMemo(() => getDefaultMemoryValues(defaultPreset), [defaultPreset]);
  const [memoryContext, setMemoryContext] = useState(() => initialMemory.memoryContext);
  const [memoryAdrs, setMemoryAdrs] = useState(() => initialMemory.memoryAdrs);
  const [memoryGotchas, setMemoryGotchas] = useState(() => initialMemory.memoryGotchas);
  const [memoryLoop, setMemoryLoop] = useState(() => initialMemory.memoryLoop);
  const [memoryInvariants, setMemoryInvariants] = useState(() => initialMemory.memoryInvariants);
  const [memorySessionHistory, setMemorySessionHistory] = useState(() => initialMemory.memorySessionHistory);

  // Governance section values and setters keyed by section, consumed by <GovernanceSections />
  const governanceValues: GovernanceValues = {
    prdOverview, prdProblemStatement, prdPersonas, prdFunctionalReqs, prdNonFunctionalReqs, prdMilestones,
    designTokens, designLayout, designConventions, designGuardrails, designDirectives, designVerification,
    taskDashboard, taskPhases, taskVerification, taskDirectives, taskSessionLog,
    memoryContext, memoryAdrs, memoryGotchas, memoryLoop, memoryInvariants, memorySessionHistory,
  };
  // State setters are stable, so the map is built once
  const governanceSetters = useMemo<Record<GovernanceFieldKey, (value: string) => void>>(() => ({
    prdOverview: setPrdOverview, prdProblemStatement: setPrdProblemStatement, prdPersonas: setPrdPersonas,
    prdFunctionalReqs: setPrdFunctionalReqs, prdNonFunctionalReqs: setPrdNonFunctionalReqs, prdMilestones: setPrdMilestones,
    designTokens: setDesignTokens, designLayout: setDesignLayout, designConventions: setDesignConventions,
    designGuardrails: setDesignGuardrails, designDirectives: setDesignDirectives, designVerification: setDesignVerification,
    taskDashboard: setTaskDashboard, taskPhases: setTaskPhases, taskVerification: setTaskVerification,
    taskDirectives: setTaskDirectives, taskSessionLog: setTaskSessionLog,
    memoryContext: setMemoryContext, memoryAdrs: setMemoryAdrs, memoryGotchas: setMemoryGotchas,
    memoryLoop: setMemoryLoop, memoryInvariants: setMemoryInvariants, memorySessionHistory: setMemorySessionHistory,
  }), []);

  // Advanced Runtime Controls & Direct Editor Editing
  const [globPattern, setGlobPattern] = useState("**/*");
  const [alwaysApply, setAlwaysApply] = useState(false);
  const [editorContent, setEditorContent] = useState<string>("");
  const editorRef = React.useRef<any>(null);
  const [isManuallyEdited, setIsManuallyEditedState] = useState(false);
  // Manual editor edits for formats other than the active one, preserved across format switches
  const [stashedEdits, setStashedEdits] = useState<Partial<Record<OutputFormat, string>>>({});
  // Last manual edit that a form change replaced, offered back to the user via a restore notice
  const [discardedEdit, setDiscardedEdit] = useState<{ format: OutputFormat; content: string } | null>(null);
  const isManuallyEditedRef = React.useRef(false);
  const editorContentRef = React.useRef("");
  const formatRef = React.useRef<OutputFormat>(format);
  const stashedEditsRef = React.useRef<Partial<Record<OutputFormat, string>>>({});

  useEffect(() => {
    editorContentRef.current = editorContent;
    formatRef.current = format;
    stashedEditsRef.current = stashedEdits;
  }, [editorContent, format, stashedEdits]);

  // Clearing the manual flag regenerates output from the form; remember the replaced edit so it can be restored
  const setIsManuallyEdited = useCallback((next: boolean) => {
    if (!next && isManuallyEditedRef.current) {
      setDiscardedEdit({ format: formatRef.current, content: editorContentRef.current });
    } else if (next) {
      setDiscardedEdit(null);
    }
    isManuallyEditedRef.current = next;
    setIsManuallyEditedState(next);
  }, []);

  // Presets and ingestion replace the whole project context, so edits stashed for other formats are stale
  const resetAllManualEdits = useCallback(() => {
    stashedEditsRef.current = {};
    setStashedEdits({});
    setIsManuallyEdited(false);
  }, [setIsManuallyEdited]);

  const handleGovernanceChange = (key: GovernanceFieldKey, value: string) => {
    governanceSetters[key](value);
    setIsManuallyEdited(false);
  };
  const [lastAutoSaved, setLastAutoSaved] = useState<string | null>(null);
  const [quotaError, setQuotaError] = useState<string | null>(null);
  const [isManifestModalOpen, setIsManifestModalOpen] = useState(false);
  const [isConverterModalOpen, setIsConverterModalOpen] = useState(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [isDdlModalOpen, setIsDdlModalOpen] = useState(false);
  const [isDockerModalOpen, setIsDockerModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("form");
  const [shouldLoadEditor, setShouldLoadEditor] = useState(false);

  // White Marker — tracks which form field is actively being edited and its corresponding line range
  const [activeFieldKey, setActiveFieldKey] = useState<string | null>(null);
  const activeFieldKeyRef = React.useRef<string | null>(null);
  const [scrollRequestId, setScrollRequestId] = useState(0);
  const [editorReady, setEditorReady] = useState(false);
  const decorationsCollectionRef = React.useRef<any>(null);
  const markerDecorationsRef = React.useRef<string[]>([]);
  const previewContainerRef = React.useRef<HTMLPreElement>(null);
  const monacoInstanceRef = React.useRef<any>(null);

  // Synchronize activeFieldKeyRef whenever activeFieldKey changes
  useEffect(() => {
    activeFieldKeyRef.current = activeFieldKey;
  }, [activeFieldKey]);

  const requestSectionScroll = useCallback((fieldKey?: string) => {
    if (fieldKey) {
      activeFieldKeyRef.current = fieldKey;
      setActiveFieldKey(fieldKey);
    }
    setScrollRequestId((prev) => prev + 1);
  }, []);

  // Synchronize browser address bar with current format and preset without re-rendering or wiping state
  const syncUrl = useCallback((targetPath: string, replace = false) => {
    if (typeof window === "undefined") return;
    const currentPath = window.location.pathname;
    if (currentPath === targetPath) return;

    // Only sync if we are within the /ai-skill-studio path hierarchy
    if (!currentPath.startsWith("/ai-skill-studio")) return;

    const currentHash = window.location.hash;
    const fullTarget = currentHash ? `${targetPath}${currentHash}` : targetPath;

    try {
      if (replace) {
        window.history.replaceState({ path: targetPath }, "", fullTarget);
      } else {
        window.history.pushState({ path: targetPath }, "", fullTarget);
      }
    } catch {
      // Ignore browser restrictions silently
    }
  }, []);

  // Central format switcher — clears active markers, resets editor to top, updates format and syncs URL
  const handleSelectFormat = useCallback((newFormat: OutputFormat) => {
    const prevFormat = formatRef.current;
    if (newFormat !== prevFormat) {
      // Stash the outgoing format's manual edits and restore any previously stashed edits for the incoming one
      const nextStash = { ...stashedEditsRef.current };
      if (isManuallyEditedRef.current) nextStash[prevFormat] = editorContentRef.current;
      const restored = nextStash[newFormat];
      delete nextStash[newFormat];
      stashedEditsRef.current = nextStash;
      setStashedEdits(nextStash);
      setDiscardedEdit(null);
      if (restored !== undefined) {
        setEditorContent(restored);
        editorContentRef.current = restored;
      }
      isManuallyEditedRef.current = restored !== undefined;
      setIsManuallyEditedState(restored !== undefined);
      formatRef.current = newFormat;
    }
    setFormat(newFormat);
    activeFieldKeyRef.current = null;
    setActiveFieldKey(null);
    if (editorRef.current) {
      try {
        editorRef.current.setScrollTop(0);
      } catch {
        /* noop */
      }
    }
    const targetSlug = FORMAT_TO_URL_SLUG[newFormat] || "cursor-rules";
    syncUrl(`/ai-skill-studio/${targetSlug}`);
  }, [syncUrl]);

  useEffect(() => {
    if (mobileTab === "editor") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShouldLoadEditor(true);
    }
  }, [mobileTab]);

  // Proactively pre-warm Monaco bundle and mount in background during idle time
  useEffect(() => {
    let cancel = false;
    const warmUp = () => {
      if (cancel) return;
      import("@monaco-editor/react")
        .then(({ loader }) => {
          if (!cancel && loader) {
            configureMonacoLoader(loader);
            loader
              .init()
              .then(() => {
                // On desktop viewports (>= 1024px), automatically transition to full Monaco once idle
                if (!cancel && typeof window !== "undefined" && window.innerWidth >= 1024) {
                  setShouldLoadEditor(true);
                }
              })
              .catch(() => {});
          }
        })
        .catch(() => {});
    };

    if (typeof window !== "undefined") {
      if ("requestIdleCallback" in window) {
        const id = (window as Window & { requestIdleCallback?: any }).requestIdleCallback(warmUp, { timeout: 1500 });
        return () => {
          cancel = true;
          (window as Window & { cancelIdleCallback?: any }).cancelIdleCallback?.(id);
        };
      } else {
        const timer = setTimeout(warmUp, 800);
        return () => {
          cancel = true;
          clearTimeout(timer);
        };
      }
    }
  }, []);

  const isGovernanceFormat = format === "prd_md" || format === "design_md" || format === "task_md" || format === "memory_md";
  const isMcpFormat = format === "mcp_json";
  const isIgnoreFormat = format === "cursorignore" || format === "claudeignore";

  // Ignore Shield & Indexing Boundary Suite State
  const [ignoreCategories, setIgnoreCategories] = useState<string[]>([
    "secrets",
    "dependencies",
    "build",
    "media",
    "logs",
    "ide",
    "database",
    "fixtures",
  ]);
  const [ignorePreset, setIgnorePreset] = useState<"full_shield" | "security_only" | "max_token_saver" | "custom">("full_shield");
  const [customIgnoreRules, setCustomIgnoreRules] = useState<string>("");

  const handleToggleCategory = (catId: string) => {
    setIgnoreCategories((prev) => {
      const next = prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId];
      return next;
    });
    setIgnorePreset("custom");
    setIsManuallyEdited(false);
  };

  const handleSelectIgnoreProfile = (preset: "full_shield" | "security_only" | "max_token_saver" | "custom") => {
    setIgnorePreset(preset);
    setIsManuallyEdited(false);
    if (preset === "full_shield") {
      setIgnoreCategories(["secrets", "dependencies", "build", "media", "logs", "ide", "database", "fixtures"]);
    } else if (preset === "security_only") {
      setIgnoreCategories(["secrets", "database"]);
    } else if (preset === "max_token_saver") {
      setIgnoreCategories(["dependencies", "build", "media", "fixtures", "logs"]);
    }
  };

  // Slug lock & Static Analysis Audit Panel State
  const [isSlugLocked, setIsSlugLocked] = useState(false);
  const [showAuditPanel, setShowAuditPanel] = useState(false);
  const [auditTab, setAuditTab] = useState<AuditTab>("findings");
  const [auditCopied, setAuditCopied] = useState(false);
  const [selectedDimension, setSelectedDimension] = useState<AuditDimension | "all">("all");

  // Download Audit HUD — bottom notification triggered on download/export
  const [downloadHudPayload, setDownloadHudPayload] = useState<DownloadHudPayload | null>(null);
  const downloadHudIdRef = React.useRef(0);

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

  // Interactive Trigger Tag Chips State & Validation
  const [triggerTags, setTriggerTags] = useState<string[]>(["api-routes", "code-audits", "refactoring"]);
  const [newTagInput, setNewTagInput] = useState("");

  const handleAddTag = (tagToAdd: string) => {
    const clean = tagToAdd.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
    if (clean && !triggerTags.includes(clean)) {
      setTriggerTags((prev) => [...prev, clean]);
    }
    setNewTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTriggerTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  // Real-time Activation Trigger Validation
  const triggerValidation = useMemo(() => {
    return validateTriggerPhrase(description, triggerTags);
  }, [description, triggerTags]);

  // MCP Server state
  const [mcpPresetId, setMcpPresetId] = useState<string>(() => defaultMcpPreset.id);
  const [mcpServerName, setMcpServerName] = useState<string>(() => defaultMcpPreset.name);
  const [mcpCommand, setMcpCommand] = useState<string>(() => defaultMcpPreset.command);
  const [mcpArgs, setMcpArgs] = useState<string>(() => defaultMcpPreset.args.join("\n"));
  const [mcpEnvKey, setMcpEnvKey] = useState<string>(() => Object.keys(defaultMcpPreset.env)[0] || "");
  const [mcpEnvValue, setMcpEnvValue] = useState<string>(() => Object.values(defaultMcpPreset.env)[0] || "");

  // Real-time MCP Validation
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
    syncUrl(`/ai-skill-studio/mcp-config/${presetId}`);
  };

  // Browser Back/Forward navigation listener
  useEffect(() => {
    const handlePopState = () => {
      const pathname = window.location.pathname;
      if (!pathname.startsWith("/ai-skill-studio")) return;

      const segments = pathname.replace(/^\/ai-skill-studio\/?/, "").split("/").filter(Boolean);
      if (segments.length === 0) return;

      const fSlug = segments[0];
      const pSlug = segments[1];

      if (fSlug) {
        const hub = getFormatHub(fSlug);
        if (hub) {
          setFormat(hub.format);
        }
      }

      if (pSlug) {
        const matchedMcp = MCP_PRESETS.find((m) => m.id === pSlug || m.name === pSlug);
        if (matchedMcp) {
          setMcpPresetId(matchedMcp.id);
        }
        const matchedPreset = PRESETS.find((p) => p.slug === pSlug || p.id === pSlug);
        if (matchedPreset) {
          setSelectedPresetId(matchedPreset.id);
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Storage envelope state restore on mount (with automatic v1 legacy migration)
  useEffect(() => {
    async function loadState() {
      let hashState: any = null;
      try {
        const hash = window.location.hash;
        if (hash && hash.length > 1) {
          hashState = await decodeStudioState(hash);
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
          // A shared link's format wins, then the route's format deep link, then the saved draft's last-used format
          const storedFormat: OutputFormat | null = s.format && s.format !== "subagent_json" ? s.format : null;
          const activeFormat: OutputFormat = (hashState ? storedFormat : null) ?? initialFormat ?? storedFormat ?? formatRef.current;
          formatRef.current = activeFormat;
          setFormat(activeFormat);
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
          // Saved manual edits are keyed by format: the active format's edit goes to the editor, the rest to the stash
          const restoredStash: Partial<Record<OutputFormat, string>> = {};
          if (s.stashedEdits && typeof s.stashedEdits === "object") {
            for (const [key, value] of Object.entries(s.stashedEdits)) {
              if (typeof value === "string") restoredStash[key as OutputFormat] = value;
            }
          }
          if (s.editorContent && s.isManuallyEdited) {
            restoredStash[storedFormat ?? activeFormat] = s.editorContent;
          }
          const activeEdit = restoredStash[activeFormat];
          delete restoredStash[activeFormat];
          stashedEditsRef.current = restoredStash;
          setStashedEdits(restoredStash);
          if (activeEdit !== undefined) {
            setEditorContent(activeEdit);
            editorContentRef.current = activeEdit;
            setIsManuallyEdited(true);
          }
          if (Array.isArray(s.ignoreCategories)) setIgnoreCategories(s.ignoreCategories);
          if (s.ignorePreset) setIgnorePreset(s.ignorePreset);
          if (typeof s.customIgnoreRules === "string") setCustomIgnoreRules(s.customIgnoreRules);
          if (typeof s.prdOverview === "string") setPrdOverview(s.prdOverview);
          if (typeof s.prdProblemStatement === "string") setPrdProblemStatement(s.prdProblemStatement);
          if (typeof s.prdPersonas === "string") setPrdPersonas(s.prdPersonas);
          if (typeof s.prdFunctionalReqs === "string") setPrdFunctionalReqs(s.prdFunctionalReqs);
          if (typeof s.prdNonFunctionalReqs === "string") setPrdNonFunctionalReqs(s.prdNonFunctionalReqs);
          if (typeof s.prdMilestones === "string") setPrdMilestones(s.prdMilestones);
          if (typeof s.designTokens === "string") setDesignTokens(s.designTokens);
          if (typeof s.designLayout === "string") setDesignLayout(s.designLayout);
          if (typeof s.designConventions === "string") setDesignConventions(s.designConventions);
          if (typeof s.designGuardrails === "string") setDesignGuardrails(s.designGuardrails);
          if (typeof s.designDirectives === "string") setDesignDirectives(s.designDirectives);
          if (typeof s.designVerification === "string") setDesignVerification(s.designVerification);
          if (typeof s.taskDashboard === "string") setTaskDashboard(s.taskDashboard);
          if (typeof s.taskPhases === "string") setTaskPhases(s.taskPhases);
          if (typeof s.taskVerification === "string") setTaskVerification(s.taskVerification);
          if (typeof s.taskDirectives === "string") setTaskDirectives(s.taskDirectives);
          if (typeof s.taskSessionLog === "string") setTaskSessionLog(s.taskSessionLog);
          if (typeof s.memoryContext === "string") setMemoryContext(s.memoryContext);
          if (typeof s.memoryAdrs === "string") setMemoryAdrs(s.memoryAdrs);
          if (typeof s.memoryGotchas === "string") setMemoryGotchas(s.memoryGotchas);
          if (typeof s.memoryLoop === "string") setMemoryLoop(s.memoryLoop);
          if (typeof s.memoryInvariants === "string") setMemoryInvariants(s.memoryInvariants);
          if (typeof s.memorySessionHistory === "string") setMemorySessionHistory(s.memorySessionHistory);
        }
      } catch (e) {
        console.error(e);
      }
      setIsMounted(true);
    }
    loadState();
  }, [initialFormat, initialPresetId, setIsManuallyEdited]);

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
          // Literal tokens stay in memory only; env references like ${VAR} are safe to persist
          mcpEnvValue: mcpEnvValue.trim().startsWith("${") ? mcpEnvValue : "",
          // Unedited editor content is regenerated from the form on load, and could embed the literal token above
          editorContent: isManuallyEdited ? editorContent : "",
          isManuallyEdited,
          stashedEdits,
          ignoreCategories,
          ignorePreset,
          customIgnoreRules,
          prdOverview,
          prdProblemStatement,
          prdPersonas,
          prdFunctionalReqs,
          prdNonFunctionalReqs,
          prdMilestones,
          designTokens,
          designLayout,
          designConventions,
          designGuardrails,
          designDirectives,
          designVerification,
          taskDashboard,
          taskPhases,
          taskVerification,
          taskDirectives,
          taskSessionLog,
          memoryContext,
          memoryAdrs,
          memoryGotchas,
          memoryLoop,
          memoryInvariants,
          memorySessionHistory,
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
    stashedEdits,
    ignoreCategories,
    ignorePreset,
    customIgnoreRules,
    prdOverview,
    prdProblemStatement,
    prdPersonas,
    prdFunctionalReqs,
    prdNonFunctionalReqs,
    prdMilestones,
    designTokens,
    designLayout,
    designConventions,
    designGuardrails,
    designDirectives,
    designVerification,
    taskDashboard,
    taskPhases,
    taskVerification,
    taskDirectives,
    taskSessionLog,
    memoryContext,
    memoryAdrs,
    memoryGotchas,
    memoryLoop,
    memoryInvariants,
    memorySessionHistory,
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

    // Sync governance section fields to matching preset defaults
    const newPrd = getDefaultPrdValues(preset);
    setPrdOverview(newPrd.prdOverview);
    setPrdProblemStatement(newPrd.prdProblemStatement);
    setPrdPersonas(newPrd.prdPersonas);
    setPrdFunctionalReqs(newPrd.prdFunctionalReqs);
    setPrdNonFunctionalReqs(newPrd.prdNonFunctionalReqs);
    setPrdMilestones(newPrd.prdMilestones);

    const newDesign = getDefaultDesignValues(preset);
    setDesignTokens(newDesign.designTokens);
    setDesignLayout(newDesign.designLayout);
    setDesignConventions(newDesign.designConventions);
    setDesignGuardrails(newDesign.designGuardrails);
    setDesignDirectives(newDesign.designDirectives);
    setDesignVerification(newDesign.designVerification);

    const newTask = getDefaultTaskValues(preset);
    setTaskDashboard(newTask.taskDashboard);
    setTaskPhases(newTask.taskPhases);
    setTaskVerification(newTask.taskVerification);
    setTaskDirectives(newTask.taskDirectives);
    setTaskSessionLog(newTask.taskSessionLog);

    const newMemory = getDefaultMemoryValues(preset);
    setMemoryContext(newMemory.memoryContext);
    setMemoryAdrs(newMemory.memoryAdrs);
    setMemoryGotchas(newMemory.memoryGotchas);
    setMemoryLoop(newMemory.memoryLoop);
    setMemoryInvariants(newMemory.memoryInvariants);
    setMemorySessionHistory(newMemory.memorySessionHistory);

    // Auto-switch format according to preset runtime
    let targetFormat = format;
    if (preset.id === "cursor-mdc-pro") {
      targetFormat = "cursor_mdc";
      setFormat("cursor_mdc");
      setGlobPattern("**/*");
      setAlwaysApply(false);
    } else if (preset.id === "claude-auditor" || preset.id === "security-guard") {
      targetFormat = "skill_md";
      setFormat("skill_md");
    } else if (preset.id === "fullstack-agent-team") {
      targetFormat = "agents_md";
      setFormat("agents_md");
    }

    // Reset manual edit flag and clear markers so the preset content takes over cleanly
    resetAllManualEdits();
    setActiveFieldKey(null);
    if (editorRef.current) {
      try { editorRef.current.setScrollTop(0); } catch { /* noop */ }
    }

    const formatSlug = FORMAT_TO_URL_SLUG[targetFormat] || "cursor-rules";
    const presetSlug = SLUG_ALIASES[preset.slug] || preset.slug;
    if (
      targetFormat === "prd_md" ||
      targetFormat === "design_md" ||
      targetFormat === "task_md" ||
      targetFormat === "memory_md"
    ) {
      syncUrl(`/ai-skill-studio/${formatSlug}`);
    } else {
      syncUrl(`/ai-skill-studio/${formatSlug}/${presetSlug}`);
    }
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
    resetAllManualEdits();
  };

  // Apply parsed GitHub repository analysis to studio
  const handleApplyGitHubRepo = (
    analysis: IngestedRepoAnalysis,
    token?: string,
    targetFormat: OutputFormat = "claude_md"
  ) => {
    const fw = analysis.manifest?.framework || (analysis.metadata.language ? `${analysis.metadata.language} Fullstack` : framework);
    const lang = analysis.manifest?.language || analysis.metadata.language || language;
    const sty = analysis.manifest?.styling && analysis.manifest.styling !== "None / Irrelevant" ? analysis.manifest.styling : styling;
    const db = analysis.manifest?.database && analysis.manifest.database !== "None / Irrelevant" ? analysis.manifest.database : database;
    const r = analysis.synthesizedRole || role;
    const sName = generateSafeSlug(analysis.suggestedSkillName || skillName);
    const sTitle = analysis.suggestedTitle || skillTitle;
    const desc = analysis.metadata.description || description;
    const globs = analysis.suggestedGlobs.length > 0 ? analysis.suggestedGlobs.join(", ") : globPattern;
    const procs = analysis.synthesizedProcedures.length > 0 ? analysis.synthesizedProcedures.join("\n") : procedures;
    const dirs = analysis.synthesizedDirectives.length > 0 ? analysis.synthesizedDirectives.join("\n") : customDirectives;

    setFramework(fw);
    setLanguage(lang);
    setStyling(sty);
    setDatabase(db);
    setRole(r);
    setSkillName(sName);
    setIsSlugLocked(true);
    setSkillTitle(sTitle);
    setDescription(desc);
    setGlobPattern(globs);
    setProcedures(procs);
    setCustomDirectives(dirs);

    // If format is mcp_json, configure MCP as well
    if (targetFormat === "mcp_json" || format === "mcp_json") {
      setMcpPresetId("github");
      setMcpServerName("github");
      setMcpCommand("npx");
      setMcpArgs(`-y\n@modelcontextprotocol/server-github\n${analysis.metadata.fullName}`);
      setMcpEnvKey("GITHUB_PERSONAL_ACCESS_TOKEN");
      // Reference the env var rather than embedding the ingestion PAT into a downloadable config file
      setMcpEnvValue("${GITHUB_PERSONAL_ACCESS_TOKEN}");
    }

    // Default to targetFormat, or claude_md if user was viewing mcp_json
    const activeFmt = targetFormat !== "mcp_json" ? targetFormat : (format === "mcp_json" ? "claude_md" : format);
    setFormat(activeFmt);

    // Immediately generate synthesized rules so the editor displays them without delay
    const newContent = buildRuleContent({
      targetFormat: activeFmt,
      framework: fw,
      language: lang,
      styling: sty,
      database: db,
      role: r,
      skillName: sName,
      skillTitle: sTitle,
      description: desc,
      philosophy,
      conventions,
      behaviors,
      procedures: procs,
      customDirectives: dirs,
      exampleGood,
      exampleBad,
      globPattern: globs,
      alwaysApply,
      mcpServerName: "github",
      mcpCommand: "npx",
      mcpArgs: `-y\n@modelcontextprotocol/server-github\n${analysis.metadata.fullName}`,
      mcpEnvKey: "GITHUB_PERSONAL_ACCESS_TOKEN",
      mcpEnvValue: targetFormat === "mcp_json" || format === "mcp_json" ? "${GITHUB_PERSONAL_ACCESS_TOKEN}" : mcpEnvValue,
      prdOverview,
      prdProblemStatement,
      prdPersonas,
      prdFunctionalReqs,
      prdNonFunctionalReqs,
      prdMilestones,
      designTokens,
      designLayout,
      designConventions,
      designGuardrails,
      designDirectives,
      designVerification,
      taskDashboard,
      taskPhases,
      taskVerification,
      taskDirectives,
      taskSessionLog,
      memoryContext,
      memoryAdrs,
      memoryGotchas,
      memoryLoop,
      memoryInvariants,
      memorySessionHistory,
      ignoreCategories,
      customIgnoreRules,
    });

    setEditorContent(newContent);
    resetAllManualEdits();

    const formatSlug = FORMAT_TO_URL_SLUG[activeFmt] || "claude-md";
    syncUrl(`/ai-skill-studio/${formatSlug}`);
  };

  // Apply parsed DDL schema to studio
  const handleApplyDdlSchema = (
    schema: ParsedDatabaseSchema,
    targetFormat: OutputFormat = "claude_md"
  ) => {
    let db = "SQL Database";
    let sty = styling;
    if (schema.dialect === "postgresql") {
      db = "PostgreSQL";
      sty = "Prisma / Drizzle ORM";
    } else if (schema.dialect === "sqlite") {
      db = "SQLite";
    } else if (schema.dialect === "prisma") {
      db = "PostgreSQL (via Prisma ORM)";
    }

    const r = schema.synthesizedRole || role;
    const sTitle = schema.suggestedTitle || skillTitle;
    const dirs = schema.synthesizedDirectives.length > 0 ? schema.synthesizedDirectives.join("\n") : customDirectives;
    const procs = schema.synthesizedProcedures.length > 0 ? schema.synthesizedProcedures.join("\n") : procedures;

    setDatabase(db);
    setStyling(sty);
    setRole(r);
    setSkillTitle(sTitle);
    setCustomDirectives(dirs);
    setProcedures(procs);

    if (targetFormat === "mcp_json" || format === "mcp_json") {
      if (schema.dialect === "postgresql") {
        setMcpPresetId("postgres");
        setMcpServerName("postgres");
        setMcpCommand("npx");
        setMcpArgs("-y\n@modelcontextprotocol/server-postgres\npostgresql://user:password@localhost:5432/dbname");
      } else if (schema.dialect === "sqlite") {
        setMcpPresetId("sqlite");
        setMcpServerName("sqlite");
        setMcpCommand("uvx");
        setMcpArgs("mcp-server-sqlite\n--db-path\n./app.db");
      }
    }

    const activeFmt = targetFormat !== "mcp_json" ? targetFormat : (format === "mcp_json" ? "claude_md" : format);
    setFormat(activeFmt);

    const newContent = buildRuleContent({
      targetFormat: activeFmt,
      framework,
      language,
      styling: sty,
      database: db,
      role: r,
      skillName,
      skillTitle: sTitle,
      description,
      philosophy,
      conventions,
      behaviors,
      procedures: procs,
      customDirectives: dirs,
      exampleGood,
      exampleBad,
      globPattern,
      alwaysApply,
      mcpServerName: schema.dialect === "sqlite" ? "sqlite" : "postgres",
      mcpCommand: schema.dialect === "sqlite" ? "uvx" : "npx",
      mcpArgs: schema.dialect === "sqlite" ? "mcp-server-sqlite\n--db-path\n./app.db" : "-y\n@modelcontextprotocol/server-postgres\npostgresql://user:password@localhost:5432/dbname",
      mcpEnvKey,
      mcpEnvValue,
      prdOverview,
      prdProblemStatement,
      prdPersonas,
      prdFunctionalReqs,
      prdNonFunctionalReqs,
      prdMilestones,
      designTokens,
      designLayout,
      designConventions,
      designGuardrails,
      designDirectives,
      designVerification,
      taskDashboard,
      taskPhases,
      taskVerification,
      taskDirectives,
      taskSessionLog,
      memoryContext,
      memoryAdrs,
      memoryGotchas,
      memoryLoop,
      memoryInvariants,
      memorySessionHistory,
      ignoreCategories,
      customIgnoreRules,
    });

    setEditorContent(newContent);
    resetAllManualEdits();

    const formatSlug = FORMAT_TO_URL_SLUG[activeFmt] || "claude-md";
    syncUrl(`/ai-skill-studio/${formatSlug}`);
  };

  const handleApplyDockerCompose = (compose: ParsedDockerCompose, targetFormat: OutputFormat = "claude_md") => {
    const r = compose.synthesizedRole;
    const dirs = compose.synthesizedDirectives;
    const procs = compose.synthesizedProcedures.join("\n");
    const sTitle = compose.suggestedTitle;
    const sName = compose.suggestedTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    setRole(r);
    setSkillTitle(sTitle);
    setSkillName(sName);
    setCustomDirectives(dirs.join("\n"));
    setProcedures(procs);

    if (format === "mcp_json") {
      setMcpPresetId("docker");
      setMcpServerName("docker");
      setMcpCommand("docker");
      setMcpArgs("compose\nup\n-d");
    }

    const activeFmt = targetFormat !== "mcp_json" ? targetFormat : (format === "mcp_json" ? "claude_md" : format);
    setFormat(activeFmt);

    const newContent = buildRuleContent({
      targetFormat: activeFmt,
      framework: "Docker Compose",
      language: "YAML / Container",
      styling,
      database,
      role: r,
      skillName: sName,
      skillTitle: sTitle,
      description: `Container-aware pair programming and DevOps orchestration rules for ${sTitle}`,
      philosophy,
      conventions,
      behaviors,
      procedures: procs,
      customDirectives: dirs.join("\n"),
      exampleGood,
      exampleBad,
      globPattern,
      alwaysApply,
      mcpServerName: "docker",
      mcpCommand: "docker",
      mcpArgs: "compose\nup\n-d",
      mcpEnvKey,
      mcpEnvValue,
      prdOverview,
      prdProblemStatement,
      prdPersonas,
      prdFunctionalReqs,
      prdNonFunctionalReqs,
      prdMilestones,
      designTokens,
      designLayout,
      designConventions,
      designGuardrails,
      designDirectives,
      designVerification,
      taskDashboard,
      taskPhases,
      taskVerification,
      taskDirectives,
      taskSessionLog,
      memoryContext,
      memoryAdrs,
      memoryGotchas,
      memoryLoop,
      memoryInvariants,
      memorySessionHistory,
      ignoreCategories,
      customIgnoreRules,
    });

    setEditorContent(newContent);
    resetAllManualEdits();

    const formatSlug = FORMAT_TO_URL_SLUG[activeFmt] || "claude-md";
    syncUrl(`/ai-skill-studio/${formatSlug}`);
  };

  const handleApplyLocalFolder = (analysis: LocalProjectAnalysis, targetFormat: OutputFormat = "claude_md") => {
    const r = analysis.synthesizedRole;
    const dirs = analysis.synthesizedDirectives;
    const sName = analysis.directoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const sTitle = `${analysis.directoryName} Production Architecture`;

    setRole(r);
    setSkillName(sName);
    setSkillTitle(sTitle);
    setFramework(analysis.framework);
    setLanguage(analysis.language);
    setStyling(analysis.styling);
    setDatabase(analysis.database);
    setCustomDirectives(dirs.join("\n"));

    const procs = [
      analysis.scripts.dev ? `1. Run local development server: \`${analysis.packageManager !== "unknown" ? analysis.packageManager : "npm"} run dev\` (or \`${analysis.scripts.dev}\`)` : "",
      analysis.scripts.test ? `2. Run unit & integration tests: \`${analysis.packageManager !== "unknown" ? analysis.packageManager : "npm"} test\` (or \`${analysis.scripts.test}\`)` : "",
      analysis.scripts.build ? `3. Validate production build: \`${analysis.packageManager !== "unknown" ? analysis.packageManager : "npm"} run build\` (or \`${analysis.scripts.build}\`)` : "",
      analysis.scripts.lint ? `4. Run linter: \`${analysis.packageManager !== "unknown" ? analysis.packageManager : "npm"} run lint\` (or \`${analysis.scripts.lint}\`)` : "",
    ].filter(Boolean).join("\n");
    if (procs) setProcedures(procs);

    if (format === "mcp_json") {
      setMcpPresetId("filesystem");
      setMcpServerName("filesystem");
      setMcpCommand("npx");
      setMcpArgs(`-y\n@modelcontextprotocol/server-filesystem\n${analysis.suggestedMcpArg}`);
    }

    const activeFmt = targetFormat !== "mcp_json" ? targetFormat : (format === "mcp_json" ? "claude_md" : format);
    setFormat(activeFmt);

    const newContent = buildRuleContent({
      targetFormat: activeFmt,
      framework: analysis.framework,
      language: analysis.language,
      styling: analysis.styling,
      database: analysis.database,
      role: r,
      skillName: sName,
      skillTitle: sTitle,
      description: `Production architectural guidelines and pair programming constraints for ${analysis.directoryName}`,
      philosophy,
      conventions,
      behaviors,
      procedures: procs || procedures,
      customDirectives: dirs.join("\n"),
      exampleGood,
      exampleBad,
      globPattern,
      alwaysApply,
      mcpServerName: "filesystem",
      mcpCommand: "npx",
      mcpArgs: `-y\n@modelcontextprotocol/server-filesystem\n${analysis.suggestedMcpArg}`,
      mcpEnvKey,
      mcpEnvValue,
      prdOverview,
      prdProblemStatement,
      prdPersonas,
      prdFunctionalReqs,
      prdNonFunctionalReqs,
      prdMilestones,
      designTokens,
      designLayout,
      designConventions,
      designGuardrails,
      designDirectives,
      designVerification,
      taskDashboard,
      taskPhases,
      taskVerification,
      taskDirectives,
      taskSessionLog,
      memoryContext,
      memoryAdrs,
      memoryGotchas,
      memoryLoop,
      memoryInvariants,
      memorySessionHistory,
      ignoreCategories,
      customIgnoreRules,
    });

    setEditorContent(newContent);
    resetAllManualEdits();

    const formatSlug = FORMAT_TO_URL_SLUG[activeFmt] || "claude-md";
    syncUrl(`/ai-skill-studio/${formatSlug}`);
  };

  // Local filesystem directory picker for MCP Filesystem server
  const handlePickDirectory = async () => {
    try {
      const result = await pickAndInspectLocalDirectory();
      if (result.supported && result.suggestedArg) {
        setMcpArgs(`-y\n@modelcontextprotocol/server-filesystem\n${result.suggestedArg}`);
        if (result.analysis) {
          handleApplyLocalFolder(result.analysis, format);
        }
      }
    } catch {
      // User cancelled picker
    }
  };

  // Apply reverse converted legacy rules to studio
  const handleApplyConvertedRules = (ir: ConvertedRulesIR) => {
    if (ir.skillName) {
      setSkillName(generateSafeSlug(ir.skillName));
      setIsSlugLocked(true);
    }
    if (ir.skillTitle) setSkillTitle(ir.skillTitle);
    if (ir.description) setDescription(ir.description);
    if (ir.role) setRole(ir.role);
    if (ir.framework) setFramework(ir.framework);
    if (ir.language) setLanguage(ir.language);
    if (ir.styling) setStyling(ir.styling);
    if (ir.database) setDatabase(ir.database);
    if (ir.philosophy) setPhilosophy(ir.philosophy);
    if (ir.behaviors && ir.behaviors.length > 0) {
      setBehaviors(ir.behaviors);
    }
    if (ir.conventions && ir.conventions.length > 0) {
      setConventions(ir.conventions);
    }
    if (ir.procedures) setProcedures(ir.procedures);
    if (ir.customDirectives) setCustomDirectives(ir.customDirectives);
    if (ir.exampleGood) setExampleGood(ir.exampleGood);
    if (ir.exampleBad) setExampleBad(ir.exampleBad);
    if (ir.globPattern) setGlobPattern(ir.globPattern);
    if (ir.alwaysApply !== undefined) setAlwaysApply(ir.alwaysApply);
    if (ir.triggers && ir.triggers.length > 0) {
      setTriggerTags(ir.triggers);
    }
    resetAllManualEdits();
  };

  // Context-Aware Synthesis Engine (Option 3: Reads all 12 form fields)
  const synthesizeFromContext = () => {
    const synthesized = synthesizeContextFields({
      format,
      globPattern,
      role,
      framework,
      language,
      styling,
      database,
      philosophy,
      behaviors,
      conventions,
    });
    setDescription(synthesized.description);
    setProcedures(synthesized.procedures);
    setCustomDirectives(synthesized.customDirectives);

    // Reset manual edit flag so newly synthesized template appears in editor
    setIsManuallyEdited(false);
  };

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
        prdOverview,
        prdProblemStatement,
        prdPersonas,
        prdFunctionalReqs,
        prdNonFunctionalReqs,
        prdMilestones,
        designTokens,
        designLayout,
        designConventions,
        designGuardrails,
        designDirectives,
        designVerification,
        taskDashboard,
        taskPhases,
        taskVerification,
        taskDirectives,
        taskSessionLog,
        memoryContext,
        memoryAdrs,
        memoryGotchas,
        memoryLoop,
        memoryInvariants,
        memorySessionHistory,
        ignoreCategories,
        customIgnoreRules,
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
      prdOverview,
      prdProblemStatement,
      prdPersonas,
      prdFunctionalReqs,
      prdNonFunctionalReqs,
      prdMilestones,
      designTokens,
      designLayout,
      designConventions,
      designGuardrails,
      designDirectives,
      designVerification,
      taskDashboard,
      taskPhases,
      taskVerification,
      taskDirectives,
      taskSessionLog,
      memoryContext,
      memoryAdrs,
      memoryGotchas,
      memoryLoop,
      memoryInvariants,
      memorySessionHistory,
      ignoreCategories,
      customIgnoreRules,
    ]
  );

  // Active template generation based on format tab
  const generatedContent = useMemo(() => buildContent(format), [buildContent, format]);

  // Synchronize generated content to editorContent when not manually overridden
  useEffect(() => {
    // Read the ref, not the render-time flag: the mount-time draft restore marks content as manual in the
    // same effect flush, and the stale closure value would overwrite the restored edit
    if (!isManuallyEditedRef.current) {
      setEditorContent(generatedContent);
    }
  }, [generatedContent, isManuallyEdited]);

  // Active content being viewed/copied/downloaded
  const activeContent = isManuallyEdited ? editorContent : generatedContent;


  // White Marker — compute marked section range synchronously whenever activeFieldKey or content changes
  // Single-value text fields narrow the marker to their own lines; shared keys (techStack) and governance cards keep the full section
  const activeFieldValue = useMemo<string | undefined>(() => {
    switch (activeFieldKey) {
      case "skillName": return skillName;
      case "skillTitle": return skillTitle;
      case "description": return description;
      case "role": return role;
      // Every format renders the philosophy by its title, so the marker lands on that line
      case "philosophy": return PHILOSOPHIES.find((p) => p.id === philosophy)?.title;
      case "procedures": return procedures;
      case "customDirectives": return customDirectives;
      default: return undefined;
    }
  }, [activeFieldKey, skillName, skillTitle, description, role, philosophy, procedures, customDirectives]);
  const markedRange = useMemo(
    () => (!activeFieldKey ? null : findSectionLineRange(activeContent, activeFieldKey, format, activeFieldValue)),
    [activeContent, activeFieldKey, format, activeFieldValue]
  );
  const markedRangeRef = React.useRef<MarkedSectionRange | null>(null);
  useEffect(() => {
    markedRangeRef.current = markedRange;
  }, [markedRange]);

  // White Marker — apply Monaco decorations (updates on every markedRange change)
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      if (decorationsCollectionRef.current) {
        try {
          decorationsCollectionRef.current.clear();
        } catch {
          /* noop */
        }
        decorationsCollectionRef.current = null;
      }
      markerDecorationsRef.current = [];
      return;
    }

    if (!decorationsCollectionRef.current && typeof editor.createDecorationsCollection === "function") {
      decorationsCollectionRef.current = editor.createDecorationsCollection();
    }

    if (!markedRange) {
      if (decorationsCollectionRef.current) {
        try {
          decorationsCollectionRef.current.clear();
        } catch {
          /* noop */
        }
      } else if (typeof editor.deltaDecorations === "function") {
        try {
          markerDecorationsRef.current = editor.deltaDecorations(
            markerDecorationsRef.current,
            []
          );
        } catch {
          /* noop */
        }
      }
      return;
    }

    // Apply clean, continuous white marker in Monaco (single solid vertical marker line)
    const newDecorations = [
      {
        range: {
          startLineNumber: Math.min(markedRange.startLine, markedRange.endLine),
          startColumn: 1,
          endLineNumber: Math.max(markedRange.startLine, markedRange.endLine),
          endColumn: 1,
        },
        options: {
          isWholeLine: true,
          // Soft tint behind the text; the solid bar lives in the gutter so it never overlaps characters
          className: "monaco-white-marker-line",
          linesDecorationsClassName: "monaco-white-marker-gutter",
          overviewRuler: {
            color: "#ffffff",
            position: 1, // Center lane in scrollbar
          },
        },
      },
    ];

    if (decorationsCollectionRef.current) {
      try {
        decorationsCollectionRef.current.set(newDecorations);
      } catch {
        if (typeof editor.createDecorationsCollection === "function") {
          decorationsCollectionRef.current = editor.createDecorationsCollection();
          try {
            decorationsCollectionRef.current.set(newDecorations);
          } catch {
            /* noop */
          }
        }
      }
    } else if (typeof editor.deltaDecorations === "function") {
      try {
        markerDecorationsRef.current = editor.deltaDecorations(
          markerDecorationsRef.current,
          newDecorations
        );
      } catch {
        /* noop */
      }
    }
  }, [markedRange, editorReady]);

  // White Marker — auto-follow: keep the marked section in view when a field is focused, and keep the
  // line being changed in view while the user types in the form. Scrolls only the editor/preview, never the window,
  // and never while the user is typing inside Monaco itself (Monaco keeps its own cursor visible).
  const followSnapshotRef = React.useRef<{ content: string; fieldKey: string | null; requestId: number }>({
    content: "",
    fieldKey: null,
    requestId: 0,
  });
  const pendingFollowRef = React.useRef<{ range: MarkedSectionRange; focusLine: number | null } | null>(null);
  const followFrameRef = React.useRef<number | null>(null);
  useEffect(() => {
    const previous = followSnapshotRef.current;
    followSnapshotRef.current = { content: activeContent, fieldKey: activeFieldKey, requestId: scrollRequestId };
    if (!markedRange) return;

    const isNewTarget = scrollRequestId !== previous.requestId || activeFieldKey !== previous.fieldKey;
    let focusLine: number | null = null;
    if (!isNewTarget) {
      const changedLine = findFirstChangedLine(previous.content, activeContent);
      if (changedLine === null) return;
      // Follow the edit inside the highlight; edits elsewhere fall back to keeping the highlight in view
      if (changedLine >= markedRange.startLine && changedLine <= markedRange.endLine) focusLine = changedLine;
    }
    // Latest target wins; a single queued frame runs it, so rapid keystrokes never drop or stack scrolls
    pendingFollowRef.current = { range: markedRange, focusLine };
    if (followFrameRef.current !== null) return;

    // Wait one frame so Monaco has applied the new value and laid out wrapped lines before measuring
    followFrameRef.current = requestAnimationFrame(() => {
      followFrameRef.current = null;
      const job = pendingFollowRef.current;
      pendingFollowRef.current = null;
      if (!job) return;
      const { range, focusLine } = job;
      const editor = editorRef.current;
      if (editor) {
        try {
          if (editor.hasTextFocus?.()) return;
          const layoutHeight = editor.getLayoutInfo().height;
          if (layoutHeight <= 0) return; // hidden (mobile form tab)
          const lineCount = editor.getModel()?.getLineCount() ?? range.endLine;
          const spanOf = (from: number, to: number) => {
            const last = Math.min(to, lineCount);
            const top = editor.getTopForLineNumber(Math.min(from, lineCount));
            const bottom =
              typeof editor.getBottomForLineNumber === "function"
                ? editor.getBottomForLineNumber(last)
                : editor.getTopForLineNumber(last) + 20;
            return { top, bottom };
          };
          const target = computeFollowScrollTop(
            { scrollTop: editor.getScrollTop(), height: layoutHeight },
            spanOf(range.startLine, range.endLine),
            focusLine === null ? null : spanOf(focusLine, focusLine)
          );
          if (target !== null) editor.setScrollTop(target, 0); // 0 = ScrollType.Smooth
        } catch {
          /* noop */
        }
        return;
      }

      // Static preview (before Monaco loads): one <div> per line inside the <pre>
      const container = previewContainerRef.current;
      if (!container || container.clientHeight <= 0) return;
      const rows = container.children;
      const spanOfRows = (from: number, to: number) => {
        const first = rows[from - 1] as HTMLElement | undefined;
        const last = rows[Math.min(to, rows.length) - 1] as HTMLElement | undefined;
        if (!first || !last) return null;
        return { top: first.offsetTop, bottom: last.offsetTop + last.offsetHeight };
      };
      const rangeSpan = spanOfRows(range.startLine, range.endLine);
      if (!rangeSpan) return;
      const target = computeFollowScrollTop(
        { scrollTop: container.scrollTop, height: container.clientHeight },
        rangeSpan,
        focusLine === null ? null : spanOfRows(focusLine, focusLine)
      );
      if (target !== null) container.scrollTo({ top: target, behavior: "smooth" });
    });
  }, [markedRange, activeContent, activeFieldKey, scrollRequestId]);
  useEffect(
    () => () => {
      if (followFrameRef.current !== null) cancelAnimationFrame(followFrameRef.current);
    },
    []
  );

  // Real-time Rule Quality & Security Audit Engine (5 Core Dimensions)
  const auditReport = useMemo(() => {
    return auditRuleQuality({
      content: activeContent,
      format,
      description,
      globPattern,
      alwaysApply,
      triggerTags,
      exampleGood,
      exampleBad,
    });
  }, [
    activeContent,
    format,
    description,
    globPattern,
    alwaysApply,
    triggerTags,
    exampleGood,
    exampleBad,
  ]);

  // Copy audit report summary for PRs / documentation
  const handleCopyAuditReport = () => {
    navigator.clipboard.writeText(buildAuditReportMarkdown(auditReport));
    setAuditCopied(true);
    setTimeout(() => setAuditCopied(false), 2000);
  };

  // Trigger Download Audit HUD — builds payload from current state and shows notification
  const triggerDownloadHud = useCallback((
    fileName: string,
    placement: { repoPath: string } | { files: string[] },
  ) => {
    downloadHudIdRef.current += 1;
    const payload: DownloadHudPayload = {
      id: downloadHudIdRef.current,
      fileName,
      format,
      tokenCount: auditReport.tokenCount,
      auditScore: auditReport.overallScore,
      auditGradeLabel: auditReport.gradeLabel,
      auditIssuesCount: auditReport.allIssues.length,
      isZipExport: "files" in placement,
      ...placement,
    };
    setDownloadHudPayload(payload);
  }, [format, auditReport]);

  // One-click quick fix: Inject negative boundary guardrails
  const handleInjectNegativeGuardrails = () => {
    if (format === "mcp_json") return;
    setEditorContent((prev) => (prev || activeContent) + NEGATIVE_GUARDRAILS_SNIPPET);
    setIsManuallyEdited(true);
  };

  // One-click quick fix: Inject code block example
  const handleInjectCodeBlock = () => {
    if (format === "mcp_json") return;
    setEditorContent((prev) => (prev || activeContent) + CODE_REFERENCE_SNIPPET);
    setIsManuallyEdited(true);
  };

  // One-click quick fix: Replace detected vague directives with concrete requirements
  const handleFixVaguePhrases = () => {
    setEditorContent(replaceVaguePhrases(activeContent));
    setIsManuallyEdited(true);
  };

  // One-click quick fix: Scope Cursor globs
  const handleScopeGlobs = () => {
    setGlobPattern("src/**/*.{ts,tsx,js,jsx}");
    setAlwaysApply(false);
  };

  // Form fields the format fixes rebuild Cursor frontmatter and MCP JSON from
  const quickFixContext: FormatFixContext = {
    format,
    description,
    skillTitle,
    globPattern,
    alwaysApply,
    mcpServerName,
    mcpCommand,
    mcpArgs,
    mcpEnvKey,
    mcpEnvValue,
  };

  // One-click quick fix: Fix Format Compliance
  const handleFixFormatCompliance = () => {
    const fixed = fixFormatCompliance(activeContent, quickFixContext);
    if (fixed !== null) {
      setEditorContent(fixed);
      setIsManuallyEdited(true);
    }
  };

  // One-click quick fix: Replace broad trigger chips
  const handleFixBroadTriggers = () => {
    setTriggerTags(refineBroadTriggerTags(triggerTags));
    if (!description || description.length < 10) {
      setDescription(`Activates automatically when working on ${framework || "system"} domain services, API endpoints, or database queries.`);
    }
  };

  // Comprehensive Auto-Fix: Resolves all detected deficiencies in one click
  const handleAutoFixAll = () => {
    const updated = autoFixAllContent(activeContent, {
      ...quickFixContext,
      guardrailsScore: auditReport.dimensions.guardrails.score,
    });
    setEditorContent(updated);
    setIsManuallyEdited(true);

    if (format === "cursor_mdc" && (alwaysApply || globPattern === "**/*")) {
      setGlobPattern("src/**/*.{ts,tsx,js,jsx}");
      setAlwaysApply(false);
    }

    handleFixBroadTriggers();
  };

  // Export Complete AI Workspace Suite as ZIP
  const handleExportZip = async () => {
    // Active format uses what the editor shows; other formats use their stashed manual edits or fresh output
    const contents: Partial<Record<OutputFormat, string>> = {};
    for (const f of EXPORT_FORMATS) {
      contents[f] = f === format ? activeContent : (stashedEdits[f] ?? buildContent(f));
    }
    setIsExportingZip(true);
    try {
      const { fileName, files } = await downloadAiKitZip({
        skillName,
        skillTitle,
        contents,
        framework,
        language,
      });

      // Trigger the bottom verification HUD on successful export
      triggerDownloadHud(fileName, { files });
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
  const [cliActiveTab, setCliActiveTab] = useState<CliTab>("bash");
  const [cliHost, setCliHost] = useState("https://www.devscratchpad.tech");
  const cliDropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isLocal =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        window.location.hostname.endsWith(".local");
      if (isLocal) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const activeFormatSlug = useMemo(() => getCliFormatSlug(format), [format]);

  const activePresetSlug = useMemo(
    () =>
      resolveActivePresetSlug({
        format,
        formatSlug: activeFormatSlug,
        mcpPresetId,
        mcpServerName,
        selectedPresetId,
        initialPresetId,
        initialPresetSlug,
        skillName,
      }),
    [format, mcpPresetId, mcpServerName, initialPresetSlug, selectedPresetId, initialPresetId, activeFormatSlug, skillName]
  );

  const targetInstallFile = useMemo(
    () =>
      resolveTargetInstallFile({
        format,
        formatSlug: activeFormatSlug,
        presetSlug: activePresetSlug,
        selectedPresetId,
        isManuallyEdited,
        skillName,
      }),
    [activePresetSlug, selectedPresetId, activeFormatSlug, isManuallyEdited, format, skillName]
  );

  const cliCommands = useMemo(() => {
    return getInstallCommands(activeFormatSlug, activePresetSlug, targetInstallFile, cliHost);
  }, [activeFormatSlug, activePresetSlug, targetInstallFile, cliHost]);

  const heredocCommand = useMemo(() => {
    return getHeredocCommand(targetInstallFile, activeContent);
  }, [targetInstallFile, activeContent]);

  const powershellHeredoc = useMemo(
    () => getPowershellHeredocCommand(targetInstallFile, activeContent),
    [targetInstallFile, activeContent]
  );

  // Determine if content is customized from default preset
  const isCustomEdited = useMemo(
    () =>
      isCustomizedFromPreset({
        format,
        isManuallyEdited,
        ignoreCategories,
        ignorePreset,
        customIgnoreRules,
        mcpPresetId,
        mcpServerName,
        mcpCommand,
        mcpArgs,
        mcpEnvKey,
        mcpEnvValue,
        selectedPresetId,
        fallbackPreset: defaultPreset,
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
      }),
    [
      isManuallyEdited,
      ignoreCategories,
      customIgnoreRules,
      ignorePreset,
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
    ]
  );

  const primaryCliCommand = isCustomEdited ? heredocCommand : cliCommands.bash;

  const currentTabCliCommand = useMemo(
    () => selectCliCommand(cliActiveTab, isCustomEdited, { commands: cliCommands, heredocCommand, powershellHeredoc }),
    [isCustomEdited, cliActiveTab, powershellHeredoc, heredocCommand, cliCommands]
  );

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
      const stateToShare = buildShareState({
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
        ignoreCategories,
        ignorePreset,
        customIgnoreRules,
        isManuallyEdited,
        editorContent,
      });

      const url = await createShareableUrl(stateToShare);
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch (err) {
      console.error("Failed to generate share link", err);
    }
  };

  // Download handler
  const handleDownload = () => {
    const { downloadName, repoPath, mimeType } = getExportTarget(format, skillName);
    const blob = new Blob([activeContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", downloadName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Trigger the bottom verification HUD
    triggerDownloadHud(downloadName, { repoPath });
  };

  // Get file name indicator
  const currentFileName = useMemo(() => getEditorFileName(format, skillName), [format, skillName]);

  // Line count shown in the editor tab, the status bar, and the mobile controls
  const lineCount = activeContent.split("\n").length;

  return (
    <div suppressHydrationWarning className="min-h-screen bg-zinc-50 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-zinc-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-2">
          {/* Left: AI Skill Studio Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <Image src="/ai-skill-icon.png" width={24} height={20} priority alt="AI Skill Studio" className="w-5 h-4 sm:w-6 sm:h-5 object-contain shrink-0" />
              <span className="text-sm sm:text-base font-bold text-zinc-900 tracking-tight truncate">
                AI Skill Studio
              </span>
            </div>
          </div>

          {/* Right: Status Indicators & SKILL navigation */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Link
              href="/skill"
              className="p-1 hover:bg-zinc-100 active:bg-zinc-200 rounded-md transition-colors flex items-center justify-center shrink-0"
              title="AI Skill Hub & Library"
              aria-label="AI Skill Hub & Library"
            >
              <img
                src="/skill-folder-icon.png"
                className="w-7 h-5.5 sm:w-8 sm:h-6 object-contain hover:scale-105 transition-transform"
                alt="Skills"
              />
            </Link>
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold bg-zinc-900 text-white rounded-full border border-zinc-800 shadow-xs">
              <span>Cursor .mdc + Claude Ready</span>
            </span>
            <span className="hidden xs:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-[#fff7ed] text-[#9a3412] border border-[#fed7aa] rounded-full shadow-xs whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-[#ea580c] shrink-0 shadow-[0_0_6px_rgba(234,88,12,0.8)]" />
              <span>Client-Side</span>
            </span>
          </div>
        </div>

        {/* Quick Presets Sub-Bar */}
        <div className="border-t border-zinc-100 bg-zinc-50/90 px-3 sm:px-6 py-1.5 overflow-x-auto scrollbar-none">
          <div className="max-w-7xl mx-auto flex items-center gap-2 min-w-max">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Sliders className="w-3 h-3 text-zinc-800" /> Presets:
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
                    {isCursorPreset && <Image src="/cursor-icon.png" width={12} height={12}  className="w-3 h-3 object-contain shrink-0" alt="Cursor" />}
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

      {heading && (
        <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 pt-5 sm:pt-7">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900">{heading.title}</h1>
          {heading.description && (
            <p className="mt-1.5 max-w-3xl text-sm text-zinc-600 leading-relaxed">{heading.description}</p>
          )}
        </div>
      )}

      {/* Mobile View Mode Switcher (visible only on < lg) */}
      <MobileViewSwitcher mobileTab={mobileTab} setMobileTab={setMobileTab} lineCount={lineCount} />
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
        <div
          onFocusCapture={(e) => {
            const sec = (e.target as HTMLElement).closest<HTMLElement>("[data-section]");
            if (sec) {
              const sectionKey = sec.getAttribute("data-section");
              if (sectionKey) {
                requestSectionScroll(sectionKey);
              }
            }
          }}
          className={cn(
            "lg:col-span-6 space-y-4 sm:space-y-6",
            mobileTab === "editor" ? "hidden lg:block" : "block"
          )}
        >
          {/* Format Selector Card */}
          <FormatSelector
            format={format}
            handleSelectFormat={handleSelectFormat}
          />

          {/* Governance formats (PRD.md, DESIGN.md, TASK.md, MEMORY.md): dedicated section cards — see GovernanceSections.tsx */}
          {isGovernanceFormat && (
            <GovernanceSections
              format={format as GovernanceFormat}
              values={governanceValues}
              preset={PRESETS.find((p) => p.id === selectedPresetId) || defaultPreset}
              onChange={handleGovernanceChange}
              onFocusField={(key) => setActiveFieldKey(key)}
            />
          )}

          {/* Cursor Rule Scope Card (Visible only when format is cursor_mdc) */}
          {format === "cursor_mdc" && (
            <CursorRuleScopeCard
              globPattern={globPattern}
              setGlobPattern={setGlobPattern}
              alwaysApply={alwaysApply}
              setAlwaysApply={setAlwaysApply}
            />
          )}

          {/* MCP Server Configuration Card (Visible only when format is mcp_json) */}
          {format === "mcp_json" && (
            <McpServerConfigCard
              mcpPresetId={mcpPresetId}
              mcpServerName={mcpServerName}
              mcpCommand={mcpCommand}
              mcpArgs={mcpArgs}
              mcpEnvKey={mcpEnvKey}
              mcpEnvValue={mcpEnvValue}
              setMcpServerName={setMcpServerName}
              setMcpCommand={setMcpCommand}
              setMcpArgs={setMcpArgs}
              setMcpEnvKey={setMcpEnvKey}
              setMcpEnvValue={setMcpEnvValue}
              handleSelectMcpPreset={handleSelectMcpPreset}
              setIsGitHubModalOpen={setIsGitHubModalOpen}
              setIsDdlModalOpen={setIsDdlModalOpen}
              setIsDockerModalOpen={setIsDockerModalOpen}
              setIsFolderModalOpen={setIsFolderModalOpen}
              requestSectionScroll={requestSectionScroll}
              setActiveFieldKey={setActiveFieldKey}
              setIsManuallyEdited={setIsManuallyEdited}
            />
          )}

          {isIgnoreFormat && (
            <IgnoreShieldSuite
              format={format}
              ignoreCategories={ignoreCategories}
              ignorePreset={ignorePreset}
              customIgnoreRules={customIgnoreRules}
              setCustomIgnoreRules={setCustomIgnoreRules}
              handleToggleCategory={handleToggleCategory}
              handleSelectIgnoreProfile={handleSelectIgnoreProfile}
              requestSectionScroll={requestSectionScroll}
              setActiveFieldKey={setActiveFieldKey}
              setIsManuallyEdited={setIsManuallyEdited}
            />
          )}

          {!isGovernanceFormat && !isMcpFormat && !isIgnoreFormat && (
            <>
              {/* Identity & Trigger Configuration */}
              <IdentityActivationCard
                skillName={skillName}
                skillTitle={skillTitle}
                description={description}
                role={role}
                isSlugLocked={isSlugLocked}
                triggerTags={triggerTags}
                triggerValidation={triggerValidation}
                newTagInput={newTagInput}
                setNewTagInput={setNewTagInput}
                setDescription={setDescription}
                setRole={setRole}
                handleSlugChange={handleSlugChange}
                handleTitleChange={handleTitleChange}
                toggleSlugLock={toggleSlugLock}
                handleAddTag={handleAddTag}
                handleRemoveTag={handleRemoveTag}
                handleFixBroadTriggers={handleFixBroadTriggers}
                synthesizeFromContext={synthesizeFromContext}
                setActiveFieldKey={setActiveFieldKey}
                setIsManuallyEdited={setIsManuallyEdited}
              />

              {/* Tech Stack Customization */}
              <TechStackCard
                framework={framework}
                language={language}
                styling={styling}
                database={database}
                setFramework={setFramework}
                setLanguage={setLanguage}
                setStyling={setStyling}
                setDatabase={setDatabase}
                setIsConverterModalOpen={setIsConverterModalOpen}
                setIsManifestModalOpen={setIsManifestModalOpen}
                setActiveFieldKey={setActiveFieldKey}
                setIsManuallyEdited={setIsManuallyEdited}
              />

              {/* Philosophy & Non-Rigid Style Preferences */}
              <PhilosophyCard
                philosophy={philosophy}
                setPhilosophy={setPhilosophy}
                setActiveFieldKey={setActiveFieldKey}
                setIsManuallyEdited={setIsManuallyEdited}
              />

              {/* Architectural & Code Quality Conventions */}
              <ConventionsCard
                conventions={conventions}
                setConventions={setConventions}
                setActiveFieldKey={setActiveFieldKey}
                setIsManuallyEdited={setIsManuallyEdited}
              />

              {/* Nuanced Agent Behavioral Guardrails */}
              <BehaviorGuardrailsCard
                behaviors={behaviors}
                setBehaviors={setBehaviors}
                setActiveFieldKey={setActiveFieldKey}
                setIsManuallyEdited={setIsManuallyEdited}
              />

              {/* Procedures & Custom Rules Textareas */}
              <ProceduresCard
                procedures={procedures}
                setProcedures={setProcedures}
                customDirectives={customDirectives}
                setCustomDirectives={setCustomDirectives}
                setActiveFieldKey={setActiveFieldKey}
                setIsManuallyEdited={setIsManuallyEdited}
              />
            </>
          )}
        </div>

        {/* Right Column: Sticky Real-time Editor & Unified Action Group */}
        <div
          className={cn(
            "lg:col-span-6 flex flex-col space-y-2.5 w-full",
            mobileTab === "form" ? "hidden lg:flex" : "flex",
            "lg:sticky lg:top-28 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:overscroll-contain lg:[scrollbar-width:none]"
          )}
        >
          {/* Main Card containing Header + Monaco Editor */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-md flex flex-col overflow-hidden">
            {/* File Tab Header with Unified Action Group */}
            <div className="px-2.5 sm:px-3 py-1.5 sm:py-2 flex items-center justify-between border-b border-zinc-800 bg-zinc-900/95 shrink-0 gap-1.5 sm:gap-2 overflow-hidden">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 overflow-hidden">
                <div
                  suppressHydrationWarning
                  className={cn(
                    "w-2.5 h-2.5 rounded-full shrink-0",
                    format === "cursor_mdc"
                      ? "bg-white"
                      : format === "mcp_json"
                      ? "bg-blue-400"
                      : format === "gemini_prompts"
                      ? "bg-indigo-400"
                      : format === "windsurf_cascade"
                      ? "bg-teal-400"
                      : format === "copilot_instructions"
                      ? "bg-sky-400"
                      : format === "openai_instructions"
                      ? "bg-purple-400"
                      : format === "agents_md"
                      ? "bg-emerald-500"
                      : "bg-orange-500/90"
                  )}
                />
                <span
                  suppressHydrationWarning
                  className="font-mono text-xs text-zinc-200 font-semibold truncate min-w-0 max-w-[6.5rem] sm:max-w-[9.5rem] md:max-w-[12rem] 2xl:max-w-[16rem]"
                  title={currentFileName}
                >
                  {currentFileName}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono shrink-0 hidden 2xl:inline-block">
                  {lineCount} lines
                </span>
                {!shouldLoadEditor && (
                  <button
                    type="button"
                    onClick={() => setShouldLoadEditor(true)}
                    onMouseEnter={() => setShouldLoadEditor(true)}
                    className="inline-flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-200 bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/60 px-1.5 sm:px-2 py-0.5 rounded-md transition-colors font-mono shrink-0 cursor-pointer"
                    title="Load interactive code editor"
                  >
                    <FileText className="w-2.5 h-2.5" />
                    <span>Edit</span>
                  </button>
                )}

                {lastAutoSaved && (
                  <span className="hidden 2xl:inline-flex items-center gap-1 text-[10px] text-zinc-400 font-mono shrink-0">
                    <CheckCircle2 className="w-2.5 h-2.5 text-zinc-400" /> Auto-saved
                  </span>
                )}
                {isManuallyEdited && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditorContent(generatedContent);
                      setIsManuallyEdited(false);
                    }}
                    className="inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-950/80 border border-amber-800/90 px-1.5 sm:px-2 py-0.5 rounded-md hover:bg-amber-900 transition-colors font-mono shrink-0 active:scale-95 cursor-pointer shadow-xs"
                    title="Reset custom in-editor edits back to template-generated output"
                  >
                    <RefreshCw className="w-2.5 h-2.5 shrink-0" />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              {/* Action Button Group: Copy + Download + Export Kit */}
              <div className="flex items-center bg-zinc-800/90 rounded-lg p-0.5 border border-zinc-700/60 shadow-xs shrink-0 ml-auto">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-1.5 sm:px-2 2xl:px-2.5 py-1 text-xs text-zinc-300 hover:text-white hover:bg-zinc-700/60 rounded-md transition-colors font-medium cursor-pointer"
                  title="Copy code to clipboard"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-orange-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="hidden 2xl:inline">{copied ? "Copied!" : "Copy"}</span>
                </button>

                <div className="w-px h-3.5 bg-zinc-700/80 mx-0.5" />

                <button
                  onClick={handleShareLink}
                  className="flex items-center gap-1 px-1.5 sm:px-2 2xl:px-2.5 py-1 text-xs text-zinc-300 hover:text-white hover:bg-zinc-700/60 rounded-md transition-colors font-medium cursor-pointer"
                  title="Copy shareable link to this exact configuration"
                >
                  {shareCopied ? <Check className="w-3.5 h-3.5 text-blue-400" /> : <ExternalLink className="w-3.5 h-3.5" />}
                  <span className="hidden 2xl:inline">{shareCopied ? "Copied!" : "Share"}</span>
                </button>

                <div className="w-px h-3.5 bg-zinc-700/80 mx-0.5" />

                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1 px-1.5 sm:px-2 2xl:px-2.5 py-1 text-xs text-zinc-300 hover:text-white hover:bg-zinc-700/60 rounded-md transition-colors font-medium cursor-pointer"
                  title={`Download ${currentFileName}`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden 2xl:inline">Download</span>
                </button>

                <div className="w-px h-3.5 bg-zinc-700/80 mx-0.5" />

                {/* CLI / Terminal One-Liner Install Button & Popover */}
                <CliInstallPopover
                  format={format}
                  isCustomEdited={isCustomEdited}
                  showCliDropdown={showCliDropdown}
                  setShowCliDropdown={setShowCliDropdown}
                  cliDropdownRef={cliDropdownRef}
                  cliActiveTab={cliActiveTab}
                  setCliActiveTab={setCliActiveTab}
                  cliCopied={cliCopied}
                  setCliCopied={setCliCopied}
                  cliCommands={cliCommands}
                  currentTabCliCommand={currentTabCliCommand}
                  targetInstallFile={targetInstallFile}
                  handleCliAction={handleCliAction}
                />

                <div className="w-px h-3.5 bg-zinc-700/80 mx-0.5" />

                <button
                  type="button"
                  onClick={handleExportZip}
                  disabled={isExportingZip}
                  className={cn(
                    "flex items-center gap-1 px-1.5 sm:px-2.5 py-1 text-xs text-white rounded-md transition-colors font-semibold shadow-xs cursor-pointer disabled:opacity-50 shrink-0",
                    format === "cursor_mdc"
                      ? "bg-zinc-800 hover:bg-black border border-zinc-600"
                      : "bg-orange-600 hover:bg-orange-500"
                  )}
                  title="Export complete workspace suite as a .zip bundle"
                >
                  <Archive className="w-3.5 h-3.5 text-orange-200 shrink-0" />
                  <span className="hidden 2xl:inline whitespace-nowrap">{isExportingZip ? "Zipping..." : "Export ZIP"}</span>
                  <span className="hidden sm:inline 2xl:hidden whitespace-nowrap">{isExportingZip ? "..." : "ZIP"}</span>
                  <span className="sm:hidden whitespace-nowrap">{isExportingZip ? "..." : ""}</span>
                </button>
              </div>
            </div>

            {/* Restore notice — a form change or Reset regenerated output over the user's manual editor edits */}
            {discardedEdit && discardedEdit.format === format && !isManuallyEdited && (
              <div
                role="status"
                className="px-3 py-1.5 flex items-center justify-between gap-2 border-b border-amber-900/60 bg-amber-950/40 text-[11px] text-amber-300 font-mono"
              >
                <span className="min-w-0 truncate">Generated output replaced your manual editor edits.</span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditorContent(discardedEdit.content);
                      setIsManuallyEdited(true);
                    }}
                    className="px-2 py-0.5 rounded-md border border-amber-800/90 bg-amber-950/80 hover:bg-amber-900 transition-colors cursor-pointer"
                  >
                    Restore edits
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscardedEdit(null)}
                    className="px-1.5 py-0.5 rounded-md text-amber-500 hover:text-amber-300 transition-colors cursor-pointer"
                    aria-label="Dismiss restore notice"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Editor Container — Always full height */}
            <div
              className="h-[430px] sm:h-[520px] lg:h-[calc(100vh-23rem)] min-h-[300px] relative overflow-hidden bg-zinc-950 group"
              onClick={() => {
                if (!shouldLoadEditor) setShouldLoadEditor(true);
              }}
              onMouseEnter={() => {
                if (!shouldLoadEditor) setShouldLoadEditor(true);
              }}
            >
              {/* Static code preview fallback / background */}
              <div
                tabIndex={shouldLoadEditor ? -1 : 0}
                role={shouldLoadEditor ? undefined : "button"}
                aria-label={shouldLoadEditor ? undefined : "Click or press enter to activate interactive code editor"}
                onFocus={() => {
                  if (!shouldLoadEditor) setShouldLoadEditor(true);
                }}
                onKeyDown={(e) => {
                  if (!shouldLoadEditor && (e.key === "Enter" || e.key === " ")) {
                    setShouldLoadEditor(true);
                  }
                }}
                className={cn(
                  "w-full h-full relative",
                  !shouldLoadEditor ? "cursor-text focus:outline-hidden" : "pointer-events-none select-none"
                )}
              >
                <pre
                  ref={previewContainerRef}
                  className="relative p-4 font-mono text-xs text-zinc-300 whitespace-pre-wrap overflow-y-auto h-full select-text bg-zinc-950"
                >
                  {activeContent.split("\n").map((line, idx) => {
                    const lineNum = idx + 1;
                    const isMarked = markedRange && lineNum >= markedRange.startLine && lineNum <= markedRange.endLine;
                    return (
                      <div
                        key={idx}
                        className={cn(
                          isMarked
                            ? "marked-preview-line border-l-[3px] border-white bg-white/5 pl-2 -ml-2 text-white font-medium"
                            : ""
                        )}
                      >
                        {line || "\n"}
                      </div>
                    );
                  })}
                </pre>
                {!shouldLoadEditor && (
                  <div className="absolute bottom-3 right-3 pointer-events-none transition-opacity duration-200 opacity-60 group-hover:opacity-100">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800/90 text-zinc-400 text-[11px] font-mono border border-zinc-700/60 shadow-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                      Click or focus to edit
                    </span>
                  </div>
                )}
              </div>

              {/* On-demand Monaco Editor layer */}
              {shouldLoadEditor && (
                <div className="absolute inset-0 z-10 bg-zinc-950">
                  <Editor
                    height="100%"
                    language={format === "mcp_json" || format === "gemini_prompts" ? "json" : "markdown"}
                    value={activeContent}
                    theme="vs-dark"
                    onMount={(editor, monaco) => {
                      editorRef.current = editor;
                      monacoInstanceRef.current = monaco;
                      decorationsCollectionRef.current = null;
                      setEditorReady(true);
                      const currentRange = markedRangeRef.current;
                      if (currentRange) {
                        setTimeout(() => {
                          try {
                            editor.revealLineInCenter(currentRange.startLine, 0); // 0 = Smooth scroll
                          } catch {
                            try {
                              editor.revealLine(currentRange.startLine);
                            } catch {
                              /* noop */
                            }
                          }
                        }, 50);
                      } else {
                        editor.setScrollTop(0);
                      }
                    }}
                    onChange={(val) => {
                      if (val !== undefined) {
                        // Monaco fires outside React's event system, so a deferred render would hand the
                        // editor a stale `value` that overwrites the next keystroke; commit synchronously.
                        flushSync(() => {
                          setEditorContent(val);
                          setIsManuallyEdited(true);
                        });
                      }
                    }}
                    loading={
                      <div className="relative w-full h-full">
                        <pre className="p-4 font-mono text-xs text-zinc-300 whitespace-pre-wrap overflow-y-auto h-full select-text bg-zinc-950">
                          {activeContent}
                        </pre>
                        <div className="absolute bottom-3 right-3 pointer-events-none">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800/90 text-zinc-400 text-[11px] font-mono border border-zinc-700/60 shadow-md">
                            <RefreshCw className="w-3 h-3 animate-spin text-orange-400" />
                            Loading editor...
                          </span>
                        </div>
                      </div>
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
                      glyphMargin: true,
                      // Room for the White Marker bar between line numbers and text, so it never covers the first character
                      lineDecorationsWidth: 14,
                      scrollBeyondLastLine: false,
                      smoothScrolling: true,
                      automaticLayout: true,
                      maxTokenizationLineLength: 20000,
                      unicodeHighlight: { ambiguousCharacters: false },
                      renderLineHighlight: "none",
                      folding: false,
                      quickSuggestions: false,
                      fixedOverflowWidgets: true,
                      padding: { top: 10, bottom: 10 },
                      scrollbar: {
                        vertical: "visible",
                        horizontal: "auto",
                        verticalScrollbarSize: 8,
                        horizontalScrollbarSize: 8,
                      },
                    }}
                  />
                </div>
              )}

              {/* Rule Quality Audit — Professional Dark Floating Panel (Anchored above status bar) */}
              {showAuditPanel && (
                <AuditPanel
                  auditReport={auditReport}
                  format={format}
                  auditTab={auditTab}
                  setAuditTab={setAuditTab}
                  selectedDimension={selectedDimension}
                  setSelectedDimension={setSelectedDimension}
                  auditCopied={auditCopied}
                  setShowAuditPanel={setShowAuditPanel}
                  handleCopyAuditReport={handleCopyAuditReport}
                  handleAutoFixAll={handleAutoFixAll}
                  handleInjectNegativeGuardrails={handleInjectNegativeGuardrails}
                  handleFixVaguePhrases={handleFixVaguePhrases}
                  handleScopeGlobs={handleScopeGlobs}
                  handleFixFormatCompliance={handleFixFormatCompliance}
                  handleFixBroadTriggers={handleFixBroadTriggers}
                  handleInjectCodeBlock={handleInjectCodeBlock}
                />
              )}
            </div>

            {/* Native IDE Bottom Status Bar with Anchored Audit Launcher (Pure Dark / Black + Orange Star) */}
            <EditorStatusBar
              format={format}
              lineCount={lineCount}
              auditReport={auditReport}
              showAuditPanel={showAuditPanel}
              setShowAuditPanel={setShowAuditPanel}
            />
          </div>

          {/* Instructional Target Location Card (Redesigned with warm orange palette & sleek typography) */}
          <TargetLocationCard
            format={format}
            skillName={skillName}
          />
        </div>
      </main>

      {/* Mobile Floating Action Bar (Sticky at bottom on < lg) */}
      <MobileActionBar
        mobileTab={mobileTab}
        setMobileTab={setMobileTab}
        currentFileName={currentFileName}
        lineCount={lineCount}
        copied={copied}
        handleCopy={handleCopy}
      />

      {/* Manifest Import Modal (P2) */}
      <ManifestImportModal
        isOpen={isManifestModalOpen}
        onClose={() => setIsManifestModalOpen(false)}
        onApply={handleApplyManifest}
      />

      {/* Rules Converter Modal (P3) */}
      <RulesConverterModal
        isOpen={isConverterModalOpen}
        onClose={() => setIsConverterModalOpen(false)}
        onApply={handleApplyConvertedRules}
      />

      {/* GitHub Repository Live Ingest Modal */}
      <GitHubRepoModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
        onApply={handleApplyGitHubRepo}
        initialFormat={format}
      />

      {/* Database Schema / DDL Introspection Modal */}
      <DdlIntrospectModal
        isOpen={isDdlModalOpen}
        onClose={() => setIsDdlModalOpen(false)}
        onApply={handleApplyDdlSchema}
        initialFormat={format}
      />

      {/* Local Folder Project Inspection Modal */}
      <LocalFolderModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        onApply={handleApplyLocalFolder}
        initialFormat={format}
      />

      {/* Docker Compose / Container Introspection Modal */}
      <DockerInspectModal
        isOpen={isDockerModalOpen}
        onClose={() => setIsDockerModalOpen(false)}
        onApply={handleApplyDockerCompose}
        initialFormat={format}
      />

      {/* Download Audit HUD — bottom notification on download/export */}
      {downloadHudPayload && (
        <DownloadAuditHud
          key={downloadHudPayload.id}
          payload={downloadHudPayload}
          onDismiss={() => setDownloadHudPayload(null)}
          onViewAuditDetails={() => setShowAuditPanel(true)}
        />
      )}
    </div>
  );
}
