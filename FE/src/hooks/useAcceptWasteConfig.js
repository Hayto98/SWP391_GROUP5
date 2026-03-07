import { useCallback, useEffect, useMemo, useState } from "react";
import { getAcceptWasteConfig, updateAcceptWasteCategory } from "../services/acceptWasteConfig.service";

export function useAcceptWasteConfig() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAcceptWasteConfig();
      setData(res);
    } catch (e) {
      setError(e?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const storagePercent = useMemo(() => {
    if (!data?.storage) return 0;
    const p = (data.storage.used / Math.max(data.storage.total, 1)) * 100;
    return Math.min(100, Math.max(0, p));
  }, [data]);

  const toggleCategory = useCallback(
    async (categoryId) => {
      if (!data) return;

      const current = data.categories.find((c) => c.id === categoryId);
      if (!current || current.disabledCard) return;

      const nextEnabled = !current.enabled;

      setData((prev) => ({
        ...prev,
        categories: prev.categories.map((c) =>
          c.id === categoryId ? { ...c, enabled: nextEnabled } : c
        ),
      }));

      setSavingId(categoryId);
      try {
        await updateAcceptWasteCategory({ categoryId, enabled: nextEnabled });
      } catch (e) {
        setData((prev) => ({
          ...prev,
          categories: prev.categories.map((c) =>
            c.id === categoryId ? { ...c, enabled: !nextEnabled } : c
          ),
        }));
        setError(e?.message || "Lưu thất bại");
      } finally {
        setSavingId("");
      }
    },
    [data]
  );

  return { data, loading, error, savingId, storagePercent, reload: load, toggleCategory };
}