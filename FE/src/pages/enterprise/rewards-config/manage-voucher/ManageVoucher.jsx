import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2,
  Calendar,
  Gift,
  Handshake,
  History,
  Download,
  Pencil,
  Plus,
  Smartphone,
  Star,
  Tag,
  Ticket,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  getAllVoucherHistory,
  recordVoucherHistory,
} from "@/services/voucherHistory.service";
import { toast } from "sonner";

// ─── Constants ──────────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: "discount", label: "Giảm giá", color: "bg-blue-100 text-blue-700" },
  {
    value: "shipping",
    label: "Vận chuyển",
    color: "bg-green-100 text-green-700",
  },
  { value: "gift", label: "Quà tặng", color: "bg-purple-100 text-purple-700" },
  {
    value: "environment",
    label: "Môi trường",
    color: "bg-emerald-100 text-emerald-700",
  },
];

// Lấy danh sách voucher từ API khi load trang

const EMPTY_FORM = {
  voucherCode: "",
  title: "",
  description: "",
  pointsRequired: "",
  quantityTotal: "",
  validFrom: "",
  validTo: "",
  file: null,
};

const SOURCES = [
  { value: "system", label: "Từ Hệ thống (App)", color: "text-blue-600 bg-blue-100" },
  { value: "enterprise", label: "Doanh nghiệp tự cấp", color: "text-emerald-600 bg-emerald-100" },
  { value: "partner", label: "Đối tác tài trợ", color: "text-purple-600 bg-purple-100" },
];

function getSourceMeta(value) {
  return SOURCES.find((s) => s.value === value) || SOURCES[1];
}

// ─── Category helpers ────────────────────────────────────────────────────────
function getCategoryMeta(value) {
  return (
    CATEGORIES.find((c) => c.value === value) || {
      label: value,
      color: "bg-gray-100 text-gray-700",
    }
  );
}

function getHistoryActionBadgeClass(action) {
  switch (action) {
    case "create":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "update":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "delete":
      return "bg-rose-100 text-rose-700 border-rose-200";
    case "toggle_on":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "toggle_off":
      return "bg-slate-100 text-slate-700 border-slate-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, iconClass }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className={`rounded-full p-3 ${iconClass}`}>
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Voucher Form Dialog ─────────────────────────────────────────────────────
function VoucherFormDialog({ open, onClose, onSave, initial }) {
  const parseForm = (init) => {
    if (!init) return EMPTY_FORM;
    return {
      voucherCode: init.voucherCode || init.voucher_code || "",
      title: init.title || init.voucher_name || "",
      description: init.description || init.terms_description || "",
      pointsRequired: init.pointsRequired || init.points_required || "",
      quantityTotal: init.quantityTotal || "",
      validFrom: init.validFrom ? String(init.validFrom).substring(0, 10) : "",
      validTo: (init.validTo || init.expiry_date) ? String(init.validTo || init.expiry_date).substring(0, 10) : "",
      file: null,
    };
  };

  const [form, setForm] = useState(() => parseForm(initial));

  useEffect(() => {
    if (open) {
      setForm(parseForm(initial));
    }
  }, [open, initial]);

  // Sync when initial changes (edit mode)
  const handleOpen = (isOpen) => {
    if (isOpen) setForm(parseForm(initial));
    else onClose();
  };

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const handleFileChange = (e) => set("file", e.target.files[0] || null);

  const handleSave = () => {
    if (!form.title.trim()) return toast.error("Nhập tiêu đề!");
    if (!form.description.trim()) return toast.error("Nhập mô tả!");
    if (!form.pointsRequired || Number(form.pointsRequired) <= 0) return toast.error("Điểm quy đổi phải lớn hơn 0!");
    if (!form.quantityTotal || Number(form.quantityTotal) <= 0) return toast.error("Số lượng phải lớn hơn 0!");
    if (!form.validFrom.trim()) return toast.error("Nhập ngày bắt đầu!");
    if (!form.validTo.trim()) return toast.error("Nhập ngày hết hạn!");
    const isEditing = !!(initial?.voucherId || initial?.voucher_id || initial?.id);
    if (!form.file && !isEditing) return toast.error("Chọn ảnh voucher!");
    onSave({ ...form, pointsRequired: Number(form.pointsRequired), quantityTotal: Number(form.quantityTotal) });
  };

  const isEdit = !!(initial?.voucherId || initial?.voucher_id || initial?.id);

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Chỉnh sửa Voucher" : "Thêm Voucher mới"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Cập nhật thông tin voucher đổi thưởng."
              : "Tạo voucher mới cho Citizen đổi điểm thưởng."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Tiêu đề */}
          <div className="space-y-1.5">
            <Label htmlFor="vf-title">Tiêu đề *</Label>
            <Input
              id="vf-title"
              placeholder="VD: Giảm 50k đơn từ 200k"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>
          {/* Mô tả */}
          <div className="space-y-1.5">
            <Label htmlFor="vf-desc">Mô tả *</Label>
            <Textarea
              id="vf-desc"
              placeholder="Nhập mô tả voucher..."
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
            />
          </div>
          {/* Điểm quy đổi & Số lượng */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="vf-pts">Điểm quy đổi *</Label>
              <Input
                id="vf-pts"
                type="number"
                min={1}
                placeholder="VD: 500"
                value={form.pointsRequired}
                onChange={(e) => set("pointsRequired", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vf-qty">Số lượng *</Label>
              <Input
                id="vf-qty"
                type="number"
                min={1}
                placeholder="VD: 10"
                value={form.quantityTotal}
                onChange={(e) => set("quantityTotal", e.target.value)}
              />
            </div>
          </div>
          {/* Ngày bắt đầu & Ngày hết hạn */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="vf-from">Ngày bắt đầu *</Label>
              <Input
                id="vf-from"
                type="date"
                value={form.validFrom}
                onChange={(e) => set("validFrom", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vf-to">Ngày hết hạn *</Label>
              <Input
                id="vf-to"
                type="date"
                value={form.validTo}
                onChange={(e) => set("validTo", e.target.value)}
              />
            </div>
          </div>
          {/* Ảnh */}
          <div className="space-y-1.5">
            <Label htmlFor="vf-img">Ảnh voucher *</Label>
            <Input
              id="vf-img"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={handleSave}>
            {isEdit ? "Lưu thay đổi" : "Tạo Voucher"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Confirm Dialog ───────────────────────────────────────────────────
function DeleteDialog({ voucher, onClose, onConfirm }) {
  return (
    <Dialog open={!!voucher} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xác nhận xóa Voucher</DialogTitle>
          <DialogDescription>
            Bạn có chắc muốn xóa voucher{" "}
            <strong>"{voucher?.voucher_name}"</strong>? Hành động này không thể
            hoàn tác.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button variant="destructive" onClick={() => onConfirm(voucher)}>
            Xóa voucher
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ManageVoucher() {
  const [vouchers, setVouchers] = useState([]);
  const [statistics, setStatistics] = useState({
    totalVoucher: 0,
    totalActive: 0,
    totalRedeemed: 0,
    avgPoints: 0,
  });
  const [detailVoucher, setDetailVoucher] = useState(null);
  const [isDetailOpen, setDetailOpen] = useState(false);
  const [filterSource, setFilterSource] = useState("all");
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isHistoryDialogOpen, setHistoryDialogOpen] = useState(false);
  const [voucherHistoryRows, setVoucherHistoryRows] = useState([]);

  const refreshVoucherHistory = useCallback(() => {
    setVoucherHistoryRows(getAllVoucherHistory());
  }, []);

  // ── Derived stats (from API statistics) ──
  const { totalVoucher, totalActive, totalRedeemed, avgPoints } = statistics;

  // ── Filtered list ──
  // Tạm thời luôn set trạng thái voucher là bật (active) khi hiển thị
  const mappedVouchers = vouchers.map(v => ({ ...v, isActive: true }));
  const filtered = mappedVouchers.filter((v) => {
    const matchSource = filterSource === "all" || v.source === filterSource;
    const q = search.toLowerCase();
    const title = v.title || v.voucher_name || "";
    const code = v.voucherCode || v.voucher_code || "";
    const matchSearch =
      !q ||
      title.toLowerCase().includes(q) ||
      code.toLowerCase().includes(q);
    return matchSource && matchSearch;
  });

  // ── Handlers ──
  // Xem chi tiết voucher
  const handleViewDetail = async (voucherId) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/enterprise/vouchers/${voucherId}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) throw new Error("Không lấy được chi tiết voucher");
      const data = await res.json();
      setDetailVoucher(data.data || data.voucher || data);
      setDetailOpen(true);
    } catch (err) {
      toast.error("Không lấy được chi tiết voucher");
    }
  };
  const handleSave = async (data) => {
    if (editTarget) {
      try {
        const token = localStorage.getItem("accessToken");
        const formData = new FormData();
        formData.append("title", data.title);
        formData.append("description", data.description);
        formData.append("pointsRequired", data.pointsRequired);
        formData.append("quantityTotal", data.quantityTotal);
        formData.append("validFrom", data.validFrom);
        formData.append("validTo", data.validTo);
        if (data.file) formData.append("file", data.file);

        const targetId = editTarget.voucherId || editTarget.voucher_id || editTarget.id;
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/enterprise/vouchers/${targetId}`, {
          method: "PUT",
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: formData,
        });
        if (!res.ok) throw new Error("Cập nhật voucher thất bại!");
        toast.success("Đã cập nhật voucher thành công!");
      } catch (err) {
        toast.error("Cập nhật voucher thất bại!");
        return;
      }
    } else {
      try {
        const token = localStorage.getItem("accessToken");
        // Gửi form-data lên API
        const formData = new FormData();
        formData.append("title", data.title);
        formData.append("description", data.description);
        formData.append("pointsRequired", data.pointsRequired);
        formData.append("quantityTotal", data.quantityTotal);
        formData.append("validFrom", data.validFrom);
        formData.append("validTo", data.validTo);
        formData.append("file", data.file);

        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/enterprise/vouchers`, {
          method: "POST",
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: formData,
        });
        if (!res.ok) throw new Error("Tạo voucher thất bại!");
        const result = await res.json();
        toast.success("Đã tạo voucher mới thành công!");
        // Optionally: setVouchers((prev) => [result.voucher, ...prev]);
      } catch (err) {
        toast.error("Tạo voucher thất bại!");
        return;
      }
    }

    refreshVoucherHistory();
    setFormOpen(false);
    setEditTarget(null);
  };

  const handleEdit = (v) => {
    setEditTarget(v);
    setFormOpen(true);
  };

  const handleDelete = async (v) => {
    try {
      const token = localStorage.getItem("accessToken");
      const targetId = v.voucherId || v.voucher_id || v.id;
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/enterprise/vouchers/${targetId}`, {
        method: "DELETE",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) throw new Error("Xóa voucher thất bại!");
      toast.success(`Đã xóa voucher "${v.voucher_name}"`);
      // Reload lại danh sách voucher
      const reload = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/enterprise/vouchers`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (reload.ok) {
        const data = await reload.json();
        setVouchers(data.data || data.vouchers || []);
      }
    } catch (err) {
      toast.error("Xóa voucher thất bại!");
    }
    recordVoucherHistory({
      action: "delete",
      voucherId: v.voucherId || v.voucher_id,
      voucherCode: v.voucherCode || v.voucher_code,
      voucherName: v.title || v.voucher_name,
      detail: "Xóa voucher khỏi kho.",
    });
    refreshVoucherHistory();
    setDeleteTarget(null);
  };

  const handleToggle = (v) => {
    const isActive = v.isActive !== undefined ? v.isActive : v.is_active;
    const nextActive = !isActive;
    const vId = v.voucherId || v.voucher_id;

    setVouchers((prev) =>
      prev.map((x) => {
        const xId = x.voucherId || x.voucher_id;
        return xId === vId ? { ...x, isActive: nextActive, is_active: nextActive } : x;
      }),
    );

    recordVoucherHistory({
      action: nextActive ? "toggle_on" : "toggle_off",
      voucherId: vId,
      voucherCode: v.voucherCode || v.voucher_code,
      voucherName: v.title || v.voucher_name,
      detail: nextActive ? "Bật hiển thị voucher." : "Tạm tắt voucher.",
    });

    refreshVoucherHistory();
    toast.success(
      `Voucher "${v.title || v.voucher_name}" ${isActive ? "đã tắt" : "đã bật"}.`,
    );
  };


  // Lấy danh sách voucher và statistics từ API khi mount
  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/enterprise/vouchers`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });
        if (!res.ok) throw new Error("Không lấy được danh sách voucher");
        const data = await res.json();
        // API returns data as { data: [...vouchers], pagination: {...} } or { vouchers: [...] }
        setVouchers(data.data || data.vouchers || []);
      } catch (err) {
        toast.error("Không lấy được danh sách voucher");
      }
    };
    const fetchStatistics = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/enterprise/vouchers/statistics`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });
        if (!res.ok) throw new Error("Không lấy được thống kê");
        const data = await res.json();
        setStatistics({
          totalVoucher: data.totalVoucher || 0,
          totalActive: data.totalActive || 0,
          totalRedeemed: data.totalRedeemed || 0,
          avgPoints: data.avgPoints || 0,
        });
      } catch (err) {
        toast.error("Không lấy được thống kê");
      }
    };
    fetchVouchers();
    fetchStatistics();
  }, []);

  useEffect(() => {
    if (!isHistoryDialogOpen) return;
    refreshVoucherHistory();
  }, [isHistoryDialogOpen, refreshVoucherHistory]);

  const openCreate = () => {
    setEditTarget(null);
    setFormOpen(true);
  }; return (
    <div className="space-y-6">
      {/* ── Voucher Statistics ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full p-3 bg-blue-100 text-blue-700">
              <Ticket className="size-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tổng số voucher</p>
              <p className="text-2xl font-bold">{totalVoucher}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full p-3 bg-green-100 text-green-700">
              <Star className="size-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Voucher đang bật</p>
              <p className="text-2xl font-bold">{totalActive}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full p-3 bg-amber-100 text-amber-700">
              <Gift className="size-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tổng lượt đổi thưởng</p>
              <p className="text-2xl font-bold">{totalRedeemed}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full p-3 bg-purple-100 text-purple-700">
              <Tag className="size-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Điểm quy đổi TB</p>
              <p className="text-2xl font-bold">{avgPoints}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* ── Header ── */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between gap-4 py-4">
          <div>
            <CardTitle className="text-primary text-lg">Kho Voucher</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Quản lý các voucher điểm thưởng sử dụng cho ứng dụng.
            </p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-3">
            <Button
              variant="outline"
              className="border-primary text-primary hover:bg-primary/10 hover:text-primary bg-white shadow-sm flex items-center gap-2 px-6"
              onClick={() => {
                refreshVoucherHistory();
                setHistoryDialogOpen(true);
              }}
            >
              <History className="size-4" /> Lịch sử
            </Button>
            <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm flex items-center gap-2 px-6">
              <Plus className="size-4" /> Thêm mới
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* ── Search Box ── */}
      <div className="bg-gray-100 p-6 flex flex-col items-center justify-center">
        <div className="flex items-center gap-4 w-full max-w-2xl bg-white px-4 py-2 shadow-sm border">
          <span className="text-sm font-medium whitespace-nowrap text-gray-700">Mã Voucher</span>
          <Input
            placeholder="Nhập mã voucher tại đây..."
            className="flex-1 border-none shadow-none focus-visible:ring-0 px-2"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Tabs (Shopee style) ── */}
      <div className="border-b border-gray-200 flex items-center overflow-x-auto text-base">
        <button
          onClick={() => setFilterSource("all")}
          className={`flex-shrink-0 px-6 py-4 border-b-2 font-medium transition-colors ${filterSource === "all" ? "border-primary text-primary" : "border-transparent text-gray-600 hover:text-primary"
            }`}
        >
          Tất Cả ({vouchers.length})
        </button>
        {SOURCES.map((s) => {
          const count = vouchers.filter((v) => v.source === s.value).length;
          return (
            <>
              <span className="text-gray-300 flex-shrink-0">|</span>
              <button
                key={s.value}
                onClick={() => setFilterSource(s.value)}
                className={`flex-shrink-0 px-6 py-4 border-b-2 font-medium transition-colors ${filterSource === s.value ? "border-primary text-primary" : "border-transparent text-gray-600 hover:text-primary"
                  }`}
              >
                {s.label} ({count})
              </button>
            </>
          );
        })}
      </div>

      {/* ── Ticket Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {filtered.map((v) => {
          return (
            <div
              key={v.voucherId || v.voucher_id || v.id}
              className={`relative flex h-32 bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden group ${!(v.isActive !== undefined ? v.isActive : v.is_active) ? "opacity-60" : ""}`}
              onClick={() => handleViewDetail(v.voucherId || v.voucher_id || v.id)}
              style={{ cursor: 'pointer' }}
            >
              {/* Left Image / Branding */}
              <div className="w-[118px] flex-shrink-0 bg-primary flex flex-col items-center justify-center relative overflow-hidden border-r border-dashed border-gray-200 box-border p-2">
                <Gift className="size-8 mb-2 text-white opacity-90 flex-shrink-0" />
                <div className="text-[10px] text-white font-medium text-center uppercase leading-snug line-clamp-2" style={{ textTransform: "initial" }}>
                  {v.title || v.voucher_name}
                </div>
              </div>

              {/* Right Content */}
              <div className="flex-1 p-3 flex flex-col justify-between relative pl-4">
                {/* Active status indicator */}
                {(v.isActive !== undefined ? v.isActive : v.is_active) ? (
                  <div className="absolute top-3 right-3 text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                    ĐANG BẬT
                  </div>
                ) : (
                  <div className="absolute top-3 right-3 text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                    ĐÃ TẮT
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-gray-800 pr-16 line-clamp-1">{v.title || v.voucher_name}</h3>
                  <div className="text-xs text-gray-500 mt-1 line-clamp-1">{v.description || v.terms_description || `Áp dụng toàn bộ dịch vụ`}</div>

                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="text-[10px] px-1.5 py-0.5 border border-red-500 text-red-500 rounded-sm leading-none whitespace-nowrap">
                      HSD: {(v.validTo || v.expiry_date) ? String(v.validTo || v.expiry_date).substring(0, 10) : ""}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-sm font-medium whitespace-nowrap flex items-center gap-1">
                      <Star className="size-3 fill-amber-500 text-amber-500" /> {v.pointsRequired || v.points_required} đ
                    </span>
                  </div>
                </div>

                {/* Bottom Actions Overlay */}
                <div className="absolute bottom-3 right-3 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => handleEdit(v)}
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                    title="Chỉnh sửa"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(v)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    title="Xóa"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {/* ── Voucher Detail Dialog ── */}
        <Dialog open={isDetailOpen} onOpenChange={setDetailOpen}>
          {/* Xóa padding mặc định để hình ảnh tràn viền */}
          <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-white rounded-2xl shadow-xl">
            {detailVoucher ? (
              <div>
                {/* 1. Hình ảnh Voucher (Banner) */}
                {detailVoucher.fileUri ? (
                  <div className="w-full h-40 sm:h-48 bg-gray-100 relative">
                    <img 
                      src={detailVoucher.fileUri} 
                      alt="voucher" 
                      className="w-full h-full object-cover" 
                    />
                    {/* Đã bỏ badge trạng thái trên góc ảnh theo yêu cầu */}
                  </div>
                ) : (
                  <div className="pt-6 px-6 flex justify-between items-start">
                    <DialogTitle className="text-xl font-bold">Chi tiết Voucher</DialogTitle>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                      {detailVoucher.status}
                    </span>
                  </div>
                )}

                <div className="p-6">
                  {/* 2. Tiêu đề & Mô tả */}
                  {detailVoucher.fileUri && (
                    <DialogTitle className="text-xl font-bold text-gray-900 mb-2 leading-tight">
                      {detailVoucher.title}
                    </DialogTitle>
                  )}
                  <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                    {detailVoucher.description}
                  </p>

                  {/* 3. Khối Mã Voucher (Nổi bật nhất) */}
                  <div className="relative bg-blue-50 border-2 border-blue-200 border-dashed rounded-xl p-4 mb-6 text-center">
                    {/* Hai nửa hình tròn tạo hiệu ứng vết cắt của vé */}
                    <div className="absolute top-1/2 -left-3 w-6 h-6 bg-white rounded-full -translate-y-1/2"></div>
                    <div className="absolute top-1/2 -right-3 w-6 h-6 bg-white rounded-full -translate-y-1/2"></div>
                    
                    <p className="text-xs text-blue-500 font-semibold mb-1 uppercase tracking-widest">Mã Code</p>
                    <p className="text-3xl font-mono font-extrabold text-blue-700 tracking-wider">
                      {detailVoucher.voucherCode}
                    </p>
                  </div>

                  {/* 4. Lưới thông số (Grid) */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">Điểm quy đổi</p>
                      <p className="text-sm font-semibold text-gray-900">
                        <span className="text-yellow-500 font-bold mr-1">★</span> 
                        {detailVoucher.pointsRequired} điểm
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">Đã đổi</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {detailVoucher.redeemedCount} lượt
                      </p>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 col-span-2 flex justify-between items-center">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Ngày hết hạn</p>
                        <p className="text-sm font-semibold text-red-600">
                          {detailVoucher.expiryDate ? String(detailVoucher.expiryDate).substring(0, 10) : "Vô thời hạn"}
                        </p>
                      </div>
                      {/* Badge trạng thái đặt cạnh nút đóng (nút đóng đã có ở góc dialog) */}
                      <span className={`px-3 py-1 rounded-full text-xs font-bold shadow ${detailVoucher.status === 'ACTIVE' || detailVoucher.status === 'ĐANG BẬT' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                        {detailVoucher.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center flex flex-col items-center">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 text-sm font-medium">Đang tải dữ liệu...</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isHistoryDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent
          className="max-w-none p-0"
          style={{
            width: "92vw",
            maxWidth: 960,
            maxHeight: "86vh",
            overflow: "auto",
          }}
        >
          <div className="p-6 space-y-4">
            <DialogHeader>
              <DialogTitle>Toàn bộ lịch sử thao tác voucher</DialogTitle>
              <DialogDescription>
                Tổng số lịch sử: {voucherHistoryRows.length}
              </DialogDescription>
            </DialogHeader>

            {!voucherHistoryRows.length ? (
              <div className="text-sm text-muted-foreground">
                Chưa có lịch sử thao tác voucher nào.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thời điểm</TableHead>
                    <TableHead>Hành động</TableHead>
                    <TableHead>Voucher</TableHead>
                    <TableHead>Mã voucher</TableHead>
                    <TableHead>Ghi chú</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {voucherHistoryRows.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.createdAtText || item.createdAt || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getHistoryActionBadgeClass(item.action)}
                        >
                          {item.actionLabel || item.action || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.voucherName || "-"}
                      </TableCell>
                      <TableCell>{item.voucherCode || "-"}</TableCell>
                      <TableCell>{item.detail || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dialogs ── */}
      <VoucherFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditTarget(null);
        }}
        onSave={handleSave}
        initial={editTarget}
      />

      <DeleteDialog
        voucher={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

