import { useState } from "react";
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
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";

// Mock Data Interfaces
interface StockData {
    symbol: string;
    value: number;
    name: string;
    price?: number;
    change?: number;
    exchange?: string;
}

// 1. Market Leaders Data (Contribution)
const leadersData: { gainers: StockData[], losers: StockData[] } = {
    gainers: [
        { symbol: "PVS", value: 0.53, name: "Dịch vụ Kỹ thuật Dầu khí", price: 38.5, change: 1.2, exchange: "HNX" },
        { symbol: "PTI", value: 0.23, name: "Bảo hiểm Bưu điện", price: 56.1, change: 2.1, exchange: "HNX" },
        { symbol: "NTP", value: 0.19, name: "Nhựa Tiền Phong", price: 42.0, change: 0.8, exchange: "HNX" },
        { symbol: "KSF", value: 0.16, name: "Tập đoàn KSFinance", price: 29.5, change: 0.5, exchange: "HNX" },
        { symbol: "THD", value: 0.13, name: "Thaiholdings", price: 35.2, change: 0.4, exchange: "HNX" },
        { symbol: "PGS", value: 0.12, name: "Khí Miền Nam", price: 46.2, change: 0.3, exchange: "HNX" },
        { symbol: "GMA", value: 0.12, name: "G-Automobile", price: 18.2, change: 0.7, exchange: "HNX" },
        { symbol: "TIG", value: 0.09, name: "Tập đoàn Thăng Long", price: 11.5, change: 0.2, exchange: "HNX" },
        { symbol: "PVC", value: 0.07, name: "Hóa chất Dầu khí", price: 14.8, change: 1.1, exchange: "HNX" },
        { symbol: "MBS", value: 0.07, name: "Chứng khoán MB", price: 24.3, change: 0.9, exchange: "HNX" },
    ],
    losers: [
        { symbol: "KSV", value: -1.73, name: "Vinacomin - Khoáng sản", price: 32.1, change: -5.2, exchange: "UPCOM" },
        { symbol: "PVI", value: -1.12, name: "PVI Holdings", price: 48.5, change: -2.3, exchange: "HNX" },
        { symbol: "CEO", value: -0.62, name: "Tập đoàn C.E.O", price: 21.0, change: -1.8, exchange: "HNX" },
        { symbol: "MBS", value: -0.46, name: "Chứng khoán MB", price: 23.5, change: -1.2, exchange: "HNX" },
        { symbol: "NVB", value: -0.33, name: "Ngân hàng Quốc Dân", price: 10.8, change: -0.9, exchange: "HNX" },
        { symbol: "VCS", value: -0.14, name: "Vicostone", price: 65.2, change: -0.5, exchange: "HNX" },
        { symbol: "IDJ", value: -0.09, name: "Đầu tư IDJ", price: 6.8, change: -0.2, exchange: "HNX" },
        { symbol: "BTW", value: -0.07, name: "Cấp nước Bến Thành", price: 22.1, change: -0.3, exchange: "UPCOM" },
        { symbol: "SCG", value: -0.07, name: "Xây dựng SCG", price: 15.4, change: -0.4, exchange: "HNX" },
        { symbol: "HUT", value: -0.06, name: "Tasco", price: 18.9, change: -0.1, exchange: "HNX" },
    ]
};

// ... Similar data for Prop Trading & Foreign (simplified for brevity)
const propTradingData = leadersData;
const foreignTradingData = leadersData;

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
                {stock.price?.toFixed(2)}
            </span>
            <span className={cn("text-xs font-bold", (stock.change || 0) >= 0 ? "text-[#00c076]" : "text-[#ff3a3a]")}>
                {(stock.change || 0) > 0 ? '+' : ''}{stock.change}%
            </span>
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
    type = 'value'
}: {
    leftData: StockData[],
    rightData: StockData[],
    type?: 'impact' | 'value'
}) => {

    // Find max value to normalize bars
    const maxVal = Math.max(
        ...leftData.map(d => Math.abs(d.value)),
        ...rightData.map(d => Math.abs(d.value))
    );

    const formatValue = (val: number) => type === 'impact' ? val.toFixed(2) : Math.abs(val).toLocaleString();

    return (
        <div className="grid grid-cols-2 gap-4 h-full font-sans">
            {/* LEFT COLUMN: Positive/Buy */}
            <div className="flex flex-col w-full">
                <div className="flex justify-between items-center mb-2 px-1">
                    <span className="text-xs font-bold text-foreground w-12 text-left">
                        {type === 'impact' ? 'Đóng góp' : 'Mua ròng'}
                    </span>
                    {/* Empty header for symbol side */}
                    <span className="w-10"></span>
                </div>
                <div className="flex flex-col gap-1.5 w-full">
                    {leftData.map((item, idx) => (
                        <div key={idx} className="flex items-center w-full group cursor-pointer hover:bg-accent/5 rounded-sm" onClick={() => toast.info(`Drilldown: ${item.symbol}`)}>
                            {/* Value - Left Aligned */}
                            <div className="w-12 text-[10px] text-left font-medium text-[#00c076] shrink-0 font-mono pl-1">
                                {formatValue(item.value)}
                            </div>

                            {/* Bar - Grows to Right (justify-end puts it next to Symbol) */}
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

                            {/* Symbol - Right Aligned (Center Spine) */}
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
                    {/* Empty header for symbol side */}
                    <span className="w-10"></span>
                    <span className="text-xs font-bold text-foreground w-12 text-right">
                        {type === 'impact' ? 'Đóng góp' : 'Bán ròng'}
                    </span>
                </div>
                <div className="flex flex-col gap-1.5 w-full">
                    {rightData.map((item, idx) => (
                        <div key={idx} className="flex items-center w-full group cursor-pointer hover:bg-accent/5 rounded-sm" onClick={() => toast.info(`Drilldown: ${item.symbol}`)}>
                            {/* Symbol - Left Aligned (Center Spine) */}
                            <div className="w-10 text-[11px] font-bold text-foreground shrink-0 leading-none text-left pl-1">
                                {item.symbol}
                            </div>

                            {/* Bar - Grows from Left (justify-start puts it next to Symbol) */}
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

                            {/* Value - Right Aligned */}
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
    const [timeframe, setTimeframe] = useState("1D");
    const [exchange, setExchange] = useState("HOSE");
    const [isLoading, setIsLoading] = useState(false);

    const handleFilterChange = (tf?: string, ex?: string) => {
        if (tf) setTimeframe(tf);
        if (ex) setExchange(ex);

        setIsLoading(true);
        setTimeout(() => setIsLoading(false), 500); // Simulate API call
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
                    <Select value={exchange} onValueChange={(val) => handleFilterChange(undefined, val)}>
                        <SelectTrigger className="!h-[26px] !min-h-[26px] w-[80px] !text-[10px] font-medium bg-background border-border/60 focus:ring-0 !px-2 !py-0 [&_svg]:!size-3 !gap-1">
                            <SelectValue placeholder="Sàn" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="HOSE">HOSE</SelectItem>
                            <SelectItem value="HNX">HNX</SelectItem>
                            <SelectItem value="UPCOM">UPCOM</SelectItem>
                            <SelectItem value="ALL">Tất cả</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Charts Section */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-px bg-border/40 overflow-y-auto lg:overflow-hidden">

                {/* 1. Market Leaders */}
                <div className="bg-background/50 hover:bg-background/80 transition-colors p-3 flex flex-col gap-2 relative group">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2">Nhóm dẫn dắt thị trường</h3>
                    <div className="flex-1 w-full pl-2 pr-2">
                        <CSSBarChart leftData={leadersData.gainers} rightData={leadersData.losers} type="impact" />
                    </div>
                    {/* Hover Decoration */}
                    <div className="absolute inset-0 border border-primary/0 group-hover:border-primary/20 pointer-events-none transition-colors" />
                </div>

                {/* 2. Proprietary Trading (Tu Doanh) */}
                <div className="bg-background/50 hover:bg-background/80 transition-colors p-3 flex flex-col gap-2 relative group">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2">Tự doanh</h3>
                    <div className="flex-1 w-full pl-2 pr-2">
                        <CSSBarChart leftData={propTradingData.gainers} rightData={propTradingData.losers} type="value" />
                    </div>
                    <div className="absolute inset-0 border border-primary/0 group-hover:border-primary/20 pointer-events-none transition-colors" />
                </div>

                {/* 3. Foreign Trading (Khoi Ngoai) */}
                <div className="bg-background/50 hover:bg-background/80 transition-colors p-3 flex flex-col gap-2 relative group">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2">Khối ngoại</h3>
                    <div className="flex-1 w-full pl-2 pr-2">
                        <CSSBarChart leftData={foreignTradingData.gainers} rightData={foreignTradingData.losers} type="value" />
                    </div>
                    <div className="absolute inset-0 border border-primary/0 group-hover:border-primary/20 pointer-events-none transition-colors" />
                </div>
            </div>
        </div>
    );
}
