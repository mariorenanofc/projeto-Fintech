"use server";

import { createClient } from "@/lib/supabase/server";
import { getProjectionHeadline, getDynamicAnalysisText, ProjectionMilestones } from "@/lib/dynamic-analysis";
import {
  addMonths,
  getFinancialMonth,
  getScheduledAmount,
  type MonthKey
} from "@/lib/financial";

export interface ForecastItemDetail {
  id: string;
  title: string;
  amount: number;
  category?: string;
  type: "income" | "essential" | "debt_structural" | "debt_toxic" | "card";
  details?: string;
}

export interface ForecastMonthData {
  monthIndex: number; // 1 a 12
  monthStr: string; // Ex: "2026-08"
  monthLabel: string; // Ex: "Agosto de 2026"
  monthShortLabel: string; // Ex: "Ago/26"
  stage: "red" | "yellow" | "green";
  income: number;
  essentials: number;
  lazerTravaValue: number;
  lazerPercent: number;
  structuralDebts: number;
  toxicDebts: number; // Parcelas tóxicas/faturas com vencimento no mês
  totalMonthlyCommitments: number; // Soma de todas as parcelas e faturas do mês
  totalRemainingDebtBalance: number; // Saldo devedor total acumulado remanescente
  focusValue: number;
  reserveMaintenanceValue: number;
  projectedReserve: number;
  projectedInvestments: number;
  headline: string;
  analysisText: string;
  
  // Relação completa detalhada item a item para o mês
  incomesList: ForecastItemDetail[];
  essentialsList: ForecastItemDetail[];
  commitmentsList: ForecastItemDetail[];
}

export interface ForecastResult {
  success: boolean;
  error?: string;
  currentStage: "red" | "yellow" | "green";
  initialReserve: number;
  reserveMeta: number;
  milestones: ProjectionMilestones;
  monthlyForecast: ForecastMonthData[];
}

// Helper para obter o family_group_id do usuário logado
async function getFamilyGroupId(supabase: any, userId: string) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("family_group_id")
    .eq("id", userId)
    .single();

  if (error || !profile) {
    throw new Error("Grupo familiar não encontrado.");
  }
  return profile.family_group_id;
}

// Helper para adicionar N meses a uma data YYYY-MM
function addMonthsToMonthStr(startMonthStr: MonthKey, monthsToAdd: number): { monthStr: MonthKey; monthLabel: string; monthShortLabel: string } {
  const monthStr = addMonths(startMonthStr, monthsToAdd);
  const [year, month] = monthStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));
  
  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  const shortMonthNames = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez"
  ];

  const monthLabel = `${monthNames[date.getUTCMonth()]} de ${year}`;
  const monthShortLabel = `${shortMonthNames[date.getUTCMonth()]}/${String(year).slice(-2)}`;

  return { monthStr, monthLabel, monthShortLabel };
}

/**
 * Server Action para calcular a projeção financeira matemática de 1 a 12 meses do casal.
 */
export async function getFinancialForecast(monthsAhead: number = 12): Promise<ForecastResult> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return {
        success: false,
        error: "Usuário não autenticado.",
        currentStage: "green",
        initialReserve: 0,
        reserveMeta: 0,
        milestones: { isInsolvencyRisk: false, initialStage: "green", targetStageMonth12: "green" },
        monthlyForecast: []
      };
    }

    const familyGroupId = await getFamilyGroupId(supabase, user.id);
    const startMonthStr = getFinancialMonth();

    // 1. Buscar todos os dados financeiros ativos
    const [
      profileRes,
      incomesRes,
      expensesRes,
      cardsRes,
      debtsRes,
      purchaseInstRes
    ] = await Promise.all([
      supabase.from("profiles").select("reserva_financeira_atual, investimentos_total").eq("id", user.id).single(),
      supabase.from("incomes").select("*").eq("family_group_id", familyGroupId),
      supabase.from("fixed_expenses").select("*").eq("family_group_id", familyGroupId),
      supabase.from("credit_cards").select("*").eq("family_group_id", familyGroupId),
      supabase.from("debts_and_financings").select("*").eq("family_group_id", familyGroupId),
      supabase.from("credit_card_purchase_installments").select("*").eq("family_group_id", familyGroupId)
    ]);

    const dbIncomes = incomesRes.data || [];
    const dbExpenses = expensesRes.data || [];
    const dbCards = cardsRes.data || [];
    const dbDebts = debtsRes.data || [];
    const dbPurchaseInstallments = purchaseInstRes.data || [];

    const totalIncome = dbIncomes.reduce((sum, item) => sum + Number(item.amount), 0);
    const totalEssentials = dbExpenses.reduce((sum, item) => sum + Number(item.amount), 0);
    const initialReserve = Number(profileRes?.data?.reserva_financeira_atual || 0);
    const initialInvestments = Number(profileRes?.data?.investimentos_total || 0);
    const reserveMeta = totalEssentials * 3;

    let currentAccumulatedReserve = initialReserve;
    let currentAccumulatedInvestments = initialInvestments;

    // Cálculo do Saldo Devedor Total Remanescente Inicial (incluindo saldo vencido acumulado)
    let activeToxicDebtsRemaining = dbDebts
      .filter(d => (d.tipo_divida || d.tipoDivida) !== "estrutural")
      .reduce((sum, d) => {
        const remainingInst = Math.max(0, Number(d.total_installments || 1) - Number(d.installments_paid || 0));
        const schedRemaining = remainingInst * Number(d.current_installment_value || 0);
        const overdueAccum = Number(d.overdue_value_accumulated || 0);
        return sum + schedRemaining + overdueAccum;
      }, 0);

    const initialCardsTotal = dbCards.reduce((sum, c) => sum + Number(c.current_invoice || 0), 0);
    activeToxicDebtsRemaining = Math.max(0, activeToxicDebtsRemaining + initialCardsTotal);

    // Rastrear saldo em atraso de cada dívida individualmente na simulação
    const debtsOverdueBalances = dbDebts.map(d => ({
      id: d.id,
      isEstrutural: (d.tipo_divida || d.tipoDivida) === "estrutural",
      overdueBalance: Number(d.overdue_value_accumulated || 0),
      monthlyRate: Number(d.monthly_late_interest_rate || 0)
    }));

    // Mapeamento de Receitas Fixas para listagem detalhada
    const incomesList: ForecastItemDetail[] = dbIncomes.map(inc => ({
      id: inc.id,
      title: inc.title,
      amount: Number(inc.amount),
      category: inc.owner ? `Proprietário: ${inc.owner}` : "Receita Familiar",
      type: "income"
    }));

    const monthlyForecast: ForecastMonthData[] = [];
    const milestones: ProjectionMilestones = {
      isInsolvencyRisk: false,
      initialStage: "green",
      targetStageMonth12: "green"
    };

    let firstToxicClearedMonth = "";
    let firstReserveTargetMonth = "";

    // 2. Loop de Simulação Mês a Mês (1 a 12 meses no futuro)
    for (let m = 1; m <= monthsAhead; m++) {
      const { monthStr, monthLabel, monthShortLabel } = addMonthsToMonthStr(startMonthStr, m - 1);

      // Mapeamento de Despesas Essenciais Fixas para listagem detalhada com DD/MM/AAAA
      const essentialsList: ForecastItemDetail[] = dbExpenses.map(exp => {
        const titleStr = exp.title || "";
        const match = titleStr.match(/\[due:(\d+)\]/);
        const dueDay = exp.due_day || (match ? parseInt(match[1]) : 15);
        const cleanTitle = titleStr.replace(/\s*\[due:\d+\]/, "");
        const formattedDueDate = `${String(dueDay).padStart(2, "0")}/${monthStr.split("-")[1]}/${monthStr.split("-")[0]}`;
        
        return {
          id: exp.id,
          title: cleanTitle,
          amount: Number(exp.amount),
          category: exp.category || "Essencial",
          type: "essential",
          details: `Vencimento em ${formattedDueDate}`
        };
      });

      const monthCommitmentsList: ForecastItemDetail[] = [];
      let monthToxicInstallments = 0;
      let monthStructuralInstallments = 0;

      // A. Filtra parcelas de Dívidas ativas especificamente no mês m
      dbDebts.forEach(debt => {
        const totalInst = Number(debt.total_installments || 1);
        const paidInst = Number(debt.installments_paid || 0);
        const projectedInstNumber = paidInst + m;

        // Se a parcela do contrato está dentro do período de parcelamento ativo
        if (projectedInstNumber <= totalInst) {
          const schedule = Array.isArray(debt.installments_schedule)
            ? debt.installments_schedule
            : undefined;
          const instVal = getScheduledAmount(schedule, monthStr, Number(debt.current_installment_value));

          const isEstrutural = (debt.tipo_divida || debt.tipoDivida) === "estrutural";

          if (isEstrutural) {
            monthStructuralInstallments += instVal;
          } else {
            monthToxicInstallments += instVal;
          }

          let dueDay = debt.due_day || debt.dueDay || 10;
          const titleStr = debt.title || "";
          const dueMatch = titleStr.match(/\[due:(\d+)\]/);
          const nextMatch = titleStr.match(/\[next:([^\]]+)\]/);
          if (dueMatch) dueDay = parseInt(dueMatch[1]);
          if (nextMatch && nextMatch[1]?.startsWith(monthStr)) {
            const parts = nextMatch[1].split("-");
            if (parts[2]) dueDay = parseInt(parts[2]);
          }

          const cleanTitle = titleStr.replace(/\s*\[due:\d+\]/, "").replace(/\s*\[next:[^\]]+\]/, "");
          const formattedDueDate = `${String(dueDay).padStart(2, "0")}/${monthStr.split("-")[1]}/${monthStr.split("-")[0]}`;

          monthCommitmentsList.push({
            id: debt.id,
            title: cleanTitle,
            amount: instVal,
            category: isEstrutural ? "Financiamento / Estrutural" : "Dívida Tóxica",
            type: isEstrutural ? "debt_structural" : "debt_toxic",
            details: `Parcela ${projectedInstNumber} de ${totalInst} • Venc. ${formattedDueDate}`
          });
        }
      });

      // B. Filtra Faturas de Cartão de Crédito para o mês m (com faturas estruturadas de parcelas da Fase 3)
      let monthCardInvoices = 0;
      dbCards.forEach(card => {
        const schedule = Array.isArray(card.invoices_schedule)
          ? card.invoices_schedule
          : undefined;

        // Tentar somar todas as parcelas ativas pertencentes a este mês (competência) para este cartão
        const cardInstallmentsForMonth = (dbPurchaseInstallments || []).filter(
          (p: any) => p.credit_card_id === card.id && p.billing_month === monthStr
        );

        let invVal = 0;
        if (cardInstallmentsForMonth.length > 0) {
          invVal = cardInstallmentsForMonth.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
        } else {
          // Se não houver parcelas registradas locais, recorremos ao fallback de compatibilidade do cronograma
          const fallbackInvoice = m === 1
            ? Number(card.current_invoice || 0)
            : Number(card.next_invoice || card.current_invoice || 0);
          invVal = getScheduledAmount(schedule, monthStr, fallbackInvoice);
        }

        if (invVal > 0) {
          monthCardInvoices += invVal;
          let dueDay = card.due_day || card.dueDay || 15;
          const nameStr = card.name || "";
          const dueMatch = nameStr.match(/\[due:(\d+)\]/);
          if (dueMatch) dueDay = parseInt(dueMatch[1]);
          const cleanName = nameStr.replace(/\s*\[close:\d+\]/, "").replace(/\s*\[due:\d+\]/, "");

          const formattedDueDate = `${String(dueDay).padStart(2, "0")}/${monthStr.split("-")[1]}/${monthStr.split("-")[0]}`;

          monthCommitmentsList.push({
            id: card.id,
            title: `Cartão ${cleanName}`,
            amount: invVal,
            category: "Fatura de Cartão",
            type: "card",
            details: `Vencimento em ${formattedDueDate}`
          });
        }
      });

      const totalMonthToxicDebts = monthToxicInstallments + monthCardInvoices;
      const totalMonthlyCommitments = monthStructuralInstallments + totalMonthToxicDebts;

      // C. Determina o Estágio do Mês (Red, Yellow, Green)
      const isToxicPresent = activeToxicDebtsRemaining > 0 || totalMonthToxicDebts > 0;
      const isInsolvency = (totalEssentials + monthStructuralInstallments) >= totalIncome;
      if (m === 1 && isInsolvency) milestones.isInsolvencyRisk = true;

      let monthStage: "red" | "yellow" | "green" = "green";
      if (isToxicPresent || totalIncome - totalEssentials < 0) {
        monthStage = "red";
      } else if (currentAccumulatedReserve < reserveMeta) {
        monthStage = "yellow";
      } else {
        monthStage = "green";
      }

      if (m === 1) milestones.initialStage = monthStage;
      if (m === 12) milestones.targetStageMonth12 = monthStage;

      // D. Aplicação das Regras do Motor Financeiro
      let lazerPercent = 0.12;
      let lazerTravaValue = 0;
      let reserveMaintenanceValue = 0;
      let focusValue = 0;

      const remainingAfterEssentials = Math.max(0, totalIncome - totalEssentials - monthStructuralInstallments);

      if (monthStage === "red") {
        lazerPercent = 0.06;
        lazerTravaValue = isInsolvency ? 0 : totalIncome * lazerPercent;
        if (lazerTravaValue > remainingAfterEssentials) lazerTravaValue = remainingAfterEssentials;

        // Foco no Red: 100% da sobra reduz o saldo devedor de dívidas tóxicas
        focusValue = Math.max(0, remainingAfterEssentials - lazerTravaValue);
        
        // Antes de amortizar as parcelas futuras, aplicamos juros de mora no saldo vencido acumulado
        // e amortizamos prioritariamente com o focusValue
        let remainingFocusForInstallments = focusValue;
        
        debtsOverdueBalances.forEach(dob => {
          if (!dob.isEstrutural && dob.overdueBalance > 0) {
            const monthlyInterest = dob.overdueBalance * (dob.monthlyRate / 100);
            dob.overdueBalance += monthlyInterest;
            activeToxicDebtsRemaining += monthlyInterest; // Adiciona os juros de mora gerados no mês
            
            const paymentToOverdue = Math.min(remainingFocusForInstallments, dob.overdueBalance);
            dob.overdueBalance -= paymentToOverdue;
            remainingFocusForInstallments -= paymentToOverdue;
            activeToxicDebtsRemaining = Math.max(0, activeToxicDebtsRemaining - paymentToOverdue);
          }
        });

        // O que restou do focusValue é aplicado na amortização das parcelas normais do mês
        activeToxicDebtsRemaining = Math.max(0, activeToxicDebtsRemaining - remainingFocusForInstallments - totalMonthToxicDebts);
        if (activeToxicDebtsRemaining === 0 && !firstToxicClearedMonth) {
          firstToxicClearedMonth = monthLabel;
        }

      } else if (monthStage === "yellow") {
        lazerPercent = 0.12;
        lazerTravaValue = isInsolvency ? 0 : totalIncome * lazerPercent;
        if (lazerTravaValue > remainingAfterEssentials) lazerTravaValue = remainingAfterEssentials;

        // Foco no Yellow: 100% da sobra entra no Fundo de Reserva
        focusValue = Math.max(0, remainingAfterEssentials - lazerTravaValue);
        currentAccumulatedReserve += focusValue;

        if (currentAccumulatedReserve >= reserveMeta && !firstReserveTargetMonth) {
          firstReserveTargetMonth = monthLabel;
        }

      } else { // green
        lazerPercent = 0.12;
        lazerTravaValue = isInsolvency ? 0 : totalIncome * lazerPercent;
        if (lazerTravaValue > remainingAfterEssentials) lazerTravaValue = remainingAfterEssentials;

        const remainingAfterLazer = Math.max(0, remainingAfterEssentials - lazerTravaValue);
        reserveMaintenanceValue = Math.min(totalIncome * 0.07, remainingAfterLazer);
        currentAccumulatedReserve += reserveMaintenanceValue;

        // Foco no Green: Sobra final vai para Investimentos/Metas
        focusValue = Math.max(0, remainingAfterLazer - reserveMaintenanceValue);
        currentAccumulatedInvestments += focusValue;
      }

      // E. Gerar textos dinâmicos
      const monthSnapshot = {
        income: totalIncome,
        essentials: totalEssentials,
        lazerTravaValue,
        lazerPercent: Math.round(lazerPercent * 100),
        toxicDebts: totalMonthToxicDebts,
        structuralDebts: monthStructuralInstallments,
        focusValue,
        projectedReserve: currentAccumulatedReserve,
        projectedInvestments: currentAccumulatedInvestments,
        reserveMeta
      };

      const monthHeadline = getProjectionHeadline(monthStage, monthLabel, {
        ...milestones,
        toxicDebtClearedMonth: firstToxicClearedMonth || undefined,
        reserveTargetReachedMonth: firstReserveTargetMonth || undefined
      });

      const monthAnalysis = getDynamicAnalysisText(monthStage, monthLabel, monthSnapshot, {
        ...milestones,
        toxicDebtClearedMonth: firstToxicClearedMonth || undefined,
        reserveTargetReachedMonth: firstReserveTargetMonth || undefined
      });

      monthlyForecast.push({
        monthIndex: m,
        monthStr,
        monthLabel,
        monthShortLabel,
        stage: monthStage,
        income: totalIncome,
        essentials: totalEssentials,
        lazerTravaValue,
        lazerPercent: Math.round(lazerPercent * 100),
        structuralDebts: monthStructuralInstallments,
        toxicDebts: totalMonthToxicDebts,
        totalMonthlyCommitments,
        totalRemainingDebtBalance: Math.round(activeToxicDebtsRemaining * 100) / 100,
        focusValue,
        reserveMaintenanceValue,
        projectedReserve: Math.round(currentAccumulatedReserve * 100) / 100,
        projectedInvestments: Math.round(currentAccumulatedInvestments * 100) / 100,
        headline: monthHeadline,
        analysisText: monthAnalysis,
        incomesList,
        essentialsList,
        commitmentsList: monthCommitmentsList
      });
    }

    if (firstToxicClearedMonth) milestones.toxicDebtClearedMonth = firstToxicClearedMonth;
    if (firstReserveTargetMonth) milestones.reserveTargetReachedMonth = firstReserveTargetMonth;

    return {
      success: true,
      currentStage: monthlyForecast[0]?.stage || "green",
      initialReserve,
      reserveMeta,
      milestones,
      monthlyForecast
    };

  } catch (error: any) {
    console.error("Erro em getFinancialForecast:", error);
    return {
      success: false,
      error: error.message || "Erro interno do servidor.",
      currentStage: "green",
      initialReserve: 0,
      reserveMeta: 0,
      milestones: { isInsolvencyRisk: false, initialStage: "green", targetStageMonth12: "green" },
      monthlyForecast: []
    };
  }
}
