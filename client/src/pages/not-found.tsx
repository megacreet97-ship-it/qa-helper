import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function NotFound() {
  const [location] = useLocation();

  return (
    <div className="flex min-h-[60vh] w-full items-center">
      <div className="max-w-md space-y-5">
        <p className="font-mono text-sm text-primary">404</p>
        <h1 className="text-3xl font-semibold">Такой страницы нет</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          По адресу <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">{location}</code> ничего
          не найдено. Проверьте ссылку или выберите инструмент в меню слева.
        </p>
        <Button asChild variant="outline">
          <Link href="/" data-testid="link-back-home">
            <ArrowLeft className="w-4 h-4 mr-1" /> На главную
          </Link>
        </Button>
      </div>
    </div>
  );
}
