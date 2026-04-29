import { useState, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Code2, Trash2, ArrowRightLeft, Upload, Globe, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DiffItem {
  section: string;
  type: "missing" | "extra" | "different" | "text" | "style" | "attribute";
  selector: string;
  expected: string;
  actual: string;
  severity: "error" | "warning" | "info";
}

interface CompareResult {
  score: number;
  totalDiffs: number;
  diffs: DiffItem[];
  responsiveHints: string[];
}

function parseHTML(html: string): Document {
  const parser = new DOMParser();
  return parser.parseFromString(html, "text/html");
}

function getSelector(el: Element, root: Element): string {
  const parts: string[] = [];
  let current: Element | null = el;
  while (current && current !== root && current !== root.ownerDocument?.documentElement) {
    let part = current.tagName.toLowerCase();
    if (current.id) {
      part += `#${current.id}`;
    } else if (current.className && typeof current.className === "string") {
      const cls = current.className.trim().split(/\s+/).slice(0, 2).join(".");
      if (cls) part += `.${cls}`;
    }
    parts.unshift(part);
    current = current.parentElement;
  }
  return parts.join(" > ") || "root";
}

function parseStyleAttr(style: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!style) return result;
  style.split(";").forEach((rule) => {
    const [prop, ...valParts] = rule.split(":");
    if (prop && valParts.length) {
      result[prop.trim().toLowerCase()] = valParts.join(":").trim();
    }
  });
  return result;
}

function getDirectText(el: Element): string {
  let text = "";
  for (let i = 0; i < el.childNodes.length; i++) {
    const node = el.childNodes[i];
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent || "";
    }
  }
  return text.trim();
}

function findResponsiveClasses(html: string): string[] {
  const hints: string[] = [];
  const patterns: [RegExp, string][] = [
    [/\bcol-(?:xs|sm|md|lg|xl)-\d+/g, "Сетка Bootstrap (col-*)"],
    [/\b(?:sm|md|lg|xl|2xl):/g, "Адаптивные классы Tailwind (sm:/md:/lg:)"],
    [/\bd-(?:sm|md|lg|xl)-/g, "Отображение Bootstrap (d-*-)"],
    [/\bhidden-(?:xs|sm|md|lg|xl)/g, "Скрытие Bootstrap (hidden-*)"],
    [/\bvisible-(?:xs|sm|md|lg|xl)/g, "Видимость Bootstrap (visible-*)"],
    [/\bcontainer(?:-fluid)?\b/g, "Контейнер (container)"],
    [/\brow\b/g, "Строка сетки (row)"],
  ];

  const found = new Set<string>();
  for (const [regex, label] of patterns) {
    if (regex.test(html)) {
      found.add(label);
    }
  }
  if (found.size > 0) {
    hints.push("Обнаружены адаптивные классы: " + Array.from(found).join(", "));
  } else {
    hints.push("Адаптивные классы не обнаружены");
  }
  return hints;
}

interface NodeSignature {
  tag: string;
  path: string;
  id: string;
  classes: string[];
  text: string;
  attrs: Record<string, string>;
  styles: Record<string, string>;
  childTags: string[];
}

function buildSignatures(root: Element, rootLabel: string): NodeSignature[] {
  const sigs: NodeSignature[] = [];
  function walk(el: Element, path: string) {
    const tag = el.tagName.toLowerCase();
    if (tag === "script" || tag === "style" || tag === "link" || tag === "meta" || tag === "noscript") return;

    const id = el.getAttribute("id") || "";
    const cls = (typeof el.className === "string" ? el.className : "").trim();
    const classes = cls ? cls.split(/\s+/).sort() : [];
    const text = getDirectText(el);
    const attrsToCheck = ["src", "href", "alt", "title", "type", "name", "placeholder", "action", "method"];
    const attrs: Record<string, string> = {};
    for (const a of attrsToCheck) {
      const v = el.getAttribute(a);
      if (v !== null) attrs[a] = v;
    }
    const styles = parseStyleAttr(el.getAttribute("style") || "");

    const childTags: string[] = [];
    for (let i = 0; i < el.children.length; i++) {
      const childTag = el.children[i].tagName.toLowerCase();
      if (childTag !== "script" && childTag !== "style" && childTag !== "link" && childTag !== "meta" && childTag !== "noscript") {
        childTags.push(childTag);
      }
    }

    sigs.push({ tag, path, id, classes, text: text.slice(0, 200), attrs, styles, childTags });

    let childIndex = 0;
    for (let i = 0; i < el.children.length; i++) {
      const child = el.children[i];
      const childTagName = child.tagName.toLowerCase();
      if (childTagName === "script" || childTagName === "style" || childTagName === "link" || childTagName === "meta" || childTagName === "noscript") continue;
      walk(child, `${path} > ${childTagName}[${childIndex}]`);
      childIndex++;
    }
  }
  walk(root, rootLabel);
  return sigs;
}

function scorePair(sig: NodeSignature, c: NodeSignature): number {
  if (c.tag !== sig.tag) return 0;
  if (sig.id && c.id && sig.id !== c.id) return 0;

  let score = 1;
  if (sig.id && sig.id === c.id) score += 5;

  if (sig.classes.length > 0 || c.classes.length > 0) {
    const cSet = new Set(c.classes);
    let common = 0;
    for (const cl of sig.classes) { if (cSet.has(cl)) common++; }
    const total = new Set([...sig.classes, ...c.classes]).size;
    score += (common / total) * 3;
  }

  if (sig.text && c.text && sig.text === c.text) score += 3;
  else if (sig.text && c.text) {
    const shorter = sig.text.length < c.text.length ? sig.text : c.text;
    const longer = sig.text.length >= c.text.length ? sig.text : c.text;
    if (longer.includes(shorter)) score += 1.5;
  }

  if (sig.path === c.path) score += 2;

  if (sig.childTags.length > 0 || c.childTags.length > 0) {
    const sigChildStr = sig.childTags.join(",");
    const cChildStr = c.childTags.join(",");
    if (sigChildStr === cChildStr) score += 2;
  }

  return score;
}

function compareHTML(referenceHTML: string, landingHTML: string): CompareResult {
  const diffs: DiffItem[] = [];

  const refDoc = parseHTML(referenceHTML);
  const landDoc = parseHTML(landingHTML);

  const refBody = refDoc.body;
  const landBody = landDoc.body;

  const refSigs = buildSignatures(refBody, "body");
  const landSigs = buildSignatures(landBody, "body");

  const refTagCount: Record<string, number> = {};
  const landTagCount: Record<string, number> = {};
  refSigs.forEach(s => (refTagCount[s.tag] = (refTagCount[s.tag] || 0) + 1));
  landSigs.forEach(s => (landTagCount[s.tag] = (landTagCount[s.tag] || 0) + 1));

  const allTags = Array.from(new Set([...Object.keys(refTagCount), ...Object.keys(landTagCount)]));
  for (const tag of allTags) {
    const rc = refTagCount[tag] || 0;
    const lc = landTagCount[tag] || 0;
    if (rc > 0 && lc === 0) {
      diffs.push({ section: "Структура DOM", type: "missing", selector: `<${tag}>`, expected: `${rc} шт.`, actual: "Отсутствует", severity: "error" });
    } else if (rc === 0 && lc > 0) {
      diffs.push({ section: "Структура DOM", type: "extra", selector: `<${tag}>`, expected: "Отсутствует", actual: `${lc} шт.`, severity: "warning" });
    } else if (rc !== lc) {
      diffs.push({ section: "Структура DOM", type: "different", selector: `<${tag}>`, expected: `${rc} шт.`, actual: `${lc} шт.`, severity: "warning" });
    }
  }

  const tagBuckets: Record<string, { sig: NodeSignature; idx: number }[]> = {};
  for (let i = 0; i < landSigs.length; i++) {
    const tag = landSigs[i].tag;
    if (!tagBuckets[tag]) tagBuckets[tag] = [];
    tagBuckets[tag].push({ sig: landSigs[i], idx: i });
  }

  const landUsed = new Set<number>();
  let matchedCount = 0;
  let totalCompared = 0;
  let attrMatches = 0;
  let attrTotal = 0;
  let textMatches = 0;
  let textTotal = 0;

  const maxDetailDiffs = 200;

  for (const refSig of refSigs) {
    const bucket = tagBuckets[refSig.tag];
    if (!bucket) {
      totalCompared++;
      if (diffs.length < maxDetailDiffs) {
        const label = refSig.id ? `<${refSig.tag}#${refSig.id}>` : refSig.classes.length > 0 ? `<${refSig.tag}.${refSig.classes.slice(0, 2).join(".")}>` : `<${refSig.tag}>`;
        diffs.push({ section: "Отсутствующие элементы", type: "missing", selector: refSig.path, expected: label, actual: "Не найден в лендинге", severity: "error" });
      }
      continue;
    }

    let bestScore = 0;
    let bestBucketIdx = -1;
    for (let bi = 0; bi < bucket.length; bi++) {
      if (landUsed.has(bucket[bi].idx)) continue;
      const s = scorePair(refSig, bucket[bi].sig);
      if (s > bestScore) {
        bestScore = s;
        bestBucketIdx = bi;
      }
    }

    if (bestBucketIdx === -1 || bestScore < 1.5) {
      totalCompared++;
      if (diffs.length < maxDetailDiffs) {
        const label = refSig.id ? `<${refSig.tag}#${refSig.id}>` : refSig.classes.length > 0 ? `<${refSig.tag}.${refSig.classes.slice(0, 2).join(".")}>` : `<${refSig.tag}>`;
        diffs.push({ section: "Отсутствующие элементы", type: "missing", selector: refSig.path, expected: label, actual: "Не найден в лендинге", severity: "error" });
      }
      continue;
    }

    const match = bucket[bestBucketIdx].sig;
    landUsed.add(bucket[bestBucketIdx].idx);
    totalCompared++;
    matchedCount++;

    const selectorLabel = refSig.id ? `${refSig.tag}#${refSig.id}` : refSig.classes.length > 0 ? `${refSig.tag}.${refSig.classes.slice(0, 2).join(".")}` : refSig.path;

    const refClassSet = new Set(refSig.classes);
    const landClassSet = new Set(match.classes);
    const missingClasses = refSig.classes.filter(c => !landClassSet.has(c));
    const extraClasses = match.classes.filter(c => !refClassSet.has(c));
    attrTotal++;
    if (missingClasses.length === 0 && extraClasses.length === 0) {
      attrMatches++;
    } else if (diffs.length < maxDetailDiffs) {
      if (missingClasses.length > 0) {
        diffs.push({ section: "Атрибуты (class)", type: "missing", selector: selectorLabel, expected: missingClasses.slice(0, 5).join(", ") + (missingClasses.length > 5 ? ` (+${missingClasses.length - 5})` : ""), actual: "Отсутствуют в лендинге", severity: "warning" });
      }
      if (extraClasses.length > 0) {
        diffs.push({ section: "Атрибуты (class)", type: "extra", selector: selectorLabel, expected: "—", actual: extraClasses.slice(0, 5).join(", ") + (extraClasses.length > 5 ? ` (+${extraClasses.length - 5})` : ""), severity: "info" });
      }
    }

    const allAttrKeys = new Set([...Object.keys(refSig.attrs), ...Object.keys(match.attrs)]);
    for (const attr of allAttrKeys) {
      const rv = refSig.attrs[attr];
      const lv = match.attrs[attr];
      attrTotal++;
      if (rv === lv) {
        attrMatches++;
      } else if (diffs.length < maxDetailDiffs) {
        if (rv && !lv) {
          diffs.push({ section: "Атрибуты", type: "missing", selector: `${selectorLabel} [${attr}]`, expected: rv.length > 80 ? rv.slice(0, 80) + "…" : rv, actual: "Отсутствует", severity: "error" });
        } else if (!rv && lv) {
          diffs.push({ section: "Атрибуты", type: "extra", selector: `${selectorLabel} [${attr}]`, expected: "—", actual: lv.length > 80 ? lv.slice(0, 80) + "…" : lv, severity: "info" });
        } else if (rv && lv) {
          diffs.push({ section: "Атрибуты", type: "attribute", selector: `${selectorLabel} [${attr}]`, expected: rv.length > 80 ? rv.slice(0, 80) + "…" : rv, actual: lv.length > 80 ? lv.slice(0, 80) + "…" : lv, severity: "warning" });
        }
      }
    }

    const allStyleProps = new Set([...Object.keys(refSig.styles), ...Object.keys(match.styles)]);
    for (const prop of allStyleProps) {
      const rv = refSig.styles[prop];
      const lv = match.styles[prop];
      attrTotal++;
      if (rv === lv) {
        attrMatches++;
      } else if (diffs.length < maxDetailDiffs) {
        if (rv && !lv) {
          diffs.push({ section: "CSS стили", type: "missing", selector: `${selectorLabel} style.${prop}`, expected: rv, actual: "Отсутствует", severity: "warning" });
        } else if (!rv && lv) {
          diffs.push({ section: "CSS стили", type: "extra", selector: `${selectorLabel} style.${prop}`, expected: "—", actual: lv, severity: "info" });
        } else if (rv && lv) {
          diffs.push({ section: "CSS стили", type: "style", selector: `${selectorLabel} style.${prop}`, expected: rv, actual: lv, severity: "warning" });
        }
      }
    }

    if (refSig.text || match.text) {
      textTotal++;
      if (refSig.text === match.text) {
        textMatches++;
      } else if (diffs.length < maxDetailDiffs) {
        if (refSig.text && !match.text) {
          diffs.push({ section: "Текст", type: "missing", selector: selectorLabel, expected: refSig.text.length > 80 ? refSig.text.slice(0, 80) + "…" : refSig.text, actual: "Пусто", severity: "error" });
        } else if (!refSig.text && match.text) {
          diffs.push({ section: "Текст", type: "extra", selector: selectorLabel, expected: "Пусто", actual: match.text.length > 80 ? match.text.slice(0, 80) + "…" : match.text, severity: "info" });
        } else {
          diffs.push({ section: "Текст", type: "text", selector: selectorLabel, expected: refSig.text.length > 80 ? refSig.text.slice(0, 80) + "…" : refSig.text, actual: match.text.length > 80 ? match.text.slice(0, 80) + "…" : match.text, severity: "warning" });
        }
      }
    }
  }

  const unmatchedLand = landSigs.filter((_, i) => !landUsed.has(i));
  for (const sig of unmatchedLand) {
    if (diffs.length < maxDetailDiffs) {
      const label = sig.id ? `<${sig.tag}#${sig.id}>` : sig.classes.length > 0 ? `<${sig.tag}.${sig.classes.slice(0, 2).join(".")}>` : `<${sig.tag}>`;
      diffs.push({ section: "Лишние элементы", type: "extra", selector: sig.path, expected: "—", actual: label, severity: "warning" });
    }
  }

  const structureScore = totalCompared > 0 ? matchedCount / totalCompared : 1;
  const attrScore = attrTotal > 0 ? attrMatches / attrTotal : 1;
  const textScore = textTotal > 0 ? textMatches / textTotal : 1;
  const unmatchedPenalty = unmatchedLand.length / Math.max(1, landSigs.length);
  const rawScore = (structureScore * 0.4 + attrScore * 0.35 + textScore * 0.25) * (1 - unmatchedPenalty * 0.3);
  const score = Math.max(0, Math.min(100, Math.round(rawScore * 100)));

  const responsiveHints = [
    ...findResponsiveClasses(referenceHTML),
    ...findResponsiveClasses(landingHTML).map((h) => `Лендинг: ${h}`),
  ];

  return { score, totalDiffs: diffs.length, diffs, responsiveHints };
}

function severityColor(severity: DiffItem["severity"]) {
  switch (severity) {
    case "error":
      return "text-red-600 dark:text-red-400";
    case "warning":
      return "text-orange-600 dark:text-orange-400";
    case "info":
      return "text-blue-600 dark:text-blue-400";
  }
}

function severityLabel(severity: DiffItem["severity"]) {
  switch (severity) {
    case "error": return "Ошибка";
    case "warning": return "Предупр.";
    case "info": return "Инфо";
  }
}

function typeLabel(type: DiffItem["type"]) {
  switch (type) {
    case "missing": return "Отсутствует";
    case "extra": return "Лишний";
    case "different": return "Различие";
    case "text": return "Текст";
    case "style": return "Стиль";
    case "attribute": return "Атрибут";
  }
}

function scoreColor(score: number) {
  if (score >= 90) return "text-green-600 dark:text-green-400";
  if (score >= 70) return "text-orange-600 dark:text-orange-400";
  return "text-red-600 dark:text-red-400";
}

function scoreBg(score: number) {
  if (score >= 90) return "bg-green-500";
  if (score >= 70) return "bg-orange-500";
  return "bg-red-500";
}

export default function HtmlComparePage() {
  const [referenceHTML, setReferenceHTML] = useState("");
  const [landingHTML, setLandingHTML] = useState("");
  const [landingUrl, setLandingUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const result = useMemo(() => {
    if (!showResult) return null;
    try {
      return compareHTML(referenceHTML, landingHTML);
    } catch {
      return null;
    }
  }, [referenceHTML, landingHTML, showResult]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".html") && !file.name.endsWith(".htm")) {
      toast({
        title: "Неверный формат",
        description: "Выберите файл с расширением .html или .htm",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setReferenceHTML(content);
      setFileName(file.name);
      setShowResult(false);
    };
    reader.readAsText(file, "utf-8");
  };

  const handleFetchUrl = async () => {
    if (!landingUrl.trim()) return;

    let url = landingUrl.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    setLoadingUrl(true);
    try {
      const response = await fetch("/api/fetch-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Ошибка загрузки",
          description: data.message || "Не удалось загрузить страницу",
          variant: "destructive",
        });
        return;
      }

      setLandingHTML(data.html);
      setShowResult(false);
      toast({
        title: "HTML загружен",
        description: `Загружено ${data.html.length.toLocaleString()} символов`,
      });
    } catch {
      toast({
        title: "Ошибка сети",
        description: "Не удалось подключиться к серверу",
        variant: "destructive",
      });
    } finally {
      setLoadingUrl(false);
    }
  };

  const handleSwap = () => {
    const tmp = referenceHTML;
    setReferenceHTML(landingHTML);
    setLandingHTML(tmp);
  };

  const handleClear = () => {
    setReferenceHTML("");
    setLandingHTML("");
    setLandingUrl("");
    setFileName("");
    setShowResult(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const groupedDiffs = useMemo(() => {
    if (!result) return {};
    const groups: Record<string, DiffItem[]> = {};
    for (const d of result.diffs) {
      if (!groups[d.section]) groups[d.section] = [];
      groups[d.section].push(d);
    }
    return groups;
  }, [result]);

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-html-compare-title">
          Сравнение HTML
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Структурное сравнение HTML-эталона и лендинга: теги, атрибуты, стили, текст
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-base font-semibold">Эталон (HTML-файл)</h3>
            </div>
            <p className="text-xs text-muted-foreground">Загрузите .html файл с эталонной вёрсткой</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".html,.htm"
                onChange={handleFileUpload}
                className="hidden"
                data-testid="input-file-upload"
              />
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => fileInputRef.current?.click()}
                data-testid="button-upload-file"
              >
                <Upload className="w-4 h-4" />
                {fileName ? fileName : "Выберите .html файл"}
              </Button>
              {fileName && (
                <p className="text-xs text-muted-foreground" data-testid="text-file-name">
                  Загружен: {fileName}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Или вставьте HTML вручную:</Label>
              <Textarea
                value={referenceHTML}
                onChange={(e) => { setReferenceHTML(e.target.value); setShowResult(false); setFileName(""); }}
                placeholder="Вставьте эталонный HTML..."
                className="font-mono text-sm min-h-36 resize-y"
                data-testid="textarea-reference"
              />
            </div>
            <p className="text-xs text-muted-foreground" data-testid="text-reference-stats">
              {referenceHTML.split("\n").length} строк, {referenceHTML.length.toLocaleString()} символов
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-base font-semibold">Лендинг (URL)</h3>
            </div>
            <p className="text-xs text-muted-foreground">Укажите ссылку на лендинг для загрузки HTML</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={landingUrl}
                  onChange={(e) => setLandingUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="font-mono text-sm"
                  data-testid="input-landing-url"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleFetchUrl();
                  }}
                />
                <Button
                  onClick={handleFetchUrl}
                  disabled={!landingUrl.trim() || loadingUrl}
                  data-testid="button-fetch-url"
                >
                  {loadingUrl ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Globe className="w-4 h-4" />
                  )}
                  <span className="ml-1">Загрузить</span>
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Или вставьте HTML вручную:</Label>
              <Textarea
                value={landingHTML}
                onChange={(e) => { setLandingHTML(e.target.value); setShowResult(false); }}
                placeholder="Вставьте HTML лендинга..."
                className="font-mono text-sm min-h-36 resize-y"
                data-testid="textarea-landing"
              />
            </div>
            <p className="text-xs text-muted-foreground" data-testid="text-landing-stats">
              {landingHTML.split("\n").length} строк, {landingHTML.length.toLocaleString()} символов
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={() => setShowResult(true)}
          disabled={!referenceHTML && !landingHTML}
          data-testid="button-compare"
        >
          <Code2 className="w-4 h-4 mr-1" /> Сравнить
        </Button>
        <Button variant="outline" onClick={handleSwap} data-testid="button-swap">
          <ArrowRightLeft className="w-4 h-4 mr-1" /> Поменять местами
        </Button>
        <Button variant="outline" onClick={handleClear} data-testid="button-clear">
          <Trash2 className="w-4 h-4 mr-1" /> Очистить
        </Button>
      </div>

      {showResult && result && (
        <>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h3 className="text-base font-semibold">Сводка</h3>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm" data-testid="text-match-score">
                    Совпадение:{" "}
                    <span className={`font-bold ${scoreColor(result.score)}`}>{result.score}%</span>
                  </span>
                  <span className="text-sm text-muted-foreground" data-testid="text-total-diffs">
                    Различий: <span className="font-medium">{result.totalDiffs}</span>
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="w-full bg-muted rounded-md h-3 overflow-hidden" data-testid="progress-score">
                <div
                  className={`h-full rounded-md transition-all ${scoreBg(result.score)}`}
                  style={{ width: `${result.score}%` }}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {Object.entries(groupedDiffs).map(([section, items]) => (
                  <Badge key={section} variant="secondary" data-testid={`badge-section-${section}`}>
                    {section}: {items.length}
                  </Badge>
                ))}
              </div>

              {result.responsiveHints.length > 0 && (
                <div className="space-y-1" data-testid="responsive-hints">
                  <p className="text-sm font-medium">Адаптивность:</p>
                  {result.responsiveHints.map((hint, i) => (
                    <p key={i} className="text-xs text-muted-foreground" data-testid={`text-hint-${i}`}>{hint}</p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {result.totalDiffs === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground" data-testid="text-identical">
                  HTML-фрагменты структурно идентичны
                </div>
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedDiffs).map(([section, items]) => (
              <Card key={section}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <h3 className="text-base font-semibold" data-testid={`text-section-title-${section}`}>{section}</h3>
                    <span className="text-sm text-muted-foreground">{items.length} различий</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-md overflow-hidden" data-testid={`diff-table-${section}`}>
                    <div className="grid grid-cols-[80px_1fr_1fr_1fr_80px] text-xs font-medium text-muted-foreground border-b">
                      <div className="px-3 py-2 border-r">Тип</div>
                      <div className="px-3 py-2 border-r">Селектор</div>
                      <div className="px-3 py-2 border-r">Эталон</div>
                      <div className="px-3 py-2 border-r">Лендинг</div>
                      <div className="px-3 py-2">Уровень</div>
                    </div>
                    <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                      {items.map((diff, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-[80px_1fr_1fr_1fr_80px] text-sm font-mono border-b last:border-b-0"
                          data-testid={`diff-row-${section}-${idx}`}
                        >
                          <div className="px-3 py-1.5 border-r text-xs">
                            {typeLabel(diff.type)}
                          </div>
                          <div className="px-3 py-1.5 border-r text-xs break-all">
                            {diff.selector}
                          </div>
                          <div className="px-3 py-1.5 border-r text-xs break-all bg-green-50/30 dark:bg-green-950/10">
                            {diff.expected}
                          </div>
                          <div className="px-3 py-1.5 border-r text-xs break-all bg-red-50/30 dark:bg-red-950/10">
                            {diff.actual}
                          </div>
                          <div className={`px-3 py-1.5 text-xs font-sans ${severityColor(diff.severity)}`}>
                            {severityLabel(diff.severity)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </>
      )}
    </div>
  );
}
