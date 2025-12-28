"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Search, RefreshCw, TrendingUp, TrendingDown, Minus, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { SymbolsAPI, type SymbolResponse } from "@/lib/symbols-api";
import { QuotesAPI, type PriceInfo, formatPrice, formatVolume, normalizePriceInfo } from "@/lib/trading-api";
import { isVietnamTradingHours } from "@/lib/price-stream-api";

// ==================== Types ====================
type Exchange = 'all' | 'HOSE' | 'HNX' | 'UPCOM';
type SortField = 'symbol' | 'price' | 'change_percent' | 'volume';
type SortOrder = 'asc' | 'desc';

interface PriceRow extends PriceInfo {
    flash?: 'up' | 'down' | null;
}

// ==================== Price Cell Component ====================
function PriceCell({
    value,
    refPrice,
    ceiling,
    floor,
    className = ""
}: {
    value: number | null;
    refPrice: number | null;
    ceiling: number | null;
    floor: number | null;
    className?: string;
}) {
    if (value == null) return <span className="text-muted-foreground">—</span>;

    const getColor = () => {
        if (ceiling && value >= ceiling) return "text-purple-500";
        if (floor && value <= floor) return "text-cyan-500";
        if (refPrice && value > refPrice) return "text-green-500";
        if (refPrice && value < refPrice) return "text-red-500";
        return "text-yellow-500";
    };

    return (
        <span className={cn("font-mono font-semibold", getColor(), className)}>
            {formatPrice(value)}
        </span>
    );
}

// ==================== Change Cell ====================
function ChangeCell({ price, refPrice }: { price: number | null; refPrice: number | null }) {
    if (price == null || refPrice == null) return <span className="text-muted-foreground">—</span>;

    const change = price - refPrice;
    const percent = (change / refPrice) * 100;
    const isUp = change > 0;
    const isDown = change < 0;

    return (
        <div className="flex flex-col items-end">
            <span className={cn(
                "font-mono text-xs font-semibold",
                isUp && "text-green-500",
                isDown && "text-red-500",
                !isUp && !isDown && "text-yellow-500"
            )}>
                {isUp ? '+' : ''}{formatPrice(change)}
            </span>
            <span className={cn(
                "font-mono text-[10px]",
                isUp && "text-green-500",
                isDown && "text-red-500",
                !isUp && !isDown && "text-yellow-500"
            )}>
                {isUp ? '+' : ''}{percent.toFixed(2)}%
            </span>
        </div>
    );
}

// ==================== Bid/Ask Stack ====================
function BidAskStack({
    prices,
    volumes,
    refPrice,
    ceiling,
    floor,
    type
}: {
    prices: (number | null)[];
    volumes: (number | null)[];
    refPrice: number | null;
    ceiling: number | null;
    floor: number | null;
    type: 'bid' | 'ask';
}) {
    const isBid = type === 'bid';

    return (
        <div className={cn("flex gap-2", isBid ? "flex-row-reverse" : "flex-row")}>
            {prices.map((price, i) => (
                <div key={i} className={cn(
                    "flex flex-col items-center min-w-[50px]",
                    isBid ? "text-right" : "text-left"
                )}>
                    <PriceCell
                        value={price}
                        refPrice={refPrice}
                        ceiling={ceiling}
                        floor={floor}
                        className="text-[11px]"
                    />
                    <span className="text-[10px] text-muted-foreground font-mono">
                        {volumes[i] != null ? formatVolume(volumes[i]! * 10) : '—'}
                    </span>
                </div>
            ))}
        </div>
    );
}

// ==================== Price Row ====================
function PriceRowItem({ data, onClick }: { data: PriceRow; onClick?: () => void }) {
    const rowRef = useRef<HTMLTableRowElement>(null);

    // Flash animation
    useEffect(() => {
        if (data.flash && rowRef.current) {
            rowRef.current.classList.add(`flash-${data.flash}`);
            const timer = setTimeout(() => {
                rowRef.current?.classList.remove(`flash-${data.flash}`);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [data.flash, data.price]);

    // Using correct field names from PriceInfo
    const bidPrices = [data.bid_1_price, data.bid_2_price, data.bid_3_price];
    const bidVolumes = [data.bid_1_volume, data.bid_2_volume, data.bid_3_volume];
    const askPrices = [data.ask_1_price, data.ask_2_price, data.ask_3_price];
    const askVolumes = [data.ask_1_volume, data.ask_2_volume, data.ask_3_volume];

    const isUp = data.change != null && data.change > 0;
    const isDown = data.change != null && data.change < 0;

    return (
        <tr
            ref={rowRef}
            onClick={onClick}
            className={cn(
                "border-b border-border/30 hover:bg-secondary/30 transition-colors cursor-pointer",
                "group"
            )}
        >
            {/* Symbol */}
            <td className="px-2 py-1.5 sticky left-0 bg-background/95 backdrop-blur z-10">
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "w-1 h-8 rounded-full",
                        isUp && "bg-green-500",
                        isDown && "bg-red-500",
                        !isUp && !isDown && "bg-yellow-500"
                    )} />
                    <div>
                        <span className="font-bold text-sm text-primary">{data.symbol}</span>
                    </div>
                </div>
            </td>

            {/* Ceiling */}
            <td className="px-2 py-1.5 text-center">
                <span className="text-[11px] font-mono text-purple-500">{formatPrice(data.ceiling)}</span>
            </td>

            {/* Floor */}
            <td className="px-2 py-1.5 text-center">
                <span className="text-[11px] font-mono text-cyan-500">{formatPrice(data.floor)}</span>
            </td>

            {/* Ref */}
            <td className="px-2 py-1.5 text-center">
                <span className="text-[11px] font-mono text-yellow-500">{formatPrice(data.ref_price)}</span>
            </td>

            {/* Bid Stack */}
            <td className="px-2 py-1.5">
                <BidAskStack
                    prices={bidPrices}
                    volumes={bidVolumes}
                    refPrice={data.ref_price}
                    ceiling={data.ceiling}
                    floor={data.floor}
                    type="bid"
                />
            </td>

            {/* Match Price */}
            <td className="px-2 py-1.5 text-center">
                <div className="flex flex-col items-center">
                    <PriceCell
                        value={data.price}
                        refPrice={data.ref_price}
                        ceiling={data.ceiling}
                        floor={data.floor}
                        className="text-base"
                    />
                    <span className="text-[10px] text-muted-foreground font-mono">
                        {data.volume != null ? formatVolume(data.volume * 10) : '—'}
                    </span>
                </div>
            </td>

            {/* Change */}
            <td className="px-2 py-1.5 text-right">
                <ChangeCell price={data.price} refPrice={data.ref_price} />
            </td>

            {/* Ask Stack */}
            <td className="px-2 py-1.5">
                <BidAskStack
                    prices={askPrices}
                    volumes={askVolumes}
                    refPrice={data.ref_price}
                    ceiling={data.ceiling}
                    floor={data.floor}
                    type="ask"
                />
            </td>

            {/* Total Volume */}
            <td className="px-2 py-1.5 text-right">
                <div className="flex flex-col items-end">
                    <span className="text-[11px] font-mono font-medium">
                        {data.volume != null ? formatVolume(data.volume) : '—'}
                    </span>
                    {data.foreign_buy_volume != null && data.foreign_sell_volume != null && (
                        <span className={cn(
                            "text-[10px] font-mono",
                            data.foreign_buy_volume > data.foreign_sell_volume ? "text-green-500" : "text-red-500"
                        )}>
                            NN: {formatVolume(data.foreign_buy_volume - data.foreign_sell_volume)}
                        </span>
                    )}
                </div>
            </td>
        </tr>
    );
}

// ==================== Main Price Board Page ====================
export function PriceBoardPage() {
    // State
    const [symbols, setSymbols] = useState<SymbolResponse[]>([]);
    const [priceData, setPriceData] = useState<Map<string, PriceRow>>(new Map());
    const [exchange, setExchange] = useState<Exchange>('HOSE');
    const [searchQuery, setSearchQuery] = useState("");
    const [sortField, setSortField] = useState<SortField>('symbol');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    const [isLoading, setIsLoading] = useState(true);
    const [isConnected, setIsConnected] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    // WebSocket ref
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Fetch symbols
    useEffect(() => {
        const fetchSymbols = async () => {
            try {
                const data = await SymbolsAPI.list({
                    exchange: exchange === 'all' ? undefined : exchange,
                    type: 'STOCK',
                    limit: 100,
                    is_active: true,
                });
                setSymbols(data.items);
            } catch (error) {
                console.error('Failed to fetch symbols:', error);
            }
        };
        fetchSymbols();
    }, [exchange]);

    // Fetch initial prices
    const fetchPrices = useCallback(async () => {
        if (symbols.length === 0) return;

        setIsLoading(true);
        try {
            const symbolCodes = symbols.map(s => s.symbol);
            // Fetch in batches of 50
            const batchSize = 50;
            const allPrices: PriceInfo[] = [];

            for (let i = 0; i < symbolCodes.length; i += batchSize) {
                const batch = symbolCodes.slice(i, i + batchSize);
                const response = await QuotesAPI.getPriceBoard(batch);
                if (response.data) {
                    allPrices.push(...response.data);
                }
            }

            const priceMap = new Map<string, PriceRow>();
            allPrices.forEach(p => {
                // Normalize to fill in missing ref_price, ceiling, floor
                const normalized = normalizePriceInfo(p);
                priceMap.set(normalized.symbol, { ...normalized, flash: null });
            });
            setPriceData(priceMap);
            setLastUpdate(new Date());
        } catch (error) {
            console.error('Failed to fetch prices:', error);
        } finally {
            setIsLoading(false);
        }
    }, [symbols]);

    useEffect(() => {
        fetchPrices();
    }, [fetchPrices]);

    // WebSocket connection for realtime updates
    const connectWebSocket = useCallback(() => {
        if (!isVietnamTradingHours()) {
            return;
        }

        if (wsRef.current?.readyState === WebSocket.OPEN) {
            return;
        }

        const symbolCodes = symbols.map(s => s.symbol).join(',');
        if (!symbolCodes) return;

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/v1/ws/prices?symbols=${symbolCodes}`;

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            setIsConnected(true);
            ws.send(JSON.stringify({ action: 'get_cached' }));
        };

        ws.onclose = () => {
            setIsConnected(false);
            if (isVietnamTradingHours()) {
                reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
            }
        };

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === 'price' && msg.data) {
                    updatePrice(msg.data);
                } else if (msg.type === 'cached_prices' && msg.data) {
                    Object.values(msg.data).forEach((p: any) => updatePrice(p));
                }
            } catch (e) {
                console.error('WS parse error:', e);
            }
        };
    }, [symbols]);

    const updatePrice = (wsData: any) => {
        setPriceData(prev => {
            const existing = prev.get(wsData.symbol);
            if (!existing) return prev;

            const oldPrice = existing.price;
            const newPrice = wsData.last_price;
            let flash: 'up' | 'down' | null = null;

            if (oldPrice != null && newPrice != null && newPrice !== oldPrice) {
                flash = newPrice > oldPrice ? 'up' : 'down';
            }

            const updated = new Map(prev);
            updated.set(wsData.symbol, {
                ...existing,
                price: newPrice ?? existing.price,
                change: wsData.change ?? existing.change,
                change_percent: wsData.change_percent ?? existing.change_percent,
                volume: wsData.total_volume ?? existing.volume,
                flash,
            });

            return updated;
        });
        setLastUpdate(new Date());
    };

    useEffect(() => {
        if (symbols.length > 0) {
            connectWebSocket();
        }
        return () => {
            if (wsRef.current) wsRef.current.close();
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        };
    }, [connectWebSocket, symbols]);

    // Filter and sort data
    const filteredData = useMemo(() => {
        let data = Array.from(priceData.values());

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toUpperCase();
            data = data.filter(d => d.symbol.includes(query));
        }

        // Sort
        data.sort((a, b) => {
            let aVal: any, bVal: any;
            switch (sortField) {
                case 'symbol': aVal = a.symbol; bVal = b.symbol; break;
                case 'price': aVal = a.price ?? 0; bVal = b.price ?? 0; break;
                case 'change_percent': aVal = a.change_percent ?? 0; bVal = b.change_percent ?? 0; break;
                case 'volume': aVal = a.volume ?? 0; bVal = b.volume ?? 0; break;
            }
            if (sortOrder === 'asc') return aVal > bVal ? 1 : -1;
            return aVal < bVal ? 1 : -1;
        });

        return data;
    }, [priceData, searchQuery, sortField, sortOrder]);

    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
    };

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold">Bảng giá</h1>

                    {/* Exchange Tabs */}
                    <Tabs value={exchange} onValueChange={(v) => setExchange(v as Exchange)}>
                        <TabsList className="h-8">
                            <TabsTrigger value="HOSE" className="text-xs px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                HOSE
                            </TabsTrigger>
                            <TabsTrigger value="HNX" className="text-xs px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                HNX
                            </TabsTrigger>
                            <TabsTrigger value="UPCOM" className="text-xs px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                UPCOM
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {/* Connection Status */}
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "w-2 h-2 rounded-full",
                            isConnected ? "bg-green-500 animate-pulse" : "bg-gray-500"
                        )} />
                        <span className="text-[10px] text-muted-foreground">
                            {isConnected ? "Live" : isVietnamTradingHours() ? "Connecting..." : "Offline"}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Tìm mã..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                            className="w-40 pl-8 h-8 text-sm"
                        />
                    </div>

                    {/* Refresh */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchPrices}
                        disabled={isLoading}
                        className="h-8"
                    >
                        <RefreshCw className={cn("h-4 w-4 mr-1.5", isLoading && "animate-spin")} />
                        Làm mới
                    </Button>

                    {/* Last Update */}
                    {lastUpdate && (
                        <span className="text-[10px] text-muted-foreground">
                            Cập nhật: {lastUpdate.toLocaleTimeString('vi-VN')}
                        </span>
                    )}
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 px-4 py-2 bg-secondary/20 border-b border-border/40">
                <span className="text-[10px] text-muted-foreground">Chú thích:</span>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-purple-500" />
                    <span className="text-[10px]">Trần</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-green-500" />
                    <span className="text-[10px]">Tăng</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-yellow-500" />
                    <span className="text-[10px]">Tham chiếu</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-red-500" />
                    <span className="text-[10px]">Giảm</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-cyan-500" />
                    <span className="text-[10px]">Sàn</span>
                </div>
            </div>

            {/* Price Table */}
            <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-background/95 backdrop-blur z-20 border-b border-border/40">
                            <tr className="text-muted-foreground text-[10px] uppercase">
                                <th className="px-2 py-2 text-left sticky left-0 bg-background/95 backdrop-blur">
                                    <button
                                        onClick={() => toggleSort('symbol')}
                                        className="flex items-center gap-1 hover:text-foreground"
                                    >
                                        Mã <ArrowUpDown className="h-3 w-3" />
                                    </button>
                                </th>
                                <th className="px-2 py-2 text-center w-14">Trần</th>
                                <th className="px-2 py-2 text-center w-14">Sàn</th>
                                <th className="px-2 py-2 text-center w-14">TC</th>
                                <th className="px-2 py-2 text-center min-w-[180px]">
                                    <span className="text-green-500">Mua (3 giá tốt nhất)</span>
                                </th>
                                <th className="px-2 py-2 text-center w-20">
                                    <button
                                        onClick={() => toggleSort('price')}
                                        className="flex items-center gap-1 hover:text-foreground mx-auto"
                                    >
                                        Khớp <ArrowUpDown className="h-3 w-3" />
                                    </button>
                                </th>
                                <th className="px-2 py-2 text-right w-20">
                                    <button
                                        onClick={() => toggleSort('change_percent')}
                                        className="flex items-center gap-1 hover:text-foreground ml-auto"
                                    >
                                        +/- <ArrowUpDown className="h-3 w-3" />
                                    </button>
                                </th>
                                <th className="px-2 py-2 text-center min-w-[180px]">
                                    <span className="text-red-500">Bán (3 giá tốt nhất)</span>
                                </th>
                                <th className="px-2 py-2 text-right w-24">
                                    <button
                                        onClick={() => toggleSort('volume')}
                                        className="flex items-center gap-1 hover:text-foreground ml-auto"
                                    >
                                        Tổng KL <ArrowUpDown className="h-3 w-3" />
                                    </button>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={9} className="py-8 text-center text-muted-foreground">
                                        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-8 text-center text-muted-foreground">
                                        Không tìm thấy dữ liệu
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map(row => (
                                    <PriceRowItem key={row.symbol} data={row} />
                                ))
                            )}
                        </tbody>
                    </table>
                </ScrollArea>
            </div>

            {/* Footer Stats */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-border/40 bg-secondary/20">
                <div className="flex items-center gap-4">
                    <span className="text-[11px] text-muted-foreground">
                        Hiển thị: <strong>{filteredData.length}</strong> / {priceData.size} mã
                    </span>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                        <span className="text-[11px] text-green-500 font-medium">
                            {filteredData.filter(d => d.change != null && d.change > 0).length}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Minus className="h-3.5 w-3.5 text-yellow-500" />
                        <span className="text-[11px] text-yellow-500 font-medium">
                            {filteredData.filter(d => d.change != null && d.change === 0).length}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                        <span className="text-[11px] text-red-500 font-medium">
                            {filteredData.filter(d => d.change != null && d.change < 0).length}
                        </span>
                    </div>
                </div>
            </div>

            {/* CSS for flash animation */}
            <style>{`
                @keyframes flashUp {
                    0%, 100% { background: transparent; }
                    50% { background: rgba(34, 197, 94, 0.2); }
                }
                @keyframes flashDown {
                    0%, 100% { background: transparent; }
                    50% { background: rgba(239, 68, 68, 0.2); }
                }
                .flash-up { animation: flashUp 0.5s ease; }
                .flash-down { animation: flashDown 0.5s ease; }
            `}</style>
        </div>
    );
}
