import React, { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useNotificationStore } from "@/stores/notificationStore";
import { useAuthStore } from "@/stores/authStore";
import { useNavigate } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

export function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  const role = user?.roleId || user?.role;

  useEffect(() => {
    if (role && open) {
      fetchNotifications(role);
    }
  }, [role, open, fetchNotifications]);

  useEffect(() => {
    if (role) {
      fetchNotifications(role);

      const interval = setInterval(() => fetchNotifications(role), 15000);

      const handleVisibilityOrFocus = () => {
        if (!document.hidden) {
          fetchNotifications(role);
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityOrFocus);
      window.addEventListener("focus", handleVisibilityOrFocus);

      return () => {
        clearInterval(interval);
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityOrFocus,
        );
        window.removeEventListener("focus", handleVisibilityOrFocus);
      };
    }
  }, [role, fetchNotifications]);

  const handleNotifClick = async (notif) => {
    setOpen(false); // Close popover immediately for better UX

    if (!notif.isRead) {
      await markAsRead(role, notif.notificationId);
    }

    if (notif.wasteReportId) {
      const r = Number(role);
      const roleStr = String(role).toLowerCase();

      if (r === 4 || roleStr === "citizen") {
        navigate(`/citizen/reports/${notif.wasteReportId}`);
      } else if (r === 2 || roleStr === "enterprise") {
        navigate(`/enterprise/reports/detail/${notif.wasteReportId}`);
      } else if (r === 3 || roleStr === "collector") {
        navigate(`/collector/tasks/${notif.wasteReportId}`);
      }
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full"
        >
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center p-0 text-[10px] rounded-full border-2 border-background"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 mr-4" align="end">
        <div className="flex flex-col">
          <div className="flex items-center justify-between p-4 bg-muted/30">
            <div className="flex flex-col gap-0.5">
              <h4 className="text-sm font-semibold">Thông báo</h4>
              {unreadCount > 0 && (
                <p className="text-[10px] text-muted-foreground italic">
                  Bạn có {unreadCount} thông báo mới
                </p>
              )}
            </div>
            <div className="flex gap-2 items-center">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-[11px] flex gap-1.5 text-primary hover:text-primary hover:bg-primary/5 px-2"
                  onClick={() => markAllAsRead(role)}
                >
                  <CheckCheck className="size-3.5" />
                  Đọc tất cả
                </Button>
              )}
              {loading && (
                <span className="text-[10px] animate-pulse">...</span>
              )}
            </div>
          </div>
          <Separator />
          <div className="max-h-100 overflow-y-auto overflow-x-hidden scrollbar-thin">
            {error && (
              <div className="p-4 bg-destructive/10 text-destructive text-[11px] border-b">
                Lỗi: {error}
              </div>
            )}
            {notifications.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center gap-2">
                <Bell className="size-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground font-medium">
                  Bạn chưa có thông báo nào
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.notificationId}
                  className={`p-4 border-b last:border-0 hover:bg-muted/50 transition-all cursor-pointer group relative ${
                    !notif.isRead
                      ? "bg-blue-50/50 hover:bg-blue-50"
                      : "bg-background"
                  }`}
                  onClick={() => handleNotifClick(notif)}
                >
                  {!notif.isRead && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                  )}
                  <div className="flex flex-col gap-1 pr-2">
                    <p
                      className={`text-sm leading-snug ${!notif.isRead ? "font-bold text-foreground" : "text-muted-foreground"}`}
                    >
                      {notif.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-muted-foreground/80 flex items-center gap-1">
                        {formatDistanceToNow(new Date(notif.createdAt), {
                          addSuffix: true,
                          locale: vi,
                        })}
                      </p>
                      {!notif.isRead && (
                        <div className="size-2 bg-primary rounded-full animate-pulse" />
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
