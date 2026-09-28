import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useLocation, Link } from "wouter";
import { SearchTrigger } from "@/components/command-palette";
import {
  User,
  Type,
  Image,
  FileText,
  Globe,
  ShieldAlert,
  Bug,
  KeyRound,
  ArrowLeftRight,
  BookOpen,
  Settings,
  Braces,
  Code2,
  Music,
  Binary,
  Clock,
  Regex,
  Grid3x3,
} from "lucide-react";

export const generatorGroups = [
  {
    label: "Генераторы данных",
    items: [
      { title: "Персональные данные", url: "/", icon: User, testId: "link-nav-personal-data", keywords: "снилс фио имя телефон email почта uuid id дата рождения" },
      { title: "Текст", url: "/text", icon: Type, testId: "link-nav-text", keywords: "lorem ipsum юникод эмодзи длина символы sql xss" },
      { title: "Сравнение текстов", url: "/compare", icon: ArrowLeftRight, testId: "link-nav-compare", keywords: "diff разница сравнить" },
      { title: "Сравнение HTML", url: "/html-compare", icon: Code2, testId: "link-nav-html-compare", keywords: "diff вёрстка лендинг" },
    ],
  },
  {
    label: "Файлы и медиа",
    items: [
      { title: "Изображения", url: "/images", icon: Image, testId: "link-nav-images", keywords: "png jpeg svg webp gif картинка битый" },
      { title: "Файлы", url: "/files", icon: FileText, testId: "link-nav-files", keywords: "pdf docx csv txt большой файл" },
      { title: "Аудио и видео", url: "/media", icon: Music, testId: "link-nav-media", keywords: "mp3 wav mp4 webm звук видео ffmpeg" },
    ],
  },
  {
    label: "API и безопасность",
    items: [
      { title: "API-помощники", url: "/api", icon: Globe, testId: "link-nav-api-helpers", keywords: "mock мок эхо echo curl fetch postman axios python заголовки headers json http статус" },
      { title: "JWT-декодер", url: "/jwt", icon: KeyRound, testId: "link-nav-jwt", keywords: "токен token jwt авторизация подпись hs256" },
      { title: "JSON-валидатор", url: "/json-validator", icon: Braces, testId: "link-nav-json-validator", keywords: "json формат минификация" },
      { title: "Безопасность", url: "/security", icon: ShieldAlert, testId: "link-nav-security", keywords: "sql инъекция xss path traversal payload" },
    ],
  },
  {
    label: "Утилиты",
    items: [
      { title: "Кодирование и хеши", url: "/encode", icon: Binary, testId: "link-nav-encode", keywords: "base64 url encode decode html hex unicode md5 sha sha256 hmac хеш" },
      { title: "Время и cron", url: "/time", icon: Clock, testId: "link-nav-time", keywords: "timestamp unix дата часовой пояс timezone cron расписание" },
      { title: "Регулярные выражения", url: "/regex", icon: Regex, testId: "link-nav-regex", keywords: "regex regexp регулярка шаблон redos" },
      { title: "Pairwise", url: "/pairwise", icon: Grid3x3, testId: "link-nav-pairwise", keywords: "попарное комбинации тест-дизайн allpairs pict" },
    ],
  },
  {
    label: "Обучение",
    items: [
      { title: "Гайды и материалы", url: "/guides", icon: BookOpen, testId: "link-nav-guides", keywords: "статьи обучение" },
    ],
  },
];

const extraTitles: Record<string, string> = {
  "/admin": "Админ-панель",
  "/admin/login": "Вход в админ-панель",
};

export function getPageTitle(location: string): string | undefined {
  for (const group of generatorGroups) {
    const item = group.items.find((i) => i.url === location);
    if (item) return item.title;
  }
  return extraTitles[location];
}

export function BrandMark({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm ${className}`}>
      <Bug className="w-[55%] h-[55%]" strokeWidth={2.25} />
    </div>
  );
}

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="px-4 pt-4 pb-2">
        <Link href="/" className="flex items-center gap-3">
          <BrandMark className="w-8 h-8" />
          <div>
            <p className="text-sm font-semibold leading-tight tracking-tight text-foreground" data-testid="text-app-title">
              QA Helper
            </p>
            <p className="text-xs text-muted-foreground leading-tight mt-0.5">
              Инструменты тестировщика
            </p>
          </div>
        </Link>
        <SearchTrigger variant="sidebar" className="mt-3" />
      </SidebarHeader>
      <SidebarContent>
        {generatorGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[11px] font-medium text-muted-foreground/80">{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                    >
                      <Link href={item.url} data-testid={item.testId}>
                        <item.icon className={location === item.url ? "w-4 h-4 text-primary" : "w-4 h-4 text-muted-foreground"} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="p-2 pb-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={location.startsWith("/admin")}
            >
              <Link href="/admin/login" data-testid="link-nav-admin">
                <Settings className={location.startsWith("/admin") ? "w-4 h-4 text-primary" : "w-4 h-4 text-muted-foreground"} />
                <span>Админ-панель</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <p className="px-2 mt-1 text-[11px] font-mono text-muted-foreground/70">
          v1.0
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
