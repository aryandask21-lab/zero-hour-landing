import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Tournaments from "./pages/Tournaments";
import CreateTournament from "./pages/CreateTournament";
import TournamentDetail from "./pages/TournamentDetail";
import Teams from "./pages/Teams";
import CreateTeam from "./pages/CreateTeam";
import Leaderboards from "./pages/Leaderboards";
import WalletPage from "./pages/Wallet";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import TournamentManage from "./pages/TournamentManage";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/tournaments" element={<Tournaments />} />
            <Route path="/tournaments/create" element={
              <ProtectedRoute>
                <CreateTournament />
              </ProtectedRoute>
            } />
            <Route path="/tournaments/:id" element={<TournamentDetail />} />
            <Route path="/tournaments/:id/manage" element={
              <ProtectedRoute>
                <TournamentManage />
              </ProtectedRoute>
            } />
            <Route path="/teams" element={<Teams />} />
            <Route path="/teams/create" element={
              <ProtectedRoute>
                <CreateTeam />
              </ProtectedRoute>
            } />
            <Route path="/leaderboards" element={<Leaderboards />} />
            <Route path="/wallet" element={
              <ProtectedRoute>
                <WalletPage />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="admin">
                <Admin />
            </ProtectedRoute>
            } />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/cancel" element={<PaymentCancel />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
