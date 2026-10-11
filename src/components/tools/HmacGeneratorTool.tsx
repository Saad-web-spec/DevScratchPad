"use client";

import { useState, useEffect, useMemo } from "react";
import {
  generateHmac,
  isHmacAlgorithm,
  extractSignatureCandidates,
  safeEqual,
  type HmacAlgorithm,
  type HmacKeyEncoding,
  type HmacResult,
} from "@/lib/tools/hmac";
import { ShareMenu } from "@/components/ShareMenu";
import { ShieldCheck, ShieldX, Copy, Check, Eye, EyeOff, Dices, Trash2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ToolHeader,
  PaneBar,
  btnPrimary,
  btnSecondary,
  btnIcon,
  selectBase,
  inputBase,
  iconProps,
  ICON_STROKE,
} from "@/components/tools/ToolChrome";
import { getToolIcon } from "@/components/layout/toolIcons";
import { useCopyFlash, useDebouncedValue, CopyIconButton, StatusPill, formatBytes } from "@/components/tools/security/securityUi";

interface HmacGeneratorToolProps {
  onValidationChange: (isValid: boolean, error?: string, line?: number) => void;
  onStatsChange: (length: number, execMs: number) => void;
  onLogHistory?: (input: string) => void;
  restoredInput?: string | null;
}

interface AlgorithmOption {
  value: HmacAlgorithm;
  label: string;
  bits: number;
}

const ALGORITHM_OPTIONS: AlgorithmOption[] = [
  { value: "SHA256", label: "HMAC-SHA256", bits: 256 },
  { value: "SHA512", label: "HMAC-SHA512", bits: 512 },
  { value: "SHA384", label: "HMAC-SHA384", bits: 384 },
  { value: "SHA224", label: "HMAC-SHA224", bits: 224 },
  { value: "SHA1", label: "HMAC-SHA1", bits: 160 },
  { value: "MD5", label: "HMAC-MD5", bits: 128 },
];

const KEY_ENCODINGS: { value: HmacKeyEncoding; label: string }[] = [
  { value: "utf8", label: "UTF-8" },
  { value: "hex", label: "Hex" },
  { value: "base64", label: "Base64" },
];

const OUTPUT_ROWS: { id: keyof HmacResult; label: string }[] = [
  { id: "hex", label: "Hex" },
  { id: "base64", label: "Base64" },
  { id: "base64url", label: "Base64url" },
];

/** Accepts hex (any case), Base64 or Base64url, with or without a "sha256=" / "v1=" prefix. */
function verifySignature(signature: string, result: HmacResult | null): { match: boolean; format: string } | null {
  if (!signature.trim() || !result) return null;
  for (const candidate of extractSignatureCandidates(signature)) {
    if (safeEqual(candidate.toLowerCase(), result.hex)) return { match: true, format: "Hex" };
    if (safeEqual(candidate, result.base64)) return { match: true, format: "Base64" };
    if (safeEqual(candidate.replace(/=+$/, ""), result.base64url)) return { match: true, format: "Base64url" };
  }
  return { match: false, format: "" };
}

export function HmacGeneratorTool({
  onValidationChange,
  onStatsChange,
  onLogHistory,
  restoredInput,
}: HmacGeneratorToolProps) {
  const [secret, setSecret] = useState<string>("");
  const [payload, setPayload] = useState<string>("");
  const [algo, setAlgo] = useState<HmacAlgorithm>("SHA256");
  const [keyEncoding, setKeyEncoding] = useState<HmacKeyEncoding>("utf8");
  const [showSecret, setShowSecret] = useState<boolean>(false);
  const [computed, setComputed] = useState<{ key: string; result: HmacResult | null; error: string | null }>({
    key: "",
    result: null,
    error: null,
  });
  const [compareSignature, setCompareSignature] = useState<string>("");
  const { copiedKey, copy } = useCopyFlash();

  // Recompute ~150ms after typing stops so long payloads never block the inputs.
  const inputs = useMemo(() => ({ secret, payload, algo, keyEncoding }), [secret, payload, algo, keyEncoding]);
  const debounced = useDebouncedValue(inputs, 150);
  const currentKey = `${algo}\u0000${keyEncoding}\u0000${secret}\u0000${payload}`;
  const isStale = computed.key !== currentKey;
  const result = secret ? computed.result : null;
  const hexOutput = result?.hex ?? "";

  // Dispatch workspace state
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("update-workspace-state", {
          detail: { input: payload, output: hexOutput },
        })
      );
    }
  }, [payload, hexOutput]);

  // Restore from history / share URL
  useEffect(() => {
    if (!restoredInput) return;
    try {
      const parsed: unknown = JSON.parse(restoredInput);
      if (parsed && typeof parsed === "object") {
        const data = parsed as Record<string, unknown>;
        /* eslint-disable react-hooks/set-state-in-effect */
        if (typeof data.secret === "string") setSecret(data.secret);
        if (typeof data.payload === "string") setPayload(data.payload);
        if (isHmacAlgorithm(data.algo)) setAlgo(data.algo.toUpperCase() as HmacAlgorithm);
        if (data.keyEncoding === "utf8" || data.keyEncoding === "hex" || data.keyEncoding === "base64") {
          setKeyEncoding(data.keyEncoding);
        }
        /* eslint-enable react-hooks/set-state-in-effect */
        return;
      }
    } catch {}
    setPayload(restoredInput);
  }, [restoredInput]);

  // Compute HMAC (debounced)
  useEffect(() => {
    const { secret: s, payload: p, algo: a, keyEncoding: enc } = debounced;
    const key = `${a}\u0000${enc}\u0000${s}\u0000${p}`;
    let cancelled = false;
    const start = performance.now();

    if (!s) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setComputed({ key, result: null, error: null });
      onValidationChange(true);
      onStatsChange(p.length, 0);
      return;
    }

    generateHmac(s, p, a, enc)
      .then((res) => {
        if (cancelled) return;
        setComputed({ key, result: res, error: null });
        onValidationChange(true);
        onStatsChange(p.length, Math.round((performance.now() - start) * 10) / 10);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Calculation error";
        setComputed({ key, result: null, error: message });
        onValidationChange(false, message);
      });

    return () => {
      cancelled = true;
    };
  }, [debounced, onValidationChange, onStatsChange]);

  const payloadByteCount = useMemo(() => new TextEncoder().encode(payload).length, [payload]);

  // Signature verification
  const verificationResult = verifySignature(compareSignature, result);

  const handleCopy = (text: string, typeKey: string) => {
    if (copy(text, typeKey)) onLogHistory?.(payload);
  };

  // 32 random bytes as hex (256-bit key, no modulo bias).
  const handleGenerateRandomKey = () => {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    setSecret(Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(""));
    setKeyEncoding("utf8");
  };

  const handleClearAll = () => {
    setSecret("");
    setPayload("");
    setCompareSignature("");
  };

  const hasMissingSecret = payload.length > 0 && secret.length === 0;
  const nodeSnippet = `crypto.createHmac('${algo.toLowerCase()}', ${
    keyEncoding === "utf8" ? "secret" : `Buffer.from(secret, '${keyEncoding}')`
  }).update(payload).digest('hex')`;

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto overflow-x-hidden bg-white md:overflow-hidden">
      {/* Tool Header */}
      <ToolHeader
        icon={getToolIcon("hmac-generator")}
        title="HMAC Generator"
        utilities={
          <ShareMenu
            toolSlug="hmac-generator"
            data={{ secret, payload, algo, keyEncoding }}
            imageCode={hexOutput || payload}
            imageLanguage="plaintext"
          />
        }
        options={
          <select
            value={algo}
            onChange={(e) => setAlgo(e.target.value as HmacAlgorithm)}
            className={selectBase}
            aria-label="Hash algorithm"
          >
            {ALGORITHM_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        }
        actions={
          <>
            <button type="button" onClick={handleClearAll} className={btnSecondary} title="Clear all fields">
              <Trash2 {...iconProps} />
              <span>Clear</span>
            </button>
            <button
              type="button"
              onClick={() => handleCopy(hexOutput, "primary")}
              disabled={!hexOutput}
              className={btnPrimary}
            >
              {copiedKey === "primary" ? <Check {...iconProps} /> : <Copy {...iconProps} />}
              <span>{copiedKey === "primary" ? "Copied" : "Copy HMAC"}</span>
            </button>
          </>
        }
      />

      {/* Main Workspace Layout: inputs left, digest + verifier right */}
      <div className="flex flex-1 flex-col md:min-h-0 md:flex-row">
        {/* ================= LEFT: INPUTS ================= */}
        <section className="flex shrink-0 flex-col border-b border-zinc-200 md:min-h-0 md:w-1/2 md:shrink md:border-b-0 md:border-r">
          <PaneBar label="Secret key" className="pr-0.5" />
          <div className="flex flex-col gap-2 p-3 md:p-4">
            <div className="flex items-center gap-2">
              <div className="relative min-w-0 flex-1">
                <input
                  type={showSecret ? "text" : "password"}
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="Enter secret key…"
                  aria-label="Secret key"
                  autoComplete="off"
                  spellCheck={false}
                  className={cn(inputBase, "w-full pr-20 font-mono", hasMissingSecret && "border-amber-400")}
                />
                <div className="absolute right-0.5 top-1/2 flex -translate-y-1/2 items-center md:right-0">
                  <button
                    type="button"
                    onClick={handleGenerateRandomKey}
                    className={btnIcon}
                    title="Generate a random 256-bit key"
                    aria-label="Generate random key"
                  >
                    <Dices {...iconProps} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className={btnIcon}
                    title={showSecret ? "Hide secret" : "Show secret"}
                    aria-label={showSecret ? "Hide secret" : "Show secret"}
                  >
                    {showSecret ? <EyeOff {...iconProps} /> : <Eye {...iconProps} />}
                  </button>
                </div>
              </div>
              <select
                value={keyEncoding}
                onChange={(e) => setKeyEncoding(e.target.value as HmacKeyEncoding)}
                className={selectBase}
                aria-label="Secret key encoding"
                title="How the secret key is decoded into bytes"
              >
                {KEY_ENCODINGS.map((enc) => (
                  <option key={enc.value} value={enc.value}>
                    {enc.label}
                  </option>
                ))}
              </select>
            </div>
            {hasMissingSecret && (
              <p className="flex items-center gap-1.5 text-xs text-amber-700">
                <AlertCircle className="size-3.5 shrink-0" strokeWidth={ICON_STROKE} aria-hidden="true" />
                <span>Secret key is required.</span>
              </p>
            )}
            {computed.error && !isStale && (
              <p className="flex items-center gap-1.5 text-xs text-red-600">
                <AlertCircle className="size-3.5 shrink-0" strokeWidth={ICON_STROKE} aria-hidden="true" />
                <span>{computed.error}</span>
              </p>
            )}
          </div>

          <PaneBar label="Payload" className="border-t" />
          <textarea
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            placeholder="Enter payload string or JSON data to sign…"
            aria-label="Payload"
            spellCheck={false}
            className="block min-h-40 w-full flex-1 resize-y bg-transparent p-3 font-mono text-[13px] leading-relaxed text-zinc-900 outline-none placeholder:text-zinc-400 md:min-h-0 md:resize-none md:p-4"
          />
          <div className="flex h-9 shrink-0 items-center justify-between gap-2 border-t border-zinc-200 bg-zinc-50 px-3 text-[11px] tabular-nums text-zinc-500">
            <span>{payload.length.toLocaleString()} chars</span>
            <span>{formatBytes(payloadByteCount)}</span>
          </div>
        </section>

        {/* ================= RIGHT: OUTPUT ================= */}
        <section className="flex min-w-0 flex-1 flex-col md:min-h-0 md:overflow-y-auto">
          <PaneBar label={`${ALGORITHM_OPTIONS.find((o) => o.value === algo)?.label ?? "HMAC"} digest`} className="pr-3 md:pr-3">
            <span className="text-[11px] text-zinc-400">{ALGORITHM_OPTIONS.find((o) => o.value === algo)?.bits}-bit</span>
          </PaneBar>
          <div className="divide-y divide-zinc-200 border-b border-zinc-200">
            {OUTPUT_ROWS.map((row) => {
              const value = result?.[row.id] ?? "";
              return (
                <div key={row.id} className="flex items-start gap-3 py-2.5 pl-3 pr-1.5 md:pl-4 md:pr-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-semibold text-zinc-900">{row.label}</span>
                    <p
                      className={cn(
                        "mt-1 select-all break-all font-mono text-[13px] leading-relaxed text-zinc-800 transition-opacity",
                        isStale && "opacity-40"
                      )}
                    >
                      {value || <span className="text-zinc-300">{secret ? "—" : "Enter a secret key"}</span>}
                    </p>
                  </div>
                  <CopyIconButton
                    copied={copiedKey === row.id}
                    onClick={() => handleCopy(value, row.id)}
                    disabled={!value}
                    label={`Copy ${row.label} digest`}
                  />
                </div>
              );
            })}
          </div>

          {/* Signature Verifier */}
          <PaneBar label="Verify signature" className="pr-3 md:pr-3">
            {verificationResult &&
              (verificationResult.match ? (
                <StatusPill tone="success" icon={<ShieldCheck className="size-3.5 shrink-0" strokeWidth={ICON_STROKE} aria-hidden="true" />}>
                  Match · {verificationResult.format}
                </StatusPill>
              ) : (
                <StatusPill tone="error" icon={<ShieldX className="size-3.5 shrink-0" strokeWidth={ICON_STROKE} aria-hidden="true" />}>
                  Mismatch
                </StatusPill>
              ))}
          </PaneBar>
          <div className="flex flex-col gap-2 p-3 md:p-4">
            <input
              type="text"
              value={compareSignature}
              onChange={(e) => setCompareSignature(e.target.value)}
              placeholder="sha256=…, t=1718…,v1=…, or a bare hex / Base64 digest"
              aria-label="Expected signature"
              spellCheck={false}
              className={cn(inputBase, "w-full font-mono")}
            />
            <p className="text-xs text-zinc-500">Paste a webhook signature header to check it against the computed digest.</p>
          </div>

          <PaneBar label="Node.js" className="border-t pr-0.5">
            <CopyIconButton copied={copiedKey === "snippet"} onClick={() => handleCopy(nodeSnippet, "snippet")} label="Copy Node.js snippet" />
          </PaneBar>
          <pre className="overflow-x-auto whitespace-pre-wrap break-all p-3 font-mono text-xs leading-relaxed text-zinc-700 md:p-4">
            {nodeSnippet}
          </pre>
        </section>
      </div>
    </div>
  );
}

export const HmacTool = HmacGeneratorTool;
