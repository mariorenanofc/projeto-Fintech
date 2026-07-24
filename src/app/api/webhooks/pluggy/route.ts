import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Webhook Handler oficial para a API do Pluggy (Open Finance)
 * 
 * Este endpoint recebe as notificações de eventos bancários em tempo real da Pluggy.
 * É robusto para pings e requisições de testes vazias enviadas pelo painel da Pluggy.
 */
export async function POST(req: Request) {
  try {
    // 1. Lê o corpo bruto para evitar falha se for um ping vazio de teste da Pluggy
    const text = await req.text();
    if (!text || text.trim() === "") {
      console.log("🔌 [Pluggy Webhook] Ping de teste/registro recebido. Respondendo com 200.");
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // 2. Tenta decodificar o JSON com segurança
    let event: any;
    try {
      event = JSON.parse(text);
    } catch (parseError) {
      console.log("🔌 [Pluggy Webhook] Payload não é JSON (ping/teste). Respondendo com 200.");
      return NextResponse.json({ received: true }, { status: 200 });
    }

    console.log("🔌 [Pluggy Webhook] Evento recebido:", event?.event);

    // 3. Processamento dos eventos
    switch (event.event) {
      case "item/created":
        console.log(`ℹ️ [Pluggy Webhook] Conexão criada para o Item ID: ${event.itemId}`);
        break;

      case "item/updated":
        console.log(`ℹ️ [Pluggy Webhook] Conexão atualizada para o Item ID: ${event.itemId}`);
        break;

      case "item/error":
        console.error(`❌ [Pluggy Webhook] Erro na conexão do Item ID ${event.itemId}:`, event.error);
        break;

      case "transactions/created":
      case "transaction/created":
        const transactionData = event.data;
        if (transactionData) {
          try {
            const supabase = await createClient();

            // Busca o perfil do casal
            const { data: connection } = await supabase
              .from("profiles")
              .select("id, family_group_id")
              .limit(1)
              .single();

            if (connection) {
              const categoryMap: Record<string, string> = {
                "Food & Dining": "Alimentação",
                "Groceries": "Alimentação",
                "Restaurants": "Alimentação",
                "Entertainment": "Lazer",
                "Leisure": "Lazer",
                "Travel": "Lazer",
                "Transport": "Transporte",
                "Auto": "Transporte",
                "Health & Fitness": "Saúde",
                "Education": "Educação",
                "Bills & Utilities": "Moradia",
                "Home": "Moradia",
              };

              const mappedCategory = categoryMap[transactionData.category] || "Outros";
              const isIncome = transactionData.amount > 0;

              const { error: insertError } = await supabase.from("transactions").insert({
                family_group_id: connection.family_group_id,
                user_id: connection.id,
                description: `[Open Finance] ${transactionData.description}`,
                amount: Math.abs(transactionData.amount),
                type: isIncome ? "income" : "expense",
                category: mappedCategory,
                date: transactionData.date ? transactionData.date.substring(0, 10) : new Date().toISOString().substring(0, 10),
                payment_method: transactionData.type === "CREDIT" ? "credit_card" : "pix",
                created_at: new Date().toISOString(),
              });

              if (insertError) {
                console.error("❌ Erro ao lançar transação via Webhook Pluggy:", insertError);
              } else {
                console.log(`✅ [Pluggy Webhook] Lançamento de R$ ${transactionData.amount} registrado com sucesso!`);
              }
            }
          } catch (dbError) {
            console.error("❌ Erro ao conectar com o Supabase no Webhook:", dbError);
          }
        }
        break;

      default:
        console.log(`ℹ️ [Pluggy Webhook] Evento ignorado: ${event.event}`);
        break;
    }

    // Retorna sucesso para a Pluggy dentro do tempo exigido
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("❌ [Pluggy Webhook API] Erro de processamento:", error);
    // Sempre retornar 200 nas requisições de teste e registro da Pluggy para evitar falhas no dashboard
    return NextResponse.json({ received: false, error: error.message }, { status: 200 });
  }
}
