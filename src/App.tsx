import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import CreateNew from "./pages/CreateNew";
import CPV from "./pages/CPV";
import Assign from "./pages/Assign";
import Worklist from "./pages/Worklist";
import NR from "./pages/NR";
import NP from "./pages/NP";
import PR from "./pages/PR";
import TrendAnalysis from "./pages/TrendAnalysis";
import Draft from "./pages/Draft";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/create-new" element={<CreateNew />} />
          <Route path="/cpv" element={<CPV />} />
          <Route path="/assign" element={<Assign />} />
          <Route path="/worklist" element={<Worklist />} />
          <Route path="/nr" element={<NR />} />
          <Route path="/np" element={<NP />} />
          <Route path="/pr" element={<PR />} />
          <Route path="/trend-analysis" element={<TrendAnalysis />} />
          <Route path="/draft" element={<Draft />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
