"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GeneratedKeypair, KeyAlgorithmType } from "@/lib/tools/ssh-key-generator";
import { ShareMenu } from "@/components/ShareMenu";
import {
  RefreshCw,
  LoaderCircle,
  Copy,
  Check,
  Download,
  Eye,
  EyeOff,
  ShieldAlert,
  TriangleAlert,
  CircleAlert,
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
  selectBase,
  inputBase,
  segmentTrack,
  segmentBtn,
  captionText,
  iconProps,
} from "@/components/tools/ToolChrome";
import { getToolIcon } from "@/components/layout/toolIcons";

interface SshKeyGeneratorToolProps {
  onValidationChange: (isValid: boolean, error?: string) => void;
  onStatsChange: (length: number, execMs: number) => void;
  onLogHistory?: (input: string) => void;
  restoredInput?: string | null;
}

type PrivateFormat = "openssh" | "pkcs8";

/** The lib is loaded on first generate so the tool chunk stays small. */
type ApplyComment = (keypair: GeneratedKeypair, comment: string) => GeneratedKeypair;

const DEFAULT_ALGO: KeyAlgorithmType = "ed25519";
const DEFAULT_COMMENT = "user@devscratchpad";

const ALGORITHMS: { id: KeyAlgorithmType; name: string; caption: string }[] = [
  { id: "ed25519", name: "Ed25519", caption: "Recommended. Small, fast keys supported by OpenSSH 6.5+, GitHub and GitLab." },
  { id: "rsa-2048", name: "RSA 2048", caption: "Widest compatibility with older servers, appliances and cloud consoles." },
  { id: "rsa-4096", name: "RSA 4096", caption: "Larger RSA key for strict compliance policies. Takes longer to generate." },
  { id: "ecdsa-p256", name: "ECDSA P-256", caption: "NIST P-256 curve, for environments that require FIPS-approved curves." },
];

const ALGORITHM_NAMES: Record<KeyAlgorithmType, string> = {
  ed25519: "Ed25519",
  "rsa-2048": "RSA 2048",
  "rsa-4096": "RSA 4096",
  "ecdsa-p256": "ECDSA P-256",
};

/** ssh-keygen's own labels (as in `ssh-keygen -l` and the randomart header). */
const KEY_LABELS: Record<GeneratedKeypair["keyType"], string> = {
  "ssh-ed25519": "ED25519",
  "ssh-rsa": "RSA",
  "ecdsa-sha2-nistp256": "ECDSA",
};

const KEY_FILES: Record<GeneratedKeypair["keyType"], string> = {
  "ssh-ed25519": "id_ed25519",
  "ssh-rsa": "id_rsa",
  "ecdsa-sha2-nistp256": "id_ecdsa",
};

const PRIVATE_FORMATS: { id: PrivateFormat; name: string; caption: string }[] = [
  { id: "openssh", name: "OpenSSH", caption: "OpenSSH format, as written by ssh-keygen." },
  { id: "pkcs8", name: "PKCS#8", caption: "PKCS#8 PEM, for OpenSSL and crypto libraries." },
];

const preBase = "m-0 font-mono text-xs leading-5 text-zinc-800";

function downloadText(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  // Revoke after the click has been handled so slower browsers still get the file
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function SshKeyGeneratorTool({
  onValidationChange,
  onStatsChange,
  onLogHistory,
  restoredInput,
}: SshKeyGeneratorToolProps) {
  const [algo, setAlgo] = useState<KeyAlgorithmType>(DEFAULT_ALGO);
  const [comment, setComment] = useState<string>(DEFAULT_COMMENT);
  const [result, setResult] = useState<{ keypair: GeneratedKeypair; applyComment: ApplyComment } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [privateFormat, setPrivateFormat] = useState<PrivateFormat>("openssh");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Latest parent callbacks, so `generate` stays stable while the shell re-creates them
  const callbacksRef = useRef({ onValidationChange, onStatsChange, onLogHistory });
  useEffect(() => {
    callbacksRef.current = { onValidationChange, onStatsChange, onLogHistory };
  });

  // Each request gets an id; only the newest one may publish its result (a slow RSA 4096
  // generation must not overwrite an Ed25519 key requested after it).
  const requestRef = useRef(0);

  const generate = useCallback(async (nextAlgo: KeyAlgorithmType, nextComment: string) => {
    const id = ++requestRef.current;
    setIsGenerating(true);
    const start = performance.now();
    try {
      const lib = await import("@/lib/tools/ssh-key-generator");
      const keypair = await lib.generateSshKeypair(nextAlgo, nextComment);
      if (id !== requestRef.current) return;
      const execMs = Math.round((performance.now() - start) * 10) / 10;
      setResult({ keypair, applyComment: lib.applyComment });
      setError(null);
      const { onValidationChange: validate, onStatsChange: stats, onLogHistory: log } = callbacksRef.current;
      validate(true);
      stats(keypair.publicKeyOpenSSH.length, execMs);
      log?.(`Generated ${keypair.algorithm} key: ${keypair.comment}`);
    } catch (err) {
      if (id !== requestRef.current) return;
      const message = err instanceof Error ? err.message : "Key generation failed";
      setError(message);
      callbacksRef.current.onValidationChange(false, message);
    } finally {
      if (id === requestRef.current) setIsGenerating(false);
    }
  }, []);

  // Initial auto-generate on mount, or restore algorithm + comment from a shared public key line
  const handledRestoreRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const isFirstRun = handledRestoreRef.current === undefined;
    const input = restoredInput?.trim() || null;
    if (!isFirstRun && (!input || input === handledRestoreRef.current)) return;
    handledRestoreRef.current = input;

    void (async () => {
      const parsed = input
        ? (await import("@/lib/tools/ssh-key-generator")).parseOpenSshPublicKey(input)
        : null;
      if (parsed) {
        setAlgo(parsed.algorithm);
        setComment(parsed.comment);
        void generate(parsed.algorithm, parsed.comment);
      } else if (isFirstRun) {
        void generate(DEFAULT_ALGO, DEFAULT_COMMENT);
      }
    })();
  }, [restoredInput, generate]);

  // The comment is just text inside the public line and the OpenSSH private key, so rebuild
  // those strings instead of generating a new key on every keystroke.
  const keypair = useMemo(
    () => (result ? result.applyComment(result.keypair, comment) : null),
    [result, comment]
  );

  // Save workspace snapshot
  useEffect(() => {
    const handleSave = () => {
      if (!keypair) return;
      const { material: _material, ...snapshot } = keypair;
      addSnapshot("ssh-key-generator", "SSH Key Generator", keypair.publicKeyOpenSSH, JSON.stringify(snapshot, null, 2));
    };
    window.addEventListener("save-workspace", handleSave);
    return () => window.removeEventListener("save-workspace", handleSave);
  }, [keypair]);

  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (copyTimer.current) clearTimeout(copyTimer.current);
  }, []);

  const handleCopy = async (text: string, key: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }
    setCopiedKey(key);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopiedKey(null), 1500);
  };

  const selectAlgo = (next: KeyAlgorithmType) => {
    setAlgo(next);
    void generate(next, comment);
  };

  const keyLabel = keypair ? `${KEY_LABELS[keypair.keyType]} ${keypair.keySize}` : null;
  const baseFilename = KEY_FILES[keypair?.keyType ?? "ssh-ed25519"];
  const publicKey = keypair?.publicKeyOpenSSH ?? "";
  const privateKey = keypair ? (privateFormat === "openssh" ? keypair.privateKeyOpenSSH : keypair.privateKeyPem) : "";
  const privateFilename = privateFormat === "openssh" ? baseFilename : `${baseFilename}.pem`;
  const selectedAlgo = ALGORITHMS.find((a) => a.id === algo) ?? ALGORITHMS[0];
  const formatCaption = PRIVATE_FORMATS.find((f) => f.id === privateFormat)?.caption;

  const usageLines = useMemo(
    () => [
      "# Install the downloaded key pair",
      `mv ${baseFilename} ${baseFilename}.pub ~/.ssh/ && chmod 600 ~/.ssh/${baseFilename}`,
      "# Authorize it on a server (adds it to ~/.ssh/authorized_keys)",
      `ssh-copy-id -i ~/.ssh/${baseFilename}.pub user@host`,
      "# Connect",
      `ssh -i ~/.ssh/${baseFilename} user@host`,
    ],
    [baseFilename]
  );
  const usageText = useMemo(() => usageLines.join("\n"), [usageLines]);

  const copyLabel = (key: string, label = "Copy") => (
    <>
      {copiedKey === key ? <Check {...iconProps} /> : <Copy {...iconProps} />}
      <span>{copiedKey === key ? "Copied" : label}</span>
    </>
  );

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Top Controls Bar (Unified Clean Header) */}
      <ToolHeader
        icon={getToolIcon("ssh-key-generator")}
        title="SSH Key Generator"
        utilities={
          <ShareMenu toolSlug="ssh-key-generator" data={publicKey} imageCode={publicKey} imageLanguage="text" />
        }
        options={
          <>
            <select
              value={algo}
              onChange={(e) => selectAlgo(e.target.value as KeyAlgorithmType)}
              aria-label="Key algorithm"
              className={cn(selectBase, "min-w-0 flex-1 md:hidden")}
            >
              {ALGORITHMS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <div className={cn(segmentTrack, "hidden md:inline-flex")} role="group" aria-label="Key algorithm">
              {ALGORITHMS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  aria-pressed={algo === a.id}
                  onClick={() => selectAlgo(a.id)}
                  className={segmentBtn(algo === a.id)}
                >
                  {a.name}
                </button>
              ))}
            </div>
          </>
        }
        actions={
          <button
            type="button"
            onClick={() => void generate(algo, comment)}
            disabled={isGenerating}
            className={btnPrimary}
            title="Generate a new key pair"
          >
            {isGenerating ? (
              <LoaderCircle {...iconProps} className="size-4 shrink-0 animate-spin" />
            ) : (
              <RefreshCw {...iconProps} />
            )}
            <span>{isGenerating ? "Generating" : "Generate"}</span>
          </button>
        }
      />

      {/* Output scrolls inside the tool root (the shell gives it a fixed-height box) */}
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <div className="grid min-h-full grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)] lg:divide-x lg:divide-zinc-200">
          {/* Left: options + keys */}
          <div className="flex min-w-0 flex-col">
            <div className="border-b border-zinc-200 px-3 py-3 md:px-4">
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                <label htmlFor="ssh-key-comment" className={cn(captionText, "shrink-0")}>
                  Comment
                </label>
                <input
                  id="ssh-key-comment"
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="user@host (optional)"
                  spellCheck={false}
                  autoComplete="off"
                  className={cn(inputBase, "w-full min-w-0 sm:max-w-sm")}
                />
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                <span className="font-medium text-zinc-700">{selectedAlgo.name}.</span> {selectedAlgo.caption}
              </p>
            </div>

            {error && (
              <div role="alert" className="flex items-start gap-2 border-b border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700 md:px-4">
                <CircleAlert {...iconProps} className="mt-px size-4 shrink-0" />
                <span className="min-w-0 break-words">Key generation failed: {error}</span>
              </div>
            )}

            {keypair?.fellBack && (
              <div role="status" className="flex items-start gap-2 border-b border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 md:px-4">
                <TriangleAlert {...iconProps} className="mt-px size-4 shrink-0" />
                <span className="min-w-0">
                  This browser cannot generate {ALGORITHM_NAMES[keypair.requestedAlgorithm]} keys with WebCrypto, so an{" "}
                  {ALGORITHM_NAMES[keypair.algorithm]} key was generated instead.
                </span>
              </div>
            )}

            <div className={cn("flex flex-col transition-opacity", isGenerating && "opacity-60")} aria-busy={isGenerating}>
              {/* Public Key */}
              <section className="border-b border-zinc-200">
                <PaneBar
                  label={
                    <>
                      Public key
                      {keyLabel && (
                        <span className="ml-2 rounded bg-zinc-200/70 px-1.5 py-0.5 font-mono text-[10px] tracking-normal text-zinc-700">
                          {keyLabel}
                        </span>
                      )}
                    </>
                  }
                >
                  <button type="button" onClick={() => handleCopy(publicKey, "pub")} disabled={!publicKey} className={btnGhost}>
                    {copyLabel("pub")}
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadText(`${publicKey}\n`, `${baseFilename}.pub`)}
                    disabled={!publicKey}
                    className={btnGhost}
                    title={`Download ${baseFilename}.pub`}
                  >
                    <Download {...iconProps} />
                    <span>.pub</span>
                  </button>
                </PaneBar>
                <pre className={cn(preBase, "max-h-40 select-all overflow-y-auto whitespace-pre-wrap break-all px-3 py-3 md:px-4", !publicKey && "text-zinc-400")}>
                  {publicKey || "Generating key pair..."}
                </pre>
              </section>

              {/* Private Key */}
              <section className="border-b border-zinc-200">
                <PaneBar label="Private key">
                  <button
                    type="button"
                    onClick={() => setShowPrivateKey((v) => !v)}
                    disabled={!privateKey}
                    className={btnGhost}
                    aria-pressed={showPrivateKey}
                  >
                    {showPrivateKey ? <EyeOff {...iconProps} /> : <Eye {...iconProps} />}
                    <span>{showPrivateKey ? "Hide" : "Reveal"}</span>
                  </button>
                  <button type="button" onClick={() => handleCopy(privateKey, "priv")} disabled={!privateKey} className={btnGhost}>
                    {copyLabel("priv")}
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadText(privateKey, privateFilename)}
                    disabled={!privateKey}
                    className={btnGhost}
                    title={`Download ${privateFilename}`}
                    aria-label={`Download ${privateFilename}`}
                  >
                    <Download {...iconProps} />
                    <span className="hidden sm:inline">Download</span>
                  </button>
                </PaneBar>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-zinc-100 px-3 py-2 md:px-4">
                  <div className={segmentTrack} role="group" aria-label="Private key format">
                    {PRIVATE_FORMATS.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        aria-pressed={privateFormat === f.id}
                        onClick={() => setPrivateFormat(f.id)}
                        className={segmentBtn(privateFormat === f.id)}
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>
                  <span className="min-w-0 text-xs text-zinc-500">{formatCaption}</span>
                </div>

                <div className="relative">
                  <pre
                    aria-hidden={!showPrivateKey}
                    className={cn(
                      preBase,
                      "max-h-72 min-h-36 whitespace-pre-wrap break-all px-3 py-3 md:px-4",
                      showPrivateKey ? "select-all overflow-y-auto" : "pointer-events-none select-none overflow-hidden blur-sm",
                      !privateKey && "text-zinc-400"
                    )}
                  >
                    {privateKey || "Generating key pair..."}
                  </pre>
                  {!showPrivateKey && privateKey && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/40">
                      <button type="button" onClick={() => setShowPrivateKey(true)} className={btnSecondary}>
                        <Eye {...iconProps} />
                        <span>Reveal private key</span>
                      </button>
                    </div>
                  )}
                </div>

                <p className="flex items-start gap-1.5 border-t border-zinc-100 px-3 py-2 text-xs text-amber-700 md:px-4">
                  <ShieldAlert {...iconProps} className="mt-px size-3.5 shrink-0" />
                  <span>Secret. Keep it on your machine as ~/.ssh/{baseFilename}; never share or commit it.</span>
                </p>
              </section>
            </div>
          </div>

          {/* Right: fingerprints, randomart, usage */}
          <div className={cn("flex min-w-0 flex-col transition-opacity", isGenerating && "opacity-60")}>
            <section className="border-b border-zinc-200">
              <PaneBar label="Fingerprints" />
              <div className="divide-y divide-zinc-100">
                {(
                  [
                    ["fp-sha256", keypair?.fingerprintSha256, "SHA256 fingerprint"],
                    ["fp-md5", keypair?.fingerprintMd5, "MD5 fingerprint"],
                  ] as const
                ).map(([key, value, label]) => (
                  <div key={key} className="flex min-h-12 items-center gap-2 py-1 pl-3 pr-1 md:pl-4">
                    <code className="min-w-0 flex-1 break-all font-mono text-xs leading-5 text-zinc-900">
                      {value ?? <span className="text-zinc-400">...</span>}
                    </code>
                    <button
                      type="button"
                      onClick={() => value && handleCopy(value, key)}
                      disabled={!value}
                      className={cn(btnIcon, copiedKey === key && "text-zinc-900")}
                      title={copiedKey === key ? "Copied" : `Copy ${label}`}
                      aria-label={`Copy ${label}`}
                    >
                      {copiedKey === key ? <Check {...iconProps} /> : <Copy {...iconProps} />}
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="border-b border-zinc-200">
              <PaneBar label="Randomart">
                <button
                  type="button"
                  onClick={() => keypair && handleCopy(keypair.randomart, "art")}
                  disabled={!keypair}
                  className={cn(btnIcon, copiedKey === "art" && "text-zinc-900")}
                  title={copiedKey === "art" ? "Copied" : "Copy randomart"}
                  aria-label="Copy randomart"
                >
                  {copiedKey === "art" ? <Check {...iconProps} /> : <Copy {...iconProps} />}
                </button>
              </PaneBar>
              <div className="px-3 py-4 md:px-4">
                <pre className={cn(preBase, "mx-auto w-max max-w-full overflow-x-auto leading-4")}>
                  {keypair?.randomart ?? ""}
                </pre>
              </div>
            </section>

            <section className="border-b border-zinc-200">
              <PaneBar label="Usage">
                <button type="button" onClick={() => handleCopy(usageText, "usage")} className={btnGhost}>
                  {copyLabel("usage")}
                </button>
              </PaneBar>
              <pre className={cn(preBase, "overflow-x-auto whitespace-pre px-3 py-3 md:px-4")}>
                {usageLines.map((line) => (
                  <span key={line} className={cn("block", line.startsWith("#") && "text-zinc-400")}>
                    {line}
                  </span>
                ))}
              </pre>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
