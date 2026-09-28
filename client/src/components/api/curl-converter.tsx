import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CopyButton } from "@/components/copy-button";
import { usePersistentState } from "@/hooks/use-persistent-state";
import {
  parseCurl,
  parseHeaderLines,
  toAxios,
  toCurl,
  toFetch,
  toPostman,
  toPythonRequests,
  type ParsedRequest,
} from "@/lib/http-convert";
import { AlertTriangle } from "lucide-react";

const TARGETS = {
  fetch: { label: "fetch", render: toFetch },
  axios: { label: "axios", render: toAxios },
  python: { label: "Python requests", render: toPythonRequests },
  postman: { label: "Postman", render: toPostman },
} as const;
type Target = keyof typeof TARGETS;

const SAMPLE = `curl 'https://api.example.com/v1/orders?limit=20' \\
  -X POST \\
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.e30.abc' \\
  -H 'Content-Type: application/json' \\
  --data-raw '{"productId": 311, "quantity": 2, "comment": "Позвонить заранее"}'`;

function Output({ code, testId }: { code: string; testId: string }) {
  return (
    <div className="relative">
      <div className="absolute right-2 top-2">
        <CopyButton text={code} className="h-7 w-7" />
      </div>
      <pre className="max-h-[28rem] overflow-auto rounded-md bg-muted p-4 pr-12 text-sm font-mono" data-testid={testId}>
        {code}
      </pre>
    </div>
  );
}

export function CurlConverter() {
  const [mode, setMode] = usePersistentState<"from-curl" | "to-curl">("curl.mode", "from-curl");
  const [target, setTarget] = usePersistentState<Target>("curl.target", "fetch");
  const [curl, setCurl] = useState(SAMPLE);

  const [method, setMethod] = useState("POST");
  const [url, setUrl] = useState("https://api.example.com/v1/login");
  const [headersText, setHeadersText] = useState("Content-Type: application/json\nAccept: application/json");
  const [body, setBody] = useState('{\n  "email": "qa@example.com",\n  "password": "Test1234!"\n}');

  const parsed = useMemo((): { req?: ParsedRequest; error?: string } => {
    if (!curl.trim()) return {};
    try {
      return { req: parseCurl(curl) };
    } catch (e: any) {
      return { error: e.message };
    }
  }, [curl]);

  const output = useMemo(() => {
    if (!parsed.req) return "";
    try {
      return TARGETS[target].render(parsed.req);
    } catch (e: any) {
      return `// Не удалось сгенерировать: ${e.message}`;
    }
  }, [parsed, target]);

  const builtCurl = toCurl({
    method,
    url,
    headers: parseHeaderLines(headersText),
    body: ["GET", "HEAD"].includes(method) ? undefined : body || undefined,
  });

  return (
    <div className="space-y-5">
      <ToggleGroup
        type="single"
        value={mode}
        onValueChange={(v) => v && setMode(v as typeof mode)}
        className="justify-start"
      >
        <ToggleGroupItem value="from-curl" className="text-sm" data-testid="toggle-from-curl">curl → код</ToggleGroupItem>
        <ToggleGroupItem value="to-curl" className="text-sm" data-testid="toggle-to-curl">Запрос → curl</ToggleGroupItem>
      </ToggleGroup>

      {mode === "from-curl" ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="curl-input">Команда curl</Label>
            <Textarea
              id="curl-input"
              value={curl}
              onChange={(e) => setCurl(e.target.value)}
              className="min-h-36 font-mono text-sm"
              spellCheck={false}
              placeholder="curl https://…"
              data-testid="textarea-curl"
            />
            <p className="text-xs text-muted-foreground">
              Вставьте «Copy as cURL» из DevTools или Postman. Понимает -X, -H, -d, --data-raw, --json, -u, -b, -F, -G.
            </p>
          </div>

          {parsed.error && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3">
              <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              <p className="text-sm text-destructive">{parsed.error}</p>
            </div>
          )}

          {parsed.req && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <code className="text-xs font-mono text-muted-foreground break-all">
                  <span className="text-primary">{parsed.req.method}</span> {parsed.req.url}
                </code>
                <ToggleGroup
                  type="single"
                  value={target}
                  onValueChange={(v) => v && setTarget(v as Target)}
                  size="sm"
                >
                  {Object.entries(TARGETS).map(([key, t]) => (
                    <ToggleGroupItem key={key} value={key} className="text-xs" data-testid={`toggle-target-${key}`}>
                      {t.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
              {parsed.req.warnings.length > 0 && (
                <ul className="space-y-0.5 text-xs text-amber-700 dark:text-amber-300">
                  {parsed.req.warnings.map((w) => <li key={w}>• {w}</li>)}
                </ul>
              )}
              <Output code={output} testId="text-curl-output" />
              {target === "postman" && (
                <p className="text-xs text-muted-foreground">Postman → Import → Raw text: вставьте этот JSON как коллекцию.</p>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-2">
              <Label>Метод</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex-1 min-w-60">
              <Label htmlFor="build-url">URL</Label>
              <Input id="build-url" value={url} onChange={(e) => setUrl(e.target.value)} className="font-mono text-sm" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="build-headers">Заголовки</Label>
              <Textarea
                id="build-headers"
                value={headersText}
                onChange={(e) => setHeadersText(e.target.value)}
                className="min-h-32 font-mono text-sm"
                spellCheck={false}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="build-body">Тело</Label>
              <Textarea
                id="build-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="min-h-32 font-mono text-sm"
                spellCheck={false}
              />
            </div>
          </div>
          <Output code={builtCurl} testId="text-built-curl" />
        </>
      )}
    </div>
  );
}
