import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Calculator, Landmark, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { calculateBankNegotiation, NegotiationSimulationResult } from "@/lib/bank-rates";
import { updateCreditCard, updateDebt } from "@/actions/onboarding";
import { toast } from "sonner";

interface BankNegotiationModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemToNegotiate: {
    id: string;
    title: string;
    amount: number;
    type: "card" | "debt";
    rawItem?: any;
  } | null;
  currentResidue: number;
  onSuccess: () => void;
}

export function BankNegotiationModal({
  isOpen,
  onClose,
  itemToNegotiate,
  currentResidue,
  onSuccess
}: BankNegotiationModalProps) {
  if (!itemToNegotiate) return null;

  const suggestedMinEntry = Math.round(itemToNegotiate.amount * 0.10 * 100) / 100;
  const defaultInitialEntry = currentResidue > 0 ? Math.min(itemToNegotiate.amount, currentResidue) : suggestedMinEntry;

  const [installmentsCount, setInstallmentsCount] = useState(12);
  const [customEntry, setCustomEntry] = useState<number>(defaultInitialEntry);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && itemToNegotiate) {
      const suggested = Math.round(itemToNegotiate.amount * 0.10 * 100) / 100;
      const initial = currentResidue > 0 ? Math.min(itemToNegotiate.amount, currentResidue) : suggested;
      setCustomEntry(initial);
    }
  }, [isOpen, itemToNegotiate, currentResidue]);

  const simulation: NegotiationSimulationResult = calculateBankNegotiation({
    itemName: itemToNegotiate.title,
    debtAmount: itemToNegotiate.amount,
    customEntry,
    installmentsCount
  });

  const handleConfirmSimulation = async () => {
    try {
      setSaving(true);

      // Constrói o novo cronograma de parcelas futuras a partir do próximo mês
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      const scheduleItems = [];
      for (let i = 1; i <= simulation.numberOfInstallments; i++) {
        const targetMonth = currentMonth + i;
        const yearOffset = Math.floor((targetMonth - 1) / 12);
        const monthNum = ((targetMonth - 1) % 12) + 1;
        const monthStr = `${currentYear + yearOffset}-${String(monthNum).padStart(2, "0")}`;
        
        scheduleItems.push({
          month: monthStr,
          amount: simulation.monthlyInstallmentValue
        });
      }

      if (itemToNegotiate.type === "card" && itemToNegotiate.rawItem) {
        const raw = itemToNegotiate.rawItem;
        const res = await updateCreditCard(itemToNegotiate.id, {
          name: raw.name,
          totalLimit: raw.total_limit,
          currentInvoice: simulation.entryAmount, // Fatura do mês atual reduz para o valor da entrada
          nextInvoice: simulation.monthlyInstallmentValue,
          invoicesSchedule: scheduleItems,
          closingDay: raw.closing_day || 5,
          dueDay: raw.due_day || 15
        });

        if (res.success) {
          toast.success("Simulação salva! O plano financeiro do casal foi recalculado para os próximos meses.");
          onSuccess();
          onClose();
        } else {
          toast.error("Erro ao aplicar simulação: " + res.error);
        }
      } else if (itemToNegotiate.type === "debt" && itemToNegotiate.rawItem) {
        const raw = itemToNegotiate.rawItem;
        const res = await updateDebt(itemToNegotiate.id, {
          title: raw.title,
          acquisitionValue: raw.acquisition_value,
          totalInstallments: simulation.numberOfInstallments,
          currentInstallmentValue: simulation.monthlyInstallmentValue,
          monthlyLateInterestRate: raw.monthly_late_interest_rate,
          penaltyValue: raw.penalty_value,
          installmentsPaid: 0,
          installmentsSchedule: scheduleItems,
          overdueInstallments: 0,
          overdueValueAccumulated: 0,
          tipoDivida: raw.tipo_divida || raw.tipoDivida || "toxica",
          dueDay: raw.due_day || 10,
          nextDueDate: raw.next_due_date || ""
        });

        if (res.success) {
          toast.success("Simulação salva! O parcelamento da dívida foi atualizado no banco do casal.");
          onSuccess();
          onClose();
        } else {
          toast.error("Erro ao aplicar simulação: " + res.error);
        }
      }
    } catch (err: any) {
      toast.error("Erro ao processar simulação: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const cleanTitle = itemToNegotiate.title.replace(/\s*\[close:\d+\]/, "").replace(/\s*\[due:\d+\]/, "").replace(/\s*\[next:[^\]]+\]/, "");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-950 border-white/10 text-zinc-100 w-[95vw] md:w-[80vw] sm:max-w-4xl md:max-w-4xl max-h-[88vh] overflow-y-auto rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <DialogHeader className="space-y-2 border-b border-white/10 pb-4">
          <div className="flex items-center justify-between">
            <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-[9px] font-extrabold uppercase px-2.5 py-0.5">
              Simulador de Renegociação Bancária
            </Badge>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
              <Landmark className="w-3.5 h-3.5 text-yellow-500" />
              {simulation.bankInfo.name}
            </span>
          </div>
          <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-yellow-400" />
            Renegociar {cleanTitle}
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400 font-medium">
            Simulação calculada com as taxas médias oficiais informadas ao Banco Central ({simulation.bankInfo.monthlyRate}% a.m. na instituição).
          </DialogDescription>
        </DialogHeader>

        {/* LAYOUT RESPONSIVO: 1 Coluna em Mobile / 2 Colunas em Desktop (80% da tela) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
          
          {/* COLUNA 1: Parâmetros da Dívida e Entrada */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase text-yellow-500 tracking-wider">
              1. Dados do Contrato & Entrada
            </h4>

            {/* Quadro Resumo da Dívida Original */}
            <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 flex justify-between items-center">
              <div>
                <span className="text-[9px] text-zinc-500 uppercase font-extrabold block">Valor Atual da Fatura/Dívida</span>
                <span className="text-lg font-black text-rose-400 mt-0.5 block font-mono">
                  R$ {itemToNegotiate.amount.toFixed(2)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-zinc-500 uppercase font-extrabold block">Taxa Rotativo Média</span>
                <span className="text-xs font-bold text-yellow-400 block font-mono">
                  {simulation.bankInfo.monthlyRate}% a.m.
                </span>
                <span className="text-[8px] text-zinc-550 block">({simulation.bankInfo.annualRate}% a.a.)</span>
              </div>
            </div>

            {/* Ajuste de Entrada e Parcelas */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] text-zinc-400 font-bold uppercase block mb-1">Entrada Sugerida (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={customEntry || ""}
                  onChange={(e) => setCustomEntry(Number(e.target.value))}
                  className="bg-zinc-900 border border-white/10 rounded-xl p-2.5 text-xs text-white font-bold w-full focus:border-yellow-500 focus:outline-none"
                  placeholder="0.00"
                />
                <span className="text-[8px] text-yellow-500/80 mt-1 block font-semibold">
                  Mínimo (10%): R$ {suggestedMinEntry.toFixed(2)} | Resíduo: R$ {currentResidue.toFixed(2)}
                </span>
              </div>

              <div>
                <label className="text-[9px] text-zinc-400 font-bold uppercase block mb-1">Nº de Parcelas</label>
                <select
                  value={installmentsCount}
                  onChange={(e) => setInstallmentsCount(Number(e.target.value))}
                  className="bg-zinc-900 border border-white/10 rounded-xl p-2.5 text-xs text-white font-bold w-full focus:border-yellow-500 focus:outline-none"
                >
                  <option value={3}>3x parcelas</option>
                  <option value={6}>6x parcelas</option>
                  <option value={9}>9x parcelas</option>
                  <option value={12}>12x parcelas (Padrão)</option>
                  <option value={18}>18x parcelas</option>
                  <option value={24}>24x parcelas</option>
                  <option value={36}>36x parcelas</option>
                </select>
              </div>
            </div>

            <div className="bg-zinc-900/40 p-3 rounded-xl border border-white/5 text-[9px] text-zinc-400 leading-relaxed">
              💡 <strong>Dica da IA:</strong> Quanto maior o valor da entrada, menor será o custo final dos juros e as parcelas futuras caberão com folga no orçamento do casal.
            </div>
          </div>

          {/* COLUNA 2: Resultado da Simulação & Alerta Legal */}
          <div className="space-y-4 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-black uppercase text-yellow-500 tracking-wider mb-3">
                2. Projeção das Parcelas & Teto Bacen
              </h4>

              {/* Resultado da Simulação */}
              <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-center border-b border-yellow-500/20 pb-2.5">
                  <span className="text-[10px] text-yellow-300 font-extrabold uppercase">Nova Parcela Mensal:</span>
                  <span className="text-xl font-black text-yellow-400 font-mono">
                    {simulation.numberOfInstallments}x de R$ {simulation.monthlyInstallmentValue.toFixed(2)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-300 pt-1">
                  <div>
                    <span className="text-zinc-500 block text-[8px] uppercase font-bold">Saldo Financiado</span>
                    <span className="font-bold text-white font-mono">R$ {simulation.financedAmount.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[8px] uppercase font-bold">Total com Juros</span>
                    <span className="font-bold text-yellow-400 font-mono">R$ {simulation.totalWithInterest.toFixed(2)}</span>
                  </div>
                </div>

                {simulation.isCappedByBacenLaw && (
                  <div className="flex items-center gap-1.5 text-[9px] text-emerald-400 font-semibold pt-1 border-t border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Protegido pela Trava Legal de 100% de Juros Máximos (Lei do Banco Central nº 14.690/23).</span>
                  </div>
                )}
              </div>
            </div>

            {/* Alerta de Transparência Obrigatório */}
            <div className="bg-zinc-900/90 border border-white/5 p-3.5 rounded-xl flex items-start gap-2.5 text-[9px] text-zinc-400 leading-relaxed font-semibold">
              <AlertCircle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
              <p>
                <strong className="text-zinc-200">Aviso Transparente:</strong> Esta é uma simulação preditiva para ajudar no planejamento do casal. O app Fintech Casal não realiza cobranças reais nem altera contratos bancários. Acesse o aplicativo ou agência do <strong>{simulation.bankInfo.name}</strong> para formalizar o parcelamento oficial. Caso haja diferenças, você poderá ajustar os lançamentos na aba de transações.
              </p>
            </div>
          </div>

        </div>

        <DialogFooter className="flex gap-3 pt-2 border-t border-white/10">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 bg-zinc-900 border-white/10 text-zinc-300 font-bold text-xs h-11 rounded-xl"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirmSimulation}
            disabled={saving}
            className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-black text-xs h-11 rounded-xl shadow-[0_0_15px_rgba(234,179,8,0.3)]"
          >
            {saving ? "Salvando Plano..." : "Aplicar no Nosso Plano ⚡"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
