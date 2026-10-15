import { useEffect, useRef, useState } from "react";
import {
  ClerkProvider,
  Show,
  SignIn,
  SignUp,
  useClerk,
} from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import {
  Switch,
  Route,
  Router as WouterRouter,
  Redirect,
  useLocation,
} from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { CloudDataBoundary } from "@/components/CloudDataBoundary";
import NotFound from "@/pages/not-found";
import { SHOP_DATA_CHANGED_EVENT, storage } from "@/lib/storage";

import BillingPage from "@/pages/billing";
import KhataPage from "@/pages/khata";
import InventoryPage from "@/pages/inventory";
import ReportsPage from "@/pages/reports";
import InvoicesPage from "@/pages/invoices";
import HelpPage from "@/pages/help";
import WelcomePage from "@/pages/welcome";
import AccountDataPage from "@/pages/account";

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in the app environment.");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(192 80% 38%)",
    colorForeground: "hsl(222 47% 15%)",
    colorMutedForeground: "hsl(215 16% 50%)",
    colorDanger: "hsl(0 72% 51%)",
    colorBackground: "hsl(0 0% 100%)",
    colorInput: "hsl(0 0% 100%)",
    colorInputForeground: "hsl(222 47% 15%)",
    colorNeutral: "hsl(214 32% 87%)",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    borderRadius: "0.85rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-slate-900 font-bold",
    headerSubtitle: "text-slate-600",
    socialButtonsBlockButtonText: "text-slate-700 font-semibold",
    formFieldLabel: "text-slate-700 font-medium",
    footerActionLink: "text-teal-700 font-semibold hover:text-teal-800",
    footerActionText: "text-slate-500",
    dividerText: "text-slate-400",
    identityPreviewEditButton: "text-teal-700",
    formFieldSuccessText: "text-emerald-700",
    alertText: "text-red-700",
    logoBox: "mb-2",
    logoImage: "h-10 w-10",
    socialButtonsBlockButton: "rounded-xl border-slate-200 hover:bg-slate-50",
    formButtonPrimary: "rounded-xl bg-teal-700 hover:bg-teal-800 shadow-sm",
    formFieldInput: "rounded-xl border-slate-200 focus:border-teal-600 focus:ring-teal-600",
    footerAction: "border-t border-slate-100",
    dividerLine: "bg-slate-200",
    alert: "rounded-xl border-red-200 bg-red-50",
    otpCodeFieldInput: "rounded-lg border-slate-200",
    formFieldRow: "gap-1.5",
    main: "gap-5",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-8">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-8">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/billing" />
      </Show>
      <Show when="signed-out">
        <WelcomePage />
      </Show>
    </>
  );
}

function WorkspaceRouter() {
  const [location] = useLocation();
  const [onboardingDone, setOnboardingDone] = useState(() =>
    Boolean(storage.getSettings().shopName?.trim())
  );

  useEffect(() => {
    const checkShopName = () => {
      if (storage.getSettings().shopName?.trim()) setOnboardingDone(true);
    };
    window.addEventListener(SHOP_DATA_CHANGED_EVENT, checkShopName);
    return () => window.removeEventListener(SHOP_DATA_CHANGED_EVENT, checkShopName);
  }, []);

  return (
    <AppLayout>
      {!onboardingDone && location !== "/account" && (
        <OnboardingWizard onComplete={() => setOnboardingDone(true)} />
      )}
      <Switch>
        <Route path="/" component={() => <Redirect to="/billing" />} />
        <Route path="/billing" component={BillingPage} />
        <Route path="/invoices" component={InvoicesPage} />
        <Route path="/khata" component={KhataPage} />
        <Route path="/inventory" component={InventoryPage} />
        <Route path="/reports" component={ReportsPage} />
        <Route path="/help" component={HelpPage} />
        <Route path="/account" component={AccountDataPage} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function ProtectedApp() {
  return (
    <>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
      <Show when="signed-in">
        <CloudDataBoundary>
          <WorkspaceRouter />
        </CloudDataBoundary>
      </Show>
    </>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: "Welcome back", subtitle: "Sign in to access your shop" } },
        signUp: { start: { title: "Create your owner account", subtitle: "Keep your shop data backed up" } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          <Route component={ProtectedApp} />
        </Switch>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <TooltipProvider>
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
        <Toaster />
      </WouterRouter>
    </TooltipProvider>
  );
}

export default App;
