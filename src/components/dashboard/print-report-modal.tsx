"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Calendar, FileText, CheckCircle2, AlertTriangle, Sparkles } from "lucide-react";
import { FinancialStrategyResult, GoalInput } from "@/actions/onboarding";
import { Bill } from "@/types";

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  strategy: FinancialStrategyResult | null;
  bills: Bill[];
  rawCards: any[];
  rawDebts: any[];
  goals: GoalInput[];
  selectedMonthStr: string;
  getReadableMonthLabel: (m: string) => string;
}

export function PrintReportModal({
  isOpen,
  onClose,
  strategy,
  bills,
  rawCards,
  rawDebts,
  goals,
  selectedMonthStr,
  getReadableMonthLabel
}: PrintReportModalProps) {
  const [reportType, setReportType] = useState<"mensal" | "anual">("mensal");

  const handlePrint = () => {
    window.print();
  };

  if (!strategy) return null;

  const totalIncomes = strategy.totalIncome;
  const totalEssentials = strategy.totalEssentialExpenses;
  const totalCommitments = strategy.totalDebtInstallments + strategy.totalCreditCardInvoices;
  const netResidue = strategy.disposableIncomeForDebts;
  const tetoDiario = strategy.lazerTravaValue > 0 ? (strategy.lazerTravaValue / 30).toFixed(2) : "0,00";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-950 border-white/10 text-zinc-100 w-[95vw] md:w-[85vw] sm:max-w-4xl md:max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
        {/* CABEÇALHO DO MODAL (Não impresso) */}
        <DialogHeader className="print:hidden space-y-2 border-b border-white/10 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-yellow-400" />
              <DialogTitle className="text-base font-black text-white">
                Imprimir Plano de Ação da Geladeira 🖨️
              </DialogTitle>
            </div>
            <div className="flex gap-2">
              <Button
                variant={reportType === "mensal" ? "default" : "outline"}
                onClick={() => setReportType("mensal")}
                className={`h-8 text-xs font-bold rounded-lg ${
                  reportType === "mensal"
                    ? "bg-yellow-500 text-zinc-950 hover:bg-yellow-400"
                    : "bg-zinc-900 text-zinc-300 border-white/10"
                }`}
              >
                Relatório Mensal
              </Button>
              <Button
                variant={reportType === "anual" ? "default" : "outline"}
                onClick={() => setReportType("anual")}
                className={`h-8 text-xs font-bold rounded-lg ${
                  reportType === "anual"
                    ? "bg-yellow-500 text-zinc-950 hover:bg-yellow-400"
                    : "bg-zinc-900 text-zinc-300 border-white/10"
                }`}
              >
                Planejamento Anual (12M)
              </Button>
            </div>
          </div>
          <DialogDescription className="text-xs text-zinc-400 font-medium">
            Formato otimizado em alta definição para papel A4. Imprimam e colem na geladeira para manter a sintonia diária!
          </DialogDescription>
        </DialogHeader>

        {/* ===================================================================== */}
        {/* DOCUMENTO IMPRESSO (Visível na tela e estilizado para impressora) */}
        {/* ===================================================================== */}
        <div className="my-2 p-6 bg-white text-zinc-950 rounded-xl border border-zinc-300 print:border-none print:p-0 print:m-0 font-sans shadow-lg">
          
          {/* Cabeçalho Oficial do Relatório */}
          <div className="border-b-2 border-zinc-900 pb-4 mb-4 flex justify-between items-end">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-zinc-950 uppercase">Fintech Casal 💛</span>
                <span className="bg-zinc-100 text-zinc-800 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border border-zinc-300">
                  {reportType === "mensal" ? `Relatório Mensal • ${getReadableMonthLabel(selectedMonthStr)}` : "Planejamento Anual 12 Meses"}
                </span>
              </div>
              <p className="text-xs text-zinc-600 font-semibold mt-1">
                Plano de Ação Financeiro Conjugal • Orientação Diária de Cozinha
              </p>
            </div>
            <div className="text-right text-[10px] text-zinc-500 font-bold">
              Impresso em: {new Date().toLocaleDateString("pt-BR")}
            </div>
          </div>

          {/* Destaque da Regra dos 5 Segundos (Teto Diário & Semáforo) */}
          <div className="grid grid-cols-3 gap-3 mb-6 p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
            <div className="text-center border-r border-zinc-200 pr-2">
              <span className="text-[9px] text-zinc-500 uppercase font-black block">Status Financeiro</span>
              <span className={`text-sm font-black uppercase mt-1 block ${
                strategy.financialStage === "green" ? "text-emerald-700" :
                strategy.financialStage === "yellow" ? "text-amber-600" : "text-rose-700"
              }`}>
                {strategy.financialStage === "green" ? "🟢 Verde (Prosperidade)" :
                 strategy.financialStage === "yellow" ? "🟡 Amarelo (Segurança)" : "🔴 Vermelho (Resgate)"}
              </span>
            </div>

            <div className="text-center border-r border-zinc-200 px-2">
              <span className="text-[9px] text-zinc-500 uppercase font-black block">Nosso Teto Diário</span>
              <span className="text-base font-black text-amber-600 font-mono mt-0.5 block">
                R$ {tetoDiario} /dia
              </span>
            </div>

            <div className="text-center pl-2">
              <span className="text-[9px] text-zinc-500 uppercase font-black block">Sobra Líquida Prevista</span>
              <span className={`text-base font-black font-mono mt-0.5 block ${netResidue >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                R$ {netResidue.toFixed(2)}
              </span>
            </div>
          </div>

          {/* RELATÓRIO MENSAL */}
          {reportType === "mensal" ? (
            <div className="space-y-6">
              {/* Tabela Comparativa de Receitas vs Despesas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-zinc-200 rounded-lg p-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800 border-b border-zinc-200 pb-1 mb-2">
                    Receitas da Família (Total: R$ {totalIncomes.toFixed(2)})
                  </h4>
                  <ul className="space-y-1.5 text-xs">
                    {bills.filter(b => b.category.includes("Receita") || b.amount > 0 && !b.category.includes("Cartão") && !b.category.includes("Financiamento")).map((b, i) => (
                      <li key={i} className="flex justify-between items-center text-zinc-800">
                        <span className="font-semibold">{b.title}</span>
                        <span className="font-bold text-emerald-700">R$ {b.amount.toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border border-zinc-200 rounded-lg p-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-rose-800 border-b border-zinc-200 pb-1 mb-2">
                    Compromissos do Mês (Total: R$ {(totalEssentials + totalCommitments).toFixed(2)})
                  </h4>
                  <ul className="space-y-1.5 text-xs">
                    <li className="flex justify-between items-center text-zinc-800">
                      <span className="font-semibold">Gastos Essenciais Fixos</span>
                      <span className="font-bold text-zinc-900">R$ {totalEssentials.toFixed(2)}</span>
                    </li>
                    <li className="flex justify-between items-center text-zinc-800">
                      <span className="font-semibold">Parcelas de Dívidas & Cartões</span>
                      <span className="font-bold text-rose-700">R$ {totalCommitments.toFixed(2)}</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Relação Completa de Contas Programadas */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 border-b-2 border-zinc-900 pb-1 mb-3">
                  Relação Completa de Contas & Vencimentos ({getReadableMonthLabel(selectedMonthStr)})
                </h4>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-100 text-zinc-700 font-bold uppercase text-[9px] border-b border-zinc-300">
                      <th className="p-2">Data Venc.</th>
                      <th className="p-2">Descrição da Conta</th>
                      <th className="p-2">Categoria</th>
                      <th className="p-2 text-right">Valor (R$)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.map((b, idx) => {
                      const cleanTitle = b.title.replace(/\s*\[close:\d+\]/, "").replace(/\s*\[due:\d+\]/, "").replace(/\s*\[next:[^\]]+\]/, "").replace(/\s*\[rec:\d+\]/, "");
                      return (
                        <tr key={idx} className="border-b border-zinc-200 text-zinc-800 hover:bg-zinc-50">
                          <td className="p-2 font-mono font-bold">
                            {b.dueDate.split("-").reverse().join("/")}
                          </td>
                          <td className="p-2 font-semibold">{cleanTitle}</td>
                          <td className="p-2 text-[10px] text-zinc-600">{b.category}</td>
                          <td className="p-2 text-right font-black text-zinc-900">
                            R$ {b.amount.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Engenharia Financeira & Plano de Ação */}
              {strategy.financialStage === "red" && (
                <div className="border border-amber-300 bg-amber-50 p-4 rounded-xl space-y-2">
                  <h4 className="text-xs font-black uppercase text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                    Engenharia Financeira • Ações Prioritárias do Casal
                  </h4>
                  <ul className="space-y-1.5 text-xs text-amber-950 font-medium">
                    {strategy.cardActions.map((c, i) => {
                      const cleanCard = c.cardName.replace(/\s*\[close:\d+\]/, "").replace(/\s*\[due:\d+\]/, "");
                      return (
                        <li key={i} className="list-disc list-inside">
                          <strong>{cleanCard}:</strong> {c.recommendation}
                        </li>
                      );
                    })}
                    {strategy.debtActions.map((d, i) => {
                      const cleanDebt = d.debtTitle.replace(/\s*\[due:\d+\]/, "").replace(/\s*\[next:[^\]]+\]/, "");
                      return (
                        <li key={i} className="list-disc list-inside">
                          <strong>{cleanDebt}:</strong> {d.recommendation}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            /* RELATÓRIO ANUAL (12 MESES) */
            <div className="space-y-6">
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 border-b-2 border-zinc-900 pb-1 mb-3">
                Planejamento Estratégico de Evolução Financeira (Próximos 12 Meses)
              </h4>
              <p className="text-xs text-zinc-700 leading-relaxed font-medium mb-4">
                Projeção matemática baseada no plano de choque, evolução de quitação de dívidas tóxicas e consolidação do fundo de reserva da família.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="border border-zinc-200 p-3 rounded-lg bg-zinc-50">
                  <span className="text-[10px] text-zinc-500 font-extrabold uppercase block">Meta de Reserva Financeira</span>
                  <span className="text-base font-black text-emerald-700 mt-1 block font-mono">
                    R$ {strategy.reservaMeta.toFixed(2)}
                  </span>
                  <span className="text-[9px] text-zinc-600 block mt-1">Fundo equivalente a 3 meses de despesas essenciais</span>
                </div>

                <div className="border border-zinc-200 p-3 rounded-lg bg-zinc-50">
                  <span className="text-[10px] text-zinc-500 font-extrabold uppercase block">Estágio Projetado para o 12º Mês</span>
                  <span className="text-base font-black text-amber-700 mt-1 block uppercase">
                    Fase Verde (Prosperidade) 🟢
                  </span>
                  <span className="text-[9px] text-zinc-600 block mt-1">Quitação total das dívidas tóxicas e início dos aportes em investimentos</span>
                </div>
              </div>

              <div className="border border-zinc-200 p-4 rounded-xl bg-zinc-50 space-y-2">
                <h5 className="text-xs font-black text-zinc-900 uppercase">Regras de Sobrevivência Familiar:</h5>
                <ol className="list-decimal list-inside space-y-1 text-xs text-zinc-800 font-semibold">
                  <li>Respeitar estritamente o Teto Diário máximo de R$ {tetoDiario}.</li>
                  <li>Não realizar novas compras parceladas ou usar o cartão de crédito em modo rotativo.</li>
                  <li>Toda economia ou receita extra deve ser direcionada para a quitação acelerada das faturas negociadas.</li>
                </ol>
              </div>
            </div>
          )}

          {/* Rodapé de Instrução para a Geladeira */}
          <div className="mt-8 pt-4 border-t-2 border-dashed border-zinc-300 text-center text-zinc-600">
            <p className="text-[10px] font-bold uppercase tracking-wider">
              📌 Colem esta folha na porta da geladeira ou parede da cozinha!
            </p>
            <p className="text-[9px] text-zinc-500 mt-0.5">
              Revisem juntos todos os dias antes de tomar decisões de compras. A disciplina em dupla constrói a liberdade financeira do casal.
            </p>
          </div>
        </div>

        {/* RODAPÉ DO MODAL (Não impresso) */}
        <DialogFooter className="print:hidden flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 bg-zinc-900 border-white/10 text-zinc-300 font-bold text-xs h-11 rounded-xl"
          >
            Fechar
          </Button>
          <Button
            type="button"
            onClick={handlePrint}
            className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-black text-xs h-11 rounded-xl shadow-[0_0_15px_rgba(234,179,8,0.3)] flex items-center justify-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            Imprimir Agora 🖨️
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
