import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  formatNumber,
  formatCompact,
  formatPercent as formatPercentUtil,
  formatRatio as formatRatioUtil,
} from '@/lib/format';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  canonical?: string;
  noIndex?: boolean;
  jsonLd?: object;
}

const DEFAULT_TITLE = 'IQX — Hệ thống phân tích chứng khoán Việt Nam';
const DEFAULT_DESCRIPTION = 'IQX cung cấp công cụ phân tích chứng khoán chuyên sâu, biểu đồ kỹ thuật, dữ liệu tài chính và tin tức thị trường chứng khoán Việt Nam theo thời gian thực.';
const DEFAULT_KEYWORDS = 'chứng khoán việt nam, phân tích chứng khoán, biểu đồ kỹ thuật, cổ phiếu việt nam, vnindex, hose, hnx, upcom, đầu tư chứng khoán, phân tích kỹ thuật, báo cáo tài chính';
const SITE_NAME = 'IQX';
const DEFAULT_OG_IMAGE = '/og-image.png';

// Hook to update document title
function useDocumentTitle(title: string) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}

export function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  canonical,
  noIndex = false,
  jsonLd,
}: SEOProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;

  // Use native document.title for immediate update
  useDocumentTitle(fullTitle);

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Robots */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content="vi_VN" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
}

// Stock-specific SEO component with detailed info
export interface StockSEOProps {
  symbol: string;
  companyName?: string;
  fullName?: string;
  exchange?: string;
  industry?: string;
  // Price data
  price?: number | null;
  percentChange?: number | null;
  // Financial data
  marketCap?: number | null;
  pe?: number | null;
  pb?: number | null;
  eps?: number | null;
  // Company profile
  companyProfile?: string | null;
}

export function StockSEO({
  symbol,
  companyName,
  fullName,
  exchange,
  industry,
  price,
  percentChange,
  marketCap,
  pe,
  pb,
  eps,
  companyProfile,
}: StockSEOProps) {
  const upperSymbol = symbol.toUpperCase();

  // Build title with price info
  // Format: "VNM 74.500 (+1.25%) - Sữa Việt Nam | IQX"
  // Note: price from QuotesAPI is already in VND
  let title: string;
  if (price != null) {
    const priceDisplay = formatNumber(price);
    const changeDisplay = percentChange != null ? ` (${formatPercentUtil(percentChange)})` : '';
    const companyPart = companyName ? ` - ${companyName}` : '';
    title = `${upperSymbol} ${priceDisplay}${changeDisplay}${companyPart}`;
  } else {
    title = companyName
      ? `${upperSymbol} - ${companyName}`
      : `Cổ phiếu ${upperSymbol}`;
  }

  const fullTitle = `${title} | ${SITE_NAME}`;

  // Use native document.title for immediate update
  useDocumentTitle(fullTitle);

  // Build description with price and financial info
  const parts: string[] = [];

  // Price info (price from QuotesAPI is already in VND)
  if (price != null) {
    const priceStr = `${formatNumber(price)} VND`;
    const changeStr = percentChange != null ? ` (${formatPercentUtil(percentChange)})` : '';
    parts.push(`Giá: ${priceStr}${changeStr}`);
  }

  // Financial metrics
  const metrics: string[] = [];
  if (marketCap != null) metrics.push(`Vốn hóa: ${formatCompact(marketCap, { vietnamese: true })}`);
  if (pe != null) metrics.push(`P/E: ${formatRatioUtil(pe)}`);
  if (pb != null) metrics.push(`P/B: ${formatRatioUtil(pb)}`);
  if (eps != null) metrics.push(`EPS: ${formatNumber(eps)}`);

  if (metrics.length > 0) {
    parts.push(metrics.join(' | '));
  }

  // Exchange and industry
  const exchangeText = exchange ? `Sàn ${exchange}` : '';
  const industryText = industry ? `Ngành ${industry}` : '';
  if (exchangeText || industryText) {
    parts.push([exchangeText, industryText].filter(Boolean).join(' - '));
  }

  // Fallback description
  if (parts.length === 0) {
    parts.push(`Phân tích cổ phiếu ${upperSymbol}. Xem biểu đồ kỹ thuật, báo cáo tài chính, tin tức và phân tích chuyên sâu.`);
  }

  const description = parts.join('. ') + ' | IQX';

  // Keywords
  const keywordParts = [
    upperSymbol,
    `cổ phiếu ${upperSymbol}`,
    `giá ${upperSymbol}`,
    `phân tích ${upperSymbol}`,
    `biểu đồ ${upperSymbol}`,
    companyName,
    fullName,
    exchange,
    industry,
    'chứng khoán việt nam',
  ].filter(Boolean);

  const keywords = keywordParts.join(', ');

  // JSON-LD Structured Data (Schema.org)
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'FinancialProduct',
    name: `${upperSymbol} - ${companyName || fullName || 'Cổ phiếu'}`,
    description: companyProfile || description,
    provider: {
      '@type': 'Organization',
      name: fullName || companyName || upperSymbol,
    },
    offers: price != null ? {
      '@type': 'Offer',
      price: price,
      priceCurrency: 'VND',
      availability: 'https://schema.org/InStock',
    } : undefined,
    additionalProperty: [
      exchange && {
        '@type': 'PropertyValue',
        name: 'Exchange',
        value: exchange,
      },
      industry && {
        '@type': 'PropertyValue',
        name: 'Industry',
        value: industry,
      },
      marketCap != null && {
        '@type': 'PropertyValue',
        name: 'Market Cap',
        value: marketCap,
        unitText: 'VND',
      },
      pe != null && {
        '@type': 'PropertyValue',
        name: 'P/E Ratio',
        value: pe,
      },
      pb != null && {
        '@type': 'PropertyValue',
        name: 'P/B Ratio',
        value: pb,
      },
      eps != null && {
        '@type': 'PropertyValue',
        name: 'EPS',
        value: eps,
        unitText: 'VND',
      },
    ].filter(Boolean),
  };

  // Also add BreadcrumbList for navigation
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Trang chủ',
        item: 'https://iqx.vn/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Cổ phiếu',
        item: 'https://iqx.vn/co-phieu',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: upperSymbol,
        item: `https://iqx.vn/co-phieu/${upperSymbol.toLowerCase()}`,
      },
    ],
  };

  // Combine both JSON-LD schemas
  const combinedJsonLd = [jsonLd, breadcrumbJsonLd];

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="article" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:image" content={DEFAULT_OG_IMAGE} />
      <meta property="og:locale" content="vi_VN" />
      <meta property="article:section" content="Chứng khoán" />
      {industry && <meta property="article:tag" content={industry} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={DEFAULT_OG_IMAGE} />

      {/* Canonical URL */}
      <link rel="canonical" href={`https://iqx.vn/co-phieu/${upperSymbol.toLowerCase()}`} />

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(combinedJsonLd)}
      </script>
    </Helmet>
  );
}
