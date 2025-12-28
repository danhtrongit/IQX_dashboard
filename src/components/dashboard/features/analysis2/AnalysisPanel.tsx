import { MarketLeaders } from "../market/MarketLeaders";
import { MarketDistribution } from "../market/MarketDistribution";
import { MarketBehaviorChart } from "../market/MarketBehaviorChart";
import { TechnicalAnalysis } from "../market/TechnicalAnalysis";

export function AnalysisPanel() {
    return (
        <div className="absolute inset-0 overflow-y-auto overflow-x-hidden bg-background scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
            <div className="flex flex-col pb-20">
                {/* Market Leaders Section */}
                <div className="h-[340px] shrink-0 border-b border-border/40">
                    <MarketLeaders />
                </div>

                {/* Market Distribution Section */}
                <div className="min-h-[420px] shrink-0 border-b border-border/40 py-2">
                    <MarketDistribution />
                </div>

                {/* Market Behavior Chart Section */}
                <div className="shrink-0 border-b border-border/40 p-2">
                    <MarketBehaviorChart />
                </div>

                {/* Technical Analysis Section */}
                <div className="shrink-0 border-b border-border/40 p-2">
                    <TechnicalAnalysis />
                </div>
            </div>
        </div>
    );
}

