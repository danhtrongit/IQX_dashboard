"use client";

import { useState, useMemo } from "react";
import {
    TrendingUp,
    TrendingDown,
    Target,
    Briefcase,
    BarChart3,
    Calendar,
    Percent,
    DollarSign,
    Clock,
    Trophy,
    AlertTriangle,
} from "lucide-react";
import {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    ZAxis,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    Cell,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    TOTAL_ASSETS,
    arixSellData,
    arixHoldData,
    arixPlanData,
    calculateTradingStats,
    prepareBubbleChartData,
    type ArixHoldPosition,
    type ArixPlanItem,
} from "./arix-data";

// ==================== Format Helpers ====================
function formatCurrency(value: number, compact = false): string {
    if (compact) {
        if (Math.abs(value) >= 1_000_000_000) {
            return `${(value / 1_000_000_000).toFixed(1)}B`;
        }
        if (Math.abs(value) >= 1_000_000) {
            return `${(value / 1_000_000).toFixed(1)}M`;
        }
        if (Math.abs(value) >= 1_000) {
            return `${(value / 1_000).toFixed(0)}K`;
        }
    }
    return new Intl.NumberFormat("vi-VN").format(value);
}

// ==================== Custom Tooltip ====================
interface TooltipPayload {
    symbol: string;
    x: number;
    y: number;
    profitLoss: number;
    buyDate: string;
    sellDate: string;
    buyPrice: number;
    sellPrice: number;
    quantity: number;
}

function CustomTooltip({
    active,
    payload,
}: {
    active?: boolean;
    payload?: { payload: TooltipPayload }[];
}) {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    const isProfit = data.profitLoss >= 0;

    return (
        <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-xl min-w-[200px]">
            <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-base">{data.symbol}</span>
                <Badge
                    className={cn(
                        "text-[10px]",
                        isProfit
                            ? "bg-green-500/20 text-green-500"
                            : "bg-red-500/20 text-red-500"
                    )}
                >
                    {isProfit ? "+" : ""}
                    {data.y}%
                </Badge>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between">
                    <span>Mua:</span>
                    <span className="font-mono">
                        {data.buyDate} @ {formatCurrency(data.buyPrice)}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span>Bán:</span>
                    <span className="font-mono">
                        {data.sellDate} @ {formatCurrency(data.sellPrice)}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span>Khối lượng:</span>
                    <span className="font-mono">{formatCurrency(data.quantity)} CP</span>
                </div>
                <div className="flex justify-between">
                    <span>Ngày giữ:</span>
                    <span className="font-mono">{data.x} ngày</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-border/50">
                    <span className="font-medium">P/L:</span>
                    <span
                        className={cn(
                            "font-mono font-bold",
                            isProfit ? "text-green-500" : "text-red-500"
                        )}
                    >
                        {isProfit ? "+" : ""}
                        {formatCurrency(data.profitLoss)}đ
                    </span>
                </div>
            </div>
        </div>
    );
}

// ==================== Stats Card ====================
interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    subValue?: string;
    trend?: "up" | "down" | "neutral";
}

function StatCard({ icon, label, value, subValue, trend }: StatCardProps) {
    return (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/30">
            <div
                className={cn(
                    "flex items-center justify-center w-9 h-9 rounded-lg",
                    trend === "up" && "bg-green-500/10 text-green-500",
                    trend === "down" && "bg-red-500/10 text-red-500",
                    trend === "neutral" && "bg-primary/10 text-primary"
                )}
            >
                {icon}
            </div>
            <div>
                <p className="text-[10px] text-muted-foreground">{label}</p>
                <p className="text-sm font-bold font-mono">{value}</p>
                {subValue && (
                    <p className="text-[9px] text-muted-foreground">{subValue}</p>
                )}
            </div>
        </div>
    );
}

// ==================== Hold Item ====================
function HoldItem({ position }: { position: ArixHoldPosition }) {
    const marketValue = position.price * position.volume;

    return (
        <div className="flex items-center justify-between p-3 border-b border-border/30 hover:bg-secondary/30 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10">
                    <Briefcase className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{position.symbol}</span>
                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                            {formatCurrency(position.volume)} CP
                        </Badge>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                        Mua: {position.date} @ {formatCurrency(position.price)}đ
                    </div>
                </div>
            </div>
            <div className="text-right">
                <div className="text-sm font-mono font-semibold">
                    {formatCurrency(marketValue, true)}đ
                </div>
                <div className="text-[10px] text-muted-foreground">
                    Giá trị thị trường
                </div>
            </div>
        </div>
    );
}

// ==================== Plan Item ====================
function PlanItem({ plan }: { plan: ArixPlanItem }) {
    return (
        <div className="flex items-center justify-between p-3 border-b border-border/30 hover:bg-secondary/30 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-500/10">
                    <Target className="w-4 h-4 text-yellow-500" />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{plan.symbol}</span>
                        <Badge className="text-[9px] px-1 py-0 h-4 bg-yellow-500/20 text-yellow-600">
                            R:R {plan.returnRisk}
                        </Badge>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                        Mục tiêu mua: {formatCurrency(plan.buyPrice)}đ
                    </div>
                </div>
            </div>
            <div className="text-right">
                <div className="text-[10px] text-red-400">
                    SL: {formatCurrency(plan.stopLoss)}đ
                </div>
                <div className="text-[10px] text-green-400">
                    TP: {plan.target}x
                </div>
            </div>
        </div>
    );
}

// ==================== Main Panel ====================
export function ArixPanel() {
    const [activeTab, setActiveTab] = useState<"chart" | "hold" | "plan">("chart");

    const stats = useMemo(() => calculateTradingStats(), []);
    const bubbleData = useMemo(() => prepareBubbleChartData(), []);

    // Calculate bubble size range
    const maxPL = Math.max(...bubbleData.map((d) => d.z));
    const minPL = Math.min(...bubbleData.map((d) => d.z));

    return (
        <div className="flex flex-col h-full w-full border-l border-border/40 bg-background/50">
            {/* Header */}
            <div className="px-4 py-3 border-b border-border/40">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-bold flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-primary" />
                        ARIX Trading Analysis
                    </h2>
                    <Badge variant="outline" className="text-[10px]">
                        {arixSellData.length} giao dịch
                    </Badge>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                    <StatCard
                        icon={<DollarSign className="w-4 h-4" />}
                        label="Tổng tài sản"
                        value={formatCurrency(TOTAL_ASSETS, true) + "đ"}
                        trend="neutral"
                    />
                    <StatCard
                        icon={<TrendingUp className="w-4 h-4" />}
                        label="Tổng P/L"
                        value={
                            (stats.totalProfitLoss >= 0 ? "+" : "") +
                            formatCurrency(stats.totalProfitLoss, true) +
                            "đ"
                        }
                        subValue={`${stats.returnOnAssets.toFixed(1)}% ROI`}
                        trend={stats.totalProfitLoss >= 0 ? "up" : "down"}
                    />
                </div>

                <div className="grid grid-cols-4 gap-2">
                    <div className="text-center p-2 rounded-lg bg-green-500/10">
                        <p className="text-lg font-bold text-green-500">{stats.winTrades}</p>
                        <p className="text-[9px] text-muted-foreground">Thắng</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-red-500/10">
                        <p className="text-lg font-bold text-red-500">{stats.lossTrades}</p>
                        <p className="text-[9px] text-muted-foreground">Thua</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-primary/10">
                        <p className="text-lg font-bold text-primary">
                            {stats.winRate.toFixed(0)}%
                        </p>
                        <p className="text-[9px] text-muted-foreground">Winrate</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-secondary">
                        <p className="text-lg font-bold">{stats.avgDaysHeld}</p>
                        <p className="text-[9px] text-muted-foreground">Ngày TB</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as "chart" | "hold" | "plan")}
                className="flex-1 flex flex-col overflow-hidden"
            >
                <TabsList className="w-full justify-start rounded-none border-b border-border/40 h-9 bg-transparent px-2">
                    <TabsTrigger
                        value="chart"
                        className="text-xs data-[state=active]:shadow-none"
                    >
                        Bubble Chart
                    </TabsTrigger>
                    <TabsTrigger
                        value="hold"
                        className="text-xs data-[state=active]:shadow-none"
                    >
                        Đang giữ ({arixHoldData.length})
                    </TabsTrigger>
                    <TabsTrigger
                        value="plan"
                        className="text-xs data-[state=active]:shadow-none"
                    >
                        Kế hoạch ({arixPlanData.length})
                    </TabsTrigger>
                </TabsList>

                {/* Bubble Chart Tab */}
                <TabsContent value="chart" className="flex-1 m-0 overflow-hidden p-2">
                    <div className="h-full flex flex-col">
                        {/* Chart Legend */}
                        <div className="flex items-center justify-between px-2 py-1 text-[10px] text-muted-foreground mb-2">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 rounded-full bg-green-500" />
                                    <span>Lãi</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 rounded-full bg-red-500" />
                                    <span>Lỗ</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span>Kích thước = P/L</span>
                            </div>
                        </div>

                        {/* Chart */}
                        <div className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 10, right: 10, bottom: 30, left: 10 }}>
                                    <XAxis
                                        type="number"
                                        dataKey="x"
                                        name="Ngày giữ"
                                        unit=" ngày"
                                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                                        axisLine={{ stroke: "hsl(var(--border))" }}
                                        tickLine={{ stroke: "hsl(var(--border))" }}
                                        label={{
                                            value: "Ngày giữ",
                                            position: "bottom",
                                            offset: 15,
                                            fontSize: 10,
                                            fill: "hsl(var(--muted-foreground))",
                                        }}
                                    />
                                    <YAxis
                                        type="number"
                                        dataKey="y"
                                        name="Return"
                                        unit="%"
                                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                                        axisLine={{ stroke: "hsl(var(--border))" }}
                                        tickLine={{ stroke: "hsl(var(--border))" }}
                                        label={{
                                            value: "Return %",
                                            angle: -90,
                                            position: "insideLeft",
                                            offset: 10,
                                            fontSize: 10,
                                            fill: "hsl(var(--muted-foreground))",
                                        }}
                                    />
                                    <ZAxis
                                        type="number"
                                        dataKey="z"
                                        range={[50, 400]}
                                        domain={[minPL, maxPL]}
                                    />
                                    <ReferenceLine
                                        y={0}
                                        stroke="hsl(var(--border))"
                                        strokeDasharray="3 3"
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Scatter data={bubbleData} fillOpacity={0.7}>
                                        {bubbleData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.isProfit ? "#22c55e" : "#ef4444"}
                                                stroke={entry.isProfit ? "#16a34a" : "#dc2626"}
                                                strokeWidth={1}
                                            />
                                        ))}
                                    </Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Best/Worst Trades */}
                        <div className="grid grid-cols-2 gap-2 mt-2 px-1">
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                                <Trophy className="w-4 h-4 text-green-500" />
                                <div>
                                    <p className="text-[9px] text-muted-foreground">Best Trade</p>
                                    <p className="text-xs font-bold">
                                        {stats.bestTrade.symbol}{" "}
                                        <span className="text-green-500">
                                            +{formatCurrency(stats.bestTrade.profitLoss, true)}đ
                                        </span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                                <div>
                                    <p className="text-[9px] text-muted-foreground">Worst Trade</p>
                                    <p className="text-xs font-bold">
                                        {stats.worstTrade.symbol}{" "}
                                        <span className="text-red-500">
                                            {formatCurrency(stats.worstTrade.profitLoss, true)}đ
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* Hold Tab */}
                <TabsContent value="hold" className="flex-1 m-0 overflow-hidden">
                    <ScrollArea className="h-full">
                        {arixHoldData.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                Không có vị thế đang giữ
                            </div>
                        ) : (
                            <div>
                                {arixHoldData.map((position, idx) => (
                                    <HoldItem key={`${position.symbol}-${idx}`} position={position} />
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </TabsContent>

                {/* Plan Tab */}
                <TabsContent value="plan" className="flex-1 m-0 overflow-hidden">
                    <ScrollArea className="h-full">
                        {arixPlanData.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                Không có kế hoạch giao dịch
                            </div>
                        ) : (
                            <div>
                                {arixPlanData.map((plan, idx) => (
                                    <PlanItem key={`${plan.symbol}-${idx}`} plan={plan} />
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </TabsContent>
            </Tabs>
        </div>
    );
}
