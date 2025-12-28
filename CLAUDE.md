# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

IQX Dashboard is a React-based Vietnamese stock trading platform frontend. It provides real-time stock data visualization, market analysis, portfolio management, and paper trading capabilities through an integrated TradingView charting interface.

**Tech Stack:** React 19, TypeScript, Vite, React Router, Tailwind CSS 4, Radix UI, TradingView Charting Library

## Development Commands

```bash
# Start development server (with hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

The dev server runs at http://localhost:5173 with API proxy to `http://localhost:8000`.

## Architecture

### Directory Structure

```
src/
├── components/
│   ├── dashboard/
│   │   ├── layout/              # Layout components (header, footer, sidebar)
│   │   ├── pages/               # Page-level components (routes)
│   │   └── features/            # Feature modules (organized by domain)
│   │       ├── analysis/        # Market analysis widgets
│   │       ├── analysis2/       # Advanced analysis panels
│   │       ├── arix/            # AI assistant (Mr. Arix)
│   │       ├── auth/            # Authentication forms
│   │       ├── chart/           # TradingView chart integration
│   │       ├── chat/            # Chat interface
│   │       ├── market/          # Market overview widgets
│   │       ├── news/            # News feeds
│   │       ├── portfolio/       # Portfolio management
│   │       ├── search/          # Symbol search
│   │       ├── stock-info/      # Stock detail widgets
│   │       └── trade/           # Trading interface (order entry, positions)
│   ├── seo/                     # SEO components (react-helmet-async)
│   └── ui/                      # Reusable Radix UI components (buttons, dialogs, etc.)
├── lib/                         # Utilities and API clients
│   ├── api.ts                   # Base Axios instance with auth interceptors
│   ├── chat-api.ts              # AI chat API client
│   ├── format.ts                # Number/currency formatting utilities
│   ├── price-stream-api.ts      # Real-time price streaming helpers
│   ├── stock-api.ts             # Stock data API client
│   ├── symbols-api.ts           # Symbol search/listing API client
│   ├── trading-api.ts           # Trading API client (orders, positions, wallet)
│   ├── tradingview/             # TradingView datafeed implementation
│   └── utils.ts                 # General utilities (cn, etc.)
└── hooks/                       # React hooks
    ├── usePriceStream.ts        # WebSocket-based real-time price updates
    ├── useWebSocketStatus.ts    # WebSocket connection status
    └── use-mobile.ts            # Mobile/responsive detection
```

### Key Architectural Patterns

1. **Feature-based organization**: Features are grouped by domain (`auth/`, `trade/`, `chart/`, etc.) under `components/dashboard/features/`. Each feature is self-contained with its own components.

2. **API client layer**: All backend communication goes through API clients in `lib/`. These handle:
   - Authentication (JWT token management, auto-refresh)
   - Error handling and localization (Vietnamese messages)
   - Type safety (TypeScript interfaces matching backend DTOs)

3. **Layout composition**:
   - `DashboardLayout` (layout/DashboardLayout.tsx) - Main wrapper with header/footer
   - `WorkspaceLayout` (layout/WorkspaceLayout.tsx) - Multi-panel workspace (left sidebar, center content, right quick nav)
   - Pages use `Outlet` for child routes

4. **Real-time data**: WebSocket integration via `usePriceStream` hook for live price updates during Vietnam trading hours (9:00-11:30, 13:00-15:00 ICT).

5. **TradingView integration**: Custom datafeed (lib/tradingview/datafeed.ts) bridges backend API to TradingView Charting Library.

## Backend Integration

### API Proxy

Vite dev server proxies API requests (vite.config.ts):
- HTTP: `/api` → `http://localhost:8000`
- WebSocket: `/api/v1/ws` → `ws://localhost:8000`

### Authentication Flow

Authentication uses JWT tokens stored in localStorage:
- `iqx_access_token` - Short-lived access token
- `iqx_refresh_token` - Long-lived refresh token

The axios interceptor (lib/api.ts) automatically:
1. Attaches `Authorization: Bearer <token>` to requests
2. Refreshes expired tokens on 401 responses
3. Queues failed requests during token refresh
4. Clears tokens and fires `auth:logout` event on refresh failure

Listen for auth state changes:
```typescript
window.addEventListener('auth:logout', () => {
  // Redirect to login, clear state, etc.
});
```

### Main API Clients

All API clients are in `lib/`:
- **AuthAPI** (api.ts) - Login, logout, profile, token refresh
- **StockAPI** (stock-api.ts) - Company info, financials, news
- **SymbolsAPI** (symbols-api.ts) - Symbol search, listing, industries
- **QuotesAPI** (trading-api.ts) - Price board, historical/intraday data
- **TradingAPI** (trading-api.ts) - Orders, positions, wallet, trades
- **ChatAPI** (chat-api.ts) - AI assistant (Mr. Arix) conversations

All API types (request/response interfaces) are defined in their respective client files. Always use these types instead of `any`.

## TradingView Charting Library

The `charting_library/` folder contains the official TradingView Charting Library (external dependency, not in npm). It's a commercial library with TypeScript definitions.

### Custom Datafeed

The custom datafeed (lib/tradingview/datafeed.ts) implements TradingView's `IBasicDataFeed` interface:
- `searchSymbols()` - Symbol search via backend `/symbols/search`
- `resolveSymbol()` - Get symbol info (exchange, type, timezone)
- `getBars()` - Fetch historical OHLCV data from backend `/quotes/ohlc` or `/quotes/intraday`
- Real-time updates are handled separately via WebSocket (not through datafeed)

Vietnamese market specifics:
- Exchange code: `'HOSE'`, `'HNX'`, `'UPCOM'`
- Timezone: `'Asia/Ho_Chi_Minh'`
- Trading hours: Mon-Fri, 9:00-11:30 and 13:00-15:00 ICT
- Price format: Prices from backend are in thousands (e.g., 74.5 = 74,500 VND)

## Vietnamese Market Data Formatting

Use utilities from `lib/format.ts` for consistent formatting:

```typescript
import { formatPrice, formatPercent, formatVolume, formatCompact } from '@/lib/format';

// Prices are in thousands, multiply by 1000 for display
formatPrice(74.5)          // "74.500"
formatPriceVND(74.5)       // "74.500 VND"

// Percent with sign
formatPercent(2.5)         // "+2.5%"
formatPercent(-1.23)       // "-1.23%"

// Volume with dot separator
formatVolume(1234567)      // "1.234.567"

// Large numbers with Vietnamese suffix
formatCompact(1500000000, { vietnamese: true })  // "1,5 tỷ"
formatMarketCap(2.5e12)    // "2,5 nghìn tỷ"
```

**Important**: Vietnamese number format uses:
- Dot (`.`) as thousand separator: `1.234.567`
- Comma (`,`) as decimal separator: `3,14`

## Real-time Price Updates

### usePriceStream Hook

The `usePriceStream` hook provides real-time price updates:

```typescript
import { usePriceStream } from '@/hooks/usePriceStream';

const { priceInfo, isLoading, isConnected, isTradingHours, refresh } =
  usePriceStream({ symbol: 'VNM', enabled: true });
```

Behavior:
1. **Initial load**: Fetches price via REST API (`/quotes/price-board`)
2. **During trading hours**: Connects to WebSocket (`/api/v1/ws/prices`) for real-time updates
3. **Outside trading hours**: No WebSocket connection, uses cached data
4. **Auto-reconnect**: Reconnects every 3s if connection drops during trading hours

The hook manages:
- Symbol subscription/resubscription
- Trading hours detection (checks every 60s)
- Merging WebSocket updates with initial data (preserves ref_price, ceiling, floor)

### WebSocket Message Types

Backend sends these message types:
- `price` - Single symbol price update
- `cached_prices` - Bulk cached prices (on connection)
- `index` / `indices` - Market index data (VNINDEX, HNX, UPCOM)
- `subscribed` - Subscription confirmation
- `error` - Error message

Client can send:
- `{ action: 'subscribe', symbols: ['VNM', 'HPG'] }` - Subscribe to symbols
- `{ action: 'unsubscribe', symbols: ['VNM'] }` - Unsubscribe
- `{ action: 'get_cached' }` - Request cached prices

## Path Aliases

TypeScript path alias `@/*` maps to `src/*` (configured in tsconfig.json and vite.config.ts):

```typescript
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/format';
import { usePriceStream } from '@/hooks/usePriceStream';
```

Always use `@/` imports instead of relative paths for better refactoring.

## UI Components

Radix UI components are in `components/ui/` (installed via shadcn/ui). They follow these conventions:
- Tailwind CSS 4 styling with CSS variables for theming
- Composable with `asChild` prop for polymorphism
- Controlled/uncontrolled modes supported
- Dark mode via `next-themes` (uses `ThemeProvider` in main.tsx)

Common components:
- `Button`, `Dialog`, `Sheet`, `Popover`, `Tooltip` - Interactive overlays
- `Card`, `Separator`, `Badge`, `Avatar` - Layout/display
- `Form`, `Input`, `Select`, `Checkbox`, `Switch` - Forms (react-hook-form + zod)
- `Table`, `Tabs`, `Accordion`, `Collapsible` - Data display
- `Sonner` - Toast notifications (use `toast()` from 'sonner')

## Routing

Routes are defined in App.tsx using React Router v7:

```typescript
<Route element={<DashboardLayout />}>
  <Route index element={<HomePage />} />
  <Route path="/co-phieu/:symbol" element={<StockDetailPage />} />
  <Route path="/bang-gia" element={<PriceBoardPage />} />
</Route>
```

Pages are lazy-loaded for code splitting. Always use Vietnamese URLs for public-facing pages.

## SEO

Use the `SEO` component (components/seo/SEO.tsx) with react-helmet-async:

```tsx
import { SEO } from '@/components/seo/SEO';

<SEO
  title="Trang chủ"
  description="Nền tảng giao dịch chứng khoán IQX"
  keywords="chứng khoán, cổ phiếu, đầu tư"
/>
```

## Adding New Features

1. **Create feature module** in `components/dashboard/features/[feature-name]/`
2. **Add API client** in `lib/[feature-name]-api.ts` if backend integration needed
3. **Define types** matching backend DTOs at the top of API client
4. **Create components** in feature folder (typically one main component + sub-components)
5. **Add route** in App.tsx if it's a new page
6. **Use existing hooks** (`usePriceStream`, `useWebSocketStatus`) for real-time data

Example feature structure:
```
features/my-feature/
├── MyFeaturePanel.tsx       # Main component
├── MyFeatureCard.tsx        # Sub-component
└── MyFeatureDialog.tsx      # Modal/dialog
```

## Important Notes

- **Never commit** `.env` file (contains API keys for Mr. Arix)
- **Dark mode**: Theme is controlled by `ThemeProvider` and persisted to localStorage
- **Vietnamese language**: All user-facing text should be in Vietnamese
- **Price precision**: Backend returns prices in thousands (divide by 1000 if needed for calculations)
- **Trading hours**: Vietnam market trades Mon-Fri, 9:00-11:30 and 13:00-15:00 ICT (no trading on weekends/holidays)
- **Code splitting**: Pages are lazy-loaded, keep initial bundle small
- **Responsive design**: Use Tailwind breakpoints (`sm:`, `md:`, `lg:`) for mobile support
