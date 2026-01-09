import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ScoreRankingItem } from "@/lib/score-api";

interface RankingTableProps {
    items: ScoreRankingItem[];
    isLoading: boolean;
    onSymbolClick: (symbol: string) => void;
}

export function RankingTable({ items, isLoading, onSymbolClick }: RankingTableProps) {
    if (isLoading && items.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Đang tải...
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Không có dữ liệu
            </div>
        );
    }

    return (
        <ScrollArea className="h-full">
            <div className="divide-y divide-border/20">
                {items.map((item) => (
                    <div
                        key={item.symbol}
                        className="flex items-center px-3 py-2 hover:bg-accent/50 cursor-pointer transition-colors group"
                        onClick={() => onSymbolClick(item.symbol)}
                    >
                        {/* Rank */}
                        <div className="w-8 text-[10px] font-medium text-muted-foreground shrink-0">
                            #{item.rank}
                        </div>

                        {/* Symbol & Exchange */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                                    {item.symbol}
                                </span>
                                <span className="text-[9px] px-1 py-0.5 rounded bg-secondary text-muted-foreground font-medium">
                                    {item.exchange}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                                <span>Giá: <span className="font-mono">{Number(item.close).toLocaleString()}</span></span>
                                <span>|</span>
                                <span>MA: <span className="font-mono">{Number(item.ma).toLocaleString()}</span></span>
                            </div>
                        </div>

                        {/* Score & Metrics */}
                        <div className="flex flex-col items-end shrink-0">
                            <span
                                className={cn(
                                    "text-sm font-bold font-mono",
                                    item.score >= 0 ? "text-[#00c076]" : "text-[#ff3a3a]"
                                )}
                            >
                                {item.score >= 0 ? "+" : ""}{item.score.toFixed(2)}
                            </span>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                                <span className={cn(item.p >= 0 ? "text-[#00c076]" : "text-[#ff3a3a]")}>
                                    P: {item.p >= 0 ? "+" : ""}{item.p.toFixed(2)}%
                                </span>
                                <span>V: {item.v.toFixed(2)}x</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
}
