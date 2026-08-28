"use client";

import { useState, useEffect, useMemo } from "react";
import { generateHmac, type HmacAlgorithm } from "@/lib/tools/hmac";
import { ShareButton } from "@/components/ShareButton";
import { EmbedButton } from "@/components/EmbedButton";
import { ExportImageButton } from "@/components/ExportImageButton";
import {
  KeyRound,
  FileText,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  Trash2,
  Cpu,
  Binary,
  Hash,
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ValidationBadge } from "@/components/layout/StatusBar";

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
  popularFor?: string;
}

const ALGORITHM_OPTIONS: AlgorithmOption[] = [
  { value: "SHA256", label: "HMAC-SHA256", bits: 256, popularFor: "GitHub, Stripe, AWS, Shopify" },
  { value: "SHA512", label: "HMAC-SHA512", bits: 512, popularFor: "High-security API auth" },
  { value: "SHA384", label: "HMAC-SHA384", bits: 384, popularFor: "TLS / PKI" },
  { value: "SHA224", label: "HMAC-SHA224", bits: 224, popularFor: "Legacy SHA-2" },
  { value: "SHA1", label: "HMAC-SHA1", bits: 160, popularFor: "Legacy webhooks, OAuth 1.0" },
  { value: "MD5", label: "HMAC-MD5", bits: 128, popularFor: "Legacy checksums" },
];

const SAMPLE_PAYLOAD = JSON.stringify(
  {
    event: "payment_intent.succeeded",
    id: "evt_3N4eHwLkdIwHu7ix08W32q1f",
    created: 1718000000,
    data: {
      amount: 4999,
      currency: "usd",
      customer: "cus_P8qL90kM412",
      status: "paid",
    },
  },
  null,
  2
);

export function HmacGeneratorTool({
  onValidationChange,
  onStatsChange,
  onLogHistory,
  restoredInput,
}: HmacGeneratorToolProps) {
  const [secret, setSecret] = useState<string>("");
  const [payload, setPayload] = useState<string>("");
  const [algo, setAlgo] = useState<HmacAlgorithm>("SHA256");
  const [showSecret, setShowSecret] = useState<boolean>(false);
  const [outputFormat, setOutputFormat] = useState<"hex" | "base64" | "both">("both");
  const [hexOutput, setHexOutput] = useState<string>("");
  const [base64Output, setBase64Output] = useState<string>("");
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean>(true);
  const [compareSignature, setCompareSignature] = useState<string>("");
  const [showVerifier, setShowVerifier] = useState<boolean>(false);

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
    if (restoredInput) {
      try {
        const parsed = JSON.parse(restoredInput);
        if (parsed && typeof parsed === "object") {
          if ("secret" in parsed && typeof parsed.secret === "string") setSecret(parsed.secret);
          if ("payload" in parsed && typeof parsed.payload === "string") setPayload(parsed.payload);
          if ("algo" in parsed && typeof parsed.algo === "string") setAlgo(parsed.algo as HmacAlgorithm);
          return;
        }
      } catch {}
      setPayload(restoredInput);
    }
  }, [restoredInput]);

  // Compute HMAC in real time
  useEffect(() => {
    const start = performance.now();
    try {
      if (secret && payload) {
        const result = generateHmac(secret, payload, algo);
        setHexOutput(result.hex);
        setBase64Output(result.base64);
        setIsValid(true);
        onValidationChange(true);
      } else {
        setHexOutput("");
        setBase64Output("");
        setIsValid(true);
        onValidationChange(true);
      }
    } catch (err: any) {
      setIsValid(false);
      onValidationChange(false, err?.message || "Calculation error");
      setHexOutput("");
      setBase64Output("");
    }
    const end = performance.now();
    onStatsChange(payload.length, end - start);
  }, [secret, payload, algo, onValidationChange, onStatsChange]);

  const payloadByteCount = useMemo(() => {
    try {
      return new TextEncoder().encode(payload).length;
    } catch {
      return payload.length;
    }
  }, [payload]);

  const selectedAlgoMeta = useMemo(() => {
    return ALGORITHM_OPTIONS.find((a) => a.value === algo) || ALGORITHM_OPTIONS[0];
  }, [algo]);

  // Signature verification logic
  const verificationResult = useMemo(() => {
    if (!compareSignature.trim() || (!hexOutput && !base64Output)) return null;
    const cleanComp = compareSignature.trim();
    // Allow prefix like sha256= or v1=
    const normalizedInput = cleanComp.replace(/^(sha(1|256|384|512|224|md5)=|v\d+=)/i, "").trim().toLowerCase();
    const hexNorm = hexOutput.toLowerCase();
    const b64Norm = base64Output.trim();

    if (normalizedInput === hexNorm || cleanComp === hexOutput) {
      return { match: true, format: "HEX" };
    }
    if (cleanComp === b64Norm || normalizedInput === b64Norm.toLowerCase()) {
      return { match: true, format: "Base64" };
    }
    return { match: false };
  }, [compareSignature, hexOutput, base64Output]);

  const handleCopy = (text: string, typeKey: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedType(typeKey);
    onLogHistory?.(payload);
    setTimeout(() => setCopiedType(null), 1600);
  };

  const handleGenerateRandomKey = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=";
    const array = new Uint8Array(32);
    if (typeof window !== "undefined" && window.crypto) {
      window.crypto.getRandomValues(array);
      const randomStr = Array.from(array, (byte) => chars[byte % chars.length]).join("");
      setSecret(randomStr);
    } else {
      let result = "";
      for (let i = 0; i < 32; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setSecret(result);
    }
  };

  const handleLoadSample = () => {
    setSecret("whsec_9b2d8e41f7a0c8b3d6e5a4f123456789");
    setPayload(SAMPLE_PAYLOAD);
    setAlgo("SHA256");
  };

  const handleClearAll = () => {
    setSecret("");
    setPayload("");
    setCompareSignature("");
  };

  const hasMissingSecret = payload.trim().length > 0 && secret.trim().length === 0;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 overflow-y-auto w-full overflow-x-hidden">
      {/* Tool Header */}
      <div className="min-h-14 border-b border-[#e2e8f0] dark:border-zinc-800/90 flex flex-wrap md:flex-nowrap items-center justify-between px-3 md:px-6 py-2.5 md:py-0 bg-[#f8fafc] dark:bg-[#101013] shrink-0 sticky top-0 z-20 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">HMAC Generator</h2>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hidden sm:inline-block">
                Client-Side Only
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 hidden sm:block">
              Generate and verify Hash-based Message Authentication Codes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2 overflow-x-auto hide-scrollbar pb-0.5 md:pb-0">
          <ValidationBadge isValid={isValid && !hasMissingSecret} />

          <ExportImageButton code={hexOutput || payload || secret} language="plaintext" />
          <EmbedButton toolSlug="hmac-generator" data={{ secret, payload, algo }} />
          <ShareButton toolSlug="hmac-generator" data={{ secret, payload, algo }} />

          <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-800 mx-1 shrink-0" />

          {(secret || payload) && (
            <button
              onClick={handleClearAll}
              className="h-8 md:h-9 px-2.5 md:px-3 bg-zinc-100 dark:bg-[#18181B] hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 border border-zinc-200 dark:border-[#27272A] text-zinc-600 dark:text-zinc-400 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 shrink-0"
              title="Clear all fields"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}

          <button
            onClick={() => handleCopy(hexOutput || base64Output, "primary")}
            disabled={!hexOutput}
            className={cn(
              "h-8 md:h-9 px-3 md:px-4 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 shadow-xs",
              hexOutput
                ? copiedType === "primary"
                  ? "bg-emerald-600 text-white"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95"
                : "bg-zinc-200 dark:bg-zinc-800/80 text-zinc-400 dark:text-zinc-500 cursor-not-allowed opacity-60"
            )}
          >
            {copiedType === "primary" ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copiedType === "primary" ? "Copied Signature!" : "Copy Result"}</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Layout (2-Column Grid on Wide Viewports) */}
      <div className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ================= LEFT COLUMN: INPUTS PANEL ================= */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col gap-5">
            <div className="bg-zinc-50/70 dark:bg-[#131417] border border-zinc-200/90 dark:border-[#24262d] rounded-xl p-4 sm:p-5 md:p-6 shadow-xs flex flex-col gap-5">
              
              {/* Card Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-zinc-200/80 dark:border-[#22242b]">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                    <KeyRound className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      HMAC Configuration
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Keyed-hash parameters & payload
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleLoadSample}
                  className="px-2.5 py-1 text-xs font-medium rounded-md bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 transition-colors flex items-center gap-1 shrink-0"
                  title="Load Stripe Webhook Sample"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Sample Data</span>
                </button>
              </div>

              {/* Input 1: Algorithm Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Hash Algorithm</span>
                  </label>
                  <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
                    {selectedAlgoMeta.bits}-bit digest
                  </span>
                </div>

                <div className="relative">
                  <select
                    value={algo}
                    onChange={(e) => setAlgo(e.target.value as HmacAlgorithm)}
                    className="w-full bg-white dark:bg-[#1a1d24] border border-zinc-300 dark:border-[#2c303a] text-zinc-900 dark:text-zinc-100 text-sm rounded-lg p-2.5 md:p-3 focus:outline-none focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 font-medium transition-all cursor-pointer shadow-xs"
                  >
                    {ALGORITHM_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label} ({opt.bits}-bit) — {opt.popularFor}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Input 2: Secret Key Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Secret Key</span>
                    <span className="text-red-500 font-bold">*</span>
                  </label>
                  
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleGenerateRandomKey}
                      className="text-[11px] text-zinc-500 dark:text-zinc-400 hover:text-emerald-500 dark:hover:text-emerald-400 flex items-center gap-1 transition-colors"
                      title="Generate random 32-byte secret"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Random Key</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="text-[11px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1 transition-colors"
                      title={showSecret ? "Hide secret" : "Show secret"}
                    >
                      {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showSecret ? "Mask" : "Reveal"}</span>
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type={showSecret ? "text" : "password"}
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    placeholder="Enter secret key or webhook signing secret..."
                    className={cn(
                      "w-full font-mono text-sm tracking-wide bg-white dark:bg-[#1a1d24] border rounded-lg p-3 focus:outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600 transition-all shadow-xs pr-10",
                      hasMissingSecret
                        ? "border-amber-500/80 dark:border-amber-500/70 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                        : "border-zinc-300 dark:border-[#2c303a] text-zinc-900 dark:text-zinc-100 focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20"
                    )}
                  />

                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {secret && (
                      <button
                        onClick={() => setSecret("")}
                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 p-1"
                        title="Clear secret"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {hasMissingSecret && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 animate-fadeIn">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Secret key is required to compute HMAC signature.</span>
                  </p>
                )}
              </div>

              {/* Input 3: Message / Payload Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Payload / Raw Body</span>
                  </label>

                  {payload && (
                    <button
                      onClick={() => setPayload("")}
                      className="text-[11px] text-zinc-400 hover:text-red-500 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>

                <div className="relative">
                  <textarea
                    value={payload}
                    onChange={(e) => setPayload(e.target.value)}
                    placeholder="Enter payload string, JSON body, timestamp, or raw data to sign..."
                    rows={7}
                    className="w-full font-mono text-xs md:text-sm leading-relaxed bg-white dark:bg-[#1a1d24] border border-zinc-300 dark:border-[#2c303a] text-zinc-900 dark:text-zinc-100 rounded-lg p-3.5 focus:outline-none focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 resize-y placeholder:text-zinc-400 dark:placeholder:text-zinc-600 transition-all shadow-xs"
                  />
                </div>

                {/* Counter Footer */}
                <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 px-1 font-mono">
                  <span>
                    {payload.length.toLocaleString()} chars • {payloadByteCount.toLocaleString()} bytes
                  </span>
                  <span className="text-zinc-400 dark:text-zinc-500 text-[10px]">
                    UTF-8 Encoded
                  </span>
                </div>
              </div>

              {/* Optional Signature Verifier Section Toggle */}
              <div className="pt-2 border-t border-zinc-200/70 dark:border-[#22242b]">
                <button
                  type="button"
                  onClick={() => setShowVerifier(!showVerifier)}
                  className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-between w-full py-1.5 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Signature Verifier & Tester</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                    {showVerifier ? "Hide" : "Verify Expected Signature"}
                  </span>
                </button>

                {showVerifier && (
                  <div className="mt-3 p-3.5 rounded-lg bg-zinc-100 dark:bg-[#16181e] border border-zinc-200 dark:border-[#292d37] space-y-2.5 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                        Paste received signature to test match:
                      </label>
                      <span className="text-[10px] text-zinc-400">Supports Hex & Base64</span>
                    </div>

                    <input
                      type="text"
                      value={compareSignature}
                      onChange={(e) => setCompareSignature(e.target.value)}
                      placeholder="e.g. t=123,v1=... or 52bc8... or sha256=..."
                      className="w-full font-mono text-xs bg-white dark:bg-[#1e222b] border border-zinc-300 dark:border-[#323642] text-zinc-900 dark:text-zinc-100 rounded-md p-2.5 focus:outline-none focus:border-emerald-500"
                    />

                    {verificationResult && (
                      <div
                        className={cn(
                          "p-2.5 rounded-md text-xs font-medium flex items-center gap-2 border",
                          verificationResult.match
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                            : "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
                        )}
                      >
                        {verificationResult.match ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span>Signature matches valid {verificationResult.format} digest!</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                            <span>Signatures do NOT match. Check key, payload, or algorithm.</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>


          {/* ================= RIGHT COLUMN: OUTPUT / RESULTS PANEL ================= */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col gap-5 sticky top-20">
            <div className="bg-zinc-50/70 dark:bg-[#131417] border border-zinc-200/90 dark:border-[#24262d] rounded-xl p-4 sm:p-5 md:p-6 shadow-xs flex flex-col gap-5">
              
              {/* Card Header & Segmented Format Control */}
              <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 pb-3.5 border-b border-zinc-200/80 dark:border-[#22242b]">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      HMAC Signature Result
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                      {algo} • {selectedAlgoMeta.bits} bits
                    </p>
                  </div>
                </div>

                {/* Segmented Format Switcher */}
                <div className="inline-flex p-1 bg-zinc-200/70 dark:bg-[#1b1e25] border border-zinc-300/80 dark:border-[#292c36] rounded-lg">
                  <button
                    onClick={() => setOutputFormat("hex")}
                    className={cn(
                      "px-2.5 py-1 text-xs font-semibold rounded-md transition-all",
                      outputFormat === "hex"
                        ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-2xs"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                    )}
                  >
                    HEX
                  </button>
                  <button
                    onClick={() => setOutputFormat("base64")}
                    className={cn(
                      "px-2.5 py-1 text-xs font-semibold rounded-md transition-all",
                      outputFormat === "base64"
                        ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-2xs"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                    )}
                  >
                    BASE64
                  </button>
                  <button
                    onClick={() => setOutputFormat("both")}
                    className={cn(
                      "px-2.5 py-1 text-xs font-semibold rounded-md transition-all",
                      outputFormat === "both"
                        ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-2xs"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                    )}
                  >
                    BOTH
                  </button>
                </div>
              </div>

              {/* Output Content Area */}
              {hexOutput ? (
                <div className="space-y-4">
                  {/* HEX Card */}
                  {(outputFormat === "hex" || outputFormat === "both") && (
                    <div className="bg-white dark:bg-[#181a20] border border-zinc-200 dark:border-[#282b34] rounded-xl p-4 transition-all shadow-xs hover:border-emerald-500/40">
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                            <Hash className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Hex Digest</span>
                          </span>
                          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            {hexOutput.length} chars
                          </span>
                        </div>

                        <button
                          onClick={() => handleCopy(hexOutput, "hex")}
                          className={cn(
                            "h-8 px-2.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 border",
                            copiedType === "hex"
                              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                              : "bg-zinc-100 dark:bg-[#20232b] hover:bg-zinc-200 dark:hover:bg-[#2a2e39] border-zinc-200 dark:border-[#323642] text-zinc-700 dark:text-zinc-300"
                          )}
                          title="Copy Hex hash"
                        >
                          {copiedType === "hex" ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>{copiedType === "hex" ? "Copied!" : "Copy Hex"}</span>
                        </button>
                      </div>

                      <div className="font-mono text-xs md:text-sm text-emerald-600 dark:text-emerald-400 break-all select-all bg-zinc-50 dark:bg-[#0f1115] border border-zinc-200/90 dark:border-[#20222a] p-3.5 rounded-lg leading-relaxed shadow-inner">
                        {hexOutput}
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                        <span>Standard webhook representation</span>
                        <span>{selectedAlgoMeta.bits / 8} bytes</span>
                      </div>
                    </div>
                  )}

                  {/* BASE64 Card */}
                  {(outputFormat === "base64" || outputFormat === "both") && (
                    <div className="bg-white dark:bg-[#181a20] border border-zinc-200 dark:border-[#282b34] rounded-xl p-4 transition-all shadow-xs hover:border-emerald-500/40">
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                            <Binary className="w-3.5 h-3.5 text-blue-500" />
                            <span>Base64 Digest</span>
                          </span>
                          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            {base64Output.length} chars
                          </span>
                        </div>

                        <button
                          onClick={() => handleCopy(base64Output, "base64")}
                          className={cn(
                            "h-8 px-2.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 border",
                            copiedType === "base64"
                              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                              : "bg-zinc-100 dark:bg-[#20232b] hover:bg-zinc-200 dark:hover:bg-[#2a2e39] border-zinc-200 dark:border-[#323642] text-zinc-700 dark:text-zinc-300"
                          )}
                          title="Copy Base64 signature"
                        >
                          {copiedType === "base64" ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>{copiedType === "base64" ? "Copied!" : "Copy Base64"}</span>
                        </button>
                      </div>

                      <div className="font-mono text-xs md:text-sm text-blue-600 dark:text-blue-400 break-all select-all bg-zinc-50 dark:bg-[#0f1115] border border-zinc-200/90 dark:border-[#20222a] p-3.5 rounded-lg leading-relaxed shadow-inner">
                        {base64Output}
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                        <span>Compact Base64 representation</span>
                        <span>MIME Base64</span>
                      </div>
                    </div>
                  )}

                  {/* Implementation code hint snippet */}
                  <div className="p-3.5 rounded-lg bg-zinc-100/70 dark:bg-[#171920] border border-zinc-200/80 dark:border-[#252832] text-xs text-zinc-600 dark:text-zinc-400 flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 font-semibold text-zinc-800 dark:text-zinc-200 text-[11px]">
                      <HelpCircle className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Integration Tip:</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      To verify Stripe or GitHub webhooks in Node.js, compute:
                      <code className="block mt-1 font-mono text-[10px] bg-white dark:bg-[#0d0e12] p-2 rounded border border-zinc-200 dark:border-[#22242e] text-zinc-800 dark:text-zinc-200 select-all">
                        crypto.createHmac(&apos;{algo.toLowerCase()}&apos;, secret).update(rawBody).digest(&apos;hex&apos;)
                      </code>
                    </p>
                  </div>
                </div>
              ) : (
                /* Designed Empty State */
                <div className="border-2 border-dashed border-zinc-200 dark:border-[#272a33] rounded-xl p-8 md:p-12 flex flex-col items-center justify-center text-center gap-3.5 bg-zinc-50/50 dark:bg-[#111216]/50">
                  <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-[#1a1d24] border border-zinc-200 dark:border-[#2a2e38] flex items-center justify-center text-zinc-400 dark:text-zinc-500 shadow-inner">
                    <Shield className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
                  </div>
                  
                  <div className="space-y-1 max-w-sm">
                    <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      No Signature Generated Yet
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      Enter both a <strong className="text-zinc-700 dark:text-zinc-300">Secret Key</strong> and a <strong className="text-zinc-700 dark:text-zinc-300">Payload</strong> on the left to compute the cryptographic HMAC signature in real time.
                    </p>
                  </div>

                  <button
                    onClick={handleLoadSample}
                    className="mt-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Try Sample Webhook</span>
                  </button>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export const HmacTool = HmacGeneratorTool;

