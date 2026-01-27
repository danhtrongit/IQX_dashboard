/**
 * Market API - Vietcap data integration
 */
import api from './api';

// ==================== Types ====================

export interface IndexImpactStock {
    symbol: string;
    impact: number | null;
    exchange: string | null;
    organName: string | null;
    organShortName: string | null;
    enOrganName: string | null;
    enOrganShortName: string | null;
    matchPrice: number | null;
    refPrice: number | null;
    ceiling: number | null;
    floor: number | null;
}

export interface IndexImpactResponse {
    topUp: IndexImpactStock[];
    topDown: IndexImpactStock[];
    group: string;
    timeFrame: string;
}

export interface ProprietaryStock {
    ticker: string;
    totalValue: number | null;
    totalVolume: number | null;
    exchange: string | null;
    organName: string | null;
    organShortName: string | null;
    enOrganName: string | null;
    enOrganShortName: string | null;
    matchPrice: number | null;
    refPrice: number | null;
}

export interface TopProprietaryResponse {
    tradingDate: string | null;
    buy: ProprietaryStock[];
    sell: ProprietaryStock[];
    exchange: string;
    timeFrame: string;
}

export interface ForeignNetStock {
    symbol: string;
    net: number | null;
    foreignBuyValue: number | null;
    foreignSellValue: number | null;
    exchange: string | null;
    organName: string | null;
    organShortName: string | null;
    enOrganName: string | null;
    enOrganShortName: string | null;
    matchPrice: number | null;
    refPrice: number | null;
}

export interface ForeignNetValueResponse {
    netBuy: ForeignNetStock[];
    netSell: ForeignNetStock[];
    group: string;
    timeFrame: string;
}

export interface AllocatedValueItem {
    totalIncrease: Array<{ group: string;[key: string]: number | string }>;
    totalNochange: Array<{ group: string;[key: string]: number | string }>;
    totalDecrease: Array<{ group: string;[key: string]: number | string }>;
    totalSymbolIncrease: Array<{ group: string;[key: string]: number | string }>;
    totalSymbolNochange: Array<{ group: string;[key: string]: number | string }>;
    totalSymbolDecrease: Array<{ group: string;[key: string]: number | string }>;
}

export interface AllocatedValueResponse {
    data: AllocatedValueItem[];
    group: string;
    timeFrame: string;
    count: number;
}

export interface AllocatedICBItem {
    icb_code: number;
    sector_name_vi: string | null;
    sector_name_en: string | null;
    icb_level: number | null;
    icbChangePercent: number | null;
    totalPriceChange: number | null;
    totalMarketCap: number | null;
    totalValue: number | null;
    totalStockIncrease: number | null;
    totalStockDecrease: number | null;
    totalStockNoChange: number | null;
    icbCodeParent: number | null;
}

export interface AllocatedICBResponse {
    data: AllocatedICBItem[];
    group: string;
    timeFrame: string;
    count: number;
}

// ICB Detail (stocks in a sector)
export interface AllocatedICBStockItem {
    symbol: string;
    refPrice: number | null;
    matchPrice: number | null;
    accumulatedVolume: number | null;
    accumulatedValue: number | null;
    priceChange: number | null;
    priceChangePercent: number | null;
    marketCap: number | null;
    foreignNetVolume?: number | null;
    exchange?: string | null;
}

export interface AllocatedICBDetailResponse {
    icbCode: number;
    sectorName: string | null;
    icbChangePercent: number | null;
    totalValue: number | null;
    totalStockIncrease: number | null;
    totalStockDecrease: number | null;
    totalStockNoChange: number | null;
    stocks: AllocatedICBStockItem[];
    group: string;
    timeFrame: string;
}

// ==================== API Endpoints ====================

export type TimeFrame = 'ONE_DAY' | 'ONE_WEEK' | 'ONE_MONTH' | 'YTD' | 'ONE_YEAR';
export type MarketGroup = 'HOSE' | 'HNX' | 'UPCOME' | 'ALL';

const timeFrameMap: Record<string, TimeFrame> = {
    '1D': 'ONE_DAY',
    '1W': 'ONE_WEEK',
    '1M': 'ONE_MONTH',
    '1Y': 'ONE_YEAR',
    'YTD': 'YTD',
};

export const MarketAPI = {
    /**
     * Get index impact (market leading stocks)
     */
    getIndexImpact: async (
        group: MarketGroup = 'ALL',
        timeFrame: TimeFrame | string = 'ONE_WEEK'
    ): Promise<IndexImpactResponse> => {
        const tf = timeFrameMap[timeFrame] || timeFrame;
        const response = await api.get<IndexImpactResponse>('/market/index-impact', {
            params: { group, time_frame: tf }
        });
        return response.data;
    },

    /**
     * Get top proprietary trading
     */
    getTopProprietary: async (
        exchange: MarketGroup = 'ALL',
        timeFrame: TimeFrame | string = 'ONE_WEEK'
    ): Promise<TopProprietaryResponse> => {
        const tf = timeFrameMap[timeFrame] || timeFrame;
        const response = await api.get<TopProprietaryResponse>('/market/top-proprietary', {
            params: { exchange, time_frame: tf }
        });
        return response.data;
    },

    /**
     * Get foreign net value
     */
    getForeignNetValue: async (
        group: MarketGroup = 'ALL',
        timeFrame: TimeFrame | string = 'ONE_WEEK'
    ): Promise<ForeignNetValueResponse> => {
        const tf = timeFrameMap[timeFrame] || timeFrame;
        const response = await api.get<ForeignNetValueResponse>('/market/foreign-net-value', {
            params: { group, time_frame: tf }
        });
        return response.data;
    },

    /**
     * Get allocated value (market breadth)
     */
    getAllocatedValue: async (
        group: MarketGroup = 'HOSE',
        timeFrame: TimeFrame | string = 'ONE_WEEK'
    ): Promise<AllocatedValueResponse> => {
        const tf = timeFrameMap[timeFrame] || timeFrame;
        const response = await api.get<AllocatedValueResponse>('/market/allocated-value', {
            params: { group, time_frame: tf }
        });
        return response.data;
    },

    /**
     * Get allocated ICB (sector allocation)
     */
    getAllocatedICB: async (
        group: MarketGroup = 'HOSE',
        timeFrame: TimeFrame | string = 'ONE_WEEK'
    ): Promise<AllocatedICBResponse> => {
        const tf = timeFrameMap[timeFrame] || timeFrame;
        const response = await api.get<AllocatedICBResponse>('/market/allocated-icb', {
            params: { group, time_frame: tf }
        });
        return response.data;
    },

    /**
     * Get allocated ICB detail (stocks in a sector)
     */
    getAllocatedICBDetail: async (
        icbCode: number | string,
        group: MarketGroup = 'HOSE',
        timeFrame: TimeFrame | string = 'ONE_WEEK'
    ): Promise<AllocatedICBDetailResponse> => {
        const tf = timeFrameMap[timeFrame] || timeFrame;
        const response = await api.get<AllocatedICBDetailResponse>('/market/allocated-icb-detail', {
            params: { icb_code: icbCode, group, time_frame: tf }
        });
        return response.data;
    },
};

// ==================== Sector API Types ====================

export interface SectorInfo {
    icb_code: number;
    en_sector: string | null;
    vi_sector: string | null;
    icb_level: number | null;
    market_cap: number | null;
    weight_percent: number | null;
    last_close_index: number | null;
    last_20_day_index: number[] | null;
    percent_change_1d: number | null;
    percent_change_1w: number | null;
    percent_change_1m: number | null;
    percent_change_6m: number | null;
    percent_change_ytd: number | null;
    percent_change_1y: number | null;
    percent_change_2y: number | null;
    percent_change_5y: number | null;
}

export interface SectorListResponse {
    total: number;
    icb_level: number;
    sectors: SectorInfo[];
}

export interface SectorRankingValue {
    date: string;
    value: number | null;
    sector_trend: string | null;
}

export interface SectorRanking {
    icb_code: number;
    en_sector: string | null;
    vi_sector: string | null;
    values: SectorRankingValue[];
}

export interface SectorRankingResponse {
    total: number;
    icb_level: number;
    rankings: SectorRanking[];
}

export interface SectorCompany {
    ticker: string;
    organShortNameVi: string | null;  // company_name alias
    marketCap: number | null;
    latestPrice: number | null;
    percentPriceChange: number | null;
    ttmPe: number | null;
    ttmPb: number | null;
    ttmEps: number | null;
    roe: number | null;
    roa: number | null;
    averageMatchVolume1Month: number | null;
    foreignRoom: number | null;
    foreignOwnership: number | null;
}

export interface SectorCompaniesResponse {
    icb_code: number;
    en_sector: string | null;
    vi_sector: string | null;
    total_companies: number;
    companies: SectorCompany[];
}

export interface TradingDatesResponse {
    dates: string[];
}

// ==================== Sector API Endpoints ====================

export const SectorAPI = {
    /**
     * Get sector information with performance metrics
     */
    getSectorInformation: async (icbLevel: number = 2): Promise<SectorListResponse> => {
        const response = await api.get<SectorListResponse>('/sector/information', {
            params: { icb_level: icbLevel }
        });
        return response.data;
    },

    /**
     * Get sector ranking with daily trends
     */
    getSectorRanking: async (
        icbLevel: number = 2,
        adtv: number = 3,
        value: number = 3
    ): Promise<SectorRankingResponse> => {
        const response = await api.get<SectorRankingResponse>('/sector/ranking', {
            params: { icb_level: icbLevel, adtv, value }
        });
        return response.data;
    },

    /**
     * Get companies within a sector
     */
    getSectorCompanies: async (icbCode: number): Promise<SectorCompaniesResponse> => {
        const response = await api.get<SectorCompaniesResponse>(`/sector/companies/${icbCode}`);
        return response.data;
    },

    /**
     * Get trading dates
     */
    getTradingDates: async (): Promise<TradingDatesResponse> => {
        const response = await api.get<TradingDatesResponse>('/sector/trading-dates');
        return response.data;
    },
};

export default MarketAPI;

