import React, { useEffect, useMemo, useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import ImageSection from "@/components/ui/image-section";
import { Textarea } from "@/components/ui/textarea";
import CollectionReportDetail from "../collection-detail/CollectionReportDetail";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Check,
  MapPin,
  Phone,
  CircleUserRound,
  PackageOpen,
  Clock3,
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

const Stat = ({ icon, label, value, tone }) => (
  <Card>
    <CardContent className="p-4 flex items-start gap-3">
      <div
        className={`size-9 rounded-full flex items-center justify-center ${
          tone === "green"
            ? "bg-green-100 text-green-700"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground uppercase">{label}</p>
        <p className="font-semibold text-sm mt-1">{value}</p>
      </div>
    </CardContent>
  </Card>
);

const TimelineItem = ({ item }) => (
  <div className="flex gap-3">
    <div
      className={`mt-1.5 size-2.5 rounded-full ${
        item.state === "done"
          ? "bg-green-500"
          : item.state === "active"
            ? "bg-orange-500"
            : "bg-slate-300"
      }`}
    />
    <div>
      <p className="font-medium text-sm">{item.title}</p>
      <p className="text-xs text-muted-foreground">{item.time}</p>
    </div>
  </div>
);

function ReportMapCanvas({ center, location }) {
  return (
    <MapContainer
      center={center}
      zoom={13}
      className="h-90 w-full rounded-lg z-0"
    >
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
  const DEST_LAT = Number(
    import.meta.env.VITE_HCMC_POST_OFFICE_LAT || 10.779784,
  );
  const DEST_LNG = Number(
    import.meta.env.VITE_HCMC_POST_OFFICE_LNG || 106.699173,
  );

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
    const baseTimeline = Array.isArray(data?.timeline)
      ? [...data.timeline]
      : [];
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
    selectedFrom === "pending-list"
      ? "Danh sách chờ xử lý"
      : "Chi tiết báo cáo";
  const assignedCollectorName =
    location.state?.assignedCollectorName || latestAssignment?.collectorName;
  const assignedAtText = latestAssignment?.assignedAtText;

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        <Button
          type="button"
          variant="link"
          className="px-0 h-auto"
          onClick={() => navigate("/enterprise/reports")}
        >
          Báo cáo
        </Button>
        <span> / </span>
        <Button
          type="button"
          variant="link"
          className="px-0 h-auto"
          onClick={() => navigate("/enterprise/reports")}
        >
          Chờ xử lý
        </Button>
        <span> / </span>
        <span className="font-medium text-foreground">Chi tiết #{data.id}</span>
      </div>

      <Card>
        <CardContent className="p-6 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Report #{data.id}</h1>
              <Badge variant="outline">{data.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Gửi lúc {data.createdAt}
            </p>
            <p className="text-sm text-muted-foreground">
              Nguồn mở: {selectedFromText}
            </p>
            {rawStatus === "REJECTED" && (
              <p className="text-sm text-red-600 font-medium">
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
              className="text-orange-700 border-orange-300 hover:bg-orange-50"
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
              className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
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
              type="button"
              onClick={() => setCollectionPopupOpen(true)}
            >
              <PackageOpen className="size-4 mr-1" /> Xem thu gom
            </Button>
            <Button
              type="button"
              onClick={() => navigate("/enterprise/reports")}
            >
              Quay về
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={isCollectionPopupOpen}
        onOpenChange={setCollectionPopupOpen}
      >
        <DialogContent
          className="max-w-none overflow-hidden p-0"
          style={{ width: "95vw", maxWidth: 1200, height: "85vh" }}
        >
          <div className="h-full">
            <CollectionReportDetail reportId={routeReportId} isPopup />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAssignPopupOpen} onOpenChange={setAssignPopupOpen}>
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
            <div className="p-6 border-b">
              <div>
                <h2 className="text-xl font-semibold">
                  Gán collector cho báo cáo #{routeReportId}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Chọn collector phù hợp dựa trên khoảng cách và tải công việc.
                </p>
              </div>
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
                <Card className="mx-6 mt-6">
                  <CardContent className="p-4 space-y-2">
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
                  </CardContent>
                </Card>

                {!collectors.length ? (
                  <div className="p-6 text-sm text-muted-foreground">
                    Hiện chưa có collector khả dụng.
                  </div>
                ) : (
                  <div className="p-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>COLLECTOR</TableHead>
                          <TableHead>KHOẢNG CÁCH</TableHead>
                          <TableHead>TẢI CÔNG VIỆC</TableHead>
                          <TableHead className="text-right">THAO TÁC</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {collectors.map((collector) => (
                          <TableRow key={collector.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {collector.name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {collector.id} • {collector.status}
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

                            <TableCell className="text-sm text-muted-foreground">
                              {collector.tasks}/{collector.maxTasks} tasks •{" "}
                              {collector.loadPercent}%
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

      <Dialog open={isRejectPopupOpen} onOpenChange={setRejectPopupOpen}>
        <DialogContent className="max-w-lg p-0 z-500">
          <div className="p-6 space-y-3">
            <h3 className="text-lg font-semibold">
              Lý do từ chối báo cáo #{routeReportId}
            </h3>
            <p className="text-sm text-muted-foreground">
              Nhập lý do để gửi kèm khi từ chối báo cáo.
            </p>

            <Textarea
              placeholder="Ví dụ: Báo cáo không đúng loại rác hoặc thông tin chưa hợp lệ..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={6}
              disabled={actionLoading === "reject"}
            />

            <div className="flex justify-end gap-2">
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
                className="bg-orange-600 hover:bg-orange-700"
                onClick={submitReject}
                disabled={actionLoading === "reject"}
              >
                {actionLoading === "reject"
                  ? "Đang gửi..."
                  : "Xác nhận từ chối"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <Card className="xl:col-span-7">
          <CardHeader>
            <CardTitle>Hình ảnh</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <ImageSection
                title="Hình ảnh từ người dân"
                image={citizenImage}
              />
              <ImageSection
                title="Hình ảnh từ collector"
                image={collectorImage}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-5">
          <CardHeader>
            <CardTitle>Bản đồ vị trí</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ReportMapCanvas
              center={center}
              location={data.location}
              destination={destination}
            />

            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">TỌA ĐỘ GPS</p>
                <p className="text-sm font-medium">
                  {data.location.lat.toFixed(6)}, {data.location.lng.toFixed(6)}
                </p>
              </div>

              <Button variant="outline" type="button" onClick={openDirections}>
                Xem đường đi
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="xl:col-span-12 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Stat
            tone="green"
            icon={<Check className="size-4" />}
            label="LOẠI CHẤT THẢI"
            value={data.wasteType}
          />
          <Stat
            tone="green"
            icon={<Check className="size-4" />}
            label="KHỐI LƯỢNG ƯỚC TÍNH"
            value={data.weightEstimate}
          />
          <Stat
            tone="green"
            icon={<Check className="size-4" />}
            label="KHỐI LƯỢNG THỰC TẾ"
            value={
              data.actualQuantity !== null && data.actualQuantity !== undefined
                ? `${data.actualQuantity} ${data.unitType || ""}`
                : "Chưa cập nhật"
            }
          />
          <Stat
            tone="muted"
            icon={<CircleUserRound className="size-4" />}
            label="NGƯỜI BÁO CÁO"
            value={data.reporter?.name || "Không rõ"}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-7 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ghi chú từ người dân</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{data.note || data.description || "-"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Địa chỉ chi tiết</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="size-4 mt-0.5 text-muted-foreground" />
                <span>
                  {resolvedAddress ||
                    data.address ||
                    "Chưa có địa chỉ chi tiết"}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CircleUserRound className="size-4 text-muted-foreground" />
                  <span>{data.reporter?.name || "Không rõ"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="size-4 text-muted-foreground" />
                  <span>{data.reporter?.phone || "Không có SĐT"}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CircleUserRound className="size-4 text-muted-foreground" />
                  <span>
                    Collector: {data.collector?.fullname || "Chưa gán"}
                    {data.collector?.phone ? ` (${data.collector.phone})` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-4 text-muted-foreground" />
                  <span>
                    Trạng thái: {data.status} | Số lượng thực tế:{" "}
                    {data.actualQuantity ?? "-"} {data.unitType || ""}
                  </span>
                </div>
                {rawStatus === "REJECTED" && (
                  <div className="flex items-center gap-2 text-red-600">
                    <Clock3 className="size-4" />
                    <span>Lý do từ chối: {rejectReasonText}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="xl:col-span-5">
          <CardHeader>
            <CardTitle>Lịch sử hoạt động</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {timelineItems.map((t, idx) => (
              <TimelineItem key={idx} item={t} />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
