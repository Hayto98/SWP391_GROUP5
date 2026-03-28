import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCollectors } from "@/hooks/useCollectors";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Plus,
  Search,
  Trash2,
  ClipboardList,
  CheckCircle,
  XCircle,
} from "lucide-react";

import AddEmployeeModal from "./AddEmployeeModal";
import DeleteEmployeeDialog from "./DeleteEmployeeDialog";
import ViewEmployeeDialog from "./ViewEmployeeDialog";

/* ─── Stat card metadata ─────────────────────────────────────────────── */
const statMeta = {
  assigned: {
    title: "Tổng nhiệm vụ giao",
    icon: ClipboardList,
    iconTone: "border-blue-200 bg-blue-100 text-blue-700",
  },
  completed: {
    title: "Đã hoàn thành",
    icon: CheckCircle,
    iconTone: "border-emerald-200 bg-emerald-100 text-emerald-700",
  },
  rejected: {
    title: "Từ chối",
    icon: XCircle,
    iconTone: "border-red-200 bg-red-100 text-red-700",
  },
};

/* ─── Helpers ─────────────────────────────────────────────────────────── */
function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(-2)
    .join("")
    .toUpperCase();
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

function truncateId(uuid) {
  if (!uuid) return "—";
  return uuid.length > 8 ? `${uuid.slice(0, 8)}...` : uuid;
}

/* ─── Avatar ──────────────────────────────────────────────────────────── */
function Avatar({ seed }) {
  return (
    <div className="flex size-9 items-center justify-center rounded-full border border-cyan-200 bg-cyan-100 text-xs font-black text-cyan-700">
      {seed}
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────────────────── */
export default function Collectors() {
  const {
    rows,
    total,
    totalPages,
    startItem,
    endItem,
    totalEmployees,
    statistics,
    loading,
    error,
    q,
    page,
    setQ,
    setPage,
    reload,
    handleCreate,
    handleDelete,
    getDetail,
  } = useCollectors();

  // ── Modal states ────────────────────────────────────────────────────
  const [showAdd, setShowAdd] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showView, setShowView] = useState(false);
  const [viewTargetId, setViewTargetId] = useState(null);

  // ── Pagination helper ───────────────────────────────────────────────
  const pages = useMemo(() => {
    const arr = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i += 1) arr.push(i);
      return arr;
    }
    arr.push(1);
    if (page > 3) arr.push("...");
    const from = Math.max(2, page - 1);
    const to = Math.min(totalPages - 1, page + 1);
    for (let i = from; i <= to; i += 1) arr.push(i);
    if (page < totalPages - 2) arr.push("...");
    arr.push(totalPages);
    return arr;
  }, [page, totalPages]);

  // ── Handlers ────────────────────────────────────────────────────────
  function openDelete(emp) {
    setDeleteTarget(emp);
    setShowDelete(true);
  }

  function openView(empId) {
    setViewTargetId(empId);
    setShowView(true);
  }

  return (
    <div className="space-y-6">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight lg:text-2xl">
            Quản lý nhân viên thu gom
          </h1>
          <p className="mt-1 text-sm text-green-600">
            Theo dõi và quản lý đội ngũ collector của doanh nghiệp.
          </p>
        </div>

        <Button type="button" onClick={() => setShowAdd(true)}>
          <Plus className="size-4" />
          Thêm nhân viên mới
        </Button>
      </div>

      {/* ── Stat Cards ───────────────────────────────────────────────── */}
      {/* <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Object.entries(statMeta).map(([key, meta]) => {
          const Icon = meta.icon;
          return (
            <Card key={key}>
              <CardContent className="space-y-3 py-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {meta.title}
                  </p>
                  <span
                    className={[
                      "flex size-8 items-center justify-center rounded-md border",
                      meta.iconTone,
                    ].join(" ")}
                  >
                    <Icon className="size-4" />
                  </span>
                </div>
                <p className="text-3xl font-black leading-none tracking-tight">
                  {statistics[key] ?? 0}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div> */}

      {/* ── Search ───────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tìm kiếm nhân viên</CardTitle>
          <CardDescription>
            Tìm nhanh nhân viên theo tên, email hoặc số điện thoại.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên, email, SĐT..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Employee Table ───────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="space-y-1">
            <CardTitle className="text-base">Danh sách nhân viên</CardTitle>
            <CardDescription>
              Danh sách nhân viên thu gom trong hệ thống.
            </CardDescription>
          </div>
          <div className="flex h-7 items-center justify-center rounded-full bg-green-600 px-3 text-xs font-bold text-white shadow-sm ring-1 ring-green-600/20">
            {totalEmployees} nhân viên
          </div>
        </CardHeader>

        <CardContent>
          {loading && (
            <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Đang tải danh sách nhân sự...
            </div>
          )}

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              Lỗi: {error}
              <Button
                type="button"
                variant="link"
                size="sm"
                className="ml-2 h-auto p-0"
                onClick={reload}
              >
                Thử lại
              </Button>
            </div>
          )}

          {!loading && !error && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nhân viên</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Số điện thoại</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-6 text-center text-muted-foreground"
                      >
                        Không có nhân viên phù hợp.
                      </TableCell>
                    </TableRow>
                  )}

                  {rows.map((row) => (
                    <TableRow key={row.userAccountId}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar seed={getInitials(row.fullname)} />
                          <div>
                            <p className="font-semibold">{row.fullname}</p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-sm">
                        {row.email || "—"}
                      </TableCell>

                      <TableCell className="text-sm">
                        {row.phone || "—"}
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(row.createdAt)}
                      </TableCell>

                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon-sm"
                            className="size-8"
                            title="Xem chi tiết"
                            onClick={() => openView(row.userAccountId)}
                          >
                            <Eye className="size-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon-sm"
                            className="size-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                            title="Xóa"
                            onClick={() => openDelete(row)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* ── Pagination ─────────────────────────────────────────── */}
              <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-semibold text-muted-foreground">
                  Đang hiển thị {startItem}-{endItem} trên {total} nhân viên
                </p>

                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="size-4" />
                    Trước
                  </Button>

                  {pages.map((item, index) => {
                    if (item === "...") {
                      return (
                        <span
                          key={`ellipsis-${index}`}
                          className="px-2 text-xs font-semibold text-muted-foreground"
                        >
                          ...
                        </span>
                      );
                    }

                    return (
                      <Button
                        key={item}
                        type="button"
                        variant={page === item ? "default" : "outline"}
                        size="sm"
                        className="min-w-8 px-2"
                        onClick={() => setPage(item)}
                      >
                        {item}
                      </Button>
                    );
                  })}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Tiếp
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Modals ───────────────────────────────────────────────────── */}
      <AddEmployeeModal
        open={showAdd}
        onOpenChange={setShowAdd}
        onSubmit={handleCreate}
      />

      <DeleteEmployeeDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        employee={deleteTarget}
        onConfirm={handleDelete}
      />

      <ViewEmployeeDialog
        open={showView}
        onOpenChange={setShowView}
        employeeId={viewTargetId}
        getDetail={getDetail}
      />
    </div>
  );
}
