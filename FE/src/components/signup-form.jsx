import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerUser, verifyOtp } from "@/services/authService";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import bgImage from "@/assets/img/TaiCheRacDiemThuong.png";

const registerFormSchema = z
  .object({
    fullname: z
      .string()
      .min(3, "tên không ngắn hơn 3 ký tự")
      .max(100, "tên không dài hơn 100 ký tự"),
    email: z
      .string()
      .trim()
      .refine(
        (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
        "Email không hợp lệ",
      ),
    phone: z
      .string()
      .trim()
      .min(10, "Số điện thoại phải có ít nhất 10 số")
      .refine(
        (val) => /(84|0[3|5|7|8|9])+([0-9]{8})\b/.test(val),
        "Số điện thoại không hợp lệ",
      ),
    password: z
      .string()
      .min(6, "Mật khẩu không ngắn hơn 6 ký tự")
      .max(20, "Mật khẩu không dài hơn 20 ký tự")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
        "Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt",
      ),

    confirmPassword: z.string().min(1, "Vui lòng nhập"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu không khớp.",
    path: ["confirmPassword"],
  });

export function SignupForm({ className, ...props }) {
  const navigate = useNavigate();
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");

  const form = useForm({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      fullname: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onBlur",
  });

  const resetOtpState = () => {
    setOtpValue("");
    setOtpEmail("");
    setOtpSubmitting(false);
  };

  const handleVerifyOtp = async () => {
    if (otpValue.length !== 6) return;
    setOtpSubmitting(true);
    try {
      const email = otpEmail || form.getValues("email");
      if (!email) {
        throw new Error("Không tìm thấy email để xác thực OTP.");
      }

      const response = await verifyOtp({ email, otp: otpValue });

      if (response?.tokens?.accessToken && response?.user) {
        setOtpDialogOpen(false);
        resetOtpState();
        toast.success("Xác thực OTP thành công. Vui lòng đăng nhập.");
        navigate("/login");
        return;
      }

      throw new Error("Xác thực OTP thất bại.");
    } catch (error) {
      toast.error(error.message || "OTP không hợp lệ hoặc đã hết hạn.");
    } finally {
      setOtpSubmitting(false);
    }
  };

  const onSubmit = async (values) => {
    try {
      const response = await registerUser({
        fullname: values.fullname,
        email: values.email,
        phone: values.phone,
        password: values.password,
        roleId: 4, // CITIZEN
      });

      if (response?.requireOtp) {
        setOtpEmail(values.email);
        setOtpDialogOpen(true);
        toast.success("Đăng ký thành công. Vui lòng kiểm tra email để nhận mã OTP.");
        return;
      }

      toast.success("Đăng ký tài khoản thành công.");
      navigate("/login");
    } catch (error) {
      toast.error(error.message || "Đăng ký thất bại");
    }
  };
  return (
    <div className={cn("flex flex-col gap-6 ", className)} {...props}>
      <Card className="overflow-hidden p-0 ">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 md:p-8">
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Tạo tài khoản của bạn</h1>
                <p className="text-muted-foreground text-sm text-balance">
                  Nhập thông tin để tạo tài khoản
                </p>
              </div>
              <Controller
                name="fullname"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      Họ và tên <span className="text-red-500">*</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="text"
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
                name="phone"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      Số điện thoại <span className="text-red-500">*</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="tel"
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

              <Field className="flex flex-row">
                <Controller
                  name="password"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>
                        mật khẩu <span className="text-red-500">*</span>
                      </FieldLabel>
                      <Input
                        {...field}
                        id={field.name}
                        type="password"
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
                  name="confirmPassword"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>
                        xác nhận mật khẩu{" "}
                        <span className="text-red-500">*</span>
                      </FieldLabel>
                      <Input
                        {...field}
                        id={field.name}
                        type="password"
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
              </Field>
              <Field>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting
                    ? "Đang xử lý..."
                    : "Tạo tài khoản"}
                </Button>
              </Field>

              <FieldDescription className="text-center">
                Bạn đã có tài khoản?{" "}
                <span
                  className="underline hover:text-primary"
                  onClick={() => navigate("/login")}
                >
                  Đăng nhập
                </span>
              </FieldDescription>
            </FieldGroup>
          </form>
          <div className="bg-muted relative hidden md:block">
            <img
              src={bgImage}
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>

      <Dialog
        open={otpDialogOpen}
        onOpenChange={(open) => {
          if (!otpSubmitting) {
            setOtpDialogOpen(open);
            if (!open) {
              resetOtpState();
              navigate("/login");
            }
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
