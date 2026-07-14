"use server";

import { createClient } from "@/lib/supabase/server";

interface BillData {
  title: string;
  dueDate: string;
  amount: number;
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
 * Server Action para criar um compromisso no Google Calendar do usuário.
 * Utiliza o provider_token do Google obtido via autenticação do Supabase.
 * Adiciona também o parceiro do grupo como attendee para refletir em ambas as agendas.
 */
export async function createCalendarEvent(billData: BillData) {
  try {
    const supabase = await createClient();
    
    // 1. Recupera a sessão atual do usuário
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return {
        success: false,
        error: "Usuário não autenticado no Supabase.",
        status: 401,
      };
    }

    // 2. Extrai o provider_token do Google
    const providerToken = session.provider_token;

    if (!providerToken) {
      return {
        success: false,
        error: "Token do Google (provider_token) não encontrado na sessão. Certifique-se de realizar o login com o Google Auth.",
        status: 400,
      };
    }

    // 3. Buscar e-mails dos parceiros no mesmo grupo familiar
    let partnerEmails: string[] = [];
    try {
      const familyGroupId = await getFamilyGroupId(supabase, session.user.id);
      const { data: partnerProfiles } = await supabase
        .from("profiles")
        .select("email")
        .eq("family_group_id", familyGroupId)
        .neq("id", session.user.id);
      
      if (partnerProfiles) {
        partnerEmails = partnerProfiles.map(p => p.email).filter(Boolean) as string[];
      }
    } catch (e) {
      console.warn("Não foi possível buscar parceiros para o convite da agenda:", e);
    }

    // 4. Configura as datas para o evento de dia inteiro no Google Calendar
    // O Google Calendar exige que a data de término (end.date) de um evento de dia inteiro seja exclusiva (dia seguinte).
    const startDate = billData.dueDate;
    const startTemp = new Date(startDate + "T00:00:00");
    startTemp.setDate(startTemp.getDate() + 1);
    
    // Formata o end.date como YYYY-MM-DD
    const endDate = startTemp.toISOString().split("T")[0];

    // 5. Monta a requisição para a API REST do Google Calendar
    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${providerToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: `Vencimento: ${billData.title}`,
          description: `Alerta automático da sua Fintech Casal. Conta: ${billData.title}. Valor: R$ ${billData.amount.toFixed(2)}.`,
          start: {
            date: startDate,
          },
          end: {
            date: endDate,
          },
          // Inclui o parceiro como convidado (attendee) para que o evento reflita e seja sincronizado no Google Agenda de ambos
          attendees: partnerEmails.map(email => ({ email })),
          reminders: {
            useDefault: false,
            overrides: [
              { method: "popup", minutes: 1440 }, // Lembrete na tela 1 dia antes (1440 min)
              { method: "email", minutes: 1440 }, // Lembrete por e-mail 1 dia antes
            ],
          },
        }),
      }
    );

    // 6. Trata o resultado da API do Google
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Token expirado (Erro 401 Unauthorized do Google)
      if (response.status === 401) {
        return {
          success: false,
          error: "O token do Google expirou (vida útil de 1 hora). É necessário renová-lo.",
          status: 401,
          details: errorData,
        };
      }

      return {
        success: false,
        error: errorData.error?.message || `Erro do Google Calendar API: ${response.statusText}`,
        status: response.status,
        details: errorData,
      };
    }

    const eventData = await response.json();
    
    return {
      success: true,
      eventId: eventData.id,
      htmlLink: eventData.htmlLink,
    };

  } catch (error: any) {
    console.error("Erro na Server Action createCalendarEvent:", error);
    return {
      success: false,
      error: error.message || "Erro interno do servidor.",
      status: 500,
    };
  }
}
