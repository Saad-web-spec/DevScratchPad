export interface CidrInfo {
  ip: string;
  mask: string;
  network: string;
  broadcast: string;
  wildcard: string;
  firstUsable: string;
  lastUsable: string;
  totalHosts: number;
}

export function parseCidr(cidrString: string): { valid: boolean; info?: CidrInfo; error?: string } {
  try {
    const [ipPart, prefixPart] = cidrString.trim().split('/');
    if (!ipPart || !prefixPart) throw new Error("Invalid CIDR format. Expected IP/Prefix (e.g. 192.168.1.0/24)");
    
    const prefix = parseInt(prefixPart, 10);
    if (isNaN(prefix) || prefix < 0 || prefix > 32) throw new Error("Prefix must be between 0 and 32");

    const ipParts = ipPart.split('.').map(Number);
    if (ipParts.length !== 4 || ipParts.some(p => isNaN(p) || p < 0 || p > 255)) {
      throw new Error("Invalid IPv4 address format");
    }

    const ipNum = (ipParts[0] << 24 | ipParts[1] << 16 | ipParts[2] << 8 | ipParts[3]) >>> 0;
    
    let maskNum = 0;
    if (prefix > 0) {
      maskNum = (0xFFFFFFFF << (32 - prefix)) >>> 0;
    }

    const networkNum = (ipNum & maskNum) >>> 0;
    const broadcastNum = (networkNum | ~maskNum) >>> 0;

    const numToIp = (num: number) => {
      return [
        (num >>> 24) & 255,
        (num >>> 16) & 255,
        (num >>> 8) & 255,
        num & 255
      ].join('.');
    };

    const maskIp = numToIp(maskNum);
    const wildcardIp = numToIp(~maskNum >>> 0);
    const networkIp = numToIp(networkNum);
    const broadcastIp = numToIp(broadcastNum);

    let firstUsableIp = networkIp;
    let lastUsableIp = broadcastIp;
    let totalHosts = 0;

    if (prefix < 31) {
      firstUsableIp = numToIp((networkNum + 1) >>> 0);
      lastUsableIp = numToIp((broadcastNum - 1) >>> 0);
      totalHosts = (broadcastNum - networkNum - 1) >>> 0;
    } else if (prefix === 31) {
      // Point-to-point link
      firstUsableIp = networkIp;
      lastUsableIp = broadcastIp;
      totalHosts = 2;
    } else {
      // /32
      firstUsableIp = networkIp;
      lastUsableIp = networkIp;
      totalHosts = 1;
    }

    return {
      valid: true,
      info: {
        ip: ipPart,
        mask: maskIp,
        network: networkIp,
        broadcast: broadcastIp,
        wildcard: wildcardIp,
        firstUsable: firstUsableIp,
        lastUsable: lastUsableIp,
        totalHosts
      }
    };
  } catch (err: any) {
    return { valid: false, error: err.message };
  }
}
