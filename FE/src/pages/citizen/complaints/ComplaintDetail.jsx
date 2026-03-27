import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Gift, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { getReportComplaintDetail } from "@/services/citizenComplaintService";
import ImageSection from "@/components/ui/image-section";

function ComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComplaintDetail = async () => {
      setLoading(true);
      try {
        const response = await getReportComplaintDetail(id);
        setComplaint(response?.data || null);
      } catch (error) {
        toast.error(error.message || "Không thể tải chi tiết khiếu nại");
        setComplaint(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchComplaintDetail();
    }
  }, [id]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Đang tải chi tiết khiếu nại...
        </CardContent>
      </Card>
    );
  }

  if (!complaint) {
    return (
      <Card>
        <CardContent className="py-10 text-center space-y-3">
          <p className="text-muted-foreground">Không tìm thấy khiếu nại</p>
          <Button onClick={() => navigate("/citizen/complaints")}>
            Quay lại danh sách
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isOpen = complaint.complaintStatus === "OPEN";

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        className="px-0"
        onClick={() => navigate("/citizen/complaints")}
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại danh sách
      </Button>

      <Card>
        <CardHeader className="border-b bg-slate-50/50">
          <div className="flex justify-between items-start gap-3">
            <div>
              <CardTitle>Chi tiết khiếu nại</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {complaint.reportComplaintId}
              </p>
            </div>
            <Badge variant={
              complaint.complaintStatus === "OPEN" ? "default" : 
              complaint.complaintStatus === "REJECTED" ? "destructive" : 
              "secondary"
            }>
              {complaint.complaintStatus === "OPEN" ? "Đang xử lý" :
               complaint.complaintStatus === "REJECTED" ? "Từ chối" :
               "Đã giải quyết"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {!isOpen && Number(complaint.refundPoints || 0) > 0 && (
            <div className="relative overflow-hidden rounded-xl border border-green-200 bg-linear-to-r from-green-50 to-emerald-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 shadow-sm">
                    <Gift className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-green-700 font-medium uppercase tracking-wide">
                      Điểm hoàn trả
                    </p>
                    <p className="text-sm text-green-600 mt-0.5">
                      Đã cộng vào tài khoản của bạn
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-bold text-green-600">
                    +{complaint.refundPoints}
                  </span>
                  <span className="ml-1 text-sm font-medium text-green-500">
                    điểm
                  </span>
                </div>
              </div>
            </div>
          )}

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Nội dung khiếu nại
            </h3>
            <p className="text-xs text-muted-foreground">
              Ngày tạo:{" "}
              {complaint.createdAt
                ? new Date(complaint.createdAt).toLocaleString("vi-VN")
                : "-"}
            </p>
            <div className="p-3 bg-slate-50 border rounded-md text-sm whitespace-pre-line wrap-break-word">
              {complaint.complaintReason || "-"}
            </div>
          </section>

          {complaint.attachments?.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-500 uppercase">
                Ảnh đính kèm
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {complaint.attachments.map((item, index) => (
                  <ImageSection
                    key={`${item.fileUri || "attachment"}-${index}`}
                    image={item.fileUri}
                    className="space-y-1"
                  />
                ))}
              </div>
            </section>
          )}

          {complaint.adminResponse && (
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-blue-700">
                Phản hồi từ Admin
              </h3>
              <p className="p-3 bg-blue-50 border border-blue-100 rounded-md text-sm whitespace-pre-line wrap-break-word">
                {complaint.adminResponse}
              </p>
            </section>
          )}

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase">
              Thông tin liên quan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-md text-sm">
              <div>
                <span className="text-muted-foreground block">
                  Waste report ID
                </span>
                <span className="font-medium">
                  {complaint.wasteReportId || "-"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Trạng thái</span>
                <Badge variant={
                  complaint.complaintStatus === "OPEN" ? "default" : 
                  complaint.complaintStatus === "REJECTED" ? "destructive" : 
                  "secondary"
                }>
                  {complaint.complaintStatus === "OPEN" ? "Đang xử lý" :
                   complaint.complaintStatus === "REJECTED" ? "Từ chối" :
                   "Đã giải quyết"}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground block">Resolved at</span>
                <span className="font-medium">
                  {complaint.resolvedAt
                    ? new Date(complaint.resolvedAt).toLocaleString("vi-VN")
                    : "-"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Đã cập nhật</span>
                <span className="font-medium">
                  {complaint.isUpdated ? "Có" : "Không"}
                </span>
              </div>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

export default ComplaintDetail;
