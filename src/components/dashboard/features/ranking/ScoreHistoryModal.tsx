import { useState, useEffect, useCallback } from "react";
import { RefreshCcw } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
    ScoreAPI,
    type ScoreHistoryItem,
    type MAPeriod,
    type TimeRange,
} from "@/lib/score-api";
import {
    BarChart,
    Bar,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from "recharts";

interface ScoreHistoryModalProps {
    symbol: string | null;
    maPeriod: MAPeriod;
    onClose: () => void;
}

const TIME_RANGES: { value: TimeRange; label: string }[] = [
    { value: "week", label: "1W" },
    { value: "month", label: "1M" },
    { value: "year", label: "1Y" },
];

const MA_PERIODS_HISTORY: MAPeriod[] = [5, 10, 20, 30, 50, 100];

export function ScoreHistoryModal({ symbol, maPeriod: initialMaPeriod, onClose }: ScoreHistoryModalProps) {
    const [timeRange, setTimeRange] = useState<TimeRange>("month");
    const [maPeriod, setMaPeriod] = useState<MAPeriod>(initialMaPeriod === 200 ? 100 : initialMaPeriod);
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState<ScoreHistoryItem[]>([]);

    // Reset MA period when modal opens with new initial value
    useEffect(() => {
        if (symbol) {
            setMaPeriod(initialMaPeriod === 200 ? 100 : initialMaPeriod);
        }
    }, [symbol, initialMaPeriod]);

    const fetchHistory = useCallback(async () => {
        if (!symbol) return;

        setIsLoading(true);
        try {
            const response = await ScoreAPI.getHistory(symbol, {
                ma_period: maPeriod,
                range: timeRange,
            });
            setData(response.data);
        } catch (error) {
            console.error("Failed to fetch history:", error);
            toast.error("Không thể tải lịch sử score");
        } finally {
            setIsLoading(false);
        }
    }, [symbol, maPeriod, timeRange]);

    useEffect(() => {
        if (symbol) {
            fetchHistory();
        }
    }, [symbol, fetchHistory]);

    const chartData = data.map((item) => ({
        ...item,
        dateLabel: new Date(item.date).toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
        }),
    }));

    // Calculate min/max for better chart scaling
    const scores = data.map(d => d.score);
    const minScore = Math.min(...scores, 0);
    const maxScore = Math.max(...scores, 0);
    const padding = Math.max(Math.abs(maxScore - minScore) * 0.1, 1);

    return (
        <Dialog open={!!symbol} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-lg p-0 gap-0">
                <DialogHeader className="px-4 py-3 border-b border-border/40 shrink-0">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-sm font-bold flex items-center gap-2">
                            {symbol}
                            {isLoading && <RefreshCcw className="h-3 w-3 animate-spin text-muted-foreground" />}
                        </DialogTitle>
                    </div>

                    {/* Filters Row */}
                    <div className="flex items-center gap-2 mt-2">
                        {/* Time Range Buttons */}
                        <div className="flex items-center gap-0.5 bg-secondary/50 rounded-md p-0.5">
                            {TIME_RANGES.map(({ value, label }) => (
                                <Button
                                    key={value}
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setTimeRange(value)}
                                    className={cn(
                                        "h-6 px-2.5 text-[10px] font-medium rounded transition-all",
                                        timeRange === value
                                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                    )}
                                >
                                    {label}
                                </Button>
                            ))}
                        </div>

                        {/* MA Period Select */}
                        <Select value={String(maPeriod)} onValueChange={(val) => setMaPeriod(Number(val) as MAPeriod)}>
                            <SelectTrigger className="!h-[26px] !min-h-[26px] w-[70px] !text-[10px] font-medium bg-background border-border/60 focus:ring-0 !px-2 !py-0 [&_svg]:!size-3 !gap-0.5">
                                <SelectValue placeholder="MA" />
                            </SelectTrigger>
                            <SelectContent>
                                {MA_PERIODS_HISTORY.map((period) => (
                                    <SelectItem key={period} value={String(period)}>
                                        MA{period}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </DialogHeader>

                {/* Chart */}
                <div className="h-72 px-2 py-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                            Đang tải...
                        </div>
                    ) : data.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                            Không có dữ liệu
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="currentColor"
                                    className="text-border"
                                    opacity={0.3}
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="dateLabel"
                                    tick={{ fontSize: 9, fill: "currentColor" }}
                                    tickLine={false}
                                    axisLine={{ stroke: "currentColor", className: "text-border" }}
                                    className="text-muted-foreground"
                                    interval="preserveStartEnd"
                                />
                                <YAxis
                                    tick={{ fontSize: 10, fill: "currentColor" }}
                                    tickLine={false}
                                    axisLine={{ stroke: "currentColor", className: "text-border" }}
                                    tickFormatter={(val) => val.toFixed(1)}
                                    domain={[minScore - padding, maxScore + padding]}
                                    className="text-muted-foreground"
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "var(--color-popover)",
                                        border: "1px solid var(--color-border)",
                                        borderRadius: "8px",
                                        fontSize: "12px",
                                        color: "var(--color-popover-foreground)",
                                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                                    }}
                                    labelStyle={{ color: "var(--color-popover-foreground)", fontWeight: "bold" }}
                                    formatter={(value: number) => [
                                        <span key="val" style={{ color: value >= 0 ? "#00c076" : "#ff3a3a" }}>
                                            {value >= 0 ? "+" : ""}{value.toFixed(2)}
                                        </span>,
                                        "Score"
                                    ]}
                                    labelFormatter={(label) => `Ngày: ${label}`}
                                    cursor={{ fill: "var(--color-accent)", opacity: 0.3 }}
                                />
                                <ReferenceLine
                                    y={0}
                                    stroke="currentColor"
                                    className="text-muted-foreground"
                                    strokeDasharray="3 3"
                                    opacity={0.5}
                                />
                                <Bar dataKey="score" radius={[2, 2, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.score >= 0 ? "#00c076" : "#ff3a3a"}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Stats Footer */}
                {data.length > 0 && (
                    <div className="px-4 py-2 border-t border-border/40 bg-accent/5 flex items-center justify-between text-[10px] text-muted-foreground">
                        <div className="flex items-center gap-3">
                            <span>
                                Mới nhất:{" "}
                                <span className={cn(
                                    "font-mono font-medium",
                                    data[data.length - 1]?.score >= 0 ? "text-[#00c076]" : "text-[#ff3a3a]"
                                )}>
                                    {data[data.length - 1]?.score >= 0 ? "+" : ""}
                                    {data[data.length - 1]?.score.toFixed(2)}
                                </span>
                            </span>
                            <span>
                                Cao nhất:{" "}
                                <span className="font-mono font-medium text-[#00c076]">
                                    +{Math.max(...scores).toFixed(2)}
                                </span>
                            </span>
                            <span>
                                Thấp nhất:{" "}
                                <span className="font-mono font-medium text-[#ff3a3a]">
                                    {Math.min(...scores).toFixed(2)}
                                </span>
                            </span>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
