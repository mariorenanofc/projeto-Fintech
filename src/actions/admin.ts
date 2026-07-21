"use server";

import { createClient } from "@/lib/supabase/server";

export interface AuditLogItem {
  id: string;
  performed_by: string | null;
  target_user_id: string | null;
  action: string;
  metadata: any;
  created_at: string;
  performer_profile?: {
    full_name: string;
    email: string;
  } | null;
}

/**
 * Helper para verificar se o usuário logado possui privilégios de Admin
 */
export async function checkAdminAccess() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return { isAdmin: false, user: null };
    }

    // 1. Obtém o e-mail do usuário autenticado no servidor
    const userEmail = user.email?.toLowerCase().trim();

    // 2. Lê a lista de e-mails de administradores estritamente a partir de variáveis de ambiente do servidor (NUNCA commitadas)
    const allowedAdminEmails = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "")
      .split(",")
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);

    const isEmailAdmin = !!(userEmail && allowedAdminEmails.includes(userEmail));

    // 3. Verifica no perfil do banco de dados (coluna role = 'admin')
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isRoleAdmin = profile?.role === "admin";

    // O acesso só é liberado se for explicitamente reconhecido por variável de ambiente ou role do banco
    if (isEmailAdmin || isRoleAdmin) {
      return { isAdmin: true, user, profile };
    }

    return { isAdmin: false, user, profile };
  } catch (err) {
    console.error("Erro ao verificar acesso admin:", err);
    return { isAdmin: false, user: null };
  }
}

/**
 * Busca métricas consolidadas do banco de dados para o Dashboard Admin
 */
export async function getAdminMetrics() {
  try {
    const { isAdmin } = await checkAdminAccess();
    if (!isAdmin) {
      return { success: false, error: "Acesso não autorizado ao Backoffice." };
    }

    const supabase = await createClient();

    // Consultas agregadas em paralelo
    const [
      { count: familyGroupsCount },
      { count: transactionsCount },
      { count: profilesCount },
      { count: auditLogsCount }
    ] = await Promise.all([
      supabase.from("family_groups").select("*", { count: "exact", head: true }),
      supabase.from("transactions").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("audit_logs").select("*", { count: "exact", head: true })
    ]);

    return {
      success: true,
      metrics: {
        totalFamilyGroups: familyGroupsCount || 0,
        totalTransactions: transactionsCount || 0,
        totalProfiles: profilesCount || 0,
        totalAuditLogs: auditLogsCount || 0
      }
    };
  } catch (error: any) {
    console.error("Erro ao buscar métricas de admin:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Busca registros da tabela audit_logs com suporte a filtros de usuário e data
 */
export async function getAuditLogs(filters?: { search?: string; startDate?: string; endDate?: string; limit?: number }) {
  try {
    const { isAdmin } = await checkAdminAccess();
    if (!isAdmin) {
      return { success: false, error: "Acesso não autorizado ao Backoffice.", data: [] };
    }

    const supabase = await createClient();
    let query = supabase
      .from("audit_logs")
      .select(`
        *,
        performer_profile:profiles!audit_logs_performed_by_fkey (
          full_name,
          email
        )
      `)
      .order("created_at", { ascending: false })
      .limit(filters?.limit || 100);

    if (filters?.startDate) {
      query = query.gte("created_at", `${filters.startDate}T00:00:00`);
    }

    if (filters?.endDate) {
      query = query.lte("created_at", `${filters.endDate}T23:59:59`);
    }

    const { data, error } = await query;

    if (error) throw error;

    let filteredData = data || [];

    if (filters?.search && filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim();
      filteredData = filteredData.filter((item: any) => {
        const actionMatch = item.action?.toLowerCase().includes(searchTerm);
        const userMatch = item.performer_profile?.full_name?.toLowerCase().includes(searchTerm) ||
                          item.performer_profile?.email?.toLowerCase().includes(searchTerm) ||
                          item.performed_by?.toLowerCase().includes(searchTerm) ||
                          item.target_user_id?.toLowerCase().includes(searchTerm);
        const metaMatch = JSON.stringify(item.metadata || {}).toLowerCase().includes(searchTerm);
        return actionMatch || userMatch || metaMatch;
      });
    }

    return {
      success: true,
      data: filteredData as AuditLogItem[]
    };
  } catch (error: any) {
    console.error("Erro ao buscar logs de auditoria:", error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Lista todos os usuários cadastrados no sistema para o Backoffice
 */
export async function getAdminUsersList() {
  try {
    const { isAdmin } = await checkAdminAccess();
    if (!isAdmin) {
      return { success: false, error: "Acesso não autorizado ao Backoffice.", data: [] };
    }

    const supabase = await createClient();
    const { data: users, error } = await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        email,
        avatar_url,
        role,
        created_at,
        family_groups (
          id,
          name
        )
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return {
      success: true,
      data: users || []
    };
  } catch (error: any) {
    console.error("Erro ao buscar lista de usuários no admin:", error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Registra o log de auditoria imutável de tentativa de Impersonation (Simulação)
 */
export async function logImpersonationAttempt(targetUserId: string, targetUserName: string) {
  try {
    const { isAdmin, user } = await checkAdminAccess();
    if (!isAdmin || !user) {
      return { success: false, error: "Acesso não autorizado." };
    }

    const supabase = await createClient();

    const { error } = await supabase.from("audit_logs").insert({
      performed_by: user.id,
      target_user_id: targetUserId,
      action: "ADMIN_IMPERSONATION_SIMULATION",
      metadata: {
        note: `Admin iniciou simulação do usuário ${targetUserName}`,
        target_user_id: targetUserId,
        target_user_name: targetUserName,
        timestamp: new Date().toISOString()
      }
    });

    if (error) throw error;

    return {
      success: true,
      message: `Simulação registrada em auditoria: Admin iniciou simulação do usuário ${targetUserName}`
    };

  } catch (error: any) {
    console.error("Erro ao registrar log de simulação:", error);
    return { success: false, error: error.message };
  }
}
