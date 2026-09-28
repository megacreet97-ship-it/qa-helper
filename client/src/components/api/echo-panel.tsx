import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CopyButton } from "@/components/copy-button";
import { usePersistentState } from "@/hooks/use-persistent-state";
import { parseHeaderLines, toCurl } from "@/lib/http-convert";
import { ResponseView, sendRequest, type HttpResult } from "./response-view";
import { Send } from "lucide-react";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

export function EchoPanel() {
  const [method, setMethod] = usePersistentState<string>("echo.method", "POST");
  const [url, setUrl] = useState("/api/echo/orders?debug=1");
  const [headersText, setHeadersText] = useState("Content-Type: application/json\nX-Request-Id: qa-001");
  const [body, setBody] = useState('{\n  "orderId": 5521,\n  "items": 3\n}');
  const [result, setResult] = useState<HttpResult | null>(null);
  const [loading, setLoading] = useState(false);

  const hasBody = !["GET", "HEAD"].includes(method);
  const headers = parseHeaderLines(headersText);
  const absoluteUrl = url.startsWith("/") ? `${window.location.origin}${url}` : url;
  const echoBase = `${window.location.origin}/api/echo`;

  const send = async () => {
    setLoading(true);
    setResult(null);
    const h = new Headers();
    try {
      headers.forEach(([k, v]) => h.append(k, v));
    } catch (e: any) {
      setResult({ status: 0, statusText: "", time: 0, headers: [], body: "", error: `Недопустимый заголовок: ${e.message}` });
      setLoading(false);
      return;
    }
    setResult(await sendRequest(url, { method, headers: h, body: hasBody && body ? body : undefined }));
    setLoading(false);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-md border bg-muted/40 p-3 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Эхо-эндпоинт: отвечает тем, что реально получил — метод, путь, query, заголовки, тело
          </span>
          <CopyButton text={echoBase} variant="ghost" size="sm" />
        </div>
        <code className="block break-all text-xs font-mono">{echoBase}<span className="text-muted-foreground">/любой/путь</span></code>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-2">
          <Label>Метод</Label>
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger className="w-32" data-testid="select-echo-method">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {METHODS.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 flex-1 min-w-60">
          <Label htmlFor="echo-url">URL</Label>
          <Input
            id="echo-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="font-mono text-sm"
            data-testid="input-echo-url"
          />
        </div>
      </div>
      <p className="-mt-3 text-xs text-muted-foreground">
        Можно указать и внешний адрес — запрос уйдёт из браузера, поэтому сработает только если сервер разрешает CORS.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="echo-headers">Заголовки</Label>
          <Textarea
            id="echo-headers"
            value={headersText}
            onChange={(e) => setHeadersText(e.target.value)}
            className="min-h-32 font-mono text-sm"
            spellCheck={false}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="echo-body">Тело {!hasBody && <span className="text-muted-foreground font-normal">(не отправляется с {method})</span>}</Label>
          <Textarea
            id="echo-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={!hasBody}
            className="min-h-32 font-mono text-sm"
            spellCheck={false}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={send} disabled={loading || !url.trim()} data-testid="button-send-echo">
          <Send className="w-4 h-4 mr-1" /> {loading ? "Отправка…" : "Отправить"}
        </Button>
        <CopyButton
          text={toCurl({ method, url: absoluteUrl, headers, body: hasBody ? body : undefined })}
          variant="outline"
          size="sm"
          label="Как curl"
        />
      </div>

      {result && <ResponseView result={result} />}
    </div>
  );
}
