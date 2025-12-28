import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { ChevronDown, Star, TrendingDown, TrendingUp, Minus, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { isVietnamTradingHours } from "@/lib/price-stream-api";
import { QuotesAPI, normalizePriceInfo, type PriceInfo } from "@/lib/trading-api";
import { formatNumber as formatNum, formatCompact } from "@/lib/format";

// ==================== Types ====================
interface IndexData {
    index_code: string;
    index_value: number | null;
    change: number | null;
    change_percent: number | null;
    ref_value: number | null;
    open_value: number | null;
    high_value: number | null;
    low_value: number | null;
    total_volume: number | null;
    total_value: number | null;
    advances: number | null;
    declines: number | null;
    unchanged: number | null;
    foreign_buy_volume: number | null;
    foreign_sell_volume: number | null;
    foreign_net_volume: number | null;
}

interface MarketOverviewResponse {
    indices: IndexData[];
    timestamp: string;
}

interface SymbolSearchResult {
    symbol: string;
    organ_name?: string;
    organ_short_name?: string;
    exchange: string;
    type: string;
}

// Index symbols (exported for use in other components)
export const INDEX_SYMBOLS = ['VNINDEX', 'HNXINDEX', 'UPCOMINDEX', 'VN30'];

// Unified display data type (can be index or stock)
interface DisplayData {
    type: 'index' | 'stock';
    code: string;
    name?: string;
    value: number | null;
    change: number | null;
    change_percent: number | null;
    ref_value: number | null;
    open_value: number | null;
    high_value: number | null;
    low_value: number | null;
    total_volume: number | null;
    total_value: number | null;
    advances?: number | null;
    declines?: number | null;
    unchanged?: number | null;
    foreign_net?: number | null;
}

// ==================== Utility Functions ====================
const formatNumber = (value: number | null, decimals = 2): string => {
    if (value == null) return "—";
    return formatNum(value, decimals);
};

const formatVolume = (value: number | null): string => {
    if (value == null) return "—";
    return formatCompact(value);
};

const formatValue = (value: number | null): string => {
    if (value == null) return "—";
    return formatCompact(value, { vietnamese: true });
};

// ==================== Components ====================
const MarketMetric = ({ label, value, colorClass = "text-foreground" }: { label: string; value: string; colorClass?: string }) => (
    <div className="flex flex-col items-start justify-center px-4 border-r border-border/40 last:border-0 h-full">
        <span className="text-[10px] uppercase text-muted-foreground font-medium">{label}</span>
        <span className={cn("text-sm font-bold font-mono tracking-tight", colorClass)}>{value}</span>
    </div>
);

const IndexItem = ({ index, onClick, isSelected }: { index: IndexData; onClick?: () => void; isSelected?: boolean }) => {
    const isPositive = index.change != null && index.change > 0;
    const isNegative = index.change != null && index.change < 0;

    // Format display name
    const displayName = index.index_code
        .replace('VNINDEX', 'VNIDX')
        .replace('HNXINDEX', 'HNX')
        .replace('UPCOMINDEX', 'UPCOM');

    const changePercent = index.change_percent != null
        ? (index.change_percent > 0 ? '+' : '') + index.change_percent.toFixed(2) + '%'
        : '—';

    return (
        <div
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 px-3 py-1 border-r border-border/40 min-w-fit hover:bg-accent/30 cursor-pointer transition-colors group",
                isSelected && "bg-accent/40"
            )}
        >
            <span className="font-bold text-xs group-hover:text-primary transition-colors min-w-[50px]">
                {displayName}
            </span>
            <span className={cn(
                "font-mono text-xs font-medium",
                isPositive && "text-[#00c076]",
                isNegative && "text-[#ff3a3a]",
                !isPositive && !isNegative && "text-[#f8a500]"
            )}>
                {formatNumber(index.index_value)}
            </span>
            <div className={cn(
                "flex items-center text-[10px] font-medium",
                isPositive && "text-[#00c076]",
                isNegative && "text-[#ff3a3a]",
                !isPositive && !isNegative && "text-[#f8a500]"
            )}>
                {isPositive && <TrendingUp className="h-3 w-3 mr-0.5" />}
                {isNegative && <TrendingDown className="h-3 w-3 mr-0.5" />}
                {!isPositive && !isNegative && <Minus className="h-3 w-3 mr-0.5" />}
                {changePercent}
            </div>
            {/* Volume & Advances/Declines */}
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className="text-green-500">{index.advances ?? 0}↑</span>
                <span className="text-red-500">{index.declines ?? 0}↓</span>
                <span className="text-yellow-500">{index.unchanged ?? 0}•</span>
            </div>
        </div>
    );
};

// Convert IndexData to DisplayData
const indexToDisplay = (index: IndexData): DisplayData => ({
    type: 'index',
    code: index.index_code,
    value: index.index_value,
    change: index.change,
    change_percent: index.change_percent,
    ref_value: index.ref_value,
    open_value: index.open_value,
    high_value: index.high_value,
    low_value: index.low_value,
    total_volume: index.total_volume,
    total_value: index.total_value,
    advances: index.advances,
    declines: index.declines,
    unchanged: index.unchanged,
    foreign_net: index.foreign_net_volume,
});

// Convert PriceInfo to DisplayData
const priceToDisplay = (price: PriceInfo): DisplayData => ({
    type: 'stock',
    code: price.symbol,
    name: price.organ_name ?? undefined,
    value: price.price,
    change: price.change,
    change_percent: price.change_percent,
    ref_value: price.ref_price,
    open_value: price.open,
    high_value: price.high,
    low_value: price.low,
    total_volume: price.volume,
    total_value: price.value,
    foreign_net: price.foreign_buy_volume != null && price.foreign_sell_volume != null
        ? price.foreign_buy_volume - price.foreign_sell_volume
        : null,
});

// ==================== Symbol Search Component ====================
interface SymbolSearchProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (symbol: string, type: 'index' | 'stock') => void;
    indices: IndexData[];
}

const SymbolSearch = ({ isOpen, onClose, onSelect, indices }: SymbolSearchProps) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SymbolSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
        } else {
            setQuery('');
            setResults([]);
        }
    }, [isOpen]);

    const searchSymbols = async (q: string) => {
        if (!q.trim()) {
            setResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await api.get<SymbolSearchResult[]>('/symbols/search', {
                params: { q, limit: 20, type: 'STOCK' }
            });
            setResults(response.data);
        } catch (error) {
            console.error('Search error:', error);
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleInputChange = (value: string) => {
        setQuery(value);
        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }
        searchTimeout.current = setTimeout(() => searchSymbols(value), 300);
    };

    const handleSelect = (symbol: string, type: 'index' | 'stock') => {
        onSelect(symbol, type);
        onClose();
    };

    // Filter indices based on query
    const filteredIndices = indices.filter(idx =>
        idx.index_code.toLowerCase().includes(query.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="absolute top-full left-0 mt-1 w-80 bg-popover border border-border rounded-lg shadow-xl z-50 overflow-hidden">
            {/* Search Input */}
            <div className="flex items-center gap-2 p-2 border-b border-border">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder="Tìm mã CK, chỉ số..."
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                {query && (
                    <button onClick={() => { setQuery(''); setResults([]); }} className="text-muted-foreground hover:text-foreground">
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto">
                {/* Indices Section */}
                {filteredIndices.length > 0 && (
                    <div>
                        <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase bg-muted/50">
                            Chỉ số
                        </div>
                        {filteredIndices.map(idx => (
                            <button
                                key={idx.index_code}
                                onClick={() => handleSelect(idx.index_code, 'index')}
                                className="w-full flex items-center justify-between px-3 py-2 hover:bg-accent/50 transition-colors"
                            >
                                <div className="flex flex-col items-start">
                                    <span className="text-sm font-medium">{idx.index_code}</span>
                                    <span className="text-[10px] text-muted-foreground">
                                        {idx.index_code === 'VNINDEX' ? 'VN-Index - HOSE' :
                                         idx.index_code === 'HNXINDEX' ? 'HNX-Index - HNX' :
                                         idx.index_code === 'UPCOMINDEX' ? 'UPCOM-Index' :
                                         idx.index_code === 'VN30' ? 'VN30 Index' : ''}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className={cn(
                                        "text-sm font-mono",
                                        idx.change != null && idx.change > 0 ? "text-[#00c076]" :
                                        idx.change != null && idx.change < 0 ? "text-[#ff3a3a]" : "text-[#f8a500]"
                                    )}>
                                        {formatNumber(idx.index_value)}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* Stocks Section */}
                {results.length > 0 && (
                    <div>
                        <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase bg-muted/50">
                            Cổ phiếu
                        </div>
                        {results.map(item => (
                            <button
                                key={item.symbol}
                                onClick={() => handleSelect(item.symbol, 'stock')}
                                className="w-full flex items-center justify-between px-3 py-2 hover:bg-accent/50 transition-colors"
                            >
                                <div className="flex flex-col items-start">
                                    <span className="text-sm font-medium">{item.symbol}</span>
                                    <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                                        {item.organ_short_name || item.organ_name}
                                    </span>
                                </div>
                                <span className="text-[10px] text-muted-foreground">{item.exchange}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Loading */}
                {isSearching && (
                    <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                        Đang tìm kiếm...
                    </div>
                )}

                {/* No results */}
                {!isSearching && query && results.length === 0 && filteredIndices.length === 0 && (
                    <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                        Không tìm thấy kết quả
                    </div>
                )}

                {/* Empty state */}
                {!query && (
                    <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                        Nhập mã cổ phiếu hoặc chỉ số để tìm kiếm
                    </div>
                )}
            </div>
        </div>
    );
};

// ==================== Main Component ====================
export function MarketSummary() {
    const location = useLocation();
    const { symbol: routeSymbol } = useParams<{ symbol?: string }>();
    const navigate = useNavigate();

    const [indices, setIndices] = useState<IndexData[]>([]);
    const [stockData, setStockData] = useState<PriceInfo | null>(null);
    const [displayData, setDisplayData] = useState<DisplayData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);

    // Determine what to show based on route
    const isStockPage = location.pathname.startsWith('/co-phieu/') && routeSymbol;

    // Close search when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setIsSearchOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle symbol selection from search
    const handleSymbolSelect = (symbol: string, type: 'index' | 'stock') => {
        if (type === 'stock') {
            // Navigate to stock page
            navigate(`/co-phieu/${symbol}`);
        } else {
            // For index, update display and navigate to home if on stock page
            const index = indices.find(i => i.index_code === symbol);
            if (index) {
                setDisplayData(indexToDisplay(index));
            }
            if (isStockPage) {
                navigate('/');
            }
        }
        setIsSearchOpen(false);
    };

    // Fetch market overview (always needed for indices bar)
    const fetchMarketOverview = useCallback(async () => {
        try {
            const response = await api.get<MarketOverviewResponse>('/market/overview');
            setIndices(response.data.indices);

            // If not on stock page, set VNINDEX as display
            if (!isStockPage) {
                const vnindex = response.data.indices.find(i => i.index_code === 'VNINDEX');
                if (vnindex) {
                    setDisplayData(indexToDisplay(vnindex));
                }
            }
        } catch (error) {
            console.error('Failed to fetch market overview:', error);
        } finally {
            if (!isStockPage) setIsLoading(false);
        }
    }, [isStockPage]);

    // Fetch stock data when on stock page
    const fetchStockData = useCallback(async () => {
        if (!routeSymbol) return;

        setIsLoading(true);
        try {
            const response = await QuotesAPI.getPriceBoard([routeSymbol]);
            if (response.data && response.data.length > 0) {
                const normalized = normalizePriceInfo(response.data[0]);
                setStockData(normalized);
                setDisplayData(priceToDisplay(normalized));
            }
        } catch (error) {
            console.error('Failed to fetch stock data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [routeSymbol]);

    useEffect(() => {
        fetchMarketOverview();
    }, [fetchMarketOverview]);

    // Fetch stock data when on stock page, or reset when leaving
    useEffect(() => {
        if (isStockPage && routeSymbol) {
            fetchStockData();
        } else {
            // Reset to VNINDEX when not on stock page
            setStockData(null);
        }
    }, [isStockPage, routeSymbol, fetchStockData]);

    // Reset displayData to VNINDEX when leaving stock page and indices are loaded
    useEffect(() => {
        if (!isStockPage && indices.length > 0 && displayData?.type === 'stock') {
            const vnindex = indices.find(i => i.index_code === 'VNINDEX');
            if (vnindex) {
                setDisplayData(indexToDisplay(vnindex));
            }
        }
    }, [isStockPage, indices, displayData?.type]);

    // Select an index from the bar
    const selectIndex = (index: IndexData) => {
        setDisplayData(indexToDisplay(index));
    };

    // WebSocket for realtime updates
    useEffect(() => {
        if (!isVietnamTradingHours()) return;

        const connectWebSocket = () => {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const symbolsParam = isStockPage && routeSymbol ? `?symbols=${routeSymbol}` : '';
            const wsUrl = `${protocol}//${window.location.host}/api/v1/ws/prices${symbolsParam}`;

            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                ws.send(JSON.stringify({ action: 'get_indices' }));
                if (isStockPage && routeSymbol) {
                    ws.send(JSON.stringify({ action: 'subscribe', symbols: [routeSymbol] }));
                }
            };

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    if (msg.type === 'index' && msg.data) {
                        updateIndex(msg.data);
                    } else if (msg.type === 'indices' && msg.data) {
                        Object.values(msg.data).forEach((idx: any) => updateIndex(idx));
                    } else if (msg.type === 'price' && msg.data && msg.data.symbol === routeSymbol) {
                        updateStock(msg.data);
                    }
                } catch (e) {
                    console.error('WS parse error:', e);
                }
            };

            ws.onclose = () => {
                if (isVietnamTradingHours()) {
                    setTimeout(connectWebSocket, 5000);
                }
            };
        };

        connectWebSocket();

        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, [isStockPage, routeSymbol]);

    const updateIndex = (wsData: any) => {
        const indexCode = wsData.index_id || wsData.index_code;
        if (!indexCode) return;

        setIndices(prev => prev.map(idx => {
            if (idx.index_code === indexCode) {
                return {
                    ...idx,
                    index_value: wsData.current_index ?? wsData.index_value ?? idx.index_value,
                    change: wsData.change ?? idx.change,
                    change_percent: wsData.percent_change ?? wsData.change_percent ?? idx.change_percent,
                    open_value: wsData.open_index ?? idx.open_value,
                    high_value: wsData.high_index ?? idx.high_value,
                    low_value: wsData.low_index ?? idx.low_value,
                    total_volume: wsData.volume ?? idx.total_volume,
                    total_value: wsData.value ?? idx.total_value,
                    advances: wsData.advances ?? idx.advances,
                    declines: wsData.declines ?? idx.declines,
                    unchanged: wsData.unchanged ?? idx.unchanged,
                };
            }
            return idx;
        }));

        // Update display if showing this index
        if (!isStockPage && displayData?.code === indexCode) {
            setDisplayData(prev => prev ? {
                ...prev,
                value: wsData.current_index ?? wsData.index_value ?? prev.value,
                change: wsData.change ?? prev.change,
                change_percent: wsData.percent_change ?? wsData.change_percent ?? prev.change_percent,
                open_value: wsData.open_index ?? prev.open_value,
                high_value: wsData.high_index ?? prev.high_value,
                low_value: wsData.low_index ?? prev.low_value,
                total_volume: wsData.volume ?? prev.total_volume,
                total_value: wsData.value ?? prev.total_value,
                advances: wsData.advances ?? prev.advances,
                declines: wsData.declines ?? prev.declines,
                unchanged: wsData.unchanged ?? prev.unchanged,
            } : prev);
        }
    };

    const updateStock = (wsData: any) => {
        if (!stockData) return;

        const updated: PriceInfo = {
            ...stockData,
            price: wsData.last_price ?? stockData.price,
            change: wsData.change ?? stockData.change,
            change_percent: wsData.change_percent ?? stockData.change_percent,
            volume: wsData.total_volume ?? stockData.volume,
            high: wsData.high ?? stockData.high,
            low: wsData.low ?? stockData.low,
        };

        setStockData(updated);
        setDisplayData(priceToDisplay(updated));
    };

    const isPositive = displayData?.change != null && displayData.change > 0;
    const isNegative = displayData?.change != null && displayData.change < 0;
    const changeColor = isPositive ? "text-[#00c076]" : isNegative ? "text-[#ff3a3a]" : "text-[#f8a500]";

    return (
        <div className="relative z-40 flex flex-col border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            {/* Top Row: Main metric display */}
            <div className="flex h-14 w-full items-center border-b border-border/40">
                {/* Symbol/Index Selector with Search */}
                <div 
                    ref={searchContainerRef}
                    className="relative flex items-center px-3 border-r border-border/40 h-full min-w-[180px] gap-2 hover:bg-accent/30 cursor-pointer transition-colors"
                    onClick={() => setIsSearchOpen(!isSearchOpen)}
                >
                    <Star className="h-4 w-4 text-muted-foreground hover:text-yellow-400 transition-colors" />
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                            <span className="font-bold text-sm">
                                {displayData?.code || 'VNINDEX'}
                            </span>
                            <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition-transform", isSearchOpen && "rotate-180")} />
                        </div>
                        {isLoading ? (
                            <span className="text-xs text-muted-foreground animate-pulse">Đang tải...</span>
                        ) : displayData ? (
                            <span className={cn("text-xs font-mono font-medium flex items-center gap-1", changeColor)}>
                                {formatNumber(displayData.value)}
                                <span className={cn("text-[10px] px-1 rounded",
                                    isPositive ? "bg-[#00c076]/10" :
                                        isNegative ? "bg-[#ff3a3a]/10" : "bg-[#f8a500]/10"
                                )}>
                                    {displayData.change != null ? (displayData.change > 0 ? '+' : '') + formatNumber(displayData.change) : '—'}
                                    ({displayData.change_percent != null ? (displayData.change_percent > 0 ? '+' : '') + displayData.change_percent.toFixed(2) + '%' : '—'})
                                </span>
                            </span>
                        ) : (
                            <span className="text-xs text-muted-foreground">Không có dữ liệu</span>
                        )}
                    </div>

                    {/* Search Dropdown */}
                    <SymbolSearch
                        isOpen={isSearchOpen}
                        onClose={() => setIsSearchOpen(false)}
                        onSelect={handleSymbolSelect}
                        indices={indices}
                    />
                </div>

                {/* Market Metrics Scrollable Area */}
                <div className="flex-1 flex items-center overflow-x-auto no-scrollbar h-full">
                    {displayData && (
                        <>
                            <MarketMetric
                                label="Tham chiếu"
                                value={formatNumber(displayData.ref_value)}
                                colorClass="text-[#f8a500]"
                            />
                            <MarketMetric
                                label="Mở cửa"
                                value={formatNumber(displayData.open_value)}
                                colorClass={
                                    displayData.open_value != null && displayData.ref_value != null
                                        ? displayData.open_value > displayData.ref_value
                                            ? "text-[#00c076]"
                                            : displayData.open_value < displayData.ref_value
                                                ? "text-[#ff3a3a]"
                                                : "text-[#f8a500]"
                                        : "text-foreground"
                                }
                            />
                            <MarketMetric
                                label="Thấp nhất"
                                value={formatNumber(displayData.low_value)}
                                colorClass="text-[#ff3a3a]"
                            />
                            <MarketMetric
                                label="Cao nhất"
                                value={formatNumber(displayData.high_value)}
                                colorClass="text-[#00c076]"
                            />
                            <MarketMetric
                                label="Khối lượng"
                                value={formatVolume(displayData.total_volume)}
                            />
                            <MarketMetric
                                label="Giá trị"
                                value={formatValue(displayData.total_value)}
                            />
                            <MarketMetric
                                label="NN Ròng"
                                value={formatVolume(displayData.foreign_net ?? null)}
                                colorClass={
                                    displayData.foreign_net != null
                                        ? displayData.foreign_net > 0
                                            ? "text-[#00c076]"
                                            : "text-[#ff3a3a]"
                                        : "text-foreground"
                                }
                            />
                            {/* Market Breadth - only for indices */}
                            {displayData.type === 'index' && displayData.advances != null && (
                                <div className="flex flex-col items-start justify-center px-4 border-r border-border/40 h-full">
                                    <span className="text-[10px] uppercase text-muted-foreground font-medium">Tăng/Giảm</span>
                                    <div className="flex items-center gap-1 text-sm font-bold font-mono">
                                        <span className="text-[#00c076]">{displayData.advances ?? 0}</span>
                                        <span className="text-muted-foreground">/</span>
                                        <span className="text-[#f8a500]">{displayData.unchanged ?? 0}</span>
                                        <span className="text-muted-foreground">/</span>
                                        <span className="text-[#ff3a3a]">{displayData.declines ?? 0}</span>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Bottom Row: Market Indices */}
            <div className="flex h-8 items-center bg-muted/20">
                <div className="flex items-center justify-center px-3 h-full bg-muted/40 border-r border-border/40">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Chỉ số</span>
                </div>
                <div className="flex-1 flex items-center overflow-x-auto no-scrollbar">
                    {isLoading && indices.length === 0 ? (
                        <div className="flex items-center gap-2 px-3 text-xs text-muted-foreground animate-pulse">
                            Đang tải chỉ số thị trường...
                        </div>
                    ) : indices.length > 0 ? (
                        <>
                            {indices.map((index) => (
                                <IndexItem
                                    key={index.index_code}
                                    index={index}
                                    onClick={() => selectIndex(index)}
                                    isSelected={!isStockPage && displayData?.code === index.index_code}
                                />
                            ))}
                            {/* Duplicate for seamless scroll effect */}
                            {indices.map((index) => (
                                <IndexItem
                                    key={`dup-${index.index_code}`}
                                    index={index}
                                    onClick={() => selectIndex(index)}
                                />
                            ))}
                        </>
                    ) : (
                        <div className="flex items-center gap-2 px-3 text-xs text-muted-foreground">
                            Không có dữ liệu chỉ số
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
