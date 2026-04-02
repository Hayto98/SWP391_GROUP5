import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  User,
  Mail,
  Phone,
  Shield,
  Calendar,
  ClipboardList,
  CheckCircle,
  XCircle,
  TrendingUp,
} from "lucide-react";

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-md border px-4 py-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-semibold text-slate-900">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

function roleLabel(roleId) {
  const map = { 1: "Admin", 2: "Enterprise", 3: "Collector", 4: "Citizen" };
  return map[roleId] || `Role ${roleId}`;
}

export default function ViewEmployeeDialog({
  open,
  onOpenChange,
  employeeId,
  getDetail,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !employeeId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await getDetail(employeeId);
        if (!cancelled) setData(res);
      } catch (e) {
        if (!cancelled) setError(e?.message || "Không thể tải thông tin");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [open, employeeId, getDetail]);

  function handleClose(v) {
    onOpenChange(v);
    if (!v) {
      setData(null);
      setError("");
    }
  }

  const initials = data?.fullname
    ? data.fullname
        .split(" ")
        .map((w) => w[0])
        .slice(-2)
        .join("")
        .toUpperCase()
    : "?";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="group/scroll sm:max-w-md max-h-[85vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">
        <DialogHeader>
          <DialogTitle>Chi tiết nhân viên</DialogTitle>
          <DialogDescription>
            Thông tin tài khoản nhân viên thu gom.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Đang tải thông tin...
          </div>
        )}

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && data && (
          <div className="space-y-3">
            {/* Avatar header */}
            <div className="flex items-center gap-3 pb-2">
              <div className="flex size-12 items-center justify-center rounded-full border-2 border-emerald-200 bg-emerald-50 text-sm font-black text-emerald-700">
                {initials}
              </div>
              <div>
                <p className="text-base font-bold">{data.fullname}</p>
                <p className="text-xs text-muted-foreground">
                  ID: {data.userAccountId?.slice(0, 8)}...
                </p>
              </div>
            </div>

            <InfoRow icon={User} label="Họ và tên" value={data.fullname} />
            <InfoRow icon={Mail} label="Email" value={data.email} />
            <InfoRow icon={Phone} label="Số điện thoại" value={data.phone} />
            <InfoRow
              icon={Shield}
              label="Vai trò"
              value={roleLabel(data.roleId)}
            />
            <InfoRow
              icon={Calendar}
              label="Ngày tạo"
              value={formatDate(data.createdAt)}
            />

            {/* ── Thống kê nhiệm vụ ── */}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
