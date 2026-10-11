import { describe, expect, it } from "vitest";
import { decodeCertificateOrCsr, decodePemBundle } from "../cert-decoder";
import { SAMPLE_CERT, SAMPLE_CSR } from "@/components/tools/security/cert/samples";

/** leaf (EC P-256, 20 days) -> intermediate (EC P-384, pathlen 0) -> root (RSA 2048), generated with openssl. */
const FULLCHAIN = `-----BEGIN CERTIFICATE-----
MIICVDCCAdqgAwIBAgIUUWy72vBIMM+5pB581m8/RjOyvxgwCgYIKoZIzj0EAwIw
QTELMAkGA1UEBhMCVVMxEDAOBgNVBAoMB1NjcmF0Y2gxIDAeBgNVBAMMF1NjcmF0
Y2ggSW50ZXJtZWRpYXRlIENBMB4XDTI2MTAxMTAwMDMzOFoXDTI2MTAzMTAwMDMz
OFowGzEZMBcGA1UEAwwQc2hvcC5leGFtcGxlLmNvbTBZMBMGByqGSM49AgEGCCqG
SM49AwEHA0IABPkNzPbEMinCsIsMAERKkoABwRWvyg1OLFtaLbc4qs9KWSo1GMZm
KbjJDan0so6/ejcBnvZ/S284wTy8cPeC7wmjgdUwgdIwYAYDVR0RBFkwV4IQc2hv
cC5leGFtcGxlLmNvbYISKi5zaG9wLmV4YW1wbGUuY29thwQKAAABgQ9vcHNAZXhh
bXBsZS5jb22GGGh0dHBzOi8vc2hvcC5leGFtcGxlLmNvbTAOBgNVHQ8BAf8EBAMC
B4AwEwYDVR0lBAwwCgYIKwYBBQUHAwEwCQYDVR0TBAIwADAdBgNVHQ4EFgQUyuL5
8l59hGxbUCs3ZLT15FfUQoQwHwYDVR0jBBgwFoAUp2novh4G4Zg6nsSOjas/GhE6
MZMwCgYIKoZIzj0EAwIDaAAwZQIwRkWeob43xRaDybubMKx9nGdUzVESb4NVsBOb
dMGRof7wd6p+m5FwUyejXzvad4/yAjEAiDJ76iTVAPXbg6hQb73meAlPm5MNLiPx
ahPQ8PqdYV2cNAKSnhK+0gzePVDhhUlH
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
MIIDcTCCAlmgAwIBAgIUdp2g/xY4s/X9t1sh4lFiQ2eppjowDQYJKoZIhvcNAQEM
BQAwPjELMAkGA1UEBhMCVVMxFTATBgNVBAoMDFNjcmF0Y2ggUm9vdDEYMBYGA1UE
AwwPU2NyYXRjaCBSb290IENBMB4XDTI2MTAxMTAwMDMzOFoXDTMxMTAxMDAwMDMz
OFowQTELMAkGA1UEBhMCVVMxEDAOBgNVBAoMB1NjcmF0Y2gxIDAeBgNVBAMMF1Nj
cmF0Y2ggSW50ZXJtZWRpYXRlIENBMHYwEAYHKoZIzj0CAQYFK4EEACIDYgAE8wsY
Jw2vfz5eOn2nh+MGc+yK38EzTkSrYXcsHVclOGd9BsxzK1ajZxsmxg1TPoOzW4SD
SRQFlPHo4avPgjpQ0G67hwoIzPEb0iNa7W85e7veXSz/5ozfqOFMYVC5eE6qo4IB
EDCCAQwwEgYDVR0TAQH/BAgwBgEB/wIBADAOBgNVHQ8BAf8EBAMCAQYwXwYIKwYB
BQUHAQEEUzBRMCMGCCsGAQUFBzABhhdodHRwOi8vb2NzcC5leGFtcGxlLmNvbTAq
BggrBgEFBQcwAoYeaHR0cDovL2NhLmV4YW1wbGUuY29tL3Jvb3QuY3J0MDAGA1Ud
HwQpMCcwJaAjoCGGH2h0dHA6Ly9jcmwuZXhhbXBsZS5jb20vcm9vdC5jcmwwEwYD
VR0gBAwwCjAIBgZngQwBAgEwHQYDVR0OBBYEFKdp6L4eBuGYOp7Ejo2rPxoROjGT
MB8GA1UdIwQYMBaAFOXxs7Gb87VIg13Se1RvNLO5xJAYMA0GCSqGSIb3DQEBDAUA
A4IBAQA5Pk5+mZK/YjoePajx3wLTsknZ67NbBg8S9rv2f/ZGasd3pOAOSxjS8jhT
VuRYGqBssF1lZ7xAtzS+mKfNgCS4NTfAztP2xvCYor6m9DyKwLgvEtWCTfO+6lSV
c50u07ya3qKNa7SWlh3EBqIhewjQZQzuBewjRHEeff6gwBaYbFsJThYOZPPMZW0U
rl4fgtCAGEdBx10nzB1uetorkiHhEU2WR6SyHjGlpwCdJKNF6kGAr0e2lwLgRA2K
HM9PP1o8DqLv1HPaQZLpLtgrSU0dHQYkCSV0mpp1j6v02DVPjvS+cuwQqDZKdWHG
yUM3GQSA37DWC1SpJsySnKws1UsJ
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
MIIDbTCCAlWgAwIBAgIUJF+cXOFUcYVDfxdVpron//4w/s8wDQYJKoZIhvcNAQEL
BQAwPjELMAkGA1UEBhMCVVMxFTATBgNVBAoMDFNjcmF0Y2ggUm9vdDEYMBYGA1UE
AwwPU2NyYXRjaCBSb290IENBMB4XDTI2MTAxMTAwMDMzN1oXDTM2MTAwODAwMDMz
N1owPjELMAkGA1UEBhMCVVMxFTATBgNVBAoMDFNjcmF0Y2ggUm9vdDEYMBYGA1UE
AwwPU2NyYXRjaCBSb290IENBMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKC
AQEA46JZwhzhT+Fp3TdDHSH3tFAHTCbPjJszj74zVoUDOX/scdv6OTixPLmE04Jd
E2nSRbVnXe/W3aU1BgzDjWqhX1dRLon5X542zNnH9qNKNLsCkDh54chZ1qNrFbSH
KydO/7kaRUvrpcae+LdFnFmUIu48eH/sagHoyB3jgvQ3gzVbuTcoX19VoR0ihDug
hc5Ga3QfpkH+kQf3RsXj7XAoHkLeWPREmWuQQmmdEEz8KT1sv23Gk3sKjoEMIIQ2
cy/TXY148BerB+3PeikaiQ0RGC1xz3L5oHSSIB5A2ShJf8BUmp4b1mcb4txG7b1v
2QjScRhLh9jHRpPUcfP8GEh5MQIDAQABo2MwYTAdBgNVHQ4EFgQU5fGzsZvztUiD
XdJ7VG80s7nEkBgwHwYDVR0jBBgwFoAU5fGzsZvztUiDXdJ7VG80s7nEkBgwDwYD
VR0TAQH/BAUwAwEB/zAOBgNVHQ8BAf8EBAMCAQYwDQYJKoZIhvcNAQELBQADggEB
AMZtmn6HWm9uYzEpVKxq0MyVfME/Ld2gwbNIPqUwdxNDjQ/P6idu5B2uzbZamfxP
3Yr31B3P5gTveKiuX3dqo+1ru+Z7KcYNfWZyPLw6wxFUYGXd/ZInyLPcihe/nDWa
Ts1elo51ny8hANH6Tnrq1Fc/ix+tgbDnTaxZICOfffVGT3iQtMu2qtW3Mpj4d0PB
7upstdznn4Uo3zow8qimeSZWTFzNN9rije4YPy7wu709CD1179V3OT3x+lipRWiL
7AtDZK3iLN9umomMUfgOOWitRWlHf92ZQ0AiHiiz2yDsRooW+CE+yzRkG0FIK9XZ
wYrHN3orQGJjnorn0sKdfjY=
-----END CERTIFICATE-----`;

const NOW = new Date("2026-10-15T00:00:00Z");

describe("decodePemBundle: sample certificate", () => {
  it("reads SANs, key usages, EKU names, CA flag and the hashed signature algorithm", async () => {
    const { items } = await decodePemBundle(SAMPLE_CERT, NOW);
    expect(items).toHaveLength(1);
    const cert = items[0];
    expect(cert.valid).toBe(true);
    expect(cert.type).toBe("certificate");
    expect(cert.subject?.commonName).toBe("devscratchpad.com");
    expect(cert.sans).toEqual(["devscratchpad.com", "www.devscratchpad.com"]);
    expect(cert.sanEntries?.every((e) => e.type === "DNS")).toBe(true);
    expect(cert.keyUsages).toEqual(["Digital Signature", "Key Encipherment"]);
    expect(cert.extendedKeyUsages).toEqual(["Server Authentication", "Client Authentication"]);
    expect(cert.isCA).toBe(false);
    expect(cert.isSelfSigned).toBe(true);
    expect(cert.role).toBe("leaf");
    expect(cert.signatureAlgorithm).toBe("ECDSA with SHA-256");
    expect(cert.signatureVerified).toBe(true);
    expect(cert.publicKeyAlgorithm).toBe("EC");
    expect(cert.publicKeyCurve).toBe("P-256");
    expect(cert.publicKeySize).toBe("256 bits");
    expect(cert.validityStatus).toBe("valid");
    expect(cert.daysRemaining).toBeGreaterThan(3000);
    expect(cert.fingerprintSha256).toMatch(/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/);
  });

  it("names common extensions and flags critical ones", async () => {
    const cert = await decodeCertificateOrCsr(SAMPLE_CERT);
    const byOid = new Map(cert.extensions?.map((e) => [e.oid, e]));
    expect(byOid.get("2.5.29.17")?.name).toBe("Subject Alternative Name");
    expect(byOid.get("2.5.29.15")).toMatchObject({ name: "Key Usage", critical: true });
    expect(byOid.get("2.5.29.19")).toMatchObject({ name: "Basic Constraints", critical: true, value: "CA: false" });
    expect(byOid.get("2.5.29.14")?.name).toBe("Subject Key Identifier");
  });

  it("reports not-yet-valid and expired certificates", async () => {
    const early = (await decodePemBundle(SAMPLE_CERT, new Date("2025-12-30T00:00:00Z"))).items[0];
    expect(early.validityStatus).toBe("not_yet_valid");
    expect(early.daysUntilValid).toBe(2);
    const late = (await decodePemBundle(SAMPLE_CERT, new Date("2036-01-11T00:00:00Z"))).items[0];
    expect(late.validityStatus).toBe("expired");
    expect(late.isExpired).toBe(true);
    expect(late.daysSinceExpiry).toBe(10);
  });
});

describe("decodePemBundle: CSR", () => {
  it("reads the requested SAN extension and key size", async () => {
    const csr = await decodeCertificateOrCsr(SAMPLE_CSR);
    expect(csr.valid).toBe(true);
    expect(csr.type).toBe("csr");
    expect(csr.subject?.commonName).toBe("api.devscratchpad.com");
    expect(csr.sans).toEqual(["api.devscratchpad.com"]);
    expect(csr.publicKeySize).toBe("256 bits");
    expect(csr.signatureVerified).toBe(true);
  });
});

describe("decodePemBundle: chains and errors", () => {
  it("decodes every block of a fullchain and links issuers", async () => {
    const withKey = `${FULLCHAIN}\n-----BEGIN PRIVATE KEY-----\nAAAA\n-----END PRIVATE KEY-----`;
    const { items, skipped } = await decodePemBundle(withKey, NOW);
    expect(skipped).toEqual(["PRIVATE KEY"]);
    expect(items.map((i) => i.role)).toEqual(["leaf", "intermediate", "root"]);
    expect(items[0].issuedByIndex).toBe(1);
    expect(items[1].issuedByIndex).toBe(2);
    expect(items.every((i) => i.signatureVerified)).toBe(true);
    expect(items[0].sanEntries?.map((e) => e.type)).toEqual(["DNS", "DNS", "IP", "Email", "URI"]);
    expect(items[1].pathLength).toBe(0);
    expect(items[2].publicKeySize).toBe("2048 bits");
    expect(items[2].publicKeyExponent).toBe(65537);
    expect(items[1].signatureAlgorithm).toBe("RSA with SHA-384");
  });

  it("returns readable errors", async () => {
    expect((await decodePemBundle("")).items[0].valid).toBe(false);
    expect((await decodePemBundle("hello")).items[0].error).toMatch(/No PEM block found/);
    expect((await decodePemBundle("-----BEGIN CERTIFICATE-----\nMIIB")).items[0].error).toMatch(/END CERTIFICATE/);
    const bad = await decodePemBundle("-----BEGIN CERTIFICATE-----\nMIIDRjCCAi6gAwIBAgIU\n-----END CERTIFICATE-----");
    expect(bad.items[0].valid).toBe(false);
    expect(bad.items[0].error).toMatch(/^Failed to decode X.509 certificate/);
  });
});
