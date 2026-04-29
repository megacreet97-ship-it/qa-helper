import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResultDisplay } from "@/components/result-display";
import {
  generateSNILS, generateFIO, generateBirthDate,
  generatePhone, generateEmail, generateUUID, generateRandomId,
  exportToJSON, exportToCSV,
  type FioComplexity,
} from "@/lib/generators";
import { Dices, User, Phone, Mail, Fingerprint, Calendar } from "lucide-react";

function downloadFile(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function PersonalDataPage() {
  const [snilsResults, setSnilsResults] = useState<string[]>([]);
  const [snilsValid, setSnilsValid] = useState(true);
  const [snilsCount, setSnilsCount] = useState(5);

  const [fioResults, setFioResults] = useState<string[]>([]);
  const [fioGender, setFioGender] = useState<"male" | "female" | "random">("random");
  const [fioCount, setFioCount] = useState(5);
  const [fioComplexity, setFioComplexity] = useState<FioComplexity>("normal");

  const [dateResults, setDateResults] = useState<string[]>([]);
  const [dateBoundary, setDateBoundary] = useState(false);
  const [dateCount, setDateCount] = useState(5);

  const [phoneResults, setPhoneResults] = useState<string[]>([]);
  const [phoneFormat, setPhoneFormat] = useState<"ru" | "international">("ru");
  const [phoneCount, setPhoneCount] = useState(5);

  const [emailResults, setEmailResults] = useState<string[]>([]);
  const [emailValid, setEmailValid] = useState(true);
  const [emailCount, setEmailCount] = useState(5);

  const [idResults, setIdResults] = useState<string[]>([]);
  const [idType, setIdType] = useState<"uuid" | "random">("uuid");
  const [idCount, setIdCount] = useState(5);
  const [idLength, setIdLength] = useState(16);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">
          Генераторы персональных данных
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Генерация тестовых данных для форм, баз данных и API-тестирования
        </p>
      </div>

      <Tabs defaultValue="snils" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1" data-testid="tabs-personal-data">
          <TabsTrigger value="snils" className="gap-1" data-testid="tab-snils">
            <Fingerprint className="w-3 h-3" /> СНИЛС
          </TabsTrigger>
          <TabsTrigger value="fio" className="gap-1" data-testid="tab-fio">
            <User className="w-3 h-3" /> ФИО
          </TabsTrigger>
          <TabsTrigger value="dates" className="gap-1" data-testid="tab-dates">
            <Calendar className="w-3 h-3" /> Даты
          </TabsTrigger>
          <TabsTrigger value="phone" className="gap-1" data-testid="tab-phone">
            <Phone className="w-3 h-3" /> Телефон
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-1" data-testid="tab-email">
            <Mail className="w-3 h-3" /> Email
          </TabsTrigger>
          <TabsTrigger value="ids" className="gap-1" data-testid="tab-ids">
            <Dices className="w-3 h-3" /> UUID / ID
          </TabsTrigger>
        </TabsList>

        <TabsContent value="snils">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
              <div className="space-y-1">
                <h3 className="text-base font-semibold">Генератор СНИЛС</h3>
                <p className="text-xs text-muted-foreground">Страховой номер индивидуального лицевого счёта</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-2">
                  <Label>Количество</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={snilsCount}
                    onChange={(e) => setSnilsCount(Math.min(100, Math.max(1, Number(e.target.value))))}
                    className="w-24"
                    data-testid="input-snils-count"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={snilsValid}
                    onCheckedChange={setSnilsValid}
                    data-testid="switch-snils-valid"
                  />
                  <Label className="text-sm">{snilsValid ? "Валидный" : "Невалидный"}</Label>
                </div>
                <Button
                  onClick={() => setSnilsResults(Array.from({ length: snilsCount }, () => generateSNILS(snilsValid)))}
                  data-testid="button-generate-snils"
                >
                  <Dices className="w-4 h-4 mr-1" /> Сгенерировать
                </Button>
              </div>
              <ResultDisplay
                results={snilsResults}
                title={`СНИЛС (${snilsValid ? "валидные" : "невалидные"})`}
                onExportJSON={() => downloadFile(exportToJSON(snilsResults), "snils.json")}
                onExportCSV={() => downloadFile(exportToCSV(snilsResults, ["SNILS"]), "snils.csv")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fio">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
              <div className="space-y-1">
                <h3 className="text-base font-semibold">Генератор ФИО</h3>
                <p className="text-xs text-muted-foreground">Фамилия Имя Отчество</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-2">
                  <Label>Количество</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={fioCount === 0 ? "" : fioCount}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9]/g, "");
                      setFioCount(v === "" ? 0 : Number(v));
                    }}
                    onBlur={() => setFioCount(n => Math.min(100, Math.max(1, n || 1)))}
                    placeholder="5"
                    className="w-24"
                    data-testid="input-fio-count"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Пол</Label>
                  <Select value={fioGender} onValueChange={(v) => setFioGender(v as any)}>
                    <SelectTrigger className="w-36" data-testid="select-fio-gender">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="random">Случайный</SelectItem>
                      <SelectItem value="male">Мужской</SelectItem>
                      <SelectItem value="female">Женский</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Тип</Label>
                  <Select value={fioComplexity} onValueChange={(v) => setFioComplexity(v as FioComplexity)}>
                    <SelectTrigger className="w-48" data-testid="select-fio-complexity">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Обычное</SelectItem>
                      <SelectItem value="double_surname">Двойная фамилия</SelectItem>
                      <SelectItem value="rare_name">Редкое имя</SelectItem>
                      <SelectItem value="foreign">Иностранное</SelectItem>
                      <SelectItem value="complex">Сложное (двойное + редкое)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => {
                    const count = Math.min(100, Math.max(1, fioCount || 1));
                    setFioCount(count);
                    setFioResults(Array.from({ length: count }, () => generateFIO(fioGender, fioComplexity)));
                  }}
                  data-testid="button-generate-fio"
                >
                  <Dices className="w-4 h-4 mr-1" /> Сгенерировать
                </Button>
              </div>
              <ResultDisplay
                results={fioResults}
                title="ФИО"
                onExportJSON={() => downloadFile(exportToJSON(fioResults), "fio.json")}
                onExportCSV={() => downloadFile(exportToCSV(fioResults, ["FIO"]), "fio.csv")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dates">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
              <div className="space-y-1">
                <h3 className="text-base font-semibold">Генератор дат рождения</h3>
                <p className="text-xs text-muted-foreground">Обычные и граничные значения дат</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-2">
                  <Label>Количество</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={dateCount}
                    onChange={(e) => setDateCount(Math.min(100, Math.max(1, Number(e.target.value))))}
                    className="w-24"
                    data-testid="input-date-count"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={dateBoundary}
                    onCheckedChange={setDateBoundary}
                    data-testid="switch-date-boundary"
                  />
                  <Label className="text-sm">{dateBoundary ? "Граничные" : "Обычные"}</Label>
                </div>
                <Button
                  onClick={() => setDateResults(Array.from({ length: dateCount }, () => generateBirthDate(dateBoundary)))}
                  data-testid="button-generate-dates"
                >
                  <Dices className="w-4 h-4 mr-1" /> Сгенерировать
                </Button>
              </div>
              <ResultDisplay
                results={dateResults}
                title={`Даты (${dateBoundary ? "граничные" : "обычные"})`}
                onExportJSON={() => downloadFile(exportToJSON(dateResults), "dates.json")}
                onExportCSV={() => downloadFile(exportToCSV(dateResults, ["Date"]), "dates.csv")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="phone">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
              <div className="space-y-1">
                <h3 className="text-base font-semibold">Генератор телефонных номеров</h3>
                <p className="text-xs text-muted-foreground">Российские и международные форматы</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-2">
                  <Label>Количество</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={phoneCount}
                    onChange={(e) => setPhoneCount(Math.min(100, Math.max(1, Number(e.target.value))))}
                    className="w-24"
                    data-testid="input-phone-count"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Формат</Label>
                  <Select value={phoneFormat} onValueChange={(v) => setPhoneFormat(v as any)}>
                    <SelectTrigger className="w-44" data-testid="select-phone-format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ru">Российский (+7)</SelectItem>
                      <SelectItem value="international">Международный</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => setPhoneResults(Array.from({ length: phoneCount }, () => generatePhone(phoneFormat)))}
                  data-testid="button-generate-phones"
                >
                  <Dices className="w-4 h-4 mr-1" /> Сгенерировать
                </Button>
              </div>
              <ResultDisplay
                results={phoneResults}
                title="Телефонные номера"
                onExportJSON={() => downloadFile(exportToJSON(phoneResults), "phones.json")}
                onExportCSV={() => downloadFile(exportToCSV(phoneResults, ["Phone"]), "phones.csv")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
              <div className="space-y-1">
                <h3 className="text-base font-semibold">Генератор Email</h3>
                <p className="text-xs text-muted-foreground">Валидные и невалидные email-адреса</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-2">
                  <Label>Количество</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={emailCount}
                    onChange={(e) => setEmailCount(Math.min(100, Math.max(1, Number(e.target.value))))}
                    className="w-24"
                    data-testid="input-email-count"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={emailValid}
                    onCheckedChange={setEmailValid}
                    data-testid="switch-email-valid"
                  />
                  <Label className="text-sm">{emailValid ? "Валидные" : "Невалидные"}</Label>
                </div>
                <Button
                  onClick={() => setEmailResults(Array.from({ length: emailCount }, () => generateEmail(emailValid)))}
                  data-testid="button-generate-emails"
                >
                  <Dices className="w-4 h-4 mr-1" /> Сгенерировать
                </Button>
              </div>
              <ResultDisplay
                results={emailResults}
                title={`Email (${emailValid ? "валидные" : "невалидные"})`}
                onExportJSON={() => downloadFile(exportToJSON(emailResults), "emails.json")}
                onExportCSV={() => downloadFile(exportToCSV(emailResults, ["Email"]), "emails.csv")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ids">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
              <div className="space-y-1">
                <h3 className="text-base font-semibold">Генератор UUID / ID</h3>
                <p className="text-xs text-muted-foreground">Уникальные идентификаторы для тестирования</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-2">
                  <Label>Количество</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={idCount}
                    onChange={(e) => setIdCount(Math.min(100, Math.max(1, Number(e.target.value))))}
                    className="w-24"
                    data-testid="input-id-count"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Тип</Label>
                  <Select value={idType} onValueChange={(v) => setIdType(v as any)}>
                    <SelectTrigger className="w-36" data-testid="select-id-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="uuid">UUID v4</SelectItem>
                      <SelectItem value="random">Случайный ID</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {idType === "random" && (
                  <div className="space-y-2">
                    <Label>Длина</Label>
                    <Input
                      type="number"
                      min={4}
                      max={128}
                      value={idLength}
                      onChange={(e) => setIdLength(Math.min(128, Math.max(4, Number(e.target.value))))}
                      className="w-24"
                      data-testid="input-id-length"
                    />
                  </div>
                )}
                <Button
                  onClick={() => setIdResults(Array.from({ length: idCount }, () => idType === "uuid" ? generateUUID() : generateRandomId(idLength)))}
                  data-testid="button-generate-ids"
                >
                  <Dices className="w-4 h-4 mr-1" /> Сгенерировать
                </Button>
              </div>
              <ResultDisplay
                results={idResults}
                title={idType === "uuid" ? "UUID v4" : `Случайный ID (${idLength} символов)`}
                onExportJSON={() => downloadFile(exportToJSON(idResults), "ids.json")}
                onExportCSV={() => downloadFile(exportToCSV(idResults, ["ID"]), "ids.csv")}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
