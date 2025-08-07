import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import CsvUpload from "./pages/CsvUpload";
import DataAggregation from "./pages/DataAggregation";
import RcaAnalysis from "./pages/RcaAnalysis";
import BidSimulation from "./pages/BidSimulation";
import RcaBidSimulation from "./pages/RcaBidSimulation";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <TooltipProvider>
          <BrowserRouter>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/csv-upload" element={<CsvUpload />} />
              <Route path="/data-aggregation" element={<DataAggregation />} />
              <Route path="/rca-analysis" element={<RcaAnalysis />} />
              <Route path="/bid-simulation" element={<BidSimulation />} />
              <Route path="/rca-bid-simulation" element={<RcaBidSimulation />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
