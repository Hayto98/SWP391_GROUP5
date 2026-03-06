import { useCallback, useEffect, useState } from "react";
import { getEnterpriseProfile, update2FA } from "../services/enterpriseProfile.service";

export function useEnterpriseProfile() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toggling2FA, setToggling2FA] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getEnterpriseProfile();
      setData(res);
    } catch (e) {
      setError(e?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle2FA = useCallback(async () => {
    if (!data) return;
    const next = !data.security.twoFAEnabled;

    setData((prev) => ({
      ...prev,
      security: { ...prev.security, twoFAEnabled: next },
    }));

    setToggling2FA(true);
    try {
      await update2FA({ enabled: String(next) });
    } catch (e) {
      setData((prev) => ({
        ...prev,
        security: { ...prev.security, twoFAEnabled: !next },
      }));
      setError(e?.message || "Không thể cập nhật 2FA");
    } finally {
      setToggling2FA(false);
    }
  }, [data]);

  return { data, loading, error, toggling2FA, reload: load, toggle2FA };
}