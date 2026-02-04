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

function PointHistory({ pointTransactions }) {
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
        <CardTitle>Lịch Sử Giao Dịch Điểm</CardTitle>
        <CardDescription>Theo dõi các giao dịch điểm của bạn</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nội Dung</TableHead>
              <TableHead className="text-right">Điểm Thay Đổi</TableHead>
              <TableHead>Thời Gian</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pointTransactions.map((transaction) => (
              <TableRow key={transaction.point_transaction_id}>
                <TableCell className="font-medium">
                  {transaction.transaction_reason}
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={`font-bold flex items-center justify-end gap-1 ${
                      transaction.points_delta > 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {transaction.points_delta > 0 ? "+" : ""}
                    {transaction.points_delta}
                    <Star className="size-3" />
                  </span>
                </TableCell>
                <TableCell>{formatDate(transaction.created_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default PointHistory;
