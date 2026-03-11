import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { updateUser } from "@/services/adminService";

export function EditUserModal({ open, onOpenChange, user, onSuccess }) {
  const [fullname, setFullname] = useState("");
  const [phone, setPhone] = useState("");
  const [roleId, setRoleId] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && user) {
      setFullname(user.fullname || "");
      setPhone(user.phone || "");
      setRoleId(String(user.roleId || ""));
      setIsLocked(!!user.isLocked);
      setBanReason(user.banReason || "");
    }
  }, [open, user]);

  if (!user) return null;

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      await updateUser(user.userAccountId, {
        fullname,
        phone,
        roleId: roleId ? parseInt(roleId, 10) : undefined,
        isLocked,
        banReason: banReason || undefined,
      });
      toast.success("Cập nhật thành công!");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(error.message || "Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa người dùng</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin của người dùng
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
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
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Tên người dùng</Label>
              <Input
                id="edit-name"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={user.email}
                disabled
                className="mt-1 bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Email không thể thay đổi
              </p>
            </div>
            <div>
              <Label htmlFor="edit-phone">Số điện thoại</Label>
              <Input
                id="edit-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-role">Vai trò</Label>
              <Select value={roleId} onValueChange={setRoleId}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="1">Quản trị viên</SelectItem>
                    <SelectItem value="2">Doanh nghiệp</SelectItem>
                    <SelectItem value="3">Người thu gom</SelectItem>
                    <SelectItem value="4">Cư dân</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-status">Trạng thái</Label>
              <Select
                value={isLocked ? "locked" : "active"}
                onValueChange={(v) => setIsLocked(v === "locked")}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="active">Đang hoạt động</SelectItem>
                    <SelectItem value="locked">Bị khoá</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-ban-reason">Lý do khoá (nếu bị khoá)</Label>
              <Input
                id="edit-ban-reason"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Nhập lý do khoá tài khoản"
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
