import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { loginUser, verifyOtp } from "@/services/authService";
import { useAuthStore } from "@/stores/authStore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const loginFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email không được để trống")
    .email("Email không hợp lệ"),
  password: z
    .string()
    .min(6, "Mật khẩu không ngắn hơn 6 ký tự")
    .max(20, "Mật khẩu không dài hơn 20 ký tự"),
});

function mapRoleById(roleId) {
  switch (roleId) {
    case 1:
      return "admin";
    case 2:
      return "enterprise";
    case 3:
      return "collector";
    case 4:
      return "citizen";
    default:
      return "citizen";
  }
}

export function LoginForm({ className, ...props }) {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");

  const form = useForm({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onBlur",
  });

  const completeLogin = (response) => {
    if (response?.tokens?.accessToken) {
      localStorage.setItem("accessToken", response.tokens.accessToken);
    }
    const roleId = response?.user?.roleId;
    const role = mapRoleById(roleId);
    login({ ...response?.user, role });
    toast.success("Đăng nhập thành công.");
    const dashboardByRole = {
      admin: "/admin",
      enterprise: "/enterprise",
      collector: "/collector",
      citizen: "/citizen",
    };
    navigate(dashboardByRole[role] || "/");
  };

  const resetOtpState = () => {
    setOtpValue("");
    setOtpEmail("");
    setOtpSubmitting(false);
  };

  const onSubmit = async (values) => {
    try {
      const response = await loginUser({
        email: values.email,
        password: values.password,
      });

      // If backend returns OTP required signal, open OTP dialog
      if (response?.requireOtp) {
        setOtpEmail(values.email);
        setOtpDialogOpen(true);
        return;
      }

      completeLogin(response);
    } catch (error) {
      toast.error(
        error.message ||
          "Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu.",
      );
    }
  };

  const handleVerifyOtp = async () => {
    if (otpValue.length !== 6) return;
    setOtpSubmitting(true);
    try {
      const email = otpEmail || form.getValues("email");
      if (!email) {
        throw new Error("Không tìm thấy email đăng nhập để xác thực OTP.");
      }

      const response = await verifyOtp({ email, otp: otpValue });

      if (response?.tokens?.accessToken && response?.user) {
        setOtpDialogOpen(false);
        resetOtpState();
        completeLogin(response);
        return;
      }

      throw new Error("Xác thực OTP thất bại.");
    } catch (error) {
      toast.error(error.message || "OTP không hợp lệ hoặc đã hết hạn.");
    } finally {
      setOtpSubmitting(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form
            className="p-6 md:p-8"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Chào mừng bạn trở lại</h1>
                <p className="text-muted-foreground text-balance">
                  Đăng nhập vào tài khoản của bạn
                </p>
              </div>
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      Email <span className="text-red-500">*</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="email"
                      placeholder="example@email.com"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError
                        className="text-start"
                        errors={[fieldState.error]}
                      />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      Mật khẩu <span className="text-red-500">*</span>
                    </FieldLabel>
                    <div className="relative">
                      <Input
                        {...field}
                        id={field.name}
                        type={showPassword ? "text" : "password"}
                        aria-invalid={fieldState.invalid}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {fieldState.invalid && (
                      <FieldError
                        className="text-start"
                        errors={[fieldState.error]}
                      />
                    )}
                  </Field>
                )}
              />
              <Field>
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? "Đang xử lý..." : "Đăng nhập"}
                </Button>
              </Field>
              <FieldDescription className="text-center">
                Bạn không có tài khoản?{" "}
                <span
                  className="underline hover:text-primary cursor-pointer"
                  onClick={() => navigate("/register")}
                >
                  Đăng ký
                </span>
              </FieldDescription>
            </FieldGroup>
          </form>
          <div className="bg-muted relative hidden md:block">
            <img
              src="https://www.blog.impaac.org/wp-content/uploads/2022/10/Crowdfunding-Benefits-Impaac-Foundation-non-profit-platform-sustainable-afforestation-deforestation-sustainable-planet-sustain-save-protect-donate-Daanutsav-Recycling-1024x1024.jpg"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <span>Privacy Policy</span>.
      </FieldDescription>

      <Dialog
        open={otpDialogOpen}
        onOpenChange={(open) => {
          if (!otpSubmitting) {
            setOtpDialogOpen(open);
            if (!open) resetOtpState();
          }
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton={!otpSubmitting}>
          <DialogHeader>
            <DialogTitle>Xác thực OTP</DialogTitle>
            <DialogDescription>
              Nhập mã OTP gồm 6 số đã gửi tới email{" "}
              <span className="font-medium">{otpEmail}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <InputOTP
                maxLength={6}
                value={otpValue}
                autoFocus
                onChange={(value) => setOtpValue(value.replace(/\D/g, ""))}
                disabled={otpSubmitting}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="h-11 w-11 text-lg" />
                  <InputOTPSlot index={1} className="h-11 w-11 text-lg" />
                  <InputOTPSlot index={2} className="h-11 w-11 text-lg" />
                  <InputOTPSlot index={3} className="h-11 w-11 text-lg" />
                  <InputOTPSlot index={4} className="h-11 w-11 text-lg" />
                  <InputOTPSlot index={5} className="h-11 w-11 text-lg" />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button
              type="button"
              className="w-full"
              onClick={handleVerifyOtp}
              disabled={otpSubmitting || otpValue.length !== 6}
            >
              {otpSubmitting ? "Đang xác thực..." : "Xác nhận OTP"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
