import React, { useMemo, useState } from "react";
import "./collectionReportDetail.css";
import { useNavigate, useParams } from "react-router-dom";
import { useCollectionReportDetail } from "../../../../hooks/useCollectionReportDetail";
import { FaSearch, FaMapMarkerAlt, FaStar } from "react-icons/fa";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

const StatBox = ({ label, value, tone }) => (
  <div className={`crd-box crd-box-${tone}`}>
    <div className="crd-boxLabel">{label}</div>
    <div className="crd-boxValue">{value}</div>
  </div>
);

const Badge = ({ children, tone }) => <span className={`crd-badge crd-badge-${tone}`}>{children}</span>;

const LoadedMapBlock = ({ apiKey, center }) => {
  const { isLoaded, loadError } = useJsApiLoader({ googleMapsApiKey: apiKey });

  if (loadError) return <div className="crd-mapFallback">Không thể tải bản đồ</div>;
  if (!isLoaded) return <div className="crd-mapFallback">Đang tải bản đồ...</div>;

  return (
    <GoogleMap mapContainerClassName="crd-mapCanvas" center={center} zoom={14} options={{ disableDefaultUI: true, zoomControl: true }}>
      <Marker position={center} />
    </GoogleMap>
  );
};

const MapBlock = ({ lat, lng }) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
  const center = useMemo(() => ({ lat, lng }), [lat, lng]);

  if (!apiKey) return <div className="crd-mapFallback">Thiếu VITE_GOOGLE_MAPS_API_KEY</div>;
  return <LoadedMapBlock apiKey={apiKey} center={center} />;
};

export default function CollectionReportDetail({ reportId: reportIdProp, isPopup = false }) {
  const navigate = useNavigate();
  const params = useParams();
  const reportId = reportIdProp || params?.id || "RP-8829";
  const { data, loading, error } = useCollectionReportDetail(reportId);

  const [citizenImg, setCitizenImg] = useState("");
  const [collectorImg, setCollectorImg] = useState("");

  if (loading) return <div style={{ padding: 16 }}>Đang tải...</div>;
  if (error) return <div style={{ padding: 16, color: "#991b1b" }}>Lỗi: {error}</div>;
  if (!data) return null;

  const citizenUrl = citizenImg || data.images.citizen;
  const collectorUrl = collectorImg || data.images.collector;
  const routeReportId = String(data.id || reportId).replace(/^#/, "");

  return (
    <div className={`crd ${isPopup ? "crd-popup" : ""}`}>
        {!isPopup && (
          <div className="crd-topbar">
            <div className="crd-searchWrap">
              <FaSearch className="crd-searchIcon" />
              <input className="crd-search" placeholder={data.searchHint} />
            </div>

            <div className="crd-topActions">
              <button
                className="crd-btnGhost"
                type="button"
                onClick={() => navigate("/enterprise/reports")}
              >
                Danh sách chờ xử lý
              </button>
            </div>
          </div>
        )}

        <div className="crd-head">
          {!isPopup && (
            <div className="crd-breadcrumb">
              <button
                type="button"
                className="crd-breadcrumbLink"
                onClick={() => navigate("/enterprise/reports")}
              >
                Báo cáo
              </button>
              <span> / </span>
              <button
                type="button"
                className="crd-breadcrumbLink"
                onClick={() => navigate(`/enterprise/reports/detail/${routeReportId}`)}
              >
                Chi tiết báo cáo
              </button>
              <span> / </span>
              <span>Chi tiết thu gom</span>
            </div>
          )}
          <h1>Chi tiết báo cáo thu gom</h1>
          <p>Quản lý và đối soát dữ liệu thu gom rác tái chế từ người dùng</p>
        </div>

        <div className="crd-infoRow">
          <StatBox label="Mã báo cáo" value={`#${data.id}`} tone="default" />
          <StatBox label="Trạng thái" value={data.status} tone="green" />
          <StatBox label="Ngày tạo" value={data.createdAt} tone="default" />
          <StatBox label="Ngày hoàn tất" value={data.completedAt} tone="default" />
        </div>

        <div className="crd-grid">
          <div className="crd-card">
            <div className="crd-cardTitle">
              <span className="crd-dot" /> Thông tin vị trí
            </div>

            <div className="crd-mapWrap">
              <MapBlock lat={data.location.lat} lng={data.location.lng} />
            </div>

            <div className="crd-gps">
              <div className="crd-gpsRow">
                <div className="crd-gpsLabel">Tọa độ GPS</div>
                <div className="crd-gpsValue">
                  {data.location.lat.toFixed(6)}, {data.location.lng.toFixed(6)}
                </div>
              </div>
              <div className="crd-addr">
                <FaMapMarkerAlt /> <span>{data.location.address}</span>
              </div>
            </div>
          </div>

          <div className="crd-card">
            <div className="crd-cardTitleRow">
              <div className="crd-cardTitle">
                <span className="crd-dot" /> Loại rác &amp; Khối lượng
              </div>
              <button className="crd-miniBtn" type="button">
                Đối soát ngay
              </button>
            </div>

            <div className="crd-compare">
              <div className="crd-cth">
                <div>THÔNG SỐ</div>
                <div>CITIZEN (DỰ KIẾN)</div>
                <div>COLLECTOR (THỰC TẾ)</div>
                <div>CHÊNH LỆCH</div>
              </div>

              {data.wasteCompare.rows.map((r) => (
                <div className="crd-ctr" key={r.label}>
                  <div className="crd-strong">{r.label}</div>
                  <div>{r.citizen}</div>
                  <div>{r.collector}</div>
                  <div>
                    <Badge tone={r.diffTone}>{r.diff}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="crd-card crd-images">
          <div className="crd-cardTitle">
            <span className="crd-dot" /> Hình ảnh đối chứng
          </div>

          <div className="crd-imgGrid">
            <div className="crd-imgBlock">
              <div className="crd-imgLabel">Ảnh Citizen gửi</div>
              <img
                src={citizenUrl}
                alt="citizen"
                onError={() => setCitizenImg("https://picsum.photos/1200/800?random=21")}
              />
            </div>

            <div className="crd-imgBlock">
              <div className="crd-imgLabel">Ảnh Collector chụp</div>
              <img
                src={collectorUrl}
                alt="collector"
                onError={() => setCollectorImg("https://picsum.photos/1200/800?random=22")}
              />
            </div>
          </div>
        </div>

        <div className="crd-bottom">
          <div className="crd-card crd-collectorCard">
            <div className="crd-avaBig">{data.collectorCard.name.split(" ").map((x) => x[0]).slice(0, 2).join("")}</div>
            <div className="crd-cName">{data.collectorCard.name}</div>
            <div className="crd-cCode">{data.collectorCard.code}</div>

            <div className="crd-cMeta">
              <div className="crd-cMetaItem">
                <FaStar /> <b>{data.collectorCard.rating}</b>
              </div>
              <div className="crd-cMetaItem">
                <b>{data.collectorCard.completed}</b> task
              </div>
            </div>
          </div>

          <div className="crd-card crd-progressCard">
            <div className="crd-cardTitle">
              <span className="crd-dot" /> Tiến độ &amp; SLA
            </div>

            <div className="crd-steps">
              {data.progress.steps.map((s, idx) => (
                <div className="crd-step" key={idx}>
                  <div className={`crd-stepDot ${s.state === "done" ? "is-done" : ""}`} />
                  <div className="crd-stepTitle">{s.title}</div>
                  <div className="crd-stepTime">{s.time}</div>
                </div>
              ))}
            </div>

            <div className="crd-slaRow">
              <div className="crd-slaText">{data.progress.slaText}</div>
              <span className="crd-slaOk">{data.progress.slaStatus}</span>
            </div>
          </div>

          <div className="crd-card crd-rewardCard">
            <div className="crd-cardTitle">
              <span className="crd-dot" /> {data.rewards.title}
            </div>

            <div className="crd-rewardTop">
              <div className="crd-rewardValue">{data.rewards.earned}</div>
              <div className="crd-rewardNote">{data.rewards.note}</div>
            </div>

            <div className="crd-rewardDetail">{data.rewards.detail}</div>
          </div>
        </div>

        <div className="crd-footer">© 2023 Recycle Enterprise System</div>
      </div>
  );
}