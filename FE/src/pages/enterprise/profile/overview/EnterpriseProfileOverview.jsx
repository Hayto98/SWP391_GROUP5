import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { useEnterpriseProfile } from "@/hooks/useEnterpriseProfile";
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Loader2,
  ShieldCheck,
} from "lucide-react";

function SectionHeader({ icon, title, right }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-md border border-blue-200 bg-blue-100 text-blue-700">
          {icon}
        </span>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {right}
    </div>
  );
}

function InfoField({ label, value, link }) {
  return (
    <div className="space-y-1 rounded-md border px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={link ? "text-sm font-semibold text-blue-700" : "text-sm font-semibold text-slate-700"}>
        {value || "-"}
      </p>
    </div>
  );
}

function Toggle2FA({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={[
        "relative h-7 w-12 rounded-full border transition",
        checked ? "border-emerald-300 bg-emerald-200" : "border-slate-300 bg-slate-200",
        disabled && "cursor-not-allowed opacity-70",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Toggle two-factor authentication"
    >
      <span
        className={[
          "absolute top-0.5 size-5 rounded-full border bg-white transition-all",
          checked ? "left-6 border-emerald-300" : "left-0.5 border-slate-300",
        ].join(" ")}
      />
    </button>
  );
}

export default function EnterpriseProfileOverview() {
  const { data, loading, error, toggling2FA, reload, toggle2FA } = useEnterpriseProfile();

  if (loading) {
    return (
      <Card>
        <CardContent className="flex h-24 items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Đang tải dữ liệu hồ sơ doanh nghiệp...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="flex flex-col items-start gap-3 py-6 text-red-700">
          <p>Lỗi: {error}</p>
          <Button variant="outline" onClick={reload}>Thử lại</Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-lg font-bold tracking-tight lg:text-2xl">Hồ sơ doanh nghiệp</h1>
        <p className="mt-1 text-sm text-green-600">Quản lý thông tin pháp lý, phạm vi hoạt động và bảo mật tài khoản.</p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-20 items-center justify-center rounded-md bg-lime-700 text-xl font-black text-white">
              {data.company.logoText}
            </div>
            <div>
              <p className="text-base font-bold">{data.company.name}</p>
              <p className="text-xs font-semibold text-muted-foreground">Mã hệ thống: {data.company.code}</p>
              <p className="text-xs font-semibold text-muted-foreground">{data.company.memberSince}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="size-3" />
              {data.company.verifiedText}
            </Badge>

            <Button type="button" variant="outline">
              Chỉnh sửa hồ sơ
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <SectionHeader icon={<Building2 className="size-4" />} title="Thông tin doanh nghiệp" />
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoField label="Tên pháp lý" value={data.businessInfo.legalName} />
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoField label="Giấy phép kinh doanh" value={data.businessInfo.license} />
              <InfoField label="Mã số thuế" value={data.businessInfo.tax} />
            </div>
            <InfoField label="Địa chỉ trụ sở" value={data.businessInfo.hq} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionHeader icon={<CheckCircle2 className="size-4" />} title="Liên hệ và phạm vi" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoField label="Email liên hệ" value={data.contactScope.email} link />
              <InfoField label="Số điện thoại" value={data.contactScope.phone} />
            </div>

            <div className="space-y-2 rounded-md border px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Khu vực hoạt động</p>
              <div className="flex flex-wrap gap-2">
                {data.contactScope.regions.map((region) => (
                  <Badge key={region} variant="outline" className="bg-slate-50 text-slate-700">
                    {region}
                  </Badge>
                ))}
                <Badge variant="outline" className="bg-slate-100 text-slate-600">
                  {data.contactScope.more}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionHeader
              icon={<Clock3 className="size-4" />}
              title="Lịch sử hoạt động"
              right={
                <Button variant="ghost" size="sm" type="button" className="h-7 px-2 text-xs">
                  {data.activity.viewAll}
                </Button>
              }
            />
          </CardHeader>
          <CardContent className="space-y-3">
            {data.activity.items.map((item, index) => (
              <div key={`${item.title}-${index}`} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <span className="mt-1 inline-block size-2.5 rounded-full bg-blue-500" />
                  {index !== data.activity.items.length - 1 && (
                    <span className="mt-1 block h-9 w-px bg-slate-200" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.by}</p>
                </div>
                <p className="text-[11px] font-semibold text-muted-foreground">{item.date}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionHeader icon={<ShieldCheck className="size-4" />} title="Bảo mật tài khoản" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between gap-3 rounded-md border p-3">
              <div>
                <p className="text-sm font-semibold">Mật khẩu</p>
                <p className="text-xs text-muted-foreground">{data.security.passwordLastChanged}</p>
              </div>
              <Button variant="outline" size="sm" type="button">
                Thay đổi
              </Button>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-md border p-3">
              <div>
                <p className="text-sm font-semibold">Xác thực 2 yếu tố (2FA)</p>
                <p className="text-xs text-muted-foreground">Tăng cường bảo mật cho tài khoản của bạn</p>
              </div>

              <div className="flex items-center gap-2">
                {toggling2FA && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
                <Toggle2FA checked={data.security.twoFAEnabled} onChange={toggle2FA} disabled={toggling2FA} />
              </div>
            </div>

            <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm font-semibold text-amber-800">{data.security.alert.title}</p>
              <p className="mt-1 text-xs text-amber-700">{data.security.alert.desc}</p>
              <Button variant="ghost" size="sm" type="button" className="mt-2 h-7 px-0 text-amber-800">
                {data.security.alert.action}
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs font-semibold text-muted-foreground">
        © 2024 Recycling Enterprise Management System. All rights reserved.
      </p>
    </div>
  );
}