import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ImageOff, Star, Plus, Minus } from "lucide-react";

function RedeemDialog({
  isOpen,
  onClose,
  selectedVoucher,
  userPoints,
  isSubmitting,
  onConfirm,
}) {
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
    }
  }, [isOpen]);

  if (!selectedVoucher) return null;

  const maxPointsQuantity = Math.floor(
    userPoints / selectedVoucher.pointsRequired,
  );
  const maxAvailableQuantity = Math.min(
    selectedVoucher.quantityRemaining,
    maxPointsQuantity,
  );

  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (quantity < maxAvailableQuantity) {
      setQuantity(quantity + 1);
    }
  };

  const totalPointsRequired = selectedVoucher.pointsRequired * quantity;
  const pointsRemaining = userPoints - totalPointsRequired;

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
            {selectedVoucher.fileUri ? (
              <img
                src={selectedVoucher.fileUri}
                alt={selectedVoucher.title}
                className="w-24 h-24 object-cover rounded-lg"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <ImageOff className="size-6" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{selectedVoucher.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Mã:{" "}
                <span className="font-mono font-semibold">
                  {selectedVoucher.voucherCode}
                </span>
              </p>
              {selectedVoucher.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedVoucher.description}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                Số lượng còn lại: {selectedVoucher.quantityRemaining}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-b py-4">
            <span className="font-medium text-sm">Số lượng muốn đổi:</span>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={handleDecrease}
                disabled={quantity <= 1 || isSubmitting}
              >
                <Minus className="size-4" />
              </Button>
              <span className="w-8 text-center font-semibold">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={handleIncrease}
                disabled={quantity >= maxAvailableQuantity || isSubmitting}
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          <div className="pt-2 space-y-2">
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
                {totalPointsRequired}
              </span>
            </div>
            <div className="flex justify-between text-sm border-t pt-2">
              <span className="font-semibold">Điểm còn lại:</span>
              <span className="font-bold text-lg flex items-center gap-1">
                <Star className="size-5 fill-amber-500 text-amber-500" />
                {pointsRemaining}
              </span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button
            onClick={() => onConfirm(quantity)}
            disabled={
              isSubmitting || quantity < 1 || quantity > maxAvailableQuantity
            }
          >
            {isSubmitting ? "Đang đổi..." : "Xác Nhận Đổi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default RedeemDialog;
