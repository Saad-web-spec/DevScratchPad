"use client";

import { useState, useEffect, useDeferredValue } from"react";
import { MonacoEditor } from"@/components/MonacoEditor";
import { ShareMenu } from "@/components/ShareMenu";
import { formatXml, minifyXml, validateXml } from"@/lib/tools/xml";
import { Play, Copy, Trash2, Minimize2, Check } from"lucide-react";
import { cn } from"@/lib/utils";
import { addSnapshot } from"@/lib/storage";
import { ToolHeader, PaneBar, MobilePaneTabs, EDITOR_OPTIONS, btnPrimary, btnSecondary, btnGhost, btnIcon, selectBase, iconProps } from "@/components/tools/ToolChrome";
import { getToolIcon } from "@/components/layout/toolIcons";
import { EditorPanelFooter } from '@/components/layout/StatusBar';

interface XmlFormatterToolProps {
 onValidationChange: (isValid: boolean, error?: string, line?: number) => void;
 onStatsChange: (length: number, execMs: number) => void;
 onLogHistory?: (input: string) => void;
 restoredInput?: string | null;
}

const DEFAULT_XML = `<?xml version="1.0" encoding="UTF-8"?>
<note>
  <to>Tove</to>
  <from>Jani</from>
  <heading>Reminder</heading>
  <body>Don't forget me this weekend!</body>
</note>`;

const PANE_TABS = [
 { id:"input"as const, label:"Input XML"},
 { id:"output"as const, label:"Formatted Output"},
];

export function XmlFormatterTool({
 onValidationChange,
 onStatsChange,
 onLogHistory,
 restoredInput,
}: XmlFormatterToolProps) {
 const [input, setInput] = useState<string>(DEFAULT_XML);
 const [output, setOutput] = useState<string>("");
 const [indent, setIndent] = useState<number>(2);
 const [copied, setCopied] = useState(false);
 const [activeTab, setActiveTab] = useState<"input"|"output">("input");
 const [isValid, setIsValid] = useState(true);
 const [errorMsg, setErrorMsg] = useState<string | undefined>();
 const [errorLine, setErrorLine] = useState<number | undefined>();

 // Save workspace snapshot
 useEffect(() => {
 const handleSave = () => {
 addSnapshot("xml-formatter","XML Formatter", input, output);
 };
 window.addEventListener("save-workspace", handleSave);
 return () => window.removeEventListener("save-workspace", handleSave);
 }, [input, output]);

 // Restore from history
 useEffect(() => {
 if (restoredInput) setInput(restoredInput);
 }, [restoredInput]);

 // Real-time validation + auto-format ("the engine will parse and format the DOM tree").
 // Uses a deferred copy of the input so DOMParser never runs on the keystroke path.
 const deferredInput = useDeferredValue(input);
 useEffect(() => {
 const start = performance.now();
 const { valid, error, line } = validateXml(deferredInput);
 if (valid) setOutput(deferredInput.trim() ? formatXml(deferredInput, indent) :"");
 const ms = performance.now() - start;

 setIsValid(valid);
 setErrorMsg(error);
 setErrorLine(line);
 onValidationChange(valid, error, line);
 onStatsChange(deferredInput.length, ms);
 }, [deferredInput, indent, onValidationChange, onStatsChange]);

 const handleFormat = () => {
 const start = performance.now();
 const formatted = formatXml(input, indent);
 setOutput(formatted);
 onValidationChange(true);
 onLogHistory?.(input);
 setActiveTab("output");
 onStatsChange(input.length, performance.now() - start);
 };

 const handleMinify = () => {
 const start = performance.now();
 const minified = minifyXml(input);
 setOutput(minified);
 onLogHistory?.(input);
 setActiveTab("output");
 onStatsChange(input.length, performance.now() - start);
 };

 const handleCopy = () => {
 if (!output) return;
 navigator.clipboard?.writeText(output).catch(() => {});
 setCopied(true);
 setTimeout(() => setCopied(false), 1500);
 };

 const canRun = isValid && input.trim().length > 0;

 return (
 <div className="flex flex-col h-full bg-white w-full overflow-x-hidden">
 {/* Tool Header */}
 <ToolHeader
 icon={getToolIcon("xml-formatter")}
 title="XML Formatter & Minifier"
 utilities={<ShareMenu toolSlug="xml-formatter" data={input} imageCode={output || input} imageLanguage="xml" />}
 options={
 <select
 value={indent}
 onChange={(e) => setIndent(Number(e.target.value))}
 className={selectBase}
 aria-label="Indentation"
 >
 <option value={2}>2 Spaces</option>
 <option value={4}>4 Spaces</option>
 </select>
 }
 actions={<>
 <button onClick={handleMinify} disabled={!canRun} className={btnSecondary} title="Strip whitespace between tags">
 <Minimize2 {...iconProps}/>
 <span>Minify</span>
 </button>
 <button onClick={handleFormat} disabled={!canRun} className={btnPrimary}>
 <Play {...iconProps}/>
 <span>Format</span>
 </button>
 </>}
 />

 {/* Mobile Segmented Tab Control */}
 <MobilePaneTabs tabs={PANE_TABS} active={activeTab} onChange={setActiveTab} />

 {/* Dual Editors */}
 <div className="flex-1 flex flex-col md:flex-row overflow-hidden w-full max-w-full">
 {/* Left: Input */}
 <div className={cn("flex-1 border-r-0 md:border-r border-b md:border-b-0 border-zinc-200 flex flex-col min-w-0 w-full overflow-x-hidden", activeTab !=="input"&&"hidden md:flex")}>
 <PaneBar label="Input XML">
 <button onClick={() => setInput("")} className={btnIcon} title="Clear input" aria-label="Clear input">
 <Trash2 {...iconProps}/>
 </button>
 </PaneBar>
 <div className="flex-1 relative w-full max-w-full overflow-x-hidden">
 <MonacoEditor
 height="100%"
 defaultLanguage="xml"
 value={input}
 onChange={(value) => setInput(value ||"")}
 options={EDITOR_OPTIONS}
 />
 </div>
 <EditorPanelFooter isValid={isValid} errorMessage={errorMsg} errorLine={typeof errorLine !== 'undefined' ? errorLine : undefined} />
 </div>

 {/* Right: Output */}
 <div className={cn("flex-1 flex flex-col min-w-0 w-full overflow-x-hidden", activeTab !=="output"&&"hidden md:flex")}>
 <PaneBar label="Formatted Output">
 <button onClick={handleCopy} disabled={!output} className={cn(btnGhost, copied &&"text-zinc-900")}>
 {copied ? <Check {...iconProps}/> : <Copy {...iconProps}/>}
 <span>{copied ?"Copied!":"Copy"}</span>
 </button>
 </PaneBar>
 <div className="flex-1 relative w-full max-w-full overflow-x-hidden">
 <MonacoEditor
 height="100%"
 defaultLanguage="xml"
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
