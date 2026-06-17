import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import NotFound from "@/pages/not-found";

import BillingPage from "@/pages/billing";
import KhataPage from "@/pages/khata";
import InventoryPage from "@/pages/inventory";
import ReportsPage from "@/pages/reports";
import InvoicesPage from "@/pages/invoices";

const queryClient = new QueryClient();

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={() => <Redirect to="/billing" />} />
        <Route path="/billing" component={BillingPage} />
        <Route path="/invoices" component={InvoicesPage} />
        <Route path="/khata" component={KhataPage} />
        <Route path="/inventory" component={InventoryPage} />
        <Route path="/reports" component={ReportsPage} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
