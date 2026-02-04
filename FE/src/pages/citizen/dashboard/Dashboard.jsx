import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TiGift } from "react-icons/ti";
import { FileText, Trophy, Award, TrendingUp } from "lucide-react";
import { ChartContainer } from "@/components/ui/chart";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const statsData = [
  {
    title: "Điểm của bạn",
    value: 155,
    icon: TiGift,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
  },
  {
    title: "Báo cáo đã gửi",
    value: 3,
    subtitle: "Hoàn thành: 2",
    subtitle2: "Chờ duyệt: 1",
    icon: FileText,
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  {
    title: "Xếp hạng",
    value: "#12",
    subtitle: "Trong 3,420 người đóng góp",
    subtitle2: "Top 0%",
    icon: Trophy,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
];

const reportStatusData = [
  { name: "Đã thu gom", value: 1, color: "#22c55e", percentage: "20%" },
  { name: "Chờ duyệt", value: 1, color: "#f97316", percentage: "20%" },
  { name: "Đã phân công", value: 1, color: "#eab308", percentage: "20%" },
  { name: "Từ chối", value: 2, color: "#ef4444", percentage: "40%" },
];

const activityData = [
  { day: "T2", points: 30 },
  { day: "T3", points: 50 },
  { day: "T4", points: 0 },
  { day: "T5", points: 20 },
  { day: "T6", points: 40 },
  { day: "T7", points: 25 },
  { day: "CN", points: 20 },
];

const chartConfig = {
  points: {
    label: "Points",
    color: "#000000",
  },
};

function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statsData.map((stat, index) => (
          <Card key={index} className={stat.bgColor}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {stat.value && (
                <div className="text-3xl font-bold mb-2">{stat.value}</div>
              )}
              <div className="space-y-1">
                {stat.subtitle && (
                  <p className="text-xs text-muted-foreground">
                    {stat.subtitle}
                  </p>
                )}
                {stat.subtitle2 && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    {stat.subtitle2.includes("Người đóng góp") ? (
                      <>
                        <Award className="h-3 w-3" />
                        {stat.subtitle2}
                      </>
                    ) : (
                      stat.subtitle2
                    )}
                  </p>
                )}
              </div>
              {stat.progress && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Tiến độ</span>
                    <span className="font-semibold">{stat.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${stat.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Report Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Phân bố trạng thái báo cáo</CardTitle>
            <p className="text-sm text-muted-foreground">
              Chi tiết trạng thái các báo cáo của bạn
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <div className="w-full h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reportStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ percentage }) => percentage}
                    >
                      {reportStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 gap-3 mt-4 w-full">
                {reportStatusData.map((status, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                    <div className="text-sm">
                      <div className="font-medium">{status.name}</div>
                      <div className="text-muted-foreground text-xs">
                        {status.value} báo cáo
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Completion Rate */}
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">
                  Tỷ lệ hoàn thành
                </p>
                <p className="text-3xl font-bold text-green-600">20%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity This Week */}
        <Card>
          <CardHeader>
            <CardTitle>Hoạt động tuần này</CardTitle>
            <p className="text-sm text-muted-foreground">
              Điểm kiếm được và báo cáo đã gửi
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Tổng điểm</p>
                <p className="text-3xl font-bold">185</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  TB mỗi ngày
                </p>
                <p className="text-3xl font-bold text-orange-600">26</p>
              </div>
            </div>

            <ChartContainer config={chartConfig} className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    className="text-xs"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    className="text-xs"
                  />
                  <Tooltip />
                  <Bar dataKey="points" fill="#000000" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;
