import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Download, Music, Video, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function MediaGeneratorsPage() {
  const [audioFormat, setAudioFormat] = useState("wav");
  const [audioSizeStr, setAudioSizeStr] = useState("1");
  const [audioDurationStr, setAudioDurationStr] = useState("5");
  const [audioLoading, setAudioLoading] = useState(false);

  const [videoFormat, setVideoFormat] = useState("mp4");
  const [videoSizeStr, setVideoSizeStr] = useState("1");
  const [videoDurationStr, setVideoDurationStr] = useState("3");
  const [videoWidth, setVideoWidth] = useState(640);
  const [videoHeight, setVideoHeight] = useState(480);
  const [videoLoading, setVideoLoading] = useState(false);

  const { toast } = useToast();

  const audioFormats = [
    { value: "wav", label: "WAV", desc: "Без сжатия (PCM)" },
    { value: "mp3", label: "MP3", desc: "Сжатый формат" },
    { value: "ogg", label: "OGG", desc: "Vorbis аудио" },
    { value: "flac", label: "FLAC", desc: "Без потерь" },
    { value: "aac", label: "AAC", desc: "Advanced Audio" },
    { value: "m4a", label: "M4A", desc: "MPEG-4 аудио" },
    { value: "wma", label: "WMA", desc: "Windows Media" },
  ];

  const videoFormats = [
    { value: "mp4", label: "MP4", desc: "H.264 + AAC" },
    { value: "avi", label: "AVI", desc: "MPEG4 + MP3" },
    { value: "webm", label: "WebM", desc: "VP8 + Vorbis" },
    { value: "mkv", label: "MKV", desc: "Matroska контейнер" },
    { value: "mov", label: "MOV", desc: "QuickTime" },
    { value: "wmv", label: "WMV", desc: "Windows Media" },
  ];

  const videoResolutions = [
    { label: "320×240", w: 320, h: 240 },
    { label: "640×480", w: 640, h: 480 },
    { label: "1280×720 (HD)", w: 1280, h: 720 },
    { label: "1920×1080 (Full HD)", w: 1920, h: 1080 },
  ];

  const generateAudio = async () => {
    const audioSize = Math.min(50, Math.max(0.1, parseFloat(audioSizeStr) || 1));
    const audioDuration = Math.min(300, Math.max(1, parseInt(audioDurationStr) || 5));
    setAudioSizeStr(String(audioSize));
    setAudioDurationStr(String(audioDuration));
    setAudioLoading(true);
    try {
      const params = new URLSearchParams({
        format: audioFormat,
        sizeMb: String(audioSize),
        duration: String(audioDuration),
      });
      const url = `/api/generate/audio?${params}`;
      const response = await fetch(url);
      if (!response.ok) {
        const data = await response.json();
        toast({ title: "Ошибка", description: data.message || "Не удалось сгенерировать аудио", variant: "destructive" });
        return;
      }
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `test_audio_${audioDuration}s.${audioFormat}`;
      a.click();
      URL.revokeObjectURL(downloadUrl);
      toast({ title: "Готово", description: `Аудиофайл .${audioFormat} создан` });
    } catch {
      toast({ title: "Ошибка", description: "Не удалось сгенерировать аудио", variant: "destructive" });
    } finally {
      setAudioLoading(false);
    }
  };

  const generateVideo = async () => {
    const videoSize = Math.min(50, Math.max(0.1, parseFloat(videoSizeStr) || 1));
    const videoDuration = Math.min(60, Math.max(1, parseInt(videoDurationStr) || 3));
    setVideoSizeStr(String(videoSize));
    setVideoDurationStr(String(videoDuration));
    setVideoLoading(true);
    try {
      const params = new URLSearchParams({
        format: videoFormat,
        sizeMb: String(videoSize),
        duration: String(videoDuration),
        width: String(videoWidth),
        height: String(videoHeight),
      });
      const url = `/api/generate/video?${params}`;
      const response = await fetch(url);
      if (!response.ok) {
        const data = await response.json();
        toast({ title: "Ошибка", description: data.message || "Не удалось сгенерировать видео", variant: "destructive" });
        return;
      }
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `test_video_${videoDuration}s_${videoWidth}x${videoHeight}.${videoFormat}`;
      a.click();
      URL.revokeObjectURL(downloadUrl);
      toast({ title: "Готово", description: `Видеофайл .${videoFormat} создан` });
    } catch {
      toast({ title: "Ошибка", description: "Не удалось сгенерировать видео", variant: "destructive" });
    } finally {
      setVideoLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">
          Аудио и видео
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Генерация тестовых аудио- и видеофайлов разных форматов и размеров
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-muted-foreground" />
              <div className="space-y-1">
                <h3 className="text-base font-semibold">Аудиофайлы</h3>
                <p className="text-xs text-muted-foreground">Тестовый тон 440 Гц (нота Ля)</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Формат</Label>
              <div className="grid grid-cols-2 gap-2">
                {audioFormats.map((af) => (
                  <div
                    key={af.value}
                    onClick={() => setAudioFormat(af.value)}
                    className={`p-2.5 rounded-md cursor-pointer border transition-colors ${
                      audioFormat === af.value
                        ? "bg-primary/10 border-primary/30"
                        : "hover-elevate"
                    }`}
                    data-testid={`option-audio-format-${af.value}`}
                  >
                    <div className="flex items-center gap-2">
                      <Music className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-sm font-medium">{af.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{af.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Длительность (сек)</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={audioDurationStr}
                  onChange={(e) => setAudioDurationStr(e.target.value.replace(/[^0-9]/g, ""))}
                  onBlur={(e) => {
                    const n = parseInt(e.target.value) || 5;
                    setAudioDurationStr(String(Math.min(300, Math.max(1, n))));
                  }}
                  placeholder="5"
                  data-testid="input-audio-duration"
                />
                <p className="text-xs text-muted-foreground">Макс. 300 сек</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Размер (МБ)</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={audioSizeStr}
                  onChange={(e) => setAudioSizeStr(e.target.value.replace(/[^0-9.]/g, ""))}
                  onBlur={(e) => {
                    const n = parseFloat(e.target.value) || 1;
                    setAudioSizeStr(String(Math.min(50, Math.max(0.1, n))));
                  }}
                  placeholder="1"
                  data-testid="input-audio-size"
                />
                <p className="text-xs text-muted-foreground">Макс. 50 МБ</p>
              </div>
            </div>

            <div className="bg-muted rounded-md p-3">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="secondary">.{audioFormat}</Badge>
                <span className="text-muted-foreground">{audioDurationStr || "5"} сек</span>
                <span className="text-muted-foreground">~{audioSizeStr || "1"} МБ</span>
              </div>
            </div>

            <Button onClick={generateAudio} disabled={audioLoading} className="w-full" data-testid="button-generate-audio">
              {audioLoading ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-1" />
              )}
              {audioLoading ? "Генерация..." : `Создать .${audioFormat}`}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-muted-foreground" />
              <div className="space-y-1">
                <h3 className="text-base font-semibold">Видеофайлы</h3>
                <p className="text-xs text-muted-foreground">Тестовая таблица с тоном 440 Гц</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Формат</Label>
              <div className="grid grid-cols-2 gap-2">
                {videoFormats.map((vf) => (
                  <div
                    key={vf.value}
                    onClick={() => setVideoFormat(vf.value)}
                    className={`p-2.5 rounded-md cursor-pointer border transition-colors ${
                      videoFormat === vf.value
                        ? "bg-primary/10 border-primary/30"
                        : "hover-elevate"
                    }`}
                    data-testid={`option-video-format-${vf.value}`}
                  >
                    <div className="flex items-center gap-2">
                      <Video className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-sm font-medium">{vf.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{vf.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Разрешение</Label>
              <div className="grid grid-cols-2 gap-2">
                {videoResolutions.map((vr) => (
                  <div
                    key={vr.label}
                    onClick={() => { setVideoWidth(vr.w); setVideoHeight(vr.h); }}
                    className={`p-2 rounded-md cursor-pointer border transition-colors text-center ${
                      videoWidth === vr.w && videoHeight === vr.h
                        ? "bg-primary/10 border-primary/30"
                        : "hover-elevate"
                    }`}
                    data-testid={`option-video-res-${vr.w}x${vr.h}`}
                  >
                    <span className="text-sm font-medium">{vr.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Длительность (сек)</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={videoDurationStr}
                  onChange={(e) => setVideoDurationStr(e.target.value.replace(/[^0-9]/g, ""))}
                  onBlur={(e) => {
                    const n = parseInt(e.target.value) || 3;
                    setVideoDurationStr(String(Math.min(60, Math.max(1, n))));
                  }}
                  placeholder="3"
                  data-testid="input-video-duration"
                />
                <p className="text-xs text-muted-foreground">Макс. 60 сек</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Размер (МБ)</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={videoSizeStr}
                  onChange={(e) => setVideoSizeStr(e.target.value.replace(/[^0-9.]/g, ""))}
                  onBlur={(e) => {
                    const n = parseFloat(e.target.value) || 1;
                    setVideoSizeStr(String(Math.min(50, Math.max(0.1, n))));
                  }}
                  placeholder="1"
                  data-testid="input-video-size"
                />
                <p className="text-xs text-muted-foreground">Макс. 50 МБ</p>
              </div>
            </div>

            <div className="bg-muted rounded-md p-3">
              <div className="flex items-center gap-2 text-sm flex-wrap">
                <Badge variant="secondary">.{videoFormat}</Badge>
                <span className="text-muted-foreground">{videoWidth}×{videoHeight}</span>
                <span className="text-muted-foreground">{videoDurationStr || "3"} сек</span>
                <span className="text-muted-foreground">~{videoSizeStr || "1"} МБ</span>
              </div>
            </div>

            <Button onClick={generateVideo} disabled={videoLoading} className="w-full" data-testid="button-generate-video">
              {videoLoading ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-1" />
              )}
              {videoLoading ? "Генерация..." : `Создать .${videoFormat}`}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
