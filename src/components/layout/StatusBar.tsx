"use client";

import { AlertCircle, CheckCircle2, Check, XCircle } from"lucide-react";

export function cleanErrorMessage(msg: string): string {
 if (!msg) return"Syntax Error";
 
 // Clean JSON V8 errors
 let cleaned = msg.replace(/^SyntaxError:\s*/, '');
 cleaned = cleaned.replace(/Unexpected non-whitespace character after JSON at position \d+/, 'Multiple JSON root objects detected');
 cleaned = cleaned.replace(/Unexpected token (.) in JSON at position \d+/, 'Unexpected token $1');
 cleaned = cleaned.replace(/Expected double-quoted property name in JSON at position \d+/, 'Expected double-quoted property name');
 
 // Strip GraphQL/XML specific verbose prefixes if any
 cleaned = cleaned.replace(/^Syntax Error: /, '');
 cleaned = cleaned.replace(/GraphQL request \(\d+:\d+\)\s*/, '');

 return cleaned.length > 60 ? cleaned.substring(0, 60) + '...' : cleaned;
}

interface EditorPanelFooterProps {
 isValid: boolean;
 errorMessage?: string;
 errorLine?: number;
 errorCol?: number;
}

export function EditorPanelFooter({
 isValid,
 errorMessage,
 errorLine,
 errorCol,
}: EditorPanelFooterProps) {
 const shortMessage = errorMessage ? cleanErrorMessage(errorMessage) : 'Syntax Error';
 const line = errorLine || 1;
 const col = errorCol || 1;

 return (
 <div className="h-7 bg-zinc-50 border-t border-zinc-200 px-3 flex items-center justify-between text-xs font-mono shrink-0 w-full z-10">
 {isValid ? (
 <span className="flex items-center gap-1.5 text-zinc-400">
 <CheckCircle2 className="w-3.5 h-3.5 text-zinc-900"/> Ready
 </span>
 ) : (
 <span className="flex items-center gap-1.5 text-red-400 font-medium truncate max-w-md">
 <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0"/>
 Line {line}, Col {col}: {shortMessage}
 </span>
 )}
 </div>
 );
}

export function FloatingErrorBadge({ errorMessage }: { errorMessage?: string }) {
 if (!errorMessage) return null;
 const shortMessage = cleanErrorMessage(errorMessage);
 return (
 <div className="absolute bottom-3 left-3 bg-red-950/80 border border-red-900/60 text-red-300 text-xs font-mono px-3 py-1.5 rounded-lg backdrop-blur-md shadow-none flex items-center gap-2 z-10 pointer-events-none">
 <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500"/>
 <span className="truncate max-w-[250px]">{shortMessage}</span>
 </div>
 );
}

// Deprecated: Keeping for backward compatibility with tools that haven't migrated yet
export function StatusBar({
 isValid,
 errorLine,
 inputLength,
 executionMs,
}: {
 isValid: boolean;
 errorLine?: number;
 inputLength: number;
 executionMs: number;
}) {
 return (
 <div className="h-8 border-t border-zinc-200 ] bg-zinc-50 ] flex items-center justify-between px-4 shrink-0 transition-colors">
 <div className="flex items-center gap-4 min-w-0 flex-1">
 {isValid ? (
 <div className="flex items-center gap-2">
 <CheckCircle2 className="w-3.5 h-3.5 text-zinc-900"/>
 <span className="text-xs text-zinc-600 font-medium">Ready</span>
 </div>
 ) : (
 <div className="bg-red-500/10 text-red-600 border border-red-500/20 px-2 py-0.5 rounded text-xs flex items-center">
 Line {errorLine || 1}, Col 1
 </div>
 )}
 </div>

 <div className="flex items-center gap-4 text-xs text-zinc-500">
 <div>{inputLength.toLocaleString()} chars</div>
 <div>{executionMs.toFixed(2)} ms</div>
 <div>UTF-8</div>
 </div>
 </div>
 );
}

export function ValidationBadge({ isValid }: { isValid: boolean }) {
 return isValid ? (
 <div className="bg-zinc-100 text-zinc-700 border border-zinc-200 px-2 py-0.5 rounded-md text-xs font-mono flex items-center gap-1">
 <Check className="w-3 h-3 text-zinc-900"/>
 <span>Valid</span>
 </div>
 ) : (
 <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-600 border border-red-500/20">
 <XCircle className="w-3.5 h-3.5 text-red-500"/>
 <span>Invalid</span>
 </div>
 );
}
