import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Star } from "lucide-react";

function RedemptionHistory({ redemptionHistory }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Voucher Đã Đổi</CardTitle>
        <CardDescription>Danh sách voucher bạn đã đổi</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên Voucher</TableHead>
              <TableHead>Mã Voucher</TableHead>
              <TableHead className="text-right">Điểm Đã Dùng</TableHead>
              <TableHead>Ngày Đổi</TableHead>
              <TableHead>Ảnh</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {redemptionHistory.length ? (
              redemptionHistory.map((item) => (
                <TableRow key={`${item.voucherCode}-${item.redeemedAt}`}>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {item.voucherCode}
                    </code>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="flex items-center justify-end gap-1">
                      <Star className="size-3 fill-amber-500 text-amber-500" />
                      {item.pointsUsed}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(item.redeemedAt)}</TableCell>
                  <TableCell className="max-w-56 break-all text-xs text-muted-foreground">
                    {item.fileUri || "Không có"}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  Bạn chưa đổi voucher nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default RedemptionHistory;
