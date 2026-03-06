import { useCallback, useEffect, useMemo, useState } from "react";
import { getServiceAreas } from "../services/serviceAreas.service";

export function useServiceAreas() {
  const [province, setProvince] = useState("Tất cả");
  const [district, setDistrict] = useState("Tất cả");
  const [status, setStatus] = useState("Tất cả");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getServiceAreas({ province, district, status, page, pageSize });
      setData(res);
    } catch (e) {
      setError(e?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }, [province, district, status, page, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [province, district, status]);

  const districts = useMemo(() => {
    const map = data?.filters?.districtsByProvince || {};
    if (province === "Tất cả") return ["Tất cả"];
    return ["Tất cả", ...(map[province] || [])];
  }, [data, province]);

  const clearFilters = () => {
    setProvince("Tất cả");
    setDistrict("Tất cả");
    setStatus("Tất cả");
  };

  return {
    data,
    loading,
    error,
    province,
    district,
    status,
    page,
    pageSize,
    setProvince,
    setDistrict,
    setStatus,
    setPage,
    clearFilters,
    districts,
    reload: load,
  };
}