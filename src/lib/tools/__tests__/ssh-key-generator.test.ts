import { describe, expect, it } from "vitest";
import {
  applyComment,
  formatOpenSshPrivateKey,
  generateRandomart,
  generateSshKeypair,
  md5Fingerprint,
  parseOpenSshPublicKey,
  sha256Fingerprint,
} from "../ssh-key-generator";

/*
 * Reference vectors from a throwaway key made with the real tool:
 *   ssh-keygen -q -t ed25519 -N "" -C "ref@x" -f ref_ed   (OpenSSH_10.2p1)
 *   ssh-keygen -lv -f ref_ed.pub ; ssh-keygen -l -E md5 -f ref_ed.pub
 */
const REF_PUBLIC = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAINfBKpggtLYO7VIbGhIYg5cfRcqV0IwFQLcMKZUy+4Cz ref@x";
const REF_PRIVATE = `-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACDXwSqYILS2Du1SGxoSGIOXH0XKldCMBUC3DCmVMvuAswAAAIiDvX5+g71+
fgAAAAtzc2gtZWQyNTUxOQAAACDXwSqYILS2Du1SGxoSGIOXH0XKldCMBUC3DCmVMvuAsw
AAAEBfYiFkhVCVpWH+7IinMsu/Vlm/AcOcKu0kqrHD2dI2hNfBKpggtLYO7VIbGhIYg5cf
RcqV0IwFQLcMKZUy+4CzAAAABXJlZkB4
-----END OPENSSH PRIVATE KEY-----
`;
const REF_SHA256 = "SHA256:EdoFogCcYcke1xyhUlqP36by/0sPAmIoyFCl+ENPpc0";
const REF_MD5 = "MD5:c1:56:76:e9:c4:30:7e:52:43:c3:03:12:57:6d:d5:e2";
const REF_RANDOMART = [
  "+--[ED25519 256]--+",
  "|++*++o= o..      |",
  "|.O+++O + o       |",
  "|+o=o+.E o        |",
  "|++oo. .  .       |",
  "|oooo.o oS        |",
  "|. ... +          |",
  "|   . . . o       |",
  "|    o   o o      |",
  "|     ....o..     |",
  "+----[SHA256]-----+",
].join("\n");

const fromB64 = (b64: string) => new Uint8Array(Buffer.from(b64, "base64"));

/** Minimal openssh-key-v1 reader for asserting structure. */
class Reader {
  private offset = 0;
  constructor(private readonly bytes: Uint8Array) {}
  get remaining() {
    return this.bytes.length - this.offset;
  }
  bytesN(n: number) {
    const out = this.bytes.subarray(this.offset, this.offset + n);
    if (out.length !== n) throw new Error("truncated");
    this.offset += n;
    return out;
  }
  u32() {
    const b = this.bytesN(4);
    return ((b[0] << 24) | (b[1] << 16) | (b[2] << 8) | b[3]) >>> 0;
  }
  string() {
    return this.bytesN(this.u32());
  }
  text() {
    return new TextDecoder().decode(this.string());
  }
  rest() {
    return this.bytesN(this.remaining);
  }
}

function decodePrivateKey(pem: string) {
  const lines = pem.trim().split("\n");
  expect(lines[0]).toBe("-----BEGIN OPENSSH PRIVATE KEY-----");
  expect(lines[lines.length - 1]).toBe("-----END OPENSSH PRIVATE KEY-----");
  const body = lines.slice(1, -1);
  for (const line of body.slice(0, -1)) expect(line).toHaveLength(70);
  return fromB64(body.join(""));
}

describe("fingerprints", () => {
  const blob = fromB64(REF_PUBLIC.split(" ")[1]);

  it("matches ssh-keygen SHA256 output", async () => {
    expect((await sha256Fingerprint(blob)).text).toBe(REF_SHA256);
  });

  it("computes a real MD5 fingerprint over the public blob", () => {
    const md5 = md5Fingerprint(blob);
    expect(md5).toMatch(/^MD5:([0-9a-f]{2}:){15}[0-9a-f]{2}$/);
    expect(md5).toBe(REF_MD5);
  });

  it("draws the same randomart as ssh-keygen -lv", async () => {
    const { digest } = await sha256Fingerprint(blob);
    expect(generateRandomart(digest, "ED25519", 256)).toBe(REF_RANDOMART);
  });
});

describe("OpenSSH private key format", () => {
  it("re-serializes the reference ed25519 key byte for byte", () => {
    const r = new Reader(decodePrivateKey(REF_PRIVATE));
    r.bytesN(15); // magic
    r.string(); // cipher
    r.string(); // kdf
    r.string(); // kdf options
    r.u32(); // key count
    const publicBlob = r.string();
    const priv = new Reader(r.string());
    const checkint = priv.u32();
    priv.u32();
    const fieldsStart = priv.rest();
    // Fields = everything up to the comment string ("ref@x" = 4 + 5 bytes, no padding needed)
    const privateFields = fieldsStart.subarray(0, fieldsStart.length - 9);

    expect(formatOpenSshPrivateKey({ publicBlob, privateFields, checkint }, "ref@x")).toBe(REF_PRIVATE);
  });

  it("writes a well-formed openssh-key-v1 ed25519 key that matches the PKCS#8 key", async () => {
    const kp = await generateSshKeypair("ed25519", "dev@example");
    expect(kp.algorithm).toBe("ed25519");
    expect(kp.fellBack).toBe(false);
    expect(kp.privateKeyOpenSSH.endsWith("-----END OPENSSH PRIVATE KEY-----\n")).toBe(true);

    const r = new Reader(decodePrivateKey(kp.privateKeyOpenSSH));
    expect(new TextDecoder().decode(r.bytesN(15))).toBe("openssh-key-v1\0");
    expect(r.text()).toBe("none");
    expect(r.text()).toBe("none");
    expect(r.string()).toHaveLength(0);
    expect(r.u32()).toBe(1);
    const publicBlob = r.string();
    expect(Buffer.from(publicBlob).toString("base64")).toBe(kp.publicKeyOpenSSH.split(" ")[1]);

    const section = r.string();
    expect(r.remaining).toBe(0);
    expect(section.length % 8).toBe(0);

    const p = new Reader(section);
    expect(p.u32()).toBe(p.u32()); // checkint pair
    expect(p.text()).toBe("ssh-ed25519");
    const pub = p.string();
    const secret = p.string();
    expect(pub).toHaveLength(32);
    expect(secret).toHaveLength(64);
    expect(Array.from(secret.subarray(32))).toEqual(Array.from(pub));
    expect(p.text()).toBe("dev@example");
    const padding = p.rest();
    expect(Array.from(padding)).toEqual(Array.from(padding, (_, i) => i + 1));

    // Seed must be the same private key as the PKCS#8 export
    const der = fromB64(kp.privateKeyPem.replace(/-----[A-Z ]+-----|\s/g, ""));
    const key = await crypto.subtle.importKey("pkcs8", der, { name: "Ed25519" }, true, ["sign"]);
    const jwk = await crypto.subtle.exportKey("jwk", key);
    expect(Buffer.from(secret.subarray(0, 32)).toString("base64url")).toBe(jwk.d);
    expect(Buffer.from(pub).toString("base64url")).toBe(jwk.x);
  });

  it("updates the comment without changing the key", async () => {
    const kp = await generateSshKeypair("ecdsa-p256", "old@host");
    const next = applyComment(kp, "new@host");
    expect(next.publicKeyOpenSSH).toBe(kp.publicKeyOpenSSH.replace("old@host", "new@host"));
    expect(next.fingerprintSha256).toBe(kp.fingerprintSha256);
    expect(next.privateKeyOpenSSH).not.toBe(kp.privateKeyOpenSSH);
    expect(decodePrivateKey(next.privateKeyOpenSSH).length).toBe(decodePrivateKey(kp.privateKeyOpenSSH).length);
    expect(applyComment(kp, "").publicKeyOpenSSH.split(" ")).toHaveLength(2);
  });
});

describe("parseOpenSshPublicKey", () => {
  it("restores algorithm and comment", () => {
    expect(parseOpenSshPublicKey(REF_PUBLIC)).toEqual({
      keyType: "ssh-ed25519",
      algorithm: "ed25519",
      keySize: 256,
      comment: "ref@x",
    });
    expect(parseOpenSshPublicKey("not a key")).toBeNull();
    expect(parseOpenSshPublicKey("ssh-rsa AAAAC3NzaC1lZDI1NTE5AAAAINfBKpggtLYO7VIbGhIYg5cfRcqV0IwFQLcMKZUy+4Cz")).toBeNull();
  });

  it("maps RSA keys to 2048 / 4096 by modulus size", async () => {
    const kp = await generateSshKeypair("rsa-2048", "");
    const parsed = parseOpenSshPublicKey(kp.publicKeyOpenSSH);
    expect(parsed?.algorithm).toBe("rsa-2048");
    expect(parsed?.keySize).toBe(2048);
    expect(parsed?.comment).toBe("");
  });
});
