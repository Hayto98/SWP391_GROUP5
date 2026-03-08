import React, { useMemo, useState } from "react";
import "./reportDetail.css";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useReportDetail } from "../../../../hooks/useReportDetail";
import { getLatestReportAssignment } from "../../../../services/reportAssignmentHistory.service";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import CollectionReportDetail from "../collection-detail/CollectionReportDetail";
import {
  GoogleMap,
  Marker,
  DirectionsRenderer,
  useJsApiLoader,
} from "@react-google-maps/api";
import {
  FaCheck,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaUserCircle,
  FaExclamationTriangle,
  FaBoxOpen,
  FaClock,
} from "react-icons/fa";

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

function ReportMapCanvas({
  apiKey,
  center,
  location,
  destination,
  directions,
  mapOptions,
  onMapLoad,
}) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
  });

  if (loadError) {
    return <div className="rd-mapFallback">Không thể tải bản đồ</div>;
  }

  if (!isLoaded) {
    return <div className="rd-mapFallback">Đang tải bản đồ...</div>;
  }

  return (
    <GoogleMap
      mapContainerClassName="rd-mapCanvas"
      center={center}
      zoom={13}
      options={mapOptions}
      onLoad={onMapLoad}
    >
      <Marker position={location} />
      <Marker position={destination} />
      {directions && (
        <DirectionsRenderer
          directions={directions}
          options={{ suppressMarkers: true }}
        />
      )}
    </GoogleMap>
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
  const { data, loading, error } = useReportDetail(reportId);

  const [imgSrc, setImgSrc] = useState("");
  const [isCollectionPopupOpen, setCollectionPopupOpen] = useState(false);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

  const [directions, setDirections] = useState(null);

  const center = useMemo(() => {
    if (!data?.location) return { lat: 10.776261, lng: 106.66602 };
    return data.location;
  }, [data]);

  const mapOptions = useMemo(
    () => ({
      disableDefaultUI: true,
      zoomControl: true,
      clickableIcons: false,
    }),
    [],
  );

  const computeDirections = async () => {
    if (!window.google || !data?.location || !destination) return;
    const svc = new window.google.maps.DirectionsService();
    const res = await svc.route({
      origin: data.location,
      destination,
      travelMode: window.google.maps.TravelMode.DRIVING,
    });
    setDirections(res);
  };

  const routeReportId = String(data?.id || reportId).replace(/^#/, "");
  const latestAssignment = useMemo(
    () => getLatestReportAssignment(routeReportId),
    [routeReportId],
  );
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

  const imageUrl = imgSrc || data.imageUrl;
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
          {assignedCollectorName && (
            <div className="rd-sub">
              Đã gán cho collector: {assignedCollectorName}
              {assignedAtText ? ` (${assignedAtText})` : ""}
            </div>
          )}
        </div>

        <div className="rd-headActions">
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

      <div className="rd-topGrid">
        <div className="rd-card rd-photo">
          <div className="rd-photoInner">
            <img
              src={imageUrl}
              alt="report"
              onError={() => setImgSrc("https://picsum.photos/1200/800")}
            />
            <div className="rd-photoLabel">Hình ảnh từ người dân</div>
          </div>
        </div>

        <div className="rd-card rd-map">
          <div className="rd-mapInner">
            {!apiKey ? (
              <div className="rd-mapFallback">
                Thiếu VITE_GOOGLE_MAPS_API_KEY
              </div>
            ) : (
              <ReportMapCanvas
                apiKey={apiKey}
                center={center}
                location={data.location}
                destination={destination}
                directions={directions}
                mapOptions={mapOptions}
                onMapLoad={computeDirections}
              />
            )}

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
                onClick={computeDirections}
                disabled={!apiKey}
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
              <span>{data.address || "Chưa có địa chỉ chi tiết"}</span>
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
              <div className="rd-contactItem">
                <FaClock />
                <span>Lý do: {data.reason || "-"}</span>
              </div>
            </div>

            {!!data.collectorImages?.length && (
              <div style={{ marginTop: 12 }}>
                <div className="rd-secTitle" style={{ marginBottom: 8 }}>
                  Ảnh thu gom từ collector
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {data.collectorImages.map((img, idx) => (
                    <img
                      key={`${img}-${idx}`}
                      src={img}
                      alt={`collector-${idx}`}
                      style={{
                        width: 110,
                        height: 80,
                        objectFit: "cover",
                        borderRadius: 8,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
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
