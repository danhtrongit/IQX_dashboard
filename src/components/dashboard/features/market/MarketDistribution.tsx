import { useState, useMemo } from "react";
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

// --- Types & Mock Data ---

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

interface SectorData {
    id: string;
    name: string;
    change: number;
    value: number;
    flow: {
        buy: number;
        neutral: number;
        sell: number;
    };
}

const MOCK_DISTRIBUTION: DistributionData = {
    moneyFlow: { increase: 12500, decrease: 4300, unchanged: 1200 },
    quantity: { increase: 280, decrease: 150, unchanged: 65 },
};

const MOCK_SECTORS: SectorData[] = [
    { id: '1', name: "Ngân hàng", change: 1.25, value: 5400, flow: { buy: 3400, neutral: 500, sell: 1500 } },
    { id: '2', name: "Bất động sản", change: -0.45, value: 3200, flow: { buy: 800, neutral: 400, sell: 2000 } },
    { id: '3', name: "Chứng khoán", change: 2.15, value: 2100, flow: { buy: 1500, neutral: 200, sell: 400 } },
    { id: '4', name: "Thép", change: 0.85, value: 1800, flow: { buy: 900, neutral: 300, sell: 600 } },
    { id: '5', name: "Bán lẻ", change: -1.10, value: 950, flow: { buy: 200, neutral: 150, sell: 600 } },
    { id: '6', name: "Dầu khí", change: 0.50, value: 870, flow: { buy: 500, neutral: 100, sell: 270 } },
    { id: '7', name: "Điện nước", change: 0.10, value: 450, flow: { buy: 200, neutral: 50, sell: 200 } },
];

const COLORS = {
    increase: '#00c076',
    decrease: '#ff3a3a',
    unchanged: '#fbbf24',
};

// --- Helper Components ---

const FilterControls = ({
    timeframe,
    setTimeframe,
    group,
    setGroup
}: {
    timeframe: Timeframe;
    setTimeframe: (t: Timeframe) => void;
    group: string;
    setGroup: (g: string) => void;
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
        <Select value={group} onValueChange={setGroup}>
            <SelectTrigger className="!h-[26px] !min-h-[26px] w-[80px] !text-[10px] font-medium bg-background border-border/60 focus:ring-0 !px-2 !py-0 [&_svg]:!size-3 !gap-1">
                <SelectValue placeholder="Nhóm" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="ALL">Tất cả</SelectItem>
                <SelectItem value="VN30">VN30</SelectItem>
                <SelectItem value="HOSE">HOSE</SelectItem>
                <SelectItem value="HNX">HNX</SelectItem>
                <SelectItem value="UPCOM">UPCOM</SelectItem>
            </SelectContent>
        </Select>
    </div>
);

// Custom Bar Shape with rounded top
const RoundedBar = (props: any) => {
    const { x, y, width, height, fill } = props;
    const radius = 3;
    return (
        <rect
            x={x}
            y={y}
            width={width}
            height={height}
            fill={fill}
            rx={radius}
            ry={radius}
        />
    );
};

// Custom Label for bar values
const renderCustomBarLabel = (props: any) => {
    const { x, y, width, value } = props;
    const formattedValue = value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value;
    return (
        <text
            x={x + width / 2}
            y={y - 6}
            fill="#a1a1aa"
            textAnchor="middle"
            fontSize={9}
            fontWeight={500}
        >
            {formattedValue}
        </text>
    );
};

// --- Main Component ---

export function MarketDistribution() {
    const [timeframe, setTimeframe] = useState<Timeframe>('1D');
    const [group, setGroup] = useState<string>('HOSE');

    // Bar chart data for money flow
    const barData = useMemo(() => [
        { name: 'Tăng', value: MOCK_DISTRIBUTION.moneyFlow.increase, fill: COLORS.increase },
        { name: 'KC', value: MOCK_DISTRIBUTION.moneyFlow.unchanged, fill: COLORS.unchanged },
        { name: 'Giảm', value: MOCK_DISTRIBUTION.moneyFlow.decrease, fill: COLORS.decrease },
    ], []);

    // Pie chart data for quantity
    const pieData = useMemo(() => [
        { name: 'Tăng', value: MOCK_DISTRIBUTION.quantity.increase, color: COLORS.increase },
        { name: 'Giảm', value: MOCK_DISTRIBUTION.quantity.decrease, color: COLORS.decrease },
        { name: 'KC', value: MOCK_DISTRIBUTION.quantity.unchanged, color: COLORS.unchanged },
    ], []);

    return (
        <div className="w-full flex flex-col gap-3 font-sans text-foreground p-1">

            {/* --- Section Header & Shared Controls --- */}
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Tổng quan thị trường</span>
                </div>

                <FilterControls
                    timeframe={timeframe}
                    setTimeframe={setTimeframe}
                    group={group}
                    setGroup={setGroup}
                />
            </div>

            {/* --- Content Grid --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 h-[380px]">

                {/* --- Card 1: Phân bố (Distribution) --- */}
                <div className="flex flex-col bg-card border border-border/40 rounded-md overflow-hidden relative">
                    <div className="h-8 px-3 border-b border-border/40 flex items-center justify-between bg-accent/5">
                        <span className="text-xs font-bold text-foreground">Phân bố</span>
                    </div>

                    <div className="flex-1 grid grid-cols-2 p-3 gap-2">

                        {/* A. Bar Chart: Money Flow - Using Recharts */}
                        <div className="flex flex-col h-full">
                            <h4 className="text-[10px] text-muted-foreground font-medium mb-1 text-center">Dòng tiền (Tỷ)</h4>
                            <div className="flex-1 w-full min-h-0">
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart
                                        data={barData}
                                        margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
                                        barCategoryGap="25%"
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="hsl(0 0% 20%)"
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey="name"
                                            tick={{ fontSize: 9, fill: '#a1a1aa' }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            hide
                                            domain={[0, 'dataMax + 1000']}
                                        />
                                        <RechartsTooltip
                                            contentStyle={{
                                                backgroundColor: '#1e1e1e',
                                                borderColor: '#333',
                                                fontSize: '10px',
                                                borderRadius: '4px'
                                            }}
                                            itemStyle={{ color: '#fff' }}
                                            formatter={(value: number) => [`${(value / 1000).toFixed(1)}K Tỷ`, 'Giá trị']}
                                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        />
                                        <Bar
                                            dataKey="value"
                                            shape={<RoundedBar />}
                                            isAnimationActive={true}
                                            animationDuration={500}
                                        >
                                            {barData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                            <LabelList
                                                dataKey="value"
                                                position="top"
                                                content={renderCustomBarLabel}
                                            />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* B. Donut Chart: Quantity - Using Recharts */}
                        <div className="flex flex-col h-full items-center relative">
                            <h4 className="text-[10px] text-muted-foreground font-medium mb-1 text-center">Số lượng Cổ phiếu</h4>
                            <div className="flex-1 w-full relative min-h-0">
                                <ResponsiveContainer width="100%" height={180}>
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            innerRadius={30}
                                            outerRadius={50}
                                            paddingAngle={2}
                                            dataKey="value"
                                            stroke="none"
                                            isAnimationActive={true}
                                            animationDuration={500}
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip
                                            contentStyle={{
                                                backgroundColor: '#1e1e1e',
                                                borderColor: '#333',
                                                fontSize: '10px',
                                                borderRadius: '4px'
                                            }}
                                            itemStyle={{ color: '#fff' }}
                                            formatter={(value: number, name: string) => [value, name]}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* Centered Total */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                    <span className="text-sm font-bold text-foreground">
                                        {pieData.reduce((a, b) => a + b.value, 0)}
                                    </span>
                                    <div className="text-[8px] text-muted-foreground">CP</div>
                                </div>
                            </div>

                            {/* Legend */}
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
                </div>

                {/* --- Card 2: Ngành (Industry) --- */}
                <div className="flex flex-col bg-card border border-border/40 rounded-md overflow-hidden">
                    <div className="h-8 px-3 border-b border-border/40 flex items-center justify-between bg-accent/5">
                        <span className="text-xs font-bold text-foreground">Ngành</span>
                        <span className="text-[9px] text-muted-foreground">Top giá trị</span>
                    </div>

                    <div className="flex-1 overflow-auto p-0">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-accent/5 sticky top-0 z-10 backdrop-blur-sm">
                                <tr className="text-[9px] text-muted-foreground border-b border-border/40">
                                    <th className="font-medium p-2 pl-3">Ngành</th>
                                    <th className="font-medium p-2 text-right">Biến động</th>
                                    <th className="font-medium p-2 text-right">Giá trị</th>
                                    <th className="font-medium p-2 w-[30%]">Dòng tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                {MOCK_SECTORS.map((sector) => (
                                    <tr
                                        key={sector.id}
                                        className="border-b border-border/20 hover:bg-accent/5 cursor-pointer transition-colors group"
                                    >
                                        <td className="p-2 pl-3 text-[10px] font-medium text-foreground">{sector.name}</td>
                                        <td className={cn(
                                            "p-2 text-[10px] font-medium text-right",
                                            sector.change >= 0 ? "text-[#00c076]" : "text-[#ff3a3a]"
                                        )}>
                                            {sector.change > 0 ? '+' : ''}{sector.change}%
                                        </td>
                                        <td className="p-2 text-[10px] text-muted-foreground font-mono text-right">
                                            {sector.value.toLocaleString()}
                                        </td>
                                        <td className="p-2 align-middle">
                                            <div className="h-2 w-full flex rounded-full overflow-hidden bg-accent/20">
                                                <div
                                                    style={{ width: `${(sector.flow.buy / sector.value) * 100}%` }}
                                                    className="bg-[#00c076] h-full transition-all"
                                                    title={`Mua: ${sector.flow.buy}`}
                                                />
                                                <div
                                                    style={{ width: `${(sector.flow.neutral / sector.value) * 100}%` }}
                                                    className="bg-[#fbbf24] h-full transition-all"
                                                    title={`Trung lập: ${sector.flow.neutral}`}
                                                />
                                                <div
                                                    style={{ width: `${(sector.flow.sell / sector.value) * 100}%` }}
                                                    className="bg-[#ff3a3a] h-full transition-all"
                                                    title={`Bán: ${sector.flow.sell}`}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}

