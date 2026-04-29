import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/copy-button";
import { generateJSON, generateHTTPHeaders } from "@/lib/generators";
import { Dices, Globe, FileJson, Network } from "lucide-react";

export default function ApiHelpersPage() {
  const [jsonResult, setJsonResult] = useState("");
  const [jsonType, setJsonType] = useState<"valid" | "invalid" | "nested">("valid");

  const [mockStatus, setMockStatus] = useState("200");
  const [mockDelay, setMockDelay] = useState(0);
  const [mockUrl, setMockUrl] = useState("");
  const [mockResult, setMockResult] = useState<{ status: number; body: string; time: number } | null>(null);
  const [mockLoading, setMockLoading] = useState(false);

  const [headerType, setHeaderType] = useState<"authorization" | "cookies" | "custom">("authorization");
  const [headerResult, setHeaderResult] = useState("");

  const statusCodes = [
    { value: "200", label: "200 Успех", color: "bg-green-500/10 text-green-700 dark:text-green-400" },
    { value: "201", label: "201 Создано", color: "bg-green-500/10 text-green-700 dark:text-green-400" },
    { value: "400", label: "400 Ошибка запроса", color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400" },
    { value: "401", label: "401 Не авторизован", color: "bg-orange-500/10 text-orange-700 dark:text-orange-400" },
    { value: "403", label: "403 Запрещено", color: "bg-orange-500/10 text-orange-700 dark:text-orange-400" },
    { value: "404", label: "404 Не найдено", color: "bg-red-500/10 text-red-700 dark:text-red-400" },
    { value: "500", label: "500 Ошибка сервера", color: "bg-red-500/10 text-red-700 dark:text-red-400" },
  ];

  const getRequestUrl = () => {
    if (mockUrl.trim()) {
      return mockUrl.trim();
    }
    const params = new URLSearchParams({
      status: mockStatus,
      delay: String(mockDelay),
    });
    return `/api/mock?${params}`;
  };

  const callMockApi = async () => {
    setMockLoading(true);
    setMockResult(null);
    const start = Date.now();
    try {
      const url = getRequestUrl();
      const res = await fetch(url);
      const body = await res.text();
      setMockResult({
        status: res.status,
        body,
        time: Date.now() - start,
      });
    } catch (err: any) {
      setMockResult({
        status: 0,
        body: err.message,
        time: Date.now() - start,
      });
    } finally {
      setMockLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">
          API-помощники
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Генераторы JSON, моковые API-эндпоинты и конструкторы HTTP-заголовков
        </p>
      </div>

      <Tabs defaultValue="json" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1" data-testid="tabs-api-helpers">
          <TabsTrigger value="json" className="gap-1" data-testid="tab-json">
            <FileJson className="w-3 h-3" /> JSON
          </TabsTrigger>
          <TabsTrigger value="mock" className="gap-1" data-testid="tab-mock">
            <Globe className="w-3 h-3" /> Мок-API
          </TabsTrigger>
          <TabsTrigger value="headers" className="gap-1" data-testid="tab-headers">
            <Network className="w-3 h-3" /> HTTP-заголовки
          </TabsTrigger>
        </TabsList>

        <TabsContent value="json">
          <Card>
            <CardHeader className="pb-3">
              <div className="space-y-1">
                <h3 className="text-base font-semibold">Генератор JSON</h3>
                <p className="text-xs text-muted-foreground">Генерация валидного, невалидного или вложенного JSON</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-2">
                  <Label>Тип</Label>
                  <Select value={jsonType} onValueChange={(v) => setJsonType(v as any)}>
                    <SelectTrigger className="w-40" data-testid="select-json-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="valid">Валидный</SelectItem>
                      <SelectItem value="invalid">Невалидный</SelectItem>
                      <SelectItem value="nested">Вложенный</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => setJsonResult(generateJSON(jsonType))}
                  data-testid="button-generate-json"
                >
                  <Dices className="w-4 h-4 mr-1" /> Сгенерировать
                </Button>
              </div>
              {jsonResult && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary">
                      {jsonType === "valid" ? "Валидный JSON" : jsonType === "invalid" ? "Невалидный JSON" : "Вложенный JSON"}
                    </Badge>
                    <CopyButton text={jsonResult} variant="outline" size="sm" />
                  </div>
                  <pre className="bg-muted rounded-md p-4 overflow-x-auto text-sm font-mono max-h-96" data-testid="text-json-result">
                    {jsonResult}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mock">
          <Card>
            <CardHeader className="pb-3">
              <div className="space-y-1">
                <h3 className="text-base font-semibold">Мок-API эндпоинт</h3>
                <p className="text-xs text-muted-foreground">Тестируйте ваше приложение с разными кодами ответа и задержками</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>Код ответа</Label>
                <div className="flex flex-wrap gap-2">
                  {statusCodes.map((sc) => (
                    <Button
                      key={sc.value}
                      variant={mockStatus === sc.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setMockStatus(sc.value)}
                      data-testid={`button-status-${sc.value}`}
                    >
                      {sc.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Задержка ответа (мс)</Label>
                <Input
                  type="number"
                  min={0}
                  max={30000}
                  value={mockDelay}
                  onChange={(e) => setMockDelay(Math.min(30000, Math.max(0, Number(e.target.value))))}
                  className="w-32"
                  data-testid="input-mock-delay"
                />
              </div>

              <div className="space-y-2">
                <Label>URL запроса</Label>
                <Input
                  value={mockUrl}
                  onChange={(e) => setMockUrl(e.target.value)}
                  placeholder={`/api/mock?status=${mockStatus}&delay=${mockDelay}`}
                  data-testid="input-mock-url"
                />
                <p className="text-xs text-muted-foreground">
                  Оставьте пустым для использования встроенного мок-эндпоинта или укажите свой URL
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button onClick={callMockApi} disabled={mockLoading} data-testid="button-call-mock">
                  <Globe className="w-4 h-4 mr-1" /> {mockLoading ? "Отправка..." : "Отправить запрос"}
                </Button>
                <code className="text-xs text-muted-foreground font-mono">
                  GET {mockUrl.trim() || `/api/mock?status=${mockStatus}&delay=${mockDelay}`}
                </code>
              </div>

              {mockResult && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant={mockResult.status >= 200 && mockResult.status < 300 ? "default" : "destructive"}
                    >
                      Статус: {mockResult.status}
                    </Badge>
                    <Badge variant="secondary">{mockResult.time} мс</Badge>
                  </div>
                  <pre className="bg-muted rounded-md p-4 overflow-x-auto text-sm font-mono max-h-48" data-testid="text-mock-result">
                    {mockResult.body}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="headers">
          <Card>
            <CardHeader className="pb-3">
              <div className="space-y-1">
                <h3 className="text-base font-semibold">Генератор HTTP-заголовков</h3>
                <p className="text-xs text-muted-foreground">Генерация заголовков Authorization, Cookie и пользовательских</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-2">
                  <Label>Тип</Label>
                  <Select value={headerType} onValueChange={(v) => setHeaderType(v as any)}>
                    <SelectTrigger className="w-44" data-testid="select-header-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="authorization">Authorization</SelectItem>
                      <SelectItem value="cookies">Cookies</SelectItem>
                      <SelectItem value="custom">Пользовательские</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => setHeaderResult(generateHTTPHeaders(headerType))}
                  data-testid="button-generate-headers"
                >
                  <Dices className="w-4 h-4 mr-1" /> Сгенерировать
                </Button>
              </div>
              {headerResult && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary">{headerType}</Badge>
                    <CopyButton text={headerResult} variant="outline" size="sm" />
                  </div>
                  <pre className="bg-muted rounded-md p-4 overflow-x-auto text-sm font-mono" data-testid="text-header-result">
                    {headerResult}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
