"use client";

import { useState, useRef } from"react";
import { toPng, toBlob } from"html-to-image";
import { Download, X, Image as ImageIcon, Copy, Check } from"lucide-react";
import { MonacoEditor } from"@/components/MonacoEditor";
import { cn } from"@/lib/utils";

interface ExportImageModalProps {
 isOpen: boolean;
 onClose: () => void;
 code: string;
 language: string;
}

const BACKGROUNDS = [
 { name:"Purple/Pink", class:"bg-gradient-to-br from-purple-500 via-fuchsia-500 to-pink-500"},
 { name:"Sunset", class:"bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500"},
 { name:"Emerald", class:"bg-gradient-to-br from-emerald-400 to-cyan-400"},
 { name:"Ocean", class:"bg-gradient-to-br from-cyan-400 to-blue-500"},
 { name:"Obsidian", class:"bg-gradient-to-br from-slate-800 to-zinc-900"},
 { name:"Solid Dark", class:"bg-[#09090B]"},
];

const SYNTAX_THEMES = [
 { name:"GitHub Light", bg:"#FFFFFF", headerBg:"#F6F8FA", textClass:"text-zinc-600", themeId:"vs"},
 { name:"One Dark Pro", bg:"#282C34", headerBg:"#21252B", textClass:"text-zinc-900/60", themeId:"devscratchpad-dark"},
 { name:"Dark Slate", bg:"#121215", headerBg:"#09090B", textClass:"text-zinc-900/60", themeId:"devscratchpad-dark"},
 { name:"Dracula", bg:"#282A36", headerBg:"#21222C", textClass:"text-zinc-900/60", themeId:"devscratchpad-dark"},
 { name:"GitHub Dark", bg:"#0D1117", headerBg:"#010409", textClass:"text-zinc-900/60", themeId:"devscratchpad-dark"},
 { name:"Nord", bg:"#2E3440", headerBg:"#3B4252", textClass:"text-zinc-900/60", themeId:"devscratchpad-dark"},
];

const PADDINGS = [
 { label:"16px", value:"p-3.5 sm:p-4 pb-7 sm:pb-8"},
 { label:"32px", value:"p-5 sm:p-8 pb-8 sm:pb-10"},
 { label:"64px", value:"p-7 sm:p-12 pb-10 sm:pb-14"},
];

export function ExportImageModal({ isOpen, onClose, code, language }: ExportImageModalProps) {
 const [activeBg, setActiveBg] = useState(BACKGROUNDS[0]);
 const [activeTheme, setActiveTheme] = useState(SYNTAX_THEMES[0]); // Default GitHub Light
 const [activePadding, setActivePadding] = useState(PADDINGS[1]); // Default 32px
 const [showLineNumbers, setShowLineNumbers] = useState(false);
 const [isExporting, setIsExporting] = useState(false);
 const [copied, setCopied] = useState(false);
 
 const captureRef = useRef<HTMLDivElement>(null);

 if (!isOpen) return null;

 const prepareExport = async () => {
 if (!captureRef.current) return null;
 setIsExporting(true);
 // Wait for Monaco to fully render
 await new Promise((resolve) => setTimeout(resolve, 400));
 return captureRef.current;
 };

 const handleDownload = async () => {
 const el = await prepareExport();
 if (!el) return;
 try {
 const dataUrl = await toPng(el, {
 quality: 1,
 pixelRatio: 2,
 skipFonts: true,
 });
 const link = document.createElement("a");
 link.download = `snippet-${language ||"code"}.png`;
 link.href = dataUrl;
 link.click();
 } catch (err) {
 console.error("Failed to download image", err);
 alert("Failed to export image. Please try again.");
 } finally {
 setIsExporting(false);
 }
 };

 const handleCopyClipboard = async () => {
 const el = await prepareExport();
 if (!el) return;
 try {
 const blob = await toBlob(el, {
 quality: 1,
 pixelRatio: 2,
 skipFonts: true,
 });
 if (blob) {
 await navigator.clipboard.write([
 new ClipboardItem({"image/png": blob })
 ]);
 setCopied(true);
 setTimeout(() => setCopied(false), 2000);
 }
 } catch (err) {
 console.error("Failed to copy image", err);
 alert("Failed to copy image to clipboard.");
 } finally {
 setIsExporting(false);
 }
 };

 const lineCount = (code ||"").split("\n").length;
 const editorHeight = Math.max(50, Math.min(lineCount * 21 + 18, 460));

 const getExtension = () => {
 switch (language) {
 case"json": return"json";
 case"javascript": return"js";
 case"typescript": return"ts";
 case"sql": return"sql";
 case"xml": return"xml";
 case"yaml": return"yaml";
 case"markdown": return"md";
 case"css": return"css";
 case"graphql": return"gql";
 case"bash": return"sh";
 default: return"txt";
 }
 };

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
 {/* Dynamic override for Monaco transparent background */}
 <style>{`
 .export-monaco-container .monaco-editor,
 .export-monaco-container .monaco-editor-background,
 .export-monaco-container .monaco-editor .margin {
 background-color: transparent !important;
 }
 `}</style>
 
 <div className="bg-white rounded-2xl shadow-none w-[95vw] sm:w-[90vw] md:w-full max-w-5xl max-h-[92vh] sm:max-h-[90vh] flex flex-col border border-zinc-200 overflow-hidden animate-in zoom-in-95 duration-150">
 {/* Header */}
 <div className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-3.5 border-b border-zinc-200 shrink-0">
 <div className="flex items-center gap-2.5">
 <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
 <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5"/>
 </div>
 <h2 className="font-semibold text-sm sm:text-base text-zinc-900">Export Code Snippet</h2>
 </div>
 <button
 onClick={onClose}
 className="p-1.5 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
 aria-label="Close modal"
 >
 <X className="w-5 h-5"/>
 </button>
 </div>

 {/* Content Body - Responsive flex */}
 <div className="flex flex-col md:flex-row flex-1 overflow-y-auto md:overflow-hidden min-h-0">
 {/* Main Preview Area */}
 <div className="flex-1 p-3 sm:p-6 md:p-8 bg-zinc-100 flex flex-col items-center justify-center min-h-[220px] sm:min-h-[280px] md:overflow-auto overflow-hidden">
 <div className="w-full max-w-2xl flex items-center justify-center">
 {/* Capture Target */}
 <div
 ref={captureRef}
 className={cn(
"w-full flex flex-col items-center justify-center transition-all duration-300 relative rounded-xl select-none",
 activeBg.class,
 activePadding.value
 )}
 >
 {/* Code Window Container */}
 <div 
 className="w-full rounded-xl shadow-none shadow-black/40 border border-white/10 overflow-hidden flex flex-col transition-colors duration-200"
 style={{ backgroundColor: activeTheme.bg }}
 >
 {/* Window Header */}
 <div 
 className="h-9 sm:h-10 px-3 sm:px-4 flex items-center justify-between relative shrink-0 border-b border-black/5"
 style={{ backgroundColor: activeTheme.headerBg }}
 >
 {/* macOS Dots */}
 <div className="flex items-center gap-1.5 shrink-0">
 <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#FF5F56]"/>
 <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#FFBD2E]"/>
 <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#27C93F]"/>
 </div>
 {/* Filename Badge */}
 <div className={cn("px-2 py-0.5 rounded-md text-[11px] sm:text-xs font-mono tracking-wide truncate max-w-[140px] sm:max-w-[200px]", activeTheme.textClass)}>
 {`data.${getExtension()}`}
 </div>
 {/* Spacer for symmetrical centering */}
 <div className="w-8 sm:w-12 shrink-0"/>
 </div>
 
 {/* Editor Area */}
 <div className="p-3 sm:p-4 pt-2 sm:pt-2.5 pb-4 sm:pb-5 export-monaco-container w-full">
 <div className="pointer-events-none w-full"style={{ height: `${editorHeight}px` }}>
 <MonacoEditor
 language={language}
 value={code}
 theme={activeTheme.themeId}
 options={{
 readOnly: true,
 minimap: { enabled: false },
 lineNumbers: showLineNumbers ?"on":"off",
 folding: false,
 scrollBeyondLastLine: false,
 renderLineHighlight:"none",
 hideCursorInOverviewRuler: true,
 overviewRulerBorder: false,
 scrollbar: { vertical: 'hidden', horizontal: 'hidden' },
 fontSize: 13,
 lineHeight: 21,
 fontFamily:"'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
 padding: { top: 2, bottom: 2 },
 wordWrap:"on",
 }}
 />
 </div>
 </div>
 </div>

 {/* Brand Watermark - Positioned in canvas bottom corner */}
 <div className="absolute bottom-2 sm:bottom-2.5 right-3 sm:right-4 text-[10px] sm:text-xs font-mono text-zinc-900/50 tracking-wider select-none pointer-events-none drop-shadow-none">
 devscratchpad.tech
 </div>
 </div>
 </div>
 </div>

 {/* Sidebar Controls */}
 <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-zinc-200 p-4 sm:p-5 flex flex-col gap-4 sm:gap-5 bg-white shrink-0 md:overflow-y-auto">
 
 {/* Background Selector */}
 <div>
 <label className="text-xs font-semibold text-zinc-700 uppercase tracking-wider block mb-2">
 Canvas Background
 </label>
 <div className="grid grid-cols-3 gap-2">
 {BACKGROUNDS.map((bg) => (
 <button
 key={bg.name}
 onClick={() => setActiveBg(bg)}
 title={bg.name}
 className={cn(
"h-8 sm:h-9 rounded-lg transition-all hover:scale-105 active:scale-95 border",
 bg.class,
 activeBg.name === bg.name 
 ?"ring-2 ring-indigo-500 ring-offset-2 border-transparent shadow-none"
 :"border-zinc-200"
 )}
 aria-label={bg.name}
 />
 ))}
 </div>
 </div>

 {/* Syntax Theme */}
 <div>
 <label className="text-xs font-semibold text-zinc-700 uppercase tracking-wider block mb-2">
 Syntax Theme (Window)
 </label>
 <select 
 value={activeTheme.name}
 onChange={(e) => setActiveTheme(SYNTAX_THEMES.find(t => t.name === e.target.value) || SYNTAX_THEMES[0])}
 className="w-full h-9 bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs sm:text-sm rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
 >
 {SYNTAX_THEMES.map((theme) => (
 <option key={theme.name} value={theme.name}>{theme.name}</option>
 ))}
 </select>
 </div>

 {/* Padding */}
 <div>
 <label className="text-xs font-semibold text-zinc-700 uppercase tracking-wider block mb-2">
 Canvas Padding
 </label>
 <div className="flex bg-zinc-100 p-1 rounded-lg border border-zinc-200">
 {PADDINGS.map((pad) => (
 <button
 key={pad.label}
 onClick={() => setActivePadding(pad)}
 className={cn(
"flex-1 py-1 sm:py-1.5 text-xs font-medium rounded-md transition-colors text-center",
 activePadding.label === pad.label
 ?"bg-white text-zinc-900 shadow-none border border-zinc-200"
 :"text-zinc-500 hover:text-zinc-700 border border-transparent"
 )}
 >
 {pad.label}
 </button>
 ))}
 </div>
 </div>

 {/* Line Numbers Toggle */}
 <div className="flex items-center justify-between py-1">
 <span className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">
 Line Numbers
 </span>
 <button
 type="button"
 role="switch"
 aria-checked={showLineNumbers}
 aria-label="Toggle line numbers"
 onClick={() => setShowLineNumbers(!showLineNumbers)}
 className={cn(
"w-10 h-5.5 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
 showLineNumbers ?"bg-indigo-600":"bg-zinc-300"
 )}
 >
 <div className={cn(
"w-4 h-4 bg-white rounded-full absolute top-0.75 transition-transform shadow-none",
 showLineNumbers ?"translate-x-5":"translate-x-0.75"
 )} />
 </button>
 </div>

 {/* Export Buttons */}
 <div className="mt-auto pt-3 sm:pt-5 flex flex-col gap-2.5">
 <button
 onClick={handleCopyClipboard}
 disabled={isExporting}
 className="w-full h-9 sm:h-10 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-200 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 text-xs sm:text-sm active:scale-[0.99]"
 >
 {copied ? <Check className="w-4 h-4 text-emerald-500"/> : <Copy className="w-4 h-4 text-zinc-500"/>}
 <span>{copied ?"Copied to Clipboard!":"Copy PNG to Clipboard"}</span>
 </button>
 
 <button
 onClick={handleDownload}
 disabled={isExporting}
 className="w-full h-9 sm:h-10 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-zinc-900 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-none text-xs sm:text-sm active:scale-[0.99]"
 >
 {isExporting ? (
 <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
 ) : (
 <Download className="w-4 h-4"/>
 )}
 <span>{isExporting ?"Exporting...":"Download PNG"}</span>
 </button>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
