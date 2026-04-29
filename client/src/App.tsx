import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
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
      <Route path="/guides" component={GuidesPage} />
      <Route path="/admin/login" component={AdminLoginPage} />
      <Route path="/admin" component={AdminPanelPage} />
      <Route component={NotFound} />
    </Switch>
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
          <SidebarProvider style={style as React.CSSProperties}>
            <div className="flex h-screen w-full">
              <AppSidebar />
              <div className="flex flex-col flex-1 min-w-0">
                <header className="flex items-center justify-between gap-2 p-2 border-b sticky top-0 z-50 bg-background">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <ThemeToggle />
                </header>
                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                  <Router />
                </main>
              </div>
            </div>
          </SidebarProvider>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
