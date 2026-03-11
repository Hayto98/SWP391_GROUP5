import React, { useState } from "react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gift, Star, Trophy, Ticket, History } from "lucide-react";
import { toast } from "sonner";
import VoucherList from "./components/VoucherList";
import RedemptionHistory from "./components/RedemptionHistory";
import PointHistory from "./components/PointHistory";
import RedeemDialog from "./components/RedeemDialog";

function Rewards() {
  const [userPoints, setUserPoints] = useState(2500); // Điểm hiện tại của user
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [isRedeemDialogOpen, setIsRedeemDialogOpen] = useState(false);

  // Mock data - Danh sách voucher có thể đổi
  const vouchers = [
    {
      voucher_id: "1",
      voucher_name: "Giảm 50k cho đơn hàng từ 200k",
      voucher_code: "SAVE50K",
      points_required: 500,
      terms_description:
        "Áp dụng cho đơn hàng từ 200.000đ. Hạn sử dụng 30 ngày.",
      expiry_date: "31/03/2026",
      image:
        "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=400&h=300&fit=crop",
      category: "discount",
    },
    {
      voucher_id: "2",
      voucher_name: "Freeship đơn hàng dưới 3km",
      voucher_code: "FREESHIP3K",
      points_required: 300,
      terms_description: "Miễn phí vận chuyển cho đơn hàng trong bán kính 3km.",
      expiry_date: "15/04/2026",
      image:
        "https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=400&h=300&fit=crop",
      category: "shipping",
    },
    {
      voucher_id: "3",
      voucher_name: "Voucher Starbucks 100k",
      voucher_code: "COFFEE100",
      points_required: 1000,
      terms_description: "Voucher 100k tại Starbucks. Áp dụng toàn quốc.",
      expiry_date: "30/06/2026",
      image:
        "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400&h=300&fit=crop",
      category: "gift",
    },
    {
      voucher_id: "4",
      voucher_name: "Giảm 20% tối đa 100k",
      voucher_code: "SALE20",
      points_required: 800,
      terms_description: "Giảm 20% tối đa 100.000đ cho mọi đơn hàng.",
      expiry_date: "31/05/2026",
      image:
        "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&h=300&fit=crop",
      category: "discount",
    },
    {
      voucher_id: "5",
      voucher_name: "Voucher Grab 50k",
      voucher_code: "GRAB50",
      points_required: 600,
      terms_description: "Voucher Grab 50k. Áp dụng cho Grab Bike, Grab Car.",
      expiry_date: "30/04/2026",
      image:
        "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400&h=300&fit=crop",
      category: "gift",
    },
    {
      voucher_id: "6",
      voucher_name: "Tặng cây xanh cho môi trường",
      voucher_code: "GREENTREE",
      points_required: 1500,
      terms_description: "Chúng tôi sẽ trồng 1 cây xanh nhân danh bạn.",
      expiry_date: "31/12/2026",
      image:
        "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&h=300&fit=crop",
      category: "environment",
    },
  ];

  // Mock data - Lịch sử đổi voucher
  const redemptionHistory = [
    {
      voucher_redemption_id: "1",
      voucher_name: "Giảm 50k cho đơn hàng từ 200k",
      voucher_code: "SAVE50K",
      points_used: 500,
      redeemed_at: "2026-02-01T10:30:00",
      status: "active",
    },
    {
      voucher_redemption_id: "2",
      voucher_name: "Freeship đơn hàng dưới 3km",
      voucher_code: "FREESHIP3K",
      points_used: 300,
      redeemed_at: "2026-01-28T14:20:00",
      status: "used",
    },
    {
      voucher_redemption_id: "3",
      voucher_name: "Voucher Starbucks 100k",
      voucher_code: "COFFEE100",
      points_used: 1000,
      redeemed_at: "2026-01-25T09:15:00",
      status: "used",
    },
  ];

  // Mock data - Lịch sử giao dịch điểm
  const pointTransactions = [
    {
      point_transaction_id: "1",
      points_delta: 150,
      transaction_reason: "Thu gom 5kg rác tái chế",
      created_at: "2026-02-03T08:00:00",
    },
    {
      point_transaction_id: "2",
      points_delta: -500,
      transaction_reason: "Đổi voucher: Giảm 50k cho đơn hàng từ 200k",
      created_at: "2026-02-01T10:30:00",
    },
    {
      point_transaction_id: "3",
      points_delta: 200,
      transaction_reason: "Thu gom 8kg rác hữu cơ",
      created_at: "2026-02-01T07:30:00",
    },
    {
      point_transaction_id: "4",
      points_delta: -300,
      transaction_reason: "Đổi voucher: Freeship đơn hàng dưới 3km",
      created_at: "2026-01-28T14:20:00",
    },
    {
      point_transaction_id: "5",
      points_delta: 300,
      transaction_reason: "Báo cáo điểm rác thải",
      created_at: "2026-01-27T16:45:00",
    },
  ];

  const handleRedeemVoucher = (voucher) => {
    setSelectedVoucher(voucher);
    setIsRedeemDialogOpen(true);
  };

  const confirmRedeem = () => {
    if (userPoints >= selectedVoucher.points_required) {
      setUserPoints(userPoints - selectedVoucher.points_required);
      toast.success(
        `Đã đổi voucher "${selectedVoucher.voucher_name}" thành công!`,
      );
      setIsRedeemDialogOpen(false);
      setSelectedVoucher(null);
    } else {
      toast.error("Không đủ điểm để đổi voucher này!");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header - Tổng điểm */}
      <Card className="bg-linear-to-r from-amber-500 to-orange-500 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Trophy className="size-6" />
                Điểm Thưởng Của Bạn
              </CardTitle>
              <CardDescription className="text-white/90 mt-2">
                Đổi điểm lấy quà tặng và ưu đãi hấp dẫn
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold flex items-center gap-2">
                <Star className="size-10 fill-white" />
                {userPoints.toLocaleString()}
              </div>
              <p className="text-sm text-white/90 mt-1">Điểm khả dụng</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="vouchers" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="vouchers" className="gap-2">
            <Gift className="size-4" />
            Danh Sách Quà Tặng
          </TabsTrigger>
          <TabsTrigger value="redemption" className="gap-2">
            <Ticket className="size-4" />
            Voucher Của Tôi
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="size-4" />
            Lịch Sử Điểm
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Danh sách voucher có thể đổi */}
        <TabsContent value="vouchers" className="space-y-4">
          <VoucherList
            vouchers={vouchers}
            userPoints={userPoints}
            onRedeemVoucher={handleRedeemVoucher}
          />
        </TabsContent>

        {/* Tab 2: Lịch sử đổi voucher */}
        <TabsContent value="redemption">
          <RedemptionHistory redemptionHistory={redemptionHistory} />
        </TabsContent>

        {/* Tab 3: Lịch sử giao dịch điểm */}
        <TabsContent value="history">
          <PointHistory pointTransactions={pointTransactions} />
        </TabsContent>
      </Tabs>

      {/* Dialog xác nhận đổi voucher */}
      <RedeemDialog
        isOpen={isRedeemDialogOpen}
        onClose={() => setIsRedeemDialogOpen(false)}
        selectedVoucher={selectedVoucher}
        userPoints={userPoints}
        onConfirm={confirmRedeem}
      />
    </div>
  );
}

export default Rewards;
