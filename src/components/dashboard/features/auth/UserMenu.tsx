"use client";

import { useState } from "react";
import { LogOut, Settings, User, ChevronDown, CreditCard, HelpCircle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export function UserMenu() {
    const { user, logout, isLoading } = useAuth();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await logout();
            toast.success("Đăng xuất thành công", {
                description: "Hẹn gặp lại bạn!",
            });
        } catch {
            toast.error("Đăng xuất thất bại", {
                description: "Vui lòng thử lại",
            });
        } finally {
            setIsLoggingOut(false);
        }
    };

    // Get user initials for avatar fallback
    const getInitials = (name: string | null | undefined): string => {
        if (!name) return "U";
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    // Get display name (fullname or email prefix)
    const getDisplayName = (): string => {
        if (!user) return "";
        if (user.fullname) return user.fullname;
        // Fallback to email prefix
        return user.email.split("@")[0];
    };

    // Get role display text
    const getRoleDisplay = (role: string): string => {
        const roles: Record<string, string> = {
            admin: "Quản trị viên",
            user: "Thành viên",
            vip: "VIP",
            premium: "Premium",
        };
        return roles[role.toLowerCase()] || role;
    };

    if (isLoading) {
        return <Skeleton className="h-8 w-8 rounded-full" />;
    }

    if (!user) {
        return null;
    }

    const displayName = getDisplayName();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="flex items-center gap-2 h-8 px-2 hover:bg-accent/50 transition-all duration-200 group"
                >
                    <Avatar className="h-7 w-7 border border-border/50 ring-0 transition-all duration-200 group-hover:ring-2 group-hover:ring-primary/30">
                        <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                            {getInitials(user.fullname || user.email)}
                        </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium hidden lg:inline-block max-w-[100px] truncate">
                        {displayName}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" sideOffset={8}>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                            {displayName}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                            <span className="text-xs px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-medium">
                                {getRoleDisplay(user.role)}
                            </span>
                            {user.is_verified && (
                                <span className="text-xs px-1.5 py-0.5 rounded-md bg-green-500/10 text-green-600 font-medium">
                                    Đã xác thực
                                </span>
                            )}
                        </div>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Tài khoản</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                        <CreditCard className="mr-2 h-4 w-4" />
                        <span>Gói dịch vụ</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Cài đặt</span>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    <span>Hỗ trợ</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
