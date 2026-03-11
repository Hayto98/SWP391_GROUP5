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

export function UserFilters({
  keyword = "",
  role = "",
  onKeywordChange,
  onRoleChange,
  onSearch,
  onAddUser,
}) {
  return (
    <Card className="w-full my-4 px-4 py-3 flex flex-row flex-wrap gap-2">
      <form
        className="flex flex-1 min-w-[200px] gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          onSearch?.();
        }}
      >
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Tìm theo tên, email hoặc SĐT..."
            className="pl-10"
            value={keyword}
            onChange={(e) => onKeywordChange?.(e.target.value)}
          />
        </div>
        <Select value={role || "all"} onValueChange={(v) => onRoleChange?.(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Tất cả vai trò" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả vai trò</SelectItem>
            <SelectGroup>
              <SelectItem value="1">Quản trị viên</SelectItem>
              <SelectItem value="2">Doanh nghiệp</SelectItem>
              <SelectItem value="3">Người thu gom</SelectItem>
              <SelectItem value="4">Cư dân</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <Button type="submit">Tìm kiếm</Button>
      </form>
      <Button onClick={onAddUser}>
        <UserRoundPlus />
        Thêm người dùng
      </Button>
    </Card>
  );
}
