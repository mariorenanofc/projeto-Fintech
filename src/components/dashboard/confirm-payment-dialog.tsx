import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, TrendingDown, TrendingUp } from "lucide-react";
import { Bill } from "@/types";

interface ConfirmPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  bill: Bill | null;
  actualAmountPaid: number;
  setActualAmountPaid: (amount: number) => void;
  onConfirm: () => void;
}

export function ConfirmPaymentDialog({
  isOpen,
  onClose,
  bill,
  actualAmountPaid,
  setActualAmountPaid,
  onConfirm,
}: ConfirmPaymentDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-zinc-950 border border-white/10 shadow-2xl sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            Confirmar Pagamento
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-xs mt-2">
            Você está confirmando o pagamento de <strong>{bill?.title}</strong>. 
            Ajuste o valor abaixo se você pagou um valor diferente do planejado (isso nos ajuda a calcular sua economia).
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2 block">
            Valor Real Pago (R$)
          </label>
          <input
            type="number"
            step="0.01"
            value={actualAmountPaid}
            onChange={(e) => setActualAmountPaid(Number(e.target.value))}
            className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50"
          />
          {bill && actualAmountPaid < bill.amount && (
            <p className="text-xs text-emerald-400 mt-3 font-bold flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg">
              <TrendingDown className="w-4 h-4" />
              Economia de R$ {(bill.amount - actualAmountPaid).toFixed(2)}! 🎉
            </p>
          )}
          {bill && actualAmountPaid > bill.amount && (
            <p className="text-xs text-rose-400 mt-3 font-bold flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 p-2 rounded-lg">
              <TrendingUp className="w-4 h-4" />
              Extrapolou R$ {(actualAmountPaid - bill.amount).toFixed(2)} do planejado.
            </p>
          )}
        </div>
        <DialogFooter className="flex gap-2">
          <Button variant="ghost" onClick={onClose} className="text-zinc-400 hover:text-white rounded-xl">
            Cancelar
          </Button>
          <Button onClick={onConfirm} className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-xl">
            Confirmar Pagamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
