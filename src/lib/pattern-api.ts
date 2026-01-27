import api from './api';

// ==================== Pattern API Types ====================

export interface CandlestickPattern {
    id: number;
    name: string;
    style: 'support' | 'resistance' | 'neutral';
    signal: string;
    reliability: string;
    description: string;
    image: string;
}

export interface ChartPattern {
    id: number;
    name: string;
    style: 'support' | 'resistance' | 'neutral';
    description: string;
    strategy: string;
    image: string;
}

export interface CandlestickPatternListResponse {
    patterns: CandlestickPattern[];
    metadata: {
        totalPatterns: number;
        categories: Record<string, string>;
        reliabilityLevels: string[];
    };
}

export interface ChartPatternListResponse {
    patterns: ChartPattern[];
    metadata: {
        totalPatterns: number;
        categories: Record<string, string>;
    };
}

export interface StockCandlestickPattern {
    symbol: string;
    patterns: string[];
}

export interface StockChartPattern {
    symbol: string;
    model: string;
}

export interface StockPatternsResponse {
    candlestick_patterns: StockCandlestickPattern[];
    chart_patterns: StockChartPattern[];
}

export interface PatternBySymbolResponse {
    symbol: string;
    candlestick_patterns: CandlestickPattern[];
    chart_pattern: ChartPattern | null;
}

// ==================== Pattern API ====================

export const PatternAPI = {
    /**
     * Get all candlestick pattern definitions
     * GET /patterns/candlesticks
     */
    getCandlestickPatterns: async (): Promise<CandlestickPatternListResponse> => {
        const response = await api.get<CandlestickPatternListResponse>('/patterns/candlesticks');
        return response.data;
    },

    /**
     * Get all chart pattern definitions
     * GET /patterns/charts
     */
    getChartPatterns: async (): Promise<ChartPatternListResponse> => {
        const response = await api.get<ChartPatternListResponse>('/patterns/charts');
        return response.data;
    },

    /**
     * Get all current stock patterns from Google Sheets
     * GET /patterns/stocks
     */
    getStockPatterns: async (): Promise<StockPatternsResponse> => {
        const response = await api.get<StockPatternsResponse>('/patterns/stocks');
        return response.data;
    },

    /**
     * Get patterns for a specific symbol
     * GET /patterns/stocks/{symbol}
     */
    getPatternsBySymbol: async (symbol: string): Promise<PatternBySymbolResponse> => {
        const response = await api.get<PatternBySymbolResponse>(`/patterns/stocks/${symbol}`);
        return response.data;
    },

    /**
     * Get candlestick pattern image URL
     */
    getCandlestickImageUrl: (filename: string): string => {
        return `/assets/candlesticks/${filename}`;
    },

    /**
     * Get chart pattern image URL
     */
    getChartImageUrl: (filename: string): string => {
        return `/assets/patterns/${filename}`;
    },
};

export default PatternAPI;
