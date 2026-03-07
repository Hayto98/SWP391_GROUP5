import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Eye, Edit, MapPin, Calendar, Loader2, Trash2 } from "lucide-react";
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
import { getWasteTypeById, getWasteTypes } from "@/services/wasteService";
import EditReportDialog from "./EditReportDialog";

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
  const normalizedWeightKg =
    report?.weightKg !== undefined && report?.weightKg !== null
      ? Number(report.weightKg)
      : null;

  return {
    id: report.wasteReportId,
    wasteTypeId: report?.wasteType?.id || null,
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
    description: report?.description || "",
    weightKg:
      Number.isFinite(normalizedWeightKg) && normalizedWeightKg > 0
        ? normalizedWeightKg
        : null,
    citizenImages: (report.attachments || []).map((item) => item.fileUri),
    collectorImages: [],
    collector: report.assignedCollector
      ? {
          name: report.assignedCollector.fullname,
          phone: report.assignedCollector.phone,
          avatar: report.assignedCollector.avatar,
          estimatedTime: "Đang cập nhật",
        }
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
  const [wasteTypes, setWasteTypes] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await getMyReports({ page: 1, limit: 100 });
      const reportsWithLocation = await Promise.all(
        (response?.data || []).map((report) => mapReportWithLocation(report)),
      );

      setReports(reportsWithLocation);
    } catch (error) {
      toast.error(error.message || "Không thể tải danh sách báo cáo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();

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
      await updateReportById(editTargetReport.id, payload);
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

  const handleDeleteReport = async (report) => {
    const confirmed = window.confirm("Bạn có chắc muốn xóa báo cáo này?");
    if (!confirmed) return;

    setDeletingReportId(report.id);
    try {
      await deleteReportById(report.id);
      toast.success("Xóa báo cáo thành công");
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

  return (
    <div className="space-y-6">
      {/* Reports Table */}
      <Card>
        {/* Filters */}

        <CardContent>
          <FieldGroup className="flex gap-4 flex-row">
            <Field>
              <FieldLabel>Trạng thái</FieldLabel>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
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
                    onSelect={setDateFilter}
                    initialFocus
                    locale={vi}
                  />
                </PopoverContent>
              </Popover>
            </Field>

            {/* <Field className="flex items-end">
            <Button variant="outline" className="w-full">
              Lọc thêm
            </Button>
          </Field> */}
          </FieldGroup>
        </CardContent>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="max-w-10">Mã báo cáo</TableHead>
                <TableHead>Loại rác</TableHead>
                <TableHead>Ngày gửi</TableHead>
                <TableHead>Địa điểm</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <div className="inline-flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" />
                      Đang tải dữ liệu...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredReports.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-32 text-center text-muted-foreground"
                  >
                    Không có báo cáo nào
                  </TableCell>
                </TableRow>
              ) : (
                filteredReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium text-cyan-600 truncate max-w-25">
                      {report.id}
                    </TableCell>
                    <TableCell>{report.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="size-3 text-muted-foreground" />
                        {report.date}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div
                        className="flex items-center gap-1 text-sm max-w-85"
                        title={report.location}
                      >
                        <MapPin className="size-3 text-muted-foreground" />
                        <span className="truncate">{report.location}</span>
                      </div>
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
                              onClick={() => handleDeleteReport(report)}
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
    </div>
  );
}

export default Reports;
