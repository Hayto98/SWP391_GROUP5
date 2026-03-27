import React, { useEffect, useMemo, useState } from "react";
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
import { toast } from "sonner";
import { getReportComplaints } from "@/services/citizenComplaintService";

export default function Complaints() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
  });

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    const fetchComplaints = async () => {
      setLoading(true);
      try {
        const params = {
          page,
          limit,
          ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
        };

        const response = await getReportComplaints(params);
        setComplaints(Array.isArray(response?.data) ? response.data : []);
        setPagination({
          total: Number(response?.pagination?.total || 0),
          page: Number(response?.pagination?.page || page),
          limit: Number(response?.pagination?.limit || limit),
        });
      } catch (error) {
        toast.error(error.message || "Không thể tải danh sách khiếu nại");
        setComplaints([]);
        setPagination({ total: 0, page: 1, limit });
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, [statusFilter, page]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const visibleComplaints = useMemo(() => {
    if (!dateFilter) return complaints;
    return complaints.filter((item) =>
      String(item?.createdAt || "").startsWith(dateFilter),
    );
  }, [complaints, dateFilter]);

  const canNextPage = page * limit < pagination.total;

  return (
    <Card className="p-6 w-full mx-auto space-y-6">
      <FieldGroup className="flex flex-row items-end gap-4">
        <Field>
          <FieldLabel>Trạng thái</FieldLabel>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả</SelectItem>
              <SelectItem value="OPEN">Đang xử lý</SelectItem>
              <SelectItem value="RESOLVED">Đã giải quyết</SelectItem>
              <SelectItem value="REJECTED">Từ chối</SelectItem>
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

      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead>Mã báo cáo (Waste ID)</TableHead>
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
          ) : visibleComplaints.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                Không có khiếu nại nào.
              </TableCell>
            </TableRow>
          ) : (
            visibleComplaints.map((c) => (
              <TableRow key={c.reportComplaintId}>
                <TableCell className="font-medium">{c.wasteReportId}</TableCell>
                <TableCell className="max-w-50 truncate">
                  {c.complaintReason}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      c.complaintStatus === "OPEN" ? "default" : 
                      c.complaintStatus === "REJECTED" ? "destructive" : 
                      "secondary"
                    }
                  >
                    {c.complaintStatus === "OPEN" ? "Đang chờ xử lý" : 
                     c.complaintStatus === "REJECTED" ? "Từ chối" : 
                     "Đã giải quyết"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {c.createdAt
                    ? new Date(c.createdAt).toLocaleDateString("vi-VN")
                    : "-"}
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

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Hiển thị tối đa {limit} bản ghi mỗi trang - Tổng: {pagination.total}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Trang {page}</span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage((p) => p + 1)}
            disabled={!canNextPage || loading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
