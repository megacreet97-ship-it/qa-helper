import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CopyButton } from "@/components/copy-button";
import { usePersistentState } from "@/hooks/use-persistent-state";
import { useTabParam } from "@/hooks/use-tab-param";
import { CODECS, decode, encode, type Codec } from "@/lib/encoding";
import { md5 } from "@/lib/md5";
import { ArrowUpDown, Binary, Fingerprint, Check } from "lucide-react";

const HASHES = [
  { name: "MD5", algo: null },
  { name: "SHA-1", algo: "SHA-1" },
  { name: "SHA-256", algo: "SHA-256" },
  { name: "SHA-384", algo: "SHA-384" },
  { name: "SHA-512", algo: "SHA-512" },
] as const;

const toHex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");

async function computeHashes(text: string, hmacKey: string): Promise<Record<string, string>> {
  const data = new TextEncoder().encode(text);
  const out: Record<string, string> = {};
  for (const h of HASHES) {
    if (h.algo === null) {
      out[h.name] = hmacKey ? "" : md5(data);
      continue;
    }
    if (!crypto.subtle) {
      out[h.name] = "";
      continue;
    }
    if (hmacKey) {
      const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(hmacKey), { name: "HMAC", hash: h.algo }, false, ["sign"]);
      out[h.name] = toHex(await crypto.subtle.sign("HMAC", key, data));
    } else {
      out[h.name] = toHex(await crypto.subtle.digest(h.algo, data));
    }
  }
  return out;
}

function Codecs() {
  const [codec, setCodec] = usePersistentState<Codec>("encode.codec", "base64");
  const [direction, setDirection] = usePersistentState<"encode" | "decode">("encode.direction", "encode");
  const [input, setInput] = useState("Привет, QA! Пароль: p@ss/w0rd+1");

  const { output, error } = useMemo(() => {
    if (!input) return { output: "", error: "" };
    try {
      return { output: direction === "encode" ? encode(codec, input) : decode(codec, input), error: "" };
    } catch (e: any) {
      return { output: "", error: e.message };
    }
  }, [codec, direction, input]);

  const swap = () => {
    if (output) setInput(output);
    setDirection(direction === "encode" ? "decode" : "encode");
  };

  const hint = CODECS.find((c) => c.value === codec)?.hint;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-2">
          <Label>Формат</Label>
          <Select value={codec} onValueChange={(v) => setCodec(v as Codec)}>
            <SelectTrigger className="w-52" data-testid="select-codec">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CODECS.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <ToggleGroup
          type="single"
          value={direction}
          onValueChange={(v) => v && setDirection(v as typeof direction)}
          className="justify-start"
        >
          <ToggleGroupItem value="encode" data-testid="toggle-encode">Закодировать</ToggleGroupItem>
          <ToggleGroupItem value="decode" data-testid="toggle-decode">Декодировать</ToggleGroupItem>
        </ToggleGroup>
      </div>
      {hint && <p className="-mt-1 text-xs text-muted-foreground">{hint}</p>}

      <div className="space-y-2">
        <Label htmlFor="codec-input">{direction === "encode" ? "Исходный текст" : "Закодированная строка"}</Label>
        <Textarea
          id="codec-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="min-h-28 font-mono text-sm"
          spellCheck={false}
          data-testid="textarea-codec-input"
        />
      </div>

      <div className="flex justify-center">
        <Button variant="ghost" size="sm" onClick={swap} disabled={!output} data-testid="button-codec-swap">
          <ArrowUpDown className="w-4 h-4 mr-1" /> Поменять местами
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Результат</Label>
          {output && <CopyButton text={output} variant="outline" size="sm" />}
        </div>
        {error ? (
          <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive" data-testid="text-codec-error">
            {error}
          </p>
        ) : (
          <pre className="min-h-28 whitespace-pre-wrap break-all rounded-md bg-muted p-3 text-sm font-mono" data-testid="text-codec-output">
            {output}
          </pre>
        )}
      </div>
    </div>
  );
}

function Hashes() {
  const [input, setInput] = useState("QA Helper");
  const [hmacKey, setHmacKey] = useState("");
  const [upper, setUpper] = usePersistentState("hash.upper", false);
  const [expected, setExpected] = useState("");
  const [hashes, setHashes] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    computeHashes(input, hmacKey).then((h) => !cancelled && setHashes(h));
    return () => {
      cancelled = true;
    };
  }, [input, hmacKey]);

  const expectedNorm = expected.trim().toLowerCase();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="hash-input">Текст</Label>
        <Textarea
          id="hash-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="min-h-24 font-mono text-sm"
          spellCheck={false}
          data-testid="textarea-hash-input"
        />
        <p className="text-xs text-muted-foreground">Хешируются байты UTF-8. Пробелы и переводы строк тоже учитываются.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="hmac-key">Ключ HMAC <span className="font-normal text-muted-foreground">(необязательно)</span></Label>
          <Input id="hmac-key" value={hmacKey} onChange={(e) => setHmacKey(e.target.value)} className="font-mono" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hash-expected">Сверить с хешем</Label>
          <Input
            id="hash-expected"
            value={expected}
            onChange={(e) => setExpected(e.target.value)}
            placeholder="вставьте хеш из ответа API"
            className="font-mono"
            data-testid="input-hash-expected"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <Switch checked={upper} onCheckedChange={setUpper} />
        Верхний регистр
      </label>

      <div className="divide-y rounded-lg border">
        {HASHES.map((h) => {
          const value = hashes[h.name] ?? "";
          const shown = upper ? value.toUpperCase() : value;
          const match = expectedNorm && value && value === expectedNorm;
          const label = hmacKey && h.algo ? `HMAC-${h.name}` : h.name;
          return (
            <div
              key={h.name}
              className={`flex items-center gap-3 px-3 py-2 ${match ? "bg-primary/10" : ""}`}
              data-testid={`row-hash-${h.name}`}
            >
              <span className="w-28 shrink-0 text-xs font-medium text-muted-foreground">{label}</span>
              <code className="flex-1 break-all font-mono text-xs">
                {value ? shown : <span className="text-muted-foreground">{hmacKey && !h.algo ? "HMAC-MD5 не поддерживается" : "недоступно без HTTPS"}</span>}
              </code>
              {match && <Check className="w-4 h-4 shrink-0 text-primary" aria-label="Совпадает" />}
              {value && <CopyButton text={shown} className="h-7 w-7 shrink-0" />}
            </div>
          );
        })}
      </div>
      {expectedNorm && !HASHES.some((h) => hashes[h.name] === expectedNorm) && (
        <p className="text-sm text-muted-foreground">Ни один хеш не совпал с введённым значением.</p>
      )}
    </div>
  );
}

export default function EncodePage() {
  const [tab, setTab] = useTabParam("codec", ["codec", "hash"]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl md:text-[1.75rem] font-semibold leading-tight" data-testid="text-page-title">
          Кодирование и хеши
        </h1>
        <p className="text-[15px] text-muted-foreground mt-2 max-w-prose">
          Base64, URL, HTML-сущности, hex и Unicode в обе стороны. MD5 и SHA с проверкой по образцу. Всё считается в браузере.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="codec" className="gap-1" data-testid="tab-codec">
            <Binary className="w-3 h-3" /> Кодирование
          </TabsTrigger>
          <TabsTrigger value="hash" className="gap-1" data-testid="tab-hash">
            <Fingerprint className="w-3 h-3" /> Хеши
          </TabsTrigger>
        </TabsList>

        <TabsContent value="codec">
          <Card>
            <CardHeader className="pb-3">
              <div className="space-y-1">
                <h3 className="text-base font-semibold">Кодировщик</h3>
                <p className="text-xs text-muted-foreground">Результат обновляется по мере ввода</p>
              </div>
            </CardHeader>
            <CardContent>
              <Codecs />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hash">
          <Card>
            <CardHeader className="pb-3">
              <div className="space-y-1">
                <h3 className="text-base font-semibold">Хеш-функции</h3>
                <p className="text-xs text-muted-foreground">MD5, SHA-1, SHA-2 и HMAC</p>
              </div>
            </CardHeader>
            <CardContent>
              <Hashes />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
