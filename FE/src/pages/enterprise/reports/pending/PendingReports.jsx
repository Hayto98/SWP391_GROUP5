import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePendingReports } from "@/hooks/usePendingReports";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  assignTaskToCollector,
  getDispatchAssign,
} from "@/services/dispatchAssign.service";
import {
  recordReportAssignment,
  getAllReportAssignmentHistory,
} from "@/services/reportAssignmentHistory.service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Search,
  Download,
  History,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock3,
  Calendar,
} from "lucide-react";

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
  if (
    status === "ACCEPTED" ||
    status === "ASSIGNED" ||
    status === "IN_PROGRESS"
  ) {
    return "bg-orange-100 text-orange-700 border-orange-200";
  }
  if (status === "REJECTED") {
    return "bg-red-100 text-red-700 border-red-200";
  }
  if (status === "COLLECTED") {
    return "bg-green-100 text-green-700 border-green-200";
  }
  return "bg-slate-100 text-slate-700 border-slate-200";
}

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
  const toReportId = (code) => String(code || "").replace(/^#/, "");

  const [isAssignPopupOpen, setAssignPopupOpen] = useState(false);
  const [assigningReportCode, setAssigningReportCode] = useState("");
  const [assignData, setAssignData] = useState(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState("");
  const [assigningCollectorId, setAssigningCollectorId] = useState("");
  const [isHistoryPopupOpen, setHistoryPopupOpen] = useState(false);
  const [assignmentHistoryRows, setAssignmentHistoryRows] = useState([]);

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
  const statuses = useMemo(
    () => data?.filters?.statuses || ["Tất cả trạng thái"],
    [data],
  );
  const sorts = useMemo(() => data?.filters?.sorts || ["Hết hạn SLA"], [data]);

  const assigningReportId = useMemo(
    () => toReportId(assigningReportCode),
    [assigningReportCode],
  );
  const selectedReport = assignData?.selectedReport;
  const collectors = assignData?.collectors || [];

  const refreshAssignmentHistory = useCallback(() => {
    setAssignmentHistoryRows(getAllReportAssignmentHistory());
  }, []);

  const resetAssignPopup = useCallback(() => {
    setAssignData(null);
    setAssignLoading(false);
    setAssignError("");
    setAssigningCollectorId("");
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
          <div className="flex gap-2">
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
                placeholder="Tìm mã báo cáo, tên công dân..."
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
              <FilterSelect
                value={status}
                onChange={setStatus}
                options={statuses}
                placeholder="Trạng thái"
              />
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
                  <TableCell colSpan={7} className="h-24 text-center">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Không có báo cáo nào
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.code}>
                    <TableCell>
                      <Button
                        type="button"
                        variant="link"
                        className="px-0"
                        onClick={() =>
                          navigate(
                            `/enterprise/reports/detail/${toReportId(r.code)}`,
                            {
                              state: { selectedFrom: "pending-list" },
                            },
                          )
                        }
                      >
                        {r.code}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{r.ward}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.district}
                      </div>
                    </TableCell>
                    <TableCell>{r.waste}</TableCell>
                    <TableCell>{formatDateTime(r.createdAt)}</TableCell>
                    <TableCell>
                      <Badge className={cn("border", getStatusClass(r.status))}>
                        {r.status || "-"}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={acting === r.code}
                          onClick={() =>
                            navigate(
                              `/enterprise/reports/detail/${toReportId(r.code)}`,
                              {
                                state: { selectedFrom: "pending-list" },
                              },
                            )
                          }
                        >
                          Chi tiết
                        </Button>

                        {r.actions.includes("accept") && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-orange-700 border-orange-300 hover:bg-orange-50"
                            disabled={acting === r.code || !r.canAccept}
                            onClick={() => doAction(r.code, "accept")}
                          >
                            {acting === r.code ? "..." : "Chấp nhận"}
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                          disabled={acting === r.code || !r.canAssign}
                          onClick={() => handleAssignPopupOpen(r.code)}
                        >
                          {r.status === "ASSIGNED" ? "Đã gán" : "Gán"}
                        </Button>

                        {r.actions.includes("reject") && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={acting === r.code}
                            onClick={() => doAction(r.code, "reject")}
                          >
                            {acting === r.code ? "..." : "Từ chối"}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
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
                  Gán collector cho báo cáo #{assigningReportId || "-"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Chọn collector phù hợp dựa trên khoảng cách và tải công việc.
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
                    Báo cáo #{selectedReport.id} • {selectedReport.status}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <MapPin className="size-4" />
                    <span>{selectedReport.address}</span>
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock3 className="size-4" />
                    <span>{selectedReport.weightEstimate}</span>
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
                          <TableHead>Khoảng cách</TableHead>
                          <TableHead>Tải công việc</TableHead>
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
                                    {collector.id} • {collector.status}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">
                                {collector.distanceKm.toFixed(1)} km
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {collector.etaText}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs text-muted-foreground mb-1">
                                {collector.tasks}/{collector.maxTasks} tasks •{" "}
                                {collector.loadPercent}%
                              </div>
                              <ProgressBar percent={collector.loadPercent} />
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
                  {assignmentHistoryRows.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.assignedAtText || item.assignedAt || "-"}
                      </TableCell>
                      <TableCell className="font-medium">
                        #{item.reportId}
                      </TableCell>
                      <TableCell>{item.collectorName || "-"}</TableCell>
                      <TableCell>{item.collectorId || "-"}</TableCell>
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
