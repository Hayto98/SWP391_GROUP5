import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { toast } from "sonner";
import axios from "axios";
import TrashSelection, { trashTypes } from "./components/TrashSelection";
import LocationSelection from "./components/LocationSelection";
import ReportSummary from "./components/ReportSummary";

function TrashReport() {
  const [trashes, setTrashes] = useState([]);
  const [selectedType, setSelectedType] = useState("");
  const [weight, setWeight] = useState("");
  const [locationType, setLocationType] = useState("nha-rieng");
  const [description, setDescription] = useState("");
  const [markersByType, setMarkersByType] = useState({});

  const selectedTrashType = trashTypes.find((t) => t.name === selectedType);

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=vi`,
        {
          headers: {
            Accept: "application/json",
          },
        },
      );

      if (res.data && res.data.display_name) {
        return res.data.display_name;
      }
    } catch (error) {
      toast.error("Lỗi khi lấy tên vị trí.");
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  const handleMapClick = async (latlng) => {
    const name = await reverseGeocode(latlng.lat, latlng.lng);
    const newMarker = {
      id: Date.now(),
      position: [latlng.lat, latlng.lng],
      type: locationType,
      name,
    };
    setMarkersByType((prev) => ({ ...prev, [locationType]: newMarker }));
  };

  const handleDeleMarker = () => {
    setMarkersByType((prev) => ({ ...prev, [locationType]: null }));
  };

  const handleAddTrash = () => {
    if (!selectedType || !weight) {
      toast.warning("Vui lòng chọn loại rác và nhập khối lượng");
      return;
    }

    const trashType = trashTypes.find((t) => t.name === selectedType);
    const weightNum = parseFloat(weight);

    if (weightNum < trashType.minWeight) {
      toast.warning(
        `Khối lượng tối thiểu cho ${trashType.label} là ${trashType.minWeight}kg`,
      );
      return;
    }

    const newTrash = {
      id: Date.now(),
      type: trashType.label,
      weight: weightNum,
      points: weightNum * trashType.points,
    };

    setTrashes([...trashes, newTrash]);
    setSelectedType("");
    setWeight("");
  };

  const handleClearAll = () => {
    setTrashes([]);
    setSelectedType("");
    setWeight("");
  };

  const handleSendReport = () => {
    toast.success("gửi báo cáo thành công");
  };

  return (
    <Card className="space-y-4">
      <CardContent>
        <TrashSelection
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          weight={weight}
          setWeight={setWeight}
          trashes={trashes}
          onAddTrash={handleAddTrash}
          onClearAll={handleClearAll}
        />

        <Separator className="my-4" />

        <LocationSelection
          locationType={locationType}
          setLocationType={setLocationType}
          marker={markersByType[locationType] ?? null}
          markersByType={markersByType}
          onMapClick={handleMapClick}
          onDeleteMarker={handleDeleMarker}
        />

        <Separator className="my-6" />

        <ReportSummary
          description={description}
          setDescription={setDescription}
          onSubmit={handleSendReport}
        />
      </CardContent>
    </Card>
  );
}

export default TrashReport;
