"use client";

import { useState, useEffect } from "react";
import { Loader2, TrendingUp, TrendingDown, History, Briefcase, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TradingAPI, formatCurrency, formatPercent, type PositionResponse, type OrderResponse } from "@/lib/trading-api";
import { TokenService } from "@/lib/api";

// ==================== Position Item ====================
interface PositionItemProps {
    position: PositionResponse;
}

function PositionItem({ position }: PositionItemProps) {
    const quantity = parseInt(position.quantity) || 0;
    const avgPrice = parseFloat(position.avg_price) || 0;
    const marketPrice = position.market_price ? parseFloat(position.market_price) : null;
    const pnl = position.unrealized_pnl ? parseFloat(position.unrealized_pnl) : null;
    const pnlPercent = marketPrice && avgPrice ? ((marketPrice - avgPrice) / avgPrice) * 100 : null;
    const isProfit = pnl !== null && pnl >= 0;

    return (
        <div className="flex items-center justify-between p-3 border-b border-border/30 hover:bg-secondary/30 transition-colors">
            <div className="flex items-center gap-3">
                <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-lg",
                    isProfit ? "bg-green-500/10" : "bg-red-500/10"
                )}>
                    {isProfit ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{position.symbol}</span>
                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                            {quantity.toLocaleString()} CP
                        </Badge>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                        TB: {avgPrice.toFixed(2)} • Thị trường: {marketPrice?.toFixed(2) || '—'}
                    </div>
                </div>
            </div>
            <div className="text-right">
                {position.market_value && (
                    <div className="text-sm font-mono font-semibold">
                        {formatCurrency(position.market_value, { compact: true })}
                    </div>
                )}
                {pnl !== null && (
                    <div className={cn(
                        "text-[10px] font-mono font-medium",
                        isProfit ? "text-green-500" : "text-red-500"
                    )}>
                        {isProfit ? '+' : ''}{formatCurrency(pnl, { compact: true })}
                        {pnlPercent !== null && ` (${formatPercent(pnlPercent)})`}
                    </div>
                )}
            </div>
        </div>
    );
}

// ==================== Order History Item ====================
interface OrderItemProps {
    order: OrderResponse;
}

function OrderItem({ order }: OrderItemProps) {
    const isBuy = order.side === 'BUY';
    const quantity = parseInt(order.quantity) || 0;
    const filledQuantity = parseInt(order.filled_quantity) || 0;
    const price = order.limit_price ? parseFloat(order.limit_price) : order.avg_fill_price ? parseFloat(order.avg_fill_price) : null;

    const getStatusBadge = () => {
        switch (order.status) {
            case 'FILLED':
                return <Badge className="bg-green-500/20 text-green-500 text-[9px]">Khớp</Badge>;
            case 'PARTIALLY_FILLED':
                return <Badge className="bg-yellow-500/20 text-yellow-500 text-[9px]">Khớp một phần</Badge>;
            case 'PENDING':
                return <Badge className="bg-blue-500/20 text-blue-500 text-[9px]">Chờ</Badge>;
            case 'CANCELLED':
                return <Badge className="bg-gray-500/20 text-gray-500 text-[9px]">Đã hủy</Badge>;
            case 'REJECTED':
                return <Badge className="bg-red-500/20 text-red-500 text-[9px]">Bị từ chối</Badge>;
            default:
                return <Badge variant="outline" className="text-[9px]">{order.status}</Badge>;
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="flex items-center justify-between p-3 border-b border-border/30 hover:bg-secondary/30 transition-colors">
            <div className="flex items-center gap-3">
                <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-lg",
                    isBuy ? "bg-green-500/10" : "bg-red-500/10"
                )}>
                    {isBuy ? (
                        <ArrowUpRight className="w-4 h-4 text-green-500" />
                    ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-500" />
                    )}
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <span className={cn(
                            "text-[10px] font-bold uppercase",
                            isBuy ? "text-green-500" : "text-red-500"
                        )}>
                            {isBuy ? 'MUA' : 'BÁN'}
                        </span>
                        <span className="font-bold text-sm">{order.symbol}</span>
                        {getStatusBadge()}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                        {filledQuantity}/{quantity} CP • {price?.toFixed(2) || '—'} • {formatDate(order.created_at)}
                    </div>
                </div>
            </div>
            <div className="text-right">
                {order.fee && (
                    <div className="text-[10px] text-muted-foreground">
                        Phí: {formatCurrency(order.fee)}
                    </div>
                )}
            </div>
        </div>
    );
}

// ==================== Portfolio Panel ====================
export function PortfolioPanel() {
    const [positions, setPositions] = useState<PositionResponse[]>([]);
    const [orders, setOrders] = useState<OrderResponse[]>([]);
    const [isLoadingPositions, setIsLoadingPositions] = useState(true);
    const [isLoadingOrders, setIsLoadingOrders] = useState(true);
    const [activeTab, setActiveTab] = useState<'positions' | 'history'>('positions');

    const isAuthenticated = TokenService.hasTokens();

    useEffect(() => {
        if (!isAuthenticated) return;

        const fetchPositions = async () => {
            setIsLoadingPositions(true);
            try {
                const data = await TradingAPI.getPositions();
                setPositions(data.data);
            } catch (error) {
                console.error('Failed to fetch positions:', error);
            } finally {
                setIsLoadingPositions(false);
            }
        };

        const fetchOrders = async () => {
            setIsLoadingOrders(true);
            try {
                const data = await TradingAPI.getOrders({ limit: 50 });
                setOrders(data.data);
            } catch (error) {
                console.error('Failed to fetch orders:', error);
            } finally {
                setIsLoadingOrders(false);
            }
        };

        fetchPositions();
        fetchOrders();
    }, [isAuthenticated]);

    const totalMarketValue = positions.reduce((sum, p) => {
        return sum + (parseFloat(p.market_value || '0') || 0);
    }, 0);

    const totalPnL = positions.reduce((sum, p) => {
        return sum + (parseFloat(p.unrealized_pnl || '0') || 0);
    }, 0);

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col h-full w-full border-l border-border/40 bg-background/50">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                        <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">Đăng nhập để xem danh mục</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full border-l border-border/40 bg-background/50">
            {/* Header */}
            <div className="px-4 py-3 border-b border-border/40">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold">Danh mục đầu tư</h2>
                    <Badge variant="outline" className="text-[10px]">
                        {positions.length} mã
                    </Badge>
                </div>
                <div className="flex items-center gap-4 mt-2">
                    <div>
                        <p className="text-[10px] text-muted-foreground">Tổng giá trị</p>
                        <p className="text-lg font-bold font-mono">
                            {formatCurrency(totalMarketValue, { compact: true })}
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] text-muted-foreground">Lãi/Lỗ chưa chốt</p>
                        <p className={cn(
                            "text-lg font-bold font-mono",
                            totalPnL >= 0 ? "text-green-500" : "text-red-500"
                        )}>
                            {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL, { compact: true })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'positions' | 'history')} className="flex-1 flex flex-col">
                <TabsList className="w-full justify-start rounded-none border-b border-border/40 h-9 bg-transparent px-2">
                    <TabsTrigger value="positions" className="text-xs data-[state=active]:shadow-none">
                        <Briefcase className="w-3 h-3 mr-1.5" />
                        Danh mục
                    </TabsTrigger>
                    <TabsTrigger value="history" className="text-xs data-[state=active]:shadow-none">
                        <History className="w-3 h-3 mr-1.5" />
                        Lịch sử
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="positions" className="flex-1 m-0 overflow-hidden">
                    <ScrollArea className="h-full">
                        {isLoadingPositions ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            </div>
                        ) : positions.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                Chưa có cổ phiếu nào
                            </div>
                        ) : (
                            <div>
                                {positions.map((position) => (
                                    <PositionItem key={position.symbol} position={position} />
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </TabsContent>

                <TabsContent value="history" className="flex-1 m-0 overflow-hidden">
                    <ScrollArea className="h-full">
                        {isLoadingOrders ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                Chưa có lệnh nào
                            </div>
                        ) : (
                            <div>
                                {orders.map((order) => (
                                    <OrderItem key={order.id} order={order} />
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </TabsContent>
            </Tabs>
        </div>
    );
}
