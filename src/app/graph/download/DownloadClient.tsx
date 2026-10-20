"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { AlertCircle, Download, FileText, LaptopMinimalCheck, Loader2, PencilRuler, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { SkillGraphIcon } from "@/components/icons/SkillGraphIcon";
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from "../components/theme";
import { buildExportKit, kitFileRole, toSlug, type ExportFile } from "../lib/graphExport";
import { hasPermissions, summarizePermissions } from "../lib/graphPermissions";
import { decodeShareHash } from "../lib/graphShare";
import { parseGraphSkill, validateGraph, type SkillGraph } from "../lib/graphSkill";

type Kit =
  | { state: "empty" }
  | { state: "unreadable"; reason: string; hash: string }
  | { state: "errors"; graph: SkillGraph; count: number; hash: string }
  | { state: "ready"; graph: SkillGraph; files: ExportFile[]; hash: string };

function subscribe(onChange: () => void): () => void {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

/** Same checks as the studio and the connector: a graph with errors is not compiled. */
function readKit(hash: string): Kit {
  const shared = decodeShareHash(hash);
  if (!shared) return { state: "empty" };
  const parsed = parseGraphSkill(shared.source);
  if (!parsed.graph) return { state: "unreadable", reason: parsed.fatal ?? "unknown problem", hash };
  const errors = validateGraph(parsed.graph).filter((issue) => issue.severity === "error").length;
  if (errors > 0) return { state: "errors", graph: parsed.graph, count: errors, hash };
  return { state: "ready", graph: parsed.graph, files: buildExportKit(parsed.graph), hash };
}

function download(fileName: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const PRIMARY = cn(BUTTON_PRIMARY, "h-10 px-4 text-sm disabled:opacity-60");
const SECONDARY = cn(BUTTON_SECONDARY, "h-10 px-4 text-sm");

/** Studio links carry the graph after the #; they load the page in full, since the studio reads the URL once, before it mounts. */
function Header({ studioHref }: { studioHref: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/graph" className="flex min-w-0 items-center gap-3">
          <SkillGraphIcon className="h-6 w-6 shrink-0 text-zinc-900" />
          <span className="truncate text-[15px] font-extrabold tracking-[-0.02em] text-zinc-900 sm:text-base">Skill Graph</span>
        </Link>
        <a href={studioHref} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-[13px] font-semibold text-zinc-800 transition-colors hover:border-zinc-300 hover:bg-zinc-50">
          <PencilRuler className="h-3.5 w-3.5" /> Open the studio
        </a>
      </div>
    </header>
  );
}

function Problem({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
        <AlertCircle className="h-3.5 w-3.5" /> No kit to download
      </p>
      <h1 className="text-2xl font-extrabold tracking-[-0.03em] text-zinc-900 sm:text-3xl">{title}</h1>
      <div className="space-y-3 text-[15px] leading-relaxed text-zinc-600">{children}</div>
    </div>
  );
}

function Permissions({ graph }: { graph: SkillGraph }) {
  const permissions = summarizePermissions(graph);
  if (!hasPermissions(permissions)) return null;
  const { commands, shell, writers, mcp, unlimited } = permissions;
  const CHIP = "rounded-md bg-white px-1.5 py-0.5 font-mono text-[11.5px] text-zinc-800 ring-1 ring-amber-200";
  return (
    <div role="region" aria-label="What this kit can do" className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden />
      <div className="min-w-0 space-y-1.5">
        <p>
          <b>Check it before you install it.</b> This kit came from a link, and your agent will run what it lists:
        </p>
        <ul className="space-y-1 text-xs">
          {commands.length > 0 && (
            <li className="flex flex-wrap items-center gap-1.5">
              Commands:
              {commands.map((item) => (
                <code key={`${item.id}:${item.command}`} className={cn(CHIP, "max-w-full break-all")} title={`Run by ${item.id}`}>
                  $ {item.command}
                </code>
              ))}
            </li>
          )}
          {shell.length > 0 && <li>Shell access (Bash): <span className="font-mono">{shell.join(", ")}</span></li>}
          {writers.length > 0 && <li>Edits files: <span className="font-mono">{writers.join(", ")}</span></li>}
          {mcp.length > 0 && <li>MCP tools: <span className="font-mono">{mcp.join(", ")}</span></li>}
          {unlimited.length > 0 && <li>Every tool (no limit set): <span className="font-mono">{unlimited.join(", ")}</span></li>}
        </ul>
      </div>
    </div>
  );
}

function ReadyKit({ graph, files, studioHref }: { graph: SkillGraph; files: ExportFile[]; studioHref: string }) {
  const slug = toSlug(graph.name);
  const zipName = `${slug}-skill-kit.zip`;
  const [status, setStatus] = useState<"idle" | "working" | "done" | "failed">("idle");

  const downloadZip = async () => {
    setStatus("working");
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      for (const file of files) zip.file(file.path, file.content);
      download(zipName, await zip.generateAsync({ type: "blob" }));
      setStatus("done");
    } catch {
      setStatus("failed");
    }
  };

  return (
    <>
      <div className="space-y-3">
        <p className="text-[13px] font-medium text-zinc-500">Claude Code + Cursor kit</p>
        <h1 className="break-words text-[28px] font-bold leading-[1.15] tracking-[-0.025em] text-zinc-950 sm:text-[34px]">{graph.name || slug}</h1>
        {graph.description && <p className="text-[15px] leading-relaxed text-zinc-600">{graph.description}</p>}
      </div>

      <Permissions graph={graph} />

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={downloadZip} disabled={status === "working"} className={PRIMARY}>
          {status === "working" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Download {zipName}
        </button>
        <a href={studioHref} className={SECONDARY}>
          <PencilRuler className="h-4 w-4" /> Open in the studio
        </a>
      </div>
      {status === "done" && <p className="-mt-4 text-[13px] text-zinc-600">Downloaded. Check your downloads folder.</p>}
      {status === "failed" && <p className="-mt-4 text-[13px] text-red-700">This browser could not build the .zip. Open the graph in the studio and export it from there.</p>}

      <section aria-label="Files in the kit" className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-zinc-100 bg-zinc-50 px-4 py-2.5">
          <span className="truncate font-mono text-xs font-semibold text-zinc-700">{zipName}</span>
          <span className="shrink-0 text-xs text-zinc-500">{files.length} files</span>
        </div>
        <ul className="divide-y divide-zinc-100">
          {files.map((file) => (
            <li key={file.path} className="flex items-center gap-3 px-4 py-2">
              <FileText className="h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden />
              <span className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-zinc-800" title={file.path}>
                {file.path}
              </span>
              <span className="shrink-0 text-[11.5px] font-medium text-zinc-500">{kitFileRole(file.path)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-zinc-950">Install it</h2>
        <ol className="space-y-2.5">
          {[
            <>Unzip it at the root of your repository; the files land in <code className="font-mono text-[13px]">.claude/</code> and <code className="font-mono text-[13px]">.cursor/</code>.</>,
            <>Start Claude Code in the repository and ask it to use the <code className="font-mono text-[13px]">{slug}</code> skill, or invoke it by name.</>,
            <>In Cursor, the rule in <code className="font-mono text-[13px]">.cursor/rules/</code> is picked up on its own.</>,
          ].map((item, index) => (
            <li key={index} className="flex gap-3 text-[14px] leading-relaxed text-zinc-600">
              <span className="w-5 shrink-0 pt-px font-mono text-[12px] text-zinc-400">{String(index + 1).padStart(2, "0")}</span>
              <span className="min-w-0 pt-0.5">{item}</span>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}

export function DownloadClient() {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash, () => null);
  const kit = useMemo(() => (hash === null ? null : readKit(hash)), [hash]);
  const studioHref = kit && kit.state !== "empty" ? `/graph/studio${kit.hash}` : "/graph/studio";

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 antialiased">
      <Header studioHref={studioHref} />
      <main className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6 sm:py-14">
        {kit === null ? (
          <p className="flex items-center gap-2 text-[13px] text-zinc-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Building the kit
          </p>
        ) : kit.state === "empty" ? (
          <Problem title="This link has no graph in it">
            <p>
              A kit link ends in <code className="font-mono text-[13px]">#g=</code> followed by the graph. If you copied it from a chat, the end may have been cut off; ask
              for the link again, or open the graph in the studio and export it there.
            </p>
            <Link href="/graph/studio" className={SECONDARY}>
              <PencilRuler className="h-4 w-4" /> Open the studio
            </Link>
          </Problem>
        ) : kit.state === "unreadable" ? (
          <Problem title="The graph in this link cannot be read">
            <p>{kit.reason}. Open it in the studio to see where.</p>
            <a href={studioHref} className={SECONDARY}>
              <PencilRuler className="h-4 w-4" /> Open in the studio
            </a>
          </Problem>
        ) : kit.state === "errors" ? (
          <Problem title={`${kit.graph.name || "This graph"} has ${kit.count === 1 ? "an error" : `${kit.count} errors`}`}>
            <p>A graph with errors is not compiled into a kit. The studio lists them under Issues, each with how to fix it; export from there once they are gone.</p>
            <a href={studioHref} className={SECONDARY}>
              <PencilRuler className="h-4 w-4" /> Fix it in the studio
            </a>
          </Problem>
        ) : (
          <ReadyKit graph={kit.graph} files={kit.files} studioHref={studioHref} />
        )}

        <p className="flex items-center gap-2 border-t border-zinc-200 pt-6 text-[13px] text-zinc-500">
          <LaptopMinimalCheck className="h-4 w-4 shrink-0 text-zinc-700" aria-hidden />
          Built in this browser from the link. The graph sits after the #, which browsers never send to a server.
        </p>
      </main>
    </div>
  );
}
