import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./assignCollectorTask.css";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useDispatchAssign } from "../../../../hooks/useDispatchAssign";
import { getReportAssignmentHistory } from "../../../../services/reportAssignmentHistory.service";
import { toast } from "sonner";
import { FaFilter, FaMapMarkerAlt, FaClock, FaExclamationTriangle } from "react-icons/fa";

const Pill = ({ tone, children }) => <span className={`da-pill da-pill-${tone}`}>{children}</span>;

const Progress = ({ percent }) => (
  <div className="da-progress">
    <div className="da-progressFill" style={{ width: `${percent}%` }} />
  </div>
);

const Avatar = ({ name }) => {
  const parts = name.split(" ").filter(Boolean);
  const seed = (parts[0]?.[0] || "") + (parts[parts.length - 1]?.[0] || "");
  return <div className="da-avatar">{seed.toUpperCase()}</div>;
};

export default function AssignCollectorTask() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const reportId = params?.id || "";
  const hasSelectedReport = Boolean(reportId);
  const { data, loading, error, assigningId, assign } = useDispatchAssign(reportId);

  const collectors = data?.collectors || [];
  const report = data?.selectedReport;
  const selectedReportId = report?.id || reportId;
  const [assignmentHistory, setAssignmentHistory] = useState([]);

  const selectionSourceText = useMemo(() => {
    const selectedFrom = location.state?.selectedFrom;
    if (selectedFrom === "report-detail") return "Chi tiết báo cáo";
    if (selectedFrom === "pending-list") return "Danh sách chờ xử lý";
    return "Điều phối thủ công";
  }, [location.state]);

  const openBigMap = () => {
    if (!report?.location) return;
    const { lat, lng } = report.location;
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank", "noopener,noreferrer");
  };

  const refreshHistory = useCallback(() => {
    if (!selectedReportId) {
      setAssignmentHistory([]);
      return;
    }

    setAssignmentHistory(getReportAssignmentHistory(selectedReportId));
  }, [selectedReportId]);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  const handleAssign = useCallback(async (collector) => {
    if (!selectedReportId) return;
    const result = await assign(collector.id);
    if (!result?.ok) return;

    toast.success(`Đã gán #${selectedReportId} cho ${collector.name}`);
    refreshHistory();
  }, [assign, refreshHistory, selectedReportId]);

  const countText = useMemo(() => `Hiển thị ${collectors.length} kết quả gần nhất`, [collectors.length]);

  if (!hasSelectedReport) {
    return (
      <div className="da">
        <div className="da-empty">
          <h2>Chưa chọn báo cáo để gán Task</h2>
          <p>
            Bạn đang vào màn hình điều phối từ menu. Hãy chọn một báo cáo trong
            danh sách chờ xử lý trước, sau đó dùng nút "Gán".
          </p>
          <div className="da-emptyActions">
            <button
              className="da-assign"
              type="button"
              onClick={() => navigate("/enterprise/reports")}
            >
              Đi đến danh sách báo cáo
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <div style={{ padding: 16 }}>Đang tải...</div>;
  if (error) return <div style={{ padding: 16, color: "#991b1b" }}>Lỗi: {error}</div>;
  if (!data || !report) return null;

  return (
    <div className="da">
        <div className="da-breadcrumb">Trang chủ &nbsp;/&nbsp; Điều phối &nbsp;/&nbsp; Gán Task &nbsp;/&nbsp; #{selectedReportId}</div>

        <div className="da-selectedContext">
          <b>Báo cáo đang chọn:</b> #{selectedReportId}
          <span className="da-selectedSource">Nguồn chọn: {selectionSourceText}</span>
        </div>

        <div className="da-head">
          <div>
            <h1>Điều phối &amp; Gán Task Collector</h1>
            <p>Gán báo cáo cho nhân viên thu gom dựa trên khối lượng công việc và khoảng cách địa lý.</p>
          </div>
          <button className="da-ghostBtn" type="button">
            <FaFilter /> Bộ lọc
          </button>
        </div>

        <div className="da-grid">
          <div className="da-left">
            <div className="da-blockTitle">
              <span className="da-dot" /> Báo cáo đang chọn
            </div>

            <div className="da-card">
              <div className="da-cardMap">
                <div className="da-pin" />
                <div className="da-mapHint" />
              </div>

              <div className="da-cardBody">
                <div className="da-row">
                  <Pill tone="muted">{report.status}</Pill>
                  <div className="da-waste">
                    <div className="da-wLabel">LOẠI RÁC</div>
                    <div className="da-wValue">{report.wasteType}</div>
                  </div>
                </div>

                <div className="da-code">#{report.id}</div>

                <div className="da-meta">
                  <div className="da-metaItem">
                    <FaMapMarkerAlt /> <span>{report.address}</span>
                  </div>
                  <div className="da-metaItem">
                    <FaClock /> <span>{report.weightEstimate}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="da-sla">
              <div className="da-slaTop">
                <div className="da-slaIcon">
                  <FaExclamationTriangle />
                </div>
                <div>
                  <div className="da-slaTitle">{report.sla.title}</div>
                  <div className="da-slaDesc">{report.sla.desc}</div>
                </div>
              </div>
              <button className="da-slaLink" type="button">
                {report.sla.linkText} →
              </button>
            </div>
          </div>

          <div className="da-right">
            <div className="da-rightTop">
              <div className="da-blockTitle">
                <span className="da-dot" /> Collectors khả dụng
              </div>
              <div className="da-rightNote">{countText}</div>
            </div>

            <div className="da-tableCard">
              <div className="da-table">
                <div className="da-tr da-th">
                  <div>COLLECTOR</div>
                  <div>KHOẢNG CÁCH</div>
                  <div>TẢI CÔNG VIỆC</div>
                  <div>THAO TÁC</div>
                </div>

                {collectors.map((c) => (
                  <div className="da-tr" key={c.id}>
                    <div className="da-collectorCell">
                      <Avatar name={c.name} />
                      <div>
                        <div className="da-strong">{c.name}</div>
                        <div className="da-sub">● {c.status}</div>
                      </div>
                    </div>

                    <div>
                      <div className="da-strong">{c.distanceKm.toFixed(1)} km</div>
                      <div className="da-sub">{c.etaText}</div>
                    </div>

                    <div className="da-loadCell">
                      <div className="da-loadTop">
                        <div className="da-sub">
                          {c.tasks}/{c.maxTasks} Tasks
                        </div>
                        <div className="da-sub">{c.loadPercent}%</div>
                      </div>
                      <Progress percent={c.loadPercent} />
                    </div>

                    <div className="da-actionCell">
                      <button
                        className={`da-assign ${c.canAssign ? "" : "is-disabled"}`}
                        type="button"
                        disabled={!c.canAssign || assigningId === c.id}
                        onClick={() => handleAssign(c)}
                      >
                        {assigningId === c.id ? "..." : "Gán Task"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="da-miniMap">
              <div className="da-miniHead">
                <div className="da-miniTitle">XEM NHANH BẢN ĐỒ</div>
                <button className="da-miniLink" type="button" onClick={openBigMap}>
                  {data.miniMap.openMapText} ↗
                </button>
              </div>
              <div className="da-miniCanvas">
                <div className="da-miniPin" />
                <div className="da-miniBike" />
              </div>
            </div>

            <div className="da-history">
              <div className="da-historyHead">
                <div className="da-miniTitle">LỊCH SỬ PHÂN CÔNG</div>
                <button
                  className="da-miniLink"
                  type="button"
                  onClick={() =>
                    navigate(`/enterprise/reports/detail/${selectedReportId}`, {
                      state: { selectedFrom: "dispatch-assign" },
                    })
                  }
                >
                  Xem chi tiết báo cáo ↗
                </button>
              </div>

              {!assignmentHistory.length ? (
                <div className="da-historyEmpty">Chưa có lần gán nào cho báo cáo này.</div>
              ) : (
                <div className="da-historyList">
                  {assignmentHistory.map((item) => (
                    <div className="da-historyItem" key={item.id}>
                      <div className="da-historyTitle">Đã gán cho {item.collectorName}</div>
                      <div className="da-historyMeta">
                        Collector ID: {item.collectorId || "-"} • {item.assignedAtText || item.assignedAt}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
  );
}