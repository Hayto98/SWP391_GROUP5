import React from "react";
import "./progressTracking.css";
import EnterpriseLayout from "../../overview/EnterpriseLayout";
import { useProgressTracking } from "@/hooks/useProgressTracking";
import { FaHistory, FaSyncAlt, FaChevronDown, FaExclamationTriangle } from "react-icons/fa";

const Stat = ({ title, value, sub, tone }) => (
  <div className={`pt-stat pt-stat-${tone}`}>
    <div className="pt-statTitle">{title}</div>
    <div className="pt-statValue">{value}</div>
    <div className="pt-statSub">{sub}</div>
  </div>
);

const TabBtn = ({ active, children, onClick }) => (
  <button className={`pt-tab ${active ? "is-active" : ""}`} type="button" onClick={onClick}>
    {children}
  </button>
);

const StatusPill = ({ status }) => {
  if (status === "assigned") return <span className="pt-pill pt-pill-assigned">Đã phân công</span>;
  if (status === "moving") return <span className="pt-pill pt-pill-moving">Đang di chuyển</span>;
  if (status === "collecting") return <span className="pt-pill pt-pill-collecting">Đã thu gom</span>;
  return <span className="pt-pill pt-pill-done">Đã hoàn tất</span>;
};

const SlaPill = ({ sla }) => {
  if (sla.type === "expired") return <span className="pt-sla pt-sla-expired">● {sla.text}</span>;
  if (sla.type === "risk") return <span className="pt-sla pt-sla-risk">● {sla.text}</span>;
  if (sla.type === "ok") return <span className="pt-sla pt-sla-ok">● {sla.text}</span>;
  return <span className="pt-sla pt-sla-done">● {sla.text}</span>;
};

const Progress = ({ percent, text }) => (
  <div className="pt-progressWrap">
    <div className="pt-progressTop">
      <div className="pt-progressPct">{percent}%</div>
      <div className="pt-progressText">{text}</div>
    </div>
    <div className="pt-progress">
      <div className="pt-progressFill" style={{ width: `${percent}%` }} />
    </div>
  </div>
);

export default function ProgressTracking() {
  const { data, loading, error, tab, sort, setTab, setSort } = useProgressTracking();

  if (loading) return <div style={{ padding: 16 }}>Đang tải...</div>;
  if (error) return <div style={{ padding: 16, color: "#991b1b" }}>Lỗi: {error}</div>;
  if (!data) return null;

  return (
    <EnterpriseLayout>
      <div className="pt">
        <div className="pt-headRow">
          <div>
            <div className="pt-live">● TRỰC TIẾP</div>
            <h1>Theo dõi Tiến độ Thu gom</h1>
            <p>Giám sát thời gian thực các lộ trình thu gom rác đang hoạt động.</p>
          </div>

          <div className="pt-headActions">
            <button className="pt-btnGhost" type="button">
              <FaHistory /> Lịch sử
            </button>
            <button className="pt-btnPrimary" type="button">
              <FaSyncAlt /> Làm mới dữ liệu
            </button>
          </div>
        </div>

        <div className="pt-stats">
          <Stat title="TỔNG NHIỆM VỤ" value={data.summary.totalTasks.value} sub={data.summary.totalTasks.deltaText} tone="default" />
          <Stat title="ĐÚNG TIẾN ĐỘ" value={data.summary.onTime.value} sub={data.summary.onTime.rateText} tone="green" />
          <Stat title="RỦI RO SLA" value={data.summary.slaRisk.value} sub={data.summary.slaRisk.noteText} tone="red" />
        </div>

        <div className="pt-controls">
          <div className="pt-tabs">
            {data.tabs.map((t) => (
              <TabBtn key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>
                {t.label}
              </TabBtn>
            ))}
          </div>

          <div className="pt-sort">
            <span>Sắp xếp:</span>
            <div className="pt-sortSelect">
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                {data.sorts.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <FaChevronDown />
            </div>
          </div>
        </div>

        <div className="pt-card">
          <div className="pt-table">
            <div className="pt-tr pt-th">
              <div>MÃ LỘ TRÌNH</div>
              <div>NHÂN VIÊN THU GOM</div>
              <div>TRẠNG THÁI</div>
              <div>TIẾN ĐỘ (%)</div>
              <div>ĐẾM NGƯỢC SLA</div>
              <div>HÀNH ĐỘNG</div>
            </div>

            {data.routes.map((r) => (
              <div className={`pt-tr ${r.sla.type === "expired" ? "is-danger" : ""}`} key={r.id}>
                <div>
                  <div className="pt-strong">{r.id}</div>
                  <div className="pt-sub">{r.location}</div>
                </div>

                <div className="pt-collector">
                  <div className="pt-ava">{r.collector.split(" ").map((x) => x[0]).slice(0, 2).join("")}</div>
                  <div className="pt-strong">{r.collector}</div>
                </div>

                <div>
                  <StatusPill status={r.status} />
                </div>

                <div>
                  <Progress percent={r.progress} text={r.progressText} />
                </div>

                <div>
                  <SlaPill sla={r.sla} />
                </div>

                <div>
                  {r.action === "Liên hệ ngay" ? (
                    <button className="pt-action pt-action-warn" type="button">
                      <FaExclamationTriangle /> Liên hệ ngay
                    </button>
                  ) : (
                    <button className="pt-action pt-action-link" type="button">
                      Chi tiết
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-bottom">
          <div className="pt-mapCard">
            <div className="pt-mapTitle">BẢN ĐỒ LỘ TRÌNH THU GOM</div>
            <div className="pt-mapSub">12 nhân viên đang hoạt động</div>
            <div className="pt-mapCanvas">
              <div className="pt-mapPin" />
              <div className="pt-mapPin2" />
              <div className="pt-mapBike" />
              <div className="pt-mapLine" />
            </div>
          </div>

          <div className="pt-anaCard">
            <div className="pt-anaTitle">Phân tích Hiệu suất Trực tiếp</div>

            <div className="pt-anaRow">
              <div className="pt-anaLabel">Tải trọng trung bình</div>
              <div className="pt-anaValue">{data.kpis.avgLoad}%</div>
            </div>
            <div className="pt-anaBar">
              <div className="pt-anaFill" style={{ width: `${data.kpis.avgLoad}%` }} />
            </div>

            <div className="pt-anaRow pt-anaRow2">
              <div className="pt-anaLabel">Thời gian xử lý</div>
              <div className="pt-anaDelta">+{data.kpis.avgTimeDelta}%</div>
            </div>

            <div className="pt-anaGrid">
              <div className="pt-anaBox">
                <div className="pt-anaBoxLabel">QUÃNG ĐƯỜNG</div>
                <div className="pt-anaBoxValue">{data.kpis.totalDistanceKm} km</div>
              </div>
              <div className="pt-anaBox">
                <div className="pt-anaBoxLabel">ĐIỂM THU GOM</div>
                <div className="pt-anaBoxValue">
                  {data.kpis.collected.done} / {data.kpis.collected.total}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-footerBar">
          <div>● HỆ THỐNG ỔN ĐỊNH</div>
          <div>● ĐANG KẾT NỐI 24 COLLECTORS</div>
          <div>LẦN CẬP NHẬT CUỐI: 14:22:10</div>
        </div>
      </div>
    </EnterpriseLayout>
  );
}