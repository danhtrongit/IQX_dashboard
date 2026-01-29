import api from './api';

// ==================== Stock/Company API Types ====================

/**
 * Stock detail response with trading info
 */
export interface StockDetailResponse {
    symbol: string;
    match_price: number | null;
    reference_price: number | null;
    ceiling_price: number | null;
    floor_price: number | null;
    price_change: number | null;
    percent_price_change: number | null;
    total_volume: number | null;
    highest_price_1_year: number | null;
    lowest_price_1_year: number | null;
    foreign_total_volume: number | null;
    foreign_total_room: number | null;
    foreign_holding_room: number | null;
    current_holding_ratio: number | null;
    max_holding_ratio: number | null;
    market_cap: number | null;
    issue_share: number | null;
    charter_capital: number | null;
    pe: number | null;
    pb: number | null;
    eps: number | null;
    bvps: number | null;
    roe: number | null;
    roa: number | null;
    de: number | null;
    ev: number | null;
    dividend: number | null;
}

/**
 * Company overview response
 */
export interface CompanyOverviewResponse {
    symbol: string;
    company_profile: string | null;
    history: string | null;
    icb_name2: string | null;
    icb_name3: string | null;
    icb_name4: string | null;
    issue_share: number | null;
    charter_capital: number | null;
}

/**
 * Shareholder item
 */
export interface ShareholderItem {
    share_holder: string | null;
    share_own_percent: number | null;
    update_date: string | null;
}

/**
 * Shareholders response
 */
export interface ShareholdersResponse {
    symbol: string;
    data: ShareholderItem[];
}

/**
 * Officer item
 */
export interface OfficerItem {
    officer_name: string | null;
    officer_position: string | null;
    officer_own_percent: number | null;
    update_date: string | null;
}

/**
 * Officers response
 */
export interface OfficersResponse {
    symbol: string;
    data: OfficerItem[];
}

/**
 * Event item
 */
export interface EventItem {
    event_title: string | null;
    public_date: string | null;
    issue_date: string | null;
    event_list_name: string | null;
    ratio: number | null;
    value: number | null;
}

/**
 * Events response
 */
export interface EventsResponse {
    symbol: string;
    data: EventItem[];
}

/**
 * News item
 */
export interface NewsItem {
    news_title: string | null;
    news_short_content: string | null;
    public_date: string | null;
    news_source_link: string | null;
}

/**
 * News response
 */
export interface NewsResponse {
    symbol: string;
    data: NewsItem[];
}

/**
 * Analysis report item from securities companies
 */
export interface AnalysisReportItem {
    id: number;
    title: string | null;
    source: string | null;
    issue_date: string | null;
    issue_date_ago: string | null;
    report_type: number | null;
    target_price: number | null;
    recommend: string | null;
    attached_link: string | null;
    file_name: string | null;
}

/**
 * Analysis reports response
 */
export interface AnalysisReportsResponse {
    symbol: string;
    data: AnalysisReportItem[];
    total: number;
    page: number;
    size: number;
}

// ==================== Financial API Types ====================

/**
 * Financial report response
 */
export interface FinancialReportResponse {
    symbol: string;
    report_type: string;
    period: string;
    data: Record<string, unknown>[];
    count: number;
}

/**
 * Financial ratio response
 */
export interface RatioResponse {
    symbol: string;
    period: string;
    data: Record<string, unknown>[];
    count: number;
}

// ==================== Toolkit API Types ====================

/**
 * Toolkit summary metrics
 */
export interface ToolkitSummary {
    roe: number | null;
    roa: number | null;
    debt_equity: number | null;
    gross_margin: number | null;
    net_margin: number | null;
    asset_turnover: number | null;
}

/**
 * Toolkit series item for charts
 */
export interface ToolkitSeriesItem {
    key: string;
    name: string;
    values: (number | null)[];
}

/**
 * Toolkit percent series item
 */
export interface ToolkitPercentSeriesItem {
    key: string;
    values: (number | null)[];
}

/**
 * Toolkit composition data for stacked charts
 */
export interface ToolkitComposition {
    labels: string[];
    series: ToolkitSeriesItem[];
    percent_series: ToolkitPercentSeriesItem[];
}

/**
 * Toolkit comparison metric with YoY
 */
export interface ToolkitComparisonMetric {
    key: string;
    name: string;
    values: (number | null)[];
    yoy: (number | null)[];
}

/**
 * Toolkit comparison data
 */
export interface ToolkitComparison {
    labels: string[];
    metrics: ToolkitComparisonMetric[];
}

/**
 * Toolkit response
 */
export interface ToolkitResponse {
    symbol: string;
    type: 'bank' | 'non-bank';
    period: string;
    limit: number;
    summary: ToolkitSummary;
    asset_composition: ToolkitComposition;
    revenue_composition: ToolkitComposition;
    comparison: ToolkitComparison;
}

// ==================== Insight API Types ====================

/**
 * Foreign trading item
 */
export interface ForeignTradingItem {
    trading_date: string | null;
    buy_volume: number | null;
    buy_value: number | null;
    sell_volume: number | null;
    sell_value: number | null;
    net_volume: number | null;
    net_value: number | null;
    total_room: number | null;
    current_room: number | null;
    owned_percent: number | null;
}

/**
 * Foreign trading response
 */
export interface ForeignTradingResponse {
    symbol: string;
    data: ForeignTradingItem[];
    count: number;
}

/**
 * Proprietary trading item
 */
export interface ProprietaryTradingItem {
    trading_date: string | null;
    buy_volume: number | null;
    buy_value: number | null;
    sell_volume: number | null;
    sell_value: number | null;
    net_volume: number | null;
    net_value: number | null;
    total_volume: number | null;
    total_value: number | null;
}

/**
 * Proprietary trading response
 */
export interface ProprietaryTradingResponse {
    symbol: string;
    data: ProprietaryTradingItem[];
    count: number;
}

/**
 * Order stats response
 */
export interface OrderStatsResponse {
    symbol: string;
    data: Record<string, unknown>[];
    count: number;
}

/**
 * Side stats response
 */
export interface SideStatsResponse {
    symbol: string;
    data: Record<string, unknown>[];
    count: number;
}

// ==================== Company API ====================

export const CompanyAPI = {
    /**
     * Get stock detail (price + ratios)
     * GET /company/{symbol}/detail
     */
    getStockDetail: async (symbol: string): Promise<StockDetailResponse> => {
        const response = await api.get<StockDetailResponse>(`/company/${symbol}/detail`);
        return response.data;
    },

    /**
     * Get company overview
     * GET /company/{symbol}/overview
     */
    getOverview: async (symbol: string): Promise<CompanyOverviewResponse> => {
        const response = await api.get<CompanyOverviewResponse>(`/company/${symbol}/overview`);
        return response.data;
    },

    /**
     * Get shareholders
     * GET /company/{symbol}/shareholders
     */
    getShareholders: async (symbol: string): Promise<ShareholdersResponse> => {
        const response = await api.get<ShareholdersResponse>(`/company/${symbol}/shareholders`);
        return response.data;
    },

    /**
     * Get officers (board members, executives)
     * GET /company/{symbol}/officers
     */
    getOfficers: async (symbol: string, filterBy = 'working'): Promise<OfficersResponse> => {
        const response = await api.get<OfficersResponse>(`/company/${symbol}/officers`, {
            params: { filter_by: filterBy },
        });
        return response.data;
    },

    /**
     * Get events (dividend, stock split, AGM, etc.)
     * GET /company/{symbol}/events
     */
    getEvents: async (symbol: string): Promise<EventsResponse> => {
        const response = await api.get<EventsResponse>(`/company/${symbol}/events`);
        return response.data;
    },

    /**
     * Get company news
     * GET /company/{symbol}/news
     */
    getNews: async (symbol: string): Promise<NewsResponse> => {
        const response = await api.get<NewsResponse>(`/company/${symbol}/news`);
        return response.data;
    },

    /**
     * Get analysis reports from securities companies
     * GET /company/{symbol}/analysis-reports
     */
    getAnalysisReports: async (
        symbol: string,
        page = 0,
        size = 20
    ): Promise<AnalysisReportsResponse> => {
        const response = await api.get<AnalysisReportsResponse>(
            `/company/${symbol}/analysis-reports`,
            { params: { page, size } }
        );
        return response.data;
    },
};

// ==================== Financials API ====================

export const FinancialsAPI = {
    /**
     * Get balance sheet
     * GET /financials/{symbol}/balance-sheet
     */
    getBalanceSheet: async (
        symbol: string,
        period = 'quarter',
        lang = 'vi',
        limit = 20
    ): Promise<FinancialReportResponse> => {
        const response = await api.get<FinancialReportResponse>(`/financials/${symbol}/balance-sheet`, {
            params: { period, lang, limit },
        });
        return response.data;
    },

    /**
     * Get income statement
     * GET /financials/{symbol}/income-statement
     */
    getIncomeStatement: async (
        symbol: string,
        period = 'quarter',
        lang = 'vi',
        limit = 20
    ): Promise<FinancialReportResponse> => {
        const response = await api.get<FinancialReportResponse>(`/financials/${symbol}/income-statement`, {
            params: { period, lang, limit },
        });
        return response.data;
    },

    /**
     * Get cash flow statement
     * GET /financials/{symbol}/cash-flow
     */
    getCashFlow: async (
        symbol: string,
        period = 'quarter',
        lang = 'vi',
        limit = 20
    ): Promise<FinancialReportResponse> => {
        const response = await api.get<FinancialReportResponse>(`/financials/${symbol}/cash-flow`, {
            params: { period, lang, limit },
        });
        return response.data;
    },

    /**
     * Get financial ratios
     * GET /financials/{symbol}/ratio
     */
    getRatio: async (
        symbol: string,
        period = 'quarter',
        limit = 20
    ): Promise<RatioResponse> => {
        const response = await api.get<RatioResponse>(`/financials/${symbol}/ratio`, {
            params: { period, limit },
        });
        return response.data;
    },

    /**
     * Get toolkit data with aggregated financial metrics
     * GET /financials/{symbol}/toolkit
     */
    getToolkit: async (
        symbol: string,
        period = 'year',
        limit = 8,
        lang = 'vi'
    ): Promise<ToolkitResponse> => {
        const response = await api.get<ToolkitResponse>(`/financials/${symbol}/toolkit`, {
            params: { period, limit, lang },
        });
        return response.data;
    },
};

// ==================== Insight API ====================

export const InsightAPI = {
    /**
     * Get foreign trading history
     * GET /insight/{symbol}/foreign
     */
    getForeignTrading: async (
        symbol: string,
        params?: { start?: string; end?: string; limit?: number }
    ): Promise<ForeignTradingResponse> => {
        const response = await api.get<ForeignTradingResponse>(`/insight/${symbol}/foreign`, { params });
        return response.data;
    },

    /**
     * Get proprietary trading history
     * GET /insight/{symbol}/proprietary
     */
    getProprietaryTrading: async (
        symbol: string,
        params?: { start?: string; end?: string; limit?: number }
    ): Promise<ProprietaryTradingResponse> => {
        const response = await api.get<ProprietaryTradingResponse>(`/insight/${symbol}/proprietary`, { params });
        return response.data;
    },

    /**
     * Get order statistics
     * GET /insight/{symbol}/orders
     */
    getOrderStats: async (symbol: string): Promise<OrderStatsResponse> => {
        const response = await api.get<OrderStatsResponse>(`/insight/${symbol}/orders`);
        return response.data;
    },

    /**
     * Get side statistics (buy/sell volume)
     * GET /insight/{symbol}/sides
     */
    getSideStats: async (symbol: string): Promise<SideStatsResponse> => {
        const response = await api.get<SideStatsResponse>(`/insight/${symbol}/sides`);
        return response.data;
    },
};

// ==================== Technical Analysis API Types ====================

/**
 * Gauge values for technical indicators
 */
export interface GaugeValues {
    buy: number;
    neutral: number;
    sell: number;
}

/**
 * Gauge data with rating
 */
export interface GaugeData {
    rating: 'VERY_GOOD' | 'GOOD' | 'NEUTRAL' | 'BAD' | 'VERY_BAD';
    values: GaugeValues;
}

/**
 * Moving average indicator
 */
export interface MovingAverageItem {
    name: string;
    rating: 'BUY' | 'NEUTRAL' | 'SELL';
    value: number;
}

/**
 * Oscillator indicator
 */
export interface OscillatorItem {
    name: string;
    rating: 'BUY' | 'NEUTRAL' | 'SELL';
    value: number;
}

/**
 * Pivot points data
 */
export interface PivotData {
    pivot_point: number;
    resistance1: number;
    resistance2: number;
    resistance3: number;
    support1: number;
    support2: number;
    support3: number;
    fib_resistance1?: number;
    fib_resistance2?: number;
    fib_resistance3?: number;
    fib_support1?: number;
    fib_support2?: number;
    fib_support3?: number;
    camarilla_resistance1?: number;
    camarilla_resistance2?: number;
    camarilla_resistance3?: number;
    camarilla_support1?: number;
    camarilla_support2?: number;
    camarilla_support3?: number;
}

/**
 * Technical analysis data
 */
export interface TechnicalData {
    symbol: string;
    timeframe: string;
    price: number;
    match_time: string | null;
    gauge_summary: GaugeData;
    gauge_moving_average: GaugeData;
    gauge_oscillator: GaugeData;
    moving_averages: MovingAverageItem[];
    oscillators: OscillatorItem[];
    pivot: PivotData;
}

/**
 * Technical analysis response
 */
export interface TechnicalAnalysisResponse {
    symbol: string;
    timeframe: string;
    data: TechnicalData | null;
    error: string | null;
}

export type TechnicalTimeframe = 'ONE_HOUR' | 'ONE_DAY' | 'ONE_WEEK';

// ==================== AI Insight API Types ====================

/**
 * Trading recommendation from AI analysis
 */
export interface TradingRecommendation {
    description: string;
    buy_price: string | null;
    buy_conditions: string[];
    stop_loss_price: string | null;
    stop_loss_conditions: string[];
    take_profit_price: string | null;
    take_profit_conditions: string[];
}

/**
 * AI Insight response
 */
export interface AIInsightResponse {
    symbol: string;
    period: number;
    current_price: number | null;
    current_volume: number | null;
    recommendation: TradingRecommendation | null;
    raw_analysis: string | null;
    candlestick_pattern: string | null;
    error: string | null;
}

/**
 * Candlestick pattern response
 */
export interface CandlestickPatternResponse {
    symbol: string;
    pattern: string | null;
    current_price: number | null;
    error?: string;
}

// ==================== Technical Analysis API ====================

export const TechnicalAPI = {
    /**
     * Get technical analysis for a symbol
     * GET /technical/{symbol}
     */
    getTechnicalAnalysis: async (
        symbol: string,
        timeframe: TechnicalTimeframe = 'ONE_DAY'
    ): Promise<TechnicalAnalysisResponse> => {
        const response = await api.get<TechnicalAnalysisResponse>(`/technical/${symbol}`, {
            params: { timeframe },
        });
        return response.data;
    },
};

// ==================== AI Insight API ====================

export const AIInsightAPI = {
    /**
     * Get AI-powered technical analysis insight
     * GET /ai-insight/{symbol}
     * Uses longer timeout for AI processing
     */
    getInsight: async (
        symbol: string,
        period: number = 20
    ): Promise<AIInsightResponse> => {
        const response = await api.get<AIInsightResponse>(`/ai-insight/${symbol}`, {
            params: { period },
            timeout: 120000, // 2 minutes timeout for AI processing
        });
        return response.data;
    },

    /**
     * Get candlestick pattern only
     * GET /ai-insight/{symbol}/pattern
     */
    getCandlestickPattern: async (symbol: string): Promise<CandlestickPatternResponse> => {
        const response = await api.get<CandlestickPatternResponse>(`/ai-insight/${symbol}/pattern`);
        return response.data;
    },
};

export default { CompanyAPI, FinancialsAPI, InsightAPI, TechnicalAPI, AIInsightAPI };
