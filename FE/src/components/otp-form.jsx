import { Button } from "@/components/ui/button";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { verifyOtp } from "@/services/authService";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const otpFormSchema = z.object({
	otp: z
		.string()
		.trim()
		.regex(/^\d{6}$/, "Mã OTP phải gồm đúng 6 chữ số"),
});

export function OtpForm({ email, onBack, onVerified, className, ...props }) {
	const form = useForm({
		resolver: zodResolver(otpFormSchema),
		defaultValues: {
			otp: "",
		},
		mode: "onBlur",
	});

	const onSubmit = async (values) => {
		if (!email) {
			toast.error("Không tìm thấy email để xác minh OTP.");
			return;
		}

		try {
			const response = await verifyOtp({
				email,
				otp: values.otp,
			});

			onVerified?.(response);
		} catch (error) {
			toast.error(error.message || "Xác minh OTP thất bại.");
		}
	};

	return (
		<form
			onSubmit={form.handleSubmit(onSubmit)}
			className={cn("p-6 md:p-8", className)}
			{...props}
		>
			<FieldGroup>
				<div className="flex flex-col items-center gap-2 text-center">
					<h1 className="text-2xl font-bold">Xác minh OTP</h1>
					<FieldDescription className="text-balance">
						Mã OTP đã được gửi đến email <span className="font-medium">{email}</span>
					</FieldDescription>
				</div>

				<Controller
					name="otp"
					control={form.control}
					render={({ field, fieldState }) => (
						<Field data-invalid={fieldState.invalid}>
							<FieldLabel htmlFor={field.name}>
								Mã OTP <span className="text-red-500">*</span>
							</FieldLabel>
							<Input
								{...field}
								id={field.name}
								type="text"
								placeholder="Nhập 6 chữ số"
								autoComplete="one-time-code"
								inputMode="numeric"
								maxLength={6}
								aria-invalid={fieldState.invalid}
								onChange={(event) => {
									const onlyDigits = event.target.value.replace(/\D/g, "").slice(0, 6);
									field.onChange(onlyDigits);
								}}
							/>
							{fieldState.invalid && (
								<FieldError className="text-start" errors={[fieldState.error]} />
							)}
						</Field>
					)}
				/>

				<Field className="flex-row gap-3">
					<Button type="submit" disabled={form.formState.isSubmitting}>
						{form.formState.isSubmitting ? "Đang xác minh..." : "Xác minh"}
					</Button>
					<Button type="button" variant="outline" onClick={onBack}>
						Quay lại
					</Button>
				</Field>
			</FieldGroup>
		</form>
	);
}
