import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, UserRoundPlus } from "lucide-react";

export function UserFilters({ onAddUser }) {
  return (
    <Card className="w-full my-4 px-4 flex flex-row gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="tìm theo tên hoặc email."
          className="pl-10"
        />
      </div>
      <Select>
        <SelectTrigger className="w-full max-w-48">
          <SelectValue placeholder="Tất cả vai trò" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="1">Quản trị viên</SelectItem>
            <SelectItem value="2">Cư dân</SelectItem>
            <SelectItem value="3">Doanh nghiệp</SelectItem>
            <SelectItem value="4">Người thu gom</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select>
        <SelectTrigger className="w-full max-w-48">
          <SelectValue placeholder="Trạng thái hoạt động" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="1">Đang hoạt động</SelectItem>
            <SelectItem value="2">Bị khoá</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <Button onClick={onAddUser}>
        <UserRoundPlus />
        Thêm người dùng
      </Button>
    </Card>
  );
}
