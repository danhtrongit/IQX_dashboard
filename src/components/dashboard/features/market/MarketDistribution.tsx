import { useState, useEffect, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    LabelList
} from "recharts";
import { RefreshCcw, AlertCircle, ChevronRight, ChevronDown } from "lucide-react";
import { MarketAPI, type AllocatedValueResponse, type AllocatedICBResponse, type AllocatedICBItem, type MarketGroup } from "@/lib/market-api";
import { SectorDetailModal } from "./SectorDetailModal";

// --- Types ---

type Timeframe = '1D' | '1W' | '1M' | 'YTD' | '1Y';

interface DistributionData {
    moneyFlow: {
        increase: number;
        decrease: number;
        unchanged: number;
    };
    quantity: {
        increase: number;
        decrease: number;
        unchanged: number;
    };
}

interface HierarchicalSector {
    id: string;
    code: string;
    name: string;
    level: number;
    change: number;
    value: number;
    stockUp: number;
    stockDown: number;
    stockUnchanged: number;
    children: HierarchicalSector[];
    parentCode: string | null;
}

const COLORS = {
    increase: '#00c076',
    decrease: '#ff3a3a',
    unchanged: '#fbbf24',
};

// --- Helper Functions ---

// Get parent code based on ICB hierarchy
const getParentCode = (code: string, level: number): string | null => {
    if (level === 1) return null;

    // ICB hierarchy: 
    // Level 1: X000 (e.g., 1000, 2000, 8000)
    // Level 2: XX00 (e.g., 1300, 8300)
    // Level 3: XXX0 (e.g., 1350, 8350)
    // Level 4: XXXX (e.g., 1353, 8355)

    const numCode = parseInt(code);

    if (level === 2) {
        // Parent is level 1, round down to nearest 1000
        return String(Math.floor(numCode / 1000) * 1000);
    } else if (level === 3) {
        // Parent is level 2, round down to nearest 100
        return String(Math.floor(numCode / 100) * 100);
    } else if (level === 4) {
        // Parent is level 3, round down to nearest 10
        return String(Math.floor(numCode / 10) * 10);
    }

    return null;
};

const parseAllocatedValue = (data: AllocatedValueResponse): DistributionData => {
    const defaultResult: DistributionData = {
        moneyFlow: { increase: 0, decrease: 0, unchanged: 0 },
        quantity: { increase: 0, decrease: 0, unchanged: 0 },
    };

    if (!data?.data || data.data.length === 0) return defaultResult;

    const item = data.data[0];

    const getFirstValue = (arr: Array<{ group: string;[key: string]: number | string }>) => {
        if (!arr || arr.length === 0) return 0;
        const first = arr[0];
        for (const key of Object.keys(first)) {
            if (key !== 'group' && typeof first[key] === 'number') {
                return first[key] as number;
            }
        }
        return 0;
    };

    return {
        moneyFlow: {
            increase: getFirstValue(item.totalIncrease) / 1e9,
            decrease: Math.abs(getFirstValue(item.totalDecrease) / 1e9),
            unchanged: getFirstValue(item.totalNochange) / 1e9,
        },
        quantity: {
            increase: getFirstValue(item.totalSymbolIncrease),
            decrease: getFirstValue(item.totalSymbolDecrease),
            unchanged: getFirstValue(item.totalSymbolNochange),
        }
    };
};

const parseAllocatedICBHierarchical = (data: AllocatedICBResponse): HierarchicalSector[] => {
    if (!data?.data) return [];

    // Create a map of all sectors from API data
    const apiDataMap = new Map<string, AllocatedICBItem>();
    data.data.forEach(item => {
        apiDataMap.set(String(item.icb_code), item);
    });

    // Create hierarchical structure
    const sectorMap = new Map<string, HierarchicalSector>();
    const rootSectors: HierarchicalSector[] = [];

    // Process all API data items
    data.data.forEach(item => {
        const code = String(item.icb_code);
        const level = item.icb_level || 1;
        const parentCode = getParentCode(code, level);

        const sector: HierarchicalSector = {
            id: code,
            code: code,
            name: item.sector_name_vi || `ICB ${code}`,
            level: level,
            change: item.icbChangePercent || 0,
            value: (item.totalValue || 0) / 1e9,
            stockUp: item.totalStockIncrease || 0,
            stockDown: item.totalStockDecrease || 0,
            stockUnchanged: item.totalStockNoChange || 0,
            children: [],
            parentCode: parentCode,
        };

        sectorMap.set(code, sector);

        if (level === 1) {
            rootSectors.push(sector);
        }
    });

    // Build parent-child relationships
    sectorMap.forEach((sector) => {
        if (sector.parentCode && sectorMap.has(sector.parentCode)) {
            const parent = sectorMap.get(sector.parentCode)!;
            parent.children.push(sector);
        }
    });

    // Sort root sectors by value descending
    rootSectors.sort((a, b) => b.value - a.value);

    // Sort children by value
    const sortChildren = (sectors: HierarchicalSector[]) => {
        sectors.forEach(s => {
            s.children.sort((a, b) => b.value - a.value);
            sortChildren(s.children);
        });
    };
    sortChildren(rootSectors);

    return rootSectors;
};

// --- Helper Components ---

const FilterControls = ({
    timeframe,
    setTimeframe,
    group,
    setGroup,
    isLoading,
    onRefresh,
}: {
    timeframe: Timeframe;
    setTimeframe: (t: Timeframe) => void;
    group: MarketGroup;
    setGroup: (g: MarketGroup) => void;
    isLoading: boolean;
    onRefresh: () => void;
}) => (
    <div className="flex items-center gap-2">
        <div className="flex items-center bg-secondary/40 rounded-sm p-0.5 border border-border/40">
            {(['1D', '1W', '1M', 'YTD', '1Y'] as Timeframe[]).map((tf) => (
                <Button
                    key={tf}
                    variant="ghost"
                    onClick={() => setTimeframe(tf)}
                    className={cn(
                        "h-5 min-h-[20px] text-[10px] font-medium px-2 py-0 rounded-sm transition-all",
                        timeframe === tf
                            ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                >
                    {tf === '1D' ? 'Hôm nay' : tf}
                </Button>
            ))}
        </div>
        <Select value={group} onValueChange={(v) => setGroup(v as MarketGroup)}>
            <SelectTrigger className="!h-[26px] !min-h-[26px] w-[80px] !text-[10px] font-medium bg-background border-border/60 focus:ring-0 !px-2 !py-0 [&_svg]:!size-3 !gap-1">
                <SelectValue placeholder="Nhóm" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="HOSE">HOSE</SelectItem>
                <SelectItem value="HNX">HNX</SelectItem>
                <SelectItem value="UPCOME">UPCOM</SelectItem>
                <SelectItem value="ALL">Tất cả</SelectItem>
            </SelectContent>
        </Select>
        <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onRefresh}
            disabled={isLoading}
        >
            <RefreshCcw className={cn("h-3 w-3", isLoading && "animate-spin")} />
        </Button>
    </div>
);

const RoundedBar = (props: any) => {
    const { x, y, width, height, fill } = props;
    const radius = 3;
    return (
        <rect x={x} y={y} width={width} height={height} fill={fill} rx={radius} ry={radius} />
    );
};

const renderCustomBarLabel = (props: any) => {
    const { x, y, width, value } = props;
    const formattedValue = value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value.toFixed(0);
    return (
        <text x={x + width / 2} y={y - 6} fill="#a1a1aa" textAnchor="middle" fontSize={9} fontWeight={500}>
            {formattedValue}
        </text>
    );
};

const LoadingPlaceholder = () => (
    <div className="flex items-center justify-center h-full">
        <RefreshCcw className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
);

const ErrorPlaceholder = ({ message }: { message?: string }) => (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
        <AlertCircle className="h-5 w-5" />
        <span className="text-xs">{message || 'Không có dữ liệu'}</span>
    </div>
);

// Hierarchical Sector Row Component
const SectorRow = ({
    sector,
    expandedIds,
    toggleExpand,
    onSectorClick,
    depth = 0
}: {
    sector: HierarchicalSector;
    expandedIds: Set<string>;
    toggleExpand: (id: string) => void;
    onSectorClick: (sector: HierarchicalSector) => void;
    depth?: number;
}) => {
    const hasChildren = sector.children.length > 0;
    const isExpanded = expandedIds.has(sector.id);
    const totalStocks = sector.stockUp + sector.stockDown + sector.stockUnchanged;

    // Indentation based on depth
    const paddingLeft = 8 + depth * 16;

    return (
        <>
            <tr className="border-b border-border/20 hover:bg-accent/5 cursor-pointer transition-colors group">
                <td
                    className="p-2 text-[10px] font-medium text-foreground"
                    style={{ paddingLeft: `${paddingLeft}px` }}
                >
                    <div className="flex items-center gap-1">
                        {hasChildren ? (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleExpand(sector.id);
                                }}
                                className="p-0.5 hover:bg-accent rounded-sm transition-colors"
                            >
                                {isExpanded ? (
                                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                ) : (
                                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                )}
                            </button>
                        ) : (
                            <span className="w-4" /> // Spacer for alignment
                        )}
                        <span
                            className={cn(
                                "hover:underline cursor-pointer",
                                depth === 0 && "font-bold",
                                depth === 1 && "font-medium",
                                depth >= 2 && "text-muted-foreground"
                            )}
                            onClick={(e) => {
                                e.stopPropagation();
                                onSectorClick(sector);
                            }}
                        >
                            {sector.name}
                        </span>
                    </div>
                </td>
                <td className={cn(
                    "p-2 text-[10px] font-medium text-right",
                    sector.change >= 0 ? "text-[#00c076]" : "text-[#ff3a3a]"
                )}>
                    {sector.change > 0 ? '+' : ''}{sector.change.toFixed(2)}%
                </td>
                <td className="p-2 text-[10px] text-muted-foreground font-mono text-right">
                    {sector.value.toFixed(0)}
                </td>
                <td className="p-2 align-middle">
                    <div className="h-2 w-full flex rounded-full overflow-hidden bg-accent/20">
                        {totalStocks > 0 && (
                            <>
                                <div
                                    style={{ width: `${(sector.stockUp / totalStocks) * 100}%` }}
                                    className="bg-[#00c076] h-full transition-all"
                                    title={`Tăng: ${sector.stockUp}`}
                                />
                                <div
                                    style={{ width: `${(sector.stockUnchanged / totalStocks) * 100}%` }}
                                    className="bg-[#fbbf24] h-full transition-all"
                                    title={`Đứng giá: ${sector.stockUnchanged}`}
                                />
                                <div
                                    style={{ width: `${(sector.stockDown / totalStocks) * 100}%` }}
                                    className="bg-[#ff3a3a] h-full transition-all"
                                    title={`Giảm: ${sector.stockDown}`}
                                />
                            </>
                        )}
                    </div>
                </td>
            </tr>
            {/* Render children if expanded */}
            {isExpanded && sector.children.map(child => (
                <SectorRow
                    key={child.id}
                    sector={child}
                    expandedIds={expandedIds}
                    toggleExpand={toggleExpand}
                    onSectorClick={onSectorClick}
                    depth={depth + 1}
                />
            ))}
        </>
    );
};

// --- Main Component ---

export function MarketDistribution() {
    const [timeframe, setTimeframe] = useState<Timeframe>('1W');
    const [group, setGroup] = useState<MarketGroup>('HOSE');
    const [isLoading, setIsLoading] = useState(false);

    // Data states
    const [distribution, setDistribution] = useState<DistributionData | null>(null);
    const [sectors, setSectors] = useState<HierarchicalSector[]>([]);
    const [loadingDistribution, setLoadingDistribution] = useState(false);
    const [loadingSectors, setLoadingSectors] = useState(false);

    // Expanded state for hierarchical sectors
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    // Modal state
    const [selectedSector, setSelectedSector] = useState<HierarchicalSector | null>(null);

    const handleSectorClick = useCallback((sector: HierarchicalSector) => {
        setSelectedSector(sector);
    }, []);

    const closeModal = useCallback(() => {
        setSelectedSector(null);
    }, []);

    const toggleExpand = useCallback((id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const fetchData = useCallback(async () => {
        setIsLoading(true);

        // Fetch Allocated Value (Distribution)
        setLoadingDistribution(true);
        try {
            const valueData = await MarketAPI.getAllocatedValue(group, timeframe);
            setDistribution(parseAllocatedValue(valueData));
        } catch (error) {
            console.error('Failed to fetch allocated value:', error);
            setDistribution(null);
        } finally {
            setLoadingDistribution(false);
        }

        // Fetch Allocated ICB (Sectors)
        setLoadingSectors(true);
        try {
            const icbData = await MarketAPI.getAllocatedICB(group, timeframe);
            setSectors(parseAllocatedICBHierarchical(icbData));
        } catch (error) {
            console.error('Failed to fetch allocated ICB:', error);
            setSectors([]);
        } finally {
            setLoadingSectors(false);
        }

        setIsLoading(false);
    }, [timeframe, group]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Bar chart data for money flow
    const barData = useMemo(() => {
        if (!distribution) return [];
        return [
            { name: 'Tăng', value: distribution.moneyFlow.increase, fill: COLORS.increase },
            { name: 'KC', value: distribution.moneyFlow.unchanged, fill: COLORS.unchanged },
            { name: 'Giảm', value: distribution.moneyFlow.decrease, fill: COLORS.decrease },
        ];
    }, [distribution]);

    // Pie chart data for quantity
    const pieData = useMemo(() => {
        if (!distribution) return [];
        return [
            { name: 'Tăng', value: distribution.quantity.increase, color: COLORS.increase },
            { name: 'Giảm', value: distribution.quantity.decrease, color: COLORS.decrease },
            { name: 'KC', value: distribution.quantity.unchanged, color: COLORS.unchanged },
        ];
    }, [distribution]);

    const totalStocks = useMemo(() =>
        pieData.reduce((a, b) => a + b.value, 0),
        [pieData]
    );

    return (
        <>
            <div className="w-full flex flex-col gap-3 font-sans text-foreground p-1">

                {/* --- Section Header & Shared Controls --- */}
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                            Tổng quan thị trường
                        </span>
                        {isLoading && <RefreshCcw className="h-3 w-3 animate-spin text-muted-foreground" />}
                    </div>

                    <FilterControls
                        timeframe={timeframe}
                        setTimeframe={setTimeframe}
                        group={group}
                        setGroup={setGroup}
                        isLoading={isLoading}
                        onRefresh={fetchData}
                    />
                </div>

                {/* --- Content Grid --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 h-[380px]">

                    {/* --- Card 1: Phân bố (Distribution) --- */}
                    <div className="flex flex-col bg-card border border-border/40 rounded-md overflow-hidden relative">
                        <div className="h-8 px-3 border-b border-border/40 flex items-center justify-between bg-accent/5">
                            <span className="text-xs font-bold text-foreground">Phân bố</span>
                        </div>

                        {loadingDistribution ? (
                            <LoadingPlaceholder />
                        ) : !distribution ? (
                            <ErrorPlaceholder />
                        ) : (
                            <div className="flex-1 grid grid-cols-2 p-3 gap-2">

                                {/* A. Bar Chart: Money Flow */}
                                <div className="flex flex-col h-full">
                                    <h4 className="text-[10px] text-muted-foreground font-medium mb-1 text-center">Dòng tiền (Tỷ)</h4>
                                    <div className="flex-1 w-full min-h-0">
                                        <ResponsiveContainer width="100%" height={200}>
                                            <BarChart
                                                data={barData}
                                                margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
                                                barCategoryGap="25%"
                                            >
                                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 20%)" vertical={false} />
                                                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                                                <YAxis hide domain={[0, 'dataMax + 1000']} />
                                                <RechartsTooltip
                                                    contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#333', fontSize: '10px', borderRadius: '4px' }}
                                                    itemStyle={{ color: '#fff' }}
                                                    formatter={(value: number) => [`${value.toFixed(0)} Tỷ`, 'Giá trị']}
                                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                />
                                                <Bar dataKey="value" shape={<RoundedBar />} isAnimationActive={true} animationDuration={500}>
                                                    {barData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                                    ))}
                                                    <LabelList dataKey="value" position="top" content={renderCustomBarLabel} />
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* B. Donut Chart: Quantity */}
                                <div className="flex flex-col h-full items-center relative">
                                    <h4 className="text-[10px] text-muted-foreground font-medium mb-1 text-center">Số lượng Cổ phiếu</h4>
                                    <div className="flex-1 w-full relative min-h-0">
                                        <ResponsiveContainer width="100%" height={180}>
                                            <PieChart>
                                                <Pie data={pieData} innerRadius={30} outerRadius={50} paddingAngle={2} dataKey="value" stroke="none" isAnimationActive={true} animationDuration={500}>
                                                    {pieData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip
                                                    contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#333', fontSize: '10px', borderRadius: '4px' }}
                                                    itemStyle={{ color: '#fff' }}
                                                    formatter={(value: number, name: string) => [value, name]}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                            <span className="text-sm font-bold text-foreground">{totalStocks}</span>
                                            <div className="text-[8px] text-muted-foreground">CP</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-[9px] text-muted-foreground mt-auto pb-1">
                                        {pieData.map(d => (
                                            <div key={d.name} className="flex items-center gap-1">
                                                <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                                                <span>{d.name}: {d.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </div>
                        )}
                    </div>

                    {/* --- Card 2: Ngành (Industry) - Hierarchical --- */}
                    <div className="flex flex-col bg-card border border-border/40 rounded-md overflow-hidden">
                        <div className="h-8 px-3 border-b border-border/40 flex items-center justify-between bg-accent/5">
                            <span className="text-xs font-bold text-foreground">Ngành</span>
                            <span className="text-[9px] text-muted-foreground">Bấm + để mở rộng</span>
                        </div>

                        {loadingSectors ? (
                            <LoadingPlaceholder />
                        ) : sectors.length === 0 ? (
                            <ErrorPlaceholder />
                        ) : (
                            <div className="flex-1 overflow-auto p-0">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-accent/5 sticky top-0 z-10 backdrop-blur-sm">
                                        <tr className="text-[9px] text-muted-foreground border-b border-border/40">
                                            <th className="font-medium p-2 pl-3">Ngành</th>
                                            <th className="font-medium p-2 text-right">Biến động</th>
                                            <th className="font-medium p-2 text-right">Giá trị (Tỷ)</th>
                                            <th className="font-medium p-2 w-[25%]">CP Tăng/Giảm</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sectors.map((sector) => (
                                            <SectorRow
                                                key={sector.id}
                                                sector={sector}
                                                expandedIds={expandedIds}
                                                toggleExpand={toggleExpand}
                                                onSectorClick={handleSectorClick}
                                                depth={0}
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {/* Sector Detail Modal */}
            {
                selectedSector && (
                    <SectorDetailModal
                        isOpen={!!selectedSector}
                        onClose={closeModal}
                        sectorCode={selectedSector.code}
                        sectorName={selectedSector.name}
                        sectorChange={selectedSector.change}
                        sectorValue={selectedSector.value}
                        stockUp={selectedSector.stockUp}
                        stockDown={selectedSector.stockDown}
                        stockUnchanged={selectedSector.stockUnchanged}
                        group={group}
                        timeframe={timeframe}
                    />
                )
            }
        </>
    );
}
