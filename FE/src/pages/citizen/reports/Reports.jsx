import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Eye, Edit, Calendar, Loader2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getMyReports,
  getReportById,
  updateReportById,
  deleteReportById,
} from "@/services/wasteReportService";
import { toast } from "sonner";
import { reverseGeocode } from "@/services/geocodingService";
import { getWasteTypes } from "@/services/wasteService";
import EditReportDialog from "./EditReportDialog";

const PAGE_SIZE_OPTIONS = [10, 20, 50];
const FETCH_ALL_PAGE_SIZE = 100;

function getVisiblePages(currentPage, totalPages) {
  const delta = 1;
  const range = [];
  const rangeWithDots = [];

  for (
    let i = Math.max(2, currentPage - delta);
    i <= Math.min(totalPages - 1, currentPage + delta);
    i += 1
  ) {
    range.push(i);
  }

  if (currentPage - delta > 2) {
    rangeWithDots.push(1, "...");
  } else {
    rangeWithDots.push(1);
  }

  rangeWithDots.push(...range);

  if (currentPage + delta < totalPages - 1) {
    rangeWithDots.push("...", totalPages);
  } else if (totalPages > 1) {
    rangeWithDots.push(totalPages);
  }

  return rangeWithDots;
}

const progressTemplate = {
  PENDING: [
    { step: "reported", label: "Đã gửi báo cáo", completed: true },
    {
      step: "accepted",
      label: "Doanh nghiệp tiếp nhận",
      completed: false,
    },
    {
      step: "assigned",
      label: "Phân công người thu gom",
      completed: false,
    },
    { step: "collected", label: "Đã thu gom", completed: false },
  ],
  ACCEPTED: [
    { step: "reported", label: "Đã gửi báo cáo", completed: true },
    {
      step: "accepted",
      label: "Doanh nghiệp tiếp nhận",
      completed: true,
    },
    {
      step: "assigned",
      label: "Phân công người thu gom",
      completed: false,
    },
    { step: "collected", label: "Đã thu gom", completed: false },
  ],
  ASSIGNED: [
    { step: "reported", label: "Đã gửi báo cáo", completed: true },
    {
      step: "accepted",
      label: "Doanh nghiệp tiếp nhận",
      completed: true,
    },
    {
      step: "assigned",
      label: "Phân công người thu gom",
      completed: true,
    },
    { step: "collected", label: "Đã thu gom", completed: false },
  ],
  IN_PROGRESS: [
    { step: "reported", label: "Đã gửi báo cáo", completed: true },
    {
      step: "accepted",
      label: "Doanh nghiệp tiếp nhận",
      completed: true,
    },
    {
      step: "assigned",
      label: "Phân công người thu gom",
      completed: true,
    },
    { step: "collected", label: "Đã thu gom", completed: false },
  ],
  COLLECTED: [
    { step: "reported", label: "Đã gửi báo cáo", completed: true },
    {
      step: "accepted",
      label: "Doanh nghiệp tiếp nhận",
      completed: true,
    },
    {
      step: "assigned",
      label: "Phân công người thu gom",
      completed: true,
    },
    { step: "collected", label: "Đã thu gom", completed: true },
  ],
  REJECTED: [
    { step: "reported", label: "Đã gửi báo cáo", completed: true },
    {
      step: "accepted",
      label: "Doanh nghiệp tiếp nhận",
      completed: false,
    },
    {
      step: "assigned",
      label: "Phân công người thu gom",
      completed: false,
    },
    { step: "collected", label: "Đã thu gom", completed: false },
    { step: "rejected", label: "Báo cáo bị từ chối", completed: true },
  ],
};

// Keep compatibility in case backend still returns OPEN for old records.
progressTemplate.OPEN = progressTemplate.PENDING;

function normalizeStatus(status) {
  if (status === "COLLECTED") return "completed";
  if (status === "REJECTED") return "rejected";
  if (
    status === "ACCEPTED" ||
    status === "ASSIGNED" ||
    status === "IN_PROGRESS"
  )
    return "processing";
  return "pending";
}

function statusTextFromApi(status) {
  if (status === "COLLECTED") return "ĐÃ THU GOM";
  if (status === "REJECTED") return "ĐÃ TỪ CHỐI";
  if (
    status === "ACCEPTED" ||
    status === "ASSIGNED" ||
    status === "IN_PROGRESS"
  )
    return "ĐANG XỬ LÝ";
  return "CHỜ DUYỆT";
}

function mapReport(report) {
  const lat = Number(report?.location?.lat || 0);
  const lng = Number(report?.location?.lng || 0);
  const rawStatus = report?.status || "PENDING";
  const mappedItems = (report?.items || [])
    .map((item) => ({
      waste_type_id: Number(item?.wasteTypeId ?? item?.waste_type_id),
      quantity: Number(item?.quantity),
    }))
    .filter(
      (item) =>
        Number.isInteger(item.waste_type_id) &&
        item.waste_type_id > 0 &&
        Number.isFinite(item.quantity) &&
        item.quantity > 0,
    );
  const normalizedWeightKg =
    report?.weightKg !== undefined && report?.weightKg !== null
      ? Number(report.weightKg)
      : null;

  return {
    id: report?.reportId || report?.wasteReportId,
    reportCode: report?.reportCode || report?.reportId || report?.wasteReportId,
    wasteTypeId:
      report?.wasteType?.id ||
      (mappedItems.length > 0 ? mappedItems[0].waste_type_id : null),
    title: report?.wasteType?.name || "-",
    unitType: report?.wasteType?.unitType || "-",
    date: report?.createdAt
      ? format(new Date(report.createdAt), "dd/MM/yyyy", { locale: vi })
      : "-",
    createdAt: report?.createdAt,
    location: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    latitude: lat,
    longitude: lng,
    status: normalizeStatus(rawStatus),
    statusText: statusTextFromApi(rawStatus),
    progress: progressTemplate[rawStatus] || progressTemplate.PENDING,
    trashTypes: [],
    totalPoints: 0,
    items: mappedItems,
    description: report?.description || "",
    weightKg:
      Number.isFinite(normalizedWeightKg) && normalizedWeightKg > 0
        ? normalizedWeightKg
        : null,
    citizenImages: [
      ...(report.attachments || []).map((item) => item.fileUri),
      ...(report.images || []).map((item) => item.file_uri),
    ].filter(Boolean),
    images: report.images || [],
    collectorImages: [],
    collector: report.assignedCollector
      ? {
          name: report.assignedCollector.fullname,
          phone: report.assignedCollector.phone,
          avatar: report.assignedCollector.avatar,
          estimatedTime: "Đang cập nhật",
        }
      : null,
    collectorName: report?.assignedCollector?.fullname || null,
    rewardPoints:
      report?.rewardPoint?.pointsDelta !== undefined &&
      report?.rewardPoint?.pointsDelta !== null
        ? Number(report.rewardPoint.pointsDelta)
        : null,
    wasteTypeDetail: null,
  };
}

async function mapReportWithLocation(report) {
  const mapped = mapReport(report);
  const locationName = await reverseGeocode(mapped.latitude, mapped.longitude);
  return {
    ...mapped,
    location: locationName,
  };
}

function Reports() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTargetReport, setEditTargetReport] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [deletingReportId, setDeletingReportId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetReport, setDeleteTargetReport] = useState(null);
  const [wasteTypes, setWasteTypes] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      let page = 1;
      let total = 0;
      const allReports = [];

      do {
        const response = await getMyReports({
          page,
          limit: FETCH_ALL_PAGE_SIZE,
        });

        const currentBatch = response?.data || [];
        total = Number(response?.pagination?.total || currentBatch.length);
        allReports.push(...currentBatch);

        if (currentBatch.length < FETCH_ALL_PAGE_SIZE) {
          break;
        }

        page += 1;
      } while (allReports.length < total);

      setReports(allReports.map((report) => mapReport(report)));
    } catch (error) {
      toast.error(error.message || "Không thể tải danh sách báo cáo");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchWasteTypeOptions = async () => {
      try {
        const data = await getWasteTypes();
        setWasteTypes(data);
      } catch {
        setWasteTypes([]);
      }
    };

    fetchWasteTypeOptions();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleViewReport = (report) => {
    navigate(`/citizen/reports/${report.id}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-700 border-red-200";
      case "processing":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "pending":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const handleOpenEdit = async (report) => {
    setEditTargetReport(report);
    setIsEditModalOpen(true);

    try {
      const response = await getReportById(report.id);
      const detailData = response?.data || {};
      const detailedReport = await mapReportWithLocation(detailData);
      setEditTargetReport(detailedReport);
    } catch {
      // Fallback to row data if detail fetch fails.
    }
  };

  const handleEditSubmit = async (payload) => {
    if (!editTargetReport?.id) return;

    setEditSaving(true);
    try {
      const hasNewFile = payload?.file instanceof File;

      if (hasNewFile) {
        const formPayload = new FormData();
        formPayload.append("items", JSON.stringify(payload.items || []));
        formPayload.append("gpsLat", String(payload.gpsLat));
        formPayload.append("gpsLng", String(payload.gpsLng));
        formPayload.append("description", String(payload.description || ""));
        formPayload.append("weight", String(payload.weight || 0));
        formPayload.append("file", payload.file);
        await updateReportById(editTargetReport.id, formPayload);
      } else {
        await updateReportById(editTargetReport.id, payload);
      }

      toast.success("Cập nhật báo cáo thành công");
      setIsEditModalOpen(false);
      setEditTargetReport(null);
      await fetchReports();
    } catch (error) {
      toast.error(error.message || "Cập nhật báo cáo thất bại");
    } finally {
      setEditSaving(false);
    }
  };

  const handleOpenDeleteDialog = (report) => {
    setDeleteTargetReport(report);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    if (deletingReportId) return;
    setDeleteDialogOpen(false);
    setDeleteTargetReport(null);
  };

  const handleConfirmDeleteReport = async () => {
    if (!deleteTargetReport?.id) return;

    setDeletingReportId(deleteTargetReport.id);
    try {
      await deleteReportById(deleteTargetReport.id);
      toast.success("Xóa báo cáo thành công");
      setDeleteDialogOpen(false);
      setDeleteTargetReport(null);
      await fetchReports();
    } catch (error) {
      toast.error(error.message || "Xóa báo cáo thất bại");
    } finally {
      setDeletingReportId(null);
    }
  };

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      if (statusFilter !== "all" && report.status !== statusFilter)
        return false;

      if (dateFilter) {
        const reportDate = new Date(report.createdAt);
        const isSameDay =
          reportDate.getFullYear() === dateFilter.getFullYear() &&
          reportDate.getMonth() === dateFilter.getMonth() &&
          reportDate.getDate() === dateFilter.getDate();
        if (!isSameDay) return false;
      }

      return true;
    });
  }, [reports, statusFilter, dateFilter]);
  const totalReports = filteredReports.length;
  const totalPages = Math.max(1, Math.ceil(totalReports / pageSize) || 1);
  const effectivePage = Math.min(currentPage, totalPages);
  const startItem = totalReports === 0 ? 0 : (effectivePage - 1) * pageSize + 1;
  const endItem = Math.min(effectivePage * pageSize, totalReports);

  const paginatedReports = useMemo(() => {
    const startIndex = (effectivePage - 1) * pageSize;
    return filteredReports.slice(startIndex, startIndex + pageSize);
  }, [effectivePage, filteredReports, pageSize]);

  return (
    <div className="space-y-6">
      {/* Reports Table */}
      <Card>
        {/* Filters */}

        <CardContent>
          <FieldGroup className="flex gap-4 flex-row">
            <Field>
              <FieldLabel>Trạng thái</FieldLabel>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    <SelectItem value="completed">Đã thu gom</SelectItem>
                    <SelectItem value="processing">Đang xử lý</SelectItem>
                    <SelectItem value="pending">Chờ duyệt</SelectItem>
                    <SelectItem value="rejected">Đã từ chối</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Ngày gửi</FieldLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal hover:scale-100",
                      !dateFilter && "text-muted-foreground",
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateFilter ? (
                      format(dateFilter, "dd/MM/yyyy", { locale: vi })
                    ) : (
                      <span>Chọn ngày</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateFilter}
                    onSelect={(value) => {
                      setDateFilter(value);
                      setCurrentPage(1);
                    }}
                    initialFocus
                    locale={vi}
                  />
                </PopoverContent>
              </Popover>
            </Field>
          </FieldGroup>
        </CardContent>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="max-w-10">Mã báo cáo</TableHead>
                <TableHead>Ngày gửi</TableHead>
                <TableHead>Người thu gom</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center">
                    <div className="inline-flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" />
                      Đang tải dữ liệu...
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedReports.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-32 text-center text-muted-foreground"
                  >
                    Không có báo cáo nào
                  </TableCell>
                </TableRow>
              ) : (
                paginatedReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium text-cyan-600 truncate max-w-25">
                      {report.reportCode}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="size-3 text-muted-foreground" />
                        {report.date}
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="text-sm text-foreground">
                        {report.collectorName || "-"}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span
                        className={`text-xs px-3 py-1 rounded-full border font-medium inline-block ${getStatusColor(
                          report.status,
                        )}`}
                      >
                        {report.statusText}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => handleViewReport(report)}
                        >
                          <Eye className="size-3" />
                          Xem
                        </Button>
                        {report.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-cyan-600 border-cyan-300 hover:bg-cyan-50"
                              onClick={() => handleOpenEdit(report)}
                            >
                              <Edit className="size-3" />
                              Sửa
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-red-600 border-red-300 hover:bg-red-50"
                              onClick={() => handleOpenDeleteDialog(report)}
                              disabled={deletingReportId === report.id}
                            >
                              <Trash2 className="size-3" />
                              {deletingReportId === report.id
                                ? "Đang xoá..."
                                : "Xoá"}
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="flex flex-col gap-3 border-t pt-4 mt-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">
                Hiển thị {startItem}-{endItem} / {totalReports} báo cáo
              </p>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Mỗi trang:
                </span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(value) => {
                    setPageSize(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Pagination className="justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (effectivePage > 1) {
                        setCurrentPage(effectivePage - 1);
                      }
                    }}
                    className={
                      effectivePage <= 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>

                {getVisiblePages(effectivePage, totalPages).map(
                  (page, index) =>
                    page === "..." ? (
                      <PaginationItem key={`ellipsis-${index}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          isActive={page === effectivePage}
                          className="cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(Number(page));
                          }}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ),
                )}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (effectivePage < totalPages) {
                        setCurrentPage(effectivePage + 1);
                      }
                    }}
                    className={
                      effectivePage >= totalPages
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>

      <EditReportDialog
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        report={editTargetReport}
        onSubmit={handleEditSubmit}
        saving={editSaving}
        wasteTypes={wasteTypes}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa báo cáo</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa báo cáo này không? Hành động này không thể
              hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseDeleteDialog}
              disabled={Boolean(deletingReportId)}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDeleteReport}
              disabled={Boolean(deletingReportId)}
            >
              {deletingReportId ? "Đang xóa..." : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Reports;
