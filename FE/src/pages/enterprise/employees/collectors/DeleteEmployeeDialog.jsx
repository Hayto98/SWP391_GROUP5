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

export default function DeleteEmployeeDialog({
  open,
  onOpenChange,
  employee,
  onConfirm,
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!employee) return;
    setDeleting(true);
    try {
      await onConfirm(employee.userAccountId);
      toast.success(`Đã xóa nhân viên "${employee.fullname}" thành công!`);
      onOpenChange(false);
    } catch (err) {
      toast.error(err?.message || "Lỗi khi xóa nhân viên");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !deleting && onOpenChange(v)}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="size-5" />
            Xác nhận xóa nhân viên
          </DialogTitle>
          <DialogDescription>
            Hành động này không thể hoàn tác. Nhân viên sẽ bị xóa khỏi hệ thống.
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
            disabled={deleting}
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Xóa nhân viên
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
