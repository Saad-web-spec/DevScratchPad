"use client";

import { useState, useEffect, useMemo, useRef, useDeferredValue, type ReactNode } from "react";
import { ShareMenu } from "@/components/ShareMenu";
import { Trash2, ShieldCheck, ShieldX, ShieldAlert, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { addSnapshot } from "@/lib/storage";
import { ToolHeader, PaneBar, MobilePaneTabs, btnGhost, inputBase, iconProps, ICON_STROKE } from "@/components/tools/ToolChrome";
import { getToolIcon } from "@/components/layout/toolIcons";
import { useCopyFlash, CopyIconButton, StatusPill, type PillTone } from "@/components/tools/security/securityUi";
import {
  decodeJwt,
  verifyJwtSignature,
  verificationKeyType,
  relativeTime,
  CLAIM_LABELS,
  type JsonValue,
  type VerifyOutcome,
} from "@/components/tools/security/jwt";

const TIME_CLAIMS = new Set(["exp", "iat", "nbf", "auth_time"]);
const pillIcon = "size-3.5 shrink-0";

// A simple recursive JSON viewer with smart claim annotations (dates for time claims, names for registered claims)
function JsonViewer({ data, level = 0, isLast = true, nowMs }: { data: JsonValue; level?: number; isLast?: boolean; nowMs: number }): ReactNode {
  const comma = isLast ? "" : ",";
  if (data === null) return <span className="text-zinc-400">null{comma}</span>;
  if (typeof data === "boolean" || typeof data === "number") {
    return <span className="font-medium text-zinc-900">{String(data)}{comma}</span>;
  }
  if (typeof data === "string") return <span className="text-zinc-900">&quot;{data}&quot;{comma}</span>;

  const indent = "  ".repeat(level);
  const nextIndent = "  ".repeat(level + 1);

  if (Array.isArray(data)) {
    if (data.length === 0) return <span>[]{comma}</span>;
    return (
      <span>
        [{"\n"}
        {data.map((item, i) => (
          <span key={i}>
            {nextIndent}
            <JsonViewer data={item} level={level + 1} isLast={i === data.length - 1} nowMs={nowMs} />
            {"\n"}
          </span>
        ))}
        {indent}]{comma}
      </span>
    );
  }

  const entries = Object.entries(data);
  if (entries.length === 0) return <span>{"{}"}{comma}</span>;

  return (
    <span>
      {"{"}
      {"\n"}
      {entries.map(([key, val], i) => {
        const hint = level === 0 ? CLAIM_LABELS[key] : undefined;
        let note: string | null = null;
        if (level === 0 && TIME_CLAIMS.has(key) && typeof val === "number") {
          const ms = val * 1000;
          const date = new Date(ms);
          if (!Number.isNaN(date.getTime())) note = `${date.toLocaleString()} · ${relativeTime(ms, nowMs)}`;
        }
        return (
          <span key={key}>
            {nextIndent}
            <span className="text-zinc-500" title={hint}>&quot;{key}&quot;</span>
            <span className="text-zinc-400">: </span>
            <JsonViewer data={val} level={level + 1} isLast={i === entries.length - 1} nowMs={nowMs} />
            {note && <span className="select-none text-zinc-400">{"  "}{`// ${note}`}</span>}
            {"\n"}
          </span>
        );
      })}
      {indent}
      {"}"}
      {comma}
    </span>
  );
}

interface JwtDecoderToolProps {
  onValidationChange: (isValid: boolean, error?: string) => void;
  onStatsChange: (length: number, execMs: number) => void;
  restoredInput?: string | null;
}

export function JwtDecoderTool({ onValidationChange, onStatsChange, restoredInput }: JwtDecoderToolProps) {
  const [input, setInput] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [verification, setVerification] = useState<(VerifyOutcome & { key: string }) | null>(null);
  const [activeTab, setActiveTab] = useState<"input" | "output">("input");
  const [nowMs, setNowMs] = useState(() => Date.now());
  const { copiedKey, copy } = useCopyFlash();
  const overlayRef = useRef<HTMLDivElement>(null);

  // Restore from history
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (restoredInput) setInput(restoredInput);
  }, [restoredInput]);

  // Keep relative times ("expires in 5 minutes") fresh without re-rendering on every tick.
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Decoding is cheap, but a deferred value keeps typing smooth when a huge blob is pasted.
  const token = useDeferredValue(input);
  const decoded = useMemo(() => decodeJwt(token), [token]);
  const { header, payload, signature } = decoded;
  const headerJson = useMemo(() => (header ? JSON.stringify(header, null, 2) : ""), [header]);
  const payloadJson = useMemo(() => (payload ? JSON.stringify(payload, null, 2) : ""), [payload]);

  useEffect(() => {
    onValidationChange(decoded.valid, decoded.error);
    onStatsChange(token.length, 0);
  }, [decoded, token.length, onValidationChange, onStatsChange]);

  // Save workspace snapshot
  useEffect(() => {
    const handleSave = () => {
      addSnapshot("jwt", "JWT Decoder", input, payloadJson);
    };
    window.addEventListener("save-workspace", handleSave);
    return () => window.removeEventListener("save-workspace", handleSave);
  }, [input, payloadJson]);

  const alg = typeof header?.alg === "string" ? header.alg : undefined;
  const keyType = verificationKeyType(alg);
  const verifyKey = `${alg}\u0000${token}\u0000${secret}`;

  // Verify the signature whenever the token, algorithm or key changes (WebCrypto, async).
  useEffect(() => {
    if (!alg || !keyType || !signature || !secret.trim()) return;
    let active = true;
    verifyJwtSignature(token, alg, secret).then((res) => {
      if (active) setVerification({ ...res, key: verifyKey });
    });
    return () => {
      active = false;
    };
  }, [alg, keyType, signature, secret, token, verifyKey]);

  const outcome = verification?.key === verifyKey ? verification : null;
  const sigState: { tone: PillTone; label: string; icon: ReactNode } = !header
    ? { tone: "neutral", label: "No token", icon: null }
    : alg === "none"
      ? { tone: "warning", label: "Unsigned (alg none)", icon: <ShieldAlert className={pillIcon} strokeWidth={ICON_STROKE} aria-hidden="true" /> }
      : !keyType
        ? { tone: "neutral", label: "Unsupported alg", icon: null }
        : !secret.trim()
          ? { tone: "neutral", label: "Not verified", icon: null }
          : !outcome
            ? { tone: "neutral", label: "Checking…", icon: null }
            : outcome.status === "valid"
              ? { tone: "success", label: "Signature verified", icon: <ShieldCheck className={pillIcon} strokeWidth={ICON_STROKE} aria-hidden="true" /> }
              : outcome.status === "invalid"
                ? { tone: "error", label: "Invalid signature", icon: <ShieldX className={pillIcon} strokeWidth={ICON_STROKE} aria-hidden="true" /> }
                : { tone: "warning", label: "Key error", icon: <ShieldAlert className={pillIcon} strokeWidth={ICON_STROKE} aria-hidden="true" /> };

  // Lifetime summary from exp / nbf.
  const lifetime = useMemo((): { tone: PillTone; label: string } | null => {
    if (!payload) return null;
    const exp = typeof payload.exp === "number" ? payload.exp * 1000 : undefined;
    const nbf = typeof payload.nbf === "number" ? payload.nbf * 1000 : undefined;
    if (nbf !== undefined && nbf > nowMs) return { tone: "warning", label: `Not valid until ${relativeTime(nbf, nowMs).replace(/^in /, "")} from now` };
    if (exp === undefined) return { tone: "neutral", label: "No expiry" };
    return exp <= nowMs
      ? { tone: "error", label: `Expired ${relativeTime(exp, nowMs)}` }
      : { tone: "success", label: `Expires ${relativeTime(exp, nowMs)}` };
  }, [payload, nowMs]);

  const parts = input.split(".");
  const headerPart = parts[0] || "";
  const payloadPart = parts[1] !== undefined ? parts[1] : null;
  const signaturePart = parts[2] !== undefined ? parts.slice(2).join(".") : null;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-white">
      {/* Top Controls Bar (Unified Clean Header) */}
      <ToolHeader
        icon={getToolIcon("jwt")}
        title="JWT Decoder"
        utilities={
          <ShareMenu toolSlug="jwt" data={input} imageCode={payloadJson || input} imageLanguage="json" />
        }
      />

      <MobilePaneTabs
        tabs={[
          { id: "input", label: "Token" },
          { id: "output", label: "Decoded" },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      {/* Main Workspace Layout (Dual Pane) */}
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* Left Pane: Encoded Input */}
        <section
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col md:border-r md:border-zinc-200",
            activeTab !== "input" && "hidden md:flex"
          )}
        >
          <PaneBar label="Encoded token">
            <button type="button" onClick={() => setInput("")} disabled={!input} className={btnGhost} title="Clear token">
              <Trash2 {...iconProps} />
              <span>Clear</span>
            </button>
            <CopyIconButton copied={copiedKey === "input"} onClick={() => copy(input, "input")} disabled={!input} label="Copy token" />
          </PaneBar>

          {/* Colored overlay (header / payload / signature) behind a transparent textarea; scroll is mirrored */}
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <div
              ref={overlayRef}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-all p-3 font-mono text-[13px] leading-[1.6] md:p-4"
            >
              <span className="text-zinc-900">{headerPart}</span>
              {payloadPart !== null && <span className="text-zinc-300">.</span>}
              {payloadPart !== null && <span className="text-zinc-500">{payloadPart}</span>}
              {signaturePart !== null && <span className="text-zinc-300">.</span>}
              {signaturePart !== null && <span className="text-zinc-400">{signaturePart}</span>}
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onScroll={(e) => {
                if (overlayRef.current) overlayRef.current.scrollTop = e.currentTarget.scrollTop;
              }}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              placeholder="Paste a JWT (eyJhbGciOi…)"
              aria-label="Encoded JWT"
              className="absolute inset-0 h-full w-full resize-none whitespace-pre-wrap break-all bg-transparent p-3 font-mono text-[13px] leading-[1.6] text-transparent caret-zinc-900 outline-none selection:bg-zinc-200 placeholder:text-zinc-400 md:p-4"
            />
          </div>

          <div className="flex h-9 shrink-0 items-center gap-2 border-t border-zinc-200 bg-zinc-50 px-3 text-[11px] text-zinc-500">
            {!decoded.valid ? (
              <span className="flex min-w-0 items-center gap-1.5 font-medium text-red-600">
                <AlertCircle className="size-3.5 shrink-0" strokeWidth={ICON_STROKE} aria-hidden="true" />
                <span className="truncate">{decoded.error}</span>
              </span>
            ) : header ? (
              <span className="flex min-w-0 items-center gap-3 truncate">
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-zinc-900" />Header</span>
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-zinc-500" />Payload</span>
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-zinc-300" />Signature</span>
              </span>
            ) : (
              <span>Decoded locally. Tokens never leave your browser.</span>
            )}
            <span className="ml-auto shrink-0 tabular-nums">{input.length.toLocaleString()} chars</span>
          </div>
        </section>

        {/* Right Pane: Decoded Output */}
        <section
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto",
            activeTab !== "output" && "hidden md:flex"
          )}
        >
          {!header || !payload ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
              <p className="text-sm text-zinc-500">
                {decoded.valid ? "Paste a token to see its header, claims and signature." : "This token could not be decoded."}
              </p>
            </div>
          ) : (
            <>
              <PaneBar
                label={
                  <span className="flex items-center gap-2">
                    Header
                    {alg && (
                      <StatusPill tone={alg === "none" ? "warning" : "strong"} className="h-5 font-mono">
                        {alg}
                      </StatusPill>
                    )}
                  </span>
                }
              >
                <CopyIconButton copied={copiedKey === "header"} onClick={() => copy(headerJson, "header")} label="Copy header JSON" />
              </PaneBar>
              <pre className="shrink-0 overflow-x-auto whitespace-pre-wrap break-all px-3 py-3 font-mono text-[13px] leading-relaxed md:px-4">
                <JsonViewer data={header} nowMs={nowMs} />
              </pre>

              <PaneBar
                label={
                  <span className="flex items-center gap-2">
                    Payload
                    {lifetime && (
                      <StatusPill tone={lifetime.tone} className="h-5" icon={<Clock className="size-3 shrink-0" strokeWidth={ICON_STROKE} aria-hidden="true" />}>
                        {lifetime.label}
                      </StatusPill>
                    )}
                  </span>
                }
                className="border-t"
              >
                <CopyIconButton copied={copiedKey === "payload"} onClick={() => copy(payloadJson, "payload")} label="Copy payload JSON" />
              </PaneBar>
              <pre className="shrink-0 overflow-x-auto whitespace-pre-wrap break-all px-3 py-3 font-mono text-[13px] leading-relaxed md:px-4">
                <JsonViewer data={payload} nowMs={nowMs} />
              </pre>

              {/* Signature Section */}
              <PaneBar label="Signature" className="border-t">
                <span className="pr-3 md:pr-2">
                  <StatusPill tone={sigState.tone} icon={sigState.icon}>{sigState.label}</StatusPill>
                </span>
              </PaneBar>
              <div className="flex flex-col gap-3 px-3 py-3 md:px-4">
                <p className="break-all font-mono text-xs leading-relaxed text-zinc-400">{signature || "No signature"}</p>
                {keyType === "secret" && (
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-zinc-700">{alg} secret</span>
                    <input
                      type="text"
                      value={secret}
                      onChange={(e) => setSecret(e.target.value)}
                      spellCheck={false}
                      autoComplete="off"
                      placeholder="Enter the secret to verify the signature"
                      className={cn(inputBase, "w-full font-mono")}
                    />
                  </label>
                )}
                {keyType === "public-key" && (
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-zinc-700">{alg} public key</span>
                    <textarea
                      value={secret}
                      onChange={(e) => setSecret(e.target.value)}
                      spellCheck={false}
                      rows={4}
                      placeholder={"-----BEGIN PUBLIC KEY-----\n…\n-----END PUBLIC KEY-----   or a JWK"}
                      className="w-full resize-y rounded-md border border-zinc-200 bg-white px-3 py-2 font-mono text-xs text-zinc-900 transition-colors placeholder:text-zinc-400 hover:border-zinc-300 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    />
                  </label>
                )}
                {outcome?.status === "error" && outcome.message && (
                  <p className="flex items-start gap-1.5 text-xs text-red-600">
                    <AlertCircle className="mt-px size-3.5 shrink-0" strokeWidth={ICON_STROKE} aria-hidden="true" />
                    <span className="break-words">{outcome.message}</span>
                  </p>
                )}
                {!keyType && alg && (
                  <p className="text-xs text-zinc-500">
                    {alg === "none"
                      ? "This token is not signed. Never accept alg \"none\" on a server."
                      : `Signature verification is not available for ${alg}.`}
                  </p>
                )}
                <p className="text-[11px] text-zinc-400">Verified locally with WebCrypto. Secrets and keys are never stored or sent.</p>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
