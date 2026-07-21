"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
  showDevSimulator?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  simulatedError: boolean;
}

export class FinancialErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    simulatedError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, simulatedError: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[FinancialErrorBoundary] Erro de renderização capturado:", error, errorInfo);
  }

  public resetErrorBoundary = () => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({
      hasError: false,
      error: null,
      simulatedError: false,
    });
  };

  public triggerSimulatedError = () => {
    this.setState({
      hasError: true,
      error: new Error("Falha de conexão simulada com os serviços financeiros da API."),
      simulatedError: true,
    });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Card className="w-full bg-amber-500/10 border-amber-500/30 backdrop-blur-md shadow-[0_4px_20px_rgba(245,158,11,0.1)] rounded-2xl overflow-hidden my-3">
          <CardContent className="p-5 xs:p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mb-3 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>

            <h3 className="text-sm xs:text-base font-extrabold text-amber-300 tracking-tight mb-1">
              {this.props.fallbackTitle || "Sincronização Temporariamente Indisponível"}
            </h3>

            <p className="text-xs text-zinc-300 max-w-md mb-4 leading-relaxed">
              {this.props.fallbackMessage || "Seus dados locais estão seguros. Ocorreu um atraso na comunicação com as APIs financeiras."}
            </p>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="w-full max-w-md bg-zinc-950/80 border border-amber-500/20 rounded-xl p-2.5 mb-4 text-left font-mono text-[10px] text-amber-400/90 overflow-x-auto">
                <span className="font-bold text-amber-300 block mb-0.5">[DEV MODE] Erro Detalhado:</span>
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                onClick={this.resetErrorBoundary}
                className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black h-10 px-5 rounded-xl text-xs flex items-center gap-2 shadow-[0_0_12px_rgba(245,158,11,0.3)] transition-all active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return <>{this.props.children}</>;
  }
}
