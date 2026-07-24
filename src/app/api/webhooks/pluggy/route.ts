import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Webhook Handler oficial para a API do Pluggy (Open Finance)
 * 
 * Este endpoint recebe as notificações de eventos bancários em tempo real da Pluggy.
 * Responde obrigatoriamente com status 2XX em menos de 5 segundos para evitar timeouts.
 */
export async function POST(req: Request) {
  try {
    const event = await req.json();
    console.log("🔌 [Pluggy Webhook] Evento recebido:", event.event);

    const supabase = await createClient();

    // Tratamento dinâmico dos tipos de evento sugeridos pela documentação da Pluggy
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
        // Processa e registra as transações bancárias automaticamente no banco
        const transactionData = event.data;
        if (transactionData) {
          // Busca o perfil do casal
          const { data: connection } = await supabase
            .from("profiles")
            .select("id, family_group_id")
            .limit(1)
            .single();

          if (connection) {
            // Mapeia categorias da Pluggy para as categorias da Fintech Casal
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
              console.log(`✅ [Pluggy Webhook] Lançamento de R$ ${transactionData.amount} registrado automaticamente!`);
            }
          }
        }
        break;

      default:
        console.log(`ℹ️ [Pluggy Webhook] Evento ignorado: ${event.event}`);
        break;
    }

    // Retorna resposta 200 OK dentro do limite de 5 segundos exigido pela API da Pluggy
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("❌ [Pluggy Webhook API] Erro de processamento:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
