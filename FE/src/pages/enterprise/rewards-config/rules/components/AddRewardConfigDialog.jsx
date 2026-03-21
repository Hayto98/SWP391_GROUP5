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

export default function AddRewardConfigDialog({
  open,
  rewardDialogWaste,
  showGuide,
  onToggleGuide,
  rewardPayload,
  setRewardPayload,
  rewardErr,
  rewardFocused,
  setRewardFocused,
  rewardHints,
  onClose,
  onSubmit,
}) {
  return (
    <Dialog
      open={open && !!rewardDialogWaste}
      onOpenChange={(v) => !v && onClose()}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm điểm thưởng cho loại rác</DialogTitle>
          <DialogDescription className="flex items-center justify-between border-b pb-2">
            <span>
              Nhập thông tin điểm thưởng cho loại rác{" "}
              <b>{rewardDialogWaste?.name}</b> (ID: {rewardDialogWaste?.id})
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
          {rewardErr && (
            <div className="mt-1 text-red-600 font-semibold text-sm">
              {rewardErr}
            </div>
          )}
          <div className="space-y-1">
            <Label htmlFor="reward-points">Điểm mỗi đơn vị</Label>
            <Input
              id="reward-points"
              type="number"
              value={rewardPayload.pointsPerUnit}
              onChange={(e) =>
                setRewardPayload((p) => ({
                  ...p,
                  pointsPerUnit: e.target.value,
                }))
              }
              onFocus={() => setRewardFocused("pointsPerUnit")}
              onBlur={() => setRewardFocused("")}
              placeholder="VD: 5"
            />
            {rewardFocused === "pointsPerUnit" && (
              <p className="text-[13px] text-red-500 font-medium leading-tight">
                {rewardHints.pointsPerUnit}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="reward-desc">Mô tả</Label>
            <Input
              id="reward-desc"
              value={rewardPayload.description}
              onChange={(e) =>
                setRewardPayload((p) => ({ ...p, description: e.target.value }))
              }
              onFocus={() => setRewardFocused("description")}
              onBlur={() => setRewardFocused("")}
              placeholder="VD: 5 điểm mỗi kg"
            />
            {rewardFocused === "description" && (
              <p className="text-[13px] text-red-500 font-medium leading-tight">
                {rewardHints.description}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="reward-variance">Tỷ lệ sai số (%)</Label>
            <Input
              id="reward-variance"
              type="number"
              value={rewardPayload.allowedVariancePercent}
              onChange={(e) =>
                setRewardPayload((p) => ({
                  ...p,
                  allowedVariancePercent: e.target.value,
                }))
              }
              onFocus={() => setRewardFocused("allowedVariancePercent")}
              onBlur={() => setRewardFocused("")}
              placeholder="VD: 10"
            />
            {rewardFocused === "allowedVariancePercent" && (
              <p className="text-[13px] text-red-500 font-medium leading-tight">
                {rewardHints.allowedVariancePercent}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="reward-minkg">Số kg tối thiểu</Label>
            <Input
              id="reward-minkg"
              type="number"
              value={rewardPayload.minKgRequired}
              onChange={(e) =>
                setRewardPayload((p) => ({
                  ...p,
                  minKgRequired: e.target.value,
                }))
              }
              onFocus={() => setRewardFocused("minKgRequired")}
              onBlur={() => setRewardFocused("")}
              placeholder="VD: 1"
            />
            {rewardFocused === "minKgRequired" && (
              <p className="text-[13px] text-red-500 font-medium leading-tight">
                {rewardHints.minKgRequired}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="reward-maxkg">Số kg tối đa</Label>
            <Input
              id="reward-maxkg"
              type="number"
              value={rewardPayload.maxKgRequired}
              onChange={(e) =>
                setRewardPayload((p) => ({
                  ...p,
                  maxKgRequired: e.target.value,
                }))
              }
              onFocus={() => setRewardFocused("maxKgRequired")}
              onBlur={() => setRewardFocused("")}
              placeholder="VD: 5"
            />
            {rewardFocused === "maxKgRequired" && (
              <p className="text-[13px] text-red-500 font-medium leading-tight">
                {rewardHints.maxKgRequired}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="reward-penalty">Phần trăm phạt (%)</Label>
            <Input
              id="reward-penalty"
              type="number"
              value={rewardPayload.penaltyPercent}
              onChange={(e) =>
                setRewardPayload((p) => ({
                  ...p,
                  penaltyPercent: e.target.value,
                }))
              }
              onFocus={() => setRewardFocused("penaltyPercent")}
              onBlur={() => setRewardFocused("")}
              placeholder="VD: 5"
            />
            {rewardFocused === "penaltyPercent" && (
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
          <Button onClick={onSubmit}>Thêm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
