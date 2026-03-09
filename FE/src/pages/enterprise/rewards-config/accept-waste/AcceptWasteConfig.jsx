import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAcceptWasteConfig } from "@/hooks/useAcceptWasteConfig";
import {
  Check,
  Cog,
  FileText,
  Loader2,
  Recycle,
  Wine,
  Zap,
} from "lucide-react";

const IconByType = ({ type }) => {
  if (type === "paper") return FileText;
  if (type === "recycle") return Recycle;
  if (type === "glass") return Wine;
  if (type === "metal") return Cog;
  return Zap;
};

export default function AcceptWasteConfig() {
  const { data, loading, error, savingId, storagePercent, toggleCategory } =
    useAcceptWasteConfig();

  if (loading) {
    return (
      <Card>
        <CardContent className="flex h-24 items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Đang tải...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex h-24 items-center justify-center text-red-600">
          Lỗi: {error}
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const percent = Math.max(0, Math.min(100, Math.round(storagePercent || 0)));

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-lg lg:text-2xl font-bold tracking-tight">
          Cấu hình Loại rác Tiếp nhận
        </h1>
        <p className="text-green-600 text-sm mt-1">
          Xác định loại vật liệu tái chế mà doanh nghiệp có khả năng xử lý.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quy tắc tiếp nhận</CardTitle>
            <CardDescription>{data.rule.desc}</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-slate-700">{data.rule.title}</p>
            <Badge
              variant="outline"
              className="border-emerald-200 bg-emerald-50 text-emerald-700"
            >
              <Check className="size-3" />
              {data.rule.status}
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Dung lượng kho</CardTitle>
            <CardDescription className="text-emerald-700">
              {data.storage.used.toFixed(2)} / {data.storage.total.toFixed(2)} {data.storage.unit}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-2 rounded-full bg-emerald-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="mt-2 text-xs font-semibold text-emerald-700">{percent}% đã sử dụng</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh mục loại rác tiếp nhận</CardTitle>
          <CardDescription>
            Chọn loại vật liệu doanh nghiệp đang tiếp nhận xử lý.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {data.categories.map((c) => {
              const Icon = IconByType(c.icon);
              const active = !!c.enabled;
              const disabledCard = !!c.disabledCard;
              const saving = savingId === c.id;

              return (
                <Button
                  key={c.id}
                  variant="outline"
                  className={[
                    "h-auto items-start justify-between gap-3 p-4 text-left",
                    active && "border-emerald-300 bg-emerald-50",
                    disabledCard && "opacity-50",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => toggleCategory(c.id)}
                  disabled={disabledCard || saving}
                  type="button"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={[
                        "flex h-10 w-10 items-center justify-center rounded-lg border",
                        active
                          ? "border-emerald-300 bg-emerald-100 text-emerald-700"
                          : "border-slate-200 bg-slate-100 text-slate-600",
                      ].join(" ")}
                    >
                      <Icon className="size-4" />
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                      <p className="text-xs text-muted-foreground whitespace-normal">
                        {c.desc}
                      </p>
                    </div>
                  </div>

                  <div className="pl-2">
                    {saving ? (
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    ) : (
                      <Badge
                        variant="outline"
                        className={
                          active
                            ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                            : "border-slate-200 bg-slate-100 text-slate-600"
                        }
                      >
                        {active ? "Bật" : "Tắt"}
                      </Badge>
                    )}
                  </div>
                </Button>
              );
            })}
          </div>

          {savingId && (
            <p className="mt-3 text-xs text-muted-foreground">Đang cập nhật danh mục...</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}