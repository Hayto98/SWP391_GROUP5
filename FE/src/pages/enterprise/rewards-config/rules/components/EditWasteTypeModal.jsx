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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function EditWasteTypeModal({
  open,
  onClose,
  onConfirm,
  adding,
  wasteItem,
}) {
  const [wasteTypeName, setWasteTypeName] = useState(wasteItem?.name || "");
  const [unitType, setUnitType] = useState(wasteItem?.unitType || "KG");
  const [points, setPoints] = useState(wasteItem?.factor || 0);
  const [variance, setVariance] = useState(
    wasteItem?.allowed_variance_percent ||
      wasteItem?.allowedVariancePercent ||
      0,
  );
  const [desc, setDesc] = useState(wasteItem?.description || "");
  const [minKg, setMinKg] = useState(wasteItem?.minKgRequired || 0);
  const [maxKg, setMaxKg] = useState(wasteItem?.maxKgRequired || 0);
  const [penalty, setPenalty] = useState(wasteItem?.penaltyPercent || 0);
  const [localErr, setLocalErr] = useState("");

  useEffect(() => {
    if (!open || !wasteItem) return;

    setWasteTypeName(wasteItem.name || "");
    setUnitType(wasteItem.unitType || "KG");
    setPoints(wasteItem.factor || 0);
    setVariance(wasteItem.allowed_variance_percent || 0);
    setDesc(wasteItem.description || "");
    setLocalErr("");
  }, [open, wasteItem]);

  const handleSubmit = async () => {
    if (!wasteTypeName.trim()) {
      setLocalErr("Vui lòng nhập tên loại rác");
      return;
    }

    if (Number(points) <= 0) {
      setLocalErr("Hệ số điểm phải lớn hơn 0");
      return;
    }

    if (Number(variance) < 0) {
      setLocalErr("Tỷ lệ sai số không được âm");
      return;
    }

    if (!unitType.trim()) {
      setLocalErr("Vui lòng nhập đơn vị tính");
      return;
    }

    setLocalErr("");
    const res = await onConfirm({
      wasteTypeId: wasteItem.wasteTypeId || wasteItem.id,
      rewardConfigId: wasteItem.rewardConfigId,
      pointsPerUnit: Number(points),
      allowedVariancePercent: Number(variance),
      minKgRequired: Number(minKg),
      maxKgRequired: Number(maxKg),
      penaltyPercent: Number(penalty),
      description: desc,
      waste_type_name: wasteTypeName.trim(),
      unit_type: unitType.trim(),
    });

    if (res?.ok) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {wasteItem?.rewardConfigId
              ? `Sửa: ${wasteItem?.name}`
              : `Thêm reward config: ${wasteItem?.name}`}
          </DialogTitle>
          <DialogDescription>
            Cập nhật thông tin loại rác và quy tắc tính điểm.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-waste-name">Tên loại rác</Label>
            <Input
              id="edit-waste-name"
              value={wasteTypeName}
              onChange={(e) => {
                setWasteTypeName(e.target.value);
                setLocalErr("");
              }}
              disabled={adding}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-waste-unit">Đơn vị tính</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "KG", label: "Kilogram" },
                { value: "CHAI", label: "Chai" },
                { value: "LON", label: "Lon" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={adding}
                  onClick={() => {
                    setUnitType(opt.value);
                    setLocalErr("");
                  }}
                  className={[
                    "flex flex-col items-center justify-center gap-1 rounded-lg border-2 px-3 py-3 text-sm font-medium transition-all",
                    unitType === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-muted bg-muted/30 text-muted-foreground hover:border-primary/50 hover:bg-primary/5",
                    adding ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                  ].join(" ")}
                >
                  <span className="text-sm font-semibold">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-waste-points">Hệ số điểm</Label>
            <Input
              id="edit-waste-points"
              type="number"
              min={0}
              value={points}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "") {
                  setPoints("");
                  setLocalErr("");
                  return;
                }

                const parsed = Number(value);
                if (Number.isNaN(parsed) || parsed < 0) return;

                setPoints(value);
                setLocalErr("");
              }}
              disabled={adding}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-waste-variance">
              Tỷ lệ sai số cho phép (%)
            </Label>
            <Input
              id="edit-waste-variance"
              type="number"
              min={0}
              value={variance}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "") {
                  setVariance("");
                  setLocalErr("");
                  return;
                }

                const parsed = Number(value);
                if (Number.isNaN(parsed) || parsed < 0) return;

                setVariance(value);
                setLocalErr("");
              }}
              disabled={adding}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-waste-minkg">Số kg tối thiểu áp dụng</Label>
            <Input
              id="edit-waste-minkg"
              type="number"
              min={0}
              value={minKg}
              onChange={(e) => setMinKg(e.target.value)}
              disabled={adding}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-waste-maxkg">Số kg tối đa áp dụng</Label>
            <Input
              id="edit-waste-maxkg"
              type="number"
              min={0}
              value={maxKg}
              onChange={(e) => setMaxKg(e.target.value)}
              disabled={adding}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-waste-penalty">Phần trăm phạt (%)</Label>
            <Input
              id="edit-waste-penalty"
              type="number"
              min={0}
              value={penalty}
              onChange={(e) => setPenalty(e.target.value)}
              disabled={adding}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-waste-desc">Mô tả quy tắc (Tùy chọn)</Label>
            <Input
              id="edit-waste-desc"
              value={desc}
              onChange={(e) => {
                setDesc(e.target.value);
                setLocalErr("");
              }}
              disabled={adding}
            />
          </div>

          {localErr && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {localErr}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={adding}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={adding || !wasteTypeName.trim()}
          >
            {adding ? "Đang lưu..." : "Cập nhật"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
