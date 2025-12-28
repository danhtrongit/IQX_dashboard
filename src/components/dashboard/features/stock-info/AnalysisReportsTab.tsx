"use client";

import { useEffect, useState, useCallback } from "react";
import {
    FileText,
    Download,
    ExternalLink,
    Loader2,
    TrendingUp,
    TrendingDown,
    Minus,
    Building2,
    Target,
    Calendar,
    ChevronLeft,
    ChevronRight,
    AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CompanyAPI, type AnalysisReportsResponse, type AnalysisReportItem } from "@/lib/stock-api";
import { cn } from "@/lib/utils";

interface AnalysisReportsTabProps {
    symbol: string;
}

// Recommendation badge configuration
const getRecommendConfig = (recommend: string | null) => {
    const rec = recommend?.toUpperCase() || "";
    if (rec.includes("MUA") || rec.includes("BUY") || rec.includes("OUTPERFORM")) {
        return {
            label: "MUA",
            icon: TrendingUp,
            className: "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20"
        };
    }
    if (rec.includes("BÁN") || rec.includes("SELL") || rec.includes("UNDERPERFORM")) {
        return {
            label: "BÁN",
            icon: TrendingDown,
            className: "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20"
        };
    }
    if (rec.includes("TRUNG LẬP") || rec.includes("NEUTRAL") || rec.includes("NẮM GIỮ") || rec.includes("HOLD")) {
        return {
            label: "TRUNG LẬP",
            icon: Minus,
            className: "bg-[#6B7280]/10 text-[#6B7280] border-[#6B7280]/20"
        };
    }
    return {
        label: recommend || "KHÁC",
        icon: AlertCircle,
        className: "bg-[#94A3B8]/10 text-[#94A3B8] border-[#94A3B8]/20"
    };
};

// Format target price
const formatPrice = (price: number | null): string => {
    if (!price) return "—";
    return new Intl.NumberFormat("vi-VN").format(price) + " ₫";
};

// Get source color (securities company branding)
const getSourceColor = (source: string | null): string => {
    const s = source?.toUpperCase() || "";
    if (s.includes("VIETCAP") || s.includes("VCSC")) return "text-blue-400";
    if (s.includes("HSC")) return "text-orange-400";
    if (s.includes("SSI")) return "text-purple-400";
    if (s.includes("VND") || s.includes("VNDS")) return "text-cyan-400";
    if (s.includes("MBS")) return "text-green-400";
    if (s.includes("KBSV")) return "text-red-400";
    if (s.includes("MAS")) return "text-amber-400";
    if (s.includes("TCBS")) return "text-rose-400";
    if (s.includes("FPTS")) return "text-lime-400";
    return "text-muted-foreground";
};

export function AnalysisReportsTab({ symbol }: AnalysisReportsTabProps) {
    const [reports, setReports] = useState<AnalysisReportsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const pageSize = 10;

    const fetchReports = useCallback(async (pageNum: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await CompanyAPI.getAnalysisReports(symbol, pageNum, pageSize);
            setReports(data);
        } catch (err) {
            console.error("Failed to fetch analysis reports:", err);
            setError("Không thể tải báo cáo phân tích");
        } finally {
            setIsLoading(false);
        }
    }, [symbol]);

    useEffect(() => {
        fetchReports(page);
    }, [fetchReports, page]);

    const totalPages = reports ? Math.ceil(reports.total / pageSize) : 0;

    // Pagination
    const handlePrevPage = () => {
        if (page > 0) setPage(page - 1);
    };

    const handleNextPage = () => {
        if (page < totalPages - 1) setPage(page + 1);
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Đang tải báo cáo phân tích...</span>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-2">
                    <AlertCircle className="h-8 w-8 text-destructive mx-auto opacity-50" />
                    <p className="text-sm text-muted-foreground">{error}</p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchReports(page)}
                        className="mt-2"
                    >
                        Thử lại
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header with stats */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/30 bg-secondary/20">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-primary" />
                        <span className="text-[11px] font-semibold text-foreground">
                            Báo cáo phân tích
                        </span>
                    </div>

                    {/* Summary stats */}
                    {reports && reports.total > 0 && (
                        <div className="hidden sm:flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span className="h-3 w-px bg-border/50" />
                            <span className="font-mono">{reports.total}</span>
                            <span>báo cáo</span>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={handlePrevPage}
                            disabled={page === 0}
                        >
                            <ChevronLeft className="h-3 w-3" />
                        </Button>
                        <span className="text-[10px] font-mono text-muted-foreground min-w-[40px] text-center">
                            {page + 1}/{totalPages}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={handleNextPage}
                            disabled={page >= totalPages - 1}
                        >
                            <ChevronRight className="h-3 w-3" />
                        </Button>
                    </div>
                )}
            </div>

            {/* Reports list */}
            <ScrollArea className="flex-1">
                {reports && reports.data.length > 0 ? (
                    <div className="divide-y divide-border/20">
                        {reports.data.map((report) => (
                            <ReportCard key={report.id} report={report} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <FileText className="h-12 w-12 mb-4 opacity-20" />
                        <p className="text-sm">Chưa có báo cáo phân tích</p>
                        <p className="text-[11px] mt-1 opacity-60">
                            Các CTCK sẽ cập nhật báo cáo khi có phân tích mới
                        </p>
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}

// Report card component
function ReportCard({ report }: { report: AnalysisReportItem }) {
    const recommendConfig = getRecommendConfig(report.recommend);
    const RecommendIcon = recommendConfig.icon;

    const handleOpenPdf = () => {
        if (report.attached_link) {
            window.open(report.attached_link, "_blank");
        }
    };

    return (
        <div
            className="px-3 py-3 hover:bg-secondary/30 transition-all duration-200 cursor-pointer group"
            onClick={handleOpenPdf}
        >
            <div className="flex gap-3">
                {/* Left: Recommendation indicator */}
                <div className="flex flex-col items-center shrink-0">
                    {/* Recommendation badge */}
                    <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105",
                        recommendConfig.className.replace("/10", "/20")
                    )}>
                        <RecommendIcon className="h-4 w-4" />
                    </div>

                    {/* Target price indicator line */}
                    {report.target_price && (
                        <div className="w-0.5 flex-1 mt-1 bg-gradient-to-b from-border/50 to-transparent" />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-2">
                    {/* Header row: Source, Date, Recommendation */}
                    <div className="flex items-center flex-wrap gap-2">
                        {/* Source (CTCK) */}
                        <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            <span className={cn("text-[10px] font-semibold", getSourceColor(report.source))}>
                                {report.source || "—"}
                            </span>
                        </div>

                        {/* Recommendation badge */}
                        <Badge
                            variant="outline"
                            className={cn(
                                "text-[9px] px-1.5 py-0 h-4 font-medium uppercase tracking-wide",
                                recommendConfig.className
                            )}
                        >
                            {recommendConfig.label}
                        </Badge>

                        {/* Spacer */}
                        <div className="flex-1" />

                        {/* Date */}
                        <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                            <Calendar className="h-2.5 w-2.5" />
                            <span className="font-mono">{report.issue_date || "—"}</span>
                            {report.issue_date_ago && (
                                <span className="opacity-60">({report.issue_date_ago})</span>
                            )}
                        </div>
                    </div>

                    {/* Title */}
                    <h4 className="text-[11px] font-medium leading-relaxed line-clamp-2 group-hover:text-primary transition-colors">
                        {report.title || "Báo cáo phân tích"}
                    </h4>

                    {/* Bottom row: Target price + Actions */}
                    <div className="flex items-center justify-between">
                        {/* Target price */}
                        {report.target_price ? (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary/5 border border-primary/10">
                                <Target className="h-3 w-3 text-primary" />
                                <span className="text-[10px] text-muted-foreground">Mục tiêu:</span>
                                <span className="text-[11px] font-mono font-semibold text-primary">
                                    {formatPrice(report.target_price)}
                                </span>
                            </div>
                        ) : (
                            <div />
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {report.attached_link && (
                                <>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenPdf();
                                        }}
                                        title="Xem PDF"
                                    >
                                        <ExternalLink className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // Download logic
                                            const link = document.createElement('a');
                                            link.href = report.attached_link!;
                                            link.download = report.file_name || 'report.pdf';
                                            link.target = '_blank';
                                            link.click();
                                        }}
                                        title="Tải xuống"
                                    >
                                        <Download className="h-3 w-3" />
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
