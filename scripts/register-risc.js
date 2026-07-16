const { GoogleAuth } = require('google-auth-library');
const fs = require('fs');

async function configureEventStream() {
  try {
    console.log("Iniciando configuração do Webhook RISC (Proteção entre Contas)...");
    
    // Configuração do Google Auth com a chave da Service Account
    // O arquivo 'service-account-key.json' deve estar na mesma pasta
    const auth = new GoogleAuth({
      keyFile: './service-account-key.json',
      scopes: ['https://www.googleapis.com/auth/risc.configuration.readwrite'],
    });

    const client = await auth.getClient();
    
    const receiverEndpoint = "https://fintechcasal.com.br/api/webhooks/risc";
    const eventsRequested = [
      "https://schemas.openid.net/secevent/risc/event-type/account-credential-change-required",
      "https://schemas.openid.net/secevent/risc/event-type/account-disabled",
      "https://schemas.openid.net/secevent/risc/event-type/account-enabled",
      "https://schemas.openid.net/secevent/oauth/event-type/tokens-revoked",
      "https://schemas.openid.net/secevent/oauth/event-type/token-revoked"
    ];

    const streamConfig = {
      delivery: {
        delivery_method: "https://schemas.openid.net/secevent/risc/delivery-method/push",
        url: receiverEndpoint
      },
      events_requested: eventsRequested
    };

    console.log(`📡 Registrando endpoint: ${receiverEndpoint}`);
    
    // Fazer a requisição para registrar o webhook
    const res = await client.request({
      url: 'https://risc.googleapis.com/v1beta/stream:update',
      method: 'POST',
      data: streamConfig,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (res.status === 200) {
      console.log("✅ SUCESSO! A Proteção entre Contas (RISC) foi ativada e o webhook foi registrado.");
    } else {
      console.log("⚠️ A requisição terminou, mas retornou o status:", res.status);
    }
  } catch (error) {
    console.error("❌ ERRO ao registrar o webhook:");
    if (error.response && error.response.data) {
      console.error(error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

configureEventStream();
