import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "./components/dashboard/layout/DashboardLayout";

// Lazy load page components
const HomePage = lazy(() => import("./components/dashboard/pages/HomePage").then(module => ({ default: module.HomePage })));
const StockDetailPage = lazy(() => import("./components/dashboard/pages/StockDetailPage").then(module => ({ default: module.StockDetailPage })));
const PriceBoardPage = lazy(() => import("./components/dashboard/pages/PriceBoardPage").then(module => ({ default: module.PriceBoardPage })));

// Loading fallback component
const PageLoader = () => (
    <div className="flex items-center justify-center h-full w-full min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
);

function App() {
    return (
        <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    <Route element={<DashboardLayout />}>
                        <Route index element={<HomePage />} />
                        <Route path="/co-phieu/:symbol" element={<StockDetailPage />} />
                        <Route path="/bang-gia" element={<PriceBoardPage />} />
                    </Route>
                </Routes>
            </Suspense>
        </BrowserRouter>
    );
}

export default App;