import { useCallback, useEffect, useState } from "react";
import { getProgressTracking } from "@/services/progressTracking.service";

export function useProgressTracking() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("all");
  const [sort, setSort] = useState("SLA Gần nhất");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getProgressTracking({ tab, sort });
      setData(res);
    } catch (e) {
      setError(e?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }, [tab, sort]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, tab, sort, setTab, setSort, reload: load };
}
