"use server";

import { createClient } from "@/lib/supabase/server";
import { 
  projectGoalTimeline, 
  validateGoalAllocations, 
  roundMoney 
} from "@/lib/financial";

export interface GoalInput {
  title: string;
  targetAmount: number;
  currentAmount?: number;
  priority?: number;
  monthlyPlannedContribution?: number;
  allocationPercent?: number;
  targetDate?: string | null;
  status?: "active" | "completed" | "paused";
}

export interface GoalTransactionInput {
  goalId: string;
  type: "contribution" | "withdrawal";
  amount: number;
  date?: string; // YYYY-MM-DD
}

// Helper para obter o family_group_id
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
 * Server Action para buscar todas as metas do casal com projeção de prazo dinâmica.
 */
export async function getGoals() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Não autenticado", data: [] };

    const familyGroupId = await getFamilyGroupId(supabase, user.id);

    const { data: goals, error } = await supabase
      .from("goals")
      .select("*")
      .eq("family_group_id", familyGroupId)
      .order("priority", { ascending: true });

    if (error) throw error;

    const mappedGoals = (goals || []).map((goal: any) => {
      const projection = projectGoalTimeline({
        targetAmount: Number(goal.target_amount),
        currentAmount: Number(goal.current_amount),
        monthlyContribution: Number(goal.monthly_planned_contribution || 0),
        status: goal.status as any
      });

      return {
        ...goal,
        remaining_amount: projection.remainingAmount,
        months_to_target: projection.monthsToTarget,
        is_completed: projection.isCompleted
      };
    });

    return { success: true, data: mappedGoals };

  } catch (error: any) {
    console.error("Erro ao buscar metas:", error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Server Action para cadastrar uma nova meta, validando o limite de alocação de 100%.
 */
export async function addGoal(item: GoalInput) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Não autenticado" };

    const familyGroupId = await getFamilyGroupId(supabase, user.id);

    // 1. Validar teto de 100% de alocação de percentual acumulado
    const allocationPercent = Number(item.allocationPercent || 0);

    const { data: activeGoals } = await supabase
      .from("goals")
      .select("allocation_percent")
      .eq("family_group_id", familyGroupId)
      .eq("status", "active");

    const currentAllocations = (activeGoals || []).map(g => Number(g.allocation_percent || 0));
    currentAllocations.push(allocationPercent);

    if (!validateGoalAllocations(currentAllocations)) {
      return { 
        success: false, 
        error: "A soma das alocações das metas não pode ultrapassar 100%." 
      };
    }

    // 2. Inserir meta no banco
    const { error } = await supabase.from("goals").insert({
      family_group_id: familyGroupId,
      profile_id: user.id,
      title: item.title,
      target_amount: item.targetAmount,
      current_amount: item.currentAmount || 0,
      priority: item.priority || 1,
      monthly_planned_contribution: item.monthlyPlannedContribution || 0,
      allocation_percent: allocationPercent,
      target_date: item.targetDate || null,
      status: item.status || "active"
    });

    if (error) throw error;
    return { success: true };

  } catch (error: any) {
    console.error("Erro ao cadastrar meta:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Server Action para atualizar uma meta, validando o teto de alocação de 100%.
 */
export async function updateGoal(id: string, item: GoalInput) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Não autenticado" };

    const familyGroupId = await getFamilyGroupId(supabase, user.id);

    // 1. Validar teto de 100% excluindo a própria meta
    const allocationPercent = Number(item.allocationPercent || 0);

    const { data: activeGoals } = await supabase
      .from("goals")
      .select("id, allocation_percent")
      .eq("family_group_id", familyGroupId)
      .eq("status", "active")
      .neq("id", id);

    const currentAllocations = (activeGoals || []).map(g => Number(g.allocation_percent || 0));
    currentAllocations.push(allocationPercent);

    if (!validateGoalAllocations(currentAllocations)) {
      return { 
        success: false, 
        error: "A soma das alocações das metas não pode ultrapassar 100%." 
      };
    }

    // 2. Atualizar meta
    const { error } = await supabase
      .from("goals")
      .update({
        title: item.title,
        target_amount: item.targetAmount,
        priority: item.priority,
        monthly_planned_contribution: item.monthlyPlannedContribution,
        allocation_percent: allocationPercent,
        target_date: item.targetDate,
        status: item.status
      })
      .eq("id", id);

    if (error) throw error;
    return { success: true };

  } catch (error: any) {
    console.error("Erro ao atualizar meta:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Server Action para deletar uma meta.
 */
export async function deleteGoal(id: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("goals").delete().eq("id", id);
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao deletar meta:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Server Action para cadastrar uma movimentação na meta (aporte/resgate).
 */
export async function addGoalTransaction(item: GoalTransactionInput) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Não autenticado" };

    const familyGroupId = await getFamilyGroupId(supabase, user.id);

    const { error } = await supabase.from("goal_transactions").insert({
      family_group_id: familyGroupId,
      profile_id: user.id,
      goal_id: item.goalId,
      type: item.type,
      amount: item.amount,
      date: item.date || new Date().toISOString().substring(0, 10)
    });

    if (error) throw error;
    return { success: true };

  } catch (error: any) {
    console.error("Erro ao registrar movimentação de meta:", error);
    return { success: false, error: error.message };
  }
}
