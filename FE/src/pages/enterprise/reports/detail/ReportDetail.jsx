import React, { useMemo, useState } from "react";
import "./reportDetail.css";
import { useParams } from "react-router-dom";
import EnterpriseLayout from "../../overview/EnterpriseLayout";
import { useReportDetail } from "../../../../hooks/useReportDetail";
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

export default function ReportDetail() {
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
  const { data, loading, error, acting, action } = useReportDetail(reportId);

  const [imgSrc, setImgSrc] = useState("");

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey,
  });

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

  if (loading) return <div style={{ padding: 16 }}>Đang tải...</div>;
  if (error)
    return <div style={{ padding: 16, color: "#991b1b" }}>Lỗi: {error}</div>;
  if (!data) return null;

  const imageUrl = imgSrc || data.imageUrl;

  return (
    <EnterpriseLayout>
      <div className="rd">
        <div className="rd-breadcrumb">
          Trang chủ / Báo cáo / Chi tiết Báo cáo #{data.id}
        </div>

        <div className="rd-head">
          <div>
            <div className="rd-titleRow">
              <h1>Report #{data.id}</h1>
              <span className="rd-status">{data.status}</span>
            </div>
            <div className="rd-sub">Gửi lúc {data.createdAt}</div>
          </div>

          <div className="rd-headActions">
            <button
              className="rd-btnGhost"
              type="button"
              disabled={acting}
              onClick={() => action("reject")}
            >
              Từ chối
            </button>
            <button
              className="rd-btnPrimary"
              type="button"
              disabled={acting}
              onClick={() => action("accept_assign")}
            >
              Tiếp nhận &amp; Phân công
            </button>
          </div>
        </div>

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
              ) : !isLoaded ? (
                <div className="rd-mapFallback">Đang tải bản đồ...</div>
              ) : (
                <GoogleMap
                  mapContainerClassName="rd-mapCanvas"
                  center={center}
                  zoom={13}
                  options={mapOptions}
                  onLoad={() => computeDirections()}
                >
                  <Marker position={data.location} />
                  <Marker position={destination} />
                  {directions && (
                    <DirectionsRenderer
                      directions={directions}
                      options={{ suppressMarkers: true }}
                    />
                  )}
                </GoogleMap>
              )}

              <div className="rd-mapInfo">
                <div className="rd-mapInfoTop">
                  <div className="rd-mapTitle">TỌA ĐỘ GPS</div>
                  <div className="rd-mapCoord">
                    {data.location.lat.toFixed(6)},{" "}
                    {data.location.lng.toFixed(6)}
                  </div>
                </div>

                <button
                  className="rd-mapBtn"
                  type="button"
                  onClick={computeDirections}
                  disabled={!apiKey || !isLoaded}
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
              value={data.reporter.name}
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
              <div className="rd-note">{data.note}</div>
            </div>

            <div className="rd-card rd-section">
              <div className="rd-secTitle">Địa chỉ chi tiết</div>
              <div className="rd-address">
                <FaMapMarkerAlt /> <span>{data.address}</span>
              </div>

              <div className="rd-contact">
                <div className="rd-contactItem">
                  <FaUserCircle />
                  <span>{data.reporter.name}</span>
                </div>
                <div className="rd-contactItem">
                  <FaPhoneAlt />
                  <span>{data.reporter.phone}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rd-card rd-timeline">
            <div className="rd-secTitle">Lịch sử hoạt động</div>
            <div className="rd-tlList">
              {data.timeline.map((t, idx) => (
                <TimelineItem key={idx} item={t} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </EnterpriseLayout>
  );
}
