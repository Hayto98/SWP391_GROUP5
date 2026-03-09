import { useEffect, useMemo, useState } from "react";
import "./reportDetail.css";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useReportDetail } from "../../../../hooks/useReportDetail";
import { reverseGeocode } from "../../../../services/geocodingService";
import {
  getLatestReportAssignment,
  recordReportAssignment,
} from "../../../../services/reportAssignmentHistory.service";
import { updatePendingReportStatus } from "../../../../services/pendingReports.service";
import {
  assignTaskToCollector,
  getDispatchAssign,
} from "../../../../services/dispatchAssign.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import ImageSection from "@/components/ui/image-section";
import { Textarea } from "@/components/ui/textarea";
import CollectionReportDetail from "../collection-detail/CollectionReportDetail";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  AlertTriangle,
  Check,
  Clock3,
  MapPin,
  Package,
  Phone,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

// Fix default marker icon for Leaflet in Vite/React environments.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const STATUS_BADGE_CLASS = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  ACCEPTED: "bg-blue-50 text-blue-700 border-blue-200",
  ASSIGNED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  COLLECTED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
};

const STAT_ICON_CLASS = {
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  orange: "bg-amber-50 text-amber-700 border-amber-200",
  muted: "bg-slate-100 text-slate-700 border-slate-200",
};

const TIMELINE_DOT_CLASS = {
  done: "bg-emerald-500 border-emerald-500",
  active: "bg-white border-emerald-500",
  todo: "bg-white border-slate-300",
};

const StatCard = ({ icon, label, value, tone = "muted" }) => (
  <Card className="py-0">
    <CardContent className="flex items-center gap-3 p-4">
      <div
        className={[
          "flex h-10 w-10 items-center justify-center rounded-lg border",
          STAT_ICON_CLASS[tone] || STAT_ICON_CLASS.muted,
        ].join(" ")}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </CardContent>
  </Card>
);

const TimelineItem = ({ item, isLast }) => (
  <div className="relative pl-6">
    <span
      className={[
        "absolute left-0 top-1.5 h-3 w-3 rounded-full border-2",
        TIMELINE_DOT_CLASS[item?.state] || TIMELINE_DOT_CLASS.todo,
      ].join(" ")}
    />
    {!isLast && (
      <span
        className="absolute top-5 w-px bg-border"
        style={{ left: 5, height: "calc(100% - 8px)" }}
      />
    )}
    <p className="text-sm font-semibold">{item?.title || "-"}</p>
    <p className="text-xs text-muted-foreground">{item?.time || "-"}</p>
  </div>
);

function ReportMapCanvas({ center, location }) {
  return (
    <MapContainer center={center} zoom={13} className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Marker position={location}>
        <Popup>Vị trí báo cáo</Popup>
      </Marker>
    </MapContainer>
  );
}

export default function ReportDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const DEST_LAT = Number(import.meta.env.VITE_HCMC_POST_OFFICE_LAT || 10.779784);
  const DEST_LNG = Number(import.meta.env.VITE_HCMC_POST_OFFICE_LNG || 106.699173);

  const destination = useMemo(
    () => ({ lat: DEST_LAT, lng: DEST_LNG }),
    [DEST_LAT, DEST_LNG],
  );

  const params = useParams();
  const reportId = params?.id || "ID-12345";
  const { data, loading, error, reload } = useReportDetail(reportId);

  const [isCollectionPopupOpen, setCollectionPopupOpen] = useState(false);
  const [isAssignPopupOpen, setAssignPopupOpen] = useState(false);
  const [isRejectPopupOpen, setRejectPopupOpen] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState("");
  const [actionLoading, setActionLoading] = useState("");
  const [assignData, setAssignData] = useState(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState("");
  const [assigningCollectorId, setAssigningCollectorId] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  const center = useMemo(() => {
    if (!data?.location) return { lat: 10.776261, lng: 106.66602 };
    return data.location;
  }, [data]);

  useEffect(() => {
    let isCancelled = false;

    const loadAddress = async () => {
      const lat = Number(data?.location?.lat);
      const lng = Number(data?.location?.lng);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        if (!isCancelled) setResolvedAddress("");
        return;
      }

      const address = await reverseGeocode(lat, lng);
      if (!isCancelled) {
        setResolvedAddress(address || "");
      }
    };

    loadAddress();

    return () => {
      isCancelled = true;
    };
  }, [data?.location?.lat, data?.location?.lng]);

  const openDirections = () => {
    if (!data?.location) return;

    const origin = `${data.location.lat},${data.location.lng}`;
    const dest = `${destination.lat},${destination.lng}`;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}&travelmode=driving`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const routeReportId = String(data?.id || reportId).replace(/^#/, "");
  const rawStatus = String(data?.rawStatus || data?.status || "").toUpperCase();
  const canAccept = rawStatus === "PENDING";
  const canReject = rawStatus === "PENDING";
  const canAssign = rawStatus === "ACCEPTED";
  const rejectReasonText = data?.reason || "Không có lý do từ chối";
  const latestAssignment = useMemo(
    () => getLatestReportAssignment(routeReportId),
    [routeReportId],
  );
  const selectedReport = assignData?.selectedReport;
  const collectors = assignData?.collectors || [];

  const openAssignPopup = async () => {
    setAssignPopupOpen(true);
    setAssignError("");
    setAssignLoading(true);

    try {
      const res = await getDispatchAssign(routeReportId);
      setAssignData(res);
    } catch (e) {
      setAssignError(e?.message || "Không tải được danh sách collector");
    } finally {
      setAssignLoading(false);
    }
  };

  const handleAction = async (type, reason) => {
    setActionLoading(type);
    try {
      await updatePendingReportStatus({
        reportId: routeReportId,
        action: type,
        reason,
      });

      toast.success(
        type === "accept"
          ? "Đã chấp nhận báo cáo thành công"
          : "Đã từ chối báo cáo thành công",
      );
      await reload();
    } catch (e) {
      toast.error(e?.message || "Thao tác thất bại");
    } finally {
      setActionLoading("");
    }
  };

  const openRejectPopup = () => {
    setRejectReason("");
    setRejectPopupOpen(true);
  };

  const submitReject = async () => {
    const trimmedReason = rejectReason.trim();

    if (!trimmedReason) {
      toast.error("Vui lòng nhập lý do từ chối");
      return;
    }

    await handleAction("reject", trimmedReason);
    setRejectPopupOpen(false);
    setRejectReason("");
  };

  const handleAssignCollector = async (collector) => {
    if (!collector?.id) return;

    setAssigningCollectorId(collector.id);
    setAssignError("");

    try {
      const assignResult = await assignTaskToCollector({
        reportId: routeReportId,
        collectorId: collector.id,
      });

      const assignedCollectorName =
        assignResult?.collector?.fullname || collector.name;

      recordReportAssignment({
        reportId: routeReportId,
        collectorId: collector.id,
        collectorName: assignedCollectorName,
      });

      toast.success(
        `Nhân viên ${assignedCollectorName} vừa được gán cho báo cáo #${routeReportId}.`,
      );

      setAssignPopupOpen(false);
      await reload();
    } catch (e) {
      setAssignError(e?.message || "Gán collector thất bại");
    } finally {
      setAssigningCollectorId("");
    }
  };

  const timelineItems = useMemo(() => {
    const baseTimeline = Array.isArray(data?.timeline) ? [...data.timeline] : [];
    if (!latestAssignment) return baseTimeline;

    const assignTitle = `Đã phân công cho ${latestAssignment.collectorName}`;
    const assignTime =
      latestAssignment.assignedAtText || latestAssignment.assignedAt;

    const scheduleIndex = baseTimeline.findIndex(
      (item) => String(item?.title || "").toLowerCase() === "lên lịch thu gom",
    );

    if (scheduleIndex >= 0) {
      baseTimeline[scheduleIndex] = {
        ...baseTimeline[scheduleIndex],
        title: assignTitle,
        time: assignTime,
        state: "done",
      };
    } else {
      baseTimeline.push({
        title: assignTitle,
        time: assignTime,
        state: "done",
      });
    }

    const pendingIndex = baseTimeline.findIndex((item) =>
      String(item?.title || "")
        .toLowerCase()
        .includes("chờ admin tiếp nhận"),
    );
    if (pendingIndex >= 0) {
      baseTimeline[pendingIndex] = {
        ...baseTimeline[pendingIndex],
        state: "done",
      };
    }

    return baseTimeline;
  }, [data?.timeline, latestAssignment]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="flex h-24 items-center justify-center text-sm text-muted-foreground">
            Đang tải...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="flex h-24 items-center justify-center text-sm text-red-600">
            Lỗi: {error}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const citizenImage =
    data?.attachments?.[0]?.fileUri ||
    data?.attachments?.[0]?.file_uri ||
    data?.imageUrl ||
    null;
  const collectorImage = data?.collectorImages?.[0] || null;
  const selectedFrom = location.state?.selectedFrom;
  const selectedFromText =
    selectedFrom === "pending-list" ? "Danh sách chờ xử lý" : "Chi tiết báo cáo";
  const assignedCollectorName =
    location.state?.assignedCollectorName || latestAssignment?.collectorName;
  const assignedAtText = latestAssignment?.assignedAtText;

  return (
    <div className="space-y-6">
      <div className="text-xs text-muted-foreground">
        <Button
          variant="link"
          className="h-auto p-0 text-xs text-muted-foreground"
          type="button"
          onClick={() => navigate("/enterprise/reports")}
        >
          Báo cáo
        </Button>
        <span> / </span>
        <Button
          variant="link"
          className="h-auto p-0 text-xs text-muted-foreground"
          type="button"
          onClick={() => navigate("/enterprise/reports")}
        >
          Chờ xử lý
        </Button>
        <span> / </span>
        <span>Chi tiết #{data.id}</span>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-xl lg:text-2xl">Report #{data.id}</CardTitle>
                <Badge
                  variant="outline"
                  className={
                    STATUS_BADGE_CLASS[rawStatus] ||
                    "bg-slate-100 text-slate-700 border-slate-200"
                  }
                >
                  {data.status || rawStatus || "-"}
                </Badge>
              </div>

              <CardDescription>Gửi lúc {data.createdAt}</CardDescription>
              <p className="text-sm text-muted-foreground">Nguồn mở: {selectedFromText}</p>

              {rawStatus === "REJECTED" && (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                  Lý do từ chối: {rejectReasonText}
                </p>
              )}

              {assignedCollectorName && (
                <p className="text-sm text-muted-foreground">
                  Đã gán cho collector: {assignedCollectorName}
                  {assignedAtText ? ` (${assignedAtText})` : ""}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                type="button"
                disabled={!canAccept || actionLoading !== ""}
                title={
                  canAccept
                    ? "Chấp nhận báo cáo"
                    : "Chỉ có thể chấp nhận khi báo cáo đang PENDING"
                }
                onClick={() => handleAction("accept")}
              >
                {actionLoading === "accept" ? "..." : "Chấp nhận"}
              </Button>

              <Button
                variant="outline"
                className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                type="button"
                disabled={!canAssign || actionLoading !== ""}
                title={
                  canAssign
                    ? "Gán collector"
                    : rawStatus === "ASSIGNED"
                      ? "Báo cáo đã được gán collector"
                      : "Cần chấp nhận báo cáo trước khi gán"
                }
                onClick={openAssignPopup}
              >
                {rawStatus === "ASSIGNED" ? "Đã gán" : "Gán"}
              </Button>

              <Button
                variant="outline"
                className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                type="button"
                disabled={!canReject || actionLoading !== ""}
                title={
                  canReject
                    ? "Từ chối báo cáo"
                    : "Chỉ có thể từ chối khi báo cáo đang PENDING"
                }
                onClick={openRejectPopup}
              >
                {actionLoading === "reject" ? "..." : "Từ chối"}
              </Button>

              <Button
                variant="outline"
                className="gap-2"
                type="button"
                onClick={() => setCollectionPopupOpen(true)}
              >
                <Package className="size-4" />
                Xem thu gom
              </Button>

              <Button type="button" onClick={() => navigate("/enterprise/reports")}>
                Quay về
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Dialog open={isCollectionPopupOpen} onOpenChange={setCollectionPopupOpen}>
        <DialogContent
          className="max-w-none overflow-hidden p-0"
          style={{ width: "95vw", maxWidth: 1200, height: "85vh" }}
        >
          <div className="rd-popupWrap">
            <CollectionReportDetail reportId={routeReportId} isPopup />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAssignPopupOpen} onOpenChange={setAssignPopupOpen}>
        <DialogContent
          className="max-w-none p-0"
          style={{ width: "94vw", maxWidth: 980, maxHeight: "86vh", overflow: "auto" }}
        >
          <div className="rd-assignDialog">
            <div className="rd-assignHead">
              <div>
                <h2>Gán collector cho báo cáo #{routeReportId}</h2>
                <p>Chọn collector phù hợp dựa trên khoảng cách và tải công việc.</p>
              </div>
            </div>

            {assignLoading && (
              <div className="rd-assignState">Đang tải danh sách collector...</div>
            )}
            {!assignLoading && assignError && (
              <div className="rd-assignState rd-assignError">Lỗi: {assignError}</div>
            )}

            {!assignLoading && !assignError && selectedReport && (
              <>
                <div className="rd-assignReport">
                  <div className="rd-assignReportTitle">
                    Báo cáo #{selectedReport.id} • {selectedReport.status}
                  </div>
                  <div className="rd-assignReportMeta">
                    <MapPin className="size-4" />
                    <span>{selectedReport.address}</span>
                  </div>
                  <div className="rd-assignReportMeta">
                    <Clock3 className="size-4" />
                    <span>{selectedReport.weightEstimate}</span>
                  </div>
                </div>

                {!collectors.length ? (
                  <div className="rd-assignState">Hiện chưa có collector khả dụng.</div>
                ) : (
                  <div className="rd-assignListTable">
                    <div className="rd-assignRow rd-assignRowHead">
                      <div>COLLECTOR</div>
                      <div>KHOẢNG CÁCH</div>
                      <div>TẢI CÔNG VIỆC</div>
                      <div>THAO TÁC</div>
                    </div>

                    {collectors.map((collector) => (
                      <div className="rd-assignRow" key={collector.id}>
                        <div className="rd-assignCollector">
                          <div>
                            <div className="rd-strong">{collector.name}</div>
                            <div className="rd-sub">
                              {collector.id} • {collector.status}
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="rd-strong">
                            {collector.distanceKm.toFixed(1)} km
                          </div>
                          <div className="rd-sub">{collector.etaText}</div>
                        </div>

                        <div className="rd-sub">
                          {collector.tasks}/{collector.maxTasks} tasks • {collector.loadPercent}%
                        </div>

                        <div>
                          <Button
                            type="button"
                            variant="outline"
                            className="h-8 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            disabled={
                              !collector.canAssign || assigningCollectorId === collector.id
                            }
                            onClick={() => handleAssignCollector(collector)}
                          >
                            {assigningCollectorId === collector.id ? "..." : "Gán"}
                          </Button>
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

      <Dialog open={isRejectPopupOpen} onOpenChange={setRejectPopupOpen}>
        <DialogContent className="max-w-lg p-0">
          <div className="rd-rejectDialog">
            <h3>Lý do từ chối báo cáo #{routeReportId}</h3>
            <p>Nhập lý do để gửi kèm khi từ chối báo cáo.</p>

            <Textarea
              className="mt-3 min-h-28 bg-white text-foreground"
              placeholder="Ví dụ: Báo cáo không đúng loại rác hoặc thông tin chưa hợp lệ..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={5}
              disabled={actionLoading === "reject"}
            />

            <div className="rd-rejectActions">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRejectPopupOpen(false)}
                disabled={actionLoading === "reject"}
              >
                Hủy
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                onClick={submitReject}
                disabled={actionLoading === "reject"}
              >
                {actionLoading === "reject" ? "Đang gửi..." : "Xác nhận từ chối"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Hình ảnh đối chứng</CardTitle>
            <CardDescription>Ảnh người dân gửi và ảnh collector chụp tại hiện trường</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              <ImageSection title="Hình ảnh từ người dân" image={citizenImage} />
              <ImageSection title="Hình ảnh từ collector" image={collectorImage} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Thông tin vị trí</CardTitle>
              <CardDescription>
                {center.lat.toFixed(6)}, {center.lng.toFixed(6)}
              </CardDescription>
            </div>
            <Button variant="outline" type="button" onClick={openDirections}>
              Xem đường đi
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="overflow-hidden rounded-xl border" style={{ height: 280 }}>
              <ReportMapCanvas center={center} location={data.location} />
            </div>
            <p className="text-sm text-muted-foreground">
              {resolvedAddress || data.address || "Chưa có địa chỉ chi tiết"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          tone="green"
          icon={<Check className="size-4" />}
          label="Loại chất thải"
          value={data.wasteType}
        />
        <StatCard
          tone="green"
          icon={<Check className="size-4" />}
          label="Khối lượng ước tính"
          value={data.weightEstimate}
        />
        <StatCard
          tone="green"
          icon={<Check className="size-4" />}
          label="Khối lượng thực tế"
          value={
            data.actualQuantity !== null && data.actualQuantity !== undefined
              ? `${data.actualQuantity} ${data.unitType || ""}`
              : "Chưa cập nhật"
          }
        />
        <StatCard
          tone="muted"
          icon={<UserRound className="size-4" />}
          label="Người báo cáo"
          value={data.reporter?.name || "Không rõ"}
        />
        <StatCard
          tone="orange"
          icon={<AlertTriangle className="size-4" />}
          label="Mức độ ưu tiên"
          value={data.priority}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ghi chú từ người dân</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="rounded-lg border bg-slate-50 px-4 py-3 text-sm text-slate-700">
                {data.note || data.description || "-"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thông tin liên hệ và địa chỉ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2 text-sm text-slate-700">
                <MapPin className="mt-0.5 size-4 text-muted-foreground" />
                <span>{resolvedAddress || data.address || "Chưa có địa chỉ chi tiết"}</span>
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                <div className="flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium">
                  <UserRound className="size-4 text-muted-foreground" />
                  <span>{data.reporter?.name || "Không rõ"}</span>
                </div>
                <div className="flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium">
                  <Phone className="size-4 text-muted-foreground" />
                  <span>{data.reporter?.phone || "Không có SĐT"}</span>
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                <div className="flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium">
                  <UserRound className="size-4 text-muted-foreground" />
                  <span>
                    Collector: {data.collector?.fullname || "Chưa gán"}
                    {data.collector?.phone ? ` (${data.collector.phone})` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium">
                  <Check className="size-4 text-muted-foreground" />
                  <span>
                    Trạng thái: {data.status} | SL thực tế: {data.actualQuantity ?? "-"} {data.unitType || ""}
                  </span>
                </div>
              </div>

              {rawStatus === "REJECTED" && (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                  Lý do từ chối: {rejectReasonText}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lịch sử hoạt động</CardTitle>
          </CardHeader>
          <CardContent>
            {timelineItems.length ? (
              <div className="space-y-4">
                {timelineItems.map((item, idx) => (
                  <TimelineItem
                    key={`${item?.title || "timeline"}-${idx}`}
                    item={item}
                    isLast={idx === timelineItems.length - 1}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Chưa có mốc hoạt động</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
