"use client";

import { useState, useEffect } from "react";
import {
  decodeCertificateOrCsr,
  type DecodedCertificate,
} from "@/lib/tools/cert-decoder";
import { ShareButton } from "@/components/ShareButton";
import { EmbedButton } from "@/components/EmbedButton";
import { ExportImageButton } from "@/components/ExportImageButton";
import {
  ShieldCheck,
  ShieldAlert,
  FileCheck,
  Copy,
  Trash2,
  Check,
  Upload,
  Calendar,
  Lock,
  Globe,
  Award,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { addSnapshot } from "@/lib/storage";

interface CertDecoderToolProps {
  onValidationChange: (isValid: boolean, error?: string) => void;
  onStatsChange: (length: number, execMs: number) => void;
  onLogHistory?: (input: string) => void;
  restoredInput?: string | null;
}

// Preloaded sample self-signed test certificate for instant preview
const SAMPLE_CERT = `-----BEGIN CERTIFICATE-----
MIIDRjCCAi6gAwIBAgIUW6w3l1Fq7vjK0zQ5zQ3l1Fq7vjMwDQYJKoZIhvcNAQEL
BQAwNDELMAkGA1UEBhMCVVMxEzARBgNVBAoMCkRldlNjcmF0Y2gxEDAOBgNVBAMM
B2Rldi5sb2MwHhcNMjYwMTAxMDAwMDAwWhcNMjcwMTAxMDAwMDAwWjA0MQswCQYD
VQQGEwJVUzETMBEGA1UECgwKRGV2U2NyYXRjaDEQMA4GA1UEAwwHZGV2LmxvYzCC
ASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAL0WJ1aR8v9t6Q8tN5mZ9s7q
q4mX+p+kUe4/5X3aO1XmP7K1iJ9vB2tZ6Q0zO7gV3e1zP9oK7v1b8m9k3m2n8q4+
r0t1s2u3v4w5x6y7z8A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3
X4Y5Z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2A3B4C5
D6E7F8G9H0I1J2K3L4M5N6O7P8Q9R0S1T2U3V4W5X6Y7Z8a9b0c1d2e3f4g5h6i7
AgMBAAGjUDBOMB0GA1UdDgQWBBTs/p0Q4Z9oK8u2q3v4w5x6y7z8AjAfBgNVHSME
GDAWgBTs/p0Q4Z9oK8u2q3v4w5x6y7z8AjAMBgNVHRMEBTADAQH/MA0GCSqGSIb3
DQEBCwUAA4IBAQBV9q3r4s5t6u7v8w9x0y1z2A3B4C5D6E7F8G9H0I1J2K3L4M5N
6O7P8Q9R0S1T2U3V4W5X6Y7Z8a9b0c1d2e3f4g5h6i7j8k9l0m1n2o3p4q5r6s7t
8u9v0w1x2y3z4A5B6C7D8E9F0G1H2I3J4K5L6M7N8O9P0Q1R2S3T4U5V6W7X8Y9Z
-----END CERTIFICATE-----`;

const SAMPLE_CSR = `-----BEGIN CERTIFICATE REQUEST-----
MIICvDCCAaQCAQAwdzELMAkGA1UEBhMCVVMxEDAOBgNVBAgMB0Zsb3JpZGExETAP
BgNVBAcMCE9ybGFuZG8xGTAXBgNVBAoMEERldlNjcmF0Y2hwYWQgTExDMRgwFgYD
VQQDDA9kZXZzY3JhdGNocGFkLnRlY2gxITAfBgkqhkiG9w0BCQEWEnVzZXJAZGV2
c2NyYXRjaHBhZC50ZWNoMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA
yR4Z7w1w5v7s8q9r4s5t6u7v8w9x0y1z2A3B4C5D6E7F8G9H0I1J2K3L4M5N6O7P
8Q9R0S1T2U3V4W5X6Y7Z8a9b0c1d2e3f4g5h6i7j8k9l0m1n2o3p4q5r6s7t8u9v
0w1x2y3z4A5B6C7D8E9F0G1H2I3J4K5L6M7N8O9P0Q1R2S3T4U5V6W7X8Y9Z0a1b
2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6A7B8C9D0E1F2G3H
AgMBAAGgADANBgkqhkiG9w0BAQsFAAOCAQEAPq1r2s3t4u5v6w7x8y9z0a1b2c3d
4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6A7B8C9D0E1F2G3H4I5J
6K7L8M9N0O1P2Q3R4S5T6U7V8W9X0Y1Z2a3b4c5d6e7f8g9h0i1j2k3l4m5n6o7p
-----END CERTIFICATE REQUEST-----`;

export function CertDecoderTool({
  onValidationChange,
  onStatsChange,
  onLogHistory,
  restoredInput,
}: CertDecoderToolProps) {
  const [input, setInput] = useState<string>("");
  const [certData, setCertData] = useState<DecodedCertificate | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Restore from history
  useEffect(() => {
    if (restoredInput) setInput(restoredInput);
  }, [restoredInput]);

  // Decode when input changes
  useEffect(() => {
    let isCancelled = false;
    const start = performance.now();
    decodeCertificateOrCsr(input).then((res) => {
      if (!isCancelled) {
        setCertData(res);
        const end = performance.now();
        onStatsChange(input.length, Math.round((end - start) * 10) / 10);
        onValidationChange(res.valid, res.error);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [input, onValidationChange, onStatsChange]);

  // Save workspace snapshot
  useEffect(() => {
    const handleSave = () => {
      addSnapshot("cert-decoder", "X.509 Certificate Decoder", input, JSON.stringify(certData, null, 2));
    };
    window.addEventListener("save-workspace", handleSave);
    return () => window.removeEventListener("save-workspace", handleSave);
  }, [input, certData]);

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    onLogHistory?.(input);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) setInput(content);
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Top Controls Bar (Unified Clean Header) */}
      <div className="h-10 border-b border-neutral-200 px-4 flex items-center justify-between gap-4 shrink-0 bg-white">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <label className="border border-neutral-300 bg-white text-neutral-800 text-xs px-3 py-1.5 rounded-md flex items-center gap-2 hover:bg-neutral-50 cursor-pointer transition-colors shadow-sm">
            <Upload className="w-3.5 h-3.5" />
            <span className="font-medium">Upload Certificate</span>
            <input type="file" className="hidden" onChange={handleFileUpload} accept=".pem,.crt,.cer,.csr,.txt" />
          </label>
        </div>

        <div className="flex items-center gap-1.5">
          <ShareButton toolSlug="cert-decoder" data={input} />
          <EmbedButton toolSlug="cert-decoder" data={input} />
          <ExportImageButton code={input} language="text" />
        </div>
      </div>

      {/* Main Workspace Layout (Strict Dual-Pane Grid) */}
      <div className="flex-1 min-h-[600px] grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-neutral-200 overflow-hidden bg-neutral-50/30" id="cert-decoder-export">
        {/* Left Pane: Input Editor */}
        <div className="flex flex-col h-full bg-white relative min-h-0">
          <div className="h-10 border-b border-neutral-200 bg-neutral-50/50 flex items-center justify-between px-4 shrink-0">
            <span className="text-xs font-mono font-semibold text-neutral-700">PEM / CSR Input</span>
            <button
              onClick={() => setInput("")}
              className="p-1.5 rounded text-neutral-400 hover:text-neutral-900 hover:bg-neutral-200/50 transition-colors flex items-center justify-center"
              title="Clear input"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 p-0 overflow-y-auto relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your -----BEGIN CERTIFICATE----- or -----BEGIN CERTIFICATE REQUEST----- here..."
              className="w-full h-full p-4 font-mono text-sm text-neutral-900 bg-transparent resize-none border-0 outline-none focus:ring-0 leading-relaxed placeholder:text-neutral-400"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Right Pane: Parsed Output */}
        <div className="flex flex-col h-full bg-neutral-50/30 min-h-0">
          <div className="h-10 border-b border-neutral-200 bg-neutral-50/50 flex items-center justify-between px-4 shrink-0">
            <span className="text-xs font-mono font-semibold text-neutral-700">Parsed Certificate Details</span>
            {certData?.valid && (
              <button
                onClick={() => handleCopy(JSON.stringify(certData, null, 2), "json_dump")}
                className="flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/50 transition-colors"
              >
                {copiedKey === "json_dump" ? <Check className="w-3.5 h-3.5 text-neutral-900" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy JSON</span>
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto relative bg-white dark:bg-neutral-950">
            {!certData?.valid ? (
              input.trim().length === 0 ? (
                /* Empty State Skeleton (Grid) */
                <div className="select-none pointer-events-none pb-8">
                  <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider bg-neutral-50 dark:bg-neutral-900/50 px-3 py-1.5 border-y border-neutral-200 dark:border-neutral-800 first:border-t-0">
                    Subject & Issuer
                  </div>
                  <div className="grid grid-cols-[130px_1fr] gap-4 px-3 py-2 border-b border-neutral-100 dark:border-neutral-800/50">
                    <span className="text-neutral-500 font-medium whitespace-nowrap text-xs">Subject CN</span>
                    <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-1/2 mt-0.5"></div>
                  </div>
                  <div className="grid grid-cols-[130px_1fr] gap-4 px-3 py-2 border-b border-neutral-100 dark:border-neutral-800/50">
                    <span className="text-neutral-500 font-medium whitespace-nowrap text-xs">Issuer CN</span>
                    <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-1/3 mt-0.5"></div>
                  </div>
                  <div className="grid grid-cols-[130px_1fr] gap-4 px-3 py-2 border-b border-neutral-100 dark:border-neutral-800/50">
                    <span className="text-neutral-500 font-medium whitespace-nowrap text-xs">Serial Number</span>
                    <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-2/3 mt-0.5"></div>
                  </div>

                  <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider bg-neutral-50 dark:bg-neutral-900/50 px-3 py-1.5 border-y border-neutral-200 dark:border-neutral-800 mt-4">
                    Validity Period
                  </div>
                  <div className="grid grid-cols-[130px_1fr] gap-4 px-3 py-2 border-b border-neutral-100 dark:border-neutral-800/50">
                    <span className="text-neutral-500 font-medium whitespace-nowrap text-xs">Not Before</span>
                    <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-1/2 mt-0.5"></div>
                  </div>
                  <div className="grid grid-cols-[130px_1fr] gap-4 px-3 py-2 border-b border-neutral-100 dark:border-neutral-800/50">
                    <span className="text-neutral-500 font-medium whitespace-nowrap text-xs">Not After</span>
                    <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-1/2 mt-0.5"></div>
                  </div>
                </div>
              ) : (
                /* Error State Banner (Flattened) */
                <div className="p-4">
                  <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-md p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400" />
                      <span className="text-xs font-bold tracking-wider text-red-600 dark:text-red-400 uppercase">Parsing Error</span>
                    </div>
                    <div className="font-mono text-[13px] text-red-900 dark:text-red-200 mt-2 mb-3">
                      {certData?.error || "Invalid PEM certificate format."}
                    </div>
                    <div className="text-xs text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">Tip:</span> 
                      <span>Ensure headers like <code className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-700 px-1.5 py-0.5 rounded font-mono text-neutral-800 dark:text-neutral-200 mx-1">-----BEGIN CERTIFICATE-----</code> are intact.</span>
                    </div>
                  </div>
                </div>
              )
            ) : (
              /* Valid Certificate Data (High-Density Property Grid) */
              <div className="pb-8">
                {/* Type Badge */}
                <div className="px-3 py-3 border-b border-neutral-100 dark:border-neutral-800/50 flex items-center justify-between bg-white dark:bg-neutral-950">
                  <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    {certData.type === "certificate" ? "X.509 Certificate" : "Certificate Signing Request (CSR)"}
                  </span>
                </div>

                <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider bg-neutral-50 dark:bg-neutral-900/50 px-3 py-1.5 border-y border-neutral-200 dark:border-neutral-800">
                  Subject & Issuer
                </div>
                {certData.subject?.commonName && (
                  <div className="grid grid-cols-[130px_1fr] gap-4 px-3 py-2 border-b border-neutral-100 dark:border-neutral-800/50 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/20 text-xs transition-colors">
                    <span className="text-neutral-500 font-medium whitespace-nowrap">Subject CN</span>
                    <span className="font-mono text-neutral-900 dark:text-neutral-200 break-all">{certData.subject.commonName}</span>
                  </div>
                )}
                {certData.type === "certificate" && certData.issuer?.commonName && (
                  <div className="grid grid-cols-[130px_1fr] gap-4 px-3 py-2 border-b border-neutral-100 dark:border-neutral-800/50 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/20 text-xs transition-colors">
                    <span className="text-neutral-500 font-medium whitespace-nowrap">Issuer CN</span>
                    <span className="font-mono text-neutral-900 dark:text-neutral-200 break-all">{certData.issuer.commonName}</span>
                  </div>
                )}
                {certData.serialNumber && (
                  <div className="grid grid-cols-[130px_1fr] gap-4 px-3 py-2 border-b border-neutral-100 dark:border-neutral-800/50 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/20 text-xs transition-colors">
                    <span className="text-neutral-500 font-medium whitespace-nowrap">Serial Number</span>
                    <span className="font-mono text-neutral-900 dark:text-neutral-200 break-all">{certData.serialNumber}</span>
                  </div>
                )}
                {certData.signatureAlgorithm && (
                  <div className="grid grid-cols-[130px_1fr] gap-4 px-3 py-2 border-b border-neutral-100 dark:border-neutral-800/50 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/20 text-xs transition-colors">
                    <span className="text-neutral-500 font-medium whitespace-nowrap">Signature Algorithm</span>
                    <span className="font-mono text-neutral-900 dark:text-neutral-200 break-all">{certData.signatureAlgorithm}</span>
                  </div>
                )}

                {certData.type === "certificate" && certData.notBefore && certData.notAfter && (
                  <>
                    <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider bg-neutral-50 dark:bg-neutral-900/50 px-3 py-1.5 border-y border-neutral-200 dark:border-neutral-800 mt-4">
                      Validity Period
                    </div>
                    <div className="grid grid-cols-[130px_1fr] gap-4 px-3 py-2 border-b border-neutral-100 dark:border-neutral-800/50 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/20 text-xs transition-colors">
                      <span className="text-neutral-500 font-medium whitespace-nowrap">Not Before</span>
                      <span className="font-mono text-neutral-900 dark:text-neutral-200">{new Date(certData.notBefore).toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-[130px_1fr] gap-4 px-3 py-2 border-b border-neutral-100 dark:border-neutral-800/50 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/20 text-xs transition-colors">
                      <span className="text-neutral-500 font-medium whitespace-nowrap flex items-center h-full">Not After</span>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-neutral-900 dark:text-neutral-200">{new Date(certData.notAfter).toLocaleString()}</span>
                        {certData.isExpired ? (
                          <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50 rounded text-[9px] font-bold uppercase tracking-wider">Expired</span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/50 rounded text-[9px] font-bold uppercase tracking-wider">Valid</span>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {certData.sans && certData.sans.length > 0 && (
                  <>
                    <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider bg-neutral-50 dark:bg-neutral-900/50 px-3 py-1.5 border-y border-neutral-200 dark:border-neutral-800 mt-4">
                      Subject Alternative Names
                    </div>
                    <div className="grid grid-cols-[130px_1fr] gap-4 px-3 py-2 border-b border-neutral-100 dark:border-neutral-800/50 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/20 text-xs transition-colors">
                      <span className="text-neutral-500 font-medium whitespace-nowrap mt-0.5">SANs</span>
                      <div className="flex flex-wrap gap-1.5">
                        {certData.sans.map((san, i) => (
                          <span key={i} className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 px-2 py-0.5 rounded-md font-mono text-[11px]">
                            {san}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider bg-neutral-50 dark:bg-neutral-900/50 px-3 py-1.5 border-y border-neutral-200 dark:border-neutral-800 mt-4">
                  Public Key Info
                </div>
                <div className="grid grid-cols-[130px_1fr] gap-4 px-3 py-2 border-b border-neutral-100 dark:border-neutral-800/50 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/20 text-xs transition-colors">
                  <span className="text-neutral-500 font-medium whitespace-nowrap">Algorithm</span>
                  <span className="font-mono text-neutral-900 dark:text-neutral-200">{certData.publicKeyAlgorithm}</span>
                </div>
                <div className="grid grid-cols-[130px_1fr] gap-4 px-3 py-2 border-b border-neutral-100 dark:border-neutral-800/50 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/20 text-xs transition-colors">
                  <span className="text-neutral-500 font-medium whitespace-nowrap">Key Size</span>
                  <span className="font-mono text-neutral-900 dark:text-neutral-200">{certData.publicKeySize}</span>
                </div>

                {(certData.fingerprintSha256 || certData.fingerprintSha1) && (
                  <>
                    <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider bg-neutral-50 dark:bg-neutral-900/50 px-3 py-1.5 border-y border-neutral-200 dark:border-neutral-800 mt-4">
                      Fingerprints
                    </div>
                    {certData.fingerprintSha256 && (
                      <div className="group grid grid-cols-[130px_1fr] gap-4 px-3 py-2 border-b border-neutral-100 dark:border-neutral-800/50 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/20 text-xs transition-colors">
                        <span className="text-neutral-500 font-medium whitespace-nowrap mt-0.5">SHA-256</span>
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-mono text-neutral-900 dark:text-neutral-200 break-all">{certData.fingerprintSha256}</span>
                          <button
                            onClick={() => handleCopy(certData.fingerprintSha256!, "sha256")}
                            className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-all p-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 shrink-0"
                            title="Copy SHA-256"
                          >
                            {copiedKey === "sha256" ? <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    )}
                    {certData.fingerprintSha1 && (
                      <div className="group grid grid-cols-[130px_1fr] gap-4 px-3 py-2 border-b border-neutral-100 dark:border-neutral-800/50 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/20 text-xs transition-colors">
                        <span className="text-neutral-500 font-medium whitespace-nowrap mt-0.5">SHA-1</span>
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-mono text-neutral-900 dark:text-neutral-200 break-all">{certData.fingerprintSha1}</span>
                          <button
                            onClick={() => handleCopy(certData.fingerprintSha1!, "sha1")}
                            className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-all p-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 shrink-0"
                            title="Copy SHA-1"
                          >
                            {copiedKey === "sha1" ? <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {certData.keyUsages && certData.keyUsages.length > 0 && (
                  <>
                    <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider bg-neutral-50 dark:bg-neutral-900/50 px-3 py-1.5 border-y border-neutral-200 dark:border-neutral-800 mt-4">
                      Key Usages
                    </div>
                    <div className="grid grid-cols-[130px_1fr] gap-4 px-3 py-2 border-b border-neutral-100 dark:border-neutral-800/50 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/20 text-xs transition-colors">
                      <span className="text-neutral-500 font-medium whitespace-nowrap mt-0.5">Usages</span>
                      <div className="flex flex-wrap gap-1.5">
                        {certData.keyUsages.map((usage, i) => (
                          <span key={i} className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 px-2 py-0.5 rounded-md font-mono text-[11px]">
                            {usage}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}