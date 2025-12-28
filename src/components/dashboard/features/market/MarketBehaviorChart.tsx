import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

// --- Types ---

interface BehaviorDataPoint {
    date: string;
    sellStrong: number; // % of total
    sell: number;
    buy: number;
    buyStrong: number;
    vnIndex: number; // VN-INDEX value
}

interface LegendItem {
    key: string;
    label: string;
    color: string;
    visible: boolean;
}

// --- Mock Data (20 trading days) ---

const generateMockData = (): BehaviorDataPoint[] => {
    const data: BehaviorDataPoint[] = [];
    let vnIndex = 1250;

    for (let i = 20; i >= 1; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        // Random behavior distribution (must sum to 100)
        const sellStrong = Math.floor(Math.random() * 25) + 5;
        const sell = Math.floor(Math.random() * 25) + 10;
        const buyStrong = Math.floor(Math.random() * 25) + 5;
        const buy = 100 - sellStrong - sell - buyStrong;

        // VN-INDEX with some volatility
        vnIndex += (Math.random() - 0.48) * 15;

        data.push({
            date: `${date.getDate()}/${date.getMonth() + 1}`,
            sellStrong,
            sell,
            buy,
            buyStrong,
            vnIndex: Math.round(vnIndex * 100) / 100,
        });
    }

    return data;
};

// --- CSS Variable Colors (using oklch from theme) ---
// These map to shadcn/ui semantic colors

const BEHAVIOR_COLORS = {
    sellStrong: 'hsl(0 84% 60%)',      // destructive-ish (strong red)
    sell: 'hsl(0 60% 70%)',             // lighter red
    buy: 'hsl(142 60% 60%)',            // success-ish (lighter green)  
    buyStrong: 'hsl(142 76% 45%)',      // success (strong green)
    vnIndex: 'hsl(45 93% 58%)',         // amber/gold for line
};

// --- Custom Tooltip ---

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const vnIndexData = payload.find((p: any) => p.dataKey === 'vnIndex');
    const behaviorData = payload.filter((p: any) => p.dataKey !== 'vnIndex');

    return (
        <div className="bg-popover border border-border rounded-md p-3 shadow-lg text-xs">
            <p className="font-bold text-foreground mb-2 border-b border-border pb-1">{label}</p>

            {/* VN-INDEX */}
            {vnIndexData && (
                <div className="flex items-center justify-between gap-4 mb-2 pb-1 border-b border-border/50">
                    <span className="text-muted-foreground">VN-INDEX</span>
                    <span className="font-bold font-mono" style={{ color: BEHAVIOR_COLORS.vnIndex }}>
                        {vnIndexData.value.toFixed(2)}
                    </span>
                </div>
            )}

            {/* Behavior breakdown */}
            <div className="space-y-1">
                {behaviorData.reverse().map((entry: any) => (
                    <div key={entry.dataKey} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-1.5">
                            <div
                                className="w-2 h-2 rounded-sm"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-muted-foreground">{entry.name}</span>
                        </div>
                        <span className="font-mono font-medium text-foreground">{entry.value}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Custom Legend ---

const CustomLegend = ({
    items,
    onToggle
}: {
    items: LegendItem[];
    onToggle: (key: string) => void;
}) => (
    <div className="flex flex-wrap items-center justify-center gap-3 mb-2">
        {items.map((item) => (
            <button
                key={item.key}
                onClick={() => onToggle(item.key)}
                className={cn(
                    "flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[10px] font-medium transition-all cursor-pointer",
                    "hover:bg-accent/50",
                    !item.visible && "opacity-40"
                )}
            >
                <div
                    className="w-2.5 h-2.5 rounded-sm transition-opacity"
                    style={{
                        backgroundColor: item.color,
                        opacity: item.visible ? 1 : 0.3
                    }}
                />
                <span className="text-muted-foreground">{item.label}</span>
            </button>
        ))}
    </div>
);

// --- Loading Skeleton ---

const ChartSkeleton = () => (
    <div className="w-full h-[280px] flex flex-col gap-2 p-4">
        <div className="flex justify-center gap-4 mb-2">
            {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-4 w-16" />
            ))}
        </div>
        <div className="flex-1 flex items-end gap-1">
            {Array.from({ length: 20 }).map((_, i) => (
                <Skeleton
                    key={i}
                    className="flex-1"
                    style={{ height: `${Math.random() * 60 + 40}%` }}
                />
            ))}
        </div>
        <Skeleton className="h-4 w-full mt-2" />
    </div>
);

// --- Empty State ---

const EmptyState = () => (
    <div className="w-full h-[280px] flex flex-col items-center justify-center text-muted-foreground">
        <svg className="w-12 h-12 mb-2 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-xs">Không có dữ liệu hành vi thị trường</p>
    </div>
);

// --- Main Component ---

export function MarketBehaviorChart() {
    const [isLoading] = useState(false);
    const [legendState, setLegendState] = useState<Record<string, boolean>>({
        sellStrong: true,
        sell: true,
        buy: true,
        buyStrong: true,
        vnIndex: true,
    });

    // Mock data
    const data = useMemo(() => generateMockData(), []);

    // Legend items
    const legendItems: LegendItem[] = [
        { key: 'buyStrong', label: 'Mua mạnh', color: BEHAVIOR_COLORS.buyStrong, visible: legendState.buyStrong },
        { key: 'buy', label: 'Mua', color: BEHAVIOR_COLORS.buy, visible: legendState.buy },
        { key: 'sell', label: 'Bán', color: BEHAVIOR_COLORS.sell, visible: legendState.sell },
        { key: 'sellStrong', label: 'Bán mạnh', color: BEHAVIOR_COLORS.sellStrong, visible: legendState.sellStrong },
        { key: 'vnIndex', label: 'VN-INDEX', color: BEHAVIOR_COLORS.vnIndex, visible: legendState.vnIndex },
    ];

    const toggleLegend = (key: string) => {
        setLegendState(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Calculate visible data for stacked percentage
    const processedData = useMemo(() => {
        return data.map(d => ({
            ...d,
            sellStrong: legendState.sellStrong ? d.sellStrong : 0,
            sell: legendState.sell ? d.sell : 0,
            buy: legendState.buy ? d.buy : 0,
            buyStrong: legendState.buyStrong ? d.buyStrong : 0,
        }));
    }, [data, legendState]);

    if (isLoading) return <ChartSkeleton />;
    if (!data || data.length === 0) return <EmptyState />;

    return (
        <div className="w-full flex flex-col bg-card border border-border/40 rounded-md overflow-hidden">
            {/* Header */}
            <div className="h-8 px-3 border-b border-border/40 flex items-center justify-between bg-accent/5">
                <span className="text-xs font-bold text-foreground">Hành vi thị trường</span>
                <span className="text-[9px] text-muted-foreground">20 phiên gần nhất</span>
            </div>

            {/* Chart Area */}
            <div className="p-3">
                {/* Custom Legend */}
                <CustomLegend items={legendItems} onToggle={toggleLegend} />

                {/* Chart */}
                <div className="w-full h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                            data={processedData}
                            margin={{ top: 10, right: 50, left: 0, bottom: 5 }}
                            barCategoryGap="15%"
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="hsl(0 0% 20%)"
                                vertical={false}
                            />

                            {/* X-Axis: Dates */}
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 9, fill: 'hsl(0 0% 60%)' }}
                                axisLine={{ stroke: 'hsl(0 0% 25%)' }}
                                tickLine={false}
                                interval="preserveStartEnd"
                            />

                            {/* Y-Axis Left: Percentage */}
                            <YAxis
                                yAxisId="left"
                                tick={{ fontSize: 9, fill: 'hsl(0 0% 60%)' }}
                                axisLine={false}
                                tickLine={false}
                                domain={[0, 100]}
                                tickFormatter={(v) => `${v}%`}
                                width={35}
                            />

                            {/* Y-Axis Right: VN-INDEX */}
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                tick={{ fontSize: 9, fill: BEHAVIOR_COLORS.vnIndex }}
                                axisLine={false}
                                tickLine={false}
                                domain={['dataMin - 20', 'dataMax + 20']}
                                width={45}
                            />

                            <Tooltip content={<CustomTooltip />} />

                            {/* Stacked Bars (bottom to top: sellStrong → sell → buy → buyStrong) */}
                            <Bar
                                yAxisId="left"
                                dataKey="sellStrong"
                                stackId="behavior"
                                fill={BEHAVIOR_COLORS.sellStrong}
                                name="Bán mạnh"
                                radius={[0, 0, 0, 0]}
                                isAnimationActive={true}
                                animationDuration={400}
                            />
                            <Bar
                                yAxisId="left"
                                dataKey="sell"
                                stackId="behavior"
                                fill={BEHAVIOR_COLORS.sell}
                                name="Bán"
                                isAnimationActive={true}
                                animationDuration={400}
                            />
                            <Bar
                                yAxisId="left"
                                dataKey="buy"
                                stackId="behavior"
                                fill={BEHAVIOR_COLORS.buy}
                                name="Mua"
                                isAnimationActive={true}
                                animationDuration={400}
                            />
                            <Bar
                                yAxisId="left"
                                dataKey="buyStrong"
                                stackId="behavior"
                                fill={BEHAVIOR_COLORS.buyStrong}
                                name="Mua mạnh"
                                radius={[2, 2, 0, 0]}
                                isAnimationActive={true}
                                animationDuration={400}
                            />

                            {/* VN-INDEX Line */}
                            {legendState.vnIndex && (
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="vnIndex"
                                    stroke={BEHAVIOR_COLORS.vnIndex}
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{
                                        r: 4,
                                        fill: BEHAVIOR_COLORS.vnIndex,
                                        stroke: 'hsl(0 0% 10%)',
                                        strokeWidth: 2
                                    }}
                                    name="VN-INDEX"
                                    isAnimationActive={true}
                                    animationDuration={600}
                                />
                            )}
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
