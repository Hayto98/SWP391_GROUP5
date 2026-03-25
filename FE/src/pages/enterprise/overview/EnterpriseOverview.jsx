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
import { Input } from "@/components/ui/input";
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

const wasteDotTone = {
  plastic: "bg-emerald-500",
  paper: "bg-blue-500",
  metal: "bg-amber-500",
  other: "bg-slate-400",
};

function WasteRing({ percent, totalText, totalSubText }) {
  const safePercent = Math.max(0, Math.min(100, Number(percent || 0)));
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (safePercent / 100) * circumference;

  return (
    <div className="relative size-40">
      <svg
        className="size-40 -rotate-90"
        viewBox="0 0 128 128"
        role="img"
        aria-label="Waste ring chart"
      >
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          className="text-slate-200"
        />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          className="text-emerald-500 transition-all"
          strokeDasharray={circumference}
          strokeDashoffset={strokeOffset}
        />
      </svg>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-2xl font-black tracking-tight">{totalText || "-"}</p>
        <p className="text-[11px] font-semibold text-muted-foreground">
          {totalSubText || "TỔNG CỘNG"}
        </p>
      </div>
    </div>
  );
}

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
      {
        title: "SLA cảnh báo",
        value: String(s.slaWarning),
        tone: "danger",
        icon: <AlertTriangle className="size-4" />,
      },
    ];
  }, [data]);

  const activeChart = data?.chart?.active;
  const chartValues = activeChart?.values || [];
  const maxChartValue = Math.max(...chartValues, 1);
  const highlightValue = Math.max(...chartValues, 0);
  const activities = data?.activities || [];
  const waste = data?.waste;

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
          Theo dõi hiệu suất thu gom, chất lượng phân loại và nguy cơ SLA.
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

          <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto items-center">
            {/* Date range picker (simple) */}
            <input
              type="date"
              value={fromDate.slice(0, 10)}
              onChange={(e) => setFromDate(`${e.target.value} 00:00:00`)}
              className="border rounded px-2 py-1 text-sm"
              style={{ minWidth: 120 }}
            />
            <span className="mx-1">-</span>
            <input
              type="date"
              value={toDate.slice(0, 10)}
              onChange={(e) => setToDate(`${e.target.value} 23:59:59`)}
              className="border rounded px-2 py-1 text-sm"
              style={{ minWidth: 120 }}
            />
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="border rounded px-2 py-1 text-sm ml-2"
            >
              <option value="day">Theo ngày</option>
              <option value="month">Theo tháng</option>
              <option value="year">Theo năm</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              className="ml-2"
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Phân loại rác thải</CardTitle>
            <CardDescription>
              Tổng hợp tỉ lệ theo nhóm vật liệu thu gom.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <WasteRing
                percent={waste?.ringPercent}
                totalText={waste?.totalText}
                totalSubText={waste?.totalSubText}
              />
            </div>

            <div className="space-y-2">
              {(waste?.breakdown || []).map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={[
                        "inline-block size-2.5 rounded-full",
                        wasteDotTone[item.key] || "bg-slate-400",
                      ].join(" ")}
                    />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-muted-foreground">
                    {item.percent}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Hoạt động gần đây</CardTitle>
            <CardDescription>
              Cập nhật tiến độ đơn hàng và trạng thái xử lý.
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm">
            Xem tất cả
          </Button>
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

                {activities.map((activity) => (
                  <TableRow key={activity.code}>
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
        </CardContent>
      </Card>
    </div>
  );
}
