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
import { Button } from "@/components/ui/button";

const trashTypes = [
  { id: 1, name: "nhựa", label: "Nhựa", points: 50, minWeight: 5 },
  { id: 2, name: "giấy", label: "Giấy", points: 30, minWeight: 3 },
  { id: 3, name: "kim loại", label: "Kim loại", points: 80, minWeight: 10 },
  { id: 4, name: "thủy tinh", label: "Thủy tinh", points: 40, minWeight: 5 },
  { id: 5, name: "vải", label: "Vải", points: 25, minWeight: 2 },
  { id: 6, name: "điện tử", label: "Điện tử", points: 100, minWeight: 1 },
];

export { trashTypes };

function TrashSelection({
  selectedType,
  setSelectedType,
  weight,
  setWeight,
  trashes,
  onAddTrash,
  onClearAll,
}) {
  const selectedTrashType = trashTypes.find((t) => t.name === selectedType);

  return (
    <div>
      <FieldGroup className="flex gap-4 flex-row">
        <Field>
          <FieldLabel>Loại rác</FieldLabel>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger>
              <SelectValue placeholder="chọn loại rác" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {trashTypes.map((trashType) => (
                  <SelectItem key={trashType.id} value={trashType.name}>
                    {trashType.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <FieldDescription className="flex gap-2 items-center text-blue-400">
            <TiGift size="16" />
            <span>
              {selectedTrashType
                ? `${selectedTrashType.points} điểm/kg`
                : "Chọn loại rác"}
            </span>
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel>
            Khối lượng ước tính (Kg)
            <span className="text-destructive">*</span>
          </FieldLabel>

          <Input
            type="number"
            placeholder="nhập khối lượng rác"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
          <FieldDescription className="flex gap-2 items-center text-blue-400">
            <CircleAlert size="16" />
            <span>
              {selectedTrashType
                ? `tối thiểu ${selectedTrashType.minWeight}kg`
                : "Chọn loại rác"}
            </span>
          </FieldDescription>
        </Field>
      </FieldGroup>
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          className="text-destructive border-destructive hover:bg-red-200 hover:text-red-500"
          onClick={onClearAll}
        >
          xoá toàn bộ
        </Button>

        <Button onClick={onAddTrash}>Thêm</Button>
      </div>

      {trashes.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2 text-start">
            Danh sách rác đã thêm:
          </h3>
          <div className="space-y-2">
            {trashes.map((trash) => (
              <div
                key={trash.id}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-md border"
              >
                <div>
                  <span className="font-medium capitalize">{trash.type}:</span>
                  <span className="text-muted-foreground ml-2">
                    {trash.weight} kg
                  </span>
                </div>
                <div className="flex items-center gap-2 text-blue-500">
                  <TiGift size="16" />
                  <span className="font-semibold">{trash.points} điểm</span>
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-md border border-blue-200">
              <span className="font-semibold">Tổng cộng:</span>
              <div className="flex items-center gap-2 text-blue-600 font-bold">
                <TiGift size="18" />
                <span>
                  {trashes.reduce((sum, trash) => sum + trash.points, 0)} điểm
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex mt-4 gap-2 rounded px-2 py-4 bg-orange-100 border border-orange-300">
        <CircleAlert className="text-destructive" />
        <div className="text-destructive">
          <h4 className="text-sm font-semibold text-start">Quy tắc thu gom</h4>
          <p className="leading-7 text-sm">
            Mỗi loại rác có khối lượng riêng để tối ưu hoá quá trình vận chuyển.
          </p>
        </div>
      </div>
    </div>
  );
}

export default TrashSelection;
