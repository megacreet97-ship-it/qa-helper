import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/copy-button";
import { ResultDisplay } from "@/components/result-display";
import {
  generateText, generateLorem, generateUnicodeText,
  sqlInjectionPayloads, xssPayloads,
  type TextType,
} from "@/lib/generators";
import { Dices, AlignLeft, Globe, Code, ShieldAlert } from "lucide-react";

export default function TextGeneratorsPage() {
  const [textResult, setTextResult] = useState("");
  const [textLengthStr, setTextLengthStr] = useState("100");
  const [textType, setTextType] = useState<TextType>("meaningful_ru");

  const [loremResult, setLoremResult] = useState("");
  const [loremLang, setLoremLang] = useState<"ru" | "en">("en");
  const [loremParagraphsStr, setLoremParagraphsStr] = useState("3");

  const [unicodeResult, setUnicodeResult] = useState("");
  const [unicodeLengthStr, setUnicodeLengthStr] = useState("50");

  const [sqlResults, setSqlResults] = useState<string[]>([]);
  const [xssResults, setXssResults] = useState<string[]>([]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">
          Генераторы текста
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Генерация текстового содержимого для тестирования полей ввода и валидации
        </p>
      </div>

      <Tabs defaultValue="text" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1" data-testid="tabs-text-gen">
          <TabsTrigger value="text" className="gap-1" data-testid="tab-text">
            <AlignLeft className="w-3 h-3" /> По длине
          </TabsTrigger>
          <TabsTrigger value="lorem" className="gap-1" data-testid="tab-lorem">
            <Globe className="w-3 h-3" /> Lorem Ipsum
          </TabsTrigger>
          <TabsTrigger value="unicode" className="gap-1" data-testid="tab-unicode">
            <Globe className="w-3 h-3" /> Unicode
          </TabsTrigger>
          <TabsTrigger value="sql" className="gap-1" data-testid="tab-sql">
            <Code className="w-3 h-3" /> SQL-инъекции
          </TabsTrigger>
          <TabsTrigger value="xss" className="gap-1" data-testid="tab-xss">
            <ShieldAlert className="w-3 h-3" /> XSS-пейлоады
          </TabsTrigger>
        </TabsList>

        <TabsContent value="text">
          <Card>
            <CardHeader className="pb-3">
              <div className="space-y-1">
                <h3 className="text-base font-semibold">Текст по количеству символов</h3>
                <p className="text-xs text-muted-foreground">Генерация текста заданной длины и набора символов</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-2">
                  <Label>Символов</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={textLengthStr}
                    onChange={(e) => setTextLengthStr(e.target.value.replace(/[^0-9]/g, ""))}
                    onBlur={(e) => {
                      const n = parseInt(e.target.value) || 100;
                      setTextLengthStr(String(Math.min(100000, Math.max(1, n))));
                    }}
                    placeholder="100"
                    className="w-32"
                    data-testid="input-text-length"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Тип</Label>
                  <Select value={textType} onValueChange={(v) => setTextType(v as any)}>
                    <SelectTrigger className="w-48" data-testid="select-text-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meaningful_ru">Осмысленный (РУ)</SelectItem>
                      <SelectItem value="meaningful_en">Осмысленный (EN)</SelectItem>
                      <SelectItem value="cyrillic">Кириллица</SelectItem>
                      <SelectItem value="latin">Латиница</SelectItem>
                      <SelectItem value="digits">Цифры</SelectItem>
                      <SelectItem value="special">Спецсимволы</SelectItem>
                      <SelectItem value="mixed">Смешанный</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => {
                    const n = Math.min(100000, Math.max(1, parseInt(textLengthStr) || 100));
                    setTextLengthStr(String(n));
                    setTextResult(generateText(n, textType));
                  }}
                  data-testid="button-generate-text"
                >
                  <Dices className="w-4 h-4 mr-1" /> Сгенерировать
                </Button>
              </div>
              {textResult && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      {textResult.length} символов
                    </span>
                    <CopyButton text={textResult} variant="outline" size="sm" />
                  </div>
                  <Textarea
                    readOnly
                    value={textResult}
                    className="font-mono text-sm min-h-32"
                    data-testid="textarea-text-result"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lorem">
          <Card>
            <CardHeader className="pb-3">
              <div className="space-y-1">
                <h3 className="text-base font-semibold">Lorem Ipsum</h3>
                <p className="text-xs text-muted-foreground">Текст-заполнитель на русском или английском</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-2">
                  <Label>Абзацев</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={loremParagraphsStr}
                    onChange={(e) => setLoremParagraphsStr(e.target.value.replace(/[^0-9]/g, ""))}
                    onBlur={(e) => {
                      const n = parseInt(e.target.value) || 3;
                      setLoremParagraphsStr(String(Math.min(20, Math.max(1, n))));
                    }}
                    placeholder="3"
                    className="w-24"
                    data-testid="input-lorem-paragraphs"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Язык</Label>
                  <Select value={loremLang} onValueChange={(v) => setLoremLang(v as any)}>
                    <SelectTrigger className="w-36" data-testid="select-lorem-lang">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">Английский</SelectItem>
                      <SelectItem value="ru">Русский</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => {
                    const n = Math.min(20, Math.max(1, parseInt(loremParagraphsStr) || 3));
                    setLoremParagraphsStr(String(n));
                    setLoremResult(generateLorem(loremLang, n));
                  }}
                  data-testid="button-generate-lorem"
                >
                  <Dices className="w-4 h-4 mr-1" /> Сгенерировать
                </Button>
              </div>
              {loremResult && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      {loremResult.length} символов
                    </span>
                    <CopyButton text={loremResult} variant="outline" size="sm" />
                  </div>
                  <Textarea
                    readOnly
                    value={loremResult}
                    className="text-sm min-h-48"
                    data-testid="textarea-lorem-result"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unicode">
          <Card>
            <CardHeader className="pb-3">
              <div className="space-y-1">
                <h3 className="text-base font-semibold">Unicode-текст</h3>
                <p className="text-xs text-muted-foreground">Проверка обработки Unicode-символов</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-2">
                  <Label>Длина</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={unicodeLengthStr}
                    onChange={(e) => setUnicodeLengthStr(e.target.value.replace(/[^0-9]/g, ""))}
                    onBlur={(e) => {
                      const n = parseInt(e.target.value) || 50;
                      setUnicodeLengthStr(String(Math.min(1000, Math.max(1, n))));
                    }}
                    placeholder="50"
                    className="w-24"
                    data-testid="input-unicode-length"
                  />
                </div>
                <Button
                  onClick={() => {
                    const n = Math.min(1000, Math.max(1, parseInt(unicodeLengthStr) || 50));
                    setUnicodeLengthStr(String(n));
                    setUnicodeResult(generateUnicodeText(n));
                  }}
                  data-testid="button-generate-unicode"
                >
                  <Dices className="w-4 h-4 mr-1" /> Сгенерировать
                </Button>
              </div>
              {unicodeResult && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      {unicodeResult.length} символов
                    </span>
                    <CopyButton text={unicodeResult} variant="outline" size="sm" />
                  </div>
                  <Textarea
                    readOnly
                    value={unicodeResult}
                    className="text-2xl min-h-32"
                    data-testid="textarea-unicode-result"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sql">
          <Card>
            <CardHeader className="pb-3">
              <div className="space-y-1">
                <h3 className="text-base font-semibold">SQL-инъекции</h3>
                <p className="text-xs text-muted-foreground">Типичные строки для тестирования SQL-инъекций</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => setSqlResults([...sqlInjectionPayloads])}
                data-testid="button-show-sql"
              >
                <ShieldAlert className="w-4 h-4 mr-1" /> Показать все пейлоады
              </Button>
              <ResultDisplay results={sqlResults} title="SQL-инъекции" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="xss">
          <Card>
            <CardHeader className="pb-3">
              <div className="space-y-1">
                <h3 className="text-base font-semibold">XSS-пейлоады</h3>
                <p className="text-xs text-muted-foreground">Тестовые векторы межсайтового скриптинга</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => setXssResults([...xssPayloads])}
                data-testid="button-show-xss"
              >
                <ShieldAlert className="w-4 h-4 mr-1" /> Показать все пейлоады
              </Button>
              <ResultDisplay results={xssResults} title="XSS-пейлоады" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
