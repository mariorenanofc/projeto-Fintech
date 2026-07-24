"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Search, CreditCard, ChevronDown, Check, Plus } from "lucide-react";

export interface BankOption {
  id: string;
  name: string;
  logo: string;
}

export const BANK_OPTIONS: BankOption[] = [
  { id: "nubank", name: "Nubank", logo: "/icons-bank/nubank.webp" },
  { id: "itau", name: "Itaú", logo: "/icons-bank/itau.webp" },
  { id: "bradesco", name: "Bradesco", logo: "/icons-bank/bradesco.webp" },
  { id: "santander", name: "Santander", logo: "/icons-bank/santander.webp" },
  { id: "inter", name: "Inter", logo: "/icons-bank/inter.webp" },
  { id: "c6bank", name: "C6 Bank", logo: "/icons-bank/c6bank.webp" },
  { id: "neon", name: "Neon", logo: "/icons-bank/neon.webp" },
  { id: "caixa", name: "Caixa", logo: "/icons-bank/caixa.webp" },
  { id: "bancopan", name: "Banco PAN", logo: "/icons-bank/bancopan.webp" },
  { id: "brasilcard", name: "BrasilCard", logo: "/icons-bank/brasilcard.webp" },
  { id: "bancodobrasil", name: "Banco do Brasil", logo: "/icons-bank/bancodobrasil.webp" },
  { id: "safra", name: "Safra", logo: "/icons-bank/safra.webp" },
  { id: "picpay", name: "PicPay", logo: "/icons-bank/picpay.webp" },
  { id: "mercadopago", name: "Mercado Pago", logo: "/icons-bank/mercadopago.webp" },
  { id: "next", name: "Next", logo: "/icons-bank/next.webp" },
  { id: "xp", name: "XP Investimentos", logo: "/icons-bank/xp.webp" },
  { id: "btgpactual", name: "BTG Pactual", logo: "/icons-bank/btgpactual.webp" },
  { id: "pagbank", name: "PagBank", logo: "/icons-bank/pagbank.webp" },
  { id: "portoseguro", name: "Porto Seguro", logo: "/icons-bank/portoseguro.webp" },
  { id: "bmg", name: "Banco BMG", logo: "/icons-bank/bmg.webp" },
  { id: "banrisul", name: "Banrisul", logo: "/icons-bank/banrisul.webp" },
  { id: "sicoob", name: "Sicoob", logo: "/icons-bank/sicoob.webp" },
  { id: "sicredi", name: "Sicredi", logo: "/icons-bank/sicredi.webp" },
  { id: "shopee", name: "Shopee (SParcelado)", logo: "/icons-bank/shopee.webp" },
  { id: "shein", name: "SHEIN", logo: "/icons-bank/shein.webp" },
  { id: "casasbahia", name: "Casas Bahia (Carnê)", logo: "/icons-bank/casasbahia.webp" },
  { id: "magalu", name: "Magalu (Carnê)", logo: "/icons-bank/magalu.webp" },
  { id: "mercadolivre", name: "Mercado Livre (Crédito)", logo: "/icons-bank/mercadolivre.webp" },
];

// Helper para obter o logo do banco a partir do nome
export const getBankLogoUrl = (bankName: string): string => {
  if (!bankName) return "";
  const name = bankName.toLowerCase().trim();
  
  const found = BANK_OPTIONS.find(
    (b) => 
      name.includes(b.id) || 
      b.name.toLowerCase().includes(name) ||
      name.includes(b.name.toLowerCase()) ||
      (b.id === "casasbahia" && (name.includes("casas") || name.includes("bahia") || name.includes("carne") || name.includes("carnê"))) ||
      (b.id === "mercadolivre" && (name.includes("mercado livre") || name.includes("meli") || name.includes("mercado credito") || name.includes("mercado crédito") || name.includes("mercadolivre"))) ||
      (b.id === "shopee" && (name.includes("shopee") || name.includes("sparcelado"))) ||
      (b.id === "shein" && name.includes("shein")) ||
      (b.id === "magalu" && (name.includes("magalu") || name.includes("magazine luiza") || name.includes("luiza")))
  );
  
  return found ? found.logo : "";
};

interface BankSelectProps {
  value: string;
  onChange: (val: string) => void;
  className?: string;
}

export function BankSelect({ value, onChange, className }: BankSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [customName, setCustomName] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Determinar o banco selecionado
  const selectedBank = BANK_OPTIONS.find(
    (b) => b.name.toLowerCase() === value.toLowerCase()
  );

  // Inicializar se for customizado
  useEffect(() => {
    if (value && !selectedBank) {
      setIsCustom(true);
      setCustomName(value);
    } else {
      setIsCustom(false);
    }
  }, [value, selectedBank]);

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredBanks = BANK_OPTIONS.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectBank = (bankName: string) => {
    setIsCustom(false);
    onChange(bankName);
    setOpen(false);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomName(val);
    onChange(val);
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={cn(
            "bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:outline-none p-3 w-full text-xs h-11 flex justify-between items-center text-left transition-all hover:bg-zinc-900/50",
            open && "border-yellow-500/50 ring-1 ring-yellow-500/50"
          )}
        >
          <div className="flex items-center gap-2.5">
            {selectedBank ? (
              <>
                <img
                  src={selectedBank.logo}
                  alt={selectedBank.name}
                  className="w-5 h-5 rounded-md object-contain bg-zinc-900"
                />
                <span className="font-extrabold text-white text-xs">{selectedBank.name}</span>
              </>
            ) : isCustom && customName ? (
              <>
                <div className="w-5 h-5 rounded-md bg-zinc-900 border border-white/10 flex items-center justify-center">
                  <CreditCard className="w-3 h-3 text-zinc-400" />
                </div>
                <span className="font-extrabold text-white text-xs">{customName}</span>
              </>
            ) : (
              <>
                <div className="w-5 h-5 rounded-md bg-zinc-900 border border-white/10 flex items-center justify-center">
                  <CreditCard className="w-3 h-3 text-zinc-500" />
                </div>
                <span className="text-zinc-550 font-bold text-xs">Selecione o emissor do cartão...</span>
              </>
            )}
          </div>
          <ChevronDown className={cn("w-4 h-4 text-zinc-500 transition-all", open && "rotate-180")} />
        </button>

        {isCustom && (
          <input
            type="text"
            placeholder="Digite o nome do banco personalizado..."
            value={customName}
            onChange={handleCustomChange}
            className="bg-zinc-950/80 border border-[#27272A] rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:outline-none p-3 w-full text-xs h-11 animate-in slide-in-from-top-1 duration-200"
            required
          />
        )}
      </div>

      {open && (
        <div className="absolute left-0 right-0 mt-2 bg-zinc-950/95 border border-white/10 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200 backdrop-blur-xl">
          {/* Busca */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar banco..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-zinc-900 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/30 focus:outline-none py-2 pl-9 pr-3 w-full text-xs h-9 font-bold"
              autoFocus
            />
          </div>

          {/* Lista de Bancos */}
          <div className="grid grid-cols-2 gap-1.5 max-h-[220px] overflow-y-auto pr-1" data-lenis-prevent="true">
            {filteredBanks.map((bank) => {
              const isSelected = value.toLowerCase() === bank.name.toLowerCase();
              return (
                <button
                  key={bank.id}
                  type="button"
                  onClick={() => handleSelectBank(bank.name)}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-xl text-left transition-all border border-transparent hover:bg-zinc-900/60",
                    isSelected ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400 font-extrabold" : "text-zinc-400 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={bank.logo}
                      alt={bank.name}
                      className="w-6 h-6 rounded-md object-contain bg-zinc-900 border border-white/5 flex-shrink-0"
                    />
                    <span className="text-[11px] font-bold truncate">{bank.name}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />}
                </button>
              );
            })}

            {filteredBanks.length === 0 && (
              <p className="text-[10px] text-zinc-550 col-span-2 text-center py-4 font-semibold">Nenhum banco encontrado.</p>
            )}
          </div>

          {/* Opção Personalizada */}
          <div className="border-t border-white/5 mt-2.5 pt-2.5">
            <button
              type="button"
              onClick={() => {
                setIsCustom(true);
                handleSelectBank("");
              }}
              className={cn(
                "w-full flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-black transition-all border border-dashed border-white/10 hover:border-yellow-500/30 hover:bg-yellow-500/5",
                isCustom ? "border-yellow-500/30 text-yellow-400 bg-yellow-500/5" : "text-zinc-400 hover:text-white"
              )}
            >
              <Plus className="w-3.5 h-3.5" />
              Outro Banco (Digitar Nome)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
