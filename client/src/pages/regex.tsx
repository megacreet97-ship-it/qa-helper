import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CopyButton } from "@/components/copy-button";
import { usePersistentState } from "@/hooks/use-persistent-state";
import { useRegexRunner } from "@/hooks/use-regex-runner";
import type { RegexMatch } from "@/lib/regex.worker";
import { AlertTriangle } from "lucide-react";

const FLAGS: { flag: string; title: string }[] = [
  { flag: "g", title: "g — все совпадения" },
  { flag: "i", title: "i — без учёта регистра" },
  { flag: "m", title: "m — ^ и $ для каждой строки" },
  { flag: "s", title: "s — точка захватывает перевод строки" },
  { flag: "u", title: "u — Unicode" },
  { flag: "y", title: "y — «липкий» поиск с lastIndex" },
];

const PRESETS: { label: string; pattern: string; flags: string; text?: string }[] = [
  { label: "Email", pattern: "[\\w.+-]+@[\\w-]+(?:\\.[\\w-]+)+", flags: "gi" },
  { label: "Телефон РФ", pattern: "(?:\\+7|8)[\\s(-]*\\d{3}[\\s)-]*\\d{3}[\\s-]*\\d{2}[\\s-]*\\d{2}", flags: "g" },
  { label: "UUID", pattern: "[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}", flags: "gi" },
  { label: "IPv4", pattern: "\\b(?:(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\b", flags: "g" },
  { label: "Дата ДД.ММ.ГГГГ", pattern: "(?<day>0[1-9]|[12]\\d|3[01])\\.(?<month>0[1-9]|1[0-2])\\.(?<year>\\d{4})", flags: "g" },
  {
    label: "ReDoS-пример",
    pattern: "^(a+)+$",
    flags: "",
    text: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!",
  },
];

const SAMPLE_TEXT = `Заявка №4471 от 28.09.2026
Клиент: anna.petrova+test@example.com, тел. +7 (912) 345-67-89
Резерв: 8 800 555-35-35, support@qa-helper.ru
Сервер 10.0.12.254, request-id 3f2b8c1e-9d4a-4f6b-8a2e-7c1d5e9f0a3b
Дедлайн: 31.12.2026`;

function Highlighted({ text, matches }: { text: string; matches: RegexMatch[] }) {
  const parts: JSX.Element[] = [];
  let pos = 0;
  matches.forEach((m, i) => {
    if (m.index > pos) parts.push(<span key={`t${i}`}>{text.slice(pos, m.index)}</span>);
    parts.push(
      m.match === "" ? (
        <span key={`m${i}`} className="inline-block w-px h-4 align-middle bg-primary" title={`Пустое совпадение в позиции ${m.index}`} />
      ) : (
        <mark key={`m${i}`} className="rounded-sm bg-primary/20 text-foreground ring-1 ring-primary/30">
          {m.match}
        </mark>
      ),
    );
    pos = Math.max(pos, m.index + m.match.length);
  });
  if (pos < text.length) parts.push(<span key="tail">{text.slice(pos)}</span>);
  return <>{parts}</>;
}

export default function RegexPage() {
  const [pattern, setPattern] = usePersistentState("regex.pattern", PRESETS[0].pattern);
  const [flags, setFlags] = usePersistentState("regex.flags", "gi");
  const [text, setText] = useState(SAMPLE_TEXT);
  const [replaceOn, setReplaceOn] = useState(false);
  const [replacement, setReplacement] = useState("<$&>");
  const { result, run } = useRegexRunner();

  useEffect(() => {
    if (!pattern) return;
    const id = window.setTimeout(() => run({ pattern, flags, text, replacement: replaceOn ? replacement : null }), 150);
    return () => window.clearTimeout(id);
  }, [pattern, flags, text, replaceOn, replacement, run]);

  const flagList = useMemo(() => flags.split(""), [flags]);
  const literal = `/${pattern}/${flags}`;
  const hasNamed = result.state === "done" && result.matches.some((m) => m.named);
  const hasGroups = result.state === "done" && result.matches.some((m) => m.groups.length > 0);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl md:text-[1.75rem] font-semibold leading-tight" data-testid="text-page-title">
          Регулярные выражения
        </h1>
        <p className="text-[15px] text-muted-foreground mt-2 max-w-prose">
          Тестер на движке JavaScript. Выполняется в отдельном потоке: если выражение зависнет из-за бэктрекинга, страница не заблокируется.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-5 pt-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="regex-pattern">Выражение</Label>
              <CopyButton text={literal} variant="ghost" size="sm" label="/…/" />
            </div>
            <div className="flex items-center rounded-md border border-input shadow-2xs focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
              <span className="pl-3 font-mono text-muted-foreground">/</span>
              <Input
                id="regex-pattern"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                className="border-0 shadow-none font-mono focus-visible:ring-0 focus-visible:ring-offset-0"
                spellCheck={false}
                data-testid="input-regex-pattern"
              />
              <span className="pr-3 font-mono text-muted-foreground">/{flags}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <ToggleGroup
              type="multiple"
              value={flagList}
              onValueChange={(v) => setFlags(FLAGS.map((f) => f.flag).filter((f) => v.includes(f)).join(""))}
              className="justify-start"
            >
              {FLAGS.map((f) => (
                <ToggleGroupItem key={f.flag} value={f.flag} title={f.title} aria-label={f.title} className="w-9 font-mono" data-testid={`toggle-flag-${f.flag}`}>
                  {f.flag}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <div className="flex flex-wrap gap-1">
              {PRESETS.map((p) => (
                <Button
                  key={p.label}
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    setPattern(p.pattern);
                    setFlags(p.flags);
                    if (p.text) setText(p.text);
                  }}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="regex-text">Текст</Label>
            <Textarea
              id="regex-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-36 font-mono text-sm"
              spellCheck={false}
              data-testid="textarea-regex-text"
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={replaceOn} onCheckedChange={setReplaceOn} data-testid="switch-regex-replace" />
              Замена
            </label>
            {replaceOn && (
              <div className="space-y-1">
                <Input
                  value={replacement}
                  onChange={(e) => setReplacement(e.target.value)}
                  className="font-mono"
                  placeholder="$1, $<name>, $&"
                  data-testid="input-regex-replacement"
                />
                <p className="text-xs text-muted-foreground">$&amp; — всё совпадение, $1 — группа, $&lt;name&gt; — именованная группа</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {result.state === "error" && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3" data-testid="text-regex-error">
          <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
          <p className="text-sm text-destructive">Синтаксическая ошибка: {result.error}</p>
        </div>
      )}

      {result.state === "timeout" && (
        <div className="space-y-1 rounded-md border border-amber-500/50 bg-amber-500/10 p-3" data-testid="text-regex-timeout">
          <p className="text-sm font-medium">Выполнение прервано через {result.ms / 1000} с</p>
          <p className="text-sm text-muted-foreground">
            Похоже на катастрофический бэктрекинг (ReDoS): вложенные квантификаторы вроде (a+)+ на неподходящей строке
            перебирают экспоненциальное число вариантов. На сервере такое выражение может положить сервис.
          </p>
        </div>
      )}

      {result.state === "done" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium" data-testid="text-regex-count">
              {result.matches.length === 0
                ? "Совпадений нет"
                : `Совпадений: ${result.matches.length}${result.truncated ? "+ (показаны первые 1000)" : ""}`}
            </span>
            <span className="font-mono text-xs text-muted-foreground">{result.ms} мс</span>
          </div>

          <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted p-4 text-sm font-mono leading-relaxed" data-testid="regex-highlight">
            <Highlighted text={text} matches={result.matches} />
          </pre>

          {result.replaced !== null && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>После замены</Label>
                <CopyButton text={result.replaced} variant="outline" size="sm" />
              </div>
              <pre className="max-h-60 overflow-auto whitespace-pre-wrap break-words rounded-md border p-4 text-sm font-mono" data-testid="text-regex-replaced">
                {result.replaced}
              </pre>
            </div>
          )}

          {result.matches.length > 0 && (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium w-10">#</th>
                    <th className="px-3 py-2 font-medium w-20">Позиция</th>
                    <th className="px-3 py-2 font-medium">Совпадение</th>
                    {hasGroups && <th className="px-3 py-2 font-medium">Группы</th>}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {result.matches.slice(0, 200).map((m, i) => (
                    <tr key={i} className="align-top">
                      <td className="px-3 py-1.5 font-mono text-xs text-muted-foreground">{i + 1}</td>
                      <td className="px-3 py-1.5 font-mono text-xs text-muted-foreground">{m.index}</td>
                      <td className="px-3 py-1.5 font-mono break-all">{m.match || <span className="text-muted-foreground">(пусто)</span>}</td>
                      {hasGroups && <td className="px-3 py-1.5 font-mono text-xs break-all">
                        {hasNamed && m.named
                          ? Object.entries(m.named).map(([k, v]) => (
                              <div key={k}><span className="text-muted-foreground">{k}:</span> {v ?? "—"}</div>
                            ))
                          : m.groups.map((g, gi) => (
                              <div key={gi}><span className="text-muted-foreground">${gi + 1}:</span> {g ?? "—"}</div>
                            ))}
                      </td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
