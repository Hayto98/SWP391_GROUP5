import React from "react";
import "./rewardSlaRules.css";
import AdminPortalLayout from "@/layouts/AdminPortalLayout";
import { useRewardSlaRules } from "../../../../hooks/useRewardSlaRules";
import {
  FaSave,
  FaUndoAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
} from "react-icons/fa";

const TopBtn = ({ tone, icon, children, onClick, disabled }) => (
  <button
    className={`rs-btn rs-btn-${tone}`}
    type="button"
    onClick={onClick}
    disabled={disabled}
  >
    {icon} {children}
  </button>
);

const ToneIcon = ({ tone }) => {
  if (tone === "ok") return <FaCheckCircle />;
  if (tone === "warn") return <FaExclamationTriangle />;
  return <FaTimesCircle />;
};

export default function RewardSlaRules() {
  const {
    draft,
    loading,
    saving,
    error,
    dirty,
    reset,
    save,
    updateWasteFactor,
    updateQualityMultiplier,
    updateSla,
  } = useRewardSlaRules();

  if (loading) return <div style={{ padding: 16 }}>Đang tải...</div>;
  if (!draft) return null;

  return (
    <AdminPortalLayout>
      <div className="rs">
        <div className="rs-breadcrumb">Hệ thống / Quy tắc điểm thưởng</div>

        <div className="rs-head">
          <div>
            <h1>Cấu hình Quy tắc Điểm thưởng &amp; SLA</h1>
            <p>
              Thiết lập hệ số điểm cho các loại rác và quy tắc xử lý cho khối
              lượng lớn.
            </p>
          </div>

          <div className="rs-headActions">
            <TopBtn
              tone="ghost"
              icon={<FaUndoAlt />}
              onClick={reset}
              disabled={!dirty || saving}
            >
              Hủy thay đổi
            </TopBtn>
            <TopBtn
              tone="primary"
              icon={<FaSave />}
              onClick={save}
              disabled={!dirty || saving}
            >
              {saving ? "Đang lưu..." : "Lưu cấu hình"}
            </TopBtn>
          </div>
        </div>

        {error && (
          <div style={{ padding: 10, color: "#991b1b", fontWeight: 900 }}>
            {error}
          </div>
        )}

        <div className="rs-grid">
          <div className="rs-card">
            <div className="rs-cardTitle">
              1. Hệ số điểm thưởng theo loại rác
            </div>

            <div className="rs-table">
              <div className="rs-tr rs-th">
                <div>LOẠI RÁC THẢI</div>
                <div>MÔ TẢ HỆ SỐ</div>
                <div>HỆ SỐ ĐIỂM</div>
              </div>

              {draft.pointsByWaste.map((w) => (
                <div className="rs-tr" key={w.id}>
                  <div className="rs-strong">{w.name}</div>
                  <div className="rs-sub">{w.desc}</div>
                  <div className="rs-inputWrap">
                    <input
                      className="rs-input"
                      value={w.factor}
                      onChange={(e) =>
                        updateWasteFactor(w.id, Number(e.target.value || 0))
                      }
                      type="number"
                      step="0.1"
                    />
                  </div>
                </div>
              ))}

              <button className="rs-add" type="button">
                + Thêm loại rác mới
              </button>
            </div>
          </div>

          <div className="rs-side">
            <div className="rs-card">
              <div className="rs-cardTitle">2. Hệ số chất lượng phân loại</div>

              <div className="rs-qList">
                {draft.qualityRules.map((q) => (
                  <div className="rs-qItem" key={q.id}>
                    <div className={`rs-qBadge rs-qBadge-${q.tone}`}>
                      <ToneIcon tone={q.tone} />
                    </div>

                    <div className="rs-qText">
                      <div className="rs-qMain">{q.label}</div>
                      <div className="rs-qSub">{q.note}</div>
                    </div>

                    <div className="rs-qMul">
                      <span className="rs-qMulX">×</span>
                      <input
                        className="rs-qInput"
                        value={q.multiplier}
                        onChange={(e) =>
                          updateQualityMultiplier(
                            q.id,
                            Number(e.target.value || 0),
                          )
                        }
                        type="number"
                        step="0.1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rs-card">
              <div className="rs-cardTitle">
                3. Quy tắc khối lượng lớn (SLA)
              </div>

              <div className="rs-slaBlock">
                <div className="rs-slaLabel">NGƯỠNG KHỐI LƯỢNG ƯU TIÊN</div>

                <div className="rs-slaThreshold">
                  <span className="rs-slaThresholdText">Khối lượng ≥</span>
                  <input
                    className="rs-slaInput"
                    value={draft.slaLargeWeight.thresholdKg}
                    onChange={(e) =>
                      updateSla({ thresholdKg: Number(e.target.value || 0) })
                    }
                    type="number"
                  />
                  <span className="rs-slaUnit">kg</span>
                </div>

                <div className="rs-slaBlueBox">
                  <div className="rs-slaBlueRow">
                    <div className="rs-slaBlueLabel">Hệ số thưởng thêm</div>
                    <div className="rs-slaBlueRight">
                      <span className="rs-slaPlus">+</span>
                      <input
                        className="rs-slaBlueInput"
                        value={draft.slaLargeWeight.extraRewardMultiplier}
                        onChange={(e) =>
                          updateSla({
                            extraRewardMultiplier: Number(e.target.value || 0),
                          })
                        }
                        type="number"
                        step="0.1"
                      />
                    </div>
                  </div>

                  <div className="rs-slaBlueRow">
                    <div className="rs-slaBlueLabel">Thời gian xử lý SLA</div>
                    <div className="rs-slaBlueRight">
                      <input
                        className="rs-slaBlueInput"
                        value={draft.slaLargeWeight.slaHours}
                        onChange={(e) =>
                          updateSla({ slaHours: Number(e.target.value || 0) })
                        }
                        type="number"
                      />
                      <span className="rs-slaUnit">giờ</span>
                    </div>
                  </div>

                  <div className="rs-slaHint">
                    Khi báo cáo đạt ngưỡng lớn, hệ thống sẽ tự động đánh dấu ưu
                    tiên và tăng điểm thưởng theo hệ số.
                  </div>
                </div>

                <label className="rs-slaCheck">
                  <input
                    type="checkbox"
                    checked={draft.slaLargeWeight.autoNotifyExpired}
                    onChange={(e) =>
                      updateSla({ autoNotifyExpired: e.target.checked })
                    }
                  />
                  <span>Tự động gửi thông báo cho Quản lý khi quá hạn</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="rs-footerLine">
          <div>PHIÊN BẢN: {draft.version}</div>
          <div>HỆ THỐNG ĐANG HOẠT ĐỘNG</div>
          <div>CẬP NHẬT CUỐI: {draft.updatedAt}</div>
        </div>
      </div>
    </AdminPortalLayout>
  );
}
