"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import {
  UploadCloud,
  FileCode2,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileText,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Code,
  Sliders,
} from "lucide-react";
import { convertRawRulesToIR, ParsedRulesIR } from "@/app/claude-skills/lib/rulesConverter";
import { encodeStudioState } from "@/app/claude-skills/lib/stateSharing";
import { buildRuleContent, OutputFormat } from "@/app/claude-skills/lib/ruleGenerator";
import { WindsurfIcon, OpenAIIcon, GeminiIcon, CopilotIcon } from "@/components/icons/AssistantBrandIcons";

export function ConverterClient() {
  const [inputText, setInputText] = useState("");
  const [fileName, setFileName] = useState("");
  const [parsedResult, setParsedResult] = useState<ParsedRulesIR | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [targetFormat, setTargetFormat] = useState<OutputFormat>("skill_md");
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextChange = (text: string, sourceName = fileName) => {
    setInputText(text);
    if (text.trim().length > 20) {
      try {
        const ir = convertRawRulesToIR(text, sourceName);
        setParsedResult(ir);
      } catch {
        setParsedResult(null);
      }
    } else {
      setParsedResult(null);
    }
  };

  const handleFileUpload = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = (e.target?.result as string) || "";
      handleTextChange(content, file.name);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Build converted rule string based on selected target format
  const convertedOutput = React.useMemo(() => {
    if (!parsedResult) return "";
    return buildRuleContent({
      targetFormat,
      skillName: parsedResult.skillName || "custom-rule",
      skillTitle: parsedResult.skillTitle || "Custom Project Rules",
      description: parsedResult.description || "Project architectural rules and guidelines.",
      role: parsedResult.role || "Senior Systems Architect",
      framework: parsedResult.framework || "Modern Framework",
      language: parsedResult.language || "TypeScript",
      styling: parsedResult.styling || "Tailwind CSS",
      database: parsedResult.database || "None",
      philosophy: parsedResult.philosophy || "pragmatic",
      behaviors: parsedResult.behaviors || [],
      conventions: parsedResult.conventions || [],
      procedures: parsedResult.procedures || "",
      customDirectives: parsedResult.customDirectives || "",
      exampleGood: parsedResult.exampleGood || "",
      exampleBad: parsedResult.exampleBad || "",
      globPattern: parsedResult.globPattern || "**/*",
      alwaysApply: parsedResult.alwaysApply || false,
    });
  }, [parsedResult, targetFormat]);

  const handleCopy = async () => {
    if (!convertedOutput) return;
    try {
      await navigator.clipboard.writeText(convertedOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Generate URL hash state to open directly in full studio
  const studioHashUrl = React.useMemo(() => {
    if (!parsedResult) return "/ai-skill-studio";
    try {
      const hash = encodeStudioState({
        skillName: parsedResult.skillName,
        skillTitle: parsedResult.skillTitle,
        description: parsedResult.description,
        role: parsedResult.role,
        framework: parsedResult.framework,
        language: parsedResult.language,
        styling: parsedResult.styling,
        database: parsedResult.database,
        philosophy: parsedResult.philosophy,
        behaviors: parsedResult.behaviors,
        conventions: parsedResult.conventions,
        procedures: parsedResult.procedures,
        customDirectives: parsedResult.customDirectives,
        exampleGood: parsedResult.exampleGood,
        exampleBad: parsedResult.exampleBad,
        globPattern: parsedResult.globPattern,
        alwaysApply: parsedResult.alwaysApply,
        format: targetFormat,
      });
      return `/ai-skill-studio#${hash}`;
    } catch {
      return "/ai-skill-studio";
    }
  }, [parsedResult, targetFormat]);

  const loadExample = () => {
    const sample = `# Legacy Cursor Rules
You are a senior full-stack Next.js 15 developer.
- Never use 'any' types in TypeScript.
- Always use Server Actions for mutations with Zod validation.
- Do not import client components into server components unnecessarily.
- Maintain strict error boundaries on route segments.

### Anti-Pattern
\`\`\`typescript
export default function BadPage() {
  // Never do loose fetching in client component without caching
  const [data, setData] = useState<any>(null);
}
\`\`\`

### Production Pattern
\`\`\`typescript
"use server";
import { z } from "zod";
export async function createItem(data: FormData) {
  // Validated Server Action
}
\`\`\`
`;
    handleTextChange(sample, ".cursorrules");
  };

  return (
    <div className="w-full bg-white dark:bg-[#121316] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Top Banner */}
      <div className="px-5 py-3.5 bg-orange-50/80 dark:bg-orange-950/20 border-b border-orange-200/80 dark:border-orange-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-orange-900 dark:text-orange-300">
          <ShieldCheck className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
          <span>100% Client-Side Privacy: Your rules and code are parsed in browser memory and never sent to any server.</span>
        </div>
        <button
          type="button"
          onClick={loadExample}
          className="text-xs font-semibold text-orange-700 dark:text-orange-400 hover:underline inline-flex items-center gap-1 self-start sm:self-auto cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Try Sample .cursorrules</span>
        </button>
      </div>

      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Dropzone */}
        <div className="lg:col-span-6 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-orange-600" />
              <span>Paste or Drop Rulebook File</span>
            </label>
            <span className="text-[11px] text-zinc-500 font-mono">
              .cursorrules, .mdc, CLAUDE.md, markdown
            </span>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-orange-500 bg-orange-50/40 dark:bg-orange-950/20"
                : "border-zinc-300 dark:border-zinc-700 hover:border-orange-400 bg-zinc-50/50 dark:bg-zinc-900/40"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
              }}
              className="hidden"
              accept=".mdc,.md,.txt,.cursorrules,.*"
            />
            <UploadCloud className="w-6 h-6 mx-auto mb-1 text-zinc-400 dark:text-zinc-500" />
            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              {fileName ? `Loaded: ${fileName}` : "Click to browse or drop file here"}
            </p>
            <p className="text-[10px] text-zinc-500 mt-0.5">Supports .cursorrules, .mdc, CLAUDE.md, AGENTS.md, or system prompt text</p>
          </div>

          <textarea
            value={inputText}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Or paste legacy rulebook content directly here...&#10;&#10;e.g.&#10;You are an expert Next.js 15 developer...&#10;- Never use loose 'any'&#10;- Prefer Server Actions with Zod"
            rows={12}
            className="w-full flex-1 p-3.5 font-mono text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 resize-none leading-relaxed"
          />
        </div>

        {/* Right Column: Live Decomposed IR & Export */}
        <div className="lg:col-span-6 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Universal Studio IR & Target Export</span>
            </label>
            {parsedResult && (
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                Source: {parsedResult.detectedSourceFormat}
              </span>
            )}
          </div>

          {parsedResult ? (
            <div className="space-y-3 flex-1 flex flex-col">
              {/* Decomposed Metadata Summary Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-zinc-50 dark:bg-zinc-900/60 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">Persona</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate block">
                    {parsedResult.role || "Architect"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">Framework</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate block">
                    {parsedResult.framework || "Universal"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">Philosophy</span>
                  <span className="font-semibold text-orange-600 dark:text-orange-400 capitalize block">
                    {parsedResult.philosophy}
                  </span>
                </div>
              </div>

              {/* Target Format Selector */}
              <div>
                <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
                  Convert & Export Into Target Format:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {[
                    { id: "cursor_mdc", label: "Cursor .mdc" },
                    { id: "skill_md", label: "Claude SKILL.md" },
                    { id: "claude_md", label: "CLAUDE.md" },
                    { id: "windsurf_cascade", label: "Windsurf", icon: <WindsurfIcon className="w-3 h-3 text-teal-600 shrink-0" /> },
                    { id: "copilot_instructions", label: "Copilot", icon: <CopilotIcon className="w-3 h-3 text-sky-600 shrink-0" /> },
                    { id: "openai_instructions", label: "OpenAI", icon: <OpenAIIcon className="w-3 h-3 text-purple-600 shrink-0" /> },
                    { id: "gemini_prompts", label: "Gemini", icon: <GeminiIcon className="w-3 h-3 shrink-0" /> },
                    { id: "agents_md", label: "AGENTS.md" },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => setTargetFormat(fmt.id as OutputFormat)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer truncate ${
                        targetFormat === fmt.id
                          ? "bg-orange-600 text-white shadow-xs"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      }`}
                    >
                      {fmt.icon}
                      <span className="truncate">{fmt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Converted Output Code Preview */}
              <div className="relative flex-1 min-h-[220px]">
                <pre className="w-full h-full p-3.5 font-mono text-[11px] leading-relaxed bg-zinc-950 text-zinc-200 rounded-xl border border-zinc-800 overflow-y-auto max-h-[300px] whitespace-pre-wrap select-all">
                  {convertedOutput}
                </pre>
              </div>

              {/* Action Buttons: Copy or Open in Studio */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? "Copied to Clipboard!" : "Copy Converted Rule"}</span>
                </button>

                <Link
                  href={studioHashUrl}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs group"
                >
                  <Sliders className="w-4 h-4" />
                  <span>Customize in AI Skill Studio</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-xl text-center">
              <FileCode2 className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mb-3" />
              <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                Awaiting Rule Input
              </h4>
              <p className="text-xs text-zinc-500 max-w-sm mt-1">
                Paste your legacy <code className="text-xs">.cursorrules</code>, <code className="text-xs">CLAUDE.md</code>, or custom prompt text on the left to deconstruct it into modular rules instantly.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
