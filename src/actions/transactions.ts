"use server";

import { createClient } from "@/lib/supabase/server";
import { 
  getFinancialMonth, 
  getInvoiceCycleForPurchase, 
  getInvoiceDatesForBillingMonth, 
  addMonths, 
  roundMoney 
} from "@/lib/financial";

export interface TransactionInput {
  type: "income" | "expense";
  amount: number;
  description: string;
  category: string;
  date: string; // Formato: AAAA-MM-DD
  paymentMethod?: "pix" | "money" | "transfer" | "credit_card";
  creditCardId?: string;
  creditCardName?: string;
  transactionKind?: "income" | "expense" | "card_payment" | "transfer" | "goal_contribution";
  billingMonth?: string; // AAAA-MM
  installmentsTotal?: number; // Total de parcelas
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

// Helper para inferir transactionKind com base no item de transação completo
function inferTransactionKind(
  item: TransactionInput
): "income" | "expense" | "card_payment" | "transfer" | "goal_contribution" {
  if (item.type === "income") return "income";

  if (item.creditCardId) {
    if (item.category === "Cartão" || /fatura/i.test(item.description)) {
      return "card_payment";
    }
  }

  if (item.paymentMethod === "transfer") {
    if (item.category === "Investimento" || item.category === "Aporte na Reserva") {
      return "goal_contribution";
    }
    return "transfer";
  }

  return "expense";
}

/**
 * Server Action para listar as transações do casal filtradas pelo mês selecionado
 */
export async function getTransactions(monthStr?: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Não autenticado", data: [] };

    const familyGroupId = await getFamilyGroupId(supabase, user.id);
    const activeMonth = monthStr || new Date().toISOString().substring(0, 7); // Ex: "2026-07"
    
    const startDate = `${activeMonth}-01`;
    const endDate = `${activeMonth}-31`; // SQL de Supabase aceita comparação direta de strings de data

    const { data: transactions, error } = await supabase
      .from("transactions")
      .select(`
        *,
        profiles (
          full_name,
          avatar_url
        )
      `)
      .eq("family_group_id", familyGroupId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: false });

    if (error) throw error;

    return { 
      success: true, 
      data: transactions || [] 
    };

  } catch (error: any) {
    console.error("Erro ao listar transações:", error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Server Action para adicionar uma nova transação financeira
 */
export async function addTransaction(item: TransactionInput) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Não autenticado" };

    const familyGroupId = await getFamilyGroupId(supabase, user.id);

    let finalDescription = item.description;
    if (item.paymentMethod === "pix" && !finalDescription.startsWith("[PIX]")) {
      finalDescription = `[PIX] ${finalDescription}`;
    } else if (item.paymentMethod === "money" && !finalDescription.startsWith("[Dinheiro]")) {
      finalDescription = `[Dinheiro] ${finalDescription}`;
    } else if (item.paymentMethod === "transfer" && !finalDescription.startsWith("[Transferência]")) {
      finalDescription = `[Transferência] ${finalDescription}`;
    } else if (item.paymentMethod === "credit_card" && item.creditCardName && !finalDescription.startsWith("[Cartão:")) {
      finalDescription = `[Cartão: ${item.creditCardName}] ${finalDescription}`;
    }

    const transactionKind = inferTransactionKind(item);
    const billingMonth = item.billingMonth || getFinancialMonth();

    // 1. Inserir a transação mãe e obter o ID gerado
    const { data: insertedTransaction, error: insertError } = await supabase
      .from("transactions")
      .insert({
        family_group_id: familyGroupId,
        profile_id: user.id,
        type: item.type,
        amount: item.amount,
        description: finalDescription,
        category: item.category || "Geral",
        date: item.date || new Date().toISOString().substring(0, 10),
        credit_card_id: item.creditCardId || null,
        transaction_kind: transactionKind,
        billing_month: billingMonth
      })
      .select("id")
      .single();

    if (insertError) throw insertError;
    const transactionId = insertedTransaction.id;

    // 2. Se for despesa no cartão de crédito, gerar parcelas e faturas
    if (item.type === "expense" && item.paymentMethod === "credit_card" && item.creditCardId) {
      const { data: card, error: cardError } = await supabase
        .from("credit_cards")
        .select("closing_day, due_day, current_invoice")
        .eq("id", item.creditCardId)
        .single();

      if (cardError || !card) throw new Error("Cartão não encontrado.");

      const cycle = getInvoiceCycleForPurchase({
        purchaseDateStr: item.date || new Date().toISOString().substring(0, 10),
        closingDay: card.closing_day,
        dueDay: card.due_day
      });

      const totalInst = Math.max(1, item.installmentsTotal || 1);
      let sumAmounts = 0;
      const installmentsToInsert = [];

      for (let i = 1; i <= totalInst; i++) {
        const installmentBillingMonth = addMonths(cycle.billingMonth as any, i - 1);
        let amount = roundMoney(item.amount / totalInst);
        if (i === totalInst) {
          amount = roundMoney(item.amount - sumAmounts);
        }
        sumAmounts = roundMoney(sumAmounts + amount);

        installmentsToInsert.push({
          family_group_id: familyGroupId,
          profile_id: user.id,
          credit_card_id: item.creditCardId,
          transaction_id: transactionId,
          installment_number: i,
          total_installments: totalInst,
          amount,
          billing_month: installmentBillingMonth
        });
      }

      const { error: instError } = await supabase
        .from("credit_card_purchase_installments")
        .insert(installmentsToInsert);

      if (instError) throw instError;

      // Atualizar/Criar as faturas correspondentes a cada mês afetado
      for (const inst of installmentsToInsert) {
        const { data: sumData } = await supabase
          .from("credit_card_purchase_installments")
          .select("amount")
          .eq("credit_card_id", item.creditCardId)
          .eq("billing_month", inst.billing_month);

        const totalMonthAmount = (sumData || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);

        const dates = getInvoiceDatesForBillingMonth({
          billingMonth: inst.billing_month,
          closingDay: card.closing_day,
          dueDay: card.due_day
        });

        await supabase
          .from("credit_card_statements")
          .upsert({
            credit_card_id: item.creditCardId,
            billing_month: inst.billing_month,
            family_group_id: familyGroupId,
            profile_id: user.id,
            closing_date: dates.closingDateStr,
            due_date: dates.dueDateStr,
            predicted_amount: totalMonthAmount,
            actual_amount: totalMonthAmount,
            status: "open"
          }, {
            onConflict: "credit_card_id, billing_month"
          });
      }

      // Atualizar cache legado do limite no cartão
      const newInv = Number(card.current_invoice || 0) + Number(item.amount);
      await supabase
        .from("credit_cards")
        .update({ current_invoice: newInv })
        .eq("id", item.creditCardId);
    }

    return { success: true };

  } catch (error: any) {
    console.error("Erro ao criar transação:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Server Action para atualizar uma transação existente
 */
export async function updateTransaction(id: string, item: TransactionInput) {
  try {
    const supabase = await createClient();

    // 1. Buscar parcelas antigas para saber quais faturas recalcular depois
    const { data: oldInstallments } = await supabase
      .from("credit_card_purchase_installments")
      .select("credit_card_id, billing_month, amount, profile_id")
      .eq("transaction_id", id);

    let oldCardId: string | null = null;
    let oldAmount = 0;
    if (oldInstallments && oldInstallments.length > 0) {
      oldCardId = oldInstallments[0].credit_card_id;
      oldAmount = oldInstallments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    }

    // 2. Apagar parcelas antigas (para evitar duplicações/inconsistências)
    await supabase.from("credit_card_purchase_installments").delete().eq("transaction_id", id);

    let finalDescription = item.description;
    if (item.paymentMethod === "pix" && !finalDescription.startsWith("[PIX]")) {
      finalDescription = `[PIX] ${finalDescription}`;
    } else if (item.paymentMethod === "money" && !finalDescription.startsWith("[Dinheiro]")) {
      finalDescription = `[Dinheiro] ${finalDescription}`;
    } else if (item.paymentMethod === "transfer" && !finalDescription.startsWith("[Transferência]")) {
      finalDescription = `[Transferência] ${finalDescription}`;
    } else if (item.paymentMethod === "credit_card" && item.creditCardName && !finalDescription.startsWith("[Cartão:")) {
      finalDescription = `[Cartão: ${item.creditCardName}] ${finalDescription}`;
    }

    const transactionKind = inferTransactionKind(item);
    const billingMonth = item.billingMonth || getFinancialMonth();

    const updates: any = {
      type: item.type,
      amount: item.amount,
      description: finalDescription,
      category: item.category || "Geral",
      date: item.date,
      credit_card_id: item.creditCardId || null,
      transaction_kind: transactionKind,
      billing_month: billingMonth
    };

    // 3. Atualizar a transação
    const { error: updateError } = await supabase
      .from("transactions")
      .update(updates)
      .eq("id", id);

    if (updateError) throw updateError;

    // 4. Se a transação atualizada for despesa no cartão de crédito, criar novas parcelas
    if (item.type === "expense" && item.paymentMethod === "credit_card" && item.creditCardId) {
      const { data: card } = await supabase
        .from("credit_cards")
        .select("family_group_id, closing_day, due_day, current_invoice")
        .eq("id", item.creditCardId)
        .single();

      if (card) {
        const cycle = getInvoiceCycleForPurchase({
          purchaseDateStr: item.date || new Date().toISOString().substring(0, 10),
          closingDay: card.closing_day,
          dueDay: card.due_day
        });

        const totalInst = Math.max(1, item.installmentsTotal || 1);
        let sumAmounts = 0;
        const newInstallments = [];

        for (let i = 1; i <= totalInst; i++) {
          const installmentBillingMonth = addMonths(cycle.billingMonth as any, i - 1);
          let amount = roundMoney(item.amount / totalInst);
          if (i === totalInst) {
            amount = roundMoney(item.amount - sumAmounts);
          }
          sumAmounts = roundMoney(sumAmounts + amount);

          newInstallments.push({
            family_group_id: card.family_group_id,
            profile_id: oldInstallments?.[0]?.profile_id || "",
            credit_card_id: item.creditCardId,
            transaction_id: id,
            installment_number: i,
            total_installments: totalInst,
            amount,
            billing_month: installmentBillingMonth
          });
        }

        // Inserir novas parcelas
        await supabase.from("credit_card_purchase_installments").insert(newInstallments);

        // Recalcular as faturas do novo cartão afetadas
        for (const inst of newInstallments) {
          const { data: sumData } = await supabase
            .from("credit_card_purchase_installments")
            .select("amount")
            .eq("credit_card_id", item.creditCardId)
            .eq("billing_month", inst.billing_month);

          const totalMonthAmount = (sumData || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);

          const dates = getInvoiceDatesForBillingMonth({
            billingMonth: inst.billing_month,
            closingDay: card.closing_day,
            dueDay: card.due_day
          });

          await supabase
            .from("credit_card_statements")
            .upsert({
              credit_card_id: item.creditCardId,
              billing_month: inst.billing_month,
              family_group_id: card.family_group_id,
              profile_id: inst.profile_id,
              closing_date: dates.closingDateStr,
              due_date: dates.dueDateStr,
              predicted_amount: totalMonthAmount,
              actual_amount: totalMonthAmount,
              status: "open"
            }, {
              onConflict: "credit_card_id, billing_month"
            });
        }

        // Atualizar cache de faturas do cartão novo
        let diff = Number(item.amount);
        if (oldCardId === item.creditCardId) {
          diff = Number(item.amount) - oldAmount;
        }
        const newInv = Math.max(0, Number(card.current_invoice || 0) + diff);
        await supabase.from("credit_cards").update({ current_invoice: newInv }).eq("id", item.creditCardId);
      }
    }

    // 5. Se o cartão mudou ou o valor antigo foi removido, recalcular faturas do cartão antigo
    if (oldCardId && oldCardId !== item.creditCardId) {
      const { data: oldCard } = await supabase
        .from("credit_cards")
        .select("family_group_id, closing_day, due_day, current_invoice")
        .eq("id", oldCardId)
        .single();

      if (oldCard) {
        // Deduzir cache antigo
        const newInv = Math.max(0, Number(oldCard.current_invoice || 0) - oldAmount);
        await supabase.from("credit_cards").update({ current_invoice: newInv }).eq("id", oldCardId);

        // Recalcular faturas antigas
        for (const oldInst of oldInstallments || []) {
          const { data: sumData } = await supabase
            .from("credit_card_purchase_installments")
            .select("amount")
            .eq("credit_card_id", oldCardId)
            .eq("billing_month", oldInst.billing_month);

          const totalMonthAmount = (sumData || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);

          const dates = getInvoiceDatesForBillingMonth({
            billingMonth: oldInst.billing_month,
            closingDay: oldCard.closing_day,
            dueDay: oldCard.due_day
          });

          await supabase
            .from("credit_card_statements")
            .upsert({
              credit_card_id: oldCardId,
              billing_month: oldInst.billing_month,
              family_group_id: oldCard.family_group_id,
              profile_id: oldInst.profile_id,
              closing_date: dates.closingDateStr,
              due_date: dates.dueDateStr,
              predicted_amount: totalMonthAmount,
              actual_amount: totalMonthAmount,
              status: totalMonthAmount > 0 ? "open" : "paid"
            }, {
              onConflict: "credit_card_id, billing_month"
            });
        }
      }
    } else if (oldInstallments && oldInstallments.length > 0 && !(item.type === "expense" && item.paymentMethod === "credit_card")) {
      // Compra de cartão mudou para outra modalidade (Ex: pix)
      const { data: oldCard } = await supabase
        .from("credit_cards")
        .select("family_group_id, closing_day, due_day, current_invoice")
        .eq("id", oldCardId!)
        .single();

      if (oldCard) {
        const newInv = Math.max(0, Number(oldCard.current_invoice || 0) - oldAmount);
        await supabase.from("credit_cards").update({ current_invoice: newInv }).eq("id", oldCardId!);

        for (const oldInst of oldInstallments || []) {
          const { data: sumData } = await supabase
            .from("credit_card_purchase_installments")
            .select("amount")
            .eq("credit_card_id", oldCardId!)
            .eq("billing_month", oldInst.billing_month);

          const totalMonthAmount = (sumData || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);

          const dates = getInvoiceDatesForBillingMonth({
            billingMonth: oldInst.billing_month,
            closingDay: oldCard.closing_day,
            dueDay: oldCard.due_day
          });

          await supabase
            .from("credit_card_statements")
            .upsert({
              credit_card_id: oldCardId!,
              billing_month: oldInst.billing_month,
              family_group_id: oldCard.family_group_id,
              profile_id: oldInst.profile_id,
              closing_date: dates.closingDateStr,
              due_date: dates.dueDateStr,
              predicted_amount: totalMonthAmount,
              actual_amount: totalMonthAmount,
              status: totalMonthAmount > 0 ? "open" : "paid"
            }, {
              onConflict: "credit_card_id, billing_month"
            });
        }
      }
    }

    return { success: true };

  } catch (error: any) {
    console.error("Erro ao atualizar transação:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteTransaction(id: string) {
  try {
    const supabase = await createClient();

    // 1. Buscar parcelas antigas para saber quais faturas recalcular
    const { data: oldInstallments } = await supabase
      .from("credit_card_purchase_installments")
      .select("credit_card_id, billing_month, amount, profile_id")
      .eq("transaction_id", id);

    // 2. Apagar transação (deleta parcelas automaticamente via cascade)
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id);

    if (error) throw error;

    // 3. Recalcular faturas se necessário
    if (oldInstallments && oldInstallments.length > 0) {
      const creditCardId = oldInstallments[0].credit_card_id;
      const { data: card } = await supabase
        .from("credit_cards")
        .select("family_group_id, closing_day, due_day, current_invoice")
        .eq("id", creditCardId)
        .single();

      if (card) {
        const totalAmountDeleted = oldInstallments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
        const newInv = Math.max(0, Number(card.current_invoice || 0) - totalAmountDeleted);
        await supabase.from("credit_cards").update({ current_invoice: newInv }).eq("id", creditCardId);

        for (const oldInst of oldInstallments) {
          const { data: sumData } = await supabase
            .from("credit_card_purchase_installments")
            .select("amount")
            .eq("credit_card_id", creditCardId)
            .eq("billing_month", oldInst.billing_month);

          const totalMonthAmount = (sumData || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);

          const dates = getInvoiceDatesForBillingMonth({
            billingMonth: oldInst.billing_month,
            closingDay: card.closing_day,
            dueDay: card.due_day
          });

          await supabase
            .from("credit_card_statements")
            .upsert({
              credit_card_id: creditCardId,
              billing_month: oldInst.billing_month,
              family_group_id: card.family_group_id,
              profile_id: oldInst.profile_id,
              closing_date: dates.closingDateStr,
              due_date: dates.dueDateStr,
              predicted_amount: totalMonthAmount,
              actual_amount: totalMonthAmount,
              status: totalMonthAmount > 0 ? "open" : "paid"
            }, {
              onConflict: "credit_card_id, billing_month"
            });
        }
      }
    }

    return { success: true };

  } catch (error: any) {
    console.error("Erro ao deletar transação:", error);
    return { success: false, error: error.message };
  }
}
