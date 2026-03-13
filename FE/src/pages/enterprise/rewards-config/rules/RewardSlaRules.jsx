import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRewardSlaRules } from "../../../../hooks/useRewardSlaRules";

function AddWasteTypeModal({ open, onClose, onConfirm, adding }) {
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
            <Label htmlFor="add-waste-unit">Đơn vị tính</Label>
            <Input
              id="add-waste-unit"
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

function EditWasteTypeModal({ open, onClose, onConfirm, adding, wasteItem }) {
  const [wasteTypeName, setWasteTypeName] = useState(wasteItem?.name || "");
  const [unitType, setUnitType] = useState(wasteItem?.unitType || "KG");
  const [points, setPoints] = useState(wasteItem?.factor || 0);
  const [variance, setVariance] = useState(
    wasteItem?.allowed_variance_percent || 0,
  );
  const [desc, setDesc] = useState(wasteItem?.description || "");
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
            <Input
              id="edit-waste-unit"
              value={unitType}
              onChange={(e) => {
                setUnitType(e.target.value);
                setLocalErr("");
              }}
              disabled={adding}
            />
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

export default function RewardSlaRules() {
  const [showAddModal, setShowAddModal] = useState(false);
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
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between gap-4 py-4">
          <div>
            <CardTitle className="text-primary text-lg">Cấu hình Quy tắc Điểm thưởng</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Thiết lập hệ số điểm cho các loại rác và quy tắc xử lý cho khối
              lượng lớn.
            </p>
          </div>
          <Button
            onClick={() => setShowAddModal(true)}
            disabled={adding || saving}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm flex items-center gap-2 px-6"
          >
            <Plus className="size-4" /> Thêm loại rác mới
          </Button>
        </CardHeader>
      </Card>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Hệ số điểm thưởng theo loại rác</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Loại rác thải</TableHead>
                <TableHead>Mô tả hệ số</TableHead>
                <TableHead className="text-right">Hệ số điểm</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {draft.pointsByWaste.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="font-medium">{w.name}</TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>{w.desc}</p>
                      <p>Sai số cho phép: {w.allowed_variance_percent || 0}%</p>
                      {w.description && <p>Mô tả: {w.description}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Input
                        className="w-24 text-right"
                        value={w.factor}
                        type="number"
                        step="0.1"
                        min={0}
                        readOnly
                        disabled={!w.rewardConfigId}
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => setWasteToEdit(w)}
                        title={
                          w.rewardConfigId
                            ? "Sửa loại rác"
                            : "Thêm reward config"
                        }
                      >
                        {w.rewardConfigId ? (
                          <Pencil className="size-4" />
                        ) : (
                          <Plus className="size-4 text-green-600" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => setWasteToDelete(w)}
                        title="Xóa loại rác"
                      >
                        <Trash2 className="size-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        {footerMeta.map((meta) => (
          <Badge key={meta} variant="outline">
            {meta}
          </Badge>
        ))}
      </div>

      <AddWasteTypeModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onConfirm={addWasteType}
        adding={adding}
      />

      {wasteToEdit && (
        <EditWasteTypeModal
          open={Boolean(wasteToEdit)}
          onClose={() => setWasteToEdit(null)}
          onConfirm={editWasteType}
          adding={adding}
          wasteItem={wasteToEdit}
        />
      )}

      <Dialog
        open={!!wasteToDelete}
        onOpenChange={(open) => !open && setWasteToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa loại rác</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa loại rác "
              <strong>{wasteToDelete?.name}</strong>"? Hành động này không thể
              hoàn tác.
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
