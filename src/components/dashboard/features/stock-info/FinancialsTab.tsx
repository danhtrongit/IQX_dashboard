"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { BarChart3, DollarSign, Wallet, ArrowUpDown, Loader2, Table, LineChart as LineChartIcon, Plus, Minus, Wrench } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FinancialsAPI, type FinancialReportResponse, type RatioResponse } from "@/lib/stock-api";
import { formatCompact } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Legend,
    ComposedChart,
} from "recharts";
import { ToolkitTab } from "./ToolkitTab";

interface FinancialsTabProps {
    symbol: string;
}

// Format number for display - convert to billions (tỷ VNĐ) with 2 decimals
const formatBillion = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) return "0";
    // Convert to billions (tỷ)
    const billions = value / 1_000_000_000;
    // Format with 2 decimals and thousand separators
    return billions.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

// Format number for display (original compact format for charts)
const formatNumber = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) return "—";
    return formatCompact(value);
};

// Format for chart axis
const formatAxisValue = (value: number): string => {
    return formatCompact(value);
};

// Custom axis tick component that uses CSS variable colors
const CustomAxisTick = ({ x, y, payload, textAnchor = "middle" }: any) => {
    return (
        <text
            x={x}
            y={y}
            textAnchor={textAnchor}
            className="fill-muted-foreground text-[10px]"
            dy={4}
        >
            {payload.value}
        </text>
    );
};

// Custom Y-axis tick for numbers
const CustomYAxisTick = ({ x, y, payload, formatter }: any) => {
    const formattedValue = formatter ? formatter(payload.value) : formatAxisValue(payload.value);
    return (
        <text
            x={x}
            y={y}
            textAnchor="end"
            className="fill-muted-foreground text-[10px]"
            dy={4}
        >
            {formattedValue}
        </text>
    );
};

// Tab types
type FinancialViewType = 'income' | 'ratio' | 'balance' | 'cashflow' | 'toolkit';
type DisplayMode = 'table' | 'chart';

const financialTabs: { id: FinancialViewType; label: string; icon: React.ReactNode }[] = [
    { id: 'income', label: 'KQKD', icon: <DollarSign className="h-3 w-3" /> },
    { id: 'balance', label: 'CĐKT', icon: <Wallet className="h-3 w-3" /> },
    { id: 'cashflow', label: 'LCTT', icon: <ArrowUpDown className="h-3 w-3" /> },
    { id: 'ratio', label: 'Chỉ số', icon: <BarChart3 className="h-3 w-3" /> },
    { id: 'toolkit', label: 'Toolkit', icon: <Wrench className="h-3 w-3" /> },
];

// =============================================
// Hierarchical field definitions from API docs
// =============================================

interface FieldItem {
    key: string;
    label: string;
    chartKey?: string;
    isPercent?: boolean;
    isHeader?: boolean;
    children?: FieldItem[];
}

// Income statement fields - hierarchical structure (matching vnstock API)
const incomeFieldsHierarchy: FieldItem[] = [
    { key: 'Doanh thu bán hàng và cung cấp dịch vụ', label: 'Doanh thu bán hàng và CCDV', chartKey: 'grossRevenue' },
    { key: 'Các khoản giảm trừ doanh thu', label: 'Các khoản giảm trừ doanh thu' },
    { key: 'Doanh thu thuần', label: 'Doanh thu thuần', chartKey: 'revenue', isHeader: true },
    { key: 'Giá vốn hàng bán', label: 'Giá vốn hàng bán', chartKey: 'cogs' },
    { key: 'Lãi gộp', label: 'Lợi nhuận gộp', chartKey: 'grossProfit', isHeader: true },
    { key: 'Thu nhập tài chính', label: 'Doanh thu hoạt động tài chính' },
    {
        key: 'Chi phí tài chính', label: 'Chi phí tài chính', isHeader: true, children: [
            { key: 'Chi phí tiền lãi vay', label: 'Chi phí lãi vay' },
        ]
    },
    { key: 'Chi phí bán hàng', label: 'Chi phí bán hàng', chartKey: 'sellingExp' },
    { key: 'Chi phí quản lý DN', label: 'Chi phí quản lý doanh nghiệp', chartKey: 'adminExp' },
    { key: 'Lãi/Lỗ từ hoạt động kinh doanh', label: 'Lãi/(lỗ) từ hoạt động kinh doanh', chartKey: 'operatingProfit', isHeader: true },
    {
        key: 'Thu nhập/Chi phí khác', label: 'Thu nhập khác, ròng', isHeader: true, children: [
            { key: 'Thu nhập khác', label: 'Thu nhập khác' },
            { key: 'Lợi nhuận khác', label: 'Lợi nhuận khác' },
        ]
    },
    { key: 'Lãi/lỗ từ công ty liên doanh', label: 'Lãi/(lỗ) từ công ty liên doanh' },
    { key: 'LN trước thuế', label: 'Lãi/(lỗ) trước thuế', chartKey: 'preTaxProfit', isHeader: true },
    {
        key: 'tax_group', label: 'Chi phí thuế TNDN', isHeader: true, children: [
            { key: 'Chi phí thuế TNDN hiện hành', label: 'Thuế TNDN - hiện thời' },
            { key: 'Chi phí thuế TNDN hoãn lại', label: 'Thuế TNDN - hoãn lại' },
        ]
    },
    { key: 'Lợi nhuận thuần', label: 'Lãi/(lỗ) thuần sau thuế', chartKey: 'postTaxProfit', isHeader: true },
    { key: 'Cổ đông thiểu số', label: 'Lợi ích của cổ đông thiểu số' },
    { key: 'Cổ đông của Công ty mẹ', label: 'Lợi nhuận của Cổ đông Công ty mẹ', chartKey: 'parentProfit' },
];

// Balance sheet fields - hierarchical structure (matching vnstock API)
const balanceFieldsHierarchy: FieldItem[] = [
    {
        key: 'TÀI SẢN NGẮN HẠN (đồng)', label: 'TÀI SẢN NGẮN HẠN', chartKey: 'shortAsset', isHeader: true, children: [
            {
                key: 'Tiền và tương đương tiền (đồng)', label: 'Tiền và tương đương tiền', children: [
                    { key: 'Tiền', label: 'Tiền' },
                    { key: 'Các khoản tương đương tiền', label: 'Các khoản tương đương tiền' },
                ]
            },
            {
                key: 'Giá trị thuần đầu tư ngắn hạn (đồng)', label: 'Đầu tư ngắn hạn', children: [
                    { key: 'Đầu tư ngắn hạn', label: 'Đầu tư ngắn hạn' },
                    { key: 'Dự phòng giảm giá', label: 'Dự phòng giảm giá' },
                ]
            },
            { key: 'Các khoản phải thu ngắn hạn (đồng)', label: 'Các khoản phải thu ngắn hạn' },
            { key: 'Hàng tồn kho, ròng (đồng)', label: 'Hàng tồn kho, ròng' },
            { key: 'Tài sản lưu động khác (đồng)', label: 'Tài sản lưu động khác' },
        ]
    },
    {
        key: 'TÀI SẢN DÀI HẠN (đồng)', label: 'TÀI SẢN DÀI HẠN', chartKey: 'longAsset', isHeader: true, children: [
            { key: 'Phải thu dài hạn (đồng)', label: 'Phải thu dài hạn' },
            { key: 'Tài sản cố định (đồng)', label: 'Tài sản cố định' },
            { key: 'Giá trị ròng tài sản đầu tư', label: 'Giá trị ròng TS đầu tư' },
            { key: 'Đầu tư dài hạn (đồng)', label: 'Đầu tư dài hạn' },
            { key: 'Lợi thế thương mại (đồng)', label: 'Lợi thế thương mại' },
            { key: 'Tài sản dài hạn khác (đồng)', label: 'Tài sản dài hạn khác' },
        ]
    },
    { key: 'TỔNG CỘNG TÀI SẢN (đồng)', label: 'TỔNG CỘNG TÀI SẢN', chartKey: 'asset', isHeader: true },
    {
        key: 'NỢ PHẢI TRẢ (đồng)', label: 'NỢ PHẢI TRẢ', chartKey: 'debt', isHeader: true, children: [
            {
                key: 'Nợ ngắn hạn (đồng)', label: 'Nợ ngắn hạn', chartKey: 'shortDebt', children: [
                    { key: 'Vay và nợ thuê tài chính ngắn hạn (đồng)', label: 'Vay ngắn hạn' },
                    { key: 'Người mua trả tiền trước ngắn hạn (đồng)', label: 'Người mua trả tiền trước' },
                ]
            },
            {
                key: 'Nợ dài hạn (đồng)', label: 'Nợ dài hạn', chartKey: 'longDebt', children: [
                    { key: 'Vay và nợ thuê tài chính dài hạn (đồng)', label: 'Vay dài hạn' },
                ]
            },
        ]
    },
    {
        key: 'VỐN CHỦ SỞ HỮU (đồng)', label: 'VỐN CHỦ SỞ HỮU', chartKey: 'equity', isHeader: true, children: [
            {
                key: 'Vốn và các quỹ (đồng)', label: 'Vốn và các quỹ', children: [
                    { key: 'Vốn góp của chủ sở hữu (đồng)', label: 'Vốn góp' },
                    { key: 'Cổ phiếu phổ thông (đồng)', label: 'Cổ phiếu phổ thông' },
                    { key: 'Quỹ đầu tư và phát triển (đồng)', label: 'Quỹ đầu tư và phát triển' },
                    { key: 'Lãi chưa phân phối (đồng)', label: 'Lãi chưa phân phối' },
                ]
            },
            { key: 'LỢI ÍCH CỦA CỔ ĐÔNG THIỂU SỐ', label: 'Lợi ích của cổ đông thiểu số' },
        ]
    },
    { key: 'TỔNG CỘNG NGUỒN VỐN (đồng)', label: 'TỔNG CỘNG NGUỒN VỐN', isHeader: true },
];

// Cash flow fields - hierarchical structure (matching vnstock API)
const cashflowFieldsHierarchy: FieldItem[] = [
    { key: 'Lưu chuyển tiền tệ ròng từ các hoạt động SXKD', label: 'LƯU CHUYỂN TIỀN TỪ HĐKD', chartKey: 'fromSale', isHeader: true },
    { key: 'Lãi/Lỗ ròng trước thuế', label: 'Lợi nhuận trước thuế' },
    { key: 'Khấu hao TSCĐ', label: 'Khấu hao TSCĐ' },
    { key: 'Lãi/Lỗ chênh lệch tỷ giá chưa thực hiện', label: 'Lãi/lỗ chênh lệch tỷ giá' },
    { key: 'Lãi/Lỗ từ thanh lý tài sản cố định', label: 'Lãi/(lỗ) từ thanh lý TSCĐ' },
    { key: 'Lãi/Lỗ từ hoạt động đầu tư', label: '(Lãi)/lỗ từ hoạt động đầu tư' },
    { key: 'Thu lãi và cổ tức', label: 'Thu lãi và cổ tức' },
    { key: 'Lưu chuyển tiền thuần từ HĐKD trước thay đổi VLĐ', label: 'LN từ HĐKD trước thay đổi VLĐ' },
    { key: 'Tăng/Giảm các khoản phải thu', label: '(Tăng)/giảm các khoản phải thu' },
    { key: 'Tăng/Giảm hàng tồn kho', label: '(Tăng)/giảm hàng tồn kho' },
    { key: 'Tăng/Giảm các khoản phải trả', label: 'Tăng/(giảm) các khoản phải trả' },
    { key: 'Tăng/Giảm chi phí trả trước', label: '(Tăng)/giảm chi phí trả trước' },
    { key: 'Chi phí lãi vay đã trả', label: 'Tiền lãi vay đã trả' },
    { key: 'Tiền thu nhập doanh nghiệp đã trả', label: 'Thuế TNDN đã nộp' },
    { key: 'Tiền chi khác từ các hoạt động kinh doanh', label: 'Tiền chi khác cho HĐKD' },
    { key: 'Lưu chuyển từ hoạt động đầu tư', label: 'LƯU CHUYỂN TIỀN TỪ HĐĐT', chartKey: 'fromInvest', isHeader: true },
    { key: 'Mua sắm TSCĐ', label: 'Tiền chi mua sắm TSCĐ' },
    { key: 'Tiền thu được từ thanh lý tài sản cố định', label: 'Tiền thu thanh lý TSCĐ' },
    { key: 'Tiền chi cho vay, mua công cụ nợ của đơn vị khác (đồng)', label: 'Tiền chi cho vay, mua công cụ nợ' },
    { key: 'Tiền thu hồi cho vay, bán lại các công cụ nợ của đơn vị khác (đồng)', label: 'Tiền thu hồi cho vay' },
    { key: 'Đầu tư vào các doanh nghiệp khác', label: 'Tiền chi đầu tư góp vốn' },
    { key: 'Tiền thu từ việc bán các khoản đầu tư vào doanh nghiệp khác', label: 'Tiền thu hồi đầu tư' },
    { key: 'Tiền thu cổ tức và lợi nhuận được chia', label: 'Tiền thu cổ tức, lợi nhuận' },
    { key: 'Lưu chuyển tiền từ hoạt động tài chính', label: 'LƯU CHUYỂN TIỀN TỪ HĐTC', chartKey: 'fromFinancial', isHeader: true },
    { key: 'Tăng vốn cổ phần từ góp vốn và/hoặc phát hành cổ phiếu', label: 'Tiền thu phát hành CP' },
    { key: 'Chi trả cho việc mua lại, trả cổ phiếu', label: 'Tiền chi mua lại CP' },
    { key: 'Tiền thu được các khoản đi vay', label: 'Tiền thu từ các khoản đi vay' },
    { key: 'Tiền trả các khoản đi vay', label: 'Tiền trả nợ gốc vay' },
    { key: 'Cổ tức đã trả', label: 'Cổ tức đã trả cho CSH' },
    { key: 'Lưu chuyển tiền thuần trong kỳ', label: 'LƯU CHUYỂN TIỀN THUẦN TRONG KỲ', isHeader: true },
    { key: 'Tiền và tương đương tiền', label: 'Tiền và tương đương tiền đầu kỳ', chartKey: 'beginCash' },
    { key: 'Ảnh hưởng của chênh lệch tỷ giá', label: 'Ảnh hưởng thay đổi tỷ giá' },
    { key: 'Tiền và tương đương tiền cuối kỳ', label: 'Tiền và tương đương tiền cuối kỳ', chartKey: 'endCash', isHeader: true },
];

// Ratio fields - grouped by category (matching vnstock API with flattened columns)
const ratioFieldsHierarchy: FieldItem[] = [
    {
        key: 'valuation_group', label: 'Định giá', isHeader: true, children: [
            { key: 'Chỉ tiêu định giá_P/E', label: 'P/E', chartKey: 'PE' },
            { key: 'Chỉ tiêu định giá_P/B', label: 'P/B', chartKey: 'PB' },
            { key: 'Chỉ tiêu định giá_P/S', label: 'P/S', chartKey: 'PS' },
            { key: 'Chỉ tiêu định giá_P/Cash Flow', label: 'P/CF', chartKey: 'PCF' },
            { key: 'Chỉ tiêu định giá_EV/EBITDA', label: 'EV/EBITDA', chartKey: 'EVEBITDA' },
            { key: 'Chỉ tiêu định giá_EPS (VND)', label: 'EPS (VND)', chartKey: 'EPS' },
            { key: 'Chỉ tiêu định giá_BVPS (VND)', label: 'BVPS (VND)', chartKey: 'BVPS' },
        ]
    },
    {
        key: 'profitability_group', label: 'Khả năng sinh lời', isHeader: true, children: [
            { key: 'Chỉ tiêu khả năng sinh lợi_ROE (%)', label: 'ROE (%)', isPercent: true, chartKey: 'ROE' },
            { key: 'Chỉ tiêu khả năng sinh lợi_ROA (%)', label: 'ROA (%)', isPercent: true, chartKey: 'ROA' },
            { key: 'Chỉ tiêu khả năng sinh lợi_ROIC (%)', label: 'ROIC (%)', isPercent: true, chartKey: 'ROIC' },
            { key: 'Chỉ tiêu khả năng sinh lợi_Gross Profit Margin (%)', label: 'Biên LN gộp (%)', isPercent: true, chartKey: 'GrossMargin' },
            { key: 'Chỉ tiêu khả năng sinh lợi_EBIT Margin (%)', label: 'Biên EBIT (%)', isPercent: true, chartKey: 'EBITMargin' },
            { key: 'Chỉ tiêu khả năng sinh lợi_Net Profit Margin (%)', label: 'Biên LN ròng (%)', isPercent: true, chartKey: 'NetMargin' },
        ]
    },
    {
        key: 'liquidity_group', label: 'Thanh khoản', isHeader: true, children: [
            { key: 'Chỉ tiêu thanh khoản_Current Ratio', label: 'Thanh toán hiện hành', chartKey: 'CurrentRatio' },
            { key: 'Chỉ tiêu thanh khoản_Quick Ratio', label: 'Thanh toán nhanh', chartKey: 'QuickRatio' },
            { key: 'Chỉ tiêu thanh khoản_Cash Ratio', label: 'Thanh toán tiền mặt', chartKey: 'CashRatio' },
            { key: 'Chỉ tiêu thanh khoản_Interest Coverage', label: 'Khả năng thanh toán lãi vay', chartKey: 'InterestCoverage' },
        ]
    },
    {
        key: 'leverage_group', label: 'Đòn bẩy', isHeader: true, children: [
            { key: 'Chỉ tiêu cơ cấu nguồn vốn_Debt/Equity', label: 'Nợ/Vốn CSH', chartKey: 'DebtEquity' },
            { key: 'Chỉ tiêu cơ cấu nguồn vốn_(ST+LT borrowings)/Equity', label: 'Vay/Vốn CSH', chartKey: 'BorrowingsEquity' },
            { key: 'Chỉ tiêu thanh khoản_Financial Leverage', label: 'Đòn bẩy tài chính', chartKey: 'FinLeverage' },
        ]
    },
    {
        key: 'efficiency_group', label: 'Hiệu quả hoạt động', isHeader: true, children: [
            { key: 'Chỉ tiêu hiệu quả hoạt động_Asset Turnover', label: 'Vòng quay tổng TS', chartKey: 'AssetTurnover' },
            { key: 'Chỉ tiêu hiệu quả hoạt động_Fixed Asset Turnover', label: 'Vòng quay TSCĐ', chartKey: 'FixedAssetTurnover' },
            { key: 'Chỉ tiêu hiệu quả hoạt động_Inventory Turnover', label: 'Vòng quay HTK', chartKey: 'InventoryTurnover' },
            { key: 'Chỉ tiêu hiệu quả hoạt động_Days Sales Outstanding', label: 'Số ngày thu tiền', chartKey: 'DSO' },
            { key: 'Chỉ tiêu hiệu quả hoạt động_Days Inventory Outstanding', label: 'Số ngày tồn kho', chartKey: 'DIO' },
            { key: 'Chỉ tiêu hiệu quả hoạt động_Days Payable Outstanding', label: 'Số ngày trả tiền', chartKey: 'DPO' },
            { key: 'Chỉ tiêu hiệu quả hoạt động_Cash Cycle', label: 'Chu kỳ tiền mặt', chartKey: 'CashCycle' },
        ]
    },
    {
        key: 'size_group', label: 'Quy mô', isHeader: true, children: [
            { key: 'Chỉ tiêu định giá_Market Capital (Bn. VND)', label: 'Vốn hóa (tỷ VND)', chartKey: 'MarketCap' },
            { key: 'Chỉ tiêu định giá_Outstanding Share (Mil. Shares)', label: 'CP lưu hành (triệu)', chartKey: 'Shares' },
            { key: 'Chỉ tiêu khả năng sinh lợi_EBIT (Bn. VND)', label: 'EBIT (tỷ VND)', chartKey: 'EBIT' },
            { key: 'Chỉ tiêu khả năng sinh lợi_EBITDA (Bn. VND)', label: 'EBITDA (tỷ VND)', chartKey: 'EBITDA' },
        ]
    },
];

// Helper: Flatten hierarchical fields for chart data extraction
const flattenFields = (fields: FieldItem[]): FieldItem[] => {
    const result: FieldItem[] = [];
    const traverse = (items: FieldItem[]) => {
        items.forEach(item => {
            result.push(item);
            if (item.children) traverse(item.children);
        });
    };
    traverse(fields);
    return result;
};

// Custom tooltip for charts - dark mode compatible
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-xl">
                <p className="text-[11px] text-foreground font-medium mb-1.5">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-[11px]">
                        <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                        <span className="text-muted-foreground">{entry.name}:</span>
                        <span className="font-mono font-semibold text-foreground">{formatNumber(entry.value)}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

// Custom legend that works with dark mode
const CustomLegend = ({ payload }: any) => {
    if (!payload || payload.length === 0) return null;
    return (
        <div className="flex flex-wrap justify-center gap-3 pt-2">
            {payload.map((entry: any, index: number) => (
                <div key={index} className="flex items-center gap-1.5 text-[10px]">
                    <div
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-muted-foreground">{entry.value}</span>
                </div>
            ))}
        </div>
    );
};

export function FinancialsTab({ symbol }: FinancialsTabProps) {
    const [incomeStatement, setIncomeStatement] = useState<FinancialReportResponse | null>(null);
    const [balanceSheet, setBalanceSheet] = useState<FinancialReportResponse | null>(null);
    const [cashFlow, setCashFlow] = useState<FinancialReportResponse | null>(null);
    const [ratios, setRatios] = useState<RatioResponse | null>(null);

    // Filters from API
    const [period, setPeriod] = useState<"quarter" | "year">("year");
    const [limit, setLimit] = useState<number>(8);
    const [activeView, setActiveView] = useState<FinancialViewType>('income');
    const [displayMode, setDisplayMode] = useState<DisplayMode>('table');

    // Expand/collapse state - track which parent keys are expanded
    const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

    const [isLoading, setIsLoading] = useState(true);

    // Toggle expand/collapse for a key
    const toggleExpand = useCallback((key: string) => {
        setExpandedKeys(prev => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    }, []);

    // Expand all items with children
    const expandAll = useCallback(() => {
        const allKeys = new Set<string>();
        const collectKeys = (fields: FieldItem[]) => {
            fields.forEach(f => {
                if (f.children && f.children.length > 0) {
                    allKeys.add(f.key);
                    collectKeys(f.children);
                }
            });
        };
        switch (activeView) {
            case 'income': collectKeys(incomeFieldsHierarchy); break;
            case 'balance': collectKeys(balanceFieldsHierarchy); break;
            case 'cashflow': collectKeys(cashflowFieldsHierarchy); break;
            case 'ratio': collectKeys(ratioFieldsHierarchy); break;
        }
        setExpandedKeys(allKeys);
    }, [activeView]);

    // Collapse all
    const collapseAll = useCallback(() => {
        setExpandedKeys(new Set());
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [incomeRes, balanceRes, cashFlowRes, ratioRes] = await Promise.allSettled([
                    FinancialsAPI.getIncomeStatement(symbol, period, "vi", limit),
                    FinancialsAPI.getBalanceSheet(symbol, period, "vi", limit),
                    FinancialsAPI.getCashFlow(symbol, period, "vi", limit),
                    FinancialsAPI.getRatio(symbol, period, limit),
                ]);

                if (incomeRes.status === "fulfilled") setIncomeStatement(incomeRes.value);
                if (balanceRes.status === "fulfilled") setBalanceSheet(balanceRes.value);
                if (cashFlowRes.status === "fulfilled") setCashFlow(cashFlowRes.value);
                if (ratioRes.status === "fulfilled") setRatios(ratioRes.value);
            } catch (err) {
                console.error("Failed to fetch financial data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [symbol, period, limit]);

    // Get current data and fields based on active view
    const currentData = useMemo(() => {
        switch (activeView) {
            case 'income': return incomeStatement?.data || [];
            case 'balance': return balanceSheet?.data || [];
            case 'cashflow': return cashFlow?.data || [];
            case 'ratio': return ratios?.data || [];
            default: return [];
        }
    }, [activeView, incomeStatement, balanceSheet, cashFlow, ratios]);

    const currentFieldsHierarchy = useMemo(() => {
        switch (activeView) {
            case 'income': return incomeFieldsHierarchy;
            case 'balance': return balanceFieldsHierarchy;
            case 'cashflow': return cashflowFieldsHierarchy;
            case 'ratio': return ratioFieldsHierarchy;
            default: return [];
        }
    }, [activeView]);

    // Flat fields for chart data
    const currentFieldsFlat = useMemo(() => {
        return flattenFields(currentFieldsHierarchy);
    }, [currentFieldsHierarchy]);

    // Get period labels for table columns - use actual year/quarter from API data
    const periodLabels = useMemo(() => {
        if (!currentData.length) return [];

        return currentData.map((item: Record<string, unknown>) => {
            // Financial reports use 'Năm' (year) and 'Kỳ' (quarter) fields
            // Ratio data uses 'Meta_yearReport' and 'Meta_lengthReport' fields
            const year = (item['Năm'] ?? item['Meta_yearReport']) as number | undefined;
            const quarter = (item['Kỳ'] ?? item['Meta_lengthReport']) as number | undefined;

            if (period === 'year') {
                // For yearly data, just show the year
                return year ? `${year}` : '—';
            } else {
                // For quarterly data, show Q{quarter}/{year}
                if (year && quarter) {
                    return `Q${quarter}/${year}`;
                }
                return '—';
            }
        });
    }, [currentData, period]);

    // Prepare chart data (reverse for chronological order)
    const chartData = useMemo(() => {
        if (!currentData.length) return [];

        return currentData
            .slice()
            .reverse()
            .map((item: Record<string, unknown>, idx: number) => {
                const result: Record<string, unknown> = {
                    period: periodLabels[currentData.length - 1 - idx] || `Kỳ ${idx + 1}`
                };

                // Map fields to chart keys
                currentFieldsFlat.forEach(field => {
                    const val = item[field.key];
                    if (val !== null && val !== undefined && typeof val === 'number') {
                        const chartKey = field.chartKey || field.key.replace(/[^a-zA-Z0-9]/g, '');
                        result[chartKey] = val;
                    }
                });

                return result;
            });
    }, [currentData, currentFieldsFlat, periodLabels]);

    // Get chart config based on view type
    const getChartConfig = () => {
        switch (activeView) {
            case 'income':
                return {
                    bars: [
                        { key: 'revenue', name: 'Doanh thu thuần', color: '#3b82f6' },
                    ],
                    lines: [
                        { key: 'grossProfit', name: 'LN gộp', color: '#f59e0b' },
                        { key: 'operatingProfit', name: 'LN từ HĐKD', color: '#8b5cf6' },
                        { key: 'postTaxProfit', name: 'LNST', color: '#00c076' },
                    ]
                };
            case 'balance':
                return {
                    bars: [
                        { key: 'asset', name: 'Tổng tài sản', color: '#3b82f6' },
                        { key: 'debt', name: 'Nợ phải trả', color: '#ef4444' },
                        { key: 'equity', name: 'Vốn CSH', color: '#00c076' },
                    ],
                    lines: []
                };
            case 'cashflow':
                return {
                    bars: [
                        { key: 'fromSale', name: 'Từ HĐKD', color: '#00c076' },
                        { key: 'fromInvest', name: 'Từ đầu tư', color: '#f59e0b' },
                        { key: 'fromFinancial', name: 'Từ tài chính', color: '#8b5cf6' },
                    ],
                    lines: []
                };
            case 'ratio':
                return {
                    bars: [],
                    lines: [
                        { key: 'ROE', name: 'ROE', color: '#8b5cf6', isPercent: true },
                        { key: 'ROA', name: 'ROA', color: '#06b6d4', isPercent: true },
                        { key: 'GrossMargin', name: 'Biên LN gộp', color: '#f59e0b', isPercent: true },
                        { key: 'NetMargin', name: 'Biên LN ròng', color: '#00c076', isPercent: true },
                    ]
                };
            default:
                return { bars: [], lines: [] };
        }
    };

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Đang tải báo cáo tài chính...</span>
                </div>
            </div>
        );
    }

    const chartConfig = getChartConfig();

    // Render hierarchical table rows with expand/collapse
    const renderHierarchicalRows = (
        fields: FieldItem[],
        data: Record<string, unknown>[],
        level: number
    ): React.ReactNode[] => {
        const rows: React.ReactNode[] = [];
        // Check if current view is ratio (don't format as billions)
        const isRatioView = activeView === 'ratio';

        fields.forEach(field => {
            // For ratio groups, the parent key doesn't exist in data - it's just a grouping header
            const isGroupHeader = field.key.endsWith('_group');
            const hasChildren = field.children && field.children.length > 0;
            const isExpanded = expandedKeys.has(field.key);

            // Get values for this field across all periods
            const values = data.map((item: Record<string, unknown>) => {
                if (isGroupHeader) return null; // Group headers don't have values
                const val = item[field.key];
                if (val === null || val === undefined) return null;
                return typeof val === 'number' ? val : null;
            });

            // Check if field has data (skip non-group fields with no data)
            const hasData = isGroupHeader || values.some(v => v !== null);
            if (!hasData) return;

            // Render the row
            rows.push(
                <tr
                    key={field.key}
                    className={cn(
                        "hover:bg-secondary/10 transition-colors border-b border-border/5",
                        field.isHeader && "bg-transparent"
                    )}
                >
                    <td
                        className={cn(
                            "py-2 whitespace-nowrap",
                            field.isHeader ? "text-foreground font-semibold" : "text-foreground/70"
                        )}
                        style={{ paddingLeft: `${16 + level * 20}px` }}
                    >
                        <div className="flex items-center gap-1.5">
                            {hasChildren ? (
                                <button
                                    onClick={() => toggleExpand(field.key)}
                                    className="w-4 h-4 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
                                >
                                    {isExpanded ? (
                                        <Minus className="h-3 w-3" />
                                    ) : (
                                        <Plus className="h-3 w-3" />
                                    )}
                                </button>
                            ) : (
                                <span className="w-4 shrink-0" />
                            )}
                            <span className={cn(
                                field.isHeader && level === 0 && "font-bold"
                            )}>
                                {field.label}
                            </span>
                        </div>
                    </td>
                    {values.map((val, idx) => {
                        if (isGroupHeader) {
                            return <td key={idx} className="text-right px-3 py-2"></td>;
                        }

                        // Format value based on view type
                        let displayValue: string;
                        if (val === null) {
                            displayValue = "0";
                        } else if (field.isPercent) {
                            displayValue = `${(val * 100).toFixed(2)}%`;
                        } else if (isRatioView) {
                            // Ratio values - show as-is with 2 decimals
                            displayValue = val.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            });
                        } else {
                            // Financial values - convert to billions
                            displayValue = formatBillion(val);
                        }

                        return (
                            <td
                                key={idx}
                                className="text-right px-3 py-2 font-mono text-foreground/80"
                            >
                                {displayValue}
                            </td>
                        );
                    })}
                </tr>
            );

            // Render children if expanded
            if (hasChildren && isExpanded) {
                rows.push(...renderHierarchicalRows(field.children!, data, level + 1));
            }
        });

        return rows;
    };

    return (
        <div className="h-full flex flex-col">
            {/* Toolbar with tabs and filters */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/30 bg-secondary/20">
                {/* View Tabs */}
                <div className="flex items-center gap-1">
                    {financialTabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveView(tab.id)}
                            className={cn(
                                "flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all",
                                activeView === tab.id
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                            )}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2">
                    {/* Expand/Collapse All */}
                    {displayMode === 'table' && (
                        <>
                            <div className="flex items-center gap-0.5 p-0.5 bg-secondary/50 rounded">
                                <button
                                    onClick={expandAll}
                                    className="p-1 rounded text-muted-foreground hover:text-foreground transition-all"
                                    title="Mở tất cả"
                                >
                                    <Plus className="h-3 w-3" />
                                </button>
                                <button
                                    onClick={collapseAll}
                                    className="p-1 rounded text-muted-foreground hover:text-foreground transition-all"
                                    title="Đóng tất cả"
                                >
                                    <Minus className="h-3 w-3" />
                                </button>
                            </div>
                            <div className="h-3 w-px bg-border/50" />
                        </>
                    )}

                    {/* Display Mode Toggle */}
                    <div className="flex items-center gap-0.5 p-0.5 bg-secondary/50 rounded">
                        <button
                            onClick={() => setDisplayMode("table")}
                            className={cn(
                                "p-1 rounded transition-all",
                                displayMode === "table"
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                            title="Dạng bảng"
                        >
                            <Table className="h-3 w-3" />
                        </button>
                        <button
                            onClick={() => setDisplayMode("chart")}
                            className={cn(
                                "p-1 rounded transition-all",
                                displayMode === "chart"
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                            title="Dạng biểu đồ"
                        >
                            <LineChartIcon className="h-3 w-3" />
                        </button>
                    </div>

                    <div className="h-3 w-px bg-border/50" />

                    {/* Period Filter */}
                    <div className="flex items-center gap-0.5 p-0.5 bg-secondary/50 rounded">
                        <button
                            onClick={() => setPeriod("quarter")}
                            className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-medium transition-all",
                                period === "quarter"
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Quý
                        </button>
                        <button
                            onClick={() => setPeriod("year")}
                            className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-medium transition-all",
                                period === "year"
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Năm
                        </button>
                    </div>

                    {/* Limit Filter */}
                    <div className="flex items-center gap-0.5 p-0.5 bg-secondary/50 rounded">
                        {[4, 8, 12].map((l) => (
                            <button
                                key={l}
                                onClick={() => setLimit(l)}
                                className={cn(
                                    "px-1.5 py-0.5 rounded text-[10px] font-mono font-medium transition-all min-w-[20px]",
                                    limit === l
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {l}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 overflow-hidden">
                {activeView === 'toolkit' ? (
                    <ToolkitTab symbol={symbol} />
                ) : currentData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                            <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">Không có dữ liệu</p>
                        </div>
                    </div>
                ) : displayMode === 'table' ? (
                    /* TABLE VIEW */
                    <ScrollArea className="h-full">
                        <div className="overflow-x-auto">
                            <table className="w-full text-[11px]">
                                <thead className="sticky top-0 bg-secondary/80 backdrop-blur-sm z-10">
                                    <tr>
                                        <th className="text-left px-3 py-2 font-normal text-muted-foreground border-b border-border/30 min-w-[240px]">
                                            {activeView === 'ratio' ? 'Chỉ tiêu' : 'Đơn vị: tỷ VNĐ'}
                                        </th>
                                        {periodLabels.map((label, idx) => (
                                            <th
                                                key={idx}
                                                className="text-right px-3 py-2 font-semibold text-foreground border-b border-border/30 min-w-[100px]"
                                            >
                                                {label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/10">
                                    {renderHierarchicalRows(currentFieldsHierarchy, currentData, 0)}
                                </tbody>
                            </table>
                        </div>
                    </ScrollArea>
                ) : (
                    /* CHART VIEW */
                    <div className="h-full p-3">
                        <div className="text-[10px] font-medium text-muted-foreground mb-2">
                            {activeView === 'income' && 'Doanh thu & Lợi nhuận'}
                            {activeView === 'balance' && 'Cơ cấu Tài sản & Nguồn vốn'}
                            {activeView === 'cashflow' && 'Lưu chuyển tiền tệ'}
                            {activeView === 'ratio' && 'Chỉ số sinh lời'}
                            {` (${period === 'quarter' ? 'theo quý' : 'theo năm'})`}
                        </div>
                        <div className="h-[calc(100%-24px)]">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    {chartConfig.bars.length > 0 && chartConfig.lines.length > 0 ? (
                                        /* ComposedChart for Income (bars + lines) */
                                        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" opacity={0.3} vertical={false} />
                                            <XAxis
                                                dataKey="period"
                                                tick={<CustomAxisTick />}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                tick={<CustomYAxisTick formatter={formatAxisValue} />}
                                                axisLine={false}
                                                tickLine={false}
                                                width={55}
                                            />
                                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }} />
                                            <Legend content={<CustomLegend />} />
                                            {chartConfig.bars.map((bar) => (
                                                <Bar
                                                    key={bar.key}
                                                    dataKey={bar.key}
                                                    name={bar.name}
                                                    fill={bar.color}
                                                    radius={[4, 4, 0, 0]}
                                                    maxBarSize={40}
                                                />
                                            ))}
                                            {chartConfig.lines.map((line) => (
                                                <Line
                                                    key={line.key}
                                                    type="monotone"
                                                    dataKey={line.key}
                                                    name={line.name}
                                                    stroke={line.color}
                                                    strokeWidth={2}
                                                    dot={{ fill: line.color, strokeWidth: 0, r: 3 }}
                                                    activeDot={{ r: 5, strokeWidth: 0 }}
                                                />
                                            ))}
                                        </ComposedChart>
                                    ) : chartConfig.bars.length > 0 ? (
                                        /* BarChart for Balance Sheet & Cash Flow */
                                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" opacity={0.3} vertical={false} />
                                            <XAxis
                                                dataKey="period"
                                                tick={<CustomAxisTick />}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                tick={<CustomYAxisTick formatter={formatAxisValue} />}
                                                axisLine={false}
                                                tickLine={false}
                                                width={55}
                                            />
                                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }} />
                                            <Legend content={<CustomLegend />} />
                                            {chartConfig.bars.map((bar) => (
                                                <Bar
                                                    key={bar.key}
                                                    dataKey={bar.key}
                                                    name={bar.name}
                                                    fill={bar.color}
                                                    radius={[4, 4, 0, 0]}
                                                    maxBarSize={35}
                                                />
                                            ))}
                                        </BarChart>
                                    ) : (
                                        /* LineChart for Ratios */
                                        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" opacity={0.3} vertical={false} />
                                            <XAxis
                                                dataKey="period"
                                                tick={<CustomAxisTick />}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                tick={<CustomYAxisTick formatter={(v: number) => `${(v * 100).toFixed(0)}%`} />}
                                                axisLine={false}
                                                tickLine={false}
                                                width={45}
                                                domain={[0, 'auto']}
                                            />
                                            <Tooltip
                                                content={({ active, payload, label }) => {
                                                    if (active && payload && payload.length) {
                                                        return (
                                                            <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-xl">
                                                                <p className="text-[11px] text-foreground font-medium mb-1.5">{label}</p>
                                                                {payload.map((entry: any, index: number) => (
                                                                    <div key={index} className="flex items-center gap-2 text-[11px]">
                                                                        <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                                                                        <span className="text-muted-foreground">{entry.name}:</span>
                                                                        <span className="font-mono font-semibold text-foreground">{(entry.value * 100)?.toFixed(2)}%</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Legend content={<CustomLegend />} />
                                            {chartConfig.lines.map((line) => (
                                                <Line
                                                    key={line.key}
                                                    type="monotone"
                                                    dataKey={line.key}
                                                    name={line.name}
                                                    stroke={line.color}
                                                    strokeWidth={2.5}
                                                    dot={{ fill: line.color, strokeWidth: 0, r: 4 }}
                                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                                />
                                            ))}
                                        </LineChart>
                                    )}
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground">
                                    <p className="text-sm">Không có dữ liệu để hiển thị biểu đồ</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
