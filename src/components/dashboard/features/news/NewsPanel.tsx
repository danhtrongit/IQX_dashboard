"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Loader2, Newspaper, ExternalLink, Calendar, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

// ==================== Types ====================
interface NewsItem {
    news_title: string | null;
    news_short_content: string | null;
    public_date: string | null;
    news_source_link: string | null;
}

interface NewsResponse {
    symbol: string;
    data: NewsItem[];
}

// ==================== News Item Component ====================
interface NewsItemCardProps {
    item: NewsItem;
    symbol: string;
}

function NewsItemCard({ item, symbol }: NewsItemCardProps) {
    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateStr;
        }
    };

    const handleClick = () => {
        if (item.news_source_link) {
            window.open(item.news_source_link, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <div
            className={cn(
                "p-3 border-b border-border/30 transition-colors",
                item.news_source_link && "cursor-pointer hover:bg-secondary/30"
            )}
            onClick={handleClick}
        >
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Newspaper className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
                            {symbol}
                        </Badge>
                        {item.public_date && (
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                {formatDate(item.public_date)}
                            </span>
                        )}
                    </div>
                    <h3 className="text-sm font-medium leading-tight mb-1 line-clamp-2">
                        {item.news_title || 'Không có tiêu đề'}
                    </h3>
                    {item.news_short_content && (
                        <p className="text-[11px] text-muted-foreground line-clamp-2">
                            {item.news_short_content}
                        </p>
                    )}
                    {item.news_source_link && (
                        <div className="flex items-center gap-1 mt-1.5 text-[10px] text-primary">
                            <ExternalLink className="w-3 h-3" />
                            <span>Xem chi tiết</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ==================== News Panel ====================
export function NewsPanel() {
    const [searchQuery, setSearchQuery] = useState("");
    const [symbol, setSymbol] = useState("VNM"); // Default symbol
    const [news, setNews] = useState<NewsItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Suggested symbols for quick access
    const suggestedSymbols = ["VNM", "FPT", "VCB", "ACB", "HPG", "VIC"];

    const fetchNews = useCallback(async (sym: string) => {
        if (!sym) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await api.get<NewsResponse>(`/company/${sym}/news`);
            setNews(response.data.data || []);
            setSymbol(sym);
        } catch (err: any) {
            console.error('Failed to fetch news:', err);
            setError(err.response?.status === 404 ? 'Không tìm thấy mã' : 'Lỗi kết nối');
            setNews([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch news on mount
    useEffect(() => {
        fetchNews(symbol);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            fetchNews(searchQuery.trim().toUpperCase());
        }
    };

    const handleSuggestedClick = (sym: string) => {
        setSearchQuery(sym);
        fetchNews(sym);
    };

    const handleClearSearch = () => {
        setSearchQuery("");
    };

    return (
        <div className="flex flex-col h-full w-full border-l border-border/40 bg-background/50">
            {/* Header */}
            <div className="px-3 py-3 border-b border-border/40 space-y-2">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold flex items-center gap-2">
                        <Newspaper className="w-4 h-4 text-primary" />
                        Tin tức
                    </h2>
                    <Badge variant="secondary" className="text-[10px]">
                        {symbol}
                    </Badge>
                </div>

                {/* Search Form */}
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Nhập mã CK..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                            className="pl-8 pr-8 h-8 text-sm"
                        />
                        {searchQuery && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                                onClick={handleClearSearch}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        )}
                    </div>
                    <Button type="submit" size="sm" className="h-8 px-3">
                        Tìm
                    </Button>
                </form>

                {/* Quick Symbols */}
                <div className="flex flex-wrap gap-1">
                    {suggestedSymbols.map((sym) => (
                        <Badge
                            key={sym}
                            variant={sym === symbol ? "default" : "outline"}
                            className={cn(
                                "cursor-pointer text-[10px] px-2 py-0.5 transition-colors",
                                sym === symbol
                                    ? "bg-primary"
                                    : "hover:bg-secondary"
                            )}
                            onClick={() => handleSuggestedClick(sym)}
                        >
                            {sym}
                        </Badge>
                    ))}
                </div>
            </div>

            {/* News List */}
            <ScrollArea className="flex-1 h-0">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                ) : error ? (
                    <div className="text-center py-8">
                        <Newspaper className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                        <p className="text-sm text-muted-foreground">{error}</p>
                    </div>
                ) : news.length === 0 ? (
                    <div className="text-center py-8">
                        <Newspaper className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                        <p className="text-sm text-muted-foreground">
                            Không có tin tức cho {symbol}
                        </p>
                    </div>
                ) : (
                    <div>
                        {news.map((item, index) => (
                            <NewsItemCard
                                key={`${symbol}-${index}`}
                                item={item}
                                symbol={symbol}
                            />
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
