import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Download,
  Loader2,
  MapPin,
  Recycle,
  Scale,
  User,
  Phone,
} from "lucide-react";
import {
  getCollectorReportById,
  getCollectorReports,
} from "@/services/collectorReport.service";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ITEMS_PER_PAGE = 8;

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function toCsvValue(value) {
  const raw = String(value ?? "");
  return `"${raw.replace(/"/g, '""')}"`;
}

function toLocalDateKey(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatAreaFromLocation(location) {
  const lat = Number(location?.lat);
  const lng = Number(location?.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return "Không rõ vị trí";
  }

  return `${lat}, ${lng}`;
}

function History() {
  const [allJobs, setAllJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [detailArea, setDetailArea] = useState("Không rõ vị trí");

  const [currentPage, setCurrentPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [wasteTypeFilter, setWasteTypeFilter] = useState("ALL");
  const [selectedDate, setSelectedDate] = useState(undefined);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);

      try {
        const response = await getCollectorReports({
          page: 1,
          limit: 100,
        });

        const items = response?.data?.items || [];

        const mapped = items.map((item) => {
          return {
            id: item.reportId,
            area: formatAreaFromLocation(item?.location),
            status: item.status,
            citizenName:
              item?.citizen?.fullname ||
              item?.citizenFullname ||
              item?.citizenName ||
              "Không xác định",
            wasteType: item?.wasteType?.name || "Không xác định",
            weight: item.weight,
            unitType: item.unitType,

            collectedAt: item.reportedAt,
          };
        });

        setAllJobs(mapped);
      } catch (error) {
        toast.error(error.message || "Không thể tải lịch sử thu gom");
        setAllJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  // chỉ lấy collected
  const collectedJobs = useMemo(() => {
    return allJobs
      .filter((job) => job.status === "COLLECTED")
      .sort((a, b) => {
        const aTime = a.collectedAt ? new Date(a.collectedAt).getTime() : 0;

        const bTime = b.collectedAt ? new Date(b.collectedAt).getTime() : 0;

        return bTime - aTime;
      });
  }, [allJobs]);

  const wasteTypeOptions = useMemo(() => {
    const unique = new Set(
      collectedJobs.map((job) => (job.wasteType || "").trim()).filter(Boolean),
    );

    return Array.from(unique).sort((a, b) => a.localeCompare(b, "vi"));
  }, [collectedJobs]);

  const filtered = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return collectedJobs.filter((job) => {
      const byKeyword =
        normalizedKeyword.length === 0 ||
        String(job.id || "")
          .toLowerCase()
          .includes(normalizedKeyword) ||
        String(job.wasteType || "")
          .toLowerCase()
          .includes(normalizedKeyword) ||
        String(job.citizenName || "")
          .toLowerCase()
          .includes(normalizedKeyword) ||
        String(job.area || "")
          .toLowerCase()
          .includes(normalizedKeyword);

      const byWasteType =
        wasteTypeFilter === "ALL" || job.wasteType === wasteTypeFilter;

      let byTime = true;

      if (selectedDate) {
        const selectedKey = toLocalDateKey(selectedDate);
        const collectedKey = toLocalDateKey(job.collectedAt);

        if (!selectedKey || !collectedKey) {
          byTime = false;
        } else {
          byTime = collectedKey === selectedKey;
        }
      }

      return byKeyword && byWasteType && byTime;
    });
  }, [collectedJobs, keyword, wasteTypeFilter, selectedDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, wasteTypeFilter, selectedDate]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));

  const safePage = Math.min(currentPage, totalPages);

  const paginated = filtered.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );

  const handleExportReport = () => {
    if (filtered.length === 0) return;

    const headers = ["Ma Bao Cao", "Loai Rac", "Khu Vuc", "Nguoi Dan"];

    const rows = filtered.map((job) => [
      job.id,
      job.wasteType,
      job.area,
      job.citizenName || "-",
    ]);

    const csvContent = [
      headers.map(toCsvValue).join(","),
      ...rows.map((row) => row.map(toCsvValue).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    const dateTag = new Date().toISOString().slice(0, 10);

    link.href = url;

    link.setAttribute("download", `collector-history-${dateTag}.csv`);

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);
  };

  const handleViewDetail = async (reportId) => {
    if (!reportId) return;

    setDetailOpen(true);
    setDetailLoading(true);
    setDetailData(null);
    setDetailArea("Không rõ vị trí");

    try {
      const response = await getCollectorReportById(reportId);
      const data = response?.data || null;
      setDetailData(data);
      setDetailArea(formatAreaFromLocation(data?.location));
    } catch (error) {
      toast.error(error.message || "Không thể tải chi tiết báo cáo");
    } finally {
      setDetailLoading(false);
    }
  };

  const detailUnit =
    detailData?.collectedRecord?.quantityUnit || detailData?.unitType || "KG";

  const sceneImages = Array.isArray(detailData?.images)
    ? detailData.images
    : [];
  const collectorImages = Array.isArray(detailData?.collectorImages)
    ? detailData.collectorImages
    : [];

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-lg lg:text-2xl font-bold tracking-tight">
          Lịch sử Thu gom
        </h1>

        <p className="text-green-600 text-sm mt-1">
          Danh sách các nhiệm vụ đã hoàn thành
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardDescription>Tổng nhiệm vụ đã thu gom</CardDescription>

            <p className="text-3xl font-bold">{filtered.length}</p>
          </div>

          <Button
            onClick={handleExportReport}
            variant="outline"
            className="gap-2"
            disabled={filtered.length === 0}
          >
            <Download className="size-4" />
            Xuất báo cáo
          </Button>
        </CardHeader>

        <CardContent>
          <div className="mb-4 gap-3 md:grid-cols-3 flex">
            <Input
              className="flex-1"
              placeholder="Tìm mã báo cáo, loại rác, người dân, khu vực..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />

            <Select value={wasteTypeFilter} onValueChange={setWasteTypeFilter}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Tất cả loại rác" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả loại rác</SelectItem>
                {wasteTypeOptions.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex-1 justify-start">
                  <Calendar className="mr-2 size-4" />
                  {selectedDate
                    ? selectedDate.toLocaleDateString("vi-VN")
                    : "Lọc theo ngày"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Button
              variant="ghost"
              onClick={() => {
                setSelectedDate(undefined);
              }}
            >
              Bỏ lọc ngày
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã báo cáo</TableHead>
                <TableHead>Loại rác</TableHead>
                <TableHead>Ngày báo cáo</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <div className="inline-flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" />
                      Đang tải dữ liệu...
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-32 text-center text-muted-foreground"
                  >
                    Không có lịch sử thu gom
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium text-cyan-600">
                      {job.id}
                    </TableCell>

                    <TableCell>{job.wasteType}</TableCell>

                    <TableCell>{formatDate(job.collectedAt)}</TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetail(job.id)}
                      >
                        Xem chi tiết
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {filtered.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Hiển thị{" "}
            <span className="font-semibold">
              {(safePage - 1) * ITEMS_PER_PAGE + 1}-
              {Math.min(safePage * ITEMS_PER_PAGE, filtered.length)}
            </span>{" "}
            trên <span className="font-semibold">{filtered.length}</span> nhiệm
            vụ
          </p>

          <div className="flex gap-1">
            <PageBtn
              disabled={safePage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              ←
            </PageBtn>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <PageBtn
                key={p}
                active={p === safePage}
                onClick={() => setCurrentPage(p)}
              >
                {p}
              </PageBtn>
            ))}

            <PageBtn
              disabled={safePage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              →
            </PageBtn>
          </div>
        </div>
      )}

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="md:min-w-[70vw] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết báo cáo thu gom</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết từ API collector theo báo cáo đã chọn.
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground gap-2">
              <Loader2 className="size-4 animate-spin" />
              Đang tải chi tiết...
            </div>
          ) : !detailData ? (
            <div className="h-32 flex items-center justify-center text-muted-foreground">
              Không có dữ liệu chi tiết.
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoItem label="Mã báo cáo" value={detailData.reportId} />
                <InfoItem label="Trạng thái" value={detailData.status} />
                <InfoItem
                  label="Loại rác"
                  value={detailData?.wasteType?.name || "-"}
                  icon={<Recycle className="size-4 text-green-600" />}
                />
                <InfoItem
                  label="Khu vực"
                  value={detailArea}
                  icon={<MapPin className="size-4 text-green-600" />}
                />
                <InfoItem
                  label="Khối lượng ước tính"
                  value={`${detailData.weight ?? "-"} ${detailData.unitType || ""}`}
                  icon={<Scale className="size-4 text-blue-600" />}
                />
                <InfoItem
                  label="Khối lượng thực tế"
                  value={`${detailData?.collectedRecord?.actualQuantityValue ?? detailData.actualQuantity ?? "-"} ${detailUnit}`}
                  icon={<Scale className="size-4 text-emerald-600" />}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoItem
                  label="Người báo cáo"
                  value={detailData?.citizen?.fullname || "-"}
                  icon={<User className="size-4 text-cyan-600" />}
                />
                <InfoItem
                  label="SĐT người báo cáo"
                  value={detailData?.citizen?.phone || "-"}
                  icon={<Phone className="size-4 text-cyan-600" />}
                />
                <InfoItem
                  label="Người thu gom"
                  value={detailData?.collector?.fullname || "-"}
                  icon={<User className="size-4 text-orange-600" />}
                />
                <InfoItem
                  label="SĐT người thu gom"
                  value={detailData?.collector?.phone || "-"}
                  icon={<Phone className="size-4 text-orange-600" />}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoItem
                  label="Thời điểm ghi nhận"
                  value={formatDate(detailData?.collectedRecord?.recordedAt)}
                />
                <InfoItem
                  label="Đơn vị thu gom"
                  value={
                    detailData?.collectedRecord?.quantityUnit ||
                    detailData.unitType ||
                    "-"
                  }
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Ghi chú thu gom</p>
                <div className="rounded-lg border p-3 text-sm text-muted-foreground min-h-16">
                  {detailData?.collectedRecord?.note || "Không có ghi chú"}
                </div>
              </div>

              <div className="md:flex gap-6">
                <ImageSection
                  title="Ảnh hiện trường"
                  images={sceneImages}
                  className="flex-1"
                />

                <ImageSection
                  title="Ảnh minh chứng thu gom"
                  images={collectorImages}
                  className="flex-1"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoItem({ label, value, icon }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-medium flex items-center gap-2 wrap-break-word">
        {icon || null}
        <span>{value || "-"}</span>
      </p>
    </div>
  );
}

function ImageSection({ title, images }) {
  const [preview, setPreview] = useState(null);

  return (
    <div className="space-y-3 w-full">
      <p className="text-base font-semibold">{title}</p>

      {!images || images.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground text-center">
          Chưa có hình ảnh
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((img, idx) => {
            const src = typeof img === "string" ? img : img?.file_uri;
            if (!src) return null;

            return (
              <img
                key={`${src}-${idx}`}
                src={src}
                alt={`${title} ${idx + 1}`}
                onClick={() => setPreview(src)}
                className="min-w-full h-50 object-cover rounded-xl border cursor-pointer hover:scale-105 transition"
              />
            );
          })}
        </div>
      )}

      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        <DialogContent className="max-w-none min-w-[90vw] p-2">
          <img
            src={preview}
            alt="preview"
            className="w-full h-[90vh] object-contain rounded-lg"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PageBtn({ children, active, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold transition-all
      ${
        active
          ? "bg-green-500 text-white"
          : disabled
            ? "text-gray-300 cursor-not-allowed bg-white border"
            : "bg-white text-gray-600 hover:bg-green-50 border"
      }`}
    >
      {children}
    </button>
  );
}

export default History;
