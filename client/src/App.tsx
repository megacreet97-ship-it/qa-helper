import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar, BrandMark, getPageTitle } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { CommandPaletteProvider, SearchTrigger } from "@/components/command-palette";
import NotFound from "@/pages/not-found";
import PersonalDataPage from "@/pages/personal-data";
import TextGeneratorsPage from "@/pages/text-generators";
import ImageGeneratorsPage from "@/pages/image-generators";
import FileGeneratorsPage from "@/pages/file-generators";
import ApiHelpersPage from "@/pages/api-helpers";
import SecurityHelpersPage from "@/pages/security-helpers";
import JwtDecoderPage from "@/pages/jwt-decoder";
import TextComparePage from "@/pages/text-compare";
import GuidesPage from "@/pages/guides";
import AdminLoginPage from "@/pages/admin-login";
import AdminPanelPage from "@/pages/admin-panel";
import JsonValidatorPage from "@/pages/json-validator";
import HtmlComparePage from "@/pages/html-compare";
import MediaGeneratorsPage from "@/pages/media-generators";
import EncodePage from "@/pages/encode";
import TimeToolsPage from "@/pages/time-tools";
import RegexPage from "@/pages/regex";
import PairwisePage from "@/pages/pairwise";

function Router() {
  return (
    <Switch>
      <Route path="/" component={PersonalDataPage} />
      <Route path="/text" component={TextGeneratorsPage} />
      <Route path="/images" component={ImageGeneratorsPage} />
      <Route path="/files" component={FileGeneratorsPage} />
      <Route path="/media" component={MediaGeneratorsPage} />
      <Route path="/api" component={ApiHelpersPage} />
      <Route path="/jwt" component={JwtDecoderPage} />
      <Route path="/json-validator" component={JsonValidatorPage} />
      <Route path="/security" component={SecurityHelpersPage} />
      <Route path="/compare" component={TextComparePage} />
      <Route path="/html-compare" component={HtmlComparePage} />
      <Route path="/encode" component={EncodePage} />
      <Route path="/time" component={TimeToolsPage} />
      <Route path="/regex" component={RegexPage} />
      <Route path="/pairwise" component={PairwisePage} />
      <Route path="/guides" component={GuidesPage} />
      <Route path="/admin/login" component={AdminLoginPage} />
      <Route path="/admin" component={AdminPanelPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppHeader() {
  const [location] = useLocation();
  const title = getPageTitle(location);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-3">
      <SidebarTrigger data-testid="button-sidebar-toggle" aria-label="Показать или скрыть меню" />
      <div className="h-4 w-px bg-border" aria-hidden="true" />
      <div className="flex min-w-0 items-center gap-2">
        <BrandMark className="w-6 h-6 md:hidden" />
        <span className="truncate text-sm font-medium" data-testid="text-header-title">
          {title ?? "QA Helper"}
        </span>
      </div>
      <div className="ml-auto flex items-center gap-1">
        <SearchTrigger variant="icon" className="md:hidden" />
        <ThemeToggle />
      </div>
    </header>
  );
}

function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <CommandPaletteProvider>
          <SidebarProvider style={style as React.CSSProperties}>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
            >
              Перейти к содержимому
            </a>
            <div className="flex h-dvh w-full">
              <AppSidebar />
              <div className="flex flex-col flex-1 min-w-0">
                <AppHeader />
                <main id="main" className="flex-1 overflow-y-auto px-4 pt-6 pb-16 md:px-10 md:pt-10">
                  <Router />
                </main>
              </div>
            </div>
          </SidebarProvider>
          </CommandPaletteProvider>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
