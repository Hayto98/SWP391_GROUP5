import { useCallback, useEffect, useState } from "react";
import { getReportDetail, updateReportAction } from "../services/reportDetail.service";

export function useReportDetail(reportId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getReportDetail(reportId);
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

  const action = useCallback(async (type) => {
    if (!data) return;
    setActing(true);
    setError("");
    try {
      await updateReportAction({ id: data.id, type });
    } catch (e) {
      setError(e?.message || "Thao tác thất bại");
    } finally {
      setActing(false);
    }
  }, [data]);

  return { data, loading, error, acting, reload: load, action };
}