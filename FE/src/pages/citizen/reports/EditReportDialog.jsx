import { useEffect, useRef, useState } from "react";
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
import { CircleAlert, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import ImageSection from "@/components/ui/image-section";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES = 5;

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
  const [selectedType, setSelectedType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [marker, setMarker] = useState(null);
  const [currentImages, setCurrentImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (open && report) {
      setGpsLat(String(report.latitude ?? ""));
      setGpsLng(String(report.longitude ?? ""));
      setDescription(report.description || "");

      const initialItems = (report.items || [])
        .map((item) => ({
          waste_type_id: Number(item.waste_type_id ?? item.wasteTypeId),
          quantity: Number(item.quantity),
        }))
        .filter(
          (item) =>
            Number.isInteger(item.waste_type_id) &&
            item.waste_type_id > 0 &&
            Number.isFinite(item.quantity) &&
            item.quantity > 0,
        );

      setSelectedItems(initialItems);
      if (initialItems.length > 0) {
        setSelectedType(String(initialItems[0].waste_type_id));
        setQuantity(String(initialItems[0].quantity));
      } else {
        setSelectedType("");
        setQuantity("");
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

      const existingFromCitizenImages = Array.isArray(report?.citizenImages)
        ? report.citizenImages
            .filter((uri) => typeof uri === "string" && uri.trim() !== "")
            .map((uri, index) => ({
              id: `current-${index}`,
              uri,
            }))
        : [];

      const existingFromImages = Array.isArray(report?.images)
        ? report.images
            .map((img, index) => {
              const uri = img?.file_uri || img?.fileUri || null;
              if (!uri || typeof uri !== "string") return null;
              return {
                id: `current-image-${index}`,
                uri,
              };
            })
            .filter(Boolean)
        : [];

      const mergedCurrentImages = [
        ...existingFromCitizenImages,
        ...existingFromImages,
      ]
        .filter((img) => typeof img?.uri === "string" && img.uri.trim() !== "")
        .reduce((acc, img) => {
          const exists = acc.some((item) => item.uri === img.uri);
          if (!exists) acc.push(img);
          return acc;
        }, [])
        .slice(0, MAX_IMAGES);

      setCurrentImages(mergedCurrentImages);
      setNewImages((prev) => {
        prev.forEach((img) => {
          if (img?.preview) {
            URL.revokeObjectURL(img.preview);
          }
        });
        return [];
      });
    }
  }, [open, report]);

  useEffect(() => {
    return () => {
      newImages.forEach((img) => {
        if (img?.preview) {
          URL.revokeObjectURL(img.preview);
        }
      });
    };
  }, [newImages]);

  if (!report) return null;

  const selectedWasteType = wasteTypes.find(
    (item) => String(item.wasteTypeId) === String(selectedType),
  );
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
      sum + Number(item.quantity) * Number(item.wasteType.pointsPerUnit || 0)
    );
  }, 0);

  const handleAddItem = () => {
    if (!selectedWasteType) {
      toast.warning("Vui lòng chọn loại rác trước khi thêm");
      return;
    }

    const quantityNum = Number(quantity);
    if (!quantity || Number.isNaN(quantityNum) || quantityNum <= 0) {
      toast.warning("Vui lòng nhập khối lượng hợp lệ");
      return;
    }

    const existingIndex = selectedItems.findIndex(
      (item) =>
        String(item.waste_type_id) === String(selectedWasteType.wasteTypeId),
    );

    if (existingIndex >= 0) {
      const nextItems = [...selectedItems];
      nextItems[existingIndex] = {
        ...nextItems[existingIndex],
        quantity: quantityNum,
      };
      setSelectedItems(nextItems);
    } else {
      setSelectedItems((prev) => [
        ...prev,
        {
          waste_type_id: Number(selectedWasteType.wasteTypeId),
          quantity: quantityNum,
        },
      ]);
    }

    setSelectedType("");
    setQuantity("");
  };

  const handleRemoveItem = (wasteTypeId) => {
    setSelectedItems((prev) =>
      prev.filter((item) => String(item.waste_type_id) !== String(wasteTypeId)),
    );
  };

  const handleOpenFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    const invalidType = selectedFiles.some(
      (file) => !validTypes.includes(file.type),
    );
    if (invalidType) {
      toast.warning("Chỉ chấp nhận ảnh JPG, PNG, WEBP hoặc GIF");
    }

    const oversized = selectedFiles.some(
      (file) => file.size > MAX_FILE_SIZE_BYTES,
    );
    if (oversized) {
      toast.warning("Ảnh vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn 5MB.");
    }

    const validFiles = selectedFiles.filter(
      (file) =>
        validTypes.includes(file.type) && file.size <= MAX_FILE_SIZE_BYTES,
    );

    if (validFiles.length === 0) {
      e.target.value = "";
      return;
    }

    setNewImages((prev) => {
      const currentTotal = currentImages.length + prev.length;
      const remainingSlots = Math.max(0, MAX_IMAGES - currentTotal);
      if (remainingSlots === 0) {
        toast.warning("Bạn chỉ có thể có tối đa 5 ảnh cho báo cáo.");
        return prev;
      }

      if (validFiles.length > remainingSlots) {
        toast.warning("Số ảnh vượt giới hạn, chỉ thêm được tối đa 5 ảnh.");
      }

      const incoming = validFiles.slice(0, remainingSlots).map((file) => ({
        id: Date.now() + Math.random(),
        file,
        preview: URL.createObjectURL(file),
      }));

      return [...prev, ...incoming];
    });

    e.target.value = "";
  };

  const handleRemoveNewImage = (id) => {
    setNewImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target?.preview) {
        URL.revokeObjectURL(target.preview);
      }
      return prev.filter((img) => img.id !== id);
    });
  };

  const handleRemoveCurrentImage = (id) => {
    setCurrentImages((prev) => prev.filter((img) => img.id !== id));
  };

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

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      toast.warning("Vui lòng chọn vị trí hợp lệ");
      return;
    }

    if (selectedItems.length === 0) {
      toast.warning("Vui lòng thêm ít nhất 1 loại rác");
      return;
    }

    const totalWeight = selectedItems.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0,
    );

    onSubmit?.({
      items: selectedItems,
      gpsLat: lat,
      gpsLng: lng,
      description: description?.trim() || "Cập nhật mô tả mới",
      weight: totalWeight,
      retainedImageUris: currentImages.map((img) => img.uri).filter(Boolean),
      files: newImages.map((img) => img.file).filter(Boolean),
    });
  };

  return (
    <Dialog className=" w-[80vw]" open={open} onOpenChange={onOpenChange}>
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
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="min-w-full" id="waste-type">
                <SelectValue placeholder="Chọn loại rác" />
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="weight-kg">Khối lượng (kg)</Label>
            <div className="flex gap-2">
              <Input
                id="weight-kg"
                type="number"
                min="0"
                step="0.1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Ví dụ: 10"
              />
            </div>
          </div>

          <Button
            type="button"
            onClick={handleAddItem}
            className="gap-1 w-full"
          >
            <Plus size={14} />
            Thêm
          </Button>
          {selectedItemsWithMeta.length > 0 && (
            <div className="rounded-md border bg-slate-50 p-3">
              <ul className="space-y-2">
                {selectedItemsWithMeta.map((item) => (
                  <li
                    key={item.waste_type_id}
                    className="flex items-center justify-between rounded border bg-white px-3 py-2"
                  >
                    <p className="text-sm">
                      {item.wasteType.wasteTypeName} - {item.quantity}{" "}
                      {item.wasteType.unitType}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(item.waste_type_id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </li>
                ))}
              </ul>
              <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-blue-600">
                <CircleAlert size={14} />
                Tổng điểm ước tính: {totalEstimatedPoints.toFixed(2)} điểm
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Label>Ảnh báo cáo</Label>
            {currentImages.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Ảnh hiện tại (bấm X để bỏ ảnh không muốn giữ)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {currentImages.map((img) => (
                    <div
                      key={img.id}
                      className="relative overflow-hidden rounded-lg border bg-muted aspect-square"
                    >
                      <ImageSection
                        image={img.uri}
                        className="h-full"
                        imageClassName="h-full w-full rounded-none border-0"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveCurrentImage(img.id)}
                        className="absolute top-1 right-1 inline-flex items-center justify-center size-6 rounded-full bg-black/70 text-white hover:bg-black/85"
                        aria-label="Bỏ ảnh cũ"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {newImages.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Ảnh mới sẽ cập nhật
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {newImages.map((img) => (
                    <div
                      key={img.id}
                      className="relative overflow-hidden rounded-lg border bg-muted aspect-square"
                    >
                      <ImageSection
                        image={img.preview}
                        className="h-full"
                        imageClassName="h-full w-full rounded-none border-0"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveNewImage(img.id)}
                        className="absolute top-1 right-1 inline-flex items-center justify-center size-6 rounded-full bg-black/70 text-white hover:bg-black/85"
                        aria-label="Xóa ảnh"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentImages.length === 0 && newImages.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Chưa có ảnh báo cáo
              </p>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleOpenFilePicker}
              >
                {newImages.length > 0 ? "Thêm ảnh mới" : "Chọn ảnh mới"}
              </Button>
              {newImages.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    newImages.forEach((img) => {
                      if (img?.preview) {
                        URL.revokeObjectURL(img.preview);
                      }
                    });
                    setNewImages([]);
                  }}
                >
                  Bỏ tất cả ảnh mới
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Đang giữ {currentImages.length} ảnh cũ, thêm {newImages.length}{" "}
              ảnh mới. Tổng {currentImages.length + newImages.length}/
              {MAX_IMAGES} ảnh. Tối đa 5MB mỗi ảnh.
            </p>

            <Input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={handleImageChange}
            />
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
