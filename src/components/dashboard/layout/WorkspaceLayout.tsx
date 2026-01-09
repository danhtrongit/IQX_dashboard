"use client";

import { useState, type ReactNode } from "react";
import { RightQuickNav, type RightPanelView } from "./RightQuickNav";
import { QuickTrade } from "../features/trade/QuickTrade";
import { PortfolioPanel } from "../features/portfolio/PortfolioPanel";
import { NewsPanel } from "../features/news/NewsPanel";
import { AIChatPanel } from "../features/chat/AIChatPanel";
import { ArixPanel } from "../features/arix/ArixPanel";
import { RankingPanel } from "../features/ranking/RankingPanel";
import { cn } from "@/lib/utils";

interface WorkspaceLayoutProps {
    /** Header content (tabs, back button, etc.) - optional */
    header?: ReactNode;
    /** Main content area */
    children: ReactNode;
    /** Additional class for main content area */
    mainClassName?: string;
    /** Initial right panel view */
    initialPanel?: RightPanelView;
}

export function WorkspaceLayout({
    header,
    children,
    mainClassName,
    initialPanel = 'trade',
}: WorkspaceLayoutProps) {
    const [activePanel, setActivePanel] = useState<RightPanelView>(initialPanel);
    const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

    const togglePanel = () => setIsPanelCollapsed(!isPanelCollapsed);

    const renderRightPanel = () => {
        switch (activePanel) {
            case 'portfolio':
                return <PortfolioPanel />;
            case 'news':
                return <NewsPanel />;
            case 'ai':
                return <AIChatPanel />;
            case 'arix':
                return <ArixPanel />;
            case 'ranking':
                return <RankingPanel />;
            case 'trade':
            default:
                return <QuickTrade />;
        }
    };

    return (
        <div className="h-full grid grid-cols-[1fr_auto_auto] overflow-hidden">
            {/* Main content area */}
            <div className={cn(
                "min-w-0 h-full flex flex-col overflow-hidden border-r border-border/40",
                mainClassName
            )}>
                {/* Header - optional */}
                {header && (
                    <div className="shrink-0 border-b border-border/40 bg-background/80 backdrop-blur-sm">
                        {header}
                    </div>
                )}

                {/* Main content */}
                <div className="flex-1 min-h-0 relative overflow-hidden bg-background/30">
                    {children}
                </div>
            </div>

            {/* Right Panel */}
            <div className={cn(
                "min-w-0 h-full overflow-hidden transition-all duration-300",
                isPanelCollapsed ? "w-0 opacity-0" : "w-85 opacity-100"
            )}>
                {renderRightPanel()}
            </div>

            {/* Right Navigation */}
            <RightQuickNav
                activePanel={activePanel}
                onPanelChange={setActivePanel}
                isPanelCollapsed={isPanelCollapsed}
                onTogglePanel={togglePanel}
            />
        </div>
    );
}
