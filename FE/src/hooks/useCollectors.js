import { useCallback, useEffect, useMemo, useState } from "react";
import { getCollectors } from "../services/collectors.service";

export function useCollectors() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("Tất cả");
  const [onlyReady, setOnlyReady] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(4);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const params = useMemo(
    () => ({ q, status, onlyReady, page, pageSize }),
    [q, status, onlyReady, page, pageSize]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getCollectors(params);
      setData(res);
    } catch (e) {
      setError(e?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [q, status, onlyReady]);

  return {
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
    reload: load,
  };
}