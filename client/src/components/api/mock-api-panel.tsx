import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CopyButton } from "@/components/copy-button";
import { usePersistentState } from "@/hooks/use-persistent-state";
import { parseHeaderLines, toCurl } from "@/lib/http-convert";
import { ResponseView, sendRequest, type HttpResult } from "./response-view";
import { Send } from "lucide-react";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

const STATUS_PRESETS = [
  { code: 200, label: "OK" },
  { code: 201, label: "Created" },
  { code: 204, label: "No Content" },
  { code: 301, label: "Moved" },
  { code: 400, label: "Bad Request" },
  { code: 401, label: "Unauthorized" },
  { code: 403, label: "Forbidden" },
  { code: 404, label: "Not Found" },
  { code: 409, label: "Conflict" },
  { code: 422, label: "Unprocessable" },
  { code: 429, label: "Too Many" },
  { code: 500, label: "Server Error" },
  { code: 502, label: "Bad Gateway" },
  { code: 503, label: "Unavailable" },
  { code: 504, label: "Timeout" },
];

const CONTENT_TYPES = ["application/json", "text/plain", "text/html", "application/xml"];

export function MockApiPanel() {
  const [method, setMethod] = usePersistentState<string>("mock.method", "GET");
  const [status, setStatus] = usePersistentState<string>("mock.status", "200");
  const [delay, setDelay] = usePersistentState<number>("mock.delay", 0);
  const [errorRate, setErrorRate] = usePersistentState<number>("mock.errorRate", 0);
  const [drop, setDrop] = useState(false);
  const [customBody, setCustomBody] = useState(false);
  const [body, setBody] = useState('{\n  "id": 7,\n  "status": "active"\n}');
  const [contentType, setContentType] = useState("application/json");
  const [headersText, setHeadersText] = useState("");
  const [result, setResult] = useState<HttpResult | null>(null);
  const [loading, setLoading] = useState(false);

  const statusNum = Number(status);
  const statusValid = Number.isInteger(statusNum) && statusNum >= 100 && statusNum <= 599;
  const headerPairs = useMemo(() => parseHeaderLines(headersText), [headersText]);

  const path = useMemo(() => {
    const p = new URLSearchParams();
    p.set("status", status || "200");
    if (delay > 0) p.set("delay", String(delay));
    if (errorRate > 0) p.set("errorRate", String(errorRate));
    if (drop) p.set("drop", "1");
    if (customBody) {
      p.set("body", body);
      if (contentType !== "application/json") p.set("contentType", contentType);
    }
    if (headerPairs.length) p.set("headers", JSON.stringify(Object.fromEntries(headerPairs)));
    return `/api/mock?${p}`;
  }, [status, delay, errorRate, drop, customBody, body, contentType, headerPairs]);

  const fullUrl = `${window.location.origin}${path}`;
  const curl = toCurl({ method, url: fullUrl, headers: [] });

  const send = async () => {
    setLoading(true);
    setResult(null);
    setResult(await sendRequest(path, { method }));
    setLoading(false);
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Код ответа</Label>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_PRESETS.map((s) => (
            <Button
              key={s.code}
              variant={status === String(s.code) ? "default" : "outline"}
              size="sm"
              className="h-8 gap-1.5 font-mono"
              onClick={() => setStatus(String(s.code))}
              data-testid={`button-status-${s.code}`}
            >
              {s.code}
              <span className="font-sans text-xs opacity-70">{s.label}</span>
            </Button>
          ))}
          <Input
            value={status}
            onChange={(e) => setStatus(e.target.value.replace(/\D/g, "").slice(0, 3))}
            className={`h-8 w-20 font-mono ${statusValid ? "" : "border-destructive"}`}
            aria-label="Свой код ответа"
            placeholder="418"
            data-testid="input-mock-status"
          />
        </div>
        {!statusValid && <p className="text-xs text-destructive">Код должен быть от 100 до 599</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Метод</Label>
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger data-testid="select-mock-method">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {METHODS.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="mock-delay">Задержка, мс</Label>
          <Input
            id="mock-delay"
            type="number"
            min={0}
            max={30000}
            step={100}
            value={delay}
            onChange={(e) => setDelay(Math.min(30000, Math.max(0, Number(e.target.value))))}
            data-testid="input-mock-delay"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mock-error-rate">Случайные ошибки 500, %</Label>
          <Input
            id="mock-error-rate"
            type="number"
            min={0}
            max={100}
            value={errorRate}
            onChange={(e) => setErrorRate(Math.min(100, Math.max(0, Number(e.target.value))))}
            data-testid="input-mock-error-rate"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-3">
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={customBody} onCheckedChange={setCustomBody} data-testid="switch-mock-body" />
          Своё тело ответа
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={drop} onCheckedChange={setDrop} data-testid="switch-mock-drop" />
          Оборвать соединение без ответа
        </label>
      </div>

      {customBody && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="mock-body">Тело ответа</Label>
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger className="h-8 w-48 font-mono text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_TYPES.map((c) => (
                  <SelectItem key={c} value={c} className="font-mono text-xs">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Textarea
            id="mock-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="min-h-28 font-mono text-sm"
            spellCheck={false}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="mock-headers">Заголовки ответа</Label>
        <Textarea
          id="mock-headers"
          value={headersText}
          onChange={(e) => setHeadersText(e.target.value)}
          placeholder={"Retry-After: 30\nX-Request-Id: 8f14e45f"}
          className="min-h-16 font-mono text-sm"
          spellCheck={false}
        />
        <p className="text-xs text-muted-foreground">По одному на строку, в формате «Имя: значение»</p>
      </div>

      <div className="space-y-2 rounded-md border bg-muted/40 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">Эндпоинт для вашего приложения</span>
          <div className="flex gap-1">
            <CopyButton text={fullUrl} variant="ghost" size="sm" label="URL" />
            <CopyButton text={curl} variant="ghost" size="sm" label="curl" />
          </div>
        </div>
        <code className="block break-all text-xs font-mono" data-testid="text-mock-url">
          <span className="text-primary">{method}</span> {fullUrl}
        </code>
        <p className="text-xs text-muted-foreground">Эндпоинт принимает любой метод — метод выше влияет только на кнопку «Отправить» и curl.</p>
      </div>

      <Button onClick={send} disabled={loading || !statusValid} data-testid="button-call-mock">
        <Send className="w-4 h-4 mr-1" /> {loading ? "Жду ответ…" : "Отправить запрос"}
      </Button>

      {result && (
        <ResponseView
          result={result}
          errorHint={drop ? "Сервер оборвал соединение — как и было задано." : undefined}
        />
      )}
    </div>
  );
}
