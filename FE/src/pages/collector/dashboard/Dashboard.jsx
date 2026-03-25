import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  CheckSquare,
  MapPin,
  TrendingUp,
  CheckCircle2,
  Scale,
} from "lucide-react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useAuthStore } from "@/stores/authStore";
import {
  getCollectorWorkingStatus,
  updateCollectorWorkingStatus,
} from "@/services/collectorWorkingStatus.service";
import { getCollectorDashboardStatistics } from "@/services/collectorDashboard.service";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { user } = useAuthStore();
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [stats, setStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [groupBy, setGroupBy] = useState("day");

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const statusRes = await getCollectorWorkingStatus();
        setIsAvailable(Boolean(statusRes?.isWorking));
      } catch (error) {
        toast.error(error?.message || "Không tải được trạng thái làm việc");
      } finally {
        setIsLoadingStatus(false);
      }
    };
    loadStatus();
  }, []);

  useEffect(() => {
    const loadStats = async () => {
      setIsLoadingStats(true);
      try {
        const statsRes = await getCollectorDashboardStatistics({ groupBy });
        if (statsRes?.data) {
          setStats(statsRes.data);
        }
      } catch (error) {
        toast.error(error?.message || "Không tải được dữ liệu thống kê");
      } finally {
        setIsLoadingStats(false);
      }
    };
    loadStats();
  }, [groupBy]);

  const handleToggleWorkingStatus = async (checked) => {
    if (isLoadingStatus || isUpdatingStatus) return;

    setIsAvailable(checked);
    setIsUpdatingStatus(true);

    try {
      const response = await updateCollectorWorkingStatus(checked);
      setIsAvailable(Boolean(response?.isWorking));
      toast.success(
        checked ? "Đã bật trạng thái làm việc" : "Đã tắt trạng thái làm việc",
      );
    } catch (error) {
      setIsAvailable(!checked);
      toast.error(error?.message || "Cập nhật trạng thái làm việc thất bại");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const displayName = user?.fullname || user?.fullName || "Nhân viên thu gom";
  const avatarInitials =
    displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "NV";

  return (
    <div className="bg-muted/30 min-h-screen font-sans pb-10">
      <main className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* ROW 1: USER PROFILE & WORKING STATUS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-green-100 shadow-sm">
            <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Avatar className="w-16 h-16 border-2 border-primary/10 h-auto">
                <AvatarImage
                  src={user?.avatar}
                  alt={displayName}
                  className="aspect-square object-cover"
                />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl h-16 w-16 flex items-center justify-center">
                  {avatarInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <h2 className="text-xl font-bold tracking-tight">
                  Chào buổi sáng, {displayName}
                </h2>
                <p className="text-muted-foreground text-sm flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-primary" />{" "}
                  {user?.area || "Khu vực phụ trách"}
                </p>
              </div>
              <div className="sm:ml-auto w-full sm:w-auto">
                <Button
                  asChild
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
                >
                  <Link to="/collector/tasks">
                    <CheckSquare className="w-4 h-4 mr-2" />
                    Xem nhiệm vụ
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-6 flex items-center gap-4 h-full">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-colors ${isAvailable ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"}`}
              >
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  Sẵn sàng làm việc
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {isAvailable ? "Sẵn sàng nhận nhiệm vụ" : "Đang nghỉ ngơi"}
                </p>
              </div>
              <Switch
                checked={isAvailable}
                onCheckedChange={handleToggleWorkingStatus}
                disabled={isLoadingStatus || isUpdatingStatus}
                className="data-[state=checked]:bg-green-500"
              />
            </CardContent>
          </Card>
        </div>

        {/* ROW 2: STATISTICS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription>Tổng lượng rác thu gom</CardDescription>
              {isLoadingStats ? (
                <Skeleton className="h-8 w-24 mt-1" />
              ) : (
                <CardTitle className="text-3xl text-primary flex items-center gap-2">
                  {stats?.totalCollectedQuantity?.toLocaleString() || 0}{" "}
                  <span className="text-sm text-muted-foreground font-normal">
                    kg
                  </span>
                </CardTitle>
              )}
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Scale className="w-4 h-4" /> Tổng khối lượng đã ghi nhận
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription>Tổng nhiệm vụ hoàn thành</CardDescription>
              {isLoadingStats ? (
                <Skeleton className="h-8 w-24 mt-1" />
              ) : (
                <CardTitle className="text-3xl text-blue-600">
                  {stats?.totalCompletedTasks?.toLocaleString() || 0}
                </CardTitle>
              )}
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Báo cáo thu gom thành công
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm sm:col-span-2 relative overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <CardHeader className="pb-2 relative z-10 text-white/90">
              <CardTitle className="text-white">Lịch trình hôm nay</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <p className="text-white/80 mb-4 text-sm">
                Kiểm tra thông tin chi tiết trên danh sách nhiệm vụ được giao để
                cập nhật tuyến đường thu gom mới nhất.
              </p>
              <Button
                asChild
                variant="secondary"
                className="w-fit text-green-700 font-semibold bg-white hover:bg-green-50"
              >
                <Link to="/collector/tasks">Tới danh sách nhiệm vụ</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* ROW 3: CHARTS & MAP */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 shadow-sm flex flex-col">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div>
                <CardTitle>Biểu đồ thu gom (Kg)</CardTitle>
                <CardDescription>Thống kê khối lượng thu gom</CardDescription>
              </div>
              <div className="w-32">
                <Select value={groupBy} onValueChange={setGroupBy}>
                  <SelectTrigger className="w-full">
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
              </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-[300px]">
              {isLoadingStats ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Skeleton className="w-full h-[250px] rounded-lg" />
                </div>
              ) : stats?.grouped?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={stats.grouped}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      opacity={0.5}
                    />
                    <XAxis
                      dataKey="period"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12 }}
                      tickFormatter={(val) => {
                        if (groupBy === "day") {
                          const date = new Date(val);
                          return !isNaN(date)
                            ? date.toLocaleDateString("vi-VN", {
                                day: "2-digit",
                                month: "2-digit",
                              })
                            : val;
                        }
                        if (groupBy === "month") {
                          // val is "YYYY-MM"
                          const [year, month] = val.split("-");
                          return `${month}/${year}`;
                        }
                        // year: "YYYY"
                        return val;
                      }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12 }}
                    />
                    <RechartsTooltip
                      cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                      labelFormatter={(val) => {
                        if (groupBy === "day") {
                          const date = new Date(val);
                          return !isNaN(date)
                            ? date.toLocaleDateString("vi-VN")
                            : val;
                        }
                        if (groupBy === "month") {
                          const [year, month] = val.split("-");
                          return `Tháng ${month}/${year}`;
                        }
                        return `Năm ${val}`;
                      }}
                    />
                    <Bar
                      dataKey="total"
                      fill="#22c55e"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                      name="Khối lượng (kg)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2 pt-10">
                  <TrendingUp className="w-8 h-8 opacity-20" />
                  <p>Chưa có dữ liệu thống kê thu gom</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm flex flex-col overflow-hidden">
            <CardHeader className="border-b bg-muted/20 pb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                <CardTitle className="text-base">Bản đồ (Mô phỏng)</CardTitle>
              </div>
            </CardHeader>
            <div className="flex-1 w-full bg-gray-200 min-h-[300px] relative pointer-events-none">
              <iframe
                title="Khu vực làm việc"
                className="w-full h-full absolute inset-0 border-0"
                src="https://www.openstreetmap.org/export/embed.html?bbox=106.68,10.76,106.73,10.80&layer=mapnik&marker=10.7769,106.7009"
                loading="lazy"
              />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur shadow-md text-sm font-medium px-4 py-2 rounded-full border">
                Vị trí của bạn
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
