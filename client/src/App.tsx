import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Emprestimos from "./pages/Emprestimos";
import DetalheEmprestimo from "./pages/DetalheEmprestimo";
import Login from "./pages/Login";
import Seguranca from "./pages/Seguranca";
import UsuariosOnline from "./pages/UsuariosOnline";
import AssistenteIA from "./pages/AssistenteIA";
import ProtectedRoute from "./components/ProtectedRoute";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={() => (
        <ProtectedRoute>
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        </ProtectedRoute>
      )} />
      <Route path="/clientes" component={() => (
        <ProtectedRoute>
          <DashboardLayout>
            <Clientes />
          </DashboardLayout>
        </ProtectedRoute>
      )} />
      <Route path="/emprestimos" component={() => (
        <ProtectedRoute>
          <DashboardLayout>
            <Emprestimos />
          </DashboardLayout>
        </ProtectedRoute>
      )} />
      <Route path="/emprestimos/:id" component={() => (
        <ProtectedRoute>
          <DashboardLayout>
            <DetalheEmprestimo />
          </DashboardLayout>
        </ProtectedRoute>
      )} />
      <Route path="/seguranca" component={() => (
        <ProtectedRoute>
          <DashboardLayout>
            <Seguranca />
          </DashboardLayout>
        </ProtectedRoute>
      )} />
      <Route path="/usuarios-online" component={() => (
        <ProtectedRoute>
          <DashboardLayout>
            <UsuariosOnline />
          </DashboardLayout>
        </ProtectedRoute>
      )} />
      <Route path="/assistente" component={() => (
        <ProtectedRoute>
          <DashboardLayout>
            <AssistenteIA />
          </DashboardLayout>
        </ProtectedRoute>
      )} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
