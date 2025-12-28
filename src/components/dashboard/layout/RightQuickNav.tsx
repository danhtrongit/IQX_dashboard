import { ShoppingCart, Newspaper, ChevronLeft, ChevronRight, Briefcase, Bot, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Types for right panel navigation
export type RightPanelView = 'trade' | 'portfolio' | 'news' | 'ai' | 'arix';

interface RightQuickNavProps {
    activePanel?: RightPanelView;
    onPanelChange?: (panel: RightPanelView) => void;
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
}: RightQuickNavProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className={cn(
            "flex flex-col items-center py-2 border-l border-border/40 bg-background/50 backdrop-blur-sm gap-2 transition-all duration-300 relative z-30",
            isExpanded ? "w-16" : "w-12"
        )}>
            <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 mb-2 text-muted-foreground"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {isExpanded ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
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

                {/* Trading Analysis - Arix Panel */}
                <NavItem
                    icon={BarChart3}
                    label="Trading Analysis"
                    isExpanded={isExpanded}
                    isActive={activePanel === 'arix'}
                    onClick={() => onPanelChange?.('arix')}
                />
            </div>
        </div>
    );
}
