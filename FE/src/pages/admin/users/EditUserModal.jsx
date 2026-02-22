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
import { Avatar } from "@/components/ui/avatar";

export function EditUserModal({ open, onOpenChange, user }) {
  if (!user) return null;

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
              <img src={user.avatar} alt={user.name} />
            </Avatar>
            <Button variant="outline" size="sm">
              Thay đổi ảnh
            </Button>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Tên người dùng</Label>
              <Input id="edit-name" defaultValue={user.name} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                defaultValue={user.email}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-phone">Số điện thoại</Label>
              <Input
                id="edit-phone"
                type="tel"
                defaultValue={user.phone}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-role">Vai trò</Label>
              <Select defaultValue={user.role}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="Quản trị viên">Quản trị viên</SelectItem>
                    <SelectItem value="Cư dân">Cư dân</SelectItem>
                    <SelectItem value="Doanh nghiệp">Doanh nghiệp</SelectItem>
                    <SelectItem value="Người thu gom">Người thu gom</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-status">Trạng thái</Label>
              <Select defaultValue={user.status === "active" ? "1" : "2"}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="1">Đang hoạt động</SelectItem>
                    <SelectItem value="2">Bị khoá</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button onClick={() => onOpenChange(false)}>Lưu thay đổi</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
