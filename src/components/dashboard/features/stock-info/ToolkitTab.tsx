"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { FinancialsAPI, type ToolkitResponse, type ToolkitComposition, type ToolkitSinglePeriodCompare } from "@/lib/stock-api";
import { formatCompact } from "@/lib/format";
import {
    BarChart,
    Bar,
    LabelList,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";

interface ToolkitTabProps {
    symbol: string;
    period: "year" | "quarter";
    limit: number;
}

// Custom axis tick
const CustomAxisTick = ({ x, y, payload }: { x: number; y: number; payload: { value: string } }) => (
    <text x={x} y={y} textAnchor="middle" className="fill-muted-foreground text-[10px]" dy={4}>
        {payload.value}
    </text>
);

// Custom Y-axis tick
const CustomYAxisTick = ({ x, y, payload }: { x: number; y: number; payload: { value: number } }) => (
    <text x={x} y={y} textAnchor="end" className="fill-muted-foreground text-[10px]" dy={4}>
        {formatCompact(payload.value)}
    </text>
);

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
                            <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                            <span className="text-muted-foreground">{entry.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-foreground">{formatCompact(entry.value)}</span>
                            {total > 0 && (
                                <span className="text-muted-foreground text-[10px]">
                                    ({((entry.value / total) * 100).toFixed(1)}%)
                                </span>
                            )}
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

// Color palettes
const ASSET_COLORS: Record<string, string> = {
    cash_short_invest: "#3b82f6",
    receivable: "#8b5cf6",
    inventory: "#f59e0b",
    long_term_invest: "#06b6d4",
    other_asset: "#94a3b8",
};

const LIABILITY_COLORS: Record<string, string> = {
    equity: "#00c076",
    debt: "#ef4444",
    other_liabilities: "#94a3b8",
};

const REVENUE_COLORS: Record<string, string> = {
    gross_profit: "#00c076",
    financial_income: "#3b82f6",
    other_income: "#f59e0b",
};

const EXPENSE_COLORS: Record<string, string> = {
    cogs: "#ef4444",
    selling: "#f59e0b",
    admin: "#8b5cf6",
    interest: "#64748b",
};

// Reusable chart components
interface StackedChartProps {
    title: string;
    data: ToolkitComposition;
    colors: Record<string, string>;
}

function StackedChart({ title, data, colors }: StackedChartProps) {
    const hasData = useMemo(() => {
        if (!data.labels.length) return false;
        return data.series.some((s) => s.values.some((v) => v !== null && v !== undefined));
    }, [data]);

    const chartData = useMemo(() => {
        return data.labels.map((label, i) => {
            const point: Record<string, string | number | null> = { period: label };
            data.series.forEach((s) => {
                point[s.key] = s.values[i];
            });
            return point;
        });
    }, [data]);

    if (!hasData) {
        return (
            <div className="bg-secondary/20 rounded-lg p-3 border border-border/20">
                <div className="text-[11px] font-medium text-foreground mb-3">{title}</div>
                <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
                    Không có dữ liệu
                </div>
            </div>
        );
    }

    return (
        <div className="bg-secondary/20 rounded-lg p-3 border border-border/20">
            <div className="text-[11px] font-medium text-foreground mb-3">{title}</div>
            <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" opacity={0.3} vertical={false} />
                        <XAxis dataKey="period" tick={(props) => <CustomAxisTick {...props} />} axisLine={false} tickLine={false} />
                        <YAxis tick={(props) => <CustomYAxisTick {...props} />} axisLine={false} tickLine={false} width={55} />
                        <Tooltip content={<StackedTooltip />} />
                        {data.series.map((s) => (
                            <Bar key={s.key} dataKey={s.key} name={s.name} stackId="stack" fill={colors[s.key] || "#888"} />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}


// Single-period Comparison Chart (6+ separate bars)
interface SinglePeriodCompareChartProps {
    title: string;
    data: ToolkitSinglePeriodCompare;
    colors: Record<string, string>;
}

function SinglePeriodCompareChart({ title, data, colors }: SinglePeriodCompareChartProps) {
    const shortLabel = useCallback((key: string, full: string) => {
        // Hand-tuned abbreviations for common toolkit keys
        const map: Record<string, string> = {
            total_asset: "Tổng",
            total_sources: "Tổng",
            total: "Tổng",
            equity: "Vốn",
            debt: "Vay",
            other_liabilities: "Nợ khác",
            cash_short_invest: "Tiền/ĐTNH",
            receivable: "Phải thu",
            inventory: "Tồn kho",
            long_term_invest: "ĐT dài",
            other_asset: "TS khác",
            gross_profit: "LN gộp",
            financial_income: "TC",
            other_income: "Khác",
            cogs: "Giá vốn",
            selling: "Bán hàng",
            admin: "QLDN",
            interest: "Lãi vay",
            cfo: "CFO",
            cfi: "CFI",
            cff: "CFF",
            delta_cash: "Thuần",
        };
        if (map[key]) return map[key];

        // Fallback: compress Vietnamese phrases
        const cleaned = full
            .replace(/\(.*?\)/g, "")
            .replace(/\s+/g, " ")
            .trim();
        const words = cleaned.split(" ").filter(Boolean);
        if (words.length <= 2) return cleaned;
        return words.slice(0, 2).join(" ");
    }, []);

    const chartData = useMemo(() => {
        // total first, then components (excluding total)
        const items = [...data.items].sort((a, b) => {
            if (a.key === data.total_key) return -1;
            if (b.key === data.total_key) return 1;
            return 0;
        });

        const totalItem = items.find((it) => it.key === data.total_key);
        const rest = items.filter((it) => it.key !== data.total_key);

        const out: Array<{ name: string; fullName: string; key: string; base: number; value: number | null }> = [];

        const totalValue = totalItem?.value ?? data.total_value ?? null;
        out.push({
            name: shortLabel(data.total_key, totalItem?.name || data.total_name),
            fullName: totalItem?.name || data.total_name,
            key: data.total_key,
            base: 0,
            value: totalValue,
        });

        // Waterfall-like: each bar starts where previous ends
        let running = 0;
        for (const it of rest) {
            const v = it.value;
            out.push({
                name: shortLabel(it.key, it.name),
                fullName: it.name,
                key: it.key,
                base: running,
                value: v,
            });
            if (typeof v === "number") {
                running += v;
            }
        }

        return out;
    }, [data, shortLabel]);

    const hasData = useMemo(() => {
        return chartData.some((d) => d.value !== null && d.value !== undefined);
    }, [chartData]);

    if (!hasData) {
        return (
            <div className="bg-secondary/20 rounded-lg p-3 border border-border/20">
                <div className="text-[11px] font-medium text-foreground mb-3">{title}</div>
                <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
                    Không có dữ liệu
                </div>
            </div>
        );
    }

    return (
        <div className="bg-secondary/20 rounded-lg p-3 border border-border/20">
            <div className="flex items-baseline justify-between mb-3">
                <div className="text-[11px] font-medium text-foreground">{title}</div>
                <div className="text-[10px] text-muted-foreground">{data.period_label}</div>
            </div>

            <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 22, right: 10, left: 10, bottom: 0 }}
                        barCategoryGap={18}
                    >
                        {/* Inverted scale so bars "hang" from top down to baseline */}
                        <YAxis hide domain={[0, Math.max(...chartData.map((d) => (typeof d.base === "number" ? d.base : 0) + (typeof d.value === "number" ? d.value : 0)), 1)]} reversed />
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" opacity={0.12} vertical={false} />
                        <XAxis
                            dataKey="name"
                            tick={(props) => <CustomAxisTick {...props} />}
                            axisLine={false}
                            tickLine={false}
                            interval={0}
                        />
                        {/* No Y axis (as requested) */}
                        <Tooltip
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    const datum = chartData.find((d) => d.name === label);
                                    const rawValue = datum?.value as number | null | undefined;
                                    return (
                                        <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-xl max-w-xs">
                                            <p className="text-[11px] text-foreground font-medium mb-1.5">{datum?.fullName || label}</p>
                                            <div className="flex items-center justify-between gap-4 text-[11px]">
                                                <span className="text-muted-foreground">Giá trị</span>
                                                <span className="font-mono font-semibold text-foreground">{rawValue == null ? "—" : formatCompact(rawValue)}</span>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />

                        {/* Invisible base bar to create floating columns */}
                        <Bar dataKey="base" stackId="wf" fill="transparent" isAnimationActive={false} />

                        <Bar dataKey="value" stackId="wf" isAnimationActive={false}>
                            {chartData.map((entry, idx) => {
                                const isTotal = entry.key === data.total_key;
                                return (
                                    <Cell
                                        key={idx}
                                        fill={colors[entry.key] || (isTotal ? "#16a34a" : "#94a3b8")}
                                    />
                                );
                            })}
                            <LabelList
                                dataKey="value"
                                position="insideTop"
                                offset={-6}
                                className="fill-foreground text-[10px] font-medium"
                                formatter={(v: any) => (v === null || v === undefined ? "" : formatCompact(Number(v)))}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}


export function ToolkitTab({ symbol, period, limit }: ToolkitTabProps) {
    const [data, setData] = useState<ToolkitResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
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
    }, [symbol, period, limit]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Content */}
            <div className="flex-1 overflow-auto p-3 space-y-4">
                {/* 8 Charts in responsive grid (2 columns) */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Chart 1: Cơ cấu tài sản */}
                    {data.asset_compare && data.asset_composition.labels.length === 1 ? (
                        <SinglePeriodCompareChart
                            title="1. Cơ cấu tài sản"
                            data={data.asset_compare}
                            colors={{ ...ASSET_COLORS, total_asset: "#64748b" }}
                        />
                    ) : (
                        <StackedChart
                            title="1. Cơ cấu tài sản"
                            data={data.asset_composition}
                            colors={ASSET_COLORS}
                        />
                    )}

                    {/* Chart 2: Cơ cấu vốn chủ & nợ phải trả */}
                    {data.liability_compare && data.liability_equity.labels.length === 1 ? (
                        <SinglePeriodCompareChart
                            title="2. Cơ cấu vốn chủ & nợ phải trả"
                            data={data.liability_compare}
                            colors={{ ...LIABILITY_COLORS, total_sources: "#64748b" }}
                        />
                    ) : (
                        <StackedChart
                            title="2. Cơ cấu vốn chủ & nợ phải trả"
                            data={data.liability_equity}
                            colors={LIABILITY_COLORS}
                        />
                    )}

                    {/* Chart 3: Cơ cấu doanh thu */}
                    {data.revenue_compare && data.revenue_composition.labels.length === 1 ? (
                        <SinglePeriodCompareChart
                            title="3. Cơ cấu doanh thu"
                            data={data.revenue_compare}
                            colors={{ ...REVENUE_COLORS, total: "#64748b" }}
                        />
                    ) : (
                        <StackedChart
                            title="3. Cơ cấu doanh thu"
                            data={data.revenue_composition}
                            colors={REVENUE_COLORS}
                        />
                    )}

                    {/* Chart 4: Cơ cấu chi phí */}
                    {data.expense_compare && data.expense_composition.labels.length === 1 ? (
                        <SinglePeriodCompareChart
                            title="4. Cơ cấu chi phí"
                            data={data.expense_compare}
                            colors={{ ...EXPENSE_COLORS, total: "#64748b" }}
                        />
                    ) : (
                        <StackedChart
                            title="4. Cơ cấu chi phí"
                            data={data.expense_composition}
                            colors={EXPENSE_COLORS}
                        />
                    )}

                </div>
            </div>
        </div>
    );
}