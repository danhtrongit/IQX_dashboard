/**
 * TradingView Chart Component
 * Integrates TradingView Advanced Charts with Vietnam Stock Market data
 */

import { useEffect, useRef, memo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { datafeed, type ResolutionString } from '@/lib/tradingview/datafeed';

// ==================== Types ====================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TradingViewWidget = any;

interface TradingViewChartProps {
    symbol?: string;
    interval?: ResolutionString;
    theme?: 'light' | 'dark';
    autosize?: boolean;
    className?: string;
    onChartReady?: (widget: TradingViewWidget) => void;
    onSymbolChange?: (symbol: string) => void;
}

// Extend window to include TradingView
declare global {
    interface Window {
        TradingView?: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            widget: any;
        };
    }
}

// ==================== Default Configuration ====================

const DEFAULT_INTERVAL: ResolutionString = 'D';

const DISABLED_FEATURES: string[] = [
    'header_compare',
    'display_market_status',
    'go_to_date',
    'header_screenshot',
    'study_templates', // Disable to prevent undefined client/user API calls
];

const ENABLED_FEATURES: string[] = [
    'use_localstorage_for_settings',
    'save_chart_properties_to_local_storage',
    'side_toolbar_in_fullscreen_mode',
    'header_in_fullscreen_mode',
];

// ==================== Script Loader ====================

let scriptLoadPromise: Promise<void> | null = null;

function loadTradingViewScript(): Promise<void> {
    if (scriptLoadPromise) return scriptLoadPromise;

    scriptLoadPromise = new Promise((resolve, reject) => {
        // Check if already loaded
        if (window.TradingView?.widget) {
            resolve();
            return;
        }

        // Check if script tag already exists
        const existingScript = document.querySelector('script[src*="charting_library"]');
        if (existingScript) {
            // Wait for it to load
            const checkLoaded = () => {
                if (window.TradingView?.widget) {
                    resolve();
                } else {
                    setTimeout(checkLoaded, 100);
                }
            };
            checkLoaded();
            return;
        }

        const script = document.createElement('script');
        script.src = '/charting_library/charting_library.standalone.js';
        script.async = true;
        script.onload = () => {
            // Double check TradingView is available
            const checkWidget = () => {
                if (window.TradingView?.widget) {
                    resolve();
                } else {
                    setTimeout(checkWidget, 50);
                }
            };
            checkWidget();
        };
        script.onerror = () => reject(new Error('Failed to load TradingView library'));
        document.head.appendChild(script);
    });

    return scriptLoadPromise;
}

// ==================== Component ====================

function TradingViewChartComponent({
    symbol: propSymbol,
    interval = DEFAULT_INTERVAL,
    theme = 'dark',
    autosize = true,
    className = '',
    onChartReady,
    onSymbolChange,
}: TradingViewChartProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetRef = useRef<TradingViewWidget | null>(null);
    const { symbol: routeSymbol } = useParams<{ symbol: string }>();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Use prop symbol or route symbol, default to VNINDEX
    const currentSymbol = propSymbol || routeSymbol?.toUpperCase() || 'VNINDEX';

    // Index symbols that should stay on homepage
    const INDEX_SYMBOLS = ['VNINDEX', 'HNXINDEX', 'UPCOMINDEX', 'VN30'];

    // Handle symbol change - navigate to stock page for stocks
    const handleSymbolChange = (newSymbol: string) => {
        const symbol = newSymbol.toUpperCase();
        
        if (onSymbolChange) {
            onSymbolChange(symbol);
        }

        // Navigate to stock detail page for non-index symbols
        if (!INDEX_SYMBOLS.includes(symbol)) {
            navigate(`/co-phieu/${symbol}`);
        }
    };

    useEffect(() => {
        if (!containerRef.current) return;

        let isMounted = true;

        const initChart = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Load TradingView script
                await loadTradingViewScript();

                if (!isMounted || !containerRef.current) return;

                const TradingView = window.TradingView;
                if (!TradingView?.widget) {
                    throw new Error('TradingView widget not available');
                }

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const widgetOptions: any = {
                    symbol: currentSymbol,
                    datafeed: datafeed,
                    interval: interval,
                    container: containerRef.current,
                    library_path: '/charting_library/',
                    locale: 'vi',
                    timezone: 'Asia/Ho_Chi_Minh',
                    theme: theme,
                    autosize: autosize,
                    fullscreen: false,
                    debug: false,

                    // UI Configuration
                    disabled_features: DISABLED_FEATURES,
                    enabled_features: ENABLED_FEATURES,

                    // Chart styling
                    overrides: {
                        'paneProperties.background': theme === 'dark' ? '#0a0a0a' : '#ffffff',
                        'paneProperties.backgroundType': 'solid',
                        'paneProperties.vertGridProperties.color': theme === 'dark' ? '#1a1a1a' : '#f0f0f0',
                        'paneProperties.horzGridProperties.color': theme === 'dark' ? '#1a1a1a' : '#f0f0f0',
                        'scalesProperties.textColor': theme === 'dark' ? '#9ca3af' : '#374151',
                        'scalesProperties.lineColor': theme === 'dark' ? '#1a1a1a' : '#e5e7eb',

                        // Candle colors - Vietnam market style (green up, red down)
                        'mainSeriesProperties.candleStyle.upColor': '#00c076',
                        'mainSeriesProperties.candleStyle.downColor': '#ff3a3a',
                        'mainSeriesProperties.candleStyle.borderUpColor': '#00c076',
                        'mainSeriesProperties.candleStyle.borderDownColor': '#ff3a3a',
                        'mainSeriesProperties.candleStyle.wickUpColor': '#00c076',
                        'mainSeriesProperties.candleStyle.wickDownColor': '#ff3a3a',

                        // Volume
                        'volumePaneSize': 'medium',
                    },

                    // Studies overrides
                    studies_overrides: {
                        'volume.volume.color.0': '#ff3a3a',
                        'volume.volume.color.1': '#00c076',
                        'volume.volume.transparency': 50,
                    },

                    // Loading screen
                    loading_screen: {
                        backgroundColor: theme === 'dark' ? '#0a0a0a' : '#ffffff',
                        foregroundColor: theme === 'dark' ? '#3b82f6' : '#2563eb',
                    },

                    // Custom CSS
                    custom_css_url: '/tradingview-custom.css',
                };

                // Create widget
                const tvWidget = new TradingView.widget(widgetOptions);

                tvWidget.onChartReady(() => {
                    if (!isMounted) return;

                    widgetRef.current = tvWidget;
                    setIsLoading(false);

                    // Listen for symbol changes
                    tvWidget.activeChart().onSymbolChanged().subscribe(null, () => {
                        const newSymbol = tvWidget.activeChart().symbol();
                        if (newSymbol && newSymbol !== currentSymbol) {
                            handleSymbolChange(newSymbol);
                        }
                    });

                    // Callback
                    onChartReady?.(tvWidget);
                });
            } catch (err) {
                console.error('[TradingView] Failed to load chart:', err);
                if (isMounted) {
                    setError(err instanceof Error ? err.message : 'Failed to load chart');
                    setIsLoading(false);
                }
            }
        };

        initChart();

        // Cleanup
        return () => {
            isMounted = false;
            if (widgetRef.current) {
                try {
                    widgetRef.current.remove();
                } catch (e) {
                    console.warn('[TradingView] Error removing widget:', e);
                }
                widgetRef.current = null;
            }
        };
    }, [currentSymbol, interval, theme, autosize, onChartReady]);

    // Update symbol when it changes (without recreating widget)
    useEffect(() => {
        if (widgetRef.current && currentSymbol) {
            try {
                widgetRef.current.setSymbol(currentSymbol, interval, () => {
                    console.log(`[TradingView] Symbol changed to ${currentSymbol}`);
                });
            } catch (e) {
                console.warn('[TradingView] Error changing symbol:', e);
            }
        }
    }, [currentSymbol, interval]);

    if (error) {
        return (
            <div className={`w-full h-full flex items-center justify-center bg-background ${className}`}>
                <div className="text-center text-muted-foreground">
                    <p className="text-sm">Không thể tải biểu đồ</p>
                    <p className="text-xs mt-1">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`w-full h-full relative ${className}`} style={{ minHeight: '400px' }}>
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
                    <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <span className="text-xs text-muted-foreground">Đang tải biểu đồ...</span>
                    </div>
                </div>
            )}
            <div
                ref={containerRef}
                className="w-full h-full"
            />
        </div>
    );
}

// Memoize to prevent unnecessary re-renders
export const TradingViewChart = memo(TradingViewChartComponent);
