import { useState, useEffect, useCallback } from "react";
import { RefreshCcw, AlertCircle } from "lucide-react";
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
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";
import { MarketAPI, type IndexImpactStock, type ProprietaryStock, type ForeignNetStock, type MarketGroup } from "@/lib/market-api";

// Unified Stock Data Interface
interface StockData {
    symbol: string;
    value: number;
    name: string;
    price?: number;
    change?: number;
    exchange?: string;
}

// Convert API data to StockData format
const convertIndexImpact = (stocks: IndexImpactStock[]): StockData[] => {
    return stocks.map(s => ({
        symbol: s.symbol,
        value: s.impact || 0,
        name: s.organShortName || s.organName || s.symbol,
        price: s.matchPrice || undefined,
        change: s.refPrice && s.matchPrice ? ((s.matchPrice - s.refPrice) / s.refPrice) * 100 : undefined,
        exchange: s.exchange || undefined,
    }));
};

const convertProprietary = (stocks: ProprietaryStock[]): StockData[] => {
    return stocks.map(s => ({
        symbol: s.ticker,
        value: (s.totalValue || 0) / 1e9, // Convert to billions
        name: s.organShortName || s.organName || s.ticker,
        price: s.matchPrice || undefined,
        change: s.refPrice && s.matchPrice ? ((s.matchPrice - s.refPrice) / s.refPrice) * 100 : undefined,
        exchange: s.exchange || undefined,
    }));
};

const convertForeign = (stocks: ForeignNetStock[]): StockData[] => {
    return stocks.map(s => ({
        symbol: s.symbol,
        value: (s.net || 0) / 1e9, // Convert to billions
        name: s.organShortName || s.organName || s.symbol,
        price: s.matchPrice || undefined,
        change: s.refPrice && s.matchPrice ? ((s.matchPrice - s.refPrice) / s.refPrice) * 100 : undefined,
        exchange: s.exchange || undefined,
    }));
};

// Reusable Components
const TimeframeButton = ({ active, label, onClick }: { active: boolean, label: string, onClick: () => void }) => (
    <Button
        variant="ghost"
        onClick={onClick}
        className={cn(
            "h-5 min-h-[20px] text-[10px] font-medium px-2 py-0 rounded-sm transition-all",
            active
                ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
        )}
    >
        {label}
    </Button>
);

const StockTooltip = ({ stock }: { stock: StockData }) => (
    <div className="space-y-1">
        <div className="flex flex-col">
            <span className="text-sm font-bold">{stock.symbol}</span>
            <span className="text-[10px] text-muted-foreground uppercase">{stock.name}</span>
        </div>
        <div className="flex items-center gap-2 pt-1">
            <span className="text-lg font-bold font-mono">
                {stock.price?.toLocaleString()}
            </span>
            {stock.change !== undefined && (
                <span className={cn("text-xs font-bold", stock.change >= 0 ? "text-[#00c076]" : "text-[#ff3a3a]")}>
                    {stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)}%
                </span>
            )}
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/50">
            <span>Sàn</span>
            <span className="font-bold text-foreground">{stock.exchange}</span>
        </div>
    </div>
);

const CSSBarChart = ({
    leftData,
    rightData,
    type = 'value',
    isLoading = false
}: {
    leftData: StockData[],
    rightData: StockData[],
    type?: 'impact' | 'value',
    isLoading?: boolean
}) => {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <RefreshCcw className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (leftData.length === 0 && rightData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                <AlertCircle className="h-5 w-5" />
                <span className="text-xs">Không có dữ liệu</span>
            </div>
        );
    }

    // Find max value to normalize bars
    const maxVal = Math.max(
        ...leftData.map(d => Math.abs(d.value)),
        ...rightData.map(d => Math.abs(d.value)),
        1 // Prevent division by zero
    );

    const formatValue = (val: number) => {
        if (type === 'impact') return val.toFixed(2);
        // Format billions
        const absVal = Math.abs(val);
        if (absVal >= 1000) return `${(absVal / 1000).toFixed(1)}K`;
        return absVal.toFixed(1);
    };

    return (
        <div className="grid grid-cols-2 gap-4 h-full font-sans">
            {/* LEFT COLUMN: Positive/Buy */}
            <div className="flex flex-col w-full">
                <div className="flex justify-between items-center mb-2 px-1">
                    <span className="text-xs font-bold text-foreground w-12 text-left">
                        {type === 'impact' ? 'Tăng' : 'Mua ròng'}
                    </span>
                    <span className="w-10"></span>
                </div>
                <div className="flex flex-col gap-1.5 w-full">
                    {leftData.slice(0, 10).map((item, idx) => (
                        <div key={idx} className="flex items-center w-full group cursor-pointer hover:bg-accent/5 rounded-sm" onClick={() => toast.info(`${item.symbol}: ${item.name}`)}>
                            <div className="w-12 text-[10px] text-left font-medium text-[#00c076] shrink-0 font-mono pl-1">
                                {type === 'value' ? '+' : ''}{formatValue(item.value)}
                            </div>
                            <div className="flex-1 flex justify-end items-center h-full pr-2">
                                <HoverCard openDelay={0} closeDelay={0}>
                                    <HoverCardTrigger asChild>
                                        <div
                                            className="h-3 bg-[#00c076] rounded-l-sm transition-all group-hover:opacity-80"
                                            style={{ width: `${(Math.abs(item.value) / maxVal) * 100}%` }}
                                        />
                                    </HoverCardTrigger>
                                    <HoverCardContent side="top" className="w-48 p-3" sideOffset={-10}>
                                        <StockTooltip stock={item} />
                                    </HoverCardContent>
                                </HoverCard>
                            </div>
                            <div className="w-10 text-[11px] font-bold text-foreground shrink-0 leading-none text-right pr-1">
                                {item.symbol}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT COLUMN: Negative/Sell */}
            <div className="flex flex-col w-full">
                <div className="flex justify-between items-center mb-2 px-1">
                    <span className="w-10"></span>
                    <span className="text-xs font-bold text-foreground w-12 text-right">
                        {type === 'impact' ? 'Giảm' : 'Bán ròng'}
                    </span>
                </div>
                <div className="flex flex-col gap-1.5 w-full">
                    {rightData.slice(0, 10).map((item, idx) => (
                        <div key={idx} className="flex items-center w-full group cursor-pointer hover:bg-accent/5 rounded-sm" onClick={() => toast.info(`${item.symbol}: ${item.name}`)}>
                            <div className="w-10 text-[11px] font-bold text-foreground shrink-0 leading-none text-left pl-1">
                                {item.symbol}
                            </div>
                            <div className="flex-1 flex justify-start items-center h-full pl-2">
                                <HoverCard openDelay={0} closeDelay={0}>
                                    <HoverCardTrigger asChild>
                                        <div
                                            className="h-3 bg-[#ff3a3a] rounded-r-sm transition-all group-hover:opacity-80"
                                            style={{ width: `${(Math.abs(item.value) / maxVal) * 100}%` }}
                                        />
                                    </HoverCardTrigger>
                                    <HoverCardContent side="top" className="w-48 p-3" sideOffset={-10}>
                                        <StockTooltip stock={item} />
                                    </HoverCardContent>
                                </HoverCard>
                            </div>
                            <div className="w-12 text-[10px] text-right font-medium text-[#ff3a3a] shrink-0 font-mono pr-1">
                                {formatValue(item.value)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export function MarketLeaders() {
    const [timeframe, setTimeframe] = useState("1W");
    const [exchange, setExchange] = useState<MarketGroup>("ALL");
    const [isLoading, setIsLoading] = useState(false);

    // Data states
    const [indexImpact, setIndexImpact] = useState<{ gainers: StockData[], losers: StockData[] }>({ gainers: [], losers: [] });
    const [proprietary, setProprietary] = useState<{ buy: StockData[], sell: StockData[] }>({ buy: [], sell: [] });
    const [foreign, setForeign] = useState<{ buy: StockData[], sell: StockData[] }>({ buy: [], sell: [] });

    // Loading states
    const [loadingImpact, setLoadingImpact] = useState(false);
    const [loadingProp, setLoadingProp] = useState(false);
    const [loadingForeign, setLoadingForeign] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);

        // Fetch Index Impact
        setLoadingImpact(true);
        try {
            const impactData = await MarketAPI.getIndexImpact(exchange, timeframe);
            setIndexImpact({
                gainers: convertIndexImpact(impactData.topUp || []).sort((a, b) => b.value - a.value),
                losers: convertIndexImpact(impactData.topDown || []).sort((a, b) => a.value - b.value),
            });
        } catch (error) {
            console.error('Failed to fetch index impact:', error);
        } finally {
            setLoadingImpact(false);
        }

        // Fetch Proprietary Trading
        setLoadingProp(true);
        try {
            const propData = await MarketAPI.getTopProprietary(exchange, timeframe);
            setProprietary({
                buy: convertProprietary(propData.buy || []).sort((a, b) => b.value - a.value),
                sell: convertProprietary(propData.sell || []).sort((a, b) => a.value - b.value),
            });
        } catch (error) {
            console.error('Failed to fetch proprietary:', error);
        } finally {
            setLoadingProp(false);
        }

        // Fetch Foreign Trading
        setLoadingForeign(true);
        try {
            const foreignData = await MarketAPI.getForeignNetValue(exchange, timeframe);
            setForeign({
                buy: convertForeign(foreignData.netBuy || []).sort((a, b) => b.value - a.value),
                sell: convertForeign(foreignData.netSell || []).sort((a, b) => a.value - b.value),
            });
        } catch (error) {
            console.error('Failed to fetch foreign:', error);
        } finally {
            setLoadingForeign(false);
        }

        setIsLoading(false);
    }, [timeframe, exchange]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleFilterChange = (tf?: string, ex?: MarketGroup) => {
        if (tf) setTimeframe(tf);
        if (ex) setExchange(ex);
    };

    return (
        <div className="flex flex-col h-full w-full bg-background animate-in fade-in duration-300">
            {/* Unified Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/40 bg-accent/5 sticky top-0 z-20 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <h2 className="text-xs font-bold uppercase tracking-wide text-foreground flex items-center gap-2">
                        Cổ phiếu dẫn dắt thị trường
                        {isLoading && <RefreshCcw className="h-3 w-3 animate-spin text-muted-foreground" />}
                    </h2>

                    <div className="hidden md:flex items-center bg-secondary/40 rounded-md p-0.5 border border-border/40">
                        {['1D', '1W', '1M', '1Y', 'YTD'].map((tf) => (
                            <TimeframeButton
                                key={tf}
                                active={timeframe === tf}
                                label={tf === '1D' ? 'Hôm nay' : tf}
                                onClick={() => handleFilterChange(tf)}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Select value={exchange} onValueChange={(val) => handleFilterChange(undefined, val as MarketGroup)}>
                        <SelectTrigger className="!h-[26px] !min-h-[26px] w-[80px] !text-[10px] font-medium bg-background border-border/60 focus:ring-0 !px-2 !py-0 [&_svg]:!size-3 !gap-1">
                            <SelectValue placeholder="Sàn" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="HOSE">HOSE</SelectItem>
                            <SelectItem value="HNX">HNX</SelectItem>
                            <SelectItem value="UPCOME">UPCOM</SelectItem>
                            <SelectItem value="ALL">Tất cả</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={fetchData}
                        disabled={isLoading}
                    >
                        <RefreshCcw className={cn("h-3 w-3", isLoading && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {/* Charts Section */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-px bg-border/40 overflow-y-auto lg:overflow-hidden">

                {/* 1. Market Leaders - Index Impact */}
                <div className="bg-background/50 hover:bg-background/80 transition-colors p-3 flex flex-col gap-2 relative group">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2">Nhóm dẫn dắt thị trường</h3>
                    <div className="flex-1 w-full pl-2 pr-2">
                        <CSSBarChart
                            leftData={indexImpact.gainers}
                            rightData={indexImpact.losers}
                            type="impact"
                            isLoading={loadingImpact}
                        />
                    </div>
                    <div className="absolute inset-0 border border-primary/0 group-hover:border-primary/20 pointer-events-none transition-colors" />
                </div>

                {/* 2. Proprietary Trading (Tự Doanh) */}
                <div className="bg-background/50 hover:bg-background/80 transition-colors p-3 flex flex-col gap-2 relative group">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2">Tự doanh (tỷ VND)</h3>
                    <div className="flex-1 w-full pl-2 pr-2">
                        <CSSBarChart
                            leftData={proprietary.buy}
                            rightData={proprietary.sell}
                            type="value"
                            isLoading={loadingProp}
                        />
                    </div>
                    <div className="absolute inset-0 border border-primary/0 group-hover:border-primary/20 pointer-events-none transition-colors" />
                </div>

                {/* 3. Foreign Trading (Khối Ngoại) */}
                <div className="bg-background/50 hover:bg-background/80 transition-colors p-3 flex flex-col gap-2 relative group">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2">Khối ngoại (tỷ VND)</h3>
                    <div className="flex-1 w-full pl-2 pr-2">
                        <CSSBarChart
                            leftData={foreign.buy}
                            rightData={foreign.sell}
                            type="value"
                            isLoading={loadingForeign}
                        />
                    </div>
                    <div className="absolute inset-0 border border-primary/0 group-hover:border-primary/20 pointer-events-none transition-colors" />
                </div>
            </div>
        </div>
    );
}
