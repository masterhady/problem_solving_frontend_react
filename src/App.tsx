import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import CompanyDashboard from "./pages/company/CompanyDashboard";
import LeetCodeAnalysis from "./pages/company/LeetCodeAnalysis";
import LeetCodeReport from "./pages/company/LeetCodeReport";
import EmployeeManagement from "./pages/company/EmployeeManagement";
import EmployeeProgress from "./pages/company/EmployeeProgress";
import KPIDashboard from "./pages/company/KPIDashboard";
import EmployeeGoals from "./pages/company/EmployeeGoals";
import Glossary from "./pages/company/Glossary";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import LogoutAction from "./pages/logout";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/logout" element={<LogoutAction />} />

          {/* Company Routes */}
          <Route element={<ProtectedRoute allowedRoles={["company"]} />}>
            <Route path="/company/dashboard" element={<CompanyDashboard />} />
            <Route path="/company/leetcode-analysis" element={<LeetCodeAnalysis />} />
            <Route path="/company/leetcode-report" element={<LeetCodeReport />} />
            <Route path="/company/employees" element={<EmployeeManagement />} />
            <Route path="/company/employees/:employeeId/progress" element={<EmployeeProgress />} />
            <Route path="/company/kpi-dashboard" element={<KPIDashboard />} />
            <Route path="/company/goals" element={<EmployeeGoals />} />
            <Route path="/company/glossary" element={<Glossary />} />
            <Route path="/company/settings" element={<Settings />} />
          </Route>

          {/* Redirect seeker routes to home or auth for now as they are removed */}
          <Route path="/seeker/*" element={<Navigate to="/" replace />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
