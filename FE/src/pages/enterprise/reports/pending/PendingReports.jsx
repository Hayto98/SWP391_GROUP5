import { useCallback, useEffect, useMemo, useState } from "react";
import "./pendingReports.css";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { usePendingReports } from "@/hooks/usePendingReports";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
import {
  assignTaskToCollector,
  getDispatchAssign,
} from "@/services/dispatchAssign.service";
import {
  recordReportAssignment,
  getAllReportAssignmentHistory,
} from "@/services/reportAssignmentHistory.service";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  History,
  Loader2,
  MapPin,
} from "lucide-react";

const FilterSelect = ({ value, onChange, options, placeholder }) => {
  const baseItems = Array.from(
    new Set(
      (options || []).filter(
        (option) => typeof option === "string" && option.trim() !== "",
      ),
    ),
  );
  const items =
    value && !baseItems.includes(value) ? [value, ...baseItems] : baseItems;

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder || "Chọn"} />
      </SelectTrigger>
      <SelectContent align="start">
        {items.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

const wasteToneClass = {
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  green: "bg-green-50 text-green-700 border-green-200",
  gray: "bg-slate-100 text-slate-700 border-slate-200",
  purple: "bg-purple-50 text-purple-700 border-purple-200",
};

const slaToneClass = {
  orange: "bg-orange-50 text-orange-700 border-orange-200",
  red: "bg-red-50 text-red-700 border-red-200",
  muted: "bg-slate-100 text-slate-700 border-slate-200",
};

const statusToneClass = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  ACCEPTED: "bg-blue-50 text-blue-700 border-blue-200",
  ASSIGNED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
};

const WasteBadge = ({ tone, children }) => (
  <Badge
    variant="outline"
    className={wasteToneClass[tone] || wasteToneClass.gray}
  >
    {children}
  </Badge>
);

const SlaBadge = ({ sla }) => {
  if (!sla?.text) return <span className="text-muted-foreground">-</span>;

  return (
    <Badge variant="outline" className={slaToneClass[sla.tone] || slaToneClass.muted}>
      {sla.text}
    </Badge>
  );
};

const StatusBadge = ({ status }) => (
  <Badge
    variant="outline"
    className={statusToneClass[status] || "bg-slate-100 text-slate-700 border-slate-200"}
  >
    {status || "-"}
  </Badge>
);

const ActionBtn = ({ tone, children, onClick, disabled, title }) => (
  <Button
    variant="outline"
    size="sm"
    className={[
      "h-8 px-3 text-xs font-semibold",
      tone === "warn" && "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
      tone === "ok" && "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
      tone === "ghost" && "border-slate-200 text-slate-700 hover:bg-slate-100",
    ]
      .filter(Boolean)
      .join(" ")}
    onClick={onClick}
    disabled={disabled}
    title={title}
    type="button"
  >
    {children}
  </Button>
);

const CollectorAvatar = ({ name }) => {
  const parts = String(name || "")
    .split(" ")
    .filter(Boolean);
  const seed = (parts[0]?.[0] || "") + (parts[parts.length - 1]?.[0] || "");
  return <div className="pr-assignAvatar">{seed.toUpperCase()}</div>;
};

const ProgressBar = ({ percent }) => (
  <div className="pr-assignProgress">
    <div className="pr-assignProgressFill" style={{ width: `${percent}%` }} />
  </div>
);

export default function PendingReports() {
  const navigate = useNavigate();

  const {
    data,
    loading,
    error,
    acting,
    exporting,
    q,
    ward,
    wasteType,
    wasteSubType,
    weight,
    status,
    sort,
    page,
    pageSize,
    setQ,
    setWard,
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

  const wards = useMemo(
    () => data?.filters?.wards || ["Tất cả Người dùng"],
    [data],
  );
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
      <div className="mb-6">
        <h1 className="text-lg lg:text-2xl font-bold tracking-tight">
          Danh sách Báo cáo
        </h1>
        <p className="text-green-600 text-sm mt-1">
          Hiển thị {total} báo cáo theo bộ lọc hiện tại
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <CardDescription>Báo cáo chờ xử lý</CardDescription>
            <p className="text-3xl font-bold">{total}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="gap-2"
              type="button"
              onClick={() => {
                refreshAssignmentHistory();
                setHistoryPopupOpen(true);
              }}
            >
              <History className="size-4" />
              Lịch sử
            </Button>

            <Button
              variant="outline"
              className="gap-2"
              type="button"
              onClick={exportExcel}
              disabled={exporting}
            >
              <Download className="size-4" />
              {exporting ? "Đang xuất..." : "Xuất báo cáo (Excel)"}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <FieldGroup className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6 xl:items-end">
            <Field className="xl:col-span-2">
              <FieldLabel>Tìm kiếm</FieldLabel>
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm kiếm mã báo cáo, tên công dân..."
              />
            </Field>

            <Field>
              <FieldLabel>Công dân</FieldLabel>
              <FilterSelect value={ward} onChange={setWard} options={wards} />
            </Field>

            <Field>
              <FieldLabel>Loại rác</FieldLabel>
              <FilterSelect
                value={wasteType}
                onChange={setWasteType}
                options={wasteTypes}
              />
            </Field>

            <Field>
              <FieldLabel>Đơn vị</FieldLabel>
              <FilterSelect
                value={wasteSubType}
                onChange={setWasteSubType}
                options={wasteSubTypes}
              />
            </Field>

            <Field>
              <FieldLabel>Khối lượng</FieldLabel>
              <FilterSelect
                value={weight}
                onChange={setWeight}
                options={weights}
              />
            </Field>

            <Field>
              <FieldLabel>Trạng thái</FieldLabel>
              <FilterSelect
                value={status}
                onChange={setStatus}
                options={statuses}
              />
            </Field>

            <Field className="md:col-span-2 xl:col-span-1">
              <FieldLabel>Sắp xếp</FieldLabel>
              <FilterSelect value={sort} onChange={setSort} options={sorts} />
            </Field>
          </FieldGroup>
        </CardContent>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã báo cáo</TableHead>
                <TableHead>Công dân</TableHead>
                <TableHead>Loại rác</TableHead>
                <TableHead>SLA</TableHead>
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
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-20 text-center text-red-600">
                    Lỗi: {error}
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Không có báo cáo nào phù hợp
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.code}>
                    <TableCell className="font-medium text-cyan-600">
                      <Button
                        variant="link"
                        className="h-auto p-0 text-cyan-600"
                        onClick={() =>
                          navigate(`/enterprise/reports/detail/${toReportId(r.code)}`, {
                            state: { selectedFrom: "pending-list" },
                          })
                        }
                      >
                        {r.code}
                      </Button>
                    </TableCell>

                    <TableCell>
                      <div className="font-medium">{r.ward}</div>
                      <div className="text-sm text-muted-foreground">{r.district}</div>
                    </TableCell>

                    <TableCell>
                      <WasteBadge tone={r.wasteTone}>{r.waste}</WasteBadge>
                    </TableCell>

                    <TableCell>
                      <SlaBadge sla={r.sla} />
                    </TableCell>

                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <ActionBtn
                          tone="ghost"
                          disabled={acting === r.code}
                          onClick={() =>
                            navigate(`/enterprise/reports/detail/${toReportId(r.code)}`, {
                              state: { selectedFrom: "pending-list" },
                            })
                          }
                        >
                          Chi tiết
                        </ActionBtn>

                        {r.actions.includes("accept") && (
                          <ActionBtn
                            tone="warn"
                            disabled={acting === r.code || !r.canAccept}
                            title={
                              r.canAccept
                                ? "Chấp nhận báo cáo"
                                : "Báo cáo đã quá hạn SLA nên không thể chấp nhận"
                            }
                            onClick={() => doAction(r.code, "accept")}
                          >
                            {acting === r.code ? "..." : "Chấp nhận"}
                          </ActionBtn>
                        )}

                        <ActionBtn
                          tone="ok"
                          disabled={acting === r.code || !r.canAssign}
                          title={
                            r.canAssign
                              ? "Gán collector"
                              : r.status === "ASSIGNED"
                                ? "Báo cáo đã được gán collector"
                                : "Cần chấp nhận báo cáo trước khi gán"
                          }
                          onClick={() => handleAssignPopupOpen(r.code)}
                        >
                          {r.status === "ASSIGNED" ? "Đã gán" : "Gán"}
                        </ActionBtn>

                        {r.actions.includes("reject") && (
                          <ActionBtn
                            tone="ghost"
                            disabled={acting === r.code}
                            onClick={() => doAction(r.code, "reject")}
                          >
                            {acting === r.code ? "..." : "Từ chối"}
                          </ActionBtn>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {!loading && !error && total > 0 && (
            <div className="mt-4 flex flex-col items-center justify-between gap-4 border-t pt-4 sm:flex-row">
              <p className="text-xs text-muted-foreground">
                Hiển thị <span className="font-semibold text-foreground">{startItem}-{endItem}</span> trên{" "}
                <span className="font-semibold text-foreground">{total}</span> báo cáo
              </p>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  type="button"
                >
                  <ChevronLeft className="size-4" />
                </Button>

                {pages.map((p, idx) =>
                  p === "..." ? (
                    <span className="px-2 text-muted-foreground" key={`ellipsis-${idx}`}>
                      ...
                    </span>
                  ) : (
                    <Button
                      key={p}
                      variant={p === page ? "default" : "outline"}
                      size="icon"
                      className="size-8"
                      type="button"
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  ),
                )}

                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  type="button"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
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
          <div className="pr-assignDialog">
            <div className="pr-assignHead">
              <div>
                <h2>Gán collector cho báo cáo #{assigningReportId || "-"}</h2>
                <p>
                  Chọn collector phù hợp dựa trên khoảng cách và tải công việc.
                </p>
              </div>
              <button
                type="button"
                className="pr-action pr-action-ghost"
                onClick={() =>
                  navigate(`/enterprise/reports/detail/${assigningReportId}`)
                }
                disabled={!assigningReportId}
              >
                Xem chi tiết
              </button>
            </div>

            {assignLoading && (
              <div className="pr-assignState">
                Đang tải danh sách collector...
              </div>
            )}
            {!assignLoading && assignError && (
              <div className="pr-assignState pr-assignError">
                Lỗi: {assignError}
              </div>
            )}

            {!assignLoading && !assignError && selectedReport && (
              <>
                <div className="pr-assignReport">
                  <div className="pr-assignReportTitle">
                    Báo cáo #{selectedReport.id} • {selectedReport.status}
                  </div>
                  <div className="pr-assignReportMeta">
                    <MapPin className="size-4" />
                    <span>{selectedReport.address}</span>
                  </div>
                  <div className="pr-assignReportMeta">
                    <Clock3 className="size-4" />
                    <span>{selectedReport.weightEstimate}</span>
                  </div>
                </div>

                {!collectors.length ? (
                  <div className="pr-assignState">
                    Hiện chưa có collector khả dụng.
                  </div>
                ) : (
                  <div className="pr-assignList">
                    <div className="pr-assignRow pr-assignRowHead">
                      <div>COLLECTOR</div>
                      <div>KHOẢNG CÁCH</div>
                      <div>TẢI CÔNG VIỆC</div>
                      <div>THAO TÁC</div>
                    </div>

                    {collectors.map((collector) => (
                      <div className="pr-assignRow" key={collector.id}>
                        <div className="pr-assignCollector">
                          <CollectorAvatar name={collector.name} />
                          <div>
                            <div className="pr-strong">{collector.name}</div>
                            <div className="pr-sub">
                              {collector.id} • {collector.status}
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="pr-strong">
                            {collector.distanceKm.toFixed(1)} km
                          </div>
                          <div className="pr-sub">{collector.etaText}</div>
                        </div>

                        <div>
                          <div className="pr-sub">
                            {collector.tasks}/{collector.maxTasks} tasks •{" "}
                            {collector.loadPercent}%
                          </div>
                          <ProgressBar percent={collector.loadPercent} />
                        </div>

                        <div>
                          <ActionBtn
                            tone="ok"
                            disabled={
                              !collector.canAssign ||
                              assigningCollectorId === collector.id
                            }
                            onClick={() => handleAssignCollector(collector)}
                          >
                            {assigningCollectorId === collector.id
                              ? "..."
                              : "Gán"}
                          </ActionBtn>
                        </div>
                      </div>
                    ))}
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
          <div className="pr-historyDialog">
            <div className="pr-historyHead">
              <h2>Toàn bộ lịch sử đã gán report</h2>
              <p>Tổng số lần gán: {assignmentHistoryRows.length}</p>
            </div>

            {!assignmentHistoryRows.length ? (
              <div className="pr-historyEmpty">
                Chưa có lịch sử gán report nào.
              </div>
            ) : (
              <div className="pr-historyTable">
                <div className="pr-historyTr pr-historyTh">
                  <div>THỜI ĐIỂM</div>
                  <div>BÁO CÁO</div>
                  <div>NHÂN VIÊN COLLECTOR</div>
                  <div>MÃ NHÂN VIÊN</div>
                </div>

                {assignmentHistoryRows.map((item) => (
                  <div className="pr-historyTr" key={item.id}>
                    <div>{item.assignedAtText || item.assignedAt || "-"}</div>
                    <div className="pr-strong">#{item.reportId}</div>
                    <div>{item.collectorName || "-"}</div>
                    <div>{item.collectorId || "-"}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
