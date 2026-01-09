/**
 * Score API - Ranking and History endpoints
 */
import api from './api';

// ==================== Types ====================

export interface ScoreRankingItem {
    rank: number;
    symbol: string;
    exchange: string;
    score: number;
    p: number;
    v: number;
    close: string;
    ma: string;
    volume: number;
    vol_avg: number;
}

export interface ScoreRankingResponse {
    items: ScoreRankingItem[];
    total: number;
    ma_period: number;
    trade_date: string;
}

export interface ScoreHistoryItem {
    date: string;
    score: number;
    p: number;
    v: number;
    close: string;
    ma: string;
    volume: number;
    vol_avg: number;
}

export interface ScoreHistoryResponse {
    symbol: string;
    ma_period: number;
    data: ScoreHistoryItem[];
}

export type MAPeriod = 5 | 10 | 20 | 30 | 50 | 100 | 200;
export type TimeRange = 'week' | 'month' | 'year';
export type SortOrder = 'asc' | 'desc';

export interface ScoreRankingParams {
    ma_period: MAPeriod;
    exchange?: string;
    limit?: number;
    offset?: number;
    sort?: SortOrder;
}

export interface ScoreHistoryParams {
    ma_period: MAPeriod;
    range: TimeRange;
}

// ==================== API Functions ====================

export const ScoreAPI = {
    /**
     * Get score ranking for all symbols
     * GET /score/ranking
     */
    getRanking: async (params: ScoreRankingParams): Promise<ScoreRankingResponse> => {
        const response = await api.get<ScoreRankingResponse>('/score/ranking', { params });
        return response.data;
    },

    /**
     * Get score history for a single symbol
     * GET /score/history/{symbol}
     */
    getHistory: async (symbol: string, params: ScoreHistoryParams): Promise<ScoreHistoryResponse> => {
        const response = await api.get<ScoreHistoryResponse>(`/score/history/${symbol}`, { params });
        return response.data;
    },
};

export default ScoreAPI;
