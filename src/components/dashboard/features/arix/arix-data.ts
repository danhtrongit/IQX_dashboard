// Arix Trading Data - Parsed from CSV files
// Total Assets: 1,000,000,000 VND

export const TOTAL_ASSETS = 1_000_000_000; // 1 tỉ VNĐ

export interface ArixSellTrade {
    symbol: string;
    buyDate: string;
    buyPrice: number;
    quantity: number;
    sellDate: string;
    sellPrice: number;
    returnPercent: number;
    profitLoss: number;
    daysHeld: number;
}

export interface ArixHoldPosition {
    symbol: string;
    date: string;
    price: number;
    volume: number;
}

export interface ArixPlanItem {
    symbol: string;
    buyPrice: number;
    stopLoss: number;
    target: number;
    returnRisk: number;
}

// Parsed from ArixSell.csv
export const arixSellData: ArixSellTrade[] = [
    { symbol: "BAF", buyDate: "23/01/2025", buyPrice: 27400, quantity: 3650, sellDate: "10/03/2025", sellPrice: 34650, returnPercent: 26, profitLoss: 26459854, daysHeld: 46 },
    { symbol: "HDB", buyDate: "06/02/2025", buyPrice: 22950, quantity: 4357, sellDate: "26/02/2025", sellPrice: 23050, returnPercent: 0, profitLoss: 435730, daysHeld: 20 },
    { symbol: "HHV", buyDate: "04/03/2025", buyPrice: 12286, quantity: 8140, sellDate: "12/03/2025", sellPrice: 12333, returnPercent: 0, profitLoss: 384879, daysHeld: 8 },
    { symbol: "CTG", buyDate: "24/03/2025", buyPrice: 41800, quantity: 2392, sellDate: "14/10/2025", sellPrice: 56000, returnPercent: 34, profitLoss: 33971292, daysHeld: 204 },
    { symbol: "MBB", buyDate: "12/06/2025", buyPrice: 18581, quantity: 5382, sellDate: "18/08/2025", sellPrice: 27800, returnPercent: 50, profitLoss: 49616313, daysHeld: 67 },
    { symbol: "SHB", buyDate: "17/06/2025", buyPrice: 11681, quantity: 8561, sellDate: "06/08/2025", sellPrice: 16594, returnPercent: 42, profitLoss: 42054657, daysHeld: 50 },
    { symbol: "VHM", buyDate: "17/06/2025", buyPrice: 69600, quantity: 1437, sellDate: "14/10/2025", sellPrice: 124200, returnPercent: 78, profitLoss: 78448276, daysHeld: 119 },
    { symbol: "FCN", buyDate: "20/06/2025", buyPrice: 14150, quantity: 7067, sellDate: "19/08/2025", sellPrice: 19000, returnPercent: 34, profitLoss: 34275618, daysHeld: 60 },
    { symbol: "HHS", buyDate: "30/06/2025", buyPrice: 15250, quantity: 6557, sellDate: "01/08/2025", sellPrice: 18600, returnPercent: 22, profitLoss: 21967213, daysHeld: 32 },
    { symbol: "POW", buyDate: "03/07/2025", buyPrice: 13250, quantity: 7547, sellDate: "19/08/2025", sellPrice: 16200, returnPercent: 22, profitLoss: 22264151, daysHeld: 47 },
    { symbol: "GEE", buyDate: "14/07/2025", buyPrice: 96611, quantity: 1035, sellDate: "31/07/2025", sellPrice: 123900, returnPercent: 28, profitLoss: 28246750, daysHeld: 17 },
    { symbol: "MSN", buyDate: "28/07/2025", buyPrice: 77600, quantity: 1289, sellDate: "14/10/2025", sellPrice: 84900, returnPercent: 9, profitLoss: 9407216, daysHeld: 78 },
    { symbol: "LPB", buyDate: "04/08/2025", buyPrice: 34700, quantity: 2882, sellDate: "27/08/2025", sellPrice: 43800, returnPercent: 26, profitLoss: 26224784, daysHeld: 23 },
    { symbol: "TCB", buyDate: "04/08/2025", buyPrice: 34438, quantity: 2904, sellDate: "22/08/2025", sellPrice: 37900, returnPercent: 10, profitLoss: 10053622, daysHeld: 18 },
    { symbol: "HHS", buyDate: "07/08/2025", buyPrice: 17700, quantity: 5650, sellDate: "20/08/2025", sellPrice: 17200, returnPercent: -3, profitLoss: -2824859, daysHeld: 13 },
    { symbol: "TCH", buyDate: "08/08/2025", buyPrice: 21362, quantity: 4681, sellDate: "21/08/2025", sellPrice: 21350, returnPercent: 0, profitLoss: -54206, daysHeld: 13 },
    { symbol: "DXS", buyDate: "26/08/2025", buyPrice: 12050, quantity: 8299, sellDate: "17/09/2025", sellPrice: 12950, returnPercent: 7, profitLoss: 7468880, daysHeld: 22 },
    { symbol: "KSB", buyDate: "26/08/2025", buyPrice: 19000, quantity: 5263, sellDate: "16/09/2025", sellPrice: 22200, returnPercent: 17, profitLoss: 16842105, daysHeld: 21 },
    { symbol: "IJC", buyDate: "27/08/2025", buyPrice: 11794, quantity: 8479, sellDate: "16/09/2025", sellPrice: 13678, returnPercent: 16, profitLoss: 15972626, daysHeld: 20 },
    { symbol: "HPX", buyDate: "29/08/2025", buyPrice: 5590, quantity: 17889, sellDate: "05/09/2025", sellPrice: 5490, returnPercent: -2, profitLoss: -1788909, daysHeld: 7 },
    { symbol: "HHV", buyDate: "03/09/2025", buyPrice: 15250, quantity: 6557, sellDate: "14/10/2025", sellPrice: 19100, returnPercent: 25, profitLoss: 25245902, daysHeld: 41 },
    { symbol: "LDG", buyDate: "03/09/2025", buyPrice: 5190, quantity: 19268, sellDate: "08/09/2025", sellPrice: 4860, returnPercent: -6, profitLoss: -6358382, daysHeld: 5 },
    { symbol: "NAB", buyDate: "04/09/2025", buyPrice: 16300, quantity: 6135, sellDate: "10/09/2025", sellPrice: 15500, returnPercent: -5, profitLoss: -4907975, daysHeld: 6 },
    { symbol: "HDB", buyDate: "10/09/2025", buyPrice: 31600, quantity: 3165, sellDate: "17/09/2025", sellPrice: 30950, returnPercent: -2, profitLoss: -2056962, daysHeld: 7 },
    { symbol: "SHB", buyDate: "10/09/2025", buyPrice: 17800, quantity: 5618, sellDate: "22/09/2025", sellPrice: 17350, returnPercent: -3, profitLoss: -2528090, daysHeld: 12 },
    { symbol: "LPB", buyDate: "15/09/2025", buyPrice: 44550, quantity: 2245, sellDate: "14/10/2025", sellPrice: 52500, returnPercent: 18, profitLoss: 17845118, daysHeld: 29 },
    { symbol: "VND", buyDate: "15/09/2025", buyPrice: 24600, quantity: 4065, sellDate: "18/09/2025", sellPrice: 23350, returnPercent: -5, profitLoss: -5081301, daysHeld: 3 },
    { symbol: "AAA", buyDate: "24/09/2025", buyPrice: 8110, quantity: 12330, sellDate: "29/09/2025", sellPrice: 8600, returnPercent: 6, profitLoss: 6041924, daysHeld: 5 },
    { symbol: "HHV", buyDate: "24/09/2025", buyPrice: 15400, quantity: 6494, sellDate: "30/09/2025", sellPrice: 16300, returnPercent: 6, profitLoss: 5844156, daysHeld: 6 },
    { symbol: "HSG", buyDate: "24/09/2025", buyPrice: 19400, quantity: 5155, sellDate: "30/09/2025", sellPrice: 18750, returnPercent: -3, profitLoss: -3350515, daysHeld: 6 },
    { symbol: "TCB", buyDate: "24/09/2025", buyPrice: 37799, quantity: 2646, sellDate: "14/10/2025", sellPrice: 41300, returnPercent: 9, profitLoss: 9262938, daysHeld: 20 },
    { symbol: "TCH", buyDate: "24/09/2025", buyPrice: 21700, quantity: 4608, sellDate: "14/10/2025", sellPrice: 25850, returnPercent: 19, profitLoss: 19124424, daysHeld: 20 },
    { symbol: "CTS", buyDate: "29/09/2025", buyPrice: 41700, quantity: 2398, sellDate: "14/10/2025", sellPrice: 44800, returnPercent: 7, profitLoss: 7434053, daysHeld: 15 },
    { symbol: "VIC", buyDate: "09/09/2025", buyPrice: 129200, quantity: 774, sellDate: "17/10/2025", sellPrice: 204000, returnPercent: 58, profitLoss: 57894737, daysHeld: 38 },
    { symbol: "VRE", buyDate: "29/09/2025", buyPrice: 30000, quantity: 3333, sellDate: "17/10/2025", sellPrice: 41000, returnPercent: 37, profitLoss: 36666667, daysHeld: 18 },
    { symbol: "HDC", buyDate: "26/08/2025", buyPrice: 35000, quantity: 2857, sellDate: "17/10/2025", sellPrice: 41000, returnPercent: 17, profitLoss: 17142857, daysHeld: 52 },
    { symbol: "VNM", buyDate: "30/09/2025", buyPrice: 57312, quantity: 1745, sellDate: "17/10/2025", sellPrice: 58800, returnPercent: 3, profitLoss: 2596315, daysHeld: 11 },
    { symbol: "HDG", buyDate: "08/10/2025", buyPrice: 32400, quantity: 3086, sellDate: "20/10/2025", sellPrice: 32150, returnPercent: -1, profitLoss: -771500, daysHeld: 12 },
    { symbol: "KHG", buyDate: "08/10/2025", buyPrice: 6980, quantity: 14327, sellDate: "20/10/2025", sellPrice: 6510, returnPercent: -7, profitLoss: -6733690, daysHeld: 12 },
    { symbol: "GMD", buyDate: "15/10/2025", buyPrice: 69000, quantity: 1450, sellDate: "20/10/2025", sellPrice: 63300, returnPercent: -8, profitLoss: -8265000, daysHeld: 5 },
    { symbol: "NVL", buyDate: "16/10/2025", buyPrice: 16250, quantity: 6154, sellDate: "20/10/2025", sellPrice: 15450, returnPercent: -5, profitLoss: -4923200, daysHeld: 4 },
    { symbol: "MSN", buyDate: "16/10/2025", buyPrice: 88200, quantity: 1134, sellDate: "20/10/2025", sellPrice: 81900, returnPercent: -7, profitLoss: -7144200, daysHeld: 4 },
    { symbol: "NTL", buyDate: "17/10/2025", buyPrice: 20300, quantity: 4926, sellDate: "20/10/2025", sellPrice: 18900, returnPercent: -7, profitLoss: -6896400, daysHeld: 3 },
    { symbol: "ICT", buyDate: "16/10/2025", buyPrice: 18200, quantity: 5495, sellDate: "11/11/2025", sellPrice: 24600, returnPercent: 35, profitLoss: 35168000, daysHeld: 26 },
];

// Parsed from ArixHold.csv
export const arixHoldData: ArixHoldPosition[] = [
    { symbol: "GMD", date: "15/10/2025", price: 69000, volume: 4926 },
    { symbol: "NVL", date: "16/10/2025", price: 16250, volume: 5495 },
];

// Parsed from ArixPlan.csv
export const arixPlanData: ArixPlanItem[] = [
    { symbol: "GMD", buyPrice: 69000, stopLoss: 4926, target: 1.3, returnRisk: 1.3 },
    { symbol: "NVL", buyPrice: 16250, stopLoss: 5495, target: 1.5, returnRisk: 1.5 },
];

// Calculate trading statistics
export function calculateTradingStats() {
    const totalTrades = arixSellData.length;
    const winTrades = arixSellData.filter(t => t.profitLoss > 0).length;
    const lossTrades = arixSellData.filter(t => t.profitLoss < 0).length;
    const totalProfitLoss = arixSellData.reduce((sum, t) => sum + t.profitLoss, 0);
    const avgDaysHeld = Math.round(arixSellData.reduce((sum, t) => sum + t.daysHeld, 0) / totalTrades);
    const winRate = (winTrades / totalTrades) * 100;
    const returnOnAssets = (totalProfitLoss / TOTAL_ASSETS) * 100;

    // Best and worst trades
    const bestTrade = arixSellData.reduce((best, t) => t.profitLoss > best.profitLoss ? t : best);
    const worstTrade = arixSellData.reduce((worst, t) => t.profitLoss < worst.profitLoss ? t : worst);

    return {
        totalTrades,
        winTrades,
        lossTrades,
        totalProfitLoss,
        avgDaysHeld,
        winRate,
        returnOnAssets,
        bestTrade,
        worstTrade,
    };
}

// Prepare data for bubble chart
export function prepareBubbleChartData() {
    return arixSellData.map((trade, index) => ({
        id: index,
        symbol: trade.symbol,
        x: trade.daysHeld, // X-axis: Days held
        y: trade.returnPercent, // Y-axis: Return %
        z: Math.abs(trade.profitLoss), // Bubble size: P/L absolute value
        profitLoss: trade.profitLoss,
        isProfit: trade.profitLoss >= 0,
        buyDate: trade.buyDate,
        sellDate: trade.sellDate,
        buyPrice: trade.buyPrice,
        sellPrice: trade.sellPrice,
        quantity: trade.quantity,
    }));
}
