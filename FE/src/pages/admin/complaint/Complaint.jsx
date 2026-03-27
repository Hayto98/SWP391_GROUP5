import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  getComplaints,
  getComplaintDetail,
  resolveComplaint,
  rejectComplaint,
} from "@/services/adminComplaintService";

const STATUS_OPTIONS = ["ALL", "PENDING", "RESOLVED", "REJECTED"];
const PAGE_SIZE_OPTIONS = ["5", "10", "20"];

const STATUS_DISPLAY = {
  OPEN: "PENDING",
  PENDING: "PENDING",
  RESOLVED: "RESOLVED",
  REJECTED: "REJECTED",
};

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN");
}

function shortId(id) {
  if (!id || id.length < 12) return id;
  return `${id.slice(0, 8)}...${id.slice(-4)}`;
}

function getStatusBadgeVariant(status) {
  const display = STATUS_DISPLAY[status] || status;
  if (display === "PENDING") return "secondary";
  if (display === "RESOLVED") return "default";
  return "destructive";
}

function Complaint() {
  const [listData, setListData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, size: 10, totalElements: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [citizenKeyword, setCitizenKeyword] = useState("");

  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);

  const [selectedDetail, setSelectedDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [adminResponse, setAdminResponse] = useState("");
  const [refundPoints, setRefundPoints] = useState(0);
  const [openDetail, setOpenDetail] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getComplaints({
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        page,
        size,
      });
      setListData(result.data || []);
      setPagination(result.pagination || { page: 1, size: 10, totalElements: 0, totalPages: 1 });
    } catch (error) {
      toast.error("Lỗi khi tải danh sách khiếu nại: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, fromDate, toDate, page, size]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const filteredRows = useMemo(() => {
    if (!citizenKeyword) return listData;
    return listData.filter((row) =>
      row.citizenName?.toLowerCase().includes(citizenKeyword.toLowerCase())
    );
  }, [citizenKeyword, listData]);

  const openDetailDialog = async (complaintId) => {
    setDetailLoading(true);
    setOpenDetail(true);
    try {
      const result = await getComplaintDetail(complaintId);
      const detail = result.data || result;
      setSelectedDetail(detail);
      setAdminResponse(detail.adminResponse || "");
      setRefundPoints(detail.refundPoints || 0);
    } catch (error) {
      toast.error("Lỗi khi tải chi tiết khiếu nại: " + error.message);
      setOpenDetail(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const resetFilters = () => {
    setStatusFilter("ALL");
    setFromDate("");
    setToDate("");
    setCitizenKeyword("");
    setPage(1);
  };

  const isPending = (status) => {
    return status === "PENDING" || status === "OPEN";
  };

  const handleResolve = async () => {
    if (!selectedDetail) return;
    if (!isPending(selectedDetail.status)) {
      toast.error("Chỉ có thể xử lý khiếu nại ở trạng thái PENDING.");
      return;
    }
    if (!adminResponse.trim()) {
      toast.error("Phản hồi admin không được để trống.");
      return;
    }
    if (refundPoints < 0) {
      toast.error("Điểm hoàn phải lớn hơn hoặc bằng 0.");
      return;
    }

    setActionLoading(true);
    try {
      await resolveComplaint(selectedDetail.complaintId, {
        adminResponse: adminResponse.trim(),
        refundPoints: Number(refundPoints),
      });
      toast.success("Khiếu nại đã được xử lý và hoàn điểm thành công", {
        description: `Điểm hoàn: ${Number(refundPoints)}`,
      });
      setOpenDetail(false);
      fetchList();
    } catch (error) {
      toast.error("Lỗi: " + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedDetail) return;
    if (!isPending(selectedDetail.status)) {
      toast.error("Chỉ có thể từ chối khiếu nại ở trạng thái PENDING.");
      return;
    }
    if (!adminResponse.trim()) {
      toast.error("Phản hồi admin không được để trống.");
      return;
    }

    setActionLoading(true);
    try {
      await rejectComplaint(selectedDetail.complaintId, {
        adminResponse: adminResponse.trim(),
      });
      toast.success("Khiếu nại đã bị từ chối.");
      setOpenDetail(false);
      fetchList();
    } catch (error) {
      toast.error("Lỗi: " + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Quản lý khiếu nại</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Lọc theo trạng thái" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status === "ALL" ? "Tất cả" : status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              placeholder="Từ ngày"
            />

            <Input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              placeholder="Đến ngày"
            />

            <Input
              placeholder="Tìm theo tên người gửi"
              value={citizenKeyword}
              onChange={(e) => {
                setCitizenKeyword(e.target.value);
                setPage(1);
              }}
            />

            <Button variant="outline" onClick={resetFilters}>
              Đặt lại bộ lọc
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Người gửi</TableHead>
                <TableHead>Collector</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Tạo lúc</TableHead>
                <TableHead>Xử lý lúc</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Không có dữ liệu phù hợp bộ lọc.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((row) => (
                  <TableRow key={row.complaintId}>
                    <TableCell className="font-mono text-xs">{shortId(row.complaintId)}</TableCell>
                    <TableCell>{row.citizenName}</TableCell>
                    <TableCell>{row.collectorName || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(row.status)}>
                        {STATUS_DISPLAY[row.status] || row.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(row.createdAt)}</TableCell>
                    <TableCell>{formatDateTime(row.resolvedAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" onClick={() => openDetailDialog(row.complaintId)}>
                        Xem chi tiết
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              Tổng: {pagination.totalElements} bản ghi
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <span>Mỗi trang</span>
                <Select
                  value={String(size)}
                  onValueChange={(value) => {
                    setSize(Number(value));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[80px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Pagination className="justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPage((prev) => Math.max(1, prev - 1));
                      }}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#" isActive>
                      {page}/{pagination.totalPages}
                    </PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPage((prev) => Math.min(pagination.totalPages, prev + 1));
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={openDetail} onOpenChange={setOpenDetail}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết khiếu nại</DialogTitle>
            <DialogDescription>
              Xem chi tiết và xử lý resolve/reject khiếu nại.
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              Đang tải chi tiết...
            </div>
          ) : selectedDetail && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Complaint ID</p>
                  <p className="font-mono text-sm break-all">{selectedDetail.complaintId}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Trạng thái</p>
                  <Badge variant={getStatusBadgeVariant(selectedDetail.status)}>
                    {STATUS_DISPLAY[selectedDetail.status] || selectedDetail.status}
                  </Badge>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Người gửi</p>
                  <p className="text-sm">
                    {selectedDetail.citizen?.name || "-"}
                  </p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Collector</p>
                  <p className="text-sm">
                    {selectedDetail.collector
                      ? selectedDetail.collector.name
                      : "-"}
                  </p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Tạo lúc</p>
                  <p className="text-sm">{formatDateTime(selectedDetail.createdAt)}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Xử lý lúc</p>
                  <p className="text-sm">{formatDateTime(selectedDetail.resolvedAt)}</p>
                </div>
              </div>

              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Nội dung khiếu nại</p>
                <p className="mt-1 text-sm">{selectedDetail.complaintContent || "-"}</p>
              </div>

              {selectedDetail.attachments && selectedDetail.attachments.length > 0 && (
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground mb-2">Hình ảnh đính kèm</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedDetail.attachments.map((att, idx) => (
                      <a key={idx} href={att.fileUri} target="_blank" rel="noopener noreferrer">
                        <img
                          src={att.fileUri}
                          alt={`Attachment ${idx + 1}`}
                          className="h-20 w-20 rounded border object-cover"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Phản hồi Admin</p>
                  <Textarea
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                    placeholder="Nhập phản hồi của admin..."
                    disabled={!isPending(selectedDetail.status)}
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Điểm hoàn trả</p>
                  <Input
                    type="number"
                    min={0}
                    value={refundPoints}
                    onChange={(e) => setRefundPoints(Number(e.target.value))}
                    disabled={!isPending(selectedDetail.status)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Chỉ áp dụng khi resolve. Reject sẽ luôn đặt về 0.
                  </p>
                </div>
              </div>

              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Người xử lý</p>
                <p className="text-sm">
                  {selectedDetail.resolvedBy
                    ? `${selectedDetail.resolvedBy.adminName}`
                    : "-"}
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpenDetail(false)}>
                  Đóng
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={!isPending(selectedDetail.status) || actionLoading}
                >
                  {actionLoading ? "Đang xử lý..." : "Từ chối khiếu nại"}
                </Button>
                <Button
                  onClick={handleResolve}
                  disabled={!isPending(selectedDetail.status) || actionLoading}
                >
                  {actionLoading ? "Đang xử lý..." : "Resolve + Hoàn điểm"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Complaint;
