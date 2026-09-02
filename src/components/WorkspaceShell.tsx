"use client";

import { useState, useEffect, useCallback } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { Sidebar } from "@/components/layout/Sidebar";
import { TabsBar } from "@/components/layout/TabsBar";
import { useWorkspaceTabs } from "@/hooks/useWorkspaceTabs";
import dynamic from "next/dynamic";

// Dynamically import tools to code-split heavy dependencies
const JsonFormatterTool = dynamic(() => import("@/components/tools/JsonFormatterTool").then(mod => mod.JsonFormatterTool), { ssr: false });
const JwtDecoderTool = dynamic(() => import("@/components/tools/JwtDecoderTool").then(mod => mod.JwtDecoderTool), { ssr: false });
const CurlConverterTool = dynamic(() => import("@/components/tools/CurlConverterTool").then(mod => mod.CurlConverterTool), { ssr: false });
const DiffCheckerTool = dynamic(() => import("@/components/tools/DiffCheckerTool").then(mod => mod.DiffCheckerTool), { ssr: false });
const XmlFormatterTool = dynamic(() => import("@/components/tools/XmlFormatterTool").then(mod => mod.XmlFormatterTool), { ssr: false });
const SqlFormatterTool = dynamic(() => import("@/components/tools/SqlFormatterTool").then(mod => mod.SqlFormatterTool), { ssr: false });
const HashGeneratorTool = dynamic(() => import("@/components/tools/HashGeneratorTool").then(mod => mod.HashGeneratorTool), { ssr: false });
const RegexTesterTool = dynamic(() => import("@/components/tools/RegexTesterTool").then(mod => mod.RegexTesterTool), { ssr: false });
const JsonToTsTool = dynamic(() => import("@/components/tools/JsonToTsTool").then(mod => mod.JsonToTsTool), { ssr: false });
const CronVisualizerTool = dynamic(() => import("@/components/tools/CronVisualizerTool").then(mod => mod.CronVisualizerTool), { ssr: false });
const YamlConverterTool = dynamic(() => import("@/components/tools/YamlConverterTool").then(mod => mod.YamlConverterTool), { ssr: false });
const MinifierTool = dynamic(() => import("@/components/tools/MinifierTool").then(mod => mod.MinifierTool), { ssr: false });
const GraphqlFormatterTool = dynamic(() => import("@/components/tools/GraphqlFormatterTool").then(mod => mod.GraphqlFormatterTool), { ssr: false });
const HmacGeneratorTool = dynamic(() => import("@/components/tools/HmacGeneratorTool").then(mod => mod.HmacGeneratorTool), { ssr: false });
const CidrCalculatorTool = dynamic(() => import("@/components/tools/CidrCalculatorTool").then(mod => mod.CidrCalculatorTool), { ssr: false });
const SvgToJsxTool = dynamic(() => import("@/components/tools/SvgToJsxTool").then(mod => mod.SvgToJsxTool), { ssr: false });
const UuidGeneratorTool = dynamic(() => import("@/components/tools/UuidGeneratorTool").then(mod => mod.UuidGeneratorTool), { ssr: false });
const Base64InspectorTool = dynamic(() => import("@/components/tools/Base64InspectorTool").then(mod => mod.Base64InspectorTool), { ssr: false });
const CertDecoderTool = dynamic(() => import("@/components/tools/CertDecoderTool").then(mod => mod.CertDecoderTool), { ssr: false });
const SshKeyGeneratorTool = dynamic(() => import("@/components/tools/SshKeyGeneratorTool").then(mod => mod.SshKeyGeneratorTool), { ssr: false });
const PasswordHashTool = dynamic(() => import("@/components/tools/PasswordHashTool").then(mod => mod.PasswordHashTool), { ssr: false });
const JsonSchemaValidatorTool = dynamic(() => import("@/components/tools/JsonSchemaValidatorTool").then(mod => mod.JsonSchemaValidatorTool), { ssr: false });
const MockDataGeneratorTool = dynamic(() => import("@/components/tools/MockDataGeneratorTool").then(mod => mod.MockDataGeneratorTool), { ssr: false });
const TimestampConverterTool = dynamic(() => import("@/components/tools/TimestampConverterTool").then(mod => mod.TimestampConverterTool), { ssr: false });

import { CommandPalette } from "@/components/modals/CommandPalette";
import { getToolMeta, type ToolMeta } from "@/lib/tools/registry";
import { addHistoryEntry, type HistoryEntry } from "@/lib/storage";
import { X, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { decodeShareData } from "@/components/ShareButton";
import { SIDEBAR_TO_SLUG, SLUG_TO_SIDEBAR, getToolUrl } from "@/lib/routes";

const SIDEBAR_TO_NAME: Record<string, string> = {
  "json-formatter": "JSON Formatter",
  jwt: "JWT Decoder",
  "curl-to-python": "cURL to Python",
  "curl-to-fetch": "cURL to Fetch",
  "curl-to-go": "cURL to Go",
  diff: "Diff Checker",
  "xml-formatter": "XML Formatter",
  "sql-formatter": "SQL Formatter",
  hash: "Hash Generator",
  regex: "Regex Tester",
  "json-to-ts": "JSON to TypeScript",
  "json-to-zod": "JSON to Zod",
  "json-to-go": "JSON to Go Struct",
  cron: "Cron Visualizer",
  yaml: "YAML Converter",
  minifier: "CSS/SVG Minifier",
  "graphql-formatter": "GraphQL Formatter",
  "hmac-generator": "HMAC Generator",
  "cidr-calculator": "CIDR Calculator",
  "svg-to-jsx": "SVG to JSX",
  "uuid-generator": "UUID Generator",
  "base64-inspector": "Base64 & Hex Inspector",
  base64: "Base64 & Hex Inspector",
  "cert-decoder": "X.509 Certificate Decoder",
  x509: "X.509 Certificate Decoder",
  "ssh-key-generator": "SSH Key Generator",
  "ssh-keygen": "SSH Key Generator",
  "password-hash": "Password Hash Verifier",
  bcrypt: "Password Hash Verifier",
  "json-schema-validator": "JSON Schema Validator",
  "mock-data-generator": "Mock Data Generator",
  "epoch-converter": "Epoch Converter",
};

interface WorkspaceShellProps {
  initialToolSlug?: string;
  toolMeta?: ToolMeta | null;
  children?: React.ReactNode;
}

export function WorkspaceShell({ initialToolSlug, toolMeta, children }: WorkspaceShellProps) {
  const router = useRouter();

  const initialSidebarId = initialToolSlug
    ? SLUG_TO_SIDEBAR[initialToolSlug] || "json-formatter"
    : "json-formatter";

  const { tabs, activeTabId: activeTool, isLoaded, openTab, closeTab } = useWorkspaceTabs(initialSidebarId);

  // Sync activeTool with URL when user navigates via sidebar or tabs
  useEffect(() => {
    if (initialToolSlug) {
      const sidebarId = SLUG_TO_SIDEBAR[initialToolSlug];
      if (sidebarId && sidebarId !== activeTool) {
        openTab(sidebarId);
      }
    } else if (activeTool !== "json-formatter") {
      openTab("json-formatter");
    }
  }, [initialToolSlug, openTab]);

  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [magicPasteToast, setMagicPasteToast] = useState<{ message: string; visible: boolean } | null>(null);
  const [restoredInput, setRestoredInput] = useState<string | null>(null);

  // Status Bar State
  const [isValid, setIsValid] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | undefined>();
  const [errorLine, setErrorLine] = useState<number | undefined>();
  const [inputLength, setInputLength] = useState(0);
  const [execMs, setExecMs] = useState(0);
  const [isEmbed, setIsEmbed] = useState(false);

  // Restore magic paste from sessionStorage if available across page changes
  useEffect(() => {
    const saved = sessionStorage.getItem("devscratchpad_magic_paste");
    if (saved) {
      sessionStorage.removeItem("devscratchpad_magic_paste");
      setRestoredInput(saved);
      setMagicPasteToast({ message: "Magic Pasted into Editor", visible: true });
      setTimeout(() => setMagicPasteToast(null), 3000);
    }
  }, [activeTool]);

  // Read URL Hash for shared payloads or embed state
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.includes("embed=true")) {
        setIsEmbed(true);
      }
      if (hash.startsWith("#data=")) {
        try {
          const encoded = hash.replace("#data=", "");
          const decoded = decodeShareData(encoded);
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

  const currentSlug = SIDEBAR_TO_SLUG[activeTool];
  const currentMeta = currentSlug
    ? getToolMeta(currentSlug)
    : toolMeta ?? undefined;

  // Dynamically update document metadata on client-side tab change
  useEffect(() => {
    if (currentMeta && typeof document !== "undefined") {
      const newTitle = `${currentMeta.seoTitle} | DevScratchpad`;
      if (document.title !== newTitle) {
        document.title = newTitle;
      }
      
      let metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute("content", currentMeta.seoDescription);
      } else {
        metaDesc = document.createElement("meta");
        metaDesc.setAttribute("name", "description");
        metaDesc.setAttribute("content", currentMeta.seoDescription);
        document.head.appendChild(metaDesc);
      }
      
      let canonical = document.querySelector('link[rel="canonical"]');
      const canonicalUrl = `https://www.devscratchpad.tech/tools/${currentSlug}`;
      if (canonical) {
        canonical.setAttribute("href", canonicalUrl);
      } else {
        canonical = document.createElement("link");
        canonical.setAttribute("rel", "canonical");
        canonical.setAttribute("href", canonicalUrl);
        document.head.appendChild(canonical);
      }
    }
  }, [currentMeta, currentSlug]);

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
    openTab(sidebarId);
    setRestoredInput(null);
    setIsValid(true);
    setErrorMsg(undefined);
    setErrorLine(undefined);
    setInputLength(0);
    setExecMs(0);

    router.push(getToolUrl(sidebarId), { scroll: false });
  };
  
  const handleCloseTab = (sidebarId: string) => {
    closeTab(sidebarId);
    // Determine which tab is active next since activeTool hasn't updated in this closure
    const filtered = tabs.filter(t => t.id !== sidebarId);
    if (filtered.length > 0) {
      const latest = [...filtered].sort((a, b) => b.lastAccessed - a.lastAccessed)[0];
      if (activeTool === sidebarId) {
         router.push(getToolUrl(latest.id), { scroll: false });
      }
    } else {
       router.push(getToolUrl("json-formatter"), { scroll: false });
    }
  };

  const handleRestoreHistory = (entry: HistoryEntry) => {
    openTab(entry.toolId);
    setRestoredInput(entry.input);
    router.push(getToolUrl(entry.toolId), { scroll: false });
  };

  // Log to history when a format/convert action is performed
  const handleLogHistory = useCallback(
    (input: string) => {
      const name = SIDEBAR_TO_NAME[activeTool] || activeTool;
      addHistoryEntry(activeTool, name, input);
    },
    [activeTool]
  );


  const IMPLEMENTED_TOOLS = [
    "json-formatter",
    "json-validator",
    "jwt",
    "curl-to-python",
    "curl-to-fetch",
    "curl-to-go",
    "curl-to-javascript",
    "diff",
    "xml-formatter",
    "sql-formatter",
    "hash",
    "regex",
    "json-to-ts",
    "json-to-zod",
    "json-to-go",
    "cron",
    "yaml",
    "yaml-to-json",
    "json-to-yaml",
    "minifier",
    "graphql-formatter",
    "hmac-generator",
    "cidr-calculator",
    "svg-to-jsx",
    "uuid-generator",
    "base64-inspector",
    "base64",
    "cert-decoder",
    "x509",
    "ssh-key-generator",
    "ssh-keygen",
    "password-hash",
    "bcrypt",
    "json-schema-validator",
    "mock-data-generator",
    "epoch-converter",
  ];

  return (
    <div className="flex flex-col h-screen w-full bg-white overflow-hidden relative">
      {!isEmbed && (
        <TopBar
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          onOpenMobileMenu={() => setIsMobileDrawerOpen(true)}
        />
      )}

      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop Left Sidebar: hidden on mobile (< 768px), visible on md+ */}
        {!isEmbed && (
          <Sidebar
            activeToolId={activeTool}
            onSelectTool={handleToolChange}
            onRestoreHistory={handleRestoreHistory}
            className="hidden md:flex"
          />
        )}

        {/* Mobile Slide-over Drawer / Sheet Component */}
        {isMobileDrawerOpen && !isEmbed && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-zinc-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
              onClick={() => setIsMobileDrawerOpen(false)}
            />

            {/* Slide-over Container */}
            <div className="relative flex flex-col w-72 max-w-[85vw] bg-white h-full shadow-none z-10 animate-in slide-in-from-left duration-200 border-r border-transparent">
              <div className="h-14 border-b border-zinc-200 flex items-center justify-between px-4 shrink-0 bg-white">
                <div className="flex items-center gap-2.5">
                  <span className="font-semibold text-base text-zinc-900 truncate">
                    DevScratchpad
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
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

        <main className="flex-1 flex flex-col min-w-0 bg-white overflow-y-auto relative">
          {!isEmbed && isLoaded && (
            <div className="sticky top-0 z-20">
              <TabsBar 
                tabs={tabs} 
                activeTabId={activeTool} 
                onSelectTab={handleToolChange} 
                onCloseTab={handleCloseTab} 
              />
            </div>
          )}
          <div className="flex-1 min-h-0 relative flex flex-col">
            <div className="min-h-[calc(100vh-3.5rem-36px)] relative flex flex-col border-b border-zinc-200">
              {tabs.map((tab) => {
                const isActive = tab.id === activeTool;
                return (
                  <div key={tab.id} className={`absolute inset-0 flex flex-col w-full h-full bg-white ${!isActive ? "hidden" : ""}`}>
                    {(tab.id === "json-formatter" || tab.id === "json-validator") && (
                      <JsonFormatterTool
                        onValidationChange={handleValidationChange}
                        onStatsChange={handleStatsChange}
                        onLogHistory={handleLogHistory}
                        restoredInput={isActive ? restoredInput : null}
                      />
                    )}
                    {tab.id === "jwt" && (
                      <JwtDecoderTool
                        onValidationChange={handleValidationChange}
                        onStatsChange={handleStatsChange}
                        restoredInput={isActive ? restoredInput : null}
                      />
                    )}
                    {tab.id === "curl-to-python" && (
                      <CurlConverterTool
                        fixedTarget="python"
                        onValidationChange={handleValidationChange}
                        onStatsChange={handleStatsChange}
                        restoredInput={isActive ? restoredInput : null}
                      />
                    )}
                    {(tab.id === "curl-to-fetch" || tab.id === "curl-to-javascript") && (
                      <CurlConverterTool
                        fixedTarget="javascript"
                        onValidationChange={handleValidationChange}
                        onStatsChange={handleStatsChange}
                        restoredInput={isActive ? restoredInput : null}
                      />
                    )}
                    {tab.id === "curl-to-go" && (
                      <CurlConverterTool
                        fixedTarget="go"
                        onValidationChange={handleValidationChange}
                        onStatsChange={handleStatsChange}
                        restoredInput={isActive ? restoredInput : null}
                      />
                    )}
                    {(tab.id === "yaml" || tab.id === "yaml-to-json" || tab.id === "json-to-yaml") && (
                      <YamlConverterTool
                        onValidationChange={handleValidationChange}
                        onStatsChange={handleStatsChange}
                        onLogHistory={handleLogHistory}
                        restoredInput={isActive ? restoredInput : null}
                      />
                    )}
                    {tab.id === "diff" && <DiffCheckerTool restoredInput={isActive ? restoredInput : null} />}
                    {tab.id === "xml-formatter" && (
                      <XmlFormatterTool
                        onValidationChange={handleValidationChange}
                        onStatsChange={handleStatsChange}
                        onLogHistory={handleLogHistory}
                        restoredInput={isActive ? restoredInput : null}
                      />
                    )}
                    {tab.id === "sql-formatter" && (
                      <SqlFormatterTool
                        onValidationChange={handleValidationChange}
                        onStatsChange={handleStatsChange}
                        onLogHistory={handleLogHistory}
                        restoredInput={isActive ? restoredInput : null}
                      />
                    )}
                    {tab.id === "hash" && (
                      <HashGeneratorTool
                        onValidationChange={handleValidationChange}
                        onStatsChange={handleStatsChange}
                        onLogHistory={handleLogHistory}
                        restoredInput={isActive ? restoredInput : null}
                      />
                    )}
                    {tab.id === "regex" && (
                      <RegexTesterTool
                        onValidationChange={handleValidationChange}
                        onStatsChange={handleStatsChange}
                        onLogHistory={handleLogHistory}
                        restoredInput={isActive ? restoredInput : null}
                      />
                    )}
                    {tab.id === "json-to-ts" && (
                      <JsonToTsTool
                        fixedTarget="typescript"
                        onValidationChange={handleValidationChange}
                        onStatsChange={handleStatsChange}
                        onLogHistory={handleLogHistory}
                        restoredInput={isActive ? restoredInput : null}
                      />
                    )}
                    {tab.id === "json-to-zod" && (
                      <JsonToTsTool
                        fixedTarget="zod"
                        onValidationChange={handleValidationChange}
                        onStatsChange={handleStatsChange}
                        onLogHistory={handleLogHistory}
                        restoredInput={isActive ? restoredInput : null}
                      />
                    )}
                    {tab.id === "json-to-go" && (
                      <JsonToTsTool
                        fixedTarget="go"
                        onValidationChange={handleValidationChange}
                        onStatsChange={handleStatsChange}
                        onLogHistory={handleLogHistory}
                        restoredInput={isActive ? restoredInput : null}
                      />
                    )}
                    {tab.id === "cron" && (
                      <CronVisualizerTool
                        onValidationChange={handleValidationChange}
                        onStatsChange={handleStatsChange}
                        onLogHistory={handleLogHistory}
                        restoredInput={isActive ? restoredInput : null}
                      />
                    )}
                    {tab.id === "minifier" && (
                      <MinifierTool
                        onValidationChange={handleValidationChange}
                        onStatsChange={handleStatsChange}
                        onLogHistory={handleLogHistory}
                        restoredInput={isActive ? restoredInput : null}
                      />
                    )}
                    {tab.id === "graphql-formatter" && (
                      <GraphqlFormatterTool
                        onValidationChange={handleValidationChange}
                        onStatsChange={handleStatsChange}
                        onLogHistory={handleLogHistory}
                        restoredInput={isActive ? restoredInput : null}
                      />
                    )}
                    {tab.id === "hmac-generator" && (
                      <HmacGeneratorTool
                        onValidationChange={handleValidationChange}
                        onStatsChange={handleStatsChange}
                        onLogHistory={handleLogHistory}
                        restoredInput={isActive ? restoredInput : null}
                      />
                    )}
                    {tab.id === "cidr-calculator" && (
                      <CidrCalculatorTool
                        onValidationChange={handleValidationChange}
                        onStatsChange={handleStatsChange}
                        onLogHistory={handleLogHistory}
                        restoredInput={isActive ? restoredInput : null}
                      />
                    )}
                    {tab.id === "svg-to-jsx" && (
                      <SvgToJsxTool
                        onValidationChange={handleValidationChange}
                        onStatsChange={handleStatsChange}
                        restoredInput={isActive ? restoredInput : null}
                      />
                    )}
                    {tab.id === "uuid-generator" && (
                      <UuidGeneratorTool
                        onValidationChange={handleValidationChange}
                        onStatsChange={handleStatsChange}
                        onLogHistory={handleLogHistory}
                        restoredInput={isActive ? restoredInput : null}
                      />
                    )}
                    {(tab.id === "base64-inspector" || tab.id === "base64") && (
                      <Base64InspectorTool
                        onValidationChange={handleValidationChange}
                        onStatsChange={handleStatsChange}
                        onLogHistory={handleLogHistory}
                        restoredInput={isActive ? restoredInput : null}
                      />
                    )}
                    {(tab.id === "cert-decoder" || tab.id === "x509") && (
                      <CertDecoderTool
                        onValidationChange={handleValidationChange}
                        onStatsChange={handleStatsChange}
                        onLogHistory={handleLogHistory}
                        restoredInput={isActive ? restoredInput : null}
                      />
                    )}
                    {(tab.id === "ssh-key-generator" || tab.id === "ssh-keygen") && (
                      <SshKeyGeneratorTool
                        onValidationChange={handleValidationChange}
                        onStatsChange={handleStatsChange}
                        onLogHistory={handleLogHistory}
                        restoredInput={isActive ? restoredInput : null}
                      />
                    )}
                    {(tab.id === "password-hash" || tab.id === "bcrypt") && (
                      <PasswordHashTool
                        onValidationChange={handleValidationChange}
                        onStatsChange={handleStatsChange}
                        onLogHistory={handleLogHistory}
                        restoredInput={isActive ? restoredInput : null}
                      />
                    )}
                    {tab.id === "json-schema-validator" && (
                      <JsonSchemaValidatorTool
                        onValidationChange={handleValidationChange}
                        onStatsChange={handleStatsChange}
                        restoredInput={isActive ? restoredInput : null}
                      />
                    )}
                    {tab.id === "mock-data-generator" && (
                      <MockDataGeneratorTool
                        onValidationChange={handleValidationChange}
                        onStatsChange={handleStatsChange}
                        restoredInput={isActive ? restoredInput : null}
                      />
                    )}
                    {tab.id === "epoch-converter" && (
                      <TimestampConverterTool
                        restoredInput={isActive ? restoredInput : null}
                      />
                    )}
                    {!IMPLEMENTED_TOOLS.includes(tab.id) && (
                      <div className="flex flex-col items-center justify-center h-full text-zinc-400">
                        <p className="text-lg font-medium text-zinc-500 mb-2">Coming Soon</p>
                        <p className="text-sm">This tool will be available in a future update.</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {!isEmbed && children}

            {/* Smart Paste Floating Toast Notification */}
            {magicPasteToast && magicPasteToast.visible && (
              <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-none">
                <div className="bg-zinc-900 text-white text-xs md:text-sm font-medium px-4 py-2 rounded-full shadow-none flex items-center gap-2 border border-zinc-800 backdrop-blur-md">
                  <Sparkles className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                  <span>{magicPasteToast.message}</span>
                </div>
              </div>
            )}
            {isEmbed && (
              <a
                href="https://devscratchpad.tech"
                target="_blank"
                rel="noreferrer"
                className="absolute bottom-2 right-2 text-[10px] text-zinc-400 hover:text-zinc-600 bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded border border-zinc-200 shadow-xs z-50"
              >
                Powered by DevScratchpad
              </a>
            )}
          </div>
        </main>
      </div>

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onSelectTool={handleToolChange}
      />
    </div>
  );
}
