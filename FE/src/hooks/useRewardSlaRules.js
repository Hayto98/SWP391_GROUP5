import { useCallback, useEffect, useMemo, useState } from "react";
import { getRewardSlaRules, saveRewardSlaRules } from "../services/rewardSlaRules.service";

export function useRewardSlaRules() {
  const [origin, setOrigin] = useState(null);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const dirty = useMemo(() => JSON.stringify(origin) !== JSON.stringify(draft), [origin, draft]);

  const reset = () => {
    if (!origin) return;
    setDraft(JSON.parse(JSON.stringify(origin)));
  };

  const updateWasteFactor = (id, value) => {
    setDraft((prev) => ({
      ...prev,
      pointsByWaste: prev.pointsByWaste.map((w) => (w.id === id ? { ...w, factor: value } : w)),
    }));
  };

  const updateQualityMultiplier = (id, value) => {
    setDraft((prev) => ({
      ...prev,
      qualityRules: prev.qualityRules.map((q) => (q.id === id ? { ...q, multiplier: value } : q)),
    }));
  };

  const updateSla = (patch) => {
    setDraft((prev) => ({
      ...prev,
      slaLargeWeight: { ...prev.slaLargeWeight, ...patch },
    }));
  };

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
    error,
    dirty,
    reload: load,
    reset,
    save,
    updateWasteFactor,
    updateQualityMultiplier,
    updateSla,
  };
}