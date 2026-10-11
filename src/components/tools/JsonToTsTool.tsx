"use client";

import { useState, useEffect, useMemo } from "react";
import { MonacoEditor } from "@/components/MonacoEditor";
import { validateJsonForTs } from "@/lib/tools/json-to-ts";
import { convertValueToSchema, type TargetLanguage } from "@/lib/tools/polyglot-schema";
import { ShareMenu } from "@/components/ShareMenu";
import { Play, Copy, Eraser, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { addSnapshot } from "@/lib/storage";
import { ToolHeader, PaneBar, MobilePaneTabs, btnPrimary, btnGhost, inputBase, segmentTrack, segmentBtn, iconProps } from "@/components/tools/ToolChrome";
import { getToolIcon } from "@/components/layout/toolIcons";
import { ToolFooter, formatStats } from "@/components/tools/converters/ToolFooter";
import { useSettledValue, timed } from "@/components/tools/converters/useSettledValue";
import { useCopyFeedback } from "@/components/tools/converters/useCopyFeedback";

interface JsonToTsToolProps {
  onValidationChange: (isValid: boolean, error?: string, line?: number) => void;
  onStatsChange: (length: number, execMs: number) => void;
  onLogHistory?: (input: string) => void;
  restoredInput?: string | null;
  fixedTarget?: TargetLanguage;
}

const DEFAULT_JSON = `{\n  "id": 1,\n  "name": "Leanne Graham",\n  "username": "Bret",\n  "email": "Sincere@april.biz",\n  "address": {\n    "street": "Kulas Light",\n    "suite": "Apt. 556",\n    "city": "Gwenborough",\n    "zipcode": "92998-3874"\n  },\n  "phone": "1-770-736-8031 x56442",\n  "website": "hildegard.org",\n  "company": {\n    "name": "Romaguera-Crona",\n    "catchPhrase": "Multi-layered client-server neural-net"\n  },\n  "tags": ["developer", "admin"],\n  "isActive": true\n}`;

const LANGUAGES: { id: TargetLanguage; label: string; title: string; output: string; monacoLang: string }[] = [
  { id: "typescript", label: "TypeScript", title: "TypeScript", output: "TypeScript interfaces", monacoLang: "typescript" },
  { id: "zod", label: "Zod", title: "Zod", output: "Zod schema", monacoLang: "typescript" },
  { id: "go", label: "Go", title: "Go Struct", output: "Go structs", monacoLang: "go" },
  { id: "python", label: "Python", title: "Pydantic", output: "Pydantic models", monacoLang: "python" },
  { id: "rust", label: "Rust", title: "Rust (Serde)", output: "Rust structs", monacoLang: "rust" },
];

/** Route (and sidebar id) for each target that has its own page. */
const TARGET_ROUTE: Partial<Record<TargetLanguage, string>> = {
  typescript: "json-to-ts",
  zod: "json-to-zod",
  go: "json-to-go",
};

const INPUT_OPTIONS = { wordWrap: "on" } as const;
const OUTPUT_OPTIONS = { wordWrap: "on", readOnly: true, domReadOnly: true } as const;

export function JsonToTsTool({ onValidationChange, onStatsChange, onLogHistory, restoredInput, fixedTarget }: JsonToTsToolProps) {
  const [input, setInput] = useState<string>(DEFAULT_JSON);
  const [targetLang, setTargetLang] = useState<TargetLanguage>(fixedTarget || "typescript");
  const [rootName, setRootName] = useState<string>("User");
  const [activeTab, setActiveTab] = useState<"input" | "output">("input");
  const [copiedId, copy] = useCopyFeedback();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (fixedTarget) setTargetLang(fixedTarget);
  }, [fixedTarget]);

  // Restore from history / magic paste
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (restoredInput) setInput(restoredInput);
  }, [restoredInput]);

  // Parse once per settled input; generating for another language reuses the parsed value
  const settledInput = useSettledValue(input);
  const parsed = useMemo(() => timed(() => validateJsonForTs(settledInput)), [settledInput]);
  const generated = useMemo(
    () =>
      timed(() => {
        if (!parsed.valid || parsed.value === undefined) return { code: "", error: undefined as string | undefined };
        try {
          return { code: convertValueToSchema(parsed.value, targetLang, rootName), error: undefined };
        } catch (err) {
          return { code: "", error: err instanceof Error ? err.message : "Could not generate types" };
        }
      }),
    [parsed, targetLang, rootName]
  );

  const output = generated.code;
  const isValid = parsed.valid && !generated.error;
  const errorMessage = parsed.error || generated.error;
  const execMs = parsed.ms + generated.ms;

  useEffect(() => {
    onValidationChange(isValid, errorMessage, parsed.line);
    onStatsChange(settledInput.length, execMs);
  }, [isValid, errorMessage, parsed.line, settledInput, execMs, onValidationChange, onStatsChange]);

  const lang = LANGUAGES.find((l) => l.id === targetLang) ?? LANGUAGES[0];
  const routeId = TARGET_ROUTE[fixedTarget ?? "typescript"] ?? "json-to-ts";
  const shareSlug = TARGET_ROUTE[targetLang] ?? routeId;

  // Save workspace snapshot
  useEffect(() => {
    const handleSave = () => addSnapshot(routeId, `JSON to ${lang.title}`, input, output);
    window.addEventListener("save-workspace", handleSave);
    return () => window.removeEventListener("save-workspace", handleSave);
  }, [routeId, lang.title, input, output]);

  const handleGenerate = () => {
    if (!input.trim()) return;
    if (isValid) onLogHistory?.(input);
    setActiveTab("output");
  };

  const empty = !input.trim();
  const footerMessage = empty
    ? "Paste JSON to generate types"
    : isValid
      ? `Valid JSON · ${lang.output}`
      : `${parsed.line ? `Line ${parsed.line}${parsed.column ? `, Col ${parsed.column}` : ""}: ` : ""}${errorMessage}`;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-white">
      <ToolHeader
        icon={getToolIcon(routeId)}
        title={`JSON to ${lang.title}`}
        utilities={<ShareMenu toolSlug={shareSlug} data={input} imageCode={output || input} imageLanguage={output ? lang.monacoLang : "json"} />}
        options={
          <>
            {/* Target language (scrolls inside its own track on narrow screens) */}
            <div className="w-full min-w-0 md:w-auto">
              <div
                className={cn(segmentTrack, "flex max-w-full overflow-x-auto [scrollbar-width:none] md:inline-flex [&::-webkit-scrollbar]:hidden")}
                role="group"
                aria-label="Target language"
              >
                {LANGUAGES.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    aria-pressed={targetLang === l.id}
                    onClick={() => setTargetLang(l.id)}
                    className={cn(segmentBtn(targetLang === l.id), "shrink-0 grow md:grow-0")}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex min-w-0 items-center gap-2">
              <span className="whitespace-nowrap text-[13px] font-medium text-zinc-500 md:text-xs">Root</span>
              <input
                type="text"
                value={rootName}
                onChange={(e) => setRootName(e.target.value)}
                placeholder="User"
                spellCheck={false}
                aria-label="Root type name"
                className={cn(inputBase, "w-28 min-w-0 font-mono")}
              />
            </label>
          </>
        }
        actions={
          <button type="button" onClick={handleGenerate} disabled={empty} className={btnPrimary}>
            <Play {...iconProps} />
            <span>Generate</span>
          </button>
        }
      />

      <MobilePaneTabs
        tabs={[
          { id: "input", label: "JSON" },
          { id: "output", label: lang.label },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      <div className="flex min-h-0 w-full flex-1 flex-col md:flex-row">
        <section className={cn("flex min-h-0 min-w-0 flex-1 flex-col border-zinc-200 md:border-r", activeTab !== "input" && "hidden md:flex")}>
          <PaneBar label="JSON input">
            <button type="button" onClick={() => setInput("")} disabled={empty} className={btnGhost} title="Clear input">
              <Eraser {...iconProps} />
              <span>Clear</span>
            </button>
          </PaneBar>
          <div className="relative min-h-0 flex-1">
            <MonacoEditor height="100%" defaultLanguage="json" value={input} onChange={(value) => setInput(value || "")} options={INPUT_OPTIONS} />
          </div>
        </section>

        <section className={cn("flex min-h-0 min-w-0 flex-1 flex-col", activeTab !== "output" && "hidden md:flex")}>
          <PaneBar label={lang.output}>
            <button type="button" onClick={() => copy(output, "output")} disabled={!output} className={cn(btnGhost, copiedId === "output" && "text-zinc-900")}>
              {copiedId === "output" ? <Check {...iconProps} /> : <Copy {...iconProps} />}
              <span>{copiedId === "output" ? "Copied" : "Copy"}</span>
            </button>
          </PaneBar>
          <div className="relative min-h-0 flex-1">
            <MonacoEditor height="100%" language={lang.monacoLang} value={output} options={OUTPUT_OPTIONS} />
          </div>
        </section>
      </div>

      <ToolFooter
        status={empty ? "idle" : isValid ? "ok" : "error"}
        message={footerMessage}
        meta={formatStats(input.length, empty ? undefined : execMs)}
      />
    </div>
  );
}
