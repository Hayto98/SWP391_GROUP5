import { useMemo, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
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
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { FileText, Trophy, Gift, Ticket, Clock, ChevronRight, CheckCircle2, XCircle } from "lucide-react";

import { getCitizenDashboardStatistics } from "@/services/citizenDashboard.service";
import { getMyReports } from "@/services/wasteReportService";
import { getAvailableVouchers, getMyPoints } from "@/services/citizenRewards.service";
import { reverseGeocode } from "@/services/geocodingService";

import {
  CartesianGrid,
  Bar,
  BarChart,
  XAxis,
  YAxis,
} from "recharts";


const chartConfig = {
  completed: {
    label: "Hoàn thành",
    color: "#22c55e",
  },
  rejected: {
    label: "Bị từ chối",
    color: "#e2e8f0", 
  },
  reports: {
    label: "Số lượng báo cáo",
    color: "#16a34a",
  },
};

// Helper functions for status mapping (Synchronized with Reports.jsx)
function normalizeStatus(status) {
  if (status === "COLLECTED") return "completed";
  if (status === "REJECTED") return "rejected";
  if (
    status === "ACCEPTED" ||
    status === "ASSIGNED" ||
    status === "IN_PROGRESS"
  )
    return "processing";
  return "pending";
}

function statusTextFromApi(status) {
  if (status === "COLLECTED") return "ĐÃ THU GOM";
  if (status === "REJECTED") return "ĐÃ TỪ CHỐI";
  if (
    status === "ACCEPTED" ||
    status === "ASSIGNED" ||
    status === "IN_PROGRESS"
  )
    return "ĐANG XỬ LÝ";
  return "CHỜ DUYỆT";
}

const statusTone = {
  completed: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  processing: "bg-orange-100 text-orange-700 border-orange-200",
  pending: "bg-gray-100 text-gray-700 border-gray-200",
  default: "bg-gray-100 text-gray-700 border-gray-200"
};

export default function Dashboard() {
  const [stats, setStats] = useState({});
  const [recentActivities, setRecentActivities] = useState([]);
  const [vouchersCount, setVouchersCount] = useState(0);
  const [myPoints, setMyPoints] = useState(0);
  
  const today = new Date();
  const [month, setMonth] = useState((today.getMonth() + 1).toString());
  const [year, setYear] = useState(today.getFullYear().toString());
  const [loading, setLoading] = useState(false);

  const greeting = useMemo(() => {
    const hour = today.getHours();
    if (hour < 12) return "Chào buổi sáng!";
    if (hour < 18) return "Chào buổi chiều!";
    return "Chào buổi tối!";
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch core stats
      const statsRes = await getCitizenDashboardStatistics({ month: Number(month), year: Number(year) });
      if (statsRes?.success && statsRes.data) {
        setStats(statsRes.data);
      }

      // 2. Fetch recent reports and resolve addresses
      const reportsRes = await getMyReports({ page: 1, limit: 10 }); // Fetch 10 to be safe
      const rawReports = Array.isArray(reportsRes?.data) ? reportsRes.data : [];
      
      // Resolve addresses asynchronously
      const reportsWithAddresses = await Promise.all(
        rawReports.slice(0, 5).map(async (act) => {
          let displayAddress = act.address;
          if (!displayAddress && act.location?.lat) {
            try {
              displayAddress = await reverseGeocode(act.location.lat, act.location.lng);
            } catch {
              displayAddress = `${act.location.lat.toFixed(4)}, ${act.location.lng.toFixed(4)}`;
            }
          }
          return {
            ...act,
            displayAddress: displayAddress || "Địa chỉ không xác định"
          };
        })
      );
      setRecentActivities(reportsWithAddresses);

      // 3. Fetch points
      const pointsRes = await getMyPoints();
      if (pointsRes?.data) {
        setMyPoints(pointsRes.data.totalPoints || 0);
      }

      // 4. Fetch vouchers count
      const vouchersRes = await getAvailableVouchers({ page: 1, limit: 100 });
      const vList = Array.isArray(vouchersRes?.data) ? vouchersRes.data : [];
      setVouchersCount(vList.length);

    } catch (err) {
      console.error("Dashboard fetch error", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [month, year]);

  const rankData = useMemo(() => {
    if (myPoints < 500) return { label: "Đồng", color: "text-[#cd7f32]", bg: "bg-[#cd7f32]/10" };
    if (myPoints < 2000) return { label: "Bạc", color: "text-slate-400", bg: "bg-slate-400/10" };
    return { label: "Vàng", color: "text-yellow-600", bg: "bg-yellow-100" };
  }, [myPoints]);

  const summaryCards = useMemo(() => {
    return [
      {
        title: "Tổng báo cáo",
        value: stats?.totalReports ?? 0,
        subtext: "Báo cáo nội bộ",
        icon: FileText,
        color: "text-slate-500",
        bgColor: "bg-slate-100"
      },
      {
        title: "Báo cáo hoàn thành",
        value: stats?.completedReports ?? 0,
        subtext: "Thành công thu gom",
        icon: CheckCircle2,
        color: "text-emerald-600",
        bgColor: "bg-emerald-100"
      },
      {
        title: "Điểm tích lũy",
        value: `${myPoints} điểm`,
        subtext: `Hạng cá nhân: ${rankData.label}`,
        icon: Trophy,
        color: rankData.color.replace("text-", ""),
        bgColor: rankData.bg
      },
      {
        title: "Báo cáo bị từ chối",
        value: stats?.rejectedReports ?? 0,
        subtext: "Báo cáo không hợp lệ",
        icon: XCircle,
        color: "text-red-500",
        bgColor: "bg-red-100"
      },
    ];
  }, [stats, myPoints, rankData]);

  const reportsByDay = useMemo(() => {
    return (stats?.reportsByDay || []).map((item) => ({
      date: item.date,
      reports: item.reports,
    }));
  }, [stats]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {greeting}
          </h1>
          <p className="mt-1 text-sm text-green-600 font-medium">
            Hãy tiếp tục bảo vệ môi trường và nhận điểm thưởng ngay hôm nay.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="w-[120px]">
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Tháng" />
              </SelectTrigger>
              <SelectContent>
                {[...Array(12)].map((_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    Tháng {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-[120px]">
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Năm" />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026, 2027].map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    Năm {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((item, idx) => (
          <Card key={idx} className="border-none shadow-sm shadow-slate-200/50 relative overflow-hidden group">
            <CardHeader className="p-5 pb-0 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-600">
                {item.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${item.bgColor}`}>
                <item.icon className="h-4 w-4" style={{ color: item.color.startsWith('text-') ? "" : item.color }} />
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-3">
              <p className="text-3xl font-black tracking-tight text-slate-900">
                {item.value}
              </p>
              <p className="text-xs font-medium text-slate-500 mt-1">
                {item.subtext}
              </p>
            </CardContent>
            <div className={`absolute -bottom-6 -right-6 h-24 w-24 rounded-full blur-2xl opacity-40 transition-opacity group-hover:opacity-60 ${item.bgColor}`} />
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">Mức độ hoạt động trong tháng</CardTitle>
            <CardDescription>Thống kê số lượng báo cáo tạo ra từng ngày.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-72 w-full flex items-center justify-center bg-slate-50/50 rounded-lg animate-pulse">
                <span className="text-sm text-slate-400 font-medium">Đang tải biểu đồ...</span>
              </div>
            ) : reportsByDay.length === 0 ? (
               <div className="h-72 w-full flex items-center justify-center border-dashed border-2 border-slate-200 rounded-lg">
                 <span className="text-sm text-slate-400">Không có dữ liệu tháng này</span>
               </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-72 w-full">
                <BarChart data={reportsByDay} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.5} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={10} fontSize={12} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                  <ChartTooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="reports"
                    fill="var(--color-reports)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 bg-gradient-to-br from-green-600 to-emerald-700 text-white overflow-hidden relative flex flex-col h-full">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-white">
              <Gift className="h-5 w-5 text-green-200" /> Trung tâm quà tặng
            </CardTitle>
            <CardDescription className="text-green-100/80">
              Đổi rác lấy quà, bảo vệ môi trường!
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center space-y-6 pt-6 pb-8 relative z-10">
            <div>
               <p className="text-sm font-medium text-green-100 mb-1">Điểm đang có</p>
               <div className="flex items-end gap-2">
                 <span className="text-4xl font-black">{myPoints}</span>
                 <span className="text-green-200 text-sm pb-1 font-semibold">EP</span>
               </div>
            </div>
            
            <Link to="/citizen/rewards" className="block">
              <div className="flex items-center justify-between bg-white/10 hover:bg-white/20 transition-colors rounded-xl p-4 cursor-pointer backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-3">
                   <div className="bg-white/20 p-2 rounded-lg">
                      <Ticket className="h-5 w-5 text-white" />
                   </div>
                   <div>
                     <p className="text-sm font-semibold text-white">Khám phá Voucher</p>
                     <p className="text-xs text-green-100">{vouchersCount} mã đang chờ</p>
                   </div>
                </div>
                <ChevronRight className="h-5 w-5 opacity-70" />
              </div>
            </Link>
          </CardContent>
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Hoạt động gửi báo cáo gần đây</CardTitle>
              <CardDescription>Tiến trình 5 báo cáo rác mới nhất của bạn.</CardDescription>
            </div>
            <Link to="/citizen/reports">
              <Badge variant="secondary" className="cursor-pointer hover:bg-slate-200 transition-colors">
                Xem tất cả
              </Badge>
            </Link>
          </CardHeader>
          <CardContent>
             <div className="overflow-x-auto rounded-md border border-slate-100">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>Mã báo cáo</TableHead>
                      <TableHead>Địa chỉ</TableHead>
                      <TableHead>Thời gian</TableHead>
                      <TableHead className="text-right">Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentActivities.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                          Chưa có báo cáo nào gần đây.
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentActivities.map((act) => {
                         const time = new Date(act.createdAt).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day:"2-digit", month: "2-digit" });
                         const reportCode = act.reportCode || act.reportId || act.wasteReportId || "-";
                         const status = act.status || "PENDING";
                         const normalized = normalizeStatus(status);

                         return (
                          <TableRow key={act.id || act._id || act.reportId}>
                            <TableCell className="font-mono text-xs font-semibold text-slate-700">
                              {reportCode}
                            </TableCell>
                            <TableCell className="max-w-[400px] truncate text-slate-600" title={act.displayAddress}>
                              {act.displayAddress}
                            </TableCell>
                            <TableCell className="text-slate-500 text-sm whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" /> {time}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge
                                variant="outline"
                                className={`whitespace-nowrap px-3 py-1 rounded-full border border-current font-medium ${statusTone[normalized] || statusTone.default}`}
                              >
                                {statusTextFromApi(status)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
