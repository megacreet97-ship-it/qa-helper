import http from "http";
import https from "https";
import dns from "dns";
import net from "net";
import { rateLimit } from "express-rate-limit";

// ---------- SSRF-safe fetch ----------

// Separate lists: Node's BlockList also matches IPv4 addresses against IPv6 rules (as ::ffff:a.b.c.d)
const blockedV4 = new net.BlockList();
// IPv4: "this network", private, CGNAT, loopback, link-local (incl. cloud metadata), reserved ranges
for (const [addr, prefix] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8],
  ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24],
  ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24], ["203.0.113.0", 24],
  ["224.0.0.0", 4], ["240.0.0.0", 4],
] as const) {
  blockedV4.addSubnet(addr, prefix, "ipv4");
}

const blockedV6 = new net.BlockList();
// IPv6: unspecified, loopback, NAT64, unique-local, link-local, multicast
blockedV6.addAddress("::", "ipv6");
blockedV6.addAddress("::1", "ipv6");
for (const [addr, prefix] of [
  ["64:ff9b::", 96], ["fc00::", 7], ["fe80::", 10], ["ff00::", 8],
] as const) {
  blockedV6.addSubnet(addr, prefix, "ipv6");
}

export function isPublicAddress(ip: string): boolean {
  const family = net.isIP(ip);
  if (family === 4) return !blockedV4.check(ip, "ipv4");
  if (family === 6) {
    // IPv4-mapped (::ffff:127.0.0.1) and IPv4-compatible forms: judge by the embedded IPv4
    const mapped = ip.toLowerCase().match(/^(?:0*:)*(?:ffff:)?(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return !blockedV4.check(mapped[1], "ipv4");
    const hexMapped = ip.toLowerCase().match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
    if (hexMapped) {
      const hi = parseInt(hexMapped[1], 16), lo = parseInt(hexMapped[2], 16);
      return !blockedV4.check(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`, "ipv4");
    }
    return !blockedV6.check(ip, "ipv6");
  }
  return false;
}

export class SafeFetchError extends Error {}

// Validates the resolved address at connect time, so DNS rebinding can't slip a private IP in.
const safeLookup: net.LookupFunction = (hostname, options, callback) => {
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return (callback as any)(err);
    const list = addresses as dns.LookupAddress[];
    const bad = list.find((a) => !isPublicAddress(a.address));
    if (bad || list.length === 0) {
      return (callback as any)(new SafeFetchError("Адрес запрещён: внутренние и локальные сети недоступны"));
    }
    if ((options as dns.LookupOptions).all) return (callback as any)(null, list);
    callback(null, list[0].address, list[0].family);
  });
};

interface SafeFetchOptions {
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirects?: number;
}

export async function safeFetchText(
  rawUrl: string,
  { timeoutMs = 15000, maxBytes = 5 * 1024 * 1024, maxRedirects = 5 }: SafeFetchOptions = {},
): Promise<{ status: number; text: string }> {
  let url = new URL(rawUrl);
  for (let hop = 0; hop <= maxRedirects; hop++) {
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new SafeFetchError("Разрешены только http и https");
    }
    if (url.username || url.password) {
      throw new SafeFetchError("URL с логином и паролем не поддерживается");
    }
    const host = url.hostname.replace(/^\[|\]$/g, "");
    if (net.isIP(host) && !isPublicAddress(host)) {
      throw new SafeFetchError("Адрес запрещён: внутренние и локальные сети недоступны");
    }

    const res = await requestOnce(url, timeoutMs, maxBytes);
    if (res.status >= 300 && res.status < 400 && res.location) {
      url = new URL(res.location, url);
      continue;
    }
    return { status: res.status, text: res.text };
  }
  throw new SafeFetchError("Слишком много перенаправлений");
}

function requestOnce(url: URL, timeoutMs: number, maxBytes: number) {
  return new Promise<{ status: number; location?: string; text: string }>((resolve, reject) => {
    const lib = url.protocol === "https:" ? https : http;
    const req = lib.request(
      url,
      {
        method: "GET",
        lookup: safeLookup,
        timeout: timeoutMs,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; QAHelper/1.0)",
          Accept: "text/html,application/xhtml+xml,*/*",
        },
      },
      (res) => {
        const status = res.statusCode ?? 0;
        if (status >= 300 && status < 400 && res.headers.location) {
          res.resume();
          return resolve({ status, location: res.headers.location, text: "" });
        }
        const chunks: Buffer[] = [];
        let size = 0;
        res.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > maxBytes) {
            req.destroy(new SafeFetchError(`Ответ больше ${Math.round(maxBytes / 1024 / 1024)} МБ`));
            return;
          }
          chunks.push(chunk);
        });
        res.on("end", () => resolve({ status, text: Buffer.concat(chunks).toString("utf8") }));
        res.on("error", reject);
      },
    );
    req.on("timeout", () => req.destroy(new SafeFetchError(`Превышено время ожидания (${timeoutMs / 1000} сек)`)));
    req.on("error", reject);
    req.end();
  });
}

// ---------- Rate limits ----------

const limitMessage = (text: string) => ({ message: text });

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: limitMessage("Слишком много попыток входа. Попробуйте через 15 минут."),
});

export const generateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: limitMessage("Слишком много запросов на генерацию. Подождите минуту."),
});

export const fetchUrlLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: limitMessage("Слишком много загрузок URL. Подождите минуту."),
});

// ---------- Concurrency limit for heavy jobs (ffmpeg) ----------

export class JobQueueFullError extends Error {}

export function createJobLimiter(concurrency: number, maxQueued: number) {
  let running = 0;
  const waiting: Array<() => void> = [];

  return async function run<T>(job: () => Promise<T>): Promise<T> {
    if (running >= concurrency) {
      if (waiting.length >= maxQueued) {
        throw new JobQueueFullError("Сервер занят генерацией других файлов. Попробуйте через минуту.");
      }
      await new Promise<void>((resolve) => waiting.push(resolve));
    }
    running++;
    try {
      return await job();
    } finally {
      running--;
      waiting.shift()?.();
    }
  };
}

// ---------- Headers ----------

// Safe Content-Disposition: ASCII fallback + RFC 5987 UTF-8 name; strips CR/LF, quotes and path separators.
export function attachment(filename: string): string {
  const clean = filename.replace(/[\r\n"\\/]/g, "_").slice(0, 255) || "file";
  const ascii = clean.replace(/[^\x20-\x7e]/g, "_");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(clean)}`;
}
