import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/copy-button";
import { usePersistentState } from "@/hooks/use-persistent-state";
import { generatePairwise, missingPairs, parseParameters, totalCombinations, type Parameter } from "@/lib/pairwise";
import { AlertTriangle, CheckCircle2, Download, Shuffle } from "lucide-react";

const SAMPLE = `Браузер: Chrome, Firefox, Safari, Edge
ОС: Windows, macOS, Linux
Роль: гость, пользователь, админ
Оплата: карта, СБП, наличные
Язык: ru, en`;

function download(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const csvCell = (v: string) => (/[",;\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

function toCsv(params: Parameter[], rows: number[][]) {
  const header = ["№", ...params.map((p) => p.name)].map(csvCell).join(",");
  return "﻿" + [header, ...rows.map((r, i) => [String(i + 1), ...r.map((v, p) => params[p].values[v])].map(csvCell).join(","))].join("\n");
}

function toTsv(params: Parameter[], rows: number[][]) {
  return [params.map((p) => p.name).join("\t"), ...rows.map((r) => r.map((v, p) => params[p].values[v]).join("\t"))].join("\n");
}

function toMarkdown(params: Parameter[], rows: number[][]) {
  const esc = (v: string) => v.replace(/\|/g, "\\|");
  return [
    `| № | ${params.map((p) => esc(p.name)).join(" | ")} |`,
    `|---|${params.map(() => "---").join("|")}|`,
    ...rows.map((r, i) => `| ${i + 1} | ${r.map((v, p) => esc(params[p].values[v])).join(" | ")} |`),
  ].join("\n");
}

export default function PairwisePage() {
  const [input, setInput] = usePersistentState("pairwise.input", SAMPLE);
  const [seed, setSeed] = useState(1);

  const result = useMemo(() => {
    try {
      const params = parseParameters(input);
      if (params.length < 2) return { error: "Нужно хотя бы два параметра" };
      const total = totalCombinations(params);
      const pairs = params.reduce((acc, p, i) => acc + params.slice(i + 1).reduce((s, q) => s + p.values.length * q.values.length, 0), 0);
      const rows = generatePairwise(params, seed);
      return { params, rows, total, pairs, missing: missingPairs(params, rows) };
    } catch (e: any) {
      return { error: e.message as string };
    }
  }, [input, seed]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl md:text-[1.75rem] font-semibold leading-tight" data-testid="text-page-title">
          Pairwise-комбинации
        </h1>
        <p className="text-[15px] text-muted-foreground mt-2 max-w-prose">
          Попарное тестирование: минимальный набор тестов, в котором каждая пара значений любых двух параметров
          встречается хотя бы раз. Большинство дефектов вызывается сочетанием одного-двух параметров.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="space-y-1">
            <h3 className="text-base font-semibold">Параметры</h3>
            <p className="text-xs text-muted-foreground">
              По одному на строку: «Параметр: значение1, значение2, …». Строки с # игнорируются.
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-40 font-mono text-sm"
            spellCheck={false}
            data-testid="textarea-pairwise-input"
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setSeed((s) => s + 1)} data-testid="button-pairwise-shuffle">
              <Shuffle className="w-4 h-4 mr-1" /> Другой вариант
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setInput(SAMPLE)}>
              Пример
            </Button>
          </div>
        </CardContent>
      </Card>

      {"error" in result ? (
        <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3" data-testid="text-pairwise-error">
          <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
          <p className="text-sm text-destructive">{result.error}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-1">
              <p className="text-2xl font-semibold tracking-tight" data-testid="text-pairwise-summary">
                {result.rows.length} <span className="text-base font-normal text-muted-foreground">
                  тестов вместо {result.total.toLocaleString("ru-RU")}
                  {result.total > result.rows.length && ` · −${Math.round((1 - result.rows.length / result.total) * 100)}%`}
                </span>
              </p>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground" data-testid="text-pairwise-coverage">
                {result.missing === 0 ? (
                  <><CheckCircle2 className="w-4 h-4 text-primary" /> Все {result.pairs} пар значений покрыты</>
                ) : (
                  <><AlertTriangle className="w-4 h-4 text-destructive" /> Не покрыто пар: {result.missing}</>
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-1">
              <CopyButton text={toTsv(result.params, result.rows)} variant="outline" size="sm" label="Для Excel" />
              <CopyButton text={toMarkdown(result.params, result.rows)} variant="outline" size="sm" label="Markdown" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => download(toCsv(result.params, result.rows), "pairwise.csv", "text/csv;charset=utf-8")}
                data-testid="button-pairwise-csv"
              >
                <Download className="w-3 h-3 mr-1" /> CSV
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm" data-testid="table-pairwise">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium w-10">№</th>
                  {result.params.map((p) => (
                    <th key={p.name} className="px-3 py-2 font-medium whitespace-nowrap">{p.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {result.rows.map((r, i) => (
                  <tr key={i} className="hover:bg-muted/40">
                    <td className="px-3 py-1.5 font-mono text-xs text-muted-foreground">{i + 1}</td>
                    {r.map((v, p) => (
                      <td key={p} className="px-3 py-1.5 whitespace-nowrap">{result.params[p].values[v]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
