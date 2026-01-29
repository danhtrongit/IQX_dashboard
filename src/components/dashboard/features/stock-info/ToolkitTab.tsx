"use client";

import { useEffect, useState, useMemo } from "react";
import { Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { FinancialsAPI, type ToolkitResponse } from "@/lib/stock-api";
import { formatCompact } from "@/lib/format";
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
    ComposedChart,
    Line,
} from "recharts";

interface ToolkitTabProps {
    symbol: string;
}

// Format percentage with sign
const formatPercent = (value: number | null): string => {
    if (value === null || value === undefined || isNaN(value)) return "—";
    return `${(value * 100).toFixed(2)}%`;
};

// Format YoY change with sign and color
const formatYoY = (value: number | null): { text: string; color: string; icon: React.ReactNode } => {
    if (value === null || value === undefined || isNaN(value)) {
        return { text: "—", color: "text-muted-foreground", icon: <Minus className="h-3 w-3" /> };
    }
    const pct = (value * 100).toFixed(1);
    if (value > 0) {
        return {
            text: `+${pct}%`,
            color: "text-emerald-500",
            icon: <TrendingUp className="h-3 w-3" />,
        };
    } else if (value < 0) {
        return {
            text: `${pct}%`,
            color: "text-red-500",
            icon: <TrendingDown className="h-3 w-3" />,
        };
    }
    return { text: "0%", color: "text-muted-foreground", icon: <Minus className="h-3 w-3" /> };
};

// Custom axis tick
const CustomAxisTick = ({ x, y, payload }: { x: number; y: number; payload: { value: string } }) => {
    return (
        <text
            x={x}
            y={y}
            textAnchor="middle"
            className="fill-muted-foreground text-[10px]"
            dy={4}
        >
            {payload.value}
        </text>
    );
};

// Custom Y-axis tick
const CustomYAxisTick = ({
    x,
    y,
    payload,
    isPercent = false,
}: {
    x: number;
    y: number;
    payload: { value: number };
    isPercent?: boolean;
}) => {
    const formattedValue = isPercent
        ? `${(payload.value * 100).toFixed(0)}%`
        : formatCompact(payload.value);
    return (
        <text
            x={x}
            y={y}
            textAnchor="end"
            className="fill-muted-foreground text-[10px]"
            dy={4}
        >
            {formattedValue}
        </text>
    );
};

// Custom tooltip for stacked bar chart
const StackedTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
    if (active && payload && payload.length) {
        const total = payload.reduce((sum, entry) => sum + (entry.value || 0), 0);
        return (
            <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-xl max-w-xs">
                <p className="text-[11px] text-foreground font-medium mb-1.5">{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between gap-4 text-[11px]">
                        <div className="flex items-center gap-2">
                            <div
                                className="h-2.5 w-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-muted-foreground">{entry.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-foreground">
                                {formatCompact(entry.value)}
                            </span>
                            <span className="text-muted-foreground text-[10px]">
                                ({((entry.value / total) * 100).toFixed(1)}%)
                            </span>
                        </div>
                    </div>
                ))}
                <div className="mt-1 pt-1 border-t border-border/50 flex justify-between text-[11px]">
                    <span className="text-muted-foreground">Tổng</span>
                    <span className="font-mono font-semibold text-foreground">{formatCompact(total)}</span>
                </div>
            </div>
        );
    }
    return null;
};

// Custom legend
const CustomLegend = ({ payload }: { payload?: Array<{ value: string; color: string }> }) => {
    if (!payload || payload.length === 0) return null;
    return (
        <div className="flex flex-wrap justify-center gap-3 pt-2">
            {payload.map((entry, index) => (
                <div key={index} className="flex items-center gap-1.5 text-[10px]">
                    <div
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-muted-foreground">{entry.value}</span>
                </div>
            ))}
        </div>
    );
};

// Color palette for stacked bars
const ASSET_COLORS = {
    cash_short_invest: "#3b82f6",
    receivable: "#8b5cf6",
    inventory: "#f59e0b",
    long_term_invest: "#06b6d4",
    other_asset: "#94a3b8",
};

const REVENUE_COLORS = {
    core_revenue: "#00c076",
    financial_income: "#3b82f6",
    other_income: "#f59e0b",
};

export function ToolkitTab({ symbol }: ToolkitTabProps) {
    const [data, setData] = useState<ToolkitResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [period, setPeriod] = useState<"quarter" | "year">("year");
    const [limit] = useState(8);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const result = await FinancialsAPI.getToolkit(symbol, period, limit);
                setData(result);
            } catch (err) {
                console.error("Failed to fetch toolkit data:", err);
                setError("Không thể tải dữ liệu toolkit");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [symbol, period, limit]);

    // Prepare asset composition chart data
    const assetChartData = useMemo(() => {
        if (!data?.asset_composition) return [];

        const { labels, series } = data.asset_composition;
        return labels.map((label, i) => {
            const point: Record<string, string | number | null> = { period: label };
            series.forEach((s) => {
                if (s.key !== "total_asset") {
                    point[s.key] = s.values[i];
                }
            });
            return point;
        });
    }, [data]);

    // Prepare revenue composition chart data
    const revenueChartData = useMemo(() => {
        if (!data?.revenue_composition) return [];

        const { labels, series } = data.revenue_composition;
        return labels.map((label, i) => {
            const point: Record<string, string | number | null> = { period: label };
            series.forEach((s) => {
                point[s.key] = s.values[i];
            });
            return point;
        });
    }, [data]);

    // Prepare comparison chart data
    const comparisonChartData = useMemo(() => {
        if (!data?.comparison) return [];

        const { labels, metrics } = data.comparison;
        return labels.map((label, i) => {
            const point: Record<string, string | number | null> = { period: label };
            metrics.forEach((m) => {
                point[`${m.key}_yoy`] = m.yoy[i];
            });
            return point;
        });
    }, [data]);

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Đang tải dữ liệu toolkit...</span>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="h-full flex items-center justify-center">
                <p className="text-sm text-muted-foreground">{error || "Không có dữ liệu"}</p>
            </div>
        );
    }

    const { summary } = data;

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/30 bg-secondary/20">
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-foreground">Toolkit</span>
                    <span className="text-[10px] text-muted-foreground">
                        ({data.type === "bank" ? "Ngân hàng" : "Doanh nghiệp"})
                    </span>
                </div>

                {/* Period Filter */}
                <div className="flex items-center gap-0.5 p-0.5 bg-secondary/50 rounded">
                    <button
                        onClick={() => setPeriod("quarter")}
                        className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-medium transition-all",
                            period === "quarter"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Quý
                    </button>
                    <button
                        onClick={() => setPeriod("year")}
                        className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-medium transition-all",
                            period === "year"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Năm
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-3 space-y-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-6 gap-2">
                    {[
                        { label: "ROE", value: summary.roe, isPercent: true },
                        { label: "ROA", value: summary.roa, isPercent: true },
                        { label: "Nợ/Vốn CSH", value: summary.debt_equity, isPercent: false },
                        { label: "Biên LN gộp", value: summary.gross_margin, isPercent: true },
                        { label: "Biên LN ròng", value: summary.net_margin, isPercent: true },
                        { label: "Vòng quay TS", value: summary.asset_turnover, isPercent: false },
                    ].map((item) => (
                        <div
                            key={item.label}
                            className="bg-secondary/30 rounded-lg p-2.5 border border-border/20"
                        >
                            <div className="text-[10px] text-muted-foreground mb-1">{item.label}</div>
                            <div className="text-sm font-semibold text-foreground">
                                {item.isPercent
                                    ? formatPercent(item.value)
                                    : item.value !== null
                                      ? item.value.toFixed(2)
                                      : "—"}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Asset Composition Chart */}
                    <div className="bg-secondary/20 rounded-lg p-3 border border-border/20">
                        <div className="text-[11px] font-medium text-foreground mb-3">
                            Cơ cấu tài sản
                        </div>
                        <div className="h-[200px]">
                            {assetChartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={assetChartData}
                                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            className="stroke-border"
                                            opacity={0.3}
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey="period"
                                            tick={(props) => <CustomAxisTick {...props} />}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            tick={(props) => <CustomYAxisTick {...props} />}
                                            axisLine={false}
                                            tickLine={false}
                                            width={55}
                                        />
                                        <Tooltip content={<StackedTooltip />} />
                                        <Legend content={<CustomLegend />} />
                                        {data.asset_composition.series
                                            .filter((s) => s.key !== "total_asset")
                                            .map((s) => (
                                                <Bar
                                                    key={s.key}
                                                    dataKey={s.key}
                                                    name={s.name}
                                                    stackId="asset"
                                                    fill={ASSET_COLORS[s.key as keyof typeof ASSET_COLORS] || "#888"}
                                                />
                                            ))}
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                                    Không có dữ liệu
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Revenue Composition Chart */}
                    <div className="bg-secondary/20 rounded-lg p-3 border border-border/20">
                        <div className="text-[11px] font-medium text-foreground mb-3">
                            Cơ cấu doanh thu
                        </div>
                        <div className="h-[200px]">
                            {revenueChartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={revenueChartData}
                                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            className="stroke-border"
                                            opacity={0.3}
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey="period"
                                            tick={(props) => <CustomAxisTick {...props} />}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            tick={(props) => <CustomYAxisTick {...props} />}
                                            axisLine={false}
                                            tickLine={false}
                                            width={55}
                                        />
                                        <Tooltip content={<StackedTooltip />} />
                                        <Legend content={<CustomLegend />} />
                                        {data.revenue_composition.series.map((s) => (
                                            <Bar
                                                key={s.key}
                                                dataKey={s.key}
                                                name={s.name}
                                                stackId="revenue"
                                                fill={REVENUE_COLORS[s.key as keyof typeof REVENUE_COLORS] || "#888"}
                                            />
                                        ))}
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                                    Không có dữ liệu
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* YoY Comparison Chart */}
                <div className="bg-secondary/20 rounded-lg p-3 border border-border/20">
                    <div className="text-[11px] font-medium text-foreground mb-3">
                        So sánh tăng trưởng ({period === "year" ? "YoY" : "QoQ"})
                    </div>
                    <div className="h-[180px]">
                        {comparisonChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart
                                    data={comparisonChartData}
                                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        className="stroke-border"
                                        opacity={0.3}
                                        vertical={false}
                                    />
                                    <XAxis
                                        dataKey="period"
                                        tick={(props) => <CustomAxisTick {...props} />}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={(props) => <CustomYAxisTick {...props} isPercent />}
                                        axisLine={false}
                                        tickLine={false}
                                        width={45}
                                        domain={["auto", "auto"]}
                                    />
                                    <Tooltip
                                        content={({ active, payload, label }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-xl">
                                                        <p className="text-[11px] text-foreground font-medium mb-1.5">
                                                            {label}
                                                        </p>
                                                        {payload.map((entry, index) => {
                                                            const yoyInfo = formatYoY(entry.value as number);
                                                            return (
                                                                <div
                                                                    key={index}
                                                                    className="flex items-center justify-between gap-4 text-[11px]"
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <div
                                                                            className="h-2.5 w-2.5 rounded-full shrink-0"
                                                                            style={{ backgroundColor: entry.color }}
                                                                        />
                                                                        <span className="text-muted-foreground">
                                                                            {entry.name}
                                                                        </span>
                                                                    </div>
                                                                    <span className={cn("font-mono font-semibold", yoyInfo.color)}>
                                                                        {yoyInfo.text}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Legend content={<CustomLegend />} />
                                    <Line
                                        type="monotone"
                                        dataKey="total_asset_yoy"
                                        name="Tổng tài sản"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        dot={{ fill: "#3b82f6", strokeWidth: 0, r: 3 }}
                                        activeDot={{ r: 5 }}
                                        connectNulls
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="core_revenue_yoy"
                                        name="Doanh thu thuần"
                                        stroke="#00c076"
                                        strokeWidth={2}
                                        dot={{ fill: "#00c076", strokeWidth: 0, r: 3 }}
                                        activeDot={{ r: 5 }}
                                        connectNulls
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="net_profit_yoy"
                                        name="LN sau thuế"
                                        stroke="#f59e0b"
                                        strokeWidth={2}
                                        dot={{ fill: "#f59e0b", strokeWidth: 0, r: 3 }}
                                        activeDot={{ r: 5 }}
                                        connectNulls
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                                Không có dữ liệu
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
