import { useState, useEffect, useRef, useCallback } from 'react';
import type { PriceInfo } from '@/lib/trading-api';
import { QuotesAPI, normalizePriceInfo } from '@/lib/trading-api';
import { isVietnamTradingHours } from '@/lib/price-stream-api';
import { updateWebSocketStatus } from './useWebSocketStatus';

// WebSocket message types from backend
interface WSMessage {
    type: 'price' | 'index' | 'indices' | 'cached_prices' | 'subscribed' | 'pong' | 'error';
    data?: any;
    symbols?: string[];
    message?: string;
}

// Price data from WebSocket stream
interface WSPriceData {
    symbol: string;
    last_price: number | null;
    change: number | null;
    change_percent: number | null;
    total_volume: number | null;
    side?: string;
    ref_price?: number | null;
    ceiling?: number | null;
    floor?: number | null;
    open?: number | null;
    high?: number | null;
    low?: number | null;
}

interface UsePriceStreamOptions {
    /** Symbol to subscribe */
    symbol: string;
    /** Enable/disable the stream */
    enabled?: boolean;
}

interface UsePriceStreamResult {
    /** Current price info */
    priceInfo: PriceInfo | null;
    /** Loading state (only true on initial load) */
    isLoading: boolean;
    /** Error message if any */
    error: string | null;
    /** Whether we're within trading hours */
    isTradingHours: boolean;
    /** Whether WebSocket is connected */
    isConnected: boolean;
    /** Manually refresh price data */
    refresh: () => Promise<void>;
}

/**
 * Custom hook for price streaming using real WebSocket
 * 
 * - Fetches price once on initial load via REST API
 * - During VN trading hours: connects to WebSocket for realtime updates
 * - Outside trading hours: no WebSocket, uses initial data
 */
export function usePriceStream({
    symbol,
    enabled = true,
}: UsePriceStreamOptions): UsePriceStreamResult {
    const [priceInfo, setPriceInfo] = useState<PriceInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isTradingHours, setIsTradingHours] = useState(isVietnamTradingHours());
    const [isConnected, setIsConnected] = useState(false);

    // Refs
    const wsRef = useRef<WebSocket | null>(null);
    const symbolRef = useRef(symbol);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const tradingHoursIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Update symbol ref
    useEffect(() => {
        symbolRef.current = symbol;
    }, [symbol]);

    /**
     * Convert WebSocket price data to PriceInfo format
     * Only includes fields that have actual values to avoid overwriting
     * existing data (like ref_price, ceiling, floor from initial fetch)
     */
    const convertToPriceInfo = useCallback((wsData: WSPriceData): Partial<PriceInfo> => {
        const result: Partial<PriceInfo> = {
            symbol: wsData.symbol,
        };

        // Only update price-related fields if they have values
        if (wsData.last_price != null) result.price = wsData.last_price;
        if (wsData.change != null) result.change = wsData.change;
        if (wsData.change_percent != null) result.change_percent = wsData.change_percent;
        if (wsData.total_volume != null) result.volume = wsData.total_volume;

        // Only update reference prices if WebSocket provides them
        // Otherwise keep existing values from initial REST API fetch
        if (wsData.ref_price != null) result.ref_price = wsData.ref_price;
        if (wsData.ceiling != null) result.ceiling = wsData.ceiling;
        if (wsData.floor != null) result.floor = wsData.floor;
        if (wsData.open != null) result.open = wsData.open;
        if (wsData.high != null) result.high = wsData.high;
        if (wsData.low != null) result.low = wsData.low;

        return result;
    }, []);

    /**
     * Fetch initial price data using REST API
     */
    const fetchInitialPrice = useCallback(async () => {
        if (!symbol) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await QuotesAPI.getPriceBoard([symbol]);
            if (response.data && response.data.length > 0) {
                // Normalize to fill in missing ref_price, ceiling, floor
                setPriceInfo(normalizePriceInfo(response.data[0]));
            } else {
                setError('Không có dữ liệu giá');
            }
        } catch (err) {
            console.error('Failed to fetch initial price:', err);
            setError('Lỗi kết nối API');
        } finally {
            setIsLoading(false);
        }
    }, [symbol]);

    /**
     * Connect to WebSocket
     */
    const connectWebSocket = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            // Already connected, just subscribe to new symbol
            wsRef.current.send(JSON.stringify({
                action: 'subscribe',
                symbols: [symbolRef.current]
            }));
            return;
        }

        // Close existing connection
        if (wsRef.current) {
            wsRef.current.close();
        }

        // Use proxy path (works with Vite dev server proxy)
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/v1/ws/prices?symbols=${symbolRef.current}`;

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            setIsConnected(true);
            setError(null);
            updateWebSocketStatus(true, [symbolRef.current]);

            // Request cached prices immediately
            ws.send(JSON.stringify({ action: 'get_cached' }));
        };

        ws.onclose = () => {
            setIsConnected(false);
            updateWebSocketStatus(false);

            // Reconnect if still in trading hours and enabled
            if (isVietnamTradingHours() && enabled) {
                reconnectTimeoutRef.current = setTimeout(() => {
                    connectWebSocket();
                }, 3000);
            }
        };

        ws.onerror = () => {
            // Silent error handling
        };

        ws.onmessage = (event) => {
            try {
                const msg: WSMessage = JSON.parse(event.data);
                handleMessage(msg);
            } catch (e) {
                console.error('[WebSocket] Parse error:', e);
            }
        };
    }, [enabled]);

    /**
     * Handle WebSocket messages
     */
    const handleMessage = useCallback((msg: WSMessage) => {
        switch (msg.type) {
            case 'price':
                // Single price update
                if (msg.data && msg.data.symbol === symbolRef.current) {
                    setPriceInfo(prev => ({
                        ...prev,
                        ...convertToPriceInfo(msg.data),
                    } as PriceInfo));
                }
                break;

            case 'cached_prices':
                // Bulk cached prices
                if (msg.data && msg.data[symbolRef.current]) {
                    setPriceInfo(prev => ({
                        ...prev,
                        ...convertToPriceInfo(msg.data[symbolRef.current]),
                    } as PriceInfo));
                }
                break;

            case 'subscribed':
                // Subscribed successfully
                break;

            case 'error':
                // Server error - silent handling
                break;
        }
    }, [convertToPriceInfo]);

    /**
     * Disconnect WebSocket
     */
    const disconnectWebSocket = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        setIsConnected(false);
    }, []);

    /**
     * Manual refresh
     */
    const refresh = useCallback(async () => {
        await fetchInitialPrice();
    }, [fetchInitialPrice]);

    /**
     * Check trading hours periodically
     */
    useEffect(() => {
        const checkTradingHours = () => {
            const inTradingHours = isVietnamTradingHours();
            setIsTradingHours(inTradingHours);
        };

        checkTradingHours();
        tradingHoursIntervalRef.current = setInterval(checkTradingHours, 60000);

        return () => {
            if (tradingHoursIntervalRef.current) {
                clearInterval(tradingHoursIntervalRef.current);
            }
        };
    }, []);

    /**
     * Fetch initial price when symbol changes
     */
    useEffect(() => {
        if (!enabled || !symbol) return;

        // Reset state
        setPriceInfo(null);
        setIsLoading(true);
        setError(null);

        fetchInitialPrice();
    }, [symbol, enabled, fetchInitialPrice]);

    /**
     * Connect/disconnect WebSocket based on trading hours
     */
    useEffect(() => {
        if (!enabled || !symbol) return;

        if (isTradingHours) {
            // Connect WebSocket during trading hours
            connectWebSocket();
        } else {
            // Disconnect outside trading hours
            disconnectWebSocket();
        }

        return () => {
            disconnectWebSocket();
        };
    }, [symbol, enabled, isTradingHours, connectWebSocket, disconnectWebSocket]);

    /**
     * Re-subscribe when symbol changes and already connected
     */
    useEffect(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN && symbol) {
            wsRef.current.send(JSON.stringify({
                action: 'subscribe',
                symbols: [symbol]
            }));
        }
    }, [symbol]);

    return {
        priceInfo,
        isLoading,
        error,
        isTradingHours,
        isConnected,
        refresh,
    };
}
