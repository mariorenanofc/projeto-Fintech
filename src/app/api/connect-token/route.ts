import { NextResponse } from "next/server";

/**
 * API Route para gerar o Connect Token da Pluggy
 * 
 * Este token temporário de acesso permite renderizar com segurança o Pluggy Connect Widget
 * no frontend sem expor as chaves de API secretas (Client ID / Client Secret).
 */
export async function POST(req: Request) {
  try {
    const clientId = process.env.PLUGGY_CLIENT_ID || process.env.CLIENT_ID;
    const clientSecret = process.env.PLUGGY_CLIENT_SECRET || process.env.CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Chaves de API do Pluggy ausentes no arquivo .env" }, 
        { status: 500 }
      );
    }

    // 1. Autenticar na API da Pluggy para obter a apiKey temporária
    const authRes = await fetch("https://api.pluggy.ai/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clientId,
        clientSecret,
      }),
    });

    if (!authRes.ok) {
      const errText = await authRes.text();
      throw new Error(`Falha na autenticação da Pluggy: ${errText}`);
    }

    const { apiKey } = await authRes.json();

    // 2. Solicitar o Connect Token para o Widget
    const tokenRes = await fetch("https://api.pluggy.ai/connect_tokens", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({
        // Opcional: Vincular um ID de usuário se desejar rastrear
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      throw new Error(`Falha ao gerar o connect token da Pluggy: ${errText}`);
    }

    const connectTokenData = await tokenRes.json();

    return NextResponse.json({ accessToken: connectTokenData.accessToken });
  } catch (error: any) {
    console.error("❌ [Pluggy Connect Token API] Erro:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
