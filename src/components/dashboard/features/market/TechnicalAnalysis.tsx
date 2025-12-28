import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";


// --- Types ---

type Timeframe = '5m' | '1h' | '1d' | '1w' | '1M';
type Signal = 'strong_sell' | 'sell' | 'neutral' | 'buy' | 'strong_buy';

interface Indicator {
    name: string;
    value: number | string;
    signal: Signal;
}

interface GaugeData {
    sell: number;
    neutral: number;
    buy: number;
    signal: Signal;
    label: string;
}

// --- Signal Colors (HSL-based, semantic) ---

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

// --- Mock Data Generator ---

const generateOscillators = (): Indicator[] => [
    { name: 'RSI (14)', value: 45.32, signal: 'neutral' },
    { name: 'Stochastic %K', value: 28.15, signal: 'sell' },
    { name: 'CCI (20)', value: -85.42, signal: 'sell' },
    { name: 'ADX (14)', value: 32.18, signal: 'neutral' },
    { name: 'AO', value: 12.45, signal: 'buy' },
    { name: 'Momentum (10)', value: 8.25, signal: 'buy' },
    { name: 'MACD (12,26)', value: -2.15, signal: 'sell' },
    { name: 'Williams %R', value: -72.5, signal: 'sell' },
    { name: 'BB Power', value: -15.32, signal: 'sell' },
    { name: 'Ultimate Oscillator', value: 48.25, signal: 'neutral' },
];

const generateMovingAverages = (): Indicator[] => [
    { name: 'EMA (10)', value: 1248.52, signal: 'buy' },
    { name: 'SMA (10)', value: 1245.18, signal: 'buy' },
    { name: 'EMA (20)', value: 1242.35, signal: 'buy' },
    { name: 'SMA (20)', value: 1238.92, signal: 'buy' },
    { name: 'EMA (30)', value: 1235.48, signal: 'neutral' },
    { name: 'SMA (30)', value: 1232.15, signal: 'neutral' },
    { name: 'EMA (50)', value: 1225.82, signal: 'sell' },
    { name: 'SMA (50)', value: 1220.45, signal: 'sell' },
    { name: 'EMA (100)', value: 1210.25, signal: 'sell' },
    { name: 'SMA (100)', value: 1205.18, signal: 'sell' },
];

const calculateGaugeData = (indicators: Indicator[]): GaugeData => {
    const counts = { sell: 0, neutral: 0, buy: 0 };

    indicators.forEach(ind => {
        if (ind.signal === 'strong_sell' || ind.signal === 'sell') counts.sell++;
        else if (ind.signal === 'strong_buy' || ind.signal === 'buy') counts.buy++;
        else counts.neutral++;
    });

    // Determine overall signal
    let signal: Signal = 'neutral';
    const total = indicators.length;
    const buyRatio = counts.buy / total;
    const sellRatio = counts.sell / total;

    if (buyRatio >= 0.7) signal = 'strong_buy';
    else if (buyRatio >= 0.5) signal = 'buy';
    else if (sellRatio >= 0.7) signal = 'strong_sell';
    else if (sellRatio >= 0.5) signal = 'sell';

    return { ...counts, signal, label: SIGNAL_LABELS[signal] };
};

// --- Gauge Component with 5 Zones and Triangle Needle ---

interface GaugeChartProps {
    title: string;
    data: GaugeData;
}

// Zone colors (left to right: red → orange → gray → light green → green)
const ZONE_COLORS = {
    strongSell: 'hsl(0 75% 55%)',
    sell: 'hsl(15 70% 60%)',
    neutral: 'hsl(0 0% 45%)',
    buy: 'hsl(142 50% 55%)',
    strongBuy: 'hsl(142 70% 45%)',
};

const SemiCircleGauge = ({ title, data }: GaugeChartProps) => {
    // Calculate needle position based on sell/neutral/buy ratio
    const total = data.sell + data.neutral + data.buy;
    const calculatedPosition = useMemo(() => {
        if (total === 0) return 50;
        const score = ((data.buy - data.sell) / total + 1) / 2 * 100;
        return Math.max(8, Math.min(92, score));
    }, [data.sell, data.neutral, data.buy, total]);

    // Needle angle: 0% = 180deg (left), 100% = 0deg (right)
    const needleAngle = 180 - (calculatedPosition * 1.8);
    const needleRad = (needleAngle * Math.PI) / 180;

    // SVG viewBox dimensions (responsive)
    const viewBoxWidth = 100;
    const viewBoxHeight = 55;
    const cx = 50;
    const cy = 50;
    const outerRadius = 44;
    const innerRadius = 30;

    // Create arc path for each zone
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

    // 5 zones: each spans 36 degrees (180/5)
    const zones = [
        { start: 144, end: 180, color: ZONE_COLORS.strongSell },
        { start: 108, end: 144, color: ZONE_COLORS.sell },
        { start: 72, end: 108, color: ZONE_COLORS.neutral },
        { start: 36, end: 72, color: ZONE_COLORS.buy },
        { start: 0, end: 36, color: ZONE_COLORS.strongBuy },
    ];

    // Triangle needle (compact arrow shape)
    const needleLength = 26;
    const needleWidth = 4;

    // Tip of the needle
    const tipX = cx + needleLength * Math.cos(needleRad);
    const tipY = cy - needleLength * Math.sin(needleRad);

    // Base of the needle (perpendicular to direction)
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

                        {/* Responsive SVG Container */}
                        <div className="w-full max-w-[140px] aspect-[100/55]">
                            <svg
                                viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
                                className="w-full h-auto"
                                preserveAspectRatio="xMidYMax meet"
                            >
                                {/* 5 Zone Arcs */}
                                {zones.map((zone, i) => (
                                    <path
                                        key={i}
                                        d={createArc(zone.start, zone.end)}
                                        fill={zone.color}
                                        className="transition-opacity duration-200 hover:opacity-80"
                                    />
                                ))}

                                {/* Needle base dot */}
                                <circle
                                    cx={cx}
                                    cy={cy}
                                    r={5}
                                    fill="hsl(0 0% 20%)"
                                    stroke="hsl(0 0% 35%)"
                                    strokeWidth={1}
                                />

                                {/* Triangle Needle */}
                                <polygon
                                    points={`${tipX},${tipY} ${baseX1},${baseY1} ${baseX2},${baseY2}`}
                                    fill="hsl(0 0% 92%)"
                                    stroke="hsl(0 0% 70%)"
                                    strokeWidth={0.5}
                                    className="drop-shadow-sm"
                                    style={{
                                        transition: 'all 0.4s ease-out',
                                        transformOrigin: `${cx}px ${cy}px`,
                                    }}
                                />

                                {/* Center dot on top */}
                                <circle
                                    cx={cx}
                                    cy={cy}
                                    r={2.5}
                                    fill="hsl(0 0% 95%)"
                                />
                            </svg>
                        </div>

                        {/* Status Label */}
                        <span
                            className="text-xs font-bold mt-1"
                            style={{ color: SIGNAL_COLORS[data.signal] }}
                        >
                            {data.label}
                        </span>

                        {/* Signal counts */}
                        <div className="flex items-center gap-2 text-[9px] mt-1">
                            <div className="flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-sm" style={{ background: SIGNAL_COLORS.sell }} />
                                <span className="text-muted-foreground">{data.sell}</span>
                            </div>
                            <span className="text-border">|</span>
                            <div className="flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-sm" style={{ background: SIGNAL_COLORS.neutral }} />
                                <span className="text-muted-foreground">{data.neutral}</span>
                            </div>
                            <span className="text-border">|</span>
                            <div className="flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-sm" style={{ background: SIGNAL_COLORS.buy }} />
                                <span className="text-muted-foreground">{data.buy}</span>
                            </div>
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

// Alias for backwards compatibility
const GaugeChart = SemiCircleGauge;



// --- Signal Badge ---

const SignalBadge = ({ signal }: { signal: Signal }) => (
    <span
        className="px-1.5 py-0.5 rounded text-[9px] font-medium"
        style={{
            color: SIGNAL_COLORS[signal],
            backgroundColor: `${SIGNAL_COLORS[signal]}20`
        }}
    >
        {SIGNAL_LABELS[signal]}
    </span>
);

// --- Indicator Table ---

interface IndicatorTableProps {
    title: string;
    indicators: Indicator[];
}

const IndicatorTable = ({ title, indicators }: IndicatorTableProps) => (
    <div className="flex flex-col h-full">
        <div className="text-[10px] font-bold text-foreground mb-1 px-1">{title}</div>
        <div className="flex-1 overflow-auto scrollbar-thin">
            <table className="w-full text-left">
                <thead className="sticky top-0 bg-card z-10">
                    <tr className="text-[9px] text-muted-foreground border-b border-border/40">
                        <th className="font-medium p-1.5 pl-2">Chỉ báo</th>
                        <th className="font-medium p-1.5 text-right">Giá trị</th>
                        <th className="font-medium p-1.5 text-right pr-2">Tín hiệu</th>
                    </tr>
                </thead>
                <tbody>
                    {indicators.map((ind) => (
                        <tr
                            key={ind.name}
                            className="border-b border-border/20 hover:bg-accent/5 transition-colors"
                        >
                            <td className="p-1.5 pl-2 text-[10px] text-foreground">{ind.name}</td>
                            <td className="p-1.5 text-[10px] text-muted-foreground font-mono text-right">
                                {typeof ind.value === 'number' ? ind.value.toFixed(2) : ind.value}
                            </td>
                            <td className="p-1.5 pr-2 text-right">
                                <SignalBadge signal={ind.signal} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

// --- Loading Skeleton ---

const LoadingSkeleton = () => (
    <div className="p-4 space-y-4">
        <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-6 w-12" />)}
        </div>
        <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
                <div key={i} className="flex flex-col items-center gap-2">
                    <Skeleton className="w-20 h-12 rounded-full" />
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

// --- Empty State ---



// --- Main Component ---

export function TechnicalAnalysis() {
    const [timeframe, setTimeframe] = useState<Timeframe>('1d');
    const [isLoading] = useState(false);

    // Generate data based on timeframe (in real app, this would be API call)
    const oscillators = useMemo(() => generateOscillators(), [timeframe]);
    const movingAverages = useMemo(() => generateMovingAverages(), [timeframe]);

    // Calculate gauge data
    const oscillatorGauge = useMemo(() => ({
        ...calculateGaugeData(oscillators),
        label: calculateGaugeData(oscillators).label
    }), [oscillators]);

    const maGauge = useMemo(() => ({
        ...calculateGaugeData(movingAverages),
        label: calculateGaugeData(movingAverages).label
    }), [movingAverages]);

    const summaryGauge = useMemo(() => {
        const allIndicators = [...oscillators, ...movingAverages];
        return calculateGaugeData(allIndicators);
    }, [oscillators, movingAverages]);

    const timeframes: { value: Timeframe; label: string }[] = [
        { value: '5m', label: '5 phút' },
        { value: '1h', label: '1 giờ' },
        { value: '1d', label: '1 ngày' },
        { value: '1w', label: '1 tuần' },
        { value: '1M', label: '1 tháng' },
    ];

    if (isLoading) return <LoadingSkeleton />;

    return (
        <div className="w-full flex flex-col bg-card border border-border/40 rounded-md overflow-hidden">
            {/* Header */}
            <div className="h-8 px-3 border-b border-border/40 flex items-center justify-between bg-accent/5">
                <span className="text-xs font-bold text-foreground">Phân tích kỹ thuật VN-INDEX</span>

                {/* Timeframe Switch */}
                <div className="flex items-center bg-secondary/40 rounded-sm p-0.5 border border-border/40">
                    {timeframes.map((tf) => (
                        <Button
                            key={tf.value}
                            variant="ghost"
                            onClick={() => setTimeframe(tf.value)}
                            className={cn(
                                "h-5 min-h-[20px] text-[10px] font-medium px-2 py-0 rounded-sm transition-all",
                                timeframe === tf.value
                                    ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                            )}
                        >
                            {tf.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="p-3 space-y-4">

                {/* Gauges Row */}
                <div className="grid grid-cols-3 gap-4 pb-3 border-b border-border/20">
                    <GaugeChart title="Dao động" data={oscillatorGauge} />
                    <GaugeChart title="Tổng quan" data={summaryGauge} />
                    <GaugeChart title="Trung bình động" data={maGauge} />
                </div>

                {/* Tables Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-[280px]">
                    <IndicatorTable title="Chỉ báo Dao động" indicators={oscillators} />
                    <IndicatorTable title="Trung bình động" indicators={movingAverages} />
                </div>
            </div>
        </div>
    );
}
