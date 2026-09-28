import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { generatorGroups } from "@/components/app-sidebar";
import { useTheme } from "@/components/theme-provider";
import { CornerDownRight, Moon, Search, Settings, Sun } from "lucide-react";

// Direct links to tabs inside tools: [title, url, keywords]
const TAB_SHORTCUTS: [string, string, string][] = [
  ["СНИЛС", "/?tab=snils", "страховой номер"],
  ["ФИО", "/?tab=fio", "имя фамилия отчество"],
  ["Даты рождения", "/?tab=dates", "дата граничные"],
  ["Телефоны", "/?tab=phone", "номер"],
  ["Email-адреса", "/?tab=email", "почта"],
  ["UUID и ID", "/?tab=ids", "guid идентификатор"],
  ["Текст по длине", "/?tab=text", "символы длина"],
  ["Lorem Ipsum", "/text?tab=lorem", "рыба"],
  ["Unicode и эмодзи", "/text?tab=unicode", "emoji"],
  ["Битые изображения", "/images?tab=broken", "corrupted"],
  ["Мок-API", "/api?tab=mock", "mock статус задержка"],
  ["Эхо / HTTP-клиент", "/api?tab=echo", "echo запрос"],
  ["Конвертер curl", "/api?tab=curl", "fetch axios python postman"],
  ["HTTP-заголовки", "/api?tab=headers", "headers cookie authorization"],
  ["Создать JWT", "/jwt?tab=create", "подписать токен hs256"],
  ["Хеши MD5 / SHA", "/encode?tab=hash", "hmac sha256"],
  ["Cron-выражения", "/time?tab=cron", "расписание"],
  ["SQL-инъекции", "/security?tab=sql", "injection"],
  ["XSS-пейлоады", "/security?tab=xss", "script"],
  ["Обход путей", "/security?tab=path", "path traversal ../"],
  ["Длинные строки", "/security?tab=long", "переполнение"],
];

const PaletteContext = createContext<{ open: () => void }>({ open: () => {} });

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

/** Search trigger: "sidebar" — full-width field under the logo; "icon" — compact button for the mobile header. */
export function SearchTrigger({ variant, className = "" }: { variant: "sidebar" | "icon"; className?: string }) {
  const { open } = useContext(PaletteContext);

  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={open}
        className={className}
        aria-label="Поиск по инструментам"
        data-testid="button-search-icon"
      >
        <Search className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={open}
      className={`flex h-9 w-full items-center gap-2 rounded-md border border-sidebar-border bg-background px-2.5 text-sm text-muted-foreground shadow-2xs transition-[border-color,color] duration-150 hover:border-foreground/25 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
      aria-label="Поиск по инструментам"
      data-testid="button-command-palette"
    >
      <Search className="w-4 h-4 shrink-0" />
      <span className="truncate">Найти инструмент</span>
      <kbd className="ml-auto shrink-0 whitespace-nowrap rounded border bg-muted px-1.5 font-mono text-[10px] leading-4">
        {isMac ? "⌘" : "Ctrl"} K
      </kbd>
    </button>
  );
}

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (url: string) => {
    setOpen(false);
    navigate(url);
  };

  return (
    <PaletteContext.Provider value={{ open: () => setOpen(true) }}>
      {children}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <DialogTitle className="sr-only">Поиск по инструментам</DialogTitle>
        <CommandInput placeholder="Base64, мок, СНИЛС, cron…" data-testid="input-command" />
        <CommandList className="max-h-[60vh]">
          <CommandEmpty>Ничего не найдено</CommandEmpty>
          {generatorGroups.map((group) => (
            <CommandGroup key={group.label} heading={group.label}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.url}
                  value={item.title}
                  keywords={item.keywords?.split(" ")}
                  onSelect={() => go(item.url)}
                >
                  <item.icon className="text-muted-foreground" />
                  {item.title}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
          <CommandGroup heading="Вкладки">
            {TAB_SHORTCUTS.map(([title, url, keywords]) => (
              <CommandItem key={url} value={title} keywords={keywords.split(" ")} onSelect={() => go(url)}>
                <CornerDownRight className="text-muted-foreground" />
                {title}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Прочее">
            <CommandItem
              value="Сменить тему"
              keywords={["тёмная", "светлая", "dark", "light", "theme"]}
              onSelect={() => {
                toggleTheme();
                setOpen(false);
              }}
            >
              {theme === "dark" ? <Sun className="text-muted-foreground" /> : <Moon className="text-muted-foreground" />}
              {theme === "dark" ? "Светлая тема" : "Тёмная тема"}
            </CommandItem>
            <CommandItem value="Админ-панель" keywords={["admin", "статьи"]} onSelect={() => go("/admin/login")}>
              <Settings className="text-muted-foreground" />
              Админ-панель
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </PaletteContext.Provider>
  );
}
