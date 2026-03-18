import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Calendar, Loader2, MapPin, Phone, Recycle, Scale } from "lucide-react";
import {
  acceptCollectorReport,
  getCollectorReportById,
  markCollectorReportAsFake,
  scheduleCollectorReport,
  submitCollectorReportResult,
} from "@/services/collectorReport.service";
import { reverseGeocode } from "@/services/geocodingService";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import ImageSection from "@/components/ui/image-section";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function buildMapEmbedUrl(location) {
  if (!location?.lat || !location?.lng) {
    return "https://www.openstreetmap.org/export/embed.html";
  }

  const lat = Number(location.lat);
  const lng = Number(location.lng);
  const offset = 0.01;
  const minLng = lng - offset;
  const minLat = lat - offset;
  const maxLng = lng + offset;
  const maxLat = lat + offset;

  return `https://www.openstreetmap.org/export/embed.html?bbox=${minLng},${minLat},${maxLng},${maxLat}&layer=mapnik&marker=${lat},${lng}`;
}

function getStatusStyle(status) {
  if (status === "IN_PROGRESS") {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }
  if (status === "ASSIGNED") {
    return "bg-orange-50 text-orange-700 border-orange-200";
  }
  if (status === "COLLECTED") {
    return "bg-green-50 text-green-700 border-green-200";
  }
  return "bg-gray-50 text-gray-700 border-gray-200";
}

function mapApiData(apiData) {
  const lat = Number(apiData?.location?.lat);
  const lng = Number(apiData?.location?.lng);
  const reportId = apiData?.reportId || "";
  const reportCode = apiData?.reportCode || apiData?.wasteCode || reportId;

  return {
    reportId,
    reportCode,
    citizen: {
      fullname: apiData?.citizen?.fullname || "-",
      phone: apiData?.citizen?.phone || "-",
    },
    wasteType: {
      id: apiData?.wasteType?.id ?? null,
      name: apiData?.wasteType?.name || "-",
    },
    weight: apiData?.weight ?? null,
    actualQuantity: apiData?.actualQuantity ?? null,
    unitType: apiData?.unitType || "KG",
    location:
      Number.isFinite(lat) && Number.isFinite(lng)
        ? {
            lat,
            lng,
          }
        : null,
    images: Array.isArray(apiData?.images) ? apiData.images : [],
    status: apiData?.status || "ASSIGNED",
    areaName: "Không rõ vị trí",
  };
}

function getDefaultScheduleDateTime() {
  return new Date(Date.now() + 30 * 60000);
}

function toTimeHHmm(date) {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function buildDateTimeFromParts(dateValue, timeValue) {
  if (!(dateValue instanceof Date) || Number.isNaN(dateValue.getTime()))
    return null;
  if (!timeValue || !/^\d{2}:\d{2}$/.test(timeValue)) return null;
  const [hours, minutes] = timeValue.split(":").map(Number);
  const result = new Date(dateValue);
  result.setHours(hours, minutes, 0, 0);
  return Number.isNaN(result.getTime()) ? null : result;
}

function TaskDetail() {
  const navigate = useNavigate();
  const { taskId } = useParams();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(
    getDefaultScheduleDateTime(),
  );
  const [scheduledTime, setScheduledTime] = useState(
    toTimeHHmm(getDefaultScheduleDateTime()),
  );
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [submitSaving, setSubmitSaving] = useState(false);
  const [markingFake, setMarkingFake] = useState(false);
  const [fakeDialogOpen, setFakeDialogOpen] = useState(false);
  const [fakeNote, setFakeNote] = useState("");
  const [fakeFile, setFakeFile] = useState(null);
  const [fakeFilePreview, setFakeFilePreview] = useState("");
  const [actualQuantity, setActualQuantity] = useState("");
  const [quantityUnit, setQuantityUnit] = useState("KG");
  const [note, setNote] = useState("");
  const [resultFile, setResultFile] = useState(null);
  const [resultFilePreview, setResultFilePreview] = useState("");

  useEffect(() => {
    if (!resultFile) {
      setResultFilePreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(resultFile);
    setResultFilePreview(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [resultFile]);

  useEffect(() => {
    if (!fakeFile) {
      setFakeFilePreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(fakeFile);
    setFakeFilePreview(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [fakeFile]);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const response = await getCollectorReportById(taskId);
        const mapped = mapApiData(response?.data || {});

        if (mapped.location?.lat && mapped.location?.lng) {
          mapped.areaName = await reverseGeocode(
            mapped.location.lat,
            mapped.location.lng,
          );
        }

        setTask(mapped);
      } catch (error) {
        toast.error(error.message || "Không thể tải chi tiết nhiệm vụ");
        setTask(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [taskId]);

  const handleAcceptTask = async () => {
    if (!task || accepting) {
      return;
    }

    if (task.status === "IN_PROGRESS") {
      setActualQuantity(task.actualQuantity ?? "");
      setQuantityUnit(task.unitType || "KG");
      setNote("");
      setResultFile(null);
      setSubmitDialogOpen(true);
      return;
    }

    if (task.status !== "ASSIGNED") {
      toast.warning("Nhiệm vụ này không thể nhận thêm.");
      return;
    }

    setAccepting(true);
    try {
      await acceptCollectorReport(task.reportId);
      setTask((prev) => ({
        ...prev,
        status: "IN_PROGRESS",
      }));
      setSuccessDialogOpen(true);
    } catch (error) {
      toast.error(error.message || "Nhận nhiệm vụ thất bại");
    } finally {
      setAccepting(false);
    }
  };

  const handleSubmitResult = async () => {
    if (!task || submitSaving) {
      return;
    }

    const quantity = Number(actualQuantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast.warning("Vui lòng nhập khối lượng thực tế hợp lệ");
      return;
    }

    setSubmitSaving(true);
    try {
      const response = await submitCollectorReportResult(task.reportId, {
        actualQuantity: quantity,
        quantityUnit,
        note,
        file: resultFile,
      });

      const submittedQuantity = response?.data?.actualQuantity ?? quantity;

      setTask((prev) => ({
        ...prev,
        actualQuantity: submittedQuantity,
      }));
      setSubmitDialogOpen(false);
      toast.success("Cập nhật kết quả thu gom thành công");
    } catch (error) {
      toast.error(error.message || "Cập nhật kết quả thu gom thất bại");
    } finally {
      setSubmitSaving(false);
    }
  };

  const handleConfirmScheduleAndAccept = async () => {
    if (!task || scheduleSaving) {
      return;
    }

    const scheduledDateTime = buildDateTimeFromParts(
      scheduledDate,
      scheduledTime,
    );
    if (!scheduledDateTime) {
      toast.warning("Vui lòng chọn ngày và giờ thu gom hợp lệ.");
      return;
    }

    if (scheduledDateTime.getTime() < Date.now()) {
      toast.warning("Không thể chọn thời gian trong quá khứ.");
      return;
    }

    setScheduleSaving(true);
    setAccepting(true);
    try {
      await scheduleCollectorReport(
        task.reportId,
        scheduledDateTime.toISOString(),
      );
      await acceptCollectorReport(task.reportId);
      setTask((prev) => ({
        ...prev,
        status: "IN_PROGRESS",
      }));
      setScheduleDialogOpen(false);
      setSuccessDialogOpen(true);
    } catch (error) {
      toast.error(error.message || "Nhận nhiệm vụ thất bại");
    } finally {
      setScheduleSaving(false);
      setAccepting(false);
    }
  };

  const handleOpenMarkAsFakeDialog = () => {
    if (!task || task.status !== "IN_PROGRESS") {
      return;
    }

    setFakeNote("");
    setFakeFile(null);
    setFakeDialogOpen(true);
  };

  const handleMarkAsFake = async () => {
    if (!task || markingFake || task.status !== "IN_PROGRESS") {
      return;
    }

    setMarkingFake(true);
    try {
      const response = await markCollectorReportAsFake(task.reportId, {
        quantityUnit: task.unitType || "KG",
        note: fakeNote,
        file: fakeFile,
      });

      setTask((prev) => ({
        ...prev,
        status: response?.data?.status || "COLLECTED",
        actualQuantity: response?.data?.actualQuantity ?? 0,
      }));
      setFakeDialogOpen(false);
      toast.success("Đã đánh dấu báo cáo giả thành công");
    } catch (error) {
      toast.error(error.message || "Đánh dấu báo cáo giả thất bại");
    } finally {
      setMarkingFake(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen font-sans p-6">
        <div className="max-w-6xl mx-auto bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <div className="inline-flex items-center gap-2 text-gray-500">
            <Loader2 className="size-4 animate-spin" />
            Đang tải chi tiết nhiệm vụ...
          </div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="bg-gray-50 min-h-screen font-sans p-6">
        <div className="max-w-6xl mx-auto bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <p className="text-gray-500 mb-4">Không tìm thấy nhiệm vụ.</p>
          <button
            onClick={() => navigate("/collector/tasks")}
            className="px-4 py-2 rounded-lg bg-green-500 text-white font-semibold"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen font-sans pb-8">
      <main className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm">
            <Link to="/collector/tasks" className="text-green-500 font-medium">
              Nhiệm vụ
            </Link>
            <span className="text-gray-400"> / </span>
            <span className="text-gray-500">Chi tiết nhiệm vụ</span>
          </div>
          <span
            className={`px-3 py-1.5 rounded-xl text-sm border font-medium ${getStatusStyle(task.status)}`}
          >
            {task.status}
          </span>
        </div>

        <h1 className="text-3xl font-bold text-gray-900">
          Nhiệm vụ {task.reportCode}
        </h1>
        <p className="text-green-600 text-sm mt-1 mb-6">
          Báo cáo thu gom rác thải từ người dân
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-gray-800 font-semibold">
                  <MapPin className="w-4 h-4 text-green-500" />
                  Vị trí thu gom
                </div>
                <span className="text-sm text-gray-500 truncate max-w-105">
                  {task.areaName}
                </span>
              </div>
              <div className="h-64 rounded-xl overflow-hidden border border-gray-100">
                <iframe
                  title="Vị trí nhiệm vụ"
                  className="w-full h-full border-0"
                  src={buildMapEmbedUrl(task.location)}
                  loading="lazy"
                />
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 text-gray-800 font-semibold mb-3">
                <Recycle className="w-4 h-4 text-green-500" />
                Hình ảnh hiện trường (Từ người dân)
              </div>

              {task.images.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {task.images.map((image, index) => (
                    <ImageSection
                      key={`${image.file_uri}-${index}`}
                      title={`Hình hiện trường ${index + 1}`}
                      image={image}
                    />
                  ))}
                </div>
              ) : (
                <div className="h-40 rounded-xl border border-dashed border-gray-200 flex items-center justify-center text-sm text-gray-500">
                  Chưa có ảnh hiện trường
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3">
              <InfoRow label="Mã báo cáo" value={task.reportCode} />
              <InfoRow label="Trạng thái" value={task.status} />
              <InfoRow
                label="Loại rác"
                value={`${task.wasteType.name} (ID: ${task.wasteType.id ?? "-"})`}
              />
              <InfoRow
                label="Khối lượng ước tính"
                value={`${task.weight ?? "-"} ${task.unitType || ""}`}
                icon={<Scale className="w-4 h-4 text-green-500" />}
              />
              <InfoRow
                label="Khối lượng thực tế"
                value={`${task.actualQuantity ?? "-"} ${task.unitType || ""}`}
                icon={<Scale className="w-4 h-4 text-blue-500" />}
              />
              <InfoRow label="Người báo cáo" value={task.citizen.fullname} />
              <InfoRow
                label="Số điện thoại"
                value={task.citizen.phone}
                icon={<Phone className="w-4 h-4 text-emerald-500" />}
              />
              <InfoRow label="Địa chỉ" value={task.areaName} />
              <InfoRow
                label="Tọa độ"
                value={
                  task.location
                    ? `${task.location.lat}, ${task.location.lng}`
                    : "-"
                }
              />
            </div>

            <button
              onClick={() => {
                if (task.status === "ASSIGNED") {
                  const defaultDate = getDefaultScheduleDateTime();
                  setScheduledDate(defaultDate);
                  setScheduledTime(toTimeHHmm(defaultDate));
                  setScheduleDialogOpen(true);
                  return;
                }
                handleAcceptTask();
              }}
              disabled={
                accepting ||
                scheduleSaving ||
                markingFake ||
                task.status === "COLLECTED"
              }
              className="w-full rounded-xl bg-green-500 text-white py-3 font-semibold hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {accepting
                ? "Đang nhận..."
                : task.status === "IN_PROGRESS"
                  ? "Cập nhật kết quả thu gom"
                  : "Nhận nhiệm vụ"}
            </button>

            {task.status === "IN_PROGRESS" && (
              <button
                onClick={handleOpenMarkAsFakeDialog}
                disabled={
                  markingFake || submitSaving || accepting || scheduleSaving
                }
                className="w-full rounded-xl bg-red-500 text-white py-3 font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {markingFake ? "Đang xử lý..." : "Báo cáo giả"}
              </button>
            )}
          </div>
        </div>
      </main>

      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Lên lịch trước khi nhận nhiệm vụ</DialogTitle>
            <DialogDescription>
              Chọn thời gian dự kiến thu gom.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <p className="text-sm font-medium">Thời gian thu gom dự kiến</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-start font-normal"
                    disabled={scheduleSaving}
                  >
                    <Calendar className="mr-2 size-4" />
                    {scheduledDate
                      ? scheduledDate.toLocaleDateString("vi-VN")
                      : "Chọn ngày"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={scheduledDate}
                    onSelect={(date) => {
                      if (date) setScheduledDate(date);
                    }}
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                disabled={scheduleSaving}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setScheduleDialogOpen(false)}
              disabled={scheduleSaving}
            >
              Hủy
            </Button>
            <Button
              onClick={handleConfirmScheduleAndAccept}
              disabled={scheduleSaving}
            >
              {scheduleSaving ? "Đang xử lý..." : "Xác nhận và nhận nhiệm vụ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nhận nhiệm vụ thành công</DialogTitle>
            <DialogDescription>
              Bạn có thể tiến hành thu gom rác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setSuccessDialogOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={fakeDialogOpen} onOpenChange={setFakeDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Đánh dấu báo cáo giả</DialogTitle>
            <DialogDescription>
              Nhập ghi chú và ảnh minh chứng trước khi xác nhận.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-1">Ghi chú</p>
              <Textarea
                value={fakeNote}
                onChange={(e) => setFakeNote(e.target.value)}
                placeholder="Ví dụ: Không tìm thấy rác tại vị trí báo cáo"
                rows={3}
              />
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Ảnh minh chứng</p>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setFakeFile(e.target.files?.[0] || null)}
              />

              {fakeFilePreview && (
                <div className="mt-3">
                  <ImageSection
                    title="Xem trước ảnh minh chứng"
                    image={fakeFilePreview}
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFakeDialogOpen(false)}
              disabled={markingFake}
            >
              Hủy
            </Button>
            <Button onClick={handleMarkAsFake} disabled={markingFake}>
              {markingFake ? "Đang xử lý..." : "Xác nhận báo cáo giả"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Cập nhật kết quả thu gom</DialogTitle>
            <DialogDescription>Nhập thông tin thực tế.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-1">Khối lượng thực tế</p>
              <Input
                type="number"
                min="0"
                step="0.1"
                value={actualQuantity}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "") {
                    setActualQuantity("");
                    return;
                  }

                  const parsed = Number(value);
                  if (Number.isNaN(parsed) || parsed < 0) return;

                  setActualQuantity(value);
                }}
                placeholder="Ví dụ: 4"
              />
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Đơn vị</p>
              <Input
                value={quantityUnit}
                onChange={(e) => setQuantityUnit(e.target.value.toUpperCase())}
                placeholder="KG"
              />
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Ghi chú</p>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ví dụ: đầy đủ"
                rows={3}
              />
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Ảnh minh chứng</p>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setResultFile(e.target.files?.[0] || null)}
              />

              {resultFilePreview && (
                <div className="mt-3">
                  <ImageSection
                    title="Xem trước ảnh minh chứng"
                    image={resultFilePreview}
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSubmitDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button onClick={handleSubmitResult} disabled={submitSaving}>
              {submitSaving ? "Đang gửi..." : "Xác nhận gửi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoRow({ label, value, icon }) {
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className="text-sm text-gray-800 font-semibold inline-flex items-center gap-2 wrap-break-word">
        {icon}
        {value}
      </p>
    </div>
  );
}

export default TaskDetail;
