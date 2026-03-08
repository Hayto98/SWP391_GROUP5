import { useCallback, useEffect, useMemo, useState } from "react";
import {
  exportPendingReports,
  getPendingReports,
  updatePendingReportStatus,
} from "../services/pendingReports.service";

export function usePendingReports() {
  const [q, setQ] = useState("");
  const [ward, setWard] = useState("Tất cả Người dùng");
  const [wasteType, setWasteType] = useState("Tất cả loại rác");
  const [wasteSubType, setWasteSubType] = useState("Tất cả đơn vị rác");
  const [weight, setWeight] = useState("Tất cả cân nặng");
  const [status, setStatus] = useState("Tất cả trạng thái");
  const [sort, setSort] = useState("Hết hạn SLA");

  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acting, setActing] = useState("");
  const [exporting, setExporting] = useState(false);

  const params = useMemo(
    () => ({
      q,
      ward,
      wasteType,
      wasteSubType,
      weight,
      status,
      sort,
      page,
      pageSize,
    }),
    [q, ward, wasteType, wasteSubType, weight, status, sort, page, pageSize],
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
  }, [q, ward, wasteType, wasteSubType, weight, status, sort]);

  const doAction = useCallback(async (code, action) => {
    setActing(code);
    setError("");
    try {
      const apiActionResult = await updatePendingReportStatus({ code, action });
      setData((prev) => {
        if (!prev) return prev;

        if (String(action).toLowerCase() === "accept") {
          const acceptedStatus = String(
            apiActionResult?.status || "ACCEPTED",
          ).toUpperCase();
          const nextRows = prev.result.rows.map((r) => {
            if (r.code !== code) return r;
            return {
              ...r,
              isAccepted: true,
              canAssign: true,
              canAccept: false,
              status: acceptedStatus,
              actions: (r.actions || []).filter(
                (a) => a !== "accept" && a !== "reject",
              ),
            };
          });

          return {
            ...prev,
            result: {
              ...prev.result,
              rows: nextRows,
            },
          };
        }

        const nextRows = prev.result.rows.filter((r) => r.code !== code);
        const nextTotal = Math.max(0, (prev.result.total || 0) - 1);

        return {
          ...prev,
          summary: { pending: nextTotal },
          result: { ...prev.result, total: nextTotal, rows: nextRows },
        };
      });
      return { ok: true };
    } catch (e) {
      const message = e?.message || "Thao tác thất bại";

      // Backend enforces 4-hour SLA for ACCEPT. If request is stale, reflect it immediately in UI.
      if (
        String(action).toLowerCase() === "accept" &&
        /(invalid or expired|sla\s*4\s*hours\s*has\s*expired|expired)/i.test(
          message,
        )
      ) {
        setData((prev) => {
          if (!prev) return prev;

          const nextRows = prev.result.rows.map((r) => {
            if (r.code !== code) return r;
            return {
              ...r,
              canAccept: false,
              sla: { type: "expired", text: "Quá hạn", tone: "red" },
            };
          });

          return {
            ...prev,
            result: {
              ...prev.result,
              rows: nextRows,
            },
          };
        });
      }

      setError(message);
      return { ok: false, error: message };
    } finally {
      setActing("");
    }
  }, []);

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
    status,
    sort,
    page,
    pageSize,
    setQ,
    setWard,
    setWasteType,
    setWasteSubType,
    setWeight,
    setStatus,
    setSort,
    setPage,
    reload: load,
    doAction,
    exportExcel,
  };
}
