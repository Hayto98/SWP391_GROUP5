import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Pencil, Loader2 } from "lucide-react";

// 1=ADMIN, 2=ENTERPRISE, 3=COLLECTOR, 4=CITIZEN
const ROLE_MAP = {
  1: { label: "Quản trị viên", variant: "destructive" },
  2: { label: "Doanh nghiệp", variant: "outline" },
  3: { label: "Người thu gom", variant: "default" },
  4: { label: "Cư dân", variant: "secondary" },
};

function getRoleDisplay(roleId) {
  return ROLE_MAP[roleId] || { label: "Chưa xác định", variant: "secondary" };
}

function getInitials(fullname) {
  if (!fullname) return "?";
  return fullname
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getVisiblePages(currentPage, totalPages) {
  const delta = 2; // Số trang hiển thị mỗi bên
  const range = [];
  const rangeWithDots = [];

  for (
    let i = Math.max(2, currentPage - delta);
    i <= Math.min(totalPages - 1, currentPage + delta);
    i++
  ) {
    range.push(i);
  }

  if (currentPage - delta > 2) {
    rangeWithDots.push(1, "...");
  } else {
    rangeWithDots.push(1);
  }

  rangeWithDots.push(...range);

  if (currentPage + delta < totalPages - 1) {
    rangeWithDots.push("...", totalPages);
  } else if (totalPages > 1) {
    rangeWithDots.push(totalPages);
  }

  return rangeWithDots;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export function UserTable({
  users,
  total,
  page,
  limit,
  loading,
  onPageChange,
  onLimitChange,
  onViewUser,
  onEditUser,
}) {
  const totalPages = Math.max(1, Math.ceil(total / limit) || 1);
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">ID</TableHead>
            <TableHead>Người dùng</TableHead>
            <TableHead>Số điện thoại</TableHead>
            <TableHead>Vai trò</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} className="h-32 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Đang tải...</span>
                </div>
              </TableCell>
            </TableRow>
          ) : users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                Không có người dùng nào
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => {
              const roleInfo = getRoleDisplay(user.roleId);
              const status = user.isLocked ? "locked" : "active";
              return (
                <TableRow key={user.userAccountId}>
                  <TableCell className="font-mono text-xs truncate max-w-[120px]">
                    {user.userAccountId?.slice(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{getInitials(user.fullname)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-semibold">{user.fullname}</span>
                        <span className="text-sm text-muted-foreground">
                          {user.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.phone || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={roleInfo.variant}>{roleInfo.label}</Badge>
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        status === "active"
                          ? "text-green-600 font-medium"
                          : "text-red-600 font-medium"
                      }
                    >
                      {status === "active" ? "Đang hoạt động" : "Bị khoá"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <div className="flex gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="bg-blue-100 text-blue-500 hover:bg-blue-100 hover:text-blue-600"
                              onClick={() => onViewUser(user)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Xem</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="bg-orange-100 text-orange-500 hover:bg-orange-100 hover:text-orange-600"
                              onClick={() => onEditUser(user)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Sửa</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <div className="flex flex-row items-center justify-between gap-4 px-4 py-4 border-t">
        <div className="flex items-center gap-4 shrink-0">
          <p className="text-sm text-muted-foreground whitespace-nowrap">
            Hiển thị {startItem}-{endItem} / {total} người dùng
          </p>
          {onLimitChange && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Mỗi trang:</span>
              <Select
                value={String(limit)}
                onValueChange={(v) => {
                  onLimitChange(Number(v));
                  onPageChange(1);
                }}
              >
                <SelectTrigger className="w-[70px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
               <Pagination className="justify-end shrink-0">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (page > 1) onPageChange(page - 1);
                }}
                className={
                  page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
                }
              />
            </PaginationItem>
            {getVisiblePages(page, totalPages).map((p, idx) =>
              p === "..." ? (
                <PaginationItem key={`ellipsis-${idx}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={p}>
                  <PaginationLink
                    href="#"
                    isActive={p === page}
                    onClick={(e) => {
                      e.preventDefault();
                      onPageChange(p);
                    }}
                    className="cursor-pointer"
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              )
            )}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (page < totalPages) onPageChange(page + 1);
                }}
                className={
                  page >= totalPages
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
        </div>
   
      </div>
    </Card>
  );
}
