import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./pendingReports.css";
import { useNavigate } from "react-router-dom";
import { usePendingReports } from "@/hooks/usePendingReports";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  assignTaskToCollector,
  getDispatchAssign,
} from "@/services/dispatchAssign.service";
import {
  recordReportAssignment,
  getAllReportAssignmentHistory,
} from "@/services/reportAssignmentHistory.service";
import { toast } from "sonner";
import {
  FaSearch,
  FaBell,
  FaUserCircle,
  FaDownload,
  FaHistory,
  FaChevronLeft,
  FaChevronRight,
  FaMapMarkerAlt,
  FaClock,
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

const CollectorAvatar = ({ name }) => {
  const parts = String(name || "").split(" ").filter(Boolean);
  const seed = (parts[0]?.[0] || "") + (parts[parts.length - 1]?.[0] || "");
  return <div className="pr-assignAvatar">{seed.toUpperCase()}</div>;
};

const ProgressBar = ({ percent }) => (
  <div className="pr-assignProgress">
    <div className="pr-assignProgressFill" style={{ width: `${percent}%` }} />
  </div>
);

export default function PendingReports() {
  const navigate = useNavigate();

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
  const toReportId = (code) => String(code || "").replace(/^#/, "");

  const [isAssignPopupOpen, setAssignPopupOpen] = useState(false);
  const [assigningReportCode, setAssigningReportCode] = useState("");
  const [assignData, setAssignData] = useState(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState("");
  const [assigningCollectorId, setAssigningCollectorId] = useState("");
  const [isHistoryPopupOpen, setHistoryPopupOpen] = useState(false);
  const [assignmentHistoryRows, setAssignmentHistoryRows] = useState([]);

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

  const assigningReportId = useMemo(
    () => toReportId(assigningReportCode),
    [assigningReportCode],
  );
  const selectedReport = assignData?.selectedReport;
  const collectors = assignData?.collectors || [];

  const refreshAssignmentHistory = useCallback(() => {
    setAssignmentHistoryRows(getAllReportAssignmentHistory());
  }, []);

  const resetAssignPopup = useCallback(() => {
    setAssignData(null);
    setAssignLoading(false);
    setAssignError("");
    setAssigningCollectorId("");
    setAssigningReportCode("");
  }, []);

  const handleAssignPopupOpen = useCallback((code) => {
    setAssigningReportCode(code);
    setAssignPopupOpen(true);
  }, []);

  const handleAssignPopupChange = useCallback(
    (open) => {
      setAssignPopupOpen(open);
      if (!open) {
        resetAssignPopup();
      }
    },
    [resetAssignPopup],
  );

  useEffect(() => {
    if (!isAssignPopupOpen || !assigningReportId) return;

    let cancelled = false;

    const loadAssignData = async () => {
      setAssignLoading(true);
      setAssignError("");
      try {
        const res = await getDispatchAssign(assigningReportId);
        if (cancelled) return;
        setAssignData(res);
      } catch (e) {
        if (cancelled) return;
        setAssignError(e?.message || "Không tải được danh sách collector");
      } finally {
        if (!cancelled) {
          setAssignLoading(false);
        }
      }
    };

    loadAssignData();

    return () => {
      cancelled = true;
    };
  }, [isAssignPopupOpen, assigningReportId]);

  useEffect(() => {
    if (!isHistoryPopupOpen) return;
    refreshAssignmentHistory();
  }, [isHistoryPopupOpen, refreshAssignmentHistory]);

  const handleAssignCollector = useCallback(
    async (collector) => {
      if (!assigningReportId || !collector?.id) return;

      setAssigningCollectorId(collector.id);
      setAssignError("");
      try {
        await assignTaskToCollector({
          reportId: assigningReportId,
          collectorId: collector.id,
        });

        recordReportAssignment({
          reportId: assigningReportId,
          collectorId: collector.id,
          collectorName: collector.name,
        });

        const actionResult = await doAction(assigningReportCode, "accept");
        if (!actionResult?.ok) {
          throw new Error(actionResult?.error || "Cập nhật trạng thái báo cáo thất bại");
        }

        const reportCodeText = assigningReportCode || `#${assigningReportId}`;
        toast.success(
          `Nhân viên ${collector.name} vừa được gán cho báo cáo ${reportCodeText}.`,
          {
            description: `Mã nhân viên: ${collector.id}`,
          },
        );
        refreshAssignmentHistory();
        handleAssignPopupChange(false);
      } catch (e) {
        setAssignError(e?.message || "Gán collector thất bại");
      } finally {
        setAssigningCollectorId("");
      }
    },
    [
      assigningReportCode,
      assigningReportId,
      doAction,
      handleAssignPopupChange,
      refreshAssignmentHistory,
    ],
  );

  return (
    <div className="pr">
        <div className="pr-topbar">
          <div className="pr-searchWrap">
            <FaSearch className="pr-searchIcon" />
            <input
              className="pr-search"
              placeholder="Tìm kiếm mã báo cáo, tên công dân..."
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

          <div className="pr-headActions">
            <button
              className="pr-historyBtn"
              type="button"
              onClick={() => {
                refreshAssignmentHistory();
                setHistoryPopupOpen(true);
              }}
            >
              <FaHistory /> Lịch sử
            </button>

            <button
              className="pr-export"
              type="button"
              onClick={exportExcel}
              disabled={exporting}
            >
              <FaDownload /> {exporting ? "Đang xuất..." : "Xuất báo cáo (Excel)"}
            </button>
          </div>
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
                  <div>CÔNG DÂN (TÊN/SĐT)</div>
                  <div>LOẠI RÁC</div>
                  <div>KHỐI LƯỢNG</div>
                  <div>SLA</div>
                  <div>HÀNH ĐỘNG</div>
                </div>

                {rows.map((r) => (
                  <div className="pr-tr" key={r.code}>
                    <div>
                      <button
                        type="button"
                        className="pr-codeBtn pr-mono pr-strong"
                        onClick={() =>
                          navigate(`/enterprise/reports/detail/${toReportId(r.code)}`, {
                            state: { selectedFrom: "pending-list" },
                          })
                        }
                      >
                        {r.code}
                      </button>
                    </div>
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
                      <ActionBtn
                        tone="ghost"
                        disabled={acting === r.code}
                        onClick={() =>
                          navigate(`/enterprise/reports/detail/${toReportId(r.code)}`, {
                            state: { selectedFrom: "pending-list" },
                          })
                        }
                      >
                        Chi tiết
                      </ActionBtn>
                      {r.actions.includes("contact") && (
                        <ActionBtn
                          tone="warn"
                          disabled={acting === r.code}
                          onClick={() => doAction(r.code, "contact")}
                        >
                          {acting === r.code ? "..." : "Cần liên hệ"}
                        </ActionBtn>
                      )}
                      <ActionBtn
                        tone="ok"
                        disabled={acting === r.code}
                        onClick={() => handleAssignPopupOpen(r.code)}
                      >
                        Gán
                      </ActionBtn>
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

        <Dialog open={isAssignPopupOpen} onOpenChange={handleAssignPopupChange}>
          <DialogContent
            className="max-w-none p-0"
            style={{ width: "94vw", maxWidth: 980, maxHeight: "86vh", overflow: "auto" }}
          >
            <div className="pr-assignDialog">
              <div className="pr-assignHead">
                <div>
                  <h2>Gán collector cho báo cáo #{assigningReportId || "-"}</h2>
                  <p>Chọn collector phù hợp dựa trên khoảng cách và tải công việc.</p>
                </div>
                <button
                  type="button"
                  className="pr-action pr-action-ghost"
                  onClick={() => navigate(`/enterprise/reports/detail/${assigningReportId}`)}
                  disabled={!assigningReportId}
                >
                  Xem chi tiết
                </button>
              </div>

              {assignLoading && <div className="pr-assignState">Đang tải danh sách collector...</div>}
              {!assignLoading && assignError && (
                <div className="pr-assignState pr-assignError">Lỗi: {assignError}</div>
              )}

              {!assignLoading && !assignError && selectedReport && (
                <>
                  <div className="pr-assignReport">
                    <div className="pr-assignReportTitle">
                      Báo cáo #{selectedReport.id} • {selectedReport.status}
                    </div>
                    <div className="pr-assignReportMeta">
                      <FaMapMarkerAlt />
                      <span>{selectedReport.address}</span>
                    </div>
                    <div className="pr-assignReportMeta">
                      <FaClock />
                      <span>{selectedReport.weightEstimate}</span>
                    </div>
                  </div>

                  {!collectors.length ? (
                    <div className="pr-assignState">Hiện chưa có collector khả dụng.</div>
                  ) : (
                    <div className="pr-assignList">
                      <div className="pr-assignRow pr-assignRowHead">
                        <div>COLLECTOR</div>
                        <div>KHOẢNG CÁCH</div>
                        <div>TẢI CÔNG VIỆC</div>
                        <div>THAO TÁC</div>
                      </div>

                      {collectors.map((collector) => (
                        <div className="pr-assignRow" key={collector.id}>
                          <div className="pr-assignCollector">
                            <CollectorAvatar name={collector.name} />
                            <div>
                              <div className="pr-strong">{collector.name}</div>
                              <div className="pr-sub">{collector.id} • {collector.status}</div>
                            </div>
                          </div>

                          <div>
                            <div className="pr-strong">{collector.distanceKm.toFixed(1)} km</div>
                            <div className="pr-sub">{collector.etaText}</div>
                          </div>

                          <div>
                            <div className="pr-sub">
                              {collector.tasks}/{collector.maxTasks} tasks • {collector.loadPercent}%
                            </div>
                            <ProgressBar percent={collector.loadPercent} />
                          </div>

                          <div>
                            <button
                              type="button"
                              className="pr-action pr-action-ok"
                              disabled={!collector.canAssign || assigningCollectorId === collector.id}
                              onClick={() => handleAssignCollector(collector)}
                            >
                              {assigningCollectorId === collector.id ? "..." : "Gán"}
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

        <Dialog open={isHistoryPopupOpen} onOpenChange={setHistoryPopupOpen}>
          <DialogContent
            className="max-w-none p-0"
            style={{ width: "92vw", maxWidth: 960, maxHeight: "86vh", overflow: "auto" }}
          >
            <div className="pr-historyDialog">
              <div className="pr-historyHead">
                <h2>Toàn bộ lịch sử đã gán report</h2>
                <p>Tổng số lần gán: {assignmentHistoryRows.length}</p>
              </div>

              {!assignmentHistoryRows.length ? (
                <div className="pr-historyEmpty">Chưa có lịch sử gán report nào.</div>
              ) : (
                <div className="pr-historyTable">
                  <div className="pr-historyTr pr-historyTh">
                    <div>THỜI ĐIỂM</div>
                    <div>BÁO CÁO</div>
                    <div>NHÂN VIÊN COLLECTOR</div>
                    <div>MÃ NHÂN VIÊN</div>
                  </div>

                  {assignmentHistoryRows.map((item) => (
                    <div className="pr-historyTr" key={item.id}>
                      <div>{item.assignedAtText || item.assignedAt || "-"}</div>
                      <div className="pr-strong">#{item.reportId}</div>
                      <div>{item.collectorName || "-"}</div>
                      <div>{item.collectorId || "-"}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
  );
}
