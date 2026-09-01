"use client";

import { useState, useEffect, useCallback } from"react";
import { TopBar } from"@/components/layout/TopBar";
import { Sidebar } from"@/components/layout/Sidebar";
import dynamic from"next/dynamic";

// Dynamically import tools to code-split heavy dependencies (sql-formatter, graphql, yaml, etc)
const JsonFormatterTool = dynamic(() => import("@/components/tools/JsonFormatterTool").then(mod => mod.JsonFormatterTool));
const JwtDecoderTool = dynamic(() => import("@/components/tools/JwtDecoderTool").then(mod => mod.JwtDecoderTool));
const CurlConverterTool = dynamic(() => import("@/components/tools/CurlConverterTool").then(mod => mod.CurlConverterTool));
const DiffCheckerTool = dynamic(() => import("@/components/tools/DiffCheckerTool").then(mod => mod.DiffCheckerTool));
const XmlFormatterTool = dynamic(() => import("@/components/tools/XmlFormatterTool").then(mod => mod.XmlFormatterTool));
const SqlFormatterTool = dynamic(() => import("@/components/tools/SqlFormatterTool").then(mod => mod.SqlFormatterTool));
const HashGeneratorTool = dynamic(() => import("@/components/tools/HashGeneratorTool").then(mod => mod.HashGeneratorTool));
const RegexTesterTool = dynamic(() => import("@/components/tools/RegexTesterTool").then(mod => mod.RegexTesterTool));
const JsonToTsTool = dynamic(() => import("@/components/tools/JsonToTsTool").then(mod => mod.JsonToTsTool));
const CronVisualizerTool = dynamic(() => import("@/components/tools/CronVisualizerTool").then(mod => mod.CronVisualizerTool));
const YamlConverterTool = dynamic(() => import("@/components/tools/YamlConverterTool").then(mod => mod.YamlConverterTool));
const MinifierTool = dynamic(() => import("@/components/tools/MinifierTool").then(mod => mod.MinifierTool));
const GraphqlFormatterTool = dynamic(() => import("@/components/tools/GraphqlFormatterTool").then(mod => mod.GraphqlFormatterTool));
const HmacGeneratorTool = dynamic(() => import("@/components/tools/HmacGeneratorTool").then(mod => mod.HmacGeneratorTool));
const CidrCalculatorTool = dynamic(() => import("@/components/tools/CidrCalculatorTool").then(mod => mod.CidrCalculatorTool));
const SvgToJsxTool = dynamic(() => import("@/components/tools/SvgToJsxTool").then(mod => mod.SvgToJsxTool));
const UuidGeneratorTool = dynamic(() => import("@/components/tools/UuidGeneratorTool").then(mod => mod.UuidGeneratorTool));
import { CommandPalette } from"@/components/modals/CommandPalette";
import { getToolMeta, type ToolMeta } from"@/lib/tools/registry";
import { addHistoryEntry, type HistoryEntry } from"@/lib/storage";
import { X, Sparkles } from "lucide-react";
import { useRouter } from"next/navigation";
import { decodeShareData } from"@/components/ShareButton";

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
};

interface WorkspaceShellProps {
 initialToolSlug?: string;
 toolMeta?: ToolMeta | null;
 children?: React.ReactNode;
}

export function WorkspaceShell({ initialToolSlug, toolMeta, children }: WorkspaceShellProps) {
 const router = useRouter();

 const initialSidebarId = initialToolSlug
 ? SLUG_TO_SIDEBAR[initialToolSlug] ||"json-formatter"
 :"json-formatter";

 const [activeTool, setActiveTool] = useState(initialSidebarId);

 // Sync activeTool with URL when user navigates (e.g. Back/Forward button)
 useEffect(() => {
   if (initialToolSlug) {
     const sidebarId = SLUG_TO_SIDEBAR[initialToolSlug];
     if (sidebarId && sidebarId !== activeTool) {
       setActiveTool(sidebarId);
     }
   } else if (activeTool !== "json-formatter") {
     setActiveTool("json-formatter");
   }
 }, [initialToolSlug]);

  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [magicPasteToast, setMagicPasteToast] = useState<{message: string; visible: boolean} | null>(null);
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
    try {
      const pending = sessionStorage.getItem("devscratchpad_magic_paste");
      if (pending) {
        setRestoredInput(pending);
        sessionStorage.removeItem("devscratchpad_magic_paste");
      }
    } catch {}
  }, [activeTool]);

  // Magic Paste Smart Auto-Detector
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      
      // Do not intercept if user is typing in the search bar or command palette
      if (target && target.tagName === 'INPUT') {
        const placeholder = (target as HTMLInputElement).placeholder?.toLowerCase() || '';
        if (placeholder.includes('search') || placeholder.includes('find')) return;
      }

      const text = e.clipboardData?.getData('text/plain') || e.clipboardData?.getData('text');
      if (!text) return;

      const trimmed = text.trim();
      if (!trimmed) return;

      let detectedToolId: string | null = null;
      let toolName = "";
      let cleanedText = trimmed;

      // 1. Cleaned JWT (strip optional Bearer prefix and surrounding quotes)
      const cleanJwt = trimmed.replace(/^Bearer\s+/i, '').replace(/^["']|["']$/g, '');
      if (/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]*$/.test(cleanJwt) && cleanJwt.split('.').length === 3 && cleanJwt.startsWith('eyJ')) {
        detectedToolId = "jwt";
        toolName = "JWT Decoder";
        cleanedText = cleanJwt;
      }
      // 2. cURL Command
      else if (/^curl\s+/i.test(trimmed)) {
        detectedToolId = "curl";
        toolName = "cURL Converter";
      }
      // 3. SVG Vector
      else if (/<svg[\s\S]*>[\s\S]*<\/svg>/i.test(trimmed)) {
        detectedToolId = "svg-to-jsx";
        toolName = "SVG to JSX";
      }
      // 4. JSON
      else if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
          JSON.parse(trimmed);
          detectedToolId = "json-formatter";
          toolName = "JSON Formatter";
        } catch {}
      }
      // 5. XML
      else if (trimmed.startsWith('<?xml') || (trimmed.startsWith('<') && trimmed.endsWith('>') && /<\/([a-zA-Z0-9_-]+)>$/.test(trimmed))) {
        detectedToolId = "xml-formatter";
        toolName = "XML Formatter";
      }
      // 6. SQL
      else if (/^(SELECT|INSERT\s+INTO|UPDATE|DELETE\s+FROM|CREATE\s+TABLE|ALTER\s+TABLE|DROP\s+TABLE|WITH)\s+/i.test(trimmed)) {
        detectedToolId = "sql-formatter";
        toolName = "SQL Formatter";
      }
      // 7. Unix Timestamp (10 or 13 digits)
      else if (/^\d{10}$/.test(trimmed) || /^\d{13}$/.test(trimmed)) {
        detectedToolId = "timestamp";
        toolName = "Unix Timestamp";
      }
      // 8. Cron expression (5 or 6 fields)
      else if (/^(@(annually|yearly|monthly|weekly|daily|hourly|reboot))|(@every (\d+(ns|us|µs|ms|s|m|h))+)|((((\d+,)+\d+|(\d+(\/|-)\d+)|\d+|\*) ?){5,6})$/.test(trimmed)) {
        detectedToolId = "cron";
        toolName = "Cron Visualizer";
      }

      if (detectedToolId) {
        if (detectedToolId !== activeTool) {
          e.preventDefault();
          try {
            sessionStorage.setItem("devscratchpad_magic_paste", cleanedText);
          } catch {}

          setActiveTool(detectedToolId);
          setRestoredInput(cleanedText);

          router.push(getToolUrl(detectedToolId), { scroll: false });

          setMagicPasteToast({ message: `Auto-detected ${toolName}. Switched tools!`, visible: true });
          setTimeout(() => setMagicPasteToast(null), 3500);
        } else {
          setMagicPasteToast({ message: `✨ Detected ${toolName} input`, visible: true });
          setTimeout(() => setMagicPasteToast(null), 2500);
        }
      }
    };
    
    // Use capture phase so we intercept the paste before Monaco Editor's stopPropagation()
    window.addEventListener('paste', handlePaste, { capture: true });
    return () => window.removeEventListener('paste', handlePaste, { capture: true });
  }, [activeTool, router]);

 // Global Ctrl/Cmd + K shortcut
 useEffect(() => {
 // Check if we are in embed mode
 const searchParams = new URLSearchParams(window.location.search);
 if (searchParams.get("embed") ==="true") {
 setIsEmbed(true);
 }

 const handleKeyDown = (e: KeyboardEvent) => {
 if ((e.metaKey || e.ctrlKey) && e.key ==="k") {
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

 router.push(getToolUrl(sidebarId), { scroll: false });
 };

 const handleRestoreHistory = (entry: HistoryEntry) => {
 setActiveTool(entry.toolId);
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

 const currentSlug = SIDEBAR_TO_SLUG[activeTool];
 const currentMeta = currentSlug
 ? getToolMeta(currentSlug)
 : toolMeta ?? undefined;

 const IMPLEMENTED_TOOLS = ["json-formatter","json-validator","jwt","curl-to-python","curl-to-fetch","curl-to-go","curl-to-javascript","diff","xml-formatter","sql-formatter","hash","regex","json-to-ts","json-to-zod","json-to-go","cron","yaml","yaml-to-json","json-to-yaml","minifier","graphql-formatter","hmac-generator","cidr-calculator","svg-to-jsx","uuid-generator"];

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
 <X className="w-5 h-5"/>
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

 <main className="flex-1 flex flex-col min-w-0 bg-white overflow-y-auto">
 <div className="flex-1 min-h-0 relative flex flex-col">
 <div className="min-h-[calc(100vh-3.5rem)] relative flex flex-col border-b border-zinc-200">
 {(activeTool === "json-formatter" || activeTool === "json-validator") && (
  <JsonFormatterTool onValidationChange={handleValidationChange} onStatsChange={handleStatsChange} onLogHistory={handleLogHistory} restoredInput={restoredInput} />
)}
{activeTool === "jwt" && (
  <JwtDecoderTool onValidationChange={handleValidationChange} onStatsChange={handleStatsChange} restoredInput={restoredInput} />
)}
{activeTool === "curl-to-python" && (
  <CurlConverterTool fixedTarget="python" onValidationChange={handleValidationChange} onStatsChange={handleStatsChange} restoredInput={restoredInput} />
)}
{(activeTool === "curl-to-fetch" || activeTool === "curl-to-javascript") && (
  <CurlConverterTool fixedTarget="javascript" onValidationChange={handleValidationChange} onStatsChange={handleStatsChange} restoredInput={restoredInput} />
)}
{activeTool === "curl-to-go" && (
  <CurlConverterTool fixedTarget="go" onValidationChange={handleValidationChange} onStatsChange={handleStatsChange} restoredInput={restoredInput} />
)}
{(activeTool === "yaml" || activeTool === "yaml-to-json" || activeTool === "json-to-yaml") && (
  <YamlConverterTool onValidationChange={handleValidationChange} onStatsChange={handleStatsChange} onLogHistory={handleLogHistory} restoredInput={restoredInput} />
)}
{activeTool === "diff" && <DiffCheckerTool restoredInput={restoredInput} />}
{activeTool ==="xml-formatter"&& (
 <XmlFormatterTool onValidationChange={handleValidationChange} onStatsChange={handleStatsChange} onLogHistory={handleLogHistory} restoredInput={restoredInput} />
)}
{activeTool ==="sql-formatter"&& (
 <SqlFormatterTool onValidationChange={handleValidationChange} onStatsChange={handleStatsChange} onLogHistory={handleLogHistory} restoredInput={restoredInput} />
)}
{activeTool ==="hash"&& (
 <HashGeneratorTool onValidationChange={handleValidationChange} onStatsChange={handleStatsChange} onLogHistory={handleLogHistory} restoredInput={restoredInput} />
)}
{activeTool ==="regex"&& (
 <RegexTesterTool onValidationChange={handleValidationChange} onStatsChange={handleStatsChange} onLogHistory={handleLogHistory} restoredInput={restoredInput} />
)}
{activeTool ==="json-to-ts"&& (
 <JsonToTsTool fixedTarget="typescript" onValidationChange={handleValidationChange} onStatsChange={handleStatsChange} onLogHistory={handleLogHistory} restoredInput={restoredInput} />
)}
{activeTool ==="json-to-zod"&& (
 <JsonToTsTool fixedTarget="zod" onValidationChange={handleValidationChange} onStatsChange={handleStatsChange} onLogHistory={handleLogHistory} restoredInput={restoredInput} />
)}
{activeTool ==="json-to-go"&& (
 <JsonToTsTool fixedTarget="go" onValidationChange={handleValidationChange} onStatsChange={handleStatsChange} onLogHistory={handleLogHistory} restoredInput={restoredInput} />
)}
{activeTool ==="cron"&& (
 <CronVisualizerTool onValidationChange={handleValidationChange} onStatsChange={handleStatsChange} onLogHistory={handleLogHistory} restoredInput={restoredInput} />
)}
{activeTool ==="yaml"&& (
 <YamlConverterTool onValidationChange={handleValidationChange} onStatsChange={handleStatsChange} onLogHistory={handleLogHistory} restoredInput={restoredInput} />
)}
{activeTool ==="minifier"&& (
 <MinifierTool onValidationChange={handleValidationChange} onStatsChange={handleStatsChange} onLogHistory={handleLogHistory} restoredInput={restoredInput} />
)}
{activeTool ==="graphql-formatter"&& (
 <GraphqlFormatterTool onValidationChange={handleValidationChange} onStatsChange={handleStatsChange} onLogHistory={handleLogHistory} restoredInput={restoredInput} />
)}
{activeTool ==="hmac-generator"&& (
 <HmacGeneratorTool onValidationChange={handleValidationChange} onStatsChange={handleStatsChange} onLogHistory={handleLogHistory} restoredInput={restoredInput} />
)}
{activeTool ==="cidr-calculator"&& (
 <CidrCalculatorTool onValidationChange={handleValidationChange} onStatsChange={handleStatsChange} onLogHistory={handleLogHistory} restoredInput={restoredInput} />
)}
{activeTool ==="svg-to-jsx"&& (
 <SvgToJsxTool onValidationChange={handleValidationChange} onStatsChange={handleStatsChange} restoredInput={restoredInput} />
)}
{activeTool ==="uuid-generator"&& (
 <UuidGeneratorTool onValidationChange={handleValidationChange} onStatsChange={handleStatsChange} onLogHistory={handleLogHistory} restoredInput={restoredInput} />
)}
{!IMPLEMENTED_TOOLS.includes(activeTool) && (
 <div className="flex flex-col items-center justify-center h-full text-zinc-400">
 <p className="text-lg font-medium text-zinc-500 mb-2">
 Coming Soon
 </p>
 <p className="text-sm">
 This tool will be available in a future update.
 </p>
 </div>
 )}
 </div>

 {!isEmbed && children}

  {/* Smart Paste Floating Toast Notification */}
  {magicPasteToast && magicPasteToast.visible && (
    <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-none">
      <div className="bg-zinc-900 text-white text-xs md:text-sm font-medium px-4 py-2 rounded-full shadow-none flex items-center gap-2 border border-zinc-800 backdrop-blur-md">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-zinc-300 shrink-0">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          <path d="M12 11l-2 3h3l-1 4 4-5h-3l1-2z" fill="currentColor" />
        </svg>
        <span>{magicPasteToast.message}</span>
      </div>
    </div>
  )}
 {isEmbed && (
 <a
 href={`https://www.devscratchpad.tech/tools/${currentSlug || ''}`}
 target="_blank"
 rel="noopener noreferrer"
 className="absolute bottom-10 right-4 bg-zinc-900/90 hover:bg-black text-zinc-900 px-3 py-1.5 rounded-full text-xs font-medium shadow-none backdrop-blur-sm border border-white/10 transition-transform hover:scale-105 z-50 flex items-center gap-1.5"
 >
 <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/>
 Powered by DevScratchpad
 </a>
 )}
 </div>
 </main>
 </div>

 {!isEmbed && (
 <CommandPalette
 isOpen={isCommandPaletteOpen}
 onClose={() => setCommandPaletteOpen(false)}
 onSelectTool={handleToolChange}
 />
 )}
 </div>
 );
}
