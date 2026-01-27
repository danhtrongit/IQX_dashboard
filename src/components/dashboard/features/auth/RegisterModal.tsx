"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Loader2, UserPlus, Mail, Lock, User } from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { toast } from "@/lib/toast";
import { useAuth } from "@/lib/auth-context";

// Validation schema - matches API RegisterRequest
const registerSchema = z.object({
    email: z
        .string()
        .min(1, "Vui lòng nhập email")
        .email("Email không hợp lệ")
        .max(100, "Email quá dài"),
    fullname: z
        .string()
        .max(100, "Họ tên quá dài")
        .optional()
        .or(z.literal("")),
    password: z
        .string()
        .min(8, "Mật khẩu tối thiểu 8 ký tự")
        .max(100, "Mật khẩu quá dài")
        .regex(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/, "Mật khẩu phải có chữ và số"),
    confirmPassword: z
        .string()
        .min(1, "Vui lòng xác nhận mật khẩu"),
    acceptTerms: z.boolean().refine((val) => val === true, {
        message: "Bạn cần đồng ý với điều khoản dịch vụ",
    }),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

interface RegisterModalProps {
    trigger?: React.ReactNode;
    defaultOpen?: boolean;
    onLoginClick?: () => void;
}

export function RegisterModal({ trigger, defaultOpen = false, onLoginClick }: RegisterModalProps) {
    const [open, setOpen] = useState(defaultOpen);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register } = useAuth();

    const form = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            email: "",
            fullname: "",
            password: "",
            confirmPassword: "",
            acceptTerms: false,
        },
    });

    const onSubmit = async (data: RegisterFormValues) => {
        // Prevent double submission
        if (isSubmitting) return;

        setIsSubmitting(true);

        // Timeout wrapper to ensure loading state is reset
        const timeoutId = setTimeout(() => {
            setIsSubmitting(false);
            toast.error("Yêu cầu quá thời gian chờ", {
                description: "Vui lòng kiểm tra kết nối và thử lại",
            });
        }, 15000); // 15s timeout

        try {
            await register(data.email, data.password, data.fullname || undefined);

            clearTimeout(timeoutId);

            toast.success("Đăng ký thành công!", {
                description: "Chào mừng bạn đến với IQX",
            });

            setOpen(false);
            form.reset();
        } catch (error) {
            clearTimeout(timeoutId);

            const message = error instanceof Error ? error.message : "Đã có lỗi xảy ra";
            toast.error("Đăng ký thất bại", {
                description: message,
            });
        } finally {
            clearTimeout(timeoutId);
            setIsSubmitting(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            form.handleSubmit(onSubmit)();
        }
    };

    const handleLoginClick = () => {
        setOpen(false);
        onLoginClick?.();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-2 border-primary/50 text-primary hover:bg-primary/10 hover:text-primary font-medium transition-all duration-200"
                    >
                        <UserPlus className="h-4 w-4" />
                        <span className="hidden sm:inline">Đăng ký</span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent
                className="sm:max-w-[440px] p-0 gap-0 overflow-hidden border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl max-h-[90vh] overflow-y-auto"
                onKeyDown={handleKeyDown}
            >
                {/* Header with gradient */}
                <div className="relative px-6 pt-6 pb-4 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-b border-border/40">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -z-10" />
                    <DialogHeader className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white font-bold text-lg shadow-lg shadow-emerald-500/30">
                                I
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold">
                                    Đăng ký IQX
                                </DialogTitle>
                                <DialogDescription className="text-sm text-muted-foreground">
                                    Tạo tài khoản để trải nghiệm đầy đủ
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                {/* Form */}
                <div className="p-6 space-y-5">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            {/* Email Field */}
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel className="text-sm font-medium flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                            Email <span className="text-destructive">*</span>
                                        </FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    type="email"
                                                    placeholder="example@email.com"
                                                    className="pl-10 h-11 bg-secondary/30 border-border/50 focus:border-emerald-500/50 focus:bg-secondary/50 transition-all"
                                                    autoComplete="email"
                                                    disabled={isSubmitting}
                                                    {...field}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                )}
                            />

                            {/* Fullname Field */}
                            <FormField
                                control={form.control}
                                name="fullname"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel className="text-sm font-medium flex items-center gap-2">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            Họ và tên
                                        </FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    type="text"
                                                    placeholder="Nguyễn Văn A"
                                                    className="pl-10 h-11 bg-secondary/30 border-border/50 focus:border-emerald-500/50 focus:bg-secondary/50 transition-all"
                                                    autoComplete="name"
                                                    disabled={isSubmitting}
                                                    {...field}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                )}
                            />

                            {/* Password Field */}
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel className="text-sm font-medium flex items-center gap-2">
                                            <Lock className="h-4 w-4 text-muted-foreground" />
                                            Mật khẩu <span className="text-destructive">*</span>
                                        </FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="••••••••"
                                                    className="pl-10 pr-10 h-11 bg-secondary/30 border-border/50 focus:border-emerald-500/50 focus:bg-secondary/50 transition-all"
                                                    autoComplete="new-password"
                                                    disabled={isSubmitting}
                                                    {...field}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    tabIndex={-1}
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="h-4 w-4" />
                                                    ) : (
                                                        <Eye className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </FormControl>
                                        <p className="text-xs text-muted-foreground">
                                            Tối thiểu 8 ký tự, bao gồm chữ và số
                                        </p>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                )}
                            />

                            {/* Confirm Password Field */}
                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel className="text-sm font-medium flex items-center gap-2">
                                            <Lock className="h-4 w-4 text-muted-foreground" />
                                            Xác nhận mật khẩu <span className="text-destructive">*</span>
                                        </FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    placeholder="••••••••"
                                                    className="pl-10 pr-10 h-11 bg-secondary/30 border-border/50 focus:border-emerald-500/50 focus:bg-secondary/50 transition-all"
                                                    autoComplete="new-password"
                                                    disabled={isSubmitting}
                                                    {...field}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    tabIndex={-1}
                                                >
                                                    {showConfirmPassword ? (
                                                        <EyeOff className="h-4 w-4" />
                                                    ) : (
                                                        <Eye className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                )}
                            />

                            {/* Accept Terms */}
                            <FormField
                                control={form.control}
                                name="acceptTerms"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                disabled={isSubmitting}
                                                className="mt-0.5 border-border/50 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel className="text-sm font-normal text-muted-foreground cursor-pointer">
                                                Tôi đồng ý với{" "}
                                                <span className="text-primary hover:text-primary/80 cursor-pointer transition-colors">
                                                    Điều khoản dịch vụ
                                                </span>{" "}
                                                và{" "}
                                                <span className="text-primary hover:text-primary/80 cursor-pointer transition-colors">
                                                    Chính sách bảo mật
                                                </span>
                                            </FormLabel>
                                            <FormMessage className="text-xs" />
                                        </div>
                                    </FormItem>
                                )}
                            />

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="w-full h-11 font-semibold text-base bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all duration-200 hover:shadow-emerald-500/30"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Đang đăng ký...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Tạo tài khoản
                                    </>
                                )}
                            </Button>
                        </form>
                    </Form>

                    <Separator className="bg-border/40" />

                    {/* Footer */}
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                            Đã có tài khoản?{" "}
                            <Button
                                variant="link"
                                className="h-auto p-0 text-primary font-semibold hover:text-primary/80"
                                onClick={handleLoginClick}
                            >
                                Đăng nhập
                            </Button>
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
