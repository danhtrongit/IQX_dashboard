"use client";

import { useEffect, useState } from "react";
import { Calendar, Gift, Users2, Scissors, FileText, ExternalLink, Loader2, Newspaper } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CompanyAPI, type EventsResponse, type NewsResponse } from "@/lib/stock-api";
import { cn } from "@/lib/utils";

interface EventsNewsTabProps {
    symbol: string;
}

// Format date


const formatShortDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit"
    });
};

// Get event icon based on event type
const getEventIcon = (eventType: string | null | undefined) => {
    const type = eventType?.toLowerCase() || "";
    if (type.includes("cổ tức") || type.includes("dividend")) {
        return <Gift className="h-3 w-3 text-[#00c076]" />;
    }
    if (type.includes("đại hội") || type.includes("agm") || type.includes("họp")) {
        return <Users2 className="h-3 w-3 text-blue-400" />;
    }
    if (type.includes("chia") || type.includes("tách") || type.includes("split")) {
        return <Scissors className="h-3 w-3 text-purple-400" />;
    }
    return <Calendar className="h-3 w-3 text-orange-400" />;
};

// Get event badge color
const getEventBadgeClass = (eventType: string | null | undefined): string => {
    const type = eventType?.toLowerCase() || "";
    if (type.includes("cổ tức") || type.includes("dividend")) {
        return "bg-[#00c076]/10 text-[#00c076] border-[#00c076]/20";
    }
    if (type.includes("đại hội") || type.includes("agm")) {
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    }
    if (type.includes("chia") || type.includes("tách")) {
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    }
    return "bg-orange-500/10 text-orange-400 border-orange-500/20";
};

type ViewType = 'events' | 'news';

const viewTabs: { id: ViewType; label: string; icon: React.ReactNode }[] = [
    { id: 'events', label: 'Sự kiện', icon: <Calendar className="h-3 w-3" /> },
    { id: 'news', label: 'Tin tức', icon: <Newspaper className="h-3 w-3" /> },
];

export function EventsNewsTab({ symbol }: EventsNewsTabProps) {
    const [events, setEvents] = useState<EventsResponse | null>(null);
    const [news, setNews] = useState<NewsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeView, setActiveView] = useState<ViewType>('events');

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [eventsRes, newsRes] = await Promise.allSettled([
                    CompanyAPI.getEvents(symbol),
                    CompanyAPI.getNews(symbol),
                ]);

                if (eventsRes.status === "fulfilled") setEvents(eventsRes.value);
                if (newsRes.status === "fulfilled") setNews(newsRes.value);
            } catch (err) {
                console.error("Failed to fetch events/news:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [symbol]);

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Đang tải...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/30 bg-secondary/20">
                {/* View Tabs */}
                <div className="flex items-center gap-1">
                    {viewTabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveView(tab.id)}
                            className={cn(
                                "flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-medium transition-all",
                                activeView === tab.id
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                            )}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                            <span className="text-[9px] font-mono text-muted-foreground">
                                ({tab.id === 'events' ? events?.data.length || 0 : news?.data.length || 0})
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
                {/* Events View */}
                {activeView === 'events' && (
                    <div className="divide-y divide-border/20">
                        {events && events.data.length > 0 ? (
                            events.data.map((event, idx) => (
                                <div
                                    key={idx}
                                    className="px-3 py-2.5 hover:bg-secondary/20 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-start gap-2">
                                        {/* Icon */}
                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-secondary/50 mt-0.5">
                                            {getEventIcon(event.event_list_name)}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            {/* Header */}
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <Badge
                                                    variant="outline"
                                                    className={cn("text-[9px] px-1.5 py-0 h-4 font-medium", getEventBadgeClass(event.event_list_name))}
                                                >
                                                    {event.event_list_name || "Sự kiện"}
                                                </Badge>
                                                {event.issue_date && (
                                                    <span className="text-[9px] text-muted-foreground font-mono">
                                                        {formatShortDate(event.issue_date)}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Title */}
                                            <h4 className="text-[11px] font-medium line-clamp-2 mb-1">
                                                {event.event_title || "—"}
                                            </h4>

                                            {/* Details */}
                                            <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
                                                {event.ratio !== null && event.ratio > 0 && (
                                                    <span className="font-mono">
                                                        Tỷ lệ: <span className="text-foreground">{event.ratio}%</span>
                                                    </span>
                                                )}
                                                {event.value !== null && event.value > 0 && (
                                                    <span className="font-mono">
                                                        Giá trị: <span className="text-[#00c076]">{new Intl.NumberFormat("vi-VN").format(event.value)}</span>
                                                    </span>
                                                )}
                                                {event.public_date && (
                                                    <span>
                                                        Công bố: {formatShortDate(event.public_date)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <Calendar className="h-10 w-10 mb-3 opacity-30" />
                                <p className="text-[11px]">Không có sự kiện nào</p>
                            </div>
                        )}
                    </div>
                )}

                {/* News View */}
                {activeView === 'news' && (
                    <div className="divide-y divide-border/20">
                        {news && news.data.length > 0 ? (
                            news.data.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="px-3 py-2.5 hover:bg-secondary/20 transition-colors cursor-pointer group"
                                    onClick={() => {
                                        if (item.news_source_link) {
                                            window.open(item.news_source_link, "_blank");
                                        }
                                    }}
                                >
                                    <div className="flex items-start gap-2">
                                        {/* Icon */}
                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-blue-500/10 mt-0.5">
                                            <FileText className="h-3 w-3 text-blue-400" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            {/* Date & Link */}
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[9px] text-muted-foreground font-mono">
                                                    {formatShortDate(item.public_date)}
                                                </span>
                                                {item.news_source_link && (
                                                    <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                                                )}
                                            </div>

                                            {/* Title */}
                                            <h4 className="text-[11px] font-medium line-clamp-2 group-hover:text-primary transition-colors mb-1">
                                                {item.news_title || "—"}
                                            </h4>

                                            {/* Summary */}
                                            {item.news_short_content && (
                                                <p className="text-[10px] text-muted-foreground line-clamp-2">
                                                    {item.news_short_content}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <Newspaper className="h-10 w-10 mb-3 opacity-30" />
                                <p className="text-[11px]">Không có tin tức nào</p>
                            </div>
                        )}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
