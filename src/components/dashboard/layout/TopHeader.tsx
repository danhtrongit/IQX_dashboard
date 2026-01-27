import { useState } from "react";
import { Bell, HelpCircle, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LoginModal, RegisterModal, UserMenu } from "@/components/dashboard/features/auth";
import { StockSearch } from "@/components/dashboard/features/search";
import { useAuth } from "@/lib/auth-context";
import { ThemeAwareLogo } from "@/components/ui/theme-aware-logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function TopHeader() {
    const { isAuthenticated, isLoading } = useAuth();
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);

    const menuItems = [
        { label: "Giao dịch", path: "/" },
        { label: "Ngành", path: "/nganh" },
        { label: "Mẫu hình", path: "/mau-hinh" },
        { label: "Bảng giá", path: "/bang-gia" },
        { label: "Lọc cổ phiếu", path: "/loc-co-phieu" },
    ];

    const handleSwitchToRegister = () => {
        setShowLoginModal(false);
        setTimeout(() => setShowRegisterModal(true), 100);
    };

    const handleSwitchToLogin = () => {
        setShowRegisterModal(false);
        setTimeout(() => setShowLoginModal(true), 100);
    };

    return (
        <header className="relative z-50 flex h-12 items-center justify-between border-b border-border/40 bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            {/* Left Section: Brand + Menu */}
            <div className="flex items-center gap-8">
                <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <ThemeAwareLogo className="h-8 w-auto" />
                </Link>

                {/* Main Menu */}
                <nav className="hidden md:flex items-center gap-1">
                    {menuItems.map((item) => (
                        <Link key={item.label} to={item.path}>
                            <Button
                                variant="ghost"
                                className="h-8 px-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                            >
                                {item.label}
                            </Button>
                        </Link>
                    ))}
                </nav>
            </div>

            {/* Actions Section */}
            <div className="flex items-center gap-2">
                {/* Stock Search - Command K */}
                <StockSearch />

                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <Bell className="h-4 w-4" />
                </Button>

                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <HelpCircle className="h-4 w-4" />
                </Button>

                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <Settings className="h-4 w-4" />
                </Button>

                <ThemeToggle />

                <div className="w-px h-4 bg-border mx-1" />

                {/* Auth Section: Login/Register Buttons or User Menu */}
                {isLoading ? (
                    <div className="h-8 w-8 rounded-full bg-secondary/50 animate-pulse" />
                ) : isAuthenticated ? (
                    <UserMenu />
                ) : (
                    <div className="flex items-center gap-2">
                        <RegisterModal
                            defaultOpen={showRegisterModal}
                            onLoginClick={handleSwitchToLogin}
                        />
                        <LoginModal
                            defaultOpen={showLoginModal}
                            onRegisterClick={handleSwitchToRegister}
                        />
                    </div>
                )}
            </div>
        </header>
    );
}
