import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Pencil, Plus, Trash2, Loader2 } from "lucide-react";
import { useRewardSlaRules } from "../../../../hooks/useRewardSlaRules";
import AddWasteTypeModal from "./components/AddWasteTypeModal";
import EditWasteTypeModal from "./components/EditWasteTypeModal";
import EditWasteTypeDirectModal from "./components/EditWasteTypeDirectModal";
import WasteTypeDetailDialog from "./components/WasteTypeDetailDialog";
import EditRewardConfigDialog from "./components/EditRewardConfigDialog";
import AddRewardConfigDialog from "./components/AddRewardConfigDialog";
import DeleteWasteTypeDialog from "./components/DeleteWasteTypeDialog";

async function fetchWasteTypeById(wasteTypeId) {
  const token = localStorage.getItem("accessToken");
  const res = await fetch(
    `http://localhost:3000/api/v1/enterprise/waste-types/${wasteTypeId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    },
  );
  if (!res.ok) throw new Error("Không lấy được thông tin loại rác");
  return (await res.json()).data;
}

export default function RewardSlaRules() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditWasteDirectModal, setShowEditWasteDirectModal] =
    useState(false);
  const [wasteToDelete, setWasteToDelete] = useState(null);
  const [wasteToEdit, setWasteToEdit] = useState(null);
  const [editRewardDialog, setEditRewardDialog] = useState(false);
  const [editRewardPayload, setEditRewardPayload] = useState({
    pointsPerUnit: "",
    description: "",
    allowedVariancePercent: "",
    penaltyPercent: "",
    minKgRequired: "",
    maxKgRequired: "",
  });
  const [editRewardErr, setEditRewardErr] = useState("");
  const [editRewardFocused, setEditRewardFocused] = useState("");

  // State cho dialog thêm reward-config
  // Dialog thêm reward config cho loại rác chưa có
  const [showRewardDialog, setShowRewardDialog] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [rewardDialogWaste, setRewardDialogWaste] = useState(null);
  const [rewardPayload, setRewardPayload] = useState({
    pointsPerUnit: "",
    description: "",
    allowedVariancePercent: "",
    minKgRequired: "",
    maxKgRequired: "",
    penaltyPercent: "",
  });
  const [rewardErr, setRewardErr] = useState("");
  const [rewardFocused, setRewardFocused] = useState("");

  const REWARD_HINTS = {
    pointsPerUnit:
      "VD: 5. Mỗi đơn vị rác (theo kg, chai hoặc lon) sẽ nhận số điểm thưởng tương ứng.",
    description:
      "Mô tả ngắn gọn về quy tắc thưởng này (VD: Thu gom giấy, Nhựa loại 1...).",
    allowedVariancePercent:
      "Tỷ lệ sai số khối lượng cho phép giữa báo cáo và thực tế (VD: 10%).",
    minKgRequired:
      "Khối lượng tối thiểu để được nhận điểm thưởng theo quy tắc này.",
    maxKgRequired:
      "Khối lượng tối đa có thể nhận thưởng (bỏ trống nếu không giới hạn).",
    penaltyPercent:
      "Tỷ lệ hệ số phạt nếu rác vượt sai số cho phép, sẽ trừ vào tổng điểm.",
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
    addWasteType,
    editWasteType,
    reload,
  } = useRewardSlaRules();

  const handleAddWasteType = async (payload) => {
    const res = await addWasteType(payload);
    if (res?.ok) {
      toast.success("Thêm loại rác thành công!");
      await reload();
    }
    return res;
  };

  const handleEditWasteType = async (payload) => {
    const res = await editWasteType(payload);
    if (res?.ok) {
      toast.success("Cập nhật loại rác thành công!");
      await reload();
    }
    return res;
  };

  // Xóa loại rác qua API
  async function removeWasteType(wasteTypeId) {
    try {
      // Lấy access token từ localStorage (hoặc nơi bạn lưu trữ token)
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        toast.error("Không tìm thấy access token. Vui lòng đăng nhập lại.");
        return { ok: false };
      }
      const res = await fetch(
        `http://localhost:3000/api/v1/enterprise/waste-types/${wasteTypeId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      if (res.ok) {
        toast.success("Xóa loại rác thành công!");
        setWasteToDelete(null);
        await reload();
        return { ok: true };
      } else {
        toast.error("Xóa loại rác thất bại!");
        return { ok: false };
      }
    } catch (e) {
      toast.error("Lỗi khi gọi API xóa loại rác!");
      return { ok: false };
    }
  }

  const operationBusy = adding || saving;

  const closeDetailDialog = () => {
    setDetailWasteType(null);
    setDetailErr("");
  };

  const handleOpenDetail = async (wasteTypeId) => {
    setDetailLoading(true);
    setDetailErr("");
    setDetailWasteType(null);
    try {
      const data = await fetchWasteTypeById(wasteTypeId);
      setDetailWasteType(data);
    } catch (e) {
      setDetailErr(e.message || "Lỗi khi lấy thông tin loại rác");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleUpdateRewardConfig = async () => {
    setEditRewardErr("");
    if (
      !editRewardPayload.pointsPerUnit ||
      isNaN(Number(editRewardPayload.pointsPerUnit)) ||
      Number(editRewardPayload.pointsPerUnit) <= 0
    ) {
      setEditRewardErr("Điểm mỗi đơn vị phải là số > 0!");
      return;
    }
    if (
      editRewardPayload.allowedVariancePercent &&
      (isNaN(Number(editRewardPayload.allowedVariancePercent)) ||
        Number(editRewardPayload.allowedVariancePercent) < 0)
    ) {
      setEditRewardErr("Tỷ lệ sai số phải là số >= 0!");
      return;
    }
    if (
      editRewardPayload.minKgRequired &&
      (isNaN(Number(editRewardPayload.minKgRequired)) ||
        Number(editRewardPayload.minKgRequired) < 0)
    ) {
      setEditRewardErr("Số kg tối thiểu phải là số >= 0!");
      return;
    }
    if (
      editRewardPayload.maxKgRequired &&
      (isNaN(Number(editRewardPayload.maxKgRequired)) ||
        Number(editRewardPayload.maxKgRequired) < 0)
    ) {
      setEditRewardErr("Số kg tối đa phải là số >= 0!");
      return;
    }
    if (
      editRewardPayload.penaltyPercent &&
      (isNaN(Number(editRewardPayload.penaltyPercent)) ||
        Number(editRewardPayload.penaltyPercent) < 0)
    ) {
      setEditRewardErr("Phần trăm phạt phải là số >= 0!");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(
        `http://localhost:3000/enterprise/reward-config/${wasteToEdit.rewardConfigId || wasteToEdit.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            pointsPerUnit: Number(editRewardPayload.pointsPerUnit),
            description: editRewardPayload.description,
            allowedVariancePercent: editRewardPayload.allowedVariancePercent
              ? Number(editRewardPayload.allowedVariancePercent)
              : undefined,
            penaltyPercent: editRewardPayload.penaltyPercent
              ? Number(editRewardPayload.penaltyPercent)
              : undefined,
            minKgRequired: editRewardPayload.minKgRequired
              ? Number(editRewardPayload.minKgRequired)
              : undefined,
            maxKgRequired: editRewardPayload.maxKgRequired
              ? Number(editRewardPayload.maxKgRequired)
              : undefined,
          }),
        },
      );

      if (res.ok) {
        toast.success("Cập nhật reward config thành công!");
        await reload();
        setEditRewardDialog(false);
        setWasteToEdit(null);
      } else {
        setEditRewardErr("Cập nhật reward config thất bại!");
      }
    } catch {
      setEditRewardErr("Lỗi khi gọi API cập nhật reward config!");
    }
  };

  const handleCreateRewardConfig = async () => {
    setRewardErr("");
    if (
      !rewardPayload.pointsPerUnit ||
      isNaN(Number(rewardPayload.pointsPerUnit)) ||
      Number(rewardPayload.pointsPerUnit) <= 0
    ) {
      setRewardErr("Điểm mỗi đơn vị phải là số > 0!");
      return;
    }
    if (
      rewardPayload.allowedVariancePercent &&
      (isNaN(Number(rewardPayload.allowedVariancePercent)) ||
        Number(rewardPayload.allowedVariancePercent) < 0)
    ) {
      setRewardErr("Tỷ lệ sai số phải là số >= 0!");
      return;
    }
    if (
      rewardPayload.minKgRequired &&
      (isNaN(Number(rewardPayload.minKgRequired)) ||
        Number(rewardPayload.minKgRequired) < 0)
    ) {
      setRewardErr("Số kg tối thiểu phải là số >= 0!");
      return;
    }
    if (
      rewardPayload.maxKgRequired &&
      (isNaN(Number(rewardPayload.maxKgRequired)) ||
        Number(rewardPayload.maxKgRequired) < 0)
    ) {
      setRewardErr("Số kg tối đa phải là số >= 0!");
      return;
    }
    if (
      rewardPayload.penaltyPercent &&
      (isNaN(Number(rewardPayload.penaltyPercent)) ||
        Number(rewardPayload.penaltyPercent) < 0)
    ) {
      setRewardErr("Phần trăm phạt phải là số >= 0!");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(
        "http://localhost:3000/enterprise/reward-config",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            wasteTypeId: rewardDialogWaste.id,
            pointsPerUnit: Number(rewardPayload.pointsPerUnit),
            description: rewardPayload.description,
            allowedVariancePercent: rewardPayload.allowedVariancePercent
              ? Number(rewardPayload.allowedVariancePercent)
              : undefined,
            minKgRequired: rewardPayload.minKgRequired
              ? Number(rewardPayload.minKgRequired)
              : undefined,
            maxKgRequired: rewardPayload.maxKgRequired
              ? Number(rewardPayload.maxKgRequired)
              : undefined,
            penaltyPercent: rewardPayload.penaltyPercent
              ? Number(rewardPayload.penaltyPercent)
              : undefined,
          }),
        },
      );

      if (res.ok) {
        toast.success("Thêm reward config thành công!");
        await reload();
        setShowRewardDialog(false);
        setRewardDialogWaste(null);
      } else {
        toast.error("Thêm reward config thất bại!");
      }
    } catch {
      setRewardErr("Lỗi khi gọi API reward-config!");
    }
  };

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
            <CardTitle className="text-primary text-lg">
              Cấu hình Quy tắc Điểm thưởng
            </CardTitle>
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
                            const data = await fetchWasteTypeById(
                              w.wasteTypeId || w.id,
                            );
                            setDetailWasteType(data);
                          } catch (e) {
                            setDetailErr(
                              e.message || "Lỗi khi lấy thông tin loại rác",
                            );
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
                              pointsPerUnit: w.factor || "",
                              description: w.description || "",
                              allowedVariancePercent:
                                w.allowed_variance_percent || "",
                              penaltyPercent: w.penaltyPercent || "",
                              minKgRequired: w.minKgRequired || "",
                              maxKgRequired: w.maxKgRequired || "",
                            });
                            setEditRewardErr("");
                            setEditRewardDialog(true);
                          } else {
                            setRewardDialogWaste(w);
                            setRewardPayload({
                              pointsPerUnit: "",
                              description: "",
                              allowedVariancePercent: "",
                              minKgRequired: "",
                              maxKgRequired: "",
                              penaltyPercent: "",
                            });
                            setRewardErr("");
                            setShowRewardDialog(true);
                          }
                        }}
                        title={
                          w.rewardConfigId
                            ? "Sửa reward config"
                            : "Thêm reward config"
                        }
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

      <WasteTypeDetailDialog
        detailWasteType={detailWasteType}
        detailLoading={detailLoading}
        detailErr={detailErr}
        onClose={closeDetailDialog}
      />

      <EditRewardConfigDialog
        open={editRewardDialog}
        wasteToEdit={wasteToEdit}
        showGuide={showGuide}
        onToggleGuide={() => setShowGuide(!showGuide)}
        editRewardPayload={editRewardPayload}
        setEditRewardPayload={setEditRewardPayload}
        editRewardErr={editRewardErr}
        editRewardFocused={editRewardFocused}
        setEditRewardFocused={setEditRewardFocused}
        rewardHints={REWARD_HINTS}
        onClose={() => {
          setEditRewardDialog(false);
          setWasteToEdit(null);
        }}
        onSubmit={handleUpdateRewardConfig}
      />

      <AddRewardConfigDialog
        open={showRewardDialog}
        rewardDialogWaste={rewardDialogWaste}
        showGuide={showGuide}
        onToggleGuide={() => setShowGuide(!showGuide)}
        rewardPayload={rewardPayload}
        setRewardPayload={setRewardPayload}
        rewardErr={rewardErr}
        rewardFocused={rewardFocused}
        setRewardFocused={setRewardFocused}
        rewardHints={REWARD_HINTS}
        onClose={() => {
          setShowRewardDialog(false);
          setRewardDialogWaste(null);
        }}
        onSubmit={handleCreateRewardConfig}
      />

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
        onConfirm={handleAddWasteType}
        adding={adding}
      />

      <EditWasteTypeDirectModal
        open={showEditWasteDirectModal}
        onClose={() => setShowEditWasteDirectModal(false)}
        wasteTypes={draft.pointsByWaste}
        onUpdated={reload}
      />

      {/* Chỉ render 1 dialog: nếu đang sửa reward config thì không render EditWasteTypeModal */}
      {wasteToEdit && !editRewardDialog && (
        <EditWasteTypeModal
          open={Boolean(wasteToEdit)}
          onClose={() => setWasteToEdit(null)}
          onConfirm={handleEditWasteType}
          adding={adding}
          wasteItem={wasteToEdit}
        />
      )}

      <DeleteWasteTypeDialog
        open={!!wasteToDelete}
        wasteToDelete={wasteToDelete}
        operationBusy={operationBusy}
        onCancel={() => setWasteToDelete(null)}
        onConfirm={async () => {
          await removeWasteType(wasteToDelete.id);
        }}
      />
    </div>
  );
}
