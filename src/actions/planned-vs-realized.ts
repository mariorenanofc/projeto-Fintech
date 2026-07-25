"use server";

import { createClient } from "@/lib/supabase/server";
import { getFinancialMonth, comparePlannedVersusRealized } from "@/lib/financial";

export interface PlannedVersusRealizedResponse {
  success: boolean;
  error?: string;
  data: any[];
}

// Helper para obter o family_group_id do usuário
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

/**
 * Server Action para carregar o painel de planejamento versus realizado por categorias na competência.
 */
export async function getPlannedVersusRealized(monthStr?: string): Promise<PlannedVersusRealizedResponse> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Usuário não autenticado.", data: [] };
    }

    const familyGroupId = await getFamilyGroupId(supabase, user.id);
    const activeMonth = monthStr || getFinancialMonth(); // Ex: "2026-08"

    // 1. Carregar as despesas planejadas (fixed_expenses)
    const { data: dbFixedExpenses, error: fixedErr } = await supabase
      .from("fixed_expenses")
      .select("category, amount")
      .eq("family_group_id", familyGroupId);

    if (fixedErr) throw fixedErr;

    // 2. Carregar despesas diretas do mês (transactions com payment_method != 'credit_card')
    const { data: dbDirectExpenses, error: directErr } = await supabase
      .from("transactions")
      .select("id, category, amount, description, date")
      .eq("family_group_id", familyGroupId)
      .eq("type", "expense")
      .neq("payment_method", "credit_card")
      .gte("date", `${activeMonth}-01`)
      .lte("date", `${activeMonth}-31`);

    if (directErr) throw directErr;

    // 3. Carregar parcelas de faturas de cartões de crédito da competência
    const { data: dbInstallments, error: instErr } = await supabase
      .from("credit_card_purchase_installments")
      .select("id, amount, transaction_id, created_at")
      .eq("family_group_id", familyGroupId)
      .eq("billing_month", activeMonth);

    if (instErr) throw instErr;

    // Carregar transações pai para as parcelas
    let cardInstallmentsMapped: any[] = [];
    if (dbInstallments && dbInstallments.length > 0) {
      const parentTxIds = dbInstallments.map(i => i.transaction_id);
      const { data: parentTxs } = await supabase
        .from("transactions")
        .select("id, category, description, date")
        .in("id", parentTxIds);

      const parentTxsMap = new Map<string, any>();
      (parentTxs || []).forEach(tx => parentTxsMap.set(tx.id, tx));

      cardInstallmentsMapped = dbInstallments.map(inst => {
        const parent = parentTxsMap.get(inst.transaction_id);
        return {
          id: inst.id,
          amount: Number(inst.amount),
          category: parent?.category || "Cartão de Crédito",
          description: parent?.description || "Compra no Cartão",
          date: parent?.date || inst.created_at.substring(0, 10)
        };
      });
    }

    // 4. Carregar parcelas de dívidas da competência (debt_installments)
    const { data: dbDebtInstallments, error: debtErr } = await supabase
      .from("debt_installments")
      .select("id, original_value, penalty_applied, interest_accumulated, debt_id, due_date")
      .eq("family_group_id", familyGroupId)
      .eq("billing_month", activeMonth);

    if (debtErr) throw debtErr;

    // Carregar dívidas pai para as parcelas
    let debtInstallmentsMapped: any[] = [];
    if (dbDebtInstallments && dbDebtInstallments.length > 0) {
      const parentDebtIds = dbDebtInstallments.map(i => i.debt_id);
      const { data: parentDebts } = await supabase
        .from("debts_and_financings")
        .select("id, title")
        .in("id", parentDebtIds);

      const parentDebtsMap = new Map<string, any>();
      (parentDebts || []).forEach(d => parentDebtsMap.set(d.id, d));

      debtInstallmentsMapped = dbDebtInstallments.map(inst => {
        const parent = parentDebtsMap.get(inst.debt_id);
        const totalAmount = Number(inst.original_value) + Number(inst.penalty_applied || 0) + Number(inst.interest_accumulated || 0);
        return {
          id: inst.id,
          amount: totalAmount,
          category: "Dívidas",
          description: parent?.title ? `Parcela Dívida: ${parent.title}` : "Parcela de Dívida",
          date: inst.due_date ? inst.due_date.substring(0, 10) : `${activeMonth}-10`
        };
      });
    }

    // 5. Comparar orçado vs realizado chamando a função core
    const comparison = comparePlannedVersusRealized({
      plannedExpenses: dbFixedExpenses || [],
      directTransactions: dbDirectExpenses || [],
      cardInstallments: cardInstallmentsMapped,
      debtInstallments: debtInstallmentsMapped
    });

    return {
      success: true,
      data: comparison
    };

  } catch (error: any) {
    console.error("Erro no planejado vs realizado:", error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
}
