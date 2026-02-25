import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Phone,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  Check,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function ReportDetailDialog({ isOpen, onClose, report, getStatusColor }) {
  if (!report) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="md:min-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chi tiết báo cáo</DialogTitle>
          <DialogDescription>
            Xem thông tin chi tiết về báo cáo thu gom rác thải
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Steps */}
          <div>
            <h3 className="font-semibold mb-4">Tiến độ thu gom</h3>
            <div className="relative px-8">
              {/* Progress Line */}
              <div className="absolute top-5 left-8 right-8 h-0.5 bg-gray-200">
                <div
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{
                    width: `${
                      (report.progress.filter((p) => p.completed).length /
                        report.progress.length) *
                      100
                    }%`,
                  }}
                />
              </div>

              <div className="flex items-start justify-between">
                {report.progress.map((step, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center relative"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 relative z-10 ${
                        step.completed
                          ? "bg-green-500 border-green-500"
                          : index ===
                              report.progress.findIndex((p) => !p.completed)
                            ? "bg-white border-green-500 ring-4 ring-green-100"
                            : "bg-white border-gray-300"
                      }`}
                    >
                      {step.completed ? (
                        <Check className="w-6 h-6 text-white " />
                      ) : index ===
                        report.progress.findIndex((p) => !p.completed) ? (
                        <Circle className="w-5 h-5 text-green-500 fill-green-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-300" />
                      )}
                    </div>
                    <p
                      className={`text-xs mt-2 text-center max-w-24 ${
                        step.completed ? "font-medium" : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Evidence Section */}
          <div>
            <h3 className="font-semibold mb-4">Minh chứng thu gom</h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Citizen Images */}
              <div>
                <p className="text-sm text-green-600 font-medium mb-2">
                  Ảnh người dân
                </p>
                {report.citizenImages && report.citizenImages.length > 0 ? (
                  <img
                    src={report.citizenImages[0]}
                    alt="Ảnh người dân"
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-100 rounded-lg border flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">Chưa có ảnh</p>
                  </div>
                )}
              </div>

              {/* Collector Images */}
              <div>
                <p className="text-sm text-green-600 font-medium mb-2">
                  Ảnh thu gom
                </p>
                {report.collectorImages && report.collectorImages.length > 0 ? (
                  <img
                    src={report.collectorImages[0]}
                    alt="Ảnh thu gom"
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-100 rounded-lg border flex items-center justify-center">
                    <div className="text-center">
                      <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Đang chờ người thu gom
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Collector Information */}
          {report.collector && (
            <div>
              <h3 className="font-semibold mb-4">Thông tin thu gom</h3>
              <div className="bg-gray-50 rounded-lg p-4 border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={report.collector.avatar} />
                      <AvatarFallback>
                        {report.collector.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{report.collector.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {report.collector.phone}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-1">
                    Thời gian dự kiến (ETA)
                  </p>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <p className="font-semibold">
                      {report.collector.estimatedTime}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Location Map */}
          <div>
            <h3 className="font-semibold mb-4">Vị trí điểm rác</h3>
            <div className="space-y-3">
              <div className="h-64 rounded-lg overflow-hidden border">
                <MapContainer
                  center={[report.latitude, report.longitude]}
                  zoom={15}
                  style={{ height: "100%", width: "100%" }}
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[report.latitude, report.longitude]}>
                    <Popup>{report.location}</Popup>
                  </Marker>
                </MapContainer>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border">
                <p className="font-medium">{report.location}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button variant="destructive" className="flex-1">
              Gửi khiếu nại
            </Button>
            <Button className="flex-1 bg-green-500 hover:bg-green-600">
              Trở lại
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ReportDetailDialog;
