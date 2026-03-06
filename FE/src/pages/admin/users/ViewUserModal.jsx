import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";

// 1=ADMIN, 2=ENTERPRISE, 3=COLLECTOR, 4=CITIZEN
const ROLE_LABELS = {
  1: "Quản trị viên",
  2: "Doanh nghiệp",
  3: "Người thu gom",
  4: "Cư dân",
};

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("vi-VN");
}

export function ViewUserModal({ open, onOpenChange, user, loading = false }) {
  if (!open) return null;

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-125">
          <DialogHeader>
            <DialogTitle>Thông tin người dùng</DialogTitle>
            <DialogDescription>Đang tải thông tin người dùng</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Đang tải...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!user) return null;

  const roleLabel = ROLE_LABELS[user.roleId] || "Chưa xác định";
  const isLocked = Number(user.isLocked) === 1;
  const emailVerified = Number(user.emailVerified) === 1;
  const status = isLocked ? "locked" : "active";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Thông tin người dùng</DialogTitle>
          <DialogDescription>
            Chi tiết thông tin của người dùng
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback>
                {user.fullname
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2) || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">{user.fullname}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>ID:</Label>
              <span className="font-mono text-xs">{user.userAccountId}</span>
            </div>
            <div className="flex items-center justify-between">
              <Label>Số điện thoại:</Label>
              <span className="font-medium">{user.phone || "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <Label>Vai trò:</Label>
              <Badge variant="secondary">{roleLabel}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <Label>Trạng thái:</Label>
              <span
                className={
                  status === "active"
                    ? "text-green-600 font-medium"
                    : "text-red-600 font-medium"
                }
              >
                {status === "active" ? "Đang hoạt động" : "Bị khoá"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <Label>Email xác minh:</Label>
              <span className="font-medium">
                {emailVerified ? "Đã xác minh" : "Chưa xác minh"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <Label>Số lần collector bị từ chối:</Label>
              <span className="font-medium">
                {user.collectorRejectCount ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <Label>Số lần đăng nhập sai:</Label>
              <span className="font-medium">{user.failedLoginCount ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <Label>Đăng nhập gần nhất:</Label>
              <span className="font-medium">
                {formatDateTime(user.lastLoginAt)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <Label>Lý do khoá:</Label>
              <span className="font-medium">{user.banReason || "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <Label>Ngày tạo:</Label>
              <span className="font-medium">
                {formatDateTime(user.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
