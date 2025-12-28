import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";

// Mock Data Generation
const generateData = (count: number) => {
    const data = [];
    let price = 1250;
    for (let i = 0; i < count; i++) {
        const change = (Math.random() - 0.5) * 10;
        price += change;
        data.push({
            time: `10:${i < 10 ? '0' + i : i}`,
            price: price,
            volume: Math.floor(Math.random() * 10000) + 1000,
            indicator: Math.sin(i / 5) * 20 + 50,
        });
    }
    return data;
};

const data = generateData(60);

const ChartHeader = () => (
    <div className="flex items-center justify-between px-4 py-2 border-b border-border/40 bg-background/50">
        <div className="flex items-center gap-4">
            <div className="flex flex-col">
                <span className="font-bold text-lg">VNINDEX</span>
                <div className="flex gap-2 text-xs text-muted-foreground">
                    <span className="bg-accent px-1 rounded">1D</span>
                    <span>HOSE</span>
                </div>
            </div>

            <div className="flex gap-4 text-xs font-mono">
                <div className="flex gap-1"><span className="text-muted-foreground">O:</span><span className="text-[#00c076]">1245.20</span></div>
                <div className="flex gap-1"><span className="text-muted-foreground">H:</span><span className="text-[#00c076]">1255.50</span></div>
                <div className="flex gap-1"><span className="text-muted-foreground">L:</span><span className="text-[#ff3a3a]">1240.10</span></div>
                <div className="flex gap-1"><span className="text-muted-foreground">C:</span><span className="text-[#00c076]">1250.68</span></div>
                <div className="flex gap-1"><span className="text-[#00c076]">+12.5 (1.01%)</span></div>
            </div>
        </div>
        <div className="text-xs text-muted-foreground">
            Khối lượng: <span className="text-foreground font-mono">850.5M</span>
        </div>
    </div>
)

const TimeControls = () => {
    const times = ["1p", "5p", "15p", "30p", "1H", "4H", "1D", "1W"];
    return (
        <div className="flex items-center justify-between px-4 py-1 border-t border-border/40 bg-background/50 text-xs">
            <div className="flex gap-1">
                {times.map(t => (
                    <Button key={t} variant={t === "1D" ? "secondary" : "ghost"} size="sm" className="h-6 px-2 text-[10px]">{t}</Button>
                ))}
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
                <span>10:30:45 (UTC+7)</span>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-[#00c076]" />
                    <span>Tự động</span>
                </div>
            </div>
        </div>
    )
}

export function ChartCanvas() {
    return (
        <div className="flex flex-col h-full bg-background border-r border-border/40 relative overflow-hidden">
            <ChartHeader />

            {/* Main Chart Area - Flex Grow */}
            <div className="flex-1 relative min-h-0 bg-gradient-to-b from-background to-accent/5">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00c076" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#00c076" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(var(--border)/0.3)" />
                        <XAxis dataKey="time" hide />
                        <YAxis
                            orientation="right"
                            domain={['auto', 'auto']}
                            tick={{ fontSize: 10, fill: 'oklch(var(--muted-foreground))' }}
                            axisLine={false}
                            tickLine={false}
                            width={50}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'oklch(var(--popover))', borderColor: 'oklch(var(--border))', borderRadius: '8px' }}
                            itemStyle={{ color: 'oklch(var(--foreground))' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="price"
                            stroke="#00c076"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorPrice)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Volume Area - Fixed Height */}
            <div className="h-32 border-t border-border/40 relative">
                <div className="absolute top-1 left-2 text-[10px] text-muted-foreground z-10">Vol</div>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(var(--border)/0.3)" />
                        <XAxis dataKey="time" hide />
                        <YAxis
                            orientation="right"
                            tick={{ fontSize: 10, fill: 'oklch(var(--muted-foreground))' }}
                            axisLine={false}
                            tickLine={false}
                            width={50}
                        />
                        <Bar dataKey="volume" fill="#3b82f6" opacity={0.5} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Indicator Area - Fixed Height */}
            <div className="h-24 border-t border-border/40 relative">
                <div className="absolute top-1 left-2 text-[10px] text-muted-foreground z-10">RSI (14)</div>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(var(--border)/0.3)" />
                        <XAxis
                            dataKey="time"
                            tick={{ fontSize: 10, fill: 'oklch(var(--muted-foreground))' }}
                            axisLine={false}
                            tickLine={false}
                            minTickGap={30}
                        />
                        <YAxis
                            orientation="right"
                            domain={[0, 100]}
                            tick={{ fontSize: 10, fill: 'oklch(var(--muted-foreground))' }}
                            axisLine={false}
                            tickLine={false}
                            width={50}
                            ticks={[30, 70]}
                        />
                        <Area type="monotone" dataKey="indicator" stroke="#a855f7" fill="transparent" strokeWidth={1.5} dot={false} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <TimeControls />
        </div>
    );
}
