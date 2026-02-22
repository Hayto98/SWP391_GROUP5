import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";

export function ViewUserModal({ open, onOpenChange, user }) {
  if (!user) return null;

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
              <img src={user.avatar} alt={user.name} />
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">{user.name}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>ID:</Label>
              <span className="font-medium">{user.id}</span>
            </div>
            <div className="flex items-center justify-between">
              <Label>Số điện thoại:</Label>
              <span className="font-medium">{user.phone}</span>
            </div>
            <div className="flex items-center justify-between">
              <Label>Vai trò:</Label>
              <Badge variant={user.roleVariant}>{user.role}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <Label>Trạng thái:</Label>
              <span
                className={
                  user.status === "active"
                    ? "text-green-600 font-medium"
                    : "text-red-600 font-medium"
                }
              >
                {user.status === "active" ? "Đang hoạt động" : "Bị khoá"}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
