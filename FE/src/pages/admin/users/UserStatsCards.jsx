import { Card } from "@/components/ui/card";
import { GrGroup } from "react-icons/gr";
import { RiUserFollowLine, RiUserForbidLine } from "react-icons/ri";

export function UserStatsCards() {
  return (
    <div className="flex gap-4 w-full">
      <Card className="shadow p-4 flex-1 flex flex-row items-center gap-4">
        <div className="bg-blue-100 rounded p-2 w-10 h-10 flex items-center justify-center">
          <GrGroup className="text-blue-500" />
        </div>

        <div className="flex flex-col">
          <span className="text-slate-500 font-semibold">Tổng người dùng</span>
          <h1 className="text-xl font-bold text-primary-foreground">1.500</h1>
        </div>
      </Card>
      <Card className="shadow p-4 flex-1 flex flex-row items-center gap-4">
        <div className="bg-green-100 rounded p-2 w-10 h-10 flex items-center justify-center">
          <RiUserFollowLine className="text-green-500" />
        </div>

        <div className="flex flex-col">
          <span className="text-slate-500 font-semibold">Đang hoạt động</span>
          <h1 className="text-xl font-bold text-primary-foreground">1.500</h1>
        </div>
      </Card>
      <Card className="shadow p-4 flex-1 flex flex-row items-center gap-4">
        <div className="bg-red-100 rounded p-2 w-10 h-10 flex items-center justify-center">
          <RiUserForbidLine className="text-red-500" />
        </div>

        <div className="flex flex-col">
          <span className="text-slate-500 font-semibold">Bị khoá</span>
          <h1 className="text-xl font-bold text-primary-foreground">2</h1>
        </div>
      </Card>
    </div>
  );
}
