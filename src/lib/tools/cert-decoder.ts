import "reflect-metadata";
import { X509Certificate, Pkcs10CertificateRequest } from "@peculiar/x509";

export interface NameAttributes {
  commonName?: string;
  organization?: string;
  organizationalUnit?: string;
  country?: string;
  stateOrProvince?: string;
  locality?: string;
  emailAddress?: string;
  rawString: string;
}

export interface CertExtensionInfo {
  name: string;
  oid: string;
  critical: boolean;
  value: string;
}

export interface DecodedCertificate {
  type: "certificate" | "csr";
  valid: boolean;
  error?: string;
  subject?: NameAttributes;
  issuer?: NameAttributes;
  serialNumber?: string;
  notBefore?: string;
  notAfter?: string;
  isExpired?: boolean;
  daysRemaining?: number;
  validityStatus?: "valid" | "expired" | "not_yet_valid";
  signatureAlgorithm?: string;
  publicKeyAlgorithm?: string;
  publicKeySize?: number | string;
  sans?: string[];
  keyUsages?: string[];
  extendedKeyUsages?: string[];
  isCA?: boolean;
  fingerprintSha256?: string;
  fingerprintSha1?: string;
  extensions?: CertExtensionInfo[];
  rawPem?: string;
}

function parseNameString(raw: string): NameAttributes {
  const attrs: NameAttributes = { rawString: raw };
  if (!raw) return attrs;

  // Split on comma or slash, taking care of escaped characters
  const parts = raw.split(/,\s*|\/\s*/);
  for (const part of parts) {
    const eqIdx = part.indexOf("=");
    if (eqIdx !== -1) {
      const key = part.slice(0, eqIdx).trim().toUpperCase();
      const val = part.slice(eqIdx + 1).trim();
      if (key === "CN" || key === "COMMONNAME") attrs.commonName = val;
      else if (key === "O" || key === "ORGANIZATION") attrs.organization = val;
      else if (key === "OU" || key === "ORGANIZATIONALUNIT") attrs.organizationalUnit = val;
      else if (key === "C" || key === "COUNTRY") attrs.country = val;
      else if (key === "ST" || key === "STATE" || key === "STATEORPROVINCE") attrs.stateOrProvince = val;
      else if (key === "L" || key === "LOCALITY") attrs.locality = val;
      else if (key === "E" || key === "EMAIL" || key === "EMAILADDRESS") attrs.emailAddress = val;
    }
  }
  return attrs;
}

function formatHexFingerprint(hex: string): string {
  return hex.match(/.{1,2}/g)?.join(":").toUpperCase() || hex;
}

async function computeFingerprint(rawBytes: ArrayBuffer, algorithm: string): Promise<string> {
  try {
    const hash = await crypto.subtle.digest(algorithm, rawBytes);
    const hex = Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return formatHexFingerprint(hex);
  } catch {
    return "";
  }
}

export async function decodeCertificateOrCsr(input: string): Promise<DecodedCertificate> {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      type: "certificate",
      valid: false,
      error: "Please enter or upload a PEM certificate or CSR.",
    };
  }

  // Detect CSR (PKCS#10) vs Certificate
  const isCsr =
    trimmed.includes("-----BEGIN CERTIFICATE REQUEST-----") ||
    trimmed.includes("-----BEGIN NEW CERTIFICATE REQUEST-----");

  if (isCsr) {
    try {
      const csr = new Pkcs10CertificateRequest(trimmed);
      const subject = parseNameString(csr.subject);
      const sha256 = await computeFingerprint(csr.rawData, "SHA-256");
      const sha1 = await computeFingerprint(csr.rawData, "SHA-1");

      const extensions: CertExtensionInfo[] = [];
      const sans: string[] = [];

      csr.extensions.forEach((ext: any) => {
        const extOid = ext.type || ext.oid || "";
        extensions.push({
          name: ext.name || extOid,
          oid: extOid,
          critical: Boolean(ext.critical),
          value: ext.name || extOid,
        });
      });

      return {
        type: "csr",
        valid: true,
        subject,
        signatureAlgorithm: csr.signatureAlgorithm?.name || "Unknown",
        publicKeyAlgorithm: csr.publicKey.algorithm?.name || "Unknown",
        fingerprintSha256: sha256,
        fingerprintSha1: sha1,
        sans,
        extensions,
        rawPem: trimmed,
      };
    } catch (err: any) {
      return {
        type: "csr",
        valid: false,
        error: `Failed to parse CSR: ${err?.message || "Invalid certificate request format"}`,
      };
    }
  }

  // Parse standard X.509 Certificate
  try {
    const cert = new X509Certificate(trimmed);
    const subject = parseNameString(cert.subject);
    const issuer = parseNameString(cert.issuer);

    const now = new Date();
    const notBefore = cert.notBefore;
    const notAfter = cert.notAfter;

    let validityStatus: "valid" | "expired" | "not_yet_valid" = "valid";
    let isExpired = false;
    let daysRemaining = 0;

    if (now < notBefore) {
      validityStatus = "not_yet_valid";
    } else if (now > notAfter) {
      validityStatus = "expired";
      isExpired = true;
    } else {
      validityStatus = "valid";
      daysRemaining = Math.max(0, Math.floor((notAfter.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    }

    const sha256 = await computeFingerprint(cert.rawData, "SHA-256");
    const sha1 = await computeFingerprint(cert.rawData, "SHA-1");

    // Extract SANs
    const sans: string[] = [];
    const keyUsages: string[] = [];
    const extendedKeyUsages: string[] = [];
    let isCA: boolean | undefined = undefined;

    const extensions: CertExtensionInfo[] = [];

    cert.extensions.forEach((ext: any) => {
      const extOid = ext.type || ext.oid || "";
      const extName = ext.name || extOid;
      extensions.push({
        name: extName,
        oid: extOid,
        critical: Boolean(ext.critical),
        value: typeof ext.value === "string" ? ext.value : extName,
      });

      // Subject Alternative Name extension
      if (extOid === "2.5.29.17" || extOid === "subjectAltName" || ext.type === "subjectAltName") {
        if (ext.names && Array.isArray(ext.names)) {
          ext.names.forEach((item: any) => {
            if (typeof item === "string") sans.push(item);
            else if (item?.value) sans.push(item.value);
          });
        }
      }

      // Basic Constraints
      if (extOid === "2.5.29.19" || extOid === "basicConstraints" || ext.type === "basicConstraints") {
        if (typeof ext.cA === "boolean") {
          isCA = ext.cA;
        }
      }

      // Key Usage
      if (extOid === "2.5.29.15" || extOid === "keyUsage" || ext.type === "keyUsage") {
        if (ext.usages && Array.isArray(ext.usages)) {
          keyUsages.push(...ext.usages);
        }
      }

      // Extended Key Usage
      if (extOid === "2.5.29.37" || extOid === "extendedKeyUsage" || ext.type === "extendedKeyUsage") {
        if (ext.usages && Array.isArray(ext.usages)) {
          extendedKeyUsages.push(...ext.usages);
        }
      }
    });

    // Public key details
    let keySize: number | string = "Unknown";
    const pubKeyAlgo = cert.publicKey.algorithm?.name || "Unknown";
    if ((cert.publicKey.algorithm as any)?.modulusLength) {
      keySize = `${(cert.publicKey.algorithm as any).modulusLength} bits`;
    } else if ((cert.publicKey.algorithm as any)?.namedCurve) {
      keySize = (cert.publicKey.algorithm as any).namedCurve;
    }

    return {
      type: "certificate",
      valid: true,
      subject,
      issuer,
      serialNumber: cert.serialNumber || "N/A",
      notBefore: notBefore.toISOString(),
      notAfter: notAfter.toISOString(),
      isExpired,
      daysRemaining,
      validityStatus,
      signatureAlgorithm: cert.signatureAlgorithm?.name || "Unknown",
      publicKeyAlgorithm: pubKeyAlgo,
      publicKeySize: keySize,
      sans,
      keyUsages,
      extendedKeyUsages,
      isCA,
      fingerprintSha256: sha256,
      fingerprintSha1: sha1,
      extensions,
      rawPem: trimmed,
    };
  } catch (err: any) {
    return {
      type: "certificate",
      valid: false,
      error: `Failed to decode X.509 certificate: ${err?.message || "Invalid certificate format or PEM header"}`,
    };
  }
}
