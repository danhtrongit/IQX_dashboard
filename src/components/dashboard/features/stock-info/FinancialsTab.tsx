"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { BarChart3, DollarSign, Wallet, ArrowUpDown, Loader2, Table, LineChart as LineChartIcon, ChevronUp, ChevronDown, Plus, Minus } from "lucide-react";
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

interface FinancialsTabProps {
    symbol: string;
}

// Format number for display
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
type FinancialViewType = 'income' | 'ratio' | 'balance' | 'cashflow';
type DisplayMode = 'table' | 'chart';

const financialTabs: { id: FinancialViewType; label: string; icon: React.ReactNode }[] = [
    { id: 'income', label: 'KQKD', icon: <DollarSign className="h-3 w-3" /> },
    { id: 'balance', label: 'CĐKT', icon: <Wallet className="h-3 w-3" /> },
    { id: 'cashflow', label: 'LCTT', icon: <ArrowUpDown className="h-3 w-3" /> },
    { id: 'ratio', label: 'Chỉ số', icon: <BarChart3 className="h-3 w-3" /> },
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

// Income statement fields - hierarchical structure
const incomeFieldsHierarchy: FieldItem[] = [
    { key: 'Doanh thu bán hàng và cung cấp dịch vụ', label: 'Doanh thu bán hàng và CCDV', chartKey: 'grossRevenue' },
    { key: 'Các khoản giảm trừ doanh thu', label: 'Các khoản giảm trừ doanh thu' },
    { key: 'Doanh thu thuần', label: 'Doanh thu thuần', chartKey: 'revenue', isHeader: true },
    { key: 'Giá vốn hàng bán', label: 'Giá vốn hàng bán', chartKey: 'cogs' },
    { key: 'Lợi nhuận gộp', label: 'Lợi nhuận gộp', chartKey: 'grossProfit', isHeader: true },
    { key: 'Doanh thu hoạt động tài chính', label: 'Doanh thu hoạt động tài chính' },
    {
        key: 'Chi phí tài chính', label: 'Chi phí tài chính', isHeader: true, children: [
            { key: 'Chi phí lãi vay', label: 'Chi phí lãi vay' },
        ]
    },
    { key: 'Chi phí bán hàng', label: 'Chi phí bán hàng', chartKey: 'sellingExp' },
    { key: 'Chi phí quản lý doanh nghiệp', label: 'Chi phí quản lý doanh nghiệp', chartKey: 'adminExp' },
    { key: 'Lãi/(lỗ) từ hoạt động kinh doanh', label: 'Lãi/(lỗ) từ hoạt động kinh doanh', chartKey: 'operatingProfit', isHeader: true },
    {
        key: 'Thu nhập khác, ròng', label: 'Thu nhập khác, ròng', isHeader: true, children: [
            { key: 'Thu nhập khác', label: 'Thu nhập khác' },
            { key: 'Chi phí khác', label: 'Chi phí khác' },
        ]
    },
    { key: 'Lãi/(lỗ) từ công ty liên doanh', label: 'Lãi/(lỗ) từ công ty liên doanh' },
    { key: 'Lãi/(lỗ) trước thuế', label: 'Lãi/(lỗ) trước thuế', chartKey: 'preTaxProfit', isHeader: true },
    {
        key: 'Chi phí thuế thu nhập doanh nghiệp', label: 'Chi phí thuế TNDN', isHeader: true, children: [
            { key: 'Thuế thu nhập doanh nghiệp - hiện thời', label: 'Thuế TNDN - hiện thời' },
            { key: 'Thuế thu nhập doanh nghiệp - hoãn lại', label: 'Thuế TNDN - hoãn lại' },
        ]
    },
    { key: 'Lãi/(lỗ) thuần sau thuế', label: 'Lãi/(lỗ) thuần sau thuế', chartKey: 'postTaxProfit', isHeader: true },
    { key: 'Lợi ích của cổ đông thiểu số', label: 'Lợi ích của cổ đông thiểu số' },
    { key: 'Lợi nhuận của Cổ đông của Công ty mẹ', label: 'Lợi nhuận của Cổ đông Công ty mẹ', chartKey: 'parentProfit' },
    { key: 'Lãi cơ bản trên cổ phiếu (VND)', label: 'EPS cơ bản (VND)', chartKey: 'eps' },
    { key: 'Lãi trên cổ phiếu pha loãng (VND)', label: 'EPS pha loãng (VND)' },
];

// Balance sheet fields - hierarchical structure matching API
const balanceFieldsHierarchy: FieldItem[] = [
    {
        key: 'TÀI SẢN NGẮN HẠN', label: 'TÀI SẢN NGẮN HẠN', chartKey: 'shortAsset', isHeader: true, children: [
            {
                key: 'Tiền và tương đương tiền', label: 'Tiền và tương đương tiền', children: [
                    { key: 'Tiền', label: 'Tiền' },
                    { key: 'Các khoản tương đương tiền', label: 'Các khoản tương đương tiền' },
                ]
            },
            {
                key: 'Đầu tư ngắn hạn', label: 'Đầu tư ngắn hạn', children: [
                    { key: 'Dự phòng giảm giá', label: 'Dự phòng giảm giá' },
                ]
            },
            {
                key: 'Các khoản phải thu', label: 'Các khoản phải thu', children: [
                    { key: 'Phải thu khách hàng', label: 'Phải thu khách hàng' },
                    { key: 'Trả trước người bán', label: 'Trả trước người bán' },
                    { key: 'Phải thu nội bộ', label: 'Phải thu nội bộ' },
                    { key: 'Phải thu khác', label: 'Phải thu khác' },
                    { key: 'Dự phòng nợ khó đòi', label: 'Dự phòng nợ khó đòi' },
                ]
            },
            {
                key: 'Hàng tồn kho, ròng', label: 'Hàng tồn kho, ròng', children: [
                    { key: 'Hàng tồn kho', label: 'Hàng tồn kho' },
                    { key: 'Dự phòng giảm giá hàng tồn kho', label: 'Dự phòng giảm giá HTK' },
                ]
            },
            {
                key: 'Tài sản lưu động khác', label: 'Tài sản lưu động khác', children: [
                    { key: 'Chi phí trả trước ngắn hạn', label: 'Chi phí trả trước ngắn hạn' },
                    { key: 'Thuế GTGT được khấu trừ', label: 'Thuế GTGT được khấu trừ' },
                ]
            },
        ]
    },
    {
        key: 'TÀI SẢN DÀI HẠN', label: 'TÀI SẢN DÀI HẠN', chartKey: 'longAsset', isHeader: true, children: [
            { key: 'Phải thu dài hạn', label: 'Phải thu dài hạn' },
            {
                key: 'Tài sản cố định', label: 'Tài sản cố định', children: [
                    { key: 'GTCL TSCĐ hữu hình', label: 'GTCL TSCĐ hữu hình' },
                    { key: 'Nguyên giá TSCĐ hữu hình', label: 'Nguyên giá TSCĐ hữu hình' },
                    { key: 'Khấu hao lũy kế TSCĐ hữu hình', label: 'Khấu hao lũy kế TSCĐ hữu hình' },
                    { key: 'GTCL tài sản cố định vô hình', label: 'GTCL TSCĐ vô hình' },
                ]
            },
            { key: 'Giá trị ròng tài sản đầu tư', label: 'Giá trị ròng TS đầu tư' },
            {
                key: 'Đầu tư dài hạn', label: 'Đầu tư dài hạn', children: [
                    { key: 'Đầu tư vào các công ty liên kết', label: 'Đầu tư công ty liên kết' },
                    { key: 'Đầu tư dài hạn khác', label: 'Đầu tư dài hạn khác' },
                    { key: 'Dự phòng giảm giá đầu tư dài hạn', label: 'Dự phòng giảm giá ĐT dài hạn' },
                ]
            },
            { key: 'Tài sản dài hạn khác', label: 'Tài sản dài hạn khác' },
        ]
    },
    { key: 'TỔNG CỘNG TÀI SẢN', label: 'TỔNG CỘNG TÀI SẢN', chartKey: 'asset', isHeader: true },
    {
        key: 'NỢ PHẢI TRẢ', label: 'NỢ PHẢI TRẢ', chartKey: 'debt', isHeader: true, children: [
            {
                key: 'Nợ ngắn hạn', label: 'Nợ ngắn hạn', chartKey: 'shortDebt', children: [
                    { key: 'Vay ngắn hạn', label: 'Vay ngắn hạn' },
                    { key: 'Phải trả người bán', label: 'Phải trả người bán' },
                    { key: 'Người mua trả tiền trước', label: 'Người mua trả tiền trước' },
                    { key: 'Thuế và các khoản phải trả Nhà nước', label: 'Thuế và các khoản phải trả NN' },
                    { key: 'Phải trả người lao động', label: 'Phải trả người lao động' },
                    { key: 'Chi phí phải trả', label: 'Chi phí phải trả' },
                    { key: 'Phải trả khác', label: 'Phải trả khác' },
                    { key: 'Quỹ khen thưởng, phúc lợi', label: 'Quỹ khen thưởng, phúc lợi' },
                ]
            },
            {
                key: 'Nợ dài hạn', label: 'Nợ dài hạn', chartKey: 'longDebt', children: [
                    { key: 'Vay dài hạn', label: 'Vay dài hạn' },
                    { key: 'Dự phòng các khoản nợ dài hạn', label: 'Dự phòng các khoản nợ dài hạn' },
                ]
            },
        ]
    },
    {
        key: 'Vốn chủ sở hữu', label: 'VỐN CHỦ SỞ HỮU', chartKey: 'equity', isHeader: true, children: [
            {
                key: 'Vốn và các quỹ', label: 'Vốn và các quỹ', children: [
                    { key: 'Vốn góp', label: 'Vốn góp' },
                    { key: 'Thặng dư vốn cổ phần', label: 'Thặng dư vốn cổ phần' },
                    { key: 'Cổ phiếu quỹ', label: 'Cổ phiếu quỹ' },
                    { key: 'Chênh lệch tỷ giá', label: 'Chênh lệch tỷ giá' },
                    { key: 'Quỹ đầu tư và phát triển', label: 'Quỹ đầu tư và phát triển' },
                    { key: 'Lãi chưa phân phối', label: 'Lãi chưa phân phối' },
                ]
            },
            { key: 'Lợi ích của cổ đông thiểu số', label: 'Lợi ích của cổ đông thiểu số' },
        ]
    },
    { key: 'Tổng cộng nguồn vốn', label: 'TỔNG CỘNG NGUỒN VỐN', isHeader: true },
];

// Cash flow fields - hierarchical structure matching API
const cashflowFieldsHierarchy: FieldItem[] = [
    {
        key: 'Lưu chuyển tiền tệ ròng từ các hoạt động sản xuất kinh doanh', label: 'LƯU CHUYỂN TIỀN TỪ HĐKD', chartKey: 'fromSale', isHeader: true, children: [
            { key: 'Lợi nhuận/(lỗ) trước thuế', label: 'Lợi nhuận/(lỗ) trước thuế' },
            { key: 'Khấu hao TSCĐ và BĐSĐT', label: 'Khấu hao TSCĐ và BĐSĐT' },
            { key: 'Chi phí dự phòng', label: 'Chi phí dự phòng' },
            { key: 'Lãi/lỗ chênh lệch tỷ giá hối đoái do đánh giá lại các khoản mục tiền tệ có gốc ngoại tệ', label: 'Lãi/lỗ chênh lệch tỷ giá' },
            { key: 'Lãi/(lỗ) từ thanh lý tài sản cố định', label: 'Lãi/(lỗ) từ thanh lý TSCĐ' },
            { key: '(Lãi)/lỗ từ hoạt động đầu tư', label: '(Lãi)/lỗ từ hoạt động đầu tư' },
            { key: 'Chi phí lãi vay', label: 'Chi phí lãi vay' },
            { key: 'Thu lãi và cổ tức', label: 'Thu lãi và cổ tức' },
            { key: 'Lợi nhuận/(lỗ) từ hoạt động kinh doanh trước những thay đổi vốn lưu động', label: 'LN từ HĐKD trước thay đổi VLĐ' },
            { key: '(Tăng)/giảm các khoản phải thu', label: '(Tăng)/giảm các khoản phải thu' },
            { key: '(Tăng)/giảm hàng tồn kho', label: '(Tăng)/giảm hàng tồn kho' },
            { key: 'Tăng/(giảm) các khoản phải trả', label: 'Tăng/(giảm) các khoản phải trả' },
            { key: '(Tăng)/giảm chi phí trả trước', label: '(Tăng)/giảm chi phí trả trước' },
            { key: 'Tiền lãi vay đã trả', label: 'Tiền lãi vay đã trả' },
            { key: 'Thuế thu nhập doanh nghiệp đã nộp', label: 'Thuế TNDN đã nộp' },
            { key: 'Tiền chi khác cho hoạt động kinh doanh', label: 'Tiền chi khác cho HĐKD' },
        ]
    },
    {
        key: 'Lưu chuyển tiền thuần từ hoạt động đầu tư', label: 'LƯU CHUYỂN TIỀN TỪ HĐĐT', chartKey: 'fromInvest', isHeader: true, children: [
            { key: 'Tiền chi để mua sắm, xây dựng TSCĐ và các tài sản dài hạn khác', label: 'Tiền chi mua sắm, xây dựng TSCĐ' },
            { key: 'Tiền thu từ thanh lý, nhượng bán TSCĐ và các tài sản dài hạn khác', label: 'Tiền thu thanh lý, nhượng bán TSCĐ' },
            { key: 'Tiền chi cho vay, mua các công cụ nợ của đơn vị khác', label: 'Tiền chi cho vay, mua công cụ nợ' },
            { key: 'Tiền thu hồi cho vay, bán lại các công cụ nợ của đơn vị khác', label: 'Tiền thu hồi cho vay, bán công cụ nợ' },
            { key: 'Tiền chi đầu tư góp vốn vào đơn vị khác', label: 'Tiền chi đầu tư góp vốn' },
            { key: 'Tiền thu hồi đầu tư góp vốn vào đơn vị khác', label: 'Tiền thu hồi đầu tư góp vốn' },
            { key: 'Tiền thu lãi cho vay, cổ tức và lợi nhuận được chia', label: 'Tiền thu lãi, cổ tức, lợi nhuận' },
        ]
    },
    {
        key: 'Lưu chuyển tiền thuần từ hoạt động tài chính', label: 'LƯU CHUYỂN TIỀN TỪ HĐTC', chartKey: 'fromFinancial', isHeader: true, children: [
            { key: 'Tiền thu từ phát hành cổ phiếu, nhận vốn góp của chủ sở hữu', label: 'Tiền thu phát hành CP, nhận vốn góp' },
            { key: 'Tiền chi trả vốn góp cho các chủ sở hữu, mua lại cổ phiếu của doanh nghiệp đã phát hành', label: 'Tiền chi trả vốn góp, mua lại CP' },
            { key: 'Tiền thu được các khoản đi vay', label: 'Tiền thu từ các khoản đi vay' },
            { key: 'Tiền trả nợ gốc vay', label: 'Tiền trả nợ gốc vay' },
            { key: 'Cổ tức, lợi nhuận đã trả cho chủ sở hữu', label: 'Cổ tức, lợi nhuận đã trả cho CSH' },
        ]
    },
    { key: 'Lưu chuyển tiền thuần trong kỳ', label: 'LƯU CHUYỂN TIỀN THUẦN TRONG KỲ', isHeader: true },
    { key: 'Tiền và tương đương tiền đầu kỳ', label: 'Tiền và tương đương tiền đầu kỳ', chartKey: 'beginCash' },
    { key: 'Ảnh hưởng của thay đổi tỷ giá hối đoái quy đổi ngoại tệ', label: 'Ảnh hưởng thay đổi tỷ giá' },
    { key: 'Tiền và tương đương tiền cuối kỳ', label: 'Tiền và tương đương tiền cuối kỳ', chartKey: 'endCash', isHeader: true },
];

// Ratio fields - grouped by category
const ratioFieldsHierarchy: FieldItem[] = [
    {
        key: 'valuation_group', label: 'Định giá', isHeader: true, children: [
            { key: 'P/E', label: 'P/E', chartKey: 'PE' },
            { key: 'P/B', label: 'P/B', chartKey: 'PB' },
            { key: 'P/S', label: 'P/S', chartKey: 'PS' },
            { key: 'Price/Cash Flow', label: 'P/CF', chartKey: 'PCF' },
            { key: 'EV/EBITDA', label: 'EV/EBITDA', chartKey: 'EVEBITDA' },
        ]
    },
    {
        key: 'profitability_group', label: 'Khả năng sinh lời', isHeader: true, children: [
            { key: 'ROE (%)', label: 'ROE (%)', isPercent: true, chartKey: 'ROE' },
            { key: 'ROA (%)', label: 'ROA (%)', isPercent: true, chartKey: 'ROA' },
            { key: 'ROIC', label: 'ROIC', isPercent: true, chartKey: 'ROIC' },
            { key: 'Gross Margin (%)', label: 'Biên LN gộp (%)', isPercent: true, chartKey: 'GrossMargin' },
            { key: 'EBIT Margin (%)', label: 'Biên EBIT (%)', isPercent: true, chartKey: 'EBITMargin' },
            { key: 'Pre-tax Profit Margin (%)', label: 'Biên LN trước thuế (%)', isPercent: true, chartKey: 'PreTaxMargin' },
            { key: 'After-tax Profit Margin (%)', label: 'Biên LN ròng (%)', isPercent: true, chartKey: 'NetMargin' },
        ]
    },
    {
        key: 'liquidity_group', label: 'Thanh khoản', isHeader: true, children: [
            { key: 'Current Ratio', label: 'Thanh toán hiện hành', chartKey: 'CurrentRatio' },
            { key: 'Quick Ratio', label: 'Thanh toán nhanh', chartKey: 'QuickRatio' },
            { key: 'Cash Ratio', label: 'Thanh toán tiền mặt', chartKey: 'CashRatio' },
        ]
    },
    {
        key: 'leverage_group', label: 'Đòn bẩy', isHeader: true, children: [
            { key: 'Debt/Equity', label: 'Nợ/Vốn CSH (ngắn hạn)', chartKey: 'DebtEquity' },
            { key: 'Debt to Equity', label: 'Tổng nợ/Vốn CSH', chartKey: 'TotalDebtEquity' },
            { key: 'Financial Leverage', label: 'Đòn bẩy tài chính', chartKey: 'FinLeverage' },
        ]
    },
    {
        key: 'efficiency_group', label: 'Hiệu quả hoạt động', isHeader: true, children: [
            { key: 'Asset Turnover', label: 'Vòng quay tổng TS', chartKey: 'AssetTurnover' },
            { key: 'Fixed Asset Turnover', label: 'Vòng quay TSCĐ', chartKey: 'FixedAssetTurnover' },
            { key: 'Days Sales Outstanding', label: 'Số ngày thu tiền', chartKey: 'DSO' },
            { key: 'Days Inventory Outstanding', label: 'Số ngày tồn kho', chartKey: 'DIO' },
            { key: 'Days Payable Outstanding', label: 'Số ngày trả tiền', chartKey: 'DPO' },
            { key: 'Cash Cycle', label: 'Chu kỳ tiền mặt', chartKey: 'CashCycle' },
        ]
    },
    {
        key: 'size_group', label: 'Quy mô', isHeader: true, children: [
            { key: 'Market Cap', label: 'Vốn hóa', chartKey: 'MarketCap' },
            { key: 'Outstanding Shares (mil)', label: 'CP lưu hành', chartKey: 'Shares' },
            { key: 'EBIT', label: 'EBIT', chartKey: 'EBIT' },
            { key: 'EBITDA', label: 'EBITDA', chartKey: 'EBITDA' },
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

    // Get period labels for table columns - calculate actual years/quarters
    const periodLabels = useMemo(() => {
        if (!currentData.length) return [];

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);

        return currentData.map((_item: Record<string, unknown>, idx: number) => {
            if (period === 'year') {
                // For yearly data: most recent is current year or last year, go backwards
                // API returns data in descending order (newest first)
                const yearOffset = idx;
                const year = currentYear - yearOffset;
                return `${year}`;
            } else {
                // For quarterly data: calculate quarter going backwards
                // API returns data in descending order (newest first)
                let adjustedQuarter = currentQuarter - idx;
                let yearOffset = 0;

                while (adjustedQuarter <= 0) {
                    adjustedQuarter += 4;
                    yearOffset++;
                }

                const year = currentYear - yearOffset;
                return `Q${adjustedQuarter}/${year}`;
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
                        "hover:bg-secondary/20 transition-colors",
                        field.isHeader && "bg-secondary/30"
                    )}
                >
                    <td
                        className={cn(
                            "py-1.5 font-medium whitespace-nowrap",
                            field.isHeader ? "text-foreground font-semibold" : "text-foreground/80"
                        )}
                        style={{ paddingLeft: `${12 + level * 16}px` }}
                    >
                        <div className="flex items-center gap-1">
                            {hasChildren ? (
                                <button
                                    onClick={() => toggleExpand(field.key)}
                                    className="w-4 h-4 flex items-center justify-center rounded hover:bg-secondary/50 transition-colors shrink-0"
                                >
                                    {isExpanded ? (
                                        <Minus className="h-3 w-3 text-muted-foreground" />
                                    ) : (
                                        <Plus className="h-3 w-3 text-muted-foreground" />
                                    )}
                                </button>
                            ) : (
                                <span className="w-4 shrink-0" />
                            )}
                            <span className={cn(
                                field.isHeader && "uppercase"
                            )}>
                                {field.label}
                            </span>
                        </div>
                    </td>
                    {values.map((val, idx) => {
                        if (isGroupHeader) {
                            return <td key={idx} className="text-right px-2 py-1.5 font-mono text-muted-foreground">—</td>;
                        }
                        // Get previous value for comparison
                        const prevVal = idx < values.length - 1 ? values[idx + 1] : null;
                        const isIncreasing = val !== null && prevVal !== null && val > prevVal;
                        const isDecreasing = val !== null && prevVal !== null && val < prevVal;

                        return (
                            <td
                                key={idx}
                                className={cn(
                                    "text-right px-2 py-1.5 font-mono",
                                    val === null ? "text-muted-foreground" : "text-foreground"
                                )}
                            >
                                <div className="flex items-center justify-end gap-1">
                                    <span className={cn(
                                        val !== null && val < 0 && "text-[#ff3a3a]"
                                    )}>
                                        {field.isPercent && val !== null
                                            ? `${(val * 100).toFixed(2)}%`
                                            : formatNumber(val)
                                        }
                                    </span>
                                    {isIncreasing && (
                                        <ChevronUp className="h-2.5 w-2.5 text-[#00c076] shrink-0" />
                                    )}
                                    {isDecreasing && (
                                        <ChevronDown className="h-2.5 w-2.5 text-[#ff3a3a] shrink-0" />
                                    )}
                                </div>
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
                {currentData.length === 0 ? (
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
                            <table className="w-full text-[10px]">
                                <thead className="sticky top-0 bg-secondary/80 backdrop-blur-sm z-10">
                                    <tr>
                                        <th className="text-left px-3 py-2 font-semibold text-muted-foreground border-b border-border/30 min-w-[200px]">
                                            Chỉ tiêu
                                        </th>
                                        {periodLabels.map((label, idx) => (
                                            <th
                                                key={idx}
                                                className="text-right px-2 py-2 font-mono font-semibold text-muted-foreground border-b border-border/30 min-w-[90px]"
                                            >
                                                {label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/20">
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
