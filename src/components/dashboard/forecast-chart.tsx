"use client";

import React, { useState } from "react";
import { ForecastMonthData } from "@/actions/forecast";

interface ForecastChartProps {
  data: ForecastMonthData[];
  selectedMonthIndex: number;
  onSelectMonth: (index: number) => void;
}

export function ForecastChart({ data, selectedMonthIndex, onSelectMonth }: ForecastChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  // Encontra o valor máximo para escalonamento Y do gráfico em SVG
  const maxVal = Math.max(
    ...data.map(d => Math.max(d.projectedReserve, (d.toxicDebts + d.structuralDebts), d.projectedInvestments, d.income, 1000))
  ) * 1.15;

  const width = 800;
  const height = 260;
  const paddingX = 40;
  const paddingY = 30;
  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  const stepX = chartW / (data.length - 1);

  // Helper para converter coordenada de valor para coordenada Y em SVG
  const getY = (val: number) => {
    const ratio = Math.max(0, val) / maxVal;
    return paddingY + chartH * (1 - ratio);
  };

  // Pontos das linhas
  const reservePoints = data.map((d, i) => `${paddingX + i * stepX},${getY(d.projectedReserve)}`).join(" ");
  const debtPoints = data.map((d, i) => `${paddingX + i * stepX},${getY(d.toxicDebts + d.structuralDebts)}`).join(" ");
  const investPoints = data.map((d, i) => `${paddingX + i * stepX},${getY(d.projectedInvestments)}`).join(" ");

  // Path de Área para Reserva (Verde)
  const reserveAreaPath = `
    M ${paddingX},${paddingY + chartH}
    L ${reservePoints.split(" ")[0]}
    ${reservePoints.split(" ").map(p => `L ${p}`).join(" ")}
    L ${paddingX + (data.length - 1) * stepX},${paddingY + chartH}
    Z
  `;

  // Path de Área para Dívidas (Vermelho)
  const debtAreaPath = `
    M ${paddingX},${paddingY + chartH}
    L ${debtPoints.split(" ")[0]}
    ${debtPoints.split(" ").map(p => `L ${p}`).join(" ")}
    L ${paddingX + (data.length - 1) * stepX},${paddingY + chartH}
    Z
  `;

  const activeData = hoveredIndex !== null ? data[hoveredIndex] : data[selectedMonthIndex - 1] || data[0];

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Legenda do Gráfico */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-zinc-950/60 p-3 rounded-xl border border-white/5">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 font-bold text-emerald-400">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            Reserva de Emergência
          </div>
          <div className="flex items-center gap-1.5 font-bold text-rose-400">
            <span className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
            Compromissos / Parcelas do Mês
          </div>
          <div className="flex items-center gap-1.5 font-bold text-amber-300">
            <span className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
            Investimentos Acumulados
          </div>
        </div>

        <div className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
          Clique em um mês para detalhar
        </div>
      </div>

      {/* Gráfico Interativo Responsivo em SVG */}
      <div className="relative w-full bg-zinc-900/40 border border-white/5 rounded-2xl p-2 xs:p-4 backdrop-blur-md overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id="reserveGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="debtGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Linhas de Grade de Fundo */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = paddingY + chartH * ratio;
            const val = maxVal * (1 - ratio);
            return (
              <g key={idx}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="rgba(255,255,255,0.04)"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 6}
                  y={y + 3}
                  textAnchor="end"
                  fill="#71717a"
                  fontSize="9"
                  fontWeight="600"
                >
                  R${Math.round(val / 1000)}k
                </text>
              </g>
            );
          })}

          {/* Áreas Coloridas */}
          <path d={reserveAreaPath} fill="url(#reserveGrad)" />
          <path d={debtAreaPath} fill="url(#debtGrad)" />

          {/* Linha de Dívidas (Rosa/Red) */}
          <polyline
            fill="none"
            stroke="#f43f5e"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={debtPoints}
          />

          {/* Linha de Reserva (Verde/Emerald) */}
          <polyline
            fill="none"
            stroke="#10b981"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={reservePoints}
          />

          {/* Linha de Investimentos (Amarelo/Amber) */}
          <polyline
            fill="none"
            stroke="#fbbf24"
            strokeWidth="2.5"
            strokeDasharray="5 5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={investPoints}
          />

          {/* Colunas Interativas / Indicador por Mês */}
          {data.map((d, i) => {
            const cx = paddingX + i * stepX;
            const isSelected = (i + 1) === selectedMonthIndex;
            const isHovered = i === hoveredIndex;

            return (
              <g
                key={i}
                className="cursor-pointer group"
                onClick={() => onSelectMonth(i + 1)}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Faixa de destaque ao passar o mouse ou selecionar */}
                {(isSelected || isHovered) && (
                  <rect
                    x={cx - stepX / 2.2}
                    y={paddingY}
                    width={stepX * 0.9}
                    height={chartH}
                    fill={isSelected ? "rgba(234,179,8,0.12)" : "rgba(255,255,255,0.03)"}
                    rx="6"
                  />
                )}

                {/* Ponto na Linha de Reserva */}
                <circle
                  cx={cx}
                  cy={getY(d.projectedReserve)}
                  r={isSelected ? "6" : "4"}
                  fill="#10b981"
                  stroke="#09090b"
                  strokeWidth="2"
                />

                {/* Ponto na Linha de Dívidas */}
                {(d.toxicDebts + d.structuralDebts) > 0 && (
                  <circle
                    cx={cx}
                    cy={getY(d.toxicDebts + d.structuralDebts)}
                    r={isSelected ? "5" : "3.5"}
                    fill="#f43f5e"
                    stroke="#09090b"
                    strokeWidth="2"
                  />
                )}

                {/* Rótulo dos Meses no Eixo X */}
                <text
                  x={cx}
                  y={height - 8}
                  textAnchor="middle"
                  fill={isSelected ? "#eab308" : "#a1a1aa"}
                  fontSize={isSelected ? "10" : "9"}
                  fontWeight={isSelected ? "900" : "600"}
                >
                  {d.monthShortLabel || `Mês ${d.monthIndex}`}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Card Informativo com Valores do Mês em Foco */}
        {activeData && (
          <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between text-xs gap-2">
            <span className="font-bold text-yellow-400">
              {activeData.monthLabel} (Mês {activeData.monthIndex}):
            </span>
            <div className="flex gap-4 font-semibold text-[11px]">
              <span className="text-emerald-400">
                Reserva: R$ {activeData.projectedReserve.toLocaleString("pt-BR")}
              </span>
              <span className="text-rose-400">
                Dívidas: R$ {(activeData.toxicDebts + activeData.structuralDebts).toLocaleString("pt-BR")}
              </span>
              <span className="text-amber-300">
                Foco/Invest.: R$ {activeData.focusValue.toLocaleString("pt-BR")}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
