import React, { useMemo } from "react";
import "./pendingReports.css";
import EnterpriseLayout from "../../overview/EnterpriseLayout";
import { usePendingReports } from "@/hooks/usePendingReports";
import {
  FaSearch,
  FaBell,
  FaUserCircle,
  FaDownload,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

const Select = ({ value, onChange, options }) => (
  <select
    className="pr-select"
    value={value}
    onChange={(e) => onChange(e.target.value)}
  >
    {options.map((o) => (
      <option key={o} value={o}>
        {o}
      </option>
    ))}
  </select>
);

const Tag = ({ tone, children }) => (
  <span className={`pr-tag pr-tag-${tone}`}>{children}</span>
);

const Sla = ({ tone, text }) => (
  <span className={`pr-sla pr-sla-${tone}`}>
    <span className="pr-slaDot" />
    {text}
  </span>
);

const ActionBtn = ({ tone, children, onClick, disabled }) => (
  <button
    className={`pr-action pr-action-${tone}`}
    onClick={onClick}
    disabled={disabled}
    type="button"
  >
    {children}
  </button>
);

export default function PendingReports() {
  const {
    data,
    loading,
    error,
    acting,
    exporting,
    q,
    ward,
    wasteType,
    wasteSubType,
    weight,
    sort,
    page,
    pageSize,
    setQ,
    setWard,
    setWasteType,
    setWasteSubType,
    setWeight,
    setSort,
    setPage,
    doAction,
    exportExcel,
  } = usePendingReports();

  const total = data?.result?.total || 0;
  const rows = data?.result?.rows || [];
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const pages = useMemo(() => {
    const arr = [];
    const max = totalPages;
    const cur = page;

    if (max <= 7) {
      for (let i = 1; i <= max; i++) arr.push(i);
      return arr;
    }

    arr.push(1);
    if (cur > 3) arr.push("...");
    const start = Math.max(2, cur - 1);
    const end = Math.min(max - 1, cur + 1);
    for (let i = start; i <= end; i++) arr.push(i);
    if (cur < max - 2) arr.push("...");
    arr.push(max);
    return arr;
  }, [page, totalPages]);

  const wards = useMemo(() => data?.filters?.wards || ["Tất cả Quận"], [data]);
  const wasteTypes = useMemo(
    () => data?.filters?.wasteTypes || ["Tất cả"],
    [data],
  );
  const wasteSubTypes = useMemo(
    () => data?.filters?.wasteSubTypes || ["Tất cả"],
    [data],
  );
  const weights = useMemo(() => data?.filters?.weights || ["Tất cả"], [data]);
  const sorts = useMemo(() => data?.filters?.sorts || ["Hết hạn SLA"], [data]);

  return (
    <EnterpriseLayout>
      <div className="pr">
        <div className="pr-topbar">
          <div className="pr-searchWrap">
            <FaSearch className="pr-searchIcon" />
            <input
              className="pr-search"
              placeholder="Tìm kiếm mã báo cáo, địa điểm..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="pr-topRight">
            <button className="pr-iconBtn" type="button" title="Thông báo">
              <FaBell />
            </button>
            <button className="pr-iconBtn" type="button" title="Tài khoản">
              <FaUserCircle />
            </button>
          </div>
        </div>

        <div className="pr-head">
          <div>
            <h1>Danh sách Báo cáo Chờ xử lý</h1>
            <p>
              Hiện có {data?.summary?.pending ?? 0} báo cáo mới chưa được gắn
              cho đơn vị vận chuyển
            </p>
          </div>

          <button
            className="pr-export"
            type="button"
            onClick={exportExcel}
            disabled={exporting}
          >
            <FaDownload /> {exporting ? "Đang xuất..." : "Xuất báo cáo (Excel)"}
          </button>
        </div>

        <div className="pr-filtersRow">
          <Select value={ward} onChange={setWard} options={wards} />
          <Select
            value={wasteType}
            onChange={setWasteType}
            options={wasteTypes}
          />
          <Select
            value={wasteSubType}
            onChange={setWasteSubType}
            options={wasteSubTypes}
          />
          <Select value={weight} onChange={setWeight} options={weights} />

          <div className="pr-sort">
            <span>Sắp xếp theo:</span>
            <Select value={sort} onChange={setSort} options={sorts} />
          </div>
        </div>

        <div className="pr-card">
          {loading && <div className="pr-state">Đang tải...</div>}
          {error && <div className="pr-state pr-error">Lỗi: {error}</div>}

          {!loading && !error && (
            <>
              <div className="pr-table">
                <div className="pr-tr pr-th">
                  <div>MÃ BÁO CÁO</div>
                  <div>ĐỊA ĐIỂM (PHƯỜNG/QUẬN)</div>
                  <div>LOẠI RÁC</div>
                  <div>KHỐI LƯỢNG</div>
                  <div>SLA</div>
                  <div>HÀNH ĐỘNG</div>
                </div>

                {rows.map((r) => (
                  <div className="pr-tr" key={r.code}>
                    <div className="pr-mono pr-strong">{r.code}</div>
                    <div>
                      <div className="pr-strong">{r.ward}</div>
                      <div className="pr-sub">{r.district}</div>
                    </div>
                    <div>
                      <Tag tone={r.wasteTone}>{r.waste}</Tag>
                    </div>
                    <div>{r.weightKg.toFixed(1)} kg</div>
                    <div>
                      <Sla tone={r.sla.tone} text={r.sla.text} />
                    </div>
                    <div className="pr-actions">
                      {r.actions.includes("contact") && (
                        <ActionBtn
                          tone="warn"
                          disabled={acting === r.code}
                          onClick={() => doAction(r.code, "contact")}
                        >
                          {acting === r.code ? "..." : "Cần liên hệ"}
                        </ActionBtn>
                      )}
                      {r.actions.includes("accept") && (
                        <ActionBtn
                          tone="ok"
                          disabled={acting === r.code}
                          onClick={() => doAction(r.code, "accept")}
                        >
                          {acting === r.code ? "..." : "Chấp nhận"}
                        </ActionBtn>
                      )}
                      <ActionBtn
                        tone="ghost"
                        disabled={acting === r.code}
                        onClick={() => doAction(r.code, "reject")}
                      >
                        {acting === r.code ? "..." : "Từ chối"}
                      </ActionBtn>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pr-footer">
                <div className="pr-footText">
                  Hiển thị {rows.length} trên {total} báo cáo
                </div>

                <div className="pr-pagination">
                  <button
                    className="pr-pageBtn"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    type="button"
                  >
                    <FaChevronLeft />
                  </button>

                  {pages.map((p, idx) =>
                    p === "..." ? (
                      <span className="pr-ellipsis" key={`e-${idx}`}>
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        className={`pr-pageNum ${p === page ? "is-active" : ""}`}
                        onClick={() => setPage(p)}
                        type="button"
                      >
                        {p}
                      </button>
                    ),
                  )}

                  <button
                    className="pr-pageBtn"
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
        <div className="pr-bulk">
          <div className="pr-bulkIcon">✓</div>

          <div className="pr-bulkBody">
            <div className="pr-bulkTitle">Xác nhận xử lý hàng loạt?</div>
            <div className="pr-bulkDesc">
              Chức năng này cho phép bạn cập nhật nhiều báo cáo cùng sau khi
              kiểm tra tất cả.
            </div>
          </div>

          <div className="pr-bulkActions">
            <button className="pr-bulkBtn pr-bulkBtnGhost" type="button">
              Chọn tất cả
            </button>
            <button className="pr-bulkBtn pr-bulkBtnOk" type="button">
              Chấp nhận hàng loạt
            </button>
            <button className="pr-bulkBtn pr-bulkBtnReject" type="button">
              Từ chối hàng loạt
            </button>
          </div>
        </div>
      </div>
    </EnterpriseLayout>
  );
}
