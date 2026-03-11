import { CardHeader } from "@/components/ui/card";
import { X, MapPinOffIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MapContainer,
  TileLayer,
  useMapEvents,
  Marker,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useState } from "react";
import { toast } from "sonner";

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// LocationPicker component - must be inside MapContainer
function LocationPicker({ onChange }) {
  useMapEvents({
    click(e) {
      onChange?.(e.latlng);
    },
  });
  return null;
}

function LocationSelection({ marker, onMapClick, onDeleteMarker }) {
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [mapCenter, setMapCenter] = useState([10.7769, 106.7009]);
  const [mapRef, setMapRef] = useState(null);

  const getUserLocation = () => {
    setIsLoadingLocation(true);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          // Set marker tại vị trí người dùng
          onMapClick?.({ lat, lng });

          // Di chuyển map đến vị trí người dùng
          setMapCenter([lat, lng]);
          if (mapRef) {
            mapRef.flyTo([lat, lng], 17);
          }

          setIsLoadingLocation(false);
        },
        (error) => {
          toast.error(
            "Không thể lấy vị trí của bạn. Vui lòng cho phép truy cập vị trí.",
          );
          setIsLoadingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0,
        },
      );
    } else {
      toast.error("Trình duyệt không hỗ trợ định vị");
      setIsLoadingLocation(false);
    }
  };

  return (
    <>
      <CardHeader className="text-start px-0">
        <div className="flex ">
          <h3 className="font-semibold">Vị trí thu gom </h3>
          <span className="text-destructive"> *</span>

          {/* <span className="text-sm text-muted-foreground">
            Đã chọn {markers.length} vị trí
          </span> */}
        </div>
      </CardHeader>

      <div className="space-y-4">
        {/* Map Section */}
        <div className="relative border rounded-lg overflow-hidden h-80">
          <Button
            onClick={getUserLocation}
            disabled={isLoadingLocation}
            className="absolute top-2 right-2 z-1000 shadow-lg"
            size="sm"
          >
            Lấy vị trí hiện tại của bạn
          </Button>
          <MapContainer
            ref={setMapRef}
            center={mapCenter}
            zoom={13}
            className="h-full w-full z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationPicker onChange={onMapClick} />
            {marker && (
              <Marker key={marker.id} position={marker.position}>
                <Popup>
                  <div className="space-y-2 text-sm">
                    <p className="text-xs text-muted-foreground">
                      Vị trí: {marker.name}
                    </p>

                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteMarker(marker.id);
                      }}
                      variant="destructive"
                      className="w-full"
                    >
                      Xoá vị trí
                    </Button>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
      </div>

      {/* Danh sách các vị trí đã chọn */}
      {marker && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2 mt-4">
            vị trí đã chọn
          </h3>
          <div className="space-y-2">
            <div
              key={marker.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-green-50 border-green-200"
            >
              <div className="flex items-start gap-3">
                <button className="flex items-center justify-center size-6 ">
                  <MapPinOffIcon />
                </button>
                <div className="text-start">
                  <p className="font-medium text-sm">Điểm thu gom đã chọn</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {marker.name}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-destructive"
                onClick={() => onDeleteMarker(marker.id)}
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default LocationSelection;
