"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Loader2, LogIn, Mail, Lock } from "lucide-react";

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

// Validation schema - matches API LoginRequest
const loginSchema = z.object({
    email: z
        .string()
        .min(1, "Vui lòng nhập email")
        .email("Email không hợp lệ")
        .max(100, "Email quá dài"),
    password: z
        .string()
        .min(1, "Vui lòng nhập mật khẩu")
        .max(100, "Mật khẩu quá dài"),
    rememberMe: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginModalProps {
    trigger?: React.ReactNode;
    defaultOpen?: boolean;
    onRegisterClick?: () => void;
}

export function LoginModal({ trigger, defaultOpen = false, onRegisterClick }: LoginModalProps) {
    const [open, setOpen] = useState(defaultOpen);
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login } = useAuth();

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
            rememberMe: false,
        },
    });

    const onSubmit = async (data: LoginFormValues) => {
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
            await login(data.email, data.password);

            clearTimeout(timeoutId);

            toast.success("Đăng nhập thành công!", {
                description: "Chào mừng bạn trở lại với IQX",
            });

            setOpen(false);
            form.reset();
        } catch (error) {
            clearTimeout(timeoutId);

            const message = error instanceof Error ? error.message : "Đã có lỗi xảy ra";
            toast.error("Đăng nhập thất bại", {
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

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button
                        variant="default"
                        size="sm"
                        className="h-8 gap-2 bg-primary/90 hover:bg-primary text-primary-foreground font-medium transition-all duration-200 hover:shadow-md hover:shadow-primary/25"
                    >
                        <LogIn className="h-4 w-4" />
                        <span className="hidden sm:inline">Đăng nhập</span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent
                className="sm:max-w-[420px] p-0 gap-0 overflow-hidden border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl"
                onKeyDown={handleKeyDown}
            >
                {/* Header with gradient */}
                <div className="relative px-6 pt-6 pb-4 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-b border-border/40">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -z-10" />
                    <DialogHeader className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-lg shadow-primary/30">
                                I
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold">
                                    Đăng nhập IQX
                                </DialogTitle>
                                <DialogDescription className="text-sm text-muted-foreground">
                                    Nền tảng phân tích chứng khoán thông minh
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
                                            Email
                                        </FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    type="email"
                                                    placeholder="example@email.com"
                                                    className="pl-10 h-11 bg-secondary/30 border-border/50 focus:border-primary/50 focus:bg-secondary/50 transition-all"
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

                            {/* Password Field */}
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel className="text-sm font-medium flex items-center gap-2">
                                            <Lock className="h-4 w-4 text-muted-foreground" />
                                            Mật khẩu
                                        </FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="••••••••"
                                                    className="pl-10 pr-10 h-11 bg-secondary/30 border-border/50 focus:border-primary/50 focus:bg-secondary/50 transition-all"
                                                    autoComplete="current-password"
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
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                )}
                            />

                            {/* Remember me & Forgot password */}
                            <div className="flex items-center justify-between">
                                <FormField
                                    control={form.control}
                                    name="rememberMe"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                    disabled={isSubmitting}
                                                    className="border-border/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                />
                                            </FormControl>
                                            <FormLabel className="text-sm font-normal text-muted-foreground cursor-pointer">
                                                Nhớ đăng nhập
                                            </FormLabel>
                                        </FormItem>
                                    )}
                                />
                                <Button
                                    type="button"
                                    variant="link"
                                    className="h-auto p-0 text-sm text-primary hover:text-primary/80"
                                    onClick={() => toast.info("Tính năng đang phát triển")}
                                >
                                    Quên mật khẩu?
                                </Button>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="w-full h-11 font-semibold text-base bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all duration-200 hover:shadow-primary/30"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Đang đăng nhập...
                                    </>
                                ) : (
                                    <>
                                        <LogIn className="mr-2 h-4 w-4" />
                                        Đăng nhập
                                    </>
                                )}
                            </Button>
                        </form>
                    </Form>

                    <Separator className="bg-border/40" />

                    {/* Footer */}
                    <div className="text-center space-y-2">
                        <p className="text-sm text-muted-foreground">
                            Chưa có tài khoản?{" "}
                            <Button
                                variant="link"
                                className="h-auto p-0 text-primary font-semibold hover:text-primary/80"
                                onClick={() => {
                                    setOpen(false);
                                    onRegisterClick?.();
                                }}
                            >
                                Đăng ký ngay
                            </Button>
                        </p>
                        <p className="text-xs text-muted-foreground/60">
                            Bằng việc đăng nhập, bạn đồng ý với{" "}
                            <span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                                Điều khoản dịch vụ
                            </span>{" "}
                            và{" "}
                            <span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                                Chính sách bảo mật
                            </span>
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
