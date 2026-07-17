import React from "react";
import Link from "next/link";
import { Coins, Sparkles, LogOut } from "lucide-react";
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
  hasStrategy,
  getReadableMonthLabel,
  handleLogout,
}: HeaderProps) {
  return (
    <header className="flex flex-col gap-4 xs:flex-row xs:justify-between xs:items-center mb-6 xs:mb-8 pb-4 border-b border-white/5">
      <div className="flex items-center gap-3 w-full xs:w-auto">
        <div className="w-11 h-11 rounded-2xl bg-yellow-500 flex items-center justify-center shadow-[0_0_25px_rgba(234,179,8,0.4)] relative overflow-hidden transition-all duration-500 hover:scale-105">
          <Coins className="w-6 h-6 text-zinc-950" />
        </div>
        <div>
          <h1 className="text-base font-extrabold tracking-tight text-white sm:text-lg">
            {userProfile?.full_name ? `Olá, ${userProfile.full_name.split(" ")[0]} 👋` : "Fintech Casal"}
          </h1>
          <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Nosso Painel de Sintonia</p>
        </div>
      </div>
      <div className="flex items-center gap-2.5 flex-wrap xs:flex-nowrap w-full xs:w-auto justify-between xs:justify-end">
        <Badge variant="outline" className="border-yellow-500/25 text-yellow-400 bg-yellow-950/15 px-3 py-1 text-xs font-bold shadow-[0_0_15px_rgba(234,179,8,0.05)]">
          {getReadableMonthLabel(selectedMonthStr)}
        </Badge>
        {!hasStrategy && (
          <Link href="/onboarding">
            <Badge className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 px-3 py-1 text-xs font-black border-none cursor-pointer flex items-center gap-1.5 transition-all duration-300 hover:shadow-[0_0_20px_rgba(234,179,8,0.3)] rounded-xl">
              <Sparkles className="w-3.5 h-3.5 text-zinc-950 fill-zinc-950" />
              Planejar Nosso Futuro
            </Badge>
          </Link>
        )}
        <div className="flex items-center gap-3 border-l border-white/10 pl-3">
          {userProfile?.avatar_url ? (
            <img 
              src={userProfile.avatar_url} 
              alt="Avatar do Usuário" 
              className="w-9 h-9 rounded-full border border-white/5 object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-xs font-bold text-zinc-400">
              {userProfile?.full_name ? userProfile.full_name.substring(0, 2).toUpperCase() : "MC"}
            </div>
          )}
          <button 
            onClick={handleLogout}
            className="p-2 rounded-xl bg-zinc-900/50 hover:bg-rose-500/10 border border-white/5 hover:border-rose-500/20 text-zinc-400 hover:text-rose-500 transition-colors group"
            title="Sair da Conta"
          >
            <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </header>
  );
}
