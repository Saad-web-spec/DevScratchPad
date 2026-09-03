"use client";

import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { Copy, Check, Sparkles, FileText, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function AiRulesGeneratorTool() {
  const [copied, setCopied] = useState(false);
  const [format, setFormat] = useState<"cursor" | "claude">("cursor");
  
  // Form State
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [framework, setFramework] = useState("Next.js (App Router)");
  const [language, setLanguage] = useState("TypeScript");
  const [styling, setStyling] = useState("Tailwind CSS");
  
  const [rules, setRules] = useState({
    noAny: true,
    earlyReturns: true,
    functionalComps: true,
    accessibility: false,
    jsdoc: false,
  });
  
  const [customRules, setCustomRules] = useState("");
  const [output, setOutput] = useState("");

  useEffect(() => {
    generateRules();
  }, [projectName, projectDesc, framework, language, styling, rules, customRules, format]);

  const generateRules = () => {
    const title = projectName || "My Project";
    const desc = projectDesc || "A modern web application.";
    
    const ruleList = [];
    if (rules.noAny) ruleList.push("- NEVER use `any` or `@ts-ignore` in TypeScript. Always define proper interfaces or types.");
    if (rules.earlyReturns) ruleList.push("- Use early returns (guard clauses) to avoid deep nesting and improve readability.");
    if (rules.functionalComps) ruleList.push("- Use React functional components and hooks. Do NOT use class components.");
    if (rules.accessibility) ruleList.push("- Ensure strict accessibility (a11y) compliance. Use semantic HTML and appropriate ARIA roles.");
    if (rules.jsdoc) ruleList.push("- Add comprehensive JSDoc comments to all public functions, hooks, and complex logic.");
    
    if (format === "cursor") {
      const cursorContent = `---
description: "Global AI instructions and codebase constraints for ${title}"
globs: ["*"]
alwaysApply: true
---
# ${title} - AI Assistant Rules

## Project Context
${desc}

## Technology Stack
- **Framework:** ${framework}
- **Language:** ${language}
- **Styling:** ${styling}

## Core Conventions
${ruleList.length > 0 ? ruleList.join("\n") : "- Follow standard best practices."}
${customRules ? `\n## Custom Directives\n${customRules}` : ""}
`;
      setOutput(cursorContent);
    } else {
      const claudeContent = `# ${title}

<project_context>
${desc}
</project_context>

<tech_stack>
- Framework: ${framework}
- Language: ${language}
- Styling: ${styling}
</tech_stack>

<rules>
${ruleList.length > 0 ? ruleList.join("\n") : "- Follow standard best practices."}
</rules>
${customRules ? `\n<custom_directives>\n${customRules}\n</custom_directives>` : ""}
`;
      setOutput(claudeContent);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col md:flex-row h-full overflow-hidden bg-white">
      {/* Left Panel: Configuration */}
      <div className="w-full md:w-1/2 flex flex-col border-r border-zinc-200 h-full overflow-y-auto">
        <div className="p-4 sm:p-6 space-y-6">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-500" />
                AI Rules Studio
              </h2>
              <a
                href="/claude-skills"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-md transition-colors"
              >
                <span>Open Standalone Studio →</span>
              </a>
            </div>
            <p className="text-sm text-zinc-500">
              Generate optimized instructions for Claude, Cursor, and AI agents.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Project Name</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., DevScratchpad"
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Project Description</label>
              <textarea
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
                placeholder="What does this project do? (e.g., A client-side developer utility suite)"
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm h-20 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Framework</label>
                <select
                  value={framework}
                  onChange={(e) => setFramework(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-orange-500 bg-white"
                >
                  <option>Next.js (App Router)</option>
                  <option>React (Vite)</option>
                  <option>Vue / Nuxt</option>
                  <option>SvelteKit</option>
                  <option>Node.js / Express</option>
                  <option>Python / Django</option>
                  <option>Go / Fiber</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-orange-500 bg-white"
                >
                  <option>TypeScript</option>
                  <option>JavaScript</option>
                  <option>Python</option>
                  <option>Go</option>
                  <option>Rust</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="text-sm font-medium text-zinc-700 border-b border-zinc-100 pb-2 block">Strict Conventions</label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={rules.noAny} onChange={(e) => setRules(p => ({ ...p, noAny: e.target.checked }))} className="w-4 h-4 text-orange-500 rounded border-zinc-300 focus:ring-orange-500" />
                <span className="text-sm text-zinc-600 group-hover:text-zinc-900 transition-colors">Ban <code className="text-[10px] bg-zinc-100 px-1 rounded">any</code> in TypeScript</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={rules.earlyReturns} onChange={(e) => setRules(p => ({ ...p, earlyReturns: e.target.checked }))} className="w-4 h-4 text-orange-500 rounded border-zinc-300 focus:ring-orange-500" />
                <span className="text-sm text-zinc-600 group-hover:text-zinc-900 transition-colors">Force early returns (guard clauses)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={rules.functionalComps} onChange={(e) => setRules(p => ({ ...p, functionalComps: e.target.checked }))} className="w-4 h-4 text-orange-500 rounded border-zinc-300 focus:ring-orange-500" />
                <span className="text-sm text-zinc-600 group-hover:text-zinc-900 transition-colors">Strict functional components & hooks</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={rules.accessibility} onChange={(e) => setRules(p => ({ ...p, accessibility: e.target.checked }))} className="w-4 h-4 text-orange-500 rounded border-zinc-300 focus:ring-orange-500" />
                <span className="text-sm text-zinc-600 group-hover:text-zinc-900 transition-colors">Enforce Web Accessibility (a11y)</span>
              </label>
            </div>

            <div className="space-y-2 pt-2 pb-8">
              <label className="text-sm font-medium text-zinc-700">Custom Instructions</label>
              <textarea
                value={customRules}
                onChange={(e) => setCustomRules(e.target.value)}
                placeholder="Add any specific forbidden patterns or architectural guidelines..."
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Output */}
      <div className="w-full md:w-1/2 flex flex-col h-full bg-zinc-50 border-t md:border-t-0 border-zinc-200">
        <div className="h-12 border-b border-zinc-200 flex items-center justify-between px-2 shrink-0 bg-white">
          <div className="flex p-1 bg-zinc-100 rounded-md">
            <button
              onClick={() => setFormat("cursor")}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded transition-all flex items-center gap-1.5",
                format === "cursor" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
              )}
            >
              <Code2 className="w-3.5 h-3.5" /> .cursorrules
            </button>
            <button
              onClick={() => setFormat("claude")}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded transition-all flex items-center gap-1.5",
                format === "claude" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
              )}
            >
              <FileText className="w-3.5 h-3.5" /> CLAUDE.md
            </button>
          </div>
          
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        
        <div className="flex-1 relative">
          <Editor
            height="100%"
            language="markdown"
            value={output}
            theme="vs-light"
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
              wordWrap: "on",
              readOnly: true,
              scrollBeyondLastLine: false,
              padding: { top: 16, bottom: 16 },
            }}
          />
        </div>
      </div>
    </div>
  );
}
