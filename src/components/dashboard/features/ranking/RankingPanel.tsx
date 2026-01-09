import { useState, useEffect, useCallback } from "react";
import { RefreshCcw } from "lucide-react";
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
import { ScoreAPI, type ScoreRankingItem, type MAPeriod, type SortOrder } from "@/lib/score-api";
import { RankingTable } from "./RankingTable";
import { ScoreHistoryModal } from "./ScoreHistoryModal";

const MA_PERIODS: MAPeriod[] = [5, 10, 20, 30, 50, 100, 200];

export function RankingPanel() {
    const [maPeriod, setMaPeriod] = useState<MAPeriod>(20);
    const [exchange, setExchange] = useState<string>("HOSE");
    const [sort, setSort] = useState<SortOrder>("desc");
    const [isLoading, setIsLoading] = useState(false);
    const [items, setItems] = useState<ScoreRankingItem[]>([]);
    const [total, setTotal] = useState(0);
    const [tradeDate, setTradeDate] = useState<string>("");

    // Modal state
    const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

    const fetchRanking = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await ScoreAPI.getRanking({
                ma_period: maPeriod,
                exchange: exchange === "ALL" ? undefined : exchange,
                limit: 50,
                sort,
            });
            setItems(response.items);
            setTotal(response.total);
            setTradeDate(response.trade_date);
        } catch (error) {
            console.error("Failed to fetch ranking:", error);
            toast.error("Không thể tải dữ liệu ranking");
        } finally {
            setIsLoading(false);
        }
    }, [maPeriod, exchange, sort]);

    useEffect(() => {
        fetchRanking();
    }, [fetchRanking]);

    const handleSymbolClick = (symbol: string) => {
        setSelectedSymbol(symbol);
    };

    return (
        <div className="flex flex-col h-full w-full bg-background animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col px-3 py-2 border-b border-border/40 bg-accent/5 sticky top-0 z-20 backdrop-blur-md gap-2">
                <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold uppercase tracking-wide text-foreground flex items-center gap-2 shrink-0">
                        Biến động
                        {isLoading && <RefreshCcw className="h-3 w-3 animate-spin text-muted-foreground" />}
                    </h2>

                    {/* Sort Toggle */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSort(sort === "desc" ? "asc" : "desc")}
                        className={cn(
                            "!h-[22px] !min-h-[22px] !px-2 !text-[10px] font-medium",
                            sort === "desc" ? "text-[#00c076]" : "text-[#ff3a3a]"
                        )}
                    >
                        {sort === "desc" ? "↑ Cao" : "↓ Thấp"}
                    </Button>
                </div>

                <div className="flex items-center gap-1.5">
                    {/* MA Period Select */}
                    <Select value={String(maPeriod)} onValueChange={(val) => setMaPeriod(Number(val) as MAPeriod)}>
                        <SelectTrigger className="!h-[24px] !min-h-[24px] w-[65px] !text-[10px] font-medium bg-background border-border/60 focus:ring-0 !px-2 !py-0 [&_svg]:!size-3 !gap-0.5">
                            <SelectValue placeholder="MA" />
                        </SelectTrigger>
                        <SelectContent>
                            {MA_PERIODS.map((period) => (
                                <SelectItem key={period} value={String(period)}>
                                    MA{period}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Exchange Select */}
                    <Select value={exchange} onValueChange={setExchange}>
                        <SelectTrigger className="!h-[24px] !min-h-[24px] w-[72px] !text-[10px] font-medium bg-background border-border/60 focus:ring-0 !px-2 !py-0 [&_svg]:!size-3 !gap-0.5">
                            <SelectValue placeholder="Sàn" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="HOSE">HOSE</SelectItem>
                            <SelectItem value="HNX">HNX</SelectItem>
                            <SelectItem value="UPCOM">UPCOM</SelectItem>
                            <SelectItem value="ALL">Tất cả</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Trade Date Info */}
                    {tradeDate && (
                        <span className="text-[9px] text-muted-foreground ml-auto">
                            {tradeDate} · {total} mã
                        </span>
                    )}
                </div>
            </div>

            {/* Ranking Table */}
            <div className="flex-1 overflow-hidden">
                <RankingTable
                    items={items}
                    isLoading={isLoading}
                    onSymbolClick={handleSymbolClick}
                />
            </div>

            {/* Score History Modal */}
            <ScoreHistoryModal
                symbol={selectedSymbol}
                maPeriod={maPeriod}
                onClose={() => setSelectedSymbol(null)}
            />
        </div>
    );
}
