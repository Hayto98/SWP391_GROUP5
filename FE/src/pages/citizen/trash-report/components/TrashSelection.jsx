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
    (item) => item.wasteTypeId === selectedType,
  );
  const weightNum = Number(weight) || 0;
  const estimatedPoints =
    selectedWasteType && weightNum > 0
      ? weightNum * selectedWasteType.pointsPerUnit
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
                    value={wasteType.wasteTypeId}
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

              if (num >= 0 && num <= 200) {
                setWeight(value);
              }
            }}
            min="0"
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
        <div className="mt-2 rounded-lg border w-full p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Mô tả loại rác
          </p>

          <FieldDescription className="text-sm leading-relaxed text-foreground/90">
            {selectedWasteType.description || "Chưa có mô tả cho loại rác này."}
          </FieldDescription>
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
