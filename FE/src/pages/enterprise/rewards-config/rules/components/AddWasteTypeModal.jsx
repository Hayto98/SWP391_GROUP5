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

export default function AddWasteTypeModal({
  open,
  onClose,
  onConfirm,
  adding,
}) {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [localErr, setLocalErr] = useState("");

  useEffect(() => {
    if (!open) {
      setName("");
      setUnit("");
      setLocalErr("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setLocalErr("Vui lòng nhập tên loại rác");
      return;
    }

    if (!unit.trim()) {
      setLocalErr("Vui lòng nhập đơn vị tính");
      return;
    }

    setLocalErr("");
    const res = await onConfirm({
      wasteTypeName: name.trim(),
      unitType: unit.trim().toUpperCase(),
    });

    if (res?.ok) {
      setName("");
      setUnit("");
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm loại rác mới</DialogTitle>
          <DialogDescription>
            Nhập tên loại rác và đơn vị tính để tạo mới.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="add-waste-name">Tên loại rác</Label>
            <Input
              id="add-waste-name"
              placeholder="VD: Nhựa HDPE, Cao su..."
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setLocalErr("");
              }}
              disabled={adding}
            />
          </div>

          <div className="space-y-2">
            <Label>Đơn vị tính</Label>
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
                    setUnit(opt.value);
                    setLocalErr("");
                  }}
                  className={[
                    "flex flex-col items-center justify-center gap-1 rounded-lg border-2 px-3 py-3 text-sm font-medium transition-all",
                    unit === opt.value
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
            disabled={adding || !name.trim() || !unit.trim()}
          >
            {adding ? "Đang thêm..." : "Thêm loại rác"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
