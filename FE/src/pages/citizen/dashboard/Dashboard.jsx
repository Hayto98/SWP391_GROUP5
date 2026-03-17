import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { FileText, Trophy, CheckCircle2, XCircle } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

const fakeDashboardResponse = {
  success: true,
  data: {
    totalReports: 12,
    totalPoints: 85,
    completedReports: 8,
    rejectedReports: 2,
    completionRate: 0.67,
    reportsByDay: [
      {
        date: "2026-03-01",
        reports: 2,
      },
      {
        date: "2026-03-02",
        reports: 3,
      },
    ],
  },
};

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
  const stats = fakeDashboardResponse.data;

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

  const completionData = useMemo(() => {
    return [
      {
        key: "completed",
        name: "Báo cáo hoàn thành",
        value: stats?.completedReports ?? 0,
        fill: "var(--color-completed)",
      },
      {
        key: "rejected",
        name: "Báo cáo bị từ chối",
        value: stats?.rejectedReports ?? 0,
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
