"use client";

import { useState, useEffect, useDeferredValue, useMemo } from"react";
import { MonacoEditor } from"@/components/MonacoEditor";
import { ShareMenu } from "@/components/ShareMenu";
import { minifyCss, minifySvg, minifyHtml, validateCss, validateSvg, validateHtml } from"@/lib/tools/minify";
import { Copy, Trash2, Check, Minimize2 } from "lucide-react";
import { cn } from"@/lib/utils";
import { addSnapshot } from"@/lib/storage";
import { EditorPanelFooter } from"@/components/layout/StatusBar";
import { ToolHeader, PaneBar, MobilePaneTabs, EDITOR_OPTIONS, btnPrimary, btnGhost, btnIcon, segmentTrack, segmentBtn, iconProps, ICON_STROKE } from "@/components/tools/ToolChrome";
import { getToolIcon } from "@/components/layout/toolIcons";

interface MinifierToolProps {
 onValidationChange: (isValid: boolean, error?: string, line?: number) => void;
 onStatsChange: (length: number, execMs: number) => void;
 onLogHistory?: (input: string) => void;
 restoredInput?: string | null;
}

type MinifyMode ="css"|"svg"|"html";

const DEFAULT_CSS = `/* Main Application Layout Styles */
.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background-color: #ffffff;
  border-bottom: 1px solid #e2e8f0;
}

.nav-link {
  color: #64748b;
  font-size: 14px;
  text-decoration: none;
  transition: color 0.2s ease;
}

.nav-link:hover {
  color: #2563eb;
}
`;

const DEFAULT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <!-- Circle icon background -->
  <circle cx="12" cy="12" r="10"></circle>
  <!-- Inner path -->
  <polyline points="12 6 12 12 14 14"></polyline>
</svg>`;

const DEFAULT_HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Landing page</title>
    <!-- Inline critical styles -->
    <style>
      .hero { padding: 48px 24px; text-align: center; }
    </style>
  </head>
  <body>
    <section class="hero">
      <h1>Ship <em>faster</em> with tiny pages</h1>
      <p>
        Every byte counts on a slow network.
      </p>
    </section>
  </body>
</html>
`;

const MODES: { id: MinifyMode; label: string; sample: string; editorLang: string; minify: (src: string) => string; validate: (src: string) => { valid: boolean; error?: string } }[] = [
 { id:"css", label:"CSS", sample: DEFAULT_CSS, editorLang:"css", minify: minifyCss, validate: validateCss },
 { id:"svg", label:"SVG", sample: DEFAULT_SVG, editorLang:"xml", minify: minifySvg, validate: validateSvg },
 { id:"html", label:"HTML", sample: DEFAULT_HTML, editorLang:"html", minify: minifyHtml, validate: validateHtml },
];
const SAMPLES = new Set(MODES.map((m) => m.sample));

/** Guess the mode of restored/shared input so it is not minified with the wrong rules. */
function detectMode(src: string): MinifyMode {
 const head = src.trimStart().slice(0, 200).toLowerCase();
 if (head.startsWith("<svg") || (head.startsWith("<?xml") && head.includes("<svg"))) return"svg";
 if (head.startsWith("<")) return"html";
 return"css";
}

const byteLength = (s: string) => new TextEncoder().encode(s).length;

export function MinifierTool({
 onValidationChange,
 onStatsChange,
 onLogHistory,
 restoredInput,
}: MinifierToolProps) {
 const [mode, setMode] = useState<MinifyMode>("css");
 const [input, setInput] = useState<string>(DEFAULT_CSS);
 const [output, setOutput] = useState<string>("");
 const [copied, setCopied] = useState(false);
 const [activeTab, setActiveTab] = useState<"input"|"output">("input");
 const [isValid, setIsValid] = useState(true);
 const [errorMsg, setErrorMsg] = useState<string | undefined>();

 const current = MODES.find((m) => m.id === mode) ?? MODES[0];

 // Restore from history / share link, switching to the matching mode
 useEffect(() => {
 if (restoredInput) {
 // eslint-disable-next-line react-hooks/set-state-in-effect
 setMode(detectMode(restoredInput));
 setInput(restoredInput);
 }
 }, [restoredInput]);

 // Save workspace snapshot (the tool previously fired events nothing listened to)
 useEffect(() => {
 const handleSave = () => {
 addSnapshot("minifier","CSS / SVG / HTML Minifier", input, output);
 };
 window.addEventListener("save-workspace", handleSave);
 return () => window.removeEventListener("save-workspace", handleSave);
 }, [input, output]);

 // Real-time validation + minification ("copy the compressed output and view the byte savings"),
 // on a deferred copy of the input so large stylesheets never block typing.
 const deferredInput = useDeferredValue(input);
 useEffect(() => {
 const start = performance.now();
 const validation = current.validate(deferredInput);
 if (validation.valid) setOutput(current.minify(deferredInput));
 const ms = performance.now() - start;

 setIsValid(validation.valid);
 setErrorMsg(validation.error);
 onValidationChange(validation.valid, validation.error);
 onStatsChange(deferredInput.length, ms);
 }, [deferredInput, current, onValidationChange, onStatsChange]);

 const handleMinify = () => {
 const start = performance.now();
 try {
 const minified = current.minify(input);
 setOutput(minified);
 setIsValid(true);
 setErrorMsg(undefined);
 onValidationChange(true);
 onLogHistory?.(input);
 setActiveTab("output");
 } catch (err: unknown) {
 const message = err instanceof Error ? err.message :"Minification failed";
 setIsValid(false);
 setErrorMsg(message);
 onValidationChange(false, message);
 }
 onStatsChange(input.length, performance.now() - start);
 };

 // Switching mode loads that mode's sample only when the editor holds a sample or nothing,
 // so pasted code is never thrown away.
 const handleModeChange = (newMode: MinifyMode) => {
 if (newMode === mode) return;
 setMode(newMode);
 if (!input.trim() || SAMPLES.has(input)) {
 setInput(MODES.find((m) => m.id === newMode)?.sample ??"");
 }
 setOutput("");
 };

 const handleCopy = () => {
 if (!output) return;
 navigator.clipboard?.writeText(output).catch(() => {});
 setCopied(true);
 setTimeout(() => setCopied(false), 1500);
 };

 // Real UTF-8 byte counts, recomputed only when the texts change
 const inputBytes = useMemo(() => byteLength(deferredInput), [deferredInput]);
 const outputBytes = useMemo(() => byteLength(output), [output]);
 const savedBytes = Math.max(0, inputBytes - outputBytes);
 const savingsPercent = inputBytes > 0 && outputBytes > 0 ? ((savedBytes / inputBytes) * 100).toFixed(1) :"0";

 const editorLang = current.editorLang;
 const modeLabel = current.label;

 return (
 <div className="flex flex-col h-full bg-white w-full overflow-x-hidden">
 {/* Tool Header */}
 <ToolHeader
 icon={getToolIcon("minifier")}
 title="CSS, SVG & HTML Minifier"
 utilities={<ShareMenu toolSlug="minifier" data={input} imageCode={output || input} imageLanguage={editorLang} />}
 options={<>
 {/* Mode switch */}
 <div className={segmentTrack} role="group" aria-label="Input type">
 {MODES.map((m) => (
 <button
 key={m.id}
 type="button"
 aria-pressed={mode === m.id}
 onClick={() => handleModeChange(m.id)}
 className={segmentBtn(mode === m.id)}
 >
 {m.label}
 </button>
 ))}
 </div>

 {/* Compression savings badge */}
 {output && (
 <span className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md bg-zinc-100 px-2 font-mono text-xs text-zinc-700" title={`${inputBytes} B → ${outputBytes} B`}>
 <Check className="size-3.5" strokeWidth={ICON_STROKE} aria-hidden="true"/>
 −{savedBytes} B ({savingsPercent}%)
 </span>
 )}
 </>}
 actions={
 /* Action Button */
 <button
 onClick={handleMinify}
 disabled={!isValid || !input.trim()}
 className={btnPrimary}
 >
 <Minimize2 {...iconProps}/>
 <span>Minify {modeLabel}</span>
 </button>
 }
 />

 {/* Mobile Segmented Tab Control */}
 <MobilePaneTabs
 tabs={[{ id:"input", label:<>Raw {modeLabel} Input</>}, { id:"output", label:"Minified Output"}]}
 active={activeTab}
 onChange={setActiveTab}
 />

 {/* Dual Editors */}
 <div className="flex-1 flex flex-col md:flex-row overflow-hidden w-full max-w-full">
 {/* Left: Input */}
 <div className={cn("flex-1 border-r-0 md:border-r border-b md:border-b-0 border-zinc-200 flex flex-col min-w-0 w-full overflow-x-hidden", activeTab !=="input"&&"hidden md:flex")}>
 <PaneBar label={<>Raw {modeLabel} Input</>}>
 <button onClick={() => setInput("")} className={btnIcon} title="Clear input" aria-label="Clear input">
 <Trash2 {...iconProps}/>
 </button>
 </PaneBar>
 <div className="flex-1 relative w-full max-w-full overflow-x-hidden">
 <MonacoEditor
 height="100%"
 defaultLanguage={editorLang}
 language={editorLang}
 value={input}
 onChange={(value) => setInput(value ||"")}
 options={EDITOR_OPTIONS}
 />
 </div>
 <EditorPanelFooter isValid={isValid} errorMessage={errorMsg} />
 </div>

 {/* Right: Output */}
 <div className={cn("flex-1 flex flex-col min-w-0 w-full overflow-x-hidden", activeTab !=="output"&&"hidden md:flex")}>
 <PaneBar label="Minified Output">
 <button onClick={handleCopy} disabled={!output} className={cn(btnGhost, copied &&"text-zinc-900")}>
 {copied ? <Check {...iconProps}/> : <Copy {...iconProps}/>}
 <span>{copied ?"Copied!":"Copy"}</span>
 </button>
 </PaneBar>
 <div className="flex-1 relative w-full max-w-full overflow-x-hidden">
 <MonacoEditor
 height="100%"
 defaultLanguage={editorLang}
 language={editorLang}
 value={output}
 onChange={(value) => setOutput(value ||"")}
 options={EDITOR_OPTIONS}
 />
 </div>
 </div>
 </div>
 </div>
 );
}
