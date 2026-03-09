import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  XCircle,
} from "lucide-react";
import { useRewardSlaRules } from "../../../../hooks/useRewardSlaRules";

function AddWasteTypeDialog({ open, onOpenChange, onConfirm, adding }) {
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
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm loại rác mới</DialogTitle>
          <DialogDescription>
            Tạo loại rác mới để đưa vào cấu hình điểm thưởng.
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
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="add-unit-type">Đơn vị tính</Label>
            <Input
              id="add-unit-type"
              placeholder="VD: KG hoặc LON"
              value={unit}
              onChange={(e) => {
                setUnit(e.target.value);
                setLocalErr("");
              }}
              disabled={adding}
            />
          </div>

          {localErr && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {localErr}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={adding}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={adding || !name.trim() || !unit.trim()}>
            {adding ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Đang thêm...
              </>
            ) : (
              <>
                <Plus className="size-4" />
                Thêm loại rác
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditWasteTypeDialog({ open, onOpenChange, onConfirm, adding, wasteItem }) {
  const [wasteTypeName, setWasteTypeName] = useState("");
  const [unitType, setUnitType] = useState("KG");
  const [points, setPoints] = useState(0);
  const [variance, setVariance] = useState(0);
  const [desc, setDesc] = useState("");
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
      allowed_variance_percent: Number(variance),
      description: desc,
      waste_type_name: wasteTypeName.trim(),
      unit_type: unitType.trim(),
    });

    if (res?.ok) {
      onOpenChange(false);
    }
  };

  const title = wasteItem?.rewardConfigId
    ? `Sửa cấu hình: ${wasteItem?.name || ""}`
    : `Thêm reward config: ${wasteItem?.name || ""}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Cập nhật tên loại rác, đơn vị tính và hệ số điểm thưởng.
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
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-unit-type">Đơn vị tính</Label>
            <Input
              id="edit-unit-type"
              value={unitType}
              onChange={(e) => {
                setUnitType(e.target.value);
                setLocalErr("");
              }}
              disabled={adding}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-points">Hệ số điểm ({unitType || "đơn vị"})</Label>
              <Input
                id="edit-points"
                type="number"
                value={points}
                onChange={(e) => {
                  setPoints(e.target.value);
                  setLocalErr("");
                }}
                disabled={adding}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-variance">Sai số cho phép (%)</Label>
              <Input
                id="edit-variance"
                type="number"
                value={variance}
                onChange={(e) => {
                  setVariance(e.target.value);
                  setLocalErr("");
                }}
                disabled={adding}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Mô tả quy tắc</Label>
            <Input
              id="edit-description"
              placeholder="VD: 20 điểm mỗi kg"
              value={desc}
              onChange={(e) => {
                setDesc(e.target.value);
                setLocalErr("");
              }}
              disabled={adding}
            />
          </div>

          {localErr && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {localErr}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={adding}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={adding || !wasteTypeName.trim()}>
            {adding ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="size-4" />
                Cập nhật
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function QualityIcon({ tone }) {
  if (tone === "ok") return <CheckCircle2 className="size-4 text-emerald-600" />;
  if (tone === "warn") return <AlertTriangle className="size-4 text-amber-600" />;
  return <XCircle className="size-4 text-red-600" />;
}

export default function RewardSlaRules() {
  const [isAddOpen, setAddOpen] = useState(false);
  const [wasteToDelete, setWasteToDelete] = useState(null);
  const [wasteToEdit, setWasteToEdit] = useState(null);

  const {
    draft,
    loading,
    saving,
    adding,
    error,
    dirty,
    save,
    reset,
    updateWasteFactor,
    addWasteType,
    removeWasteType,
    editWasteType,
  } = useRewardSlaRules();

  const operationBusy = adding || saving;

  const footerMeta = useMemo(
    () => [
      `PHIÊN BẢN: ${draft?.version || "-"}`,
      "HỆ THỐNG ĐANG HOẠT ĐỘNG",
      `CẬP NHẬT CUỐI: ${draft?.updatedAt || "-"}`,
    ],
    [draft?.updatedAt, draft?.version],
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="flex h-24 items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Đang tải...
        </CardContent>
      </Card>
    );
  }

  if (!draft) return null;

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-lg lg:text-2xl font-bold tracking-tight">
          Cấu hình Quy tắc Điểm thưởng và SLA
        </h1>
        <p className="text-green-600 text-sm mt-1">
          Thiết lập hệ số điểm, sai số cho phép và quy tắc xử lý khối lượng lớn.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle className="text-base">Hệ số điểm thưởng theo loại rác</CardTitle>
            <CardDescription>
              Cập nhật hệ số điểm và metadata cho từng loại rác đang hoạt động.
            </CardDescription>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setAddOpen(true)} disabled={operationBusy}>
              <Plus className="size-4" />
              Thêm loại rác
            </Button>

            <Button variant="outline" onClick={reset} disabled={!dirty || operationBusy}>
              Hoàn tác
            </Button>

            <Button onClick={save} disabled={!dirty || operationBusy}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Lưu thay đổi
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Loại rác</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead>Hệ số điểm</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {draft.pointsByWaste.map((w) => (
                <TableRow key={w.id}>
                  <TableCell>
                    <p className="font-semibold">{w.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{w.unitType || "-"}</p>
                  </TableCell>

                  <TableCell>
                    <p className="text-sm text-slate-700">{w.desc}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sai số cho phép: {w.allowed_variance_percent || 0}%
                    </p>
                    {w.description && (
                      <p className="text-xs text-muted-foreground mt-1">Mô tả: {w.description}</p>
                    )}
                  </TableCell>

                  <TableCell>
                    <Input
                      className="h-8 w-24 text-right"
                      value={w.factor}
                      onChange={(e) => updateWasteFactor(w.id, Number(e.target.value || 0))}
                      type="number"
                      step="0.1"
                      disabled={!w.rewardConfigId}
                    />
                  </TableCell>

                  <TableCell>
                    {w.rewardConfigId ? (
                      <Badge
                        variant="outline"
                        className="border-emerald-200 bg-emerald-50 text-emerald-700"
                      >
                        Đã cấu hình
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-amber-200 bg-amber-50 text-amber-700"
                      >
                        Chưa có reward config
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon-sm"
                        className="size-8"
                        onClick={() => setWasteToEdit(w)}
                        title={
                          w.rewardConfigId ? "Sửa loại rác" : "Thêm reward config"
                        }
                        disabled={operationBusy}
                      >
                        {w.rewardConfigId ? (
                          <Pencil className="size-4" />
                        ) : (
                          <Plus className="size-4" />
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        size="icon-sm"
                        className="size-8 border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => setWasteToDelete(w)}
                        title="Xóa loại rác"
                        disabled={operationBusy}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quy tắc chất lượng và SLA</CardTitle>
          <CardDescription>
            Theo dõi các rule đang áp dụng cho hệ thống điểm thưởng.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            {draft.qualityRules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between rounded-lg border px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <QualityIcon tone={rule.tone} />
                  <div>
                    <p className="text-sm font-semibold">{rule.label}</p>
                    <p className="text-xs text-muted-foreground">{rule.note}</p>
                  </div>
                </div>
                <Badge variant="outline">x{rule.multiplier}</Badge>
              </div>
            ))}
          </div>

          <div className="space-y-2 rounded-lg border bg-slate-50 p-3">
            <p className="text-sm font-semibold">SLA khối lượng lớn</p>
            <p className="text-xs text-muted-foreground">
              Ngưỡng áp dụng: {draft.slaLargeWeight.thresholdKg} kg
            </p>
            <p className="text-xs text-muted-foreground">
              Hệ số thưởng thêm: x{draft.slaLargeWeight.extraRewardMultiplier}
            </p>
            <p className="text-xs text-muted-foreground">
              SLA xử lý: {draft.slaLargeWeight.slaHours} giờ
            </p>
            <p className="text-xs text-muted-foreground">
              Tự động thông báo quá hạn: {draft.slaLargeWeight.autoNotifyExpired ? "Có" : "Không"}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3 text-xs font-semibold text-muted-foreground">
        {footerMeta.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>

      <AddWasteTypeDialog
        open={isAddOpen}
        onOpenChange={setAddOpen}
        onConfirm={addWasteType}
        adding={adding}
      />

      <EditWasteTypeDialog
        open={!!wasteToEdit}
        onOpenChange={(open) => !open && setWasteToEdit(null)}
        onConfirm={editWasteType}
        adding={adding}
        wasteItem={wasteToEdit}
      />

      <Dialog
        open={!!wasteToDelete}
        onOpenChange={(open) => !open && setWasteToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa loại rác</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa loại rác "<strong>{wasteToDelete?.name}</strong>"?
              Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setWasteToDelete(null)}
              disabled={operationBusy}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              disabled={operationBusy}
              onClick={async () => {
                const res = await removeWasteType(wasteToDelete.id);
                if (res?.ok) setWasteToDelete(null);
              }}
            >
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
