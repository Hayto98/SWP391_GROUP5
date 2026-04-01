import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import TrashSelection from "./components/TrashSelection";
import LocationSelection from "./components/LocationSelection";
import ReportSummary from "./components/ReportSummary";
import { getWasteTypes } from "@/services/wasteService";
import { createWasteReport } from "@/services/wasteReportService";
import { reverseGeocode } from "@/services/geocodingService";
import { useNavigate } from "react-router-dom";

function TrashReport() {
  const [wasteTypes, setWasteTypes] = useState([]);
  const [loadingWasteTypes, setLoadingWasteTypes] = useState(true);
  const [selectedType, setSelectedType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const selectedWasteType = useMemo(() => {
    return wasteTypes.find(
      (item) => String(item.wasteTypeId) === String(selectedType),
    );
  }, [wasteTypes, selectedType]);

  const selectedItemsWithMeta = useMemo(() => {
    return selectedItems
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
  }, [selectedItems, wasteTypes]);

  useEffect(() => {
    const fetchWasteTypes = async () => {
      setLoadingWasteTypes(true);
      try {
        const data = await getWasteTypes();
        setWasteTypes(data);
      } catch (error) {
        toast.error(error.message || "Không thể tải danh sách loại rác");
      } finally {
        setLoadingWasteTypes(false);
      }
    };

    fetchWasteTypes();
  }, []);

  const handleMapClick = async (latlng) => {
    const name = await reverseGeocode(latlng.lat, latlng.lng);
    setSelectedMarker({
      id: Date.now(),
      position: [latlng.lat, latlng.lng],
      name,
    });
  };

  const handleDeleteMarker = () => {
    setSelectedMarker(null);
  };

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

    const minKgRequired = Number(selectedWasteType.minKgRequired ?? 0);
    const rawMaxKgRequired = selectedWasteType.maxKgRequired;
    const hasMaxKgLimit =
      rawMaxKgRequired !== null &&
      rawMaxKgRequired !== undefined &&
      Number(rawMaxKgRequired) > 0;
    const maxKgRequired = hasMaxKgLimit ? Number(rawMaxKgRequired) : null;

    if (quantityNum < minKgRequired) {
      toast.warning(
        `Khối lượng phải từ ${minKgRequired} ${selectedWasteType.unitType}`,
      );
      return;
    }

    if (hasMaxKgLimit && quantityNum > maxKgRequired) {
      toast.warning(
        `Khối lượng tối đa là ${maxKgRequired} ${selectedWasteType.unitType}`,
      );
      return;
    }

    const existingIndex = selectedItems.findIndex(
      (item) =>
        String(item.waste_type_id) === String(selectedWasteType.wasteTypeId),
    );

    if (selectedItems.length >= 5 && existingIndex < 0) {
      toast.warning("Một báo cáo chỉ được thêm tối đa 5 loại rác");
      return;
    }

    if (existingIndex >= 0) {
      const nextItems = [...selectedItems];
      nextItems[existingIndex] = {
        ...nextItems[existingIndex],
        quantity: quantityNum,
      };
      setSelectedItems(nextItems);
      toast.success("Đã cập nhật khối lượng cho loại rác đã chọn");
    } else {
      setSelectedItems((prev) => [
        ...prev,
        {
          waste_type_id: Number(selectedWasteType.wasteTypeId),
          quantity: quantityNum,
        },
      ]);
      toast.success("Đã thêm loại rác vào báo cáo");
    }

    setSelectedType("");
    setQuantity("");
  };

  const handleRemoveItem = (wasteTypeId) => {
    setSelectedItems((prev) =>
      prev.filter((item) => String(item.waste_type_id) !== String(wasteTypeId)),
    );
  };

  const handleSendReport = async () => {
    if (selectedItems.length === 0) {
      toast.warning("Vui lòng thêm ít nhất 1 loại rác vào báo cáo");
      return;
    }

    if (!selectedMarker) {
      toast.warning("Vui lòng chọn vị trí thu gom");
      return;
    }

    const fallbackDescription = selectedItemsWithMeta
      .map((item) => `${item.wasteType.wasteTypeName} (${item.quantity})`)
      .join(", ");

    const finalDescription = description?.trim() || fallbackDescription || "";

    if (!finalDescription) {
      toast.warning("Vui lòng nhập mô tả báo cáo");
      return;
    }

    if (files.length === 0) {
      toast.warning("Vui lòng tải lên ít nhất 1 ảnh");
      return;
    }

    const reportPayload = new FormData();
    reportPayload.append("items", JSON.stringify(selectedItems));
    reportPayload.append("gpsLat", String(selectedMarker.position[0]));
    reportPayload.append("gpsLng", String(selectedMarker.position[1]));
    reportPayload.append("description", finalDescription);
    reportPayload.append(
      "weight",
      String(
        selectedItems.reduce(
          (sum, item) => sum + Number(item.quantity || 0),
          0,
        ),
      ),
    );
    files.forEach((image) => {
      if (image?.file) {
        reportPayload.append("file", image.file);
      }
    });

    setSubmitting(true);
    try {
      const res = await createWasteReport(reportPayload);
      toast.success("Gửi báo cáo thành công");

      setSelectedType("");
      setQuantity("");
      setSelectedItems([]);
      setDescription("");
      setFiles([]);
      setSelectedMarker(null);
      setTimeout(() => {
        navigate(`/citizen/reports/${res.data.reportId}`);
      }, 2000);
    } catch (error) {
      toast.error(error.message || "Gửi báo cáo thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAIPrediction = (analysis) => {
    if (!analysis || analysis.length === 0) {
      toast.info("AI không nhận diện được loại rác nào rõ ràng trong ảnh.");
      return;
    }

    // Tự động chọn loại rác đầu tiên được hỗ trợ
    const supportedMatch = analysis.find((item) => item.isSupported);
    if (supportedMatch && supportedMatch.matchedWasteTypeId) {
      setSelectedType(String(supportedMatch.matchedWasteTypeId));
      toast.success(
        `Đã tự động chọn loại rác: ${supportedMatch.matchedWasteTypeName}`,
      );
    }

    const descriptionElements = analysis.map((item, index) => {
      if (item.isSupported) {
        return (
          <div key={index} className="flex items-start gap-2 mt-1.5 text-sm">
            <span className="text-green-600 font-bold mt-0.5">✓</span>
            <span>
              <span className="font-semibold">{item.originalName}</span>: Có hỗ
              trợ ({item.matchedWasteTypeName})
            </span>
          </div>
        );
      } else {
        return (
          <div key={index} className="flex items-start gap-2 mt-1.5 text-sm">
            <span className="text-destructive font-bold mt-0.5">✕</span>
            <span className="text-muted-foreground">
              <span className="font-semibold">{item.originalName}</span>: Hệ
              thống chưa hỗ trợ thu gom
            </span>
          </div>
        );
      }
    });

    toast("Kết quả AI phân tích rác:", {
      description: <div>{descriptionElements}</div>,
      duration: 30000,
    });
  };

  return (
    <Card className="space-y-4">
      <CardContent>
        <TrashSelection
          wasteTypes={wasteTypes}
          loadingWasteTypes={loadingWasteTypes}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          quantity={quantity}
          setQuantity={setQuantity}
          selectedItems={selectedItems}
          onAddItem={handleAddItem}
          onRemoveItem={handleRemoveItem}
        />

        <Separator className="my-4" />

        <LocationSelection
          marker={selectedMarker}
          onMapClick={handleMapClick}
          onDeleteMarker={handleDeleteMarker}
        />

        <Separator className="my-6" />

        <ReportSummary
          description={description}
          setDescription={setDescription}
          files={files}
          setFiles={setFiles}
          onSubmit={handleSendReport}
          submitting={submitting}
          onAIPrediction={handleAIPrediction}
        />
      </CardContent>
    </Card>
  );
}

export default TrashReport;
