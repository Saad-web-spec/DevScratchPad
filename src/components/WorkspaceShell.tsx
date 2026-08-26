"use client";

import { useState, useEffect, useCallback } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { Sidebar } from "@/components/layout/Sidebar";
import { StatusBar } from "@/components/layout/StatusBar";
import { JsonFormatterTool } from "@/components/tools/JsonFormatterTool";
import { JwtDecoderTool } from "@/components/tools/JwtDecoderTool";
import { TimestampConverterTool } from "@/components/tools/TimestampConverterTool";
import { CurlConverterTool } from "@/components/tools/CurlConverterTool";
import { DiffCheckerTool } from "@/components/tools/DiffCheckerTool";
import { XmlFormatterTool } from "@/components/tools/XmlFormatterTool";
import { SqlFormatterTool } from "@/components/tools/SqlFormatterTool";
import { Base64DecoderTool } from "@/components/tools/Base64DecoderTool";
import { UrlEncoderTool } from "@/components/tools/UrlEncoderTool";
import { HashGeneratorTool } from "@/components/tools/HashGeneratorTool";
import { RegexTesterTool } from "@/components/tools/RegexTesterTool";
import { JsonToTsTool } from "@/components/tools/JsonToTsTool";
import { CronVisualizerTool } from "@/components/tools/CronVisualizerTool";
import { YamlConverterTool } from "@/components/tools/YamlConverterTool";
import { MinifierTool } from "@/components/tools/MinifierTool";
import { GraphqlFormatterTool } from "@/components/tools/GraphqlFormatterTool";
import { MarkdownPreviewerTool } from "@/components/tools/MarkdownPreviewerTool";
import { HmacGeneratorTool } from "@/components/tools/HmacGeneratorTool";
import { CidrCalculatorTool } from "@/components/tools/CidrCalculatorTool";
import { RecipePipelineTool } from "@/components/tools/RecipePipelineTool";
import { CommandPalette } from "@/components/modals/CommandPalette";
import { SeoContent } from "@/components/seo/SeoContent";
import { getToolMeta, type ToolMeta } from "@/lib/tools/registry";
import { addHistoryEntry, type HistoryEntry } from "@/lib/storage";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { decodeShareData } from "@/components/ShareButton";

// Bidirectional map between sidebar IDs and URL slugs
const SIDEBAR_TO_SLUG: Record<string, string> = {
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
  "recipe-pipeline": "recipe-pipeline",
};

const SIDEBAR_TO_NAME: Record<string, string> = {
  "json-formatter": "JSON Formatter",
  jwt: "JWT Decoder",
  timestamp: "Unix Timestamp",
  curl: "cURL Converter",
  diff: "Diff Checker",
  "xml-formatter": "XML Formatter",
  "sql-formatter": "SQL Formatter",
  base64: "Base64 Decoder",
  url: "URL Encoder",
  hash: "Hash Generator",
  regex: "Regex Tester",
  "json-to-ts": "JSON to TypeScript",
  cron: "Cron Visualizer",
  yaml: "YAML Converter",
  minifier: "CSS/SVG Minifier",
  "graphql-formatter": "GraphQL Formatter",
  "markdown-previewer": "Markdown Previewer",
  "hmac-generator": "HMAC Generator",
  "cidr-calculator": "CIDR Calculator",
  "recipe-pipeline": "Recipe Pipeline",
};

const SLUG_TO_SIDEBAR: Record<string, string> = Object.fromEntries(
  Object.entries(SIDEBAR_TO_SLUG).map(([k, v]) => [v, k])
);

interface WorkspaceShellProps {
  initialToolSlug?: string;
  toolMeta?: ToolMeta | null;
}

export function WorkspaceShell({ initialToolSlug, toolMeta }: WorkspaceShellProps) {
  const router = useRouter();

  const initialSidebarId = initialToolSlug
    ? SLUG_TO_SIDEBAR[initialToolSlug] || "json-formatter"
    : "json-formatter";

  const [activeTool, setActiveTool] = useState(initialSidebarId);
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [restoredInput, setRestoredInput] = useState<string | null>(null);

  // Status Bar State
  const [isValid, setIsValid] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | undefined>();
  const [errorLine, setErrorLine] = useState<number | undefined>();
  const [inputLength, setInputLength] = useState(0);
  const [execMs, setExecMs] = useState(0);

  // Global Ctrl/Cmd + K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  // Restore state from URL Hash (#data=base64...)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith("#data=")) {
        try {
          const base64Data = hash.substring(6);
          const decoded = decodeShareData(base64Data);
          if (decoded) {
            setRestoredInput(decoded);
          }
        } catch (e) {
          console.error("Failed to decode hash data", e);
        }
      }
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const handleValidationChange = useCallback(
    (valid: boolean, error?: string, line?: number) => {
      setIsValid(valid);
      setErrorMsg(error);
      setErrorLine(line);
    },
    []
  );

  const handleStatsChange = useCallback((length: number, ms: number) => {
    setInputLength(length);
    setExecMs(ms);
  }, []);

  const handleToolChange = (sidebarId: string) => {
    setActiveTool(sidebarId);
    setRestoredInput(null);
    setIsValid(true);
    setErrorMsg(undefined);
    setErrorLine(undefined);
    setInputLength(0);
    setExecMs(0);

    const slug = SIDEBAR_TO_SLUG[sidebarId];
    if (slug) {
      router.push(`/${slug}`, { scroll: false });
    } else {
      router.push("/", { scroll: false });
    }
  };

  const handleRestoreHistory = (entry: HistoryEntry) => {
    setActiveTool(entry.toolId);
    setRestoredInput(entry.input);
    const slug = SIDEBAR_TO_SLUG[entry.toolId];
    if (slug) {
      router.push(`/${slug}`, { scroll: false });
    }
  };

  // Log to history when a format/convert action is performed
  const handleLogHistory = useCallback(
    (input: string) => {
      const name = SIDEBAR_TO_NAME[activeTool] || activeTool;
      addHistoryEntry(activeTool, name, input);
    },
    [activeTool]
  );

  const currentSlug = SIDEBAR_TO_SLUG[activeTool];
  const currentMeta = currentSlug
    ? getToolMeta(currentSlug)
    : toolMeta ?? undefined;

  const IMPLEMENTED_TOOLS = [
    "json-formatter",
    "jwt",
    "timestamp",
    "curl",
    "diff",
    "xml-formatter",
    "sql-formatter",
    "base64",
    "url",
    "hash",
    "regex",
    "json-to-ts",
    "cron",
    "yaml",
    "minifier",
    "graphql-formatter",
    "markdown-previewer",
    "hmac-generator",
    "cidr-calculator",
    "recipe-pipeline",
  ];

  return (
    <div className="flex flex-col h-screen w-full bg-white dark:bg-slate-950 overflow-hidden relative">
      <TopBar
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onOpenMobileMenu={() => setIsMobileDrawerOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop Left Sidebar: hidden on mobile (< 768px), visible on md+ */}
        <Sidebar
          activeToolId={activeTool}
          onSelectTool={handleToolChange}
          onRestoreHistory={handleRestoreHistory}
          className="hidden md:flex"
        />

        {/* Mobile Slide-over Drawer / Sheet Component */}
        {isMobileDrawerOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/50 dark:bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
              onClick={() => setIsMobileDrawerOpen(false)}
            />

            {/* Slide-over Container */}
            <div className="relative flex flex-col w-72 max-w-[85vw] bg-white dark:bg-slate-900 h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
              <div className="h-14 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 shrink-0 bg-white dark:bg-slate-900">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-slate-900 dark:bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0">
                    DS
                  </div>
                  <span className="font-semibold text-base text-slate-900 dark:text-white truncate">
                    DevScratchpad
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Close navigation drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0">
                <Sidebar
                  activeToolId={activeTool}
                  onSelectTool={(id) => {
                    handleToolChange(id);
                    setIsMobileDrawerOpen(false);
                  }}
                  onRestoreHistory={(entry) => {
                    handleRestoreHistory(entry);
                    setIsMobileDrawerOpen(false);
                  }}
                  onCloseMobileMenu={() => setIsMobileDrawerOpen(false)}
                  className="w-full border-r-0"
                />
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-950 overflow-y-auto">
          <div className="flex-1 min-h-0 relative flex flex-col">
            <div className="flex-1 min-h-[500px]">
              {activeTool === "json-formatter" && (
                <JsonFormatterTool
                  onValidationChange={handleValidationChange}
                  onStatsChange={handleStatsChange}
                  onLogHistory={handleLogHistory}
                  restoredInput={restoredInput}
                />
              )}
              {activeTool === "jwt" && (
                <JwtDecoderTool
                  onValidationChange={handleValidationChange}
                  onStatsChange={handleStatsChange}
                  restoredInput={restoredInput}
                />
              )}
              {activeTool === "timestamp" && (
                <TimestampConverterTool
                  onValidationChange={handleValidationChange}
                  onStatsChange={handleStatsChange}
                  restoredInput={restoredInput}
                />
              )}
              {activeTool === "curl" && (
                <CurlConverterTool
                  onValidationChange={handleValidationChange}
                  onStatsChange={handleStatsChange}
                  restoredInput={restoredInput}
                />
              )}
              {activeTool === "diff" && <DiffCheckerTool restoredInput={restoredInput} />}
              {activeTool === "xml-formatter" && (
                <XmlFormatterTool
                  onValidationChange={handleValidationChange}
                  onStatsChange={handleStatsChange}
                  onLogHistory={handleLogHistory}
                  restoredInput={restoredInput}
                />
              )}
              {activeTool === "sql-formatter" && (
                <SqlFormatterTool
                  onValidationChange={handleValidationChange}
                  onStatsChange={handleStatsChange}
                  onLogHistory={handleLogHistory}
                  restoredInput={restoredInput}
                />
              )}
              {activeTool === "base64" && (
                <Base64DecoderTool
                  onValidationChange={handleValidationChange}
                  onStatsChange={handleStatsChange}
                  onLogHistory={handleLogHistory}
                  restoredInput={restoredInput}
                />
              )}
              {activeTool === "url" && (
                <UrlEncoderTool
                  onValidationChange={handleValidationChange}
                  onStatsChange={handleStatsChange}
                  onLogHistory={handleLogHistory}
                  restoredInput={restoredInput}
                />
              )}
              {activeTool === "hash" && (
                <HashGeneratorTool
                  onValidationChange={handleValidationChange}
                  onStatsChange={handleStatsChange}
                  onLogHistory={handleLogHistory}
                  restoredInput={restoredInput}
                />
              )}
              {activeTool === "regex" && (
                <RegexTesterTool
                  onValidationChange={handleValidationChange}
                  onStatsChange={handleStatsChange}
                  onLogHistory={handleLogHistory}
                  restoredInput={restoredInput}
                />
              )}
              {activeTool === "json-to-ts" && (
                <JsonToTsTool
                  onValidationChange={handleValidationChange}
                  onStatsChange={handleStatsChange}
                  onLogHistory={handleLogHistory}
                  restoredInput={restoredInput}
                />
              )}
              {activeTool === "cron" && (
                <CronVisualizerTool
                  onValidationChange={handleValidationChange}
                  onStatsChange={handleStatsChange}
                  onLogHistory={handleLogHistory}
                  restoredInput={restoredInput}
                />
              )}
              {activeTool === "yaml" && (
                <YamlConverterTool
                  onValidationChange={handleValidationChange}
                  onStatsChange={handleStatsChange}
                  onLogHistory={handleLogHistory}
                  restoredInput={restoredInput}
                />
              )}
              {activeTool === "minifier" && (
                <MinifierTool
                  onValidationChange={handleValidationChange}
                  onStatsChange={handleStatsChange}
                  onLogHistory={handleLogHistory}
                  restoredInput={restoredInput}
                />
              )}
              {activeTool === "graphql-formatter" && (
                <GraphqlFormatterTool
                  onValidationChange={handleValidationChange}
                  onStatsChange={handleStatsChange}
                  onLogHistory={handleLogHistory}
                  restoredInput={restoredInput}
                />
              )}
              {activeTool === "markdown-previewer" && (
                <MarkdownPreviewerTool
                  onValidationChange={handleValidationChange}
                  onStatsChange={handleStatsChange}
                  onLogHistory={handleLogHistory}
                  restoredInput={restoredInput}
                />
              )}
              {activeTool === "hmac-generator" && (
                <HmacGeneratorTool
                  onValidationChange={handleValidationChange}
                  onStatsChange={handleStatsChange}
                  onLogHistory={handleLogHistory}
                  restoredInput={restoredInput}
                />
              )}
              {activeTool === "cidr-calculator" && (
                <CidrCalculatorTool
                  onValidationChange={handleValidationChange}
                  onStatsChange={handleStatsChange}
                  onLogHistory={handleLogHistory}
                  restoredInput={restoredInput}
                />
              )}
              {activeTool === "recipe-pipeline" && (
                <RecipePipelineTool
                  onValidationChange={handleValidationChange}
                  onStatsChange={handleStatsChange}
                  onLogHistory={handleLogHistory}
                  restoredInput={restoredInput}
                />
              )}

              {!IMPLEMENTED_TOOLS.includes(activeTool) && (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500">
                  <p className="text-lg font-medium text-slate-500 dark:text-slate-400 mb-2">
                    Coming Soon
                  </p>
                  <p className="text-sm">
                    This tool will be available in a future update.
                  </p>
                </div>
              )}
            </div>

            {currentMeta && <SeoContent tool={currentMeta} />}
          </div>
        </main>
      </div>

      <StatusBar
        isValid={isValid}
        errorMessage={errorMsg}
        errorLine={errorLine}
        inputLength={inputLength}
        executionMs={execMs}
      />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onSelectTool={handleToolChange}
      />
    </div>
  );
}
