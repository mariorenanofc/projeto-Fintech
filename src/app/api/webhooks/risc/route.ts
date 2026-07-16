import { NextResponse } from "next/server";
import { createRemoteJWKSet, jwtVerify } from "jose";

export async function POST(req: Request) {
  try {
    // O Google envia o token JWT como o corpo bruto da requisição
    // O Content-Type costuma ser application/secevent+jwt
    const token = await req.text();

    if (!token) {
      return new NextResponse("Token ausente", { status: 400 });
    }

    // 1. Configura as chaves públicas do Google para validar a assinatura do token
    const JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

    // 2. Valida o JWT
    // Se o token for inválido, a função jwtVerify disparará um erro
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: ["accounts.google.com", "https://accounts.google.com/"],
    });

    console.log("🔒 [RISC] Evento de Segurança Recebido:", payload);

    // 3. (Opcional) Implementar a lógica de proteção de contas
    // Para a aprovação do Google, apenas processar e retornar 202 já é suficiente.

    // O Google exige a resposta HTTP 202 Accepted se o token for válido e processado.
    return new NextResponse(null, { status: 202 });
  } catch (error) {
    console.error("❌ [RISC] Erro ao validar o token do webhook:", error);
    // Retorna 400 em caso de token inválido ou erro de decodificação
    return new NextResponse("Bad Request", { status: 400 });
  }
}
