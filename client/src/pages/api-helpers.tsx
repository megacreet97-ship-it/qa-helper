import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/copy-button";
import { generateJSON, generateHTTPHeaders } from "@/lib/generators";
import { MockApiPanel } from "@/components/api/mock-api-panel";
import { EchoPanel } from "@/components/api/echo-panel";
import { CurlConverter } from "@/components/api/curl-converter";
import { Dices, Globe, FileJson, Network, Radio, Terminal } from "lucide-react";
import { usePersistentState } from "@/hooks/use-persistent-state";
import { useTabParam } from "@/hooks/use-tab-param";

export default function ApiHelpersPage() {
  const [tab, setTab] = useTabParam("json", ["json", "mock", "echo", "curl", "headers"]);
  const [jsonResult, setJsonResult] = useState("");
  const [jsonType, setJsonType] = usePersistentState<"valid" | "invalid" | "nested">("api-helpers.jsonType", "valid");

  const [headerType, setHeaderType] = usePersistentState<"authorization" | "cookies" | "custom">("api-helpers.headerType", "authorization");
  const [headerResult, setHeaderResult] = useState("");

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl md:text-[1.75rem] font-semibold leading-tight" data-testid="text-page-title">
          API-помощники
        </h1>
        <p className="text-[15px] text-muted-foreground mt-2 max-w-prose">
          JSON, моковые эндпоинты, эхо-сервер, конвертер curl и HTTP-заголовки
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1" data-testid="tabs-api-helpers">
          <TabsTrigger value="json" className="gap-1" data-testid="tab-json">
            <FileJson className="w-3 h-3" /> JSON
          </TabsTrigger>
          <TabsTrigger value="mock" className="gap-1" data-testid="tab-mock">
            <Globe className="w-3 h-3" /> Мок-API
          </TabsTrigger>
          <TabsTrigger value="echo" className="gap-1" data-testid="tab-echo">
            <Radio className="w-3 h-3" /> Эхо / HTTP
          </TabsTrigger>
          <TabsTrigger value="curl" className="gap-1" data-testid="tab-curl">
            <Terminal className="w-3 h-3" /> curl
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
                <p className="text-xs text-muted-foreground">
                  Любой код ответа, задержка, случайные сбои, обрыв соединения, своё тело и заголовки
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <MockApiPanel />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="echo">
          <Card>
            <CardHeader className="pb-3">
              <div className="space-y-1">
                <h3 className="text-base font-semibold">Эхо и HTTP-клиент</h3>
                <p className="text-xs text-muted-foreground">
                  Посмотрите, что на самом деле уходит от клиента: метод, заголовки, тело
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <EchoPanel />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="curl">
          <Card>
            <CardHeader className="pb-3">
              <div className="space-y-1">
                <h3 className="text-base font-semibold">Конвертер curl</h3>
                <p className="text-xs text-muted-foreground">
                  curl → fetch, axios, Python requests и коллекция Postman — и обратно
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <CurlConverter />
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
