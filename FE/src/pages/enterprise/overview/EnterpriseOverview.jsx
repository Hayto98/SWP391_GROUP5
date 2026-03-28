import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useEnterpriseOverview } from "@/hooks/useEnterpriseOverview";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Loader2,
  RefreshCw,
  Search,
  Truck,
} from "lucide-react";

const statIconTone = {
  default: "border-slate-200 bg-slate-100 text-slate-700",
  info: "border-blue-200 bg-blue-100 text-blue-700",
  success: "border-emerald-200 bg-emerald-100 text-emerald-700",
  danger: "border-red-200 bg-red-100 text-red-700",
};

const activityTone = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  danger: "border-red-200 bg-red-50 text-red-700",
  info: "border-blue-200 bg-blue-50 text-blue-700",
  default: "border-slate-200 bg-slate-100 text-slate-700",
};

const wasteColorTone = {
  plastic: "#10b981", // emerald-500
  paper: "#3b82f6", // blue-500
  metal: "#f59e0b", // amber-500
  other: "#94a3b8", // slate-400
};

// Removed WasteRing to simplify data expression

export default function EnterpriseOverview() {
  // State cho filter dashboard
  const [fromDate, setFromDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01 00:00:00`;
  });
  const [toDate, setToDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-31 23:59:59`;
  });
  const [groupBy, setGroupBy] = useState("month");

  // State cho phân trang hoạt động gần đây
  const [activityPage, setActivityPage] = useState(1);
  const itemsPerPage = 5;

  // State filter thực tế dùng cho API
  const [filter, setFilter] = useState({ fromDate, toDate, groupBy });
  const { data, loading, error, refetch } = useEnterpriseOverview(filter);

  const stats = useMemo(() => {
    if (!data?.summary) return [];
    const s = data.summary;
    return [
      {
        title: "Chờ xử lý",
        value: String(s.pending),
        tone: "default",
        icon: <Clock3 className="size-4" />,
      },
      {
        title: "Đang thực hiện",
        value: String(s.inProgress),
        tone: "info",
        icon: <Truck className="size-4" />,
      },
      {
        title: "Đã hoàn tất",
        value: String(s.done),
        tone: "success",
        icon: <CheckCircle2 className="size-4" />,
      },
    ];
  }, [data]);

  const activeChart = data?.chart?.active;
  const chartValues = activeChart?.values || [];
  const maxChartValue = Math.max(...chartValues, 1);
  const highlightValue = Math.max(...chartValues, 0);
  const activities = data?.activities || [];
  const waste = data?.waste;

  // Xử lý list hoạt động
  const totalActivityPages = Math.max(
    1,
    Math.ceil(activities.length / itemsPerPage),
  );
  const currentActivities = activities.slice(
    (activityPage - 1) * itemsPerPage,
    activityPage * itemsPerPage,
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="flex h-24 items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Đang tải dữ liệu dashboard...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="flex flex-col items-start gap-3 py-6 text-red-700">
          <p>Lỗi: {error}</p>
          <Button variant="outline" onClick={refetch}>
            <RefreshCw className="size-4" />
            Thử lại
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-lg font-bold tracking-tight lg:text-2xl">
          Dashboard tổng quan doanh nghiệp
        </h1>
        <p className="mt-1 text-sm text-green-600">
          Theo dõi hiệu suất thu gom, chất lượng phân loại
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold">RecycleCorp</p>
            <p className="text-xs text-muted-foreground">
              Quản trị doanh nghiệp
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto md:items-center">
            <Select value={groupBy} onValueChange={setGroupBy}>
              <SelectTrigger className="h-9 w-[130px]">
                <SelectValue placeholder="Lọc theo" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="day">Theo ngày</SelectItem>
                  <SelectItem value="month">Theo tháng</SelectItem>
                  <SelectItem value="year">Theo năm</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <Button
              variant="default"
              size="sm"
              className="h-9 bg-green-600 px-5 text-white shadow-sm hover:bg-green-700 sm:ml-2"
              onClick={() => {
                setFilter({ fromDate, toDate, groupBy });
                setTimeout(() => refetch(), 0); // Đảm bảo refetch sau khi setFilter
              }}
            >
              Lọc
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-3">
        {stats.map((item) => (
          <Card key={item.title}>
            <CardContent className="space-y-3 py-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {item.title}
                </p>
                <span
                  className={[
                    "flex size-8 items-center justify-center rounded-md border",
                    statIconTone[item.tone] || statIconTone.default,
                  ].join(" ")}
                >
                  {item.icon}
                </span>
              </div>
              <p className="text-3xl font-black leading-none tracking-tight">
                {item.value}
              </p>
              {/* Đã xoá sub */}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Sản lượng thu gom</CardTitle>
              <CardDescription>
                So sánh xu hướng theo từng chu kỳ vận hành.
              </CardDescription>
            </div>

            {/* Range buttons removed: API does not support range switching */}
          </CardHeader>

          <CardContent>
            {activeChart ? (
              <div className="flex h-64 items-end gap-3 rounded-lg border bg-slate-50 px-3 py-4">
                {activeChart.values.map((value, index) => {
                  const height = Math.max(
                    8,
                    Math.round((value / maxChartValue) * 100),
                  );
                  const label = activeChart.labels[index];
                  const isHighlight = value === highlightValue;

                  return (
                    <div
                      key={`${label}-${index}`}
                      className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                    >
                      <span className="text-[11px] font-semibold text-slate-600">
                        {value}
                      </span>
                      <div
                        className={[
                          "w-full max-w-12 rounded-md border transition-all",
                          isHighlight
                            ? "border-emerald-300 bg-emerald-500"
                            : "border-emerald-200 bg-emerald-100",
                        ].join(" ")}
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-[11px] font-medium text-muted-foreground">
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Không có dữ liệu chart.
              </p>
            )}
          </CardContent>
        </Card>

        {/* <Card>
          <CardHeader>
            <CardTitle className="text-base">Phân loại rác thải</CardTitle>
            <CardDescription>
              Tổng hợp tỉ lệ theo nhóm vật liệu thu gom.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="flex flex-col items-center justify-center rounded-lg bg-green-50 py-6 border border-green-100">
              <span className="text-3xl font-black tracking-tight text-green-700">
                {waste?.totalText || "0"}{" "}
                <span className="text-base font-semibold">kg</span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-green-600/70">
                TỔNG KHỐI LƯỢNG ĐÃ PHÂN LOẠI
              </span>
            </div>

            <div className="h-[250px] w-full">
              {waste?.breakdown && waste.breakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={waste.breakdown}
                      dataKey="quantity"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                    >
                      {waste.breakdown.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            wasteColorTone[entry.key] || wasteColorTone.other
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [`${value} kg`, name]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Không có dữ liệu phân loại
                </div>
              )}
            </div>
          </CardContent>
        </Card> */}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Hoạt động gần đây</CardTitle>
            <CardDescription>
              Cập nhật tiến độ đơn hàng và trạng thái xử lý.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã đơn</TableHead>
                  <TableHead>Loại rác</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-6 text-center text-muted-foreground"
                    >
                      Không có dữ liệu hoạt động.
                    </TableCell>
                  </TableRow>
                )}

                {currentActivities.map((activity, index) => (
                  <TableRow key={`${activity.code}-${activityPage}-${index}`}>
                    <TableCell className="font-mono text-xs font-semibold">
                      {activity.code}
                    </TableCell>
                    <TableCell>{activity.type}</TableCell>
                    <TableCell>{activity.time}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          activityTone[activity.badge] || activityTone.default
                        }
                      >
                        {activity.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Phân trang UI */}
          {activities.length > 0 && (
            <div className="flex items-center justify-between border-t px-2 pt-4 mt-4">
              <span className="text-sm font-medium text-muted-foreground">
                Trang {activityPage} / {totalActivityPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setActivityPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={activityPage === 1}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setActivityPage((prev) =>
                      Math.min(totalActivityPages, prev + 1),
                    )
                  }
                  disabled={activityPage === totalActivityPages}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
