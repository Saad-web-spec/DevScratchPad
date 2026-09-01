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
      {/* Top Bar */}
      <div className="h-12 border-b border-zinc-200 px-4 flex items-center justify-between gap-2 shrink-0 bg-white">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Certificate (.crt, .pem, .csr)</span>
            <input
              type="file"
              accept=".pem,.crt,.cer,.csr,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={() => setInput(SAMPLE_CERT)}
            className="px-2.5 py-1 rounded-md text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
          >
            Sample Certificate
          </button>
          <button
            onClick={() => setInput(SAMPLE_CSR)}
            className="px-2.5 py-1 rounded-md text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
          >
            Sample CSR
          </button>
        </div>

        <div className="flex items-center gap-2">
          <ShareButton toolSlug="cert-decoder" data={input} />
          <EmbedButton toolSlug="cert-decoder" data={input} />
          <ExportImageButton code={input} language="text" />
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-zinc-200 overflow-hidden" id="cert-export-card">
        {/* Left: PEM / Raw Input Pane */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          <div className="h-10 px-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50 shrink-0">
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-700">
              <Lock className="w-4 h-4 text-zinc-500" />
              <span>PEM Certificate or CSR Payload</span>
            </div>
            <button
              onClick={() => setInput("")}
              className="p-1 rounded text-zinc-600 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Clear input"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your -----BEGIN CERTIFICATE----- or -----BEGIN CERTIFICATE REQUEST----- here..."
              className="w-full h-full min-h-[220px] font-mono text-xs text-zinc-900 bg-transparent resize-none border-0 outline-none focus:ring-0 leading-relaxed placeholder:text-zinc-600"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Right: Structured Certificate Inspector */}
        <div className="flex-1 flex flex-col min-w-0 bg-zinc-50/50">
          <div className="h-10 px-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50 shrink-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-800">
              <FileCheck className="w-4 h-4 text-blue-600" />
              <span>Decoded X.509 Certificate Details</span>
            </div>
            {certData?.fingerprintSha256 && (
              <button
                onClick={() => handleCopy(certData.fingerprintSha256!, "sha256")}
                className="flex items-center gap-1 text-[11px] font-mono text-zinc-500 hover:text-zinc-900"
              >
                {copiedKey === "sha256" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>Copy SHA-256</span>
              </button>
            )}
          </div>

          <div className="flex-1 p-4 overflow-y-auto min-h-0 space-y-4">
            {certData?.valid ? (
              <>
                {/* Validity / Status Banner */}
                {certData.type === "certificate" ? (
                  <div
                    className={cn(
                      "p-4 rounded-xl border flex items-center justify-between gap-3 shadow-xs",
                      certData.validityStatus === "valid"
                        ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                        : "bg-red-50/70 border-red-200 text-red-950"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {certData.validityStatus === "valid" ? (
                        <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                      ) : (
                        <ShieldAlert className="w-6 h-6 text-red-600 shrink-0" />
                      )}
                      <div>
                        <div className="font-semibold text-sm">
                          {certData.validityStatus === "valid"
                            ? `Valid Certificate — Expires in ${certData.daysRemaining} days`
                            : "Expired Certificate"}
                        </div>
                        <div className="text-xs text-zinc-600 flex items-center gap-2 mt-0.5 font-mono">
                          <span>Valid from {certData.notBefore?.slice(0, 10)}</span>
                          <span>&bull;</span>
                          <span>Until {certData.notAfter?.slice(0, 10)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/70 text-blue-950 flex items-center gap-3 shadow-xs">
                    <FileCheck className="w-6 h-6 text-blue-600 shrink-0" />
                    <div>
                      <div className="font-semibold text-sm">Certificate Signing Request (PKCS#10 CSR)</div>
                      <div className="text-xs text-blue-700 mt-0.5">
                        Ready for submission to a Certificate Authority (CA)
                      </div>
                    </div>
                  </div>
                )}

                {/* Subject Details */}
                <div className="p-4 rounded-xl border border-zinc-200 bg-white shadow-xs">
                  <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-zinc-900">
                    <Award className="w-4 h-4 text-blue-600" />
                    <span>Subject Details</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-100">
                      <span className="text-zinc-600 block text-[11px] font-medium mb-0.5">Common Name (CN)</span>
                      <span className="font-mono font-semibold text-zinc-900 break-all">
                        {certData.subject?.commonName || "N/A"}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-100">
                      <span className="text-zinc-600 block text-[11px] font-medium mb-0.5">Organization (O)</span>
                      <span className="font-mono text-zinc-800">{certData.subject?.organization || "N/A"}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-100">
                      <span className="text-zinc-600 block text-[11px] font-medium mb-0.5">Country (C)</span>
                      <span className="font-mono text-zinc-800">{certData.subject?.country || "N/A"}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-100">
                      <span className="text-zinc-600 block text-[11px] font-medium mb-0.5">State / Province (ST)</span>
                      <span className="font-mono text-zinc-800">{certData.subject?.stateOrProvince || "N/A"}</span>
                    </div>
                  </div>
                </div>

                {/* Issuer Details (if certificate) */}
                {certData.type === "certificate" && certData.issuer && (
                  <div className="p-4 rounded-xl border border-zinc-200 bg-white shadow-xs">
                    <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-zinc-900">
                      <Globe className="w-4 h-4 text-emerald-600" />
                      <span>Issuer (Certificate Authority)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-100">
                        <span className="text-zinc-600 block text-[11px] font-medium mb-0.5">Issuer CN</span>
                        <span className="font-mono font-semibold text-zinc-900 break-all">
                          {certData.issuer.commonName || "N/A"}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-100">
                        <span className="text-zinc-600 block text-[11px] font-medium mb-0.5">Issuer Organization</span>
                        <span className="font-mono text-zinc-800">{certData.issuer.organization || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Subject Alternative Names (SANs) */}
                {certData.sans && certData.sans.length > 0 && (
                  <div className="p-4 rounded-xl border border-zinc-200 bg-white shadow-xs">
                    <div className="flex items-center gap-2 mb-2.5 text-xs font-semibold text-zinc-900">
                      <Globe className="w-4 h-4 text-purple-600" />
                      <span>Subject Alternative Names (SANs)</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {certData.sans.map((san, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-md bg-purple-50 border border-purple-200 text-purple-800 font-mono text-xs"
                        >
                          {san}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cryptographic Properties */}
                <div className="p-4 rounded-xl border border-zinc-200 bg-white shadow-xs">
                  <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-zinc-900">
                    <Lock className="w-4 h-4 text-amber-600" />
                    <span>Cryptographic Properties</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                    <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-100">
                      <span className="text-zinc-600 block text-[11px] font-sans font-medium mb-0.5">Public Key Algorithm</span>
                      <span className="font-semibold text-zinc-900">{certData.publicKeyAlgorithm}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-100">
                      <span className="text-zinc-600 block text-[11px] font-sans font-medium mb-0.5">Key Size</span>
                      <span className="font-semibold text-zinc-900">{certData.publicKeySize}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-100">
                      <span className="text-zinc-600 block text-[11px] font-sans font-medium mb-0.5">Signature Algorithm</span>
                      <span className="font-semibold text-zinc-900">{certData.signatureAlgorithm}</span>
                    </div>
                  </div>

                  {/* Fingerprints */}
                  <div className="mt-3 space-y-2">
                    {certData.fingerprintSha256 && (
                      <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-between text-xs">
                        <div className="min-w-0 mr-2">
                          <span className="text-[11px] font-sans font-medium text-zinc-600 block">SHA-256 Fingerprint</span>
                          <span className="font-mono text-zinc-800 break-all text-[11px]">{certData.fingerprintSha256}</span>
                        </div>
                        <button
                          onClick={() => handleCopy(certData.fingerprintSha256!, "sha256_fp")}
                          className="p-1 rounded text-zinc-500 hover:text-zinc-900"
                        >
                          {copiedKey === "sha256_fp" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}
                    {certData.fingerprintSha1 && (
                      <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-between text-xs">
                        <div className="min-w-0 mr-2">
                          <span className="text-[11px] font-sans font-medium text-zinc-600 block">SHA-1 Fingerprint</span>
                          <span className="font-mono text-zinc-800 break-all text-[11px]">{certData.fingerprintSha1}</span>
                        </div>
                        <button
                          onClick={() => handleCopy(certData.fingerprintSha1!, "sha1_fp")}
                          className="p-1 rounded text-zinc-500 hover:text-zinc-900"
                        >
                          {copiedKey === "sha1_fp" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Key Usages / Extensions */}
                {certData.keyUsages && certData.keyUsages.length > 0 && (
                  <div className="p-4 rounded-xl border border-zinc-200 bg-white shadow-xs">
                    <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-zinc-900">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      <span>Key Usages</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {certData.keyUsages.map((usage, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-medium"
                        >
                          {usage}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-8 text-center text-zinc-600 flex flex-col items-center justify-center h-full">
                <ShieldAlert className="w-10 h-10 text-red-500 mb-2" />
                <span className="font-semibold text-zinc-800 text-sm">
                  {certData?.error || "Invalid PEM certificate format"}
                </span>
                <span className="text-xs text-zinc-600 mt-1 max-w-sm">
                  Ensure your input contains valid -----BEGIN CERTIFICATE----- or -----BEGIN CERTIFICATE REQUEST----- headers.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
