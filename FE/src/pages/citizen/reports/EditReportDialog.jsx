import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LocationSelection from "../trash-report/components/LocationSelection";
import { reverseGeocode } from "@/services/geocodingService";
import { TiGift } from "react-icons/ti";

function EditReportDialog({
  open,
  onOpenChange,
  report,
  onSubmit,
  saving,
  wasteTypes = [],
}) {
  const [gpsLat, setGpsLat] = useState("");
  const [gpsLng, setGpsLng] = useState("");
  const [description, setDescription] = useState("");
  const [wasteTypeId, setWasteTypeId] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [marker, setMarker] = useState(null);

  useEffect(() => {
    if (open && report) {
      setGpsLat(String(report.latitude ?? ""));
      setGpsLng(String(report.longitude ?? ""));
      setDescription(report.description || "");
      setWasteTypeId(String(report.wasteTypeId || ""));

      const apiWeight = Number(report.weightKg);
      if (Number.isFinite(apiWeight) && apiWeight > 0) {
        setWeightKg(String(apiWeight));
      } else {
        const matchedWeight =
          report.description?.match(/(\d+(?:\.\d+)?)\s*kg/i);
        setWeightKg(matchedWeight ? matchedWeight[1] : "");
      }

      if (
        Number.isFinite(Number(report.latitude)) &&
        Number.isFinite(Number(report.longitude))
      ) {
        setMarker({
          id: Date.now(),
          position: [Number(report.latitude), Number(report.longitude)],
          name:
            report.location ||
            `${Number(report.latitude).toFixed(6)}, ${Number(report.longitude).toFixed(6)}`,
        });
      } else {
        setMarker(null);
      }
    }
  }, [open, report]);

  if (!report) return null;

  const selectedWasteType = wasteTypes.find(
    (item) => item.wasteTypeId === wasteTypeId,
  );
  const weightNum = Number(weightKg);
  const estimatedPoints =
    selectedWasteType && Number.isFinite(weightNum) && weightNum > 0
      ? weightNum * selectedWasteType.pointsPerUnit
      : 0;

  const handleMapClick = async (latlng) => {
    const locationName = await reverseGeocode(latlng.lat, latlng.lng);
    setMarker({
      id: Date.now(),
      position: [latlng.lat, latlng.lng],
      name: locationName,
    });
    setGpsLat(String(latlng.lat));
    setGpsLng(String(latlng.lng));
  };

  const handleDeleteMarker = () => {
    setMarker(null);
    setGpsLat("");
    setGpsLng("");
  };

  const handleSave = () => {
    const lat = marker?.position?.[0] ?? Number(gpsLat);
    const lng = marker?.position?.[1] ?? Number(gpsLng);
    const kg = Number(weightKg);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return;
    }

    onSubmit?.({
      waste_type_id: wasteTypeId || undefined,
      gps_lat: lat,
      gps_lng: lng,
      description: description?.trim() || "Cập nhật mô tả mới",
      weight_kg: Number.isFinite(kg) && kg > 0 ? kg : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa báo cáo</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin vị trí và mô tả báo cáo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="waste-type">Loại rác</Label>
            <Select value={wasteTypeId} onValueChange={setWasteTypeId}>
              <SelectTrigger className="min-w-full" id="waste-type">
                <SelectValue placeholder="Chọn loại rác" />
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="weight-kg">Khối lượng (kg)</Label>
            <Input
              id="weight-kg"
              type="number"
              min="0"
              step="0.1"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              placeholder="Ví dụ: 10"
            />
            <p className="text-sm text-blue-500 flex items-center gap-2">
              <TiGift size="16" />
              {selectedWasteType
                ? `Ước tính: ${estimatedPoints.toFixed(2)} điểm (${selectedWasteType.pointsPerUnit} điểm/${selectedWasteType.unitType})`
                : "Chọn loại rác để xem điểm quy đổi"}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Chọn vị trí trên bản đồ</Label>
            <LocationSelection
              marker={marker}
              onMapClick={handleMapClick}
              onDeleteMarker={handleDeleteMarker}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-description">Mô tả</Label>
            <Textarea
              id="report-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Cập nhật mô tả mới"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default EditReportDialog;
