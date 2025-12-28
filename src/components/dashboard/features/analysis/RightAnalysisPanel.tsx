import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const HeatmapItem = ({ symbol, change }: { symbol: string, change: number }) => {
    let color = "bg-yellow-500";
    if (change > 0) color = "bg-[#00c076]";
    if (change < 0) color = "bg-[#ff3a3a]";

    // Intensity based on change magnitude (mock)
    const opacity = Math.min(Math.abs(change) * 10 + 40, 100);

    return (
        <div
            className={cn("flex flex-col items-center justify-center p-2 rounded cursor-pointer transition-transform hover:scale-105", color)}
            style={{ opacity: opacity / 100 }}
        >
            <span className="font-bold text-xs text-white">{symbol}</span>
            <span className="text-[10px] text-white/90">{change > 0 ? '+' : ''}{change}%</span>
        </div>
    )
}

const SectorGroup = ({ name, stocks }: { name: string, stocks: { symbol: string, change: number }[] }) => (
    <div className="mb-4">
        <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">{name}</h4>
        <div className="grid grid-cols-3 gap-1">
            {stocks.map(s => <HeatmapItem key={s.symbol} {...s} />)}
        </div>
    </div>
)

const MoneyFlowChart = () => (
    <div className="p-4 bg-accent/20 rounded-lg mt-4">
        <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium">Phân bổ dòng tiền</span>
            <div className="flex gap-2">
                <div className="flex items-center gap-1 text-[10px]"><div className="w-2 h-2 rounded-full bg-[#00c076]" />Tăng</div>
                <div className="flex items-center gap-1 text-[10px]"><div className="w-2 h-2 rounded-full bg-[#ff3a3a]" />Giảm</div>
            </div>
        </div>
        <div className="relative h-32 flex items-end gap-2 px-4">
            {/* Simple CSS Bar Chart for Money Flow */}
            <div className="flex-1 bg-[#00c076] rounded-t opacity-90 hover:opacity-100 transition-opacity" style={{ height: '65%' }}>
                <span className="absolute -top-4 w-full text-center text-[10px] font-bold text-[#00c076]">45.2%</span>
            </div>
            <div className="flex-1 bg-[#f8a500] rounded-t opacity-90 hover:opacity-100 transition-opacity" style={{ height: '15%' }}>
                <span className="absolute -top-4 w-full text-center text-[10px] font-bold text-[#f8a500]">10.5%</span>
            </div>
            <div className="flex-1 bg-[#ff3a3a] rounded-t opacity-90 hover:opacity-100 transition-opacity" style={{ height: '40%' }}>
                <span className="absolute -top-4 w-full text-center text-[10px] font-bold text-[#ff3a3a]">35.3%</span>
            </div>
        </div>
        <div className="flex justify-between mt-2 text-xs font-mono">
            <span className="text-[#00c076]">12,450 Tỷ</span>
            <span className="text-[#f8a500]">2,100 Tỷ</span>
            <span className="text-[#ff3a3a]">8,900 Tỷ</span>
        </div>
    </div>
)

export function RightAnalysisPanel() {
    const sectors = [
        { name: "Ngân hàng", stocks: [{ symbol: "VCB", change: 0.5 }, { symbol: "ACB", change: 1.2 }, { symbol: "MBB", change: -0.3 }, { symbol: "TCB", change: 2.1 }, { symbol: "VPB", change: -0.8 }, { symbol: "STB", change: 1.5 }] },
        { name: "Bất động sản", stocks: [{ symbol: "VHM", change: -1.5 }, { symbol: "VIC", change: -0.2 }, { symbol: "NVL", change: 3.4 }, { symbol: "DXG", change: 0.1 }, { symbol: "PDR", change: -2.1 }, { symbol: "KDH", change: 0.5 }] },
        { name: "Chứng khoán", stocks: [{ symbol: "SSI", change: 2.5 }, { symbol: "VND", change: 1.8 }, { symbol: "HCM", change: 3.1 }, { symbol: "VIX", change: 0.5 }, { symbol: "FTS", change: 4.2 }, { symbol: "BSI", change: 2.1 }] },
    ];

    return (
        <div className="flex flex-col h-full w-full border-l border-border/40 bg-background/50">
            <Tabs defaultValue="volatility" className="w-full h-full flex flex-col">
                <div className="px-2 pt-2">
                    <TabsList className="w-full grid grid-cols-4 h-8 bg-muted/50 p-0.5">
                        <TabsTrigger value="volatility" className="text-[10px] px-0 data-[state=active]:bg-background data-[state=active]:shadow-sm">Biến động</TabsTrigger>
                        <TabsTrigger value="foreign" className="text-[10px] px-0 data-[state=active]:bg-background data-[state=active]:shadow-sm">Nước ngoài</TabsTrigger>
                        <TabsTrigger value="proprietary" className="text-[10px] px-0 data-[state=active]:bg-background data-[state=active]:shadow-sm">Tự doanh</TabsTrigger>
                        <TabsTrigger value="liquidity" className="text-[10px] px-0 data-[state=active]:bg-background data-[state=active]:shadow-sm">Thanh khoản</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="volatility" className="flex-1 overflow-hidden p-0 m-0 relative">
                    <ScrollArea className="h-full px-3 py-2">
                        <div className="space-y-4 pb-4">
                            <MoneyFlowChart />
                            <div className="space-y-1">
                                {sectors.map(s => <SectorGroup key={s.name} {...s} />)}
                            </div>
                        </div>
                    </ScrollArea>
                </TabsContent>

                <TabsContent value="foreign" className="flex-1 p-4 text-center text-xs text-muted-foreground">
                    Đang cập nhật dữ liệu...
                </TabsContent>
            </Tabs>
        </div>
    );
}
