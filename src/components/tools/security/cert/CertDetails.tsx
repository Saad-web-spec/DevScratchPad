"use client";

import type { ReactNode } from "react";
import { Check, Copy, TriangleAlert } from "lucide-react";
import type { DecodedCertificate, NameAttributes } from "@/lib/tools/cert-decoder";
import { cn } from "@/lib/utils";
import { btnIcon, captionText, iconProps } from "@/components/tools/ToolChrome";

type Tone = "ok" | "warn" | "bad" | "neutral";

const TONE_PILL: Record<Tone, string> = {
  ok: "bg-zinc-100 text-zinc-700",
  warn: "bg-amber-50 text-amber-800",
  bad: "bg-red-50 text-red-700",
  neutral: "bg-zinc-100 text-zinc-600",
};

const TONE_DOT: Record<Tone, string> = {
  ok: "bg-zinc-900",
  warn: "bg-amber-500",
  bad: "bg-red-500",
  neutral: "bg-zinc-400",
};

const TONE_TEXT: Record<Tone, string> = {
  ok: "text-zinc-700",
  warn: "text-amber-700",
  bad: "text-red-700",
  neutral: "text-zinc-900",
};

export const ROLE_LABELS: Record<NonNullable<DecodedCertificate["role"]>, string> = {
  leaf: "Leaf",
  intermediate: "Intermediate",
  root: "Root",
  csr: "CSR",
};

const NAME_ROWS: [keyof Omit<NameAttributes, "rawString">, string][] = [
  ["commonName", "Common name"],
  ["organization", "Organization"],
  ["organizationalUnit", "Org. unit"],
  ["locality", "Locality"],
  ["stateOrProvince", "State"],
  ["country", "Country"],
  ["emailAddress", "Email"],
];

function plural(n: number, word: string): string {
  return `${n.toLocaleString("en-US")} ${word}${n === 1 ? "" : "s"}`;
}

/** "2026-01-01T00:00:00.000Z" -> "2026-01-01 00:00:00 UTC" */
function formatUtc(iso: string): string {
  return iso.replace("T", " ").replace(/\.\d+Z$|Z$/, " UTC");
}

export function validityOf(cert: DecodedCertificate): { tone: Tone; text: string } {
  if (cert.type === "csr") return { tone: "neutral", text: "Signing request" };
  if (cert.validityStatus === "expired") return { tone: "bad", text: `Expired ${plural(cert.daysSinceExpiry ?? 0, "day")} ago` };
  if (cert.validityStatus === "not_yet_valid") {
    return { tone: "warn", text: `Not valid yet, starts in ${plural(cert.daysUntilValid ?? 0, "day")}` };
  }
  const days = cert.daysRemaining ?? 0;
  if (days < 30) return { tone: "warn", text: `Expires in ${plural(days, "day")}` };
  return { tone: "ok", text: `Valid, ${plural(days, "day")} left` };
}

function Section({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <section>
      <h3 className={cn(captionText, "border-b border-zinc-200 px-4 pb-1.5 pt-5")}>{title}</h3>
      <dl>{children}</dl>
    </section>
  );
}

function Row({ label, children, mono, tone }: { label: ReactNode; children: ReactNode; mono?: boolean; tone?: Tone }) {
  return (
    <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-3 border-b border-zinc-100 px-4 py-2 text-[13px] md:grid-cols-[9rem_minmax(0,1fr)]">
      <dt className="text-zinc-500">{label}</dt>
      <dd className={cn("min-w-0 break-words", TONE_TEXT[tone ?? "neutral"], mono && "break-all font-mono text-xs leading-5")}>
        {children}
      </dd>
    </div>
  );
}

interface CopyRowProps {
  label: string;
  value: string;
  copyKey: string;
  copiedKey: string | null;
  onCopy: (text: string, key: string) => void;
}

/** Monospace value with an always-visible copy button (fingerprints, serials, key IDs). */
function CopyRow({ label, value, copyKey, copiedKey, onCopy }: CopyRowProps) {
  const copied = copiedKey === copyKey;
  return (
    <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-3 border-b border-zinc-100 py-2 pl-4 pr-2 text-[13px] md:grid-cols-[9rem_minmax(0,1fr)]">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="flex min-w-0 items-start gap-1">
        <span className="min-w-0 flex-1 break-all font-mono text-xs leading-5 text-zinc-900">{value}</span>
        <button
          type="button"
          onClick={() => onCopy(value, copyKey)}
          className={cn(btnIcon, "-my-2 md:-my-1.5", copied && "text-zinc-900")}
          title={`Copy ${label}`}
          aria-label={`Copy ${label}`}
        >
          {copied ? <Check {...iconProps} /> : <Copy {...iconProps} />}
        </button>
      </dd>
    </div>
  );
}

function Pill({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[11px] font-medium", TONE_PILL[tone])}>
      {children}
    </span>
  );
}

interface CertDetailsProps {
  cert: DecodedCertificate;
  /** Every block of the input, used to name the issuer when it is part of the same bundle. */
  items: DecodedCertificate[];
  copiedKey: string | null;
  onCopy: (text: string, key: string) => void;
}

/** Flat property list for one decoded certificate or CSR. */
export function CertDetails({ cert, items, copiedKey, onCopy }: CertDetailsProps) {
  const validity = validityOf(cert);
  const isCert = cert.type === "certificate";
  const title = cert.subject?.commonName || cert.subject?.rawString || "No subject";
  const issuerItem = cert.issuedByIndex !== undefined ? items[cert.issuedByIndex] : undefined;
  const sans = cert.sanEntries ?? [];
  const extensions = cert.extensions ?? [];
  const keyUsageExt = extensions.find((e) => e.oid === "2.5.29.15");

  let signatureText = "Not checked";
  let signatureTone: Tone = "neutral";
  if (cert.signatureVerified === false) {
    signatureText = "Invalid signature";
    signatureTone = "bad";
  } else if (cert.signatureVerified) {
    signatureTone = "ok";
    if (cert.type === "csr") signatureText = "Valid (signed by the request key)";
    else if (cert.isSelfSigned) signatureText = "Valid (self-signed)";
    else signatureText = `Valid, signed by #${(cert.issuedByIndex ?? 0) + 1} ${issuerItem?.subject?.commonName ?? ""}`.trim();
  } else if (isCert && !cert.isSelfSigned) {
    signatureText = "Issuer certificate not in input";
  }

  return (
    <div className="pb-8">
      <div className="border-b border-zinc-200 px-4 py-4">
        <p className="break-all text-[15px] font-semibold text-zinc-900">{title}</p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Pill tone={validity.tone}>
            <span className={cn("size-1.5 rounded-full", TONE_DOT[validity.tone])} aria-hidden="true" />
            {validity.text}
          </Pill>
          {cert.role && <Pill tone="neutral">{ROLE_LABELS[cert.role]}</Pill>}
          {isCert && cert.isSelfSigned && <Pill tone="neutral">Self-signed</Pill>}
          {cert.isCA !== undefined && <Pill tone="neutral">{cert.isCA ? "CA" : "Not a CA"}</Pill>}
        </div>
      </div>

      {cert.warnings?.map((warning) => (
        <p key={warning} className="flex items-start gap-2 border-b border-amber-100 bg-amber-50 px-4 py-2 text-[13px] text-amber-800">
          <TriangleAlert {...iconProps} className="mt-0.5 size-4 shrink-0" />
          <span className="min-w-0 break-words">{warning}</span>
        </p>
      ))}

      <Section title="Subject">
        {NAME_ROWS.map(([key, label]) =>
          cert.subject?.[key] ? (
            <Row key={key} label={label}>
              {cert.subject[key]}
            </Row>
          ) : null
        )}
        {cert.subject?.rawString && (
          <Row label="DN" mono>
            {cert.subject.rawString}
          </Row>
        )}
      </Section>

      {isCert && (
        <Section title="Issuer">
          {cert.isSelfSigned ? (
            <Row label="Issuer">Same as subject (self-signed)</Row>
          ) : (
            <>
              {cert.issuer?.commonName && <Row label="Common name">{cert.issuer.commonName}</Row>}
              {cert.issuer?.organization && <Row label="Organization">{cert.issuer.organization}</Row>}
              {cert.issuer?.rawString && (
                <Row label="DN" mono>
                  {cert.issuer.rawString}
                </Row>
              )}
            </>
          )}
        </Section>
      )}

      {isCert && cert.notBefore && cert.notAfter && (
        <Section title="Validity">
          <Row label="Not before" mono>
            {formatUtc(cert.notBefore)}
          </Row>
          <Row label="Not after" mono>
            {formatUtc(cert.notAfter)}
          </Row>
          <Row label="Status" tone={validity.tone}>
            {validity.text}
          </Row>
          {cert.lifetimeDays !== undefined && <Row label="Lifetime">{plural(cert.lifetimeDays, "day")}</Row>}
        </Section>
      )}

      {sans.length > 0 && (
        <Section title={`Subject alternative names (${sans.length})`}>
          {sans.map((san, i) => (
            <Row key={`${san.type}-${san.value}-${i}`} label={san.type} mono>
              {san.value}
            </Row>
          ))}
        </Section>
      )}

      <Section title="Key and signature">
        <Row label="Public key">
          {cert.publicKeyAlgorithm}
          {cert.publicKeyCurve ? ` ${cert.publicKeyCurve}` : ""}
          {cert.publicKeySize ? `, ${cert.publicKeySize}` : ""}
        </Row>
        {cert.publicKeyExponent !== undefined && <Row label="Exponent">{cert.publicKeyExponent.toLocaleString("en-US")}</Row>}
        <Row label="Signature">{cert.signatureAlgorithm}</Row>
        <Row label="Verified" tone={signatureTone}>
          {signatureText}
        </Row>
      </Section>

      {(cert.keyUsages?.length || cert.extendedKeyUsages?.length || cert.isCA !== undefined) && (
        <Section title="Usage">
          {cert.keyUsages && cert.keyUsages.length > 0 && (
            <Row label="Key usage">
              {cert.keyUsages.join(", ")}
              {keyUsageExt?.critical && <span className="text-zinc-400"> (critical)</span>}
            </Row>
          )}
          {cert.extendedKeyUsages && cert.extendedKeyUsages.length > 0 && (
            <Row label="Extended">{cert.extendedKeyUsages.join(", ")}</Row>
          )}
          {cert.isCA !== undefined && (
            <Row label="CA">
              {cert.isCA ? "Yes" : "No"}
              {cert.pathLength !== undefined ? `, path length ${cert.pathLength}` : ""}
            </Row>
          )}
        </Section>
      )}

      <Section title="Identifiers">
        {isCert && cert.serialNumber && (
          <CopyRow label="Serial number" value={cert.serialNumber} copyKey="serial" copiedKey={copiedKey} onCopy={onCopy} />
        )}
        {cert.subjectKeyId && (
          <CopyRow label="Subject key ID" value={cert.subjectKeyId} copyKey="ski" copiedKey={copiedKey} onCopy={onCopy} />
        )}
        {cert.authorityKeyId && (
          <CopyRow label="Authority key ID" value={cert.authorityKeyId} copyKey="aki" copiedKey={copiedKey} onCopy={onCopy} />
        )}
        {cert.fingerprintSha256 && (
          <CopyRow label="SHA-256" value={cert.fingerprintSha256} copyKey="sha256" copiedKey={copiedKey} onCopy={onCopy} />
        )}
        {cert.fingerprintSha1 && (
          <CopyRow label="SHA-1" value={cert.fingerprintSha1} copyKey="sha1" copiedKey={copiedKey} onCopy={onCopy} />
        )}
      </Section>

      {extensions.length > 0 && (
        <Section title={`Extensions (${extensions.length})`}>
          {extensions.map((ext, i) => (
            <Row
              key={`${ext.oid}-${i}`}
              label={
                <>
                  {ext.name}
                  {ext.critical && <span className="block text-[11px] text-zinc-400">critical</span>}
                </>
              }
            >
              <span className="block break-all">{ext.value}</span>
              {ext.name !== ext.oid && <span className="block font-mono text-[11px] text-zinc-400">{ext.oid}</span>}
            </Row>
          ))}
        </Section>
      )}
    </div>
  );
}
