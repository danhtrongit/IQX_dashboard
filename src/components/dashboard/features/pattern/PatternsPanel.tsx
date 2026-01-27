"use client";

import { useState, useCallback } from "react";
import {
    TrendingUp,
    TrendingDown,
    Minus,
    RefreshCw,
    CandlestickChart,
    Layers,
    AlertCircle,
    Sparkles,
    ScanLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useStock } from "@/lib/stock-context";
import {
    PatternAPI,
    type CandlestickPattern,
    type ChartPattern,
    type PatternBySymbolResponse,
} from "@/lib/pattern-api";

// ============== HELPERS ==============
const getStyleColor = (style: string) => {
    switch (style) {
        case 'support': return 'text-emerald-500';
        case 'resistance': return 'text-rose-500';
        default: return 'text-muted-foreground';
    }
};

const getStyleLabel = (style: string) => {
    switch (style) {
        case 'support': return 'Tăng';
        case 'resistance': return 'Giảm';
        default: return 'Trung tính';
    }
};

const getReliabilityColor = (reliability: string) => {
    switch (reliability) {
        case 'Cao': return 'text-emerald-500';
        case 'Trung bình': return 'text-amber-500';
        case 'Thấp': return 'text-rose-500';
        default: return 'text-muted-foreground';
    }
};

const StyleIcon = ({ style, className }: { style: string; className?: string }) => {
    const baseClass = cn("h-3.5 w-3.5", getStyleColor(style), className);
    switch (style) {
        case 'support':
            return <TrendingUp className={baseClass} />;
        case 'resistance':
            return <TrendingDown className={baseClass} />;
        default:
            return <Minus className={baseClass} />;
    }
};

// ============== CANDLESTICK CARD ==============
const CandlestickCard = ({ pattern }: { pattern: CandlestickPattern }) => {
    return (
        <div className="rounded-lg border border-border/50 p-3 hover:border-border transition-colors">
            <div className="flex gap-3">
                {/* Content - Left */}
                <div className="flex-1 min-w-0 space-y-1.5">
                    {/* Name & Status */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <StyleIcon style={pattern.style} />
                        <span className={cn("font-semibold text-sm", getStyleColor(pattern.style))}>
                            {pattern.name}
                        </span>
                        <span className={cn("text-[10px] font-medium", getStyleColor(pattern.style))}>
                            {getStyleLabel(pattern.style)}
                        </span>
                        <span className={cn("text-[10px] font-medium", getReliabilityColor(pattern.reliability))}>
                            ({pattern.reliability})
                        </span>
                    </div>

                    {/* Description */}
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {pattern.description}
                    </p>

                    {/* Signal */}
                    <div className="text-xs pt-1.5 border-t border-border/30">
                        <span className="text-muted-foreground">Tín hiệu: </span>
                        <span className="font-medium text-foreground">{pattern.signal}</span>
                    </div>
                </div>

                {/* Image - Right */}
                <img
                    src={PatternAPI.getCandlestickImageUrl(pattern.image)}
                    alt={pattern.name}
                    className="w-16 h-16 object-contain bg-muted/30 rounded shrink-0"
                />
            </div>
        </div>
    );
};

// ============== CHART PATTERN CARD ==============
const ChartCard = ({ pattern }: { pattern: ChartPattern }) => {
    return (
        <div className="rounded-lg border border-border/50 p-3 hover:border-border transition-colors">
            <div className="flex gap-3">
                {/* Content - Left */}
                <div className="flex-1 min-w-0 space-y-1.5">
                    {/* Name */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <StyleIcon style={pattern.style} className="h-4 w-4" />
                        <span className={cn("font-semibold text-sm", getStyleColor(pattern.style))}>
                            {pattern.name}
                        </span>
                        <span className={cn("text-[10px] font-medium", getStyleColor(pattern.style))}>
                            {getStyleLabel(pattern.style)}
                        </span>
                    </div>

                    {/* Description */}
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {pattern.description}
                    </p>

                    {/* Strategy */}
                    <div className="pt-1.5 border-t border-border/30">
                        <p className="text-[10px] text-primary font-medium mb-0.5 flex items-center gap-1">
                            <Layers className="h-3 w-3" />
                            Chiến lược
                        </p>
                        <p className="text-[11px] text-foreground/80 leading-relaxed">
                            {pattern.strategy}
                        </p>
                    </div>
                </div>

                {/* Image - Right */}
                <img
                    src={PatternAPI.getChartImageUrl(pattern.image)}
                    alt={pattern.name}
                    className="w-20 h-20 object-contain bg-muted/20 rounded shrink-0"
                />
            </div>
        </div>
    );
};

// ============== AI SCAN BUTTON ==============
const AIScanButton = ({
    symbol,
    onClick,
    isScanning
}: {
    symbol: string;
    onClick: () => void;
    isScanning: boolean;
}) => {
    return (
        <div className="h-full flex flex-col items-center justify-center p-6">
            <div className="text-center space-y-4">
                {/* Icon */}
                <div className={cn(
                    "w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center",
                    isScanning && "animate-pulse"
                )}>
                    {isScanning ? (
                        <ScanLine className="h-8 w-8 text-primary animate-pulse" />
                    ) : (
                        <Sparkles className="h-8 w-8 text-primary" />
                    )}
                </div>

                {/* Text */}
                <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-foreground">
                        {isScanning ? "Đang phân tích..." : "AI Nhận diện mẫu hình"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                        {isScanning
                            ? `AI đang quét biểu đồ ${symbol}`
                            : `Phân tích biểu đồ ${symbol} để phát hiện mẫu hình`
                        }
                    </p>
                </div>

                {/* Button */}
                <Button
                    onClick={onClick}
                    disabled={isScanning}
                    className="gap-2"
                    size="sm"
                >
                    {isScanning ? (
                        <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            Đang quét...
                        </>
                    ) : (
                        <>
                            <ScanLine className="h-3.5 w-3.5" />
                            Quét mẫu hình
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
};

// ============== SCANNING ANIMATION ==============
const ScanningState = ({ symbol }: { symbol: string }) => {
    return (
        <div className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs text-primary mb-4">
                <ScanLine className="h-4 w-4 animate-pulse" />
                <span className="font-medium">AI đang phân tích {symbol}...</span>
            </div>
            {[1, 2, 3].map(i => (
                <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-20" />
                </div>
            ))}
        </div>
    );
};

// ============== RESULTS VIEW ==============
const ResultsView = ({
    symbol,
    data,
    onRescan,
    isLoading
}: {
    symbol: string;
    data: PatternBySymbolResponse;
    onRescan: () => void;
    isLoading: boolean;
}) => {
    const candlesticks = data.candlestick_patterns || [];
    const chart = data.chart_pattern;
    const bullish = candlesticks.filter(p => p.style === 'support').length;
    const bearish = candlesticks.filter(p => p.style === 'resistance').length;

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex-none px-3 py-2 border-b border-border/40 flex items-center gap-2 text-xs flex-wrap">
                <div className="flex items-center gap-1.5 text-primary">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span className="font-semibold">{symbol}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <CandlestickChart className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{candlesticks.length} nến</span>
                </div>
                {bullish > 0 && (
                    <span className="text-emerald-500 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> {bullish}
                    </span>
                )}
                {bearish > 0 && (
                    <span className="text-rose-500 flex items-center gap-1">
                        <TrendingDown className="h-3 w-3" /> {bearish}
                    </span>
                )}
                {chart && (
                    <span className="text-blue-500 flex items-center gap-1">
                        <Layers className="h-3 w-3" /> 1
                    </span>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onRescan}
                    className="h-6 w-6 ml-auto"
                    disabled={isLoading}
                    title="Quét lại"
                >
                    <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
                </Button>
            </div>

            {/* Content - Single column */}
            <ScrollArea className="flex-1">
                <div className="p-3 space-y-3">
                    {/* Candlestick patterns - Top */}
                    {candlesticks.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                                <CandlestickChart className="h-3 w-3" />
                                Mẫu nến
                            </h3>
                            <div className="space-y-2">
                                {candlesticks.map(p => (
                                    <CandlestickCard key={p.id} pattern={p} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Chart pattern - Bottom */}
                    {chart && (
                        <div className="space-y-2">
                            <h3 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                                <Layers className="h-3 w-3" />
                                Mẫu đồ thị
                            </h3>
                            <ChartCard pattern={chart} />
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
};

// ============== MAIN PANEL ==============
export function PatternsPanel() {
    const { currentSymbol } = useStock();
    const [data, setData] = useState<PatternBySymbolResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasScanned, setHasScanned] = useState(false);
    const [scannedSymbol, setScannedSymbol] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setIsScanning(true);
        setError(null);

        // Simulate AI scanning delay for effect
        await new Promise(resolve => setTimeout(resolve, 1500));

        try {
            const response = await PatternAPI.getPatternsBySymbol(currentSymbol);
            setData(response);
            setHasScanned(true);
            setScannedSymbol(currentSymbol);
        } catch (err) {
            console.error("Failed to fetch patterns:", err);
            setError("Không thể tải dữ liệu mẫu hình");
        } finally {
            setIsLoading(false);
            setIsScanning(false);
        }
    }, [currentSymbol]);

    // Reset when symbol changes
    const symbolChanged = scannedSymbol !== null && scannedSymbol !== currentSymbol;

    // Initial state or symbol changed - show scan button
    if ((!hasScanned && !isScanning) || symbolChanged) {
        return (
            <div className="h-full flex flex-col bg-background/50 backdrop-blur-sm">
                <div className="flex-none px-3 py-2 border-b border-border/40">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">AI Mẫu hình</span>
                    </div>
                </div>
                <AIScanButton symbol={currentSymbol} onClick={fetchData} isScanning={false} />
            </div>
        );
    }

    // Scanning state
    if (isScanning) {
        return (
            <div className="h-full flex flex-col bg-background/50 backdrop-blur-sm">
                <div className="flex-none px-3 py-2 border-b border-border/40">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">AI Mẫu hình</span>
                    </div>
                </div>
                <ScanningState symbol={currentSymbol} />
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="h-full flex flex-col bg-background/50 backdrop-blur-sm">
                <div className="flex-none px-3 py-2 border-b border-border/40">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">AI Mẫu hình</span>
                    </div>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6">
                    <AlertCircle className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-xs mb-2">{error}</p>
                    <Button variant="outline" size="sm" onClick={fetchData} className="h-6 text-xs">
                        <RefreshCw className="w-3 h-3 mr-1" /> Thử lại
                    </Button>
                </div>
            </div>
        );
    }

    const candlesticks = data?.candlestick_patterns || [];
    const chart = data?.chart_pattern;
    const hasPatterns = candlesticks.length > 0 || chart;

    // No patterns found
    if (!hasPatterns) {
        return (
            <div className="h-full flex flex-col bg-background/50 backdrop-blur-sm">
                <div className="flex-none px-3 py-2 border-b border-border/40">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">AI Mẫu hình</span>
                        <span className="text-xs text-muted-foreground">• {currentSymbol}</span>
                    </div>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6">
                    <CandlestickChart className="w-10 h-10 mb-2 opacity-20" />
                    <p className="text-sm font-medium">Không phát hiện mẫu hình</p>
                    <p className="text-xs mt-1">AI không tìm thấy mẫu hình nào cho {currentSymbol}</p>
                    <Button variant="ghost" size="sm" onClick={fetchData} className="mt-3 h-6 text-xs">
                        <RefreshCw className="w-3 h-3 mr-1" /> Quét lại
                    </Button>
                </div>
            </div>
        );
    }

    // Results view
    return (
        <div className="h-full flex flex-col bg-background/50 backdrop-blur-sm">
            <ResultsView
                symbol={currentSymbol}
                data={data!}
                onRescan={fetchData}
                isLoading={isLoading}
            />
        </div>
    );
}
