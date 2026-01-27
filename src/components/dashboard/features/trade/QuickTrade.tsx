"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Search, Star, Loader2, X, TrendingUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    TradingAPI,
    formatNumber,
    formatCurrency,
    formatVolume,
    formatPercent,
    getPriceColorClass,
    type PriceInfo,
    type WalletResponse,
    type PositionResponse,
} from "@/lib/trading-api";
import { usePriceStream } from "@/hooks/usePriceStream";
import { SymbolsAPI, type SymbolResponse } from "@/lib/symbols-api";
import { useAuth } from "@/lib/auth-context";

// ==================== Debounce Hook ====================
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
}

// ==================== Order Book Row Component ====================
interface OrderBookRowProps {
    price: number | null;
    volume: number | null;
    type: "bid" | "ask";
    refPrice: number | null;
    ceiling: number | null;
    floor: number | null;
    maxVolume: number;
    onClick?: (price: number) => void;
}

const OrderBookRow = ({
    price,
    volume,
    type,
    refPrice,
    ceiling,
    floor,
    maxVolume,
    onClick,
}: OrderBookRowProps) => {
    const volumePercent = volume && maxVolume ? (volume / maxVolume) * 100 : 0;
    const colorClass = getPriceColorClass(price, refPrice, ceiling, floor);
    const bgColor = type === "bid" ? "bg-[#00c076]/10" : "bg-[#ff3a3a]/10";

    return (
        <div
            className="relative flex items-center h-6 px-1.5 cursor-pointer hover:bg-secondary/40 transition-colors"
            onClick={() => price && onClick?.(price)}
        >
            {/* Volume bar background */}
            <div
                className={cn("absolute inset-y-0 h-full", bgColor)}
                style={{
                    width: `${Math.min(volumePercent, 100)}%`,
                    [type === "bid" ? "right" : "left"]: 0,
                }}
            />
            {/* Content */}
            <span
                className={cn(
                    "relative z-10 text-[11px] font-mono font-semibold flex-1",
                    type === "bid" ? "text-right pr-2" : "text-left pl-2",
                    colorClass
                )}
            >
                {formatNumber(price)}
            </span>
            <span
                className={cn(
                    "relative z-10 text-[10px] font-mono text-muted-foreground flex-1",
                    type === "bid" ? "text-left" : "text-right"
                )}
            >
                {formatVolume(volume)}
            </span>
        </div>
    );
};

// ==================== Quick Input Component ====================
interface QuickInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    suffix?: string;
    step?: number;
    min?: number;
    disabled?: boolean;
}

const QuickInput = ({
    label,
    value,
    onChange,
    step = 0.05,
    min = 0,
    disabled = false,
}: QuickInputProps) => {
    const handleStep = (direction: 1 | -1) => {
        const num = parseFloat(value) || 0;
        const newVal = Math.max(min, num + direction * step);
        onChange(step < 1 ? newVal.toFixed(2) : Math.round(newVal).toString());
    };

    return (
        <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground uppercase font-medium w-10 shrink-0">
                {label}
            </span>
            <button
                onClick={() => handleStep(-1)}
                disabled={disabled}
                className="w-6 h-6 flex items-center justify-center rounded border border-border/50 bg-secondary/50 hover:bg-secondary text-xs font-bold transition-colors disabled:opacity-50"
            >
                −
            </button>
            <div className="flex-1 relative">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    className="w-full h-6 bg-background border border-border/50 rounded px-2 text-[11px] text-center font-mono focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50"
                />
            </div>
            <button
                onClick={() => handleStep(1)}
                disabled={disabled}
                className="w-6 h-6 flex items-center justify-center rounded border border-border/50 bg-secondary/50 hover:bg-secondary text-xs font-bold transition-colors disabled:opacity-50"
            >
                +
            </button>
        </div>
    );
};

// ==================== Symbol Search Dropdown ====================
interface SymbolSearchProps {
    selectedSymbol: string;
    onSelect: (symbol: string, organName: string | null) => void;
}

const SymbolSearch = ({ selectedSymbol, onSelect }: SymbolSearchProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SymbolResponse[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const debouncedQuery = useDebounce(query, 300);

    // Search when debounced query changes
    useEffect(() => {
        if (!debouncedQuery || debouncedQuery.length < 1) {
            setResults([]);
            return;
        }

        const searchSymbols = async () => {
            setIsLoading(true);
            try {
                const data = await SymbolsAPI.search(debouncedQuery, 6, 'STOCK');
                setResults(data);
            } catch (error) {
                console.error("Search failed:", error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        };

        searchSymbols();
    }, [debouncedQuery]);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
                setQuery("");
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (item: SymbolResponse) => {
        onSelect(item.symbol, item.organ_short_name || item.organ_name);
        setIsOpen(false);
        setQuery("");
    };

    return (
        <div ref={containerRef} className="relative">
            {/* Selected/Search trigger */}
            <div
                className="flex items-center gap-2 h-8 px-2 bg-secondary/30 border border-border/50 rounded-md cursor-pointer hover:bg-secondary/50 transition-colors"
                onClick={() => {
                    setIsOpen(true);
                    setTimeout(() => inputRef.current?.focus(), 100);
                }}
            >
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                {isOpen ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Tìm mã CK..."
                        className="flex-1 bg-transparent text-sm font-medium focus:outline-none"
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <span className="flex-1 text-sm font-bold">{selectedSymbol}</span>
                )}
                {isOpen && query && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={(e) => {
                            e.stopPropagation();
                            setQuery("");
                        }}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                )}
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-xl z-50 overflow-hidden">
                    <ScrollArea className="max-h-[250px]">
                        {isLoading && (
                            <div className="flex items-center justify-center py-6">
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            </div>
                        )}

                        {!isLoading && results.length === 0 && query && (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                Không tìm thấy "{query}"
                            </div>
                        )}

                        {!isLoading && results.length === 0 && !query && (
                            <div className="p-3 space-y-2">
                                <p className="text-xs text-muted-foreground">Gợi ý:</p>
                                <div className="flex flex-wrap gap-1">
                                    {["VNM", "FPT", "VCB", "ACB", "HPG"].map((code) => (
                                        <Badge
                                            key={code}
                                            variant="secondary"
                                            className="cursor-pointer hover:bg-primary/20"
                                            onClick={() => setQuery(code)}
                                        >
                                            {code}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!isLoading && results.length > 0 && (
                            <div className="p-1">
                                {results.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => handleSelect(item)}
                                        className="w-full flex items-center gap-2 px-2 py-2 rounded hover:bg-accent transition-colors text-left"
                                    >
                                        <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10 text-primary shrink-0">
                                            <TrendingUp className="h-3.5 w-3.5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-bold text-xs">
                                                    {item.symbol}
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className="text-[9px] px-1 py-0 h-4"
                                                >
                                                    {item.exchange}
                                                </Badge>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground truncate">
                                                {item.organ_short_name || item.organ_name}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>
            )}
        </div>
    );
};

// ==================== Main QuickTrade Component ====================

interface QuickTradeProps {
    symbol?: string;
}

export function QuickTrade({ symbol: propSymbol }: QuickTradeProps) {
    const { symbol: routeSymbol } = useParams<{ symbol?: string }>();

    // Symbol state - prioritize prop > route > default
    const [selectedSymbol, setSelectedSymbol] = useState("ACB");
    const [organName, setOrganName] = useState<string | null>("Ngân hàng TMCP Á Châu");

    // Sync symbol from prop or route
    useEffect(() => {
        const newSymbol = propSymbol || routeSymbol?.toUpperCase();
        if (newSymbol && newSymbol !== selectedSymbol) {
            setSelectedSymbol(newSymbol);
            setOrganName(null); // Will be fetched by price stream
        }
    }, [propSymbol, routeSymbol]);

    // Order form state
    const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");
    const [orderType, setOrderType] = useState<"LIMIT" | "MARKET">("LIMIT");
    const [price, setPrice] = useState("");
    const [volume, setVolume] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Use price stream hook - fetches once, then streams during trading hours
    const {
        priceInfo,
        isLoading: isLoadingPrice,
        error: priceError,
    } = usePriceStream({ symbol: selectedSymbol });

    // API data state for wallet/positions  
    const [wallet, setWallet] = useState<WalletResponse | null>(null);
    const [positions, setPositions] = useState<PositionResponse[]>([]);
    const [isActivating, setIsActivating] = useState(false);

    // Check if user is authenticated using reactive hook
    const { isAuthenticated } = useAuth();

    // Set default price when priceInfo changes
    const prevPriceInfoRef = useRef<PriceInfo | null>(null);
    useEffect(() => {
        if (priceInfo && priceInfo !== prevPriceInfoRef.current) {
            // Only set price on initial load or symbol change
            if (!prevPriceInfoRef.current || prevPriceInfoRef.current.symbol !== priceInfo.symbol) {
                if (priceInfo.price) {
                    setPrice(priceInfo.price.toString());
                } else if (priceInfo.ref_price) {
                    setPrice(priceInfo.ref_price.toString());
                }
                // Update organ name from price info
                if (priceInfo.organ_name) {
                    setOrganName(priceInfo.organ_name);
                }
            }
            prevPriceInfoRef.current = priceInfo;
        }
    }, [priceInfo]);

    // Function to fetch wallet and positions
    const fetchAccountData = useCallback(async () => {
        if (!isAuthenticated) return;

        try {
            const [walletData, positionsData] = await Promise.all([
                TradingAPI.getWallet(),
                TradingAPI.getPositions(),
            ]);
            setWallet(walletData);
            setPositions(positionsData.data);
        } catch (error) {
            console.error("Failed to fetch account data:", error);
        }
    }, [isAuthenticated]);

    // Fetch wallet and positions when authenticated
    useEffect(() => {
        fetchAccountData();
    }, [fetchAccountData]);

    // Get position for selected symbol (for sell)
    const currentPosition = useMemo(() => {
        return positions.find((p) => p.symbol === selectedSymbol);
    }, [positions, selectedSymbol]);

    // Computed values
    const orderValue = useMemo(() => {
        const p = parseFloat(price) || 0;
        const v = parseFloat(volume) || 0;
        return p * v * 1000; // price in thousands (VND)
    }, [price, volume]);

    const maxBuyVolume = useMemo(() => {
        if (!wallet || !price) return 0;
        const p = parseFloat(price) || 1;
        const available = parseFloat(wallet.available) || 0;
        // Account for 0.1% fee
        const effectiveAvailable = available / 1.001;
        return Math.floor(effectiveAvailable / (p * 1000));
    }, [price, wallet]);

    const maxSellVolume = useMemo(() => {
        if (!currentPosition) return 0;
        return parseInt(currentPosition.available_quantity) || 0;
    }, [currentPosition]);

    const maxVolume = activeTab === "buy" ? maxBuyVolume : maxSellVolume;

    // Calculate max volume for order book visualization
    const maxOrderBookVolume = useMemo(() => {
        if (!priceInfo) return 1;
        const volumes = [
            priceInfo.bid_1_volume,
            priceInfo.bid_2_volume,
            priceInfo.bid_3_volume,
            priceInfo.ask_1_volume,
            priceInfo.ask_2_volume,
            priceInfo.ask_3_volume,
        ].filter((v): v is number => v !== null);
        return Math.max(...volumes, 1);
    }, [priceInfo]);

    // Handlers
    const handleSymbolSelect = useCallback((symbol: string, name: string | null) => {
        setSelectedSymbol(symbol);
        setOrganName(name);
        setVolume(""); // Reset volume when changing symbol
    }, []);

    const handlePriceClick = useCallback((clickedPrice: number) => {
        setPrice(clickedPrice.toString());
    }, []);

    const handleVolumePercent = useCallback(
        (percent: number) => {
            const vol = Math.floor(maxVolume * (percent / 100));
            // Round to nearest 100 for standard lot
            const roundedVol = Math.floor(vol / 100) * 100;
            setVolume(roundedVol > 0 ? roundedVol.toString() : "");
        },
        [maxVolume]
    );

    const handleSubmit = async () => {
        if (!isAuthenticated) {
            toast.error("Vui lòng đăng nhập để giao dịch");
            return;
        }

        if (!price || !volume) {
            toast.error("Vui lòng nhập đầy đủ giá và khối lượng");
            return;
        }

        const qty = parseInt(volume);
        if (isNaN(qty) || qty < 100) {
            toast.error("Khối lượng tối thiểu là 100 CP");
            return;
        }

        if (qty % 100 !== 0) {
            toast.error("Khối lượng phải là bội số của 100");
            return;
        }

        setIsSubmitting(true);

        try {
            const orderSide = activeTab === "buy" ? "BUY" : "SELL";

            const response = await TradingAPI.placeOrder({
                symbol: selectedSymbol,
                side: orderSide,
                type: orderType,
                quantity: qty,
                limit_price: orderType === "LIMIT" ? parseFloat(price) : undefined,
            });

            toast.success(
                `Đặt lệnh ${orderSide === "BUY" ? "MUA" : "BÁN"} ${selectedSymbol} thành công`,
                {
                    description: `${qty} CP @ ${orderType === "LIMIT" ? price : "Thị trường"} - Mã lệnh: ${response.order.id}`,
                }
            );

            setVolume("");

            // Refresh wallet and positions after successful order
            await fetchAccountData();
        } catch (error: any) {
            console.error("Order failed:", error);

            // Extract detailed error message
            let errTitle = "Đặt lệnh thất bại";
            let errDescription = "";

            if (error.response?.data?.detail) {
                const detail = error.response.data.detail;

                // Handle validation errors (array format from FastAPI)
                if (Array.isArray(detail)) {
                    errDescription = detail.map((d: { msg: string }) => d.msg).join(", ");
                } else if (typeof detail === "string") {
                    // Check for specific error types
                    if (detail.includes("Insufficient balance")) {
                        errTitle = "Không đủ số dư";
                        errDescription = detail;
                    } else if (detail.includes("Insufficient position")) {
                        errTitle = "Không đủ cổ phiếu";
                        errDescription = detail;
                    } else if (detail.includes("Market price not found")) {
                        errTitle = "Không có giá thị trường";
                        errDescription = `Không lấy được giá của ${selectedSymbol}`;
                    } else {
                        errDescription = detail;
                    }
                }
            } else if (error.message) {
                errDescription = error.message;
            }

            toast.error(errTitle, {
                description: errDescription || "Vui lòng thử lại sau",
                duration: 5000,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle account activation (grant initial cash)
    const handleActivateAccount = async () => {
        setIsActivating(true);
        try {
            const response = await TradingAPI.grantInitialCash();
            if (response.granted) {
                toast.success("Kích hoạt thành công!", {
                    description: response.message,
                });
                // Refresh wallet data
                await fetchAccountData();
            } else {
                toast.info(response.message);
            }
        } catch (error: any) {
            console.error("Activation failed:", error);
            const errMsg = error.response?.data?.detail || "Kích hoạt thất bại";
            toast.error(errMsg);
        } finally {
            setIsActivating(false);
        }
    };

    // Check if account needs activation (no initial cash granted)
    const needsActivation = isAuthenticated && wallet && !wallet.first_grant_at;

    // Get price color
    const currentPriceColor = priceInfo
        ? getPriceColorClass(
            priceInfo.price,
            priceInfo.ref_price,
            priceInfo.ceiling,
            priceInfo.floor
        )
        : "text-foreground";

    return (
        <div className="flex flex-col h-full w-full border-l border-border/40 bg-background/50">
            {/* Header - Symbol Search */}
            <div className="px-2.5 py-2 border-b border-border/40 space-y-1.5">
                <div className="flex items-center gap-2">
                    <div className="flex-1">
                        <SymbolSearch
                            selectedSymbol={selectedSymbol}
                            onSelect={handleSymbolSelect}
                        />
                    </div>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-yellow-400"
                                >
                                    <Star className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Theo dõi</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                {/* Price display */}
                {isLoadingPrice ? (
                    <div className="flex items-center gap-2 py-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">Đang tải...</span>
                    </div>
                ) : priceError ? (
                    <div className="flex items-center gap-2 py-2 text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">{priceError}</span>
                    </div>
                ) : priceInfo ? (
                    <>
                        <div className="flex items-baseline gap-2">
                            <span className={cn("text-xl font-bold font-mono", currentPriceColor)}>
                                {formatNumber(priceInfo.price)}
                            </span>
                            <div className="flex items-center gap-1.5">
                                <span className={cn("text-[11px] font-mono font-semibold", currentPriceColor)}>
                                    {priceInfo.change && priceInfo.change > 0 ? "+" : ""}
                                    {formatNumber(priceInfo.change)}
                                </span>
                                <span className={cn("text-[10px] font-mono", currentPriceColor)}>
                                    ({formatPercent(priceInfo.change_percent)})
                                </span>
                            </div>
                        </div>
                        {/* Company name */}
                        <p className="text-[10px] text-muted-foreground truncate">{organName}</p>
                        {/* Reference prices */}
                        <div className="flex items-center gap-3">
                            <span className="text-[10px]">
                                <span className="text-muted-foreground">T: </span>
                                <span className="text-[#b02bfe] font-mono font-semibold">
                                    {formatNumber(priceInfo.ceiling)}
                                </span>
                            </span>
                            <span className="text-[10px]">
                                <span className="text-muted-foreground">TC: </span>
                                <span className="text-[#f8a500] font-mono font-semibold">
                                    {formatNumber(priceInfo.ref_price)}
                                </span>
                            </span>
                            <span className="text-[10px]">
                                <span className="text-muted-foreground">S: </span>
                                <span className="text-[#00c5c5] font-mono font-semibold">
                                    {formatNumber(priceInfo.floor)}
                                </span>
                            </span>
                        </div>
                    </>
                ) : null}
            </div>

            {/* Order Book - 3 levels bid/ask */}
            {priceInfo && (
                <div className="border-b border-border/40">
                    <div className="flex items-center px-2 py-1 bg-secondary/20">
                        <span className="flex-1 text-[9px] uppercase text-muted-foreground font-medium text-right pr-2">
                            Mua
                        </span>
                        <span className="flex-1 text-[9px] uppercase text-muted-foreground font-medium text-left pl-2">
                            Bán
                        </span>
                    </div>
                    <div className="grid grid-cols-2">
                        {/* Bid side */}
                        <div className="border-r border-border/30">
                            <OrderBookRow
                                price={priceInfo.bid_1_price}
                                volume={priceInfo.bid_1_volume}
                                type="bid"
                                refPrice={priceInfo.ref_price}
                                ceiling={priceInfo.ceiling}
                                floor={priceInfo.floor}
                                maxVolume={maxOrderBookVolume}
                                onClick={handlePriceClick}
                            />
                            <OrderBookRow
                                price={priceInfo.bid_2_price}
                                volume={priceInfo.bid_2_volume}
                                type="bid"
                                refPrice={priceInfo.ref_price}
                                ceiling={priceInfo.ceiling}
                                floor={priceInfo.floor}
                                maxVolume={maxOrderBookVolume}
                                onClick={handlePriceClick}
                            />
                            <OrderBookRow
                                price={priceInfo.bid_3_price}
                                volume={priceInfo.bid_3_volume}
                                type="bid"
                                refPrice={priceInfo.ref_price}
                                ceiling={priceInfo.ceiling}
                                floor={priceInfo.floor}
                                maxVolume={maxOrderBookVolume}
                                onClick={handlePriceClick}
                            />
                        </div>
                        {/* Ask side */}
                        <div>
                            <OrderBookRow
                                price={priceInfo.ask_1_price}
                                volume={priceInfo.ask_1_volume}
                                type="ask"
                                refPrice={priceInfo.ref_price}
                                ceiling={priceInfo.ceiling}
                                floor={priceInfo.floor}
                                maxVolume={maxOrderBookVolume}
                                onClick={handlePriceClick}
                            />
                            <OrderBookRow
                                price={priceInfo.ask_2_price}
                                volume={priceInfo.ask_2_volume}
                                type="ask"
                                refPrice={priceInfo.ref_price}
                                ceiling={priceInfo.ceiling}
                                floor={priceInfo.floor}
                                maxVolume={maxOrderBookVolume}
                                onClick={handlePriceClick}
                            />
                            <OrderBookRow
                                price={priceInfo.ask_3_price}
                                volume={priceInfo.ask_3_volume}
                                type="ask"
                                refPrice={priceInfo.ref_price}
                                ceiling={priceInfo.ceiling}
                                floor={priceInfo.floor}
                                maxVolume={maxOrderBookVolume}
                                onClick={handlePriceClick}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Buy/Sell Tab Switcher */}
            <div className="px-2 pt-2">
                <div className="grid grid-cols-2 p-0.5 bg-secondary/30 rounded-md relative h-8">
                    <div
                        className={cn(
                            "absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded transition-all duration-200",
                            activeTab === "buy"
                                ? "left-0.5 bg-[#00c076]"
                                : "left-[calc(50%+1px)] bg-[#ff3a3a]"
                        )}
                    />
                    <button
                        onClick={() => setActiveTab("buy")}
                        className={cn(
                            "relative z-10 text-xs font-bold transition-colors",
                            activeTab === "buy" ? "text-white" : "text-muted-foreground"
                        )}
                    >
                        MUA
                    </button>
                    <button
                        onClick={() => setActiveTab("sell")}
                        className={cn(
                            "relative z-10 text-xs font-bold transition-colors",
                            activeTab === "sell" ? "text-white" : "text-muted-foreground"
                        )}
                    >
                        BÁN
                    </button>
                </div>
            </div>

            {/* Order Form */}
            <div className="flex-1 px-2 py-2 space-y-2 overflow-y-auto no-scrollbar">
                {/* Order Type - Button Group */}
                <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground uppercase font-medium w-10 shrink-0">
                        Lệnh
                    </span>
                    <div className="flex-1 grid grid-cols-2 p-0.5 bg-secondary/50 rounded-lg h-8 border border-border/50">
                        <button
                            type="button"
                            onClick={() => setOrderType("LIMIT")}
                            className={cn(
                                "flex items-center justify-center rounded-md text-[11px] font-bold transition-all",
                                orderType === "LIMIT"
                                    ? "bg-primary text-primary-foreground shadow-md"
                                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                            )}
                        >
                            Giới hạn
                        </button>
                        <button
                            type="button"
                            onClick={() => setOrderType("MARKET")}
                            className={cn(
                                "flex items-center justify-center rounded-md text-[11px] font-bold transition-all",
                                orderType === "MARKET"
                                    ? "bg-primary text-primary-foreground shadow-md"
                                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                            )}
                        >
                            Thị trường
                        </button>
                    </div>
                </div>

                {/* Price Input (only for LIMIT orders) */}
                {orderType === "LIMIT" && (
                    <QuickInput
                        label="Giá"
                        value={price}
                        onChange={setPrice}
                        step={0.05}
                        disabled={!priceInfo}
                    />
                )}

                {/* Volume Input */}
                <QuickInput
                    label="KL"
                    value={volume}
                    onChange={setVolume}
                    step={100}
                    min={100}
                    disabled={!priceInfo}
                />

                {/* Quick Volume Buttons */}
                <div className="grid grid-cols-4 gap-1">
                    {[25, 50, 75, 100].map((p) => (
                        <button
                            key={p}
                            onClick={() => handleVolumePercent(p)}
                            disabled={!isAuthenticated || maxVolume === 0}
                            className="h-5 text-[10px] font-medium rounded border border-border/40 bg-secondary/30 hover:bg-secondary hover:border-primary/40 transition-colors disabled:opacity-50"
                        >
                            {p}%
                        </button>
                    ))}
                </div>

                {/* Order Summary */}
                <div className="pt-1.5 space-y-1 border-t border-border/30">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] text-muted-foreground">Giá trị lệnh</span>
                        <span className="text-[11px] font-mono font-medium">
                            {formatCurrency(orderValue)}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] text-muted-foreground">Khả dụng</span>
                        <span className="text-[11px] font-mono text-primary font-semibold">
                            {isAuthenticated && wallet
                                ? formatCurrency(wallet.available)
                                : "—"}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] text-muted-foreground">
                            KL {activeTab === "buy" ? "mua" : "bán"} tối đa
                        </span>
                        <span className="text-[11px] font-mono text-muted-foreground">
                            {isAuthenticated
                                ? `${formatNumber(maxVolume)} CP`
                                : "—"}
                        </span>
                    </div>
                    {activeTab === "sell" && currentPosition && (
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-muted-foreground">Đang nắm giữ</span>
                            <span className="text-[11px] font-mono font-medium">
                                {formatNumber(parseInt(currentPosition.quantity))} CP
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Submit Button */}
            <div className="p-2 border-t border-border/40 bg-background/80">
                {!isAuthenticated ? (
                    <div className="text-center py-1">
                        <span className="text-xs text-muted-foreground">
                            Đăng nhập để giao dịch
                        </span>
                    </div>
                ) : needsActivation ? (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                            <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                            <p className="text-[10px] text-amber-600 dark:text-amber-400">
                                Kích hoạt tài khoản để nhận <span className="font-bold">1 tỷ VND</span> tiền ảo giao dịch
                            </p>
                        </div>
                        <Button
                            onClick={handleActivateAccount}
                            disabled={isActivating}
                            className="w-full h-9 font-bold text-sm bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20"
                        >
                            {isActivating ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                "Kích hoạt ngay"
                            )}
                        </Button>
                    </div>
                ) : (
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !volume || !price || !priceInfo}
                        className={cn(
                            "w-full h-9 font-bold text-sm shadow-md transition-all",
                            activeTab === "buy"
                                ? "bg-[#00c076] hover:bg-[#00a86b] shadow-green-500/20"
                                : "bg-[#ff3a3a] hover:bg-[#d93030] shadow-red-500/20",
                            "disabled:opacity-50"
                        )}
                    >
                        {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                {activeTab === "buy" ? "MUA" : "BÁN"} {selectedSymbol}
                            </>
                        )}
                    </Button>
                )}
            </div>
        </div>
    );
}
