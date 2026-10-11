"use client";

import { useState, useEffect, useMemo } from "react";
import { MonacoEditor } from "@/components/MonacoEditor";
import { parseCurlCommand, generateFetch, generatePythonRequests, generateGoHttp, type ParsedCurl } from "@/lib/tools/curl";
import { ShareMenu } from "@/components/ShareMenu";
import { Copy, Eraser, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { addSnapshot } from "@/lib/storage";
import { ToolHeader, PaneBar, MobilePaneTabs, btnGhost, segmentTrack, segmentBtn, iconProps } from "@/components/tools/ToolChrome";
import { getToolIcon } from "@/components/layout/toolIcons";
import { ToolFooter, formatStats } from "@/components/tools/converters/ToolFooter";
import { useSettledValue, timed } from "@/components/tools/converters/useSettledValue";
import { useCopyFeedback } from "@/components/tools/converters/useCopyFeedback";

interface CurlConverterToolProps {
  onValidationChange: (isValid: boolean, error?: string) => void;
  onStatsChange: (length: number, execMs: number) => void;
  restoredInput?: string | null;
  fixedTarget?: "javascript" | "python" | "go";
}

type LangTarget = "javascript" | "python" | "go";

const TARGETS: { id: LangTarget; label: string; title: string; output: string; monacoLang: string; route: string; generate: (p: ParsedCurl) => string }[] = [
  { id: "javascript", label: "Fetch", title: "Fetch", output: "JavaScript (fetch)", monacoLang: "javascript", route: "curl-to-fetch", generate: generateFetch },
  { id: "python", label: "Python", title: "Python", output: "Python (requests)", monacoLang: "python", route: "curl-to-python", generate: generatePythonRequests },
  { id: "go", label: "Go", title: "Go", output: "Go (net/http)", monacoLang: "go", route: "curl-to-go", generate: generateGoHttp },
];

const DEFAULT_CURL = `curl -X POST https://api.example.com/data \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer token123" \\
  -d '{"key":"value"}'`;

const INPUT_OPTIONS = { wordWrap: "on" } as const;
const OUTPUT_OPTIONS = { wordWrap: "on", readOnly: true, domReadOnly: true } as const;

export function CurlConverterTool({ onValidationChange, onStatsChange, restoredInput, fixedTarget }: CurlConverterToolProps) {
  const [input, setInput] = useState<string>(DEFAULT_CURL);
  const [target, setTarget] = useState<LangTarget>(fixedTarget || "javascript");
  const [activeTab, setActiveTab] = useState<"input" | "output">("input");
  const [copiedId, copy] = useCopyFeedback();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (fixedTarget) setTarget(fixedTarget);
  }, [fixedTarget]);

  // Restore from history / share URL
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (restoredInput) setInput(restoredInput);
  }, [restoredInput]);

  // Parse once per settled input; switching language only re-runs the generator
  const settledInput = useSettledValue(input);
  const parsed = useMemo(() => timed(() => parseCurlCommand(settledInput)), [settledInput]);
  const current = TARGETS.find((t) => t.id === target) ?? TARGETS[0];
  const output = useMemo(() => (parsed.error ? "" : current.generate(parsed)), [parsed, current]);

  const empty = !input.trim();
  const hasError = !empty && Boolean(parsed.error);

  useEffect(() => {
    if (hasError) onValidationChange(false, parsed.error);
    else onValidationChange(true);
    onStatsChange(settledInput.length, parsed.ms);
  }, [hasError, parsed, settledInput, onValidationChange, onStatsChange]);

  // Save workspace snapshot
  useEffect(() => {
    const handleSave = () => {
      addSnapshot("curl", "cURL Converter", input, output);
    };
    window.addEventListener("save-workspace", handleSave);
    return () => window.removeEventListener("save-workspace", handleSave);
  }, [input, output]);

  const routeTarget = TARGETS.find((t) => t.id === (fixedTarget ?? "javascript")) ?? TARGETS[0];
  const warnings = parsed.warnings ?? [];
  const headerCount = Object.keys(parsed.headers).length;
  const footerStatus = empty ? "idle" : hasError ? "error" : warnings.length ? "warning" : "ok";
  const footerMessage = empty
    ? "Paste a curl command to convert"
    : hasError
      ? parsed.error
      : warnings.length
        ? `${warnings[0]}${warnings.length > 1 ? ` (+${warnings.length - 1} more)` : ""}`
        : `${parsed.method} request · ${headerCount} header${headerCount === 1 ? "" : "s"}${parsed.body || parsed.form?.length ? " · body" : ""}`;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-white">
      <ToolHeader
        icon={getToolIcon(routeTarget.route)}
        title={`cURL to ${current.title}`}
        utilities={<ShareMenu toolSlug={current.route} data={input} imageCode={output || input} imageLanguage={output ? current.monacoLang : "shell"} />}
        options={
          <div className="w-full min-w-0 md:w-auto">
            <div
              className={cn(segmentTrack, "flex max-w-full overflow-x-auto [scrollbar-width:none] md:inline-flex [&::-webkit-scrollbar]:hidden")}
              role="group"
              aria-label="Target language"
            >
              {TARGETS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={target === t.id}
                  onClick={() => setTarget(t.id)}
                  className={cn(segmentBtn(target === t.id), "shrink-0 grow md:grow-0")}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        }
      />

      <MobilePaneTabs
        tabs={[
          { id: "input", label: "cURL" },
          { id: "output", label: current.label },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      <div className="flex min-h-0 w-full flex-1 flex-col md:flex-row">
        <section className={cn("flex min-h-0 min-w-0 flex-1 flex-col border-zinc-200 md:border-r", activeTab !== "input" && "hidden md:flex")}>
          <PaneBar label="cURL command">
            <button type="button" onClick={() => setInput("")} disabled={empty} className={btnGhost} title="Clear input">
              <Eraser {...iconProps} />
              <span>Clear</span>
            </button>
          </PaneBar>
          <div className="relative min-h-0 flex-1">
            <MonacoEditor height="100%" defaultLanguage="shell" value={input} onChange={(value) => setInput(value || "")} options={INPUT_OPTIONS} />
          </div>
        </section>

        <section className={cn("flex min-h-0 min-w-0 flex-1 flex-col", activeTab !== "output" && "hidden md:flex")}>
          <PaneBar label={current.output}>
            <button type="button" onClick={() => copy(output, "output")} disabled={!output} className={cn(btnGhost, copiedId === "output" && "text-zinc-900")}>
              {copiedId === "output" ? <Check {...iconProps} /> : <Copy {...iconProps} />}
              <span>{copiedId === "output" ? "Copied" : "Copy"}</span>
            </button>
          </PaneBar>
          <div className="relative min-h-0 flex-1">
            <MonacoEditor height="100%" language={current.monacoLang} value={output} options={OUTPUT_OPTIONS} />
          </div>
        </section>
      </div>

      <ToolFooter status={footerStatus} message={footerMessage} meta={formatStats(input.length, empty ? undefined : parsed.ms)} />
    </div>
  );
}
