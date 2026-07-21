"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  AlertTriangle, 
  PieChart, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Coins,
  RefreshCw,
  Heart,
  Target,
  ListOrdered,
  Receipt,
  Wallet,
  Building
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getFinancialForecast, ForecastResult, ForecastMonthData, ForecastItemDetail } from "@/actions/forecast";
import { ForecastChart } from "@/components/dashboard/forecast-chart";
import { toast } from "sonner";

export default function ForecastPage() {
  const [loading, setLoading] = useState(true);
  const [forecastData, setForecastData] = useState<ForecastResult | null>(null);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(1);

  useEffect(() => {
    loadForecast();
  }, []);

  const loadForecast = async () => {
    setLoading(true);
    const res = await getFinancialForecast(12);
    if (res.success) {
      setForecastData(res);
    } else {
      toast.error("Erro ao gerar projeção financeira: " + (res.error || "Tente novamente"));
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 mb-4 animate-bounce">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-sm font-black uppercase tracking-widest text-zinc-300 animate-pulse">
          Projetando os Próximos 12 Meses...
        </h2>
        <p className="text-xs text-zinc-500 mt-1">Calculando vencimentos, resgates e evolução de patrimônio do casal</p>
      </div>
    );
  }

  const months = forecastData?.monthlyForecast || [];
  const currentSelectedMonth: ForecastMonthData | undefined = months[selectedMonthIndex - 1] || months[0];
  const stage = forecastData?.currentStage || "green";
  const milestones = forecastData?.milestones;

  // Estilização dinâmica por Estágio
  const stageConfig = {
    red: {
      badge: "🔴 FASE DE RESGATE",
      border: "border-rose-500/30",
      bg: "bg-rose-500/10",
      text: "text-rose-400",
      glow: "shadow-[0_0_30px_rgba(244,63,94,0.15)]",
      lazerPercent: "6%"
    },
    yellow: {
      badge: "🟡 FASE DE SEGURANÇA",
      border: "border-amber-500/30",
      bg: "bg-amber-500/10",
      text: "text-amber-300",
      glow: "shadow-[0_0_30px_rgba(245,158,11,0.15)]",
      lazerPercent: "12%"
    },
    green: {
      badge: "🟢 FASE DE PROSPERIDADE",
      border: "border-emerald-500/30",
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      glow: "shadow-[0_0_30px_rgba(16,185,129,0.15)]",
      lazerPercent: "12%"
    }
  }[currentSelectedMonth?.stage || stage];

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto bg-zinc-950 flex flex-col min-h-screen px-4 py-6 md:px-8 md:py-10 pb-24">
      
      {/* Header do Módulo de Previsão */}
      <header className="flex flex-col gap-4 xs:flex-row xs:justify-between xs:items-center mb-8 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 rounded-xl bg-zinc-900 border border-white/5 hover:border-yellow-500/20 text-zinc-400 hover:text-yellow-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-11 h-11 rounded-xl bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.15)]">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-white sm:text-xl">Previsão Futura do Casal</h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Simulação de 1 a 12 Meses</p>
          </div>
        </div>

        <Button
          onClick={loadForecast}
          className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/10 font-bold text-xs h-10 rounded-xl px-4 flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Recalcular Projeção
        </Button>
      </header>

      {/* REGRA DOS 5 SEGUNDOS: Card Central de Leitura Instantânea de Status */}
      {currentSelectedMonth && (
        <Card className={`w-full ${stageConfig.bg} ${stageConfig.border} ${stageConfig.glow} backdrop-blur-md rounded-2xl overflow-hidden mb-8 transition-all duration-300`}>
          <CardContent className="p-6 md:p-8 flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <Badge className={`${stageConfig.bg} ${stageConfig.border} ${stageConfig.text} font-black text-xs px-3 py-1 uppercase tracking-wider`}>
                {stageConfig.badge}
              </Badge>
              <span className="text-xs text-zinc-400 font-bold">
                Visão do Mês: <strong className="text-white">{currentSelectedMonth.monthLabel}</strong> (Mês {currentSelectedMonth.monthIndex} de 12)
              </span>
            </div>

            <h2 className="text-lg md:text-2xl font-black text-white tracking-tight leading-snug">
              "{currentSelectedMonth.headline}"
            </h2>

            <p className="text-xs md:text-sm text-zinc-300 leading-relaxed max-w-3xl">
              {currentSelectedMonth.analysisText}
            </p>

            {/* Marcos Históricos da Projeção (Milestones) */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-white/10 text-xs font-semibold">
              {milestones?.toxicDebtClearedMonth && (
                <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Quitação Total de Dívidas Tóxicas: <strong>{milestones.toxicDebtClearedMonth}</strong></span>
                </div>
              )}
              {milestones?.reserveTargetReachedMonth && (
                <div className="flex items-center gap-1.5 text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1.5 rounded-xl">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Meta de Reserva de Emergência: <strong>{milestones.reserveTargetReachedMonth}</strong></span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* GRÁFICO RECHART DE PROJEÇÃO DE 12 MESES */}
      <section className="space-y-4 mb-8">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-yellow-500" />
              Projeção de Patrimônio vs. Compromissos (12 Meses)
            </h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">Clique em qualquer ponto do gráfico para detalhar a estratégia e a lista de contas do mês</p>
          </div>

          {/* Seletor numérico direto dos meses */}
          <div className="flex items-center gap-1 overflow-x-auto max-w-full py-1">
            {months.map((m) => (
              <button
                key={m.monthIndex}
                onClick={() => setSelectedMonthIndex(m.monthIndex)}
                className={`px-2.5 h-7 rounded-lg text-[10px] font-black transition-all flex items-center justify-center whitespace-nowrap ${
                  selectedMonthIndex === m.monthIndex
                    ? "bg-yellow-500 text-zinc-950 shadow-[0_0_10px_rgba(234,179,8,0.4)] scale-105"
                    : "bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white"
                }`}
                title={m.monthLabel}
              >
                {m.monthShortLabel || `Mês ${m.monthIndex}`}
              </button>
            ))}
          </div>
        </div>

        <ForecastChart
          data={months}
          selectedMonthIndex={selectedMonthIndex}
          onSelectMonth={(idx) => setSelectedMonthIndex(idx)}
        />
      </section>

      {/* COLUNAS DE DISTRIBUIÇÃO DO ORÇAMENTO PARA O MÊS SELECIONADO */}
      {currentSelectedMonth && (
        <section className="space-y-4 mb-10">
          <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-yellow-500" />
            Distribuição Estratégica do Orçamento para {currentSelectedMonth.monthLabel}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* COLUNA 1: Essenciais e Estruturais */}
            <Card className="bg-zinc-900/40 border-white/5 shadow-xl backdrop-blur-md">
              <CardHeader className="p-5 pb-2">
                <span className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block">Manutenção Base</span>
                <CardTitle className="text-sm font-black text-white">Gastos Essenciais & Estruturais</CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0 space-y-3">
                <div className="flex justify-between items-center text-xs pt-2 border-t border-white/5">
                  <span className="text-zinc-400">Custo Essencial do Lar:</span>
                  <span className="font-extrabold text-white">
                    R$ {currentSelectedMonth.essentials.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400">Parcelas Estruturais:</span>
                  <span className="font-extrabold text-zinc-300">
                    R$ {currentSelectedMonth.structuralDebts.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400">Parcelas Tóxicas / Faturas:</span>
                  <span className={`font-extrabold ${currentSelectedMonth.toxicDebts > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                    R$ {currentSelectedMonth.toxicDebts.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* COLUNA 2: Trava de Lazer (Respiro Emocional do Casal) */}
            <Card className="bg-zinc-900/40 border-amber-500/20 shadow-xl backdrop-blur-md">
              <CardHeader className="p-5 pb-2">
                <span className="text-[9px] text-amber-400 uppercase font-black tracking-wider flex items-center gap-1 block">
                  <Heart className="w-3 h-3" /> Design Emocional do Casal
                </span>
                <CardTitle className="text-sm font-black text-white">Trava de Lazer ({currentSelectedMonth.lazerPercent}%)</CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0 space-y-3">
                <div className="text-2xl font-black text-amber-300">
                  R$ {currentSelectedMonth.lazerTravaValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  {currentSelectedMonth.stage === "red"
                    ? "Garantimos 6% da renda para o casal não desanimar durante a Fase de Resgate de dívidas."
                    : "Lazer expandido para 12% da renda familiar para ser desfrutado sem culpa pelo casal."
                  }
                </p>
              </CardContent>
            </Card>

            {/* COLUNA 3: Foco / Destinação do Saldo */}
            <Card className="bg-zinc-900/40 border-yellow-500/30 shadow-xl backdrop-blur-md relative overflow-hidden">
              <CardHeader className="p-5 pb-2">
                <span className="text-[9px] text-yellow-500 uppercase font-black tracking-wider block">Destinação do Saldo Restante</span>
                <CardTitle className="text-sm font-black text-white">Valor Foco Projetado</CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0 space-y-3">
                <div className="text-2xl font-black text-emerald-400">
                  R$ {currentSelectedMonth.focusValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed font-semibold">
                  {currentSelectedMonth.stage === "red"
                    ? "100% direcionado para abater e amortizar as dívidas tóxicas."
                    : currentSelectedMonth.stage === "yellow"
                    ? "100% direcionado para construir o Fundo de Reserva de Emergência."
                    : "Direcionado integralmente para investimentos e realizações de sonhos de longo prazo!"
                  }
                </p>
              </CardContent>
            </Card>

          </div>
        </section>
      )}

      {/* RELAÇÃO COMPLETA ITEM A ITEM PARA O MÊS SELECIONADO */}
      {currentSelectedMonth && (
        <section className="space-y-6 pt-4 border-t border-white/5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-base font-black uppercase tracking-wider text-white flex items-center gap-2">
                <ListOrdered className="w-5 h-5 text-yellow-500" />
                Relação Completa de Contas em {currentSelectedMonth.monthLabel}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Discriminação de todas as receitas e despesas com vencimento programado especificamente para este mês
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* TABELA 1: RECEITAS DA FAMÍLIA */}
            <Card className="bg-zinc-900/40 border-emerald-500/20 shadow-xl backdrop-blur-md">
              <CardHeader className="p-5 pb-3 border-b border-white/5">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-black text-emerald-400 flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Receitas da Família
                  </CardTitle>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-extrabold">
                    R$ {currentSelectedMonth.income.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {currentSelectedMonth.incomesList.length > 0 ? (
                  currentSelectedMonth.incomesList.map((inc) => (
                    <div key={inc.id} className="p-3 rounded-xl bg-zinc-950/60 border border-white/5 flex justify-between items-center">
                      <div>
                        <span className="text-xs font-bold text-white block">{inc.title}</span>
                        <span className="text-[10px] text-zinc-400 block">{inc.category}</span>
                      </div>
                      <span className="text-xs font-black text-emerald-400 font-mono">
                        +R$ {inc.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-500 py-4 text-center">Nenhuma receita cadastrada.</p>
                )}
              </CardContent>
            </Card>

            {/* TABELA 2: GASTOS ESSENCIAIS */}
            <Card className="bg-zinc-900/40 border-white/5 shadow-xl backdrop-blur-md">
              <CardHeader className="p-5 pb-3 border-b border-white/5">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-black text-zinc-200 flex items-center gap-2">
                    <Building className="w-4 h-4 text-zinc-400" />
                    Gastos Essenciais
                  </CardTitle>
                  <Badge className="bg-zinc-800 text-zinc-300 border-white/10 text-[10px] font-extrabold">
                    R$ {currentSelectedMonth.essentials.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {currentSelectedMonth.essentialsList.length > 0 ? (
                  currentSelectedMonth.essentialsList.map((exp) => (
                    <div key={exp.id} className="p-3 rounded-xl bg-zinc-950/60 border border-white/5 flex justify-between items-center">
                      <div>
                        <span className="text-xs font-bold text-white block">{exp.title}</span>
                        <span className="text-[10px] text-zinc-400 block">{exp.category}</span>
                        {exp.details && (
                          <span className="text-[9px] text-zinc-500 font-mono block mt-0.5">{exp.details}</span>
                        )}
                      </div>
                      <span className="text-xs font-black text-zinc-300 font-mono">
                        R$ {exp.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-500 py-4 text-center">Nenhuma despesa essencial cadastrada.</p>
                )}
              </CardContent>
            </Card>

            {/* TABELA 3: PARCELAS E FATURAS COM VENCIMENTO NO MÊS */}
            <Card className="bg-zinc-900/40 border-amber-500/20 shadow-xl backdrop-blur-md">
              <CardHeader className="p-5 pb-3 border-b border-white/5">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-black text-amber-300 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-amber-400" />
                    Parcelas & Faturas do Mês
                  </CardTitle>
                  <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/30 text-[10px] font-extrabold">
                    R$ {currentSelectedMonth.totalMonthlyCommitments.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {currentSelectedMonth.commitmentsList.length > 0 ? (
                  currentSelectedMonth.commitmentsList.map((com) => (
                    <div key={com.id} className="p-3 rounded-xl bg-zinc-950/60 border border-white/5 flex justify-between items-center">
                      <div>
                        <span className="text-xs font-bold text-white block">{com.title}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge className={`text-[8px] font-extrabold px-1.5 py-0 uppercase ${
                            com.type === "debt_structural" 
                              ? "bg-zinc-800 text-zinc-300 border-white/10" 
                              : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                          }`}>
                            {com.category}
                          </Badge>
                          {com.details && (
                            <span className="text-[10px] text-zinc-400 font-mono">{com.details}</span>
                          )}
                        </div>
                      </div>
                      <span className={`text-xs font-black font-mono ${
                        com.type === "debt_structural" ? "text-zinc-300" : "text-rose-400"
                      }`}>
                        R$ {com.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-500 py-4 text-center">Nenhum compromisso pendente para este mês.</p>
                )}
              </CardContent>
            </Card>

          </div>
        </section>
      )}

    </div>
  );
}
