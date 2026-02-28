import { useCallback, useEffect, useMemo, useState } from "react";
import { exportPendingReports, getPendingReports, updatePendingReportStatus } from "../services/pendingReports.service";

export function usePendingReports() {
  const [q, setQ] = useState("");
  const [ward, setWard] = useState("Tất cả Quận");
  const [wasteType, setWasteType] = useState("Tất cả");
  const [wasteSubType, setWasteSubType] = useState("Tất cả");
  const [weight, setWeight] = useState("Tất cả");
  const [sort, setSort] = useState("Hết hạn SLA");

  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acting, setActing] = useState("");
  const [exporting, setExporting] = useState(false);

  const params = useMemo(
    () => ({ q, ward, wasteType, wasteSubType, weight, sort, page, pageSize }),
    [q, ward, wasteType, wasteSubType, weight, sort, page, pageSize]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getPendingReports(params);
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
  }, [q, ward, wasteType, wasteSubType, weight, sort]);

  const doAction = useCallback(
    async (code, action) => {
      setActing(code);
      setError("");
      try {
        await updatePendingReportStatus({ code, action });
        setData((prev) => {
          if (!prev) return prev;
          const nextRows = prev.result.rows.filter((r) => r.code !== code);
          const nextTotal = Math.max(0, (prev.result.total || 0) - 1);
          return { ...prev, summary: { pending: nextTotal }, result: { ...prev.result, total: nextTotal, rows: nextRows } };
        });
      } catch (e) {
        setError(e?.message || "Thao tác thất bại");
      } finally {
        setActing("");
      }
    },
    []
  );

  const exportExcel = useCallback(async () => {
    setExporting(true);
    setError("");
    try {
      await exportPendingReports(params);
    } catch (e) {
      setError(e?.message || "Xuất báo cáo thất bại");
    } finally {
      setExporting(false);
    }
  }, [params]);

  return {
    data,
    loading,
    error,
    acting,
    exporting,
    q,
    ward,
    wasteType,
    wasteSubType,
    weight,
    sort,
    page,
    pageSize,
    setQ,
    setWard,
    setWasteType,
    setWasteSubType,
    setWeight,
    setSort,
    setPage,
    reload: load,
    doAction,
    exportExcel,
  };
}