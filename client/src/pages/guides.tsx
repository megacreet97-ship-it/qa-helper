import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, Calendar } from "lucide-react";
import type { Article } from "@shared/schema";

export default function GuidesPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: articles = [], isLoading } = useQuery<Article[]>({
    queryKey: ["/api/articles"],
  });

  const { data: selectedArticle } = useQuery<Article>({
    queryKey: ["/api/articles", selectedId],
    enabled: selectedId !== null,
  });

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (selectedId && selectedArticle) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Button
          variant="ghost"
          onClick={() => setSelectedId(null)}
          data-testid="button-back-to-guides"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад к списку
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(selectedArticle.createdAt)}</span>
            </div>
            <CardTitle className="text-2xl" data-testid="text-article-title">
              {selectedArticle.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap"
              data-testid="text-article-content"
            >
              {selectedArticle.content}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen className="w-6 h-6 text-primary" />
        <h1 className="text-2xl md:text-[1.75rem] font-semibold leading-tight" data-testid="text-guides-heading">
          Обучение и гайды
        </h1>
      </div>
      <p className="text-muted-foreground">
        Полезные материалы, статьи и руководства для QA-инженеров
      </p>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-5 bg-muted rounded w-1/3 mb-3" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Пока нет опубликованных материалов</p>
            <p className="text-sm mt-1">Скоро здесь появятся полезные статьи и гайды</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <Card
              key={article.id}
              className="cursor-pointer hover-elevate transition-colors"
              onClick={() => setSelectedId(article.id)}
              data-testid={`card-article-${article.id}`}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base mb-1" data-testid={`text-article-title-${article.id}`}>
                      {article.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {article.content.substring(0, 200)}
                      {article.content.length > 200 ? "..." : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                    <Calendar className="w-3 h-3" />
                    {formatDate(article.createdAt)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
