import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
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
import { usePendingReports } from "@/hooks/usePendingReports";
import { cn } from "@/lib/utils";
import {
  assignTaskToCollector,
  getDispatchAssign,
} from "@/services/dispatchAssign.service";
import {
  getAllReportAssignmentHistory,
  recordReportAssignment,
} from "@/services/reportAssignmentHistory.service";
import { reverseGeocode } from "@/services/geocodingService";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  History,
  MapPin,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const CollectorAvatar = ({ name }) => {
  const parts = String(name || "")
    .split(" ")
    .filter(Boolean);
  const seed = (parts[0]?.[0] || "") + (parts[parts.length - 1]?.[0] || "");
  return (
    <div className="h-9 w-9 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-semibold">
      {seed.toUpperCase()}
    </div>
  );
};

const ProgressBar = ({ percent }) => (
  <div className="h-2 w-full rounded bg-muted overflow-hidden">
    <div
      className="h-full bg-primary transition-all"
      style={{ width: `${percent}%` }}
    />
  </div>
);

function formatDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return format(d, "dd/MM/yyyy HH:mm", { locale: vi });
}

function getStatusClass(status) {
  if (status === "PENDING") {
    return "bg-[#2196F3]/10 text-[#2196F3] border-[#2196F3]"; // Xanh dương nhạt
  }
  if (status === "ASSIGNED") {
    return "bg-[#FF9800]/10 text-[#FF9800] border-[#FF9800]"; // Cam
  }
  if (status === "IN_PROGRESS") {
    return "bg-[#FFC107]/10 text-[#FFC107] border-[#FFC107]"; // Vàng
  }
  if (status === "COLLECTED" || status === "COMPLETED") {
    return "bg-[#4CAF50]/10 text-[#4CAF50] border-[#4CAF50]"; // Xanh lá
  }
  if (status === "REJECTED") {
    return "bg-red-100 text-red-700 border-red-200";
  }
  if (status === "ACCEPTED") {
    return "bg-[#2196F3]/10 text-[#2196F3] border-[#2196F3]"; // Có thể dùng màu xanh dương như PENDING nếu cần
  }
  return "bg-slate-100 text-slate-700 border-slate-200";
}

const STATUS_FILTER_OPTIONS = [
  { value: "Tất cả trạng thái", label: "Tất cả trạng thái" },
  { value: "PENDING", label: "Chờ duyệt" },
  { value: "ACCEPTED", label: "Đã chấp nhận" },
  { value: "ASSIGNED", label: "Đã gán" },
  { value: "IN_PROGRESS", label: "Đang xử lý" },
  { value: "COLLECTED", label: "Đã thu gom" },
  { value: "REJECTED", label: "Đã từ chối" },
];

function FilterSelect({ value, onChange, options, placeholder }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="flex-1">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export default function PendingReports() {
  const navigate = useNavigate();

  const {
    data,
    loading,
    error,
    acting,
    exporting,
    q,
    createdAt,
    wasteType,
    wasteSubType,
    weight,
    status,
    sort,
    page,
    pageSize,
    setQ,
    setCreatedAt,
    setWasteType,
    setWasteSubType,
    setWeight,
    setStatus,
    setSort,
    setPage,
    doAction,
    exportExcel,
    reload,
  } = usePendingReports();  
  const total = data?.result?.total || 0;
  const rows = data?.result?.rows || [];
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);
  const toReportId = (code) => String(code || "").replace(/^#/, "");

  const [isAssignPopupOpen, setAssignPopupOpen] = useState(false);
  const [assigningReportCode, setAssigningReportCode] = useState("");
  const [assignData, setAssignData] = useState(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState("");
  const [assigningCollectorId, setAssigningCollectorId] = useState("");
  const [selectedReportAddress, setSelectedReportAddress] = useState("");
  const [isHistoryPopupOpen, setHistoryPopupOpen] = useState(false);
  const [assignmentHistoryRows, setAssignmentHistoryRows] = useState([]);
  // State cho dropdown collector hoạt động
  const [activeCollectors, setActiveCollectors] = useState([]);
  const [selectedCollectorId, setSelectedCollectorId] = useState("");
  // Fetch danh sách collector hoạt động khi mount
  useEffect(() => {
    const fetchCollectors = async () => {
      try {
        // Lấy access token từ localStorage
        const token = localStorage.getItem("accessToken");
        const res = await fetch("http://localhost:3000/enterprise/collectors/available", {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });
        const data = await res.json();
        console.log("[Collector API] Response:", data);
        setActiveCollectors(data.collectors || []);
      } catch (e) {
        console.error("[Collector API] Error:", e);
        setActiveCollectors([]);
      }
    };
    fetchCollectors();
  }, []);

  const pages = useMemo(() => {
    const arr = [];
    const max = totalPages;
    const cur = page;

    if (max <= 7) {
      for (let i = 1; i <= max; i++) arr.push(i);
      return arr;
    }

    arr.push(1);
    if (cur > 3) arr.push("...");
    const start = Math.max(2, cur - 1);
    const end = Math.min(max - 1, cur + 1);
    for (let i = start; i <= end; i++) arr.push(i);
    if (cur < max - 2) arr.push("...");
    arr.push(max);
    return arr;
  }, [page, totalPages]);

  const wasteTypes = useMemo(
    () => data?.filters?.wasteTypes || ["Tất cả loại rác"],
    [data],
  );
  const wasteSubTypes = useMemo(
    () => data?.filters?.wasteSubTypes || ["Tất cả đơn vị rác"],
    [data],
  );
  const weights = useMemo(
    () => data?.filters?.weights || ["Tất cả cân nặng"],
    [data],
  );
  const sorts = useMemo(() => data?.filters?.sorts || ["Hết hạn SLA"], [data]);

  const assigningReportId = useMemo(
    () => toReportId(assigningReportCode),
    [assigningReportCode],
  );
  const selectedReport = assignData?.selectedReport;
  const assigningReportCodeText =
    assigningReportCode || `#${assigningReportId || "-"}`;
  const collectors = assignData?.collectors || [];

  const refreshAssignmentHistory = useCallback(() => {
    setAssignmentHistoryRows(getAllReportAssignmentHistory());
  }, []);

  const resetAssignPopup = useCallback(() => {
    setAssignData(null);
    setAssignLoading(false);
    setAssignError("");
    setAssigningCollectorId("");
    setSelectedReportAddress("");
    setAssigningReportCode("");
  }, []);

  const handleAssignPopupOpen = useCallback((code) => {
    setAssigningReportCode(code);
    setAssignPopupOpen(true);
  }, []);

  const handleAssignPopupChange = useCallback(
    (open) => {
      setAssignPopupOpen(open);
      if (!open) {
        resetAssignPopup();
      }
    },
    [resetAssignPopup],
  );

  useEffect(() => {
    if (!isAssignPopupOpen || !assigningReportId) return;

    let cancelled = false;

    const loadAssignData = async () => {
      setAssignLoading(true);
      setAssignError("");
      try {
        const res = await getDispatchAssign(assigningReportId);
        if (cancelled) return;
        setAssignData(res);
      } catch (e) {
        if (cancelled) return;
        setAssignError(e?.message || "Không tải được danh sách collector");
      } finally {
        if (!cancelled) {
          setAssignLoading(false);
        }
      }
    };

    loadAssignData();

    return () => {
      cancelled = true;
    };
  }, [isAssignPopupOpen, assigningReportId]);

  useEffect(() => {
    if (!isHistoryPopupOpen) return;
    refreshAssignmentHistory();
  }, [isHistoryPopupOpen, refreshAssignmentHistory]);

  useEffect(() => {
    let cancelled = false;

    const resolveAddress = async () => {
      const lat = Number(selectedReport?.location?.lat);
      const lng = Number(selectedReport?.location?.lng);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        if (!cancelled)
          setSelectedReportAddress(selectedReport?.address || "-");
        return;
      }

      const address = await reverseGeocode(lat, lng);
      if (!cancelled) {
        setSelectedReportAddress(address || selectedReport?.address || "-");
      }
    };

    if (!selectedReport) {
      setSelectedReportAddress("");
      return;
    }

    resolveAddress();

    return () => {
      cancelled = true;
    };
  }, [selectedReport]);

  const handleAssignCollector = useCallback(
    async (collector) => {
      if (!assigningReportId || !collector?.id) return;

      setAssigningCollectorId(collector.id);
      setAssignError("");
      try {
        const assignResult = await assignTaskToCollector({
          reportId: assigningReportId,
          collectorId: collector.id,
        });

        const assignedCollectorName =
          assignResult?.collector?.fullname || collector.name;

        recordReportAssignment({
          reportId: assigningReportId,
          reportCode: assigningReportCode,
          collectorId: collector.id,
          collectorName: assignedCollectorName,
        });

        const reportCodeText = assigningReportCode || `#${assigningReportId}`;
        toast.success(
          `Nhân viên ${assignedCollectorName} vừa được gán cho báo cáo ${reportCodeText}.`,
          {
            description: assignResult?.assignedAt
              ? `Mã nhân viên: ${collector.id} • ${new Date(assignResult.assignedAt).toLocaleString("vi-VN")}`
              : `Mã nhân viên: ${collector.id}`,
          },
        );
        refreshAssignmentHistory();
        handleAssignPopupChange(false);
        await reload();
      } catch (e) {
        setAssignError(e?.message || "Gán collector thất bại");
      } finally {
        setAssigningCollectorId("");
      }
    },
    [
      assigningReportCode,
      assigningReportId,
      handleAssignPopupChange,
      reload,
      refreshAssignmentHistory,
    ],
  );
  const [selectedReports, setSelectedReports] = useState([]);

// Handler chọn từng báo cáo
const handleSelectReport = (code, checked) => {
  setSelectedReports((prev) => {
    if (checked) return [...prev, code];
    return prev.filter((c) => c !== code);
  });
};

// Handler chọn tất cả/bỏ chọn tất cả
// Handler chọn tất cả/bỏ chọn tất cả
// Nếu onlyAccepted = true, chỉ chọn các báo cáo ACCEPTED
const handleSelectAll = (checked, onlyAccepted = false) => {
  if (checked) {
    if (onlyAccepted) {
      setSelectedReports(rows.filter(r => r.status === "ACCEPTED").map((r) => r.code));
    } else {
      setSelectedReports(rows.map((r) => r.code));
    }
  } else {
    setSelectedReports([]);
  }
};

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Danh sách báo cáo</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Hiển thị {data?.result?.total ?? 0} báo cáo theo bộ lọc hiện tại
            </p>
          </div>
          <div className="flex gap-2 items-center">
            {/* Dropdown chọn collector cho gán hàng loạt */}
            <select
              className="border rounded px-2 py-1"
              value={selectedCollectorId}
              onChange={e => setSelectedCollectorId(e.target.value)}
            >
              <option value="">Chọn collector</option>
              {activeCollectors.map((c) => (
                <option key={c.userAccountId} value={c.userAccountId}>{c.fullname}</option>
              ))}
            </select>
            <Button
              variant="default"
              disabled={
                !selectedCollectorId || selectedReports.length === 0 || rows.filter(r => r.status === "ACCEPTED").length === 0
              }
              onClick={async () => {
                // Gán collector cho các báo cáo đã chọn
                const collector = activeCollectors.find(c => c.userAccountId === selectedCollectorId);
                if (!collector) return;
                for (const code of selectedReports) {
                  // Giả sử có hàm assignTaskToCollector nhận {reportId, collectorId}
                  try {
                    await assignTaskToCollector({ reportId: code, collectorId: collector.userAccountId });
                  } catch (e) {
                    // Có thể toast lỗi từng báo cáo nếu muốn
                  }
                }
                toast.success("Đã gán collector cho các báo cáo đã chọn.");
                reload();
              }}
            >
              Gán collector
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                refreshAssignmentHistory();
                setHistoryPopupOpen(true);
              }}
            >
              <History className="size-4" /> Lịch sử
            </Button>
            <Button
              variant="outline"
              onClick={exportExcel}
              disabled={exporting}
            >
              <Download className="size-4" />
              {exporting ? "Đang xuất..." : "Xuất báo cáo"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Tìm wasteCode, tên công dân..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !createdAt && "text-muted-foreground",
                  )}
                >
                  <Calendar className="mr-2 size-4" />
                  {createdAt
                    ? format(createdAt, "dd/MM/yyyy", { locale: vi })
                    : "Lọc theo ngày tạo"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={createdAt}
                  onSelect={setCreatedAt}
                  initialFocus
                  locale={vi}
                />
              </PopoverContent>
            </Popover>

            <Button variant="ghost" onClick={() => setCreatedAt(undefined)}>
              Bỏ lọc ngày
            </Button>

            <div className="md:col-span-2 lg:col-span-4 flex flex-wrap gap-3">
              <FilterSelect
                value={wasteType}
                onChange={setWasteType}
                options={wasteTypes}
                placeholder="Loại rác"
              />

              <FilterSelect
                value={wasteSubType}
                onChange={setWasteSubType}
                options={wasteSubTypes}
                placeholder="Đơn vị rác"
              />
              <FilterSelect
                value={weight}
                onChange={setWeight}
                options={weights}
                placeholder="Cân nặng"
              />
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {STATUS_FILTER_OPTIONS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              Lỗi: {error}
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                <input
                  type="checkbox"
                  aria-label="Chọn tất cả"
                  checked={
                    selectedCollectorId
                      ? rows.filter(r => r.status === "ACCEPTED").length > 0 && rows.filter(r => r.status === "ACCEPTED").every((r) => selectedReports.includes(r.code))
                      : rows.length > 0 && rows.every((r) => selectedReports.includes(r.code))
                  }
                  onChange={e => {
                    if (selectedCollectorId) {
                      handleSelectAll(e.target.checked, true);
                    } else {
                      handleSelectAll(e.target.checked);
                    }
                  }}
                  disabled={selectedCollectorId && rows.filter(r => r.status === "ACCEPTED").length === 0}
                />
                </TableHead>
                <TableHead>Mã báo cáo</TableHead>
                <TableHead>Công dân</TableHead>
                <TableHead>Loại rác</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Không có báo cáo nào
                  </TableCell>
                </TableRow>
              ) : (
                rows.filter(Boolean).map((r, idx) => {
                  const isAccepted = r.status === "ACCEPTED";
                  const isDimmed = selectedCollectorId && !isAccepted;
                  return (
                    <TableRow
                      key={r?.code || r?.reportCode || `row-${idx}`}
                      style={isDimmed ? { opacity: 0.5 } : {}}
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedReports.includes(r.code)}
                          onChange={e => handleSelectReport(r.code, e.target.checked)}
                          aria-label={`Chọn báo cáo ${r?.reportCode || r?.code || idx+1}`}
                          disabled={selectedCollectorId ? !isAccepted : false}
                        />
                      </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="link"
                        className="px-0"
                        onClick={() =>
                          navigate(
                            `/enterprise/reports/detail/${toReportId(r?.code)}`,
                            {
                              state: { selectedFrom: "pending-list" },
                            },
                          )
                        }
                      >
                        {r?.reportCode || r?.code || "#N/A"}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{r?.ward || "-"}</div>
                      <div className="text-xs text-muted-foreground">
                        {r?.district || "-"}
                      </div>
                    </TableCell>
                    <TableCell>{r?.waste || "-"}</TableCell>
                    <TableCell>{formatDateTime(r?.createdAt)}</TableCell>
                    <TableCell>
                      <Badge className={cn("border", getStatusClass(r?.status))}>
                        {r?.status || "-"}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex justify-end gap-2 items-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className="min-w-[90px] h-10 px-4 text-base flex items-center justify-center"
                          disabled={acting === r?.code}
                          onClick={() =>
                            navigate(
                              `/enterprise/reports/detail/${toReportId(r?.code)}`,
                              {
                                state: { selectedFrom: "pending-list" },
                              },
                            )
                          }
                        >
                          Chi tiết
                        </Button>
                        {/* Nút Gán đã được loại bỏ, chỉ còn thao tác gán ở trang chi tiết báo cáo */}
                      </div>
                    </TableCell>
                  </TableRow>
                );
                })
              )}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Hiển thị {rows.length} trên {total} báo cáo
            </p>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="size-4" />
              </Button>
              {pages.map((p, idx) =>
                p === "..." ? (
                  <span className="px-2" key={`e-${idx}`}>
                    ...
                  </span>
                ) : (
                  <Button
                    key={p}
                    variant={p === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                ),
              )}
              <Button
                variant="outline"
                size="icon"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAssignPopupOpen} onOpenChange={handleAssignPopupChange}>
        <DialogContent
          className="max-w-none p-0"
          style={{
            width: "94vw",
            maxWidth: 980,
            maxHeight: "86vh",
            overflow: "auto",
          }}
        >
          <div>
            <div className="flex items-start justify-between gap-4 p-6 border-b">
              <div>
                <h2 className="text-xl font-semibold">
                  Gán collector cho báo cáo{" "}
                  {selectedReport?.reportCode || assigningReportCodeText}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Chọn collector.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  navigate(`/enterprise/reports/detail/${assigningReportId}`)
                }
                disabled={!assigningReportId}
              >
                Xem chi tiết
              </Button>
            </div>

            {assignLoading && (
              <div className="p-6 text-sm text-muted-foreground">
                Đang tải danh sách collector...
              </div>
            )}
            {!assignLoading && assignError && (
              <div className="p-6 text-sm text-red-600">Lỗi: {assignError}</div>
            )}

            {!assignLoading && !assignError && selectedReport && (
              <>
                <div className="mx-6 mt-6 rounded-lg border p-4 space-y-2">
                  <div className="font-medium">
                    Báo cáo {selectedReport?.reportCode || assigningReportCodeText} • {selectedReport?.status || "-"}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <MapPin className="size-4" />
                    <span>
                      {selectedReportAddress || selectedReport?.address || "-"}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="font-medium">Loại rác:</span>
                    <span>{selectedReport?.wasteType || selectedReport?.waste || "-"}</span>
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock3 className="size-4" />
                    <span>{selectedReport?.weightEstimate || (Number.isFinite(selectedReport?.weightKg) && selectedReport.weightKg > 0 ? `${selectedReport.weightKg.toFixed(1)} kg` : "-")}</span>
                  </div>
                </div>

                {!collectors.length ? (
                  <div className="p-6 text-sm text-muted-foreground">
                    Hiện chưa có collector khả dụng.
                  </div>
                ) : (
                  <div className="p-6 pt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Collector</TableHead>
                          <TableHead className="text-right">Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {collectors.map((collector) => (
                          <TableRow key={collector.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <CollectorAvatar name={collector.name} />
                                <div>
                                  <div className="font-medium">
                                    {collector.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {collector.status}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                type="button"
                                size="sm"
                                disabled={
                                  !collector.canAssign ||
                                  assigningCollectorId === collector.id
                                }
                                onClick={() => handleAssignCollector(collector)}
                              >
                                {assigningCollectorId === collector.id
                                  ? "..."
                                  : "Gán"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isHistoryPopupOpen} onOpenChange={setHistoryPopupOpen}>
        <DialogContent
          className="max-w-none p-0"
          style={{
            width: "92vw",
            maxWidth: 960,
            maxHeight: "86vh",
            overflow: "auto",
          }}
        >
          <div className="p-6 space-y-4">
            <DialogHeader>
              <DialogTitle>Toàn bộ lịch sử đã gán report</DialogTitle>
              <DialogDescription>
                Tổng số lần gán: {assignmentHistoryRows.length}
              </DialogDescription>
            </DialogHeader>

            {!assignmentHistoryRows.length ? (
              <div className="text-sm text-muted-foreground">
                Chưa có lịch sử gán report nào.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thời điểm</TableHead>
                    <TableHead>Báo cáo</TableHead>
                    <TableHead>Nhân viên collector</TableHead>
                    <TableHead>Mã nhân viên</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignmentHistoryRows.filter(Boolean).map((item, idx) => (
                    <TableRow key={item?.id || `history-${idx}`}>
                      <TableCell>
                        {item?.assignedAtText || item?.assignedAt || "-"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {item?.reportCode || `#${item?.reportId || "-"}`}
                      </TableCell>
                      <TableCell>{item?.collectorName || "-"}</TableCell>
                      <TableCell>{item?.collectorId || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

