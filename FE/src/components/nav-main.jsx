import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useLocation, useNavigate } from "react-router-dom";

export function NavMain({ items }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <SidebarMenu>
      {items.map((item) => {
        const isActive = item.url === pathname;
        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              isActive={isActive}
              tooltip={item.title}
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
