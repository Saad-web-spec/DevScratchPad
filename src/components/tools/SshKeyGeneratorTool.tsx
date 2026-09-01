"use client";

import { useState, useEffect } from "react";
import {
  generateSshKeypair,
  type KeyAlgorithmType,
  type GeneratedKeypair,
} from "@/lib/tools/ssh-key-generator";
import { ShareButton } from "@/components/ShareButton";
import { EmbedButton } from "@/components/EmbedButton";
import { ExportImageButton } from "@/components/ExportImageButton";
import {
  KeyRound,
  RefreshCw,
  Copy,
  Check,
  Download,
  Eye,
  EyeOff,
  Shield,
  Terminal,
  Fingerprint,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { addSnapshot } from "@/lib/storage";

interface SshKeyGeneratorToolProps {
  onValidationChange: (isValid: boolean, error?: string) => void;
  onStatsChange: (length: number, execMs: number) => void;
  onLogHistory?: (input: string) => void;
  restoredInput?: string | null;
}

const ALGORITHMS: { id: KeyAlgorithmType; name: string; tag: string; description: string }[] = [
  {
    id: "ed25519",
    name: "Ed25519",
    tag: "Recommended",
    description: "Modern standard. Fastest, ultra-secure 256-bit Edwards-curve.",
  },
  {
    id: "rsa-2048",
    name: "RSA 2048",
    tag: "Legacy Compatibility",
    description: "Broadest compatibility across legacy servers and cloud providers.",
  },
  {
    id: "rsa-4096",
    name: "RSA 4096",
    tag: "High Security",
    description: "Maximum RSA strength for enterprise compliance requirements.",
  },
  {
    id: "ecdsa-p256",
    name: "ECDSA P-256",
    tag: "NIST Standard",
    description: "Compact 256-bit elliptic curve key using NIST P-256.",
  },
];

export function SshKeyGeneratorTool({
  onValidationChange,
  onStatsChange,
  onLogHistory,
  restoredInput,
}: SshKeyGeneratorToolProps) {
  const [algo, setAlgo] = useState<KeyAlgorithmType>("ed25519");
  const [comment, setComment] = useState<string>("user@devscratchpad");
  const [keypair, setKeypair] = useState<GeneratedKeypair | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleGenerate = async (currentAlgo = algo, currentComment = comment) => {
    setIsGenerating(true);
    const start = performance.now();
    try {
      const result = await generateSshKeypair(currentAlgo, currentComment);
      const end = performance.now();
      setKeypair(result);
      onValidationChange(true);
      onStatsChange(result.publicKeyOpenSSH.length, Math.round((end - start) * 10) / 10);
      onLogHistory?.(`Generated ${currentAlgo} key: ${currentComment}`);
    } catch (err: any) {
      onValidationChange(false, err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    handleGenerate(algo, comment);
  }, [algo]);

  // Save workspace snapshot
  useEffect(() => {
    const handleSave = () => {
      if (keypair) {
        addSnapshot("ssh-key-generator", "SSH Keypair Generator", keypair.publicKeyOpenSSH, JSON.stringify(keypair, null, 2));
      }
    };
    window.addEventListener("save-workspace", handleSave);
    return () => window.removeEventListener("save-workspace", handleSave);
  }, [keypair]);

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getBaseFilename = () => {
    if (algo === "ed25519") return "id_ed25519";
    if (algo === "ecdsa-p256") return "id_ecdsa";
    return "id_rsa";
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Top Bar */}
      <div className="h-12 border-b border-zinc-200 px-4 flex items-center justify-between gap-2 shrink-0 bg-white">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleGenerate()}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isGenerating && "animate-spin")} />
            <span>Generate New Keypair</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <ShareButton toolSlug="ssh-key-generator" data={keypair?.publicKeyOpenSSH || ""} />
          <EmbedButton toolSlug="ssh-key-generator" data={keypair?.publicKeyOpenSSH || ""} />
          <ExportImageButton code={keypair?.publicKeyOpenSSH || ""} language="text" />
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-zinc-200 overflow-hidden" id="ssh-export-card">
        {/* Left Column: Key Parameters & Algorithm Configuration */}
        <div className="w-full lg:w-96 flex flex-col min-w-0 bg-zinc-50/30 p-6 overflow-y-auto space-y-6 shrink-0">
          <div>
            <span className="text-xs font-semibold text-zinc-900 block mb-1">Key Algorithm</span>
            <div className="space-y-2">
              {ALGORITHMS.map((a) => {
                const isSelected = algo === a.id;
                return (
                  <button
                    key={a.id}
                    onClick={() => setAlgo(a.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border transition-all text-xs",
                      isSelected
                        ? "bg-blue-50/50 border-blue-200 shadow-sm ring-1 ring-blue-500"
                        : "bg-white border-zinc-200 hover:border-zinc-300 text-zinc-600"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-zinc-900">{a.name}</span>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-medium",
                          isSelected ? "bg-blue-100 text-blue-700" : "bg-zinc-100 text-zinc-600"
                        )}
                      >
                        {a.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-normal">{a.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-900 block mb-1">
              Key Comment / Identity
            </label>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onBlur={() => handleGenerate()}
              placeholder="e.g. user@devscratchpad"
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white font-mono text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
            <span className="text-[11px] text-zinc-600 mt-1 block">
              Appended to the end of your public key.
            </span>
          </div>

          <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200 text-xs text-blue-900 leading-relaxed">
            <div className="flex items-center gap-1.5 font-semibold text-blue-950 mb-1">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <span>100% In-Browser Cryptography</span>
            </div>
            Keys are generated using the browser&apos;s native W3C WebCrypto API. Private keys never leave your device.
          </div>
        </div>

        {/* Right Column: Generated Keys & Randomart */}
        <div className="flex-1 flex flex-col min-w-0 bg-white overflow-y-auto p-6 space-y-6 lg:p-8 lg:space-y-8">
          {keypair ? (
            <>
              {/* Public Key Card */}
              <div className="p-6 rounded-2xl border border-zinc-200/60 bg-white shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900">
                    <KeyRound className="w-4 h-4 text-blue-600" />
                    <span>Public Key (OpenSSH format)</span>
                    <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 text-[10px] font-mono">
                      {keypair.keyType} ({keypair.keySize} bits)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopy(keypair.publicKeyOpenSSH, "pub")}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium transition-colors"
                    >
                      {copiedKey === "pub" ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy</span>
                    </button>
                    <button
                      onClick={() => handleDownload(keypair.publicKeyOpenSSH, `${getBaseFilename()}.pub`)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>.pub</span>
                    </button>
                  </div>
                </div>
                <pre className="font-mono text-xs text-zinc-800 break-all whitespace-pre-wrap bg-zinc-50/50 p-4 rounded-xl border border-zinc-100/50 select-all leading-relaxed">
                  {keypair.publicKeyOpenSSH}
                </pre>
              </div>

              {/* Private Key Card */}
              <div className="p-6 rounded-2xl border border-zinc-200/60 bg-white shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900">
                    <Shield className="w-4 h-4 text-amber-600" />
                    <span>Private Key (PKCS#8 PEM format)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setShowPrivateKey(!showPrivateKey)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium transition-colors"
                    >
                      {showPrivateKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showPrivateKey ? "Hide" : "Reveal"}</span>
                    </button>
                    <button
                      onClick={() => handleCopy(keypair.privateKeyPem, "priv")}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium transition-colors"
                    >
                      {copiedKey === "priv" ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy</span>
                    </button>
                    <button
                      onClick={() => handleDownload(keypair.privateKeyPem, getBaseFilename())}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>.pem</span>
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <pre
                    className={cn(
                      "font-mono text-xs text-zinc-800 break-all whitespace-pre-wrap bg-zinc-50/50 p-4 rounded-xl border border-zinc-100/50 max-h-36 overflow-y-auto leading-relaxed select-all",
                      !showPrivateKey && "blur-xs select-none"
                    )}
                  >
                    {keypair.privateKeyPem}
                  </pre>
                  {!showPrivateKey && (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/10 backdrop-blur-[2px] rounded-lg">
                      <button
                        onClick={() => setShowPrivateKey(true)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-medium shadow-md hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Click to reveal Private Key</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Fingerprints & Randomart Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Fingerprints */}
                <div className="p-6 rounded-2xl border border-zinc-200/60 bg-white shadow-sm flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-zinc-900">
                    <Fingerprint className="w-4 h-4 text-purple-600" />
                    <span>Public Key Fingerprints</span>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div className="p-4 rounded-xl bg-zinc-50/50 border border-zinc-100/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-medium text-zinc-600">SHA-256 Fingerprint</span>
                        <button
                          onClick={() => handleCopy(keypair.fingerprintSha256, "fp256")}
                          className="p-0.5 text-zinc-500 hover:text-zinc-900"
                        >
                          {copiedKey === "fp256" ? <Check className="w-3 h-3 text-blue-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                      <span className="font-mono text-zinc-900 break-all">{keypair.fingerprintSha256}</span>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-50/50 border border-zinc-100/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-medium text-zinc-600">MD5 (Legacy) Fingerprint</span>
                        <button
                          onClick={() => handleCopy(keypair.fingerprintMd5, "fpmd5")}
                          className="p-0.5 text-zinc-500 hover:text-zinc-900"
                        >
                          {copiedKey === "fpmd5" ? <Check className="w-3 h-3 text-blue-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                      <span className="font-mono text-zinc-900 break-all">{keypair.fingerprintMd5}</span>
                    </div>
                  </div>
                </div>

                {/* OpenSSH Randomart Terminal Card */}
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 shadow-xs flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                      <Terminal className="w-4 h-4 text-blue-400" />
                      <span>OpenSSH Randomart Visualizer</span>
                    </div>
                    <button
                      onClick={() => handleCopy(keypair.randomart, "art")}
                      className="p-1 text-zinc-400 hover:text-white"
                      title="Copy ASCII art"
                    >
                      {copiedKey === "art" ? <Check className="w-3.5 h-3.5 text-blue-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <pre className="flex-1 font-mono text-xs text-blue-400 bg-black p-3 rounded-lg border border-zinc-800 flex items-center justify-center leading-tight select-all">
                    {keypair.randomart}
                  </pre>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-zinc-600">Generating cryptographic keypair...</div>
          )}
        </div>
      </div>
    </div>
  );
}
