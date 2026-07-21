/**
 * Tabela Oficial de Taxas Médias de Juros Bancários do Brasil
 * Fonte: Banco Central do Brasil (BCB) / Relatórios de Crédito Rotativo e Empréstimos
 */

export interface BankRateInfo {
  name: string;
  monthlyRate: number; // Em porcentagem (ex: 12.5 para 12.5% a.m.)
  annualRate: number;  // Em porcentagem (ex: 310 para 310% a.a.)
  category: "tradicional" | "fintech" | "cooperativa_loja" | "financeira";
  maintenanceFeeInfo: string;
}

export const BANK_RATES_DATABASE: BankRateInfo[] = [
  // 🏛️ Grandes Bancos Tradicionais
  { name: "Banco do Brasil", monthlyRate: 10.2, annualRate: 220.0, category: "tradicional", maintenanceFeeInfo: "Possui pacotes isentos (Essenciais) ou tarifas de R$ 30 a R$ 50" },
  { name: "Caixa Econômica", monthlyRate: 10.9, annualRate: 240.0, category: "tradicional", maintenanceFeeInfo: "Isenta nos serviços essenciais" },
  { name: "Bradesco", monthlyRate: 14.8, annualRate: 410.0, category: "tradicional", maintenanceFeeInfo: "Isenta nos serviços essenciais" },
  { name: "Itaú Unibanco", monthlyRate: 15.1, annualRate: 425.0, category: "tradicional", maintenanceFeeInfo: "Isenta nos serviços essenciais" },
  { name: "Santander Brasil", monthlyRate: 15.4, annualRate: 440.0, category: "tradicional", maintenanceFeeInfo: "Cobrança mensal caso não cumpra critérios de fidelidade" },
  { name: "Banco Safra", monthlyRate: 9.5, annualRate: 200.0, category: "tradicional", maintenanceFeeInfo: "Isenta dependendo do volume de investimentos" },
  { name: "Banrisul", monthlyRate: 12.3, annualRate: 300.0, category: "tradicional", maintenanceFeeInfo: "Cobrança conforme pacote tradicional" },
  { name: "Banco do Nordeste", monthlyRate: 10.5, annualRate: 230.0, category: "tradicional", maintenanceFeeInfo: "Isenta nos serviços essenciais" },
  { name: "Banco da Amazônia", monthlyRate: 11.2, annualRate: 250.0, category: "tradicional", maintenanceFeeInfo: "Cobrança padrão de conta corrente comercial" },
  { name: "Banco BMG", monthlyRate: 15.9, annualRate: 470.0, category: "tradicional", maintenanceFeeInfo: "Conta digital gratuita" },

  // 📱 Bancos Virtuais e Fintechs
  { name: "Nubank", monthlyRate: 12.5, annualRate: 310.0, category: "fintech", maintenanceFeeInfo: "Totalmente Gratuita (Zero anuidade)" },
  { name: "Banco Inter", monthlyRate: 11.8, annualRate: 280.0, category: "fintech", maintenanceFeeInfo: "Totalmente Gratuita" },
  { name: "C6 Bank", monthlyRate: 14.9, annualRate: 415.0, category: "fintech", maintenanceFeeInfo: "Gratuita (Tarifa apenas se conta inativa)" },
  { name: "Neon", monthlyRate: 13.9, annualRate: 370.0, category: "fintech", maintenanceFeeInfo: "Gratuita" },
  { name: "PagBank", monthlyRate: 14.5, annualRate: 395.0, category: "fintech", maintenanceFeeInfo: "Gratuita" },
  { name: "Mercado Pago", monthlyRate: 15.2, annualRate: 430.0, category: "fintech", maintenanceFeeInfo: "Totalmente Gratuita" },
  { name: "PicPay", monthlyRate: 14.8, annualRate: 410.0, category: "fintech", maintenanceFeeInfo: "Gratuita" },
  { name: "Banco Pan", monthlyRate: 15.3, annualRate: 435.0, category: "fintech", maintenanceFeeInfo: "Gratuita para pacotes digitais básicos" },
  { name: "Sofisa Direto", monthlyRate: 10.1, annualRate: 215.0, category: "fintech", maintenanceFeeInfo: "Totalmente Gratuita" },
  { name: "Superdigital", monthlyRate: 15.5, annualRate: 445.0, category: "fintech", maintenanceFeeInfo: "Gratuita gastando valor mínimo" },

  // 💳 Cooperativas e Cartões de Loja
  { name: "Sicoob", monthlyRate: 9.7, annualRate: 205.6, category: "cooperativa_loja", maintenanceFeeInfo: "Cooperativa de crédito" },
  { name: "Sicredi", monthlyRate: 10.2, annualRate: 220.1, category: "cooperativa_loja", maintenanceFeeInfo: "Sistema cooperativo nacional" },
  { name: "BrasilCard", monthlyRate: 16.9, annualRate: 535.0, category: "cooperativa_loja", maintenanceFeeInfo: "Cartão de loja private label" },
  { name: "Will Bank", monthlyRate: 14.7, annualRate: 410.2, category: "cooperativa_loja", maintenanceFeeInfo: "Banco digital focado no Nordeste" },
  { name: "Agibank", monthlyRate: 15.2, annualRate: 430.9, category: "cooperativa_loja", maintenanceFeeInfo: "Foco em beneficiários do INSS" },

  // 🏦 Financeiras de Crédito Direto
  { name: "Crefisa", monthlyRate: 20.1, annualRate: 802.4, category: "financeira", maintenanceFeeInfo: "Foco em negativados e servidores" },
  { name: "Simplic", monthlyRate: 17.5, annualRate: 600.0, category: "financeira", maintenanceFeeInfo: "Correspondente bancário digital" },
  { name: "Zema Financeira", monthlyRate: 10.5, annualRate: 233.1, category: "financeira", maintenanceFeeInfo: "Foco em regiões agrícolas" },
  { name: "PortoBank", monthlyRate: 6.8, annualRate: 120.4, category: "financeira", maintenanceFeeInfo: "Crédito Porto Seguro" }
];

/**
 * Busca inteligente da taxa do banco pelo nome do cartão ou dívida
 */
export function getBankRateByName(itemName: string): BankRateInfo {
  const cleanName = itemName.toLowerCase().trim();

  const found = BANK_RATES_DATABASE.find(b => {
    const bName = b.name.toLowerCase();
    return cleanName.includes(bName) || bName.includes(cleanName);
  });

  if (found) return found;

  // Trata sinônimos comuns
  if (cleanName.includes("bb") || cleanName.includes("brasil")) {
    return BANK_RATES_DATABASE.find(b => b.name === "Banco do Brasil")!;
  }
  if (cleanName.includes("caixa") || cleanName.includes("cef")) {
    return BANK_RATES_DATABASE.find(b => b.name === "Caixa Econômica")!;
  }
  if (cleanName.includes("itau") || cleanName.includes("itaú")) {
    return BANK_RATES_DATABASE.find(b => b.name === "Itaú Unibanco")!;
  }
  if (cleanName.includes("nu") || cleanName.includes("roxinho")) {
    return BANK_RATES_DATABASE.find(b => b.name === "Nubank")!;
  }
  if (cleanName.includes("inter")) {
    return BANK_RATES_DATABASE.find(b => b.name === "Banco Inter")!;
  }

  // Fallback para taxa média geral do mercado (12.5% a.m.)
  return {
    name: itemName || "Instituição Financeira",
    monthlyRate: 12.5,
    annualRate: 310.0,
    category: "fintech",
    maintenanceFeeInfo: "Consultar condições junto à instituição"
  };
}

/**
 * Calcula a simulação de renegociação bancária respeitando a trava de 100% max do Banco Central
 */
export interface NegotiationSimulationResult {
  bankInfo: BankRateInfo;
  originalDebtAmount: number;
  entryAmount: number;
  financedAmount: number;
  numberOfInstallments: number;
  monthlyInstallmentValue: number;
  totalWithInterest: number;
  totalInterestCharged: number;
  isCappedByBacenLaw: boolean; // Se atingiu a trava legal de 100% de juros max da Lei 14.690/23
}

export function calculateBankNegotiation({
  itemName,
  debtAmount,
  customEntry,
  installmentsCount = 12
}: {
  itemName: string;
  debtAmount: number;
  customEntry?: number;
  installmentsCount?: number;
}): NegotiationSimulationResult {
  const bankInfo = getBankRateByName(itemName);

  // Entrada sugerida: Mínimo 10% da dívida ou customEntry se informado
  const minEntry = Math.round(debtAmount * 0.10 * 100) / 100;
  const entryAmount = customEntry !== undefined ? Math.max(0, Math.min(debtAmount, customEntry)) : minEntry;
  const financedAmount = Math.max(0, debtAmount - entryAmount);

  // Cálculo da parcela no sistema Price com taxa de juros negociada (desconto padrão de renegociação de 40% sobre o rotativo)
  const negotiatedMonthlyRate = (bankInfo.monthlyRate * 0.60) / 100; // Ex: 12.5% vira 7.5% a.m. na renegociação

  let rawTotalInterest = 0;
  let installmentValue = 0;

  if (financedAmount > 0 && installmentsCount > 0) {
    if (negotiatedMonthlyRate > 0) {
      installmentValue = (financedAmount * negotiatedMonthlyRate * Math.pow(1 + negotiatedMonthlyRate, installmentsCount)) /
                         (Math.pow(1 + negotiatedMonthlyRate, installmentsCount) - 1);
    } else {
      installmentValue = financedAmount / installmentsCount;
    }

    rawTotalInterest = (installmentValue * installmentsCount) - financedAmount;
  }

  // TRAVA DO BANCO CENTRAL DO BRASIL (Lei 14.690/2023 - Teto máximo de 100% sobre o saldo devedor original)
  const maxAllowedInterest = financedAmount; // Máximo 100% de juros acumulados
  let isCappedByBacenLaw = false;
  let finalInterest = rawTotalInterest;

  if (rawTotalInterest > maxAllowedInterest) {
    finalInterest = maxAllowedInterest;
    isCappedByBacenLaw = true;
    installmentValue = (financedAmount + finalInterest) / installmentsCount;
  }

  const totalWithInterest = financedAmount + finalInterest;

  return {
    bankInfo,
    originalDebtAmount: debtAmount,
    entryAmount,
    financedAmount,
    numberOfInstallments: installmentsCount,
    monthlyInstallmentValue: Math.round(installmentValue * 100) / 100,
    totalWithInterest: Math.round(totalWithInterest * 100) / 100,
    totalInterestCharged: Math.round(finalInterest * 100) / 100,
    isCappedByBacenLaw
  };
}
