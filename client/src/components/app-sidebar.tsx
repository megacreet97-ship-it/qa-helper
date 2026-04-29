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
} from "lucide-react";

const generatorGroups = [
  {
    label: "Генераторы данных",
    items: [
      { title: "Персональные данные", url: "/", icon: User, testId: "link-nav-personal-data" },
      { title: "Текст", url: "/text", icon: Type, testId: "link-nav-text" },
      { title: "Сравнение текстов", url: "/compare", icon: ArrowLeftRight, testId: "link-nav-compare" },
      { title: "Сравнение HTML", url: "/html-compare", icon: Code2, testId: "link-nav-html-compare" },
    ],
  },
  {
    label: "Файлы и медиа",
    items: [
      { title: "Изображения", url: "/images", icon: Image, testId: "link-nav-images" },
      { title: "Файлы", url: "/files", icon: FileText, testId: "link-nav-files" },
      { title: "Аудио и видео", url: "/media", icon: Music, testId: "link-nav-media" },
    ],
  },
  {
    label: "API и безопасность",
    items: [
      { title: "API-помощники", url: "/api", icon: Globe, testId: "link-nav-api-helpers" },
      { title: "JWT-декодер", url: "/jwt", icon: KeyRound, testId: "link-nav-jwt" },
      { title: "JSON-валидатор", url: "/json-validator", icon: Braces, testId: "link-nav-json-validator" },
      { title: "Безопасность", url: "/security", icon: ShieldAlert, testId: "link-nav-security" },
    ],
  },
  {
    label: "Обучение",
    items: [
      { title: "Гайды и материалы", url: "/guides", icon: BookOpen, testId: "link-nav-guides" },
    ],
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary">
            <Bug className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight tracking-tight" data-testid="text-app-title">
              QA Helper
            </h1>
            <p className="text-xs text-muted-foreground leading-tight">
              Набор инструментов
            </p>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {generatorGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                    >
                      <Link href={item.url} data-testid={item.testId}>
                        <item.icon className="w-4 h-4" />
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
      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={location.startsWith("/admin")}
            >
              <Link href="/admin/login" data-testid="link-nav-admin">
                <Settings className="w-4 h-4" />
                <span>Админ-панель</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <p className="text-xs text-muted-foreground mt-2">
          QA Helper v1.0
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
