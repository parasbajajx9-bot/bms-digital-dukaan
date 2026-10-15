import { Link } from "wouter";
import { ArrowRight, BarChart3, FileText, PackageSearch, ShieldCheck, Store } from "lucide-react";
import { useAuth } from "@clerk/react";

const highlights = [
  { icon: FileText, title: "Fast billing", detail: "Create bills and GST-ready receipts." },
  { icon: PackageSearch, title: "Live inventory", detail: "Keep products, prices, and stock together." },
  { icon: BarChart3, title: "Clear records", detail: "Review invoices, sales, and customer credit." },
];

export default function WelcomePage() {
  const { isSignedIn } = useAuth();

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7fafc] text-slate-900">
      <div className="absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_at_top_right,_rgba(20,184,166,0.16),_transparent_55%)]" />
      <div className="relative mx-auto max-w-6xl px-5 py-7 md:px-8">
        <header className="flex items-center justify-between">
          <Link href="/">
            <span className="flex cursor-pointer items-center gap-3">
              <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="" className="h-10 w-10" />
              <span>
                <span className="block text-lg font-extrabold tracking-tight">BMS</span>
                <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Business Management System</span>
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {isSignedIn ? (
              <Link href="/billing">
                <span className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90">
                  Open my shop <ArrowRight size={16} />
                </span>
              </Link>
            ) : (
              <>
                <Link href="/sign-in">
                  <span className="cursor-pointer rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-white">Sign in</span>
                </Link>
                <Link href="/sign-up">
                  <span className="hidden cursor-pointer rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 sm:inline-flex">
                    Create owner account
                  </span>
                </Link>
              </>
            )}
          </div>
        </header>

        <section className="grid items-center gap-12 pb-16 pt-16 md:grid-cols-[1.1fr_0.9fr] md:pb-24 md:pt-24">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-teal-800 shadow-sm">
              <ShieldCheck size={14} />
              Your shop data belongs to your sign-in
            </div>
            <h1 className="mt-6 max-w-2xl text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">
              Run your shop with less paperwork.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 md:text-lg">
              Billing, stock, customer credit, invoices, and GST tools in one simple workspace. Sign in to keep your shop data backed up and available across devices.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {isSignedIn ? (
                <Link href="/billing">
                  <span className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-md shadow-teal-900/10 hover:bg-primary/90">
                    Go to billing <ArrowRight size={16} />
                  </span>
                </Link>
              ) : (
                <>
                  <Link href="/sign-up">
                    <span className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-md shadow-teal-900/10 hover:bg-primary/90">
                      Create owner account <ArrowRight size={16} />
                    </span>
                  </Link>
                  <Link href="/sign-in">
                    <span className="inline-flex cursor-pointer items-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-slate-300">
                      I already have an account
                    </span>
                  </Link>
                </>
              )}
            </div>
            <p className="mt-4 text-xs text-slate-500">Use your own account. Each owner's shop records are kept separate.</p>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-5 rounded-[2rem] bg-gradient-to-br from-teal-200/60 via-cyan-100/40 to-emerald-100/60 blur-xl" />
            <div className="relative rounded-[1.75rem] border border-white bg-white p-5 shadow-2xl shadow-slate-300/50 sm:p-7">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Store size={22} />
                </div>
                <div>
                  <p className="text-sm font-bold">One place for your shop</p>
                  <p className="mt-0.5 text-xs text-slate-500">Simple tools for everyday work</p>
                </div>
              </div>
              <div className="mt-3 divide-y divide-slate-100">
                {highlights.map(({ icon: Icon, title, detail }) => (
                  <div className="flex gap-3 py-4" key={title}>
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-primary">
                      <Icon size={18} />
                    </span>
                    <span>
                      <span className="block text-sm font-bold">{title}</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">{detail}</span>
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-800">
                <ShieldCheck size={15} /> Sign in to sync and back up your records
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-slate-200/80 py-5 text-center text-xs text-slate-500">
          BMS · Billing, inventory, invoices, and GST tools for your shop
        </footer>
      </div>
    </main>
  );
}
