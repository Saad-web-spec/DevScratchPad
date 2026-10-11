"use client";

import { useState, useEffect, useDeferredValue } from"react";
import { MonacoEditor } from"@/components/MonacoEditor";
import { ShareMenu } from "@/components/ShareMenu";
import { Play, Copy, Trash2, Check } from"lucide-react";
import { cn } from"@/lib/utils";
import { ToolHeader, PaneBar, MobilePaneTabs, EDITOR_OPTIONS, btnPrimary, btnGhost, btnIcon, iconProps } from "@/components/tools/ToolChrome";
import { getToolIcon } from "@/components/layout/toolIcons";
import { EditorPanelFooter } from '@/components/layout/StatusBar';

/** The graphql package is large; it is fetched once, after the tool has painted. */
type GraphqlLib = typeof import("@/lib/tools/graphql");
let graphqlLibPromise: Promise<GraphqlLib> | null = null;
const loadGraphqlLib = () => (graphqlLibPromise ??= import("@/lib/tools/graphql"));

interface GraphqlFormatterToolProps {
 onValidationChange: (isValid: boolean, error?: string, line?: number) => void;
 onStatsChange: (length: number, execMs: number) => void;
 onLogHistory?: (input: string) => void;
 restoredInput?: string | null;
}

const PANE_TABS = [
 { id:"input"as const, label:"Input Query"},
 { id:"output"as const, label:"Formatted Result"},
];

export function GraphqlFormatterTool({ onValidationChange, onStatsChange, onLogHistory, restoredInput }: GraphqlFormatterToolProps) {
 const [input, setInput] = useState<string>('query {\n  hello\n}');
 const [output, setOutput] = useState<string>("");
 const [copied, setCopied] = useState(false);
 const [activeTab, setActiveTab] = useState<"input"|"output">("input");
 const [isValid, setIsValid] = useState(true);
 const [errorMsg, setErrorMsg] = useState<string | undefined>();
 const [errorLine, setErrorLine] = useState<number | undefined>();
 const [lib, setLib] = useState<GraphqlLib | null>(null);

 useEffect(() => {
 let alive = true;
 loadGraphqlLib().then((mod) => {
 if (alive) setLib(mod);
 });
 return () => {
 alive = false;
 };
 }, []);

 // Dispatch workspace state
 useEffect(() => {
 if (typeof window !=="undefined") {
 window.dispatchEvent(
 new CustomEvent("update-workspace-state", {
 detail: { input, output },
 })
 );
 }
 }, [input, output]);

 // Restore from history
 useEffect(() => {
 if (restoredInput) setInput(restoredInput);
 }, [restoredInput]);

 // Real-time validation + formatting ("validates syntax and applies standard formatting"),
 // on a deferred copy of the input so parsing never blocks typing.
 const deferredInput = useDeferredValue(input);
 useEffect(() => {
 if (!lib) return;
 const start = performance.now();
 if (!deferredInput.trim()) {
 setOutput("");
 setIsValid(true);
 setErrorMsg(undefined);
 setErrorLine(undefined);
 onValidationChange(true);
 onStatsChange(0, 0);
 return;
 }
 const result = lib.formatGraphQL(deferredInput);
 if (result.valid) {
 setOutput(result.formatted ||"");
 setIsValid(true);
 setErrorMsg(undefined);
 setErrorLine(undefined);
 onValidationChange(true);
 } else {
 setIsValid(false);
 setErrorMsg(result.error);
 setErrorLine(result.line);
 onValidationChange(false, result.error, result.line);
 }
 onStatsChange(deferredInput.length, performance.now() - start);
 }, [lib, deferredInput, onValidationChange, onStatsChange]);

 const handleFormat = async () => {
 const start = performance.now();
 try {
 const mod = lib ?? (await loadGraphqlLib());
 const result = mod.formatGraphQL(input);
 if (result.valid) {
 setOutput(result.formatted ||"");
 setIsValid(true);
 setErrorMsg(undefined);
 onValidationChange(true);
 onLogHistory?.(input);
 setActiveTab("output");
 } else {
 setIsValid(false);
 // The footer used to show "invalid" with no message here
 setErrorMsg(result.error);
 onValidationChange(false, result.error);
 }
 } catch (err: unknown) {
 const message = err instanceof Error ? err.message :"Failed to format GraphQL";
 setIsValid(false);
 setErrorMsg(message);
 onValidationChange(false, message);
 }
 onStatsChange(input.length, performance.now() - start);
 };

 const handleCopy = () => {
 if (!output) return;
 navigator.clipboard?.writeText(output).catch(() => {});
 setCopied(true);
 setTimeout(() => setCopied(false), 1500);
 };

 return (
 <div className="flex flex-col h-full bg-white w-full overflow-x-hidden">
 {/* Tool Header */}
 <ToolHeader
 icon={getToolIcon("graphql-formatter")}
 title="GraphQL Formatter"
 utilities={<ShareMenu toolSlug="graphql-formatter" data={input} imageCode={output || input} imageLanguage="graphql" />}
 actions={
 <button onClick={() => void handleFormat()} disabled={!isValid || !input.trim()} className={btnPrimary}>
 <Play {...iconProps}/>
 <span>Format</span>
 </button>
 }
 />

 {/* Mobile Segmented Tab Control */}
 <MobilePaneTabs tabs={PANE_TABS} active={activeTab} onChange={setActiveTab} />

 {/* Dual Editors */}
 <div className="flex-1 flex flex-col md:flex-row overflow-hidden w-full max-w-full">
 {/* Left: Input */}
 <div className={cn("flex-1 border-r-0 md:border-r border-b md:border-b-0 border-zinc-200 flex flex-col min-w-0 w-full overflow-x-hidden", activeTab !=="input"&&"hidden md:flex")}>
 <PaneBar label="Input">
 <button onClick={() => setInput("")} className={btnIcon} title="Clear input" aria-label="Clear input">
 <Trash2 {...iconProps}/>
 </button>
 </PaneBar>
 <div className="flex-1 relative w-full max-w-full overflow-x-hidden">
 <MonacoEditor
 height="100%"
 defaultLanguage="graphql"
 value={input}
 onChange={(value) => setInput(value ||"")}
 options={EDITOR_OPTIONS}
 />
 </div>
 <EditorPanelFooter isValid={isValid} errorMessage={errorMsg} errorLine={errorLine} />
 </div>

 {/* Right: Output */}
 <div className={cn("flex-1 flex flex-col min-w-0 w-full overflow-x-hidden", activeTab !=="output"&&"hidden md:flex")}>
 <PaneBar label="Output">
 <button onClick={handleCopy} disabled={!output} className={cn(btnGhost, copied &&"text-zinc-900")}>
 {copied ? <Check {...iconProps}/> : <Copy {...iconProps}/>}
 <span>{copied ?"Copied!":"Copy"}</span>
 </button>
 </PaneBar>
 <div className="flex-1 relative w-full max-w-full overflow-x-hidden">
 <MonacoEditor
 height="100%"
 defaultLanguage="graphql"
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
