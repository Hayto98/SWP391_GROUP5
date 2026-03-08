import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getRewardSlaRules,
  saveRewardSlaRules,
  createWasteType,
  deleteWasteType,
  updateRewardConfig,
} from "../services/rewardSlaRules.service";

export function useRewardSlaRules() {
  const [origin, setOrigin] = useState(null);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getRewardSlaRules();
      setOrigin(res);
      setDraft(JSON.parse(JSON.stringify(res)));
    } catch (e) {
      setError(e?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dirty = useMemo(
    () => JSON.stringify(origin) !== JSON.stringify(draft),
    [origin, draft]
  );

  const reset = () => {
    if (!origin) return;
    setDraft(JSON.parse(JSON.stringify(origin)));
  };

  const updateWasteFactor = (id, value) => {
    setDraft((prev) => ({
      ...prev,
      pointsByWaste: prev.pointsByWaste.map((w) =>
        w.id === id ? { ...w, factor: value } : w
      ),
    }));
  };

  const updateQualityMultiplier = (id, value) => {
    setDraft((prev) => ({
      ...prev,
      qualityRules: prev.qualityRules.map((q) =>
        q.id === id ? { ...q, multiplier: value } : q
      ),
    }));
  };

  const updateSla = (patch) => {
    setDraft((prev) => ({
      ...prev,
      slaLargeWeight: { ...prev.slaLargeWeight, ...patch },
    }));
  };

  /**
   * Thêm loại rác mới qua API POST /enterprise/waste-types
   * @param {{ wasteTypeName: string, unitType: "KG" | "LON" }} payload
   */
  const addWasteType = useCallback(
    async ({ wasteTypeName, unitType }) => {
      setAdding(true);
      setError("");
      try {
        const res = await createWasteType({ wasteTypeName, unitType });
        const newItem = {
          id: String(res.data.wasteTypeId),
          wasteTypeId: res.data.wasteTypeId,
          name: res.data.wasteTypeName,
          desc: `Đơn vị: ${res.data.unitType}`,
          factor: 0,
          allowed_variance_percent: 0,
          description: "",
          unitType: res.data.unitType,
        };
        // Thêm ngay vào draft + origin (không reload toàn bộ)
        setDraft((prev) => ({
          ...prev,
          pointsByWaste: [...prev.pointsByWaste, newItem],
        }));
        setOrigin((prev) => ({
          ...prev,
          pointsByWaste: [...prev.pointsByWaste, newItem],
        }));
        return { ok: true, data: newItem };
      } catch (e) {
        setError(e?.message || "Thêm loại rác thất bại");
        return { ok: false };
      } finally {
        setAdding(false);
      }
    },
    []
  );

  /**
   * Xóa loại rác qua API DELETE /enterprise/waste-types/:id
   * @param {string} id
   */
  const removeWasteType = useCallback(async (id) => {
    // Không cho click liên tục khi đang add/save/delete
    if (adding || saving) return { ok: false };
    
    // Đánh dấu loading mượn state adding hoặc error (ở đây dùng error tạm để disable/báo)
    setError("");
    try {
      await deleteWasteType(id);
      
      // Xóa khỏi UI
      setDraft((prev) => ({
        ...prev,
        pointsByWaste: prev.pointsByWaste.filter((w) => w.id !== id),
      }));
      setOrigin((prev) => ({
        ...prev,
        pointsByWaste: prev.pointsByWaste.filter((w) => w.id !== id),
      }));
      return { ok: true };
    } catch (e) {
      setError(e?.message || "Xóa loại rác thất bại");
      return { ok: false };
    }
  }, [adding, saving]);

  /**
   * Cập nhật loại rác qua API POST /enterprise/reward-config
   * @param {{ wasteTypeId: string, pointsPerUnit: number, allowed_variance_percent: number, description: string }} payload
   */
  const editWasteType = useCallback(
    async (payload) => {
      setAdding(true);
      setError("");
      try {
        await updateRewardConfig(payload);
        
        // Update draft and origin
        const upd = (w) =>
          String(w.wasteTypeId) === String(payload.wasteTypeId) || String(w.id) === String(payload.wasteTypeId)
            ? {
                ...w,
                factor: payload.pointsPerUnit,
                allowed_variance_percent: payload.allowed_variance_percent,
                description: payload.description,
              }
            : w;

        setDraft((prev) => ({
          ...prev,
          pointsByWaste: prev.pointsByWaste.map(upd),
        }));
        setOrigin((prev) => ({
          ...prev,
          pointsByWaste: prev.pointsByWaste.map(upd),
        }));
        return { ok: true };
      } catch (e) {
        setError(e?.message || "Cập nhật loại rác thất bại");
        return { ok: false };
      } finally {
        setAdding(false);
      }
    },
    []
  );

  const save = useCallback(async () => {
    if (!draft) return;
    setSaving(true);
    setError("");
    try {
      await saveRewardSlaRules(draft);
      setOrigin(JSON.parse(JSON.stringify(draft)));
    } catch (e) {
      setError(e?.message || "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  }, [draft]);

  return {
    origin,
    draft,
    loading,
    saving,
    adding,
    error,
    dirty,
    reload: load,
    reset,
    save,
    updateWasteFactor,
    updateQualityMultiplier,
    updateSla,
    addWasteType,
    removeWasteType,
    editWasteType,
  };
}