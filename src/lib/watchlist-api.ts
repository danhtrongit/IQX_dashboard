import api from './api';

// ==================== Watchlist API Types ====================

export interface WatchlistItem {
    id: number;
    symbol: string;
    notes: string | null;
    target_price: number | null;
    alert_enabled: boolean;
    position: number;
    created_at: string;
    updated_at: string;
}

export interface WatchlistResponse {
    items: WatchlistItem[];
    total: number;
    limit: number;
    offset: number;
}

export interface AddWatchlistRequest {
    symbol: string;
    notes?: string;
    target_price?: number;
    alert_enabled?: boolean;
}

export interface UpdateWatchlistRequest {
    notes?: string;
    target_price?: number;
    alert_enabled?: boolean;
}

export interface CheckWatchlistResponse {
    symbol: string;
    in_watchlist: boolean;
}

// ==================== Watchlist API ====================

export const WatchlistAPI = {
    /**
     * Get user's watchlist
     * GET /watchlist
     */
    getWatchlist: async (limit = 100, offset = 0): Promise<WatchlistResponse> => {
        const response = await api.get<WatchlistResponse>('/watchlist', {
            params: { limit, offset },
        });
        return response.data;
    },

    /**
     * Add symbol to watchlist
     * POST /watchlist
     */
    addToWatchlist: async (request: AddWatchlistRequest): Promise<WatchlistItem> => {
        const response = await api.post<WatchlistItem>('/watchlist', request);
        return response.data;
    },

    /**
     * Remove symbol from watchlist by symbol
     * DELETE /watchlist/symbol/{symbol}
     */
    removeFromWatchlist: async (symbol: string): Promise<void> => {
        await api.delete(`/watchlist/symbol/${symbol}`);
    },

    /**
     * Remove item from watchlist by ID
     * DELETE /watchlist/{itemId}
     */
    removeById: async (itemId: number): Promise<void> => {
        await api.delete(`/watchlist/${itemId}`);
    },

    /**
     * Check if symbol is in watchlist
     * GET /watchlist/check/{symbol}
     */
    checkSymbol: async (symbol: string): Promise<CheckWatchlistResponse> => {
        const response = await api.get<CheckWatchlistResponse>(`/watchlist/check/${symbol}`);
        return response.data;
    },

    /**
     * Update watchlist item
     * PUT /watchlist/{itemId}
     */
    updateItem: async (itemId: number, request: UpdateWatchlistRequest): Promise<WatchlistItem> => {
        const response = await api.put<WatchlistItem>(`/watchlist/${itemId}`, request);
        return response.data;
    },
};
