import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
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
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Loader2,
  Pencil,
  Plus,
  Search,
  Truck,
  Users,
} from "lucide-react";

const statusMeta = {
  ready: {
    text: "Sẵn sàng",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  busy: {
    text: "Đang bận",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  leave: {
    text: "Nghỉ phép",
    className: "border-slate-200 bg-slate-100 text-slate-700",
  },
};

const statMeta = {
  total: {
    title: "Tổng nhân sự",
    sub: "+4.2%",
    icon: Users,
    iconTone: "border-slate-200 bg-slate-100 text-slate-700",
  },
  ready: {
    title: "Sẵn sàng",
    sub: "Đủ điều phối",
    icon: CheckCircle2,
    iconTone: "border-emerald-200 bg-emerald-100 text-emerald-700",
  },
  busy: {
    title: "Đang làm nhiệm vụ",
    sub: "22% công suất",
    icon: Truck,
    iconTone: "border-amber-200 bg-amber-100 text-amber-700",
  },
  leave: {
    title: "Nghỉ phép",
    sub: "Theo lịch đăng ký",
    icon: CalendarDays,
    iconTone: "border-slate-200 bg-slate-100 text-slate-700",
  },
};

function Avatar({ seed }) {
  return (
    <div className="flex size-9 items-center justify-center rounded-full border border-cyan-200 bg-cyan-100 text-xs font-black text-cyan-700">
      {seed}
    </div>
  );
}

function StatusBadge({ status }) {
  const meta = statusMeta[status] || {
    text: status || "Không xác định",
    className: "border-slate-200 bg-slate-100 text-slate-700",
  };

  return (
    <Badge variant="outline" className={meta.className}>
      {meta.text}
    </Badge>
  );
}

function taskPercent(tasks) {
  return Math.min(100, Math.max(0, (Number(tasks || 0) / 6) * 100));
}

export default function Collectors() {
  const {
    data,
    loading,
    error,
    q,
    status,
    onlyReady,
    page,
    pageSize,
    setQ,
    setStatus,
    setOnlyReady,
    setPage,
    reload,
  } = useCollectors();

  const summary = data?.summary || { total: 0, ready: 0, busy: 0, leave: 0 };
  const total = data?.result?.total || 0;
  const rows = data?.result?.rows || [];
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const chipItems = data?.filters?.status || ["Tất cả", "Sẵn sàng", "Đang bận", "Nghỉ phép"];
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

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

  return (
    <div className="space-y-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight lg:text-2xl">Quản lý nhân viên thu gom</h1>
          <p className="mt-1 text-sm text-green-600">
            Theo dõi trạng thái làm việc và hiệu suất của đội ngũ collector.
          </p>
        </div>

        <Button type="button">
          <Plus className="size-4" />
          Thêm nhân viên mới
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
                <p className="text-3xl font-black leading-none tracking-tight">{summary[key] ?? 0}</p>
                <p className="text-xs font-medium text-muted-foreground">{meta.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bộ lọc nhân sự</CardTitle>
          <CardDescription>Lọc nhanh theo trạng thái sẵn sàng và từ khóa tìm kiếm.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {chipItems.map((item) => (
              <Button
                key={item}
                type="button"
                variant={status === item ? "default" : "outline"}
                size="sm"
                onClick={() => setStatus(item)}
              >
                {item}
              </Button>
            ))}
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                className="size-4 rounded border-slate-300 accent-emerald-600"
                checked={onlyReady}
                onChange={(e) => setOnlyReady(e.target.checked)}
              />
              Chỉ hiển thị sẵn sàng
            </label>

            <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
              <Button type="button" variant="outline" size="sm">
                <Filter className="size-4" />
                Bộ lọc nâng cao
              </Button>

              <div className="relative sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo tên hoặc mã..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Danh sách collector</CardTitle>
          <CardDescription>Cập nhật theo trạng thái thời gian thực từ hệ thống điều phối.</CardDescription>
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
              <Button type="button" variant="link" size="sm" className="ml-2 h-auto p-0" onClick={reload}>
                Thử lại
              </Button>
            </div>
          )}

          {!loading && !error && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nhân viên thu gom</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Nhiệm vụ đang chờ</TableHead>
                    <TableHead>Hoạt động cuối</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                        Không có nhân viên phù hợp với bộ lọc.
                      </TableCell>
                    </TableRow>
                  )}

                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar seed={row.avatarSeed} />
                          <div>
                            <p className="font-semibold">{row.name}</p>
                            <p className="text-xs text-muted-foreground">{row.code}</p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <StatusBadge status={row.status} />
                      </TableCell>

                      <TableCell>
                        <div className="w-40 max-w-full">
                          <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-700">
                            <span>{row.tasks}</span>
                            <span>{Math.round(taskPercent(row.tasks))}%</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                            <div
                              className="h-full rounded-full bg-emerald-500 transition-all"
                              style={{ width: `${taskPercent(row.tasks)}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground">{row.lastActive}</TableCell>

                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="icon-sm" className="size-8" title="Xem">
                            <Eye className="size-4" />
                          </Button>
                          <Button variant="outline" size="icon-sm" className="size-8" title="Sửa">
                            <Pencil className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

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
                        <span key={`ellipsis-${index}`} className="px-2 text-xs font-semibold text-muted-foreground">
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
    </div>
  );
}