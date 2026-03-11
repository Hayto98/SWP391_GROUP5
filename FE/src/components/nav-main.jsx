import { ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { useLocation, useNavigate } from "react-router-dom";

export function NavMain({ items }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const getMatchScore = (url) => {
    if (!url) return -1;
    if (pathname === url) return url.length + 1000;
    if (pathname.startsWith(`${url}/`)) return url.length;
    return -1;
  };

  const collectUrls = (list, acc = []) => {
    for (const item of list || []) {
      if (item.url) {
        acc.push(item.url);
      }

      if (item.items?.length) {
        collectUrls(item.items, acc);
      }
    }

    return acc;
  };

  const allUrls = collectUrls(items);
  let activeUrl = null;
  let bestScore = -1;
  for (const url of allUrls) {
    const score = getMatchScore(url);
    if (score > bestScore) {
      bestScore = score;
      activeUrl = url;
    }
  }

  const isRouteActive = (url) => {
    if (!url) return false;
    return activeUrl === url;
  };

  const isGroupActive = (item) => {
    if (isRouteActive(item.url)) {
      return true;
    }

    if (!item.items?.length) {
      return false;
    }

    return item.items.some((subItem) => isRouteActive(subItem.url));
  };

  return (
    <SidebarMenu>
      {items.map((item) => {
        if (item.items?.length) {
          const groupActive = isGroupActive(item);

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={groupActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    isActive={groupActive}
                    tooltip={item.title}
                    className="hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    <item.icon />
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((subItem) => {
                      const subActive = isRouteActive(subItem.url);
                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={subActive}
                            className="hover:bg-emerald-50 hover:text-emerald-700"
                          >
                            <button
                              type="button"
                              onClick={() => navigate(subItem.url)}
                            >
                              <span>{subItem.title}</span>
                            </button>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        }

        const isActive = isRouteActive(item.url);
        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              isActive={isActive}
              tooltip={item.title}
              className="hover:bg-emerald-50 hover:text-emerald-700"
              onClick={() => navigate(item.url)}
            >
              <item.icon />
              <span>{item.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
