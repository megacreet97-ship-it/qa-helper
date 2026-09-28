// curl <-> code conversion for the API helpers page. Pure functions, no network.

export interface ParsedRequest {
  method: string;
  url: string;
  headers: [string, string][];
  body?: string;
  form?: [string, string][]; // multipart -F fields ("@file" values kept as-is)
  warnings: string[];
}

// Shell-like tokenizer: '…', "…" with escapes, $'…', backslash escapes and line continuations.
export function tokenizeShell(input: string): string[] {
  const tokens: string[] = [];
  let cur = "";
  let inToken = false;
  let i = 0;
  const s = input.replace(/\\\r?\n/g, " ");

  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) {
      if (inToken) {
        tokens.push(cur);
        cur = "";
        inToken = false;
      }
      i++;
      continue;
    }
    inToken = true;
    if (c === "'") {
      const end = s.indexOf("'", i + 1);
      if (end === -1) throw new Error("Незакрытая одинарная кавычка");
      cur += s.slice(i + 1, end);
      i = end + 1;
    } else if (c === "$" && s[i + 1] === "'") {
      i += 2;
      while (i < s.length && s[i] !== "'") {
        if (s[i] === "\\" && i + 1 < s.length) {
          const n = s[i + 1];
          cur += n === "n" ? "\n" : n === "t" ? "\t" : n === "r" ? "\r" : n;
          i += 2;
        } else {
          cur += s[i++];
        }
      }
      if (i >= s.length) throw new Error("Незакрытая кавычка $'…'");
      i++;
    } else if (c === '"') {
      i++;
      while (i < s.length && s[i] !== '"') {
        if (s[i] === "\\" && i + 1 < s.length && '"\\$`'.includes(s[i + 1])) {
          cur += s[i + 1];
          i += 2;
        } else {
          cur += s[i++];
        }
      }
      if (i >= s.length) throw new Error("Незакрытая двойная кавычка");
      i++;
    } else if (c === "\\" && i + 1 < s.length) {
      cur += s[i + 1];
      i += 2;
    } else {
      cur += c;
      i++;
    }
  }
  if (inToken) tokens.push(cur);
  return tokens;
}

const FLAGS_WITH_ARG = new Set([
  "-X", "--request", "-H", "--header", "-d", "--data", "--data-ascii", "--data-raw", "--data-binary",
  "--data-urlencode", "--json", "-u", "--user", "-b", "--cookie", "-A", "--user-agent", "-e", "--referer",
  "-F", "--form", "--form-string", "--url", "-o", "--output", "-m", "--max-time", "--connect-timeout",
  "-x", "--proxy", "-w", "--write-out", "--retry", "-c", "--cookie-jar", "--cacert", "--cert", "--key",
  "-T", "--upload-file", "-r", "--range", "-E", "--resolve",
]);

function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

export function parseCurl(command: string): ParsedRequest {
  const tokens = tokenizeShell(command.trim());
  if (tokens[0] !== "curl") throw new Error("Команда должна начинаться с curl");

  let method: string | undefined;
  let url = "";
  const headers: [string, string][] = [];
  const data: string[] = [];
  const form: [string, string][] = [];
  const warnings: string[] = [];
  let getMode = false;
  let head = false;
  let jsonMode = false;

  for (let i = 1; i < tokens.length; i++) {
    let tok = tokens[i];
    let arg: string | undefined;

    // --flag=value
    const eq = tok.startsWith("--") ? tok.indexOf("=") : -1;
    if (eq > 0) {
      arg = tok.slice(eq + 1);
      tok = tok.slice(0, eq);
    } else if (/^-[A-Za-z]{2,}$/.test(tok)) {
      // combined short flags: -sSL, or -XPOST / -HX: (attached value)
      const first = "-" + tok[1];
      if (FLAGS_WITH_ARG.has(first)) {
        arg = tok.slice(2);
        tok = first;
      } else {
        for (const ch of tok.slice(1)) {
          if (ch === "G") getMode = true;
          if (ch === "I") head = true;
        }
        continue;
      }
    }

    if (!tok.startsWith("-")) {
      if (!url) url = tok;
      else warnings.push(`Лишний аргумент проигнорирован: ${tok}`);
      continue;
    }

    if (FLAGS_WITH_ARG.has(tok) && arg === undefined) {
      arg = tokens[++i];
      if (arg === undefined) throw new Error(`У флага ${tok} нет значения`);
    }

    switch (tok) {
      case "-X": case "--request": method = arg!.toUpperCase(); break;
      case "-H": case "--header": {
        const idx = arg!.indexOf(":");
        if (idx > 0) headers.push([arg!.slice(0, idx).trim(), arg!.slice(idx + 1).trim()]);
        else warnings.push(`Заголовок без двоеточия пропущен: ${arg}`);
        break;
      }
      case "-d": case "--data": case "--data-ascii": case "--data-binary":
        if (arg!.startsWith("@")) warnings.push(`Тело из файла (${arg}) заменено заглушкой`);
        data.push(arg!);
        break;
      case "--data-raw": data.push(arg!); break;
      case "--data-urlencode": {
        const idx = arg!.indexOf("=");
        data.push(idx >= 0 ? `${arg!.slice(0, idx)}=${encodeURIComponent(arg!.slice(idx + 1))}` : encodeURIComponent(arg!));
        break;
      }
      case "--json": jsonMode = true; data.push(arg!); break;
      case "-u": case "--user": headers.push(["Authorization", `Basic ${utf8ToBase64(arg!)}`]); break;
      case "-b": case "--cookie":
        if (arg!.includes("=")) headers.push(["Cookie", arg!]);
        else warnings.push(`Файл cookie (${arg}) пропущен`);
        break;
      case "-A": case "--user-agent": headers.push(["User-Agent", arg!]); break;
      case "-e": case "--referer": headers.push(["Referer", arg!]); break;
      case "-F": case "--form": case "--form-string": {
        const idx = arg!.indexOf("=");
        if (idx > 0) form.push([arg!.slice(0, idx), arg!.slice(idx + 1)]);
        break;
      }
      case "--url": url = arg!; break;
      case "-G": case "--get": getMode = true; break;
      case "-I": case "--head": head = true; break;
      case "-T": case "--upload-file": method = method ?? "PUT"; warnings.push(`Загрузка файла (${arg}) заменена заглушкой`); break;
      default:
        // -s, -S, -L, -k, -v, -i, --compressed and other output/transport flags don't change the request
        break;
    }
  }

  if (!url) throw new Error("Не найден URL");
  if (!/^[a-z]+:\/\//i.test(url)) url = "http://" + url;

  let body: string | undefined;
  if (data.length) {
    const joined = data.join("&");
    if (getMode) {
      url += (url.includes("?") ? "&" : "?") + joined;
    } else {
      body = joined;
    }
  }

  const has = (name: string) => headers.some(([k]) => k.toLowerCase() === name.toLowerCase());
  if (jsonMode) {
    if (!has("Content-Type")) headers.push(["Content-Type", "application/json"]);
    if (!has("Accept")) headers.push(["Accept", "application/json"]);
  } else if (body !== undefined && !has("Content-Type")) {
    headers.push(["Content-Type", "application/x-www-form-urlencoded"]);
  }

  const finalMethod = method ?? (head ? "HEAD" : body !== undefined || form.length ? "POST" : "GET");

  return { method: finalMethod, url, headers, body, form: form.length ? form : undefined, warnings };
}

// ---------- code generators ----------

const js = (v: string) => JSON.stringify(v);
const py = (v: string) => JSON.stringify(v); // JSON string literals are valid Python literals for text

function prettyJsonBody(req: ParsedRequest): unknown | undefined {
  const ct = req.headers.find(([k]) => k.toLowerCase() === "content-type")?.[1] ?? "";
  if (req.body === undefined || !ct.includes("json")) return undefined;
  try {
    return JSON.parse(req.body);
  } catch {
    return undefined;
  }
}

export function toFetch(req: ParsedRequest): string {
  const lines: string[] = [];
  if (req.form) {
    lines.push("const form = new FormData();");
    for (const [k, v] of req.form) {
      lines.push(v.startsWith("@") ? `form.append(${js(k)}, fileInput.files[0]); // ${v}` : `form.append(${js(k)}, ${js(v)});`);
    }
    lines.push("");
  }
  const opts: string[] = [`  method: ${js(req.method)},`];
  const headers = req.form ? req.headers.filter(([k]) => k.toLowerCase() !== "content-type") : req.headers;
  if (headers.length) {
    opts.push("  headers: {");
    for (const [k, v] of headers) opts.push(`    ${js(k)}: ${js(v)},`);
    opts.push("  },");
  }
  const json = prettyJsonBody(req);
  if (req.form) opts.push("  body: form,");
  else if (json !== undefined) opts.push(`  body: JSON.stringify(${JSON.stringify(json, null, 2).replace(/\n/g, "\n  ")}),`);
  else if (req.body !== undefined) opts.push(`  body: ${js(req.body)},`);

  lines.push(`const response = await fetch(${js(req.url)}, {`, ...opts, "});", "", "const data = await response.text();", "console.log(response.status, data);");
  return lines.join("\n");
}

export function toAxios(req: ParsedRequest): string {
  const lines: string[] = ['import axios from "axios";', ""];
  if (req.form) {
    lines.push("const form = new FormData();");
    for (const [k, v] of req.form) {
      lines.push(v.startsWith("@") ? `form.append(${js(k)}, fileInput.files[0]); // ${v}` : `form.append(${js(k)}, ${js(v)});`);
    }
    lines.push("");
  }
  const cfg: string[] = [`  method: ${js(req.method.toLowerCase())},`, `  url: ${js(req.url)},`];
  const headers = req.form ? req.headers.filter(([k]) => k.toLowerCase() !== "content-type") : req.headers;
  if (headers.length) {
    cfg.push("  headers: {");
    for (const [k, v] of headers) cfg.push(`    ${js(k)}: ${js(v)},`);
    cfg.push("  },");
  }
  const json = prettyJsonBody(req);
  if (req.form) cfg.push("  data: form,");
  else if (json !== undefined) cfg.push(`  data: ${JSON.stringify(json, null, 2).replace(/\n/g, "\n  ")},`);
  else if (req.body !== undefined) cfg.push(`  data: ${js(req.body)},`);
  cfg.push("  validateStatus: () => true,");
  lines.push("const response = await axios({", ...cfg, "});", "", "console.log(response.status, response.data);");
  return lines.join("\n");
}

function toPythonLiteral(v: unknown, indent = 0): string {
  const pad = "    ".repeat(indent);
  if (v === null) return "None";
  if (v === true) return "True";
  if (v === false) return "False";
  if (typeof v === "string") return py(v);
  if (typeof v === "number") return String(v);
  if (Array.isArray(v)) {
    if (!v.length) return "[]";
    return "[\n" + v.map((x) => pad + "    " + toPythonLiteral(x, indent + 1)).join(",\n") + ",\n" + pad + "]";
  }
  const entries = Object.entries(v as Record<string, unknown>);
  if (!entries.length) return "{}";
  return "{\n" + entries.map(([k, x]) => `${pad}    ${py(k)}: ${toPythonLiteral(x, indent + 1)}`).join(",\n") + ",\n" + pad + "}";
}

export function toPythonRequests(req: ParsedRequest): string {
  const lines = ["import requests", ""];
  const headers = req.form ? req.headers.filter(([k]) => k.toLowerCase() !== "content-type") : req.headers;
  if (headers.length) lines.push(`headers = ${toPythonLiteral(Object.fromEntries(headers))}`, "");
  const json = prettyJsonBody(req);
  const args = [py(req.method), py(req.url)];
  if (headers.length) args.push("headers=headers");
  if (req.form) {
    const files = req.form.filter(([, v]) => v.startsWith("@"));
    const fields = req.form.filter(([, v]) => !v.startsWith("@"));
    if (fields.length) {
      lines.push(`data = ${toPythonLiteral(Object.fromEntries(fields))}`);
      args.push("data=data");
    }
    if (files.length) {
      lines.push(`files = {${files.map(([k, v]) => `${py(k)}: open(${py(v.slice(1))}, "rb")`).join(", ")}}`);
      args.push("files=files");
    }
    lines.push("");
  } else if (json !== undefined) {
    const withoutCt = headers.filter(([k]) => k.toLowerCase() !== "content-type");
    lines.splice(2, lines.length - 2);
    if (withoutCt.length) lines.push(`headers = ${toPythonLiteral(Object.fromEntries(withoutCt))}`, "");
    else args.splice(args.indexOf("headers=headers"), 1);
    lines.push(`payload = ${toPythonLiteral(json)}`, "");
    args.push("json=payload");
  } else if (req.body !== undefined) {
    lines.push(`data = ${py(req.body)}`, "");
    args.push("data=data.encode()");
  }
  lines.push(`response = requests.request(${args.join(", ")})`, "print(response.status_code, response.text)");
  return lines.join("\n");
}

function searchPairs(u: URL): { key: string; value: string }[] {
  const out: { key: string; value: string }[] = [];
  u.searchParams.forEach((value, key) => out.push({ key, value }));
  return out;
}

export function toPostman(req: ParsedRequest): string {
  const u = new URL(req.url);
  const item: Record<string, unknown> = {
    name: `${req.method} ${u.pathname}`,
    request: {
      method: req.method,
      header: req.headers.map(([key, value]) => ({ key, value })),
      url: {
        raw: req.url,
        protocol: u.protocol.replace(":", ""),
        host: u.hostname.split("."),
        ...(u.port ? { port: u.port } : {}),
        path: u.pathname.split("/").filter(Boolean),
        ...(u.search ? { query: searchPairs(u) } : {}),
      },
      ...(req.form
        ? {
            body: {
              mode: "formdata",
              formdata: req.form.map(([key, v]) =>
                v.startsWith("@") ? { key, type: "file", src: v.slice(1) } : { key, value: v, type: "text" },
              ),
            },
          }
        : req.body !== undefined
          ? {
              body: {
                mode: "raw",
                raw: req.body,
                ...(prettyJsonBody(req) !== undefined ? { options: { raw: { language: "json" } } } : {}),
              },
            }
          : {}),
    },
  };
  const collection = {
    info: {
      name: "QA Helper import",
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    item: [item],
  };
  return JSON.stringify(collection, null, 2);
}

// ---------- request builder -> curl ----------

const shQuote = (v: string) => (/^[A-Za-z0-9_\-./:=@%+,]+$/.test(v) ? v : `'${v.replace(/'/g, `'\\''`)}'`);

export function toCurl(req: { method: string; url: string; headers: [string, string][]; body?: string }): string {
  const parts = ["curl"];
  if (req.method !== "GET" || req.body) parts.push("-X", req.method);
  parts.push(shQuote(req.url));
  const out = [parts.join(" ")];
  for (const [k, v] of req.headers) out.push(`-H ${shQuote(`${k}: ${v}`)}`);
  if (req.body) out.push(`--data-raw ${shQuote(req.body)}`);
  return out.join(" \\\n  ");
}

/** Parses "Name: value" lines into header pairs; ignores blank lines. */
export function parseHeaderLines(text: string): [string, string][] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const idx = l.indexOf(":");
      return idx > 0 ? ([l.slice(0, idx).trim(), l.slice(idx + 1).trim()] as [string, string]) : null;
    })
    .filter((x): x is [string, string] => x !== null);
}
