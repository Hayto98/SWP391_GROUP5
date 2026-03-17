import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Outlet, useLocation } from "react-router-dom";
import { navByRole } from "@/config/sidebarConfig";

import { NotificationBell } from "@/components/NotificationBell";

export default function DashboardLayout() {
  const { pathname } = useLocation();

  const getMatchScore = (url) => {
    if (!url) return -1;
    if (pathname === url) return url.length + 1000;
    if (pathname.startsWith(`${url}/`)) return url.length;
    return -1;
  };

  const findBestMatch = (items, best = { title: null, score: -1 }) => {
    for (const item of items || []) {
      const score = getMatchScore(item.url);
      if (score > best.score) {
        best = { title: item.title, score };
      }

      if (item.items?.length) {
        best = findBestMatch(item.items, best);
      }
    }

    return best;
  };

  // Tìm title từ navByRole dựa trên pathname
  const getCurrentTitle = () => {
    let best = { title: null, score: -1 };
    for (const role in navByRole) {
      best = findBestMatch(navByRole[role], best);
    }

    return best.title || "Dashboard";
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbPage>{getCurrentTitle()}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
