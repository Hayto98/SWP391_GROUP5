import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Plus,
  Eye,
  Edit,
  MapPin,
  Calendar,
  X,
  CircleAlert,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { TiGift } from "react-icons/ti";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ReportDetailDialog from "./ReportDetailDialog";

const fakeReports = [
  {
    id: "REP-8829",
    title: "Rác tái chế (Recyclable)",
    date: "24/11/2023",
    location: "123 Elm Street, District 1",
    latitude: 10.7769,
    longitude: 106.7009,
    status: "completed",
    statusText: "ĐÃ THU GOM",
    progress: [
      { step: "Reported", label: "Reported", completed: true },
      {
        step: "Enterprise Accepted",
        label: "Enterprise Accepted",
        completed: true,
      },
      {
        step: "Collector Assigned",
        label: "Collector Assigned",
        completed: true,
      },
      { step: "Collected", label: "Collected", completed: true },
    ],
    trashTypes: [
      { type: "Nhựa", weight: 15, points: 750 },
      { type: "Giấy", weight: 8, points: 240 },
    ],
    totalPoints: 990,
    description: "Rác tái chế từ văn phòng, đã phân loại sẵn",
    citizenImages: [
      "https://images.unsplash.com/photo-1586504801223-7b0f83f1d7b9?w=400",
    ],
    collectorImages: [
      "https://images.unsplash.com/photo-1607457561458-e84c03fb37e7?w=400",
    ],
    collector: {
      name: "Nguyễn Văn Thuận",
      phone: "050 123 4567",
      avatar: "https://i.pravatar.cc/150?img=12",
      estimatedTime: "14:30 - Hôm nay",
    },
  },
  {
    id: "REP-8830",
    title: "Rác hữu cơ (Organic)",
    date: "26/11/2023",
    location: "456 Pine Ave, District 3",
    latitude: 10.7951,
    longitude: 106.7208,
    status: "processing",
    statusText: "ĐANG XỬ LÝ",
    progress: [
      { step: "Reported", label: "Reported", completed: true },
      {
        step: "Enterprise Accepted",
        label: "Enterprise Accepted",
        completed: true,
      },
      {
        step: "Collector Assigned",
        label: "Collector Assigned",
        completed: false,
      },
      { step: "Collected", label: "Collected", completed: false },
    ],
    trashTypes: [{ type: "Kim loại", weight: 20, points: 1600 }],
    totalPoints: 1600,
    description: "Rác kim loại từ nhà xưởng",
    citizenImages: [
      "https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=400",
    ],
    collectorImages: [],
    collector: null,
  },
  {
    id: "REP-8835",
    title: "Rác không tái chế",
    date: "28/11/2023",
    location: "789 Oak Rd, District 5",
    latitude: 10.7625,
    longitude: 106.6822,
    status: "pending",
    statusText: "CHỜ DUYỆT",
    progress: [
      { step: "Reported", label: "Reported", completed: true },
      {
        step: "Enterprise Accepted",
        label: "Enterprise Accepted",
        completed: false,
      },
      {
        step: "Collector Assigned",
        label: "Collector Assigned",
        completed: false,
      },
      { step: "Collected", label: "Collected", completed: false },
    ],
    trashTypes: [
      { type: "Thủy tinh", weight: 10, points: 400 },
      { type: "Vải", weight: 5, points: 125 },
    ],
    totalPoints: 525,
    description: "Rác cồng kềnh, cần hỗ trợ khuân vác",
    citizenImages: [
      "https://images.unsplash.com/photo-1604187351574-c75ca79f5807?w=400",
    ],
    collectorImages: [],
    collector: null,
  },
];

function Reports() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState();
  const [selectedReport, setSelectedReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "processing":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "pending":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Reports Table */}
      <Card>
        {/* Filters */}

        <CardContent>
          <FieldGroup className="flex gap-4 flex-row">
            <Field>
              <FieldLabel>Trạng thái</FieldLabel>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    <SelectItem value="completed">Đã thu gom</SelectItem>
                    <SelectItem value="processing">Đang xử lý</SelectItem>
                    <SelectItem value="pending">Chờ duyệt</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Ngày gửi</FieldLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateFilter && "text-muted-foreground",
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateFilter ? (
                      format(dateFilter, "dd/MM/yyyy", { locale: vi })
                    ) : (
                      <span>Chọn ngày</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateFilter}
                    onSelect={setDateFilter}
                    initialFocus
                    locale={vi}
                  />
                </PopoverContent>
              </Popover>
            </Field>

            {/* <Field className="flex items-end">
            <Button variant="outline" className="w-full">
              Lọc thêm
            </Button>
          </Field> */}
          </FieldGroup>
        </CardContent>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-30">Mã báo cáo</TableHead>
                <TableHead>Loại rác</TableHead>
                <TableHead>Ngày gửi</TableHead>
                <TableHead>Địa điểm</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fakeReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium text-cyan-600">
                    {report.id}
                  </TableCell>
                  <TableCell>{report.title}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="size-3 text-muted-foreground" />
                      {report.date}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="size-3 text-muted-foreground" />
                      {report.location}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-xs px-3 py-1 rounded-full border font-medium inline-block ${getStatusColor(
                        report.status,
                      )}`}
                    >
                      {report.statusText}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => handleViewReport(report)}
                      >
                        <Eye className="size-3" />
                        Xem
                      </Button>
                      {report.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-cyan-600 border-cyan-300 hover:bg-cyan-50"
                        >
                          <Edit className="size-3" />
                          Sửa
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Load More */}
      <div className="flex justify-center pt-4">
        <Button variant="outline">Xem thêm báo cáo cũ hơn</Button>
      </div>

      {/* Detail Modal */}
      <ReportDetailDialog
        isOpen={isModalOpen}
        onClose={setIsModalOpen}
        report={selectedReport}
        getStatusColor={getStatusColor}
      />
    </div>
  );
}

export default Reports;
