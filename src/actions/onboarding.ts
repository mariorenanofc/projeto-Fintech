"use server";

import { createClient } from "@/lib/supabase/server";

export interface IncomeInput {
  id?: string;
  title: string;
  amount: number;
  owner: string;
}

export interface FixedExpenseInput {
  id?: string;
  category: string;
  title: string;
  amount: number;
}

export interface CreditCardInvoiceItem {
  month: string; // Ex: "2026-08"
  amount: number;
}

export interface CreditCardInput {
  id?: string;
  name: string;
  totalLimit: number;
  currentInvoice: number;
  nextInvoice: number;
  invoicesSchedule?: CreditCardInvoiceItem[]; // Cronograma JSONB
}

export interface DebtInstallmentItem {
  month: string; // Ex: "2026-08"
  amount: number;
}

export interface DebtInput {
  id?: string;
  title: string;
  acquisitionValue: number;
  totalInstallments: number;
  currentInstallmentValue: number;
  monthlyLateInterestRate: number;
  penaltyValue: number;
  installmentsPaid: number;
  installmentsSchedule?: DebtInstallmentItem[]; // Cronograma JSONB
  overdueInstallments?: number; // Parcelas em atraso
  overdueValueAccumulated?: number; // Valor acumulado em atraso
}

export interface OnboardingData {
  incomes: IncomeInput[];
  fixedExpenses: FixedExpenseInput[];
  creditCards: CreditCardInput[];
  debts: DebtInput[];
}

export interface CardTacticalAction {
  cardName: string;
  currentInvoice: number;
  nextInvoice: number;
  suggestedProportionalPayment: number;
  recommendation: string;
}

export interface DebtNegotiationAction {
  debtTitle: string;
  installmentValue: number;
  interestRate: number;
  penaltyValue: number;
  recommendation: string;
}

export interface FinancialStrategyResult {
  hasStrategy: boolean;
  totalIncome: number;
  totalEssentialExpenses: number;
  disposableIncomeForDebts: number; // Saldo Restante
  totalDebtInstallments: number;
  remainingCashResidue: number; // Resíduo de Caixa Restante
  totalCreditCardInvoices: number;
  isChoqueRequired: boolean;
  cardActions: CardTacticalAction[];
  debtActions: DebtNegotiationAction[];
  survivalRules: {
    title: string;
    description: string;
  }[];
}

// Helper para obter o family_group_id do usuário autenticado
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
 * Server Action para salvar todos os dados de onboarding de uma só vez (fluxo inicial)
 */
export async function saveOnboardingData(data: OnboardingData) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Usuário não autenticado no Supabase.", status: 401 };
    }

    const familyGroupId = await getFamilyGroupId(supabase, user.id);

    // Limpar registros anteriores
    await supabase.from("incomes").delete().eq("family_group_id", familyGroupId);
    await supabase.from("fixed_expenses").delete().eq("family_group_id", familyGroupId);
    await supabase.from("credit_cards").delete().eq("family_group_id", familyGroupId);
    await supabase.from("debts_and_financings").delete().eq("family_group_id", familyGroupId);

    // Inserir Receitas
    if (data.incomes.length > 0) {
      const incomesToInsert = data.incomes.map(item => ({
        family_group_id: familyGroupId,
        profile_id: user.id,
        title: item.title,
        amount: item.amount,
        owner: item.owner
      }));
      const { error } = await supabase.from("incomes").insert(incomesToInsert);
      if (error) throw new Error(`Erro ao salvar receitas: ${error.message}`);
    }

    // Inserir Despesas Fixas
    if (data.fixedExpenses.length > 0) {
      const expensesToInsert = data.fixedExpenses.map(item => ({
        family_group_id: familyGroupId,
        profile_id: user.id,
        category: item.category,
        title: item.title,
        amount: item.amount
      }));
      const { error } = await supabase.from("fixed_expenses").insert(expensesToInsert);
      if (error) throw new Error(`Erro ao salvar despesas fixas: ${error.message}`);
    }

    // Inserir Cartões
    if (data.creditCards.length > 0) {
      const cardsToInsert = data.creditCards.map(item => ({
        family_group_id: familyGroupId,
        profile_id: user.id,
        name: item.name,
        total_limit: item.totalLimit,
        current_invoice: item.currentInvoice,
        next_invoice: item.nextInvoice,
        invoices_schedule: JSON.stringify(item.invoicesSchedule || [])
      }));
      const { error } = await supabase.from("credit_cards").insert(cardsToInsert);
      if (error) throw new Error(`Erro ao salvar cartões de crédito: ${error.message}`);
    }

    // Inserir Dívidas
    if (data.debts.length > 0) {
      const debtsToInsert = data.debts.map(item => ({
        family_group_id: familyGroupId,
        profile_id: user.id,
        title: item.title,
        acquisition_value: item.acquisitionValue,
        total_installments: item.totalInstallments,
        current_installment_value: item.currentInstallmentValue,
        monthly_late_interest_rate: item.monthlyLateInterestRate,
        penalty_value: item.penaltyValue,
        installments_paid: item.installmentsPaid,
        installments_schedule: JSON.stringify(item.installmentsSchedule || []),
        overdue_installments: item.overdueInstallments || 0,
        overdue_value_accumulated: item.overdueValueAccumulated || 0
      }));
      const { error } = await supabase.from("debts_and_financings").insert(debtsToInsert);
      if (error) throw new Error(`Erro ao salvar dívidas/financiamentos: ${error.message}`);
    }

    return { success: true };

  } catch (error: any) {
    console.error("Erro em saveOnboardingData:", error);
    return { success: false, error: error.message || "Erro interno do servidor." };
  }
}

/**
 * Helper para calcular o próximo mês string (Ex: "2026-08" -> "2026-09")
 */
function getNextMonthStr(monthStr: string): string {
  const [year, month] = monthStr.split("-").map(Number);
  if (month === 12) {
    return `${year + 1}-01`;
  }
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

/**
 * Server Action para ler os dados salvos e gerar o diagnóstico estratégico real e personalizado
 */
export async function generateFinancialStrategy(selectedMonth?: string): Promise<FinancialStrategyResult> {
  try {
    const supabase = await createClient();

    // 1. Validar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Usuário não autenticado.");
    }

    const familyGroupId = await getFamilyGroupId(supabase, user.id);

    // Mês atual de análise
    const currentMonthStr = selectedMonth || new Date().toISOString().substring(0, 7); 
    const nextMonthStr = getNextMonthStr(currentMonthStr);

    // 3. Buscar dados de todas as tabelas em paralelo
    const [
      incomesRes,
      expensesRes,
      cardsRes,
      debtsRes
    ] = await Promise.all([
      supabase.from("incomes").select("*").eq("family_group_id", familyGroupId),
      supabase.from("fixed_expenses").select("*").eq("family_group_id", familyGroupId),
      supabase.from("credit_cards").select("*").eq("family_group_id", familyGroupId),
      supabase.from("debts_and_financings").select("*").eq("family_group_id", familyGroupId)
    ]);

    if (incomesRes.error) throw incomesRes.error;
    if (expensesRes.error) throw expensesRes.error;
    if (cardsRes.error) throw cardsRes.error;
    if (debtsRes.error) throw debtsRes.error;

    const dbIncomes = incomesRes.data || [];
    const dbExpenses = expensesRes.data || [];
    const dbCards = cardsRes.data || [];
    const dbDebts = debtsRes.data || [];

    if (dbIncomes.length === 0 && dbExpenses.length === 0 && dbCards.length === 0 && dbDebts.length === 0) {
      return {
        hasStrategy: false,
        totalIncome: 0,
        totalEssentialExpenses: 0,
        disposableIncomeForDebts: 0,
        totalDebtInstallments: 0,
        remainingCashResidue: 0,
        totalCreditCardInvoices: 0,
        isChoqueRequired: false,
        cardActions: [],
        debtActions: [],
        survivalRules: []
      };
    }

    // PASSO A: Diagnóstico Frio
    const totalIncome = dbIncomes.reduce((sum, item) => sum + Number(item.amount), 0);
    const totalEssentialExpenses = dbExpenses.reduce((sum, item) => sum + Number(item.amount), 0);
    const disposableIncomeForDebts = totalIncome - totalEssentialExpenses; // Saldo Disponível para Dívidas

    // PASSO B: Mapeamento de Compromissos (Dívidas Fixas)
    const dbDebtsMapped = dbDebts.map(item => {
      let instVal = Number(item.current_installment_value);
      if (item.installments_schedule && Array.isArray(item.installments_schedule)) {
        const schedItem = item.installments_schedule.find((s: any) => s.month === currentMonthStr);
        if (schedItem) instVal = Number(schedItem.amount);
      }
      return { ...item, current_installment_value: instVal };
    });
    const totalDebtInstallments = dbDebtsMapped.reduce((sum, item) => sum + item.current_installment_value, 0);

    // PASSO C: Mapeamento de Compromissos (Faturas de Cartão)
    const dbCardsMapped = dbCards.map(item => {
      let invVal = Number(item.current_invoice);
      let nextInvVal = Number(item.next_invoice || 0);
      if (item.invoices_schedule && Array.isArray(item.invoices_schedule)) {
        const currItem = item.invoices_schedule.find((s: any) => s.month === currentMonthStr);
        if (currItem) invVal = Number(currItem.amount);
        const nextItem = item.invoices_schedule.find((s: any) => s.month === nextMonthStr);
        if (nextItem) nextInvVal = Number(nextItem.amount);
      }
      return { ...item, current_invoice: invVal, next_invoice: nextInvVal };
    }).sort((a, b) => a.current_invoice - b.current_invoice); // Menor para a maior fatura

    const totalCreditCardInvoices = dbCardsMapped.reduce((sum, item) => sum + item.current_invoice, 0);

    // Avaliação de Cenário
    const totalCommitments = totalDebtInstallments + totalCreditCardInvoices;
    const isChoqueRequired = totalCommitments > disposableIncomeForDebts;

    const cardActions: CardTacticalAction[] = [];
    const debtActions: DebtNegotiationAction[] = [];
    const survivalRules: { title: string; description: string }[] = [];

    let currentResidue = disposableIncomeForDebts;

    if (isChoqueRequired) {
      // OPERAÇÃO DE CHOQUE: Alocação Crítica e Engenharia Financeira
      
      // 1. Dívidas Fixas (Prioridade Máxima)
      dbDebtsMapped.forEach(debt => {
        const rate = Number(debt.monthly_late_interest_rate);
        const penalty = Number(debt.penalty_value);
        const instVal = debt.current_installment_value;
        const totalInst = Number(debt.total_installments);
        const titleLower = debt.title.toLowerCase();
        const overdueInst = Number(debt.overdue_installments || 0);
        const overdueAccum = Number(debt.overdue_value_accumulated || 0);

        let rec = "";
        if (overdueInst > 0) {
          rec = `Urgente: Vocês possuem ${overdueInst} parcelas vencidas acumuladas em R$ ${overdueAccum.toFixed(2)} com juros. Solicite a 'Incorporação de Parcelas' para jogar os atrasos para o final do contrato, limpando o CPF.`;
        } else if (titleLower.includes("lote") || titleLower.includes("terreno") || titleLower.includes("consorcio") || titleLower.includes("imovel")) {
          rec = `Pagamento da parcela normal do mês de R$ ${instVal.toFixed(2)} para manter o contrato ativo e proteger o patrimônio.`;
        } else {
          rec = `Pagamento integral da parcela (evita juros bancários).`;
        }

        debtActions.push({
          debtTitle: debt.title,
          installmentValue: instVal,
          interestRate: rate,
          penaltyValue: penalty,
          recommendation: rec
        });

        currentResidue -= instVal; // Subtrai do saldo
      });

      // 2. Faturas de Cartão (Engenharia)
      dbCardsMapped.forEach(card => {
        const invoiceVal = card.current_invoice;
        const nextInvoiceVal = card.next_invoice;

        let recText = "";
        let formattedPayment = 0;

        if (currentResidue >= invoiceVal && invoiceVal > 0) {
          // Consegue pagar integralmente
          formattedPayment = invoiceVal;
          recText = `Pagamento integral da parcela correspondente ao mês. Bloqueie o cartão para evitar novos gastos.`;
          currentResidue -= invoiceVal;
        } else {
          // Não consegue pagar integral, entra em Engenharia Financeira
          formattedPayment = Math.max(0, currentResidue); // Usa o que sobrou como entrada
          if (currentResidue > 0) {
            recText = `Bloqueie o cartão imediatamente. Utilize o resíduo de R$ ${formattedPayment.toFixed(2)} como entrada para parcelar a fatura, evitando juros rotativos descontrolados.`;
            currentResidue = 0; // Zerou o saldo
          } else {
            recText = `Saldo indisponível para entrada. Entre em contato urgente com a instituição para renegociar o saldo total com carência de 30 dias ou consolide a dívida no empréstimo pessoal. Cartão bloqueado.`;
          }
        }

        cardActions.push({
          cardName: card.name,
          currentInvoice: invoiceVal,
          nextInvoice: nextInvoiceVal,
          suggestedProportionalPayment: formattedPayment,
          recommendation: recText
        });
      });

      // 3. Regras de Sobrevivência (Agosto de Choque)
      const foodExpense = dbExpenses.find(e => e.category === "Feira/Mercado" || e.title.toLowerCase().includes("mercado") || e.title.toLowerCase().includes("feira"));
      const weeklyFoodCota = foodExpense && Number(foodExpense.amount) > 0 ? Number(foodExpense.amount) / 4 : 200;

      survivalRules.push(
        { title: "Uso Exclusivo de Débito e PIX", description: "Suspensão temporária do uso de cartões. A feira e os gastos essenciais devem ser movimentados integralmente em dinheiro vivo ou saldo em conta." },
        { title: "Suspensão de Gastos Supérfluos", description: "Compras de roupas, objetos gerais e delivery ficam totalmente suspensos. O foco total está na transição de orçamento." },
        { title: "Metas Semanais de Alimentação", description: `Revisar o saldo a cada domingo. Limite de feira semanal estipulado em R$ ${weeklyFoodCota.toFixed(2)}.` }
      );
    } else {
      // CENÁRIO SAUDÁVEL (Regra 50/30/20)
      dbDebtsMapped.forEach(debt => {
        debtActions.push({
          debtTitle: debt.title,
          installmentValue: debt.current_installment_value,
          interestRate: Number(debt.monthly_late_interest_rate),
          penaltyValue: Number(debt.penalty_value),
          recommendation: `Pagamento integral da parcela no vencimento para amortização saudável.`
        });
        currentResidue -= debt.current_installment_value;
      });

      dbCardsMapped.forEach(card => {
        cardActions.push({
          cardName: card.name,
          currentInvoice: card.current_invoice,
          nextInvoice: card.next_invoice,
          suggestedProportionalPayment: card.current_invoice,
          recommendation: `Caixa livre! Pagamento integral no vencimento para manter Score alto.`
        });
        currentResidue -= card.current_invoice;
      });

      const lifestyleTarget = totalIncome * 0.30;
      const investTarget = totalIncome * 0.20;

      survivalRules.push(
        { title: "Regra 50/30/20 (Ativa)", description: `Vocês estão no verde! Podem direcionar até R$ ${lifestyleTarget.toFixed(2)} para lazer/desejos sem culpa.` },
        { title: "Fundo de Emergência / Investimentos", description: `Destinem R$ ${investTarget.toFixed(2)} (ou o saldo livre de R$ ${currentResidue.toFixed(2)}) para a sua poupança ou corretora. O dinheiro tem que trabalhar por vocês!` }
      );
    }

    const remainingCashResidue = currentResidue; // O que sobrou após pagar as dívidas e cartões possíveis

    return {
      hasStrategy: true,
      totalIncome,
      totalEssentialExpenses,
      disposableIncomeForDebts,
      totalDebtInstallments,
      remainingCashResidue,
      totalCreditCardInvoices,
      isChoqueRequired,
      cardActions,
      debtActions,
      survivalRules
    };

  } catch (error: any) {
    console.error("Erro em generateFinancialStrategy:", error);
    return {
      hasStrategy: false,
      totalIncome: 0,
      totalEssentialExpenses: 0,
      disposableIncomeForDebts: 0,
      totalDebtInstallments: 0,
      remainingCashResidue: 0,
      totalCreditCardInvoices: 0,
      isChoqueRequired: false,
      cardActions: [],
      debtActions: [],
      survivalRules: []
    };
  }
}

// =====================================================================
// SERVER ACTIONS PARA CRUD INDIVIDUAL (TELA DE PERFIL)
// =====================================================================

// --- CRUD RECEITAS (incomes) ---
export async function addIncome(item: IncomeInput) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Não autenticado" };
    const familyGroupId = await getFamilyGroupId(supabase, user.id);

    const { error } = await supabase.from("incomes").insert({
      family_group_id: familyGroupId,
      profile_id: user.id,
      title: item.title,
      amount: item.amount,
      owner: item.owner
    });
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateIncome(id: string, item: IncomeInput) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("incomes").update({
      title: item.title,
      amount: item.amount,
      owner: item.owner
    }).eq("id", id);
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteIncome(id: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("incomes").delete().eq("id", id);
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- CRUD DESPESAS FIXAS (fixed_expenses) ---
export async function addFixedExpense(item: FixedExpenseInput) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Não autenticado" };
    const familyGroupId = await getFamilyGroupId(supabase, user.id);

    const { error } = await supabase.from("fixed_expenses").insert({
      family_group_id: familyGroupId,
      profile_id: user.id,
      category: item.category,
      title: item.title,
      amount: item.amount
    });
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateFixedExpense(id: string, item: FixedExpenseInput) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("fixed_expenses").update({
      category: item.category,
      title: item.title,
      amount: item.amount
    }).eq("id", id);
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteFixedExpense(id: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("fixed_expenses").delete().eq("id", id);
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- CRUD CARTÕES DE CRÉDITO (credit_cards) ---
export async function addCreditCard(item: CreditCardInput) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Não autenticado" };
    const familyGroupId = await getFamilyGroupId(supabase, user.id);

    const { error } = await supabase.from("credit_cards").insert({
      family_group_id: familyGroupId,
      profile_id: user.id,
      name: item.name,
      total_limit: item.totalLimit,
      current_invoice: item.currentInvoice,
      next_invoice: item.nextInvoice,
      invoices_schedule: item.invoicesSchedule || []
    });
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateCreditCard(id: string, item: CreditCardInput) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("credit_cards").update({
      name: item.name,
      total_limit: item.totalLimit,
      current_invoice: item.currentInvoice,
      next_invoice: item.nextInvoice,
      invoices_schedule: item.invoicesSchedule || []
    }).eq("id", id);
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteCreditCard(id: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("credit_cards").delete().eq("id", id);
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- CRUD DÍVIDAS E FINANCIAMENTOS (debts_and_financings) ---
export async function addDebt(item: DebtInput) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Não autenticado" };
    const familyGroupId = await getFamilyGroupId(supabase, user.id);

    const { error } = await supabase.from("debts_and_financings").insert({
      family_group_id: familyGroupId,
      profile_id: user.id,
      title: item.title,
      acquisition_value: item.acquisitionValue,
      total_installments: item.totalInstallments,
      current_installment_value: item.currentInstallmentValue,
      monthly_late_interest_rate: item.monthlyLateInterestRate,
      penalty_value: item.penaltyValue,
      installments_paid: item.installmentsPaid,
      installments_schedule: item.installmentsSchedule || [],
      overdue_installments: item.overdueInstallments || 0,
      overdue_value_accumulated: item.overdueValueAccumulated || 0
    });
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateDebt(id: string, item: DebtInput) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("debts_and_financings").update({
      title: item.title,
      acquisition_value: item.acquisitionValue,
      total_installments: item.totalInstallments,
      current_installment_value: item.currentInstallmentValue,
      monthly_late_interest_rate: item.monthlyLateInterestRate,
      penalty_value: item.penaltyValue,
      installments_paid: item.installmentsPaid,
      installments_schedule: item.installmentsSchedule || [],
      overdue_installments: item.overdueInstallments || 0,
      overdue_value_accumulated: item.overdueValueAccumulated || 0
    }).eq("id", id);
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteDebt(id: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("debts_and_financings").delete().eq("id", id);
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- BUSCADORES DE DADOS PARA TELA DE PERFIL ---
export async function getProfileFinancialData() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado");
    const familyGroupId = await getFamilyGroupId(supabase, user.id);

    const [
      incomes,
      expenses,
      cards,
      debts
    ] = await Promise.all([
      supabase.from("incomes").select("*").eq("family_group_id", familyGroupId),
      supabase.from("fixed_expenses").select("*").eq("family_group_id", familyGroupId),
      supabase.from("credit_cards").select("*").eq("family_group_id", familyGroupId),
      supabase.from("debts_and_financings").select("*").eq("family_group_id", familyGroupId)
    ]);

    return {
      success: true,
      incomes: incomes.data || [],
      fixedExpenses: expenses.data || [],
      creditCards: cards.data || [],
      debts: debts.data || []
    };
  } catch (error: any) {
    return { success: false, error: error.message, incomes: [], fixedExpenses: [], creditCards: [], debts: [] };
  }
}

/**
 * Vincula o parceiro ao mesmo grupo familiar pelo e-mail
 */
export async function linkPartnerByEmail(partnerEmail: string) {
  try {
    const supabase = await createClient();
    
    // 1. Busca usuário logado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const cleanEmail = partnerEmail.trim().toLowerCase();
    if (cleanEmail === user.email?.trim().toLowerCase()) {
      return { success: false, error: "Você não pode se vincular ao seu próprio e-mail." };
    }

    // Executa a RPC segura que roda como superuser (SECURITY DEFINER) contornando o isolamento de leitura/escrita do RLS
    const { data, error } = await supabase.rpc("link_partner_by_email", {
      partner_email: cleanEmail
    });

    if (error) {
      return { success: false, error: `Erro ao vincular: ${error.message}` };
    }

    if (!data || !data.success) {
      return { success: false, error: data?.error || "Erro desconhecido ao vincular parceiro." };
    }

    return { 
      success: true, 
      partnerName: data.partnerName || cleanEmail 
    };

  } catch (error: any) {
    return { success: false, error: error.message || "Erro interno do servidor." };
  }
}

/**
 * Busca informações do parceiro de grupo familiar vinculado (se houver)
 */
export async function getLinkedPartner() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Não autenticado" };

    const familyGroupId = await getFamilyGroupId(supabase, user.id);

    // Busca outros perfis no mesmo family_group_id
    const { data: familyProfiles, error } = await supabase
      .from("profiles")
      .select("full_name, email, avatar_url")
      .eq("family_group_id", familyGroupId)
      .neq("id", user.id); // Exclui o próprio usuário

    if (error) throw error;

    return {
      success: true,
      partners: familyProfiles || []
    };

  } catch (error: any) {
    return { success: false, error: error.message, partners: [] };
  }
}
