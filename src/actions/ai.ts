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
    const systemPrompt = `
Você é o "Conselheiro IA", um mentor financeiro exclusivo da Fintech Casal especializado na estratégia "Operação de Choque".
Seu objetivo é ajudar este casal a sair das dívidas, otimizar despesas e alcançar estabilidade financeira de forma honesta, motivadora e direta.

DADOS REAIS DO CASAL NESTE MÊS DE ANÁLISE (${monthStr}):
- Renda Total Familiar: R$ ${strategy.totalIncome.toFixed(2)}
- Despesas Fixas Essenciais: R$ ${strategy.totalEssentialExpenses.toFixed(2)}
- Faturas de Cartão de Crédito: R$ ${strategy.totalCreditCardInvoices.toFixed(2)}
- Parcelas de Dívidas / Empréstimos: R$ ${strategy.totalDebtInstallments.toFixed(2)}
- Saldo Restante / Resíduo de Caixa Livre: R$ ${strategy.remainingCashResidue.toFixed(2)}
- Necessita de Plano de Choque?: ${strategy.isChoqueRequired ? "SIM, faturas estouram o caixa livre!" : "NÃO, caixa sob controle."}

AÇÕES RECOMENDADAS PELO MOTOR FINANCEIRO DO CASAL:
${strategy.cardActions.map((c: any) => `- Cartão ${c.cardName}: ${c.recommendation}`).join("\n")}
${strategy.debtActions.map((d: any) => `- Dívida ${d.debtTitle}: ${d.recommendation}`).join("\n")}

INSTRUÇÕES DE RESPOSTA E COMPORTAMENTO:
1. Responda em português de forma clara, amigável, concisa e altamente prática.
2. Limite suas respostas a no máximo 2 ou 3 parágrafos curtos.
3. Se o saldo livre for negativo e o usuário sugerir gastos supérfluos (como delivery, pizza, passeios, etc.), lembre-o com firmeza da regra de sobrevivência "Corte de Supérfluos" e sugira alternativas econômicas ou caseiras.
4. Nunca recomende novos empréstimos ou cartões de crédito.
5. Baseie suas respostas estritamente no histórico da conversa e no contexto financeiro fornecido do casal.
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
  
  if (strategy.remainingCashResidue <= 0 || strategy.isChoqueRequired) {
    if (query.includes("pizza") || query.includes("delivery") || query.includes("shopee") || query.includes("gastar") || query.includes("comprar")) {
      return `Alerta da Operação de Choque! Seu saldo de caixa livre está negativo neste mês de ${monthStr} (R$ ${strategy.remainingCashResidue.toFixed(2)}). Pedir delivery ou fazer compras supérfluas agora vai comprometer o pagamento das parcelas essenciais. Sugiro cozinhar juntos em casa para economizar e blindar seu orçamento!`;
    }
  }

  if (query.includes("lote") || query.includes("terreno") || query.includes("atraso")) {
    return `Para o financiamento do lote/terreno no mês de ${monthStr}, a nossa orientação tática é entrar em contato imediato com a loteadora e propor a 'Incorporação de Parcelas' atrasadas para o final do contrato. Isso limpa seu nome imediatamente e congela os juros de mora diários.`;
  }

  if (query.includes("cartao") || query.includes("fatura") || query.includes("neon") || query.includes("nubank")) {
    return `Para as faturas de cartão em ${monthStr}, a regra de ouro é bloquear os cartões no aplicativo para evitar novos gastos. O saldo livre de R$ ${strategy.remainingCashResidue.toFixed(2)} deve ser usado proporcionalmente como entrada para refinanciar as faturas no menor número de parcelas possível.`;
  }

  if (query.includes("emprestimo") || query.includes("banco")) {
    return `Mantenha as parcelas do empréstimo em dia para evitar juros de mora contratuais do banco. Assim que o fluxo aliviar nos próximos meses, utilize o excedente para amortizar as últimas parcelas de trás para frente, garantindo desconto nos juros embutidos.`;
  }

  if (query.includes("dezembro") || query.includes("fim de ano") || query.includes("natal")) {
    return `Analisando a sua previsão financeira de despesas para Dezembro (${monthStr}): a receita familiar cadastrada é de R$ ${strategy.totalIncome.toFixed(2)} e o resíduo estimado de caixa livre é de R$ ${strategy.remainingCashResidue.toFixed(2)}. ${
      strategy.isChoqueRequired 
        ? "Devido às faturas altas agendadas e parcelas em atraso de contratos anteriores, o caixa está no vermelho. Recomendo cortar 100% de gastos adicionais de final de ano (presentes caros, viagens extravagantes) e focar na blindagem de despesas básicas."
        : "Vocês possuem uma margem saudável! Mantenham as metas de poupança ativas e usem o excedente para criar uma reserva para despesas de início de ano (IPVA, IPTU)."
    }`;
  }

  return `Olá! Analisando seu fluxo de caixa para ${monthStr}, vocês têm R$ ${strategy.totalIncome.toFixed(2)} de receita familiar e R$ ${strategy.remainingCashResidue.toFixed(2)} livres após despesas fixas e dívidas. ${
    strategy.isChoqueRequired 
      ? "Como vocês estão no vermelho devido ao acúmulo de faturas, recomendo suspender o uso do crédito e focar apenas no PIX e no corte de supérfluos."
      : "Sua situação está estável! Continuem operando com controle e reservem o caixa para formar uma reserva de liquidez rápida."
  }`;
}
