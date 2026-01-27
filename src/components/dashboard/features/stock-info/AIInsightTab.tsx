"use client";

import { useEffect, useState } from "react";
import {
    Brain,
    RefreshCw,
    TrendingUp,
    AlertTriangle,
    Target,
    ShieldCheck,
    Loader2,
    CandlestickChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    AIInsightAPI,
    type AIInsightResponse,
} from "@/lib/stock-api";

interface AIInsightTabProps {
    symbol: string;
}

// Period options matching the spec
const PERIOD_OPTIONS = [
    { value: 10, label: "10 phiên" },
    { value: 20, label: "20 phiên" },
    { value: 30, label: "30 phiên" },
    { value: 100, label: "100 phiên" },
    { value: 200, label: "200 phiên" },
];

const formatPrice = (price: number | null | undefined): string => {
    if (price === null || price === undefined) return "—";
    return new Intl.NumberFormat("vi-VN").format(price);
};

interface RecommendationSectionProps {
    title: string;
    icon: React.ReactNode;
    price: string | null | undefined;
    conditions: string[];
    variant: "buy" | "stop" | "profit";
}

const RecommendationSection = ({
    title,
    icon,
    price,
    conditions,
    variant,
}: RecommendationSectionProps) => {
    const variantStyles = {
        buy: "border-green-500/30 bg-green-500/5",
        stop: "border-red-500/30 bg-red-500/5",
        profit: "border-blue-500/30 bg-blue-500/5",
    };

    const priceStyles = {
        buy: "text-green-500",
        stop: "text-red-500",
        profit: "text-blue-500",
    };

    return (
        <div
            className={cn(
                "rounded-lg border p-3 space-y-2",
                variantStyles[variant]
            )}
        >
            <div className="flex items-center gap-2">
                {icon}
                <span className="text-xs font-semibold text-foreground">
                    {title}
                </span>
            </div>

            {price && (
                <div
                    className={cn(
                        "text-lg font-bold font-mono",
                        priceStyles[variant]
                    )}
                >
                    {price}
                </div>
            )}

            {conditions && conditions.length > 0 && (
                <ul className="space-y-1">
                    {conditions.map((condition, i) => (
                        <li
                            key={i}
                            className="text-[11px] text-muted-foreground flex items-start gap-1.5"
                        >
                            <span className="text-primary mt-0.5">•</span>
                            <span>{condition}</span>
                        </li>
                    ))}
                </ul>
            )}

            {(!conditions || conditions.length === 0) && !price && (
                <p className="text-[11px] text-muted-foreground italic">
                    Chưa có điều kiện cụ thể
                </p>
            )}
        </div>
    );
};

export function AIInsightTab({ symbol }: AIInsightTabProps) {
    const [data, setData] = useState<AIInsightResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [period, setPeriod] = useState<number>(20);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await AIInsightAPI.getInsight(symbol, period);
            if (response.error) {
                setError(response.error);
                setData(null);
            } else {
                setData(response);
            }
        } catch (err) {
            console.error("Failed to fetch AI insight:", err);
            setError("Lỗi kết nối server");
            setData(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [symbol, period]);

    const recommendation = data?.recommendation;

    if (isLoading) {
        return (
            <div className="h-[400px] flex flex-col items-center justify-center p-4">
                <div className="relative">
                    <Brain className="w-16 h-16 text-primary/30 animate-pulse" />
                    <Loader2 className="w-6 h-6 text-primary animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-sm font-medium text-foreground mt-4">
                    AI đang phân tích...
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                    Quá trình này có thể mất vài giây
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground p-4">
                <Brain className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-xs mb-3">{error}</p>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchData}
                    className="h-7 text-xs"
                >
                    <RefreshCw className="w-3 h-3 mr-2" /> Thử lại
                </Button>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col h-full bg-background">
            {/* Header / Toolbar */}
            <div className="flex items-center justify-between px-3 py-2 mb-2 border-b border-border/30">
                <div className="flex items-center gap-1.5 bg-secondary/30 rounded p-1">
                    {PERIOD_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => setPeriod(opt.value)}
                            className={cn(
                                "px-2.5 py-1 rounded-sm text-[10px] font-medium transition-all",
                                period === opt.value
                                    ? "bg-background text-primary shadow-sm ring-1 ring-border/50"
                                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                            )}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    {data?.current_price && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-secondary/20 rounded border border-border/30">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                Giá
                            </span>
                            <span className="text-sm font-bold font-mono text-primary">
                                {formatPrice(data.current_price)}
                            </span>
                        </div>
                    )}

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={fetchData}
                        disabled={isLoading}
                        className="h-7 w-7"
                    >
                        {isLoading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <RefreshCw className="h-3.5 w-3.5" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {/* Candlestick Pattern */}
                {data?.candlestick_pattern && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-secondary/20 rounded-lg border border-border/30">
                        <CandlestickChart className="w-4 h-4 text-primary" />
                        <span className="text-xs text-muted-foreground">
                            Mẫu hình nến:
                        </span>
                        <span className="text-xs font-medium text-foreground">
                            {data.candlestick_pattern}
                        </span>
                    </div>
                )}

                {/* Description / Analysis */}
                {recommendation?.description && (
                    <div className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
                        <div className="flex items-center gap-2 mb-2">
                            <Brain className="w-4 h-4 text-primary" />
                            <span className="text-xs font-semibold text-foreground">
                                Phân tích AI
                            </span>
                        </div>
                        <p className="text-[12px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {recommendation.description}
                        </p>
                    </div>
                )}

                {/* Recommendations Grid */}
                {recommendation && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <RecommendationSection
                            title="Điểm mua"
                            icon={
                                <TrendingUp className="w-4 h-4 text-green-500" />
                            }
                            price={recommendation.buy_price}
                            conditions={recommendation.buy_conditions}
                            variant="buy"
                        />

                        <RecommendationSection
                            title="Cắt lỗ"
                            icon={
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                            }
                            price={recommendation.stop_loss_price}
                            conditions={recommendation.stop_loss_conditions}
                            variant="stop"
                        />

                        <RecommendationSection
                            title="Chốt lời"
                            icon={<Target className="w-4 h-4 text-blue-500" />}
                            price={recommendation.take_profit_price}
                            conditions={recommendation.take_profit_conditions}
                            variant="profit"
                        />
                    </div>
                )}

                {/* No recommendation available */}
                {!recommendation && !error && (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <Brain className="w-12 h-12 mb-3 opacity-30" />
                        <p className="text-sm mb-1">Chưa có phân tích</p>
                        <p className="text-xs">
                            Nhấn nút làm mới để lấy phân tích từ AI
                        </p>
                    </div>
                )}

                {/* Disclaimer */}
                <div className="flex items-start gap-2 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
                    <ShieldCheck className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                        <strong className="text-foreground">Lưu ý:</strong> Đây
                        chỉ là phân tích tham khảo từ AI dựa trên dữ liệu kỹ
                        thuật. Không phải tư vấn đầu tư. Bạn cần tự nghiên cứu
                        và chịu trách nhiệm với quyết định đầu tư của mình.
                    </p>
                </div>
            </div>
        </div>
    );
}
