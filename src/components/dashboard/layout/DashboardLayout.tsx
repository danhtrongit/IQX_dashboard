import { Outlet } from "react-router-dom";
import { TopHeader } from "./TopHeader";
import { MarketSummary } from "./MarketSummary";
import { BottomStatusBar } from "./BottomStatusBar";
import { Toaster } from "@/components/ui/sonner";

/**
 * Main dashboard layout - keeps consistent structure across all pages
 */
export function DashboardLayout() {
    return (
        <div className="flex w-screen h-screen flex-col overflow-hidden bg-background text-foreground font-sans selection:bg-primary/30">
            <TopHeader />
            <MarketSummary />
            {/* Main content area - renders child routes */}
            <main className="flex-1 overflow-hidden">
                <Outlet />
            </main>
            <BottomStatusBar />
            <Toaster />
        </div>
    );
}
