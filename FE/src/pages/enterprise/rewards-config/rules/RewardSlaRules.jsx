import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

// Hàm fetch wasteType theo ID
async function fetchWasteTypeById(wasteTypeId) {
  const token = localStorage.getItem("accessToken");
  const res = await fetch(`http://localhost:3000/api/v1/enterprise/waste-types/${wasteTypeId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  if (!res.ok) throw new Error('Không lấy được thông tin loại rác');
  return (await res.json()).data;
}
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Info, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
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
            <Label>Đơn vị tính</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "KG", label: "Kilogram", sub: "KG" },
                { value: "CHAI", label: "Chai", sub: "CHAI" },
                { value: "LON", label: "Lon", sub: "LON" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={adding}
                  onClick={() => { setUnit(opt.value); setLocalErr(""); }}
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

function EditWasteTypeModal({ open, onClose, onConfirm, adding, wasteItem }) {
  const [wasteTypeName, setWasteTypeName] = useState(wasteItem?.name || "");
  const [unitType, setUnitType] = useState(wasteItem?.unitType || "KG");
  const [points, setPoints] = useState(wasteItem?.factor || 0);
  const [variance, setVariance] = useState(wasteItem?.allowed_variance_percent || wasteItem?.allowedVariancePercent || 0);
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

// Modal chỉnh sửa thông tin loại rác (wasteType) qua API PUT /enterprise/waste-types/:id
function EditWasteTypeDirectModal({ open, onClose, wasteTypes }) {
  const [selectedId, setSelectedId] = useState("");
  const [wasteTypeName, setWasteTypeName] = useState("");
  const [unitType, setUnitType] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");

  // Khi chọn loại rác, tự điền form với thông tin hiện tại
  const handleSelect = (id) => {
    setSelectedId(id);
    setErr("");
    setSuccess("");
    const found = wasteTypes.find((w) => String(w.wasteTypeId || w.id) === String(id));
    if (found) {
      setWasteTypeName(found.wasteTypeName || found.name || "");
      setUnitType(found.unitType || "");
    }
  };

  // Reset khi đóng
  useEffect(() => {
    if (!open) {
      setSelectedId("");
      setWasteTypeName("");
      setUnitType("");
      setErr("");
      setSuccess("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!selectedId) { setErr("Vui lòng chọn loại rác cần sửa"); return; }
    if (!wasteTypeName.trim()) { setErr("Vui lòng nhập tên loại rác"); return; }
    if (!unitType.trim()) { setErr("Vui lòng nhập đơn vị tính"); return; }

    setSaving(true);
    setErr("");
    setSuccess("");
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`http://localhost:3000/enterprise/waste-types/${selectedId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          wasteTypeName: wasteTypeName.trim(),
          unitType: unitType.trim().toUpperCase(),
        }),
      });
      if (res.ok) {
        setSuccess("Cập nhật loại rác thành công!");
        setTimeout(() => { onClose(); }, 1000);
      } else {
        const body = await res.json().catch(() => ({}));
        setErr(body?.message || "Cập nhật thất bại!");
      }
    } catch (e) {
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
          {/* Dropdown chọn loại rác */}
          <div className="space-y-2">
            <Label>Chọn loại rác cần sửa</Label>
            <Select value={selectedId} onValueChange={handleSelect} disabled={saving}>
              <SelectTrigger>
                <SelectValue placeholder="-- Chọn loại rác --" />
              </SelectTrigger>
              <SelectContent>
                {wasteTypes.map((w) => (
                  <SelectItem key={w.wasteTypeId || w.id} value={String(w.wasteTypeId || w.id)}>
                    {w.wasteTypeName || w.name} (ID: {w.wasteTypeId || w.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tên loại rác */}
          <div className="space-y-2">
            <Label htmlFor="edit-direct-name">Tên loại rác</Label>
            <Input
              id="edit-direct-name"
              placeholder="VD: Nhựa HDPE"
              value={wasteTypeName}
              onChange={(e) => { setWasteTypeName(e.target.value); setErr(""); }}
              disabled={saving || !selectedId}
            />
          </div>

          {/* Đơn vị tính */}
          <div className="space-y-2">
            <Label htmlFor="edit-direct-unit">Đơn vị tính</Label>
            <Input
              id="edit-direct-unit"
              placeholder="VD: KG hoặc LON"
              value={unitType}
              onChange={(e) => { setUnitType(e.target.value); setErr(""); }}
              disabled={saving || !selectedId}
            />
          </div>

          {err && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {err}
            </div>
          )}
          {success && (
            <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {success}
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

export default function RewardSlaRules() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditWasteDirectModal, setShowEditWasteDirectModal] = useState(false);
  const [wasteToDelete, setWasteToDelete] = useState(null);
  const [wasteToEdit, setWasteToEdit] = useState(null);
  const [editRewardDialog, setEditRewardDialog] = useState(false);
  const [editRewardPayload, setEditRewardPayload] = useState({
    pointsPerUnit: '',
    description: '',
    allowedVariancePercent: '',
    penaltyPercent: '',
    minKgRequired: '',
    maxKgRequired: ''
  });
  const [editRewardErr, setEditRewardErr] = useState('');
  const [editRewardFocused, setEditRewardFocused] = useState('');

  // State cho dialog thêm reward-config
  // Dialog thêm reward config cho loại rác chưa có
  const [showRewardDialog, setShowRewardDialog] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [rewardDialogWaste, setRewardDialogWaste] = useState(null);
  const [rewardPayload, setRewardPayload] = useState({
    pointsPerUnit: '',
    description: '',
    allowedVariancePercent: '',
    minKgRequired: '',
    maxKgRequired: '',
    penaltyPercent: ''
  });
  const [rewardErr, setRewardErr] = useState('');
  const [rewardFocused, setRewardFocused] = useState('');

  const REWARD_HINTS = {
    pointsPerUnit: "VD: 5. Mỗi đơn vị rác (theo kg, chai hoặc lon) sẽ nhận số điểm thưởng tương ứng.",
    description: "Mô tả ngắn gọn về quy tắc thưởng này (VD: Thu gom giấy, Nhựa loại 1...).",
    allowedVariancePercent: "Tỷ lệ sai số khối lượng cho phép giữa báo cáo và thực tế (VD: 10%).",
    minKgRequired: "Khối lượng tối thiểu để được nhận điểm thưởng theo quy tắc này.",
    maxKgRequired: "Khối lượng tối đa có thể nhận thưởng (bỏ trống nếu không giới hạn).",
    penaltyPercent: "Tỷ lệ hệ số phạt nếu rác vượt sai số cho phép, sẽ trừ vào tổng điểm."
  };

  // State cho dialog chi tiết wasteType
  const [detailWasteType, setDetailWasteType] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailErr, setDetailErr] = useState("");

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
    editWasteType,
  } = useRewardSlaRules();

  // Xóa loại rác qua API
  async function removeWasteType(wasteTypeId) {
    try {
      const res = await fetch(`http://localhost:3000/api/enterprise/waste-types/${wasteTypeId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        alert('Xóa loại rác thành công!');
        setWasteToDelete(null);
        // Có thể cần reload lại danh sách loại rác ở đây nếu cần
        return { ok: true };
      } else {
        alert('Xóa loại rác thất bại!');
        return { ok: false };
      }
    } catch (e) {
      alert('Lỗi khi gọi API xóa loại rác!');
      return { ok: false };
    }
  }

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
          <div className="flex gap-2">
            <Button
              onClick={() => setShowAddModal(true)}
              disabled={adding || saving}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm flex items-center gap-2 px-6"
            >
              <Plus className="size-4" /> Thêm loại rác mới
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowEditWasteDirectModal(true)}
              disabled={adding || saving}
              className="flex items-center gap-2 px-6"
            >
              <Pencil className="size-4" /> Sửa loại rác
            </Button>

          </div>
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
                  <TableCell className="font-medium">
                    {w.name}
                  </TableCell>
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
                      {/* Button xem chi tiết loại rác */}
                      <Button
                        size="icon"
                        variant="outline"
                        title="Xem chi tiết loại rác"
                        onClick={async () => {
                          setDetailLoading(true);
                          setDetailErr("");
                          setDetailWasteType(null);
                          try {
                            const data = await fetchWasteTypeById(w.wasteTypeId || w.id);
                            setDetailWasteType(data);
                          } catch (e) {
                            setDetailErr(e.message || "Lỗi khi lấy thông tin loại rác");
                          } finally {
                            setDetailLoading(false);
                          }
                        }}
                      >
                        <Eye className="size-4 text-blue-600" />
                      </Button>
                      {/* Button sửa reward config */}
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => {
                          if (w.rewardConfigId) {
                            setWasteToEdit(w);
                            setEditRewardPayload({
                              pointsPerUnit: w.factor || '',
                              description: w.description || '',
                              allowedVariancePercent: w.allowed_variance_percent || '',
                              penaltyPercent: w.penaltyPercent || '',
                              minKgRequired: w.minKgRequired || '',
                              maxKgRequired: w.maxKgRequired || ''
                            });
                            setEditRewardErr('');
                            setEditRewardDialog(true);
                          } else {
                            setRewardDialogWaste(w);
                            setRewardPayload({
                              pointsPerUnit: '',
                              description: '',
                              allowedVariancePercent: '',
                              minKgRequired: '',
                              maxKgRequired: '',
                              penaltyPercent: ''
                            });
                            setRewardErr('');
                            setShowRewardDialog(true);
                          }
                        }}
                        title={w.rewardConfigId ? 'Sửa reward config' : 'Thêm reward config'}
                      >
                        {w.rewardConfigId ? (
                          <Pencil className="size-4 text-green-600" />
                        ) : (
                          <Plus className="size-4 text-green-600" />
                        )}
                      </Button>
                      {/* Button xóa loại rác */}
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

      {/* Dialog xem chi tiết loại rác */}
      <Dialog open={!!detailWasteType || detailLoading || !!detailErr} onOpenChange={v => { if (!v) { setDetailWasteType(null); setDetailErr(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thông tin chi tiết loại rác</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Đang tải...</div>
          ) : detailErr ? (
            <div className="text-red-600 font-semibold text-sm">{detailErr}</div>
          ) : detailWasteType ? (
            <div className="space-y-2">
              <div><b>ID:</b> {detailWasteType.wasteTypeId}</div>
              <div><b>Tên loại rác:</b> {detailWasteType.wasteTypeName}</div>
              <div><b>Đơn vị:</b> {detailWasteType.unitType}</div>
              <div><b>Trạng thái:</b> {detailWasteType.isActive ? "Đang hoạt động" : "Đã tắt"}</div>
              <div><b>Reward Config:</b>
                {detailWasteType.rewardConfig ? (
                  <ul style={{ margin: 0, paddingLeft: 16 }}>
                    <li><b>Điểm mỗi đơn vị:</b> {detailWasteType.rewardConfig.pointsPerUnit}</li>
                    <li><b>Mô tả:</b> {detailWasteType.rewardConfig.description}</li>
                    <li><b>Tỷ lệ sai số (%):</b> {detailWasteType.rewardConfig.allowedVariancePercent}</li>
                    <li><b>Khối lượng tối thiểu:</b> {detailWasteType.rewardConfig.minKgRequired}</li>
                    <li><b>Khối lượng tối đa:</b> {detailWasteType.rewardConfig.maxKgRequired}</li>
                    <li><b>Phần trăm phạt (%):</b> {detailWasteType.rewardConfig.penaltyPercent}</li>
                    <li><b>Trạng thái:</b> {detailWasteType.rewardConfig.isActive ? "Đang hoạt động" : "Đã tắt"}</li>
                  </ul>
                ) : "Chưa cấu hình"}
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDetailWasteType(null); setDetailErr(""); }}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog sửa reward config */}
      <Dialog open={editRewardDialog && !!wasteToEdit} onOpenChange={v => { setEditRewardDialog(v); if (!v) setWasteToEdit(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sửa Điểm Thưởng</DialogTitle>
            <DialogDescription className="flex items-center justify-between border-b pb-2">
              <span>Cập nhật điểm thưởng cho loại rác <b>{wasteToEdit?.name}</b> (ID: {wasteToEdit?.id})</span>
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => setShowGuide(!showGuide)} title="Hướng dẫn tính điểm">
                <Info className="size-4" />
              </Button>
            </DialogDescription>
          </DialogHeader>

          {showGuide && (
            <div className="bg-blue-50/80 text-blue-900 p-3 rounded-lg text-sm space-y-2 mb-2 border border-blue-100">
              <p className="font-semibold text-blue-700">Hướng dẫn chung về cách tính điểm:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><b>Điểm nhận được</b> = <code>Khối lượng &times; Điểm mỗi đơn vị</code>.</li>
                <li>Nếu khối lượng nằm ngoài khoảng <b>Tối thiểu / Tối đa</b>, hệ thống sẽ từ chối tự động duyệt.</li>
                <li><b>Sai số:</b> Nếu khối lượng thu gom thực tế chênh lệch với khai báo trong <b>Tỷ lệ cho phép</b> thì vẫn nhận đủ điểm.</li>
                <li><b>Phạt:</b> Nếu sai số lớn hơn Tỷ lệ cho phép, công dân sẽ bị trừ bớt điểm theo <b>Tỷ lệ phạt</b>.</li>
              </ul>
            </div>
          )}

          <div className="space-y-3">
            {editRewardErr && (
              <div className="mt-1 text-red-600 font-semibold text-sm">{editRewardErr}</div>
            )}
            <div className="space-y-1">
              <Label htmlFor="edit-reward-points">Điểm mỗi đơn vị</Label>
              <Input
                id="edit-reward-points"
                type="number"
                value={editRewardPayload.pointsPerUnit}
                onChange={e => setEditRewardPayload(p => ({ ...p, pointsPerUnit: e.target.value }))}
                onFocus={() => setEditRewardFocused('pointsPerUnit')}
                onBlur={() => setEditRewardFocused('')}
                placeholder="VD: 9"
              />
              {editRewardFocused === 'pointsPerUnit' && <p className="text-[13px] text-red-500 font-medium leading-tight">{REWARD_HINTS.pointsPerUnit}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-reward-desc">Mô tả</Label>
              <Input
                id="edit-reward-desc"
                value={editRewardPayload.description}
                onChange={e => setEditRewardPayload(p => ({ ...p, description: e.target.value }))}
                onFocus={() => setEditRewardFocused('description')}
                onBlur={() => setEditRewardFocused('')}
                placeholder="VD: 100 điểm mỗi kg"
              />
              {editRewardFocused === 'description' && <p className="text-[13px] text-red-500 font-medium leading-tight">{REWARD_HINTS.description}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-reward-variance">Tỷ lệ sai số (%)</Label>
              <Input
                id="edit-reward-variance"
                type="number"
                value={editRewardPayload.allowedVariancePercent}
                onChange={e => setEditRewardPayload(p => ({ ...p, allowedVariancePercent: e.target.value }))}
                onFocus={() => setEditRewardFocused('allowedVariancePercent')}
                onBlur={() => setEditRewardFocused('')}
                placeholder="VD: 8"
              />
              {editRewardFocused === 'allowedVariancePercent' && <p className="text-[13px] text-red-500 font-medium leading-tight">{REWARD_HINTS.allowedVariancePercent}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-reward-minkg">Số kg tối thiểu</Label>
              <Input
                id="edit-reward-minkg"
                type="number"
                value={editRewardPayload.minKgRequired}
                onChange={e => setEditRewardPayload(p => ({ ...p, minKgRequired: e.target.value }))}
                onFocus={() => setEditRewardFocused('minKgRequired')}
                onBlur={() => setEditRewardFocused('')}
                placeholder="VD: 1"
              />
              {editRewardFocused === 'minKgRequired' && <p className="text-[13px] text-red-500 font-medium leading-tight">{REWARD_HINTS.minKgRequired}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-reward-maxkg">Số kg tối đa</Label>
              <Input
                id="edit-reward-maxkg"
                type="number"
                value={editRewardPayload.maxKgRequired}
                onChange={e => setEditRewardPayload(p => ({ ...p, maxKgRequired: e.target.value }))}
                onFocus={() => setEditRewardFocused('maxKgRequired')}
                onBlur={() => setEditRewardFocused('')}
                placeholder="VD: 30"
              />
              {editRewardFocused === 'maxKgRequired' && <p className="text-[13px] text-red-500 font-medium leading-tight">{REWARD_HINTS.maxKgRequired}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-reward-penalty">Phần trăm phạt (%)</Label>
              <Input
                id="edit-reward-penalty"
                type="number"
                value={editRewardPayload.penaltyPercent}
                onChange={e => setEditRewardPayload(p => ({ ...p, penaltyPercent: e.target.value }))}
                onFocus={() => setEditRewardFocused('penaltyPercent')}
                onBlur={() => setEditRewardFocused('')}
                placeholder="VD: 6"
              />
              {editRewardFocused === 'penaltyPercent' && <p className="text-[13px] text-red-500 font-medium leading-tight">{REWARD_HINTS.penaltyPercent}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRewardDialog(false)}>
              Hủy
            </Button>
            <Button
              onClick={async () => {
                setEditRewardErr('');
                if (!editRewardPayload.pointsPerUnit || isNaN(Number(editRewardPayload.pointsPerUnit)) || Number(editRewardPayload.pointsPerUnit) <= 0) {
                  setEditRewardErr('Điểm mỗi đơn vị phải là số > 0!'); return;
                }
                if (editRewardPayload.allowedVariancePercent && (isNaN(Number(editRewardPayload.allowedVariancePercent)) || Number(editRewardPayload.allowedVariancePercent) < 0)) {
                  setEditRewardErr('Tỷ lệ sai số phải là số >= 0!'); return;
                }
                if (editRewardPayload.minKgRequired && (isNaN(Number(editRewardPayload.minKgRequired)) || Number(editRewardPayload.minKgRequired) < 0)) {
                  setEditRewardErr('Số kg tối thiểu phải là số >= 0!'); return;
                }
                if (editRewardPayload.maxKgRequired && (isNaN(Number(editRewardPayload.maxKgRequired)) || Number(editRewardPayload.maxKgRequired) < 0)) {
                  setEditRewardErr('Số kg tối đa phải là số >= 0!'); return;
                }
                if (editRewardPayload.penaltyPercent && (isNaN(Number(editRewardPayload.penaltyPercent)) || Number(editRewardPayload.penaltyPercent) < 0)) {
                  setEditRewardErr('Phần trăm phạt phải là số >= 0!'); return;
                }
                try {
                  const res = await fetch(`http://localhost:3000/enterprise/reward-config/${wasteToEdit.rewardConfigId || wasteToEdit.id}`,
                    {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        pointsPerUnit: Number(editRewardPayload.pointsPerUnit),
                        description: editRewardPayload.description,
                        allowedVariancePercent: editRewardPayload.allowedVariancePercent ? Number(editRewardPayload.allowedVariancePercent) : undefined,
                        penaltyPercent: editRewardPayload.penaltyPercent ? Number(editRewardPayload.penaltyPercent) : undefined,
                        minKgRequired: editRewardPayload.minKgRequired ? Number(editRewardPayload.minKgRequired) : undefined,
                        maxKgRequired: editRewardPayload.maxKgRequired ? Number(editRewardPayload.maxKgRequired) : undefined
                      })
                    });
                  if (res.ok) {
                    alert('Cập nhật reward config thành công!');
                    setEditRewardDialog(false);
                    setWasteToEdit(null);
                  } else {
                    setEditRewardErr('Cập nhật reward config thất bại!');
                  }
                } catch (e) {
                  setEditRewardErr('Lỗi khi gọi API cập nhật reward config!');
                }
              }}
            >
              Cập Nhật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog thêm reward config */}
      <Dialog open={showRewardDialog && !!rewardDialogWaste} onOpenChange={v => { setShowRewardDialog(v); if (!v) setRewardDialogWaste(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm điểm thưởng cho loại rác</DialogTitle>
            <DialogDescription className="flex items-center justify-between border-b pb-2">
              <span>Nhập thông tin điểm thưởng cho loại rác <b>{rewardDialogWaste?.name}</b> (ID: {rewardDialogWaste?.id})</span>
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => setShowGuide(!showGuide)} title="Hướng dẫn tính điểm">
                <Info className="size-4" />
              </Button>
            </DialogDescription>
          </DialogHeader>

          {showGuide && (
            <div className="bg-blue-50/80 text-blue-900 p-3 rounded-lg text-sm space-y-2 mb-2 border border-blue-100">
              <p className="font-semibold text-blue-700">Hướng dẫn chung về cách tính điểm:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><b>Điểm nhận được</b> = <code>Khối lượng &times; Điểm mỗi đơn vị</code>.</li>
                <li>Nếu khối lượng nằm ngoài khoảng <b>Tối thiểu / Tối đa</b>, hệ thống sẽ từ chối tự động duyệt.</li>
                <li><b>Sai số:</b> Nếu khối lượng thu gom thực tế chênh lệch với khai báo trong <b>Tỷ lệ cho phép</b> thì vẫn nhận đủ điểm.</li>
                <li><b>Phạt:</b> Nếu sai số lớn hơn Tỷ lệ cho phép, công dân sẽ bị trừ bớt điểm theo <b>Tỷ lệ phạt</b>.</li>
              </ul>
            </div>
          )}

          <div className="space-y-3">
            {rewardErr && (
              <div className="mt-1 text-red-600 font-semibold text-sm">{rewardErr}</div>
            )}
            <div className="space-y-1">
              <Label htmlFor="reward-points">Điểm mỗi đơn vị</Label>
              <Input
                id="reward-points"
                type="number"
                value={rewardPayload.pointsPerUnit}
                onChange={e => setRewardPayload(p => ({ ...p, pointsPerUnit: e.target.value }))}
                onFocus={() => setRewardFocused('pointsPerUnit')}
                onBlur={() => setRewardFocused('')}
                placeholder="VD: 5"
              />
              {rewardFocused === 'pointsPerUnit' && <p className="text-[13px] text-red-500 font-medium leading-tight">{REWARD_HINTS.pointsPerUnit}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="reward-desc">Mô tả</Label>
              <Input
                id="reward-desc"
                value={rewardPayload.description}
                onChange={e => setRewardPayload(p => ({ ...p, description: e.target.value }))}
                onFocus={() => setRewardFocused('description')}
                onBlur={() => setRewardFocused('')}
                placeholder="VD: 5 điểm mỗi kg"
              />
              {rewardFocused === 'description' && <p className="text-[13px] text-red-500 font-medium leading-tight">{REWARD_HINTS.description}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="reward-variance">Tỷ lệ sai số (%)</Label>
              <Input
                id="reward-variance"
                type="number"
                value={rewardPayload.allowedVariancePercent}
                onChange={e => setRewardPayload(p => ({ ...p, allowedVariancePercent: e.target.value }))}
                onFocus={() => setRewardFocused('allowedVariancePercent')}
                onBlur={() => setRewardFocused('')}
                placeholder="VD: 10"
              />
              {rewardFocused === 'allowedVariancePercent' && <p className="text-[13px] text-red-500 font-medium leading-tight">{REWARD_HINTS.allowedVariancePercent}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="reward-minkg">Số kg tối thiểu</Label>
              <Input
                id="reward-minkg"
                type="number"
                value={rewardPayload.minKgRequired}
                onChange={e => setRewardPayload(p => ({ ...p, minKgRequired: e.target.value }))}
                onFocus={() => setRewardFocused('minKgRequired')}
                onBlur={() => setRewardFocused('')}
                placeholder="VD: 1"
              />
              {rewardFocused === 'minKgRequired' && <p className="text-[13px] text-red-500 font-medium leading-tight">{REWARD_HINTS.minKgRequired}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="reward-maxkg">Số kg tối đa</Label>
              <Input
                id="reward-maxkg"
                type="number"
                value={rewardPayload.maxKgRequired}
                onChange={e => setRewardPayload(p => ({ ...p, maxKgRequired: e.target.value }))}
                onFocus={() => setRewardFocused('maxKgRequired')}
                onBlur={() => setRewardFocused('')}
                placeholder="VD: 5"
              />
              {rewardFocused === 'maxKgRequired' && <p className="text-[13px] text-red-500 font-medium leading-tight">{REWARD_HINTS.maxKgRequired}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="reward-penalty">Phần trăm phạt (%)</Label>
              <Input
                id="reward-penalty"
                type="number"
                value={rewardPayload.penaltyPercent}
                onChange={e => setRewardPayload(p => ({ ...p, penaltyPercent: e.target.value }))}
                onFocus={() => setRewardFocused('penaltyPercent')}
                onBlur={() => setRewardFocused('')}
                placeholder="VD: 5"
              />
              {rewardFocused === 'penaltyPercent' && <p className="text-[13px] text-red-500 font-medium leading-tight">{REWARD_HINTS.penaltyPercent}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRewardDialog(false)}>
              Hủy
            </Button>
            <Button
              onClick={async () => {
                setRewardErr('');
                if (!rewardPayload.pointsPerUnit || isNaN(Number(rewardPayload.pointsPerUnit)) || Number(rewardPayload.pointsPerUnit) <= 0) {
                  setRewardErr('Điểm mỗi đơn vị phải là số > 0!'); return;
                }
                if (rewardPayload.allowedVariancePercent && (isNaN(Number(rewardPayload.allowedVariancePercent)) || Number(rewardPayload.allowedVariancePercent) < 0)) {
                  setRewardErr('Tỷ lệ sai số phải là số >= 0!'); return;
                }
                if (rewardPayload.minKgRequired && (isNaN(Number(rewardPayload.minKgRequired)) || Number(rewardPayload.minKgRequired) < 0)) {
                  setRewardErr('Số kg tối thiểu phải là số >= 0!'); return;
                }
                if (rewardPayload.maxKgRequired && (isNaN(Number(rewardPayload.maxKgRequired)) || Number(rewardPayload.maxKgRequired) < 0)) {
                  setRewardErr('Số kg tối đa phải là số >= 0!'); return;
                }
                if (rewardPayload.penaltyPercent && (isNaN(Number(rewardPayload.penaltyPercent)) || Number(rewardPayload.penaltyPercent) < 0)) {
                  setRewardErr('Phần trăm phạt phải là số >= 0!'); return;
                }
                try {
                  const token = localStorage.getItem("accessToken");
                  const res = await fetch('http://localhost:3000/enterprise/reward-config', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      ...(token ? { Authorization: `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify({
                      wasteTypeId: rewardDialogWaste.id,
                      pointsPerUnit: Number(rewardPayload.pointsPerUnit),
                      description: rewardPayload.description,
                      allowedVariancePercent: rewardPayload.allowedVariancePercent ? Number(rewardPayload.allowedVariancePercent) : undefined,
                      minKgRequired: rewardPayload.minKgRequired ? Number(rewardPayload.minKgRequired) : undefined,
                      maxKgRequired: rewardPayload.maxKgRequired ? Number(rewardPayload.maxKgRequired) : undefined,
                      penaltyPercent: rewardPayload.penaltyPercent ? Number(rewardPayload.penaltyPercent) : undefined
                    })
                  });
                  if (res.ok) {
                    toast.success('Thêm reward config thành công!');
                    setShowRewardDialog(false);
                    setRewardDialogWaste(null);
                  } else {
                   toast.error('Thêm reward config thất bại!');
                  }
                } catch (e) {
                  setRewardErr('Lỗi khi gọi API reward-config!');
                }
              }}
            >
              Thêm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      <EditWasteTypeDirectModal
        open={showEditWasteDirectModal}
        onClose={() => setShowEditWasteDirectModal(false)}
        wasteTypes={draft.pointsByWaste}
      />

      {/* Chỉ render 1 dialog: nếu đang sửa reward config thì không render EditWasteTypeModal */}
      {wasteToEdit && !editRewardDialog && (
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
                await removeWasteType(wasteToDelete.id);
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
