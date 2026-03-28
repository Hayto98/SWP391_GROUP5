import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UserPlus, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const INITIAL = { fullname: "", email: "", phone: "", password: "" };

function validate(form) {
  const errors = {};

  if (!form.fullname.trim() || form.fullname.trim().length < 2) {
    errors.fullname = "Họ tên phải có ít nhất 2 ký tự";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Email không hợp lệ";
  }

  if (!/^0\d{9,10}$/.test(form.phone)) {
    errors.phone = "Số điện thoại phải có 10-11 số, bắt đầu bằng 0";
  }

  if (form.password.length < 8) {
    errors.password = "Mật khẩu tối thiểu 8 ký tự";
  } else if (!/[A-Z]/.test(form.password)) {
    errors.password = "Mật khẩu phải có ít nhất 1 chữ hoa";
  } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(form.password)) {
    errors.password = "Mật khẩu phải có ít nhất 1 ký tự đặc biệt";
  }

  return errors;
}

export default function AddEmployeeModal({ open, onOpenChange, onSubmit }) {
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [showPw, setShowPw] = useState(false);

  function handleChange(field) {
    return (e) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      // Xóa lỗi khi user bắt đầu nhập
      if (errors[field]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setApiError("");

    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        fullname: form.fullname.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });
      toast.success("Thêm nhân viên thành công!");
      setForm(INITIAL);
      setErrors({});
      onOpenChange(false);
    } catch (err) {
      const msg = err?.message || "Lỗi khi tạo nhân viên";
      setApiError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose(value) {
    if (!submitting) {
      setForm(INITIAL);
      setErrors({});
      setApiError("");
      onOpenChange(value);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-5 text-emerald-600" />
            Thêm nhân viên mới
          </DialogTitle>
          <DialogDescription>
            Điền thông tin nhân viên thu gom mới vào hệ thống.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {apiError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {apiError}
            </div>
          )}

          {/* Họ tên */}
          <div className="space-y-2">
            <Label htmlFor="add-fullname">Họ và tên <span className="text-red-500">*</span></Label>
            <Input
              id="add-fullname"
              placeholder="Nguyễn Văn A"
              value={form.fullname}
              onChange={handleChange("fullname")}
              disabled={submitting}
            />
            {errors.fullname && (
              <p className="text-xs text-red-500">{errors.fullname}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="add-email">Email <span className="text-red-500">*</span></Label>
            <Input
              id="add-email"
              type="email"
              placeholder="collector@example.com"
              value={form.email}
              onChange={handleChange("email")}
              disabled={submitting}
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Số điện thoại */}
          <div className="space-y-2">
            <Label htmlFor="add-phone">Số điện thoại <span className="text-red-500">*</span></Label>
            <Input
              id="add-phone"
              placeholder="0901234567"
              value={form.phone}
              onChange={handleChange("phone")}
              disabled={submitting}
            />
            {errors.phone && (
              <p className="text-xs text-red-500">{errors.phone}</p>
            )}
          </div>

          {/* Mật khẩu */}
          <div className="space-y-2">
            <Label htmlFor="add-password">Mật khẩu <span className="text-red-500">*</span></Label>
            <div className="relative">
              <Input
                id="add-password"
                type={showPw ? "text" : "password"}
                placeholder="Password@123"
                value={form.password}
                onChange={handleChange("password")}
                disabled={submitting}
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPw(!showPw)}
                tabIndex={-1}
              >
                {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500">{errors.password}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Tối thiểu 8 ký tự, có chữ hoa và ký tự đặc biệt
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Tạo nhân viên
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
