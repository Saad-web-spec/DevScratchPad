"use client";

import { useState, useEffect, useMemo, useDeferredValue } from "react";
import { MonacoEditor } from "@/components/MonacoEditor";
import { convertYamlJson, type YamlMode } from "@/lib/tools/yaml";
import { ShareMenu } from "@/components/ShareMenu";
import { Play, Copy, Eraser, ArrowLeftRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { addSnapshot } from "@/lib/storage";
import { ToolHeader, PaneBar, MobilePaneTabs, btnPrimary, btnSecondary, btnGhost, selectBase, segmentTrack, segmentBtn, iconProps } from "@/components/tools/ToolChrome";
import { getToolIcon } from "@/components/layout/toolIcons";
import { ToolFooter, formatStats } from "@/components/tools/converters/ToolFooter";
import { useSettledValue, timed } from "@/components/tools/converters/useSettledValue";
import { useCopyFeedback } from "@/components/tools/converters/useCopyFeedback";

interface YamlConverterToolProps {
  onValidationChange: (isValid: boolean, error?: string, line?: number) => void;
  onStatsChange: (length: number, execMs: number) => void;
  onLogHistory?: (input: string) => void;
  restoredInput?: string | null;
  /** Starting direction (defaults to YAML to JSON). */
  defaultMode?: YamlMode;
}

const SAMPLE_YAML = `# Service configuration
server:
  host: localhost
  port: 8080
  tls: false
database:
  name: dev_db
  pool:
    max: 100
    idle: 10
features:
  - auth
  - logging
  - metrics
logging:
  level: info
  format: json
`;

const SAMPLE_JSON = `{
  "server": { "host": "localhost", "port": 8080, "tls": false },
  "database": { "name": "dev_db", "pool": { "max": 100, "idle": 10 } },
  "features": ["auth", "logging", "metrics"],
  "logging": { "level": "info", "format": "json" }
}
`;

/** Read-only output; everything else comes from the shared editor defaults. */
const INPUT_OPTIONS = { wordWrap: "on" } as const;
const OUTPUT_OPTIONS = { wordWrap: "on", readOnly: true, domReadOnly: true } as const;

export function YamlConverterTool({
  onValidationChange,
  onStatsChange,
  onLogHistory,
  restoredInput,
  defaultMode = "yaml-to-json",
}: YamlConverterToolProps) {
  const [mode, setMode] = useState<YamlMode>(defaultMode);
  const [input, setInput] = useState<string>(defaultMode === "yaml-to-json" ? SAMPLE_YAML : SAMPLE_JSON);
  const [indent, setIndent] = useState<number>(2);
  const [activeTab, setActiveTab] = useState<"input" | "output">("input");
  const [copiedId, copy] = useCopyFeedback();

  // Restore from history
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (restoredInput) setInput(restoredInput);
  }, [restoredInput]);

  // Convert off the keystroke path: one parse per settled input
  // (mode is deferred alongside the input so a direction switch never converts the old text in the new mode)
  const settledInput = useSettledValue(input);
  const settledMode = useDeferredValue(mode);
  const result = useMemo(
    () => timed(() => convertYamlJson(settledInput, settledMode, indent)),
    [settledInput, settledMode, indent]
  );

  useEffect(() => {
    onValidationChange(result.ok, result.error, result.line);
    onStatsChange(settledInput.length, result.ms);
  }, [result, settledInput, onValidationChange, onStatsChange]);

  // Dispatch custom events when input/output change
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("update-workspace-state", { detail: { input: settledInput, output: result.output } }));
    window.dispatchEvent(new CustomEvent("workspace-saved", { detail: { input: settledInput, output: result.output } }));
  }, [settledInput, result.output]);

  // Save workspace snapshot
  useEffect(() => {
    const handleSave = () => addSnapshot("yaml", "YAML / JSON Converter", input, result.output);
    window.addEventListener("save-workspace", handleSave);
    return () => window.removeEventListener("save-workspace", handleSave);
  }, [input, result.output]);

  const handleConvert = () => {
    if (!input.trim()) return;
    if (result.ok) onLogHistory?.(input);
    setActiveTab("output");
  };

  const handleSwap = () => {
    if (!result.ok || !result.output) return;
    setMode(mode === "yaml-to-json" ? "json-to-yaml" : "yaml-to-json");
    setInput(result.output);
  };

  const handleMode = (next: YamlMode) => {
    if (next === mode) return;
    // Carry the current content across when it converts cleanly, so switching direction keeps the data
    if (result.ok && result.output && settledInput === input) setInput(result.output);
    setMode(next);
  };

  const handleCopy = () => copy(result.output, "output");

  const isYamlIn = mode === "yaml-to-json";
  const inputLang = isYamlIn ? "yaml" : "json";
  const outputLang = isYamlIn ? "json" : "yaml";
  const inputLabel = isYamlIn ? "YAML" : "JSON";
  const outputLabel = isYamlIn ? "JSON" : "YAML";
  const empty = !input.trim();

  const footerMessage = empty
    ? `Paste ${inputLabel} to convert`
    : result.ok
      ? `Valid ${inputLabel}${result.documents && result.documents > 1 ? ` · ${result.documents} documents` : ""}`
      : `${result.line ? `Line ${result.line}${result.column ? `, Col ${result.column}` : ""}: ` : ""}${result.error}`;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-white">
      <ToolHeader
        icon={getToolIcon("yaml")}
        title="YAML / JSON Converter"
        utilities={<ShareMenu toolSlug="yaml" data={input} imageCode={result.output || input} imageLanguage={result.output ? outputLang : inputLang} />}
        options={
          <>
            <div className={segmentTrack} role="group" aria-label="Conversion direction">
              <button type="button" aria-pressed={isYamlIn} onClick={() => handleMode("yaml-to-json")} className={segmentBtn(isYamlIn)}>
                YAML → JSON
              </button>
              <button type="button" aria-pressed={!isYamlIn} onClick={() => handleMode("json-to-yaml")} className={segmentBtn(!isYamlIn)}>
                JSON → YAML
              </button>
            </div>
            <select value={indent} onChange={(e) => setIndent(Number(e.target.value))} className={selectBase} aria-label="Indentation">
              <option value={2}>2 spaces</option>
              <option value={4}>4 spaces</option>
            </select>
          </>
        }
        actions={
          <>
            <button type="button" onClick={handleSwap} disabled={!result.ok || !result.output} className={btnSecondary} title="Use the output as the new input">
              <ArrowLeftRight {...iconProps} />
              <span>Swap</span>
            </button>
            <button type="button" onClick={handleConvert} disabled={empty} className={btnPrimary}>
              <Play {...iconProps} />
              <span>Convert</span>
            </button>
          </>
        }
      />

      <MobilePaneTabs
        tabs={[
          { id: "input", label: inputLabel },
          { id: "output", label: outputLabel },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      <div className="flex min-h-0 w-full flex-1 flex-col md:flex-row">
        <section className={cn("flex min-h-0 min-w-0 flex-1 flex-col border-zinc-200 md:border-r", activeTab !== "input" && "hidden md:flex")}>
          <PaneBar label={`${inputLabel} input`}>
            <button type="button" onClick={() => setInput("")} disabled={empty} className={btnGhost} title="Clear input">
              <Eraser {...iconProps} />
              <span>Clear</span>
            </button>
          </PaneBar>
          <div className="relative min-h-0 flex-1">
            <MonacoEditor height="100%" language={inputLang} value={input} onChange={(value) => setInput(value || "")} options={INPUT_OPTIONS} />
          </div>
        </section>

        <section className={cn("flex min-h-0 min-w-0 flex-1 flex-col", activeTab !== "output" && "hidden md:flex")}>
          <PaneBar label={`${outputLabel} output`}>
            <button type="button" onClick={handleCopy} disabled={!result.output} className={cn(btnGhost, copiedId === "output" && "text-zinc-900")}>
              {copiedId === "output" ? <Check {...iconProps} /> : <Copy {...iconProps} />}
              <span>{copiedId === "output" ? "Copied" : "Copy"}</span>
            </button>
          </PaneBar>
          <div className="relative min-h-0 flex-1">
            <MonacoEditor
              height="100%"
              language={outputLang}
              value={result.output}
              options={OUTPUT_OPTIONS}
            />
          </div>
        </section>
      </div>

      <ToolFooter
        status={empty ? "idle" : result.ok ? "ok" : "error"}
        message={footerMessage}
        meta={formatStats(input.length, empty ? undefined : result.ms)}
      />
    </div>
  );
}
