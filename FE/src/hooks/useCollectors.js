import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  lockEmployee,
  getEmployeeStatistics,
} from "../services/collectors.service";

export function useCollectors() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(6);

  const [allRows, setAllRows] = useState([]);
  const [statistics, setStatistics] = useState({
    assigned: 0,
    completed: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ── Load employees list ──────────────────────────────────────────────
  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getEmployees();
      // API trả về toàn bộ list — có thể là mảng trực tiếp hoặc { data: [...] }
      const rows = Array.isArray(res) ? res : res?.data || res?.rows || [];
      setAllRows(rows);
      // Có thể API /employees không trả về đủ field thống kê, nên không tự tính ở đây nữa
    } catch (e) {
      setError(e?.message || "Có lỗi xảy ra khi tải danh sách");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Load statistics ──────────────────────────────────────────────────
  const loadStatistics = useCallback(async () => {
    try {
      const res = await getEmployeeStatistics();
      // API trả về từng object nhân viên (có dạng phân trang hoặc mảng)
      const dataArr = Array.isArray(res) ? res : res?.data || res?.rows || [];

      // Tự tổng hợp từ mảng data objects của nhân viên
      const assigned = dataArr.reduce(
        (acc, emp) => acc + (emp.totalAssigned || 0),
        0,
      );
      const completed = dataArr.reduce(
        (acc, emp) => acc + (emp.totalCompleted || 0),
        0,
      );
      const rejected = dataArr.reduce(
        (acc, emp) => acc + (emp.totalRejected || 0),
        0,
      );

      setStatistics({
        assigned,
        completed,
        rejected,
      });
    } catch {
      // Bỏ qua nếu lỗi
    }
  }, []);

  // ── Initial load ─────────────────────────────────────────────────────
  useEffect(() => {
    loadEmployees();
    loadStatistics();
  }, [loadEmployees, loadStatistics]);

  // ── Client-side search ───────────────────────────────────────────────
  const filteredRows = useMemo(() => {
    if (!q.trim()) return allRows;
    const s = q.trim().toLowerCase();
    return allRows.filter(
      (r) =>
        (r.fullname || "").toLowerCase().includes(s) ||
        (r.email || "").toLowerCase().includes(s) ||
        (r.phone || "").includes(s) ||
        (r.userAccountId || "").toLowerCase().includes(s),
    );
  }, [allRows, q]);

  // ── Client-side pagination ───────────────────────────────────────────
  const total = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const rows = filteredRows.slice(start, start + pageSize);
  const startItem = total === 0 ? 0 : start + 1;
  const endItem = Math.min(page * pageSize, total);

  // Reset page khi search thay đổi
  useEffect(() => {
    setPage(1);
  }, [q]);

  // ── CRUD handlers ───────────────────────────────────────────────────
  const handleCreate = useCallback(
    async (payload) => {
      const res = await createEmployee(payload);
      await Promise.all([loadEmployees(), loadStatistics()]);
      return res;
    },
    [loadEmployees, loadStatistics],
  );

  const handleLock = useCallback(
    async (employeeId) => {
      const res = await lockEmployee(employeeId);
      await Promise.all([loadEmployees(), loadStatistics()]);
      return res;
    },
    [loadEmployees, loadStatistics],
  );

  const getDetail = useCallback(async (employeeId) => {
    const res = await getEmployeeById(employeeId);
    return res?.data || res;
  }, []);

  return {
    rows,
    totalEmployees: allRows.length,
    total,
    totalPages,
    startItem,
    endItem,
    statistics,
    loading,
    error,
    q,
    page,
    pageSize,
    setQ,
    setPage,
    reload: loadEmployees,
    reloadStatistics: loadStatistics,
    handleCreate,
    handleLock,
    getDetail,
  };
}
