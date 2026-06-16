import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Calculator, BookOpen, PackageSearch, BarChart3 } from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { path: "/billing", label: "Billing", icon: Calculator },
    { path: "/khata", label: "Khata", icon: BookOpen },
    { path: "/inventory", label: "Inventory", icon: PackageSearch },
    { path: "/reports", label: "Reports", icon: BarChart3 },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden text-foreground">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 glass-panel border-r border-y-0 border-l-0 rounded-none h-full flex flex-col pt-6 z-10">
        <div className="px-6 mb-8">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-500">
            Digital Dukaan
          </h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    isActive 
                      ? "bg-primary/20 text-primary font-medium border border-primary/30" 
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  }`}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
