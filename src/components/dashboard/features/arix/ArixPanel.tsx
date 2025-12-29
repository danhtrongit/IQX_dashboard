"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
    TrendingUp,
    Target,
    Briefcase,
    BarChart3,
    DollarSign,
    Trophy,
    AlertTriangle,
} from "lucide-react";
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

// ==================== Custom Tooltip ====================
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

// ==================== SVG Bubble Chart ====================
interface BubbleDataPoint {
    symbol: string;
    x: number;
    y: number;
    z: number;
    profitLoss: number;
    buyDate: string;
    sellDate: string;
    buyPrice: number;
    sellPrice: number;
    quantity: number;
    isProfit: boolean;
}

interface DraggableBubbleChartProps {
    data: BubbleDataPoint[];
    width: number;
    height: number;
    onBubbleClick: (bubble: BubbleDataPoint) => void;
    hoveredIndex: number | null;
    setHoveredIndex: (index: number | null) => void;
}

function DraggableBubbleChart({
    data,
    width,
    height,
    onBubbleClick,
    hoveredIndex,
    setHoveredIndex,
}: DraggableBubbleChartProps) {
    const [bubblePositions, setBubblePositions] = useState<{ x: number; y: number; vx: number; vy: number }[]>([]);
    const [draggedBubbleIndex, setDraggedBubbleIndex] = useState<number | null>(null);
    const [tooltipData, setTooltipData] = useState<{
        bubble: BubbleDataPoint;
        x: number;
        y: number;
    } | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const animationFrameRef = useRef<number>(0);

    // Chart margins and dimensions
    const margin = { top: 20, right: 20, bottom: 50, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Calculate scales
    const xExtent = useMemo(() => {
        const values = data.map((d) => d.x);
        return { min: Math.min(...values), max: Math.max(...values) };
    }, [data]);

    const yExtent = useMemo(() => {
        const values = data.map((d) => d.y);
        return { min: Math.min(...values), max: Math.max(...values) };
    }, [data]);

    const zExtent = useMemo(() => {
        const values = data.map((d) => Math.abs(d.z));
        return { min: Math.min(...values), max: Math.max(...values) };
    }, [data]);

    // Scale functions
    const xScale = (value: number) => {
        const range = xExtent.max - xExtent.min || 1;
        return ((value - xExtent.min) / range) * chartWidth;
    };

    const yScale = (value: number) => {
        const range = yExtent.max - yExtent.min || 1;
        return chartHeight - ((value - yExtent.min) / range) * chartHeight;
    };

    const radiusScale = (value: number) => {
        const range = zExtent.max - zExtent.min || 1;
        const normalized = (Math.abs(value) - zExtent.min) / range;
        return 8 + normalized * 30; // radius between 8 and 38
    };

    // Get bubble radii
    const bubbleRadii = useMemo(() => data.map((d) => radiusScale(d.z)), [data, zExtent]);

    // Initialize bubble positions from data with velocity
    useEffect(() => {
        if (bubblePositions.length === 0 && chartWidth > 0 && chartHeight > 0) {
            const positions = data.map((d) => ({
                x: xScale(d.x),
                y: yScale(d.y),
                vx: 0,
                vy: 0,
            }));
            setBubblePositions(positions);
        }
    }, [data, bubblePositions.length, chartWidth, chartHeight]);

    // Physics simulation with collision detection
    useEffect(() => {
        if (bubblePositions.length === 0 || draggedBubbleIndex !== null) return;

        const animate = () => {
            setBubblePositions((prevPositions) => {
                const newPositions = prevPositions.map((pos, i) => {
                    const radius = bubbleRadii[i];
                    let { x, y, vx, vy } = pos;

                    // Apply velocity
                    x += vx;
                    y += vy;

                    // Friction
                    vx *= 0.98;
                    vy *= 0.98;

                    // Boundary collision (walls)
                    if (x - radius < 0) {
                        x = radius;
                        vx = Math.abs(vx) * 0.8; // Bounce with energy loss
                    } else if (x + radius > chartWidth) {
                        x = chartWidth - radius;
                        vx = -Math.abs(vx) * 0.8;
                    }

                    if (y - radius < 0) {
                        y = radius;
                        vy = Math.abs(vy) * 0.8;
                    } else if (y + radius > chartHeight) {
                        y = chartHeight - radius;
                        vy = -Math.abs(vy) * 0.8;
                    }

                    return { x, y, vx, vy };
                });

                // Bubble-to-bubble collision detection
                for (let i = 0; i < newPositions.length; i++) {
                    for (let j = i + 1; j < newPositions.length; j++) {
                        const pos1 = newPositions[i];
                        const pos2 = newPositions[j];
                        const r1 = bubbleRadii[i];
                        const r2 = bubbleRadii[j];

                        const dx = pos2.x - pos1.x;
                        const dy = pos2.y - pos1.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        const minDistance = r1 + r2;

                        // Check collision
                        if (distance < minDistance && distance > 0) {
                            // Normalize collision vector
                            const nx = dx / distance;
                            const ny = dy / distance;

                            // Relative velocity
                            const dvx = pos2.vx - pos1.vx;
                            const dvy = pos2.vy - pos1.vy;
                            const dvn = dvx * nx + dvy * ny;

                            // Don't resolve if velocities are separating
                            if (dvn < 0) continue;

                            // Separate overlapping bubbles
                            const overlap = minDistance - distance;
                            const separationX = (overlap / 2) * nx;
                            const separationY = (overlap / 2) * ny;

                            pos1.x -= separationX;
                            pos1.y -= separationY;
                            pos2.x += separationX;
                            pos2.y += separationY;

                            // Bounce - exchange velocities along collision normal
                            const restitution = 0.7; // Bounciness factor
                            const impulse = (1 + restitution) * dvn / 2;

                            pos1.vx += impulse * nx;
                            pos1.vy += impulse * ny;
                            pos2.vx -= impulse * nx;
                            pos2.vy -= impulse * ny;
                        }
                    }
                }

                return newPositions;
            });

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animationFrameRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [bubblePositions.length, draggedBubbleIndex, bubbleRadii, chartWidth, chartHeight]);

    // Generate axis ticks
    const xTicks = useMemo(() => {
        const ticks: number[] = [];
        const range = xExtent.max - xExtent.min;
        const step = Math.ceil(range / 5);
        for (let i = 0; i <= 5; i++) {
            ticks.push(Math.round(xExtent.min + step * i));
        }
        return ticks;
    }, [xExtent]);

    const yTicks = useMemo(() => {
        const ticks: number[] = [];
        const range = yExtent.max - yExtent.min;
        const step = Math.ceil(range / 5);
        for (let i = 0; i <= 5; i++) {
            ticks.push(Math.round(yExtent.min + step * i));
        }
        return ticks;
    }, [yExtent]);

    // Drag handlers
    const dragStartPos = useRef<{ x: number; y: number; time: number } | null>(null);

    const handleMouseDown = (index: number, e: React.MouseEvent) => {
        e.preventDefault();
        setDraggedBubbleIndex(index);
        const svg = svgRef.current;
        if (!svg) return;
        const rect = svg.getBoundingClientRect();
        dragStartPos.current = {
            x: e.clientX - rect.left - margin.left,
            y: e.clientY - rect.top - margin.top,
            time: Date.now(),
        };
    };

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        if (draggedBubbleIndex === null) return;

        const svg = svgRef.current;
        if (!svg) return;

        const rect = svg.getBoundingClientRect();
        const radius = bubbleRadii[draggedBubbleIndex];
        const x = Math.max(radius, Math.min(chartWidth - radius, e.clientX - rect.left - margin.left));
        const y = Math.max(radius, Math.min(chartHeight - radius, e.clientY - rect.top - margin.top));

        setBubblePositions((prev) => {
            const newPositions = [...prev];
            newPositions[draggedBubbleIndex] = { ...newPositions[draggedBubbleIndex], x, y };
            return newPositions;
        });
    };

    const handleMouseUp = (e: React.MouseEvent<SVGSVGElement>) => {
        if (draggedBubbleIndex === null) return;

        // Calculate velocity based on drag movement
        if (dragStartPos.current) {
            const svg = svgRef.current;
            if (svg) {
                const rect = svg.getBoundingClientRect();
                const endX = e.clientX - rect.left - margin.left;
                const endY = e.clientY - rect.top - margin.top;
                const deltaTime = Date.now() - dragStartPos.current.time;

                if (deltaTime > 0) {
                    const vx = (endX - dragStartPos.current.x) / deltaTime * 16; // Scale to 60fps
                    const vy = (endY - dragStartPos.current.y) / deltaTime * 16;

                    // Add velocity to the bubble
                    setBubblePositions((prev) => {
                        const newPositions = [...prev];
                        newPositions[draggedBubbleIndex] = {
                            ...newPositions[draggedBubbleIndex],
                            vx: vx * 0.5, // Dampen the throw
                            vy: vy * 0.5,
                        };
                        return newPositions;
                    });
                }
            }
        }

        setDraggedBubbleIndex(null);
        dragStartPos.current = null;
    };

    const handleBubbleMouseEnter = (bubble: BubbleDataPoint, index: number, e: React.MouseEvent) => {
        if (draggedBubbleIndex === null) {
            setHoveredIndex(index);
            const svg = svgRef.current;
            if (!svg) return;
            const rect = svg.getBoundingClientRect();
            setTooltipData({
                bubble,
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            });
        }
    };

    const handleBubbleMouseLeave = () => {
        setHoveredIndex(null);
        setTooltipData(null);
    };

    if (bubblePositions.length === 0) return null;

    return (
        <div className="relative w-full h-full">
            <svg
                ref={svgRef}
                width={width}
                height={height}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="select-none"
            >
                <g transform={`translate(${margin.left},${margin.top})`}>
                    {/* Grid lines */}
                    {yTicks.map((tick) => (
                        <line
                            key={`grid-y-${tick}`}
                            x1={0}
                            y1={yScale(tick)}
                            x2={chartWidth}
                            y2={yScale(tick)}
                            stroke="hsl(var(--border))"
                            strokeOpacity={0.2}
                            strokeDasharray="2,2"
                        />
                    ))}
                    {xTicks.map((tick) => (
                        <line
                            key={`grid-x-${tick}`}
                            x1={xScale(tick)}
                            y1={0}
                            x2={xScale(tick)}
                            y2={chartHeight}
                            stroke="hsl(var(--border))"
                            strokeOpacity={0.2}
                            strokeDasharray="2,2"
                        />
                    ))}

                    {/* Zero line */}
                    <line
                        x1={0}
                        y1={yScale(0)}
                        x2={chartWidth}
                        y2={yScale(0)}
                        stroke="hsl(var(--border))"
                        strokeWidth={1.5}
                        strokeDasharray="3,3"
                    />

                    {/* X Axis */}
                    <line
                        x1={0}
                        y1={chartHeight}
                        x2={chartWidth}
                        y2={chartHeight}
                        stroke="hsl(var(--border))"
                        strokeWidth={1}
                    />
                    {xTicks.map((tick) => (
                        <g key={`x-tick-${tick}`}>
                            <line
                                x1={xScale(tick)}
                                y1={chartHeight}
                                x2={xScale(tick)}
                                y2={chartHeight + 5}
                                stroke="hsl(var(--border))"
                            />
                            <text
                                x={xScale(tick)}
                                y={chartHeight + 18}
                                textAnchor="middle"
                                fontSize="10"
                                fill="hsl(var(--muted-foreground))"
                            >
                                {tick}
                            </text>
                        </g>
                    ))}
                    <text
                        x={chartWidth / 2}
                        y={chartHeight + 35}
                        textAnchor="middle"
                        fontSize="10"
                        fill="hsl(var(--muted-foreground))"
                    >
                        Ngày giữ
                    </text>

                    {/* Y Axis */}
                    <line
                        x1={0}
                        y1={0}
                        x2={0}
                        y2={chartHeight}
                        stroke="hsl(var(--border))"
                        strokeWidth={1}
                    />
                    {yTicks.map((tick) => (
                        <g key={`y-tick-${tick}`}>
                            <line
                                x1={-5}
                                y1={yScale(tick)}
                                x2={0}
                                y2={yScale(tick)}
                                stroke="hsl(var(--border))"
                            />
                            <text
                                x={-8}
                                y={yScale(tick)}
                                textAnchor="end"
                                alignmentBaseline="middle"
                                fontSize="10"
                                fill="hsl(var(--muted-foreground))"
                            >
                                {tick}%
                            </text>
                        </g>
                    ))}
                    <text
                        x={-35}
                        y={chartHeight / 2}
                        textAnchor="middle"
                        fontSize="10"
                        fill="hsl(var(--muted-foreground))"
                        transform={`rotate(-90, -35, ${chartHeight / 2})`}
                    >
                        Return %
                    </text>

                    {/* Bubbles */}
                    {data.map((bubble, index) => {
                        const pos = bubblePositions[index];
                        const radius = radiusScale(bubble.z);
                        const isHovered = hoveredIndex === index;
                        const isDragging = draggedBubbleIndex === index;
                        const isOtherHovered = hoveredIndex !== null && !isHovered;

                        return (
                            <g key={`bubble-${index}`}>
                                <circle
                                    cx={pos.x}
                                    cy={pos.y}
                                    r={radius}
                                    fill={bubble.isProfit ? "#22c55e" : "#ef4444"}
                                    fillOpacity={isOtherHovered ? 0.2 : isDragging ? 0.8 : 0.6}
                                    stroke={bubble.isProfit ? "#16a34a" : "#dc2626"}
                                    strokeWidth={isHovered || isDragging ? 2 : 1}
                                    className="transition-all cursor-grab active:cursor-grabbing"
                                    onMouseDown={(e) => handleMouseDown(index, e)}
                                    onMouseEnter={(e) => handleBubbleMouseEnter(bubble, index, e)}
                                    onMouseLeave={handleBubbleMouseLeave}
                                    onClick={() => onBubbleClick(bubble)}
                                />
                                {(isHovered || isDragging) && (
                                    <text
                                        x={pos.x}
                                        y={pos.y}
                                        textAnchor="middle"
                                        alignmentBaseline="middle"
                                        fontSize="11"
                                        fontWeight="bold"
                                        fill="white"
                                        pointerEvents="none"
                                    >
                                        {bubble.symbol}
                                    </text>
                                )}
                            </g>
                        );
                    })}
                </g>
            </svg>

            {/* Tooltip */}
            {tooltipData && !draggedBubbleIndex && (
                <div
                    className="absolute pointer-events-none z-50"
                    style={{
                        left: tooltipData.x + 10,
                        top: tooltipData.y - 10,
                    }}
                >
                    <CustomTooltip
                        active={true}
                        payload={[{ payload: tooltipData.bubble }]}
                    />
                </div>
            )}
        </div>
    );
}

// ==================== Main Panel ====================
export function ArixPanel() {
    const [activeTab, setActiveTab] = useState<"chart" | "hold" | "plan">("chart");
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [chartDimensions, setChartDimensions] = useState({ width: 400, height: 400 });
    const chartContainerRef = useRef<HTMLDivElement>(null);

    const stats = useMemo(() => calculateTradingStats(), []);
    const bubbleData = useMemo(() => prepareBubbleChartData(), []);

    // Update chart dimensions on resize
    useEffect(() => {
        const updateDimensions = () => {
            if (chartContainerRef.current) {
                const { width, height } = chartContainerRef.current.getBoundingClientRect();
                setChartDimensions({ width, height });
            }
        };

        updateDimensions();
        window.addEventListener("resize", updateDimensions);
        return () => window.removeEventListener("resize", updateDimensions);
    }, []);

    return (
        <div className="flex flex-col h-full w-full border-l border-border/40 bg-background/50 relative">
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
                        <div ref={chartContainerRef} className="flex-1 min-h-0">
                            <DraggableBubbleChart
                                data={bubbleData}
                                width={chartDimensions.width}
                                height={chartDimensions.height}
                                onBubbleClick={() => {}}
                                hoveredIndex={hoveredIndex}
                                setHoveredIndex={setHoveredIndex}
                            />
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
