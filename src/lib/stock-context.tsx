"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface StockContextType {
    /** Currently viewed stock symbol */
    currentSymbol: string;
    /** Update the current symbol */
    setCurrentSymbol: (symbol: string) => void;
}

const StockContext = createContext<StockContextType | undefined>(undefined);

export function StockProvider({ children }: { children: ReactNode }) {
    const [currentSymbol, setCurrentSymbol] = useState<string>("VNINDEX");

    return (
        <StockContext.Provider value={{ currentSymbol, setCurrentSymbol }}>
            {children}
        </StockContext.Provider>
    );
}

export function useStock() {
    const context = useContext(StockContext);
    if (!context) {
        throw new Error("useStock must be used within a StockProvider");
    }
    return context;
}
