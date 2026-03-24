import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Calculator, CircleAlert, Info, Plus, Trash2 } from "lucide-react";
import { TiGift } from "react-icons/ti";

function TrashSelection({
  wasteTypes,
  loadingWasteTypes,
  selectedType,
  setSelectedType,
  quantity,
  setQuantity,
  selectedItems,
  onAddItem,
  onRemoveItem,
}) {
  const selectedWasteType = wasteTypes.find(
    (item) => String(item.wasteTypeId) === String(selectedType),
  );
  const quantityNum = Number(quantity) || 0;
  const minKgRequired = Number(selectedWasteType?.minKgRequired ?? 0);
  const maxKgRequiredRaw = selectedWasteType?.maxKgRequired;
  const hasMaxKgLimit =
    maxKgRequiredRaw !== null &&
    maxKgRequiredRaw !== undefined &&
    Number(maxKgRequiredRaw) > 0;
  const maxKgRequired = hasMaxKgLimit ? Number(maxKgRequiredRaw) : null;
  const effectiveQuantity =
    selectedWasteType && quantityNum > 0
      ? hasMaxKgLimit
        ? Math.min(quantityNum, maxKgRequired)
        : quantityNum
      : 0;
  const estimatedPoints =
    selectedWasteType && quantityNum > 0
      ? effectiveQuantity * selectedWasteType.pointsPerUnit
      : 0;

  const dynamicVarianceExample =
    selectedWasteType && quantityNum > 0
      ? (() => {
          const percent = Number(selectedWasteType.allowedVariancePercent ?? 0);
          const variance = (quantityNum * percent) / 100;
          const minAllowed = Math.max(0, quantityNum - variance);
          const maxAllowed = quantityNum + variance;
          return `${minAllowed.toFixed(2)} - ${maxAllowed.toFixed(2)} ${selectedWasteType.unitType}`;
        })()
      : null;

  const dynamicPenaltyExample =
    selectedWasteType && estimatedPoints > 0
      ? (() => {
          const penaltyPercent = Number(selectedWasteType.penaltyPercent ?? 0);
          const penaltyPoints = (estimatedPoints * penaltyPercent) / 100;
          const remainingPoints = estimatedPoints - penaltyPoints;
          return {
            penaltyPoints,
            remainingPoints,
          };
        })()
      : null;

  const selectedItemsWithMeta = selectedItems
    .map((item) => {
      const wasteType = wasteTypes.find(
        (type) => String(type.wasteTypeId) === String(item.waste_type_id),
      );
      return {
        ...item,
        wasteType,
      };
    })
    .filter((item) => item.wasteType);

  const totalEstimatedPoints = selectedItemsWithMeta.reduce((sum, item) => {
    return (
      sum +
      Number(item.quantity || 0) * Number(item.wasteType.pointsPerUnit || 0)
    );
  }, 0);

  return (
    <div>
      <FieldGroup className="flex flex-col gap-4 md:flex-row md:items-start md:gap-3">
        <Field className="md:flex-1 md:min-w-0">
          <FieldLabel>
            Loại rác
            <span className="text-destructive">*</span>
          </FieldLabel>

          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger>
              <SelectValue
                placeholder={
                  loadingWasteTypes ? "Đang tải loại rác..." : "Chọn loại rác"
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {wasteTypes.map((wasteType) => (
                  <SelectItem
                    key={wasteType.wasteTypeId}
                    value={String(wasteType.wasteTypeId)}
                  >
                    {wasteType.wasteTypeName}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <FieldDescription className="flex gap-2 items-center text-blue-400">
            <TiGift size="16" />
            <span>
              {selectedWasteType
                ? `${selectedWasteType.pointsPerUnit} điểm/${selectedWasteType.unitType}`
                : "Chọn loại rác"}
            </span>
          </FieldDescription>
        </Field>

        <Field className="md:flex-1 md:min-w-0">
          <FieldLabel>
            Khối lượng
            <span className="text-destructive">*</span>
          </FieldLabel>

          <Input
            type="number"
            placeholder="nhập khối lượng rác"
            value={quantity}
            onChange={(e) => {
              const value = e.target.value;

              if (value === "") {
                setQuantity("");
                return;
              }

              const num = Number(value);

              if (Number.isNaN(num) || num < 0 || num > 200) {
                return;
              }

              setQuantity(value);
            }}
            min={0}
            max={hasMaxKgLimit ? maxKgRequired : 200}
            step="0.1"
          />
          <FieldDescription className="flex gap-2 items-center text-blue-400">
            <CircleAlert size="16" />
            <span>
              {selectedWasteType
                ? `Đơn vị: ${selectedWasteType.unitType} • Tối thiểu: ${minKgRequired} ${selectedWasteType.unitType} • Tối đa: ${hasMaxKgLimit ? `${maxKgRequired} ${selectedWasteType.unitType}` : "Không giới hạn"}`
                : "Chọn loại rác"}
            </span>
          </FieldDescription>
        </Field>
        <Field className="md:pt-7.5 md:w-auto">
          <Button
            type="button"
            onClick={onAddItem}
            className="gap-2 w-full md:w-40"
          >
            <Plus size={16} />
            Thêm loại rác
          </Button>
        </Field>
      </FieldGroup>

      {selectedItemsWithMeta.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-lg border border-emerald-100 bg-white shadow-sm transition-all">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-emerald-50/50">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold tracking-tight text-slate-900">
                Danh sách rác đã chọn
              </h3>
              <p className="text-[12px] text-muted-foreground">
                Tự động tính toán điểm dựa trên khối lượng
              </p>
            </div>
            <Badge
              variant="secondary"
              className="rounded-md bg-white border border-emerald-100 font-bold text-emerald-700 shadow-sm"
            >
              {selectedItemsWithMeta.length} loại
            </Badge>
          </div>

          <Separator className="bg-emerald-50" />

          {/* List Items */}
          <div className="px-2 py-3">
            <ul className="space-y-1">
              {selectedItemsWithMeta.map((item) => {
                const itemPoints =
                  Number(item.quantity || 0) *
                  Number(item.wasteType.pointsPerUnit || 0);

                return (
                  <li
                    key={item.waste_type_id}
                    className="group flex items-center justify-between gap-4 rounded-xl px-3 py-3 transition-all hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Dot trang trí */}
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-800">
                          {item.wasteType.wasteTypeName}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[12px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {item.quantity} {item.wasteType.unitType}
                          </span>
                          <span className="flex items-center gap-1 text-[12px] font-bold text-emerald-600">
                            <Calculator size={10} strokeWidth={3} />+
                            {itemPoints.toFixed(2)} điểm
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Nút xóa luôn hiển thị nhưng nhẹ nhàng */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0 text-slate-400 hover:text-destructive hover:bg-red-50 border border-transparent hover:border-red-100 transition-all rounded-lg"
                      onClick={() => onRemoveItem(item.waste_type_id)}
                    >
                      <Trash2 size={16} />
                      <span className="sr-only">Xóa</span>
                    </Button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Footer */}
          <div className="bg-emerald-50/30 px-5 py-4 border-t border-emerald-50">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                Tổng điểm ước tính
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black tracking-tighter text-emerald-600">
                  {totalEstimatedPoints.toFixed(2)}
                </span>
                <span className="text-[10px] font-black text-emerald-600/70 uppercase">
                  điểm
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedWasteType && (
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Mô tả loại rác:
          </p>

          <FieldDescription className="text-sm leading-relaxed text-foreground/90">
            {selectedWasteType.description || "Chưa có mô tả cho loại rác này."}
          </FieldDescription>
          <p className="font-semibold text-blue-800 mb-2">
            Hướng dẫn tính điểm
          </p>

          <ul className="space-y-1 text-blue-900 leading-6">
            <li>
              Công thức cơ bản: Điểm = Khối lượng hợp lệ x{" "}
              {selectedWasteType.pointsPerUnit} điểm/
              {selectedWasteType.unitType}
            </li>

            <li>
              Sai lệch cho phép giữa báo cáo và thực tế: ±
              {selectedWasteType.allowedVariancePercent ?? "-"}%
            </li>
            <li className="text-blue-700/90 text-xs pl-4">
              {dynamicVarianceExample
                ? `Ví dụ theo số lượng đã nhập ${quantityNum.toFixed(2)} ${selectedWasteType.unitType}: thực tế trong khoảng ${dynamicVarianceExample} vẫn được xem là trong ngưỡng.`
                : "Nhập khối lượng để xem ví dụ sai lệch theo dữ liệu thực tế."}
            </li>
            <li>
              Mức phạt nếu báo cáo không chính xác:{" "}
              {selectedWasteType.penaltyPercent ?? "-"}%
            </li>
            <li className="text-blue-700/90 text-xs pl-4">
              {dynamicPenaltyExample
                ? `Ví dụ theo dữ liệu hiện tại: ${estimatedPoints.toFixed(2)} điểm với mức phạt ${selectedWasteType.penaltyPercent ?? 0}% sẽ bị trừ ${dynamicPenaltyExample.penaltyPoints.toFixed(2)} điểm, còn ${dynamicPenaltyExample.remainingPoints.toFixed(2)} điểm.`
                : "Thêm khối lượng để xem ví dụ mức phạt theo dữ liệu hiện tại."}
            </li>
            <li>
              Ước tính hiện tại: {effectiveQuantity.toFixed(2)}{" "}
              {selectedWasteType.unitType} x {selectedWasteType.pointsPerUnit} ={" "}
              {estimatedPoints.toFixed(2)} điểm
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default TrashSelection;
