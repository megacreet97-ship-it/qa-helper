// Text encoders/decoders for the "Кодирование" tool. All UTF-8 aware.

export type Codec = "base64" | "base64url" | "url" | "url-full" | "html" | "hex" | "unicode";

function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)));
  }
  return btoa(bin);
}

function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/\s+/g, "");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(clean)) throw new Error("Строка содержит символы вне алфавита Base64");
  const bin = atob(clean);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

const utf8 = new TextEncoder();
const utf8Strict = new TextDecoder("utf-8", { fatal: true });

function decodeUtf8(bytes: Uint8Array): string {
  try {
    return utf8Strict.decode(bytes);
  } catch {
    throw new Error("Результат не является корректным UTF-8 (возможно, это бинарные данные)");
  }
}

const HTML_ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function encode(codec: Codec, text: string): string {
  switch (codec) {
    case "base64": return bytesToBase64(utf8.encode(text));
    case "base64url": return bytesToBase64(utf8.encode(text)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    case "url": return encodeURIComponent(text);
    case "url-full": return encodeURI(text);
    case "html": return text.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
    case "hex": return Array.from(utf8.encode(text), (b) => b.toString(16).padStart(2, "0")).join(" ");
    case "unicode":
      return Array.from(text, (ch) => {
        const cp = ch.codePointAt(0)!;
        if (cp < 0x80) return ch;
        return cp > 0xffff ? `\\u{${cp.toString(16)}}` : `\\u${cp.toString(16).padStart(4, "0")}`;
      }).join("");
  }
}

export function decode(codec: Codec, text: string): string {
  switch (codec) {
    case "base64": return decodeUtf8(base64ToBytes(text));
    case "base64url": {
      const b64 = text.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
      return decodeUtf8(base64ToBytes(b64 + "=".repeat((4 - (b64.length % 4)) % 4)));
    }
    case "url":
    case "url-full":
      try {
        // form-encoded query values use + for spaces; encodeURI output keeps + literal
        return codec === "url" ? decodeURIComponent(text.replace(/\+/g, " ")) : decodeURI(text);
      } catch {
        throw new Error("Некорректная %-последовательность");
      }
    case "html": {
      const doc = new DOMParser().parseFromString(`<!doctype html><body>${text.replace(/</g, "&lt;")}`, "text/html");
      return doc.body.textContent ?? "";
    }
    case "hex": {
      const clean = text.replace(/0x/gi, "").replace(/[\s,:]/g, "");
      if (!/^([0-9a-f]{2})*$/i.test(clean)) throw new Error("Hex должен состоять из пар символов 0-9, a-f");
      return decodeUtf8(Uint8Array.from(clean.match(/../g) ?? [], (h) => parseInt(h, 16)));
    }
    case "unicode":
      return text
        .replace(/\\u\{([0-9a-f]{1,6})\}/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
        .replace(/\\u([0-9a-f]{4})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
  }
}

export const CODECS: { value: Codec; label: string; hint: string }[] = [
  { value: "base64", label: "Base64", hint: "RFC 4648, текст в UTF-8" },
  { value: "base64url", label: "Base64URL", hint: "Как в JWT: без паддинга, - и _ вместо + и /" },
  { value: "url", label: "URL-компонент", hint: "encodeURIComponent — для значений query-параметров" },
  { value: "url-full", label: "URL целиком", hint: "encodeURI — не трогает : / ? & =" },
  { value: "html", label: "HTML-сущности", hint: "& < > \" ' → &amp; &lt; …" },
  { value: "hex", label: "Hex (UTF-8 байты)", hint: "Байты через пробел" },
  { value: "unicode", label: "Unicode escape", hint: "Не-ASCII → \\uXXXX" },
];
