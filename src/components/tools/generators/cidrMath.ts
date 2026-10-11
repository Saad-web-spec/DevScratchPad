/**
 * IPv4 / IPv6 CIDR math on bigint so /0, /32, /64 and /128 blocks are all exact.
 *
 * Input forms: `192.168.1.10/24`, `192.168.1.0 255.255.255.0`, `10.0.0.1` (treated as /32),
 * `2001:db8::/32`, `::ffff:192.0.2.1/128`, `fe80::1` (treated as /128).
 */

export type IpVersion = 4 | 6;

export interface CidrInfo {
  version: IpVersion;
  bits: number;
  prefix: number;
  /** True when the input had no /prefix and the host prefix (/32 or /128) was assumed. */
  prefixAssumed: boolean;
  address: string;
  addressValue: bigint;
  network: string;
  networkValue: bigint;
  /** Last address of the block (the broadcast address for IPv4). */
  last: string;
  lastValue: bigint;
  firstUsable: string;
  lastUsable: string;
  mask: string;
  wildcard: string;
  totalAddresses: bigint;
  usableHosts: bigint;
  /** IPv4 /31 and /32 or IPv6 notes on how usable hosts were counted. */
  hostNote: string;
  addressType: string;
  ipClass?: string;
  expanded?: string;
  reverseDns: string;
  /** Whether the typed address is a host inside the block rather than its network address. */
  isHostAddress: boolean;
}

export type CidrParseResult = { ok: true; info: CidrInfo } | { ok: false; error: string };

const B0 = BigInt(0);
const B1 = BigInt(1);
const B8 = BigInt(8);
const B16 = BigInt(16);
const B255 = BigInt(255);
const BFFFF = BigInt(0xffff);

const maxValue = (bits: number) => (B1 << BigInt(bits)) - B1;

export function prefixMask(prefix: number, bits: number): bigint {
  if (prefix <= 0) return B0;
  return maxValue(bits) ^ maxValue(bits - prefix);
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

export function parseIpv4(text: string): bigint | string {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(text);
  if (!m) return "Invalid IPv4 address. Use four numbers 0-255 separated by dots, e.g. 192.168.1.0.";
  let v = B0;
  for (const octet of m.slice(1)) {
    if (octet.length > 1 && octet.startsWith("0")) return `Octet "${octet}" has a leading zero, which some systems read as octal. Write it without leading zeros.`;
    const n = Number(octet);
    if (n > 255) return `Octet ${octet} is out of range (0-255).`;
    v = (v << B8) | BigInt(n);
  }
  return v;
}

export function parseIpv6(text: string): bigint | string {
  let s = text;
  if (s.includes("%")) return "Zone ids (the %interface suffix) are not part of a CIDR block. Remove it.";
  if (s.startsWith("[") && s.endsWith("]")) s = s.slice(1, -1);
  const doubleColon = s.split("::");
  if (doubleColon.length > 2) return 'Invalid IPv6 address: "::" can appear only once.';

  const parseGroups = (part: string): number[] | string => {
    if (part === "") return [];
    const groups: number[] = [];
    const items = part.split(":");
    for (let i = 0; i < items.length; i++) {
      const g = items[i];
      if (i === items.length - 1 && g.includes(".")) {
        const v4 = parseIpv4(g);
        if (typeof v4 === "string") return `Invalid embedded IPv4 "${g}".`;
        groups.push(Number(v4 >> B16), Number(v4 & BFFFF));
        continue;
      }
      if (!/^[0-9a-f]{1,4}$/i.test(g)) return `Invalid IPv6 group "${g}". Each group is 1-4 hex digits.`;
      groups.push(parseInt(g, 16));
    }
    return groups;
  };

  const head = parseGroups(doubleColon[0]);
  if (typeof head === "string") return head;
  let groups: number[];
  if (doubleColon.length === 2) {
    const tail = parseGroups(doubleColon[1]);
    if (typeof tail === "string") return tail;
    const missing = 8 - head.length - tail.length;
    if (missing < 1) return 'Invalid IPv6 address: too many groups for "::".';
    groups = [...head, ...new Array<number>(missing).fill(0), ...tail];
  } else {
    groups = head;
  }
  if (groups.length !== 8) return `Invalid IPv6 address: expected 8 groups, got ${groups.length}.`;
  let v = B0;
  for (const g of groups) v = (v << B16) | BigInt(g);
  return v;
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export function formatIpv4(v: bigint): string {
  return [24, 16, 8, 0].map((s) => String(Number((v >> BigInt(s)) & B255))).join(".");
}

function ipv6Groups(v: bigint): number[] {
  return Array.from({ length: 8 }, (_, i) => Number((v >> BigInt((7 - i) * 16)) & BFFFF));
}

/** RFC 5952 canonical text: lowercase, no leading zeros, longest zero run (≥2 groups) as "::". */
export function formatIpv6(v: bigint): string {
  const groups = ipv6Groups(v);
  let bestStart = -1;
  let bestLen = 0;
  for (let i = 0; i < 8; ) {
    if (groups[i] !== 0) {
      i++;
      continue;
    }
    let j = i;
    while (j < 8 && groups[j] === 0) j++;
    if (j - i > bestLen) {
      bestStart = i;
      bestLen = j - i;
    }
    i = j;
  }
  const hex = groups.map((g) => g.toString(16));
  if (bestLen < 2) return hex.join(":");
  const left = hex.slice(0, bestStart).join(":");
  const right = hex.slice(bestStart + bestLen).join(":");
  return `${left}::${right}`;
}

export function expandIpv6(v: bigint): string {
  return ipv6Groups(v)
    .map((g) => g.toString(16).padStart(4, "0"))
    .join(":");
}

export function formatIp(v: bigint, version: IpVersion): string {
  return version === 4 ? formatIpv4(v) : formatIpv6(v);
}

/** Bit string of an address (32 or 128 chars). */
export function toBits(v: bigint, bits: number): string {
  return v.toString(2).padStart(bits, "0");
}

/** Thousands-separated bigint (toLocaleString is not reliable for bigint everywhere). */
export function formatBigInt(v: bigint): string {
  return v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** "4,294,967,296" plus a power-of-two hint for huge IPv6 counts. */
export function formatCount(v: bigint, hostBits: number): string {
  if (hostBits > 40) return `2^${hostBits} (${v.toString().length} digits)`;
  return formatBigInt(v);
}

// ---------------------------------------------------------------------------
// Classification
// ---------------------------------------------------------------------------

interface SpecialRange {
  net: bigint;
  prefix: number;
  label: string;
}

function range(version: IpVersion, cidr: string, label: string): SpecialRange {
  const [ip, p] = cidr.split("/");
  const v = version === 4 ? parseIpv4(ip) : parseIpv6(ip);
  return { net: typeof v === "string" ? B0 : v, prefix: Number(p), label };
}

let v4Ranges: SpecialRange[] | null = null;
let v6Ranges: SpecialRange[] | null = null;

function specialRanges(version: IpVersion): SpecialRange[] {
  if (version === 4) {
    v4Ranges ??= [
      range(4, "0.0.0.0/8", "\"This network\" (RFC 1122)"),
      range(4, "10.0.0.0/8", "Private (RFC 1918)"),
      range(4, "100.64.0.0/10", "Shared address space / CGNAT (RFC 6598)"),
      range(4, "127.0.0.0/8", "Loopback"),
      range(4, "169.254.0.0/16", "Link-local (APIPA)"),
      range(4, "172.16.0.0/12", "Private (RFC 1918)"),
      range(4, "192.0.0.0/24", "IETF protocol assignments"),
      range(4, "192.0.2.0/24", "Documentation (TEST-NET-1)"),
      range(4, "192.88.99.0/24", "6to4 relay anycast (deprecated)"),
      range(4, "192.168.0.0/16", "Private (RFC 1918)"),
      range(4, "198.18.0.0/15", "Benchmarking (RFC 2544)"),
      range(4, "198.51.100.0/24", "Documentation (TEST-NET-2)"),
      range(4, "203.0.113.0/24", "Documentation (TEST-NET-3)"),
      range(4, "224.0.0.0/4", "Multicast"),
      range(4, "255.255.255.255/32", "Limited broadcast"),
      range(4, "240.0.0.0/4", "Reserved (future use)"),
    ];
    return v4Ranges;
  }
  v6Ranges ??= [
    range(6, "::/128", "Unspecified address"),
    range(6, "::1/128", "Loopback"),
    range(6, "::ffff:0:0/96", "IPv4-mapped"),
    range(6, "64:ff9b::/96", "NAT64 well-known prefix"),
    range(6, "100::/64", "Discard-only"),
    range(6, "2001::/32", "Teredo"),
    range(6, "2001:db8::/32", "Documentation"),
    range(6, "2002::/16", "6to4"),
    range(6, "fc00::/7", "Unique local (ULA)"),
    range(6, "fe80::/10", "Link-local"),
    range(6, "ff00::/8", "Multicast"),
  ];
  return v6Ranges;
}

function classify(network: bigint, prefix: number, version: IpVersion): string {
  const bits = version === 4 ? 32 : 128;
  if (prefix === 0) return `Default route (entire IPv${version} space)`;
  let containing: SpecialRange | null = null;
  let containsSpecial = false;
  for (const r of specialRanges(version)) {
    if (prefix >= r.prefix && (network & prefixMask(r.prefix, bits)) === r.net) {
      if (!containing || r.prefix > containing.prefix) containing = r;
    } else if (prefix < r.prefix && (r.net & prefixMask(prefix, bits)) === network) {
      containsSpecial = true;
    }
  }
  if (containing) return containing.label;
  if (containsSpecial) return "Mixed (includes special-use ranges)";
  if (version === 6) {
    // 2000::/3: the top three bits are 001
    return (network & prefixMask(3, 128)) === B1 << BigInt(125) ? "Global unicast" : "Reserved by IETF";
  }
  return "Public (globally routable)";
}

function ipv4Class(first: number): string {
  if (first < 128) return "A";
  if (first < 192) return "B";
  if (first < 224) return "C";
  if (first < 240) return "D (multicast)";
  return "E (reserved)";
}

function reverseDns(v: bigint, version: IpVersion): string {
  if (version === 4) return `${formatIpv4(v).split(".").reverse().join(".")}.in-addr.arpa`;
  return `${v.toString(16).padStart(32, "0").split("").reverse().join(".")}.ip6.arpa`;
}

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------

/** Converts a dotted IPv4 netmask to a prefix length, or returns an error for non-contiguous masks. */
function maskToPrefix(maskText: string): number | string {
  const mask = parseIpv4(maskText);
  if (typeof mask === "string") return `Invalid netmask "${maskText}".`;
  const bits = toBits(mask, 32);
  if (/01/.test(bits)) return `Netmask ${maskText} is not contiguous (ones must come before zeros).`;
  return bits.indexOf("0") === -1 ? 32 : bits.indexOf("0");
}

export function parseCidrInput(raw: string): CidrParseResult {
  const text = raw.trim();
  if (!text) return { ok: false, error: "Enter an IPv4 or IPv6 CIDR block, e.g. 192.168.1.0/24 or 2001:db8::/32." };

  // "ip/prefix", "ip/netmask", "ip netmask" or a bare ip
  const m = /^(\S+?)(?:\s*\/\s*(\S+)|\s+(\d+\.\d+\.\d+\.\d+))?$/.exec(text);
  if (!m) return { ok: false, error: "Invalid CIDR format. Expected address/prefix, e.g. 10.0.0.0/8." };
  const [, ipText, prefixText, spacedMask] = m;

  const version: IpVersion = ipText.includes(":") ? 6 : 4;
  const bits = version === 4 ? 32 : 128;
  const parsed = version === 4 ? parseIpv4(ipText) : parseIpv6(ipText);
  if (typeof parsed === "string") return { ok: false, error: parsed };

  let prefix = bits;
  let prefixAssumed = false;
  const prefixSource = prefixText ?? spacedMask;
  if (prefixSource === undefined) {
    prefixAssumed = true;
  } else if (/^\d{1,3}$/.test(prefixSource)) {
    prefix = Number(prefixSource);
    if (prefix > bits) return { ok: false, error: `Prefix /${prefixSource} is out of range for IPv${version} (0-${bits}).` };
  } else if (version === 4 && /^\d+\.\d+\.\d+\.\d+$/.test(prefixSource)) {
    const p = maskToPrefix(prefixSource);
    if (typeof p === "string") return { ok: false, error: p };
    prefix = p;
  } else {
    return { ok: false, error: `Invalid prefix "/${prefixSource}". Use a number from 0 to ${bits}.` };
  }

  const mask = prefixMask(prefix, bits);
  const hostMask = maxValue(bits) ^ mask;
  const network = parsed & mask;
  const last = network | hostMask;
  const hostBits = bits - prefix;
  const total = B1 << BigInt(hostBits);

  let firstUsable = network;
  let lastUsable = last;
  let usable = total;
  let hostNote = "";
  if (version === 4) {
    if (prefix <= 30) {
      firstUsable = network + B1;
      lastUsable = last - B1;
      usable = total - BigInt(2);
      hostNote = "Total minus the network and broadcast addresses";
    } else if (prefix === 31) {
      hostNote = "Point-to-point link (RFC 3021): both addresses usable";
    } else {
      hostNote = "Single host";
    }
  } else if (prefix === 127) {
    hostNote = "Point-to-point link (RFC 6164)";
  } else if (prefix === 128) {
    hostNote = "Single host";
  } else {
    hostNote = "IPv6 has no broadcast address";
  }

  const fmt = (v: bigint) => formatIp(v, version);
  return {
    ok: true,
    info: {
      version,
      bits,
      prefix,
      prefixAssumed,
      address: fmt(parsed),
      addressValue: parsed,
      network: fmt(network),
      networkValue: network,
      last: fmt(last),
      lastValue: last,
      firstUsable: fmt(firstUsable),
      lastUsable: fmt(lastUsable),
      mask: fmt(mask),
      wildcard: fmt(hostMask),
      totalAddresses: total,
      usableHosts: usable,
      hostNote,
      addressType: classify(network, prefix, version),
      ipClass: version === 4 ? ipv4Class(Number(parsed >> BigInt(24))) : undefined,
      expanded: version === 6 ? expandIpv6(parsed) : undefined,
      reverseDns: reverseDns(parsed, version),
      isHostAddress: parsed !== network,
    },
  };
}

export interface SubnetRow {
  cidr: string;
  first: string;
  last: string;
}

/** Splits a block into `/newPrefix` subnets; returns at most `limit` rows plus the exact total. */
export function splitSubnets(info: CidrInfo, newPrefix: number, limit = 256): { rows: SubnetRow[]; total: bigint } {
  if (newPrefix <= info.prefix || newPrefix > info.bits) return { rows: [], total: B0 };
  const total = B1 << BigInt(newPrefix - info.prefix);
  const size = B1 << BigInt(info.bits - newPrefix);
  const rows: SubnetRow[] = [];
  const n = total < BigInt(limit) ? Number(total) : limit;
  for (let i = 0; i < n; i++) {
    const start = info.networkValue + BigInt(i) * size;
    rows.push({
      cidr: `${formatIp(start, info.version)}/${newPrefix}`,
      first: formatIp(start, info.version),
      last: formatIp(start + size - B1, info.version),
    });
  }
  return { rows, total };
}

/** Common prefix lengths offered as quick chips. */
export const PREFIX_CHIPS: Record<IpVersion, number[]> = {
  4: [8, 16, 24, 27, 30, 31, 32],
  6: [32, 48, 56, 64, 112, 127, 128],
};
