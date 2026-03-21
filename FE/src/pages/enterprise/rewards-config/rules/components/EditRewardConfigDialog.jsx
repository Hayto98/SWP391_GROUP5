import { Info } from "lucide-react";
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

export default function EditRewardConfigDialog({
  open,
  wasteToEdit,
  showGuide,
  onToggleGuide,
  editRewardPayload,
  setEditRewardPayload,
  editRewardErr,
  editRewardFocused,
  setEditRewardFocused,
  rewardHints,
  onClose,
  onSubmit,
}) {
  return (
    <Dialog open={open && !!wasteToEdit} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sửa Điểm Thưởng</DialogTitle>
          <DialogDescription className="flex items-center justify-between border-b pb-2">
            <span>
              Cập nhật điểm thưởng cho loại rác <b>{wasteToEdit?.name}</b> (ID:{" "}
              {wasteToEdit?.id})
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              onClick={onToggleGuide}
              title="Hướng dẫn tính điểm"
            >
              <Info className="size-4" />
            </Button>
          </DialogDescription>
        </DialogHeader>

        {showGuide && (
          <div className="bg-blue-50/80 text-blue-900 p-3 rounded-lg text-sm space-y-2 mb-2 border border-blue-100">
            <p className="font-semibold text-blue-700">
              Hướng dẫn chung về cách tính điểm:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <b>Điểm nhận được</b> ={" "}
                <code>Khối lượng &times; Điểm mỗi đơn vị</code>.
              </li>
              <li>
                Nếu khối lượng nằm ngoài khoảng <b>Tối thiểu / Tối đa</b>, hệ
                thống sẽ từ chối tự động duyệt.
              </li>
              <li>
                <b>Sai số:</b> Nếu khối lượng thu gom thực tế chênh lệch với
                khai báo trong <b>Tỷ lệ cho phép</b> thì vẫn nhận đủ điểm.
              </li>
              <li>
                <b>Phạt:</b> Nếu sai số lớn hơn Tỷ lệ cho phép, công dân sẽ bị
                trừ bớt điểm theo <b>Tỷ lệ phạt</b>.
              </li>
            </ul>
          </div>
        )}

        <div className="space-y-3">
          {editRewardErr && (
            <div className="mt-1 text-red-600 font-semibold text-sm">
              {editRewardErr}
            </div>
          )}
          <div className="space-y-1">
            <Label htmlFor="edit-reward-points">Điểm mỗi đơn vị</Label>
            <Input
              id="edit-reward-points"
              type="number"
              value={editRewardPayload.pointsPerUnit}
              onChange={(e) =>
                setEditRewardPayload((p) => ({
                  ...p,
                  pointsPerUnit: e.target.value,
                }))
              }
              onFocus={() => setEditRewardFocused("pointsPerUnit")}
              onBlur={() => setEditRewardFocused("")}
              placeholder="VD: 9"
            />
            {editRewardFocused === "pointsPerUnit" && (
              <p className="text-[13px] text-red-500 font-medium leading-tight">
                {rewardHints.pointsPerUnit}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-reward-desc">Mô tả</Label>
            <Input
              id="edit-reward-desc"
              value={editRewardPayload.description}
              onChange={(e) =>
                setEditRewardPayload((p) => ({
                  ...p,
                  description: e.target.value,
                }))
              }
              onFocus={() => setEditRewardFocused("description")}
              onBlur={() => setEditRewardFocused("")}
              placeholder="VD: 100 điểm mỗi kg"
            />
            {editRewardFocused === "description" && (
              <p className="text-[13px] text-red-500 font-medium leading-tight">
                {rewardHints.description}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-reward-variance">Tỷ lệ sai số (%)</Label>
            <Input
              id="edit-reward-variance"
              type="number"
              value={editRewardPayload.allowedVariancePercent}
              onChange={(e) =>
                setEditRewardPayload((p) => ({
                  ...p,
                  allowedVariancePercent: e.target.value,
                }))
              }
              onFocus={() => setEditRewardFocused("allowedVariancePercent")}
              onBlur={() => setEditRewardFocused("")}
              placeholder="VD: 8"
            />
            {editRewardFocused === "allowedVariancePercent" && (
              <p className="text-[13px] text-red-500 font-medium leading-tight">
                {rewardHints.allowedVariancePercent}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-reward-minkg">Số kg tối thiểu</Label>
            <Input
              id="edit-reward-minkg"
              type="number"
              value={editRewardPayload.minKgRequired}
              onChange={(e) =>
                setEditRewardPayload((p) => ({
                  ...p,
                  minKgRequired: e.target.value,
                }))
              }
              onFocus={() => setEditRewardFocused("minKgRequired")}
              onBlur={() => setEditRewardFocused("")}
              placeholder="VD: 1"
            />
            {editRewardFocused === "minKgRequired" && (
              <p className="text-[13px] text-red-500 font-medium leading-tight">
                {rewardHints.minKgRequired}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-reward-maxkg">Số kg tối đa</Label>
            <Input
              id="edit-reward-maxkg"
              type="number"
              value={editRewardPayload.maxKgRequired}
              onChange={(e) =>
                setEditRewardPayload((p) => ({
                  ...p,
                  maxKgRequired: e.target.value,
                }))
              }
              onFocus={() => setEditRewardFocused("maxKgRequired")}
              onBlur={() => setEditRewardFocused("")}
              placeholder="VD: 30"
            />
            {editRewardFocused === "maxKgRequired" && (
              <p className="text-[13px] text-red-500 font-medium leading-tight">
                {rewardHints.maxKgRequired}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-reward-penalty">Phần trăm phạt (%)</Label>
            <Input
              id="edit-reward-penalty"
              type="number"
              value={editRewardPayload.penaltyPercent}
              onChange={(e) =>
                setEditRewardPayload((p) => ({
                  ...p,
                  penaltyPercent: e.target.value,
                }))
              }
              onFocus={() => setEditRewardFocused("penaltyPercent")}
              onBlur={() => setEditRewardFocused("")}
              placeholder="VD: 6"
            />
            {editRewardFocused === "penaltyPercent" && (
              <p className="text-[13px] text-red-500 font-medium leading-tight">
                {rewardHints.penaltyPercent}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={onSubmit}>Cập Nhật</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
