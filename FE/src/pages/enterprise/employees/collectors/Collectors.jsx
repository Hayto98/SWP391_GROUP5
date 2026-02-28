import React from "react";
import "./collectors.css";
import EnterpriseLayout from "../../overview/EnterpriseLayout";
import { useCollectors } from "../../../../hooks/useCollectors";
import { FaPlus, FaSearch, FaFilter, FaPen, FaEye } from "react-icons/fa";

const StatCard = ({ title, value, sub, tone }) => (
  <div className={`ce-stat ce-stat-${tone}`}>
    <div className="ce-statTitle">{title}</div>
    <div className="ce-statValue">{value}</div>
    <div className="ce-statSub">{sub}</div>
  </div>
);

const Chip = ({ active, children, onClick }) => (
  <button type="button" className={`ce-chip ${active ? "is-active" : ""}`} onClick={onClick}>
    {children}
  </button>
);

const StatusPill = ({ status }) => {
  if (status === "ready") return <span className="ce-pill ce-pill-ready">● Sẵn sàng</span>;
  if (status === "busy") return <span className="ce-pill ce-pill-busy">● Đang bận</span>;
  return <span className="ce-pill ce-pill-leave">● Nghỉ phép</span>;
};

const Avatar = ({ seed }) => <div className="ce-avatar">{seed}</div>;

export default function Collectors() {
  const {
    data,
    loading,
    error,
    q,
    status,
    onlyReady,
    page,
    pageSize,
    setQ,
    setStatus,
    setOnlyReady,
    setPage,
  } = useCollectors();

  const total = data?.result?.total || 0;
  const rows = data?.result?.rows || [];
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const summary = data?.summary || { total: 0, ready: 0, busy: 0, leave: 0 };

  const statTotalSub = "+4.2%";
  const readySub = "⚡";
  const busySub = "22% công suất";
  const leaveSub = "📅";

  const chipItems = ["Tất cả", "Sẵn sàng", "Đang bận", "Nghỉ phép"];

  const taskPercent = (tasks) => Math.min(100, Math.max(0, (tasks / 6) * 100));

  return (
    <EnterpriseLayout>
      <div className="ce">
        <div className="ce-head">
          <div>
            <h1>Quản lý Nhân viên Thu gom</h1>
            <p>Theo dõi trạng thái và hiệu suất của đội ngũ thu gom rác thải.</p>
          </div>

          <button type="button" className="ce-btnPrimary">
            <FaPlus /> Thêm nhân viên mới
          </button>
        </div>

        <div className="ce-stats">
          <StatCard title="TỔNG NHÂN SỰ" value={summary.total} sub={statTotalSub} tone="default" />
          <StatCard title="SẴN SÀNG" value={summary.ready} sub={readySub} tone="green" />
          <StatCard title="ĐANG LÀM NHIỆM VỤ" value={summary.busy} sub={busySub} tone="orange" />
          <StatCard title="NGHỈ PHÉP" value={summary.leave} sub={leaveSub} tone="muted" />
        </div>

        <div className="ce-toolbar">
          <div className="ce-filterLeft">
            <div className="ce-filterLabel">Lọc theo:</div>
            <div className="ce-chips">
              {chipItems.map((c) => (
                <Chip key={c} active={status === c} onClick={() => setStatus(c)}>
                  {c}
                </Chip>
              ))}
            </div>
          </div>

          <div className="ce-filterRight">
            <label className="ce-toggle">
              <input type="checkbox" checked={onlyReady} onChange={(e) => setOnlyReady(e.target.checked)} />
              <span>Chỉ hiển thị sẵn sàng</span>
            </label>

            <button type="button" className="ce-ghostBtn">
              <FaFilter /> Bộ lọc nâng cao
            </button>

            <div className="ce-searchWrap">
              <FaSearch className="ce-searchIcon" />
              <input
                className="ce-search"
                placeholder="Tìm theo tên hoặc mã..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="ce-card">
          {loading && <div className="ce-state">Đang tải...</div>}
          {error && <div className="ce-state ce-error">Lỗi: {error}</div>}

          {!loading && !error && (
            <>
              <div className="ce-table">
                <div className="ce-tr ce-th">
                  <div>NHÂN VIÊN THU GOM</div>
                  <div>TRẠNG THÁI</div>
                  <div>NHIỆM VỤ ĐANG CHỜ</div>
                  <div>HOẠT ĐỘNG CUỐI</div>
                  <div>THAO TÁC</div>
                </div>

                {rows.map((r) => (
                  <div className="ce-tr" key={r.id}>
                    <div className="ce-userCell">
                      <Avatar seed={r.avatarSeed} />
                      <div>
                        <div className="ce-strong">{r.name}</div>
                        <div className="ce-sub">{r.code}</div>
                      </div>
                    </div>

                    <div>
                      <StatusPill status={r.status} />
                    </div>

                    <div className="ce-taskCell">
                      <div className="ce-taskNum">{r.tasks}</div>
                      <div className="ce-progress">
                        <div className="ce-progressFill" style={{ width: `${taskPercent(r.tasks)}%` }} />
                      </div>
                    </div>

                    <div className="ce-sub">{r.lastActive}</div>

                    <div className="ce-actions">
                      <button className="ce-iconBtn" type="button" title="Xem">
                        <FaEye />
                      </button>
                      <button className="ce-iconBtn" type="button" title="Sửa">
                        <FaPen />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="ce-footer">
                <div className="ce-footText">
                  Đang hiển thị {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} trên {total} nhân viên
                </div>

                <div className="ce-pagination">
                  <button className="ce-pageBtn" type="button" disabled={page === 1} onClick={() => setPage(page - 1)}>
                    Trước
                  </button>

                  <button className="ce-pageNum is-active" type="button">
                    {page}
                  </button>

                  {page + 1 <= totalPages && (
                    <button className="ce-pageNum" type="button" onClick={() => setPage(page + 1)}>
                      {page + 1}
                    </button>
                  )}

                  {page + 2 <= totalPages && (
                    <button className="ce-pageNum" type="button" onClick={() => setPage(page + 2)}>
                      {page + 2}
                    </button>
                  )}

                  {totalPages > page + 3 && <span className="ce-ellipsis">…</span>}

                  {totalPages > 1 && (
                    <button className="ce-pageNum" type="button" onClick={() => setPage(totalPages)}>
                      {totalPages}
                    </button>
                  )}

                  <button
                    className="ce-pageBtn"
                    type="button"
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Tiếp
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </EnterpriseLayout>
  );
}