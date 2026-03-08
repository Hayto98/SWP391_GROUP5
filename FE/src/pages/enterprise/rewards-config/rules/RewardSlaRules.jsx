import React, { useState } from "react";
import "./rewardSlaRules.css";
import { useRewardSlaRules } from "../../../../hooks/useRewardSlaRules";
import {
  FaSave,
  FaUndoAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaPlus,
  FaTimes,
  FaTrash,
  FaEdit,
} from "react-icons/fa";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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

// ─── Modal thêm loại rác ──────────────────────────────────────────────────────
function AddWasteTypeModal({ onClose, onConfirm, adding }) {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("KG");
  const [localErr, setLocalErr] = useState("");

  const handleSubmit = async () => {
    if (!name.trim()) {
      setLocalErr("Vui lòng nhập tên loại rác");
      return;
    }
    setLocalErr("");
    const res = await onConfirm({ wasteTypeName: name.trim(), unitType: unit });
    if (res?.ok) onClose();
  };

  return (
    <div className="rs-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="rs-modal">
        <div className="rs-modal-header">
          <span>Thêm loại rác mới</span>
          <button className="rs-modal-close" onClick={onClose} disabled={adding}>
            <FaTimes />
          </button>
        </div>

        <div className="rs-modal-body">
          <div className="rs-field">
            <label className="rs-label">Tên loại rác <span style={{ color: "#ef4444" }}>*</span></label>
            <input
              className="rs-field-input"
              placeholder="VD: Nhựa HDPE, Cao su..."
              value={name}
              onChange={(e) => { setName(e.target.value); setLocalErr(""); }}
              disabled={adding}
              autoFocus
            />
          </div>

          <div className="rs-field">
            <label className="rs-label">Đơn vị tính</label>
            <div className="rs-unit-group">
              {["KG", "LON"].map((u) => (
                <button
                  key={u}
                  type="button"
                  className={`rs-unit-opt${unit === u ? " rs-unit-opt--active" : ""}`}
                  onClick={() => setUnit(u)}
                  disabled={adding}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {localErr && <div className="rs-field-err">{localErr}</div>}
        </div>

        <div className="rs-modal-footer">
          <button className="rs-btn rs-btn-ghost" type="button" onClick={onClose} disabled={adding}>
            Hủy
          </button>
          <button
            className="rs-btn rs-btn-primary"
            type="button"
            onClick={handleSubmit}
            disabled={adding || !name.trim()}
          >
            {adding ? "Đang thêm..." : <><FaPlus /> Thêm loại rác</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Sửa thông tin điểm rác ─────────────────────────────────────────────
function EditWasteTypeModal({ onClose, onConfirm, adding, wasteItem }) {
  const [points, setPoints] = useState(wasteItem.factor || 0);
  const [variance, setVariance] = useState(wasteItem.allowed_variance_percent || 0);
  const [desc, setDesc] = useState(wasteItem.description || "");
  const [localErr, setLocalErr] = useState("");

  const handleSubmit = async () => {
    if (points < 0) {
      setLocalErr("Hệ số điểm không được âm");
      return;
    }
    setLocalErr("");
    const res = await onConfirm({
      wasteTypeId: wasteItem.id,
      pointsPerUnit: Number(points),
      allowed_variance_percent: Number(variance),
      description: desc
    });
    if (res?.ok) onClose();
  };

  return (
    <div className="rs-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="rs-modal">
        <div className="rs-modal-header">
          <span>Sửa: {wasteItem.name}</span>
          <button className="rs-modal-close" onClick={onClose} disabled={adding}>
            <FaTimes />
          </button>
        </div>

        <div className="rs-modal-body">
          <div className="rs-field">
            <label className="rs-label">Hệ số điểm ({wasteItem.unitType})</label>
            <input
              className="rs-field-input"
              type="number"
              value={points}
              onChange={(e) => { setPoints(e.target.value); setLocalErr(""); }}
              disabled={adding}
              autoFocus
            />
          </div>

          <div className="rs-field">
            <label className="rs-label">Tỷ lệ sai số cho phép (%)</label>
            <input
              className="rs-field-input"
              type="number"
              value={variance}
              onChange={(e) => { setVariance(e.target.value); setLocalErr(""); }}
              disabled={adding}
            />
          </div>

          <div className="rs-field">
            <label className="rs-label">Mô tả quy tắc (Tùy chọn)</label>
            <input
              className="rs-field-input"
              placeholder="VD: 20 điểm mỗi kg"
              value={desc}
              onChange={(e) => { setDesc(e.target.value); setLocalErr(""); }}
              disabled={adding}
            />
          </div>

          {localErr && <div className="rs-field-err">{localErr}</div>}
        </div>

        <div className="rs-modal-footer">
          <button className="rs-btn rs-btn-ghost" type="button" onClick={onClose} disabled={adding}>
            Hủy
          </button>
          <button
            className="rs-btn rs-btn-primary"
            type="button"
            onClick={handleSubmit}
            disabled={adding}
          >
            {adding ? "Đang lưu..." : <><FaSave /> Cập nhật</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function RewardSlaRules() {
  const [showModal, setShowModal] = useState(false);
  const [wasteToDelete, setWasteToDelete] = useState(null);
  const [wasteToEdit, setWasteToEdit] = useState(null);

  const {
    draft,
    loading,
    saving,
    adding,
    error,
    dirty,
    reset,
    save,
    updateWasteFactor,
    updateQualityMultiplier,
    updateSla,
    addWasteType,
    removeWasteType,
    editWasteType,
  } = useRewardSlaRules();

  if (loading) return <div style={{ padding: 16 }}>Đang tải...</div>;
  if (!draft) return null;

  return (
    <div className="rs">
      <div className="rs-breadcrumb">Hệ thống / Quy tắc điểm thưởng</div>

      <div className="rs-head">
        <div>
          <h1>Cấu hình Quy tắc Điểm thưởng &amp; SLA</h1>
          <p>Thiết lập hệ số điểm cho các loại rác và quy tắc xử lý cho khối lượng lớn.</p>
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
        <div style={{ padding: 10, color: "#991b1b", fontWeight: 900 }}>{error}</div>
      )}

      <div className="rs-grid">
        <div className="rs-card">
          <div className="rs-cardTitle">1. Hệ số điểm thưởng theo loại rác</div>

          <div className="rs-table">
            <div className="rs-tr rs-th">
              <div>LOẠI RÁC THẢI</div>
              <div>MÔ TẢ HỆ SỐ</div>
              <div>HỆ SỐ ĐIỂM</div>
            </div>

            {draft.pointsByWaste.map((w) => (
              <div className="rs-tr" key={w.id}>
                <div className="rs-strong">{w.name}</div>
                <div className="rs-sub">
                  <div>{w.desc}</div>
                  <div style={{ fontSize: "0.85em", color: "#6b7280", marginTop: "4px" }}>
                    Sai số cho phép: {w.allowed_variance_percent || 0}%
                  </div>
                  {w.description && (
                    <div style={{ fontSize: "0.85em", color: "#6b7280", marginTop: "2px" }}>
                      Mô tả: {w.description}
                    </div>
                  )}
                </div>
                <div className="rs-inputWrap" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                  <input
                    className="rs-input"
                    value={w.factor}
                    onChange={(e) =>
                      updateWasteFactor(w.id, Number(e.target.value || 0))
                    }
                    type="number"
                    step="0.1"
                  />
                  <button
                    type="button"
                    className="rs-del-btn"
                    onClick={() => setWasteToEdit(w)}
                    title="Sửa loại rác"
                    style={{ color: "#3b82f6" }}
                  >
                    <FaEdit />
                  </button>
                  <button
                    type="button"
                    className="rs-del-btn"
                    onClick={() => setWasteToDelete(w)}
                    title="Xóa loại rác"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}

            <button
              className="rs-add"
              type="button"
              onClick={() => setShowModal(true)}
            >
              <FaPlus style={{ marginRight: 6, verticalAlign: "middle" }} />
              Thêm loại rác mới
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
                        updateQualityMultiplier(q.id, Number(e.target.value || 0))
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
            <div className="rs-cardTitle">3. Quy tắc khối lượng lớn (SLA)</div>

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
                        updateSla({ extraRewardMultiplier: Number(e.target.value || 0) })
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
                  Khi báo cáo đạt ngưỡng lớn, hệ thống sẽ tự động đánh dấu ưu tiên và tăng điểm thưởng theo hệ số.
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

      {showModal && (
        <AddWasteTypeModal
          onClose={() => setShowModal(false)}
          onConfirm={addWasteType}
          adding={adding}
        />
      )}

      {wasteToEdit && (
        <EditWasteTypeModal
          onClose={() => setWasteToEdit(null)}
          onConfirm={editWasteType}
          adding={adding}
          wasteItem={wasteToEdit}
        />
      )}

      <Dialog open={!!wasteToDelete} onOpenChange={(open) => !open && setWasteToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa loại rác</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa loại rác "<strong>{wasteToDelete?.name}</strong>"? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWasteToDelete(null)} disabled={saving || adding}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              disabled={saving || adding}
              onClick={async () => {
                const res = await removeWasteType(wasteToDelete.id);
                if (res?.ok) setWasteToDelete(null);
              }}
            >
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
