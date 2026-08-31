"use client";

import { useState, useEffect } from "react";
import { MonacoEditor } from "@/components/MonacoEditor";
import { ShareButton } from "@/components/ShareButton";
import { EmbedButton } from "@/components/EmbedButton";
import { ExportImageButton } from "@/components/ExportImageButton";
import { FileCode, Copy, Check } from "lucide-react";
import { addSnapshot } from "@/lib/storage";

interface SvgToJsxToolProps {
  onValidationChange: (isValid: boolean, error?: string) => void;
  onStatsChange: (length: number, execMs: number) => void;
  restoredInput?: string | null;
}

export function SvgToJsxTool({ onValidationChange, onStatsChange, restoredInput }: SvgToJsxToolProps) {
  const [input, setInput] = useState<string>('<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-code"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>');
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (restoredInput) setInput(restoredInput);
  }, [restoredInput]);

  useEffect(() => {
    const handleSave = () => {
      addSnapshot("svg-to-jsx", "SVG to JSX", input, output);
    };
    window.addEventListener("save-workspace", handleSave);
    return () => window.removeEventListener("save-workspace", handleSave);
  }, [input, output]);

  useEffect(() => {
    const start = performance.now();
    try {
      let jsx = input;
      
      // Replace class with className
      jsx = jsx.replace(/\bclass=/g, 'className=');
      
      // Convert dash-case attributes to camelCase
      const dashAttributes = [
        'stroke-width', 'stroke-linecap', 'stroke-linejoin', 
        'stroke-dasharray', 'stroke-dashoffset', 'stroke-miterlimit', 
        'stroke-opacity', 'fill-rule', 'fill-opacity', 'clip-rule', 'clip-path'
      ];
      dashAttributes.forEach(attr => {
        const camel = attr.replace(/-([a-z])/g, g => g[1].toUpperCase());
        jsx = jsx.replace(new RegExp(attr + '=', 'g'), camel + '=');
      });

      const componentCode = `export function SvgComponent(props) {\n  return (\n    ${jsx.trim().replace(/\n/g, '\n    ')}\n  );\n}`;
      
      setOutput(componentCode);
      onValidationChange(true);
      onStatsChange(input.length, performance.now() - start);
    } catch (err) {
      onValidationChange(false, (err as Error).message);
    }
  }, [input, onValidationChange, onStatsChange]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-white w-full overflow-x-hidden">
      <div className="min-h-14 border-b border-[#e2e8f0] flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-2 px-3 md:px-4 bg-[#f8fafc] shrink-0">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-zinc-900" />
          <h1 className="text-sm font-semibold text-zinc-800">SVG to JSX</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <ExportImageButton code={output || input} language="typescript" />
          <EmbedButton toolSlug="svg-to-jsx" data={input} />
          <ShareButton toolSlug="svg-to-jsx" data={input} />
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        <div className="flex-1 flex flex-col min-h-[300px] md:min-h-0 border-b md:border-b-0 md:border-r border-zinc-200">
          <div className="h-8 bg-zinc-50 border-b border-zinc-200 flex items-center px-3 shrink-0">
            <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Raw SVG</span>
          </div>
          <div className="flex-1 relative">
            <MonacoEditor
              language="html"
              value={input}
              onChange={(v) => setInput(v || "")}
              options={{ minimap: { enabled: false }, lineNumbers: 'on' }}
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-[300px] md:min-h-0 relative bg-[#fafafa]">
          <div className="h-8 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between px-3 shrink-0">
            <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">JSX Component</span>
            <button 
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 hover:text-zinc-800 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <div className="flex-1 relative">
            <MonacoEditor
              language="typescript"
              value={output}
              options={{ readOnly: true, minimap: { enabled: false } }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
