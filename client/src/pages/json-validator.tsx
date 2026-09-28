import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/copy-button";
import { CheckCircle2, XCircle, Braces, Minimize2, AlertTriangle } from "lucide-react";

interface JsonStats {
  depth: number;
  keys: number;
  arrays: number;
  values: number;
}

interface SuspiciousValue {
  path: string;
  type: string;
  value: string;
}

interface ValidationResult {
  valid: boolean;
  error?: string;
  errorLine?: number;
  errorPosition?: number;
}

function getJsonStats(obj: unknown, currentDepth: number = 0): JsonStats {
  const stats: JsonStats = { depth: currentDepth, keys: 0, arrays: 0, values: 0 };

  if (Array.isArray(obj)) {
    stats.arrays += 1;
    for (const item of obj) {
      const child = getJsonStats(item, currentDepth + 1);
      stats.depth = Math.max(stats.depth, child.depth);
      stats.keys += child.keys;
      stats.arrays += child.arrays;
      stats.values += child.values;
    }
  } else if (obj !== null && typeof obj === "object") {
    const entries = Object.entries(obj as Record<string, unknown>);
    stats.keys += entries.length;
    for (const [, val] of entries) {
      const child = getJsonStats(val, currentDepth + 1);
      stats.depth = Math.max(stats.depth, child.depth);
      stats.keys += child.keys;
      stats.arrays += child.arrays;
      stats.values += child.values;
    }
  } else {
    stats.values += 1;
  }

  return stats;
}

function findSuspiciousValues(obj: unknown, path: string = ""): SuspiciousValue[] {
  const results: SuspiciousValue[] = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const dateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/;

  if (Array.isArray(obj)) {
    obj.forEach((item, i) => {
      results.push(...findSuspiciousValues(item, `${path}[${i}]`));
    });
  } else if (obj !== null && typeof obj === "object") {
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      const currentPath = path ? `${path}.${key}` : key;
      results.push(...findSuspiciousValues(val, currentPath));
    }
  } else if (obj === null) {
    results.push({ path, type: "Пустое значение (null)", value: "null" });
  } else if (typeof obj === "string") {
    if (obj === "") {
      results.push({ path, type: "Пустая строка", value: '""' });
    } else if (emailRegex.test(obj)) {
      results.push({ path, type: "Электронная почта", value: obj });
    } else if (dateRegex.test(obj)) {
      results.push({ path, type: "Дата", value: obj });
    }
  }

  return results;
}

function parseJsonError(error: string, input: string): { message: string; line?: number; position?: number } {
  const posMatch = error.match(/position\s+(\d+)/i);
  const colMatch = error.match(/column\s+(\d+)/i);
  const lineMatch = error.match(/line\s+(\d+)/i);

  let line: number | undefined;
  let position: number | undefined;

  if (posMatch) {
    const pos = parseInt(posMatch[1], 10);
    const before = input.substring(0, pos);
    const lines = before.split("\n");
    line = lines.length;
    position = lines[lines.length - 1].length + 1;
  } else if (lineMatch) {
    line = parseInt(lineMatch[1], 10);
    position = colMatch ? parseInt(colMatch[1], 10) : undefined;
  }

  const msgClean = error.replace(/^SyntaxError:\s*/, "");

  return { message: msgClean, line, position };
}

export default function JsonValidatorPage() {
  const [input, setInput] = useState("");
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [formattedOutput, setFormattedOutput] = useState("");

  const validate = () => {
    if (!input.trim()) {
      setValidationResult({ valid: false, error: "Введите JSON для валидации" });
      setFormattedOutput("");
      return;
    }

    try {
      JSON.parse(input);
      setValidationResult({ valid: true });
      setFormattedOutput("");
    } catch (e: any) {
      const parsed = parseJsonError(e.message, input);
      setValidationResult({
        valid: false,
        error: parsed.message,
        errorLine: parsed.line,
        errorPosition: parsed.position,
      });
      setFormattedOutput("");
    }
  };

  const format = () => {
    try {
      const parsed = JSON.parse(input);
      const formatted = JSON.stringify(parsed, null, 2);
      setFormattedOutput(formatted);
      setValidationResult({ valid: true });
    } catch (e: any) {
      const parsed = parseJsonError(e.message, input);
      setValidationResult({
        valid: false,
        error: parsed.message,
        errorLine: parsed.line,
        errorPosition: parsed.position,
      });
    }
  };

  const minify = () => {
    try {
      const parsed = JSON.parse(input);
      const minified = JSON.stringify(parsed);
      setFormattedOutput(minified);
      setValidationResult({ valid: true });
    } catch (e: any) {
      const parsed = parseJsonError(e.message, input);
      setValidationResult({
        valid: false,
        error: parsed.message,
        errorLine: parsed.line,
        errorPosition: parsed.position,
      });
    }
  };

  const stats = useMemo<JsonStats | null>(() => {
    if (!validationResult?.valid) return null;
    try {
      const parsed = JSON.parse(input);
      return getJsonStats(parsed);
    } catch {
      return null;
    }
  }, [validationResult, input]);

  const suspicious = useMemo<SuspiciousValue[]>(() => {
    if (!validationResult?.valid) return [];
    try {
      const parsed = JSON.parse(input);
      return findSuspiciousValues(parsed);
    } catch {
      return [];
    }
  }, [validationResult, input]);

  const inputLines = input.split("\n");

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl md:text-[1.75rem] font-semibold leading-tight" data-testid="text-page-title">
          JSON Валидатор
        </h1>
        <p className="text-[15px] text-muted-foreground mt-2 max-w-prose">
          Проверка синтаксиса JSON, форматирование, минификация и анализ структуры
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="space-y-1">
            <h3 className="text-base font-semibold">Введите JSON</h3>
            <p className="text-xs text-muted-foreground">Вставьте JSON для проверки синтаксиса и анализа</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setValidationResult(null);
              setFormattedOutput("");
            }}
            placeholder='{"ключ": "значение"}'
            className="font-mono text-sm min-h-48 resize-y"
            data-testid="textarea-json-input"
          />
          <p className="text-xs text-muted-foreground" data-testid="text-input-stats">
            {inputLines.length} строк, {input.length} символов
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={validate} disabled={!input.trim()} data-testid="button-validate">
              <Braces className="w-4 h-4 mr-1" /> Валидировать
            </Button>
            <Button variant="outline" onClick={format} disabled={!input.trim()} data-testid="button-format">
              <Braces className="w-4 h-4 mr-1" /> Форматировать
            </Button>
            <Button variant="outline" onClick={minify} disabled={!input.trim()} data-testid="button-minify">
              <Minimize2 className="w-4 h-4 mr-1" /> Минифицировать
            </Button>
          </div>
        </CardContent>
      </Card>

      {validationResult && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h3 className="text-base font-semibold">Результат валидации</h3>
              {validationResult.valid ? (
                <Badge variant="default" className="bg-green-600 dark:bg-green-700" data-testid="badge-valid">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> JSON валиден
                </Badge>
              ) : (
                <Badge variant="destructive" data-testid="badge-invalid">
                  <XCircle className="w-3 h-3 mr-1" /> JSON не валиден
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!validationResult.valid && validationResult.error && (
              <div className="space-y-3">
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md p-4 space-y-2" data-testid="div-error-details">
                  <p className="text-sm font-medium text-red-800 dark:text-red-300" data-testid="text-error-message">
                    {validationResult.error}
                  </p>
                  {(validationResult.errorLine || validationResult.errorPosition) && (
                    <p className="text-xs text-red-600 dark:text-red-400" data-testid="text-error-position">
                      {validationResult.errorLine && `Строка: ${validationResult.errorLine}`}
                      {validationResult.errorLine && validationResult.errorPosition && ", "}
                      {validationResult.errorPosition && `Позиция: ${validationResult.errorPosition}`}
                    </p>
                  )}
                </div>

                {validationResult.errorLine && input.trim() && (
                  <div className="border rounded-md overflow-hidden" data-testid="div-error-highlight">
                    <div className="overflow-x-auto max-h-64 overflow-y-auto">
                      {inputLines.map((line, idx) => {
                        const lineNum = idx + 1;
                        const isErrorLine = lineNum === validationResult.errorLine;
                        return (
                          <div
                            key={idx}
                            className={`flex text-sm font-mono ${isErrorLine ? "bg-red-100 dark:bg-red-950/40" : ""}`}
                            data-testid={`code-line-${lineNum}`}
                          >
                            <span className={`select-none px-3 py-0.5 text-right min-w-[3rem] border-r ${isErrorLine ? "text-red-700 dark:text-red-300 font-bold" : "text-muted-foreground"}`}>
                              {lineNum}
                            </span>
                            <span className={`px-3 py-0.5 whitespace-pre-wrap break-all ${isErrorLine ? "text-red-800 dark:text-red-200" : ""}`}>
                              {line}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {validationResult.valid && stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" data-testid="div-stats">
                <div className="bg-muted rounded-md p-3 text-center">
                  <p className="text-lg font-bold" data-testid="text-stat-depth">{stats.depth}</p>
                  <p className="text-xs text-muted-foreground">Глубина</p>
                </div>
                <div className="bg-muted rounded-md p-3 text-center">
                  <p className="text-lg font-bold" data-testid="text-stat-keys">{stats.keys}</p>
                  <p className="text-xs text-muted-foreground">Ключей</p>
                </div>
                <div className="bg-muted rounded-md p-3 text-center">
                  <p className="text-lg font-bold" data-testid="text-stat-arrays">{stats.arrays}</p>
                  <p className="text-xs text-muted-foreground">Массивов</p>
                </div>
                <div className="bg-muted rounded-md p-3 text-center">
                  <p className="text-lg font-bold" data-testid="text-stat-values">{stats.values}</p>
                  <p className="text-xs text-muted-foreground">Значений</p>
                </div>
              </div>
            )}

            {validationResult.valid && suspicious.length > 0 && (
              <div className="space-y-2" data-testid="div-suspicious">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                  <h4 className="text-sm font-semibold">Подозрительные значения ({suspicious.length})</h4>
                </div>
                <div className="border rounded-md overflow-hidden">
                  <div className="grid grid-cols-3 text-xs font-medium text-muted-foreground border-b">
                    <div className="px-3 py-2">Путь</div>
                    <div className="px-3 py-2">Тип</div>
                    <div className="px-3 py-2">Значение</div>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {suspicious.map((s, idx) => (
                      <div key={idx} className="grid grid-cols-3 text-sm border-b last:border-b-0" data-testid={`suspicious-row-${idx}`}>
                        <div className="px-3 py-1.5 font-mono text-xs break-all">{s.path}</div>
                        <div className="px-3 py-1.5">
                          <Badge variant="secondary" className="text-xs">{s.type}</Badge>
                        </div>
                        <div className="px-3 py-1.5 font-mono text-xs break-all text-muted-foreground">{s.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {formattedOutput && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h3 className="text-base font-semibold">Результат</h3>
              <CopyButton text={formattedOutput} variant="outline" size="sm" />
            </div>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted rounded-md p-4 overflow-x-auto text-sm font-mono max-h-96 overflow-y-auto" data-testid="text-formatted-output">
              {formattedOutput}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
