import React, { useMemo, useState } from "react";
import "./enterpriseOverview.css";
import { useEnterpriseOverview } from "../../../hooks/useEnterpriseOverview";
import {
  FaBell,
  FaSearch,
  FaCheckCircle,
  FaClock,
  FaTruck,
  FaExclamationTriangle,
  FaChevronDown,
} from "react-icons/fa";

// ... (StatCard, ProgressRing, BarChart giữ nguyên như mình gửi trước)

export default function EnterpriseOverview() {
  const [range, setRange] = useState("month"); // "week" | "month"
  const { data, loading, error, refetch } = useEnterpriseOverview(range);

  const stats = useMemo(() => {
    if (!data?.summary) return [];
    const s = data.summary;
    return [
      {
        title: "Chờ xử lý",
        value: String(s.pending),
        sub: `${s.pendingDelta >= 0 ? "+" : ""}${s.pendingDelta}% so với hôm qua`,
        tone: "default",
        icon: <FaClock />,
      },
      {
        title: "Đang thực hiện",
        value: String(s.inProgress),
        sub: `${s.inProgressDelta >= 0 ? "+" : ""}${s.inProgressDelta}% đang di chuyển`,
        tone: "info",
        icon: <FaTruck />,
      },
      {
        title: "Đã hoàn tất",
        value: String(s.done),
        sub: `${s.doneDelta >= 0 ? "+" : ""}${s.doneDelta}% hiệu suất cao`,
        tone: "success",
        icon: <FaCheckCircle />,
      },
      {
        title: "SLA Cảnh báo",
        value: String(s.slaWarning),
        sub: `${s.slaDelta >= 0 ? "+" : ""}${s.slaDelta}% với tuần này`,
        tone: "danger",
        icon: <FaExclamationTriangle />,
      },
    ];
  }, [data]);

  const activeChart = data?.chart?.active;
  const activities = data?.activities || [];

  return (
    <div className="eo">
      {/* Topbar (giữ nguyên UI bạn đang có) */}
      <div className="eo-topbar">
        <div className="eo-brand">
          <div>
            <div className="eo-brand__name">RecycleCorp</div>
            <div className="eo-brand__sub">Quản trị Doanh nghiệp</div>
          </div>
        </div>

        <div className="eo-topbar__right">
          <div className="eo-chip">
            <span>Tháng 10, 2023</span>
            <FaChevronDown className="eo-chip__icon" />
          </div>

          <div className="eo-search">
            <FaSearch className="eo-search__icon" />
            <input placeholder="Tìm kiếm đơn hàng..." />
          </div>

          <button className="eo-iconBtn" title="Thông báo">
            <FaBell />
          </button>
        </div>
      </div>

      <div className="eo-titleRow">
        <h1>Dashboard Tổng quan Doanh nghiệp</h1>
      </div>

      {/* Trạng thái loading/error */}
      {loading && (
        <div style={{ padding: 12, color: "#6b7280" }}>
          Đang tải dữ liệu...
        </div>
      )}

      {error && (
        <div style={{ padding: 12, color: "#991b1b" }}>
          Lỗi: {error}{" "}
          <button onClick={refetch} style={{ marginLeft: 8 }}>
            Thử lại
          </button>
        </div>
      )}

      {/* Render khi có data */}
      {!loading && !error && data && (
        <>
          {/* Alert */}
          <div className="eo-alert">
            <div className="eo-alert__left">
              <div className="eo-alert__icon">
                <FaExclamationTriangle />
              </div>
              <div>
                <div className="eo-alert__title">Cảnh báo SLA sắp vi phạm</div>
                <div className="eo-alert__desc">
                  Có <b>{data.summary?.slaWarning ?? 0}</b> đơn hàng sắp vượt quá thời gian cam kết xử lý (dưới 1 giờ).
                </div>
              </div>
            </div>
            <button className="eo-btnDanger">Kiểm tra ngay</button>
          </div>

          {/* Stats */}
          <div className="eo-statsGrid">
            {stats.map((s) => (
              <div className={`eo-stat eo-tone-${s.tone}`} key={s.title}>
                <div className="eo-stat__top">
                  <div className="eo-stat__title">{s.title}</div>
                  <div className="eo-stat__icon">{s.icon}</div>
                </div>
                <div className="eo-stat__value">{s.value}</div>
                <div className="eo-stat__sub">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="eo-midGrid">
            <div className="eo-card">
              <div className="eo-card__head">
                <div className="eo-card__title">Sản lượng thu gom</div>
                <div className="eo-toggle">
                  <button className={range === "week" ? "is-active" : ""} onClick={() => setRange("week")}>
                    Tuần
                  </button>
                  <button className={range === "month" ? "is-active" : ""} onClick={() => setRange("month")}>
                    Tháng
                  </button>
                </div>
              </div>

              <div className="eo-card__body eo-card__bodyTall">
                {/* dùng activeChart */}
                {activeChart ? (
                  <div className="eo-bars">
                    {activeChart.values.map((v, i) => {
                      const max = Math.max(...activeChart.values, 1);
                      const h = Math.round((v / max) * 100);
                      const isHighlight = i === 2;
                      return (
                        <div className="eo-bars__item" key={activeChart.labels[i]}>
                          <div
                            className={`eo-bars__bar ${isHighlight ? "is-highlight" : ""}`}
                            style={{ height: `${h}%` }}
                          />
                          <div className="eo-bars__label">{activeChart.labels[i]}</div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ color: "#6b7280" }}>Không có dữ liệu chart</div>
                )}
              </div>
            </div>

            <div className="eo-card">
              <div className="eo-card__head">
                <div className="eo-card__title">Phân loại rác thải</div>
              </div>
              <div className="eo-card__body eo-card__bodyTall eo-center">
                {/* ring lấy từ data.waste */}
                <div style={{ color: "#6b7280" }}>
                  (Ring component của bạn giữ nguyên, chỉ map từ data.waste)
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="eo-card">
            <div className="eo-card__head">
              <div className="eo-card__title">Hoạt động gần đây</div>
              <button className="eo-link">Xem tất cả</button>
            </div>

            <div className="eo-card__body">
              <div className="eo-table">
                <div className="eo-tr eo-th">
                  <div>Mã đơn</div>
                  <div>Địa điểm</div>
                  <div>Loại rác</div>
                  <div>Thời gian</div>
                  <div>Trạng thái</div>
                </div>

                {activities.map((a) => (
                  <div className="eo-tr" key={a.code}>
                    <div className="eo-mono">{a.code}</div>
                    <div>{a.district}</div>
                    <div>{a.type}</div>
                    <div>{a.time}</div>
                    <div>
                      <span className={`eo-badge eo-badge-${a.badge}`}>{a.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}