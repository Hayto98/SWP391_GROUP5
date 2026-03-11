import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  AlertCircle,
  Check,
  Circle,
  Clock,
  Loader2,
} from "lucide-react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { getReportById } from "@/services/wasteReportService";
import { reverseGeocode } from "@/services/geocodingService";
import { getWasteTypeById } from "@/services/wasteService";
import ImageSection from "@/components/ui/image-section";

// Fix Leaflet default icon issue
// eslint-disable-next-line no-underscore-dangle
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const progressTemplate = {
  PENDING: [
    { step: "reported", label: "Đã gửi báo cáo", completed: true },
    {
      step: "accepted",
      label: "Doanh nghiệp tiếp nhận",
      completed: false,
    },
    {
      step: "assigned",
      label: "Phân công người thu gom",
      completed: false,
    },
    { step: "collected", label: "Đã thu gom", completed: false },
  ],
  ACCEPTED: [
    { step: "reported", label: "Đã gửi báo cáo", completed: true },
    {
      step: "accepted",
      label: "Doanh nghiệp tiếp nhận",
      completed: true,
    },
    {
      step: "assigned",
      label: "Phân công người thu gom",
      completed: false,
    },
    { step: "collected", label: "Đã thu gom", completed: false },
  ],
  ASSIGNED: [
    { step: "reported", label: "Đã gửi báo cáo", completed: true },
    {
      step: "accepted",
      label: "Doanh nghiệp tiếp nhận",
      completed: true,
    },
    {
      step: "assigned",
      label: "Phân công người thu gom",
      completed: true,
    },
    { step: "collected", label: "Đã thu gom", completed: false },
  ],
  IN_PROGRESS: [
    { step: "reported", label: "Đã gửi báo cáo", completed: true },
    {
      step: "accepted",
      label: "Doanh nghiệp tiếp nhận",
      completed: true,
    },
    {
      step: "assigned",
      label: "Phân công người thu gom",
      completed: true,
    },
    { step: "collected", label: "Đã thu gom", completed: false },
  ],
  COLLECTED: [
    { step: "reported", label: "Đã gửi báo cáo", completed: true },
    {
      step: "accepted",
      label: "Doanh nghiệp tiếp nhận",
      completed: true,
    },
    {
      step: "assigned",
      label: "Phân công người thu gom",
      completed: true,
    },
    { step: "collected", label: "Đã thu gom", completed: true },
  ],
  REJECTED: [
    { step: "reported", label: "Đã gửi báo cáo", completed: true },
    {
      step: "accepted",
      label: "Doanh nghiệp tiếp nhận",
      completed: false,
    },
    {
      step: "assigned",
      label: "Phân công người thu gom",
      completed: false,
    },
    { step: "collected", label: "Đã thu gom", completed: false },
    { step: "rejected", label: "Báo cáo bị từ chối", completed: true },
  ],
};

// Keep compatibility in case backend still returns OPEN for old records.
progressTemplate.OPEN = progressTemplate.PENDING;

function mapReport(report) {
  const lat = Number(report?.location?.lat || 0);
  const lng = Number(report?.location?.lng || 0);
  const rawStatus = report?.status || "PENDING";
  const normalizedWeightKg =
    report?.weightKg !== undefined && report?.weightKg !== null
      ? Number(report.weightKg)
      : null;

  const collectedRecord = report?.collectedRecord || null;

  const collectorProfile =
    report?.collector || report?.assignedCollector || null;

  const collectorImages = Array.isArray(report?.collectorImages)
    ? report.collectorImages
    : [];

  const fallbackCollectedImages = [
    collectedRecord?.fileUri,
    ...(Array.isArray(collectedRecord?.completionImages)
      ? collectedRecord.completionImages
      : []),
  ].filter(Boolean);

  return {
    id: report?.reportId || report?.wasteReportId,
    title: report?.wasteType?.name || "-",
    unitType: report?.unitType || report?.wasteType?.unitType || "-",
    date: report?.createdAt
      ? format(new Date(report.createdAt), "dd/MM/yyyy", { locale: vi })
      : "-",
    createdAt: report?.createdAt,
    location: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    latitude: lat,
    longitude: lng,
    progress: progressTemplate[rawStatus] || progressTemplate.PENDING,
    description: report?.description || "",
    weightKg:
      Number.isFinite(normalizedWeightKg) && normalizedWeightKg > 0
        ? normalizedWeightKg
        : null,
    citizenImages: Array.isArray(report?.images)
      ? report.images.map((item) => item?.file_uri).filter(Boolean)
      : (report.attachments || []).map((item) => item.fileUri),
    collectorImages:
      collectorImages.length > 0 ? collectorImages : fallbackCollectedImages,
    collector: collectorProfile
      ? {
          name: collectorProfile.fullname,
          phone: collectorProfile.phone,
          avatar: collectorProfile.avatar,
          estimatedTime: "Đang cập nhật",
        }
      : null,
    collectedRecord,
    actualQuantity:
      report?.actualQuantity ?? collectedRecord?.actualQuantityValue ?? null,
    reason: report?.reason || null,
    status: rawStatus,
    wasteTypeDetail: null,
  };
}

async function mapReportWithLocation(report) {
  const mapped = mapReport(report);
  const locationName = await reverseGeocode(mapped.latitude, mapped.longitude);
  return {
    ...mapped,
    location: locationName,
  };
}

function ReportDetailPage() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const response = await getReportById(reportId);
        const detailData = response?.data || {};
        const detailedReport = await mapReportWithLocation(detailData);

        if (detailData?.wasteType?.id) {
          try {
            const wasteTypeResponse = await getWasteTypeById(
              detailData.wasteType.id,
            );
            detailedReport.wasteTypeDetail = wasteTypeResponse?.data || null;
          } catch {
            detailedReport.wasteTypeDetail = null;
          }
        }

        setReport(detailedReport);
      } catch (error) {
        toast.error(error.message || "Không thể tải chi tiết báo cáo");
        setReport(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [reportId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Đang tải chi tiết báo cáo...
        </CardContent>
      </Card>
    );
  }

  if (!report) {
    return (
      <Card>
        <CardContent className="py-10 text-center space-y-3">
          <p className="text-muted-foreground">Không tìm thấy báo cáo</p>
          <Button onClick={() => navigate("/citizen/reports")}>
            Quay lại danh sách
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentStepIndex = report.progress.findIndex((step) => !step.completed);
  const completedSteps = report.progress.filter(
    (step) => step.completed,
  ).length;
  const progressWidth = report.progress.length
    ? (completedSteps / report.progress.length) * 100
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Chi tiết báo cáo</h2>
          <p className="text-sm text-muted-foreground">
            Xem thông tin chi tiết về báo cáo thu gom rác thải
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => navigate("/citizen/reports")}
        >
          <ArrowLeft className="size-4" />
          Quay lại
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin loại rác</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 border">
              <p className="text-xs text-muted-foreground">Tên loại rác</p>
              <p className="font-medium">
                {report.wasteTypeDetail?.wasteTypeName || report.title}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border">
              <p className="text-xs text-muted-foreground">Đơn vị</p>
              <p className="font-medium">
                {report.wasteTypeDetail?.unitType || report.unitType || "-"}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border">
              <p className="text-xs text-muted-foreground">Khối lượng (kg)</p>
              <p className="font-medium">{report.weightKg ?? "-"}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border">
              <p className="text-xs text-muted-foreground">
                Mô tả cấu hình điểm
              </p>
              <p className="font-medium">
                {report.wasteTypeDetail?.rewardConfig?.description || "-"}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border md:col-span-2">
              <p className="text-xs text-muted-foreground">Mô tả báo cáo</p>
              <p className="font-medium whitespace-pre-line wrap-break-word">
                {report.description || "-"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tiến độ thu gom</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative px-2 md:px-8">
            <div className="absolute top-5 left-2 right-2 md:left-8 md:right-8 h-0.5 bg-gray-200">
              <div
                className="h-full bg-green-500 transition-all duration-500"
                style={{ width: `${progressWidth}%` }}
              />
            </div>

            <div className="flex items-start justify-between gap-2">
              {report.progress.map((step, index) => (
                <div
                  key={step.step}
                  className="flex flex-col items-center relative flex-1"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 relative z-10 ${
                      step.completed
                        ? "bg-green-500 border-green-500"
                        : index === currentStepIndex
                          ? "bg-white border-green-500 ring-4 ring-green-100"
                          : "bg-white border-gray-300"
                    }`}
                  >
                    {step.completed ? (
                      <Check className="w-6 h-6 text-white" />
                    ) : index === currentStepIndex ? (
                      <Circle className="w-5 h-5 text-green-500 fill-green-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-300" />
                    )}
                  </div>
                  <p
                    className={`text-xs mt-2 text-center max-w-24 ${step.completed ? "font-medium" : "text-muted-foreground"}`}
                  >
                    {step.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Minh chứng thu gom</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-green-600 font-medium mb-2">
                Ảnh người dân
              </p>
              {report.citizenImages && report.citizenImages.length > 0 ? (
                <ImageSection
                  image={report.citizenImages?.[0]}
                  className="flex-1"
                />
              ) : (
                <div className="w-full h-60 bg-gray-100 rounded-lg border flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">Chưa có ảnh</p>
                </div>
              )}
            </div>

            <div>
              <p className="text-sm text-green-600 font-medium mb-2">
                Ảnh thu gom
              </p>
              {report.collectorImages && report.collectorImages.length > 0 ? (
                <ImageSection
                  image={report.collectorImages[0]}
                  className="flex-1"
                />
              ) : (
                <div className="w-full h-60 bg-gray-100 rounded-lg border flex items-center justify-center">
                  <div className="text-center">
                    <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {report.status === "COLLECTED"
                        ? "Chưa có ảnh minh chứng"
                        : "Đang chờ người thu gom"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {report.status === "COLLECTED" && report.collectedRecord && (
        <Card>
          <CardHeader>
            <CardTitle>Kết quả thu gom</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 border">
                <p className="text-xs text-muted-foreground">
                  Khối lượng thực tế
                </p>
                <p className="font-medium">
                  {report.collectedRecord.actualQuantityValue ??
                    report.actualQuantity ??
                    "-"}{" "}
                  {report.collectedRecord.quantityUnit || report.unitType || ""}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border">
                <p className="text-xs text-muted-foreground">
                  Thời điểm ghi nhận
                </p>
                <p className="font-medium">
                  {report.collectedRecord.recordedAt
                    ? format(
                        new Date(report.collectedRecord.recordedAt),
                        "HH:mm dd/MM/yyyy",
                        {
                          locale: vi,
                        },
                      )
                    : "-"}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border md:col-span-2">
                <p className="text-xs text-muted-foreground">Ghi chú</p>
                <p className="font-medium whitespace-pre-line wrap-break-word">
                  {report.collectedRecord.note || "Không có ghi chú"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {report.status === "REJECTED" && (
        <Card>
          <CardHeader>
            <CardTitle>Lý do từ chối</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700 whitespace-pre-line wrap-break-word">
                {report.reason || "Không có lý do từ chối"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {report.collector && (
        <Card>
          <CardHeader>
            <CardTitle>Thông tin thu gom</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Vị trí điểm rác</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
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
        </CardContent>
      </Card>

      <div className="flex flex-col md:flex-row gap-3">
        <Button
          variant="destructive"
          className="flex-1"
          onClick={() => navigate("/citizen/complaints")}
        >
          Gửi khiếu nại
        </Button>
        <Button
          className="flex-1 bg-green-500 hover:bg-green-600"
          onClick={() => navigate("/citizen/reports")}
        >
          Trở lại
        </Button>
      </div>
    </div>
  );
}

export default ReportDetailPage;
