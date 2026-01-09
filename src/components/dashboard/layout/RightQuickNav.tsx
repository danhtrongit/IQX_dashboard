import { ShoppingCart, Newspaper, ChevronLeft, ChevronRight, Briefcase, Bot, BarChart3, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Types for right panel navigation
export type RightPanelView = 'trade' | 'portfolio' | 'news' | 'ai' | 'arix' | 'ranking';

interface RightQuickNavProps {
    activePanel?: RightPanelView;
    onPanelChange?: (panel: RightPanelView) => void;
    isPanelCollapsed?: boolean;
    onTogglePanel?: () => void;
}

const NavItem = ({
    icon: Icon,
    label,
    isExpanded,
    isActive,
    onClick
}: {
    icon: any,
    label: string,
    isExpanded: boolean,
    isActive?: boolean,
    onClick?: () => void
}) => (
    <TooltipProvider delayDuration={0}>
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="ghost"
                    className={cn(
                        "flex flex-col items-center justify-center transition-all",
                        isExpanded ? "h-14 w-full px-1" : "h-10 w-10 px-0",
                        isActive && "bg-accent text-accent-foreground"
                    )}
                    onClick={onClick}
                >
                    <Icon className={cn("h-5 w-5 mb-0.5", isActive && "text-primary")} />
                    {isExpanded && <span className="text-[9px] font-medium leading-none mt-1 text-center text-muted-foreground">{label}</span>}
                </Button>
            </TooltipTrigger>
            {!isExpanded && (
                <TooltipContent side="left" className="text-xs bg-popover text-popover-foreground border-border">
                    <p>{label}</p>
                </TooltipContent>
            )}
        </Tooltip>
    </TooltipProvider>
);

export function RightQuickNav({
    activePanel = 'trade',
    onPanelChange,
    isPanelCollapsed = false,
    onTogglePanel,
}: RightQuickNavProps) {
    // isExpanded controls text visibility under icons (always true for better UX)
    const isExpanded = true;

    return (
        <div className={cn(
            "flex flex-col items-center py-2 border-l border-border/40 bg-background/50 backdrop-blur-sm gap-2 transition-all duration-300 relative z-30",
            "w-16"
        )}>
            <Button
                variant="ghost"
                size="sm"
                className="h-8 w-12 mb-2 text-muted-foreground hover:bg-accent"
                onClick={onTogglePanel}
            >
                {isPanelCollapsed ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </Button>

            <div className="flex flex-col gap-2 w-full px-1">
                {/* Đặt lệnh - Trade Panel */}
                <NavItem
                    icon={ShoppingCart}
                    label="Đặt lệnh"
                    isExpanded={isExpanded}
                    isActive={activePanel === 'trade'}
                    onClick={() => onPanelChange?.('trade')}
                />

                {/* Theo dõi - Portfolio Panel */}
                <NavItem
                    icon={Briefcase}
                    label="Theo dõi"
                    isExpanded={isExpanded}
                    isActive={activePanel === 'portfolio'}
                    onClick={() => onPanelChange?.('portfolio')}
                />

                {/* Tin tức - News Panel */}
                <NavItem
                    icon={Newspaper}
                    label="Tin tức"
                    isExpanded={isExpanded}
                    isActive={activePanel === 'news'}
                    onClick={() => onPanelChange?.('news')}
                />

                {/* AI Chatbot Panel */}
                <NavItem
                    icon={Bot}
                    label="AI Chat"
                    isExpanded={isExpanded}
                    isActive={activePanel === 'ai'}
                    onClick={() => onPanelChange?.('ai')}
                />

                {/* Arix Hub - Arix Panel */}
                <NavItem
                    icon={BarChart3}
                    label="Arix Hub"
                    isExpanded={isExpanded}
                    isActive={activePanel === 'arix'}
                    onClick={() => onPanelChange?.('arix')}
                />

                {/* Biến động - Ranking Panel */}
                <NavItem
                    icon={TrendingUp}
                    label="Biến động"
                    isExpanded={isExpanded}
                    isActive={activePanel === 'ranking'}
                    onClick={() => onPanelChange?.('ranking')}
                />
            </div>
        </div>
    );
}
