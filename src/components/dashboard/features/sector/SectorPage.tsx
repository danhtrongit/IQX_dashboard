/**
 * SectorPage - Vietcap IQ Sector Clone
 * Optimized with shadcn/ui and theme-aware colors
 * Flat Layout Design
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { RefreshCcw, Settings, BarChart3, Table2, ArrowLeft, ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectorAPI, type SectorInfo, type SectorCompany, type SectorRanking } from '@/lib/market-api';

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

// ============== CONSTANTS ==============
// Color gradient for Heatmap (Data Visualization Colors - Keeping explicit for data accuracy)
const getHeatmapColor = (value: number | null): string => {
    if (value === null || value === undefined) return 'bg-muted/50'; // Use theme muted color for empty

    // Using Vietcap-like specific colors for data points
    if (value >= 90) return 'bg-[#8b5cf6]'; // Purple/Violet
    if (value >= 70) return 'bg-[#22c55e]'; // Bright Green
    if (value >= 50) return 'bg-[#16a34a]'; // Medium Green
    if (value >= 30) return 'bg-[#166534]'; // Dark Green
    return 'bg-[#1f2937]'; // Dark Gray
};

const getHeatmapTextColor = (value: number | null) => {
    if (value === null || value === undefined) return 'text-muted-foreground';
    if (value >= 30) return 'text-white';
    return 'text-muted-foreground';
};

// ============== COMPONENTS ==============

const Sparkline = ({ data, width = 100, height = 28 }: { data: number[] | null; width?: number; height?: number }) => {
    if (!data || data.length === 0) return <div style={{ width, height }} className="bg-muted rounded opacity-20" />;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    // Add padding to avoid cutting off peaks
    const padding = 2;
    const availableHeight = height - padding * 2;

    const points = data.map((v, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - padding - ((v - min) / range) * availableHeight;
        return `${x},${y}`;
    }).join(' ');

    const isPositive = data[data.length - 1] >= data[0];

    return (
        <svg width={width} height={height} className="overflow-visible">
            <polyline
                points={points}
                fill="none"
                stroke={isPositive ? '#22c55e' : '#ef4444'} // Green-500 : Red-500
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

const formatPercent = (val: number | null, decimals = 2): string => {
    if (val === null || val === undefined) return '-';
    const percent = val * 100;
    const prefix = percent > 0 ? '+' : '';
    return `${prefix}${percent.toFixed(decimals)}%`;
};

const formatMarketCap = (val: number | null): string => {
    if (val === null) return '-';
    const inBillions = val / 1e9;
    return inBillions.toLocaleString('vi-VN', { maximumFractionDigits: 0 });
};

// ============== SETTINGS MODAL ==============
interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    activeTab: 'ranking' | 'info';
    icbLevel: number;
    setIcbLevel: (level: number) => void;
    adtv: number;
    setAdtv: (adtv: number) => void;
    minValue: number;
    setMinValue: (val: number) => void;
    visibleColumns: string[];
    setVisibleColumns: (cols: string[]) => void;
    onApply: () => void;
}

const SettingsModal = ({
    isOpen, onClose, activeTab,
    icbLevel, setIcbLevel,
    adtv, setAdtv,
    minValue, setMinValue,
    visibleColumns, setVisibleColumns,
    onApply
}: SettingsModalProps) => {

    const allColumns = [
        { key: 'marketCap', label: 'Vốn Hóa (tỷ VNĐ)' },
        { key: 'weight', label: 'Tỷ Trọng (%)' },
        { key: 'change', label: '% Thay Đổi' },
        { key: 'sparkline', label: '20 Ngày Gần Nhất' },
        { key: '1w', label: '1W %' },
        { key: '1m', label: '1M %' },
        { key: '6m', label: '6M %' },
        { key: 'ytd', label: 'YTD %' },
        { key: '1y', label: '1Y %' },
        { key: '2y', label: '2Y %' },
        { key: '5y', label: '5Y %' },
    ];

    const toggleColumn = (key: string) => {
        if (visibleColumns.includes(key)) {
            setVisibleColumns(visibleColumns.filter(c => c !== key));
        } else {
            setVisibleColumns([...visibleColumns, key]);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px] bg-background border-border text-foreground p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-4 border-b border-border">
                    <DialogTitle className="text-lg font-semibold">Cài đặt</DialogTitle>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh] p-4">
                    <div className="space-y-6">
                        {/* ICB Level */}
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Ngành</Label>
                            <Select value={String(icbLevel)} onValueChange={(v) => setIcbLevel(Number(v))}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Chọn cấp ngành" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">ICB level 1</SelectItem>
                                    <SelectItem value="2">ICB level 2</SelectItem>
                                    <SelectItem value="3">ICB level 3</SelectItem>
                                    <SelectItem value="4">ICB level 4</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {activeTab === 'ranking' && (
                            <>
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">GTGD trung bình</Label>
                                    <Select value={String(adtv)} onValueChange={(v) => setAdtv(Number(v))}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">1M</SelectItem>
                                            <SelectItem value="3">3M</SelectItem>
                                            <SelectItem value="6">6M</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">Khoảng</Label>
                                    <Select value={String(minValue)} onValueChange={(v) => setMinValue(Number(v))}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0">Tất cả</SelectItem>
                                            <SelectItem value="1">&gt; 1 tỷ VNĐ</SelectItem>
                                            <SelectItem value="3">&gt; 3 tỷ VNĐ</SelectItem>
                                            <SelectItem value="5">&gt; 5 tỷ VNĐ</SelectItem>
                                            <SelectItem value="10">&gt; 10 tỷ VNĐ</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-4 pt-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-medium">Tín hiệu</Label>
                                        <Switch />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-medium">Hiệu suất sóng</Label>
                                        <Switch />
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'info' && (
                            <>
                                <div className="space-y-3">
                                    <Label className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Ghim cột</Label>
                                    <div className="p-3 bg-muted/50 rounded-md text-sm text-foreground/80 font-medium">
                                        Ngành
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Cột động</Label>
                                    <div className="space-y-1 bg-card rounded-lg border border-border/50 divide-y divide-border/50">
                                        {allColumns.map(col => (
                                            <div key={col.key} className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors">
                                                <div className="flex items-center space-x-3">
                                                    <Checkbox
                                                        id={`col-${col.key}`}
                                                        checked={visibleColumns.includes(col.key)}
                                                        onCheckedChange={() => toggleColumn(col.key)}
                                                    />
                                                    <label
                                                        htmlFor={`col-${col.key}`}
                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                    >
                                                        {col.label}
                                                    </label>
                                                </div>
                                                <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </ScrollArea>

                <DialogFooter className="p-4 border-t border-border bg-muted/10 gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onClose} className="flex-1 sm:mr-2">
                        Đặt lại
                    </Button>
                    <Button onClick={() => { onApply(); onClose(); }} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                        Áp dụng
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// ============== RANKING TAB ==============
const RankingTab = ({ rankings, tradingDates, onSectorClick }: {
    rankings: SectorRanking[],
    tradingDates: string[],
    onSectorClick: (icbCode: number, sectorName: string) => void
}) => {
    const [monthOffset, setMonthOffset] = useState(0);

    // Get visible dates (20 days)
    const visibleDates = useMemo(() => {
        const offset = monthOffset * 20;
        return tradingDates.slice(offset, offset + 20).reverse();
    }, [tradingDates, monthOffset]);

    // Group dates by month
    const monthGroups = useMemo(() => {
        const groups: { month: string; dates: string[] }[] = [];
        let currentMonth = '';

        visibleDates.forEach(date => {
            const month = date.slice(0, 7);
            if (month !== currentMonth) {
                groups.push({ month: `Tháng ${parseInt(date.slice(5, 7))}`, dates: [] });
                currentMonth = month;
            }
            groups[groups.length - 1].dates.push(date);
        });

        return groups;
    }, [visibleDates]);

    return (
        <div className="h-full w-full overflow-auto">
            <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0 z-30 bg-background shadow-sm">
                    {/* Month headers */}
                    <tr className="border-b border-border">
                        <th className="sticky left-0 z-40 bg-background p-2 text-left min-w-[180px] border-r border-border">
                            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium pl-2">
                                Rank: {rankings.length}
                            </div>
                        </th>
                        {monthGroups.map((group, i) => (
                            <th key={i} colSpan={group.dates.length} className="p-1.5 text-center text-xs font-medium text-muted-foreground border-r border-border last:border-r-0 bg-muted/20">
                                <div className="flex items-center justify-center gap-2">
                                    {i === 0 && monthOffset > 0 && (
                                        <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => setMonthOffset(m => m - 1)}>
                                            <ChevronLeft className="h-3 w-3" />
                                        </Button>
                                    )}
                                    {group.month}
                                    {i === monthGroups.length - 1 && tradingDates.length > (monthOffset + 1) * 20 && (
                                        <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => setMonthOffset(m => m + 1)}>
                                            <ChevronRight className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                            </th>
                        ))}
                    </tr>
                    {/* Day headers */}
                    <tr className="border-b border-border">
                        <th className="sticky left-0 z-40 bg-background p-2 border-r border-border"></th>
                        {visibleDates.map((date) => (
                            <th key={date} className="p-1 text-center text-[10px] text-muted-foreground font-medium min-w-[36px] border-r border-border/30 last:border-r-0">
                                {parseInt(date.slice(8, 10))}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rankings.map((sector, idx) => (
                        <tr key={sector.icb_code} className="border-b border-border/50 hover:bg-muted/30 transition-colors group">
                            <td className="sticky left-0 z-20 bg-background group-hover:bg-muted/30 p-0 border-r border-border">
                                <button
                                    onClick={() => onSectorClick(sector.icb_code, sector.vi_sector || sector.en_sector || 'Sector')}
                                    className="w-full text-left py-2 px-3 text-xs flex items-center gap-3 hover:text-primary transition-colors"
                                >
                                    <span className="text-muted-foreground/50 w-4 text-right font-mono">{idx + 1}</span>
                                    <span className="font-medium truncate">{sector.vi_sector || sector.en_sector}</span>
                                </button>
                            </td>
                            {visibleDates.map(date => {
                                const value = sector.values.find(v => v.date === date);
                                const rankValue = value?.value ? Math.round(value.value) : null;
                                return (
                                    <td key={date} className="p-[1px]">
                                        <div
                                            className={cn(
                                                "h-7 w-full flex items-center justify-center text-[10px] font-medium rounded-[2px] tabular-nums",
                                                getHeatmapColor(rankValue),
                                                getHeatmapTextColor(rankValue)
                                            )}
                                        >
                                            {rankValue ?? ''}
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// ============== INFORMATION TAB ==============
interface InfoTabProps {
    sectors: SectorInfo[];
    onSectorClick: (icbCode: number, sectorName: string) => void;
    visibleColumns: string[];
}

const InfoTab = ({ sectors, onSectorClick, visibleColumns }: InfoTabProps) => {
    const [sortColumn, setSortColumn] = useState<string>('market_cap');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('desc');
        }
    };

    const totalMarketCap = useMemo(() => sectors.reduce((sum, s) => sum + (s.market_cap || 0), 0), [sectors]);

    const sortedSectors = useMemo(() => {
        return [...sectors].sort((a, b) => {
            let aVal: number | string | null = null;
            let bVal: number | string | null = null;

            switch (sortColumn) {
                case 'name': aVal = a.vi_sector || ''; bVal = b.vi_sector || ''; break;
                case 'market_cap': aVal = a.market_cap; bVal = b.market_cap; break;
                case 'weight': aVal = a.market_cap; bVal = b.market_cap; break;
                case '1d': aVal = a.percent_change_1d; bVal = b.percent_change_1d; break;
                case '1w': aVal = a.percent_change_1w; bVal = b.percent_change_1w; break;
                case '1m': aVal = a.percent_change_1m; bVal = b.percent_change_1m; break;
                case '6m': aVal = a.percent_change_6m; bVal = b.percent_change_6m; break;
                case 'ytd': aVal = a.percent_change_ytd; bVal = b.percent_change_ytd; break;
                case '1y': aVal = a.percent_change_1y; bVal = b.percent_change_1y; break;
            }

            if (aVal === null) return 1;
            if (bVal === null) return -1;
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            }
            return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
        });
    }, [sectors, sortColumn, sortDirection]);

    const isVisible = (col: string) => visibleColumns.includes(col);

    const SortHeader = ({ column, label, align = 'right' }: { column: string; label: string; align?: 'left' | 'right' | 'center' }) => (
        <TableHead
            className={cn(
                "cursor-pointer hover:text-foreground transition-colors h-10 select-none whitespace-nowrap bg-background sticky top-0 z-10",
                align === 'right' && "text-right",
                align === 'center' && "text-center",
                sortColumn === column && "text-primary font-semibold"
            )}
            onClick={() => handleSort(column)}
        >
            {label} {sortColumn === column && (sortDirection === 'asc' ? '↑' : '↓')}
        </TableHead>
    );

    return (
        <div className="h-full w-full overflow-auto">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-b border-border">
                        <SortHeader column="name" label={`Ngành (${sectors.length})`} align="left" />
                        {isVisible('marketCap') && <SortHeader column="market_cap" label="Vốn Hóa" />}
                        {isVisible('weight') && <SortHeader column="weight" label="Tỷ Trọng" />}
                        {isVisible('change') && <TableHead className="text-right h-10 bg-background sticky top-0 z-10">% Thay Đổi</TableHead>}
                        {isVisible('sparkline') && <TableHead className="text-center h-10 w-[160px] bg-background sticky top-0 z-10">20 Ngày Gần Nhất</TableHead>}
                        {isVisible('1w') && <SortHeader column="1w" label="1W" />}
                        {isVisible('1m') && <SortHeader column="1m" label="1M" />}
                        {isVisible('6m') && <SortHeader column="6m" label="6M" />}
                        {isVisible('ytd') && <SortHeader column="ytd" label="YTD" />}
                        {isVisible('1y') && <SortHeader column="1y" label="1Y" />}
                        {isVisible('2y') && <TableHead className="text-right h-10 bg-background sticky top-0 z-10">2Y</TableHead>}
                        {isVisible('5y') && <TableHead className="text-right h-10 bg-background sticky top-0 z-10">5Y</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {/* Total row */}
                    <TableRow className="bg-muted/10 font-medium hover:bg-muted/10">
                        <TableCell className="py-2.5 sticky left-0 bg-background/50 backdrop-blur-sm z-10">Tổng</TableCell>
                        {isVisible('marketCap') && <TableCell className="text-right py-2.5 tabular-nums">{formatMarketCap(totalMarketCap)}</TableCell>}
                        {isVisible('weight') && <TableCell className="text-right py-2.5 tabular-nums">100.00%</TableCell>}
                        {isVisible('change') && <TableCell className="text-right py-2.5">-</TableCell>}
                        {isVisible('sparkline') && <TableCell className="text-center py-2.5">-</TableCell>}
                        {/* Empty cells for timeframes */}
                        {[...Array(7)].map((_, i) => isVisible(['1w', '1m', '6m', 'ytd', '1y', '2y', '5y'][i]) && <TableCell key={i} className="py-2.5" />)}
                    </TableRow>

                    {/* Sector rows */}
                    {sortedSectors.map(sector => {
                        const weight = totalMarketCap > 0 ? ((sector.market_cap || 0) / totalMarketCap) * 100 : 0;
                        return (
                            <TableRow key={sector.icb_code} className="hover:bg-muted/40 transition-colors border-b border-border/50">
                                <TableCell className="py-3 font-medium sticky left-0 bg-background z-10 shadow-[1px_0_0_0_rgba(255,255,255,0.05)]">
                                    <button
                                        onClick={() => onSectorClick(sector.icb_code, sector.vi_sector || sector.en_sector || 'Sector')}
                                        className="text-left hover:text-primary hover:underline underline-offset-4 decoration-primary/50 transition-all truncate max-w-[200px]"
                                    >
                                        {sector.vi_sector || sector.en_sector}
                                    </button>
                                </TableCell>
                                {isVisible('marketCap') && <TableCell className="text-right py-2.5 tabular-nums text-muted-foreground">{formatMarketCap(sector.market_cap)}</TableCell>}
                                {isVisible('weight') && <TableCell className="text-right py-2.5 tabular-nums text-muted-foreground">{weight.toFixed(2)}%</TableCell>}
                                {isVisible('change') && (
                                    <TableCell className={cn("text-right py-2.5 tabular-nums font-medium",
                                        (sector.percent_change_1d ?? 0) > 0 ? "text-emerald-500" :
                                            (sector.percent_change_1d ?? 0) < 0 ? "text-rose-500" : "text-muted-foreground"
                                    )}>
                                        {formatPercent(sector.percent_change_1d)}
                                    </TableCell>
                                )}
                                {isVisible('sparkline') && (
                                    <TableCell className="py-1 px-2">
                                        <div className="flex justify-center">
                                            <Sparkline data={sector.last_20_day_index} />
                                        </div>
                                    </TableCell>
                                )}
                                {/* Timeframes */}
                                {[
                                    { key: '1w', val: sector.percent_change_1w },
                                    { key: '1m', val: sector.percent_change_1m },
                                    { key: '6m', val: sector.percent_change_6m },
                                    { key: 'ytd', val: sector.percent_change_ytd },
                                    { key: '1y', val: sector.percent_change_1y },
                                    { key: '2y', val: sector.percent_change_2y },
                                    { key: '5y', val: sector.percent_change_5y },
                                ].map(item => isVisible(item.key) && (
                                    <TableCell key={item.key} className={cn("text-right py-2.5 text-xs tabular-nums",
                                        (item.val ?? 0) > 0 ? "text-emerald-500" : (item.val ?? 0) < 0 ? "text-rose-500" : "text-muted-foreground"
                                    )}>
                                        {formatPercent(item.val)}
                                    </TableCell>
                                ))}
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
};

// ============== COMPANY VIEW ==============
const CompanyView = ({ icbCode, sectorName, onBack }: { icbCode: number, sectorName: string, onBack: () => void }) => {
    const [companies, setCompanies] = useState<SectorCompany[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sortColumn, setSortColumn] = useState<keyof SectorCompany>('marketCap');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    useEffect(() => {
        const fetch = async () => {
            setIsLoading(true);
            try {
                const data = await SectorAPI.getSectorCompanies(icbCode);
                setCompanies(data.companies || []);
            } catch (err) { console.error(err); }
            finally { setIsLoading(false); }
        };
        fetch();
    }, [icbCode]);

    const handleSort = (column: keyof SectorCompany) => {
        if (sortColumn === column) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('desc');
        }
    };

    const sortedCompanies = useMemo(() => {
        return [...companies].sort((a, b) => {
            const aVal = a[sortColumn];
            const bVal = b[sortColumn];
            if (aVal === null) return 1;
            if (bVal === null) return -1;
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            }
            return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
        });
    }, [companies, sortColumn, sortDirection]);

    const totalMarketCap = useMemo(() => companies.reduce((sum, c) => sum + (c.marketCap || 0), 0), [companies]);

    // Averages logic same as before...
    const averages = useMemo(() => {
        if (!companies.length) return null;
        const calcAvg = (key: keyof SectorCompany) => {
            const vals = companies.map(c => c[key] as number).filter(v => v !== null && v !== undefined && v !== 0);
            return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
        };
        return {
            ttmPe: calcAvg('ttmPe'),
            ttmPb: calcAvg('ttmPb'),
            roe: calcAvg('roe'),
            roa: calcAvg('roa'),
            ticker: 'Trung bình'
        };
    }, [companies]);

    if (isLoading) return <div className="h-64 flex items-center justify-center"><RefreshCcw className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

    const SortHeader = ({ column, label }: { column: keyof SectorCompany; label: string }) => (
        <TableHead
            className={cn("text-right cursor-pointer hover:text-foreground h-9", sortColumn === column && "text-primary")}
            onClick={() => handleSort(column)}
        >
            {label} {sortColumn === column && (sortDirection === 'asc' ? '↑' : '↓')}
        </TableHead>
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2">
                <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 pl-0 hover:pl-2 transition-all">
                    <ArrowLeft className="h-4 w-4" /> TRỞ LẠI
                </Button>
                <Separator orientation="vertical" className="h-4" />
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    {sectorName} <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{companies.length}</span>
                </h2>
            </div>

            <div className="rounded-md border border-border bg-card">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent">
                            <SortHeader column="ticker" label="Mã CP" />
                            <SortHeader column="marketCap" label="Vốn Hóa" />
                            <TableHead className="text-right">Tỷ Trọng</TableHead>
                            <SortHeader column="latestPrice" label="Giá" />
                            <SortHeader column="percentPriceChange" label="% Thay Đổi" />
                            <TableHead className="text-right">Room NN</TableHead>
                            <SortHeader column="ttmPe" label="P/E" />
                            <SortHeader column="ttmEps" label="EPS" />
                            <SortHeader column="ttmPb" label="P/B" />
                            <SortHeader column="roe" label="ROE" />
                            <SortHeader column="roa" label="ROA" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {/* Averages Row */}
                        {averages && (
                            <TableRow className="bg-muted/10 font-medium hover:bg-muted/10">
                                <TableCell className="text-right">Trung Bình</TableCell>
                                <TableCell className="text-right">-</TableCell>
                                <TableCell className="text-right">-</TableCell>
                                <TableCell className="text-right">-</TableCell>
                                <TableCell className="text-right">-</TableCell>
                                <TableCell className="text-right">-</TableCell>
                                <TableCell className="text-right tabular-nums">{averages.ttmPe?.toFixed(1) ?? '-'}</TableCell>
                                <TableCell className="text-right">-</TableCell>
                                <TableCell className="text-right tabular-nums">{averages.ttmPb?.toFixed(2) ?? '-'}</TableCell>
                                <TableCell className="text-right tabular-nums">{averages.roe ? (averages.roe * 100).toFixed(1) + '%' : '-'}</TableCell>
                                <TableCell className="text-right tabular-nums">{averages.roa ? (averages.roa * 100).toFixed(1) + '%' : '-'}</TableCell>
                            </TableRow>
                        )}
                        {sortedCompanies.map(c => {
                            const weight = totalMarketCap > 0 ? ((c.marketCap || 0) / totalMarketCap) * 100 : 0;
                            return (
                                <TableRow key={c.ticker} className="hover:bg-muted/40 text-sm">
                                    <TableCell className="font-bold text-primary text-right">{c.ticker}</TableCell>
                                    <TableCell className="text-right tabular-nums text-muted-foreground">{formatMarketCap(c.marketCap)}</TableCell>
                                    <TableCell className="text-right tabular-nums text-muted-foreground">{weight.toFixed(2)}%</TableCell>
                                    <TableCell className="text-right tabular-nums">{c.latestPrice?.toLocaleString('vi-VN') ?? '-'}</TableCell>
                                    <TableCell className={cn("text-right tabular-nums", (c.percentPriceChange ?? 0) > 0 ? "text-emerald-500" : (c.percentPriceChange ?? 0) < 0 ? "text-rose-500" : "text-muted-foreground")}>
                                        {formatPercent(c.percentPriceChange)}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums text-muted-foreground">{c.foreignRoom?.toLocaleString('vi-VN') ?? '-'}</TableCell>
                                    <TableCell className="text-right tabular-nums text-muted-foreground">{c.ttmPe?.toFixed(1) ?? '-'}</TableCell>
                                    <TableCell className="text-right tabular-nums text-muted-foreground">{c.ttmEps?.toLocaleString('vi-VN') ?? '-'}</TableCell>
                                    <TableCell className="text-right tabular-nums text-muted-foreground">{c.ttmPb?.toFixed(2) ?? '-'}</TableCell>
                                    <TableCell className="text-right tabular-nums text-muted-foreground">{c.roe ? (c.roe * 100).toFixed(1) + '%' : '-'}</TableCell>
                                    <TableCell className="text-right tabular-nums text-muted-foreground">{c.roa ? (c.roa * 100).toFixed(1) + '%' : '-'}</TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

// ============== MAIN PAGE ==============
export function SectorPage() {
    const [sectors, setSectors] = useState<SectorInfo[]>([]);
    const [rankings, setRankings] = useState<SectorRanking[]>([]);
    const [tradingDates, setTradingDates] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState('ranking');
    const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedSector, setSelectedSector] = useState<{ icbCode: number; name: string } | null>(null);

    // Settings state
    const [showSettings, setShowSettings] = useState(false);
    const [icbLevel, setIcbLevel] = useState(2);
    const [adtv, setAdtv] = useState(3);
    const [minValue, setMinValue] = useState(3);
    const [visibleColumns, setVisibleColumns] = useState(['marketCap', 'weight', 'change', 'sparkline', '1w', '1m', '6m', 'ytd', '1y', '2y', '5y']);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [sectorsData, rankingsData, datesData] = await Promise.all([
                SectorAPI.getSectorInformation(icbLevel),
                SectorAPI.getSectorRanking(icbLevel, adtv, minValue),
                SectorAPI.getTradingDates(),
            ]);
            setSectors(sectorsData.sectors || []);
            setRankings(rankingsData.rankings || []);
            setTradingDates(datesData.dates || []);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [icbLevel, adtv, minValue]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleApplySettings = () => {
        fetchData();
    };

    const handleSectorClick = (icbCode: number, name: string) => setSelectedSector({ icbCode, name });

    if (isLoading && !sectors.length) {
        return <div className="h-screen w-full flex items-center justify-center bg-background text-muted-foreground"><RefreshCcw className="h-10 w-10 animate-spin" /></div>;
    }

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-background text-foreground p-2 lg:p-4 gap-4">
            {/* Header / Breadcrumb - More Compact */}
            <div className="flex-none flex items-center justify-between">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/" className="text-muted-foreground hover:text-foreground transition-colors text-sm">IQX</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage className="font-semibold text-foreground text-sm">Phân tích ngành</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="flex items-center gap-2">
                    <div className="bg-muted/30 p-0.5 rounded-lg flex items-center border border-border">
                        <Button
                            variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setViewMode('table')}
                        >
                            <Table2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            variant={viewMode === 'chart' ? 'secondary' : 'ghost'}
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setViewMode('chart')}
                        >
                            <BarChart3 className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setShowSettings(true)}>
                        <Settings className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={fetchData}>
                        <RefreshCcw className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            {/* Main Content - FLAT LAYOUT */}
            <div className="flex-1 overflow-hidden min-h-0 bg-background border border-border rounded-lg shadow-sm">
                {selectedSector ? (
                    <ScrollArea className="h-full p-4">
                        <CompanyView icbCode={selectedSector.icbCode} sectorName={selectedSector.name} onBack={() => setSelectedSector(null)} />
                    </ScrollArea>
                ) : (
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                        <div className="flex-none border-b border-border bg-muted/5 px-2">
                            <TabsList className="bg-transparent p-0 h-10 gap-2">
                                <TabsTrigger
                                    value="ranking"
                                    className="px-4 h-9 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary font-medium"
                                >
                                    Xếp Hạng
                                </TabsTrigger>
                                <TabsTrigger
                                    value="info"
                                    className="px-4 h-9 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary font-medium"
                                >
                                    Thông Tin
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex-1 overflow-hidden relative bg-background">
                            <TabsContent value="ranking" className="h-full mt-0 absolute inset-0 overflow-auto">
                                <RankingTab rankings={rankings} tradingDates={tradingDates} onSectorClick={handleSectorClick} />
                            </TabsContent>
                            <TabsContent value="info" className="h-full mt-0 absolute inset-0 overflow-auto">
                                <InfoTab sectors={sectors} onSectorClick={handleSectorClick} visibleColumns={visibleColumns} />
                            </TabsContent>
                        </div>
                    </Tabs>
                )}
            </div>

            {/* Modal */}
            <SettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                activeTab={activeTab as 'ranking' | 'info'}
                icbLevel={icbLevel} setIcbLevel={setIcbLevel}
                adtv={adtv} setAdtv={setAdtv}
                minValue={minValue} setMinValue={setMinValue}
                visibleColumns={visibleColumns} setVisibleColumns={setVisibleColumns}
                onApply={handleApplySettings}
            />
        </div>
    );
}

export default SectorPage;
