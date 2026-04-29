import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeftRight, Trash2, Copy, ArrowRightLeft } from "lucide-react";

type DiffType = "equal" | "added" | "removed" | "changed";

interface DiffLine {
  type: DiffType;
  leftLineNum?: number;
  rightLineNum?: number;
  leftText?: string;
  rightText?: string;
  charDiffs?: { left: CharDiff[]; right: CharDiff[] };
}

interface CharDiff {
  text: string;
  type: "equal" | "added" | "removed";
}

function computeLCS(a: string[], b: string[]): boolean[][] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const inLcsA = Array(m).fill(false);
  const inLcsB = Array(n).fill(false);
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      inLcsA[i - 1] = true;
      inLcsB[j - 1] = true;
      i--; j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return [inLcsA, inLcsB];
}

function computeCharDiff(left: string, right: string): { left: CharDiff[]; right: CharDiff[] } {
  const leftChars = Array.from(left);
  const rightChars = Array.from(right);
  const [inLcsL, inLcsR] = computeLCS(leftChars, rightChars);

  const leftDiffs: CharDiff[] = [];
  const rightDiffs: CharDiff[] = [];

  let buf = "";
  let lastType: CharDiff["type"] | null = null;
  for (let i = 0; i < leftChars.length; i++) {
    const t = inLcsL[i] ? "equal" : "removed";
    if (t !== lastType && buf) {
      leftDiffs.push({ text: buf, type: lastType! });
      buf = "";
    }
    buf += leftChars[i];
    lastType = t;
  }
  if (buf) leftDiffs.push({ text: buf, type: lastType! });

  buf = "";
  lastType = null;
  for (let i = 0; i < rightChars.length; i++) {
    const t = inLcsR[i] ? "equal" : "added";
    if (t !== lastType && buf) {
      rightDiffs.push({ text: buf, type: lastType! });
      buf = "";
    }
    buf += rightChars[i];
    lastType = t;
  }
  if (buf) rightDiffs.push({ text: buf, type: lastType! });

  return { left: leftDiffs, right: rightDiffs };
}

function computeDiff(leftText: string, rightText: string, ignoreWhitespace: boolean): DiffLine[] {
  let leftLines = leftText.split("\n");
  let rightLines = rightText.split("\n");

  const compareLines = (a: string, b: string) => {
    if (ignoreWhitespace) {
      return a.trim() === b.trim();
    }
    return a === b;
  };

  const m = leftLines.length;
  const n = rightLines.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (compareLines(leftLines[i - 1], rightLines[j - 1])) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const result: DiffLine[] = [];
  let i = m, j = n;
  const temp: DiffLine[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && compareLines(leftLines[i - 1], rightLines[j - 1])) {
      temp.push({
        type: "equal",
        leftLineNum: i,
        rightLineNum: j,
        leftText: leftLines[i - 1],
        rightText: rightLines[j - 1],
      });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      temp.push({
        type: "added",
        rightLineNum: j,
        rightText: rightLines[j - 1],
      });
      j--;
    } else {
      temp.push({
        type: "removed",
        leftLineNum: i,
        leftText: leftLines[i - 1],
      });
      i--;
    }
  }

  temp.reverse();

  let idx = 0;
  while (idx < temp.length) {
    if (temp[idx].type === "removed" || temp[idx].type === "added") {
      const removedBatch: DiffLine[] = [];
      const addedBatch: DiffLine[] = [];
      while (idx < temp.length && temp[idx].type === "removed") {
        removedBatch.push(temp[idx]);
        idx++;
      }
      while (idx < temp.length && temp[idx].type === "added") {
        addedBatch.push(temp[idx]);
        idx++;
      }

      const maxLen = Math.max(removedBatch.length, addedBatch.length);
      for (let k = 0; k < maxLen; k++) {
        const rem = removedBatch[k];
        const add = addedBatch[k];
        if (rem && add) {
          const charDiffs = computeCharDiff(rem.leftText || "", add.rightText || "");
          result.push({
            type: "changed",
            leftLineNum: rem.leftLineNum,
            rightLineNum: add.rightLineNum,
            leftText: rem.leftText,
            rightText: add.rightText,
            charDiffs,
          });
        } else if (rem) {
          result.push(rem);
        } else if (add) {
          result.push(add);
        }
      }
    } else {
      result.push(temp[idx]);
      idx++;
    }
  }

  return result;
}

function RenderCharDiffs({ diffs, side }: { diffs: CharDiff[]; side: "left" | "right" }) {
  return (
    <span>
      {diffs.map((d, i) => {
        if (d.type === "equal") {
          return <span key={i}>{d.text}</span>;
        }
        const cls = side === "left"
          ? "bg-red-400/40 dark:bg-red-500/50 rounded-sm px-px border-b-2 border-red-500 dark:border-red-400"
          : "bg-green-400/40 dark:bg-green-500/50 rounded-sm px-px border-b-2 border-green-500 dark:border-green-400";
        return <span key={i} className={cls}>{d.text}</span>;
      })}
    </span>
  );
}

function renderWhitespace(text: string): string {
  return text.replace(/ /g, "·").replace(/\t/g, "→\t");
}

export default function TextComparePage() {
  const [leftText, setLeftText] = useState("");
  const [rightText, setRightText] = useState("");
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [showWhitespace, setShowWhitespace] = useState(false);
  const [showDiff, setShowDiff] = useState(false);

  const diffLines = useMemo(() => {
    if (!showDiff) return [];
    return computeDiff(leftText, rightText, ignoreWhitespace);
  }, [leftText, rightText, ignoreWhitespace, showDiff]);

  const diffCount = useMemo(() => {
    let count = 0;
    for (const line of diffLines) {
      if (line.type === "removed") {
        count++;
      } else if (line.type === "added") {
        count++;
      } else if (line.type === "changed" && line.charDiffs) {
        for (const d of line.charDiffs.right) {
          if (d.type !== "equal") count++;
        }
        for (const d of line.charDiffs.left) {
          if (d.type !== "equal") count++;
        }
      } else if (line.type === "changed") {
        count++;
      }
    }
    return count;
  }, [diffLines]);

  const handleSwap = () => {
    const tmp = leftText;
    setLeftText(rightText);
    setRightText(tmp);
  };

  const handleClear = () => {
    setLeftText("");
    setRightText("");
    setShowDiff(false);
  };

  const displayText = (text: string) => showWhitespace ? renderWhitespace(text) : text;

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-compare-title">
          Сравнение текстов
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Сравнение двух текстов с подсветкой различий, отступов и изменений
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-semibold">Введите тексты для сравнения</h3>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="ignore-ws"
                  checked={ignoreWhitespace}
                  onCheckedChange={setIgnoreWhitespace}
                  data-testid="switch-ignore-whitespace"
                />
                <Label htmlFor="ignore-ws" className="text-sm cursor-pointer">Игнорировать пробелы</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="show-ws"
                  checked={showWhitespace}
                  onCheckedChange={setShowWhitespace}
                  data-testid="switch-show-whitespace"
                />
                <Label htmlFor="show-ws" className="text-sm cursor-pointer">Показать пробелы</Label>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Оригинал</Label>
              <Textarea
                value={leftText}
                onChange={(e) => { setLeftText(e.target.value); setShowDiff(false); }}
                placeholder="Вставьте оригинальный текст..."
                className="font-mono text-sm min-h-48 resize-y"
                data-testid="textarea-left"
              />
              <p className="text-xs text-muted-foreground">
                {leftText.split("\n").length} строк, {leftText.length} символов
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Изменённый</Label>
              <Textarea
                value={rightText}
                onChange={(e) => { setRightText(e.target.value); setShowDiff(false); }}
                placeholder="Вставьте изменённый текст..."
                className="font-mono text-sm min-h-48 resize-y"
                data-testid="textarea-right"
              />
              <p className="text-xs text-muted-foreground">
                {rightText.split("\n").length} строк, {rightText.length} символов
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setShowDiff(true)}
              disabled={!leftText && !rightText}
              data-testid="button-compare"
            >
              <ArrowLeftRight className="w-4 h-4 mr-1" /> Сравнить
            </Button>
            <Button variant="outline" onClick={handleSwap} data-testid="button-swap">
              <ArrowRightLeft className="w-4 h-4 mr-1" /> Поменять местами
            </Button>
            <Button variant="outline" onClick={handleClear} data-testid="button-clear">
              <Trash2 className="w-4 h-4 mr-1" /> Очистить
            </Button>
          </div>
        </CardContent>
      </Card>

      {showDiff && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h3 className="text-base font-semibold">Результат сравнения</h3>
              {leftText === rightText ? (
                <span className="text-sm text-muted-foreground" data-testid="text-diff-count">Отличий не найдено</span>
              ) : (
                <span className="text-sm font-medium" data-testid="text-diff-count">
                  Найдено отличий: <span className="text-orange-500 dark:text-orange-400">{diffCount}</span>
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {leftText === rightText ? (
              <div className="text-center py-8 text-muted-foreground" data-testid="text-identical">
                Тексты идентичны
              </div>
            ) : (
              <div className="border rounded-md overflow-hidden" data-testid="diff-result">
                <div className="grid grid-cols-2 text-xs font-medium text-muted-foreground border-b">
                  <div className="px-3 py-2 border-r">Оригинал</div>
                  <div className="px-3 py-2">Изменённый</div>
                </div>
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  {diffLines.map((line, idx) => {
                    if (line.type === "equal") {
                      return (
                        <div key={idx} className="grid grid-cols-2 text-sm font-mono" data-testid={`diff-line-equal-${idx}`}>
                          <div className="px-3 py-0.5 border-r">
                            <span className="whitespace-pre-wrap break-all">{displayText(line.leftText || "")}</span>
                          </div>
                          <div className="px-3 py-0.5">
                            <span className="whitespace-pre-wrap break-all">{displayText(line.rightText || "")}</span>
                          </div>
                        </div>
                      );
                    }

                    if (line.type === "removed") {
                      return (
                        <div key={idx} className="grid grid-cols-2 text-sm font-mono" data-testid={`diff-line-removed-${idx}`}>
                          <div className="px-3 py-0.5 border-r bg-red-100/80 dark:bg-red-950/40">
                            <span className="whitespace-pre-wrap break-all text-red-800 dark:text-red-300">{displayText(line.leftText || "")}</span>
                          </div>
                          <div className="px-3 py-0.5 bg-red-50/40 dark:bg-red-950/10" />
                        </div>
                      );
                    }

                    if (line.type === "added") {
                      return (
                        <div key={idx} className="grid grid-cols-2 text-sm font-mono" data-testid={`diff-line-added-${idx}`}>
                          <div className="px-3 py-0.5 border-r bg-green-50/40 dark:bg-green-950/10" />
                          <div className="px-3 py-0.5 bg-green-100/80 dark:bg-green-950/40">
                            <span className="whitespace-pre-wrap break-all text-green-800 dark:text-green-300">{displayText(line.rightText || "")}</span>
                          </div>
                        </div>
                      );
                    }

                    if (line.type === "changed") {
                      return (
                        <div key={idx} className="grid grid-cols-2 text-sm font-mono" data-testid={`diff-line-changed-${idx}`}>
                          <div className="px-3 py-0.5 border-r bg-orange-50/60 dark:bg-orange-950/20">
                            <span className="whitespace-pre-wrap break-all">
                              {line.charDiffs
                                ? <RenderCharDiffs diffs={line.charDiffs.left} side="left" />
                                : displayText(line.leftText || "")
                              }
                            </span>
                          </div>
                          <div className="px-3 py-0.5 bg-orange-50/60 dark:bg-orange-950/20">
                            <span className="whitespace-pre-wrap break-all">
                              {line.charDiffs
                                ? <RenderCharDiffs diffs={line.charDiffs.right} side="right" />
                                : displayText(line.rightText || "")
                              }
                            </span>
                          </div>
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}