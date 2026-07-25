import { roundMoney, sumMoney } from "./money";

export interface ComparisonDetailItem {
  id: string;
  title: string;
  amount: number;
  date: string;
  type: "direct" | "installment" | "debt";
}

export interface CategoryComparison {
  category: string;
  planned: number;
  actual: number;
  percent: number;
  status: "ok" | "warning" | "over";
  items: ComparisonDetailItem[];
}

/**
 * Compara as despesas planejadas (orçamentos por categoria) com os gastos reais
 * (transações diretas, parcelas de faturas e parcelas de dívida) na competência de análise.
 */
export function comparePlannedVersusRealized(params: {
  plannedExpenses: Array<{ category: string; amount: number }>;
  directTransactions: Array<{ id: string; category: string; amount: number; description: string; date: string }>;
  cardInstallments: Array<{ id: string; category: string; amount: number; description: string; date: string }>;
  debtInstallments: Array<{ id: string; category: string; amount: number; description: string; date: string }>;
}): CategoryComparison[] {
  const { plannedExpenses, directTransactions, cardInstallments, debtInstallments } = params;

  // 1. Agrupar planejados por categoria
  const plannedMap = new Map<string, number>();
  plannedExpenses.forEach(pe => {
    const cat = pe.category || "Geral";
    const current = plannedMap.get(cat) || 0;
    plannedMap.set(cat, roundMoney(current + Number(pe.amount)));
  });

  // 2. Agrupar reais por categoria e rastrear transações individuais
  const actualMap = new Map<string, number>();
  const itemsMap = new Map<string, ComparisonDetailItem[]>();

  const addActualItem = (cat: string, item: ComparisonDetailItem) => {
    const current = actualMap.get(cat) || 0;
    actualMap.set(cat, roundMoney(current + item.amount));

    const list = itemsMap.get(cat) || [];
    list.push(item);
    itemsMap.set(cat, list);
  };

  // Processar transações diretas
  directTransactions.forEach(dt => {
    const cat = dt.category || "Geral";
    addActualItem(cat, {
      id: dt.id,
      title: dt.description,
      amount: Number(dt.amount),
      date: dt.date,
      type: "direct"
    });
  });

  // Processar parcelas de cartão
  cardInstallments.forEach(ci => {
    const cat = ci.category || "Cartão de Crédito";
    addActualItem(cat, {
      id: ci.id,
      title: ci.description,
      amount: Number(ci.amount),
      date: ci.date,
      type: "installment"
    });
  });

  // Processar parcelas de dívida
  debtInstallments.forEach(di => {
    const cat = di.category || "Dívidas";
    addActualItem(cat, {
      id: di.id,
      title: di.description,
      amount: Number(di.amount),
      date: di.date,
      type: "debt"
    });
  });

  // 3. Unificar todas as categorias
  const allCategories = new Set([...plannedMap.keys(), ...actualMap.keys()]);
  const result: CategoryComparison[] = [];

  allCategories.forEach(cat => {
    const planned = plannedMap.get(cat) || 0;
    const actual = actualMap.get(cat) || 0;
    const items = itemsMap.get(cat) || [];

    // Ordenar itens por data (mais recente primeiro)
    items.sort((a, b) => b.date.localeCompare(a.date));

    let percent = 0;
    let status: "ok" | "warning" | "over" = "ok";

    if (planned > 0) {
      percent = roundMoney((actual / planned) * 100);
      if (percent > 100) {
        status = "over";
      } else if (percent > 80) {
        status = "warning";
      }
    } else if (actual > 0) {
      percent = 100;
      status = "over";
    }

    result.push({
      category: cat,
      planned,
      actual,
      percent,
      status,
      items
    });
  });

  // Ordenar categorias (estouros primeiro, depois warnings, depois por ordem alfabética)
  return result.sort((a, b) => {
    const score = (status: string) => (status === "over" ? 2 : status === "warning" ? 1 : 0);
    const scoreDiff = score(b.status) - score(a.status);
    if (scoreDiff !== 0) return scoreDiff;
    return a.category.localeCompare(b.category);
  });
}
