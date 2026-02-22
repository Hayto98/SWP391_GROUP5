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
import { Star, Calendar } from "lucide-react";

function VoucherList({ vouchers, userPoints, onRedeemVoucher }) {
  const getCategoryColor = (category) => {
    const colors = {
      discount: "bg-blue-100 text-blue-700",
      shipping: "bg-green-100 text-green-700",
      gift: "bg-purple-100 text-purple-700",
      environment: "bg-emerald-100 text-emerald-700",
    };
    return colors[category] || "bg-gray-100 text-gray-700";
  };

  const getCategoryLabel = (category) => {
    const labels = {
      discount: "Giảm giá",
      shipping: "Vận chuyển",
      gift: "Quà tặng",
      environment: "Môi trường",
    };
    return labels[category] || category;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {vouchers.map((voucher) => (
        <Card
          key={voucher.voucher_id}
          className="relative overflow-hidden mx-auto w-full max-w-sm pt-0 hover:shadow-lg transition-shadow flex flex-col"
        >
          <div className="absolute inset-0 z-30 h-64 bg-black/20 " />
          <img
            src={voucher.image}
            alt={voucher.voucher_name}
            className="hover:scale-105 duration-300 relative z-20 h-64 w-full object-cover brightness-90 dark:brightness-75"
          />
          <CardHeader className="flex-1">
            <div className="flex items-center justify-between">
              <Badge className={getCategoryColor(voucher.category)}>
                {getCategoryLabel(voucher.category)}
              </Badge>
              <div className="flex items-center gap-1">
                <Star className="size-4 fill-amber-500 text-amber-500" />
                <span className="font-bold text-base">
                  {voucher.points_required}
                </span>
                <span className="text-xs text-muted-foreground">điểm</span>
              </div>
            </div>
            <CardTitle className="text-lg">{voucher.voucher_name}</CardTitle>
            <CardDescription>{voucher.terms_description}</CardDescription>
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
              <Calendar className="size-3" />
              HSD: {voucher.expiry_date}
            </div>
            <p className="text-xs text-muted-foreground">
              Mã:{" "}
              <span className="font-mono font-semibold">
                {voucher.voucher_code}
              </span>
            </p>
          </CardHeader>
          <CardFooter className="mt-auto">
            <Button
              onClick={() => onRedeemVoucher(voucher)}
              disabled={userPoints < voucher.points_required}
              className="w-full"
            >
              {userPoints < voucher.points_required
                ? "Không đủ điểm"
                : "Đổi ngay"}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

export default VoucherList;
