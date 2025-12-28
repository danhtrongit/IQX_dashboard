"use client";

import { useEffect, useState, useMemo } from "react";
import {
    Activity,
    RefreshCw,
} from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
    TechnicalAPI,
    type TechnicalData,
    type TechnicalTimeframe,
    type GaugeData as APIGaugeData,
} from "@/lib/stock-api";

interface TechnicalAnalysisTabProps {
    symbol: string;
}

// --- Types & Constants matching VN-INDEX Style ---

type Signal = 'strong_sell' | 'sell' | 'neutral' | 'buy' | 'strong_buy';

interface GaugeChartData {
    sell: number;
    neutral: number;
    buy: number;
    signal: Signal;
    label: string;
}

const SIGNAL_COLORS = {
    strong_sell: 'hsl(0 84% 60%)',      // destructive
    sell: 'hsl(0 60% 70%)',              // light destructive
    neutral: 'hsl(0 0% 50%)',            // muted
    buy: 'hsl(142 60% 55%)',             // light success
    strong_buy: 'hsl(142 76% 45%)',      // success
};

const SIGNAL_LABELS: Record<Signal, string> = {
    strong_sell: 'Bán mạnh',
    sell: 'Bán',
    neutral: 'Trung lập',
    buy: 'Mua',
    strong_buy: 'Mua mạnh',
};

// Zone colors for the gauge
const ZONE_COLORS = {
    strongSell: 'hsl(0 75% 55%)',
    sell: 'hsl(15 70% 60%)',
    neutral: 'hsl(0 0% 45%)',
    buy: 'hsl(142 50% 55%)',
    strongBuy: 'hsl(142 70% 45%)',
};

// Timeframe options compatible with API
const TIMEFRAMES: { value: TechnicalTimeframe; label: string }[] = [
    { value: 'ONE_HOUR', label: '1 giờ' },
    { value: 'ONE_DAY', label: '1 ngày' },
    { value: 'ONE_WEEK', label: '1 tuần' },
];

// Map API rating to Signal
const mapRatingToSignal = (rating: string): Signal => {
    switch (rating) {
        case 'VERY_BAD': return 'strong_sell';
        case 'BAD': return 'sell';
        case 'GOOD': return 'buy';
        case 'VERY_GOOD': return 'strong_buy';
        case 'NEUTRAL':
        default: return 'neutral';
    }
};

// Map API rating to Signal for Indicators
const mapIndicatorRatingToSignal = (rating: string): Signal => {
    switch (rating) {
        case 'SELL': return 'sell';
        case 'BUY': return 'buy';
        default: return 'neutral';
    }
};

const formatIndicatorValue = (name: string, value: number): string => {
    // List of indicators that typically use standard decimal formatting
    const standardFormatIndicators = [
        'rsi', 'stoch', 'cci', 'adx', 'ao', 'momentum', 'macd', 'williams', 'ultimate', 'bull'
    ];

    const lowerName = name.toLowerCase();
    if (standardFormatIndicators.some(ind => lowerName.includes(ind))) {
        return value.toFixed(2);
    }
    // For price-based indicators like MA, format as currency-like or 2 decimals depending on magnitude
    return value > 1000 ? new Intl.NumberFormat('vi-VN').format(value) : value.toFixed(2);
};

// Indicator name mapping for display
const indicatorNameMap: Record<string, string> = {
    sma5: 'SMA (5)', sma10: 'SMA (10)', sma20: 'SMA (20)', sma50: 'SMA (50)', sma100: 'SMA (100)', sma200: 'SMA (200)',
    ema5: 'EMA (5)', ema10: 'EMA (10)', ema20: 'EMA (20)', ema50: 'EMA (50)', ema100: 'EMA (100)', ema200: 'EMA (200)',
    vwma20: 'VWMA (20)', hullMa9: 'Hull MA (9)',
    rsi: 'RSI (14)', stochastic: 'Stoch %K', commodity: 'CCI (20)', awesome: 'AO',
    momentum: 'Momentum', macd: 'MACD', stochRsi: 'Stoch RSI',
    williams: 'Williams %R', bullBear: 'Bull/Bear', ultimateOsc: 'Ultimate',
};

// --- Components ---

interface GaugeChartProps {
    title: string;
    data: GaugeChartData;
}

const SemiCircleGauge = ({ title, data }: GaugeChartProps) => {
    const total = data.sell + data.neutral + data.buy;

    // Calculate needle position
    const calculatedPosition = useMemo(() => {
        if (total === 0) return 50;
        // Logic: -1 (all sell) to +1 (all buy) -> mapped to 0-100
        const score = ((data.buy - data.sell) / total + 1) / 2 * 100;
        return Math.max(8, Math.min(92, score));
    }, [data.sell, data.neutral, data.buy, total]);

    // Needle angle: 0% = 180deg (left), 100% = 0deg (right)
    const needleAngle = 180 - (calculatedPosition * 1.8);
    const needleRad = (needleAngle * Math.PI) / 180;

    // Dimensions
    const viewBoxWidth = 100;
    const viewBoxHeight = 55;
    const cx = 50;
    const cy = 50;
    const outerRadius = 44;
    const innerRadius = 30;

    const createArc = (startDeg: number, endDeg: number) => {
        const startRad = (startDeg * Math.PI) / 180;
        const endRad = (endDeg * Math.PI) / 180;

        const x1 = cx + outerRadius * Math.cos(startRad);
        const y1 = cy - outerRadius * Math.sin(startRad);
        const x2 = cx + outerRadius * Math.cos(endRad);
        const y2 = cy - outerRadius * Math.sin(endRad);
        const x3 = cx + innerRadius * Math.cos(endRad);
        const y3 = cy - innerRadius * Math.sin(endRad);
        const x4 = cx + innerRadius * Math.cos(startRad);
        const y4 = cy - innerRadius * Math.sin(startRad);

        return `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 0 0 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 0 1 ${x4} ${y4} Z`;
    };

    const zones = [
        { start: 144, end: 180, color: ZONE_COLORS.strongSell },
        { start: 108, end: 144, color: ZONE_COLORS.sell },
        { start: 72, end: 108, color: ZONE_COLORS.neutral },
        { start: 36, end: 72, color: ZONE_COLORS.buy },
        { start: 0, end: 36, color: ZONE_COLORS.strongBuy },
    ];

    // Needle geometry
    const needleLength = 26;
    const needleWidth = 4;
    const tipX = cx + needleLength * Math.cos(needleRad);
    const tipY = cy - needleLength * Math.sin(needleRad);
    const perpRad = needleRad + Math.PI / 2;
    const baseX1 = cx + needleWidth * Math.cos(perpRad);
    const baseY1 = cy - needleWidth * Math.sin(perpRad);
    const baseX2 = cx - needleWidth * Math.cos(perpRad);
    const baseY2 = cy + needleWidth * Math.sin(perpRad);

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex flex-col items-center cursor-pointer group w-full">
                        <span className="text-[10px] text-muted-foreground font-medium mb-1">{title}</span>
                        <div className="w-full max-w-[140px] aspect-[100/55]">
                            <svg viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} className="w-full h-auto">
                                {zones.map((zone, i) => (
                                    <path key={i} d={createArc(zone.start, zone.end)} fill={zone.color} className="transition-opacity duration-200 hover:opacity-80" />
                                ))}
                                <circle cx={cx} cy={cy} r={5} fill="hsl(0 0% 20%)" stroke="hsl(0 0% 35%)" strokeWidth={1} />
                                <polygon
                                    points={`${tipX},${tipY} ${baseX1},${baseY1} ${baseX2},${baseY2}`}
                                    fill="hsl(0 0% 92%)" stroke="hsl(0 0% 70%)" strokeWidth={0.5}
                                    style={{ transition: 'all 0.4s ease-out', transformOrigin: `${cx}px ${cy}px` }}
                                />
                                <circle cx={cx} cy={cy} r={2.5} fill="hsl(0 0% 95%)" />
                            </svg>
                        </div>
                        <span className="text-xs font-bold mt-1" style={{ color: SIGNAL_COLORS[data.signal] }}>
                            {data.label}
                        </span>
                        <div className="flex items-center gap-2 text-[9px] mt-1">
                            {['sell', 'neutral', 'buy'].map((key) => (
                                <div key={key} className="flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-sm" style={{ background: SIGNAL_COLORS[key as keyof typeof SIGNAL_COLORS] }} />
                                    <span className="text-muted-foreground">{data[key as keyof Omit<GaugeChartData, 'signal' | 'label'>]}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                    <div className="space-y-1">
                        <p className="font-bold">{title}</p>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-sm" style={{ background: SIGNAL_COLORS.sell }} />
                            <span>Bán: {data.sell} / {total}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-sm" style={{ background: SIGNAL_COLORS.neutral }} />
                            <span>Trung lập: {data.neutral} / {total}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-sm" style={{ background: SIGNAL_COLORS.buy }} />
                            <span>Mua: {data.buy} / {total}</span>
                        </div>
                        <p className="font-medium pt-1 border-t border-border">
                            Kết luận: <span style={{ color: SIGNAL_COLORS[data.signal] }}>{data.label}</span>
                        </p>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

const SignalBadge = ({ signal }: { signal: Signal }) => (
    <span
        className="px-1.5 py-0.5 rounded text-[9px] font-medium"
        style={{ color: SIGNAL_COLORS[signal], backgroundColor: `${SIGNAL_COLORS[signal]}20` }}
    >
        {SIGNAL_LABELS[signal]}
    </span>
);

interface IndicatorTableProps {
    title: string;
    indicators: { name: string; value: number; signal: Signal }[];
}

const IndicatorTable = ({ title, indicators }: IndicatorTableProps) => (
    <div className="flex flex-col h-full border border-border/20 rounded-md bg-card/50">
        <div className="text-[10px] font-bold text-foreground py-2 px-3 border-b border-border/20 bg-muted/20">{title}</div>
        <div className="flex-1 overflow-auto scrollbar-thin max-h-[250px]">
            <table className="w-full text-left">
                <thead className="sticky top-0 bg-card z-10 text-[9px] text-muted-foreground border-b border-border/40">
                    <tr>
                        <th className="font-medium p-2 pl-3">Chỉ báo</th>
                        <th className="font-medium p-2 text-right">Giá trị</th>
                        <th className="font-medium p-2 text-right pr-3">Tín hiệu</th>
                    </tr>
                </thead>
                <tbody>
                    {indicators.map((ind) => (
                        <tr key={ind.name} className="border-b border-border/10 hover:bg-accent/5 transition-colors">
                            <td className="p-2 pl-3 text-[10px] text-foreground font-medium">
                                {indicatorNameMap[ind.name] || ind.name}
                            </td>
                            <td className="p-2 text-[10px] text-muted-foreground font-mono text-right">
                                {formatIndicatorValue(ind.name, ind.value)}
                            </td>
                            <td className="p-2 pr-3 text-right">
                                <SignalBadge signal={ind.signal} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

// --- Main Component ---

export function TechnicalAnalysisTab({ symbol }: TechnicalAnalysisTabProps) {
    const [data, setData] = useState<TechnicalData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeframe, setTimeframe] = useState<TechnicalTimeframe>('ONE_DAY');

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await TechnicalAPI.getTechnicalAnalysis(symbol, timeframe);
            if (response.data) {
                setData(response.data);
            } else if (response.error) {
                setError(response.error);
            }
        } catch (err) {
            console.error("Failed to fetch technical analysis:", err);
            setError("Lỗi kết nối server");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [symbol, timeframe]);

    // Data Processing
    const processedData = useMemo(() => {
        if (!data) return null;

        const convertGauge = (gauge: APIGaugeData): GaugeChartData => ({
            sell: gauge.values.sell,
            neutral: gauge.values.neutral,
            buy: gauge.values.buy,
            signal: mapRatingToSignal(gauge.rating),
            label: SIGNAL_LABELS[mapRatingToSignal(gauge.rating)]
        });

        const oscillators = (data.oscillators || []).map(ind => ({
            name: ind.name,
            value: ind.value,
            signal: mapIndicatorRatingToSignal(ind.rating)
        }));

        const movingAverages = (data.moving_averages || []).map(ind => ({
            name: ind.name,
            value: ind.value,
            signal: mapIndicatorRatingToSignal(ind.rating)
        }));

        return {
            summary: convertGauge(data.gauge_summary),
            maGauge: convertGauge(data.gauge_moving_average),
            oscGauge: convertGauge(data.gauge_oscillator),
            oscillators,
            movingAverages
        };
    }, [data]);

    if (isLoading) {
        return (
            <div className="p-4 space-y-4">
                <div className="flex justify-center gap-2">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-6 w-12" />)}
                </div>
                <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex flex-col items-center gap-2">
                            <Skeleton className="w-20 h-10 rounded-full" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-40" />
                    <Skeleton className="h-40" />
                </div>
            </div>
        );
    }

    if (error || !data || !processedData) {
        return (
            <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground p-4">
                <Activity className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-xs mb-3">{error || "Không có dữ liệu phân tích kỹ thuật"}</p>
                <Button variant="outline" size="sm" onClick={fetchData} className="h-7 text-xs">
                    <RefreshCw className="w-3 h-3 mr-2" /> Thử lại
                </Button>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col h-full bg-background">
            {/* Header / Toolbar */}
            <div className="flex items-center justify-between px-1 py-2 mb-2">
                <div className="flex items-center bg-secondary/30 rounded p-1">
                    {TIMEFRAMES.map((tf) => (
                        <button
                            key={tf.value}
                            onClick={() => setTimeframe(tf.value)}
                            className={cn(
                                "px-3 py-1 rounded-sm text-[10px] font-medium transition-all",
                                timeframe === tf.value
                                    ? "bg-background text-primary shadow-sm ring-1 ring-border/50"
                                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                            )}
                        >
                            {tf.label}
                        </button>
                    ))}
                </div>
                {data.price && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-secondary/20 rounded border border-border/30">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Giá</span>
                        <span className="text-sm font-bold font-mono text-primary">
                            {new Intl.NumberFormat('vi-VN').format(data.price)}
                        </span>
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="space-y-6">
                {/* Gauges Row */}
                <div className="grid grid-cols-3 gap-2 px-2">
                    <SemiCircleGauge title="Dao động" data={processedData.oscGauge} />
                    <SemiCircleGauge title="Tổng quan" data={processedData.summary} />
                    <SemiCircleGauge title="Trung bình động" data={processedData.maGauge} />
                </div>

                {/* Tables Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-2 pb-2">
                    <IndicatorTable title="Chỉ báo Dao động (Oscillators)" indicators={processedData.oscillators} />
                    <IndicatorTable title="Trung bình động (Moving Averages)" indicators={processedData.movingAverages} />
                </div>
            </div>
        </div>
    );
}
