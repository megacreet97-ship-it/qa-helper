import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Pencil,
  Trash2,
  LogOut,
  ArrowLeft,
  Save,
  X,
  Calendar,
  Eye,
  EyeOff,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Article } from "@shared/schema";

type EditMode = { type: "create" } | { type: "edit"; article: Article } | null;

export default function AdminPanelPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [editMode, setEditMode] = useState<EditMode>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [published, setPublished] = useState(true);

  const { data: me, isLoading: meLoading, isError: meError } = useQuery<{ username: string }>({
    queryKey: ["/api/admin/me"],
    retry: false,
  });

  const { data: articles = [], isLoading } = useQuery<Article[]>({
    queryKey: ["/api/admin/articles"],
    enabled: !!me,
  });

  const createMutation = useMutation({
    mutationFn: (data: { title: string; content: string; published: boolean }) =>
      apiRequest("POST", "/api/admin/articles", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      toast({ title: "Статья создана" });
      setEditMode(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number; title: string; content: string; published: boolean }) =>
      apiRequest("PUT", `/api/admin/articles/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      toast({ title: "Статья обновлена" });
      setEditMode(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/articles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      toast({ title: "Статья удалена" });
    },
  });

  const handleLogout = async () => {
    await apiRequest("POST", "/api/admin/logout");
    queryClient.invalidateQueries({ queryKey: ["/api/admin/me"] });
    setLocation("/admin/login");
  };

  const startCreate = () => {
    setTitle("");
    setContent("");
    setPublished(true);
    setEditMode({ type: "create" });
  };

  const startEdit = (article: Article) => {
    setTitle(article.title);
    setContent(article.content);
    setPublished(article.published);
    setEditMode({ type: "edit", article });
  };

  const handleSave = () => {
    if (!title.trim() || !content.trim()) {
      toast({ title: "Заполните все поля", variant: "destructive" });
      return;
    }
    if (editMode?.type === "create") {
      createMutation.mutate({ title, content, published });
    } else if (editMode?.type === "edit") {
      updateMutation.mutate({ id: editMode.article.id, title, content, published });
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    if (!meLoading && (meError || !me)) {
      setLocation("/admin/login");
    }
  }, [meLoading, meError, me, setLocation]);

  if (meLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    );
  }

  if (!me) {
    return null;
  }

  if (editMode) {
    const saving = createMutation.isPending || updateMutation.isPending;
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Button variant="ghost" onClick={() => setEditMode(null)} data-testid="button-cancel-edit">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад к списку
        </Button>

        <Card>
          <CardHeader>
            <CardTitle data-testid="text-editor-heading">
              {editMode.type === "create" ? "Новая статья" : "Редактирование статьи"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="article-title">Заголовок</Label>
              <Input
                id="article-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Введите заголовок статьи"
                data-testid="input-article-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="article-content">Содержимое</Label>
              <Textarea
                id="article-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Введите текст статьи..."
                className="min-h-[300px] resize-y"
                data-testid="input-article-content"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={published}
                onCheckedChange={setPublished}
                data-testid="switch-published"
              />
              <Label>{published ? "Опубликовано" : "Черновик"}</Label>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={handleSave} disabled={saving} data-testid="button-save-article">
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Сохранение..." : "Сохранить"}
              </Button>
              <Button variant="outline" onClick={() => setEditMode(null)} data-testid="button-cancel-save">
                <X className="w-4 h-4 mr-2" />
                Отмена
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-[1.75rem] font-semibold leading-tight" data-testid="text-admin-heading">
            Админ-панель
          </h1>
          <p className="text-sm text-muted-foreground">
            Управление обучающими материалами
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" data-testid="text-admin-user">
            {me.username}
          </Badge>
          <Button variant="outline" size="sm" onClick={handleLogout} data-testid="button-admin-logout">
            <LogOut className="w-4 h-4 mr-2" />
            Выйти
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-lg font-semibold">
          Статьи ({articles.length})
        </h2>
        <Button onClick={startCreate} data-testid="button-create-article">
          <Plus className="w-4 h-4 mr-2" />
          Новая статья
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-5 bg-muted rounded w-1/3 mb-2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <p className="text-lg mb-2">Статей пока нет</p>
            <p className="text-sm">Создайте первую обучающую статью</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <Card key={article.id} data-testid={`card-admin-article-${article.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold" data-testid={`text-admin-article-title-${article.id}`}>
                        {article.title}
                      </h3>
                      <Badge variant={article.published ? "default" : "secondary"}>
                        {article.published ? (
                          <><Eye className="w-3 h-3 mr-1" />Опубликовано</>
                        ) : (
                          <><EyeOff className="w-3 h-3 mr-1" />Черновик</>
                        )}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {article.content.substring(0, 150)}...
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {formatDate(article.updatedAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => startEdit(article)}
                      data-testid={`button-edit-article-${article.id}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (confirm("Удалить статью?")) {
                          deleteMutation.mutate(article.id);
                        }
                      }}
                      data-testid={`button-delete-article-${article.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
