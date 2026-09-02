"use client";

import { useState, useEffect } from "react";
import {
  generatePasswordHash,
  verifyPasswordHash,
  detectHashAlgorithm,
  generateRandomSalt,
  type PasswordAlgorithm,
  type HashGenerationResult,
  type HashVerificationResult,
} from "@/lib/tools/password-hash";
import { ShareButton } from "@/components/ShareButton";
import { EmbedButton } from "@/components/EmbedButton";
import { ExportImageButton } from "@/components/ExportImageButton";
import {
  Lock,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  Sliders,
  CheckCircle2,
  XCircle,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VerificationBadge } from "@/components/ui/VerificationBadge";
import { addSnapshot } from "@/lib/storage";

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

export function PasswordHashTool({
  onValidationChange,
  onStatsChange,
  onLogHistory,
  restoredInput,
}: PasswordHashToolProps) {
  const [mode, setMode] = useState<"generate" | "verify">("generate");

  // Generator State
  const [algo, setAlgo] = useState<PasswordAlgorithm>("bcrypt");
  const [password, setPassword] = useState<string>("CorrectHorseBatteryStaple!2026");
  const [showPassword, setShowPassword] = useState(false);
  const [bcryptRounds, setBcryptRounds] = useState(10);
  const [pbkdf2Iterations, setPbkdf2Iterations] = useState(100000);
  const [salt, setSalt] = useState<string>(() => generateRandomSalt(16));
  const [genResult, setGenResult] = useState<HashGenerationResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Verifier State
  const [verifyHash, setVerifyHash] = useState<string>(
    "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
  );
  const [verifyPassword, setVerifyPassword] = useState<string>("CorrectHorseBatteryStaple!2026");
  const [verifyResult, setVerifyResult] = useState<HashVerificationResult | null>(null);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Generate Hash
  const handleGenerate = async () => {
    setIsGenerating(true);
    const start = performance.now();
    try {
      const res = await generatePasswordHash({
        algorithm: algo,
        password,
        bcryptRounds,
        pbkdf2Iterations,
        salt,
      });
      const end = performance.now();
      setGenResult(res);
      onValidationChange(true);
      onStatsChange(password.length, Math.round((end - start) * 10) / 10);
      onLogHistory?.(`Hashed password with ${algo}`);
    } catch (err: any) {
      onValidationChange(false, err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (mode === "generate") {
      handleGenerate();
    }
  }, [algo, password, bcryptRounds, pbkdf2Iterations, salt, mode]);

  // Verify Hash
  useEffect(() => {
    if (mode === "verify") {
      const start = performance.now();
      verifyPasswordHash(verifyPassword, verifyHash).then((res) => {
        const end = performance.now();
        setVerifyResult(res);
        onValidationChange(!res.error, res.error);
        onStatsChange(verifyHash.length, Math.round((end - start) * 10) / 10);
      });
    }
  }, [verifyHash, verifyPassword, mode]);

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

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-y-auto relative">
      {/* Top Controls Bar (Unified Clean Header) */}
      <div className="h-10 border-b border-neutral-200 px-4 flex items-center justify-between gap-4 shrink-0 bg-white">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <div className="bg-neutral-100 p-0.5 rounded-md inline-flex gap-0.5 border border-neutral-200 shadow-sm">
            <button
              onClick={() => setMode("generate")}
              className={cn(
                "text-[11px] px-3 py-1 rounded transition-all font-medium",
                mode === "generate" ? "bg-white text-neutral-900 shadow-xs" : "text-neutral-500 hover:text-neutral-900"
              )}
            >
              Generate Hash
            </button>
            <button
              onClick={() => setMode("verify")}
              className={cn(
                "text-[11px] px-3 py-1 rounded transition-all font-medium",
                mode === "verify" ? "bg-white text-neutral-900 shadow-xs" : "text-neutral-500 hover:text-neutral-900"
              )}
            >
              Verify Password Against Hash
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <ShareButton toolSlug="password-hash" data={genResult?.hash || ""} />
          <EmbedButton toolSlug="password-hash" data={genResult?.hash || ""} />
          <ExportImageButton code={genResult?.hash || ""} language="text" />
        </div>
      </div>

      <div className="flex-1 min-h-[520px] grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-neutral-200 overflow-hidden bg-neutral-50/30" id="password-hash-export">
        
        {/* Left Pane: Configuration & Input */}
        <div className="flex flex-col h-full bg-white relative min-h-0">
          <div className="h-10 border-b border-neutral-200 bg-neutral-50/50 flex items-center justify-between px-4 shrink-0">
            <span className="text-xs font-mono font-semibold text-neutral-700">
              {mode === "generate" ? "Hash Configuration" : "Verification Inputs"}
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 relative space-y-4">
            {mode === "generate" ? (
              <>
                {/* Algorithm Selector */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-neutral-900 uppercase tracking-wider block">
                    Hashing Algorithm
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                    {ALGORITHMS.map((a) => {
                      const isSelected = algo === a.id;
                      return (
                        <button
                          key={a.id}
                          onClick={() => setAlgo(a.id)}
                          className={cn(
                            "p-2 rounded-md border text-left transition-all flex flex-col gap-1 focus:outline-none",
                            isSelected
                              ? "border-neutral-900 bg-neutral-50 font-medium shadow-sm"
                              : "border-neutral-200 bg-white hover:border-neutral-400"
                          )}
                        >
                          <span className={cn("text-xs w-full block", isSelected ? "text-neutral-900 font-semibold" : "text-neutral-700")}>{a.name}</span>
                          <span className="text-[9px] text-neutral-500 bg-neutral-100 border border-neutral-200/60 px-1.5 py-0.5 rounded w-fit">{a.tag}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-neutral-900 uppercase tracking-wider block">
                    Plaintext Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password to hash..."
                      className="w-full h-9 pl-3 pr-10 bg-white border border-neutral-200 rounded-md text-sm font-mono text-neutral-900 focus:outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 placeholder:text-neutral-400 transition-shadow"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-700 transition-colors"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Parameters Box */}
                <div className="bg-neutral-50 p-3 rounded-md border border-neutral-200 mt-3 space-y-4">
                  {algo === "bcrypt" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-neutral-800 uppercase tracking-wider">Bcrypt Cost Factor</span>
                        <span className="font-mono text-xs font-bold text-neutral-900">{bcryptRounds}</span>
                      </div>
                      <input
                        type="range"
                        min="4"
                        max="14"
                        value={bcryptRounds}
                        onChange={(e) => setBcryptRounds(parseInt(e.target.value, 10))}
                        className="w-full accent-neutral-900 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-neutral-500 font-medium">
                        <span>Fast (4)</span>
                        <span>OWASP Rec (10-12)</span>
                        <span>Heavy (14)</span>
                      </div>
                    </div>
                  )}

                  {(algo === "pbkdf2-sha256" || algo === "pbkdf2-sha512") && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-neutral-800 uppercase tracking-wider">Iterations</span>
                        <span className="font-mono text-xs font-bold text-neutral-900">{pbkdf2Iterations.toLocaleString()}</span>
                      </div>
                      <input
                        type="range"
                        min="10000"
                        max="600000"
                        step="10000"
                        value={pbkdf2Iterations}
                        onChange={(e) => setPbkdf2Iterations(parseInt(e.target.value, 10))}
                        className="w-full accent-neutral-900 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-neutral-500 font-medium">
                        <span>10k</span>
                        <span>OWASP High (600k)</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-neutral-800 uppercase tracking-wider">Cryptographic Salt</span>
                      <button
                        onClick={() => setSalt(generateRandomSalt(16))}
                        className="text-[10px] text-neutral-500 hover:text-neutral-900 font-medium transition-colors flex items-center gap-1 bg-white border border-neutral-200 px-1.5 py-0.5 rounded shadow-sm"
                      >
                        <RefreshCw className="w-3 h-3" /> Generate New
                      </button>
                    </div>
                    <input
                      type="text"
                      value={salt}
                      onChange={(e) => setSalt(e.target.value)}
                      className="w-full h-8 px-2.5 border border-neutral-200 bg-white rounded font-mono text-[11px] text-neutral-800 focus:outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Verify Mode Left Pane */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-neutral-900 uppercase tracking-wider block">
                        Existing Stored Hash String
                      </label>
                      <span className="text-[10px] font-mono text-neutral-500 font-medium bg-neutral-100 border border-neutral-200 px-1.5 py-0.5 rounded">
                        {detectHashAlgorithm(verifyHash) || "Unknown"}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={verifyHash}
                      onChange={(e) => setVerifyHash(e.target.value)}
                      placeholder="Paste $2b$10$..., $argon2id$..., etc."
                      className="w-full h-9 px-3 bg-white border border-neutral-200 rounded-md text-xs font-mono text-neutral-900 focus:outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 transition-shadow"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-neutral-900 uppercase tracking-wider block">
                      Candidate Password to Test
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={verifyPassword}
                        onChange={(e) => setVerifyPassword(e.target.value)}
                        placeholder="Enter password..."
                        className="w-full h-9 pl-3 pr-10 bg-white border border-neutral-200 rounded-md text-sm font-mono text-neutral-900 focus:outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 placeholder:text-neutral-400 transition-shadow"
                      />
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-700 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Pane: Output */}
        <div className="flex flex-col h-full bg-neutral-50/30 min-h-0">
          <div className="h-10 border-b border-neutral-200 bg-neutral-50/50 flex items-center justify-between px-4 shrink-0">
            <span className="text-xs font-mono font-semibold text-neutral-700 flex items-center gap-3">
              {mode === "generate" ? "Generated Hash Output" : "Verification Status"}
              {mode === "verify" && (
                <VerificationBadge 
                  status={!verifyResult ? 'idle' : verifyResult.isMatch ? 'success' : 'error'}
                  text={!verifyResult ? 'Waiting for input...' : verifyResult.isMatch ? 'Match' : 'Mismatch'}
                />
              )}
            </span>
            {mode === "generate" && genResult && (
              <button
                onClick={() => handleCopy(genResult.hash, "gen_hash")}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-[11px] font-medium transition-colors shadow-sm"
              >
                {copiedKey === "gen_hash" ? <Check className="w-3.5 h-3.5 text-neutral-900" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Hash</span>
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 relative flex flex-col gap-4">
            {mode === "generate" ? (
              <>
                <div className="bg-white border border-neutral-200 rounded-lg shadow-sm flex flex-col">
                   <div className="p-3.5 bg-neutral-50 border-b border-neutral-200 font-mono text-xs text-neutral-900 break-all select-all whitespace-pre-wrap rounded-t-lg">
                      {genResult?.hash || "Computing hash..."}
                   </div>
                   <div className="grid grid-cols-3 divide-x divide-neutral-200 bg-white rounded-b-lg">
                      <div className="p-2.5 flex flex-col gap-0.5">
                         <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Time</span>
                         <span className="font-mono text-xs font-semibold text-neutral-800">{genResult?.executionMs ?? 0} ms</span>
                      </div>
                      <div className="p-2.5 flex flex-col gap-0.5">
                         <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Length</span>
                         <span className="font-mono text-xs font-semibold text-neutral-800">{genResult?.hash.length ?? 0} chars</span>
                      </div>
                      <div className="p-2.5 flex flex-col gap-0.5">
                         <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Status</span>
                         <span className="font-sans text-xs font-semibold text-neutral-800">Production Ready</span>
                      </div>
                   </div>
                </div>
              </>
            ) : (
              <>
                {verifyResult ? (
                  <div
                    className={cn(
                      "p-6 rounded-lg border flex flex-col items-start gap-4 shadow-sm",
                      verifyResult.isMatch
                        ? "bg-green-50 border-green-200 text-green-900"
                        : verifyResult.error
                        ? "bg-amber-50 border-amber-200 text-amber-950"
                        : "bg-red-50 border-red-200 text-red-900"
                    )}
                  >
                    <div className="flex items-center gap-3.5 w-full">
                      {verifyResult.isMatch ? (
                        <CheckCircle2 className="w-8 h-8 text-green-600 shrink-0" />
                      ) : verifyResult.error ? (
                        <ShieldAlert className="w-8 h-8 text-amber-600 shrink-0" />
                      ) : (
                        <XCircle className="w-8 h-8 text-red-600 shrink-0" />
                      )}
                      <div className="flex-1">
                        <div className="font-bold text-base">
                          {verifyResult.isMatch
                            ? "Password Matches Hash"
                            : verifyResult.error
                            ? "Verification Failed"
                            : "Password Does NOT Match Hash"}
                        </div>
                        <div className="text-[11px] opacity-80 mt-0.5 font-mono">
                          {verifyResult.error ||
                            `Algorithm: ${verifyResult.algorithmDetected} � Verified in ${verifyResult.executionMs} ms`}
                        </div>
                      </div>
                    </div>

                    <div className="w-full">
                      <span
                        className={cn(
                          "px-3 py-1 rounded text-[11px] font-bold uppercase tracking-wider border",
                          verifyResult.isMatch
                            ? "bg-green-100 text-green-800 border-green-200"
                            : verifyResult.error
                            ? "bg-amber-100 text-amber-800 border-amber-200"
                            : "bg-red-100 text-red-800 border-red-200"
                        )}
                      >
                        {verifyResult.isMatch ? "VALID MATCH" : verifyResult.error ? "FORMAT ERROR" : "NO MATCH"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-neutral-400 font-mono text-sm">
                    Awaiting verification inputs...
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}