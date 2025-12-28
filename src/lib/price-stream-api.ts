import api from './api';
import type { PriceInfo } from './trading-api';

// ==================== Price Stream API Types ====================

export interface StreamStatus {
    connected: boolean;
    market: string | null;
    subscribed_symbols: string[];
    last_update: string | null;
    message_count: number;
}

export interface StreamSubscribeResponse {
    symbols: string[];
    total_subscribed: number;
}

// ==================== VN Trading Hours Helper ====================

/**
 * Check if current time is within Vietnam stock market trading hours
 * Trading hours (UTC+7):
 * - Morning: 09:00 - 11:30
 * - Afternoon: 13:00 - 15:00
 * - Monday to Friday only
 */
export function isVietnamTradingHours(date: Date = new Date()): boolean {
    // Convert to Vietnam timezone (UTC+7)
    const vnDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));

    const day = vnDate.getDay();
    const hours = vnDate.getHours();
    const minutes = vnDate.getMinutes();
    const timeInMinutes = hours * 60 + minutes;

    // Not trading on weekends
    if (day === 0 || day === 6) return false;

    // Morning session: 09:00 - 11:30 (540 - 690 minutes)
    const morningStart = 9 * 60;      // 09:00
    const morningEnd = 11 * 60 + 30;  // 11:30

    // Afternoon session: 13:00 - 15:00 (780 - 900 minutes)
    const afternoonStart = 13 * 60;   // 13:00
    const afternoonEnd = 15 * 60;     // 15:00

    return (
        (timeInMinutes >= morningStart && timeInMinutes <= morningEnd) ||
        (timeInMinutes >= afternoonStart && timeInMinutes <= afternoonEnd)
    );
}

/**
 * Get minutes until next trading session starts
 */
export function getMinutesUntilTradingStart(): number | null {
    const now = new Date();
    const vnNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));

    const day = vnNow.getDay();
    const hours = vnNow.getHours();
    const minutes = vnNow.getMinutes();
    const timeInMinutes = hours * 60 + minutes;

    // Weekend - no trading
    if (day === 0 || day === 6) return null;

    const morningStart = 9 * 60;
    const afternoonStart = 13 * 60;
    const afternoonEnd = 15 * 60;

    // Before morning session
    if (timeInMinutes < morningStart) {
        return morningStart - timeInMinutes;
    }

    // Between sessions (lunch break)
    if (timeInMinutes > 11 * 60 + 30 && timeInMinutes < afternoonStart) {
        return afternoonStart - timeInMinutes;
    }

    // After market close
    if (timeInMinutes >= afternoonEnd) {
        return null; // Market closed for today
    }

    return 0; // Currently in trading session
}

// ==================== Price Stream API Endpoints ====================

export const PriceStreamAPI = {
    /**
     * Get stream connection status
     * GET /ws/stream/status
     */
    getStatus: async (): Promise<StreamStatus> => {
        const response = await api.get<StreamStatus>('/ws/stream/status');
        return response.data;
    },

    /**
     * Connect to price stream
     * POST /ws/stream/connect
     */
    connect: async (market: string = 'HOSE'): Promise<{ message: string }> => {
        const response = await api.post<{ message: string }>('/ws/stream/connect', null, {
            params: { market }
        });
        return response.data;
    },

    /**
     * Disconnect from price stream
     * POST /ws/stream/disconnect
     */
    disconnect: async (): Promise<{ message: string }> => {
        const response = await api.post<{ message: string }>('/ws/stream/disconnect');
        return response.data;
    },

    /**
     * Subscribe to symbols for price updates
     * POST /ws/stream/subscribe
     */
    subscribe: async (symbols: string[]): Promise<StreamSubscribeResponse> => {
        const response = await api.post<StreamSubscribeResponse>('/ws/stream/subscribe', symbols);
        return response.data;
    },

    /**
     * Get cached prices from stream
     * GET /ws/stream/prices
     */
    getPrices: async (symbols?: string[]): Promise<{ data: Record<string, PriceInfo> }> => {
        const response = await api.get<{ data: Record<string, PriceInfo> }>('/ws/stream/prices', {
            params: symbols ? { symbols: symbols.join(',') } : undefined
        });
        return response.data;
    },
};
