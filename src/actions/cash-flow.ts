"use server";

import { createClient } from "@/lib/supabase/server";
import { 
  getFinancialMonth, 
  getLocalDateString, 
  calculateDailyCashFlow, 
  type DailyCashFlowEvent,
  getScheduledAmount
} from "@/lib/financial";

export interface DailyCashFlowResponse {
  success: boolean;
  error?: string;
  isRelativeFlow: boolean;
  initialBalance: number;
  dailyData: any[];
}

// Helper para obter o family_group_id e account_balance do usuário
async function getUserProfileData(supabase: any, userId: string) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("family_group_id, account_balance")
    .eq("id", userId)
    .single();

  if (error || !profile) {
    throw new Error("Perfil do usuário não encontrado.");
  }
  return {
    familyGroupId: profile.family_group_id,
    accountBalance: profile.account_balance ? Number(profile.account_balance) : 0
  };
}

/**
 * Server Action para calcular o fluxo de caixa diário projetado/real do mês selecionado.
 */
export async function getDailyCashFlow(monthStr?: string): Promise<DailyCashFlowResponse> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return {
        success: false,
        error: "Usuário não autenticado.",
        isRelativeFlow: true,
        initialBalance: 0,
        dailyData: []
      };
    }

    const { familyGroupId, accountBalance } = await getUserProfileData(supabase, user.id);
    const activeMonth = monthStr || getFinancialMonth(); // Ex: "2026-08"
    const [year, month] = activeMonth.split("-").map(Number);

    // 1. Carregar dados financeiros do Supabase
    const [
      incomesRes,
      expensesRes,
      cardsRes,
      debtsRes,
      statementsRes,
      transactionsRes,
      debtInstallmentsRes
    ] = await Promise.all([
      supabase.from("incomes").select("*").eq("family_group_id", familyGroupId),
      supabase.from("fixed_expenses").select("*").eq("family_group_id", familyGroupId),
      supabase.from("credit_cards").select("*").eq("family_group_id", familyGroupId),
      supabase.from("debts_and_financings").select("*").eq("family_group_id", familyGroupId),
      supabase.from("credit_card_statements").select("*").eq("family_group_id", familyGroupId).eq("billing_month", activeMonth),
      supabase.from("transactions").select("*").eq("family_group_id", familyGroupId).gte("date", `${activeMonth}-01`).lte("date", `${activeMonth}-31`),
      supabase.from("debt_installments").select("*").eq("family_group_id", familyGroupId).eq("billing_month", activeMonth)
    ]);

    const dbIncomes = incomesRes.data || [];
    const dbExpenses = expensesRes.data || [];
    const dbCards = cardsRes.data || [];
    const dbDebts = debtsRes.data || [];
    const dbStatements = statementsRes.data || [];
    const dbTransactions = transactionsRes.data || [];
    const dbDebtInstallments = debtInstallmentsRes.data || [];

    const todayStr = getLocalDateString(new Date()); // Formato YYYY-MM-DD
    const events: DailyCashFlowEvent[] = [];

    // Mapear número de dias no mês
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();

    // 2. Processar dia a dia do mês para montar a lista de eventos previstos e realizados
    for (let day = 1; day <= lastDay; day++) {
      const dayStr = String(day).padStart(2, "0");
      const currentDateStr = `${year}-${String(month).padStart(2, "0")}-${dayStr}`;
      const isPastOrToday = currentDateStr <= todayStr;

      // A. Adicionar transações confirmadas (realizadas) naquele dia
      const dayRealTransactions = dbTransactions.filter(t => t.date === currentDateStr);
      dayRealTransactions.forEach(t => {
        events.push({
          id: t.id,
          title: t.description,
          amount: Number(t.amount),
          type: t.type as "income" | "expense",
          date: currentDateStr,
          category: t.category
        });
      });

      // Se for data futura, adicionamos as projeções estimadas que ainda vão vencer
      if (!isPastOrToday) {
        // B. Receitas Fixas projetadas para o dia (se receipt_day coincidir)
        dbIncomes.forEach(inc => {
          const receiptDay = inc.receipt_day || 5;
          if (receiptDay === day) {
            events.push({
              id: `inc-proj-${inc.id}`,
              title: `${inc.title} (Previsto)`,
              amount: Number(inc.amount),
              type: "income",
              date: currentDateStr,
              category: "Receita"
            });
          }
        });

        // C. Despesas Fixas projetadas para o dia (se due_day coincidir)
        dbExpenses.forEach(exp => {
          const dueDay = exp.due_day || 15;
          if (dueDay === day) {
            // Verificar se já existe transação confirmada correspondente para não duplicar
            const titleClean = exp.title.toLowerCase();
            const alreadyPaid = dayRealTransactions.some(
              t => t.type === "expense" && t.description.toLowerCase().includes(titleClean)
            );

            if (!alreadyPaid) {
              events.push({
                id: `exp-proj-${exp.id}`,
                title: `${exp.title} (Previsto)`,
                amount: Number(exp.amount),
                type: "expense",
                date: currentDateStr,
                category: exp.category
              });
            }
          }
        });

        // D. Parcelas de Dívidas (vencendo no dia)
        dbDebts.forEach(debt => {
          // Verificar se existe parcela individual pendente para o mês
          const installment = dbDebtInstallments.find(di => di.debt_id === debt.id);
          
          let isPending = true;
          let dueDay = debt.due_day || debt.dueDay || 10;
          let amount = Number(debt.current_installment_value);

          if (installment) {
            isPending = installment.status !== "paid";
            amount = Number(installment.original_value) + Number(installment.penalty_applied) + Number(installment.interest_accumulated);
            const instDueDate = new Date(installment.due_date);
            dueDay = instDueDate.getUTCDate();
          }

          if (dueDay === day && isPending) {
            events.push({
              id: `debt-proj-${debt.id}`,
              title: `${debt.title} (Previsto)`,
              amount: amount,
              type: "expense",
              date: currentDateStr,
              category: "Dívidas"
            });
          }
        });

        // E. Vencimento de Fatura de Cartão de Crédito
        dbCards.forEach(card => {
          const statement = dbStatements.find(s => s.credit_card_id === card.id);
          
          let isPending = true;
          let dueDay = card.due_day || 15;
          let amount = Number(card.current_invoice);

          if (statement) {
            isPending = statement.status !== "paid";
            amount = Number(statement.actual_amount);
            const stmtDueDate = new Date(statement.due_date);
            dueDay = stmtDueDate.getUTCDate();
          }

          if (dueDay === day && isPending && amount > 0) {
            events.push({
              id: `card-proj-${card.id}`,
              title: `Fatura Cartão ${card.name} (Previsto)`,
              amount: amount,
              type: "expense",
              date: currentDateStr,
              category: "Fatura"
            });
          }
        });
      }
    }

    // 3. Executar o cálculo matemático diário determinístico
    const result = calculateDailyCashFlow({
      initialBalance: accountBalance,
      events,
      year,
      month
    });

    return {
      success: true,
      isRelativeFlow: result.isRelativeFlow,
      initialBalance: accountBalance,
      dailyData: result.dailyData
    };

  } catch (error: any) {
    console.error("Erro no fluxo de caixa diário:", error);
    return {
      success: false,
      error: error.message,
      isRelativeFlow: true,
      initialBalance: 0,
      dailyData: []
    };
  }
}
