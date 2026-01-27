import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "./components/dashboard/layout/DashboardLayout";

// Lazy load page components
const HomePage = lazy(() => import("./components/dashboard/pages/HomePage").then(module => ({ default: module.HomePage })));
const StockDetailPage = lazy(() => import("./components/dashboard/pages/StockDetailPage").then(module => ({ default: module.StockDetailPage })));
const ComingSoonPage = lazy(() => import("./components/dashboard/pages/ComingSoonPage").then(module => ({ default: module.ComingSoonPage })));
const SectorPage = lazy(() => import("./components/dashboard/features/sector/SectorPage").then(module => ({ default: module.SectorPage })));

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
                        <Route path="/nganh" element={<SectorPage />} />
                        <Route path="/bang-gia" element={<ComingSoonPage />} />
                        <Route path="/loc-co-phieu" element={<ComingSoonPage />} />
                        <Route path="/san-bot" element={<ComingSoonPage />} />
                        <Route path="/goi-dich-vu" element={<ComingSoonPage />} />
                    </Route>
                </Routes>
            </Suspense>
        </BrowserRouter>
    );
}

export default App;