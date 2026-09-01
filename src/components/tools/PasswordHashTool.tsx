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
    <div className="flex flex-col h-full bg-white">
      {/* Top Controls Bar */}
      <div className="h-12 border-b border-zinc-200 px-4 flex items-center justify-between gap-2 shrink-0 bg-white">
        {/* Mode Toggle */}
        <div className="flex items-center p-0.5 rounded-lg bg-zinc-100/70 border border-zinc-200/60">
          <button
            onClick={() => setMode("generate")}
            className={cn(
              "px-3 py-1 rounded-md text-xs font-medium transition-colors",
              mode === "generate"
                ? "bg-white text-zinc-900 shadow-sm ring-1 ring-black/5 font-semibold"
                : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50"
            )}
          >
            Generate Hash
          </button>
          <button
            onClick={() => setMode("verify")}
            className={cn(
              "px-3 py-1 rounded-md text-xs font-medium transition-colors",
              mode === "verify"
                ? "bg-white text-zinc-900 shadow-sm ring-1 ring-black/5 font-semibold"
                : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50"
            )}
          >
            Verify Password Against Hash
          </button>
        </div>

        <div className="flex items-center gap-2">
          <ShareButton
            toolSlug="password-hash"
            data={mode === "generate" ? genResult?.hash || "" : verifyHash}
          />
          <EmbedButton
            toolSlug="password-hash"
            data={mode === "generate" ? genResult?.hash || "" : verifyHash}
          />
          <ExportImageButton
            code={mode === "generate" ? genResult?.hash || "" : verifyHash}
            language="text"
          />
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-zinc-200 overflow-hidden" id="hash-export-card">
        {mode === "generate" ? (
          <>
            {/* Left Column: Generator Parameters */}
            <div className="w-full lg:w-96 flex flex-col min-w-0 bg-zinc-50/30 p-6 overflow-y-auto space-y-6 shrink-0">
              {/* Plaintext Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-zinc-900">Plaintext Password</label>
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-zinc-500 hover:text-zinc-900 flex items-center gap-1"
                  >
                    {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showPassword ? "Hide" : "Show"}</span>
                  </button>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password to hash..."
                  className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 bg-white font-mono text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-shadow"
                />
              </div>

              {/* Algorithm Picker */}
              <div>
                <span className="text-xs font-semibold text-zinc-900 block mb-2">
                  Hashing Algorithm
                </span>
                <div className="space-y-2">
                  {ALGORITHMS.map((a) => {
                    const isSelected = algo === a.id;
                    return (
                      <button
                        key={a.id}
                        onClick={() => setAlgo(a.id)}
                        className={cn(
                          "w-full text-left p-3 rounded-xl border transition-all text-xs",
                          isSelected
                            ? "bg-blue-50/50 border-blue-200 shadow-sm ring-1 ring-blue-500"
                            : "bg-white border-zinc-200 hover:border-zinc-300 text-zinc-600 shadow-xs"
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={cn("font-semibold", isSelected ? "text-blue-900" : "text-zinc-900")}>{a.name}</span>
                          <span
                            className={cn(
                              "px-1.5 py-0.5 rounded text-[10px] font-medium",
                              isSelected ? "bg-blue-100 text-blue-700" : "bg-zinc-100 text-zinc-600"
                            )}
                          >
                            {a.tag}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500">{a.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Algorithm Configuration */}
              {algo === "bcrypt" && (
                <div className="p-3 rounded-lg border border-zinc-200 bg-white space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-800">Bcrypt Cost Factor</span>
                    <span className="font-mono font-bold text-zinc-900">{bcryptRounds} rounds (2^{bcryptRounds})</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="14"
                    value={bcryptRounds}
                    onChange={(e) => setBcryptRounds(parseInt(e.target.value, 10))}
                    className="w-full accent-zinc-900 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-600">
                    <span>Fast (4)</span>
                    <span className="font-medium text-blue-600">OWASP Recommended (10-12)</span>
                    <span>Heavy (14)</span>
                  </div>
                </div>
              )}

              {(algo === "pbkdf2-sha256" || algo === "pbkdf2-sha512") && (
                <div className="p-3 rounded-lg border border-zinc-200 bg-white space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-800">PBKDF2 Iterations</span>
                    <span className="font-mono font-bold text-zinc-900">{pbkdf2Iterations.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="10000"
                    max="600000"
                    step="10000"
                    value={pbkdf2Iterations}
                    onChange={(e) => setPbkdf2Iterations(parseInt(e.target.value, 10))}
                    className="w-full accent-zinc-900 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-600">
                    <span>10k</span>
                    <span className="font-medium text-blue-600">OWASP 600k (High)</span>
                    <span>600k</span>
                  </div>
                </div>
              )}

              {/* Salt Control */}
              <div className="p-3 rounded-lg border border-zinc-200 bg-white space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-800">Salt</span>
                  <button
                    onClick={() => setSalt(generateRandomSalt(16))}
                    className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Generate New Salt</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={salt}
                  onChange={(e) => setSalt(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-zinc-200 bg-zinc-50 font-mono text-[11px] text-zinc-800 focus:outline-none"
                />
              </div>
            </div>

            {/* Right Column: Output Hash Card */}
            <div className="flex-1 flex flex-col min-w-0 bg-white p-6 overflow-y-auto space-y-4">
              <div className="p-5 rounded-xl border border-zinc-200 bg-white shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900">
                    <Lock className="w-4 h-4 text-blue-600" />
                    <span>Generated Cryptographic Hash</span>
                    <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 text-[10px] font-mono uppercase">
                      {algo}
                    </span>
                  </div>
                  {genResult && (
                    <button
                      onClick={() => handleCopy(genResult.hash, "gen_hash")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition-colors"
                    >
                      {copiedKey === "gen_hash" ? <Check className="w-3.5 h-3.5 text-blue-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy Hash</span>
                    </button>
                  )}
                </div>

                <pre className="font-mono text-sm text-zinc-900 break-all whitespace-pre-wrap bg-zinc-50 p-4 rounded-xl border border-zinc-100 leading-relaxed select-all">
                  {genResult?.hash || "Computing hash..."}
                </pre>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
                  <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-100">
                    <span className="text-zinc-600 block text-[11px] mb-0.5">Execution Time</span>
                    <span className="font-mono font-semibold text-zinc-900">
                      {genResult?.executionMs ?? 0} ms
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-100">
                    <span className="text-zinc-600 block text-[11px] mb-0.5">Hash Length</span>
                    <span className="font-mono font-semibold text-zinc-900">
                      {genResult?.hash.length ?? 0} characters
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-100 col-span-2 sm:col-span-1">
                    <span className="text-zinc-600 block text-[11px] mb-0.5">Security Level</span>
                    <span className="font-semibold text-blue-600">Production Ready</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Verify Password Against Hash Mode */
          <div className="flex-1 flex flex-col min-w-0 bg-white p-6 overflow-y-auto space-y-6">
            <div className="max-w-3xl mx-auto w-full space-y-4">
              {/* Hash Input */}
              <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-900">
                    Existing Stored Hash String
                  </label>
                  <span className="text-[11px] font-mono text-blue-600 font-medium">
                    Detected: {detectHashAlgorithm(verifyHash)}
                  </span>
                </div>
                <input
                  type="text"
                  value={verifyHash}
                  onChange={(e) => setVerifyHash(e.target.value)}
                  placeholder="Paste $2b$10$..., $argon2id$..., or $pbkdf2-... hash string"
                  className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 bg-white font-mono text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              {/* Candidate Password Input */}
              <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 space-y-2">
                <label className="text-xs font-semibold text-zinc-900 block">
                  Candidate Password to Test
                </label>
                <input
                  type="text"
                  value={verifyPassword}
                  onChange={(e) => setVerifyPassword(e.target.value)}
                  placeholder="Enter candidate password to verify against hash..."
                  className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 bg-white font-mono text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              {/* Verification Result Banner */}
              {verifyResult && (
                <div
                  className={cn(
                    "p-6 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm",
                    verifyResult.isMatch
                      ? "bg-blue-50 border-blue-200 text-blue-900"
                      : verifyResult.error
                      ? "bg-amber-50 border-amber-200 text-amber-950"
                      : "bg-zinc-50 border-zinc-200 text-zinc-900"
                  )}
                >
                  <div className="flex items-center gap-3.5">
                    {verifyResult.isMatch ? (
                      <CheckCircle2 className="w-8 h-8 text-blue-600 shrink-0" />
                    ) : verifyResult.error ? (
                      <ShieldAlert className="w-8 h-8 text-amber-600 shrink-0" />
                    ) : (
                      <XCircle className="w-8 h-8 text-red-600 shrink-0" />
                    )}
                    <div>
                      <div className="font-bold text-base">
                        {verifyResult.isMatch
                          ? "Password Matches Hash ✅"
                          : verifyResult.error
                          ? "Verification Failed"
                          : "Password Does NOT Match Hash ❌"}
                      </div>
                      <div className="text-xs opacity-80 mt-0.5 font-mono">
                        {verifyResult.error ||
                          `Algorithm: ${verifyResult.algorithmDetected} • Verified in ${verifyResult.executionMs} ms`}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider",
                        verifyResult.isMatch
                          ? "bg-blue-200 text-blue-900"
                          : verifyResult.error
                          ? "bg-amber-200 text-amber-900"
                          : "bg-red-200 text-red-900"
                      )}
                    >
                      {verifyResult.isMatch ? "VALID MATCH" : verifyResult.error ? "FORMAT ERROR" : "NO MATCH"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
