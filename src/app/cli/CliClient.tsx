"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Copy, Check, ArrowUpRight, BookOpen, RefreshCw, Wrench } from "lucide-react";
import {
  CursorIcon,
  ClaudeIcon,
  WindsurfIcon,
  OpenAIIcon,
  GeminiIcon,
  CopilotIcon,
} from "@/components/icons/AssistantBrandIcons";
import { cn } from "@/lib/utils";

interface PresetItem {
  slug: string;
  name: string;
  category: string;
}

const POPULAR_PRESETS: PresetItem[] = [
  { slug: "nextjs-15", name: "Next.js 15 App Router", category: "Fullstack" },
  { slug: "react-19", name: "React 19 & Server Components", category: "Frontend" },
  { slug: "tailwind-v4", name: "Tailwind CSS v4", category: "Styling" },
  { slug: "fastapi", name: "FastAPI & Pydantic v2", category: "Backend" },
  { slug: "go-fiber", name: "Go & Fiber", category: "Backend" },
  { slug: "docker-devops", name: "Docker & DevOps", category: "DevOps" },
  { slug: "codebase-auditor", name: "Codebase auditor", category: "Quality" },
  { slug: "security-guard", name: "Security guardrails", category: "Quality" },
];

const ICON = "size-4 shrink-0";

const FORMAT_TABS: { id: string; label: string; icon: React.ReactNode }[] = [
  { id: "cursor-rules", label: "Cursor", icon: <CursorIcon className={ICON} /> },
  { id: "claude-skills", label: "Claude Skill", icon: <ClaudeIcon className={ICON} /> },
  { id: "windsurf", label: "Windsurf", icon: <WindsurfIcon className={ICON} /> },
  { id: "copilot", label: "Copilot", icon: <CopilotIcon className={ICON} /> },
  { id: "openai", label: "OpenAI", icon: <OpenAIIcon className={ICON} /> },
  { id: "gemini", label: "Gemini", icon: <GeminiIcon className={ICON} /> },
];

/** Same target paths the CLI writes (cli/bin/devscratchpad.mjs). */
function getTargetFilePath(format: string, preset: string) {
  switch (format) {
    case "cursor-rules":
      return `.cursor/rules/${preset}.mdc`;
    case "claude-skills":
      return `.claude/skills/${preset}/SKILL.md`;
    case "windsurf":
      return `.windsurf/rules/${preset}.md`;
    case "copilot":
      return `.github/copilot-instructions.md`;
    case "openai":
      return `.openai/system-instructions.md`;
    case "gemini":
      return `.gemini/${preset}.json`;
    default:
      return `.cursor/rules/${preset}.mdc`;
  }
}

const ALL_FORMATS = [
  "cursor-rules",
  "claude-skills",
  "claude-md",
  "agents-md",
  "windsurf",
  "copilot",
  "mcp-config",
  "openai",
  "gemini",
  "cursorignore",
  "claudeignore",
  "llms-txt",
  "architecture-md",
];

const INIT_FILES = [
  ".cursor/rules/cursor-rules-pro.mdc",
  "CLAUDE.md",
  "AGENTS.md",
  ".cursorignore",
  ".claudeignore",
  "llms.txt",
  "ARCHITECTURE.md",
];

type Runtime = "npx" | "pnpm dlx" | "bunx";
type CommandTab = "add" | "audit" | "list" | "init";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-1";
const label = "text-[11px] font-semibold uppercase tracking-wider text-zinc-500";

function chip(active: boolean) {
  return cn(
    "inline-flex h-9 items-center gap-2 rounded-md border px-3 text-[13px] font-medium transition-colors cursor-pointer",
    focusRing,
    active
      ? "border-zinc-900 bg-zinc-50 text-zinc-900 ring-1 ring-zinc-900"
      : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900"
  );
}

function segment(active: boolean) {
  return cn(
    "h-7 rounded-[5px] px-2.5 font-mono text-xs font-medium transition-colors cursor-pointer",
    focusRing,
    active ? "bg-white text-zinc-900 ring-1 ring-zinc-200" : "text-zinc-500 hover:text-zinc-900"
  );
}

export function CliClient() {
  const [activeCommandTab, setActiveCommandTab] = useState<CommandTab>("add");
  const [selectedFormat, setSelectedFormat] = useState("cursor-rules");
  const [selectedPreset, setSelectedPreset] = useState("nextjs-15");
  const [selectedRuntime, setSelectedRuntime] = useState<Runtime>("npx");
  const [copiedCmd, setCopiedCmd] = useState(false);

  const currentAddCommand = `${selectedRuntime} devscratchpad add ${selectedFormat}/${selectedPreset}`;
  const targetPath = getTargetFilePath(selectedFormat, selectedPreset);
  const commandFor = (cmd: CommandTab) =>
    cmd === "add" ? currentAddCommand : `${selectedRuntime} devscratchpad ${cmd}`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="space-y-14">
      {/* Command builder */}
      <section aria-labelledby="builder-heading" className="rounded-xl border border-zinc-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3 sm:px-5">
          <h2 id="builder-heading" className="text-sm font-semibold text-zinc-900">
            Build your command
          </h2>
          <div className="inline-flex items-center gap-0.5 rounded-md bg-zinc-100 p-0.5" role="group" aria-label="Package runner">
            {(["npx", "pnpm dlx", "bunx"] as const).map((rt) => (
              <button
                key={rt}
                type="button"
                onClick={() => setSelectedRuntime(rt)}
                aria-pressed={selectedRuntime === rt}
                className={segment(selectedRuntime === rt)}
              >
                {rt}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-5 p-4 sm:p-5">
          {/* Command line */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-3 font-mono text-sm">
              <span className="select-none text-zinc-400">$</span>
              <span className="whitespace-nowrap text-zinc-900">
                <span className="text-zinc-500">{selectedRuntime}</span> devscratchpad add{" "}
                <span className="rounded bg-zinc-200/70 px-1 py-0.5 font-semibold">
                  {selectedFormat}/{selectedPreset}
                </span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(currentAddCommand)}
              aria-label="Copy command"
              className={cn(
                "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 cursor-pointer",
                focusRing
              )}
            >
              {copiedCmd ? <Check className="size-4" /> : <Copy className="size-4" />}
              <span aria-live="polite">{copiedCmd ? "Copied" : "Copy"}</span>
            </button>
          </div>
          <p className="-mt-2 font-mono text-xs text-zinc-500">
            Writes <span className="text-zinc-900">{targetPath}</span>
          </p>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <div className="space-y-2">
              <span className={label}>Assistant</span>
              <div className="flex flex-wrap gap-1.5">
                {FORMAT_TABS.map((fmt) => {
                  const active = selectedFormat === fmt.id;
                  return (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => setSelectedFormat(fmt.id)}
                      aria-pressed={active}
                      className={chip(active)}
                    >
                      {fmt.icon}
                      {fmt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <span className={label}>Stack preset</span>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_PRESETS.map((p) => (
                  <button
                    key={p.slug}
                    type="button"
                    onClick={() => setSelectedPreset(p.slug)}
                    aria-pressed={selectedPreset === p.slug}
                    className={chip(selectedPreset === p.slug)}
                    title={p.category}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Terminal preview */}
      <section aria-labelledby="preview-heading" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="preview-heading" className="text-xl font-semibold tracking-tight text-zinc-900">
              What each command prints
            </h2>
            <p className="mt-1 text-sm text-zinc-500">Sample output and the files written to your repository.</p>
          </div>
          <div className="inline-flex items-center gap-0.5 self-start rounded-md bg-zinc-100 p-0.5 sm:self-auto" role="tablist" aria-label="Command">
            {(["add", "audit", "list", "init"] as const).map((cmd) => (
              <button
                key={cmd}
                type="button"
                role="tab"
                aria-selected={activeCommandTab === cmd}
                onClick={() => setActiveCommandTab(cmd)}
                className={segment(activeCommandTab === cmd)}
              >
                {cmd}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white font-mono text-[13px] leading-relaxed">
          <div className="flex items-center gap-2 border-b border-zinc-200 bg-zinc-50 px-4 py-2.5">
            <span className="select-none text-zinc-400">$</span>
            <span className="truncate text-zinc-900">{commandFor(activeCommandTab)}</span>
          </div>

          <div className="space-y-4 p-4 text-zinc-600 sm:p-5">
            {activeCommandTab === "add" && (
              <>
                <div className="space-y-1">
                  <p>
                    Fetching rules for &quot;{selectedPreset}&quot; in format &quot;{selectedFormat}&quot;…
                  </p>
                  <p className="flex items-center gap-1.5 text-zinc-900">
                    <Check className="size-3.5" /> Installed
                  </p>
                </div>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 border-l-2 border-zinc-200 pl-3">
                  <dt className="text-zinc-400">target</dt>
                  <dd className="break-all text-zinc-900">{targetPath}</dd>
                  <dt className="text-zinc-400">format</dt>
                  <dd>{selectedFormat}</dd>
                  <dt className="text-zinc-400">network</dt>
                  <dd>public preset only; nothing from your repo is sent</dd>
                </dl>
                <FileTree
                  files={[targetPath]}
                  note={selectedFormat === "copilot" ? "updated" : "created"}
                />
                <p className="text-zinc-500">
                  Customize it in AI Skill Studio:{" "}
                  <Link
                    href={`/ai-skill-studio/${selectedFormat}/${selectedPreset}`}
                    className="break-all text-zinc-900 underline underline-offset-2 hover:text-zinc-600"
                  >
                    /ai-skill-studio/{selectedFormat}/{selectedPreset}
                  </Link>
                </p>
              </>
            )}

            {activeCommandTab === "audit" && (
              <>
                <p>Scanning the workspace for AI rule files…</p>
                <div className="divide-y divide-zinc-100 rounded-lg border border-zinc-200">
                  <div className="flex items-start justify-between gap-4 px-3 py-2.5">
                    <div className="min-w-0">
                      <div className="truncate text-zinc-900">.cursor/rules/nextjs-15.mdc</div>
                      <div className="flex items-center gap-1.5 text-zinc-500">
                        <Check className="size-3.5" /> Passed all static checks
                      </div>
                    </div>
                    <span className="shrink-0 font-semibold text-zinc-900">95/100</span>
                  </div>
                  <div className="flex items-start justify-between gap-4 px-3 py-2.5">
                    <div className="min-w-0">
                      <div className="truncate text-zinc-900">CLAUDE.md</div>
                      <div className="text-amber-700">⚠ No negative guardrails (&quot;never do X&quot;, &quot;avoid Y&quot;).</div>
                    </div>
                    <span className="shrink-0 font-semibold text-amber-700">70/100</span>
                  </div>
                </div>
                <p className="text-zinc-900">
                  Repository rule health: <span className="font-semibold">83/100</span>{" "}
                  <span className="text-zinc-500">(2 files)</span>
                </p>
              </>
            )}

            {activeCommandTab === "list" && (
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <p className="text-[11px] font-sans font-semibold uppercase tracking-wider text-zinc-500">
                    Formats ({ALL_FORMATS.length})
                  </p>
                  <ul className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-zinc-900">
                    {ALL_FORMATS.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[11px] font-sans font-semibold uppercase tracking-wider text-zinc-500">Popular presets</p>
                  <ul className="grid grid-cols-1 gap-y-0.5">
                    {POPULAR_PRESETS.map((p) => (
                      <li key={p.slug} className="flex justify-between gap-4">
                        <span className="text-zinc-900">{p.slug}</span>
                        <span className="text-zinc-400">{p.category}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {activeCommandTab === "init" && (
              <>
                <div className="space-y-1">
                  <p>Initializing the 5-layer AI agent suite…</p>
                  <p className="flex items-center gap-1.5 text-zinc-900">
                    <Check className="size-3.5" /> {INIT_FILES.length} files written
                  </p>
                </div>
                <FileTree files={INIT_FILES} note="created" />
              </>
            )}
          </div>
        </div>
      </section>

      {/* Related */}
      <nav aria-label="Related" className="grid gap-px overflow-hidden rounded-xl border border-zinc-200 bg-zinc-200 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            href: "/ai-skill-studio",
            title: "AI Skill Studio",
            body: "Edit rules visually with a live quality score.",
            icon: <Image src="/ai-skill-icon.png" width={20} height={16} className="h-4 w-5 object-contain" alt="" />,
          },
          {
            href: "/blog/how-to-manage-ai-rules-with-cli-guide",
            title: "CLI guide",
            body: "Guardrails, multi-agent sync and CI audits.",
            icon: <BookOpen className="size-4 text-zinc-500" />,
          },
          {
            href: "/ai-skill-studio/rules-converter",
            title: "Rules converter",
            body: "Turn .cursorrules or CLAUDE.md into any format.",
            icon: <RefreshCw className="size-4 text-zinc-500" />,
          },
          {
            href: "/developer-tools",
            title: "Developer tools",
            body: "Formatters, JWT, hashing and more, in your browser.",
            icon: <Wrench className="size-4 text-zinc-500" />,
          },
        ].map((item) => (
          <Link key={item.href} href={item.href} className={cn("group flex flex-col gap-1.5 bg-white p-4 transition-colors hover:bg-zinc-50", focusRing)}>
            <span className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
              {item.icon}
              {item.title}
              <ArrowUpRight className="ml-auto size-4 text-zinc-300 transition-colors group-hover:text-zinc-900" />
            </span>
            <span className="text-[13px] leading-relaxed text-zinc-500">{item.body}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

/** Minimal ASCII tree of the files a command writes. */
function FileTree({ files, note }: { files: string[]; note: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-zinc-500">
      <div className="text-zinc-400">.</div>
      {files.map((file, i) => (
        <div key={file} className="flex gap-2">
          <span className="select-none text-zinc-300">{i === files.length - 1 ? "└──" : "├──"}</span>
          <span className="break-all text-zinc-900">{file}</span>
          <span className="hidden shrink-0 text-zinc-400 sm:inline">{note}</span>
        </div>
      ))}
    </div>
  );
}
