import "reflect-metadata";
import {
  AuthorityInfoAccessExtension,
  AuthorityKeyIdentifierExtension,
  BasicConstraintsExtension,
  CertificatePolicyExtension,
  CRLDistributionPointsExtension,
  ExtendedKeyUsageExtension,
  KeyUsageFlags,
  KeyUsagesExtension,
  Pkcs10CertificateRequest,
  SubjectAlternativeNameExtension,
  SubjectKeyIdentifierExtension,
  X509Certificate,
  type Extension,
  type GeneralName,
  type Name,
  type PublicKey,
} from "@peculiar/x509";

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

/** One Subject Alternative Name entry, e.g. `{ type: "DNS", value: "example.com" }`. */
export interface SanEntry {
  type: string;
  value: string;
}

/** Position of a block inside a pasted bundle (fullchain.pem) or "csr" for requests. */
export type CertRole = "leaf" | "intermediate" | "root" | "csr";

export interface DecodedCertificate {
  type: "certificate" | "csr";
  valid: boolean;
  error?: string;
  role?: CertRole;
  subject?: NameAttributes;
  issuer?: NameAttributes;
  /** Uppercase hex, colon separated. */
  serialNumber?: string;
  notBefore?: string;
  notAfter?: string;
  isExpired?: boolean;
  /** Whole days until notAfter (0 once expired). */
  daysRemaining?: number;
  /** Whole days since notAfter, only set when expired. */
  daysSinceExpiry?: number;
  /** Whole days until notBefore, only set when not yet valid. */
  daysUntilValid?: number;
  /** notAfter - notBefore in whole days. */
  lifetimeDays?: number;
  validityStatus?: "valid" | "expired" | "not_yet_valid";
  /** Subject and issuer are the same name. */
  isSelfSigned?: boolean;
  /** e.g. "ECDSA with SHA-256". */
  signatureAlgorithm?: string;
  /** Signature checked against the issuer found in the same input (or the own key when self-signed / CSR). */
  signatureVerified?: boolean;
  /** Index (in the decoded bundle) of the certificate whose subject matches this issuer. */
  issuedByIndex?: number;
  publicKeyAlgorithm?: string;
  /** e.g. "2048 bits" or "256 bits". */
  publicKeySize?: string;
  /** Named curve for EC keys, e.g. "P-256". */
  publicKeyCurve?: string;
  /** RSA public exponent, e.g. 65537. */
  publicKeyExponent?: number;
  /** SAN values only (kept for consumers that want plain strings). */
  sans?: string[];
  sanEntries?: SanEntry[];
  keyUsages?: string[];
  extendedKeyUsages?: string[];
  isCA?: boolean;
  pathLength?: number;
  subjectKeyId?: string;
  authorityKeyId?: string;
  fingerprintSha256?: string;
  fingerprintSha1?: string;
  extensions?: CertExtensionInfo[];
  /** Weak algorithms or parsing problems worth flagging. */
  warnings?: string[];
  rawPem?: string;
}

export interface DecodedBundle {
  /** One entry per certificate / CSR block, in input order. Never empty. */
  items: DecodedCertificate[];
  /** Labels of PEM blocks that were ignored (private keys, CRLs, ...). */
  skipped: string[];
}

const DAY_MS = 86_400_000;

const EXTENSION_NAMES: Readonly<Record<string, string>> = {
  "2.5.29.14": "Subject Key Identifier",
  "2.5.29.35": "Authority Key Identifier",
  "2.5.29.17": "Subject Alternative Name",
  "2.5.29.18": "Issuer Alternative Name",
  "2.5.29.15": "Key Usage",
  "2.5.29.37": "Extended Key Usage",
  "2.5.29.19": "Basic Constraints",
  "2.5.29.30": "Name Constraints",
  "2.5.29.31": "CRL Distribution Points",
  "2.5.29.32": "Certificate Policies",
  "2.5.29.36": "Policy Constraints",
  "2.5.29.54": "Inhibit anyPolicy",
  "1.3.6.1.5.5.7.1.1": "Authority Information Access",
  "1.3.6.1.5.5.7.1.24": "TLS Feature",
  "1.3.6.1.4.1.11129.2.4.2": "CT Precertificate SCTs",
  "1.3.6.1.4.1.11129.2.4.3": "CT Precertificate Poison",
};

const EKU_NAMES: Readonly<Record<string, string>> = {
  "1.3.6.1.5.5.7.3.1": "Server Authentication",
  "1.3.6.1.5.5.7.3.2": "Client Authentication",
  "1.3.6.1.5.5.7.3.3": "Code Signing",
  "1.3.6.1.5.5.7.3.4": "Email Protection",
  "1.3.6.1.5.5.7.3.8": "Time Stamping",
  "1.3.6.1.5.5.7.3.9": "OCSP Signing",
  "2.5.29.37.0": "Any Extended Key Usage",
  "1.3.6.1.4.1.311.20.2.2": "Smart Card Logon",
};

const POLICY_NAMES: Readonly<Record<string, string>> = {
  "2.5.29.32.0": "Any policy",
  "2.23.140.1.1": "Extended Validation",
  "2.23.140.1.2.1": "Domain Validated",
  "2.23.140.1.2.2": "Organization Validated",
  "2.23.140.1.2.3": "Individual Validated",
};

const KEY_USAGE_NAMES: ReadonlyArray<readonly [KeyUsageFlags, string]> = [
  [KeyUsageFlags.digitalSignature, "Digital Signature"],
  [KeyUsageFlags.nonRepudiation, "Non Repudiation"],
  [KeyUsageFlags.keyEncipherment, "Key Encipherment"],
  [KeyUsageFlags.dataEncipherment, "Data Encipherment"],
  [KeyUsageFlags.keyAgreement, "Key Agreement"],
  [KeyUsageFlags.keyCertSign, "Certificate Sign"],
  [KeyUsageFlags.cRLSign, "CRL Sign"],
  [KeyUsageFlags.encipherOnly, "Encipher Only"],
  [KeyUsageFlags.decipherOnly, "Decipher Only"],
];

const SAN_TYPE_LABELS: Readonly<Record<string, string>> = {
  dns: "DNS",
  ip: "IP",
  email: "Email",
  url: "URI",
  dn: "DN",
  guid: "GUID",
  upn: "UPN",
  id: "Registered ID",
};

/** WebCrypto key algorithm names mapped to the names people expect. */
const KEY_ALGORITHM_NAMES: Readonly<Record<string, string>> = {
  "RSASSA-PKCS1-v1_5": "RSA",
  "RSA-OAEP": "RSA",
  "RSA-PSS": "RSA-PSS",
  ECDSA: "EC",
  ECDH: "EC",
};

const SIGNATURE_ALGORITHM_NAMES: Readonly<Record<string, string>> = {
  "RSASSA-PKCS1-v1_5": "RSA",
};

const CURVE_BITS: Readonly<Record<string, number>> = {
  "P-256": 256,
  "P-384": 384,
  "P-521": 521,
  "K-256": 256,
  Ed25519: 256,
  X25519: 256,
  Ed448: 456,
  X448: 448,
};

const CERT_LABELS = new Set(["CERTIFICATE", "X509 CERTIFICATE", "TRUSTED CERTIFICATE"]);
const CSR_LABELS = new Set(["CERTIFICATE REQUEST", "NEW CERTIFICATE REQUEST"]);
const PEM_BLOCK_RE = /-----BEGIN ([A-Z0-9 ]+)-----[\s\S]*?-----END \1-----/g;

function errorMessage(err: unknown): string {
  return err instanceof Error && err.message ? err.message : String(err || "unknown error");
}

/** "0e57ab" -> "0E:57:AB" */
function formatHexPairs(hex: string): string {
  return hex.match(/.{1,2}/g)?.join(":").toUpperCase() || hex;
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, "0")).join("");
}

async function computeFingerprint(rawBytes: ArrayBuffer, algorithm: string): Promise<string> {
  try {
    const hash = await crypto.subtle.digest(algorithm, rawBytes);
    return formatHexPairs(bufferToHex(hash));
  } catch {
    return "";
  }
}

function readName(name: Name, raw: string): NameAttributes {
  const field = (key: string): string | undefined => {
    try {
      const values = name.getField(key);
      return values.length > 0 ? values.join(", ") : undefined;
    } catch {
      return undefined;
    }
  };
  const attrs: NameAttributes = { rawString: raw };
  const entries: [keyof Omit<NameAttributes, "rawString">, string][] = [
    ["commonName", "CN"],
    ["organization", "O"],
    ["organizationalUnit", "OU"],
    ["locality", "L"],
    ["stateOrProvince", "ST"],
    ["country", "C"],
    ["emailAddress", "E"],
  ];
  for (const [key, short] of entries) {
    const value = field(short);
    if (value) attrs[key] = value;
  }
  return attrs;
}

function generalNameText(name: GeneralName): string {
  return `${SAN_TYPE_LABELS[name.type] ?? name.type}: ${name.value}`;
}

function describeSignature(read: () => Algorithm & { hash?: Algorithm }): string {
  try {
    const alg = read();
    const name = SIGNATURE_ALGORITHM_NAMES[alg.name] ?? alg.name;
    return alg.hash?.name ? `${name} with ${alg.hash.name}` : name;
  } catch {
    return "Unknown";
  }
}

interface PublicKeyInfo {
  algorithm: string;
  size?: string;
  curve?: string;
  exponent?: number;
  bits?: number;
}

function describePublicKey(read: () => PublicKey): PublicKeyInfo {
  let alg: Algorithm;
  try {
    alg = read().algorithm;
  } catch {
    return { algorithm: "Unknown" };
  }
  const info: PublicKeyInfo = { algorithm: KEY_ALGORITHM_NAMES[alg.name] ?? alg.name };
  if ("modulusLength" in alg && typeof alg.modulusLength === "number") {
    info.bits = alg.modulusLength;
  }
  if ("publicExponent" in alg && alg.publicExponent instanceof Uint8Array) {
    info.exponent = alg.publicExponent.reduce((acc, byte) => acc * 256 + byte, 0);
  }
  if ("namedCurve" in alg && typeof alg.namedCurve === "string") {
    info.curve = alg.namedCurve;
    info.bits = CURVE_BITS[alg.namedCurve];
  } else if (CURVE_BITS[alg.name]) {
    info.bits = CURVE_BITS[alg.name];
  }
  if (info.bits) info.size = `${info.bits} bits`;
  return info;
}

interface ExtensionFacts {
  sanEntries: SanEntry[];
  keyUsages: string[];
  extendedKeyUsages: string[];
  isCA?: boolean;
  pathLength?: number;
  subjectKeyId?: string;
  authorityKeyId?: string;
  extensions: CertExtensionInfo[];
  error?: string;
}

/** Turns typed @peculiar/x509 extensions into display rows plus the facts the UI highlights. */
function readExtensions(read: () => Extension[]): ExtensionFacts {
  const facts: ExtensionFacts = { sanEntries: [], keyUsages: [], extendedKeyUsages: [], extensions: [] };
  let list: Extension[];
  try {
    list = read();
  } catch (err) {
    facts.error = `Extensions could not be parsed: ${errorMessage(err)}`;
    return facts;
  }

  for (const ext of list) {
    let value: string;
    if (ext instanceof SubjectAlternativeNameExtension) {
      const entries = ext.names.items.map((n) => ({ type: SAN_TYPE_LABELS[n.type] ?? n.type, value: n.value }));
      facts.sanEntries.push(...entries);
      value = entries.map((e) => `${e.type}: ${e.value}`).join(", ");
    } else if (ext instanceof KeyUsagesExtension) {
      const usages = KEY_USAGE_NAMES.filter(([flag]) => (ext.usages & flag) === flag).map(([, label]) => label);
      facts.keyUsages.push(...usages);
      value = usages.join(", ") || "None";
    } else if (ext instanceof ExtendedKeyUsageExtension) {
      const usages = ext.usages
        .flatMap((u) => (typeof u === "string" ? [u] : Array.from(u)))
        .map((oid) => EKU_NAMES[oid] ?? oid);
      facts.extendedKeyUsages.push(...usages);
      value = usages.join(", ");
    } else if (ext instanceof BasicConstraintsExtension) {
      facts.isCA = ext.ca;
      facts.pathLength = ext.pathLength;
      value = ext.ca
        ? `CA: true${typeof ext.pathLength === "number" ? `, path length ${ext.pathLength}` : ""}`
        : "CA: false";
    } else if (ext instanceof SubjectKeyIdentifierExtension) {
      facts.subjectKeyId = formatHexPairs(ext.keyId);
      value = facts.subjectKeyId;
    } else if (ext instanceof AuthorityKeyIdentifierExtension) {
      if (ext.keyId) facts.authorityKeyId = formatHexPairs(ext.keyId);
      value = facts.authorityKeyId ?? (ext.certId ? `Issuer serial ${formatHexPairs(ext.certId.serialNumber)}` : "Present");
    } else if (ext instanceof CRLDistributionPointsExtension) {
      const urls = ext.distributionPoints
        .flatMap((dp) => dp.distributionPoint?.fullName ?? [])
        .map((n) => n.uniformResourceIdentifier)
        .filter((url): url is string => Boolean(url));
      value = urls.join(", ") || "Present";
    } else if (ext instanceof AuthorityInfoAccessExtension) {
      const parts = [
        ...ext.ocsp.map((n) => `OCSP: ${n.value}`),
        ...ext.caIssuers.map((n) => `CA Issuers: ${n.value}`),
      ];
      value = parts.join(", ") || ext.caRepository.map(generalNameText).join(", ") || "Present";
    } else if (ext instanceof CertificatePolicyExtension) {
      value = ext.policies.map((oid) => (POLICY_NAMES[oid] ? `${POLICY_NAMES[oid]} (${oid})` : oid)).join(", ");
    } else if (ext.type === "1.3.6.1.4.1.11129.2.4.2") {
      value = "Embedded signed certificate timestamps";
    } else {
      value = `${ext.value.byteLength}-byte value`;
    }
    facts.extensions.push({
      name: EXTENSION_NAMES[ext.type] ?? ext.type,
      oid: ext.type,
      critical: ext.critical,
      value,
    });
  }
  return facts;
}

function failure(type: DecodedCertificate["type"], error: string): DecodedCertificate {
  return { type, valid: false, error };
}

function weakAlgorithmWarnings(signatureAlgorithm: string, key: PublicKeyInfo): string[] {
  const warnings: string[] = [];
  if (/\b(SHA-1|MD5)\b/.test(signatureAlgorithm)) {
    warnings.push(`Signed with ${signatureAlgorithm}; modern clients reject this hash.`);
  }
  if (key.algorithm.startsWith("RSA") && key.bits !== undefined && key.bits < 2048) {
    warnings.push(`RSA key is only ${key.bits} bits; use 2048 bits or more.`);
  }
  return warnings;
}

type Parsed =
  | { kind: "certificate"; cert: X509Certificate; pem: string }
  | { kind: "csr"; csr: Pkcs10CertificateRequest; pem: string }
  | { kind: "error"; result: DecodedCertificate };

function parseCertificate(pem: string): Parsed {
  try {
    return { kind: "certificate", cert: new X509Certificate(pem), pem };
  } catch (err) {
    return { kind: "error", result: failure("certificate", `Failed to decode X.509 certificate: ${errorMessage(err)}`) };
  }
}

function parseCsr(pem: string): Parsed {
  try {
    return { kind: "csr", csr: new Pkcs10CertificateRequest(pem), pem };
  } catch (err) {
    return { kind: "error", result: failure("csr", `Failed to parse CSR: ${errorMessage(err)}`) };
  }
}

/** Input without PEM armour: try base64 / hex DER as a certificate, then as a CSR. */
function parseBare(text: string): Parsed {
  try {
    const cert = new X509Certificate(text);
    return { kind: "certificate", cert, pem: cert.toString("pem") };
  } catch {
    try {
      const csr = new Pkcs10CertificateRequest(text);
      return { kind: "csr", csr, pem: csr.toString("pem") };
    } catch {
      return {
        kind: "error",
        result: failure(
          "certificate",
          "No PEM block found. Paste text that starts with -----BEGIN CERTIFICATE----- or -----BEGIN CERTIFICATE REQUEST-----."
        ),
      };
    }
  }
}

async function describeCertificate(cert: X509Certificate, pem: string, now: Date): Promise<DecodedCertificate> {
  const subject = readName(cert.subjectName, cert.subject);
  const issuer = readName(cert.issuerName, cert.issuer);
  const notBefore = cert.notBefore;
  const notAfter = cert.notAfter;

  let validityStatus: NonNullable<DecodedCertificate["validityStatus"]> = "valid";
  let daysRemaining = 0;
  let daysSinceExpiry: number | undefined;
  let daysUntilValid: number | undefined;
  if (now < notBefore) {
    validityStatus = "not_yet_valid";
    daysUntilValid = Math.ceil((notBefore.getTime() - now.getTime()) / DAY_MS);
  } else if (now > notAfter) {
    validityStatus = "expired";
    daysSinceExpiry = Math.floor((now.getTime() - notAfter.getTime()) / DAY_MS);
  } else {
    daysRemaining = Math.max(0, Math.floor((notAfter.getTime() - now.getTime()) / DAY_MS));
  }

  const [sha256, sha1] = await Promise.all([
    computeFingerprint(cert.rawData, "SHA-256"),
    computeFingerprint(cert.rawData, "SHA-1"),
  ]);
  const facts = readExtensions(() => cert.extensions);
  const key = describePublicKey(() => cert.publicKey);
  const signatureAlgorithm = describeSignature(() => cert.signatureAlgorithm);
  const warnings = weakAlgorithmWarnings(signatureAlgorithm, key);
  if (facts.error) warnings.push(facts.error);

  return {
    type: "certificate",
    valid: true,
    subject,
    issuer,
    serialNumber: cert.serialNumber ? formatHexPairs(cert.serialNumber) : "N/A",
    notBefore: notBefore.toISOString(),
    notAfter: notAfter.toISOString(),
    isExpired: validityStatus === "expired",
    daysRemaining,
    daysSinceExpiry,
    daysUntilValid,
    lifetimeDays: Math.round((notAfter.getTime() - notBefore.getTime()) / DAY_MS),
    validityStatus,
    isSelfSigned: cert.subject === cert.issuer,
    signatureAlgorithm,
    publicKeyAlgorithm: key.algorithm,
    publicKeySize: key.size,
    publicKeyCurve: key.curve,
    publicKeyExponent: key.exponent,
    sans: facts.sanEntries.map((e) => e.value),
    sanEntries: facts.sanEntries,
    keyUsages: facts.keyUsages,
    extendedKeyUsages: facts.extendedKeyUsages,
    isCA: facts.isCA,
    pathLength: facts.pathLength,
    subjectKeyId: facts.subjectKeyId,
    authorityKeyId: facts.authorityKeyId,
    fingerprintSha256: sha256,
    fingerprintSha1: sha1,
    extensions: facts.extensions,
    warnings,
    rawPem: pem,
  };
}

async function describeCsr(csr: Pkcs10CertificateRequest, pem: string): Promise<DecodedCertificate> {
  const [sha256, sha1, signatureVerified] = await Promise.all([
    computeFingerprint(csr.rawData, "SHA-256"),
    computeFingerprint(csr.rawData, "SHA-1"),
    csr.verify().catch(() => undefined),
  ]);
  // Requested extensions live in the PKCS#9 extensionRequest attribute.
  const facts = readExtensions(() => csr.extensions);
  const key = describePublicKey(() => csr.publicKey);
  const signatureAlgorithm = describeSignature(() => csr.signatureAlgorithm);
  const warnings = weakAlgorithmWarnings(signatureAlgorithm, key);
  if (facts.error) warnings.push(facts.error);

  return {
    type: "csr",
    valid: true,
    role: "csr",
    subject: readName(csr.subjectName, csr.subject),
    signatureAlgorithm,
    signatureVerified,
    publicKeyAlgorithm: key.algorithm,
    publicKeySize: key.size,
    publicKeyCurve: key.curve,
    publicKeyExponent: key.exponent,
    sans: facts.sanEntries.map((e) => e.value),
    sanEntries: facts.sanEntries,
    keyUsages: facts.keyUsages,
    extendedKeyUsages: facts.extendedKeyUsages,
    isCA: facts.isCA,
    pathLength: facts.pathLength,
    subjectKeyId: facts.subjectKeyId,
    fingerprintSha256: sha256,
    fingerprintSha1: sha1,
    extensions: facts.extensions,
    warnings,
    rawPem: pem,
  };
}

function certificateRole(item: DecodedCertificate): CertRole {
  const isAuthority = item.isCA === true || (item.isCA === undefined && item.isSelfSigned === true);
  if (!isAuthority) return "leaf";
  return item.isSelfSigned ? "root" : "intermediate";
}

/**
 * Links certificates inside one bundle: role (leaf / intermediate / root), which block issued
 * which, and whether the signature checks out against that issuer's public key.
 */
async function linkChain(parsed: Parsed[], items: DecodedCertificate[]): Promise<void> {
  await Promise.all(
    items.map(async (item, index) => {
      const source = parsed[index];
      if (!item.valid || item.type !== "certificate" || source.kind !== "certificate") return;
      item.role = certificateRole(item);
      if (item.isSelfSigned) {
        item.signatureVerified = await source.cert.verify({ signatureOnly: true }).catch(() => undefined);
        return;
      }
      const issuerIndex = items.findIndex(
        (other, j) =>
          j !== index && other.valid && other.type === "certificate" && other.subject?.rawString === item.issuer?.rawString
      );
      const issuer = parsed[issuerIndex];
      if (issuerIndex === -1 || issuer?.kind !== "certificate") return;
      item.issuedByIndex = issuerIndex;
      item.signatureVerified = await source.cert
        .verify({ publicKey: issuer.cert.publicKey, signatureOnly: true })
        .catch(() => undefined);
    })
  );
}

/**
 * Decodes every certificate / CSR block in the input (a single PEM, a fullchain bundle, or bare
 * base64 DER). Runs entirely in the browser; nothing leaves the page.
 */
export async function decodePemBundle(input: string, now: Date = new Date()): Promise<DecodedBundle> {
  const trimmed = input.trim();
  if (!trimmed) {
    return { items: [failure("certificate", "Please enter or upload a PEM certificate or CSR.")], skipped: [] };
  }

  const parsed: Parsed[] = [];
  const skipped: string[] = [];
  const blocks = Array.from(trimmed.matchAll(PEM_BLOCK_RE), (m) => ({ label: m[1], text: m[0] }));

  if (blocks.length === 0) {
    const begin = /-----BEGIN ([A-Z0-9 ]+)-----/.exec(trimmed);
    if (begin) {
      return {
        items: [failure("certificate", `Incomplete PEM block: the -----END ${begin[1]}----- line is missing.`)],
        skipped: [],
      };
    }
    parsed.push(parseBare(trimmed));
  } else {
    for (const block of blocks) {
      if (CERT_LABELS.has(block.label)) parsed.push(parseCertificate(block.text));
      else if (CSR_LABELS.has(block.label)) parsed.push(parseCsr(block.text));
      else skipped.push(block.label);
    }
    if (parsed.length === 0) {
      const label = skipped[0];
      const hint = label.includes("PRIVATE KEY") ? " Private keys are not needed to inspect a certificate." : "";
      return {
        items: [
          failure(
            "certificate",
            `The input contains a "${label}" block, not a certificate or CSR. Paste a BEGIN CERTIFICATE or BEGIN CERTIFICATE REQUEST block.${hint}`
          ),
        ],
        skipped,
      };
    }
  }

  const items = await Promise.all(
    parsed.map((p) => {
      if (p.kind === "certificate") return describeCertificate(p.cert, p.pem, now);
      if (p.kind === "csr") return describeCsr(p.csr, p.pem);
      return Promise.resolve(p.result);
    })
  );
  await linkChain(parsed, items);
  return { items, skipped };
}

/** Decodes the first certificate / CSR in the input. Prefer `decodePemBundle` for chains. */
export async function decodeCertificateOrCsr(input: string): Promise<DecodedCertificate> {
  const { items } = await decodePemBundle(input);
  return items[0];
}
