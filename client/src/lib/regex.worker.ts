// Runs user regexes off the main thread so catastrophic backtracking can be killed by a timeout.

export interface RegexRequest {
  id: number;
  pattern: string;
  flags: string;
  text: string;
  replacement: string | null;
}

export interface RegexMatch {
  index: number;
  match: string;
  groups: (string | undefined)[];
  named: Record<string, string | undefined> | null;
}

export type RegexResponse =
  | { id: number; ok: true; matches: RegexMatch[]; truncated: boolean; replaced: string | null; ms: number }
  | { id: number; ok: false; error: string };

const MAX_MATCHES = 1000;

// tsconfig has no "webworker" lib; type the worker global by hand
const ctx = self as unknown as {
  onmessage: ((e: MessageEvent<RegexRequest>) => void) | null;
  postMessage(message: RegexResponse): void;
};

ctx.onmessage = (e: MessageEvent<RegexRequest>) => {
  const { id, pattern, flags, text, replacement } = e.data;
  const start = performance.now();
  let re: RegExp;
  try {
    // iterate with "g"; without the user's "g" only the first match is reported
    re = new RegExp(pattern, flags.includes("g") ? flags : flags + "g");
  } catch (err: any) {
    ctx.postMessage({ id, ok: false, error: err.message } satisfies RegexResponse);
    return;
  }

  const matches: RegexMatch[] = [];
  let truncated = false;
  const onlyFirst = !flags.includes("g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    matches.push({ index: m.index, match: m[0], groups: m.slice(1), named: m.groups ? { ...m.groups } : null });
    if (m[0] === "") re.lastIndex++; // avoid infinite loop on empty matches
    if (onlyFirst) break;
    if (matches.length >= MAX_MATCHES) {
      truncated = true;
      break;
    }
  }

  let replaced: string | null = null;
  if (replacement !== null) {
    replaced = text.replace(new RegExp(pattern, flags), replacement);
  }

  ctx.postMessage({
    id,
    ok: true,
    matches,
    truncated,
    replaced,
    ms: Math.round((performance.now() - start) * 10) / 10,
  } satisfies RegexResponse);
};
