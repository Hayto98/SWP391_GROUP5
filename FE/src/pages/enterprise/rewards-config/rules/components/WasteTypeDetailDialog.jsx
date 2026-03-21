import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function WasteTypeDetailDialog({
  detailWasteType,
  detailLoading,
  detailErr,
  onClose,
}) {
  return (
    <Dialog
      open={!!detailWasteType || detailLoading || !!detailErr}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thông tin chi tiết loại rác</DialogTitle>
        </DialogHeader>
        {detailLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Đang tải...
          </div>
        ) : detailErr ? (
          <div className="text-red-600 font-semibold text-sm">{detailErr}</div>
        ) : detailWasteType ? (
          <div className="space-y-2">
            <div>
              <b>ID:</b> {detailWasteType.wasteTypeId}
            </div>
            <div>
              <b>Tên loại rác:</b> {detailWasteType.wasteTypeName}
            </div>
            <div>
              <b>Đơn vị:</b> {detailWasteType.unitType}
            </div>
            <div>
              <b>Trạng thái:</b>{" "}
              {detailWasteType.isActive ? "Đang hoạt động" : "Đã tắt"}
            </div>
            <div>
              <b>Reward Config:</b>
              {detailWasteType.rewardConfig ? (
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  <li>
                    <b>Điểm mỗi đơn vị:</b>{" "}
                    {detailWasteType.rewardConfig.pointsPerUnit}
                  </li>
                  <li>
                    <b>Mô tả:</b> {detailWasteType.rewardConfig.description}
                  </li>
                  <li>
                    <b>Tỷ lệ sai số (%):</b>{" "}
                    {detailWasteType.rewardConfig.allowedVariancePercent}
                  </li>
                  <li>
                    <b>Khối lượng tối thiểu:</b>{" "}
                    {detailWasteType.rewardConfig.minKgRequired}
                  </li>
                  <li>
                    <b>Khối lượng tối đa:</b>{" "}
                    {detailWasteType.rewardConfig.maxKgRequired}
                  </li>
                  <li>
                    <b>Phần trăm phạt (%):</b>{" "}
                    {detailWasteType.rewardConfig.penaltyPercent}
                  </li>
                  <li>
                    <b>Trạng thái:</b>{" "}
                    {detailWasteType.rewardConfig.isActive
                      ? "Đang hoạt động"
                      : "Đã tắt"}
                  </li>
                </ul>
              ) : (
                "Chưa cấu hình"
              )}
            </div>
          </div>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
