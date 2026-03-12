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
import { useState } from "react";
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

// TODO: API 
const INITIAL_VOUCHERS = [
  {
    voucher_id: "1",
    voucher_name: "Phúc Long - Giảm 30K",
    voucher_code: "PHUCLONG30K",
    points_required: 500,
    terms_description: "Áp dụng cho đơn hàng từ 100.000đ tại tất cả chi nhánh Phúc Long.",
    expiry_date: "31/03/2026",
    category: "discount",
    source: "partner",
    image: "https://cdn.haitrieu.com/wp-content/uploads/2022/01/Logo-Phuc-Long-PL.png",
    is_active: true,
    total_redeemed: 128,
  },
  {
    voucher_id: "2",
    voucher_name: "Tặng cây xanh cho môi trường",
    voucher_code: "GREENTREE",
    points_required: 1500,
    terms_description: "Chúng tôi sẽ trồng 1 cây xanh nhân danh bạn.",
    expiry_date: "31/12/2026",
    category: "environment",
    source: "partner",
    is_active: false,
    total_redeemed: 45,
  }
];

const EMPTY_FORM = {
  voucher_name: "",
  voucher_code: "",
  points_required: "",
  terms_description: "",
  expiry_date: "",
  image: "",
  category: "discount",
  source: "enterprise",
  is_active: true,
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
  const [form, setForm] = useState(initial || EMPTY_FORM);

  // Sync when initial changes (edit mode)
  const handleOpen = (isOpen) => {
    if (isOpen) setForm(initial || EMPTY_FORM);
    else onClose();
  };

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = () => {
    if (!form.voucher_name.trim()) return toast.error("Nhập tên voucher!");
    if (!form.voucher_code.trim()) return toast.error("Nhập mã voucher!");
    if (!form.points_required || Number(form.points_required) <= 0)
      return toast.error("Điểm quy đổi phải lớn hơn 0!");
    if (!form.expiry_date.trim()) return toast.error("Nhập ngày hết hạn!");
    onSave({ ...form, points_required: Number(form.points_required) });
  };

  const isEdit = !!initial?.voucher_id;

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
          {/* Tên */}
          <div className="space-y-1.5">
            <Label htmlFor="vf-name">Tên voucher *</Label>
            <Input
              id="vf-name"
              placeholder="VD: Giảm 50k đơn từ 200k"
              value={form.voucher_name}
              onChange={(e) => set("voucher_name", e.target.value)}
            />
          </div>

          {/* Mã & Điểm */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="vf-code">Mã voucher *</Label>
              <Input
                id="vf-code"
                placeholder="VD: SAVE50K"
                value={form.voucher_code}
                onChange={(e) =>
                  set("voucher_code", e.target.value.toUpperCase())
                }
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vf-pts">Điểm quy đổi *</Label>
              <Input
                id="vf-pts"
                type="number"
                min={1}
                placeholder="VD: 500"
                value={form.points_required}
                onChange={(e) => set("points_required", e.target.value)}
              />
            </div>
          </div>

          {/* Danh mục & Nguồn */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Danh mục</Label>
              <Select
                value={form.category}
                onValueChange={(v) => set("category", v)}
              >
                <SelectTrigger id="vf-cat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Nguồn Voucher</Label>
              <Select
                value={form.source}
                onValueChange={(v) => set("source", v)}
              >
                <SelectTrigger id="vf-src">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Ngày hết hạn */}
          <div className="space-y-1.5">
            <Label htmlFor="vf-exp">Ngày hết hạn *</Label>
            <Input
              id="vf-exp"
              placeholder="VD: 31/12/2026"
              value={form.expiry_date}
              onChange={(e) => set("expiry_date", e.target.value)}
            />
          </div>

          {/* Mô tả */}
          <div className="space-y-1.5">
            <Label htmlFor="vf-desc">Điều kiện / Mô tả</Label>
            <Textarea
              id="vf-desc"
              placeholder="Nhập điều kiện sử dụng voucher..."
              value={form.terms_description}
              onChange={(e) => set("terms_description", e.target.value)}
              rows={3}
            />
          </div>

          {/* Ảnh */}
          <div className="space-y-1.5">
            <Label htmlFor="vf-img">URL ảnh (tùy chọn)</Label>
            <Input
              id="vf-img"
              placeholder="https://..."
              value={form.image}
              onChange={(e) => set("image", e.target.value)}
            />
          </div>

          {/* Trạng thái */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Kích hoạt ngay</p>
              <p className="text-xs text-muted-foreground">
                Citizen sẽ thấy voucher này khi được bật
              </p>
            </div>
            <Switch
              id="vf-active"
              checked={form.is_active}
              onCheckedChange={(v) => set("is_active", v)}
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
  const [vouchers, setVouchers] = useState(INITIAL_VOUCHERS);
  const [filterSource, setFilterSource] = useState("all");
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ── Derived stats ──
  const totalActive = vouchers.filter((v) => v.is_active).length;
  const totalRedeemed = vouchers.reduce((s, v) => s + (v.total_redeemed || 0), 0);
  const avgPoints = vouchers.length
    ? Math.round(
        vouchers.reduce((s, v) => s + v.points_required, 0) / vouchers.length,
      )
    : 0;

  // ── Filtered list ──
  const filtered = vouchers.filter((v) => {
    const matchSource = filterSource === "all" || v.source === filterSource;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      v.voucher_name.toLowerCase().includes(q) ||
      v.voucher_code.toLowerCase().includes(q);
    return matchSource && matchSearch;
  });

  // ── Handlers ──
  const handleSave = (data) => {
    if (editTarget) {
      setVouchers((prev) =>
        prev.map((v) =>
          v.voucher_id === editTarget.voucher_id ? { ...v, ...data } : v,
        ),
      );
      toast.success("Đã cập nhật voucher thành công!");
    } else {
      const newV = {
        ...data,
        voucher_id: String(Date.now()),
        total_redeemed: 0,
      };
      setVouchers((prev) => [newV, ...prev]);
      toast.success("Đã tạo voucher mới thành công!");
    }
    setFormOpen(false);
    setEditTarget(null);
  };

  const handleEdit = (v) => {
    setEditTarget(v);
    setFormOpen(true);
  };

  const handleDelete = (v) => {
    setVouchers((prev) => prev.filter((x) => x.voucher_id !== v.voucher_id));
    setDeleteTarget(null);
    toast.success(`Đã xóa voucher "${v.voucher_name}"`);
  };

  const handleToggle = (v) => {
    setVouchers((prev) =>
      prev.map((x) =>
        x.voucher_id === v.voucher_id ? { ...x, is_active: !x.is_active } : x,
      ),
    );
    toast.success(
      `Voucher "${v.voucher_name}" ${v.is_active ? "đã tắt" : "đã bật"}.`,
    );
  };

  const openCreate = () => {
    setEditTarget(null);
    setFormOpen(true);
  };  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <h1 className="text-2xl text-gray-800">Kho Voucher</h1>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700 bg-white shadow-sm flex items-center gap-2 px-6">
            <History className="size-4" /> Lịch sử
          </Button>
          <Button onClick={openCreate} variant="outline" className="border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700 bg-white shadow-sm flex items-center gap-2 px-6">
            <Plus className="size-4" /> Thêm mới
          </Button>
        </div>
      </div>

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
          <Button className="rounded-none px-8 font-medium">
            Tìm kiếm
          </Button>
        </div>
      </div>

      {/* ── Tabs (Shopee style) ── */}
      <div className="border-b border-gray-200 flex items-center overflow-x-auto text-base">
        <button
          onClick={() => setFilterSource("all")}
          className={`flex-shrink-0 px-6 py-4 border-b-2 font-medium transition-colors ${
            filterSource === "all" ? "border-primary text-primary" : "border-transparent text-gray-600 hover:text-primary"
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
                className={`flex-shrink-0 px-6 py-4 border-b-2 font-medium transition-colors ${
                  filterSource === s.value ? "border-primary text-primary" : "border-transparent text-gray-600 hover:text-primary"
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
              key={v.voucher_id} 
              className={`relative flex h-32 bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden group ${!v.is_active ? "opacity-60" : ""}`}
            >
              {/* Left Image / Branding */}
              <div className="w-[118px] flex-shrink-0 bg-primary flex flex-col items-center justify-center relative overflow-hidden border-r border-dashed border-gray-200 box-border p-2">
                <Gift className="size-8 mb-2 text-white opacity-90 flex-shrink-0" />
                <div className="text-[10px] text-white font-medium text-center uppercase leading-snug line-clamp-2" style={{ textTransform: "initial" }}>
                  {v.voucher_name}
                </div>
              </div>

              {/* Right Content */}
              <div className="flex-1 p-3 flex flex-col justify-between relative pl-4">
                {/* Active status indicator */}
                {v.is_active ? (
                  <div className="absolute top-3 right-3 text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                    ĐANG BẬT
                  </div>
                ) : (
                  <div className="absolute top-3 right-3 text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                    ĐÃ TẮT
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-gray-800 pr-16 line-clamp-1">{v.voucher_name}</h3>
                  <div className="text-xs text-gray-500 mt-1 line-clamp-1">{v.terms_description || `Áp dụng toàn bộ dịch vụ`}</div>
                  
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="text-[10px] px-1.5 py-0.5 border border-red-500 text-red-500 rounded-sm leading-none whitespace-nowrap">
                      HSD: {v.expiry_date}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-sm font-medium whitespace-nowrap flex items-center gap-1">
                      <Star className="size-3 fill-amber-500 text-amber-500" /> {v.points_required} đ
                    </span>
                  </div>
                </div>

                {/* Bottom Actions Overlay */}
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  <Switch
                    checked={v.is_active}
                    onCheckedChange={() => handleToggle(v)}
                    className="scale-75 origin-right"
                    title="Bật / Tắt"
                  />
                  <div className="w-px h-5 bg-gray-200 mx-1"></div>
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
      </div>

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
