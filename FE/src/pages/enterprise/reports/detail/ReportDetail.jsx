import React, { useEffect, useMemo, useState } from "react";
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
import { Dialog, DialogContent } from "@/components/ui/dialog";
import ImageSection from "@/components/ui/image-section";
import CollectionReportDetail from "../collection-detail/CollectionReportDetail";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  FaCheck,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaUserCircle,
  FaExclamationTriangle,
  FaBoxOpen,
  FaClock,
} from "react-icons/fa";
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
  <div className="rd-stat">
    <div className={`rd-statIcon rd-statIcon-${tone}`}>{icon}</div>
    <div className="rd-statMeta">
      <div className="rd-statLabel">{label}</div>
      <div className={`rd-statValue rd-statValue-${tone}`}>{value}</div>
    </div>
  </div>
);

const TimelineItem = ({ item }) => (
  <div className="rd-tlItem">
    <div className={`rd-tlDot rd-tlDot-${item.state}`} />
    <div className="rd-tlBody">
      <div className="rd-tlTitle">{item.title}</div>
      <div className="rd-tlTime">{item.time}</div>
    </div>
  </div>
);

function ReportMapCanvas({ center, location }) {
  return (
    <MapContainer center={center} zoom={13} className="rd-mapCanvas">
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

  if (loading) return <div style={{ padding: 16 }}>Đang tải...</div>;
  if (error)
    return <div style={{ padding: 16, color: "#991b1b" }}>Lỗi: {error}</div>;
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
    <div className="rd">
      <div className="rd-breadcrumb">
        <button
          type="button"
          className="rd-breadcrumbLink"
          onClick={() => navigate("/enterprise/reports")}
        >
          Báo cáo
        </button>
        <span> / </span>
        <button
          type="button"
          className="rd-breadcrumbLink"
          onClick={() => navigate("/enterprise/reports")}
        >
          Chờ xử lý
        </button>
        <span> / </span>
        <span>Chi tiết #{data.id}</span>
      </div>

      <div className="rd-head">
        <div>
          <div className="rd-titleRow">
            <h1>Report #{data.id}</h1>
            <span className="rd-status">{data.status}</span>
          </div>
          <div className="rd-sub">Gửi lúc {data.createdAt}</div>
          <div className="rd-sub">Nguồn mở: {selectedFromText}</div>
          {rawStatus === "REJECTED" && (
            <div className="rd-rejectReason">
              Lý do từ chối: {rejectReasonText}
            </div>
          )}
          {assignedCollectorName && (
            <div className="rd-sub">
              Đã gán cho collector: {assignedCollectorName}
              {assignedAtText ? ` (${assignedAtText})` : ""}
            </div>
          )}
        </div>

        <div className="rd-headActions">
          <button
            className="rd-btnWarn"
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
          </button>
          <button
            className="rd-btnOk"
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
          </button>
          <button
            className="rd-btnGhost"
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
          </button>
          <button
            className="rd-btnGhost"
            type="button"
            onClick={() => setCollectionPopupOpen(true)}
          >
            <FaBoxOpen /> Xem thu gom
          </button>
          <button
            className="rd-btnPrimary"
            type="button"
            onClick={() => navigate("/enterprise/reports")}
          >
            Quay về
          </button>
        </div>
      </div>

      <Dialog
        open={isCollectionPopupOpen}
        onOpenChange={setCollectionPopupOpen}
      >
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
          className="max-w-none p-0 z-500"
          style={{
            width: "94vw",
            maxWidth: 980,
            maxHeight: "86vh",
            overflow: "auto",
          }}
        >
          <div className="rd-assignDialog ">
            <div className="rd-assignHead">
              <div>
                <h2>Gán collector cho báo cáo #{routeReportId}</h2>
                <p>
                  Chọn collector phù hợp dựa trên khoảng cách và tải công việc.
                </p>
              </div>
            </div>

            {assignLoading && (
              <div className="rd-assignState">
                Đang tải danh sách collector...
              </div>
            )}
            {!assignLoading && assignError && (
              <div className="rd-assignState rd-assignError">
                Lỗi: {assignError}
              </div>
            )}

            {!assignLoading && !assignError && selectedReport && (
              <>
                <div className="rd-assignReport">
                  <div className="rd-assignReportTitle">
                    Báo cáo #{selectedReport.id} • {selectedReport.status}
                  </div>
                  <div className="rd-assignReportMeta">
                    <FaMapMarkerAlt />
                    <span>{selectedReport.address}</span>
                  </div>
                  <div className="rd-assignReportMeta">
                    <FaClock />
                    <span>{selectedReport.weightEstimate}</span>
                  </div>
                </div>

                {!collectors.length ? (
                  <div className="rd-assignState">
                    Hiện chưa có collector khả dụng.
                  </div>
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
                          {collector.tasks}/{collector.maxTasks} tasks •{" "}
                          {collector.loadPercent}%
                        </div>

                        <div>
                          <button
                            type="button"
                            className="rd-btnOk"
                            disabled={
                              !collector.canAssign ||
                              assigningCollectorId === collector.id
                            }
                            onClick={() => handleAssignCollector(collector)}
                          >
                            {assigningCollectorId === collector.id
                              ? "..."
                              : "Gán"}
                          </button>
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
        <DialogContent className="max-w-lg p-0 z-500">
          <div className="rd-rejectDialog">
            <h3>Lý do từ chối báo cáo #{routeReportId}</h3>
            <p>Nhập lý do để gửi kèm khi từ chối báo cáo.</p>

            <textarea
              className="rd-rejectTextarea"
              placeholder="Ví dụ: Báo cáo không đúng loại rác hoặc thông tin chưa hợp lệ..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={5}
              disabled={actionLoading === "reject"}
            />

            <div className="rd-rejectActions">
              <button
                type="button"
                className="rd-btnGhost"
                onClick={() => setRejectPopupOpen(false)}
                disabled={actionLoading === "reject"}
              >
                Hủy
              </button>
              <button
                type="button"
                className="rd-btnWarn"
                onClick={submitReject}
                disabled={actionLoading === "reject"}
              >
                {actionLoading === "reject"
                  ? "Đang gửi..."
                  : "Xác nhận từ chối"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="rd-topGrid">
        <div className="rd-card rd-photo">
          <div className="rd-photoInner" style={{ padding: 12 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 12,
              }}
            >
              <ImageSection
                title="Hình ảnh từ người dân"
                image={citizenImage}
              />
              <ImageSection
                title="Hình ảnh từ collector"
                image={collectorImage}
              />
            </div>
          </div>
        </div>

        <div className="rd-card rd-map">
          <div className="rd-mapInner">
            <ReportMapCanvas
              center={center}
              location={data.location}
              destination={destination}
            />

            <div className="rd-mapInfo">
              <div className="rd-mapInfoTop">
                <div className="rd-mapTitle">TỌA ĐỘ GPS</div>
                <div className="rd-mapCoord">
                  {data.location.lat.toFixed(6)}, {data.location.lng.toFixed(6)}
                </div>
              </div>

              <button
                className="rd-mapBtn"
                type="button"
                onClick={openDirections}
              >
                Xem đường đi
              </button>
            </div>
          </div>
        </div>

        <div className="rd-statRow">
          <Stat
            tone="green"
            icon={<FaCheck />}
            label="LOẠI CHẤT THẢI"
            value={data.wasteType}
          />
          <Stat
            tone="green"
            icon={<FaCheck />}
            label="KHỐI LƯỢNG ƯỚC TÍNH"
            value={data.weightEstimate}
          />
          <Stat
            tone="green"
            icon={<FaCheck />}
            label="KHỐI LƯỢNG THỰC TẾ"
            value={
              data.actualQuantity !== null && data.actualQuantity !== undefined
                ? `${data.actualQuantity} ${data.unitType || ""}`
                : "Chưa cập nhật"
            }
          />
          <Stat
            tone="muted"
            icon={<FaUserCircle />}
            label="NGƯỜI BÁO CÁO"
            value={data.reporter?.name || "Không rõ"}
          />
          <Stat
            tone="orange"
            icon={<FaExclamationTriangle />}
            label="MỨC ĐỘ ƯU TIÊN"
            value={data.priority}
          />
        </div>
      </div>

      <div className="rd-bottomGrid">
        <div className="rd-leftCol">
          <div className="rd-card rd-section">
            <div className="rd-secTitle">Ghi chú từ người dân</div>
            <div className="rd-note">
              {data.note || data.description || "-"}
            </div>
          </div>

          <div className="rd-card rd-section">
            <div className="rd-secTitle">Địa chỉ chi tiết</div>
            <div className="rd-address">
              <FaMapMarkerAlt />
              <span>
                {resolvedAddress || data.address || "Chưa có địa chỉ chi tiết"}
              </span>
            </div>

            <div className="rd-contact">
              <div className="rd-contactItem">
                <FaUserCircle />
                <span>{data.reporter?.name || "Không rõ"}</span>
              </div>
              <div className="rd-contactItem">
                <FaPhoneAlt />
                <span>{data.reporter?.phone || "Không có SĐT"}</span>
              </div>
            </div>

            <div className="rd-contact" style={{ marginTop: 10 }}>
              <div className="rd-contactItem">
                <FaUserCircle />
                <span>
                  Collector: {data.collector?.fullname || "Chưa gán"}
                  {data.collector?.phone ? ` (${data.collector.phone})` : ""}
                </span>
              </div>
              <div className="rd-contactItem">
                <FaCheck />
                <span>
                  Trạng thái: {data.status} | Số lượng thực tế:{" "}
                  {data.actualQuantity ?? "-"} {data.unitType || ""}
                </span>
              </div>
              {rawStatus === "REJECTED" && (
                <div className="rd-contactItem rd-contactItemReject">
                  <FaClock />
                  <span>Lý do từ chối: {rejectReasonText}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rd-card rd-timeline">
          <div className="rd-secTitle">Lịch sử hoạt động</div>
          <div className="rd-tlList">
            {timelineItems.map((t, idx) => (
              <TimelineItem key={idx} item={t} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
