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
import { CircleAlert } from "lucide-react";
import { TiGift } from "react-icons/ti";

function TrashSelection({
  wasteTypes,
  loadingWasteTypes,
  selectedType,
  setSelectedType,
  weight,
  setWeight,
}) {
  const selectedWasteType = wasteTypes.find(
    (item) => String(item.wasteTypeId) === String(selectedType),
  );
  const weightNum = Number(weight) || 0;
  const minKgRequired = Number(selectedWasteType?.minKgRequired ?? 0);
  const maxKgRequiredRaw = selectedWasteType?.maxKgRequired;
  const hasMaxKgLimit =
    maxKgRequiredRaw !== null &&
    maxKgRequiredRaw !== undefined &&
    Number(maxKgRequiredRaw) > 0;
  const maxKgRequired = hasMaxKgLimit ? Number(maxKgRequiredRaw) : null;
  const effectiveWeight =
    selectedWasteType && weightNum > 0
      ? hasMaxKgLimit
        ? Math.min(weightNum, maxKgRequired)
        : weightNum
      : 0;
  const estimatedPoints =
    selectedWasteType && weightNum > 0
      ? effectiveWeight * selectedWasteType.pointsPerUnit
      : 0;

  return (
    <div>
      <FieldGroup className="flex gap-4 flex-row">
        <Field>
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

        <Field>
          <FieldLabel>
            Khối lượng ước tính
            <span className="text-destructive">*</span>
          </FieldLabel>

          <Input
            type="number"
            placeholder="nhập khối lượng rác"
            value={weight}
            onChange={(e) => {
              const value = e.target.value;

              if (value === "") {
                setWeight("");
                return;
              }

              const num = Number(value);

              if (!selectedWasteType) {
                return;
              }

              // Check against min/max limits
              if (num < minKgRequired) {
                return;
              }

              if (hasMaxKgLimit && num > maxKgRequired) {
                return;
              }

              if (num >= 0 && num <= 200) {
                setWeight(value);
              }
            }}
            min={minKgRequired}
            max={hasMaxKgLimit ? maxKgRequired : 200}
            step="0.1"
          />
          <FieldDescription className="flex gap-2 items-center text-blue-400">
            <CircleAlert size="16" />
            <span>
              {selectedWasteType
                ? `Đơn vị: ${selectedWasteType.unitType} • Ước tính: ${estimatedPoints.toFixed(2)} điểm`
                : "Chọn loại rác"}
            </span>
          </FieldDescription>
        </Field>
      </FieldGroup>
      {selectedWasteType && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Mô tả loại rác
          </p>

          <FieldDescription className="text-sm leading-relaxed text-foreground/90">
            {selectedWasteType.description || "Chưa có mô tả cho loại rác này."}
          </FieldDescription>
          <p className="font-semibold text-emerald-800 mb-2">
            Hướng dẫn tính điểm
          </p>

          <ul className="space-y-1 text-emerald-900 leading-6">
            <li>
              Công thức cơ bản: Điểm = Khối lượng hợp lệ x{" "}
              {selectedWasteType.pointsPerUnit} điểm/
              {selectedWasteType.unitType}
            </li>
            <li>
              Khối lượng tối thiểu để được tính điểm: {minKgRequired}{" "}
              {selectedWasteType.unitType}
            </li>
            <li>
              Khối lượng tối đa được tính điểm:{" "}
              {hasMaxKgLimit
                ? `${maxKgRequired} ${selectedWasteType.unitType}`
                : "Không giới hạn"}
            </li>
            <li>
              Sai lệch cho phép giữa báo cáo và thực tế: ±
              {selectedWasteType.allowedVariancePercent ?? "-"}%
            </li>
            <li className="text-emerald-700/90 text-xs pl-4">
              Ví dụ: Nếu báo cáo 10 {selectedWasteType.unitType}, thì thực tế từ
              9 đến 11 {selectedWasteType.unitType} vẫn được xem là trong
              ngưỡng.
            </li>
            <li>
              Mức phạt nếu báo cáo không chính xác:{" "}
              {selectedWasteType.penaltyPercent ?? "-"}%
            </li>
            <li className="text-emerald-700/90 text-xs pl-4">
              Ví dụ: Nếu điểm tạm tính là 100 và mức phạt 10%, hệ thống sẽ trừ
              10 điểm (còn 90 điểm).
            </li>
            <li>
              Ước tính hiện tại: {effectiveWeight.toFixed(2)}{" "}
              {selectedWasteType.unitType} x {selectedWasteType.pointsPerUnit} ={" "}
              {estimatedPoints.toFixed(2)} điểm
            </li>
          </ul>
        </div>
      )}
      <div className="flex mt-4 gap-2 rounded px-2 py-4 bg-orange-100 border border-orange-300">
        <CircleAlert className="text-destructive" />
        <div className="text-destructive">
          <h4 className="text-sm font-semibold text-start">Quy tắc thu gom</h4>
          <p className="leading-7 text-sm">
            Mỗi báo cáo chỉ chọn một loại rác, nhập khối lượng tương ứng để hệ
            thống tính điểm.
          </p>
        </div>
      </div>
    </div>
  );
}

export default TrashSelection;
