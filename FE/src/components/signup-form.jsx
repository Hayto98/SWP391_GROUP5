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
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerUser } from "@/services/authService";

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

  const onSubmit = async (values) => {
    try {
      await registerUser({
        fullname: values.fullname,
        email: values.email,
        phone: values.phone,
        password: values.password,
        roleId: 4, // CITIZEN
      });

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
              src="https://www.blog.impaac.org/wp-content/uploads/2022/10/Crowdfunding-Benefits-Impaac-Foundation-non-profit-platform-sustainable-afforestation-deforestation-sustainable-planet-sustain-save-protect-donate-Daanutsav-Recycling-1024x1024.jpg"
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
    </div>
  );
}
