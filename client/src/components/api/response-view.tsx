import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/copy-button";

export interface HttpResult {
  status: number;
  statusText: string;
  time: number;
  headers: [string, string][];
  body: string;
  error?: string;
}

export async function sendRequest(url: string, init: RequestInit): Promise<HttpResult> {
  const start = performance.now();
  try {
    const res = await fetch(url, init);
    const body = await res.text();
    const headers: [string, string][] = [];
    res.headers.forEach((v, k) => headers.push([k, v]));
    return { status: res.status, statusText: res.statusText, time: Math.round(performance.now() - start), headers, body };
  } catch (e: any) {
    return {
      status: 0,
      statusText: "",
      time: Math.round(performance.now() - start),
      headers: [],
      body: "",
      error: e?.message || String(e),
    };
  }
}

function prettyBody(body: string): string {
  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return body;
  }
}

function statusTone(status: number): string {
  if (status >= 200 && status < 300) return "bg-primary/10 text-primary border-primary/20";
  if (status >= 300 && status < 400) return "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20";
  if (status >= 400 && status < 500) return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20";
  return "bg-destructive/10 text-destructive border-destructive/20";
}

export function ResponseView({ result, errorHint }: { result: HttpResult; errorHint?: string }) {
  if (result.error) {
    return (
      <div className="space-y-1 rounded-md border border-destructive/40 bg-destructive/5 p-3" data-testid="text-http-error">
        <p className="text-sm font-medium text-destructive">Ответа нет · {result.time} мс</p>
        <p className="text-sm text-muted-foreground">{errorHint ?? result.error}</p>
      </div>
    );
  }

  const body = prettyBody(result.body);
  return (
    <div className="space-y-3" data-testid="http-response">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className={`font-mono ${statusTone(result.status)}`}>
          {result.status} {result.statusText}
        </Badge>
        <Badge variant="secondary" className="font-mono">{result.time} мс</Badge>
        <Badge variant="secondary" className="font-mono">{new Blob([result.body]).size} Б</Badge>
      </div>
      {result.headers.length > 0 && (
        <details className="group rounded-md border">
          <summary className="cursor-pointer select-none px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
            Заголовки ответа <span className="font-mono text-xs">{result.headers.length}</span>
          </summary>
          <div className="border-t px-3 py-2 space-y-0.5">
            {result.headers.map(([k, v]) => (
              <div key={k} className="flex gap-2 text-xs font-mono">
                <span className="text-muted-foreground shrink-0">{k}:</span>
                <span className="break-all">{v}</span>
              </div>
            ))}
          </div>
        </details>
      )}
      {result.body && (
        <div className="relative">
          <div className="absolute right-2 top-2">
            <CopyButton text={body} className="h-7 w-7" />
          </div>
          <pre className="max-h-96 overflow-auto rounded-md bg-muted p-4 pr-12 text-sm font-mono" data-testid="text-http-body">
            {body}
          </pre>
        </div>
      )}
    </div>
  );
}
