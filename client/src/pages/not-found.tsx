import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6 space-y-4">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <h1 className="text-2xl font-bold">404 - Страница не найдена</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Запрашиваемая страница не существует.
          </p>
          <Button asChild variant="outline">
            <Link href="/" data-testid="link-back-home">
              <ArrowLeft className="w-4 h-4 mr-1" /> На главную
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
