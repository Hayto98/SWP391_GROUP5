import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function DeleteWasteTypeDialog({
  open,
  wasteToDelete,
  operationBusy,
  onCancel,
  onConfirm,
}) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xác nhận xóa loại rác</DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn xóa loại rác "
            <strong>{wasteToDelete?.name}</strong>"? Hành động này không thể
            hoàn tác.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={operationBusy}>
            Hủy
          </Button>
          <Button
            variant="destructive"
            disabled={operationBusy}
            onClick={onConfirm}
          >
            Xóa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
