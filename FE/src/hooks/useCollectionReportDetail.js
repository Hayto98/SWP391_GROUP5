import { useCallback, useEffect, useState } from "react";
import { getCollectionReportDetail } from "../services/collectionReportDetail.service";

export function useCollectionReportDetail(reportId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getCollectionReportDetail(reportId);
      setData(res);
    } catch (e) {
      setError(e?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}