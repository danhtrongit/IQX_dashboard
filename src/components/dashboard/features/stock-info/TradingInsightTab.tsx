"use client";

import { useEffect, useState, useMemo } from "react";
import { Users, Building, Loader2, Filter } from "lucide-react";

import {
    InsightAPI,
    type ForeignTradingResponse,
    type ProprietaryTradingResponse,
} from "@/lib/stock-api";
import { cn } from "@/lib/utils";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Cell,
    AreaChart,
    Area,
} from "recharts";

interface TradingInsightTabProps {
    symbol: string;
}

// Format number
const formatNumber = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return "—";
    if (Math.abs(value) >= 1e12) return (value / 1e12).toFixed(2) + "T";
    if (Math.abs(value) >= 1e9) return (value / 1e9).toFixed(2) + "B";
    if (Math.abs(value) >= 1e6) return (value / 1e6).toFixed(2) + "M";
    if (Math.abs(value) >= 1e3) return (value / 1e3).toFixed(1) + "K";
    return new Intl.NumberFormat("vi-VN").format(value);
};

// Format for chart axis
const formatAxisValue = (value: number): string => {
    if (Math.abs(value) >= 1e9) return (value / 1e9).toFixed(1) + "B";
    if (Math.abs(value) >= 1e6) return (value / 1e6).toFixed(1) + "M";
    if (Math.abs(value) >= 1e3) return (value / 1e3).toFixed(0) + "K";
    return value.toString();
};

// Format date
const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
};

type InsightViewType = 'foreign' | 'proprietary';

const insightTabs: { id: InsightViewType; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'foreign', label: 'Khối ngoại', icon: <Users className="h-3 w-3" />, color: 'text-cyan-400' },
    { id: 'proprietary', label: 'Tự doanh', icon: <Building className="h-3 w-3" />, color: 'text-purple-400' },
];

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-popover border border-border rounded-md px-2 py-1.5 shadow-lg">
                <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-[10px]">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-muted-foreground">{entry.name}:</span>
                        <span className={cn(
                            "font-mono font-medium",
                            entry.value > 0 ? "text-[#00c076]" : entry.value < 0 ? "text-[#ff3a3a]" : ""
                        )}>
                            {entry.value > 0 ? "+" : ""}{formatNumber(entry.value)}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

// Summary Card Component
const SummaryCard = ({
    label,
    value,
    subLabel
}: {
    label: string;
    value: number | null;
    subLabel?: string;
}) => (
    <div className="px-3 py-2 bg-secondary/30 rounded-md border border-border/30">
        <div className="text-[9px] text-muted-foreground uppercase tracking-wide mb-0.5">{label}</div>
        <div className={cn(
            "text-sm font-mono font-bold",
            value && value > 0 ? "text-[#00c076]" : value && value < 0 ? "text-[#ff3a3a]" : "text-muted-foreground"
        )}>
            {value && value > 0 ? "+" : ""}{formatNumber(value)}
        </div>
        {subLabel && <div className="text-[9px] text-muted-foreground">{subLabel}</div>}
    </div>
);

export function TradingInsightTab({ symbol }: TradingInsightTabProps) {
    const [foreignTrading, setForeignTrading] = useState<ForeignTradingResponse | null>(null);
    const [proprietaryTrading, setProprietaryTrading] = useState<ProprietaryTradingResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [activeView, setActiveView] = useState<InsightViewType>('foreign');
    const [limit, setLimit] = useState<number>(20);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [foreignRes, propRes] = await Promise.allSettled([
                    InsightAPI.getForeignTrading(symbol, { limit }),
                    InsightAPI.getProprietaryTrading(symbol, { limit }),
                ]);

                if (foreignRes.status === "fulfilled") setForeignTrading(foreignRes.value);
                if (propRes.status === "fulfilled") setProprietaryTrading(propRes.value);
            } catch (err) {
                console.error("Failed to fetch insight data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [symbol, limit]);

    // Prepare foreign trading chart data
    const foreignChartData = useMemo(() => {
        if (!foreignTrading?.data) return [];
        return foreignTrading.data
            .slice()
            .reverse()
            .map((item) => ({
                date: formatDate(item.trading_date),
                netValue: item.net_value || 0,
                buyValue: item.buy_value || 0,
                sellValue: item.sell_value || 0,
            }));
    }, [foreignTrading]);

    // Prepare proprietary trading chart data
    const proprietaryChartData = useMemo(() => {
        if (!proprietaryTrading?.data) return [];
        return proprietaryTrading.data
            .slice()
            .reverse()
            .map((item) => ({
                date: formatDate(item.trading_date),
                netValue: item.net_value || 0,
                buyValue: item.buy_value || 0,
                sellValue: item.sell_value || 0,
            }));
    }, [proprietaryTrading]);

    // Calculate summaries
    const foreignSummary = useMemo(() => {
        if (!foreignTrading?.data || foreignTrading.data.length === 0) return null;
        const recent = foreignTrading.data[0];
        const total = foreignTrading.data.reduce((acc, item) => acc + (item.net_value || 0), 0);
        return {
            latestNetValue: recent.net_value || 0,
            totalNetValue: total,
            ownedPercent: recent.owned_percent || 0,
        };
    }, [foreignTrading]);

    const proprietarySummary = useMemo(() => {
        if (!proprietaryTrading?.data || proprietaryTrading.data.length === 0) return null;
        const recent = proprietaryTrading.data[0];
        const total = proprietaryTrading.data.reduce((acc, item) => acc + (item.net_value || 0), 0);
        return {
            latestNetValue: recent.net_value || 0,
            totalNetValue: total,
        };
    }, [proprietaryTrading]);

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Đang tải...</span>
                </div>
            </div>
        );
    }

    const currentData = activeView === 'foreign' ? foreignChartData : proprietaryChartData;
    const currentSummary = activeView === 'foreign' ? foreignSummary : proprietarySummary;
    const barColors = activeView === 'foreign'
        ? { positive: "#06b6d4", negative: "#ff3a3a" }
        : { positive: "#a855f7", negative: "#f97316" };

    return (
        <div className="h-full flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/30 bg-secondary/20">
                {/* View Tabs */}
                <div className="flex items-center gap-1">
                    {insightTabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveView(tab.id)}
                            className={cn(
                                "flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-medium transition-all",
                                activeView === tab.id
                                    ? cn("bg-primary/10", tab.color)
                                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                            )}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2">
                    <Filter className="h-3 w-3 text-muted-foreground" />

                    {/* Limit Filter */}
                    <div className="flex items-center gap-0.5 p-0.5 bg-secondary/50 rounded">
                        {[10, 20, 30, 50].map((l) => (
                            <button
                                key={l}
                                onClick={() => setLimit(l)}
                                className={cn(
                                    "px-1.5 py-0.5 rounded text-[10px] font-mono font-medium transition-all min-w-[24px]",
                                    limit === l
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {l}
                            </button>
                        ))}
                        <span className="text-[9px] text-muted-foreground ml-1">phiên</span>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-2 px-3 py-2 border-b border-border/30">
                <SummaryCard
                    label={activeView === 'foreign' ? "NN ròng hôm nay" : "TD ròng hôm nay"}
                    value={currentSummary?.latestNetValue || null}
                    subLabel="Phiên gần nhất"
                />
                <SummaryCard
                    label={`Tổng ${limit} phiên`}
                    value={currentSummary?.totalNetValue || null}
                    subLabel="Mua/bán ròng"
                />
                {activeView === 'foreign' && foreignSummary && (
                    <>
                        <SummaryCard
                            label="Tỷ lệ sở hữu"
                            value={null}
                            subLabel={`${(foreignSummary.ownedPercent || 0).toFixed(2)}%`}
                        />
                        <SummaryCard
                            label="Room còn lại"
                            value={foreignTrading?.data[0]?.current_room || null}
                            subLabel="Cổ phiếu"
                        />
                    </>
                )}
                {activeView === 'proprietary' && (
                    <>
                        <div className="px-3 py-2 bg-secondary/30 rounded-md border border-border/30">
                            <div className="text-[9px] text-muted-foreground uppercase tracking-wide mb-0.5">Xu hướng</div>
                            <div className={cn(
                                "text-sm font-medium",
                                (proprietarySummary?.totalNetValue || 0) > 0 ? "text-[#00c076]" : "text-[#ff3a3a]"
                            )}>
                                {(proprietarySummary?.totalNetValue || 0) > 0 ? "Mua ròng" : "Bán ròng"}
                            </div>
                        </div>
                        <div className="px-3 py-2 bg-secondary/30 rounded-md border border-border/30">
                            <div className="text-[9px] text-muted-foreground uppercase tracking-wide mb-0.5">Số phiên</div>
                            <div className="text-sm font-mono font-medium">{limit}</div>
                        </div>
                    </>
                )}
            </div>

            {/* Charts */}
            <div className="flex-1 flex flex-col min-h-0 p-3 gap-3">
                {/* Net Value Bar Chart */}
                <div className="flex-1 min-h-0">
                    <div className="text-[10px] font-medium text-muted-foreground mb-1">
                        Mua/bán ròng ({limit} phiên)
                    </div>
                    <div className="h-[calc(100%-20px)]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={currentData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
                                    angle={-45}
                                    textAnchor="end"
                                    height={40}
                                    axisLine={{ stroke: "hsl(var(--border))" }}
                                />
                                <YAxis
                                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
                                    tickFormatter={formatAxisValue}
                                    axisLine={{ stroke: "hsl(var(--border))" }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: '10px', color: '#a1a1aa' }} iconSize={8} />
                                <Bar dataKey="netValue" name="Mua/bán ròng" radius={[2, 2, 0, 0]}>
                                    {currentData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.netValue >= 0 ? barColors.positive : barColors.negative}
                                            opacity={0.85}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Buy/Sell Area Chart */}
                <div className="h-[140px] min-h-0">
                    <div className="text-[10px] font-medium text-muted-foreground mb-1">
                        Giá trị mua/bán
                    </div>
                    <div className="h-[calc(100%-20px)]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={currentData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
                                    axisLine={{ stroke: "hsl(var(--border))" }}
                                    height={20}
                                />
                                <YAxis
                                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
                                    tickFormatter={formatAxisValue}
                                    axisLine={{ stroke: "hsl(var(--border))" }}
                                    width={45}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: '9px', color: '#a1a1aa' }} iconSize={6} />
                                <Area
                                    type="monotone"
                                    dataKey="buyValue"
                                    name="Mua"
                                    stroke="#00c076"
                                    fill="#00c076"
                                    fillOpacity={0.2}
                                    strokeWidth={1.5}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="sellValue"
                                    name="Bán"
                                    stroke="#ff3a3a"
                                    fill="#ff3a3a"
                                    fillOpacity={0.2}
                                    strokeWidth={1.5}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
