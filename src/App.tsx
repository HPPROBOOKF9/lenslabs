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
import DeletedListings from "./pages/DeletedListings";
import DataBlock from "./pages/DataBlock";
import Draft from "./pages/Draft";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import ProtectedRoute from "./components/ProtectedRoute";
import Unauthorized from "./pages/Unauthorized";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/create-new" element={<ProtectedRoute><CreateNew /></ProtectedRoute>} />
          <Route path="/cpv" element={<ProtectedRoute><CPV /></ProtectedRoute>} />
          <Route path="/assign" element={<ProtectedRoute><Assign /></ProtectedRoute>} />
          <Route path="/worklist" element={<ProtectedRoute><Worklist /></ProtectedRoute>} />
          <Route path="/nr" element={<ProtectedRoute><NR /></ProtectedRoute>} />
          <Route path="/np" element={<ProtectedRoute><NP /></ProtectedRoute>} />
          <Route path="/pr" element={<ProtectedRoute><PR /></ProtectedRoute>} />
          <Route path="/trend-analysis" element={<ProtectedRoute><TrendAnalysis /></ProtectedRoute>} />
          <Route path="/deleted-listings" element={<ProtectedRoute><DeletedListings /></ProtectedRoute>} />
          <Route path="/data-block" element={<ProtectedRoute><DataBlock /></ProtectedRoute>} />
          <Route path="/draft" element={<ProtectedRoute><Draft /></ProtectedRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
