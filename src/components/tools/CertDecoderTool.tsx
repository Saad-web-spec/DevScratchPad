"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import type * as CertDecoderLib from "@/lib/tools/cert-decoder";
import type { DecodedBundle, DecodedCertificate } from "@/lib/tools/cert-decoder";
import { ShareMenu } from "@/components/ShareMenu";
import { Copy, Check, Trash2, Upload, ShieldAlert, FileBadge } from "lucide-react";
import { cn } from "@/lib/utils";
import { addSnapshot } from "@/lib/storage";
import {
  ToolHeader,
  PaneBar,
  MobilePaneTabs,
  btnSecondary,
  btnGhost,
  btnIcon,
  chipBtn,
  iconProps,
} from "@/components/tools/ToolChrome";
import { getToolIcon } from "@/components/layout/toolIcons";
import { CertDetails, ROLE_LABELS } from "@/components/tools/security/cert/CertDetails";

interface CertDecoderToolProps {
  onValidationChange: (isValid: boolean, error?: string) => void;
  onStatsChange: (length: number, execMs: number) => void;
  onLogHistory?: (input: string) => void;
  restoredInput?: string | null;
}

type Pane = "input" | "details";
const PANE_TABS: { id: Pane; label: string }[] = [
  { id: "input", label: "Input" },
  { id: "details", label: "Details" },
];

const NO_ITEMS: DecodedCertificate[] = [];

/** Typing waits this long before decoding; pastes, samples and uploads decode at once. */
const TYPING_DEBOUNCE_MS = 200;

/**
 * @peculiar/x509 + reflect-metadata are heavy, so the decoder is a separate chunk that loads on
 * first use (or when the user focuses the input) instead of with the page.
 */
let decoderPromise: Promise<typeof CertDecoderLib> | null = null;
function loadDecoder(): Promise<typeof CertDecoderLib> {
  decoderPromise ??= import("@/lib/tools/cert-decoder").catch((err: unknown) => {
    decoderPromise = null;
    throw err;
  });
  return decoderPromise;
}
const warmDecoder = () => {
  loadDecoder().catch(() => undefined);
};

/** Wraps binary DER (.cer / .der uploads) as base64 so the decoder can read it. */
function derToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return (btoa(binary).match(/.{1,64}/g) ?? []).join("\n");
}

async function readCertFile(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  // DER always starts with an ASN.1 SEQUENCE (0x30) followed by a length byte; PEM is text.
  if (bytes[0] === 0x30 && (bytes[1] & 0x80) !== 0) return derToBase64(bytes);
  return new TextDecoder().decode(bytes);
}

export function CertDecoderTool({
  onValidationChange,
  onStatsChange,
  onLogHistory,
  restoredInput,
}: CertDecoderToolProps) {
  const [input, setInput] = useState<string>(restoredInput ?? "");
  const [decoded, setDecoded] = useState<{ input: string; bundle: DecodedBundle } | null>(null);
  const [selected, setSelected] = useState(0);
  const [pane, setPane] = useState<Pane>("input");
  const [dragging, setDragging] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [prevRestored, setPrevRestored] = useState(restoredInput);
  const lastDecodedRef = useRef("");
  const copyTimerRef = useRef<number | undefined>(undefined);

  // Restore from history
  if (restoredInput !== prevRestored) {
    setPrevRestored(restoredInput);
    if (restoredInput) {
      setInput(restoredInput);
      setSelected(0);
    }
  }

  // Decode when input changes (debounced while typing, cancelled when stale)
  useEffect(() => {
    const text = input;
    const previous = lastDecodedRef.current;
    if (!text.trim()) {
      lastDecodedRef.current = "";
      onValidationChange(true);
      onStatsChange(0, 0);
      return;
    }

    let cancelled = false;
    const isJump = !previous.trim() || Math.abs(text.length - previous.length) > 32;
    const timer = window.setTimeout(async () => {
      lastDecodedRef.current = text;
      try {
        const { decodePemBundle } = await loadDecoder();
        if (cancelled) return;
        const start = performance.now();
        const bundle = await decodePemBundle(text);
        if (cancelled) return;
        setDecoded({ input: text, bundle });
        onStatsChange(text.length, Math.round((performance.now() - start) * 10) / 10);
        const failed = bundle.items.find((item) => !item.valid);
        onValidationChange(!failed, failed?.error);
      } catch {
        if (cancelled) return;
        const error = "Could not load the certificate decoder. Check your connection and try again.";
        setDecoded({ input: text, bundle: { items: [{ type: "certificate", valid: false, error }], skipped: [] } });
        onValidationChange(false, error);
      }
    }, isJump ? 0 : TYPING_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [input, onValidationChange, onStatsChange]);

  useEffect(() => () => window.clearTimeout(copyTimerRef.current), []);

  const hasInput = input.trim().length > 0;
  const items = hasInput && decoded ? decoded.bundle.items : NO_ITEMS;
  const index = Math.min(selected, Math.max(0, items.length - 1));
  const current = items[index];

  // Save workspace snapshot
  useEffect(() => {
    const handleSave = () => {
      const output = items.length > 1 ? items : (items[0] ?? null);
      addSnapshot("cert-decoder", "X.509 Certificate Decoder", input, JSON.stringify(output, null, 2));
    };
    window.addEventListener("save-workspace", handleSave);
    return () => window.removeEventListener("save-workspace", handleSave);
  }, [input, items]);

  const handleCopy = useCallback(
    (text: string, key: string) => {
      if (!text) return;
      navigator.clipboard
        ?.writeText(text)
        .then(() => {
          setCopiedKey(key);
          window.clearTimeout(copyTimerRef.current);
          copyTimerRef.current = window.setTimeout(() => setCopiedKey(null), 1500);
        })
        .catch(() => undefined);
      onLogHistory?.(input);
    },
    [input, onLogHistory]
  );

  const loadText = (text: string, showDetails: boolean) => {
    setInput(text);
    setSelected(0);
    if (showDetails) setPane("details");
  };

  const loadFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      loadText(await readCertFile(file), true);
    } catch {
      onValidationChange(false, `Could not read ${file.name}.`);
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    void loadFile(e.target.files?.[0]);
    e.target.value = "";
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    if (!e.dataTransfer.files.length) return;
    e.preventDefault();
    setDragging(false);
    void loadFile(e.dataTransfer.files[0]);
  };

  const copyJson = () => {
    if (!current?.valid) return;
    handleCopy(JSON.stringify(current, (key, value: unknown) => (key === "rawPem" ? undefined : value), 2), "json");
  };


  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <ToolHeader
        icon={getToolIcon("cert-decoder")}
        title="X.509 Certificate Decoder"
        utilities={<ShareMenu toolSlug="cert-decoder" data={input} imageCode={input} imageLanguage="text" />}
        actions={
          <label
            className={cn(btnSecondary, "cursor-pointer focus-within:ring-2 focus-within:ring-zinc-900")}
            onPointerEnter={warmDecoder}
          >
            <Upload {...iconProps} />
            <span>Upload</span>
            <input type="file" className="sr-only" onChange={handleFileUpload} accept=".pem,.crt,.cer,.der,.csr,.txt" />
          </label>
        }
      />

      <MobilePaneTabs tabs={PANE_TABS} active={pane} onChange={setPane} />

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* Left Pane: PEM input */}
        <div
          className={cn(
            "min-h-0 min-w-0 flex-1 flex-col md:flex md:border-r md:border-zinc-200",
            pane === "input" ? "flex" : "hidden",
            dragging && "ring-2 ring-inset ring-zinc-900"
          )}
          onDragOver={(e) => {
            if (!e.dataTransfer.types.includes("Files")) return;
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <PaneBar label="PEM input">
            <button
              type="button"
              onClick={() => loadText("", false)}
              className={btnIcon}
              title="Clear input"
              aria-label="Clear input"
              disabled={!input}
            >
              <Trash2 {...iconProps} />
            </button>
          </PaneBar>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={warmDecoder}
            placeholder={"Paste a certificate, fullchain.pem or CSR\n\n-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"}
            aria-label="PEM certificate or CSR input"
            className="block min-h-0 w-full min-w-0 flex-1 resize-none break-all border-0 bg-transparent p-4 font-mono text-[13px] leading-relaxed text-zinc-900 outline-none placeholder:text-zinc-400 focus:ring-0 md:text-xs"
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
          />
        </div>

        {/* Right Pane: Parsed Output */}
        <div className={cn("min-h-0 min-w-0 flex-1 flex-col md:flex", pane === "details" ? "flex" : "hidden")}>
          <PaneBar label={current?.valid ? (current.type === "csr" ? "CSR details" : "Certificate details") : "Details"}>
            {items.length > 1 && current?.rawPem && (
              <button type="button" onClick={() => handleCopy(current.rawPem ?? "", "pem")} className={btnGhost}>
                {copiedKey === "pem" ? <Check {...iconProps} /> : <Copy {...iconProps} />}
                <span>Copy PEM</span>
              </button>
            )}
            <button type="button" onClick={copyJson} className={btnGhost} disabled={!current?.valid}>
              {copiedKey === "json" ? <Check {...iconProps} /> : <Copy {...iconProps} />}
              <span>Copy JSON</span>
            </button>
          </PaneBar>

          {items.length > 1 && (
            <div className="flex shrink-0 flex-wrap gap-1.5 border-b border-zinc-200 px-3 py-2" aria-label="Blocks in this input">
              {items.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  aria-pressed={i === index}
                  onClick={() => setSelected(i)}
                  title={item.subject?.commonName ?? item.error}
                  className={cn(chipBtn(i === index), "h-10 md:h-8", !item.valid && i !== index && "text-red-700")}
                >
                  {i + 1} · {item.valid && item.role ? ROLE_LABELS[item.role] : "Invalid"}
                </button>
              ))}
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto">
            {!hasInput ? (
              /* Empty state */
              <div className="flex min-h-full flex-col items-center justify-center gap-3 px-6 py-12 text-center">
                <FileBadge className="size-6 text-zinc-300" strokeWidth={iconProps.strokeWidth} aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-zinc-900">Paste a certificate, chain or CSR</p>
                  <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-zinc-500">
                    PEM or base64 DER. Decoded in your browser; nothing is uploaded.
                  </p>
                </div>
              </div>
            ) : !current ? (
              <p className="px-4 py-4 text-[13px] text-zinc-500">Decoding…</p>
            ) : !current.valid ? (
              /* Error state (flat) */
              <div>
                <div className="flex items-start gap-2 border-b border-red-100 bg-red-50 px-4 py-3 text-red-700">
                  <ShieldAlert {...iconProps} className="mt-0.5 size-4 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium">Could not decode this block</p>
                    <p className="mt-1 break-words font-mono text-xs leading-5">{current.error}</p>
                  </div>
                </div>
                <p className="px-4 py-3 text-xs leading-relaxed text-zinc-500">
                  Tip: paste the whole block, including the <span className="break-all font-mono">-----BEGIN CERTIFICATE-----</span>{" "}
                  and <span className="break-all font-mono">-----END CERTIFICATE-----</span> lines.
                </p>
              </div>
            ) : (
              <>
                {decoded && decoded.bundle.skipped.length > 0 && (
                  <p className="border-b border-zinc-100 px-4 py-2 text-xs text-zinc-500">
                    Ignored {decoded.bundle.skipped.join(", ")} {decoded.bundle.skipped.length === 1 ? "block" : "blocks"}.
                  </p>
                )}
                <CertDetails cert={current} items={items} copiedKey={copiedKey} onCopy={handleCopy} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
