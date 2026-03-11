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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useComplaints } from "@/hooks/useComplaints";
import {
  AlertTriangle,
  Bell,
  Download,
  Loader2,
  Search,
  Send,
  UserRound,
} from "lucide-react";

const severityTone = {
  CAO: "border-red-200 bg-red-50 text-red-700",
  "TRUNG BÌNH": "border-amber-200 bg-amber-50 text-amber-700",
  THẤP: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const statusTone = {
  "Chờ xử lý": "border-blue-200 bg-blue-50 text-blue-700",
  "Đang xử lý": "border-amber-200 bg-amber-50 text-amber-700",
  "Đã giải quyết": "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const reasonTone = {
  "Sai khối lượng": "border-red-200 bg-red-50 text-red-700",
  "Bỏ lỡ thu gom": "border-orange-200 bg-orange-50 text-orange-700",
  "Thái độ NV": "border-purple-200 bg-purple-50 text-purple-700",
};

const timelineDotTone = {
  citizen: "bg-slate-800",
  system: "bg-emerald-500",
  status: "bg-blue-500",
};

function SeverityBadge({ value }) {
  return (
    <Badge
      variant="outline"
      className={severityTone[value] || "border-slate-200 bg-slate-100 text-slate-700"}
    >
      {value || "-"}
    </Badge>
  );
}

function StatusBadge({ value }) {
  return (
    <Badge
      variant="outline"
      className={statusTone[value] || "border-slate-200 bg-slate-100 text-slate-700"}
    >
      {String(value || "-").toUpperCase()}
    </Badge>
  );
}

function ReasonBadge({ value }) {
  return (
    <Badge
      variant="outline"
      className={reasonTone[value] || "border-slate-200 bg-slate-100 text-slate-700"}
    >
      {value || "-"}
    </Badge>
  );
}

export default function ComplaintsEscalation() {
  const {
    data,
    detail,
    loading,
    error,
    tab,
    reason,
    q,
    selectedId,
    message,
    sending,
    setTab,
    setReason,
    setQ,
    pick,
    setMessage,
    send,
    escalate,
    list,
  } = useComplaints();

  if (loading) {
    return (
      <Card>
        <CardContent className="flex h-24 items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Đang tải dữ liệu khiếu nại...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="py-6 text-red-700">Lỗi: {error}</CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight lg:text-2xl">Quản lý khiếu nại và escalation</h1>
          <p className="mt-1 text-sm text-green-600">
            Theo dõi và giải quyết các khiếu nại từ người dân và đối tác.
          </p>
        </div>

        <Button type="button" variant="outline">
          <Download className="size-4" />
          Xuất báo cáo
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm mã báo cáo, lý do hoặc khách hàng..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex gap-2 self-end lg:self-auto">
            <Button variant="outline" size="icon" type="button" title="Thông báo">
              <Bell className="size-4" />
            </Button>
            <Button variant="outline" size="icon" type="button" title="Tài khoản">
              <UserRound className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {data.tabs.map((item) => (
              <Button
                key={item.key}
                type="button"
                size="sm"
                variant={tab === item.key ? "default" : "outline"}
                onClick={() => setTab(item.key)}
              >
                {item.label}
              </Button>
            ))}
          </div>

          <div className="w-full lg:w-64">
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Lý do" />
              </SelectTrigger>
              <SelectContent align="end">
                {data.reasons.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Danh sách khiếu nại</CardTitle>
            <CardDescription>Chọn một dòng để xem timeline và thao tác xử lý chi tiết.</CardDescription>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã báo cáo</TableHead>
                  <TableHead>Lý do</TableHead>
                  <TableHead>Ngày gửi</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Mức độ</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {list.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                      Không có khiếu nại phù hợp bộ lọc.
                    </TableCell>
                  </TableRow>
                )}

                {list.map((item) => (
                  <TableRow
                    key={item.id}
                    className={[
                      "cursor-pointer",
                      selectedId === item.id && "bg-slate-50",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => pick(item.id)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-semibold">{item.id}</p>
                        <p className="text-xs text-muted-foreground">{item.citizen}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <ReasonBadge value={item.reason} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.createdAt}</TableCell>
                    <TableCell>
                      <StatusBadge value={item.status} />
                    </TableCell>
                    <TableCell>
                      <SeverityBadge value={item.severity} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">Chi tiết khiếu nại</CardTitle>
              {detail?.urgent && (
                <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">
                  <AlertTriangle className="size-3" />
                  URGENTLY REQUIRED
                </Badge>
              )}
            </div>
            <CardDescription>
              Mã báo cáo: <b>{detail?.id || "-"}</b> · {detail?.createdAt || "-"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="max-h-72 space-y-3 overflow-auto rounded-md border p-3">
              {(detail?.timeline || []).map((item, index) => (
                <div key={`${item.who}-${index}`} className="flex items-start gap-3">
                  <span
                    className={[
                      "mt-1 inline-block size-2.5 rounded-full",
                      timelineDotTone[item.tone] || "bg-slate-400",
                    ].join(" ")}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{item.who}</p>
                      <span className="text-xs text-muted-foreground">{item.time}</span>
                    </div>
                    {item.text && <p className="mt-1 text-sm text-slate-700">{item.text}</p>}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 rounded-md border p-3">
              <p className="text-sm font-semibold">Đề xuất hành động</p>

              <Button type="button" className="w-full" disabled={sending}>
                XỬ LÝ TRỰC TIẾP
              </Button>

              <Button
                type="button"
                variant="destructive"
                className="w-full"
                onClick={escalate}
                disabled={sending || !selectedId}
              >
                {sending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    ĐANG GỬI...
                  </>
                ) : (
                  "GỬI LÊN HỆ THỐNG (ESCALATE)"
                )}
              </Button>
            </div>

            <div className="flex items-end gap-2">
              <Textarea
                placeholder="Nhập ghi chú hoặc phản hồi cho citizen..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-20"
              />

              <Button
                type="button"
                size="icon"
                onClick={send}
                disabled={sending || !message.trim() || !selectedId}
                title="Gửi phản hồi"
              >
                {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}