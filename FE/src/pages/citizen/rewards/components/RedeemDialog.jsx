import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";

function RedeemDialog({
  isOpen,
  onClose,
  selectedVoucher,
  userPoints,
  onConfirm,
}) {
  if (!selectedVoucher) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xác Nhận Đổi Voucher</DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn đổi voucher này không?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-start gap-4">
            <img
              src={selectedVoucher.image}
              alt={selectedVoucher.voucher_name}
              className="w-24 h-24 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-lg">
                {selectedVoucher.voucher_name}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Mã:{" "}
                <span className="font-mono font-semibold">
                  {selectedVoucher.voucher_code}
                </span>
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {selectedVoucher.terms_description}
              </p>
            </div>
          </div>
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Điểm hiện tại:</span>
              <span className="font-semibold flex items-center gap-1">
                <Star className="size-4 fill-amber-500 text-amber-500" />
                {userPoints}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Điểm cần dùng:</span>
              <span className="font-semibold text-red-600 flex items-center gap-1">
                <Star className="size-4 fill-red-500 text-red-500" />-
                {selectedVoucher.points_required}
              </span>
            </div>
            <div className="flex justify-between text-sm border-t pt-2">
              <span className="font-semibold">Điểm còn lại:</span>
              <span className="font-bold text-lg flex items-center gap-1">
                <Star className="size-5 fill-amber-500 text-amber-500" />
                {userPoints - selectedVoucher.points_required}
              </span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={onConfirm}>Xác Nhận Đổi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default RedeemDialog;
