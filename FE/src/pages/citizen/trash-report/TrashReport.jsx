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

function TrashReport() {
  const [wasteTypes, setWasteTypes] = useState([]);
  const [loadingWasteTypes, setLoadingWasteTypes] = useState(true);
  const [selectedType, setSelectedType] = useState("");
  const [weight, setWeight] = useState("");
  const [description, setDescription] = useState("");
  const [fileUri, setFileUri] = useState("");
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedWasteType = useMemo(
    () => wasteTypes.find((item) => item.wasteTypeId === selectedType),
    [wasteTypes, selectedType],
  );

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

  const handleSendReport = async () => {
    if (!selectedType) {
      toast.warning("Vui lòng chọn 1 loại rác");
      return;
    }

    const weightNum = Number(weight);
    if (!weight || Number.isNaN(weightNum) || weightNum <= 0) {
      toast.warning("Vui lòng nhập khối lượng hợp lệ");
      return;
    }

    if (!selectedMarker) {
      toast.warning("Vui lòng chọn vị trí thu gom");
      return;
    }

    const finalDescription =
      description?.trim() || selectedWasteType?.wasteTypeName || "";

    if (!finalDescription) {
      toast.warning("Vui lòng nhập mô tả báo cáo");
      return;
    }

    const reportPayload = {
      wasteTypeId: selectedType,
      gpsLat: selectedMarker.position[0],
      gpsLng: selectedMarker.position[1],
      weight: weightNum,
      description: finalDescription,
      fileUri: fileUri?.trim() || undefined,
    };

    setSubmitting(true);
    try {
      await createWasteReport(reportPayload);
      toast.success("Gửi báo cáo thành công");
      setSelectedType("");
      setWeight("");
      setDescription("");
      setFileUri("");
      setSelectedMarker(null);
    } catch (error) {
      toast.error(error.message || "Gửi báo cáo thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="space-y-4">
      <CardContent>
        <TrashSelection
          wasteTypes={wasteTypes}
          loadingWasteTypes={loadingWasteTypes}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          weight={weight}
          setWeight={setWeight}
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
          fileUri={fileUri}
          setFileUri={setFileUri}
          onSubmit={handleSendReport}
          submitting={submitting}
        />
      </CardContent>
    </Card>
  );
}

export default TrashReport;
