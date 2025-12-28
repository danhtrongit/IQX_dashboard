"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, TrendingUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SymbolsAPI, type SymbolResponse } from "@/lib/symbols-api";

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

// Exchange badge color
const getExchangeColor = (exchange: string | null) => {
    switch (exchange?.toUpperCase()) {
        case "HOSE":
            return "bg-blue-500/15 text-blue-400 border-blue-500/30";
        case "HNX":
            return "bg-orange-500/15 text-orange-400 border-orange-500/30";
        case "UPCOM":
            return "bg-purple-500/15 text-purple-400 border-purple-500/30";
        default:
            return "bg-muted/50 text-muted-foreground border-border/50";
    }
};

// Type badge color
const getTypeColor = (type: string | null) => {
    switch (type?.toUpperCase()) {
        case "STOCK":
            return "bg-green-500/15 text-green-400 border-green-500/30";
        case "ETF":
            return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30";
        case "CW":
            return "bg-pink-500/15 text-pink-400 border-pink-500/30";
        case "BOND":
            return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
        default:
            return "bg-muted/50 text-muted-foreground border-border/50";
    }
};

export function StockSearch() {
    const [isFocused, setIsFocused] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SymbolResponse[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const debouncedQuery = useDebounce(query, 300);

    // Show dropdown when focused and has query or results
    const showDropdown = isFocused && (query.length > 0 || hasSearched);

    // Search when debounced query changes
    const searchSymbols = useCallback(async (searchQuery: string) => {
        if (!searchQuery || searchQuery.length < 1) {
            setResults([]);
            setHasSearched(false);
            return;
        }

        setIsLoading(true);
        setHasSearched(true);

        try {
            const data = await SymbolsAPI.search(searchQuery, 8, 'STOCK');
            setResults(data);
            setSelectedIndex(-1);
        } catch (error) {
            console.error("Search failed:", error);
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        searchSymbols(debouncedQuery);
    }, [debouncedQuery, searchSymbols]);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsFocused(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showDropdown || results.length === 0) return;

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
                break;
            case "ArrowUp":
                e.preventDefault();
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
                break;
            case "Enter":
                e.preventDefault();
                if (selectedIndex >= 0 && results[selectedIndex]) {
                    handleSelect(results[selectedIndex].symbol);
                }
                break;
            case "Escape":
                e.preventDefault();
                setIsFocused(false);
                inputRef.current?.blur();
                break;
        }
    };

    // Handle select
    const handleSelect = (symbol: string) => {
        setIsFocused(false);
        setQuery("");
        setResults([]);
        setHasSearched(false);
        navigate(`/co-phieu/${symbol}`);
    };

    // Handle clear
    const handleClear = () => {
        setQuery("");
        setResults([]);
        setHasSearched(false);
        inputRef.current?.focus();
    };

    return (
        <div ref={containerRef} className="relative">
            {/* Search Input with animation */}
            <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none z-10" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onKeyDown={handleKeyDown}
                    placeholder="Tìm mã CK..."
                    className={`
                        h-8 rounded-md bg-secondary/50 pl-8 pr-8 text-sm 
                        focus:outline-none focus:ring-1 focus:ring-ring 
                        transition-all duration-300 ease-out
                        hover:bg-secondary/70
                        ${isFocused ? "w-72 bg-secondary/70" : "w-40 sm:w-44"}
                    `}
                />
                {/* Clear button */}
                {query && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground hover:text-foreground"
                        onClick={handleClear}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                )}
                {/* Loading indicator */}
                {isLoading && (
                    <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground animate-spin" />
                )}
            </div>

            {/* Dropdown Results */}
            {showDropdown && (
                <div className="absolute top-full left-0 mt-1.5 w-72 rounded-xl border border-border bg-popover shadow-2xl z-[9999] overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-200">
                    <ScrollArea className="max-h-[400px]">
                        {/* Loading state */}
                        {isLoading && (
                            <div className="flex items-center justify-center py-10">
                                <Loader2 className="h-5 w-5 text-primary animate-spin" />
                                <span className="ml-2 text-sm text-muted-foreground">Đang tìm...</span>
                            </div>
                        )}

                        {/* Empty state */}
                        {!isLoading && hasSearched && results.length === 0 && (
                            <div className="py-10 text-center">
                                <Search className="h-10 w-10 mx-auto text-muted-foreground/30" />
                                <p className="mt-3 text-sm text-muted-foreground">
                                    Không tìm thấy "{query}"
                                </p>
                                <p className="text-xs text-muted-foreground/70 mt-1">
                                    Thử VNM, FPT, VCB...
                                </p>
                            </div>
                        )}

                        {/* Results */}
                        {!isLoading && results.length > 0 && (
                            <div className="p-1.5 pb-2">
                                {results.map((item, index) => (
                                    <button
                                        key={item.id}
                                        onClick={() => handleSelect(item.symbol)}
                                        className={`
                                            w-full grid grid-cols-[40px_1fr] gap-3 px-3 py-2.5 rounded-lg
                                            text-left transition-colors cursor-pointer
                                            ${selectedIndex === index
                                                ? "bg-accent"
                                                : "hover:bg-accent/50"
                                            }
                                        `}
                                    >
                                        {/* Stock icon */}
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                            <TrendingUp className="h-4 w-4" />
                                        </div>

                                        {/* Content */}
                                        <div className="min-w-0 flex flex-col justify-center gap-1">
                                            {/* Row 1: Symbol + Badges */}
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm text-foreground">
                                                    {item.symbol}
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[10px] px-1.5 py-0 h-[18px] font-semibold shrink-0 ${getExchangeColor(item.exchange)}`}
                                                >
                                                    {item.exchange || "N/A"}
                                                </Badge>
                                                {item.type && (
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-[10px] px-1.5 py-0 h-[18px] font-semibold shrink-0 ${getTypeColor(item.type)}`}
                                                    >
                                                        {item.type}
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* Row 2: Company name */}
                                            <p className="text-xs text-muted-foreground truncate">
                                                {item.organ_short_name || item.organ_name || "—"}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Hint when empty query */}
                        {!isLoading && !hasSearched && query.length === 0 && (
                            <div className="py-8 text-center">
                                <p className="text-sm text-muted-foreground">
                                    Nhập mã hoặc tên công ty
                                </p>
                                <div className="flex justify-center gap-2 mt-3">
                                    {["VNM", "FPT", "VCB", "HPG"].map((code) => (
                                        <Badge
                                            key={code}
                                            variant="secondary"
                                            className="cursor-pointer hover:bg-primary/20 transition-colors"
                                            onClick={() => {
                                                setQuery(code);
                                                inputRef.current?.focus();
                                            }}
                                        >
                                            {code}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </ScrollArea>
                </div>
            )}
        </div>
    );
}
