import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Trash2, Calendar, User, Info, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

function ComplaintDetail() {
  const { reportId } = useParams();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState("");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    // Giả lập fetch API với object bạn đã cung cấp
    setTimeout(() => {
      const mockData = {
        reportComplaintId: "COMP-2026-001",
        wasteReportId: "e7fd18b3-2669-4ce0-8d74-d4c7b5b9b6a6",
        complaintReason: "Collector chưa thu gom",
        complaintStatus: "RESOLVED",
        adminResponse: "ĐƯỢC BẠN",
        refundpoints: 50,
        createdAt: "2026-03-07T11:00:00Z",
        attachments: [
          { fileUri: "https://cdn.greenapp.com/complaints/img1.jpg" },
        ],
        // Object lồng ghép từ API báo cáo rác
        wasteReport: {
          wasteType: { name: "Thủy tinh new", unitType: "KG" },
          description: "Mô tả báo cáo rác",
          weight: 10,
          collector: { fullname: "collectorMan", phone: "0900000443" },
          collectedRecord: {
            note: "đủ",
            completionImages: [
              "https://res.cloudinary.com/dtkeljghl/image/upload/v1773210575/collector_completions/rwo3anbahanl7ofsexdk.jpg",
            ],
          },
        },
      };
      setComplaint(mockData);
      setReason(mockData.complaintReason);
      setLoading(false);
    }, 400);
  }, [reportId]);

  if (loading)
    return <div className="flex justify-center p-10">Đang tải...</div>;
  if (!complaint)
    return <div className="p-10 text-center">Không tìm thấy dữ liệu.</div>;

  const isOpen = complaint.complaintStatus === "OPEN";

  return (
    <div>
      <Button
        variant="ghost"
        className="px-0"
        onClick={() => navigate("/citizen/complaints")}
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại danh sách
      </Button>

      <Card>
        <CardHeader className="border-b bg-slate-50/50">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Chi tiết khiếu nại</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {complaint.reportComplaintId}
              </p>
            </div>
            <Badge variant={isOpen ? "default" : "secondary"}>
              {isOpen ? "Đang xử lý" : "Đã giải quyết"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-8">
          {!isOpen && complaint.refundpoints > 0 && (
            <section>
              <div className="relative overflow-hidden rounded-xl border border-green-200 bg-linear-to-r from-green-50 to-emerald-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 shadow-sm">
                      <Gift className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-green-700 font-medium uppercase tracking-wide">
                        Điểm hoàn trả
                      </p>
                      <p className="text-sm text-green-600 mt-0.5">
                        Đã được cộng vào tài khoản của bạn
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-bold text-green-600">
                      +{complaint.refundpoints}
                    </span>
                    <span className="ml-1 text-sm font-medium text-green-500">
                      điểm
                    </span>
                  </div>
                </div>
                {/* decorative circles */}
                <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-green-200/40" />
                <div className="pointer-events-none absolute -bottom-6 -right-2 h-16 w-16 rounded-full bg-emerald-200/40" />
              </div>
            </section>
          )}

          {/* 2. NỘI DUNG KHIẾU NẠI */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Nội dung khiếu nại
            </h3>
            <p className="text-xs text-muted-foreground">
              Ngày tạo:{" "}
              {new Date(complaint.createdAt).toLocaleDateString("vi-VN")}
            </p>
            {isOpen ? (
              <Textarea
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            ) : (
              <p className="p-3 bg-slate-50 border rounded-md text-sm">
                {complaint.complaintReason}
              </p>
            )}
            {complaint.attachments?.length > 0 && (
              <div className="mt-2">
                <span className="text-xs text-muted-foreground">
                  Ảnh đính kèm:
                </span>
                <img
                  src={complaint.attachments[0].fileUri}
                  className="w-20 h-20 object-cover rounded mt-1 border"
                  alt="attachment"
                />
              </div>
            )}
          </section>
          {/* 4. ADMIN RESPONSE (Nếu đã giải quyết) */}
          {!isOpen && complaint.adminResponse && (
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-blue-700">
                Phản hồi từ Admin
              </h3>
              <p className="p-3 bg-blue-50 border border-blue-100 rounded-md text-sm">
                {complaint.adminResponse}
              </p>
            </section>
          )}
          {/* 1. THÔNG TIN BÁO CÁO GỐC */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase flex items-center gap-2">
              <Info className="w-4 h-4" /> Thông tin báo cáo gốc
            </h3>
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-md text-sm">
              <div>
                <span className="text-muted-foreground block">Loại rác</span>
                <span className="font-medium">
                  {complaint.wasteReport.wasteType.name}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Khối lượng</span>
                <span className="font-medium">
                  {complaint.wasteReport.weight}{" "}
                  {complaint.wasteReport.wasteType.unitType}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground block">
                  Mô tả báo cáo
                </span>
                <p className="font-medium">
                  {complaint.wasteReport.description}
                </p>
              </div>
            </div>
          </section>
          {/* 3. KẾT QUẢ THU GOM */}
          {complaint.wasteReport.collectedRecord && (
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-500 uppercase flex items-center gap-2">
                <User className="w-4 h-4" /> Kết quả thu gom (Collector)
              </h3>
              <div className="border rounded-md p-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Người thu gom:</span>
                  <span className="font-medium">
                    {complaint.wasteReport.collector.fullname}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Ghi chú:</span>
                  <p className="font-medium bg-slate-50 p-2 mt-1 rounded italic">
                    "{complaint.wasteReport.collectedRecord.note}"
                  </p>
                </div>
                <img
                  src={
                    complaint.wasteReport.collectedRecord.completionImages[0]
                  }
                  className="w-32 h-32 object-cover rounded border"
                  alt="collected"
                />
              </div>
            </section>
          )}

          {/* 5. ĐIỂM HOÀN TRẢ */}

          {/* HÀNH ĐỘNG (Chỉ hiện khi OPEN) */}
          {isOpen && (
            <div className="flex justify-between pt-4 border-t">
              <Button
                variant="ghost"
                className="text-red-600"
                onClick={() => setIsDeleteOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Xóa khiếu nại
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setReason(complaint.complaintReason)}
                >
                  Hủy
                </Button>
                <Button onClick={() => console.log("Update:", reason)}>
                  Cập nhật
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
          </DialogHeader>
          <p className="text-sm">Bạn có chắc muốn xóa khiếu nại này không?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                console.log("Deleted");
                navigate("/citizen/complaints");
              }}
            >
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ComplaintDetail;
