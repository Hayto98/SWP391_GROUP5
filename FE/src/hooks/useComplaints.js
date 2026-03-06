import { useCallback, useEffect, useMemo, useState } from "react";
import { escalateComplaint, getComplaintDetail, getComplaints, sendComplaintMessage } from "../services/complaints.service";

export function useComplaints() {
  const [tab, setTab] = useState("all");
  const [reason, setReason] = useState("Lý do");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState("");

  const [data, setData] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  const params = useMemo(() => ({ tab, reason, q }), [tab, reason, q]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getComplaints(params);
      setData(res);
      setSelectedId(res.selectedId || "");
      setDetail(res.detail || null);
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
    if (!selectedId) return;
    (async () => {
      try {
        const d = await getComplaintDetail(selectedId);
        setDetail(d);
      } catch (e) {
        setError(e?.message || "Có lỗi xảy ra");
      }
    })();
  }, [selectedId]);

  const filteredList = useMemo(() => {
    if (!data?.list) return [];
    if (!q.trim()) return data.list;
    const s = q.trim().toLowerCase();
    return data.list.filter((r) => (r.id + " " + r.reason + " " + r.status + " " + r.citizen).toLowerCase().includes(s));
  }, [data, q]);

  const pick = (id) => setSelectedId(id);

  const send = useCallback(async () => {
    if (!selectedId || !message.trim()) return;
    setSending(true);
    try {
      await sendComplaintMessage({ id: selectedId, message });
      setMessage("");
    } finally {
      setSending(false);
    }
  }, [selectedId, message]);

  const escalate = useCallback(async () => {
    if (!selectedId) return;
    setSending(true);
    try {
      await escalateComplaint({ id: selectedId });
    } finally {
      setSending(false);
    }
  }, [selectedId]);

  return {
    data,
    detail,
    loading,
    error,
    tab,
    reason,
    q,
    selectedId,
    message,
    sending,
    setTab,
    setReason,
    setQ,
    pick,
    setMessage,
    send,
    escalate,
    list: filteredList,
  };
}