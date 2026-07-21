"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Coins, LayoutDashboard, ReceiptText, UserCheck, Compass, MessageSquareCode, LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  userProfile: { full_name: string; avatar_url: string } | null;
  selectedMonthStr: string;
  hasStrategy: boolean;
  getReadableMonthLabel: (monthStr: string) => string;
  handleLogout: () => void;
}

export function Header({
  userProfile,
  selectedMonthStr,
  getReadableMonthLabel,
  handleLogout,
}: HeaderProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/transactions", label: "Transações", icon: ReceiptText },
    { href: "/profile", label: "Perfil & Cartões", icon: UserCheck },
    { href: "/onboarding", label: "Onboarding", icon: Compass },
    { href: "/chat", label: "Conselheira IA", icon: MessageSquareCode },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300 w-full mb-6 py-3",
        scrolled ? "bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-[#27272A] shadow-2xl" : "bg-transparent border-b border-white/5"
      )}
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-4 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & User Greeting */}
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-yellow-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.2)] group-hover:scale-105 transition-transform">
            <Coins className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-black tracking-tight text-white">
              {userProfile?.full_name ? `Olá, ${userProfile.full_name.split(" ")[0]}` : "FINTECH CASAL"}
            </span>
            <span className="text-[9px] text-zinc-400 font-medium tracking-wider uppercase">
              Sintonia Financeira
            </span>
          </div>
        </Link>

        {/* Center: Desktop Navigation Pill Menu */}
        <nav className="hidden lg:flex items-center gap-1 p-1.5 rounded-full bg-zinc-950/80 border border-[#27272A] backdrop-blur-md shadow-lg">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300",
                  isActive
                    ? "bg-yellow-500 text-zinc-950 shadow-[0_0_15px_rgba(234,179,8,0.4)]"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-zinc-950" : "text-zinc-400")} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right: Month Label, User Avatar & Logout */}
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="hidden sm:inline-flex border-yellow-500/25 text-yellow-400 bg-yellow-950/15 px-3 py-1 text-xs font-extrabold">
            {getReadableMonthLabel(selectedMonthStr)}
          </Badge>

          <div className="flex items-center gap-2.5 pl-2 border-l border-white/10">
            {userProfile?.avatar_url ? (
              <img
                src={userProfile.avatar_url}
                alt="Avatar"
                className="w-8 h-8 rounded-full border border-white/10 object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-xs font-bold text-yellow-400">
                {userProfile?.full_name ? userProfile.full_name.substring(0, 2).toUpperCase() : "FC"}
              </div>
            )}
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-zinc-900/50 hover:bg-rose-500/10 border border-white/5 hover:border-rose-500/20 text-zinc-400 hover:text-rose-500 transition-colors"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-300"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-yellow-400" /> : <Menu className="w-5 h-5 text-yellow-400" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-3 px-4 py-3 bg-zinc-950/95 border-b border-[#27272A] space-y-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl text-xs font-bold transition-all",
                  isActive
                    ? "bg-yellow-500 text-zinc-950"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
