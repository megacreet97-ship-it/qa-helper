import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/copy-button";
import { KeyRound, AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface DecodedJWT {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
  isExpired: boolean | null;
  expiresAt: string | null;
  issuedAt: string | null;
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
}

function formatTimestamp(ts: number): string {
  try {
    return new Date(ts * 1000).toLocaleString("ru-RU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return String(ts);
  }
}

export default function JwtDecoderPage() {
  const [token, setToken] = useState("");
  const [decoded, setDecoded] = useState<DecodedJWT | null>(null);
  const [error, setError] = useState("");

  const decodeToken = () => {
    setError("");
    setDecoded(null);

    const trimmed = token.trim();
    if (!trimmed) {
      setError("Введите JWT-токен");
      return;
    }

    const parts = trimmed.split(".");
    if (parts.length !== 3) {
      setError("Невалидный формат JWT. Токен должен содержать 3 части, разделённые точками.");
      return;
    }

    try {
      const header = JSON.parse(base64UrlDecode(parts[0]));
      const payload = JSON.parse(base64UrlDecode(parts[1]));
      const signature = parts[2];

      let isExpired: boolean | null = null;
      let expiresAt: string | null = null;
      let issuedAt: string | null = null;

      if (typeof payload.exp === "number") {
        isExpired = Date.now() / 1000 > payload.exp;
        expiresAt = formatTimestamp(payload.exp);
      }

      if (typeof payload.iat === "number") {
        issuedAt = formatTimestamp(payload.iat);
      }

      setDecoded({ header, payload, signature, isExpired, expiresAt, issuedAt });
    } catch (e: any) {
      setError(`Ошибка декодирования: ${e.message}`);
    }
  };

  const knownClaims: Record<string, string> = {
    iss: "Издатель (Issuer)",
    sub: "Субъект (Subject)",
    aud: "Аудитория (Audience)",
    exp: "Истекает (Expiration)",
    nbf: "Не ранее (Not Before)",
    iat: "Выдан (Issued At)",
    jti: "ID токена (JWT ID)",
    name: "Имя",
    email: "Email",
    role: "Роль",
    roles: "Роли",
    scope: "Область действия",
    permissions: "Разрешения",
  };

  const renderPayloadValue = (key: string, value: unknown): string => {
    if ((key === "exp" || key === "iat" || key === "nbf") && typeof value === "number") {
      return `${value} (${formatTimestamp(value)})`;
    }
    if (typeof value === "object") {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">
          JWT-декодер
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Расшифровка и анализ JSON Web Token (JWT)
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="space-y-1">
            <h3 className="text-base font-semibold">Вставьте JWT-токен</h3>
            <p className="text-xs text-muted-foreground">
              Токен будет декодирован локально в браузере — данные никуда не отправляются
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <textarea
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-28 resize-y font-mono"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
              data-testid="textarea-jwt-input"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button onClick={decodeToken} data-testid="button-decode-jwt">
              <KeyRound className="w-4 h-4 mr-1" /> Декодировать
            </Button>
            <Button
              variant="outline"
              onClick={() => { setToken(""); setDecoded(null); setError(""); }}
              data-testid="button-clear-jwt"
            >
              Очистить
            </Button>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3" data-testid="text-jwt-error">
              <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {decoded && (
            <div className="space-y-4">
              {decoded.isExpired !== null && (
                <div className="flex items-center gap-2 flex-wrap" data-testid="jwt-expiry-status">
                  {decoded.isExpired ? (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="w-3 h-3" /> Токен истёк
                    </Badge>
                  ) : (
                    <Badge variant="default" className="gap-1 bg-green-600">
                      <CheckCircle className="w-3 h-3" /> Токен действителен
                    </Badge>
                  )}
                  {decoded.expiresAt && (
                    <Badge variant="secondary" className="gap-1">
                      <Clock className="w-3 h-3" /> Истекает: {decoded.expiresAt}
                    </Badge>
                  )}
                  {decoded.issuedAt && (
                    <Badge variant="secondary" className="gap-1">
                      <Clock className="w-3 h-3" /> Выдан: {decoded.issuedAt}
                    </Badge>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-sm font-semibold">Заголовок (Header)</Label>
                  <CopyButton text={JSON.stringify(decoded.header, null, 2)} variant="ghost" size="sm" />
                </div>
                <pre className="bg-muted rounded-md p-4 overflow-x-auto text-sm font-mono" data-testid="text-jwt-header">
                  {JSON.stringify(decoded.header, null, 2)}
                </pre>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-sm font-semibold">Полезная нагрузка (Payload)</Label>
                  <CopyButton text={JSON.stringify(decoded.payload, null, 2)} variant="ghost" size="sm" />
                </div>
                <div className="bg-muted rounded-md p-4 overflow-x-auto space-y-1" data-testid="text-jwt-payload">
                  {Object.entries(decoded.payload).map(([key, value]) => (
                    <div key={key} className="flex gap-2 text-sm font-mono">
                      <span className="text-primary font-semibold shrink-0">"{key}":</span>
                      <span className="text-muted-foreground whitespace-pre-wrap break-all">
                        {renderPayloadValue(key, value)}
                      </span>
                      {knownClaims[key] && (
                        <span className="text-xs text-muted-foreground/60 shrink-0 self-center">
                          — {knownClaims[key]}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-sm font-semibold">Подпись (Signature)</Label>
                  <CopyButton text={decoded.signature} variant="ghost" size="sm" />
                </div>
                <pre className="bg-muted rounded-md p-4 overflow-x-auto text-sm font-mono break-all" data-testid="text-jwt-signature">
                  {decoded.signature}
                </pre>
                <p className="text-xs text-muted-foreground">
                  Подпись не может быть проверена без секретного ключа
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
