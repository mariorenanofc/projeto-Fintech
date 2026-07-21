"use server";

import { createClient } from "@/lib/supabase/server";
import { generateFinancialStrategy } from "./onboarding";

interface ChatMessage {
  role: "user" | "model";
  content: string;
}

/**
 * Server Action para consultar o saldo de tokens da carteira do casal
 */
export async function getAiTokenBalance() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, balance: 0 };

    const { data: profile } = await supabase
      .from("profiles")
      .select("family_group_id")
      .eq("id", user.id)
      .single();

    if (!profile) return { success: false, balance: 0 };

    const { data: wallet } = await supabase
      .from("ai_tokens_wallet")
      .select("balance")
      .eq("family_group_id", profile.family_group_id)
      .single();

    return { 
      success: true, 
      balance: wallet ? wallet.balance : 0 
    };

  } catch (error) {
    console.error("Erro ao buscar saldo de tokens:", error);
    return { success: false, balance: 0 };
  }
}

/**
 * Interceptador / Middleware de Rate Limiting para proteger custos de IA (FinOps).
 * Regra: Máximo 5 requisições de IA por casal / usuário por janela de 1 hora.
 */
export async function verifyAiRateLimit(userId: string, familyGroupId?: string, actionType = "chat") {
  try {
    const supabase = await createClient();
    
    // Define o início da janela de 1 hora
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    // Consulta no Supabase filtrando por família/usuário na última 1 hora
    let query = supabase
      .from("ai_requests_log")
      .select("created_at")
      .gte("created_at", oneHourAgo)
      .order("created_at", { ascending: true });

    if (familyGroupId) {
      query = query.or(`family_group_id.eq.${familyGroupId},user_id.eq.${userId}`);
    } else {
      query = query.eq("user_id", userId);
    }

    const { data: requests, error } = await query;

    if (error) {
      console.warn("Aviso ao consultar rate limit em ai_requests_log:", error.message);
      return { allowed: true, count: 0 };
    }

    const requestCount = requests ? requests.length : 0;
    const MAX_REQUESTS_PER_HOUR = 5;

    if (requestCount >= MAX_REQUESTS_PER_HOUR) {
      // Calcula quantos minutos faltam para a requisição mais antiga expirar da janela de 1 hora
      const oldestRequestTime = new Date(requests[0].created_at).getTime();
      const resetTime = oldestRequestTime + 60 * 60 * 1000;
      const minutesRemaining = Math.max(1, Math.ceil((resetTime - Date.now()) / (1000 * 60)));

      return {
        allowed: false,
        error: `Sua cota de conselhos de IA desta hora acabou. Voltamos em ${minutesRemaining} minuto(s).`,
        status: 429,
        minutesRemaining,
        count: requestCount,
      };
    }

    return { allowed: true, count: requestCount };

  } catch (err) {
    console.error("Erro inesperado no verifyAiRateLimit:", err);
    return { allowed: true, count: 0 };
  }
}

/**
 * Server Action para enviar a pergunta do usuário para a IA,
 * validando o saldo de tokens e debitando após a resposta da LLM.
 */
export async function askFinancialAdvisor(question: string, history: ChatMessage[] = [], selectedMonthStr?: string) {
  try {
    const supabase = await createClient();
    
    // 1. Validar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Usuário não autenticado.", status: 401 };
    }

    // 2. Obter o perfil e grupo familiar
    const { data: profile } = await supabase
      .from("profiles")
      .select("family_group_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return { success: false, error: "Perfil ou Grupo Familiar não encontrado.", status: 404 };
    }

    const familyGroupId = profile.family_group_id;

    // 2.1. Interceptador de Rate Limit (FinOps - 5 requisições de IA por hora)
    const rateLimit = await verifyAiRateLimit(user.id, familyGroupId, "chat");
    if (!rateLimit.allowed) {
      return { 
        success: false, 
        error: rateLimit.error, 
        status: 429,
        minutesRemaining: rateLimit.minutesRemaining
      };
    }

    // 3. Consultar a carteira de tokens
    const { data: wallet } = await supabase
      .from("ai_tokens_wallet")
      .select("balance")
      .eq("family_group_id", familyGroupId)
      .single();

    const currentBalance = wallet ? wallet.balance : 0;
    if (currentBalance <= 0) {
      return { 
        success: false, 
        error: "Saldo de tokens insuficiente (Carteira zerada). Por favor, realize uma recarga.", 
        status: 402 
      };
    }

    // 3.1. Verificar quota individual diária de tokens do parceiro (Controle de Gasto Individual)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStartStr = todayStart.toISOString();

    const { data: logs, error: logsError } = await supabase
      .from("ai_calls_log")
      .select("prompt_tokens, completion_tokens")
      .eq("profile_id", user.id)
      .gte("created_at", todayStartStr);

    if (!logsError && logs) {
      const todayTotal = logs.reduce((sum, log) => sum + (log.prompt_tokens || 0) + (log.completion_tokens || 0), 0);
      const DAILY_LIMIT = 20000; // 20.000 tokens diários por parceiro
      if (todayTotal >= DAILY_LIMIT) {
        return { 
          success: false, 
          error: "Você atingiu seu limite diário de uso da IA (20.000 tokens). Para evitar que um parceiro consuma todo o saldo do casal, limitamos o uso diário individual.", 
          status: 403 
        };
      }
    }

    // Registrar o log da requisição no banco para contabilizar na janela de 1 hora
    try {
      await supabase.from("ai_requests_log").insert({
        user_id: user.id,
        family_group_id: familyGroupId,
        action_type: "chat"
      });
    } catch (e) {
      console.warn("Aviso ao registrar log em ai_requests_log:", e);
    }

    // 4. Buscar a estratégia financeira real do mês selecionado ou atual
    const monthStr = selectedMonthStr || new Date().toISOString().substring(0, 7);
    const strategy = await generateFinancialStrategy(monthStr);

    // 5. Construir o Prompt de Contexto (Instrução do Sistema) para a LLM
    const totalCommitments = strategy.totalDebtInstallments + strategy.totalCreditCardInvoices;

    const stageStr = 
      strategy.financialStage === "red" ? "🔴 VERMELHO (Fase de Resgate - Foco em quitar dívidas)" : 
      strategy.financialStage === "yellow" ? "🟡 AMARELO (Fase de Segurança - Foco em montar Fundo de Reserva)" : 
      "🟢 VERDE (Fase de Prosperidade - Foco em Investimentos e Regra 50/30/20)";

    const systemPrompt = `
Você é o "Conselheiro IA", um mentor financeiro exclusivo da Fintech Casal.
Seu objetivo é ajudar este casal a progredir em sua jornada financeira através de 3 estágios (Vermelho -> Amarelo -> Verde) de forma empática, motivadora e direta, respeitando o "Design Emocional" e distinguindo dívidas tóxicas de estruturais.

DADOS REAIS DO CASAL NESTE MÊS DE ANÁLISE (${monthStr}):
- Renda Total Familiar: R$ ${strategy.totalIncome.toFixed(2)}
- Custo de Vida Essencial Real: R$ ${strategy.essentialsValue.toFixed(2)}
- Faturas de Cartão de Crédito: R$ ${strategy.totalCreditCardInvoices.toFixed(2)}
- Dívidas Tóxicas (Curto Prazo/Empréstimos): R$ ${strategy.toxicDebtsValue.toFixed(2)}
- Dívidas Estruturais (Financiamentos Patrimônio/Consórcios): R$ ${strategy.estruturalDebtsValue.toFixed(2)}
- Trava de Lazer do Casal (Design Emocional): R$ ${strategy.lazerTravaValue.toFixed(2)}
- Aporte/Reserva de Manutenção: R$ ${strategy.reserveMaintenanceValue.toFixed(2)}
- Valor Foco Sugerido (Sobra): R$ ${strategy.focusValue.toFixed(2)}
- Estágio Financeiro Atual: ${stageStr}
- Reserva Financeira Atual: R$ ${strategy.reservaFinanceiraAtual.toFixed(2)} (Meta: R$ ${strategy.reservaMeta.toFixed(2)})
- Total em Investimentos: R$ ${strategy.investimentosTotal.toFixed(2)}
- Alerta Risco de Insolvência: ${strategy.isInsolvencyRisk ? "SIM (Atenção Máxima!)" : "NÃO"}

AÇÕES TÁTICAS DO MOTOR FINANCEIRO PARA ESTE MÊS:
${strategy.debtActions.map((d: any) => `- Dívida/Lote '${d.debtTitle}': ${d.recommendation}`).join("\n")}
${strategy.cardActions.map((c: any) => `- Cartão '${c.cardName}': ${c.recommendation}`).join("\n")}

INSTRUÇÕES DE COMPORTAMENTO COM BASE NO ESTÁGIO:
1. Responda em português de forma calorosa, amigável, concisa e prática. No máximo 2 ou 3 parágrafos curtos.
2. Se houver Risco de Insolvência: ignore a trava de Lazer e recomende cortes severos de custos essenciais para sobrevivência imediata.
3. Se o estágio for 🔴 VERMELHO (Fase de Resgate):
   - Priorizar a trava emocional de Lazer (R$ ${strategy.lazerTravaValue.toFixed(2)}) para o casal não desanimar, e orientar focar 100% da sobra (R$ ${strategy.focusValue.toFixed(2)}) em amortizar as dívidas tóxicas.
4. Se o estágio for 🟡 AMARELO (Fase de Segurança):
   - Celebrar a falta de dívidas tóxicas. Lazer está em 12% da renda. Orientar direcionar 100% da sobra (R$ ${strategy.focusValue.toFixed(2)}) para construir a Reserva de Emergência até a meta de R$ ${strategy.reservaMeta.toFixed(2)}.
5. Se o estágio for 🟢 VERDE (Fase de Prosperidade):
   - Celebrar a solidez financeira. Reserva de manutenção ativa (7%). Recomendar investir o valor foco (R$ ${strategy.focusValue.toFixed(2)}) em ativos financeiros de longo prazo.
6. Nunca recomende novos empréstimos, consórcios ou uso desnecessário de crédito.
7. Baseie suas orientações no histórico e nos números informados acima, sem inventar valores.
8. Engenharia de Cartões: Se sugerir parcelar a fatura, alerte de forma clara que os bancos normalmente exigem uma entrada de 10% a 15% do valor da fatura. Se a sobra orçamentária recomendada para a entrada for menor do que 10%, avise que a entrada pode não ser aceita diretamente e instrua o casal a entrar em contato com o banco para renegociação total ou consolidação. Caso queiram simular o custo do rotativo, peça as taxas de juros mensais dos cartões deles para calcular e demonstrar o impacto do parcelamento sobre a dívida orçada.
    `;

    let replyText = "";
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (GEMINI_API_KEY) {
      // Chamada HTTP REST para a API do Google Gemini (utilizando o modelo de chat com histórico e systemInstruction)
      const contentsPayload = [
        ...history.map(msg => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }]
        })),
        {
          role: "user",
          parts: [{ text: question }]
        }
      ];

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: contentsPayload,
            systemInstruction: {
              parts: [{ text: systemPrompt }]
            },
            generationConfig: {
              maxOutputTokens: 8192,
              temperature: 0.7
            }
          })
        }
      );

      if (response.ok) {
        const result = await response.json();
        const candidate = result.candidates?.[0];
        console.log("Finish Reason da IA:", candidate?.finishReason);
        replyText = candidate?.content?.parts?.[0]?.text || "Desculpe, não consegui formular a resposta.";
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Erro da API do Gemini:", errorData);
        replyText = getFallbackAdvisorResponse(question, strategy, monthStr);
      }
    } else {
      // Fallback estático inteligente caso não haja chave Gemini configurada
      replyText = getFallbackAdvisorResponse(question, strategy, monthStr);
    }

    // 6. Calcular a estimativa de tokens consumidos
    const promptLen = systemPrompt.length + JSON.stringify(history).length;
    const replyLen = replyText.length;
    const promptTokens = Math.ceil(promptLen / 4);
    const completionTokens = Math.ceil(replyLen / 4);

    // 7. Gravar no log de chamadas Supabase (o trigger de banco reduzirá o saldo da carteira)
    await supabase.from("ai_calls_log").insert({
      family_group_id: familyGroupId,
      profile_id: user.id,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      action_type: "chat"
    });

    // 8. Salvar as mensagens no histórico do casal (Banco de Dados)
    await supabase.from("ai_chat_messages").insert([
      {
        family_group_id: familyGroupId,
        profile_id: user.id,
        role: "user",
        content: question
      },
      {
        family_group_id: familyGroupId,
        profile_id: user.id,
        role: "model",
        content: replyText
      }
    ]);

    return { 
      success: true, 
      answer: replyText,
      tokensUsed: promptTokens + completionTokens
    };

  } catch (error: any) {
    console.error("Erro na Server Action askFinancialAdvisor:", error);
    return { success: false, error: error.message || "Erro interno do servidor.", status: 500 };
  }
}

/**
 * Server Action para buscar o histórico de conversas do grupo familiar
 */
export async function getChatHistory(limit = 50) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, messages: [] };

    const { data: profile } = await supabase
      .from("profiles")
      .select("family_group_id")
      .eq("id", user.id)
      .single();

    if (!profile) return { success: false, messages: [] };

    const { data: messages, error } = await supabase
      .from("ai_chat_messages")
      .select("role, content, created_at")
      .eq("family_group_id", profile.family_group_id)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) throw error;

    return { success: true, messages: messages || [] };
  } catch (error) {
    console.error("Erro ao buscar histórico de chat:", error);
    return { success: false, messages: [] };
  }
}

/**
 * Fallback de IA inteligente para quando a API Key não está disponível,
 * simulando conselhos com base na regra de negócio real.
 */
function getFallbackAdvisorResponse(question: string, strategy: any, monthStr: string): string {
  const query = question.toLowerCase();
  
  if (strategy.isInsolvencyRisk) {
    return `Alerta crítico de Risco de Insolvência! Nossa soma de Gastos Essenciais e Parcelas Estruturais consome mais de 100% de nossa renda. Precisamos suspender a trava de lazer e focar em cortes imediatos e severos de despesas básicas para reestruturar nossa vida financeira.`;
  }

  if (strategy.financialStage === "red") {
    if (query.includes("pizza") || query.includes("delivery") || query.includes("shopee") || query.includes("gastar") || query.includes("comprar")) {
      return `Como estamos na Fase Vermelha de Resgate, garantimos a trava de lazer emocional de R$ ${strategy.lazerTravaValue.toFixed(2)} para respirarmos. No entanto, qualquer gasto extra além desse limite deve ser evitado para que possamos destinar a sobra de R$ ${strategy.focusValue.toFixed(2)} para quitar as dívidas tóxicas!`;
    }
  } else if (strategy.financialStage === "yellow") {
    if (query.includes("investir") || query.includes("poupar") || query.includes("reserva")) {
      return `Excelente iniciativa! Como estamos na Fase Amarela de Segurança, nosso lazer emocional está garantido em R$ ${strategy.lazerTravaValue.toFixed(2)} (12%). A sobra total de R$ ${strategy.focusValue.toFixed(2)} deve ser direcionada integralmente ao nosso Fundo de Reserva de Emergência até atingirmos a meta de R$ ${strategy.reservaMeta.toFixed(2)}.`;
    }
  } else if (strategy.financialStage === "green") {
    if (query.includes("investir") || query.includes("poupar") || query.includes("reserva")) {
      return `Parabéns, casal! Como estamos na Fase Verde de Prosperidade, nossa reserva está completa. Nosso lazer está garantido em 12% (R$ ${strategy.lazerTravaValue.toFixed(2)}) e direcionamos R$ ${strategy.reserveMaintenanceValue.toFixed(2)} (7%) para continuar encorpando a reserva. O saldo livre de R$ ${strategy.focusValue.toFixed(2)} está totalmente liberado para novos investimentos!`;
    }
  }

  if (query.includes("lote") || query.includes("terreno") || query.includes("atraso")) {
    return `Para dívidas como terrenos e lotes (estruturais), a nossa prioridade é manter as parcelas em dia para proteger o patrimônio. Se houver atrasos, entrem em contato imediato para propor a 'Incorporação de Parcelas' para o final do contrato.`;
  }

  if (query.includes("cartao") || query.includes("fatura") || query.includes("neon") || query.includes("nubank")) {
    return strategy.financialStage === "red"
      ? `Como estamos na Fase Vermelha, faturas de cartão são tratadas como dívidas tóxicas prioritárias. Use a sobra planejada de R$ ${strategy.focusValue.toFixed(2)} para quitá-las e bloqueie novos gastos de imediato.`
      : `Vocês possuem saldo saudável. Paguem o valor integral das faturas para evitar qualquer juro rotativo!`;
  }

  if (query.includes("emprestimo") || query.includes("banco")) {
    return `Mantenham as parcelas do empréstimo em dia para evitar multas. Se for uma dívida tóxica, usem a sobra de R$ ${strategy.focusValue.toFixed(2)} para amortizá-la de trás para frente.`;
  }

  return `Olá! Analisando nosso fluxo para ${monthStr}: Temos R$ ${strategy.totalIncome.toFixed(2)} de renda familiar. ${
    strategy.isInsolvencyRisk
      ? "Atenção: Estamos sob risco crítico de insolvência! Suspenda o lazer e corte despesas básicas."
      : strategy.financialStage === "red" 
      ? `Estamos na Fase Vermelha (Resgate). Garantimos R$ ${strategy.lazerTravaValue.toFixed(2)} para lazer emocional. A sobra de R$ ${strategy.focusValue.toFixed(2)} deve ir para quitar as dívidas tóxicas.`
      : strategy.financialStage === "yellow"
      ? `Estamos na Fase Amarela (Segurança). Nosso lazer é R$ ${strategy.lazerTravaValue.toFixed(2)}. Direcione a sobra de R$ ${strategy.focusValue.toFixed(2)} para o Fundo de Reserva (Meta: R$ ${strategy.reservaMeta.toFixed(2)}).`
      : `Estamos na Fase Verde (Prosperidade)! Nosso lazer é R$ ${strategy.lazerTravaValue.toFixed(2)}. Destinamos R$ ${strategy.reserveMaintenanceValue.toFixed(2)} à reserva, e R$ ${strategy.focusValue.toFixed(2)} está livre para novos investimentos!`
  }`;
}
