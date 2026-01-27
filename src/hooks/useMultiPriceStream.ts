import { useState, useEffect, useRef, useCallback } from 'react';
import type { PriceInfo } from '@/lib/trading-api';
import { QuotesAPI, normalizePriceInfo } from '@/lib/trading-api';
import { isVietnamTradingHours } from '@/lib/price-stream-api';

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

interface UseMultiPriceStreamOptions {
    /** Symbols to subscribe */
    symbols: string[];
    /** Enable/disable the stream */
    enabled?: boolean;
}

interface UseMultiPriceStreamResult {
    /** Map of symbol to price info */
    prices: Record<string, PriceInfo>;
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
 * Custom hook for streaming prices of multiple symbols
 *
 * - Fetches prices once on initial load via REST API
 * - During VN trading hours: connects to WebSocket for realtime updates
 * - Outside trading hours: no WebSocket, uses initial data
 */
export function useMultiPriceStream({
    symbols,
    enabled = true,
}: UseMultiPriceStreamOptions): UseMultiPriceStreamResult {
    const [prices, setPrices] = useState<Record<string, PriceInfo>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isTradingHours, setIsTradingHours] = useState(isVietnamTradingHours());
    const [isConnected, setIsConnected] = useState(false);

    // Refs
    const wsRef = useRef<WebSocket | null>(null);
    const symbolsRef = useRef(symbols);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const tradingHoursIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Update symbols ref
    useEffect(() => {
        symbolsRef.current = symbols;
    }, [symbols]);

    /**
     * Convert WebSocket price data to PriceInfo format
     */
    const convertToPriceInfo = useCallback((wsData: WSPriceData): Partial<PriceInfo> => {
        const result: Partial<PriceInfo> = {
            symbol: wsData.symbol,
        };

        if (wsData.last_price != null) result.price = wsData.last_price;
        if (wsData.change != null) result.change = wsData.change;
        if (wsData.change_percent != null) result.change_percent = wsData.change_percent;
        if (wsData.total_volume != null) result.volume = wsData.total_volume;
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
    const fetchInitialPrices = useCallback(async () => {
        if (!symbols || symbols.length === 0) {
            setPrices({});
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await QuotesAPI.getPriceBoard(symbols);
            if (response.data && response.data.length > 0) {
                const priceMap: Record<string, PriceInfo> = {};
                for (const item of response.data) {
                    const normalized = normalizePriceInfo(item);
                    priceMap[normalized.symbol] = normalized;
                }
                setPrices(priceMap);
            } else {
                setPrices({});
            }
        } catch (err) {
            console.error('Failed to fetch prices:', err);
            setError('Lỗi kết nối API');
        } finally {
            setIsLoading(false);
        }
    }, [symbols]);

    /**
     * Connect to WebSocket
     */
    const connectWebSocket = useCallback(() => {
        if (symbolsRef.current.length === 0) return;

        if (wsRef.current?.readyState === WebSocket.OPEN) {
            // Already connected, subscribe to symbols
            wsRef.current.send(JSON.stringify({
                action: 'subscribe',
                symbols: symbolsRef.current
            }));
            return;
        }

        // Close existing connection
        if (wsRef.current) {
            wsRef.current.close();
        }

        // Use proxy path
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/v1/ws/prices?symbols=${symbolsRef.current.join(',')}`;

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            setIsConnected(true);
            setError(null);
            // Request cached prices
            ws.send(JSON.stringify({ action: 'get_cached' }));
        };

        ws.onclose = () => {
            setIsConnected(false);

            // Reconnect if still in trading hours and enabled
            if (isVietnamTradingHours() && enabled && symbolsRef.current.length > 0) {
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
                if (msg.data && symbolsRef.current.includes(msg.data.symbol)) {
                    setPrices(prev => ({
                        ...prev,
                        [msg.data.symbol]: {
                            ...prev[msg.data.symbol],
                            ...convertToPriceInfo(msg.data),
                        } as PriceInfo
                    }));
                }
                break;

            case 'cached_prices':
                // Bulk cached prices
                if (msg.data) {
                    setPrices(prev => {
                        const updated = { ...prev };
                        for (const symbol of symbolsRef.current) {
                            if (msg.data[symbol]) {
                                updated[symbol] = {
                                    ...updated[symbol],
                                    ...convertToPriceInfo(msg.data[symbol]),
                                } as PriceInfo;
                            }
                        }
                        return updated;
                    });
                }
                break;

            case 'subscribed':
            case 'error':
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
        await fetchInitialPrices();
    }, [fetchInitialPrices]);

    /**
     * Check trading hours periodically
     */
    useEffect(() => {
        const checkTradingHours = () => {
            setIsTradingHours(isVietnamTradingHours());
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
     * Fetch initial prices when symbols change
     */
    useEffect(() => {
        if (!enabled) return;
        fetchInitialPrices();
    }, [symbols.join(','), enabled, fetchInitialPrices]);

    /**
     * Connect/disconnect WebSocket based on trading hours
     */
    useEffect(() => {
        if (!enabled || symbols.length === 0) return;

        if (isTradingHours) {
            connectWebSocket();
        } else {
            disconnectWebSocket();
        }

        return () => {
            disconnectWebSocket();
        };
    }, [symbols.join(','), enabled, isTradingHours, connectWebSocket, disconnectWebSocket]);

    /**
     * Re-subscribe when symbols change and already connected
     */
    useEffect(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN && symbols.length > 0) {
            wsRef.current.send(JSON.stringify({
                action: 'subscribe',
                symbols: symbols
            }));
        }
    }, [symbols.join(',')]);

    return {
        prices,
        isLoading,
        error,
        isTradingHours,
        isConnected,
        refresh,
    };
}
