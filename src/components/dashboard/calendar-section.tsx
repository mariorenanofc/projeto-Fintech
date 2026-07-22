import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, CheckCircle2, MoreHorizontal, CalendarPlus, Undo2, Info } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ptBR } from "date-fns/locale";
import { Bill } from "@/types";

interface CalendarSectionProps {
  selectedDate: Date | undefined;
  handleDateSelect: (date: Date | undefined) => void;
  selectedDateBills: Bill[];
  allBills?: Bill[];
  hasBillOnDay: (date: Date) => boolean;
  mounted: boolean;
  handleSyncGoogleCalendar: (bill: Bill) => void;
  openConfirmModal: (bill: Bill) => void;
  handleUndoPayment: (transactionId: string) => void;
  onMonthChange?: (monthDate: Date) => void;
}

import { TiltCard } from "@/components/ui/tilt-card";

export function CalendarSection({
  selectedDate,
  handleDateSelect,
  selectedDateBills,
  allBills = [],
  hasBillOnDay,
  mounted,
  handleSyncGoogleCalendar,
  openConfirmModal,
  handleUndoPayment,
  onMonthChange,
}: CalendarSectionProps) {
  // Calculo de contas pendentes a vencer nos próximos 3 dias
  const todayStr = new Date().toISOString().substring(0, 10);
  const in3DaysDate = new Date();
  in3DaysDate.setDate(in3DaysDate.getDate() + 3);
  const in3DaysStr = in3DaysDate.toISOString().substring(0, 10);

  const upcomingBills = allBills.filter(
    b => b.status === "pending" && b.dueDate >= todayStr && b.dueDate <= in3DaysStr
  );
  const upcomingBillsTotal = upcomingBills.reduce((sum, b) => sum + b.amount, 0);

  return (
    <section className="w-full mt-6">
      <TiltCard glowColor="rgba(234, 179, 8, 0.15)" className="space-y-4" disableTilt={true}>
        <div className="flex flex-col border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-yellow-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Nosso Calendário de Vencimentos 📅</h3>
          </div>
          <p className="text-[10px] text-zinc-500 mt-1">Escolham um dia para acompanhar o fluxo das nossas contas juntos</p>
        </div>
        
        <div className="space-y-4 pt-1">
          {upcomingBills.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/25 p-3.5 rounded-xl flex items-center justify-between gap-3 mb-4 text-xs font-semibold text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
              <div className="flex items-center gap-2.5">
                <CalendarIcon className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                <span>
                  Atenção, casal: <strong className="text-amber-200 font-extrabold">{upcomingBills.length} {upcomingBills.length === 1 ? 'conta vence' : 'contas vencem'} nos próximos 3 dias</strong> (Total: R$ {upcomingBillsTotal.toFixed(2)})!
                </span>
              </div>
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[9px] uppercase font-black px-2.5 py-0.5 shrink-0 hidden xs:inline-flex">
                Vencimento Próximo ⚠️
              </Badge>
            </div>
          )}

          <div className="flex flex-col gap-8 lg:gap-12 lg:flex-row lg:items-stretch w-full mt-2 h-full">
            
            {/* Calendário */}
            <div className="w-full lg:w-[58%] min-w-[340px] bg-zinc-950/50 p-4 sm:p-6 rounded-xl border border-white/5 flex flex-col justify-center items-center shadow-inner min-h-[360px]">
              {mounted ? (
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  onMonthChange={onMonthChange}
                  locale={ptBR}
                  className="rounded-md text-zinc-100"
                  modifiers={{
                    hasBill: (date) => hasBillOnDay(date)
                  }}
                  modifiersClassNames={{
                    hasBill: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-yellow-500"
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 text-zinc-500 animate-pulse">
                  <CalendarIcon className="w-8 h-8 opacity-20" />
                  <span className="text-xs font-bold uppercase tracking-wider opacity-50">Carregando Agenda...</span>
                </div>
              )}
            </div>

            {/* Lista de Contas */}
            <div className="w-full lg:w-[42%] flex-1 bg-zinc-950/50 p-4 sm:p-6 rounded-xl border border-white/5 flex flex-col min-h-[360px]">
              <div className="flex justify-between items-center pb-2 border-b border-white/5 mb-4">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Nosso plano para este dia:
                </h4>
                <Badge variant="outline" className="border-yellow-500/25 text-yellow-400 bg-yellow-950/10 text-[9px] font-bold">
                  {selectedDate ? selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }) : 'Data'}
                </Badge>
              </div>

              <div className="flex-1 flex flex-col justify-between">
                {selectedDateBills.length > 0 ? (
                  <div className="space-y-3 pr-1">
                    {selectedDateBills.map((bill) => (
                      <div 
                        key={bill.id}
                        className="flex flex-col bg-zinc-950/40 p-4 rounded-xl border border-white/5 hover:border-zinc-800 transition-all duration-300"
                      >
                        <div className="mb-3">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <Badge className="bg-zinc-900 text-zinc-400 border border-white/5 text-[7px] uppercase font-bold py-0">{bill.category}</Badge>
                            {bill.status === "paid" && (
                              <>
                                {bill.isIndividual ? (
                                  <Badge className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-[7px] uppercase font-bold py-0">Pessoal</Badge>
                                ) : (
                                  <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[7px] uppercase font-bold py-0">Conjunto</Badge>
                                )}
                                {bill.paidBy && (
                                  <span className="text-[8px] text-zinc-500 font-semibold">
                                    por {bill.paidBy}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                          <h5 className="text-xs font-bold text-zinc-200 block">{bill.title}</h5>
                        </div>
                        
                        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3">
                          <div className="text-left">
                            {bill.status === "paid" ? (
                              <div className="flex flex-col">
                                <span className="text-xs text-emerald-400 font-black">R$ {bill.paidAmount?.toFixed(2)} Pago</span>
                                {bill.paidAmount !== bill.amount && (
                                  <span className="text-[9px] text-zinc-550 line-through">R$ {bill.amount.toFixed(2)}</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm font-black text-white block">R$ {bill.amount.toFixed(2)}</span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {bill.status === "pending" ? (
                              <>
                                <Badge variant="outline" className="border-yellow-500/20 text-yellow-400 bg-yellow-950/10 text-[9px] uppercase font-black px-2 py-0.5 hidden xs:inline-flex">
                                  Aguardando
                                </Badge>
                                <DropdownMenu>
                                  <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-8 px-3 bg-zinc-900 border-white/10 hover:bg-zinc-800 text-zinc-300 rounded-lg" />}>
                                    Ações <MoreHorizontal className="w-3.5 h-3.5 ml-1.5" />
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48 bg-zinc-900 border border-white/10 shadow-xl rounded-xl">
                                    <DropdownMenuItem onClick={() => handleSyncGoogleCalendar(bill)} className="text-xs focus:bg-zinc-800 focus:text-white cursor-pointer rounded-lg p-2 m-1">
                                      <CalendarPlus className="w-3.5 h-3.5 mr-2 text-blue-400" />
                                      Agendar no Google
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openConfirmModal(bill)} className="text-xs focus:bg-emerald-500/20 focus:text-emerald-400 cursor-pointer font-bold rounded-lg p-2 m-1">
                                      <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-emerald-500" />
                                      Confirmar Pagamento
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </>
                            ) : (
                              <>
                                <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] uppercase font-black px-2 py-0.5">
                                  Pago ✓
                                </Badge>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => bill.transactionId && handleUndoPayment(bill.transactionId)}
                                  className="h-8 px-2 text-zinc-550 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"
                                  title="Desfazer Pagamento"
                                >
                                  <Undo2 className="w-3.5 h-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-6 px-4 bg-zinc-950/10 rounded-xl border border-dashed border-white/5">
                    <Info className="w-6 h-6 text-zinc-650 mb-2" />
                    <p className="text-xs text-zinc-500 font-medium text-center">Tudo em paz! Nenhuma conta vencendo hoje. Aproveitem! 🎉</p>
                    <p className="text-[9px] text-zinc-650 mt-1.5 text-center">Dica: Dias marcados com bolinhas amarelas indicam contas programadas.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </TiltCard>
    </section>
  );
}
