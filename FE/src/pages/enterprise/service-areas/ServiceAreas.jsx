import React, { useMemo } from "react";
import "./serviceAreas.css";
import EnterpriseLayout from "../overview/EnterpriseLayout";
import { useServiceAreas } from "@/hooks/useServiceAreas";
import { FaPlus, FaTimes, FaChevronLeft, FaChevronRight, FaMapMarkerAlt } from "react-icons/fa";

const Pill = ({ type, children }) => (
  <span className={`sa-pill sa-pill-${type}`}>{children}</span>
);

const Select = ({ value, onChange, options, prefix }) => (
  <div className="sa-select">
    <div className="sa-select__prefix">{prefix}</div>
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  </div>
);

const StatCard = ({ icon, title, value }) => (
  <div className="sa-stat">
    <div className="sa-stat__icon">{icon}</div>
    <div className="sa-stat__meta">
      <div className="sa-stat__title">{title}</div>
      <div className="sa-stat__value">{value}</div>
    </div>
  </div>
);

export default function ServiceAreas() {
  const {
    data,
    loading,
    error,
    province,
    district,
    status,
    page,
    pageSize,
    setProvince,
    setDistrict,
    setStatus,
    setPage,
    clearFilters,
    districts,
  } = useServiceAreas();

  const provinces = useMemo(() => ["Tất cả", ...(data?.filters?.provinces || [])], [data]);
  const statuses = useMemo(() => ["Tất cả", ...(data?.filters?.status || [])], [data]);

  const total = data?.result?.total || 0;
  const rows = data?.result?.rows || [];
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const pages = useMemo(() => {
    const arr = [];
    const max = totalPages;
    const cur = page;
    const push = (x) => arr.push(x);

    if (max <= 7) {
      for (let i = 1; i <= max; i++) push(i);
      return arr;
    }

    push(1);
    if (cur > 3) push("...");
    const start = Math.max(2, cur - 1);
    const end = Math.min(max - 1, cur + 1);
    for (let i = start; i <= end; i++) push(i);
    if (cur < max - 2) push("...");
    push(max);
    return arr;
  }, [page, totalPages]);

  return (
    <EnterpriseLayout>
      <div className="sa">
        <div className="sa-head">
          <div>
            <div className="sa-breadcrumb">Hệ thống / Quản lý Khu vực Phục vụ</div>
            <h1>Quản lý Khu vực Phục vụ</h1>
            <p>Cấu hình và theo dõi các địa bàn hoạt động thu gom của doanh nghiệp.</p>
          </div>

          <button className="sa-btnPrimary" type="button">
            <FaPlus /> Thêm khu vực
          </button>
        </div>

        <div className="sa-filters">
          <Select prefix="Tỉnh/Thành phố:" value={province} onChange={setProvince} options={provinces} />
          <Select prefix="Quận/Huyện:" value={district} onChange={setDistrict} options={districts} />
          <Select prefix="Trạng thái:" value={status} onChange={setStatus} options={statuses} />

          <button className="sa-clear" type="button" onClick={clearFilters}>
            <FaTimes /> Xóa bộ lọc
          </button>
        </div>

        <div className="sa-card">
          {loading && <div className="sa-state">Đang tải...</div>}
          {error && <div className="sa-state sa-error">Lỗi: {error}</div>}

          {!loading && !error && (
            <>
              <div className="sa-table">
                <div className="sa-tr sa-th">
                  <div>ID</div>
                  <div>TỈNH/THÀNH PHỐ</div>
                  <div>QUẬN/HUYỆN</div>
                  <div>PHƯỜNG/XÃ</div>
                  <div>TRẠNG THÁI</div>
                  <div>HÀNH ĐỘNG</div>
                </div>

                {rows.map((r) => (
                  <div className="sa-tr" key={r.id}>
                    <div className="sa-mono">{r.id}</div>
                    <div className="sa-strong">{r.province}</div>
                    <div>{r.district}</div>
                    <div>{r.ward}</div>
                    <div>
                      {r.status === "active" ? (
                        <Pill type="active">● Hoạt động</Pill>
                      ) : (
                        <Pill type="paused">● Tạm dừng</Pill>
                      )}
                    </div>
                    <div className="sa-actions">
                      <button className="sa-iconBtn" type="button" title="Xem">
                        <FaMapMarkerAlt />
                      </button>
                      <button className="sa-iconBtn" type="button" title="Khác">
                        …
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="sa-footer">
                <div className="sa-footText">
                  Hiển thị {rows.length} trên {total} kết quả
                </div>

                <div className="sa-pagination">
                  <button className="sa-pageBtn" disabled={page === 1} onClick={() => setPage(page - 1)} type="button">
                    <FaChevronLeft />
                  </button>

                  {pages.map((p, idx) =>
                    p === "..." ? (
                      <span className="sa-ellipsis" key={`e-${idx}`}>
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        className={`sa-pageNum ${p === page ? "is-active" : ""}`}
                        onClick={() => setPage(p)}
                        type="button"
                      >
                        {p}
                      </button>
                    )
                  )}

                  <button
                    className="sa-pageBtn"
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    type="button"
                  >
                    <FaChevronRight />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="sa-statsRow">
          <StatCard icon={<span className="sa-ico green" />} title="Tổng số Phường/Xã" value={data?.stats?.wards ?? 0} />
          <StatCard icon={<span className="sa-ico blue" />} title="Thành phố/Tỉnh" value={data?.stats?.provinces ?? 0} />
          <StatCard icon={<span className="sa-ico orange" />} title="Khu vực đang tạm dừng" value={data?.stats?.pausedAreas ?? 0} />
        </div>
      </div>
    </EnterpriseLayout>
  );
}