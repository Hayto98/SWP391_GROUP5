import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Eye, Loader2, MapPin } from "lucide-react";
import { ITEMS_PER_PAGE } from "./taskData";
import { getCollectorReports } from "@/services/collectorReport.service";
import { reverseGeocode } from "@/services/geocodingService";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

function formatReportedAt(value) {
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

function getStatusMeta(status) {
  if (status === "IN_PROGRESS") {
    return {
      text: "Đã nhận",
      className: "bg-blue-50 text-blue-600 border-blue-200",
    };
  }
  return {
    text: "Chờ xử lý",
    className: "bg-green-50 text-green-600 border-green-100",
  };
}

function Tasks() {
  const navigate = useNavigate();
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("Tất cả");
  const [wasteFilter, setWasteFilter] = useState("Tất cả");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const response = await getCollectorReports({ page: 1, limit: 100 });
        const items = response?.data?.items || [];

        const allowedStatuses = new Set(["ASSIGNED", "IN_PROGRESS"]);

        const mapped = await Promise.all(
          items
            .filter((item) => allowedStatuses.has(item.status))
            .map(async (item) => {
              const lat = Number(item?.location?.lat);
              const lng = Number(item?.location?.lng);
              const hasLocation = Number.isFinite(lat) && Number.isFinite(lng);

              const area = hasLocation
                ? await reverseGeocode(lat, lng)
                : "Không rõ vị trí";

              const reportedAt = item?.reportedAt
                ? new Date(item.reportedAt)
                : null;

              return {
                id: item.reportId,
                reportId: item.reportId,
                district: area,
                area,
                wasteType: item?.wasteType?.name || "Không xác định",
                status: item.status,
                description: item.description || "",
                location: item.location || null,
                images: item.images || [],
                weight: item.weight,
                unitType: item.unitType,
                reportedAt: item.reportedAt,
              };
            }),
        );

        setAllTasks(mapped);
      } catch (error) {
        toast.error(error.message || "Không thể tải danh sách nhiệm vụ");
        setAllTasks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const areaOptions = useMemo(() => {
    const values = [
      ...new Set(allTasks.map((task) => task.district).filter(Boolean)),
    ];
    return ["Tất cả", ...values];
  }, [allTasks]);

  const wasteOptions = useMemo(() => {
    const values = [
      ...new Set(allTasks.map((task) => task.wasteType).filter(Boolean)),
    ];
    return ["Tất cả", ...values];
  }, [allTasks]);

  const filtered = useMemo(() => {
    let tasks = allTasks;

    if (search.trim()) {
      const q = search.toLowerCase();
      tasks = tasks.filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          t.area.toLowerCase().includes(q) ||
          t.wasteType.toLowerCase().includes(q),
      );
    }
    if (areaFilter !== "Tất cả") {
      tasks = tasks.filter((t) => t.district === areaFilter);
    }
    if (wasteFilter !== "Tất cả") {
      tasks = tasks.filter((t) =>
        t.wasteType.toLowerCase().includes(wasteFilter.toLowerCase()),
      );
    }

    tasks = [...tasks].sort((a, b) => {
      const aTime = a.reportedAt ? new Date(a.reportedAt).getTime() : 0;
      const bTime = b.reportedAt ? new Date(b.reportedAt).getTime() : 0;
      return bTime - aTime;
    });

    return tasks;
  }, [allTasks, search, areaFilter, wasteFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );
  const inProgressCount = allTasks.filter(
    (task) => task.status === "IN_PROGRESS",
  ).length;

  const handleFilterChange = (setter) => (v) => {
    setter(v);
    setCurrentPage(1);
  };

  const toRouteTaskId = (id) => String(id).replace("#", "");

  return (
    <div className="space-y-6">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-lg lg:text-2xl font-bold tracking-tight">
          Danh sách Nhiệm vụ
        </h1>
        <p className="text-green-600 text-sm lg:text-base mt-1">
          Quản lý và xử lý các báo cáo thu gom rác thải được phân công.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
        {/* Tổng nhiệm vụ */}
        <Card className="transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <CardDescription>Tổng Nhiệm Vụ</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl lg:text-5xl font-bold">
                {allTasks.length}
              </span>
              <span className="text-sm text-muted-foreground">Báo cáo</span>
            </div>
          </CardContent>
        </Card>

        {/* Đã nhận */}
        <Card className="bg-blue-50 border-blue-200 transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <CardDescription className="text-blue-600">Đã Nhận</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl lg:text-5xl font-bold text-blue-600">
                {inProgressCount}
              </span>
              <span className="text-sm text-blue-600">Đang xử lý</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          <FieldGroup className="flex gap-4 flex-row items-end">
            <Field>
              <FieldLabel>Tìm kiếm</FieldLabel>
              <Input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Tìm kiếm mã báo cáo hoặc khu vực..."
                className="w-full bg-white border border-gray-100 rounded-xl px-3 py-2.5 text-gray-700 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm transition"
              />
            </Field>

            <Field>
              <FieldLabel>Khu vực</FieldLabel>
              <Select
                value={areaFilter}
                onValueChange={handleFilterChange(setAreaFilter)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả khu vực" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {areaOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Loại rác</FieldLabel>
              <Select
                value={wasteFilter}
                onValueChange={handleFilterChange(setWasteFilter)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả loại rác" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {wasteOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
        </CardContent>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã báo cáo</TableHead>
                <TableHead>Loại rác</TableHead>
                <TableHead>Khu vực</TableHead>
                <TableHead>Khối lượng</TableHead>
                <TableHead>Thời gian tạo</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <div className="inline-flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" />
                      Đang tải danh sách nhiệm vụ...
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-32 text-center text-muted-foreground"
                  >
                    Không tìm thấy nhiệm vụ phù hợp
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((task) => {
                  const statusMeta = getStatusMeta(task.status);
                  return (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium text-cyan-600">
                        {task.id}
                      </TableCell>
                      <TableCell>{task.wasteType}</TableCell>
                      <TableCell>
                        <div
                          className="flex items-center gap-1 text-sm max-w-90"
                          title={task.area}
                        >
                          <MapPin className="size-3 text-muted-foreground" />
                          <span className="truncate">{task.area}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {task.weight ?? "-"} {task.unitType || ""}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="size-3 text-muted-foreground" />
                          {formatReportedAt(task.reportedAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-xs px-3 py-1 rounded-full border font-medium inline-block ${statusMeta.className}`}
                        >
                          {statusMeta.text}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() =>
                            navigate(
                              `/collector/tasks/${toRouteTaskId(task.id)}`,
                            )
                          }
                        >
                          <Eye className="size-3" />
                          Chi tiết
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {filtered.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs lg:text-sm text-gray-500">
            Hiển thị{" "}
            <span className="font-semibold text-gray-700">
              {(safePage - 1) * ITEMS_PER_PAGE + 1}-
              {Math.min(safePage * ITEMS_PER_PAGE, filtered.length)}
            </span>{" "}
            trên{" "}
            <span className="font-semibold text-gray-700">
              {filtered.length}
            </span>{" "}
            nhiệm vụ
          </p>
          <div className="flex items-center gap-1">
            <PageBtn
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M10 12L6 8l4-4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
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
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M6 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </PageBtn>
          </div>
        </div>
      )}
    </div>
  );
}

function PageBtn({ children, active, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold transition-all ${
        active
          ? "bg-green-500 text-white shadow-sm"
          : disabled
            ? "text-gray-300 cursor-not-allowed bg-white border border-green-50"
            : "bg-white text-gray-600 hover:bg-green-50 border border-gray-100"
      }`}
    >
      {children}
    </button>
  );
}

export default Tasks;
