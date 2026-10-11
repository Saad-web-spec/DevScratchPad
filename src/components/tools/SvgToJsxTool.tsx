"use client";

import { useState, useEffect, useMemo } from "react";
import { MonacoEditor } from "@/components/MonacoEditor";
import { ShareMenu } from "@/components/ShareMenu";
import { Copy, Check, Eraser } from "lucide-react";
import { cn } from "@/lib/utils";
import { addSnapshot } from "@/lib/storage";
import { ToolHeader, PaneBar, MobilePaneTabs, btnGhost, inputBase, segmentTrack, segmentBtn, captionText, iconProps } from "@/components/tools/ToolChrome";
import { getToolIcon } from "@/components/layout/toolIcons";
import { convertSvgToJsx } from "@/components/tools/converters/svgToJsx";
import { ToolFooter, formatStats } from "@/components/tools/converters/ToolFooter";
import { useSettledValue, timed } from "@/components/tools/converters/useSettledValue";
import { useCopyFeedback } from "@/components/tools/converters/useCopyFeedback";

interface SvgToJsxToolProps {
  onValidationChange: (isValid: boolean, error?: string) => void;
  onStatsChange: (length: number, execMs: number) => void;
  restoredInput?: string | null;
}

const DEFAULT_SVG =
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-code"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>';

const INPUT_OPTIONS = { wordWrap: "on" } as const;
const OUTPUT_OPTIONS = { wordWrap: "on", readOnly: true, domReadOnly: true } as const;

export function SvgToJsxTool({ onValidationChange, onStatsChange, restoredInput }: SvgToJsxToolProps) {
  const [input, setInput] = useState<string>(DEFAULT_SVG);
  const [componentName, setComponentName] = useState("SvgIcon");
  const [typescript, setTypescript] = useState(true);
  const [activeTab, setActiveTab] = useState<"input" | "output">("input");
  const [copiedId, copy] = useCopyFeedback();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (restoredInput) setInput(restoredInput);
  }, [restoredInput]);

  const settledInput = useSettledValue(input);
  const result = useMemo(
    () => timed(() => convertSvgToJsx(settledInput, { componentName, typescript })),
    [settledInput, componentName, typescript]
  );
  const output = result.code;

  // Preview the source SVG as an image (images never run scripts embedded in the markup).
  // Inline SVG copied from HTML/JSX often omits xmlns, which a standalone SVG image needs to render.
  const previewSrc = useMemo(() => {
    const svg = settledInput.trim();
    if (!result.ok || !svg) return "";
    const standalone = /<svg\b[^>]*\sxmlns=/i.test(svg) ? svg : svg.replace(/<svg\b/i, '<svg xmlns="http://www.w3.org/2000/svg"');
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(standalone)}`;
  }, [result.ok, settledInput]);

  useEffect(() => {
    onValidationChange(result.ok, result.error);
    onStatsChange(settledInput.length, result.ms);
  }, [result, settledInput, onValidationChange, onStatsChange]);

  useEffect(() => {
    const handleSave = () => {
      addSnapshot("svg-to-jsx", "SVG to JSX", input, output);
    };
    window.addEventListener("save-workspace", handleSave);
    return () => window.removeEventListener("save-workspace", handleSave);
  }, [input, output]);

  const empty = !input.trim();
  const footerStatus = empty ? "idle" : !result.ok ? "error" : result.warnings.length ? "warning" : "ok";
  const footerMessage = empty
    ? "Paste an SVG to convert"
    : !result.ok
      ? `${result.line ? `Line ${result.line}${result.column ? `, Col ${result.column}` : ""}: ` : ""}${result.error}`
      : result.warnings.length
        ? `${result.warnings[0]}${result.warnings.length > 1 ? ` (+${result.warnings.length - 1} more)` : ""}`
        : `Converted ${result.elements} element${result.elements === 1 ? "" : "s"}`;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-white">
      <ToolHeader
        icon={getToolIcon("svg-to-jsx")}
        title="SVG to JSX"
        utilities={<ShareMenu toolSlug="svg-to-jsx" data={input} imageCode={output || input} imageLanguage="typescript" />}
        options={
          <>
            <label className="flex min-w-0 items-center gap-2">
              <span className="whitespace-nowrap text-[13px] font-medium text-zinc-500 md:text-xs">Name</span>
              <input
                type="text"
                value={componentName}
                onChange={(e) => setComponentName(e.target.value)}
                placeholder="SvgIcon"
                spellCheck={false}
                aria-label="Component name"
                className={cn(inputBase, "w-36 min-w-0 font-mono")}
              />
            </label>
            <div className={segmentTrack} role="group" aria-label="Output flavour">
              <button type="button" aria-pressed={typescript} onClick={() => setTypescript(true)} className={segmentBtn(typescript)}>
                TSX
              </button>
              <button type="button" aria-pressed={!typescript} onClick={() => setTypescript(false)} className={segmentBtn(!typescript)}>
                JSX
              </button>
            </div>
          </>
        }
      />

      <MobilePaneTabs
        tabs={[
          { id: "input", label: "SVG" },
          { id: "output", label: typescript ? "TSX" : "JSX" },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      <div className="flex min-h-0 w-full flex-1 flex-col md:flex-row">
        <section className={cn("flex min-h-0 min-w-0 flex-1 flex-col border-zinc-200 md:border-r", activeTab !== "input" && "hidden md:flex")}>
          <PaneBar label="SVG markup">
            <button type="button" onClick={() => setInput("")} disabled={empty} className={btnGhost} title="Clear input">
              <Eraser {...iconProps} />
              <span>Clear</span>
            </button>
          </PaneBar>
          <div className="relative min-h-0 flex-1">
            <MonacoEditor height="100%" language="xml" value={input} onChange={(v) => setInput(v || "")} options={INPUT_OPTIONS} />
          </div>
          {previewSrc && (
            <div className="flex h-24 shrink-0 items-center gap-4 border-t border-zinc-200 bg-zinc-50 px-3 md:h-28">
              <span className={captionText}>Preview</span>
              <div className="flex min-w-0 flex-1 items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element -- data: URL preview of user input, nothing to optimise */}
                <img src={previewSrc} alt="SVG preview" className="max-h-16 max-w-full object-contain md:max-h-20" />
              </div>
            </div>
          )}
        </section>

        <section className={cn("flex min-h-0 min-w-0 flex-1 flex-col", activeTab !== "output" && "hidden md:flex")}>
          <PaneBar label={typescript ? "TSX component" : "JSX component"}>
            <button type="button" onClick={() => copy(output, "output")} disabled={!output} className={cn(btnGhost, copiedId === "output" && "text-zinc-900")}>
              {copiedId === "output" ? <Check {...iconProps} /> : <Copy {...iconProps} />}
              <span>{copiedId === "output" ? "Copied" : "Copy"}</span>
            </button>
          </PaneBar>
          <div className="relative min-h-0 flex-1">
            <MonacoEditor height="100%" language="typescript" value={output} options={OUTPUT_OPTIONS} />
          </div>
        </section>
      </div>

      <ToolFooter status={footerStatus} message={footerMessage} meta={formatStats(input.length, empty ? undefined : result.ms)} />
    </div>
  );
}
