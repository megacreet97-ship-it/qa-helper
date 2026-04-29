import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/copy-button";
import { ResultDisplay } from "@/components/result-display";
import {
  sqlInjectionPayloads, xssPayloads,
  pathTraversalPayloads, nullEmptyPayloads,
  generateLongString,
} from "@/lib/generators";
import { ShieldAlert, Code, Route, CircleSlash, TextCursorInput, Dices } from "lucide-react";

export default function SecurityHelpersPage() {
  const [sqlResults, setSqlResults] = useState<string[]>([]);
  const [xssResults, setXssResults] = useState<string[]>([]);
  const [pathResults, setPathResults] = useState<string[]>([]);
  const [nullResults, setNullResults] = useState<string[]>([]);

  const [longStringLength, setLongStringLength] = useState(10000);
  const [longStringResult, setLongStringResult] = useState("");

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">
          Безопасность / Негативное тестирование
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Пейлоады и тестовые векторы для проверки безопасности и негативного тестирования
        </p>
      </div>

      <Tabs defaultValue="sql" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1" data-testid="tabs-security">
          <TabsTrigger value="sql" className="gap-1" data-testid="tab-sec-sql">
            <Code className="w-3 h-3" /> SQL-инъекции
          </TabsTrigger>
          <TabsTrigger value="xss" className="gap-1" data-testid="tab-sec-xss">
            <ShieldAlert className="w-3 h-3" /> XSS
          </TabsTrigger>
          <TabsTrigger value="path" className="gap-1" data-testid="tab-sec-path">
            <Route className="w-3 h-3" /> Обход путей
          </TabsTrigger>
          <TabsTrigger value="null" className="gap-1" data-testid="tab-sec-null">
            <CircleSlash className="w-3 h-3" /> Пустые значения
          </TabsTrigger>
          <TabsTrigger value="long" className="gap-1" data-testid="tab-sec-long">
            <TextCursorInput className="w-3 h-3" /> Длинные строки
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sql">
          <Card>
            <CardHeader className="pb-3">
              <div className="space-y-1">
                <h3 className="text-base font-semibold">Пейлоады SQL-инъекций</h3>
                <p className="text-xs text-muted-foreground">Типичные тестовые векторы SQL-инъекций для проверки полей ввода</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => setSqlResults([...sqlInjectionPayloads])}
                data-testid="button-show-sec-sql"
              >
                <Dices className="w-4 h-4 mr-1" /> Загрузить все пейлоады ({sqlInjectionPayloads.length})
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
                data-testid="button-show-sec-xss"
              >
                <Dices className="w-4 h-4 mr-1" /> Загрузить все пейлоады ({xssPayloads.length})
              </Button>
              <ResultDisplay results={xssResults} title="XSS-пейлоады" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="path">
          <Card>
            <CardHeader className="pb-3">
              <div className="space-y-1">
                <h3 className="text-base font-semibold">Обход путей (Path Traversal)</h3>
                <p className="text-xs text-muted-foreground">Пейлоады для обхода каталогов</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => setPathResults([...pathTraversalPayloads])}
                data-testid="button-show-sec-path"
              >
                <Dices className="w-4 h-4 mr-1" /> Загрузить все пейлоады ({pathTraversalPayloads.length})
              </Button>
              <ResultDisplay results={pathResults} title="Обход путей" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="null">
          <Card>
            <CardHeader className="pb-3">
              <div className="space-y-1">
                <h3 className="text-base font-semibold">Пустые и граничные значения</h3>
                <p className="text-xs text-muted-foreground">Null, пустые строки и undefined для тестирования</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => setNullResults([...nullEmptyPayloads])}
                data-testid="button-show-sec-null"
              >
                <Dices className="w-4 h-4 mr-1" /> Загрузить все значения ({nullEmptyPayloads.length})
              </Button>
              <ResultDisplay results={nullResults} title="Пустые и граничные значения" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="long">
          <Card>
            <CardHeader className="pb-3">
              <div className="space-y-1">
                <h3 className="text-base font-semibold">Генератор длинных строк</h3>
                <p className="text-xs text-muted-foreground">Генерация строк длиной 10k+ символов</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-2">
                  <Label>Длина (символов)</Label>
                  <Input
                    type="number"
                    min={100}
                    max={1000000}
                    value={longStringLength}
                    onChange={(e) => setLongStringLength(Math.min(1000000, Math.max(100, Number(e.target.value))))}
                    className="w-36"
                    data-testid="input-long-string-length"
                  />
                </div>
                <Button
                  onClick={() => setLongStringResult(generateLongString(longStringLength))}
                  data-testid="button-generate-long-string"
                >
                  <Dices className="w-4 h-4 mr-1" /> Сгенерировать
                </Button>
              </div>
              {longStringResult && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      {longStringResult.length.toLocaleString()} символов
                    </span>
                    <CopyButton text={longStringResult} variant="outline" size="sm" />
                  </div>
                  <Textarea
                    readOnly
                    value={longStringResult.substring(0, 500) + (longStringResult.length > 500 ? "..." : "")}
                    className="font-mono text-sm min-h-24"
                    data-testid="textarea-long-string-result"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
