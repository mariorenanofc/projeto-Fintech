"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Ban
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { 
  saveOnboardingData, 
  generateFinancialStrategy, 
  IncomeInput, 
  FixedExpenseInput, 
  CreditCardInput, 
  DebtInput, 
  FinancialStrategyResult 
} from "@/actions/onboarding";

export default function OnboardingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // TAREFA 1.2: Estados iniciais limpos ou zerados, sem mock data de Parceiro A
  const [incomes, setIncomes] = useState<IncomeInput[]>([]);
  
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpenseInput[]>([
    { category: "Água", title: "Conta de Água", amount: 0 },
    { category: "Luz", title: "Conta de Luz", amount: 0 },
    { category: "Internet", title: "Internet Banda Larga", amount: 0 },
    { category: "Telefonia", title: "Plano de Celular", amount: 0 },
    { category: "Feira/Mercado", title: "Supermercado Mensal", amount: 0 },
    { category: "Combustível", title: "Gasolina/Transporte", amount: 0 }
  ]);

  const [creditCards, setCreditCards] = useState<CreditCardInput[]>([]);

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
    setFixedExpenses([...fixedExpenses, { category: "Customizada", title: "", amount: 0 }]);
  };

  const handleRemoveCustomExpense = (index: number) => {
    setFixedExpenses(fixedExpenses.filter((_, i) => i !== index));
  };

  const handleCustomExpenseChange = (index: number, field: "title" | "amount", value: any) => {
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

  const handleCardChange = (index: number, field: keyof CreditCardInput, value: any) => {
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
      installmentsPaid: 0 
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
    setLoading(true);
    try {
      // 1. Salvar os dados consolidados do Wizard via Server Action
      const saveRes = await saveOnboardingData({
        incomes: incomes.filter(i => i.title !== "" && i.amount > 0),
        fixedExpenses: fixedExpenses.filter(e => e.title !== "" && e.amount > 0),
        creditCards: creditCards.filter(c => c.name !== "" && c.totalLimit > 0),
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
    <div className="flex-1 w-full max-w-md mx-auto bg-zinc-950 flex flex-col min-h-screen px-4 py-6 sm:max-w-xl sm:px-6 md:max-w-2xl lg:max-w-3xl lg:px-8 lg:py-10">
      
      {/* Header do Wizard */}
      <header className="flex justify-between items-center mb-8 pb-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-yellow-500 flex items-center justify-center shadow-lg shadow-yellow-500/20 relative overflow-hidden">
            <Coins className="w-5.5 h-5.5 text-zinc-950" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-white sm:text-lg">Configurar Onboarding</h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Passo {step} de 4</p>
          </div>
        </div>
        <Badge variant="outline" className="border-yellow-500/20 text-yellow-400 bg-yellow-950/10 px-2.5 py-1 text-xs">
          Modo Setup
        </Badge>
      </header>

      {/* Barra de Progresso visual */}
      <div className="mb-6">
        <Progress value={(step / 4) * 100} className="h-1.5 bg-zinc-900 border border-white/5 rounded-full" />
      </div>

      <div className="flex-1 flex flex-col justify-between">
        
        {/* =====================================================================
            PASSO 1: RECEITAS
            ===================================================================== */}
        {step === 1 && (
          <Card className="bg-zinc-900/40 border-white/5 shadow-xl backdrop-blur-md">
            <CardHeader className="p-6 pb-3">
              <CardTitle className="text-base font-black text-white">1. Receitas do Casal</CardTitle>
              <CardDescription className="text-[10px] text-zinc-500 mt-0.5">Cadastrem os salários ou ganhos mensais recorrentes de vocês</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
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
                      <div className="grid grid-cols-2 gap-3">
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
                          <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block mb-1">Responsável</label>
                          <select
                            value={item.owner}
                            onChange={(e) => handleIncomeChange(index, "owner", e.target.value)}
                            className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-3 w-full text-xs h-11"
                          >
                            <option value="Parceiro A">Parceiro A</option>
                            <option value="Parceiro B">Parceiro B</option>
                            <option value="Compartilhado">Compartilhado</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {incomes.length === 0 && (
                  <div className="text-center py-6 border border-dashed border-white/5 rounded-xl bg-zinc-950/20">
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
                <Plus className="w-4 h-4 mr-1.5 text-yellow-500" />
                Adicionar Receita
              </Button>
            </CardContent>
          </Card>
        )}

        {/* =====================================================================
            PASSO 2: DESPESAS ESSENCIAIS
            ===================================================================== */}
        {step === 2 && (
          <Card className="bg-zinc-900/40 border-white/5 shadow-xl backdrop-blur-md">
            <CardHeader className="p-6 pb-3">
              <CardTitle className="text-base font-black text-white">2. Custo de Vida Essencial</CardTitle>
              <CardDescription className="text-[10px] text-zinc-500 mt-0.5">Cadastrem os custos fixos obrigatórios de sobrevivência do lar</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                
                {/* Categorias Padrão Exigidas */}
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

                      <div className="sm:col-span-2">
                        <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block mb-1">Valor Mensal Estimado (R$)</label>
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
                          className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-3 w-full text-xs"
                        />
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
                <Plus className="w-4 h-4 mr-1.5 text-yellow-500" />
                Adicionar Despesa Customizada
              </Button>
            </CardContent>
          </Card>
        )}

        {/* =====================================================================
            PASSO 3: CARTÕES DE CRÉDITO
            ===================================================================== */}
        {step === 3 && (
          <Card className="bg-zinc-900/40 border-white/5 shadow-xl backdrop-blur-md">
            <CardHeader className="p-6 pb-3">
              <CardTitle className="text-base font-black text-white">3. Cartões de Crédito</CardTitle>
              <CardDescription className="text-[10px] text-zinc-500 mt-0.5">Cadastrem os cartões ativos de vocês. Serão usados para controle e pagamentos</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
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
                      
                      {/* TAREFA 1.3: Adição do campo Fatura do Próximo Mês */}
                      <div className="grid grid-cols-3 gap-3">
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
                        <div>
                          <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block mb-1">Fatura Próx. Mês (R$)</label>
                          <input
                            type="number"
                            placeholder="0,00"
                            value={item.nextInvoice || ""}
                            onChange={(e) => handleCardChange(index, "nextInvoice", Number(e.target.value))}
                            className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-3 w-full text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {creditCards.length === 0 && (
                  <div className="text-center py-6 border border-dashed border-white/5 rounded-xl bg-zinc-950/20">
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
          </Card>
        )}

        {/* =====================================================================
            PASSO 4: DIVIDAS & CONSORCIOS
            ===================================================================== */}
        {step === 4 && (
          <Card className="bg-zinc-900/40 border-white/5 shadow-xl backdrop-blur-md">
            <CardHeader className="p-6 pb-3">
              <CardTitle className="text-base font-black text-white">4. Consórcios, Financiamentos e Dívidas</CardTitle>
              <CardDescription className="text-[10px] text-zinc-500 mt-0.5">Cadastrem despesas extensas (como terrenos, automóveis ou parcelamentos locais)</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
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
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block mb-1">Valor Total do Bem (R$)</label>
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
                          <label className="text-[8px] text-zinc-550 uppercase tracking-wider font-bold block mb-1">Valor Multa (R$)</label>
                          <input
                            type="number"
                            placeholder="0,00"
                            value={item.penaltyValue || ""}
                            onChange={(e) => handleDebtChange(index, "penaltyValue", Number(e.target.value))}
                            className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-2 w-full text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[8px] text-zinc-550 uppercase tracking-wider font-bold block mb-1">Pagas / Total Parc.</label>
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
                  <div className="text-center py-6 border border-dashed border-white/5 rounded-xl bg-zinc-950/20">
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
          </Card>
        )}

        {/* Controles de Navegação do Wizard */}
        <div className="flex justify-between items-center mt-8 gap-4">
          {step > 1 ? (
            <Button
              variant="outline"
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
              onClick={nextStep}
              className="bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-500 text-zinc-950 font-black shadow-lg shadow-yellow-500/10 h-11 rounded-xl text-xs border-none flex-1"
            >
              Avançar
              <ArrowRight className="w-4 h-4 ml-1.5 text-zinc-950" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-500 text-zinc-950 font-black shadow-lg shadow-yellow-500/10 h-11 rounded-xl text-xs border-none flex-1"
            >
              {loading ? "Processando..." : "Submeter & Gerar Choque"}
              <Sparkles className="w-4 h-4 ml-1.5 text-zinc-950 animate-pulse" />
            </Button>
          )}
        </div>

      </div>
    </div>
  );
}
