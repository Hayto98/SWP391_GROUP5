import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAcceptWasteConfig } from "@/hooks/useAcceptWasteConfig";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  ChevronRight,
  Cog,
  FileText,
  Loader2,
  Recycle,
  Wine,
  Zap,
} from "lucide-react";

const IconByType = ({ type, className }) => {
  let Icon = Zap;

  if (type === "paper") Icon = FileText;
  if (type === "recycle") Icon = Recycle;
  if (type === "glass") Icon = Wine;
  if (type === "metal") Icon = Cog;

  return <Icon className={className} />;
};

export default function AcceptWasteConfig() {
  const { data, loading, error, savingId, storagePercent, toggleCategory } =
    useAcceptWasteConfig();

  if (loading)
    return (
      <div className="flex min-h-80 items-center justify-center p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Đang tải...
        </div>
      </div>
    );

  if (error)
    return (
      <div className="p-6">
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="pt-6 text-sm text-destructive">
            Lỗi: {error}
          </CardContent>
        </Card>
      </div>
    );

  if (!data) return null;

  const percent = Math.max(0, Math.min(100, Math.round(storagePercent || 0)));

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* ── Header ── */}
      <Card className="mb-6">
        <CardHeader className="py-4">
          <CardTitle className="text-primary text-lg">
            Cấu hình Loại rác Tiếp nhận
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Xác định loại vật liệu tái chế mà doanh nghiệp có khả năng xử lý.
          </p>
        </CardHeader>
        <div className="border-t border-gray-100 mx-4" />
        <CardContent className="flex flex-wrap items-start justify-between gap-4 py-4">
          <div className="flex items-start gap-3">
            <div className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
            <div className="space-y-1">
              <div className="text-sm font-medium text-primary">
                {data.rule.title}
              </div>
              <div className="text-sm text-muted-foreground leading-snug">
                {data.rule.desc}
              </div>
            </div>
          </div>

          <Badge
            className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10 hover:text-primary gap-1.5 shadow-none pb-0.5"
            variant="outline"
          >
            <CheckCircle2 className="size-3.5" />
            {data.rule.status?.toUpperCase() || "ĐANG HIỆU LỰC"}
          </Badge>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.categories.map((c) => {
          const active = !!c.enabled;
          const disabledCard = !!c.disabledCard;
          const saving = savingId === c.id;

          return (
            <Card
              key={c.id}
              className={cn(
                "transition-all",
                active &&
                  "border-primary/60 ring-1 ring-primary/20 bg-primary/10",
                disabledCard && "opacity-70",
              )}
            >
              <CardContent className="p-0">
                <div
                  variant="ghost"
                  className="h-auto w-full justify-start p-4"
                  onClick={() => toggleCategory(c.id)}
                  disabled={disabledCard || saving}
                  type="button"
                >
                  <div className="w-full space-y-3 text-left">
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className={cn(
                          "rounded-lg border p-2",
                          active
                            ? "border-primary/30 bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        <IconByType type={c.icon} className="size-5" />
                      </div>

                      <div
                        className={cn(
                          "rounded-full border p-1",
                          active
                            ? "border-primary/40 bg-primary/10 text-primary"
                            : "border-muted-foreground/30 text-transparent",
                        )}
                      >
                        <CheckCircle2 className="size-3.5" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.desc}</p>
                    </div>

                    <div className="min-h-4 text-xs text-primary">
                      {saving && (
                        <span className="inline-flex items-center gap-1.5">
                          <Loader2 className="size-3.5 animate-spin" />
                          Đang lưu...
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Badge variant="outline" className="font-normal text-muted-foreground">
          Chọn loại rác để bật/tắt tiếp nhận
        </Badge>
      </div>
    </div>
  );
}
