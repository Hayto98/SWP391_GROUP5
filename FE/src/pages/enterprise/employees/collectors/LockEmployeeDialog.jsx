import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function LockEmployeeDialog({
  open,
  onOpenChange,
  employee,
  onConfirm,
}) {
  const [locking, setLocking] = useState(false);

  async function handleLock() {
    if (!employee) return;
    setLocking(true);
    try {
      await onConfirm(employee.userAccountId);
      toast.success(`Đã khóa nhân viên "${employee.fullname}" thành công!`);
      onOpenChange(false);
    } catch (err) {
      toast.error(err?.message || "Lỗi khi khóa nhân viên");
    } finally {
      setLocking(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !locking && onOpenChange(v)}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="size-5" />
            Xác nhận khóa nhân viên
          </DialogTitle>
          <DialogDescription>
            Hành động này sẽ khóa tài khoản, nhân viên sẽ không thể đăng nhập.
          </DialogDescription>
        </DialogHeader>

        {employee && (
          <div className="rounded-md border border-red-100 bg-red-50/50 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">
              {employee.fullname}
            </p>
            <p className="text-xs text-muted-foreground">{employee.email}</p>
            <p className="text-xs text-muted-foreground">{employee.phone}</p>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={locking}
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleLock}
            disabled={locking}
          >
            {locking && <Loader2 className="mr-2 size-4 animate-spin" />}
            Khóa tài khoản
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
