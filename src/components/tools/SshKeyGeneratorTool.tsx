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
    <div className="flex flex-col h-full bg-white overflow-y-auto relative">
      {/* Top Controls Bar (Unified Clean Header) */}
      <div className="h-10 border-b border-neutral-200 px-4 flex items-center justify-between gap-4 shrink-0 bg-white">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-xs font-mono font-medium text-neutral-600">SSH Keypair Generator</span>
        </div>

        <div className="flex items-center gap-1.5">
          <ShareButton toolSlug="ssh-key-generator" data={keypair?.publicKeyOpenSSH || ""} />
          <EmbedButton toolSlug="ssh-key-generator" data={keypair?.publicKeyOpenSSH || ""} />
          <ExportImageButton code={keypair?.publicKeyOpenSSH || ""} language="text" />
        </div>
      </div>

      {/* Main Workspace Layout (Strict Dual-Pane Grid) */}
      <div className="flex-1 min-h-[620px] grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-neutral-200 overflow-hidden bg-neutral-50/30" id="ssh-key-export">
        {/* Left Pane: Configuration */}
        <div className="flex flex-col h-full bg-white relative min-h-0">
          <div className="h-10 border-b border-neutral-200 bg-neutral-50/50 flex items-center justify-between px-4 shrink-0">
            <span className="text-xs font-mono font-semibold text-neutral-700">Key Configuration</span>
          </div>
          <div className="flex-1 p-6 overflow-y-auto relative space-y-6">
            
            {/* Algorithm Selector Grid */}
            <div className="space-y-3">
              <label className="text-[11px] font-semibold text-neutral-900 uppercase tracking-wider block">
                Key Algorithm
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ALGORITHMS.map((a) => {
                  const isSelected = algo === a.id;
                  return (
                    <button
                      key={a.id}
                      onClick={() => setAlgo(a.id)}
                      className={cn(
                        "p-3 rounded-lg border text-left transition-colors relative focus:outline-none flex flex-col gap-1.5",
                        isSelected
                          ? "border-neutral-900 bg-neutral-50 shadow-sm"
                          : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/50"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={cn(
                          "font-mono text-sm",
                          isSelected ? "text-neutral-900 font-semibold" : "text-neutral-700 font-medium"
                        )}>
                          {a.name}
                        </span>
                        <span className="text-[10px] text-neutral-500 bg-neutral-100 border border-neutral-200/60 px-1.5 py-0.5 rounded font-medium">
                          {a.tag}
                        </span>
                      </div>
                      <span className="text-[11px] text-neutral-500 leading-tight">
                        {a.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comment Input */}
            <div className="space-y-2">
              <label htmlFor="key-comment" className="text-[11px] font-semibold text-neutral-900 uppercase tracking-wider block">
                Key Comment / Identity
              </label>
              <input
                id="key-comment"
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="user@devscratchpad"
                className="w-full h-10 px-3 bg-white border border-neutral-200 rounded-lg text-sm font-mono text-neutral-900 focus:outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 transition-all placeholder:text-neutral-400"
              />
            </div>

            {/* Generate Action */}
            <div className="pt-2">
              <button
                onClick={() => handleGenerate()}
                disabled={isGenerating}
                className="w-full h-10 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
              >
                <RefreshCw className={cn("w-4 h-4", isGenerating && "animate-spin")} />
                <span>Generate New Keypair</span>
              </button>
            </div>

          </div>
        </div>

        {/* Right Pane: Parsed Output */}
        <div className="flex flex-col h-full bg-neutral-50/30 min-h-0">
          <div className="h-10 border-b border-neutral-200 bg-neutral-50/50 flex items-center justify-between px-4 shrink-0">
            <span className="text-xs font-mono font-semibold text-neutral-700">Cryptographic Material</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 relative">
            {keypair ? (
              <div className="space-y-4">
                
                {/* Public Key Card */}
                <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden flex flex-col shadow-sm">
                  <div className="h-10 px-3 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-neutral-800 font-mono">Public Key (OpenSSH)</span>
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 border border-blue-200 rounded text-[9px] font-bold uppercase tracking-wider">
                        {algo.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopy(keypair.publicKeyOpenSSH, "pub")}
                        className="flex items-center gap-1.5 px-2 py-1 rounded border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-[11px] font-medium transition-colors"
                      >
                        {copiedKey === "pub" ? <Check className="w-3.5 h-3.5 text-neutral-900" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copy</span>
                      </button>
                      <button
                        onClick={() => handleDownload(keypair.publicKeyOpenSSH, `${getBaseFilename()}.pub`)}
                        className="flex items-center gap-1.5 px-2 py-1 rounded border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-[11px] font-medium transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>.pub</span>
                      </button>
                    </div>
                  </div>
                  <pre className="p-3 bg-white text-neutral-800 text-xs font-mono break-all whitespace-pre-wrap select-all m-0 max-h-24 overflow-y-auto">
                    {keypair.publicKeyOpenSSH}
                  </pre>
                </div>

                {/* Private Key Card */}
                <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden flex flex-col shadow-sm">
                  <div className="h-10 px-3 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-neutral-800 font-mono">Private Key (PKCS#8 PEM)</span>
                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 border border-amber-200 rounded text-[9px] font-bold uppercase tracking-wider">
                        SECRET
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setShowPrivateKey(!showPrivateKey)}
                        className="flex items-center gap-1.5 px-2 py-1 rounded border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-[11px] font-medium transition-colors"
                      >
                        {showPrivateKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{showPrivateKey ? "Hide" : "Reveal"}</span>
                      </button>
                      <button
                        onClick={() => handleCopy(keypair.privateKeyPem, "priv")}
                        className="flex items-center gap-1.5 px-2 py-1 rounded border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-[11px] font-medium transition-colors"
                      >
                        {copiedKey === "priv" ? <Check className="w-3.5 h-3.5 text-neutral-900" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copy</span>
                      </button>
                      <button
                        onClick={() => handleDownload(keypair.privateKeyPem, getBaseFilename())}
                        className="flex items-center gap-1.5 px-2 py-1 rounded border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-[11px] font-medium transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>.pem</span>
                      </button>
                    </div>
                  </div>
                  <div className="relative bg-white">
                    <pre className={cn(
                      "p-3 text-neutral-800 text-[11px] font-mono break-all whitespace-pre-wrap select-all m-0 max-h-36 overflow-y-auto leading-relaxed",
                      !showPrivateKey && "blur-xs select-none opacity-40"
                    )}>
                      {keypair.privateKeyPem}
                    </pre>
                    {!showPrivateKey && (
                      <div className="absolute inset-0 flex items-center justify-center bg-neutral-100/30 backdrop-blur-[2px]">
                        <button
                          onClick={() => setShowPrivateKey(true)}
                          className="px-4 py-2 rounded-lg border border-neutral-300 bg-white text-neutral-900 text-[11px] font-semibold shadow-xs hover:bg-neutral-50 transition-colors flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Click to reveal Private Key</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Fingerprints & Randomart Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Fingerprints */}
                  <div className="bg-white border border-neutral-200 rounded-lg flex flex-col shadow-sm">
                    <div className="h-8 px-3 bg-neutral-50 border-b border-neutral-200 flex items-center shrink-0">
                      <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Fingerprints</span>
                    </div>
                    <div className="p-3 space-y-3 bg-white">
                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] font-medium text-neutral-500 uppercase">SHA-256</span>
                          <button
                            onClick={() => handleCopy(keypair.fingerprintSha256, "fp256")}
                            className="text-neutral-400 hover:text-neutral-900 transition-colors"
                          >
                            {copiedKey === "fp256" ? <Check className="w-3.5 h-3.5 text-neutral-900" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <span className="font-mono text-[11px] text-neutral-900 break-all">{keypair.fingerprintSha256}</span>
                      </div>
                      <div className="border-t border-neutral-100 pt-3">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] font-medium text-neutral-500 uppercase">MD5</span>
                          <button
                            onClick={() => handleCopy(keypair.fingerprintMd5, "fpmd5")}
                            className="text-neutral-400 hover:text-neutral-900 transition-colors"
                          >
                            {copiedKey === "fpmd5" ? <Check className="w-3.5 h-3.5 text-neutral-900" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <span className="font-mono text-[11px] text-neutral-900 break-all">{keypair.fingerprintMd5}</span>
                      </div>
                    </div>
                  </div>

                  {/* Randomart */}
                  <div className="bg-neutral-950 border border-neutral-800 rounded-lg flex flex-col shadow-sm">
                    <div className="h-8 px-3 bg-neutral-900/50 border-b border-neutral-800 flex items-center justify-between shrink-0">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Randomart</span>
                      <button
                        onClick={() => handleCopy(keypair.randomart, "art")}
                        className="text-neutral-500 hover:text-neutral-200 transition-colors"
                      >
                        {copiedKey === "art" ? <Check className="w-3 h-3 text-neutral-200" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <div className="flex-1 p-3 flex items-center justify-center">
                      <pre className="font-mono text-[10px] text-neutral-300 leading-tight select-all m-0">
                        {keypair.randomart}
                      </pre>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="p-8 text-center text-neutral-400 font-mono text-sm">
                Generating cryptographic keypair...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}