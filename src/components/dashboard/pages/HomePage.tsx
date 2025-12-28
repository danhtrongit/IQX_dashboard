"use client";

import { useState } from "react";
import { LineChart, BarChart2 } from "lucide-react";
import { WorkspaceLayout } from "../layout/WorkspaceLayout";
import { TradingViewChart } from "../features/chart/TradingViewChart";
import { AnalysisPanel } from "../features/analysis2/AnalysisPanel";
import { SEO } from "@/components/seo/SEO";
import { cn } from "@/lib/utils";

type HomeTabType = 'chart' | 'analysis';

const TAB_CONFIG: { id: HomeTabType; label: string; icon: React.ReactNode }[] = [
    { id: 'chart', label: 'Biểu đồ', icon: <LineChart className="h-3.5 w-3.5" /> },
    { id: 'analysis', label: 'Phân tích', icon: <BarChart2 className="h-3.5 w-3.5" /> },
];

function HomeHeader({
    activeTab,
    onTabChange,
}: {
    activeTab: HomeTabType;
    onTabChange: (tab: HomeTabType) => void;
}) {
    return (
        <div className="flex items-center gap-3 px-3 py-2">
            <div className="flex items-center gap-1 flex-1 min-w-0">
                {TAB_CONFIG.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap",
                            activeTab === tab.id
                                ? "bg-primary/10 text-primary border border-primary/20"
                                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                        )}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

/**
 * Home page - Dashboard overview
 * Uses unified WorkspaceLayout with tabs header
 */
export function HomePage() {
    const [activeTab, setActiveTab] = useState<HomeTabType>('chart');
    const symbol = 'VNINDEX';

    return (
        <>
            <SEO />
            <WorkspaceLayout
                header={
                    <HomeHeader
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                    />
                }
            >
                {activeTab === 'chart'
                    ? <TradingViewChart symbol={symbol} />
                    : <AnalysisPanel />
                }
            </WorkspaceLayout>
        </>
    );
}
