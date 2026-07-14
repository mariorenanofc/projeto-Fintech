"use server";

import { createClient } from "@/lib/supabase/server";

export interface TransactionInput {
  type: "income" | "expense";
  amount: number;
  description: string;
  category: string;
  date: string; // Formato: AAAA-MM-DD
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
      .select("*")
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

    const { error } = await supabase.from("transactions").insert({
      family_group_id: familyGroupId,
      profile_id: user.id,
      type: item.type,
      amount: item.amount,
      description: item.description,
      category: item.category || "Geral",
      date: item.date || new Date().toISOString().substring(0, 10)
    });

    if (error) throw error;
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
    const { error } = await supabase
      .from("transactions")
      .update({
        type: item.type,
        amount: item.amount,
        description: item.description,
        category: item.category || "Geral",
        date: item.date
      })
      .eq("id", id);

    if (error) throw error;
    return { success: true };

  } catch (error: any) {
    console.error("Erro ao atualizar transação:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Server Action para deletar uma transação existente
 */
export async function deleteTransaction(id: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return { success: true };

  } catch (error: any) {
    console.error("Erro ao deletar transação:", error);
    return { success: false, error: error.message };
  }
}
