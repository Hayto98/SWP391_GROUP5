import { useMemo, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { FileText, Trophy, CheckCircle2, XCircle } from "lucide-react";
import { getCitizenDashboardStatistics } from "@/services/citizenDashboard.service";
import {
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";



const chartConfig = {
  completed: {
    label: "Báo cáo hoàn thành",
    color: "#22c55e",
  },
  rejected: {
    label: "Báo cáo bị từ chối",
    color: "#ef4444",
  },
  reports: {
    label: "Báo cáo",
    color: "#0f172a",
  },
};

function Dashboard() {
  const [stats, setStats] = useState({});
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [loading, setLoading] = useState(false);

  const fetchStats = () => {
    setLoading(true);
    getCitizenDashboardStatistics({ month, year }).then((res) => {
      if (res?.success && res.data) {
        setStats(res.data);
      }
      setLoading(false);
    });
  };

  // Only fetch on mount (optional: or remove this to require manual filter always)
  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line
  }, []);

  const summaryCards = useMemo(() => {
    return [
      {
        title: "Tổng báo cáo",
        value: stats?.totalReports ?? 0,
        icon: FileText,
      },
      {
        title: "Tổng điểm",
        value: stats?.totalPoints ?? 0,
        icon: Trophy,
      },
      {
        title: "Báo cáo hoàn thành",
        value: stats?.completedReports ?? 0,
        icon: CheckCircle2,
      },
      {
        title: "Báo cáo bị từ chối",
        value: stats?.rejectedReports ?? 0,
        icon: XCircle,
      },
    ];
  }, [stats]);

  // Pie chart should reflect completion rate and rejection rate as proportions
  const completionData = useMemo(() => {
    const completionRate = typeof stats?.completionRate === 'number' ? stats.completionRate : 0;
    // Ensure value is between 0 and 1
    const safeCompletion = Math.max(0, Math.min(1, completionRate));
    return [
      {
        key: "completed",
        name: "Báo cáo hoàn thành",
        value: safeCompletion,
        fill: "var(--color-completed)",
      },
      {
        key: "rejected",
        name: "Báo cáo bị từ chối",
        value: 1 - safeCompletion,
        fill: "var(--color-rejected)",
      },
    ];
  }, [stats]);

  const reportsByDay = useMemo(() => {
    return (stats?.reportsByDay || []).map((item) => ({
      date: item.date,
      reports: item.reports,
    }));
  }, [stats]);

  const completionRate = useMemo(() => {
    const rate = Number(stats?.completionRate || 0);
    return `${Math.round(rate * 100)}%`;
  }, [stats]);

  return (
    <div className="space-y-6">
      {/* Filter section */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex flex-col" style={{ minWidth: 120 }}>
          <label className="block text-sm font-medium mb-1">Tháng</label>
          <select
            className="border rounded px-3 py-2 h-10 min-w-[100px]"
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
          >
            {[...Array(12)].map((_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col" style={{ minWidth: 120 }}>
          <label className="block text-sm font-medium mb-1">Năm</label>
          <input
            type="number"
            className="border rounded px-3 py-2 h-10 min-w-[100px]"
            value={year}
            min={2000}
            max={2100}
            onChange={e => setYear(Number(e.target.value))}
          />
        </div>
        <button
          className="bg-primary text-white px-4 py-2 rounded h-10 min-w-[80px]"
          style={{ marginTop: 24 }}
          onClick={fetchStats}
          disabled={loading}
        >
          {loading ? "Đang tải..." : "Lọc"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => (
          <Card key={item.title}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {item.title}
                </CardTitle>
                <item.icon className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {item.value.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Biểu đồ tỷ lệ hoàn thành</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={chartConfig}
              className="mx-auto h-70 w-full"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={completionData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={95}
                />
                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
              </PieChart>
            </ChartContainer>
            <p className="mt-3 text-center text-sm text-muted-foreground">
              Tỷ lệ hoàn thành:{" "}
              <span className="font-semibold text-foreground">
                {completionRate}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Biểu đồ hoạt động báo cáo</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80 w-full">
              <LineChart data={reportsByDay} margin={{ left: 8, right: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(label) => `Ngày: ${label}`}
                    />
                  }
                />
                <Line
                  type="monotone"
                  dataKey="reports"
                  stroke="var(--color-reports)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;
