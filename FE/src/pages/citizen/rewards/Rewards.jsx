import React, { useEffect, useState } from "react";
import {
  Card,
  CardDescription,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gift, Star, Trophy, Ticket, History } from "lucide-react";
import { toast } from "sonner";
import VoucherList from "./components/VoucherList";
import RedemptionHistory from "./components/RedemptionHistory";
import PointHistory from "./components/PointHistory";
import RedeemDialog from "./components/RedeemDialog";
import {
  getAvailableVouchers,
  getMyPoints,
  getPointHistory,
  getRedeemedVouchers,
  redeemVoucher,
} from "@/services/citizenRewards.service";

function Rewards() {
  const [userPoints, setUserPoints] = useState(0);
  const [vouchers, setVouchers] = useState([]);
  const [redemptionHistory, setRedemptionHistory] = useState([]);
  const [pointTransactions, setPointTransactions] = useState([]);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [isRedeemDialogOpen, setIsRedeemDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [loadError, setLoadError] = useState("");

  const loadRewardsData = async ({ silent = false } = {}) => {
    if (!silent) {
      setIsLoading(true);
    }

    setLoadError("");

    try {
      const [
        pointsResponse,
        vouchersResponse,
        redeemedResponse,
        historyResponse,
      ] = await Promise.all([
        getMyPoints(),
        getAvailableVouchers({ page: 1, limit: 10 }),
        getRedeemedVouchers(),
        getPointHistory({ page: 1, limit: 20 }),
      ]);

      setUserPoints(Number(pointsResponse?.data?.totalPoints) || 0);
      setVouchers(
        Array.isArray(vouchersResponse?.data) ? vouchersResponse.data : [],
      );
      setRedemptionHistory(
        Array.isArray(redeemedResponse?.data) ? redeemedResponse.data : [],
      );
      setPointTransactions(
        Array.isArray(historyResponse?.data) ? historyResponse.data : [],
      );
    } catch (error) {
      const message = error?.message || "Không thể tải dữ liệu phần thưởng.";
      setLoadError(message);

      if (silent) {
        toast.error(message);
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    loadRewardsData();
  }, []);

  const handleRedeemVoucher = (voucher) => {
    setSelectedVoucher(voucher);
    setIsRedeemDialogOpen(true);
  };

  const confirmRedeem = async () => {
    if (!selectedVoucher) {
      return;
    }

    if (!selectedVoucher.canRedeem) {
      toast.error("Bạn hiện không đủ điều kiện để đổi voucher này.");
      return;
    }

    setIsRedeeming(true);

    try {
      await redeemVoucher(selectedVoucher.voucherId);
      toast.success(`Đã đổi voucher "${selectedVoucher.title}" thành công.`);
      setIsRedeemDialogOpen(false);
      setSelectedVoucher(null);
      await loadRewardsData({ silent: true });
    } catch (error) {
      toast.error(error?.message || "Đổi voucher thất bại.");
    } finally {
      setIsRedeeming(false);
    }
  };

  const renderVoucherContent = () => {
    if (isLoading) {
      return (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Đang tải danh sách quà tặng...
          </CardContent>
        </Card>
      );
    }

    if (loadError) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <p className="text-sm text-destructive">{loadError}</p>
            <Button variant="outline" onClick={() => loadRewardsData()}>
              Tải lại
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <VoucherList vouchers={vouchers} onRedeemVoucher={handleRedeemVoucher} />
    );
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
          {renderVoucherContent()}
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
        isSubmitting={isRedeeming}
        onConfirm={confirmRedeem}
      />
    </div>
  );
}

export default Rewards;
