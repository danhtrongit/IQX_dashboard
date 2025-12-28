"use client";

import { useEffect, useState } from "react";
import { Building2, Users, Briefcase, TrendingUp, TrendingDown, Activity, DollarSign, BarChart3, Loader2, AlertCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    CompanyAPI,
    type StockDetailResponse,
    type CompanyOverviewResponse,
    type ShareholdersResponse,
    type OfficersResponse,
} from "@/lib/stock-api";
import {
    formatNumber,
    formatCompact,
    formatPercent,
    formatRatio,
} from "@/lib/format";
import { cn } from "@/lib/utils";

interface StockOverviewTabProps {
    symbol: string;
}

// Price color based on Vietnamese stock market convention
const getPriceColor = (change: number | null | undefined): string => {
    if (!change) return "text-[#f8a500]"; // Reference - yellow
    if (change > 0) return "text-[#00c076]"; // Up - green
    if (change < 0) return "text-[#ff3a3a]"; // Down - red
    return "text-[#f8a500]"; // Reference
};

// Section header component - consistent with dashboard
const SectionHeader = ({ icon: Icon, title, iconColor }: { icon: any; title: string; iconColor?: string }) => (
    <div className="flex items-center gap-2 px-3 py-2 bg-secondary/30 border-b border-border/30">
        <Icon className={cn("h-3.5 w-3.5", iconColor || "text-primary")} />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</span>
    </div>
);

// Metric row component - consistent with QuickTrade style
const MetricRow = ({ label, value, valueColor, suffix }: { label: string; value: string; valueColor?: string; suffix?: string }) => (
    <div className="flex items-center justify-between px-3 py-1.5 hover:bg-secondary/20 transition-colors">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <span className={cn("text-[11px] font-mono font-semibold", valueColor || "text-foreground")}>
            {value}{suffix && <span className="text-muted-foreground font-normal ml-0.5">{suffix}</span>}
        </span>
    </div>
);

export function StockOverviewTab({ symbol }: StockOverviewTabProps) {
    const [stockDetail, setStockDetail] = useState<StockDetailResponse | null>(null);
    const [overview, setOverview] = useState<CompanyOverviewResponse | null>(null);
    const [shareholders, setShareholders] = useState<ShareholdersResponse | null>(null);
    const [officers, setOfficers] = useState<OfficersResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [detailRes, overviewRes, shareholdersRes, officersRes] = await Promise.allSettled([
                    CompanyAPI.getStockDetail(symbol),
                    CompanyAPI.getOverview(symbol),
                    CompanyAPI.getShareholders(symbol),
                    CompanyAPI.getOfficers(symbol),
                ]);

                if (detailRes.status === "fulfilled") setStockDetail(detailRes.value);
                if (overviewRes.status === "fulfilled") setOverview(overviewRes.value);
                if (shareholdersRes.status === "fulfilled") setShareholders(shareholdersRes.value);
                if (officersRes.status === "fulfilled") setOfficers(officersRes.value);
            } catch (err) {
                console.error("Failed to fetch overview data:", err);
                setError("Không thể tải dữ liệu");
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

    if (error) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{error}</span>
                </div>
            </div>
        );
    }

    const priceChange = stockDetail?.price_change ?? 0;
    const percentChange = stockDetail?.percent_price_change ?? 0;

    return (
        <ScrollArea className="h-full">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 h-full">
                {/* LEFT COLUMN: Price & Key Metrics */}
                <div className="border-r border-border/30 flex flex-col">
                    {/* Current Price */}
                    <div className="px-3 py-3 border-b border-border/30">
                        <div className="flex items-baseline gap-2">
                            <span className={cn("text-2xl font-bold font-mono", getPriceColor(priceChange))}>
                                {formatNumber(stockDetail?.match_price)}
                            </span>
                            <div className="flex items-center gap-1">
                                {priceChange !== 0 && (
                                    priceChange > 0 ?
                                        <TrendingUp className="h-3.5 w-3.5 text-[#00c076]" /> :
                                        <TrendingDown className="h-3.5 w-3.5 text-[#ff3a3a]" />
                                )}
                                <span className={cn("text-[11px] font-mono font-semibold", getPriceColor(priceChange))}>
                                    {priceChange > 0 ? "+" : ""}{formatNumber(priceChange)}
                                </span>
                                <span className={cn("text-[10px] font-mono", getPriceColor(priceChange))}>
                                    ({formatPercent(percentChange, false)})
                                </span>
                            </div>
                        </div>
                        {/* 52-week Range */}
                        <div className="mt-2 space-y-1">
                            <div className="flex items-center justify-between text-[10px]">
                                <span className="text-[#00c5c5] font-mono">{formatNumber(stockDetail?.lowest_price_1_year)}</span>
                                <span className="text-muted-foreground">52 tuần</span>
                                <span className="text-[#b02bfe] font-mono">{formatNumber(stockDetail?.highest_price_1_year)}</span>
                            </div>
                            <Progress
                                value={stockDetail?.match_price && stockDetail?.lowest_price_1_year && stockDetail?.highest_price_1_year ?
                                    ((stockDetail.match_price - stockDetail.lowest_price_1_year) /
                                        (stockDetail.highest_price_1_year - stockDetail.lowest_price_1_year)) * 100 : 50
                                }
                                className="h-1.5 bg-secondary/50"
                            />
                        </div>
                    </div>

                    {/* Valuation Metrics */}
                    <SectionHeader icon={BarChart3} title="Định giá" iconColor="text-blue-400" />
                    <div className="divide-y divide-border/20">
                        <MetricRow label="Vốn hóa" value={formatCompact(stockDetail?.market_cap, { vietnamese: true })} />
                        <MetricRow label="P/E" value={formatRatio(stockDetail?.pe)} />
                        <MetricRow label="P/B" value={formatRatio(stockDetail?.pb)} />
                        <MetricRow label="EPS" value={formatNumber(stockDetail?.eps)} suffix="VND" />
                        <MetricRow label="BVPS" value={formatNumber(stockDetail?.bvps)} suffix="VND" />
                    </div>

                    {/* Profitability Metrics */}
                    <SectionHeader icon={Activity} title="Sinh lời" iconColor="text-emerald-400" />
                    <div className="divide-y divide-border/20">
                        <MetricRow
                            label="ROE"
                            value={formatPercent(stockDetail?.roe, false)}
                            valueColor={stockDetail?.roe && stockDetail.roe > 15 ? "text-[#00c076]" : undefined}
                        />
                        <MetricRow
                            label="ROA"
                            value={formatPercent(stockDetail?.roa, false)}
                            valueColor={stockDetail?.roa && stockDetail.roa > 10 ? "text-[#00c076]" : undefined}
                        />
                        <MetricRow label="D/E" value={formatRatio(stockDetail?.de)} />
                        <MetricRow label="Cổ tức" value={formatNumber(stockDetail?.dividend)} suffix="VND" />
                    </div>

                    {/* Foreign Ownership */}
                    <SectionHeader icon={Users} title="Sở hữu NN" iconColor="text-cyan-400" />
                    <div className="px-3 py-2 space-y-2">
                        <div className="flex justify-between text-[10px]">
                            <span className="text-muted-foreground">Tỷ lệ sở hữu</span>
                            <span className="font-mono font-semibold text-cyan-400">
                                {formatPercent(stockDetail?.current_holding_ratio, false)}
                            </span>
                        </div>
                        <Progress
                            value={stockDetail?.current_holding_ratio ?? 0}
                            className="h-1.5 bg-secondary/50"
                        />
                        <div className="flex justify-between text-[9px] text-muted-foreground">
                            <span>Room còn: {formatCompact(stockDetail?.foreign_total_room)}</span>
                            <span>Giới hạn: {formatPercent(stockDetail?.max_holding_ratio, false)}</span>
                        </div>
                    </div>
                </div>

                {/* MIDDLE COLUMN: Shareholders & Officers */}
                <div className="border-r border-border/30 flex flex-col">
                    {/* Major Shareholders */}
                    <SectionHeader icon={Users} title="Cổ đông lớn" iconColor="text-purple-400" />
                    <div className="flex-1 divide-y divide-border/20">
                        {shareholders && shareholders.data.length > 0 ? (
                            shareholders.data.slice(0, 8).map((sh, idx) => (
                                <div key={idx} className="flex items-center justify-between px-3 py-1.5 hover:bg-secondary/20">
                                    <span className="text-[10px] truncate flex-1 pr-2">{sh.share_holder ?? "—"}</span>
                                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-mono shrink-0">
                                        {formatPercent(sh.share_own_percent, false)}
                                    </Badge>
                                </div>
                            ))
                        ) : (
                            <div className="flex items-center justify-center h-20 text-[11px] text-muted-foreground">
                                Không có dữ liệu
                            </div>
                        )}
                    </div>

                    {/* Officers */}
                    <SectionHeader icon={Briefcase} title="Ban lãnh đạo" iconColor="text-orange-400" />
                    <div className="flex-1 divide-y divide-border/20">
                        {officers && officers.data.length > 0 ? (
                            officers.data.slice(0, 6).map((officer, idx) => (
                                <div key={idx} className="px-3 py-1.5 hover:bg-secondary/20">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-medium truncate">{officer.officer_name ?? "—"}</span>
                                        {officer.officer_own_percent !== null && officer.officer_own_percent > 0 && (
                                            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 font-mono ml-1 shrink-0">
                                                {formatPercent(officer.officer_own_percent, false)}
                                            </Badge>
                                        )}
                                    </div>
                                    <span className="text-[9px] text-muted-foreground truncate block">{officer.officer_position ?? ""}</span>
                                </div>
                            ))
                        ) : (
                            <div className="flex items-center justify-center h-20 text-[11px] text-muted-foreground">
                                Không có dữ liệu
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: Company Profile */}
                <div className="flex flex-col">
                    <SectionHeader icon={Building2} title="Giới thiệu" iconColor="text-blue-400" />
                    <div className="flex-1 p-3">
                        {overview?.company_profile ? (
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                {overview.company_profile}
                            </p>
                        ) : (
                            <div className="flex items-center justify-center h-full text-[11px] text-muted-foreground">
                                Không có thông tin
                            </div>
                        )}
                    </div>

                    {/* Industry Classification */}
                    {(overview?.icb_name2 || overview?.icb_name3 || overview?.icb_name4) && (
                        <>
                            <SectionHeader icon={BarChart3} title="Phân ngành ICB" iconColor="text-indigo-400" />
                            <div className="px-3 py-2 space-y-1">
                                {overview.icb_name2 && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] text-muted-foreground w-8">L2</span>
                                        <span className="text-[10px]">{overview.icb_name2}</span>
                                    </div>
                                )}
                                {overview.icb_name3 && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] text-muted-foreground w-8">L3</span>
                                        <span className="text-[10px]">{overview.icb_name3}</span>
                                    </div>
                                )}
                                {overview.icb_name4 && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] text-muted-foreground w-8">L4</span>
                                        <span className="text-[10px]">{overview.icb_name4}</span>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Basic Info */}
                    <SectionHeader icon={DollarSign} title="Thông tin cơ bản" iconColor="text-green-400" />
                    <div className="divide-y divide-border/20">
                        <MetricRow label="Vốn điều lệ" value={formatCompact(overview?.charter_capital || stockDetail?.charter_capital, { vietnamese: true })} />
                        <MetricRow label="KL lưu hành" value={formatCompact(overview?.issue_share || stockDetail?.issue_share)} />
                    </div>
                </div>
            </div>
        </ScrollArea>
    );
}
