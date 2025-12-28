import { useState, useEffect, useCallback } from 'react';
import { isVietnamTradingHours } from '@/lib/price-stream-api';

interface WebSocketStatusResult {
    /** Whether WebSocket is connected */
    isConnected: boolean;
    /** Market the stream is connected to */
    market: string | null;
    /** Number of subscribed symbols */
    subscribedCount: number;
    /** Total messages received */
    messageCount: number;
    /** Last update timestamp */
    lastUpdate: string | null;
    /** Whether currently in VN trading hours */
    isTradingHours: boolean;
    /** Current VN time formatted */
    currentTime: string;
    /** Connection status description */
    statusText: string;
    /** Loading state */
    isLoading: boolean;
    /** Manually refresh status */
    refresh: () => Promise<void>;
}

// Shared WebSocket status state
let globalWsConnected = false;
let globalMessageCount = 0;
let globalLastUpdate: string | null = null;
let globalSubscribedSymbols: string[] = [];
const statusListeners = new Set<() => void>();

// Export functions to update status from other hooks
export function updateWebSocketStatus(connected: boolean, symbols?: string[]) {
    globalWsConnected = connected;
    if (symbols) {
        globalSubscribedSymbols = symbols;
    }
    globalLastUpdate = new Date().toISOString();
    notifyListeners();
}

export function incrementMessageCount() {
    globalMessageCount++;
    notifyListeners();
}

function notifyListeners() {
    statusListeners.forEach(listener => listener());
}

/**
 * Hook to monitor WebSocket connection status
 */
export function useWebSocketStatus(): WebSocketStatusResult {
    const [isConnected, setIsConnected] = useState(globalWsConnected);
    const [subscribedCount, setSubscribedCount] = useState(globalSubscribedSymbols.length);
    const [messageCount, setMessageCount] = useState(globalMessageCount);
    const [lastUpdate, setLastUpdate] = useState<string | null>(globalLastUpdate);
    const [isTradingHours, setIsTradingHours] = useState(isVietnamTradingHours());
    const [currentTime, setCurrentTime] = useState(getVietnamTime());
    const [isLoading] = useState(false);

    // Format current time in VN timezone
    function getVietnamTime(): string {
        return new Date().toLocaleTimeString('vi-VN', {
            timeZone: 'Asia/Ho_Chi_Minh',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });
    }

    // Subscribe to status updates
    useEffect(() => {
        const handleUpdate = () => {
            setIsConnected(globalWsConnected);
            setSubscribedCount(globalSubscribedSymbols.length);
            setMessageCount(globalMessageCount);
            setLastUpdate(globalLastUpdate);
        };

        statusListeners.add(handleUpdate);

        return () => {
            statusListeners.delete(handleUpdate);
        };
    }, []);

    // Update time every second
    useEffect(() => {
        const updateTime = () => {
            setCurrentTime(getVietnamTime());
            setIsTradingHours(isVietnamTradingHours());
        };

        updateTime();
        const interval = setInterval(updateTime, 1000);

        return () => clearInterval(interval);
    }, []);

    // Manual refresh - just update local state
    const refresh = useCallback(async () => {
        setIsConnected(globalWsConnected);
        setSubscribedCount(globalSubscribedSymbols.length);
        setMessageCount(globalMessageCount);
    }, []);

    // Generate status text
    const getStatusText = (): string => {
        if (!isTradingHours) {
            return 'Ngoài giờ giao dịch';
        }

        if (isConnected) {
            return `Realtime • ${subscribedCount} mã`;
        }

        return 'Đang kết nối...';
    };

    return {
        isConnected,
        market: 'HOSE',
        subscribedCount,
        messageCount,
        lastUpdate,
        isTradingHours,
        currentTime,
        statusText: getStatusText(),
        isLoading,
        refresh,
    };
}
