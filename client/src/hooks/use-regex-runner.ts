import { useCallback, useEffect, useRef, useState } from "react";
import type { RegexRequest, RegexResponse } from "@/lib/regex.worker";

export type RegexRunResult =
  | { state: "idle" }
  | { state: "running" }
  | { state: "timeout"; ms: number }
  | (Extract<RegexResponse, { ok: true }> & { state: "done" })
  | (Extract<RegexResponse, { ok: false }> & { state: "error" });

const TIMEOUT_MS = 1500;

function createWorker() {
  return new Worker(new URL("../lib/regex.worker.ts", import.meta.url), { type: "module" });
}

/** Runs a regex in a worker; kills and recreates the worker if it hangs (ReDoS). */
export function useRegexRunner() {
  const workerRef = useRef<Worker | null>(null);
  const seq = useRef(0);
  const timer = useRef<number | undefined>(undefined);
  const [result, setResult] = useState<RegexRunResult>({ state: "idle" });

  const ensureWorker = useCallback(() => {
    if (!workerRef.current) {
      const w = createWorker();
      w.onmessage = (e: MessageEvent<RegexResponse>) => {
        if (e.data.id !== seq.current) return; // stale answer
        window.clearTimeout(timer.current);
        setResult(e.data.ok ? { ...e.data, state: "done" } : { ...e.data, state: "error" });
      };
      workerRef.current = w;
    }
    return workerRef.current;
  }, []);

  const run = useCallback(
    (req: Omit<RegexRequest, "id">) => {
      const id = ++seq.current;
      window.clearTimeout(timer.current);
      setResult({ state: "running" });
      ensureWorker().postMessage({ ...req, id } satisfies RegexRequest);
      timer.current = window.setTimeout(() => {
        if (id !== seq.current) return;
        workerRef.current?.terminate();
        workerRef.current = null;
        setResult({ state: "timeout", ms: TIMEOUT_MS });
      }, TIMEOUT_MS);
    },
    [ensureWorker],
  );

  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      workerRef.current?.terminate();
    },
    [],
  );

  return { result, run };
}
