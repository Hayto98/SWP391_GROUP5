import React, { useState, useEffect } from "react";
import { Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

export default function Complaints() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // States cho Filter & Pagination
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10; // Fix cứng pagination là 10

  const fetchComplaints = () => {
    setLoading(true);
    // Giả lập gọi API: GET /citizen/report-complaints
    setTimeout(() => {
      const mockData = [
        {
          reportComplaintId: "COMP-2026-001",
          wasteReportId: "WR-8829-X1",
          complaintReason:
            "Nhân viên chưa đến lấy rác dù đã quá lịch hẹn 2 ngày.",
          complaintStatus: "OPEN",
          adminResponse: null,
          createdAt: "2026-03-10T08:30:00Z",
          attachments: [{ fileUri: "https://placehold.co/100" }],
        },
        {
          reportComplaintId: "COMP-2026-002",
          wasteReportId: "WR-1102-Y5",
          complaintReason:
            "Báo cáo đã thu gom thành công nhưng thực tế rác vẫn còn tại điểm tập kết.",
          complaintStatus: "OPEN",
          adminResponse: null,
          createdAt: "2026-03-11T14:15:00Z",
          attachments: [],
        },
        {
          reportComplaintId: "COMP-2026-003",
          wasteReportId: "WR-9940-Z9",
          complaintReason:
            "Rác rơi vãi ra đường trong quá trình vận chuyển của collector.",
          complaintStatus: "RESOLVED",
          adminResponse:
            "Chúng tôi đã cử đội vệ sinh đến dọn dẹp và nhắc nhở nhân viên thu gom. Xin lỗi vì sự bất tiện này.",
          createdAt: "2026-03-05T10:00:00Z",
          attachments: [
            { fileUri: "https://placehold.co/100" },
            { fileUri: "https://placehold.co/100" },
          ],
        },
      ];

      // Logic lọc đơn giản tại client để bạn test giao diện
      const filtered = mockData.filter((item) => {
        const matchesStatus =
          statusFilter === "ALL" || item.complaintStatus === statusFilter;
        const matchesDate =
          !dateFilter || item.createdAt.startsWith(dateFilter);
        return matchesStatus && matchesDate;
      });

      setComplaints(filtered);
      setLoading(false);
    }, 600);
  };

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter, dateFilter, page]);

  return (
    <Card className="p-6 w-full mx-auto space-y-6">
      {/* Một FieldGroup duy nhất cho tất cả bộ lọc và nút bấm */}
      <FieldGroup className="flex flex-row items-end gap-4">
        <Field>
          <FieldLabel>Trạng thái</FieldLabel>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả</SelectItem>
              <SelectItem value="OPEN">Mở</SelectItem>
              <SelectItem value="RESOLVED">Đã giải quyết</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel>Ngày tạo khiếu nại</FieldLabel>
          <Input
            type="date"
            className="w-44"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </Field>
      </FieldGroup>

      {/* Table */}
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead>Mã Báo cáo (Waste ID)</TableHead>
            <TableHead>Lý do khiếu nại</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Ngày tạo</TableHead>
            <TableHead className="text-right">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8">
                Đang tải...
              </TableCell>
            </TableRow>
          ) : complaints.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                Không có khiếu nại nào.
              </TableCell>
            </TableRow>
          ) : (
            complaints.map((c) => (
              <TableRow key={c.reportComplaintId}>
                <TableCell className="font-medium">{c.wasteReportId}</TableCell>
                <TableCell className="max-w-50 truncate">
                  {c.complaintReason}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      c.complaintStatus === "OPEN" ? "default" : "secondary"
                    }
                  >
                    {c.complaintStatus === "OPEN" ? "Mở" : "Đã giải quyết"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(c.createdAt).toLocaleDateString("vi-VN")}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      navigate(`/citizen/complaints/${c.reportComplaintId}`)
                    }
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination - Fix 10 items/page */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Hiển thị tối đa {limit} bản ghi mỗi trang
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Trang {page}</span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage((p) => p + 1)}
            disabled={complaints.length < limit}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
