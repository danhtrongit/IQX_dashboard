import { useState, useEffect } from "react";
import { X, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { MarketAPI, type AllocatedICBStockItem, type MarketGroup } from "@/lib/market-api";

interface SectorDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    sectorCode: string;
    sectorName: string;
    sectorChange: number;
    sectorValue: number;
    stockUp: number;
    stockDown: number;
    stockUnchanged: number;
    group: MarketGroup;
    timeframe: string;
}

const formatValue = (val: number): string => {
    if (val >= 1e12) return `${(val / 1e12).toFixed(2)} T`;
    if (val >= 1e9) return `${(val / 1e9).toFixed(2)} B`;
    if (val >= 1e6) return `${(val / 1e6).toFixed(1)} M`;
    if (val >= 1e3) return `${(val / 1e3).toFixed(1)} K`;
    return val.toFixed(0);
};

const formatPrice = (val: number | null): string => {
    if (val === null) return '-';
    return (val / 1000).toFixed(2); // Convert to thousands (giá x1000)
};

export function SectorDetailModal({
    isOpen,
    onClose,
    sectorCode,
    sectorName,
    sectorChange,
    sectorValue,
    stockUp,
    stockDown,
    stockUnchanged,
    group,
    timeframe
}: SectorDetailModalProps) {
    const [stocks, setStocks] = useState<AllocatedICBStockItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [sortColumn, setSortColumn] = useState<string>('matchPrice');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    useEffect(() => {
        if (isOpen && sectorCode) {
            fetchStocks();
        }
    }, [isOpen, sectorCode, group, timeframe]);

    const fetchStocks = async () => {
        setIsLoading(true);
        try {
            const data = await MarketAPI.getAllocatedICBDetail(sectorCode, group, timeframe);
            setStocks(data.stocks || []);
        } catch (error) {
            console.error('Failed to fetch sector stocks:', error);
            setStocks([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('desc');
        }
    };

    const sortedStocks = [...stocks].sort((a, b) => {
        const getValue = (stock: AllocatedICBStockItem, col: string) => {
            switch (col) {
                case 'symbol': return stock.symbol || '';
                case 'matchPrice': return stock.matchPrice || 0;
                case 'priceChange': return stock.priceChange || 0;
                case 'priceChangePercent': return stock.priceChangePercent || 0;
                case 'accumulatedVolume': return stock.accumulatedVolume || 0;
                case 'accumulatedValue': return stock.accumulatedValue || 0;
                case 'foreignNetVolume': return stock.foreignNetVolume || 0;
                default: return 0;
            }
        };

        const aVal = getValue(a, sortColumn);
        const bVal = getValue(b, sortColumn);

        if (typeof aVal === 'string' && typeof bVal === 'string') {
            return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }

        return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

    const totalStocks = stockUp + stockDown + stockUnchanged;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-card border border-border rounded-lg shadow-2xl w-[95%] max-w-4xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">Ngành</div>
                        <h2 className="text-xl font-bold text-foreground">{sectorName}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-accent rounded-md transition-colors"
                    >
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-4 gap-4 p-4 border-b border-border bg-accent/5">
                    <div>
                        <div className="text-xs text-muted-foreground">Thời gian</div>
                        <div className="text-sm font-bold text-foreground">{timeframe}</div>
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground">Biến động giá</div>
                        <div className={cn(
                            "text-sm font-bold",
                            sectorChange >= 0 ? "text-[#00c076]" : "text-[#ff3a3a]"
                        )}>
                            {sectorChange > 0 ? '+' : ''}{sectorChange.toFixed(2)}%
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground">Giá trị</div>
                        <div className="text-sm font-bold text-foreground">
                            {formatValue(sectorValue * 1e9)} VND
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground">Phân bổ dòng tiền</div>
                        <div className="h-4 w-full flex rounded-full overflow-hidden bg-accent/20 mt-1">
                            {totalStocks > 0 && (
                                <>
                                    <div
                                        style={{ width: `${(stockUp / totalStocks) * 100}%` }}
                                        className="bg-[#00c076] h-full"
                                        title={`Tăng: ${stockUp}`}
                                    />
                                    <div
                                        style={{ width: `${(stockUnchanged / totalStocks) * 100}%` }}
                                        className="bg-[#fbbf24] h-full"
                                        title={`Đứng giá: ${stockUnchanged}`}
                                    />
                                    <div
                                        style={{ width: `${(stockDown / totalStocks) * 100}%` }}
                                        className="bg-[#ff3a3a] h-full"
                                        title={`Giảm: ${stockDown}`}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stock Table */}
                <div className="flex-1 overflow-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-48">
                            <RefreshCcw className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : stocks.length === 0 ? (
                        <div className="flex items-center justify-center h-48 text-muted-foreground">
                            Không có dữ liệu
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-accent/5 sticky top-0 z-10">
                                <tr className="text-xs text-muted-foreground border-b border-border">
                                    <th
                                        className="font-medium p-3 cursor-pointer hover:bg-accent/10"
                                        onClick={() => handleSort('symbol')}
                                    >
                                        Mã <span className="text-primary">{stocks.length}</span>
                                    </th>
                                    <th className="font-medium p-3">Sàn</th>
                                    <th
                                        className="font-medium p-3 text-right cursor-pointer hover:bg-accent/10"
                                        onClick={() => handleSort('matchPrice')}
                                    >
                                        ↓ Giá
                                    </th>
                                    <th
                                        className="font-medium p-3 text-right cursor-pointer hover:bg-accent/10"
                                        onClick={() => handleSort('priceChange')}
                                    >
                                        +/-
                                    </th>
                                    <th
                                        className="font-medium p-3 text-right cursor-pointer hover:bg-accent/10"
                                        onClick={() => handleSort('priceChangePercent')}
                                    >
                                        %
                                    </th>
                                    <th
                                        className="font-medium p-3 text-right cursor-pointer hover:bg-accent/10"
                                        onClick={() => handleSort('accumulatedVolume')}
                                    >
                                        Tổng KL (cổ phiếu)
                                    </th>
                                    <th
                                        className="font-medium p-3 text-right cursor-pointer hover:bg-accent/10"
                                        onClick={() => handleSort('accumulatedValue')}
                                    >
                                        Tổng GT (VND)
                                    </th>
                                    <th
                                        className="font-medium p-3 text-right cursor-pointer hover:bg-accent/10"
                                        onClick={() => handleSort('foreignNetVolume')}
                                    >
                                        KL Ròng - NN (cổ phiếu)
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedStocks.map((stock, idx) => {
                                    const priceChange = stock.priceChange || 0;
                                    const priceChangePercent = stock.priceChangePercent || 0;
                                    const foreignNet = stock.foreignNetVolume || 0;

                                    return (
                                        <tr
                                            key={stock.symbol || idx}
                                            className="border-b border-border/30 hover:bg-accent/5 cursor-pointer transition-colors"
                                        >
                                            <td className="p-3">
                                                <span className={cn(
                                                    "font-bold text-sm px-2 py-0.5 rounded",
                                                    priceChangePercent > 0 ? "bg-[#00c076]/20 text-[#00c076]" :
                                                        priceChangePercent < 0 ? "bg-[#ff3a3a]/20 text-[#ff3a3a]" :
                                                            "bg-[#fbbf24]/20 text-[#fbbf24]"
                                                )}>
                                                    {stock.symbol}
                                                </span>
                                            </td>
                                            <td className="p-3 text-xs text-muted-foreground">
                                                {stock.exchange || 'HSX'}
                                            </td>
                                            <td className={cn(
                                                "p-3 text-sm font-mono text-right font-medium",
                                                priceChangePercent > 0 ? "text-[#00c076]" :
                                                    priceChangePercent < 0 ? "text-[#ff3a3a]" :
                                                        "text-[#fbbf24]"
                                            )}>
                                                {formatPrice(stock.matchPrice)}
                                            </td>
                                            <td className={cn(
                                                "p-3 text-sm font-mono text-right",
                                                priceChange > 0 ? "text-[#00c076]" :
                                                    priceChange < 0 ? "text-[#ff3a3a]" :
                                                        "text-[#fbbf24]"
                                            )}>
                                                {priceChange > 0 ? '+' : ''}{(priceChange / 1000).toFixed(2)}
                                            </td>
                                            <td className={cn(
                                                "p-3 text-sm font-mono text-right",
                                                priceChangePercent > 0 ? "text-[#00c076]" :
                                                    priceChangePercent < 0 ? "text-[#ff3a3a]" :
                                                        "text-[#fbbf24]"
                                            )}>
                                                {priceChangePercent > 0 ? '+' : ''}{priceChangePercent.toFixed(1)}%
                                            </td>
                                            <td className="p-3 text-sm font-mono text-right text-muted-foreground">
                                                {formatValue(stock.accumulatedVolume || 0)}
                                            </td>
                                            <td className="p-3 text-sm font-mono text-right text-muted-foreground">
                                                {formatValue(stock.accumulatedValue || 0)}
                                            </td>
                                            <td className={cn(
                                                "p-3 text-sm font-mono text-right",
                                                foreignNet > 0 ? "text-[#00c076]" :
                                                    foreignNet < 0 ? "text-[#ff3a3a]" :
                                                        "text-muted-foreground"
                                            )}>
                                                {foreignNet > 0 ? '+' : ''}{formatValue(foreignNet)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
