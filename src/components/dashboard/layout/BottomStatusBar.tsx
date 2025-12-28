"use client";

import { Wifi, WifiOff, Server, Activity, Clock, Radio } from "lucide-react";
import { useWebSocketStatus } from "@/hooks/useWebSocketStatus";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export function BottomStatusBar() {
    const {
        isConnected,
        isTradingHours,
        currentTime,
        statusText,
        market,
        subscribedCount,
        messageCount,
    } = useWebSocketStatus();

    return (
        <div className="h-6 bg-primary text-primary-foreground flex items-center justify-between px-3 text-[10px] select-none font-mono">
            <div className="flex items-center gap-4">
                {/* Connection Status */}
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-1.5 opacity-80 hover:opacity-100 cursor-pointer">
                                <div
                                    className={cn(
                                        "w-1.5 h-1.5 rounded-full",
                                        isConnected
                                            ? "bg-green-400 animate-pulse"
                                            : isTradingHours
                                                ? "bg-yellow-400 animate-pulse"
                                                : "bg-gray-400"
                                    )}
                                />
                                <span>{statusText}</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                            <div className="space-y-1">
                                <div>WebSocket: {isConnected ? 'Đã kết nối' : 'Không kết nối'}</div>
                                {isConnected && (
                                    <>
                                        <div>Sàn: {market || 'N/A'}</div>
                                        <div>Đang theo dõi: {subscribedCount} mã</div>
                                        <div>Tin nhắn: {messageCount.toLocaleString()}</div>
                                    </>
                                )}
                                <div>Phiên giao dịch: {isTradingHours ? 'Đang mở' : 'Đã đóng'}</div>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                {/* Server Info */}
                <div className="hidden sm:flex items-center gap-1 opacity-70">
                    <Server className="w-3 h-3" />
                    <span>{market ? `${market}-CONN` : 'HOSE-CONN-01'}</span>
                </div>

                {/* Stream indicator during trading hours */}
                {isTradingHours && isConnected && (
                    <div className="hidden md:flex items-center gap-1 text-green-300">
                        <Radio className="w-3 h-3 animate-pulse" />
                        <span>Live</span>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-4">
                {/* Real-time Clock */}
                <div className="flex items-center gap-1 opacity-70 hover:opacity-100 cursor-pointer">
                    <Clock className="w-3 h-3" />
                    <span>{currentTime} UTC+7</span>
                </div>

                {/* Connection Icons */}
                <div className="flex items-center gap-2">
                    {isConnected ? (
                        <Wifi className="w-3 h-3 text-green-400" />
                    ) : (
                        <WifiOff className="w-3 h-3 text-gray-400" />
                    )}
                    <Server className={cn(
                        "w-3 h-3",
                        isConnected ? "text-green-400" : "opacity-70"
                    )} />
                    <Activity className={cn(
                        "w-3 h-3",
                        isConnected && isTradingHours ? "text-green-400 animate-pulse" : "opacity-70"
                    )} />
                </div>
            </div>
        </div>
    );
}
