import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Users, MessageSquareWarning, CheckCircle2 } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { getDashboardStats } from "../../../services/adminService";

const chartConfig = {
  complaints: {
    label: "Khiếu nại",
    color: "#ef4444",
  },
  resolved: {
    label: "Đã xử lý",
    color: "#22c55e",
  },
};

function Dashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalComplaints: 0,
    resolvedComplaints: 0,
    complaintsByTime: [],
    resolvedComplaintsByTime: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const response = await getDashboardStats();
        if (response && response.success) {
          setStats(response.data);
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu dashboard:", error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Đang tải dữ liệu dashboard...</p>
      </div>
    );
  }

  const summaryCards = [
    {
      title: "Tổng người dùng",
      value: stats.totalUsers,
      icon: Users,
    },
    {
      title: "Tổng khiếu nại",
      value: stats.totalComplaints,
      icon: MessageSquareWarning,
    },
    {
      title: "Khiếu nại đã xử lý",
      value: stats.resolvedComplaints,
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
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
            <CardTitle>Biểu đồ khiếu nại theo thời gian</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80 w-full">
              <LineChart
                data={stats.complaintsByTime}
                margin={{ left: 8, right: 8 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis dataKey="time" tickLine={false} axisLine={false} />
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
                  dataKey="complaints"
                  stroke="var(--color-complaints)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Biểu đồ khiếu nại đã xử lý theo thời gian</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80 w-full">
              <LineChart
                data={stats.resolvedComplaintsByTime}
                margin={{ left: 8, right: 8 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis dataKey="time" tickLine={false} axisLine={false} />
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
                  dataKey="resolved"
                  stroke="var(--color-resolved)"
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
