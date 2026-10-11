"use client";

import { useState, useEffect, useRef, useMemo, type KeyboardEvent, type ReactNode } from "react";
import {
  generatePasswordHash,
  verifyPasswordHash,
  detectHashAlgorithm,
  generateRandomSalt,
  BCRYPT_MAX_BYTES,
  type PasswordAlgorithm,
  type HashGenerationResult,
  type HashVerificationResult,
} from "@/lib/tools/password-hash";
import { ShareMenu } from "@/components/ShareMenu";
import {
  RefreshCw,
  Eye,
  EyeOff,
  AlertCircle,
  Trash2,
  Loader2,
  ShieldCheck,
  ShieldX,
  KeyRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { addSnapshot } from "@/lib/storage";
import {
  ToolHeader,
  PaneBar,
  btnPrimary,
  btnSecondary,
  btnGhost,
  btnIcon,
  inputBase,
  segmentTrack,
  segmentBtn,
  chipBtn,
  iconProps,
  ICON_STROKE,
} from "@/components/tools/ToolChrome";
import { getToolIcon } from "@/components/layout/toolIcons";
import { useCopyFlash, CopyIconButton, StatusPill } from "@/components/tools/security/securityUi";

interface PasswordHashToolProps {
  onValidationChange: (isValid: boolean, error?: string) => void;
  onStatsChange: (length: number, execMs: number) => void;
  onLogHistory?: (input: string) => void;
  restoredInput?: string | null;
}

const ALGORITHMS: { id: PasswordAlgorithm; name: string; tag: string; description: string }[] = [
  {
    id: "bcrypt",
    name: "Bcrypt",
    tag: "Industry Standard",
    description: "Battle-tested adaptive hashing for web authentication ($2a/$2b).",
  },
  {
    id: "argon2id",
    name: "Argon2id",
    tag: "Modern & Memory-Hard",
    description: "PHC Winner. Highly resistant to GPU/ASIC cracking attacks.",
  },
  {
    id: "pbkdf2-sha256",
    name: "PBKDF2 (SHA-256)",
    tag: "NIST Approved",
    description: "Standard password key derivation with configurable iteration rounds.",
  },
  {
    id: "pbkdf2-sha512",
    name: "PBKDF2 (SHA-512)",
    tag: "High Entropy",
    description: "SHA-512 variant for enhanced digest resistance.",
  },
  {
    id: "scrypt",
    name: "SCrypt",
    tag: "Memory Hard",
    description: "Sequential memory-hard function for hardware cracking resistance.",
  },
];

const SAMPLE_PASSWORD = "CorrectHorseBatteryStaple!2026";
// bcryptjs-generated $2b$ hash of SAMPLE_PASSWORD (cost 10), so the verify sample reports a match.
const SAMPLE_HASH = "$2b$10$N7pwhXq2cppNAoMs/jZcCuk6q7ax/3o0eVNZveDi8bzDQs71eTcPy";

const labelClass = "text-xs font-medium text-zinc-700";
const pillIcon = "size-3.5 shrink-0";

export function PasswordHashTool({
  onValidationChange,
  onStatsChange,
  onLogHistory,
  restoredInput,
}: PasswordHashToolProps) {
  const [mode, setMode] = useState<"generate" | "verify">("generate");

  // Generator State
  const [algo, setAlgo] = useState<PasswordAlgorithm>("bcrypt");
  const [password, setPassword] = useState<string>(SAMPLE_PASSWORD);
  const [showPassword, setShowPassword] = useState(false);
  const [bcryptRounds, setBcryptRounds] = useState(10);
  const [pbkdf2Iterations, setPbkdf2Iterations] = useState(100000);
  const [salt, setSalt] = useState<string>(() => generateRandomSalt(16));
  const [genResult, setGenResult] = useState<(HashGenerationResult & { key: string }) | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  // Verifier State
  const [verifyHash, setVerifyHash] = useState<string>(SAMPLE_HASH);
  const [verifyPassword, setVerifyPassword] = useState<string>(SAMPLE_PASSWORD);
  const [verifyResult, setVerifyResult] = useState<(HashVerificationResult & { key: string }) | null>(null);

  const { copiedKey, copy } = useCopyFlash();
  // Ignore results from an older run if the user fires again before it finishes.
  const runId = useRef(0);

  const genKey = `${algo}\u0000${password}\u0000${algo === "bcrypt" ? bcryptRounds : pbkdf2Iterations}\u0000${algo === "bcrypt" ? "" : salt}`;
  const verifyKey = `${verifyHash}\u0000${verifyPassword}`;
  const genStale = genResult !== null && genResult.key !== genKey;
  const verifyStale = verifyResult !== null && verifyResult.key !== verifyKey;
  const passwordBytes = useMemo(() => new TextEncoder().encode(password).length, [password]);
  const detected = detectHashAlgorithm(verifyHash);

  // Restore from history / share link: a shared hash string opens the verifier.
  useEffect(() => {
    if (restoredInput && restoredInput.trim().startsWith("$")) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setMode("verify");
      setVerifyHash(restoredInput.trim());
      setVerifyPassword("");
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [restoredInput]);

  // Generate Hash (heavy libraries are lazy-loaded inside the lib on first use)
  const handleGenerate = async () => {
    const id = ++runId.current;
    const key = genKey;
    setIsBusy(true);
    setGenError(null);
    const start = performance.now();
    try {
      const res = await generatePasswordHash({
        algorithm: algo,
        password,
        bcryptRounds,
        pbkdf2Iterations,
        salt,
      });
      if (id !== runId.current) return;
      setGenResult({ ...res, key });
      onValidationChange(true);
      onStatsChange(password.length, Math.round((performance.now() - start) * 10) / 10);
      onLogHistory?.(`Hashed password with ${algo}`);
    } catch (err: unknown) {
      if (id !== runId.current) return;
      const message = err instanceof Error ? err.message : "Hash generation failed";
      setGenError(message);
      onValidationChange(false, message);
    } finally {
      if (id === runId.current) setIsBusy(false);
    }
  };

  // Verify Hash
  const handleVerify = async () => {
    const id = ++runId.current;
    const key = verifyKey;
    setIsBusy(true);
    const start = performance.now();
    try {
      const res = await verifyPasswordHash(verifyPassword, verifyHash);
      if (id !== runId.current) return;
      setVerifyResult({ ...res, key });
      onValidationChange(!res.error, res.error);
      onStatsChange(verifyHash.length, Math.round((performance.now() - start) * 10) / 10);
    } finally {
      if (id === runId.current) setIsBusy(false);
    }
  };

  const runAction = () => {
    if (isBusy) return;
    if (mode === "generate") void handleGenerate();
    else void handleVerify();
  };

  // Save workspace snapshot
  useEffect(() => {
    const handleSave = () => {
      const payload =
        mode === "generate"
          ? { mode, algo, hash: genResult?.hash }
          : { mode, verifyHash, isMatch: verifyResult?.isMatch };
      addSnapshot("password-hash", "Password Hash Verifier & Generator", mode === "generate" ? password : verifyHash, JSON.stringify(payload, null, 2));
    };
    window.addEventListener("save-workspace", handleSave);
    return () => window.removeEventListener("save-workspace", handleSave);
  }, [mode, algo, password, genResult, verifyHash, verifyResult]);

  const handleClear = () => {
    runId.current++;
    setIsBusy(false);
    if (mode === "generate") {
      setPassword("");
      setGenResult(null);
      setGenError(null);
    } else {
      setVerifyHash("");
      setVerifyPassword("");
      setVerifyResult(null);
    }
  };

  const switchMode = (next: "generate" | "verify") => {
    runId.current++;
    setIsBusy(false);
    setMode(next);
  };

  const onEnter = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      runAction();
    }
  };

  const selectedAlgo = ALGORITHMS.find((a) => a.id === algo) ?? ALGORITHMS[0];
  const canRun = mode === "generate" ? password.length > 0 : verifyPassword.length > 0 && verifyHash.trim().length > 0;

  const passwordField = (value: string, onChange: (v: string) => void, label: string) => (
    <div className="relative">
      <input
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onEnter}
        placeholder="Enter password…"
        aria-label={label}
        autoComplete="off"
        spellCheck={false}
        className={cn(inputBase, "w-full pr-11 font-mono")}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className={cn(btnIcon, "absolute right-0.5 top-1/2 -translate-y-1/2 md:right-0")}
        title={showPassword ? "Hide password" : "Show password"}
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? <EyeOff {...iconProps} /> : <Eye {...iconProps} />}
      </button>
    </div>
  );

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto overflow-x-hidden bg-white md:overflow-hidden">
      {/* Top Controls Bar (Unified Clean Header) */}
      <ToolHeader
        icon={getToolIcon("password-hash")}
        title="Password Hash"
        utilities={
          <ShareMenu
            toolSlug="password-hash"
            data={mode === "generate" ? genResult?.hash ?? "" : verifyHash}
            imageCode={genResult?.hash ?? ""}
            imageLanguage="plaintext"
          />
        }
        options={
          <div className={segmentTrack} role="group" aria-label="Mode">
            <button type="button" onClick={() => switchMode("generate")} aria-pressed={mode === "generate"} className={segmentBtn(mode === "generate")}>
              Generate
            </button>
            <button type="button" onClick={() => switchMode("verify")} aria-pressed={mode === "verify"} className={segmentBtn(mode === "verify")}>
              Verify
            </button>
          </div>
        }
        actions={
          <>
            <button type="button" onClick={handleClear} className={btnSecondary} title="Clear inputs">
              <Trash2 {...iconProps} />
              <span className="hidden sm:inline">Clear</span>
            </button>
            <button type="button" onClick={runAction} disabled={!canRun || isBusy} className={btnPrimary} title="Run (Enter)">
              {isBusy ? <Loader2 {...iconProps} className="size-4 shrink-0 animate-spin" /> : <KeyRound {...iconProps} />}
              <span>{mode === "generate" ? "Generate" : "Verify"}</span>
            </button>
          </>
        }
      />

      <div className="flex flex-1 flex-col md:min-h-0 md:flex-row" id="password-hash-export">
        {/* Left Pane: Configuration & Input */}
        <section className="flex shrink-0 flex-col border-b border-zinc-200 md:min-h-0 md:w-1/2 md:shrink md:overflow-y-auto md:border-b-0 md:border-r">
          <PaneBar label={mode === "generate" ? "Hash configuration" : "Verification inputs"} />

          <div className="flex flex-col gap-5 p-3 md:p-4">
            {mode === "generate" ? (
              <>
                {/* Algorithm Selector */}
                <div className="flex flex-col gap-2">
                  <span className={labelClass}>Algorithm</span>
                  <div className="flex flex-wrap gap-2" role="group" aria-label="Hashing algorithm">
                    {ALGORITHMS.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setAlgo(a.id)}
                        aria-pressed={algo === a.id}
                        className={cn(chipBtn(algo === a.id), "h-10 md:h-8")}
                        title={a.tag}
                      >
                        {a.name}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-zinc-500">
                    <span className="font-medium text-zinc-700">{selectedAlgo.tag}.</span> {selectedAlgo.description}
                  </p>
                </div>

                {/* Password Input */}
                <label className="flex flex-col gap-2">
                  <span className={labelClass}>Plaintext password</span>
                  {passwordField(password, setPassword, "Plaintext password")}
                  {algo === "bcrypt" && passwordBytes > BCRYPT_MAX_BYTES && (
                    <span className="flex items-start gap-1.5 text-xs text-amber-700">
                      <AlertCircle className="mt-px size-3.5 shrink-0" strokeWidth={ICON_STROKE} aria-hidden="true" />
                      <span>
                        Password is {passwordBytes} bytes. Bcrypt ignores everything after {BCRYPT_MAX_BYTES} bytes.
                      </span>
                    </span>
                  )}
                </label>

                {/* Parameters */}
                {algo === "bcrypt" && (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className={labelClass}>Cost factor</span>
                      <span className="font-mono text-xs font-semibold tabular-nums text-zinc-900">{bcryptRounds}</span>
                    </div>
                    <input
                      type="range"
                      min="4"
                      max="14"
                      value={bcryptRounds}
                      onChange={(e) => setBcryptRounds(parseInt(e.target.value, 10))}
                      aria-label="Bcrypt cost factor"
                      className="h-10 w-full cursor-pointer accent-zinc-900"
                    />
                    <div className="flex justify-between text-[11px] text-zinc-500">
                      <span>Fast (4)</span>
                      <span>OWASP 10–12</span>
                      <span>Heavy (14)</span>
                    </div>
                    <p className="mt-2 text-xs text-zinc-500">Bcrypt generates its own random salt and embeds it in the hash.</p>
                  </div>
                )}

                {(algo === "pbkdf2-sha256" || algo === "pbkdf2-sha512") && (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className={labelClass}>Iterations</span>
                      <span className="font-mono text-xs font-semibold tabular-nums text-zinc-900">{pbkdf2Iterations.toLocaleString()}</span>
                    </div>
                    <input
                      type="range"
                      min="10000"
                      max="600000"
                      step="10000"
                      value={pbkdf2Iterations}
                      onChange={(e) => setPbkdf2Iterations(parseInt(e.target.value, 10))}
                      aria-label="PBKDF2 iterations"
                      className="h-10 w-full cursor-pointer accent-zinc-900"
                    />
                    <div className="flex justify-between text-[11px] text-zinc-500">
                      <span>10k</span>
                      <span>OWASP High (600k)</span>
                    </div>
                  </div>
                )}

                {algo !== "bcrypt" && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className={labelClass}>Salt</span>
                      <button type="button" onClick={() => setSalt(generateRandomSalt(16))} className={cn(btnGhost, "-my-1.5 -mr-1.5")}>
                        <RefreshCw {...iconProps} />
                        <span>New salt</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={salt}
                      onChange={(e) => setSalt(e.target.value)}
                      aria-label="Salt"
                      spellCheck={false}
                      className={cn(inputBase, "w-full font-mono")}
                    />
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Verify Mode Left Pane */}
                <label className="flex flex-col gap-2">
                  <span className="flex items-center justify-between gap-2">
                    <span className={labelClass}>Stored hash</span>
                    <StatusPill tone={detected === "unknown" ? "neutral" : "strong"} className="h-5 font-mono">
                      {detected}
                    </StatusPill>
                  </span>
                  <textarea
                    value={verifyHash}
                    onChange={(e) => setVerifyHash(e.target.value)}
                    onKeyDown={onEnter}
                    rows={3}
                    placeholder="Paste $2b$10$…, $argon2id$…, $pbkdf2-…, $scrypt$…"
                    aria-label="Stored hash"
                    spellCheck={false}
                    className="min-h-20 w-full resize-y break-all rounded-md border border-zinc-200 bg-white px-3 py-2 font-mono text-[13px] text-zinc-900 transition-colors placeholder:text-zinc-400 hover:border-zinc-300 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 md:text-xs"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className={labelClass}>Candidate password</span>
                  {passwordField(verifyPassword, setVerifyPassword, "Candidate password")}
                </label>
              </>
            )}
          </div>
        </section>

        {/* Right Pane: Output */}
        <section className="flex min-w-0 flex-1 flex-col md:min-h-0 md:overflow-y-auto">
          {mode === "generate" ? (
            <>
              <PaneBar label="Generated hash" className="pr-0.5 md:pr-0.5">
                {genStale && (
                  <StatusPill tone="warning" className="mr-2">
                    Inputs changed
                  </StatusPill>
                )}
              </PaneBar>
              {genError ? (
                <p className="flex items-start gap-1.5 p-3 text-xs text-red-600 md:p-4">
                  <AlertCircle className="mt-px size-3.5 shrink-0" strokeWidth={ICON_STROKE} aria-hidden="true" />
                  <span className="break-words">{genError}</span>
                </p>
              ) : genResult ? (
                <div className="divide-y divide-zinc-200 border-b border-zinc-200">
                  <div className="flex items-start gap-3 py-2.5 pl-3 pr-1.5 md:pl-4 md:pr-2">
                    <p
                      className={cn(
                        "min-w-0 flex-1 select-all break-all py-1.5 font-mono text-[13px] leading-relaxed text-zinc-900",
                        genStale && "opacity-50"
                      )}
                    >
                      {genResult.hash}
                    </p>
                    <CopyIconButton copied={copiedKey === "gen_hash"} onClick={() => copy(genResult.hash, "gen_hash")} label="Copy hash" />
                  </div>
                  <ResultRow label="Algorithm" value={ALGORITHMS.find((a) => a.id === genResult.algorithm)?.name ?? genResult.algorithm} />
                  {genResult.algorithm !== "bcrypt" && (
                    <ResultRow
                      label="Salt"
                      value={genResult.salt}
                      mono
                      action={<CopyIconButton copied={copiedKey === "gen_salt"} onClick={() => copy(genResult.salt, "gen_salt")} label="Copy salt" />}
                    />
                  )}
                  <ResultRow label="Time" value={`${genResult.executionMs} ms`} mono />
                  <ResultRow label="Length" value={`${genResult.hash.length} chars`} mono />
                </div>
              ) : (
                <EmptyState busy={isBusy} text="Press Generate (or Enter) to hash the password." />
              )}
            </>
          ) : (
            <>
              <PaneBar label="Verification result" className="pr-3 md:pr-3">
                {verifyResult && !verifyStale && (
                  <StatusPill
                    tone={verifyResult.isMatch ? "success" : verifyResult.error ? "warning" : "error"}
                    icon={
                      verifyResult.isMatch ? (
                        <ShieldCheck className={pillIcon} strokeWidth={ICON_STROKE} aria-hidden="true" />
                      ) : (
                        <ShieldX className={pillIcon} strokeWidth={ICON_STROKE} aria-hidden="true" />
                      )
                    }
                  >
                    {verifyResult.isMatch ? "Match" : verifyResult.error ? "Error" : "No match"}
                  </StatusPill>
                )}
                {verifyStale && <StatusPill tone="warning">Inputs changed</StatusPill>}
              </PaneBar>
              {verifyResult ? (
                <div className={cn("divide-y divide-zinc-200 border-b border-zinc-200", verifyStale && "opacity-50")}>
                  <div
                    className={cn(
                      "flex items-start gap-2 px-3 py-3 text-sm font-medium md:px-4",
                      verifyResult.isMatch ? "text-zinc-900" : verifyResult.error ? "text-amber-700" : "text-red-700"
                    )}
                  >
                    {verifyResult.isMatch ? (
                      <ShieldCheck className="mt-0.5 size-4 shrink-0" strokeWidth={ICON_STROKE} aria-hidden="true" />
                    ) : verifyResult.error ? (
                      <AlertCircle className="mt-0.5 size-4 shrink-0" strokeWidth={ICON_STROKE} aria-hidden="true" />
                    ) : (
                      <ShieldX className="mt-0.5 size-4 shrink-0" strokeWidth={ICON_STROKE} aria-hidden="true" />
                    )}
                    <span className="break-words">
                      {verifyResult.isMatch
                        ? "Password matches the hash"
                        : verifyResult.error
                          ? verifyResult.error
                          : "Password does not match the hash"}
                    </span>
                  </div>
                  <ResultRow label="Algorithm" value={verifyResult.algorithmDetected} mono />
                  <ResultRow label="Time" value={`${verifyResult.executionMs} ms`} mono />
                </div>
              ) : (
                <EmptyState busy={isBusy} text="Press Verify (or Enter) to check the password against the hash." />
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function ResultRow({ label, value, mono, action }: { label: string; value: string; mono?: boolean; action?: ReactNode }) {
  return (
    <div className={cn("flex min-h-10 items-center gap-3 pl-3 md:pl-4", action ? "pr-1.5 md:pr-2" : "pr-3 md:pr-4")}>
      <span className="w-20 shrink-0 text-xs text-zinc-500">{label}</span>
      <span className={cn("min-w-0 flex-1 break-all py-2 text-xs text-zinc-900", mono && "font-mono")}>{value}</span>
      {action}
    </div>
  );
}

function EmptyState({ busy, text }: { busy: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2 p-3 text-sm text-zinc-500 md:p-4">
      {busy && <Loader2 className="size-4 shrink-0 animate-spin" strokeWidth={ICON_STROKE} aria-hidden="true" />}
      <span>{busy ? "Working…" : text}</span>
    </div>
  );
}
