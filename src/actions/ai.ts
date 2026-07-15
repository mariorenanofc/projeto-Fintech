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

    // 4. Buscar a estratégia financeira real do mês selecionado ou atual
    const monthStr = selectedMonthStr || new Date().toISOString().substring(0, 7);
    const strategy = await generateFinancialStrategy(monthStr);

    // 5. Construir o Prompt de Contexto (Instrução do Sistema) para a LLM
    const totalCommitments = strategy.totalDebtInstallments + strategy.totalCreditCardInvoices;
    const isChoque = strategy.isChoqueRequired;

    const systemPrompt = `
Você é o "Conselheiro IA", um mentor financeiro exclusivo da Fintech Casal.
Seu objetivo é ajudar este casal a sair das dívidas, otimizar despesas e alcançar estabilidade financeira de forma empática, motivadora e direta.

DADOS REAIS DO CASAL NESTE MÊS DE ANÁLISE (${monthStr}):
- Renda Total Familiar: R$ ${strategy.totalIncome.toFixed(2)}
- Custo de Vida Essencial: R$ ${strategy.totalEssentialExpenses.toFixed(2)}
- Saldo Disponível para Dívidas: R$ ${strategy.disposableIncomeForDebts.toFixed(2)}
- Faturas de Cartão de Crédito: R$ ${strategy.totalCreditCardInvoices.toFixed(2)}
- Dívidas Fixas (Empréstimos/Carnês): R$ ${strategy.totalDebtInstallments.toFixed(2)}
- Total de Compromissos (Dívidas + Cartões): R$ ${totalCommitments.toFixed(2)}
- Resíduo de Caixa Restante pós-alocação: R$ ${strategy.remainingCashResidue.toFixed(2)}
- Estado Atual: ${isChoque ? "🔴 OPERAÇÃO DE CHOQUE (Compromissos > Saldo Disponível)" : "🟢 SAUDÁVEL (Regra 50/30/20)"}

AÇÕES TÁTICAS DO MOTOR FINANCEIRO PARA ESTE MÊS:
${strategy.debtActions.map((d: any) => `- Dívida/Lote '${d.debtTitle}': ${d.recommendation}`).join("\n")}
${strategy.cardActions.map((c: any) => `- Cartão '${c.cardName}': ${c.recommendation}`).join("\n")}

INSTRUÇÕES DE COMPORTAMENTO:
1. Responda em português de forma calorosa, amigável, concisa e prática. No máximo 2 ou 3 parágrafos curtos.
2. Se estiverem na 🔴 OPERAÇÃO DE CHOQUE:
   - O saldo livre é negativo ou insuficiente. Se eles sugerirem gastos supérfluos (delivery, passeios caros, roupas), lembre-os com carinho de priorizar o básico (PIX/Débito) e cortar os supérfluos, sugerindo programas caseiros e baratos.
   - Reforce a urgência da "Alocação Crítica" (pagar dívidas fixas integralmente) e da "Engenharia Financeira" (parcelar faturas de cartão grandes usando apenas o resíduo de caixa como entrada).
3. Se estiverem 🟢 SAUDÁVEIS:
   - Estão com saldo positivo. Recomende aplicar a regra 50/30/20. Sugira usar 30% da renda total para lazer sem culpa e destinar 20% para montar a Reserva de Emergência ou investir.
4. Nunca recomende novos empréstimos, consórcios ou uso desnecessário de crédito.
5. Baseie suas orientações no histórico e nos números informados acima, sem inventar valores.
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
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: contentsPayload,
            systemInstruction: {
              parts: [{ text: systemPrompt }]
            },
            generationConfig: {
              maxOutputTokens: 600,
              temperature: 0.2
            }
          })
        }
      );

      if (response.ok) {
        const result = await response.json();
        replyText = result.candidates?.[0]?.content?.parts?.[0]?.text || "Desculpe, não consegui formular a resposta.";
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
 * Fallback de IA inteligente para quando a API Key não está disponível,
 * simulando conselhos com base na regra de negócio real.
 */
function getFallbackAdvisorResponse(question: string, strategy: any, monthStr: string): string {
  const query = question.toLowerCase();
  
  if (strategy.isChoqueRequired) {
    if (query.includes("pizza") || query.includes("delivery") || query.includes("shopee") || query.includes("gastar") || query.includes("comprar")) {
      return `Alerta da Operação de Choque! O total de compromissos deste mês ultrapassa o nosso Saldo Disponível em ${monthStr}. Pedir delivery ou fazer compras agora vai comprometer nossa Engenharia Financeira. Que tal cozinharmos juntos em casa para economizar e blindar nosso orçamento?`;
    }
  } else {
    if (query.includes("investir") || query.includes("poupar") || query.includes("reserva")) {
      return `Que iniciativa fantástica! Como estamos na zona Verde (Regra 50/30/20), temos R$ ${strategy.remainingCashResidue.toFixed(2)} livres de resíduo. É o momento perfeito para transferir esse dinheiro para uma conta que renda 100% do CDI ou para o Tesouro Direto!`;
    }
  }

  if (query.includes("lote") || query.includes("terreno") || query.includes("atraso")) {
    return `Para dívidas como terrenos e lotes, a nossa prioridade na Alocação Crítica é pagar integralmente a parcela atual. Se houver atrasos, entrem em contato imediato para propor a 'Incorporação de Parcelas' para o final do contrato, travando os juros!`;
  }

  if (query.includes("cartao") || query.includes("fatura") || query.includes("neon") || query.includes("nubank")) {
    return strategy.isChoqueRequired 
      ? `Ação de Engenharia Financeira: O saldo restante que temos deve ser usado como entrada no parcelamento de faturas grandes que não conseguimos cobrir. Bloqueie os cartões no app para estancar os gastos de imediato.`
      : `Vocês possuem saldo saudável de R$ ${strategy.remainingCashResidue.toFixed(2)}. Paguem o valor integral das faturas para evitar qualquer juro rotativo e manterem o Score excelente!`;
  }

  if (query.includes("emprestimo") || query.includes("banco")) {
    return `Ação de Alocação Crítica: Mantenham as parcelas do empréstimo em dia para proteger o patrimônio e evitar juros. Assim que estivermos totalmente no verde, utilizem o excedente mensal para amortizar o contrato de trás para frente!`;
  }

  return `Olá! Analisando nosso fluxo para ${monthStr}: Temos R$ ${strategy.totalIncome.toFixed(2)} de receita e um saldo disponível de R$ ${strategy.disposableIncomeForDebts.toFixed(2)}. ${
    strategy.isChoqueRequired 
      ? "Devido às faturas altas agendadas, estamos na Operação de Choque. Foquem nos pagamentos via PIX/Débito e nas Ações de Engenharia Financeira recomendadas no Dashboard."
      : "Situação 100% controlada (Regra 50/30/20)! Mantenham os limites e usem o excedente mensal para a Reserva de Emergência."
  }`;
}
