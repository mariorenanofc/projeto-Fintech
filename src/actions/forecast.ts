"use server";

import { createClient } from "@/lib/supabase/server";
import { getProjectionHeadline, getDynamicAnalysisText, ProjectionMilestones } from "@/lib/dynamic-analysis";

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
function addMonthsToMonthStr(startMonthStr: string, monthsToAdd: number): { monthStr: string; monthLabel: string; monthShortLabel: string } {
  const [year, month] = startMonthStr.split("-").map(Number);
  const date = new Date(year, month - 1 + monthsToAdd, 1);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  
  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  const shortMonthNames = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez"
  ];

  const monthLabel = `${monthNames[date.getMonth()]} de ${y}`;
  const monthShortLabel = `${shortMonthNames[date.getMonth()]}/${String(y).slice(-2)}`;

  return { monthStr: `${y}-${m}`, monthLabel, monthShortLabel };
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
    const startMonthStr = new Date().toISOString().substring(0, 7);

    // 1. Buscar todos os dados financeiros ativos
    const [
      profileRes,
      incomesRes,
      expensesRes,
      cardsRes,
      debtsRes
    ] = await Promise.all([
      supabase.from("profiles").select("reserva_financeira_atual, investimentos_total").eq("id", user.id).single(),
      supabase.from("incomes").select("*").eq("family_group_id", familyGroupId),
      supabase.from("fixed_expenses").select("*").eq("family_group_id", familyGroupId),
      supabase.from("credit_cards").select("*").eq("family_group_id", familyGroupId),
      supabase.from("debts_and_financings").select("*").eq("family_group_id", familyGroupId)
    ]);

    const dbIncomes = incomesRes.data || [];
    const dbExpenses = expensesRes.data || [];
    const dbCards = cardsRes.data || [];
    const dbDebts = debtsRes.data || [];

    const totalIncome = dbIncomes.reduce((sum, item) => sum + Number(item.amount), 0);
    const totalEssentials = dbExpenses.reduce((sum, item) => sum + Number(item.amount), 0);
    const initialReserve = Number(profileRes?.data?.reserva_financeira_atual || 0);
    const initialInvestments = Number(profileRes?.data?.investimentos_total || 0);
    const reserveMeta = totalEssentials * 3;

    let currentAccumulatedReserve = initialReserve;
    let currentAccumulatedInvestments = initialInvestments;

    // Cálculo do Saldo Devedor Total Remanescente Inicial
    let activeToxicDebtsRemaining = dbDebts
      .filter(d => (d.tipo_divida || d.tipoDivida) !== "estrutural")
      .reduce((sum, d) => {
        const remainingInst = Math.max(0, Number(d.total_installments || 1) - Number(d.installments_paid || 0));
        return sum + (remainingInst * Number(d.current_installment_value || 0));
      }, 0);

    const initialCardsTotal = dbCards.reduce((sum, c) => sum + Number(c.current_invoice || 0), 0);
    activeToxicDebtsRemaining = Math.max(0, activeToxicDebtsRemaining + initialCardsTotal);

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
        const dueDay = match ? parseInt(match[1]) : 15;
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
          let instVal = Number(debt.current_installment_value);

          // Verifica se há valor específico no cronograma JSONB do mês
          if (debt.installments_schedule && Array.isArray(debt.installments_schedule)) {
            const schedItem = debt.installments_schedule.find((s: any) => s.month === monthStr);
            if (schedItem && Number(schedItem.amount) > 0) {
              instVal = Number(schedItem.amount);
            }
          }

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

      // B. Filtra Faturas de Cartão de Crédito para o mês m
      let monthCardInvoices = 0;
      dbCards.forEach(card => {
        let invVal = 0;
        if (card.invoices_schedule && Array.isArray(card.invoices_schedule) && card.invoices_schedule.length > 0) {
          const schedItem = card.invoices_schedule.find((s: any) => s.month === monthStr);
          if (schedItem) invVal = Number(schedItem.amount);
        }
        
        // Se não encontrou registro específico no cronograma JSONB, usa fatura atual ou próxima fatura projetada
        if (invVal === 0) {
          if (m === 1) {
            invVal = Number(card.current_invoice || 0);
          } else {
            invVal = Number(card.next_invoice || card.current_invoice || 0);
          }
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
        
        activeToxicDebtsRemaining = Math.max(0, activeToxicDebtsRemaining - focusValue - totalMonthToxicDebts);
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
