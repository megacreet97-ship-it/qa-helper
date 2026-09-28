import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Dices } from "lucide-react";
import { usePersistentState } from "@/hooks/use-persistent-state";

function downloadFromApi(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}

export default function FileGeneratorsPage() {
  const [fileType, setFileType] = usePersistentState("file-generators.fileType", "txt");
  const [fileName, setFileName] = usePersistentState("file-generators.fileName", "тестовый_файл");
  const [fileContent, setFileContent] = useState("Пример тестового содержимого для QA-тестирования.\nСтрока 2: дополнительные данные.");
  const [loading, setLoading] = useState(false);

  const [specialType, setSpecialType] = usePersistentState("file-generators.specialType", "long_name");
  const [bigFileSize, setBigFileSize] = usePersistentState("file-generators.bigFileSize", 1);

  const generateFile = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: fileType,
        name: fileName,
        content: fileContent,
      });
      downloadFromApi(`/api/generate/file?${params}`, `${fileName}.${fileType}`);
    } finally {
      setLoading(false);
    }
  };

  const generateSpecialFile = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        variant: specialType,
        sizeMb: String(bigFileSize),
      });
      downloadFromApi(`/api/generate/special-file?${params}`, "special_file");
    } finally {
      setLoading(false);
    }
  };

  const fileTypes = [
    { value: "txt", label: "TXT", desc: "Текстовый файл" },
    { value: "csv", label: "CSV", desc: "Данные через запятую" },
    { value: "pdf", label: "PDF", desc: "PDF-документ" },
    { value: "docx", label: "DOCX", desc: "Документ Word" },
  ];

  const specialFiles = [
    { value: "empty", label: "Пустой файл", desc: "Файл размером 0 байт" },
    { value: "big", label: "Большой файл", desc: "Настраиваемый размер для тестирования лимитов" },
    { value: "long_name", label: "Длинное имя", desc: "Файл с именем из 200+ символов" },
    { value: "cyrillic_name", label: "Кириллическое имя", desc: "Файл с кириллицей в имени" },
    { value: "special_chars", label: "Спецсимволы", desc: "Файл со спецсимволами в имени" },
    { value: "wrong_mime", label: "Неверный MIME", desc: "Расширение не совпадает с содержимым" },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl md:text-[1.75rem] font-semibold leading-tight" data-testid="text-page-title">
          Генераторы файлов
        </h1>
        <p className="text-[15px] text-muted-foreground mt-2 max-w-prose">
          Генерация тестовых файлов различных форматов для тестирования загрузки и обработки
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="space-y-1">
              <h3 className="text-base font-semibold">Стандартные файлы</h3>
              <p className="text-xs text-muted-foreground">Генерация файлов с пользовательским содержимым</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {fileTypes.map((ft) => (
                <div
                  key={ft.value}
                  onClick={() => setFileType(ft.value)}
                  className={`p-3 rounded-md cursor-pointer border transition-colors ${
                    fileType === ft.value
                      ? "bg-primary/10 border-primary/30"
                      : "hover-elevate"
                  }`}
                  data-testid={`option-file-type-${ft.value}`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{ft.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{ft.desc}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label>Имя файла</Label>
              <Input
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="тестовый_файл"
                data-testid="input-file-name"
              />
            </div>

            <div className="space-y-2">
              <Label>Содержимое</Label>
              <textarea
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-24 resize-y"
                placeholder="Введите содержимое..."
                data-testid="textarea-file-content"
              />
            </div>

            <Button onClick={generateFile} disabled={loading} className="w-full" data-testid="button-generate-file">
              <Download className="w-4 h-4 mr-1" /> Создать и скачать .{fileType}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="space-y-1">
              <h3 className="text-base font-semibold">Специальные файлы</h3>
              <p className="text-xs text-muted-foreground">Граничные файлы для тестирования</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {specialFiles.map((sf) => (
                <div
                  key={sf.value}
                  onClick={() => setSpecialType(sf.value)}
                  className={`flex items-center justify-between gap-2 p-3 rounded-md cursor-pointer border transition-colors ${
                    specialType === sf.value
                      ? "bg-primary/10 border-primary/30"
                      : "hover-elevate"
                  }`}
                  data-testid={`option-special-${sf.value}`}
                >
                  <div>
                    <span className="text-sm font-medium">{sf.label}</span>
                    <p className="text-xs text-muted-foreground">{sf.desc}</p>
                  </div>
                  {specialType === sf.value && (
                    <Badge variant="secondary">Выбрано</Badge>
                  )}
                </div>
              ))}
            </div>

            {specialType === "big" && (
              <div className="space-y-2">
                <Label>Размер (МБ)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={bigFileSize}
                    onChange={(e) => setBigFileSize(Math.min(50, Math.max(1, Number(e.target.value))))}
                    className="w-24"
                    data-testid="input-big-file-size"
                  />
                  <span className="text-xs text-muted-foreground">Макс. 50 МБ</span>
                </div>
              </div>
            )}

            <Button onClick={generateSpecialFile} disabled={loading} className="w-full" data-testid="button-generate-special">
              <Dices className="w-4 h-4 mr-1" /> Создать специальный файл
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
