import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CopyButton } from "@/components/copy-button";
import { Download, Image, ImageOff, Dices } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ImageGeneratorsPage() {
  const [width, setWidth] = useState(400);
  const [height, setHeight] = useState(300);
  const [format, setFormat] = useState("svg");
  const [transparent, setTransparent] = useState(false);
  const [targetSizeMb, setTargetSizeMb] = useState(0);
  const [imageUrl, setImageUrl] = useState("");
  const [base64, setBase64] = useState("");
  const [loading, setLoading] = useState(false);
  const [fileSize, setFileSize] = useState(0);

  const [brokenLoading, setBrokenLoading] = useState(false);

  const formats = [
    { value: "svg", label: "SVG" },
    { value: "png", label: "PNG" },
    { value: "jpg", label: "JPEG" },
    { value: "webp", label: "WebP" },
    { value: "gif", label: "GIF" },
    { value: "tiff", label: "TIFF" },
  ];

  const sizePresets = [
    { label: "Авто", value: 0 },
    { label: "100 КБ", value: 0.1 },
    { label: "500 КБ", value: 0.5 },
    { label: "1 МБ", value: 1 },
    { label: "5 МБ", value: 5 },
    { label: "10 МБ", value: 10 },
    { label: "25 МБ", value: 25 },
    { label: "50 МБ", value: 50 },
  ];

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Б";
    if (bytes < 1024) return `${bytes} Б`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} МБ`;
  };

  const generateImage = async () => {
    setLoading(true);
    setBase64("");
    setFileSize(0);
    try {
      const params = new URLSearchParams({
        width: String(width),
        height: String(height),
        format,
        transparent: String(transparent),
      });
      if (targetSizeMb > 0) {
        params.set("sizeMb", String(targetSizeMb));
      }
      const url = `/api/generate/image?${params}`;
      setImageUrl(url);

      const res = await fetch(url);
      if (res.ok) {
        const blob = await res.blob();
        setFileSize(blob.size);
        if (format === "svg" || blob.size < 5 * 1024 * 1024) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setBase64(reader.result as string);
          };
          reader.readAsDataURL(blob);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = async () => {
    if (!imageUrl) return;
    try {
      const res = await fetch(imageUrl);
      if (res.ok) {
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `image_${width}x${height}.${format === "jpeg" ? "jpg" : format}`;
        a.click();
        URL.revokeObjectURL(blobUrl);
      }
    } catch {}
  };

  const downloadBrokenFile = async (type: string) => {
    setBrokenLoading(true);
    try {
      const res = await fetch(`/api/generate/broken-image?type=${type}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = type === "corrupted" ? "broken.png" : "wrong_extension.png";
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setBrokenLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">
          Генераторы изображений
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Создание изображений-заглушек и битых файлов для тестирования загрузки
        </p>
      </div>

      <Tabs defaultValue="placeholder" className="space-y-4">
        <TabsList data-testid="tabs-image-gen">
          <TabsTrigger value="placeholder" className="gap-1" data-testid="tab-placeholder">
            <Image className="w-3 h-3" /> Заглушка
          </TabsTrigger>
          <TabsTrigger value="broken" className="gap-1" data-testid="tab-broken">
            <ImageOff className="w-3 h-3" /> Битые файлы
          </TabsTrigger>
        </TabsList>

        <TabsContent value="placeholder">
          <Card>
            <CardHeader className="pb-3">
              <div className="space-y-1">
                <h3 className="text-base font-semibold">Генератор изображений-заглушек</h3>
                <p className="text-xs text-muted-foreground">Создайте заглушки с настраиваемыми размерами, форматом и весом</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-2">
                  <Label>Ширина (px)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={4000}
                    value={width}
                    onChange={(e) => setWidth(Math.min(4000, Math.max(1, Number(e.target.value))))}
                    className="w-28"
                    data-testid="input-image-width"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Высота (px)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={4000}
                    value={height}
                    onChange={(e) => setHeight(Math.min(4000, Math.max(1, Number(e.target.value))))}
                    className="w-28"
                    data-testid="input-image-height"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Формат</Label>
                  <Select value={format} onValueChange={setFormat}>
                    <SelectTrigger className="w-28" data-testid="select-image-format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {formats.map((f) => (
                        <SelectItem key={f.value} value={f.value} data-testid={`option-format-${f.value}`}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={transparent}
                    onCheckedChange={setTransparent}
                    disabled={format === "jpg" || format === "jpeg"}
                    data-testid="switch-transparent"
                  />
                  <Label className="text-sm">Прозрачный</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Целевой размер файла</Label>
                <div className="flex flex-wrap gap-2">
                  {sizePresets.map((preset) => (
                    <Button
                      key={preset.value}
                      variant={targetSizeMb === preset.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTargetSizeMb(preset.value)}
                      data-testid={`button-size-${preset.value}`}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={50}
                    step={0.1}
                    value={targetSizeMb || ""}
                    onChange={(e) => setTargetSizeMb(Math.min(50, Math.max(0, Number(e.target.value))))}
                    placeholder="Или введите вручную (МБ)"
                    className="w-64"
                    data-testid="input-target-size"
                  />
                  <span className="text-xs text-muted-foreground">МБ (макс. 50)</span>
                </div>
                {targetSizeMb > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Файл будет дополнен до ~{targetSizeMb >= 1 ? `${targetSizeMb} МБ` : `${Math.round(targetSizeMb * 1024)} КБ`}
                  </p>
                )}
              </div>

              <Button
                onClick={generateImage}
                disabled={loading}
                data-testid="button-generate-image"
              >
                <Dices className="w-4 h-4 mr-1" /> {loading ? "Генерация..." : "Сгенерировать"}
              </Button>

              {imageUrl && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={downloadImage} data-testid="button-download-image">
                      <Download className="w-3 h-3 mr-1" /> Скачать
                    </Button>
                    {base64 && format === "svg" && (
                      <CopyButton text={base64} variant="outline" size="sm" />
                    )}
                    {fileSize > 0 && (
                      <Badge variant="secondary" data-testid="badge-file-size">
                        {formatFileSize(fileSize)}
                      </Badge>
                    )}
                    <Badge variant="secondary" data-testid="badge-format">
                      {format.toUpperCase()}
                    </Badge>
                  </div>
                  {base64 && (
                    <div className="border rounded-md p-4 bg-muted/30 flex items-center justify-center">
                      <img
                        src={base64}
                        alt={`Заглушка ${width}x${height}`}
                        className="max-w-full max-h-64 rounded-md"
                        data-testid="img-generated"
                      />
                    </div>
                  )}
                  {base64 && format === "svg" && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Base64 (нажмите для копирования)</Label>
                      <div className="bg-muted rounded-md p-3 max-h-24 overflow-y-auto">
                        <code className="text-xs font-mono break-all" data-testid="text-base64">
                          {base64.substring(0, 200)}...
                        </code>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="broken">
          <Card>
            <CardHeader className="pb-3">
              <div className="space-y-1">
                <h3 className="text-base font-semibold">Битые / невалидные файлы</h3>
                <p className="text-xs text-muted-foreground">Скачайте повреждённые или файлы с неверным типом для тестирования валидации загрузки</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Card className="hover-elevate">
                  <CardContent className="p-4 space-y-2">
                    <h4 className="text-sm font-medium">Повреждённое изображение</h4>
                    <p className="text-xs text-muted-foreground">Файл с расширением изображения, но повреждённым содержимым</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadBrokenFile("corrupted")}
                      disabled={brokenLoading}
                      data-testid="button-download-corrupted"
                    >
                      <Download className="w-3 h-3 mr-1" /> Скачать
                    </Button>
                  </CardContent>
                </Card>
                <Card className="hover-elevate">
                  <CardContent className="p-4 space-y-2">
                    <h4 className="text-sm font-medium">Неверный MIME-тип</h4>
                    <p className="text-xs text-muted-foreground">Текстовый файл, замаскированный под изображение</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadBrokenFile("wrong_mime")}
                      disabled={brokenLoading}
                      data-testid="button-download-wrong-mime"
                    >
                      <Download className="w-3 h-3 mr-1" /> Скачать
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
