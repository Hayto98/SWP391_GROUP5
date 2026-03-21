import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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

export default function EditWasteTypeDirectModal({
  open,
  onClose,
  wasteTypes,
  onUpdated,
}) {
  const [selectedId, setSelectedId] = useState("");
  const [wasteTypeName, setWasteTypeName] = useState("");
  const [unitType, setUnitType] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleSelect = (id) => {
    setSelectedId(id);
    setErr("");
    const found = wasteTypes.find(
      (w) => String(w.wasteTypeId || w.id) === String(id),
    );
    if (found) {
      setWasteTypeName(found.wasteTypeName || found.name || "");
      setUnitType(found.unitType || "");
    }
  };

  useEffect(() => {
    if (!open) {
      setSelectedId("");
      setWasteTypeName("");
      setUnitType("");
      setErr("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!selectedId) {
      setErr("Vui lòng chọn loại rác cần sửa");
      return;
    }
    if (!wasteTypeName.trim()) {
      setErr("Vui lòng nhập tên loại rác");
      return;
    }
    if (!unitType.trim()) {
      setErr("Vui lòng nhập đơn vị tính");
      return;
    }

    setSaving(true);
    setErr("");
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(
        `http://localhost:3000/enterprise/waste-types/${selectedId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            wasteTypeName: wasteTypeName.trim(),
            unitType: unitType.trim().toUpperCase(),
          }),
        },
      );

      if (res.ok) {
        toast.success("Cập nhật loại rác thành công!");
        if (onUpdated) {
          await onUpdated();
        }
        onClose();
      } else {
        const body = await res.json().catch(() => ({}));
        setErr(body?.message || "Cập nhật thất bại!");
      }
    } catch {
      setErr("Lỗi kết nối API!");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sửa thông tin loại rác</DialogTitle>
          <DialogDescription>
            Chọn loại rác cần sửa, sau đó cập nhật tên và đơn vị.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Chọn loại rác cần sửa</Label>
            <Select
              value={selectedId}
              onValueChange={handleSelect}
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue placeholder="-- Chọn loại rác --" />
              </SelectTrigger>
              <SelectContent>
                {wasteTypes.map((w) => (
                  <SelectItem
                    key={w.wasteTypeId || w.id}
                    value={String(w.wasteTypeId || w.id)}
                  >
                    {w.wasteTypeName || w.name} (ID: {w.wasteTypeId || w.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-direct-name">Tên loại rác</Label>
            <Input
              id="edit-direct-name"
              placeholder="VD: Nhựa HDPE"
              value={wasteTypeName}
              onChange={(e) => {
                setWasteTypeName(e.target.value);
                setErr("");
              }}
              disabled={saving || !selectedId}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-direct-unit">Đơn vị tính</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "KG", label: "Kilogram" },
                { value: "CHAI", label: "Chai" },
                { value: "LON", label: "Lon" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={saving || !selectedId}
                  onClick={() => {
                    setUnitType(opt.value);
                    setErr("");
                  }}
                  className={[
                    "flex flex-col items-center justify-center gap-1 rounded-lg border-2 px-3 py-3 text-sm font-medium transition-all",
                    unitType === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-muted bg-muted/30 text-muted-foreground hover:border-primary/50 hover:bg-primary/5",
                    saving || !selectedId
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer",
                  ].join(" ")}
                >
                  <span className="text-sm font-semibold">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {err && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {err}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !selectedId}>
            {saving ? "Đang lưu..." : "Cập nhật"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
