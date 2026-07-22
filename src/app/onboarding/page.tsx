"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Coins, 
  ArrowRight, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Sparkles, 
  ShieldAlert, 
  Info, 
  Check, 
  TrendingUp, 
  AlertTriangle,
  Lock,
  ChevronRight,
  HelpCircle,
  PiggyBank,
  Ban,
  Compass,
  CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AudioExplainerButton } from "@/components/ui/audio-explainer";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { 
  saveOnboardingData, 
  generateFinancialStrategy, 
  IncomeInput, 
  FixedExpenseInput, 
  CreditCardInput, 
  DebtInput, 
  FinancialStrategyResult 
} from "@/actions/onboarding";

// Helper para obter o mês formatado em PT-BR
function getMonthLabelPT(monthStr: string) {
  const [year, month] = monthStr.split("-").map(Number);
  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  return `${months[month - 1]} de ${year}`;
}

// Helper para calcular o cronograma de faturas
function generateCardSchedule(
  currentInvoice: number,
  isInvoiceClosed: boolean,
  closingDay: number,
  dueDay: number,
  futureInvoices: { month: string; amount: number; dueDay: number }[]
) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  const schedule: { month: string; date: string; amount: number }[] = [];

  let closingMonth = currentMonth;
  let closingYear = currentYear;

  if (currentDay >= closingDay || isInvoiceClosed) {
    closingMonth += 1;
    if (closingMonth > 12) {
      closingMonth = 1;
      closingYear += 1;
    }
  }

  let dueMonth = closingMonth + 1;
  let dueYear = closingYear;
  if (dueMonth > 12) {
    dueMonth = 1;
    dueYear += 1;
  }

  const currentInvoiceMonth = `${dueYear}-${String(dueMonth).padStart(2, '0')}`;
  const currentInvoiceDueDate = `${dueYear}-${String(dueMonth).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`;

  schedule.push({
    month: currentInvoiceMonth,
    date: currentInvoiceDueDate,
    amount: currentInvoice
  });

  let nextDueMonth = dueMonth;
  let nextDueYear = dueYear;

  futureInvoices.forEach((fut) => {
    nextDueMonth += 1;
    if (nextDueMonth > 12) {
      nextDueMonth = 1;
      nextDueYear += 1;
    }
    const mStr = `${nextDueYear}-${String(nextDueMonth).padStart(2, '0')}`;
    const dStr = `${nextDueYear}-${String(nextDueMonth).padStart(2, '0')}-${String(fut.dueDay || dueDay).padStart(2, '0')}`;
    schedule.push({
      month: mStr,
      date: dStr,
      amount: fut.amount
    });
  });

  return schedule;
}

// Helper para retornar a lista de meses futuros
function getFutureMonths(
  isInvoiceClosed: boolean,
  closingDay: number,
  dueDay: number,
  count: number
) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  let closingMonth = currentMonth;
  let closingYear = currentYear;

  if (currentDay >= closingDay || isInvoiceClosed) {
    closingMonth += 1;
    if (closingMonth > 12) {
      closingMonth = 1;
      closingYear += 1;
    }
  }

  let dueMonth = closingMonth + 1;
  let dueYear = closingYear;
  if (dueMonth > 12) {
    dueMonth = 1;
    dueYear += 1;
  }

  const list: { month: string; label: string }[] = [];
  let nextMonth = dueMonth;
  let nextYear = dueYear;

  for (let i = 0; i < count; i++) {
    nextMonth += 1;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    const mStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
    list.push({
      month: mStr,
      label: getMonthLabelPT(mStr)
    });
  }

  return list;
}

// Componente CustomSelect Premium com design dourado/amarelo
function CustomSelect({
  value,
  onChange,
  options,
  className
}: {
  value: string;
  onChange: (val: any) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((o) => o.value === value) || options[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:outline-none p-3 w-full text-xs h-11 flex justify-between items-center text-left transition-all",
          open && "border-yellow-500/50",
          className
        )}
      >
        <span className="font-semibold text-zinc-300">{selectedOption?.label}</span>
        <span className="text-[10px] text-zinc-500">▼</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 mt-2 bg-zinc-950/95 border border-white/10 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-200">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  "w-full text-left p-2.5 rounded-lg text-xs font-bold transition-all",
                  opt.value === value
                    ? "bg-yellow-500/10 text-yellow-400"
                    : "text-zinc-400 hover:bg-yellow-500 hover:text-zinc-950"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const getGridClass = (count: number, maxH = "max-h-[450px]") => {
  const base = `grid gap-4 ${maxH} overflow-y-auto pr-1`;
  if (count <= 1) return `${base} grid-cols-1`;
  if (count === 2) return `${base} grid-cols-1 md:grid-cols-2`;
  return `${base} grid-cols-1 md:grid-cols-2 lg:grid-cols-3`;
};

export default function OnboardingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // TAREFA 1.2: Estados iniciais limpos ou zerados, sem mock data de Parceiro A
  const [incomes, setIncomes] = useState<IncomeInput[]>([]);
  
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpenseInput[]>([
    { category: "Moradia & Contas", title: "Energia, Saneamento, Condomínio ou Aluguel", amount: 0, dueDay: 10 },
    { category: "Alimentação & Mercado", title: "Feira, Supermercado e Mantimentos", amount: 0, dueDay: 5 },
    { category: "Transporte & Mobilidade", title: "Combustível, Transporte Público ou Aplicativos", amount: 0, dueDay: 8 },
    { category: "Comunicação & Internet", title: "Internet Banda Larga e Planos de Celular", amount: 0, dueDay: 15 },
    { category: "Saúde & Cuidados", title: "Plano de Saúde, Farmácia ou Cuidados Pessoais", amount: 0, dueDay: 12 },
    { category: "Outros Essenciais", title: "Outros gastos obrigatórios de sobrevivência", amount: 0, dueDay: 20 }
  ]);

  const [creditCards, setCreditCards] = useState<any[]>([]);

  const [debts, setDebts] = useState<DebtInput[]>([]);

  // Estado para armazenar o resultado da estratégia
  const [strategyResult, setStrategyResult] = useState<FinancialStrategyResult | null>(null);

  // TAREFA 1.1: Local Storage Sync (Obrigatório) - Recuperar dados ao montar a página
  useEffect(() => {
    setMounted(true);
    
    try {
      const savedStep = window.localStorage.getItem("fintech_onboarding_step");
      const savedIncomes = window.localStorage.getItem("fintech_onboarding_incomes");
      const savedExpenses = window.localStorage.getItem("fintech_onboarding_expenses");
      const savedCards = window.localStorage.getItem("fintech_onboarding_cards");
      const savedDebts = window.localStorage.getItem("fintech_onboarding_debts");

      if (savedStep) setStep(Number(savedStep));
      if (savedIncomes) setIncomes(JSON.parse(savedIncomes));
      if (savedExpenses) setFixedExpenses(JSON.parse(savedExpenses));
      if (savedCards) setCreditCards(JSON.parse(savedCards));
      if (savedDebts) setDebts(JSON.parse(savedDebts));
    } catch (error) {
      console.error("Erro ao recuperar cache de onboarding:", error);
    }
  }, []);

  // TAREFA 1.1: Local Storage Sync (Obrigatório) - Salvar dados a cada alteração
  useEffect(() => {
    if (!mounted) return;
    window.localStorage.setItem("fintech_onboarding_step", String(step));
  }, [step, mounted]);

  useEffect(() => {
    if (!mounted) return;
    window.localStorage.setItem("fintech_onboarding_incomes", JSON.stringify(incomes));
  }, [incomes, mounted]);

  useEffect(() => {
    if (!mounted) return;
    window.localStorage.setItem("fintech_onboarding_expenses", JSON.stringify(fixedExpenses));
  }, [fixedExpenses, mounted]);

  useEffect(() => {
    if (!mounted) return;
    window.localStorage.setItem("fintech_onboarding_cards", JSON.stringify(creditCards));
  }, [creditCards, mounted]);

  useEffect(() => {
    if (!mounted) return;
    window.localStorage.setItem("fintech_onboarding_debts", JSON.stringify(debts));
  }, [debts, mounted]);

  if (!mounted) {
    return (
      <div className="flex-1 w-full max-w-md mx-auto bg-zinc-950 flex flex-col items-center justify-center min-h-screen px-4">
        <span className="text-xs text-zinc-550 uppercase tracking-widest font-black animate-pulse">
          Carregando Setup...
        </span>
      </div>
    );
  }

  // --- Handlers para Receitas ---
  const handleAddIncome = () => {
    setIncomes([...incomes, { title: "", amount: 0, owner: "Parceiro A" }]);
  };

  const handleRemoveIncome = (index: number) => {
    setIncomes(incomes.filter((_, i) => i !== index));
  };

  const handleIncomeChange = (index: number, field: keyof IncomeInput, value: any) => {
    const updated = [...incomes];
    updated[index] = { ...updated[index], [field]: value };
    setIncomes(updated);
  };

  // --- Handlers para Despesas Fixas ---
  const handleFixedExpenseChange = (index: number, amount: number) => {
    const updated = [...fixedExpenses];
    updated[index].amount = amount;
    setFixedExpenses(updated);
  };

  const handleAddCustomExpense = () => {
    setFixedExpenses([...fixedExpenses, { category: "Customizada", title: "", amount: 0, dueDay: 15 }]);
  };

  const handleRemoveCustomExpense = (index: number) => {
    setFixedExpenses(fixedExpenses.filter((_, i) => i !== index));
  };

  const handleCustomExpenseChange = (index: number, field: "title" | "amount" | "dueDay", value: any) => {
    const updated = [...fixedExpenses];
    updated[index] = { ...updated[index], [field]: value };
    setFixedExpenses(updated);
  };

  // --- Handlers para Cartões ---
  const handleAddCard = () => {
    setCreditCards([...creditCards, { name: "", totalLimit: 0, currentInvoice: 0, nextInvoice: 0 }]);
  };

  const handleRemoveCard = (index: number) => {
    setCreditCards(creditCards.filter((_, i) => i !== index));
  };

  const handleCardChange = (index: number, field: string, value: any) => {
    const updated = [...creditCards];
    updated[index] = { ...updated[index], [field]: value };
    setCreditCards(updated);
  };

  // --- Handlers para Dívidas ---
  const handleAddDebt = () => {
    setDebts([...debts, { 
      title: "", 
      acquisitionValue: 0, 
      totalInstallments: 12, 
      currentInstallmentValue: 0, 
      monthlyLateInterestRate: 0, 
      penaltyValue: 0, 
      installmentsPaid: 0,
      tipoDivida: "toxica"
    }]);
  };

  const handleRemoveDebt = (index: number) => {
    setDebts(debts.filter((_, i) => i !== index));
  };

  const handleDebtChange = (index: number, field: keyof DebtInput, value: any) => {
    const updated = [...debts];
    updated[index] = { ...updated[index], [field]: value };
    setDebts(updated);
  };

  // --- Envio Final ---
  const handleSubmit = async () => {
    // Validação de Limites de Cartão ultrapassados
    const exceededCard = creditCards.find(c => {
      if (!c.totalLimit) return false;
      const futureSum = (c.futureInvoices || []).reduce((acc: number, f: any) => acc + Number(f.amount || 0), 0);
      return (Number(c.currentInvoice || 0) + futureSum) > Number(c.totalLimit);
    });

    if (exceededCard) {
      toast.error(`O cartão ${exceededCard.name} está com limite estourado devido a faturas futuras. Por favor ajuste antes de submeter!`);
      return;
    }

    setLoading(true);
    try {
      const formattedCreditCards = creditCards
        .filter(c => c.name !== "" && c.totalLimit > 0)
        .map(c => {
          const schedule = generateCardSchedule(
            c.currentInvoice || 0,
            !!c.isInvoiceClosed,
            c.closingDay || 5,
            c.dueDay || 15,
            c.futureInvoices || []
          );
          const nextInvoiceVal = c.futureInvoices && c.futureInvoices[0] ? Number(c.futureInvoices[0].amount) : 0;
          return {
            name: c.name,
            totalLimit: c.totalLimit,
            currentInvoice: c.currentInvoice,
            nextInvoice: nextInvoiceVal,
            closingDay: c.closingDay || 5,
            dueDay: c.dueDay || 15,
            invoicesSchedule: schedule
          };
        });

      // 1. Salvar os dados consolidados do Wizard via Server Action
      const saveRes = await saveOnboardingData({
        incomes: incomes.filter(i => i.title !== "" && i.amount > 0),
        fixedExpenses: fixedExpenses.filter(e => e.title !== "" && e.amount > 0),
        creditCards: formattedCreditCards,
        debts: debts.filter(d => d.title !== "" && d.currentInstallmentValue > 0)
      });

      if (!saveRes.success) {
        toast.error("Erro ao salvar dados: " + saveRes.error);
        setLoading(false);
        return;
      }

      // 2. Gerar a estratégia de choque financeiro
      const strategy = await generateFinancialStrategy();
      
      // Limpa os dados salvos no local storage após o sucesso do cadastro
      window.localStorage.removeItem("fintech_onboarding_step");
      window.localStorage.removeItem("fintech_onboarding_incomes");
      window.localStorage.removeItem("fintech_onboarding_expenses");
      window.localStorage.removeItem("fintech_onboarding_cards");
      window.localStorage.removeItem("fintech_onboarding_debts");

      setStrategyResult(strategy);
      setStep(5); // Avança para a etapa de resultados
    } catch (e: any) {
      toast.error("Ocorreu um erro no processamento: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  // Renderização da tela de resultados da estratégia
  if (step === 5 && strategyResult) {
    const {
      totalIncome,
      totalEssentialExpenses,
      disposableIncomeForDebts,
      totalDebtInstallments,
      remainingCashResidue,
      totalCreditCardInvoices,
      isChoqueRequired,
      cardActions,
      debtActions,
      survivalRules
    } = strategyResult;

    return (
      <div className="flex-1 w-full max-w-md mx-auto bg-zinc-950 flex flex-col min-h-screen px-4 py-6 sm:max-w-xl sm:px-6 md:max-w-2xl lg:max-w-4xl lg:px-8 lg:py-10">
        
        {/* Header de Resultados */}
        <header className="flex justify-between items-center mb-8 pb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-yellow-500 flex items-center justify-center shadow-lg shadow-yellow-500/20 relative overflow-hidden">
              <Sparkles className="w-5 h-5 text-zinc-950" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-white sm:text-lg">Diagnóstico de Choque</h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Motor de Estratégia Financeira</p>
            </div>
          </div>
          <Badge className={`${isChoqueRequired ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'} px-2.5 py-1 text-xs border`}>
            {isChoqueRequired ? "STATUS: ALERTA CRÍTICO" : "STATUS: CRONOGRAMA SAUDÁVEL"}
          </Badge>
        </header>

        {/* Lógica Visual de Alertas */}
        <div className="space-y-6">
          
          {/* Card Resumo do Caixa com termos matemáticos exatos */}
          <Card className="bg-zinc-900/40 border-white/5 shadow-xl backdrop-blur-md overflow-hidden">
            <CardHeader className="p-6 pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">Resumo do Diagnóstico de Caixa</CardTitle>
              <CardDescription className="text-[10px] text-zinc-500 mt-0.5">Visão consolidada do fluxo de caixa mensal do casal</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              
              {/* Indicadores numéricos baseados na regra real */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-950/40 p-3.5 rounded-xl border border-white/5 flex flex-col col-span-2">
                  <span className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold">Passo A: Diagnóstico Frio</span>
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex flex-col">
                      <span className="text-[8px] text-zinc-500 uppercase font-semibold">Receitas</span>
                      <span className="text-xs font-black text-emerald-400">R$ {totalIncome.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] text-zinc-500 uppercase font-semibold">Custo Essencial</span>
                      <span className="text-xs font-black text-zinc-200">R$ {totalEssentialExpenses.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] text-zinc-500 uppercase font-semibold">Saldo Restante</span>
                      <span className={`text-xs font-black ${disposableIncomeForDebts >= 0 ? 'text-yellow-400' : 'text-rose-500'}`}>R$ {disposableIncomeForDebts.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-950/40 p-3.5 rounded-xl border border-white/5 flex flex-col">
                  <span className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold">Parcelas Obrigatórias</span>
                  <span className="text-base font-black text-zinc-200 mt-0.5">R$ {totalDebtInstallments.toFixed(2)}</span>
                </div>
                <div className="bg-zinc-950/40 p-3.5 rounded-xl border border-white/5 flex flex-col">
                  <span className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold">Resíduo de Caixa Restante</span>
                  <span className={`text-base font-black mt-0.5 ${remainingCashResidue > 0 ? 'text-yellow-400' : 'text-rose-500'}`}>
                    R$ {remainingCashResidue.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Status do Semáforo sugerido */}
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                isChoqueRequired 
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' 
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              }`}>
                {isChoqueRequired ? <ShieldAlert className="w-5 h-5 mt-0.5 flex-shrink-0 text-rose-400" /> : <Check className="w-5 h-5 mt-0.5 flex-shrink-0 text-emerald-400" />}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wide">
                    {isChoqueRequired ? "Diagnóstico: Operação de Choque Ativada!" : "Diagnóstico: Fluxo Equilibrado"}
                  </h4>
                  <p className="text-[10px] leading-relaxed mt-1 opacity-80">
                    {isChoqueRequired 
                      ? "A soma das faturas dos cartões de crédito supera o seu Resíduo de Caixa Restante. Vocês estão entrando em juros rotativos. O motor de choque gerou recomendações imediatas abaixo."
                      : "Parabéns! O caixa do casal é suficiente para quitar as faturas integrais dos cartões e pagar as parcelas sem contrair juros compostos por atraso."
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção das Ações Práticas dos Cartões */}
          {cardActions.length > 0 && (
            <Card className="bg-zinc-900/40 border-white/5 shadow-xl backdrop-blur-md overflow-hidden">
              <CardHeader className="p-6 pb-3">
                <div className="flex items-center gap-1.5 text-yellow-400 font-bold text-xs uppercase tracking-wider">
                  <Ban className="w-4 h-4 text-yellow-400" />
                  <span>Ações Táticas para Cartões de Crédito</span>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-4">
                {cardActions.map((action, idx) => (
                  <div key={idx} className="bg-zinc-950/60 p-4 rounded-xl border border-white/5 space-y-3">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-xs font-black text-zinc-100">{action.cardName}</span>
                      <div className="text-right flex gap-3">
                        <div>
                          <span className="text-[9px] text-zinc-550 block">Fatura Atual:</span>
                          <span className="text-xs font-black text-rose-400">R$ {action.currentInvoice.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-zinc-550 block">Fatura Próx. Mês:</span>
                          <span className="text-xs font-black text-zinc-300">R$ {action.nextInvoice.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">
                      {action.recommendation}
                    </p>
                    {isChoqueRequired && (
                      <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg flex justify-between items-center">
                        <span className="text-[10px] text-yellow-400 font-bold">Entrada proporcional sugerida:</span>
                        <span className="text-xs font-black text-yellow-400">R$ {action.suggestedProportionalPayment.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Seção de Negociação de Parcelas e Dívidas */}
          {debtActions.length > 0 && (
            <Card className="bg-zinc-900/40 border-white/5 shadow-xl backdrop-blur-md overflow-hidden">
              <CardHeader className="p-6 pb-3">
                <div className="flex items-center gap-1.5 text-yellow-400 font-bold text-xs uppercase tracking-wider">
                  <TrendingUp className="w-4 h-4 text-yellow-400" />
                  <span>Estratégia de Dívidas e Consórcios</span>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-4">
                {debtActions.map((action, idx) => (
                  <div key={idx} className="bg-zinc-950/60 p-4 rounded-xl border border-white/5 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-zinc-100">{action.debtTitle}</span>
                      <span className="text-xs font-black text-yellow-400">Parcela: R$ {action.installmentValue.toFixed(2)}</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">
                      {action.recommendation}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Regras de Sobrevivência do Mês */}
          <Card className="bg-zinc-900/40 border-white/5 shadow-xl backdrop-blur-md overflow-hidden">
            <CardHeader className="p-6 pb-3">
              <div className="flex items-center gap-1.5 text-yellow-400 font-bold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-yellow-400 animate-pulse" />
                <span>Regras de Sobrevivência do Mês</span>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-3">
              {survivalRules.map((rule, idx) => (
                <div key={idx} className="bg-zinc-950/40 p-3.5 rounded-xl border border-white/5 flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 flex-shrink-0 text-xs font-black">
                    {idx + 1}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-zinc-200">{rule.title}</h5>
                    <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">{rule.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Botão de redirecionamento para o dashboard */}
          <div className="flex justify-center pt-4">
            <Button
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-500 text-zinc-950 font-black shadow-lg shadow-yellow-500/10 h-11 rounded-xl text-xs border-none"
              onClick={() => router.push("/dashboard")}
            >
              Ir para o Painel do Casal
              <ArrowRight className="w-4 h-4 ml-1.5 text-zinc-950" />
            </Button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none px-4 sm:px-8 md:px-12 space-y-8 py-10 flex flex-col min-h-screen justify-center">
      
      {/* Header do Wizard */}
      <section className="text-center py-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-bold mb-4"
        >
          <Compass className="w-4 h-4" /> CONFIGURAÇÃO DO ONBOARDING
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl sm:text-5xl font-black text-white tracking-tight"
        >
          Diagnóstico do Casal <br />
          <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
            Passo {step} de 4
          </span>
        </motion.h1>
      </section>

      {/* Stepper Visual */}
      <div className="flex items-center justify-between max-w-xl mx-auto relative px-4 w-full">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-zinc-800 -translate-y-1/2 z-0" />
        <div 
          className="absolute top-1/2 left-0 h-0.5 bg-yellow-500 -translate-y-1/2 z-0 transition-all duration-500"
          style={{ width: `${((step - 1) / 3) * 100}%` }}
        />

        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
              s === step
                ? "bg-yellow-500 text-zinc-950 shadow-[0_0_15px_rgba(234,179,8,0.4)] scale-110"
                : s < step
                ? "bg-zinc-900 border border-yellow-500/50 text-yellow-400"
                : "bg-zinc-950 border border-zinc-800 text-zinc-600"
            }`}
          >
            {s < step ? <CheckCircle2 className="w-5 h-5 text-yellow-500" /> : s}
          </div>
        ))}
      </div>

      {/* Master Card */}
      <Card className="bg-zinc-900/40 border-white/5 shadow-xl backdrop-blur-md p-2 sm:p-4">
        <AnimatePresence mode="wait">
          {/* =====================================================================
              PASSO 1: RECEITAS
              ===================================================================== */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <CardHeader className="p-6 pb-3">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <CardTitle className="text-base font-black text-white">1. Receitas do Casal</CardTitle>
                    <CardDescription className="text-[10px] text-zinc-500 mt-0.5">Cadastrem os salários ou ganhos mensais recorrentes de vocês</CardDescription>
                  </div>
                  <AudioExplainerButton 
                    text="Aqui você deve considerar todo o dinheiro que você e a outra pessoa parceira sua ganham. Vocês podem adicionar as receitas separadas por cada um de vocês, como também podem juntar os valores e lançar em conjunto de forma compartilhada." 
                  />
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-4">
                <div className={getGridClass(incomes.length)} data-lenis-prevent>
                  {incomes.map((item, index) => (
                    <div key={index} className="bg-zinc-950/40 p-4 rounded-xl border border-white/5 space-y-3 relative">
                      <button
                        onClick={() => handleRemoveIncome(index)}
                        className="absolute top-4 right-4 text-zinc-650 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block mb-1">Título da Receita</label>
                          <input
                            type="text"
                            placeholder="Ex: Salário Principal, Freelance"
                            value={item.title}
                            onChange={(e) => handleIncomeChange(index, "title", e.target.value)}
                            className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-3 w-full text-xs"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block mb-1">Valor Mensal (R$)</label>
                            <input
                              type="number"
                              placeholder="0,00"
                              value={item.amount || ""}
                              onChange={(e) => handleIncomeChange(index, "amount", Number(e.target.value))}
                              className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-3 w-full text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block mb-1">Dia Recebimento</label>
                            <input
                              type="number"
                              min="1"
                              max="31"
                              placeholder="05"
                              value={item.receiptDay || 5}
                              onChange={(e) => handleIncomeChange(index, "receiptDay", Math.max(1, Math.min(31, Number(e.target.value))))}
                              className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-3 w-full text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block mb-1">Responsável</label>
                            <CustomSelect
                              value={item.owner}
                              onChange={(val) => handleIncomeChange(index, "owner", val)}
                              options={[
                                { value: "Parceiro A", label: "Parceiro A" },
                                { value: "Parceiro B", label: "Parceiro B" },
                                { value: "Compartilhado", label: "Compartilhado" }
                              ]}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {incomes.length === 0 && (
                    <div className="text-center py-6 border border-dashed border-white/5 rounded-xl bg-zinc-950/20 col-span-full">
                      <Info className="w-5 h-5 text-zinc-600 mx-auto mb-1.5" />
                      <p className="text-[11px] text-zinc-500">Nenhuma receita adicionada ainda. Adicione abaixo.</p>
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  onClick={handleAddIncome}
                  className="w-full border-dashed border-white/10 hover:border-yellow-500/30 hover:bg-yellow-500/5 text-zinc-400 font-bold h-11 rounded-xl text-xs mt-2"
                >
                  <Plus className="w-4 h-4 mr-1.5 text-yellow-550" />
                  Adicionar Receita
                </Button>
              </CardContent>
            </motion.div>
          )}

          {/* =====================================================================
              PASSO 2: DESPESAS ESSENCIAIS
              ===================================================================== */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <CardHeader className="p-6 pb-3">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <CardTitle className="text-base font-black text-white">2. Custo de Vida Essencial</CardTitle>
                    <CardDescription className="text-[10px] text-zinc-500 mt-0.5">Cadastrem os custos fixos obrigatórios de sobrevivência do lar</CardDescription>
                  </div>
                  <AudioExplainerButton 
                    text="Aqui você vai considerar todas as contas consideradas essenciais que você deve pagar todos os meses de forma recorrente, como por exemplo água, luz, internet, plano telefônico, feira, combustível e aluguel." 
                  />
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-4">
                <div className={getGridClass(fixedExpenses.length)} data-lenis-prevent>
                  {fixedExpenses.map((item, index) => (
                    <div key={index} className="bg-zinc-950/40 p-4 rounded-xl border border-white/5 space-y-3 relative">
                      {item.category === "Customizada" && (
                        <button
                          onClick={() => handleRemoveCustomExpense(index)}
                          className="absolute top-4 right-4 text-zinc-650 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block mb-1">Categoria</label>
                          <span className="bg-zinc-900 border border-white/5 px-3 py-2.5 rounded-xl text-yellow-500 text-xs block font-bold">
                            {item.category}
                          </span>
                        </div>
                        
                        {item.category === "Customizada" ? (
                          <div>
                            <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block mb-1">Título do Gasto</label>
                            <input
                              type="text"
                              placeholder="Ex: Condomínio, IPTU"
                              value={item.title}
                              onChange={(e) => handleCustomExpenseChange(index, "title", e.target.value)}
                              className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-3 w-full text-xs"
                            />
                          </div>
                        ) : (
                          <div>
                            <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block mb-1">Identificador</label>
                            <span className="bg-zinc-900/50 border border-white/5 px-3 py-2.5 rounded-xl text-zinc-400 text-xs block font-semibold">
                              {item.title}
                            </span>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 sm:col-span-2">
                          <div>
                            <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block mb-1">Valor Mensal (R$)</label>
                            <input
                              type="number"
                              placeholder="0,00"
                              value={item.amount || ""}
                              onChange={(e) => {
                                if (item.category === "Customizada") {
                                  handleCustomExpenseChange(index, "amount", Number(e.target.value));
                                } else {
                                  handleFixedExpenseChange(index, Number(e.target.value));
                                }
                              }}
                              className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:outline-none p-3 w-full text-xs h-11"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block mb-1">Dia do Vencimento</label>
                            <input
                              type="number"
                              min="1"
                              max="31"
                              placeholder="15"
                              value={item.dueDay || 15}
                              onChange={(e) => {
                                const val = Math.max(1, Math.min(31, Number(e.target.value)));
                                if (item.category === "Customizada") {
                                  handleCustomExpenseChange(index, "dueDay", val);
                                } else {
                                  const updated = [...fixedExpenses];
                                  updated[index].dueDay = val;
                                  setFixedExpenses(updated);
                                }
                              }}
                              className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:outline-none p-3 w-full text-xs h-11"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  variant="outline"
                  onClick={handleAddCustomExpense}
                  className="w-full border-dashed border-white/10 hover:border-yellow-500/30 hover:bg-yellow-500/5 text-zinc-400 font-bold h-11 rounded-xl text-xs mt-2"
                >
                  <Plus className="w-4 h-4 mr-1.5 text-yellow-550" />
                  Adicionar Despesa Customizada
                </Button>
              </CardContent>
            </motion.div>
          )}

          {/* =====================================================================
              PASSO 3: CARTÕES DE CRÉDITO
              ===================================================================== */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <CardHeader className="p-6 pb-3">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <CardTitle className="text-base font-black text-white">3. Cartões de Crédito</CardTitle>
                    <CardDescription className="text-[10px] text-zinc-550 mt-0.5">Cadastrem os cartões ativos de vocês. Serão usados para controle e pagamentos</CardDescription>
                  </div>
                  <AudioExplainerButton 
                    text="Aqui nessa categoria de cartões você vai cadastrar todos os cartões de crédito que você e seu parceiro ou parceira têm." 
                  />
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-4">
                <div className={getGridClass(creditCards.length, "max-h-[500px]")} data-lenis-prevent>
                  {creditCards.map((item, index) => (
                    <div key={index} className="bg-zinc-950/40 p-4 rounded-xl border border-white/5 space-y-3 relative">
                      <button
                        onClick={() => handleRemoveCard(index)}
                        className="absolute top-4 right-4 text-zinc-650 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block mb-1">Instituição / Banco do Cartão</label>
                          <input
                            type="text"
                            placeholder="Ex: Nubank, Itaú, Inter"
                            value={item.name}
                            onChange={(e) => handleCardChange(index, "name", e.target.value)}
                            className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-3 w-full text-xs"
                          />
                        </div>
                        
                        {/* Inputs de Valores */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block mb-1">Limite Total (R$)</label>
                            <input
                              type="number"
                              placeholder="0,00"
                              value={item.totalLimit || ""}
                              onChange={(e) => handleCardChange(index, "totalLimit", Number(e.target.value))}
                              className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-3 w-full text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block mb-1">Fatura Atual (R$)</label>
                            <input
                              type="number"
                              placeholder="0,00"
                              value={item.currentInvoice || ""}
                              onChange={(e) => handleCardChange(index, "currentInvoice", Number(e.target.value))}
                              className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-3 w-full text-xs"
                            />
                          </div>
                        </div>

                        {/* Checkboxes de Fechamento e Futuras */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <label className="flex items-center gap-2 bg-zinc-950/40 border border-white/5 px-3 py-2.5 rounded-xl cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={!!item.isInvoiceClosed}
                              onChange={(e) => handleCardChange(index, "isInvoiceClosed", e.target.checked)}
                              className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-yellow-555 focus:ring-0 focus:ring-offset-0 accent-yellow-500"
                            />
                            <span className="text-[10px] text-zinc-300 font-bold uppercase tracking-wider">Fatura já fechou?</span>
                          </label>

                          <label className="flex items-center gap-2 bg-zinc-950/40 border border-white/5 px-3 py-2.5 rounded-xl cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={!!item.hasFutureInvoices}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                const count = checked ? 1 : 0;
                                const updated = [...creditCards];
                                updated[index] = {
                                  ...updated[index],
                                  hasFutureInvoices: checked,
                                  futureInvoicesCount: count,
                                  futureInvoices: checked 
                                    ? getFutureMonths(!!updated[index].isInvoiceClosed, updated[index].closingDay || 5, updated[index].dueDay || 15, count).map(m => ({ month: m.month, amount: 0, dueDay: updated[index].dueDay || 15 })) 
                                    : []
                                };
                                setCreditCards(updated);
                              }}
                              className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-yellow-555 focus:ring-0 focus:ring-offset-0 accent-yellow-500"
                            />
                            <span className="text-[10px] text-zinc-300 font-bold uppercase tracking-wider">Faturas futuras?</span>
                          </label>
                        </div>

                        {/* Inputs Dinâmicos de Faturas Futuras */}
                        {item.hasFutureInvoices && (
                          <div className="space-y-3 bg-zinc-950/60 p-3 rounded-xl border border-white/5 mt-1">
                            <div>
                              <label className="text-[9px] text-zinc-400 uppercase tracking-wider font-extrabold block mb-1">
                                Quantidade de faturas futuras (meses a parcelar):
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="12"
                                value={item.futureInvoicesCount || 1}
                                onChange={(e) => {
                                  const count = Math.max(1, Math.min(12, Number(e.target.value)));
                                  const updated = [...creditCards];
                                  const card = updated[index];
                                  const list = getFutureMonths(!!card.isInvoiceClosed, card.closingDay || 5, card.dueDay || 15, count);
                                  const prevFuture = card.futureInvoices || [];
                                  card.futureInvoices = list.map((item, idx) => {
                                    const existing = prevFuture[idx];
                                    return {
                                      month: item.month,
                                      amount: existing ? existing.amount : 0,
                                      dueDay: existing ? existing.dueDay : (card.dueDay || 15)
                                    };
                                  });
                                  card.futureInvoicesCount = count;
                                  setCreditCards(updated);
                                }}
                                className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-2.5 w-full text-xs font-bold"
                              />
                            </div>

                            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1" data-lenis-prevent="true">
                              {(item.futureInvoices || []).map((fut: any, fIdx: number) => (
                                <div key={fIdx} className="bg-zinc-900/30 p-2 rounded-lg border border-white/5 space-y-2">
                                  <span className="text-[9px] font-black text-yellow-400 uppercase tracking-wider">
                                    {getMonthLabelPT(fut.month)}
                                  </span>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="text-[8px] text-zinc-500 uppercase tracking-wider font-bold block mb-1">Valor (R$)</label>
                                      <input
                                        type="number"
                                        placeholder="0,00"
                                        value={fut.amount || ""}
                                        onChange={(e) => {
                                          const updated = [...creditCards];
                                          const futureInvoicesCopy = [...(updated[index].futureInvoices || [])];
                                          futureInvoicesCopy[fIdx] = {
                                            ...futureInvoicesCopy[fIdx],
                                            amount: Number(e.target.value)
                                          };
                                          updated[index] = {
                                            ...updated[index],
                                            futureInvoices: futureInvoicesCopy
                                          };
                                          setCreditCards(updated);
                                        }}
                                        className="bg-zinc-950/80 border border-white/5 rounded-lg text-zinc-200 focus:border-yellow-500/50 focus:outline-none p-1.5 w-full text-xs font-semibold"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[8px] text-zinc-500 uppercase tracking-wider font-bold block mb-1">Dia do Vencimento</label>
                                      <input
                                        type="number"
                                        min="1"
                                        max="31"
                                        placeholder="15"
                                        value={fut.dueDay || item.dueDay || 15}
                                        onChange={(e) => {
                                          const val = Math.max(1, Math.min(31, Number(e.target.value)));
                                          const updated = [...creditCards];
                                          const futureInvoicesCopy = [...(updated[index].futureInvoices || [])];
                                          futureInvoicesCopy[fIdx] = {
                                            ...futureInvoicesCopy[fIdx],
                                            dueDay: val
                                          };
                                          updated[index] = {
                                            ...updated[index],
                                            futureInvoices: futureInvoicesCopy
                                          };
                                          setCreditCards(updated);
                                        }}
                                        className="bg-zinc-950/80 border border-white/5 rounded-lg text-zinc-200 focus:border-yellow-500/50 focus:outline-none p-1.5 w-full text-xs font-semibold"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Barra de Limite Visual do Cartão */}
                        {(() => {
                          const totalLimit = item.totalLimit || 0;
                          const currentInvoice = item.currentInvoice || 0;
                          const futureSum = (item.futureInvoices || []).reduce((acc: number, f: any) => acc + Number(f.amount || 0), 0);
                          const totalAccumulatedInvoice = currentInvoice + futureSum;
                          const availableLimit = totalLimit - totalAccumulatedInvoice;
                          const isLimitExceeded = totalAccumulatedInvoice > totalLimit;
                          const limitPercentage = totalLimit > 0 ? Math.min(100, (totalAccumulatedInvoice / totalLimit) * 100) : 0;

                          return (
                            <div className="mt-2 space-y-2 bg-zinc-950/20 p-3 rounded-xl border border-white/5">
                              <div className="flex justify-between items-center text-[10px] text-zinc-400 font-bold">
                                <span className="uppercase tracking-wider">Fluxo de Limite de Crédito:</span>
                                <span className={isLimitExceeded ? "text-rose-500 font-black animate-pulse" : "text-zinc-300 font-bold"}>
                                  {totalAccumulatedInvoice.toFixed(2)} / {totalLimit.toFixed(2)} R$
                                </span>
                              </div>

                              {totalLimit > 0 && (
                                <div className="space-y-1">
                                  <div className="w-full bg-zinc-950 border border-white/5 h-2.5 rounded-full overflow-hidden">
                                    <div 
                                      className={cn("h-full transition-all duration-300 rounded-full", isLimitExceeded ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)] animate-pulse" : "bg-yellow-500")}
                                      style={{ width: `${limitPercentage}%` }}
                                    />
                                  </div>
                                  <div className="flex justify-between items-center text-[9px] font-bold text-zinc-550">
                                    <span>Limite Disponível: <strong className={availableLimit >= 0 ? "text-emerald-400" : "text-rose-500"}>R$ {availableLimit.toFixed(2)}</strong></span>
                                    <span>{limitPercentage.toFixed(0)}% Utilizado</span>
                                  </div>
                                </div>
                              )}

                              {isLimitExceeded && (
                                <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl flex items-start gap-2 text-rose-400">
                                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                  <div className="text-[10px] leading-relaxed font-bold">
                                    Atenção: A soma das faturas planejadas (R$ {totalAccumulatedInvoice.toFixed(2)}) ultrapassa o limite total do cartão! O limite disponível ficará negativo em R$ {Math.abs(availableLimit).toFixed(2)}.
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block mb-1">Dia do Fechamento (Corte)</label>
                            <input
                              type="number"
                              min="1"
                              max="31"
                              placeholder="05"
                              value={item.closingDay || 5}
                              onChange={(e) => handleCardChange(index, "closingDay", Math.max(1, Math.min(31, Number(e.target.value))))}
                              className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-3 w-full text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block mb-1">Dia do Vencimento da Fatura</label>
                            <input
                              type="number"
                              min="1"
                              max="31"
                              placeholder="15"
                              value={item.dueDay || 15}
                              onChange={(e) => handleCardChange(index, "dueDay", Math.max(1, Math.min(31, Number(e.target.value))))}
                              className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-3 w-full text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {creditCards.length === 0 && (
                    <div className="text-center py-6 border border-dashed border-white/5 rounded-xl bg-zinc-950/20 col-span-full">
                      <Info className="w-5 h-5 text-zinc-600 mx-auto mb-1.5" />
                      <p className="text-[11px] text-zinc-500">Nenhum cartão cadastrado ainda. Adicione abaixo.</p>
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  onClick={handleAddCard}
                  className="w-full border-dashed border-white/10 hover:border-yellow-500/30 hover:bg-yellow-500/5 text-zinc-400 font-bold h-11 rounded-xl text-xs mt-2"
                >
                  <Plus className="w-4 h-4 mr-1.5 text-yellow-500" />
                  Adicionar Cartão
                </Button>
              </CardContent>
            </motion.div>
          )}

          {/* =====================================================================
              PASSO 4: DIVIDAS & CONSORCIOS
              ===================================================================== */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <CardHeader className="p-6 pb-3">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <CardTitle className="text-base font-black text-white">4. Consórcios, Financiamentos e Dívidas</CardTitle>
                    <CardDescription className="text-[10px] text-zinc-500 mt-0.5">Cadastrem despesas extensas (como terrenos, automóveis ou parcelamentos locais)</CardDescription>
                  </div>
                  <AudioExplainerButton 
                    text="Aqui é onde a regra de negócio vai acontecer se você está com dívidas atrasadas, financiamentos ou consórcios." 
                  />
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-4">
                <div className={getGridClass(debts.length, "max-h-[500px]")} data-lenis-prevent>
                  {debts.map((item, index) => (
                    <div key={index} className="bg-zinc-950/40 p-4 rounded-xl border border-white/5 space-y-3 relative">
                      <button
                        onClick={() => handleRemoveDebt(index)}
                        className="absolute top-4 right-4 text-zinc-650 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block mb-1">Título do Financiamento / Dívida</label>
                          <input
                            type="text"
                            placeholder="Ex: Financiamento de Carro, Terreno Loteadora"
                            value={item.title}
                            onChange={(e) => handleDebtChange(index, "title", e.target.value)}
                            className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-3 w-full text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block mb-1">Qual o tipo dessa conta?</label>
                          <CustomSelect
                            value={item.tipoDivida || "toxica"}
                            onChange={(val) => handleDebtChange(index, "tipoDivida", val)}
                            options={[
                              { value: "toxica", label: "Dívida de Cartão / Empréstimo (Curto Prazo)" },
                              { value: "estrutural", label: "Financiamento de Patrimônio / Consórcio (Longo Prazo)" }
                            ]}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] text-zinc-555 uppercase tracking-wider font-bold block mb-1">Valor Total do Bem (R$)</label>
                            <input
                              type="number"
                              placeholder="0,00"
                              value={item.acquisitionValue || ""}
                              onChange={(e) => handleDebtChange(index, "acquisitionValue", Number(e.target.value))}
                              className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-3 w-full text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block mb-1">Parcela Atual (R$)</label>
                            <input
                              type="number"
                              placeholder="0,00"
                              value={item.currentInstallmentValue || ""}
                              onChange={(e) => handleDebtChange(index, "currentInstallmentValue", Number(e.target.value))}
                              className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-3 w-full text-xs"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block mb-1">Dia do Vencimento Mensal</label>
                            <input
                              type="number"
                              min="1"
                              max="31"
                              placeholder="10"
                              value={item.dueDay || 10}
                              onChange={(e) => handleDebtChange(index, "dueDay", Math.max(1, Math.min(31, Number(e.target.value))))}
                              className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-3 w-full text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block mb-1">Data da Próxima Parcela (DD/MM/AAAA)</label>
                            <input
                              type="date"
                              value={item.nextDueDate || ""}
                              onChange={(e) => handleDebtChange(index, "nextDueDate", e.target.value)}
                              className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-3 w-full text-xs [color-scheme:dark]"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[8px] text-zinc-550 uppercase tracking-wider font-bold block mb-1">Juros Atraso/Mês (%)</label>
                            <input
                              type="number"
                              step="0.1"
                              placeholder="0.0"
                              value={item.monthlyLateInterestRate || ""}
                              onChange={(e) => handleDebtChange(index, "monthlyLateInterestRate", Number(e.target.value))}
                              className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-2 w-full text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[8px] text-zinc-555 uppercase tracking-wider font-bold block mb-1">Valor Multa (R$)</label>
                            <input
                              type="number"
                              placeholder="0,00"
                              value={item.penaltyValue || ""}
                              onChange={(e) => handleDebtChange(index, "penaltyValue", Number(e.target.value))}
                              className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-2 w-full text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[8px] text-zinc-555 uppercase tracking-wider font-bold block mb-1">Pagas / Total Parc.</label>
                            <div className="flex gap-1 items-center">
                              <input
                                type="number"
                                placeholder="Pagas"
                                value={item.installmentsPaid || ""}
                                onChange={(e) => handleDebtChange(index, "installmentsPaid", Number(e.target.value))}
                                className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-2 w-14 text-center text-xs"
                              />
                              <span className="text-zinc-650 text-xs">/</span>
                              <input
                                type="number"
                                placeholder="Total"
                                value={item.totalInstallments || ""}
                                onChange={(e) => handleDebtChange(index, "totalInstallments", Number(e.target.value))}
                                className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-2 w-14 text-center text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {debts.length === 0 && (
                    <div className="text-center py-6 border border-dashed border-white/5 rounded-xl bg-zinc-950/20 col-span-full">
                      <Info className="w-5 h-5 text-zinc-600 mx-auto mb-1.5" />
                      <p className="text-[11px] text-zinc-500">Nenhum financiamento ou dívida cadastrada. Adicione abaixo.</p>
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  onClick={handleAddDebt}
                  className="w-full border-dashed border-white/10 hover:border-yellow-500/30 hover:bg-yellow-500/5 text-zinc-400 font-bold h-11 rounded-xl text-xs mt-2"
                >
                  <Plus className="w-4 h-4 mr-1.5 text-yellow-500" />
                  Adicionar Dívida / Financiamento
                </Button>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controles de Navegação do Wizard */}
        <div className="flex justify-between items-center mt-6 pt-6 border-t border-white/5 gap-4">
          {step > 1 ? (
            <Button
              variant="outline"
              type="button"
              onClick={prevStep}
              className="border-white/5 hover:bg-zinc-900/50 hover:border-zinc-800 text-zinc-300 font-bold h-11 rounded-xl text-xs flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5 text-zinc-300" />
              Voltar
            </Button>
          ) : (
            <div className="flex-1" />
          )}

          {step < 4 ? (
            <Button
              type="button"
              onClick={nextStep}
              className="bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-500 text-zinc-950 font-black shadow-lg shadow-yellow-500/10 h-11 rounded-xl text-xs border-none flex-1"
            >
              Avançar
              <ArrowRight className="w-4 h-4 ml-1.5 text-zinc-950" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-500 text-zinc-950 font-black shadow-lg shadow-yellow-500/10 h-11 rounded-xl text-xs border-none flex-1"
            >
              {loading ? "Processando..." : "Submeter & Gerar Choque"}
              <Sparkles className="w-4 h-4 ml-1.5 text-zinc-950 animate-pulse" />
            </Button>
          )}
        </div>
      </Card>

    </div>
  );
}
