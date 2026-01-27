"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useTheme } from "next-themes";
import {
    ArrowLeft,
    Building2,
    Info,
    LineChart,
    Calendar,
    Users,
    BarChart3,
    FileText,
    Activity,
    Brain
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SymbolsAPI, type SymbolResponse } from "@/lib/symbols-api";
import { WorkspaceLayout } from "../layout/WorkspaceLayout";
import { TradingViewChart } from "../features/chart/TradingViewChart";
import {
    StockOverviewTab,
    FinancialsTab,
    TradingInsightTab,
    EventsNewsTab,
    AnalysisReportsTab,
    TechnicalAnalysisTab,
    AIInsightTab
} from "../features/stock-info";
import { cn } from "@/lib/utils";

// Tab types
type MainTabType = 'chart' | 'overview' | 'financials' | 'insight' | 'events' | 'analysis' | 'technical' | 'ai-insight';

// Tab Configuration: ID -> Label & Icon
const TAB_CONFIG: { id: MainTabType; label: string; icon: React.ReactNode }[] = [
    { id: 'chart', label: 'Biểu đồ', icon: <LineChart className="h-3.5 w-3.5" /> },
    { id: 'overview', label: 'Tổng quan', icon: <Building2 className="h-3.5 w-3.5" /> },
    { id: 'financials', label: 'Tài chính', icon: <BarChart3 className="h-3.5 w-3.5" /> },
    { id: 'insight', label: 'NN/TD', icon: <Users className="h-3.5 w-3.5" /> },
    { id: 'events', label: 'Sự kiện', icon: <Calendar className="h-3.5 w-3.5" /> },
    { id: 'analysis', label: 'Phân tích', icon: <FileText className="h-3.5 w-3.5" /> },
    { id: 'technical', label: 'PTKT', icon: <Activity className="h-3.5 w-3.5" /> },
    { id: 'ai-insight', label: 'AI Insight', icon: <Brain className="h-3.5 w-3.5" /> },
];

// URL Mapping: Internal ID <-> URL Slug
const TAB_SLUGS: Record<MainTabType, string> = {
    chart: 'bieu-do',
    overview: 'tong-quan',
    financials: 'tai-chinh',
    insight: 'giao-dich',
    events: 'su-kien',
    analysis: 'bao-cao',
    technical: 'ky-thuat',
    'ai-insight': 'ai-insight',
};

// Header component for stock detail page
function StockHeader({
    activeTab,
    onTabChange,
    icbName,
    onBack
}: {
    activeTab: MainTabType;
    onTabChange: (tab: MainTabType) => void;
    icbName?: string;
    onBack: () => void;
}) {
    return (
        <div className="flex items-center gap-3 px-3 py-2">
            {/* Back button */}
            <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={onBack}
            >
                <ArrowLeft className="h-4 w-4" />
            </Button>

            {/* Tabs - Inline in Header */}
            <div className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto scrollbar-hide">
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

            {/* Industry info - right aligned */}
            {icbName && (
                <div className="hidden xl:flex items-center gap-1.5 text-[11px] text-muted-foreground shrink-0 ml-auto">
                    <Building2 className="h-3.5 w-3.5" />
                    <span className="truncate max-w-[180px]">{icbName}</span>
                </div>
            )}
        </div>
    );
}

// Loading skeleton for stock page
function StockLoadingSkeleton() {
    return (
        <div className="h-full p-4">
            <div className="flex items-center gap-4 mb-4">
                <Skeleton className="h-8 w-8 rounded" />
                <div className="space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-3 w-48" />
                </div>
            </div>
            <Skeleton className="h-[calc(100%-80px)] w-full rounded-lg" />
        </div>
    );
}

// Error state component
function StockErrorState({ symbol, onBack }: { symbol?: string; onBack: () => void }) {
    return (
        <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4">
                <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-destructive/10">
                    <Info className="h-8 w-8 text-destructive" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-lg font-semibold">Không tìm thấy cổ phiếu</h2>
                    <p className="text-sm text-muted-foreground">
                        Mã "{symbol?.toUpperCase()}" không tồn tại hoặc không hoạt động
                    </p>
                </div>
                <Button onClick={onBack} variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Quay lại trang chủ
                </Button>
            </div>
        </div>
    );
}

// Tab content renderer
function TabContent({ activeTab, symbol }: { activeTab: MainTabType; symbol: string }) {
    const upperSymbol = symbol.toUpperCase();
    const { resolvedTheme } = useTheme();

    switch (activeTab) {
        case 'chart':
            return <TradingViewChart key={`chart-${resolvedTheme}`} symbol={upperSymbol} />;
        case 'overview':
            return <StockOverviewTab symbol={upperSymbol} />;
        case 'financials':
            return <FinancialsTab symbol={upperSymbol} />;
        case 'insight':
            return <TradingInsightTab symbol={upperSymbol} />;
        case 'events':
            return <EventsNewsTab symbol={upperSymbol} />;
        case 'analysis':
            return <AnalysisReportsTab symbol={upperSymbol} />;
        case 'technical':
            return <TechnicalAnalysisTab symbol={upperSymbol} />;
        case 'ai-insight':
            return <AIInsightTab symbol={upperSymbol} />;
        default:
            return null;
    }
}

export function StockDetailPage() {
    const { symbol } = useParams<{ symbol: string }>();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [stockData, setStockData] = useState<SymbolResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Determine active tab from URL or default to 'chart'
    const activeTab = useMemo(() => {
        const tabSlug = searchParams.get('tab');
        if (!tabSlug) return 'chart';

        const foundTab = Object.keys(TAB_SLUGS).find(
            key => TAB_SLUGS[key as MainTabType] === tabSlug
        ) as MainTabType | undefined;

        return foundTab || 'chart';
    }, [searchParams]);

    const handleTabChange = (tabId: MainTabType) => {
        setSearchParams({ tab: TAB_SLUGS[tabId] });
    };

    const handleBack = () => navigate("/");

    useEffect(() => {
        const fetchStockData = async () => {
            if (!symbol) return;

            setIsLoading(true);
            setError(null);

            try {
                const upperSymbol = symbol.toUpperCase();
                // Fetch symbol info only (detail and price not needed without SEO)
                const symbolData = await SymbolsAPI.getBySymbol(upperSymbol);
                setStockData(symbolData);
            } catch (err) {
                console.error("Failed to fetch stock data:", err);
                setError("Không thể tải thông tin cổ phiếu");
            } finally {
                setIsLoading(false);
            }
        };

        fetchStockData();
    }, [symbol]);

    // Loading state
    if (isLoading) {
        return (
            <WorkspaceLayout>
                <StockLoadingSkeleton />
            </WorkspaceLayout>
        );
    }

    // Error state
    if (error || !stockData) {
        return (
            <WorkspaceLayout>
                <StockErrorState symbol={symbol} onBack={handleBack} />
            </WorkspaceLayout>
        );
    }

    // Main content
    return (
        <WorkspaceLayout
            header={
                <StockHeader
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    icbName={stockData.icb_name2 ?? undefined}
                    onBack={handleBack}
                />
            }
        >
            {symbol && <TabContent activeTab={activeTab} symbol={symbol} />}
        </WorkspaceLayout>
    );
}
