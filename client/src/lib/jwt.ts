export type JwtAlg = "HS256" | "HS384" | "HS512" | "none";

const hashFor: Record<Exclude<JwtAlg, "none">, string> = {
  HS256: "SHA-256",
  HS384: "SHA-384",
  HS512: "SHA-512",
};

export function base64UrlEncode(data: string | Uint8Array): string {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function signJwt(header: object, payload: object, alg: JwtAlg, secret: string): Promise<string> {
  const unsigned = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}`;
  if (alg === "none") return `${unsigned}.`;
  if (!crypto.subtle) throw new Error("WebCrypto недоступен: откройте сайт по HTTPS или через localhost");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: hashFor[alg] },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(unsigned));
  return `${unsigned}.${base64UrlEncode(new Uint8Array(sig))}`;
}
