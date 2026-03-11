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
import { Badge } from "@/components/ui/badge";
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
              <TableHead className="text-center">Trạng Thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {redemptionHistory.map((item) => (
              <TableRow key={item.voucher_redemption_id}>
                <TableCell className="font-medium">
                  {item.voucher_name}
                </TableCell>
                <TableCell>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {item.voucher_code}
                  </code>
                </TableCell>
                <TableCell className="text-right">
                  <span className="flex items-center justify-end gap-1">
                    <Star className="size-3 fill-amber-500 text-amber-500" />
                    {item.points_used}
                  </span>
                </TableCell>
                <TableCell>{formatDate(item.redeemed_at)}</TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={item.status === "active" ? "default" : "secondary"}
                  >
                    {item.status === "active" ? "Đang dùng" : "Đã dùng"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default RedemptionHistory;
