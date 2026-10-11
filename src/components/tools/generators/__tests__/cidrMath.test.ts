import { describe, expect, it } from "vitest";
import { formatIpv6, parseCidrInput, parseIpv6, splitSubnets, type CidrInfo } from "../cidrMath";

function info(input: string): CidrInfo {
  const r = parseCidrInput(input);
  if (!r.ok) throw new Error(r.error);
  return r.info;
}

describe("IPv4", () => {
  it("computes a /24", () => {
    const i = info("192.168.1.0/24");
    expect(i.network).toBe("192.168.1.0");
    expect(i.last).toBe("192.168.1.255");
    expect(i.firstUsable).toBe("192.168.1.1");
    expect(i.lastUsable).toBe("192.168.1.254");
    expect(i.mask).toBe("255.255.255.0");
    expect(i.wildcard).toBe("0.0.0.255");
    expect(i.totalAddresses).toBe(BigInt(256));
    expect(i.usableHosts).toBe(BigInt(254));
    expect(i.addressType).toBe("Private (RFC 1918)");
  });

  it("handles /32, /31 and /0 edge cases", () => {
    const host = info("8.8.8.8/32");
    expect(host.usableHosts).toBe(BigInt(1));
    expect(host.firstUsable).toBe("8.8.8.8");
    expect(host.lastUsable).toBe("8.8.8.8");
    expect(host.mask).toBe("255.255.255.255");

    const p2p = info("10.0.0.0/31");
    expect(p2p.usableHosts).toBe(BigInt(2));
    expect(p2p.firstUsable).toBe("10.0.0.0");
    expect(p2p.lastUsable).toBe("10.0.0.1");

    const all = info("0.0.0.0/0");
    expect(all.totalAddresses).toBe(BigInt(4294967296));
    expect(all.usableHosts).toBe(BigInt(4294967294));
    expect(all.mask).toBe("0.0.0.0");
    expect(all.wildcard).toBe("255.255.255.255");
    expect(all.last).toBe("255.255.255.255");
    expect(all.addressType).toMatch(/Default route/);
  });

  it("normalises a host address to its network and assumes /32 for a bare IP", () => {
    const i = info("10.1.2.3/8");
    expect(i.network).toBe("10.0.0.0");
    expect(i.isHostAddress).toBe(true);
    const bare = info("10.1.2.3");
    expect(bare.prefix).toBe(32);
    expect(bare.prefixAssumed).toBe(true);
  });

  it("accepts dotted netmasks and rejects malformed input", () => {
    expect(info("192.168.1.0 255.255.255.0").prefix).toBe(24);
    expect(info("192.168.1.0/255.255.252.0").prefix).toBe(22);
    expect(parseCidrInput("192.168.1.0/255.0.255.0").ok).toBe(false);
    expect(parseCidrInput("192.168..1/24").ok).toBe(false);
    expect(parseCidrInput("1.2.3.4/33").ok).toBe(false);
    expect(parseCidrInput("1.2.3.256/24").ok).toBe(false);
    expect(parseCidrInput("01.2.3.4/24").ok).toBe(false);
    expect(parseCidrInput("1.2.3.4/24abc").ok).toBe(false);
  });

  it("splits into subnets", () => {
    const { rows, total } = splitSubnets(info("192.168.0.0/24"), 26);
    expect(total).toBe(BigInt(4));
    expect(rows.map((r) => r.cidr)).toEqual(["192.168.0.0/26", "192.168.0.64/26", "192.168.0.128/26", "192.168.0.192/26"]);
    expect(rows[3].last).toBe("192.168.0.255");
  });
});

describe("IPv6", () => {
  it("parses and compresses per RFC 5952", () => {
    const v = parseIpv6("2001:0db8:0000:0000:0001:0000:0000:0001");
    expect(typeof v).toBe("bigint");
    expect(formatIpv6(v as bigint)).toBe("2001:db8::1:0:0:1");
    expect(formatIpv6(parseIpv6("2001:db8:0:1:0:0:0:1") as bigint)).toBe("2001:db8:0:1::1");
    expect(formatIpv6(parseIpv6("::") as bigint)).toBe("::");
    expect(typeof parseIpv6("1::2::3")).toBe("string");
    expect(typeof parseIpv6("1:2:3:4:5:6:7:8:9")).toBe("string");
    expect(typeof parseIpv6("12345::")).toBe("string");
  });

  it("computes a /32 documentation block", () => {
    const i = info("2001:db8::/32");
    expect(i.network).toBe("2001:db8::");
    expect(i.last).toBe("2001:db8:ffff:ffff:ffff:ffff:ffff:ffff");
    expect(i.totalAddresses).toBe(BigInt(2) ** BigInt(96));
    expect(i.mask).toBe("ffff:ffff::");
    expect(i.addressType).toBe("Documentation");
  });

  it("handles ::/0 and /128", () => {
    const all = info("::/0");
    expect(all.totalAddresses).toBe(BigInt(2) ** BigInt(128));
    expect(all.last).toBe("ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff");
    const lo = info("::1/128");
    expect(lo.totalAddresses).toBe(BigInt(1));
    expect(lo.addressType).toBe("Loopback");
    expect(info("fe80::1").prefix).toBe(128);
  });

  it("classifies and normalises", () => {
    expect(info("fe80::1/64").network).toBe("fe80::");
    expect(info("fe80::1/64").addressType).toBe("Link-local");
    expect(info("2606:4700::/32").addressType).toBe("Global unicast");
    expect(info("fd12:3456::/48").addressType).toBe("Unique local (ULA)");
    expect(info("::ffff:192.0.2.1/128").address).toBe("::ffff:c000:201");
  });
});
