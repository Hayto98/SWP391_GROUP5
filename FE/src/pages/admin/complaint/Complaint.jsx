import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
import { toast } from "sonner";

const FAKE_LIST_RESPONSE = {
  success: true,
  data: [
    {
      complaintId: "4bc06b00-403c-417e-a264-6e1f27211111",
      citizenName: "Nguyen Van A",
      collectorName: "Tran Van B",
      status: "PENDING",
      adminResponse: null,
      refundPoints: 0,
      createdAt: "2026-03-01T10:00:00",
      resolvedAt: null,
    },
    {
      complaintId: "0e6e14c8-3aeb-4b05-8dc3-c035f3522222",
      citizenName: "Le Thi C",
      collectorName: "Pham Van D",
      status: "RESOLVED",
      adminResponse: "Da xac minh va hoan diem",
      refundPoints: 20,
      createdAt: "2026-03-02T09:30:00",
      resolvedAt: "2026-03-03T13:00:00",
    },
    {
      complaintId: "fdbfc188-1b92-4944-900f-cf778dbf3333",
      citizenName: "Vo Minh E",
      collectorName: null,
      status: "REJECTED",
      adminResponse: "Khieu nai khong hop le",
      refundPoints: 0,
      createdAt: "2026-03-04T15:20:00",
      resolvedAt: "2026-03-05T08:45:00",
    },
  ],
  pagination: {
    page: 1,
    size: 10,
    totalElements: 3,
    totalPages: 1,
  },
};

const FAKE_DETAIL_MAP = {
  "4bc06b00-403c-417e-a264-6e1f27211111": {
    success: true,
    data: {
      complaintId: "4bc06b00-403c-417e-a264-6e1f27211111",
      citizen: {
        id: "citizen-1111",
        name: "Nguyen Van A",
      },
      collector: {
        id: "collector-1111",
        name: "Tran Van B",
      },
      status: "PENDING",
      complaintContent: "Collector khong den thu gom dung gio",
      adminResponse: null,
      refundPoints: 0,
      createdAt: "2026-03-01T10:00:00",
      resolvedAt: null,
      resolvedBy: null,
    },
  },
  "0e6e14c8-3aeb-4b05-8dc3-c035f3522222": {
    success: true,
    data: {
      complaintId: "0e6e14c8-3aeb-4b05-8dc3-c035f3522222",
      citizen: {
        id: "citizen-2222",
        name: "Le Thi C",
      },
      collector: {
        id: "collector-2222",
        name: "Pham Van D",
      },
      status: "RESOLVED",
      complaintContent: "Collector bao sai trang thai thu gom",
      adminResponse: "Da xac minh va hoan diem",
      refundPoints: 20,
      createdAt: "2026-03-02T09:30:00",
      resolvedAt: "2026-03-03T13:00:00",
      resolvedBy: {
        adminId: "admin-1",
        adminName: "Admin 1",
      },
    },
  },
  "fdbfc188-1b92-4944-900f-cf778dbf3333": {
    success: true,
    data: {
      complaintId: "fdbfc188-1b92-4944-900f-cf778dbf3333",
      citizen: {
        id: "citizen-3333",
        name: "Vo Minh E",
      },
      collector: null,
      status: "REJECTED",
      complaintContent: "Khieu nai khong ro noi dung",
      adminResponse: "Khieu nai khong hop le",
      refundPoints: 0,
      createdAt: "2026-03-04T15:20:00",
      resolvedAt: "2026-03-05T08:45:00",
      resolvedBy: {
        adminId: "admin-2",
        adminName: "Admin 2",
      },
    },
  },
};

const STATUS_OPTIONS = ["ALL", "PENDING", "RESOLVED", "REJECTED"];
const PAGE_SIZE_OPTIONS = ["5", "10", "20"];
const CURRENT_ADMIN = {
  adminId: "admin-local",
  adminName: "Admin Demo",
};

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN");
}

function shortId(id) {
  return `${id.slice(0, 8)}...${id.slice(-4)}`;
}

function getStatusBadgeVariant(status) {
  if (status === "PENDING") return "secondary";
  if (status === "RESOLVED") return "default";
  return "destructive";
}

function Complaint() {
  const [listData, setListData] = useState(FAKE_LIST_RESPONSE.data);
  const [detailMap, setDetailMap] = useState(FAKE_DETAIL_MAP);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [citizenKeyword, setCitizenKeyword] = useState("");

  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);

  const [selectedId, setSelectedId] = useState(null);
  const [adminResponse, setAdminResponse] = useState("");
  const [refundPoints, setRefundPoints] = useState(0);
  const [openDetail, setOpenDetail] = useState(false);

  const filteredRows = useMemo(() => {
    return listData.filter((row) => {
      if (statusFilter !== "ALL" && row.status !== statusFilter) return false;
      if (
        citizenKeyword &&
        !row.citizenName.toLowerCase().includes(citizenKeyword.toLowerCase())
      ) {
        return false;
      }

      if (fromDate) {
        const createdDate = row.createdAt.slice(0, 10);
        if (createdDate < fromDate) return false;
      }

      if (toDate) {
        const createdDate = row.createdAt.slice(0, 10);
        if (createdDate > toDate) return false;
      }

      return true;
    });
  }, [citizenKeyword, fromDate, listData, statusFilter, toDate]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / size));

  const pagedRows = useMemo(() => {
    const start = (page - 1) * size;
    return filteredRows.slice(start, start + size);
  }, [filteredRows, page, size]);

  const selectedDetail = selectedId ? detailMap[selectedId]?.data : null;

  const openDetailDialog = (complaintId) => {
    const detail = detailMap[complaintId]?.data;
    if (!detail) {
      toast.error("Khong tim thay chi tiet khieu nai.");
      return;
    }

    setSelectedId(complaintId);
    setAdminResponse(detail.adminResponse || "");
    setRefundPoints(detail.refundPoints || 0);
    setOpenDetail(true);
  };

  const resetFilters = () => {
    setStatusFilter("ALL");
    setFromDate("");
    setToDate("");
    setCitizenKeyword("");
    setPage(1);
  };

  const updateRowStatus = (complaintId, updates) => {
    setListData((prev) =>
      prev.map((row) => {
        if (row.complaintId !== complaintId) return row;
        return { ...row, ...updates };
      }),
    );
  };

  const updateDetailStatus = (complaintId, updates) => {
    setDetailMap((prev) => {
      const current = prev[complaintId];
      if (!current) return prev;
      return {
        ...prev,
        [complaintId]: {
          ...current,
          data: {
            ...current.data,
            ...updates,
          },
        },
      };
    });
  };

  const handleResolve = () => {
    if (!selectedDetail) return;
    if (selectedDetail.status !== "PENDING") {
      toast.error("Chi co the xu ly khieu nai o trang thai PENDING.");
      return;
    }
    if (!adminResponse.trim()) {
      toast.error("adminResponse khong duoc de trong.");
      return;
    }
    if (refundPoints < 0) {
      toast.error("refundPoints phai lon hon hoac bang 0.");
      return;
    }

    const resolvedAt = new Date().toISOString();
    updateRowStatus(selectedDetail.complaintId, {
      status: "RESOLVED",
      adminResponse: adminResponse.trim(),
      refundPoints: Number(refundPoints),
      resolvedAt,
    });
    updateDetailStatus(selectedDetail.complaintId, {
      status: "RESOLVED",
      adminResponse: adminResponse.trim(),
      refundPoints: Number(refundPoints),
      resolvedAt,
      resolvedBy: CURRENT_ADMIN,
    });

    toast.success("Complaint resolved and points refunded", {
      description: `refundPoints: ${Number(refundPoints)}`,
    });
    setOpenDetail(false);
  };

  const handleReject = () => {
    if (!selectedDetail) return;
    if (selectedDetail.status !== "PENDING") {
      toast.error("Chi co the xu ly khieu nai o trang thai PENDING.");
      return;
    }
    if (!adminResponse.trim()) {
      toast.error("adminResponse khong duoc de trong.");
      return;
    }

    const resolvedAt = new Date().toISOString();
    updateRowStatus(selectedDetail.complaintId, {
      status: "REJECTED",
      adminResponse: adminResponse.trim(),
      refundPoints: 0,
      resolvedAt,
    });
    updateDetailStatus(selectedDetail.complaintId, {
      status: "REJECTED",
      adminResponse: adminResponse.trim(),
      refundPoints: 0,
      resolvedAt,
      resolvedBy: CURRENT_ADMIN,
    });

    toast.success("Complaint rejected successfully");
    setOpenDetail(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Quan ly khieu nai</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Loc theo trang thai" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
            />

            <Input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
            />

            <Input
              placeholder="Tim theo ten nguoi gui"
              value={citizenKeyword}
              onChange={(e) => {
                setCitizenKeyword(e.target.value);
                setPage(1);
              }}
            />

            <Button variant="outline" onClick={resetFilters}>
              Dat lai bo loc
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nguoi gui</TableHead>
                <TableHead>Collector</TableHead>
                <TableHead>Trang thai</TableHead>
                <TableHead>Tao luc</TableHead>
                <TableHead>Xu ly luc</TableHead>
                <TableHead className="text-right">Thao tac</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Khong co du lieu phu hop bo loc.
                  </TableCell>
                </TableRow>
              ) : (
                pagedRows.map((row) => (
                  <TableRow key={row.complaintId}>
                    <TableCell className="font-mono text-xs">{shortId(row.complaintId)}</TableCell>
                    <TableCell>{row.citizenName}</TableCell>
                    <TableCell>{row.collectorName || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(row.status)}>{row.status}</Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(row.createdAt)}</TableCell>
                    <TableCell>{formatDateTime(row.resolvedAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" onClick={() => openDetailDialog(row.complaintId)}>
                        Xem chi tiet
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              Tong: {filteredRows.length} ban ghi
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <span>Moi trang</span>
                <Select
                  value={String(size)}
                  onValueChange={(value) => {
                    setSize(Number(value));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[80px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Pagination className="justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPage((prev) => Math.max(1, prev - 1));
                      }}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#" isActive>
                      {page}/{totalPages}
                    </PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPage((prev) => Math.min(totalPages, prev + 1));
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={openDetail} onOpenChange={setOpenDetail}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiet khieu nai</DialogTitle>
            <DialogDescription>
              Fake response theo Jira task: xem chi tiet va xu ly resolve/reject.
            </DialogDescription>
          </DialogHeader>

          {selectedDetail && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Complaint ID</p>
                  <p className="font-mono text-sm break-all">{selectedDetail.complaintId}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Trang thai</p>
                  <Badge variant={getStatusBadgeVariant(selectedDetail.status)}>
                    {selectedDetail.status}
                  </Badge>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Nguoi gui</p>
                  <p className="text-sm">
                    {selectedDetail.citizen.name} ({selectedDetail.citizen.id})
                  </p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Collector</p>
                  <p className="text-sm">
                    {selectedDetail.collector
                      ? `${selectedDetail.collector.name} (${selectedDetail.collector.id})`
                      : "-"}
                  </p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Tao luc</p>
                  <p className="text-sm">{formatDateTime(selectedDetail.createdAt)}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Xu ly luc</p>
                  <p className="text-sm">{formatDateTime(selectedDetail.resolvedAt)}</p>
                </div>
              </div>

              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Noi dung khieu nai</p>
                <p className="mt-1 text-sm">{selectedDetail.complaintContent}</p>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium">adminResponse</p>
                  <Textarea
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                    placeholder="Nhap phan hoi cua admin..."
                    disabled={selectedDetail.status !== "PENDING"}
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">refundPoints</p>
                  <Input
                    type="number"
                    min={0}
                    value={refundPoints}
                    onChange={(e) => setRefundPoints(Number(e.target.value))}
                    disabled={selectedDetail.status !== "PENDING"}
                  />
                  <p className="text-xs text-muted-foreground">
                    Chi ap dung khi resolve. Reject se luon dat ve 0.
                  </p>
                </div>
              </div>

              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Resolved by</p>
                <p className="text-sm">
                  {selectedDetail.resolvedBy
                    ? `${selectedDetail.resolvedBy.adminName} (${selectedDetail.resolvedBy.adminId})`
                    : "-"}
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpenDetail(false)}>
                  Dong
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={selectedDetail.status !== "PENDING"}
                >
                  Tu choi khieu nai
                </Button>
                <Button
                  onClick={handleResolve}
                  disabled={selectedDetail.status !== "PENDING"}
                >
                  Resolve + Hoan diem
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Complaint;

