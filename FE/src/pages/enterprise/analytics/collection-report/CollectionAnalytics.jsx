import React, { useMemo } from "react";
import "./collectionAnalytics.css";
import EnterpriseLayout from "../../overview/EnterpriseLayout";
import { useCollectionAnalytics } from "../../../../hooks/useCollectionAnalytics";
import { FaDownload, FaChevronDown, FaSearch } from "react-icons/fa";

const Select = ({ value, onChange, options }) => (
  <div className="ca-select">
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
    <FaChevronDown />
  </div>
);

const Chip = ({ active, children, onClick }) => (
  <button type="button" className={`ca-chip ${active ? "is-active" : ""}`} onClick={onClick}>
    {children}
  </button>
);

const Kpi = ({ title, value, sub }) => (
  <div className="ca-kpi">
    <div className="ca-kpiTitle">{title}</div>
    <div className="ca-kpiValue">{value}</div>
    <div className="ca-kpiSub">{sub}</div>
  </div>
);

const Donut = ({ items, center }) => {
  const conic = useMemo(() => {
    const color = (tone) =>
      tone === "green" ? "#22c55e" : tone === "blue" ? "#3b82f6" : tone === "gray" ? "#94a3b8" : "#f59e0b";
    const parts = items.map((it, i) => {
      const start = items.slice(0, i).reduce((s, x) => s + x.value, 0);
      const end = start + it.value;
      return `${color(it.tone)} ${start}% ${end}%`;
    });
    return `conic-gradient(${parts.join(",")})`;
  }, [items]);

  return (
    <div className="ca-donutWrap">
      <div className="ca-donut" style={{ background: conic }}>
        <div className="ca-donutInner">
          <div className="ca-donutCenter">{center}</div>
          <div className="ca-donutSub">TỔNG</div>
        </div>
      </div>

      <div className="ca-legend">
        {items.map((it) => (
          <div className="ca-legendItem" key={it.label}>
            <span className={`ca-dot ca-dot-${it.tone}`} />
            <span>{it.label}</span>
            <b>{it.value}%</b>
          </div>
        ))}
      </div>
    </div>
  );
};

const Bars = ({ labels, values }) => {
  const max = Math.max(...values, 1);
  return (
    <div className="ca-bars">
      {values.map((v, i) => (
        <div className="ca-barItem" key={labels[i]}>
          <div className="ca-bar" style={{ height: `${Math.round((v / max) * 100)}%` }} />
          <div className="ca-barLabel">{labels[i]}</div>
        </div>
      ))}
    </div>
  );
};

const Line = ({ values }) => {
  const max = Math.max(...values, 1);
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = 100 - (v / max) * 100;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg className="ca-lineSvg" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
};

export default function CollectionAnalytics() {
  const {
    data,
    loading,
    error,
    from,
    to,
    province,
    district,
    ward,
    waste,
    status,
    page,
    pageSize,
    setFrom,
    setTo,
    setProvince,
    setDistrict,
    setWard,
    setWaste,
    setStatus,
    setPage,
  } = useCollectionAnalytics();

  const total = data?.table?.total || 0;
  const rows = data?.table?.rows || [];
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (loading) return <div style={{ padding: 16 }}>Đang tải...</div>;
  if (error) return <div style={{ padding: 16, color: "#991b1b" }}>Lỗi: {error}</div>;
  if (!data) return null;

  const exportCsv = () => {};
  const provinces = data.filters.provinces;
  const districts = data.filters.districts;
  const wards = data.filters.wards;
  const wastes = data.filters.wasteTypes;
  const statuses = data.filters.status;

  return (
    <EnterpriseLayout>
      <div className="ca">
        <div className="ca-head">
          <div>
            <h1>Báo cáo Khối lượng Thu gom &amp; Tái chế</h1>
            <p>Dữ liệu cập nhật: {data.filters.to}</p>
          </div>

          <button className="ca-export" type="button" onClick={exportCsv}>
            <FaDownload /> Xuất báo cáo (CSV/Excel)
          </button>
        </div>

        <div className="ca-filters">
          <div className="ca-filterRow">
            <div className="ca-field">
              <div className="ca-label">Từ ngày</div>
              <input className="ca-input" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="ca-field">
              <div className="ca-label">Đến ngày</div>
              <input className="ca-input" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>

            <div className="ca-field">
              <div className="ca-label">Tỉnh / Thành</div>
              <Select value={province} onChange={setProvince} options={provinces} />
            </div>

            <div className="ca-field">
              <div className="ca-label">Quận / Huyện</div>
              <Select value={district} onChange={setDistrict} options={districts} />
            </div>

            <div className="ca-field">
              <div className="ca-label">Phường / Xã</div>
              <Select value={ward} onChange={setWard} options={wards} />
            </div>

            <div className="ca-field ca-status">
              <button className="ca-statusBtn" type="button">
                {status}
              </button>
              <div className="ca-statusList">
                {statuses.map((s) => (
                  <button key={s} type="button" className="ca-statusItem" onClick={() => setStatus(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="ca-chipRow">
            <div className="ca-chipLabel">LOẠI RÁC THẢI:</div>
            {wastes.map((w) => (
              <Chip key={w} active={waste === w} onClick={() => setWaste(w)}>
                {w}
              </Chip>
            ))}
          </div>
        </div>

        <div className="ca-kpis">
          <Kpi title="Tổng khối lượng (kg)" value={data.kpis.totalKg.toLocaleString()} sub="+5%" />
          <Kpi title="Số báo cáo hoàn tất" value={data.kpis.reports.toLocaleString()} sub="+4.2%" />
          <Kpi title="Collector tham gia" value={data.kpis.collectors} sub="+2" />
          <Kpi title="Tỷ lệ đúng SLA" value={`${data.kpis.onTimeRate}%`} sub="+0.4%" />
        </div>

        <div className="ca-charts">
          <div className="ca-card">
            <div className="ca-cardTitle">Khối lượng theo loại</div>
            <Donut items={data.donut.items} center={data.donut.center} />
          </div>

          <div className="ca-card">
            <div className="ca-cardTitle">Khối lượng theo khu vực</div>
            <div className="ca-barsWrap">
              <Bars labels={data.bars.labels} values={data.bars.values} />
            </div>
          </div>
        </div>

        <div className="ca-card ca-trend">
          <div className="ca-trendHead">
            <div>
              <div className="ca-cardTitle">Xu hướng thu gom</div>
              <div className="ca-sub">Khối lượng (kg) theo ngày trong tháng</div>
            </div>

            <div className="ca-trendTabs">
              <button className="ca-miniBtn is-active" type="button">
                Tháng
              </button>
              <button className="ca-miniBtn" type="button">
                Tuần
              </button>
            </div>
          </div>

          <div className="ca-trendChart">
            <Line values={data.trend.values} />
          </div>
        </div>

        <div className="ca-card ca-tableCard">
          <div className="ca-tableHead">
            <div className="ca-cardTitle">Chi tiết báo cáo thu gom</div>
            <div className="ca-searchWrap">
              <FaSearch className="ca-searchIcon" />
              <input className="ca-search" placeholder="Tìm kiếm báo cáo..." />
            </div>
          </div>

          <div className="ca-table">
            <div className="ca-tr ca-th">
              <div>MÃ BÁO CÁO</div>
              <div>NGÀY THU GOM</div>
              <div>KHU VỰC</div>
              <div>LOẠI RÁC</div>
              <div>KHỐI LƯỢNG (KG)</div>
              <div>COLLECTOR</div>
              <div>TRẠNG THÁI</div>
            </div>

            {rows.map((r) => (
              <div className="ca-tr" key={r.id}>
                <div className="ca-mono ca-strong">{r.id}</div>
                <div>{r.date}</div>
                <div>{r.location}</div>
                <div>
                  <span className={`ca-pill ca-pill-${r.waste === "Nhựa" ? "blue" : r.waste === "Giấy" ? "green" : r.waste === "Kim loại" ? "gray" : "orange"}`}>
                    {r.waste}
                  </span>
                </div>
                <div>{r.kg.toFixed(1)}</div>
                <div>{r.collector}</div>
                <div>
                  <span className="ca-on">ON</span>
                </div>
              </div>
            ))}
          </div>

          <div className="ca-footer">
            <div className="ca-footText">
              Hiển thị {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} trên {total} báo cáo
            </div>

            <div className="ca-pagination">
              <button className="ca-pageBtn" type="button" disabled={page === 1} onClick={() => setPage(page - 1)}>
                ‹
              </button>
              {[1, 2, 3].map((p) => (
                <button
                  key={p}
                  className={`ca-pageNum ${p === page ? "is-active" : ""}`}
                  type="button"
                  onClick={() => setPage(p)}
                  disabled={p > totalPages}
                >
                  {p}
                </button>
              ))}
              <button className="ca-pageBtn" type="button" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                ›
              </button>
            </div>
          </div>
        </div>

        <div className="ca-bottomNote">RECYCLEANALYTICS v2.4.1 © 2024</div>
      </div>
    </EnterpriseLayout>
  );
}