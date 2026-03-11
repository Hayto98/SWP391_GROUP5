"use client";

import { SiCoop } from "react-icons/si";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenuButton,
  SidebarRail,
} from "@/components/ui/sidebar";
import { navByRole } from "@/config/sidebarConfig";
import { useAuthStore } from "@/stores/authStore";

// This is sample data.

const resolveRole = (user) => {
  if (!user) return "";
  if (typeof user.role === "string" && user.role) return user.role;

  switch (user.roleId) {
    case 1:
      return "admin";
    case 2:
      return "citizen";
    case 3:
      return "enterprise";
    case 4:
      return "collector";
    default:
      return "";
  }
};

export function AppSidebar({ ...props }) {
  const user = useAuthStore((s) => s.user);
  const role = resolveRole(user);
  const navMain = role ? navByRole[role] || [] : [];
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            <SiCoop className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">Recycle</span>
            <span className="truncate text-xs">{role}</span>
          </div>
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <NavMain items={navMain} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
