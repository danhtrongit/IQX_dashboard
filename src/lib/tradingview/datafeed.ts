/**
 * TradingView Datafeed Implementation for Vietnam Stock Market
 * Connects to the backend API for historical data and WebSocket for realtime updates
 */

import api from '../api';

// ==================== TradingView Types ====================
// These types are based on TradingView's datafeed-api.d.ts

export type ResolutionString = string;

export interface Bar {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
}

export interface DatafeedConfiguration {
    supported_resolutions?: ResolutionString[];
    exchanges?: Array<{ value: string; name: string; desc: string }>;
    symbols_types?: Array<{ name: string; value: string }>;
    supports_marks?: boolean;
    supports_timescale_marks?: boolean;
    supports_time?: boolean;
}

export interface LibrarySymbolInfo {
    name: string;
    ticker?: string;
    description: string;
    type: string;
    session: string;
    timezone: string;
    exchange: string;
    listed_exchange: string;
    minmov: number;
    pricescale: number;
    has_intraday?: boolean;
    has_daily?: boolean;
    has_weekly_and_monthly?: boolean;
    supported_resolutions?: ResolutionString[];
    volume_precision?: number;
    data_status?: string;
    format: string;
    sector?: string;
    industry?: string;
}

export interface SearchSymbolResultItem {
    symbol: string;
    full_name?: string;
    description: string;
    exchange: string;
    ticker?: string;
    type: string;
}

export interface PeriodParams {
    from: number;
    to: number;
    countBack: number;
    firstDataRequest: boolean;
}

export interface HistoryMetadata {
    noData?: boolean;
    nextTime?: number | null;
}

export type OnReadyCallback = (configuration: DatafeedConfiguration) => void;
export type SearchSymbolsCallback = (results: SearchSymbolResultItem[]) => void;
export type ResolveCallback = (symbolInfo: LibrarySymbolInfo) => void;
export type HistoryCallback = (bars: Bar[], meta?: HistoryMetadata) => void;
export type SubscribeBarsCallback = (bar: Bar) => void;

export interface IBasicDataFeed {
    onReady(callback: OnReadyCallback): void;
    searchSymbols(
        userInput: string,
        exchange: string,
        symbolType: string,
        onResult: SearchSymbolsCallback
    ): void;
    resolveSymbol(
        symbolName: string,
        onResolve: ResolveCallback,
        onError: (reason: string) => void
    ): void;
    getBars(
        symbolInfo: LibrarySymbolInfo,
        resolution: ResolutionString,
        periodParams: PeriodParams,
        onResult: HistoryCallback,
        onError: (reason: string) => void
    ): void;
    subscribeBars(
        symbolInfo: LibrarySymbolInfo,
        resolution: ResolutionString,
        onTick: SubscribeBarsCallback,
        listenerGuid: string,
        onResetCacheNeededCallback: () => void
    ): void;
    unsubscribeBars(listenerGuid: string): void;
}

// ==================== Types ====================

interface OHLCVData {
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

interface HistoryResponse {
    symbol: string;
    interval: string;
    data: OHLCVData[];
    count: number;
}

interface SymbolSearchResult {
    id: number;
    symbol: string;
    organ_name: string;
    organ_short_name: string;
    exchange: string;
    type: string;
    icb_name2?: string;
}

interface SymbolDetail {
    id: number;
    symbol: string;
    organ_name: string;
    organ_short_name?: string;
    exchange: string;
    type: string;
    icb_name2?: string;
    icb_name3?: string;
    issue_share?: number;
}

// ==================== Index Detection ====================

const INDEX_SYMBOLS = ['VNINDEX', 'HNXINDEX', 'UPCOMINDEX', 'VN30'];

function isIndexSymbol(symbol: string): boolean {
    return INDEX_SYMBOLS.includes(symbol.toUpperCase());
}

// ==================== Resolution Mapping ====================

const RESOLUTION_MAP: Record<string, string> = {
    '1': '1m',
    '5': '5m',
    '15': '15m',
    '30': '30m',
    '60': '1H',
    '1H': '1H',
    'D': '1D',
    '1D': '1D',
    'W': '1W',
    '1W': '1W',
    'M': '1M',
    '1M': '1M',
};

const SUPPORTED_RESOLUTIONS: ResolutionString[] = [
    '1' as ResolutionString,
    '5' as ResolutionString,
    '15' as ResolutionString,
    '30' as ResolutionString,
    '60' as ResolutionString,
    'D' as ResolutionString,
    'W' as ResolutionString,
    'M' as ResolutionString,
];

// ==================== WebSocket Manager ====================

class RealtimeSubscriptionManager {
    private ws: WebSocket | null = null;
    private subscribers: Map<string, {
        symbolInfo: LibrarySymbolInfo;
        resolution: ResolutionString;
        onTick: SubscribeBarsCallback;
        lastBar: Bar | null;
    }> = new Map();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;
    private wsUrl: string;

    constructor() {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
        this.wsUrl = baseUrl.replace('http', 'ws') + '/ws/prices';
    }

    connect(symbols: string[]): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.subscribeSymbols(symbols);
            return;
        }

        const url = `${this.wsUrl}?symbols=${symbols.join(',')}&compress=false`;
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
            console.log('[TradingView Datafeed] WebSocket connected');
            this.reconnectAttempts = 0;
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'price') {
                    this.handlePriceUpdate(data.data);
                }
            } catch (e) {
                console.error('[TradingView Datafeed] Error parsing message:', e);
            }
        };

        this.ws.onerror = (error) => {
            console.error('[TradingView Datafeed] WebSocket error:', error);
        };

        this.ws.onclose = () => {
            console.log('[TradingView Datafeed] WebSocket closed');
            this.attemptReconnect();
        };
    }

    private subscribeSymbols(symbols: string[]): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                action: 'subscribe',
                symbols: symbols
            }));
        }
    }

    private attemptReconnect(): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('[TradingView Datafeed] Max reconnect attempts reached');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

        setTimeout(() => {
            const symbols = Array.from(this.subscribers.values()).map(s => s.symbolInfo.ticker || s.symbolInfo.name);
            if (symbols.length > 0) {
                this.connect(symbols);
            }
        }, delay);
    }

    private handlePriceUpdate(priceData: {
        symbol: string;
        last_price: number;
        last_volume: number;
        high_price: number;
        low_price: number;
        open_price: number;
        timestamp: number;
    }): void {
        this.subscribers.forEach((subscriber) => {
            const symbolName = subscriber.symbolInfo.ticker || subscriber.symbolInfo.name;
            if (symbolName.toUpperCase() === priceData.symbol.toUpperCase()) {
                const bar = this.createBarFromPrice(priceData, subscriber.resolution, subscriber.lastBar);
                if (bar) {
                    subscriber.lastBar = bar;
                    subscriber.onTick(bar);
                }
            }
        });
    }

    private createBarFromPrice(
        priceData: {
            last_price: number;
            last_volume: number;
            high_price: number;
            low_price: number;
            open_price: number;
            timestamp: number;
        },
        resolution: ResolutionString,
        lastBar: Bar | null
    ): Bar | null {
        const price = priceData.last_price / 1000; // API returns price * 1000
        const timestamp = priceData.timestamp * 1000; // Convert to milliseconds
        const barTime = this.getBarTime(timestamp, resolution);

        if (lastBar && barTime === lastBar.time) {
            // Update existing bar
            return {
                time: barTime,
                open: lastBar.open,
                high: Math.max(lastBar.high, price),
                low: Math.min(lastBar.low, price),
                close: price,
                volume: (lastBar.volume || 0) + (priceData.last_volume || 0),
            };
        } else {
            // New bar
            return {
                time: barTime,
                open: price,
                high: price,
                low: price,
                close: price,
                volume: priceData.last_volume || 0,
            };
        }
    }

    private getBarTime(timestamp: number, resolution: ResolutionString): number {
        const date = new Date(timestamp);
        const resolutionMinutes = this.getResolutionMinutes(resolution);

        if (resolutionMinutes >= 1440) {
            // Daily or higher - align to start of day
            date.setHours(0, 0, 0, 0);
        } else {
            // Intraday - align to resolution
            const minutes = date.getMinutes();
            const alignedMinutes = Math.floor(minutes / resolutionMinutes) * resolutionMinutes;
            date.setMinutes(alignedMinutes, 0, 0);
        }

        return date.getTime();
    }

    private getResolutionMinutes(resolution: ResolutionString): number {
        const num = parseInt(resolution);
        if (!isNaN(num)) return num;

        switch (resolution) {
            case 'D': return 1440;
            case 'W': return 10080;
            case 'M': return 43200;
            default: return 1;
        }
    }

    subscribe(
        listenerGuid: string,
        symbolInfo: LibrarySymbolInfo,
        resolution: ResolutionString,
        onTick: SubscribeBarsCallback,
        lastBar: Bar | null
    ): void {
        this.subscribers.set(listenerGuid, {
            symbolInfo,
            resolution,
            onTick,
            lastBar,
        });

        const symbol = symbolInfo.ticker || symbolInfo.name;
        this.connect([symbol]);
    }

    unsubscribe(listenerGuid: string): void {
        this.subscribers.delete(listenerGuid);

        if (this.subscribers.size === 0 && this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}

// ==================== Datafeed Implementation ====================

export class VietnamStockDatafeed implements IBasicDataFeed {
    private subscriptionManager: RealtimeSubscriptionManager;
    private lastBarsCache: Map<string, Bar> = new Map();

    constructor() {
        this.subscriptionManager = new RealtimeSubscriptionManager();
    }

    onReady(callback: OnReadyCallback): void {
        setTimeout(() => {
            const config: DatafeedConfiguration = {
                supported_resolutions: SUPPORTED_RESOLUTIONS,
                exchanges: [
                    { value: 'HOSE', name: 'HOSE', desc: 'Sở Giao dịch Chứng khoán TP.HCM' },
                    { value: 'HNX', name: 'HNX', desc: 'Sở Giao dịch Chứng khoán Hà Nội' },
                    { value: 'UPCOM', name: 'UPCOM', desc: 'Thị trường UPCoM' },
                ],
                symbols_types: [
                    { name: 'Tất cả', value: '' },
                    { name: 'Chỉ số', value: 'index' },
                    { name: 'Cổ phiếu', value: 'stock' },
                    { name: 'ETF', value: 'etf' },
                    { name: 'Chứng quyền', value: 'cw' },
                ],
                supports_marks: false,
                supports_timescale_marks: false,
                supports_time: true,
            };
            callback(config);
        }, 0);
    }

    async searchSymbols(
        userInput: string,
        exchange: string,
        symbolType: string,
        onResult: SearchSymbolsCallback
    ): Promise<void> {
        try {
            const query = userInput.toUpperCase();
            const results: SearchSymbolResultItem[] = [];

            // Search indices first
            const matchingIndices = INDEX_SYMBOLS.filter(idx => 
                idx.includes(query) || this.getIndexDescription(idx).toUpperCase().includes(query)
            );

            matchingIndices.forEach(idx => {
                if (!symbolType || symbolType === 'index') {
                    const idxExchange = this.getIndexExchange(idx);
                    if (!exchange || exchange === idxExchange) {
                        results.push({
                            symbol: idx,
                            full_name: idx,
                            description: this.getIndexDescription(idx),
                            exchange: idxExchange,
                            ticker: idx,
                            type: 'index',
                        });
                    }
                }
            });

            // Search stocks from API
            if (!symbolType || symbolType !== 'index') {
                const response = await api.get<SymbolSearchResult[]>('/symbols/search', {
                    params: { q: userInput, limit: 30 }
                });

                response.data
                    .filter(item => {
                        if (exchange && this.normalizeExchange(item.exchange) !== exchange) return false;
                        if (symbolType && item.type?.toLowerCase() !== symbolType) return false;
                        return true;
                    })
                    .forEach(item => {
                        results.push({
                            symbol: item.symbol,
                            full_name: item.symbol,
                            description: item.organ_name || item.organ_short_name || '',
                            exchange: this.normalizeExchange(item.exchange),
                            ticker: item.symbol,
                            type: item.type?.toLowerCase() || 'stock',
                        });
                    });
            }

            onResult(results);
        } catch (error) {
            console.error('[TradingView Datafeed] Search error:', error);
            onResult([]);
        }
    }

    async resolveSymbol(
        symbolName: string,
        onResolve: ResolveCallback,
        onError: (reason: string) => void
    ): Promise<void> {
        try {
            const symbol = symbolName.toUpperCase();
            
            // Check if it's an index
            if (isIndexSymbol(symbol)) {
                const symbolInfo: LibrarySymbolInfo = {
                    name: symbol,
                    ticker: symbol,
                    description: this.getIndexDescription(symbol),
                    type: 'index',
                    session: '0900-1130,1300-1500',
                    timezone: 'Asia/Ho_Chi_Minh',
                    exchange: this.getIndexExchange(symbol),
                    listed_exchange: this.getIndexExchange(symbol),
                    minmov: 1,
                    pricescale: 100,
                    has_intraday: true,
                    has_daily: true,
                    has_weekly_and_monthly: true,
                    supported_resolutions: SUPPORTED_RESOLUTIONS,
                    volume_precision: 0,
                    data_status: 'streaming',
                    format: 'price',
                };
                onResolve(symbolInfo);
                return;
            }

            // Regular stock
            const response = await api.get<SymbolDetail>(`/symbols/${symbol}`);
            const data = response.data;

            const symbolInfo: LibrarySymbolInfo = {
                name: data.symbol,
                ticker: data.symbol,
                description: data.organ_name || data.symbol,
                type: data.type?.toLowerCase() || 'stock',
                session: '0900-1130,1300-1500',
                timezone: 'Asia/Ho_Chi_Minh',
                exchange: this.normalizeExchange(data.exchange),
                listed_exchange: this.normalizeExchange(data.exchange),
                minmov: 1,
                pricescale: 100,
                has_intraday: true,
                has_daily: true,
                has_weekly_and_monthly: true,
                supported_resolutions: SUPPORTED_RESOLUTIONS,
                volume_precision: 0,
                data_status: 'streaming',
                format: 'price',
                sector: data.icb_name2 || undefined,
                industry: data.icb_name3 || undefined,
            };

            onResolve(symbolInfo);
        } catch (error) {
            console.error('[TradingView Datafeed] Resolve error:', error);
            onError('Symbol not found');
        }
    }

    private getIndexDescription(symbol: string): string {
        const descriptions: Record<string, string> = {
            'VNINDEX': 'VN-Index - Chỉ số HOSE',
            'HNXINDEX': 'HNX-Index - Chỉ số HNX',
            'UPCOMINDEX': 'UPCOM-Index - Chỉ số UPCOM',
            'VN30': 'VN30 Index - Top 30 HOSE',
        };
        return descriptions[symbol] || symbol;
    }

    private getIndexExchange(symbol: string): string {
        const exchanges: Record<string, string> = {
            'VNINDEX': 'HOSE',
            'HNXINDEX': 'HNX',
            'UPCOMINDEX': 'UPCOM',
            'VN30': 'HOSE',
        };
        return exchanges[symbol] || 'HOSE';
    }

    async getBars(
        symbolInfo: LibrarySymbolInfo,
        resolution: ResolutionString,
        periodParams: PeriodParams,
        onResult: HistoryCallback,
        onError: (reason: string) => void
    ): Promise<void> {
        const { from, to, countBack, firstDataRequest } = periodParams;
        const symbol = symbolInfo.ticker || symbolInfo.name;
        const interval = RESOLUTION_MAP[resolution] || '1D';

        try {
            const startDate = new Date(from * 1000).toISOString().split('T')[0];
            const endDate = new Date(to * 1000).toISOString().split('T')[0];

            const response = await api.get<HistoryResponse>(`/quotes/${symbol}/history`, {
                params: {
                    start: startDate,
                    end: endDate,
                    interval: interval,
                    count_back: countBack || 300,
                }
            });

            const bars: Bar[] = response.data.data.map(item => ({
                // Parse time as UTC to avoid timezone offset issues
                // Backend returns "2026-01-26 00:00:00" which should be treated as UTC midnight
                time: this.parseTimeAsUTC(item.time),
                open: item.open,
                high: item.high,
                low: item.low,
                close: item.close,
                volume: item.volume,
            }));

            if (bars.length === 0) {
                onResult([], { noData: true });
                return;
            }

            // Sort bars by time ascending
            bars.sort((a, b) => a.time - b.time);

            // Cache last bar for realtime updates
            if (firstDataRequest && bars.length > 0) {
                const cacheKey = `${symbol}_${resolution}`;
                this.lastBarsCache.set(cacheKey, bars[bars.length - 1]);
            }

            onResult(bars, { noData: false });
        } catch (error) {
            console.error('[TradingView Datafeed] GetBars error:', error);
            onError('Failed to load data');
        }
    }

    subscribeBars(
        symbolInfo: LibrarySymbolInfo,
        resolution: ResolutionString,
        onTick: SubscribeBarsCallback,
        listenerGuid: string,
        _onResetCacheNeededCallback: () => void
    ): void {
        const symbol = symbolInfo.ticker || symbolInfo.name;
        const cacheKey = `${symbol}_${resolution}`;
        const lastBar = this.lastBarsCache.get(cacheKey) || null;

        this.subscriptionManager.subscribe(
            listenerGuid,
            symbolInfo,
            resolution,
            onTick,
            lastBar
        );
    }

    unsubscribeBars(listenerGuid: string): void {
        this.subscriptionManager.unsubscribe(listenerGuid);
    }

    private normalizeExchange(exchange: string | null): string {
        if (!exchange) return 'HOSE';
        const upper = exchange.toUpperCase();
        if (upper === 'HSX') return 'HOSE';
        return upper;
    }

    private parseTimeAsUTC(timeStr: string): number {
        // Backend returns time in ISO format like "2026-01-26T00:00:00"
        // We need to treat this as the trading date in UTC, not local time
        // Extract the date part and create a UTC midnight timestamp
        const datePart = timeStr.split('T')[0];
        return new Date(datePart + 'T00:00:00Z').getTime();
    }
}

// Export singleton instance
export const datafeed = new VietnamStockDatafeed();
