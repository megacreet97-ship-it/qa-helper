import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CopyButton } from "@/components/copy-button";
import { usePersistentState } from "@/hooks/use-persistent-state";
import { useTabParam } from "@/hooks/use-tab-param";
import { CRON_PRESETS, describeCron, nextRuns, parseCron } from "@/lib/cron";
import { AlertTriangle, CalendarClock, Clock } from "lucide-react";

const BROWSER_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

const COMMON_TZ = [
  "UTC",
  "Europe/Kaliningrad",
  "Europe/Moscow",
  "Europe/Samara",
  "Asia/Yekaterinburg",
  "Asia/Omsk",
  "Asia/Novosibirsk",
  "Asia/Krasnoyarsk",
  "Asia/Irkutsk",
  "Asia/Yakutsk",
  "Asia/Vladivostok",
  "Asia/Magadan",
  "Asia/Kamchatka",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Los_Angeles",
  "Asia/Tokyo",
];

const TZ_OPTIONS = Array.from(new Set([BROWSER_TZ, ...COMMON_TZ]));

type Parsed = { date: Date; kind: string } | { error: string } | null;

function parseInput(raw: string): Parsed {
  const s = raw.trim();
  if (!s) return null;

  if (/^-?\d+(\.\d+)?$/.test(s)) {
    const digits = s.replace(/^-/, "").split(".")[0].length;
    const n = Number(s);
    if (digits <= 11) return { date: new Date(n * 1000), kind: "Unix, секунды" };
    if (digits <= 14) return { date: new Date(n), kind: "Unix, миллисекунды" };
    if (digits <= 17) return { date: new Date(n / 1000), kind: "Unix, микросекунды" };
    return { date: new Date(n / 1e6), kind: "Unix, наносекунды" };
  }

  // 28.09.2026 или 28.09.2026 14:30[:15]
  const ru = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:[ ,T]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (ru) {
    const [, d, m, y, hh = "0", mm = "0", ss = "0"] = ru;
    const date = new Date(+y, +m - 1, +d, +hh, +mm, +ss);
    if (date.getDate() !== +d || date.getMonth() !== +m - 1) return { error: "Такой даты не существует" };
    return { date, kind: "Дата (время браузера)" };
  }

  const t = Date.parse(s);
  if (!Number.isNaN(t)) {
    const hasZone = /(z|[+-]\d{2}:?\d{2})$/i.test(s);
    return { date: new Date(t), kind: hasZone ? "Дата с часовым поясом" : "Дата (время браузера)" };
  }
  return { error: "Не удалось распознать. Примеры: 1767225600, 1767225600000, 2026-09-28T14:30:00Z, 28.09.2026 14:30" };
}

function formatInZone(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

function relative(date: Date, now: number): string {
  const diff = (date.getTime() - now) / 1000;
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat("ru", { numeric: "auto" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000], ["month", 2592000], ["week", 604800], ["day", 86400], ["hour", 3600], ["minute", 60], ["second", 1],
  ];
  for (const [unit, sec] of units) {
    if (abs >= sec || unit === "second") return rtf.format(Math.round(diff / sec), unit);
  }
  return "";
}

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <span className="w-40 shrink-0 text-xs text-muted-foreground">{label}</span>
      <code className="flex-1 break-all font-mono text-sm">{value}</code>
      <CopyButton text={value} className="h-7 w-7 shrink-0" />
    </div>
  );
}

function TimestampTool() {
  const now = useNow();
  const [input, setInput] = useState(() => String(Math.floor(Date.now() / 1000)));
  const [tz, setTz] = usePersistentState("time.tz", BROWSER_TZ);
  const parsed = useMemo(() => parseInput(input), [input]);

  const valid = parsed && "date" in parsed && !Number.isNaN(parsed.date.getTime()) ? parsed : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 rounded-md border bg-muted/40 px-3 py-2 text-sm">
        <span className="text-muted-foreground">Сейчас</span>
        <code className="font-mono">{Math.floor(now / 1000)}</code>
        <code className="font-mono text-muted-foreground">{now}</code>
        <span className="font-mono text-muted-foreground">{formatInZone(new Date(now), tz)}</span>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-64 space-y-2">
          <Label htmlFor="ts-input">Timestamp или дата</Label>
          <Input
            id="ts-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="font-mono"
            placeholder="1767225600 или 2026-09-28T14:30:00Z"
            data-testid="input-timestamp"
          />
        </div>
        <Button variant="outline" onClick={() => setInput(String(Math.floor(Date.now() / 1000)))}>
          Сейчас
        </Button>
        <div className="space-y-2">
          <Label>Часовой пояс</Label>
          <Select value={tz} onValueChange={setTz}>
            <SelectTrigger className="w-56" data-testid="select-timezone">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TZ_OPTIONS.map((z) => (
                <SelectItem key={z} value={z}>
                  {z === BROWSER_TZ ? `${z} (браузер)` : z}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {parsed && "error" in parsed && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3">
          <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
          <p className="text-sm text-destructive">{parsed.error}</p>
        </div>
      )}

      {valid && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Распознано как: <span className="text-foreground">{valid.kind}</span> · {relative(valid.date, now)}
          </p>
          <div className="divide-y rounded-lg border" data-testid="timestamp-results">
            <Row label={`В поясе ${tz}`} value={formatInZone(valid.date, tz)} />
            <Row label="ISO 8601 (UTC)" value={valid.date.toISOString()} />
            <Row label="Unix, секунды" value={String(Math.floor(valid.date.getTime() / 1000))} />
            <Row label="Unix, миллисекунды" value={String(valid.date.getTime())} />
            <Row label="RFC 7231 (HTTP)" value={valid.date.toUTCString()} />
          </div>
        </div>
      )}
    </div>
  );
}

function CronTool() {
  const [expr, setExpr] = usePersistentState("time.cron", "0 9 * * 1-5");
  const [count, setCount] = useState(10);

  const result = useMemo(() => {
    try {
      const s = parseCron(expr);
      return { schedule: s, description: describeCron(s), runs: nextRuns(s, new Date(), count) };
    } catch (e: any) {
      return { error: e.message as string };
    }
  }, [expr, count]);

  const fmt = (d: Date) =>
    d.toLocaleString("ru-RU", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="cron-input">Выражение</Label>
        <Input
          id="cron-input"
          value={expr}
          onChange={(e) => setExpr(e.target.value)}
          className="font-mono text-base"
          spellCheck={false}
          data-testid="input-cron"
        />
        <div className="grid grid-cols-5 gap-1 font-mono text-[11px] text-muted-foreground sm:w-96">
          <span>минута</span><span>час</span><span>день</span><span>месяц</span><span>день нед.</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {CRON_PRESETS.map((p) => (
          <Button key={p.expr} variant="outline" size="sm" className="h-7 text-xs" onClick={() => setExpr(p.expr)}>
            {p.label}
          </Button>
        ))}
      </div>

      {"error" in result ? (
        <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3" data-testid="text-cron-error">
          <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
          <p className="text-sm text-destructive">{result.error}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-base font-medium" data-testid="text-cron-description">{result.description}</p>
          {result.schedule.domRestricted && result.schedule.dowRestricted && (
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Заданы и день месяца, и день недели — cron срабатывает, когда выполнено любое из условий.
            </p>
          )}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Ближайшие запуски <span className="font-normal text-muted-foreground">(время браузера, {BROWSER_TZ})</span></Label>
              <Select value={String(count)} onValueChange={(v) => setCount(Number(v))}>
                <SelectTrigger className="h-8 w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 25].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {result.runs.length ? (
              <ol className="divide-y rounded-lg border" data-testid="list-cron-runs">
                {result.runs.map((d, i) => (
                  <li key={d.getTime()} className="flex gap-3 px-3 py-1.5 font-mono text-sm">
                    <span className="w-5 text-right text-xs text-muted-foreground/60 self-center">{i + 1}</span>
                    {fmt(d)}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                Не сработает ни разу в ближайшие 5 лет — например, 31 февраля не бывает.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TimeToolsPage() {
  const [tab, setTab] = useTabParam("timestamp", ["timestamp", "cron"]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl md:text-[1.75rem] font-semibold leading-tight" data-testid="text-page-title">
          Время и cron
        </h1>
        <p className="text-[15px] text-muted-foreground mt-2 max-w-prose">
          Конвертер Unix timestamp с часовыми поясами и проверка cron-выражений с ближайшими запусками
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="timestamp" className="gap-1" data-testid="tab-timestamp">
            <Clock className="w-3 h-3" /> Timestamp
          </TabsTrigger>
          <TabsTrigger value="cron" className="gap-1" data-testid="tab-cron">
            <CalendarClock className="w-3 h-3" /> Cron
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timestamp">
          <Card>
            <CardHeader className="pb-3">
              <div className="space-y-1">
                <h3 className="text-base font-semibold">Конвертер времени</h3>
                <p className="text-xs text-muted-foreground">Секунды, миллисекунды, микро- и наносекунды определяются по длине числа</p>
              </div>
            </CardHeader>
            <CardContent>
              <TimestampTool />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cron">
          <Card>
            <CardHeader className="pb-3">
              <div className="space-y-1">
                <h3 className="text-base font-semibold">Cron-выражение</h3>
                <p className="text-xs text-muted-foreground">Стандартные 5 полей, имена месяцев и дней (JAN, MON), макросы @daily, @weekly…</p>
              </div>
            </CardHeader>
            <CardContent>
              <CronTool />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
