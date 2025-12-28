import api from './api';

// ==================== Trading API Types (from OpenAPI spec) ====================

/**
 * Wallet response - GET /trading/wallet
 */
export interface WalletResponse {
    balance: string;
    locked: string;
    available: string;
    currency: string;
    first_grant_at: string | null;
}

/**
 * Position response - from /trading/positions
 */
export interface PositionResponse {
    symbol: string;
    quantity: string;
    locked_quantity: string;
    available_quantity: string;
    avg_price: string;
    market_price: string | null;
    market_value: string | null;
    unrealized_pnl: string | null;
}

/**
 * Position list response - GET /trading/positions
 */
export interface PositionListResponse {
    data: PositionResponse[];
    total_market_value: string | null;
}

/**
 * Place order request - POST /trading/orders
 */
export interface PlaceOrderRequest {
    symbol: string;
    side: 'BUY' | 'SELL';
    type: 'MARKET' | 'LIMIT';
    quantity: number;
    limit_price?: number | null;
    client_order_id?: string | null;
}

/**
 * Order response
 */
export interface OrderResponse {
    id: number;
    user_id: number;
    symbol: string;
    side: string;
    type: string;
    status: string;
    quantity: string;
    filled_quantity: string;
    limit_price: string | null;
    avg_fill_price: string | null;
    fee: string | null;
    client_order_id: string | null;
    created_at: string;
    updated_at: string;
}

/**
 * Place order response - POST /trading/orders
 */
export interface PlaceOrderResponse {
    order: OrderResponse;
    wallet: WalletResponse;
}

/**
 * Cancel order response - POST /trading/orders/{order_id}/cancel
 */
export interface CancelOrderResponse {
    order: OrderResponse;
    wallet: WalletResponse;
}

/**
 * Order list response - GET /trading/orders
 */
export interface OrderListResponse {
    data: OrderResponse[];
    total: number;
    limit: number;
    offset: number;
}

/**
 * Grant initial cash response
 */
export interface GrantCashResponse {
    wallet: WalletResponse;
    granted: boolean;
    message: string;
}

// ==================== Price Board Types ====================

/**
 * Price info from price board
 */
export interface PriceInfo {
    symbol: string;
    exchange: string | null;
    organ_name: string | null;
    price: number | null;
    change: number | null;
    change_percent: number | null;
    volume: number | null;
    value: number | null;
    ref_price: number | null;
    ceiling: number | null;
    floor: number | null;
    open: number | null;
    high: number | null;
    low: number | null;
    // Bid levels
    bid_1_price: number | null;
    bid_1_volume: number | null;
    bid_2_price: number | null;
    bid_2_volume: number | null;
    bid_3_price: number | null;
    bid_3_volume: number | null;
    // Ask levels
    ask_1_price: number | null;
    ask_1_volume: number | null;
    ask_2_price: number | null;
    ask_2_volume: number | null;
    ask_3_price: number | null;
    ask_3_volume: number | null;
    // Foreign trading
    foreign_buy_volume: number | null;
    foreign_sell_volume: number | null;
}

/**
 * Price board request
 */
export interface PriceBoardRequest {
    symbols: string[];
}

/**
 * Price board response
 */
export interface PriceBoardResponse {
    data: PriceInfo[];
    count: number;
}

/**
 * Normalize PriceInfo by filling in missing values with fallbacks
 * - Use open as ref_price if ref_price is null
 * - Calculate ceiling/floor from ref_price (±7% for HOSE, ±10% for HNX/UPCOM)
 * - Use bid_1_price as price if price is null
 */
export const normalizePriceInfo = (info: PriceInfo): PriceInfo => {
    const normalized = { ...info };

    // Use open as ref_price fallback
    if (normalized.ref_price == null && normalized.open != null) {
        normalized.ref_price = normalized.open;
    }

    // Use bid_1_price as price fallback
    if (normalized.price == null && normalized.bid_1_price != null) {
        normalized.price = normalized.bid_1_price;
    }

    // Calculate ceiling/floor if missing (default ±7% for HOSE)
    if (normalized.ref_price != null) {
        const priceLimitPercent = normalized.exchange === 'HNX' || normalized.exchange === 'UPCOM' ? 0.10 : 0.07;

        if (normalized.ceiling == null) {
            normalized.ceiling = Math.round(normalized.ref_price * (1 + priceLimitPercent) / 100) * 100;
        }
        if (normalized.floor == null) {
            normalized.floor = Math.round(normalized.ref_price * (1 - priceLimitPercent) / 100) * 100;
        }
    }

    // Calculate change and change_percent if missing but we have price and ref_price
    if (normalized.price != null && normalized.ref_price != null) {
        if (normalized.change == null) {
            normalized.change = normalized.price - normalized.ref_price;
        }
        if (normalized.change_percent == null) {
            normalized.change_percent = ((normalized.price - normalized.ref_price) / normalized.ref_price) * 100;
        }
    }

    return normalized;
};

// ==================== Trading API endpoints ====================

export const TradingAPI = {
    /**
     * Get wallet - GET /trading/wallet
     */
    getWallet: async (): Promise<WalletResponse> => {
        const response = await api.get<WalletResponse>('/trading/wallet');
        return response.data;
    },

    /**
     * Get positions - GET /trading/positions
     */
    getPositions: async (): Promise<PositionListResponse> => {
        const response = await api.get<PositionListResponse>('/trading/positions');
        return response.data;
    },

    /**
     * Grant initial cash - POST /trading/bootstrap/grant-initial-cash
     */
    grantInitialCash: async (): Promise<GrantCashResponse> => {
        const response = await api.post<GrantCashResponse>('/trading/bootstrap/grant-initial-cash');
        return response.data;
    },

    /**
     * Place order - POST /trading/orders
     */
    placeOrder: async (order: PlaceOrderRequest): Promise<PlaceOrderResponse> => {
        const response = await api.post<PlaceOrderResponse>('/trading/orders', order);
        return response.data;
    },

    /**
     * Get orders - GET /trading/orders
     */
    getOrders: async (params?: {
        status?: string;
        symbol?: string;
        limit?: number;
        offset?: number;
    }): Promise<OrderListResponse> => {
        const response = await api.get<OrderListResponse>('/trading/orders', { params });
        return response.data;
    },

    /**
     * Get order by ID - GET /trading/orders/{order_id}
     */
    getOrder: async (orderId: number): Promise<OrderResponse> => {
        const response = await api.get<OrderResponse>(`/trading/orders/${orderId}`);
        return response.data;
    },

    /**
     * Cancel order - POST /trading/orders/{order_id}/cancel
     */
    cancelOrder: async (orderId: number): Promise<CancelOrderResponse> => {
        const response = await api.post<CancelOrderResponse>(`/trading/orders/${orderId}/cancel`);
        return response.data;
    },
};

// ==================== Quotes/Price API endpoints ====================

export const QuotesAPI = {
    /**
     * Get price board - POST /quotes/price-board
     */
    getPriceBoard: async (symbols: string[]): Promise<PriceBoardResponse> => {
        const response = await api.post<PriceBoardResponse>('/quotes/price-board', {
            symbols,
        } as PriceBoardRequest);
        return response.data;
    },
};

// ==================== Helper functions ====================

// Re-export formatters from shared format utility
export {
    formatNumber,
    formatPrice,
    formatVolume,
    formatPercent,
    formatCurrency,
    formatCompact,
    formatRatio,
    formatMarketCap,
} from './format';

/**
 * Get price color class based on change
 */
export const getPriceColorClass = (
    price: number | null | undefined,
    refPrice: number | null | undefined,
    ceiling: number | null | undefined,
    floor: number | null | undefined
): string => {
    if (price === null || price === undefined) return 'text-foreground';

    // Ceiling price (purple)
    if (ceiling && price >= ceiling) return 'text-[#b02bfe]';

    // Floor price (cyan)
    if (floor && price <= floor) return 'text-[#00c5c5]';

    // Reference price (yellow/orange)
    if (refPrice && price === refPrice) return 'text-[#f8a500]';

    // Up (green)
    if (refPrice && price > refPrice) return 'text-[#00c076]';

    // Down (red)
    if (refPrice && price < refPrice) return 'text-[#ff3a3a]';

    return 'text-foreground';
};
