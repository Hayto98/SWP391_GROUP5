import { useCallback, useEffect, useMemo, useState } from "react";
import { getCollectionAnalytics } from "../services/collectionAnalytics.service";

export function useCollectionAnalytics() {
  const [from, setFrom] = useState("01/05/2024");
  const [to, setTo] = useState("24/05/2024");
  const [province, setProvince] = useState("Tất cả");
  const [district, setDistrict] = useState("Tất cả");
  const [ward, setWard] = useState("Tất cả");
  const [waste, setWaste] = useState("Tất cả");
  const [status, setStatus] = useState("Đang hoạt động");

  const [page, setPage] = useState(1);
  const [pageSize] = useState(4);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const params = useMemo(
    () => ({ from, to, province, district, ward, waste, status, page, pageSize }),
    [from, to, province, district, ward, waste, status, page, pageSize]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getCollectionAnalytics(params);
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
  }, [from, to, province, district, ward, waste, status]);

  return {
    data,
    loading,
    error,
    from,
    to,
    province,
    district,
    ward,
    waste,
    status,
    page,
    pageSize,
    setFrom,
    setTo,
    setProvince,
    setDistrict,
    setWard,
    setWaste,
    setStatus,
    setPage,
    reload: load,
  };
}