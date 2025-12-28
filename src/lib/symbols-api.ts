import api from './api';

// ==================== Symbol Types (from OpenAPI spec) ====================

/**
 * Symbol response from /symbols/search
 */
export interface SymbolResponse {
    id: number;
    symbol: string;
    organ_name: string | null;
    en_organ_name: string | null;
    organ_short_name: string | null;
    exchange: string | null;
    type: string | null;
    icb_code2: string | null;
    icb_code3: string | null;
    icb_code4: string | null;
    icb_name2: string | null;
    icb_name3: string | null;
    icb_name4: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

/**
 * Symbol list response with pagination
 */
export interface SymbolListResponse {
    items: SymbolResponse[];
    total: number;
    limit: number;
    offset: number;
}

// ==================== Symbols API endpoints ====================

export const SymbolsAPI = {
    /**
     * Search symbols by name or code
     * GET /symbols/search?q=...&limit=...&type=...
     */
    search: async (query: string, limit = 10, type?: string): Promise<SymbolResponse[]> => {
        const response = await api.get<SymbolResponse[]>('/symbols/search', {
            params: { q: query, limit, type },
        });
        return response.data;
    },

    /**
     * List all symbols with optional filters
     * GET /symbols
     */
    list: async (params?: {
        exchange?: string;
        type?: string;
        icb_code2?: string;
        is_active?: boolean;
        limit?: number;
        offset?: number;
    }): Promise<SymbolListResponse> => {
        const response = await api.get<SymbolListResponse>('/symbols', { params });
        return response.data;
    },

    /**
     * Get symbol detail by ticker code
     * GET /symbols/{symbol}
     */
    getBySymbol: async (symbol: string): Promise<SymbolResponse> => {
        const response = await api.get<SymbolResponse>(`/symbols/${symbol}`);
        return response.data;
    },
};

export default SymbolsAPI;
