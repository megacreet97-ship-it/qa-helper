import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CopyButton } from "@/components/copy-button";
import { usePersistentState } from "@/hooks/use-persistent-state";
import { signJwt, type JwtAlg } from "@/lib/jwt";
import { AlertTriangle, ArrowRight, KeyRound } from "lucide-react";

type Alg = JwtAlg;

const now = () => Math.floor(Date.now() / 1000);

const presets: { label: string; build: () => Record<string, unknown> }[] = [
  {
    label: "Действует 1 час",
    build: () => ({ sub: "user-1042", name: "Анна Петрова", role: "tester", iat: now(), exp: now() + 3600 }),
  },
  {
    label: "Истёк",
    build: () => ({ sub: "user-1042", role: "tester", iat: now() - 7200, exp: now() - 3600 }),
  },
  {
    label: "Ещё не активен (nbf)",
    build: () => ({ sub: "user-1042", role: "tester", iat: now(), nbf: now() + 3600, exp: now() + 7200 }),
  },
  {
    label: "Без exp",
    build: () => ({ sub: "user-1042", role: "admin", iat: now() }),
  },
];

export function JwtGenerator({ onOpenInDecoder }: { onOpenInDecoder?: (token: string) => void }) {
  const [alg, setAlg] = usePersistentState<Alg>("jwt.alg", "HS256");
  const [secret, setSecret] = useState("your-256-bit-secret");
  const [payload, setPayload] = useState(() => JSON.stringify(presets[0].build(), null, 2));
  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  const generate = async () => {
    setError("");
    setToken("");
    let parsed: unknown;
    try {
      parsed = JSON.parse(payload);
    } catch (e: any) {
      setError(`Payload — невалидный JSON: ${e.message}`);
      return;
    }
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      setError("Payload должен быть JSON-объектом");
      return;
    }
    if (alg !== "none" && !secret) {
      setError("Укажите секрет для подписи");
      return;
    }
    try {
      setToken(await signJwt({ alg, typ: "JWT" }, parsed, alg, secret));
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label>Алгоритм</Label>
          <Select value={alg} onValueChange={(v) => setAlg(v as Alg)}>
            <SelectTrigger className="w-36" data-testid="select-jwt-alg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="HS256">HS256</SelectItem>
              <SelectItem value="HS384">HS384</SelectItem>
              <SelectItem value="HS512">HS512</SelectItem>
              <SelectItem value="none">none (без подписи)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {alg !== "none" && (
          <div className="space-y-2 flex-1 min-w-52">
            <Label htmlFor="jwt-secret">Секрет</Label>
            <Input
              id="jwt-secret"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="font-mono"
              data-testid="input-jwt-secret"
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Label htmlFor="jwt-payload">Payload</Label>
          <div className="flex flex-wrap gap-1">
            {presets.map((p) => (
              <Button
                key={p.label}
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setPayload(JSON.stringify(p.build(), null, 2))}
              >
                {p.label}
              </Button>
            ))}
          </div>
        </div>
        <Textarea
          id="jwt-payload"
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          className="min-h-40 font-mono text-sm"
          spellCheck={false}
          data-testid="textarea-jwt-payload"
        />
        <p className="text-xs text-muted-foreground">
          Время в exp, iat и nbf — Unix-секунды. Подпись считается в браузере, секрет никуда не отправляется.
        </p>
      </div>

      <Button onClick={generate} data-testid="button-generate-jwt">
        <KeyRound className="w-4 h-4 mr-1" /> Создать токен
      </Button>

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3">
          <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {token && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label>Токен</Label>
            <div className="flex gap-1">
              <CopyButton text={token} variant="outline" size="sm" />
              {onOpenInDecoder && (
                <Button variant="outline" size="sm" onClick={() => onOpenInDecoder(token)}>
                  В декодер <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              )}
            </div>
          </div>
          <pre className="rounded-md bg-muted p-4 text-sm font-mono whitespace-pre-wrap break-all" data-testid="text-jwt-generated">
            {token}
          </pre>
        </div>
      )}
    </div>
  );
}
