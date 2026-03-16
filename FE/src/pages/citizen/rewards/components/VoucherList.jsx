import React from "react";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageOff, Star } from "lucide-react";

function VoucherList({ vouchers, onRedeemVoucher }) {
  if (!vouchers.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chưa có voucher khả dụng</CardTitle>
          <CardDescription>
            Hiện chưa có voucher nào được trả về từ hệ thống.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {vouchers.map((voucher) => (
        <Card
          key={voucher.voucherId}
          className="relative overflow-hidden mx-auto w-full max-w-sm pt-0 hover:shadow-lg transition-shadow flex flex-col"
        >
          {voucher.fileUri ? (
            <>
              <div className="absolute inset-0 z-30 h-64 bg-black/20" />
              <img
                src={voucher.fileUri}
                alt={voucher.title}
                className="hover:scale-105 duration-300 relative z-20 h-64 w-full object-cover brightness-90 dark:brightness-75"
              />
            </>
          ) : (
            <div className="flex h-64 w-full items-center justify-center bg-muted text-muted-foreground">
              <div className="flex flex-col items-center gap-2 text-sm">
                <ImageOff className="size-8" />
                Chưa có ảnh voucher
              </div>
            </div>
          )}
          <CardHeader className="flex-1">
            <div className="flex items-center justify-between">
              <Badge variant={voucher.canRedeem ? "default" : "secondary"}>
                {voucher.canRedeem ? "Có thể đổi" : "Chưa đủ điểm"}
              </Badge>
              <Badge variant="outline">Còn {voucher.quantityRemaining}</Badge>
            </div>
            <div className="flex items-center gap-1">
              <Star className="size-4 fill-amber-500 text-amber-500" />
              <span className="font-bold text-base">
                {voucher.pointsRequired}
              </span>
              <span className="text-xs text-muted-foreground">điểm</span>
            </div>
            <CardTitle className="text-lg">{voucher.title}</CardTitle>
            {voucher.description && (
              <CardDescription>{voucher.description}</CardDescription>
            )}
            <p className="text-xs text-muted-foreground">
              Mã:{" "}
              <span className="font-mono font-semibold">
                {voucher.voucherCode}
              </span>
            </p>
          </CardHeader>
          <CardFooter className="mt-auto">
            <Button
              onClick={() => onRedeemVoucher(voucher)}
              disabled={!voucher.canRedeem || voucher.quantityRemaining <= 0}
              className="w-full"
            >
              {voucher.quantityRemaining <= 0
                ? "Hết voucher"
                : voucher.canRedeem
                  ? "Đổi ngay"
                  : "Không đủ điểm"}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

export default VoucherList;
