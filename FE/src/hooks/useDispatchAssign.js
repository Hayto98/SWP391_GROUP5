import { useCallback, useEffect, useState } from "react";
import { assignTaskToCollector, getDispatchAssign } from "../services/dispatchAssign.service";
import { recordReportAssignment } from "../services/reportAssignmentHistory.service";

export function useDispatchAssign(reportId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assigningId, setAssigningId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getDispatchAssign(reportId);
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

  const assign = useCallback(async (collectorId) => {
    if (!data?.selectedReport?.id) return;
    setAssigningId(collectorId);
    setError("");
    try {
      await assignTaskToCollector({ reportId: data.selectedReport.id, collectorId });
      const collector = (data.collectors || []).find((item) => item.id === collectorId);
      const assignmentEntry = recordReportAssignment({
        reportId: data.selectedReport.id,
        collectorId,
        collectorName: collector?.name,
      });

      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          collectors: prev.collectors.map((c) => (c.id === collectorId ? { ...c, tasks: c.tasks + 1, loadPercent: Math.min(100, c.loadPercent + 20) } : c)),
        };
      });

      return { ok: true, assignmentEntry };
    } catch (e) {
      setError(e?.message || "Gán task thất bại");
      return { ok: false, error: e?.message || "Gán task thất bại" };
    } finally {
      setAssigningId("");
    }
  }, [data]);

  return { data, loading, error, assigningId, reload: load, assign };
}