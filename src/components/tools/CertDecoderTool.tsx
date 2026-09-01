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
  const [input, setInput] = useState<string>(SAMPLE_CERT);
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

          <div className="h-4 w-px bg-neutral-200 mx-1" />

          <div className="flex items-center p-0.5 rounded-md bg-neutral-100/50 border border-neutral-200">
            <button
              onClick={() => setInput(SAMPLE_CERT)}
              className="px-2.5 py-1 rounded text-[11px] font-medium text-neutral-500 hover:text-neutral-900 transition-colors whitespace-nowrap"
            >
              Sample Cert
            </button>
            <button
              onClick={() => setInput(SAMPLE_CSR)}
              className="px-2.5 py-1 rounded text-[11px] font-medium text-neutral-500 hover:text-neutral-900 transition-colors whitespace-nowrap"
            >
              Sample CSR
            </button>
          </div>
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

          <div className="flex-1 overflow-y-auto p-4 relative">
            {!certData?.valid ? (
              input.trim().length === 0 ? (
                /* Empty State Skeleton */
                <div className="space-y-4 opacity-40 select-none pointer-events-none">
                  <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                    <div className="text-xs font-semibold text-neutral-700 mb-3">General Information</div>
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <span className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">Subject CN</span>
                        <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">Issuer CN</span>
                        <div className="h-4 bg-neutral-200 rounded w-1/3"></div>
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">Serial Number</span>
                        <div className="h-4 bg-neutral-200 rounded w-2/3"></div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                    <div className="text-xs font-semibold text-neutral-700 mb-3">Validity Period</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">Not Before</span>
                        <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">Not After</span>
                        <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Error State Banner */
                <div className="bg-red-50 border-l-4 border-red-500 p-3 text-xs text-red-700 font-mono rounded-r-md mb-4 shadow-sm">
                  <div className="font-semibold mb-1 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Parsing Error
                  </div>
                  <div className="mb-2 leading-relaxed">{certData?.error || "Invalid PEM certificate format."}</div>
                  <div className="text-[11px] opacity-80 font-sans bg-red-100/50 p-1.5 rounded">
                    <strong>Tip:</strong> Ensure headers like <code>-----BEGIN CERTIFICATE-----</code> are intact with no truncated base64 lines.
                  </div>
                </div>
              )
            ) : (
              /* Valid Certificate Data */
              <div className="space-y-4">
                {/* Header Badge */}
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn(
                    "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                    certData.type === "certificate" 
                      ? "bg-blue-50 text-blue-700 border-blue-200" 
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  )}>
                    {certData.type === "certificate" ? "X.509 Certificate" : "Certificate Signing Request (CSR)"}
                  </span>
                </div>

                {/* General Details */}
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                  <div className="text-xs font-semibold text-neutral-700 mb-3 border-b border-neutral-100 pb-2">General</div>
                  <div className="grid grid-cols-1 gap-3">
                    {certData.subject?.commonName && (
                      <div>
                        <span className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-0.5">Subject CN</span>
                        <span className="font-mono text-sm text-neutral-900 break-all">{certData.subject.commonName}</span>
                      </div>
                    )}
                    {certData.type === "certificate" && certData.issuer?.commonName && (
                      <div>
                        <span className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-0.5">Issuer CN</span>
                        <span className="font-mono text-sm text-neutral-900 break-all">{certData.issuer.commonName}</span>
                      </div>
                    )}
                    {certData.serialNumber && (
                      <div>
                        <span className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-0.5">Serial Number</span>
                        <span className="font-mono text-sm text-neutral-900 break-all">{certData.serialNumber}</span>
                      </div>
                    )}
                    {certData.signatureAlgorithm && (
                      <div>
                        <span className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-0.5">Signature Algorithm</span>
                        <span className="font-mono text-sm text-neutral-900">{certData.signatureAlgorithm}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Validity */}
                {certData.type === "certificate" && certData.notBefore && certData.notAfter && (
                  <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                    <div className="flex items-center justify-between border-b border-neutral-100 pb-2 mb-3">
                      <span className="text-xs font-semibold text-neutral-700">Validity Period</span>
                      {certData.isExpired ? (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 border border-red-200 rounded text-[10px] font-bold uppercase tracking-wider">Expired</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 border border-green-200 rounded text-[10px] font-bold uppercase tracking-wider">Active</span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-0.5">Not Before</span>
                        <span className="font-mono text-sm text-neutral-900">{new Date(certData.notBefore).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-0.5">Not After</span>
                        <span className="font-mono text-sm text-neutral-900">{new Date(certData.notAfter).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* SANs */}
                {certData.sans && certData.sans.length > 0 && (
                  <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                    <div className="text-xs font-semibold text-neutral-700 mb-3 border-b border-neutral-100 pb-2">Subject Alternative Names</div>
                    <div className="flex flex-wrap gap-1.5">
                      {certData.sans.map((san, i) => (
                        <span key={i} className="px-2 py-1 rounded bg-white border border-neutral-200 text-neutral-700 font-mono text-xs">
                          {san}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Public Key Info */}
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                  <div className="text-xs font-semibold text-neutral-700 mb-3 border-b border-neutral-100 pb-2">Public Key Info</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-0.5">Algorithm</span>
                      <span className="font-mono text-sm text-neutral-900">{certData.publicKeyAlgorithm}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-0.5">Key Size</span>
                      <span className="font-mono text-sm text-neutral-900">{certData.publicKeySize}</span>
                    </div>
                  </div>
                </div>

                {/* Fingerprints */}
                {(certData.fingerprintSha256 || certData.fingerprintSha1) && (
                  <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                    <div className="text-xs font-semibold text-neutral-700 mb-3 border-b border-neutral-100 pb-2">Fingerprints</div>
                    <div className="space-y-3">
                      {certData.fingerprintSha256 && (
                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[10px] text-neutral-500 uppercase tracking-wider">SHA-256</span>
                            <button
                              onClick={() => handleCopy(certData.fingerprintSha256!, "sha256")}
                              className="text-neutral-400 hover:text-neutral-900 transition-colors"
                            >
                              {copiedKey === "sha256" ? <Check className="w-3.5 h-3.5 text-neutral-900" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <span className="font-mono text-sm text-neutral-900 break-all leading-tight block">{certData.fingerprintSha256}</span>
                        </div>
                      )}
                      {certData.fingerprintSha1 && (
                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[10px] text-neutral-500 uppercase tracking-wider">SHA-1</span>
                            <button
                              onClick={() => handleCopy(certData.fingerprintSha1!, "sha1")}
                              className="text-neutral-400 hover:text-neutral-900 transition-colors"
                            >
                              {copiedKey === "sha1" ? <Check className="w-3.5 h-3.5 text-neutral-900" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <span className="font-mono text-sm text-neutral-900 break-all leading-tight block">{certData.fingerprintSha1}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Key Usages / Extensions */}
                {certData.keyUsages && certData.keyUsages.length > 0 && (
                  <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                    <div className="text-xs font-semibold text-neutral-700 mb-3 border-b border-neutral-100 pb-2">Key Usages</div>
                    <div className="flex flex-wrap gap-1.5">
                      {certData.keyUsages.map((usage, i) => (
                        <span key={i} className="px-2 py-1 rounded bg-white border border-neutral-200 text-neutral-700 font-mono text-xs">
                          {usage}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}